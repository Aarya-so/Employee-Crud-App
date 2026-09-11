import { createContext, useContext, useEffect, useState, useCallback } from "react";
import client, { extractErrorMessage } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("ems_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await client.get("/me");
      setUser(data);
    } catch {
      localStorage.removeItem("ems_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  async function login(email, password) {
    try {
      const { data } = await client.post("/login", { email, password });
      localStorage.setItem("ems_token", data.access_token);
      setUser(data.user);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: extractErrorMessage(error) };
    }
  }

  async function signup(name, email, password) {
    try {
      await client.post("/signup", { name, email, password });
      return login(email, password);
    } catch (error) {
      return { ok: false, message: extractErrorMessage(error) };
    }
  }

  function logout() {
    localStorage.removeItem("ems_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
