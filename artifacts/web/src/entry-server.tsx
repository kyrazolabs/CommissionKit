import ReactDOMServer from "react-dom/server";
import { LandingPage } from "./pages/landing";

export function render() {
  return ReactDOMServer.renderToString(<LandingPage />);
}
