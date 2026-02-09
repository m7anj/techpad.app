# CLAUDE.md — TechPad AI Interview Platform

> **What is TechPad?** An AI-powered technical interview practice platform. Users browse interview presets (DSA, system design, behavioral, etc.), then enter a real-time voice-based interview session with an AI interviewer. The AI asks questions via text-to-speech, the user responds via microphone (speech-to-text), and can write code or draw on a whiteboard during the session. After the interview, the AI scores the performance across three dimensions and provides detailed feedback.

---

## Quick Reference

| Item | Detail |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite (port 5173 prod / 3000 dev) |
| **Backend** | Express 5 + express-ws, plain JS (ES modules) (port 4000) |
| **Database** | PostgreSQL on Supabase, Prisma ORM |
| **Auth** | Clerk (SSO, JWT, session management) |
| **Payments** | Stripe (subscriptions + webhooks) |
| **AI / LLM** | Groq API — multiple models (see AI Models section) |
| **Speech** | Speechmatics (TTS via HTTP, STT via WebSocket), browser TTS fallback |
| **Audio Transcription** | Groq Whisper (`whisper-large-v3-turbo`) |
| **Deployment** | Frontend on Vercel, Backend on Render |
| **Start Dev** | `./dev.sh` (runs both servers) or manually: `cd backend && npm run dev` + `cd frontend && npm run dev` |

---

## Project Structure

```
techpad.app/
├── CLAUDE.md                          # This file
├── README.md                          # Project overview
├── SPEECHMATICS_MIGRATION.md          # Docs on STT/TTS migration
├── TODO.txt                           # Feature roadmap / priorities
├── dev.sh                             # Starts both dev servers concurrently
│
├── backend/                           # Express API server (plain JS, ES modules)
│   ├── .env                           # Backend secrets (DO NOT COMMIT)
│   ├── .env.example                   # Template for backend env vars
│   ├── package.json                   # "type": "module", scripts: dev/start/build/db:*
│   ├── prisma/
│   │   └── schema.prisma             # Database schema (4 models)
│   └── src/
│       ├── server.js                  # Express app setup, middleware, route mounting
│       ├── controllers/               # HTTP request handlers
│       │   ├── interviewController.js
│       │   ├── exploreController.js
│       │   ├── userController.js
│       │   ├── checkoutController.js
│       │   ├── stripeWebhookController.js
│       │   ├── webhookController.js   # Clerk webhooks
│       │   ├── leaderboardController.js
│       │   └── myInterviewsController.js
│       ├── services/                  # Business logic / data access
│       │   ├── interviewService.js    # Session lifecycle, scoring
│       │   ├── exploreService.js      # Interview preset queries
│       │   ├── userService.js         # Exports prisma client (mostly deprecated)
│       │   └── myInterviewsService.js # Completed interview CRUD
│       ├── lib/                       # AI integrations & utilities
│       │   ├── questions.js           # AI question generation
│       │   ├── score.js               # AI scoring engine
│       │   ├── followups.js           # AI follow-up generation (with vision)
│       │   ├── clarification.js       # Clarification detection & generation
│       │   ├── speechmatics.js        # TTS (HTTP) + STT (WebSocket proxy)
│       │   ├── transcribe.js          # Groq Whisper audio transcription
│       │   └── speechToText.js        # UNUSED/EMPTY placeholder
│       ├── middleware/
│       │   ├── auth.js                # Role checks, premium access verification
│       │   ├── checkSubscriptionExpiry.js  # Auto-downgrade expired subs
│       │   └── requireProSubscription.js   # Gate routes behind pro sub
│       └── routes/
│           ├── interviewRoutes.js     # POST /create (HTTP)
│           ├── interviewSessionRoutes.js  # WS /interview/:token (THE CORE)
│           ├── speechmaticsRoutes.js   # POST /tts + WS /stt
│           ├── exploreRoutes.js       # GET / and /:id
│           ├── userRoutes.js          # GET /me, /profile/:username
│           ├── checkoutRoutes.js      # POST /create-session
│           ├── webhookRoutes.js       # POST /clerk, /stripe
│           ├── leaderboardRoutes.js   # GET /
│           ├── myInterviewsRoutes.js  # GET /
│           ├── pricingRoutes.js       # GET / (placeholder)
│           └── proFeaturesRoutes.js   # Subscription management
│
├── frontend/                          # React SPA
│   ├── .env                           # Frontend env vars (VITE_ prefixed)
│   ├── .env.example
│   ├── index.html                     # SPA entry point
│   ├── package.json
│   ├── vite.config.ts                 # Dev port 3000, proxy /api -> localhost:5000
│   ├── vercel.json                    # SPA rewrites for Vercel
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx                   # React root: ClerkProvider + BrowserRouter + CacheProvider
│       ├── App.tsx                    # Route definitions, auth gating, username check
│       ├── components/
│       │   ├── Navbar.tsx             # Main nav bar (fetches user data, shows role badges)
│       │   ├── UserDropdown.tsx       # Avatar dropdown menu
│       │   ├── UpgradeModal.tsx       # "Upgrade to Pro" modal (premium/limit reasons)
│       │   ├── UsernameSetup.tsx      # Forces new users to set username
│       │   ├── Whiteboard.tsx         # Canvas drawing with perfect-freehand
│       │   └── Logo/                  # Reusable logo component
│       ├── pages/
│       │   ├── landing/LandingPage.tsx    # Public marketing page
│       │   ├── dashboard/Dashboard.tsx    # Interview browser + start flow
│       │   ├── interview/Interview.tsx    # THE CORE: live interview session
│       │   ├── results/InterviewResults.tsx  # Single result view
│       │   ├── myInterviews/MyInterviews.tsx # Interview history list
│       │   ├── payment/Payment.tsx        # Pricing page + Stripe checkout
│       │   ├── payment/PaymentSuccess.tsx # Post-payment confirmation
│       │   ├── profile/UserProfile.tsx    # User profile + heatmap + sub management
│       │   ├── leaderboard/Leaderboard.tsx # Top 25 ELO rankings
│       │   ├── contribution/Contribution.tsx # Placeholder "coming soon"
│       │   └── feedback/Feedback.tsx      # Placeholder "coming soon"
│       ├── contexts/
│       │   └── CacheContext.tsx        # In-memory session cache (no TTL)
│       ├── services/
│       │   └── interviewWebSocket.ts  # WS client class (LEGACY - not used by Interview.tsx)
│       ├── lib/
│       │   ├── api.ts                 # apiUrl() and wsUrl() helpers
│       │   └── speechmatics.ts        # AudioRecorder class + textToSpeech()
│       ├── utils/
│       │   └── format.ts             # formatTime(seconds) -> "MM:SS"
│       └── styles/
│           ├── globals.css            # Design system, CSS vars, resets
│           ├── shared-layout.css      # page-wrapper layout pattern
│           └── components/clerk.css   # Clerk component overrides
```

---

## Environment Variables

### Backend (`backend/.env`)
```bash
DATABASE_URL="postgresql://..."          # Supabase PostgreSQL connection string
CLERK_SECRET_KEY="sk_test_..."           # Clerk backend secret
CLERK_PUBLISHABLE_KEY="pk_test_..."      # Clerk publishable key
CLERK_WEBHOOK_SECRET="whsec_..."         # Svix webhook verification
GROQ_API_KEY="gsk_..."                   # Groq API for all LLM + Whisper calls
SPEECHMATICS_API_KEY="..."               # Speechmatics TTS/STT
STRIPE_SECRET_KEY="sk_test_..."          # Stripe backend
STRIPE_PUBLISHABLE_KEY="pk_test_..."     # Stripe publishable
STRIPE_WEBHOOK_SECRET="whsec_..."        # Stripe webhook signature verification
PORT=4000                                # Server port
NODE_ENV=production                      # or "development"
FRONTEND_URL=https://techpad.app         # For CORS + Stripe redirect URLs
```

### Frontend (`frontend/.env`)
```bash
VITE_CLERK_PUBLISHABLE_KEY="pk_test_..." # Clerk frontend auth
VITE_API_BASE_URL="http://localhost:4000" # Backend URL (or production URL)
```

---

## Database Schema (Prisma)

**File:** `backend/prisma/schema.prisma`

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| clerkUserId | String | Unique, indexed |
| email | String? | |
| username | String? | Unique |
| elo | Int | Default 200 |
| numberOfInterviewsAllowed | Int | Default 3 (free), 999999 (pro) |
| subscriptionStatus | String | "free", "active", "cancelling", "expired" |
| stripeCustomerId | String? | Unique |
| stripeSubscriptionId | String? | Unique |
| subscriptionEndsAt | DateTime? | |

### Interview (presets/catalog)
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| type | String | e.g., "DSA", "System Design" |
| topic | String? | Specific topic |
| description | String | |
| expectedDuration | Int | Minutes |
| prompt | String | AI system prompt for question generation |
| difficulty | String | "Easy", "Medium", "Hard" |
| premium | Boolean | Default false |
| tags | String[] | Array of tags for filtering |

### completedInterview
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| interviewId | String | FK to Interview |
| clerkUserId | String | Indexed |
| timeTaken | Int | Seconds |
| score | Float? | Overall score 0-100 |
| feedback | Json? | `{ breakdown: { technical, problemSolving, communication }, strengths[], gaps[], improvement[] }` |
| completedAt | DateTime | |

### InterviewSession
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| clerkUserId | String | Indexed |
| interviewId | String | |
| sessionToken | String | Unique UUID, used as WebSocket auth |
| expiresAt | DateTime | 3 hours from creation |
| isActive | Boolean | Default true |

---

## AI Models Used (all via Groq SDK)

| Purpose | Model | Temperature | File |
|---|---|---|---|
| Question generation | `openai/gpt-oss-120b` | 0.8 | `lib/questions.js` |
| Interview scoring | `llama-3.3-70b-versatile` | 0.3 | `lib/score.js` |
| Follow-up generation | `meta-llama/llama-4-scout-17b-16e-instruct` | 0.5 | `lib/followups.js` |
| Clarification generation | `meta-llama/llama-4-scout-17b-16e-instruct` | 0.3 | `lib/clarification.js` |
| Audio transcription | `whisper-large-v3-turbo` | N/A | `lib/transcribe.js` |

---

## Core User Flows

### 1. Authentication & Onboarding
```
Visitor -> LandingPage -> Clerk SignIn/SignUp modal -> Clerk webhook fires ->
webhookController creates DB user (3 free interviews) -> App.tsx checks username ->
UsernameSetup (if no username) -> Dashboard
```

### 2. Starting an Interview
```
Dashboard loads presets from GET /explore -> User clicks preset -> Preview modal ->
"Start Interview" button -> POST /interview-session/create (gets sessionToken) ->
Navigate to /interview/:sessionToken
```

**Gating checks before start:**
- Premium interview + free user → UpgradeModal (reason: "premium")
- 0 interviews remaining + free user → UpgradeModal (reason: "limit")

### 3. Live Interview Session (the core feature)
```
Interview.tsx mounts -> WebSocket connects to ws://.../interview/:sessionToken ->
Backend validates session -> Generates 4 questions via AI (cached 30min) ->
Sends first question + TTS audio

For each question:
  1. Frontend plays TTS audio (or browser speech fallback)
  2. After TTS ends, microphone recording starts automatically
  3. User speaks their answer (+ optionally writes code / draws on whiteboard)
  4. User clicks Send button -> audio recorded as blob -> converted to base64
  5. Sent via WebSocket: { type: "questionAnswer", audio, audioMimeType, code, whiteboard }
  6. Backend transcribes audio via Groq Whisper
  7. Backend checks: is this a clarifying question? (keyword heuristics)
     - If yes: generate clarification, send back, DON'T advance
     - If no: store answer, generate follow-up via AI
  8. Follow-up sent with TTS audio -> cycle repeats
  9. After max 2 follow-ups per question OR AI says "isThisTheEnd" -> next question

After all questions:
  Backend scores via AI -> saves completedInterview to DB ->
  sends { type: "interviewComplete", resultId } -> frontend navigates to /results/:id
```

### 4. Scoring System
**Formula:** `Overall = (Technical x 0.35) + (Problem-Solving x 0.40) + (Communication x 0.25)`

**Penalty rules:**
- Under 2 minutes total → max score 20
- Under 50% questions answered → max score 40
- Under 30% completion → max score 35

**Feedback structure:**
```json
{
  "overallScore": 75,
  "breakdown": {
    "technical": 80,
    "problemSolving": 70,
    "communication": 75
  },
  "strengths": ["..."],
  "gaps": ["..."],
  "improvement": ["..."]
}
```

### 5. Payment / Subscription Flow
```
Free user hits limit or premium gate -> UpgradeModal -> Navigate to /pricing ->
Payment.tsx shows plans -> "Get Started" -> POST /checkout/create-session ->
Redirect to Stripe Checkout -> Payment completes ->
Stripe webhook fires checkout.session.completed ->
stripeWebhookController upgrades user: DB + Clerk metadata ->
Redirect to /payment/success -> auto-redirect to /dashboard
```

**Subscription states:** `"free"` → `"active"` → `"cancelling"` → `"expired"` / `"free"`

**Tier limits:**
- Free: 3 interviews (`numberOfInterviewsAllowed: 3`)
- Pro: unlimited (`numberOfInterviewsAllowed: 999999`)

### 6. ELO / Leaderboard
- Users start at ELO 200
- Leaderboard shows top 25 users by ELO (must have username set)
- Profile page shows rank badge based on ELO thresholds:
  - Grandmaster: 2000+, Master: 1700+, Expert: 1400+, Advanced: 1100+, Intermediate: 850+, Beginner: 550+

---

## Backend API Endpoints

### HTTP Routes
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/explore` | No | List all interview presets |
| GET | `/explore/:id` | No | Get single preset |
| GET | `/user/me` | Yes | Current user data + subscription |
| GET | `/user/profile/:username` | No | Public user profile |
| POST | `/interview-session/create` | Yes | Create session, get token |
| POST | `/checkout/create-session` | Yes | Create Stripe checkout |
| GET | `/myInterviews` | Yes | User's completed interviews |
| GET | `/leaderboard` | No | Top 25 by ELO |
| GET | `/pro/subscription-status` | Yes | Subscription details |
| POST | `/pro/cancel-subscription` | Yes | Cancel at period end |
| POST | `/pro/reactivate-subscription` | Yes | Undo cancellation |
| POST | `/api/speechmatics/tts` | No | Text-to-speech (returns MP3) |
| POST | `/webhooks/clerk` | Svix | Clerk user.created/updated events |
| POST | `/webhooks/stripe` | Stripe sig | Stripe subscription events |

### WebSocket Routes
| Path | Description |
|---|---|
| `/interview/:sessionToken` | Live interview session (the main feature) |
| `/api/speechmatics/stt` | Real-time speech-to-text proxy to Speechmatics |

---

## Frontend Routes

| Path | Component | Auth | Description |
|---|---|---|---|
| `/` | LandingPage (signed out) / Dashboard (signed in) | Mixed | |
| `/dashboard` | Dashboard | Yes | Interview browser |
| `/interview/:id` | Interview | Yes | Live interview session |
| `/results/:id` | InterviewResults | Yes | Single result view |
| `/pricing` | Payment | Mixed | Pricing page |
| `/payment/success` | PaymentSuccess | Yes | Post-checkout |
| `/u/:username` | UserProfile | Yes | User profile |
| `/leaderboard` | Leaderboard | Yes | Rankings |
| `/contribution` | Contribution | Yes | Placeholder |
| `/feedback` | Feedback | Yes | Placeholder |

---

## Styling & Design System

### Theme
- **Dark mode only** — background `#0a0a0f`, surfaces with `rgba(255,255,255,0.03-0.08)`
- **Primary color** — purple `#8b5cf6` (Tailwind violet-500)
- **Glassmorphism** — semi-transparent surfaces + `backdrop-filter: blur(20px)`
- **Font** — Inter (UI), JetBrains Mono (code)

### CSS Architecture
- **No CSS framework** — plain CSS with CSS custom properties
- `globals.css` — design system variables, resets, button system, typography
- `shared-layout.css` — `.page-wrapper` layout pattern (used by most pages)
- `animated.css` — animation utility classes (landing page)
- Each page/component has a co-located `.css` file
- Clerk components themed via JS object in `main.tsx`

### Key CSS Variables (defined in `globals.css :root`)
```css
--primary: #8b5cf6;
--primary-hover: #a78bfa;
--accent: #06b6d4;
--background: #0a0a0f;
--background-secondary: #111117;
--surface: rgba(255, 255, 255, 0.03);
--surface-hover: rgba(255, 255, 255, 0.06);
--text: #e2e8f0;
--text-secondary: #94a3b8;
--text-muted: #64748b;
--border: rgba(255, 255, 255, 0.08);
--border-hover: rgba(255, 255, 255, 0.15);
```

### Responsive Breakpoints
- 1024px — tablet (interview page stacks to single column)
- 768px — mobile (nav collapses, features hide)
- 480px — small mobile (further simplification)

---

## Key Architecture Decisions & Patterns

### Data Flow Pattern
```
Routes → Controllers → Services → Lib (AI/APIs)
                                 → Prisma (Database)
```

### Subscription Source of Truth
The **database is the source of truth** for subscription status, NOT Clerk metadata. Both are written to on subscription changes (dual-write), but reads should come from the DB. The `checkSubscriptionExpiry` middleware acts as a safety net to auto-downgrade if a Stripe webhook was missed.

### Caching
- **Backend:** In-memory question cache (30min TTL) in `interviewSessionRoutes.js`
- **Backend:** Active interview sessions stored in an in-memory `Map` (lost on restart)
- **Frontend:** `CacheContext` — session-only React state cache (no TTL, no persistence)

### Authentication Flow
1. Clerk handles all auth (JWT tokens)
2. Backend uses `clerkMiddleware()` globally
3. Protected routes access `req.auth.userId` (or `req.auth().userId` in newer Clerk versions)
4. The code handles both old and new Clerk API versions with `typeof req.auth === "function"` checks

### WebSocket Interview Protocol
Messages from server:
- `{ type: "question", question, audio?, resetEditor? }`
- `{ type: "followup", followup: { question }, audio? }`
- `{ type: "interviewComplete", resultId }`
- `{ type: "error", message }`
- `{ type: "clarification", clarification }`

Messages from client:
- `{ type: "questionAnswer", audio, audioMimeType, code?, whiteboard? }`
- `{ type: "followupAnswer", audio, audioMimeType, code?, whiteboard? }`
- `"ping"` (heartbeat, server responds with `"pong"`)

---

## Known Issues & Gotchas

### Backend
1. **`interviewSessionRoutes.js`** — Active sessions are in an in-memory `Map`. Server restart = all active interviews lost.
2. **`stripeWebhookController.js`** — `subscription.updated` and `subscription.deleted` handlers iterate ALL Clerk users to find matching `stripeCustomerId`. Will not scale.
3. **`auth.js:canAccessPremium()`** — Creates and disconnects a new PrismaClient on every call. Should use the shared instance.
4. **`questions.js`** — No retry logic if AI returns invalid JSON from `JSON.parse`.
5. **`followups.js`** — Same JSON parsing vulnerability as questions.
6. **`myInterviewsService.js:addCompletedInterview()`** — Accepts `questionAnswers` param but silently discards it (only score/feedback are saved).
7. **`speechToText.js`** — Empty file, unused placeholder.
8. **`proFeaturesRoutes.js`** — Creates a redundant PrismaClient via dynamic import when one already exists at module scope.
9. **Webhook routes** must be registered BEFORE `express.json()` middleware (they need raw body for signature verification). This is correctly done in `server.js`.

### Frontend
1. **`services/interviewWebSocket.ts`** — Has hardcoded `ws://localhost:3000` URL. This file appears to be LEGACY and is NOT used by `Interview.tsx` (which creates its own WebSocket inline).
2. **`vite.config.ts`** — Dev proxy sends `/api` to port 5000, but backend runs on port 4000. The proxy may not be actively used since `apiUrl()` constructs full URLs from `VITE_API_BASE_URL`.
3. **`CacheContext`** — `getCache` returns `cache[key] || null`, treating falsy values (`0`, `""`, `false`) as cache misses.
4. **`globals.css`** — `user-select: none` on `body` prevents ALL text selection app-wide.
5. **`Whiteboard.tsx`** — Only handles mouse events, not touch. No mobile/tablet drawing support.
6. **`Payment.tsx`** — Stripe price IDs are hardcoded in frontend source.
7. **`Payment.tsx`** — Checks `user.publicMetadata.plan` (Clerk) while Navbar checks DB-stored subscription. Potential inconsistency.
8. **`UserProfile.tsx`** — `openClerkProfile()` links to `accounts.clerk.dev/user` which may not work in production.
9. **`Dashboard.tsx quotes.ts`** — Contains edgy/profane motivational quotes (intentional brand voice).

---

## Common Debugging Scenarios

### "Interview won't start"
1. Check if session creation succeeds: `POST /interview-session/create`
2. Check WebSocket connection: does `ws://host/interview/:token` connect?
3. Check `InterviewSession` in DB: is it active and not expired?
4. Check `numberOfInterviewsAllowed > 0` for the user
5. If premium interview: check `subscriptionStatus === "active"` in DB

### "No audio / TTS not working"
1. Check `SPEECHMATICS_API_KEY` in backend `.env`
2. Check `POST /api/speechmatics/tts` returns audio
3. Frontend falls back to browser `SpeechSynthesis` if Speechmatics fails
4. Check browser console for audio playback errors (autoplay policy)

### "STT / transcription not working"
1. User audio is recorded client-side via `MediaRecorder` → sent as base64 via WebSocket
2. Backend transcribes via Groq Whisper (`lib/transcribe.js`), NOT Speechmatics STT
3. Check `GROQ_API_KEY` is valid
4. Check audio blob size is > 0 (frontend logs `📤 Audio recorded, size: X bytes`)

### "Score not generated / results missing"
1. `closeInterview()` in `interviewService.js` generates the score
2. Check Groq API response from `lib/score.js`
3. Score requires conversation data — if no answers recorded, scoring may fail
4. `addCompletedInterview` returns null on error (doesn't throw)

### "Subscription not updating after payment"
1. Check Stripe webhook delivery in Stripe dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` matches
3. Check `stripeWebhookController.js` logs for the `checkout.session.completed` event
4. Verify both DB and Clerk metadata were updated
5. Check `checkSubscriptionExpiry` middleware isn't auto-downgrading

### "User stuck on UsernameSetup"
1. `App.tsx` checks `user.username` — if null, shows `UsernameSetup`
2. `UsernameSetup` calls `user.update({ username })` via Clerk SDK
3. Has a 1-second delay workaround for Clerk sync — may not be enough on slow connections

---

## Development Commands

```bash
# Start both servers
./dev.sh

# Backend only
cd backend && npm run dev          # nodemon auto-restart

# Frontend only
cd frontend && npm run dev         # Vite HMR on port 3000

# Database
cd backend && npx prisma studio    # Visual DB browser
cd backend && npx prisma db push   # Push schema changes
cd backend && npx prisma generate  # Regenerate Prisma client

# Build
cd frontend && npm run build       # TypeScript check + Vite build -> dist/
```

---

## Deployment

- **Frontend:** Vercel (auto-deploys from git, `vercel.json` handles SPA rewrites)
- **Backend:** Render (runs `node src/server.js`)
- **Database:** Supabase PostgreSQL
- **Production URLs:** `techpad.app` (frontend), backend on Render subdomain
- **CORS:** Production allows `techpad-app.vercel.app`, `techpad.app`, `www.techpad.app`, and `FRONTEND_URL` env var
