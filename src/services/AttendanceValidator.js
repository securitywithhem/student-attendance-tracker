const { ValidationError } = require('../utils/errors');
const { STATUSES } = require('../models/Attendance');
const { systemClock } = require('../utils/clock');

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for a real calendar date written as YYYY-MM-DD. */
function isCalendarDate(value) {
  const m = typeof value === 'string' && DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toISOString().slice(0, 10) === value;
}

/** Single responsibility: decide whether a marking request is acceptable. No I/O. */
class AttendanceValidator {
  constructor({ clock = systemClock, statuses = STATUSES } = {}) {
    this.clock = clock;
    this.statuses = statuses;
  }

  validate({ date, records } = {}, course) {
    if (!isCalendarDate(date))
      throw new ValidationError('date must be a valid date in YYYY-MM-DD format');
    if (date > this.clock.today())
      throw new ValidationError('Attendance cannot be marked for a future date');
    if (!Array.isArray(records) || records.length === 0) {
      throw new ValidationError('records must contain at least one student');
    }

    const enrolled = new Set(course.studentIds);
    const seen = new Set();
    const normalised = records.map((r, i) => {
      const studentId = r && typeof r.studentId === 'string' ? r.studentId : null;
      const status = r && typeof r.status === 'string' ? r.status.trim().toLowerCase() : null;
      if (!studentId) throw new ValidationError(`records[${i}].studentId is required`);
      if (!this.statuses.includes(status)) {
        throw new ValidationError(
          `records[${i}].status must be one of: ${this.statuses.join(', ')}`
        );
      }
      if (!enrolled.has(studentId)) {
        throw new ValidationError(`Student ${studentId} is not enrolled in this course`);
      }
      if (seen.has(studentId))
        throw new ValidationError(`Student ${studentId} appears more than once`);
      seen.add(studentId);
      return { studentId, status };
    });

    const missing = course.studentIds.filter((id) => !seen.has(id));
    if (missing.length) {
      throw new ValidationError(`Missing status for ${missing.length} enrolled student(s)`, {
        missing,
      });
    }
    return { date, records: normalised };
  }
}

module.exports = { AttendanceValidator, isCalendarDate };
