// ─── src/middleware/auth.js ───────────────────────────────────────────────────
const jwt = require("jsonwebtoken");
const config = require("../config");

// Verify access token — attaches req.user = { id, username, email }
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Optional auth — attaches user if token present, doesn't block if missing
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.split(" ")[1], config.jwt.secret);
    } catch (_) {}
  }
  next();
}

// Sign a new pair of tokens
function signTokens(payload) {
  const access = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refresh = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpires,
  });
  return { access, refresh };
}

// Verify refresh token
function verifyRefresh(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = { requireAuth, optionalAuth, signTokens, verifyRefresh };
