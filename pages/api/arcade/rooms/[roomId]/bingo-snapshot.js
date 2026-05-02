import { requireArcadeStudent } from "../../../../../lib/arcade/server/arcade-auth";
import { getBingoOv2RpcPayload } from "../../../../../lib/arcade/server/bingo-game";

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

  const snapshot = await getBingoOv2RpcPayload(auth.supabase, roomId, auth.studentId);
  if (!snapshot) {
    return res.status(403).json({ ok: false, error: "אין גישה", code: "forbidden" });
  }

  return res.status(200).json({ ok: true, snapshot });
}
