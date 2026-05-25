import "./instrument"; // MUST be first

import { hydrateRoot, createRoot } from "react-dom/client";
import { reactErrorHandler } from "@sentry/react";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import "./index.css";

const container = document.getElementById("root")!;
const rootOptions = {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
};

if (container.hasChildNodes()) {
  hydrateRoot(
    container,
    <HelmetProvider>
      <App />
    </HelmetProvider>,
    rootOptions,
  );
} else {
  createRoot(container, rootOptions).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
}

