const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/threadcraft_custom_tshirts';

    // Attempt standard connection with a short serverSelectionTimeout
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500,
      });
      console.log(`[MongoDB] Connected to ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (primaryErr) {
      // Brief #24: never fall back to a throwaway in-memory DB in production.
      if (isProd) {
        throw primaryErr;
      }
      console.warn(`[MongoDB] Local MongoDB connection failed (${primaryErr.message}).`);
      console.log(`[MongoDB] Dev fallback: initializing embedded in-memory MongoDB engine...`);

      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'threadcraft_custom_tshirts'
        }
      });
      const inMemoryUri = mongodInstance.getUri();
      const conn = await mongoose.connect(inMemoryUri);
      console.log(`[MongoDB] Embedded In-Memory Database online and ready at: ${inMemoryUri}`);
      return conn;
    }
  } catch (error) {
    console.error(`[MongoDB] Database initialization error: ${error.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (error) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};

module.exports = { connectDB, closeDB };
