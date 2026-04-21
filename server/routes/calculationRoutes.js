import { Router } from "express";
import { calculate, historyClear, historyCreate, historyList } from "../controllers/calculationController.js";

const router = Router();

router.post("/calculate", calculate);
router.get("/history", historyList);
router.post("/history", historyCreate);
router.delete("/history", historyClear);

export default router;