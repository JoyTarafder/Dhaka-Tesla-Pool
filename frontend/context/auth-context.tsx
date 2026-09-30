"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, apiGetMe, apiLogin, apiRegister, AuthResponse } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "PASSENGER" | "DRIVER") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount (instant hydration to prevent reload flash)
  useEffect(() => {
    const savedToken = localStorage.getItem("dhaka_tesla_token");
    const savedUser = localStorage.getItem("dhaka_tesla_user");

    if (savedToken) {
      setToken(savedToken);
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // If parse fails, fallback to network fetch
        }
      }

      apiGetMe(savedToken)
        .then((res) => {
          setUser(res.user);
          localStorage.setItem("dhaka_tesla_user", JSON.stringify(res.user));
        })
        .catch(() => {
          localStorage.removeItem("dhaka_tesla_token");
          localStorage.removeItem("dhaka_tesla_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthSuccess = (res: AuthResponse) => {
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem("dhaka_tesla_token", res.token);
    localStorage.setItem("dhaka_tesla_user", JSON.stringify(res.user));
  };

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    handleAuthSuccess(res);
  };

  const register = async (name: string, email: string, password: string, role: "PASSENGER" | "DRIVER") => {
    const res = await apiRegister({ name, email, password, role });
    handleAuthSuccess(res);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("dhaka_tesla_token");
    localStorage.removeItem("dhaka_tesla_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
