"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import FourlineScreen from "../../../components/arcade/fourline/FourlineScreen";

export default function StudentFourlinePage() {
  const router = useRouter();
  const roomId = router.isReady ? String(router.query.roomId || "").trim() : "";

  if (!router.isReady) {
    return (
      <>
        <Head>
          <title>Fourline — Arcade</title>
        </Head>
        <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-300">טוען…</div>
      </>
    );
  }

  if (!roomId) {
    return (
      <>
        <Head>
          <title>Fourline — Arcade</title>
        </Head>
        <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-300 space-y-3">
          <p>חסר מזהה חדר (roomId).</p>
          <Link href="/student/arcade" className="text-sky-400 underline">
            חזרה לארקייד
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Fourline — Arcade</title>
      </Head>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <FourlineScreen roomId={roomId} />
      </div>
    </>
  );
}
