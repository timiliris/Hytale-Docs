---
id: overview
title: Modding Overview
sidebar_label: Overview
sidebar_position: 1
description: Complete guide to Hytale modding - plugins, data assets, and art assets
---

# Modding Overview

Hytale was built from the ground up with modding at its core. This section covers everything you need to know about creating content for Hytale.

## Philosophy

> "Our goal is to enable modders to replicate everything we do using the same tools we use internally."
> — Hypixel Studios

### "One Community, One Client"

Unlike Minecraft, where players often struggle with version mismatches and complex modpack installations, Hytale removes the friction entirely with its **server-side approach**:

- Even single-player mode runs via a local server
- Players join any modded server without installing mods
- The server automatically sends all required content
- One clean client for all servers - no modded clients supported

> "The guiding principle is to avoid needing a modded client."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

### Benefits

| Benefit | Description |
|---------|-------------|
| **Seamless Experience** | Switch servers without configuration |
| **Instant Updates** | Mod changes apply immediately |
| **Enhanced Security** | No modified clients |
| **Simple UX** | No modpack management |

## Mod Categories

### 1. Server Plugins (Java)

Java-based plugins for deep server control:

- Written in Java, packaged as `.jar` files
- Similar to Bukkit/Spigot plugins
- Access to full server API
- Requires programming knowledge

**Use cases:**
- Custom commands
- Economy systems
- Minigame logic
- Protection plugins
- Admin tools

[Learn more about Plugins →](/docs/modding/plugins/overview)

### 2. Data Assets (JSON)

JSON configuration files for game content:

- Editable via Asset Editor (no coding required)
- Can be combined with Plugins
- Live reload support

**Configurable elements:**
- Blocks and items
- NPCs and behaviors
- Loot tables
- World generation

[Learn more about Data Assets →](/docs/modding/data-assets/overview)

### 3. Art Assets

Visual content for your mods:

- 3D Models (`.blockymodel`)
- Animations (`.blockyanim`)
- Textures (PNG, 32px or 64px per unit)
- Sound effects

**Primary tool:** [Blockbench](https://blockbench.net) with [official Hytale plugin](https://github.com/JannisX11/hytale-blockbench-plugin)

[Learn more about Art Assets →](/docs/modding/art-assets/overview)

### 4. Visual Scripting (Coming Soon)

Node-based scripting inspired by Unreal Engine Blueprints:

- No coding required - design logic visually
- Create game mechanics by connecting nodes
- Bridges gap between designers and programmers
- Programmers can create custom nodes in Java

> "Visual scripting bridges the gap between designers and programmers. Designers can build logic visually without syntax errors."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

## Development Tools

### Official Tools

| Tool | Purpose | Status |
|------|---------|--------|
| **Hytale Asset Editor** | Edit JSON data assets | Available |
| **Blockbench Plugin** | Create 3D models and animations | Available |
| **Asset Graph Editor** | World gen, NPCs, brushes | In development |
| **Creative Mode Tools** | In-game world editing | Available |
| **Machinima Tools** | Create cinematics | Available |

### Community Tools

- [HytaleModding.dev](https://hytalemodding.dev) - Documentation and guides
- [HytalePlugins.gg](https://hytaleplugins.gg) - Plugin hub
- [CurseForge](https://www.curseforge.com/hytale) - Distribution platform

## Server File Structure

```
/hytale-server/
├── mods/           # Content packs
├── plugins/        # Java plugins (.jar)
├── config/         # Server configuration
└── worlds/         # World saves
```

## Current State

Based on the official [Modding Strategy blog post](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status):

### Available at Launch (January 13, 2026)

- Server Java plugins (Java 25, Gradle 9.2.0)
- Data Assets via Asset Editor
- 3D models via [Blockbench plugin](https://github.com/JannisX11/hytale-blockbench-plugin)
- [Creative Mode](https://hytale.com/news/2025/11/hytale-creative-mode) with building tools
- Machinima tools for cinematics
- Server is not obfuscated (can be decompiled)

### Coming Soon

- **Server source code** (1-2 months post-launch) - will be fully open source
- **Visual scripting system** - node-based logic inspired by Unreal Blueprints
- Complete GitBook documentation

## World Generation V2

A major new system in development since 2021:

> "This new approach to world generation will redefine the block-game genre."
> — Simon Collins-Laflamme, CEO

### Visual Node Editor

- **No-code editing** - Create biomes without programming
- Similar to Unreal Engine 5 Blueprints
- Live hot-reload - see changes instantly
- Connect nodes to define terrain, biomes, features

### V2 APIs for Modders

- **Automatic multithreading** - optimized performance
- **Full read access** to surrounding world context
- Mods work automatically with the node editor
- Seamless integration with vanilla and other mods

### Current Status

| Version | Status |
|---------|--------|
| **V1** | Available at launch (Exploration mode) |
| **V2** | In construction, accessible via Gateways |

V2 will completely replace V1 once complete.

[Read more →](https://hytale.com/news/2026/1/the-future-of-world-generation)

## Monetization for Modders

Hypixel Studios offers generous terms for creators:

| Period | Commission |
|--------|------------|
| **First 2 years** | **0%** (no commission) |
| **After 2 years** | Maximum **20%** |

### What You Can Sell

- Visual mods (furniture, pets, hats, avatar cosmetics)
- Server-exclusive cosmetics
- Cosmetic replacements matching your server theme

:::note
Mod cosmetics are not official content. Players must have the mod installed to see them.
:::

### Known Limitations (Early Access)

- Documentation is incomplete (GitBook in progress)
- Some workflows are rough and unpolished
- Asset Graph Editor needs polish
- Data integrity not guaranteed - **backups are mandatory**
- Save frequently (crash risk in early access)

## Getting Started

Choose your path based on your goals:

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'Data Assets',
    href: '/docs/modding/data-assets/overview',
    description: 'Create blocks, items, NPCs without coding'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Java Plugins',
    href: '/docs/modding/plugins/overview',
    description: 'Build powerful server plugins'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Art Assets',
    href: '/docs/modding/art-assets/overview',
    description: 'Create models, textures, animations'
  }} />
</div>
