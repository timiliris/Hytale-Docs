---
id: world-path-changed-event
title: WorldPathChangedEvent
sidebar_label: WorldPathChangedEvent
---

# WorldPathChangedEvent

Fired when the world path configuration changes. This event is useful for tracking navigation path updates and world structure changes that affect how entities navigate through the world.

> **Internal Event:** This is an internal server event that fires only when `WorldPathConfig.putPath()` is called by the pathfinding system. It cannot be triggered manually through gameplay actions.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.path.WorldPathChangedEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/path/WorldPathChangedEvent.java` |

## Declaration

```java
public class WorldPathChangedEvent implements IEvent<Void> {
   private WorldPath worldPath;

   public WorldPathChangedEvent(WorldPath worldPath) {
      Objects.requireNonNull(worldPath, "World path must not be null in an event");
      this.worldPath = worldPath;
   }

   public WorldPath getWorldPath() {
      return this.worldPath;
   }

   @Nonnull
   @Override
   public String toString() {
      return "WorldPathChangedEvent{worldPath=" + this.worldPath + "}";
   }
}
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `worldPath` | `WorldPath` | `getWorldPath()` | The world path object that has changed |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getWorldPath` | `public WorldPath getWorldPath()` | Returns the world path that has been modified |

## Validation

The event constructor validates that:
- `worldPath` must not be null - throws `NullPointerException` with message "World path must not be null in an event"

## Usage Example

```java
import com.hypixel.hytale.server.core.universe.world.path.WorldPathChangedEvent;
import com.hypixel.hytale.server.core.universe.world.path.WorldPath;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class PathfindingPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(WorldPathChangedEvent.class, this::onWorldPathChanged, EventPriority.NORMAL);
    }

    private void onWorldPathChanged(WorldPathChangedEvent event) {
        WorldPath worldPath = event.getWorldPath();

        // React to path changes
        getLogger().info("World path changed: " + worldPath.toString());

        // Update any cached pathfinding data
        invalidatePathfindingCache(worldPath);

        // Notify NPCs that may need to recalculate routes
        notifyAffectedEntities(worldPath);
    }

    private void invalidatePathfindingCache(WorldPath worldPath) {
        // Clear cached paths that may be affected by the change
    }

    private void notifyAffectedEntities(WorldPath worldPath) {
        // Update entities whose navigation may be affected
    }
}
```

## When This Event Fires

The `WorldPathChangedEvent` is fired **exclusively** from `WorldPathConfig.putPath()` when a new `WorldPath` is added or an existing one is updated in the world's path configuration.

```java
// From WorldPathConfig.java
public WorldPath putPath(@Nonnull WorldPath worldPath) {
   Objects.requireNonNull(worldPath);
   IEventDispatcher<WorldPathChangedEvent, WorldPathChangedEvent> dispatcher =
      HytaleServer.get().getEventBus().dispatchFor(WorldPathChangedEvent.class);
   if (dispatcher.hasListener()) {
      dispatcher.dispatch(new WorldPathChangedEvent(worldPath));
   }
   return this.paths.put(worldPath.getName(), worldPath);
}
```

**Important:** This event only fires if there is at least one registered listener (`dispatcher.hasListener()`).

The event fires **before** the path is stored in the configuration map, allowing handlers to:
- Inspect the new/updated path
- Update cached pathfinding data
- Log navigation changes
- Trigger dependent systems

## Understanding WorldPath

The `WorldPath` object represents navigation path information in the world, which may include:
- Waypoints and connections
- Navigation mesh data
- Path constraints and costs
- Accessibility information

## Use Cases

- **Custom Pathfinding**: Integrate with custom navigation systems
- **Cache Invalidation**: Clear stale pathfinding caches
- **NPC Behavior**: Update NPC navigation when paths change
- **Debugging**: Track path changes for troubleshooting
- **Analytics**: Monitor world navigation updates

## Internal Details

### Known Listener

The `NPCPlugin` listens to this event to track path changes:

```java
// From NPCPlugin.java
protected void onPathChange(WorldPathChangedEvent event) {
   this.pathChangeRevision.getAndIncrement();
}
```

This increments a revision counter used to invalidate NPC pathfinding caches when world paths change.

### WorldPath Structure

The `WorldPath` class contains:
- `UUID id` - Unique identifier for the path
- `String name` - Name of the path
- `List<Transform> waypoints` - List of waypoint positions

## Testing Limitations

> **Verified:** January 18, 2026 - Structural verification only

This event **cannot be manually triggered** through gameplay. It is an internal server event that only fires when:
- The server's pathfinding system adds or updates navigation paths
- A plugin programmatically calls `WorldPathConfig.putPath()`

To test this event, you would need to:
1. Register a listener for `WorldPathChangedEvent`
2. Wait for the server's internal pathfinding system to update paths, OR
3. Programmatically create and add a `WorldPath` to the configuration

```java
// Programmatic testing (requires access to WorldPathConfig)
WorldPath testPath = new WorldPath("test-path", waypointsList);
worldPathConfig.putPath(testPath); // This will fire the event
```

## Related Events

- [AddWorldEvent](./add-world-event) - Fired when a world is added
- [StartWorldEvent](./start-world-event) - Fired when a world starts

## Source Reference

- Event class: `com/hypixel/hytale/server/core/universe/world/path/WorldPathChangedEvent.java`
- Trigger location: `com/hypixel/hytale/server/core/universe/world/path/WorldPathConfig.java` (line 51)
