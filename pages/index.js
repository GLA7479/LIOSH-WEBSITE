import Layout from "../components/Layout";
import Link from "next/link";
import InstallAppPrompt from "../components/InstallAppPrompt";
import InstallAppButton from "../components/InstallAppButton";

export default function HomePage() {
  return (
    <Layout>
      <InstallAppPrompt />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <section className="text-center space-y-4">
          <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-xs tracking-[0.25em] uppercase text-amber-300 font-semibold">
            Fun · Safe · Educational
          </p>
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            Welcome to <span className="text-amber-300">LEO KIDS</span>
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            A small world of mini games and learning activities for kids. Run, fly,
            solve puzzles and practice math, geometry and English – all in one place.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <Link href="/learning" className="group rounded-2xl bg-gradient-to-br from-amber-500/60 to-rose-600/70 p-[1px]">
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">📚</div>
                <h2 className="text-xl font-bold">Learning Zone</h2>
                <p className="text-sm text-white/75">
                  Math, geometry and English practice – tailored to elementary grades.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 group-hover:translate-x-1 transition">
                Enter learning
                <span>→</span>
              </span>
            </div>
          </Link>

          <Link href="/offline" className="group rounded-2xl bg-gradient-to-br from-emerald-500/60 to-teal-600/70 p-[1px]">
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">👨‍👩‍👧‍👦</div>
                <h2 className="text-xl font-bold">Offline Games</h2>
                <p className="text-sm text-white/75">
                  Play together on the same device – tic tac toe, rock · paper · scissors and more.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 group-hover:translate-x-1 transition">
                Enter offline
                <span>→</span>
              </span>
            </div>
          </Link>

          <Link href="/game" className="group rounded-2xl bg-gradient-to-br from-sky-500/60 to-indigo-600/70 p-[1px]">
            <div className="h-full rounded-2xl bg-black/60 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-4xl">🎮</div>
                <h2 className="text-xl font-bold">Arcade Games</h2>
                <p className="text-sm text-white/75">
                  Action games with LEO: runner, flyer, catcher, puzzles and more.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 group-hover:translate-x-1 transition">
                Enter games
                <span>→</span>
              </span>
            </div>
          </Link>
        </section>

        <div className="flex flex-col md:flex-row items-center justify-center gap-3 pt-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <label className="text-sm uppercase tracking-[0.3em] text-white/60">
              Player Name
            </label>
            <input
              type="text"
              value=""
              placeholder="Enter name"
              className="bg-black/40 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/40 w-48"
              readOnly
            />
          </div>
          <InstallAppButton />
        </div>
      </div>
    </Layout>
  );
}
