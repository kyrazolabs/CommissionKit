import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://7545ff8ec3b4f3893ed85ada58674ffd@o4510640976625664.ingest.de.sentry.io/4511404941836368",
  environment: import.meta.env.MODE || "development",
  sendDefaultPii: true,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Tracing: capture 100% of transactions for performance monitoring.
  tracesSampleRate: 1.0,
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.,
  // Enable logs to be sent to Sentry
  enableLogs: true,
});
