import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { PageSkeleton } from "../components/ui/basics";
import type { SectionKey } from "./sections";

const pages: Record<SectionKey, LazyExoticComponent<ComponentType>> = {
  greetings: lazy(() => import("../features/greetings/GreetingsPage")),
  "emoji-triggers": lazy(() => import("../features/emoji-triggers/EmojiTriggersPage")),
  "role-reactions": lazy(() => import("../features/role-reactions/RoleReactionsPage")),
  "voice-snapshots": lazy(() => import("../features/voice-snapshots/VoiceSnapshotsPage")),
  events: lazy(() => import("../features/events/EventsPage")),
  moderation: lazy(() => import("../features/moderation/ModerationPage")),
  console: lazy(() => import("../features/admin/AdminPage")),
  overview: lazy(() => import("../features/overview/OverviewPage")),
  settings: lazy(() => import("../features/settings/ServerSettingsPage")),
  autorole: lazy(() => import("../features/autorole/AutorolePage")),
};

export const SectionOutlet = ({ section }: { section: SectionKey }) => {
  const Page = pages[section];
  return <Suspense fallback={<PageSkeleton />}><Page /></Suspense>;
};

