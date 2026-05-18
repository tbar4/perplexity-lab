#!/usr/bin/env python3
"""
Build the Zettelkasten section of the thesis site.

Reads:   notes_src/*.md  (with YAML frontmatter)
Writes:  notes/<id>.html
         notes/index.json   (catalog + resolved links + backlinks)

Conventions:
  - Each note's filename stem MAY be the id; if not, frontmatter id wins.
  - Drafts (visibility: draft) are excluded entirely from the build.
  - Inline [[type::Note Title or id]] becomes a typed link; plain
    [[Note Title or id]] becomes a 'related' link.
  - Wikilink targets resolve by exact id first, then by case-insensitive title.
  - Backlinks are computed by inverting every outgoing link.

Run from the repo root:  python3 scripts/build_notes.py

This script is also used by GitHub Actions during the Pages deploy. See
.github/workflows/pages.yml.
"""

from __future__ import annotations

import html
import json
import re
import sys
from datetime import date
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    sys.stderr.write("Missing dependency: pyyaml. Install with `pip install pyyaml markdown-it-py`.\n")
    raise

try:
    from markdown_it import MarkdownIt  # type: ignore
    from markdown_it.tree import SyntaxTreeNode  # noqa: F401
except ImportError:
    sys.stderr.write("Missing dependency: markdown-it-py. Install with `pip install markdown-it-py`.\n")
    raise


REPO = Path(__file__).resolve().parents[1]
NOTES_SRC = REPO / "notes_src"
NOTES_OUT = REPO / "notes"

LINK_TYPES = (
    "references", "elaborates", "supports", "contradicts",
    "example_of", "defines", "questions", "derived_from", "related",
)

# Semantic clusters for graph coloring
LINK_CLUSTER = {
    "references": "evidential",
    "supports": "evidential",
    "contradicts": "evidential",
    "example_of": "evidential",
    "elaborates": "structural",
    "defines": "structural",
    "derived_from": "structural",
    "questions": "interrogative",
    "related": "associative",
}

FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
# [[type::Target]] or [[Target]]
WIKILINK_RE = re.compile(r"\[\[(?:(?P<type>[a-z_]+)::)?(?P<target>[^\[\]\n|]+?)(?:\|(?P<alias>[^\[\]\n]+?))?\]\]")
# Mask fenced code blocks, indented code blocks, and inline code so wikilinks
# inside them are NOT treated as links.
FENCED_RE = re.compile(r"(^|\n)(```|~~~)[^\n]*\n.*?\n\2", re.DOTALL)
INLINE_CODE_RE = re.compile(r"`[^`\n]+`")


def parse_frontmatter(text: str):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return {}, text
    fm = yaml.safe_load(m.group(1)) or {}
    body = text[m.end():]
    return fm, body


def discover_notes():
    """Return list of (path, frontmatter, body) for all non-draft notes."""
    notes = []
    if not NOTES_SRC.exists():
        return notes
    for p in sorted(NOTES_SRC.glob("*.md")):
        text = p.read_text(encoding="utf-8")
        fm, body = parse_frontmatter(text)
        if fm.get("visibility", "public") == "draft":
            continue
        if "id" not in fm:
            fm["id"] = p.stem  # fall back to filename
        if "title" not in fm:
            fm["title"] = fm["id"]
        notes.append((p, fm, body))
    return notes


def build_title_index(notes):
    """Map both id and lowercased title to id, for wikilink resolution."""
    idx = {}
    for _, fm, _ in notes:
        idx[fm["id"]] = fm["id"]
        idx[fm["title"].lower()] = fm["id"]
    return idx


def resolve_wikilinks(body: str, title_index: dict, on_link):
    """
    Replace [[...]] with <a> tags, but leave anything inside code blocks /
    inline code alone. Call on_link(link_type, target_id, raw) for every
    successfully resolved link so the caller can build edges. Unresolved
    links render as a span with a warning class.
    """
    placeholders = {}

    def stash(m):
        key = f"\x00CODE{len(placeholders)}\x00"
        placeholders[key] = m.group(0)
        return key

    masked = FENCED_RE.sub(stash, body)
    masked = INLINE_CODE_RE.sub(stash, masked)

    def repl(m):
        link_type = m.group("type") or "related"
        target_raw = m.group("target").strip()
        alias = (m.group("alias") or "").strip()
        target_id = title_index.get(target_raw) or title_index.get(target_raw.lower())
        if target_id:
            on_link(link_type, target_id, target_raw)
            display = alias or target_raw
            return (
                f'<a class="wikilink wikilink-{link_type}" '
                f'href="./{target_id}.html" '
                f'data-link-type="{link_type}">{html.escape(display)}</a>'
            )
        return (
            f'<span class="wikilink-broken" title="Unresolved: {html.escape(target_raw)}">'
            f'[[{html.escape(target_raw)}]]</span>'
        )

    replaced = WIKILINK_RE.sub(repl, masked)
    for key, original in placeholders.items():
        replaced = replaced.replace(key, original)
    return replaced


def render_markdown(body: str) -> str:
    md = MarkdownIt("commonmark", {"html": False, "linkify": True, "typographer": True})
    md.enable(["table", "strikethrough"])
    return md.render(body)


def page_html(fm: dict, body_html: str, backlinks: list[dict]) -> str:
    """Render one note page."""
    tags = fm.get("tags") or []
    tag_html = " ".join(
        f'<span class="tag">{html.escape(t)}</span>' for t in tags
    )

    # Outgoing links section
    links_obj = fm.get("links") or {}
    outgoing_sections = []
    for kind in LINK_TYPES:
        if kind == "related":
            # 'related' from wikilinks is shown separately
            continue
        items = links_obj.get(kind) or []
        if not items:
            continue
        rows = "".join(
            f'<li><a href="./{html.escape(i)}.html" class="wikilink wikilink-{kind}">{html.escape(i)}</a></li>'
            for i in items
        )
        outgoing_sections.append(
            f'<section class="link-group link-{kind}">'
            f'<h3>{html.escape(kind.replace("_", " "))}</h3>'
            f'<ul>{rows}</ul></section>'
        )
    outgoing_html = "\n".join(outgoing_sections) or '<p class="empty">No outgoing links.</p>'

    # Backlinks
    if backlinks:
        bl_groups = {}
        for b in backlinks:
            bl_groups.setdefault(b["type"], []).append(b)
        bl_sections = []
        for kind, items in bl_groups.items():
            inverse_label = {
                "references": "referenced by",
                "elaborates": "elaborated by",
                "supports": "supported by",
                "contradicts": "contradicted by",
                "example_of": "has example",
                "defines": "term used in",
                "questions": "questioned by",
                "derived_from": "source of",
                "related": "related to",
            }.get(kind, kind)
            rows = "".join(
                f'<li><a href="./{html.escape(b["from"])}.html" class="wikilink wikilink-{kind}">'
                f'{html.escape(b["from_title"])}</a></li>'
                for b in items
            )
            bl_sections.append(
                f'<section class="link-group link-{kind}">'
                f'<h3>{html.escape(inverse_label)}</h3>'
                f'<ul>{rows}</ul></section>'
            )
        backlinks_html = "\n".join(bl_sections)
    else:
        backlinks_html = '<p class="empty">No backlinks yet.</p>'

    meta_bits = []
    if fm.get("type"):
        meta_bits.append(f'<span class="zettel-type zt-{html.escape(fm["type"])}">{html.escape(fm["type"])}</span>')
    if fm.get("status"):
        meta_bits.append(f'<span class="status st-{html.escape(fm["status"])}">{html.escape(fm["status"])}</span>')
    if fm.get("thesis_chapter") is not None:
        meta_bits.append(f'<span class="chapter">ch. {fm["thesis_chapter"]}</span>')
    if fm.get("updated"):
        meta_bits.append(f'<span class="date">updated {html.escape(str(fm["updated"]))}</span>')
    elif fm.get("created"):
        meta_bits.append(f'<span class="date">created {html.escape(str(fm["created"]))}</span>')

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(fm["title"])} · Trevor Barnes · Thesis</title>
<link rel="stylesheet" href="./note.css" />
</head>
<body>
<header class="top">
  <div class="container top-row">
    <a class="brand" href="../">
      <div class="logo">T</div>
      <div class="brand-text">
        <h1>Trevor Barnes · Thesis</h1>
        <p>Space Studies · UND</p>
      </div>
    </a>
    <nav class="top-nav">
      <a href="../">Home</a>
      <a href="../notes.html">Notes</a>
      <a href="../graph.html">Graph</a>
    </nav>
  </div>
</header>
<main class="container">
  <article class="note">
    <div class="note-meta">{' · '.join(meta_bits)}</div>
    <h1 class="note-title">{html.escape(fm["title"])}</h1>
    <div class="note-id">{html.escape(fm["id"])}</div>
    <div class="note-tags">{tag_html}</div>
    <div class="note-body">{body_html}</div>
  </article>
  <aside class="note-side">
    <h2>Outgoing</h2>
    {outgoing_html}
    <h2>Backlinks</h2>
    {backlinks_html}
  </aside>
</main>
</body>
</html>
"""


CSS = """
:root {
  --bg:#0a0a0b; --bg-elev:#111114; --bg-card:#141418;
  --border:#1f1f25; --border-strong:#2a2a32;
  --text:#e8e8ec; --text-dim:#a0a0aa; --text-faint:#6a6a74;
  --cyan:#22d3ee; --amber:#fbbf24; --violet:#a78bfa; --green:#10b981; --rose:#fb7185;
  --evidential:#22d3ee; --structural:#a78bfa; --interrogative:#fbbf24; --associative:#6a6a74;
}
* { box-sizing: border-box; }
html,body { margin:0; padding:0; background:var(--bg); color:var(--text); font-family: -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif; }
a { color: var(--cyan); text-decoration: none; }
a:hover { text-decoration: underline; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
header.top { border-bottom: 1px solid var(--border); background: rgba(10,10,11,0.8); backdrop-filter: blur(12px); position:sticky; top:0; z-index:10; }
.top-row { display:flex; align-items:center; justify-content:space-between; padding:16px 0; }
.brand { display:flex; align-items:center; gap:12px; color:inherit; }
.brand:hover { text-decoration: none; }
.logo { width:36px; height:36px; background:linear-gradient(135deg,var(--cyan),var(--violet)); border-radius:10px; display:grid; place-items:center; font-weight:700; color:#0a0a0b; }
.brand-text h1 { margin:0; font-size:16px; font-weight:600; letter-spacing:-0.01em; }
.brand-text p { margin:0; font-size:11px; color:var(--text-faint); letter-spacing:0.08em; text-transform:uppercase; }
.top-nav { display:flex; gap:18px; font-size:13px; }
.top-nav a { color: var(--text-dim); }
.top-nav a:hover { color: var(--text); text-decoration:none; }
main { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 32px; padding: 32px 24px 80px; max-width:1200px; margin:0 auto; }
.note { min-width: 0; }
.note-meta { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; font-size:11px; font-family: ui-monospace, monospace; }
.note-meta > span { padding:2px 8px; border-radius:999px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-dim); letter-spacing:0.04em; }
.zettel-type.zt-permanent { color: var(--cyan); border-color: rgba(34,211,238,0.3); }
.zettel-type.zt-literature { color: var(--amber); border-color: rgba(251,191,36,0.3); }
.zettel-type.zt-fleeting { color: var(--text-faint); }
.zettel-type.zt-hub { color: var(--violet); border-color: rgba(167,139,250,0.3); }
.zettel-type.zt-source { color: var(--rose); border-color: rgba(251,113,133,0.3); }
.status.st-evergreen { color: var(--green); border-color: rgba(16,185,129,0.3); }
.status.st-growing { color: var(--amber); border-color: rgba(251,191,36,0.3); }
.status.st-seedling { color: var(--text-faint); }
.note-title { font-size:34px; font-weight:600; letter-spacing:-0.02em; margin:8px 0 4px; line-height:1.15; }
.note-id { font-family: ui-monospace, monospace; font-size:12px; color:var(--text-faint); margin-bottom:14px; }
.note-tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:24px; }
.tag { font-size:10px; padding:3px 8px; border-radius:999px; background:var(--bg-elev); border:1px solid var(--border); color:var(--text-dim); letter-spacing:0.04em; text-transform:uppercase; font-family: ui-monospace, monospace; }
.note-body { font-size:16px; line-height:1.7; color:var(--text); }
.note-body h1, .note-body h2, .note-body h3 { letter-spacing:-0.01em; margin-top:1.4em; }
.note-body h1 { font-size:24px; }
.note-body h2 { font-size:20px; }
.note-body h3 { font-size:17px; }
.note-body pre { background:var(--bg-card); border:1px solid var(--border); padding:14px; border-radius:8px; overflow-x:auto; font-size:13px; }
.note-body code { background:var(--bg-card); padding:2px 6px; border-radius:4px; font-size:0.9em; }
.note-body pre code { background:none; padding:0; }
.note-body blockquote { border-left: 3px solid var(--border-strong); margin: 1em 0; padding: 0 16px; color: var(--text-dim); }
.note-body table { border-collapse: collapse; margin: 1em 0; }
.note-body th, .note-body td { border:1px solid var(--border); padding:6px 10px; }
.note-body th { background: var(--bg-card); }
.wikilink { color: var(--cyan); border-bottom: 1px dashed currentColor; }
.wikilink:hover { text-decoration: none; border-bottom-style: solid; }
.wikilink-references, .wikilink-supports, .wikilink-contradicts, .wikilink-example_of { color: var(--evidential); }
.wikilink-elaborates, .wikilink-defines, .wikilink-derived_from { color: var(--structural); }
.wikilink-questions { color: var(--interrogative); }
.wikilink-related { color: var(--text-dim); }
.wikilink-broken { color: var(--rose); border-bottom: 1px dotted currentColor; }
.note-side { font-size: 13px; }
.note-side h2 { font-size:11px; color:var(--text-faint); letter-spacing:0.12em; text-transform:uppercase; margin: 0 0 12px; font-weight: 500; }
.note-side h2:not(:first-child) { margin-top: 32px; }
.link-group { margin-bottom: 16px; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; }
.link-group h3 { margin:0 0 8px; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; color: var(--text-dim); font-weight:500; font-family: ui-monospace, monospace; }
.link-group ul { margin:0; padding:0 0 0 14px; }
.link-group li { margin:2px 0; }
.link-references h3, .link-supports h3, .link-contradicts h3, .link-example_of h3 { color: var(--evidential); }
.link-elaborates h3, .link-defines h3, .link-derived_from h3 { color: var(--structural); }
.link-questions h3 { color: var(--interrogative); }
.empty { color: var(--text-faint); font-style: italic; font-size: 12px; margin: 0; }
@media (max-width: 900px) {
  main { grid-template-columns: 1fr; }
}
"""


def build():
    notes = discover_notes()
    if not notes:
        print("No notes found in notes_src/.")
        NOTES_OUT.mkdir(parents=True, exist_ok=True)
        (NOTES_OUT / "index.json").write_text(json.dumps({"notes": [], "edges": [], "updated_at": date.today().isoformat()}, indent=2))
        (NOTES_OUT / "note.css").write_text(CSS)
        return

    title_index = build_title_index(notes)
    NOTES_OUT.mkdir(parents=True, exist_ok=True)

    # Collect edges from BOTH frontmatter and inline wikilinks
    edges = []  # list of {from, to, type, cluster}
    id_to_title = {fm["id"]: fm["title"] for _, fm, _ in notes}

    # First pass: parse + render each note (collects inline-link edges)
    rendered = {}  # id -> (fm, body_html_with_wikilinks_resolved, collected_inline_edges)
    for path, fm, body in notes:
        inline_edges = []

        def on_link(link_type, target_id, raw, _from=fm["id"]):
            inline_edges.append({
                "from": _from,
                "to": target_id,
                "type": link_type,
                "cluster": LINK_CLUSTER.get(link_type, "associative"),
                "source": "inline",
            })

        body_with_links = resolve_wikilinks(body, title_index, on_link)
        body_html = render_markdown(body_with_links)
        rendered[fm["id"]] = (fm, body_html, inline_edges)

        # Frontmatter edges
        for link_type in LINK_TYPES:
            for target in (fm.get("links") or {}).get(link_type, []) or []:
                target_id = title_index.get(target) or title_index.get(str(target).lower())
                if not target_id:
                    print(f"WARN  {fm['id']}: unresolved {link_type} -> {target}")
                    continue
                edges.append({
                    "from": fm["id"],
                    "to": target_id,
                    "type": link_type,
                    "cluster": LINK_CLUSTER.get(link_type, "associative"),
                    "source": "frontmatter",
                })

        edges.extend(inline_edges)

    # Build backlinks index
    backlinks_by_id = {nid: [] for nid in id_to_title}
    seen = set()
    for e in edges:
        key = (e["from"], e["to"], e["type"])
        if key in seen:
            continue
        seen.add(key)
        if e["to"] in backlinks_by_id:
            backlinks_by_id[e["to"]].append({
                "from": e["from"],
                "from_title": id_to_title.get(e["from"], e["from"]),
                "type": e["type"],
                "cluster": e["cluster"],
            })

    # Second pass: write HTML pages
    for nid, (fm, body_html, _) in rendered.items():
        out = page_html(fm, body_html, backlinks_by_id.get(nid, []))
        (NOTES_OUT / f"{nid}.html").write_text(out, encoding="utf-8")

    # Catalog
    catalog = {
        "updated_at": date.today().isoformat(),
        "notes": [
            {
                "id": fm["id"],
                "title": fm["title"],
                "type": fm.get("type"),
                "status": fm.get("status"),
                "tags": fm.get("tags") or [],
                "thesis_chapter": fm.get("thesis_chapter"),
                "created": str(fm.get("created") or ""),
                "updated": str(fm.get("updated") or ""),
                "out_count": sum(1 for e in edges if e["from"] == fm["id"]),
                "in_count": len(backlinks_by_id.get(fm["id"], [])),
                "path": f"notes/{fm['id']}.html",
            }
            for _, fm, _ in notes
        ],
        "edges": [
            # Deduplicate for the graph
            {"from": e["from"], "to": e["to"], "type": e["type"], "cluster": e["cluster"]}
            for e in {(e["from"], e["to"], e["type"]): e for e in edges}.values()
        ],
    }
    (NOTES_OUT / "index.json").write_text(json.dumps(catalog, indent=2))
    (NOTES_OUT / "note.css").write_text(CSS)

    print(f"Built {len(notes)} notes, {len(catalog['edges'])} edges -> {NOTES_OUT}")


if __name__ == "__main__":
    build()
