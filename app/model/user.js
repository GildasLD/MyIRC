const mongoose = require("mongoose");
let { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
  },
  login: { type: String, unique: true },
  email: { type: String, unique: false, required: false },
  password: { type: String },
  type: { type: Boolean, default: false },
  token: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("user", userSchema);
