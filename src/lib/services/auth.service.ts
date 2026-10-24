import { apiRequest } from "@/lib/api/client";
import type {
  LoginInput,
  SignupInput,
  AuthResponseData,
  MeResponseData,
  UserRole,
} from "@/types/auth";

export class AuthService {
  /**
   * Log in using real credentials against POST /api/v1/auth/login.
   */
  async login(input: LoginInput): Promise<AuthResponseData> {
    return apiRequest<AuthResponseData>("auth/login", {
      method: "POST",
      body: input,
      authenticated: false,
    });
  }

  /**
   * Register a new user against POST /api/v1/auth/signup.
   */
  async signup(input: SignupInput): Promise<AuthResponseData> {
    return apiRequest<AuthResponseData>("auth/signup", {
      method: "POST",
      body: input,
      authenticated: false,
    });
  }

  /**
   * Fetch currently authenticated user using GET /api/v1/auth/me.
   */
  async getMe(): Promise<MeResponseData> {
    return apiRequest<MeResponseData>("auth/me", {
      method: "GET",
      authenticated: true,
    });
  }

  /**
   * Development-only quick login through server-side secure credential proxy.
   */
  async quickLogin(role: UserRole): Promise<AuthResponseData> {
    const res = await fetch("/api/dev/quick-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || `Quick login for ${role} failed`);
    }

    return data.data as AuthResponseData;
  }
}

export const authService = new AuthService();
