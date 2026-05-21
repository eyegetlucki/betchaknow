// ─── src/routes/clubs.js ─────────────────────────────────────────────────────
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

// GET /api/clubs — list public clubs
router.get("/", asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin
    .from("clubs")
    .select("*, member_count:club_members(count)")
    .eq("is_public", true)
    .order("weekly_xp", { ascending: false })
    .limit(50);
  res.json({ clubs: data || [] });
}));

// GET /api/clubs/mine — my club
router.get("/mine", requireAuth, asyncHandler(async (req, res) => {
  const { data: membership } = await supabaseAdmin
    .from("club_members").select("club_id, role")
    .eq("user_id", req.user.id).single();
  if (!membership) return res.json({ club: null });

  const { data: club } = await supabaseAdmin
    .from("clubs").select("*").eq("id", membership.club_id).single();
  const { data: members } = await supabaseAdmin
    .from("club_members")
    .select("*, profile:user_id(id,username,avatar_icon,level,is_vip)")
    .eq("club_id", membership.club_id)
    .order("weekly_xp", { ascending: false });

  res.json({ club, members: members || [], myRole: membership.role });
}));

// POST /api/clubs — create a club
router.post("/", requireAuth, asyncHandler(async (req, res) => {
  const { name, tag, icon, description } = req.body;
  if (!name || name.length < 3) throw createError(400, "Club name must be at least 3 chars");
  if (!tag  || tag.length < 2)  throw createError(400, "Tag must be at least 2 chars");

  // Check already in a club
  const { data: existing } = await supabaseAdmin
    .from("club_members").select("id").eq("user_id", req.user.id).maybeSingle();
  if (existing) throw createError(409, "Already in a club — leave first");

  const { data: club, error } = await supabaseAdmin.from("clubs").insert({
    name, tag: tag.toUpperCase().slice(0,6),
    icon: icon || "🏆", description, owner_id: req.user.id,
  }).select().single();
  if (error) {
    if (error.code === "23505") throw createError(409, "Club name or tag already taken");
    throw createError(500, error.message);
  }

  await supabaseAdmin.from("club_members").insert({
    club_id: club.id, user_id: req.user.id, role: "captain",
  });
  res.status(201).json({ club });
}));

// POST /api/clubs/:clubId/join
router.post("/:clubId/join", requireAuth, asyncHandler(async (req, res) => {
  const { data: club } = await supabaseAdmin
    .from("clubs").select("*, member_count:club_members(count)")
    .eq("id", req.params.clubId).single();
  if (!club) throw createError(404, "Club not found");
  if ((club.member_count?.[0]?.count || 0) >= 50) throw createError(409, "Club is full");

  const { error } = await supabaseAdmin.from("club_members").insert({
    club_id: req.params.clubId, user_id: req.user.id, role: "member",
  });
  if (error) {
    if (error.code === "23505") throw createError(409, "Already a member");
    throw createError(500, error.message);
  }
  res.json({ message: "Joined club!" });
}));

// POST /api/clubs/leave
router.post("/leave", requireAuth, asyncHandler(async (req, res) => {
  await supabaseAdmin.from("club_members")
    .delete().eq("user_id", req.user.id);
  res.json({ message: "Left club" });
}));

// GET /api/clubs/:clubId/chat
router.get("/:clubId/chat", requireAuth, asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin
    .from("club_chat")
    .select("*, user:user_id(id,username,avatar_icon)")
    .eq("club_id", req.params.clubId)
    .order("created_at", { ascending: false })
    .limit(50);
  res.json({ messages: (data || []).reverse() });
}));

// POST /api/clubs/:clubId/chat
router.post("/:clubId/chat", requireAuth, asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || message.length > 400) throw createError(400, "Invalid message");

  // Verify membership
  const { data: member } = await supabaseAdmin
    .from("club_members").select("id")
    .eq("club_id", req.params.clubId).eq("user_id", req.user.id).single();
  if (!member) throw createError(403, "Not a club member");

  const { data } = await supabaseAdmin.from("club_chat").insert({
    club_id: req.params.clubId, user_id: req.user.id, message,
  }).select("*, user:user_id(id,username,avatar_icon)").single();

  res.status(201).json({ message: data });
}));

module.exports = router;
