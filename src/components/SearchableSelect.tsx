import { useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (!query.trim()) {
      return options;
    }
    const lowered = query.trim().toLowerCase();
    const matches = options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowered) ||
        option.value.toLowerCase().includes(lowered)
    );
    if (!value) {
      return matches;
    }
    const selected = options.find((option) => option.value === value);
    if (selected && !matches.some((option) => option.value === selected.value)) {
      return [selected, ...matches];
    }
    return matches;
  }, [options, query, value]);

  return (
    <div className="searchable-select">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="searchable-input"
      />
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {filtered.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
