import { app } from "./app.js";
import { env } from "./config/env.js";

if (!env.anthropicApiKey) {
  // eslint-disable-next-line no-console
  console.error("[startup] Missing ANTHROPIC_API_KEY. Anthropic child-topic generation will fallback.");
} else {
  // eslint-disable-next-line no-console
  console.info(`[startup] ANTHROPIC_API_KEY detected. Requested model: ${env.anthropicModel}`);
}

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Rabbit Hole backend running on http://localhost:${env.port}`);
});
