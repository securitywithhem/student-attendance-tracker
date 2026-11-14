// Builds the real app (real container, Mongo repositories) on a seeded in-memory database.
const request = require('supertest');
const { startTestDb, stopTestDb } = require('./db');
const { seedDatabase, DEMO_PASSWORD } = require('../../src/seed/seed');
const { buildContainer } = require('../../src/container');
const { createApp } = require('../../src/app');
const { buildApiRouter } = require('../../src/routes');

async function startTestApp() {
  await startTestDb();
  await seedDatabase({ force: true });
  const container = buildContainer({ jwtSecret: 'integration-secret', jwtExpiresIn: '1h' });
  return createApp({ apiRouter: buildApiRouter(container) });
}

async function login(app, email, password = DEMO_PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status}`);
  return {
    token: res.body.token,
    user: res.body.user,
    auth: { Authorization: `Bearer ${res.body.token}` },
  };
}

module.exports = { startTestApp, stopTestApp: stopTestDb, login, DEMO_PASSWORD };
