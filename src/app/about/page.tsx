import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AboutNotifier from '@/components/AboutNotifier';
import {
  Shield,
  Heart,
  Zap,
  CheckCircle2,
  Award,
  Target,
  Sparkles,
  Package,
  Eye,
  DollarSign,
  Leaf,
  Headphones,
  MapPin,
  Phone,
  Mail,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Bricoc Golf Carts',
  description:
    'Learn about Bricoc, your premier golf cart manufacturer specializing in high-performance electric, luxury, and street-legal golf carts across North America and the UK.',
};

export default function AboutPage() {
  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': 'https://bricoc.com/about#webpage',
        'url': 'https://bricoc.com/about',
        'name': 'About Bricoc',
        'description':
          'Bricoc is a premier manufacturer and retailer of high-performance electric and luxury golf carts serving customers across the United States and United Kingdom.',
        'mainEntity': {
          '@id': 'https://bricoc.com/#organization',
        },
      },
      {
        '@type': 'OnlineStore',
        '@id': 'https://bricoc.com/#organization',
        'name': 'Bricoc',
        'url': 'https://bricoc.com',
        'description':
          'Official brand and store for Bricoc electric golf carts, 4-passenger and 6-passenger vehicles, and parts.',
        'email': 'contact@bricoc.com',
        'telephone': ['+19129231747'],
        'address': [
          {
            '@type': 'PostalAddress',
            'streetAddress': 'Choats Rd',
            'addressLocality': 'Barking',
            'addressRegion': 'Dagenham',
            'postalCode': 'RM9 6BF',
            'addressCountry': 'GB',
          },
          {
            '@type': 'PostalAddress',
            'streetAddress': '305 Greif Pkwy',
            'addressLocality': 'Delaware',
            'addressRegion': 'OH',
            'postalCode': '43015',
            'addressCountry': 'US',
          },
        ],
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'telephone': '+19129231747',
            'contactType': 'customer service',
            'areaServed': ['GB', 'US'],
            'availableLanguage': ['en'],
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EB]/40">
      {/* Schema.org AboutPage & OnlineStore Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      <AboutNotifier />

      {/* Hero Section */}
      <div className="bg-[#233F31] text-[#FAF6EB] py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#789676]/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#FAF6EB] w-fit mb-4 border border-[#789676]/40">
            <span>⛳</span>
            <span>The Bricoc Standard</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white font-heading">About Bricoc Golf Carts</h1>
          <p className="text-lg sm:text-xl text-[#FAF6EB]/90 leading-relaxed max-w-3xl mx-auto">
            At Bricoc, we engineer and sell our own premium golf carts built for golf course greens, neighborhood cruising, and off-road utility. We are dedicated to delivering state-of-the-art lithium power, unmatched comfort, and direct manufacturer pricing.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        {/* US Presence */}
        <section className="mb-12 border-y border-[#233F31]/15 py-9">
          <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#233F31] text-[#FAF6EB]">
                <MapPin className="h-6 w-6 text-[#789676]" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#233F31] font-heading">Showroom & Fulfillment</h2>
            </div>
            <div className="space-y-4 text-base leading-7 text-gray-700">
              <p>
                Bricoc operates assembly, inspection, and dispatch facilities out of Delaware, Ohio, delivering golf carts directly to customers nationwide.
              </p>
              <p>
                Every vehicle undergoes a rigorous 40-point safety and electrical inspection prior to enclosed carrier transport to ensure turnkey readiness on arrival.
              </p>
              <Link href="/local-pickup" className="inline-flex font-semibold text-[#233F31] hover:text-[#789676] hover:underline">
                View our local pickup and delivery guide →
              </Link>
            </div>
          </div>
        </section>

        {/* Why Bricoc */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#233F31]/10 p-8 mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#233F31] font-heading">Why Choose Bricoc Golf Carts</h2>
          </div>
          <p className="text-gray-700 mb-8 text-base sm:text-lg">
            We manufacture our carts directly, cutting out middlemen markups while elevating build quality and component standards.
          </p>

          <div className="space-y-6">
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20 border-l-4 border-l-[#233F31]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#233F31] text-[#FAF6EB] rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#233F31] mb-2 font-heading">Cutting-Edge Lithium Powertrains</h3>
                  <p className="text-gray-700">
                    High-density lithium battery systems provide superior range, rapid charging, maintenance-free longevity, and zero acid leaks.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20 border-l-4 border-l-[#233F31]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#233F31] text-[#FAF6EB] rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#233F31] mb-2 font-heading">Custom Luxury Seating & Finishes</h3>
                  <p className="text-gray-700">
                    Ergonomic marine-grade upholstery, custom stitching, automotive-style dashboards, and premium sound systems come standard on our luxury trims.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20 border-l-4 border-l-[#233F31]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#233F31] text-[#FAF6EB] rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#233F31] mb-2 font-heading">Enclosed White-Glove Nationwide Delivery</h3>
                  <p className="text-gray-700">
                    We ship our golf carts fully assembled in protected enclosed transport directly to your driveway, ready to turn the key and ride.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div className="bg-[#233F31] rounded-2xl shadow-lg p-10 mb-12 text-[#FAF6EB] text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#789676]/25 rounded-full mb-6 border border-[#789676]/40">
            <Target className="h-8 w-8 text-[#FAF6EB]" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white font-heading">Our Mission</h2>
          <p className="text-xl text-[#FAF6EB]/90 mb-4 max-w-2xl mx-auto">
            To provide riders with the ultimate combination of luxury, efficiency, and safety in modern personal electric transportation.
          </p>
        </div>

        {/* What Makes Us Different */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#233F31]/10 p-8 mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#789676]/20 rounded-xl">
              <Sparkles className="h-8 w-8 text-[#233F31]" />
            </div>
            <h2 className="text-3xl font-bold text-[#233F31] font-heading">The Bricoc Advantage</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <Package className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Factory Direct</h3>
              </div>
              <p className="text-gray-700">Built in our facilities with direct factory quality assurance and continuous engineering updates.</p>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Transparent Specs</h3>
              </div>
              <p className="text-gray-700">Detailed motor kilowatts, battery amp-hours, top speeds, and range metrics provided for every model.</p>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Transparent Value</h3>
              </div>
              <p className="text-gray-700">No hidden dealer prep fees or unexpected destination surcharges.</p>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <Headphones className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Dedicated Support</h3>
              </div>
              <p className="text-gray-700">Dedicated golf cart technicians available to assist with maintenance, setup, and parts replacement.</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#233F31]/10 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#789676]/20 rounded-xl">
              <Phone className="h-8 w-8 text-[#233F31]" />
            </div>
            <h3 className="text-2xl font-bold text-[#233F31] font-heading">Contact Information</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-[#233F31]" />
                <div className="font-bold text-[#233F31]">UK Registered Office</div>
              </div>
              <div className="text-gray-600 ml-8">Choats Rd, Barking, Dagenham RM9 6BF, United Kingdom</div>
            </div>
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-[#233F31]" />
                <div className="font-bold text-[#233F31]">US Showroom & Dispatch</div>
              </div>
              <div className="text-gray-600 ml-8">305 Greif Pkwy, Delaware, OH 43015, United States</div>
            </div>
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-[#233F31]" />
                <div className="font-bold text-[#233F31]">Phone Support</div>
              </div>
              <div className="ml-8 text-gray-600">
                <a href="tel:+19129231747" className="hover:text-[#233F31] font-medium">
                  +19129231747
                </a>
              </div>
            </div>
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="h-5 w-5 text-[#233F31]" />
                <div className="font-bold text-[#233F31]">Email:</div>
              </div>
              <div className="text-gray-600 ml-8">
                <a href="mailto:contact@bricoc.com" className="hover:text-[#233F31] font-medium">
                  contact@bricoc.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
