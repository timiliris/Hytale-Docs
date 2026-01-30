---
id: asset-pack-register-event
title: AssetPackRegisterEvent
sidebar_label: AssetPackRegisterEvent
---

# AssetPackRegisterEvent

Fired when an asset pack is registered with the server. This event allows plugins to react to new asset packs being added, validate content, or extend functionality based on available assets.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.asset.AssetPackRegisterEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/asset/AssetPackRegisterEvent.java` |

## Declaration

```java
public class AssetPackRegisterEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetPack` | `AssetPack` | `getAssetPack()` | The asset pack being registered |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetPack` | `public AssetPack getAssetPack()` | Returns the asset pack that is being registered |

## Usage Example

```java
import com.hypixel.hytale.server.core.asset.AssetPackRegisterEvent;
import com.hypixel.hytale.assetstore.AssetPack;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class AssetPackManagerPlugin extends PluginBase {

    private final List<AssetPack> registeredPacks = new ArrayList<>();

    @Override
    public void onEnable() {
        EventBus.register(AssetPackRegisterEvent.class, this::onAssetPackRegister, EventPriority.NORMAL);
    }

    private void onAssetPackRegister(AssetPackRegisterEvent event) {
        AssetPack assetPack = event.getAssetPack();

        // Track registered asset packs
        registeredPacks.add(assetPack);

        getLogger().info("Asset pack registered: " + assetPack.getName());

        // Validate the asset pack
        validateAssetPack(assetPack);

        // Initialize features that depend on this pack
        initializePackFeatures(assetPack);
    }

    private void validateAssetPack(AssetPack assetPack) {
        // Check for required assets
        // Verify compatibility with plugin requirements
    }

    private void initializePackFeatures(AssetPack assetPack) {
        // Enable features that require assets from this pack
    }

    public List<AssetPack> getRegisteredPacks() {
        return Collections.unmodifiableList(registeredPacks);
    }
}
```

## When This Event Fires

The `AssetPackRegisterEvent` is fired when:

1. **Server startup** - When asset packs are loaded during server initialization
2. **Dynamic registration** - When asset packs are added at runtime
3. **Mod loading** - When mod asset packs are registered

The event fires **when** an asset pack is registered, allowing handlers to:
- Track available asset packs
- Validate pack contents
- Enable pack-dependent features
- Log registration for debugging

## Understanding AssetPack

The `AssetPack` object represents a collection of game assets including:
- Textures and models
- Sound files
- Configuration data
- Scripts and behaviors
- Block and item definitions

## Use Cases

- **Feature Detection**: Enable plugin features based on available asset packs
- **Validation**: Verify required assets are present
- **Compatibility**: Check for conflicts between asset packs
- **Tracking**: Maintain a list of available resources
- **Integration**: Connect plugin systems to loaded assets

## Related Events

- [AssetPackUnregisterEvent](./asset-pack-unregister-event) - Fired when an asset pack is unregistered
- [LoadAssetEvent](./load-asset-event) - Fired during asset loading
- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets finish loading

## Source Reference

`decompiled/com/hypixel/hytale/server/core/asset/AssetPackRegisterEvent.java`
