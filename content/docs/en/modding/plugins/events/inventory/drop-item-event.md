---
id: drop-item-event
title: DropItemEvent
sidebar_label: DropItemEvent
sidebar_position: 1
---

# DropItemEvent

Fired when an entity drops an item into the world. This event supports both programmatic drops (e.g., items ejected from a container) and player-initiated drop requests from their inventory.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `com/hypixel/hytale/server/core/event/events/ecs/DropItemEvent.java:7` |

## Declaration

```java
public class DropItemEvent extends CancellableEcsEvent {
    // Contains inner classes Drop and PlayerRequest
}
```

## Inherited Methods

From `CancellableEcsEvent`:

| Method | Return Type | Description |
|--------|-------------|-------------|
| `isCancelled()` | `boolean` | Returns whether the event has been cancelled |
| `setCancelled(boolean)` | `void` | Sets the cancelled state of the event |

## Inner Classes

### DropItemEvent.Drop

Represents the actual item drop with the item stack and throw velocity. This inner class is used when an item is physically being dropped into the world.

**Source:** Line 11

| Field | Type | Accessor | Mutator | Description |
|-------|------|----------|---------|-------------|
| `itemStack` | `ItemStack` | `getItemStack()` | `setItemStack(ItemStack)` | The item stack being dropped |
| `throwSpeed` | `float` | `getThrowSpeed()` | `setThrowSpeed(float)` | The velocity at which the item is thrown |

```java
public static final class Drop extends DropItemEvent {
    @Nonnull
    private ItemStack itemStack;
    private float throwSpeed;

    public Drop(@Nonnull ItemStack itemStack, float throwSpeed) {
        this.itemStack = itemStack;
        this.throwSpeed = throwSpeed;
    }

    @Nonnull
    public ItemStack getItemStack() {
        return this.itemStack;
    }

    public void setItemStack(@Nonnull ItemStack itemStack) {
        this.itemStack = itemStack;
    }

    public float getThrowSpeed() {
        return this.throwSpeed;
    }

    public void setThrowSpeed(float throwSpeed) {
        this.throwSpeed = throwSpeed;
    }
}
```

### DropItemEvent.PlayerRequest

Represents a player's request to drop an item from a specific inventory slot. This inner class tracks which inventory section and slot the player is dropping from.

**Source:** Line 39

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `inventorySectionId` | `int` | `getInventorySectionId()` | The ID of the inventory section (e.g., hotbar, main inventory) |
| `slotId` | `short` | `getSlotId()` | The specific slot index within the inventory section |

```java
public static final class PlayerRequest extends DropItemEvent {
    private final int inventorySectionId;
    private final short slotId;

    public PlayerRequest(int inventorySectionId, short slotId) {
        this.inventorySectionId = inventorySectionId;
        this.slotId = slotId;
    }

    public int getInventorySectionId() {
        return this.inventorySectionId;
    }

    public short getSlotId() {
        return this.slotId;
    }
}
```

## Usage Example

```java
import com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent;
import com.hypixel.hytale.event.EventPriority;

public class ItemDropListener extends PluginBase {

    @Override
    public void onEnable() {
        // Register to handle item drop events
        getServer().getEventBus().register(
            EventPriority.NORMAL,
            DropItemEvent.class,
            this::onItemDrop
        );
    }

    private void onItemDrop(DropItemEvent event) {
        // Check if this is a player-initiated drop
        // The event context determines if Drop or PlayerRequest data is available

        if (event.isCancelled()) {
            return;
        }

        // Example: Prevent dropping items in certain areas
        // (You would need to get entity position from ECS context)

        // Cancel the drop if needed
        // event.setCancelled(true);
    }
}
```

### Handling Drop Inner Class

```java
// When working with the Drop inner class
DropItemEvent.Drop dropInfo = new DropItemEvent.Drop(itemStack, 0.5f);

// Access drop properties
ItemStack dropped = dropInfo.getItemStack();
float velocity = dropInfo.getThrowSpeed();

getLogger().info("Dropping " + dropped.getAmount() + " items with velocity " + velocity);
```

### Handling PlayerRequest Inner Class

```java
// When working with the PlayerRequest inner class
DropItemEvent.PlayerRequest request = new DropItemEvent.PlayerRequest(0, (short) 5);

// Access request properties
int section = request.getInventorySectionId();
short slot = request.getSlotId();

getLogger().info("Player dropping from section " + section + ", slot " + slot);
```

## When This Event Fires

The `DropItemEvent` fires in the following scenarios:

1. **Player Drop Request**: When a player presses the drop key (typically Q) to drop an item from their inventory
2. **Inventory Overflow**: When items cannot fit in an inventory and are ejected into the world
3. **Container Breaking**: When a container block is broken and its contents are dropped
4. **Entity Death**: When an entity dies and drops its inventory contents
5. **Programmatic Drops**: When game logic or scripts initiate an item drop

## Cancellation Behavior

When this event is cancelled:

- The item will **not** be dropped into the world
- For player-initiated drops, the item remains in the player's inventory
- For programmatic drops, the calling code should handle the cancellation appropriately
- No item entity will be spawned in the world

```java
// Example: Prevent dropping rare items
getServer().getEventBus().register(
    EventPriority.FIRST,
    DropItemEvent.class,
    event -> {
        // Access drop information through ECS context
        // If the item is a rare/valuable item, prevent dropping

        // event.setCancelled(true);
        // Optionally notify the player
    }
);
```

## Related Events

- **[InteractivelyPickupItemEvent](./interactively-pickup-item-event.md)** - Fires when a player picks up an item from the world
- **[SwitchActiveSlotEvent](./switch-active-slot-event.md)** - Fires when switching the active hotbar slot
- **[CraftRecipeEvent](./craft-recipe-event.md)** - Fires when crafting items
- **LivingEntityInventoryChangeEvent** - Fires when any inventory change occurs

## Source Reference

- **Class**: `com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent`
- **Source**: `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DropItemEvent.java`
- **Line**: 7
- **Parent**: `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
