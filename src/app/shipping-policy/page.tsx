import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Mail, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shipping Policy | Bricoc',
  description:
    'Official Bricoc Shipping Policy. Free standard shipping across the United States. Same-day processing for orders placed before 2:00 PM EST.',
};

const timeline = [
  ['Same-day orders', 'Ships same day when placed before 2:00 PM EST'],
  ['Standard processing', '0-1 business day'],
  ['Domestic USA delivery', '5-9 business days (Free Standard Shipping)'],
];

const policySections = [
  {
    title: 'Free Shipping (USA)',
    items: [
      'Free standard shipping on all orders across the United States',
      'No minimum purchase requirement',
      'Tracked shipping via premium logistics partners (USPS, FedEx, UPS, Freight Carriers)',
    ],
  },
  {
    title: 'Order Tracking',
    items: [
      'Automatic shipping confirmation email upon dispatch',
      'Real-time package tracking link provided',
      'Estimated delivery date visibility',
      'Carrier milestone email updates',
    ],
  },
  {
    title: 'Shipping Destinations',
    items: [
      'We ship across all 50 US States nationwide',
      'PO boxes supported for standard US deliveries',
      'APO/FPO/DPO military addresses fully supported',
      'Discreet, eco-friendly, protective packaging',
    ],
  },
  {
    title: 'Package Protection & Safety',
    items: [
      '100% full shipping insurance on all packages',
      'Signature confirmation for high-value orders over $500',
      'Weather-resistant outer mailers',
      'Protective bubble/foam layering for fragile items',
    ],
  },
];

export default function ShippingPolicyPage() {
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://bricoc.com/shipping-policy',
        'url': 'https://bricoc.com/shipping-policy',
        'name': 'Shipping Policy | Bricoc',
        'description':
          'Bricoc Shipping Policy: Free standard shipping across the United States. Same-day processing for orders placed before 2:00 PM EST.',
      },
      {
        '@type': 'OfferShippingDetails',
        '@id': 'https://bricoc.com/shipping-policy#shipping-us',
        'shippingDestination': {
          '@type': 'DefinedRegion',
          'addressCountry': 'US',
        },
        'shippingRate': {
          '@type': 'MonetaryAmount',
          'value': 0,
          'currency': 'USD',
        },
        'deliveryTime': {
          '@type': 'ShippingDeliveryTime',
          'handlingTime': {
            '@type': 'QuantitativeValue',
            'minValue': 0,
            'maxValue': 1,
            'unitCode': 'DAY',
          },
          'transitTime': {
            '@type': 'QuantitativeValue',
            'minValue': 5,
            'maxValue': 9,
            'unitCode': 'DAY',
          },
          'cutoffTime': '14:00:00-05:00',
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#F5F7FB] py-12 sm:py-16">
      {/* Schema.org OfferShippingDetails Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="container mx-auto max-w-5xl px-4">
        <section className="mb-10 rounded-2xl bg-[#233F31] px-6 py-8 text-[#F0F6FF] sm:px-8 sm:py-10 shadow-lg">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F0F6FF]/10 bg-[#233F31]/25 px-3.5 py-1.5 text-sm font-semibold text-[#f5970c]">
            <Truck className="h-4 w-4" />
            Fast & Free Shipping Across USA
          </div>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
            Shipping Policy
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-[#F0F6FF]/80 sm:text-lg">
            At Bricoc, we focus on fast, reliable fulfillment with transparent delivery windows, free standard shipping across the United States, and real-time tracking from warehouse to door.
          </p>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#233F31]/10 bg-white p-5 shadow-sm">
            <Clock className="mb-4 h-6 w-6 text-[#233F31]" />
            <h2 className="text-lg font-bold text-[#262626]">Order by 2:00 PM EST</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Orders placed before the 2:00 PM EST cutoff are processed, packed, and shipped the same business day.
            </p>
          </div>
          <div className="rounded-xl border border-[#233F31]/10 bg-white p-5 shadow-sm">
            <PackageCheck className="mb-4 h-6 w-6 text-[#233F31]" />
            <h2 className="text-lg font-bold text-[#262626]">Free Standard Shipping</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Free shipping on all orders across the United States with no minimum spend required.
            </p>
          </div>
          <div className="rounded-xl border border-[#233F31]/10 bg-white p-5 shadow-sm">
            <ShieldCheck className="mb-4 h-6 w-6 text-[#233F31]" />
            <h2 className="text-lg font-bold text-[#262626]">Insured Deliveries</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              All shipments include full insurance, protective packaging, and end-to-end tracking updates.
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-[#233F31]/10 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#262626]">Delivery Timelines</h2>
              <p className="mt-2 text-sm text-gray-600">Same-day dispatch applies to orders placed before 2:00 PM EST on business days.</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-[#f5970c] px-3.5 py-1 text-sm font-semibold text-[#233F31]">
              Same-day dispatch cutoff: 2:00 PM EST
            </span>
          </div>

          <div className="mt-6 divide-y divide-gray-100">
            {timeline.map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-[#262626]">{label}</span>
                <span className="text-sm font-medium text-gray-700 sm:text-right">{value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          {policySections.map((section) => (
            <div key={section.title} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-[#262626]">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#233F31]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-[#233F31]/10 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-[#262626]">Need Help With Shipping?</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
            If you have questions about your delivery or need assistance tracking a package, reach out to our support team:
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-[#F5F7FB] p-4">
              <MapPin className="h-5 w-5 text-[#233F31]" />
              <span className="text-sm font-medium text-[#262626]">United States</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[#F5F7FB] p-4">
              <Mail className="h-5 w-5 text-[#233F31]" />
              <span className="text-sm font-medium text-[#262626]">contact@bricoc.com</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[#F5F7FB] p-4">
              <Clock className="h-5 w-5 text-[#233F31]" />
              <span className="text-sm font-medium text-[#262626]">Mon-Fri, 9 AM-5 PM EST</span>
            </div>
          </div>

          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#233F31] px-5 py-3 text-sm font-semibold text-[#F0F6FF] transition hover:bg-[#0a0f32]"
          >
            Contact Support
          </Link>
        </section>
      </div>
    </main>
  );
}
