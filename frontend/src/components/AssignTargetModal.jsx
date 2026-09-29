import React, { useState, useEffect } from "react";
import { X, ChevronDown, CheckCircle } from "lucide-react";
import baseUrl from "../api/api";

const AssignTargetModal = ({ isOpen, onClose, cats, fallbackLocations, currentusers }) => {
  const [storeCode, setStoreCode] = useState(currentusers.locCode || "759");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [week, setWeek] = useState("All");
  
  const [selectedCategory, setSelectedCategory] = useState(cats[0]);
  const [subCategory, setSubCategory] = useState(cats[0].subs?.length > 0 ? "All" : "");
  const [targetAmount, setTargetAmount] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const weeks = ["All", "W1", "W2", "W3", "W4"];

  useEffect(() => {
    if (isOpen) {
      fetchExistingTarget();
    }
  }, [isOpen, storeCode, month, week, selectedCategory, subCategory]);

  const handleCategoryChange = (val) => {
    const cat = cats.find(c => c.value === val);
    setSelectedCategory(cat);
    setSubCategory(cat.subs?.length > 0 ? "All" : "");
  };

  const fetchExistingTarget = async () => {
    setIsLoading(true);
    setSuccessMsg("");
    try {
      const query = new URLSearchParams({
        storeCode,
        month,
        week,
        category: selectedCategory.value,
        subCategory: subCategory || "",
      });
      const res = await fetch(`${baseUrl.baseUrl}api/expense-targets?${query}`);
      const data = await res.json();
      if (data.success && data.target) {
        setTargetAmount(data.target.targetAmount.toString());
      } else {
        setTargetAmount("");
      }
    } catch (err) {
      console.error("Error fetching target:", err);
      setTargetAmount("");
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!targetAmount || isNaN(targetAmount)) {
      alert("Please enter a valid target amount");
      return;
    }
    
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const payload = {
        storeCode,
        month,
        week,
        category: selectedCategory.value,
        subCategory: subCategory || "",
        targetAmount: Number(targetAmount)
      };

      const res = await fetch(`${baseUrl.baseUrl}api/expense-targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMsg("Expense limit saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.message || "Failed to save limit");
      }
    } catch (err) {
      console.error("Error saving limit:", err);
      alert("Failed to save limit");
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Set Expense Limit</h2>
            <p className="text-sm text-gray-500">Set expense limits for a store</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto bg-[#fafafa]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Store */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Store</label>
              <div className="relative">
                <select
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-500 pr-10 cursor-pointer"
                >
                  {fallbackLocations.map(loc => (
                    <option key={loc.locCode} value={loc.locCode}>{loc.locName}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Month */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Month</label>
              <div className="relative">
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Week Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Select Period</label>
            <div className="flex flex-wrap gap-3">
              {weeks.map(w => (
                <button
                  key={w}
                  onClick={() => setWeek(w)}
                  className={`flex-1 min-w-[80px] py-3 px-4 rounded-xl text-sm font-semibold transition-all border
                    ${week === w 
                      ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Category</label>
              <div className="relative">
                <select
                  value={selectedCategory.value}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-500 pr-10 cursor-pointer"
                >
                  {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Sub Category */}
            {selectedCategory.subs?.length > 0 ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Sub Category</label>
                <div className="relative">
                  <select
                    value={subCategory}
                    onChange={e => setSubCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-indigo-500 pr-10 cursor-pointer"
                  >
                    <option value="All">All</option>
                    {selectedCategory.subs.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ) : <div className="hidden md:block"></div>}
          </div>

          {/* Target Amount */}
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Limit Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder={isLoading ? "Loading..." : "e.g. 50000"}
                disabled={isLoading}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-5 py-4 text-lg font-bold text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-300"
              />
            </div>
            {targetAmount && !isLoading && (
               <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                 <CheckCircle size={14} /> Value loaded / entered.
               </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-between items-center rounded-b-xl">
          <div className="text-sm font-medium text-green-600">
            {successMsg && <span className="flex items-center gap-1"><CheckCircle size={16}/> {successMsg}</span>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-8 py-2.5 rounded-lg bg-[#0a142f] text-white font-medium hover:bg-[#162548] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              {isSaving ? "Saving..." : "Save Limit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTargetModal;
