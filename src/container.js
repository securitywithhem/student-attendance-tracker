// Composition root: the only place that knows concrete classes. Everything else receives its
// dependencies (Dependency Inversion), which is what lets unit tests swap in in-memory fakes.
const config = require('./config');
const { MongoUserRepository } = require('./repositories/mongo/MongoUserRepository');
const { MongoCourseRepository } = require('./repositories/mongo/MongoCourseRepository');
const { MongoAttendanceRepository } = require('./repositories/mongo/MongoAttendanceRepository');
const { AuthService } = require('./services/AuthService');
const { JwtTokenService } = require('./services/JwtTokenService');
const { BcryptPasswordHasher } = require('./services/BcryptPasswordHasher');

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

  return { userRepository, courseRepository, attendanceRepository, authService };
}

module.exports = { buildContainer };
