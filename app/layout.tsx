import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO API — AgentForge Tools',
  description: 'REST API + visual interface for SEO analysis: keyword density, readability, meta tags, SERP preview, ROI, and page speed.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg text-text font-body antialiased">{children}</body>
    </html>
  );
}
