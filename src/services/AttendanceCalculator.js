/**
 * Pure percentage and alert-level calculations. All rules (weights, threshold, levels, precision)
 * come from the injected rules object, so the rules can change without editing this class
 * (Open/Closed Principle). No I/O.
 */
class AttendanceCalculator {
  constructor(rules) {
    this.rules = rules;
  }

  round(value) {
    const f = 10 ** this.rules.precision;
    return Math.round((value + Number.EPSILON) * f) / f;
  }

  /** Weighted attended sessions and total sessions from status counts. */
  tally(counts) {
    let attended = 0;
    let total = 0;
    for (const [status, weight] of Object.entries(this.rules.statusWeights)) {
      const n = counts[status] || 0;
      attended += n * weight;
      total += n;
    }
    return { attended, total };
  }

  /** Percentage rounded to the configured precision, or null when no sessions were held. */
  percentage(counts) {
    const { attended, total } = this.tally(counts);
    if (total === 0) return null;
    return this.round((attended / total) * 100);
  }

  classify(percentage) {
    if (percentage === null || percentage === undefined) {
      return { level: 'no-data', label: 'No sessions yet' };
    }
    const match = this.rules.levels.find((l) => percentage >= l.min);
    const chosen = match || this.rules.levels[this.rules.levels.length - 1];
    return { level: chosen.level, label: chosen.label };
  }

  summarize(counts) {
    const { attended, total } = this.tally(counts);
    const percentage = this.percentage(counts);
    const perStatus = Object.fromEntries(
      Object.keys(this.rules.statusWeights).map((s) => [s, counts[s] || 0])
    );
    return { ...perStatus, attended, total, percentage, ...this.classify(percentage) };
  }

  /** Consecutive fully-attended sessions needed to reach the threshold (0 if already there). */
  sessionsToReachThreshold(counts) {
    const { attended, total } = this.tally(counts);
    const t = this.rules.threshold / 100;
    if (total === 0 || attended / total >= t) return 0;
    if (t >= 1) return Infinity;
    // (attended + x) / (total + x) >= t  →  x >= (t·total − attended) / (1 − t)
    return Math.ceil((t * total - attended) / (1 - t) - 1e-9);
  }
}

module.exports = { AttendanceCalculator };
