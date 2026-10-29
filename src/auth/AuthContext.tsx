import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../api/types";
import { authUrl, getMe, logout } from "../api/endpoints/auth";
import { USE_MOCKS } from "../api/http";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await getMe();
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(() => {
    if (USE_MOCKS) {
      // Mock mode has no OAuth; clear the mock "logged out" flag and enter.
      void import("../api/mocks/router").then(({ mockLogin }) => {
        mockLogin();
        window.location.href = "/dashboard";
      });
      return;
    }
    window.location.href = authUrl;
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refresh,
      login,
      signOut,
    }),
    [user, loading, error, refresh, login, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
