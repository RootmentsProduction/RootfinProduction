import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { CalendarIcon, RefreshCw, HandCoins, Banknote, Receipt, Link2, FileText } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import baseUrl from '../api/api.js';

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
  { locName: "HEAD OFFICE01", locCode: "759" },
  { locName: "Office", locCode: "102" },
  { locName: "Production", locCode: "101" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Warehouse", locCode: "858" },
  { locName: "WAREHOUSE", locCode: "103" },
  { locName: "Z-Edappal", locCode: "100" },
  { locName: "Z-Edapally", locCode: "144" },
  { locName: "Z-Kottakkal", locCode: "122" },
  { locName: "Z-Perinthalmanna", locCode: "133" },
];

const DEPT_CODES = new Set(["759", "102", "101", "858", "103"]);

// ── SKELETON PLACEHOLDERS (Facebook / Progressive style) ──────────────────────
const CardSkeleton = () => (
  <div className="bg-white p-5 px-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col animate-pulse">
    <div className="flex justify-between items-center mb-2">
      <div className="h-4 bg-gray-200 rounded w-28"></div>
      <div className="w-[34px] h-[34px] rounded-[10px] bg-gray-100"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-44 mt-1 mb-5"></div>
    <div className="w-full border-t border-gray-100"></div>
    <div className="pt-4 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-100 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-100 rounded w-20"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-100 rounded w-12"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-full w-full flex items-end justify-between px-4 pb-8 pt-12 gap-2 sm:gap-3 animate-pulse">
    {[40, 65, 30, 85, 45, 90, 25, 70, 55, 35, 80, 60, 45, 95, 30, 75, 50, 65, 40, 80].map((h, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-2">
        <div className="w-full bg-gray-100 rounded-t-md" style={{ height: `${h}%` }}></div>
        <div className="h-2 w-4 sm:w-6 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);

const DaybookStatusSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="flex justify-between items-center py-2.5 px-3 rounded-xl bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-gray-200"></div>
          <div className="h-4 bg-gray-200 rounded w-28"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-16"></div>
      </div>
    ))}
  </div>
);

const QuickOverviewSkeleton = () => (
  <div className="flex flex-col justify-between h-full space-y-4 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex justify-between items-center pb-4 border-b border-gray-100 last:border-0">
        <div className="space-y-2">
          <div className="h-7 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-100 rounded w-24"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    ))}
  </div>
);

const Dashboard = ({ isSidebarOpen }) => {
  const currentUser = JSON.parse(localStorage.getItem("rootfinuser") || "{}");
  const isAdmin = (currentUser?.power || "").toLowerCase() === "admin";
  const isClusterManager = (currentUser?.role || "").toLowerCase() === "cluster_manager";
  const clusterAllowedLocCodes = currentUser?.allowedLocCodes || [];
  const canSelectStore = isAdmin || isClusterManager || !currentUser?.locCode;

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });

  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });

  const [selectedStore, setSelectedStore] = useState("all");
  const [storeTotals, setStoreTotals] = useState({});
  const [closuresList, setClosuresList] = useState([]);

  const [overviewLoading, setOverviewLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState("Income");
  const [daybookFilter, setDaybookFilter] = useState("All");

  const [incTotals, setIncTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });
  const [retTotals, setRetTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });
  const [expTotals, setExpTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });
  const [netTotals, setNetTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });

  const [chartData, setChartData] = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [closedStores, setClosedStores] = useState([]);
  const [lateClosedStores, setLateClosedStores] = useState([]);

  const [reorderAlerts, setReorderAlerts] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState(0);
  const [lateClosures, setLateClosures] = useState(0);

  const abortControllerRef = useRef(null);

  const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs min-w-[150px]">
          <p className="font-bold mb-2 pb-2 border-b border-gray-700">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 capitalize">{entry.name}</span>
              </div>
              <span className="font-bold">{fmt(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!canSelectStore && currentUser?.locCode) {
      setSelectedStore(currentUser.locCode);
    }
  }, []);

  useEffect(() => {
    fetchAllDashboardStreams();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [dateFrom, dateTo]);

  const fetchAllDashboardStreams = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setOverviewLoading(true);
    setFinancialLoading(true);

    const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "";
    const TWS_BASE = "https://rentalapi.rootments.live/api/GetBooking";
    const DEPT_CODES = new Set(["759", "102", "101", "858", "103"]);
    const STORE_LOC_CODES = STORE_LIST.map(s => s.locCode).filter(lc => !DEPT_CODES.has(lc));

    const EXPENSE_CATS = new Set([
      "petty expenses", "staff reimbursement", "maintenance expenses", "telephone internet",
      "utility bill", "salary", "rent", "courier charges", "asset purchase", "promotion_services",
      "spot incentive", "other expenses", "shoe sales return", "shirt sales return",
      "dry cleaning", "altration", "material", "travel exp", "fuel exp",
      "waste management", "water charges", "printing stationary", "staff welfare",
      "staff accommodation", "incentive", "write off",
    ]);

    const safeFetch = async (url) => {
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) return null;
        return await res.json();
      } catch (e) { return null; }
    };

    // ── ⚡ STREAM 1: Fast Overview (Daybook Status, Reorders, POs, Closures) ~80ms ────────
    (async () => {
      try {
        const [clsRes, reorderRes, poRes, closuresRes] = await Promise.all([
          safeFetch(`${API_URL}/user/AdminColseView?date=${dateTo}&role=admin`),
          safeFetch(`${API_URL}/api/reorder-alerts`),
          safeFetch(`${API_URL}/api/purchase/orders`),
          safeFetch(`${API_URL}/user/pendingClosures`),
        ]);

        if (signal.aborted) return;

        let closedArr = [];
        let lateArr = [];
        (clsRes?.data || []).forEach(c => {
          const created = new Date(c.createdAt || c.date);
          const createdDateStr = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
          if (createdDateStr > dateTo) {
            lateArr.push(c.locCode);
          } else {
            closedArr.push(c.locCode);
          }
        });

        setClosedStores(STORE_LOC_CODES.filter(lc => closedArr.includes(lc)).map(lc => STORE_LIST.find(s => s.locCode === lc)).filter(Boolean));
        setLateClosedStores(STORE_LOC_CODES.filter(lc => lateArr.includes(lc)).map(lc => STORE_LIST.find(s => s.locCode === lc)).filter(Boolean));
        setPendingStores(STORE_LOC_CODES.filter(lc => !closedArr.includes(lc) && !lateArr.includes(lc)).map(lc => STORE_LIST.find(s => s.locCode === lc)).filter(Boolean));

        const reorderList = Array.isArray(reorderRes) ? reorderRes : (reorderRes?.data || []);
        setReorderAlerts(reorderList.filter(a => (a.status || "").toLowerCase() === "active").length);

        const poList = Array.isArray(poRes) ? poRes : (poRes?.data || []);
        setPurchaseOrders(poList.filter(o => o.status !== "Closed" && o.status !== "Cancelled" && o.status !== "Received").length);

        const closuresListRaw = closuresRes?.data || closuresRes || [];
        setClosuresList(Array.isArray(closuresListRaw) ? closuresListRaw : []);
        setLateClosures(Array.isArray(closuresListRaw) ? closuresListRaw.length : 0);
      } catch (e) {
        // Silently handle
      } finally {
        if (!signal.aborted) setOverviewLoading(false);
      }
    })();

    // ── ⚡ STREAM 2: Financial Live Summary (Backend aggregated endpoint or parallel fallback) ────
    (async () => {
      try {
        // 1. Try single fast backend summary endpoint
        const summaryRes = await safeFetch(`${API_URL}/api/dashboard/summary?dateFrom=${dateFrom}&dateTo=${dateTo}`);
        if (summaryRes && summaryRes.incTotals && summaryRes.chartData) {
          if (signal.aborted) return;
          setIncTotals(summaryRes.incTotals || { cash: 0, bank: 0, rbl: 0, upi: 0 });
          setRetTotals(summaryRes.retTotals || { cash: 0, bank: 0, rbl: 0, upi: 0 });
          setExpTotals(summaryRes.expTotals || { cash: 0, bank: 0, rbl: 0, upi: 0 });
          setNetTotals(summaryRes.netTotals || { cash: 0, bank: 0, rbl: 0, upi: 0 });
          setStoreTotals(summaryRes.storeTotals || {});
          setChartData(summaryRes.chartData || []);
          setFinancialLoading(false);
          return;
        }

        // 2. Fallback: Client-side parallel fetch
        const [targetsRes, mongoRes, ...twsFlatResults] = await Promise.all([
          safeFetch(`${API_URL}/api/expense-targets/all`),
          safeFetch(`${API_URL}/user/Getpayment?DateFrom=${dateFrom}&DateTo=${dateTo}`),
          ...STORE_LOC_CODES.flatMap(lc => [
            safeFetch(`${TWS_BASE}/GetBookingList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
            safeFetch(`${TWS_BASE}/GetRentoutList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
            safeFetch(`${TWS_BASE}/GetDeleteList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
          ])
        ]);

        if (signal.aborted) return;

        const expenseTargets = targetsRes?.targets || [];
        const twsByStore = {};
        STORE_LOC_CODES.forEach((lc, idx) => {
          const baseIdx = idx * 3;
          twsByStore[lc] = {
            booking: twsFlatResults[baseIdx]?.dataSet?.data || [],
            rentout: twsFlatResults[baseIdx + 1]?.dataSet?.data || [],
            delete: twsFlatResults[baseIdx + 2]?.dataSet?.data || [],
          };
        });

        const mongoTxns = Array.isArray(mongoRes) ? mongoRes : (mongoRes?.data || []);

        let iCash = 0, iRbl = 0, iBank = 0, iUpi = 0;
        let retCash = 0, retRbl = 0, retBank = 0, retUpi = 0;
        let eCash = 0, eRbl = 0, eBank = 0, eUpi = 0;

        const storeTotalsFallback = {};
        STORE_LOC_CODES.forEach(lc => {
          storeTotalsFallback[lc] = {
            incTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
            retTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
            expTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
            netTotals: { cash: 0, rbl: 0, bank: 0, upi: 0 },
          };
        });

        STORE_LOC_CODES.forEach(lc => {
          const sData = twsByStore[lc];
          sData.booking.forEach(item => {
            const c = Number(item.bookingCashAmount || 0);
            const r = Number(item.rblRazorPay || 0);
            const b = Number(item.bookingBankAmount || 0);
            const u = Number(item.bookingUPIAmount || 0);

            iCash += c; iRbl += r; iBank += b; iUpi += u;
            if (storeTotalsFallback[lc]) {
              storeTotalsFallback[lc].incTotals.cash += c;
              storeTotalsFallback[lc].incTotals.rbl += r;
              storeTotalsFallback[lc].incTotals.bank += b;
              storeTotalsFallback[lc].incTotals.upi += u;
            }
          });
          sData.rentout.forEach(item => {
            const security = Number(item.securityAmount || 0);
            const advance = Number(item.advanceAmount || 0);
            const balancePayable = Number(item.invoiceAmount || 0) - advance;
            if (security > 0 || item.securityAmount) {
              retCash += security;
              if (storeTotalsFallback[lc]) {
                storeTotalsFallback[lc].retTotals.cash += security;
              }
            }
            iCash += balancePayable;
            if (storeTotalsFallback[lc]) {
              storeTotalsFallback[lc].incTotals.cash += balancePayable;
            }
          });
          sData.delete.forEach(item => {
            const rbl = -Math.abs(Number(item.rblRazorPay || 0));
            const c = -Math.abs(Number(item.deleteCashAmount || 0));
            const b = rbl !== 0 ? 0 : -Math.abs(Number(item.deleteBankAmount || 0));
            const u = rbl !== 0 ? 0 : -Math.abs(Number(item.deleteUPIAmount || 0));

            eCash += c; eRbl += rbl; eBank += b; eUpi += u;
            if (storeTotalsFallback[lc]) {
              storeTotalsFallback[lc].expTotals.cash += Math.abs(c);
              storeTotalsFallback[lc].expTotals.rbl += Math.abs(rbl);
              storeTotalsFallback[lc].expTotals.bank += Math.abs(b);
              storeTotalsFallback[lc].expTotals.upi += Math.abs(u);
            }
          });
        });

        mongoTxns.forEach(t => {
          if (t.isAdminLevel) return;
          if (DEPT_CODES.has(t.locCode)) return;
          const tp = (t.type || "").toLowerCase();
          const sub = (t.subCategory || "").toLowerCase().trim();
          const cat = (t.category || "").toLowerCase().trim();
          const inv = (t.invoiceNo || "").toUpperCase();

          const isShoeOrShirtSale = sub === "shoe sales" || sub === "shirt sales" || sub === "mixed sales"
            || cat === "shoe sales" || cat === "shirt sales" || cat === "mixed sales";
          const isSalesReturn = sub === "shoe sales return" || sub === "shirt sales return" || sub === "mixed sales return"
            || cat === "shoe sales return" || cat === "shirt sales return" || cat === "mixed sales return";
          const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");

          if (!isShoeOrShirtSale && !isSalesReturn && !isReturnInvoice && (inv.startsWith("INV-") || inv.startsWith("RTN-") || inv.startsWith("RET-"))) return;

          const isBankToCash = cat === "bank to cash" || sub === "bank to cash" || cat.includes("bank to cash") || sub.includes("bank to cash") || cat.includes("cash to branch") || sub.includes("cash to branch");
          const isCashToBank = !isBankToCash && (cat === "bulk amount transfer" || cat === "cash to bank" || sub === "bulk amount transfer" || sub === "cash to bank" || tp === "money transfer");

          const isExpenseCategory = tp === "expense" || EXPENSE_CATS.has(cat) || EXPENSE_CATS.has(sub) || isSalesReturn || isReturnInvoice;
          const cash = Number(t.cash || 0), rbl = Number(t.rbl || t.rblRazorPay || 0), bank = Number(t.bank || 0), upi = Number(t.upi || 0);

          if (isBankToCash) {}
          else if (isCashToBank) {}
          else if (isExpenseCategory) {
            eCash += cash; eRbl += rbl; eBank += bank; eUpi += upi;
            if (storeTotalsFallback[t.locCode]) {
              storeTotalsFallback[t.locCode].expTotals.cash += Math.abs(cash);
              storeTotalsFallback[t.locCode].expTotals.rbl += Math.abs(rbl);
              storeTotalsFallback[t.locCode].expTotals.bank += Math.abs(bank);
              storeTotalsFallback[t.locCode].expTotals.upi += Math.abs(upi);
            }
          } else if (tp === "income" || isShoeOrShirtSale) {
            iCash += cash; iRbl += rbl; iBank += bank; iUpi += upi;
            if (storeTotalsFallback[t.locCode]) {
              storeTotalsFallback[t.locCode].incTotals.cash += cash;
              storeTotalsFallback[t.locCode].incTotals.rbl += rbl;
              storeTotalsFallback[t.locCode].incTotals.bank += bank;
              storeTotalsFallback[t.locCode].incTotals.upi += upi;
            }
          }
        });

        STORE_LOC_CODES.forEach(lc => {
          const st = storeTotalsFallback[lc];
          st.netTotals = {
            cash: st.incTotals.cash - st.expTotals.cash,
            rbl: st.incTotals.rbl - st.expTotals.rbl,
            bank: st.incTotals.bank - st.expTotals.bank,
            upi: st.incTotals.upi - st.expTotals.upi,
          };
        });

        setIncTotals({ cash: iCash, rbl: iRbl, bank: iBank, upi: iUpi });
        setRetTotals({ cash: retCash, rbl: retRbl, bank: retBank, upi: retUpi });
        setExpTotals({ cash: Math.abs(eCash), rbl: Math.abs(eRbl), bank: Math.abs(eBank), upi: Math.abs(eUpi) });
        setNetTotals({ cash: iCash - Math.abs(eCash), rbl: iRbl - Math.abs(eRbl), bank: iBank - Math.abs(eBank), upi: iUpi - Math.abs(eUpi) });
        setStoreTotals(storeTotalsFallback);

        const getShortName = (name) => {
          const map = {
            "G-Edappal": "G-EDP", "G-Edappally": "G-EDY", "G-Kalpetta": "G-KPT",
            "G-Kannur": "G-KNR", "G-Kottakkal": "G-KTL", "G-Kottayam": "G-KTM",
            "G-Manjeri": "G-MNJ", "G-Mg Road": "G-MGR", "G-Palakkad": "G-PKD",
            "G-Perinthalmanna": "G-PMN", "G-Perumbavoor": "G-PBV", "G-Thrissur": "G-TCR",
            "G-Vadakara": "G-VDK", "G-Chavakkad": "G-CVD", "G-Calicut": "G-CLT",
            "SG-Trivandrum": "SG-TVM", "Z-Edappal": "Z-EDP", "Z-Edapally": "Z-EDY",
            "Z-Kottakkal": "Z-KTL", "Z-Perinthalmanna": "Z-PMN"
          };
          return map[name] || name;
        };

        const perStoreData = STORE_LOC_CODES.map(lc => {
          const store = STORE_LIST.find(s => s.locCode === lc);
          const storeName = store?.locName || lc;
          const shortName = getShortName(storeName);

          const sData = twsByStore[lc] || { booking: [], rentout: [], delete: [] };
          const sMgTxns = mongoTxns.filter(t => t.locCode === lc && !t.isAdminLevel);

          let sInc = 0, sExp = 0;
          sData.booking.forEach(i => { sInc += Number(i.bookingCashAmount || 0) + Number(i.rblRazorPay || 0) + Number(i.bookingBankAmount || 0) + Number(i.bookingUPIAmount || 0); });
          sData.rentout.forEach(i => {
            const advance = Number(i.advanceAmount || 0);
            sInc += Number(i.invoiceAmount || 0) - advance;
          });
          sData.delete.forEach(i => {
            const rbl = Math.abs(Number(i.rblRazorPay || 0));
            const bank = rbl !== 0 ? 0 : Math.abs(Number(i.deleteBankAmount || 0));
            const upi = rbl !== 0 ? 0 : Math.abs(Number(i.deleteUPIAmount || 0));
            sExp += Math.abs(Number(i.deleteCashAmount || 0)) + rbl + bank + upi;
          });
          sMgTxns.forEach(t => {
            const tp = (t.type || "").toLowerCase(),
              sub = (t.subCategory || "").toLowerCase().trim(),
              cat = (t.category || "").toLowerCase().trim();
            const inv = (t.invoiceNo || "").toUpperCase();

            const isShoeOrShirtSale = sub === "shoe sales" || sub === "shirt sales" || sub === "mixed sales"
              || cat === "shoe sales" || cat === "shirt sales" || cat === "mixed sales";
            const isSalesReturn = sub === "shoe sales return" || sub === "shirt sales return" || sub === "mixed sales return"
              || cat === "shoe sales return" || cat === "shirt sales return" || cat === "mixed sales return";
            const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");

            // Skip duplicate TWS rental invoices (already counted from TWS booking/rentout API)
            if (!isShoeOrShirtSale && !isSalesReturn && !isReturnInvoice && (inv.startsWith("INV-") || inv.startsWith("RTN-") || inv.startsWith("RET-"))) return;

            // Skip internal transfers
            const isBankToCash = cat === "bank to cash" || sub === "bank to cash" || cat.includes("bank to cash") || sub.includes("bank to cash") || cat.includes("cash to branch") || sub.includes("cash to branch");
            const isCashToBank = !isBankToCash && (cat === "bulk amount transfer" || cat === "cash to bank" || sub === "bulk amount transfer" || sub === "cash to bank" || tp === "money transfer");

            if (isBankToCash || isCashToBank) return;

            const isExpenseCategory = tp === "expense" || EXPENSE_CATS.has(cat) || EXPENSE_CATS.has(sub) || isSalesReturn || isReturnInvoice;

            const cash = Math.abs(Number(t.cash || 0));
            const rbl = Math.abs(Number(t.rbl || t.rblRazorPay || 0));
            const bank = Math.abs(Number(t.bank || 0));
            const upi = Math.abs(Number(t.upi || 0));
            const amt = cash + rbl + bank + upi;

            if (isExpenseCategory) sExp += amt;
            else if (tp === "income" || isShoeOrShirtSale) sInc += amt;
          });

          let sExpLimit = 0;
          expenseTargets.filter(et => et.storeCode === lc).forEach(et => {
            sExpLimit += Number(et.targetAmount || 0);
          });

          return { locCode: lc, name: shortName, fullName: storeName, income: Math.abs(sInc), expense: Math.abs(sExp), expenseLimit: sExpLimit };
        });

        setChartData(perStoreData);
      } catch (e) {
        // Silently handle
      } finally {
        if (!signal.aborted) setFinancialLoading(false);
      }
    })();
  };

  const sum = (t) => (t?.cash || 0) + (t?.rbl || 0) + (t?.bank || 0) + (t?.upi || 0);

  const isStoreFiltered = selectedStore !== "all" && storeTotals[selectedStore];
  const activeIncTotals = isStoreFiltered ? storeTotals[selectedStore].incTotals : incTotals;
  const activeRetTotals = isStoreFiltered ? storeTotals[selectedStore].retTotals : retTotals;
  const activeExpTotals = isStoreFiltered ? storeTotals[selectedStore].expTotals : expTotals;
  const activeNetTotals = isStoreFiltered ? storeTotals[selectedStore].netTotals : netTotals;

  const incTotal = sum(activeIncTotals);
  const retTotal = sum(activeRetTotals);
  const expTotal = sum(activeExpTotals);
  const netTotal = sum(activeNetTotals);

  const activeLateClosures = selectedStore !== "all"
    ? closuresList.filter(c => c.locCode === selectedStore).length
    : lateClosures;

  const retailStores = STORE_LIST.filter(s => !DEPT_CODES.has(s.locCode)).filter(s => {
    if (isClusterManager && clusterAllowedLocCodes.length > 0) {
      return clusterAllowedLocCodes.includes(s.locCode);
    }
    if (!canSelectStore && currentUser?.locCode) {
      return s.locCode === currentUser.locCode;
    }
    return true;
  });

  const selectedStoreObj = STORE_LIST.find(s => s.locCode === selectedStore);
  const selectedStoreName = selectedStoreObj ? selectedStoreObj.locName : "All Stores";

  const displayedChartData = selectedStore !== "all"
    ? chartData.filter(d => d.locCode === selectedStore)
    : chartData;

  let displayedDaybooks = [];
  if (daybookFilter === "All") displayedDaybooks = [
      ...pendingStores.map(s => ({ ...s, st: 'not' })), 
      ...closedStores.map(s => ({ ...s, st: 'closed' })),
      ...lateClosedStores.map(s => ({ ...s, st: 'late' }))
  ];
  if (daybookFilter === "Closed") displayedDaybooks = closedStores.map(s => ({ ...s, st: 'closed' }));
  if (daybookFilter === "Not Closed") displayedDaybooks = pendingStores.map(s => ({ ...s, st: 'not' }));
  if (daybookFilter === "Late Closed") displayedDaybooks = lateClosedStores.map(s => ({ ...s, st: 'late' }));

  if (selectedStore !== "all") {
    displayedDaybooks = displayedDaybooks.filter(s => s.locCode === selectedStore);
  }

  const isAnyLoading = overviewLoading || financialLoading;

  return (
    <>
      <Header />
      <div className={`transition-all duration-300 p-3 sm:p-6 bg-[#fbfcfd] min-h-screen pb-20 ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>

        {/* Header Bar (Always rendered instantly 0ms) */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4">
          <div>
            <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight leading-tight">Dashboard</h1>
            <p className="text-[14px] text-gray-400 mt-1">Overview of your stores and financial metrics</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {/* Store Filter */}
            <div className="flex flex-col">
              <p className="text-[12px] text-gray-400 mb-2">Store</p>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 h-[42px]" style={{ minWidth: '180px' }}>
                <select
                  id="dashboard-store-filter"
                  value={selectedStore}
                  onChange={e => setSelectedStore(e.target.value)}
                  className="w-full text-[14px] font-medium text-gray-800 bg-transparent outline-none cursor-pointer"
                  disabled={!canSelectStore && retailStores.length <= 1}
                >
                  {canSelectStore && <option value="all">All Stores</option>}
                  {retailStores.map(s => (
                    <option key={s.locCode} value={s.locCode}>
                      {s.locName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* From Date */}
            <div className="flex flex-col">
              <p className="text-[12px] text-gray-400 mb-2">From Date</p>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 h-[42px]" style={{ minWidth: '155px' }}>
                <input
                  id="from-date-picker"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full text-[14px] font-medium text-gray-800 bg-transparent outline-none cursor-text"
                />
              </div>
            </div>
            {/* To Date */}
            <div className="flex flex-col">
              <p className="text-[12px] text-gray-400 mb-2">To Date</p>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 h-[42px]" style={{ minWidth: '155px' }}>
                <input
                  id="to-date-picker"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full text-[14px] font-medium text-gray-800 bg-transparent outline-none cursor-text"
                />
              </div>
            </div>
            <div>
              <button
                id="dashboard-refresh-btn"
                onClick={() => fetchAllDashboardStreams()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '42px', height: '42px', padding: 0, margin: 0,
                  backgroundColor: '#a855f7', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', flexShrink: 0
                }}
                title="Refresh Live Data"
              >
                <RefreshCw size={18} color="white" className={isAnyLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Layout (Always rendered immediately with progressive skeleton stream) */}
        <div className="flex flex-col-reverse lg:flex-row gap-5 items-stretch">

          {/* Left Column (Chart + Bottom Row) */}
          <div className="flex-1 flex flex-col space-y-5 min-w-0">

            {/* Chart */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative" style={{ height: '420px' }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 z-10">
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Store Financial Ranking</h3>
                  {selectedStore !== "all" && (
                    <span className="text-[12px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <span>{selectedStoreName}</span>
                      <button 
                        onClick={() => setSelectedStore("all")}
                        className="text-purple-400 hover:text-purple-700 ml-1 font-bold text-xs"
                        title="Reset to All Stores"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
                <div className="flex p-1 bg-[#f9fafb] rounded-full border border-gray-100 text-[12px] font-medium">
                  <button onClick={() => setChartFilter("Income")} className={`flex items-center px-4 py-1.5 rounded-full transition-all ${chartFilter === "Income" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dfbbfd] mr-1.5"></span> Income
                  </button>
                  <button onClick={() => setChartFilter("Expense")} className={`flex items-center px-4 py-1.5 rounded-full transition-all ${chartFilter === "Expense" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6a1e9c] mr-1.5"></span> Expense
                  </button>
                </div>
              </div>

              {financialLoading ? (
                <ChartSkeleton />
              ) : (
                <>
                  <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-[85px] bottom-[65px] flex flex-col justify-between pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-full border-t border-dashed border-gray-200 h-0"></div>
                    ))}
                  </div>

                  <div className="flex-1 w-full overflow-x-auto relative pb-3 custom-horizontal-scrollbar z-10">
                    <div className={`${selectedStore !== "all" ? "w-full max-w-sm sm:max-w-md mx-auto" : "min-w-[1000px]"} h-full`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={displayedChartData.map(d => {
                            if (chartFilter === "Income") return { locCode: d.locCode, name: d.name, fullName: d.fullName, income: d.income };
                            if (chartFilter === "Expense") return { locCode: d.locCode, name: d.name, fullName: d.fullName, expense: d.expense, expenseLimit: d.expenseLimit };
                            return d;
                          })} 
                          margin={{ top: 10, right: 0, left: -20, bottom: 0 }} 
                          barGap={4}
                        >
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} dy={10} interval={0} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', opacity: 0.4 }} />
                          {chartFilter === "Income" && (
                            <Bar 
                              dataKey="income" 
                              fill="#dfbbfd" 
                              radius={[4, 4, 0, 0]} 
                              maxBarSize={selectedStore === "all" ? 40 : 64}
                              cursor={selectedStore === "all" ? "pointer" : "default"}
                              onClick={(entry) => {
                                if (selectedStore === "all" && entry?.locCode) {
                                  setSelectedStore(entry.locCode);
                                }
                              }}
                            />
                          )}
                          {chartFilter === "Expense" && (
                            <Bar 
                              dataKey="expense" 
                              fill="#6a1e9c" 
                              radius={[4, 4, 0, 0]} 
                              maxBarSize={selectedStore === "all" ? 40 : 64}
                              cursor={selectedStore === "all" ? "pointer" : "default"}
                              onClick={(entry) => {
                                if (selectedStore === "all" && entry?.locCode) {
                                  setSelectedStore(entry.locCode);
                                }
                              }}
                            >
                              {displayedChartData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.expenseLimit > 0 && entry.expense > entry.expenseLimit ? "#ef4444" : "#6a1e9c"} 
                                />
                              ))}
                            </Bar>
                          )}
                          {chartFilter === "Expense" && (
                            <Bar dataKey="expenseLimit" name="Expense Limit" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={selectedStore === "all" ? 40 : 64} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Row inside left col */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">

              {/* Daybook Status */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[360px]">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 xl:gap-0 mb-6">
                  <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Daybook Status</h3>
                  <div className="flex space-x-1 bg-[#f9fafb] p-1 rounded-full border border-gray-100 text-[12px] font-medium">
                    <button onClick={() => setDaybookFilter("All")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "All" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>All</button>
                    <button onClick={() => setDaybookFilter("Closed")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "Closed" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>Closed</button>
                    <button onClick={() => setDaybookFilter("Not Closed")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "Not Closed" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>Not</button>
                    <button onClick={() => setDaybookFilter("Late Closed")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "Late Closed" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>Late</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-vertical-scrollbar">
                  {overviewLoading ? (
                    <DaybookStatusSkeleton />
                  ) : (
                    <>
                      {displayedDaybooks.map((s, i) => {
                        const isClosed = s.st === 'closed';
                        const isLate = s.st === 'late';
                        const bgClass = isClosed ? 'bg-[#f0fdf4]' : (isLate ? 'bg-[#fffbeb]' : 'bg-[#fff1f2]');
                        const iconColor = isClosed ? 'text-[#16a34a]' : (isLate ? 'text-[#d97706]' : 'text-[#ef4444]');
                        const textLabel = isClosed ? 'Closed' : (isLate ? 'Late Closed' : 'Not Closed');
                        
                        return (
                          <div key={`${s.locCode}-${i}`} className={`flex justify-between items-center py-2 px-3 rounded-xl ${bgClass}`}>
                            <div className="flex items-center gap-3">
                              <div className={iconColor}>
                                <FileText size={18} strokeWidth={2.5} />
                              </div>
                              <span className="text-[14px] font-medium text-gray-800">{s.locName}</span>
                            </div>
                            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${iconColor}`}>
                              {textLabel}
                            </span>
                          </div>
                        );
                      })}
                      {displayedDaybooks.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No stores found.</p>}
                    </>
                  )}
                </div>
              </div>

              {/* Quick Overview */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[360px]">
                <h3 className="text-[16px] font-bold text-gray-900 tracking-tight mb-5">Quick Overview</h3>
                <div className="flex-1">
                  {overviewLoading ? (
                    <QuickOverviewSkeleton />
                  ) : (
                    <div className="flex flex-col justify-between h-full space-y-1">
                      {/* Reorder Alert */}
                      <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                        <div>
                          <h4 className={`text-[28px] leading-none font-bold tracking-tight mb-1 ${reorderAlerts > 0 ? 'text-[#ef4444]' : 'text-gray-900'}`}>{String(reorderAlerts).padStart(2, '0')}</h4>
                          <p className="text-[13px] font-medium text-gray-500">Reorder Alert</p>
                        </div>
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${reorderAlerts > 0 ? 'bg-[#fee2e2] text-[#ef4444]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>
                          {reorderAlerts > 0 ? 'Action Needed' : 'All Good'}
                        </span>
                      </div>

                      {/* Purchase Order */}
                      <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                        <div>
                          <h4 className="text-[28px] leading-none font-bold tracking-tight mb-1 text-gray-900">{String(purchaseOrders).padStart(2, '0')}</h4>
                          <p className="text-[13px] font-medium text-gray-500">Purchase Order</p>
                        </div>
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${purchaseOrders > 0 ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-gray-100 text-gray-600'}`}>
                          {purchaseOrders > 0 ? 'Active' : 'None'}
                        </span>
                      </div>

                      {/* Late Closure */}
                      <div className="flex justify-between items-center pb-2">
                        <div>
                          <h4 className={`text-[28px] leading-none font-bold tracking-tight mb-1 ${activeLateClosures > 0 ? 'text-[#ef4444]' : 'text-gray-900'}`}>{activeLateClosures}</h4>
                          <p className="text-[13px] font-medium text-gray-500">Late Closure</p>
                        </div>
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${activeLateClosures > 0 ? 'bg-[#fee2e2] text-[#ef4444]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>
                          {activeLateClosures > 0 ? 'Action Needed' : 'All Good'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (Summary Cards with Progressive Skeletons) */}
          <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4">

            {/* Total Income */}
            {financialLoading ? (
              <CardSkeleton />
            ) : (
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Total Income</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#d1fae5] text-[#10b981] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(incTotal)}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Cash :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(activeIncTotals.cash)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Card/Bank :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(activeIncTotals.bank + activeIncTotals.rbl)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">UPI :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(activeIncTotals.upi)}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Returnable Income */}
            {financialLoading ? (
              <CardSkeleton />
            ) : (
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Returnable Income</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#ffedd5] text-[#f97316] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(retTotal)}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4">
                  <p className="text-[13px] font-medium text-gray-500">Total returnable income held</p>
                </div>
              </div>
            )}

            {/* Total Expenses */}
            {financialLoading ? (
              <CardSkeleton />
            ) : (
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Total Expenses</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(Math.abs(expTotal))}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Cash :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(Math.abs(activeExpTotals.cash))}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Card/Bank :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(Math.abs(activeExpTotals.bank + activeExpTotals.rbl))}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">UPI :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(Math.abs(activeExpTotals.upi))}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Net Difference */}
            {financialLoading ? (
              <CardSkeleton />
            ) : (
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Net Difference</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#e0e7ff] text-[#6366f1] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(netTotal)}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Cash :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(activeNetTotals.cash)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Card/Bank :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(activeNetTotals.bank + activeNetTotals.rbl)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">UPI :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(activeNetTotals.upi)}</strong>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
