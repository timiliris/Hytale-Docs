---
id: crafting-guide
title: Crafting Guide
sidebar_label: Crafting
sidebar_position: 7
description: Guide to Hytale's crafting system - workbenches, recipes, and pocket crafting
---

# Crafting Guide

Welcome to the crafting guide for Hytale. Unlike traditional grid-based crafting systems, Hytale uses a **recipe-based crafting system** with specialized benches and categories.

:::note Early Access
Hytale is currently in Early Access. Crafting mechanics and recipes may change as the game develops.
:::

## How Crafting Works

Hytale's crafting system does **not** use a crafting grid. Instead, crafting works through:

1. **Recipes** - Each craftable item has a defined recipe with required materials
2. **Workbenches** - Specialized crafting stations for different item types
3. **Pocket Crafting** - Portable crafting accessible from your inventory
4. **Categories** - Recipes are organized into categories for easy navigation

### The Crafting Process

1. Open a workbench or access Pocket Crafting from your inventory
2. Browse recipes by category
3. Select a recipe you want to craft
4. If you have the required materials, craft the item
5. Some recipes require time to complete

## Workbench Types

Hytale features **eight craftable workbenches**, each specialized for different crafting purposes:

| Workbench | Purpose | Recipe |
|-----------|---------|--------|
| **Basic Workbench** | Starting station, crafts other workbenches | 4x Tree Trunk + 3x Stone (via Pocket Crafting) |
| **Builder's Workbench** | Blocks, building materials, furniture | 6x Tree Trunk + 3x Stone |
| **Farmer's Workbench** | Farming tools, seed bags, agriculture items | Early game priority |
| **Armorer's Workbench** | Armor pieces: Helm, Cuirass, Gauntlets, Greaves, Shields | 2x Copper Ingot + 10x Tree Trunk + 5x Stone |
| **Blacksmith's Anvil** | Weapons, tools, pickaxes | 2x Copper Ingot + 10x Tree Trunk + 5x Stone |
| **Salvager's Workbench** | Breaks down gear into raw materials | 6x Iron Ingot + 5x Tree Trunk + 5x Stone |
| **Alchemist's Workbench** | Potions and chemical items | 20x Stone + 5x Gold Ingot + 10x Venom Sac + 10x Bone Fragment |
| **Arcanist's Workbench** | Late-game magical crafting | Thorium + Essence of the Void (late-game) |
| **Furniture Workbench** | Decorative furniture (optional) | Aesthetic items only |

### Processing Stations

| Station | Purpose | Notes |
|---------|---------|-------|
| **Furnace** | Smelts ore into ingots | Requires fuel (sticks, wood, charcoal) |
| **Campfire** | Cooks food, produces charcoal | Basic processing |

### Workbench Tiers

Workbenches can be upgraded through **three tiers**, providing benefits:

- **Tier 1** - Basic recipes, starting equipment
- **Tier 2** - Advanced recipes, better tools (requires: 30x Copper Ingot + 20x Iron Ingot + 20x Linen Scraps)
- **Tier 3** - End-game recipes, highest tier equipment

:::tip Upgrade Strategy
Only upgrade workbenches when you find higher-tier materials. For example, upgrade the Armorer's Workbench to Tier 2 when you find Iron, and to Tier 3 when you find Thorium.
:::

## Pocket Crafting (Portable Crafting)

Pocket Crafting is the portable crafting system you can access anywhere from your inventory. It's essential for getting started and crafting basic items while exploring.

### Accessing Pocket Crafting

1. Open your inventory (press **Tab**)
2. Select the crafting menu (press **C** or click the crafting tab)
3. Browse available recipes

### What You Can Craft

Pocket Crafting allows you to create:

- **Crude Tools** - Crude Pickaxe, Crude Hatchet, Crude Sword, Crude Shovel
- **Basic Workbench** - Your first crafting station (4x Tree Trunk + 3x Stone)
- **Basic survival items** - Torches, basic materials

:::note First Steps
Your first crafts should be: Crude Pickaxe, Crude Hatchet, and Crude Sword. Then craft the Basic Workbench to unlock more recipes.
:::

## Recipe Structure

Each recipe in Hytale consists of:

| Component | Description |
|-----------|-------------|
| **Input Materials** | Required items/resources to craft |
| **Primary Output** | The main item you receive |
| **Secondary Outputs** | Additional items sometimes produced |
| **Bench Requirement** | Which bench and tier is needed |
| **Crafting Time** | How long the craft takes |
| **Knowledge Required** | Whether you must learn the recipe first |

### Material Types

Recipes can accept materials in different ways:

- **Specific Item** - Only a specific item works
- **Resource Type** - Any item of that resource type (e.g., any wood)
- **Item Tag** - Items with a matching tag

## Recipe Learning

Some recipes must be discovered or learned before you can craft them.

### Ways to Learn Recipes

- **Discovery** - Find and interact with items in the world
- **Recipe Items** - Consume special items that teach recipes
- **Progression** - Unlock through world progression (Memories system)

## Fuel System

Furnaces and other processing stations require fuel to operate.

### Fuel Types

| Fuel | Burn Time | Notes |
|------|-----------|-------|
| **Sticks** | Short | Good for small batches (~4 sticks per ore) |
| **Wood Logs** | Medium | Common early-game fuel |
| **Charcoal** | Long | Best fuel, burns longest |

### Making Charcoal

Charcoal is produced as a **byproduct** whenever you use fuel in a Furnace or Campfire:

1. Place fuel (sticks, wood, plant fiber) in the fuel slot
2. Turn on the station
3. Charcoal is produced alongside your smelted item
4. You can also convert fuel directly to charcoal (1:1 ratio)

:::tip Fuel Strategy
Use wood directly early game, then set up charcoal production once you have surplus logs. Charcoal stacks efficiently and burns longer.
:::

## Crafting Tips

### Getting Started

1. **Use Pocket Crafting** - Open your inventory (Tab) to access portable crafting
2. **Craft Crude Tools** - Make a Crude Pickaxe, Hatchet, and Sword first
3. **Build a Workbench** - Craft the Basic Workbench (4x Tree Trunk + 3x Stone)
4. **Expand Your Stations** - Build the Builder's Workbench to unlock all other specialized stations

### Material Storage

Benches can automatically pull materials from nearby chests:

- Horizontal search radius: 7 blocks
- Vertical search radius: 3 blocks
- Maximum chests searched: 100

Keep your materials organized in chests near your crafting stations for convenience.

## See Also

- [Crafting System (Technical)](/docs/api/server-internals/modules/crafting-system) - Detailed technical documentation
- [Items](/docs/modding/data-assets/items/overview) - Item definitions and properties

## Recommended Workbench Progression

1. **Basic Workbench** - Craft first via Pocket Crafting
2. **Builder's Workbench** - Unlocks all other specialized stations
3. **Farmer's Workbench** - Essential for food and agriculture
4. **Armorer's Workbench** - Once you have Copper Ingots
5. **Blacksmith's Anvil** - For weapons and better tools
6. **Salvager's Workbench** - When you have Iron and excess gear
7. **Alchemist's Workbench** - When farming Gold and mob drops
8. **Arcanist's Workbench** - Late-game goal (requires Thorium and Essence of the Void)

---

*This guide covers the core crafting mechanics. Specific recipes and items are still being documented as Hytale develops during Early Access.*
