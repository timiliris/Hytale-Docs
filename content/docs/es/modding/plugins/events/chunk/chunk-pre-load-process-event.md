---
id: chunk-pre-load-process-event
title: ChunkPreLoadProcessEvent
sidebar_label: ChunkPreLoadProcessEvent
---

# ChunkPreLoadProcessEvent

The `ChunkPreLoadProcessEvent` is fired during the chunk loading process, specifically before the chunk is fully loaded and ready for use. This event implements `IProcessedEvent`, allowing tracking of which handlers have processed the event. It provides information about whether the chunk is newly generated or loaded from storage.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.ChunkPreLoadProcessEvent` |
| **Parent Class** | `ChunkEvent` |
| **Implements** | `IProcessedEvent` |
| **Cancellable** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/ChunkPreLoadProcessEvent.java:12` |

## Declaration

```java
public class ChunkPreLoadProcessEvent extends ChunkEvent implements IProcessedEvent {
   private final boolean newlyGenerated;
   private long lastDispatchNanos;
   private boolean didLog;
   @Nonnull
   private final Holder<ChunkStore> holder;

   public ChunkPreLoadProcessEvent(@Nonnull Holder<ChunkStore> holder, @Nonnull WorldChunk chunk,
                                    boolean newlyGenerated, long lastDispatchNanos) {
      super(chunk);
      this.newlyGenerated = newlyGenerated;
      this.lastDispatchNanos = lastDispatchNanos;
      this.holder = holder;
   }

   public boolean isNewlyGenerated() {
      return this.newlyGenerated;
   }

   public boolean didLog() {
      return this.didLog;
   }

   @Nonnull
   public Holder<ChunkStore> getHolder() {
      return this.holder;
   }

   @Override
   public void processEvent(@Nonnull String hookName) {
      // Performance tracking - logs if handler takes longer than tick step
   }

   @Nonnull
   @Override
   public String toString() {
      return "ChunkPreLoadProcessEvent{newlyGenerated=" + this.newlyGenerated
         + ", lastDispatchNanos=" + this.lastDispatchNanos
         + ", didLog=" + this.didLog + "} " + super.toString();
   }
}
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `newlyGenerated` | `boolean` | `isNewlyGenerated()` | Whether the chunk was newly generated (vs loaded from storage) |
| `lastDispatchNanos` | `long` | N/A | Internal timing field for performance tracking |
| `didLog` | `boolean` | `didLog()` | Whether logging has occurred for this event |
| `holder` | `Holder<ChunkStore>` | `getHolder()` | The ECS holder for the chunk's component store |

## Inherited Fields

From `ChunkEvent`:

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `chunk` | `WorldChunk` | `getChunk()` | The chunk being loaded |

## Methods

### isNewlyGenerated()

```java
public boolean isNewlyGenerated()
```

Returns whether the chunk is newly generated or loaded from existing data.

**Returns:** `boolean` - `true` if the chunk was just generated, `false` if loaded from storage

### didLog()

```java
public boolean didLog()
```

Returns whether logging has been performed for this event.

**Returns:** `boolean` - `true` if the event has been logged, `false` otherwise

### getHolder()

```java
@Nonnull
public Holder<ChunkStore> getHolder()
```

Returns the ECS holder containing the chunk's component store.

**Returns:** `Holder<ChunkStore>` - The holder for accessing chunk components

### getChunk()

```java
public WorldChunk getChunk()
```

Inherited from `ChunkEvent`. Returns the chunk that is being loaded.

**Returns:** `WorldChunk` - The chunk instance being processed

### processEvent(String)

```java
@Override
public void processEvent(@Nonnull String handlerName)
```

Implementation of `IProcessedEvent`. Called after each event handler processes the event. This allows tracking of handler processing for debugging and performance monitoring.

**Parameters:**
- `handlerName` - The name of the handler that just processed the event

## IProcessedEvent Interface

This event implements `IProcessedEvent`, which provides post-processing tracking:

```java
public interface IProcessedEvent {
   void processEvent(@Nonnull String var1);
}
```

The `processEvent` method is called automatically by the event system after each handler finishes processing. This enables:
- Performance tracking per handler
- Debugging which handlers are processing chunks
- Logging slow handlers during chunk loading

## Usage Example

```java
import com.hypixel.hytale.server.core.universe.world.events.ChunkPreLoadProcessEvent;
import com.hypixel.hytale.event.EventPriority;

// Register a listener to process chunks before they're fully loaded
eventBus.register(EventPriority.NORMAL, ChunkPreLoadProcessEvent.class, event -> {
    WorldChunk chunk = event.getChunk();
    boolean isNew = event.isNewlyGenerated();
    Holder<ChunkStore> holder = event.getHolder();

    // Log chunk loading
    if (isNew) {
        System.out.println("Processing newly generated chunk at: " +
                           chunk.getX() + ", " + chunk.getZ());
    } else {
        System.out.println("Processing loaded chunk at: " +
                           chunk.getX() + ", " + chunk.getZ());
    }

    // Example: Perform different processing for new vs existing chunks
    if (isNew) {
        // Process newly generated chunks
        processNewChunk(chunk, holder);
    } else {
        // Process chunks loaded from storage
        processExistingChunk(chunk, holder);
    }
});

private void processNewChunk(WorldChunk chunk, Holder<ChunkStore> holder) {
    // Add custom structures to newly generated chunks
    // Initialize custom chunk data
    // Spawn initial entities
}

private void processExistingChunk(WorldChunk chunk, Holder<ChunkStore> holder) {
    // Validate chunk data integrity
    // Migrate old chunk formats if necessary
    // Restore chunk state
}
```

## When This Event Fires

The `ChunkPreLoadProcessEvent` is dispatched when:

1. A chunk is being loaded from storage (existing chunk)
2. A chunk has just been generated by the world generator (new chunk)
3. The chunk is in the pre-load phase before becoming fully active
4. When a player moves into range of an unloaded chunk area

The event fires **during** the chunk loading process, allowing modifications to chunk data before the chunk becomes fully active.

## Performance Considerations

Since `ChunkPreLoadProcessEvent` implements `IProcessedEvent`:

- Each handler's processing time can be tracked
- Long-running handlers may be identified and logged
- The `lastDispatchNanos` field tracks timing between dispatches
- Consider handler performance as chunks load frequently during gameplay

## Related Events

- [ChunkSaveEvent](./chunk-save-event) - Fired when a chunk is being saved
- [ChunkUnloadEvent](./chunk-unload-event) - Fired when a chunk is being unloaded
- [MoonPhaseChangeEvent](./moon-phase-change-event) - Fired when the moon phase changes

## Common Use Cases

### Custom Chunk Generation

```java
eventBus.register(ChunkPreLoadProcessEvent.class, event -> {
    if (event.isNewlyGenerated()) {
        WorldChunk chunk = event.getChunk();

        // Add custom ore generation
        if (shouldGenerateCustomOres(chunk)) {
            generateCustomOres(chunk);
        }

        // Add custom structures
        if (shouldPlaceStructure(chunk)) {
            placeCustomStructure(chunk);
        }
    }
});
```

### Chunk Data Migration

```java
eventBus.register(ChunkPreLoadProcessEvent.class, event -> {
    if (!event.isNewlyGenerated()) {
        WorldChunk chunk = event.getChunk();
        Holder<ChunkStore> holder = event.getHolder();

        // Check if chunk needs migration
        int chunkVersion = getChunkVersion(holder);
        if (chunkVersion < CURRENT_VERSION) {
            migrateChunkData(chunk, holder, chunkVersion);
        }
    }
});
```

### Chunk Loading Statistics

```java
eventBus.register(EventPriority.LAST, ChunkPreLoadProcessEvent.class, event -> {
    // Track chunk loading statistics
    if (event.isNewlyGenerated()) {
        metrics.incrementGeneratedChunks();
    } else {
        metrics.incrementLoadedChunks();
    }
});
```

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/ChunkPreLoadProcessEvent.java`
- **Parent Class:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/ChunkEvent.java`
- **IProcessedEvent Interface:** `decompiled/com/hypixel/hytale/event/IProcessedEvent.java`
