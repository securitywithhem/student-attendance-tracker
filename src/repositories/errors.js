/** Raised by a repository when a unique constraint rejects a write. */
class DuplicateKeyError extends Error {
  constructor(message = 'Duplicate record') {
    super(message);
    this.name = 'DuplicateKeyError';
  }
}

module.exports = { DuplicateKeyError };
