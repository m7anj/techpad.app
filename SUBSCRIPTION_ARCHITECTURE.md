# Subscription Architecture - Best Practices

This document explains how subscription/membership verification works in this application and why it's implemented this way.

## Overview

**The Golden Rule**: Never trust the client. Always verify on the backend.

## Architecture Components

### 1. **Supabase (PostgreSQL) - Source of Truth**
- Contains the definitive subscription status for each user
- Updated by Stripe webhooks (server-to-server, secure)
- Cannot be tampered with by users

### 2. **Clerk Metadata - UI Display Cache**
- Stores subscription info in `publicMetadata` for quick access
- Used ONLY for displaying UI elements (badges, feature hints)
- Should NEVER be trusted for access control
- Synced from Supabase via webhooks

### 3. **Backend Verification - Access Control**
- All premium features protected by `requireProSubscription` middleware
- Checks Supabase database for actual subscription status
- Prevents unauthorized access even if client claims to be pro

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER SUBSCRIBES                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Stripe Processes Payment                   │
│  - Charges card                                             │
│  - Creates subscription                                     │
│  - Sends webhook to your server                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Your Backend Receives Webhook                     │
│  - Verifies webhook signature (security)                   │
│  - Updates Supabase (SOURCE OF TRUTH)                      │
│  - Updates Clerk metadata (UI DISPLAY CACHE)              │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    ▼               ▼
        ┌──────────────────┐   ┌──────────────────┐
        │    Supabase      │   │  Clerk Metadata  │
        │  (Database)      │   │    (Cache)       │
        │                  │   │                  │
        │  subscriptionS.. │   │  publicMetadata  │
        │  numberOfInterv..│   │  { role: "pro" } │
        │  subscriptionE.. │   │                  │
        └──────────────────┘   └──────────────────┘
                    │                   │
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐   ┌──────────────────┐
        │ Backend Verifies │   │  Frontend Shows  │
        │  Access Control  │   │   Pro Badge      │
        │                  │   │                  │
        │ ✓ Authoritative  │   │ ✗ Display Only   │
        │ ✓ Secure         │   │ ✗ Can be faked   │
        │ ✓ Can't be faked │   │ ✓ Fast           │
        └──────────────────┘   └──────────────────┘
```

## Why This Matters

### ❌ WRONG: Trusting Client-Side Data

```typescript
// NEVER DO THIS - Insecure!
const { user } = useUser();
const isPro = user?.publicMetadata?.role === "pro";

if (isPro) {
  // Call API to access premium feature
  fetch("/api/premium-feature"); // ❌ Anyone can call this!
}
```

**Problem**: A malicious user can:
1. Open browser DevTools
2. Modify the Clerk user object in memory
3. Change `publicMetadata.role` to "pro"
4. Access premium features without paying

### ✅ CORRECT: Backend Verification

```typescript
// Frontend - OK for UI display
const { user } = useUser();
const isPro = user?.publicMetadata?.role === "pro";

// Show/hide UI elements based on metadata
{isPro && <ProBadge />}
```

```javascript
// Backend - REQUIRED for access control
app.get("/api/premium-feature",
  requireAuth(),
  requireProSubscription,  // ✓ Checks database
  (req, res) => {
    // User is verified to have active subscription
    // Safe to provide premium feature
  }
);
```

## Implementation Guide

### 1. Frontend: Display Only

**File**: `frontend/src/components/Navbar.tsx`

```typescript
import { useUser } from "@clerk/clerk-react";

export function Navbar() {
  const { user } = useUser();

  // Use Clerk metadata ONLY for UI display
  const subscriptionPlan = user?.publicMetadata?.plan;
  const subscriptionStatus = user?.publicMetadata?.subscriptionStatus;
  const isProMember =
    subscriptionPlan?.includes('pro') &&
    subscriptionStatus === 'active';

  return (
    <nav>
      {isProMember && <ProBadge />}
    </nav>
  );
}
```

### 2. Backend: Verification Middleware

**File**: `backend/src/middleware/requireProSubscription.js`

```javascript
import { PrismaClient } from "@prisma/client";

export async function requireProSubscription(req, res, next) {
  const { userId: clerkUserId } = req.auth;

  // Check DATABASE (source of truth)
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { subscriptionStatus: true },
  });

  if (user?.subscriptionStatus !== "active") {
    return res.status(403).json({
      error: "Pro subscription required"
    });
  }

  next(); // User is verified pro member
}
```

### 3. Using the Middleware

**File**: `backend/src/routes/proFeaturesRoutes.js`

```javascript
import { requireProSubscription } from "../middleware/requireProSubscription.js";

// Protect premium endpoints
router.get("/premium-feature",
  requireAuth(),              // Step 1: Verify user is logged in
  requireProSubscription,     // Step 2: Verify user has active subscription
  (req, res) => {
    // This only runs if user has active pro subscription
    res.json({ premium: "data" });
  }
);
```

## Database Schema

**File**: `backend/prisma/schema.prisma`

```prisma
model User {
  id                        String    @id @default(uuid())
  clerkUserId               String    @unique
  email                     String?
  numberOfInterviewsAllowed Int       @default(3)
  subscriptionStatus        String    @default("free")
  stripeCustomerId          String?   @unique
  stripeSubscriptionId      String?   @unique
  subscriptionEndsAt        DateTime?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt

  @@index([clerkUserId])
  @@index([stripeCustomerId])
}
```

**Key Fields**:
- `subscriptionStatus`: "free", "active", "cancelled", "past_due"
- `numberOfInterviewsAllowed`: 3 for free, 999999 for pro
- `subscriptionEndsAt`: When the current period ends
- `stripeCustomerId`: Reference to Stripe customer
- `stripeSubscriptionId`: Reference to Stripe subscription

## Webhook Synchronization

When Stripe webhooks fire, both Clerk and Supabase are updated:

**File**: `backend/src/controllers/stripeWebhookController.js`

```javascript
case "checkout.session.completed": {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Update Clerk (for UI display)
  await clerkClient.users.updateUser(clerkUserId, {
    publicMetadata: {
      role: "pro",
      subscriptionStatus: "active",
      subscriptionEndsAt: currentPeriodEnd.toISOString(),
    },
  });

  // Update Supabase (source of truth for access control)
  await prisma.user.update({
    where: { clerkUserId },
    data: {
      subscriptionStatus: "active",
      numberOfInterviewsAllowed: 999999,
      subscriptionEndsAt: currentPeriodEnd,
    },
  });
}
```

## Testing Access Control

### Test 1: Free User Tries Premium Feature

```bash
# As a free user, try to access premium endpoint
curl -H "Authorization: Bearer $FREE_USER_TOKEN" \
  http://localhost:4000/pro/premium-feature

# Expected: 403 Forbidden
{
  "error": "Pro subscription required",
  "message": "This feature requires an active Pro subscription"
}
```

### Test 2: Pro User Accesses Premium Feature

```bash
# As a pro user, access premium endpoint
curl -H "Authorization: Bearer $PRO_USER_TOKEN" \
  http://localhost:4000/pro/premium-feature

# Expected: 200 OK
{
  "message": "Welcome to the premium feature!",
  "subscription": {
    "status": "active",
    "interviewsAllowed": 999999
  }
}
```

## Security Checklist

- [x] Stripe webhooks verify signature (prevents fake webhooks)
- [x] Supabase is the source of truth (can't be modified by users)
- [x] Backend checks database for all premium features
- [x] Clerk metadata used ONLY for UI display
- [x] JWT tokens verify user identity
- [x] Middleware prevents unauthorized access
- [x] All sensitive operations happen server-side

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Only Checking Frontend
```typescript
// INSECURE - Anyone can bypass this
if (user?.publicMetadata?.role === "pro") {
  showPremiumFeature();
}
```

### ❌ Pitfall 2: Trusting Request Body
```javascript
// INSECURE - User can send isPro: true in body
app.post("/premium-feature", (req, res) => {
  if (req.body.isPro) {  // ❌ Never trust client data!
    // ...
  }
});
```

### ❌ Pitfall 3: Not Verifying Webhooks
```javascript
// INSECURE - Attacker can send fake webhooks
app.post("/webhooks/stripe", (req, res) => {
  // No signature verification ❌
  const event = req.body;
  // ... process event (could be fake!)
});
```

### ✅ Correct Approach
```javascript
// SECURE - Verify webhook signature
const sig = req.headers["stripe-signature"];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  webhookSecret
);
// Now we know it's from Stripe ✓
```

## Industry Best Practices

This implementation follows industry standards:

1. **Defense in Depth**: Multiple layers of security
2. **Zero Trust**: Never trust client-side data
3. **Server-Side Verification**: All access control on backend
4. **Source of Truth**: Database is authoritative
5. **Webhook Security**: Signature verification
6. **Separation of Concerns**: UI display ≠ access control

## Further Reading

- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Clerk Security Features](https://clerk.com/docs/security)

## Summary

**For UI Display** (Fast, convenient):
- ✓ Use Clerk `publicMetadata`
- ✓ Show/hide UI elements
- ✓ Display badges, hints, etc.

**For Access Control** (Secure, authoritative):
- ✓ Check Supabase database
- ✓ Use backend middleware
- ✓ Verify on every request
- ✓ Never trust the client

Remember: **UI display is for convenience, backend verification is for security.**
