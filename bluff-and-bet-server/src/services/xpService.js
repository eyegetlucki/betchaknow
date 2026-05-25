// ─── src/services/xpService.js ───────────────────────────────────────────────
// Handles XP, leveling, rewards on level-up

const { supabaseAdmin } = require("../db/supabase");

// XP required per level — increases progressively
function xpForLevel(level) {
  return Math.floor(1000 + (level - 1) * 200);
}

// Level-up rewards definition
const LEVEL_REWARDS = {
  5:   { coins: 50,  badge: "level_5",   message: "Level 5 reached!" },
  10:  { coins: 100, badge: "level_10",  item: "av_crown",     message: "Level 10! Royal Crown unlocked!" },
  20:  { coins: 150, badge: "level_20",  item: "fx_lightning", message: "Level 20! Lightning Strike FX!" },
  30:  { coins: 200, badge: "level_30",  item: "card_neon",    message: "Level 30! Neon Glow cards!" },
  50:  { coins: 500, badge: "level_50",  item: "av_dragon",    message: "Level 50! Lucky Dragon avatar!" },
  100: { coins: 1000, badge: "hall_of_fame", message: "Level 100! Hall of Fame!" },
};

// VIP XP multiplier
const VIP_MULT = 1.25;

/**
 * Grant XP to a player, handle level-ups, return events
 * @param {string} userId
 * @param {number} baseXp  — XP before multipliers
 * @param {boolean} isVIP
 * @returns {{ newLevel, leveledUp, rewards, xpGained }}
 */
async function grantXP(userId, baseXp, isVIP = false) {
  const xpGained = Math.round(isVIP ? baseXp * VIP_MULT : baseXp);

  const { data: p } = await supabaseAdmin
    .from("profiles")
    .select("xp, level, xp_to_next, bluff_bucks")
    .eq("id", userId)
    .single();

  if (!p) return { xpGained, newLevel: 1, leveledUp: false, rewards: [] };

  let currentXP    = p.xp + xpGained;
  let currentLevel = p.level;
  let xpToNext     = p.xp_to_next;
  let coinsEarned  = 0;
  const rewards    = [];
  const badges     = [];
  const items      = [];
  let leveledUp    = false;

  // Handle multiple level-ups
  while (currentXP >= xpToNext) {
    currentXP    -= xpToNext;
    currentLevel += 1;
    xpToNext      = xpForLevel(currentLevel);
    leveledUp     = true;

    const reward = LEVEL_REWARDS[currentLevel];
    if (reward) {
      coinsEarned += reward.coins || 0;
      if (reward.badge)  badges.push(reward.badge);
      if (reward.item)   items.push(reward.item);
      rewards.push({ level: currentLevel, ...reward });
    }
  }

  // Persist
  const updates = {
    xp:       currentXP,
    level:    currentLevel,
    xp_to_next: xpToNext,
    bluff_bucks: p.bluff_bucks + coinsEarned,
  };
  await supabaseAdmin.from("profiles").update(updates).eq("id", userId);

  // Grant badges
  for (const badgeId of badges) {
    await supabaseAdmin.from("badges").upsert(
      { user_id: userId, badge_id: badgeId },
      { onConflict: "user_id,badge_id", ignoreDuplicates: true }
    );
  }

  // Grant items to inventory
  for (const itemId of items) {
    await supabaseAdmin.from("inventory").upsert(
      { user_id: userId, item_id: itemId, item_type: "cosmetic" },
      { onConflict: "user_id,item_id", ignoreDuplicates: true }
    );
  }

  return { xpGained, newLevel: currentLevel, leveledUp, rewards };
}

/**
 * Calculate XP earned from a game result
 */
function calcGameXP(result, accuracy, bluffsLanded, streak, mvp, isVIP) {
  let xp = 100; // base for playing
  if (result === "win")   xp += 75;
  if (mvp)                xp += 100;
  if (bluffsLanded > 0)   xp += bluffsLanded * 25;
  if (streak >= 3)        xp += Math.min(streak * 10, 80);
  const finalXP = isVIP ? Math.round(xp * VIP_MULT) : xp;
  return finalXP;
}

const XP_PER_TIER = 1000;
const MAX_TIERS   = 40;

/**
 * Calculate season Battle Pass XP earned from a game:
 *   +15 XP per correct answer, +25 XP if answer was part of a 3+ streak
 *   +1000 / +450 / +250 for 1st / 2nd / 3rd place finish
 */
function calcSeasonXP(roundHistory, placement) {
  let xp = 0;
  for (const rh of roundHistory) {
    if (!rh.correct) continue;
    xp += (rh.streakAfter >= 3) ? 25 : 15;
  }
  if      (placement === 1) xp += 1000;
  else if (placement === 2) xp += 450;
  else if (placement === 3) xp += 250;
  return xp;
}

/**
 * Grant season XP to a player's battle_pass row, advancing tiers as needed.
 * Creates the row if it doesn't exist yet.
 */
async function grantSeasonXP(userId, baseXp, isVIP = false) {
  const gained = Math.round(isVIP ? baseXp * VIP_MULT : baseXp);
  if (gained <= 0) return { gained: 0, newTier: 0, tieredUp: false };

  const { data: bp } = await supabaseAdmin
    .from("battle_pass").select("current_tier, xp")
    .eq("user_id", userId).eq("season", 1).maybeSingle();

  let currentXP   = (bp?.xp || 0) + gained;
  let currentTier = bp?.current_tier || 0;
  let tieredUp    = false;

  while (currentXP >= XP_PER_TIER && currentTier < MAX_TIERS) {
    currentXP -= XP_PER_TIER;
    currentTier++;
    tieredUp = true;
  }

  if (bp) {
    await supabaseAdmin.from("battle_pass")
      .update({ current_tier: currentTier, xp: currentXP })
      .eq("user_id", userId).eq("season", 1);
  } else {
    await supabaseAdmin.from("battle_pass").insert({
      user_id: userId, season: 1,
      current_tier: currentTier, xp: currentXP,
      claimed_free: [], claimed_premium: [],
    }).catch(() => {});
  }

  return { gained, newTier: currentTier, tieredUp };
}

module.exports = { grantXP, calcGameXP, xpForLevel, calcSeasonXP, grantSeasonXP };
