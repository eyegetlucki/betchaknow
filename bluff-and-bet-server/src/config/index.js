// ─── src/config/index.js ──────────────────────────────────────────────────────
// Centralized config with env validation

const required = (key) => {
  const val = process.env[key];
  if (!val && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val || "";
};

module.exports = {
  port:        parseInt(process.env.PORT || "3001"),
  env:         process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  corsOrigin:  (() => {
    const raw = process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173";
    const origins = raw.split(",").map(s => s.trim()).filter(Boolean);
    return origins.length === 1 ? origins[0] : origins;
  })(),

  supabase: {
    url:            required("SUPABASE_URL"),
    anonKey:        required("SUPABASE_ANON_KEY"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  },

  jwt: {
    secret:         process.env.JWT_SECRET         || "dev-secret-change-me",
    refreshSecret:  process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-me",
    expiresIn:      process.env.JWT_EXPIRES_IN     || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  stripe: {
    secretKey:     required("STRIPE_SECRET_KEY"),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
    prices: {
      coinsStarter: process.env.STRIPE_PRICE_COINS_STARTER,
      coinsPopular: process.env.STRIPE_PRICE_COINS_POPULAR,
      coinsBest:    process.env.STRIPE_PRICE_COINS_BEST,
      vipMonthly:   process.env.STRIPE_PRICE_VIP_MONTHLY,
    },
  },

  oauth: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    discord: {
      clientId:     process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    },
  },

  email: {
    from:        process.env.EMAIL_FROM || "noreply@bluffandbet.com",
    resendKey:   process.env.RESEND_API_KEY,
  },
};
