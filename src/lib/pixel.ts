/**
 * Safely fires a Meta Pixel event, retrying until fbq is available.
 * The pixel base snippet now loads synchronously in <head>, so `fbq` is normally
 * ready before this is called; the retry is a safety net. If the event still
 * cannot be fired, it logs a warning instead of failing silently.
 *
 * `options.eventID` is the Meta dedup key — use the order id for conversion
 * events so they can be matched against server-side Conversions API events.
 */
export function trackPixelEvent(
  eventName: string,
  params?: Record<string, any>,
  options?: { eventID?: string },
  maxRetries = 50
): void {
  if (typeof window === "undefined") return;

  let attempts = 0;

  const attempt = () => {
    if ((window as any).fbq) {
      if (params && options) {
        (window as any).fbq("track", eventName, params, options);
      } else if (params) {
        (window as any).fbq("track", eventName, params);
      } else {
        (window as any).fbq("track", eventName);
      }
    } else if (attempts < maxRetries) {
      attempts++;
      setTimeout(attempt, 100); // retry every 100ms, up to 5 seconds
    } else {
      console.warn(
        `[Meta Pixel] "${eventName}" dropped: fbq unavailable after ${maxRetries} attempts`
      );
    }
  };

  attempt();
}
