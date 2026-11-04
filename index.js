import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

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
