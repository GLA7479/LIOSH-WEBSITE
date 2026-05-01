import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

const ENTRY_OPTIONS = [
  { label: "10", value: 10 },
  { label: "100", value: 100 },
  { label: "1K", value: 1000 },
  { label: "10K", value: 10000 },
];

const SHOW_ARCADE_DEBUG =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ARCADE_DEBUG === "true";

const CARD_CLASS =
  "rounded-xl border border-zinc-300 bg-white p-4 text-zinc-900 shadow-sm [&_label]:text-zinc-900 [&_p]:text-zinc-800 [&_span]:text-zinc-900 [&_input]:text-zinc-900 [&_input]:bg-white";

async function readJson(res) {
  const payload = await res.json().catch(() => ({}));
  return { ok: res.ok, payload, status: res.status };
}

function apiMessage(result) {
  const { payload, status } = result;
  if (payload?.ok === true) {
    if (payload.alreadyQueued === true) return "כבר רשומים בתור (לא חויב מחדש)";
    return "בוצע בהצלחה";
  }
  const msg = typeof payload?.error === "string" ? payload.error : "";
  if (status === 402 || payload?.code === "insufficient_funds") {
    return msg || "אין מספיק מטבעות לפעולה זו";
  }
  return msg || "פעולה נכשלה";
}

export default function StudentArcadePage() {
  const [studentName, setStudentName] = useState("");
  const [balance, setBalance] = useState(null);
  const [games, setGames] = useState([]);
  const [entryCost, setEntryCost] = useState(10);
  const [userMessage, setUserMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [debugPayload, setDebugPayload] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  /** @type {{ kind: 'created' | 'joined'; room: Record<string, unknown> } | null} */
  const [roomHighlight, setRoomHighlight] = useState(null);

  const refresh = useCallback(async () => {
    const [meRes, balRes, gamesRes] = await Promise.all([
      fetch("/api/student/me"),
      fetch("/api/arcade/balance"),
      fetch("/api/arcade/games"),
    ]);
    const meJson = await meRes.json().catch(() => ({}));
    const balJson = await balRes.json().catch(() => ({}));
    const gamesJson = await gamesRes.json().catch(() => ({}));
    if (meJson?.student?.full_name) {
      setStudentName(meJson.student.full_name);
    }
    if (balJson?.ok) setBalance(balJson.balance);
    if (gamesJson?.ok && Array.isArray(gamesJson.games)) {
      setGames(gamesJson.games);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fourlineMeta = useMemo(() => games.find((g) => g.gameKey === "fourline") || null, [games]);

  const fourlineActive = Boolean(fourlineMeta?.enabled === true && fourlineMeta?.foundationOnly === false);

  const otherGames = useMemo(() => games.filter((g) => g.gameKey !== "fourline"), [games]);

  const idleReason = !fourlineMeta
    ? "טוען משחקים…"
    : !fourlineMeta.enabled
      ? "המשחק כבוי בשרת"
      : fourlineMeta.foundationOnly
        ? "עדיין לא פעיל (ממתין להפעלה)"
        : null;

  const run = async (promise) => {
    setBusy(true);
    setUserMessage("");
    setDebugPayload("");
    try {
      const result = await promise;
      setUserMessage(apiMessage(result));
      if (SHOW_ARCADE_DEBUG) {
        setDebugPayload(JSON.stringify(result.payload ?? {}, null, 2));
      }
      await refresh();
      return result;
    } finally {
      setBusy(false);
    }
  };

  const onCreateRoom = (roomType) =>
    run(
      (async () => {
        const res = await fetch("/api/arcade/rooms/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameKey: "fourline",
            roomType,
            entryCost,
          }),
        });
        const result = await readJson(res);
        if (result.payload?.ok && result.payload?.room) {
          setRoomHighlight({ kind: "created", room: result.payload.room });
        }
        return result;
      })(),
    );

  const onJoinByRoomId = () =>
    run(
      (async () => {
        const rid = String(joinRoomId || "").trim();
        if (!rid) {
          setUserMessage("הזן מזהה חדר");
          return { ok: false, payload: {}, status: 400 };
        }
        const res = await fetch("/api/arcade/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: rid }),
        });
        const result = await readJson(res);
        if (result.payload?.ok && result.payload?.room) {
          setRoomHighlight({ kind: "joined", room: result.payload.room });
          setJoinRoomId("");
        }
        return result;
      })(),
    );

  const onJoinByCodeSubmit = () =>
    run(
      (async () => {
        const code = String(joinCode || "").trim();
        if (!code) {
          setUserMessage("הזן קוד חדר");
          return { ok: false, payload: {}, status: 400 };
        }
        const res = await fetch("/api/arcade/rooms/join-by-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ joinCode: code }),
        });
        const result = await readJson(res);
        if (result.payload?.ok && result.payload?.room) {
          setRoomHighlight({ kind: "joined", room: result.payload.room });
          setJoinCode("");
        }
        return result;
      })(),
    );

  const balanceNum = balance !== null && balance !== undefined ? Number(balance) : null;
  const costDisabledReason = (cost) => {
    if (balanceNum === null || Number.isNaN(balanceNum)) return null;
    if (balanceNum < cost) return "אין מספיק מטבעות";
    return null;
  };

  const hlRoom = roomHighlight?.room;
  const hlRoomId = hlRoom?.id != null ? String(hlRoom.id) : "";
  const hlStatus = hlRoom?.status != null ? String(hlRoom.status) : "—";
  const hlEntry = hlRoom?.entry_cost != null ? String(hlRoom.entry_cost) : "—";
  const hlJoinCode =
    hlRoom?.join_code != null && String(hlRoom.join_code).trim() !== ""
      ? String(hlRoom.join_code)
      : null;

  return (
    <>
      <Head>
        <title>משחקים — LEO K</title>
      </Head>
      <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-lg space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-700 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">משחקים</h1>
              <p className="mt-1 text-sm text-zinc-400">Arcade — ארבע בשורה מול חבר</p>
            </div>
            <Link
              href="/learning"
              className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/25"
            >
              חזרה ללמידה
            </Link>
          </div>

          <div className={CARD_CLASS}>
            <p className="text-base">
              <span className="font-semibold text-zinc-900">תלמיד:</span>{" "}
              <span className="text-zinc-800">{studentName || "—"}</span>
            </p>
            <p className="mt-2 text-base">
              <span className="font-semibold text-zinc-900">יתרת מטבעות:</span>{" "}
              <span className="font-mono text-lg text-zinc-900">
                {balance === null ? "טוען…" : balance}
              </span>
            </p>
          </div>

          <div className={CARD_CLASS}>
            <h2 className="text-lg font-bold text-zinc-900">Fourline</h2>
            <p className="mt-1 text-sm text-zinc-700">ארבע בשורה · שניים נגד שניים</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-800">
              <li>
                סטטוס:{" "}
                <span className="font-semibold">{fourlineActive ? "משחק פעיל" : "לא זמין"}</span>
              </li>
              <li>שחקנים: 2</li>
              <li>בחר עלות כניסה לפני יצירת חדר או הצטרפות</li>
            </ul>
            {idleReason && !fourlineActive ? (
              <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {idleReason}
              </p>
            ) : null}

            <div className="mt-4">
              <span className="mb-2 block text-sm font-semibold text-zinc-900">עלות כניסה</span>
              <div className="flex flex-wrap gap-2">
                {ENTRY_OPTIONS.map((opt) => {
                  const needMsg = costDisabledReason(opt.value);
                  const selected = entryCost === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={busy || Boolean(needMsg)}
                      title={needMsg || undefined}
                      onClick={() => setEntryCost(opt.value)}
                      className={`min-w-[3.5rem] rounded-lg border-2 px-3 py-2 text-sm font-bold transition ${
                        selected
                          ? "border-amber-600 bg-amber-400 text-zinc-900 shadow-inner"
                          : needMsg
                            ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500 line-through"
                            : "border-zinc-400 bg-white text-zinc-900 hover:border-amber-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {ENTRY_OPTIONS.some((o) => costDisabledReason(o.value)) ? (
                <p className="mt-2 text-xs text-red-700">חלק מהסכומים חסומים — אין מספיק מטבעות.</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={busy || !fourlineActive || Boolean(costDisabledReason(entryCost))}
                title={
                  costDisabledReason(entryCost) ||
                  (!fourlineActive ? idleReason || undefined : undefined)
                }
                onClick={() => void onCreateRoom("public")}
                className="rounded-lg bg-amber-500 px-4 py-3 text-center text-sm font-bold text-zinc-900 shadow disabled:cursor-not-allowed disabled:opacity-50"
              >
                צור חדר ציבורי
              </button>
              <button
                type="button"
                disabled={busy || !fourlineActive || Boolean(costDisabledReason(entryCost))}
                title={
                  costDisabledReason(entryCost) ||
                  (!fourlineActive ? idleReason || undefined : undefined)
                }
                onClick={() => void onCreateRoom("private")}
                className="rounded-lg border-2 border-zinc-700 bg-zinc-100 px-4 py-3 text-center text-sm font-bold text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                צור חדר פרטי
              </button>
            </div>

            <div className="mt-6 border-t border-zinc-200 pt-5">
              <label htmlFor="arcade-join-roomid" className="block text-sm font-semibold text-zinc-900">
                הצטרפות לפי roomId
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="arcade-join-roomid"
                  type="text"
                  autoComplete="off"
                  placeholder="הדבק כאן את מזהה החדר (UUID)"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  disabled={busy || !fourlineActive}
                  onClick={() => void onJoinByRoomId()}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  הצטרף לפי roomId
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="arcade-join-code" className="block text-sm font-semibold text-zinc-900">
                הצטרפות לפי קוד חדר
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="arcade-join-code"
                  type="text"
                  autoComplete="off"
                  placeholder="קוד החדר (אותיות ומספרים)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  disabled={busy || !fourlineActive}
                  onClick={() => void onJoinByCodeSubmit()}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  הצטרף לפי קוד
                </button>
              </div>
            </div>
          </div>

          {roomHighlight && hlRoomId ? (
            <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-5 text-emerald-950 shadow-md">
              <h3 className="text-xl font-bold">
                {roomHighlight.kind === "created" ? "חדר נוצר" : "הצטרפת לחדר"}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-2 border-b border-emerald-200 pb-2">
                  <dt className="font-semibold">roomId</dt>
                  <dd className="max-w-[65%] break-all font-mono text-xs">{hlRoomId}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-emerald-200 pb-2">
                  <dt className="font-semibold">סטטוס</dt>
                  <dd>{hlStatus}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-emerald-200 pb-2">
                  <dt className="font-semibold">עלות כניסה</dt>
                  <dd className="font-mono">{hlEntry}</dd>
                </div>
                {hlJoinCode ? (
                  <div className="flex justify-between gap-2 pb-2">
                    <dt className="font-semibold">קוד חדר</dt>
                    <dd className="font-mono font-bold tracking-wider">{hlJoinCode}</dd>
                  </div>
                ) : null}
              </dl>
              <Link
                href={`/student/games/fourline?roomId=${encodeURIComponent(hlRoomId)}`}
                className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-center text-lg font-bold text-white shadow-lg hover:bg-emerald-500"
              >
                כניסה למשחק
              </Link>
            </div>
          ) : null}

          <div className={CARD_CLASS}>
            <h2 className="text-sm font-semibold text-zinc-900">Quick Match</h2>
            <p className="mt-2 rounded-md bg-zinc-100 px-3 py-3 text-sm text-zinc-700">
              Quick Match יופעל בהמשך — אין התאמה אוטומטית פעילה כרגע.
            </p>
          </div>

          {otherGames.length > 0 ? (
            <div className={CARD_CLASS}>
              <h2 className="text-sm font-semibold text-zinc-900">משחקים נוספים</h2>
              <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                {otherGames.map((g) => (
                  <li key={g.gameKey} className="flex justify-between border-b border-zinc-100 py-1">
                    <span>{g.title}</span>
                    <span className="text-zinc-500">בקרוב</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {userMessage ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
              {userMessage}
            </p>
          ) : null}

          {SHOW_ARCADE_DEBUG && debugPayload ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-600 bg-zinc-900 p-3 font-mono text-xs text-zinc-300">
              {debugPayload}
            </pre>
          ) : null}
        </div>
      </div>
    </>
  );
}
