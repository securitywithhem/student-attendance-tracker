(function () {
  const { esc, render } = window.UI;

  const DEMO = [
    ['Admin', 'admin@sat.edu'],
    ['Faculty', 'faculty1@sat.edu'],
    ['Student', 'student01@sat.edu'],
    ['At-risk student', 'student04@sat.edu'],
  ];

  function loginView({ onLogin }) {
    render(`
      <div class="login-wrap">
        <form class="card login-card" id="login-form" novalidate>
          <h1>Sign in</h1>
          <p class="sub">Student Attendance Tracker</p>
          <p class="form-error" id="login-error" hidden></p>
          <div class="field">
            <label for="email">Email</label>
            <input class="input" id="email" name="email" type="email" autocomplete="username" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input class="input" id="password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <button class="btn btn-primary" id="login-submit" type="submit" style="width:100%">Sign in</button>
          <div class="demo">
            <p>Demo accounts (password <code>Password@123</code>)</p>
            <div class="demo-buttons">
              ${DEMO.map(
                ([label, email]) =>
                  `<button class="btn btn-sm" type="button" data-email="${esc(email)}">${esc(label)}</button>`
              ).join('')}
            </div>
          </div>
        </form>
      </div>`);

    const form = document.getElementById('login-form');
    const error = document.getElementById('login-error');
    const submit = document.getElementById('login-submit');

    form.addEventListener('click', (e) => {
      const email = e.target.dataset && e.target.dataset.email;
      if (!email) return;
      form.email.value = email;
      form.password.value = 'Password@123';
      form.password.focus();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      submit.disabled = true;
      submit.textContent = 'Signing in…';
      try {
        const { token, user } = await window.Api.login(
          form.email.value.trim(),
          form.password.value
        );
        window.Api.session.save(token, user);
        onLogin(user);
      } catch (err) {
        error.textContent = err.message;
        error.hidden = false;
      } finally {
        submit.disabled = false;
        submit.textContent = 'Sign in';
      }
    });

    form.email.focus();
  }

  window.Views = window.Views || {};
  window.Views.login = loginView;
})();
