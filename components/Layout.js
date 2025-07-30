import Header from "./Header";

export default function Layout({ children, video }) {
  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden">
      {/* רקע וידאו */}
      {video && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10"
          src={video} // ווידאו נשלח כפרופס
        />
      )}

      {/* שכבת כהות עדינה */}
      <div className="absolute inset-0 bg-black/40 -z-10"></div>

      {/* Header קבוע */}
      <Header />

      {/* תוכן העמוד */}
      <main className="pt-32">{children}</main>

      {/* Footer קבוע */}
      <footer className="absolute bottom-0 left-0 w-full text-center py-4 bg-black/40 text-sm">
        © {new Date().getFullYear()} LIOSH Token. All rights reserved.
      </footer>
    </div>
  );
}
