---
id: change-game-mode-event
title: ChangeGameModeEvent
sidebar_label: ChangeGameModeEvent
sidebar_position: 5
---

# ChangeGameModeEvent

Fired when a player's game mode is about to change. This event allows plugins to intercept, modify, or prevent game mode changes. While primarily a gameplay event, it is included in the inventory events category because game mode changes often have significant impacts on inventory behavior (e.g., creative mode inventory access).

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.ChangeGameModeEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `com/hypixel/hytale/server/core/event/events/ecs/ChangeGameModeEvent.java:7` |

## Declaration

```java
public class ChangeGameModeEvent extends CancellableEcsEvent {
    @Nonnull
    private GameMode gameMode;

    // Constructor and methods...
}
```

## Fields

| Field | Type | Line | Description |
|-------|------|------|-------------|
| `gameMode` | `GameMode` | 9 | The target game mode (mutable via setter) |

## Methods

| Method | Return Type | Line | Description |
|--------|-------------|------|-------------|
| `getGameMode()` | `@Nonnull GameMode` | 16 | Gets the target game mode |
| `setGameMode(@Nonnull GameMode)` | `void` | 20 | Changes the target game mode |
| `isCancelled()` | `boolean` | - | Returns whether the event has been cancelled (inherited) |
| `setCancelled(boolean)` | `void` | - | Sets the cancelled state of the event (inherited) |

## Usage Example

```java
import com.hypixel.hytale.server.core.event.events.ecs.ChangeGameModeEvent;
import com.hypixel.hytale.event.EventPriority;

public class GameModeListener extends PluginBase {

    @Override
    public void onEnable() {
        getServer().getEventBus().register(
            EventPriority.NORMAL,
            ChangeGameModeEvent.class,
            this::onGameModeChange
        );
    }

    private void onGameModeChange(ChangeGameModeEvent event) {
        GameMode newMode = event.getGameMode();

        getLogger().info("Player changing to game mode: " + newMode);
    }
}
```

### Preventing Game Mode Changes

```java
// Example: Restrict game mode changes in certain contexts
getServer().getEventBus().register(
    EventPriority.FIRST,
    ChangeGameModeEvent.class,
    event -> {
        // Example: Prevent switching to creative mode without permission
        // if (event.getGameMode() == GameMode.CREATIVE) {
        //     if (!hasCreativePermission(player)) {
        //         event.setCancelled(true);
        //         // Send permission denied message
        //     }
        // }
    }
);
```

### Redirecting Game Mode Changes

```java
// Example: Force a different game mode
getServer().getEventBus().register(
    EventPriority.FIRST,
    ChangeGameModeEvent.class,
    event -> {
        // Example: In a specific world, always use adventure mode
        // if (isRestrictedWorld(player)) {
        //     event.setGameMode(GameMode.ADVENTURE);
        // }
    }
);
```

### Logging Game Mode Changes

```java
// Example: Audit log for game mode changes
getServer().getEventBus().register(
    EventPriority.LAST,
    ChangeGameModeEvent.class,
    event -> {
        if (!event.isCancelled()) {
            GameMode mode = event.getGameMode();
            // auditLogger.log("Game mode changed to: " + mode);
        }
    }
);
```

## When This Event Fires

The `ChangeGameModeEvent` fires in the following scenarios:

1. **Command Usage**: When a player or admin uses a game mode command
2. **Plugin Action**: When a plugin programmatically changes a player's game mode
3. **World Rules**: When entering a world with specific game mode rules
4. **Server Configuration**: When server settings dictate game mode changes
5. **Game Mechanics**: When game rules trigger automatic game mode changes

## Cancellation Behavior

When this event is cancelled:

- The player's game mode will **remain unchanged**
- Any inventory changes associated with the mode switch are prevented
- The player will not receive creative inventory access (if switching to creative)
- Flight and other mode-specific abilities will not be granted/revoked
- The player receives no notification of the prevented change

```java
// Example: Minigame mode lock
getServer().getEventBus().register(
    EventPriority.FIRST,
    ChangeGameModeEvent.class,
    event -> {
        // During an active game, lock the game mode
        // if (isInActiveGame(player)) {
        //     event.setCancelled(true);
        //     // player.sendMessage("Cannot change game mode during the game!");
        // }
    }
);
```

## Game Mode Types

While the specific `GameMode` enum values depend on Hytale's implementation, common game modes typically include:

| Mode | Description |
|------|-------------|
| **Survival** | Standard gameplay with health, hunger, and resource gathering |
| **Creative** | Unlimited resources, flight, and building capabilities |
| **Adventure** | Restricted interactions, designed for maps and experiences |
| **Spectator** | Observer mode with no world interaction |

**Note**: Check the Hytale API documentation for the exact `GameMode` enum values available.

## Impact on Inventory

Game mode changes often affect inventory behavior:

### Switching to Creative Mode
- May grant access to a creative inventory panel
- May allow spawning items
- May change item durability behavior

### Switching from Creative Mode
- May clear creative inventory items
- May restore survival inventory
- May affect item restrictions

### Adventure Mode
- May restrict item placement/breaking
- May limit inventory interactions

```java
// Example: Clear creative items when leaving creative mode
getServer().getEventBus().register(
    EventPriority.NORMAL,
    ChangeGameModeEvent.class,
    event -> {
        // If leaving creative mode, handle inventory appropriately
        // GameMode newMode = event.getGameMode();
        // if (newMode != GameMode.CREATIVE && wasCreativeMode(player)) {
        //     // Handle inventory transition
        // }
    }
);
```

## Related Events

- **[DropItemEvent](./drop-item-event)** - May be affected by game mode restrictions
- **[InteractivelyPickupItemEvent](./interactively-pickup-item-event)** - Pickup behavior may vary by mode
- **[CraftRecipeEvent](./craft-recipe-event)** - Crafting may be mode-dependent
- **LivingEntityInventoryChangeEvent** - Inventory changes triggered by mode switches

## Internal Details

### Where the Event is Fired

The `ChangeGameModeEvent` is fired in `Player.java` (line 734) when a player's game mode changes:

```java
// From Player.java:734
GameMode oldGameMode = playerComponent.gameMode;
if (oldGameMode != gameMode) {
   ChangeGameModeEvent event = new ChangeGameModeEvent(gameMode);
   componentAccessor.invoke(playerRef, event);
   if (event.isCancelled()) {
      return;  // Game mode change is blocked
   }

   setGameModeInternal(playerRef, event.getGameMode(), movementManagerComponent, componentAccessor);
   runOnSwitchToGameMode(playerRef, gameMode);
}
```

### Class Hierarchy

```
EcsEvent (abstract)
  └── CancellableEcsEvent (abstract)
       └── ChangeGameModeEvent
```

### GameMode Import

```java
import com.hypixel.hytale.protocol.GameMode;
```

## Testing

> **Tested:** January 17, 2026 - Verified with doc-test plugin

To test this event:
1. Run `/doctest test-change-game-mode-event`
2. Change your game mode using `/gamemode creative`, `/gamemode survival`, `/gamemode adventure`, or `/gamemode spectator`
3. The event should fire and display details in chat

## Source Reference

- **Class**: `com.hypixel.hytale.server.core.event.events.ecs.ChangeGameModeEvent`
- **Source**: `decompiled/com/hypixel/hytale/server/core/event/events/ecs/ChangeGameModeEvent.java`
- **Line**: 7
- **Parent**: `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)

> **Last updated:** January 17, 2026 - Tested and verified. Added internal details from decompiled source.
