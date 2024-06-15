const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const userRouter = require("./router/user");
const courseRouter = require("./router/course");
const quizRouter = require("./router/quiz");
const searchRouter = require("./router/search");
const Notification = require("./router/notification");
const reminderRouter = require("./router/reminder");
require("./DB/mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(userRouter);
app.use(courseRouter);
app.use(quizRouter);
app.use(searchRouter);
app.use(reminderRouter);
// app.use(Notification);

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

app.set("socketio", io); // Make io accessible in routes

app.listen(port, () => {
  console.log("server running on port: " + port);
});
