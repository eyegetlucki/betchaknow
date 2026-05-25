// ─── src/routes/auth.js ───────────────────────────────────────────────────────
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const rateLimit = require("express-rate-limit");
const { supabaseAdmin } = require("../db/supabase");
const { signTokens, verifyRefresh, requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const emailService = require("../services/emailService");

// Strict rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 10,
  message: { error: "Too many auth attempts. Try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

// ─── SIGN UP ──────────────────────────────────────────────────────────────────
router.post("/signup", authLimiter, asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username || username.length < 3 || username.length > 20)
    throw createError(400, "Username must be 3–20 characters");
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    throw createError(400, "Username can only contain letters, numbers, underscores");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw createError(400, "Invalid email address");
  if (!password || password.length < 8)
    throw createError(400, "Password must be at least 8 characters");

  // Check username taken
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) throw createError(409, "Username already taken");

  // Create Supabase auth user
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });
  if (authErr) {
    if (authErr.message.includes("already registered"))
      throw createError(409, "Email already in use");
    throw createError(400, authErr.message);
  }

  const userId = authData.user.id;

  // Create profile
  await supabaseAdmin.from("profiles").insert({
    id: userId,
    username,
    bluff_bucks: 0,
    level: 1,
    xp: 0,
    xp_to_next: 1000,
  });

  // Create default equipped row
  await supabaseAdmin.from("equipped").insert({ user_id: userId });

  // Seed default inventory items (free defaults)
  await supabaseAdmin.from("inventory").insert([
    { user_id: userId, item_id: "av_classic",   item_type: "avatar" },
    { user_id: userId, item_id: "th_neon",       item_type: "theme"  },
    { user_id: userId, item_id: "card_default",  item_type: "cards"  },
    { user_id: userId, item_id: "fx_confetti",   item_type: "fx"     },
    { user_id: userId, item_id: "qp_classic",    item_type: "pack"   },
  ]);

  // Send verification email
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  await supabaseAdmin.from("email_verifications").insert({
    user_id: userId, code, expires_at: expiresAt,
  });
  await emailService.sendVerification(email, username, code);

  res.status(201).json({
    message: "Account created. Check your email for verification code.",
    userId,
  });
}));

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
router.post("/verify-email", authLimiter, asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) throw createError(400, "userId and code required");

  const { data: record } = await supabaseAdmin
    .from("email_verifications")
    .select("*")
    .eq("user_id", userId)
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!record) throw createError(400, "Invalid or expired verification code");

  // Mark used + confirm user in Supabase Auth
  await supabaseAdmin.from("email_verifications").update({ used: true }).eq("id", record.id);
  await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

  const profile = await getProfile(userId);
  const tokens = signTokens({ id: userId, username: profile.username, email: profile.email });
  res.json({ message: "Email verified", ...tokens, profile });
}));

// ─── LOGIN (email/password) ───────────────────────────────────────────────────
router.post("/login", authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError(400, "Email and password required");

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (error) throw createError(401, "Invalid email or password");

  const userId = data.user.id;
  if (!data.user.email_confirmed_at) throw createError(403, "Please verify your email first");

  await updateLoginStreak(userId);
  const profile = await getProfile(userId);
  const tokens = signTokens({ id: userId, username: profile.username, email });
  res.json({ ...tokens, profile });
}));

// ─── OAUTH (Google/Discord) — exchange Supabase OAuth session ─────────────────
router.post("/oauth", asyncHandler(async (req, res) => {
  const { provider, access_token } = req.body;
  if (!["google", "discord"].includes(provider)) throw createError(400, "Invalid provider");

  const { data, error } = await supabaseAdmin.auth.getUser(access_token);
  if (error || !data.user) throw createError(401, "Invalid OAuth token");

  const userId = data.user.id;
  // Supabase stores Google photo as "picture", Discord/others as "avatar_url"
  const oauthPhoto = data.user.user_metadata?.picture || data.user.user_metadata?.avatar_url || null;

  // Check if profile exists; create if first OAuth login
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_icon")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    // Auto-generate username from email
    const base = (data.user.email || "Player").split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
    const username = base.slice(0, 18) + Math.floor(Math.random() * 99);
    await supabaseAdmin.from("profiles").insert({
      id: userId, username,
      ...(oauthPhoto ? { avatar_icon: oauthPhoto } : {}),
    });
    await supabaseAdmin.from("equipped").insert({ user_id: userId });
    await supabaseAdmin.from("inventory").insert([
      { user_id: userId, item_id: "av_classic",  item_type: "avatar" },
      { user_id: userId, item_id: "th_neon",      item_type: "theme"  },
      { user_id: userId, item_id: "card_default", item_type: "cards"  },
      { user_id: userId, item_id: "fx_confetti",  item_type: "fx"     },
      { user_id: userId, item_id: "qp_classic",   item_type: "pack"   },
    ]);
  }

  // Sync OAuth photo for existing users who have no uploaded photo yet
  if (existing && oauthPhoto && (!existing.avatar_icon || !existing.avatar_icon.startsWith("http"))) {
    await supabaseAdmin.from("profiles").update({ avatar_icon: oauthPhoto }).eq("id", userId);
  }

  await updateLoginStreak(userId);
  const profile = await getProfile(userId);
  const tokens = signTokens({ id: userId, username: profile.username, email: data.user.email });
  res.json({ ...tokens, profile, isNewUser: !existing });
}));

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
router.post("/refresh", asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError(400, "Refresh token required");
  try {
    const payload = verifyRefresh(refreshToken);
    const profile = await getProfile(payload.id);
    const tokens = signTokens({ id: payload.id, username: profile.username, email: payload.email });
    res.json(tokens);
  } catch {
    throw createError(401, "Invalid refresh token");
  }
}));

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
router.post("/logout", requireAuth, (req, res) => {
  // Stateless JWTs — client just deletes tokens
  // In production: add token to a Redis blocklist
  res.json({ message: "Logged out" });
});

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────
router.post("/resend-verification", authLimiter, asyncHandler(async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) throw createError(400, "userId and email required");

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Invalidate old codes
  await supabaseAdmin.from("email_verifications")
    .update({ used: true })
    .eq("user_id", userId)
    .eq("used", false);

  await supabaseAdmin.from("email_verifications").insert({
    user_id: userId, code, expires_at: expiresAt,
  });

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("username").eq("id", userId).single();
  await emailService.sendVerification(email, profile?.username || "Player", code);
  res.json({ message: "Verification code resent" });
}));

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
router.post("/forgot-password", authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw createError(400, "Email required");
  // Supabase handles password reset email
  await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CORS_ORIGIN}/reset-password`,
  });
  // Always 200 to prevent email enumeration
  res.json({ message: "If that email exists, a reset link has been sent" });
}));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function getProfile(userId) {
  const { data } = await supabaseAdmin
    .from("profiles").select("*").eq("id", userId).single();
  return data;
}

async function updateLoginStreak(userId) {
  const { data: p } = await supabaseAdmin
    .from("profiles")
    .select("login_streak, last_login_date, xp, level, xp_to_next, bluff_bucks")
    .eq("id", userId)
    .single();
  if (!p) return;

  const today = new Date().toISOString().split("T")[0];
  const last  = p.last_login_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = 1;
  if (last === yesterday) newStreak = (p.login_streak || 0) + 1;
  if (last === today)     newStreak = p.login_streak; // already logged in today

  const xpBonus  = newStreak === 7 ? 200 : 50;
  const coinBonus = newStreak === 7 ? 50 : newStreak % 7 === 0 ? 25 : 0;
  const newXp    = p.xp + xpBonus;

  await supabaseAdmin.from("profiles").update({
    login_streak: newStreak,
    last_login_date: today,
    xp: newXp,
    bluff_bucks: p.bluff_bucks + coinBonus,
  }).eq("id", userId);
}

module.exports = router;
