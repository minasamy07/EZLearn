const express = require("express");
const cors = require("cors");
const auth = require("../middleware/student-auth");
const Student = require("../models/student");
const course = require("../models/courses");
const multer = require("multer");
const router = new express.Router();

//create student
router.post("/students", cors(), async (req, res) => {
  const student = new Student(req.body);
  try {
    await student.save();
    const token = await student.generateAuthToken();
    res.status(201).send({ student, token });
  } catch (e) {
    res.status(400).send("Email Is Takeen");
  }
});

//log in student

router.post("/students/login", async (req, res) => {
  try {
    const student = await Student.findByEmailAndPassword(
      req.body.email,
      req.body.password
    );
    const token = await student.generateAuthToken();
    res.send({ student, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//log out student
router.post("/students/logout", auth, async (req, res) => {
  try {
    req.student.tokens = req.student.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.student.save();
    res.send("log out succefully");
  } catch (e) {
    res.status(500).send();
  }
});

//get loged student

router.get("/students/me", auth, async (req, res) => {
  res.send(req.student);
});

//get loded student with avatar

// router.get("/students/me", auth, async (req, res) => {
//   try {
//     const student = req.student;
//     if (!student) {
//       throw new Error("Student not found");
//     }

//     let responseData = {
//       _id: student._id,
//       // Include other student information here
//       name: student.name,
//       // Include any other fields you want to include
//     };

//     if (student.avatar) {
//       responseData.avatar = student.avatar;
//       // You may want to set the content type based on the avatar's format
//       let contentType = "image/png";
//       if (student.avatar.includes("jpeg") || student.avatar.includes("jpg")) {
//         contentType = "image/jpeg";
//       }
//       res.set("Content-type", contentType);
//     }

//     res.send(responseData);
//   } catch (error) {
//     res.status(404).send(error.message);
//   }
// });

//update personal data
router.patch("/students/update", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdate.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ Error: "Invalid UPDATE!!!" });
  }

  try {
    updates.forEach((udpate) => (req.student[udpate] = req.body[udpate]));
    await req.student.save();

    res.send(req.student);
  } catch (e) {
    res.status(400).send(e);
  }
});

// add profile picture

const upload = multer({
  limits: { fileSize: 1000000 },
  fileFilter(req, file, cb) {
    if (
      !file.originalname.endsWith(".jpg") &&
      !file.originalname.endsWith(".jpeg") &&
      !file.originalname.endsWith(".png")
    ) {
      return cb(new Error("upload a photo"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/students/profilePicture",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    req.student.avatar = req.file.buffer;
    await req.student.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// get profile picture

router.get("/students/getPP", auth, async (req, res) => {
  try {
    const student = req.student;
    if (!student || !student.avatar) {
      throw new error();
    }

    res.set("Content-type", "image/png" || "image/jpeg" || "image/jpg");
    res.send(student.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

//delete Profile Picture

router.delete("/students/deletePP", auth, async (req, res) => {
  req.student.avatar = undefined;
  await req.student.save();
  res.send();
});

//get course of student

router.get("/student/getcourse/:stuId", async (req, res) => {
  const stuId = req.params.stuId;

  try {
    // Find the student document by ID
    const student = await Student.findOne({ stuId }).populate("courseId");

    if (student) {
      if (student.courseId && student.courseId.length > 0) {
        // Extract course names from the retrieved student
        const courseNames = student.courseId.map((course) => course.name);
        res.json({ courseNames });
      } else {
        res.status(404).json({ message: "No course found for this student" });
      }
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
