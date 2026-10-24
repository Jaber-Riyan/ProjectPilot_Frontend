"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import type {
  CurrentUser,
  SessionContextValue,
  SessionStatus,
  UserRole,
  LoginInput,
  SignupInput,
} from "@/types/auth";
import { APP_CONFIG } from "@/config/app-config";
import { MOCK_USERS } from "@/lib/mock-data/fixtures";
import { mockStore } from "@/lib/mock-data/store";
import { setAccessTokenProvider } from "@/lib/api/client";
import { authService } from "@/lib/services/auth.service";
import { useQueryClient } from "@tanstack/react-query";

const TOKEN_STORAGE_KEY = "projectpilot_auth_token";

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function MockSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  // Register token provider with the shared api client
  useEffect(() => {
    setAccessTokenProvider(() => tokenRef.current);
  }, []);

  // Restore session on app initialization
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken =
          typeof window !== "undefined"
            ? window.localStorage.getItem(TOKEN_STORAGE_KEY)
            : null;

        if (storedToken) {
          tokenRef.current = storedToken;
          setToken(storedToken);

          try {
            const meData = await authService.getMe();
            if (meData?.user) {
              setUser(meData.user);
              setStatus("authenticated");
              return;
            }
          } catch (err) {
            console.warn("Session restoration token expired or invalid:", err);
            // Clear invalid token
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
            tokenRef.current = null;
            setToken(null);
          }
        }

        // Fallback: check development role simulation flag if no real token exists
        const storedRole =
          typeof window !== "undefined"
            ? window.localStorage.getItem(APP_CONFIG.storageKeys.mockSessionRole)
            : null;

        if (storedRole && storedRole !== "GUEST" && storedRole !== "null") {
          const targetRole: UserRole =
            storedRole === "MENTOR" || storedRole === "ADMIN" || storedRole === "STUDENT"
              ? storedRole
              : "STUDENT";

          const fixture = MOCK_USERS.find((u) => u.role === targetRole);
          if (fixture) {
            setUser({
              id: fixture.id,
              name: fixture.name,
              email: fixture.email,
              role: fixture.role,
              isActive: fixture.status === "ACTIVE",
              createdAt: fixture.createdAt,
              avatarUrl: fixture.avatarUrl,
            });
            setStatus("authenticated");
            return;
          }
        }

        setUser(null);
        setStatus("unauthenticated");
      } catch (err) {
        console.error("Failed to restore session:", err);
        setUser(null);
        setStatus("unauthenticated");
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(
    async (credentials: LoginInput): Promise<CurrentUser> => {
      setStatus("loading");
      try {
        const authData = await authService.login(credentials);
        const { user: authedUser, token: authToken } = authData;

        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
          window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, authedUser.role);
        }

        tokenRef.current = authToken;
        setToken(authToken);
        setUser(authedUser);
        setStatus("authenticated");
        queryClient.invalidateQueries();
        return authedUser;
      } catch (error) {
        setStatus("unauthenticated");
        throw error;
      }
    },
    [queryClient]
  );

  const quickLogin = useCallback(
    async (role: UserRole): Promise<CurrentUser> => {
      setStatus("loading");
      try {
        const authData = await authService.quickLogin(role);
        const { user: authedUser, token: authToken } = authData;

        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
          window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, authedUser.role);
        }

        tokenRef.current = authToken;
        setToken(authToken);
        setUser(authedUser);
        setStatus("authenticated");
        queryClient.invalidateQueries();
        return authedUser;
      } catch (error) {
        setStatus("unauthenticated");
        throw error;
      }
    },
    [queryClient]
  );

  const signup = useCallback(
    async (data: SignupInput): Promise<CurrentUser> => {
      setStatus("loading");
      try {
        const authData = await authService.signup(data);
        const { user: authedUser, token: authToken } = authData;

        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
          window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, authedUser.role);
        }

        tokenRef.current = authToken;
        setToken(authToken);
        setUser(authedUser);
        setStatus("authenticated");
        queryClient.invalidateQueries();
        return authedUser;
      } catch (error) {
        setStatus("unauthenticated");
        throw error;
      }
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    setStatus("loading");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, "GUEST");
    }
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
    queryClient.invalidateQueries();
  }, [queryClient]);

  const switchRole = useCallback(
    (role: UserRole | null) => {
      setStatus("loading");
      if (!role) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, "GUEST");
        }
        tokenRef.current = null;
        setToken(null);
        setUser(null);
        setStatus("unauthenticated");
      } else {
        const fixture = MOCK_USERS.find((u) => u.role === role);
        if (fixture) {
          setUser({
            id: fixture.id,
            name: fixture.name,
            email: fixture.email,
            role: fixture.role,
            isActive: fixture.status === "ACTIVE",
            createdAt: fixture.createdAt,
            avatarUrl: fixture.avatarUrl,
          });
          setStatus("authenticated");
          if (typeof window !== "undefined") {
            window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, role);
          }
        }
      }
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const resetMockData = useCallback(() => {
    mockStore.resetToDefaults();
    queryClient.invalidateQueries();
  }, [queryClient]);

  const value: SessionContextValue = {
    user,
    role: user?.role ?? null,
    status,
    isAuthenticated: status === "authenticated" && user !== null,
    token,
    login,
    quickLogin,
    signup,
    logout,
    switchRole,
    resetMockData,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a MockSessionProvider");
  }
  return context;
}
