---
id: add-world-event
title: AddWorldEvent
sidebar_label: AddWorldEvent
---

# AddWorldEvent

The `AddWorldEvent` is fired when a new world is being added to the server's universe. This event allows plugins to intercept and potentially cancel the addition of worlds, enabling custom world management logic.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.AddWorldEvent` |
| **Parent Class** | `WorldEvent` |
| **Implements** | `ICancellable` |
| **Cancellable** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/AddWorldEvent.java:7` |

## Declaration

```java
public class AddWorldEvent extends WorldEvent implements ICancellable {
   private boolean cancelled = false;

   public AddWorldEvent(@Nonnull World world) {
      super(world);
   }

   @Nonnull
   @Override
   public String toString() {
      return "AddWorldEvent{cancelled=" + this.cancelled + "} " + super.toString();
   }

   @Override
   public boolean isCancelled() {
      return this.cancelled;
   }

   @Override
   public void setCancelled(boolean cancelled) {
      this.cancelled = cancelled;
   }
}
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `cancelled` | `boolean` | `isCancelled()` | Whether the event has been cancelled |

## Inherited Fields

From `WorldEvent`:

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `world` | `World` | `getWorld()` | The world being added to the server |

## Methods

### isCancelled()

```java
public boolean isCancelled()
```

Returns whether the event has been cancelled.

**Returns:** `boolean` - `true` if the world addition has been cancelled, `false` otherwise

### setCancelled(boolean)

```java
public void setCancelled(boolean cancelled)
```

Sets whether the event should be cancelled. When cancelled, the world will not be added to the server.

**Parameters:**
- `cancelled` - `true` to cancel the world addition, `false` to allow it

### getWorld()

```java
public World getWorld()
```

Inherited from `WorldEvent`. Returns the world that is being added.

**Returns:** `World` - The world instance being added to the server

## Usage Example

> **Tested** - This code has been verified with a working plugin.

Since `AddWorldEvent` extends `WorldEvent` which has a non-Void key type, you must use `registerGlobal()` to catch all world events regardless of their key.

```java
import com.hypixel.hytale.server.core.universe.world.events.AddWorldEvent;
import com.hypixel.hytale.event.EventRegistry;

// Register a global listener to control world additions
eventBus.registerGlobal(AddWorldEvent.class, event -> {
    World world = event.getWorld();
    String worldName = world != null ? world.getName() : "Unknown";

    // Log world additions
    logger.info("World being added: " + worldName);

    // Example: Prevent adding worlds with certain names
    if (worldName.startsWith("restricted_")) {
        event.setCancelled(true);
        logger.info("Blocked addition of restricted world: " + worldName);
    }
});
```

**Important:** Using `register()` instead of `registerGlobal()` will not work for this event because it has a non-Void key type.

## When This Event Fires

The `AddWorldEvent` is dispatched when:

1. A new world is being registered with the server's universe system
2. During server startup when configured worlds are loaded
3. When plugins programmatically create and add new worlds (via `Universe.addWorld()`)
4. When dynamic world generation creates a new world instance

The event fires **before** the world is fully added to the universe, allowing handlers to cancel the operation if needed.

> **Important:** At the time this event fires, the world is **not yet fully initialized**. The `World` object exists but its `EntityStore` is not yet available. This means methods like `world.toString()` may throw a `NullPointerException`. Use `world.getName()` to safely access the world name.

## Cancellation Behavior

When the event is cancelled:
- The world will not be added to the server's world list
- The world will not be accessible to players or other systems
- Any associated resources may be cleaned up depending on implementation

## Related Events

- [RemoveWorldEvent](./remove-world-event) - Fired when a world is being removed
- [StartWorldEvent](./start-world-event) - Fired when a world starts after being added
- [AllWorldsLoadedEvent](./all-worlds-loaded-event) - Fired when all configured worlds have been loaded

## Internal Details

### Where the Event is Fired

The event is dispatched in `Universe.makeWorld()` at line 444:

```java
// In Universe.java (makeWorld method)
World world = new World(name, savePath, worldConfig);
AddWorldEvent event = HytaleServer.get().getEventBus()
    .dispatchFor(AddWorldEvent.class, name)
    .dispatch(new AddWorldEvent(world));

if (!event.isCancelled() && !HytaleServer.get().isShuttingDown()) {
    // World is added to universe maps
    this.worlds.putIfAbsent(name.toLowerCase(), world);
    this.worldsByUuid.putIfAbsent(worldConfig.getUuid(), world);
} else {
    throw new WorldLoadCancelledException();
}
```

### Cancellation Implementation

When the event is cancelled (`setCancelled(true)`):
1. The world is **not** added to `Universe.worlds` map
2. The world is **not** added to `Universe.worldsByUuid` map
3. A `WorldLoadCancelledException` is thrown
4. The `CompletableFuture` chain fails with this exception

### Event Dispatch Order

1. `AddWorldEvent` - When world is being created (cancellable)
2. World initialization (init, paths, worldgen)
3. `StartWorldEvent` - When world starts running

## Testing

> **Tested:** January 18, 2026 - Verified with doc-test plugin

To test this event:

1. Run `/doctest test-add-world-event`
2. The command will create a temporary test world
3. The event details will be displayed in the server console
4. Check for "AddWorldEvent fired!" message

**Test results:**
- `getWorld()` - Works correctly, returns the World object
- `getWorld().getName()` - Works correctly, returns world name
- `isCancelled()` - Works correctly, returns cancellation state
- `setCancelled(boolean)` - Works correctly, can cancel world addition
- `world.toString()` - May fail (EntityStore not yet initialized)

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/AddWorldEvent.java`
- **Parent Class:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/WorldEvent.java`
- **Cancellable Interface:** `decompiled/com/hypixel/hytale/event/ICancellable.java`
- **Trigger Location:** `decompiled/com/hypixel/hytale/server/core/universe/Universe.java:444`

---

> **Last updated:** January 18, 2026 - Tested and verified. Added internal details and testing section.
