import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, HelpCircle, Plus } from 'lucide-react';
import { STORE_FAQS } from '@/lib/storeFaqs';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Bricoc Golf Carts',
  description:
    'Find answers about Bricoc golf carts, electric models, custom builds, delivery, warranty, returns, and support.',
  alternates: {
    canonical: 'https://bricoc.com/frequently-asked-questions',
  },
};

export default function FrequentlyAskedQuestionsPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STORE_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#FAF6EB]/40">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="bg-[#233F31] px-4 py-14 text-[#FAF6EB] sm:py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#789676]/30 border border-[#789676]/40 text-[#FAF6EB]">
            <HelpCircle className="h-6 w-6 text-[#789676]" aria-hidden="true" />
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl text-white font-heading">
            Frequently Asked Questions
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#FAF6EB]/80 sm:text-lg">
            Straightforward answers about our golf carts, battery specs, custom options, delivery, and warranty support at Bricoc.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16" aria-label="Frequently asked questions">
        <div className="container mx-auto max-w-4xl">
          <div className="divide-y divide-[#233F31]/10 rounded-2xl border border-[#233F31]/10 bg-white px-5 sm:px-8 shadow-sm">
            {STORE_FAQS.map((faq) => (
              <details key={faq.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-base font-bold text-[#233F31] marker:content-none sm:py-6 sm:text-lg">
                  <span>{faq.question}</span>
                  <Plus
                    className="h-5 w-5 shrink-0 text-[#789676] transition-transform duration-200 group-open:rotate-45"
                    aria-hidden="true"
                  />
                </summary>
                <div className="max-w-3xl pb-6 pr-8 text-sm leading-7 text-gray-600 sm:text-base">
                  <p>{faq.answer}</p>
                  {faq.linkHref && faq.linkLabel && (
                    <Link
                      href={faq.linkHref}
                      className="mt-3 inline-flex items-center gap-1.5 font-semibold text-[#233F31] hover:text-[#789676] underline decoration-[#789676] decoration-2 underline-offset-4"
                    >
                      {faq.linkLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#233F31] p-6 text-[#FAF6EB] sm:flex-row sm:items-center sm:p-8 shadow-lg">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl text-white font-heading">Still have questions about our golf carts?</h2>
              <p className="mt-2 text-sm text-[#FAF6EB]/80 sm:text-base">
                Speak directly with a Bricoc golf cart expert today.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FAF6EB] px-6 py-3 text-sm font-bold text-[#233F31] transition-colors hover:bg-white shadow-sm"
            >
              Contact Specialists
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
