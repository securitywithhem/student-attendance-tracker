// Thin API client. Stores the JWT in sessionStorage (cleared when the tab closes).
(function () {
  const TOKEN_KEY = 'sat.token';
  const USER_KEY = 'sat.user';

  class ApiError extends Error {
    constructor(status, body) {
      super((body && body.error && body.error.message) || `Request failed (${status})`);
      this.status = status;
      this.code = body && body.error && body.error.code;
      this.details = body && body.error && body.error.details;
    }
  }

  const session = {
    get token() {
      try {
        return sessionStorage.getItem(TOKEN_KEY);
      } catch {
        return null;
      }
    },
    get user() {
      try {
        return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
      } catch {
        return null;
      }
    },
    save(token, user) {
      try {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {
        /* storage unavailable: the session lasts until reload */
      }
      this._memory = { token, user };
    },
    clear() {
      try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      } catch {
        /* ignore */
      }
      this._memory = null;
    },
  };

  async function request(method, path, body) {
    const headers = { Accept: 'application/json' };
    const token = session.token || (session._memory && session._memory.token);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new ApiError(res.status, data);
      if (res.status === 401 && path !== '/auth/login') {
        window.dispatchEvent(new CustomEvent('sat:unauthorized'));
      }
      throw err;
    }
    return data;
  }

  const qs = (params) => {
    const s = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    return s ? `?${s}` : '';
  };

  window.Api = {
    ApiError,
    session,
    login: (email, password) => request('POST', '/auth/login', { email, password }),
    me: () => request('GET', '/auth/me'),
    courses: () => request('GET', '/courses'),
    roster: (courseId) => request('GET', `/courses/${courseId}/roster`),
    session_: (courseId, date) => request('GET', `/courses/${courseId}/attendance${qs({ date })}`),
    mark: (courseId, date, records) =>
      request('POST', `/courses/${courseId}/attendance`, { date, records }),
    get: (path) => request('GET', path),
    qs,
  };
})();
