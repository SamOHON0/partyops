# PartyOps brand kit

Logo system for **partyops.app** — built on the "Stacked Tiles" mark (two booking
cards stacked, front one holding a date dot). Violet + ink, Inter wordmark.

## Files

| File | Use |
|---|---|
| `logo.svg` | Primary horizontal lockup (mark + wordmark). **Inline it in HTML** so it picks up Inter. |
| `logo-white.svg` | Same lockup for dark backgrounds. |
| `mark.svg` | Mark only (full colour). |
| `mark-white.svg` | Mark only, for dark backgrounds. |
| `mark-mono.svg` | Mark in a single colour — uses `currentColor`, so set `color:` to recolour. |
| `icon.svg` | App icon — rounded violet tile + white mark. For PWA / apple-touch. |
| `favicon.svg` | Simplified mark, legible down to 16px. Modern SVG favicon. |
| `png/logo-lockup.png` | Raster lockup (white bg) for email, decks, anywhere SVG won't go. |
| `png/mark-512.png` | Mark, 512px, transparent. |
| `png/icon-512.png` | App icon, 512px. |
| `png/apple-touch-icon.png` | 180px, for iOS home-screen. |
| `png/favicon-32.png`, `png/favicon-16.png` | PNG favicon fallbacks. |
| `png/og-image.png` | 1200×630 social share / Open Graph image. |

## Colours

| Token | Hex | Use |
|---|---|---|
| Violet (primary) | `#7C3AED` | Brand, links, primary buttons, "Ops" |
| Violet hover | `#6D28D9` | Hover / pressed |
| Violet light | `#A78BFA` | Back tile, accents |
| Violet wash | `#F5F3FF` | Tinted section backgrounds |
| Ink | `#1E1B2E` | Headings, "Party", body |
| White | `#FFFFFF` | Surfaces |

## Type

**Inter** — wordmark is Inter 800 (Black), `letter-spacing: -0.035em`.

## Drop-in code

Favicons + OG (put the files at your site root or adjust the paths):

```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta property="og:image" content="https://partyops.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

Header lockup as live HTML (crisp at any size, real text):

```html
<a class="po-logo" href="/">
  <svg viewBox="0 0 96 98" width="34" height="35" aria-hidden="true">
    <rect x="34" y="10" width="50" height="50" rx="14" fill="#A78BFA"/>
    <path fill="#7C3AED" fill-rule="evenodd"
      d="M12 46 a14 14 0 0 1 14 -14 h22 a14 14 0 0 1 14 14 v22 a14 14 0 0 1 -14 14 h-22 a14 14 0 0 1 -14 -14 Z M37 57 a11 11 0 1 0 0.01 0 Z"/>
  </svg>
  <span>Party<span class="ops">Ops</span></span>
</a>
```
```css
.po-logo{display:inline-flex;align-items:center;gap:9px;text-decoration:none;
  font-family:Inter,system-ui,sans-serif;font-weight:800;letter-spacing:-.035em;
  font-size:24px;color:#1E1B2E;}
.po-logo .ops{color:#7C3AED;}
```

## Usage rules

- **Clear space:** keep at least the height of the mark's dot clear on every side.
- **Min size:** mark no smaller than 20px; full lockup no smaller than 120px wide.
- **Don't** recolour the tiles, separate them, stretch the lockup, add shadows, or
  place the colour mark on a busy photo (use `-white` on a solid plate instead).
