import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";
import OfflineIndicator from "../components/OfflineIndicator";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Unregister ALL service workers to prevent caching issues
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Always unregister service workers - they cause issues
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister().then(() => {
            console.log("[SW] Unregistered:", registration.scope);
          });
        });
      });
      
      // Don't register new service workers
      return;

      const registerSW = () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log("[SW] Registered successfully:", registration.scope);
            
            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000); // Check every hour
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to reload
                  if (confirm('עדכון זמין! האם ברצונך לרענן את הדף?')) {
                    window.location.reload();
                  }
                }
              });
            });
          })
          .catch((registrationError) => {
            console.error("[SW] Registration failed:", registrationError);
          });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener("load", registerSW);
      }
    }
  }, []);

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="description" content="LEO K - Fun games and learning activities for kids. Play arcade games, solve puzzles, and practice math, geometry and English." />
        <meta name="theme-color" content="#fbbf24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="LEO K" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#fbbf24" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Icons */}
        <link rel="icon" href="/images/leo-icons/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/leo-icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/leo-icons/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/images/leo-icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/images/leo-icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/images/leo-icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/images/leo-icons/apple-touch-icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/leo-icons/apple-touch-icon-180x180.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        <title>LEO K - Kids Games & Learning</title>
      </Head>
      <OfflineIndicator />
      <Component {...pageProps} />
    </>
  );
}
