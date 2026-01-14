---
id: place-block-event
title: PlaceBlockEvent
sidebar_label: PlaceBlockEvent
---

# PlaceBlockEvent

Fired when a block is about to be placed in the world. This event allows plugins to intercept and cancel block placement, modify the target position or rotation, or perform custom logic when blocks are placed.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.PlaceBlockEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/PlaceBlockEvent.java:11` |

## Declaration

```java
public class PlaceBlockEvent extends CancellableEcsEvent {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | The item (block) being placed from the entity's hand (null if no item in hand) |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | The position where the block will be placed |
| `rotation` | `RotationTuple` | `getRotation()` | The rotation/orientation of the placed block |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Returns the item stack being used to place the block, or null if no item in hand |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Returns the world position where the block will be placed |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Changes the target placement position (line 35) |
| `getRotation` | `public RotationTuple getRotation()` | Returns the rotation tuple for block orientation |
| `setRotation` | `public void setRotation(@Nonnull RotationTuple rotation)` | Changes the block's rotation/orientation (line 45) |
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

public class BuildingPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // ECS events are typically handled through component systems
        // This is a conceptual example - actual implementation may vary

        // Register to handle PlaceBlockEvent
        registerEcsEventHandler(PlaceBlockEvent.class, this::onBlockPlace);
    }

    private void onBlockPlace(PlaceBlockEvent event) {
        // Get information about the block being placed
        Vector3i position = event.getTargetBlock();
        ItemStack blockItem = event.getItemInHand();
        RotationTuple rotation = event.getRotation();

        // Example: Prevent placing blocks in protected areas
        if (isProtectedArea(position)) {
            event.setCancelled(true);
            return;
        }

        // Example: Enforce block placement height limits
        if (position.y > MAX_BUILD_HEIGHT) {
            event.setCancelled(true);
            return;
        }

        // Example: Modify placement position (snap to grid)
        Vector3i snappedPosition = snapToGrid(position);
        event.setTargetBlock(snappedPosition);

        // Example: Force specific rotation for certain blocks
        // event.setRotation(new RotationTuple(0, 0, 0));

        // Log the placement for tracking
        logBlockPlacement(position, blockItem);
    }

    private boolean isProtectedArea(Vector3i position) {
        // Check if position is in a protected region
        return false;
    }

    private Vector3i snapToGrid(Vector3i position) {
        // Grid snapping logic
        return position;
    }

    private void logBlockPlacement(Vector3i pos, ItemStack item) {
        // Logging implementation
    }

    private static final int MAX_BUILD_HEIGHT = 256;
}
```

## When This Event Fires

The `PlaceBlockEvent` is fired when:

1. **Player places a block** - When a player right-clicks to place a block from their inventory
2. **Entity places a block** - When an entity (such as an enderman-like mob) places a block
3. **Programmatic placement** - When game systems place blocks through normal placement mechanics

The event fires **before** the block is actually added to the world, allowing handlers to:
- Cancel the placement entirely
- Modify the target position
- Change the block's rotation/orientation
- Track block placements for logging or gameplay purposes

## Cancellation Behavior

When the event is cancelled by calling `setCancelled(true)`:

- The block will **not** be placed in the world
- The item remains in the player's/entity's hand (not consumed)
- No block state changes occur at the target position
- The player/entity receives feedback that the action was blocked

This is useful for:
- Build permission systems (claims, plot protection)
- Height limit enforcement
- Restricting specific block types in areas
- Anti-griefing and world protection
- Custom game modes with building restrictions

## Block Rotation

The `RotationTuple` controls how the block is oriented when placed. This is particularly important for:

- Directional blocks (stairs, logs, pillars)
- Blocks with facing directions (furnaces, chests)
- Decorative blocks with multiple orientations

You can use `setRotation()` to:
- Force blocks to face a specific direction
- Implement auto-rotation features
- Create building assistance tools

## Related Events

- [BreakBlockEvent](./break-block-event) - Fired when a block is broken
- [DamageBlockEvent](./damage-block-event) - Fired when a block takes damage
- [UseBlockEvent](./use-block-event) - Fired when a block is interacted with

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/PlaceBlockEvent.java:11`
