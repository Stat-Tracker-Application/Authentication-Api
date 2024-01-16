import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import iconv from "iconv-lite";
import "dotenv/config";
import amqp from "amqplib";

const app = express();

const username = process.env.AUTHDB_USER;
const password = process.env.AUTHDB_PASSWORD;

const CONNECTION_STRING = `mongodb://${username}:${password}@authdb-service:5350/admin?authSource=admin&authMechanism=SCRAM-SHA-256`;

console.log(CONNECTION_STRING);

mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const authSchema = new mongoose.Schema({
  username: String,
  hashedpassword: String,
  TimeOfCreation: { type: Date, default: Date.now },
});

// Create a model based on the schema
const AuthModel = mongoose.model("Auth", authSchema);

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

async function ensureQueueExists(channel, queue) {
  // Assert the queue, it will be created if it does not exist
  await channel.assertQueue(queue, { durable: false });
}

async function sendUserQueueMessage(message) {
  const connection = await amqp.connect("amqp://helm-rabbitmq:5672");
  const channel = await connection.createChannel();

  const queue = "user_queue";

  await ensureQueueExists(channel, queue);

  channel.sendToQueue(queue, Buffer.from(message));

  console.log(`Message sent: ${message}`);

  setTimeout(() => {
    console.log("failed to send message");
    connection.close();
  }, 500);
}

async function receiveUserQueueMessage() {
  const connection = await amqp.connect("amqp://helm-rabbitmq:5672");
  const channel = await connection.createChannel();

  const queue = "user_queue";

  await ensureQueueExists(channel, queue);

  console.log(`Waiting for messages from ${queue}`);

  channel.consume(queue, (msg) => {
    if (msg) {
      console.log(`Received message: ${msg.content.toString()}`);
      channel.ack(msg);
    }
  });
}

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

    await newuser.save().then(sendUserQueueMessage("New user created."));

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
      const accestoken = jwt.sign(tokenuser, process.env.ACCESS_TOKEN_SECRET);
      console.log(process.env.ACCESS_TOKEN_SECRET);

      res
        .status(200)
        .json({ message: "Succesfully logged in", accestoken: accestoken });
    } else {
      res.status(401).send("incorrect username or password");
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      accestoken: process.env.ACCESS_TOKEN_SECRET,
    });
  }
});

app.get("/authenticatetoken", async function (req, res) {
  const autheader = req.headers["authorization"];
  const token = autheader?.split(" ")[1]; // Header should be Bearer Token so the token is after the space.\

  if (token === undefined || token === null) res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, user) {
    if (err) {
      console.log(process.env.ACCESS_TOKEN_SECRET);
      res.sendStatus(403);
    }
    res.status(200).json({ user });
  });
});
export default app;
