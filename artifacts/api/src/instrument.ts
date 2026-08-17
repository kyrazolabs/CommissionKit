import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://d518048a7b113c4afa99d8f37d48634a@o4510640976625664.ingest.de.sentry.io/4511404894584912",
  environment: process.env.NODE_ENV || "development",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    const error = hint.originalException;

    if (error && typeof error === "object") {
      // 1. Ignore client-side schema validation (Zod) errors
      const errName = (error as any).name;
      if (errName === "ZodError" || (error as any).issues) {
        return null;
      }

      // 2. Ignore standard HTTP 4xx (client input, forbidden, not found) error events
      const status = (error as any).status || (error as any).statusCode;
      if (status && typeof status === "number" && status >= 400 && status < 500) {
        return null;
      }
    }

    return event;
  },
});
