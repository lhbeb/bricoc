"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe2 } from 'lucide-react';

export interface CountryOption {
  code: string;
  name: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸',
  CA: '🇨🇦',
  FR: '🇫🇷',
  DE: '🇩🇪',
  AU: '🇦🇺',
  NZ: '🇳🇿',
  IT: '🇮🇹',
  NL: '🇳🇱',
  PT: '🇵🇹',
  ES: '🇪🇸',
  PL: '🇵🇱',
  AT: '🇦🇹',
};

export function getCountryFlag(code: string): string {
  return COUNTRY_FLAGS[code.toUpperCase()] || '🌐';
}

interface CountrySelectProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  countries: CountryOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function CountrySelect({
  id = 'countryCode',
  name = 'countryCode',
  value,
  onChange,
  countries,
  placeholder = 'Select delivery country',
  disabled = false,
  required = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find(
    c => c.code.toUpperCase() === value?.toUpperCase()
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation (Escape closes)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange({
      target: {
        name,
        value: code,
      },
    });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for form submission & accessibility */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        required={required}
      />

      {/* Main Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-4 py-3.5 sm:py-4 border-2 rounded-xl bg-white flex items-center justify-between text-left transition-all duration-200 cursor-pointer select-none ${
          isOpen
            ? 'border-[#090A28] ring-2 ring-[#090A28]/10 shadow-md'
            : 'border-gray-200 hover:border-gray-300 shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {selectedCountry ? (
            <span className="text-xl leading-none flex-shrink-0">
              {getCountryFlag(selectedCountry.code)}
            </span>
          ) : (
            <Globe2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
          )}

          <span
            className={`text-sm sm:text-base font-medium truncate ${
              selectedCountry ? 'text-[#262626]' : 'text-gray-400'
            }`}
          >
            {selectedCountry ? selectedCountry.name : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-[#090A28]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {countries.map(country => {
            const isSelected =
              country.code.toUpperCase() === value?.toUpperCase();
            return (
              <button
                key={country.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(country.code)}
                className={`w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-sm sm:text-base transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#090A28]/5 text-[#090A28] font-bold'
                    : 'text-[#262626] hover:bg-gray-50 font-medium'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-xl leading-none flex-shrink-0">
                    {getCountryFlag(country.code)}
                  </span>
                  <span className="truncate">{country.name}</span>
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 text-[#090A28] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
