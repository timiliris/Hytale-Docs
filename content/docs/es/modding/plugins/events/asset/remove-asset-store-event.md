---
id: remove-asset-store-event
title: RemoveAssetStoreEvent
sidebar_label: RemoveAssetStoreEvent
---

# RemoveAssetStoreEvent

Fired when an asset store is being removed from the asset system. This event allows plugins to perform cleanup operations and release resources associated with the asset store before it is unregistered.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.assetstore.event.RemoveAssetStoreEvent` |
| **Parent Class** | `AssetStoreEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/assetstore/event/RemoveAssetStoreEvent.java:6` |

## Declaration

```java
public class RemoveAssetStoreEvent extends AssetStoreEvent<Void> {
   public RemoveAssetStoreEvent(@Nonnull AssetStore<?, ?, ?> assetStore) {
      super(assetStore);
   }
}
```

## Inherited Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetStore` | `AssetStore<?, ?, ?>` | `getAssetStore()` | The asset store being removed |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetStore` | `@Nonnull public AssetStore<?, ?, ?> getAssetStore()` | Returns the asset store that is being removed |

## Usage Example

```java
// Clean up when an asset store is removed
eventBus.register(RemoveAssetStoreEvent.class, event -> {
    AssetStore<?, ?, ?> store = event.getAssetStore();

    // Log the removal
    logger.info("Asset store being removed: " + store.getClass().getSimpleName());

    // Clean up any cached data for this store
    assetCache.removeStore(store);
});

// Release resources associated with the store
eventBus.register(RemoveAssetStoreEvent.class, event -> {
    AssetStore<?, ?, ?> store = event.getAssetStore();

    // Remove from tracking
    registeredStores.remove(store);

    // Clean up listeners
    storeListeners.remove(store);
});
```

## Common Use Cases

- Cleaning up cached assets when a store is removed
- Releasing memory and resources
- Removing listeners associated with the store
- Updating internal state to reflect store removal
- Logging asset store lifecycle events
- Performing final validation or backup before removal

## Related Events

- [RegisterAssetStoreEvent](./register-asset-store-event) - Fired when an asset store is registered
- [RemovedAssetsEvent](./removed-assets-event) - Fired when specific assets are removed from a store
- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets are loaded into a store

## Source Reference

`decompiled/com/hypixel/hytale/assetstore/event/RemoveAssetStoreEvent.java:6`
