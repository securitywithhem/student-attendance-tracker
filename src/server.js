const config = require('./config');
const { createApp } = require('./app');

async function main() {
  const app = createApp();
  app.listen(config.port, () =>
    console.log(`Attendance Tracker running on http://localhost:${config.port}`)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
