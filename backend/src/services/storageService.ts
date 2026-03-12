import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";

const mapsFile = path.resolve(env.dataDir, "maps.json");
const historyFile = path.resolve(env.dataDir, "history.json");

async function ensureDataDir(): Promise<void> {
  await mkdir(path.resolve(env.dataDir), { recursive: true });
}

export async function readJsonArrayFile<T>(filePath: string): Promise<T[]> {
  await ensureDataDir();

  try {
    const content = await readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function writeJsonArrayFile<T>(filePath: string, payload: T[]): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function readMapsFile<T>(): Promise<T[]> {
  return readJsonArrayFile<T>(mapsFile);
}

export async function writeMapsFile<T>(maps: T[]): Promise<void> {
  await writeJsonArrayFile(mapsFile, maps);
}

export async function readHistoryFile<T>(): Promise<T[]> {
  return readJsonArrayFile<T>(historyFile);
}

export async function writeHistoryFile<T>(items: T[]): Promise<void> {
  await writeJsonArrayFile(historyFile, items);
}
