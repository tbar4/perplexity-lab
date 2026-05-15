import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  Label as RLabel,
} from "recharts";
import {
  METHODS,
  BENCHMARKS,
  CONVERGENCE_CURVES,
  AXIS_LABELS,
  type TradeoffAxis,
  type Paradigm,
  type Method,
} from "@/data/papers";
import { Logo } from "@/components/Logo";
import { ParadigmBadge, paradigmColor } from "@/components/ParadigmBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Moon,
  Sun,
  ExternalLink,
  GitBranch,
  Cpu,
  Gauge,
  Target,
  Zap,
  Scale,
  Brain,
  X,
} from "lucide-react";

const PARADIGM_FILTERS: { id: Paradigm | "all"; label: string }[] = [
  { id: "all", label: "All paradigms" },
  { id: "transformer", label: "Transformer" },
  { id: "rl", label: "RL" },
  { id: "hybrid", label: "Hybrid" },
];

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);
  return { dark, setDark };
}

/* ============================================================
   CHART TOOLTIP — uniform styling
============================================================ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-card-border bg-popover/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
      {label !== undefined && (
        <div className="text-muted-foreground mb-1.5 tabular">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: p.color || p.fill }}
            />
            <span className="text-foreground">{p.name}</span>
            <span className="ml-auto tabular text-foreground font-medium">
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   1. HEADER STRIP
============================================================ */
function Header({
  dark,
  setDark,
  paradigm,
  setParadigm,
}: {
  dark: boolean;
  setDark: (v: boolean) => void;
  paradigm: Paradigm | "all";
  setParadigm: (p: Paradigm | "all") => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-card-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-4 px-5 h-14">
        <div className="flex items-center gap-2.5 text-foreground">
          <Logo className="h-7 w-7 text-primary" />
          <div className="leading-tight">
            <div className="font-semibold text-[15px] tracking-tight">
              Planning Lab
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground tabular">
              RL × Transformer Bench
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-4 text-[11px] tabular text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live · {METHODS.length} methods · {BENCHMARKS.length} benchmarks</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 border border-card-border rounded-md p-0.5 bg-card">
            {PARADIGM_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setParadigm(f.id)}
                data-testid={`filter-paradigm-${f.id}`}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-[5px] transition-colors ${
                  paradigm === f.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover-elevate"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark(!dark)}
            data-testid="button-theme"
            className="h-9 w-9"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   2. HERO STATS
============================================================ */
function HeroStats({ paradigm }: { paradigm: Paradigm | "all" }) {
  const stats = [
    {
      label: "Best Sokoban solve",
      value: "93.7%",
      sub: "Searchformer · Meta FAIR 2024",
      icon: Brain,
      tone: "transformer" as Paradigm,
    },
    {
      label: "Search-step reduction vs A*",
      value: "−45.5%",
      sub: "Dualformer slow mode",
      icon: GitBranch,
      tone: "transformer" as Paradigm,
    },
    {
      label: "Atari 100k mean HN",
      value: "194.3%",
      sub: "EfficientZero · 2hr gameplay",
      icon: Zap,
      tone: "hybrid" as Paradigm,
    },
    {
      label: "Atari 200M median",
      value: "731%",
      sub: "MuZero · DeepMind",
      icon: Target,
      tone: "hybrid" as Paradigm,
    },
    {
      label: "Data vs DQN-200M",
      value: "500×",
      sub: "less, same score · EfficientZero",
      icon: Gauge,
      tone: "rl" as Paradigm,
    },
  ];
  const filtered =
    paradigm === "all" ? stats : stats.filter((s) => s.tone === paradigm);
  const show = filtered.length ? filtered : stats;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {show.map((s, i) => (
        <div
          key={s.label}
          className="fade-up relative overflow-hidden rounded-lg border border-card-border bg-card p-4"
          style={{ animationDelay: `${i * 40}ms` }}
          data-testid={`kpi-${s.label}`}
        >
          <div
            className="absolute inset-x-0 top-0 h-0.5"
            style={{ background: paradigmColor(s.tone) }}
          />
          <div className="flex items-start justify-between mb-2">
            <s.icon
              className="h-4 w-4"
              style={{ color: paradigmColor(s.tone) }}
            />
            <ParadigmBadge paradigm={s.tone} />
          </div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            {s.label}
          </div>
          <div className="text-2xl font-semibold tabular text-foreground leading-none">
            {s.value}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 line-clamp-1">
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   3. PARADIGM-AT-A-GLANCE COMPARISON
============================================================ */
function ParadigmCompare() {
  const rows = [
    {
      axis: "Training signal",
      rl: "Reward / value bootstrapping",
      tr: "Next-token cross-entropy on search traces",
      hy: "Reward + tree-search policy targets",
    },
    {
      axis: "Planning style",
      rl: "Implicit in policy / world model",
      tr: "Explicit serialized search in tokens",
      hy: "Explicit MCTS at inference",
    },
    {
      axis: "Sample efficiency",
      rl: "Low → high (DreamerV3, EfficientZero)",
      tr: "High when traces available",
      hy: "Highest at low data (EfficientZero)",
    },
    {
      axis: "Inference cost",
      rl: "Cheap (forward pass)",
      tr: "Expensive (autoregressive trace)",
      hy: "Very expensive (MCTS rollouts)",
    },
    {
      axis: "Transfer to new domains",
      rl: "Fixed HP across domains (Dreamer)",
      tr: "Generalizes via pretraining + FT",
      hy: "Strong within game families",
    },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-card-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Paradigm at a glance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Three families, three planning philosophies
          </p>
        </div>
        <Scale className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-[160px_1fr_1fr_1fr] text-xs">
        <div className="px-4 py-2.5 bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-card-border">
          Dimension
        </div>
        <div className="px-4 py-2.5 bg-[hsl(var(--chart-2)/0.08)] border-b border-card-border flex items-center gap-2">
          <ParadigmBadge paradigm="rl" />
          <span className="font-medium">Reinforcement learning</span>
        </div>
        <div className="px-4 py-2.5 bg-[hsl(var(--chart-1)/0.08)] border-b border-card-border flex items-center gap-2">
          <ParadigmBadge paradigm="transformer" />
          <span className="font-medium">Next-token transformer</span>
        </div>
        <div className="px-4 py-2.5 bg-[hsl(var(--chart-3)/0.08)] border-b border-card-border flex items-center gap-2">
          <ParadigmBadge paradigm="hybrid" />
          <span className="font-medium">Hybrid (MCTS+NN)</span>
        </div>
        {rows.map((r, i) => (
          <div className="contents" key={r.axis}>
            <div
              className={`px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30 ${
                i < rows.length - 1 ? "border-b border-card-border" : ""
              }`}
            >
              {r.axis}
            </div>
            <div className={`px-4 py-3 text-foreground ${i < rows.length - 1 ? "border-b border-card-border" : ""}`}>
              {r.rl}
            </div>
            <div className={`px-4 py-3 text-foreground ${i < rows.length - 1 ? "border-b border-card-border" : ""}`}>
              {r.tr}
            </div>
            <div className={`px-4 py-3 text-foreground ${i < rows.length - 1 ? "border-b border-card-border" : ""}`}>
              {r.hy}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   4. CONVERGENCE CURVES (log-X)
============================================================ */
function ConvergencePanel({ paradigm }: { paradigm: Paradigm | "all" }) {
  const data = useMemo(() => {
    // pivot curves into a wide table keyed by step
    const steps = [0.01, 0.1, 1, 10, 50, 200];
    return steps.map((s) => {
      const row: any = { steps: s };
      for (const c of CONVERGENCE_CURVES) {
        if (paradigm === "all" || c.paradigm === paradigm) {
          row[c.method] =
            c.points.find((p) => p.steps === s)?.score ?? null;
        }
      }
      return row;
    });
  }, [paradigm]);

  const visible = CONVERGENCE_CURVES.filter(
    (c) => paradigm === "all" || c.paradigm === paradigm
  );

  return (
    <div className="rounded-lg border border-card-border bg-card p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Convergence on Atari (human-normalized)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Score vs environment steps · log-X · anchored to published checkpoints
          </p>
        </div>
        <a
          href="https://arxiv.org/abs/2111.00210"
          target="_blank"
          rel="noopener"
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          sources <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 6, right: 12, bottom: 6, left: -10 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              dataKey="steps"
              scale="log"
              domain={[0.01, 200]}
              ticks={[0.01, 0.1, 1, 10, 50, 200]}
              tickFormatter={(v) => (v >= 1 ? `${v}M` : `${(v * 1000) | 0}k`)}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            >
              <RLabel value="Environment steps" position="insideBottom" offset={-2} fill="hsl(var(--muted-foreground))" fontSize={10} />
            </XAxis>
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
            />
            {visible.map((c) => {
              const stroke = `hsl(${c.color})`;
              return (
                <Line
                  key={c.method}
                  type="monotone"
                  dataKey={c.method}
                  stroke={stroke}
                  strokeWidth={2}
                  dot={{ r: 2.5, strokeWidth: 0, fill: stroke }}
                  activeDot={{ r: 4 }}
                  isAnimationActive
                  animationDuration={700}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-muted-foreground mt-2 tabular">
        Sources: Ye et al. 2021 · Schrittwieser et al. 2020 · Hafner et al. 2023 · Hessel et al. 2017
      </div>
    </div>
  );
}

/* ============================================================
   5. RADAR — TRADE-OFF FINGERPRINT
============================================================ */
function RadarPanel({
  paradigm,
  selected,
  setSelected,
}: {
  paradigm: Paradigm | "all";
  selected: string[];
  setSelected: (ids: string[]) => void;
}) {
  const candidates = METHODS.filter(
    (m) => paradigm === "all" || m.paradigm === paradigm
  );
  const visible = METHODS.filter((m) => selected.includes(m.id));

  const data = useMemo(() => {
    const axes = Object.keys(AXIS_LABELS) as TradeoffAxis[];
    return axes.map((a) => {
      const row: any = { axis: AXIS_LABELS[a] };
      for (const m of visible) row[m.name] = m.scores[a];
      return row;
    });
  }, [visible]);

  function toggle(id: string) {
    if (selected.includes(id)) setSelected(selected.filter((s) => s !== id));
    else if (selected.length < 4) setSelected([...selected, id]);
  }

  return (
    <div className="rounded-lg border border-card-border bg-card p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Trade-off fingerprint
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pick up to 4 methods · all axes normalized 0–100
          </p>
        </div>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-1 mb-3 max-h-[58px] overflow-y-auto pr-1">
        {candidates.map((m) => {
          const on = selected.includes(m.id);
          const c = paradigmColor(m.paradigm);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              data-testid={`radar-toggle-${m.id}`}
              className={`text-[11px] px-2 py-0.5 rounded border tabular transition-colors ${
                on
                  ? "text-white"
                  : "text-foreground bg-card hover-elevate border-card-border"
              }`}
              style={
                on
                  ? {
                      background: c,
                      borderColor: c,
                    }
                  : {}
              }
            >
              {m.name}
            </button>
          );
        })}
      </div>
      <div className="h-[330px]">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            {visible.map((m) => {
              const c = paradigmColor(m.paradigm);
              return (
                <Radar
                  key={m.id}
                  name={m.name}
                  dataKey={m.name}
                  stroke={c}
                  fill={c}
                  fillOpacity={0.22}
                  strokeWidth={1.5}
                  isAnimationActive
                  animationDuration={600}
                />
              );
            })}
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ============================================================
   6. BENCHMARK BARS
============================================================ */
function BenchmarkPanel() {
  const [active, setActive] = useState(BENCHMARKS[0].id);
  const bench = BENCHMARKS.find((b) => b.id === active)!;
  const data = bench.rows.map((r) => ({
    ...r,
    fill: paradigmColor(r.paradigm),
  }));

  return (
    <div className="rounded-lg border border-card-border bg-card p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            Benchmark head-to-head
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{bench.subtitle}</p>
        </div>
        <Select value={active} onValueChange={setActive}>
          <SelectTrigger
            className="h-8 w-[200px] text-xs"
            data-testid="select-benchmark"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BENCHMARKS.map((b) => (
              <SelectItem key={b.id} value={b.id} className="text-xs">
                {b.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2 tabular">
        {bench.metric} · {bench.higherIsBetter ? "higher is better ↑" : "lower is better ↓"}
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 56, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              dataKey="method"
              type="category"
              width={160}
              tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              isAnimationActive
              animationDuration={650}
              label={{
                position: "right",
                fill: "hsl(var(--foreground))",
                fontSize: 11,
                fontFamily: "JetBrains Mono",
                formatter: (v: number) => `${v}${bench.rows[0].unit.includes("%") ? "%" : ""}`,
              }}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
        <span className="tabular">Source: {bench.sourceLabel}</span>
        <a
          href={bench.sourceUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          arXiv <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}

/* ============================================================
   7. SAMPLE EFFICIENCY × FINAL PERFORMANCE SCATTER
============================================================ */
function TradeoffScatter({ paradigm, onPick }: { paradigm: Paradigm | "all"; onPick: (id: string) => void }) {
  const visible = METHODS.filter(
    (m) => paradigm === "all" || m.paradigm === paradigm
  );
  const data = visible.map((m) => ({
    id: m.id,
    name: m.name,
    paradigm: m.paradigm,
    x: m.scores.sampleEfficiency,
    y: m.scores.finalPerformance,
    z: 100 - m.scores.inferenceCost + 30, // bubble size: bigger = more expensive
    fill: paradigmColor(m.paradigm),
  }));

  return (
    <div className="rounded-lg border border-card-border bg-card p-4 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Sample efficiency × Final performance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bubble size = inference cost (bigger = pricier)
          </p>
        </div>
        <Cpu className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 6, right: 16, bottom: 24, left: 4 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            >
              <RLabel value="Sample efficiency →" position="insideBottom" offset={-12} fill="hsl(var(--muted-foreground))" fontSize={10} />
            </XAxis>
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              stroke="hsl(var(--border))"
            >
              <RLabel value="Final perf →" angle={-90} position="insideLeft" offset={14} fill="hsl(var(--muted-foreground))" fontSize={10} />
            </YAxis>
            <ZAxis dataKey="z" range={[80, 360]} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-md border border-card-border bg-popover/95 backdrop-blur px-3 py-2 shadow-lg text-xs">
                    <div className="font-medium text-foreground mb-1">
                      {payload[0].payload.name}
                    </div>
                    <div className="text-muted-foreground tabular">
                      Sample-eff {payload[0].payload.x} · Final {payload[0].payload.y}
                    </div>
                  </div>
                ) : null
              }
            />
            <Scatter
              data={data}
              isAnimationActive
              animationDuration={700}
              onClick={(p: any) => onPick(p.id)}
              cursor="pointer"
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.fill} fillOpacity={0.55} stroke={d.fill} strokeWidth={1.5} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-1">
        {data.map((d) => (
          <button
            key={d.id}
            onClick={() => onPick(d.id)}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: d.fill }} />
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   8. METHOD TABLE + DETAIL DRAWER
============================================================ */
function MethodTable({
  paradigm,
  onPick,
  active,
}: {
  paradigm: Paradigm | "all";
  onPick: (id: string) => void;
  active: string | null;
}) {
  const rows = METHODS.filter(
    (m) => paradigm === "all" || m.paradigm === paradigm
  ).sort((a, b) => b.scores.finalPerformance - a.scores.finalPerformance);

  return (
    <div className="rounded-lg border border-card-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Method index</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rows.length} methods · click any row for details
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Method</th>
              <th className="text-left px-3 py-2 font-medium">Family</th>
              <th className="text-left px-3 py-2 font-medium">Year</th>
              <th className="text-right px-3 py-2 font-medium tabular">Sample eff</th>
              <th className="text-right px-3 py-2 font-medium tabular">Converge</th>
              <th className="text-right px-3 py-2 font-medium tabular">Final</th>
              <th className="text-right px-3 py-2 font-medium tabular">Generalize</th>
              <th className="text-right px-3 py-2 font-medium tabular">Inf. cheap</th>
              <th className="px-3 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.id}
                onClick={() => onPick(m.id)}
                data-testid={`row-method-${m.id}`}
                className={`border-t border-card-border cursor-pointer hover-elevate ${
                  active === m.id ? "bg-muted/40" : ""
                }`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <ParadigmBadge paradigm={m.paradigm} />
                    <span className="font-medium text-foreground">{m.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{m.family}</td>
                <td className="px-3 py-2.5 tabular text-muted-foreground">{m.year}</td>
                <ScoreCell v={m.scores.sampleEfficiency} color={paradigmColor(m.paradigm)} />
                <ScoreCell v={m.scores.convergenceSpeed} color={paradigmColor(m.paradigm)} />
                <ScoreCell v={m.scores.finalPerformance} color={paradigmColor(m.paradigm)} />
                <ScoreCell v={m.scores.generalization} color={paradigmColor(m.paradigm)} />
                <ScoreCell v={m.scores.inferenceCost} color={paradigmColor(m.paradigm)} />
                <td className="px-3 py-2.5">
                  <a
                    href={m.arxiv}
                    target="_blank"
                    rel="noopener"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreCell({ v, color }: { v: number; color: string }) {
  return (
    <td className="px-3 py-2.5 text-right">
      <div className="inline-flex items-center gap-2">
        <div className="hidden md:block w-14 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{ width: `${v}%`, background: color }}
          />
        </div>
        <span className="tabular text-foreground">{v}</span>
      </div>
    </td>
  );
}

function DetailDrawer({
  method,
  onClose,
}: {
  method: Method | null;
  onClose: () => void;
}) {
  if (!method) return null;
  const c = paradigmColor(method.paradigm);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end fade-up"
      style={{ animationDuration: "0.25s" }}
    >
      <button
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="close"
        data-testid="drawer-backdrop"
      />
      <div className="relative w-full sm:w-[440px] h-full bg-card border-l border-card-border overflow-y-auto">
        <div
          className="h-1"
          style={{ background: c }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <ParadigmBadge paradigm={method.paradigm} className="mb-2" />
              <h2 className="text-lg font-semibold text-foreground">
                {method.name}
              </h2>
              <p className="text-xs text-muted-foreground tabular">
                {method.family} · {method.org} · {method.year}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              data-testid="button-close-drawer"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-foreground/85 leading-relaxed mb-5">
            {method.blurb}
          </p>
          <div className="space-y-2 mb-5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Reported metrics
            </div>
            {method.rawMetrics.map((r, i) => (
              <div
                key={i}
                className="rounded-md border border-card-border bg-muted/30 p-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-foreground">{r.label}</span>
                  <span className="text-sm font-semibold tabular text-foreground whitespace-nowrap">
                    {r.value}
                  </span>
                </div>
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1"
                >
                  {r.source}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Score profile
          </div>
          <div className="space-y-1.5">
            {(Object.keys(AXIS_LABELS) as TradeoffAxis[]).map((k) => (
              <div key={k} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-36">
                  {AXIS_LABELS[k]}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${method.scores[k]}%`,
                      background: c,
                    }}
                  />
                </div>
                <span className="text-xs tabular text-foreground w-8 text-right">
                  {method.scores[k]}
                </span>
              </div>
            ))}
          </div>
          <a
            href={method.arxiv}
            target="_blank"
            rel="noopener"
            className="mt-6 inline-flex items-center gap-2 text-xs text-primary hover:underline"
            data-testid="link-arxiv"
          >
            Read on arXiv
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT DASHBOARD
============================================================ */
export default function Dashboard() {
  const { dark, setDark } = useDarkMode();
  const [paradigm, setParadigm] = useState<Paradigm | "all">("all");
  const [selected, setSelected] = useState<string[]>([
    "searchformer",
    "muzero",
    "dreamerv3",
    "decision-transformer",
  ]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeMethod = activeId
    ? METHODS.find((m) => m.id === activeId) ?? null
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        <Header
          dark={dark}
          setDark={setDark}
          paradigm={paradigm}
          setParadigm={setParadigm}
        />
        <main className="max-w-[1400px] mx-auto px-5 py-6 space-y-6">
          {/* Title row */}
          <div className="space-y-1 fade-up">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground tabular">
              v0.1 · curated from arXiv 2017–2026
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              RL vs Transformer Next-Token Prediction for Strategic Planning
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              A side-by-side look at how reinforcement learning and autoregressive
              transformers attack pathfinding, puzzles, and game-tree planning.
              Numbers are pulled from primary papers; toggle paradigms to filter
              every panel.
            </p>
          </div>

          <HeroStats paradigm={paradigm} />

          <ParadigmCompare />

          <div className="grid lg:grid-cols-2 gap-4">
            <ConvergencePanel paradigm={paradigm} />
            <RadarPanel
              paradigm={paradigm}
              selected={selected}
              setSelected={setSelected}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <BenchmarkPanel />
            <TradeoffScatter paradigm={paradigm} onPick={setActiveId} />
          </div>

          <MethodTable
            paradigm={paradigm}
            onPick={setActiveId}
            active={activeId}
          />

          <footer className="pt-6 pb-10 border-t border-card-border text-[11px] text-muted-foreground space-y-1">
            <div className="tabular">
              Numbers cited from primary papers. Convergence curves are anchored to
              published checkpoints with smooth interpolation between them.
            </div>
            <div>
              Selected sources:{" "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/2402.14083" target="_blank" rel="noopener">Searchformer</a>{" · "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/2410.09918" target="_blank" rel="noopener">Dualformer</a>{" · "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/2404.03683" target="_blank" rel="noopener">Stream of Search</a>{" · "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/2106.01345" target="_blank" rel="noopener">Decision Transformer</a>{" · "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/1911.08265" target="_blank" rel="noopener">MuZero</a>{" · "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/2111.00210" target="_blank" rel="noopener">EfficientZero</a>{" · "}
              <a className="hover:text-foreground underline-offset-2 hover:underline" href="https://arxiv.org/abs/2301.04104" target="_blank" rel="noopener">DreamerV3</a>
            </div>
          </footer>
        </main>
        <DetailDrawer method={activeMethod} onClose={() => setActiveId(null)} />
      </div>
    </TooltipProvider>
  );
}
