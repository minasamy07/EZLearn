const express = require("express");
const router = new express.Router();
const multer = require("multer");
const Attendance = require("../models/attendance");

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image (jpg, jpeg, or png)"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/attendance",
  upload.single("image"),
  async (req, res) => {
    const courseId = req.body.courseId;
    if (!req.file || !courseId) {
      return res
        .status(400)
        .send({ error: "Image and courseId are required." });
    }
    const attendance = new Attendance({
      image: req.file.buffer,
      courseId,
    });
    try {
      await attendance.save();
      res.status(201).send(attendance);
    } catch (e) {
      res.status(500).send(e);
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

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

router.get("/RecognizeFaceOfSpecificCourse/:_id", async (req, res) => {
  const _id = req.params._id;
  try {
    const attendance = await Attendance.findById(_id);
    if (!attendance) {
      return res.status(404).send({ error: "No attendance records found" });
    } else {
      const response = {
        image: attendance.image.toString("base64"), // Send image as base64 string
        courseId: attendance.courseId,
      };

      res.status(200).send(response);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
