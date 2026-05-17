import "./instrument"; // MUST be first

import { createRoot } from "react-dom/client";
import { reactErrorHandler } from "@sentry/react";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(<App />);

