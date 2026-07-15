import express from "express";
import {
  getExternalShoeBookings,
  getExternalShoeReturns,
  getShoeSalesSummary,
  getShoeSalesBySalesPerson,
} from "../controllers/ExternalSalesController.js";

const router = express.Router();

// Route for shoe sales bookings
router.get("/external/shoe-sales/bookings", getExternalShoeBookings);

// Route for shoe returns
router.get("/external/shoe-sales/returns", getExternalShoeReturns);

// Route for shoe & shirt sales summary (counts + totals per store)
router.get("/external/shoe-sales/summary", getShoeSalesSummary);

// Route for shoe & shirt sales summary grouped by salesperson
router.get("/external/shoe-sales/by-salesperson", getShoeSalesBySalesPerson);

export default router;
