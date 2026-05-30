import ReactDOMServer from "react-dom/server";
import { LandingPage } from "./pages/landing";
import { CommissionCalculator } from "./pages/commission-calculator";
import { PrivacyPage } from "./pages/legal/privacy";
import { TermsPage } from "./pages/legal/terms";
import { SecurityPage } from "./pages/legal/security";

export function render(url?: string) {
  const path = url ?? "/";

  if (path.startsWith("/commission-calculator")) {
    return ReactDOMServer.renderToString(<CommissionCalculator />);
  }
  if (path === "/privacy") {
    return ReactDOMServer.renderToString(<PrivacyPage />);
  }
  if (path === "/terms") {
    return ReactDOMServer.renderToString(<TermsPage />);
  }
  if (path === "/security") {
    return ReactDOMServer.renderToString(<SecurityPage />);
  }

  return ReactDOMServer.renderToString(<LandingPage />);
}
