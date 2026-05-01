/**
 * Composite read for a student's view of a room (membership enforced).
 */

import { buildFourlineClientSnapshot } from "../fourline/buildFourlineSnapshot";

export async function getArcadeRoomSnapshot(supabase, studentId, roomId) {
  const { data: room, error: roomErr } = await supabase
    .from("arcade_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr || !room) {
    return { error: { code: "room_not_found", message: "חדר לא נמצא" } };
  }

  const { data: players, error: pErr } = await supabase
    .from("arcade_room_players")
    .select("*")
    .eq("room_id", roomId)
    .is("left_at", null)
    .order("seat_index", { ascending: true });

  if (pErr) {
    return { error: { code: "db_error", message: pErr.message } };
  }

  const active = players || [];
  const membership = active.find((row) => row.student_id === studentId);
  if (!membership) {
    return { error: { code: "forbidden", message: "אין גישה לחדר זה" } };
  }

  const studentIds = [...new Set(active.map((p) => p.student_id).filter(Boolean))];
  /** @type {Map<string, string>} */
  const nameById = new Map();
  if (studentIds.length > 0) {
    const { data: studs } = await supabase.from("students").select("id, full_name").in("id", studentIds);
    for (const s of studs || []) {
      if (s?.id) nameById.set(String(s.id), String(s.full_name || "").trim());
    }
  }

  const playersWithNames = active.map((p) => ({
    ...p,
    display_name: nameById.get(String(p.student_id)) || "",
  }));

  const { data: gameSession } = await supabase
    .from("arcade_game_sessions")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();

  const isHost = room.host_student_id === studentId;
  const roomForClient = { ...room };
  if (!isHost) {
    roomForClient.join_code = null;
  }

  /** @type {Record<string, unknown>|null} */
  let fourline = null;
  if (room.game_key === "fourline" && gameSession) {
    fourline = buildFourlineClientSnapshot(gameSession, playersWithNames, studentId);
  }

  return {
    room: roomForClient,
    players: playersWithNames,
    gameSession: gameSession || null,
    membership,
    fourline,
  };
}
