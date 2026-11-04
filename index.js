import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";

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
