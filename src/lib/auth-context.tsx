"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { setTokens, clearTokens, apiFetch } from "./api";

interface Business {
  id: string;
  email: string;
  companyName: string;
  currency: string;
}

interface AuthContextValue {
  business: Business | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    companyName: string;
    companyAddress?: string;
    taxId?: string;
    currency?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const stored = localStorage.getItem("business");
    if (token && stored) {
      setBusiness(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{
      accessToken: string;
      refreshToken: string;
      business: Business;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem("business", JSON.stringify(data.business));
    setBusiness(data.business);
  }, []);

  const register = useCallback(
    async (body: {
      email: string;
      password: string;
      companyName: string;
      companyAddress?: string;
      taxId?: string;
      currency?: string;
    }) => {
      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        business: Business;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem("business", JSON.stringify(data.business));
      setBusiness(data.business);
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem("business");
    setBusiness(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext value={{ business, isLoading, login, register, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
