// rbac middleware

// Get user role from Clerk metadata
function getUserRole(req) {
  const role = req.auth?.sessionClaims?.publicMetadata?.role || "free";
  // the line above just gets the metadata about a specific user and their role
  // see dashboard.clerk.com for details
  // looks like this (e.g an owner role)
  //
  // {
  //    "role": "owner"
  // }

  return role;
}

// then we check if user has required role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = getUserRole(req);

    if (!req.auth?.userId) {
      return res.status(401).json({ error: "Unauthorized - Please sign in" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Forbidden - Insufficient permissions",
        requiredRole: allowedRoles,
        yourRole: userRole,
      });
    }

    // attatch role to request for later use
    req.userRole = userRole;
    next();
  };
}

// helper functs to Check if user can access premium content
function canAccessPremium(req) {
  const role = getUserRole(req);
  return ["owner", "admin", "premium"].includes(role);
}

// helper functs to Check if user is admin or owner
function isAdmin(req) {
  const role = getUserRole(req);
  return ["owner", "admin"].includes(role);
}

// helper functs to check if user is owner
function isOwner(req) {
  const role = getUserRole(req);
  return role === "owner";
}

export { getUserRole, requireRole, canAccessPremium, isAdmin, isOwner };
