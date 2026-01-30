---
id: ai-system
title: AI System
sidebar_label: AI System
sidebar_position: 2
description: Understanding and configuring the NPC AI system in Hytale
---

# AI System

Hytale's AI system uses behavior trees and goals to create intelligent, responsive NPCs.

## Overview

The AI system is built on several core concepts:

| Concept | Description |
|---------|-------------|
| **Goals** | High-level objectives (attack, flee, wander) |
| **Sensors** | Detect world state (see player, hear sound) |
| **Actions** | Specific behaviors (move, attack, idle) |
| **Behavior Trees** | Decision-making logic |

## Behavior Trees

Behavior trees define how NPCs make decisions. They consist of nodes that are evaluated in order.

```json
{
  "ai": {
    "behaviorTree": {
      "type": "selector",
      "children": [
        {
          "type": "sequence",
          "children": [
            { "type": "sensor", "sensor": "seeEnemy" },
            { "type": "action", "action": "attack" }
          ]
        },
        {
          "type": "action",
          "action": "wander"
        }
      ]
    }
  }
}
```

### Node Types

| Type | Description |
|------|-------------|
| `selector` | Runs children until one succeeds |
| `sequence` | Runs children until one fails |
| `parallel` | Runs all children simultaneously |
| `decorator` | Modifies child behavior |

## Goals

Goals are prioritized objectives that the NPC tries to accomplish.

```json
{
  "ai": {
    "goals": [
      {
        "type": "attackTarget",
        "priority": 1,
        "targetTypes": ["player", "villager"]
      },
      {
        "type": "wander",
        "priority": 5,
        "radius": 10
      },
      {
        "type": "lookAround",
        "priority": 6
      }
    ]
  }
}
```

### Common Goals

| Goal | Description |
|------|-------------|
| `attackTarget` | Attack detected enemies |
| `flee` | Run from threats |
| `wander` | Random movement |
| `follow` | Follow a target |
| `patrol` | Move between waypoints |
| `guard` | Protect an area |
| `idle` | Stand still |
| `lookAround` | Look at surroundings |

## Sensors

Sensors detect conditions in the world.

```json
{
  "ai": {
    "sensors": [
      {
        "type": "sight",
        "range": 16,
        "angle": 120
      },
      {
        "type": "hearing",
        "range": 10
      },
      {
        "type": "damage",
        "remember": 200
      }
    ]
  }
}
```

### Sensor Types

| Sensor | Description |
|--------|-------------|
| `sight` | Detect visible entities |
| `hearing` | Detect sounds |
| `damage` | Remember attackers |
| `proximity` | Detect nearby entities |
| `time` | Day/night awareness |
| `health` | Health threshold detection |

## Target Selection

Configure how NPCs choose targets.

```json
{
  "ai": {
    "targeting": {
      "types": ["player", "villager"],
      "range": 20,
      "priority": "nearest",
      "requireLineOfSight": true
    }
  }
}
```

### Priority Modes

| Mode | Description |
|------|-------------|
| `nearest` | Closest target |
| `lowest_health` | Weakest target |
| `highest_threat` | Most dangerous target |
| `random` | Random selection |

## Movement

Configure NPC movement behavior.

```json
{
  "ai": {
    "movement": {
      "walkSpeed": 0.25,
      "runSpeed": 0.5,
      "swimSpeed": 0.15,
      "jumpHeight": 1.2,
      "canFly": false,
      "canSwim": true,
      "avoidsWater": true
    }
  }
}
```

## Combat AI

Configure combat behavior.

```json
{
  "ai": {
    "combat": {
      "attackRange": 2.0,
      "attackCooldown": 20,
      "strafeChance": 0.3,
      "blockChance": 0.2,
      "retreatHealthThreshold": 0.2
    }
  }
}
```

## Complete Example

```json
{
  "id": "my_mod:smart_zombie",
  "displayName": "Smart Zombie",
  "stats": {
    "health": 30,
    "damage": 6,
    "speed": 0.28
  },
  "ai": {
    "sensors": [
      { "type": "sight", "range": 20, "angle": 140 },
      { "type": "hearing", "range": 15 },
      { "type": "damage", "remember": 400 }
    ],
    "goals": [
      { "type": "attackTarget", "priority": 1 },
      { "type": "wander", "priority": 5, "radius": 15 },
      { "type": "lookAround", "priority": 6 }
    ],
    "targeting": {
      "types": ["player"],
      "range": 25,
      "priority": "nearest"
    },
    "combat": {
      "attackRange": 2.5,
      "attackCooldown": 15,
      "strafeChance": 0.4
    },
    "movement": {
      "walkSpeed": 0.2,
      "runSpeed": 0.35,
      "canSwim": false
    }
  }
}
```

## See Also

- [Creating NPCs](/docs/modding/data-assets/npcs/creating-npcs)
- [Behaviors](/docs/modding/data-assets/npcs/behaviors)
- [Sensors & Actions](/docs/modding/data-assets/npcs/sensors-actions)
