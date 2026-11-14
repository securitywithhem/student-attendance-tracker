const { startTestDb, stopTestDb } = require('../helpers/db');
const { seedDatabase, sessionDates } = require('../../src/seed/seed');
const { User } = require('../../src/models/User');
const { Course } = require('../../src/models/Course');
const { Attendance } = require('../../src/models/Attendance');

beforeAll(startTestDb);
afterAll(stopTestDb);

describe('SAT-17 academic models and seed data', () => {
  test('AC1: seeds 1 admin, 2 faculty, 10 students, 3 courses and 20 sessions per course', async () => {
    const result = await seedDatabase({ force: true });
    expect(result.sessions).toBe(60);
    expect(await User.countDocuments({ role: 'admin' })).toBe(1);
    expect(await User.countDocuments({ role: 'faculty' })).toBe(2);
    expect(await User.countDocuments({ role: 'student' })).toBe(10);
    expect(await Course.countDocuments()).toBe(3);
    // CSE706: 10 students, CSE701: 8, CSE705: 8 → (10 + 8 + 8) × 20 sessions
    expect(await Attendance.countDocuments()).toBe(520);
  });

  test('seeding is skipped when data already exists', async () => {
    expect(await seedDatabase()).toEqual({ skipped: true });
  });

  test('AC2: unique index on (course, student, date) exists', async () => {
    const indexes = await Attendance.collection.indexes();
    const unique = indexes.find((i) => i.unique);
    expect(unique.key).toEqual({ course: 1, student: 1, date: 1 });
  });

  test('sessionDates only returns the requested weekdays', () => {
    const dates = sessionDates('2026-09-07', 3, [1]); // Mondays
    expect(dates).toEqual(['2026-09-07', '2026-09-14', '2026-09-21']);
  });
});
