const toUser = (d, withPassword = false) =>
  d && {
    id: String(d._id),
    name: d.name,
    email: d.email,
    role: d.role,
    rollNo: d.rollNo || null,
    ...(withPassword ? { passwordHash: d.passwordHash } : {}),
  };

const toCourse = (d) =>
  d && {
    id: String(d._id),
    code: d.code,
    name: d.name,
    facultyId: String(d.faculty),
    studentIds: (d.students || []).map(String),
  };

const toAttendance = (d) =>
  d && {
    id: String(d._id),
    courseId: String(d.course),
    studentId: String(d.student),
    date: d.date,
    status: d.status,
    markedBy: String(d.markedBy),
  };

module.exports = { toUser, toCourse, toAttendance };
