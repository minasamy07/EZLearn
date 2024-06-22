const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  image: { type: Buffer, required: true },
  courseId: { type: String, ref: "Course", required: true },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
