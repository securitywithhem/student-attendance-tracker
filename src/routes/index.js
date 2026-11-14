const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateIdParam, requireDateQuery } = require('../middleware/validate');
const { authController } = require('../controllers/authController');
const { courseController } = require('../controllers/courseController');

/** Express 5 forwards rejected promises to the error handler, so handlers can be plain async. */
function buildApiRouter(c) {
  const router = express.Router();
  const auth = authController(c);
  const courses = courseController(c);
  const requireAuth = authenticate(c.authService);
  const courseId = validateIdParam('courseId');

  router.post('/auth/login', auth.login);
  router.get('/auth/me', requireAuth, auth.me);

  router.get('/courses', requireAuth, courses.list);
  router.get('/courses/:courseId/roster', requireAuth, courseId, courses.roster);
  router.get(
    '/courses/:courseId/attendance',
    requireAuth,
    courseId,
    requireDateQuery('date'),
    courses.session
  );
  router.post('/courses/:courseId/attendance', requireAuth, courseId, courses.mark);

  return router;
}

module.exports = { buildApiRouter };
