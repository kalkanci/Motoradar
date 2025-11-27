import './globals.css';
import type { Metadata } from 'next';
import React, { useEffect } from 'react';

export const metadata: Metadata = {
  title: 'Radar Uygulaması',
  description: 'Gerçek zamanlı deprem ve hava durumu radarı',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Servis çalışanını kaydet
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service worker registration failed:', err);
      });
    }
  }, []);

  return (
    <html lang="tr" className="dark">
      <head>
        {/* Google font için bağlantı */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Favicon ve tema renkleri */}
        <link rel="icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-gray-900 text-gray-100">
        {children}
      </body>
    </html>
  );
}