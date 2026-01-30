---
id: behaviors
title: Block Behaviors
sidebar_label: Behaviors
sidebar_position: 3
description: Add interactive behaviors to your blocks in Hytale
---

# Block Behaviors

Add interactive behaviors to make your blocks dynamic and engaging.

## What Are Behaviors?

Behaviors are modular components that define how a block interacts with the world. Multiple behaviors can be combined on a single block.

## Available Behaviors

### Gravity

Makes the block fall when unsupported, like sand or gravel.

```json
{
  "behaviors": [
    {
      "type": "gravity",
      "fallDelay": 2
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `fallDelay` | number | Ticks before falling (default: 2) |

### Liquid

Makes the block flow like water or lava.

```json
{
  "behaviors": [
    {
      "type": "liquid",
      "flowSpeed": 4,
      "flowDistance": 7,
      "infinite": true
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `flowSpeed` | number | Ticks between flow updates |
| `flowDistance` | number | Maximum spread distance |
| `infinite` | boolean | Self-replenishing source |

### Emissive

Makes the block produce light.

```json
{
  "behaviors": [
    {
      "type": "emissive",
      "lightLevel": 15,
      "color": "#FFD700"
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `lightLevel` | number | Light intensity (0-15) |
| `color` | string | Light color (hex) |

### Interactive

Responds to player right-click actions.

```json
{
  "behaviors": [
    {
      "type": "interactive",
      "action": "open_gui",
      "gui": "my_mod:custom_menu"
    }
  ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `action` | string | Action type |
| `gui` | string | GUI identifier (if applicable) |

### Rotatable

Allows the block to be placed in different orientations.

```json
{
  "behaviors": [
    {
      "type": "rotatable",
      "axes": ["horizontal", "vertical"]
    }
  ]
}
```

### Connectable

Connects visually to adjacent blocks of the same type.

```json
{
  "behaviors": [
    {
      "type": "connectable",
      "connectTo": ["my_mod:fence", "my_mod:wall"]
    }
  ]
}
```

### Breakable

Custom breaking behavior.

```json
{
  "behaviors": [
    {
      "type": "breakable",
      "drops": [
        { "item": "my_mod:gem", "count": [1, 3] }
      ],
      "experience": 5
    }
  ]
}
```

## Combining Behaviors

Blocks can have multiple behaviors:

```json
{
  "id": "my_mod:glowing_sand",
  "displayName": "Glowing Sand",
  "behaviors": [
    {
      "type": "gravity"
    },
    {
      "type": "emissive",
      "lightLevel": 10,
      "color": "#FFFF00"
    }
  ]
}
```

## Custom Behaviors

For advanced modding, you can create custom behaviors using the plugin API.

```java
@BlockBehavior("my_mod:custom_behavior")
public class CustomBehavior implements IBlockBehavior {
    @Override
    public void onInteract(BlockInteractEvent event) {
        // Custom logic
    }
}
```

## See Also

- [Creating Blocks](/docs/modding/data-assets/blocks/creating-blocks)
- [Block Properties](/docs/modding/data-assets/blocks/properties)
- [Plugin Development](/docs/modding/plugins/overview)
