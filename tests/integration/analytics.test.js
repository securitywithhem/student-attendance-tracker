// SAT-1 dashboard API, SAT-2 history filters, SAT-3 levels, SAT-5 faculty summary, data isolation.
// Written before the routes. Expected numbers are computed from the database, not hard-coded.
const request = require('supertest');
const { startTestApp, stopTestApp, login } = require('../helpers/app');
const { Attendance } = require('../../src/models/Attendance');
const { Course } = require('../../src/models/Course');
const { User } = require('../../src/models/User');

let app;
let s01;
let s02;
let s04;
let cse706;
let cse705;

const pct = (attended, total) => Math.round((attended / total) * 1000) / 10;

async function expectedFor(studentId, courseId) {
  const rows = await Attendance.find({ student: studentId, course: courseId }).lean();
  const attended = rows.filter((r) => r.status !== 'absent').length;
  return { attended, total: rows.length, percentage: pct(attended, rows.length) };
}

beforeAll(async () => {
  app = await startTestApp();
  s01 = await login(app, 'student01@sat.edu');
  s02 = await login(app, 'student02@sat.edu');
  s04 = await login(app, 'student04@sat.edu');
  cse706 = await Course.findOne({ code: 'CSE706' }).lean();
  cse705 = await Course.findOne({ code: 'CSE705' }).lean();
});
afterAll(stopTestApp);

describe('GET /api/students/:id/summary (SAT-1, SAT-3)', () => {
  test('AC1: per-course attended/total/percentage and an overall figure', async () => {
    const res = await request(app).get(`/api/students/${s01.user.id}/summary`).set(s01.auth);
    expect(res.status).toBe(200);
    expect(res.body.threshold).toBe(75);
    expect(res.body.courses.map((c) => c.course.code)).toEqual(['CSE701', 'CSE706']);

    const row = res.body.courses.find((c) => c.course.code === 'CSE706');
    const expected = await expectedFor(s01.user.id, cse706._id);
    expect(row).toMatchObject(expected);
    expect(['ok', 'warning', 'critical']).toContain(row.level);

    const all = await Attendance.find({ student: s01.user.id }).lean();
    const attended = all.filter((r) => r.status !== 'absent').length;
    expect(res.body.overall).toMatchObject({
      attended,
      total: all.length,
      percentage: pct(attended, all.length),
    });
  });

  test('SAT-3 AC1: a student below 75% gets a warning or critical level and sessions-to-recover', async () => {
    const res = await request(app).get(`/api/students/${s04.user.id}/summary`).set(s04.auth);
    const low = res.body.courses.filter((c) => c.percentage < 75);
    expect(low.length).toBeGreaterThan(0);
    for (const c of low) {
      expect(['warning', 'critical']).toContain(c.level);
      expect(c.sessionsToThreshold).toBeGreaterThan(0);
      expect(c.level).toBe(c.percentage >= 65 ? 'warning' : 'critical');
    }
  });

  test('data isolation: a student gets 403 for another student', async () => {
    const res = await request(app).get(`/api/students/${s02.user.id}/summary`).set(s01.auth);
    expect(res.status).toBe(403);
  });

  test('faculty can view a student in their course; not one outside it', async () => {
    const f2 = await login(app, 'faculty2@sat.edu'); // teaches CSE705 = students 03..10
    expect(
      (await request(app).get(`/api/students/${s04.user.id}/summary`).set(f2.auth)).status
    ).toBe(200);
    expect(
      (await request(app).get(`/api/students/${s01.user.id}/summary`).set(f2.auth)).status
    ).toBe(403);
  });

  test('404 for an id that is not a student', async () => {
    const admin = await login(app, 'admin@sat.edu');
    const f1 = await User.findOne({ email: 'faculty1@sat.edu' }).lean();
    expect((await request(app).get(`/api/students/${f1._id}/summary`).set(admin.auth)).status).toBe(
      404
    );
  });
});

describe('GET /api/students/:id/history (SAT-2)', () => {
  const history = (auth, id, query) =>
    request(app).get(`/api/students/${id}/history`).query(query).set(auth);

  test('returns all records newest first with course info', async () => {
    const res = await history(s01.auth, s01.user.id, {});
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(await Attendance.countDocuments({ student: s01.user.id }));
    const dates = res.body.records.map((r) => r.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(res.body.records[0].course).toEqual(
      expect.objectContaining({ code: expect.any(String) })
    );
  });

  test('AC1: filters by course, status and date range together', async () => {
    const res = await history(s04.auth, s04.user.id, {
      courseId: String(cse706._id),
      status: 'absent',
      from: '2026-09-14',
      to: '2026-10-09',
    });
    expect(res.status).toBe(200);
    const expected = await Attendance.countDocuments({
      student: s04.user.id,
      course: cse706._id,
      status: 'absent',
      date: { $gte: '2026-09-14', $lte: '2026-10-09' },
    });
    expect(res.body.count).toBe(expected);
    for (const r of res.body.records) {
      expect(r).toMatchObject({ status: 'absent', course: { code: 'CSE706' } });
      expect(r.date >= '2026-09-14' && r.date <= '2026-10-09').toBe(true);
    }
  });

  test('AC2: 400 when from is after to', async () => {
    const res = await history(s01.auth, s01.user.id, { from: '2026-10-10', to: '2026-10-01' });
    expect(res.status).toBe(400);
  });

  test.each([[{ status: 'sick' }], [{ from: '10-10-2026' }], [{ courseId: 'abc' }]])(
    '400 for invalid filter %p',
    async (query) => {
      expect((await history(s01.auth, s01.user.id, query)).status).toBe(400);
    }
  );

  test('data isolation: 403 for another student’s history', async () => {
    expect((await history(s01.auth, s02.user.id, {})).status).toBe(403);
  });
});

describe('GET /api/courses/:id/summary (SAT-5)', () => {
  test('AC1: per-student figures, sessions held and count below threshold', async () => {
    const f1 = await login(app, 'faculty1@sat.edu');
    const res = await request(app).get(`/api/courses/${cse706._id}/summary`).set(f1.auth);
    expect(res.status).toBe(200);
    expect(res.body.course.code).toBe('CSE706');
    expect(res.body.sessionsHeld).toBe(20);
    expect(res.body.students).toHaveLength(10);

    const first = res.body.students.find((s) => s.student.email === 'student01@sat.edu');
    expect(first).toMatchObject(await expectedFor(first.student.id, cse706._id));
    expect(res.body.belowThreshold).toBe(res.body.students.filter((s) => s.percentage < 75).length);
    expect(res.body.belowThreshold).toBeGreaterThan(0);
  });

  test('403 for a student and for faculty who do not teach the course', async () => {
    const f1 = await login(app, 'faculty1@sat.edu');
    expect(
      (await request(app).get(`/api/courses/${cse706._id}/summary`).set(s01.auth)).status
    ).toBe(403);
    expect((await request(app).get(`/api/courses/${cse705._id}/summary`).set(f1.auth)).status).toBe(
      403
    );
  });
});

describe('GET /api/admin/overview', () => {
  test('admin sees totals and every course', async () => {
    const admin = await login(app, 'admin@sat.edu');
    const res = await request(app).get('/api/admin/overview').set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual({ admin: 1, faculty: 2, student: 10 });
    expect(res.body.sessions).toBe(60);
    expect(res.body.courses).toHaveLength(3);
  });

  test('403 for faculty and students', async () => {
    const f1 = await login(app, 'faculty1@sat.edu');
    expect((await request(app).get('/api/admin/overview').set(f1.auth)).status).toBe(403);
    expect((await request(app).get('/api/admin/overview').set(s01.auth)).status).toBe(403);
  });
});
