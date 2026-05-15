# perplexity-lab

A growing catalog of artifacts built by [Perplexity Computer](https://perplexity.ai/computer) for Trevor.

**Live site:** https://tbar4.github.io/perplexity-lab/

The catalog supports six artifact types:

| Type | What it is | Example primary file |
| --- | --- | --- |
| `app` | Interactive web app / dashboard | `index.html` |
| `doc` | PDF document | `document.pdf` |
| `image` | Image (PNG, JPG, SVG, etc.) | `image.png` |
| `notebook` | Jupyter / Quarto notebook (rendered) | `notebook.html` |
| `dataset` | CSV / Parquet / JSON dataset | `data.csv` |
| `video` | Video (MP4) | `video.mp4` |

## Repo layout

```
perplexity-lab/
├── index.html                 Landing page with tabbed multi-type catalog
├── apps/
│   ├── manifest.json          Catalog of every artifact (all types)
│   ├── manifest.schema.json   JSON Schema for the manifest
│   └── <artifact-id>/         Files for each artifact (regardless of type)
│       ├── <primary-file>     index.html, document.pdf, image.png, etc.
│       └── thumbnail.png      16:10, ~1600x1000
├── sources/
│   └── <artifact-id>/         Original source/raw inputs (apps + notebooks only)
└── .github/workflows/
    └── pages.yml              Publishes index.html + apps/ to GitHub Pages
```

Each artifact is reachable at `https://tbar4.github.io/perplexity-lab/apps/<artifact-id>/`. The landing page links to the primary file directly when one is set (e.g. PDFs open inline).

The `sources/` tree is kept in the repo for reproducibility but is not shipped to the Pages site. Only `app` and `notebook` types typically have a source tree; PDFs, images, datasets, and videos store only the rendered artifact.

## Adding a new artifact

The easiest way is to ask Perplexity Computer to publish it — the `publish-to-lab` skill handles every step below automatically. Manual instructions for reference:

### Apps (interactive web apps)

1. Build with relative asset paths (`base: "./"` in Vite, equivalent in other tools).
2. Copy the built static output to `apps/<id>/`.
3. Copy the source tree to `sources/<id>/` (exclude `node_modules`, `dist`, `.git`).
4. Save a 16:10 thumbnail screenshot to `apps/<id>/thumbnail.png`.
5. Append a manifest entry (see below) with `type: "app"` and `file: "apps/<id>/index.html"`.

### Documents (PDFs)

1. Copy the PDF to `apps/<id>/document.pdf` (or any filename).
2. Render page 1 as a thumbnail at `apps/<id>/thumbnail.png` (`pdftoppm -r 150 -png -f 1 -l 1`).
3. Append a manifest entry with `type: "doc"`, `file: "apps/<id>/<filename>.pdf"`, plus optional `pages`, `size_bytes`, `mime: "application/pdf"`.

### Images

1. Copy the image to `apps/<id>/image.<ext>`.
2. Use a 1600-wide downscaled copy as `apps/<id>/thumbnail.png` (or the image itself if it's already ≤ 1600).
3. Append a manifest entry with `type: "image"`, `file`, `dimensions`, `mime`, `size_bytes`.

### Notebooks

1. If you have an `.ipynb`, render it: `jupyter nbconvert --to html --no-input notebook.ipynb`.
2. Copy the rendered HTML to `apps/<id>/notebook.html`.
3. Screenshot the rendered notebook for the thumbnail.
4. Optionally copy the `.ipynb` source to `sources/<id>/`.
5. Append a manifest entry with `type: "notebook"`, `file: "apps/<id>/notebook.html"`.

### Datasets

1. Copy the file to `apps/<id>/data.<ext>`.
2. Build a small `apps/<id>/preview.html` showing the head and schema, screenshot it for the thumbnail.
3. Append a manifest entry with `type: "dataset"`, `file`, `rows`, `columns`, `size_bytes`, `mime`.

### Videos

1. Copy the MP4 to `apps/<id>/video.mp4`.
2. Extract a poster frame for the thumbnail: `ffmpeg -ss 00:00:01 -i video.mp4 -frames:v 1 thumbnail.png`.
3. Append a manifest entry with `type: "video"`, `file`, `duration_s`, `dimensions`, `size_bytes`.

### Manifest entry shape

```json
{
  "id": "my-artifact",
  "type": "app",
  "title": "My Artifact",
  "subtitle": "Short tagline",
  "description": "What it is and why.",
  "path": "apps/my-artifact/",
  "file": "apps/my-artifact/index.html",
  "thumbnail": "apps/my-artifact/thumbnail.png",
  "source": "sources/my-artifact/",
  "tags": ["research", "interactive"],
  "tech": ["React", "Vite"],
  "built_at": "2026-05-15"
}
```

Type-specific optional fields: `size_bytes`, `mime`, `pages` (doc), `dimensions` (image/video), `duration_s` (video), `rows`/`columns` (dataset).

Commit and push. GitHub Actions auto-deploys to Pages within ~1 minute.

## Current catalog

See [apps/manifest.json](./apps/manifest.json) for the machine-readable list.

| Artifact | Type | Description | URL |
| --- | --- | --- | --- |
| [Planning Lab](./apps/planning-lab/) | app | Interactive comparison of reinforcement learning and transformer next-token prediction for strategic planning, anchored to primary arXiv papers from 2017 to 2026. | [Open](https://tbar4.github.io/perplexity-lab/apps/planning-lab/) |
| [RL in Wargames and Military Simulations](./apps/rl-wargaming-survey/) | doc | 14-page survey of reinforcement learning in DoD wargaming and military simulation. Covers AlphaDogfight, DARPA ACE on X-62A, Gamebreaker, SCEPTER, NPS hierarchical RL, the U.S. Army CGSC AI wargame, DIU Thunderforge, and USAF WarMatrix, with a 12-system comparison table, success metrics, persistent challenges, and a future outlook for 2026 to 2030. | [Open](https://tbar4.github.io/perplexity-lab/apps/rl-wargaming-survey/) |
| [Satellite Conjunction Assessment: Pizza Box Screening Volume](./apps/satellite-conjunction-pizza-box/) | image | Illustration of the standard 'pizza box' screening volume used in satellite conjunction assessment. Shows the primary object at center with a screening box sized T = 44 km in-track and N = 51 km cross-track, plus a radial (R) buffer, set against the trajectories of a primary and a secondary object near Earth. | [Open](https://tbar4.github.io/perplexity-lab/apps/satellite-conjunction-pizza-box/) |
| [SDA·RL Benchmark Index](./apps/sda-rl-bench/) | app | A live, filterable comparison of every reinforcement-learning benchmark in the Space Domain Awareness literature — narrow-FOV SSA environments, OrbitZoo, NORAD TLE agents, Space-Track ephemeris pipelines, Starlink validation, BSK-RL, KSPDG, SPLID — with side-by-side notes on strengths, limitations, and reproducibility. | [Open](https://tbar4.github.io/perplexity-lab/apps/sda-rl-bench/) |
| [SDA·RL Benchmark Index](./apps/sda-rl-benchmarks/) | app | Live, filterable comparison of 20 reinforcement-learning benchmarks across the Space Domain Awareness literature, from the foundational Linares & Furfaro 2016/17 work through 2026 releases (EOS-Bench, SpaceGym proximity ops). Filter by category, dataset type, RSO count, sensor modality, and code/data access. Includes narrow-FOV SSA environments, OrbitZoo (Starlink-validated), NORAD TLE-based agents, Space-Track ephemeris pipelines, BSK-RL, KSPDG, SPLID, MIT-LL SpaceGym, Auburn P-LEO, and more, with side-by-side notes on strengths, limitations, reproducibility, and links to papers and code. | [Open](https://tbar4.github.io/perplexity-lab/apps/sda-rl-benchmarks/) |
