const mongoose = require('mongoose');

/**
 * Connects to MongoDB. With no URI, starts an in-memory MongoDB so the app runs with zero setup.
 * Returns a `close()` that also stops the in-memory server.
 */
async function connectDatabase(uri) {
  let memoryServer = null;
  let target = uri;
  if (!target) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    target = memoryServer.getUri('attendance');
  }
  await mongoose.connect(target);
  await mongoose.connection.syncIndexes();
  return {
    inMemory: Boolean(memoryServer),
    async close() {
      await mongoose.disconnect();
      if (memoryServer) await memoryServer.stop();
    },
  };
}

module.exports = { connectDatabase };
