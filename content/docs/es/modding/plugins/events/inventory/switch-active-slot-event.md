---
id: switch-active-slot-event
title: SwitchActiveSlotEvent
sidebar_label: SwitchActiveSlotEvent
sidebar_position: 2
---

# SwitchActiveSlotEvent

Fired when a player switches their active hotbar slot. This event can be triggered by either client input (scrolling, number keys) or server-side logic, and provides information about both the previous and new slot positions.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.SwitchActiveSlotEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `com/hypixel/hytale/server/core/event/events/ecs/SwitchActiveSlotEvent.java:5` |

## Declaration

```java
public class SwitchActiveSlotEvent extends CancellableEcsEvent {
    private final int previousSlot;
    private final int inventorySectionId;
    private byte newSlot;
    private final boolean serverRequest;

    // Constructor and methods...
}
```

## Fields

| Field | Type | Line | Description |
|-------|------|------|-------------|
| `previousSlot` | `int` | 6 | The slot index that was previously active |
| `inventorySectionId` | `int` | 7 | The ID of the inventory section (typically the hotbar) |
| `newSlot` | `byte` | 8 | The slot index being switched to (mutable) |
| `serverRequest` | `boolean` | 9 | Whether this switch was initiated by the server |

## Methods

| Method | Return Type | Line | Description |
|--------|-------------|------|-------------|
| `getPreviousSlot()` | `int` | 18 | Gets the previously active slot index |
| `getInventorySectionId()` | `int` | 38 | Gets the inventory section identifier |
| `getNewSlot()` | `byte` | 22 | Gets the target slot index |
| `setNewSlot(byte)` | `void` | 26 | Changes the target slot (allows redirection) |
| `isServerRequest()` | `boolean` | 30 | Returns `true` if server-initiated |
| `isClientRequest()` | `boolean` | 34 | Returns `true` if client-initiated |
| `isCancelled()` | `boolean` | - | Returns whether the event has been cancelled (inherited) |
| `setCancelled(boolean)` | `void` | - | Sets the cancelled state of the event (inherited) |

## Usage Example

```java
import com.hypixel.hytale.server.core.event.events.ecs.SwitchActiveSlotEvent;
import com.hypixel.hytale.event.EventPriority;

public class HotbarListener extends PluginBase {

    @Override
    public void onEnable() {
        getServer().getEventBus().register(
            EventPriority.NORMAL,
            SwitchActiveSlotEvent.class,
            this::onSlotSwitch
        );
    }

    private void onSlotSwitch(SwitchActiveSlotEvent event) {
        int previousSlot = event.getPreviousSlot();
        byte newSlot = event.getNewSlot();

        // Distinguish between client and server requests
        if (event.isClientRequest()) {
            getLogger().info("Player switched from slot " + previousSlot + " to slot " + newSlot);
        } else {
            getLogger().info("Server switched slot from " + previousSlot + " to slot " + newSlot);
        }
    }
}
```

### Redirecting Slot Selection

```java
// Example: Force player to a specific slot
getServer().getEventBus().register(
    EventPriority.FIRST,
    SwitchActiveSlotEvent.class,
    event -> {
        // If player tries to switch to slot 8, redirect to slot 0
        if (event.getNewSlot() == 8) {
            event.setNewSlot((byte) 0);
            getLogger().info("Redirected slot selection from 8 to 0");
        }
    }
);
```

### Preventing Slot Changes

```java
// Example: Lock hotbar during certain game states
getServer().getEventBus().register(
    EventPriority.FIRST,
    SwitchActiveSlotEvent.class,
    event -> {
        // Only affect client requests
        if (event.isClientRequest()) {
            // Check if player should be locked
            // if (isPlayerLocked(player)) {
            //     event.setCancelled(true);
            // }
        }
    }
);
```

## When This Event Fires

The `SwitchActiveSlotEvent` fires in the following scenarios:

1. **Mouse Scroll**: When the player scrolls their mouse wheel to change hotbar slots
2. **Number Key Press**: When the player presses 1-9 to directly select a hotbar slot
3. **Server Commands**: When server-side code programmatically changes the active slot
4. **Game Mechanics**: When game rules or abilities force a slot change
5. **Equipment Systems**: When automatic equipping logic selects a new slot

## Cancellation Behavior

When this event is cancelled:

- The active slot will **remain unchanged** at the previous slot position
- For client requests, the client's view will be corrected to match the server state
- For server requests, the calling code should handle the cancellation
- Any dependent mechanics (item use, abilities) will continue using the original slot

```java
// Example: Prevent slot switching during combat
getServer().getEventBus().register(
    EventPriority.FIRST,
    SwitchActiveSlotEvent.class,
    event -> {
        // Only restrict client-initiated switches
        if (!event.isClientRequest()) {
            return;
        }

        // Example combat check
        // if (isInCombat(player)) {
        //     event.setCancelled(true);
        //     // Optionally send message to player
        // }
    }
);
```

## Server vs Client Requests

Understanding the distinction between server and client requests is important:

### Client Requests (`isClientRequest() == true`)
- Triggered by player input (scroll wheel, number keys)
- Can be cancelled to prevent player from changing slots
- May need validation to prevent exploits

### Server Requests (`isServerRequest() == true`)
- Triggered by server-side game logic
- Usually should not be cancelled (may break game mechanics)
- Used for forced equipment changes, ability activations, etc.

```java
// Example: Only validate client requests
getServer().getEventBus().register(
    SwitchActiveSlotEvent.class,
    event -> {
        if (event.isServerRequest()) {
            // Trust server-initiated changes
            return;
        }

        // Validate client request
        byte requestedSlot = event.getNewSlot();
        if (requestedSlot < 0 || requestedSlot > 8) {
            event.setCancelled(true);
        }
    }
);
```

## Related Events

- **[DropItemEvent](./drop-item-event)** - Fires when an item is dropped from inventory
- **[InteractivelyPickupItemEvent](./interactively-pickup-item-event)** - Fires when picking up items
- **LivingEntityInventoryChangeEvent** - Fires on any inventory change
- **PlayerMouseButtonEvent** - Fires when using items from the active slot

## Source Reference

- **Class**: `com.hypixel.hytale.server.core.event.events.ecs.SwitchActiveSlotEvent`
- **Source**: `decompiled/com/hypixel/hytale/server/core/event/events/ecs/SwitchActiveSlotEvent.java`
- **Line**: 5
- **Parent**: `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
