import { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  deleteEvent,
  getEmojis,
  getEmojiTriggers,
  getEvents,
  getInviteUrl,
  getServerMetadata,
  getServers,
  getWelcomeSettings,
  getWarthog,
  uploadImage,
  updateEmojiTriggers,
  updateWelcomeSettings,
  updateWarthog,
} from "../api/client";
import type {
  EmojiTrigger,
  EmojiOption,
  EventInput,
  EventItem,
  Server,
  ServerMetadata,
  WelcomeSettings,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { LoadingScreen } from "../components/LoadingScreen";
import logo from "../assets/logo.png";

type SectionKey = "overview" | "welcome" | "events" | "emoji" | "other";

type TriggerRow = EmojiTrigger & {
  id: string;
  uploadFile?: File | null;
  previewUrl?: string;
  uploading?: boolean;
};

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
  { id: "Raid", name: "Raid" },
  { id: "Guild", name: "Guild" },
  { id: "Officers", name: "Officers" },
  { id: "Everyone", name: "Everyone" },
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
const maxUploadBytes = 5 * 1024 * 1024;
const createId = () => Math.random().toString(36).slice(2, 9);

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const toPanelDate = (value: string) => {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}.${month}.${year}`;
};
const stripRolePrefix = (value: string) => (value.startsWith("@") ? value.slice(1) : value);

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
    durationHours: "1",
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventSaving, setEventSaving] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const [emojiRows, setEmojiRows] = useState<TriggerRow[]>([]);
  const [emojiOptions, setEmojiOptions] = useState<EmojiOption[]>([]);
  const [emojiOptionsLoading, setEmojiOptionsLoading] = useState(false);
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
    setEmojiOptions([]);
    setEmojiOptionsLoading(false);
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
      durationHours: "1",
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
      setEmojiRows(
        data.map((trigger) => ({
          ...trigger,
          id: createId(),
          uploadFile: null,
          previewUrl: "",
        }))
      );
      updateLoaded("emoji", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emoji triggers.");
      updateLoaded("emoji", true);
    } finally {
      updateSectionLoading("emoji", false);
    }
  };

  const loadEmojiOptions = async () => {
    if (!activeServerId || emojiOptionsLoading || emojiOptions.length > 0) {
      return;
    }
    setEmojiOptionsLoading(true);
    try {
      const data = await getEmojis(activeServerId);
      setEmojiOptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load emojis.");
    } finally {
      setEmojiOptionsLoading(false);
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
      void loadEmojiOptions();
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
      setError("Pick a valid date.");
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

    const durationHours = Number.parseFloat(eventForm.durationHours);
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
      setError("Duration must be a positive number of hours.");
      return;
    }

    const formattedDate = toPanelDate(eventForm.date);
    if (!formattedDate) {
      setError("Pick a valid date.");
      return;
    }

    const durationMinutes = Math.round(durationHours * 60);

    setEventSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: EventInput = {
        title: eventForm.title,
        description: eventForm.description,
        date: formattedDate,
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

  const updateEmojiRow = (id: string, updater: (row: TriggerRow) => TriggerRow) => {
    setEmojiRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) {
          return row;
        }
        const next = updater(row);
        if (row.previewUrl && row.previewUrl.startsWith("blob:") && row.previewUrl !== next.previewUrl) {
          URL.revokeObjectURL(row.previewUrl);
        }
        return next;
      })
    );
  };

  const removeEmojiRow = (id: string) => {
    setEmojiRows((prev) => {
      const row = prev.find((item) => item.id === id);
      if (row?.previewUrl && row.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(row.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleEmojiUpload = async (id: string, file: File) => {
    if (!activeServerId) {
      setError("Pick a server before uploading.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    updateEmojiRow(id, (row) => ({
      ...row,
      uploadFile: file,
      previewUrl,
      uploading: true,
    }));
    setError(null);
    try {
      const url = await uploadImage(file, activeServerId);
      updateEmojiRow(id, (row) => ({
        ...row,
        imageUrl: url,
        uploadFile: null,
        previewUrl: url,
        uploading: false,
      }));
    } catch (err) {
      updateEmojiRow(id, (row) => ({
        ...row,
        uploadFile: null,
        previewUrl: row.imageUrl,
        uploading: false,
      }));
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    }
  };

  const handleEmojiSave = async () => {
    if (!activeServerId) {
      return;
    }

    if (emojiRows.some((row) => row.uploading)) {
      setError("Wait for uploads to finish before saving.");
      return;
    }

    if (emojiRows.length > maxEmojiTriggers) {
      setError(`Limit is ${maxEmojiTriggers} triggers.`);
      return;
    }

    if (emojiRows.some((row) => !row.emoji.trim())) {
      setError("Every emoji trigger needs an emoji.");
      return;
    }

    if (emojiRows.some((row) => !row.imageUrl.trim())) {
      setError("Add an image URL for each trigger. Uploads are preview-only for now.");
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
      setEmojiRows(
        updated.map((trigger) => ({
          ...trigger,
          id: createId(),
          uploadFile: null,
          previewUrl: "",
        }))
      );
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
    (welcomeSettings.channelId || "#channel");

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

  const emojiMap = useMemo(() => {
    const map = new Map<string, EmojiOption>();
    emojiOptions.forEach((emoji) => {
      map.set(emoji.id, emoji);
    });
    return map;
  }, [emojiOptions]);

  const welcomeLoading = !loaded.welcome || sectionLoading.welcome || sectionLoading.metadata;
  const eventsLoading = !loaded.events || sectionLoading.events || sectionLoading.metadata;
  const emojiLoading =
    !loaded.emoji || sectionLoading.emoji || (emojiOptionsLoading && emojiOptions.length === 0);
  const emojiUploadInProgress = emojiRows.some((row) => row.uploading);
  const warthogLoading = !loaded.warthog || sectionLoading.warthog;

  if (loading) {
    return <LoadingScreen label="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-shell">
      <aside className="server-rail">
        <div className="server-brand" title="ConqBot Home">
          <img src={logo} alt="ConqBot logo" />
        </div>
        <div className="server-divider" />
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
          <div className="server-identity">
            <div className="server-icon">
              {activeServer?.iconUrl ? (
                <img src={activeServer.iconUrl} alt={activeServer.name} />
              ) : (
                <span>{activeServer?.name?.slice(0, 1) ?? "S"}</span>
              )}
            </div>
            <h2 className="server-name">{activeServer?.name ?? "No server"}</h2>
          </div>
          <span className="meta">ID: {activeServer?.id ?? "-"}</span>
        </div>

        <div className="side-divider" />

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

        <div className="side-divider" />

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
              <div className="content-grid content-grid--wide-preview">
                <div className="card">
                  <div className="switch-row">
                    <label className="switch-control">
                      <input
                        type="checkbox"
                        checked={welcomeSettings.enabled}
                        onChange={() =>
                          setWelcomeSettings((prev) => ({
                            ...prev,
                            enabled: !prev.enabled,
                          }))
                        }
                        aria-label="Enable welcome message"
                      />
                    </label>
                    <span className="switch-label">Enable welcome message</span>
                  </div>
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
                      <div className="field">
                        <span>Accent color</span>
                        <div className="color-input">
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
                            aria-label="Embed accent color"
                          />
                          <span className="color-value">{welcomeSettings.embed.color}</span>
                        </div>
                      </div>
                      <div className="switch-row">
                        <label className="switch-control">
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
                            aria-label="Show user avatar"
                          />
                        </label>
                        <span className="switch-label">Show user avatar</span>
                      </div>
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
                      <img src={logo} alt="ConqBot" />
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
                              {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username ?? "User"} />
                              ) : (
                                <span>{user?.username?.slice(0, 1) ?? "U"}</span>
                              )}
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
                        Date
                        <input
                          type="date"
                          value={eventForm.date}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, date: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Time
                        <input
                          type="time"
                          value={eventForm.time}
                          onChange={(event) =>
                            setEventForm((prev) => ({ ...prev, time: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                    <div className="switch-row">
                      <label className="switch-control">
                        <input
                          type="checkbox"
                          checked={eventForm.repeating}
                          onChange={() =>
                            setEventForm((prev) => ({ ...prev, repeating: !prev.repeating }))
                          }
                          aria-label="Repeating event"
                        />
                      </label>
                      <span className="switch-label">Repeating event</span>
                    </div>
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
                              {stripRolePrefix(role.name)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Duration (hours)
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={eventForm.durationHours}
                        onChange={(event) =>
                          setEventForm((prev) => ({ ...prev, durationHours: event.target.value }))
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
                  <Button
                    variant="outline"
                    onClick={handleEmojiSave}
                    disabled={emojiSaving || emojiUploadInProgress}
                  >
                    {emojiSaving ? "Saving..." : emojiUploadInProgress ? "Uploading..." : "Save triggers"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setEmojiRows((prev) =>
                        prev.length >= maxEmojiTriggers
                          ? prev
                          : [
                              ...prev,
                              {
                                id: createId(),
                                emoji: "",
                                imageUrl: "",
                                uploadFile: null,
                                previewUrl: "",
                              },
                            ]
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
                  {emojiRows.map((trigger) => {
                    const emojiOption = emojiMap.get(trigger.emoji);
                    const previewSource = trigger.uploadFile ? trigger.previewUrl : trigger.imageUrl;
                    return (
                      <div key={trigger.id} className="trigger-row">
                        <div className="trigger-emoji">
                          <select
                            value={trigger.emoji}
                            onChange={(event) =>
                              updateEmojiRow(trigger.id, (row) => ({
                                ...row,
                                emoji: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select emoji</option>
                            {emojiOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                            {trigger.emoji && !emojiMap.has(trigger.emoji) ? (
                              <option value={trigger.emoji}>Custom: {trigger.emoji}</option>
                            ) : null}
                          </select>
                          {emojiOption?.url ? (
                            <img
                              className="emoji-preview"
                              src={emojiOption.url}
                              alt={emojiOption.name}
                            />
                          ) : (
                            <span className="muted">No preview</span>
                          )}
                        </div>
                        <div className="trigger-media">
                          <input
                            type="url"
                            value={trigger.imageUrl}
                            onChange={(event) =>
                              updateEmojiRow(trigger.id, (row) => ({
                                ...row,
                                imageUrl: event.target.value,
                                uploadFile: null,
                                previewUrl: "",
                              }))
                            }
                            placeholder="Image URL"
                          />
                          <div className="trigger-upload">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                if (!file) {
                                  updateEmojiRow(trigger.id, (row) => ({
                                    ...row,
                                    uploadFile: null,
                                    previewUrl: "",
                                    uploading: false,
                                  }));
                                  return;
                                }
                                if (file.size > maxUploadBytes) {
                                  setError("Uploads must be 5MB or smaller.");
                                  event.currentTarget.value = "";
                                  return;
                                }
                                void handleEmojiUpload(trigger.id, file);
                              }}
                            />
                            <span className="muted">
                              {trigger.uploading ? "Uploading image..." : "Upload preview (max 5MB)."}
                            </span>
                          </div>
                        </div>
                        <div className="trigger-preview">
                          {previewSource ? (
                            <img src={previewSource} alt="Trigger preview" />
                          ) : (
                            <span className="muted">No image</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeEmojiRow(trigger.id)}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
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
                <div className="switch-row">
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={warthogEnabled}
                      onChange={handleWarthogToggle}
                      disabled={warthogSaving}
                      aria-label="Enable Warthog mode"
                    />
                  </label>
                  <span className="switch-label">
                    {warthogSaving ? "Updating..." : "Enable Warthog mode"}
                  </span>
                </div>
              </div>
            </section>
          )
        ) : null}
      </main>
    </div>
  );
};
