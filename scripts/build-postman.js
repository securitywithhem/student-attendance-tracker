// Generates postman/attendance-tracker.postman_collection.json (Postman Collection v2.1).
// The collection is kept as code so it is reviewable in PRs; re-run after editing:
//   node scripts/build-postman.js
const fs = require('fs');
const path = require('path');

const lines = (...l) => l;

const req = ({ name, method = 'GET', url, token, body, prerequest = [], tests = [] }) => ({
  name,
  event: [
    ...(prerequest.length
      ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: prerequest } }]
      : []),
    { listen: 'test', script: { type: 'text/javascript', exec: tests } },
  ],
  request: {
    method,
    header: [
      ...(token ? [{ key: 'Authorization', value: `Bearer {{${token}}}` }] : []),
      ...(body ? [{ key: 'Content-Type', value: 'application/json' }] : []),
    ],
    ...(body ? { body: { mode: 'raw', raw: body } } : {}),
    url: `{{baseUrl}}${url}`,
  },
});

const status = (code) => `pm.test('status is ${code}', () => pm.response.to.have.status(${code}));`;
const errorCode = (code) =>
  `pm.test('error code is ${code}', () => pm.expect(pm.response.json().error.code).to.eql('${code}'));`;

const login = (name, email, saveAs) =>
  req({
    name,
    method: 'POST',
    url: '/api/auth/login',
    body: `{ "email": "${email}", "password": "{{password}}" }`,
    tests: lines(
      status(200),
      'const b = pm.response.json();',
      "pm.test('returns a JWT and the profile', () => { pm.expect(b.token.split('.')).to.have.length(3); pm.expect(b.user.email).to.eql('" +
        email +
        "'); pm.expect(b.user).to.not.have.property('passwordHash'); });",
      `pm.collectionVariables.set('${saveAs}Token', b.token);`,
      `pm.collectionVariables.set('${saveAs}Id', b.user.id);`
    ),
  });

const collection = {
  info: {
    name: 'Student Attendance Tracker API',
    description:
      'SAT-8 automated API suite. Covers login ok/fail, RBAC 403s, mark 201, duplicate 409, data isolation, summaries, filters and validation. Every request also checks JSON content type and response time (collection-level test).',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [],
  event: [
    {
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: lines(
          "pm.test('responds within 1000 ms', () => pm.expect(pm.response.responseTime).to.be.below(1000));",
          "pm.test('responds with JSON', () => pm.expect(pm.response.headers.get('Content-Type')).to.include('application/json'));"
        ),
      },
    },
  ],
  item: [
    {
      name: '1. Authentication (SAT-15)',
      item: [
        req({
          name: 'Health check',
          url: '/api/health',
          tests: lines(
            status(200),
            "pm.test('status ok', () => pm.expect(pm.response.json().status).to.eql('ok'));"
          ),
        }),
        login('Login — faculty1 (valid)', 'faculty1@sat.edu', 'faculty1'),
        req({
          name: 'Login — wrong password → 401',
          method: 'POST',
          url: '/api/auth/login',
          body: '{ "email": "faculty1@sat.edu", "password": "wrong-password" }',
          tests: lines(
            status(401),
            errorCode('UNAUTHENTICATED'),
            "pm.test('generic message (no hint which field was wrong)', () => pm.expect(pm.response.json().error.message).to.eql('Invalid email or password'));"
          ),
        }),
        req({
          name: 'Login — missing fields → 400',
          method: 'POST',
          url: '/api/auth/login',
          body: '{ "email": "" }',
          tests: lines(status(400), errorCode('VALIDATION_ERROR')),
        }),
        req({
          name: 'Protected route without token → 401',
          url: '/api/auth/me',
          tests: lines(status(401)),
        }),
        login('Login — faculty2', 'faculty2@sat.edu', 'faculty2'),
        login('Login — student01', 'student01@sat.edu', 'student01'),
        login('Login — student02', 'student02@sat.edu', 'student02'),
        login('Login — admin', 'admin@sat.edu', 'admin'),
      ],
    },
    {
      name: '2. Courses and roster (SAT-12, SAT-13, SAT-18)',
      item: [
        req({
          name: 'Faculty1 course list',
          url: '/api/courses',
          token: 'faculty1Token',
          tests: lines(
            status(200),
            'const courses = pm.response.json().courses;',
            "pm.test('only own courses', () => pm.expect(courses.map(c => c.code).sort()).to.eql(['CSE701', 'CSE706']));",
            "pm.collectionVariables.set('cse706Id', courses.find(c => c.code === 'CSE706').id);"
          ),
        }),
        req({
          name: 'Admin course list',
          url: '/api/courses',
          token: 'adminToken',
          tests: lines(
            status(200),
            'const courses = pm.response.json().courses;',
            "pm.test('all three courses', () => pm.expect(courses).to.have.length(3));",
            "pm.collectionVariables.set('cse705Id', courses.find(c => c.code === 'CSE705').id);"
          ),
        }),
        req({
          name: 'Roster CSE706 (faculty1)',
          url: '/api/courses/{{cse706Id}}/roster',
          token: 'faculty1Token',
          tests: lines(
            status(200),
            'const b = pm.response.json();',
            "pm.test('10 students sorted by roll number', () => { const r = b.students.map(s => s.rollNo); pm.expect(r).to.have.length(10); pm.expect(r).to.eql([...r].sort()); });",
            "pm.collectionVariables.set('rosterIds', JSON.stringify(b.students.map(s => s.id)));"
          ),
        }),
        req({
          name: 'RBAC — faculty1 reads CSE705 roster → 403',
          url: '/api/courses/{{cse705Id}}/roster',
          token: 'faculty1Token',
          tests: lines(status(403), errorCode('FORBIDDEN')),
        }),
        req({
          name: 'Malformed course id → 400',
          url: '/api/courses/not-an-id/roster',
          token: 'faculty1Token',
          tests: lines(status(400), errorCode('VALIDATION_ERROR')),
        }),
      ],
    },
    {
      name: '3. Marking attendance (SAT-14, SAT-16)',
      item: [
        req({
          name: 'Mark CSE706 → 201',
          method: 'POST',
          url: '/api/courses/{{cse706Id}}/attendance',
          token: 'faculty1Token',
          body: '{{markBody}}',
          prerequest: lines(
            '// A random 2025 date keeps the suite re-runnable against the same server.',
            'const d = new Date(Date.UTC(2025, 0, 1) + Math.floor(Math.random() * 365) * 86400000);',
            'const date = d.toISOString().slice(0, 10);',
            "const ids = JSON.parse(pm.collectionVariables.get('rosterIds'));",
            "const records = ids.map((studentId, i) => ({ studentId, status: i === 0 ? 'absent' : i === 1 ? 'late' : 'present' }));",
            "pm.collectionVariables.set('markDate', date);",
            "pm.collectionVariables.set('markBody', JSON.stringify({ date, records }));"
          ),
          tests: lines(
            status(201),
            'const b = pm.response.json();',
            "pm.test('10 saved with correct summary', () => { pm.expect(b.saved).to.eql(10); pm.expect(b.summary).to.eql({ present: 8, late: 1, absent: 1 }); });",
            "pm.test('date echoed', () => pm.expect(b.date).to.eql(pm.collectionVariables.get('markDate')));"
          ),
        }),
        req({
          name: 'Duplicate submission same course + date → 409',
          method: 'POST',
          url: '/api/courses/{{cse706Id}}/attendance',
          token: 'faculty1Token',
          body: '{{markBody}}',
          tests: lines(status(409), errorCode('CONFLICT')),
        }),
        req({
          name: 'Session read-back shows the saved register',
          url: '/api/courses/{{cse706Id}}/attendance?date={{markDate}}',
          token: 'faculty1Token',
          tests: lines(
            status(200),
            "pm.test('marked with 10 records, unchanged by the 409', () => { const b = pm.response.json(); pm.expect(b.marked).to.eql(true); pm.expect(b.records.filter(r => r.status === 'absent')).to.have.length(1); });"
          ),
        }),
        req({
          name: 'RBAC — student marks attendance → 403',
          method: 'POST',
          url: '/api/courses/{{cse706Id}}/attendance',
          token: 'student01Token',
          body: '{{markBody}}',
          tests: lines(status(403), errorCode('FORBIDDEN')),
        }),
        req({
          name: 'Validation — future date → 400',
          method: 'POST',
          url: '/api/courses/{{cse706Id}}/attendance',
          token: 'faculty1Token',
          body: '{ "date": "2999-01-01", "records": [] }',
          tests: lines(
            status(400),
            errorCode('VALIDATION_ERROR'),
            "pm.test('message mentions the future', () => pm.expect(pm.response.json().error.message).to.match(/future/i));"
          ),
        }),
        req({
          name: 'Validation — unknown status → 400',
          method: 'POST',
          url: '/api/courses/{{cse706Id}}/attendance',
          token: 'faculty1Token',
          body: '{{badStatusBody}}',
          prerequest: lines(
            "const ids = JSON.parse(pm.collectionVariables.get('rosterIds'));",
            "pm.collectionVariables.set('badStatusBody', JSON.stringify({ date: '2024-06-03', records: ids.map(studentId => ({ studentId, status: 'sick' })) }));"
          ),
          tests: lines(status(400), errorCode('VALIDATION_ERROR')),
        }),
      ],
    },
    {
      name: '4. Analytics, filters and isolation (SAT-1, SAT-2, SAT-3, SAT-5)',
      item: [
        req({
          name: 'Student01 own summary',
          url: '/api/students/{{student01Id}}/summary',
          token: 'student01Token',
          tests: lines(
            status(200),
            'const b = pm.response.json();',
            "pm.test('threshold is 75', () => pm.expect(b.threshold).to.eql(75));",
            "pm.test('each course has percentage and a valid level', () => b.courses.forEach(c => { pm.expect(c.percentage).to.be.a('number'); pm.expect(['ok','warning','critical','no-data']).to.include(c.level); }));",
            "pm.collectionVariables.set('student01CourseId', b.courses.find(c => c.course.code === 'CSE706').course.id);"
          ),
        }),
        req({
          name: 'Isolation — student01 reads student02 summary → 403',
          url: '/api/students/{{student02Id}}/summary',
          token: 'student01Token',
          tests: lines(status(403), errorCode('FORBIDDEN')),
        }),
        req({
          name: 'History filters — course + status + date range',
          url: '/api/students/{{student01Id}}/history?courseId={{student01CourseId}}&status=present&from=2026-09-01&to=2026-10-31',
          token: 'student01Token',
          tests: lines(
            status(200),
            'const b = pm.response.json();',
            "pm.test('every record matches all filters', () => b.records.forEach(r => { pm.expect(r.status).to.eql('present'); pm.expect(r.course.code).to.eql('CSE706'); pm.expect(r.date >= '2026-09-01' && r.date <= '2026-10-31').to.be.true; }));",
            "pm.test('count matches records', () => pm.expect(b.count).to.eql(b.records.length));"
          ),
        }),
        req({
          name: 'History filters — from after to → 400',
          url: '/api/students/{{student01Id}}/history?from=2026-10-10&to=2026-10-01',
          token: 'student01Token',
          tests: lines(status(400), errorCode('VALIDATION_ERROR')),
        }),
        req({
          name: 'Faculty1 course summary CSE706',
          url: '/api/courses/{{cse706Id}}/summary',
          token: 'faculty1Token',
          tests: lines(
            status(200),
            'const b = pm.response.json();',
            "pm.test('10 students with figures', () => pm.expect(b.students).to.have.length(10));",
            "pm.test('belowThreshold matches the list', () => pm.expect(b.belowThreshold).to.eql(b.students.filter(s => s.percentage !== null && s.percentage < b.threshold).length));"
          ),
        }),
        req({
          name: 'RBAC — student reads course summary → 403',
          url: '/api/courses/{{cse706Id}}/summary',
          token: 'student01Token',
          tests: lines(status(403)),
        }),
        req({
          name: 'Admin overview',
          url: '/api/admin/overview',
          token: 'adminToken',
          tests: lines(
            status(200),
            "pm.test('user totals', () => pm.expect(pm.response.json().users).to.eql({ admin: 1, faculty: 2, student: 10 }));"
          ),
        }),
        req({
          name: 'RBAC — faculty reads admin overview → 403',
          url: '/api/admin/overview',
          token: 'faculty2Token',
          tests: lines(status(403)),
        }),
      ],
    },
  ],
};

const out = path.join(__dirname, '..', 'postman', 'attendance-tracker.postman_collection.json');
fs.writeFileSync(out, `${JSON.stringify(collection, null, 2)}\n`);

const count = collection.item.reduce((n, f) => n + f.item.length, 0);
console.log(`Wrote ${path.relative(process.cwd(), out)} with ${count} requests`);
