import { requireArcadeStudent } from "../../../../../lib/arcade/server/arcade-auth";
import { applySnakesAndLaddersAction } from "../../../../../lib/arcade/server/snakesLaddersGame";
import { getArcadeRoomSnapshot } from "../../../../../lib/arcade/server/arcade-snapshot";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const roomId = String(body.roomId || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const revision = body.revision;

  if (!roomId || !action) {
    return res.status(400).json({ ok: false, error: "בקשה לא תקינה", code: "invalid_action" });
  }

  try {
    const result = await applySnakesAndLaddersAction(auth.supabase, {
      roomId,
      studentId: auth.studentId,
      action,
      expectedRevision: revision != null && revision !== "" ? Number(revision) : null,
    });

    if (result.error) {
      const e = result.error;
      const status = typeof e.status === "number" ? e.status : 400;
      return res.status(status).json({
        ok: false,
        error: e.message || "שגיאה",
        code: e.code || "error",
        revision: e.revision,
      });
    }

    const snap = await getArcadeRoomSnapshot(auth.supabase, auth.studentId, roomId);

    if (snap.error) {
      return res.status(500).json({ ok: false, error: snap.error.message || "שגיאה", code: snap.error.code });
    }

    return res.status(200).json({
      ok: true,
      snakesAndLadders: snap.snakesAndLadders,
      room: snap.room,
      players: snap.players,
      gameSession: snap.gameSession,
    });
  } catch (err) {
    console.error("[api/arcade/games/snakes-and-ladders/action] unexpected error", err);
    return res.status(500).json({
      ok: false,
      code: "server_error",
      error: "שגיאת שרת",
    });
  }
}
