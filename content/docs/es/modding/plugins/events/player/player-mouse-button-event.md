---
id: player-mouse-button-event
title: PlayerMouseButtonEvent
sidebar_label: PlayerMouseButtonEvent
---

# PlayerMouseButtonEvent

> **Note:** This event only fires when the mouse cursor is visible (e.g., in top-down camera mode with `displayCursor = true`). It does not fire in standard first/third-person modes.

Fired when a player presses or releases a mouse button. This is a cancellable event that provides detailed information about mouse input, including the button pressed, screen position, and any targeted blocks or entities.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerMouseButtonEvent` |
| **Parent Class** | `PlayerEvent<Void>` |
| **Cancellable** | Yes |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerMouseButtonEvent.java:15` |

## Declaration

```java
public class PlayerMouseButtonEvent extends PlayerEvent<Void> implements ICancellable {
   @Nonnull
   private final PlayerRef playerRef;
   private final long clientUseTime;
   private final Item itemInHand;
   private final Vector3i targetBlock;
   private final Entity targetEntity;
   private final Vector2f screenPoint;
   private final MouseButtonEvent mouseButton;
   private boolean cancelled;
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `playerRef` | `Ref<EntityStore>` | `getPlayerRef()` | Reference to the player's entity store (inherited from PlayerEvent) |
| `player` | `Player` | `getPlayer()` | The player object (inherited from PlayerEvent) |
| `playerRef` | `PlayerRef` | `getPlayerRefComponent()` | Player reference component |
| `clientUseTime` | `long` | `getClientUseTime()` | Client-side timestamp of the mouse event |
| `itemInHand` | `Item` | `getItemInHand()` | The item the player is holding |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | The block position being targeted (if any) |
| `targetEntity` | `Entity` | `getTargetEntity()` | The entity being targeted (if any) |
| `screenPoint` | `Vector2f` | `getScreenPoint()` | The screen coordinates of the mouse |
| `mouseButton` | `MouseButtonEvent` | `getMouseButton()` | The mouse button event details |
| `cancelled` | `boolean` | `isCancelled()` | Whether the event has been cancelled |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPlayerRef` | `@Nonnull public Ref<EntityStore> getPlayerRef()` | Returns the player's entity store reference (inherited) |
| `getPlayer` | `@Nonnull public Player getPlayer()` | Returns the player object (inherited) |
| `getPlayerRefComponent` | `@Nonnull public PlayerRef getPlayerRefComponent()` | Returns the PlayerRef component |
| `getClientUseTime` | `public long getClientUseTime()` | Returns the client timestamp |
| `getItemInHand` | `public Item getItemInHand()` | Returns the item being held |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Returns the targeted block position |
| `getTargetEntity` | `public Entity getTargetEntity()` | Returns the targeted entity |
| `getScreenPoint` | `public Vector2f getScreenPoint()` | Returns the screen coordinates |
| `getMouseButton` | `public MouseButtonEvent getMouseButton()` | Returns the mouse button event |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event is cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Cancels or uncancels the event |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

```java
// Register a handler for mouse button events
eventBus.register(PlayerMouseButtonEvent.class, event -> {
    Player player = event.getPlayer();
    MouseButtonEvent mouseEvent = event.getMouseButton();

    // Check which button was pressed
    if (mouseEvent.isLeftButton() && mouseEvent.isPressed()) {
        // Left click pressed
        handleLeftClick(player, event);
    } else if (mouseEvent.isRightButton() && mouseEvent.isPressed()) {
        // Right click pressed
        handleRightClick(player, event);
    }

    // Check if targeting a block
    Vector3i targetBlock = event.getTargetBlock();
    if (targetBlock != null) {
        // Block interaction
        if (isProtectedArea(targetBlock)) {
            event.setCancelled(true);
            player.sendMessage("You cannot interact with blocks here!");
            return;
        }
    }

    // Check if targeting an entity
    Entity targetEntity = event.getTargetEntity();
    if (targetEntity != null) {
        // Entity interaction
        handleEntityClick(player, targetEntity, mouseEvent);
    }
});

// Track screen position for UI interactions
eventBus.register(PlayerMouseButtonEvent.class, event -> {
    Vector2f screenPos = event.getScreenPoint();
    // Check if click is within a custom UI region
    if (isInCustomUIRegion(screenPos)) {
        handleUIClick(event.getPlayer(), screenPos);
        event.setCancelled(true);
    }
});

// Item-specific click behaviors
eventBus.register(PlayerMouseButtonEvent.class, event -> {
    Item item = event.getItemInHand();
    if (item != null && item.getType().equals("custom:magic_wand")) {
        // Custom magic wand behavior
        castSpell(event.getPlayer(), event.getTargetBlock(), event.getTargetEntity());
        event.setCancelled(true);
    }
});
```

## Common Use Cases

- Custom weapon or tool behaviors
- Click-based ability systems
- Region protection (preventing clicks in certain areas)
- Custom UI interaction systems
- NPC and shop interactions
- Building permission systems
- Combat modifications

## Related Events

- [PlayerMouseMotionEvent](./player-mouse-motion-event) - For tracking mouse movement
- [PlayerInteractEvent](./player-interact-event) - Deprecated interaction event
- [BreakBlockEvent](../ecs/break-block-event) - Specifically for block breaking
- [PlaceBlockEvent](../ecs/place-block-event) - Specifically for block placement

## Notes

The `MouseButtonEvent` object contains detailed information about the mouse input including:
- Which button was pressed (left, right, middle, etc.)
- Whether the button was pressed or released
- Any modifier keys held during the click

The `screenPoint` field provides the screen coordinates where the click occurred, useful for custom UI systems.

## Testing Results

> **Tested:** January 23, 2026 - Community verified ([#25](https://github.com/timiliris/Hytale-Docs/issues/25))

**Status: FUNCTIONAL** (when cursor is visible)

> **Important:** This event only fires when the mouse cursor is visible on screen. This typically occurs when using a custom camera mode with `displayCursor = true` (e.g., top-down view). In standard first-person or third-person modes where the cursor is hidden, this event will **not** fire.

This event has been confirmed working by the community. Here is a working example using a top-down camera view:

```java
getEventRegistry().registerGlobal(PlayerMouseButtonEvent.class, event -> {
    MouseButtonEvent mouseEvent = event.getMouseButton();

    if (mouseEvent.mouseButtonType != MouseButtonType.Left || mouseEvent.state != MouseButtonState.Pressed) {
        return;
    }

    Player player = event.getPlayer();
    Vector3i blockPos = event.getTargetBlock();

    player.sendMessage(Message.raw("Click detected at: " + blockPos.toString()));
});
```

## Related Events

For more specific use cases, you may also want to consider:
- **[DamageBlockEvent](../block/damage-block-event)** - Fires when holding left-click on a block
- **[BreakBlockEvent](../block/break-block-event)** - Fires when a block is broken
- **[PlaceBlockEvent](../block/place-block-event)** - Fires when placing a block
- **[UseBlockPreEvent / UseBlockPostEvent](../block/use-block-pre-event)** - For block interactions (right-click)

## Internal Details

### Event Dispatch Location

**File:** `InteractionModule.java:866-886`

The event would be dispatched when receiving a `MouseInteraction` packet with non-null `mouseButton` field.

### MouseButtonEvent Structure

```java
public class MouseButtonEvent {
    public MouseButtonType mouseButtonType;  // Left, Middle, Right, X1, X2
    public MouseButtonState state;           // Pressed, Released
    public byte clicks;                      // Number of clicks
}
```

### Class Hierarchy

```
PlayerMouseButtonEvent
├── extends: PlayerEvent<Void>
│   └── extends: IEvent<Void>
└── implements: ICancellable
```

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerMouseButtonEvent.java:15`

---

> **Last updated:** January 23, 2026 - Event confirmed functional by community testing ([#25](https://github.com/timiliris/Hytale-Docs/issues/25)).
