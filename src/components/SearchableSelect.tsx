import { useEffect, useMemo, useRef, useState } from "react";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyLabel?: string;
};

export const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "Search...",
  emptyLabel,
}: SearchableSelectProps) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label ?? "");

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? "");
    }
  }, [open, selected?.label]);

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const list = options.filter(
      (option) =>
        !lowered ||
        option.label.toLowerCase().includes(lowered) ||
        option.value.toLowerCase().includes(lowered)
    );
    return emptyLabel ? [{ value: "", label: emptyLabel }, ...list] : list;
  }, [options, query, emptyLabel]);

  const handleBlur = () => {
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (wrapperRef.current && active && wrapperRef.current.contains(active)) {
        return;
      }
      setOpen(false);
      const typed = query.trim().toLowerCase();
      if (!typed) {
        return;
      }
      const exactMatch = options.find(
        (option) => option.label.toLowerCase() === typed
      );
      if (exactMatch) {
        onChange(exactMatch.value);
      } else if (emptyLabel && emptyLabel.toLowerCase() === typed) {
        onChange("");
      }
    });
  };

  return (
    <div className="searchable-select" ref={wrapperRef} onBlur={handleBlur}>
      <input
        type="text"
        value={open ? query : selected?.label ?? ""}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery(selected?.label ?? "");
        }}
        placeholder={placeholder}
        className="searchable-input"
      />
      {open ? (
        <div className="searchable-menu">
          {filtered.length === 0 ? (
            <div className="searchable-empty">No matches</div>
          ) : (
            filtered.map((option) => (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                className="searchable-option"
                disabled={option.disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setQuery(option.label);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
};
