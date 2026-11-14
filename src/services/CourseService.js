const { policyFor } = require('../policies/AccessPolicy');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

/** Course listing, rosters and per-date session views. */
class CourseService {
  constructor({ courseRepository, userRepository, attendanceRepository }) {
    this.courses = courseRepository;
    this.users = userRepository;
    this.attendance = attendanceRepository;
  }

  async listForUser(user) {
    const byRole = {
      admin: () => this.courses.findAll(),
      faculty: () => this.courses.findByFaculty(user.id),
      student: () => this.courses.findByStudent(user.id),
    };
    const courses = await byRole[user.role]();
    const faculty = await this.users.findByIds([...new Set(courses.map((c) => c.facultyId))]);
    const facultyName = Object.fromEntries(faculty.map((f) => [f.id, f.name]));
    return Promise.all(
      courses.map(async (c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        facultyName: facultyName[c.facultyId] || null,
        studentCount: c.studentIds.length,
        sessionsHeld: (await this.attendance.sessionDatesForCourse(c.id)).length,
      }))
    );
  }

  /** Loads a course and checks the caller may see its reports (roster, sessions, summary). */
  async getCourseForReports(user, courseId) {
    const course = await this.courses.findById(courseId);
    if (!course) throw new NotFoundError('Course not found');
    if (!policyFor(user).canViewCourseReports(course)) throw new ForbiddenError();
    return course;
  }

  async getRoster(user, courseId) {
    const course = await this.getCourseForReports(user, courseId);
    const students = await this.users.findByIds(course.studentIds);
    return { course: { id: course.id, code: course.code, name: course.name }, students };
  }

  async getSession(user, courseId, date) {
    const course = await this.getCourseForReports(user, courseId);
    const records = await this.attendance.findByCourseAndDate(course.id, date);
    if (!records.length) return { date, marked: false, records: [] };
    const students = await this.users.findByIds(records.map((r) => r.studentId));
    const byId = Object.fromEntries(students.map((s) => [s.id, s]));
    return {
      date,
      marked: true,
      records: records
        .map((r) => ({ student: byId[r.studentId], status: r.status }))
        .sort((a, b) => String(a.student.rollNo).localeCompare(String(b.student.rollNo))),
    };
  }
}

module.exports = { CourseService };
