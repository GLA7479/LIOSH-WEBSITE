import { requireArcadeStudent } from "../../../../../lib/arcade/server/arcade-auth";
import { applyBingoArcadeAction, getBingoOv2RpcPayload } from "../../../../../lib/arcade/server/bingo-game";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const roomId = String(body.roomId || "").trim();
  const action = String(body.action || "").trim().toLowerCase();

  if (!roomId || !action) {
    return res.status(400).json({ ok: false, message: "בקשה לא תקינה", code: "invalid_action" });
  }

  try {
    const result = await applyBingoArcadeAction(auth.supabase, {
      roomId,
      studentId: auth.studentId,
      action,
      payload: {
        expectedRevision: body.expectedRevision,
        prizeKey: body.prizeKey,
        expectedMatchSeq: body.expectedMatchSeq,
      },
    });

    if (result.error) {
      const e = result.error;
      const status = typeof e.status === "number" ? e.status : 400;
      return res.status(status).json({
        ok: false,
        message: e.message || "שגיאה",
        code: e.code || "error",
        revision: e.revision,
        next_call_at: e.next_call_at,
      });
    }

    const snapshot = await getBingoOv2RpcPayload(auth.supabase, roomId, auth.studentId);
    if (!snapshot) {
      return res.status(500).json({ ok: false, message: "לא ניתן לטעון מצב משחק", code: "snapshot_failed" });
    }

    return res.status(200).json({ ok: true, snapshot });
  } catch (err) {
    console.error("[api/arcade/games/bingo/action] unexpected error", err);
    return res.status(500).json({ ok: false, code: "server_error", message: "שגיאת שרת" });
  }
}
