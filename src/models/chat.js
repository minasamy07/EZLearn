const mongoose = require("mongoose");
const moment = require("moment-timezone");

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true,
  },
  text: {
    type: String,
    required: function () {
      return !this.media && !this.voice;
    },
  },
  media: {
    type: Buffer,
    required: function () {
      return !this.text && !this.voice;
    },
    contentType: String, // 'image/png', 'video/mp4', etc.
  },
  voice: {
    type: Buffer,
    required: function () {
      return !this.text && !this.media;
    },
    contentType: String, // 'audio/mpeg', etc.
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

// Chat Schema
const chatSchema = new mongoose.Schema({
  name: { type: String },

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = { Chat, Message };
