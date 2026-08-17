"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { auth as authApi, type RegisterPayload } from "@/lib/api/endpoints";
import type { User } from "@/lib/api/types";

interface AuthContextValue {
  user: User | null;
  /** True until the initial session check finishes. */
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch (error) {
      // A 401 here is the normal signed-out case, not a failure worth
      // surfacing. Anything else is genuinely unexpected.
      if (!(error instanceof ApiError && error.isUnauthenticated)) {
        console.error("Failed to load the current user", error);
      }
      setUser(null);
    }
  }, []);

  // Restores the session on first load: the cookie survives a refresh, but
  // React state does not.
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      const { data } = await authApi.login(email, password, remember);
      setUser(data);
      return data;
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    const { data } = await authApi.register(payload);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      // Clear local state even if the request fails, so the UI can never show
      // someone as signed in after they asked to leave.
      setUser(null);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const hasRole = useCallback(
    (...roles: string[]) => roles.some((role) => user?.roles.includes(role)),
    [user],
  );

  const can = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, hasRole, can }),
    [user, loading, login, register, logout, refresh, hasRole, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
