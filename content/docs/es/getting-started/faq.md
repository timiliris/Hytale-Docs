---
id: faq
title: Frequently Asked Questions
sidebar_label: FAQ
sidebar_position: 5
description: Common questions and answers about Hytale, gameplay, technical requirements, and modding
---

# Frequently Asked Questions

Find answers to the most common questions about Hytale, from general information to technical details and modding.

## General Questions

### What is Hytale?

Hytale is a sandbox adventure game developed by Hypixel Studios. It combines block-based building with RPG elements, advanced combat, and powerful modding tools. The game features procedurally generated worlds, multiple biomes, and a rich ecosystem of creatures and characters. Designed from the ground up with community creation in mind, Hytale provides players with the same tools used by the developers to create custom content.

### When was Hytale released?

Hytale launched in **Early Access on January 13, 2026**. The game was developed by Hypixel Studios, a team of over 50 developers led by original founders Simon Collins-Laflamme and Philippe Touchette, who reacquired the project from Riot Games in November 2025.

### How much does Hytale cost?

Hytale is available in three editions:

| Edition | Price | Contents |
|---------|-------|----------|
| **Standard** | $19.99 | Base game |
| **Supporter** | $34.99 | Base game + exclusive cosmetics |
| **Cursebreaker Founders** | $69.99 | Base game + premium cosmetics + early supporter recognition |

All editions provide access to the full game. The higher tiers include exclusive cosmetic items and supporter perks.

### Is Hytale on Steam?

**No.** Hytale is exclusively available through the official launcher at [hytale.com](https://hytale.com). There are currently no plans to release on Steam or other third-party platforms.

### What platforms is Hytale available on?

Hytale is available on **Windows, macOS, and Linux**. The macOS version requires an M1 chip or newer running macOS Tahoe. The Linux version is distributed as a native Flatpak with full Wayland support.

### Is Hytale free-to-play?

**No.** Hytale is a one-time purchase game. There is no subscription fee or mandatory in-game purchases required to play. Once you buy the game, you own it permanently.

---

## Gameplay Questions

### What game modes are available?

Hytale currently offers the following game modes:

- **Exploration Mode** - Explore procedurally generated worlds, gather resources, build structures, and encounter creatures across diverse biomes
- **Creative Mode** - Unlimited resources and tools for building and creating without survival constraints
- **Multiplayer** - Join community servers to play with others on custom game modes and experiences

:::note Adventure Mode Coming Later
The story-driven **Adventure Mode** is planned for a future update and is not available at Early Access launch. This mode will feature a full narrative campaign set in the world of Orbis.
:::

### Can I play multiplayer?

**Yes!** Multiplayer is available from day one. Community servers are supported at launch, and players can join servers created by other community members. The server-first architecture means joining a modded server is seamless - no mod downloads required on the player's end.

### Is there a story campaign?

Adventure Mode, which features a narrative-driven campaign, is **planned for a future update**. At Early Access launch, players can enjoy Exploration Mode, Creative Mode, and community multiplayer servers.

### Is Hytale like Minecraft?

While Hytale shares similarities with Minecraft as a block-based sandbox game, it differentiates itself with:

- **Advanced Combat System** - Dynamic combat with dodging, blocking, and weapon-specific mechanics
- **Integrated Modding** - Native mod support built into the game's core architecture
- **Server-Side Execution** - All mods run on servers, requiring no client installation
- **Professional Creation Tools** - The same tools used by developers are available to the community
- **Rich Animation System** - More detailed character and creature animations
- **Visual Scripting** - Create gameplay logic without coding knowledge

---

## Technical Questions

### What are the PC requirements for Hytale?

**Minimum Requirements:**

| Component | Requirement |
|-----------|-------------|
| **GPU** | NVIDIA GTX 900 series or equivalent |
| **CPU** | Intel Core i5-7500 or equivalent |
| **RAM** | 8 GB |
| **Storage** | 20 GB available space |
| **OS** | Windows 10 64-bit |

**Recommended Requirements:**

| Component | Requirement |
|-----------|-------------|
| **GPU** | NVIDIA GTX 1660 or better |
| **CPU** | Intel Core i7-8700 or better |
| **RAM** | 16 GB |
| **Storage** | 20 GB SSD |
| **OS** | Windows 10/11 64-bit |

### Can I host my own server?

**Yes!** Hytale supports dedicated community servers. Here are the requirements:

- **Java 25** or higher required
- **Default port:** UDP 5520
- Server software available from the official Hytale website
- Full documentation for server configuration is available in the [Server Administration](/docs/servers/administration) section

### Are mods supported?

**Yes!** Mods are supported from day one. Key features include:

- Native mod support integrated into the game
- **CurseForge** partnership for mod distribution
- Server-side execution (players don't need to download mods)
- Multiple mod types: Packs, Java Plugins, and Visual Scripting

---

## Modding Questions

### How do I create mods?

Hytale offers multiple approaches to modding:

#### 1. Packs (No Coding Required)
Create custom content using JSON configuration files:
- Custom blocks, items, and NPCs
- New textures and 3D models
- Custom sounds and effects
- Loot tables and crafting recipes

#### 2. Java Plugins (Coding Required)
Write full-featured plugins in Java for complex functionality:
```java
@PluginInfo(name = "MyPlugin", version = "1.0.0")
public class MyPlugin extends Plugin {
    @Override
    public void onEnable() {
        getLogger().info("Plugin enabled!");
    }
}
```

#### 3. Visual Scripting (No Coding Required)
Use the visual scripting system to create game logic by connecting nodes in a visual interface - no programming knowledge needed.

### Do I need to know how to code?

**Not necessarily!** Here's a breakdown:

| Mod Type | Coding Required | Best For |
|----------|-----------------|----------|
| **Packs** | No | Custom content (blocks, items, textures) |
| **Visual Scripting** | No | Game logic, events, triggers |
| **Java Plugins** | Yes (Java) | Complex systems, APIs, integrations |

Many powerful mods can be created using just Packs and Visual Scripting, without writing any code.

### Where can I download mods?

**CurseForge** is the official partner for Hytale mod distribution. You can browse, download, and install mods directly through:

- [CurseForge Hytale Section](https://www.curseforge.com/hytale)
- The in-game mod browser (integrated with CurseForge)

:::tip For Mod Creators
To publish your mods, create a CurseForge account and follow their submission guidelines. The platform handles versioning, dependencies, and updates automatically.
:::

---

## Still Have Questions?

If your question wasn't answered here, check out these resources:

- [Official Hytale Blog](https://hytale.com/news) - Latest announcements and updates
- [Hytale Discord](https://discord.gg/hytale) - Community discussions and support
- [HytaleModding.dev](https://hytalemodding.dev) - Modding documentation and tutorials
