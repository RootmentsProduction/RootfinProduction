import SalesInvoice from "../model/SalesInvoice.js";

// ── Store master list (locCode → storeName) ──────────────────────────────────
const STORE_MAP = {
  "144": "Z-Edapally1",
  "702": "G-Edappally",
  "700": "SG-Trivandrum",
  "100": "Z-Edappal",
  "133": "Z.Perinthalmanna",
  "122": "Z.Kottakkal",
  "701": "G.Kottayam",
  "703": "G.Perumbavoor",
  "704": "G.Thrissur",
  "706": "G.Chavakkad",
  "712": "G.Calicut",
  "708": "G.Vadakara",
  "707": "G.Edappal",
  "709": "G.Perinthalmanna",
  "711": "G.Kottakkal",
  "710": "G.Manjeri",
  "705": "G.Palakkad",
  "717": "G.Kalpetta",
  "716": "G.Kannur",
  "718": "G.MG Road",
  "555": "Dappr Squad",
  "858": "Warehouse",
  "759": "HEAD OFFICE01",
  "101": "Production",
  "102": "Office",
  "103": "WAREHOUSE",
};

/**
 * @desc  Shoe & shirt sales summary — per store, for a given date range
 * @route GET /api/external/shoe-sales/summary
 * @query fromDate=YYYY-MM-DD  toDate=YYYY-MM-DD  locCode=XXX  (all optional)
 * @access Public
 *
 * Tip — to replicate FTD/MTD on the frontend:
 *   FTD  →  fromDate=today  &  toDate=today
 *   MTD  →  fromDate=YYYY-MM-01  &  toDate=today
 *
 * Response shape:
 * {
 *   fromDate, toDate, locCode,
 *   stores: [
 *     {
 *       locCode, storeName,
 *       shoe:  { bills, qty, value },
 *       shirt: { bills, qty, value },
 *       mixed: { bills, qty, value },
 *       total: { bills, qty, value }
 *     }
 *   ],
 *   grandTotal: {
 *     shoe:  { bills, qty, value },
 *     shirt: { bills, qty, value },
 *     mixed: { bills, qty, value },
 *     total: { bills, qty, value }
 *   }
 * }
 */
export const getShoeSalesSummary = async (req, res) => {
  try {
    const { fromDate, toDate, locCode } = req.query;

    // ── Build query ───────────────────────────────────────────────────────────
    const query = {
      category:    { $nin: ["Return", "Refund", "Cancel", "refund", "cancel"] },
      subCategory: { $in: ["shoe sales", "shirt sales", "mixed sales"] },
    };

    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        query.invoiceDate.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    if (locCode) query.locCode = locCode;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const invoices = await SalesInvoice.find(query).select(
      "locCode subCategory lineItems finalTotal"
    );

    // ── Aggregate per store ───────────────────────────────────────────────────
    const storeData = {};

    for (const inv of invoices) {
      const lc  = inv.locCode || "unknown";
      const sub = (inv.subCategory || "").toLowerCase().trim();
      const key = sub === "shoe sales" ? "shoe" : sub === "shirt sales" ? "shirt" : "mixed";
      const qty = (inv.lineItems || []).reduce((s, i) => s + (i.quantity || 0), 0);
      const val = inv.finalTotal || 0;

      if (!storeData[lc]) {
        storeData[lc] = {
          shoe:  { bills: 0, qty: 0, value: 0 },
          shirt: { bills: 0, qty: 0, value: 0 },
          mixed: { bills: 0, qty: 0, value: 0 },
        };
      }

      storeData[lc][key].bills += 1;
      storeData[lc][key].qty   += qty;
      storeData[lc][key].value += val;
    }

    // ── Build response ────────────────────────────────────────────────────────
    const stores = Object.entries(storeData).map(([lc, data]) => ({
      locCode:   lc,
      storeName: STORE_MAP[lc] || lc,
      shoe:  data.shoe,
      shirt: data.shirt,
      mixed: data.mixed,
      total: {
        bills: data.shoe.bills + data.shirt.bills + data.mixed.bills,
        qty:   data.shoe.qty   + data.shirt.qty   + data.mixed.qty,
        value: data.shoe.value + data.shirt.value + data.mixed.value,
      },
    }));

    stores.sort((a, b) => a.storeName.localeCompare(b.storeName));

    // ── Grand totals ──────────────────────────────────────────────────────────
    const grand = {
      shoe:  { bills: 0, qty: 0, value: 0 },
      shirt: { bills: 0, qty: 0, value: 0 },
      mixed: { bills: 0, qty: 0, value: 0 },
      total: { bills: 0, qty: 0, value: 0 },
    };
    for (const s of stores) {
      for (const cat of ["shoe", "shirt", "mixed"]) {
        grand[cat].bills += s[cat].bills;
        grand[cat].qty   += s[cat].qty;
        grand[cat].value += s[cat].value;
      }
      grand.total.bills += s.total.bills;
      grand.total.qty   += s.total.qty;
      grand.total.value += s.total.value;
    }

    res.status(200).json({
      fromDate:   fromDate || null,
      toDate:     toDate   || null,
      locCode:    locCode  || null,
      stores,
      grandTotal: grand,
    });
  } catch (error) {
    console.error("Error fetching shoe sales summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper to format Date to YYYY-MM-DDTHH:mm:ss format
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  // Format as YYYY-MM-DDTHH:mm:ss in local time or UTC as stored in DB
  const pad = (num) => String(num).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * @desc    Get all shoe sales (bookings)
 * @route   GET /api/external/shoe-sales/bookings
 * @access  Public
 */
export const getExternalShoeBookings = async (req, res) => {
  try {
    const { fromDate, toDate, locCode, storeName, branch, warehouse, limit = 100, page = 1 } = req.query;
    
    // Filter out "Return" category (and optionally "Refund", "Cancel" based on standard logic)
    const query = {
      category: { $nin: ["Return", "refund", "cancel", "Refund", "Cancel"] }
    };

    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) {
        query.invoiceDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.invoiceDate.$lte = new Date(toDate);
      }
    }

    if (locCode) {
      query.locCode = locCode;
    }

    const selectedStore = storeName || branch || warehouse;
    if (selectedStore) {
      query.$or = [
        { branch: selectedStore },
        { warehouse: selectedStore }
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const invoices = await SalesInvoice.find(query)
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const formattedBookings = invoices.map(invoice => {
      const totalQuantity = invoice.lineItems ? invoice.lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      
      const items = (invoice.lineItems || []).map(item => {
        let itemCategory = item.category || (item.itemData && item.itemData.category);
        if (!itemCategory) {
          const itemNameLower = (item.item || "").toLowerCase();
          const itemSkuLower = (item.itemSku || "").toLowerCase();
          if (itemNameLower.includes("shirt") || itemNameLower.includes("t-shirt") || itemSkuLower.includes("shirt")) {
            itemCategory = "shirt";
          } else if (itemNameLower.includes("shoe") || itemNameLower.includes("footwear") || itemSkuLower.includes("shoe")) {
            itemCategory = "shoe";
          } else {
            itemCategory = "other";
          }
        }
        return {
          itemName: item.item,
          sku: item.itemSku || "",
          category: itemCategory,
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          amount: item.amount || 0,
          costPrice: item.itemData?.costPrice || 0
        };
      });

      return {
        invoiceNo: invoice.invoiceNumber,
        customerName: invoice.customer,
        phoneNo: invoice.customerPhone || "",
        billedDate: formatDate(invoice.invoiceDate),
        category: invoice.subCategory || "",
        value: invoice.finalTotal || 0,
        quantity: totalQuantity,
        salesPerson: invoice.salesperson || "",
        items
      };
    });

    res.status(200).json(formattedBookings);
  } catch (error) {
    console.error("Error fetching external shoe bookings:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get all shoe returns
 * @route   GET /api/external/shoe-sales/returns
 * @access  Public
 */
export const getExternalShoeReturns = async (req, res) => {
  try {
    const { fromDate, toDate, locCode, storeName, branch, warehouse, limit = 100, page = 1 } = req.query;

    // Filter only "Return" category (and refund/cancel if they represent returns)
    const query = {
      category: { $in: ["Return", "refund", "cancel", "Refund", "Cancel"] }
    };

    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) {
        query.invoiceDate.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.invoiceDate.$lte = new Date(toDate);
      }
    }

    if (locCode) {
      query.locCode = locCode;
    }

    const selectedStore = storeName || branch || warehouse;
    if (selectedStore) {
      query.$or = [
        { branch: selectedStore },
        { warehouse: selectedStore }
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const invoices = await SalesInvoice.find(query)
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const formattedReturns = invoices.map(invoice => {
      const totalQuantity = invoice.lineItems ? invoice.lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      
      const items = (invoice.lineItems || []).map(item => {
        let itemCategory = item.category || (item.itemData && item.itemData.category);
        if (!itemCategory) {
          const itemNameLower = (item.item || "").toLowerCase();
          const itemSkuLower = (item.itemSku || "").toLowerCase();
          if (itemNameLower.includes("shirt") || itemNameLower.includes("t-shirt") || itemSkuLower.includes("shirt")) {
            itemCategory = "shirt";
          } else if (itemNameLower.includes("shoe") || itemNameLower.includes("footwear") || itemSkuLower.includes("shoe")) {
            itemCategory = "shoe";
          } else {
            itemCategory = "other";
          }
        }
        return {
          itemName: item.item,
          sku: item.itemSku || "",
          category: itemCategory,
          quantity: item.quantity || 0,
          rate: item.rate || 0,
          amount: item.amount || 0,
          costPrice: item.itemData?.costPrice || 0
        };
      });

      return {
        invoiceNo: invoice.invoiceNumber,
        customerName: invoice.customer,
        phoneNo: invoice.customerPhone || "",
        billedReturnedDate: formatDate(invoice.invoiceDate),
        category: invoice.subCategory || "",
        value: invoice.finalTotal || 0,
        quantity: totalQuantity,
        salesPerson: invoice.salesperson || "",
        items
      };
    });

    res.status(200).json(formattedReturns);
  } catch (error) {
    console.error("Error fetching external shoe returns:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
