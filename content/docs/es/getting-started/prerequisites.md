---
id: prerequisites
title: Prerequisites
sidebar_label: Prerequisites
sidebar_position: 2
description: What you need before starting Hytale development
---

# Prerequisites

Before starting Hytale development, ensure you have the following installed.

## Required Software

### For All Developers

| Software | Version | Download |
|----------|---------|----------|
| **Hytale** | Latest | [hytale.com](https://hytale.com) |
| **Git** | 2.x+ | [git-scm.com](https://git-scm.com) |
| **Text Editor** | Any | VS Code recommended |

### For Plugin Development

| Software | Version | Download |
|----------|---------|----------|
| **Java JDK** | 25 | [adoptium.net](https://adoptium.net) (recommended) |
| **IDE** | Latest | IntelliJ IDEA or Eclipse |
| **Gradle** | 9.2.0 | Usually bundled with IDE |

:::warning Java Version
Hytale plugins require **Java 25**. Earlier versions are not supported. Adoptium (formerly AdoptOpenJDK) is the recommended distribution.
:::

### For 3D Modeling

| Software | Version | Download |
|----------|---------|----------|
| **Blockbench** | 4.x+ | [blockbench.net](https://blockbench.net) |
| **Hytale Plugin** | Latest | [GitHub](https://github.com/JannisX11/hytale-blockbench-plugin) |

The Blockbench plugin replaces the old Hytale Model Maker and supports:
- `.blockymodel` format for 3D models
- `.blockyanim` format for animations

## Mod Types and Requirements

| Mod Type | Required Skills | Tools Needed |
|----------|-----------------|--------------|
| **Packs** | No coding - Asset Editor only | Hytale Asset Editor |
| **Plugins** | Java programming | Java 25, IDE, Gradle |
| **Bootstrap Plugins** | Advanced Java | Java 25, IDE, Gradle |

## Knowledge Requirements

### Beginner Path (Packs / Data Assets)

- Basic JSON syntax
- File system navigation
- Text editor usage
- No programming required

### Intermediate Path (Art Assets)

- 3D modeling concepts
- Animation basics
- Texture creation

### Advanced Path (Java Plugins)

- Java programming
- Object-oriented design
- Event-driven architecture

## Official Development Tools

| Tool | Purpose |
|------|---------|
| **Hytale Asset Editor** | Main editor for data assets (JSON) |
| **Hytale Node Editor** | Visual scripts for brushes and world gen |
| **Blockbench Plugin** | Create 3D models and animations |
| **Machinima** | Content recording |
| **World Tools** | World modification/editing |

## Languages and Scripting

:::info No Lua/Python Support
Hypixel Studios has officially decided **not to support Lua or Python** for modding. The available options are:
- **Visual Scripting** via Node Editor (inspired by Unreal Engine Blueprints)
- **Java Plugins** for server-side logic
:::

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 / macOS 11 / Linux | Windows 11 / macOS 14 / Linux |
| RAM | 8 GB | 16 GB |
| Storage | 10 GB free | 50 GB SSD |

## Distribution Platform

**CurseForge** is the official distribution partner (since January 5, 2026):
- 0% commission on mods and servers during the first 2 years
- Visit [curseforge.com/hytale](https://www.curseforge.com/hytale)

## Next Steps

Once you have the prerequisites installed:

1. [Environment Setup](/docs/getting-started/environment-setup) - Configure your tools
2. [Your First Mod](/docs/getting-started/first-mod) - Create something!
