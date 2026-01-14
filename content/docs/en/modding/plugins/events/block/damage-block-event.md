---
id: damage-block-event
title: DamageBlockEvent
sidebar_label: DamageBlockEvent
---

# DamageBlockEvent

Fired when a block takes damage (during the mining/breaking process). This event allows plugins to intercept block damage, modify damage values, or cancel the damage entirely. Unlike `BreakBlockEvent`, this fires during the breaking process, not when the block is fully destroyed.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.DamageBlockEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DamageBlockEvent.java:10` |

## Declaration

```java
public class DamageBlockEvent extends CancellableEcsEvent {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | The item/tool being used to damage the block (null if no item in hand) |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | The position of the block being damaged |
| `blockType` | `BlockType` | `getBlockType()` | The type of block being damaged |
| `currentDamage` | `float` | `getCurrentDamage()` | The accumulated damage on the block before this hit |
| `damage` | `float` | `getDamage()` | The amount of damage being applied in this event |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Returns the tool/item used to damage the block, or null if no item in hand |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Returns the world position of the target block |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Changes the target block position (line 38) |
| `getBlockType` | `public BlockType getBlockType()` | Returns the type of block being damaged |
| `getCurrentDamage` | `public float getCurrentDamage()` | Returns the damage already accumulated on the block |
| `getDamage` | `public float getDamage()` | Returns the damage amount being applied |
| `setDamage` | `public void setDamage(float damage)` | Modifies the damage amount to be applied (line 55) |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event has been cancelled (inherited) |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancelled state of the event (inherited) |

## Understanding ECS Events

**Important:** ECS events (Entity Component System events) work differently from regular `IEvent` events. They are part of Hytale's component-based architecture and are typically dispatched and handled through the ECS framework rather than the standard `EventBus`.

Key differences:
- ECS events extend `EcsEvent` or `CancellableEcsEvent` instead of implementing `IEvent`
- They are associated with entity components and systems
- Registration and handling may use different mechanisms than the standard event bus

## Usage Example

```java
// Note: ECS event registration may differ from standard IEvent registration
// The exact registration mechanism depends on how your plugin integrates with the ECS system

public class MiningPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // ECS events are typically handled through component systems
        // This is a conceptual example - actual implementation may vary

        // Register to handle DamageBlockEvent
        registerEcsEventHandler(DamageBlockEvent.class, this::onBlockDamage);
    }

    private void onBlockDamage(DamageBlockEvent event) {
        // Get information about the block damage
        Vector3i position = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        ItemStack tool = event.getItemInHand();
        float currentDamage = event.getCurrentDamage();
        float incomingDamage = event.getDamage();

        // Example: Make certain blocks indestructible
        if (isIndestructible(blockType)) {
            event.setCancelled(true);
            return;
        }

        // Example: Modify damage based on tool effectiveness
        float modifiedDamage = calculateToolEffectiveness(tool, blockType, incomingDamage);
        event.setDamage(modifiedDamage);

        // Example: Implement mining fatigue in certain areas
        if (isSlowMiningZone(position)) {
            event.setDamage(incomingDamage * 0.5f); // 50% slower mining
        }

        // Example: Bonus damage for specific tools on specific blocks
        if (isOptimalTool(tool, blockType)) {
            event.setDamage(incomingDamage * 2.0f); // Double speed
        }

        // Example: Track mining progress
        float totalDamage = currentDamage + event.getDamage();
        logMiningProgress(position, blockType, totalDamage);
    }

    private boolean isIndestructible(BlockType blockType) {
        // Check if block should be indestructible
        return false;
    }

    private float calculateToolEffectiveness(ItemStack tool, BlockType block, float baseDamage) {
        // Tool effectiveness calculation
        return baseDamage;
    }

    private boolean isSlowMiningZone(Vector3i position) {
        // Check for mining fatigue zones
        return false;
    }

    private boolean isOptimalTool(ItemStack tool, BlockType block) {
        // Check if tool is optimal for block type
        return false;
    }

    private void logMiningProgress(Vector3i pos, BlockType type, float damage) {
        // Progress tracking implementation
    }
}
```

## When This Event Fires

The `DamageBlockEvent` is fired when:

1. **Player mines a block** - Each tick/hit while a player is actively mining a block
2. **Entity damages a block** - When entities cause incremental damage to blocks
3. **Progressive block destruction** - Any system that applies gradual damage to blocks

The event fires **during** the mining process, potentially multiple times before the block breaks:
- First hit: `currentDamage = 0`, `damage = initial hit value`
- Subsequent hits: `currentDamage = accumulated`, `damage = new hit value`
- When `currentDamage + damage >= block hardness`, the block breaks

## Damage Flow

```
Mining Start
    |
    v
DamageBlockEvent (currentDamage: 0, damage: X)
    |
    v
[If not cancelled] -> Block accumulates damage
    |
    v
DamageBlockEvent (currentDamage: X, damage: Y)
    |
    v
[Repeat until total damage >= hardness]
    |
    v
BreakBlockEvent -> Block destroyed
```

## Cancellation Behavior

When the event is cancelled by calling `setCancelled(true)`:

- The damage is **not** applied to the block
- The block's accumulated damage remains unchanged
- Mining progress does not advance
- The player/entity still performs the mining animation (client-side)

This is useful for:
- Creating invulnerable blocks
- Implementing mining permissions
- Custom mining mechanics
- Temporary block protection

## Damage Modification

Using `setDamage(float)` allows you to:

- **Increase damage** - Speed up mining (values > original)
- **Decrease damage** - Slow down mining (values < original)
- **Set to zero** - Effectively prevent mining progress without cancelling
- **Implement tool bonuses** - Enhance certain tool/block combinations

### Example Damage Scenarios

```java
// Double mining speed
event.setDamage(event.getDamage() * 2.0f);

// Half mining speed (mining fatigue)
event.setDamage(event.getDamage() * 0.5f);

// Fixed damage regardless of tool
event.setDamage(1.0f);

// Progressive damage based on accumulated damage
float bonus = 1.0f + (event.getCurrentDamage() * 0.1f);
event.setDamage(event.getDamage() * bonus);
```

## Related Events

- [BreakBlockEvent](./break-block-event) - Fired when a block is fully broken
- [PlaceBlockEvent](./place-block-event) - Fired when a block is placed
- [UseBlockEvent](./use-block-event) - Fired when a block is interacted with

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/DamageBlockEvent.java:10`
