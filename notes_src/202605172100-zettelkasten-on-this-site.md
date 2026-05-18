---
id: 202605172100-zettelkasten-on-this-site
title: "Zettelkasten on this site"
created: 2026-05-17
updated: 2026-05-17
type: hub
status: evergreen
tags: [meta, zettelkasten, thesis]
thesis_chapter: 0
visibility: public
links:
  defines:
    - 202605172101-typed-links
  elaborates:
    - 202605172102-build-pipeline
---

# Zettelkasten on this site

This is the entry point for the Zettelkasten. Notes live in `notes_src/`
as plain markdown with YAML frontmatter. A build script (`scripts/build_notes.py`)
walks the folder, parses each note, resolves links, computes backlinks,
and emits one HTML page per note plus a `notes/index.json` catalog that
the [[202605172101-typed-links|notes browser and graph view]] both consume.

## Conventions

- Filename: `YYYYMMDDHHMM-slug.md`
- Every note must declare an `id` and `title`
- Typed relationships live in `frontmatter.links.<type>` — see [[defines::typed links]] for the eight relations
- Inline `[[type::Note Title]]` syntax adds a typed edge from within prose
- Plain `[[Note Title]]` defaults to `related`
- `visibility: draft` excludes a note from the build entirely

## Why typed links

Every Zettel relates to others, but not every edge is the same. A note
that *contradicts* another should pull differently in the graph than one
that *elaborates* it. The eight types here split into three semantic
clusters — evidential, structural, and interrogative — which the graph
view colors so the shape of the argument becomes visible at a glance.
