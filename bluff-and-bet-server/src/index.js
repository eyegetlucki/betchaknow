// ─── src/index.js ─────────────────────────────────────────────────────────────
// Main server entry — Express + Socket.io + all routes
require("dotenv").config();

const express  = require("express");
const http     = require("http");
const cors     = require("cors");
const helmet   = require("helmet");
const { Server } = require("socket.io");
const rateLimit  = require("express-rate-limit");

const config       = require("./config");
const { errorHandler }   = require("./middleware/errorHandler");
const { initSockets }    = require("./sockets");

// Routes
const authRoutes        = require("./routes/auth");
const userRoutes        = require("./routes/users");
const shopRoutes        = require("./routes/shop");
const paymentsRoutes    = require("./routes/payments");
const challengesRoutes  = require("./routes/challenges");
const leaderboardRoutes = require("./routes/leaderboard");
const friendsRoutes     = require("./routes/friends");
const clubsRoutes       = require("./routes/clubs");
const battlePassRoutes  = require("./routes/battlePass");
const stripeWebhook     = require("./routes/stripeWebhook");

const app    = express();
const server = http.createServer(app);

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// ─── STRIPE WEBHOOK NEEDS RAW BODY (must come before express.json) ────────────
app.use("/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook);

app.use(express.json({ limit: "1mb" }));

// ─── GLOBAL RATE LIMITER ──────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 min
  max: 120,              // 120 requests/min/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", limiter);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({
  status: "ok",
  uptime: process.uptime(),
  version: "1.0.0",
}));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/users",       userRoutes);
app.use("/api/shop",        shopRoutes);
app.use("/api/payments",    paymentsRoutes);
app.use("/api/challenges",  challengesRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/friends",     friendsRoutes);
app.use("/api/clubs",       clubsRoutes);
app.use("/api/battlepass",  battlePassRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Error handler (must be last)
app.use(errorHandler);

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: config.corsOrigin, credentials: true },
  pingTimeout: 20000,
});
initSockets(io);

// ─── START ────────────────────────────────────────────────────────────────────
server.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🎯 Bluff & Bet Server Running          ║
║   Port: ${config.port}                            ║
║   Env:  ${config.env.padEnd(33)}║
╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server gracefully");
  server.close(() => process.exit(0));
});

module.exports = { app, server, io };
