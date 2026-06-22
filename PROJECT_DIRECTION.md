# Web Invader Direction

Last updated: 2026-06-22

## Product Positioning

Web Invader is being developed as a browser-based arcade game service.

- Service / brand: BNC Arcade Web Invader
- Operator: dr. plan
- Homepage: https://drplan.kr/
- X profile: https://x.com/drplan26
- Contact: drplan26@gmail.com

The intended direction is not just a single playable mini-game, but a lightweight web game service with reliable scoring, repeat visits, operating pages, and future advertising readiness.

## Work Completed

### Supabase Backend Hardening

The original direct browser write path was reduced.

- Added Edge Functions:
  - `start-game`
  - `submit-score`
  - `record-visit`
- Added shared Edge Function helpers:
  - `supabase/functions/_shared/http.ts`
  - `supabase/functions/_shared/session.ts`
- `start-game` issues a signed game session token.
- `submit-score` now validates:
  - allowed origin
  - signed game session token
  - session expiry
  - elapsed play time
  - score bounds
  - plausible max score by starting stage
- `submit-score` calculates rank on the server using score, timestamp, and id.
- `record-visit` handles visit counting through the service role key instead of browser table writes.
- `site_visits` raw table access was closed to browser clients by removing public select/insert policies.

### Database Schema

Updated `supabase-schema.sql` to support the new service model.

- `leaderboard_scores` remains publicly selectable for leaderboard display.
- Direct browser insert into `leaderboard_scores` remains closed.
- Added stable ranking index:
  - `leaderboard_scores_score_created_id_idx`
- `site_visits` has RLS enabled and no public select/insert policies.
- Visit counting now happens through `record-visit`.

### Frontend Integration

Updated the game client to use the hardened backend.

- Game start calls `start-game`.
- Score submission sends the signed session token and elapsed time to `submit-score`.
- Visit stats call `record-visit`.
- Leaderboard ordering now uses:
  - score descending
  - created time ascending
  - id ascending

### Deployment

Supabase functions were deployed successfully to project:

```text
jgmmelnkviukgiithyyl
```

Deployed functions:

```text
start-game
submit-score
record-visit
```

Vercel production deployment has been confirmed working after the security changes.

### Commercial Readiness Pages

Added static operating pages for advertising and service trust.

- `about.html`
- `how-to-play.html`
- `privacy.html`
- `terms.html`
- `contact.html`
- `ads.txt`

Updated the build script so these files are copied to `dist`.

### Advertising Preparation

Added an advertising placeholder below the game.

- The placeholder is labeled `Advertisement`.
- No live ad code has been inserted yet.
- The layout avoids placing ads inside the game canvas or too close to gameplay controls.

Added `ads.txt` placeholder.

Real AdSense publisher data must be inserted after AdSense approval.

### Operator Branding

Updated visible service metadata.

- Replaced old creator text with `dr. plan`.
- Footer now uses:

```text
BNC Arcade Web Invader operated by dr. plan
```

- Added dr. plan homepage and X profile to operating pages.
- Contact page includes `drplan26@gmail.com`.

## Current State

The project is currently in a good pre-monetization foundation state.

Working components:

- Static Vercel deployment
- Supabase leaderboard
- Supabase visit counting
- Hardened score submission path
- Basic operating pages
- Advertising placeholder
- Build script for all static files

Known limitations:

- Score validation is improved but not cheat-proof.
- The game still computes gameplay client-side.
- There is no daily or weekly leaderboard yet.
- There is no analytics dashboard yet.
- `ads.txt` is still a placeholder.
- Real advertising code is not yet inserted.

## Next Development Direction

### Phase 1: Finalize Advertising Eligibility Basics

Goal: make the site clean and review-ready before applying for ads.

Tasks:

- Review `privacy.html` and `terms.html` for final wording.
- Keep contact information current.
- Add real `ads.txt` line after AdSense approval.
- Do not insert fake ad code before approval.
- Keep ad slots clearly labeled and away from gameplay controls.

### Phase 2: Ranking and Repeat Visit Features

Goal: create reasons for players to return.

Recommended features:

- Daily leaderboard
- Weekly leaderboard
- All-time leaderboard
- Better post-game result screen
- Player's current rank after saving
- Local personal best display
- Streak or "today's run" indicator

Implementation direction:

- Keep `leaderboard_scores` as the source table.
- Add server-side ranking filters by date range.
- Prefer Edge Functions for ranking queries that need custom rank logic.

### Phase 3: Game Result and Sharing

Goal: improve retention and organic sharing.

Recommended features:

- Game over summary panel:
  - score
  - stage reached
  - boss result
  - rank
  - personal best
- Shareable result text.
- Copy result button.
- Optional result URL in the future.

### Phase 4: Analytics and Operations

Goal: operate the game as a service instead of guessing.

Track:

- visits
- game starts
- score submissions
- completion rate
- average score
- average play time
- daily active players
- leaderboard submissions per day

Possible tools:

- Vercel Analytics
- Supabase event table
- GA4 or a privacy-focused alternative

### Phase 5: Stronger Anti-Cheat

Goal: make leaderboard abuse harder as traffic grows.

Current protection is basic:

- signed session
- elapsed time
- max score check
- rate limiting
- origin check

Future improvements:

- persistent rate limit table
- per-session single submission tracking
- CAPTCHA or Turnstile for suspicious submissions
- deterministic game seed and server-side replay validation
- moderation tools for deleting suspicious scores

### Phase 6: Game Identity and Content Expansion

Goal: make Web Invader feel distinct and commercially stronger.

Ideas:

- Stronger "web defense" theme
- Enemy types based on bots, bugs, malware, spam, and firewall breakers
- Stage-specific mechanics
- Boss pattern variety
- Unlockable visual themes
- Achievement system
- Seasonal challenge stages

### Phase 7: Monetization

Recommended order:

1. AdSense display ads after site approval
2. Game-over screen ad slot
3. Sponsorship or support link
4. Optional ad-free supporter mode
5. Custom event or education version
6. Cosmetic themes or skins

Rules to keep:

- Do not ask users to click ads.
- Do not place ads where gameplay taps/clicks may accidentally hit them.
- Do not disguise ads as game UI.
- Do not use reward mechanics with ordinary display ads unless the ad network explicitly supports it.

## Operational Checklist

Before every production deployment:

- Run `npm run build`.
- Run `node --check game.js`.
- Confirm `dist` contains all static pages.
- Check Vercel deployment status.
- Test the production URL.

After backend changes:

- Deploy Supabase Edge Functions.
- Check Supabase Function logs.
- Verify SQL schema changes in Supabase.
- Test leaderboard save and visit count.

Before AdSense application:

- Confirm `privacy.html`, `terms.html`, `contact.html`, and `about.html` are reachable.
- Confirm contact email is real.
- Confirm the site has meaningful gameplay and content.
- Confirm there are no broken links.
- Add real `ads.txt` after AdSense provides publisher details.

## Useful Commands

```bash
npm run build
node --check game.js
git status --short
```

Supabase deploy commands:

```bash
npx supabase functions deploy start-game
npx supabase functions deploy submit-score
npx supabase functions deploy record-visit
```

Vercel deploy is handled through GitHub integration after pushing to `main`.
