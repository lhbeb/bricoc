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
  title: 'About Bricoc | Golf Bags & Accessories',
  description:
    'Learn about Bricoc and browse the golf bags, leather gloves, and golf ball accessories currently listed in our catalog.',
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
          'Bricoc is an online store offering golf bags, leather golf gloves, and golf ball carriers and dispensers.',
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
          'Online catalog of golf bags, leather gloves, and golf ball accessories.',
        'email': 'contact@bricoc.com',
        'telephone': ['+19786649000'],
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': '1731 Matthews Ave APT 4A',
          'addressLocality': 'Bronx',
          'addressRegion': 'NY',
          'postalCode': '10462',
          'addressCountry': 'US',
        },
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'telephone': '+19786649000',
            'contactType': 'customer service',
            'areaServed': ['US'],
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
            <span>Golf Gear at Bricoc</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white font-heading">About Bricoc Golf Gear</h1>
          <p className="text-lg sm:text-xl text-[#FAF6EB]/90 leading-relaxed max-w-3xl mx-auto">
            Bricoc&apos;s current catalog features golf bags, leather golf gloves, and golf ball carriers and dispensers. Review each listing for its product details, price, images, and availability.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-12">
        {/* Store Information */}
        <section className="mb-12 border-y border-[#233F31]/15 py-9">
          <div className="grid gap-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#233F31] text-[#FAF6EB]">
                <MapPin className="h-6 w-6 text-[#789676]" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#233F31] font-heading">Our Online Catalog</h2>
            </div>
            <div className="space-y-4 text-base leading-7 text-gray-700">
              <p>
                The Bricoc website lists golf bags and accessories for golfers, including stand and cart bags, leather gloves, and products for carrying and organizing golf balls.
              </p>
              <p>
                Product pages provide the available information for each item. Please review the shipping and return policies for order and delivery details.
              </p>
              <Link href="/shipping-policy" className="inline-flex font-semibold text-[#233F31] hover:text-[#789676] hover:underline">
                Read the shipping policy →
              </Link>
            </div>
          </div>
        </section>

        {/* Why Bricoc */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#233F31]/10 p-8 mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-[#233F31] font-heading">Golf Essentials in the Bricoc Catalog</h2>
          </div>
          <p className="text-gray-700 mb-8 text-base sm:text-lg">
            Browse the current selection of golf bags and accessories, with item details and availability shown on each product page.
          </p>

          <div className="space-y-6">
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20 border-l-4 border-l-[#233F31]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-[#233F31] text-[#FAF6EB] rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#233F31] mb-2 font-heading">Golf Bags</h3>
                  <p className="text-gray-700">
                    Browse stand and cart bags with product-specific club organization and storage details listed on their pages.
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
                  <h3 className="text-xl font-bold text-[#233F31] mb-2 font-heading">Leather Golf Gloves</h3>
                  <p className="text-gray-700">
                    See the current glove listings for available product information, pricing, and ordering details.
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
                  <h3 className="text-xl font-bold text-[#233F31] mb-2 font-heading">Golf Ball Accessories</h3>
                  <p className="text-gray-700">
                    Find golf ball carriers and dispensers in the accessories section of the catalog.
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
          <h2 className="text-3xl font-bold mb-4 text-white font-heading">Our Approach</h2>
          <p className="text-xl text-[#FAF6EB]/90 mb-4 max-w-2xl mx-auto">
            To make it straightforward to browse golf bags and accessories, understand each listing, and find support when questions come up.
          </p>
        </div>

        {/* What Makes Us Different */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#233F31]/10 p-8 mb-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-[#789676]/20 rounded-xl">
              <Sparkles className="h-8 w-8 text-[#233F31]" />
            </div>
            <h2 className="text-3xl font-bold text-[#233F31] font-heading">Shopping with Bricoc</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <Package className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Current Listings</h3>
              </div>
              <p className="text-gray-700">Browse the products currently shown in our online catalog and check each page for availability.</p>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <Eye className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Product Details</h3>
              </div>
              <p className="text-gray-700">Review the description, images, and other available information on each product page before ordering.</p>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Listed Pricing</h3>
              </div>
              <p className="text-gray-700">Product prices are displayed on their listings; review checkout and policy details for order charges and delivery terms.</p>
            </div>

            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-3">
                <Headphones className="h-6 w-6 text-[#233F31]" />
                <h3 className="text-xl font-bold text-[#233F31] font-heading">Customer Support</h3>
              </div>
              <p className="text-gray-700">Contact our team with questions about a listed product, an order, shipping, or returns.</p>
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
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-[#233F31]" />
                <div className="font-bold text-[#233F31]">Business Address</div>
              </div>
              <div className="text-gray-600 ml-8">1731 Matthews Ave APT 4A, Bronx, New York 10462, United States</div>
            </div>
            <div className="bg-[#FAF6EB]/50 rounded-xl p-6 border border-[#789676]/20">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-[#233F31]" />
                <div className="font-bold text-[#233F31]">Phone Support</div>
              </div>
              <div className="ml-8 text-gray-600">
                <a href="tel:+19786649000" className="hover:text-[#233F31] font-medium">
                  +1(978) 664-9000
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
