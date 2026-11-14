// SAT-15 — HTTP behaviour of login and token checks (written before the routes).
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { startTestApp, stopTestApp, login, DEMO_PASSWORD } = require('../helpers/app');

let app;
beforeAll(async () => {
  app = await startTestApp();
});
afterAll(stopTestApp);

describe('POST /api/auth/login', () => {
  test('AC1: 200 with token and profile for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty1@sat.edu', password: DEMO_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ email: 'faculty1@sat.edu', role: 'faculty' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('AC2: 401 with a generic message for a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty1@sat.edu', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('AC2: 401 with the same message for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@sat.edu', password: DEMO_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('400 for a NoSQL-injection style body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });

  test('400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  test('returns the logged-in user', async () => {
    const { auth } = await login(app, 'student01@sat.edu');
    const res = await request(app).get('/api/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ email: 'student01@sat.edu', role: 'student' });
  });

  test('AC3: 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('AC3: 401 with a token signed by another secret', async () => {
    const forged = jwt.sign({ sub: 'x', role: 'admin' }, 'not-the-secret');
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('AC3: 401 with a malformed Authorization header', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Token abc');
    expect(res.status).toBe(401);
  });
});
