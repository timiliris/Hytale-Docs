---
id: creating-blocks
title: Creating Blocks
sidebar_label: Creating Blocks
sidebar_position: 1
description: How to create custom blocks in Hytale
---

# Creating Blocks

Learn how to create custom blocks for Hytale.

## Basic Block Definition

```json
{
  "id": "my_mod:custom_block",
  "displayName": "Custom Block",
  "properties": {
    "hardness": 2.0,
    "resistance": 3.0
  }
}
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `displayName` | string | Shown in game |
| `hardness` | number | Mining time |
| `resistance` | number | Explosion resistance |

## Next Steps

- [Block Properties](/docs/modding/data-assets/blocks/block-properties)
- [Block Behaviors](/docs/modding/data-assets/blocks/block-behaviors)
