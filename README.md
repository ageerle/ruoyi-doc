# RuoYi AI Documentation

[![VitePress](https://img.shields.io/badge/VitePress-^1.6.3-3c8772)](https://vitepress.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official documentation site for [RuoYi AI](https://github.com/ageerle/ruoyi-ai) — an open-source platform for building AI assistant systems.

## Quick Start

```bash
# Install dependencies
npm install

# Development server (hot reload)
npm run docs:dev

# Build for production
npm run docs:build

# Preview production build
npm run docs:preview
```

---

## Design System

### Color Palette

All colors are defined as CSS custom properties in `docs/.vitepress/theme/variables.css`.

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-primary` | `#3c8772` | Primary brand green — buttons, links, accents |
| `--brand-primary-light` | `#4a9e87` | Lighter variant — gradients, hover states |
| `--brand-primary-lighter` | `#5cb89e` | Even lighter — subtle backgrounds |
| `--brand-primary-lightest` | `#e8f5f1` | Tint — card backgrounds, icon containers |
| `--brand-primary-dark` | `#2d6b5a` | Darker variant — hover on buttons |
| `--brand-primary-darker` | `#1f5042` | Darkest — dark mode gradients |
| `--brand-primary-rgb` | `60, 135, 114` | RGB values for `rgba()` usage |
| `--brand-surface` | `#f8fdfb` | Page background |
| `--brand-surface-soft` | `#f0f9f6` | Card/section backgrounds |
| `--brand-border` | `#d4e8e2` | Borders and dividers |
| `--brand-text-primary` | `#1a2e28` | Primary text |
| `--brand-text-secondary` | `#4a6b60` | Secondary text |
| `--brand-text-muted` | `#7a9b90` | Muted/hint text |

Dark mode overrides are defined under the `.dark` selector in the same file.

### Typography

Font loading is configured in `config.mts` via Google Fonts (`head` array).

| Stack | Fonts | Usage |
|-------|-------|-------|
| Sans | Inter → Noto Sans SC → system fallbacks | Body text, headings, UI |
| Mono | JetBrains Mono → Fira Code → monospace | Code blocks |

Inter handles Latin glyphs with clean, professional letterforms. Noto Sans SC covers CJK (Chinese) glyphs. System fallbacks ensure readability even if fonts fail to load.

### CSS Custom Properties

All design to、














kens follow the `--brand-*` naming convention:

- **Colors**: `--brand-primary-*`, `--brand-surface*`, `--brand-border*`, `--brand-text*`
- **Shadows**: `--brand-shadow-{sm|md|lg|xl}`
- **Radius**: `--brand-radius-{sm|md|lg|xl}` (8px / 12px / 16px / 24px)
- **Transitions**: `--brand-transition-{fast|base|slow}` (150ms / 300ms / 500ms)
- **Fonts**: `--brand-font-{sans|mono}`

### Component Specs

| Component | Border Radius | Shadow | Hover Effect |
|-----------|--------------|--------|--------------|
| Feature Card | `16px` | `brand-shadow-sm` | `translateY(-4px)` + border-color change |
| Contributor Card | `16px` | default | `translateY(-8px)` + gradient overlay |
| Hero Button | — | — | `translateY(-2px)` + shadow |
| Icon Container | `12px` | — | Background fills to `brand-primary` |

### Animations

| Name | Duration | Usage |
|------|----------|-------|
| `heroGradient` | 8s infinite | Animated gradient background on Hero section |
| `fadeInUp` | 0.6s ease | Staggered entry animation for Hero text, Feature cards |

Feature cards use `animation-delay` on `nth-child` selectors (0.1s–0.4s stagger).

### File Structure

```
docs/.vitepress/theme/
├── variables.css    ← Design tokens (imported first)
├── custom.css       ← Global component styles (consumes tokens)
└── index.ts         ← Theme entry, registers variables.css before custom.css
```

**Import order matters**: `variables.css` must load before `custom.css` so custom properties are available.

---

## Internationalization (i18n)

### Architecture

The site uses **VitePress native i18n** — no extra dependencies required.

- **Root locale** (`/`): Chinese (简体中文) — primary language, existing content stays at root
- **English locale** (`/en/`): English — content under `docs/en/` directory

### Directory Structure

```
docs/
├── index.md                    # Chinese homepage (root locale)
├── guide/                      # Chinese content (existing, unchanged)
│   ├── getting-started/
│   ├── features/
│   ├── ai-coding/
│   ├── extensions/
│   └── changelog/
├── en/                         # English locale
│   ├── index.md                # English homepage
│   └── guide/
│       ├── getting-started/
│       ├── features/
│       ├── ai-coding/
│       ├── extensions/
│       └── changelog/
└── .vitepress/
    ├── config.mts              # locales: { root: {...}, en: {...} }
    ├── theme/
    │   ├── variables.css
    │   ├── custom.css
    │   └── index.ts
    ├── components/
    │   ├── VbenContributors.vue   # i18n-aware (detects locale)
    │   ├── ContributorCard.vue    # accepts `locale` prop
    │   └── ContributorTooltip.vue # accepts `locale` prop
    └── data/
        └── contributors.ts       # LocalizedText: { zh, en }
```

### Config Structure

`config.mts` uses VitePress's `locales` configuration:

```ts
locales: {
  root: {
    label: '简体中文',
    lang: 'zh-CN',
    themeConfig: { nav, sidebar, search, ... }
  },
  en: {
    label: 'English',
    lang: 'en',
    themeConfig: { nav, sidebar, search, ... }
  }
}
```

VitePress automatically adds a language switcher in the navigation bar.

### Localized Data

Contributor data uses the `LocalizedText` type for bilingual fields:

```ts
interface LocalizedText {
  zh: string
  en: string
}

// Helper function
function getLocalizedText(field: string | LocalizedText, locale: 'zh' | 'en'): string
```

Components detect the current locale via `useData().localeLang` and pass it to child components.

### Adding a New Language

1. Create `docs/{lang}/` directory mirroring the Chinese structure
2. Add a locale entry in `config.mts`:
   ```ts
   locales: {
     root: { /* Chinese */ },
     en: { /* English */ },
     ja: {
       label: '日本語',
       lang: 'ja',
       themeConfig: { nav, sidebar, search, ... }
     }
   }
   ```
3. Translate `.md` files into the new directory
4. Update `LocalizedText` type and contributor data to include the new locale key

### Component i18n Pattern

All contributor-related components accept a `locale` prop:

```vue
<ContributorCard :contributor="c" :locale="locale" />
<ContributorTooltip :contributor="c" :locale="locale" />
```

Section headings are translated via a `translations` map in `VbenContributors.vue`:

```ts
const translations = {
  zh: { title: '项目贡献者', coreTitle: '核心贡献者', ... },
  en: { title: 'Contributors', coreTitle: 'Core Contributors', ... }
}
```

---

## Project Structure

```
ruoyi-doc/
├── README.md                          # This file
├── package.json                       # Dependencies (vitepress, sharp)
├── docs/
│   ├── index.md                       # Chinese homepage
│   ├── guide/                         # Chinese documentation
│   ├── en/                            # English locale
│   │   ├── index.md                   # English homepage
│   │   └── guide/                     # English documentation (WIP)
│   ├── public/                        # Static assets (images, favicon, logo)
│   └── .vitepress/
│       ├── config.mts                 # Site config with i18n locales
│       ├── theme/
│       │   ├── index.ts               # Theme entry
│       │   ├── variables.css          # Design tokens
│       │   └── custom.css             # Global styles
│       ├── components/
│       │   ├── VbenContributors.vue   # Contributors section
│       │   ├── ContributorCard.vue    # Contributor card
│       │   └── ContributorTooltip.vue # Hover tooltip
│       └── data/
│           └── contributors.ts        # Contributor data (bilingual)
└── scripts/
    └── convert-to-webp.js             # Image optimization utility
```

## Contributing

### Adding a Documentation Page

1. Create a `.md` file in `docs/guide/{section}/`
2. Update `config.mts` sidebar under the `root` locale
3. Create a corresponding English placeholder in `docs/en/guide/{section}/`
4. Update the `en` locale sidebar

### Updating Contributors

Edit `docs/.vitepress/data/contributors.ts`. Each contributor's `role` and `bio` fields support both `string` and `LocalizedText` (`{ zh, en }`) formats.

### Styling Guidelines

- Use `--brand-*` CSS custom properties instead of hardcoded colors
- Keep `variables.css` as the single source of truth for design tokens
- All new styles go in `custom.css` (after `variables.css` import)
- Support both light and dark mode (define `.dark` overrides for new tokens)

## License

MIT
