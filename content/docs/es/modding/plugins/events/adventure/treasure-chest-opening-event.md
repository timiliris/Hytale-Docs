---
id: treasure-chest-opening-event
title: TreasureChestOpeningEvent
sidebar_label: TreasureChestOpeningEvent
---

# TreasureChestOpeningEvent

Fired when a player opens a treasure chest as part of an adventure objective. This event allows plugins to track treasure discovery, modify loot behavior, or implement custom quest mechanics.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.builtin.adventure.objectives.events.TreasureChestOpeningEvent` |
| **Parent Class** | `IEvent<String>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/builtin/adventure/objectives/events/TreasureChestOpeningEvent.java` |

## Declaration

```java
public class TreasureChestOpeningEvent implements IEvent<String> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `objectiveUUID` | `UUID` | `getObjectiveUUID()` | The unique identifier of the adventure objective associated with this chest |
| `chestUUID` | `UUID` | `getChestUUID()` | The unique identifier of the treasure chest being opened |
| `playerRef` | `Ref<EntityStore>` | `getPlayerRef()` | Reference to the player entity opening the chest |
| `store` | `Store<EntityStore>` | `getStore()` | The entity store containing the player data |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getObjectiveUUID` | `@Nonnull public UUID getObjectiveUUID()` | Returns the UUID of the adventure objective this chest belongs to |
| `getChestUUID` | `@Nonnull public UUID getChestUUID()` | Returns the UUID of the treasure chest entity |
| `getPlayerRef` | `@Nonnull public Ref<EntityStore> getPlayerRef()` | Returns a reference to the player opening the chest |
| `getStore` | `@Nonnull public Store<EntityStore> getStore()` | Returns the entity store for accessing player components |

## Usage Example

```java
import com.hypixel.hytale.builtin.adventure.objectives.events.TreasureChestOpeningEvent;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class TreasureTrackerPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(TreasureChestOpeningEvent.class, this::onTreasureChestOpen, EventPriority.NORMAL);
    }

    private void onTreasureChestOpen(TreasureChestOpeningEvent event) {
        UUID objectiveId = event.getObjectiveUUID();
        UUID chestId = event.getChestUUID();
        Ref<EntityStore> playerRef = event.getPlayerRef();

        // Log treasure discovery
        getLogger().info("Player opened treasure chest " + chestId + " for objective " + objectiveId);

        // Track progress for custom quest systems
        trackQuestProgress(playerRef, objectiveId);

        // Award bonus rewards or trigger special effects
        grantBonusRewards(playerRef, event.getStore());
    }

    private void trackQuestProgress(Ref<EntityStore> playerRef, UUID objectiveId) {
        // Custom quest tracking implementation
    }

    private void grantBonusRewards(Ref<EntityStore> playerRef, Store<EntityStore> store) {
        // Custom reward implementation
    }
}
```

## When This Event Fires

The `TreasureChestOpeningEvent` is fired when:

1. **Player interacts with a treasure chest** - When a player successfully opens a treasure chest that is part of an adventure objective
2. **Quest-related chest discovery** - When the chest opening is tied to an active objective in the adventure system

The event fires **during** the chest opening process, allowing handlers to:
- Track which chests players have discovered
- Implement custom loot tables or bonus rewards
- Update quest progression systems
- Trigger achievement unlocks or special effects

## Use Cases

- **Quest Systems**: Track when players complete treasure-finding objectives
- **Achievement Tracking**: Award achievements for discovering rare treasure chests
- **Custom Loot**: Modify or enhance loot drops based on player progress
- **Statistics**: Record treasure hunting statistics per player
- **Event Triggers**: Start special events when certain chests are opened

## Related Events

- [DiscoverInstanceEvent](../instance/discover-instance-event) - Fired when a player discovers a new instance
- [DiscoverZoneEvent](../zone/discover-zone-event) - Fired when a player discovers a new zone

## Source Reference

`decompiled/com/hypixel/hytale/builtin/adventure/objectives/events/TreasureChestOpeningEvent.java`
