const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const course = require("./courses");

// put feature for my user
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true, trim: true, minlength: 7 },
  stuId: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 4,
    maxlength: 4,
  },

  tokens: [
    {
      token: { type: String, required: true },
    },
  ],

  courseId: [
    {
      type: String,
      ref: course,
    },
  ],

  avatar: { type: Buffer },
});

//hidding private data

studentSchema.methods.toJSON = function () {
  const student = this;
  const studentObject = student.toObject();

  delete studentObject.password;
  delete studentObject.tokens;
  // delete studentObject.avatar;
  return studentObject;
};

//make tokenss
studentSchema.methods.generateAuthToken = async function () {
  const student = this;
  const token = jwt.sign(
    { _id: student._id.toString() },
    process.env.JWT_SECRET
  );
  student.tokens = student.tokens.concat({ token });
  await student.save();
  return token;
};

//find student by email and password
studentSchema.statics.findByEmailAndPassword = async (email, password) => {
  const student = await Student.findOne({ email });
  if (!student) {
    throw new Error("Email is incorrect");
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    throw new Error("Password is incorrect");
  }

  return student;
};

//before save, hash password

studentSchema.pre("save", async function (next) {
  const student = this;
  if (student.isModified("password")) {
    student.password = await bcrypt.hash(student.password, 8);
  }
  next();
});

//make and export schema

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
