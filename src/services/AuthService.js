const { AuthenticationError, ValidationError } = require('../utils/errors');

const INVALID_CREDENTIALS = 'Invalid email or password';

/** Single responsibility: verify credentials and tokens. Knows nothing about HTTP or Mongo. */
class AuthService {
  constructor({ userRepository, passwordHasher, tokenService }) {
    this.users = userRepository;
    this.hasher = passwordHasher;
    this.tokens = tokenService;
  }

  async login(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      throw new ValidationError('Email and password are required');
    }
    const record = await this.users.findByEmailWithPassword(email);
    const ok = record ? await this.hasher.compare(password, record.passwordHash) : false;
    if (!ok) throw new AuthenticationError(INVALID_CREDENTIALS);

    const { passwordHash: _hash, ...user } = record;
    const token = this.tokens.sign({ sub: user.id, role: user.role });
    return { token, user };
  }

  async verifyToken(token) {
    if (!token) throw new AuthenticationError('Authentication required');
    let payload;
    try {
      payload = this.tokens.verify(token);
    } catch (err) {
      if (err && err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Session expired. Please log in again.');
      }
      throw new AuthenticationError('Invalid token');
    }
    // Re-read the user so deleted users or changed roles take effect immediately.
    const user = await this.users.findById(payload.sub);
    if (!user) throw new AuthenticationError('Invalid token');
    return { id: user.id, role: user.role, name: user.name, email: user.email };
  }
}

module.exports = { AuthService, INVALID_CREDENTIALS };
