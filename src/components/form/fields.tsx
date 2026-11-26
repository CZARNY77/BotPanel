// Field wrapper + selects bound to server metadata.
import { forwardRef, useId, type ReactNode } from "react";
import { useServerMeta } from "../../hooks/useServerMeta";
import { Icon } from "../ui/Icon";
import { localeOf, useT } from "../../i18n";
import { Select, type SelectOption } from "./Select";

export const Field = ({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) => (
  <div className={`field${className ? ` ${className}` : ""}`}>
    <label className="field__label" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
    {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
  </div>
);

export const ChannelSelect = ({
  value,
  onChange,
  voice = false,
  emptyLabel,
  invalid,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  voice?: boolean;
  emptyLabel?: string;
  invalid?: boolean;
  ariaLabel?: string;
}) => {
  const { t } = useT();
  const meta = useServerMeta();
  const list = voice ? meta.voiceChannels : meta.channels;
  const options = list.map((c) => ({ value: c.id, label: c.name }));
  // Keep an unknown saved id visible instead of showing an empty field.
  if (value && !list.some((c) => c.id === value)) options.unshift({ value, label: t("field.unknownChannel", { id: value }) });
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={t(meta.loading ? "field.loadingChannels" : voice ? "field.pickVoice" : "field.pickChannel")}
      emptyLabel={emptyLabel}
      invalid={invalid}
      ariaLabel={ariaLabel ?? t("field.channel")}
    />
  );
};

export const RoleSelect = ({
  value,
  onChange,
  emptyLabel,
  invalid,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
  invalid?: boolean;
  ariaLabel?: string;
}) => {
  const { t } = useT();
  const meta = useServerMeta();
  const options = meta.roles.map((r) => ({ value: r.id, label: r.name }));
  if (value && !meta.roles.some((r) => r.id === value)) options.unshift({ value, label: t("field.unknownRole", { id: value }) });
  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={t(meta.loading ? "field.loadingRoles" : "field.pickRole")}
      emptyLabel={emptyLabel}
      invalid={invalid}
      ariaLabel={ariaLabel ?? t("field.role")}
    />
  );
};

/** Several values as removable chips + a search box to add more. */
export const MultiSelectChips = ({
  values,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel: string;
}) => {
  const { t } = useT();
  const labelOf = new Map(options.map((o) => [o.value, o.label]));
  const available = options.filter((o) => !values.includes(o.value));
  return (
    <div className="stack" style={{ gap: 8 }}>
      {values.length ? (
        <div className="chips">
          {values.map((value) => (
            <span key={value} className="chip">
              {labelOf.get(value) ?? value}
              <button type="button" aria-label={t("field.remove", { name: labelOf.get(value) ?? value })} onClick={() => onChange(values.filter((v) => v !== value))}>
                <Icon name="close" size="sm" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Select
        value=""
        resetOnPick
        onChange={(value) => value && onChange([...values, value])}
        options={available}
        placeholder={placeholder ?? t("field.add")}
        ariaLabel={ariaLabel}
      />
    </div>
  );
};

export const TextInput = ({
  value,
  onChange,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
}) => {
  const fallbackId = useId();
  return <input id={rest.id ?? fallbackId} className="input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
};

type TextAreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({ value, onChange, ...rest }, ref) => (
  <textarea ref={ref} className="textarea" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
));
TextArea.displayName = "TextArea";

export const ColorInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
  <div className="row" style={{ flexWrap: "nowrap" }}>
    <input type="color" className="input input--color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#5865f2"} onChange={(e) => onChange(e.target.value)} aria-label={label} />
    <input className="input mono" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (hex)`} maxLength={7} />
  </div>
);

// 0 = Monday, like the bot. 1 Jan 2024 was a Monday.
const dayName = (index: number, weekday: "long" | "short") =>
  new Date(2024, 0, 1 + index).toLocaleDateString(localeOf(), { weekday });
export const dayLong = (index: number) => dayName(index, "long");
export const dayShort = (index: number) => dayName(index, "short");
const WEEK = [0, 1, 2, 3, 4, 5, 6];

/** Weekday picker as a row of buttons (0 = Monday, like the bot). */
export const DaySelect = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  const { t } = useT();
  return (
  <div className="day-select" role="radiogroup" aria-label={t("field.dayOfWeek")}>
    {WEEK.map((index) => (
      <button
        key={index}
        type="button"
        role="radio"
        aria-checked={value === index}
        title={dayLong(index)}
        className={`day-select__day${value === index ? " active" : ""}`}
        onClick={() => onChange(index)}
      >
        {dayShort(index)}
      </button>
    ))}
  </div>
  );
};
