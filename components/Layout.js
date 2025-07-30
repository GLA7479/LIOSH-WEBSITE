import Header from "./Header";
import { siteConfig } from "../config";
import { useEffect, useState } from "react";

export default function Layout({ page, children }) {
  const settings = siteConfig.pages[page];
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowVideo(true), 500); // טעינה אחרי חצי שנייה
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ fontFamily: siteConfig.font }}>
      {showVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          poster="/images/fallback.jpg"
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        >
          <source src={settings.video} type="video/mp4" />
        </video>
      ) : (
        <img
          src="/images/fallback.jpg"
          alt="Background"
          className="absolute top-0 left-0 w-full h-full object-cover -z-10"
        />
      )}
      <Header />
      <main className="relative z-10 flex flex-col items-center justify-center text-white text-center px-4">
        <h1 className="text-5xl font-extrabold mb-6">{settings.title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed animate-pulse">{settings.text}</p>
        {children}
      </main>
    </div>
  );
}
