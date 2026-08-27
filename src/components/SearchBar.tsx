"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Search, ArrowRight } from "lucide-react";

interface SearchBarProps {
  open: boolean;
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      onClose();
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Trap focus in overlay
  useEffect(() => {
    if (!open) return;
    const handleFocus = (e: FocusEvent) => {
      if (inputRef.current && e.target !== inputRef.current) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && e.target !== inputRef.current) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return open ? (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-label="Close search overlay"
      />
      {/* Centered search bar (desktop) */}
      <div className="hidden md:flex fixed left-0 right-0 top-[100px] z-50 justify-center items-start pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white shadow-2xl rounded-full border border-[#233F31]/20 px-6 py-3.5 flex items-center gap-3 pointer-events-auto animate-scale-fade-in"
          style={{ boxShadow: "0 12px 40px 0 rgba(35, 63, 49, 0.2)" }}
        >
          <Search className="h-5 w-5 text-[#233F31]/70" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search golf carts, models, accessories..."
            className="bg-transparent outline-none border-0 flex-1 min-w-0 text-[#233F31] placeholder-[#233F31]/50 text-base font-medium"
            autoFocus={open}
            onKeyDown={handleKeyDown}
            aria-label="Search golf carts"
          />
          {query.length > 0 && (
            <ArrowRight className="h-5 w-5 text-[#233F31] animate-bounce-x ml-1" aria-label="Press Enter to search" />
          )}
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-[#233F31] p-1" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {/* Mobile search bar */}
      <div className="md:hidden fixed left-4 right-4 top-4 z-50 animate-scale-fade-in">
        <div
          className="w-full bg-white shadow-2xl rounded-full border border-[#233F31]/20 px-4 py-3 flex items-center gap-3"
        >
          <Search className="h-5 w-5 text-[#233F31]/70" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search golf carts..."
            className="bg-transparent outline-none border-0 flex-1 min-w-0 text-[#233F31] placeholder-[#233F31]/50 text-sm font-medium"
            autoFocus={open}
            onKeyDown={handleKeyDown}
            aria-label="Search golf carts"
          />
          {query.length > 0 && (
            <ArrowRight className="h-5 w-5 text-[#233F31] animate-bounce-x ml-1" aria-label="Press Enter to search" />
          )}
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-[#233F31] p-1" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  ) : null;
};

export default SearchBar;
