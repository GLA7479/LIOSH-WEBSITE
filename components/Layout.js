import { useEffect, useRef } from "react";
import Header from "./Header";
import { Footer, FloatingPresaleButton } from "./Header"; // ✅ נוספו היבוא של הפוטר והכפתור

export default function Layout({ children, video, page }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [video]);

  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden">
      {video && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="fixed top-0 left-0 w-full h-full object-cover -z-10"
          src={video}
        />
      )}

      {video && <div className="absolute inset-0 bg-black/50 -z-10"></div>}

      <Header />

      <main className="relative z-10 pt-[65px]">{children}</main>

      {/* ✅ כפתור צף לפריסייל */}
      <FloatingPresaleButton />

      {/* ✅ פוטר חדש עם פרטי יצירת קשר */}
      <Footer />
    </div>
  );
}
