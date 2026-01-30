---
id: player-disconnect-event
title: PlayerDisconnectEvent
sidebar_label: PlayerDisconnectEvent
---

# PlayerDisconnectEvent

Fired when a player disconnects from the server. This event provides information about why the player disconnected and allows plugins to perform cleanup operations.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerDisconnectEvent` |
| **Parent Class** | `PlayerRefEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerDisconnectEvent.java:7` |

## Declaration

```java
public class PlayerDisconnectEvent extends PlayerRefEvent<Void> {
   public PlayerDisconnectEvent(@Nonnull PlayerRef playerRef) {
      super(playerRef);
   }
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `playerRef` | `PlayerRef` | `getPlayerRef()` | Reference to the disconnecting player (inherited from PlayerRefEvent) |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPlayerRef` | `@Nonnull public PlayerRef getPlayerRef()` | Returns the player reference for the disconnecting player (inherited) |
| `getDisconnectReason` | `@Nonnull public PacketHandler.DisconnectReason getDisconnectReason()` | Returns the reason why the player disconnected |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

```java
// Register a handler for when players disconnect
eventBus.register(PlayerDisconnectEvent.class, event -> {
    PlayerRef player = event.getPlayerRef();
    PacketHandler.DisconnectReason reason = event.getDisconnectReason();

    // Log the disconnection
    logger.info("Player " + player.getUsername() + " disconnected: " + reason);

    // Save player data
    savePlayerData(player);

    // Notify other players
    broadcastMessage(player.getUsername() + " has left the server");
});

// Register with late priority for cleanup after other handlers
eventBus.register(EventPriority.LATE, PlayerDisconnectEvent.class, event -> {
    // Perform final cleanup
    cleanupPlayerResources(event.getPlayerRef());
});
```

## Common Use Cases

- Saving player data before they fully disconnect
- Broadcasting leave messages to other players
- Cleaning up player-specific resources and data
- Logging disconnection events for analytics
- Updating player presence or status systems
- Removing players from teams, parties, or other groups

## Practical Examples

### Getting Disconnect Reason Details

The `getDisconnectReason()` method returns a `PacketHandler.DisconnectReason` object that contains either a server-side reason or a client-side disconnect type:

```java
eventBus.register(PlayerDisconnectEvent.class, event -> {
    PlayerRef player = event.getPlayerRef();
    PacketHandler.DisconnectReason reason = event.getDisconnectReason();

    // Check if it was a server-initiated disconnect
    String serverReason = reason.getServerDisconnectReason();
    if (serverReason != null) {
        logger.info("Server kicked " + player.getUsername() + ": " + serverReason);
        return;
    }

    // Check if it was a client-initiated disconnect
    DisconnectType clientType = reason.getClientDisconnectType();
    if (clientType != null) {
        switch (clientType) {
            case Disconnect -> logger.info(player.getUsername() + " disconnected normally");
            case Crash -> logger.warn(player.getUsername() + " disconnected due to crash");
        }
    }
});
```

### DisconnectType Enum Values

| Value | Description |
|-------|-------------|
| `Disconnect` | Normal client-initiated disconnection (player pressed disconnect) |
| `Crash` | Client crashed or connection was lost unexpectedly |

## Internal Details

### Where the Event is Fired

The event is fired in `Universe.removePlayer()` method:

```java
// File: com/hypixel/hytale/server/core/universe/Universe.java:733
public void removePlayer(@Nonnull PlayerRef playerRef) {
    this.getLogger().at(Level.INFO).log("Removing player '" + playerRef.getUsername() + "'");

    IEventDispatcher<PlayerDisconnectEvent, PlayerDisconnectEvent> eventDispatcher =
        HytaleServer.get().getEventBus().dispatchFor(PlayerDisconnectEvent.class);

    if (eventDispatcher.hasListener()) {
        eventDispatcher.dispatch(new PlayerDisconnectEvent(playerRef));
    }

    // Player removal continues regardless of event handlers...
}
```

### Event Processing Chain

```
Player clicks Disconnect / Connection lost
         ↓
Universe.removePlayer(playerRef) called
         ↓
PlayerDisconnectEvent dispatched (if listeners exist)
         ↓
Event handlers execute (cannot prevent removal)
         ↓
Player entity removed from world
         ↓
finalizePlayerRemoval() called
```

### Class Hierarchy

```
PlayerDisconnectEvent
  └── extends PlayerRefEvent<Void>
        └── implements IEvent<Void>
              └── extends IBaseEvent<Void>
```

## Testing

> **Tested:** January 17, 2026 - Verified with doc-test plugin

To test this event:
1. Run `/doctest test-player-disconnect-event`
2. Disconnect from the server (ESC -> Disconnect)
3. Check the server console for event details

**Test output example:**
```
[SUCCESS] PlayerDisconnectEvent detected!

Event details:
  getPlayerRef():
    -> Username: Timiliris
    -> UUID: 8559eb7c-b33d-448c-ab06-e49e2fd75eb9
  getDisconnectReason():
    -> DisconnectReason{serverDisconnectReason='null', clientDisconnectType=Disconnect}
    -> Client Type: Disconnect
  toString():
    -> PlayerDisconnectEvent{playerRef=...} PlayerRefEvent{playerRef=...}

All documented methods work correctly!
```

> **Last updated:** January 17, 2026 - Tested and verified. Added practical examples and internal details.

## Related Events

- [PlayerConnectEvent](./player-connect-event) - Fired when a player connects
- [PlayerSetupDisconnectEvent](./player-setup-disconnect-event) - Fired during early disconnection phase
- [DrainPlayerFromWorldEvent](./drain-player-from-world-event) - Fired when removing a player from a world

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerDisconnectEvent.java:7`
