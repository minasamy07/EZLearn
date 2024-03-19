const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// put feature for my user
const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, trim: true, required: true, minlength: 7 },

  tokens: [
    {
      token: { type: String, required: true },
    },
  ],
  avatar: { type: Buffer },
});

//hidding private data

teacherSchema.methods.toJSON = function () {
  const teacher = this;
  const teacherObject = teacher.toObject();

  delete teacherObject.password;
  delete teacherObject.tokens;
  delete teacherObject.avatar;
  return teacherObject;
};

//make tokeenss
teacherSchema.methods.generateAuthToken = async function () {
  const teacher = this;
  const token = jwt.sign(
    { _id: teacher._id.toString() },
    process.env.JWT_SECRET
  );
  teacher.tokens = teacher.tokens.concat({ token });
  await teacher.save();
  return token;
};

//find teacher by email and password

teacherSchema.statics.findByEmailAndPassword = async (email, password) => {
  const teacher = await Teacher.findOne({ email });
  if (!teacher) {
    throw new Error("Email is uncorrect");
  }

  const isMatch = await bcrypt.compare(password, teacher.password);
  if (!isMatch) {
    throw new Error("Password is uncorrect");
  }

  return teacher;
};

//before save, hash the password

teacherSchema.pre("save", async function (next) {
  const teacher = this;
  if (teacher.isModified("password")) {
    teacher.password = await bcrypt.hash(teacher.password, 8);
  }
  next();
});

//make and export schema

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = Teacher;
