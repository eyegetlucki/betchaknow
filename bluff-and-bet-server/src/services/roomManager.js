// ─── src/services/roomManager.js ─────────────────────────────────────────────
// In-memory room state. In production: back with Redis for multi-server support.

const { createPlayer, resetPlayerRound, applyRoundResults, calcEndStats, getRandomPowerUp } = require("./gameLogic");

const rooms     = new Map();   // code → room
const socketMap = new Map();   // socketId → { roomCode, playerId }

const PLAYER_COLORS = [
  "#4d96ff","#ff6b6b","#6bcb77","#c77dff",
  "#ffd93d","#ff9f43","#00d2d3","#54a0ff","#fd79a8","#a29bfe",
];

const DEFAULT_SETTINGS = {
  rounds: 10, timerSecs: 30,
  categories: ["sports","science","popculture","history","movies","music","geography"],
  bluffing: true, anonymousBets: true, streakMultiplier: true,
  doubleDown: true, allInToken: true, betOnOthers: true, noBetBonus: true,
};

// ─── CREATE ROOM ──────────────────────────────────────────────────────────────
function createRoom(hostSocketId, hostId, hostName, hostAvatar = "", isPrivate = true) {
  const code = isPrivate
    ? Math.random().toString(36).substring(2, 8).toUpperCase()
    : "QM" + Math.floor(Math.random() * 9000 + 1000);

  const room = {
    code, hostId, isPrivate,
    state: "lobby",       // lobby | blindbet | question | reveal | end
    settings: { ...DEFAULT_SETTINGS },
    players: new Map(),
    roundHistory: [],
    currentRound: 0,
    questions: [],
    currentQ: null,
    phaseTimer: null,
    customQuestions: [],
    votesReceived: new Map(),   // question vote
    powerUpRound: null,
    createdAt: Date.now(),
  };

  const player = createPlayer({ id: hostId, username: hostName, avatar: hostAvatar, color: PLAYER_COLORS[0] });
  room.players.set(hostId, { ...player, socketId: hostSocketId, isHost: true });

  rooms.set(code, room);
  socketMap.set(hostSocketId, { roomCode: code, playerId: hostId });
  return room;
}

// ─── JOIN ROOM ────────────────────────────────────────────────────────────────
function joinRoom(code, socketId, playerId, playerName, playerAvatar = "") {
  const room = rooms.get(code);
  if (!room)                        return { error: "Room not found" };
  if (room.state !== "lobby")       return { error: "Game already in progress" };
  if (room.players.size >= 10)      return { error: "Room is full" };
  if (room.players.has(playerId))   return { error: "Already in room" };

  const color  = PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
  const player = createPlayer({ id: playerId, username: playerName, avatar: playerAvatar, color });
  room.players.set(playerId, { ...player, socketId, isHost: false });
  socketMap.set(socketId, { roomCode: code, playerId });
  return { success: true, room };
}

// ─── LEAVE ROOM ───────────────────────────────────────────────────────────────
function leaveRoom(socketId) {
  const entry = socketMap.get(socketId);
  if (!entry) return null;
  const { roomCode, playerId } = entry;
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players.delete(playerId);
  socketMap.delete(socketId);

  if (room.hostId === playerId && room.players.size > 0) {
    const newHost = room.players.values().next().value;
    newHost.isHost = true;
    room.hostId = newHost.id;
  }

  if (room.players.size === 0) {
    clearRoomTimer(room);
    rooms.delete(roomCode);
    return { roomCode, empty: true };
  }
  return { roomCode, room };
}

// ─── GET ROOM BY SOCKET ───────────────────────────────────────────────────────
function getRoomBySocket(socketId) {
  const entry = socketMap.get(socketId);
  if (!entry) return null;
  return rooms.get(entry.roomCode) || null;
}

function getPlayerBySocket(socketId) {
  const entry = socketMap.get(socketId);
  if (!entry) return { room: null, player: null };
  const room = rooms.get(entry.roomCode);
  const player = room?.players.get(entry.playerId) || null;
  return { room, player };
}

// ─── PLACE BET ────────────────────────────────────────────────────────────────
function placeBet(room, playerId, bet) {
  const { validateBet } = require("./gameLogic");
  const player = room.players.get(playerId);
  if (!player)              return { error: "Player not found" };
  if (room.state !== "blindbet") return { error: "Not in bet phase" };
  if (player.bet)           return { error: "Bet already placed" };

  const v = validateBet(player, bet, room.settings);
  if (!v.valid) return { error: v.reason };

  player.bet = bet;
  if (bet.type === "allin") player.allInAmount = player.points;
  room.players.set(playerId, player);
  return { success: true };
}

// ─── SUBMIT ANSWER ────────────────────────────────────────────────────────────
function submitAnswer(room, playerId, answerIdx, doubleDown) {
  const { canDoubleDown } = require("./gameLogic");
  const player = room.players.get(playerId);
  if (!player)               return { error: "Player not found" };
  if (room.state !== "question") return { error: "Not in question phase" };
  if (player.ready)          return { error: "Already answered" };

  if (doubleDown) {
    const dd = canDoubleDown(player, room.settings);
    if (!dd.allowed) return { error: dd.reason };
    player.doubleDown = true;
  }
  player.answer = answerIdx;
  player.ready  = true;
  room.players.set(playerId, player);
  return { success: true };
}

// ─── RESOLVE ROUND ────────────────────────────────────────────────────────────
function resolveRound(room) {
  const players  = Array.from(room.players.values());
  const correct  = room.currentQ.correct;
  const updated  = applyRoundResults(players, correct, room.settings);

  updated.forEach(p => {
    room.roundHistory.push({
      round: room.currentRound, playerId: p.id,
      answer: p.answer, correct: p.correct,
      bet: p.bet, doubleDown: p.doubleDown,
      payout: p.payout, streakAfter: p.streak,
    });
    room.players.set(p.id, p);
  });
  return updated;
}

// ─── ADD BOT ──────────────────────────────────────────────────────────────────
function addBot(room, difficulty = "medium") {
  const botNum = Array.from(room.players.values()).filter(p => p.isBot).length + 1;
  const botId  = `bot_${botNum}`;
  const color  = PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
  const player = createPlayer({ id: botId, username: `Bot ${botNum}`, color });
  room.players.set(botId, { ...player, socketId: botId, isHost: false, isBot: true, botDifficulty: difficulty });
  return botId;
}

// ─── PUBLIC STATE (no cheating) ───────────────────────────────────────────────
function getPublicState(room, forReveal = false) {
  const players = Array.from(room.players.values()).map(p => ({
    id: p.id, username: p.username, color: p.color, avatar: p.avatar || null,
    points: p.points, streak: p.streak, isHost: p.isHost,
    isBot: p.isBot || false, botDifficulty: p.botDifficulty || null,
    allInUsed: p.allInUsed, isVIP: p.isVIP,
    hasBet:     !forReveal ? !!p.bet    : undefined,
    hasAnswered: !forReveal ? p.ready   : undefined,
    ...(forReveal ? {
      bet: p.bet, answer: p.answer, doubleDown: p.doubleDown,
      correct: p.correct, payout: p.payout,
    } : {}),
  }));

  return {
    code: room.code, state: room.state,
    settings: room.settings, players,
    currentRound: room.currentRound,
    totalRounds:  room.settings.rounds,
    currentQ: (forReveal || room.state === "question") ? room.currentQ : null,
    powerUpRound: room.powerUpRound,
  };
}

function getEndStats(room) {
  const players = Array.from(room.players.values());
  return calcEndStats(players, room.roundHistory);
}

function findPublicRoom() {
  for (const [, room] of rooms) {
    if (!room.isPrivate && room.state === "lobby" && room.players.size < 10)
      return room;
  }
  return null;
}

function clearRoomTimer(room) {
  if (room.phaseTimer) { clearTimeout(room.phaseTimer); room.phaseTimer = null; }
}

function isPowerUpRound(roundNum) {
  return roundNum > 0 && roundNum % 5 === 0;
}

// Stale room cleanup (every 30 min)
setInterval(() => {
  const now = Date.now();
  const TWO_HRS = 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (now - room.createdAt > TWO_HRS) {
      clearRoomTimer(room);
      rooms.delete(code);
    }
  }
}, 30 * 60 * 1000);

module.exports = {
  createRoom, joinRoom, leaveRoom, addBot,
  getRoomBySocket, getPlayerBySocket,
  placeBet, submitAnswer, resolveRound,
  getPublicState, getEndStats,
  findPublicRoom, clearRoomTimer, isPowerUpRound,
  socketMap, rooms,
};
