// SAT-12 course listing and SAT-13 roster — HTTP tests (written before the routes).
const request = require('supertest');
const { startTestApp, stopTestApp, login } = require('../helpers/app');

let app;
beforeAll(async () => {
  app = await startTestApp();
});
afterAll(stopTestApp);

describe('GET /api/courses (SAT-12)', () => {
  test('AC1: faculty see only the courses they teach, with enrolled counts', async () => {
    const { auth } = await login(app, 'faculty1@sat.edu');
    const res = await request(app).get('/api/courses').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.courses.map((c) => c.code)).toEqual(['CSE701', 'CSE706']);
    expect(res.body.courses.find((c) => c.code === 'CSE706')).toMatchObject({
      name: 'Agile Software Development',
      studentCount: 10,
      sessionsHeld: 20,
    });
  });

  test('AC2: students see only the courses they are enrolled in', async () => {
    const { auth } = await login(app, 'student01@sat.edu');
    const res = await request(app).get('/api/courses').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.courses.map((c) => c.code)).toEqual(['CSE701', 'CSE706']);
  });

  test('admins see every course', async () => {
    const { auth } = await login(app, 'admin@sat.edu');
    const res = await request(app).get('/api/courses').set(auth);
    expect(res.body.courses).toHaveLength(3);
  });

  test('401 without a token', async () => {
    expect((await request(app).get('/api/courses')).status).toBe(401);
  });
});

describe('GET /api/courses/:id/roster (SAT-13)', () => {
  test('AC1: lists enrolled students sorted by roll number', async () => {
    const { auth } = await login(app, 'faculty1@sat.edu');
    const { body } = await request(app).get('/api/courses').set(auth);
    const cse706 = body.courses.find((c) => c.code === 'CSE706');
    const res = await request(app).get(`/api/courses/${cse706.id}/roster`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.course.code).toBe('CSE706');
    expect(res.body.students).toHaveLength(10);
    expect(res.body.students[0]).toEqual({
      id: expect.any(String),
      name: 'Aarav Shah',
      email: 'student01@sat.edu',
      rollNo: '22CSE001',
      role: 'student',
    });
    const rolls = res.body.students.map((s) => s.rollNo);
    expect(rolls).toEqual([...rolls].sort());
  });

  test('AC2: 403 for a course the faculty member does not teach', async () => {
    const admin = await login(app, 'admin@sat.edu');
    const all = (await request(app).get('/api/courses').set(admin.auth)).body.courses;
    const cse705 = all.find((c) => c.code === 'CSE705'); // taught by faculty2
    const { auth } = await login(app, 'faculty1@sat.edu');
    expect((await request(app).get(`/api/courses/${cse705.id}/roster`).set(auth)).status).toBe(403);
  });

  test('400 for a malformed course id, 404 for an unknown one', async () => {
    const { auth } = await login(app, 'faculty1@sat.edu');
    expect((await request(app).get('/api/courses/not-an-id/roster').set(auth)).status).toBe(400);
    expect(
      (await request(app).get('/api/courses/65a000000000000000000000/roster').set(auth)).status
    ).toBe(404);
  });
});
