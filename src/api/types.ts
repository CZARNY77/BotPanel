export type User = {
  id: string;
  username: string;
  avatarUrl?: string;
};

export type Server = {
  id: string;
  name: string;
  iconUrl?: string;
  memberCount?: number;
  hasBot?: boolean;
  role?: "owner" | "admin";
};

export type ServerSettings = {
  prefix: string;
  language: string;
  timezone: string;
  welcomeMessage: string;
  logChannelId: string;
  autoRoleId: string;
  features: {
    autoModeration: boolean;
    eventReminders: boolean;
    voicePresence: boolean;
  };
};
