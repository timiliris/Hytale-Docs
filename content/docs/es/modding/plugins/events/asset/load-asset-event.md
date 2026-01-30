---
id: load-asset-event
title: LoadAssetEvent
sidebar_label: LoadAssetEvent
---

# LoadAssetEvent

Fired during the asset loading phase of server startup. This event provides a mechanism to track loading progress, report failures, and optionally trigger server shutdown if critical assets fail to load.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.asset.LoadAssetEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/asset/LoadAssetEvent.java` |

## Declaration

```java
public class LoadAssetEvent implements IEvent<Void> {
```

## Priority Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PRIORITY_LOAD_COMMON` | `-32` | Priority for loading common/shared assets first |
| `PRIORITY_LOAD_REGISTRY` | `-16` | Priority for loading registry assets |
| `PRIORITY_LOAD_LATE` | `64` | Priority for assets that should load later |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `bootStart` | `long` | `getBootStart()` | Timestamp when the boot process started |
| `reasons` | `List<String>` | `getReasons()` | List of failure reasons if loading fails |
| `shouldShutdown` | `boolean` | `isShouldShutdown()` | Whether the server should shut down due to failures |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getBootStart` | `public long getBootStart()` | Returns the timestamp when server boot began |
| `isShouldShutdown` | `public boolean isShouldShutdown()` | Returns true if the server should shut down |
| `getReasons` | `@Nonnull public List<String> getReasons()` | Returns the list of failure reasons |
| `failed` | `public void failed(boolean shouldShutdown, String reason)` | Reports a loading failure with optional shutdown flag |

## Usage Example

```java
import com.hypixel.hytale.server.core.asset.LoadAssetEvent;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class AssetValidationPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // Register with appropriate priority
        EventBus.register(LoadAssetEvent.class, this::onLoadAssets, EventPriority.NORMAL);
    }

    private void onLoadAssets(LoadAssetEvent event) {
        long bootStart = event.getBootStart();
        long elapsed = System.currentTimeMillis() - bootStart;

        getLogger().info("Asset loading phase started. Boot elapsed: " + elapsed + "ms");

        // Attempt to load required plugin assets
        if (!loadPluginAssets()) {
            // Report failure - critical error, should shutdown
            event.failed(true, "Failed to load critical plugin assets");
            return;
        }

        // Attempt to load optional assets
        if (!loadOptionalAssets()) {
            // Report failure - non-critical, continue but log warning
            event.failed(false, "Optional plugin assets failed to load");
        }

        // Check if any other handlers reported failures
        if (event.isShouldShutdown()) {
            getLogger().error("Server will shut down due to asset loading failures:");
            for (String reason : event.getReasons()) {
                getLogger().error("  - " + reason);
            }
        }
    }

    private boolean loadPluginAssets() {
        // Load required assets
        return true; // Return false if loading fails
    }

    private boolean loadOptionalAssets() {
        // Load optional assets
        return true; // Return false if loading fails
    }
}
```

## When This Event Fires

The `LoadAssetEvent` is fired when:

1. **Server startup** - During the asset loading phase of initialization
2. **After boot begins** - The `bootStart` timestamp marks when boot started

The event is used by handlers to:
- Load plugin-specific assets
- Validate required resources exist
- Report critical failures
- Track loading progress

## Understanding the Failure System

The `failed()` method allows handlers to report loading failures:

```java
// Critical failure - server should shut down
event.failed(true, "Required asset 'items.json' not found");

// Non-critical failure - log but continue
event.failed(false, "Optional texture pack not available");
```

Multiple handlers can report failures:
- `shouldShutdown` is OR'd together (any true means shutdown)
- All reasons are collected in the `reasons` list

## Priority System

Use the priority constants to control loading order:

```java
// Load common assets first
EventBus.register(LoadAssetEvent.class, this::loadCommon,
    LoadAssetEvent.PRIORITY_LOAD_COMMON);

// Load registry data second
EventBus.register(LoadAssetEvent.class, this::loadRegistry,
    LoadAssetEvent.PRIORITY_LOAD_REGISTRY);

// Load late-binding assets last
EventBus.register(LoadAssetEvent.class, this::loadLate,
    LoadAssetEvent.PRIORITY_LOAD_LATE);
```

## Use Cases

- **Plugin Asset Loading**: Load plugin-specific configuration and resources
- **Validation**: Verify required game assets exist
- **Error Reporting**: Report critical failures that prevent server operation
- **Timing**: Track how long the boot process has taken
- **Dependency Loading**: Load assets in the correct order

## Related Events

- [BootEvent](../server/boot-event) - Fired when the server boots
- [AssetPackRegisterEvent](./asset-pack-register-event) - Fired when asset packs register
- [AllWorldsLoadedEvent](../world/all-worlds-loaded-event) - Fired after worlds load

## Source Reference

`decompiled/com/hypixel/hytale/server/core/asset/LoadAssetEvent.java`
