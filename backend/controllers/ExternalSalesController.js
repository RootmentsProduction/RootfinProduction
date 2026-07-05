import SalesInvoice from "../model/SalesInvoice.js";

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
