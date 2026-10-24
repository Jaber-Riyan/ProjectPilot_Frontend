"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CurrentUser, SessionContextValue, SessionStatus, UserRole } from "@/types/auth";
import { APP_CONFIG } from "@/config/app-config";
import { MOCK_USERS } from "@/lib/mock-data/fixtures";
import { mockStore } from "@/lib/mock-data/store";
import { useQueryClient } from "@tanstack/react-query";

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function MockSessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  // Load active mock session from localStorage (defaulting to STUDENT for smooth initial exploration)
  useEffect(() => {
    try {
      const storedRole = window.localStorage.getItem(APP_CONFIG.storageKeys.mockSessionRole);
      if (storedRole === "GUEST" || storedRole === "null") {
        setUser(null);
        setStatus("unauthenticated");
      } else {
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
            avatarUrl: fixture.avatarUrl,
          });
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    } catch {
      // SSR fallback or storage blocked
      const fallback = MOCK_USERS.find((u) => u.role === "STUDENT")!;
      setUser({
        id: fallback.id,
        name: fallback.name,
        email: fallback.email,
        role: fallback.role,
      });
      setStatus("authenticated");
    }
  }, []);

  const switchRole = useCallback(
    (role: UserRole | null) => {
      setStatus("loading");
      if (!role) {
        // Guest mode
        setUser(null);
        setStatus("unauthenticated");
        try {
          window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, "GUEST");
        } catch {}
      } else {
        const fixture = MOCK_USERS.find((u) => u.role === role);
        if (fixture) {
          setUser({
            id: fixture.id,
            name: fixture.name,
            email: fixture.email,
            role: fixture.role,
            avatarUrl: fixture.avatarUrl,
          });
          setStatus("authenticated");
          try {
            window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, role);
          } catch {}
        }
      }
      // Invalidate all queries on role switch so the UI re-queries with the new scope
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const login = useCallback(
    async (email: string, role?: UserRole) => {
      setStatus("loading");
      await mockStore.delay(200);

      const target =
        MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
        (role ? MOCK_USERS.find((u) => u.role === role) : null) ||
        MOCK_USERS.find((u) => u.role === "STUDENT")!;

      setUser({
        id: target.id,
        name: target.name,
        email: target.email,
        role: target.role,
        avatarUrl: target.avatarUrl,
      });
      setStatus("authenticated");
      try {
        window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, target.role);
      } catch {}
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    setStatus("loading");
    await mockStore.delay(100);
    setUser(null);
    setStatus("unauthenticated");
    try {
      window.localStorage.setItem(APP_CONFIG.storageKeys.mockSessionRole, "GUEST");
    } catch {}
    queryClient.invalidateQueries();
  }, [queryClient]);

  const resetMockData = useCallback(() => {
    mockStore.resetToDefaults();
    queryClient.invalidateQueries();
  }, [queryClient]);

  const value: SessionContextValue = {
    user,
    role: user?.role ?? null,
    status,
    isAuthenticated: status === "authenticated" && user !== null,
    switchRole,
    login,
    logout,
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
