---
id: properties
title: Block Properties
sidebar_label: Properties
sidebar_position: 2
description: Reference for all available block properties in Hytale
---

# Block Properties

Complete reference for all available block properties.

## Core Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hardness` | number | 1.0 | Mining difficulty (time to break) |
| `resistance` | number | 1.0 | Explosion resistance |
| `material` | string | "stone" | Block material type |
| `transparent` | boolean | false | Whether light passes through |
| `solid` | boolean | true | Whether entities collide with it |

## Visual Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `renderType` | string | "solid" | Rendering mode |
| `color` | string | null | Tint color (hex) |
| `luminance` | number | 0 | Light emission level (0-15) |
| `opacity` | number | 15 | Light blocking level (0-15) |

### Render Types

| Type | Description |
|------|-------------|
| `solid` | Standard opaque block |
| `cutout` | Transparent pixels (leaves, flowers) |
| `translucent` | Semi-transparent (glass, water) |
| `model` | Custom 3D model |

## Physical Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `flammable` | boolean | false | Can catch fire |
| `replaceable` | boolean | false | Can be overwritten by placement |
| `requiresTool` | boolean | false | Needs specific tool to harvest |
| `toolType` | string | null | Required tool (pickaxe, axe, shovel) |
| `harvestLevel` | number | 0 | Minimum tool tier required |

## Sound Properties

| Property | Type | Description |
|----------|------|-------------|
| `soundGroup` | string | Sound set for interactions |
| `stepSound` | string | Footstep sound override |
| `breakSound` | string | Breaking sound override |
| `placeSound` | string | Placement sound override |

### Sound Groups

- `stone` - Stone, ores, bricks
- `wood` - Logs, planks, wooden items
- `grass` - Grass, dirt, soil
- `sand` - Sand, gravel
- `glass` - Glass, ice
- `metal` - Metal blocks, anvils
- `cloth` - Wool, fabric

## Example

```json
{
  "id": "my_mod:reinforced_glass",
  "displayName": "Reinforced Glass",
  "properties": {
    "hardness": 3.0,
    "resistance": 15.0,
    "material": "glass",
    "transparent": true,
    "solid": true,
    "renderType": "translucent",
    "opacity": 0,
    "luminance": 0,
    "soundGroup": "glass",
    "requiresTool": true,
    "toolType": "pickaxe",
    "harvestLevel": 1
  }
}
```

## Material Types

| Material | Description | Tool |
|----------|-------------|------|
| `stone` | Stone-like blocks | Pickaxe |
| `wood` | Wooden blocks | Axe |
| `dirt` | Soil-like blocks | Shovel |
| `sand` | Granular blocks | Shovel |
| `metal` | Metal blocks | Pickaxe |
| `glass` | Fragile transparent | Pickaxe |
| `cloth` | Soft fabric | Any |
| `plant` | Vegetation | Any |

## See Also

- [Creating Blocks](/docs/modding/data-assets/blocks/creating-blocks)
- [Block Behaviors](/docs/modding/data-assets/blocks/behaviors)
