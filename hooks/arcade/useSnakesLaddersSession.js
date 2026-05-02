import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchArcadeRoomSnakesLaddersBundle,
  requestSnakesAndLaddersGameAction,
} from "../../lib/arcade/snakes-ladders/snakesSessionAdapter";

const LIVE_ROLL_MIN_MS = 1400;
const DICE_FACE_HOLD_MS = 900;

function preferNewer(prev, next) {
  if (!next) return prev;
  if (!prev) return next;
  const pr = prev.revision != null ? Number(prev.revision) : 0;
  const nr = next.revision != null ? Number(next.revision) : 0;
  return nr >= pr ? next : prev;
}

function sleepMs(ms) {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    window.setTimeout(resolve, ms);
  });
}

/**
 * @param {{ room?: Record<string, unknown>|null, roomId?: string|null }} ctx
 */
export function useSnakesLaddersSession(ctx) {
  const room = ctx?.room && typeof ctx.room === "object" ? ctx.room : null;
  const roomId =
    ctx?.roomId != null && String(ctx.roomId).trim()
      ? String(ctx.roomId).trim()
      : room?.id != null
        ? String(room.id)
        : null;

  const [snap, setSnap] = useState(null);
  const [roomRow, setRoomRow] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameSessionRow, setGameSessionRow] = useState(null);
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [bundleError, setBundleError] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const joinRecoveryAttemptedRef = useRef(false);
  const bundleLoadedOnceRef = useRef(false);
  const lastPollSigRef = useRef("");
  const snapRef = useRef(null);
  snapRef.current = snap;

  const [diceRolling, setDiceRolling] = useState(false);
  const [liveSpinTick, setLiveSpinTick] = useState(1);
  const [liveRollServerFace, setLiveRollServerFace] = useState(/** @type {number|null} */ (null));
  const [liveDiceRevealHold, setLiveDiceRevealHold] = useState(
    /** @type {{ face: number; until: number } | null} */ (null)
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const diceRollingRef = useRef(false);

  useEffect(() => {
    setSnap(null);
    setRoomRow(null);
    setPlayers([]);
    setGameSessionRow(null);
    setBundleLoaded(false);
    setBundleError("");
    setErr("");
    joinRecoveryAttemptedRef.current = false;
    bundleLoadedOnceRef.current = false;
    lastPollSigRef.current = "";
    setDiceRolling(false);
    diceRollingRef.current = false;
    setLiveRollServerFace(null);
    setLiveDiceRevealHold(null);
  }, [roomId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const t = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!liveDiceRevealHold) return;
    if (nowMs < liveDiceRevealHold.until) return;
    setLiveDiceRevealHold(null);
  }, [nowMs, liveDiceRevealHold]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!diceRolling || liveRollServerFace != null) return undefined;
    const id = window.setInterval(() => {
      setLiveSpinTick((prev) => {
        let n = prev;
        for (let i = 0; i < 8 && n === prev; i += 1) {
          n = 1 + Math.floor(Math.random() * 6);
        }
        return n;
      });
    }, 85);
    return () => window.clearInterval(id);
  }, [diceRolling, liveRollServerFace]);

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;

    const tick = async () => {
      let b = await fetchArcadeRoomSnakesLaddersBundle(roomId);
      if (cancelled) return;

      if (!b.ok && b.code === "forbidden" && b.httpStatus === 403 && !joinRecoveryAttemptedRef.current) {
        joinRecoveryAttemptedRef.current = true;
        try {
          await fetch("/api/arcade/rooms/join", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId }),
          });
        } catch {
          /* */
        }
        b = await fetchArcadeRoomSnakesLaddersBundle(roomId);
      }

      if (cancelled) return;

      if (!b.ok) {
        if (!bundleLoadedOnceRef.current) {
          const msg =
            b.code === "forbidden"
              ? "אין גישה לחדר (לא רשום כשחקן)."
              : b.error || b.code || "טעינת החדר נכשלה";
          setBundleError(msg);
        }
        return;
      }

      const sl = b.snakesAndLadders;
      const roomSt = b.room?.status != null ? String(b.room.status) : "";
      const gsSt = b.gameSession?.status != null ? String(b.gameSession.status) : "";
      const rev = sl?.revision != null ? Number(sl.revision) : -1;
      const phase = sl?.phase != null ? String(sl.phase) : "";
      const ts = sl?.turnSeat != null ? String(sl.turnSeat) : "";
      const lr = sl?.lastRoll != null ? String(sl.lastRoll) : "";
      const playerSig = Array.isArray(b.players)
        ? b.players.map((p) => `${p.student_id}:${String(p.display_name ?? "").slice(0, 24)}`).join("|")
        : "";
      const flexWaitSig = `${b.room?.flex_auto_start_at ?? ""}|${b.room?.start_window_started_at ?? ""}`;
      const pollSig = `${roomSt}|${gsSt}|${rev}|${phase}|${ts}|${lr}|${playerSig}|${flexWaitSig}`;

      const unchanged =
        bundleLoadedOnceRef.current &&
        pollSig === lastPollSigRef.current &&
        lastPollSigRef.current !== "";

      if (unchanged) {
        return;
      }
      lastPollSigRef.current = pollSig;

      setBundleError("");
      bundleLoadedOnceRef.current = true;
      setBundleLoaded(true);
      setRoomRow(b.room);
      setPlayers(b.players || []);
      setGameSessionRow(b.gameSession ?? null);
      setSnap((prev) => preferNewer(prev, b.snakesAndLadders));
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomId]);

  const rollDice = useCallback(async () => {
    const s = snapRef.current;
    if (!roomId || !s) return { ok: false };
    if (diceRollingRef.current) return { ok: false };
    if (!s.canClientRoll) return { ok: false };

    const t0 = typeof Date.now === "function" ? Date.now() : 0;
    setLiveRollServerFace(null);
    setDiceRolling(true);
    diceRollingRef.current = true;
    setErr("");

    try {
      const r = await requestSnakesAndLaddersGameAction(roomId, { action: "roll", revision: s.revision });
      if (!r.ok) {
        setErr(r.error || "פעולה נכשלה");
        return { ok: false };
      }
      const nextSnap = r.snapshot;
      const face =
        nextSnap?.lastRoll != null && !Number.isNaN(Number(nextSnap.lastRoll))
          ? Number(nextSnap.lastRoll)
          : null;
      if (face != null) {
        setLiveRollServerFace(face);
        setLiveSpinTick(face);
      }
      const wait = Math.max(0, LIVE_ROLL_MIN_MS - (Date.now() - t0));
      await sleepMs(wait);

      if (r.ok && nextSnap) {
        setSnap((prev) => preferNewer(prev, nextSnap));
        if (face != null) {
          setLiveDiceRevealHold({ face, until: Date.now() + DICE_FACE_HOLD_MS });
        }
      } else if (r.ok && !nextSnap) {
        const b = await fetchArcadeRoomSnakesLaddersBundle(roomId);
        if (b.ok) {
          if (b.snakesAndLadders) setSnap((prev) => preferNewer(prev, b.snakesAndLadders));
          if (b.room) setRoomRow(b.room);
          if (b.players) setPlayers(b.players);
          setGameSessionRow(b.gameSession ?? null);
        }
      }
      return { ok: true };
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      return { ok: false };
    } finally {
      setLiveRollServerFace(null);
      setDiceRolling(false);
      diceRollingRef.current = false;
    }
  }, [roomId]);

  const vm = useMemo(() => {
    const phase = snap ? String(snap.phase || "").toLowerCase() : "";
    const liveDiceDisplayValue =
      phase === "playing" && diceRolling
        ? liveSpinTick
        : phase === "playing" &&
            liveDiceRevealHold != null &&
            nowMs < liveDiceRevealHold.until
          ? liveDiceRevealHold.face
          : undefined;

    let dicePresentation = null;
    if (liveDiceDisplayValue != null && typeof liveDiceDisplayValue === "number") {
      dicePresentation = liveDiceDisplayValue;
    } else if (snap?.lastRoll != null && !Number.isNaN(Number(snap.lastRoll))) {
      dicePresentation = Number(snap.lastRoll);
    }

    return {
      phase,
      turnSeat: snap?.turnSeat ?? null,
      mySeat: snap?.mySeat ?? null,
      winnerSeat: snap?.winnerSeat ?? null,
      revision: snap?.revision ?? 0,
      sessionId: snap?.sessionId != null ? String(snap.sessionId) : "",
      positions: Array.isArray(snap?.positions) ? snap.positions : [],
      activeSeats: Array.isArray(snap?.activeSeats) ? snap.activeSeats : [],
      dicePresentation,
      diceRolling,
      canClientRoll: snap?.canClientRoll === true && !diceRolling,
      boardViewReadOnly: snap?.boardViewReadOnly === true,
    };
  }, [snap, diceRolling, liveSpinTick, liveDiceRevealHold, nowMs]);

  return {
    snapshot: snap,
    vm,
    busy,
    err,
    setErr,
    rollDice,
    roomId,
    room: roomRow,
    players,
    gameSession: gameSessionRow,
    bundleLoaded,
    bundleError,
  };
}
