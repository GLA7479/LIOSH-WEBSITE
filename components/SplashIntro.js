import { useEffect, useState } from "react";

export default function SplashIntro() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/90">
      <div className="text-center space-y-4">
        <div className="text-5xl animate-bounce">🦁</div>
        <h1 className="text-2xl font-black tracking-widest">LEO K</h1>
        <p className="text-sm text-white/70">Loading fun & smart games…</p>
      </div>
    </div>
  );
}
