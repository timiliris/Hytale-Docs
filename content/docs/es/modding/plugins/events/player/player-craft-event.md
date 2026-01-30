---
id: player-craft-event
title: PlayerCraftEvent
sidebar_label: PlayerCraftEvent
---

# PlayerCraftEvent

:::warning Deprecated
This event is deprecated and marked for removal. Consider using [CraftRecipeEvent](../ecs/craft-recipe-event) in the ECS event system instead.
:::

Fired when a player crafts an item. This event provides information about the recipe being crafted and the quantity of items produced.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerCraftEvent` |
| **Parent Class** | `PlayerEvent<String>` |
| **Cancellable** | No |
| **Async** | No |
| **Deprecated** | Yes (marked for removal) |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerCraftEvent.java:12` |

## Declaration

```java
@Deprecated(
   forRemoval = true
)
public class PlayerCraftEvent extends PlayerEvent<String> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `playerRef` | `Ref<EntityStore>` | `getPlayerRef()` | Reference to the player's entity store (inherited from PlayerEvent) |
| `player` | `Player` | `getPlayer()` | The player object (inherited from PlayerEvent) |
| `craftedRecipe` | `CraftingRecipe` | `getCraftedRecipe()` | The recipe that was crafted |
| `quantity` | `int` | `getQuantity()` | The number of items crafted |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPlayerRef` | `@Nonnull public Ref<EntityStore> getPlayerRef()` | Returns the player's entity store reference (inherited) |
| `getPlayer` | `@Nonnull public Player getPlayer()` | Returns the player object (inherited) |
| `getCraftedRecipe` | `public CraftingRecipe getCraftedRecipe()` | Returns the recipe that was crafted |
| `getQuantity` | `public int getQuantity()` | Returns the number of items produced |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of this event |

## Usage Example

```java
// Register a handler for crafting events (deprecated approach)
eventBus.register(PlayerCraftEvent.class, event -> {
    Player player = event.getPlayer();
    CraftingRecipe recipe = event.getCraftedRecipe();
    int quantity = event.getQuantity();

    // Log the crafting action
    logger.info(player.getName() + " crafted " + quantity + "x " + recipe.getOutputItem());

    // Track crafting statistics
    incrementCraftingStats(player, recipe, quantity);

    // Award crafting experience
    awardCraftingXP(player, recipe);

    // Check for crafting achievements
    checkCraftingAchievements(player, recipe);
});

// Crafting tutorial system
eventBus.register(PlayerCraftEvent.class, event -> {
    Player player = event.getPlayer();
    CraftingRecipe recipe = event.getCraftedRecipe();

    // Track first-time crafts for tutorials
    if (isFirstTimeCrafting(player, recipe)) {
        showCraftingTutorial(player, recipe);
        markRecipeAsLearned(player, recipe);
    }
});

// Quest tracking
eventBus.register(PlayerCraftEvent.class, event -> {
    Player player = event.getPlayer();
    CraftingRecipe recipe = event.getCraftedRecipe();
    int quantity = event.getQuantity();

    // Update quest progress
    updateQuestProgress(player, "craft", recipe.getId(), quantity);
});
```

## Common Use Cases

- Tracking crafting statistics
- Awarding crafting experience points
- Checking for crafting achievements
- Quest progress tracking
- Logging crafting activity
- Tutorial systems for first-time crafts

## Migration Guide

This event is deprecated and will be removed in a future version. Migrate to using `CraftRecipeEvent` from the ECS event system:

```java
// Old approach (deprecated)
eventBus.register(PlayerCraftEvent.class, event -> {
    Player player = event.getPlayer();
    CraftingRecipe recipe = event.getCraftedRecipe();
    // Handle crafting
});

// New approach using ECS events
// CraftRecipeEvent.Pre - cancellable, fires before crafting
// CraftRecipeEvent.Post - fires after crafting completes
```

## Related Events

- [CraftRecipeEvent](../ecs/craft-recipe-event) - The replacement ECS-based crafting event
- [LivingEntityInventoryChangeEvent](../entity/living-entity-inventory-change-event) - For tracking inventory changes

## Notes

Since this event is not cancellable, you cannot prevent crafting through this event. If you need to prevent or modify crafting behavior, use `CraftRecipeEvent.Pre` from the ECS system instead, which implements `ICancellableEcsEvent`.

The deprecation annotation includes `forRemoval = true`, indicating this event will be removed in a future version. Plan your migration accordingly.

## Testing

:::tip Tested
**January 17, 2026** - Verified with doc-test plugin. All documented methods work correctly.
:::

To test this event:
1. Run `/doctest test-player-craft-event`
2. Open a crafting table or use inventory 2x2 crafting grid
3. Craft any item (e.g., a crude pickaxe from rubble, fibre, and sticks)
4. The event should fire and display details in chat

## Internal Details

### CraftingRecipe Structure

The `getCraftedRecipe()` method returns a `CraftingRecipe` object with the following properties (observed from testing):

```java
CraftingRecipe {
    input: List<MaterialQuantity>     // Required materials
    primaryOutput: MaterialQuantity   // Main output item
    extraOutputs: List<MaterialQuantity>  // Additional outputs
    outputQuantity: int               // Number of items produced
    benchRequirement: List<BenchRequirement>  // Required crafting station
    timeSeconds: float                // Crafting duration (e.g., 1.0)
    knowledgeRequired: boolean        // Whether recipe knowledge is needed
    requiredMemoriesLevel: int        // Memory level requirement
}
```

Each `MaterialQuantity` contains:
- `itemId`: Specific item ID (e.g., `"Tool_Pickaxe_Crude"`, `"Ingredient_Fibre"`)
- `resourceTypeId`: Resource type (e.g., `"Rubble"`) - used when itemId is null
- `tag`: Optional item tag
- `quantity`: Number of items
- `metadata`: Optional metadata

### Where the Event is Fired

The event is dispatched in `CraftingManager.craftItem()` method:

**File:** `com/hypixel/hytale/builtin/crafting/component/CraftingManager.java:185-190`

```java
IEventDispatcher<PlayerCraftEvent, PlayerCraftEvent> dispatcher = HytaleServer.get()
    .getEventBus()
    .dispatchFor(PlayerCraftEvent.class, world.getName());
if (dispatcher.hasListener()) {
    dispatcher.dispatch(new PlayerCraftEvent(ref, playerComponent, recipe, quantity));
}
```

### Event Processing Chain

1. `CraftRecipeEvent.Pre` fires (cancellable) - can prevent crafting
2. Materials and bench are validated
3. `CraftRecipeEvent.Post` fires (cancellable) - can cancel after validation
4. If not cancelled, `giveOutput()` gives items to player
5. **`PlayerCraftEvent` fires** (informational, non-cancellable)

### Class Hierarchy

```
PlayerCraftEvent
  └── extends PlayerEvent<String>
        └── implements IEvent<String>
              └── extends IBaseEvent<String>
```

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerCraftEvent.java:12`

---

> **Last updated:** January 17, 2026 - Tested and verified. Added internal details and CraftingRecipe structure.
