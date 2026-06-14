import { Router } from "express";
import Stripe from "stripe";
import { Types } from "mongoose";
import {
  WorkspaceSubscription,
  Workspace,
  WorkspaceMember,
} from "@workspace/db";
import {
  requirePermission,
  requireWorkspaceMember,
  type AuthenticatedRequest,
} from "../../middleware/auth";
import { logger } from "../../lib/logger";
import { getLatestRates } from "../../lib/exchange";
import { findUserById } from "../../lib/auth";
import { webhookRateLimit } from "../../middleware/rate-limiter";

const router = Router();

/**
 * GET /billing/rates
 * Returns the latest exchange rates.
 */
router.get("/rates", ...requirePermission("billing", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const rates = await getLatestRates();
    res.json(rates);
  } catch (err) {
    logger.error({ err }, "Failed to fetch exchange rates");
    res.status(500).json({ error: "Failed to fetch exchange rates" });
  }
});

// ─── Stripe setup ──────────────────────────────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-04-22.dahlia" });

// ─── Price → Plan mapping ─────────────────────────────────────────────────────
type PaidPlan = "starter" | "pro" | "growth" | "flex";

const PLAN_PRICE_IDS: Record<PaidPlan, { monthly?: string; yearly?: string }> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_PRICE_ID ?? "price_1TSwQIBA7ra9J8VO3P4tgtLi",
    yearly: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  growth: {
    monthly: process.env.STRIPE_GROWTH_PRICE_ID ?? "price_1TVwaRBA7ra9J8VOklfQvp9E",
    yearly: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID ?? "price_1TVwbbBA7ra9J8VOok7hEjEG",
  },
  pro: {
    monthly: process.env.STRIPE_PRO_PRICE_ID,
    yearly: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  flex: {
    monthly: process.env.STRIPE_LEGACY_FLEX_PRICE_ID ?? "price_1TVwYcBA7ra9J8VOvNnoscbn",
  }
};

const EXTRA_REPS_PRICE_ID = process.env.STRIPE_EXTRA_REPS_PRICE_ID;
const YEARLY_EXTRA_REPS_PRICE_ID = process.env.STRIPE_YEARLY_EXTRA_REPS_PRICE_ID;

const PRICE_TO_PLAN: Record<string, PaidPlan> = {};
const PRICE_TO_INTERVAL: Record<string, "month" | "year"> = {};

Object.entries(PLAN_PRICE_IDS).forEach(([plan, prices]) => {
  if (prices.monthly) {
    PRICE_TO_PLAN[prices.monthly] = plan as PaidPlan;
    PRICE_TO_INTERVAL[prices.monthly] = "month";
  }
  if (prices.yearly) {
    PRICE_TO_PLAN[prices.yearly] = plan as PaidPlan;
    PRICE_TO_INTERVAL[prices.yearly] = "year";
  }
});

if (EXTRA_REPS_PRICE_ID) PRICE_TO_INTERVAL[EXTRA_REPS_PRICE_ID] = "month";
if (YEARLY_EXTRA_REPS_PRICE_ID) PRICE_TO_INTERVAL[YEARLY_EXTRA_REPS_PRICE_ID] = "year";

function getPlanFromSubscription(sub: Stripe.Subscription): PaidPlan | null {
  for (const item of sub.items.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    const plan = PRICE_TO_PLAN[priceId];
    if (plan) return plan;
  }
  return null;
}

function getIntervalFromSubscription(sub: Stripe.Subscription): "month" | "year" {
  for (const item of sub.items.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;
    const interval = PRICE_TO_INTERVAL[priceId];
    if (interval) return interval;
  }
  return "month";
}

function getExtraRepSeatsFromStripeItems(
  items: Stripe.SubscriptionItem[],
): number {
  const ids = [EXTRA_REPS_PRICE_ID, YEARLY_EXTRA_REPS_PRICE_ID].filter(
    (id): id is string => Boolean(id),
  );
  if (ids.length === 0) return 0;
  const idSet = new Set(ids);
  let total = 0;
  for (const item of items) {
    const pid = item.price?.id;
    if (pid && idSet.has(pid)) total += item.quantity ?? 0;
  }
  return total;
}

function findExtraRepSubscriptionItem(
  items: Stripe.SubscriptionItem[],
): Stripe.SubscriptionItem | undefined {
  return items.find((i) => {
    const pid = i.price?.id;
    return (
      Boolean(pid) &&
      (pid === EXTRA_REPS_PRICE_ID || pid === YEARLY_EXTRA_REPS_PRICE_ID)
    );
  });
}

/** Max add-on seats per workspace (abuse guard). */
const MAX_EXTRA_REP_SEATS = 500;

function getExtraRepsPriceIdForDbPlan(interval: "month" | "year"): string | undefined {
  if (interval === "year") return YEARLY_EXTRA_REPS_PRICE_ID;
  return EXTRA_REPS_PRICE_ID;
}

/** Starting another Checkout subscription while one of these exists would double-bill the customer. */
const STRIPE_SUB_STATUSES_BLOCKING_NEW_CHECKOUT = new Set<
  Stripe.Subscription.Status
>(["active", "trialing", "past_due", "unpaid", "paused"]);

function customerHasBlockingStripeSubscription(
  subs: Stripe.Subscription[],
): boolean {
  return subs.some((s) => STRIPE_SUB_STATUSES_BLOCKING_NEW_CHECKOUT.has(s.status));
}

const DB_SUB_STATUSES_BLOCKING_NEW_CHECKOUT = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return "http://localhost:3000";
}

// ─── Helper: get or create Stripe customer for a workspace ────────────────────
async function getOrCreateCustomer(
  workspaceId: string,
  userEmail: string,
  workspaceName?: string,
  workspaceSlug?: string,
  workspaceCurrency?: string,
  workspaceOwnerId?: string,
  workspaceOwnerName?: string,
): Promise<string> {
  const sub = await WorkspaceSubscription.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: userEmail,
    name: workspaceName,
    metadata: {
      workspaceId,
      workspaceName: workspaceName ?? "",
      workspaceSlug: workspaceSlug ?? "",
      workspaceCurrency: workspaceCurrency ?? "USD",
      workspaceOwnerId: workspaceOwnerId ?? "",
      workspaceOwnerName: workspaceOwnerName ?? "",
    },
  });

  // Upsert the subscription record with the customer id
  await WorkspaceSubscription.findOneAndUpdate(
    { workspaceId: new Types.ObjectId(workspaceId) },
    {
      $set: {
        workspaceId: new Types.ObjectId(workspaceId),
        stripeCustomerId: customer.id,
      },
    },
    { upsert: true, new: true },
  );

  return customer.id;
}

// ─── GET /billing/status ──────────────────────────────────────────────────────
/**
 * Returns the current subscription status for the authenticated workspace.
 */
router.get(
  "/status",
  ...requirePermission("billing", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const sub = await WorkspaceSubscription.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!sub || sub.plan === "free") {
      res.json({
        plan: "free",
        status: "active",
        isLifetime: false,
        extraRepSeats: 0,
        trialUsed: sub?.trialUsed ?? false,
      });
      return;
    }

    res.json({
      plan: sub.plan,
      status: sub.status,
      isLifetime: sub.isLifetime,
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      stripeCustomerId: sub.stripeCustomerId,
      extraRepSeats: Number(
        (sub as { extraRepSeats?: number }).extraRepSeats ?? 0,
      ),
      trialUsed: sub.trialUsed ?? false,
    });
  },
);

// ─── POST /billing/checkout ───────────────────────────────────────────────────
/**
 * Creates a Stripe Checkout Session and returns the redirect URL.
 */
router.post(
  "/checkout",
  ...requirePermission("billing", "write"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const { priceId, mode, extraReps } = req.body as {
      priceId?: string;
      mode?: string;
      extraReps?: number;
    };
    const workspaceId = req.workspaceId!;

    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const plan = PRICE_TO_PLAN[priceId];
    if (!plan) {
      res.status(400).json({ error: "Invalid priceId" });
      return;
    }
    if (plan === "flex") {
      res.status(400).json({
        error: "This plan is no longer available for new purchases.",
      });
      return;
    }

    const extraRepsQty =
      typeof extraReps === "number" && Number.isFinite(extraReps)
        ? Math.max(0, Math.floor(extraReps))
        : 0;

    const interval = PRICE_TO_INTERVAL[priceId] ?? "month";
    const extraRepsStripePriceId =
      interval === "year" ? YEARLY_EXTRA_REPS_PRICE_ID : EXTRA_REPS_PRICE_ID;

    if (extraRepsQty > 0) {
      if (interval === "year" && !YEARLY_EXTRA_REPS_PRICE_ID) {
        res.status(400).json({
          error:
            "Yearly extra reps add-on is not configured (missing STRIPE_YEARLY_EXTRA_REPS_PRICE_ID).",
        });
        return;
      }
      if (interval === "month" && !EXTRA_REPS_PRICE_ID) {
        res.status(400).json({
          error:
            "Extra reps add-on is not configured (missing STRIPE_EXTRA_REPS_PRICE_ID).",
        });
        return;
      }
    }

    const existing = await WorkspaceSubscription.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (existing?.isLifetime) {
      res.status(400).json({
        error:
          "This workspace is on a lifetime plan and cannot purchase a subscription via checkout.",
      });
      return;
    }

    if (
      existing?.plan &&
      existing.plan !== "free" &&
      existing.stripeSubscriptionId &&
      DB_SUB_STATUSES_BLOCKING_NEW_CHECKOUT.has(String(existing.status ?? ""))
    ) {
      res.status(400).json({
        error:
          "This workspace already has an active subscription. Use Manage subscription in the billing portal to change your plan or add extra rep seats. Starting checkout again would create a second subscription and charge you twice.",
      });
      return;
    }

    const ws = await Workspace.findById(workspaceId);

    let ownerName = "";
    if (ws?.ownerId) {
      try {
        const owner = await findUserById(ws.ownerId);
        if (owner) ownerName = owner.name ?? "";
      } catch {
        // non-critical — metadata enrichment best-effort
      }
    }

    const customerId = await getOrCreateCustomer(
      workspaceId,
      req.userEmail!,
      ws?.name,
      ws?.slug,
      ws?.currency,
      ws?.ownerId,
      ownerName,
    );

    try {
      const openSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      if (customerHasBlockingStripeSubscription(openSubs.data)) {
        res.status(400).json({
          error:
            "This Stripe customer already has an active subscription. Use Manage subscription to change your plan or add extra rep seats. Do not run checkout again or you may be charged twice.",
        });
        return;
      }
    } catch (err) {
      logger.error({ err, customerId }, "Failed to list Stripe subscriptions before checkout");
      res.status(503).json({
        error:
          "Could not verify your subscription status with Stripe. Please try again in a moment.",
      });
      return;
    }

    const checkoutMode: "subscription" | "payment" =
      mode === "payment" ? "payment" : "subscription";
    const applyTrial = checkoutMode === "subscription" && !existing?.trialUsed;
    const appUrl = getAppUrl();

    try {
      const lineItems = [{ price: priceId, quantity: 1 }] as Array<{
        price: string;
        quantity: number;
      }>;
      if (extraRepsQty > 0 && extraRepsStripePriceId) {
        lineItems.push({
          price: extraRepsStripePriceId,
          quantity: extraRepsQty,
        });
      }

      const workspaceMeta = {
        workspaceId,
        workspaceName: ws?.name ?? "",
        workspaceSlug: ws?.slug ?? "",
        workspaceCurrency: ws?.currency ?? "USD",
        workspaceOwnerId: ws?.ownerId ?? "",
        workspaceOwnerName: ownerName,
      };

      const couponId = process.env.STRIPE_COUPON;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: checkoutMode,
        line_items: lineItems,
        ...(couponId
          ? { discounts: [{ coupon: couponId }] }
          : { allow_promotion_codes: true }),
        metadata: {
          ...workspaceMeta,
          userId: req.userId ?? "",
          plan,
          interval,
          extraReps: String(extraRepsQty),
          isTrial: String(applyTrial),
          ...(extraRepsStripePriceId && {
            extraRepsPriceId: extraRepsStripePriceId,
          }),
        },
        billing_address_collection: "auto",
        success_url: `${appUrl}/dash/billing?checkout=success&plan=${plan}`,
        cancel_url: `${appUrl}/dash/billing?checkout=cancelled`,
        ...(checkoutMode === "subscription" && {
          subscription_data: {
            metadata: {
              ...workspaceMeta,
              plan,
              interval,
              extraReps: String(extraRepsQty),
              ...(extraRepsStripePriceId && {
                extraRepsPriceId: extraRepsStripePriceId,
              }),
            },
            ...(applyTrial && { trial_period_days: 14 }),
          },
        }),
      });

      res.json({ url: session.url });
    } catch (err: any) {
      logger.error({ err }, "Stripe checkout error");
      res.status(500).json({ error: err.message });
    }
  },
);

// ─── POST /billing/extra-reps ────────────────────────────────────────────────
/**
 * Updates total extra-rep add-on quantity on the workspace's existing Stripe subscription.
 * Prorations follow your Stripe account settings (typically next invoice or immediate proration).
 */
router.post(
  "/extra-reps",
  ...requirePermission("billing", "write"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { quantity } = req.body as { quantity?: unknown };

    if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
      res.status(400).json({
        error: "quantity is required (total extra rep seats, integer ≥ 0).",
      });
      return;
    }

    const qty = Math.max(
      0,
      Math.min(MAX_EXTRA_REP_SEATS, Math.floor(quantity)),
    );

    const record = await WorkspaceSubscription.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!record?.stripeSubscriptionId) {
      res.status(400).json({
        error: "No Stripe subscription found for this workspace.",
      });
      return;
    }
    if (!record.plan || record.plan === "free") {
      res.status(400).json({
        error: "Extra rep seats can only be changed on a paid subscription.",
      });
      return;
    }
    if (
      !DB_SUB_STATUSES_BLOCKING_NEW_CHECKOUT.has(String(record.status ?? ""))
    ) {
      res.status(400).json({
        error:
          "Subscription is not in a state that can be updated (must be active, trialing, past_due, unpaid, or paused).",
      });
      return;
    }

    const interval = record.billingInterval ?? "month";
    const targetPriceId = getExtraRepsPriceIdForDbPlan(interval);
    if (qty > 0 && !targetPriceId) {
      res.status(400).json({
        error:
          interval === "year"
            ? "Yearly extra reps price is not configured (STRIPE_YEARLY_EXTRA_REPS_PRICE_ID)."
            : "Extra reps price is not configured (STRIPE_EXTRA_REPS_PRICE_ID).",
      });
      return;
    }

    const subId = record.stripeSubscriptionId;

    try {
      const stripeSub = await stripe.subscriptions.retrieve(subId, {
        expand: ["items.data.price"],
      });

      const extraItem = findExtraRepSubscriptionItem(stripeSub.items.data);

      if (qty === 0) {
        if (extraItem) {
          await stripe.subscriptionItems.del(extraItem.id, {
            proration_behavior: "create_prorations",
          });
        }
      } else if (extraItem) {
        const currentPrice = extraItem.price?.id;
        if (currentPrice === targetPriceId) {
          await stripe.subscriptionItems.update(extraItem.id, {
            quantity: qty,
            proration_behavior: "create_prorations",
          });
        } else {
          await stripe.subscriptionItems.del(extraItem.id, {
            proration_behavior: "create_prorations",
          });
          await stripe.subscriptionItems.create({
            subscription: subId,
            price: targetPriceId!,
            quantity: qty,
            proration_behavior: "create_prorations",
          });
        }
      } else {
        await stripe.subscriptionItems.create({
          subscription: subId,
          price: targetPriceId!,
          quantity: qty,
          proration_behavior: "create_prorations",
        });
      }

      const refreshed = await stripe.subscriptions.retrieve(subId, {
        expand: ["items.data.price"],
      });
      const extraRepSeats = getExtraRepSeatsFromStripeItems(
        refreshed.items.data,
      );

      await WorkspaceSubscription.findOneAndUpdate(
        { workspaceId: new Types.ObjectId(workspaceId) },
        { $set: { extraRepSeats } },
      );

      res.json({ extraRepSeats });
    } catch (err: any) {
      logger.error({ err }, "Stripe extra-reps update error");
      res
        .status(500)
        .json({ error: err.message ?? "Failed to update extra rep seats." });
    }
  },
);

// ─── POST /billing/portal ─────────────────────────────────────────────────────
/**
 * Creates a Stripe Customer Portal session so users can manage their
 * subscription, update payment methods, or cancel.
 */
router.post(
  "/portal",
  ...requirePermission("billing", "write"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const sub = await WorkspaceSubscription.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!sub?.stripeCustomerId) {
      res
        .status(400)
        .json({ error: "No Stripe customer found for this workspace." });
      return;
    }

    const appUrl = getAppUrl();

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${appUrl}/billing`,
      });
      res.json({ url: session.url });
    } catch (err: any) {
      logger.error({ err }, "Stripe portal error");
      res.status(500).json({ error: err.message });
    }
  },
);

// ─── POST /billing/webhook ────────────────────────────────────────────────────
/**
 * Stripe webhook endpoint — processes subscription lifecycle events.
 * Body must be raw (Buffer) — configured in app.ts.
 */
router.post("/webhook", webhookRateLimit, async (req, res): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      // Bun requires constructEventAsync due to its async SubtleCrypto implementation
      event = await stripe.webhooks.constructEventAsync(
        req.body as Buffer,
        sig,
        webhookSecret,
      );
      logger.info("Stripe signature verified successfully");
    } catch (err: any) {
      logger.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }
  } else if (process.env.NODE_ENV === "production") {
    // Never allow unsigned webhooks in production
    res.status(400).json({ error: "STRIPE_WEBHOOK_SECRET is not configured" });
    return;
  } else {
    // Dev/test — req.body is a raw Buffer from express.raw(); parse it as JSON
    try {
      const raw = req.body as Buffer;
      event = JSON.parse(raw.toString("utf8")) as Stripe.Event;
    } catch (err: any) {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }
  }

  // Dump event to a debug file in local development mode
  if (process.env.NODE_ENV !== "production") {
    const fs = require("fs");
    const path = require("path");
    fs.writeFileSync(
      path.join(process.cwd(), "stripe-webhook-debug.json"),
      JSON.stringify(event, null, 2),
    );
  }

  logger.info({ type: event.type }, "Stripe webhook received");

  try {
    switch (event.type) {
      // ── Checkout completed ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        const plan = session.metadata?.plan as
          | "starter"
          | "pro"
          | "growth"
          | "flex"
          | "annual"
          | undefined;
        const customerId = session.customer as string;

        if (!workspaceId || !plan) {
          logger.warn(
            { sessionId: session.id },
            "checkout.session.completed missing metadata",
          );
          break;
        }

        if (session.mode === "subscription") {
          // Subscription — further handled in subscription.updated
          const subscriptionId = session.subscription as string;
          let extraRepSeats = 0;
          let stripePriceId: string | undefined;
          let billingInterval: "month" | "year" = "month";

          try {
            const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
            extraRepSeats = getExtraRepSeatsFromStripeItems(stripeSub.items.data);
            stripePriceId = stripeSub.items.data.find(i => Boolean(PRICE_TO_PLAN[i.price?.id ?? ""]))?.price?.id;
            billingInterval = getIntervalFromSubscription(stripeSub);
          } catch (err) {
            logger.warn(
              { err, subscriptionId },
              "Could not retrieve subscription for details; will sync on subscription.updated",
            );
          }

          await WorkspaceSubscription.findOneAndUpdate(
            { workspaceId: new Types.ObjectId(workspaceId) },
            {
              $set: {
                workspaceId: new Types.ObjectId(workspaceId),
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId,
                plan,
                billingInterval,
                status: "active",
                isLifetime: false,
                extraRepSeats,
              },
              $setOnInsert: {
                trialUsed: session.metadata?.isTrial === "true",
              },
            },
            { upsert: true, new: true },
          );
          
          if (session.metadata?.isTrial === "true") {
             await WorkspaceSubscription.findOneAndUpdate(
               { workspaceId: new Types.ObjectId(workspaceId) },
               { $set: { trialUsed: true } }
             );
          }
          logger.info({ workspaceId, plan }, "Subscription activated");
        }
        break;
      }

      // ── Subscription updated ────────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = sub.metadata?.workspaceId;
        if (!workspaceId) {
          // Try to look up via customer
          const found = await WorkspaceSubscription.findOne({
            stripeSubscriptionId: sub.id,
          });
          if (!found) {
            logger.warn(
              { subId: sub.id },
              "No workspace found for subscription update",
            );
            break;
          }
        }

        const plan = getPlanFromSubscription(sub) ?? "starter";
        const extraRepSeats = getExtraRepSeatsFromStripeItems(sub.items.data);
        const priceId = sub.items.data.find(
          (i) => PRICE_TO_PLAN[i.price?.id ?? ""] === plan,
        )?.price?.id ?? (plan === "flex" ? PLAN_PRICE_IDS.flex.monthly : undefined);
        // current_period_end moved to SubscriptionItem in Stripe SDK v22
        const baseItem =
          sub.items.data.find((i) =>
            Boolean(PRICE_TO_PLAN[i.price?.id ?? ""]),
          ) ?? sub.items.data[0];
        const itemPeriodEnd = (baseItem as any)?.current_period_end as
          | number
          | undefined;
        const periodEnd = itemPeriodEnd
          ? new Date(itemPeriodEnd * 1000)
          : undefined;

        const query = workspaceId
          ? { workspaceId: new Types.ObjectId(workspaceId) }
          : { stripeSubscriptionId: sub.id };

        await WorkspaceSubscription.findOneAndUpdate(query, {
          $set: {
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan,
            billingInterval: getIntervalFromSubscription(sub),
            extraRepSeats,
            status: sub.status,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodEnd: periodEnd,
          },
        });
        logger.info(
          { subId: sub.id, status: sub.status, plan },
          "Subscription updated",
        );
        break;
      }

      // ── Subscription deleted / cancelled ────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await WorkspaceSubscription.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          {
            $set: {
              plan: "free",
              status: "canceled",
              cancelAtPeriodEnd: false,
              currentPeriodEnd: null,
              extraRepSeats: 0,
            },
          },
        );
        logger.info(
          { subId: sub.id },
          "Subscription cancelled → downgraded to free",
        );
        break;
      }

      // ── Payment failed ──────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | null;
        if (subId) {
          await WorkspaceSubscription.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { $set: { status: "past_due" } },
          );
          logger.warn(
            { subId },
            "Invoice payment failed — status set to past_due",
          );
        }
        break;
      }

      // ── Payment succeeded ───────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | null;
        if (subId) {
          await WorkspaceSubscription.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { $set: { status: "active" } },
          );
        }
        break;
      }

      default:
        logger.info({ type: event.type }, "Unhandled Stripe event — ignored");
    }
  } catch (err) {
    logger.error(
      { err, eventType: event.type },
      "Error processing Stripe webhook",
    );
    // Still return 200 so Stripe doesn't retry — we log the error for manual inspection
  }

  res.json({ received: true });
});

export default router;
