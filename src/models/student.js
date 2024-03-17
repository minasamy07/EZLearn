const mongoose = require("mongoose");

// put feature for my user
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, trim: true, minlength: 7 },

  tokens: [
    {
      token: { type: String, required: true },
    },
  ],

  avatar: { type: Buffer },
});
