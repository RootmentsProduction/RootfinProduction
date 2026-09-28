import { useState, useEffect } from "react";
import { useEnterToSave } from "../hooks/useEnterToSave";
import Select from "react-select";
import Header from "../components/Header";
import baseUrl from "../api/api";
import { useSidebar } from "../hooks/useSidebar.js";
import { ArrowLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Function to format location names with proper spacing
const formatLocationName = (name) => {
    if (!name) return name;

    // Trim whitespace first
    let formatted = name.trim();

    // Pattern: Single letter (G, Z, S, etc.) followed immediately by a capital letter
    // Example: "GKannur" -> "G Kannur", "GCalicut" -> "G Calicut"
    formatted = formatted.replace(/^([A-Z])([A-Z][a-z])/g, '$1 $2');

    // Also handle cases like "Gkannur" (lowercase after prefix)
    formatted = formatted.replace(/^([A-Z])([a-z])/g, '$1 $2');

    return formatted;
};

// Fallback locations for backward compatibility
const fallbackLocations = [
    { value: "Production", locCode: "101" },
    { value: "Office", locCode: "102" },
    { value: "WAREHOUSE", locCode: "103" },
    { value: "Z-Edapally1", locCode: "144" },
    { value: "G-Edappally", locCode: "702" },
    { value: "SG-Trivandrum", locCode: "700" },
    { value: "Z- Edappal", locCode: "100" },
    { value: "Z.Perinthalmanna", locCode: "133" },
    { value: "Z.Kottakkal", locCode: "122" },
    { value: "G.Kottayam", locCode: "701" },
    { value: "G.Perumbavoor", locCode: "703" },
    { value: "G.Thrissur", locCode: "704" },
    { value: "G.Chavakkad", locCode: "706" },
    { value: "G.Calicut ", locCode: "712" },
    { value: "G.Vadakara", locCode: "708" },
    { value: "G.Edappal", locCode: "707" },
    { value: "G.Perinthalmanna", locCode: "709" },
    { value: "G.Kottakkal", locCode: "711" },
    { value: "G.Manjeri", locCode: "710" },
    { value: "G.Palakkad ", locCode: "705" },
    { value: "G.Kalpetta", locCode: "717" },
    { value: "G.Kannur", locCode: "716" },
    { value: "G.MG Road", locCode: "718" },
    { value: "Dappr Squad", locCode: "555" }
];

const AdminClose = () => {
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [cashDate, setCashDate] = useState("");
    const [cash, setCash] = useState("");
    const [closingCash, setClosingCash] = useState("");
    const [bank, setBank] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [AllLocations, setAllLocations] = useState(fallbackLocations.map((loc) => ({
        ...loc,
        label: formatLocationName(loc.value),
    })));

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '40px',
            height: '40px',
            borderColor: state.isFocused ? '#a855f7' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 1px #a855f7' : 'none',
            '&:hover': {
                borderColor: state.isFocused ? '#a855f7' : '#e5e7eb'
            },
            borderRadius: '0.375rem',
            fontSize: '14px',
            backgroundColor: 'transparent'
        }),
        valueContainer: (provided) => ({
            ...provided,
            padding: '0 12px',
        }),
        input: (provided) => ({
            ...provided,
            margin: '0',
            padding: '0',
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#9ca3af',
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            padding: '8px',
            color: '#6b7280',
            '&:hover': {
                color: '#4b5563'
            }
        })
    };

    const isSidebarOpen = useSidebar();
    const currentUser = JSON.parse(localStorage.getItem("rootfinuser"));
    const email = currentUser?.email;
    const isOfficeUser = currentUser?.locCode === '102';

    // Office users (locCode 102) can only close Office, Production, and Warehouse
    const officeAllowedLocCodes = ['101', '102', '103'];

    useEffect(() => {
        // Use fallback locations directly — these are the correct stores
        const locs = fallbackLocations
            .filter(loc => !isOfficeUser || officeAllowedLocCodes.includes(loc.locCode))
            .map(loc => ({
                ...loc,
                label: formatLocationName(loc.value),
            }));
        setAllLocations(locs);
    }, []);

    // Load existing closing data when location and date are selected
    useEffect(() => {
        const loadExistingData = async () => {
            if (!selectedLocation || !cashDate) {
                // Clear form if location or date is not selected
                setCash("");
                setClosingCash("");
                setBank("");
                setIsEditMode(false);
                return;
            }

            setLoadingData(true);
            try {
                const response = await fetch(
                    `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${selectedLocation.locCode}&date=${cashDate}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.data) {
                        // Pre-fill form with existing data
                        setCash(data.data.cash?.toString() || "");
                        setClosingCash(data.data.Closecash?.toString() || "");
                        setBank(data.data.bank?.toString() || "");
                        setIsEditMode(true);
                        console.log("✅ Loaded existing closing data for editing:", data.data);
                    }
                } else if (response.status === 404) {
                    // No existing data - clear form for new entry
                    setCash("");
                    setClosingCash("");
                    setBank("");
                    setIsEditMode(false);
                    console.log("ℹ️ No existing closing data - ready for new entry");
                }
            } catch (error) {
                console.error("Error loading existing data:", error);
                // Don't clear form on error - let user enter data
            } finally {
                setLoadingData(false);
            }
        };

        loadExistingData();
    }, [selectedLocation, cashDate]);

    const apiUrl5 = `${baseUrl.baseUrl}user/saveCashBank`;

    const handleSubmit = async () => {
        if (!selectedLocation || !cashDate || !cash || !closingCash || !bank) {
            alert("Please fill in all fields.");
            return;
        }

        const payload = {
            totalAmount: closingCash,    // Physical cash (from "Closing Cash" field) → Closecash in DB
            totalCash: cash,             // Calculated closing (from "Cash" field) → cash in DB
            totalBankAmount: bank,
            date: cashDate,
            locCode: selectedLocation.locCode,
            email,
        };

        try {
            setLoading(true);
            const res = await fetch(apiUrl5, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            alert(data.message || `Data ${isEditMode ? 'updated' : 'saved'} successfully!`);

            // Reload the data to confirm the update
            if (isEditMode) {
                const reloadResponse = await fetch(
                    `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${selectedLocation.locCode}&date=${cashDate}`
                );
                if (reloadResponse.ok) {
                    const reloadData = await reloadResponse.json();
                    console.log("✅ Data after update:", reloadData.data);
                }
            }
        } catch (err) {
            console.error(err);
            alert(err.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    // Enter key to save admin close
    useEnterToSave((e) => {
        const syntheticEvent = e || { preventDefault: () => { } };
        handleSubmit();
    }, loading);


    return (
        <>
            <Header title="Admin Close" />
            <div className={`transition-all duration-300 min-h-screen bg-white ${isSidebarOpen ? 'ml-[240px]' : 'ml-0'}`}>
                <div className="px-8 mt-6">
                    {isEditMode && (
                        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md w-max">
                            <p className="text-yellow-800 text-sm font-medium">
                                ✏️ Edit Mode: Updating existing closing data for {selectedLocation?.label} on {cashDate}
                            </p>
                        </div>
                    )}

                    {/* First Row */}
                    <div className="flex flex-wrap gap-8 mb-6">
                        <div className="w-[320px] flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-gray-500">
                                Location
                            </label>
                            <Select
                                options={AllLocations}
                                value={selectedLocation}
                                onChange={setSelectedLocation}
                                placeholder="Select Location"
                                styles={customSelectStyles}
                                isSearchable={true}
                            />
                        </div>

                        <div className="w-[320px] flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-gray-500">
                                Cash Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={cashDate}
                                    onChange={(e) => setCashDate(e.target.value)}
                                    className="w-full border border-gray-200 rounded-md h-[40px] pl-3 pr-10 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10 bg-transparent"
                                />
                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-0" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Second Row */}
                    {loadingData ? (
                        <div className="py-8 w-[320px]">
                            <p className="text-gray-500 text-sm flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Loading data...
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-8 mb-8">
                            <div className="w-[320px] flex flex-col gap-1.5 relative">
                                <label className="text-[13px] font-medium text-gray-500">
                                    Cash (Calculated Closing)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={cash}
                                        onChange={(e) => setCash(e.target.value)}
                                        placeholder="Enter calculated closing cash"
                                        className="w-full border border-gray-200 rounded-md h-[40px] pl-3 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors bg-transparent"
                                    />
                                    {/* Adding a decorative chevron to perfectly match the screenshot */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">Opening + Day's transactions (for next day opening)</p>
                            </div>

                            <div className="w-[320px] flex flex-col gap-1.5 relative">
                                <label className="text-[13px] font-medium text-gray-500">
                                    Closing Cash (Physical Count)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={closingCash}
                                        onChange={(e) => setClosingCash(e.target.value)}
                                        placeholder="Enter physical cash counted"
                                        className="w-full border border-gray-200 rounded-md h-[40px] pl-3 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors bg-transparent"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-0.5">Actual cash counted from denominations</p>
                            </div>

                            <div className="w-[320px] flex flex-col gap-1.5 relative">
                                <label className="text-[13px] font-medium text-gray-500">
                                    Bank
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={bank}
                                        onChange={(e) => setBank(e.target.value)}
                                        placeholder="Enter bank amount"
                                        className="w-full border border-gray-200 rounded-md h-[40px] pl-3 pr-10 text-sm placeholder:text-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors bg-transparent"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        className="bg-[#a855f7] hover:bg-[#9333ea] text-white text-sm font-medium h-[38px] px-6 rounded-md transition-colors disabled:opacity-70 flex items-center justify-center"
                        onClick={handleSubmit}
                        disabled={loading || loadingData}
                    >
                        {loading ? (
                            <><svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>Saving...</>
                        ) : isEditMode ? "Update Close" : "Save Close"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminClose;
