import { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  deleteEvent,
  getEmojiTriggers,
  getEvents,
  getInviteUrl,
  getServerMetadata,
  getServers,
  getWelcomeSettings,
  getWarthog,
  updateEmojiTriggers,
  updateWelcomeSettings,
  updateWarthog,
} from "../api/client";
import type {
  EmojiTrigger,
  EventInput,
  EventItem,
  Server,
  ServerMetadata,
  WelcomeSettings,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { LoadingScreen } from "../components/LoadingScreen";

type SectionKey = "overview" | "welcome" | "events" | "emoji" | "other";

type TriggerRow = EmojiTrigger & { id: string };

type LoadedState = {
  metadata: boolean;
  welcome: boolean;
  events: boolean;
  emoji: boolean;
  warthog: boolean;
};

type LoadingState = LoadedState;

const sections: { key: SectionKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "welcome", label: "Welcome Messages" },
  { key: "events", label: "Event Creator" },
  { key: "emoji", label: "Emoji Triggers" },
  { key: "other", label: "Other" },
];

const fallbackChannels = [
  { id: "#welcome", name: "#welcome" },
  { id: "#general", name: "#general" },
  { id: "#announcements", name: "#announcements" },
  { id: "#events", name: "#events" },
];

const fallbackRoles = [
  { id: "@Raid", name: "@Raid" },
  { id: "@Guild", name: "@Guild" },
  { id: "@Officers", name: "@Officers" },
  { id: "@Everyone", name: "@Everyone" },
];

const emptyWelcome: WelcomeSettings = {
  enabled: true,
  channelId: "",
  type: "embed",
  text: "Welcome {user} to {server}.",
  embed: {
    title: "Welcome aboard!",
    description: "Hey {user}, glad to have you in {server}.",
    color: "#2f7cff",
    showAvatar: true,
  },
};

const emptyMetadata: ServerMetadata = {
  channels: [],
  roles: [],
};

const emptyLoadedState: LoadedState = {
  metadata: false,
  welcome: false,
  events: false,
  emoji: false,
  warthog: false,
};

const emptyLoadingState: LoadingState = {
  metadata: false,
  welcome: false,
  events: false,
  emoji: false,
  warthog: false,
};

const maxEmojiTriggers = 10;
const createId = () => Math.random().toString(36).slice(2, 9);

const isValidDate = (value: string) => /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.\d{4}$/.test(value);
const isValidTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState<LoadedState>(emptyLoadedState);
  const [sectionLoading, setSectionLoading] = useState<LoadingState>(emptyLoadingState);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  const [metadata, setMetadata] = useState<ServerMetadata>(emptyMetadata);
  const [welcomeSettings, setWelcomeSettings] = useState<WelcomeSettings>(emptyWelcome);
  const [welcomeSaving, setWelcomeSaving] = useState(false);

  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    repeating: false,
    channelId: "",
    roleId: "",
    durationMinutes: "60",
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventSaving, setEventSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const [emojiRows, setEmojiRows] = useState<TriggerRow[]>([]);
  const [emojiSaving, setEmojiSaving] = useState(false);

  const [warthogEnabled, setWarthogEnabled] = useState(true);
  const [warthogSaving, setWarthogSaving] = useState(false);

  const updateLoaded = (key: keyof LoadedState, value: boolean) => {
    setLoaded((prev) => ({ ...prev, [key]: value }));
  };

  const updateSectionLoading = (key: keyof LoadingState, value: boolean) => {
    setSectionLoading((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let active = true;

    const loadServers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getServers();
        if (!active) {
          return;
        }
        setServers(data);
        setActiveServerId(data[0]?.id ?? null);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load servers.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadServers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLoaded(emptyLoadedState);
    setSectionLoading(emptyLoadingState);
    setMetadata(emptyMetadata);
    setWelcomeSettings(emptyWelcome);
    setEvents([]);
    setEmojiRows([]);
    setWarthogEnabled(true);
    setError(null);
    setSuccess(null);
    setEventForm((prev) => ({
      ...prev,
      title: "",
      description: "",
      date: "",
      time: "",
      repeating: false,
      durationMinutes: "60",
    }));
  }, [activeServerId]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [activeSection]);

  const activeServer = useMemo(
    () => servers.find((server) => server.id === activeServerId) ?? null,
    [servers, activeServerId]
  );

  const channels = metadata.channels.length ? metadata.channels : fallbackChannels;
  const roles = metadata.roles.length ? metadata.roles : fallbackRoles;

  useEffect(() => {
    if (!welcomeSettings.channelId && channels.length) {
      setWelcomeSettings((prev) => ({
        ...prev,
        channelId: channels[0].id,
      }));
    }
  }, [channels, welcomeSettings.channelId]);

  useEffect(() => {
    setEventForm((prev) => {
      const nextChannel = prev.channelId || channels[0]?.id || "";
      const nextRole = prev.roleId || roles[0]?.id || "";
      if (nextChannel === prev.channelId && nextRole === prev.roleId) {
        return prev;
      }
      return {
        ...prev,
        channelId: nextChannel,
        roleId: nextRole,
      };
    });
  }, [channels, roles]);

  const loadMetadata = async () => {
    if (!activeServerId || loaded.metadata || sectionLoading.metadata) {
      return;
    }
    updateSectionLoading("metadata", true);
    try {
      const data = await getServerMetadata(activeServerId);
      setMetadata(data);
      updateLoaded("metadata", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metadata.");
      updateLoaded("metadata", true);
    } finally {
      updateSectionLoading("metadata", false);
    }
  };

  const loadWelcome = async () => {
    if (!activeServerId || loaded.welcome || sectionLoading.welcome) {
      return;
    }
    updateSectionLoading("welcome", true);
    try {
      const data = await getWelcomeSettings(activeServerId);
      setWelcomeSettings(data);
      updateLoaded("welcome", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load welcome settings.");
      updateLoaded("welcome", true);
    } finally {
      updateSectionLoading("welcome", false);
    }
  };

  const loadEvents = async () => {
    if (!activeServerId || loaded.events || sectionLoading.events) {
      return;
    }
    updateSectionLoading("events", true);
    try {
      const data = await getEvents(activeServerId);
      setEvents(data);
      updateLoaded("events", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events.");
      updateLoaded("events", true);
    } finally {
      updateSectionLoading("events", false);
    }
  };

  const loadEmojiTriggers = async () => {
    if (!activeServerId || loaded.emoji || sectionLoading.emoji) {
      return;
    }
    updateSectionLoading("emoji", true);
    try {
      const data = await getEmojiTriggers(activeServerId);
      setEmojiRows(data.map((trigger) => ({ ...trigger, id: createId() })));
      updateLoaded("emoji", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emoji triggers.");
      updateLoaded("emoji", true);
    } finally {
      updateSectionLoading("emoji", false);
    }
  };

  const loadWarthog = async () => {
    if (!activeServerId || loaded.warthog || sectionLoading.warthog) {
      return;
    }
    updateSectionLoading("warthog", true);
    try {
      const enabled = await getWarthog(activeServerId);
      setWarthogEnabled(enabled);
      updateLoaded("warthog", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Warthog settings.");
      updateLoaded("warthog", true);
    } finally {
      updateSectionLoading("warthog", false);
    }
  };

  useEffect(() => {
    if (!activeServerId) {
      return;
    }

    if (activeSection === "welcome") {
      void loadMetadata();
      void loadWelcome();
    }

    if (activeSection === "events") {
      void loadMetadata();
      void loadEvents();
    }

    if (activeSection === "emoji") {
      void loadEmojiTriggers();
    }

    if (activeSection === "other") {
      void loadWarthog();
    }
  }, [activeSection, activeServerId]);

  const handleInvite = async () => {
    setInviteLoading(true);
    try {
      const url = await getInviteUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open invite link.");
    } finally {
      setInviteLoading(false);
    }
  };

  const formatPreview = (value: string) =>
    value
      .replace(/{user}/g, user?.username ?? "New member")
      .replace(/{server}/g, activeServer?.name ?? "the server");

  const handleWelcomeSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (welcomeSettings.type === "text" && !welcomeSettings.text.trim()) {
      setError("Welcome text cannot be empty.");
      return;
    }
    if (
      welcomeSettings.type === "embed" &&
      !welcomeSettings.embed.title.trim() &&
      !welcomeSettings.embed.description.trim()
    ) {
      setError("Provide at least a title or description for the embed.");
      return;
    }
    if (!welcomeSettings.channelId) {
      setError("Pick a channel for the welcome message.");
      return;
    }

    setWelcomeSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateWelcomeSettings(activeServerId, welcomeSettings);
      setWelcomeSettings(saved);
      setSuccess("Welcome settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save welcome settings.");
    } finally {
      setWelcomeSaving(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!activeServerId) {
      return;
    }
    if (!eventForm.title.trim()) {
      setError("Event title is required.");
      return;
    }
    if (!eventForm.date.trim() || !isValidDate(eventForm.date)) {
      setError("Date must be in dd.mm.yyyy format.");
      return;
    }
    if (!eventForm.time.trim() || !isValidTime(eventForm.time)) {
      setError("Time must be in 24h format (HH:MM).");
      return;
    }
    if (!eventForm.channelId || !eventForm.roleId) {
      setError("Select a channel and role before creating an event.");
      return;
    }

    const durationMinutes = Number.parseInt(eventForm.durationMinutes, 10);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setError("Duration must be a positive number.");
      return;
    }

    setEventSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: EventInput = {
        title: eventForm.title,
        description: eventForm.description,
        date: eventForm.date,
        time: eventForm.time,
        repeating: eventForm.repeating,
        channelId: eventForm.channelId,
        roleId: eventForm.roleId,
        durationMinutes,
      };
      const created = await createEvent(activeServerId, payload);
      setEvents((prev) => [created, ...prev]);
      setEventForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        date: "",
        time: "",
        repeating: false,
      }));
      setSuccess("Event created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event.");
    } finally {
      setEventSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!activeServerId) {
      return;
    }
    setDeletingEventId(eventId);
    setError(null);
    setSuccess(null);
    try {
      const deletedId = await deleteEvent(activeServerId, eventId);
      setEvents((prev) => prev.filter((item) => item.id !== deletedId));
      setSuccess("Event deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event.");
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleEmojiSave = async () => {
    if (!activeServerId) {
      return;
    }

    if (emojiRows.length > maxEmojiTriggers) {
      setError(`Limit is ${maxEmojiTriggers} triggers.`);
      return;
    }

    if (emojiRows.some((row) => !row.emoji.trim() || !row.imageUrl.trim())) {
      setError("Every emoji trigger needs an emoji and an image URL.");
      return;
    }

    if (emojiRows.some((row) => !/^https?:\/\//.test(row.imageUrl))) {
      setError("Image URLs must start with http:// or https://.");
      return;
    }

    setEmojiSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = emojiRows.map((row) => ({
        emoji: row.emoji,
        imageUrl: row.imageUrl,
      }));
      const updated = await updateEmojiTriggers(activeServerId, payload);
      setEmojiRows(updated.map((trigger) => ({ ...trigger, id: createId() })));
      setSuccess("Emoji triggers saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save emoji triggers.");
    } finally {
      setEmojiSaving(false);
    }
  };

  const handleWarthogToggle = async () => {
    if (!activeServerId) {
      return;
    }
    const nextValue = !warthogEnabled;
    setWarthogEnabled(nextValue);
    setWarthogSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateWarthog(activeServerId, nextValue);
      setWarthogEnabled(saved);
      setSuccess("Warthog toggle updated.");
    } catch (err) {
      setWarthogEnabled((prev) => !prev);
      setError(err instanceof Error ? err.message : "Failed to update Warthog mode.");
    } finally {
      setWarthogSaving(false);
    }
  };

  const channelLabel =
    channels.find((channel) => channel.id === welcomeSettings.channelId)?.name ??
    welcomeSettings.channelId ||
    "#channel";

  const previewText = formatPreview(welcomeSettings.text);
  const previewEmbedTitle = formatPreview(welcomeSettings.embed.title);
  const previewEmbedDescription = formatPreview(welcomeSettings.embed.description);

  const channelNameById = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach((channel) => {
      map.set(channel.id, channel.name);
    });
    return map;
  }, [channels]);

  const welcomeLoading = !loaded.welcome || sectionLoading.welcome || sectionLoading.metadata;
  const eventsLoading = !loaded.events || sectionLoading.events || sectionLoading.metadata;
  const emojiLoading = !loaded.emoji || sectionLoading.emoji;
  const warthogLoading = !loaded.warthog || sectionLoading.warthog;

  if (loading) {
    return <LoadingScreen label="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-shell">
      <aside className="server-rail">
        <div className="server-list">
          {servers.map((server) => (
            <button
              key={server.id}
              className={`server-button ${server.id === activeServerId ? "active" : ""}`}
              onClick={() => setActiveServerId(server.id)}
              title={server.name}
              type="button"
            >
              {server.iconUrl ? (
                <img src={server.iconUrl} alt={server.name} />
              ) : (
                <span>{server.name.slice(0, 1)}</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="server-add"
          type="button"
          onClick={handleInvite}
          disabled={inviteLoading}
        >
          +
        </button>
      </aside>

      <aside className="side-nav">
        <div className="side-header">
          <p className="eyebrow">Selected server</p>
          <h2>{activeServer?.name ?? "No server"}</h2>
          <span className="meta">ID: {activeServer?.id ?? "-"}</span>
        </div>

        <nav className="side-menu">
          {sections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`side-item ${activeSection === section.key ? "active" : ""}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <a
          className="side-link"
          href="https://conqsite.bard-dev.com/home"
          target="_blank"
          rel="noreferrer"
        >
          Go to Conqsite
        </a>

        <div className="side-profile">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} />
              ) : (
                <span>{user?.username?.slice(0, 1) ?? "U"}</span>
              )}
            </div>
            <div>
              <strong>{user?.username ?? "User"}</strong>
              <span className="meta">ID: {user?.id ?? "-"}</span>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut}>
            Log out
          </Button>
        </div>
      </aside>

      <main className="dashboard-main">
        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        {activeSection === "overview" ? (
          <section className="content-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Overview</p>
                <h1>{activeServer?.name ?? "Server overview"}</h1>
                <p className="muted">Quick snapshot of the server status and bot presence.</p>
              </div>
              <Button onClick={handleInvite} disabled={inviteLoading}>
                {inviteLoading ? "Preparing invite..." : "Add bot to new server"}
              </Button>
            </div>
            <div className="card-grid">
              <article className="card">
                <h3>Members</h3>
                <p className="stat">{activeServer?.memberCount ?? 0}</p>
                <span className="muted">Estimated active members.</span>
              </article>
              <article className="card">
                <h3>Bot status</h3>
                <p className={`stat ${activeServer?.hasBot ? "success" : "warning"}`}>
                  {activeServer?.hasBot ? "Online" : "Missing"}
                </p>
                <span className="muted">Bot installed on this server.</span>
              </article>
              <article className="card">
                <h3>Your role</h3>
                <p className="stat">{activeServer?.role ?? "Admin"}</p>
                <span className="muted">Permissions detected via Discord OAuth.</span>
              </article>
            </div>
          </section>
        ) : null}

        {activeSection === "welcome" ? (
          welcomeLoading ? (
            <LoadingScreen label="Loading welcome settings..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Welcome Messages</p>
                  <h1>Design the first impression</h1>
                  <p className="muted">Enable and customize the welcome flow for new members.</p>
                </div>
                <Button onClick={handleWelcomeSave} disabled={welcomeSaving}>
                  {welcomeSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
              <div className="content-grid">
                <div className="card">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={welcomeSettings.enabled}
                      onChange={() =>
                        setWelcomeSettings((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }))
                      }
                    />
                    <span>Enable welcome message</span>
                  </label>
                  <div className="form-grid">
                    <label>
                      Channel
                      <select
                        value={welcomeSettings.channelId}
                        onChange={(event) =>
                          setWelcomeSettings((prev) => ({
                            ...prev,
                            channelId: event.target.value,
                          }))
                        }
                      >
                        {channels.map((channel) => (
                          <option key={channel.id} value={channel.id}>
                            {channel.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Message type
                      <select
                        value={welcomeSettings.type}
                        onChange={(event) =>
                          setWelcomeSettings((prev) => ({
                            ...prev,
                            type: event.target.value as "embed" | "text",
                          }))
                        }
                      >
                        <option value="embed">Embed</option>
                        <option value="text">Plain text</option>
                      </select>
                    </label>
                  </div>

                  {welcomeSettings.type === "embed" ? (
                    <div className="form-grid">
                      <label>
                        Embed title
                        <input
                          value={welcomeSettings.embed.title}
                          onChange={(event) =>
                            setWelcomeSettings((prev) => ({
                              ...prev,
                              embed: {
                                ...prev.embed,
                                title: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Description
                        <textarea
                          rows={4}
                          value={welcomeSettings.embed.description}
                          onChange={(event) =>
                            setWelcomeSettings((prev) => ({
                              ...prev,
                              embed: {
                                ...prev.embed,
                                description: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label>
                        Accent color
                        <input
                          type="color"
                          value={welcomeSettings.embed.color}
                          onChange={(event) =>
                            setWelcomeSettings((prev) => ({
                              ...prev,
                              embed: {
                                ...prev.embed,
                                color: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={welcomeSettings.embed.showAvatar}
                          onChange={() =>
                            setWelcomeSettings((prev) => ({
                              ...prev,
                              embed: {
                                ...prev.embed,
                                showAvatar: !prev.embed.showAvatar,
                              },
                            }))
                          }
                        />
                        <span>Show user avatar</span>
                      </label>
                    </div>
                  ) : (
                    <div className="form-grid">
                      <label>
                        Message text
                        <textarea
                          rows={4}
                          value={welcomeSettings.text}
                          onChange={(event) =>
                            setWelcomeSettings((prev) => ({
                              ...prev,
                              text: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <p className="muted">You can use {"{user}"} and {"{server}"} variables.</p>
                    </div>
                  )}
                </div>

                <div className="card discord-preview">
                  <p className="muted">Preview</p>
                  <div className="discord-message">
                    <div className="discord-avatar">
                      <span>C</span>
                    </div>
                    <div className="discord-body">
                      <div className="discord-header">
                        <span className="discord-username">ConqBot</span>
                        <span className="discord-bot-tag">BOT</span>
                        <span className="discord-time">Today at 19:00</span>
                      </div>
                      {welcomeSettings.type === "text" ? (
                        <p className="discord-text">{previewText}</p>
                      ) : null}
                      {welcomeSettings.type === "embed" ? (
                        <div className="discord-embed">
                          <div
                            className="discord-embed-accent"
                            style={{ background: welcomeSettings.embed.color }}
                          />
                          <div className="discord-embed-content">
                            <div className="discord-embed-title">{previewEmbedTitle}</div>
                            <div className="discord-embed-description">{previewEmbedDescription}</div>
                            <div className="discord-embed-footer">Welcome message preview</div>
                          </div>
                          {welcomeSettings.embed.showAvatar ? (
                            <div className="discord-embed-avatar">
                              {user?.username?.slice(0, 1) ?? "U"}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <span className="muted">Sending to {channelLabel}</span>
                </div>
              </div>
            </section>
          )
        ) : null}

        {activeSection === "events" ? (
          eventsLoading ? (
            <LoadingScreen label="Loading events..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Event Creator</p>
                  <h1>Plan events in minutes</h1>
                  <p className="muted">Create reminders and keep everyone on schedule.</p>
                </div>
                <Button onClick={handleCreateEvent} disabled={eventSaving}>
                  {eventSaving ? "Creating..." : "Create event"}
                </Button>
              </div>
              <div className="content-grid">
                <div className="card">
                  <div className="form-grid">
                    <label>
                      Title
                      <input
                        value={eventForm.title}
                        onChange={(event) =>
                          setEventForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        rows={3}
                        value={eventForm.description}
                        onChange={(event) =>
                          setEventForm((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </label>
                    <div className="form-grid split">
                      <label>
                        Date (dd.mm.yyyy)
                        <input
                          value={eventForm.date}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, date: event.target.value }))
                          }
                          placeholder="18.10.2025"
                        />
                      </label>
                      <label>
                        Time
                        <input
                          value={eventForm.time}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, time: event.target.value }))
                          }
                          placeholder="19:00"
                        />
                      </label>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={eventForm.repeating}
                        onChange={() =>
                          setEventForm((prev) => ({ ...prev, repeating: !prev.repeating }))
                        }
                      />
                      <span>Repeating event</span>
                    </label>
                    <div className="form-grid split">
                      <label>
                        Channel
                        <select
                          value={eventForm.channelId}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, channelId: event.target.value }))
                          }
                        >
                          {channels.map((channel) => (
                            <option key={channel.id} value={channel.id}>
                              {channel.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Role
                        <select
                          value={eventForm.roleId}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, roleId: event.target.value }))
                          }
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Duration (minutes)
                      <input
                        value={eventForm.durationMinutes}
                        onChange={(event) =>
                          setEventForm((prev) => ({ ...prev, durationMinutes: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="card">
                  <h3>Upcoming events</h3>
                  <div className="event-list">
                    {events.length === 0 ? (
                      <p className="muted">No events scheduled yet.</p>
                    ) : (
                      events.map((eventItem) => (
                        <div key={eventItem.id} className="event-card">
                          <div>
                            <strong>{eventItem.title}</strong>
                            <p className="muted">
                              {eventItem.date} - {eventItem.time} -
                              {" "}
                              {channelNameById.get(eventItem.channelId) ?? eventItem.channelId}
                            </p>
                          </div>
                          <div className="event-actions">
                            <span className={`pill ${eventItem.repeating ? "info" : "neutral"}`}>
                              {eventItem.repeating ? "Repeating" : "One-time"}
                            </span>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => handleDeleteEvent(eventItem.id)}
                              disabled={deletingEventId === eventItem.id}
                            >
                              {deletingEventId === eventItem.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          )
        ) : null}

        {activeSection === "emoji" ? (
          emojiLoading ? (
            <LoadingScreen label="Loading emoji triggers..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Emoji Triggers</p>
                  <h1>React with visuals</h1>
                  <p className="muted">Attach up to 10 emoji triggers with an image response.</p>
                </div>
                <div className="section-actions">
                  <Button variant="outline" onClick={handleEmojiSave} disabled={emojiSaving}>
                    {emojiSaving ? "Saving..." : "Save triggers"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setEmojiRows((prev) =>
                        prev.length >= maxEmojiTriggers
                          ? prev
                          : [...prev, { id: createId(), emoji: "", imageUrl: "" }]
                      )
                    }
                    disabled={emojiRows.length >= maxEmojiTriggers}
                  >
                    Add trigger
                  </Button>
                </div>
              </div>
              <div className="card">
                <div className="trigger-list">
                  {emojiRows.map((trigger) => (
                    <div key={trigger.id} className="trigger-row">
                      <input
                        className="emoji-input"
                        value={trigger.emoji}
                        onChange={(event) =>
                          setEmojiRows((prev) =>
                            prev.map((item) =>
                              item.id === trigger.id ? { ...item, emoji: event.target.value } : item
                            )
                          )
                        }
                        placeholder=":fire:"
                      />
                      <input
                        value={trigger.imageUrl}
                        onChange={(event) =>
                          setEmojiRows((prev) =>
                            prev.map((item) =>
                              item.id === trigger.id
                                ? { ...item, imageUrl: event.target.value }
                                : item
                            )
                          )
                        }
                        placeholder="Image URL"
                      />
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() =>
                          setEmojiRows((prev) => prev.filter((item) => item.id !== trigger.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <p className="muted">Limit: {emojiRows.length}/{maxEmojiTriggers} triggers.</p>
              </div>
            </section>
          )
        ) : null}

        {activeSection === "other" ? (
          warthogLoading ? (
            <LoadingScreen label="Loading Warthog settings..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Other</p>
                  <h1>Quick toggles</h1>
                  <p className="muted">Small switches that change the bot behavior instantly.</p>
                </div>
              </div>
              <div className="card">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={warthogEnabled}
                    onChange={handleWarthogToggle}
                    disabled={warthogSaving}
                  />
                  <span>{warthogSaving ? "Updating..." : "Enable Warthog mode"}</span>
                </label>
              </div>
            </section>
          )
        ) : null}
      </main>
    </div>
  );
};
