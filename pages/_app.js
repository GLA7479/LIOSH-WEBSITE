import "../styles/globals.css";
import Head from "next/head";
import { useEffect } from "react";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
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
      <Component {...pageProps} />
    </>
  );
}
