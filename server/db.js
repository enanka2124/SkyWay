const mongoose = require('mongoose');

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_RETRY_MS   = 5_000;   // 5 s first retry
const MAX_RETRY_MS       = 30_000;  // cap at 30 s
const MAX_RETRIES        = 10;      // stop after 10 consecutive failures

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // ── Guard: missing environment variable ────────────────────────────────────
  if (!mongoURI) {
    console.error('\n❌  MONGO_URI is not set in your .env file!');
    console.error('──────────────────────────────────────────────────────────');
    console.error('👉  Create  server/.env  and add:');
    console.error('      MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/skyway');
    console.error('──────────────────────────────────────────────────────────');
    console.error('⚠️   Server will start but ALL database operations will fail.');
    console.error('    Fix the .env file and restart the server.\n');
    return; // don't retry — it's a config error, not a network error
  }

  let retries    = 0;
  let retryDelay = INITIAL_RETRY_MS;

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    } catch (error) {
      retries++;
      console.error(`\n❌ MongoDB connection error (attempt ${retries}/${MAX_RETRIES})`);
      console.error(`   Reason: ${error.message}`);

      // ── Actionable hints ──────────────────────────────────────────────────
      if (/ECONNREFUSED.*127\.0\.0\.1/.test(error.message)) {
        console.error('\n💡 Hint: The URI is pointing to localhost but no local MongoDB is running.');
        console.error('   Make sure MONGO_URI in server/.env points to MongoDB Atlas, not localhost.\n');
      } else if (/whitelist|network access|IP/i.test(error.message)) {
        console.error('\n💡 Hint: Your current IP may not be whitelisted.');
        console.error('   Go to MongoDB Atlas → Network Access → Add IP Address → Allow 0.0.0.0/0\n');
      } else if (/authentication failed|bad auth/i.test(error.message)) {
        console.error('\n💡 Hint: Invalid MongoDB credentials.');
        console.error('   Double-check the username/password in your MONGO_URI inside server/.env\n');
      }

      // ── Stop retrying after MAX_RETRIES ───────────────────────────────────
      if (retries >= MAX_RETRIES) {
        console.error(`\n🛑 Giving up after ${MAX_RETRIES} failed attempts.`);
        console.error('   Fix the connection issue and restart the server.\n');
        return;
      }

      // ── Exponential back-off (capped) ─────────────────────────────────────
      console.log(`🔄 Retrying in ${retryDelay / 1000}s...\n`);
      setTimeout(connectWithRetry, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
    }
  };

  await connectWithRetry();
};

// ─── Connection lifecycle events ──────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚡ MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;
