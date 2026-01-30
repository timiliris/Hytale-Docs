---
id: generate-assets-event
title: GenerateAssetsEvent
sidebar_label: GenerateAssetsEvent
---

# GenerateAssetsEvent

A processed event that fires to allow plugins to generate derived or child assets from loaded parent assets. This powerful event enables dynamic asset creation, parent-child relationships, and procedural content generation during the asset loading phase.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.assetstore.event.GenerateAssetsEvent` |
| **Parent Class** | `AssetsEvent<K, T>` |
| **Implements** | `IProcessedEvent` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/assetstore/event/GenerateAssetsEvent.java:20` |

## Declaration

```java
public class GenerateAssetsEvent<K, T extends JsonAssetWithMap<K, M>, M extends AssetMap<K, T>>
    extends AssetsEvent<K, T> implements IProcessedEvent {
   private final Class<T> tClass;
   private final M assetMap;
   @Nonnull
   private final Map<K, T> loadedAssets;
   private final Map<K, Set<K>> assetChildren;
   @Nonnull
   private final Map<K, T> unmodifiableLoadedAssets;
   private final Map<K, T> addedAssets = new ConcurrentHashMap<>();
   private final Map<K, Set<K>> addedAssetChildren = new ConcurrentHashMap<>();
   private final Map<Class<? extends JsonAssetWithMap<?, ?>>, Map<?, Set<K>>> addedChildAssetsMap;
   private long before;
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `K` | The key type used to identify assets |
| `T` | The asset type, must extend `JsonAssetWithMap<K, M>` |
| `M` | The asset map type, must extend `AssetMap<K, T>` |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `tClass` | `Class<T>` | `getAssetClass()` | The class type of assets being processed |
| `assetMap` | `M` | `getAssetMap()` | The asset map for this asset type |
| `loadedAssets` | `Map<K, T>` | `getLoadedAssets()` | Unmodifiable map of loaded assets |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetClass` | `public Class<T> getAssetClass()` | Returns the class type of assets |
| `getAssetMap` | `public M getAssetMap()` | Returns the asset map |
| `getLoadedAssets` | `@Nonnull public Map<K, T> getLoadedAssets()` | Returns unmodifiable map of loaded assets |
| `addChildAsset` | `public void addChildAsset(K childKey, T asset, @Nonnull K parent)` | Adds a child asset with a single parent |
| `addChildAsset` | `public final void addChildAsset(K childKey, T asset, @Nonnull K... parents)` | Adds a child asset with multiple parents |
| `addChildAssetWithReference` | `public <P, PK> void addChildAssetWithReference(K childKey, T asset, Class<P> parentAssetClass, @Nonnull PK parentKey)` | Adds a child asset referencing a different asset type |
| `addChildAssetWithReferences` | `public void addChildAssetWithReferences(K childKey, T asset, @Nonnull ParentReference<?, ?>... parents)` | Adds a child asset with multiple cross-type parent references |
| `processEvent` | `public void processEvent(@Nonnull String hookName)` | Processes and finalizes all added assets |

## Nested Classes

### ParentReference

A helper class to specify parent references across different asset types.

```java
public static class ParentReference<P extends JsonAssetWithMap<PK, ?>, PK> {
   private final Class<P> parentAssetClass;
   private final PK parentKey;

   public ParentReference(Class<P> parentAssetClass, PK parentKey);
   public Class<P> getParentAssetClass();
   public PK getParentKey();
}
```

## Usage Example

```java
// Generate variant assets from base assets
eventBus.register(GenerateAssetsEvent.class, event -> {
    if (event.getAssetClass() == BlockType.class) {
        @SuppressWarnings("unchecked")
        GenerateAssetsEvent<String, BlockType, BlockTypeMap> blockEvent =
            (GenerateAssetsEvent<String, BlockType, BlockTypeMap>) event;

        Map<String, BlockType> loaded = blockEvent.getLoadedAssets();

        // Generate colored variants for base blocks
        BlockType stoneBlock = loaded.get("stone");
        if (stoneBlock != null) {
            for (String color : COLORS) {
                String childKey = color + "_stone";
                BlockType coloredStone = createColoredVariant(stoneBlock, color);
                blockEvent.addChildAsset(childKey, coloredStone, "stone");
            }
        }
    }
});

// Generate assets with multiple parents
eventBus.register(GenerateAssetsEvent.class, event -> {
    if (event.getAssetClass() == RecipeType.class) {
        @SuppressWarnings("unchecked")
        GenerateAssetsEvent<String, RecipeType, RecipeTypeMap> recipeEvent =
            (GenerateAssetsEvent<String, RecipeType, RecipeTypeMap>) event;

        // Create a recipe that combines multiple base recipes
        RecipeType combinedRecipe = createCombinedRecipe();
        recipeEvent.addChildAsset("combined_recipe", combinedRecipe,
            "base_recipe_1", "base_recipe_2");
    }
});

// Generate cross-type references
eventBus.register(GenerateAssetsEvent.class, event -> {
    if (event.getAssetClass() == ItemType.class) {
        @SuppressWarnings("unchecked")
        GenerateAssetsEvent<String, ItemType, ItemTypeMap> itemEvent =
            (GenerateAssetsEvent<String, ItemType, ItemTypeMap>) event;

        // Create item variants referencing block types
        ItemType blockItem = createBlockItem();
        itemEvent.addChildAssetWithReference(
            "stone_block_item",
            blockItem,
            BlockType.class,
            "stone"
        );
    }
});
```

## Common Use Cases

- Generating color or material variants of base assets
- Creating derived items from block types
- Building recipe variations programmatically
- Implementing modular asset systems
- Creating localized asset variants
- Generating level-of-detail variants
- Building asset inheritance hierarchies
- Procedural content generation

## Related Events

- [LoadedAssetsEvent](./loaded-assets-event) - Fired before this event when assets are loaded
- [RemovedAssetsEvent](./removed-assets-event) - Fired when assets are removed
- [RegisterAssetStoreEvent](./register-asset-store-event) - Fired when an asset store is registered

## Source Reference

`decompiled/com/hypixel/hytale/assetstore/event/GenerateAssetsEvent.java:20`
