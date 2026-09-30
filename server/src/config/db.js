const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

async function connectDb(uri) {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectDb };
