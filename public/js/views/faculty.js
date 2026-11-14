// Faculty: course list (SAT-12), roster (SAT-13) and daily marking (SAT-14).
(function () {
  const { esc, render, toast, today, formatDate, loading } = window.UI;
  const Api = window.Api;

  const STATUSES = [
    ['present', 'Present'],
    ['late', 'Late'],
    ['absent', 'Absent'],
  ];

  async function courseList() {
    loading('Loading your courses…');
    const { courses } = await Api.courses();
    render(`
      <div class="page-head">
        <div>
          <h1>Your courses</h1>
          <p>Choose a course to take today's attendance.</p>
        </div>
      </div>
      ${
        courses.length
          ? `<div class="grid">${courses
              .map(
                (c) => `
            <a class="card course-card" href="#/course/${esc(c.id)}" data-testid="course-card">
              <span class="course-code">${esc(c.code)}</span>
              <h2>${esc(c.name)}</h2>
              <div class="meta">
                <span><strong>${c.studentCount}</strong> students</span>
                <span><strong>${c.sessionsHeld}</strong> sessions held</span>
              </div>
            </a>`
              )
              .join('')}</div>`
          : '<div class="card empty">You are not assigned to any course yet.</div>'
      }`);
  }

  function counts(state) {
    const c = { present: 0, late: 0, absent: 0 };
    Object.values(state).forEach((s) => (c[s] += 1));
    return c;
  }

  async function coursePage(courseId, date = today()) {
    loading('Loading roster…');
    const [roster, existing] = await Promise.all([
      Api.roster(courseId),
      Api.session_(courseId, date),
    ]);
    const { course, students } = roster;
    const state = Object.fromEntries(students.map((s) => [s.id, 'present']));

    const head = `
      <a class="back-link" href="#/">← All courses</a>
      <div class="page-head">
        <div>
          <span class="course-code">${esc(course.code)}</span>
          <h1>${esc(course.name)}</h1>
          <p>${students.length} students enrolled</p>
        </div>
      </div>`;

    const dateControl = `
      <label class="muted" for="att-date">Date</label>
      <input class="input input-inline" type="date" id="att-date" value="${esc(date)}" max="${today()}" />`;

    if (existing.marked) {
      const c = { present: 0, late: 0, absent: 0 };
      existing.records.forEach((r) => (c[r.status] += 1));
      render(`${head}
        <section class="card">
          <div class="toolbar">
            <div class="toolbar-left">${dateControl}</div>
            <div class="counts">
              <span class="pill pill-present">${c.present} present</span>
              <span class="pill pill-late">${c.late} late</span>
              <span class="pill pill-absent">${c.absent} absent</span>
            </div>
          </div>
          <div class="banner" data-testid="already-marked">
            Attendance for ${esc(formatDate(date))} is already recorded. Records cannot be submitted twice.
          </div>
          <table>
            <thead><tr><th>Roll no.</th><th>Student</th><th>Status</th></tr></thead>
            <tbody>
              ${existing.records
                .map(
                  (r) => `<tr>
                    <td class="num">${esc(r.student.rollNo)}</td>
                    <td>${esc(r.student.name)}</td>
                    <td><span class="status-tag status-${esc(r.status)}">${esc(r.status)}</span></td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </section>`);
      bindDate(courseId);
      return;
    }

    render(`${head}
      <section class="card">
        <div class="toolbar">
          <div class="toolbar-left">${dateControl}</div>
          <div class="toolbar-right">
            <button class="btn btn-sm" type="button" data-all="present">All present</button>
            <button class="btn btn-sm" type="button" data-all="absent">All absent</button>
          </div>
        </div>
        <table>
          <thead><tr><th>Roll no.</th><th>Student</th><th class="hide-sm">Email</th><th>Status</th></tr></thead>
          <tbody>
            ${students
              .map(
                (s) => `<tr data-student="${esc(s.id)}">
                  <td class="num">${esc(s.rollNo)}</td>
                  <td>${esc(s.name)}</td>
                  <td class="hide-sm muted">${esc(s.email)}</td>
                  <td>
                    <div class="seg" role="radiogroup" aria-label="Status for ${esc(s.name)}">
                      ${STATUSES.map(
                        ([value, label]) => `<label>
                          <input type="radio" name="st-${esc(s.id)}" value="${value}" ${value === 'present' ? 'checked' : ''} />
                          <span>${label}</span>
                        </label>`
                      ).join('')}
                    </div>
                  </td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
        <div class="savebar">
          <div class="counts" id="counts"></div>
          <button class="btn btn-primary" id="save-btn" type="button">Save attendance</button>
        </div>
      </section>`);

    const countsEl = document.getElementById('counts');
    const saveBtn = document.getElementById('save-btn');
    const refresh = () => {
      const c = counts(state);
      countsEl.innerHTML = `
        <span class="pill pill-present">${c.present} present</span>
        <span class="pill pill-late">${c.late} late</span>
        <span class="pill pill-absent">${c.absent} absent</span>`;
      saveBtn.textContent = `Save attendance for ${formatDate(date)}`;
    };
    refresh();

    document.querySelector('#app section.card').addEventListener('change', (e) => {
      const row = e.target.closest('tr[data-student]');
      if (row && e.target.type === 'radio') {
        state[row.dataset.student] = e.target.value;
        refresh();
      }
    });

    document.querySelectorAll('[data-all]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const status = btn.dataset.all;
        Object.keys(state).forEach((id) => (state[id] = status));
        document
          .querySelectorAll(`input[type=radio][value="${status}"]`)
          .forEach((input) => (input.checked = true));
        refresh();
      })
    );

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      try {
        const records = Object.entries(state).map(([studentId, status]) => ({ studentId, status }));
        const result = await Api.mark(courseId, date, records);
        toast(
          `Saved ${result.saved} records for ${formatDate(date)} (${result.summary.present} present, ${result.summary.late} late, ${result.summary.absent} absent).`,
          'success'
        );
        await coursePage(courseId, date);
      } catch (err) {
        toast(err.message, 'error');
        if (err.status === 409) await coursePage(courseId, date);
        else saveBtn.disabled = false;
      }
    });

    bindDate(courseId);
  }

  function bindDate(courseId) {
    const input = document.getElementById('att-date');
    input.addEventListener('change', () => {
      if (input.value) coursePage(courseId, input.value).catch((e) => toast(e.message, 'error'));
    });
  }

  window.Views = window.Views || {};
  window.Views.faculty = { courseList, coursePage };
})();
