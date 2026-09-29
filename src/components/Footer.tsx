import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MessageSquare, MapPin, Instagram } from 'lucide-react';

const socialIconClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#789676]/60 text-[#FAF6EB] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#789676] hover:bg-[#789676] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#233F31]';

const Footer = () => {
  return (
    <footer className="bg-[#233F31] text-[#FAF6EB]">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/logosvg.svg"
                alt="Bricoc Logo"
                width={160}
                height={44}
                className="h-auto w-36 sm:w-40 text-white"
              />
            </Link>
            <p className="mb-4 text-[#FAF6EB]/90 text-sm leading-relaxed">
              Bricoc is a premier golf cart brand dedicated to manufacturing exceptional electric, luxury, and street-legal golf carts designed for comfort, power, and everyday convenience.
            </p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center">
                <MessageSquare className="h-4.5 w-4.5 shrink-0 text-[#789676] mr-2" />
                <span className="text-[#FAF6EB]/90 font-medium">24/7 Live Chat Support Available</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4.5 w-4.5 text-[#789676] mr-2" />
                <a href="mailto:contact@bricoc.com" className="hover:text-white hover:underline transition-colors duration-200">
                  contact@bricoc.com
                </a>
              </div>
              <div className="flex items-start">
                <MapPin className="h-4.5 w-4.5 shrink-0 text-[#789676] mr-2 mt-1" />
                <div>
                  <span className="block font-semibold text-white">Business Address</span>
                  <span className="text-[#FAF6EB]/80 text-xs sm:text-sm">1731 Matthews Ave APT 4A, Bronx, New York 10462, United States</span>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <a
                  href="https://www.instagram.com/bricocofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialIconClass}
                  aria-label="Follow Bricoc on Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4 tracking-wide uppercase">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white hover:underline transition-colors duration-200">Home</Link></li>
              <li><Link href="/#products" className="hover:text-white hover:underline transition-colors duration-200">Golf Carts & Inventory</Link></li>
              <li><Link href="/#featured" className="hover:text-white hover:underline transition-colors duration-200">Featured Models</Link></li>
              <li><Link href="/track" className="hover:text-white hover:underline transition-colors duration-200">Track Order</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline transition-colors duration-200">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold text-white mb-4 tracking-wide uppercase">Policies & Info</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy-policy" className="hover:text-white hover:underline transition-colors duration-200">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white hover:underline transition-colors duration-200">Terms of Service</Link></li>
              <li><Link href="/about" className="hover:text-white hover:underline transition-colors duration-200">About Bricoc</Link></li>
              <li><Link href="/frequently-asked-questions" className="hover:text-white hover:underline transition-colors duration-200">FAQs</Link></li>
              <li><Link href="/return-policy" className="hover:text-white hover:underline transition-colors duration-200">Refund & Return Policy</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white hover:underline transition-colors duration-200">Shipping & Delivery Policy</Link></li>
              <li><Link href="/local-pickup" className="hover:text-white hover:underline transition-colors duration-200">Local Pickup Guide</Link></li>
              <li><Link href="/contact" className="hover:text-white hover:underline transition-colors duration-200">Customer Support</Link></li>
              <li><Link href="/cookies" className="hover:text-white hover:underline transition-colors duration-200">Cookies Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/15 mt-12 pt-8">
          <div className="flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-[#FAF6EB]/70 sm:text-sm">© 2025 Bricoc. All rights reserved. bricoc.com</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
              {[
                { src: '/payment-logos/visa.svg', alt: 'Visa' },
                { src: '/payment-logos/mastercard.svg', alt: 'Mastercard' },
                { src: '/payment-logos/american-express.svg', alt: 'American Express' },
                { src: '/payment-logos/discover.svg', alt: 'Discover' },
                { src: '/payment-logos/maestro.svg', alt: 'Maestro' },
                { src: '/payment-logos/jcb.svg', alt: 'JCB' },
                { src: '/payment-logos/unionpay.svg', alt: 'UnionPay' },
                { src: '/payment-logos/diners.svg', alt: 'Diners Club' },
                { src: '/payment-logos/apple-pay.svg', alt: 'Apple Pay' },
                { src: '/payment-logos/google-pay.svg', alt: 'Google Pay' },
              ].map((logo) => (
                <span
                  key={logo.src}
                  className="flex h-9 min-w-[3.5rem] items-center justify-center rounded-md bg-white px-2"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={52}
                    height={32}
                    className="max-h-6 w-auto object-contain"
                  />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
