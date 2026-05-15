# SDA·RL Benchmark Index

A live, filterable comparison of every reinforcement-learning benchmark in the Space Domain Awareness literature: narrow-FOV SSA environments, OrbitZoo, NORAD TLE-based agents, Space-Track ephemeris pipelines, Starlink validation, BSK-RL, KSPDG, SPLID, and more — with per-benchmark notes on strengths, limitations, and reproducibility.

## Embedding in Notion

Once deployed to GitHub Pages, paste the Pages URL into Notion's `/embed` block. The site sets no `X-Frame-Options` or restrictive CSP, so it embeds cleanly.

## Local development

```bash
npm install
npm run dev          # http://localhost:5000
```

## Build

```bash
npm run build        # outputs to dist/public/
```

The Vite config uses `base: "./"` so the build works at any subpath, including GitHub Pages project URLs (`username.github.io/repo-name/`).

## Deploying to GitHub Pages

`.github/workflows/pages.yml` builds and deploys on every push to `main`. After the first push:

1. Open your repo settings → Pages
2. Under "Build and deployment", set Source to **GitHub Actions**
3. Trigger the workflow (push or run manually). Your dashboard will be live at `https://<user>.github.io/<repo>/`.

## Updating the benchmark catalog

Edit `client/src/data/benchmarks.ts` and push. The workflow rebuilds and redeploys automatically — Notion embeds pick up the new version on next reload.
