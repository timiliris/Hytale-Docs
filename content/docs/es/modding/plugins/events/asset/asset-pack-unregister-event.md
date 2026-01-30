---
id: asset-pack-unregister-event
title: AssetPackUnregisterEvent
sidebar_label: AssetPackUnregisterEvent
---

# AssetPackUnregisterEvent

Fired when an asset pack is unregistered from the server. This event allows plugins to clean up resources, disable features, or react to asset packs being removed.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.asset.AssetPackUnregisterEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/asset/AssetPackUnregisterEvent.java` |

## Declaration

```java
public class AssetPackUnregisterEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetPack` | `AssetPack` | `getAssetPack()` | The asset pack being unregistered |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetPack` | `public AssetPack getAssetPack()` | Returns the asset pack that is being unregistered |

## Usage Example

```java
import com.hypixel.hytale.server.core.asset.AssetPackUnregisterEvent;
import com.hypixel.hytale.assetstore.AssetPack;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class AssetCleanupPlugin extends PluginBase {

    private final Map<String, Object> packDependentFeatures = new HashMap<>();

    @Override
    public void onEnable() {
        EventBus.register(AssetPackUnregisterEvent.class, this::onAssetPackUnregister, EventPriority.NORMAL);
    }

    private void onAssetPackUnregister(AssetPackUnregisterEvent event) {
        AssetPack assetPack = event.getAssetPack();

        getLogger().info("Asset pack unregistered: " + assetPack.getName());

        // Clean up resources associated with this pack
        cleanupPackResources(assetPack);

        // Disable features that depend on this pack
        disablePackFeatures(assetPack);

        // Notify dependent systems
        notifyDependentSystems(assetPack);
    }

    private void cleanupPackResources(AssetPack assetPack) {
        // Release cached resources from this pack
        packDependentFeatures.remove(assetPack.getName());
    }

    private void disablePackFeatures(AssetPack assetPack) {
        // Gracefully disable features that required this pack
    }

    private void notifyDependentSystems(AssetPack assetPack) {
        // Inform other systems that the pack is no longer available
    }
}
```

## When This Event Fires

The `AssetPackUnregisterEvent` is fired when:

1. **Server shutdown** - When asset packs are cleaned up during shutdown
2. **Dynamic unloading** - When asset packs are removed at runtime
3. **Hot-reload** - When asset packs are reloaded (unregister then register)

The event fires **when** an asset pack is being removed, allowing handlers to:
- Clean up cached resources
- Disable pack-dependent features
- Update internal tracking
- Perform graceful degradation

## Understanding AssetPack

The `AssetPack` object represents a collection of game assets that is being removed, including:
- Textures and models
- Sound files
- Configuration data
- Scripts and behaviors
- Block and item definitions

## Use Cases

- **Resource Cleanup**: Free memory and resources tied to the pack
- **Feature Disabling**: Gracefully disable features that require the pack
- **Error Prevention**: Prevent access to unavailable assets
- **Tracking**: Update internal lists of available packs
- **Hot-reload Support**: Handle asset pack updates properly

## Related Events

- [AssetPackRegisterEvent](./asset-pack-register-event) - Fired when an asset pack is registered
- [RemovedAssetsEvent](./removed-assets-event) - Fired when assets are removed

## Source Reference

`decompiled/com/hypixel/hytale/server/core/asset/AssetPackUnregisterEvent.java`
