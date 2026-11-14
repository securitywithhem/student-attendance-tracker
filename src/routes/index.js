const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authController } = require('../controllers/authController');

/** Express 5 forwards rejected promises to the error handler, so handlers can be plain async. */
function buildApiRouter(c) {
  const router = express.Router();
  const auth = authController(c);
  const requireAuth = authenticate(c.authService);

  router.post('/auth/login', auth.login);
  router.get('/auth/me', requireAuth, auth.me);

  return router;
}

module.exports = { buildApiRouter };
