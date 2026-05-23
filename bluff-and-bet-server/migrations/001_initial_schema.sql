-- ============================================================
-- Bluff & Bet — Supabase Database Schema
-- Run in Supabase SQL editor or via migration runner
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS / PROFILES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT UNIQUE NOT NULL,
  avatar_icon     TEXT DEFAULT '🎯',
  country         TEXT DEFAULT NULL,
  state           TEXT,
  level           INT DEFAULT 1,
  xp              INT DEFAULT 0,
  xp_to_next      INT DEFAULT 1000,
  bluff_bucks     INT DEFAULT 0 CHECK (bluff_bucks >= 0),
  is_vip          BOOLEAN DEFAULT FALSE,
  vip_expires_at  TIMESTAMPTZ,
  login_streak    INT DEFAULT 0,
  last_login_date DATE,
  games_played    INT DEFAULT 0,
  games_won       INT DEFAULT 0,
  total_correct   INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  bluffs_landed   INT DEFAULT 0,
  longest_streak  INT DEFAULT 0,
  all_in_wins     INT DEFAULT 0,
  total_points_earned INT DEFAULT 0,
  season_points   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Row-level security: users can only read/update own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);

-- ─── CATEGORY MASTERY ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category_mastery (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  rank        INT DEFAULT 1 CHECK (rank BETWEEN 1 AND 6),
  progress    INT DEFAULT 0,
  correct     INT DEFAULT 0,
  UNIQUE(user_id, category)
);
ALTER TABLE category_mastery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mastery" ON category_mastery USING (auth.uid() = user_id);

-- ─── INVENTORY ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id    TEXT NOT NULL,
  item_type  TEXT NOT NULL,  -- avatar | theme | cards | fx | pack
  obtained_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own inventory" ON inventory USING (auth.uid() = user_id);

-- ─── EQUIPPED COSMETICS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipped (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  avatar      TEXT DEFAULT 'av_classic',
  theme       TEXT DEFAULT 'th_neon',
  cards       TEXT DEFAULT 'card_default',
  fx          TEXT DEFAULT 'fx_confetti',
  badge1      TEXT,
  badge2      TEXT,
  badge3      TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE equipped ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own equipped" ON equipped USING (auth.uid() = user_id);

-- ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  progress      INT DEFAULT 0,
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own achievements" ON achievements USING (auth.uid() = user_id);

-- ─── BADGES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS badges (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own badges" ON badges USING (auth.uid() = user_id);

-- ─── BATTLE PASS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS battle_pass (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  season          INT DEFAULT 1,
  current_tier    INT DEFAULT 0,
  xp              INT DEFAULT 0,
  claimed_free    INT[] DEFAULT '{}',
  claimed_premium INT[] DEFAULT '{}',
  UNIQUE(user_id, season)
);
ALTER TABLE battle_pass ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own battle pass" ON battle_pass USING (auth.uid() = user_id);

-- ─── CHALLENGES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id    TEXT NOT NULL,
  challenge_type  TEXT NOT NULL,  -- daily | weekly
  progress        INT DEFAULT 0,
  completed       BOOLEAN DEFAULT FALSE,
  claimed         BOOLEAN DEFAULT FALSE,
  reset_at        TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id, reset_at)
);
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own challenges" ON challenge_progress USING (auth.uid() = user_id);

-- ─── GAME HISTORY ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  room_code       TEXT,
  result          TEXT NOT NULL,  -- win | loss | draw
  points_delta    INT DEFAULT 0,
  accuracy        INT DEFAULT 0,
  bluffs_landed   INT DEFAULT 0,
  streak_achieved INT DEFAULT 0,
  all_in_used     BOOLEAN DEFAULT FALSE,
  xp_earned       INT DEFAULT 0,
  season_pts      INT DEFAULT 0,
  played_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own history" ON game_history USING (auth.uid() = user_id);

-- ─── FRIENDS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT DEFAULT 'pending',  -- pending | accepted | declined | blocked
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester, recipient),
  CHECK (requester <> recipient)
);
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own friendships" ON friendships
  USING (auth.uid() = requester OR auth.uid() = recipient);

-- ─── RIVALRY TRACKER ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rivalries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_a    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_b    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  a_wins      INT DEFAULT 0,
  b_wins      INT DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_a, player_b)
);
ALTER TABLE rivalries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players view rivalries" ON rivalries
  USING (auth.uid() = player_a OR auth.uid() = player_b);

-- ─── CLUBS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT UNIQUE NOT NULL,
  tag           TEXT UNIQUE NOT NULL,
  icon          TEXT DEFAULT '🏆',
  description   TEXT,
  banner_style  TEXT DEFAULT 'default',
  level         INT DEFAULT 1,
  xp            INT DEFAULT 0,
  weekly_xp     INT DEFAULT 0,
  owner_id      UUID REFERENCES profiles(id),
  is_public     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public clubs" ON clubs FOR SELECT USING (is_public = true);
CREATE POLICY "Owners can update clubs" ON clubs FOR UPDATE USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS club_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id    UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT DEFAULT 'member',  -- captain | officer | member
  weekly_xp  INT DEFAULT 0,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view club" ON club_members FOR SELECT USING (true);
CREATE POLICY "Users manage own membership" ON club_members
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS club_chat (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id    UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message    TEXT NOT NULL CHECK (char_length(message) < 500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE club_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view chat" ON club_chat FOR SELECT USING (true);
CREATE POLICY "Members can post" ON club_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── LEADERBOARD SNAPSHOT ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  season       INT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  final_rank   INT,
  score        INT,
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PURCHASES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_session  TEXT UNIQUE,
  stripe_sub_id   TEXT,
  product_type    TEXT NOT NULL,  -- coins | vip | question_pack
  product_id      TEXT,
  coins_granted   INT DEFAULT 0,
  amount_usd      INT,            -- in cents
  status          TEXT DEFAULT 'pending',  -- pending | completed | refunded
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_verifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CUSTOM QUESTIONS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_questions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question   TEXT NOT NULL,
  options    JSONB NOT NULL,   -- ["A","B","C","D"]
  correct    INT NOT NULL,     -- index 0-3
  category   TEXT DEFAULT 'custom',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE custom_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own questions" ON custom_questions USING (auth.uid() = owner_id);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_season_points ON profiles(season_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);
CREATE INDEX IF NOT EXISTS idx_game_history_user ON game_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester, recipient);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id, weekly_xp DESC);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
CREATE TRIGGER friendships_updated_at BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();
