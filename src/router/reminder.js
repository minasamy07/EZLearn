const express = require("express");
const auth = require("../middleware/user-auth");
const Reminder = require("../models/reminder");
const router = new express.Router();

//create reminder
router.post("/reminders", auth, async (req, res) => {
  const { title, note } = req.body;
  const reminder = new Reminder({
    title,
    note,
  });

  try {
    await reminder.save();
    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create reminder" });
  }
});
router.get("/getReminder/all", async (req, res) => {
  const reminder = await Reminder.find();
  res.json(reminder);
});
// Route to get a reminder by ID
router.get("/reminders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await Reminder.findById(id);

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.status(200).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to delete a reminder by ID
router.delete("/reminders/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await Reminder.findByIdAndDelete(id);

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.status(200).json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
