// ─── src/services/challengeService.js ────────────────────────────────────────
// Procedural daily/weekly mission generation + progress tracking

// ─── Challenge pools ──────────────────────────────────────────────────────────

const DAILY_POOL = [
  {
    id:"play_1", type:"play_games", difficulty:"easy",
    name:"Just Showing Up", desc:"Play 1 game", icon:"🎮", target:1,
    rewards:[{type:"xp",amount:100},{type:"coins",amount:25}],
  },
  {
    id:"play_3", type:"play_games", difficulty:"medium",
    name:"Grinder", desc:"Play 3 games", icon:"🎮", target:3,
    rewards:[{type:"xp",amount:220},{type:"coins",amount:50},{type:"bp",amount:30}],
  },
  {
    id:"win_1", type:"win_games", difficulty:"medium",
    name:"Taste of Victory", desc:"Win a game", icon:"🏆", target:1,
    rewards:[{type:"xp",amount:180},{type:"coins",amount:45}],
  },
  {
    id:"win_2", type:"win_games", difficulty:"hard",
    name:"Double Down", desc:"Win 2 games in a day", icon:"🏆", target:2,
    rewards:[{type:"xp",amount:320},{type:"coins",amount:80},{type:"bp",amount:50}],
  },
  {
    id:"correct_5", type:"correct_answers", difficulty:"easy",
    name:"Answer Machine", desc:"Get 5 correct answers", icon:"🧠", target:5,
    rewards:[{type:"xp",amount:120},{type:"coins",amount:30}],
  },
  {
    id:"correct_10", type:"correct_answers", difficulty:"medium",
    name:"Knowledge Drop", desc:"Get 10 correct answers", icon:"🧠", target:10,
    rewards:[{type:"xp",amount:200},{type:"coins",amount:50},{type:"bp",amount:25}],
  },
  {
    id:"bluff_1", type:"bluffs_landed", difficulty:"easy",
    name:"First Bluff", desc:"Land 1 successful bluff", icon:"🎭", target:1,
    rewards:[{type:"xp",amount:130},{type:"coins",amount:35}],
  },
  {
    id:"bluff_3", type:"bluffs_landed", difficulty:"medium",
    name:"Master Bluffer", desc:"Land 3 successful bluffs", icon:"🎭", target:3,
    rewards:[{type:"xp",amount:230},{type:"coins",amount:60},{type:"bp",amount:30}],
  },
  {
    id:"streak_3", type:"streak_3", difficulty:"medium",
    name:"Hot Streak", desc:"Get a 3+ answer streak in one game", icon:"🔥", target:1,
    rewards:[{type:"xp",amount:180},{type:"coins",amount:45}],
  },
  {
    id:"top3_2", type:"top_three", difficulty:"medium",
    name:"Podium Regular", desc:"Finish in the top 3 twice", icon:"🥉", target:2,
    rewards:[{type:"xp",amount:200},{type:"coins",amount:50},{type:"bp",amount:25}],
  },
  {
    id:"first_1", type:"first_place", difficulty:"hard",
    name:"Top Dog", desc:"Finish in 1st place", icon:"👑", target:1,
    rewards:[{type:"xp",amount:350},{type:"coins",amount:90},{type:"bp",amount:60}],
  },
  {
    id:"accuracy_75", type:"accuracy_75", difficulty:"hard",
    name:"Precision Player", desc:"Finish a game with 75%+ accuracy", icon:"⚡", target:1,
    rewards:[{type:"xp",amount:300},{type:"coins",amount:75},{type:"bp",amount:50}],
  },
];

const WEEKLY_POOL = [
  {
    id:"w_play_10", type:"play_games", difficulty:"medium",
    name:"Dedicated Player", desc:"Play 10 games this week", icon:"🎮", target:10,
    rewards:[{type:"xp",amount:600},{type:"coins",amount:180},{type:"bp",amount:100}],
  },
  {
    id:"w_play_5", type:"play_games", difficulty:"easy",
    name:"Regular Player", desc:"Play 5 games this week", icon:"🎮", target:5,
    rewards:[{type:"xp",amount:350},{type:"coins",amount:90},{type:"bp",amount:60}],
  },
  {
    id:"w_win_5", type:"win_games", difficulty:"hard",
    name:"Winner's Circle", desc:"Win 5 games this week", icon:"🏆", target:5,
    rewards:[{type:"xp",amount:900},{type:"coins",amount:240},{type:"bp",amount:180}],
  },
  {
    id:"w_win_3", type:"win_games", difficulty:"medium",
    name:"Hat Trick", desc:"Win 3 games this week", icon:"🎯", target:3,
    rewards:[{type:"xp",amount:550},{type:"coins",amount:140},{type:"bp",amount:100}],
  },
  {
    id:"w_correct_50", type:"correct_answers", difficulty:"medium",
    name:"Trivia Expert", desc:"Get 50 correct answers this week", icon:"🧠", target:50,
    rewards:[{type:"xp",amount:650},{type:"coins",amount:170},{type:"bp",amount:120}],
  },
  {
    id:"w_correct_25", type:"correct_answers", difficulty:"easy",
    name:"Knowledge Seeker", desc:"Get 25 correct answers this week", icon:"🧠", target:25,
    rewards:[{type:"xp",amount:400},{type:"coins",amount:100},{type:"bp",amount:70}],
  },
  {
    id:"w_bluff_10", type:"bluffs_landed", difficulty:"hard",
    name:"The Mastermind", desc:"Land 10 bluffs this week", icon:"🎭", target:10,
    rewards:[{type:"xp",amount:800},{type:"coins",amount:210},{type:"bp",amount:150}],
  },
  {
    id:"w_first_3", type:"first_place", difficulty:"hard",
    name:"The Champion", desc:"Finish 1st place 3 times this week", icon:"👑", target:3,
    rewards:[{type:"xp",amount:1000},{type:"coins",amount:280},{type:"bp",amount:220}],
  },
];

// ─── Deterministic shuffle (same seed = same order) ──────────────────────────

function seededShuffle(arr, seed) {
  const items = [...arr];
  let s = seed >>> 0;
  for (let i = items.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function getDailySeed() {
  const d = new Date();
  // UTC date so all users worldwide get the same set on the same calendar day
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

function getWeeklySeed() {
  // ISO week number — changes every Monday
  const d = new Date();
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
  return d.getUTCFullYear() * 1000 + weekNum;
}

function getDailyChallenges()  { return seededShuffle(DAILY_POOL,  getDailySeed()).slice(0, 3); }
function getWeeklyChallenges() { return seededShuffle(WEEKLY_POOL, getWeeklySeed()).slice(0, 3); }

// ─── Reset timestamps ─────────────────────────────────────────────────────────

function getDailyResetAt() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1); // midnight tomorrow UTC
  return d.toISOString();
}

function getWeeklyResetAt() {
  const d = new Date();
  // Next Monday 00:00 UTC
  const daysUntilMonday = (8 - d.getUTCDay()) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

// ─── How many units a game event contributes to each challenge type ───────────

function calcIncrement(challenge, events) {
  switch (challenge.type) {
    case "play_games":      return 1;
    case "win_games":       return events.won        ? 1 : 0;
    case "correct_answers": return events.correctAnswers || 0;
    case "bluffs_landed":   return events.bluffsLanded  || 0;
    case "streak_3":        return (events.maxStreak || 0) >= 3 ? 1 : 0;
    case "streak_5":        return (events.maxStreak || 0) >= 5 ? 1 : 0;
    case "top_three":       return events.topThree   ? 1 : 0;
    case "first_place":     return events.firstPlace ? 1 : 0;
    case "accuracy_75":     return (events.accuracy  || 0) >= 75 ? 1 : 0;
    default:                return 0;
  }
}

// ─── Update progress for all active missions after a completed game ───────────

async function updateChallengeProgress(userId, gameEvents, supabase) {
  const daily        = getDailyChallenges();
  const weekly       = getWeeklyChallenges();
  const dailyReset   = getDailyResetAt();
  const weeklyReset  = getWeeklyResetAt();

  const tasks = [
    ...daily.map(c  => ({ def: c, type:"daily",  resetAt: dailyReset })),
    ...weekly.map(c => ({ def: c, type:"weekly", resetAt: weeklyReset })),
  ];

  for (const { def, type, resetAt } of tasks) {
    const inc = calcIncrement(def, gameEvents);
    if (inc === 0) continue;

    try {
      const { data: existing } = await supabase
        .from("challenge_progress")
        .select("id, progress")
        .eq("user_id", userId)
        .eq("challenge_id", def.id)
        .eq("reset_at", resetAt)
        .maybeSingle();

      const current    = existing?.progress || 0;
      if (current >= def.target) continue; // already maxed

      const newProgress = Math.min(current + inc, def.target);
      const completed   = newProgress >= def.target;

      if (existing) {
        await supabase.from("challenge_progress")
          .update({ progress: newProgress, completed })
          .eq("id", existing.id);
      } else {
        await supabase.from("challenge_progress").insert({
          user_id: userId, challenge_id: def.id, challenge_type: type,
          progress: newProgress, completed, claimed: false, reset_at: resetAt,
        }).catch(() => {}); // harmless on duplicate (race condition)
      }
    } catch (e) {
      console.error("[challengeProgress]", def.id, e.message);
    }
  }
}

module.exports = {
  getDailyChallenges, getWeeklyChallenges,
  getDailyResetAt, getWeeklyResetAt,
  updateChallengeProgress,
};
