---
id: break-block-event
title: BreakBlockEvent
sidebar_label: BreakBlockEvent
---

# BreakBlockEvent

Fired when a block is about to be broken (destroyed) in the world. This event allows plugins to intercept and cancel block breaking, modify the target block, or perform custom logic when blocks are destroyed.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.BreakBlockEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/BreakBlockEvent.java:10` |

## Declaration

```java
public class BreakBlockEvent extends CancellableEcsEvent {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | The item the entity is holding when breaking the block (null if no item in hand) |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | The position of the block being broken |
| `blockType` | `BlockType` | `getBlockType()` | The type of block being broken |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Returns the item held by the entity breaking the block, or null if no item in hand |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Returns the world position of the target block |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Changes the target block position (line 39) |
| `getBlockType` | `public BlockType getBlockType()` | Returns the type of block being broken |
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

public class BlockProtectionPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // ECS events are typically handled through component systems
        // This is a conceptual example - actual implementation may vary

        // Register to handle BreakBlockEvent
        registerEcsEventHandler(BreakBlockEvent.class, this::onBlockBreak);
    }

    private void onBlockBreak(BreakBlockEvent event) {
        // Get information about the block being broken
        Vector3i position = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        ItemStack toolUsed = event.getItemInHand();

        // Example: Prevent breaking bedrock-like blocks
        if (isProtectedBlock(blockType)) {
            event.setCancelled(true);
            return;
        }

        // Example: Log block breaks
        logBlockBreak(position, blockType, toolUsed);

        // Example: Modify the target (redirect the break to a different block)
        // event.setTargetBlock(new Vector3i(position.x, position.y + 1, position.z));
    }

    private boolean isProtectedBlock(BlockType blockType) {
        // Custom protection logic
        return false;
    }

    private void logBlockBreak(Vector3i pos, BlockType type, ItemStack tool) {
        // Logging implementation
    }
}
```

## When This Event Fires

The `BreakBlockEvent` is fired when:

1. **Player breaks a block** - When a player successfully mines/breaks a block after the damage threshold is reached
2. **Entity destroys a block** - When an entity (mob, projectile, etc.) causes a block to be destroyed
3. **Programmatic block removal** - When game systems remove blocks through normal breaking mechanics

The event fires **before** the block is actually removed from the world, allowing handlers to:
- Cancel the break entirely
- Modify which block gets broken
- Track block destruction for logging or gameplay purposes

## Cancellation Behavior

When the event is cancelled by calling `setCancelled(true)`:

- The block will **not** be removed from the world
- The block remains in its current state
- Any item drops that would have occurred are prevented
- Tool durability loss may still occur (implementation dependent)
- The player/entity receives feedback that the action was blocked

This is useful for:
- Block protection systems (claims, spawn protection)
- Permission-based building restrictions
- Custom game modes where certain blocks cannot be broken
- Anti-griefing measures

## Related Events

- [PlaceBlockEvent](./place-block-event) - Fired when a block is placed
- [DamageBlockEvent](./damage-block-event) - Fired when a block takes damage (before breaking)
- [UseBlockEvent](./use-block-event) - Fired when a block is interacted with

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/BreakBlockEvent.java:10`
