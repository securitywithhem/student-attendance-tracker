// In-memory repository fakes with the same contract as the Mongo repositories (see ../contracts.js).
// Used by unit tests so services are tested without a database (Dependency Inversion).
const { DuplicateKeyError } = require('../errors');

let seq = 0;
const nextId = () => `id${(seq += 1)}`;
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));

class InMemoryUserRepository {
  constructor(users = []) {
    this.users = users.map((u) => ({ id: u.id || nextId(), rollNo: null, ...u }));
  }
  async findByEmailWithPassword(email) {
    return clone(this.users.find((u) => u.email === String(email).toLowerCase().trim()) || null);
  }
  async findById(id) {
    const u = this.users.find((x) => x.id === id);
    if (!u) return null;
    const { passwordHash: _omit, ...rest } = u;
    return clone(rest);
  }
  async findByIds(ids) {
    const found = await Promise.all(ids.map((id) => this.findById(id)));
    return found.filter(Boolean).sort((a, b) => String(a.rollNo).localeCompare(String(b.rollNo)));
  }
  async countByRole() {
    return this.users.reduce((m, u) => ({ ...m, [u.role]: (m[u.role] || 0) + 1 }), {});
  }
}

class InMemoryCourseRepository {
  constructor(courses = []) {
    this.courses = courses.map((c) => ({ id: c.id || nextId(), studentIds: [], ...c }));
  }
  async findById(id) {
    return clone(this.courses.find((c) => c.id === id) || null);
  }
  async findAll() {
    return clone(this.courses);
  }
  async findByFaculty(facultyId) {
    return clone(this.courses.filter((c) => c.facultyId === facultyId));
  }
  async findByStudent(studentId) {
    return clone(this.courses.filter((c) => c.studentIds.includes(studentId)));
  }
}

const tally = (list) => {
  const c = { present: 0, late: 0, absent: 0, total: 0 };
  for (const r of list) {
    c[r.status] += 1;
    c.total += 1;
  }
  return c;
};

class InMemoryAttendanceRepository {
  constructor(records = []) {
    this.records = records.map((r) => ({ id: r.id || nextId(), ...r }));
  }
  async existsForCourseOnDate(courseId, date) {
    return this.records.some((r) => r.courseId === courseId && r.date === date);
  }
  async insertMany(records) {
    const key = (r) => `${r.courseId}|${r.studentId}|${r.date}`;
    const existing = new Set(this.records.map(key));
    const incoming = new Set();
    for (const r of records) {
      if (existing.has(key(r)) || incoming.has(key(r))) {
        throw new DuplicateKeyError('Attendance already recorded for this course and date');
      }
      incoming.add(key(r));
    }
    for (const r of records) this.records.push({ id: nextId(), ...clone(r) });
    return records.length;
  }
  async findByCourseAndDate(courseId, date) {
    return clone(this.records.filter((r) => r.courseId === courseId && r.date === date));
  }
  async findForStudent(studentId, { courseId, from, to, status } = {}) {
    return clone(
      this.records
        .filter(
          (r) =>
            r.studentId === studentId &&
            (!courseId || r.courseId === courseId) &&
            (!status || r.status === status) &&
            (!from || r.date >= from) &&
            (!to || r.date <= to)
        )
        .sort((a, b) => b.date.localeCompare(a.date))
    );
  }
  async countsByCourseForStudent(studentId) {
    const by = {};
    for (const r of this.records.filter((x) => x.studentId === studentId))
      (by[r.courseId] = by[r.courseId] || []).push(r);
    return Object.entries(by).map(([courseId, list]) => ({ courseId, ...tally(list) }));
  }
  async countsByStudentForCourse(courseId) {
    const by = {};
    for (const r of this.records.filter((x) => x.courseId === courseId))
      (by[r.studentId] = by[r.studentId] || []).push(r);
    return Object.entries(by).map(([studentId, list]) => ({ studentId, ...tally(list) }));
  }
  async sessionDatesForCourse(courseId) {
    return [
      ...new Set(this.records.filter((r) => r.courseId === courseId).map((r) => r.date)),
    ].sort();
  }
  async countSessions() {
    return new Set(this.records.map((r) => `${r.courseId}|${r.date}`)).size;
  }
}

module.exports = { InMemoryUserRepository, InMemoryCourseRepository, InMemoryAttendanceRepository };
