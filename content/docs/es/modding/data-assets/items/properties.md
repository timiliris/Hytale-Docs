---
id: item-properties
title: Item Properties
sidebar_label: Properties
sidebar_position: 2
description: Reference for all available item properties in Hytale
---

# Item Properties

Complete reference for all available item properties.

## Core Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxStackSize` | number | 64 | Maximum stack count |
| `durability` | number | null | Item durability (null = unbreakable) |
| `rarity` | string | "common" | Item rarity tier |
| `category` | string | null | Inventory category |

### Rarity Tiers

| Rarity | Color | Description |
|--------|-------|-------------|
| `common` | White | Standard items |
| `uncommon` | Green | Slightly better |
| `rare` | Blue | Notable items |
| `epic` | Purple | Powerful items |
| `legendary` | Orange | Exceptional items |

## Weapon Properties

| Property | Type | Description |
|----------|------|-------------|
| `damage` | number | Base damage dealt |
| `attackSpeed` | number | Attacks per second |
| `knockback` | number | Knockback force |
| `reach` | number | Attack range |
| `critChance` | number | Critical hit chance (0-1) |
| `critMultiplier` | number | Critical damage multiplier |

```json
{
  "type": "weapon",
  "weaponType": "sword",
  "properties": {
    "damage": 10,
    "attackSpeed": 1.4,
    "knockback": 0.5,
    "reach": 3.0,
    "critChance": 0.1,
    "critMultiplier": 1.5
  }
}
```

## Tool Properties

| Property | Type | Description |
|----------|------|-------------|
| `miningSpeed` | number | Block breaking speed multiplier |
| `harvestLevel` | number | Tool tier for harvesting |
| `efficiency` | number | Overall tool efficiency |
| `toolType` | string | Tool category |

```json
{
  "type": "tool",
  "toolType": "pickaxe",
  "properties": {
    "miningSpeed": 8.0,
    "harvestLevel": 3,
    "efficiency": 9.0,
    "durability": 1500
  }
}
```

## Armor Properties

| Property | Type | Description |
|----------|------|-------------|
| `defense` | number | Damage reduction |
| `toughness` | number | Resistance to high damage |
| `slot` | string | Equipment slot |
| `weight` | string | Movement penalty category |

```json
{
  "type": "armor",
  "slot": "chest",
  "properties": {
    "defense": 8,
    "toughness": 2.5,
    "weight": "heavy"
  }
}
```

### Armor Slots

- `head` - Helmets
- `chest` - Chestplates
- `legs` - Leggings
- `feet` - Boots
- `accessory` - Rings, amulets

## Consumable Properties

| Property | Type | Description |
|----------|------|-------------|
| `consumeTime` | number | Time to consume (ticks) |
| `nutrition` | number | Hunger restored |
| `saturation` | number | Saturation bonus |
| `effects` | array | Status effects applied |

```json
{
  "type": "consumable",
  "properties": {
    "consumeTime": 32,
    "nutrition": 8,
    "saturation": 1.2,
    "effects": [
      {
        "type": "regeneration",
        "duration": 200,
        "amplifier": 1
      }
    ]
  }
}
```

## Visual Properties

| Property | Type | Description |
|----------|------|-------------|
| `icon` | string | Inventory icon texture |
| `model` | string | 3D model path |
| `color` | string | Tint color (hex) |
| `enchantGlint` | boolean | Show enchantment effect |

## See Also

- [Creating Items](/docs/modding/data-assets/items/creating-items)
- [Item Behaviors](/docs/modding/data-assets/items/behaviors)
- [Item Types](/docs/modding/data-assets/items/item-types)
