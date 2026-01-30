---
id: overview
title: Data Assets Overview
sidebar_label: Overview
sidebar_position: 1
description: JSON-based content creation for Hytale
---

# Data Assets Overview

Data Assets are JSON files that define game content without requiring programming.

## What Are Data Assets?

Data Assets control:
- **Blocks** - Properties, behaviors, appearance
- **Items** - Stats, effects, interactions
- **NPCs** - Behaviors, stats, AI
- **Loot Tables** - Drops, probabilities
- **World Generation** - Biomes, structures

## Advantages

- No programming required
- Editable with Asset Editor
- Live reload support
- Can be combined with plugins

## Basic Structure

```json
{
  "id": "namespace:asset_name",
  "displayName": "Human Readable Name",
  "properties": {
    "key": "value"
  }
}
```

## Asset Editor

The built-in Asset Editor provides:
- Visual editing interface
- Validation
- Live preview
- No coding required

## File Organization

```
mods/my-pack/
├── blocks/
│   └── custom_block.json
├── items/
│   └── custom_item.json
├── npcs/
│   └── custom_npc.json
└── loot_tables/
    └── custom_loot.json
```

## Getting Started

- [Creating Blocks](/docs/modding/data-assets/blocks/creating-blocks)
- [Creating Items](/docs/modding/data-assets/items/creating-items)
- [Creating NPCs](/docs/modding/data-assets/npcs/creating-npcs)
