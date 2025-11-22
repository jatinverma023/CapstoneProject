// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Modern mongoose/drivers don't require useNewUrlParser/useUnifiedTopology options.
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event handlers (optional)
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // In development keep process alive so nodemon can help you fix env/connection quickly.
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
