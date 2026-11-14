// Pieces shared by student, faculty and admin dashboards (SAT-3 badges, progress bars).
(function () {
  const { esc } = window.UI;

  const LABELS = {
    ok: 'On track',
    warning: 'Below threshold',
    critical: 'Critical',
    'no-data': 'No sessions yet',
  };

  function badge(level, label) {
    return `<span class="badge badge-${esc(level)}" data-testid="badge-${esc(level)}">${esc(
      label || LABELS[level] || level
    )}</span>`;
  }

  const pctText = (p) => (p === null || p === undefined ? '—' : `${Number(p).toFixed(1)}%`);

  function bar(percentage, level, threshold) {
    const width = Math.max(0, Math.min(100, percentage || 0));
    return `<div class="bar" role="img" aria-label="${pctText(percentage)} attendance, threshold ${threshold}%">
      <div class="bar-fill ${esc(level)}" style="width:${width}%"></div>
      <div class="bar-mark" style="left:calc(${threshold}% - 1px)" title="Threshold ${threshold}%"></div>
    </div>`;
  }

  function tabs(items, active) {
    return `<nav class="tabs">${items
      .map(
        ([id, label, href]) =>
          `<a class="tab" href="${esc(href)}" ${id === active ? 'aria-current="page"' : ''}>${esc(label)}</a>`
      )
      .join('')}</nav>`;
  }

  /** Per-student table used by the faculty course summary and the admin view. */
  function summaryTable(summary) {
    const rows = [...summary.students].sort(
      (a, b) => (a.percentage ?? 101) - (b.percentage ?? 101)
    );
    return `
      <div class="stats">
        <div class="card stat"><div class="stat-label">Sessions held</div><div class="stat-value">${summary.sessionsHeld}</div>
          <div class="stat-note">${summary.lastSession ? `Last: ${esc(window.UI.formatDate(summary.lastSession))}` : 'None yet'}</div></div>
        <div class="card stat"><div class="stat-label">Class average</div><div class="stat-value">${pctText(summary.average)}</div>
          <div class="stat-note">Threshold ${summary.threshold}%</div></div>
        <div class="card stat"><div class="stat-label">Below threshold</div><div class="stat-value" data-testid="below-threshold">${summary.belowThreshold}</div>
          <div class="stat-note">of ${summary.students.length} students</div></div>
      </div>
      <section class="card table-scroll">
        <table>
          <thead><tr><th>Roll no.</th><th>Student</th><th class="num">Attended</th><th class="num">%</th><th>Status</th><th class="num hide-sm">To recover</th></tr></thead>
          <tbody>
            ${rows
              .map(
                (
                  s
                ) => `<tr class="${s.level === 'critical' || s.level === 'warning' ? 'row-alert' : ''}">
                  <td class="num">${esc(s.student.rollNo)}</td>
                  <td>${esc(s.student.name)}</td>
                  <td class="num">${s.attended} / ${s.total}</td>
                  <td class="num"><strong>${pctText(s.percentage)}</strong></td>
                  <td>${badge(s.level, s.label)}</td>
                  <td class="num hide-sm">${s.sessionsToThreshold ? `${s.sessionsToThreshold} sessions` : '—'}</td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </section>`;
  }

  window.Shared = { badge, bar, pctText, tabs, summaryTable };
})();
