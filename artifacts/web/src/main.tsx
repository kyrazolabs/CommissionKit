import "./instrument"; // MUST be first

import { hydrateRoot, createRoot } from "react-dom/client";
import { reactErrorHandler } from "@sentry/react";
import App from "./App";
import "./index.css";

const container = document.getElementById("root")!;
const rootOptions = {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
};

if (container.hasChildNodes()) {
  hydrateRoot(container, <App />, rootOptions);
} else {
  createRoot(container, rootOptions).render(<App />);
}

