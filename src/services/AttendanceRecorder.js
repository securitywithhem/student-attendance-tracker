const { policyFor } = require('../policies/AccessPolicy');
const { DuplicateKeyError } = require('../repositories/errors');
const { ConflictError, ForbiddenError, NotFoundError } = require('../utils/errors');

const ALREADY_RECORDED = 'Attendance already recorded for this course on this date';

/**
 * Faculty write side (Interface Segregation: marking is separate from reading).
 * Duplicate prevention has two layers: a pre-check for a clear 409, and the database unique index
 * (course, student, date) for the race where two submissions pass the pre-check at the same time.
 */
class AttendanceRecorder {
  constructor({ courseRepository, attendanceRepository, validator }) {
    this.courses = courseRepository;
    this.attendance = attendanceRepository;
    this.validator = validator;
  }

  async markAttendance({ user, courseId, date, records }) {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');
    if (!policyFor(user).canMarkAttendance(course)) {
      throw new ForbiddenError(
        'Only the faculty member who teaches this course can mark attendance'
      );
    }

    const valid = this.validator.validate({ date, records }, course);

    if (await this.attendance.existsForCourseOnDate(course.id, valid.date)) {
      throw new ConflictError(ALREADY_RECORDED, { courseId: course.id, date: valid.date });
    }

    try {
      await this.attendance.insertMany(
        valid.records.map((r) => ({
          ...r,
          courseId: course.id,
          date: valid.date,
          markedBy: user.id,
        }))
      );
    } catch (err) {
      if (err instanceof DuplicateKeyError) {
        throw new ConflictError(ALREADY_RECORDED, { courseId: course.id, date: valid.date });
      }
      throw err;
    }

    const summary = this.validator.emptyCounts();
    for (const r of valid.records) summary[r.status] += 1;
    return { courseId: course.id, date: valid.date, saved: valid.records.length, summary };
  }
}

module.exports = { AttendanceRecorder, ALREADY_RECORDED };
