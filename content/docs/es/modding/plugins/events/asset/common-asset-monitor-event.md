---
id: common-asset-monitor-event
title: CommonAssetMonitorEvent
sidebar_label: CommonAssetMonitorEvent
---

# CommonAssetMonitorEvent

Fired when the asset monitoring system detects file changes in common assets shared across all asset stores. This event enables hot-reloading functionality specifically for common/shared asset files.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.asset.common.events.CommonAssetMonitorEvent` |
| **Parent Class** | `AssetMonitorEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/asset/common/events/CommonAssetMonitorEvent.java` |

## Declaration

```java
public class CommonAssetMonitorEvent extends AssetMonitorEvent<Void> {
   public CommonAssetMonitorEvent(
      String assetPack,
      List<Path> createdOrModified,
      List<Path> removed,
      List<Path> createdOrModifiedDirectories,
      List<Path> removedDirectories
   )
```

## Inherited Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetPack` | `String` | `getAssetPack()` | The name of the asset pack containing the common assets |
| `createdOrModifiedFilesToLoad` | `List<Path>` | `getCreatedOrModifiedFilesToLoad()` | Common files that were created or modified |
| `removedFilesToUnload` | `List<Path>` | `getRemovedFilesToUnload()` | Common files that were removed |
| `createdOrModifiedDirectories` | `List<Path>` | `getCreatedOrModifiedDirectories()` | Common directories that were created or modified |
| `removedFilesAndDirectories` | `List<Path>` | `getRemovedFilesAndDirectories()` | Common files and directories that were removed |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetPack` | `@Nonnull public String getAssetPack()` | Returns the asset pack name |
| `getCreatedOrModifiedFilesToLoad` | `@Nonnull public List<Path> getCreatedOrModifiedFilesToLoad()` | Returns paths to new or modified common files |
| `getRemovedFilesToUnload` | `@Nonnull public List<Path> getRemovedFilesToUnload()` | Returns paths to removed common files |
| `getCreatedOrModifiedDirectories` | `@Nonnull public List<Path> getCreatedOrModifiedDirectories()` | Returns paths to new or modified common directories |
| `getRemovedFilesAndDirectories` | `@Nonnull public List<Path> getRemovedFilesAndDirectories()` | Returns paths to all removed common items |

## Usage Example

```java
import com.hypixel.hytale.server.core.asset.common.events.CommonAssetMonitorEvent;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;
import java.nio.file.Path;
import java.util.List;

public class CommonAssetWatcherPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(CommonAssetMonitorEvent.class, this::onCommonAssetChange, EventPriority.NORMAL);
    }

    private void onCommonAssetChange(CommonAssetMonitorEvent event) {
        String assetPack = event.getAssetPack();

        getLogger().info("Common asset changes detected in pack: " + assetPack);

        // Process created or modified common files
        List<Path> modified = event.getCreatedOrModifiedFilesToLoad();
        for (Path path : modified) {
            getLogger().info("Common file created/modified: " + path);
            handleModifiedCommonAsset(path);
        }

        // Process removed common files
        List<Path> removed = event.getRemovedFilesToUnload();
        for (Path path : removed) {
            getLogger().info("Common file removed: " + path);
            handleRemovedCommonAsset(path);
        }
    }

    private void handleModifiedCommonAsset(Path path) {
        String fileName = path.getFileName().toString();

        // Handle different common asset types
        if (fileName.endsWith(".json")) {
            reloadCommonJsonConfig(path);
        } else if (fileName.endsWith(".lang")) {
            reloadLanguageFile(path);
        }
    }

    private void handleRemovedCommonAsset(Path path) {
        // Clean up cached references to removed assets
        invalidateCommonAssetCache(path);
    }
}
```

## When This Event Fires

The `CommonAssetMonitorEvent` is fired when:

1. **Common asset file changes** - When files in the common asset directories are modified
2. **Shared resource updates** - When shared textures, configs, or data files change
3. **Hot-reload detection** - When the file watcher detects common asset modifications

The event allows handlers to:
- React to changes in shared assets
- Update cached common resources
- Refresh shared configurations
- Trigger dependent asset reloads
- Log common asset modifications

## Difference from AssetStoreMonitorEvent

| Aspect | CommonAssetMonitorEvent | AssetStoreMonitorEvent |
|--------|------------------------|------------------------|
| **Scope** | Common/shared assets only | Specific asset store |
| **Asset Store** | No specific store reference | Includes `getAssetStore()` |
| **Use Case** | Global shared resources | Store-specific assets |

```java
// Handle both event types for comprehensive monitoring
eventBus.register(CommonAssetMonitorEvent.class, event -> {
    // Handle common asset changes (shared across stores)
    logger.info("Common assets changed in: " + event.getAssetPack());
});

eventBus.register(AssetStoreMonitorEvent.class, event -> {
    // Handle store-specific asset changes
    logger.info("Store assets changed: " + event.getAssetStore().getName());
});
```

## Directory Structure Example

```java
// Common assets might be organized like:
// assets/
//   common/              <- CommonAssetMonitorEvent fires for changes here
//     textures/
//     lang/
//     config/
//   stores/
//     items/             <- AssetStoreMonitorEvent fires for changes here
//     blocks/            <- AssetStoreMonitorEvent fires for changes here
```

## Common Use Cases

- Monitoring changes to shared language files
- Detecting updates to common configuration files
- Hot-reloading shared textures and resources
- Logging modifications for debugging
- Cache invalidation for common assets
- Triggering dependent system updates

## Related Events

- [AssetStoreMonitorEvent](./asset-store-monitor-event) - Fired when store-specific assets change
- [RegisterAssetStoreEvent](./register-asset-store-event) - Fired when an asset store is registered
- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets are loaded
- [SendCommonAssetsEvent](./send-common-assets-event) - Fired when common assets are sent to clients

## Source Reference

`decompiled/com/hypixel/hytale/server/core/asset/common/events/CommonAssetMonitorEvent.java`
