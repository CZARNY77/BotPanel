import { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: "success" | "warning" | "info";
};

const toneMap: Record<NonNullable<StatCardProps["tone"]>, string> = {
  success: "from-success-500/20 to-accent-500/10 text-white",
  warning: "from-warning-500/25 to-accent-500/10 text-white",
  info: "from-accent-500/20 to-surface-700 text-accent-100"
};

export default function StatCard({ label, value, icon, tone = "info" }: StatCardProps) {
  return (
    <div className={`glass-panel rounded-2xl p-4 shadow-card bg-gradient-to-br ${toneMap[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {icon && (
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
