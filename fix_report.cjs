const fs = require('fs');

let content = fs.readFileSync('frontend/src/pages/IncomeExpenseReport.jsx', 'utf8');

// 1. Add DEPT_LOC_CODES
const deptCodesStr = `
  const DEPT_LOC_CODES = ["759", "102", "101", "858", "103"];
  const locCode = canSelectStore ? selectedStore : (user.locCode || "");
  let locCodesToFetch = [];
`;

content = content.replace(
  `  const locCode = canSelectStore ? selectedStore : (user.locCode || "");\n  const twsLocCode = (locCode === "all" || !locCode) ? (user.locCode || "") : locCode;\n\n  const ALL_LOC_CODES = isClusterManager\n    ? clusterAllowedLocCodes\n    : STORE_LIST.map(s => s.locCode);`,
  `  const DEPT_LOC_CODES = ["759", "102", "101", "858", "103"];\n  const ALL_LOC_CODES = isClusterManager\n    ? clusterAllowedLocCodes\n    : STORE_LIST.map(s => s.locCode);\n  const ALL_STORES_ONLY = ALL_LOC_CODES.filter(lc => !DEPT_LOC_CODES.includes(lc));\n  const ALL_DEPTS_ONLY = ALL_LOC_CODES.filter(lc => DEPT_LOC_CODES.includes(lc));\n\n  const locCode = canSelectStore ? selectedStore : (user.locCode || "");`
);

// 2. Replace locCodesToFetch logic
content = content.replace(
  `      const locCodesToFetch = (locCode === "all" || !locCode) ? ALL_LOC_CODES : [twsLocCode];`,
  `      let locCodesToFetch = [locCode];
      if (locCode === "all" || !locCode) {
        locCodesToFetch = ALL_LOC_CODES;
      } else if (locCode === "all_stores") {
        locCodesToFetch = ALL_STORES_ONLY;
      } else if (locCode === "all_depts") {
        locCodesToFetch = ALL_DEPTS_ONLY;
      }`
);

// 3. Replace Mongo logic
content = content.replace(
  `      const mongoRes  = await fetch(\`\${API}/user/Getpayment?LocCode=\${locCode}&DateFrom=\${fromDate}&DateTo=\${toDate}\`);
      let mongoJson = mongoRes.ok ? await mongoRes.json() : {};

      if (isClusterManager && (locCode === "all" || !locCode)) {
        const mongoResults = await Promise.all(
          clusterAllowedLocCodes.map(lc =>
            fetch(\`\${API}/user/Getpayment?LocCode=\${lc}&DateFrom=\${fromDate}&DateTo=\${toDate}\`)
              .then(r => r.ok ? r.json() : {})
              .catch(() => ({}))
          )
        );
        const merged = mongoResults.flatMap(r => Array.isArray(r) ? r : (r?.data || []));
        mongoJson = { data: merged };
      }`,
  `      let mongoJson = { data: [] };
      if (locCode === "all" || locCode === "all_stores" || locCode === "all_depts" || (isClusterManager && (!locCode || locCode === "all"))) {
        const mongoResults = await Promise.all(
          locCodesToFetch.map(lc =>
            fetch(\`\${API}/user/Getpayment?LocCode=\${lc}&DateFrom=\${fromDate}&DateTo=\${toDate}\`)
              .then(r => r.ok ? r.json() : {})
              .catch(() => ({}))
          )
        );
        const merged = mongoResults.flatMap(r => Array.isArray(r) ? r : (r?.data || []));
        mongoJson = { data: merged };
      } else {
        const mongoRes  = await fetch(\`\${API}/user/Getpayment?LocCode=\${locCode}&DateFrom=\${fromDate}&DateTo=\${toDate}\`);
        mongoJson = mongoRes.ok ? await mongoRes.json() : {};
      }`
);

// 4. Update the UI Dropdowns
const dropdownsHtml = `
            {/* Store Dropdown */}
            {canSelectStore && (
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Store
                </label>
                <select
                  value={DEPT_LOC_CODES.includes(selectedStore) || selectedStore === "all_depts" ? "none" : selectedStore}
                  onChange={(e) => {
                     if (e.target.value !== "none") setSelectedStore(e.target.value);
                  }}
                  className="w-full h-[38px] bg-white border border-gray-300 rounded-lg px-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm cursor-pointer"
                >
                  <option value="none" disabled>Select Store</option>
                  <option value="all_stores">{isClusterManager ? "All My Stores" : "All Stores"}</option>
                  {(isClusterManager
                    ? STORE_LIST.filter((s) => clusterAllowedLocCodes.includes(s.locCode) && !DEPT_LOC_CODES.includes(s.locCode))
                    : STORE_LIST.filter((s) => !DEPT_LOC_CODES.includes(s.locCode))
                  ).map((s) => (
                    <option key={s.locCode} value={s.locCode}>
                      {s.locName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Dropdown */}
            {canSelectStore && (
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={(!DEPT_LOC_CODES.includes(selectedStore) && selectedStore !== "all_depts" && selectedStore !== "all") ? "none" : selectedStore}
                  onChange={(e) => {
                     if (e.target.value !== "none") setSelectedStore(e.target.value);
                  }}
                  className="w-full h-[38px] bg-white border border-gray-300 rounded-lg px-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-sm cursor-pointer"
                >
                  <option value="none" disabled>Select Department</option>
                  <option value="all_depts">All Departments</option>
                  {(isClusterManager
                    ? STORE_LIST.filter((s) => clusterAllowedLocCodes.includes(s.locCode) && DEPT_LOC_CODES.includes(s.locCode))
                    : STORE_LIST.filter((s) => DEPT_LOC_CODES.includes(s.locCode))
                  ).map((s) => (
                    <option key={s.locCode} value={s.locCode}>
                      {s.locName}
                    </option>
                  ))}
                </select>
              </div>
            )}
`;

content = content.replace(
  /{canSelectStore && \(\s*<div className="flex-1 min-w-\[160px\]">\s*<label[\s\S]*?<\/div>\s*\)}/,
  dropdownsHtml
);

// 5. Change "all" to "all_stores" in clear button
content = content.replace(/setSelectedStore\("all"\);/g, 'setSelectedStore("all_stores");');

// We also need to fix default selectedStore
content = content.replace(/const \[selectedStore, setSelectedStore\] = useState\("all"\);/g, 'const [selectedStore, setSelectedStore] = useState("all_stores");');

fs.writeFileSync('frontend/src/pages/IncomeExpenseReport.jsx', content);

