import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  iconBg,
  iconColor,
  detail,
  href,
}: {
  label: string;
  value: string;
  /** Real period-over-period change only; omitted when there is no source for it. */
  change?: string;
  detail: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] transition-all hover:shadow-[0_8px_28px_#15223d0d] hover:border-[#ccd7ea]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-[#8896aa]">{label}</span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]" style={{ background: iconBg, color: iconColor }}>
          <Icon size={20} strokeWidth={2.2} />
        </span>
      </div>
      <div className="mt-1 text-[30px] font-extrabold tracking-[-0.045em] text-[#16233d] sm:text-[32px]">{value}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        {change && (
          <span className="inline-flex items-center gap-0.5 rounded-md bg-[#eaf9f0] px-1.5 py-1 font-bold text-[#1ca569]">
            <ArrowUpRight size={13} />{change}
          </span>
        )}
        <span className="text-[#a1adbd]">{detail}</span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

