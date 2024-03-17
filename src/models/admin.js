const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// put feature for my user
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, unique: true, required: true },
  password: { type: String, required: true, trim: true, minlength: 7 },

  tokens: [
    {
      token: { type: String, required: true },
    },
  ],
  avatar: { type: Buffer },
});

adminSchema.methods.generateAuthToken = async function () {
  const admin = this;
  const token = jwt.sign;
};
