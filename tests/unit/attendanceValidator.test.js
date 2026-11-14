// SAT-14 AC2 — validation rules for a marking request (written before the implementation).
const { AttendanceValidator } = require('../../src/services/AttendanceValidator');
const { ValidationError } = require('../../src/utils/errors');

const course = { id: 'c1', facultyId: 'f1', studentIds: ['s1', 's2', 's3'] };
const validator = new AttendanceValidator({ clock: { today: () => '2026-11-14' } });
const full = [
  { studentId: 's1', status: 'present' },
  { studentId: 's2', status: 'late' },
  { studentId: 's3', status: 'absent' },
];

const expectInvalid = (input, message) => {
  expect(() => validator.validate(input, course)).toThrow(ValidationError);
  if (message) expect(() => validator.validate(input, course)).toThrow(message);
};

describe('AttendanceValidator', () => {
  test('accepts a complete register for today and returns normalised records', () => {
    expect(validator.validate({ date: '2026-11-14', records: full }, course)).toEqual({
      date: '2026-11-14',
      records: full,
    });
  });

  test('accepts a past date', () => {
    expect(() => validator.validate({ date: '2026-09-01', records: full }, course)).not.toThrow();
  });

  test('normalises status case and whitespace', () => {
    const records = full.map((r) => ({ ...r, status: ` ${r.status.toUpperCase()} ` }));
    expect(validator.validate({ date: '2026-11-14', records }, course).records).toEqual(full);
  });

  test.each([undefined, '', '14-11-2026', '2026-13-01', '2026-02-30', 'yesterday', 20261114])(
    'rejects invalid date %p',
    (date) => expectInvalid({ date, records: full }, /date/i)
  );

  test('rejects a future date', () =>
    expectInvalid({ date: '2026-11-15', records: full }, /future/i));

  test('rejects an empty or missing list', () => {
    expectInvalid({ date: '2026-11-14', records: [] }, /at least one/i);
    expectInvalid({ date: '2026-11-14' }, /at least one/i);
  });

  test('rejects an unknown status', () =>
    expectInvalid(
      { date: '2026-11-14', records: [...full.slice(0, 2), { studentId: 's3', status: 'sick' }] },
      /status/i
    ));

  test('rejects a student who is not on the roster', () =>
    expectInvalid(
      { date: '2026-11-14', records: [...full, { studentId: 'intruder', status: 'present' }] },
      /not enrolled/i
    ));

  test('rejects the same student twice in one request', () =>
    expectInvalid(
      { date: '2026-11-14', records: [...full, { studentId: 's1', status: 'absent' }] },
      /more than once/i
    ));

  test('rejects an incomplete register (every enrolled student needs a status)', () =>
    expectInvalid({ date: '2026-11-14', records: full.slice(0, 2) }, /missing/i));
});
