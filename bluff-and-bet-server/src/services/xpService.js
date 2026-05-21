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

module.exports = { grantXP, calcGameXP, xpForLevel };
