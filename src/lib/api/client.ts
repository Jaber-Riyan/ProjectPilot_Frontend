import { ApiError, type ApiEnvelope } from "./types";

type TokenProvider = () => string | null | Promise<string | null>;
let accessTokenProvider: TokenProvider = () => null;

/** Inject the real auth/session token provider after the backend auth contract is confirmed. */
export function setAccessTokenProvider(provider: TokenProvider) {
  accessTokenProvider = provider;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured. Add it to .env.local.");
  }

  const { body, headers, authenticated = true, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = await accessTokenProvider();
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const requestId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : undefined;
  if (requestId) requestHeaders.set("X-Request-Id", requestId);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
      ...requestOptions,
      headers: requestHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      cache: requestOptions.cache ?? "no-store"
    });
  } catch (error) {
    throw new ApiError({
      message: error instanceof Error ? error.message : "Network request failed",
      status: 0,
      requestId
    });
  }

  const responseRequestId = response.headers.get("X-Request-Id") ?? requestId;
  const contentType = response.headers.get("content-type") ?? "";
  const payload: unknown = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const envelope = payload as Partial<ApiEnvelope<unknown>> | null;
    const failure = envelope && "error" in envelope ? envelope.error : undefined;
    throw new ApiError({
      message: failure?.message ?? response.statusText ?? "Request failed",
      status: response.status,
      code: failure?.code,
      details: failure?.details,
      requestId: responseRequestId ?? undefined
    });
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.success) return envelope.data;
    throw new ApiError({
      message: envelope.error.message,
      status: response.status,
      code: envelope.error.code,
      details: envelope.error.details,
      requestId: responseRequestId ?? undefined
    });
  }

  // Some endpoints may return non-envelope JSON; endpoint-specific types should reflect that.
  return payload as T;
}
