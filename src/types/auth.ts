export type UserRole = "STUDENT" | "MENTOR" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface SessionContextValue {
  user: CurrentUser | null;
  role: UserRole | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  switchRole: (role: UserRole | null) => void;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  resetMockData: () => void;
}
