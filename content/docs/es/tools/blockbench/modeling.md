---
id: modeling
title: Modeling Guide
sidebar_label: Modeling
sidebar_position: 3
description: Create 3D models for Hytale using Blockbench
---

# Modeling Guide

Create 3D models for Hytale using Blockbench and the official Hytale plugin.

## Getting Started

### Create a New Model

1. Open Blockbench
2. Go to **File > New > Hytale Model**
3. Configure your project settings
4. Click **Create**

### Basic Workflow

1. **Plan your model** - Sketch or reference your design
2. **Create the base shape** - Add cubes for the main geometry
3. **Set up bone hierarchy** - Organize for animation
4. **Add details** - Refine geometry
5. **Apply textures** - Create and map textures
6. **Export** - Save as `.blockymodel`

## Adding Geometry

### Working with Cubes

Hytale models are built from cubes:

1. Select a bone in the Outliner
2. Click **Add Cube** or press `N`
3. Position and resize using handles or numeric input
4. Rotate as needed

### Tips for Geometry

- **Minimize cube count** - Fewer cubes = better performance
- **Use appropriate sizes** - Match Hytale's art style
- **Avoid overlapping** - Keep geometry clean

## Bone Hierarchy

### Setting Up Bones

Bones define how your model animates:

1. Right-click in Outliner > **Add Bone**
2. Name the bone appropriately
3. Position the bone's pivot point
4. Parent cubes to the bone

### Bone Naming Conventions

Follow Hytale's naming patterns:
- `root` - Base bone
- `body` - Main body
- `head` - Head bone
- `arm_left`, `arm_right` - Arm bones
- `leg_left`, `leg_right` - Leg bones

### Pivot Points

Pivot points determine rotation centers:

1. Select a bone
2. Adjust pivot position in the properties panel
3. Test by rotating the bone

## Texturing

### Creating Textures

1. Go to the **Paint** tab
2. Use built-in painting tools
3. Or import external textures

### UV Mapping

Map textures to geometry:

1. Select a cube
2. Open the UV Editor
3. Adjust UV coordinates to match your texture

### Texture Tips

- **Consistent pixel density** - Match Hytale's art style
- **Use Box UV** for simple mapping
- **Plan texture layout** before painting

## Model Orientation

Important: Hytale models face toward +Z

- **Front** = +Z direction
- **Back** = -Z direction
- **Right** = +X direction
- **Left** = -X direction
- **Up** = +Y direction

## Exporting

### Export as .blockymodel

1. Go to **File > Export > Hytale Model**
2. Choose export location
3. Name your file
4. Click **Export**

### Export Checklist

Before exporting:
- [ ] All bones properly named
- [ ] Hierarchy is correct
- [ ] Textures are assigned
- [ ] Model faces +Z
- [ ] Pivot points are set

## Best Practices

1. **Start simple** - Build complexity gradually
2. **Reference official models** - Study Hytale's art style
3. **Test frequently** - Export and view in-game
4. **Optimize** - Remove unnecessary geometry
5. **Organize** - Keep Outliner clean and logical

## Common Issues

### Model Appears Wrong In-Game

- Check model orientation (+Z forward)
- Verify bone hierarchy
- Ensure correct scale

### Textures Not Showing

- Verify texture is assigned
- Check UV mapping
- Ensure texture file exists

### Animation Issues

- Verify bone naming follows conventions
- Check pivot point positions
- See [Animation Guide](/docs/tools/blockbench/animation)

## Next Steps

- [Animation Guide](/docs/tools/blockbench/animation) - Bring your models to life
- [Asset Editor](/docs/tools/asset-editor/overview) - Configure models in-game
