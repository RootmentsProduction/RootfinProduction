import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, TrendingUp, TrendingDown, ArrowUpDown, Bell, AlertTriangle, AlertCircle, Calendar as CalendarIcon, StoreIcon } from "lucide-react";
import baseUrl from "../api/api";
import useSidebar from "../hooks/useSidebar";
import Header from "../components/Header";

const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
const TWS_BASE = "https://rentalapi.rootments.live/api/GetBooking";

const STORE_LIST = [
  { locName: "G-Edappal",        locCode: "707" },
  { locName: "G-Edappally",      locCode: "702" },
  { locName: "G-Kalpetta",       locCode: "717" },
  { locName: "G-Kannur",         locCode: "716" },
  { locName: "G-Kottakkal",      locCode: "711" },
  { locName: "G-Kottayam",       locCode: "701" },
  { locName: "G-Manjeri",        locCode: "710" },
  { locName: "G-Mg Road",        locCode: "718" },
  { locName: "G-Palakkad",       locCode: "705" },
  { locName: "G-Perinthalmanna", locCode: "709" },
  { locName: "G-Perumbavoor",    locCode: "703" },
  { locName: "G-Thrissur",       locCode: "704" },
  { locName: "G-Vadakara",       locCode: "708" },
  { locName: "G-Chavakkad",      locCode: "706" },
  { locName: "G-Calicut",        locCode: "712" },
  { locName: "HEAD OFFICE01",    locCode: "759" },
  { locName: "Office",           locCode: "102" },
  { locName: "Production",       locCode: "101" },
  { locName: "SG-Trivandrum",    locCode: "700" },
  { locName: "Warehouse",        locCode: "858" },
  { locName: "WAREHOUSE",        locCode: "103" },
  { locName: "Z-Edappal",        locCode: "100" },
  { locName: "Z-Edapally",       locCode: "144" },
  { locName: "Z-Kottakkal",      locCode: "122" },
  { locName: "Z-Perinthalmanna", locCode: "133" },
];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n || 0);

const todayDate = () => new Date().toISOString().slice(0, 10);

const Home = () => {
  const isSidebarOpen = useSidebar();
  const user = JSON.parse(localStorage.getItem("rootfinuser")) || {};

  const [dateFrom, setDateFrom] = useState(todayDate());
  const [dateTo, setDateTo] = useState(todayDate());
  const [loading, setLoading] = useState(true);

  // Stats State
  const [incTotals, setIncTotals] = useState({ cash: 0, rbl: 0, bank: 0, upi: 0 });
  const [retTotals, setRetTotals] = useState({ cash: 0, rbl: 0, bank: 0, upi: 0 });
  const [expTotals, setExpTotals] = useState({ cash: 0, rbl: 0, bank: 0, upi: 0 });
  const [netTotals, setNetTotals] = useState({ cash: 0, rbl: 0, bank: 0, upi: 0 });
  const [securityStats, setSecurityStats] = useState({ in: 0, out: 0 });
  
  const [closedStores, setClosedStores] = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  
  const [reorderAlerts, setReorderAlerts] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState(0);
  const [lateClosures, setLateClosures] = useState(0);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // For dashboard, we want all stores combined data
      const locCode = ""; 
      
      // 1. Fetch Daybook closures
      let closed = [];
      try {
        const clsRes = await fetch(`${API_URL}/api/user/AdminColseView?date=${dateTo}&role=admin`);
        if (clsRes.ok) {
          const clsData = await clsRes.json();
          closed = (clsData.data || []).map(c => c.locCode);
        }
      } catch (e) {
        console.error(e);
      }

      const closedStoresList = STORE_LIST.filter(s => closed.includes(s.locCode));
      const pendingStoresList = STORE_LIST.filter(s => !closed.includes(s.locCode));
      setClosedStores(closedStoresList);
      setPendingStores(pendingStoresList);

      // 2. Fetch Reorder Alerts
      try {
        const reorderRes = await fetch(`${API_URL}/api/reorder-alerts`);
        if (reorderRes.ok) {
          const reorderData = await reorderRes.json();
          setReorderAlerts((reorderData || []).filter(a => a.status === "active").length);
        }
      } catch (e) {
        console.error(e);
      }

      // 3. Fetch Purchase Orders (Active/Pending)
      try {
        const poRes = await fetch(`${API_URL}/api/purchase/orders`);
        if (poRes.ok) {
          const poData = await poRes.json();
          setPurchaseOrders((poData || []).filter(o => o.status !== "Closed" && o.status !== "Cancelled").length);
        }
      } catch (e) {
        console.error(e);
      }

      // 3.5. Fetch Late Closures
      try {
        const closuresRes = await fetch(`${API_URL}/user/pendingClosures`);
        if (closuresRes.ok) {
          const closuresData = await closuresRes.json();
          setLateClosures(closuresData.data?.length || 0);
        }
      } catch (e) {
        console.error(e);
      }

      // 4. Fetch Income / Expense / Security
      const incomeReq = fetch(`${TWS_BASE}/GetBookingList?LocCode=${locCode}&DateFrom=${dateFrom}&DateTo=${dateTo}`);
      const rentoutReq = fetch(`${TWS_BASE}/GetRentoutList?LocCode=${locCode}&DateFrom=${dateFrom}&DateTo=${dateTo}`);
      const returnReq = fetch(`${TWS_BASE}/GetReturnList?LocCode=${locCode}&DateFrom=${dateFrom}&DateTo=${dateTo}`);
      const cancelReq = fetch(`${TWS_BASE}/GetCancelList?LocCode=${locCode}&DateFrom=${dateFrom}&DateTo=${dateTo}`);
      
      let mongoUrl = `${API_URL}/api/user/Income_expense?DateFrom=${dateFrom}&DateTo=${dateTo}`;
      if (locCode && locCode !== "759" && locCode !== "102") mongoUrl += `&LocCode=${locCode}`;
      const mongoReq = fetch(mongoUrl);

      const [incRes, rentRes, retRes, canRes, mongoResp] = await Promise.all([
        incomeReq.then(res => res.json()).catch(() => ({})),
        rentoutReq.then(res => res.json()).catch(() => ({})),
        returnReq.then(res => res.json()).catch(() => ({})),
        cancelReq.then(res => res.json()).catch(() => ({})),
        mongoReq.then(res => res.json()).catch(() => ({ data: [] }))
      ]);

      let iCash=0, iRbl=0, iBank=0, iUpi=0;
      let rCash=0, rRbl=0, rBank=0, rUpi=0;
      let eCash=0, eRbl=0, eBank=0, eUpi=0;
      let b2cCash=0, b2cRbl=0, b2cBank=0, b2cUpi=0;
      let c2bCash=0, c2bRbl=0, c2bBank=0, c2bUpi=0;
      let hSecCash=0, hSecRbl=0, hSecBank=0, hSecUpi=0;
      
      let secIn = 0;
      let secOutCash = 0;
      let secOutRbl = 0;

      // Booking
      (incRes?.dataSet?.data || []).forEach(item => {
        iCash += Number(item.cash || 0);
        iRbl += Number(item.rblRazorPay || 0);
        iBank += Number(item.bank || 0);
        iUpi += Number(item.upi || 0);
      });

      // Rentout (Returnable + Security In)
      (rentRes?.dataSet?.data || []).forEach(item => {
        const amt = Number(item.amount || 0);
        const sd = Number(item.securityDeposit || 0);
        const rbl = Number(item.rblRazorPay || 0);
        secIn += sd;
        if (rbl > 0) {
          rRbl += amt;
        } else {
          rCash += amt;
        }
      });

      // Return (Holded Sec + Security Out)
      (retRes?.dataSet?.data || []).forEach(item => {
        const cash = -Math.abs(Number(item.returnCashAmount || 0));
        const rbl = -Math.abs(Number(item.rblRazorPay || 0));
        const bank = rbl !== 0 ? 0 : -Math.abs(Number(item.returnBankAmount || 0));
        const upi = rbl !== 0 ? 0 : -Math.abs(Number(item.returnUPIAmount || 0));
        
        hSecCash += cash; hSecRbl += rbl; hSecBank += bank; hSecUpi += upi;
        
        secOutCash += Math.abs(cash);
        secOutRbl += Math.abs(rbl);
      });

      // Cancel
      (canRes?.dataSet?.data || []).forEach(item => {
        const rbl = -Math.abs(Number(item.rblRazorPay || 0));
        eCash += -Math.abs(Number(item.deleteCashAmount || 0));
        eRbl += rbl;
        eBank += rbl !== 0 ? 0 : -Math.abs(Number(item.deleteBankAmount || 0));
        eUpi += rbl !== 0 ? 0 : -Math.abs(Number(item.deleteUPIAmount || 0));
      });

      // Mongo
      const mongoTxns = Array.isArray(mongoResp) ? mongoResp : (mongoResp.data || []);
      const EXPENSE_CATEGORIES = new Set([
        "petty expenses","staff reimbursement","maintenance expenses","telephone internet",
        "utility bill","salary","rent","courier charges","asset purchase","promotion_services",
        "spot incentive","other expenses","shoe sales return",
        "shirt sales return","dry cleaning","altration","material","travel exp","fuel exp",
        "waste management","water charges","printing stationary","staff welfare",
        "staff accommodation","incentive","write off",
      ]);

      mongoTxns.forEach(t => {
        const cat = (t.category || "").toLowerCase().trim();
        const sub = (t.subCategory || "").toLowerCase().trim();
        const tp = (t.type || "").toLowerCase();
        
        const isBankToCash = cat === "bank to cash" || sub === "bank to cash" || cat.includes("bank to cash") || sub.includes("bank to cash") || cat.includes("cash to branch") || sub.includes("cash to branch");
        const isCashToBank = !isBankToCash && (cat === "bulk amount transfer" || cat === "cash to bank" || sub === "bulk amount transfer" || sub === "cash to bank" || tp === "money transfer");
        const isExpense = tp === "expense" || EXPENSE_CATEGORIES.has(cat);
        const inv = (t.invoiceNo || "").toUpperCase();
        const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");
        
        const cash = Number(t.cash || 0);
        const rbl = Number(t.rbl || t.rblRazorPay || 0);
        const bank = Number(t.bank || 0);
        const upi = Number(t.upi || 0);

        if (isBankToCash) {
          b2cCash += cash; b2cRbl += rbl; b2cBank += bank; b2cUpi += upi;
        } else if (isCashToBank) {
          c2bCash += cash; c2bRbl += rbl; c2bBank += bank; c2bUpi += upi;
        } else if (isReturnInvoice || isExpense) {
          eCash += cash; eRbl += rbl; eBank += bank; eUpi += upi;
        } else if (tp === "income") {
          iCash += cash; iRbl += rbl; iBank += bank; iUpi += upi;
        }
      });

      setIncTotals({ cash: iCash, rbl: iRbl, bank: iBank, upi: iUpi });
      setRetTotals({ cash: rCash, rbl: rRbl, bank: rBank, upi: rUpi });
      setExpTotals({ cash: eCash, rbl: eRbl, bank: eBank, upi: eUpi });
      
      const gtIncomeCash = iCash + rCash + b2cCash;
      const gtIncomeRbl = iRbl + rRbl + b2cRbl;
      const gtIncomeBank = iBank + rBank + b2cBank;
      const gtIncomeUpi = iUpi + rUpi + b2cUpi;
      
      const gtExpenseCash = eCash + hSecCash + c2bCash;
      const gtExpenseRbl = eRbl + hSecRbl + c2bRbl;
      const gtExpenseBank = eBank + hSecBank + c2bBank;
      const gtExpenseUpi = eUpi + hSecUpi + c2bUpi;
      
      setNetTotals({
        cash: gtIncomeCash + gtExpenseCash,
        rbl: gtIncomeRbl + gtExpenseRbl,
        bank: gtIncomeBank + gtExpenseBank,
        upi: gtIncomeUpi + gtExpenseUpi,
      });

      setSecurityStats({
        in: secIn,
        out: secOutCash + secOutRbl,
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sum = (t) => t.cash + t.rbl + t.bank + t.upi;
  const incTotal = sum(incTotals);
  const retTotal = sum(retTotals);
  const expTotal = sum(expTotals);
  const netTotal = sum(netTotals);

  return (
    <>
      <Header />
      <div className={`transition-all duration-300 p-6 bg-[#f5f7fb] min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your stores and financial metrics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <CalendarIcon size={16} className="text-gray-400 mr-2" />
            <input 
              type="date" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 p-0"
            />
            <span className="mx-2 text-gray-300">to</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)}
              className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 p-0"
            />
          </div>
          <button 
            onClick={fetchDashboardData}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Daybook Closure Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-rose-50/50 p-4 border-b border-rose-100 flex justify-between items-center">
                <h3 className="font-bold text-rose-800 flex items-center">
                  <AlertCircle size={18} className="mr-2" />
                  Daybook Not Closed
                </h3>
                <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{pendingStores.length} Stores</span>
              </div>
              <div className="p-4 flex-1 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pendingStores.map(s => (
                    <div key={s.locCode} className="flex items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center mr-2.5 shrink-0">
                        <StoreIcon size={14} className="text-rose-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{s.locName}</span>
                    </div>
                  ))}
                  {pendingStores.length === 0 && <p className="text-gray-500 text-sm italic col-span-full py-2">All stores have closed daybooks!</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex justify-between items-center">
                <h3 className="font-bold text-emerald-800 flex items-center">
                  <ShieldCheck size={18} className="mr-2" />
                  Daybook Closed
                </h3>
                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{closedStores.length} Stores</span>
              </div>
              <div className="p-4 flex-1 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {closedStores.map(s => (
                    <div key={s.locCode} className="flex items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center mr-2.5 shrink-0">
                        <StoreIcon size={14} className="text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">{s.locName}</span>
                    </div>
                  ))}
                  {closedStores.length === 0 && <p className="text-gray-500 text-sm italic col-span-full py-2">No stores have closed daybooks yet.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Income Expense Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[15px] font-bold text-gray-800">Total Income</p>
                  <div className="w-10 h-10 rounded-lg bg-[#dcfce7] text-green-600 flex items-center justify-center shrink-0">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <h3 className="text-[32px] leading-none font-bold text-gray-900 mb-5">{fmt(incTotal)}</h3>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Cash :</span><strong className="text-gray-800">{fmt(incTotals.cash)}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Razorpay :</span><strong className="text-gray-800">{fmt(incTotals.rbl)}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Card/Bank :</span><strong className="text-gray-800">{fmt(incTotals.bank)}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>UPI :</span><strong className="text-gray-800">{fmt(incTotals.upi)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <Link to="/securityReport" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[15px] font-bold text-gray-800">Refundable Security</p>
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <h3 className="text-[32px] leading-none font-bold text-gray-900 mb-5">
                  {fmt(securityStats.out - securityStats.in)}
                </h3>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between text-[13px] text-gray-500">
                  <span>In: <strong className="text-gray-800">{fmt(securityStats.in)}</strong></span>
                  <span>Out: <strong className="text-gray-800">{fmt(securityStats.out)}</strong></span>
                </div>
              </div>
            </Link>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[15px] font-bold text-gray-800">Total Expenses</p>
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                    <TrendingDown size={20} />
                  </div>
                </div>
                <h3 className="text-[32px] leading-none font-bold text-gray-900 mb-5">{fmt(Math.abs(expTotal))}</h3>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Cash :</span><strong className="text-gray-800">{fmt(Math.abs(expTotals.cash))}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Razorpay :</span><strong className="text-gray-800">{fmt(Math.abs(expTotals.rbl))}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>Card/Bank :</span><strong className="text-gray-800">{fmt(Math.abs(expTotals.bank))}</strong>
                  </div>
                  <div className="flex justify-between text-[13px] text-gray-500">
                    <span>UPI :</span><strong className="text-gray-800">{fmt(Math.abs(expTotals.upi))}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[15px] font-bold text-gray-800">Returnable Income</p>
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                </div>
                <h3 className="text-[32px] leading-none font-bold text-gray-900 mb-5">{fmt(retTotal)}</h3>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[13px] text-gray-500">Total returnable income held</p>
              </div>
            </div>
          </div>

          {/* Alert Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/inventory/reorder-alerts" className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Reorder Alerts</p>
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Bell size={16} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {reorderAlerts}
              </h3>
              <div className="text-xs text-gray-500 flex justify-between items-center h-4 mt-auto">
                {reorderAlerts > 0 ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Action Needed</span> : <span>All Good</span>}
              </div>
            </Link>

            <Link to="/purchase/orders" className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Purchase Orders</p>
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {purchaseOrders}
              </h3>
              <div className="text-xs text-gray-500 flex justify-between items-center h-4 mt-auto">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Active</span>
              </div>
            </Link>

            <Link to="/PendingDaybookClosures" className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Late Closures</p>
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle size={16} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {lateClosures}
              </h3>
              <div className="text-xs text-gray-500 flex justify-between items-center h-4 mt-auto">
                {lateClosures > 0 ? <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Action Needed</span> : <span>All Good</span>}
              </div>
            </Link>

          </div>

        </div>
      )}
    </div>
    </>
  );
};

export default Home;
