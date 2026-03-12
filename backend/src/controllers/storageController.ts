import { Request, Response } from "express";
import { SaveMapRequestSchema } from "../models/schemas.js";
import { listHistory } from "../services/historyService.js";
import { listMaps, saveMap } from "../services/mapsService.js";

export async function getMaps(_req: Request, res: Response): Promise<void> {
  const maps = await listMaps();
  res.json({ maps });
}

export async function postMap(req: Request, res: Response): Promise<void> {
  const parsed = SaveMapRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const saved = await saveMap(parsed.data.rootTopic, parsed.data.tree);
  res.status(201).json({ map: saved });
}

export async function getHistory(_req: Request, res: Response): Promise<void> {
  const history = await listHistory();
  res.json({ history });
}
