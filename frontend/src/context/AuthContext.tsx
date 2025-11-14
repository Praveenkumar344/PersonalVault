// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import api, { setAccessToken } from "../api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.post("/api/auth/refresh", {}); // refresh via cookie
        if (res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          setUser(res.data.user);
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }; 
    checkAuth();
  }, []);

  const login = (token: string, userData: any) => {
    setAccessToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken("");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
