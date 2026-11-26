// Searchable select (keyboard friendly). Base for ChannelSelect / RoleSelect / MultiSelectChips.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useT } from "../../i18n";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** Adds an option with value "" (e.g. "No role"). */
  emptyLabel?: string;
  ariaLabel?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  /** Clear the text after picking (used by "add" pickers). */
  resetOnPick?: boolean;
};

export const Select = ({
  value,
  onChange,
  options,
  placeholder: placeholderProp,
  emptyLabel,
  ariaLabel,
  invalid,
  disabled,
  id,
  resetOnPick = false,
}: SelectProps) => {
  const { t } = useT();
  const placeholder = placeholderProp ?? t("select.search");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = options.filter(
      (option) => !q || option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q)
    );
    return emptyLabel && !q ? [{ value: "", label: emptyLabel }, ...list] : list;
  }, [options, query, emptyLabel]);

  useEffect(() => setActive(0), [query, open]);

  const pick = (option: SelectOption | undefined) => {
    if (!option || option.disabled) return;
    onChange(option.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      pick(filtered[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className="combo"
      ref={wrapperRef}
      onBlur={() =>
        requestAnimationFrame(() => {
          if (!wrapperRef.current?.contains(document.activeElement)) {
            setOpen(false);
            setQuery("");
          }
        })
      }
    >
      <input
        id={id}
        className="input"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={open ? query : resetOnPick ? "" : selected?.label ?? ""}
        placeholder={open ? selected?.label ?? placeholder : resetOnPick ? placeholder : selected ? "" : placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <div className="popover" id={listId} role="listbox">
          {filtered.length === 0 ? <div className="option-empty">{t("select.noMatches")}</div> : null}
          {filtered.map((option, index) => (
            <button
              key={`${option.value}-${option.label}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`option${index === active ? " active" : ""}`}
              disabled={option.disabled}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => pick(option)}
            >
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
