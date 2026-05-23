// ─── src/routes/challenges.js ────────────────────────────────────────────────
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

// GET /api/challenges — daily + weekly challenges + login streak for the user
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const today = new Date().toISOString().split("T")[0];

  const { data: progress } = await supabaseAdmin
    .from("challenge_progress")
    .select("*")
    .eq("user_id", uid);

  const { data: definitions } = await supabaseAdmin
    .from("challenge_definitions")
    .select("*")
    .eq("active", true);

  const { data: streak } = await supabaseAdmin
    .from("login_streaks")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  const progressMap = {};
  (progress || []).forEach(p => { progressMap[p.challenge_id] = p; });

  const enrich = (def) => {
    const p = progressMap[def.id] || {};
    return {
      id:         def.id,
      icon:       def.icon,
      name:       def.name,
      desc:       def.description,
      progress:   p.progress || 0,
      total:      def.target,
      rewards:    def.rewards || [],
      completed:  (p.progress || 0) >= def.target,
      claimed:    p.claimed || false,
      difficulty: def.difficulty || "medium",
    };
  };

  const all = (definitions || []).map(enrich);
  res.json({
    daily:       all.filter(c => c.id.startsWith("d")),
    weekly:      all.filter(c => c.id.startsWith("w")),
    loginStreak: streak || { current: 0, todayClaimed: false, days: [] },
  });
}));

// POST /api/challenges/claim  { challengeId }
router.post("/claim", requireAuth, asyncHandler(async (req, res) => {
  const { challengeId } = req.body;
  if (!challengeId) throw createError(400, "challengeId required");

  const { data: p } = await supabaseAdmin
    .from("challenge_progress")
    .select("*")
    .eq("user_id", req.user.id)
    .eq("challenge_id", challengeId)
    .maybeSingle();

  if (!p) throw createError(404, "Challenge progress not found");
  if (p.claimed) throw createError(409, "Already claimed");

  const { data: def } = await supabaseAdmin
    .from("challenge_definitions")
    .select("*")
    .eq("id", challengeId)
    .single();
  if (!def) throw createError(404, "Challenge not found");
  if (p.progress < def.target) throw createError(400, "Challenge not completed");

  await supabaseAdmin
    .from("challenge_progress")
    .update({ claimed: true })
    .eq("user_id", req.user.id)
    .eq("challenge_id", challengeId);

  res.json({ success: true, rewards: def.rewards || [] });
}));

module.exports = router;
