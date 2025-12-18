# Subscription Expiry & Auto-Downgrade Guide

This document explains how subscription expiration and automatic downgrading works in your application.

## How It Works Now

### Current Implementation: Check on Request

When a user makes a request to protected endpoints (like `/user/me`), the system:

1. **Checks** if their subscription has an end date (`subscriptionEndsAt`)
2. **Compares** it with the current time
3. **Downgrades** them if the subscription has expired

**Flow:**
```
User visits dashboard
    ↓
Frontend calls GET /user/me
    ↓
Backend middleware runs: checkSubscriptionExpiry
    ↓
Checks: subscriptionEndsAt < now()?
    ↓
If YES: Downgrade to free
    ↓
Return user data
```

### When Subscription Expires

**What happens when `subscriptionEndsAt` is reached:**

1. **Database Update** (`/home/manj/techpad.app/backend/src/middleware/checkSubscriptionExpiry.js`):
   ```javascript
   await prisma.user.update({
     where: { clerkUserId },
     data: {
       subscriptionStatus: "expired",
       numberOfInterviewsAllowed: 3,
       subscriptionEndsAt: null,
     },
   });
   ```

2. **Clerk Metadata Update**:
   ```javascript
   await clerkClient.users.updateUser(clerkUserId, {
     publicMetadata: {
       role: "free",
       plan: "free",
       subscriptionStatus: "expired",
       subscriptionEndsAt: null,
     },
   });
   ```

3. **User sees**:
   - Badge changes from "Pro" to "Free"
   - Interview limit goes from unlimited to 3
   - Access to premium features removed

## Setting `subscriptionEndsAt`

### When Payment Completes

The `subscriptionEndsAt` field is set when:

1. **User completes payment** via Stripe
2. **Webhook fires**: `checkout.session.completed`
3. **Subscription retrieved** from Stripe:
   ```javascript
   const subscription = await stripe.subscriptions.retrieve(subscriptionId);
   const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
   ```

4. **Saved to database**:
   ```javascript
   await prisma.user.update({
     where: { clerkUserId },
     data: {
       subscriptionEndsAt: currentPeriodEnd,  // Date one month from now
     },
   });
   ```

### Example

If a user subscribes on **December 18, 2025**, their `subscriptionEndsAt` will be:
- **Monthly**: January 18, 2026
- **Yearly**: December 18, 2026

## Subscription Renewal

### Stripe Auto-Renewal

Stripe handles subscription renewal automatically:

1. **Before expiry**: Stripe attempts to charge the card
2. **If successful**: `customer.subscription.updated` webhook fires
3. **Backend updates**: New `subscriptionEndsAt` date
4. **User stays pro**: No interruption

**Webhook Handler** (`stripeWebhookController.js`):
```javascript
case "customer.subscription.updated": {
  const subscription = event.data.object;
  const updatedPeriodEnd = new Date(subscription.current_period_end * 1000);

  await prisma.user.update({
    where: { clerkUserId: user.id },
    data: {
      subscriptionStatus: subscription.status,
      subscriptionEndsAt: updatedPeriodEnd,  // Extended date
    },
  });
}
```

### If Payment Fails

1. Stripe marks subscription as `past_due`
2. Webhook updates status
3. After grace period (configurable in Stripe), subscription cancels
4. User downgraded to free

## Limitations of Current Approach

### ⚠️ Check-on-Request Limitations

**Problem**: User is only downgraded when they visit the site

**Example**:
- Subscription expires January 18
- User doesn't visit until February 1
- They still have pro access until February 1 (when they first log in)

**Impact**: Minor - most users visit regularly

## Better Approach: Cron Job (Optional)

For production, you should add a scheduled task that runs daily to check for expired subscriptions.

### Option 1: Node-Cron (Simple)

Install:
```bash
npm install node-cron
```

Create `/backend/src/jobs/checkExpiredSubscriptions.js`:
```javascript
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/clerk-sdk-node";

const prisma = new PrismaClient();

// Run every day at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("🔍 Checking for expired subscriptions...");

  const expiredUsers = await prisma.user.findMany({
    where: {
      subscriptionStatus: "active",
      subscriptionEndsAt: {
        lt: new Date(),
      },
    },
  });

  for (const user of expiredUsers) {
    console.log(`⏰ Downgrading expired user: ${user.clerkUserId}`);

    // Downgrade in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "expired",
        numberOfInterviewsAllowed: 3,
        subscriptionEndsAt: null,
      },
    });

    // Downgrade in Clerk
    await clerkClient.users.updateUser(user.clerkUserId, {
      publicMetadata: {
        role: "free",
        plan: "free",
        subscriptionStatus: "expired",
      },
    });
  }

  console.log(`✅ Processed ${expiredUsers.length} expired subscriptions`);
});
```

Add to `server.js`:
```javascript
import "./jobs/checkExpiredSubscriptions.js";
```

### Option 2: External Cron Service

Use services like:
- **Vercel Cron** (if deployed on Vercel)
- **Railway Cron** (if deployed on Railway)
- **GitHub Actions** (scheduled workflows)

Create an endpoint:
```javascript
// backend/src/routes/cronRoutes.js
router.post("/check-expired-subscriptions", async (req, res) => {
  // Verify cron secret
  if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check and downgrade expired users
  const expiredCount = await checkExpiredSubscriptions();

  res.json({ processed: expiredCount });
});
```

Then schedule it to run daily from your hosting platform.

## Testing Expiry

### Manual Test

1. **Subscribe to pro** with test card
2. **Manually update** `subscriptionEndsAt` in database:
   ```sql
   UPDATE "User"
   SET "subscriptionEndsAt" = NOW() - INTERVAL '1 day'
   WHERE "clerkUserId" = 'user_xxx';
   ```

3. **Visit dashboard** or call `/user/me`
4. **Check** that user is downgraded

### Check Logs

You should see:
```
⏰ Subscription expired for user: user_xxx
   Expired at: 2025-01-17T...
✅ User downgraded to free tier due to expired subscription
```

## Stripe Dashboard Monitoring

### Check Subscription Status

1. Go to https://dashboard.stripe.com/subscriptions
2. Filter by status:
   - **Active**: Currently paying
   - **Past Due**: Payment failed, in grace period
   - **Canceled**: Subscription ended
   - **Unpaid**: Payment failed, no grace period

### Subscription Lifecycle

```
Active → Past Due → Canceled
  ↓         ↓          ↓
Renews    Pays    Downgraded
```

## Best Practices

### 1. Email Notifications

Send emails before subscription expires:
- **7 days before**: "Your subscription expires soon"
- **1 day before**: "Last chance to renew"
- **On expiry**: "Your subscription has expired"

### 2. Grace Period

Give users a grace period (3-7 days) after expiry before full downgrade.

### 3. Reactivation Flow

Make it easy for users to reactivate:
- Show "Reactivate" button
- Preserve their data
- Instant upgrade on payment

### 4. Analytics

Track:
- Churn rate (cancellations)
- Reactivation rate
- Average subscription length
- Revenue retention

## Summary

**How subscription expiry works:**

1. ✅ **Payment completed**: `subscriptionEndsAt` set (e.g., Jan 18)
2. ✅ **Auto-renewal**: Stripe extends date each month
3. ✅ **Expiry check**: Middleware checks on each request
4. ✅ **Downgrade**: User reverts to free when expired
5. ✅ **Webhook sync**: Stripe keeps database updated

**Current approach:**
- Simple ✅
- Works for most cases ✅
- No external dependencies ✅
- Small delay before downgrade ⚠️

**Production upgrade:**
- Add cron job for exact timing
- Add email notifications
- Add grace period
- Track analytics

The current implementation is perfectly fine for development and early production. You can add cron jobs later when you have more users!
