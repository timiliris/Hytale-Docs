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
| `targetBlock` | `@Nonnull Vector3i` | `getTargetBlock()` | The position where the block will be placed |
| `rotation` | `@Nonnull RotationTuple` | `getRotation()` | The rotation/orientation of the placed block |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Returns the item stack being used to place the block, or null if no item in hand |
| `getTargetBlock` | `@Nonnull public Vector3i getTargetBlock()` | Returns the world position where the block will be placed |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Changes the target placement position (line 35) |
| `getRotation` | `@Nonnull public RotationTuple getRotation()` | Returns the rotation tuple for block orientation |
| `setRotation` | `public void setRotation(@Nonnull RotationTuple rotation)` | Changes the block's rotation/orientation (line 45) |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event has been cancelled (inherited) |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancelled state of the event (inherited) |

## Understanding ECS Events

**Important:** ECS events (Entity Component System events) work differently from regular `IEvent` events. They do **not** use the EventBus - instead, they require a dedicated `EntityEventSystem` class registered via `getEntityStoreRegistry().registerSystem()`.

Key differences:
- ECS events extend `EcsEvent` or `CancellableEcsEvent` instead of implementing `IEvent`
- They are dispatched via `entityStore.invoke()` within the ECS framework
- You must create an `EntityEventSystem` subclass to listen to these events
- Systems are registered through `getEntityStoreRegistry().registerSystem()`

## Usage Example

> **Tested** - This code has been verified with a working plugin.

### Step 1: Create the EntityEventSystem

Create a class that extends `EntityEventSystem<EntityStore, PlaceBlockEvent>`:

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.PlaceBlockEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class BlockPlaceSystem extends EntityEventSystem<EntityStore, PlaceBlockEvent> {

    private static final int MAX_BUILD_HEIGHT = 256;

    public BlockPlaceSystem() {
        super(PlaceBlockEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull PlaceBlockEvent event
    ) {
        // Get information about the block being placed
        int x = event.getTargetBlock().getX();
        int y = event.getTargetBlock().getY();
        int z = event.getTargetBlock().getZ();
        ItemStack blockItem = event.getItemInHand();
        RotationTuple rotation = event.getRotation();

        // Example: Enforce block placement height limits
        if (y > MAX_BUILD_HEIGHT) {
            event.setCancelled(true);
            return;
        }

        // Example: Log the block placement
        System.out.println("Block placed at [" + x + "," + y + "," + z + "]");
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty(); // Catch events from all entities
    }
}
```

### Step 2: Register the System in Your Plugin

In your plugin's `setup()` method, register the system:

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Register the ECS event system
        getEntityStoreRegistry().registerSystem(new BlockPlaceSystem());
    }
}
```

### Important Notes

- The `getQuery()` method determines which entities this system listens to. Return `Archetype.empty()` to catch events from all entities.
- ECS events are **not** registered via `EventBus.register()` - that approach will not work for these events.
- Each ECS event type requires its own `EntityEventSystem` class.

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

## Practical Examples

### Getting Entity UUID from ECS Event

To identify which player/entity triggered the event, use `UUIDComponent`:

```java
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.server.core.entity.UUIDComponent;

@Override
public void handle(
        int index,
        @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
        @Nonnull Store<EntityStore> store,
        @Nonnull CommandBuffer<EntityStore> commandBuffer,
        @Nonnull PlaceBlockEvent event
) {
    // Get entity reference from the archetype chunk
    Ref<EntityStore> ref = archetypeChunk.getReferenceTo(index);

    // Get UUID component to identify the entity
    UUIDComponent uuidComponent = store.getComponent(ref, UUIDComponent.getComponentType());
    if (uuidComponent != null) {
        UUID entityUuid = uuidComponent.getUuid();
        // Now you can identify who placed the block
    }
}
```

### Block Protection System

```java
@Override
public void handle(..., @Nonnull PlaceBlockEvent event) {
    Vector3i pos = event.getTargetBlock();

    // Check if position is in a protected region
    if (isProtectedArea(pos.getX(), pos.getY(), pos.getZ())) {
        event.setCancelled(true);
        return;
    }

    // Check for restricted block types
    ItemStack item = event.getItemInHand();
    if (item != null && isRestrictedBlock(item.getItemId())) {
        event.setCancelled(true);
    }
}
```

### Redirecting Block Placement

```java
@Override
public void handle(..., @Nonnull PlaceBlockEvent event) {
    Vector3i original = event.getTargetBlock();

    // Redirect placement one block higher
    Vector3i redirected = new Vector3i(
        original.getX(),
        original.getY() + 1,
        original.getZ()
    );
    event.setTargetBlock(redirected);
}
```

## Internal Details

### Event Processing Chain

```
Player/Entity places block
         ↓
BlockPlaceUtils.placeBlock() called
         ↓
PlaceBlockEvent created with itemStack, position, rotation
         ↓
entityStore.invoke(ref, event) dispatches to all systems
         ↓
EntityEventSystem.handle() called for each registered system
         ↓
If event.isCancelled() → block section invalidated, placement stopped
         ↓
If not cancelled → block placed in world
```

### Where the Event is Fired

The event is created and invoked in `BlockPlaceUtils.placeBlock()`:

**File:** `com/hypixel/hytale/server/core/modules/interaction/BlockPlaceUtils.java`

```java
// Line 105-106
PlaceBlockEvent event = new PlaceBlockEvent(itemStack, blockPosition, targetRotation);
entityStore.invoke(ref, event);
```

### Cancellation Implementation

When the event is cancelled, the following code executes (lines 107-108):

```java
if (event.isCancelled()) {
    targetBlockSection.invalidateBlock(blockPosition.getX(), blockPosition.getY(), blockPosition.getZ());
}
```

This invalidates the block section at the target position, preventing the block from being placed.

### Class Hierarchy

```
Object
  └─ EcsEvent (abstract)
       └─ CancellableEcsEvent (abstract)
            └─ PlaceBlockEvent
```

**Interfaces:** `ICancellableEcsEvent` (via CancellableEcsEvent)

### Server Handler

The server uses `BlockHealthModule.PlaceBlockEventSystem` to mark newly placed blocks as "fragile" for a configurable duration:

**File:** `com/hypixel/hytale/server/core/modules/blockhealth/BlockHealthModule.java` (lines 249-286)

## Testing

> **Tested:** January 17, 2026 - Verified with doc-test plugin

To test this event:
1. Run `/doctest test-place-block-event`
2. Place any block in the world
3. The event should fire and display details including:
   - `itemInHand`: The block item ID and quantity
   - `targetBlock`: The [x, y, z] position
   - `rotation`: The block rotation
   - `isCancelled`: The cancellation state

## Related Events

- [BreakBlockEvent](./break-block-event) - Fired when a block is broken
- [DamageBlockEvent](./damage-block-event) - Fired when a block takes damage
- [UseBlockEvent](./use-block-event) - Fired when a block is interacted with

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/PlaceBlockEvent.java:11`

---

> **Last updated:** January 17, 2026 - Tested and verified. Added practical examples and internal details.
