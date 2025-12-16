export type GuildServer = {
  id: string;
  name: string;
  icon?: string | null;
  owner?: boolean;
  verified?: boolean;
};

export type EmojiItem = {
  id: string;
  name: string;
  url: string;
  animated?: boolean;
};

export type BotEvent = {
  id: string;
  name: string;
  description?: string;
  scheduledFor?: string;
  channel?: string;
  createdBy?: string;
};

export type ApiError = Error & {
  status?: number;
};

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};
