import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_KEY ?? ""
);

const allowedObjectives = new Set(["5k", "10k", "consistency", "returning"]);
const allowedLevels = new Set(["beginner", "intermediate", "advanced"]);
const allowedInjuryHistory = new Set(["none", "past", "current"]);
const allowedTimes = new Set(["morning", "afternoon", "evening"]);
const allowedCoaches = new Set(["maya", "luca"]);

function isValidProfile(body: unknown): body is Record<string, unknown> {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.deviceId === "string" && p.deviceId.length >= 4 &&
    typeof p.name === "string" && p.name.trim().length >= 2 &&
    typeof p.objective === "string" && allowedObjectives.has(p.objective) &&
    typeof p.experienceLevel === "string" && allowedLevels.has(p.experienceLevel) &&
    typeof p.injuryHistory === "string" && allowedInjuryHistory.has(p.injuryHistory) &&
    Array.isArray(p.trainingDays) && p.trainingDays.length > 0 &&
    p.trainingDays.every((d) => typeof d === "string") &&
    typeof p.availableTime === "string" && allowedTimes.has(p.availableTime) &&
    typeof p.coach === "string" && allowedCoaches.has(p.coach)
  );
}

router.post("/way-profile", async (req, res) => {
  if (!isValidProfile(req.body)) {
    res.status(400).json({ error: "Perfil de onboarding inválido." });
    return;
  }
  const p = req.body;
  try {
    const { data, error } = await supabase
      .from("way_profiles")
      .upsert({
        device_id: p.deviceId,
        name: p.name,
        objective: p.objective,
        experience_level: p.experienceLevel,
        injury_history: p.injuryHistory,
        training_days: p.trainingDays,
        available_time: p.availableTime,
        coach: p.coach,
        updated_at: new Date().toISOString(),
      }, { onConflict: "device_id" })
      .select();

    if (error) {
      res.status(502).json({ error: "Supabase error", detail: error.message });
      return;
    }
    res.status(200).json({ saved: true, data });
  } catch (err) {
    res.status(502).json({
      error: "Sync failed",
      detail: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;
