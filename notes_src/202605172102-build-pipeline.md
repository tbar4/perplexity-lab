---
id: 202605172102-build-pipeline
title: "Notes build pipeline"
created: 2026-05-17
updated: 2026-05-17
type: permanent
status: growing
tags: [zettelkasten, infrastructure]
visibility: public
links:
  derived_from:
    - 202605172100-zettelkasten-on-this-site
---

# Notes build pipeline

`scripts/build_notes.py` runs on every push to `main` via the Pages
workflow. It:

1. Walks `notes_src/*.md`
2. Skips any note with `visibility: draft`
3. Parses YAML frontmatter and the markdown body
4. Builds a title index for wikilink resolution
5. Resolves frontmatter links and inline `[[type::Note]]` references
6. Computes backlinks by inverting every edge
7. Renders each note to `notes/<id>.html` with sidebar of outgoing + incoming links
8. Emits `notes/index.json` consumed by `notes.html` and `graph.html`

Broken wikilinks render as a struck-through span and emit a warning,
they don't fail the build. This keeps drafts in motion without blocking
deploys.
