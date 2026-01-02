# TechPad

AI-powered technical interview platform with real-time voice conversations, multi-modal response tools (code editor, whiteboard, webcam), and automated scoring with detailed feedback.

## Architecture

**Full-stack TypeScript application with WebSocket-based real-time communication:**
- **Frontend**: React 19 + Vite (port 5173)
- **Backend**: Express 5 + express-ws (port 4000)
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: Groq API (LLaMA 3.3-70B), ElevenLabs TTS
- **Auth**: Clerk (SSO + session management)
- **Payments**: Stripe (subscriptions + webhooks)

## Technical Implementation

### Interview System
- Interview presets stored in Postgres with difficulty levels (Easy/Medium/Hard)
- Free tier: 3 interviews, Pro tier: unlimited (enforced server-side)
- Premium interviews gated behind pro subscription
- Question caching (30min TTL) to reduce AI API calls

### Real-Time Interview Flow (WebSocket)
1. Backend generates 3-5 contextual questions via Groq based on topic/difficulty/tags
2. Questions converted to speech via ElevenLabs TTS, sent as base64 over WebSocket
3. User responds via Web Speech API (voice) or text input
4. AI detects clarification vs answers, provides follow-ups without advancing interview
5. After all questions answered, Groq analyzes full conversation for scoring

### Multi-Modal Tools
- **Monaco Editor**: Syntax-highlighted code editing during interview
- **Whiteboard**: Canvas-based drawing with perfect-freehand library
- **Webcam**: Live video feed (react-webcam)
- **Voice**: Bidirectional speech-to-text and text-to-speech

### AI Scoring Engine
Weighted scoring across 3 dimensions:
- Technical Knowledge (35%)
- Problem-Solving (40%)
- Communication (25%)

Formula: `Overall = (Tech × 0.35) + (ProbSolve × 0.40) + (Comm × 0.25)`

Provides evidence-based feedback extracted from conversation history. Harsh penalties for incomplete interviews.

### Subscription System
**Stripe Integration:**
- Checkout sessions with monthly/yearly plans
- Webhook handlers for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Upgrades set `numberOfInterviewsAllowed` to 999999, downgrades reset to 3
- Subscription metadata synced between Clerk and Postgres (DB is source of truth)

**Interview Limit Enforcement:**
- Middleware checks `numberOfInterviewsAllowed` before creating session
- Modal blocks free users at limit, redirects to pricing page
- Decremented after each completed interview

### Security
- Session tokens (random UUID) for WebSocket auth, 3hr expiry
- Stripe webhook signature verification
- Helmet.js security headers
- Rate limiting: 100 req/15min per IP
- Clerk JWT validation on protected routes

### Database Schema
**Key Models:**
- `User`: clerkUserId, email, numberOfInterviewsAllowed, subscriptionStatus, stripeCustomerId
- `Interview`: type, topic, difficulty, premium flag, tags, prompt
- `completedInterview`: score, feedback (JSON), messages[], timeTaken
- `InterviewSession`: sessionToken, clerkUserId, interviewId, expiresAt, isActive

## Features

- ✅ Real-time voice interviews with adaptive AI questioning
- ✅ Code editor, whiteboard, webcam during interviews
- ✅ Automated scoring with dimensional breakdown
- ✅ Interview history with searchable feedback
- ✅ Stripe subscriptions (monthly/yearly)
- ✅ Free tier (3 interviews) + Pro tier (unlimited)
- ✅ Webhook-driven subscription lifecycle
- ✅ Premium interview content for pro users

## Tech Stack

**Frontend:**
- React 19, TypeScript, React Router
- Monaco Editor, perfect-freehand
- Radix UI, Framer Motion
- Clerk React, Web Speech API

**Backend:**
- Express 5, express-ws (WebSocket)
- Prisma (PostgreSQL ORM)
- Groq SDK (LLaMA 3.3-70B)
- ElevenLabs API (TTS)
- Stripe SDK
- Clerk Backend SDK

**Infrastructure:**
- PostgreSQL database
- WebSocket connections for real-time AI interaction
- Stripe webhooks for subscription automation
