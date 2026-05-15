# perplexity-lab

A growing catalog of interactive web apps built by [Perplexity Computer](https://perplexity.ai/computer) for Trevor.

**Live site:** https://tbar4.github.io/perplexity-lab/

## Repo layout

```
perplexity-lab/
├── index.html                 Landing page (reads apps/manifest.json)
├── apps/
│   ├── manifest.json          Catalog of every deployed app
│   ├── manifest.schema.json   JSON Schema for the manifest
│   └── <app-id>/              Pre-built static output for each app
│       ├── index.html
│       ├── assets/...
│       └── thumbnail.png
├── sources/
│   └── <app-id>/              Original source code for each app
└── .github/workflows/
    └── pages.yml              Publishes index.html + apps/ to GitHub Pages
```

Each app lives at `https://tbar4.github.io/perplexity-lab/apps/<app-id>/`.

The `sources/` tree is kept in the repo for reproducibility but is not shipped to the Pages site. To rebuild an app locally:

```bash
cd sources/<app-id>
npm install
npm run build
cp -r dist/public/* ../../apps/<app-id>/
```

## Adding a new app

1. Build the app locally with relative asset paths (`base: "./"` in Vite, equivalent in other tools).
2. Copy the built static output to `apps/<app-id>/`.
3. Copy the source tree to `sources/<app-id>/` (exclude `node_modules`, `dist`, `.git`).
4. Save a thumbnail screenshot to `apps/<app-id>/thumbnail.png` (16:10 aspect, ~1600x1000 ideal).
5. Append an entry to `apps/manifest.json`:

   ```json
   {
     "id": "my-app",
     "title": "My App",
     "subtitle": "Short tagline",
     "description": "What it does and why.",
     "path": "apps/my-app/",
     "thumbnail": "apps/my-app/thumbnail.png",
     "source": "sources/my-app/",
     "tags": ["research", "interactive"],
     "tech": ["React", "Vite"],
     "built_at": "2026-05-15"
   }
   ```

6. Commit and push. GitHub Actions auto-deploys to Pages within ~1 minute.

## Current catalog

See [apps/manifest.json](./apps/manifest.json) for the machine-readable list.

| App | Description | URL |
| --- | --- | --- |
| [Planning Lab](./apps/planning-lab/) | RL vs Transformer next-token prediction for strategic planning, anchored to arXiv 2017-2026 | [Open](https://tbar4.github.io/perplexity-lab/apps/planning-lab/) |
