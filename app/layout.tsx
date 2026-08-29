import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KisanSetu (किसान सेतु) — AI Price Discovery & Fair Negotiation',
  description:
    'Web-based PWA platform strengthening market linkages, AI quality grading, and automated bargaining for smallholder farmers. (SIH26132)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌾</text></svg>" />
      </head>
      <body className="min-h-screen bg-brand-cream text-brand-soil-900 antialiased selection:bg-brand-green-200">
        {children}
      </body>
    </html>
  );
}
