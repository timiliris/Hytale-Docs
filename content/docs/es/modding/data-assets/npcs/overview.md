---
id: npcs-overview
title: NPCs Overview
sidebar_label: Overview
sidebar_position: 0
description: Introduction to NPC modding in Hytale
---

# NPCs Overview

NPCs (Non-Player Characters) are entities that populate the world of Hytale. This section covers creating and customizing NPCs.

## What Are NPCs?

NPCs include creatures, monsters, villagers, and any non-player entity with AI behavior. They can be friendly, hostile, or neutral.

## NPC Components

An NPC definition consists of several components:

| Component | Description |
|-----------|-------------|
| **Identity** | Unique ID and display name |
| **Stats** | Health, damage, speed |
| **AI System** | Behavior trees and goals |
| **Visuals** | Model, textures, animations |
| **Loot** | Drop tables |

## File Structure

NPC definitions are stored as JSON files:

```
my_mod/
  data/
    npcs/
      custom_creature.json
  assets/
    models/
      npcs/
        custom_creature.blockymodel
    textures/
      npcs/
        custom_creature.png
    animations/
      npcs/
        custom_creature/
          idle.animation
          walk.animation
```

## Basic Example

```json
{
  "id": "my_mod:custom_creature",
  "displayName": "Custom Creature",
  "stats": {
    "health": 20,
    "damage": 5,
    "speed": 0.25
  },
  "model": "models/npcs/custom_creature.blockymodel"
}
```

## NPC Categories

### Hostile
- Monsters that attack players
- Dungeon enemies
- Boss creatures

### Passive
- Animals that flee from threats
- Ambient wildlife
- Resource creatures

### Neutral
- Attack only when provoked
- Territorial creatures
- Guardians

### Friendly
- Villagers and traders
- Quest givers
- Allied companions

## NPC Stats

| Stat | Type | Description |
|------|------|-------------|
| `health` | number | Maximum health points |
| `damage` | number | Base attack damage |
| `speed` | number | Movement speed |
| `armor` | number | Damage reduction |
| `knockbackResistance` | number | Knockback reduction (0-1) |

## Next Steps

- [Creating NPCs](/docs/modding/data-assets/npcs/creating-npcs) - Step-by-step guide
- [AI System](/docs/modding/data-assets/npcs/ai-system) - Configure behaviors
- [Behaviors](/docs/modding/data-assets/npcs/behaviors) - Behavior types
- [Sensors & Actions](/docs/modding/data-assets/npcs/sensors-actions) - AI components
