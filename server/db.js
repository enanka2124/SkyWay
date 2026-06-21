const mongoose = require('mongoose');

const RETRY_INTERVAL_MS = 10_000;
const MAX_RETRIES = 50;

// Builds a direct mongodb:// URI from a mongodb+srv:// one.
// Used as a fallback when the local DNS resolver blocks SRV lookups.
function buildDirectUri(srvUri) {
  try {
    const match = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match) return null;

    const [, credentials, clusterHost, dbPart, queryPart] = match;
    const parts = clusterHost.split('.');
    const clusterName = parts[0];
    const rest = parts.slice(1).join('.');

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

  if (!mongoURI) {
    console.error('MONGO_URI is not set in .env. Database operations will fail.');
    return;
  }

  let retries = 0;

  const tryConnect = async () => {
    try {
      await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 8000 });
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err1) {
      const isSrvError = /querySrv|ENOTFOUND|ECONNREFUSED/i.test(err1.message);

      // try direct-host connection if SRV lookup failed
      if (isSrvError && mongoURI.startsWith('mongodb+srv://')) {
        const directUri = buildDirectUri(mongoURI);
        if (directUri) {
          try {
            console.warn('SRV lookup failed, trying direct-host connection...');
            await mongoose.connect(directUri, { serverSelectionTimeoutMS: 12000 });
            console.log(`MongoDB connected (direct): ${mongoose.connection.host}`);
            return;
          } catch (err2) {
            console.error(`Direct connection also failed: ${err2.message}`);
          }
        }
      } else {
        if (/authentication failed|bad auth/i.test(err1.message)) {
          console.error('Hint: wrong username or password in MONGO_URI.');
        } else if (/whitelist|network access|IP/i.test(err1.message)) {
          console.error('Hint: your IP is not whitelisted in Atlas Network Access.');
        }
        console.error(`MongoDB connection error (attempt ${retries + 1}): ${err1.message}`);
      }

      retries++;
      if (retries >= MAX_RETRIES) {
        console.error(`Gave up after ${MAX_RETRIES} attempts. Restart the server to retry.`);
        return;
      }
      console.log(`Retrying in ${RETRY_INTERVAL_MS / 1000}s... (${retries}/${MAX_RETRIES})`);
      setTimeout(tryConnect, RETRY_INTERVAL_MS);
    }
  };

  await tryConnect();
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

mongoose.connection.on('error', (err) => {
  if (!/querySrv/i.test(err.message)) {
    console.error(`MongoDB error: ${err.message}`);
  }
});

module.exports = connectDB;
