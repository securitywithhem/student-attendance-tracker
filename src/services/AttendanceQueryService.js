const { policyFor } = require('../policies/AccessPolicy');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

const ZERO = { present: 0, late: 0, absent: 0, total: 0 };
const brief = (c) => ({ id: c.id, code: c.code, name: c.name });

/**
 * Read side (Interface Segregation: students and report viewers only need these queries, never
 * the marking methods). Numbers come from AttendanceCalculator so every screen agrees.
 */
class AttendanceQueryService {
  constructor({ courseRepository, userRepository, attendanceRepository, calculator, rules }) {
    this.courses = courseRepository;
    this.users = userRepository;
    this.attendance = attendanceRepository;
    this.calculator = calculator;
    this.rules = rules;
  }

  /** Loads a student and their courses, enforcing who may see them. */
  async loadStudentFor(user, studentId) {
    const student = await this.users.findById(studentId);
    if (!student || student.role !== 'student') throw new NotFoundError('Student not found');
    const courses = await this.courses.findByStudent(student.id);
    if (!policyFor(user).canViewStudent(student.id, courses)) {
      throw new ForbiddenError('You can only view attendance you are responsible for');
    }
    return { student, courses };
  }

  withRecovery(counts) {
    return {
      ...this.calculator.summarize(counts),
      sessionsToThreshold: this.calculator.sessionsToReachThreshold(counts),
    };
  }

  async studentSummary(user, studentId) {
    const { student, courses } = await this.loadStudentFor(user, studentId);
    const rows = await this.attendance.countsByCourseForStudent(student.id);
    const byCourse = Object.fromEntries(rows.map((r) => [r.courseId, r]));

    const overallCounts = { ...ZERO };
    const perCourse = courses.map((course) => {
      const counts = byCourse[course.id] || ZERO;
      for (const k of Object.keys(overallCounts)) overallCounts[k] += counts[k] || 0;
      return { course: brief(course), ...this.withRecovery(counts) };
    });

    return {
      student,
      threshold: this.rules.threshold,
      overall: this.calculator.summarize(overallCounts),
      courses: perCourse,
    };
  }

  async studentHistory(user, studentId, filters = {}) {
    const { student, courses } = await this.loadStudentFor(user, studentId);
    const courseById = Object.fromEntries(courses.map((c) => [c.id, brief(c)]));
    const records = await this.attendance.findForStudent(student.id, filters);
    return {
      student,
      filters,
      count: records.length,
      records: records.map((r) => ({
        date: r.date,
        status: r.status,
        course: courseById[r.courseId] || { id: r.courseId },
      })),
    };
  }

  async courseSummary(user, courseId) {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');
    if (!policyFor(user).canViewCourseReports(course)) throw new ForbiddenError();

    const [students, rows, dates] = await Promise.all([
      this.users.findByIds(course.studentIds),
      this.attendance.countsByStudentForCourse(course.id),
      this.attendance.sessionDatesForCourse(course.id),
    ]);
    const byStudent = Object.fromEntries(rows.map((r) => [r.studentId, r]));
    const list = students.map((s) => ({
      student: s,
      ...this.withRecovery(byStudent[s.id] || ZERO),
    }));
    const withData = list.filter((s) => s.percentage !== null);
    const average = withData.length
      ? this.calculator.round(withData.reduce((sum, s) => sum + s.percentage, 0) / withData.length)
      : null;

    return {
      course: brief(course),
      threshold: this.rules.threshold,
      sessionsHeld: dates.length,
      lastSession: dates[dates.length - 1] || null,
      average,
      belowThreshold: withData.filter((s) => s.percentage < this.rules.threshold).length,
      students: list,
    };
  }

  async adminOverview(user) {
    if (user.role !== 'admin') throw new ForbiddenError();
    const [users, sessions, courses] = await Promise.all([
      this.users.countByRole(),
      this.attendance.countSessions(),
      this.courses.findAll(),
    ]);
    const summaries = await Promise.all(courses.map((c) => this.courseSummary(user, c.id)));
    return {
      users: { admin: users.admin || 0, faculty: users.faculty || 0, student: users.student || 0 },
      sessions,
      threshold: this.rules.threshold,
      courses: summaries.map(({ students, ...rest }) => ({
        ...rest,
        studentCount: students.length,
      })),
    };
  }
}

module.exports = { AttendanceQueryService };
