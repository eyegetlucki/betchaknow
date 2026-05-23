// ─── src/routes/payments.js ───────────────────────────────────────────────────
const router  = require("express").Router();
const stripe  = require("stripe")(require("../config").stripe.secretKey);
const config  = require("../config");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const { supabaseAdmin } = require("../db/supabase");

const COIN_PACKS = {
  starter: { coins: 200,  bonus: 0,   priceId: config.stripe.prices.coinsStarter, displayPrice:"$1.99" },
  popular: { coins: 600,  bonus: 50,  priceId: config.stripe.prices.coinsPopular, displayPrice:"$4.99" },
  best:    { coins: 1400, bonus: 200, priceId: config.stripe.prices.coinsBest,    displayPrice:"$9.99" },
};

// GET /api/payments/products — list available purchases
router.get("/products", (req, res) => {
  res.json({
    coinPacks: Object.entries(COIN_PACKS).map(([id, p]) => ({
      id, coins: p.coins, bonus: p.bonus, displayPrice: p.displayPrice,
      totalCoins: p.coins + p.bonus,
    })),
    vip: { price: "$4.99/mo", description: "VIP Battle Pass + perks" },
  });
});

// POST /api/payments/checkout/coins — create Stripe checkout for coin pack
router.post("/checkout/coins", requireAuth, asyncHandler(async (req, res) => {
  const { packId } = req.body;
  const pack = COIN_PACKS[packId];
  if (!pack) throw createError(400, "Invalid pack");
  if (!pack.priceId) throw createError(503, "Payment not configured yet");

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("username").eq("id", req.user.id).single();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: pack.priceId, quantity: 1 }],
    metadata: {
      userId:   req.user.id,
      packId,
      coins:    String(pack.coins + pack.bonus),
      type:     "coins",
    },
    customer_email: req.user.email,
    success_url: `${config.frontendUrl}/shop?purchase=success&pack=${packId}`,
    cancel_url:  `${config.frontendUrl}/shop?purchase=cancelled`,
  });

  // Log pending purchase
  await supabaseAdmin.from("purchases").insert({
    user_id:        req.user.id,
    stripe_session: session.id,
    product_type:   "coins",
    product_id:     packId,
    coins_granted:  pack.coins + pack.bonus,
    status:         "pending",
  });

  res.json({ url: session.url, sessionId: session.id });
}));

// POST /api/payments/checkout/vip — create Stripe subscription
router.post("/checkout/vip", requireAuth, asyncHandler(async (req, res) => {
  if (!config.stripe.prices.vipMonthly)
    throw createError(503, "VIP subscription not configured yet");

  const { data: profile } = await supabaseAdmin
    .from("profiles").select("*").eq("id", req.user.id).single();
  if (profile?.is_vip) throw createError(400, "Already a VIP member");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: config.stripe.prices.vipMonthly, quantity: 1 }],
    metadata: { userId: req.user.id, type: "vip" },
    customer_email: req.user.email,
    success_url: `${config.frontendUrl}/battlepass?vip=activated`,
    cancel_url:  `${config.frontendUrl}/battlepass`,
  });

  res.json({ url: session.url, sessionId: session.id });
}));

// POST /api/payments/cancel-vip — cancel VIP subscription
router.post("/cancel-vip", requireAuth, asyncHandler(async (req, res) => {
  const { data: purchase } = await supabaseAdmin
    .from("purchases")
    .select("stripe_sub_id")
    .eq("user_id", req.user.id)
    .eq("product_type", "vip")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!purchase?.stripe_sub_id) throw createError(404, "No active VIP subscription");

  await stripe.subscriptions.update(purchase.stripe_sub_id, { cancel_at_period_end: true });
  res.json({ message: "VIP subscription will cancel at end of billing period" });
}));

module.exports = router;
