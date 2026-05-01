import { requireArcadeStudent } from "../../../../../lib/arcade/server/arcade-auth";
import { getArcadeRoomSnapshot } from "../../../../../lib/arcade/server/arcade-snapshot";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const roomId = String(req.query.roomId || "").trim();
  if (!roomId) {
    return res.status(400).json({ ok: false, error: "חסר מזהה חדר", code: "bad_request" });
  }

  const snapshot = await getArcadeRoomSnapshot(auth.supabase, auth.studentId, roomId);

  if (snapshot.error) {
    const code = snapshot.error.code || "bad_request";
    const status = code === "room_not_found" ? 404 : code === "forbidden" ? 403 : 400;
    return res.status(status).json({ ok: false, error: snapshot.error.message, code });
  }

  return res.status(200).json({
    ok: true,
    room: snapshot.room,
    players: snapshot.players,
    gameSession: snapshot.gameSession,
    membership: snapshot.membership,
  });
}
