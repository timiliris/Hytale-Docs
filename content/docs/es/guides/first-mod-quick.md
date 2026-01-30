---
id: first-mod-quick
title: Your First Mod in 10 Minutes
sidebar_label: Quick First Mod
sidebar_position: 6
description: Create your first Hytale mod in just 10 minutes - no coding required!
---

# Your First Mod in 10 Minutes

Creating a Hytale mod is **EASY**! You don't need to know how to code to create content packs. In this tutorial, you'll create a custom decorative block in just 10 minutes.

:::tip No Coding Required
Hytale's Data Assets system uses simple JSON files that anyone can edit. If you can copy and paste, you can create mods!
:::

## What We're Building

By the end of this tutorial, you'll have:

- A custom decorative block called "My First Block"
- A custom texture for your block
- A working mod that loads in Hytale

Let's get started!

---

## Prerequisites (2 minutes)

Before we begin, make sure you have:

1. **Hytale installed** on your computer
2. **A text editor** - We recommend [VS Code](https://code.visualstudio.com/) (free), but Notepad works too
3. **A 16x16 pixel image** for your block texture (or use our template below)

:::info Don't Have an Image Editor?
You can use free online tools like [Piskel](https://www.piskelapp.com/) or [Pixilart](https://www.pixilart.com/) to create your 16x16 texture. Or simply download our starter template!
:::

---

## Step 1: Create the Mod Structure (2 minutes)

First, we need to create the folder structure for our mod. Your mod will look like this:

```
my-first-mod/
├── pack.json
├── data/
│   └── blocks/
│       └── my_block.json
└── assets/
    └── textures/
        └── blocks/
            └── my_block.png
```

### Creating the Folders

**On Windows:**

Open Command Prompt and run:

```batch
cd %APPDATA%\Hytale\mods
mkdir my-first-mod
cd my-first-mod
mkdir data\blocks
mkdir assets\textures\blocks
```

**On macOS/Linux:**

Open Terminal and run:

```bash
cd ~/Library/Application Support/Hytale/mods  # macOS
# OR
cd ~/.local/share/Hytale/mods  # Linux

mkdir -p my-first-mod/data/blocks
mkdir -p my-first-mod/assets/textures/blocks
cd my-first-mod
```

:::tip Quick Method
You can also create these folders manually using File Explorer (Windows) or Finder (macOS). Just navigate to your Hytale mods folder and create the folder structure shown above.
:::

---

## Step 2: Create pack.json (1 minute)

The `pack.json` file tells Hytale about your mod. Create a new file called `pack.json` in your `my-first-mod` folder with this content:

```json
{
  "name": "My First Mod",
  "version": "1.0.0",
  "author": "YourName",
  "description": "My first Hytale mod - a custom block!"
}
```

### What Each Property Means

| Property | Description |
|----------|-------------|
| `name` | The display name of your mod |
| `version` | Your mod's version number (use [semantic versioning](https://semver.org/)) |
| `author` | Your name or username |
| `description` | A short description shown in the mod list |

:::note
Replace `YourName` with your actual name or username!
:::

---

## Step 3: Create the Block Definition (3 minutes)

Now for the exciting part - defining your custom block! Create a file called `my_block.json` in the `data/blocks/` folder:

```json
{
  "id": "myfirstmod:my_block",
  "displayName": "My First Block",
  "properties": {
    "hardness": 1.0,
    "resistance": 1.0,
    "tool": "pickaxe",
    "drops": "self"
  },
  "texture": "myfirstmod:blocks/my_block"
}
```

### Understanding Each Property

| Property | Value | What It Does |
|----------|-------|--------------|
| `id` | `"myfirstmod:my_block"` | Unique identifier for your block. Format: `modname:blockname` |
| `displayName` | `"My First Block"` | The name players see in-game |
| `hardness` | `1.0` | How long it takes to mine (higher = slower) |
| `resistance` | `1.0` | Resistance to explosions |
| `tool` | `"pickaxe"` | The best tool to mine this block |
| `drops` | `"self"` | What drops when mined (itself) |
| `texture` | `"myfirstmod:blocks/my_block"` | Path to your texture file |

:::tip Customization Ideas
- Set `hardness` to `0` for an instant-break block
- Set `hardness` to `50` for an extremely tough block
- Change `tool` to `"axe"`, `"shovel"`, or `"none"`
:::

---

## Step 4: Add Your Texture (2 minutes)

Your block needs a texture! This is a 16x16 pixel PNG image.

### Option A: Create Your Own

1. Open your image editor
2. Create a new 16x16 pixel image
3. Draw your design (keep it simple for your first try!)
4. Save as `my_block.png` in the `assets/textures/blocks/` folder

### Option B: Use a Starter Texture

Create a simple solid color texture as a placeholder. Here's what you can do:

1. Use any 16x16 PNG image
2. A simple solid color or pattern works fine
3. You can always replace it later!

### Texture Tips

- Keep designs simple and readable at small sizes
- Use consistent lighting (light from top-left)
- Avoid too many small details
- Test how it looks when tiled (blocks next to each other)

---

## Step 5: Install the Mod (1 minute)

Your mod should already be in the right place if you followed Step 1. Let's verify:

### Mod Location

| Platform | Path |
|----------|------|
| **Windows** | `%APPDATA%\Hytale\mods\my-first-mod\` |
| **macOS** | `~/Library/Application Support/Hytale/mods/my-first-mod/` |
| **Linux** | `~/.local/share/Hytale/mods/my-first-mod/` |

### Final Structure Check

Your folder should look like this:

```
my-first-mod/
├── pack.json                          ✓
├── data/
│   └── blocks/
│       └── my_block.json              ✓
└── assets/
    └── textures/
        └── blocks/
            └── my_block.png           ✓
```

---

## Step 6: Test Your Mod! (1 minute)

Time to see your creation in action!

1. **Launch Hytale**
2. **Start a new world** in Creative Mode
3. **Open your inventory** (press `E`)
4. **Search for "My First Block"** in the search bar
5. **Place it in the world!**

:::success Congratulations!
If you can see and place your block, you've successfully created your first Hytale mod!
:::

---

## Congratulations!

You did it! You've created your first Hytale mod. Here's what you accomplished:

- Created a mod folder structure
- Defined a pack manifest
- Created a custom block with properties
- Added a custom texture
- Installed and tested your mod

### What You Learned

- Hytale mods use simple JSON files
- The `pack.json` file describes your mod
- Block definitions specify properties like hardness and texture
- Textures are 16x16 PNG images
- Mods go in the `mods` folder of your Hytale installation

---

## Next Steps

Now that you've created your first block, here are some ideas to expand your mod:

### Add More Blocks

Duplicate `my_block.json`, rename it, and change the properties to create variations:

```json
{
  "id": "myfirstmod:glowing_block",
  "displayName": "Glowing Block",
  "properties": {
    "hardness": 1.0,
    "resistance": 1.0,
    "lightLevel": 15
  },
  "texture": "myfirstmod:blocks/glowing_block"
}
```

### Create Items

Add an `items` folder and create custom items:

```json
{
  "id": "myfirstmod:magic_gem",
  "displayName": "Magic Gem",
  "maxStackSize": 64,
  "texture": "myfirstmod:items/magic_gem"
}
```

### Add Crafting Recipes

Define how players can craft your items:

```json
{
  "type": "crafting_shaped",
  "pattern": [
    "AAA",
    "ABA",
    "AAA"
  ],
  "key": {
    "A": "minecraft:stone",
    "B": "minecraft:diamond"
  },
  "result": {
    "item": "myfirstmod:magic_gem",
    "count": 1
  }
}
```

---

## Going Further

Ready to learn more? Check out these resources:

- [Creating Blocks](/docs/modding/data-assets/blocks/creating-blocks) - Full block documentation
- [Block Properties](/docs/modding/data-assets/blocks/block-properties) - All available properties
- [Creating Items](/docs/modding/data-assets/items/creating-items) - Make custom items
- [Crafting Recipes](/docs/modding/data-assets/items/crafting-recipes) - Add recipes
- [Art Assets Overview](/docs/modding/art-assets/overview) - Create custom models

---

## Troubleshooting

Having issues? Here are solutions to common problems:

### Block Doesn't Appear in Game

**Possible causes:**
- JSON syntax error - Use [JSONLint](https://jsonlint.com/) to validate your files
- Wrong folder location - Double-check the mod is in the `mods` folder
- Typo in the block ID - Make sure the ID matches exactly

**Solution:** Check the Hytale console/log for error messages pointing to the issue.

### Texture is Pink/Missing

**Possible causes:**
- Texture file not found - Check the path in your block definition
- Wrong file format - Must be PNG
- Wrong file name - Names are case-sensitive!

**Solution:** Verify the texture path matches exactly:
```
texture: "myfirstmod:blocks/my_block"
         └── maps to: assets/textures/blocks/my_block.png
```

### Game Crashes on Load

**Possible causes:**
- Invalid JSON syntax (missing comma, bracket, etc.)
- Invalid property values
- Circular references

**Solution:**
1. Validate all JSON files with [JSONLint](https://jsonlint.com/)
2. Remove your mod and add files back one at a time
3. Check the crash log for specific errors

### Mod Not Recognized

**Possible causes:**
- Missing or invalid `pack.json`
- Mod folder in wrong location

**Solution:** Ensure `pack.json` exists and contains valid JSON at the root of your mod folder.

---

## Complete Code Reference

Here's all the code from this tutorial in one place for easy copying:

### pack.json

```json
{
  "name": "My First Mod",
  "version": "1.0.0",
  "author": "YourName",
  "description": "My first Hytale mod - a custom block!"
}
```

### data/blocks/my_block.json

```json
{
  "id": "myfirstmod:my_block",
  "displayName": "My First Block",
  "properties": {
    "hardness": 1.0,
    "resistance": 1.0,
    "tool": "pickaxe",
    "drops": "self"
  },
  "texture": "myfirstmod:blocks/my_block"
}
```

---

*Happy modding! Remember, every great modder started with their first block.*
