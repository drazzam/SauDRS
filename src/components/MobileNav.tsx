'use client';

import { useState, useEffect, useRef } from 'react';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close menu on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
      >
        {open ? (
          /* X icon */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        ) : (
          /* Hamburger icon */
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          <a
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 min-h-[44px]"
          >
            Home
          </a>
          <a
            href="/predict"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-t border-gray-100 min-h-[44px]"
          >
            Risk Calculator
          </a>
          <a
            href="/methodology"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-t border-gray-100 min-h-[44px]"
          >
            Model Information
          </a>
          <a
            href="/about"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-t border-gray-100 min-h-[44px]"
          >
            About
          </a>
        </nav>
      )}
    </div>
  );
}
