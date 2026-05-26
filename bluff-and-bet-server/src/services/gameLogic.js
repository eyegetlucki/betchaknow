// ─── src/services/gameLogic.js ────────────────────────────────────────────────
// Pure game rules. No DB calls — fully testable.

const START_POINTS     = 500;
const NO_BET_BONUS     = 50;
const BLUFF_BONUS      = 75;
const STREAK_THRESHOLD = 3;
const STREAK_MULT      = 1.75;
const MIN_BET          = 5;

// ─── PLAYER FACTORY ──────────────────────────────────────────────────────────
function createPlayer({ id, username, avatar, character = "", color, isVIP = false }) {
  return {
    id, username, avatar, character, color, isVIP,
    points:      START_POINTS,
    streak:      0,
    allInUsed:   false,
    allInAmount: null,
    // Per-round fields (reset each round)
    bet:         null,
    answer:      null,
    doubleDown:  false,
    correct:     null,
    payout:      null,
    ready:       false,
  };
}

function resetPlayerRound(player) {
  return {
    ...player,
    bet: null, answer: null, doubleDown: false,
    correct: null, payout: null, ready: false,
  };
}

// ─── BET VALIDATION ──────────────────────────────────────────────────────────
function validateBet(player, bet, settings) {
  const { type, amount, targetId } = bet;

  if (type === "none") {
    if (!settings.noBetBonus) return { valid: false, reason: "No-bet bonus is disabled" };
    return { valid: true };
  }
  if (type === "allin") {
    if (!settings.allInToken) return { valid: false, reason: "All-In is disabled" };
    if (player.allInUsed)     return { valid: false, reason: "All-In already used" };
    if (player.points <= 0)   return { valid: false, reason: "No points to go all-in with" };
    return { valid: true };
  }
  if (type === "self") {
    if (!Number.isInteger(amount) || amount < MIN_BET)
      return { valid: false, reason: `Minimum bet is ${MIN_BET}` };
    if (amount > player.points)
      return { valid: false, reason: "Bet exceeds balance" };
    return { valid: true };
  }
  if (type === "other") {
    if (!settings.betOnOthers) return { valid: false, reason: "Betting on others is disabled" };
    if (!targetId)              return { valid: false, reason: "No target player" };
    if (amount < MIN_BET)       return { valid: false, reason: `Minimum bet is ${MIN_BET}` };
    if (amount > player.points) return { valid: false, reason: "Bet exceeds balance" };
    return { valid: true };
  }
  return { valid: false, reason: "Unknown bet type" };
}

// ─── DOUBLE DOWN VALIDATION ───────────────────────────────────────────────────
function canDoubleDown(player, settings) {
  if (!settings.doubleDown)       return { allowed: false, reason: "Double Down disabled" };
  if (!player.bet)                return { allowed: false, reason: "No bet placed" };
  if (player.bet.type !== "self") return { allowed: false, reason: "Only on self-bets" };
  if (player.points < player.bet.amount * 2)
    return { allowed: false, reason: `Need ${player.bet.amount * 2} pts, have ${player.points}` };
  return { allowed: true };
}

// ─── PAYOUT CALCULATION ───────────────────────────────────────────────────────
function calcPayout(player, correctIdx, allPlayers, settings) {
  const { bet, answer, doubleDown, streak } = player;
  if (!bet) return 0;

  const correct    = answer === correctIdx;
  const streakMult = (settings.streakMultiplier && streak >= STREAK_THRESHOLD) ? STREAK_MULT : 1;
  const ddMult     = (settings.doubleDown && doubleDown) ? 2 : 1;

  switch (bet.type) {
    case "none":
      return correct ? NO_BET_BONUS : 0;

    case "allin": {
      const stake = player.allInAmount || player.points;
      return correct ? stake : 0;  // free use — no penalty on wrong answer
    }

    case "self": {
      const mult = streakMult * ddMult;
      return correct ? Math.round(bet.amount * mult) : -bet.amount;
    }

    case "other": {
      const target = allPlayers.find(p => p.id === bet.targetId);
      if (!target) return 0;
      return (target.answer === correctIdx) ? bet.amount : -bet.amount;
    }

    default: return 0;
  }
}

// ─── BLUFF BONUS ──────────────────────────────────────────────────────────────
function calcBluffBonus(blufferId, allPlayers, correctIdx, settings) {
  if (!settings.bluffing) return 0;
  const bluffer = allPlayers.find(p => p.id === blufferId);
  if (!bluffer || bluffer.answer === correctIdx) return 0; // bluffer was correct — no bluff
  return allPlayers.filter(p =>
    p.id !== blufferId &&
    p.bet?.type === "other" &&
    p.bet?.targetId === blufferId
  ).length * BLUFF_BONUS;
}

// ─── APPLY ROUND RESULTS ──────────────────────────────────────────────────────
function applyRoundResults(players, correctIdx, settings) {
  const withCorrect = players.map(p => ({
    ...p,
    correct:     p.answer === correctIdx,
    allInAmount: p.bet?.type === "allin" ? p.points : p.allInAmount,
  }));

  return withCorrect.map(p => {
    const payout     = calcPayout(p, correctIdx, withCorrect, settings);
    const bluffBonus = calcBluffBonus(p.id, withCorrect, correctIdx, settings);
    const total      = payout + bluffBonus;
    return {
      ...p,
      bluffBonus,
      payout:    total,
      points:    Math.max(0, p.points + total),
      streak:    p.correct ? p.streak + 1 : 0,
      allInUsed: p.bet?.type === "allin" ? true : p.allInUsed,
    };
  });
}

// ─── POWER-UP ROUNDS (every 5th) ─────────────────────────────────────────────
const POWER_UPS = [
  { id:"shuffle",    name:"🔀 Shuffle",      desc:"Answer options rearranged for everyone" },
  { id:"speed",      name:"⏱️ Speed Round",  desc:"Timer cut in half" },
  { id:"dark",       name:"🔇 Dark Round",   desc:"Can't see others' ready status" },
  { id:"double_pot", name:"💥 Double Pot",   desc:"All payouts 2x this round" },
  { id:"chaos",      name:"🎰 Chaos",        desc:"Bets randomly reassigned" },
];

function getRandomPowerUp() {
  return POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
}

function applyPowerUp(players, powerUpId) {
  if (powerUpId === "chaos") {
    // Randomly swap bets between players
    const bets = players.map(p => p.bet);
    for (let i = bets.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bets[i], bets[j]] = [bets[j], bets[i]];
    }
    return players.map((p, i) => ({ ...p, bet: bets[i] }));
  }
  return players; // Other power-ups applied in game flow
}

// ─── END GAME STATS ───────────────────────────────────────────────────────────
function calcEndStats(players, roundHistory) {
  const stats = players.map(p => {
    const rounds     = roundHistory.filter(r => r.playerId === p.id);
    const correct    = rounds.filter(r => r.correct).length;
    const totalBets  = rounds.filter(r => r.bet?.type !== "none").length;
    const wonBets    = rounds.filter(r => r.payout > 0).length;
    const totalLost  = rounds.reduce((a, r) => a + (r.payout < 0 ? Math.abs(r.payout) : 0), 0);
    const maxStreak  = rounds.reduce((a, r) => Math.max(a, r.streakAfter || 0), 0);
    const bluffs     = rounds.filter(r => (r.bluffBonus || 0) > 0).length;

    return {
      playerId:   p.id,
      username:   p.username,
      finalPts:   p.points,
      accuracy:   rounds.length ? Math.round((correct / rounds.length) * 100) : 0,
      bettingROI: totalBets ? Math.round((wonBets / totalBets) * 100) : 0,
      totalLost,
      maxStreak,
      bluffs,
    };
  });

  const sorted   = [...stats].sort((a, b) => b.finalPts - a.finalPts);
  const mvp      = sorted[0];
  const accurate = [...stats].sort((a, b) => b.accuracy   - a.accuracy)[0];
  const shark    = [...stats].sort((a, b) => b.bettingROI - a.bettingROI)[0];
  const onFire   = [...stats].sort((a, b) => b.maxStreak  - a.maxStreak)[0];
  const bigLoss  = [...stats].sort((a, b) => b.totalLost  - a.totalLost)[0];
  const bluffer  = [...stats].sort((a, b) => b.bluffs     - a.bluffs)[0];

  return {
    leaderboard: sorted,
    awards: {
      winner:        { label:"🥇 Winner",        player: sorted[0] },
      sharpshooter:  { label:"🎯 Sharpshooter",  player: accurate  },
      shark:         { label:"💰 Shark",          player: shark     },
      onFire:        { label:"🔥 On Fire",        player: onFire    },
      biggestLoss:   { label:"💀 Biggest Loser",  player: bigLoss   },
      masterBluffer: { label:"🃏 Master Bluffer", player: bluffer   },
      mvp:           { label:"🌟 MVP",            player: mvp       },
    },
  };
}

module.exports = {
  createPlayer, resetPlayerRound, validateBet, canDoubleDown,
  calcPayout, applyRoundResults, calcEndStats,
  getRandomPowerUp, applyPowerUp,
  START_POINTS, MIN_BET,
};
