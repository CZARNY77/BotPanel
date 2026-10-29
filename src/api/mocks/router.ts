// Mock API: map "METHOD /path" -> handler. A request without a route fails with
// `Unmocked: METHOD /path` and never reaches the real API (B-24).
import type { HttpResponse } from "../http";
import { MockHttpError, type MockRoute, type Params } from "./core";
import { featureRoutes } from "./routesFeatures";
import { serverRoutes } from "./routesServer";

export { mockLogin } from "./routesServer";

const routes: MockRoute[] = [...serverRoutes, ...featureRoutes];

const LATENCY_MS = 180;

const match = (pattern: string, path: string): Params | null => {
  const a = pattern.split("/");
  const b = path.split("/");
  if (a.length !== b.length) return null;
  const params: Params = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith(":")) {
      params[a[i].slice(1)] = decodeURIComponent(b[i]);
    } else if (a[i] !== b[i]) {
      return null;
    }
  }
  return params;
};

export async function handleMockRequest(
  method: string,
  fullPath: string,
  body: unknown
): Promise<HttpResponse> {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  const [path, search = ""] = fullPath.split("?");
  for (const route of routes) {
    if (route.method !== method) continue;
    const params = match(route.pattern, path);
    if (!params) continue;
    try {
      // Round-trip the body through JSON like a real request would.
      const parsed = body instanceof FormData || body === undefined ? body : JSON.parse(JSON.stringify(body));
      return route.handler({ params, query: new URLSearchParams(search), body: parsed });
    } catch (err) {
      if (err instanceof MockHttpError) {
        return { status: err.status, headers: {}, json: { status: "error", error: err.message } };
      }
      throw err;
    }
  }
  const message = `Unmocked: ${method} ${path}`;
  console.error(message);
  return { status: 501, headers: {}, json: { status: "error", error: message } };
}
