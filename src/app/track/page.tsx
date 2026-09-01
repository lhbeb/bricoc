"use client";

import React, { FormEvent, useEffect, useState } from "react";

declare global {
  interface Window {
    YQV5?: {
      trackSingle: (options: {
        YQ_ContainerId: string;
        YQ_Height: number;
        YQ_Fc: string;
        YQ_Lang: string;
        YQ_Num: string;
      }) => void;
    };
  }
}

const TRACKING_SCRIPT_SRC = "https://www.17track.net/externalcall.js";

let trackingScriptPromise: Promise<void> | null = null;

function loadTrackingScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Tracking is only available in the browser."));
  }

  if (window.YQV5) {
    return Promise.resolve();
  }

  if (trackingScriptPromise) {
    return trackingScriptPromise;
  }

  trackingScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${TRACKING_SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null;

    const handleLoaded = () => {
      if (window.YQV5) {
        resolve();
      } else {
        reject(new Error("Tracking provider loaded, but the tracker is unavailable."));
      }
    };

    const handleError = () => {
      trackingScriptPromise = null;
      reject(new Error("Failed to load the tracking system."));
    };

    if (existingScript) {
      if (window.YQV5 || existingScript.dataset.loaded === "true") {
        handleLoaded();
        return;
      }

      existingScript.addEventListener("load", handleLoaded, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = TRACKING_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      handleLoaded();
    };
    script.onerror = handleError;
    document.body.appendChild(script);
  });

  return trackingScriptPromise;
}

const TrackPage = () => {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadTrackingScript()
      .then(() => {
        if (!isMounted) {
          return;
        }
        setIsScriptReady(true);
        setError("");
      })
      .catch((loadError: Error) => {
        if (!isMounted) {
          return;
        }
        setError(loadError.message || "Failed to load tracking system. Please try again later.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrack = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTrackingNumber = trackingNumber.trim();

    if (!trimmedTrackingNumber) {
      setError("Please enter a tracking number.");
      return;
    }

    if (!window.YQV5) {
      setError("Tracking is still loading. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      window.YQV5.trackSingle({
        YQ_ContainerId: "YQContainer",
        YQ_Height: 560,
        YQ_Fc: "0",
        YQ_Lang: "en",
        YQ_Num: trimmedTrackingNumber,
      });
      setTrackingNumber(trimmedTrackingNumber);
    } catch {
      setError("We could not start your tracking right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F6FF] py-10 sm:py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-[#D6E3FF] bg-white">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_360px]">
            <section className="px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
              <div className="mb-3 text-sm font-medium text-[#0a3075]">
                Bricoc order tracking
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold text-[#262626] sm:text-4xl">
                Track your order
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5B6785] sm:text-base">
                Enter your tracking number below to see the latest carrier updates for your Bricoc order.
              </p>

              <form onSubmit={handleTrack} className="mt-8 rounded-[24px] border border-[#E8EEF8] bg-[#F8FBFF] p-4 sm:p-5">
                <label htmlFor="trackingNumber" className="mb-3 block text-sm font-medium text-[#262626]">
                  Tracking number
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(event) => {
                      setTrackingNumber(event.target.value);
                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Enter your tracking number"
                    maxLength={50}
                    autoComplete="off"
                    className="h-14 flex-1 rounded-2xl border border-[#D6E3FF] bg-white px-4 text-sm font-medium text-[#262626] outline-none transition focus:border-[#0a3075]/35 focus:ring-2 focus:ring-[#0a3075]/10"
                  />
                  <button
                    type="submit"
                    disabled={!isScriptReady || isSubmitting}
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#233F31] px-6 text-sm font-semibold text-[#FAF6EB] transition hover:bg-[#1a3025] disabled:cursor-not-allowed disabled:bg-[#D7DEF0] disabled:text-[#6E7AA1]"
                  >
                    {isSubmitting ? "Loading..." : "Track Order"}
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="mt-4 rounded-2xl border border-[#FFB9B9] bg-[#FFF1F1] px-4 py-3 text-sm font-medium text-[#8B1E1E]"
                  >
                    {error}
                  </div>
                )}
              </form>

              <div className="mt-8 overflow-hidden rounded-[24px] border border-[#E8EEF8] bg-white p-2">
                <div
                  id="YQContainer"
                  className="min-h-[560px] rounded-[24px] bg-[#F8FBFF]"
                />
              </div>
            </section>

            <aside className="border-t border-[#D6E3FF] bg-[#F8FBFF] px-6 py-8 lg:border-l lg:border-t-0">
              <div className="rounded-[24px] border border-[#DCE5F5] bg-white p-6">
                <h2 className="text-xl font-semibold text-[#262626]">
                  Before you search
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-[#5B6785]">
                  <p>
                    Use the exact tracking number from your Bricoc shipping confirmation email.
                  </p>
                  <p>
                    Some carriers need a little time before the first update appears after dispatch.
                  </p>
                  <p>
                    If your number still shows no movement after a while, our support team can help you investigate.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-[#DCE5F5] bg-white p-6">
                <h3 className="text-lg font-semibold text-[#262626]">Need help with your order?</h3>
                <p className="mt-3 text-sm leading-7 text-[#5B6785]">
                  Reach out to our team with your order number and tracking number, and we’ll help you from there.
                </p>
                <a
                  href="mailto:contact@bricoc.com"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-[#233F31] px-5 py-3 text-sm font-semibold text-[#FAF6EB] transition hover:bg-[#1a3025]"
                >
                  Contact Support
                </a>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackPage;
