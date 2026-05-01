import { requireArcadeStudent } from "../../../lib/arcade/server/arcade-auth";
import { ARCADE_GAME_REGISTRY } from "../../../lib/arcade/game-registry";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const auth = await requireArcadeStudent(req, res);
  if (!auth) return;

  try {
    const { data: rows, error } = await auth.supabase
      .from("arcade_games")
      .select(
        "game_key,title,enabled,foundation_only,min_players,max_players,supports_quick_match,supports_public_rooms,supports_private_rooms,allowed_entry_costs,created_at",
      )
      .order("game_key", { ascending: true });

    if (error) {
      return res.status(500).json({ ok: false, error: "טעינת משחקים נכשלה", code: "db_error" });
    }

    const list = (rows || []).map((r) => ({
      gameKey: r.game_key,
      title: r.title,
      enabled: r.enabled,
      foundationOnly: r.foundation_only,
      minPlayers: r.min_players,
      maxPlayers: r.max_players,
      supportsQuickMatch: r.supports_quick_match,
      supportsPublicRooms: r.supports_public_rooms,
      supportsPrivateRooms: r.supports_private_rooms,
      allowedEntryCosts: r.allowed_entry_costs,
      createdAt: r.created_at,
    }));

    if (list.length === 0) {
      return res.status(200).json({
        ok: true,
        games: ARCADE_GAME_REGISTRY.map((g) => ({
          gameKey: g.gameKey,
          title: g.title,
          enabled: false,
          foundationOnly: g.foundationOnly,
          minPlayers: g.minPlayers,
          maxPlayers: g.maxPlayers,
          supportsQuickMatch: true,
          supportsPublicRooms: true,
          supportsPrivateRooms: true,
          allowedEntryCosts: [10, 100, 1000, 10000],
          createdAt: null,
        })),
        fallback: true,
      });
    }

    return res.status(200).json({ ok: true, games: list });
  } catch (_e) {
    return res.status(500).json({ ok: false, error: "שגיאת שרת" });
  }
}
