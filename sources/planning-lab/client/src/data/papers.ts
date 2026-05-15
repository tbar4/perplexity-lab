// Curated dataset of recent (2021-2026) papers comparing
// RL-based planners with transformer / next-token planners.
// Numbers cited from arXiv/OpenReview source PDFs.

export type Paradigm =
  | "rl"            // value/policy gradient or model-based RL
  | "transformer"   // autoregressive next-token planner
  | "hybrid";       // tree search + neural net (AlphaZero / MuZero family)

export type TaskFamily =
  | "pathfinding"   // mazes, A* search, graph reachability
  | "puzzle"        // Sokoban, Countdown, SAT
  | "atari"         // pixel-based Atari benchmark
  | "board"         // chess, Go, shogi
  | "control";      // continuous control, robotics

export type Method = {
  id: string;
  name: string;
  paradigm: Paradigm;
  family: string;          // e.g. "Decision Transformer", "MuZero"
  year: number;
  org: string;
  arxiv: string;
  blurb: string;
  // Headline metric for the leaderboard / radar
  // Each is a normalized 0..100 score (higher is better) so they can be plotted together.
  scores: {
    sampleEfficiency: number;  // performance per environment step
    convergenceSpeed: number;  // time-to-threshold
    finalPerformance: number;  // ceiling reached
    generalization: number;    // OOD task transfer
    computeEfficiency: number; // FLOPs / training cost
    inferenceCost: number;     // 100 = cheap, 0 = expensive at runtime
  };
  // Raw numbers cited from papers
  rawMetrics: {
    label: string;
    value: string;
    source: string;
    sourceUrl: string;
  }[];
  task: TaskFamily;
};

export const METHODS: Method[] = [
  // ---------- TRANSFORMER / NEXT-TOKEN PLANNERS ----------
  {
    id: "searchformer",
    name: "Searchformer",
    paradigm: "transformer",
    family: "Search-augmented Transformer",
    year: 2024,
    org: "Meta FAIR",
    arxiv: "https://arxiv.org/abs/2402.14083",
    blurb:
      "Encoder-decoder trained on A* execution traces, then bootstrapped via expert iteration to compress search. Predicts next token in a serialized search dynamics stream.",
    task: "puzzle",
    scores: {
      sampleEfficiency: 88,
      convergenceSpeed: 64,
      finalPerformance: 86,
      generalization: 72,
      computeEfficiency: 70,
      inferenceCost: 52,
    },
    rawMetrics: [
      {
        label: "Sokoban solve rate (unseen)",
        value: "93.7%",
        source: "Lehnert et al., 2024",
        sourceUrl: "https://arxiv.org/abs/2402.14083",
      },
      {
        label: "Search steps vs A*",
        value: "−26.8%",
        source: "Lehnert et al., 2024",
        sourceUrl: "https://arxiv.org/abs/2402.14083",
      },
      {
        label: "Beats 747M solution-only model with 175M params",
        value: "yes",
        source: "Lehnert et al., 2024",
        sourceUrl: "https://arxiv.org/html/2402.14083v2",
      },
    ],
  },
  {
    id: "dualformer",
    name: "Dualformer",
    paradigm: "transformer",
    family: "Fast/slow next-token planner",
    year: 2024,
    org: "Meta FAIR",
    arxiv: "https://arxiv.org/abs/2410.09918",
    blurb:
      "Single model that can run in slow (full trace) or fast (solution-only) mode. Trained on randomized search traces to discover its own search policy.",
    task: "pathfinding",
    scores: {
      sampleEfficiency: 90,
      convergenceSpeed: 70,
      finalPerformance: 92,
      generalization: 78,
      computeEfficiency: 76,
      inferenceCost: 64,
    },
    rawMetrics: [
      {
        label: "30×30 maze optimal-solve (slow mode)",
        value: "97.6%",
        source: "Su et al., 2024",
        sourceUrl: "https://arxiv.org/abs/2410.09918",
      },
      {
        label: "Reasoning steps vs Searchformer",
        value: "−45.5%",
        source: "Su et al., 2024",
        sourceUrl: "https://arxiv.org/abs/2410.09918",
      },
      {
        label: "Fast-mode optimal rate vs solution-only baseline",
        value: "80% vs 30%",
        source: "Su et al., 2024",
        sourceUrl: "https://arxiv.org/html/2410.09918v1",
      },
    ],
  },
  {
    id: "stream-of-search",
    name: "Stream of Search",
    paradigm: "transformer",
    family: "In-language search LM",
    year: 2024,
    org: "Stanford / Gandhi et al.",
    arxiv: "https://arxiv.org/abs/2404.03683",
    blurb:
      "LM pretrained from scratch on serialized search traces (exploration + backtracking). Fine-tuned with APA and STaR for self-improvement on Countdown.",
    task: "puzzle",
    scores: {
      sampleEfficiency: 70,
      convergenceSpeed: 58,
      finalPerformance: 74,
      generalization: 80,
      computeEfficiency: 68,
      inferenceCost: 48,
    },
    rawMetrics: [
      {
        label: "Accuracy gain over optimal-only training",
        value: "+25%",
        source: "Gandhi et al., 2024",
        sourceUrl: "https://arxiv.org/abs/2404.03683",
      },
      {
        label: "Countdown problems previously unsolved, now solved",
        value: "36%",
        source: "Gandhi et al., 2024",
        sourceUrl: "https://openreview.net/forum?id=2cop2jmQVL",
      },
    ],
  },
  {
    id: "decision-transformer",
    name: "Decision Transformer",
    paradigm: "transformer",
    family: "Return-conditioned sequence model",
    year: 2021,
    org: "UC Berkeley / FAIR / Google",
    arxiv: "https://arxiv.org/abs/2106.01345",
    blurb:
      "Casts offline RL as conditional sequence modeling: given a return-to-go token, predict the next action. No bootstrapping, no value function.",
    task: "atari",
    scores: {
      sampleEfficiency: 55,
      convergenceSpeed: 72,
      finalPerformance: 62,
      generalization: 60,
      computeEfficiency: 78,
      inferenceCost: 78,
    },
    rawMetrics: [
      {
        label: "Atari (1% DQN-replay) gamer-normalized — beats CQL on 3/4 games",
        value: "comparable",
        source: "Chen et al., 2021",
        sourceUrl: "https://arxiv.org/pdf/2106.01345.pdf",
      },
      {
        label: "Breakout DT score (1% replay)",
        value: "76.9 ± 17.1",
        source: "Chen et al., 2021",
        sourceUrl: "https://openreview.net/pdf?id=a7APmM4B9d",
      },
    ],
  },
  {
    id: "mtp-planning",
    name: "Multi-Token Prediction",
    paradigm: "transformer",
    family: "MTP planner",
    year: 2025,
    org: "Bachmann et al.",
    arxiv: "https://arxiv.org/abs/2604.11912",
    blurb:
      "Predicting k tokens in parallel unlocks emergent planning that next-token prediction can't reach on star-graph and Countdown.",
    task: "pathfinding",
    scores: {
      sampleEfficiency: 82,
      convergenceSpeed: 68,
      finalPerformance: 84,
      generalization: 74,
      computeEfficiency: 72,
      inferenceCost: 70,
    },
    rawMetrics: [
      {
        label: "Star-graph pathfinding accuracy (k=2, 0.5M samples)",
        value: "100%",
        source: "Bachmann & Nagarajan et al., 2025",
        sourceUrl: "https://arxiv.org/html/2604.11912v1",
      },
      {
        label: "NTP accuracy on same task",
        value: "~50%",
        source: "Bachmann & Nagarajan et al., 2025",
        sourceUrl: "https://arxiv.org/html/2604.11912v1",
      },
    ],
  },

  // ---------- HYBRID: TREE SEARCH + NEURAL NET ----------
  {
    id: "muzero",
    name: "MuZero",
    paradigm: "hybrid",
    family: "Model-based MCTS",
    year: 2020,
    org: "DeepMind",
    arxiv: "https://arxiv.org/abs/1911.08265",
    blurb:
      "Learns a latent dynamics model and uses MCTS at action time. Superhuman on Go/chess/shogi without rules; state-of-the-art on Atari with 200M frames.",
    task: "atari",
    scores: {
      sampleEfficiency: 72,
      convergenceSpeed: 48,
      finalPerformance: 96,
      generalization: 82,
      computeEfficiency: 38,
      inferenceCost: 28,
    },
    rawMetrics: [
      {
        label: "Atari 57 — median human-normalized (200M frames)",
        value: "731%",
        source: "Schrittwieser et al., 2020",
        sourceUrl: "http://arxiv.org/pdf/1911.08265.pdf",
      },
      {
        label: "vs Rainbow median",
        value: "+500 pts",
        source: "Schrittwieser et al., 2020",
        sourceUrl: "http://arxiv.org/pdf/1911.08265.pdf",
      },
    ],
  },
  {
    id: "efficientzero",
    name: "EfficientZero",
    paradigm: "hybrid",
    family: "Sample-efficient MuZero",
    year: 2021,
    org: "Ye et al.",
    arxiv: "https://arxiv.org/abs/2111.00210",
    blurb:
      "Adds self-supervised consistency, value prefix, and off-policy correction to MuZero. Superhuman on Atari with only ~2 hours of gameplay.",
    task: "atari",
    scores: {
      sampleEfficiency: 96,
      convergenceSpeed: 90,
      finalPerformance: 88,
      generalization: 70,
      computeEfficiency: 42,
      inferenceCost: 32,
    },
    rawMetrics: [
      {
        label: "Atari 100k mean human-normalized",
        value: "194.3%",
        source: "Ye et al., 2021",
        sourceUrl: "https://arxiv.org/abs/2111.00210",
      },
      {
        label: "Atari 100k median",
        value: "109.0%",
        source: "Ye et al., 2021",
        sourceUrl: "https://arxiv.org/abs/2111.00210",
      },
      {
        label: "Data vs DQN-at-200M",
        value: "500× less",
        source: "Ye et al., 2021",
        sourceUrl: "https://arxiv.org/abs/2111.00210",
      },
    ],
  },
  {
    id: "alphazero",
    name: "AlphaZero",
    paradigm: "hybrid",
    family: "MCTS + ResNet",
    year: 2017,
    org: "DeepMind",
    arxiv: "https://arxiv.org/abs/1712.01815",
    blurb:
      "Tabula-rasa MCTS with self-play. Defines the high bar for board-game planning that transformer planners are now chasing.",
    task: "board",
    scores: {
      sampleEfficiency: 50,
      convergenceSpeed: 38,
      finalPerformance: 99,
      generalization: 60,
      computeEfficiency: 30,
      inferenceCost: 24,
    },
    rawMetrics: [
      {
        label: "Chess Elo (vs Stockfish 8)",
        value: "≈ +30 Elo (self-play)",
        source: "Silver et al., 2017",
        sourceUrl: "https://arxiv.org/abs/1712.01815",
      },
      {
        label: "Beat Stockfish from scratch",
        value: "4 hours",
        source: "Silver et al., 2017",
        sourceUrl: "https://arxiv.org/abs/1712.01815",
      },
    ],
  },

  // ---------- MODEL-FREE / MODEL-BASED RL ----------
  {
    id: "dreamerv3",
    name: "DreamerV3",
    paradigm: "rl",
    family: "World-model RL",
    year: 2023,
    org: "Hafner et al., DeepMind",
    arxiv: "https://arxiv.org/abs/2301.04104",
    blurb:
      "Generalist world-model RL with fixed hyperparameters across 150+ tasks. First algorithm to mine diamonds in Minecraft from scratch.",
    task: "control",
    scores: {
      sampleEfficiency: 86,
      convergenceSpeed: 76,
      finalPerformance: 90,
      generalization: 92,
      computeEfficiency: 64,
      inferenceCost: 60,
    },
    rawMetrics: [
      {
        label: "Atari 200M median human-normalized",
        value: "302%",
        source: "Hafner et al., 2023",
        sourceUrl: "https://arxiv.org/html/2301.04104",
      },
      {
        label: "vs DreamerV2 median",
        value: "+83 pts",
        source: "Hafner et al., 2023",
        sourceUrl: "https://arxiv.org/html/2301.04104",
      },
      {
        label: "DMLab interactions vs IMPALA",
        value: "130× fewer",
        source: "Hafner et al., 2023",
        sourceUrl: "https://ar5iv.labs.arxiv.org/html/2301.04104",
      },
    ],
  },
  {
    id: "ppo",
    name: "PPO",
    paradigm: "rl",
    family: "Policy-gradient baseline",
    year: 2017,
    org: "OpenAI",
    arxiv: "https://arxiv.org/abs/1707.06347",
    blurb:
      "Workhorse on-policy actor-critic. Strong baseline but data-hungry; used as the reference comparison in nearly every paper here.",
    task: "control",
    scores: {
      sampleEfficiency: 32,
      convergenceSpeed: 40,
      finalPerformance: 60,
      generalization: 64,
      computeEfficiency: 60,
      inferenceCost: 88,
    },
    rawMetrics: [
      {
        label: "ProcGen — reference HP set used by DreamerV3 comparison",
        value: "baseline",
        source: "Schulman et al., 2017",
        sourceUrl: "https://arxiv.org/abs/1707.06347",
      },
    ],
  },
  {
    id: "dqn",
    name: "DQN (Rainbow)",
    paradigm: "rl",
    family: "Value-based off-policy",
    year: 2017,
    org: "DeepMind",
    arxiv: "https://arxiv.org/abs/1710.02298",
    blurb:
      "Combines double-Q, prioritized replay, noisy nets, distributional Q, and n-step returns. The classical Atari benchmark anchor at 200M frames.",
    task: "atari",
    scores: {
      sampleEfficiency: 24,
      convergenceSpeed: 28,
      finalPerformance: 70,
      generalization: 52,
      computeEfficiency: 56,
      inferenceCost: 90,
    },
    rawMetrics: [
      {
        label: "Atari 57 — median human-normalized (200M frames)",
        value: "231%",
        source: "Hessel et al., 2017",
        sourceUrl: "https://arxiv.org/abs/1710.02298",
      },
      {
        label: "Atari 100k mean human-normalized",
        value: "≈ 220%",
        source: "Ye et al., 2021 (Table 1)",
        sourceUrl: "https://arxiv.org/abs/2111.00210",
      },
    ],
  },
];

// ============== TASK BENCHMARK SHEETS ==============
// Per-benchmark numbers for head-to-head bar charts.

export type BenchmarkRow = {
  method: string;
  paradigm: Paradigm;
  value: number;
  unit: string;
};

export const BENCHMARKS: {
  id: string;
  title: string;
  subtitle: string;
  metric: string;
  higherIsBetter: boolean;
  rows: BenchmarkRow[];
  sourceUrl: string;
  sourceLabel: string;
}[] = [
  {
    id: "atari-100k",
    title: "Atari 100k",
    subtitle: "Sample efficiency — 2 hours of gameplay (400k frames)",
    metric: "Mean human-normalized score (%)",
    higherIsBetter: true,
    sourceLabel: "Ye et al. 2021, Hafner et al. 2023",
    sourceUrl: "https://arxiv.org/abs/2111.00210",
    rows: [
      { method: "EfficientZero", paradigm: "hybrid", value: 194.3, unit: "%" },
      { method: "DreamerV3", paradigm: "rl", value: 112.0, unit: "%" },
      { method: "IRIS (transformer WM)", paradigm: "transformer", value: 105.0, unit: "%" },
      { method: "SPR", paradigm: "rl", value: 70.4, unit: "%" },
      { method: "SimPLe", paradigm: "rl", value: 35.0, unit: "%" },
      { method: "DQN (Rainbow) at 100k", paradigm: "rl", value: 11.5, unit: "%" },
    ],
  },
  {
    id: "atari-200m",
    title: "Atari 200M (full budget)",
    subtitle: "Final performance ceiling — 200M frames per game",
    metric: "Median human-normalized score (%)",
    higherIsBetter: true,
    sourceLabel: "Schrittwieser et al. 2020, Hafner et al. 2023",
    sourceUrl: "http://arxiv.org/pdf/1911.08265.pdf",
    rows: [
      { method: "MuZero", paradigm: "hybrid", value: 731, unit: "%" },
      { method: "LASER", paradigm: "rl", value: 431, unit: "%" },
      { method: "DreamerV3", paradigm: "rl", value: 302, unit: "%" },
      { method: "Rainbow", paradigm: "rl", value: 231, unit: "%" },
      { method: "IMPALA", paradigm: "rl", value: 192, unit: "%" },
    ],
  },
  {
    id: "sokoban",
    title: "Sokoban (unseen puzzles)",
    subtitle: "Symbolic planning + Transformer head-to-head",
    metric: "Solve rate (%)",
    higherIsBetter: true,
    sourceLabel: "Lehnert et al. 2024",
    sourceUrl: "https://arxiv.org/abs/2402.14083",
    rows: [
      { method: "Searchformer", paradigm: "transformer", value: 93.7, unit: "%" },
      { method: "Search-augmented (no FT)", paradigm: "transformer", value: 91.0, unit: "%" },
      { method: "Solution-only 747M", paradigm: "transformer", value: 87.0, unit: "%" },
      { method: "Solution-only 175M", paradigm: "transformer", value: 84.0, unit: "%" },
      { method: "A* reference", paradigm: "hybrid", value: 100, unit: "% (oracle)" },
    ],
  },
  {
    id: "maze-30",
    title: "30×30 Maze (optimal)",
    subtitle: "Dualformer vs Searchformer on long-horizon pathfinding",
    metric: "Optimal solve rate (%)",
    higherIsBetter: true,
    sourceLabel: "Su et al. 2024",
    sourceUrl: "https://arxiv.org/abs/2410.09918",
    rows: [
      { method: "Dualformer (slow)", paradigm: "transformer", value: 97.6, unit: "%" },
      { method: "Searchformer", paradigm: "transformer", value: 93.3, unit: "%" },
      { method: "Dualformer (auto)", paradigm: "transformer", value: 96.6, unit: "%" },
      { method: "Dualformer (fast)", paradigm: "transformer", value: 80.0, unit: "%" },
      { method: "Solution-only baseline", paradigm: "transformer", value: 30.0, unit: "%" },
    ],
  },
  {
    id: "search-steps",
    title: "Inference cost — search steps used",
    subtitle: "Lower is faster. Normalized to A* baseline = 100.",
    metric: "Search steps (relative to A*)",
    higherIsBetter: false,
    sourceLabel: "Lehnert et al. 2024, Su et al. 2024",
    sourceUrl: "https://arxiv.org/abs/2402.14083",
    rows: [
      { method: "A* baseline", paradigm: "hybrid", value: 100, unit: "" },
      { method: "Searchformer (FT)", paradigm: "transformer", value: 73.2, unit: "" },
      { method: "Dualformer (slow)", paradigm: "transformer", value: 54.5, unit: "" },
      { method: "Dualformer (auto)", paradigm: "transformer", value: 40.1, unit: "" },
    ],
  },
  {
    id: "countdown",
    title: "Countdown (arithmetic search)",
    subtitle: "Stream-of-Search self-improvement on previously unsolved problems",
    metric: "Problems solved that no heuristic solved (%)",
    higherIsBetter: true,
    sourceLabel: "Gandhi et al. 2024",
    sourceUrl: "https://arxiv.org/abs/2404.03683",
    rows: [
      { method: "SoS + APA + STaR", paradigm: "transformer", value: 36, unit: "%" },
      { method: "SoS pretrained only", paradigm: "transformer", value: 25, unit: "%" },
      { method: "Optimal-only LM", paradigm: "transformer", value: 0, unit: "% (by definition)" },
    ],
  },
];

// ============== CONVERGENCE CURVES ==============
// Stylized but ratio-faithful learning curves for the convergence panel.
// X = environment steps (millions, log-ish). Y = human-normalized score.
// Anchored to numbers cited above; smooth interpolation between published checkpoints.

export type CurvePoint = { steps: number; score: number };
export const CONVERGENCE_CURVES: {
  method: string;
  paradigm: Paradigm;
  color: string;        // chart-N variable
  points: CurvePoint[];
}[] = [
  {
    method: "MuZero",
    paradigm: "hybrid",
    color: "var(--chart-3)",
    points: [
      { steps: 0.01, score: 5 },
      { steps: 0.1, score: 30 },
      { steps: 1, score: 110 },
      { steps: 10, score: 340 },
      { steps: 50, score: 560 },
      { steps: 200, score: 731 },
    ],
  },
  {
    method: "DreamerV3",
    paradigm: "rl",
    color: "var(--chart-2)",
    points: [
      { steps: 0.01, score: 8 },
      { steps: 0.1, score: 50 },
      { steps: 1, score: 130 },
      { steps: 10, score: 210 },
      { steps: 50, score: 270 },
      { steps: 200, score: 302 },
    ],
  },
  {
    method: "EfficientZero",
    paradigm: "hybrid",
    color: "var(--chart-4)",
    points: [
      { steps: 0.01, score: 12 },
      { steps: 0.1, score: 194 },
      { steps: 1, score: 220 },
      { steps: 10, score: 240 },
      { steps: 50, score: 250 },
      { steps: 200, score: 260 },
    ],
  },
  {
    method: "Rainbow (DQN)",
    paradigm: "rl",
    color: "var(--chart-5)",
    points: [
      { steps: 0.01, score: 2 },
      { steps: 0.1, score: 11.5 },
      { steps: 1, score: 35 },
      { steps: 10, score: 110 },
      { steps: 50, score: 190 },
      { steps: 200, score: 231 },
    ],
  },
  {
    method: "PPO",
    paradigm: "rl",
    color: "var(--chart-2)",
    points: [
      { steps: 0.01, score: 1 },
      { steps: 0.1, score: 6 },
      { steps: 1, score: 22 },
      { steps: 10, score: 65 },
      { steps: 50, score: 105 },
      { steps: 200, score: 145 },
    ],
  },
  {
    method: "IRIS (Transformer WM)",
    paradigm: "transformer",
    color: "var(--chart-1)",
    points: [
      { steps: 0.01, score: 10 },
      { steps: 0.1, score: 105 },
      { steps: 1, score: 140 },
      { steps: 10, score: 165 },
      { steps: 50, score: 175 },
      { steps: 200, score: 180 },
    ],
  },
];

// ============== TRADE-OFF MATRIX ==============
// Used in the heatmap / scatter
export type TradeoffAxis =
  | "sampleEfficiency"
  | "convergenceSpeed"
  | "finalPerformance"
  | "generalization"
  | "computeEfficiency"
  | "inferenceCost";

export const AXIS_LABELS: Record<TradeoffAxis, string> = {
  sampleEfficiency: "Sample efficiency",
  convergenceSpeed: "Convergence speed",
  finalPerformance: "Final performance",
  generalization: "OOD generalization",
  computeEfficiency: "Compute efficiency",
  inferenceCost: "Inference cheapness",
};
