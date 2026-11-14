const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { historyFilters } = require('../middleware/historyFilters');
const { loginRateLimit } = require('../middleware/loginRateLimit');
const { validateIdParam, requireDateQuery } = require('../middleware/validate');
const { authController } = require('../controllers/authController');
const { courseController } = require('../controllers/courseController');
const { reportController } = require('../controllers/reportController');

/** Express 5 forwards rejected promises to the error handler, so handlers can be plain async. */
function buildApiRouter(c) {
  const router = express.Router();
  const auth = authController(c);
  const courses = courseController(c);
  const reports = reportController(c);
  const requireAuth = authenticate(c.authService);
  const courseId = validateIdParam('courseId');
  const studentId = validateIdParam('studentId');

  router.post('/auth/login', loginRateLimit(c.loginRateLimit), auth.login);
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

  router.get('/courses/:courseId/summary', requireAuth, courseId, reports.courseSummary);

  router.get('/students/:studentId/summary', requireAuth, studentId, reports.studentSummary);
  router.get(
    '/students/:studentId/history',
    requireAuth,
    studentId,
    historyFilters,
    reports.studentHistory
  );

  router.get('/admin/overview', requireAuth, requireRole('admin'), reports.adminOverview);

  return router;
}

module.exports = { buildApiRouter };
