---
id: textures
title: Textures
sidebar_label: Textures
sidebar_position: 3
description: Complete guide to creating textures for Hytale models and blocks
---

# Textures

Learn how to create high-quality textures that match Hytale's distinctive hand-painted art style. This guide is based on the official [Introduction to Making Models for Hytale](https://hytale.com/news/2025/12/an-introduction-to-making-models-for-hytale) blog post by Xael and Thomas Frick.

## Overview

Hytale's art style is described as **"a modern, stylized voxel game, with retro pixel-art textures"** - placing it at the intersection of low-definition pixel art and hand-painted 3D.

### Art Style Characteristics

- **Illustration style** - shadows and highlights painted directly into textures
- **No PBR workflow** - no roughness maps, normal maps, or metallic textures
- **Soft gradients** with subtle color variations
- **Warm, saturated colors** with tinted shadows (e.g., purple in shadow areas)
- **Avoid pure black/white** - this breaks the lighting in-game

> "Each texture is treated as an illustration where shadows, ambient occlusion, and highlights are painted/baked directly into the texture."
> — [Hytale Art Pipeline](https://hytale.com/news/2025/12/an-introduction-to-making-models-for-hytale)

:::tip Official Tips from Thomas Frick

- **Use colored shadows** - add purple/blue tints to shadow areas for vibrancy
- **Use two brush types** - a pencil for details and a soft brush for gradients
- **3-5 color values per material** - base, shadow, highlight, and optional accent
:::

## Technical Specifications

### Official Resolutions

Hytale uses two distinct pixel densities depending on the object type:

| Object Type | Pixels Per Unit | Use Case |
|-------------|-----------------|----------|
| **64px** | High density | Avatars, cosmetics, tools, weapons |
| **32px** | Standard | Building blocks, props, accessories |

> "64px per unit allows for detailed faces and the expression of emotions."
> — [Official Art Pipeline](https://hytale.com/news/2025/12/an-introduction-to-making-models-for-hytale)

### Required Format

| Property | Requirement |
|----------|-------------|
| File Format | PNG (with alpha channel) |
| Color Depth | 32-bit RGBA |
| Dimensions | Multiples of 32px (32, 64, 128, 256, 512) |
| Max Size | 512 × 512 pixels |
| Compression | Lossless (no JPEG artifacts) |

### Stretching Rules

Stretching is permitted to avoid Z-fighting issues, but should be limited:

| Stretch Factor | Recommendation |
|----------------|----------------|
| **0.7x - 1.3x** | Safe range, minimal pixel distortion |
| **< 0.7x or > 1.3x** | Avoid - causes visible pixel distortion |

### Why Multiples of 32?

Hytale's rendering engine optimizes texture atlases based on 32-pixel grid alignment. Non-conforming textures may:

- Cause UV mapping errors
- Result in texture bleeding
- Reduce performance from atlas fragmentation

```
✓ 32×32    ✓ 64×64    ✓ 128×128    ✓ 256×256
✓ 64×32    ✓ 128×64   ✓ 256×128    ✓ 512×256
✗ 50×50    ✗ 100×100  ✗ 48×48      ✗ 200×200
```

## Creating Textures

### Recommended Software

| Software | Best For | Cost |
|----------|----------|------|
| **Aseprite** | Pixel art, animations | $20 |
| **GIMP** | General editing, free option | Free |
| **Photoshop** | Professional workflow | Subscription |
| **Krita** | Digital painting | Free |
| **Pixelorama** | Pixel art, open source | Free |

### Workspace Setup

1. **Create new document** at your target resolution
2. **Set color mode** to RGB 8-bit
3. **Enable pixel grid** for precise editing
4. **Disable anti-aliasing** on all tools
5. **Use nearest-neighbor** interpolation for scaling

### Color Palette Guidelines

Hytale uses carefully curated color palettes:

```
Base Colors (examples):
├── Grass:    #7cb342, #8bc34a, #9ccc65
├── Stone:    #78909c, #90a4ae, #b0bec5
├── Wood:     #8d6e63, #a1887f, #bcaaa4
├── Sand:     #ffe082, #ffca28, #ffc107
└── Water:    #4fc3f7, #29b6f6, #03a9f4
```

:::info Color Harmony
Each material uses 3-5 color values: base, shadow, highlight, and optional accent. Keep variations subtle for the hand-painted look.
:::

## Texture Types

### Block Textures

Standard 32×32 or 64×64 textures for world blocks:

```json
{
  "texture": {
    "identifier": "mymod:textures/blocks/custom_stone",
    "faces": {
      "all": "custom_stone.png"
    }
  }
}
```

#### Multi-Face Blocks

For blocks with different sides:

```json
{
  "texture": {
    "faces": {
      "up": "grass_top.png",
      "down": "dirt.png",
      "north": "grass_side.png",
      "south": "grass_side.png",
      "east": "grass_side.png",
      "west": "grass_side.png"
    }
  }
}
```

### Entity Textures

Larger textures (64×64 to 256×256) for creatures and characters:

```filetree
textures/
└── entities/
    └── custom_creature/
        ├── body.png
        ├── body_hurt.png
        └── body_emissive.png
```

### Item Textures

Usually 32×32 sprites for inventory display:

```json
{
  "texture": {
    "identifier": "mymod:textures/items/magic_sword",
    "sprite": "magic_sword.png"
  }
}
```

## UV Mapping

### Standard Box UV

For simple cube-based models, Blockbench auto-generates UVs:

```
Texture Layout (unfolded cube):
┌────┬────┬────┬────┐
│    │ UP │    │    │
│    │    │    │    │
├────┼────┼────┼────┤
│ W  │ N  │ E  │ S  │
│    │    │    │    │
├────┼────┼────┼────┤
│    │DOWN│    │    │
│    │    │    │    │
└────┴────┴────┴────┘

N = North (front)
S = South (back)
E = East (right)
W = West (left)
```

### Custom UV Mapping

For complex models, use Blockbench's UV editor:

1. Select face(s) in the viewport
2. Open UV panel
3. Drag vertices to position on texture
4. Use snap-to-grid for clean alignment

### Avoiding Texture Bleeding

Texture bleeding occurs when adjacent pixels "leak" onto your model:

**Solutions:**
- Add 1-2 pixel padding between UV islands
- Use power-of-two textures
- Avoid UV edges exactly on pixel boundaries
- Enable "Pixel Perfect" in Blockbench

## Special Texture Types

### Emissive Textures

For glowing parts (eyes, magic effects):

```
filename: creature_emissive.png
- White pixels = full glow
- Black pixels = no glow
- Gray = partial glow
```

Emissive textures ignore lighting and always display at full brightness.

### Transparency

For leaves, glass, and effects:

```
Alpha channel values:
- 255 = fully opaque
- 0 = fully transparent
- 1-254 = semi-transparent (use sparingly)
```

:::warning Performance Note
Semi-transparent textures are more expensive to render. Use binary (0 or 255) alpha when possible.
:::

### Animated Textures

For flowing water, fire effects:

```json
{
  "animation": {
    "frames": 8,
    "speed": 2,
    "interpolate": false
  }
}
```

Create a vertical strip with all frames:

```
32×256 texture for 8-frame animation:
┌────┐ Frame 1
├────┤ Frame 2
├────┤ Frame 3
├────┤ Frame 4
├────┤ Frame 5
├────┤ Frame 6
├────┤ Frame 7
└────┘ Frame 8
```

## Art Style Tips

### Achieving the Hytale Look

1. **Start with flat colors** - Block in major areas first
2. **Add soft shadows** - Use darker variants, not black
3. **Subtle highlights** - Lighter variants on edges
4. **Color variation** - Break up large areas with slight hue shifts
5. **Avoid pure black/white** - Use tinted darks/lights

### Common Mistakes

| Mistake | Fix |
|---------|-----|
| Too much contrast | Reduce highlight/shadow intensity |
| Pillow shading | Light from one direction consistently |
| Banding | Add noise/dithering to gradients |
| Over-detailing | Simplify for game-scale viewing |
| Clashing colors | Use harmonious palette |

### Workflow Example

Creating a stone block texture:

```
1. Base fill with mid-gray (#808080)
2. Add subtle warm tint (#858075)
3. Paint darker cracks (#605850)
4. Soft highlights on edges (#a0a090)
5. Tiny color variations (#807878, #858080)
6. Review at 100% zoom for game scale
```

## File Organization

### Recommended Structure

```filetree
mods/
└── my-mod/
    └── assets/
        └── textures/
            ├── blocks/
            │   ├── custom_stone.png
            │   └── custom_wood.png
            ├── items/
            │   ├── magic_sword.png
            │   └── health_potion.png
            ├── entities/
            │   └── custom_creature/
            │       ├── body.png
            │       └── body_emissive.png
            └── particles/
                └── magic_sparkle.png
```

### Naming Conventions

- Use **lowercase** with **underscores**: `fire_sword.png`
- Be **descriptive**: `oak_planks_vertical.png`
- Include **variants**: `grass_dry.png`, `grass_wet.png`
- Use **suffixes** for types: `_emissive.png`, `_normal.png`

## Troubleshooting

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Blurry textures | Wrong filtering | Check mipmapping settings |
| Color shift | sRGB mismatch | Export in sRGB color space |
| Visible seams | UV bleeding | Add padding to UV islands |
| Wrong size | Non-32 multiple | Resize to valid dimensions |
| Missing alpha | Wrong export | Enable 32-bit RGBA export |

## Next Steps

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: '3D Models',
    href: '/docs/modding/art-assets/models',
    description: 'Apply your textures to custom models'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Animations',
    href: '/docs/modding/art-assets/animations',
    description: 'Animate your textured models'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Blockbench Guide',
    href: '/docs/tools/blockbench/modeling',
    description: 'Learn UV mapping in Blockbench'
  }} />
</div>
