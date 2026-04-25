import {
  isDevStudentSimulatorEnabled,
  clearDevStudentSimulatorSessionCookie,
} from "../../../utils/server/dev-student-simulator-auth";

export default function handler(req, res) {
  if (!isDevStudentSimulatorEnabled()) {
    res.status(404).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).setHeader("Allow", "POST").end();
    return;
  }
  clearDevStudentSimulatorSessionCookie(res);
  res.status(200).json({ ok: true });
}
