const config = require('./config');
const { createApp } = require('./app');
const { connectDatabase } = require('./db');
const { seedDatabase } = require('./seed/seed');

async function main() {
  const db = await connectDatabase(config.mongoUri);
  if (db.inMemory) console.log('Using in-memory MongoDB (data resets on restart).');
  if (config.seedOnStart) {
    const result = await seedDatabase();
    if (!result.skipped) console.log('Seeded demo data:', result);
  }
  const app = createApp();
  const server = app.listen(config.port, () =>
    console.log(`Attendance Tracker running on http://localhost:${config.port}`)
  );
  const shutdown = async () => {
    server.close();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
