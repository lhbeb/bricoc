"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ShoppingCart, Menu, X, Search, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { getCartCount } from '@/utils/cart';
import ClientOnly from './ClientOnly';
import SearchBar from './SearchBar';

const catalogNavigation = [
  { label: 'Golf Bags', href: '/search?category=Golf%20Bags' },
  { label: 'Golf Accessories', href: '/search?category=Golf%20Accessories' },
  { label: 'Featured', href: '/#featured' },
  { label: 'Track Order', href: '/track' },
  { label: 'FAQs', href: '/frequently-asked-questions' },
  { label: 'Contact', href: '/contact' },
] as const;

const desktopNavLinkClass =
  'relative py-1 text-sm font-medium text-white transition-colors duration-200 hover:text-[#FAF6EB] focus-visible:text-[#FAF6EB] focus-visible:outline-none after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[#FAF6EB] after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:after:scale-x-100';

const mobileMenuLinkClass =
  'text-center font-medium text-[#233F31] transition-colors duration-200 hover:text-[#789676] focus-visible:text-[#789676] focus-visible:outline-none';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const announcementIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on the checkout page
  const isCheckoutPage = pathname === '/checkout';

  const announcements = [
    <span key="nav-1">🚚 <span className="font-bold">Free Nationwide Delivery</span> On All Bricoc Golf Carts ⛳</span>,
    <span key="nav-2">⚡ <span className="font-bold">Premium Lithium Power</span> & <span className="font-bold">3-Year Warranty</span></span>,
    "whatsapp-contact" // Special marker for WhatsApp announcement
  ];

  // Announcement bar animation
  useEffect(() => {
    const startAnnouncementRotation = () => {
      announcementIntervalRef.current = setInterval(() => {
        setCurrentAnnouncement(prev => (prev + 1) % announcements.length);
      }, 2500);
    };

    startAnnouncementRotation();

    return () => {
      if (announcementIntervalRef.current) {
        clearInterval(announcementIntervalRef.current);
      }
    };
  }, [announcements.length]);

  const handleAnnouncementNavigation = (direction: 'prev' | 'next') => {
    if (announcementIntervalRef.current) {
      clearInterval(announcementIntervalRef.current);
    }

    setCurrentAnnouncement(prev => {
      if (direction === 'prev') {
        return prev === 0 ? announcements.length - 1 : prev - 1;
      } else {
        return (prev + 1) % announcements.length;
      }
    });

    // Restart auto-rotation after manual navigation
    setTimeout(() => {
      announcementIntervalRef.current = setInterval(() => {
        setCurrentAnnouncement(prev => (prev + 1) % announcements.length);
      }, 2500);
    }, 100);
  };

  useEffect(() => {
    const updateCartCount = () => {
      if (typeof window !== 'undefined') {
        setCartCount(getCartCount());
      }
    };
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/checkout') {
        setIsSticky(false);
        return;
      }

      if (typeof window !== 'undefined') {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const promotionalBarHeight = 40;

        if (scrollTop > promotionalBarHeight) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  const handleCartClick = () => {
    if (cartCount > 0) {
      router.push('/checkout');
    }
  };

  const handleMobileMenuClose = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* 1. Announcement Bar - Cream background (#FAF6EB) with Deep Forest Green text (#233F31) */}
      <div suppressHydrationWarning={true} className="bg-[#FAF6EB] text-[#233F31] py-2 relative overflow-hidden h-[40px] flex items-center border-b border-[#233F31]/10">
        <div suppressHydrationWarning={true} className="container mx-auto px-4 flex items-center justify-center relative w-full h-full text-xs sm:text-sm">
          {/* Announcement Text */}
          <div suppressHydrationWarning={true} className="text-center font-medium px-4 sm:px-16 transition-all duration-500 ease-in-out h-full flex items-center justify-center min-h-[24px]">
            {announcements[currentAnnouncement] === "whatsapp-contact" ? (
              <div key={currentAnnouncement} className="flex items-center justify-center animate-fade-in text-xs sm:text-sm h-full w-full">
                <a
                  href="https://wa.me/19129231747"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity flex-wrap justify-center text-[#233F31]"
                  aria-label="Contact Bricoc on WhatsApp"
                >
                  <Image
                    src="/whatsapp-svgrepo-com.svg"
                    alt="WhatsApp"
                    width={18}
                    height={18}
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 flex-shrink-0"
                  />
                  <span className="whitespace-nowrap">Golf Cart Specialist? <span className="font-bold">Chat with Bricoc</span></span>
                  <span className="underline whitespace-nowrap font-bold">+19129231747</span>
                </a>
              </div>
            ) : (
              <span key={currentAnnouncement} className="inline-block animate-fade-in whitespace-nowrap text-xs sm:text-sm h-full flex items-center text-[#233F31]">
                {announcements[currentAnnouncement]}
              </span>
            )}
          </div>

          {/* Desktop Carousel Navigation Arrows */}
          <button
            onClick={() => handleAnnouncementNavigation('prev')}
            className="hidden sm:block absolute left-1/2 transform -translate-x-60 p-1 hover:bg-[#233F31]/10 rounded-full transition-colors duration-200 z-10 text-[#233F31]"
            aria-label="Previous announcement"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => handleAnnouncementNavigation('next')}
            className="hidden sm:block absolute left-1/2 transform translate-x-56 p-1 hover:bg-[#233F31]/10 rounded-full transition-colors duration-200 z-10 text-[#233F31]"
            aria-label="Next announcement"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Header - Deep Forest Green (#233F31) */}
      <header
        ref={headerRef}
        suppressHydrationWarning={true}
        className={`transition-all duration-300 ${isSticky
          ? 'fixed top-0 left-0 right-0 z-50 shadow-md'
          : 'relative'
          }`}
      >
        <div suppressHydrationWarning={true} className="bg-[#233F31] text-white">
          <div suppressHydrationWarning={true} className="container mx-auto px-4 py-2 sm:py-2.5 lg:py-3">
            <div suppressHydrationWarning={true} className="flex items-center justify-between gap-4 sm:gap-6">
              
              {/* Logo - Bricoc Oval SVG */}
              <Link href="/" className="flex items-center space-x-2 flex-shrink-0 text-white hover:opacity-90 transition-opacity py-1">
                <Image
                  src="/logosvg.svg"
                  alt="Bricoc Logo"
                  width={180}
                  height={54}
                  priority
                  className="w-28 sm:w-32 md:w-36 lg:w-40 h-auto text-white"
                />
              </Link>

              {/* Desktop Search Bar - Rounded-full Pill Shape */}
              <div suppressHydrationWarning={true} className="hidden lg:flex flex-1 max-w-xl mx-8">
                <div
                  suppressHydrationWarning={true}
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full flex items-center bg-[#FAF6EB] text-[#233F31] rounded-full px-4 py-2 cursor-pointer transition-all hover:bg-white hover:shadow-md"
                >
                  <input
                    type="text"
                    placeholder="Search golf carts, bags, gloves, accessories..."
                    className="flex-1 bg-transparent outline-none text-sm text-[#233F31] placeholder-[#233F31]/60 cursor-pointer font-medium"
                    readOnly
                  />
                  <Search className="h-4.5 w-4.5 text-[#233F31]/70" />
                </div>
              </div>

              {/* Right Side Actions */}
              <div suppressHydrationWarning={true} className="flex items-center gap-3">
                {/* Mobile Search Icon - Visible when sticky or mobile */}
                {isSticky && (
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="lg:hidden text-white hover:text-[#FAF6EB] p-2 transition-colors duration-200"
                    aria-label="Search golf carts"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                )}

                {/* Help / Contact Icon - Desktop */}
                <Link
                  href="/contact"
                  className="hidden sm:flex items-center gap-1 text-white hover:text-[#FAF6EB] px-2.5 py-1.5 rounded-full hover:bg-white/10 transition-colors duration-200 text-sm font-medium"
                  aria-label="Contact Bricoc"
                >
                  <Info className="h-4.5 w-4.5" />
                  <span className="hidden xl:inline text-xs">Help</span>
                </Link>

                {/* Cart Action Button - Sage Green (#789676) Pill matching reference */}
                <button
                  onClick={handleCartClick}
                  className="relative flex items-center gap-2 bg-[#789676] hover:bg-[#688566] text-white px-3.5 py-1.5 rounded-full font-medium text-xs sm:text-sm transition-all duration-200 shadow-sm"
                  aria-label={`Shopping cart ${cartCount > 0 ? `with ${cartCount} items` : '(empty)'}`}
                >
                  <ShoppingCart className="h-4.5 w-4.5" />
                  <span className="hidden sm:inline font-medium">Cart</span>
                  <ClientOnly>
                    {cartCount > 0 && (
                      <span className="bg-[#FAF6EB] text-[#233F31] text-xs rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </ClientOnly>
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden text-white hover:text-[#FAF6EB] p-1.5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                  aria-label="Toggle mobile menu"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Below header when not sticky */}
        {!isSticky && !isCheckoutPage && (
          <div suppressHydrationWarning={true} className="lg:hidden bg-[#233F31] border-t border-white/10 px-4 py-2.5">
            <div
              suppressHydrationWarning={true}
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center bg-[#FAF6EB] rounded-full px-4 py-2 cursor-pointer shadow-inner"
            >
              <input
                type="text"
                placeholder="Search golf equipment & carts..."
                className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-[#233F31] placeholder-[#233F31]/60 cursor-pointer"
                readOnly
              />
              <Search className="h-4 w-4 text-[#233F31]/70" />
            </div>
          </div>
        )}

        {/* 3. Navigation Bar - Sage Green (#789676) */}
        <div suppressHydrationWarning={true} className="hidden lg:block bg-[#789676] border-t border-black/5">
          <div suppressHydrationWarning={true} className="container mx-auto px-4">
            <nav className="flex items-center justify-center gap-5 xl:gap-7 py-2.5 font-heading">
              {catalogNavigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={desktopNavLinkClass}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#FAF6EB] border-t border-[#233F31]/10 shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col font-heading text-sm space-y-1">
                {catalogNavigation.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="py-2.5 px-3 text-[#233F31] hover:bg-[#789676]/10 rounded-lg font-medium transition-colors"
                    onClick={handleMobileMenuClose}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="border-t border-[#233F31]/10 my-2 pt-2" />
                <Link href="/#featured" className="py-2.5 px-3 text-[#233F31] hover:bg-[#789676]/10 rounded-lg font-medium transition-colors" onClick={handleMobileMenuClose}>
                  Featured Carts
                </Link>
                <Link href="/track" className="py-2.5 px-3 text-[#233F31] hover:bg-[#789676]/10 rounded-lg font-medium transition-colors" onClick={handleMobileMenuClose}>
                  Track Order
                </Link>
                <Link href="/frequently-asked-questions" className="py-2.5 px-3 text-[#233F31] hover:bg-[#789676]/10 rounded-lg font-medium transition-colors" onClick={handleMobileMenuClose}>
                  FAQs
                </Link>
                <Link href="/contact" className="py-2.5 px-3 text-[#233F31] hover:bg-[#789676]/10 rounded-lg font-medium transition-colors" onClick={handleMobileMenuClose}>
                  Contact Us
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* SearchBar overlay */}
        <SearchBar open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </header>

      {/* Mobile Swipeable Menu - Below header */}
      {!isCheckoutPage && (
        <div suppressHydrationWarning={true} className="lg:hidden bg-[#789676] border-t border-black/5">
          <div suppressHydrationWarning={true} className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <nav className="flex min-w-max items-center gap-2 px-3 py-2">
              {catalogNavigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex-shrink-0 whitespace-nowrap rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium text-white transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/#featured"
                className="flex-shrink-0 whitespace-nowrap rounded-full bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-medium text-white transition-colors duration-200"
              >
                Featured
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
