const mongoose = require("mongoose");

async function db() {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log(`Connected to ${process.env.MONGO_DB}`);
  } catch (error) {
    console.log(error);
  }
}

module.exports = db;
