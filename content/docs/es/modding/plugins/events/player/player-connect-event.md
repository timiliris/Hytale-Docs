---
id: player-connect-event
title: PlayerConnectEvent
sidebar_label: PlayerConnectEvent
---

# PlayerConnectEvent

Fired when a player successfully connects to the server and is being initialized. This event occurs after the player has completed the setup phase (PlayerSetupConnectEvent) and is now fully connected.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerConnectEvent.java:12` |

## Declaration

```java
public class PlayerConnectEvent implements IEvent<Void> {
   private final Holder<EntityStore> holder;
   private final PlayerRef playerRef;
   @Nullable
   private World world;

   public PlayerConnectEvent(@Nonnull Holder<EntityStore> holder, @Nonnull PlayerRef playerRef, @Nullable World world) {
      // ...
   }
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `holder` | `Holder<EntityStore>` | `getHolder()` | The entity holder containing the player's entity store |
| `playerRef` | `PlayerRef` | `getPlayerRef()` | Reference to the connecting player |
| `world` | `World` | `getWorld()` | The world the player will spawn into (nullable, can be set) |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getHolder` | `public Holder<EntityStore> getHolder()` | Returns the entity holder for the connecting player |
| `getPlayerRef` | `public PlayerRef getPlayerRef()` | Returns the player reference for the connecting player |
| `getPlayer` | `@Nullable @Deprecated public Player getPlayer()` | **Deprecated** - Returns the Player object directly (nullable) |
| `getWorld` | `@Nullable public World getWorld()` | Returns the world the player will spawn into (nullable) |
| `setWorld` | `public void setWorld(@Nullable World world)` | Sets the world where the player will spawn |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

> **Tested** - This code has been verified with a working plugin.

Since `PlayerConnectEvent` implements `IEvent<Void>`, you can use the standard `register()` method.

```java
// Register a handler for when players connect
eventBus.register(PlayerConnectEvent.class, event -> {
    PlayerRef playerRef = event.getPlayerRef();
    String playerName = playerRef != null ? playerRef.getUsername() : "Unknown";
    String worldName = event.getWorld() != null ? event.getWorld().getName() : "null";

    // Log the connection
    logger.info("Player connected: " + playerName + " to world: " + worldName);

    // Optionally set a specific spawn world
    World lobbyWorld = worldManager.getWorld("lobby");
    if (lobbyWorld != null) {
        event.setWorld(lobbyWorld);
    }
});

// Register with high priority to run before other handlers
eventBus.register(EventPriority.FIRST, PlayerConnectEvent.class, event -> {
    // Process connection early
    Holder<EntityStore> holder = event.getHolder();
    // Initialize player data
});
```

**Note:** Use `playerRef.getUsername()` to get the player's name from `PlayerRef`.

## Common Use Cases

- Welcoming players with a custom message
- Setting up initial player data and state
- Redirecting players to specific worlds on join
- Initializing player-specific plugins or features
- Logging player connections for analytics
- Loading saved player data from storage

## Related Events

- [PlayerSetupConnectEvent](./player-setup-connect-event) - Fired earlier during connection setup, before this event
- [PlayerDisconnectEvent](./player-disconnect-event) - Fired when a player disconnects
- [PlayerReadyEvent](./player-ready-event) - Fired when the player client is fully ready
- [AddPlayerToWorldEvent](./add-player-to-world-event) - Fired when the player is added to a world

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerConnectEvent.java:12`
