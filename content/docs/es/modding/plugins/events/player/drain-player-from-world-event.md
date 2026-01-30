---
id: drain-player-from-world-event
title: DrainPlayerFromWorldEvent
sidebar_label: DrainPlayerFromWorldEvent
---

# DrainPlayerFromWorldEvent

:::warning Important - Trigger Conditions (Verified)
This event is **ONLY** triggered when a world is **REMOVED/STOPPED** and players are "drained" to the default world. Regular teleportation between worlds using the `Teleport` component does **NOT** trigger this event.
:::

Fired when a player is being forcibly removed from a world because the world is being shut down. This event allows plugins to modify the player's destination world and transform (position/rotation) when they are drained to another world.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.DrainPlayerFromWorldEvent` |
| **Parent Class** | `IEvent<String>` |
| **Cancellable** | No |
| **Async** | No |
| **Verified** | ✅ Yes - Tested with doc-test plugin |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/DrainPlayerFromWorldEvent.java:10` |

## Declaration

```java
public class DrainPlayerFromWorldEvent implements IEvent<String> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `holder` | `Holder<EntityStore>` | `getHolder()` | The entity holder containing the player's entity store |
| `world` | `World` | `getWorld()` | The world the player is being removed from |
| `transform` | `Transform` | `getTransform()` | The player's transform (position/rotation) for the destination |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getHolder` | `public Holder<EntityStore> getHolder()` | Returns the entity holder for the player |
| `getWorld` | `public World getWorld()` | Returns the current world (being left) |
| `getTransform` | `public Transform getTransform()` | Returns the destination transform |
| `setWorld` | `public void setWorld(World world)` | Sets the destination world |
| `setTransform` | `public void setTransform(Transform transform)` | Sets the destination transform |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

```java
// Register a handler for when players leave worlds
eventBus.register(DrainPlayerFromWorldEvent.class, event -> {
    World currentWorld = event.getWorld();
    Holder<EntityStore> holder = event.getHolder();

    // Log world exit
    logger.info("Player leaving world: " + currentWorld.getName());

    // Save world-specific data before leaving
    saveWorldProgress(holder, currentWorld);
});

// Redirect players to specific spawn points
eventBus.register(DrainPlayerFromWorldEvent.class, event -> {
    World currentWorld = event.getWorld();

    // Check if leaving a dungeon
    if (isDungeonWorld(currentWorld)) {
        // Send player back to the hub
        World hubWorld = getHubWorld();
        Transform hubSpawn = getHubSpawnPoint();

        event.setWorld(hubWorld);
        event.setTransform(hubSpawn);
    }
});

// Handle minigame exits
eventBus.register(DrainPlayerFromWorldEvent.class, event -> {
    World currentWorld = event.getWorld();
    Holder<EntityStore> holder = event.getHolder();

    if (isMinigameWorld(currentWorld)) {
        // Record minigame statistics
        recordMinigameStats(holder, currentWorld);

        // Return player to lobby
        World lobbyWorld = getMinigameLobby();
        Transform lobbySpawn = getLobbySpawnForPlayer(holder);

        event.setWorld(lobbyWorld);
        event.setTransform(lobbySpawn);
    }
});

// Custom world transfer logic
eventBus.register(DrainPlayerFromWorldEvent.class, event -> {
    Holder<EntityStore> holder = event.getHolder();
    Transform currentTransform = event.getTransform();

    // Check if player has a saved location in the destination world
    World destinationWorld = getPlayerSavedWorld(holder);
    if (destinationWorld != null) {
        Transform savedPosition = getPlayerSavedPosition(holder, destinationWorld);
        if (savedPosition != null) {
            event.setWorld(destinationWorld);
            event.setTransform(savedPosition);
        }
    }
});

// Cleanup and resource management
eventBus.register(EventPriority.LATE, DrainPlayerFromWorldEvent.class, event -> {
    World world = event.getWorld();
    Holder<EntityStore> holder = event.getHolder();

    // Remove player from world-specific systems
    removeFromWorldParty(holder, world);
    removeFromWorldTeam(holder, world);
    cleanupWorldResources(holder, world);

    // Update world population tracking
    decrementWorldPopulation(world);
});
```

## Common Use Cases

- **Emergency data saving** when a world is being shut down
- **Redirecting players** to a specific world/location when their world is removed
- **Handling minigame world cleanup** when the minigame ends and the world is destroyed
- **Instance-based dungeons** where the dungeon world is removed after completion
- **Server maintenance** - saving player data when worlds are being stopped
- **Resource cleanup** - removing world-specific data tied to the removed world

## Related Events

- [AddPlayerToWorldEvent](./add-player-to-world-event) - Fired when player is added to a world
- [PlayerDisconnectEvent](./player-disconnect-event) - Fired when player disconnects
- [RemoveWorldEvent](../world/remove-world-event) - Fired when a world is removed

## When This Event is Triggered

:::info Verified Behavior
This event is **ONLY** triggered in the following scenario:
:::

**When a world is removed/stopped:**

1. **World removal initiated** via `Universe.get().removeWorld(worldName)`
2. **World.drainPlayersTo()** is called internally
3. **DrainPlayerFromWorldEvent** - Fired for each player being drained
4. **AddPlayerToWorldEvent** - Player added to the default world

## When This Event is NOT Triggered

- Regular teleportation between worlds (using `Teleport` component)
- Player disconnect/reconnect
- `/warp` or similar teleport commands

For regular world transfers, only `AddPlayerToWorldEvent` is triggered when the player enters the new world.

## How to Test This Event

To trigger `DrainPlayerFromWorldEvent` for testing:

1. Create a secondary (non-default) world
2. Teleport a player to that world
3. Remove the world using `Universe.get().removeWorld(worldName)`
4. The player will be "drained" to the default world and this event fires

```java
// Example: Trigger DrainPlayerFromWorldEvent by removing a world
World worldToRemove = Universe.get().getWorld("my-temp-world");
if (worldToRemove != null) {
    boolean removed = Universe.get().removeWorld("my-temp-world");
    // DrainPlayerFromWorldEvent fires for each player in that world
}
```

## Notes

This event cannot be cancelled, but you can control where the player goes by using `setWorld()` and `setTransform()`. The destination can be:
- Another world in the server (if not the one being removed)
- A specific position within the destination world
- A spawn point based on custom logic

The `transform` includes both position and rotation data, allowing you to control exactly where and how the player appears in their destination.

This event is specifically designed for world shutdown scenarios, allowing plugins to save data and redirect players appropriately when a world is being removed from the server.

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/DrainPlayerFromWorldEvent.java:10`
