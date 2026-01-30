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

> **Tested** - This code has been verified with a working plugin.

**Important:** ECS events require dedicated `EntityEventSystem` classes registered via `getEntityStoreRegistry().registerSystem()`. They do **not** use the standard `EventBus.register()` method.

### Step 1: Create EntityEventSystem for DropItemEvent.Drop

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class DropItemDropSystem extends EntityEventSystem<EntityStore, DropItemEvent.Drop> {

    public DropItemDropSystem() {
        super(DropItemEvent.Drop.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull DropItemEvent.Drop event
    ) {
        String itemInfo = event.getItemStack() != null ? event.getItemStack().toString() : "Unknown";
        float throwSpeed = event.getThrowSpeed();

        System.out.println("Item dropped: " + itemInfo + " (speed: " + throwSpeed + ")");

        // Example: Prevent dropping valuable items
        // if (isValuableItem(event.getItemStack())) {
        //     event.setCancelled(true);
        // }
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Step 2: Create EntityEventSystem for DropItemEvent.PlayerRequest

```java
public class DropItemRequestSystem extends EntityEventSystem<EntityStore, DropItemEvent.PlayerRequest> {

    public DropItemRequestSystem() {
        super(DropItemEvent.PlayerRequest.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull DropItemEvent.PlayerRequest event
    ) {
        int sectionId = event.getInventorySectionId();
        short slotId = event.getSlotId();

        System.out.println("Player drop request: section=" + sectionId + ", slot=" + slotId);
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Step 3: Register Systems in Your Plugin

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getEntityStoreRegistry().registerSystem(new DropItemDropSystem());
        getEntityStoreRegistry().registerSystem(new DropItemRequestSystem());
    }
}
```

## When This Event Fires

The `DropItemEvent` fires in the following scenarios:

1. **Player Drop Request**: When a player presses the drop key (typically Q) to drop an item from their inventory
2. **Inventory Overflow**: When items cannot fit in an inventory and are ejected into the world
3. **Container Breaking**: When a container block is broken and its contents are dropped
4. **Programmatic Drops**: When game logic or scripts initiate an item drop

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

- **[InteractivelyPickupItemEvent](./interactively-pickup-item-event)** - Fires when a player picks up an item from the world
- **[SwitchActiveSlotEvent](./switch-active-slot-event)** - Fires when switching the active hotbar slot
- **[CraftRecipeEvent](./craft-recipe-event)** - Fires when crafting items
- **LivingEntityInventoryChangeEvent** - Fires when any inventory change occurs

## Source Reference

- **Class**: `com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent`
- **Source**: `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DropItemEvent.java`
- **Line**: 7
- **Parent**: `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
