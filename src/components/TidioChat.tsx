"use client";

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

const TIDIO_SCRIPT_SRC = "https://code.tidio.co/zdnng70jqws1vszmgedfhizy4padxt0n.js";

export default function TidioChat() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isCheckoutRoute = pathname?.startsWith('/checkout');

  useEffect(() => {
    // Hide or show Tidio iframe on admin/checkout pages if present in DOM
    const tidioElement = document.getElementById('tidio-chat-iframe') || document.querySelector('#tidio-chat') as HTMLElement;
    if (tidioElement) {
      if (isAdminRoute || isCheckoutRoute) {
        tidioElement.style.display = 'none';
      } else {
        tidioElement.style.display = 'block';
      }
    }
  }, [pathname, isAdminRoute, isCheckoutRoute]);

  if (isAdminRoute || isCheckoutRoute) {
    return null;
  }

  return (
    <Script
      id="tidio-chat-script"
      src={TIDIO_SCRIPT_SRC}
      strategy="lazyOnload"
    />
  );
}
