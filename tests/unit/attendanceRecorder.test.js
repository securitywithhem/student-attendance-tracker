// SAT-16 / SAT-20 — duplicate prevention, written before the implementation (TDD red step).
const { AttendanceRecorder } = require('../../src/services/AttendanceRecorder');
const { AttendanceValidator } = require('../../src/services/AttendanceValidator');
const {
  InMemoryCourseRepository,
  InMemoryAttendanceRepository,
} = require('../../src/repositories/memory');
const { DuplicateKeyError } = require('../../src/repositories/errors');
const { ConflictError, ForbiddenError, NotFoundError } = require('../../src/utils/errors');

const faculty = { id: 'f1', role: 'faculty' };
const records = [
  { studentId: 's1', status: 'present' },
  { studentId: 's2', status: 'absent' },
];

function setup({ attendanceRepository } = {}) {
  const courseRepository = new InMemoryCourseRepository([
    { id: 'c1', code: 'CSE706', facultyId: 'f1', studentIds: ['s1', 's2'] },
    { id: 'c2', code: 'CSE701', facultyId: 'f1', studentIds: ['s1', 's2'] },
    { id: 'c3', code: 'CSE705', facultyId: 'f2', studentIds: ['s1', 's2'] },
  ]);
  const attendance = attendanceRepository || new InMemoryAttendanceRepository();
  const recorder = new AttendanceRecorder({
    courseRepository,
    attendanceRepository: attendance,
    validator: new AttendanceValidator({ clock: { today: () => '2026-11-14' } }),
  });
  return { recorder, attendance };
}

describe('AttendanceRecorder.markAttendance', () => {
  test('saves one record per student and returns a summary', async () => {
    const { recorder, attendance } = setup();
    const result = await recorder.markAttendance({
      user: faculty,
      courseId: 'c1',
      date: '2026-11-14',
      records,
    });
    expect(result).toEqual({
      courseId: 'c1',
      date: '2026-11-14',
      saved: 2,
      summary: { present: 1, late: 0, absent: 1 },
    });
    expect(attendance.records).toHaveLength(2);
    expect(attendance.records[0]).toMatchObject({
      courseId: 'c1',
      markedBy: 'f1',
      date: '2026-11-14',
    });
  });

  test('SAT-16 AC1: a second submission for the same course and date is rejected with ConflictError', async () => {
    const { recorder, attendance } = setup();
    await recorder.markAttendance({ user: faculty, courseId: 'c1', date: '2026-11-14', records });
    const second = recorder.markAttendance({
      user: faculty,
      courseId: 'c1',
      date: '2026-11-14',
      records: records.map((r) => ({ ...r, status: 'present' })),
    });
    await expect(second).rejects.toThrow(ConflictError);
    await expect(second).rejects.toThrow(/already recorded/i);
    // nothing changed
    expect(attendance.records).toHaveLength(2);
    expect(attendance.records.find((r) => r.studentId === 's2').status).toBe('absent');
  });

  test('SAT-16 AC2: a race lost at the database (unique index) is also reported as ConflictError', async () => {
    const racing = new InMemoryAttendanceRepository();
    racing.existsForCourseOnDate = async () => false; // the pre-check passes for both requests…
    racing.insertMany = async () => {
      throw new DuplicateKeyError(); // …but the unique index rejects the loser
    };
    const { recorder } = setup({ attendanceRepository: racing });
    await expect(
      recorder.markAttendance({ user: faculty, courseId: 'c1', date: '2026-11-14', records })
    ).rejects.toThrow(ConflictError);
  });

  test('SAT-16 AC3: the same date in a different course is accepted', async () => {
    const { recorder, attendance } = setup();
    await recorder.markAttendance({ user: faculty, courseId: 'c1', date: '2026-11-14', records });
    await recorder.markAttendance({ user: faculty, courseId: 'c2', date: '2026-11-14', records });
    expect(attendance.records).toHaveLength(4);
  });

  test('a different date in the same course is accepted', async () => {
    const { recorder } = setup();
    await recorder.markAttendance({ user: faculty, courseId: 'c1', date: '2026-11-13', records });
    await expect(
      recorder.markAttendance({ user: faculty, courseId: 'c1', date: '2026-11-14', records })
    ).resolves.toHaveProperty('saved', 2);
  });

  test('a faculty member cannot mark a course they do not teach', async () => {
    const { recorder } = setup();
    await expect(
      recorder.markAttendance({ user: faculty, courseId: 'c3', date: '2026-11-14', records })
    ).rejects.toThrow(ForbiddenError);
  });

  test('a student cannot mark attendance', async () => {
    const { recorder } = setup();
    await expect(
      recorder.markAttendance({
        user: { id: 's1', role: 'student' },
        courseId: 'c1',
        date: '2026-11-14',
        records,
      })
    ).rejects.toThrow(ForbiddenError);
  });

  test('an unknown course is NotFound', async () => {
    const { recorder } = setup();
    await expect(
      recorder.markAttendance({ user: faculty, courseId: 'nope', date: '2026-11-14', records })
    ).rejects.toThrow(NotFoundError);
  });
});
