const express = require("express");
const adminRouter = require("./router/admin");
require("./DB/mongoose");

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(adminRouter);

app.listen(port, () => {
  console.log("server run on port: " + port);
});
