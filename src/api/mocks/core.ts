// Helpers shared by mock route groups. Mocks validate like the contract:
// unknown fields and wrong types are rejected with 400, so format bugs show up before integration.
import type { HttpResponse } from "../http";

export type Params = Record<string, string>;
export type MockContext = { params: Params; query: URLSearchParams; body: unknown };
export type MockHandler = (ctx: MockContext) => HttpResponse;
export type MockRoute = { method: string; pattern: string; handler: MockHandler };

export class MockHttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const ok = (data: unknown, status = 200): HttpResponse => ({
  status,
  headers: {},
  json: { status: "ok", data },
});

export const fail = (message: string, status = 400): never => {
  throw new MockHttpError(message, status);
};

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Body must be an object with only the allowed keys. */
export const strictBody = (body: unknown, allowed: string[]): Record<string, unknown> => {
  if (!isRecord(body)) {
    fail("Invalid payload.");
  }
  const record = body as Record<string, unknown>;
  const unknown = Object.keys(record).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    fail(`Unknown field: ${unknown.join(", ")}`);
  }
  return record;
};

export const expectType = (
  record: Record<string, unknown>,
  key: string,
  type: "string" | "boolean" | "number" | "array" | "object"
) => {
  if (!(key in record)) return;
  const value = record[key];
  const valid =
    type === "array" ? Array.isArray(value) : type === "object" ? isRecord(value) : typeof value === type;
  if (!valid) {
    fail(`Field ${key} must be ${type}.`);
  }
};

export const isValidTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
};

export const intParam = (query: URLSearchParams, key: string, fallback: number, min: number, max: number) => {
  const raw = query.get(key);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    fail(`Invalid ${key}.`);
  }
  return value;
};
