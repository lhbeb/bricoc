"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPixelEvent } from "@/lib/pixel";

export const FB_PIXEL_ID = "869199797850063";

// The Meta Pixel base snippet + init are injected synchronously in the root
// <head> (see src/app/layout.tsx), so `fbq` is already defined and the initial
// PageView has fired before hydration. This component only fires PageView on
// client-side route changes to avoid double-firing the first load.
export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialRender = useRef(true);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    trackPixelEvent("PageView");
  }, [pathname, searchParams]);

  return null;
}
