import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

const PORT = process.env.port || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
