import { cn } from "@/lib/utils";
import type { Paradigm } from "@/data/papers";

const COPY: Record<Paradigm, { label: string; cls: string }> = {
  transformer: {
    label: "Transformer",
    cls: "bg-[hsl(var(--chart-1)/0.15)] text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1)/0.4)]",
  },
  rl: {
    label: "RL",
    cls: "bg-[hsl(var(--chart-2)/0.15)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/0.4)]",
  },
  hybrid: {
    label: "Hybrid",
    cls: "bg-[hsl(var(--chart-3)/0.15)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.4)]",
  },
};

export function ParadigmBadge({
  paradigm,
  className,
}: {
  paradigm: Paradigm;
  className?: string;
}) {
  const c = COPY[paradigm];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider tabular",
        c.cls,
        className
      )}
      data-testid={`badge-paradigm-${paradigm}`}
    >
      {c.label}
    </span>
  );
}

// Returns a usable CSS color string (already wrapped in hsl()).
export function paradigmColor(p: Paradigm) {
  return p === "transformer"
    ? "hsl(var(--chart-1))"
    : p === "rl"
    ? "hsl(var(--chart-2))"
    : "hsl(var(--chart-3))";
}

// Translucent fill variant.
export function paradigmColorAlpha(p: Paradigm, a = 0.18) {
  return p === "transformer"
    ? `hsl(var(--chart-1) / ${a})`
    : p === "rl"
    ? `hsl(var(--chart-2) / ${a})`
    : `hsl(var(--chart-3) / ${a})`;
}
