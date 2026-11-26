// Ctrl+K / Cmd+K palette: sections, servers and actions. Simple substring filter, no library.
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "../components/ui/Icon";
import { useT } from "../i18n";
import { fold } from "./search";

export type PaletteItem = {
  id: string;
  group: "sections" | "servers" | "actions";
  label: string;
  hint?: string;
  icon: IconName;
  keywords?: string;
  /** Shown only once the user types (e.g. the admin list of every server). */
  searchOnly?: boolean;
  run: () => void;
};

const score = (item: PaletteItem, query: string) => {
  if (!query) return item.searchOnly ? 0 : 1;
  const label = fold(item.label);
  if (label.startsWith(query)) return 3;
  if (label.includes(query)) return 2;
  return fold(`${item.keywords ?? ""} ${item.hint ?? ""}`).includes(query) ? 1 : 0;
};

export const CommandPalette = ({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) => {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = fold(query.trim());
    return items
      .map((item) => ({ item, s: score(item, q) }))
      .filter((entry) => entry.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0))
      .map((entry) => entry.item);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (item: PaletteItem | undefined) => {
    if (!item) return;
    onClose();
    item.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[active]);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = "";
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label={t("search.label")}>
        <div className="palette__input">
          <Icon name="search" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette__list" id="palette-list" role="listbox" ref={listRef}>
          {results.length === 0 ? <div className="option-empty">{t("search.nothing", { query })}</div> : null}
          {results.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header ? <div className="palette__group">{t(`palette.${item.group}`)}</div> : null}
                <button
                  type="button"
                  id={`palette-${item.id}`}
                  role="option"
                  data-index={index}
                  aria-selected={index === active}
                  className={`option palette__option${index === active ? " active" : ""}`}
                  onMouseMove={() => setActive(index)}
                  onClick={() => run(item)}
                >
                  <Icon name={item.icon} />
                  <span className="grow truncate">{item.label}</span>
                  {item.hint ? <span className="muted xs">{item.hint}</span> : null}
                </button>
              </div>
            );
          })}
        </div>
        <div className="palette__foot muted xs">
          <span><kbd>↑</kbd> <kbd>↓</kbd> {t("search.move")}</span>
          <span><kbd>Enter</kbd> {t("search.open")}</span>
        </div>
      </div>
    </div>
  );
};
