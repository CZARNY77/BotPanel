import React from 'react';

export type View = 'dashboard' | 'welcome' | 'events' | 'emoji-triggers' | 'moderation' | 'ai-assistant';
export type Theme = 'midnight' | 'gold';

export interface Server {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface WelcomeConfig {
  enabled: boolean;
  messageType: 'embed' | 'text';
  channelId: string;
  title: string;
  description: string;
  color: string;
  footer: string;
  showUserAvatar: boolean;
  imageUrl?: string;
}

export interface EventConfig {
  id?: string; // Added for backend reference
  date: string;
  time: string;
  intervalType: 'never' | 'custom';
  intervalDays?: number;
  channelId: string;
  title: string;
  description: string;
  durationHours: number;
  mentionRole: string;
}

export interface EmojiTrigger {
  id: string;
  emoji: string;
  imageUrl: string;
}

export interface ServerStats {
  memberCount: number;
  onlineCount: number;
  newMembers24h: number;
}