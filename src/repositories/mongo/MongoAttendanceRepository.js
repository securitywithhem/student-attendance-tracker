const { Types } = require('mongoose');
const { Attendance } = require('../../models/Attendance');
const { DuplicateKeyError } = require('../errors');
const { toAttendance } = require('./mappers');

const oid = (id) => new Types.ObjectId(String(id));

const countStages = (groupKey) => [
  {
    $group: {
      _id: groupKey,
      present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
      late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
      absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
      total: { $sum: 1 },
    },
  },
];

class MongoAttendanceRepository {
  async existsForCourseOnDate(courseId, date) {
    return Boolean(await Attendance.exists({ course: oid(courseId), date }));
  }

  async insertMany(records) {
    try {
      const docs = await Attendance.insertMany(
        records.map((r) => ({
          course: r.courseId,
          student: r.studentId,
          date: r.date,
          status: r.status,
          markedBy: r.markedBy,
        })),
        { ordered: true }
      );
      return docs.length;
    } catch (err) {
      if (err && (err.code === 11000 || /E11000/.test(err.message))) {
        throw new DuplicateKeyError('Attendance already recorded for this course and date');
      }
      throw err;
    }
  }

  async findByCourseAndDate(courseId, date) {
    return (await Attendance.find({ course: oid(courseId), date }).lean()).map(toAttendance);
  }

  async findForStudent(studentId, { courseId, from, to, status } = {}) {
    const q = { student: oid(studentId) };
    if (courseId) q.course = oid(courseId);
    if (status) q.status = status;
    if (from || to) {
      q.date = {};
      if (from) q.date.$gte = from;
      if (to) q.date.$lte = to;
    }
    return (await Attendance.find(q).sort({ date: -1 }).lean()).map(toAttendance);
  }

  async countsByCourseForStudent(studentId) {
    const rows = await Attendance.aggregate([
      { $match: { student: oid(studentId) } },
      ...countStages('$course'),
    ]);
    return rows.map(({ _id, ...c }) => ({ courseId: String(_id), ...c }));
  }

  async countsByStudentForCourse(courseId) {
    const rows = await Attendance.aggregate([
      { $match: { course: oid(courseId) } },
      ...countStages('$student'),
    ]);
    return rows.map(({ _id, ...c }) => ({ studentId: String(_id), ...c }));
  }

  async sessionDatesForCourse(courseId) {
    const dates = await Attendance.distinct('date', { course: oid(courseId) });
    return dates.sort();
  }

  async countSessions() {
    const rows = await Attendance.aggregate([
      { $group: { _id: { c: '$course', d: '$date' } } },
      { $count: 'n' },
    ]);
    return rows.length ? rows[0].n : 0;
  }
}

module.exports = { MongoAttendanceRepository };
