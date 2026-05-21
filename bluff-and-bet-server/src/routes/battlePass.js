const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const { data } = await supabaseAdmin
    .from("battle_pass").select("*")
    .eq("user_id", req.user.id).eq("season", 1).maybeSingle();
  res.json({ battlePass: data || { current_tier:0, xp:0, claimed_free:[], claimed_premium:[] } });
}));

router.post("/claim", requireAuth, asyncHandler(async (req, res) => {
  const { tier, track } = req.body;
  if (!tier || !["free","premium"].includes(track)) throw createError(400, "Invalid claim");
  const { data: bp } = await supabaseAdmin
    .from("battle_pass").select("*").eq("user_id", req.user.id).eq("season", 1).maybeSingle();
  if (!bp) throw createError(404, "Battle pass not found");
  if (tier > bp.current_tier) throw createError(400, "Tier not yet reached");
  const claimed = track === "free" ? bp.claimed_free : bp.claimed_premium;
  if (claimed.includes(tier)) throw createError(409, "Already claimed");
  if (track === "premium") {
    const { data: profile } = await supabaseAdmin.from("profiles").select("is_vip").eq("id", req.user.id).single();
    if (!profile?.is_vip) throw createError(403, "VIP required");
  }
  const field = track === "free" ? "claimed_free" : "claimed_premium";
  await supabaseAdmin.from("battle_pass").update({ [field]: [...claimed, tier] }).eq("user_id", req.user.id).eq("season", 1);
  res.json({ success: true, tier, track });
}));

module.exports = router;
