---
id: player-mouse-motion-event
title: PlayerMouseMotionEvent
sidebar_label: PlayerMouseMotionEvent
---

# PlayerMouseMotionEvent

Fired when a player moves their mouse. This is a cancellable event that provides information about mouse movement, including the current screen position and any blocks or entities under the cursor.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerMouseMotionEvent` |
| **Parent Class** | `PlayerEvent<Void>` |
| **Cancellable** | Yes |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerMouseMotionEvent.java:14` |

## Declaration

```java
public class PlayerMouseMotionEvent extends PlayerEvent<Void> implements ICancellable {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `player` | `Player` | `getPlayer()` | The player object (inherited from PlayerEvent) |
| `clientUseTime` | `long` | `getClientUseTime()` | Client-side timestamp of the motion event |
| `itemInHand` | `Item` | `getItemInHand()` | The item the player is holding |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | The block position under the cursor (if any) |
| `targetEntity` | `Entity` | `getTargetEntity()` | The entity under the cursor (if any) |
| `screenPoint` | `Vector2f` | `getScreenPoint()` | The screen coordinates of the mouse |
| `mouseMotion` | `MouseMotionEvent` | `getMouseMotion()` | The mouse motion event details |
| `cancelled` | `boolean` | `isCancelled()` | Whether the event has been cancelled |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPlayer` | `public Player getPlayer()` | Returns the player object (inherited) |
| `getClientUseTime` | `public long getClientUseTime()` | Returns the client timestamp |
| `getItemInHand` | `public Item getItemInHand()` | Returns the item being held |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Returns the block position under cursor |
| `getTargetEntity` | `public Entity getTargetEntity()` | Returns the entity under cursor |
| `getScreenPoint` | `public Vector2f getScreenPoint()` | Returns the screen coordinates |
| `getMouseMotion` | `public MouseMotionEvent getMouseMotion()` | Returns the mouse motion event |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event is cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Cancels or uncancels the event |

## Usage Example

```java
// Register a handler for mouse motion events
eventBus.register(PlayerMouseMotionEvent.class, event -> {
    Player player = event.getPlayer();
    Vector2f screenPos = event.getScreenPoint();

    // Track mouse position for UI
    updatePlayerCursorPosition(player, screenPos);

    // Highlight block under cursor
    Vector3i targetBlock = event.getTargetBlock();
    if (targetBlock != null) {
        highlightBlock(player, targetBlock);
    }

    // Show entity tooltip when hovering
    Entity targetEntity = event.getTargetEntity();
    if (targetEntity != null) {
        showEntityTooltip(player, targetEntity);
    }
});

// Implement hover effects
eventBus.register(PlayerMouseMotionEvent.class, event -> {
    Entity hoveredEntity = event.getTargetEntity();
    Player player = event.getPlayer();

    // Clear previous hover state
    clearHoverState(player);

    if (hoveredEntity != null) {
        // Apply hover outline effect
        applyHoverOutline(player, hoveredEntity);

        // Show interaction prompt
        if (hoveredEntity instanceof NPC) {
            showInteractionPrompt(player, "Press E to talk");
        }
    }
});

// Block selection preview system
eventBus.register(PlayerMouseMotionEvent.class, event -> {
    Item item = event.getItemInHand();
    Vector3i targetBlock = event.getTargetBlock();

    if (item != null && item.getType().equals("custom:building_tool") && targetBlock != null) {
        // Show placement preview
        showPlacementPreview(event.getPlayer(), targetBlock, item);
    }
});
```

## Common Use Cases

- Block highlighting and selection preview
- Entity hover effects and tooltips
- Custom cursor systems
- Aim assistance or targeting systems
- Building tool previews
- UI hover state management
- Look-at detection for tutorials or quests

## Related Events

- [PlayerMouseButtonEvent](./player-mouse-button-event.md) - For mouse click events
- [PlayerInteractEvent](./player-interact-event.md) - Deprecated interaction event

## Notes

The `MouseMotionEvent` object contains detailed information about the mouse movement including:
- Delta movement since the last event
- Current position
- Movement velocity

Be mindful of performance when handling this event, as it can fire very frequently during normal gameplay. Consider:
- Throttling updates to reduce processing overhead
- Using efficient data structures for hover state tracking
- Avoiding heavy computations in the event handler

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerMouseMotionEvent.java:14`
