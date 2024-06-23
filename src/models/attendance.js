const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  courseId: { type: String, ref: "Course", required: true },
  date: { type: Date, default: Date.now },
  status: String,
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
