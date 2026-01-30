---
id: craft-recipe-event
title: CraftRecipeEvent
sidebar_label: CraftRecipeEvent
sidebar_position: 4
---

# CraftRecipeEvent

An abstract base class for crafting-related events. This event fires when a player crafts items using a recipe, and provides access to the recipe being used and the quantity being crafted. It has two concrete implementations: `Pre` (before crafting) and `Post` (after crafting).

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.CraftRecipeEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Abstract** | Yes |
| **Source File** | `com/hypixel/hytale/server/core/event/events/ecs/CraftRecipeEvent.java:7` |

## Declaration

```java
public abstract class CraftRecipeEvent extends CancellableEcsEvent {
    @Nonnull
    private final CraftingRecipe craftedRecipe;
    private final int quantity;

    // Constructor and methods...
}
```

## Fields

| Field | Type | Line | Description |
|-------|------|------|-------------|
| `craftedRecipe` | `CraftingRecipe` | 9 | The recipe being crafted |
| `quantity` | `int` | 10 | The number of times the recipe is being crafted |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getCraftedRecipe()` | `@Nonnull CraftingRecipe` | Gets the recipe being executed |
| `getQuantity()` | `int` | Gets the craft quantity (batch size) |
| `isCancelled()` | `boolean` | Returns whether the event has been cancelled |
| `setCancelled(boolean)` | `void` | Sets the cancelled state of the event |

## Inner Classes

### CraftRecipeEvent.Pre

Fired **before** the crafting operation is executed. Cancelling this event prevents the craft from occurring. Use this to validate or block crafting attempts.

**Source:** Line 32

```java
public static final class Pre extends CraftRecipeEvent {
    public Pre(@Nonnull CraftingRecipe craftedRecipe, int quantity) {
        super(craftedRecipe, quantity);
    }
}
```

**Use Cases:**
- Validating player permissions for specific recipes
- Blocking crafting in certain zones or conditions
- Implementing crafting cooldowns
- Checking for required resources or conditions

### CraftRecipeEvent.Post

Fired **after** the crafting operation has completed successfully. This event is informational - while technically cancellable (inherits from the abstract class), cancelling it does not undo the craft.

**Source:** Line 26

```java
public static final class Post extends CraftRecipeEvent {
    public Post(@Nonnull CraftingRecipe craftedRecipe, int quantity) {
        super(craftedRecipe, quantity);
    }
}
```

**Use Cases:**
- Logging crafting activity
- Granting achievements or XP
- Triggering side effects after successful crafts
- Updating statistics or analytics

## Usage Example

> **Tested** - This code has been verified with a working plugin.

**Important:** ECS events require dedicated `EntityEventSystem` classes registered via `getEntityStoreRegistry().registerSystem()`. They do **not** use the standard `EventBus.register()` method.

### Step 1: Create EntityEventSystem for Pre-Craft

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.CraftRecipeEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class CraftRecipePreSystem extends EntityEventSystem<EntityStore, CraftRecipeEvent.Pre> {

    public CraftRecipePreSystem() {
        super(CraftRecipeEvent.Pre.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull CraftRecipeEvent.Pre event
    ) {
        String recipeInfo = event.getCraftedRecipe() != null ?
            event.getCraftedRecipe().toString() : "Unknown";
        int quantity = event.getQuantity();

        System.out.println("Player attempting to craft: " + recipeInfo + " x" + quantity);

        // Example: Block certain recipes
        // if (isRestrictedRecipe(event.getCraftedRecipe())) {
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

### Step 2: Create EntityEventSystem for Post-Craft

```java
public class CraftRecipePostSystem extends EntityEventSystem<EntityStore, CraftRecipeEvent.Post> {

    public CraftRecipePostSystem() {
        super(CraftRecipeEvent.Post.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull CraftRecipeEvent.Post event
    ) {
        String recipeInfo = event.getCraftedRecipe() != null ?
            event.getCraftedRecipe().toString() : "Unknown";
        int quantity = event.getQuantity();

        System.out.println("Successfully crafted: " + recipeInfo + " x" + quantity);
        // Grant XP, achievements, etc.
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
        getEntityStoreRegistry().registerSystem(new CraftRecipePreSystem());
        getEntityStoreRegistry().registerSystem(new CraftRecipePostSystem());
    }
}
```

### Implementing Crafting Restrictions

```java
// Example: Recipe permission system
getServer().getEventBus().register(
    EventPriority.FIRST,
    CraftRecipeEvent.Pre.class,
    event -> {
        CraftingRecipe recipe = event.getCraftedRecipe();

        // Check if player has permission for this recipe
        // String recipeId = recipe.getId();
        // if (!hasRecipeUnlocked(player, recipeId)) {
        //     event.setCancelled(true);
        //     // Send "Recipe not unlocked" message
        // }
    }
);
```

### Implementing Crafting Bonuses

```java
// Example: Track crafting for bonus rewards
getServer().getEventBus().register(
    EventPriority.LAST,
    CraftRecipeEvent.Post.class,
    event -> {
        if (!event.isCancelled()) {
            CraftingRecipe recipe = event.getCraftedRecipe();
            int quantity = event.getQuantity();

            // Award crafting XP
            // int xp = calculateCraftingXP(recipe, quantity);
            // awardXP(player, xp);

            // Check for achievements
            // checkCraftingAchievements(player, recipe);
        }
    }
);
```

## When This Event Fires

The `CraftRecipeEvent` fires in the following scenarios:

### CraftRecipeEvent.Pre
1. **Manual Crafting**: When a player initiates a craft from the crafting UI
2. **Quick Craft**: When using quick-craft features to batch craft items
3. **Auto-Craft**: When automated crafting systems attempt to craft

### CraftRecipeEvent.Post
1. **Successful Craft**: After items have been successfully created
2. **Batch Completion**: After all items in a batch craft have been created

**Note**: The deprecated `PlayerCraftEvent` exists for legacy compatibility but `CraftRecipeEvent` is the preferred event for new implementations.

## Cancellation Behavior

### CraftRecipeEvent.Pre

When the `Pre` event is cancelled:
- The crafting operation is **completely aborted**
- No ingredients are consumed
- No output items are created
- The player's inventory remains unchanged
- No `Post` event will fire

```java
// Example: Crafting cooldown system
private Map<UUID, Long> craftCooldowns = new HashMap<>();

getServer().getEventBus().register(
    EventPriority.FIRST,
    CraftRecipeEvent.Pre.class,
    event -> {
        // Check cooldown
        // UUID playerId = getPlayerId(event);
        // long lastCraft = craftCooldowns.getOrDefault(playerId, 0L);
        // long now = System.currentTimeMillis();

        // if (now - lastCraft < 1000) { // 1 second cooldown
        //     event.setCancelled(true);
        //     return;
        // }

        // craftCooldowns.put(playerId, now);
    }
);
```

### CraftRecipeEvent.Post

While technically cancellable (due to inheritance), cancelling the `Post` event:
- Does **not** undo the craft (items are already created)
- May prevent post-craft hooks from executing
- Should generally not be cancelled

## Pre vs Post Event Flow

```
Player initiates craft
         |
         v
+------------------+
| CraftRecipeEvent |
|       Pre        |
+------------------+
         |
    [cancelled?]---Yes---> Craft aborted (no items created)
         |
        No
         |
         v
   Ingredients consumed
   Output items created
         |
         v
+------------------+
| CraftRecipeEvent |
|       Post       |
+------------------+
         |
         v
   Craft complete
```

## Related Events

- **[DropItemEvent](./drop-item-event)** - Fires when items are dropped
- **[InteractivelyPickupItemEvent](./interactively-pickup-item-event)** - Fires when items are picked up
- **LivingEntityInventoryChangeEvent** - Fires when inventory changes occur
- **PlayerCraftEvent** - Deprecated legacy crafting event

## Source Reference

- **Class**: `com.hypixel.hytale.server.core.event.events.ecs.CraftRecipeEvent`
- **Source**: `decompiled/com/hypixel/hytale/server/core/event/events/ecs/CraftRecipeEvent.java`
- **Line**: 7
- **Parent**: `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
- **Inner Classes**:
  - `CraftRecipeEvent.Pre` (Line 32) - Pre-craft validation event
  - `CraftRecipeEvent.Post` (Line 26) - Post-craft notification event
