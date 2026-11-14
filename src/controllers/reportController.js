/** HTTP adapter for the read side (dashboards, history, summaries). */
function reportController({ attendanceQueryService: q }) {
  return {
    async studentSummary(req, res) {
      res.json(await q.studentSummary(req.user, req.params.studentId));
    },
    async studentHistory(req, res) {
      res.json(await q.studentHistory(req.user, req.params.studentId, req.filters));
    },
    async courseSummary(req, res) {
      res.json(await q.courseSummary(req.user, req.params.courseId));
    },
    async adminOverview(req, res) {
      res.json(await q.adminOverview(req.user));
    },
  };
}

module.exports = { reportController };
