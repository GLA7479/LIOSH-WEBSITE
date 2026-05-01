import { requireArcadeStudent } from "../../../../lib/arcade/server/arcade-auth";
import { listOpenArcadeRooms } from "../../../../lib/arcade/server/arcade-rooms";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const gameKey = String(req.query.gameKey || "").trim();
  if (!gameKey) {
    return res.status(400).json({ ok: false, error: "חסר משחק", code: "bad_request" });
  }

  const result = await listOpenArcadeRooms(auth.supabase, gameKey);

  if (result.error) {
    return res.status(400).json({
      ok: false,
      error: result.error.message || "שגיאה",
      code: result.error.code || "bad_request",
    });
  }

  return res.status(200).json({ ok: true, rooms: result.rooms });
}
