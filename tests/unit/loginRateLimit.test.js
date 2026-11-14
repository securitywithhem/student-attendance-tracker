const { EventEmitter } = require('events');
const { loginRateLimit, TooManyRequestsError } = require('../../src/middleware/loginRateLimit');

function attempt(limiter, status, email = 'a@sat.edu') {
  const res = Object.assign(new EventEmitter(), { statusCode: status, set: () => {} });
  let error;
  limiter({ ip: '1.2.3.4', body: { email } }, res, (err) => (error = err));
  if (!error) res.emit('finish');
  return error;
}

test('blocks after maxFailures and unblocks when the window passes', () => {
  let t = 0;
  const limiter = loginRateLimit({ maxFailures: 3, windowMs: 1000, now: () => t });
  for (let i = 0; i < 3; i += 1) expect(attempt(limiter, 401)).toBeUndefined();
  expect(attempt(limiter, 401)).toBeInstanceOf(TooManyRequestsError);
  t = 1001;
  expect(attempt(limiter, 401)).toBeUndefined();
});

test('a successful login resets the counter', () => {
  const limiter = loginRateLimit({ maxFailures: 2, windowMs: 1000, now: () => 0 });
  attempt(limiter, 401);
  attempt(limiter, 200);
  attempt(limiter, 401);
  expect(attempt(limiter, 401)).toBeUndefined();
});
