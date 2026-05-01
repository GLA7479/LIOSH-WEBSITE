import crypto from "node:crypto";
import { ARCADE_ENTRY_COSTS } from "../game-registry";
import { refundArcadeEntry, spendArcadeEntry } from "./arcade-coins";
import { assertGameAllowsArcadeSpend } from "./arcade-game-policy";
import { maybeStartFourlineSession } from "./fourline-game";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(length = 6) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += JOIN_CODE_ALPHABET[crypto.randomInt(0, JOIN_CODE_ALPHABET.length)];
  }
  return out;
}

export async function fetchGameRow(supabase, gameKey) {
  const { data, error } = await supabase
    .from("arcade_games")
    .select("*")
    .eq("game_key", gameKey)
    .maybeSingle();

  if (error) return { error: { code: "db_error", message: error.message } };
  if (!data) return { error: { code: "unknown_game", message: "משחק לא קיים" } };
  return { game: data };
}

export function validateEntryCost(gameRow, entryCost) {
  const c = Number(entryCost);
  if (!ARCADE_ENTRY_COSTS.includes(c)) {
    return { error: { code: "invalid_entry_cost", message: "עלות כניסה לא חוקית" } };
  }
  const allowed = Array.isArray(gameRow.allowed_entry_costs) ? gameRow.allowed_entry_costs : [];
  if (!allowed.includes(c)) {
    return { error: { code: "entry_cost_not_allowed", message: "עלות לא זמינה למשחק זה" } };
  }
  return { ok: true, entryCost: c };
}

export function normalizeJoinCode(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

/**
 * Create a room; host spends entry once (idempotent per room id).
 */
export async function createArcadeRoom(supabase, params) {
  const { studentId, gameKey, roomType, entryCost, maxPlayers: maxPlayersArg } = params;

  const gameLookup = await fetchGameRow(supabase, gameKey);
  if (gameLookup.error) return gameLookup;

  const game = gameLookup.game;

  const spendOk = assertGameAllowsArcadeSpend(game);
  if (spendOk.error) return spendOk;

  const rt = String(roomType || "").trim();
  if (rt !== "public" && rt !== "private") {
    return {
      error: {
        code: "invalid_room_type",
        message: "סוג חדר לא נתמך (מותר public או private בלבד)",
      },
    };
  }

  if (rt === "public" && game.supports_public_rooms !== true) {
    return { error: { code: "room_type_not_supported", message: "חדר ציבורי לא נתמך למשחק זה" } };
  }
  if (rt === "private" && game.supports_private_rooms !== true) {
    return { error: { code: "room_type_not_supported", message: "חדר פרטי לא נתמך למשחק זה" } };
  }

  const costCheck = validateEntryCost(game, entryCost);
  if (costCheck.error) return costCheck;
  let maxPlayers = Number(maxPlayersArg || game.max_players);
  if (!Number.isFinite(maxPlayers) || maxPlayers < game.min_players) {
    maxPlayers = game.max_players;
  }
  maxPlayers = Math.min(Math.max(maxPlayers, game.min_players), game.max_players);

  const roomId = crypto.randomUUID();

  let joinCode = null;
  if (rt === "private") {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = generateJoinCode(6);
      const { data: clash } = await supabase
        .from("arcade_rooms")
        .select("id")
        .eq("join_code", candidate)
        .maybeSingle();
      if (!clash?.id) {
        joinCode = candidate;
        break;
      }
    }
    if (!joinCode) {
      return { error: { code: "join_code_failed", message: "לא ניתן ליצור קוד חדר" } };
    }
  }

  const insertRoom = await supabase.from("arcade_rooms").insert({
    id: roomId,
    game_key: gameKey,
    host_student_id: studentId,
    room_type: rt,
    entry_cost: costCheck.entryCost,
    join_code: joinCode,
    status: "waiting",
    max_players: maxPlayers,
    metadata: {},
  }).select("*").single();

  if (insertRoom.error || !insertRoom.data) {
    return { error: { code: "room_create_failed", message: insertRoom.error?.message || "שגיאה" } };
  }

  const spend = await spendArcadeEntry(supabase, studentId, costCheck.entryCost, `arcade:room:${roomId}:host`, {
    sourceId: roomId,
  });

  if (!spend.ok) {
    await supabase.from("arcade_rooms").delete().eq("id", roomId);
    if (spend.code === "insufficient_funds") {
      return { error: { code: "insufficient_funds", message: "אין מספיק מטבעות" } };
    }
    return { error: { code: spend.code || "spend_failed", message: spend.message || "שגיאת חיוב" } };
  }

  const insPlayer = await supabase.from("arcade_room_players").insert({
    room_id: roomId,
    student_id: studentId,
    seat_index: 0,
    ready_state: false,
    metadata: { role: "host" },
  }).select("id").single();

  if (insPlayer.error) {
    await refundArcadeEntry(supabase, studentId, costCheck.entryCost, `arcade:refund:room_create_rollback:${roomId}`, {
      sourceId: roomId,
    });
    await supabase.from("arcade_rooms").delete().eq("id", roomId);
    return { error: { code: "player_insert_failed", message: insPlayer.error.message } };
  }

  return { room: insertRoom.data, hostSpend: spend };
}

export async function joinArcadeRoomById(supabase, studentId, roomId) {
  const { data: room, error: rErr } = await supabase
    .from("arcade_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (rErr || !room) return { error: { code: "room_not_found", message: "חדר לא נמצא" } };
  if (room.status !== "waiting") {
    return { error: { code: "room_not_joinable", message: "לא ניתן להצטרף לחדר זה" } };
  }

  const gameLookup = await fetchGameRow(supabase, room.game_key);
  if (gameLookup.error) return gameLookup;
  const spendOk = assertGameAllowsArcadeSpend(gameLookup.game);
  if (spendOk.error) return spendOk;

  const { data: existing } = await supabase
    .from("arcade_room_players")
    .select("id")
    .eq("room_id", roomId)
    .eq("student_id", studentId)
    .is("left_at", null)
    .maybeSingle();

  if (existing?.id) {
    return { error: { code: "already_joined", message: "כבר בחדר" } };
  }

  const { count: playerCount, error: cErr } = await supabase
    .from("arcade_room_players")
    .select("*", { count: "exact", head: true })
    .eq("room_id", roomId)
    .is("left_at", null);

  if (cErr) return { error: { code: "db_error", message: cErr.message } };
  if ((playerCount || 0) >= room.max_players) {
    return { error: { code: "room_full", message: "החדר מלא" } };
  }

  const spend = await spendArcadeEntry(
    supabase,
    studentId,
    room.entry_cost,
    `arcade:room:${roomId}:join:${studentId}`,
    { sourceId: roomId },
  );

  if (!spend.ok) {
    if (spend.code === "insufficient_funds") {
      return { error: { code: "insufficient_funds", message: "אין מספיק מטבעות" } };
    }
    return { error: { code: spend.code || "spend_failed", message: spend.message || "שגיאת חיוב" } };
  }

  const seatIndex = playerCount || 0;
  const ins = await supabase.from("arcade_room_players").insert({
    room_id: roomId,
    student_id: studentId,
    seat_index: seatIndex,
    ready_state: false,
    metadata: { role: "player" },
  }).select("*").single();

  if (ins.error) {
    await refundArcadeEntry(supabase, studentId, room.entry_cost, `arcade:refund:join_failed:${roomId}:${studentId}`, {
      sourceId: roomId,
    });
    const msg = String(ins.error.message || "");
    const codePg = String(ins.error.code || "");
    const slotConflict =
      codePg === "23505" ||
      msg.includes("arcade_room_players_active_seat") ||
      msg.includes("arcade_room_players_active_student");
    return {
      error: {
        code: slotConflict ? "seat_taken" : "join_failed",
        message: slotConflict ? "מקום תפוס או החדר התמלא" : ins.error.message,
      },
    };
  }

  const roomForClient = { ...room };
  if (room.host_student_id !== studentId) {
    roomForClient.join_code = null;
  }

  const joinedCount = (playerCount || 0) + 1;
  if (room.game_key === "fourline" && joinedCount >= room.max_players) {
    await maybeStartFourlineSession(supabase, roomId);
  }

  return { room: roomForClient, player: ins.data };
}

export async function joinArcadeRoomByCode(supabase, studentId, rawCode) {
  const code = normalizeJoinCode(rawCode);
  if (code.length < 4) {
    return { error: { code: "invalid_code", message: "קוד לא תקין" } };
  }

  const { data: room, error } = await supabase
    .from("arcade_rooms")
    .select("*")
    .eq("join_code", code)
    .maybeSingle();

  if (error || !room) return { error: { code: "room_not_found", message: "לא נמצא חדר לקוד" } };
  return joinArcadeRoomById(supabase, studentId, room.id);
}

async function refundWaitingPlayer(supabase, room, studentId, reasonKey) {
  return refundArcadeEntry(supabase, studentId, room.entry_cost, `arcade:refund:${reasonKey}:${room.id}:${studentId}`, {
    sourceId: room.id,
    metadata: { reason: reasonKey },
  });
}

/**
 * Leave waiting room: refunds leaver; if host leaves, cancels room and refunds everyone else still present.
 */
export async function leaveArcadeRoom(supabase, studentId, roomId) {
  const { data: room, error: rErr } = await supabase
    .from("arcade_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (rErr || !room) return { error: { code: "room_not_found", message: "חדר לא נמצא" } };

  const { data: membership } = await supabase
    .from("arcade_room_players")
    .select("*")
    .eq("room_id", roomId)
    .eq("student_id", studentId)
    .is("left_at", null)
    .maybeSingle();

  if (!membership) {
    return { error: { code: "not_in_room", message: "לא רשום בחדר" } };
  }

  if (room.status !== "waiting") {
    await supabase
      .from("arcade_room_players")
      .update({ left_at: new Date().toISOString() })
      .eq("id", membership.id);
    return { ok: true, mode: "left_no_refund", room };
  }

  await refundWaitingPlayer(supabase, room, studentId, "room_leave");

  await supabase
    .from("arcade_room_players")
    .update({ left_at: new Date().toISOString() })
    .eq("id", membership.id);

  const isHost = room.host_student_id === studentId;

  if (isHost) {
    await supabase.from("arcade_rooms").update({ status: "cancelled", ended_at: new Date().toISOString() }).eq("id", roomId);

    const { data: others } = await supabase
      .from("arcade_room_players")
      .select("student_id,id")
      .eq("room_id", roomId)
      .is("left_at", null);

    for (const row of others || []) {
      await refundWaitingPlayer(supabase, room, row.student_id, "room_cancelled_host");
      await supabase
        .from("arcade_room_players")
        .update({ left_at: new Date().toISOString() })
        .eq("id", row.id);
    }

    return { ok: true, mode: "host_cancelled_room", room };
  }

  return { ok: true, mode: "left_refunded", room };
}
