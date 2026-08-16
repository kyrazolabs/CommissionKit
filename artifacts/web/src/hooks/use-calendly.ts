import { useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
      closePopupWidget: () => void;
    };
  }
}

const CALENDLY_URL = "https://calendly.com/commissionkit/see-commissionkit-in-action";
const CALENDLY_SCRIPT_SELECTOR = 'script[src*="assets.calendly.com/assets/external/widget.js"]';

/**
 * Hook to open the Calendly scheduling popup.
 * Returns an `openCalendly` function that is safe to call even before the widget script loads.
 */
export function useCalendly() {
  const queuedRef = useRef(false);

  const openCalendly = useCallback(() => {
    if (typeof window !== "undefined" && window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
      queuedRef.current = false;
    } else {
      // Script hasn't loaded yet — flagged; flushed below once the widget is ready
      queuedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Widget already available (cached/fast load) — flush any queued open now.
    if (window.Calendly) {
      if (queuedRef.current) {
        window.Calendly.initPopupWidget({ url: CALENDLY_URL });
        queuedRef.current = false;
      }
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(CALENDLY_SCRIPT_SELECTOR);
    let pollId: number | undefined;

    // Idempotent: no-op when the queue is empty; self-cleans after the first flush.
    function flush() {
      if (!queuedRef.current || !window.Calendly) return;
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
      queuedRef.current = false;
      script?.removeEventListener("load", flush);
      if (pollId !== undefined) window.clearInterval(pollId);
    }

    if (script) {
      // Wait for the async widget script to finish loading, then flush the queue.
      // Safe: window.Calendly was falsy above and the load event can't interleave
      // with this synchronous block, so the listener can't miss the script.
      script.addEventListener("load", flush);
    } else {
      // Script tag not found (unexpected) — poll briefly until the widget appears.
      let attempts = 0;
      pollId = window.setInterval(() => {
        if (window.Calendly || ++attempts >= 60) {
          window.clearInterval(pollId);
          pollId = undefined;
          flush();
        }
      }, 250);
    }

    return () => {
      script?.removeEventListener("load", flush);
      if (pollId !== undefined) window.clearInterval(pollId);
    };
  }, []);

  return openCalendly;
}
