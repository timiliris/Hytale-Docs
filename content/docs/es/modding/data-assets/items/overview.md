---
id: items-overview
title: Items Overview
sidebar_label: Overview
sidebar_position: 0
description: Introduction to item modding in Hytale
---

# Items Overview

Items are objects that players can collect, use, and interact with. This section covers everything about creating custom items.

## What Are Items?

Items in Hytale include weapons, tools, armor, consumables, materials, and more. Each item has properties that define its functionality and appearance.

## Item Components

An item definition consists of several components:

| Component | Description |
|-----------|-------------|
| **Identity** | Unique ID and display name |
| **Type** | Category (weapon, tool, armor, etc.) |
| **Properties** | Stats and characteristics |
| **Behaviors** | Special effects and interactions |
| **Visuals** | Model, textures, icons |

## File Structure

Item definitions are stored as JSON files:

```
my_mod/
  data/
    items/
      ruby_sword.json
  assets/
    textures/
      items/
        ruby_sword.png
    models/
      items/
        ruby_sword.blockymodel
```

## Basic Example

```json
{
  "id": "my_mod:ruby_sword",
  "displayName": "Ruby Sword",
  "type": "weapon",
  "properties": {
    "damage": 12,
    "attackSpeed": 1.2,
    "durability": 750
  }
}
```

## Item Categories

### Weapons
- Swords, axes, maces
- Bows, crossbows
- Magic staffs, wands

### Tools
- Pickaxes, shovels, axes
- Fishing rods
- Special utility items

### Armor
- Helmets, chestplates
- Leggings, boots
- Accessories (rings, amulets)

### Consumables
- Food and drinks
- Potions
- Scrolls

### Materials
- Crafting ingredients
- Ores and gems
- Monster drops

## Next Steps

- [Creating Items](/docs/modding/data-assets/items/creating-items) - Step-by-step guide
- [Item Properties](/docs/modding/data-assets/items/properties) - Property reference
- [Item Behaviors](/docs/modding/data-assets/items/behaviors) - Add special effects
- [Crafting Recipes](/docs/modding/data-assets/items/crafting-recipes) - Define recipes
