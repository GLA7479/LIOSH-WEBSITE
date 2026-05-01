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

const POLL_MS = 5000;

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

function quickMatchMessage(payload) {
  if (!payload || payload.ok !== true) return apiMessage({ payload, status: 200 });
  const m = payload.mode;
  if (m === "already_in_room") return "כבר נמצא בחדר — אפשר ללחוץ על כניסה למשחק";
  if (m === "joined") return "הצטרפת לשחקן שמחכה בחדר";
  if (m === "created") return "נוצר חדר משחק מהיר — מחכה לשחקן נוסף";
  return "מוכן";
}

function roomTypeLabel(rt) {
  if (rt === "quick") return "משחק מהיר";
  if (rt === "public") return "ציבורי";
  return rt || "—";
}

export default function StudentArcadePage() {
  const [studentName, setStudentName] = useState("");
  const [balance, setBalance] = useState(null);
  const [games, setGames] = useState([]);
  const [entryCost, setEntryCost] = useState(10);
  const [userMessage, setUserMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [debugPayload, setDebugPayload] = useState("");
  const [joinRoomIdDebug, setJoinRoomIdDebug] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [openRooms, setOpenRooms] = useState([]);
  /** @type {{ kind: string; room: Record<string, unknown> } | null} */
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

  const refreshOpenRooms = useCallback(async () => {
    const res = await fetch("/api/arcade/rooms/open?gameKey=fourline");
    const json = await res.json().catch(() => ({}));
    if (json?.ok && Array.isArray(json.rooms)) {
      setOpenRooms(json.rooms);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fourlineMeta = useMemo(() => games.find((g) => g.gameKey === "fourline") || null, [games]);

  const fourlineActive = Boolean(fourlineMeta?.enabled === true && fourlineMeta?.foundationOnly === false);

  const idleReason = !fourlineMeta
    ? "טוען משחקים…"
    : !fourlineMeta.enabled
      ? "המשחק כבוי בשרת"
      : fourlineMeta.foundationOnly
        ? "עדיין לא פעיל (ממתין להפעלה)"
        : null;

  useEffect(() => {
    if (!fourlineActive) return undefined;
    refreshOpenRooms();
    const id = setInterval(() => {
      void refreshOpenRooms();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fourlineActive, refreshOpenRooms]);

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
      await refreshOpenRooms();
      return result;
    } finally {
      setBusy(false);
    }
  };

  const runQuick = async (promise) => {
    setBusy(true);
    setUserMessage("");
    setDebugPayload("");
    try {
      const result = await promise;
      if (result.payload?.ok) {
        setUserMessage(quickMatchMessage(result.payload));
      } else {
        setUserMessage(apiMessage(result));
      }
      if (SHOW_ARCADE_DEBUG) {
        setDebugPayload(JSON.stringify(result.payload ?? {}, null, 2));
      }
      await refresh();
      await refreshOpenRooms();
      if (result.payload?.ok && result.payload?.room) {
        setRoomHighlight({ kind: "quick", room: result.payload.room });
      }
      return result;
    } finally {
      setBusy(false);
    }
  };

  const onQuickGame = () =>
    runQuick(
      (async () => {
        const res = await fetch("/api/arcade/quick-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameKey: "fourline",
            entryCost,
          }),
        });
        return readJson(res);
      })(),
    );

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

  const onJoinPublicRoom = (roomId) =>
    run(
      (async () => {
        const res = await fetch("/api/arcade/rooms/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        const result = await readJson(res);
        if (result.payload?.ok && result.payload?.room) {
          setRoomHighlight({ kind: "joined", room: result.payload.room });
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

  const onJoinByRoomIdDebug = () =>
    run(
      (async () => {
        const rid = String(joinRoomIdDebug || "").trim();
        if (!rid) {
          setUserMessage("הזן מזהה חדר (מצב פיתוח)");
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
          setJoinRoomIdDebug("");
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
  const hlRoomType = hlRoom?.room_type != null ? String(hlRoom.room_type) : "";
  const hlJoinCode =
    hlRoom?.join_code != null && String(hlRoom.join_code).trim() !== ""
      ? String(hlRoom.join_code)
      : null;
  const hlPrivate = hlRoomType === "private";

  const waitingCopy =
    hlStatus === "waiting" ? "ממתין לשחקן נוסף" : hlStatus === "active" ? "המשחק פעיל" : hlStatus;

  return (
    <>
      <Head>
        <title>משחקים — LEO K</title>
      </Head>
      <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
        <div className="mx-auto max-w-lg space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-700 pb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white sm:text-2xl">משחקים</h1>
              <p className="mt-1 truncate text-sm text-zinc-400">
                <span className="font-medium text-zinc-200">{studentName || "—"}</span>
                <span className="mx-2 text-zinc-600">·</span>
                <span className="font-mono text-amber-200">
                  {balance === null ? "טוען…" : balance}
                </span>
                <span className="mr-1 text-zinc-500">מטבעות</span>
              </p>
            </div>
            <Link
              href="/learning"
              className="shrink-0 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/25"
            >
              חזרה ללמידה
            </Link>
          </header>

          <div className={CARD_CLASS}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-zinc-900">Fourline</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  fourlineActive ? "bg-emerald-100 text-emerald-900" : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {fourlineActive ? "פעיל" : "לא זמין"}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-700">ארבע בשורה · שניים נגד שניים</p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-800">
              <li>שחקנים: 2</li>
              <li>בחר עלות כניסה לפני משחק מהיר או יצירת חדר</li>
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
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                disabled={busy || !fourlineActive || Boolean(costDisabledReason(entryCost))}
                title={
                  costDisabledReason(entryCost) ||
                  (!fourlineActive ? idleReason || undefined : undefined)
                }
                onClick={() => void onQuickGame()}
                className="w-full rounded-xl bg-amber-500 px-4 py-4 text-center text-base font-bold text-zinc-900 shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                משחק מהיר
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy || !fourlineActive || Boolean(costDisabledReason(entryCost))}
                  onClick={() => void onCreateRoom("public")}
                  className="flex-1 rounded-lg bg-zinc-800 px-4 py-3 text-center text-sm font-bold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  צור חדר ציבורי
                </button>
                <button
                  type="button"
                  disabled={busy || !fourlineActive || Boolean(costDisabledReason(entryCost))}
                  onClick={() => void onCreateRoom("private")}
                  className="flex-1 rounded-lg border-2 border-zinc-600 bg-zinc-100 px-4 py-3 text-center text-sm font-bold text-zinc-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  צור חדר פרטי
                </button>
              </div>
            </div>
          </div>

          <div className={CARD_CLASS}>
            <h3 className="text-base font-bold text-zinc-900">חדרים פתוחים</h3>
            <p className="mt-1 text-sm text-zinc-600">חדרים ציבוריים ומשחק מהיר שמחכים לשחקן</p>
            {!fourlineActive ? (
              <p className="mt-3 text-sm text-zinc-500">אין רשימה — המשחק לא פעיל</p>
            ) : openRooms.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">אין חדרים פתוחים כרגע</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {openRooms.map((row) => {
                  const full = row.playerCount >= row.maxPlayers;
                  const costLabel =
                    ENTRY_OPTIONS.find((o) => o.value === row.entryCost)?.label ||
                    String(row.entryCost);
                  return (
                    <li
                      key={row.roomId}
                      className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 text-sm">
                        <p className="font-semibold text-zinc-900">{row.gameTitle || "Fourline"}</p>
                        <p className="text-zinc-600">
                          עלות {costLabel} · {row.playerCount}/{row.maxPlayers} שחקנים ·{" "}
                          {roomTypeLabel(row.roomType)} · ממתין
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy || full || Boolean(costDisabledReason(row.entryCost))}
                        title={
                          full
                            ? "החדר מלא"
                            : costDisabledReason(row.entryCost) || undefined
                        }
                        onClick={() => void onJoinPublicRoom(row.roomId)}
                        className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        הצטרף
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={CARD_CLASS}>
            <h3 className="text-base font-bold text-zinc-900">חדר פרטי — הצטרפות בקוד</h3>
            <p className="mt-1 text-sm text-zinc-600">הזן את הקוד שקיבלת מחבר</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                autoComplete="off"
                placeholder="קוד החדר"
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

          {roomHighlight && hlRoomId ? (
            <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-5 text-emerald-950 shadow-md">
              <h3 className="text-xl font-bold">חדר מוכן</h3>
              <p className="mt-1 text-sm font-medium text-emerald-900">{waitingCopy}</p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2 border-b border-emerald-200 pb-2">
                  <dt className="font-semibold">עלות כניסה</dt>
                  <dd className="font-mono">{hlEntry}</dd>
                </div>
                {hlPrivate && hlJoinCode ? (
                  <>
                    <div className="rounded-md border border-emerald-300 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        קוד חדר
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-emerald-950">
                        {hlJoinCode}
                      </p>
                      <p className="mt-2 text-sm text-emerald-900">שלח את הקוד לחבר כדי שיצטרף</p>
                    </div>
                  </>
                ) : null}
              </dl>
              <Link
                href={`/student/games/fourline?roomId=${encodeURIComponent(hlRoomId)}`}
                className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-4 text-center text-lg font-bold text-white shadow-lg hover:bg-emerald-500"
              >
                כניסה למשחק
              </Link>
              {SHOW_ARCADE_DEBUG ? (
                <p className="mt-3 break-all font-mono text-[10px] text-emerald-800/90">{hlRoomId}</p>
              ) : null}
            </div>
          ) : null}

          {SHOW_ARCADE_DEBUG ? (
            <div className={CARD_CLASS}>
              <h3 className="text-sm font-semibold text-zinc-900">מצב פיתוח — הצטרפות לפי roomId</h3>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="UUID"
                  value={joinRoomIdDebug}
                  onChange={(e) => setJoinRoomIdDebug(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-400 bg-white px-3 py-2 font-mono text-sm text-zinc-900"
                />
                <button
                  type="button"
                  disabled={busy || !fourlineActive}
                  onClick={() => void onJoinByRoomIdDebug()}
                  className="rounded-lg bg-zinc-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  הצטרף (debug)
                </button>
              </div>
            </div>
          ) : null}

          {userMessage ? (
            <p className="rounded-lg border border-zinc-600 bg-zinc-900/80 px-4 py-3 text-sm font-medium text-amber-100">
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
