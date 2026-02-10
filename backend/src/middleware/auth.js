import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getUserRole(req) {
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;
  const clerkUserId = auth?.userId;
  if (!clerkUserId) return "free";

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { role: true },
  });
  return user?.role || "free";
}

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;

    if (!auth?.userId) {
      return res.status(401).json({ error: "Unauthorized - Please sign in" });
    }

    const userRole = await getUserRole(req);

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden - Insufficient permissions",
        requiredRole: allowedRoles,
        yourRole: userRole,
      });
    }

    // attach role to request for later use
    req.userRole = userRole;
    next();
  };
}

// check if user can access premium content
async function canAccessPremium(req) {
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        role: true,
        subscriptionStatus: true,
      },
    });

    const hasAdminRole = ["owner", "admin"].includes(user?.role);
    const hasActiveSubscription = user?.subscriptionStatus === "active";

    return hasAdminRole || hasActiveSubscription;
  } catch (error) {
    console.error("Error checking premium access:", error);
    return false;
  }
}

// check if user is admin or owner
async function isAdmin(req) {
  const role = await getUserRole(req);
  return ["owner", "admin"].includes(role);
}

// check if user is owner
async function isOwner(req) {
  const role = await getUserRole(req);
  return role === "owner";
}

export { getUserRole, requireRole, canAccessPremium, isAdmin, isOwner };
