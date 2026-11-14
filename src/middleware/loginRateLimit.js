const { AppError } = require('../utils/errors');

class TooManyRequestsError extends AppError {
  constructor(retryAfterSeconds) {
    super(
      'Too many failed sign-in attempts. Please wait and try again.',
      429,
      'TOO_MANY_REQUESTS',
      {
        retryAfterSeconds,
      }
    );
  }
}

/**
 * Limits failed logins per (client IP, email). Only failures count, and a successful login clears
 * the counter, so one locked account does not block other users on the same network.
 * In-memory: fine for a single-instance prototype (documented in docs/risks.md).
 */
function loginRateLimit({ maxFailures = 10, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const failures = new Map();

  const keyOf = (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${req.ip}|${email}`;
  };

  return (req, res, next) => {
    const key = keyOf(req);
    const entry = failures.get(key);
    if (entry && now() - entry.first > windowMs) failures.delete(key);

    const current = failures.get(key);
    if (current && current.count >= maxFailures) {
      const retry = Math.ceil((current.first + windowMs - now()) / 1000);
      res.set('Retry-After', String(retry));
      return next(new TooManyRequestsError(retry));
    }

    res.on('finish', () => {
      if (res.statusCode === 401) {
        const e = failures.get(key) || { count: 0, first: now() };
        e.count += 1;
        failures.set(key, e);
      } else if (res.statusCode === 200) {
        failures.delete(key);
      }
    });
    return next();
  };
}

module.exports = { loginRateLimit, TooManyRequestsError };
