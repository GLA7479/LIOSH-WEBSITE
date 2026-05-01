import { requireArcadeStudent } from "../../../../lib/arcade/server/arcade-auth";
import { joinArcadeRoomByCode } from "../../../../lib/arcade/server/arcade-rooms";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const joinCode = body.joinCode;

  const result = await joinArcadeRoomByCode(auth.supabase, auth.studentId, joinCode);

  if (result.error) {
    const code = result.error.code || "bad_request";
    const status =
      code === "insufficient_funds"
        ? 402
        : code === "room_not_found"
          ? 404
          : code === "game_not_active"
            ? 403
            : code === "room_full" || code === "already_joined" || code === "seat_taken"
              ? 409
              : 400;
    return res.status(status).json({ ok: false, error: result.error.message, code });
  }

  return res.status(200).json({
    ok: true,
    room: result.room,
    player: result.player,
  });
}
