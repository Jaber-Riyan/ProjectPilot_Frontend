export type UserRole = "STUDENT" | "MENTOR" | "ADMIN";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
}

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: CurrentUser;
  token: string;
}

export interface MeResponseData {
  user: CurrentUser;
}

export interface SessionContextValue {
  user: CurrentUser | null;
  role: UserRole | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  token: string | null;
  login: (credentials: LoginInput) => Promise<CurrentUser>;
  quickLogin: (role: UserRole) => Promise<CurrentUser>;
  signup: (data: SignupInput) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole | null) => void;
  resetMockData: () => void;
}
