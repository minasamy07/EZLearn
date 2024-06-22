const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  ],
  type: {
    type: String,
    required: true,
    enum: ["file", "video", "quiz", "assignment", "project"],
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
