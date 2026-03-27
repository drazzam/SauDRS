import type { Metadata } from 'next';
import '@/styles/globals.css';
import { MobileNav } from '@/components/MobileNav';

export const metadata: Metadata = {
  title: 'SauDRS \u2014 Saudi Prediabetes-to-Diabetes Risk Score',
  description: 'Clinical risk prediction system for prediabetes-to-diabetes conversion assessment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {/* Hide Next.js dev indicator */}
        <style dangerouslySetInnerHTML={{ __html: `
          [data-next-badge], nextjs-portal, #__next-build-watcher,
          [class*="nextjs-"], [id*="__next-route"] { display: none !important; }
          /* Prevent iOS zoom on input focus */
          input[type="number"], input[type="text"], select, textarea { font-size: 16px !important; }
        `}} />

        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-3 sm:gap-5 group min-w-0">
              <img
                src="/logos/PSMMC.png" alt="PSMMC"
                className="h-10 sm:h-14 w-auto flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
              />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">SauDRS</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">Saudi Prediabetes-to-Diabetes Risk Score</p>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="/" className="text-gray-600 hover:text-[#1E3A5F] font-medium">Home</a>
              <a href="/predict" className="text-gray-600 hover:text-[#1E3A5F] font-medium">Risk Calculator</a>
              <a href="/methodology" className="text-gray-600 hover:text-[#1E3A5F] font-medium">Model Information</a>
              <a href="/about" className="text-gray-600 hover:text-[#1E3A5F] font-medium">About</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="/" className="group">
                <img
                  src="/logos/MOD.png" alt="Ministry of Defense"
                  className="h-10 sm:h-14 w-auto transition-transform duration-200 group-hover:scale-110"
                />
              </a>
              {/* Mobile hamburger button */}
              <MobileNav />
            </div>
          </div>
        </header>

        <main className="min-h-[70vh]">{children}</main>

        <footer className="border-t border-gray-200 bg-gray-50 py-6 mt-12">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-500">
            <p className="font-medium">Prince Sultan Military Medical City | Ministry of Defense Health Services</p>
            <p className="mt-1">This clinical decision support tool assists qualified healthcare professionals in risk stratification.
            All predictions must be interpreted in the context of the individual patient&apos;s complete clinical picture.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
