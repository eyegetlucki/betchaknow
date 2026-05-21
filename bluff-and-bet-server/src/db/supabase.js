// ─── src/db/supabase.js ───────────────────────────────────────────────────────
const { createClient } = require("@supabase/supabase-js");
const config = require("../config");

// Public client (respects RLS)
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Admin client (bypasses RLS — server-side only, never expose to client)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = { supabase, supabaseAdmin };
