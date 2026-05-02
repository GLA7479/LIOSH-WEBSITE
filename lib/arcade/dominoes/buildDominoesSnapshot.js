/**
 * צילום לקוח — דומינו ארקייד (2 שחקנים)
 */

import {
  ALL_TILES,
  chainOpenEnds,
  enumerateLegalPlays,
} from "./dominoesEngine";

/**
 * @param {Record<string, unknown>|null} gameSession
 * @param {Array<Record<string, unknown>>} players
 * @param {string} viewerStudentId
 * @param {Record<string, unknown>|null} [room]
 */
export function buildDominoesClientSnapshot(gameSession, players, viewerStudentId, room = null) {
  if (!gameSession || typeof gameSession !== "object") return null;

  const state = /** @type {Record<string, unknown>} */ (
    gameSession.state && typeof gameSession.state === "object" ? gameSession.state : {}
  );
  const sessionStatus = String(gameSession.status || "");
  const phaseRaw = state.phase != null ? String(state.phase) : "";
  const phase =
    sessionStatus === "finished" || phaseRaw === "finished"
      ? "finished"
      : phaseRaw === "playing"
        ? "playing"
        : phaseRaw || "playing";

  /** @type {null|0|1} */
  let mySeat = null;
  const list = Array.isArray(players) ? players : [];
  for (const p of list) {
    if (p.student_id === viewerStudentId) {
      const si = Number(p.seat_index);
      if (si === 0 || si === 1) mySeat = /** @type {0|1} */ (si);
      break;
    }
  }

  const dom =
    state.dominoes && typeof state.dominoes === "object"
      ? /** @type {Record<string, unknown>} */ (state.dominoes)
      : {};

  const handsRaw = dom.hands;
  /** @type {number[][]} */
  let hands = [[], []];
  if (Array.isArray(handsRaw) && handsRaw.length >= 2) {
    hands = [
      Array.isArray(handsRaw[0]) ? handsRaw[0].map((x) => Number(x)) : [],
      Array.isArray(handsRaw[1]) ? handsRaw[1].map((x) => Number(x)) : [],
    ];
  }

  const chainRaw = dom.chain;
  /** @type {{ tileId: number, leftPip: number, rightPip: number }[]} */
  const chain = [];
  if (Array.isArray(chainRaw)) {
    for (const c of chainRaw) {
      if (c && typeof c === "object") {
        const o = /** @type {Record<string, unknown>} */ (c);
        chain.push({
          tileId: Number(o.tileId),
          leftPip: Number(o.leftPip),
          rightPip: Number(o.rightPip),
        });
      }
    }
  }

  const myHandIds = mySeat === 0 || mySeat === 1 ? hands[mySeat] || [] : [];
  /** @type {{ id: number, a: number, b: number }[]} */
  const myHandTiles = [];
  for (const id of myHandIds) {
    const t = ALL_TILES[id];
    if (t) myHandTiles.push({ id: t.id, a: t.a, b: t.b });
  }

  const oppCount =
    mySeat === 0 ? hands[1]?.length ?? 0 : mySeat === 1 ? hands[0]?.length ?? 0 : 0;

  /** @type {{ tileId: number, a: number, b: number, leftPip: number, rightPip: number }[]} */
  const chainPublic = [];
  for (const seg of chain) {
    const t = ALL_TILES[seg.tileId];
    chainPublic.push({
      tileId: seg.tileId,
      a: t ? t.a : 0,
      b: t ? t.b : 0,
      leftPip: seg.leftPip,
      rightPip: seg.rightPip,
    });
  }

  const openEnds = chainOpenEnds(chain);

  const playing = phase === "playing" && sessionStatus === "active";
  const myTurn =
    playing &&
    mySeat != null &&
    String(gameSession.current_turn_student_id || "") === String(viewerStudentId);

  let legalPlays = [];
  if (playing && myTurn && mySeat != null) {
    legalPlays = enumerateLegalPlays(hands[mySeat] || [], chain);
  }

  const wRaw = state.winnerSeat;
  /** @type {null|0|1} */
  let winnerSeat = null;
  if (wRaw !== null && wRaw !== undefined && wRaw !== "null") {
    const w = Number(wRaw);
    if (w === 0 || w === 1) winnerSeat = w;
  }

  const entryCost = room?.entry_cost != null ? Math.max(0, Math.floor(Number(room.entry_cost))) : 0;
  const prizePoolAmount =
    phase === "finished" && (winnerSeat === 0 || winnerSeat === 1) && entryCost > 0 ? entryCost * 2 : null;

  /** @type {number|null} */
  let mySettlementAmount = null;
  if (phase === "finished") {
    if (winnerSeat === 0 || winnerSeat === 1) {
      if (mySeat === winnerSeat && prizePoolAmount != null) mySettlementAmount = prizePoolAmount;
      else mySettlementAmount = 0;
    } else if (entryCost > 0) {
      mySettlementAmount = entryCost;
    } else {
      mySettlementAmount = 0;
    }
  }

  return {
    revision: gameSession.revision != null ? Number(gameSession.revision) : 0,
    sessionId: String(gameSession.id ?? ""),
    roomId: String(gameSession.room_id ?? ""),
    phase,
    mySeat,
    winnerSeat,
    chain: chainPublic,
    openEnds,
    myHand: myHandTiles,
    opponentHandCount: oppCount,
    legalPlays,
    canClientAct: playing && myTurn,
    mustPass: playing && myTurn && legalPlays.length === 0,
    boardViewReadOnly: !playing,
    prizePoolAmount,
    mySettlementAmount,
    entryCost,
  };
}
