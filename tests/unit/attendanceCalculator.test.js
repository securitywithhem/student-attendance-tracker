// SAT-6 — percentage calculation, written before the implementation (TDD red step).
const { AttendanceCalculator } = require('../../src/services/AttendanceCalculator');
const defaultRules = require('../../src/config/attendanceRules');

const calc = new AttendanceCalculator(defaultRules);
const counts = (present, late, absent) => ({
  present,
  late,
  absent,
  total: present + late + absent,
});

describe('AttendanceCalculator.percentage', () => {
  test('AC1: (present + late) / total × 100', () => {
    expect(calc.percentage(counts(6, 2, 2))).toBe(80);
  });

  test('AC1: rounds to one decimal place', () => {
    expect(calc.percentage(counts(2, 0, 1))).toBe(66.7); // 66.666…
    expect(calc.percentage(counts(1, 0, 2))).toBe(33.3); // 33.333…
    expect(calc.percentage(counts(1, 0, 7))).toBe(12.5);
  });

  test('AC2: zero sessions gives null (no data), never NaN or a division error', () => {
    expect(calc.percentage(counts(0, 0, 0))).toBeNull();
  });

  test('100% and 0% are exact', () => {
    expect(calc.percentage(counts(20, 0, 0))).toBe(100);
    expect(calc.percentage(counts(0, 0, 20))).toBe(0);
  });

  test('missing status keys are treated as zero', () => {
    expect(calc.percentage({ present: 3, absent: 1 })).toBe(75);
  });
});

describe('AttendanceCalculator.classify (alert levels)', () => {
  test('AC3: exactly 75.0% is ok', () => {
    expect(calc.classify(75)).toMatchObject({ level: 'ok' });
  });

  test('AC3: 74.9% is warning', () => {
    expect(calc.classify(74.9)).toMatchObject({ level: 'warning' });
  });

  test('65.0% is still warning; 64.9% is critical', () => {
    expect(calc.classify(65)).toMatchObject({ level: 'warning' });
    expect(calc.classify(64.9)).toMatchObject({ level: 'critical' });
  });

  test('0% is critical; null is no-data', () => {
    expect(calc.classify(0)).toMatchObject({ level: 'critical' });
    expect(calc.classify(null)).toMatchObject({ level: 'no-data' });
  });
});

describe('AttendanceCalculator.summarize', () => {
  test('returns attended, total, percentage and level together', () => {
    expect(calc.summarize(counts(14, 1, 5))).toEqual({
      present: 14,
      late: 1,
      absent: 5,
      attended: 15,
      total: 20,
      percentage: 75,
      level: 'ok',
      label: 'On track',
    });
  });

  test('a value that rounds to 75.0 is classified on the rounded figure the student sees', () => {
    // 2999 / 4000 = 74.975 → shown as 75.0 → ok
    expect(calc.summarize(counts(2999, 0, 1001))).toMatchObject({ percentage: 75, level: 'ok' });
  });

  test('sessionsNeeded: how many consecutive attended sessions reach the threshold', () => {
    expect(calc.sessionsToReachThreshold(counts(5, 0, 5))).toBe(10); // 15/20 = 75%
    expect(calc.sessionsToReachThreshold(counts(15, 0, 5))).toBe(0);
    expect(calc.sessionsToReachThreshold(counts(0, 0, 0))).toBe(0);
  });
});

describe('Open/Closed: behaviour comes from the rules object', () => {
  test('a stricter threshold changes the classification without code changes', () => {
    const strict = new AttendanceCalculator({
      ...defaultRules,
      threshold: 80,
      levels: [
        { level: 'ok', min: 80, label: 'On track' },
        { level: 'critical', min: 0, label: 'Critical' },
      ],
    });
    expect(strict.classify(75)).toMatchObject({ level: 'critical' });
  });

  test('late can be configured to count as half', () => {
    const halfLate = new AttendanceCalculator({
      ...defaultRules,
      statusWeights: { present: 1, late: 0.5, absent: 0 },
    });
    expect(halfLate.percentage(counts(2, 2, 0))).toBe(75);
  });
});
