# Crafting System

The Hytale crafting system is a comprehensive framework for defining recipes, crafting stations, and player crafting interactions. This documentation covers the internal structure and how to work with recipes and benches through plugins.

## Overview

The crafting system is managed by the `CraftingPlugin` class (`com.hypixel.hytale.builtin.crafting.CraftingPlugin`) which handles:

- Recipe registration and management
- Bench recipe registries
- Recipe learning/forgetting for players
- Crafting events and packets

## Recipe Types and Structure

### CraftingRecipe

Recipes are defined using the `CraftingRecipe` class (`com.hypixel.hytale.server.core.asset.type.item.config.CraftingRecipe`).

#### Recipe Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `String` | Unique identifier for the recipe |
| `Input` | `MaterialQuantity[]` | Array of required input materials |
| `Output` | `MaterialQuantity[]` | Array of output materials (secondary outputs) |
| `PrimaryOutput` | `MaterialQuantity` | The main output item |
| `OutputQuantity` | `int` | Quantity of primary output (default: 1) |
| `BenchRequirement` | `BenchRequirement[]` | Array of bench requirements |
| `TimeSeconds` | `float` | Crafting time in seconds (min: 0) |
| `KnowledgeRequired` | `boolean` | Whether the player must know the recipe |
| `RequiredMemoriesLevel` | `int` | Required world memories level (starts from 1) |

### MaterialQuantity

Materials are defined using the `MaterialQuantity` class (`com.hypixel.hytale.server.core.inventory.MaterialQuantity`).

| Property | Type | Description |
|----------|------|-------------|
| `ItemId` | `String` | Specific item ID (optional) |
| `ResourceTypeId` | `String` | Resource type for generic matching (optional) |
| `ItemTag` | `String` | Item tag for tag-based matching (optional) |
| `Quantity` | `int` | Required quantity (must be > 0) |
| `Metadata` | `BsonDocument` | Additional item metadata |

At least one of `ItemId`, `ResourceTypeId`, or `ItemTag` must be specified.

### BenchRequirement

Defines which bench types can craft a recipe:

| Property | Type | Description |
|----------|------|-------------|
| `Type` | `BenchType` | The type of bench required |
| `Id` | `String` | The specific bench ID |
| `Categories` | `String[]` | Categories this recipe belongs to |
| `RequiredTierLevel` | `int` | Minimum bench tier level required |

## Bench Types

The `BenchType` enum (`com.hypixel.hytale.protocol.BenchType`) defines four types of crafting stations:

| Type | Value | Description |
|------|-------|-------------|
| `Crafting` | 0 | Standard crafting bench with categories and item categories |
| `Processing` | 1 | Processing bench with fuel system (furnaces, smelters) |
| `DiagramCrafting` | 2 | Diagram-based crafting (limited to 1 output per recipe) |
| `StructuralCrafting` | 3 | Structure/building crafting with block group cycling |

### Bench Configuration

#### Base Bench Properties

All benches inherit from the `Bench` class:

| Property | Type | Description |
|----------|------|-------------|
| `Id` | `String` | Unique bench identifier |
| `DescriptiveLabel` | `String` | Display name for the bench |
| `TierLevels` | `BenchTierLevel[]` | Array of tier level configurations |
| `LocalOpenSoundEventId` | `String` | Sound played when opening |
| `LocalCloseSoundEventId` | `String` | Sound played when closing |
| `CompletedSoundEventId` | `String` | Sound played on craft completion |
| `FailedSoundEventId` | `String` | Sound played on craft failure |
| `BenchUpgradeSoundEventId` | `String` | Sound during upgrade |
| `BenchUpgradeCompletedSoundEventId` | `String` | Sound on upgrade completion |

#### CraftingBench

Standard crafting benches support categories:

```java
public class CraftingBench extends Bench {
    protected BenchCategory[] categories;
}
```

**BenchCategory Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `Id` | `String` | Category identifier |
| `Name` | `String` | Display name |
| `Icon` | `String` | Category icon |
| `ItemCategories` | `BenchItemCategory[]` | Sub-categories |

**BenchItemCategory Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `Id` | `String` | Sub-category identifier |
| `Name` | `String` | Display name |
| `Icon` | `String` | Icon path |
| `Diagram` | `String` | UI crafting diagram path |
| `Slots` | `int` | Number of slots (default: 1) |
| `SpecialSlot` | `boolean` | Has special slot (default: true) |

#### DiagramCraftingBench

Extends `CraftingBench` with diagram-based crafting UI. Recipes are limited to a single output.

#### StructuralCraftingBench

For building/structure crafting:

| Property | Type | Description |
|----------|------|-------------|
| `Categories` | `String[]` | Sorted category list |
| `HeaderCategories` | `String[]` | Categories to show as headers |
| `AlwaysShowInventoryHints` | `boolean` | Always display inventory hints |
| `AllowBlockGroupCycling` | `boolean` | Enable block group cycling |

## Bench Tier System

Benches can be upgraded through tiers, each providing bonuses.

### BenchTierLevel

| Property | Type | Description |
|----------|------|-------------|
| `UpgradeRequirement` | `BenchUpgradeRequirement` | Materials needed to upgrade |
| `CraftingTimeReductionModifier` | `double` | Time reduction (0.0 - 1.0) |
| `ExtraInputSlot` | `int` | Additional input slots |
| `ExtraOutputSlot` | `int` | Additional output slots |

## Fieldcraft (Pocket Crafting)

Fieldcraft is the portable crafting system accessed from the inventory. It uses the special bench ID `"Fieldcraft"` and `BenchType.Crafting`.

### FieldcraftCategory

Categories for fieldcraft are defined in the `FieldcraftCategory` class:

| Property | Type | Description |
|----------|------|-------------|
| `Id` | `String` | Category identifier |
| `Name` | `String` | Display name |
| `Icon` | `String` | Icon path |
| `Order` | `int` | Sort order |

## Recipe Unlocking System

Recipes can require players to learn them before crafting.

### Learning Recipes

Use `CraftingPlugin.learnRecipe()`:

```java
// Learn a recipe for a player
boolean success = CraftingPlugin.learnRecipe(ref, recipeId, componentAccessor);
```

### Forgetting Recipes

Use `CraftingPlugin.forgetRecipe()`:

```java
// Make a player forget a recipe
boolean success = CraftingPlugin.forgetRecipe(ref, itemId, componentAccessor);
```

### LearnRecipeInteraction

The `LearnRecipeInteraction` class allows items to teach recipes on use:

| Property | Type | Description |
|----------|------|-------------|
| `ItemId` | `String` | The recipe item ID to learn |

Can be set via item metadata with key `"ItemId"`.

## Window Types

The `WindowType` enum defines UI windows:

| Type | Value | Description |
|------|-------|-------------|
| `Container` | 0 | Generic container |
| `PocketCrafting` | 1 | Fieldcraft window |
| `BasicCrafting` | 2 | Standard crafting bench |
| `DiagramCrafting` | 3 | Diagram crafting bench |
| `StructuralCrafting` | 4 | Structural crafting bench |
| `Processing` | 5 | Processing bench |
| `Memories` | 6 | Memories interface |

## Events

### CraftRecipeEvent

A cancellable ECS event fired before and after crafting:

- `CraftRecipeEvent.Pre` - Fired before crafting, can be cancelled
- `CraftRecipeEvent.Post` - Fired after input removal, before output

```java
// Listen to craft events
eventRegistry.register(CraftRecipeEvent.Pre.class, filter, event -> {
    CraftingRecipe recipe = event.getCraftedRecipe();
    int quantity = event.getQuantity();
    // Cancel if needed
    event.cancel();
});
```

### PlayerCraftEvent (Deprecated)

Legacy event, use `CraftRecipeEvent` instead.

```java
PlayerCraftEvent event = new PlayerCraftEvent(ref, player, craftedRecipe, quantity);
```

## Packets

### UpdateRecipes

Sends recipe definitions to clients:

| Property | Type | Description |
|----------|------|-------------|
| `type` | `UpdateType` | Init or Update |
| `recipes` | `Map<String, CraftingRecipe>` | Recipe map |
| `removedRecipes` | `String[]` | Removed recipe IDs |

**Packet ID:** 60

### UpdateKnownRecipes

Updates the player's known recipes:

| Property | Type | Description |
|----------|------|-------------|
| `known` | `Map<String, CraftingRecipe>` | Known recipes map |

**Packet ID:** 228

### CraftRecipeAction

Client request to craft an item:

| Property | Type | Description |
|----------|------|-------------|
| `recipeId` | `String` | Recipe to craft |
| `quantity` | `int` | Amount to craft |

## Crafting Configuration

Global crafting settings in `CraftingConfig`:

| Property | Default | Description |
|----------|---------|-------------|
| `BenchMaterialChestHorizontalSearchRadius` | 7 | Horizontal search radius for nearby chests |
| `BenchMaterialChestVerticalSearchRadius` | 3 | Vertical search radius for nearby chests |
| `BenchMaterialChestLimit` | 100 | Maximum chests to search for materials |

## Adding Custom Recipes

### JSON Recipe Definition

Recipes are defined in JSON format:

```json
{
    "Id": "MyMod:IronSword",
    "Input": [
        { "ItemId": "Hytale:IronIngot", "Quantity": 2 },
        { "ItemId": "Hytale:WoodPlank", "Quantity": 1 }
    ],
    "PrimaryOutput": {
        "ItemId": "MyMod:IronSword",
        "Quantity": 1
    },
    "BenchRequirement": [
        {
            "Type": "Crafting",
            "Id": "Hytale:Anvil",
            "Categories": ["Weapons"],
            "RequiredTierLevel": 1
        }
    ],
    "TimeSeconds": 2.5,
    "KnowledgeRequired": false,
    "RequiredMemoriesLevel": 1
}
```

### Programmatic Recipe Registration

Recipes loaded via asset system trigger events:

- `LoadedAssetsEvent<String, CraftingRecipe, ...>` - When recipes are loaded
- `RemovedAssetsEvent<String, CraftingRecipe, ...>` - When recipes are removed

The `BenchRecipeRegistry` manages recipes per bench:

```java
BenchRecipeRegistry registry = registries.computeIfAbsent(benchId, BenchRecipeRegistry::new);
registry.addRecipe(benchRequirement, recipe);
```

## CraftingManager Component

The `CraftingManager` component handles active crafting sessions for players:

### Key Methods

```java
// Set the active bench
craftingManager.setBench(x, y, z, blockType);

// Craft an item instantly
craftingManager.craftItem(ref, store, recipe, quantity, itemContainer);

// Queue a timed craft
craftingManager.queueCraft(ref, store, window, transactionId, recipe, quantity, inputContainer, inputRemovalType);

// Cancel all queued crafts
craftingManager.cancelAllCrafting(ref, store);
```

### Input Removal Types

```java
public enum InputRemovalType {
    NORMAL,   // Standard material removal
    ORDERED   // Ordered removal from slots
}
```

## Best Practices

1. **Use Resource Types** - For generic materials, use `ResourceTypeId` instead of `ItemId` to allow multiple item types
2. **Set Appropriate Times** - Fieldcraft recipes should have `TimeSeconds: 0`
3. **Knowledge Requirements** - Only use `KnowledgeRequired` for `Crafting` and `DiagramCrafting` bench types
4. **Tier Levels** - Design tier progression to reward player investment
5. **Categories** - Organize recipes into logical categories for better UX
