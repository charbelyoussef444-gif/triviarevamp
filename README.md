# Trivia Revamp Beta (iOS-first)

Arcade-style multiplayer trivia game monorepo with three modes:
- Play with Friends (private room code)
- Ranked matchmaking (server-authoritative)
- Survival (solo endless until eliminated)

## Stack
- **Mobile:** Expo + React Native + TypeScript + Expo Router + Zustand + Socket.IO client
- **Server:** Node.js + TypeScript + Express + Socket.IO
- **Shared:** Typed events/schemas/game logic helpers
- **DB:** Supabase Postgres migrations + seed SQL

## Monorepo structure
```txt
apps/
  mobile/
  server/
packages/
  shared/
supabase/
  migrations/
  seed.sql
README.md
package.json
```

## Quick start
1. Install deps:
   ```bash
   npm install
   ```
2. Run server:
   ```bash
   npm run dev:server
   ```
3. Run mobile app:
   ```bash
   npm run dev:mobile
   ```
4. Run tests:
   ```bash
   npm test
   ```

## Environment variables

### apps/server/.env.example
- `PORT=4000`
- `CLIENT_ORIGIN=*`
- `SUPABASE_URL=`
- `SUPABASE_SERVICE_ROLE_KEY=`
- `DISCONNECT_GRACE_SECONDS=30`

### apps/mobile/.env.example
- `EXPO_PUBLIC_SERVER_URL=http://localhost:4000`


## Friends mode (server authoritative)
- Create room and join by 6-character room code.
- Lobby sync with host-only start.
- Spinner target, category voting by non-target alive players, and timed answers are all progressed by server timers.
- Elimination risk and winner resolution are server-only.
- Reconnect grace period is enforced before disconnect-forfeit elimination.

## Ranked mode (beta)
- Queue joins use server-trusted rating (client-submitted rating is ignored).
- Simple matchmaking buckets place 2 to 4 players into ranked matches.
- Match loop is fully server authoritative (spinner, voting, question selection, answer validation, elimination, winner).
- Disconnect grace applies; unresolved disconnect becomes elimination/forfeit.
- Rating updates: winner `+15`, non-winners `-10` (floor 100), with ranked leaderboard endpoint at `GET /leaderboard/ranked`.

## Survival mode (fully playable beta)
- `POST /survival/start` starts a session and returns first seeded question + timer deadline.
- `POST /survival/answer` validates answer server-side, applies timer + chamber risk, and returns next question or end state.
- `GET /leaderboard/survival` returns persisted in-memory leaderboard rows for the running server instance.

## Core game rules (beta)
- Spinner chooses target player server-side.
- Non-target alive players vote category from 3 options.
- Timed question answer by target player.
- Wrong answer triggers chamber risk.
- Risk config in shared constants:
  - Base: 30%
  - Step increase: +5% per wrong event
  - Cap: 75%

## Commands
- Install: `npm install`
- Start mobile: `npm run dev:mobile`
- Start server: `npm run dev:server`
- Run tests: `npm test`
- Seed database: apply `supabase/migrations/*.sql`, then `supabase/seed.sql`

## What is fully implemented vs mocked
### Fully implemented
- Shared typed contracts, validators, and core engine logic.
- Server-authoritative room creation/join/start, ranked queue, round loop, voting, answering, elimination risk, winner detection.
- Survival session route and leaderboard endpoint.
- Mobile app routing + all required beta screens wired with socket events.
- Supabase schema + 100 seeded questions.
- Unit tests for risk, vote tally, round progression, winner resolution + integration-style server flow test.

### Mocked / minimal for beta
- Supabase persistence wrappers are optional/fallback; in-memory runtime is default when env vars missing.
- Audio is placeholder hook.
- MMR is basic (+15 winner / -10 loser baseline).
- Animation polish/haptics are lightweight.

## Known limitations
- No production auth yet (guest nickname flow).
- Matchmaking is simple bucket queue.
- No advanced anti-abuse moderation.
- Mobile UI is beta-level, not final production polish.

## Next steps
- Add full Supabase persistence in live match writes.
- Add reconnect token auth and secure session handoff.
- Expand question quality and dynamic difficulty balancing.
- Add richer telemetry and crash analytics.
