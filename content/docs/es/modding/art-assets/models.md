---
id: models
title: 3D Models
sidebar_label: Models
sidebar_position: 2
description: Complete guide to creating 3D models for Hytale using Blockbench
---

# 3D Models

Learn how to create custom 3D models for blocks, items, creatures, and props in Hytale using Blockbench.

## Overview

Hytale uses a custom model format called `.blockymodel` that supports:

- **Cuboid-based geometry** - Models are built from rectangular boxes
- **Bone hierarchies** - For skeletal animation support
- **UV mapping** - Precise texture positioning
- **Pivot points** - Define rotation centers for animations
- **Multiple textures** - Support for diffuse, emissive, and special maps

:::info Why Blockbench?
Blockbench is the official recommended tool for creating Hytale models. It has a dedicated Hytale plugin that exports directly to `.blockymodel` format and provides Hytale-specific features.
:::

## File Format

### .blockymodel Structure

Hytale models use the `.blockymodel` JSON format:

```json
{
  "format_version": "1.0",
  "model": {
    "identifier": "custom:my_creature",
    "texture_width": 64,
    "texture_height": 64,
    "bones": [
      {
        "name": "root",
        "pivot": [0, 0, 0],
        "cubes": [...],
        "children": [...]
      }
    ]
  }
}
```

### Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `format_version` | string | Model format version (currently "1.0") |
| `identifier` | string | Unique model ID in `namespace:name` format |
| `texture_width` | integer | Texture atlas width in pixels (must be multiple of 32) |
| `texture_height` | integer | Texture atlas height in pixels (must be multiple of 32) |
| `bones` | array | Hierarchical bone structure |

## Bone Hierarchy

Bones are the building blocks of animatable models. Each bone can contain:

- **Cubes** - The visible geometry
- **Pivot point** - The rotation center
- **Children** - Child bones that inherit transformations

### Standard Humanoid Skeleton

For humanoid creatures, Hytale uses this standard bone hierarchy:

```filetree
waist (root)
├── torso/
│   ├── chest/
│   │   ├── shoulder_left/
│   │   │   ├── arm_left/
│   │   │   │   └── hand_left/
│   │   ├── shoulder_right/
│   │   │   ├── arm_right/
│   │   │   │   └── hand_right/
│   │   └── neck/
│   │       └── head/
├── hip_left/
│   ├── leg_left/
│   │   └── foot_left/
└── hip_right/
    ├── leg_right/
        └── foot_right/
```

:::tip Naming Convention
Use consistent bone names across your models to reuse animations. Hytale's animation system matches bones by name.
:::

### Bone Properties

```json
{
  "name": "arm_left",
  "pivot": [4, 22, 0],
  "rotation": [0, 0, 0],
  "cubes": [
    {
      "origin": [4, 12, -2],
      "size": [4, 10, 4],
      "uv": [40, 16]
    }
  ],
  "children": [...]
}
```

| Property | Description |
|----------|-------------|
| `name` | Bone identifier (used for animation targeting) |
| `pivot` | Rotation center point [x, y, z] |
| `rotation` | Default rotation in degrees [x, y, z] |
| `cubes` | Array of cuboid geometry |
| `children` | Nested child bones |

## Cubes (Geometry)

Cubes are the geometric primitives that make up your model's visible shape.

### Cube Properties

```json
{
  "origin": [0, 0, 0],
  "size": [8, 8, 8],
  "uv": [0, 0],
  "inflate": 0,
  "mirror": false
}
```

| Property | Type | Description |
|----------|------|-------------|
| `origin` | [x, y, z] | Bottom-north-west corner position |
| `size` | [w, h, d] | Dimensions in pixels (1 pixel = 1/16 block) |
| `uv` | [u, v] | Texture UV offset for auto-mapping |
| `inflate` | number | Expand cube outward (useful for armor layers) |
| `mirror` | boolean | Mirror UV horizontally |

### Per-Face UV Mapping

For precise texture control, use per-face UV:

```json
{
  "origin": [0, 0, 0],
  "size": [8, 8, 8],
  "faces": {
    "north": {"uv": [8, 8, 16, 16]},
    "south": {"uv": [24, 8, 32, 16]},
    "east": {"uv": [0, 8, 8, 16]},
    "west": {"uv": [16, 8, 24, 16]},
    "up": {"uv": [8, 0, 16, 8]},
    "down": {"uv": [16, 0, 24, 8]}
  }
}
```

## Texture Requirements

### Dimensions

- Must be **multiples of 32 pixels** (32x32, 64x64, 128x128, etc.)
- Square textures recommended but not required
- Maximum size: 512x512 pixels

### Format

- **PNG format** with transparency support
- Use **nearest-neighbor** scaling (no anti-aliasing)
- Keep file size reasonable for network streaming

### UV Layout

Standard UV layout for a cube:

```
┌─────────┬─────────┬─────────┬─────────┐
│         │   UP    │         │         │
│         │  (top)  │         │         │
├─────────┼─────────┼─────────┼─────────┤
│  WEST   │  NORTH  │  EAST   │  SOUTH  │
│ (left)  │ (front) │ (right) │ (back)  │
├─────────┼─────────┼─────────┼─────────┤
│         │  DOWN   │         │         │
│         │(bottom) │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

## Model Types

### Block Models

For custom blocks, models are simpler without bone hierarchies:

```json
{
  "format_version": "1.0",
  "model": {
    "identifier": "mymod:fancy_block",
    "texture_width": 32,
    "texture_height": 32,
    "elements": [
      {
        "from": [0, 0, 0],
        "to": [16, 16, 16],
        "faces": {
          "all": {"uv": [0, 0, 16, 16], "texture": "#main"}
        }
      }
    ]
  }
}
```

### Item Models

Items can use 2D sprites or 3D models:

```json
{
  "format_version": "1.0",
  "model": {
    "identifier": "mymod:custom_sword",
    "display": {
      "hand": {
        "rotation": [0, -90, -45],
        "translation": [0, 4, 0],
        "scale": [1.5, 1.5, 1.5]
      }
    }
  }
}
```

### Entity Models

Full creature models with animation support:

```json
{
  "format_version": "1.0",
  "model": {
    "identifier": "mymod:custom_creature",
    "visible_bounds_width": 2,
    "visible_bounds_height": 3,
    "visible_bounds_offset": [0, 1.5, 0],
    "texture_width": 128,
    "texture_height": 128,
    "bones": [...]
  }
}
```

## Best Practices

### Performance

1. **Minimize cube count** - Each cube adds rendering cost
2. **Use appropriate texture sizes** - Don't use 512x512 for a small prop
3. **Optimize bone hierarchy** - Fewer bones = better animation performance
4. **Cull invisible faces** - Remove faces that will never be seen

### Organization

1. **Consistent naming** - Use clear, descriptive bone names
2. **Logical hierarchy** - Parent bones should make sense for animation
3. **Center your model** - Origin at model center for proper rotation
4. **Document pivot points** - Note rotation centers for animators

### Compatibility

1. **Test in-game** - Blockbench preview may differ from in-game
2. **Check collisions** - Model bounds affect gameplay
3. **Verify UV mapping** - Ensure no texture bleeding
4. **Test animations** - Verify bone hierarchy works with intended animations

## Workflow

### Creating a New Model

1. **Open Blockbench** and select "Hytale Model" format
2. **Set texture dimensions** appropriate for your model complexity
3. **Build the bone hierarchy** starting from root
4. **Add cubes** to each bone
5. **UV map** your textures
6. **Export** as `.blockymodel`

### File Placement

```filetree
mods/
└── my-mod/
    └── assets/
        └── models/
            ├── blocks/
            │   └── fancy_block.blockymodel
            ├── items/
            │   └── custom_sword.blockymodel
            └── entities/
                └── custom_creature.blockymodel
```

## Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Model not appearing | Check file path and identifier match |
| Texture glitches | Verify UV mapping and texture dimensions |
| Animation breaks | Ensure bone names match animation targets |
| Z-fighting | Adjust cube positions to avoid overlap |
| Model too large/small | Check scale and ensure 1 pixel = 1/16 block |

### Debugging Tips

- Use Blockbench's preview with different lighting
- Check the game console for model loading errors
- Verify JSON syntax with a validator
- Test with a simple texture first

## Next Steps

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'Textures Guide',
    href: '/docs/modding/art-assets/textures',
    description: 'Learn about texture creation and mapping'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Animations',
    href: '/docs/modding/art-assets/animations',
    description: 'Bring your models to life with animations'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Blockbench Setup',
    href: '/docs/tools/blockbench/installation',
    description: 'Install and configure Blockbench'
  }} />
</div>
