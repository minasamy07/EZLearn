const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

//hidding private data

adminSchema.methods.toJSON = function () {
  const admin = this;
  const adminObject = admin.toObject();

  delete adminObject.password;
  delete adminObject.tokens;
  delete adminObject.avatar;
  return adminObject;
};

//make tokenss
adminSchema.methods.generateAuthToken = async function () {
  const admin = this;
  const token = jwt.sign({ _id: admin._id.toString() }, process.env.JWT_SECRET);
  admin.tokens = admin.tokens.concat({ token });
  await admin.save();
  return token;
};

//find admin by email and password

adminSchema.statics.findByEmailAndPass = async (email, password) => {
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new Error("Email is uncorrect");
  }
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    throw new Error("Password is uncorrect");
  }

  return admin;
};

//before save,hash the password

adminSchema.pre("save", async function (next) {
  const admin = this;
  if (admin.isModified("password")) {
    admin.password = await bcrypt.hash(admin.password, 8);
  }
  next();
});

//make and export schema
const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
