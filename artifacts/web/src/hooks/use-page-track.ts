import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics";

/**
 * Tracks page views on every SPA route change.
 * Uses the browser's native URL and popstate events instead of
 * Wouter's useLocation, which can lag behind across nested router contexts.
 */
export function usePageTrack() {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    function track() {
      const url = window.location.pathname;
      if (trackedRef.current === url) return;
      trackedRef.current = url;
      trackPageView(url);
    }

    track();

    window.addEventListener("popstate", track);

    // Monkey-patch pushState / replaceState so we catch programmatic
    // navigations that don't fire popstate.
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = function (...args) {
      origPush(...args);
      track();
    };
    history.replaceState = function (...args) {
      origReplace(...args);
      track();
    };

    return () => {
      window.removeEventListener("popstate", track);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);
}
