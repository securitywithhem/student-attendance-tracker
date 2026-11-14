// Student dashboard (SAT-1), threshold alerts (SAT-3) and filterable history (SAT-2).
(function () {
  const { esc, render, loading, formatDate, toast } = window.UI;
  const { badge, bar, pctText } = window.Shared;
  const Api = window.Api;

  async function dashboard(user) {
    loading('Loading your attendance…');
    const summary = await Api.get(`/students/${user.id}/summary`);
    const { overall, courses, threshold } = summary;
    const atRisk = courses.filter((c) => c.level === 'warning' || c.level === 'critical');
    const worst = atRisk.some((c) => c.level === 'critical') ? '' : 'alert-warning';
    const firstName = summary.student.name.split(' ')[0];

    render(`
      <div class="page-head">
        <div>
          <h1>Hi, ${esc(firstName)}</h1>
          <p>${esc(summary.student.rollNo || '')} · Minimum required attendance is ${threshold}%.</p>
        </div>
      </div>

      ${
        atRisk.length
          ? `<div class="alert ${worst}" role="alert" data-testid="risk-alert">
              <strong>${atRisk.length === 1 ? '1 course is' : `${atRisk.length} courses are`} below ${threshold}%</strong>
              <ul>${atRisk
                .map(
                  (c) =>
                    `<li>${esc(c.course.code)} ${esc(c.course.name)}: ${pctText(c.percentage)} — attend the next ${c.sessionsToThreshold} session${c.sessionsToThreshold === 1 ? '' : 's'} to get back to ${threshold}%.</li>`
                )
                .join('')}</ul>
            </div>`
          : ''
      }

      <div class="stats">
        <div class="card stat">
          <div class="stat-label">Overall attendance</div>
          <div class="stat-value">${pctText(overall.percentage)}</div>
          <div class="stat-note">${overall.attended} of ${overall.total} sessions</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Courses</div>
          <div class="stat-value">${courses.length}</div>
          <div class="stat-note">${courses.length - atRisk.length} on track</div>
        </div>
        <div class="card stat">
          <div class="stat-label">Late / absent</div>
          <div class="stat-value">${overall.late} / ${overall.absent}</div>
          <div class="stat-note">Late counts as attended</div>
        </div>
      </div>

      <div class="grid" data-testid="course-stats">
        ${courses
          .map(
            (c) => `<article class="card course-stat">
              <div class="course-stat-top">
                <span class="course-code">${esc(c.course.code)}</span>
                ${badge(c.level, c.label)}
              </div>
              <h2>${esc(c.course.name)}</h2>
              <div class="big-pct">${pctText(c.percentage)} <small>${c.attended}/${c.total}</small></div>
              ${bar(c.percentage, c.level, threshold)}
              <div class="meta">
                <span><strong>${c.present}</strong> present</span>
                <span><strong>${c.late}</strong> late</span>
                <span><strong>${c.absent}</strong> absent</span>
              </div>
            </article>`
          )
          .join('')}
      </div>

      <div class="section-title"><h2>Attendance history</h2><span class="muted" id="history-count"></span></div>
      <section class="card">
        <form class="filters" id="history-filters">
          <div class="field"><label for="f-course">Course</label>
            <select class="input" id="f-course" name="courseId">
              <option value="">All courses</option>
              ${courses.map((c) => `<option value="${esc(c.course.id)}">${esc(c.course.code)} · ${esc(c.course.name)}</option>`).join('')}
            </select></div>
          <div class="field"><label for="f-status">Status</label>
            <select class="input" id="f-status" name="status">
              <option value="">Any</option><option value="present">Present</option>
              <option value="late">Late</option><option value="absent">Absent</option>
            </select></div>
          <div class="field"><label for="f-from">From</label><input class="input" type="date" id="f-from" name="from" /></div>
          <div class="field"><label for="f-to">To</label><input class="input" type="date" id="f-to" name="to" /></div>
          <button class="btn btn-primary" type="submit">Apply</button>
          <button class="btn" type="reset">Reset</button>
        </form>
        <div class="table-scroll" id="history-table"></div>
      </section>`);

    const form = document.getElementById('history-filters');
    const load = async () => {
      const params = Object.fromEntries(new FormData(form).entries());
      const table = document.getElementById('history-table');
      try {
        const data = await Api.get(`/students/${user.id}/history${Api.qs(params)}`);
        document.getElementById('history-count').textContent =
          `${data.count} record${data.count === 1 ? '' : 's'}`;
        table.innerHTML = data.records.length
          ? `<table data-testid="history-table">
              <thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
              <tbody>${data.records
                .map(
                  (r) => `<tr><td class="num">${esc(formatDate(r.date))}</td>
                    <td>${esc(r.course.code || '')} <span class="muted hide-sm">${esc(r.course.name || '')}</span></td>
                    <td><span class="status-tag status-${esc(r.status)}">${esc(r.status)}</span></td></tr>`
                )
                .join('')}</tbody></table>`
          : '<div class="empty">No records match these filters.</div>';
      } catch (err) {
        toast(err.message, 'error');
      }
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      load();
    });
    form.addEventListener('reset', () => setTimeout(load, 0));
    await load();
  }

  window.Views = window.Views || {};
  window.Views.student = { dashboard };
})();
