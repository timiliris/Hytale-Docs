---
id: block-properties
title: Block Properties
sidebar_label: Properties
sidebar_position: 2
---

# Block Properties

Reference for all available block properties.

## Core Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hardness` | number | 1.0 | Mining difficulty |
| `resistance` | number | 1.0 | Explosion resistance |
| `material` | string | "stone" | Block material type |
| `transparent` | boolean | false | Light passes through |

## Example

```json
{
  "properties": {
    "hardness": 5.0,
    "resistance": 10.0,
    "material": "metal",
    "transparent": false
  }
}
```
