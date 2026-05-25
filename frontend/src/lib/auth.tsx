import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetProfile, useLogout, type UserProfile } from "./api";

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: UserProfile | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("btms_token"));
  const [, setLocation] = useLocation();

  const handleSetToken = (newToken: string | null) => {
    if (newToken) { localStorage.setItem("btms_token", newToken); }
    else { localStorage.removeItem("btms_token"); }
    setToken(newToken);
  };

  const { data: user, isLoading, isError } = useGetProfile({ query: { enabled: !!token, queryKey: ["/api/user/profile"] } });
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try { await logoutMutation.mutateAsync(); } catch {}
    finally { handleSetToken(null); setLocation("/login"); }
  };

  useEffect(() => {
    if (isError && token) { handleSetToken(null); setLocation("/login"); }
  }, [isError, token]);

  return (
    <AuthContext.Provider value={{ token, setToken: handleSetToken, user: user || null, isLoading: !!token && isLoading, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function PrivateRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { token, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!isLoading && !token) setLocation("/login"); }, [token, isLoading]);
  if (isLoading) return <div className="flex h-screen w-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!token) return null;
  return <Component />;
}
