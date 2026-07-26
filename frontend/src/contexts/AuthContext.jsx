import { useCallback, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";
import { AuthContext } from "./AuthStore";

const TOKEN_KEY = "libconnect_token";
const USER_KEY = "libconnect_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((session) => {
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      if (!localStorage.getItem(TOKEN_KEY)) { setIsLoading(false); return; }
      try {
        const profile = await authService.me();
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        setUser(profile);
      } catch { logout(); }
      finally { setIsLoading(false); }
    }
    restoreSession();
  }, [logout]);

  const value = useMemo(() => ({ user, isLoading, isAuthenticated: Boolean(user), login: setSession, logout, setUser }), [user, isLoading, setSession, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
