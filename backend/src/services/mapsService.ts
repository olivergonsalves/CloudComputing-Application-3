import { createId } from "../utils/id.js";
import { SavedMap, TreeState } from "../models/types.js";
import { readMapsFile, writeMapsFile } from "./storageService.js";

export async function listMaps(): Promise<SavedMap[]> {
  return readMapsFile<SavedMap>();
}

export async function saveMap(rootTopic: string, tree: TreeState): Promise<SavedMap> {
  const now = new Date().toISOString();
  const maps = await readMapsFile<SavedMap>();

  const newMap: SavedMap = {
    id: createId(),
    rootTopic,
    createdAt: now,
    updatedAt: now,
    tree
  };

  maps.unshift(newMap);
  await writeMapsFile(maps.slice(0, 100));
  return newMap;
}
