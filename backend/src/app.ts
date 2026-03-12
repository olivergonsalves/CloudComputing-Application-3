import cors from "cors";
import express from "express";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "rabbit-hole-backend" });
});

app.use("/api", routes);
app.use(errorHandler);
