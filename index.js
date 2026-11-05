import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = process.env.PORT || 8000;

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("gathergood_db");
const eventCollection = db.collection("events");
const joinCollection = db.collection("joined_events");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).send({ msg: "Invalid or expired token!" });
  }
};

app.post("/events", verifyToken, async (req, res) => {
  const {
    title,
    description,
    eventType,
    imageUrl,
    location,
    date,
    creatorName,
    creatorImage,
  } = req.body;

  if (!title || !description || !eventType || !imageUrl || !location) {
    return res.status(400).send({ msg: "All fields are required!" });
  }

  const today = new Date().toISOString().split("T")[0];
  if (!date || date <= today) {
    return res.status(400).send({ msg: "Event date must be in the future!" });
  }

  const eventData = {
    title,
    description,
    eventType,
    imageUrl,
    location,
    date,
    creatorName: creatorName || req.user.name || "Anonymous",
    creatorImage: creatorImage || req.user.picture || "",
    creatorEmail: req.user.email,
    createdAt: new Date(),
  };

  const result = await eventCollection.insertOne(eventData);
  res.status(201).send(result);
});

app.get("/events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const query = { date: { $gte: today } };

  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: "i" };
    query.$or = [{ title: searchRegex }, { location: searchRegex }];
  }

  if (req.query.eventType && req.query.eventType !== "All") {
    query.eventType = req.query.eventType;
  }

  const result = await eventCollection.find(query).sort({ date: 1 }).toArray();
  res.send(result);
});

app.get("/recent-events", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const result = await eventCollection
    .find({ date: { $gte: today } })
    .sort({ date: 1 })
    .limit(6)
    .toArray();
  res.send(result);
});

app.get("/events/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await eventCollection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      return res.status(404).send({ msg: "Event not found!" });
    }
    res.send(result);
  } catch (error) {
    return res.status(400).send({ msg: "Invalid event ID!" });
  }
});

app.get("/my-events", verifyToken, async (req, res) => {
  const result = await eventCollection
    .find({ creatorEmail: req.user.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(result);
});

const handleUpdateEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await eventCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).send({ msg: "Event not found!" });
    }
    if (event.creatorEmail !== req.user.email) {
      return res.status(403).send({ msg: "Forbidden action!" });
    }
    const { _id, creatorEmail, createdAt, ...updateData } = req.body;
    if (updateData.date) {
      const today = new Date().toISOString().split("T")[0];
      if (updateData.date <= today) {
        return res.status(400).send({ msg: "Event date must be in the future!" });
      }
    }
    const result = await eventCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.send(result);
  } catch (error) {
    return res.status(400).send({ msg: "Invalid request!" });
  }
};

app.put("/events/:id", verifyToken, handleUpdateEvent);
app.patch("/events/:id", verifyToken, handleUpdateEvent);

const handleDeleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await eventCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).send({ msg: "Event not found!" });
    }
    if (event.creatorEmail !== req.user.email) {
      return res.status(403).send({ msg: "Forbidden action!" });
    }
    const result = await eventCollection.deleteOne({ _id: new ObjectId(id) });
    await joinCollection.deleteMany({ eventId: id });
    res.send(result);
  } catch (error) {
    return res.status(400).send({ msg: "Invalid request!" });
  }
};

app.delete("/events/:id", verifyToken, handleDeleteEvent);
app.delete("/event/:id", verifyToken, handleDeleteEvent);

app.get("/", (req, res) => {
  res.send({
    status: "ok",
    message: "GatherGood Social Development Events Server is running!",
  });
});

app.listen(PORT, () => {
  console.log(`GatherGood server running on port ${PORT}`);
});

export default app;
