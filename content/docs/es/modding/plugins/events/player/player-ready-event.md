---
id: player-ready-event
title: PlayerReadyEvent
sidebar_label: PlayerReadyEvent
---

# PlayerReadyEvent

Fired when a player's client has fully loaded and is ready to play. This event occurs after the player has connected and received all necessary initial data, indicating that the client is prepared to receive gameplay updates.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerReadyEvent` |
| **Parent Class** | `PlayerEvent<String>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerReadyEvent.java:8` |

## Declaration

```java
public class PlayerReadyEvent extends PlayerEvent<String> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `playerRef` | `Ref<EntityStore>` | `getPlayerRef()` | Reference to the player's entity store (inherited from PlayerEvent) |
| `player` | `Player` | `getPlayer()` | The player object (inherited from PlayerEvent) |
| `readyId` | `int` | `getReadyId()` | An identifier for this ready state |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPlayerRef` | `@Nonnull public Ref<EntityStore> getPlayerRef()` | Returns the player's entity store reference (inherited) |
| `getPlayer` | `@Nonnull public Player getPlayer()` | Returns the player object (inherited) |
| `getReadyId` | `public int getReadyId()` | Returns the ready identifier |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

> **Tested** - This code has been verified with a working plugin.

Since `PlayerReadyEvent` extends `PlayerEvent<String>` (non-Void key type), you must use `registerGlobal()` to catch all ready events regardless of their key.

```java
// Register a global handler for when players are fully ready
eventBus.registerGlobal(PlayerReadyEvent.class, event -> {
    Player player = event.getPlayer();
    String playerName = player != null ? player.getDisplayName() : "Unknown";
    int readyId = event.getReadyId();

    // Player is now ready to receive gameplay data
    logger.info("Player " + playerName + " is ready (readyId: " + readyId + ")");

    // Initialize player-specific systems that require a ready client
    initializePlayerUI(player);
    sendInitialInventory(player);
});

// Handle different ready states
eventBus.registerGlobal(PlayerReadyEvent.class, event -> {
    int readyId = event.getReadyId();
    Player player = event.getPlayer();

    switch (readyId) {
        case 1:
            // Initial ready state
            handleInitialReady(player);
            break;
        case 2:
            // Subsequent ready (e.g., after world change)
            handleWorldChangeReady(player);
            break;
        default:
            logger.debug("Unknown readyId: " + readyId);
    }
});
```

**Important:**
- Use `player.getDisplayName()` to get the player's name (not `getName()` or `getUsername()`)
- Using `register()` instead of `registerGlobal()` will not work for this event because it has a `String` key type.

## Common Use Cases

- Sending welcome messages after client is ready
- Initializing player UI elements
- Starting client-dependent timers or tasks
- Syncing complex state that requires a loaded client
- Triggering tutorials or first-time player experiences
- Beginning real-time updates that the client can process
- Loading player-specific resources or configurations

## Related Events

- [PlayerConnectEvent](./player-connect-event) - Fired earlier when player first connects
- [PlayerDisconnectEvent](./player-disconnect-event) - Fired when player disconnects
- [AddPlayerToWorldEvent](./add-player-to-world-event) - Fired when player is added to a world

## Event Order

The typical order of player connection events is:

1. **PlayerSetupConnectEvent** - Early validation phase
2. **PlayerConnectEvent** - Player entity created
3. **AddPlayerToWorldEvent** - Player added to a world
4. **PlayerReadyEvent** - Client fully loaded and ready

## Notes

The `readyId` field can be used to differentiate between different types of ready states. For example:
- Initial connection readiness
- Readiness after a world transfer
- Readiness after respawning

This event is ideal for any operations that require the client to be fully initialized and capable of processing server data properly.

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerReadyEvent.java:8`
