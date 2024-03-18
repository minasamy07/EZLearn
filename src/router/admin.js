const express = require("express");
// const auth = require();
const Admin = require("../models/admin");
const router = new express.Router();

//create Admin
router.post("/admins", async (req, res) => {
  const admin = new Admin(req.body);
  try {
    await admin.save();
    // const token = await admin.generateAuthToken();
    res.status(201).send({
      admin,
      //token
    });
  } catch (e) {
    res.status(400).send("Email is Taken");
  }
});

// //login Admin

router.post("/admins/login", async (req, res) => {
  try {
    const admin = await Admin.findByEmailAndPass(
      req.body.email,
      req.body.password
    );

    // const token = await Admin.generateAuthToken();
    res.send({
      admin,
      //token
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
