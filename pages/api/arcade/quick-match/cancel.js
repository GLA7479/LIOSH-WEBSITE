import { requireArcadeStudent } from "../../../../lib/arcade/server/arcade-auth";
import { cancelQuickMatch } from "../../../../lib/arcade/server/arcade-quick-match";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  const result = await cancelQuickMatch(auth.supabase, auth.studentId);

  if (result.error) {
    const code = result.error.code || "bad_request";
    const status =
      code === "nothing_to_cancel"
        ? 404
        : code === "qm_not_cancellable"
          ? 409
          : 400;
    return res.status(status).json({
      ok: false,
      error: result.error.message,
      code,
      ...(result.error.queueStatus != null ? { queueStatus: result.error.queueStatus } : {}),
    });
  }

  return res.status(200).json({
    ok: true,
    cancelledQueueId: result.cancelledQueueId,
  });
}
