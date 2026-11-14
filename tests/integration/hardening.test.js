// SAT-7 — query performance and error hardening.
const express = require('express');
const request = require('supertest');
const { Types } = require('mongoose');
const { startTestApp, stopTestApp, login } = require('../helpers/app');
const { createApp } = require('../../src/app');
const { Attendance } = require('../../src/models/Attendance');

let app;
beforeAll(async () => {
  app = await startTestApp();
});
afterAll(stopTestApp);

/** Walks a MongoDB explain plan and collects every stage name. */
function stages(plan, out = []) {
  if (!plan || typeof plan !== 'object') return out;
  if (plan.stage) out.push(plan.stage);
  for (const v of Object.values(plan)) {
    if (Array.isArray(v)) v.forEach((x) => stages(x, out));
    else if (v && typeof v === 'object') stages(v, out);
  }
  return out;
}

describe('AC1: frequent queries use indexes (no collection scans)', () => {
  const someId = () => new Types.ObjectId();

  test.each([
    ['student history', () => Attendance.find({ student: someId() }).sort({ date: -1 })],
    [
      'course + date duplicate check',
      () => Attendance.find({ course: someId(), date: '2026-10-01' }),
    ],
    ['course summary', () => Attendance.find({ course: someId() })],
    [
      'student history with filters',
      () =>
        Attendance.find({
          student: someId(),
          course: someId(),
          date: { $gte: '2026-09-01', $lte: '2026-10-01' },
        }).sort({ date: -1 }),
    ],
  ])('%s uses an index', async (_label, query) => {
    const plan = await query().explain('queryPlanner');
    const s = stages(plan.queryPlanner.winningPlan);
    expect(s).toContain('IXSCAN');
    expect(s).not.toContain('COLLSCAN');
  });

  test('required indexes exist', async () => {
    const keys = (await Attendance.collection.indexes()).map((i) => JSON.stringify(i.key));
    expect(keys).toEqual(
      expect.arrayContaining([
        JSON.stringify({ course: 1, student: 1, date: 1 }),
        JSON.stringify({ student: 1, date: -1 }),
        JSON.stringify({ course: 1, date: 1 }),
      ])
    );
  });
});

describe('AC2: safe error responses', () => {
  test('malformed student id → 400', async () => {
    const { auth } = await login(app, 'admin@sat.edu');
    const res = await request(app).get('/api/students/123/summary').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('unknown API route → JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('unexpected server error → JSON 500 without stack trace or internals', async () => {
    const boom = express.Router();
    boom.get('/boom', async () => {
      throw new Error('secret database detail at /srv/app.js:42');
    });
    const res = await request(createApp({ apiRouter: boom })).get('/api/boom');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/secret|stack|\.js/);
  });

  test('oversized request body → 413 JSON, not a crash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.c', password: 'x'.repeat(200 * 1024) }));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  test('security headers are set and x-powered-by is hidden', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('repeated failed logins are rate limited (429)', async () => {
    let last;
    for (let i = 0; i < 12; i += 1) {
      last = await request(app)
        .post('/api/auth/login')
        .send({ email: 'brute@sat.edu', password: `guess${i}` });
    }
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('TOO_MANY_REQUESTS');
    // a different account from the same client is not locked out
    const other = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sat.edu', password: 'Password@123' });
    expect(other.status).toBe(200);
  });
});
