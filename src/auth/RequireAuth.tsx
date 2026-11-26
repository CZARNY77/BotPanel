import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingScreen } from "../components/ui/basics";
import { useT } from "../i18n";

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useT();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen label={t("session.checking")} />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
