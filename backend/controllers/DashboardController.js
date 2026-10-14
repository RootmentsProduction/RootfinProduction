import https from "https";
import http from "http";
import CloseTransaction from "../model/Closing.js";
import Transaction from "../model/Transaction.js";
import ReorderAlert from "../model/ReorderAlert.js";
import PurchaseOrder from "../model/PurchaseOrder.js";
import ExpenseTarget from "../model/ExpenseTarget.js";

const STORE_LIST = [
  { locName: "G-Edappal", locCode: "707" },
  { locName: "G-Edappally", locCode: "702" },
  { locName: "G-Kalpetta", locCode: "717" },
  { locName: "G-Kannur", locCode: "716" },
  { locName: "G-Kottakkal", locCode: "711" },
  { locName: "G-Kottayam", locCode: "701" },
  { locName: "G-Manjeri", locCode: "710" },
  { locName: "G-Mg Road", locCode: "718" },
  { locName: "G-Palakkad", locCode: "705" },
  { locName: "G-Perinthalmanna", locCode: "709" },
  { locName: "G-Perumbavoor", locCode: "703" },
  { locName: "G-Thrissur", locCode: "704" },
  { locName: "G-Vadakara", locCode: "708" },
  { locName: "G-Chavakkad", locCode: "706" },
  { locName: "G-Calicut", locCode: "712" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Z-Edappal", locCode: "100" },
  { locName: "Z-Edapally", locCode: "144" },
  { locName: "Z-Kottakkal", locCode: "122" },
  { locName: "Z-Perinthalmanna", locCode: "133" },
];

const STORE_LOC_CODES = STORE_LIST.map((s) => s.locCode);

const SHORT_NAME_MAP = {
  "G-Edappal": "G-EDP",
  "G-Edappally": "G-EDY",
  "G-Kalpetta": "G-KPT",
  "G-Kannur": "G-KNR",
  "G-Kottakkal": "G-KTL",
  "G-Kottayam": "G-KTM",
  "G-Manjeri": "G-MNJ",
  "G-Mg Road": "G-MGR",
  "G-Palakkad": "G-PKD",
  "G-Perinthalmanna": "G-PMN",
  "G-Perumbavoor": "G-PBV",
  "G-Thrissur": "G-TCR",
  "G-Vadakara": "G-VDK",
  "G-Chavakkad": "G-CVD",
  "G-Calicut": "G-CLT",
  "SG-Trivandrum": "SG-TVM",
  "Z-Edappal": "Z-EDP",
  "Z-Edapally": "Z-EDY",
  "Z-Kottakkal": "Z-KTL",
  "Z-Perinthalmanna": "Z-PMN",
};

const EXPENSE_CATS = new Set([
  "petty expenses",
  "staff reimbursement",
  "maintenance expenses",
  "telephone internet",
  "utility bill",
  "salary",
  "rent",
  "courier charges",
  "asset purchase",
  "promotion_services",
  "spot incentive",
  "other expenses",
  "shoe sales return",
  "shirt sales return",
  "dry cleaning",
  "altration",
  "material",
  "travel exp",
  "fuel exp",
  "waste management",
  "water charges",
  "printing stationary",
  "staff welfare",
  "staff accommodation",
  "incentive",
  "write off",
]);

const safeDbQuery = async (fn, fallback) => {
  try {
    return await fn();
  } catch (err) {
    console.warn("DB query retry on SSL/network error:", err.message);
    try {
      await new Promise((r) => setTimeout(r, 200));
      return await fn();
    } catch (retryErr) {
      console.error("DB query failed after retry:", retryErr.message);
      return fallback;
    }
  }
};

const fetchTwsJson = async (url) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    if (!dateFrom || !dateTo) {
      return res.status(400).json({ message: "dateFrom and dateTo are required" });
    }

    const TWS_BASE = "https://rentalapi.rootments.live/api/GetBooking";

    // 1. Prepare Date Range for MongoDB
    let startOfDay, endOfDay;
    if (dateFrom.includes("-") && dateFrom.split("-")[0].length === 2) {
      const [day, month, year] = dateFrom.split("-");
      startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    } else {
      startOfDay = new Date(`${dateFrom}T00:00:00.000Z`);
    }

    if (dateTo.includes("-") && dateTo.split("-")[0].length === 2) {
      const [day, month, year] = dateTo.split("-");
      endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
    } else {
      endOfDay = new Date(`${dateTo}T23:59:59.999Z`);
    }

    // 2. Fetch all MongoDB collections and TWS in parallel
    const [
      closingDocs,
      pendingClosuresCount,
      activeReordersCount,
      openPurchaseOrdersCount,
      expenseTargets,
      mongoTxns,
      ...twsFlatResults
    ] = await Promise.all([
      // Closing status for dateTo
      safeDbQuery(
        () =>
          CloseTransaction.find({
            date: { $gte: startOfDay, $lte: endOfDay },
          }).lean(),
        []
      ),

      // Pending closures count
      safeDbQuery(
        () => CloseTransaction.countDocuments({ status: "pending_approval" }),
        0
      ),

      // Active reorder alerts
      safeDbQuery(
        () => ReorderAlert.countDocuments({ status: "active" }),
        0
      ),

      // Open purchase orders
      safeDbQuery(
        () =>
          PurchaseOrder.countDocuments({
            status: { $nin: ["Closed", "Cancelled", "Received"] },
          }),
        0
      ),

      // Expense targets
      safeDbQuery(() => ExpenseTarget.find({}).lean(), []),

      // Mongo transactions in date range
      safeDbQuery(
        () =>
          Transaction.find({
            date: { $gte: startOfDay, $lte: endOfDay },
          }).lean(),
        []
      ),

      // TWS Booking, Rentout, Delete for all 20 retail stores
      ...STORE_LOC_CODES.flatMap((lc) => [
        fetchTwsJson(
          `${TWS_BASE}/GetBookingList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`
        ),
        fetchTwsJson(
          `${TWS_BASE}/GetRentoutList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`
        ),
        fetchTwsJson(
          `${TWS_BASE}/GetDeleteList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`
        ),
      ]),
    ]);

    // 3. Process Daybook Status
    let closedArr = [];
    let lateArr = [];
    (closingDocs || []).forEach((c) => {
      const created = new Date(c.createdAt || c.date);
      const createdDateStr = `${created.getFullYear()}-${String(
        created.getMonth() + 1
      ).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;

      if (createdDateStr > dateTo) {
        lateArr.push(c.locCode);
      } else {
        closedArr.push(c.locCode);
      }
    });

    const nextClosedStores = STORE_LOC_CODES.filter((lc) =>
      closedArr.includes(lc)
    )
      .map((lc) => STORE_LIST.find((s) => s.locCode === lc))
      .filter(Boolean);

    const nextLateClosedStores = STORE_LOC_CODES.filter((lc) =>
      lateArr.includes(lc)
    )
      .map((lc) => STORE_LIST.find((s) => s.locCode === lc))
      .filter(Boolean);

    const nextPendingStores = STORE_LOC_CODES.filter(
      (lc) => !closedArr.includes(lc) && !lateArr.includes(lc)
    )
      .map((lc) => STORE_LIST.find((s) => s.locCode === lc))
      .filter(Boolean);

    // 4. Process TWS Data
    const twsByStore = {};
    STORE_LOC_CODES.forEach((lc, idx) => {
      const baseIdx = idx * 3;
      twsByStore[lc] = {
        booking: twsFlatResults[baseIdx]?.dataSet?.data || [],
        rentout: twsFlatResults[baseIdx + 1]?.dataSet?.data || [],
        delete: twsFlatResults[baseIdx + 2]?.dataSet?.data || [],
      };
    });

    let iCash = 0,
      iRbl = 0,
      iBank = 0,
      iUpi = 0;
    let retCash = 0,
      retRbl = 0,
      retBank = 0,
      retUpi = 0;
    let eCash = 0,
      eRbl = 0,
      eBank = 0,
      eUpi = 0;

    const storeTotals = {};
    STORE_LOC_CODES.forEach((lc) => {
      storeTotals[lc] = {
        incTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
        retTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
        expTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
        netTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
      };
    });

    STORE_LOC_CODES.forEach((lc) => {
      const sData = twsByStore[lc];
      // Booking -> Income
      sData.booking.forEach((item) => {
        const c = Number(item.bookingCashAmount || 0);
        const r = Number(item.rblRazorPay || 0);
        const b = Number(item.bookingBankAmount || 0);
        const u = Number(item.bookingUPIAmount || 0);

        iCash += c;
        iRbl += r;
        iBank += b;
        iUpi += u;

        if (storeTotals[lc]) {
          storeTotals[lc].incTotals.cash += c;
          storeTotals[lc].incTotals.rbl += r;
          storeTotals[lc].incTotals.bank += b;
          storeTotals[lc].incTotals.upi += u;
        }
      });

      // RentOut -> Split into Income (Balance Payable) and Returnable Income (Security)
      sData.rentout.forEach((item) => {
        const security = Number(item.securityAmount || 0);
        const advance = Number(item.advanceAmount || 0);
        const balancePayable = Number(item.invoiceAmount || 0) - advance;
        if (security > 0 || item.securityAmount) {
          retCash += security;
          if (storeTotals[lc]) {
            storeTotals[lc].retTotals.cash += security;
          }
        }
        iCash += balancePayable;
        if (storeTotals[lc]) {
          storeTotals[lc].incTotals.cash += balancePayable;
        }
      });

      // Cancel -> Expense
      sData.delete.forEach((item) => {
        const rbl = -Math.abs(Number(item.rblRazorPay || 0));
        const c = -Math.abs(Number(item.deleteCashAmount || 0));
        const b = rbl !== 0 ? 0 : -Math.abs(Number(item.deleteBankAmount || 0));
        const u = rbl !== 0 ? 0 : -Math.abs(Number(item.deleteUPIAmount || 0));

        eCash += c;
        eRbl += rbl;
        eBank += b;
        eUpi += u;

        if (storeTotals[lc]) {
          storeTotals[lc].expTotals.cash += Math.abs(c);
          storeTotals[lc].expTotals.rbl += Math.abs(rbl);
          storeTotals[lc].expTotals.bank += Math.abs(b);
          storeTotals[lc].expTotals.upi += Math.abs(u);
        }
      });
    });

    // 5. Process Mongo Txns (Store Level only)
    const DEPT_CODES = new Set(["759", "102", "101", "858", "103"]);
    (mongoTxns || []).forEach((t) => {
      if (t.isAdminLevel) return;
      if (DEPT_CODES.has(t.locCode)) return;
      const tp = (t.type || "").toLowerCase();
      const sub = (t.subCategory || "").toLowerCase().trim();
      const cat = (t.category || "").toLowerCase().trim();
      const inv = (t.invoiceNo || "").toUpperCase();

      const isShoeOrShirtSale =
        sub === "shoe sales" ||
        sub === "shirt sales" ||
        sub === "mixed sales" ||
        cat === "shoe sales" ||
        cat === "shirt sales" ||
        cat === "mixed sales";
      const isSalesReturn =
        sub === "shoe sales return" ||
        sub === "shirt sales return" ||
        sub === "mixed sales return" ||
        cat === "shoe sales return" ||
        cat === "shirt sales return" ||
        cat === "mixed sales return";
      const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");

      if (
        !isShoeOrShirtSale &&
        !isSalesReturn &&
        !isReturnInvoice &&
        (inv.startsWith("INV-") ||
          inv.startsWith("RTN-") ||
          inv.startsWith("RET-"))
      )
        return;

      const isBankToCash =
        cat === "bank to cash" ||
        sub === "bank to cash" ||
        cat.includes("bank to cash") ||
        sub.includes("bank to cash") ||
        cat.includes("cash to branch") ||
        sub.includes("cash to branch");
      const isCashToBank =
        !isBankToCash &&
        (cat === "bulk amount transfer" ||
          cat === "cash to bank" ||
          sub === "bulk amount transfer" ||
          sub === "cash to bank" ||
          tp === "money transfer");

      const isExpenseCategory =
        tp === "expense" ||
        EXPENSE_CATS.has(cat) ||
        EXPENSE_CATS.has(sub) ||
        isSalesReturn ||
        isReturnInvoice;
      const cash = Number(t.cash || 0),
        rbl = Number(t.rbl || t.rblRazorPay || 0),
        bank = Number(t.bank || 0),
        upi = Number(t.upi || 0);

      if (isBankToCash) {
        // Bank to cash
      } else if (isCashToBank) {
        // Cash to bank
      } else if (isExpenseCategory) {
        eCash += cash;
        eRbl += rbl;
        eBank += bank;
        eUpi += upi;
        if (storeTotals[t.locCode]) {
          storeTotals[t.locCode].expTotals.cash += Math.abs(cash);
          storeTotals[t.locCode].expTotals.rbl += Math.abs(rbl);
          storeTotals[t.locCode].expTotals.bank += Math.abs(bank);
          storeTotals[t.locCode].expTotals.upi += Math.abs(upi);
        }
      } else if (tp === "income" || isShoeOrShirtSale) {
        iCash += cash;
        iRbl += rbl;
        iBank += bank;
        iUpi += upi;
        if (storeTotals[t.locCode]) {
          storeTotals[t.locCode].incTotals.cash += cash;
          storeTotals[t.locCode].incTotals.rbl += rbl;
          storeTotals[t.locCode].incTotals.bank += bank;
          storeTotals[t.locCode].incTotals.upi += upi;
        }
      }
    });

    const incTotals = { cash: iCash, rbl: iRbl, bank: iBank, upi: iUpi };
    const retTotals = { cash: retCash, rbl: retRbl, bank: retBank, upi: retUpi };
    const expTotals = {
      cash: Math.abs(eCash),
      rbl: Math.abs(eRbl),
      bank: Math.abs(eBank),
      upi: Math.abs(eUpi),
    };
    const netTotals = {
      cash: iCash - Math.abs(eCash),
      rbl: iRbl - Math.abs(eRbl),
      bank: iBank - Math.abs(eBank),
      upi: iUpi - Math.abs(eUpi),
    };

    STORE_LOC_CODES.forEach((lc) => {
      const st = storeTotals[lc];
      st.netTotals = {
        cash: st.incTotals.cash - st.expTotals.cash,
        rbl: st.incTotals.rbl - st.expTotals.rbl,
        bank: st.incTotals.bank - st.expTotals.bank,
        upi: st.incTotals.upi - st.expTotals.upi,
      };
    });

    // 6. Chart Data
    const perStoreData = STORE_LOC_CODES.map((lc) => {
      const store = STORE_LIST.find((s) => s.locCode === lc);
      const storeName = store?.locName || lc;
      const shortName = SHORT_NAME_MAP[storeName] || storeName;

      const sData = twsByStore[lc] || { booking: [], rentout: [], delete: [] };
      const sMgTxns = (mongoTxns || []).filter((t) => t.locCode === lc && !t.isAdminLevel);

      let sInc = 0,
        sExp = 0;
      sData.booking.forEach((i) => {
        sInc +=
          Number(i.bookingCashAmount || 0) +
          Number(i.rblRazorPay || 0) +
          Number(i.bookingBankAmount || 0) +
          Number(i.bookingUPIAmount || 0);
      });
      sData.rentout.forEach((i) => {
        const advance = Number(i.advanceAmount || 0);
        const balancePayable = Number(i.invoiceAmount || 0) - advance;
        sInc += balancePayable;
      });
      sData.delete.forEach((i) => {
        const rbl = Math.abs(Number(i.rblRazorPay || 0));
        const bank = rbl !== 0 ? 0 : Math.abs(Number(i.deleteBankAmount || 0));
        const upi = rbl !== 0 ? 0 : Math.abs(Number(i.deleteUPIAmount || 0));
        sExp +=
          Math.abs(Number(i.deleteCashAmount || 0)) +
          rbl +
          bank +
          upi;
      });
      sMgTxns.forEach((t) => {
        const tp = (t.type || "").toLowerCase(),
          sub = (t.subCategory || "").toLowerCase().trim(),
          cat = (t.category || "").toLowerCase().trim();
        const inv = (t.invoiceNo || "").toUpperCase();

        const isShoeOrShirtSale =
          sub === "shoe sales" ||
          sub === "shirt sales" ||
          sub === "mixed sales" ||
          cat === "shoe sales" ||
          cat === "shirt sales" ||
          cat === "mixed sales";
        const isSalesReturn =
          sub === "shoe sales return" ||
          sub === "shirt sales return" ||
          sub === "mixed sales return" ||
          cat === "shoe sales return" ||
          cat === "shirt sales return" ||
          cat === "mixed sales return";
        const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");

        // Skip duplicate TWS rental invoices (already counted from TWS booking/rentout API)
        if (
          !isShoeOrShirtSale &&
          !isSalesReturn &&
          !isReturnInvoice &&
          (inv.startsWith("INV-") ||
            inv.startsWith("RTN-") ||
            inv.startsWith("RET-"))
        ) {
          return;
        }

        // Skip internal transfers
        const isBankToCash =
          cat === "bank to cash" ||
          sub === "bank to cash" ||
          cat.includes("bank to cash") ||
          sub.includes("bank to cash") ||
          cat.includes("cash to branch") ||
          sub.includes("cash to branch");
        const isCashToBank =
          !isBankToCash &&
          (cat === "bulk amount transfer" ||
            cat === "cash to bank" ||
            sub === "bulk amount transfer" ||
            sub === "cash to bank" ||
            tp === "money transfer");

        if (isBankToCash || isCashToBank) return;

        const isExpenseCategory =
          tp === "expense" ||
          EXPENSE_CATS.has(cat) ||
          EXPENSE_CATS.has(sub) ||
          isSalesReturn ||
          isReturnInvoice;

        const cash = Math.abs(Number(t.cash || 0));
        const rbl = Math.abs(Number(t.rbl || t.rblRazorPay || 0));
        const bank = Math.abs(Number(t.bank || 0));
        const upi = Math.abs(Number(t.upi || 0));
        const amt = cash + rbl + bank + upi;

        if (isExpenseCategory) sExp += amt;
        else if (tp === "income" || isShoeOrShirtSale) sInc += amt;
      });

      let sExpLimit = 0;
      (expenseTargets || [])
        .filter((et) => et.storeCode === lc)
        .forEach((et) => {
          sExpLimit += Number(et.targetAmount || 0);
        });

      return {
        locCode: lc,
        name: shortName,
        fullName: storeName,
        income: Math.abs(sInc),
        expense: Math.abs(sExp),
        expenseLimit: sExpLimit,
      };
    });

    const result = {
      closedStores: nextClosedStores,
      lateClosedStores: nextLateClosedStores,
      pendingStores: nextPendingStores,
      reorderAlerts: activeReordersCount,
      purchaseOrders: openPurchaseOrdersCount,
      lateClosures: pendingClosuresCount,
      incTotals,
      retTotals,
      expTotals,
      netTotals,
      storeTotals,
      chartData: perStoreData,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("getDashboardSummary error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
