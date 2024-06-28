const express = require("express");
const router = new express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const Attendance = require("../models/attendance");
const User = require("../models/user");
const bodyParser = require("body-parser");
const cors = require("cors");
const upload = multer({
  limits: {
    fileSize: 10000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Please upload an image (jpg, jpeg, or png)"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/attendance",
  upload.single("attendanceImage"),
  async (req, res) => {
    try {
      console.log("Received file:", req.file);
      console.log("Received courseId:", req.body.courseId);

      // Send image to AI server for recognition
      const formData = new FormData();
      formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const aiResponse = await axios.post(
        `http://127.0.0.1:8010/recognize_face?course_id=${req.body.courseId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      console.log("AI response:", aiResponse.data);

      const recognizedStudents = aiResponse.data.recognition_results.map(
        (result) => result.student_id
      );

      const unknownFaces = aiResponse.data.recognition_results.filter(
        (result) => result.student_id === "Unknown"
      );

      // Mark attendance for recognized students
      const alreadyAttended = [];
      const newlyMarked = [];

      for (const studentId of recognizedStudents) {
        if (studentId !== "Unknown") {
          // Check if the student has already been marked present for the same course on the same day
          const alreadyPresent = await Attendance.findOne({
            studentId,
            courseId: req.body.courseId,
            date: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          });

          if (alreadyPresent) {
            alreadyAttended.push(studentId);
          } else {
            const attendanceRecord = new Attendance({
              studentId,
              courseId: req.body.courseId,
              date: new Date(),
              status: "Present",
            });
            await attendanceRecord.save();
            newlyMarked.push(studentId);
          }
        }
      }

      res.status(200).json({
        message: "Attendance marked successfully",
        recognizedStudents: newlyMarked,
        alreadyAttended,
        unknownFaces,
      });
    } catch (e) {
      console.error("Error during attendance marking:", e); // Debug log
      res.status(400).json({ error: e.message });
    }
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

router.post("/mark_absent", async (req, res) => {
  try {
    const { courseId } = req.body;
    console.log("Course ID:", courseId);

    // Fetch all students enrolled in the course
    const students = await User.find({ courseId: courseId });
    console.log("Students in course:", students);

    // Fetch students marked as present for the given course and date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Set to start of day for consistent comparison

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999); // Set to end of day for consistent comparison

    const presentStudents = await Attendance.find({
      courseId: courseId,
      date: { $gte: today, $lte: endOfDay },
      status: "Present",
    }).select("studentId");

    console.log("Present students:", presentStudents);

    const presentStudentIds = presentStudents.map((record) =>
      record.studentId.toString()
    );

    const allStudentIds = students.map((student) => student._id.toString());

    console.log("All student IDs:", allStudentIds);
    console.log("Present student IDs:", presentStudentIds);

    // Determine absent students
    const absentStudentIds = allStudentIds.filter(
      (studentId) => !presentStudentIds.includes(studentId)
    );

    console.log("Absent student IDs:", absentStudentIds);

    // Mark absent students
    const absentAttendanceRecords = absentStudentIds.map((studentId) => ({
      studentId,
      courseId,
      date: new Date(), // Ensure this date is today
      status: "Absent",
    }));

    await Attendance.insertMany(absentAttendanceRecords);

    res.status(200).json({
      message: "Absent students marked successfully",
      absentStudentIds,
    });
  } catch (e) {
    console.error(e); // Debug log
    res.status(400).json({ error: e.message });
  }
});
router.get("/attendance/:courseId/:date", async (req, res) => {
  try {
    const { courseId, date } = req.params;
    console.log(
      `Fetching attendance for courseId: ${courseId} on date: ${date}`
    );

    // Fetch all student IDs enrolled in the course
    const students = await User.find({ courseId: { $in: [courseId] } }).select(
      "_id name"
    );
    const allStudentIds = students.map((student) => student._id.toString());
    const studentInfoMap = {};
    students.forEach((student) => {
      studentInfoMap[student._id.toString()] = student.name;
    });

    console.log("All students in course:", allStudentIds);

    // Normalize the date to cover the entire day in UTC
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log(
      `Date range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`
    );

    // Fetch attendance records for the given course and date
    const attendanceRecords = await Attendance.find({
      courseId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).select("studentId status");

    console.log("Attendance records:", attendanceRecords);

    attendanceRecords.forEach((record) => {
      console.log(`Record: ${record.studentId} - ${record.status}`);
    });

    const presentStudentIds = attendanceRecords
      .filter((record) => record.status === "Present")
      .map((record) => record.studentId.toString());

    console.log("Present student IDs:", presentStudentIds);

    const absentStudentIds = allStudentIds.filter(
      (studentId) => !presentStudentIds.includes(studentId)
    );

    console.log("Absent student IDs:", absentStudentIds);

    const presentStudents = presentStudentIds.map((id) => ({
      studentId: id,
      name: studentInfoMap[id],
    }));

    const absentStudents = absentStudentIds.map((id) => ({
      studentId: id,
      name: studentInfoMap[id],
    }));

    res.status(200).json({
      presentStudents,
      absentStudents,
      date,
    });
  } catch (e) {
    clea;
    console.error(e); // Debug log
    res.status(400).json({ error: e.message });
  }
});

router.get("/allAttendance", async (req, res) => {
  const attendance = await Attendance.find();
  res.json(attendance);
});

// router.get("/allAttendance", async (req, res) => {
//   try {
//     const attendance = await Attendance.find({}, "_id"); // Fetch only the _id fields
//     const attendanceIds = attendance.map((att) => att._id); // Extract the _id fields
//     res.json(attendanceIds);
//   } catch (err) {
//     res.status(500).send(err);
//   }
// });

module.exports = router;
