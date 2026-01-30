---
id: asset-store-monitor-event
title: AssetStoreMonitorEvent
sidebar_label: AssetStoreMonitorEvent
---

# AssetStoreMonitorEvent

Fired when the asset monitoring system detects file changes in an asset store's directory. This event enables hot-reloading functionality by notifying plugins of created, modified, or removed asset files.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.assetstore.event.AssetStoreMonitorEvent` |
| **Parent Class** | `AssetMonitorEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/assetstore/event/AssetStoreMonitorEvent.java:8` |

## Declaration

```java
public class AssetStoreMonitorEvent extends AssetMonitorEvent<Void> {
   @Nonnull
   private final AssetStore<?, ?, ?> assetStore;

   public AssetStoreMonitorEvent(
      @Nonnull String assetPack,
      @Nonnull AssetStore<?, ?, ?> assetStore,
      @Nonnull List<Path> createdOrModified,
      @Nonnull List<Path> removed,
      @Nonnull List<Path> createdOrModifiedDirectories,
      @Nonnull List<Path> removedDirectories
   )
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetStore` | `AssetStore<?, ?, ?>` | `getAssetStore()` | The asset store being monitored |

## Inherited Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `assetPack` | `String` | `getAssetPack()` | The name of the asset pack being monitored |
| `createdOrModifiedFilesToLoad` | `List<Path>` | `getCreatedOrModifiedFilesToLoad()` | Files that were created or modified |
| `removedFilesToUnload` | `List<Path>` | `getRemovedFilesToUnload()` | Files that were removed |
| `createdOrModifiedDirectories` | `List<Path>` | `getCreatedOrModifiedDirectories()` | Directories that were created or modified |
| `removedFilesAndDirectories` | `List<Path>` | `getRemovedFilesAndDirectories()` | Files and directories that were removed |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAssetStore` | `@Nonnull public AssetStore<?, ?, ?> getAssetStore()` | Returns the asset store being monitored |
| `getAssetPack` | `@Nonnull public String getAssetPack()` | Returns the asset pack name |
| `getCreatedOrModifiedFilesToLoad` | `@Nonnull public List<Path> getCreatedOrModifiedFilesToLoad()` | Returns paths to new or modified files |
| `getRemovedFilesToUnload` | `@Nonnull public List<Path> getRemovedFilesToUnload()` | Returns paths to removed files |
| `getCreatedOrModifiedDirectories` | `@Nonnull public List<Path> getCreatedOrModifiedDirectories()` | Returns paths to new or modified directories |
| `getRemovedFilesAndDirectories` | `@Nonnull public List<Path> getRemovedFilesAndDirectories()` | Returns paths to all removed items |

## Usage Example

```java
// React to file changes for hot-reloading
eventBus.register(AssetStoreMonitorEvent.class, event -> {
    AssetStore<?, ?, ?> store = event.getAssetStore();
    String assetPack = event.getAssetPack();

    logger.info("File changes detected in asset pack: " + assetPack);

    // Process new or modified files
    List<Path> modified = event.getCreatedOrModifiedFilesToLoad();
    for (Path path : modified) {
        logger.info("File created/modified: " + path);
    }

    // Process removed files
    List<Path> removed = event.getRemovedFilesToUnload();
    for (Path path : removed) {
        logger.info("File removed: " + path);
    }
});

// Implement custom hot-reload logic
eventBus.register(AssetStoreMonitorEvent.class, event -> {
    List<Path> modified = event.getCreatedOrModifiedFilesToLoad();

    // Check for specific file types
    for (Path path : modified) {
        String fileName = path.getFileName().toString();
        if (fileName.endsWith(".json")) {
            reloadJsonAsset(path);
        } else if (fileName.endsWith(".png")) {
            reloadTexture(path);
        }
    }
});

// Log directory changes
eventBus.register(AssetStoreMonitorEvent.class, event -> {
    List<Path> newDirs = event.getCreatedOrModifiedDirectories();
    if (!newDirs.isEmpty()) {
        logger.info("New directories detected:");
        for (Path dir : newDirs) {
            logger.info("  " + dir);
        }
    }
});
```

## Common Use Cases

- Implementing hot-reload for development
- Watching for asset file changes
- Triggering cache invalidation on file changes
- Logging asset modifications for debugging
- Auto-compiling modified assets
- Detecting new content additions
- Implementing live preview functionality

## Related Events

- [RegisterAssetStoreEvent](./register-asset-store-event) - Fired when an asset store is registered
- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets are loaded
- [RemovedAssetsEvent](./removed-assets-event) - Fired when assets are removed

## Source Reference

`decompiled/com/hypixel/hytale/assetstore/event/AssetStoreMonitorEvent.java:8`
