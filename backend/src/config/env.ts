import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

dotenv.config();

// Workspace scripts may run backend with cwd=/backend, so also load root .env explicitly.
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
dotenv.config({ path: path.resolve(currentDir, "../../../.env") });

const EnvSchema = z.object({
  PORT: z.string().default("4000"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  WIKIPEDIA_API_BASE: z.string().url().default("https://en.wikipedia.org/w/api.php"),
  DATA_DIR: z.string().default("./backend/data")
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  port: Number(parsed.PORT),
  anthropicApiKey: parsed.ANTHROPIC_API_KEY,
  anthropicModel: parsed.ANTHROPIC_MODEL,
  wikipediaApiBase: parsed.WIKIPEDIA_API_BASE,
  dataDir: parsed.DATA_DIR
};
