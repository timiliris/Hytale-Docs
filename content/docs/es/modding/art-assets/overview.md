---
id: overview
title: Art Assets Overview
sidebar_label: Overview
sidebar_position: 1
description: Creating visual content for Hytale
---

# Art Assets Overview

Art assets bring your mods to life with custom visuals.

## Asset Types

| Type | Format | Tool |
|------|--------|------|
| 3D Models | `.blockymodel` | Blockbench |
| Animations | `.blockyanim` | Blockbench |
| Textures | `.png` | Image editor |
| Sounds | `.ogg` | Audio editor |

## Blockbench

The primary tool for Hytale 3D content:

- Official Hytale plugin
- Model creation
- Animation system
- Bone hierarchy support

[Blockbench Setup Guide](/docs/tools/blockbench/installation)

## Texture Specifications

| Property | Requirement |
|----------|-------------|
| Format | PNG |
| Dimensions | Multiples of 32px |
| Texel Density | 64px/unit (characters), 32px/unit (blocks) |
| Style | Hand-painted, no PBR |

## Model Guidelines

### Geometry

- Use cuboids and quads only
- Minimize polygon count
- Optimize for performance

### Bone Hierarchy

```
waist (root)
├── torso
│   ├── shoulder_left → elbow_left → hand_left
│   ├── shoulder_right → elbow_right → hand_right
│   └── head
├── hip_left → knee_left → foot_left
└── hip_right → knee_right → foot_right
```

## Getting Started

- [Blockbench Installation](/docs/tools/blockbench/installation)
- [Modeling Guide](/docs/tools/blockbench/modeling)
- [Animation Guide](/docs/tools/blockbench/animation)
