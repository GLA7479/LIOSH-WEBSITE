import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchArcadeRoomFourlineBundle,
  requestFourlinePlayColumn,
} from "../../lib/arcade/fourline/fourlineSessionAdapter";

function preferNewer(prev, next) {
  if (!next) return prev;
  if (!prev) return next;
  const pr = prev.revision != null ? Number(prev.revision) : 0;
  const nr = next.revision != null ? Number(next.revision) : 0;
  return nr >= pr ? next : prev;
}

/**
 * @param {{ room?: Record<string, unknown>|null, roomId?: string|null }} ctx
 */
export function useFourlineSession(ctx) {
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
  /** True after at least one successful snapshot bundle (ok JSON with room payload). */
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setSnap(null);
    setRoomRow(null);
    setPlayers([]);
    setGameSessionRow(null);
    setBundleLoaded(false);
    setErr("");
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;

    const tick = async () => {
      const b = await fetchArcadeRoomFourlineBundle(roomId);
      if (cancelled || !b) return;
      setBundleLoaded(true);
      setRoomRow(b.room);
      setPlayers(b.players || []);
      setGameSessionRow(b.gameSession ?? null);
      setSnap((prev) => {
        const merged = preferNewer(prev, b.fourline);
        if (
          prev &&
          merged &&
          Number(prev.revision) === Number(merged.revision) &&
          String(prev.phase || "") === String(merged.phase || "") &&
          String(prev.sessionId || "") === String(merged.sessionId || "")
        ) {
          return prev;
        }
        return merged;
      });
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomId]);

  const playColumn = useCallback(
    async (col) => {
      if (!roomId || !snap) return { ok: false };
      if (busy) return { ok: false };
      setBusy(true);
      setErr("");
      try {
        const r = await requestFourlinePlayColumn(roomId, col, { revision: snap.revision });
        if (!r.ok) {
          setErr(r.error || "מהלך נכשל");
          return { ok: false };
        }
        if (r.snapshot) setSnap((prev) => preferNewer(prev, r.snapshot));
        else {
          const b = await fetchArcadeRoomFourlineBundle(roomId);
          if (b?.fourline) setSnap((prev) => preferNewer(prev, b.fourline));
          if (b?.room) setRoomRow(b.room);
          if (b?.players) setPlayers(b.players);
          if (b) setGameSessionRow(b.gameSession ?? null);
        }
        return { ok: true };
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        return { ok: false };
      } finally {
        setBusy(false);
      }
    },
    [roomId, snap, busy],
  );

  const vm = useMemo(() => {
    const phase = snap ? String(snap.phase || "").toLowerCase() : "";
    const turnDeadline = null;
    const turnTimeLeftSec = null;
    return {
      phase,
      turnSeat: snap?.turnSeat ?? null,
      mySeat: snap?.mySeat ?? null,
      winnerSeat: snap?.winnerSeat ?? null,
      revision: snap?.revision ?? 0,
      sessionId: snap?.sessionId != null ? String(snap.sessionId) : "",
      turnDeadline,
      turnTimeLeftSec,
      missedStreakBySeat: { 0: 0, 1: 0 },
      cells: Array.isArray(snap?.cells) ? snap.cells : [],
      lastMove: snap?.lastMove ?? null,
      stakeMultiplier: 1,
      doublesAccepted: 0,
      pendingDouble: null,
      canOfferDouble: false,
      mustRespondDouble: false,
      chipsPerSeatAtStake: null,
      chipsPrizeTotal: null,
    };
  }, [snap]);

  return {
    snapshot: snap,
    vm,
    busy,
    err,
    setErr,
    playColumn,
    roomId,
    room: roomRow,
    players,
    gameSession: gameSessionRow,
    bundleLoaded,
  };
}
