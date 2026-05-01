import { requireArcadeStudent } from "../../../../lib/arcade/server/arcade-auth";
import { leaveArcadeRoom } from "../../../../lib/arcade/server/arcade-rooms";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const roomId = String(body.roomId || "").trim();
  if (!roomId) {
    return res.status(400).json({ ok: false, error: "חסר מזהה חדר", code: "bad_request" });
  }

  const result = await leaveArcadeRoom(auth.supabase, auth.studentId, roomId);

  if (result.error) {
    const code = result.error.code || "bad_request";
    const status = code === "room_not_found" ? 404 : code === "not_in_room" ? 409 : 400;
    return res.status(status).json({ ok: false, error: result.error.message, code });
  }

  return res.status(200).json({
    ok: true,
    mode: result.mode,
    roomId,
  });
}
