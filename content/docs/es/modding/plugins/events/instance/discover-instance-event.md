---
id: discover-instance-event
title: DiscoverInstanceEvent
sidebar_label: DiscoverInstanceEvent
---

# DiscoverInstanceEvent

Fired when a player discovers a new instance (such as a dungeon or special world instance). This abstract event class contains a nested Display event that allows control over whether the discovery notification is shown to the player.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.builtin.instances.event.DiscoverInstanceEvent` |
| **Parent Class** | `EcsEvent` |
| **Cancellable** | No (base class) |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/builtin/instances/event/DiscoverInstanceEvent.java:9` |

## Declaration

```java
public abstract class DiscoverInstanceEvent extends EcsEvent {
   @Nonnull
   private final UUID instanceWorldUuid;
   @Nonnull
   private final InstanceDiscoveryConfig discoveryConfig;
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `instanceWorldUuid` | `UUID` | `getInstanceWorldUuid()` | The unique identifier of the discovered instance world |
| `discoveryConfig` | `InstanceDiscoveryConfig` | `getDiscoveryConfig()` | Configuration for the instance discovery (display settings, etc.) |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getInstanceWorldUuid` | `@Nonnull public UUID getInstanceWorldUuid()` | Returns the UUID of the discovered instance world |
| `getDiscoveryConfig` | `@Nonnull public InstanceDiscoveryConfig getDiscoveryConfig()` | Returns the discovery configuration for this instance |

## Nested Event Classes

### DiscoverInstanceEvent.Display

Fired when the instance discovery notification is about to be displayed. This cancellable event allows plugins to control whether the discovery popup is shown and customize display behavior.

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.builtin.instances.event.DiscoverInstanceEvent.Display` |
| **Parent Class** | `DiscoverInstanceEvent` |
| **Implements** | `ICancellableEcsEvent` |
| **Cancellable** | Yes |

#### Declaration

```java
public static class Display extends DiscoverInstanceEvent implements ICancellableEcsEvent {
   private boolean cancelled = false;
   private boolean display;
```

#### Additional Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `cancelled` | `boolean` | `isCancelled()` / `setCancelled()` | Whether the event is cancelled |
| `display` | `boolean` | `shouldDisplay()` / `setDisplay()` | Whether the discovery notification should be displayed |

#### Additional Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `isCancelled` | `public boolean isCancelled()` | Returns whether this event has been cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancellation state of this event |
| `shouldDisplay` | `public boolean shouldDisplay()` | Returns whether the discovery notification should be displayed |
| `setDisplay` | `public void setDisplay(boolean display)` | Sets whether the discovery notification should be displayed |

## Usage Example

```java
// Handle instance discovery display events
eventBus.register(DiscoverInstanceEvent.Display.class, event -> {
    UUID instanceUuid = event.getInstanceWorldUuid();
    InstanceDiscoveryConfig config = event.getDiscoveryConfig();

    // Log the discovery
    logger.info("Player discovered instance: " + instanceUuid);

    // Check if we should display the notification
    if (!event.shouldDisplay()) {
        return;
    }

    // Optionally hide the display for certain instances
    if (isHiddenInstance(instanceUuid)) {
        event.setDisplay(false);
    }
});

// Cancel discovery notifications for certain players
eventBus.register(DiscoverInstanceEvent.Display.class, event -> {
    // Don't show discovery popups for players who have already visited
    if (playerHasVisitedInstance(event.getInstanceWorldUuid())) {
        event.setCancelled(true);
    }
});

// Track instance discoveries for achievements
eventBus.register(DiscoverInstanceEvent.Display.class, event -> {
    UUID instanceUuid = event.getInstanceWorldUuid();
    InstanceDiscoveryConfig config = event.getDiscoveryConfig();

    // Award discovery achievement
    achievementManager.checkInstanceDiscovery(instanceUuid);

    // Update player's discovered instances list
    playerData.addDiscoveredInstance(instanceUuid);
});

// Customize display based on instance type
eventBus.register(DiscoverInstanceEvent.Display.class, event -> {
    InstanceDiscoveryConfig config = event.getDiscoveryConfig();

    // Only show notification for significant discoveries
    if (!config.isDisplay()) {
        event.setDisplay(false);
    }
});
```

## Common Use Cases

- Tracking which instances players have discovered
- Implementing instance discovery achievements
- Customizing discovery notifications based on instance type
- Hiding discovery popups for revisited instances
- Logging instance discovery for analytics
- Triggering custom events when players find new dungeons
- Implementing progressive instance unlocking systems
- Creating custom discovery animations or sounds

## Related Events

- [DiscoverZoneEvent](../zone/discover-zone-event) - Fired when a player discovers a new zone
- [AddWorldEvent](../world/add-world-event) - Fired when a world is added to the universe
- [AddPlayerToWorldEvent](../player/add-player-to-world-event) - Fired when a player is added to a world

## Source Reference

`decompiled/com/hypixel/hytale/builtin/instances/event/DiscoverInstanceEvent.java:9`
