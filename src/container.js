// Composition root: the only place that knows concrete classes. Everything else receives its
// dependencies (Dependency Inversion), which is what lets unit tests swap in in-memory fakes.
const config = require('./config');
const { MongoUserRepository } = require('./repositories/mongo/MongoUserRepository');
const { MongoCourseRepository } = require('./repositories/mongo/MongoCourseRepository');
const { MongoAttendanceRepository } = require('./repositories/mongo/MongoAttendanceRepository');
const { AuthService } = require('./services/AuthService');
const { JwtTokenService } = require('./services/JwtTokenService');
const { BcryptPasswordHasher } = require('./services/BcryptPasswordHasher');
const { CourseService } = require('./services/CourseService');
const { AttendanceRecorder } = require('./services/AttendanceRecorder');
const { AttendanceValidator } = require('./services/AttendanceValidator');

function buildContainer(overrides = {}) {
  const settings = { ...config, ...overrides };
  const userRepository = new MongoUserRepository();
  const courseRepository = new MongoCourseRepository();
  const attendanceRepository = new MongoAttendanceRepository();

  const authService = new AuthService({
    userRepository,
    passwordHasher: new BcryptPasswordHasher(),
    tokenService: new JwtTokenService({
      secret: settings.jwtSecret,
      expiresIn: settings.jwtExpiresIn,
    }),
  });

  const courseService = new CourseService({
    courseRepository,
    userRepository,
    attendanceRepository,
  });
  const attendanceRecorder = new AttendanceRecorder({
    courseRepository,
    attendanceRepository,
    validator: new AttendanceValidator(),
  });

  return {
    userRepository,
    courseRepository,
    attendanceRepository,
    authService,
    courseService,
    attendanceRecorder,
  };
}

module.exports = { buildContainer };
