"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GOOGLE_ADS_ID, PAGE_VIEW_CONVERSION_LABEL } from "@/lib/googleAds";

export default function GoogleTagTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin, checkout, and thankyou routes
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/checkout")) return;
    if (pathname.startsWith("/thankyou")) return;

    const firePageView = () => {
      if (typeof window === "undefined" || !window.gtag) return;

      const pagePath = pathname + window.location.search;
      const pageLocation = window.location.href;

      // Standard page_view — picked up by Google Ads and GMC
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: pageLocation,
      });

      // Explicit conversion event for the "Page view" conversion action
      window.gtag("event", "conversion", {
        send_to: `${GOOGLE_ADS_ID}/${PAGE_VIEW_CONVERSION_LABEL}`,
        value: 1.0,
        currency: "USD",
      });
    };

    // Wait for gtag.js to load if it hasn't yet (fixes async race condition)
    if (typeof window !== "undefined" && window.gtag) {
      firePageView();
    } else {
      // Retry after a short delay to let gtag.js finish loading
      const timer = setTimeout(firePageView, 1500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}
