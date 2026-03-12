import { Router } from "express";
import { expandTopicNode, searchTopic, testAnthropic, topicSummary } from "../controllers/topicController.js";
import { getHistory, getMaps, postMap } from "../controllers/storageController.js";

const router = Router();

router.post("/search", searchTopic);
router.post("/expand", expandTopicNode);
router.get("/topic-summary", topicSummary);
router.get("/test-anthropic", testAnthropic);
router.get("/maps", getMaps);
router.post("/maps", postMap);
router.get("/history", getHistory);

export default router;
