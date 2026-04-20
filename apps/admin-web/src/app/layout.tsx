import type { Metadata } from 'next';
import { Cairo, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-body',
  display: 'swap'
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-accent',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Wassel Delivery Admin',
  description: 'Operational control surface for the independent Wassel Delivery platform.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${spaceGrotesk.variable} surface`}>{children}</body>
    </html>
  );
}
