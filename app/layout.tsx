import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'Motoradar HUD',
  description: 'Hız, hava durumu ve yol durumu için motosiklet HUD',
  themeColor: '#00d1ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      <body className="relative min-h-screen overflow-hidden text-gray-50 antialiased">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute inset-x-20 top-1/3 h-72 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative z-10 min-h-screen">
          <ServiceWorkerRegister />
          {children}
        </div>
      </body>
    </html>
  );
}