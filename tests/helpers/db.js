// Starts one in-memory MongoDB per test file and connects Mongoose to it.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let server;

async function startTestDb() {
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri('attendance-test'));
  await mongoose.connection.syncIndexes();
}

async function stopTestDb() {
  await mongoose.disconnect();
  if (server) await server.stop();
}

module.exports = { startTestDb, stopTestDb };
