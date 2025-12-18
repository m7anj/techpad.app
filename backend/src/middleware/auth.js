function getUserRole(req) {
  // handle both old and new clerk api versions
  const auth = typeof req.auth === "function" ? req.auth() : req.auth;
  const role = auth?.sessionClaims?.publicMetadata?.role || "free";
  return role;
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = getUserRole(req);
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;

    if (!auth?.userId) {
      return res.status(401).json({ error: "Unauthorized - Please sign in" });
    }

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
function canAccessPremium(req) {
  const role = getUserRole(req);
  return ["owner", "admin", "premium"].includes(role);
}



// check if user is admin or owner
function isAdmin(req) {
  const role = getUserRole(req);
  return ["owner", "admin"].includes(role);
}



// check if user is owner
function isOwner(req) {
  const role = getUserRole(req);
  return role === "owner";
}



export { getUserRole, requireRole, canAccessPremium, isAdmin, isOwner };
