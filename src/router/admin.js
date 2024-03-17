const express = require("express");
const Admin = require("../models/admin");
const router = new express.Router();

//create Admin
router.post("/admins", async (req, res) => {
  const admin = new Admin(req.body);
  try {
    await admin.save();
    const token = await admin.generateAuthToken();
    res.status(201).send({ admin, token });
  } catch (e) {
    res.status(400).send(e);
  }
});
