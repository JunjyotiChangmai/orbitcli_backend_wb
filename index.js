require("dotenv").config();

const express = require("express");
const cors = require("cors");
require("./db.js");

const router = require("./routes/routes.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use("/", router);

const port = process.env.PORT;

app.listen(port, () =>
  console.log(`server started on http://localhost:${port}`)
);