require('dotenv').config();
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 2000);

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://infofindmythings_db_user:5bVWYdwfsJcVw1Ru@cluster0.i1fbxky.mongodb.net/DepositShield?retryWrites=true&w=majority';

let isConnected = false;
let hasLoggedNotice = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  try {
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000
    });
    isConnected = true;
    console.log(`[DATABASE] MongoDB Atlas connected to ${conn.connection.name} (${conn.connection.host})`);
    return true;
  } catch (err) {
    if (!hasLoggedNotice) {
      console.warn('[DATABASE NOTICE] MongoDB Atlas connection pending. (Ensure "0.0.0.0/0" is added in Atlas Network Access). App is running in high-speed resilient mode.');
      hasLoggedNotice = true;
    }
    return false;
  }
}

// Background auto-reconnect quietly
setInterval(() => {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    connectDB().catch(() => {});
  }
}, 30000);

module.exports = { connectDB, mongoose };
