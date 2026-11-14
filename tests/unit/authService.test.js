// SAT-15 / SAT-20 — written before the implementation (TDD red step).
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AuthService } = require('../../src/services/AuthService');
const { JwtTokenService } = require('../../src/services/JwtTokenService');
const { BcryptPasswordHasher } = require('../../src/services/BcryptPasswordHasher');
const { InMemoryUserRepository } = require('../../src/repositories/memory');
const { AuthenticationError, ValidationError } = require('../../src/utils/errors');

const SECRET = 'unit-test-secret';

async function makeService() {
  const passwordHash = await bcrypt.hash('Correct@123', 4);
  const userRepository = new InMemoryUserRepository([
    { id: 'u1', name: 'Dr. Test', email: 'faculty@sat.edu', role: 'faculty', passwordHash },
  ]);
  const tokenService = new JwtTokenService({ secret: SECRET, expiresIn: '1h' });
  return new AuthService({
    userRepository,
    passwordHasher: new BcryptPasswordHasher(),
    tokenService,
  });
}

describe('AuthService.login (SAT-15)', () => {
  test('AC1: valid credentials return a signed JWT and the public profile', async () => {
    const auth = await makeService();
    const { token, user } = await auth.login('faculty@sat.edu', 'Correct@123');

    expect(user).toEqual({
      id: 'u1',
      name: 'Dr. Test',
      email: 'faculty@sat.edu',
      role: 'faculty',
      rollNo: null,
    });
    expect(user.passwordHash).toBeUndefined();
    const payload = jwt.verify(token, SECRET);
    expect(payload).toMatchObject({ sub: 'u1', role: 'faculty' });
  });

  test('email matching is case-insensitive and trims spaces', async () => {
    const auth = await makeService();
    await expect(auth.login('  FACULTY@sat.edu ', 'Correct@123')).resolves.toHaveProperty('token');
  });

  test('AC2: wrong password is rejected with a generic message', async () => {
    const auth = await makeService();
    await expect(auth.login('faculty@sat.edu', 'wrong')).rejects.toThrow(AuthenticationError);
    await expect(auth.login('faculty@sat.edu', 'wrong')).rejects.toThrow(
      'Invalid email or password'
    );
  });

  test('AC2: unknown email gets the same generic message as a wrong password', async () => {
    const auth = await makeService();
    await expect(auth.login('nobody@sat.edu', 'Correct@123')).rejects.toThrow(
      'Invalid email or password'
    );
  });

  test.each([
    [undefined, 'x'],
    ['faculty@sat.edu', undefined],
    ['', ''],
    [{ $gt: '' }, 'x'],
  ])(
    'missing or non-string credentials (%p, %p) are a validation error',
    async (email, password) => {
      const auth = await makeService();
      await expect(auth.login(email, password)).rejects.toThrow(ValidationError);
    }
  );
});

describe('AuthService.verifyToken (SAT-15)', () => {
  test('a token issued by login verifies to the user identity', async () => {
    const auth = await makeService();
    const { token } = await auth.login('faculty@sat.edu', 'Correct@123');
    await expect(auth.verifyToken(token)).resolves.toEqual({
      id: 'u1',
      role: 'faculty',
      name: 'Dr. Test',
      email: 'faculty@sat.edu',
    });
  });

  test('AC3: a missing token is rejected', async () => {
    const auth = await makeService();
    await expect(auth.verifyToken(undefined)).rejects.toThrow(AuthenticationError);
  });

  test('AC3: a tampered token is rejected', async () => {
    const auth = await makeService();
    const { token } = await auth.login('faculty@sat.edu', 'Correct@123');
    const forged = jwt.sign({ sub: 'u1', role: 'admin' }, 'some-other-secret');
    await expect(auth.verifyToken(`${token}x`)).rejects.toThrow(AuthenticationError);
    await expect(auth.verifyToken(forged)).rejects.toThrow(AuthenticationError);
  });

  test('AC3: an expired token is rejected', async () => {
    const auth = await makeService();
    const expired = jwt.sign(
      { sub: 'u1', role: 'faculty', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET
    );
    await expect(auth.verifyToken(expired)).rejects.toThrow('Session expired');
  });

  test('a token for a user that no longer exists is rejected', async () => {
    const auth = await makeService();
    const ghost = jwt.sign({ sub: 'deleted-user', role: 'student' }, SECRET);
    await expect(auth.verifyToken(ghost)).rejects.toThrow(AuthenticationError);
  });
});
