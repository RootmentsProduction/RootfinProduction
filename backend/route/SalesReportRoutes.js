import express from "express";
import {
  getSalesSummary,
  getSalesByItem,
  getSalesReturnSummary,
  getSalesByInvoice
} from "../controllers/SalesReportController.js";
import { getSalesByGroup } from "../controllers/SalesByGroupController.js";
import SalesInvoice from "../model/SalesInvoice.js";

const router = express.Router();

router.get("/by-invoice", getSalesByInvoice);
router.get("/summary", getSalesSummary);
router.get("/by-item", getSalesByItem);
router.get("/returns", getSalesReturnSummary);
router.get("/by-group", getSalesByGroup);

// Debug endpoint to check data
router.get("/debug/check-stores", async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ success: false, message: "dateFrom and dateTo required" });
    }

    const invoices = await SalesInvoice.find({
      invoiceDate: {
        $gte: new Date(dateFrom + "T00:00:00.000Z"),
        $lte: new Date(dateTo + "T23:59:59.999Z"),
      },
      status: { $ne: "draft" },
    }).lean();

    const storeData = {};
    invoices.forEach(inv => {
      if (!storeData[inv.locCode]) {
        storeData[inv.locCode] = { count: 0, items: 0 };
      }
      storeData[inv.locCode].count++;
      storeData[inv.locCode].items += (inv.lineItems || []).length;
    });

    res.json({ success: true, data: storeData, totalInvoices: invoices.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
