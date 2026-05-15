// SDA / Space-RL benchmark catalog
// Each entry is sourced from a primary paper, dataset, or repository.

export type DataType = "Simulated" | "Real" | "Hybrid";
export type SensorModality =
  | "Optical (ground)"
  | "Optical (space)"
  | "Radar"
  | "RF"
  | "Multi-sensor"
  | "N/A (control)";
export type Access =
  | "Open code + open data"
  | "Open code"
  | "Open data"
  | "Restricted"
  | "Paper only";
export type Category =
  | "Sensor tasking"
  | "Orbit control / station-keeping"
  | "Pattern-of-life"
  | "Differential game"
  | "Spacecraft planning"
  | "Constellation design";

export interface Benchmark {
  id: string;
  name: string;
  paper: string;
  year: number;
  authors: string;
  venue: string;
  category: Category;
  dataType: DataType;
  rsoCount: number | [number, number];
  rsoLabel: string;
  modality: SensorModality;
  access: Access;
  url: string;
  codeUrl?: string;
  summary: string;
  strengths: string[];
  limitations: string[];
  reproducibility: string;
  validatedAgainst?: string;
}

export const BENCHMARKS: Benchmark[] = [
  {
    id: "orbitzoo",
    name: "OrbitZoo",
    paper: "OrbitZoo: Real Orbital Systems Challenges for Reinforcement Learning",
    year: 2025,
    authors: "Neves, Caldas, Soares, et al.",
    venue: "NeurIPS 2025 / arXiv 2504.04160",
    category: "Orbit control / station-keeping",
    dataType: "Hybrid",
    rsoCount: [2, 100],
    rsoLabel: "2–100 agents (validated vs. Starlink shell)",
    modality: "N/A (control)",
    access: "Open code",
    url: "https://arxiv.org/abs/2504.04160",
    codeUrl: "https://neurips.cc/virtual/2025/poster/116058",
    summary:
      "Multi-agent RL environment built on a high-fidelity industry-standard propagator. Supports collision avoidance and cooperative maneuver scenarios; designed for agent-environment loops at orbital timescales.",
    strengths: [
      "High-fidelity dynamics (industry-grade propagator)",
      "Multi-agent / PettingZoo-style API",
      "Validated against real Starlink constellation: 0.16% MAPE vs. real-world ephemerides",
      "Supports collision-avoidance and cooperative-maneuver scenarios",
    ],
    limitations: [
      "Compute cost grows quickly with agent count",
      "Sensor / observation modeling is secondary to dynamics",
      "Reward shaping for cooperative scenarios still an open research question",
    ],
    reproducibility:
      "Reference implementation released alongside the NeurIPS poster; deterministic seeding documented. MAPE-based validation against Starlink provides an objective external check.",
    validatedAgainst: "Starlink ephemerides (MAPE 0.16%)",
  },
  {
    id: "siew-linares-2022",
    name: "Siew & Linares narrow-FOV SSA Gym",
    paper:
      "Optimal Tasking of Ground-Based Sensors for Space Situational Awareness Using Deep Reinforcement Learning",
    year: 2022,
    authors: "Siew, P. M. & Linares, R.",
    venue: "Sensors, 22(20), 7847",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [50, 500],
    rsoLabel: "Up to ~500 RSOs across LEO/MEO/GEO regimes",
    modality: "Optical (ground)",
    access: "Paper only",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9611899/",
    summary:
      "OpenAI Gym SSA environment with a single narrow-FOV ground-based optical telescope (4° × 4° FOV, finite slew/settle/dwell). 1,710 discrete pointing patches; reward shaping based on uncertainty reduction across the RSO catalog.",
    strengths: [
      "Carefully specified sensor model: FOV, slew rate, settle, dwell, readout",
      "Covers multiple orbit regimes (LEO/MEO/GEO)",
      "Four actor-critic variants compared against two myopic baselines",
      "Most widely cited narrow-FOV SSA RL baseline",
    ],
    limitations: [
      "Single sensor only in the original paper (extensions to multi-sensor exist as follow-ups)",
      "Code not publicly released — must be re-implemented from the paper",
      "Synthetic RSO populations; no real catalog overlay",
    ],
    reproducibility:
      "Methodology and hyperparameters are documented in detail, but the absence of public code means reproduction effort is high. Several independent reimplementations exist in academic groups.",
  },
  {
    id: "siew-cislunar",
    name: "Cislunar SSA Sensor Tasking",
    paper:
      "Cislunar Space Situational Awareness Sensor Tasking using Deep Reinforcement Learning Agents",
    year: 2022,
    authors: "Siew, Jang, Roberts, Linares, Fletcher (USSF SSC)",
    venue: "AMOS 2022",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [10, 100],
    rsoLabel: "Cislunar RSO population (10s–100s)",
    modality: "Optical (ground)",
    access: "Paper only",
    url: "https://amostech.com/TechnicalPapers/2022/Poster/Siew.pdf",
    summary:
      "Extends the narrow-FOV SSA framework into the cislunar regime, where dynamics, lighting, and viewing geometry differ substantially from Earth-orbit SDA. 100 Monte Carlo runs per scenario.",
    strengths: [
      "Rare RL benchmark covering cislunar (vs. the usual LEO/GEO focus)",
      "Government co-author (USSF SSC) lends operational grounding",
      "Monte Carlo evaluation reduces seed bias",
    ],
    limitations: [
      "No public code or environment release",
      "Cislunar dynamics models are simplified",
      "Limited comparison policies",
    ],
    reproducibility:
      "Methodology described in the AMOS paper; full reproduction requires building both the cislunar propagator and the sensor model from scratch.",
  },
  {
    id: "siew-marl",
    name: "Scalable Multi-Agent SSA Tasking",
    paper:
      "Scalable Multi-Agent Sensor Tasking Using Deep Multi-Agent Reinforcement Learning",
    year: 2023,
    authors: "Siew et al.",
    venue: "AMOS 2023",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [100, 1000],
    rsoLabel: "100–1000 SOs, up to 10 sensors",
    modality: "Optical (ground)",
    access: "Paper only",
    url: "https://amostech.com/TechnicalPapers/2023/Machine-Learning-for-SDA/Siew.pdf",
    summary:
      "Decentralized MARL for coordinating multiple ground sensors. Studies generalization: agents trained on 100 SOs evaluated up to 600 SOs; up to 10 sensor agents.",
    strengths: [
      "Explicit scalability study (RSO count, sensor count)",
      "Decentralized policy — practical for distributed sensor networks",
      "Outperforms myopic baselines up to ~600 SOs from 100-SO training",
    ],
    limitations: [
      "Degradation observed beyond ~400 SOs in dense scenarios",
      "No public code release",
      "Same caveat as Siew & Linares 2022: synthetic populations only",
    ],
    reproducibility:
      "Detailed problem formulation; reproduction still requires re-implementing the SSA environment plus the MARL training loop.",
  },
  {
    id: "oakes-amos2024",
    name: "Oakes AMOS 2024 SSA-DRL",
    paper:
      "Deep Reinforcement Learning Applications to Space Domain Awareness",
    year: 2024,
    authors: "Oakes et al.",
    venue: "AMOS 2024",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [50, 300],
    rsoLabel: "Mid-sized RSO populations",
    modality: "Optical (ground)",
    access: "Paper only",
    url: "https://amostech.com/TechnicalPapers/2024/Poster/Oakes.pdf",
    summary:
      "Comparative study of DDQN, SAC, and PPO for SSA sensor scheduling. Shows significant uncertainty reduction for tracked objects across multiple agent families.",
    strengths: [
      "Side-by-side algorithm comparison (DDQN / SAC / PPO)",
      "Reports uncertainty-reduction metric directly tied to operational SDA value",
      "Recent (2024) — uses modern RL stacks",
    ],
    limitations: [
      "No code release",
      "Synthetic environment; no validation against real catalog",
      "Sample sizes for some scenarios are small",
    ],
    reproducibility:
      "Algorithms are standard; environment must be reconstructed from the paper. Lower reproduction cost than original Siew & Linares since underlying agents are off-the-shelf.",
  },
  {
    id: "tle-a2c",
    name: "TLE-Based A2C Orbital Coverage",
    paper:
      "TLE-Based A2C Agent for Terrestrial Coverage Orbital Optimization",
    year: 2025,
    authors: "Anonymous (arXiv preprint)",
    venue: "arXiv 2508.10872",
    category: "Orbit control / station-keeping",
    dataType: "Real",
    rsoCount: 1,
    rsoLabel: "Single satellite, TLE-driven",
    modality: "N/A (control)",
    access: "Paper only",
    url: "https://arxiv.org/html/2508.10872v1",
    summary:
      "RL framework using A2C to optimize satellite orbital parameters for terrestrial coverage. TLE-based simulation environment with physics constraints. Reports 73.6% higher cumulative reward and 27.4× faster training than PPO.",
    strengths: [
      "Direct use of NORAD TLE data as the orbital state source",
      "Concrete quantitative comparison vs. PPO baseline",
      "Physics-constrained observation/action space",
    ],
    limitations: [
      "Single-satellite scenario only",
      "TLE accuracy is itself limited — bias propagates into training",
      "Code not released at preprint time",
    ],
    reproducibility:
      "TLEs are public via CelesTrak/Space-Track, so the data inputs are reproducible. The training environment and reward function need to be reconstructed from the manuscript.",
    validatedAgainst: "NORAD TLE catalog",
  },
  {
    id: "spacetrack-timeseries",
    name: "SpaceTrack-TimeSeries",
    paper:
      "A Time Series Dataset towards Satellite Orbit Analysis (Starlink TLE + Ephemeris)",
    year: 2025,
    authors: "Authors of arXiv 2506.13034",
    venue: "arXiv 2506.13034",
    category: "Pattern-of-life",
    dataType: "Real",
    rsoCount: [1000, 5000],
    rsoLabel: "~48 weeks of Starlink (TLE + high-precision ephemeris)",
    modality: "N/A (control)",
    access: "Open data",
    url: "https://arxiv.org/html/2506.13034v1",
    summary:
      "Time-series dataset integrating TLE catalog data with high-precision Starlink ephemeris. Targets maneuver detection and pattern-of-life learning under realistic noise and revisit cadence.",
    strengths: [
      "Real-world data: 48+ weeks of continuous monitoring",
      "Pairs TLE (noisy, public) with ephemeris (high-precision) — uniquely useful for sim-to-real",
      "Targets a concrete downstream task: maneuver detection",
    ],
    limitations: [
      "Not yet a closed-loop RL environment — dataset only",
      "Starlink-specific; behavior may not generalize to other operators",
      "Ephemeris is operator-supplied; biases possible",
    ],
    reproducibility:
      "Data sources are documented; underlying TLEs are public via Space-Track. Ephemeris dependency on the original release means exact reproduction requires the published archive.",
    validatedAgainst: "Space-Track ephemeris vs. TLE",
  },
  {
    id: "bsk-rl",
    name: "BSK-RL (Basilisk + RL)",
    paper:
      "BSK-RL: Environments for Spacecraft Planning and Scheduling",
    year: 2024,
    authors: "AVSLab (University of Colorado Boulder)",
    venue: "Open-source / Gymnasium",
    category: "Spacecraft planning",
    dataType: "Simulated",
    rsoCount: 1,
    rsoLabel: "Single-spacecraft planning (extensible)",
    modality: "Multi-sensor",
    access: "Open code + open data",
    url: "https://avslab.github.io/bsk_rl/",
    codeUrl: "https://github.com/AVSLab/bsk_rl",
    summary:
      "Python package for constructing Gymnasium environments for spacecraft tasking on top of Basilisk — a high-fidelity, modular spacecraft simulation framework. Production-quality utilities and examples.",
    strengths: [
      "High-fidelity dynamics, attitude, and subsystem modeling via Basilisk",
      "Gymnasium-native API; works with Stable-Baselines3, RLlib, etc.",
      "Actively maintained, well-documented, MIT/academic-grade code",
      "Best baseline for spacecraft planning research today",
    ],
    limitations: [
      "Single-spacecraft focus by default — multi-agent requires custom wrapping",
      "Tasking problems are operator-flavored, not catalog-wide SSA",
      "Basilisk learning curve",
    ],
    reproducibility:
      "Open-source code + pinned dependencies + example notebooks make this the most reproducible benchmark in the catalog.",
  },
  {
    id: "kspdg",
    name: "KSPDG (Kerbal Space Program Differential Games)",
    paper:
      "Kerbal Space Program Differential Game Challenge",
    year: 2024,
    authors: "MIT Lincoln Laboratory",
    venue: "AIAA SciTech 2024",
    category: "Differential game",
    dataType: "Simulated",
    rsoCount: [2, 4],
    rsoLabel: "1v1 to multi-agent (e.g., lady-bandit-guard)",
    modality: "N/A (control)",
    access: "Open code",
    url: "https://www.ll.mit.edu/conferences-events/2024/01/kerbal-space-program-differential-game-challenge",
    codeUrl: "https://github.com/mit-ll/spacegym-kspdg",
    summary:
      "Suite of differential-game challenge problems (pursuit-evasion, multi-agent target guarding, sun-blocking) in the orbital domain, built on the Kerbal Space Program engine via kRPC. Gymnasium + PettingZoo APIs.",
    strengths: [
      "Non-cooperative space operations — pursuit/evasion, deception",
      "Industry-standard Gym/PettingZoo APIs",
      "Backed by MIT-LL with formal challenge infrastructure",
      "Real-time decision constraints (no time pause)",
    ],
    limitations: [
      "Explicitly an evaluation environment, not a training environment — large-scale parallel training is not supported",
      "KSP physics is approximate (game-engine, not numerical propagator)",
      "Requires a licensed KSP installation",
    ],
    reproducibility:
      "Open-source library with documented setup; the KSP dependency is the largest reproducibility hurdle. Challenge leaderboards provide independent comparison.",
  },
  {
    id: "splid",
    name: "SPLID (Satellite Pattern-of-Life ID Dataset)",
    paper:
      "AI SSA Challenge Problem: Satellite Pattern-of-Life Characterization Dataset and Benchmark Suite",
    year: 2023,
    authors: "Siew, Solera, Roberts, Jang, Rodriguez-Fernandez, How, Linares",
    venue: "AMOS 2023 / MIT ARCLab",
    category: "Pattern-of-life",
    dataType: "Hybrid",
    rsoCount: [100, 500],
    rsoLabel: "Hundreds of GEO satellites",
    modality: "Optical (ground)",
    access: "Open code + open data",
    url: "https://amostech.com/TechnicalPapers/2023/Machine-Learning-for-SDA/Siew2.pdf",
    codeUrl: "https://github.com/ARCLab-MIT/splid-devkit",
    summary:
      "Labeled GEO-satellite pattern-of-life dataset combining synthetic data, true space-object data from Vector Covariance Messages, and high-accuracy operator-supplied ephemerides. Companion challenge competition with precision/recall metrics.",
    strengths: [
      "Public challenge with leaderboard — strong external validation",
      "Mixes synthetic, VCM, and operator-grade ephemeris in one benchmark",
      "Open dev kit + sample baselines",
      "Targets behavioral-mode characterization, not just orbit fitting",
    ],
    limitations: [
      "GEO-only; LEO/MEO patterns of life are out of scope",
      "Not a closed-loop RL environment — supervised/sequence labeling task",
      "Private evaluation set requires submission for true score",
    ],
    reproducibility:
      "Highly reproducible: public dev kit, public training data, fixed metrics. Private test set used only for final scoring.",
    validatedAgainst: "Operator ephemerides + VCMs",
  },
  {
    id: "auburn-pleo",
    name: "Auburn P-LEO Constellation RL",
    paper:
      "Simulation to Strategy: Investigating P-LEO Satellite Internet Constellations with RL",
    year: 2026,
    authors: "Auburn University (graduate thesis)",
    venue: "Auburn ETD",
    category: "Constellation design",
    dataType: "Simulated",
    rsoCount: [100, 4000],
    rsoLabel: "Parameterized P-LEO constellation designs",
    modality: "N/A (control)",
    access: "Paper only",
    url: "https://auetd.auburn.edu/handle/10415/10368",
    summary:
      "Parameterized single-agent RL environment for P-LEO constellation design. Orbit-plane catalog gives agents a wide choice of constellation configurations; explores which environmental parameters dominate feasibility.",
    strengths: [
      "Strategic-level decision making (constellation design) — rare in RL SDA work",
      "Explicit sensitivity study over environment parameters",
      "Recent thesis (defended late 2026)",
    ],
    limitations: [
      "Single-agent only; no multi-operator competition",
      "Thesis-stage release; no code or environment package yet",
      "Coarse coverage / capacity models",
    ],
    reproducibility:
      "Thesis documents methodology; reproduction requires re-implementing the orbit-plane catalog and reward shaping.",
  },
  {
    id: "mit-arclab-sensor-tasking",
    name: "MIT ARCLab Multi-Sensor RL SSA",
    paper:
      "Reinforcement Learning for Space Situational Awareness Sensor Tasking",
    year: 2023,
    authors: "MIT ARCLab",
    venue: "MIT AeroAstro project page",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [50, 500],
    rsoLabel: "Multi-regime RSO populations",
    modality: "Multi-sensor",
    access: "Paper only",
    url: "https://aeroastro.mit.edu/arclab/research/reinforcement-learning-for-space-situational-awareness-sensor-tasking/",
    summary:
      "Ongoing project comparing RL to myopic methods across discretized observation/action spaces and several orbit regimes. Now expanding to multiple sensors and space-based platforms.",
    strengths: [
      "Active research program with continued publication output",
      "Explicit comparison to myopic baselines",
      "Generalizes across orbit regimes",
    ],
    limitations: [
      "Project-page level information — specific implementations distributed across multiple papers",
      "No unified open-source release",
    ],
    reproducibility:
      "Reproducibility varies by sub-paper; the umbrella project does not ship a single canonical environment.",
  },
  {
    id: "space-gym-mimuw",
    name: "space-gym (MIMUW)",
    paper: "space-gym: Challenging RL environments in space locomotion",
    year: 2022,
    authors: "MIMUW (University of Warsaw)",
    venue: "GitHub / open-source",
    category: "Orbit control / station-keeping",
    dataType: "Simulated",
    rsoCount: 1,
    rsoLabel: "Single planar spacecraft, multiple tasks",
    modality: "N/A (control)",
    access: "Open code",
    url: "https://github.com/MIMUW-RL/space-gym",
    codeUrl: "https://github.com/MIMUW-RL/space-gym",
    summary:
      "Suite of RL locomotion-style tasks set in a planar space environment: reaching goal points and entering prescribed orbits. Includes published human-keyboard baseline scores per difficulty level.",
    strengths: [
      "Hard tasks for modern off-policy algorithms (SAC, TD3 underperform humans)",
      "Human baseline scores supplied",
      "Lightweight, easy to install",
    ],
    limitations: [
      "Planar / 2D physics, not realistic SSA",
      "No real-satellite validation",
      "Maintenance frozen since 2022",
    ],
    reproducibility:
      "Open code + frozen dependency versions; reproduction is trivial relative to the rest of the catalog.",
  },
  {
    id: "linares-2016",
    name: "Linares & Furfaro 2016/17 (foundational)",
    paper: "Dynamic Sensor Tasking for Space Situational Awareness via Reinforcement Learning",
    year: 2017,
    authors: "Linares, R. & Furfaro, R.",
    venue: "AMOS 2016 / 2017",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [22000, 22000],
    rsoLabel: "Small catalog (2016); ~22k USSPACECOM-scale (2017, aspirational)",
    modality: "Optical (ground)",
    access: "Paper only",
    url: "https://amostech.com/TechnicalPapers/2017/Tasking/Linares.pdf",
    summary:
      "Foundational AMOS work establishing reinforcement learning as a framework for SSA sensor tasking. First policy-gradient applied to an SSA MDP; the 2017 follow-up scales toward the full USSPACECOM catalog using A3C.",
    strengths: [
      "Foundational work establishing RL for SSA tasking",
      "First policy gradient applied to the SSA MDP",
      "2017 paper aspirationally targets full USSPACECOM catalog scale with A3C",
      "Widely cited by subsequent SSA-RL work",
    ],
    limitations: [
      "Preliminary proof-of-concept; no environment released",
      "Predates modern Gymnasium API",
      "Limited quantitative comparison vs. later work",
      "No code or reproducibility artifacts",
    ],
    reproducibility:
      "Conference papers only; no code or data released. Reproduction requires reimplementing both the SSA MDP and the actor-critic / A3C training loop.",
  },
  {
    id: "roberts-2021-sbst",
    name: "Roberts space-based sensor tasking",
    paper: "Space-Based Sensor Tasking using Deep Reinforcement Learning",
    year: 2022,
    authors: "Roberts, Siew, Jang, Linares",
    venue: "AMOS 2021 / Journal of Astronautical Sciences 2022",
    category: "Sensor tasking",
    dataType: "Simulated",
    rsoCount: [100, 400],
    rsoLabel: "100–400 RSOs, single space-based sensor",
    modality: "Optical (space)",
    access: "Paper only",
    url: "https://doi.org/10.1007/s40295-022-00344-6",
    summary:
      "First DRL applied to space-based narrow-FOV sensor tasking. 2,340 discrete pointing directions across 90x26 elevation/azimuth grid; PPO with population-based training; evaluated across sun-sync, inclined, and equatorial orbits.",
    strengths: [
      "First DRL applied to space-based narrow-FOV tasking",
      "Multi-orbit evaluation (sun-sync, inclined, equatorial)",
      "Agent transfers between orbital configurations robustly",
      "Outperforms greedy baselines on multiple metrics",
    ],
    limitations: [
      "Environment code not released",
      "Simulated RSO populations only",
      "Single-sensor focus despite multi-agent analysis",
      "No long-horizon (>90 min) evaluation",
    ],
    reproducibility:
      "Architecture and hyperparameters described; SuperCloud training reported; environment not released and seeds not specified.",
  },
  {
    id: "spacegym-od2d",
    name: "SpaceGym OD2D (MIT-LL)",
    paper: "SpaceGym: Discrete 2D Orbital Games for Reinforcement Learning",
    year: 2023,
    authors: "Allen, Rachlin, et al. (MIT-LL)",
    venue: "IEEE Aerospace Conference 2023",
    category: "Differential game",
    dataType: "Simulated",
    rsoCount: [2, 5],
    rsoLabel: "2–5 objects per scenario (grid)",
    modality: "N/A (control)",
    access: "Open code",
    url: "https://doi.org/10.1109/AERO55745.2023.10115968",
    codeUrl: "https://github.com/mit-ll/spacegym-od2d",
    summary:
      "Discrete 2D orbital-game environment that complements MIT-LL's KSPDG evaluation suite. Lightweight grid-based dynamics make it suitable as a fast training sandbox before transferring to KSPDG-grade evaluation.",
    strengths: [
      "Low computational barrier (pure Python)",
      "Fast training environment, complementary to KSPDG for evaluation",
      "Standard Gymnasium interface",
      "MIT-licensed open source",
    ],
    limitations: [
      "Highly abstracted 2D board-game physics",
      "Not suitable for validating real SDA algorithms",
      "Action space far from operational realism",
    ],
    reproducibility:
      "Open-source, low dependency barrier, MIT license. Trivial to reproduce baseline runs.",
  },
  {
    id: "herrmann-2023-eos",
    name: "Herrmann EOS scheduling RL",
    paper: "Comparative Analysis of Reinforcement Learning Algorithms for Earth-Observing Satellite Scheduling",
    year: 2023,
    authors: "Herrmann, A. & Schaub, H.",
    venue: "Frontiers in Space Technologies",
    category: "Spacecraft planning",
    dataType: "Simulated",
    rsoCount: [25, 135],
    rsoLabel: "1 satellite, 25–135 ground targets",
    modality: "Optical (space)",
    access: "Open code",
    url: "https://doi.org/10.3389/frspt.2023.1263489",
    codeUrl: "https://github.com/AVSLab/bsk_rl",
    summary:
      "Head-to-head comparison of six RL algorithms (A2C, DQN, PPO, Shielded PPO, MCTS-Train, Genetic Algorithm) for agile Earth-observing satellite scheduling with battery, reaction-wheel desat, and downlink constraints. Built on BSK-RL.",
    strengths: [
      "Six algorithms compared head-to-head (including Shielded PPO and MCTS)",
      "Open-source via the BSK-RL package",
      "Two environments of increasing complexity",
      "Genetic-algorithm baseline for non-RL comparison",
    ],
    limitations: [
      "Single-satellite only",
      "No SDA sensing / RSO tracking",
      "Not multi-agent",
      "Limited to EOS-specific tasks",
    ],
    reproducibility:
      "Full hyperparameter search documented; BSK-RL package pinned; 45 / 90 decision intervals reported. Seeds not published.",
  },
  {
    id: "eos-bench",
    name: "EOS-Bench",
    paper: "EOS-Bench: A Comprehensive Benchmark for Earth-Observing Satellite Scheduling",
    year: 2026,
    authors: "Yin, Li, Cheng, Luo, Riccardi, et al.",
    venue: "arXiv 2604.25782",
    category: "Spacecraft planning",
    dataType: "Hybrid",
    rsoCount: [100, 1000],
    rsoLabel: "Up to 1,000 satellites and 10,000 task requests",
    modality: "Optical (space)",
    access: "Open code + open data",
    url: "https://arxiv.org/abs/2604.25782",
    codeUrl: "https://github.com/Ethan19YQ/EOS-Bench",
    summary:
      "Largest open EOS scheduling testbed to date: 13,900 instances spanning agile and non-agile platforms, evaluated across MIP, heuristics, meta-heuristics, and DRL solvers on a unified five-metric scoring framework.",
    strengths: [
      "Largest EOS scheduling benchmark (13,900 instances, 1,000-sat scale)",
      "Open testbed with unified evaluation framework",
      "Covers agile and non-agile platforms",
      "Multi-solver support (MIP, heuristics, meta-heuristics, DRL)",
    ],
    limitations: [
      "DRL is one solver type, not the primary focus; no RL-specific ablations",
      "No Gymnasium-compatible RL environment provided",
      "Very new (2026 preprint); limited independent validation",
    ],
    reproducibility:
      "Full open-source release: scenario generator, 13,900 instances, and standardized metrics. Reproduction is straightforward.",
  },
  {
    id: "spacegym-prox",
    name: "SpaceGym proximity ops",
    paper: "A Gymnasium Benchmark for Spacecraft Proximity Operations",
    year: 2026,
    authors: "Mysore, S. & Mehta, A.",
    venue: "AI4Space @ CVPR 2026",
    category: "Orbit control / station-keeping",
    dataType: "Simulated",
    rsoCount: 2,
    rsoLabel: "2 spacecraft (chaser + target)",
    modality: "N/A (control)",
    access: "Paper only",
    url: "https://openreview.net/forum?id=eHHDzzYt1F",
    summary:
      "Three complementary proximity-ops tasks (docking, rendezvous, attitude control) under Clohessy-Wiltshire-Hill linearized dynamics. Reports a 5-seed x 4-algorithm x 3-environment study with dense vs. sparse reward ablations.",
    strengths: [
      "Three complementary proximity-ops tasks in one package",
      "60 training runs (5 seeds x 4 algos x 3 envs) for statistical comparison",
      "Dense vs. sparse reward ablation study",
      "Workshop-published with peer review (AI4Space @ CVPR)",
    ],
    limitations: [
      "Code link not yet provided in the paper",
      "No SDA sensor modeling",
      "Clohessy-Wiltshire-Hill linearization limits high-eccentricity applicability",
      "Single-scenario per task type",
    ],
    reproducibility:
      "Five seeds, four algorithms, 500K timesteps each; results fully tabulated. Code is stated as available but not yet linked at preprint time.",
  },
  {
    id: "gym-satellite",
    name: "gym-satellite (Kunesch)",
    paper: "gym-satellite: OpenAI Gym station-keeping environment",
    year: 2018,
    authors: "Kunesch, M.",
    venue: "GitHub (archived)",
    category: "Orbit control / station-keeping",
    dataType: "Simulated",
    rsoCount: 1,
    rsoLabel: "Single satellite, simple station-keeping",
    modality: "N/A (control)",
    access: "Open code",
    url: "https://github.com/mkunesch/gym-satellite",
    codeUrl: "https://github.com/mkunesch/gym-satellite",
    summary:
      "Early educational benchmark: a simple station-keeping / orbit-raising environment in the original OpenAI Gym API. Ships pre-trained DQN weights and video demos. Useful as a teaching tool, not a publication-grade benchmark.",
    strengths: [
      "Simple educational benchmark with low install friction",
      "Pre-trained DQN weights provided",
      "Video demonstrations available",
    ],
    limitations: [
      "Archived since 2018; outdated Gym API",
      "Exaggerated drag physics",
      "No SDA sensing component",
      "Not suitable for publication-quality benchmarks",
    ],
    reproducibility:
      "Pre-trained weights and a simple DQN baseline are included. Limited documentation but trivial to spin up.",
  },
];

// Filter option helpers
export const DATA_TYPES: DataType[] = ["Simulated", "Real", "Hybrid"];
export const MODALITIES: SensorModality[] = [
  "Optical (ground)",
  "Optical (space)",
  "Radar",
  "RF",
  "Multi-sensor",
  "N/A (control)",
];
export const ACCESS_LEVELS: Access[] = [
  "Open code + open data",
  "Open code",
  "Open data",
  "Restricted",
  "Paper only",
];
export const CATEGORIES: Category[] = [
  "Sensor tasking",
  "Orbit control / station-keeping",
  "Pattern-of-life",
  "Differential game",
  "Spacecraft planning",
  "Constellation design",
];

export const RSO_BUCKETS = [
  { label: "1 (single-asset)", min: 1, max: 1 },
  { label: "2–10", min: 2, max: 10 },
  { label: "11–100", min: 11, max: 100 },
  { label: "101–1,000", min: 101, max: 1000 },
  { label: "1,000+", min: 1001, max: Infinity },
];

export function rsoMatchesBucket(
  rso: number | [number, number],
  bucket: { min: number; max: number },
): boolean {
  const [lo, hi] = Array.isArray(rso) ? rso : [rso, rso];
  // bucket overlaps [lo, hi]
  return hi >= bucket.min && lo <= bucket.max;
}
