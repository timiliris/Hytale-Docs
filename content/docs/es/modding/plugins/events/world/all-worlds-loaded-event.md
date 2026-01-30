---
id: all-worlds-loaded-event
title: AllWorldsLoadedEvent
sidebar_label: AllWorldsLoadedEvent
---

# AllWorldsLoadedEvent

The `AllWorldsLoadedEvent` is fired once all configured worlds have been loaded during server startup. This event signals that the server's world initialization phase is complete and all worlds are ready for use.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.AllWorldsLoadedEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/AllWorldsLoadedEvent.java:6` |

## Declaration

```java
public class AllWorldsLoadedEvent implements IEvent<Void> {
   public AllWorldsLoadedEvent() {
   }

   @Nonnull
   @Override
   public String toString() {
      return "AllWorldsLoadedEvent{}";
   }
}
```

## Fields

This event does not define any fields. It serves as a signal event to indicate that all worlds have been loaded.

## Methods

This event does not define any methods beyond those inherited from `IEvent<Void>`.

## Usage Example

```java
import com.hypixel.hytale.server.core.universe.world.events.AllWorldsLoadedEvent;
import com.hypixel.hytale.event.EventPriority;

// Register a listener to perform actions after all worlds are loaded
eventBus.register(EventPriority.NORMAL, AllWorldsLoadedEvent.class, event -> {
    System.out.println("All worlds have been loaded!");

    // Example: Perform cross-world initialization
    initializeCrossWorldFeatures();

    // Example: Start accepting player connections
    enablePlayerConnections();

    // Example: Initialize world portals/links
    setupWorldPortals();

    // Example: Start scheduled tasks that depend on all worlds
    startGlobalScheduledTasks();
});

private void initializeCrossWorldFeatures() {
    // Set up features that span multiple worlds
    // Such as shared inventories, cross-world teleportation, etc.
}

private void enablePlayerConnections() {
    // Now that all worlds are loaded, allow players to connect
    // This ensures players won't be sent to worlds that don't exist yet
}

private void setupWorldPortals() {
    // Configure portals between worlds
    // This requires all destination worlds to be loaded first
}

private void startGlobalScheduledTasks() {
    // Start tasks that operate across all worlds
    // Such as global events, cross-world mob spawning, etc.
}
```

## When This Event Fires

The `AllWorldsLoadedEvent` is dispatched when:

1. The server has finished loading all worlds configured in the server settings
2. All `AddWorldEvent` and `StartWorldEvent` events have been processed for initial worlds
3. The server is ready to proceed with post-world-loading initialization

This event fires **exactly once** during server startup, after the world loading phase is complete.

## Event Lifecycle

The typical server startup lifecycle involving world events:

1. `BootEvent` - Server is booting up
2. `AddWorldEvent` (per world) - Each configured world is being added
3. `StartWorldEvent` (per world) - Each world has started
4. **`AllWorldsLoadedEvent`** - All worlds are now loaded
5. Server continues with remaining startup tasks

## Important Notes

- This event fires only once during server startup
- It does not fire when worlds are dynamically added after startup
- Use this event for initialization that requires all worlds to be available
- This is the ideal place to set up cross-world functionality

## Related Events

- [AddWorldEvent](./add-world-event) - Fired for each world being added
- [StartWorldEvent](./start-world-event) - Fired when each world starts
- [RemoveWorldEvent](./remove-world-event) - Fired when a world is being removed
- [BootEvent](/docs/modding/plugins/events/server/boot-event) - Fired when the server starts booting

## Common Use Cases

### Cross-World System Initialization

```java
eventBus.register(AllWorldsLoadedEvent.class, event -> {
    // Initialize systems that depend on multiple worlds
    WorldLinkManager.initialize();
    CrossWorldEconomy.setup();
    GlobalLeaderboard.load();
});
```

### Server Ready Announcement

```java
eventBus.register(EventPriority.LAST, AllWorldsLoadedEvent.class, event -> {
    // Announce server is ready
    logger.info("Server initialization complete - all worlds loaded");

    // Enable the server listener for player connections
    server.setAcceptingConnections(true);

    // Notify external systems (Discord bots, monitoring, etc.)
    notifyExternalSystems("Server is ready");
});
```

### World Validation

```java
eventBus.register(EventPriority.FIRST, AllWorldsLoadedEvent.class, event -> {
    // Validate that required worlds are present
    List<String> requiredWorlds = Arrays.asList("spawn", "hub", "survival");

    for (String worldName : requiredWorlds) {
        if (!worldManager.worldExists(worldName)) {
            logger.error("Required world '{}' was not loaded!", worldName);
            // Take appropriate action
        }
    }
});
```

### Performance Metrics

```java
eventBus.register(AllWorldsLoadedEvent.class, event -> {
    long loadTime = System.currentTimeMillis() - serverStartTime;

    metrics.recordWorldLoadTime(loadTime);
    logger.info("All worlds loaded in {} ms", loadTime);

    // Record individual world statistics
    for (World world : worldManager.getWorlds()) {
        metrics.recordWorldStats(world.getName(), world.getLoadedChunkCount());
    }
});
```

## Testing

> **Tested:** January 18, 2026 - Verified with doc-test plugin

This event has been tested and verified to work correctly. To test this event yourself:

1. Run `/doctest test-all-worlds-loaded-event`
2. The command will check if the event was captured at server startup
3. If successful, it displays event details and current world state

**Test Results:**
- Event fires correctly at server startup: **Yes**
- `IEvent<Void>` implementation verified: **Yes**
- Not cancellable (no `ICancellable`): **Yes**
- Signal event (no fields/methods): **Yes**

## Internal Details

### Where the Event is Fired

The event is dispatched in `Universe.java` in two scenarios:

**Normal Mode (with worlds):**
```java
// Universe.java:324
this.universeReady = CompletableFuture.allOf(loadingWorlds.toArray(CompletableFuture[]::new))
    .thenCompose(v -> {
        // Create default world if needed
        String worldName = config.getDefaults().getWorld();
        return worldName != null && !this.worlds.containsKey(worldName.toLowerCase())
            ? CompletableFutureUtil._catch(this.addWorld(worldName))
            : CompletableFuture.completedFuture(null);
    })
    .thenRun(() -> HytaleServer.get().getEventBus().dispatch(AllWorldsLoadedEvent.class));
```

**BARE Mode (without worlds):**
```java
// Universe.java:286
if (Options.getOptionSet().has(Options.BARE)) {
    this.universeReady = CompletableFuture.completedFuture(null);
    HytaleServer.get().getEventBus().dispatch(AllWorldsLoadedEvent.class);
}
```

### Class Hierarchy

```
AllWorldsLoadedEvent
  └── implements IEvent<Void>
      └── extends IBaseEvent<Void>
```

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/AllWorldsLoadedEvent.java`
- **IEvent Interface:** `decompiled/com/hypixel/hytale/event/IEvent.java`
- **Trigger Location:** `decompiled/com/hypixel/hytale/server/core/universe/Universe.java:286, 324`

---

> **Last updated:** January 18, 2026 - Tested and verified with doc-test plugin. Added internal details.
