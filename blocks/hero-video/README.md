# Hero Video Block

Full-bleed autoplaying video background with a bottom-anchored text overlay.
Visually identical to the `hero` block — the background image is replaced by a
looping, muted MP4 (or WebM) video sourced from any direct video URL (e.g. Replicate).

---

## How EDS document authoring tables work

In Google Docs or Microsoft Word, authors create blocks by drawing a table.
The rules are:

1. **First row, first cell** = block name (must match the folder name exactly, case-insensitive).
   Variants are added with a space: `Hero Video (dark)`.
2. **Remaining rows** = content fields, read top-to-bottom, left-to-right.
3. **Multiple columns** in one row = sibling content in that field (e.g. two images side by side).
4. Authors can paste links, images, headings, bullet lists, etc. directly into cells — the
   backend converts everything to clean semantic HTML before your JS decorates it.

The table is converted to this HTML structure at request time:

```
<div class="hero-video">          ← block root  (class = block name, kebab-cased)
  <div>                           ← row
    <div>…cell content…</div>     ← column
  </div>
  <div>                           ← next row
    <div>…cell content…</div>
  </div>
</div>
```

---

## How to add buttons / links

**This is the most important authoring rule.**

EDS only turns a link into a styled button when it is formatted in the document.
The formatting controls which button style is applied:

| What you type in the doc | Result | Button class |
|---|---|---|
| **[Register Now](https://…)** (bold) | Primary button (filled) | `.button.primary` |
| *[Learn More](https://…)* (italic) | Secondary button (outline) | `.button.secondary` |
| ***[Buy Now](https://…)*** (bold + italic) | Accent button (high-impact) | `.button.accent` |
| [plain link](https://…) (no formatting) | First plain link → primary, second → secondary | auto |

### Step-by-step in Google Docs

1. Type your link text, e.g. `Register Now`
2. Select the text and press `Ctrl+K` (or `Cmd+K`) to insert the link URL
3. While the text is still selected, press `Ctrl+B` to make it **bold** → primary button
   — or `Ctrl+I` to make it *italic* → secondary button
4. Each CTA link must be in its **own paragraph** (its own line / Enter after each one)

### Step-by-step in Microsoft Word

Same as above — bold (`Ctrl+B`) = primary, italic (`Ctrl+I`) = secondary.
Each link must be on its own line.

### Example table layout

`+----------------------------------------------+`
`| Hero Video                                   |`
`+----------------------------------------------+`
`| https://replicate.delivery/…/video.mp4       |`
`+----------------------------------------------+`
`| Adobe Summit 2025                            |`
`+----------------------------------------------+`
`| # The Future of Experience                   |`
`+----------------------------------------------+`
`| Join thousands of digital experience         |`
`| professionals at the world's largest         |`
`| digital experience conference.               |`
`+----------------------------------------------+`
`| **[Register Now](https://adobe.com/summit)** |`  ← bold = primary button
`+----------------------------------------------+`
`| *[Learn More](https://adobe.com/agenda)*     |`  ← italic = secondary button
`+----------------------------------------------+`

---

## Full field reference

| Row | Content | Notes |
|-----|---------|-------|
| 1 | Direct video URL (MP4, WebM, OGG, MOV) | Required. Paste as a plain hyperlink — no bold/italic needed here. The block detects the file extension automatically. |
| 2 | Short text (< 50 chars, no link) | Optional. Rendered as a pill-shaped badge / eyebrow label above the heading. |
| 3 | Heading (H1 or H2) | Recommended. H1 gets the per-character rainbow wave animation. |
| 4 | Body paragraph | Optional. Rendered with a left cyan border. Multiple paragraphs allowed. |
| 5+ | **Bold** or *italic* link, one per row | Optional. Bold → primary button, italic → secondary. |

---

## Authoring tips

- Paste the raw video URL as a plain hyperlink in its own row — do NOT bold/italic it.
  The block detects `.mp4 / .webm / .ogg / .mov` at the end of the URL automatically.
- Put each CTA button on its own paragraph / table row.
- The video row can appear anywhere in the table; row order does not matter for the video field.
- Autoplay is always **muted** (required by all browsers). If the viewer's data-saver
  setting blocks autoplay, video player controls appear automatically as a fallback.

---

## DOM output (for developers)

```
.hero-video
  .hero-video-image
    video.hero-video-media   ← autoplay muted loop playsinline
  .hero-content
    .hero-text
      p.hero-badge?          ← eyebrow / badge (optional)
      h1                     ← heading
        span.hero-char       ← one per character (wave animation)
      p                      ← description (optional)
      .hero-buttons?         ← wraps CTA anchor tags
        p > a.button.primary
        p > a.button.secondary?
```

---

## Supported video sources

Any publicly accessible direct video file URL works:

- Replicate delivery CDN — `https://replicate.delivery/…/video.mp4`
- Any CDN-hosted `.mp4` or `.webm`
- Self-hosted video files served over HTTPS

YouTube and Vimeo embed URLs are **not** supported here — use the `embed` block for those.
