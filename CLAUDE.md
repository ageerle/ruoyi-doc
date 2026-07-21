# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **VitePress documentation site** for the RuoYi AI project, a platform for building AI assistant systems. The documentation is written in Chinese and covers installation, deployment, core features, and integration guides.

## Quick Start Commands

**Install dependencies:**
```bash
npm install
```

**Development server** (hot reload on file changes):
```bash
npm run docs:dev
```
Then visit `http://localhost:5173` (or the displayed URL).

**Build production documentation:**
```bash
npm run docs:build
```

**Preview built documentation locally:**
```bash
npm run docs:preview
```

## Project Structure

```
docs/
├── index.md                          # Homepage
├── guide/
│   └── introduction/                 # Main documentation content
│       ├── projection.md             # Project introduction
│       ├── install.md                # Local installation guide
│       ├── deploy.md                 # Baota deployment guide
│       ├── docker.md                 # Docker deployment guide
│       ├── mcp.md                    # MCP protocol documentation
│       ├── knowledge.md              # Knowledge base guide
│       ├── models-platforms-integration.md
│       ├── ai-programming.md         # AI编程（Claude Code 入门/进阶合并）
│       ├── doc.md                    # API documentation
│       ├── weixin.md                 # WeChat integration
│       ├── aihuman.md                # AI Digital Human
│       ├── coze.md, dify.md, fastgpt.md, model.md, pay.md
│       └── 202508_changeLog.md       # Changelogs (organized by month)
├── public/                           # Static assets (logos, images)
└── .vitepress/
    ├── config.mts                    # VitePress configuration (site title, nav, sidebar)
    ├── theme/
    │   ├── index.ts                  # Theme customization entry
    │   └── custom.css                # Custom styles
    └── components/
        └── VbenContributors.vue      # Contributors display component
```

## Key Architecture

### Navigation & Sidebar (docs/.vitepress/config.mts)
- Top nav bar: Home, Quick Start
- Sidebar sections organized by documentation sections:
  - **Quick Start**: Project intro, installation (local/Baota/Docker)
  - **Core Features**: MCP protocol, knowledge base, model integration
  - **Extended Features**: API docs, WeChat integration
  - **Changelog**: Monthly updates (2025-05 through 2025-08)

### Custom Theme
- **Base**: Extends VitePress default theme
- **Theme entry** (docs/.vitepress/theme/index.ts): Registers custom Vue components
- **Custom styles** (docs/.vitepress/theme/custom.css): Additional CSS overrides
- **Contributors component** (docs/.vitepress/components/VbenContributors.vue):
  - Displays core contributors, team members, and other contributors
  - Interactive cards with tooltips
  - Links to GitHub, WeChat, personal websites
  - Responsive grid layouts

### Markdown Files
- All documentation is written in standard Markdown (`.md`)
- VitePress renders Markdown with syntax highlighting and automatic table of contents
- Supporting Markdown in this project requires no special setup—just edit `.md` files

## Common Development Tasks

### Adding a new documentation page
1. Create a new `.md` file in `docs/guide/introduction/`
2. Update `docs/.vitepress/config.mts` to add the page to the sidebar navigation
3. Run `npm run docs:dev` to preview changes

### Editing existing documentation
- Edit any `.md` file in `docs/guide/introduction/` and save
- Changes will hot-reload automatically in development mode

### Updating the contributors list
- Edit `docs/.vitepress/components/VbenContributors.vue`
- Modify the `coreContributors`, `teamMembers`, or `otherContributors` arrays
- Update contributor information (name, role, bio, avatar URL, GitHub/WeChat/website links)

### Customizing styles
- Global overrides go in `docs/.vitepress/theme/custom.css`
- Component-scoped styles are in the `<style scoped>` sections of Vue components

## Build & Deployment Notes

- **Dead link checking**: The config ignores certain dead links in development (localhost:5666, localhost:1002)
- **Output**: Build outputs to a `dist/` directory (typically gitignored)
- **Theme color**: Primary theme color is `#3c8772` (green)
- **Favicon**: Located at `docs/public/favicon.ico`

## Dependencies

- **VitePress** (`^1.6.3`): The core documentation site generator
- **Node.js**: Required to run npm commands

The project uses npm lockfiles (`package-lock.json` and `pnpm-lock.yaml`) to ensure reproducible installs across environments.