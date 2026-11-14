// Admin overview: totals and per-course health; drill into any course summary.
(function () {
  const { esc, render, loading } = window.UI;
  const { pctText, summaryTable } = window.Shared;
  const Api = window.Api;

  async function overview() {
    loading('Loading overview…');
    const data = await Api.get('/admin/overview');
    render(`
      <div class="page-head"><div><h1>Department overview</h1>
        <p>All courses · threshold ${data.threshold}%</p></div></div>
      <div class="stats">
        <div class="card stat"><div class="stat-label">Students</div><div class="stat-value">${data.users.student}</div></div>
        <div class="card stat"><div class="stat-label">Faculty</div><div class="stat-value">${data.users.faculty}</div></div>
        <div class="card stat"><div class="stat-label">Courses</div><div class="stat-value">${data.courses.length}</div></div>
        <div class="card stat"><div class="stat-label">Sessions recorded</div><div class="stat-value">${data.sessions}</div></div>
      </div>
      <section class="card table-scroll">
        <table>
          <thead><tr><th>Course</th><th class="hide-sm">Faculty</th><th class="num">Students</th><th class="num">Sessions</th><th class="num">Average</th><th class="num">Below ${data.threshold}%</th><th></th></tr></thead>
          <tbody>${data.courses
            .map(
              (c) => `<tr>
                <td><span class="course-code">${esc(c.course.code)}</span> ${esc(c.course.name)}</td>
                <td class="hide-sm">${esc(c.facultyName || '')}</td>
                <td class="num">${c.studentCount}</td>
                <td class="num">${c.sessionsHeld}</td>
                <td class="num">${pctText(c.average)}</td>
                <td class="num">${c.belowThreshold}</td>
                <td><a href="#/course/${esc(c.course.id)}/summary">View</a></td>
              </tr>`
            )
            .join('')}</tbody>
        </table>
      </section>`);
  }

  async function courseSummary(courseId) {
    loading('Loading course summary…');
    const s = await Api.get(`/courses/${courseId}/summary`);
    render(`
      <a class="back-link" href="#/">← Overview</a>
      <div class="page-head"><div><span class="course-code">${esc(s.course.code)}</span>
        <h1>${esc(s.course.name)}</h1></div></div>
      ${summaryTable(s)}`);
  }

  window.Views = window.Views || {};
  window.Views.admin = { overview, courseSummary };
})();
