// Ctrl+K / Cmd+K palette: sections, servers and actions. Simple substring filter, no library.
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "../components/ui/Icon";

export type PaletteItem = {
  id: string;
  group: "Sections" | "Servers" | "Actions";
  label: string;
  hint?: string;
  icon: IconName;
  keywords?: string;
  run: () => void;
};

const score = (item: PaletteItem, query: string) => {
  if (!query) return 1;
  const label = item.label.toLowerCase();
  if (label.startsWith(query)) return 3;
  if (label.includes(query)) return 2;
  return `${item.keywords ?? ""} ${item.hint ?? ""}`.toLowerCase().includes(query) ? 1 : 0;
};

export const CommandPalette = ({ items, onClose }: { items: PaletteItem[]; onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
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
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="palette__input">
          <Icon name="search" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search sections, servers, actions…"
            aria-label="Search"
            aria-controls="palette-list"
            aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette__list" id="palette-list" role="listbox" ref={listRef}>
          {results.length === 0 ? <div className="option-empty">Nothing matches “{query}”.</div> : null}
          {results.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header ? <div className="palette__group">{header}</div> : null}
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
          <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
          <span><kbd>Enter</kbd> open</span>
        </div>
      </div>
    </div>
  );
};
