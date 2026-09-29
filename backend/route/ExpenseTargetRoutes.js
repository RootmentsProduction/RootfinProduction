import express from "express";
import { saveExpenseTarget, getExpenseTarget } from "../controllers/ExpenseTargetController.js";

const router = express.Router();

router.post("/expense-targets", saveExpenseTarget);
router.get("/expense-targets", getExpenseTarget);

export default router;
