const { AuthenticationError, ForbiddenError } = require('../utils/errors');

/** Reads "Authorization: Bearer <jwt>", verifies it, and sets req.user. */
function authenticate(authService) {
  return async (req, _res, next) => {
    try {
      const header = req.get('Authorization') || '';
      const [scheme, token] = header.split(' ');
      if (scheme !== 'Bearer' || !token) throw new AuthenticationError('Authentication required');
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

module.exports = { authenticate, requireRole };
