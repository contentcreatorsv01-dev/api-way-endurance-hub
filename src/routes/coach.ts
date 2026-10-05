import { Router, Request, Response } from "express";
import { nvidiaAIService } from "../services/nvidia-ai.service.js";
import type { ChatRequest, CoachType } from "../services/nvidia-ai.service.js";

const router = Router();

function validateCoach(coach: unknown): coach is CoachType {
  return coach === "maya" || coach === "luca";
}

// GET /api/coach/status
router.get("/status", (_req: Request, res: Response) => {
  const enabled = nvidiaAIService.isEnabled();
  res.json({
    enabled,
    message: enabled ? "AI Coach is active" : "AI Coach disabled. Configure NVIDIA_API_KEY.",
    timestamp: new Date().toISOString(),
  });
});

// GET /api/coach/info/:coachType
router.get("/info/:coachType", (req: Request, res: Response) => {
  const { coachType } = req.params;
  if (!validateCoach(coachType)) {
    res.status(400).json({ error: "Coach must be 'maya' or 'luca'" });
    return;
  }
  res.json(nvidiaAIService.getCoachInfo(coachType));
});

// POST /api/coach/chat
router.post("/chat", async (req: Request, res: Response) => {
  const { coach, message, conversationHistory, userId } = req.body as ChatRequest;

  if (!validateCoach(coach)) {
    res.status(400).json({ error: "Coach must be 'maya' or 'luca'" });
    return;
  }
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ error: "Message too long (max 2000 chars)" });
    return;
  }
  if (!nvidiaAIService.isEnabled()) {
    res.status(503).json({ error: "AI Coach service not configured" });
    return;
  }

  try {
    const response = await nvidiaAIService.chat({ coach, message: message.trim(), conversationHistory, userId });
    res.json(response);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Chat route error:", msg);
    if (msg.includes("authentication")) { res.status(401).json({ error: msg }); return; }
    if (msg.includes("rate limit")) { res.status(429).json({ error: msg }); return; }
    // Return actual error message in non-production for debugging
    res.status(500).json({ 
      error: "Failed to process message. Try again.",
      detail: process.env.NODE_ENV !== "production" ? msg : undefined
    });
  }
});

// POST /api/coach/greeting
router.post("/greeting", (req: Request, res: Response) => {
  const { coach } = req.body;
  if (!validateCoach(coach)) {
    res.status(400).json({ error: "Coach must be 'maya' or 'luca'" });
    return;
  }
  res.json({ response: nvidiaAIService.getGreeting(coach), coach, timestamp: new Date().toISOString() });
});

export default router;
