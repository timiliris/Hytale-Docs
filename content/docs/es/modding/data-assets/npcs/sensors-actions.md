---
id: sensors-actions
title: Sensors & Actions
sidebar_label: Sensors & Actions
sidebar_position: 3
---

# Sensors & Actions

NPC AI uses sensors and actions.

## Sensors

Detect environmental conditions:

```json
{
  "sensor": {
    "type": "player_detection",
    "range": 10
  }
}
```

## Actions

Respond to sensors:

```json
{
  "action": {
    "type": "follow",
    "speed": 1.5
  }
}
```
