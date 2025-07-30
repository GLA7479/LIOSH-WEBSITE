import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="relative w-full min-h-screen text-white overflow-hidden">
      {/* הווידאו הוסר כאן */}

      {/* שכבת כהות עדינה */}
      <div className="absolute inset-0 bg-black/40 -z-10"></div>

      {/* Header */}
      <Header />

      {/* תוכן העמוד */}
      <main className="pt-32">{children}</main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 w-full text-center py-4 bg-black/40 text-sm">
        © {new Date().getFullYear()} LIOSH Token. All rights reserved.
      </footer>
    </div>
  );
}
