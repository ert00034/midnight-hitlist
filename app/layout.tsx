import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Midnight Hitlist',
  description: 'Track WoW addon impacts from Midnight API changes, with Wowhead articles.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-[#0b1020] bg-arcane-gradient text-slate-100">
        <div className="mx-auto max-w-6xl px-4">
          {children}
        </div>
      </body>
    </html>
  );
}


