const express = require("express");
// const auth = require();
const Teacher = require("../models/teacher");
const router = new express.Router();

//creat teacher

router.post("/teachers", async (req, res) => {
  const teacher = new Teacher(req.body);
  try {
    await teacher.save();
    const token = await teacher.generateAuthToken();
    res.status(200).send({ teacher, token });
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

module.exports = router;
