// Hash router and session handling.
(function () {
  const Api = window.Api;
  const { toast, render, esc } = window.UI;

  function currentUser() {
    return Api.session.user || (Api.session._memory && Api.session._memory.user);
  }

  function showTopbar(user) {
    document.getElementById('topbar').hidden = !user;
    if (!user) return;
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = user.role;
  }

  function logout() {
    Api.session.clear();
    showTopbar(null);
    location.hash = '#/login';
    route();
  }

  // Routes per role. Each handler receives the regex match.
  const ROUTES = {
    faculty: [
      [/^#\/course\/([a-f0-9]{24})$/, (m) => window.Views.faculty.coursePage(m[1])],
      [/^#\/?$/, () => window.Views.faculty.courseList()],
    ],
  };

  async function route() {
    const user = currentUser();
    if (!user) {
      showTopbar(null);
      window.Views.login({
        onLogin: (u) => {
          showTopbar(u);
          location.hash = '#/';
          route();
        },
      });
      return;
    }
    showTopbar(user);
    const hash = location.hash === '#/login' ? '#/' : location.hash || '#/';
    const routes = ROUTES[user.role] || [];
    const match = routes.map(([re, fn]) => [re.exec(hash), fn]).find(([m]) => m);
    try {
      if (match) await match[1](match[0]);
      else
        render(`<div class="card empty">Nothing here yet for the ${esc(user.role)} role.
          <p><a href="#/">Back to start</a></p></div>`);
    } catch (err) {
      if (err.status === 401) return;
      render(
        `<div class="card empty">${esc(err.message)}<p><a href="#/">Back to start</a></p></div>`
      );
    }
  }

  window.addEventListener('sat:unauthorized', () => {
    toast('Your session has ended. Please sign in again.', 'error');
    logout();
  });
  window.addEventListener('hashchange', route);
  document.getElementById('logout-btn').addEventListener('click', logout);

  route();
})();
