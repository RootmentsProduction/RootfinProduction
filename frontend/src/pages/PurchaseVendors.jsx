import { useMemo, useState, useEffect } from "react";
import Head from "../components/Head";
import { Link, useLocation } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import baseUrl from "../api/api";
import useSidebar from "../hooks/useSidebar";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

const PurchaseVendors = () => {
  const isSidebarOpen = useSidebar();
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Load vendors from API and localStorage
  useEffect(() => {
    const loadVendors = async () => {
      try {
        const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

        // Get user info - use email as primary identifier
        const userStr = localStorage.getItem("rootfinuser");
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.email || null;
        const userPower = user?.power || "";

        let vendorsFromAPI = [];

        // Try to fetch from PostgreSQL API first
        if (userId) {
          try {
            const response = await fetch(`${API_URL}/api/purchase/vendors?userId=${encodeURIComponent(userId)}${userPower ? `&userPower=${encodeURIComponent(userPower)}` : ""}`);
            if (response.ok) {
              const data = await response.json();
              vendorsFromAPI = Array.isArray(data) ? data : [];
            }
          } catch (apiError) {
            console.warn("API fetch failed, trying localStorage:", apiError);
          }
        }

        // Fallback to localStorage if API returns no vendors or fails
        let vendorsFromLocalStorage = [];
        try {
          const savedVendors = JSON.parse(localStorage.getItem("vendors") || "[]");
          vendorsFromLocalStorage = Array.isArray(savedVendors) ? savedVendors : [];
        } catch (localError) {
          console.warn("Error reading localStorage:", localError);
        }

        // Combine both sources, prioritizing API results
        // Use a Map to avoid duplicates (by displayName or id)
        const vendorMap = new Map();

        // Add API vendors first
        vendorsFromAPI.forEach(vendor => {
          const key = vendor.displayName || vendor.companyName || vendor._id || vendor.id;
          if (key) vendorMap.set(key, vendor);
        });

        // Add localStorage vendors if not already present
        vendorsFromLocalStorage.forEach(vendor => {
          const key = vendor.displayName || vendor.companyName || vendor.id;
          if (key && !vendorMap.has(key)) {
            vendorMap.set(key, vendor);
          }
        });

        // Convert to array and ensure each vendor has an id field (use _id if id doesn't exist)
        const allVendors = Array.from(vendorMap.values()).map(vendor => ({
          ...vendor,
          id: vendor.id || vendor._id || vendor.displayName || vendor.companyName,
        }));

        setVendors(allVendors);
      } catch (error) {
        console.error("Error loading vendors:", error);
        // Final fallback to localStorage only
        try {
          const savedVendors = JSON.parse(localStorage.getItem("vendors") || "[]");
          setVendors(savedVendors);
        } catch {
          setVendors([]);
        }
      }
    };

    loadVendors();

    // Listen for storage events to update when vendors are added from another tab/window
    const handleStorageChange = (e) => {
      if (e.key === "vendors") {
        loadVendors();
      }
    };

    // Listen for custom event when vendor is saved in the same tab
    const handleVendorSaved = () => {
      loadVendors();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("vendorSaved", handleVendorSaved);

    // Also reload when location changes (when coming back from create page)
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("vendorSaved", handleVendorSaved);
    };
  }, [location]);

  // Filter vendors based on search term
  const filteredVendors = useMemo(() => {
    // First filter out inactive vendors (only show active by default)
    const activeVendors = vendors.filter(v => {
      // If explicitly marked as inactive in either field, filter it out
      if (v.isActive === false || v.isActive === 'false' || v.status === 'inactive') {
        return false;
      }
      return true;
    });

    if (!searchTerm) return activeVendors;
    const term = searchTerm.toLowerCase();
    return activeVendors.filter((v) => {
      const name = (v.displayName || v.companyName || v.name || `${v.firstName || ""} ${v.lastName || ""}`).toLowerCase();
      const company = (v.companyName || "").toLowerCase();
      const email = (v.email || "").toLowerCase();
      const phone = (v.phone || v.mobile || "").toLowerCase();
      return name.includes(term) || company.includes(term) || email.includes(term) || phone.includes(term);
    });
  }, [vendors, searchTerm]);

  const allSelected = useMemo(() => selected.size > 0 && selected.size === filteredVendors.length && filteredVendors.length > 0, [selected, filteredVendors.length]);

  const toggleAll = (checked) => {
    if (checked) {
      setSelected(new Set(filteredVendors.map((v) => v.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className={`transition-all duration-300 min-h-screen bg-[#f5f7fb] p-3 sm:p-6 ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
      <Head
        title="All Vendors"
        description=""
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (filteredVendors.length === 0) return alert("No vendors to export");

                const headers = ["Name", "Company Name", "Email", "Work Phone", "GST Treatment", "Payables", "Unused Credits"];
                const rows = filteredVendors.map(v => [
                  v.displayName || `${v.firstName || ""} ${v.lastName || ""}`.trim(),
                  v.companyName || "-",
                  v.email || "-",
                  v.phone || v.mobile || "-",
                  v.gstTreatment || "-",
                  v.payables || 0,
                  v.credits || 0
                ]);

                const csvContent = [
                  headers.map(h => `"${h}"`).join(","),
                  ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
                ].join("\n");

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.setAttribute("href", URL.createObjectURL(blob));
                link.setAttribute("download", `all_vendors_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center rounded-md border border-[#facc15]/30 bg-[#fff7ed] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#b45309] shadow-sm hover:bg-[#ffedd5]"
            >
              Export All
            </button>
            <Link
              to="/purchase/vendors/new"
              className="rounded-md bg-[#3762f9] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
            >
              New
            </Link>
          </div>
        }
      />

      <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
        {/* Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100">
            <SlidersHorizontal size={16} />
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search vendors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-60 rounded-md border border-gray-300 px-3 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1c1c1c] text-white">
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-center w-10">
                  #
                </th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">Name</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">Company Name</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">Email</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">Work Phone</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider">GST Treatment</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">Payables (BCY)</th>
                <th className="py-3.5 px-4 text-[11px] font-bold uppercase tracking-wider text-right">Unused Credits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-gray-500">
                    {searchTerm ? "No vendors found matching your search." : "No vendors added yet. Click 'New' to add a vendor."}
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v, index) => (
                  <tr key={v.id} className="hover:bg-gray-50/70 transition-colors text-gray-800">
                    <td className="px-5 py-4 text-center text-sm text-gray-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        to={`/purchase/vendors/${v._id || v.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {v.displayName || v.companyName || v.name || `${v.firstName || ""} ${v.lastName || ""}`.trim()}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{v.companyName || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">{v.email || "-"}</td>
                    <td className="px-5 py-4 text-gray-600">{v.phone || v.mobile || "-"}</td>
                    <td className="px-5 py-4 whitespace-pre-line text-gray-600">{v.gstTreatment || "-"}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">{currency(v.payables || 0)}</td>
                    <td className="px-5 py-4 text-right text-gray-600 font-medium">{currency(v.credits || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseVendors;


