// Panel admin: every server the bot is on, next to the rail. Search by name (no case, no diacritics)
// or by a fragment of the ID; arrows + Enter open the server.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { AdminServer } from "../api/types";
import { IconButton } from "../components/ui/Button";
import { ErrorState, Skeleton } from "../components/ui/basics";
import { Icon } from "../components/ui/Icon";
import { useToast } from "../components/ui/Toast";
import { useT } from "../i18n";
import { fold } from "./search";
import { ServerAvatar } from "./ServerRail";

type Row = { server: AdminServer; key: string };

export const AllServersPanel = ({
  servers,
  total,
  loading,
  error,
  ownIds,
  currentId,
  onReload,
  onOpen,
  onClose,
}: {
  servers: AdminServer[];
  total: number;
  loading: boolean;
  error: string | null;
  ownIds: Set<string>;
  currentId: string;
  onReload: () => void;
  onOpen: (server: AdminServer) => void;
  onClose: () => void;
}) => {
  const { t, locale } = useT();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const rows = useMemo<Row[]>(() => {
    const collator = new Intl.Collator(locale, { sensitivity: "base" });
    return servers
      .map((server) => ({ server, key: fold(server.name) }))
      .sort((a, b) => collator.compare(a.server.name, b.server.name));
  }, [servers, locale]);

  const results = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return rows;
    const digits = q.replace(/\s+/g, "");
    const rank = (row: Row) => {
      if (row.server.id === digits) return 4;
      if (row.key.startsWith(q)) return 3;
      if (row.key.includes(q)) return 2;
      return /^\d+$/.test(digits) && row.server.id.includes(digits) ? 1 : 0;
    };
    return rows
      .map((row) => ({ row, r: rank(row) }))
      .filter((entry) => entry.r > 0)
      .sort((a, b) => b.r - a.r)
      .map((entry) => entry.row);
  }, [rows, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const copy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success(t("allServers.copied"));
    } catch {
      /* clipboard blocked: the ID stays selectable */
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = results[active];
      if (row) onOpen(row.server);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  const activeRow = results[active];

  return (
    <>
      <div className="flyout-backdrop" onClick={onClose} aria-hidden="true" />
      <section className="flyout" role="dialog" aria-label={t("allServers.title")} onKeyDown={(e) => e.key === "Escape" && onClose()}>
        <header className="flyout__head">
          <Icon name="globe" className="flyout__icon" />
          <h2 className="grow">{t("allServers.title")}</h2>
          {!loading || servers.length ? (
            <span className="flyout__count" aria-live="polite">
              {t("allServers.count", { n: numbers.format(results.length), total: numbers.format(total) })}
            </span>
          ) : null}
          <IconButton icon="close" label={t("action.close")} onClick={onClose} />
        </header>
        <div className="flyout__search">
          <Icon name="search" size="sm" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("allServers.search")}
            aria-label={t("allServers.search")}
            aria-controls="all-servers-list"
            aria-activedescendant={activeRow ? `all-srv-${activeRow.server.id}` : undefined}
            spellCheck={false}
          />
        </div>
        <div className="flyout__list" id="all-servers-list" role="listbox" ref={listRef} aria-label={t("allServers.title")}>
          {error ? <ErrorState message={error} onRetry={onReload} /> : null}
          {loading && !servers.length ? (
            <div className="flyout__skeleton" aria-label={t("allServers.loading")}>
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} height={40} />
              ))}
            </div>
          ) : null}
          {!loading && !error && servers.length && !results.length ? (
            <p className="flyout__empty">{t("allServers.none", { query: query.trim() })}</p>
          ) : null}
          {results.map(({ server }, index) => {
            const own = ownIds.has(server.id);
            return (
              <div
                key={server.id}
                id={`all-srv-${server.id}`}
                role="option"
                data-index={index}
                aria-selected={index === active}
                aria-current={server.id === currentId ? "page" : undefined}
                className={`srv-row${index === active ? " active" : ""}${server.id === currentId ? " current" : ""}`}
                onMouseMove={() => index !== active && setActive(index)}
                onClick={() => onOpen(server)}
              >
                <span className="srv-row__avatar">
                  <ServerAvatar server={server} />
                </span>
                <span className="srv-row__main">
                  <span className="srv-row__name truncate">
                    {server.name}
                    {own ? (
                      <span className="srv-row__own" title={t("allServers.yours")}>
                        <Icon name="user" size="sm" />
                        <span className="sr-only">{t("allServers.yours")}</span>
                      </span>
                    ) : null}
                  </span>
                  <span className="srv-row__id">{server.id}</span>
                </span>
                <span className="srv-row__members" title={t("stat.members")}>
                  <Icon name="users" size="sm" />
                  {server.memberCount === null ? "–" : numbers.format(server.memberCount)}
                </span>
                <IconButton
                  icon="copy"
                  label={t("allServers.copyId", { id: server.id })}
                  className="srv-row__copy"
                  tabIndex={-1}
                  onClick={(event) => {
                    event.stopPropagation();
                    void copy(server.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};
