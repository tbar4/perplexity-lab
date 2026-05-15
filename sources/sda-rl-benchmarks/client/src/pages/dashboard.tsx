import { useMemo, useState } from "react";
import {
  BENCHMARKS,
  DATA_TYPES,
  MODALITIES,
  ACCESS_LEVELS,
  CATEGORIES,
  RSO_BUCKETS,
  rsoMatchesBucket,
  type Benchmark,
  type DataType,
  type SensorModality,
  type Access,
  type Category,
} from "@/data/benchmarks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search,
  Sun,
  Moon,
  ExternalLink,
  Github,
  X,
  GitCompareArrows,
  ArrowUpDown,
  Satellite,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type SortKey = "name" | "year" | "category" | "dataType" | "access";

export default function Dashboard() {
  const { theme, toggle } = useTheme();

  // Filters
  const [query, setQuery] = useState("");
  const [dataTypes, setDataTypes] = useState<Set<DataType>>(new Set());
  const [modalities, setModalities] = useState<Set<SensorModality>>(new Set());
  const [accessLevels, setAccessLevels] = useState<Set<Access>>(new Set());
  const [categories, setCategories] = useState<Set<Category>>(new Set());
  const [rsoBuckets, setRsoBuckets] = useState<Set<string>>(new Set());

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("year");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Compare selection
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);

  // Detail panel
  const [detailId, setDetailId] = useState<string | null>(null);

  const toggleInSet = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const clearFilters = () => {
    setQuery("");
    setDataTypes(new Set());
    setModalities(new Set());
    setAccessLevels(new Set());
    setCategories(new Set());
    setRsoBuckets(new Set());
  };

  const filtered = useMemo(() => {
    let result = BENCHMARKS.filter((b) => {
      if (query) {
        const q = query.toLowerCase();
        const hay =
          `${b.name} ${b.paper} ${b.authors} ${b.summary} ${b.venue}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dataTypes.size && !dataTypes.has(b.dataType)) return false;
      if (modalities.size && !modalities.has(b.modality)) return false;
      if (accessLevels.size && !accessLevels.has(b.access)) return false;
      if (categories.size && !categories.has(b.category)) return false;
      if (rsoBuckets.size) {
        const matchesAny = Array.from(rsoBuckets).some((label) => {
          const bucket = RSO_BUCKETS.find((rb) => rb.label === label);
          return bucket && rsoMatchesBucket(b.rsoCount, bucket);
        });
        if (!matchesAny) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "year") cmp = a.year - b.year;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else if (sortKey === "dataType") cmp = a.dataType.localeCompare(b.dataType);
      else if (sortKey === "access") cmp = a.access.localeCompare(b.access);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [query, dataTypes, modalities, accessLevels, categories, rsoBuckets, sortKey, sortDir]);

  const activeFilterCount =
    dataTypes.size +
    modalities.size +
    accessLevels.size +
    categories.size +
    rsoBuckets.size +
    (query ? 1 : 0);

  const compareList = BENCHMARKS.filter((b) => compareIds.has(b.id));
  const detail = detailId ? BENCHMARKS.find((b) => b.id === detailId) : null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleCompare = (id: string) => {
    const next = new Set(compareIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 3) next.add(id);
    setCompareIds(next);
  };

  // Stats for header
  const stats = useMemo(() => {
    const open = BENCHMARKS.filter(
      (b) => b.access === "Open code" || b.access === "Open code + open data" || b.access === "Open data",
    ).length;
    const real = BENCHMARKS.filter((b) => b.dataType === "Real" || b.dataType === "Hybrid").length;
    return { total: BENCHMARKS.length, open, real };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-card-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-base font-semibold leading-tight">SDA·RL Benchmark Index</h1>
              <p className="text-xs text-muted-foreground leading-tight font-mono">
                Space Domain Awareness · Reinforcement Learning · {BENCHMARKS.length} benchmarks indexed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareOpen(true)}
              disabled={compareIds.size < 2}
              data-testid="button-open-compare"
              className="gap-2"
            >
              <GitCompareArrows className="h-4 w-4" />
              Compare
              {compareIds.size > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 font-mono text-[10px]">
                  {compareIds.size}/3
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero band */}
      <section className="relative border-b border-card-border bg-grid">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-2 space-y-3">
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest">
                Live comparison · curated from primary sources
              </Badge>
              <h2 className="text-xl font-semibold leading-tight md:text-xl">
                A single view of every reinforcement-learning benchmark in the SDA literature.
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Filter by dataset type, real vs. simulated data, RSO count, sensor modality, and code or
                data access. Sources include narrow-FOV SSA environments, OrbitZoo, NORAD TLE-driven
                agents, Space-Track ephemeris pipelines, Starlink validations, and adjacent benchmarks
                like BSK-RL, KSPDG, and SPLID.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
              <StatCell label="Benchmarks" value={stats.total} />
              <StatCell label="Open code or data" value={stats.open} />
              <StatCell label="Use real data" value={stats.real} />
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-b border-card-border bg-sidebar">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search benchmarks, papers, authors…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 font-mono text-xs"
                data-testid="input-search"
              />
            </div>

            <FilterMenu
              label="Category"
              options={CATEGORIES}
              selected={categories}
              onToggle={(v) => toggleInSet(categories, v, setCategories)}
            />
            <FilterMenu
              label="Data type"
              options={DATA_TYPES}
              selected={dataTypes}
              onToggle={(v) => toggleInSet(dataTypes, v, setDataTypes)}
            />
            <FilterMenu
              label="RSO count"
              options={RSO_BUCKETS.map((b) => b.label)}
              selected={rsoBuckets}
              onToggle={(v) => toggleInSet(rsoBuckets, v, setRsoBuckets)}
            />
            <FilterMenu
              label="Sensor modality"
              options={MODALITIES}
              selected={modalities}
              onToggle={(v) => toggleInSet(modalities, v, setModalities)}
            />
            <FilterMenu
              label="Access"
              options={ACCESS_LEVELS}
              selected={accessLevels}
              onToggle={(v) => toggleInSet(accessLevels, v, setAccessLevels)}
            />

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-xs"
                data-testid="button-clear-filters"
              >
                <X className="h-3.5 w-3.5" />
                Clear {activeFilterCount}
              </Button>
            )}

            <div className="ml-auto font-mono text-[11px] text-muted-foreground">
              {filtered.length}/{BENCHMARKS.length} shown
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        <Card className="overflow-hidden border-card-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-card-border bg-muted/40">
                <tr className="text-left">
                  <th className="w-10 px-3 py-3"></th>
                  <SortableHeader
                    label="Benchmark"
                    sortKey="name"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Year"
                    sortKey="year"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Category"
                    sortKey="category"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Data"
                    sortKey="dataType"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    RSOs / Agents
                  </th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Modality
                  </th>
                  <SortableHeader
                    label="Access"
                    sortKey="access"
                    activeKey={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Links
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="group border-b border-card-border/60 last:border-0 hover-elevate cursor-pointer"
                    onClick={() => setDetailId(b.id)}
                    data-testid={`row-benchmark-${b.id}`}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={compareIds.has(b.id)}
                        onCheckedChange={() => toggleCompare(b.id)}
                        disabled={!compareIds.has(b.id) && compareIds.size >= 3}
                        data-testid={`checkbox-compare-${b.id}`}
                        aria-label={`Add ${b.name} to compare`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium leading-tight" data-testid={`text-name-${b.id}`}>
                        {b.name}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground leading-snug">
                        {b.authors} · {b.venue}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{b.year}</td>
                    <td className="px-3 py-3 text-xs">
                      <Badge variant="outline" className="font-normal">
                        {b.category}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <DataTypePill type={b.dataType} />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{b.rsoLabel}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{b.modality}</td>
                    <td className="px-3 py-3">
                      <AccessPill access={b.access} />
                    </td>
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={b.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-1 text-muted-foreground hover:text-foreground hover-elevate"
                              data-testid={`link-paper-${b.id}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="left">Paper / page</TooltipContent>
                        </Tooltip>
                        {b.codeUrl && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={b.codeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded p-1 text-muted-foreground hover:text-foreground hover-elevate"
                                data-testid={`link-code-${b.id}`}
                              >
                                <Github className="h-3.5 w-3.5" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="left">Code / repo</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="mx-auto max-w-sm space-y-2">
                        <Search className="mx-auto h-6 w-6 text-muted-foreground" />
                        <p className="text-sm">No benchmarks match the current filters.</p>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-8 grid gap-4 text-xs text-muted-foreground md:grid-cols-2">
          <div>
            <div className="font-mono uppercase tracking-widest text-foreground mb-1.5">Sources</div>
            <p className="leading-relaxed">
              Compiled from arXiv, AMOS proceedings, AeroAstro MIT publications, NeurIPS posters, and
              the GitHub repositories of each benchmark. Every row links to its primary paper and, when
              available, the reference implementation. Last refreshed May 2026.
            </p>
          </div>
          <div>
            <div className="font-mono uppercase tracking-widest text-foreground mb-1.5">How to read</div>
            <p className="leading-relaxed">
              Click any row for full strengths / limitations / reproducibility notes. Use the checkboxes
              to stack up to three benchmarks for a side-by-side card view. Filters compose with AND
              across categories; within a category, options compose with OR.
            </p>
          </div>
        </div>
      </main>

      {/* Detail sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {detail && <DetailView b={detail} />}
        </SheetContent>
      </Sheet>

      {/* Compare dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4" />
              Side-by-side comparison
            </DialogTitle>
          </DialogHeader>
          <CompareView benchmarks={compareList} onRemove={(id) => toggleCompare(id)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* --------------------------- subcomponents --------------------------- */

function Logo() {
  return (
    <svg
      viewBox="0 0 28 28"
      className="h-7 w-7 text-primary"
      fill="none"
      aria-label="SDA·RL logo"
    >
      <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1" />
      <circle cx="14" cy="14" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
      <path d="M3 14 H 25" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <path d="M14 3 V 25" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <circle cx="22" cy="9" r="1.2" fill="currentColor" />
      <circle cx="7" cy="18" r="0.9" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-card-border bg-card px-4 py-3 rounded-md">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const isActive = sortKey === activeKey;
  return (
    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <button
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-foreground"
        data-testid={`sort-${sortKey}`}
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 transition-opacity ${isActive ? "opacity-100" : "opacity-30"}`}
          style={isActive && dir === "asc" ? { transform: "scaleY(-1)" } : undefined}
        />
      </button>
    </th>
  );
}

function FilterMenu<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  selected: Set<T>;
  onToggle: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="gap-2 text-xs"
        data-testid={`filter-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {label}
        {selected.size > 0 && (
          <Badge variant="secondary" className="h-4 px-1.5 font-mono text-[10px]">
            {selected.size}
          </Badge>
        )}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[220px] rounded-md border border-popover-border bg-popover p-1 shadow-md">
          {options.map((opt) => {
            const checked = selected.has(opt);
            return (
              <button
                key={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onToggle(opt);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover-elevate"
                data-testid={`filter-option-${opt}`}
              >
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border transition-colors ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-transparent"
                  }`}
                >
                  {checked && (
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                      <path d="M2 6.5L5 9L10 3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DataTypePill({ type }: { type: DataType }) {
  const map: Record<DataType, { bg: string; fg: string; dot: string }> = {
    Simulated: { bg: "bg-chart-2/10", fg: "text-chart-2", dot: "bg-chart-2" },
    Real: { bg: "bg-primary/15", fg: "text-primary", dot: "bg-primary" },
    Hybrid: { bg: "bg-chart-3/15", fg: "text-chart-3", dot: "bg-chart-3" },
  };
  const cls = map[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls.bg} ${cls.fg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cls.dot}`} />
      {type}
    </span>
  );
}

function AccessPill({ access }: { access: Access }) {
  const isOpen = access.startsWith("Open");
  const isPaperOnly = access === "Paper only";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        isOpen
          ? "border-primary/40 bg-primary/10 text-primary"
          : isPaperOnly
            ? "border-muted-foreground/20 bg-muted text-muted-foreground"
            : "border-chart-3/30 bg-chart-3/10 text-chart-3"
      }`}
    >
      {access}
    </span>
  );
}

function DetailView({ b }: { b: Benchmark }) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <div className="flex items-center gap-2">
          <Satellite className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="font-mono text-[10px]">
            {b.category}
          </Badge>
        </div>
        <SheetTitle className="text-xl leading-tight">{b.name}</SheetTitle>
        <p className="text-sm text-muted-foreground leading-snug">{b.paper}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {b.authors} · {b.venue} · {b.year}
        </p>
      </SheetHeader>

      <div className="flex flex-wrap gap-2">
        <DataTypePill type={b.dataType} />
        <AccessPill access={b.access} />
        <Badge variant="outline" className="font-normal">
          {b.modality}
        </Badge>
        <Badge variant="outline" className="font-mono font-normal">
          {b.rsoLabel}
        </Badge>
        {b.validatedAgainst && (
          <Badge variant="outline" className="font-normal border-primary/30 text-primary">
            Validated vs. {b.validatedAgainst}
          </Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed">{b.summary}</p>

      <div className="grid gap-4">
        <DetailBlock title="Strengths" items={b.strengths} accent="primary" />
        <DetailBlock title="Limitations" items={b.limitations} accent="muted" />
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Reproducibility
          </div>
          <p className="text-sm leading-relaxed">{b.reproducibility}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-card-border pt-4">
        <Button asChild variant="outline" size="sm" data-testid={`detail-link-paper-${b.id}`}>
          <a href={b.url} target="_blank" rel="noreferrer" className="gap-2">
            <ExternalLink className="h-3.5 w-3.5" />
            Open primary source
          </a>
        </Button>
        {b.codeUrl && (
          <Button asChild variant="outline" size="sm" data-testid={`detail-link-code-${b.id}`}>
            <a href={b.codeUrl} target="_blank" rel="noreferrer" className="gap-2">
              <Github className="h-3.5 w-3.5" />
              Code repository
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailBlock({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "primary" | "muted";
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span
              className={`mt-2 h-1 w-1 flex-shrink-0 rounded-full ${
                accent === "primary" ? "bg-primary" : "bg-muted-foreground/60"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareView({
  benchmarks,
  onRemove,
}: {
  benchmarks: Benchmark[];
  onRemove: (id: string) => void;
}) {
  if (benchmarks.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Select benchmarks from the table to compare them side-by-side.
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-h-[75vh] overflow-y-auto">
      {benchmarks.map((b) => (
        <Card key={b.id} className="space-y-3 border-card-border p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant="outline" className="mb-1.5 font-mono text-[10px]">
                {b.category}
              </Badge>
              <h3 className="font-semibold leading-tight">{b.name}</h3>
              <p className="text-xs text-muted-foreground">
                {b.authors} · {b.year}
              </p>
            </div>
            <button
              onClick={() => onRemove(b.id)}
              className="rounded p-1 text-muted-foreground hover-elevate"
              aria-label={`Remove ${b.name}`}
              data-testid={`button-compare-remove-${b.id}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <DataTypePill type={b.dataType} />
            <AccessPill access={b.access} />
          </div>

          <div className="space-y-2 text-xs">
            <CompareField label="RSOs/Agents" value={b.rsoLabel} />
            <CompareField label="Modality" value={b.modality} />
            {b.validatedAgainst && <CompareField label="Validated against" value={b.validatedAgainst} />}
          </div>

          <div>
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Strengths
            </div>
            <ul className="space-y-1 text-xs">
              {b.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Limitations
            </div>
            <ul className="space-y-1 text-xs">
              {b.limitations.slice(0, 3).map((s, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground/60" />
                  <span className="leading-snug">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              Reproducibility
            </div>
            <p className="text-xs leading-snug">{b.reproducibility}</p>
          </div>

          <div className="flex gap-2 border-t border-card-border pt-2">
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Paper
            </a>
            {b.codeUrl && (
              <a
                href={b.codeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Github className="h-3 w-3" />
                Code
              </a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function CompareField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-card-border/50 pb-1.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-right">{value}</span>
    </div>
  );
}
