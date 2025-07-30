import Header from "./Header";

export default function Layout({ children, video, page }) {
  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden">
      {/* רקע וידאו */}
      {video && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover -z-10"
          src={video}
        />
      )}

      {/* שכבת כהות */}
      {video && <div className="absolute inset-0 bg-black/50 -z-10"></div>}

      {/* Header */}
      <Header />

      {/* התוכן – הרמנו ב־3 ס"מ (הקטנו padding-top) */}
      <main className="relative z-10 pt-[65px]">{children}</main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 w-full text-center py-4 bg-black/40 text-sm">
        © {new Date().getFullYear()} LIOSH Token. All rights reserved.
      </footer>
    </div>
  );
}
