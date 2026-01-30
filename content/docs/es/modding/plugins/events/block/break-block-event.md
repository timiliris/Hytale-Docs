---
id: break-block-event
title: BreakBlockEvent
sidebar_label: BreakBlockEvent
---

# BreakBlockEvent

> **Last updated:** January 17, 2026 - Added practical examples and internal implementation details.

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
| `targetBlock` | `@Nonnull Vector3i` | `getTargetBlock()` | The position of the block being broken |
| `blockType` | `@Nonnull BlockType` | `getBlockType()` | The type of block being broken |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Returns the item held by the entity breaking the block, or null if no item in hand |
| `getTargetBlock` | `@Nonnull public Vector3i getTargetBlock()` | Returns the world position of the target block |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Changes the target block position (line 39) |
| `getBlockType` | `@Nonnull public BlockType getBlockType()` | Returns the type of block being broken |
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

Create a class that extends `EntityEventSystem<EntityStore, BreakBlockEvent>`:

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.BreakBlockEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class BlockBreakSystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {

    public BlockBreakSystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull BreakBlockEvent event
    ) {
        // Get information about the block being broken
        int x = event.getTargetBlock().getX();
        int y = event.getTargetBlock().getY();
        int z = event.getTargetBlock().getZ();
        BlockType blockType = event.getBlockType();
        ItemStack toolUsed = event.getItemInHand();

        // Example: Prevent breaking protected blocks
        if (isProtectedBlock(blockType)) {
            event.setCancelled(true);
            return;
        }

        // Example: Log the block break
        System.out.println("Block broken at [" + x + "," + y + "," + z + "] type=" + blockType);
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty(); // Catch events from all entities
    }

    private boolean isProtectedBlock(BlockType blockType) {
        // Custom protection logic
        return false;
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
        getEntityStoreRegistry().registerSystem(new BlockBreakSystem());
    }
}
```

### Important Notes

- The `getQuery()` method determines which entities this system listens to. Return `Archetype.empty()` to catch events from all entities.
- ECS events are **not** registered via `EventBus.register()` - that approach will not work for these events.
- Each ECS event type requires its own `EntityEventSystem` class.

## Practical Examples

### Getting Block Location

To find where the block was broken:

```java
@Override
public void handle(..., @Nonnull BreakBlockEvent event) {
    Vector3i pos = event.getTargetBlock();

    int x = pos.getX();
    int y = pos.getY();
    int z = pos.getZ();

    System.out.println("Block broken at X=" + x + " Y=" + y + " Z=" + z);
}
```

### Getting Block Type Information

To know which block was broken:

```java
@Override
public void handle(..., @Nonnull BreakBlockEvent event) {
    BlockType blockType = event.getBlockType();

    // Get the block identifier (e.g., "hytale:stone", "hytale:oak_log")
    String blockId = blockType.toString();

    // Or get the asset key
    AssetKey<BlockType> assetKey = blockType.getAssetKey();

    System.out.println("Broken block: " + blockId);
}
```

### Checking the Tool Used

To see what item the player used to break the block:

```java
@Override
public void handle(..., @Nonnull BreakBlockEvent event) {
    ItemStack tool = event.getItemInHand();

    if (tool == null) {
        System.out.println("Block broken with bare hands");
    } else {
        // Get tool type
        ItemType itemType = tool.getType();
        System.out.println("Tool used: " + itemType.toString());

        // Check durability if applicable
        // tool.getDurability(), tool.getMaxDurability(), etc.
    }
}
```

### Complete Example: Block Break Logger

A full example that logs all block breaks with details:

```java
public class BlockBreakLoggerSystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {

    private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();

    public BlockBreakLoggerSystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull BreakBlockEvent event
    ) {
        // Get block position
        Vector3i pos = event.getTargetBlock();

        // Get block type
        BlockType blockType = event.getBlockType();

        // Get tool (may be null)
        ItemStack tool = event.getItemInHand();
        String toolName = (tool != null) ? tool.getType().toString() : "hand";

        // Log the break
        LOGGER.at(Level.INFO).log(
            "Block broken: %s at [%d, %d, %d] with %s",
            blockType,
            pos.getX(), pos.getY(), pos.getZ(),
            toolName
        );
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Example: Protect Specific Block Types

Prevent certain blocks from being broken:

```java
public class BlockProtectionSystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {

    // Set of protected block IDs
    private static final Set<String> PROTECTED_BLOCKS = Set.of(
        "hytale:bedrock",
        "hytale:spawner",
        "hytale:barrier"
    );

    public BlockProtectionSystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(..., @Nonnull BreakBlockEvent event) {
        String blockId = event.getBlockType().toString();

        if (PROTECTED_BLOCKS.contains(blockId)) {
            // Cancel the event - block won't be broken
            event.setCancelled(true);
        }
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Example: Redirect Block Break

Change which block gets broken (e.g., break block above instead):

```java
@Override
public void handle(..., @Nonnull BreakBlockEvent event) {
    Vector3i originalPos = event.getTargetBlock();

    // Redirect to block above
    Vector3i newPos = new Vector3i(
        originalPos.getX(),
        originalPos.getY() + 1,  // One block higher
        originalPos.getZ()
    );

    event.setTargetBlock(newPos);
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

## Internal Details

> This section provides implementation details from the decompiled source code for advanced developers.

### Event Processing Chain

When a block is broken, the following sequence occurs:

```
BlockHarvestUtils.performBlockBreak()
    │
    ├─► BreakBlockEvent created and invoked via entityStore.invoke()
    │
    ├─► If cancelled: block section invalidated, return early
    │
    ├─► BlackboardSystems.BreakBlockEventSystem handles the event
    │
    ├─► Blackboard.onEntityBreakBlock() processes game logic
    │
    └─► BlockEventView.onEntityBreakBlock() notifies NPCs
```

### Where the Event is Fired

The event is created in `BlockHarvestUtils.performBlockBreak()`:

```java
// BlockHarvestUtils.java, line 572
BreakBlockEvent event = new BreakBlockEvent(heldItemStack, blockPosition, targetBlockTypeKey);
entityStore.invoke(ref, event);
```

### Cancellation Implementation

When cancelled, the internal handling looks like this:

```java
// BlockHarvestUtils.java, lines 574-581
if (event.isCancelled()) {
    BlockChunk blockChunkComponent = chunkStore.getComponent(chunkReference, BlockChunk.getComponentType());
    BlockSection blockSection = blockChunkComponent.getSectionAtBlockY(blockPosition.getY());
    blockSection.invalidateBlock(blockPosition.getX(), blockPosition.getY(), blockPosition.getZ());
    return; // Block break is aborted
}
```

### Class Hierarchy

```
EcsEvent (base class for all ECS events)
    └─► CancellableEcsEvent (adds isCancelled/setCancelled)
            └─► BreakBlockEvent
```

### Important Notes

- **BlockType is immutable**: The `blockType` field is `final` and cannot be changed after event creation. Only `targetBlock` can be modified via `setTargetBlock()`.
- **Event timing**: The event fires AFTER block damage reaches 100% but BEFORE the block is removed and drops are generated.
- **NPC awareness**: The event is used by the NPC blackboard system to make NPCs aware of block breaking in their vicinity.

## Related Events

- [PlaceBlockEvent](./place-block-event) - Fired when a block is placed
- [DamageBlockEvent](./damage-block-event) - Fired when a block takes damage (before breaking)
- [UseBlockEvent](./use-block-event) - Fired when a block is interacted with

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/BreakBlockEvent.java:10`
