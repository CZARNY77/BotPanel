import { useMemo } from "react";
import { getEmojis, getMetadata } from "../api/endpoints/servers";
import type { ServerMetadata } from "../api/types";
import { useServerResource } from "./useServerResource";

const empty: ServerMetadata = { channels: [], voiceChannels: [], roles: [] };

/** Channels, voice channels and roles of the active server + lookup maps. */
export const useServerMeta = () => {
  const resource = useServerResource("metadata", getMetadata);
  const meta = resource.data ?? empty;
  const maps = useMemo(
    () => ({
      channelName: new Map(meta.channels.map((c) => [c.id, c.name])),
      voiceName: new Map(meta.voiceChannels.map((c) => [c.id, c.name])),
      roleName: new Map(meta.roles.map((r) => [r.id, r.name])),
    }),
    [meta]
  );
  return { ...meta, ...maps, loading: resource.loading, error: resource.error, reload: resource.reload };
};

export const useServerEmojis = () => useServerResource("emojis", getEmojis);
