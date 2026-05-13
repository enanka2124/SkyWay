const mongoose = require('mongoose');

const connectDB = async () => {
  // Use the connection string from .env, fallback to local if not found.
  // The Atlas URI ensures the database is ALWAYS ONLINE without needing to "open mongo" locally.
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/skyway';

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
      console.error(`⚠️  MongoDB Connection Failed!`);
      console.error(`Reason: ${error.message}`);
      if (error.message.includes('Could not connect to any servers')) {
        console.error('👉 ACTION REQUIRED: Your IP address is likely not whitelisted in MongoDB Atlas.');
        console.error('👉 SOLUTION: Go to MongoDB Atlas > Network Access > Add IP Address > "Allow Access From Anywhere" (0.0.0.0/0).');
        console.error('   This ensures the database is ALWAYS active and accessible from your current location.');
      }
      console.log('🔄 Retrying in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    }
  };

  await connectWithRetry();
};

// Mongoose automatically handles reconnects after the initial connection is successful.
// We just log the events here to track the status.
mongoose.connection.on('disconnected', () => {
  console.warn('⚡ MongoDB disconnected. Mongoose will attempt to reconnect automatically in the background.');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;
