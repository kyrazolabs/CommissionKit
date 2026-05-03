import { Router } from "express";
import Stripe from "stripe";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const stripeSecretKey = process.env["STRIPE_SECRET_KEY"];
if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-04-22.dahlia" });

const DOMAIN = process.env["REPLIT_DOMAINS"]?.split(",")[0];

router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { priceId } = req.body as { priceId?: string };

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  if (!DOMAIN) {
    res.status(500).json({ error: "REPLIT_DOMAINS not set" });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: req.userEmail,
      metadata: { userId: req.userId ?? "" },
      success_url: `https://${DOMAIN}/?checkout=success`,
      cancel_url: `https://${DOMAIN}/billing`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    req.log.error({ err }, "Stripe checkout error");
    res.status(500).json({ error: err.message });
  }
});

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } catch (err: any) {
      req.log.error({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Webhook signature verification failed" });
      return;
    }
  } else {
    event = req.body as Stripe.Event;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      req.log.info({ sessionId: session.id, userId: session.metadata?.userId }, "Checkout completed");
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      req.log.info({ subscriptionId: sub.id, status: sub.status }, "Subscription event");
      break;
    }
    default:
      req.log.info({ type: event.type }, "Unhandled Stripe event");
  }

  res.json({ received: true });
});

export default router;
