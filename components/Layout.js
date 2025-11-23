import Link from "next/link";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();
  
  // Check if it's a game page by checking the route
  const isGamePage = router.pathname.includes('/learning/') || 
                     router.pathname.includes('/offline/') ||
                     router.pathname.includes('/mleo-');
  
  if (isGamePage) {
    // For game pages, return only the children without header/footer
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050816] via-[#0b1020] to-[#050816] text-white">
      <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-30">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-widest text-lg">
            <span className="text-2xl">🦁</span>
            <span>LEO K</span>
          </Link>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition">Home</Link>
            <Link href="/game" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition">Games</Link>
            <Link href="/offline" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition">Offline</Link>
            <Link href="/learning" className="px-3 py-1.5 rounded-full hover:bg-white/10 transition">Learning</Link>
          </div>
        </nav>
      </header>
      <main className="min-h-[calc(100vh-56px)]">
        {children}
      </main>
      <footer className="border-t border-white/10 bg-black/40 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-white/60 flex flex-wrap gap-4 justify-between items-center">
          <span>© {new Date().getFullYear()} LEO K · Fun games & learning for kids</span>
          <span className="text-[10px] uppercase tracking-[0.2em]">Built with Next.js</span>
        </div>
      </footer>
    </div>
  );
}
