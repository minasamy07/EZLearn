const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

//hidding private data

studentSchema.methods.toJSON = function () {
  const student = this;
  const studentObject = student.toObject();

  delete studentObject.password;
  delete studentObject.tokens;
  delete studentObject.avatar;
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
    throw new Error("Email is uncorrect");
  }

  const isMatch = await bcrypt.compare(password, student.password);
  if (!isMatch) {
    throw new Error("Password is uncorrect");
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
