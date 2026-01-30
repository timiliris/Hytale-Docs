---
id: plugin-setup
title: Hytale Plugin Setup
sidebar_label: Plugin Setup
sidebar_position: 2
description: Configure the Hytale Blockbench plugin for model creation
---

# Hytale Plugin Setup

Configure the official Hytale Blockbench plugin for optimal model creation.

## Plugin Features

The Hytale plugin provides:

- **`.blockymodel` format** - Native Hytale model format
- **`.blockyanim` animations** - Hytale animation format
- **Hytale-specific settings** - Proper pixel ratios and constraints
- **Bone hierarchy tools** - Support for Hytale's skeletal system
- **Live export** - Export directly to Hytale-compatible formats
- **Quality-of-life improvements** - Optimized workflow for Hytale content

## Create a New Model

### Starting a Hytale Model Project

1. Open Blockbench
2. Go to **File > New**
3. Select **Hytale Model**
4. Configure project settings:
   - Name your model
   - Set resolution (texture size)
   - Choose base template if available
5. Click **Create**

### Project Settings

When creating a new Hytale Model:

| Setting | Description |
|---------|-------------|
| Name | Model identifier |
| Resolution | Texture dimensions (e.g., 64x64) |
| Box UV | UV mapping style |

## Workspace Overview

After creating a project, you'll see:

- **3D Viewport** - Visual model editor
- **Outliner** - Bone and element hierarchy
- **UV Editor** - Texture mapping
- **Timeline** - Animation keyframes (in animation mode)

## Plugin Settings

Access plugin settings via **File > Preferences > Settings**

Key settings for Hytale workflow:
- Export paths
- Default textures
- Bone naming conventions

## Best Practices

1. **Use consistent naming** - Follow Hytale's bone naming conventions
2. **Check pixel ratios** - Ensure textures match Hytale's style
3. **Organize hierarchy** - Keep bones well-organized for animation
4. **Test frequently** - Export and test in-game often

## Troubleshooting

### Plugin Not Showing

If the Hytale Model option doesn't appear:
1. Check that the plugin is enabled in **File > Plugins**
2. Restart Blockbench
3. Reinstall the plugin

### Export Issues

If exports fail:
1. Verify all required fields are filled
2. Check bone hierarchy is valid
3. Ensure textures are properly assigned

## Next Steps

- [Modeling Guide](/docs/tools/blockbench/modeling) - Create 3D models
- [Animation Guide](/docs/tools/blockbench/animation) - Animate your models
