const router = require("express").Router();
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", req.user.id).single();
  if (!profile) throw createError(404, "Profile not found");
  const { data: equipped } = await supabaseAdmin.from("equipped").select("*").eq("user_id", req.user.id).single();
  const { data: badges } = await supabaseAdmin.from("badges").select("badge_id, earned_at").eq("user_id", req.user.id);
  const { data: mastery } = await supabaseAdmin.from("category_mastery").select("*").eq("user_id", req.user.id);
  const { data: history } = await supabaseAdmin.from("game_history").select("*").eq("user_id", req.user.id).order("played_at", { ascending: false }).limit(20);
  res.json({ profile, equipped, badges: badges||[], mastery: mastery||[], history: history||[] });
}));

router.get("/:username", optionalAuth, asyncHandler(async (req, res) => {
  const { data: profile } = await supabaseAdmin.from("profiles")
    .select("id,username,avatar_icon,level,season_points,country,is_vip,games_played,games_won,bluffs_landed,longest_streak,created_at")
    .eq("username", req.params.username).single();
  if (!profile) throw createError(404, "User not found");
  const { data: equipped } = await supabaseAdmin.from("equipped").select("avatar,theme,cards,fx,badge1,badge2,badge3").eq("user_id", profile.id).single();
  const { data: mastery } = await supabaseAdmin.from("category_mastery").select("category,rank,progress").eq("user_id", profile.id);
  res.json({ profile, equipped, mastery: mastery||[] });
}));

router.patch("/me", requireAuth, asyncHandler(async (req, res) => {
  const allowed = ["username","avatar_icon","country","state"];
  const updates = {};
  for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
  if (Object.keys(updates).length === 0) throw createError(400, "No valid fields");
  if (updates.username && !/^[a-zA-Z0-9_]{3,20}$/.test(updates.username)) throw createError(400, "Invalid username");
  const { data, error } = await supabaseAdmin.from("profiles").update(updates).eq("id", req.user.id).select().single();
  if (error) throw createError(500, error.message);
  res.json({ profile: data });
}));

module.exports = router;
