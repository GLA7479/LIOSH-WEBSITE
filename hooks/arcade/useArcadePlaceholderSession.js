import { useEffect, useRef, useState } from "react";
import { fetchArcadePlaceholderBundle } from "../../lib/arcade/placeholder/placeholderSessionAdapter";

/**
 * @param {{ roomId: string }} ctx
 */
export function useArcadePlaceholderSession(ctx) {
  const roomId = String(ctx?.roomId || "").trim();

  const [placeholder, setPlaceholder] = useState(/** @type {Record<string, unknown>|null} */ (null));
  const [room, setRoom] = useState(/** @type {Record<string, unknown>|null} */ (null));
  const [players, setPlayers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [gameSession, setGameSession] = useState(/** @type {Record<string, unknown>|null} */ (null));
  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [bundleError, setBundleError] = useState("");
  const joinRecoveryAttemptedRef = useRef(false);
  const bundleLoadedOnceRef = useRef(false);
  const lastPollSigRef = useRef("");

  useEffect(() => {
    setPlaceholder(null);
    setRoom(null);
    setPlayers([]);
    setGameSession(null);
    setBundleLoaded(false);
    setBundleError("");
    joinRecoveryAttemptedRef.current = false;
    bundleLoadedOnceRef.current = false;
    lastPollSigRef.current = "";
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;

    const tick = async () => {
      let b = await fetchArcadePlaceholderBundle(roomId);
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
        b = await fetchArcadePlaceholderBundle(roomId);
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

      const ph = b.arcadePlaceholder;
      const roomSt = b.room?.status != null ? String(b.room.status) : "";
      const gsSt = b.gameSession?.status != null ? String(b.gameSession.status) : "";
      const rev = ph?.revision != null ? Number(ph.revision) : -1;
      const playerSig = Array.isArray(b.players)
        ? b.players.map((p) => `${p.student_id}`).join("|")
        : "";
      const pollSig = `${roomSt}|${gsSt}|${rev}|${playerSig}`;

      if (bundleLoadedOnceRef.current && pollSig === lastPollSigRef.current && lastPollSigRef.current !== "") {
        return;
      }
      lastPollSigRef.current = pollSig;

      setBundleError("");
      bundleLoadedOnceRef.current = true;
      setBundleLoaded(true);
      setRoom(b.room);
      setPlayers(b.players || []);
      setGameSession(b.gameSession ?? null);
      setPlaceholder(ph);
    };

    void tick();
    const interval = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [roomId]);

  return {
    placeholder,
    room,
    players,
    gameSession,
    bundleLoaded,
    bundleError,
  };
}
