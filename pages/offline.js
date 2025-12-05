import Head from "next/head";
import { useRouter } from "next/router";

export default function Offline() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Offline - LEO K</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0f1d] to-[#141928] flex items-center justify-center p-4" dir="rtl">
        <div className="text-center text-white max-w-md">
          <div className="text-6xl mb-6">🔌</div>
          <h1 className="text-4xl font-bold mb-4">אתה במצב Offline</h1>
          <p className="text-lg mb-2 text-white/80">
            אין חיבור לאינטרנט כרגע.
          </p>
          <p className="text-base mb-8 text-white/70">
            חלק מהדפים זמינים גם ללא חיבור, אם כבר ביקרת בהם בעבר.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold transition-colors"
            >
              חזרה לדף הבית
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-colors"
            >
              נסה שוב
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

