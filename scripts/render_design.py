#!/usr/bin/env python3
"""Generate review boards from the actual README using GitHub's Markdown renderer.

Requires the existing gh CLI. This performs a rendering request, not a repository
write. Generated boards embed the original banner and share the design tokens.
"""
import base64
import json
import re
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
request = json.dumps({"text": (ROOT / "README.md").read_text(), "mode": "gfm"})
rendered = subprocess.run(
    ["gh", "api", "markdown", "--input", "-"], input=request,
    text=True, capture_output=True, check=True,
).stdout
banner = base64.b64encode((ROOT / "assets/systems-lab.svg").read_bytes()).decode()
rendered = rendered.replace('src="assets/systems-lab.svg"', f'src="data:image/svg+xml;base64,{banner}"')
rendered = rendered.replace('href="assets/systems-lab.svg"', 'href="../../assets/systems-lab.svg"')
# Embed a real counter snapshot only in the offline review boards. Production
# keeps the live external image; no numeric value is fabricated for the preview.
with urllib.request.urlopen(
    "https://komarev.com/ghpvc/?username=thukabjj&color=197b83&style=flat-square&label=Profile+views",
    timeout=20,
) as response:
    counter = base64.b64encode(response.read()).decode()
rendered = re.sub(
    r'(<img[^>]*src=")[^"]+("[^>]*alt="Profile views counter"[^>]*>)',
    lambda match: match[1] + "data:image/svg+xml;base64," + counter + match[2], rendered,
)
# Match GitHub's heading navigation behavior in the standalone preview.
rendered = rendered.replace('id="user-content-', 'id="')
# The Markdown API may omit the heading IDs added by GitHub's profile page.
rendered = re.sub(
    r"<h([12])>([^<]+)</h\1>",
    lambda match: '<h{level} id="{slug}">{text}</h{level}>'.format(
        level=match[1], slug=re.sub(r"[^a-z0-9 -]", "", match[2].lower()).replace(" ", "-"),
        text=match[2],
    ), rendered,
)
template = '''<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arthur Costa — {label} profile preview</title>
<script src="../board.js"></script><link rel="stylesheet" href="../tokens.css">
<link rel="stylesheet" href="../profile.css">
</head>
<body><main class="board {layout}">
<p class="preview-label">LOCAL README PREVIEW · GitHub controls the surrounding page</p>
<article class="markdown-body">{content}</article>
</main></body></html>
'''
for label, layout in [("Desktop", "desktop"), ("Mobile", "mobile")]:
    (ROOT / "design/boards" / f"profile-{layout}.html").write_text(
        template.format(label=label, layout=layout, content=rendered)
    )
print("Generated desktop/mobile boards from README.md and the original SVG.")
