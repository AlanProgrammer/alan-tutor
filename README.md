# Alan Tutor — Phase 2

A TypeScript monorepo for an English-learning app for Sorani Kurdish speakers. It includes a responsive Next.js web app, interactive Three.js tutor, Firebase Auth/Firestore, Gemini learning APIs and a Telegram webhook. No feature card is marked “SOON”; the implemented learning features are available from the signed-in dashboard or the documented bot commands.

## Repository

```text
app/
  api/features/route.ts       # SRS, dictation, roleplay/story, match, leaderboard, progression
  api/learn/route.ts          # tutor response + mistake detection
  api/link/route.ts           # authenticated one-time link-code creation
  api/media/route.ts          # image/audio/video tutoring
  api/placement/route.ts      # deterministic grammar + AI writing placement
  api/webhook/route.ts        # Telegram commands, media, groups, idempotency
components/
  Dashboard.tsx               # lessons, onboarding, media, SRS, social, certificates
  Mascot3D.tsx                # GLB/PNG auto-detection and procedural character fallback
  Podium3D.tsx               # three-dimensional leaderboard podium
lib/                         # Firebase, Gemini, account, placement, media, TTS, certificates
packages/core/                # shared domain contracts
public/                       # PWA manifest/service worker/icon
firestore.rules
.env.example
```

## Local development

1. Use Node.js 20+ and npm 10+. Run `npm install`, copy `.env.example` to `.env.local`, and fill in secrets.
2. In Firebase, create Firestore, enable Google Authentication, add local/deployed domains, create a service account with least privilege, and set its compact JSON as `FIREBASE_SERVICE_ACCOUNT_JSON`.
3. Deploy the provided Firestore rules and matchmaking index with `firebase deploy --only firestore:rules,firestore:indexes`. User writes happen through server routes using Admin SDK; the browser can read only its own profile.
4. Set Firebase **web** configuration values under the `NEXT_PUBLIC_FIREBASE_*` names. They are public app configuration, not admin credentials.
5. Set a Gemini key. `GEMINI_MODEL` defaults to `gemini-1.5-flash`; choose a supported model available to your Google AI project if needed.
6. Run `npm run dev`. Google sign-in and server-backed features require valid Firebase/Gemini credentials.

## Environment

- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` — server-only bot config; username without `@` is preferred.
- `GEMINI_API_KEY`, optional `GEMINI_MODEL` — server-only Gemini config.
- `FIREBASE_SERVICE_ACCOUNT_JSON` — server-only Firebase Admin credential JSON.
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` — browser Firebase config.
- `GOOGLE_CLOUD_TTS_API_KEY` — optional Cloud Text-to-Speech key; enables Telegram MP3 dictation. Without it, Telegram sends a spoiler-protected sentence; the web app uses browser speech synthesis.
- `NEXT_PUBLIC_APP_URL` — reserved for canonical links.

## Features in this phase

- **Mascot:** checks `/models/alan.glb`, then `/images/alan.png`, then uses a procedural 3D fallback with Kurdish-inspired details. Mood state supports idle, speaking, happy and encouraging. The same mascot appears on onboarding and tutor replies; certificate artwork includes a matching avatar illustration.
- **Placement/progression:** fixed server-side grammar answer key plus Gemini assessment of a short writing sample. Level advancement requires XP, a hidden-answer five-question test, and a CEFR writing threshold. A successful level-up awards XP and creates a 2400×1600 PNG certificate.
- **Account linking:** dashboard creates a cryptographically random six-digit code with ten-minute expiry. Telegram `/start link_CODE` or `/link CODE` consumes it once, atomically merges profile totals and aliases `telegram_accounts/{telegramId}` to the Firebase UID. Both clients then use `users/{firebaseUid}`. Prior SRS cards are copied during migration.
- **Multimodal:** image text extraction and Sorani explanations; pronunciation review for audio; short video shadowing analysis. Files are limited to 4 MiB and supported image/audio/video MIME types. Gemini assessments are approximate and should not be treated as formal exams.
- **Practice:** browser/Telegram dictation, deterministic word-level transcription scoring, automatic mistake review due in three days and then seven days after a successful attempt, daily Baghdad-time streaks, situational idioms, interactive roleplay and branching story sessions.
- **Social/gamification:** live XP leaderboard with a 3D podium; atomic same-CEFR matchmaking; mediated peer messages in the web app; group `/trivia` rounds and transactional `/wordchain`; Telegram group corrections only when `@AlanTutor` is mentioned.
- **Telegram commands:** `/start`, `/help`, `/dictation`, `/review`, `/leaderboard`, `/roleplay [scenario]`, `/scenario [mood]`, `/story`, `/match`, `/levelup`, `/trivia`, `/wordchain`, `/certificate`. Photos, voice/audio notes and short video clips are also accepted.

## Telegram setup

1. Create the bot with BotFather. Set its username, token, random webhook secret and optionally the Cloud TTS API key in Vercel.
2. Set the webhook URL to `https://YOUR_DOMAIN/api/webhook`, the same `secret_token`, and subscribe to `message` updates. Example:

   ```bash
   curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
     -H 'Content-Type: application/json' \
     -d "{\"url\":\"https://YOUR_DOMAIN/api/webhook\",\"secret_token\":\"${TELEGRAM_WEBHOOK_SECRET}\",\"allowed_updates\":[\"message\"]}"
   ```

3. Check `getWebhookInfo`; test `/start`, placement, `/dictation`, `/review`, and `/certificate` with a test bot.
4. Configure the bot's group privacy/permissions deliberately. Group co-pilot only responds to explicit mentions; never disable privacy mode expecting unsolicited replies.

## Vercel and Firestore

- Import the repository as a Next.js project with root `.` and configure all environment variables in Vercel Project Settings. Never put secrets in `NEXT_PUBLIC_*` or source control.
- Add the exact Vercel domain to Firebase Auth authorized domains. Deploy `firestore.rules` and verify the Admin service-account permissions.
- Configure Firestore TTL deletion on `expiresAt` for `_rate_limits`, `processed_updates`, `link_codes`, `_match_queue`, and `group_games`. TTL is cleanup only; expiry is also checked by application logic where relevant.
- PWA caching is intentionally limited to same-origin static assets and the shell. Authenticated API responses and learner data are not cached; offline lessons are therefore not available.
- The Firestore transaction limiter is suitable as a starter, not a substitute for WAF/edge controls at high scale. Monitor reads/writes, function timeouts, Gemini spend, and quota exhaustion.

## Security and operational boundaries

- Web endpoints verify Firebase ID tokens, validate input, rate-limit actors and keep Gemini, Firebase Admin, Telegram and TTS secrets server-side. Telegram validates the secret-token header in constant time and records `update_id` for duplicate suppression.
- The account-link code is single-use and expires after ten minutes. The mapping is server-only. Users should link only from an authenticated web session; never link by Telegram username alone.
- Media is sent to Gemini for analysis, so add an explicit privacy/consent notice and retention/deletion policy before public launch. Review regional data-protection obligations and age safeguards.
- These services need real Firebase, Telegram, Gemini and (optionally) Cloud TTS credentials; no live integrations can be verified without them. Add emulator-backed integration tests, abuse/load tests, monitoring, a content safety review, and a security assessment before production release.
- Some APIs (Gemini model availability, Telegram Bot API limits, Vercel request-size/runtime limits, Cloud TTS billing) depend on provider project configuration. The media route intentionally caps payloads at 4 MiB. Cloud TTS may incur charges outside its current free quota.

## Validation

```bash
npm run typecheck
npm run build
```
