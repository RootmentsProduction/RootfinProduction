import express from "express";
import {
  getExternalShoeBookings,
  getExternalShoeReturns
} from "../controllers/ExternalSalesController.js";

const router = express.Router();

// Route for shoe sales bookings
router.get("/external/shoe-sales/bookings", getExternalShoeBookings);

// Route for shoe returns
router.get("/external/shoe-sales/returns", getExternalShoeReturns);

export default router;
