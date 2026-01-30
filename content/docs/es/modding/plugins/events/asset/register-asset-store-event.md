---
id: register-asset-store-event
title: RegisterAssetStoreEvent
sidebar_label: RegisterAssetStoreEvent
---

# RegisterAssetStoreEvent

Fired when a new asset store is registered with the asset system. This event allows plugins to react to new asset stores being added, enabling dynamic content registration and initialization.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.assetstore.event.RegisterAssetStoreEvent` |
| **Parent Class** | `AssetStoreEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/assetstore/event/RegisterAssetStoreEvent.java:6` |

## Declaration

```java
public class RegisterAssetStoreEvent extends AssetStoreEvent<Void> {
   public RegisterAssetStoreEvent(@Nonnull AssetStore<?, ?, ?> assetStore) {
      super(assetStore);
   }
}
```

## Inherited Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetStore` | `AssetStore<?, ?, ?>` | `getAssetStore()` | The asset store being registered |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetStore` | `@Nonnull public AssetStore<?, ?, ?> getAssetStore()` | Returns the asset store that is being registered |

## Usage Example

```java
// Listen for new asset stores being registered
eventBus.register(RegisterAssetStoreEvent.class, event -> {
    AssetStore<?, ?, ?> store = event.getAssetStore();

    // Log the registration
    logger.info("New asset store registered: " + store.getClass().getSimpleName());

    // Perform initialization based on store type
    if (store instanceof BlockTypeStore) {
        initializeCustomBlocks((BlockTypeStore) store);
    }
});

// Track all registered asset stores
eventBus.register(RegisterAssetStoreEvent.class, event -> {
    AssetStore<?, ?, ?> store = event.getAssetStore();
    registeredStores.add(store);
});
```

## Common Use Cases

- Tracking when new asset stores become available
- Initializing plugin-specific asset handling
- Registering custom assets after a store is created
- Setting up asset store listeners or monitors
- Validating asset store configurations
- Creating asset store indexes or caches

## Related Events

- [RemoveAssetStoreEvent](./remove-asset-store-event) - Fired when an asset store is removed
- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets are loaded into a store
- [GenerateAssetsEvent](./generate-assets-event) - Fired to generate derived assets

## Source Reference

`decompiled/com/hypixel/hytale/assetstore/event/RegisterAssetStoreEvent.java:6`
