const { isValidObjectId } = require('mongoose');
const { ValidationError } = require('../utils/errors');
const { isCalendarDate } = require('../services/AttendanceValidator');

/** 400 instead of a database cast error when a :param is not a valid id. */
function validateIdParam(name) {
  return (req, _res, next) =>
    isValidObjectId(req.params[name]) && /^[a-f0-9]{24}$/i.test(req.params[name])
      ? next()
      : next(new ValidationError(`${name} is not a valid id`));
}

/** Requires ?<name>=YYYY-MM-DD. */
function requireDateQuery(name) {
  return (req, _res, next) =>
    isCalendarDate(req.query[name])
      ? next()
      : next(new ValidationError(`Query parameter "${name}" must be a date in YYYY-MM-DD format`));
}

module.exports = { validateIdParam, requireDateQuery };
