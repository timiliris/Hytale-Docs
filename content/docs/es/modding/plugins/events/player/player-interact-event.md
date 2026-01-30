---
id: player-interact-event
title: PlayerInteractEvent
sidebar_label: PlayerInteractEvent
---

# PlayerInteractEvent

:::danger Non-Functional Event
**This event is deprecated AND never fired by the server.** The event class exists but nothing in the server code creates or dispatches it. All interaction handling has been moved to [PlayerMouseButtonEvent](./player-mouse-button-event).

Do not use this event in new plugins - it will never trigger.
:::

~~Fired when a player interacts with the world (blocks, entities, or items).~~ This event is no longer functional.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerInteractEvent` |
| **Parent Class** | `PlayerEvent<String>` |
| **Cancellable** | Yes |
| **Async** | No |
| **Deprecated** | Yes |
| **Status** | **Non-Functional** - Never fired by the server |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerInteractEvent.java:14` |

## Declaration

```java
@Deprecated
public class PlayerInteractEvent extends PlayerEvent<String> implements ICancellable {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `playerRef` | `Ref<EntityStore>` | `getPlayerRef()` | Reference to the player's entity store (inherited from PlayerEvent) |
| `player` | `Player` | `getPlayer()` | The player object (inherited from PlayerEvent) |
| `actionType` | `InteractionType` | `getActionType()` | The type of interaction being performed |
| `clientUseTime` | `long` | `getClientUseTime()` | Client-side timestamp of the interaction |
| `itemInHand` | `ItemStack` | `getItemInHand()` | The item the player is holding |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | The block position being targeted (if any) |
| `targetRef` | `Ref<EntityStore>` | `getTargetRef()` | Reference to the target entity's store (if any) |
| `targetEntity` | `Entity` | `getTargetEntity()` | The entity being targeted (if any) |
| `cancelled` | `boolean` | `isCancelled()` | Whether the interaction has been cancelled |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPlayerRef` | `public Ref<EntityStore> getPlayerRef()` | Returns the player's entity store reference (inherited) |
| `getPlayer` | `public Player getPlayer()` | Returns the player object (inherited) |
| `getActionType` | `public InteractionType getActionType()` | Returns the type of interaction |
| `getClientUseTime` | `public long getClientUseTime()` | Returns the client timestamp |
| `getItemInHand` | `public ItemStack getItemInHand()` | Returns the item being held |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Returns the targeted block position |
| `getTargetRef` | `public Ref<EntityStore> getTargetRef()` | Returns the target entity reference |
| `getTargetEntity` | `public Entity getTargetEntity()` | Returns the targeted entity |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event is cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Cancels or uncancels the event |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

```java
// Register a handler for player interactions
eventBus.register(PlayerInteractEvent.class, event -> {
    Player player = event.getPlayer();
    InteractionType action = event.getActionType();

    // Check if targeting a block
    Vector3i targetBlock = event.getTargetBlock();
    if (targetBlock != null) {
        // Handle block interaction
        logger.info(player.getName() + " interacted with block at " + targetBlock);

        // Prevent interaction in protected areas
        if (isProtectedArea(targetBlock)) {
            event.setCancelled(true);
            player.sendMessage("You cannot interact here!");
            return;
        }
    }

    // Check if targeting an entity
    Entity targetEntity = event.getTargetEntity();
    if (targetEntity != null) {
        // Handle entity interaction
        logger.info(player.getName() + " interacted with entity: " + targetEntity);
    }

    // Check the item being used
    ItemStack item = event.getItemInHand();
    if (item != null) {
        // Custom item interactions
        handleCustomItemUse(player, item, action);
    }
});
```

## Common Use Cases

- Protecting regions from player interactions
- Custom item behaviors on use
- Entity interaction systems (NPCs, shops)
- Block interaction logging
- Custom crafting station interactions
- Permission-based interaction restrictions

## Related Events

- [PlayerMouseButtonEvent](./player-mouse-button-event) - Modern replacement for mouse-based interactions
- [PlayerMouseMotionEvent](./player-mouse-motion-event) - For tracking mouse movement
- [BreakBlockEvent](../ecs/break-block-event) - Specifically for block breaking
- [PlaceBlockEvent](../ecs/place-block-event) - Specifically for block placement
- [UseBlockEvent](../ecs/use-block-event) - For block usage interactions

## Migration Notice

:::tip Required Migration
This event is **non-functional** - you must migrate to [PlayerMouseButtonEvent](./player-mouse-button-event) immediately. The `PlayerMouseButtonEvent` is created in `InteractionModule.java:872` and provides mouse button information including button type, state, and click count.
:::

## Testing Results

> **Tested:** January 17, 2026 - Verified with doc-test plugin

**Test Result: Event does NOT fire**

- Test command: `/doctest test-player-interact-event`
- Actions tested: Right-click on blocks, right-click on entities
- Result: No event detected

**Analysis of decompiled code:**
- `PlayerMouseButtonEvent` is created at `InteractionModule.java:872`
- `PlayerMouseMotionEvent` is created at `InteractionModule.java:893`
- `PlayerInteractEvent` is **never instantiated** anywhere in the codebase
- Existing listeners (BlockEventView, EntityEventView, CameraDemo) are dead code

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerInteractEvent.java:14`
