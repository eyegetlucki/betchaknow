// ─── src/routes/stripeWebhook.js ─────────────────────────────────────────────
// Handles Stripe webhook events — fulfills coin purchases & VIP activations
// Raw body parser applied in index.js BEFORE this route

const router = require("express").Router();
const stripe = require("stripe")(require("../config").stripe.secretKey);
const config = require("../config");
const { supabaseAdmin } = require("../db/supabase");

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verify failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // ── ONE-TIME COIN PURCHASE ───────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status !== "paid") break;

        const { userId, type, coins, packId } = session.metadata;
        if (!userId) break;

        if (type === "coins") {
          const coinsToGrant = parseInt(coins) || 0;

          // Get current balance
          const { data: profile } = await supabaseAdmin
            .from("profiles").select("bluff_bucks").eq("id", userId).single();
          if (!profile) break;

          // Add coins
          await supabaseAdmin.from("profiles")
            .update({ bluff_bucks: profile.bluff_bucks + coinsToGrant })
            .eq("id", userId);

          // Mark purchase completed
          await supabaseAdmin.from("purchases")
            .update({ status: "completed", amount_usd: session.amount_total })
            .eq("stripe_session", session.id);

          console.log(`[Stripe] Granted ${coinsToGrant} coins to user ${userId}`);
        }

        if (type === "vip") {
          await activateVIP(userId, session.subscription);
        }
        break;
      }

      // ── VIP SUBSCRIPTION STARTED ─────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        if (sub.status !== "active") break;

        // Find user by subscription ID
        const { data: purchase } = await supabaseAdmin
          .from("purchases")
          .select("user_id")
          .eq("stripe_sub_id", sub.id)
          .maybeSingle();

        if (purchase?.user_id) {
          const expiresAt = new Date(sub.current_period_end * 1000);
          await supabaseAdmin.from("profiles")
            .update({ is_vip: true, vip_expires_at: expiresAt.toISOString() })
            .eq("id", purchase.user_id);
        }
        break;
      }

      // ── VIP SUBSCRIPTION CANCELLED ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const { data: purchase } = await supabaseAdmin
          .from("purchases")
          .select("user_id")
          .eq("stripe_sub_id", sub.id)
          .maybeSingle();

        if (purchase?.user_id) {
          await supabaseAdmin.from("profiles")
            .update({ is_vip: false, vip_expires_at: null })
            .eq("id", purchase.user_id);
          console.log(`[Stripe] VIP cancelled for user ${purchase.user_id}`);
        }
        break;
      }

      // ── REFUND ───────────────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object;
        const { data: purchase } = await supabaseAdmin
          .from("purchases")
          .select("*")
          .eq("stripe_session", charge.payment_intent)
          .maybeSingle();

        if (purchase && purchase.status !== "refunded") {
          await supabaseAdmin.from("purchases")
            .update({ status: "refunded" })
            .eq("id", purchase.id);

          if (purchase.product_type === "coins" && purchase.coins_granted > 0) {
            const { data: profile } = await supabaseAdmin
              .from("profiles").select("bluff_bucks").eq("id", purchase.user_id).single();
            if (profile) {
              const newBal = Math.max(0, profile.bluff_bucks - purchase.coins_granted);
              await supabaseAdmin.from("profiles")
                .update({ bluff_bucks: newBal }).eq("id", purchase.user_id);
            }
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[Stripe Webhook] Handler error:", err);
  }

  res.json({ received: true });
});

async function activateVIP(userId, subId) {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await supabaseAdmin.from("profiles")
    .update({ is_vip: true, vip_expires_at: expiresAt.toISOString() })
    .eq("id", userId);

  await supabaseAdmin.from("purchases").upsert({
    user_id: userId, product_type: "vip",
    stripe_sub_id: subId, status: "completed",
  }, { onConflict: "stripe_sub_id" });
}

module.exports = router;
