import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchArcadeRoomLudoBundle, requestLudoGameAction } from "../../lib/arcade/ludo/ludoSessionAdapter";

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
export function useLudoSession(ctx) {
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
  const autoDiceScheduledRef = useRef(false);
  const autoMoveScheduledRef = useRef(false);

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
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;

    const tick = async () => {
      let b = await fetchArcadeRoomLudoBundle(roomId);
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
        b = await fetchArcadeRoomLudoBundle(roomId);
      }

      if (cancelled) return;

      if (!b.ok) {
        if (!bundleLoadedOnceRef.current) {
          const msg =
            b.code === "forbidden"
              ? "אין גישה לחדר (לא רשום כשחקן). נסה מהלובי «משחק מהיר» או «הצטרף לחדר»."
              : b.error || b.code || "טעינת החדר נכשלה";
          setBundleError(msg);
        }
        return;
      }

      const ld = b.ludo;
      const roomSt = b.room?.status != null ? String(b.room.status) : "";
      const gsSt = b.gameSession?.status != null ? String(b.gameSession.status) : "";
      const rev = ld?.revision != null ? Number(ld.revision) : -1;
      const phase = ld?.phase != null ? String(ld.phase) : "";
      const ts = ld?.turnSeat != null ? String(ld.turnSeat) : "";
      const di = ld?.dice != null ? String(ld.dice) : "";
      const playerSig = Array.isArray(b.players)
        ? b.players.map((p) => `${p.student_id}:${String(p.display_name ?? "").slice(0, 24)}`).join("|")
        : "";
      const pollSig = `${roomSt}|${gsSt}|${rev}|${phase}|${ts}|${di}|${playerSig}`;

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
      setSnap((prev) => preferNewer(prev, b.ludo));
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
    if (busy) return { ok: false };
    setBusy(true);
    setErr("");
    try {
      const r = await requestLudoGameAction(roomId, { action: "roll", revision: s.revision });
      if (!r.ok) {
        setErr(r.error || "פעולה נכשלה");
        return { ok: false };
      }
      if (r.snapshot) setSnap((prev) => preferNewer(prev, r.snapshot));
      else {
        const b = await fetchArcadeRoomLudoBundle(roomId);
        if (b.ok) {
          if (b.ludo) setSnap((prev) => preferNewer(prev, b.ludo));
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
      setBusy(false);
    }
  }, [roomId, busy]);

  const movePiece = useCallback(
    async (pieceIndex) => {
      const s = snapRef.current;
      if (!roomId || !s) return { ok: false };
      if (busy) return { ok: false };
      setBusy(true);
      setErr("");
      try {
        const r = await requestLudoGameAction(roomId, {
          action: "move",
          pieceIndex,
          revision: s.revision,
        });
        if (!r.ok) {
          setErr(r.error || "מהלך נכשל");
          return { ok: false };
        }
        if (r.snapshot) setSnap((prev) => preferNewer(prev, r.snapshot));
        else {
          const b = await fetchArcadeRoomLudoBundle(roomId);
          if (b.ok) {
            if (b.ludo) setSnap((prev) => preferNewer(prev, b.ludo));
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
        setBusy(false);
      }
    },
    [roomId, busy],
  );

  /** תור שלי בלי קוביה — זריקה אוטומטית (כללי מנוע זהים ל־OV2; השרת מטפל ב־6 /_pass) */
  useEffect(() => {
    if (!roomId || !snap?.canClientRoll || busy) {
      autoDiceScheduledRef.current = false;
      return undefined;
    }
    if (autoDiceScheduledRef.current) return undefined;
    autoDiceScheduledRef.current = true;
    const id = window.setTimeout(() => {
      const s = snapRef.current;
      if (!s?.canClientRoll) {
        autoDiceScheduledRef.current = false;
        return;
      }
      void rollDice().finally(() => {
        autoDiceScheduledRef.current = false;
      });
    }, 0);
    return () => {
      window.clearTimeout(id);
      autoDiceScheduledRef.current = false;
    };
  }, [roomId, snap?.revision, snap?.canClientRoll, busy, rollDice]);

  /** רק מהלך חוקי אחד — בחירה אוטומטית */
  useEffect(() => {
    if (!roomId || !snap?.canClientMovePiece || busy) {
      autoMoveScheduledRef.current = false;
      return undefined;
    }
    const legal = snap.legalMovablePieceIndices;
    if (!Array.isArray(legal) || legal.length !== 1) {
      autoMoveScheduledRef.current = false;
      return undefined;
    }
    const only = legal[0];
    if (!Number.isInteger(only)) return undefined;
    if (autoMoveScheduledRef.current) return undefined;
    autoMoveScheduledRef.current = true;
    const id = window.setTimeout(() => {
      const s = snapRef.current;
      const leg = s?.legalMovablePieceIndices;
      if (!s?.canClientMovePiece || !Array.isArray(leg) || leg.length !== 1 || leg[0] !== only) {
        autoMoveScheduledRef.current = false;
        return;
      }
      void movePiece(only).finally(() => {
        autoMoveScheduledRef.current = false;
      });
    }, 0);
    return () => {
      window.clearTimeout(id);
      autoMoveScheduledRef.current = false;
    };
  }, [roomId, snap?.revision, snap?.canClientMovePiece, snap?.dice, snap?.legalMovablePieceIndices, busy, movePiece]);

  const vm = useMemo(() => {
    const phase = snap ? String(snap.phase || "").toLowerCase() : "";
    return {
      phase,
      board: snap?.board ?? {},
      turnSeat: snap?.turnSeat ?? null,
      mySeat: snap?.mySeat ?? null,
      winnerSeat: snap?.winnerSeat ?? null,
      revision: snap?.revision ?? 0,
      sessionId: snap?.sessionId != null ? String(snap.sessionId) : "",
      dice: snap?.dice ?? null,
      lastDice: snap?.lastDice ?? null,
      canClientRoll: snap?.canClientRoll === true,
      canClientMovePiece: snap?.canClientMovePiece === true,
      legalMovablePieceIndices: Array.isArray(snap?.legalMovablePieceIndices)
        ? snap.legalMovablePieceIndices
        : null,
    };
  }, [snap]);

  return {
    snapshot: snap,
    vm,
    busy,
    err,
    setErr,
    rollDice,
    movePiece,
    roomId,
    room: roomRow,
    players,
    gameSession: gameSessionRow,
    bundleLoaded,
    bundleError,
  };
}
