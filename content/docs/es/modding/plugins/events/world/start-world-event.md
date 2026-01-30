---
id: start-world-event
title: StartWorldEvent
sidebar_label: StartWorldEvent
---

# StartWorldEvent

The `StartWorldEvent` is fired when a world has been initialized and is starting up. This event signals that the world is ready for use and allows plugins to perform initialization tasks specific to the world.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.StartWorldEvent` |
| **Parent Class** | `WorldEvent` |
| **Cancellable** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/StartWorldEvent.java:6` |

## Declaration

```java
public class StartWorldEvent extends WorldEvent {
   public StartWorldEvent(@Nonnull World world) {
      super(world);
   }

   @Nonnull
   @Override
   public String toString() {
      return "StartWorldEvent{} " + super.toString();
   }
}
```

## Fields

This event does not define any additional fields beyond those inherited from `WorldEvent`.

## Inherited Fields

From `WorldEvent`:

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `world` | `World` | `getWorld()` | The world that has started |

## Methods

### getWorld()

```java
public World getWorld()
```

Inherited from `WorldEvent`. Returns the world that has started.

**Returns:** `World` - The world instance that has completed its startup process

## Usage Example

> **Tested** - This code has been verified with a working plugin.

Since `StartWorldEvent` extends `WorldEvent` which has a non-Void key type, you must use `registerGlobal()` to catch all world events regardless of their key.

```java
import com.hypixel.hytale.server.core.universe.world.events.StartWorldEvent;
import com.hypixel.hytale.event.EventRegistry;

// Register a global listener to perform actions when worlds start
eventBus.registerGlobal(StartWorldEvent.class, event -> {
    World world = event.getWorld();
    String worldName = world != null ? world.getName() : "Unknown";

    // Log world startup
    logger.info("World started: " + worldName);

    // Example: Initialize world-specific features
    if ("spawn".equals(worldName)) {
        setupSpawnWorld(world);
    } else if (worldName.startsWith("dungeon_")) {
        setupDungeonWorld(world);
    }
});
```

**Important:** Using `register()` instead of `registerGlobal()` will not work for this event because it has a non-Void key type.

## When This Event Fires

The `StartWorldEvent` is dispatched when:

1. A world has been successfully added to the universe and is now starting
2. The world's initialization process has completed
3. The world is ready to accept players and process game logic
4. After `AddWorldEvent` has been processed and not cancelled

The event fires **after** the world has been fully initialized, meaning:
- World chunks can be loaded
- Entities can be spawned
- Players can be teleported to the world
- World-specific systems are operational

## Event Lifecycle

The typical world lifecycle events follow this order:

1. `AddWorldEvent` - World is being added (cancellable)
2. `StartWorldEvent` - World has started (not cancellable)
3. (World is active and operational)
4. `RemoveWorldEvent` - World is being removed (cancellable)

## Related Events

- [AddWorldEvent](./add-world-event) - Fired before the world is added (cancellable)
- [RemoveWorldEvent](./remove-world-event) - Fired when a world is being removed
- [AllWorldsLoadedEvent](./all-worlds-loaded-event) - Fired when all configured worlds have been loaded

## Common Use Cases

### World-Specific Initialization

```java
eventBus.register(StartWorldEvent.class, event -> {
    World world = event.getWorld();

    // Initialize custom world borders
    setWorldBorder(world, 10000);

    // Set world-specific game rules
    applyWorldRules(world);

    // Register world-specific event handlers
    registerWorldHandlers(world);
});
```

### Logging and Monitoring

```java
eventBus.register(EventPriority.FIRST, StartWorldEvent.class, event -> {
    World world = event.getWorld();

    // Track world startup metrics
    long startTime = System.currentTimeMillis();
    metrics.recordWorldStart(world.getName(), startTime);

    // Log for monitoring
    logger.info("World '{}' has started at {}", world.getName(), startTime);
});
```

### Dynamic World Management

```java
eventBus.register(StartWorldEvent.class, event -> {
    World world = event.getWorld();

    // If this is a temporary/instance world, schedule cleanup
    if (world.getName().startsWith("instance_")) {
        scheduleWorldCleanup(world, 30, TimeUnit.MINUTES);
    }
});
```

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/StartWorldEvent.java`
- **Parent Class:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/WorldEvent.java`
