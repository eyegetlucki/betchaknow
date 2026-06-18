# Betcha Know! 🎯
**Real-time multiplayer trivia game — built solo, shipped to production.**

> Live at [betchaknow.vercel.app](https://betchaknow.vercel.app)

---

## Overview

Betcha Know! is a full-stack multiplayer trivia game built from the ground up by a single developer. Players compete in real-time trivia rooms with live scoring, social features, a progression system, and an in-game shop — all running on a WebSocket-driven architecture.

This project was built to demonstrate end-to-end product ownership: backend systems, real-time infrastructure, payments, auth, and 10 complete UI screens — all shipped solo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React · Vite · Tailwind CSS |
| Backend | Node.js · Express · REST API |
| Real-time | Socket.io (WebSockets) |
| Database | Supabase · PostgreSQL (row-level security) |
| Auth | JWT · Google OAuth 2.0 · Discord OAuth 2.0 |
| Payments | Stripe (microtransactions + subscriptions) |
| Deployment | Vercel (frontend) |

---

## Core Systems

### Real-Time Game Engine
- Stateful room manager supporting concurrent multiplayer sessions
- Pure-function scoring engine with real-time state sync across all connected players via Socket.io
- Host-controlled game flow with synchronized question delivery and answer collection

### Authentication
- JWT-based session management
- Google and Discord OAuth 2.0 integration
- Supabase row-level security enforcing per-user data isolation

### Progression & Economy
- XP and leveling service tracking player performance across sessions
- Bi-weekly leaderboard with automated reset
- In-game shop with live item preview and Stripe-powered microtransactions
- Battle pass system with challenge tracking

### Social Features
- Friends system with request/accept flow
- Rivalry tracking between players
- Clubs for group play

---

## UI Screens (10 total)

| Screen | Description |
|---|---|
| Auth | Login / signup with Google and Discord OAuth |
| Lobby | Room creation, joining, and player waiting room |
| Game | Live trivia gameplay with real-time scoring |
| Results | End-of-round breakdown and XP rewards |
| Shop | In-game item store with live preview and Stripe checkout |
| Battle Pass | Season progression with tiered rewards |
| Challenges | Daily and weekly challenge tracking |
| Leaderboard | Bi-weekly global rankings |
| Profile | Player stats, XP, level, and customization |
| Friends | Friend requests, rivalry tracking, and clubs |

---

## Project Structure

```
betchaknow/
├── betchaknow/              # Vite + React frontend
├── bluff-and-bet-server/    # Node.js + Express backend
├── BluffAndBet.jsx          # Main game component
├── BluffAndBet_Auth.jsx     # Auth screen
├── BluffAndBet_BattlePass.jsx
├── BluffAndBet_Challenges.jsx
├── BluffAndBet_Friends.jsx
├── BluffAndBet_Game.jsx     # Core gameplay
├── BluffAndBet_Leaderboard.jsx
├── BluffAndBet_Profile.jsx
├── BluffAndBet_Shop.jsx
└── LAUNCH_GUIDE.md          # Deployment guide
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- Supabase project (for database + auth)
- Stripe account (for payments)
- Google and Discord OAuth apps

### Frontend
```bash
cd betchaknow
npm install
npm run dev
```

### Backend
```bash
cd bluff-and-bet-server
npm install
node index.js
```

### Environment Variables
Create a `.env` in both frontend and backend directories. See `LAUNCH_GUIDE.md` for the full list of required keys.

---

## What This Project Demonstrates

- **Real-time systems architecture** — managing concurrent WebSocket sessions with consistent state across multiple players
- **Full-stack solo ownership** — every layer from database schema to UI, built and shipped by one developer
- **Production-grade auth and payments** — OAuth 2.0, JWT, and Stripe integrated end to end
- **Database security** — Supabase row-level security policies enforcing user data isolation at the DB layer
- **Product thinking** — 10 complete screens covering the full player lifecycle from onboarding to social engagement

---

## Developer

**Laitrell Uy-Xayachak** — AI systems developer and solo game builder
- GitHub: [github.com/eyegetlucki](https://github.com/eyegetlucki)
- Email: laitrell.company@gmail.com
