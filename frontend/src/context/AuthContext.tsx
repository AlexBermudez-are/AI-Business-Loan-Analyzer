import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { AuthResponse, User } from "../types/api";

interface Session {
  accessToken: string;
  user: User;
}

interface AuthContextValue {
  session: Session | null;
  setAuthenticatedSession: (response: AuthResponse) => void;
  logout: () => void;
}

const STORAGE_KEY = "sovereign-fiscal:session:v1";
const AuthContext = createContext<AuthContextValue | null>(null);

const readSession = (): Session | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Session) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<Session | null>(readSession);

  const setAuthenticatedSession = useCallback((response: AuthResponse) => {
    const nextSession = {
      accessToken: response.accessToken,
      user: response.user,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, setAuthenticatedSession, logout }),
    [logout, session, setAuthenticatedSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
};
