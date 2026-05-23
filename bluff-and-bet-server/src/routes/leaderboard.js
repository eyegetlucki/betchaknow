// ─── src/routes/leaderboard.js ────────────────────────────────────────────────
const router = require("express").Router();
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

// GET /api/leaderboard?scope=global|national|state|friends&country=USA&state=California
router.get("/", optionalAuth, asyncHandler(async (req, res) => {
  const { scope = "global", country, state: stateParam } = req.query;
  let query = supabaseAdmin
    .from("profiles")
    .select("id, username, avatar_icon, level, season_points, country, state, is_vip")
    .order("season_points", { ascending: false })
    .limit(100);

  if (scope === "national" && country)        query = query.eq("country", country);
  if (scope === "state"    && stateParam)     query = query.eq("state", stateParam);

  const { data, error } = await query;
  if (error) throw createError(500, error.message);

  const ranked = (data || []).map((p, i) => ({ ...p, rank: i + 1 }));

  // Friends filter
  if (scope === "friends" && req.user) {
    const { data: friends } = await supabaseAdmin
      .from("friendships")
      .select("requester, recipient")
      .or(`requester.eq.${req.user.id},recipient.eq.${req.user.id}`)
      .eq("status", "accepted");

    const friendIds = new Set((friends || []).map(f =>
      f.requester === req.user.id ? f.recipient : f.requester
    ));
    friendIds.add(req.user.id);

    const filtered = ranked.filter(p => friendIds.has(p.id));
    return res.json({ leaderboard: filtered.map((p,i) => ({ ...p, rank: i+1 })) });
  }

  res.json({ leaderboard: ranked });
}));

// GET /api/leaderboard/my-rank
router.get("/my-rank", requireAuth, asyncHandler(async (req, res) => {
  const { data: me } = await supabaseAdmin
    .from("profiles").select("season_points, country, state").eq("id", req.user.id).single();
  if (!me) throw createError(404, "Profile not found");

  const countGlobal = await supabaseAdmin
    .from("profiles").select("id", { count:"exact", head:true })
    .gt("season_points", me.season_points);
  const globalRank = (countGlobal.count || 0) + 1;

  const countNational = me.country ? await supabaseAdmin
    .from("profiles").select("id", { count:"exact", head:true })
    .eq("country", me.country).gt("season_points", me.season_points) : { count: 0 };
  const nationalRank = (countNational.count || 0) + 1;

  const countState = me.state ? await supabaseAdmin
    .from("profiles").select("id", { count:"exact", head:true })
    .eq("state", me.state).gt("season_points", me.season_points) : { count: 0 };
  const stateRank = (countState.count || 0) + 1;

  res.json({ globalRank, nationalRank, stateRank, score: me.season_points });
}));

module.exports = router;
