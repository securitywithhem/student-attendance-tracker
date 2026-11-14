/**
 * Repository contracts (documentation only — JavaScript has no interfaces).
 * Services depend on these shapes, never on Mongoose. Two implementations exist:
 * `mongo/` for the running app and `memory/` for fast unit tests.
 *
 * Domain objects are plain objects with string ids:
 *   User       { id, name, email, role, rollNo, passwordHash? }
 *   Course     { id, code, name, facultyId, studentIds: string[] }
 *   Attendance { id, courseId, studentId, date: 'YYYY-MM-DD', status, markedBy }
 *   Counts     { present, late, absent, total }
 *
 * @typedef {Object} UserRepository
 * @property {(email: string) => Promise<User|null>} findByEmailWithPassword
 * @property {(id: string) => Promise<User|null>} findById
 * @property {(ids: string[]) => Promise<User[]>} findByIds
 * @property {() => Promise<Record<string, number>>} countByRole
 *
 * @typedef {Object} CourseRepository
 * @property {(id: string) => Promise<Course|null>} findById
 * @property {() => Promise<Course[]>} findAll
 * @property {(facultyId: string) => Promise<Course[]>} findByFaculty
 * @property {(studentId: string) => Promise<Course[]>} findByStudent
 *
 * @typedef {Object} AttendanceRepository
 * @property {(courseId: string, date: string) => Promise<boolean>} existsForCourseOnDate
 * @property {(records: Omit<Attendance,'id'>[]) => Promise<number>} insertMany  throws DuplicateKeyError
 * @property {(courseId: string, date: string) => Promise<Attendance[]>} findByCourseAndDate
 * @property {(studentId: string, filters: {courseId?, from?, to?, status?}) => Promise<Attendance[]>} findForStudent
 * @property {(studentId: string) => Promise<Array<Counts & {courseId: string}>>} countsByCourseForStudent
 * @property {(courseId: string) => Promise<Array<Counts & {studentId: string}>>} countsByStudentForCourse
 * @property {(courseId: string) => Promise<string[]>} sessionDatesForCourse
 * @property {() => Promise<number>} countSessions
 */
module.exports = {};
