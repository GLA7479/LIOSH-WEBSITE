import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "/game", label: "Games" },
  { href: "/offline", label: "Offline" },
  { href: "/learning", label: "Learning" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if it's a game page by checking the route
  const isGamePage =
    router.pathname.includes("/learning/") ||
    router.pathname.includes("/offline/") ||
    router.pathname.includes("/mleo-");

  if (isGamePage) {
    // For game pages, return only the children without header/footer
    return <>{children}</>;
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050816] via-[#0b1020] to-[#050816] text-white">
      <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-30">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold tracking-widest text-lg"
          >
            <img
              src="/images/coin.png"
              alt="Leo Kids Logo"
              className="w-8 h-8 object-contain"
              style={{ transform: "scale(1.9)" }}
            />
            <span>LEO KIDS</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-sm font-semibold">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-full hover:bg-white/10 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="md:hidden px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle Menu"
          >
            ☰
          </button>
        </nav>

      </header>

      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40">
          <div className="absolute top-4 right-4 bg-black/60 border border-white/10 rounded-2xl p-4 w-64">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm uppercase tracking-[0.3em] text-white/60">
                Menu
              </span>
              <button
                onClick={closeMenu}
                className="text-white/70 hover:text-white text-lg"
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-2 text-base font-semibold">
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="min-h-[calc(100vh-56px)]">{children}</main>
      <footer className="border-t border-white/10 bg-black/40 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-white/60 flex flex-wrap gap-4 justify-between items-center">
          <span>
            © {new Date().getFullYear()} LEO K · Fun games & learning for kids
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em]">
            Built with Next.js
          </span>
        </div>
      </footer>
    </div>
  );
}
