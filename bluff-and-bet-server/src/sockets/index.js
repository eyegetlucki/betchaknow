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

    console.log(`[Socket] Connected: ${username} (${socket.id})`);

    // ── CREATE ROOM ───────────────────────────────────────────────────────────
    socket.on("createRoom", ({ isPrivate = true, settings = {} } = {}) => {
      const room = rm.createRoom(socket.id, userId || socket.id, username, isPrivate);
      if (settings) Object.assign(room.settings, settings);
      socket.join(room.code);
      socket.emit("roomCreated", { code: room.code, state: rm.getPublicState(room) });
    });

    // ── JOIN ROOM ─────────────────────────────────────────────────────────────
    socket.on("joinRoom", ({ code }) => {
      const result = rm.joinRoom(code, socket.id, userId || socket.id, username);
      if (result.error) return socket.emit("error", result.error);
      socket.join(code);
      socket.emit("roomJoined", { code, state: rm.getPublicState(result.room) });
      socket.to(code).emit("playerJoined", { username, state: rm.getPublicState(result.room) });
    });

    // ── QUICK MATCH ───────────────────────────────────────────────────────────
    socket.on("quickMatch", () => {
      let room = rm.findPublicRoom();
      if (!room) {
        room = rm.createRoom(socket.id, userId || socket.id, username, false);
        socket.join(room.code);
        socket.emit("roomCreated", { code: room.code, state: rm.getPublicState(room), isQuickMatch: true });
      } else {
        const result = rm.joinRoom(room.code, socket.id, userId || socket.id, username);
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
    socket.on("voteCategory", ({ categoryIndex }) => {
      const room = rm.getRoomBySocket(socket.id);
      if (!room || room.state !== "reveal") return;
      const playerId = userId || socket.id;
      room.votesReceived.set(playerId, categoryIndex);

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

      // All human players voted → skip the remaining timer
      if (room.votesReceived.size >= humanPlayers.length) {
        rm.clearRoomTimer(room);
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

  const BET_TIMER_SECS = 15;

  io.to(room.code).emit("roundStart", {
    round:    room.currentRound,
    total:    room.settings.rounds,
    betTimer: BET_TIMER_SECS,
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
      io.to(room.code).emit("categoryVote", {
        options: ["Sports","Science","History"].sort(() => Math.random() - 0.5),
        timer: VOTE_TIMER_SECS,
      });
      schedulePhase(io, room, VOTE_TIMER_SECS * 1000, (io, room) => startNextRound(io, room));
    }
  });
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

      // XP calc (VIP check)
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("is_vip").eq("id", p.id).single();
      const xpEarned = calcGameXP(isWin ? "win" : "loss", pStat?.accuracy || 0, bluffs, streak, isMVP, profile?.is_vip);

      // Grant XP + save game history
      await grantXP(p.id, xpEarned, profile?.is_vip);
      await supabaseAdmin.from("game_history").insert({
        user_id: p.id, room_code: room.code,
        result: isWin ? "win" : "loss",
        points_delta: pStat ? pStat.finalPts - 500 : 0,
        accuracy: pStat?.accuracy || 0,
        bluffs_landed: bluffs, streak_achieved: streak,
        xp_earned: xpEarned, season_pts: xpEarned,
      });

      // Update season_points for leaderboard
      await supabaseAdmin.from("profiles")
        .update({
          games_played: supabaseAdmin.rpc("increment", { col:"games_played" }),
          games_won:    isWin ? supabaseAdmin.rpc("increment", { col:"games_won" }) : undefined,
          season_points: supabaseAdmin.rpc("add_season_points", { pts: xpEarned }),
        })
        .eq("id", p.id);

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
