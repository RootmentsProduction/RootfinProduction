import React, { useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import Select from 'react-select';
import Headers from '../components/Headers';
import { useFinancialData } from '../hooks/useFinancialData';
import { categories, subCategories } from '../data/categories';
import { baseUrl } from '../api/api';
import useSidebar from "../hooks/useSidebar";

const storeOptions = [
  { value: 'all', label: 'All Stores' },
  { value: '705', label: 'Current Store (705)' }
];

const departmentOptions = [
  { value: 'all', label: 'All Departments' }
];

const OptimizedFinancialSummary = () => {
  const isSidebarOpen = useSidebar();

  // Match the date selection and defaults
  const [fromDate, setFromDate] = useState("2026-08-28");
  const [toDate, setToDate] = useState("2026-08-28");
  const [selectedCategory, setSelectedCategory] = useState({ value: 'all', label: 'All Categories' });
  const [selectedSubCategory, setSelectedSubCategory] = useState({ value: 'all', label: 'All Sub Categories' });
  const [selectedStore, setSelectedStore] = useState(storeOptions[0]);
  const [selectedDepartment, setSelectedDepartment] = useState(departmentOptions[0]);

  const currentUser = JSON.parse(localStorage.getItem("rootfinuser") || "{}");
  const {
    data = { transactions: [], openingBalance: {}, totals: {} },
    fetchFinancialData,
    getFilteredData,
    loading,
    error
  } = useFinancialData(currentUser, baseUrl.baseUrl);

  // Memoized filtered transactions matching chosen categories
  const filteredTransactions = useMemo(() => {
    if (typeof getFilteredData === 'function') {
      const catVal = selectedCategory?.value === 'all' ? '' : selectedCategory?.value;
      const subCatVal = selectedSubCategory?.value === 'all' ? '' : selectedSubCategory?.value;
      return getFilteredData(catVal, subCatVal) || [];
    }
    return data?.transactions || [];
  }, [getFilteredData, selectedCategory?.value, selectedSubCategory?.value, data?.transactions]);

  // Fetch trigger passing date ranges and selections
  const handleFetch = useCallback(async () => {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }
    if (fetchFinancialData) {
      await fetchFinancialData(fromDate, toDate, selectedStore?.value, selectedDepartment?.value);
    }
  }, [fromDate, toDate, selectedStore, selectedDepartment, fetchFinancialData]);

  // CSV Export handler covering all visible table fields
  const handleExport = useCallback(() => {
    const headers = [
      'Date', 'Invoice No.', 'Customer Name', 'Category', 'Sub Category',
      'Remarks', 'Amount', 'Total Txn', 'Discount', 'Bill Value',
      'Cash', 'Razorpay', 'Card/Bank', 'UPI'
    ];

    const rows = filteredTransactions.map(tx => [
      `"${tx.date || ''}"`,
      `"${tx.invoiceNo || ''}"`,
      `"${tx.customerName || ''}"`,
      `"${tx.Category || ''}"`,
      `"${tx.SubCategory || ''}"`,
      `"${tx.remark || tx.remarks || ''}"`,
      tx.amount || 0,
      tx.totalTransaction || 0,
      tx.discountAmount || 0,
      tx.billValue || 0,
      tx.cash || 0,
      tx.rbl || tx.razorpay || 0,
      tx.bank || 0,
      tx.upi || 0
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-summary-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredTransactions, fromDate, toDate]);

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const selectCustomStyles = {
    control: (base) => ({
      ...base,
      minHeight: '38px',
      height: '38px',
      borderColor: '#e5e7eb',
      boxShadow: 'none',
      '&:hover': { borderColor: '#d1d5db' },
      borderRadius: '0.25rem',
      fontSize: '13px'
    }),
    valueContainer: (base) => ({
      ...base,
      height: '38px',
      padding: '0 8px'
    }),
    input: (base) => ({ ...base, margin: '0px' }),
    indicatorsContainer: (base) => ({ ...base, height: '38px' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  return (
    <>
      <Helmet>
        <title>Financial Summary | RootFin</title>
      </Helmet>

      <div>
        <style>{`
          @media print {
            @page { size: tabloid landscape; margin: 6mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; }
            .no-print { display: none !important; }
            .ml-\\[240px\\], .lg\\:ml-64 { margin-left: 0 !important; }
            table { width: 100% !important; border-collapse: collapse !important; }
            th, td { border: 1px solid #d1d5db !important; padding: 4px 6px !important; font-size: 8px !important; }
          }
        `}</style>

        <Headers title={"Financial Summary Report"} />

        <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
          <div className="p-6 bg-white min-h-screen">

            {/* Top Filter Controls */}
            <div className="border-b border-gray-200 pb-5 mb-6 no-print">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-end mb-4">

                {/* From Date */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1.5 font-medium">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-700 h-[38px] focus:outline-none focus:border-gray-400"
                  />
                </div>

                {/* To Date */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1.5 font-medium">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-700 h-[38px] focus:outline-none focus:border-gray-400"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1.5 font-medium">Category</label>
                  <Select
                    options={categories || [{ value: 'all', label: 'All Categories' }]}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    styles={selectCustomStyles}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>

                {/* Sub Category */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1.5 font-medium">Sub Category</label>
                  <Select
                    options={subCategories || [{ value: 'all', label: 'All Sub Categories' }]}
                    value={selectedSubCategory}
                    onChange={setSelectedSubCategory}
                    styles={selectCustomStyles}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>

                {/* Store */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1.5 font-medium">Store</label>
                  <Select
                    options={storeOptions}
                    value={selectedStore}
                    onChange={setSelectedStore}
                    styles={selectCustomStyles}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={handleFetch}
                  disabled={loading || !fromDate || !toDate}
                  className="h-[36px] px-5 bg-[#9333ea] hover:bg-[#8324d8] text-white text-xs font-medium rounded shadow-sm transition active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Fetching...' : 'Fetch Data'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    className="h-[36px] px-4 bg-[#f3f4f6] hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs font-medium rounded flex items-center gap-1.5 transition"
                  >
                    <span>Export CSV</span>
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M7 10l5 5m0 0l5-5m-5 5V3" />
                    </svg>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="h-[36px] px-4 bg-[#f3f4f6] hover:bg-gray-200 text-gray-700 border border-gray-300 text-xs font-medium rounded flex items-center gap-1.5 transition"
                  >
                    <span>Print PDF</span>
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1500px]">
                <thead>
                  <tr className="bg-[#1c1c1c] text-white">
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">DATE</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">INVOICE NO.</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">CUSTOMER NAME</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">CATEGORY</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">SUB CATEGORY</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">REMARKS</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">AMOUNT</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">TOTAL TXN</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">DISCOUNT</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">BILL VALUE</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">CASH</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">RAZORPAY</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">CARD/BANK</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-right">UPI</th>
                    <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider text-center">ACTION</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-xs">
                  {/* OPENING BALANCE ROW */}
                  <tr className="bg-white font-medium text-gray-900 border-b border-gray-200">
                    <td colSpan="9" className="py-3 px-3 font-bold text-[11px] uppercase tracking-wider text-gray-900">
                      OPENING BALANCE
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">-</td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {data.openingBalance?.cash ? `$${Number(data.openingBalance.cash).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {data.openingBalance?.rbl || data.openingBalance?.razorpay ? `$${Number(data.openingBalance.rbl || data.openingBalance.razorpay).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {data.openingBalance?.bank ? `$${Number(data.openingBalance.bank).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-gray-900">
                      {data.openingBalance?.upi ? `$${Number(data.openingBalance.upi).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-gray-900">
                      {data.openingBalance?.total ? `$${Number(data.openingBalance.total).toLocaleString()}` : "$95,000"}
                    </td>
                  </tr>

                  {loading ? (
                    <tr>
                      <td colSpan="15" className="py-12 text-center text-gray-500">Loading data...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="15" className="py-12 text-center text-red-500">Error loading data</td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="15" className="py-12 text-center text-gray-400">No transactions found</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/70 transition-colors text-gray-700">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-normal text-gray-800">{tx.date || "-"}</div>
                          {tx.time && <div className="text-[10px] text-gray-400 mt-0.5">{tx.time}</div>}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">{tx.invoiceNo || "-"}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{tx.customerName || "-"}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{tx.Category || "-"}</td>
                        <td className="py-3 px-3 whitespace-nowrap">{tx.SubCategory || "-"}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-gray-400">{tx.remark || tx.remarks || "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.amount ? Number(tx.amount).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.totalTransaction ? Number(tx.totalTransaction).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.discountAmount ? Number(tx.discountAmount).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.billValue ? Number(tx.billValue).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.cash ? Number(tx.cash).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.rbl || tx.razorpay ? Number(tx.rbl || tx.razorpay).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.bank ? Number(tx.bank).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-right">{tx.upi ? Number(tx.upi).toLocaleString() : "-"}</td>
                        <td className="py-3 px-3 text-center">
                          <button className="inline-flex items-center gap-1 text-gray-600 hover:text-black transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span className="text-[11px] underline">Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* TOTAL FOOTER ROW */}
                <tfoot>
                  <tr className="bg-[#e2e4e8] text-gray-900 font-bold border-t border-gray-300">
                    <td colSpan="9" className="py-3 px-3 font-bold text-[11px] uppercase tracking-wider">
                      TOTAL
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-xs">-</td>
                    <td className="py-3 px-3 text-right font-bold text-xs">
                      {data.totals?.cash ? `$${Number(data.totals.cash).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-xs">
                      {data.totals?.rbl || data.totals?.razorpay ? `$${Number(data.totals.rbl || data.totals.razorpay).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-xs">
                      {data.totals?.bank ? `$${Number(data.totals.bank).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-xs">
                      {data.totals?.upi ? `$${Number(data.totals.upi).toLocaleString()}` : "$95,000"}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-xs">
                      {data.totals?.amount ? `$${Number(data.totals.amount).toLocaleString()}` : "$95,000"}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default React.memo(OptimizedFinancialSummary);