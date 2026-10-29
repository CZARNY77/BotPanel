import { request, withApiBase } from "../http";
import type { UploadResult } from "../types";

/** K16: guild_id is required; returns an absolute URL. */
export async function uploadImage(file: File, serverId: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("guild_id", serverId);
  const data = await request<UploadResult>("/api/uploads", { method: "POST", body: form });
  return withApiBase(data.url || data.path);
}
