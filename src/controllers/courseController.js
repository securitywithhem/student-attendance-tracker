/** HTTP adapter for the faculty side: no business rules here, only request/response mapping. */
function courseController({ courseService, attendanceRecorder }) {
  return {
    async list(req, res) {
      res.json({ courses: await courseService.listForUser(req.user) });
    },
    async roster(req, res) {
      res.json(await courseService.getRoster(req.user, req.params.courseId));
    },
    async session(req, res) {
      res.json(await courseService.getSession(req.user, req.params.courseId, req.query.date));
    },
    async mark(req, res) {
      const { date, records } = req.body || {};
      const result = await attendanceRecorder.markAttendance({
        user: req.user,
        courseId: req.params.courseId,
        date,
        records,
      });
      res.status(201).json(result);
    },
  };
}

module.exports = { courseController };
