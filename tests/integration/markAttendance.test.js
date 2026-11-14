// SAT-14 marking API, SAT-16 duplicate 409 over HTTP, SAT-18 role checks (written before the routes).
const request = require('supertest');
const { startTestApp, stopTestApp, login } = require('../helpers/app');

let app;
let faculty1;
let course706;
let course705;
let roster;

const today = new Date().toLocaleDateString('en-CA');
const register = (status = 'present') => roster.map((s) => ({ studentId: s.id, status }));

beforeAll(async () => {
  app = await startTestApp();
  faculty1 = await login(app, 'faculty1@sat.edu');
  const admin = await login(app, 'admin@sat.edu');
  const all = (await request(app).get('/api/courses').set(admin.auth)).body.courses;
  course706 = all.find((c) => c.code === 'CSE706');
  course705 = all.find((c) => c.code === 'CSE705');
  roster = (await request(app).get(`/api/courses/${course706.id}/roster`).set(faculty1.auth)).body
    .students;
});
afterAll(stopTestApp);

const mark = (auth, courseId, body) =>
  request(app).post(`/api/courses/${courseId}/attendance`).set(auth).send(body);

describe('POST /api/courses/:id/attendance (SAT-14)', () => {
  test('AC1: 201 with the saved count and summary', async () => {
    const records = register();
    records[0].status = 'absent';
    records[1].status = 'late';
    const res = await mark(faculty1.auth, course706.id, { date: today, records });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      saved: 10,
      date: today,
      summary: { present: 8, late: 1, absent: 1 },
    });
  });

  test('the saved session can be read back for that date', async () => {
    const res = await request(app)
      .get(`/api/courses/${course706.id}/attendance`)
      .query({ date: today })
      .set(faculty1.auth);
    expect(res.status).toBe(200);
    expect(res.body.marked).toBe(true);
    expect(res.body.records).toHaveLength(10);
    expect(res.body.records[0]).toMatchObject({
      student: { rollNo: '22CSE001' },
      status: 'absent',
    });
  });

  test('a date with no session reports marked: false', async () => {
    const res = await request(app)
      .get(`/api/courses/${course706.id}/attendance`)
      .query({ date: '2026-08-03' })
      .set(faculty1.auth);
    expect(res.body).toEqual({ date: '2026-08-03', marked: false, records: [] });
  });

  test('SAT-16 AC1: resubmitting the same course and date returns 409 and changes nothing', async () => {
    const res = await mark(faculty1.auth, course706.id, {
      date: today,
      records: register('present'),
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    const after = await request(app)
      .get(`/api/courses/${course706.id}/attendance`)
      .query({ date: today })
      .set(faculty1.auth);
    expect(after.body.records.filter((r) => r.status === 'absent')).toHaveLength(1);
  });

  test.each([
    ['missing date', () => ({ records: register() })],
    ['future date', () => ({ date: '2999-01-01', records: register() })],
    ['bad status', () => ({ date: '2026-08-04', records: register('sick') })],
    ['empty list', () => ({ date: '2026-08-04', records: [] })],
    ['incomplete register', () => ({ date: '2026-08-04', records: register().slice(1) })],
  ])('AC2: 400 for %s', async (_label, body) => {
    const res = await mark(faculty1.auth, course706.id, body());
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Role checks over HTTP (SAT-18)', () => {
  test('AC1: a student gets 403 when marking attendance', async () => {
    const student = await login(app, 'student01@sat.edu');
    const res = await mark(student.auth, course706.id, { date: '2026-08-05', records: register() });
    expect(res.status).toBe(403);
  });

  test('AC2: faculty get 403 marking a course they do not teach', async () => {
    const res = await mark(faculty1.auth, course705.id, { date: '2026-08-05', records: [] });
    expect(res.status).toBe(403);
  });

  test('AC1: a student gets 403 reading the course roster or a session', async () => {
    const student = await login(app, 'student01@sat.edu');
    expect(
      (await request(app).get(`/api/courses/${course706.id}/roster`).set(student.auth)).status
    ).toBe(403);
    expect(
      (
        await request(app)
          .get(`/api/courses/${course706.id}/attendance`)
          .query({ date: today })
          .set(student.auth)
      ).status
    ).toBe(403);
  });

  test('admins can read any roster but cannot mark', async () => {
    const admin = await login(app, 'admin@sat.edu');
    expect(
      (await request(app).get(`/api/courses/${course705.id}/roster`).set(admin.auth)).status
    ).toBe(200);
    expect((await mark(admin.auth, course705.id, { date: '2026-08-05', records: [] })).status).toBe(
      403
    );
  });
});
