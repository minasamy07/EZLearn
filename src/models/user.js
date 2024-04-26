const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Course = require("./course");

// put feature for my user

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, unique: true, required: true },
  password: { type: String, required: true, trim: true, minlength: 7 },
  role: { type: String, required: true, enum: ["admin", "student", "teacher"] },
  tokens: [
    {
      token: { type: String, required: true },
    },
  ],
  avatar: { type: Buffer },
  // References to courses
  courseId: [{ type: String, ref: "Course", required: true }],
});

//hidding private data

UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  // delete userObject.avatar;
  return userObject;
};

//make tokenss
UserSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

//find user by email and password

UserSchema.statics.findByEmailAndPass = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Email is incorrect");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Password is incorrect");
  }

  return user;
};

//before save,hash the password

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
