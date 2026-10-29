// Single HTTP entry point. In mock mode every request goes to mocks/router.ts
// through the same response handling as the real API (no per-function `if (USE_MOCKS)`).

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Return the parsed JSON as-is (no {status,data} envelope), e.g. /api/health. */
  raw?: boolean;
};

/** Normalized response used by both the real fetch and the mock router. */
export type HttpResponse = {
  status: number;
  headers: { retryAfter?: string | null };
  json: unknown;
};

const MAX_STARTING_RETRIES = 2;
const STARTING_EVENT = "conqbot:bot-starting";

export const onBotStarting = (listener: () => void) => {
  window.addEventListener(STARTING_EVENT, listener);
  return () => window.removeEventListener(STARTING_EVENT, listener);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withApiBase = (value: string): string => {
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  const path = value.startsWith("/") ? value : `/${value}`;
  return API_BASE ? `${API_BASE}${path}` : path;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

async function send(path: string, method: string, body: unknown): Promise<HttpResponse> {
  if (USE_MOCKS) {
    const { handleMockRequest } = await import("./mocks/router");
    return handleMockRequest(method, path, body);
  }
  const isForm = body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body !== undefined && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  let json: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return {
    status: response.status,
    headers: { retryAfter: response.headers.get("Retry-After") },
    json,
  };
}

const errorMessage = (res: HttpResponse) => {
  if (isRecord(res.json) && typeof res.json.error === "string" && res.json.error) {
    return res.json.error;
  }
  if (res.status === 401) return "Your session has expired. Log in again.";
  if (res.status === 403) return "You do not have permission to do this.";
  if (res.status === 404) return "Not found.";
  if (res.status >= 500) return `Server error (${res.status}). Try again in a moment.`;
  return `Request failed (${res.status}).`;
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  let attempt = 0;
  for (;;) {
    let res: HttpResponse;
    try {
      res = await send(path, method, options.body);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("Cannot reach ConqBot. Check your connection.", 0);
    }

    if (options.raw) {
      return res.json as T;
    }

    // B-03: bot is starting; the middleware rejects before any handler runs,
    // so retrying is safe for every method.
    const starting =
      res.status === 503 && isRecord(res.json) && res.json.status === "starting";
    if (starting && attempt < MAX_STARTING_RETRIES) {
      attempt += 1;
      window.dispatchEvent(new Event(STARTING_EVENT));
      const seconds = Math.min(Number(res.headers.retryAfter) || 5, 15);
      await sleep(seconds * 1000);
      continue;
    }

    if (res.status < 200 || res.status >= 300) {
      throw new ApiError(errorMessage(res), res.status);
    }
    if (isRecord(res.json) && res.json.status === "error") {
      throw new ApiError(errorMessage(res), res.status);
    }
    if (isRecord(res.json) && res.json.status === "ok") {
      return (res.json.data ?? {}) as T;
    }
    return res.json as T;
  }
}
