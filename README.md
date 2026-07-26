# niall-roe.github.io

Published, self-contained interactive papers. This repository **owns the live files** — the
copy here is the one that is served, not a copy of something maintained elsewhere. If a page
needs a change, change it here.

## Layout

```
.nojekyll                        serve files as-is, no Jekyll processing
probability-of-induction/
    index.html                   the published page (built — do not hand-edit)
    build.sh                     concatenates src/ into index.html
    src/                         the editable parts
```

One directory per project, each with its own `index.html`, reached at its own URL:

```
https://niall-roe.github.io/probability-of-induction/
```

There is deliberately no root landing page — the index of these pages lives on the Google
Site, which links to each one directly. So `https://niall-roe.github.io/` itself returns a 404;
that is expected and harmless. Add a new project by adding a directory and linking it from the
Google Site.

## Editing a page

`probability-of-induction/index.html` is generated. Edit the parts in `src/`, then:

```bash
cd probability-of-induction && ./build.sh
```

`./build.sh --check` confirms the committed `index.html` matches `src/` without writing
anything — worth running before a commit.

Each page is deliberately a single file with no external requests: no CDN scripts, no web
fonts, no fetches. That is what lets it work offline, over `file://`, and inside a sandboxed
iframe (which is how Google Sites embeds it).

## Publishing

GitHub Pages, **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**. A repository
named `<user>.github.io` is served from the domain root, so URLs have no repository segment:

```
https://niall-roe.github.io/probability-of-induction/
```

The repository must be public for Pages on a free plan.

## Embedding in Google Sites

**Insert → Embed → By URL.** Both GitHub Pages and these pages allow framing, and nothing is
fetched at run time, so the sandbox does not break them.

A caveat worth knowing: Google Sites cannot auto-size an embed. Since these pages are
article-length and grow taller as demonstrations are opened, a link that opens in a new tab
generally reads better than an iframe with a scrollbar inside a scrollbar.

## Provenance

Texts are pre-1900 and in the public domain. Working notes, R sources and the experiments these
pages were derived from live in
[Simulating-Peirce](https://github.com/Niall-Roe/Simulating-Peirce).
