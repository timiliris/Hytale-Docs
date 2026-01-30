---
id: chunk-unload-event
title: ChunkUnloadEvent
sidebar_label: ChunkUnloadEvent
---

# ChunkUnloadEvent

The `ChunkUnloadEvent` is fired when a chunk is about to be unloaded from memory. This is an ECS (Entity Component System) event that extends `CancellableEcsEvent`, allowing plugins to intercept and prevent chunk unloading. It also provides control over the chunk's keep-alive state.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.ecs.ChunkUnloadEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Implements** | `ICancellableEcsEvent` (via parent) |
| **Cancellable** | Yes |
| **Event Type** | ECS Event |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/ecs/ChunkUnloadEvent.java:7` |

## Declaration

```java
public class ChunkUnloadEvent extends CancellableEcsEvent {
   @Nonnull
   private final WorldChunk chunk;
   private boolean resetKeepAlive = true;

   public ChunkUnloadEvent(@Nonnull WorldChunk chunk) {
      this.chunk = chunk;
   }

   @Nonnull
   public WorldChunk getChunk() {
      return this.chunk;
   }

   public void setResetKeepAlive(boolean willResetKeepAlive) {
      this.resetKeepAlive = willResetKeepAlive;
   }

   public boolean willResetKeepAlive() {
      return this.resetKeepAlive;
   }
}
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `chunk` | `WorldChunk` | `getChunk()` | The chunk being unloaded |
| `resetKeepAlive` | `boolean` | `willResetKeepAlive()` | Whether to reset the chunk's keep-alive timer |

## Inherited Fields

From `CancellableEcsEvent`:

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `cancelled` | `boolean` | `isCancelled()` | Whether the event has been cancelled |

## Methods

### getChunk()

```java
@Nonnull
public WorldChunk getChunk()
```

Returns the chunk that is being unloaded.

**Returns:** `WorldChunk` - The chunk instance being unloaded from memory

### willResetKeepAlive()

```java
public boolean willResetKeepAlive()
```

Returns whether the chunk's keep-alive timer will be reset after the unload attempt.

**Returns:** `boolean` - `true` if the keep-alive timer will be reset, `false` otherwise

### setResetKeepAlive(boolean)

```java
public void setResetKeepAlive(boolean willResetKeepAlive)
```

Sets whether to reset the chunk's keep-alive timer. When set to `true`, the chunk will remain loaded for longer before another unload attempt.

**Parameters:**
- `willResetKeepAlive` - `true` to reset the keep-alive timer, `false` to leave it unchanged

### isCancelled()

```java
public boolean isCancelled()
```

Inherited from `CancellableEcsEvent`. Returns whether the unload operation has been cancelled.

**Returns:** `boolean` - `true` if the chunk unload has been cancelled, `false` otherwise

### setCancelled(boolean)

```java
public void setCancelled(boolean cancelled)
```

Inherited from `CancellableEcsEvent`. Sets whether the unload operation should be cancelled.

**Parameters:**
- `cancelled` - `true` to cancel the chunk unload, `false` to allow it

## ECS Event System

This event is part of Hytale's Entity Component System (ECS) event architecture:

```java
public abstract class CancellableEcsEvent extends EcsEvent implements ICancellableEcsEvent {
   private boolean cancelled = false;

   public boolean isCancelled() {
      return this.cancelled;
   }

   public void setCancelled(boolean cancelled) {
      this.cancelled = cancelled;
   }
}
```

## Usage Example

```java
import com.hypixel.hytale.server.core.universe.world.events.ecs.ChunkUnloadEvent;

// Register an ECS event listener for chunk unloads
ecsEventManager.register(ChunkUnloadEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Log chunk unloads
    System.out.println("Attempting to unload chunk at: " +
                       chunk.getX() + ", " + chunk.getZ());

    // Example: Prevent unloading chunks with active entities
    if (hasActiveEntities(chunk)) {
        event.setCancelled(true);
        event.setResetKeepAlive(true); // Keep chunk loaded longer
        System.out.println("Blocked unload - chunk has active entities");
        return;
    }

    // Example: Prevent unloading spawn chunks
    if (isSpawnChunk(chunk)) {
        event.setCancelled(true);
        System.out.println("Blocked unload of spawn chunk");
        return;
    }

    // Example: Extend keep-alive for important chunks
    if (isImportantChunk(chunk)) {
        event.setResetKeepAlive(true);
    }
});

private boolean hasActiveEntities(WorldChunk chunk) {
    // Check if chunk contains entities that should prevent unloading
    return chunk.getEntityCount() > 0;
}

private boolean isSpawnChunk(WorldChunk chunk) {
    // Check if this is a spawn chunk that should always be loaded
    int x = chunk.getX();
    int z = chunk.getZ();
    return Math.abs(x) <= 2 && Math.abs(z) <= 2;
}

private boolean isImportantChunk(WorldChunk chunk) {
    // Determine if chunk is important and should stay loaded longer
    return chunk.hasStructures() || chunk.hasPlayers();
}
```

## When This Event Fires

The `ChunkUnloadEvent` is dispatched when:

1. A chunk's keep-alive timer expires and no players are in range
2. Memory pressure triggers chunk unloading
3. A world is being shut down and chunks are being unloaded
4. Manual chunk unload operations are triggered
5. Players move away from a chunk beyond the view distance

The event fires **before** the chunk is unloaded, allowing cancellation or modification of the unload behavior.

## Cancellation Behavior

When the event is cancelled:
- The chunk will remain loaded in memory
- Entities in the chunk continue to tick and process
- The chunk remains accessible to players and systems
- Depending on `resetKeepAlive`, the chunk may be scheduled for unload again soon

## Keep-Alive Mechanism

The `resetKeepAlive` field controls the chunk's keep-alive timer:

- **When `true`:** The chunk's keep-alive timer is reset, delaying future unload attempts
- **When `false`:** The timer continues normally, and another unload attempt may occur soon

This is useful for:
- Temporarily preventing unloads without permanently keeping chunks loaded
- Giving chunks with active processing more time before being unloaded
- Managing memory by controlling how aggressively chunks are unloaded

## Related Events

- [ChunkPreLoadProcessEvent](./chunk-pre-load-process-event) - Fired when a chunk is being loaded
- [ChunkSaveEvent](./chunk-save-event) - Fired when a chunk is being saved
- [MoonPhaseChangeEvent](./moon-phase-change-event) - Fired when the moon phase changes

## Common Use Cases

### Entity Protection

```java
ecsEventManager.register(ChunkUnloadEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Prevent unloading chunks with boss fights
    if (hasBossFight(chunk)) {
        event.setCancelled(true);
        event.setResetKeepAlive(true);
        return;
    }

    // Prevent unloading chunks with active events
    if (hasActiveEvent(chunk)) {
        event.setCancelled(true);
        return;
    }
});
```

### Smart Chunk Management

```java
ecsEventManager.register(ChunkUnloadEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Always keep certain chunks loaded
    if (isPermanentChunk(chunk)) {
        event.setCancelled(true);
        return;
    }

    // Extend lifetime of chunks with pending operations
    if (hasPendingOperations(chunk)) {
        event.setResetKeepAlive(true);
    }
});
```

### Unload Logging and Metrics

```java
ecsEventManager.register(ChunkUnloadEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Track unload statistics
    metrics.recordChunkUnload(chunk.getX(), chunk.getZ());

    // Log chunk state before unload
    logger.debug("Unloading chunk [{}, {}] - {} entities, {} blocks modified",
                 chunk.getX(), chunk.getZ(),
                 chunk.getEntityCount(),
                 chunk.getModifiedBlockCount());
});
```

### Graceful Unload with Cleanup

```java
ecsEventManager.register(ChunkUnloadEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Perform cleanup before unload
    cleanupChunkData(chunk);

    // Save any pending changes
    if (chunk.isDirty()) {
        saveChunkData(chunk);
    }

    // Notify systems of impending unload
    notifyChunkUnloading(chunk);
});
```

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/ecs/ChunkUnloadEvent.java`
- **Parent Class:** `decompiled/com/hypixel/hytale/component/system/CancellableEcsEvent.java`
- **EcsEvent Base:** `decompiled/com/hypixel/hytale/component/system/EcsEvent.java`
- **Cancellable Interface:** `decompiled/com/hypixel/hytale/component/system/ICancellableEcsEvent.java`
