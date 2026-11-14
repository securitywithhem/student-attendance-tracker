const jwt = require('jsonwebtoken');

class JwtTokenService {
  constructor({ secret, expiresIn }) {
    if (!secret) throw new Error('JWT secret is required');
    this.secret = secret;
    this.expiresIn = expiresIn;
  }
  sign(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn, algorithm: 'HS256' });
  }
  /** Throws jsonwebtoken errors (TokenExpiredError, JsonWebTokenError) on failure. */
  verify(token) {
    return jwt.verify(token, this.secret, { algorithms: ['HS256'] });
  }
}

module.exports = { JwtTokenService };
