const express = require("express");
const cors = require("cors");
const auth = require("../middleware/teacher-auth");
const Teacher = require("../models/teacher");
const multer = require("multer");
const router = new express.Router();

//creat teacher

router.post("/teachers", cors(), async (req, res) => {
  const teacher = new Teacher(req.body);
  try {
    await teacher.save();
    const token = await teacher.generateAuthToken();
    res.status(201).send({ teacher, token });
  } catch (e) {
    res.send(400).send("Email is Takeeen");
  }
});

//log in teacher

router.post("/teachers/login", async (req, res) => {
  try {
    const teacher = await Teacher.findByEmailAndPassword(
      req.body.email,
      req.body.password
    );

    const token = await teacher.generateAuthToken();
    res.send({ teacher, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//log out teacher

router.post("/teachers/logout", auth, async (req, res) => {
  try {
    req.teacher.tokens = req.teacher.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await req.teacher.save();
    res.send("log out succefully");
  } catch (e) {
    res.status(500).send();
  }
});

//get loged teacher

router.get("/teachers/me", auth, async (req, res) => {
  res.send(req.teacher);
});

//update personal data
router.patch("/teachers/update", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdate = ["email", "password"];
  const isValidOperation = updates.every((update) =>
    allowedUpdate.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ Error: "Invalid UPDATE!!!" });
  }

  try {
    updates.forEach((udpate) => (req.teacher[udpate] = req.body[udpate]));
    await req.teacher.save();

    res.send(req.teacher);
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
  "/teachers/profilePicture",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    req.teacher.avatar = req.file.buffer;
    await req.teacher.save();
    res.send();
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// get profile picture

router.get("/teachers/getPP", auth, async (req, res) => {
  try {
    const teacher = req.teacher;
    if (!teacher || !teacher.avatar) {
      throw new error();
    }

    res.set("Content-type", "image/png" || "image/jpeg" || "image/jpg");
    res.send(teacher.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

//delete Profile Picture

router.delete("/teachers/deletePP", auth, async (req, res) => {
  req.teacher.avatar = undefined;
  await req.teacher.save();
  res.send();
});

module.exports = router;
