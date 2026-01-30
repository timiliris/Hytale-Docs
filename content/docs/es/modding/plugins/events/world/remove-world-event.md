---
id: remove-world-event
title: RemoveWorldEvent
sidebar_label: RemoveWorldEvent
---

# RemoveWorldEvent

The `RemoveWorldEvent` is fired when a world is being removed from the server's universe. This event provides information about why the world is being removed and allows conditional cancellation based on the removal reason.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.universe.world.events.RemoveWorldEvent` |
| **Parent Class** | `WorldEvent` |
| **Implements** | `ICancellable` |
| **Cancellable** | Yes (conditional based on RemovalReason) |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/RemoveWorldEvent.java:7` |

## Declaration

```java
public class RemoveWorldEvent extends WorldEvent implements ICancellable {
   private boolean cancelled;
   @Nonnull
   private final RemoveWorldEvent.RemovalReason removalReason;

   public RemoveWorldEvent(@Nonnull World world, @Nonnull RemoveWorldEvent.RemovalReason removalReason) {
      super(world);
      this.removalReason = removalReason;
   }

   @Nonnull
   public RemoveWorldEvent.RemovalReason getRemovalReason() {
      return this.removalReason;
   }

   @Override
   public boolean isCancelled() {
      // EXCEPTIONAL removals cannot be cancelled - always returns false
      return this.removalReason == RemoveWorldEvent.RemovalReason.EXCEPTIONAL ? false : this.cancelled;
   }

   @Override
   public void setCancelled(boolean cancelled) {
      this.cancelled = cancelled;
   }

   @Nonnull
   @Override
   public String toString() {
      return "RemoveWorldEvent{cancelled=" + this.cancelled + "} " + super.toString();
   }

   public static enum RemovalReason {
      GENERAL,
      EXCEPTIONAL;

      private RemovalReason() {
      }
   }
}
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `cancelled` | `boolean` | `isCancelled()` | Whether the event has been cancelled |
| `removalReason` | `RemoveWorldEvent.RemovalReason` | `getRemovalReason()` | The reason why the world is being removed |

## Inherited Fields

From `WorldEvent`:

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `world` | `World` | `getWorld()` | The world being removed from the server |

## Methods

### isCancelled()

```java
public boolean isCancelled()
```

Returns whether the event has been cancelled.

**Returns:** `boolean` - `true` if the world removal has been cancelled, `false` otherwise

### setCancelled(boolean)

```java
public void setCancelled(boolean cancelled)
```

Sets whether the event should be cancelled. Note that cancellation may be conditional based on the `RemovalReason`. Exceptional removals may not be cancellable.

**Parameters:**
- `cancelled` - `true` to attempt to cancel the world removal, `false` to allow it

### getRemovalReason()

```java
@Nonnull
public RemoveWorldEvent.RemovalReason getRemovalReason()
```

Returns the reason why the world is being removed.

**Returns:** `RemoveWorldEvent.RemovalReason` - The removal reason enum value

### getWorld()

```java
public World getWorld()
```

Inherited from `WorldEvent`. Returns the world that is being removed.

**Returns:** `World` - The world instance being removed from the server

## Inner Classes

### RemovalReason (enum)

The `RemovalReason` enum indicates why the world is being removed from the server.

```java
public static enum RemovalReason {
   GENERAL,
   EXCEPTIONAL;
}
```

| Value | Description |
|-------|-------------|
| `GENERAL` | Normal world removal, typically initiated by plugins or standard server operations. This type of removal can usually be cancelled. |
| `EXCEPTIONAL` | Removal due to an exceptional circumstance such as an error or critical failure. This type of removal may not be cancellable to ensure server stability. |

## Usage Example

```java
import com.hypixel.hytale.server.core.universe.world.events.RemoveWorldEvent;
import com.hypixel.hytale.event.EventPriority;

// Register a listener to control world removals
eventBus.register(EventPriority.NORMAL, RemoveWorldEvent.class, event -> {
    World world = event.getWorld();
    RemoveWorldEvent.RemovalReason reason = event.getRemovalReason();

    // Log all world removals
    System.out.println("World removal requested: " + world.getName() +
                       " (Reason: " + reason + ")");

    // Only try to cancel GENERAL removals (EXCEPTIONAL may not be cancellable)
    if (reason == RemoveWorldEvent.RemovalReason.GENERAL) {
        // Example: Prevent removal of protected worlds
        if (isProtectedWorld(world)) {
            event.setCancelled(true);
            System.out.println("Blocked removal of protected world: " + world.getName());
            return;
        }

        // Example: Prevent removal if players are still in the world
        if (world.getPlayerCount() > 0) {
            event.setCancelled(true);
            System.out.println("Cannot remove world with active players: " + world.getName());
            return;
        }
    } else {
        // EXCEPTIONAL removals - typically cannot be prevented
        System.out.println("Exceptional world removal cannot be cancelled");
    }
});

private boolean isProtectedWorld(World world) {
    // Custom logic to determine if world is protected
    return world.getName().equals("spawn") || world.getName().equals("hub");
}
```

## When This Event Fires

The `RemoveWorldEvent` is dispatched when:

1. A world is being unregistered from the server's universe system
2. During server shutdown when worlds are being cleaned up
3. When plugins programmatically request world removal
4. When an error or exceptional condition requires a world to be removed (`EXCEPTIONAL` reason)
5. When dynamic world management removes temporary or instance worlds

The event fires **before** the world is fully removed, allowing handlers to potentially cancel the operation.

## Cancellation Behavior

When the event is cancelled:
- The world will remain loaded and accessible (for `GENERAL` removals)
- Players can continue to interact with the world
- The world will stay in the server's world list

**Important:** Cancellation of `EXCEPTIONAL` removals may be ignored by the system to ensure server stability. Always check the `RemovalReason` before attempting to cancel.

## Related Events

- [AddWorldEvent](./add-world-event) - Fired when a world is being added
- [StartWorldEvent](./start-world-event) - Fired when a world starts
- [AllWorldsLoadedEvent](./all-worlds-loaded-event) - Fired when all configured worlds have been loaded

## Practical Examples

### Listening for World Removal (Verified Working)

```java
// Register a global listener for RemoveWorldEvent
eventBus.registerGlobal(RemoveWorldEvent.class, event -> {
    String worldName = event.getWorld().getName();
    RemoveWorldEvent.RemovalReason reason = event.getRemovalReason();
    boolean cancelled = event.isCancelled();

    System.out.println("RemoveWorldEvent fired!");
    System.out.println("  World: " + worldName);
    System.out.println("  Reason: " + reason.name());
    System.out.println("  Cancelled: " + cancelled);
});
```

### Triggering the Event Programmatically

```java
// RemoveWorldEvent is fired when calling Universe.removeWorld()
Universe universe = Universe.get();

// GENERAL removal - can be cancelled by listeners
boolean removed = universe.removeWorld("world_name");
if (removed) {
    System.out.println("World removed successfully");
} else {
    System.out.println("World removal was cancelled by a listener");
}

// EXCEPTIONAL removal - cannot be cancelled, used for error recovery
universe.removeWorldExceptionally("world_name");
```

### Where the Event is Fired (Internal)

The event is fired in two places in `Universe.java`:

1. **`Universe.removeWorld(String name)`** (line ~537-561) - Fires with `RemovalReason.GENERAL`, checks `isCancelled()` and returns `false` if cancelled
2. **`Universe.removeWorldExceptionally(String name)`** (line ~563-583) - Fires with `RemovalReason.EXCEPTIONAL`, ignores cancellation

## Testing

> **Tested:** January 18, 2026 - Verified with doc-test plugin

To test this event:

1. Create a test world first:
   ```
   /world create doctest_temp_world
   ```

2. Run the test command:
   ```
   /doctest test-remove-world-event
   ```

3. The command will remove the test world and display event details

**Expected output:**
- `[SUCCESS] RemoveWorldEvent detected!`
- Event details including world name, removalReason (GENERAL), and isCancelled state

## Source Reference

- **Event Definition:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/RemoveWorldEvent.java`
- **Parent Class:** `decompiled/com/hypixel/hytale/server/core/universe/world/events/WorldEvent.java`
- **Cancellable Interface:** `decompiled/com/hypixel/hytale/event/ICancellable.java`

> **Last updated:** January 18, 2026 - Tested and verified. Added practical examples and test instructions.
