---
id: shutdown-event
title: ShutdownEvent
sidebar_label: ShutdownEvent
---

# ShutdownEvent

The `ShutdownEvent` is fired when the Hytale server begins its shutdown sequence. This event allows plugins to perform cleanup operations and save data before the server stops. The event includes priority constants that define the order in which built-in shutdown operations occur.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ShutdownEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ShutdownEvent.java:6` |

## Declaration

```java
public class ShutdownEvent implements IEvent<Void> {
    public static final short DISCONNECT_PLAYERS = -48;
    public static final short UNBIND_LISTENERS = -40;
    public static final short SHUTDOWN_WORLDS = -32;

    public ShutdownEvent() {
    }

    @Nonnull
    @Override
    public String toString() {
        return "ShutdownEvent{}";
    }
}
```

## Constants

The `ShutdownEvent` defines priority constants that indicate when specific shutdown operations occur. These can be used to schedule your plugin's shutdown handlers at the appropriate time relative to built-in server operations.

| Constant | Value | Description |
|----------|-------|-------------|
| `DISCONNECT_PLAYERS` | `-48` | Priority at which all connected players are disconnected from the server. Handlers registered before this priority can still communicate with players. |
| `UNBIND_LISTENERS` | `-40` | Priority at which network listeners are unbound. After this point, no new connections can be accepted. |
| `SHUTDOWN_WORLDS` | `-32` | Priority at which worlds are shut down and saved. Register before this to perform world-related operations. |

### Priority Order Reference

The following table shows how the shutdown constants relate to the standard `EventPriority` values:

| Priority Level | Value | Relative Position |
|----------------|-------|-------------------|
| `EventPriority.FIRST` | `-21844` | Runs first (before shutdown constants) |
| **`DISCONNECT_PLAYERS`** | **`-48`** | **Disconnect all players** |
| **`UNBIND_LISTENERS`** | **`-40`** | **Stop accepting connections** |
| **`SHUTDOWN_WORLDS`** | **`-32`** | **Save and shutdown worlds** |
| `EventPriority.EARLY` | `-10922` | Early priority (after shutdown) |
| `EventPriority.NORMAL` | `0` | Default priority |
| `EventPriority.LATE` | `10922` | Late priority |
| `EventPriority.LAST` | `21844` | Runs last |

## Fields

This event has no fields beyond the static constants. It serves as a signal that the server shutdown process has begun.

## Usage Example

### Basic Shutdown Handler

```java
import com.hypixel.hytale.server.core.event.events.ShutdownEvent;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class MyPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Register for shutdown with default priority
        eventBus.register(ShutdownEvent.class, this::onServerShutdown);
    }

    private void onServerShutdown(ShutdownEvent event) {
        getLogger().info("Server is shutting down - saving plugin data...");
        savePluginData();
        closeConnections();
    }
}
```

### Using Priority Constants

```java
import com.hypixel.hytale.server.core.event.events.ShutdownEvent;
import com.hypixel.hytale.event.EventBus;

public class AdvancedPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Run BEFORE players are disconnected (to send goodbye messages)
        eventBus.register(
            (short)(ShutdownEvent.DISCONNECT_PLAYERS - 1),
            ShutdownEvent.class,
            null,
            this::notifyPlayers
        );

        // Run AFTER players disconnect but BEFORE worlds shutdown
        eventBus.register(
            (short)(ShutdownEvent.SHUTDOWN_WORLDS - 1),
            ShutdownEvent.class,
            null,
            this::saveWorldData
        );

        // Run AFTER worlds shutdown for final cleanup
        eventBus.register(
            (short)(ShutdownEvent.SHUTDOWN_WORLDS + 1),
            ShutdownEvent.class,
            null,
            this::finalCleanup
        );
    }

    private void notifyPlayers(ShutdownEvent event) {
        // Broadcast message to all players before they're disconnected
        getServer().broadcastMessage("Server is shutting down! Goodbye!");
    }

    private void saveWorldData(ShutdownEvent event) {
        // Save any world-specific plugin data while worlds still exist
        for (World world : getServer().getWorlds()) {
            saveWorldMetadata(world);
        }
    }

    private void finalCleanup(ShutdownEvent event) {
        // Perform final cleanup after everything else
        closeDatabase();
        flushLogs();
    }
}
```

### Graceful Resource Cleanup

```java
import com.hypixel.hytale.server.core.event.events.ShutdownEvent;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class DatabasePlugin extends PluginBase {

    private DatabaseConnection database;

    @Override
    public void onEnable(EventBus eventBus) {
        database = new DatabaseConnection();

        // Save pending data before players disconnect
        eventBus.register(
            (short)(ShutdownEvent.DISCONNECT_PLAYERS - 10),
            ShutdownEvent.class,
            null,
            event -> flushPendingPlayerData()
        );

        // Close database connection at the very end
        eventBus.register(
            EventPriority.LAST,
            ShutdownEvent.class,
            null,
            event -> database.close()
        );
    }

    private void flushPendingPlayerData() {
        // Ensure all player data is saved before disconnect
        database.flushPendingWrites();
    }
}
```

## When This Event Fires

The `ShutdownEvent` fires when the server begins its graceful shutdown sequence. This occurs:

1. When an administrator issues a stop command
2. When the server receives a shutdown signal
3. During graceful termination of the server process

The shutdown sequence follows this order:

1. `ShutdownEvent` is dispatched
2. Handlers at `DISCONNECT_PLAYERS` priority (-48) disconnect all players
3. Handlers at `UNBIND_LISTENERS` priority (-40) stop network listeners
4. Handlers at `SHUTDOWN_WORLDS` priority (-32) save and unload worlds
5. Remaining handlers execute in priority order
6. Server process terminates

## Best Practices

1. **Choose appropriate priority**: Use the constants to understand when your handler should run relative to built-in operations.

2. **Keep handlers fast**: Shutdown should be quick. Avoid long-running operations.

3. **Handle exceptions gracefully**: Exceptions in shutdown handlers can prevent proper cleanup of other systems.

4. **Save critical data early**: Register handlers before `SHUTDOWN_WORLDS` to ensure data is saved while worlds are accessible.

5. **Close external connections last**: Database and network connections should be closed at `EventPriority.LAST` to ensure all data is flushed first.

## Related Events

| Event | Description |
|-------|-------------|
| [BootEvent](./boot-event) | Fired when the server starts booting |
| [PluginSetupEvent](./plugin-setup-event) | Fired when an individual plugin is being set up |
| [RemoveWorldEvent](/docs/en/modding/plugins/events/world/remove-world-event) | Fired when individual worlds are removed |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events`
- **Hierarchy**: `ShutdownEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Event System**: Standard synchronous event dispatched via `EventBus`
