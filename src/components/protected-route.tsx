import { getUserDetails, isAuthenticated } from "@/lib/auth";
import React from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "./common/layouts/admin-layout";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userDetails = getUserDetails();
  console.log(userDetails, "userDetails in protected route");
  if (!userDetails || !userDetails.role) {
    // Handle case when userDetails is null or malformed
    return <Navigate to="/login" replace />;
  }

  if (userDetails.role === "USER") {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (userDetails.role === "ADMIN") {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (userDetails.role === "SUPER ADMIN") {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // fallback for unrecognized roles
  // return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
