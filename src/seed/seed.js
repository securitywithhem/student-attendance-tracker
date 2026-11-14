// Deterministic demo data: 1 admin, 2 faculty, 10 students, 3 courses, 20 sessions per course.
// Attendance patterns are generated from a fixed PRNG seed, so every run produces the same data.
const bcrypt = require('bcryptjs');
const { User } = require('../models/User');
const { Course } = require('../models/Course');
const { Attendance } = require('../models/Attendance');

const DEMO_PASSWORD = 'Password@123';

/** Mulberry32 PRNG — small, deterministic. */
function prng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` weekday dates (YYYY-MM-DD) starting from `start`, only on the given weekdays (1=Mon). */
function sessionDates(start, count, weekdays) {
  const out = [];
  const d = new Date(`${start}T00:00:00Z`);
  while (out.length < count) {
    if (weekdays.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const STUDENT_NAMES = [
  'Aarav Shah',
  'Diya Patel',
  'Kabir Mehta',
  'Isha Desai',
  'Rohan Joshi',
  'Ananya Rao',
  'Vihaan Trivedi',
  'Meera Iyer',
  'Arjun Nair',
  'Saanvi Pandya',
];
// Probability of attending each session; a few students sit below the 75% threshold on purpose.
const ATTEND_PROBABILITY = [0.95, 0.9, 0.85, 0.62, 0.92, 0.88, 0.7, 0.97, 0.8, 0.9];

async function seedDatabase({ force = false } = {}) {
  if (!force && (await User.estimatedDocumentCount()) > 0) return { skipped: true };
  await Promise.all([User.deleteMany({}), Course.deleteMany({}), Attendance.deleteMany({})]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await User.create({
    name: 'Department Admin',
    email: 'admin@sat.edu',
    role: 'admin',
    passwordHash,
  });
  const [f1, f2] = await User.create([
    { name: 'Dr. Nisha Kapoor', email: 'faculty1@sat.edu', role: 'faculty', passwordHash },
    { name: 'Prof. Raj Malhotra', email: 'faculty2@sat.edu', role: 'faculty', passwordHash },
  ]);
  const students = await User.create(
    STUDENT_NAMES.map((name, i) => {
      const n = String(i + 1).padStart(2, '0');
      return {
        name,
        email: `student${n}@sat.edu`,
        role: 'student',
        rollNo: `22CSE0${n}`,
        passwordHash,
      };
    })
  );
  const ids = students.map((s) => s._id);

  const courses = await Course.create([
    { code: 'CSE706', name: 'Agile Software Development', faculty: f1._id, students: ids },
    { code: 'CSE701', name: 'Machine Learning', faculty: f1._id, students: ids.slice(0, 8) },
    { code: 'CSE705', name: 'Cloud Computing', faculty: f2._id, students: ids.slice(2) },
  ]);

  const plans = [
    { course: courses[0], dates: sessionDates('2026-09-07', 20, [1, 3, 5]), seed: 706 },
    { course: courses[1], dates: sessionDates('2026-09-08', 20, [2, 4]), seed: 701 },
    { course: courses[2], dates: sessionDates('2026-09-07', 20, [1, 2, 4]), seed: 705 },
  ];

  const records = [];
  for (const { course, dates, seed } of plans) {
    const rand = prng(seed);
    for (const date of dates) {
      for (const studentId of course.students) {
        const idx = ids.findIndex((x) => x.equals(studentId));
        const r = rand();
        const p = ATTEND_PROBABILITY[idx];
        const status = r < p * 0.9 ? 'present' : r < p ? 'late' : 'absent';
        records.push({
          course: course._id,
          student: studentId,
          date,
          status,
          markedBy: course.faculty,
        });
      }
    }
  }
  await Attendance.insertMany(records);

  return {
    skipped: false,
    users: 1 + 2 + students.length,
    admin: admin.email,
    courses: courses.length,
    sessions: plans.reduce((s, p) => s + p.dates.length, 0),
    records: records.length,
  };
}

module.exports = { seedDatabase, DEMO_PASSWORD, sessionDates };
