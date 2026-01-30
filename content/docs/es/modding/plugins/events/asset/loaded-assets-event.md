---
id: loaded-assets-event
title: LoadedAssetsEvent
sidebar_label: LoadedAssetsEvent
---

# LoadedAssetsEvent

Fired when assets have been successfully loaded into an asset store. This generic event provides access to the loaded assets and metadata about the loading process, allowing plugins to react to new content being available.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.assetstore.event.LoadedAssetsEvent` |
| **Parent Class** | `AssetsEvent<K, T>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/assetstore/event/LoadedAssetsEvent.java:10` |

## Declaration

```java
public class LoadedAssetsEvent<K, T extends JsonAsset<K>, M extends AssetMap<K, T>> extends AssetsEvent<K, T> {
   @Nonnull
   private final Class<T> tClass;
   @Nonnull
   private final M assetMap;
   @Nonnull
   private final Map<K, T> loadedAssets;
   private final boolean initial;
   @Nonnull
   private final AssetUpdateQuery query;
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `K` | The key type used to identify assets (e.g., String, ResourceLocation) |
| `T` | The asset type, must extend `JsonAsset<K>` |
| `M` | The asset map type, must extend `AssetMap<K, T>` |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `tClass` | `Class<T>` | `getAssetClass()` | The class type of the loaded assets |
| `assetMap` | `M` | `getAssetMap()` | The asset map containing all assets of this type |
| `loadedAssets` | `Map<K, T>` | `getLoadedAssets()` | Unmodifiable map of newly loaded assets |
| `initial` | `boolean` | `isInitial()` | Whether this is the initial load or a reload |
| `query` | `AssetUpdateQuery` | `getQuery()` | The query that triggered this load operation |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetClass` | `public Class<T> getAssetClass()` | Returns the class type of the loaded assets |
| `getAssetMap` | `public M getAssetMap()` | Returns the asset map for this asset type |
| `getLoadedAssets` | `@Nonnull public Map<K, T> getLoadedAssets()` | Returns an unmodifiable map of the newly loaded assets |
| `isInitial` | `public boolean isInitial()` | Returns true if this is the initial load, false for reloads |
| `getQuery` | `@Nonnull public AssetUpdateQuery getQuery()` | Returns the query that triggered the load |

## Usage Example

```java
// React to newly loaded assets
eventBus.register(LoadedAssetsEvent.class, event -> {
    Map<?, ?> loaded = event.getLoadedAssets();

    logger.info("Loaded " + loaded.size() + " assets of type " +
                event.getAssetClass().getSimpleName());

    // Check if this is initial load or hot reload
    if (event.isInitial()) {
        logger.info("Initial asset load complete");
    } else {
        logger.info("Assets reloaded - updating caches");
        refreshCaches(event.getAssetMap());
    }
});

// Handle specific asset types
eventBus.register(LoadedAssetsEvent.class, event -> {
    if (event.getAssetClass() == BlockType.class) {
        @SuppressWarnings("unchecked")
        Map<String, BlockType> blocks = (Map<String, BlockType>) event.getLoadedAssets();

        for (Map.Entry<String, BlockType> entry : blocks.entrySet()) {
            processNewBlock(entry.getKey(), entry.getValue());
        }
    }
});

// Log asset loading for debugging
eventBus.register(LoadedAssetsEvent.class, event -> {
    AssetUpdateQuery query = event.getQuery();
    logger.debug("Asset load triggered by query: " + query);

    for (Object key : event.getLoadedAssets().keySet()) {
        logger.debug("  Loaded: " + key);
    }
});
```

## Common Use Cases

- Processing newly loaded game content
- Updating caches when assets are reloaded
- Validating loaded assets meet requirements
- Initializing plugin features based on available assets
- Tracking asset loading for debugging
- Implementing hot-reload functionality for development
- Creating asset indexes for quick lookup

## Related Events

- [RemovedAssetsEvent](./removed-assets-event) - Fired when assets are removed from a store
- [GenerateAssetsEvent](./generate-assets-event) - Fired to generate derived assets from loaded ones
- [RegisterAssetStoreEvent](./register-asset-store-event) - Fired when an asset store is registered

## Source Reference

`decompiled/com/hypixel/hytale/assetstore/event/LoadedAssetsEvent.java:10`
