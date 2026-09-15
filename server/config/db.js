const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If MONGO_URI is not set or requested memory db, use MongoMemoryServer for dev/test
    if (!mongoUri || process.env.USE_MEMORY_DB === 'true') {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        mongoUri = memoryServer.getUri();
        console.log(`[Database] Using in-memory MongoDB instance at: ${mongoUri}`);
      } catch (err) {
        console.warn('[Database] mongodb-memory-server could not start, falling back to default URI');
        mongoUri = mongoUri || 'mongodb://127.0.0.1:27017/skillloop';
      }
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    // If not in test, exit
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (error) {
    console.error('[Database Disconnect Error]', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
