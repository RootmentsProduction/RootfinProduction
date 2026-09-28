import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import baseUrl from "../api/api";
import LoadingScreen from "./LoadingScreen";

const DaybookGuard = ({ children }) => {
  const currentuser = JSON.parse(localStorage.getItem("rootfinuser"));
  const isAdminOrSuperAdmin = (currentuser?.power === "admin" || currentuser?.role === "superadmin");
  const isClusterManager = (currentuser?.role || "").toLowerCase() === "cluster_manager";

  const [loading, setLoading] = useState(!isAdminOrSuperAdmin && !isClusterManager);
  const [isFrozen, setIsFrozen] = useState(false);

  useEffect(() => {
    if (isAdminOrSuperAdmin || isClusterManager || !currentuser) {
      setLoading(false);
      return;
    }

    const checkYesterdayClosure = async () => {
      try {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yyyy = yesterday.getFullYear();
        const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
        const dd = String(yesterday.getDate()).padStart(2, "0");
        const formattedYesterday = `${yyyy}-${mm}-${dd}`;

        const apiUrl = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentuser.locCode}&date=${formattedYesterday}`;
        const response = await fetch(apiUrl, { method: "GET" });

        if (!response.ok && response.status === 404) {
          setIsFrozen(true);
        }
      } catch (error) {
        console.error("Error checking yesterday's closure:", error);
      } finally {
        setLoading(false);
      }
    };

    checkYesterdayClosure();
  }, [currentuser, isAdminOrSuperAdmin, isClusterManager]);

  if (loading) {
    return <LoadingScreen title="ROOTFIN" subtitle="Verifying access..." />;
  }

  if (isFrozen) {
    return <Navigate to="/daybook" />;
  }

  return children;
};

export default DaybookGuard;
