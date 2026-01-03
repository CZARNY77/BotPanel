import { useEffect, useMemo, useState } from "react";
import {
  createEvent,
  deleteEvent,
  getEmojis,
  getEmojiTriggers,
  getEvents,
  getFarewellSettings,
  getInviteUrl,
  getServerMetadata,
  getServers,
  getAutorole,
  getWelcomeSettings,
  getWarthog,
  uploadImage,
  updateAutorole,
  updateEmojiTriggers,
  updateEvent,
  updateFarewellSettings,
  updateWelcomeSettings,
  updateWarthog,
} from "../api/client";
import type {
  EmojiTrigger,
  EmojiOption,
  EventInput,
  EventItem,
  FarewellSettings,
  AutoRoleSettings,
  Server,
  ServerMetadata,
  WelcomeSettings,
} from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/Button";
import { LoadingScreen } from "../components/LoadingScreen";
import logo from "../assets/logo.png";

type SectionKey = "overview" | "welcome" | "events" | "emoji" | "autorole" | "other";

type TriggerRow = EmojiTrigger & {
  id: string;
  uploadFile?: File | null;
  previewUrl?: string;
  uploading?: boolean;
};

type LoadedState = {
  metadata: boolean;
  welcome: boolean;
  farewell: boolean;
  events: boolean;
  emoji: boolean;
  warthog: boolean;
  autorole: boolean;
};

type LoadingState = LoadedState;

const sections: { key: SectionKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "welcome", label: "Greetings & Farewells" },
  { key: "events", label: "Event Creator" },
  { key: "emoji", label: "Emoji Triggers" },
  { key: "autorole", label: "Auto Role" },
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

const emptyFarewell: FarewellSettings = {
  enabled: false,
  channelId: "",
  type: "embed",
  text: "Goodbye {user}. Thanks for being with {server}.",
  embed: {
    title: "Farewell!",
    description: "{user} just left {server}.",
    color: "#2f7cff",
    showAvatar: true,
  },
};

const emptyAutorole: AutoRoleSettings = {
  enabled: false,
  roleId: "",
};

const emptyMetadata: ServerMetadata = {
  channels: [],
  roles: [],
};

const emptyLoadedState: LoadedState = {
  metadata: false,
  welcome: false,
  farewell: false,
  events: false,
  emoji: false,
  warthog: false,
  autorole: false,
};

const emptyLoadingState: LoadingState = {
  metadata: false,
  welcome: false,
  farewell: false,
  events: false,
  emoji: false,
  warthog: false,
  autorole: false,
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
const fromPanelDate = (value: string) => {
  const [day, month, year] = value.split(".");
  if (!day || !month || !year) {
    return "";
  }
  return `${year}-${month}-${day}`;
};
const stripRolePrefix = (value: string) => (value.startsWith("@") ? value.slice(1) : value);

const extractImageUrl = (value: string) => {
  const match = value.match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S+)?/i);
  return match ? match[0] : "";
};

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
  const [farewellSettings, setFarewellSettings] = useState<FarewellSettings>(emptyFarewell);
  const [farewellSaving, setFarewellSaving] = useState(false);

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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const [emojiRows, setEmojiRows] = useState<TriggerRow[]>([]);
  const [emojiOptions, setEmojiOptions] = useState<EmojiOption[]>([]);
  const [emojiOptionsLoading, setEmojiOptionsLoading] = useState(false);
  const [emojiSaving, setEmojiSaving] = useState(false);
  const [activeEmojiPickerId, setActiveEmojiPickerId] = useState<string | null>(null);

  const [warthogEnabled, setWarthogEnabled] = useState(true);
  const [warthogSaving, setWarthogSaving] = useState(false);

  const [autoroleSettings, setAutoroleSettings] = useState<AutoRoleSettings>(emptyAutorole);
  const [autoroleSaving, setAutoroleSaving] = useState(false);

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
    setFarewellSettings(emptyFarewell);
    setEvents([]);
    setEmojiRows([]);
    setEmojiOptions([]);
    setEmojiOptionsLoading(false);
    setWarthogEnabled(true);
    setAutoroleSettings(emptyAutorole);
    setActiveEmojiPickerId(null);
    setError(null);
    setSuccess(null);
    setEditingEventId(null);
    setEventForm((prev) => ({
      ...prev,
      title: "",
      description: "",
      date: "",
      time: "",
      repeating: false,
      channelId: "",
      roleId: "",
      durationHours: "1",
    }));
  }, [activeServerId]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [activeSection]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".emoji-select")) {
        setActiveEmojiPickerId(null);
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

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
    if (!farewellSettings.channelId && channels.length) {
      setFarewellSettings((prev) => ({
        ...prev,
        channelId: channels[0].id,
      }));
    }
  }, [channels, farewellSettings.channelId]);

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

  useEffect(() => {
    if (!autoroleSettings.roleId && roles.length) {
      setAutoroleSettings((prev) => ({
        ...prev,
        roleId: roles[0].id,
      }));
    }
  }, [roles, autoroleSettings.roleId]);

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

  const loadFarewell = async () => {
    if (!activeServerId || loaded.farewell || sectionLoading.farewell) {
      return;
    }
    updateSectionLoading("farewell", true);
    try {
      const data = await getFarewellSettings(activeServerId);
      setFarewellSettings(data);
      updateLoaded("farewell", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farewell settings.");
      updateLoaded("farewell", true);
    } finally {
      updateSectionLoading("farewell", false);
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

  const loadAutorole = async () => {
    if (!activeServerId || loaded.autorole || sectionLoading.autorole) {
      return;
    }
    updateSectionLoading("autorole", true);
    try {
      const data = await getAutorole(activeServerId);
      setAutoroleSettings(data);
      updateLoaded("autorole", true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load auto role settings.");
      updateLoaded("autorole", true);
    } finally {
      updateSectionLoading("autorole", false);
    }
  };

  useEffect(() => {
    if (!activeServerId) {
      return;
    }

    if (activeSection === "welcome") {
      void loadMetadata();
      void loadWelcome();
      void loadFarewell();
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

    if (activeSection === "autorole") {
      void loadMetadata();
      void loadAutorole();
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
    if (welcomeSettings.enabled) {
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

  const handleFarewellSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (farewellSettings.enabled) {
      if (farewellSettings.type === "text" && !farewellSettings.text.trim()) {
        setError("Farewell text cannot be empty.");
        return;
      }
      if (
        farewellSettings.type === "embed" &&
        !farewellSettings.embed.title.trim() &&
        !farewellSettings.embed.description.trim()
      ) {
        setError("Provide at least a title or description for the farewell embed.");
        return;
      }
      if (!farewellSettings.channelId) {
        setError("Pick a channel for the farewell message.");
        return;
      }
    }

    setFarewellSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateFarewellSettings(activeServerId, farewellSettings);
      setFarewellSettings(saved);
      setSuccess("Farewell settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save farewell settings.");
    } finally {
      setFarewellSaving(false);
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
      if (editingEventId) {
        const updated = await updateEvent(activeServerId, editingEventId, payload);
        setEvents((prev) =>
          prev.map((eventItem) => (eventItem.id === updated.id ? updated : eventItem))
        );
        setEditingEventId(null);
        setSuccess("Event updated.");
      } else {
        const created = await createEvent(activeServerId, payload);
        setEvents((prev) => [created, ...prev]);
        setSuccess("Event created.");
      }
      setEventForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        date: "",
        time: "",
        repeating: false,
        durationHours: "1",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event.");
    } finally {
      setEventSaving(false);
    }
  };

  const handleEditEvent = (eventItem: EventItem) => {
    setEditingEventId(eventItem.id);
    setEventForm({
      title: eventItem.title,
      description: eventItem.description ?? "",
      date: fromPanelDate(eventItem.date),
      time: eventItem.time,
      repeating: eventItem.repeating,
      channelId: eventItem.channelId,
      roleId: eventItem.roleId,
      durationHours: eventItem.durationMinutes
        ? String(Math.max(0.5, eventItem.durationMinutes / 60))
        : "1",
    });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEventForm((prev) => ({
      ...prev,
      title: "",
      description: "",
      date: "",
      time: "",
      repeating: false,
      durationHours: "1",
    }));
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
      if (editingEventId === deletedId) {
        handleCancelEdit();
      }
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
      setError("Add an image URL or upload an image for each trigger.");
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

  const handleAutoroleSave = async () => {
    if (!activeServerId) {
      return;
    }
    if (autoroleSettings.enabled && !autoroleSettings.roleId) {
      setError("Choose a role to assign.");
      return;
    }

    setAutoroleSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await updateAutorole(activeServerId, autoroleSettings);
      setAutoroleSettings(saved);
      setSuccess("Auto role settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save auto role settings.");
    } finally {
      setAutoroleSaving(false);
    }
  };

  const welcomeChannelLabel =
    channels.find((channel) => channel.id === welcomeSettings.channelId)?.name ??
    (welcomeSettings.channelId || "#channel");
  const farewellChannelLabel =
    channels.find((channel) => channel.id === farewellSettings.channelId)?.name ??
    (farewellSettings.channelId || "#channel");

  const previewText = formatPreview(welcomeSettings.text);
  const previewEmbedTitle = formatPreview(welcomeSettings.embed.title);
  const previewEmbedDescription = formatPreview(welcomeSettings.embed.description);
  const previewFarewellText = formatPreview(farewellSettings.text);
  const previewFarewellEmbedTitle = formatPreview(farewellSettings.embed.title);
  const previewFarewellEmbedDescription = formatPreview(farewellSettings.embed.description);

  const welcomeImagePreview = extractImageUrl(
    welcomeSettings.type === "text" ? welcomeSettings.text : welcomeSettings.embed.description
  );
  const farewellImagePreview = extractImageUrl(
    farewellSettings.type === "text" ? farewellSettings.text : farewellSettings.embed.description
  );

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

  const welcomeLoading =
    !loaded.welcome ||
    !loaded.farewell ||
    sectionLoading.welcome ||
    sectionLoading.farewell ||
    sectionLoading.metadata;
  const eventsLoading = !loaded.events || sectionLoading.events || sectionLoading.metadata;
  const emojiLoading =
    !loaded.emoji || sectionLoading.emoji || (emojiOptionsLoading && emojiOptions.length === 0);
  const emojiUploadInProgress = emojiRows.some((row) => row.uploading);
  const warthogLoading = !loaded.warthog || sectionLoading.warthog;
  const autoroleLoading =
    !loaded.autorole || sectionLoading.autorole || sectionLoading.metadata;

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
                  <p className="eyebrow">Greetings & Farewells</p>
                  <h1>Set the tone for arrivals and departures</h1>
                  <p className="muted">Toggle welcome or farewell messages and tailor the content.</p>
                </div>
              </div>
              <div className="content-grid content-grid--wide-preview">
                <div className="card-stack">
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3>Welcome message</h3>
                        <p className="muted">Greet new members with an automated message.</p>
                      </div>
                      <Button onClick={handleWelcomeSave} disabled={welcomeSaving}>
                        {welcomeSaving ? "Saving..." : "Save welcome"}
                      </Button>
                    </div>
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
                    {welcomeSettings.enabled ? (
                      <>
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
                      </>
                    ) : (
                      <p className="muted">Welcome messages are currently disabled.</p>
                    )}
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h3>Farewell message</h3>
                        <p className="muted">Say goodbye automatically when members leave.</p>
                      </div>
                      <Button onClick={handleFarewellSave} disabled={farewellSaving}>
                        {farewellSaving ? "Saving..." : "Save farewell"}
                      </Button>
                    </div>
                    <div className="switch-row">
                      <label className="switch-control">
                        <input
                          type="checkbox"
                          checked={farewellSettings.enabled}
                          onChange={() =>
                            setFarewellSettings((prev) => ({
                              ...prev,
                              enabled: !prev.enabled,
                            }))
                          }
                          aria-label="Enable farewell message"
                        />
                      </label>
                      <span className="switch-label">Enable farewell message</span>
                    </div>
                    {farewellSettings.enabled ? (
                      <>
                        <div className="form-grid">
                          <label>
                            Channel
                            <select
                              value={farewellSettings.channelId}
                              onChange={(event) =>
                                setFarewellSettings((prev) => ({
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
                              value={farewellSettings.type}
                              onChange={(event) =>
                                setFarewellSettings((prev) => ({
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

                        {farewellSettings.type === "embed" ? (
                          <div className="form-grid">
                            <label>
                              Embed title
                              <input
                                value={farewellSettings.embed.title}
                                onChange={(event) =>
                                  setFarewellSettings((prev) => ({
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
                                value={farewellSettings.embed.description}
                                onChange={(event) =>
                                  setFarewellSettings((prev) => ({
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
                                  value={farewellSettings.embed.color}
                                  onChange={(event) =>
                                    setFarewellSettings((prev) => ({
                                      ...prev,
                                      embed: {
                                        ...prev.embed,
                                        color: event.target.value,
                                      },
                                    }))
                                  }
                                  aria-label="Embed accent color"
                                />
                                <span className="color-value">{farewellSettings.embed.color}</span>
                              </div>
                            </div>
                            <div className="switch-row">
                              <label className="switch-control">
                                <input
                                  type="checkbox"
                                  checked={farewellSettings.embed.showAvatar}
                                  onChange={() =>
                                    setFarewellSettings((prev) => ({
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
                                value={farewellSettings.text}
                                onChange={(event) =>
                                  setFarewellSettings((prev) => ({
                                    ...prev,
                                    text: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <p className="muted">You can use {"{user}"} and {"{server}"} variables.</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="muted">Farewell messages are currently disabled.</p>
                    )}
                  </div>
                </div>

                <div className="card-stack">
                  <div className="card discord-preview">
                    <p className="muted">Welcome preview</p>
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
                        {welcomeSettings.enabled ? (
                          welcomeSettings.type === "text" ? (
                            <>
                              <p className="discord-text">{previewText}</p>
                              {welcomeImagePreview ? (
                                <div className="discord-media">
                                  <img src={welcomeImagePreview} alt="Welcome preview" />
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <div className="discord-embed">
                                <div
                                  className="discord-embed-accent"
                                  style={{ background: welcomeSettings.embed.color }}
                                />
                                <div className="discord-embed-content">
                                  <div className="discord-embed-title">{previewEmbedTitle}</div>
                                  <div className="discord-embed-description">
                                    {previewEmbedDescription}
                                  </div>
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
                              {welcomeImagePreview ? (
                                <div className="discord-media">
                                  <img src={welcomeImagePreview} alt="Welcome preview" />
                                </div>
                              ) : null}
                            </>
                          )
                        ) : (
                          <p className="muted">Welcome message disabled.</p>
                        )}
                      </div>
                    </div>
                    <span className="muted">Sending to {welcomeChannelLabel}</span>
                  </div>

                  <div className="card discord-preview">
                    <p className="muted">Farewell preview</p>
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
                        {farewellSettings.enabled ? (
                          farewellSettings.type === "text" ? (
                            <>
                              <p className="discord-text">{previewFarewellText}</p>
                              {farewellImagePreview ? (
                                <div className="discord-media">
                                  <img src={farewellImagePreview} alt="Farewell preview" />
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <div className="discord-embed">
                                <div
                                  className="discord-embed-accent"
                                  style={{ background: farewellSettings.embed.color }}
                                />
                                <div className="discord-embed-content">
                                  <div className="discord-embed-title">{previewFarewellEmbedTitle}</div>
                                  <div className="discord-embed-description">
                                    {previewFarewellEmbedDescription}
                                  </div>
                                  <div className="discord-embed-footer">Farewell message preview</div>
                                </div>
                                {farewellSettings.embed.showAvatar ? (
                                  <div className="discord-embed-avatar">
                                    {user?.avatarUrl ? (
                                      <img src={user.avatarUrl} alt={user.username ?? "User"} />
                                    ) : (
                                      <span>{user?.username?.slice(0, 1) ?? "U"}</span>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                              {farewellImagePreview ? (
                                <div className="discord-media">
                                  <img src={farewellImagePreview} alt="Farewell preview" />
                                </div>
                              ) : null}
                            </>
                          )
                        ) : (
                          <p className="muted">Farewell message disabled.</p>
                        )}
                      </div>
                    </div>
                    <span className="muted">Sending to {farewellChannelLabel}</span>
                  </div>
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
                <div className="section-actions">
                  <Button onClick={handleCreateEvent} disabled={eventSaving}>
                    {eventSaving
                      ? "Saving..."
                      : editingEventId
                      ? "Update event"
                      : "Create event"}
                  </Button>
                  {editingEventId ? (
                    <Button variant="ghost" onClick={handleCancelEdit}>
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="content-grid content-grid--events">
                <div className="card">
                  {editingEventId ? (
                    <p className="muted">Editing event {editingEventId}</p>
                  ) : null}
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
                  <div className="event-grid">
                    {events.length === 0 ? (
                      <p className="muted">No events scheduled yet.</p>
                    ) : (
                      events.map((eventItem) => (
                        <div key={eventItem.id} className="event-tile">
                          <div className="event-tile-header">
                            <strong>{eventItem.title}</strong>
                            <span className={`pill ${eventItem.repeating ? "info" : "neutral"}`}>
                              {eventItem.repeating ? "Repeating" : "One-time"}
                            </span>
                          </div>
                          <p className="muted">
                            {eventItem.date} • {eventItem.time}
                          </p>
                          <p className="muted">
                            {channelNameById.get(eventItem.channelId) ?? eventItem.channelId}
                          </p>
                          <div className="event-actions">
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => handleEditEvent(eventItem)}
                            >
                              Edit
                            </button>
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
                    const pickerOpen = activeEmojiPickerId === trigger.id;
                    const pickerLabel =
                      emojiOption?.name ??
                      (trigger.emoji ? `Custom: ${trigger.emoji}` : "Select emoji");
                    return (
                      <div key={trigger.id} className="trigger-row">
                        <div className="trigger-emoji">
                          <div className="emoji-select">
                            <button
                              type="button"
                              className="emoji-select-trigger"
                              onClick={() =>
                                setActiveEmojiPickerId(pickerOpen ? null : trigger.id)
                              }
                            >
                              {emojiOption?.url ? (
                                <img src={emojiOption.url} alt={emojiOption.name} />
                              ) : (
                                <span className="emoji-select-placeholder">🙂</span>
                              )}
                              <span>{pickerLabel}</span>
                            </button>
                            {pickerOpen ? (
                              <div className="emoji-select-menu">
                                {emojiOptions.map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    className="emoji-option"
                                    onClick={() => {
                                      updateEmojiRow(trigger.id, (row) => ({
                                        ...row,
                                        emoji: option.id,
                                      }));
                                      setActiveEmojiPickerId(null);
                                    }}
                                  >
                                    <img src={option.url} alt={option.name} />
                                    <span>{option.name}</span>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <input
                            className="emoji-custom-input"
                            value={emojiMap.has(trigger.emoji) ? "" : trigger.emoji}
                            onChange={(event) =>
                              updateEmojiRow(trigger.id, (row) => ({
                                ...row,
                                emoji: event.target.value,
                              }))
                            }
                            placeholder="Custom emoji id or unicode"
                          />
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

        {activeSection === "autorole" ? (
          autoroleLoading ? (
            <LoadingScreen label="Loading auto role settings..." />
          ) : (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Auto Role</p>
                  <h1>Assign roles on join</h1>
                  <p className="muted">Automatically grant a role when someone joins the server.</p>
                </div>
                <Button onClick={handleAutoroleSave} disabled={autoroleSaving}>
                  {autoroleSaving ? "Saving..." : "Save auto role"}
                </Button>
              </div>
              <div className="card">
                <div className="switch-row">
                  <label className="switch-control">
                    <input
                      type="checkbox"
                      checked={autoroleSettings.enabled}
                      onChange={() =>
                        setAutoroleSettings((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }))
                      }
                      aria-label="Enable auto role"
                    />
                  </label>
                  <span className="switch-label">Enable auto role</span>
                </div>
                {autoroleSettings.enabled ? (
                  <div className="form-grid">
                    <label>
                      Role to assign
                      <select
                        value={autoroleSettings.roleId}
                        onChange={(event) =>
                          setAutoroleSettings((prev) => ({
                            ...prev,
                            roleId: event.target.value,
                          }))
                        }
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {stripRolePrefix(role.name)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="muted">The bot must have permission to manage roles.</p>
                  </div>
                ) : (
                  <p className="muted">Auto role is disabled.</p>
                )}
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
