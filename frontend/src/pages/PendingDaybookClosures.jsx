import React, { useState, useEffect } from "react";
import useSidebar from "../hooks/useSidebar";
import Header from "../components/Header";
import baseUrl from "../api/api";

const PendingDaybookClosures = () => {
  const isSidebarOpen = useSidebar();
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClosures();
  }, []);

  const fetchClosures = async () => {
    try {
      const res = await fetch(`${baseUrl.baseUrl}user/pendingClosures`);
      const data = await res.json();
      setClosures(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`${baseUrl.baseUrl}user/approveClosure/${id}`, { method: "PUT" });
      fetchClosures();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className={`transition-all duration-300 p-6 bg-[#f5f7fb] min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending Daybook Closures</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : closures.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            No pending closures request found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {closures.map(c => (
              <div key={c._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-start border-b pb-3 border-gray-50">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</p>
                    <p className="font-bold text-gray-800">{new Date(c.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                    <p className="font-bold text-blue-600">{c.locCode}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 my-2">
                  <div>
                    <p className="text-xs text-gray-500">System Cash</p>
                    <p className="font-mono text-gray-900">₹{c.cash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Physical Cash</p>
                    <p className="font-mono text-gray-900">₹{c.Closecash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Bank</p>
                    <p className="font-mono text-gray-900">₹{c.bank}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleApprove(c._id)}
                  className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Approve Closure
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PendingDaybookClosures;
