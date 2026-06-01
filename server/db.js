const mongoose = require('mongoose');

// ─── Constants ────────────────────────────────────────────────────────────────
const RETRY_INTERVAL_MS = 10_000; // 10s between retries
const MAX_RETRIES        = 50;    // keep trying for ~8 min total

/**
 * Converts  mongodb+srv://user:pass@cluster0.vzs6m3.mongodb.net/db
 * into      mongodb://user:pass@cluster0-shard-00-00.vzs6m3.mongodb.net:27017,
 *                               cluster0-shard-00-01.vzs6m3.mongodb.net:27017,
 *                               cluster0-shard-00-02.vzs6m3.mongodb.net:27017/db
 *                               ?ssl=true&authSource=admin
 *
 * Used as automatic fallback when the local DNS resolver blocks SRV lookups.
 */
function buildDirectUri(srvUri) {
  try {
    const match = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match) return null;

    const [, credentials, clusterHost, dbPart, queryPart] = match;
    const parts       = clusterHost.split('.');         // e.g. ['cluster0','vzs6m3','mongodb','net']
    const clusterName = parts[0];                       // cluster0
    const rest        = parts.slice(1).join('.');       // vzs6m3.mongodb.net

    const hosts = [0, 1, 2]
      .map(n => `${clusterName}-shard-00-0${n}.${rest}:27017`)
      .join(',');

    const dbPath = dbPart || '/';
    return `mongodb://${credentials}@${hosts}${dbPath}?authSource=admin&tls=true`;
  } catch {
    return null;
  }
}

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  // ── Guard: missing environment variable ──────────────────────────────────────
  if (!mongoURI) {
    console.error('\n❌  MONGO_URI is not set in your .env file!');
    console.error('──────────────────────────────────────────────────────────');
    console.error('👉  Create  server/.env  and add:');
    console.error('      MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/skyway');
    console.error('──────────────────────────────────────────────────────────');
    console.error('⚠️   Server will start but ALL database operations will fail.');
    console.error('    Fix the .env file and restart the server.\n');
    return;
  }

  let retries = 0;

  const tryConnect = async () => {
    // ── Attempt 1: original URI (mongodb+srv or mongodb://) ───────────────────
    try {
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return; // success
    } catch (err1) {
      const isSrvError = /querySrv|ENOTFOUND|ECONNREFUSED/i.test(err1.message);

      // ── Attempt 2: direct-host fallback (only when SRV lookup fails) ─────────
      if (isSrvError && mongoURI.startsWith('mongodb+srv://')) {
        const directUri = buildDirectUri(mongoURI);
        if (directUri) {
          try {
            console.warn('⚠️  SRV lookup failed — trying direct-host connection...');
            await mongoose.connect(directUri, { serverSelectionTimeoutMS: 12000 });
            console.log(`✅ MongoDB Connected (direct): ${mongoose.connection.host}`);
            return; // success via fallback
          } catch (err2) {
            console.error(`❌ Direct connection also failed: ${err2.message}`);
          }
        }
      } else {
        // ── Actionable hints ──────────────────────────────────────────────────
        if (/authentication failed|bad auth/i.test(err1.message)) {
          console.error('\n💡 Hint: Wrong username or password in MONGO_URI.');
          console.error('   Double-check your credentials in server/.env\n');
        } else if (/whitelist|network access|IP/i.test(err1.message)) {
          console.error('\n💡 Hint: Your IP is not whitelisted.');
          console.error('   Atlas → Network Access → Add 0.0.0.0/0\n');
        }
        console.error(`❌ MongoDB error (attempt ${retries + 1}): ${err1.message}`);
      }

      // ── Retry logic ──────────────────────────────────────────────────────────
      retries++;
      if (retries >= MAX_RETRIES) {
        console.error(`\n🛑 Gave up after ${MAX_RETRIES} attempts. Restart the server to try again.\n`);
        return;
      }
      console.log(`🔄 Retrying in ${RETRY_INTERVAL_MS / 1000}s... (${retries}/${MAX_RETRIES})`);
      setTimeout(tryConnect, RETRY_INTERVAL_MS);
    }
  };

  await tryConnect();
};

// ─── Connection lifecycle events ──────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚡ MongoDB disconnected. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  // Suppress SRV lookup noise (handled in tryConnect already)
  if (!/querySrv/i.test(err.message)) {
    console.error(`❌ MongoDB error: ${err.message}`);
  }
});

module.exports = connectDB;
