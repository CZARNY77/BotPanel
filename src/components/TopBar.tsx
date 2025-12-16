import { ReactNode } from "react";

type TopBarProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.25rem] text-accent-300/80">ConqBot</p>
        <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
        {subtitle && <p className="text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
