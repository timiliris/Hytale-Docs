---
id: singleplayer-request-access-event
title: SingleplayerRequestAccessEvent
sidebar_label: SingleplayerRequestAccessEvent
---

# SingleplayerRequestAccessEvent

Fired when a singleplayer session requests access to the server. This event allows plugins to intercept, validate, or modify access requests for singleplayer game sessions.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.singleplayer.SingleplayerRequestAccessEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/modules/singleplayer/SingleplayerRequestAccessEvent.java` |

## Declaration

```java
public class SingleplayerRequestAccessEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `access` | `Access` | `getAccess()` | The access request object containing session information |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAccess` | `public Access getAccess()` | Returns the access request object for the singleplayer session |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of the event including the access object |

## Usage Example

```java
import com.hypixel.hytale.server.core.modules.singleplayer.SingleplayerRequestAccessEvent;
import com.hypixel.hytale.protocol.packets.serveraccess.Access;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class SingleplayerAccessPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(SingleplayerRequestAccessEvent.class, this::onRequestAccess, EventPriority.NORMAL);
    }

    private void onRequestAccess(SingleplayerRequestAccessEvent event) {
        Access access = event.getAccess();

        // Log the access request
        getLogger().info("Singleplayer access requested: " + access.toString());

        // Validate the access request
        if (!validateAccess(access)) {
            getLogger().warn("Invalid singleplayer access request");
            return;
        }

        // Initialize singleplayer-specific features
        initializeSingleplayerFeatures(access);

        // Apply any custom access modifications
        customizeAccessPermissions(access);
    }

    private boolean validateAccess(Access access) {
        // Perform validation on the access request
        return true;
    }

    private void initializeSingleplayerFeatures(Access access) {
        // Set up features specific to singleplayer mode
        // This might include:
        // - Pausing functionality
        // - Local save handling
        // - Offline mode features
    }

    private void customizeAccessPermissions(Access access) {
        // Modify permissions for singleplayer
        // Singleplayer might grant additional permissions
    }
}
```

## When This Event Fires

The `SingleplayerRequestAccessEvent` is fired when:

1. **Singleplayer game start** - When a player starts a singleplayer session
2. **Local server initialization** - When the embedded server receives access request
3. **Session resumption** - When returning to a singleplayer world

The event allows handlers to:
- Validate singleplayer access requests
- Initialize singleplayer-specific features
- Apply custom permissions for local play
- Track singleplayer session starts

## Understanding Access

The `Access` object represents the server access request and may contain:
- Session authentication data
- Player identity information
- Requested permissions and capabilities
- Session configuration options

## Singleplayer vs Multiplayer

In singleplayer mode:
- The server runs locally/embedded
- Network latency is minimal
- The player typically has elevated permissions
- Pause functionality may be available
- World data is stored locally

## Use Cases

- **Permission Management**: Grant full permissions in singleplayer
- **Feature Initialization**: Enable singleplayer-only features
- **Session Tracking**: Monitor when singleplayer games start
- **Local Storage**: Initialize local save systems
- **Pause Support**: Set up pause functionality

## Related Events

- [PlayerConnectEvent](../player/player-connect-event) - Fired when any player connects
- [BootEvent](../server/boot-event) - Fired when the server starts
- [PlayerReadyEvent](../player/player-ready-event) - Fired when a player is ready to play

## Source Reference

`decompiled/com/hypixel/hytale/server/core/modules/singleplayer/SingleplayerRequestAccessEvent.java`
