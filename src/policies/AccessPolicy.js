// Role-based access rules. Every role implements the same AccessPolicy interface, so callers ask
// `policyFor(user).canX(...)` and never branch on the role themselves (Liskov substitution).

/** Base class: deny everything. Subclasses grant what their role needs. */
class AccessPolicy {
  constructor(user) {
    this.user = user;
  }
  canViewCourse(_course) {
    return false;
  }
  canMarkAttendance(_course) {
    return false;
  }
  /** Roster, session details and course summary. */
  canViewCourseReports(_course) {
    return false;
  }
  /** @param {string} _studentId @param {Array} _studentCourses courses the student is enrolled in */
  canViewStudent(_studentId, _studentCourses) {
    return false;
  }
}

class AdminPolicy extends AccessPolicy {
  canViewCourse() {
    return true;
  }
  canViewCourseReports() {
    return true;
  }
  canViewStudent() {
    return true;
  }
}

class FacultyPolicy extends AccessPolicy {
  teaches(course) {
    return Boolean(course) && course.facultyId === this.user.id;
  }
  canViewCourse(course) {
    return this.teaches(course);
  }
  canMarkAttendance(course) {
    return this.teaches(course);
  }
  canViewCourseReports(course) {
    return this.teaches(course);
  }
  canViewStudent(_studentId, studentCourses = []) {
    return studentCourses.some((c) => this.teaches(c));
  }
}

class StudentPolicy extends AccessPolicy {
  canViewCourse(course) {
    return Boolean(course) && course.studentIds.includes(this.user.id);
  }
  canViewStudent(studentId) {
    return studentId === this.user.id;
  }
}

const POLICIES = { admin: AdminPolicy, faculty: FacultyPolicy, student: StudentPolicy };

function policyFor(user) {
  const Policy = user && POLICIES[user.role];
  if (!Policy) throw new Error(`No access policy for role "${user && user.role}"`);
  return new Policy(user);
}

module.exports = { AccessPolicy, AdminPolicy, FacultyPolicy, StudentPolicy, policyFor };
