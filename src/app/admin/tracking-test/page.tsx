'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, FlaskConical, Loader2, Tag } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { GOOGLE_ADS_ID, queueGoogleAdsPurchase } from '@/lib/googleAds';

type TestStatus =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'success'; transactionId: string }
  | { kind: 'error'; message: string };

export default function TrackingTestPage() {
  const [amount, setAmount] = useState('1.00');
  const [status, setStatus] = useState<TestStatus>({ kind: 'idle' });
  const currency = 'USD';
  const parsedAmount = useMemo(() => Number.parseFloat(amount), [amount]);

  const sendTestPurchase = () => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setStatus({ kind: 'error', message: 'Enter an amount greater than 0.' });
      return;
    }

    setStatus({ kind: 'sending' });
    const transactionId = `BRICOC-TRACKING-TEST-${Date.now()}`;
    const queued = queueGoogleAdsPurchase({
      value: parsedAmount,
      currency,
      transactionId,
      contentId: 'bricoc-tracking-test',
      contentName: 'Bricoc tracking verification',
    });

    if (!queued) {
      setStatus({
        kind: 'error',
        message: 'The Google tag was not available. Refresh this page while Tag Assistant is connected and try again.',
      });
      return;
    }

    setStatus({ kind: 'success', transactionId });
  };

  return (
    <AdminLayout
      title="Google Ads Tracking Test"
      subtitle="Send one clearly labelled test purchase to verify the live conversion tag"
    >
      <div className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#233F31]/10 p-3">
              <FlaskConical className="h-6 w-6 text-[#233F31]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Test the Purchase conversion</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Connect Tag Assistant to this page, then send the test. It dispatches the same Google Ads conversion
                and ecommerce purchase events used after a Stripe payment.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-gray-700">Test order value</span>
              <div className="flex rounded-xl border border-gray-300 bg-white focus-within:border-[#233F31] focus-within:ring-2 focus-within:ring-[#233F31]/10">
                <span className="flex items-center border-r border-gray-200 px-4 text-gray-500">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="min-w-0 flex-1 rounded-r-xl px-4 py-3 text-gray-900 outline-none"
                  aria-label="Test order value"
                />
              </div>
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-gray-700">Currency</span>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-700">
                {currency}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={sendTestPurchase}
            disabled={status.kind === 'sending'}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#233F31] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#1a3025] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {status.kind === 'sending' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Tag className="h-5 w-5" />
            )}
            Send test purchase
          </button>

          {status.kind === 'success' && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
                <div>
                  <p className="font-semibold">Purchase events sent</p>
                  <p className="mt-1 text-sm">Transaction ID: {status.transactionId}</p>
                  <p className="mt-2 text-sm">Tag Assistant should now show both “Conversion” and “Purchase”.</p>
                </div>
              </div>
            </div>
          )}

          {status.kind === 'error' && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {status.message}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Tag configuration used</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <dt className="text-gray-500">Google Ads destination</dt>
              <dd className="mt-1 font-mono font-semibold text-gray-900">{GOOGLE_ADS_ID}</dd>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <dt className="text-gray-500">Event value</dt>
              <dd className="mt-1 font-semibold text-gray-900">
                {Number.isFinite(parsedAmount) ? parsedAmount.toFixed(2) : '—'} {currency}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-5 text-gray-500">
            Each click creates a unique transaction ID so Google does not discard the event as a duplicate. This is a
            live tag test and may appear once in Google Ads reporting.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
