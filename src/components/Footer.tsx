import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Instagram } from 'lucide-react';

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
                <Phone className="h-4.5 w-4.5 shrink-0 text-[#789676] mr-2" />
                <a href="tel:+19129231747" className="hover:text-white hover:underline transition-colors duration-200">
                  <span className="font-semibold text-white">United States:</span> +19129231747
                </a>
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
                  href="https://www.tiktok.com/@bricoc_officiel"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialIconClass}
                  aria-label="Follow Bricoc on TikTok"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/bricoc_officiel/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialIconClass}
                  aria-label="Follow Bricoc on Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.pinterest.com/bricoc_officiel/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={socialIconClass}
                  aria-label="Follow Bricoc on Pinterest"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.936 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
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
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center">
              <Image
                src="/secure-checkout.png"
                alt="Secure Checkout"
                width={400}
                height={64}
                className="h-16 w-auto max-w-full object-contain brightness-110 contrast-110"
              />
            </div>
            <p className="text-center text-xs sm:text-sm text-[#FAF6EB]/70">© 2025 Bricoc. All rights reserved. bricoc.com</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
