---
id: send-common-assets-event
title: SendCommonAssetsEvent
sidebar_label: SendCommonAssetsEvent
---

# SendCommonAssetsEvent

Fired asynchronously when common assets are being sent to a client. This event allows plugins to intercept, modify, or track asset transfers during the client connection process.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.asset.common.events.SendCommonAssetsEvent` |
| **Parent Class** | `IAsyncEvent<Void>` |
| **Cancellable** | No |
| **Async** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/asset/common/events/SendCommonAssetsEvent.java` |

## Declaration

```java
public class SendCommonAssetsEvent implements IAsyncEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `packetHandler` | `PacketHandler` | `getPacketHandler()` | The packet handler for the client connection |
| `assets` | `Asset[]` | `getRequestedAssets()` | Array of assets being sent to the client |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPacketHandler` | `public PacketHandler getPacketHandler()` | Returns the packet handler managing the client connection |
| `getRequestedAssets` | `public Asset[] getRequestedAssets()` | Returns the array of assets being transferred |

## Usage Example

```java
import com.hypixel.hytale.server.core.asset.common.events.SendCommonAssetsEvent;
import com.hypixel.hytale.protocol.Asset;
import com.hypixel.hytale.server.core.io.PacketHandler;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class AssetTransferMonitorPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(SendCommonAssetsEvent.class, this::onSendCommonAssets, EventPriority.NORMAL);
    }

    private void onSendCommonAssets(SendCommonAssetsEvent event) {
        PacketHandler packetHandler = event.getPacketHandler();
        Asset[] assets = event.getRequestedAssets();

        // Log asset transfer information
        getLogger().info("Sending " + assets.length + " common assets to client");

        // Track bandwidth usage
        long totalSize = calculateTotalSize(assets);
        getLogger().debug("Total asset transfer size: " + totalSize + " bytes");

        // Monitor for specific assets
        for (Asset asset : assets) {
            trackAssetTransfer(packetHandler, asset);
        }
    }

    private long calculateTotalSize(Asset[] assets) {
        long total = 0;
        for (Asset asset : assets) {
            total += asset.getSize();
        }
        return total;
    }

    private void trackAssetTransfer(PacketHandler handler, Asset asset) {
        // Track individual asset transfers for analytics
    }
}
```

## When This Event Fires

The `SendCommonAssetsEvent` is fired when:

1. **Client connection** - When a client connects and requests common assets
2. **Asset synchronization** - When the server sends shared/common assets to clients

Since this is an **async event**, it fires on a background thread, allowing handlers to:
- Monitor asset transfers without blocking
- Log transfer statistics
- Track bandwidth usage
- Perform async validation

## Understanding Async Events

As an `IAsyncEvent`, this event:
- Fires on a separate thread from the main server thread
- Should not perform blocking operations on the main thread
- Is suitable for I/O-bound operations like logging
- Cannot cancel or block the asset transfer

## Understanding Common Assets

Common assets are shared resources that multiple clients need, including:
- Base game textures and models
- Shared configuration data
- Universal game rules and definitions
- Client-required schemas

## Use Cases

- **Bandwidth Monitoring**: Track data sent to clients
- **Analytics**: Monitor which assets are frequently transferred
- **Debugging**: Log asset transfers for troubleshooting
- **Rate Limiting**: Implement custom throttling logic
- **Caching Analysis**: Understand asset distribution patterns

## Related Events

- [PlayerConnectEvent](../player/player-connect-event) - Fired when a player connects
- [LoadedAssetsEvent](./loaded-assets-event) - Fired when assets finish loading
- [AssetPackRegisterEvent](./asset-pack-register-event) - Fired when asset packs register

## Source Reference

`decompiled/com/hypixel/hytale/server/core/asset/common/events/SendCommonAssetsEvent.java`
