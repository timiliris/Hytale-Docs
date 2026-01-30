---
id: blocks-overview
title: Blocks Overview
sidebar_label: Overview
sidebar_position: 0
description: Introduction to block modding in Hytale
---

# Blocks Overview

Blocks are the fundamental building units of Hytale's world. This section covers everything you need to know about creating and customizing blocks.

## What Are Blocks?

In Hytale, blocks are the voxel-based elements that make up the terrain, structures, and decorations. Each block type has unique properties that define its appearance and behavior.

## Block Components

A block definition consists of several components:

| Component | Description |
|-----------|-------------|
| **Identity** | Unique ID and display name |
| **Properties** | Physical characteristics (hardness, resistance) |
| **Behaviors** | Interactive features (gravity, liquids, light) |
| **Visuals** | Model, textures, and rendering options |
| **Sounds** | Audio for placement, breaking, footsteps |

## File Structure

Block definitions are stored as JSON files:

```
my_mod/
  data/
    blocks/
      custom_block.json
  assets/
    textures/
      blocks/
        custom_block.png
```

## Basic Example

```json
{
  "id": "my_mod:custom_block",
  "displayName": "Custom Block",
  "properties": {
    "hardness": 2.0,
    "resistance": 3.0,
    "material": "stone"
  }
}
```

## Block Categories

### Natural Blocks
- Terrain (dirt, stone, sand)
- Vegetation (grass, flowers, trees)
- Ores and minerals

### Building Blocks
- Construction materials
- Decorative blocks
- Functional blocks (doors, chests)

### Interactive Blocks
- Crafting stations
- Storage containers
- Mechanical components

## Next Steps

- [Creating Blocks](/docs/modding/data-assets/blocks/creating-blocks) - Step-by-step guide
- [Block Properties](/docs/modding/data-assets/blocks/properties) - Property reference
- [Block Behaviors](/docs/modding/data-assets/blocks/behaviors) - Add interactivity
