'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/logger';

/**
 * Mount once in the root layout.
 * Catches ALL uncaught JS errors and unhandled promise rejections
 * from customer sessions and sends them to the admin Error Log.
 */
export default function GlobalErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Skip browser extension noise
      if (!event.filename || event.filename.startsWith('chrome-extension')) return;

      reportError({
        error: event.error instanceof Error ? event.error : new Error(event.message),
        context: 'global/window.onerror',
        type: 'client',
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason ?? 'Unhandled promise rejection'));

      reportError({
        error,
        context: 'global/unhandledrejection',
        type: 'client',
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
