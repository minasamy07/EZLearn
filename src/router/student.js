const express = require("express");
// const auth = require();
const Student = require("../models/student");
const router = new express.Router();

//create student
router.post("/students", async (req, res) => {
  const student = new Student(req.body);
  try {
    await student.save();
    const token = await student.generateAuthToken();
    res.status(201).send({
      student,
      token,
    });
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

module.exports = router;
