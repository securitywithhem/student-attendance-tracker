const { isValidObjectId } = require('mongoose');
const { ValidationError } = require('../utils/errors');
const { isCalendarDate } = require('../services/AttendanceValidator');
const { STATUSES } = require('../models/Attendance');

/** Validates ?courseId&status&from&to and puts a clean object on req.filters. */
function historyFilters(req, _res, next) {
  const { courseId, status, from, to } = req.query;
  const filters = {};
  const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

  if (str(courseId)) {
    if (!isValidObjectId(courseId) || !/^[a-f0-9]{24}$/i.test(courseId)) {
      return next(new ValidationError('courseId is not a valid id'));
    }
    filters.courseId = courseId;
  }
  if (str(status)) {
    if (!STATUSES.includes(status)) {
      return next(new ValidationError(`status must be one of: ${STATUSES.join(', ')}`));
    }
    filters.status = status;
  }
  for (const [key, value] of [
    ['from', from],
    ['to', to],
  ]) {
    if (str(value)) {
      if (!isCalendarDate(value)) return next(new ValidationError(`${key} must be YYYY-MM-DD`));
      filters[key] = value;
    }
  }
  if (filters.from && filters.to && filters.from > filters.to) {
    return next(new ValidationError('"from" must be on or before "to"'));
  }
  req.filters = filters;
  return next();
}

module.exports = { historyFilters };
