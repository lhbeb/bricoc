"use client";

import Image from 'next/image';
import React, { useEffect, useRef } from 'react';

const Hero = () => {
  const typingTextRef = useRef<HTMLSpanElement>(null);
  const placeholder = '\u00a0';

  useEffect(() => {
    const element = typingTextRef.current;
    if (!element) return;

    const words = [
      'Electric Golf Carts',
      'Luxury 4-Passenger Carts',
      '6-Passenger Street Carts',
      'All-Terrain Utility Carts'
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
                Elevate Your Ride With Premium Electric Golf Carts
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 max-w-[580px] text-sm leading-relaxed text-[#FAF6EB]/85 md:text-base">
              Experience the pinnacle of comfort, range, and style. Our premium Bricoc golf carts feature cutting-edge lithium technology, custom seating, and road-ready versatility.
            </p>
          </div>

          {/* Image panel */}
          <div className="relative order-1 min-h-[280px] overflow-hidden md:order-2 md:min-h-0 bg-[#233F31]/20">
            <Image
              src="/bg.png"
              alt="Bricoc luxury electric golf cart"
              fill
              priority
              sizes="(max-width: 767px) 100vw, 50vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#233F31]/60 via-transparent to-transparent" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
