// Date as a graphic: big day number + short month (dates are shown this way everywhere).

/** dd.mm.yyyy (bot format) -> parts */
export const dateParts = (date: string) => {
  const [day, month, year] = date.split(".").map(Number);
  if (!day || !month || !year) return { day: "–", month: "", weekday: "" };
  const d = new Date(year, month - 1, day);
  return {
    day: String(day),
    month: d.toLocaleString("en-GB", { month: "short" }),
    weekday: d.toLocaleString("en-GB", { weekday: "short" }),
  };
};

/** ISO timestamp -> parts */
export const isoParts = (iso: string | null | undefined) => {
  if (!iso) return { day: "–", month: "", time: "" };
  const d = new Date(iso);
  return {
    day: String(d.getDate()),
    month: d.toLocaleString("en-GB", { month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

export const DateTile = ({ day, month, muted = false }: { day: string; month: string; muted?: boolean }) => (
  <div className={`date-tile${muted ? " date-tile--muted" : ""}`}>
    <span className="date-tile__day">{day}</span>
    <span className="date-tile__month">{month}</span>
  </div>
);
