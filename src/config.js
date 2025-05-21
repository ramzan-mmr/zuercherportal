const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || `mongodb+srv://mianmuhammadramzan99:${encodeURIComponent('IKxzJlZJlRE6IYMm')}@cluster0.e3kd95j.mongodb.net/getyourguide_db?retryWrites=true&w=majority`;

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
