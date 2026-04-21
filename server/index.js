import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./config/db.js";
import calculationRoutes from "./routes/calculationRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "MERN Calculator API", status: "running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/", calculationRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Calculator API running on http://localhost:${port}`);
  });
}

startServer();