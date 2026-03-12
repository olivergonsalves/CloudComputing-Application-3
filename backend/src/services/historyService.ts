import { createId } from "../utils/id.js";
import { SearchHistoryItem } from "../models/types.js";
import { readHistoryFile, writeHistoryFile } from "./storageService.js";

export async function listHistory(): Promise<SearchHistoryItem[]> {
  return readHistoryFile<SearchHistoryItem>();
}

export async function addHistory(topic: string): Promise<SearchHistoryItem> {
  const history = await readHistoryFile<SearchHistoryItem>();
  const item: SearchHistoryItem = {
    id: createId(),
    topic,
    timestamp: new Date().toISOString()
  };

  const deduped = history.filter((entry) => entry.topic.toLowerCase() !== topic.toLowerCase());
  deduped.unshift(item);

  await writeHistoryFile(deduped.slice(0, 200));
  return item;
}
