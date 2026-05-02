"use client";

import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnakesLaddersSession } from "../../../hooks/arcade/useSnakesLaddersSession";
import { LADDERS, SNAKES } from "../../../lib/arcade/snakes-ladders/snakesLaddersEngine";

const GAME_TITLE = "נחשים וסולמות";

const HUD_CONTROL_H = "h-9";
const HUD_CHIP =
  "rounded-lg border border-white/20 bg-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-white/[0.11] active:scale-[0.97]";
const HUD_BTN_BASE = `flex ${HUD_CONTROL_H} shrink-0 items-center justify-center ${HUD_CHIP}`;
const HUD_BTN_SQUARE = `${HUD_BTN_BASE} w-9`;

const SEAT_DOT_CLASS = ["bg-amber-400", "bg-sky-400", "bg-rose-400", "bg-emerald-400"];

function SnakesOv2AdSlot() {
  return (
    <aside
      role="complementary"
      aria-label="אזור פרסומת"
      data-arcade-ad-slot="1"
      className="relative z-10 w-full shrink-0 border-t border-white/[0.08] bg-black/50 px-2 pt-2"
      style={{
        paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="mx-auto flex w-full max-w-[728px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-zinc-900/70 text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:rounded-2xl"
        style={{
          minHeight: "clamp(52px, 11vw, 90px)",
          maxHeight: "min(90px, 22vh)",
        }}
      >
        <span className="select-none px-3 text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">
          מקום לפרסומת
        </span>
      </div>
    </aside>
  );
}

/** @param {{ onLeave: () => void, disabled?: boolean, busy?: boolean }} props */
function SnakesLeaveRow({ onLeave, disabled = false, busy = false }) {
  return (
    <div className="mt-0 flex w-full shrink-0 justify-center border-t border-white/10 px-1 pb-1 pt-2 sm:pt-2.5">
      <button
        type="button"
        onClick={onLeave}
        disabled={disabled || busy}
        className="min-h-[2.5rem] w-full max-w-xs rounded-xl border border-rose-500/35 bg-rose-950/35 px-4 py-2 text-sm font-extrabold text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:bg-rose-950/55 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-sm sm:text-base"
      >
        {busy ? "יוצא…" : "עזוב (LEAVE)"}
      </button>
    </div>
  );
}

/** @param {{ onBack: () => void, balance: number | null, onOpenHelp: () => void }} props */
function SnakesOv2Hud({ onBack, balance, onOpenHelp }) {
  return (
    <header
      dir="rtl"
      className="relative z-20 flex w-full shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.14] bg-gradient-to-b from-zinc-700/90 via-zinc-900/95 to-black/90 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_28px_rgba(0,0,0,0.45)] sm:gap-2 sm:px-2.5 sm:py-2"
    >
      <button
        type="button"
        onClick={onBack}
        className={`${HUD_BTN_BASE} min-w-[3.75rem] px-2 sm:min-w-[4rem]`}
        aria-label="חזרה"
        title="חזרה"
      >
        <span className="text-xs font-extrabold leading-none tracking-wide text-white sm:text-sm">חזרה</span>
      </button>

      <div className="min-w-0 flex-1 px-0.5 text-center">
        <h1 className="truncate text-base font-extrabold leading-tight text-white drop-shadow-sm sm:text-lg lg:text-xl">
          {GAME_TITLE}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className={`flex ${HUD_CONTROL_H} min-w-[4.75rem] max-w-[9rem] shrink-0 items-center gap-1 rounded-lg border border-amber-500/35 bg-black/55 px-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:min-w-[5rem] sm:px-2.5`}
          title="יתרת מטבעות"
        >
          <img src="/images/coin.png" alt="" className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7" />
          <span className="min-w-0 truncate font-mono text-sm font-bold tabular-nums leading-none text-amber-100 sm:text-base">
            {balance === null ? "…" : balance}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenHelp}
          className={HUD_BTN_SQUARE}
          aria-label="איך משחקים"
          title="איך משחקים"
        >
          <span className="text-lg leading-none text-white/95">?</span>
        </button>
      </div>
    </header>
  );
}

/** @param {{ open: boolean, onClose: () => void }} props */
function SnakesHowToModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 pb-8 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="snakes-howto-title"
    >
      <button type="button" className="absolute inset-0 cursor-default" aria-label="סגור" onClick={onClose} />
      <div
        dir="rtl"
        className="relative z-[1] max-h-[min(85vh,540px)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-950 p-4 text-right shadow-2xl sm:p-5"
      >
        <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 id="snakes-howto-title" className="text-lg font-bold text-white">
              איך משחקים
            </h2>
            <p className="mt-0.5 text-xs text-amber-300/90">{GAME_TITLE}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1 text-sm text-zinc-200 hover:bg-white/10"
          >
            סגור
          </button>
        </div>
        <ul className="list-disc space-y-2 pr-5 text-sm leading-relaxed text-zinc-200">
          <li>כל שחקן בתורו מזריק קוביה ומתקדם על הלוח לפי המספר.</li>
          <li>נחש מוריד, סולם מעלה — לפי המפה הקלאסית.</li>
          <li>מי שמגיע בדיוק ל-100 מנצח.</li>
          <li>זריקה שחורגת מ-100 לא מזיזה אותך (נשאר באותו משבצת).</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * לוח 10×10: שורה תחתונה 1–10, למעלה 100.
 * @param {number} visualRow 0 = למעלה (100)
 * @param {number} visualCol 0 = שמאל ב־RTL ויזואלי (עמודות משמאל לימין במספרים)
 */
function cellNumberForGrid(visualRow, visualCol) {
  const br = 9 - visualRow;
  if (br % 2 === 0) return br * 10 + visualCol + 1;
  return br * 10 + (9 - visualCol) + 1;
}

/** @param {{ roomId: string }} props */
export default function SnakesLaddersScreen({ roomId }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const session = useSnakesLaddersSession({ roomId });
  const {
    snapshot,
    vm,
    err,
    setErr,
    rollDice,
    room,
    players,
    gameSession,
    bundleLoaded,
    bundleError,
  } = session;

  const [balance, setBalance] = useState(/** @type {number|null} */ (null));
  const [helpOpen, setHelpOpen] = useState(false);
  const [leaveBusy, setLeaveBusy] = useState(false);
  const leaveBusyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/arcade/balance", { credentials: "same-origin" });
        const j = await res.json().catch(() => ({}));
        if (cancelled || !j?.ok || j.balance == null) return;
        setBalance(Number(j.balance));
      } catch {
        if (!cancelled) setBalance(null);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 25000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const goBack = useCallback(() => {
    const r = routerRef.current;
    if (typeof window !== "undefined" && window.history.length > 1) {
      r.back();
    } else {
      void r.replace("/student/arcade");
    }
  }, []);

  const onLeaveRoom = useCallback(async () => {
    const id = String(roomId || "").trim();
    if (!id || leaveBusyRef.current) return;
    leaveBusyRef.current = true;
    setLeaveBusy(true);
    try {
      await fetch("/api/arcade/rooms/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ roomId: id }),
      });
    } catch {
      /* */
    } finally {
      leaveBusyRef.current = false;
      setLeaveBusy(false);
      goBack();
    }
  }, [roomId, goBack]);

  const showLobbyWait = room?.status === "waiting";
  const showSessionInitError =
    bundleLoaded && room?.status === "active" && !snapshot && !gameSession;
  const showBoardLoading =
    !showLobbyWait && room?.status === "active" && !snapshot && !showSessionInitError;

  const seatLabels = useMemo(() => {
    const out = ["", "", "", ""];
    const members = Array.isArray(players) ? players : [];
    for (const m of members) {
      const si = Number(m?.seat_index);
      if (!Number.isInteger(si) || si < 0 || si > 3) continue;
      const dn = String(m?.display_name ?? "").trim();
      out[si] = dn || `שחקן ${si + 1}`;
    }
    return out.map((label, i) => label || `מושב ${i + 1}`);
  }, [players]);

  const onDice = useCallback(async () => {
    if (vm.phase !== "playing" || !vm.canClientRoll) return;
    setErr("");
    await rollDice();
  }, [vm.phase, vm.canClientRoll, rollDice, setErr]);

  const finished = vm.phase === "finished";
  const didIWin = vm.mySeat != null && vm.winnerSeat != null && vm.winnerSeat === vm.mySeat;

  const seatStripActiveIndex =
    vm.phase === "playing" && vm.turnSeat != null && !finished ? vm.turnSeat : null;

  const tokensByCell = useMemo(() => {
    /** @type {Map<number, number[]>} */
    const m = new Map();
    const acts = vm.activeSeats;
    const pos = vm.positions;
    if (!Array.isArray(acts) || !Array.isArray(pos)) return m;
    for (let i = 0; i < acts.length && i < pos.length; i += 1) {
      const seat = acts[i];
      const cell = pos[i];
      if (cell == null || cell <= 0) continue;
      const list = m.get(cell) || [];
      list.push(Number(seat));
      m.set(cell, list);
    }
    return m;
  }, [vm.activeSeats, vm.positions]);

  const gridCells = useMemo(() => {
    const rows = [];
    for (let r = 0; r < 10; r += 1) {
      const row = [];
      for (let c = 0; c < 10; c += 1) {
        row.push(cellNumberForGrid(r, c));
      }
      rows.push(row);
    }
    return rows;
  }, []);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 px-2 pt-2">
      <SnakesOv2Hud onBack={goBack} balance={balance} onOpenHelp={() => setHelpOpen(true)} />
      <SnakesHowToModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <div className="min-h-0 flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-2">
        {bundleError ? (
          <p className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
            {bundleError}
          </p>
        ) : null}

        {showLobbyWait ? (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-6 text-center text-amber-100">
            <p className="text-lg font-bold">ממתינים לשחקן נוסף…</p>
            <p className="mt-2 text-sm text-amber-200/90">כשהחדר יתמלא המשחק יתחיל אוטומטית</p>
          </div>
        ) : null}

        {showSessionInitError ? (
          <p className="mt-4 text-center text-sm text-rose-200">לא ניתן לטעון את מצב המשחק — נסה לרענן</p>
        ) : null}

        {showBoardLoading ? (
          <p className="mt-6 text-center text-zinc-400">טוען לוח…</p>
        ) : null}

        {!showLobbyWait && snapshot ? (
          <>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {[0, 1, 2, 3].map((seat) => {
                const label = seatLabels[seat] || `מושב ${seat + 1}`;
                const onThisSeat = vm.activeSeats.includes(seat);
                if (!onThisSeat) return null;
                const active = seatStripActiveIndex === seat;
                return (
                  <div
                    key={seat}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1 text-xs sm:text-sm ${
                      active ? "border-amber-400/60 bg-amber-500/15 text-amber-50" : "border-white/15 bg-white/5 text-zinc-200"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEAT_DOT_CLASS[seat] || "bg-zinc-500"}`} />
                    <span className="max-w-[9rem] truncate font-semibold">{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid aspect-square w-full max-w-[min(100vw-2rem,520px)] grid-cols-10 grid-rows-10 gap-px self-center border border-white/10 bg-zinc-800 p-px">
              {gridCells.flatMap((row, ri) =>
                row.map((cellNum, ci) => {
                  const at = tokensByCell.get(cellNum) || [];
                  const isLadderStart = LADDERS.has(cellNum);
                  const isSnakeHead = SNAKES.has(cellNum);
                  let cellBg = "bg-zinc-900/90";
                  if (isLadderStart) cellBg = "bg-emerald-950/50";
                  else if (isSnakeHead) cellBg = "bg-rose-950/45";

                  return (
                    <div
                      key={`${ri}-${ci}`}
                      className={`relative flex min-h-0 min-w-0 flex-col items-center justify-start pt-0.5 ${cellBg}`}
                    >
                      <span className="text-[8px] font-bold tabular-nums text-zinc-500 sm:text-[9px]">{cellNum}</span>
                      <div className="mt-auto flex flex-wrap justify-center gap-0.5 pb-0.5">
                        {at.map((seat) => (
                          <span
                            key={seat}
                            title={seatLabels[seat] || `שחקן ${seat + 1}`}
                            className={`h-2 w-2 shrink-0 rounded-full ring-1 ring-black/40 ${SEAT_DOT_CLASS[seat] || "bg-zinc-500"}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                }),
              )}
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
              {vm.dicePresentation != null ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-500/50 bg-zinc-900 text-3xl font-black text-amber-200 shadow-lg">
                  {vm.dicePresentation}
                </div>
              ) : (
                <div className="h-16 w-16 rounded-2xl border border-dashed border-zinc-600 bg-zinc-900/50" />
              )}

              <button
                type="button"
                disabled={finished || vm.boardViewReadOnly || !vm.canClientRoll || vm.diceRolling}
                onClick={() => void onDice()}
                className="rounded-2xl bg-gradient-to-b from-amber-400 to-amber-600 px-8 py-3 text-lg font-black text-zinc-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
              >
                {finished ? "המשחק הסתיים" : vm.canClientRoll ? "זרוק קוביה" : "המתן לתורך"}
              </button>

              {err ? (
                <p className="max-w-sm text-center text-sm text-rose-300">{err}</p>
              ) : null}

              {finished ? (
                <p className="text-center text-lg font-bold text-amber-200">
                  {didIWin ? "ניצחת!" : `מנצח: מושב ${(vm.winnerSeat ?? 0) + 1}`}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {room ? <SnakesLeaveRow onLeave={onLeaveRoom} busy={leaveBusy} disabled={!String(roomId || "").trim()} /> : null}
      <SnakesOv2AdSlot />
    </div>
  );
}
