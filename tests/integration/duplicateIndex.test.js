// SAT-16 AC2 against a real MongoDB: concurrent submissions cannot create duplicate records.
const { startTestDb, stopTestDb } = require('../helpers/db');
const { seedDatabase } = require('../../src/seed/seed');
const { MongoCourseRepository } = require('../../src/repositories/mongo/MongoCourseRepository');
const {
  MongoAttendanceRepository,
} = require('../../src/repositories/mongo/MongoAttendanceRepository');
const { MongoUserRepository } = require('../../src/repositories/mongo/MongoUserRepository');
const { DuplicateKeyError } = require('../../src/repositories/errors');
const { AttendanceRecorder } = require('../../src/services/AttendanceRecorder');
const { AttendanceValidator } = require('../../src/services/AttendanceValidator');
const { ConflictError } = require('../../src/utils/errors');
const { Attendance } = require('../../src/models/Attendance');

let course;
let faculty;
const courses = new MongoCourseRepository();
const attendance = new MongoAttendanceRepository();

beforeAll(async () => {
  await startTestDb();
  await seedDatabase({ force: true });
  faculty = await new MongoUserRepository().findByEmailWithPassword('faculty1@sat.edu');
  course = (await courses.findByFaculty(faculty.id)).find((c) => c.code === 'CSE706');
});
afterAll(stopTestDb);

const register = () => course.studentIds.map((studentId) => ({ studentId, status: 'present' }));

test('the repository maps a unique-index violation to DuplicateKeyError', async () => {
  const rows = register().map((r) => ({
    ...r,
    courseId: course.id,
    date: '2026-11-02',
    markedBy: faculty.id,
  }));
  await attendance.insertMany(rows);
  await expect(attendance.insertMany(rows.slice(0, 1))).rejects.toThrow(DuplicateKeyError);
});

test('two simultaneous submissions: exactly one succeeds, the other gets ConflictError', async () => {
  const recorder = new AttendanceRecorder({
    courseRepository: courses,
    attendanceRepository: attendance,
    validator: new AttendanceValidator({ clock: { today: () => '2026-11-14' } }),
  });
  const user = { id: faculty.id, role: 'faculty' };
  const submit = () =>
    recorder.markAttendance({ user, courseId: course.id, date: '2026-11-03', records: register() });

  const results = await Promise.allSettled([submit(), submit()]);
  const ok = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');

  expect(ok).toHaveLength(1);
  expect(failed).toHaveLength(1);
  expect(failed[0].reason).toBeInstanceOf(ConflictError);
  expect(await Attendance.countDocuments({ course: course.id, date: '2026-11-03' })).toBe(
    course.studentIds.length
  );
});

test('review fix: a malformed course id is NotFound, not a database CastError (500)', async () => {
  const { NotFoundError } = require('../../src/utils/errors');
  const recorder = new AttendanceRecorder({
    courseRepository: courses,
    attendanceRepository: attendance,
    validator: new AttendanceValidator({ clock: { today: () => '2026-11-14' } }),
  });
  await expect(
    recorder.markAttendance({
      user: { id: faculty.id, role: 'faculty' },
      courseId: 'nope',
      date: '2026-11-04',
      records: register(),
    })
  ).rejects.toThrow(NotFoundError);
});
