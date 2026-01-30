---
id: chunk-save-event
title: ChunkSaveEvent
sidebar_label: ChunkSaveEvent
---

# ChunkSaveEvent

:::danger Not Listenable by Plugins
**This event cannot currently be listened to by plugins.** While the event class exists and is dispatched internally, it uses `store.invoke()` instead of `commandBuffer.invoke()`, which prevents registered ECS systems from receiving the event. This is a server-side limitation discovered through testing in January 2026.

**Comparison with ChunkUnloadEvent:**
- `ChunkUnloadEvent` uses `commandBuffer.invoke()` → Works with plugin listeners
- `ChunkSaveEvent` uses `store.invoke()` → Does NOT work with plugin listeners

The code examples below show how the API *would* work if this limitation is fixed in a future update.
:::

The `ChunkSaveEvent` is fired when a chunk is about to be saved to persistent storage. This is an ECS (Entity Component System) event that extends `CancellableEcsEvent`, allowing plugins to intercept and prevent chunk saves when necessary.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.ecs.ChunkSaveEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Implements** | `ICancellableEcsEvent` (via parent) |
| **Cancellable** | Yes |
| **Event Type** | ECS Event (ChunkStore) |
| **Plugin Status** | Not Listenable |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/ecs/ChunkSaveEvent.java:7` |
| **Tested** | January 2026 - Event does not reach plugin listeners |

## Declaration

```java
public class ChunkSaveEvent extends CancellableEcsEvent {
   @Nonnull
   private final WorldChunk chunk;

   public ChunkSaveEvent(@Nonnull WorldChunk chunk) {
      this.chunk = chunk;
   }

   @Nonnull
   public WorldChunk getChunk() {
      return this.chunk;
   }
}
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `chunk` | `WorldChunk` | `getChunk()` | The chunk being saved |

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

Returns the chunk that is being saved.

**Returns:** `WorldChunk` - The chunk instance being saved to storage

### isCancelled()

```java
public boolean isCancelled()
```

Inherited from `CancellableEcsEvent`. Returns whether the save operation has been cancelled.

**Returns:** `boolean` - `true` if the chunk save has been cancelled, `false` otherwise

### setCancelled(boolean)

```java
public void setCancelled(boolean cancelled)
```

Inherited from `CancellableEcsEvent`. Sets whether the save operation should be cancelled.

**Parameters:**
- `cancelled` - `true` to cancel the chunk save, `false` to allow it

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

ECS events are dispatched through the component system rather than the standard event bus, typically in response to component-level operations.

## Usage Example

```java
import com.hypixel.hytale.server.core.universe.world.events.ecs.ChunkSaveEvent;

// Register an ECS event listener for chunk saves
ecsEventManager.register(ChunkSaveEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Log chunk saves
    System.out.println("Saving chunk at: " + chunk.getX() + ", " + chunk.getZ());

    // Example: Prevent saving chunks in a specific region
    if (isReadOnlyRegion(chunk)) {
        event.setCancelled(true);
        System.out.println("Blocked save for read-only chunk");
        return;
    }

    // Example: Perform pre-save validation
    if (!validateChunkData(chunk)) {
        event.setCancelled(true);
        System.out.println("Blocked save due to invalid chunk data");
        return;
    }

    // Example: Add custom data before save
    addCustomSaveData(chunk);
});

private boolean isReadOnlyRegion(WorldChunk chunk) {
    // Check if chunk is in a protected/read-only region
    int x = chunk.getX();
    int z = chunk.getZ();
    return x >= -10 && x <= 10 && z >= -10 && z <= 10;
}

private boolean validateChunkData(WorldChunk chunk) {
    // Validate chunk integrity before allowing save
    return chunk.isValid();
}

private void addCustomSaveData(WorldChunk chunk) {
    // Add any custom data that should be persisted with the chunk
}
```

## When This Event Fires

The `ChunkSaveEvent` is dispatched when:

1. A chunk is being saved as part of regular auto-save operations
2. The server is shutting down and saving all loaded chunks
3. A chunk is being unloaded and needs to save its state
4. A manual save operation is triggered for specific chunks
5. World save commands are executed

The event fires **before** the chunk data is written to storage, allowing modifications or cancellation.

## Cancellation Behavior

When the event is cancelled:
- The chunk will not be saved to persistent storage
- Changes to the chunk since the last save will remain in memory only
- On server restart, the chunk will revert to its last saved state
- Use with caution as unsaved changes will be lost

**Warning:** Cancelling chunk saves can lead to data loss. Only cancel saves when you have a specific reason and understand the consequences.

## Related Events

- [ChunkPreLoadProcessEvent](./chunk-pre-load-process-event) - Fired when a chunk is being loaded
- [ChunkUnloadEvent](./chunk-unload-event) - Fired when a chunk is being unloaded
- [MoonPhaseChangeEvent](./moon-phase-change-event) - Fired when the moon phase changes

## Common Use Cases

### Save Optimization

```java
ecsEventManager.register(ChunkSaveEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Skip saving chunks that haven't been modified
    if (!chunk.isDirty()) {
        event.setCancelled(true);
        return;
    }
});
```

### Backup Before Save

```java
ecsEventManager.register(ChunkSaveEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Create backup of important chunks before overwriting
    if (isImportantChunk(chunk)) {
        createChunkBackup(chunk);
    }
});
```

### Save Logging and Metrics

```java
ecsEventManager.register(ChunkSaveEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Track save statistics
    metrics.recordChunkSave(chunk.getX(), chunk.getZ());

    // Log saves for debugging
    logger.debug("Saving chunk [{}, {}] with {} entities",
                 chunk.getX(), chunk.getZ(), chunk.getEntityCount());
});
```

### Conditional Save Prevention

```java
ecsEventManager.register(ChunkSaveEvent.class, event -> {
    WorldChunk chunk = event.getChunk();

    // Prevent saving temporary/instance chunks
    if (chunk.getWorld().isTemporary()) {
        event.setCancelled(true);
        return;
    }

    // Prevent saving during maintenance mode
    if (serverInMaintenanceMode) {
        event.setCancelled(true);
        return;
    }
});
```

## Internal Dispatch Details

:::info Technical Details
This section explains why the event is not listenable by plugins.
:::

### How ChunkSaveEvent is Dispatched

The event is dispatched in `ChunkSavingSystems.java` using `store.invoke()`:

```java
// ChunkSavingSystems.java:81 (tryQueue method)
ChunkSaveEvent event = new ChunkSaveEvent(worldChunkComponent);
store.invoke(chunkRef, event);  // Uses Store.invoke() directly
if (!event.isCancelled()) {
    store.getResource(ChunkStore.SAVE_RESOURCE).push(chunkRef);
}
```

### Why It Doesn't Work

When comparing with `ChunkUnloadEvent` (which DOES work):

```java
// ChunkUnloadingSystem.java:87 (tryUnload method)
ChunkUnloadEvent event = new ChunkUnloadEvent(worldChunkComponent);
commandBuffer.invoke(chunkRef, event);  // Uses CommandBuffer.invoke()
```

The key difference:
- `commandBuffer.invoke()` routes through `store.internal_invoke()` which properly dispatches to registered ECS systems
- `store.invoke()` creates an isolated execution stack that doesn't trigger plugin-registered listeners

### Dispatch Locations

The event is created and dispatched in two places:

1. **ChunkSavingSystems.tryQueue()** (line 81) - During normal chunk save operations
2. **ChunkSavingSystems.tryQueueSync()** (line 100) - During synchronous save operations (e.g., server shutdown)

Both use `store.invoke()` instead of `commandBuffer.invoke()`.

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/ecs/ChunkSaveEvent.java`
- **Parent Class:** `decompiled/com/hypixel/hytale/component/system/CancellableEcsEvent.java`
- **EcsEvent Base:** `decompiled/com/hypixel/hytale/component/system/EcsEvent.java`
- **Cancellable Interface:** `decompiled/com/hypixel/hytale/component/system/ICancellableEcsEvent.java`
- **Dispatch Location:** `decompiled/com/hypixel/hytale/server/core/universe/world/storage/component/ChunkSavingSystems.java`
