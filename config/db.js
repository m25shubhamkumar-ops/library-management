const mongoose = require('mongoose');
let lastConnectionError = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/library_db';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    lastConnectionError = null;
    return conn;
  } catch (error) {
    lastConnectionError = error.message;
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn('[MongoDB] Please ensure MongoDB is running locally or set a valid MONGO_URI in .env');
    // We do not crash the process here so that routes and static assets remain accessible
  }
};

const getConnectionError = () => lastConnectionError;

module.exports = connectDB;
module.exports.getConnectionError = getConnectionError;
