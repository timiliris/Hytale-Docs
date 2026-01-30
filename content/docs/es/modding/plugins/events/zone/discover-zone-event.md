---
id: discover-zone-event
title: DiscoverZoneEvent
sidebar_label: DiscoverZoneEvent
---

# DiscoverZoneEvent

Fired when a player discovers a new zone in the world. Zones are named areas within the game world that players can explore. This abstract event class provides zone discovery information and contains a nested Display event that allows control over the discovery notification.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.DiscoverZoneEvent` |
| **Parent Class** | `EcsEvent` |
| **Cancellable** | No (base class) |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DiscoverZoneEvent.java:8` |

## Declaration

```java
public abstract class DiscoverZoneEvent extends EcsEvent {
   @Nonnull
   private final WorldMapTracker.ZoneDiscoveryInfo discoveryInfo;
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `discoveryInfo` | `WorldMapTracker.ZoneDiscoveryInfo` | `getDiscoveryInfo()` | Information about the zone being discovered |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getDiscoveryInfo` | `@Nonnull public WorldMapTracker.ZoneDiscoveryInfo getDiscoveryInfo()` | Returns the discovery information for this zone |

## Nested Event Classes

### DiscoverZoneEvent.Display

Fired when the zone discovery notification is about to be displayed. This cancellable event allows plugins to control whether the zone discovery popup is shown to the player.

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.DiscoverZoneEvent.Display` |
| **Parent Class** | `DiscoverZoneEvent` |
| **Implements** | `ICancellableEcsEvent` |
| **Cancellable** | Yes |

#### Declaration

```java
public static class Display extends DiscoverZoneEvent implements ICancellableEcsEvent {
   private boolean cancelled = false;
```

#### Additional Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `cancelled` | `boolean` | `isCancelled()` / `setCancelled()` | Whether the event is cancelled |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `isCancelled` | `public boolean isCancelled()` | Returns whether this event has been cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancellation state of this event |

## Usage Example

```java
// Handle zone discovery display events
eventBus.register(DiscoverZoneEvent.Display.class, event -> {
    WorldMapTracker.ZoneDiscoveryInfo info = event.getDiscoveryInfo();

    // Log the zone discovery
    logger.info("Player discovered zone: " + info.getZoneName());

    // Check if we want to suppress the display
    if (isZoneDisplaySuppressed(info)) {
        event.setCancelled(true);
    }
});

// Track zone discoveries for achievements
eventBus.register(DiscoverZoneEvent.Display.class, event -> {
    WorldMapTracker.ZoneDiscoveryInfo info = event.getDiscoveryInfo();

    // Award exploration achievement
    achievementManager.checkZoneDiscovery(info.getZoneName());

    // Update player's explored zones
    playerData.addDiscoveredZone(info);
});

// Custom zone discovery notifications
eventBus.register(DiscoverZoneEvent.Display.class, event -> {
    WorldMapTracker.ZoneDiscoveryInfo info = event.getDiscoveryInfo();

    // Send custom notification based on zone type
    if (isDangerousZone(info)) {
        player.sendMessage("Warning: You are entering a dangerous area!");
    }
});

// Implement exploration percentage tracking
eventBus.register(DiscoverZoneEvent.Display.class, event -> {
    WorldMapTracker.ZoneDiscoveryInfo info = event.getDiscoveryInfo();

    // Update exploration progress
    int totalZones = worldZoneManager.getTotalZoneCount();
    int discoveredZones = playerData.getDiscoveredZoneCount() + 1;
    float explorationPercent = (float) discoveredZones / totalZones * 100;

    logger.info("Exploration progress: " + explorationPercent + "%");
});

// Hide zone discovery for players who revisit
eventBus.register(DiscoverZoneEvent.Display.class, event -> {
    WorldMapTracker.ZoneDiscoveryInfo info = event.getDiscoveryInfo();

    // Don't show popup for already discovered zones
    if (playerData.hasDiscoveredZone(info.getZoneName())) {
        event.setCancelled(true);
    }
});
```

## Common Use Cases

- Tracking player exploration progress across the world map
- Implementing zone discovery achievements and rewards
- Customizing zone discovery notifications
- Creating exploration-based quests and objectives
- Hiding repeated zone discovery notifications
- Logging zone discoveries for analytics
- Triggering zone-specific events when players enter new areas
- Implementing fog of war or map reveal mechanics
- Adding custom sounds or effects for zone discovery
- Creating tiered exploration rewards

## Related Events

- [DiscoverInstanceEvent](../instance/discover-instance-event) - Fired when a player discovers a new instance
- [AddPlayerToWorldEvent](../player/add-player-to-world-event) - Fired when a player is added to a world
- [StartWorldEvent](../world/start-world-event) - Fired when a world starts

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/DiscoverZoneEvent.java:8`
