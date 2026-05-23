// ─── src/sockets/index.js ─────────────────────────────────────────────────────
// All Socket.io event handlers for real-time gameplay

const jwt = require("jsonwebtoken");
const config = require("../config");
const rm     = require("../services/roomManager");
const { buildQuestionSet } = require("../services/questionService");
const { getRandomPowerUp, applyPowerUp, resetPlayerRound } = require("../services/gameLogic");
const { grantXP, calcGameXP } = require("../services/xpService");
const { supabaseAdmin } = require("../db/supabase");

// Helper: emit only to room, respecting anonymous bet setting
function broadcastRoomState(io, room, forReveal = false) {
  const state = rm.getPublicState(room, forReveal);
  io.to(room.code).emit("roomState", state);
}

// Helper: advance phases automatically
function schedulePhase(io, room, delayMs, callback) {
  rm.clearRoomTimer(room);
  room.phaseTimer = setTimeout(() => callback(io, room), delayMs);
}

// ─── MAIN SOCKET INIT ─────────────────────────────────────────────────────────
function initSockets(io) {

  // ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        // ignoreExpiration: socket is game identity only, not data access —
        // a valid (but expired) token still proves who the player is
        socket.user = jwt.verify(token, config.jwt.secret, { ignoreExpiration: true });
      } catch {
        socket.user = null;
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    const userId   = socket.user?.id;
    const username = socket.user?.username || `Guest_${socket.id.slice(0, 6)}`;
    const avatar   = socket.handshake.auth?.avatar || "";

    console.log(`[Socket] Connected: ${username} (${socket.id})`);

    // ── CREATE ROOM ───────────────────────────────────────────────────────────
    socket.on("createRoom", ({ isPrivate = true, settings = {} } = {}) => {
      const room = rm.createRoom(socket.id, userId || socket.id, username, avatar, isPrivate);
      if (settings) Object.assign(room.settings, settings);
      socket.join(room.code);
      socket.emit("roomCreated", { code: room.code, state: rm.getPublicState(room) });
    });

    // ── JOIN ROOM ─────────────────────────────────────────────────────────────
    socket.on("joinRoom", ({ code }) => {
      const result = rm.joinRoom(code, socket.id, userId || socket.id, username, avatar);
      if (result.error) return socket.emit("error", result.error);
      socket.join(code);
      socket.emit("roomJoined", { code, state: rm.getPublicState(result.room) });
      socket.to(code).emit("playerJoined", { username, state: rm.getPublicState(result.room) });
    });

    // ── QUICK MATCH ───────────────────────────────────────────────────────────
    socket.on("quickMatch", () => {
      let room = rm.findPublicRoom();
      if (!room) {
        room = rm.createRoom(socket.id, userId || socket.id, username, avatar, false);
        socket.join(room.code);
        socket.emit("roomCreated", { code: room.code, state: rm.getPublicState(room), isQuickMatch: true });
      } else {
        const result = rm.joinRoom(room.code, socket.id, userId || socket.id, username, avatar);
        if (result.error) return socket.emit("error", result.error);
        socket.join(room.code);
        socket.emit("roomJoined", { code: room.code, state: rm.getPublicState(room), isQuickMatch: true });
        socket.to(room.code).emit("playerJoined", { username, state: rm.getPublicState(room) });
      }
    });

    // ── UPDATE SETTINGS (host only) ───────────────────────────────────────────
    socket.on("updateSettings", ({ settings }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room || room.hostId !== (userId || socket.id)) return;
      Object.assign(room.settings, settings);
      broadcastRoomState(io, room);
    });

    // ── ADD CUSTOM QUESTION (host only) ───────────────────────────────────────
    socket.on("addCustomQuestion", ({ question, options, correctIndex }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room || room.hostId !== (userId || socket.id)) return;
      room.customQuestions.push({ question, options, correctIndex });
      socket.emit("customQuestionAdded", { count: room.customQuestions.length });
    });

    // ── ADD BOT (host only) ───────────────────────────────────────────────────
    socket.on("addBot", ({ difficulty = "medium" } = {}) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room || room.hostId !== (userId || socket.id)) return;
      if (room.state !== "lobby") return socket.emit("error", "Can only add bots in lobby");
      if (room.players.size >= 10) return socket.emit("error", "Room is full");
      rm.addBot(room, difficulty);
      broadcastRoomState(io, room);
    });

    // ── REMOVE BOT (host only) ────────────────────────────────────────────────
    socket.on("removeBot", ({ botId }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room || room.hostId !== (userId || socket.id)) return;
      if (room.state !== "lobby") return;
      const bot = room.players.get(botId);
      if (!bot || !bot.isBot) return;
      room.players.delete(botId);
      broadcastRoomState(io, room);
    });

    // ── START GAME (host only) ────────────────────────────────────────────────
    socket.on("startGame", async () => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room) return;
      if (room.hostId !== (userId || socket.id)) return socket.emit("error", "Only host can start");
      if (room.state !== "lobby") return socket.emit("error", "Game already started");
      const hasBots = Array.from(room.players.values()).some(p => p.isBot);
      if (room.players.size < 2 && !hasBots) return socket.emit("error", "Need at least 2 players (or add a bot)");

      // Fetch questions
      try {
        room.questions = await buildQuestionSet(room.settings, room.customQuestions);
      } catch {
        return socket.emit("error", "Failed to load questions");
      }

      room.currentRound = 0;
      startNextRound(io, room);
    });

    // ── PLACE BET ─────────────────────────────────────────────────────────────
    socket.on("placeBet", ({ type, amount, targetId }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room) return;
      const playerId = userId || socket.id;
      const result = rm.placeBet(room, playerId, { type, amount: parseInt(amount) || 0, targetId });
      if (result.error) return socket.emit("error", result.error);

      socket.emit("betConfirmed", { type, amount, targetId });
      // Broadcast updated ready state (anonymized)
      broadcastRoomState(io, room);

      // Auto-advance if all players have bet
      checkAllBetsIn(io, room);
    });

    // ── SUBMIT ANSWER ─────────────────────────────────────────────────────────
    socket.on("submitAnswer", ({ answerIdx, doubleDown = false }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room) return;
      const playerId = userId || socket.id;
      const result = rm.submitAnswer(room, playerId, parseInt(answerIdx), doubleDown);
      if (result.error) return socket.emit("error", result.error);

      socket.emit("answerConfirmed");
      broadcastRoomState(io, room);

      // Auto-advance if all players answered
      checkAllAnswersIn(io, room);
    });

    // ── CATEGORY VOTE (between rounds) ───────────────────────────────────────
    socket.on("voteCategory", ({ categoryId }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room || room.state !== "reveal") return;
      const playerId = userId || socket.id;
      room.votesReceived.set(playerId, categoryId);

      const counts = {};
      for (const v of room.votesReceived.values()) {
        counts[v] = (counts[v] || 0) + 1;
      }
      const humanPlayers = Array.from(room.players.values()).filter(p => !p.isBot);
      io.to(room.code).emit("voteUpdate", {
        counts,
        totalVotes:   room.votesReceived.size,
        totalPlayers: humanPlayers.length,
      });

      // All human players voted → skip the remaining timer and use winning category
      if (room.votesReceived.size >= humanPlayers.length) {
        rm.clearRoomTimer(room);
        room.votedCategory = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
        startNextRound(io, room);
      }
    });

    // ── CHAT (in club/lobby) ──────────────────────────────────────────────────
    socket.on("lobbyChat", ({ message }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room) return;
      if (!message || message.length > 300) return;
      io.to(room.code).emit("lobbyChat", { username, message, ts: Date.now() });
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${username}`);
      const result = rm.leaveRoom(socket.id);
      if (!result) return;
      if (!result.empty) {
        io.to(result.roomCode).emit("playerLeft", {
          username,
          state: rm.getPublicState(result.room),
        });
      }
    });
  });
}

// ─── GAME PHASE LOGIC ─────────────────────────────────────────────────────────

function startNextRound(io, room) {
  room.currentRound += 1;
  const qIndex = room.currentRound - 1;

  if (qIndex >= room.questions.length) {
    return endGame(io, room);
  }

  // If a category was voted for, try to swap a matching question into position
  if (room.votedCategory) {
    const preferred = room.questions.findIndex((q, i) => i >= qIndex && q.cat === room.votedCategory);
    if (preferred > qIndex) {
      [room.questions[qIndex], room.questions[preferred]] = [room.questions[preferred], room.questions[qIndex]];
    }
    room.votedCategory = null;
  }

  room.currentQ = room.questions[qIndex];
  room.state    = "blindbet";
  room.votesReceived.clear();

  // Check power-up round
  if (rm.isPowerUpRound(room.currentRound)) {
    room.powerUpRound = getRandomPowerUp();
  } else {
    room.powerUpRound = null;
  }

  // Apply chaos power-up (pre-bet)
  if (room.powerUpRound?.id === "chaos") {
    const players = Array.from(room.players.values());
    applyPowerUp(players, "chaos").forEach(p => room.players.set(p.id, p));
  }

  // Reset all player round state
  for (const [id, player] of room.players) {
    room.players.set(id, resetPlayerRound(player));
  }

  const BET_TIMER_SECS = 60;

  io.to(room.code).emit("roundStart", {
    round:    room.currentRound,
    total:    room.settings.rounds,
    betTimer: BET_TIMER_SECS,
    category: room.currentQ.cat || null,
    powerUp:  room.powerUpRound,
    state:    rm.getPublicState(room),
  });

  scheduleBotActions(io, room);

  // Auto-advance blind-bet phase: match client timer + 3s grace
  schedulePhase(io, room, (BET_TIMER_SECS + 3) * 1000, startQuestionPhase);
}

function startQuestionPhase(io, room) {
  if (room.state !== "blindbet") return;
  room.state = "question";

  // Players who never placed a bet are treated as "none" — still eligible for +50 if correct
  for (const [id, player] of room.players) {
    if (player.bet === null) {
      room.players.set(id, { ...player, bet: { type: "none", amount: 0, targetId: null } });
    }
  }

  // Speed round power-up halves the timer
  const timer = room.powerUpRound?.id === "speed"
    ? Math.round(room.settings.timerSecs / 2)
    : room.settings.timerSecs;

  io.to(room.code).emit("questionReveal", {
    question: room.currentQ,
    timer,
    state: rm.getPublicState(room),
  });

  scheduleBotActions(io, room);

  schedulePhase(io, room, timer * 1000, revealRound);
}

function checkAllBetsIn(io, room) {
  if (room.state !== "blindbet") return;
  const all = Array.from(room.players.values());
  if (all.every(p => p.bet !== null)) {
    rm.clearRoomTimer(room);
    startQuestionPhase(io, room);
  }
}

function checkAllAnswersIn(io, room) {
  if (room.state !== "question") return;
  const all = Array.from(room.players.values());
  if (all.every(p => p.ready)) {
    rm.clearRoomTimer(room);
    revealRound(io, room);
  }
}

async function revealRound(io, room) {
  if (room.state === "end") return;
  room.state = "reveal";

  const updated = rm.resolveRound(room);

  io.to(room.code).emit("roundReveal", {
    question: room.currentQ,
    results:  updated,
    state:    rm.getPublicState(room, true),
  });

  const VOTE_TIMER_SECS = 10;

  // Wait 6s on reveal, then advance
  schedulePhase(io, room, 6000, async (io, room) => {
    if (room.currentRound >= room.settings.rounds) {
      await endGame(io, room);
    } else {
      const CAT_LABELS = { sports:"Sports", science:"Science", history:"History", popculture:"Pop Culture", geography:"Geography", music:"Music", movies:"Movies" };
      const nextIdx = room.currentRound; // 0-based index of the next unplayed question
      const remaining = room.questions.slice(nextIdx);
      const uniqueCats = [...new Set(remaining.map(q => q.cat).filter(c => c && c !== "custom"))];
      uniqueCats.sort(() => Math.random() - 0.5);
      const voteOptions = uniqueCats.slice(0, 4).map(id => ({ id, label: CAT_LABELS[id] || id }));
      io.to(room.code).emit("categoryVote", {
        options: voteOptions,
        timer: VOTE_TIMER_SECS,
      });
      schedulePhase(io, room, VOTE_TIMER_SECS * 1000, (io, room) => startNextRound(io, room));
    }
  });
}

// Mastery rank thresholds (total correct answers per category)
const MASTERY_T = [0, 10, 25, 50, 100, 200];

function masteryPtsFromRankProgress(rank, progress) {
  const r = Math.max(1, Math.min(6, rank || 1));
  if (r >= 6) return 999;
  const lo = MASTERY_T[r - 1], hi = MASTERY_T[r];
  return lo + Math.round(((progress || 0) / 100) * (hi - lo));
}

function rankProgressFromPts(pts) {
  let rank = 1;
  for (let i = MASTERY_T.length - 1; i >= 0; i--) {
    if (pts >= MASTERY_T[i]) { rank = i + 1; break; }
  }
  if (rank >= 6) return { rank: 6, progress: 100 };
  const lo = MASTERY_T[rank - 1], hi = MASTERY_T[rank];
  return { rank, progress: Math.min(99, Math.round(((pts - lo) / (hi - lo)) * 100)) };
}

async function endGame(io, room) {
  room.state = "end";
  const stats = rm.getEndStats(room);

  io.to(room.code).emit("gameEnd", { stats, state: rm.getPublicState(room) });

  // Persist stats to DB for logged-in players
  const players = Array.from(room.players.values());
  const sorted  = [...stats.leaderboard];

  for (const p of players) {
    if (!p.id || p.id === p.socketId) continue; // skip guests
    try {
      const pStat   = sorted.find(s => s.playerId === p.id);
      const isWin   = sorted[0]?.playerId === p.id;
      const isMVP   = stats.awards.mvp?.player?.playerId === p.id;
      const bluffs  = pStat?.bluffs || 0;
      const streak  = pStat?.maxStreak || 0;

      // Fetch current profile stats (needed for cumulative updates + badge checks)
      const { data: curr } = await supabaseAdmin
        .from("profiles")
        .select("is_vip,games_played,games_won,bluffs_landed,longest_streak,season_points")
        .eq("id", p.id).single();

      const xpEarned = calcGameXP(isWin ? "win" : "loss", pStat?.accuracy || 0, bluffs, streak, isMVP, curr?.is_vip);

      // Grant XP + save game history
      await grantXP(p.id, xpEarned, curr?.is_vip);
      await supabaseAdmin.from("game_history").insert({
        user_id: p.id, room_code: room.code,
        result: isWin ? "win" : "loss",
        points_delta: pStat ? pStat.finalPts - 500 : 0,
        accuracy: pStat?.accuracy || 0,
        bluffs_landed: bluffs, streak_achieved: streak,
        xp_earned: xpEarned, season_pts: xpEarned,
      });

      // Compute new cumulative stats
      const newGames   = (curr?.games_played  || 0) + 1;
      const newWins    = (curr?.games_won      || 0) + (isWin ? 1 : 0);
      const newBluffs  = (curr?.bluffs_landed  || 0) + bluffs;
      const newStreak  = Math.max(curr?.longest_streak || 0, streak);
      const newSeason  = (curr?.season_points  || 0) + xpEarned;

      await supabaseAdmin.from("profiles")
        .update({ games_played: newGames, games_won: newWins, bluffs_landed: newBluffs, longest_streak: newStreak, season_points: newSeason })
        .eq("id", p.id);

      // Award badges
      const newBadges = [];
      if (isWin)                                newBadges.push("first_win");
      if (isMVP)                                newBadges.push("mvp");
      if ((pStat?.accuracy || 0) >= 90)         newBadges.push("accuracy_90");
      if (streak >= 5)                          newBadges.push("streak_5");
      if (newBluffs >= 10)                      newBadges.push("bluffs_10");
      if (newBluffs >= 50)                      newBadges.push("bluffs_50");
      if (newGames  >= 10)                      newBadges.push("games_10");
      if (newGames  >= 50)                      newBadges.push("games_50");
      if (newSeason >= 10000)                   newBadges.push("high_roller");
      const allInWin = room.roundHistory.some(
        rh => rh.playerId === p.id && rh.bet?.type === "allin" && rh.correct
      );
      if (allInWin) newBadges.push("all_in_win");

      for (const badgeId of [...new Set(newBadges)]) {
        await supabaseAdmin.from("badges").upsert(
          { user_id: p.id, badge_id: badgeId },
          { onConflict: "user_id,badge_id", ignoreDuplicates: true }
        ).catch(e => console.error("[badge]", badgeId, e.message));
      }

      // Update category mastery
      const roundHist = room.roundHistory.filter(r => r.playerId === p.id);
      const catCorrect = {};
      for (const rh of roundHist) {
        const q = room.questions[rh.round - 1];
        if (!q?.cat || q.cat === "custom") continue;
        catCorrect[q.cat] = (catCorrect[q.cat] || 0) + (rh.correct ? 1 : 0);
      }

      for (const [category, gained] of Object.entries(catCorrect)) {
        if (!gained) continue;
        try {
          const { data: ex } = await supabaseAdmin
            .from("category_mastery").select("rank,progress")
            .eq("user_id", p.id).eq("category", category).maybeSingle();
          const prevPts = masteryPtsFromRankProgress(ex?.rank, ex?.progress);
          const { rank, progress } = rankProgressFromPts(prevPts + gained);
          await supabaseAdmin.from("category_mastery").upsert(
            { user_id: p.id, category, rank, progress },
            { onConflict: "user_id,category" }
          );
        } catch (me) {
          console.error("[mastery]", me.message);
        }
      }

    } catch (err) {
      console.error("[endGame] stat persist error:", err.message);
    }
  }
}

// ─── BOT AUTO-PLAY ────────────────────────────────────────────────────────────
const BOT_CONFIG = {
  easy:   { betAmounts: [10, 25],        answerAccuracy: 0.25, betDelay: 2200, answerDelay: 2800 },
  medium: { betAmounts: [25, 50, 75],    answerAccuracy: 0.55, betDelay: 1200, answerDelay: 1800 },
  hard:   { betAmounts: [75, 100, 125],  answerAccuracy: 0.80, betDelay: 700,  answerDelay: 900  },
};

function scheduleBotActions(io, room) {
  const bots = Array.from(room.players.values()).filter(p => p.isBot);
  if (!bots.length) return;

  if (room.state === "blindbet") {
    bots.forEach((bot, i) => {
      const cfg   = BOT_CONFIG[bot.botDifficulty] || BOT_CONFIG.medium;
      const delay = cfg.betDelay + i * 400;
      setTimeout(() => {
        if (room.state !== "blindbet") return;
        const b = room.players.get(bot.id);
        if (!b || b.bet !== null) return;
        const pool   = cfg.betAmounts;
        const amount = Math.min(pool[Math.floor(Math.random() * pool.length)], b.points);
        rm.placeBet(room, bot.id, amount >= 5
          ? { type: "self", amount }
          : { type: "none" }
        );
        broadcastRoomState(io, room);
        checkAllBetsIn(io, room);
      }, delay);
    });
  }

  if (room.state === "question") {
    bots.forEach((bot, i) => {
      const cfg   = BOT_CONFIG[bot.botDifficulty] || BOT_CONFIG.medium;
      const delay = cfg.answerDelay + i * 400;
      setTimeout(() => {
        if (room.state !== "question") return;
        const b = room.players.get(bot.id);
        if (!b || b.ready) return;
        const numOptions = room.currentQ?.options?.length || 4;
        const correctIdx = room.currentQ?.correct ?? 0;
        const answerIdx  = Math.random() < cfg.answerAccuracy
          ? correctIdx
          : Math.floor(Math.random() * numOptions);
        rm.submitAnswer(room, bot.id, answerIdx, false);
        broadcastRoomState(io, room);
        checkAllAnswersIn(io, room);
      }, delay);
    });
  }
}

module.exports = { initSockets };
