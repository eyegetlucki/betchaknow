// ─── src/routes/challenges.js ────────────────────────────────────────────────
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");
const {
  getDailyChallenges, getWeeklyChallenges,
  getDailyResetAt, getWeeklyResetAt,
} = require("../services/challengeService");
const { grantXP, grantSeasonXP } = require("../services/xpService");

// GET /api/challenges — today's 3 daily + 3 weekly with user progress
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;

  const daily       = getDailyChallenges();
  const weekly      = getWeeklyChallenges();
  const dailyReset  = getDailyResetAt();
  const weeklyReset = getWeeklyResetAt();

  const allIds = [...daily.map(c => c.id), ...weekly.map(c => c.id)];

  const { data: progress } = await supabaseAdmin
    .from("challenge_progress")
    .select("*")
    .eq("user_id", uid)
    .in("challenge_id", allIds);

  // Key: "challengeId::resetAt" so the same challenge ID can appear in different periods
  const progressMap = {};
  for (const p of (progress || [])) {
    progressMap[`${p.challenge_id}::${p.reset_at}`] = p;
  }

  const enrich = (def, challengeType, resetAt) => {
    const p = progressMap[`${def.id}::${resetAt}`] || {};
    return {
      id:            def.id,
      icon:          def.icon,
      name:          def.name,
      desc:          def.desc,
      difficulty:    def.difficulty,
      progress:      p.progress || 0,
      total:         def.target,
      rewards:       def.rewards,
      completed:     (p.progress || 0) >= def.target,
      claimed:       p.claimed  || false,
      challengeType,
      resetAt,
    };
  };

  res.json({
    daily:       daily.map(c  => enrich(c, "daily",  dailyReset)),
    weekly:      weekly.map(c => enrich(c, "weekly", weeklyReset)),
    loginStreak: { current: 0, todayClaimed: false, days: [] },
  });
}));

// POST /api/challenges/claim  { challengeId }
router.post("/claim", requireAuth, asyncHandler(async (req, res) => {
  const { challengeId } = req.body;
  if (!challengeId) throw createError(400, "challengeId required");
  const uid = req.user.id;

  const daily       = getDailyChallenges();
  const weekly      = getWeeklyChallenges();
  const dailyReset  = getDailyResetAt();
  const weeklyReset = getWeeklyResetAt();

  let def     = daily.find(c => c.id === challengeId);
  let resetAt = dailyReset;
  if (!def) {
    def     = weekly.find(c => c.id === challengeId);
    resetAt = weeklyReset;
  }
  if (!def) throw createError(404, "Challenge not in today's active pool");

  const { data: p } = await supabaseAdmin
    .from("challenge_progress")
    .select("*")
    .eq("user_id", uid)
    .eq("challenge_id", challengeId)
    .eq("reset_at", resetAt)
    .maybeSingle();

  if (!p)                             throw createError(404, "No progress found — play some games first");
  if (p.claimed)                      throw createError(409, "Already claimed");
  if ((p.progress || 0) < def.target) throw createError(400, "Challenge not yet completed");

  await supabaseAdmin.from("challenge_progress")
    .update({ claimed: true })
    .eq("id", p.id);

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("is_vip, coins").eq("id", uid).single();

  for (const reward of (def.rewards || [])) {
    try {
      if (reward.type === "xp") {
        await grantXP(uid, reward.amount, profile?.is_vip);
      } else if (reward.type === "coins") {
        await supabaseAdmin.from("profiles")
          .update({ coins: (profile?.coins || 0) + reward.amount })
          .eq("id", uid);
      } else if (reward.type === "bp") {
        await grantSeasonXP(uid, reward.amount, profile?.is_vip);
      }
    } catch (e) {
      console.error("[claimReward]", reward.type, e.message);
    }
  }

  res.json({ success: true, rewards: def.rewards });
}));

module.exports = router;
