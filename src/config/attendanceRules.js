// Attendance rules live in configuration so new statuses or alert levels can be added without
// editing the calculator (Open/Closed Principle).
const threshold = Number.parseFloat(process.env.ATTENDANCE_THRESHOLD) || 75;

const attendanceRules = Object.freeze({
  /** Status → credit toward attendance. Late counts as attended. */
  statusWeights: Object.freeze({ present: 1, late: 1, absent: 0 }),
  /** Minimum percentage for "ok". */
  threshold,
  /** Alert levels, checked top to bottom: first level whose `min` the percentage reaches wins. */
  levels: Object.freeze([
    Object.freeze({ level: 'ok', min: threshold, label: 'On track' }),
    Object.freeze({ level: 'warning', min: threshold - 10, label: 'Below threshold' }),
    Object.freeze({ level: 'critical', min: 0, label: 'Critical' }),
  ]),
  /** Decimal places kept when rounding a percentage. */
  precision: 1,
});

module.exports = attendanceRules;
