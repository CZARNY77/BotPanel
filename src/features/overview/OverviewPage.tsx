import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { getEmojiTriggers } from "../../api/endpoints/emoji";
import { getEvents } from "../../api/endpoints/events";
import { getGreeting } from "../../api/endpoints/greetings";
import { antiSpamApi, timeoutDmApi } from "../../api/endpoints/moderation";
import { getPresenceLogs, getPresenceSettings } from "../../api/endpoints/presence";
import { getRoleReactions } from "../../api/endpoints/roleReactions";
import { getAutorole } from "../../api/endpoints/servers";
import { Button } from "../../components/ui/Button";
import { Group, PageHeader, Pill, Skeleton } from "../../components/ui/basics";
import { Icon, type IconName } from "../../components/ui/Icon";
import { useServerMeta } from "../../hooks/useServerMeta";
import { useServerResource, useServerScope } from "../../hooks/useServerResource";
import { BotStatus } from "../../components/ui/BotStatus";
import { useBotState } from "../../hooks/useBotState";
import { openInvite } from "../../api/endpoints/servers";
import { dateParts } from "../../components/ui/DateTile";

type Row = { key: string; label: string; icon: IconName; hue: string; to: string; on?: boolean; detail: ReactNode };

const Stat = ({ value, label, accent }: { value: ReactNode; label: string; accent?: boolean }) => (
  <div>
    <div className={`stat__value${accent ? " stat__value--accent" : ""}`}>{value ?? "–"}</div>
    <div className="stat__label">{label}</div>
  </div>
);

export default function OverviewPage() {
  const { server, serverId } = useServerScope();
  const meta = useServerMeta();
  const bot = useBotState();
  const welcome = useServerResource("welcome", (id) => getGreeting(id, "welcome"));
  const farewell = useServerResource("farewell", (id) => getGreeting(id, "farewell"));
  const events = useServerResource("events-active", (id) => getEvents(id, "active"));
  const voice = useServerResource("voice-settings", getPresenceSettings);
  const logs = useServerResource("voice-logs", (id) => getPresenceLogs(id, 20, 0));
  const emoji = useServerResource("emoji-triggers", getEmojiTriggers);
  const reactions = useServerResource("role-reactions", getRoleReactions);
  const autorole = useServerResource("autorole", getAutorole);
  const antiSpam = useServerResource("anti-spam", antiSpamApi.get);
  const timeoutDm = useServerResource("timeout-dm", timeoutDmApi.get);

  const base = `/dashboard/${serverId}`;
  const upcoming = events.data ?? [];
  const next = upcoming[0];
  const latest = logs.data?.[0];

  const rows: Row[] = [
    { key: "w", label: "Welcome", icon: "greetings", hue: "var(--cb-hue-greetings)", to: "greetings", on: welcome.data?.enabled, detail: meta.channelName.get(welcome.data?.channelId ?? "") },
    { key: "f", label: "Farewell", icon: "greetings", hue: "var(--cb-hue-greetings)", to: "greetings", on: farewell.data?.enabled, detail: meta.channelName.get(farewell.data?.channelId ?? "") },
    { key: "e", label: "Events", icon: "events", hue: "var(--cb-hue-events)", to: "events", on: upcoming.length > 0, detail: events.data ? `${upcoming.length} upcoming` : null },
    { key: "v", label: "Voice schedules", icon: "voice", hue: "var(--cb-hue-voice)", to: "voice-snapshots", on: voice.data?.schedules.some((s) => s.enabled), detail: voice.data ? `${voice.data.schedules.filter((s) => s.enabled).length} active` : null },
    { key: "t", label: "Emoji triggers", icon: "emoji", hue: "var(--cb-hue-emoji)", to: "emoji-triggers", on: (emoji.data?.triggers.length ?? 0) > 0, detail: emoji.data ? `${emoji.data.triggers.length} triggers` : null },
    { key: "r", label: "Role reactions", icon: "reactions", hue: "var(--cb-hue-reactions)", to: "role-reactions", on: reactions.data?.enabled, detail: reactions.data ? `${reactions.data.messages.length} messages` : null },
    { key: "a", label: "Auto role", icon: "autorole", hue: "var(--cb-hue-autorole)", to: "autorole", on: autorole.data?.enabled, detail: meta.roleName.get(autorole.data?.roleId ?? "") },
    { key: "s", label: "Anti-spam", icon: "moderation", hue: "var(--cb-hue-moderation)", to: "moderation", on: antiSpam.data?.enabled, detail: antiSpam.data?.action === "auto" ? "Smart" : antiSpam.data?.action },
    { key: "d", label: "Timeout DM", icon: "timer", hue: "var(--cb-hue-moderation)", to: "moderation", on: timeoutDm.data?.enabled, detail: null },
  ];

  return (
    <>
      <PageHeader
        icon="overview"
        hue="var(--cb-hue-overview)"
        title={server.name}
        subtitle={<span className="row"><BotStatus state={bot} /> <span>{server.role === "owner" ? "You own this server" : "You manage this server"}</span></span>}
        actions={<Button icon="external" onClick={() => void openInvite(serverId)}>Invite link</Button>}
      />
      <div className="stats overview-stats">
        <Stat value={server.memberCount ?? "–"} label="Members" accent />
        <Stat value={meta.loading ? <Skeleton height={30} width={40} /> : meta.channels.length} label="Text channels" />
        <Stat value={meta.loading ? <Skeleton height={30} width={40} /> : meta.voiceChannels.length} label="Voice channels" />
        <Stat value={meta.loading ? <Skeleton height={30} width={40} /> : meta.roles.length} label="Roles" />
        <Stat value={events.data ? upcoming.length : <Skeleton height={30} width={40} />} label="Upcoming events" />
      </div>

      <div className="split" style={{ marginTop: 32 }}>
        <Group title="Modules" icon="settings">
          <div className="list">
            {rows.map((row) => (
              <Link key={row.key} to={`${base}/${row.to}`} className="list-row list-row--click module-row" style={{ "--hue": row.hue } as CSSProperties}>
                <span className="page-head__tile module-row__tile"><Icon name={row.icon} size="sm" /></span>
                <div className="list-row__main">
                  <span className="list-row__title">{row.label}</span>
                  {row.detail ? <span className="list-row__meta">{row.detail}</span> : null}
                </div>
                {row.on === undefined ? <Skeleton height={20} width={44} /> : <Pill tone={row.on ? "ok" : "neutral"}><span className="dot" />{row.on ? "On" : "Off"}</Pill>}
                <Icon name="chevronRight" size="sm" />
              </Link>
            ))}
          </div>
        </Group>

        <div className="stack stack--lg">
          <Group title="Next event" icon="events" actions={<Link to={`${base}/events?new=1`} className="btn btn-ghost btn-sm"><Icon name="plus" size="sm" />New</Link>}>
            {!events.data ? (
              <Skeleton height={52} />
            ) : next ? (
              <Link to={`${base}/events`} className="list-row list-row--click">
                <div className="date-tile">
                  <span className="date-tile__day">{dateParts(next.date).day}</span>
                  <span className="date-tile__month">{dateParts(next.date).month}</span>
                </div>
                <div className="list-row__main">
                  <span className="list-row__title">{next.title}</span>
                  <span className="list-row__meta num">{next.time} · {next.timezone}</span>
                </div>
                <div className="signup-mini">
                  <span className="signup-mini__yes" title="Going">{next.signups.yes}</span>
                  <span className="signup-mini__maybe" title="Maybe">{next.signups.maybe}</span>
                  <span className="signup-mini__no" title="Not going">{next.signups.no}</span>
                </div>
              </Link>
            ) : (
              <p className="muted">No upcoming events.</p>
            )}
          </Group>
          <Group title="Latest voice snapshot" icon="voice" actions={<Link to={`${base}/voice-snapshots?run=1`} className="btn btn-ghost btn-sm"><Icon name="play" size="sm" />Run</Link>}>
            {!logs.data ? (
              <Skeleton height={52} />
            ) : latest ? (
              <div className="stack">
                <div className="stats">
                  <Stat value={latest.totalMembers} label="Members" accent />
                  <Stat value={latest.totalChannels} label="Channels" />
                  <Stat value={latest.createdAt ? new Date(latest.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "–"} label={latest.createdAt ? new Date(latest.createdAt).toLocaleDateString("en-GB") : ""} />
                </div>
                <div className="chips">{latest.channels.slice(0, 6).map((c) => <Pill key={c.id}>{c.name}</Pill>)}</div>
              </div>
            ) : (
              <p className="muted">No snapshots yet.</p>
            )}
          </Group>
        </div>
      </div>
    </>
  );
}
