import { Router } from "express";
import Stripe from "stripe";
import { Types } from "mongoose";
import { WorkspaceSubscription, Workspace, WorkspaceMember } from "@workspace/db";
import { requireAuth, requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// ─── Stripe setup ──────────────────────────────────────────────────────────────
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-04-22.dahlia" });

// ─── Price → Plan mapping ─────────────────────────────────────────────────────
const PRICE_TO_PLAN: Record<string, "starter" | "growth" | "lifetime"> = {
  "price_1TSwQIBA7ra9J8VO3P4tgtLi": "starter",
  "price_1TSwQHBA7ra9J8VOxFgWrEHg": "growth",
  "price_1TUvwTBA7ra9J8VOVNIv5D1b": "lifetime",
};

const PLAN_PRICE_IDS = {
  starter:  "price_1TSwQIBA7ra9J8VO3P4tgtLi",
  growth:   "price_1TSwQHBA7ra9J8VOxFgWrEHg",
  lifetime: "price_1TUvwTBA7ra9J8VOVNIv5D1b",
};

function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DOMAINS) return `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`;
  return "http://localhost:3000";
}

// ─── Helper: get or create Stripe customer for a workspace ────────────────────
async function getOrCreateCustomer(
  workspaceId: string,
  userEmail: string,
  workspaceName?: string,
): Promise<string> {
  const sub = await WorkspaceSubscription.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (sub?.stripeCustomerId) return sub.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: userEmail,
    name: workspaceName,
    metadata: { workspaceId },
  });

  // Upsert the subscription record with the customer id
  await WorkspaceSubscription.findOneAndUpdate(
    { workspaceId: new Types.ObjectId(workspaceId) },
    { $set: { workspaceId: new Types.ObjectId(workspaceId), stripeCustomerId: customer.id } },
    { upsert: true, new: true },
  );

  return customer.id;
}

// ─── GET /billing/status ──────────────────────────────────────────────────────
/**
 * Returns the current subscription status for the authenticated workspace.
 */
router.get("/status", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;

  const sub = await WorkspaceSubscription.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (!sub || sub.plan === "free") {
    res.json({ plan: "free", status: "active", isLifetime: false });
    return;
  }

  res.json({
    plan:                sub.plan,
    status:              sub.status,
    isLifetime:          sub.isLifetime,
    currentPeriodEnd:    sub.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd:   sub.cancelAtPeriodEnd,
    stripeCustomerId:    sub.stripeCustomerId,
  });
});

// ─── POST /billing/checkout ───────────────────────────────────────────────────
/**
 * Creates a Stripe Checkout Session and returns the redirect URL.
 */
router.post("/checkout", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const { priceId, mode } = req.body as { priceId?: string; mode?: string };
  const workspaceId = req.workspaceId!;

  if (!priceId) { res.status(400).json({ error: "priceId is required" }); return; }

  const plan = PRICE_TO_PLAN[priceId];
  if (!plan) { res.status(400).json({ error: "Invalid priceId" }); return; }

  // Prevent purchasing a plan they're already on
  const existing = await WorkspaceSubscription.findOne({ workspaceId: new Types.ObjectId(workspaceId) });
  if (existing?.isLifetime) {
    res.status(400).json({ error: "This workspace already has a lifetime plan." }); return;
  }

  const ws = await Workspace.findById(workspaceId);
  const customerId = await getOrCreateCustomer(workspaceId, req.userEmail!, ws?.name);

  const checkoutMode: "subscription" | "payment" = mode === "payment" ? "payment" : "subscription";
  const appUrl = getAppUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: checkoutMode,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { workspaceId, userId: req.userId ?? "", plan },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      success_url: `${appUrl}/billing?checkout=success&plan=${plan}`,
      cancel_url:  `${appUrl}/billing?checkout=cancelled`,
      ...(checkoutMode === "subscription" && {
        subscription_data: { metadata: { workspaceId, plan } },
      }),
    });

    res.json({ url: session.url });
  } catch (err: any) {
    logger.error({ err }, "Stripe checkout error");
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /billing/portal ─────────────────────────────────────────────────────
/**
 * Creates a Stripe Customer Portal session so users can manage their
 * subscription, update payment methods, or cancel.
 */
router.post("/portal", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;

  const sub = await WorkspaceSubscription.findOne({ workspaceId: new Types.ObjectId(workspaceId) });
  if (!sub?.stripeCustomerId) {
    res.status(400).json({ error: "No Stripe customer found for this workspace." }); return;
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
});

// ─── POST /billing/webhook ────────────────────────────────────────────────────
/**
 * Stripe webhook endpoint — processes subscription lifecycle events.
 * Body must be raw (Buffer) — configured in app.ts.
 */
router.post("/webhook", async (req, res): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      // Bun requires constructEventAsync due to its async SubtleCrypto implementation
      event = await stripe.webhooks.constructEventAsync(req.body as Buffer, sig, webhookSecret);
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
      JSON.stringify(event, null, 2)
    );
  }

  logger.info({ type: event.type }, "Stripe webhook received");

  try {
    switch (event.type) {

      // ── Checkout completed ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        const plan = session.metadata?.plan as "starter" | "growth" | "lifetime" | undefined;
        const customerId = session.customer as string;

        if (!workspaceId || !plan) {
          logger.warn({ sessionId: session.id }, "checkout.session.completed missing metadata");
          break;
        }

        if (session.mode === "payment") {
          // One-time lifetime purchase
          await WorkspaceSubscription.findOneAndUpdate(
            { workspaceId: new Types.ObjectId(workspaceId) },
            {
              $set: {
                workspaceId: new Types.ObjectId(workspaceId),
                stripeCustomerId: customerId,
                stripePriceId: PLAN_PRICE_IDS.lifetime,
                plan: "lifetime",
                status: "active",
                isLifetime: true,
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null,
              },
            },
            { upsert: true, new: true },
          );
          logger.info({ workspaceId }, "Lifetime plan activated");
        } else if (session.mode === "subscription") {
          // Subscription — further handled in subscription.updated
          const subscriptionId = session.subscription as string;
          await WorkspaceSubscription.findOneAndUpdate(
            { workspaceId: new Types.ObjectId(workspaceId) },
            {
              $set: {
                workspaceId: new Types.ObjectId(workspaceId),
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: PLAN_PRICE_IDS[plan],
                plan,
                status: "active",
                isLifetime: false,
              },
            },
            { upsert: true, new: true },
          );
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
          const found = await WorkspaceSubscription.findOne({ stripeSubscriptionId: sub.id });
          if (!found) { logger.warn({ subId: sub.id }, "No workspace found for subscription update"); break; }
        }

        const priceId = sub.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId ?? ""] ?? "starter";
        // current_period_end moved to SubscriptionItem in Stripe SDK v22
        const itemPeriodEnd = (sub.items.data[0] as any)?.current_period_end as number | undefined;
        const periodEnd = itemPeriodEnd ? new Date(itemPeriodEnd * 1000) : undefined;

        const query = workspaceId
          ? { workspaceId: new Types.ObjectId(workspaceId) }
          : { stripeSubscriptionId: sub.id };

        await WorkspaceSubscription.findOneAndUpdate(
          query,
          {
            $set: {
              stripeSubscriptionId: sub.id,
              stripePriceId:        priceId,
              plan,
              status:               sub.status,
              cancelAtPeriodEnd:    sub.cancel_at_period_end,
              currentPeriodEnd:     periodEnd,
            },
          },
        );
        logger.info({ subId: sub.id, status: sub.status, plan }, "Subscription updated");
        break;
      }

      // ── Subscription deleted / cancelled ────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await WorkspaceSubscription.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          {
            $set: {
              plan:               "free",
              status:             "canceled",
              cancelAtPeriodEnd:  false,
              currentPeriodEnd:   null,
            },
          },
        );
        logger.info({ subId: sub.id }, "Subscription cancelled → downgraded to free");
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
          logger.warn({ subId }, "Invoice payment failed — status set to past_due");
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
    logger.error({ err, eventType: event.type }, "Error processing Stripe webhook");
    // Still return 200 so Stripe doesn't retry — we log the error for manual inspection
  }

  res.json({ received: true });
});

export default router;
