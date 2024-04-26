const express = require("express");
const cors = require("cors");
const userRouter = require("./router/user");
const courseRouter = require("./router/course");
const quizRouter = require("./router/quiz");
require("./DB/mongoose");

const app = express();
app.use(cors());
const port = process.env.PORT;

app.use(express.json());

app.use(userRouter);
app.use(courseRouter);
app.use(quizRouter);

app.listen(port, () => {
  console.log("server run on port: " + port);
});
