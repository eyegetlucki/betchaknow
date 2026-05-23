// HTTP API wrapper — all calls to the Express server
const BASE = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

function getToken() { return localStorage.getItem("bk_token") || ""; }

async function req(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const post  = (path, body)    => req(path, { method: "POST",   body: JSON.stringify(body) });
const patch = (path, body)    => req(path, { method: "PATCH",  body: JSON.stringify(body) });
const del   = (path)          => req(path, { method: "DELETE" });
const get   = (path)          => req(path);

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  signup:              (b) => post("/api/auth/signup", b),
  login:               (b) => post("/api/auth/login", b),
  refresh:             ()  => post("/api/auth/refresh"),
  verifyEmail:         (b) => post("/api/auth/verify-email", b),
  resendVerification:  (b) => post("/api/auth/resend-verification", b),
  forgotPassword:      (b) => post("/api/auth/forgot-password", b),
  oauth:               (b) => post("/api/auth/oauth", b),

  // ── Users ───────────────────────────────────────────────────────────────────
  me:             ()  => get("/api/users/me"),
  updateMe:       (b) => patch("/api/users/me", b),
  uploadAvatar:   (b) => post("/api/users/me/avatar", b),
  publicProfile:  (u) => get(`/api/users/${u}`),

  // ── Shop ────────────────────────────────────────────────────────────────────
  catalog:        ()  => get("/api/shop/catalog"),
  inventory:      ()  => get("/api/shop/inventory"),
  purchase:       (b) => post("/api/shop/purchase", b),
  equip:          (b) => post("/api/shop/equip", b),

  // ── Payments ────────────────────────────────────────────────────────────────
  checkoutCoins:  (b) => post("/api/payments/checkout/coins", b),
  checkoutVIP:    (b) => post("/api/payments/checkout/vip", b),
  cancelVIP:      ()  => post("/api/payments/cancel-vip"),

  // ── Leaderboard ─────────────────────────────────────────────────────────────
  leaderboard:    (p) => get(`/api/leaderboard?${new URLSearchParams(p || {})}`),
  myRank:         ()  => get("/api/leaderboard/my-rank"),

  // ── Friends ─────────────────────────────────────────────────────────────────
  friends:        ()  => get("/api/friends"),
  friendsPending: ()  => get("/api/friends/pending"),
  friendRequest:  (b) => post("/api/friends/request", b),
  friendRespond:  (b) => post("/api/friends/respond", b),
  removeFriend:   (id)=> del(`/api/friends/${id}`),

  // ── Clubs ───────────────────────────────────────────────────────────────────
  clubs:          ()       => get("/api/clubs"),
  myClub:         ()       => get("/api/clubs/mine"),
  createClub:     (b)      => post("/api/clubs", b),
  joinClub:       (id)     => post(`/api/clubs/${id}/join`),
  leaveClub:      ()       => post("/api/clubs/leave"),
  clubChat:       (id)     => get(`/api/clubs/${id}/chat`),
  sendChat:       (id, b)  => post(`/api/clubs/${id}/chat`, b),

  // ── Challenges ──────────────────────────────────────────────────────────────
  challenges:     ()  => get("/api/challenges"),
  claimChallenge: (b) => post("/api/challenges/claim", b),

  // ── Battle Pass ─────────────────────────────────────────────────────────────
  battlePass:     ()  => get("/api/battlepass"),
  claimTier:      (b) => post("/api/battlepass/claim", b),
};

// Auth helpers
export function saveSession({ token, refreshToken, username, avatarUrl }) {
  if (token)        localStorage.setItem("bk_token", token);
  if (refreshToken) localStorage.setItem("bk_refresh", refreshToken);
  if (username)     localStorage.setItem("bk_username", username);
  if (avatarUrl)    localStorage.setItem("bk_avatar", avatarUrl);
}

export function clearSession() {
  ["bk_token", "bk_refresh", "bk_username", "bk_avatar"].forEach(k => localStorage.removeItem(k));
}

export function getUsername() {
  return localStorage.getItem("bk_username") || null;
}

export function isLoggedIn() {
  const token = localStorage.getItem("bk_token");
  if (!token) return false;
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(b64));
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
