# 🎯 Bluff & Bet — Backend Server

Full Node.js + Express + Socket.io + Supabase + Stripe backend.

## Quick Start

```bash
npm install
cp .env.example .env   # Fill in your keys
npm run dev
```

## Project Structure

```
src/
  index.js              # Entry point — Express + Socket.io
  config/index.js       # Env config + validation
  middleware/
    auth.js             # JWT auth middleware
    errorHandler.js     # Global error handler + asyncHandler
  db/
    supabase.js         # Supabase client (public + admin)
  routes/
    auth.js             # Signup, login, OAuth, verify, refresh
    users.js            # Profile read/update
    shop.js             # Catalog, purchase, equip
    payments.js         # Stripe checkout sessions
    stripeWebhook.js    # Stripe fulfillment webhook
    leaderboard.js      # Global/national/state/friends ranks
    friends.js          # Friend requests, rivalry tracker
    clubs.js            # Club CRUD, chat, membership
    challenges.js       # Daily/weekly challenge progress + claim
    battlePass.js       # Season pass tier tracking + claim
  services/
    gameLogic.js        # Pure game rules (no DB)
    roomManager.js      # In-memory room + player state
    questionService.js  # OpenTDB fetch + fallback questions
    xpService.js        # XP grants, leveling, rewards
    emailService.js     # Verification emails via Resend
  sockets/
    index.js            # All Socket.io real-time game events
migrations/
  001_initial_schema.sql  # Full Supabase schema
```

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `createRoom` | `{ isPrivate, settings }` | Create a lobby |
| `joinRoom` | `{ code }` | Join by room code |
| `quickMatch` | — | Auto-match public room |
| `updateSettings` | `{ settings }` | Host updates game settings |
| `addCustomQuestion` | `{ question, options, correctIndex }` | Host adds question |
| `startGame` | — | Host starts the game |
| `placeBet` | `{ type, amount, targetId }` | Place blind bet |
| `submitAnswer` | `{ answerIdx, doubleDown }` | Submit answer + optional double down |
| `voteCategory` | `{ categoryIndex }` | Vote on next category |
| `lobbyChat` | `{ message }` | Lobby chat message |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `roomCreated` | `{ code, state }` | Room created confirmation |
| `roomJoined` | `{ code, state }` | Joined room confirmation |
| `playerJoined` | `{ username, state }` | Someone joined |
| `playerLeft` | `{ username, state }` | Someone left |
| `roomState` | Full state | Game state update |
| `roundStart` | `{ round, total, powerUp, state }` | New round begins |
| `questionReveal` | `{ question, timer, state }` | Question shown |
| `roundReveal` | `{ question, results, state }` | Round results |
| `categoryVote` | `{ options }` | Vote for next category |
| `voteUpdate` | `{ counts }` | Live vote tally |
| `gameEnd` | `{ stats, state }` | Game over + final stats |
| `error` | `"message"` | Error message |

## REST API

```
POST /api/auth/signup            Create account
POST /api/auth/login             Email/password login
POST /api/auth/oauth             Google/Discord login
POST /api/auth/refresh           Refresh JWT
POST /api/auth/verify-email      Verify email code
POST /api/auth/forgot-password   Send reset link

GET  /api/users/me               Full profile + inventory
GET  /api/users/:username        Public profile
PATCH /api/users/me              Update profile

GET  /api/shop/catalog           All shop items
GET  /api/shop/inventory         Owned items
GET  /api/shop/equipped          Currently equipped
POST /api/shop/purchase          Buy item with Bluff Bucks
POST /api/shop/equip             Equip owned item

GET  /api/payments/products      Coin pack info
POST /api/payments/checkout/coins  Create Stripe checkout
POST /api/payments/checkout/vip    Start VIP subscription
POST /api/payments/cancel-vip      Cancel VIP

GET  /api/leaderboard            Top 100 (global/national/state/friends)
GET  /api/leaderboard/my-rank    My current ranks

GET  /api/friends                Friends list + rivalry
GET  /api/friends/pending        Pending requests
POST /api/friends/request        Send request
POST /api/friends/respond        Accept/decline
DELETE /api/friends/:id          Remove friend

GET  /api/clubs                  Browse clubs
GET  /api/clubs/mine             My club + members
POST /api/clubs                  Create club
POST /api/clubs/:id/join         Join club
POST /api/clubs/leave            Leave club
GET  /api/clubs/:id/chat         Club chat history
POST /api/clubs/:id/chat         Send chat message

GET  /api/challenges             Daily + weekly progress
POST /api/challenges/claim       Claim completed reward

GET  /api/battlepass             My season pass state
POST /api/battlepass/claim       Claim tier reward

POST /api/stripe/webhook         Stripe fulfillment (raw body)
```

## Deployment

### Railway (recommended)
1. Push to GitHub
2. Connect repo in Railway
3. Set environment variables
4. Deploy — Railway auto-detects Node.js

### Env vars needed in production
- `SUPABASE_URL` + keys
- `JWT_SECRET` + `JWT_REFRESH_SECRET` (32+ char random strings)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `CORS_ORIGIN` (your Vercel frontend URL)
