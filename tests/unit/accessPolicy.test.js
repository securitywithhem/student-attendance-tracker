// SAT-18 / SAT-20 — written before the implementation (TDD red step).
const {
  policyFor,
  AdminPolicy,
  FacultyPolicy,
  StudentPolicy,
} = require('../../src/policies/AccessPolicy');

const admin = { id: 'a1', role: 'admin' };
const faculty = { id: 'f1', role: 'faculty' };
const otherFaculty = { id: 'f2', role: 'faculty' };
const student = { id: 's1', role: 'student' };

const course = { id: 'c1', facultyId: 'f1', studentIds: ['s1', 's2'] };
const otherCourse = { id: 'c2', facultyId: 'f2', studentIds: ['s2'] };

describe('policyFor (SAT-18)', () => {
  test('returns the policy class for each role', () => {
    expect(policyFor(admin)).toBeInstanceOf(AdminPolicy);
    expect(policyFor(faculty)).toBeInstanceOf(FacultyPolicy);
    expect(policyFor(student)).toBeInstanceOf(StudentPolicy);
  });

  test('rejects an unknown role', () => {
    expect(() => policyFor({ id: 'x', role: 'hacker' })).toThrow();
  });

  test('every policy exposes the same interface (Liskov substitution)', () => {
    const methods = [
      'canViewCourse',
      'canMarkAttendance',
      'canViewCourseReports',
      'canViewStudent',
    ];
    for (const user of [admin, faculty, student]) {
      const p = policyFor(user);
      for (const m of methods) expect(typeof p[m]).toBe('function');
    }
  });
});

describe('Student policy', () => {
  const p = policyFor(student);
  test('AC1: cannot mark attendance or read course reports', () => {
    expect(p.canMarkAttendance(course)).toBe(false);
    expect(p.canViewCourseReports(course)).toBe(false);
  });
  test('can view a course they are enrolled in, not others', () => {
    expect(p.canViewCourse(course)).toBe(true);
    expect(p.canViewCourse(otherCourse)).toBe(false);
  });
  test('AC3: can view only their own student record', () => {
    expect(p.canViewStudent('s1', [course])).toBe(true);
    expect(p.canViewStudent('s2', [course, otherCourse])).toBe(false);
  });
});

describe('Faculty policy', () => {
  const p = policyFor(faculty);
  test('can mark and report on a course they teach', () => {
    expect(p.canMarkAttendance(course)).toBe(true);
    expect(p.canViewCourseReports(course)).toBe(true);
    expect(p.canViewCourse(course)).toBe(true);
  });
  test('AC2: cannot mark or read a course taught by someone else', () => {
    expect(p.canMarkAttendance(otherCourse)).toBe(false);
    expect(p.canViewCourseReports(otherCourse)).toBe(false);
    expect(p.canViewCourse(otherCourse)).toBe(false);
  });
  test('can view a student only if that student is in one of their courses', () => {
    expect(p.canViewStudent('s2', [course, otherCourse])).toBe(true);
    expect(policyFor(otherFaculty).canViewStudent('s1', [course])).toBe(false);
  });
});

describe('Admin policy', () => {
  const p = policyFor(admin);
  test('AC4: can view any course and any student', () => {
    expect(p.canViewCourse(otherCourse)).toBe(true);
    expect(p.canViewCourseReports(otherCourse)).toBe(true);
    expect(p.canViewStudent('s2', [])).toBe(true);
  });
  test('does not mark attendance (faculty-only action)', () => {
    expect(p.canMarkAttendance(course)).toBe(false);
  });
});
