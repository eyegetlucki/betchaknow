// ─── src/routes/friends.js ────────────────────────────────────────────────────
const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

// GET /api/friends — list all friendships with rivalry stats
router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const { data: friendships } = await supabaseAdmin
    .from("friendships")
    .select("*, requester:requester(id,username,avatar_icon,level,is_vip), recipient:recipient(id,username,avatar_icon,level,is_vip)")
    .or(`requester.eq.${uid},recipient.eq.${uid}`)
    .eq("status", "accepted");

  const friends = (friendships || []).map(f => {
    const other = f.requester.id === uid ? f.recipient : f.requester;
    return { ...other, friendshipId: f.id };
  });

  // Get rivalry records
  const friendIds = friends.map(f => f.id);
  const { data: rivalries } = await supabaseAdmin
    .from("rivalries")
    .select("*")
    .or(`player_a.eq.${uid},player_b.eq.${uid}`)
    .in(uid === "player_a" ? "player_b" : "player_a", friendIds);

  const rivalryMap = {};
  (rivalries || []).forEach(r => {
    const otherId = r.player_a === uid ? r.player_b : r.player_a;
    rivalryMap[otherId] = {
      wins:   r.player_a === uid ? r.a_wins : r.b_wins,
      losses: r.player_a === uid ? r.b_wins : r.a_wins,
    };
  });

  const enriched = friends.map(f => ({
    ...f,
    rivalry: rivalryMap[f.id] || { wins: 0, losses: 0 },
  }));

  res.json({ friends: enriched });
}));

// GET /api/friends/pending — incoming & outgoing requests
router.get("/pending", requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const { data } = await supabaseAdmin
    .from("friendships")
    .select("*, requester:requester(id,username,avatar_icon,level,is_vip), recipient:recipient(id,username,avatar_icon,level,is_vip)")
    .or(`requester.eq.${uid},recipient.eq.${uid}`)
    .eq("status", "pending");

  const incoming = (data || []).filter(f => f.recipient.id === uid);
  const outgoing = (data || []).filter(f => f.requester.id === uid);
  res.json({ incoming, outgoing });
}));

// POST /api/friends/request  { username }
router.post("/request", requireAuth, asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) throw createError(400, "Username required");

  const { data: target } = await supabaseAdmin
    .from("profiles").select("id").eq("username", username).single();
  if (!target) throw createError(404, "User not found");
  if (target.id === req.user.id) throw createError(400, "Can't add yourself");

  const { error } = await supabaseAdmin.from("friendships").insert({
    requester: req.user.id, recipient: target.id, status: "pending",
  });
  if (error) {
    if (error.code === "23505") throw createError(409, "Friend request already exists");
    throw createError(500, error.message);
  }
  res.json({ message: "Friend request sent" });
}));

// POST /api/friends/respond  { friendshipId, action: accept|decline }
router.post("/respond", requireAuth, asyncHandler(async (req, res) => {
  const { friendshipId, action } = req.body;
  if (!["accept","decline"].includes(action)) throw createError(400, "Invalid action");

  const { data: f } = await supabaseAdmin
    .from("friendships").select("*").eq("id", friendshipId).single();
  if (!f) throw createError(404, "Request not found");
  if (f.recipient !== req.user.id) throw createError(403, "Not your request");

  await supabaseAdmin.from("friendships")
    .update({ status: action === "accept" ? "accepted" : "declined" })
    .eq("id", friendshipId);

  // Initialize rivalry record on accept
  if (action === "accept") {
    await supabaseAdmin.from("rivalries").upsert({
      player_a: f.requester, player_b: f.recipient,
    }, { onConflict: "player_a,player_b", ignoreDuplicates: true });
  }

  res.json({ message: action === "accept" ? "Friend added!" : "Request declined" });
}));

// DELETE /api/friends/:friendId
router.delete("/:friendId", requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const { friendId } = req.params;
  await supabaseAdmin.from("friendships")
    .delete()
    .or(`and(requester.eq.${uid},recipient.eq.${friendId}),and(requester.eq.${friendId},recipient.eq.${uid})`);
  res.json({ message: "Friend removed" });
}));

module.exports = router;
