'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  useEffect(() => {
    // Enregistrement du Service Worker
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }

    // Configuration PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Auto-update du SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="application-name" content="Checkinly" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Checkinly" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#1e40af" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        <title>Checkinly - Gestion d'inventaires locatifs</title>
        <meta name="description" content="Application PWA pour gérer vos inventaires de locations courte durée avec Stripe, QR codes et automatisation complète." />
        <meta name="keywords" content="location airbnb, inventaire, caution, stripe, pwa, gestion locative" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Checkinly - Gestion d'inventaires locatifs" />
        <meta property="og:description" content="Gérez vos inventaires de locations courte durée avec notre PWA complète" />
        <meta property="og:site_name" content="Checkinly" />
        <meta property="og:url" content="https://checkinly.com" />
        <meta property="og:image" content="/icons/icon-512x512.png" />
        
        <script type="application/ld+json">
          {`{
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Checkinly",
            "operatingSystem": "Web",
            "applicationCategory": "BusinessApplication",
            "description": "Application PWA pour gérer vos inventaires de locations courte durée",
            "url": "https://checkinly.com",
            "author": {
              "@type": "Organization",
              "name": "Checkinly"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            }
          }`}
        </script>
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}