---
id: item-behaviors
title: Item Behaviors
sidebar_label: Behaviors
sidebar_position: 3
description: Add special behaviors and effects to your items in Hytale
---

# Item Behaviors

Add special behaviors and effects to make your items unique and interactive.

## What Are Item Behaviors?

Behaviors define how an item interacts with the world beyond its basic properties. They enable special effects, abilities, and unique mechanics.

## Available Behaviors

### On Use

Triggers when the player uses the item (right-click).

```json
{
  "behaviors": [
    {
      "type": "onUse",
      "action": "spawn_projectile",
      "projectile": "my_mod:magic_bolt",
      "cooldown": 20
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `action` | string | Action to perform |
| `cooldown` | number | Ticks between uses |

### On Hit

Triggers when hitting an entity with the item.

```json
{
  "behaviors": [
    {
      "type": "onHit",
      "effects": [
        {
          "type": "poison",
          "duration": 100,
          "amplifier": 0,
          "chance": 0.3
        }
      ]
    }
  ]
}
```

### On Block Break

Triggers when breaking a block with the item.

```json
{
  "behaviors": [
    {
      "type": "onBlockBreak",
      "action": "aoe_break",
      "radius": 1
    }
  ]
}
```

### On Equip

Triggers when the item is equipped.

```json
{
  "behaviors": [
    {
      "type": "onEquip",
      "effects": [
        {
          "type": "speed",
          "amplifier": 1
        }
      ]
    }
  ]
}
```

### Passive

Constant effects while in inventory or equipped.

```json
{
  "behaviors": [
    {
      "type": "passive",
      "condition": "equipped",
      "effects": [
        {
          "type": "night_vision"
        }
      ]
    }
  ]
}
```

### Throwable

Makes the item throwable.

```json
{
  "behaviors": [
    {
      "type": "throwable",
      "velocity": 1.5,
      "gravity": 0.03,
      "damage": 5,
      "consumeOnThrow": true
    }
  ]
}
```

### Placeable

Allows the item to place a block.

```json
{
  "behaviors": [
    {
      "type": "placeable",
      "block": "my_mod:custom_block"
    }
  ]
}
```

### Fuel

Makes the item usable as fuel in furnaces.

```json
{
  "behaviors": [
    {
      "type": "fuel",
      "burnTime": 200
    }
  ]
}
```

## Action Types

| Action | Description |
|--------|-------------|
| `spawn_projectile` | Fire a projectile |
| `teleport` | Teleport the player |
| `heal` | Restore health |
| `aoe_break` | Break multiple blocks |
| `summon` | Summon an entity |
| `play_sound` | Play a sound effect |
| `spawn_particles` | Create particle effects |

## Combining Behaviors

Items can have multiple behaviors:

```json
{
  "id": "my_mod:blazing_sword",
  "displayName": "Blazing Sword",
  "type": "weapon",
  "behaviors": [
    {
      "type": "onHit",
      "effects": [
        { "type": "fire", "duration": 60 }
      ]
    },
    {
      "type": "passive",
      "condition": "held",
      "action": "emit_light",
      "lightLevel": 10
    }
  ]
}
```

## Custom Behaviors

For advanced modding, create custom behaviors with the plugin API:

```java
@ItemBehavior("my_mod:custom_ability")
public class CustomAbility implements IItemBehavior {
    @Override
    public void onUse(ItemUseEvent event) {
        // Custom logic
    }
}
```

## See Also

- [Creating Items](/docs/modding/data-assets/items/creating-items)
- [Item Properties](/docs/modding/data-assets/items/properties)
- [Plugin Development](/docs/modding/plugins/overview)
