import express from "express";
import {
  getExternalShoeBookings,
  getExternalShoeReturns,
  getShoeSalesSummary,
} from "../controllers/ExternalSalesController.js";

const router = express.Router();

// Route for shoe sales bookings
router.get("/external/shoe-sales/bookings", getExternalShoeBookings);

// Route for shoe returns
router.get("/external/shoe-sales/returns", getExternalShoeReturns);

// Route for shoe & shirt sales summary (counts + totals)
router.get("/external/shoe-sales/summary", getShoeSalesSummary);

export default router;
