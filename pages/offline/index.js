import Layout from "../../components/Layout";
import Link from "next/link";
import { useIOSViewportFix } from "../../hooks/useIOSViewportFix";

const OFFLINE_GAMES = [
  {
    slug: "tic-tac-toe",
    title: "איקס־עיגול XL",
    emoji: "❌⭕️",
    players: "2 שחקנים",
    blurb: "לוחות מ־3×3 ועד 7×7 עם מעקב ציון.",
  },
  {
    slug: "rock-paper-scissors",
    title: "אבן · נייר · מספריים",
    emoji: "🪨📄✂️",
    players: "2 שחקנים או נגד רובוט",
    blurb: "משחקים מהירים, סיבובים הטוב מול כולם והיסטוריית ציון.",
  },
  {
    slug: "tap-battle",
    title: "קרב הקשות",
    emoji: "⚡️",
    players: "2 שחקנים",
    blurb: "כל צד מקיש מהר ככל האפשר — מי שמגיע קודם ליעד מנצח.",
  },
  {
    slug: "memory-match",
    title: "התאמת זיכרון",
    emoji: "🧠",
    players: "1–2 שחקנים",
    blurb: "הופכים קלפים, מוצאים זוגות ומנסים לנצח את השעון.",
  },
];

export default function OfflineHub() {
  useIOSViewportFix();
  return (
    <Layout>
      <main className="min-h-screen bg-gradient-to-b from-[#0f111a] to-[#1b1f2b] text-white px-4 py-10" dir="rtl">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold tracking-widest"
            >
              בית ←
            </Link>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              משחקים לא מקוונים
            </p>
          </div>

          <header className="text-center space-y-3">
            <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-sm tracking-wider uppercase text-emerald-300 font-semibold">
              🔌 אותו מכשיר · בלי אינטרנט
            </p>
            <h1 className="text-3xl md:text-4xl font-black">מרכז המשחקים הלא מקוונים</h1>
            <p className="text-sm md:text-base text-white/70 max-w-2xl mx-auto">
              בחרו משחק ושחקו יחד על טלפון או טאבלט אחד — מתאים לנסיעות, טיסות ומקומות בלי קליטה.
            </p>
          </header>

          <section className="grid sm:grid-cols-2 gap-4 md:gap-6">
            {OFFLINE_GAMES.map((g) => (
              <Link
                key={g.slug}
                href={`/offline/${g.slug}`}
                className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">{g.emoji}</div>
                  <div>
                    <h2 className="font-bold text-lg">{g.title}</h2>
                    <p className="text-xs text-white/60">{g.players}</p>
                  </div>
                </div>
                <p className="text-sm text-white/70 flex-1">{g.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <span>←</span>
                  שחק עכשיו
                </span>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
}
