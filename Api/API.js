import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

import "dotenv/config";

const app = express();

console.log(process.env.AUTHDB_USER);
console.log(process.env.AUTHDB_PASSWORD);
console.log(process.env.MONGODB_URL);

const username = Buffer.from(process.env.AUTHDB_USER, "base64").toString(
  "utf-8"
);
const password = Buffer.from(process.env.AUTHDB_PASSWORD, "base64").toString(
  "utf-8"
);

const CONNECTION_STRING = `mongodb://${username}:${password}@${process.env.MONGODB_URL}`;
// MongoDB connection
mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  auth: {
    user: username,
    password: password,
  },
});

console.log(CONNECTION_STRING);

const authSchema = new mongoose.Schema({
  username: String,
  hashedpassword: String,
  TimeOfCreation: { type: Date, default: Date.now },
});

// Create a model based on the schema
const AuthModel = mongoose.model("Auth", authSchema);

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.get("/", function (req, res) {
  res.json({
    message: "Hello world from auth api",
  });
});

app.post("/user/signup", async function (req, res) {
  try {
    const hashedpassword = await bcryptjs.hash(req.body.password, 10);
    const username = await req.body.username;

    const newuser = new AuthModel({ username, hashedpassword });

    await newuser.save();

    res.status(201).json({
      username: newuser.username,
      hashedpassword: newuser.hashedpassword,
      TimeOfCreation: newuser.TimeOfCreation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/user/login", async function (req, res) {
  const user = await AuthModel.findOne({ username: req.body.username });
  if (user === null) {
    return res.status(404).send("Cannot find that username");
  }
  try {
    if (await bcryptjs.compare(req.body.password, user.hashedpassword)) {
      const tokenuser = { username: user.username };
      const accestoken = jwt.sign(tokenuser, process.env.ACCES_TOKEN_SECRET);
      console.log(process.env.ACCES_TOKEN_SECRET);

      res
        .status(200)
        .json({ message: "Succesfully logged in", accestoken: accestoken });
    } else {
      res.status(401).send("incorrect username or password");
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/authenticatetoken", async function (req, res) {
  const autheader = req.headers["authorization"];
  const token = autheader?.split(" ")[1]; // Header should be Bearer Token so the token is after the space.\

  if (token === undefined || token === null) res.sendStatus(401);

  jwt.verify(token, process.env.ACCES_TOKEN_SECRET, function (err, user) {
    if (err) {
      console.log(process.env.ACCES_TOKEN_SECRET);
      res.sendStatus(403);
    }
    res.status(200).json({ user });
  });
});

export default app;
