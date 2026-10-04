import { Router } from "express";
import healthRouter from "./health.js";
import wayProfileRouter from "./way-profile.js";
import coachRouter from "./coach.js";

const router = Router();

router.use(healthRouter);
router.use(wayProfileRouter);
router.use("/coach", coachRouter);

export default router;
