# Betcha Know! — Full Launch Guide

> From zero to live: Supabase → Railway → Vercel

---

## Overview

| Layer      | Tech                     | Host       |
|------------|--------------------------|------------|
| Frontend   | React + Vite             | Vercel     |
| Backend    | Express + Socket.io      | Railway    |
| Database   | PostgreSQL (Supabase)    | Supabase   |
| Auth       | JWT + Supabase Auth      | Supabase   |
| Payments   | Stripe                   | –          |
| Email      | Resend                   | –          |

---

## Step 1 — Supabase (Database + Auth)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users (e.g. `us-east-1`)
3. Save the **database password** — you won't see it again

### 1.2 Run the Migration
1. Open your Supabase project → **SQL Editor**
2. Paste and run the entire contents of:
   ```
   bluff-and-bet-server/migrations/001_initial_schema.sql
   ```
3. You should see tables: `profiles`, `friendships`, `rivalries`, `clubs`, `club_members`, `club_chat`, `battle_pass`, `game_history`, `category_mastery`, `badges`, `equipped`, `challenge_definitions`, `challenge_progress`, `login_streaks`, `shop_items`, `inventory`

### 1.3 Get Your Keys
Settings → API:

| Key | Where it goes |
|-----|--------------|
| **Project URL** | `SUPABASE_URL` in server `.env` |
| **anon public** | `SUPABASE_ANON_KEY` in server `.env` |
| **service_role** (secret) | `SUPABASE_SERVICE_ROLE_KEY` in server `.env` |

> The service_role key bypasses Row Level Security — keep it server-side only, never in the frontend.

### 1.4 Enable Email Auth
Authentication → Providers → Email → **Enable**

---

## Step 2 — Stripe (Payments)

### 2.1 Create Account
1. [stripe.com](https://stripe.com) → Create account
2. Dashboard → Developers → API Keys

| Key | Where it goes |
|-----|--------------|
| **Secret key** (`sk_test_...`) | `STRIPE_SECRET_KEY` in server `.env` |

### 2.2 Create Products
Products → Add Product for each coin pack and VIP:

| Product | Price | Copy the Price ID |
|---------|-------|------------------|
| Starter Pack (500 coins) | $1.99 | → `STRIPE_PRICE_COINS_STARTER` |
| Popular Pack (1200 coins) | $3.99 | → `STRIPE_PRICE_COINS_POPULAR` |
| Best Value (3000 coins) | $7.99 | → `STRIPE_PRICE_COINS_BEST` |
| VIP Pass (monthly) | $4.99/mo | → `STRIPE_PRICE_VIP_MONTHLY` |

### 2.3 Webhook (do this after Railway deploy)
Developers → Webhooks → Add endpoint:
- URL: `https://YOUR-RAILWAY-URL/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 3 — Resend (Email)

1. [resend.com](https://resend.com) → Create account → API Keys → Create Key
2. Add your domain (or use the Resend sandbox for testing)
3. Copy key → `RESEND_API_KEY` in server `.env`

---

## Step 4 — Server Environment Variables

Fill in `bluff-and-bet-server/.env`:

```env
# ─── SERVER ──────────────────────────────────────────────────
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://YOUR-VERCEL-APP.vercel.app

# ─── SUPABASE ────────────────────────────────────────────────
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# ─── JWT ─────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<different-64-char-random-hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── STRIPE ──────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_COINS_STARTER=price_...
STRIPE_PRICE_COINS_POPULAR=price_...
STRIPE_PRICE_COINS_BEST=price_...
STRIPE_PRICE_VIP_MONTHLY=price_...

# ─── EMAIL ───────────────────────────────────────────────────
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=re_...
```

Generate the two JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Run it twice, use one for `JWT_SECRET` and the other for `JWT_REFRESH_SECRET`.

---

## Step 5 — Deploy Server to Railway

### 5.1 Create Project
1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your repo → choose the `bluff-and-bet-server` folder as the root
3. Railway auto-detects Node.js

### 5.2 Set Environment Variables
Railway Dashboard → Your Service → Variables → Add all the vars from Step 4.

> Do NOT check `.env` into git. Paste the values directly in Railway's dashboard.

### 5.3 Set Start Command
Settings → Deploy → Start Command:
```
node src/index.js
```

### 5.4 Get Your URL
After deploy, Railway gives you a URL like `https://bluff-and-bet-server-production.up.railway.app`.

- Test it: `https://YOUR-RAILWAY-URL/health` should return `{"status":"ok"}`
- Copy this URL — you'll need it for the frontend env and Stripe webhook

---

## Step 6 — Deploy Frontend to Vercel

### 6.1 Set Frontend Environment Variable
In `betchaknow/.env` (local) and in Vercel dashboard:

```env
VITE_SERVER_URL=https://YOUR-RAILWAY-URL
```

### 6.2 Deploy
1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the repo → set **Root Directory** to `betchaknow`
3. Framework: **Vite** (auto-detected)
4. Environment Variables → add `VITE_SERVER_URL`
5. Deploy

### 6.3 Update CORS
Once Vercel gives you a URL (`https://your-app.vercel.app`):
1. Go back to Railway → Variables
2. Update `CORS_ORIGIN=https://your-app.vercel.app`
3. Railway will redeploy automatically

---

## Step 7 — Local Development

### Frontend (port 5173)
```bash
cd betchaknow
npm install
npm run dev
```

### Backend (port 3001)
```bash
cd bluff-and-bet-server
npm install
npm run dev
```

The Vite dev proxy in `vite.config.js` already forwards `/api/*` to `localhost:3001`, so both run side by side without CORS issues locally.

### Environment for local dev
`betchaknow/.env`:
```env
VITE_SERVER_URL=http://localhost:3001
```

`bluff-and-bet-server/.env`:
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
# ... rest of your real keys
```

---

## Step 8 — Verify Everything Works

After deploy, test these in order:

| Check | How |
|-------|-----|
| Server health | `GET /health` → `{"status":"ok"}` |
| Sign up | Create an account in the app |
| Login | Sign in, JWT stored in localStorage |
| Play a game | Multiplayer lobby → start game |
| Leaderboard | Shows real data from Supabase |
| Profile | Shows your actual stats |
| Friends | Add a friend from another account |
| Battle Pass | Tier and claims persist across sessions |
| VIP purchase | Stripe checkout opens (test mode: use card `4242 4242 4242 4242`) |

---

## Architecture Notes

### Auth Flow
```
User signs up → POST /api/auth/signup → Supabase creates auth user + profile row
Login → POST /api/auth/login → returns { token (15m), refreshToken (7d) }
Token stored in localStorage as "bk_token"
All API calls send: Authorization: Bearer <token>
Token expired → frontend can POST /api/auth/refresh with refreshToken
```

### Multiplayer Flow
```
User joins lobby → socket.emit("createRoom" | "joinRoom" | "quickMatch")
Server emits "roomCreated" / "roomJoined" → room code shown
Host emits "startGame" → server begins round cycle
Server drives phases: roundStart → questionReveal → roundReveal → categoryVote → loop
Players emit: placeBet, submitAnswer, voteCategory
```

### Data Flow (offline-first)
Every data-fetching page uses the pattern:
```js
useEffect(() => {
  if (!isLoggedIn()) return;   // guests see mock data
  api.whatever()
    .then(d => setServerData(d))
    .catch(() => {});          // on error, keep mock data
}, []);
```
This means the app always works — guests and logged-in users both have a good experience.

---

## File Map

```
Betcha Know/
├── betchaknow/                  ← Frontend (Vite + React)
│   ├── src/
│   │   ├── App.jsx              ← Navigation controller
│   │   ├── Lobby.jsx            ← Room creation / matchmaking
│   │   ├── Game.jsx             ← Full game flow (socket-driven)
│   │   ├── Auth.jsx             ← Login / signup screens
│   │   ├── Profile.jsx          ← Player profile
│   │   ├── Leaderboard.jsx      ← Global / national / state / friends
│   │   ├── Friends.jsx          ← Friends list + clubs
│   │   ├── Challenges.jsx       ← Daily / weekly missions
│   │   ├── BattlePass.jsx       ← Season battle pass
│   │   ├── Shop.jsx             ← Coin shop / VIP
│   │   ├── api.js               ← HTTP wrapper (all fetch calls)
│   │   └── socket.js            ← Socket.io singleton
│   └── .env                     ← VITE_SERVER_URL
│
└── bluff-and-bet-server/        ← Backend (Express + Socket.io)
    ├── src/
    │   ├── index.js             ← Server entry
    │   ├── config.js            ← Env var validation
    │   ├── routes/
    │   │   ├── auth.js
    │   │   ├── users.js
    │   │   ├── leaderboard.js
    │   │   ├── friends.js
    │   │   ├── clubs.js
    │   │   ├── battlePass.js
    │   │   ├── challenges.js
    │   │   ├── shop.js
    │   │   ├── payments.js
    │   │   └── stripeWebhook.js
    │   ├── sockets/
    │   │   └── index.js         ← All socket event handlers
    │   ├── services/
    │   │   └── roomManager.js   ← In-memory game room state
    │   ├── middleware/
    │   │   ├── auth.js          ← requireAuth / optionalAuth
    │   │   └── errorHandler.js
    │   └── db/
    │       └── supabase.js      ← Supabase admin client
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── .env                     ← All server secrets
```

---

## Common Issues

**Server won't start**
- Missing `.env` vars → check all required vars are set
- `challenges.js` route missing → file is now included, run `git pull` if needed

**CORS errors in browser**
- `CORS_ORIGIN` in Railway must exactly match your Vercel URL (no trailing slash)

**Socket.io disconnects immediately**
- Railway free tier sleeps after inactivity — upgrade to Hobby plan ($5/mo) to keep it awake

**Supabase 403 errors**
- You're using the anon key for an operation that needs the service_role key
- Or RLS policies are blocking the query — check Supabase → Authentication → Policies

**Stripe webhook signature invalid**
- The webhook secret must match the one in your Railway env
- Make sure you created the webhook pointing at Railway, not localhost

**JWT expired errors**
- Implement token refresh: call `POST /api/auth/refresh` with `bk_refresh` from localStorage when you get a 401

---

## What's Left to Build

These features have UI but need backend tables / logic:

| Feature | Status |
|---------|--------|
| Challenge definitions in DB | Need to seed `challenge_definitions` table |
| Challenge progress tracking | Needs game completion hooks to increment progress |
| Login streak | Needs daily login tracking endpoint |
| Shop items | Need to seed `shop_items` table |
| Online presence | Socket.io `presence` events (track who's online) |
| Real-time club chat | Replace polling with Socket.io room for clubs |
| Leaderboard `change` column | Need daily rank snapshots to compute delta |

---

*Generated May 2026 — Betcha Know! v1.0*
