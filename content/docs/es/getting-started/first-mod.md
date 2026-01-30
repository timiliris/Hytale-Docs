---
id: first-mod
title: Your First Mod
sidebar_label: Your First Mod
sidebar_position: 4
description: Create your first Hytale mod step by step
---

# Your First Mod

Let's create a simple custom block to get started with Hytale modding.

## Overview

We'll create a "Ruby Block" that:
- Appears in the game
- Has custom properties
- Can be placed and broken

## Step 1: Create the Folder Structure

```
my-first-mod/
├── packs/
│   └── blocks/
│       └── ruby_block.json
└── textures/
    └── blocks/
        └── ruby_block.png
```

## Step 2: Define the Block

Create `packs/blocks/ruby_block.json`:

```json
{
  "id": "my_mod:ruby_block",
  "displayName": "Ruby Block",
  "properties": {
    "hardness": 3.0,
    "resistance": 5.0,
    "material": "stone"
  },
  "texture": "textures/blocks/ruby_block.png"
}
```

## Step 3: Create the Texture

Create a 32x32 pixel PNG texture for your block and save it as `textures/blocks/ruby_block.png`.

:::tip Texture Guidelines

- Textures should be multiples of 32 pixels
- Use the Hytale hand-painted art style
- Keep file sizes reasonable
:::

## Step 4: Install on Server

1. Copy your mod folder to the server's `/mods/` directory
2. Restart the server
3. Join and test!

## Step 5: Test In-Game

Use the creative mode or commands to spawn your block:

```
/give @s my_mod:ruby_block 64
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Block not appearing | Check JSON syntax, verify file paths |
| Texture missing | Ensure PNG is 32x32, check path in JSON |
| Server won't start | Check server logs for errors |

## Next Steps

Congratulations! You've created your first mod. Continue learning:

- [Creating Items](/docs/modding/data-assets/items/creating-items)
- [Creating NPCs](/docs/modding/data-assets/npcs/creating-npcs)
- [Java Plugins](/docs/modding/plugins/overview)
