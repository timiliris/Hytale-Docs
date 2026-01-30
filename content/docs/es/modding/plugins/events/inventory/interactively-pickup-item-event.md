---
id: interactively-pickup-item-event
title: InteractivelyPickupItemEvent
sidebar_label: InteractivelyPickupItemEvent
sidebar_position: 3
---

# InteractivelyPickupItemEvent

Fired when a player interactively picks up an item from the world. This event allows plugins to modify, replace, or prevent item pickups that occur through direct player interaction (as opposed to automatic collection).

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.InteractivelyPickupItemEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `com/hypixel/hytale/server/core/event/events/ecs/InteractivelyPickupItemEvent.java:7` |

## Declaration

```java
public class InteractivelyPickupItemEvent extends CancellableEcsEvent {
    @Nonnull
    private ItemStack itemStack;

    // Constructor and methods...
}
```

## Fields

| Field | Type | Line | Description |
|-------|------|------|-------------|
| `itemStack` | `ItemStack` | 9 | The item stack being picked up (mutable via setter) |

## Methods

| Method | Return Type | Line | Description |
|--------|-------------|------|-------------|
| `getItemStack()` | `@Nonnull ItemStack` | 16 | Gets the item stack being picked up |
| `setItemStack(@Nonnull ItemStack)` | `void` | 20 | Replaces the item stack (allows modification) |
| `isCancelled()` | `boolean` | - | Returns whether the event has been cancelled |
| `setCancelled(boolean)` | `void` | - | Sets the cancelled state of the event |

## Usage Example

> **Tested** - This code has been verified with a working plugin.

**Important:** ECS events require a dedicated `EntityEventSystem` class registered via `getEntityStoreRegistry().registerSystem()`. They do **not** use the standard `EventBus.register()` method.

### Step 1: Create the EntityEventSystem

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.InteractivelyPickupItemEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class ItemPickupSystem extends EntityEventSystem<EntityStore, InteractivelyPickupItemEvent> {

    public ItemPickupSystem() {
        super(InteractivelyPickupItemEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull InteractivelyPickupItemEvent event
    ) {
        String itemInfo = event.getItemStack() != null ? event.getItemStack().toString() : "Unknown";

        System.out.println("Item picked up: " + itemInfo);

        // Example: Prevent picking up restricted items
        // if (isRestrictedItem(event.getItemStack())) {
        //     event.setCancelled(true);
        // }

        // Example: Modify the picked up item
        // event.setItemStack(modifiedItemStack);
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Step 2: Register the System in Your Plugin

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getEntityStoreRegistry().registerSystem(new ItemPickupSystem());
    }
}
```

## When This Event Fires

The `InteractivelyPickupItemEvent` fires in the following scenarios:

1. **Direct Pickup**: When a player walks over an item entity and collects it
2. **Manual Collection**: When a player explicitly interacts to pick up an item
3. **Magnet Effects**: When items are pulled toward the player by game mechanics
4. **Loot Collection**: When picking up drops from defeated entities
5. **Ground Items**: When collecting items that have been dropped in the world

**Note**: This event specifically covers **interactive** pickups. Programmatic inventory insertions may use different event pathways.

## Cancellation Behavior

When this event is cancelled:

- The item will **not** be added to the player's inventory
- The item entity **remains in the world** at its current position
- The player receives no notification of the failed pickup
- Other players can still attempt to pick up the item

```java
// Example: Item ownership system - only original owner can pick up
getServer().getEventBus().register(
    EventPriority.FIRST,
    InteractivelyPickupItemEvent.class,
    event -> {
        ItemStack item = event.getItemStack();

        // Check if item has owner metadata and player is not owner
        // if (hasOwner(item) && !isOwner(player, item)) {
        //     event.setCancelled(true);
        //     // Optionally send "Not your item" message
        // }
    }
);
```

## Item Modification

The `setItemStack()` method allows you to modify what the player actually receives:

```java
// Example: Random bonus items
getServer().getEventBus().register(
    InteractivelyPickupItemEvent.class,
    event -> {
        ItemStack original = event.getItemStack();

        // 10% chance for bonus
        if (Math.random() < 0.1) {
            // Modify the item or add bonus
            // ItemStack bonus = createBonusItem(original);
            // event.setItemStack(bonus);
        }
    }
);
```

**Important**: When using `setItemStack()`:
- The new `ItemStack` must not be null (marked `@Nonnull`)
- The original item entity is consumed regardless of what you set
- You can change item type, amount, metadata, or any other property

## Related Events

- **[DropItemEvent](./drop-item-event)** - Fires when an item is dropped (opposite action)
- **[SwitchActiveSlotEvent](./switch-active-slot-event)** - Fires when switching hotbar slots
- **LivingEntityInventoryChangeEvent** - Fires on any inventory change
- **[CraftRecipeEvent](./craft-recipe-event)** - Fires when items are created via crafting

## Source Reference

- **Class**: `com.hypixel.hytale.server.core.event.events.ecs.InteractivelyPickupItemEvent`
- **Source**: `decompiled/com/hypixel/hytale/server/core/event/events/ecs/InteractivelyPickupItemEvent.java`
- **Line**: 7
- **Parent**: `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
