const { AuthenticationError, ForbiddenError } = require('../utils/errors');

/** Returns the token from "Authorization: Bearer <jwt>", or null. */
function extractBearerToken(header = '') {
  const match = /^Bearer\s+(\S+)$/.exec(header.trim());
  return match ? match[1] : null;
}

/** Verifies the bearer token and sets req.user = { id, role, name, email }. */
function authenticate(authService) {
  return async (req, _res, next) => {
    try {
      const token = extractBearerToken(req.get('Authorization'));
      if (!token) throw new AuthenticationError('Authentication required');
      req.user = await authService.verifyToken(token);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Coarse role gate for whole route groups; fine-grained checks use AccessPolicy. */
function requireRole(...roles) {
  return (req, _res, next) =>
    roles.includes(req.user && req.user.role) ? next() : next(new ForbiddenError());
}

module.exports = { authenticate, requireRole, extractBearerToken };
