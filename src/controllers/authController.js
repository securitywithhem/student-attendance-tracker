function authController({ authService, userRepository }) {
  return {
    async login(req, res) {
      const { email, password } = req.body || {};
      res.json(await authService.login(email, password));
    },
    async me(req, res) {
      res.json({ user: await userRepository.findById(req.user.id) });
    },
  };
}

module.exports = { authController };
