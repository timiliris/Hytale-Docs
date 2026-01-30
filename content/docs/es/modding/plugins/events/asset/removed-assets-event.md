---
id: removed-assets-event
title: RemovedAssetsEvent
sidebar_label: RemovedAssetsEvent
---

# RemovedAssetsEvent

Fired when assets have been removed from an asset store. This event provides information about which assets were removed and whether they were replaced by new versions, allowing plugins to clean up references and update their state accordingly.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.assetstore.event.RemovedAssetsEvent` |
| **Parent Class** | `AssetsEvent<K, T>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/assetstore/event/RemovedAssetsEvent.java:9` |

## Declaration

```java
public class RemovedAssetsEvent<K, T extends JsonAsset<K>, M extends AssetMap<K, T>> extends AssetsEvent<K, T> {
   private final Class<T> tClass;
   private final M assetMap;
   @Nonnull
   private final Set<K> removedAssets;
   private final boolean replaced;
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `K` | The key type used to identify assets |
| `T` | The asset type, must extend `JsonAsset<K>` |
| `M` | The asset map type, must extend `AssetMap<K, T>` |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `tClass` | `Class<T>` | `getAssetClass()` | The class type of the removed assets |
| `assetMap` | `M` | `getAssetMap()` | The asset map from which assets were removed |
| `removedAssets` | `Set<K>` | `getRemovedAssets()` | Unmodifiable set of keys for removed assets |
| `replaced` | `boolean` | `isReplaced()` | Whether the assets were replaced by new versions |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetClass` | `public Class<T> getAssetClass()` | Returns the class type of the removed assets |
| `getAssetMap` | `public M getAssetMap()` | Returns the asset map for this asset type |
| `getRemovedAssets` | `@Nonnull public Set<K> getRemovedAssets()` | Returns an unmodifiable set of removed asset keys |
| `isReplaced` | `public boolean isReplaced()` | Returns true if assets were replaced, false if permanently removed |

## Usage Example

```java
// Clean up when assets are removed
eventBus.register(RemovedAssetsEvent.class, event -> {
    Set<?> removed = event.getRemovedAssets();

    logger.info("Removed " + removed.size() + " assets of type " +
                event.getAssetClass().getSimpleName());

    // Check if this is a replacement or permanent removal
    if (event.isReplaced()) {
        logger.info("Assets were replaced with new versions");
    } else {
        logger.info("Assets were permanently removed");
        // Clean up any references to these assets
        for (Object key : removed) {
            assetReferences.remove(key);
        }
    }
});

// Handle specific asset type removals
eventBus.register(RemovedAssetsEvent.class, event -> {
    if (event.getAssetClass() == ItemType.class) {
        @SuppressWarnings("unchecked")
        Set<String> removedItems = (Set<String>) event.getRemovedAssets();

        for (String itemKey : removedItems) {
            // Clean up item-related data
            itemCache.invalidate(itemKey);
            recipeManager.removeItemRecipes(itemKey);
        }
    }
});

// Update UI when assets change
eventBus.register(RemovedAssetsEvent.class, event -> {
    if (!event.isReplaced()) {
        // Only update UI for permanent removals
        uiManager.refreshAssetList(event.getAssetClass());
    }
});
```

## Common Use Cases

- Cleaning up cached references to removed assets
- Invalidating asset-dependent caches
- Updating UI elements that display assets
- Handling hot-reload scenarios during development
- Removing recipe or crafting references
- Cleaning up entity spawn configurations
- Updating world generation parameters

## Related Events

- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets are loaded into a store
- [RemoveAssetStoreEvent](./remove-asset-store-event) - Fired when an entire asset store is removed
- [GenerateAssetsEvent](./generate-assets-event) - Fired to generate derived assets

## Source Reference

`decompiled/com/hypixel/hytale/assetstore/event/RemovedAssetsEvent.java:9`
