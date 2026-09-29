"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef } from 'react';
import type { Product } from '@/types/product';

interface HeroProps {
  products?: Product[];
}

const Hero = ({ products = [] }: HeroProps) => {
  const typingTextRef = useRef<HTMLSpanElement>(null);
  const placeholder = '\u00a0';
  const heroProduct = products.find(
    (product) => product.category?.trim().toLowerCase() === 'golf bags' && product.images?.[0],
  ) || products.find((product) => product.images?.[0]);

  useEffect(() => {
    const element = typingTextRef.current;
    if (!element) return;

    const words = [
      'Golf Bags',
      'Leather Golf Gloves',
      'Golf Ball Carriers',
      'Golf Ball Dispensers'
    ];
    let isAnimating = true;
    let currentIndex = 0;

    const sleep = (duration: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, duration));

    const typeWord = async (word: string) => {
      element.textContent = '';
      const letters = word.split('');
      for (const letter of letters) {
        if (!isAnimating) return;
        element.textContent = `${element.textContent}${letter}`;
        await sleep(80);
      }
    };

    const deleteWord = async () => {
      while (isAnimating && (element.textContent?.length ?? 0) > 0) {
        element.textContent = element.textContent?.slice(0, -1) ?? '';
        await sleep(35);
      }
      element.textContent = placeholder;
    };

    const animateLoop = async () => {
      element.textContent = placeholder;

      while (isAnimating) {
        const word = words[currentIndex];

        await typeWord(word);
        if (!isAnimating) break;

        await sleep(2200);
        if (!isAnimating) break;

        await deleteWord();
        if (!isAnimating) break;

        await sleep(300);
        if (!isAnimating) break;

        currentIndex = (currentIndex + 1) % words.length;
      }
    };

    animateLoop();

    return () => {
      isAnimating = false;
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#FAF6EB]">
      <div className="container relative z-10 mx-auto px-4 py-8 md:py-10">
        <div className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-2xl shadow-xl md:min-h-[440px] md:grid-cols-[1fr_1fr] md:items-stretch border border-[#233F31]/10">
          {/* Content panel */}
          <div className="order-2 flex w-full flex-col justify-center bg-[#233F31] p-6 sm:p-8 md:order-1 md:p-10 lg:p-12 text-[#FAF6EB]">
            {/* Heading with typing animation */}
            <h1 className="max-w-[620px] text-2xl font-bold leading-tight text-[#FAF6EB] md:text-3xl lg:text-[36px]">
              <span
                ref={typingTextRef}
                className="mb-1 block h-[1.2em] text-[#789676]"
              >
                {placeholder}
              </span>
              <span className="block leading-tight text-white">
              Golf Bags & Accessories for Your Game
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 max-w-[580px] text-sm leading-relaxed text-[#FAF6EB]/85 md:text-base">
              Browse the Bricoc catalog for golf stand bags, cart bags, leather gloves, and practical accessories for carrying and organizing golf balls.
            </p>
            <Link
              href="/search?query=golf"
              className="mt-6 inline-flex w-fit items-center justify-center rounded-full bg-[#789676] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#688566]"
            >
              Shop Current Products
            </Link>
          </div>

          {/* Image panel */}
          <div className="relative order-1 min-h-[280px] overflow-hidden bg-white md:order-2 md:min-h-0">
            {heroProduct?.images[0] && (
              <Image
                src={heroProduct.images[0]}
                alt={heroProduct.title}
                fill
                priority
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-contain p-6 sm:p-10"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
