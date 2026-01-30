---
id: prefab-paste-event
title: PrefabPasteEvent
sidebar_label: PrefabPasteEvent
---

# PrefabPasteEvent

Fired when a prefab structure is being pasted into the world. This is a cancellable event that allows plugins to intercept prefab pasting operations, either at the start or end of the paste process.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.prefab.event.PrefabPasteEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/prefab/event/PrefabPasteEvent.java:5` |

## Declaration

```java
public class PrefabPasteEvent extends CancellableEcsEvent {
   private final int prefabId;
   private final boolean pasteStart;
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `prefabId` | `int` | `getPrefabId()` | The unique identifier of the prefab being pasted |
| `pasteStart` | `boolean` | `isPasteStart()` | Whether this event is fired at the start (true) or end (false) of the paste operation |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPrefabId` | `public int getPrefabId()` | Returns the unique identifier of the prefab being pasted |
| `isPasteStart` | `public boolean isPasteStart()` | Returns true if this event is at the start of paste, false if at the end |
| `isCancelled` | `public boolean isCancelled()` | Returns whether this event has been cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancellation state of this event |

## Usage Example

```java
// Register a handler for prefab paste events
eventBus.register(PrefabPasteEvent.class, event -> {
    int prefabId = event.getPrefabId();
    boolean isStart = event.isPasteStart();

    if (isStart) {
        // Prefab paste is starting
        logger.info("Starting to paste prefab ID: " + prefabId);

        // Check if this prefab is allowed in this area
        if (!isPrefabAllowedInRegion(prefabId)) {
            event.setCancelled(true);
            return;
        }
    } else {
        // Prefab paste has completed
        logger.info("Finished pasting prefab ID: " + prefabId);
        // Perform post-paste operations
    }
});

// Cancel specific prefabs from being pasted
eventBus.register(EventPriority.FIRST, PrefabPasteEvent.class, event -> {
    // Prevent certain prefabs from being pasted
    if (isRestrictedPrefab(event.getPrefabId()) && event.isPasteStart()) {
        event.setCancelled(true);
        logger.warn("Blocked restricted prefab paste attempt: " + event.getPrefabId());
    }
});

// Track prefab placements for world generation analytics
eventBus.register(PrefabPasteEvent.class, event -> {
    if (!event.isPasteStart()) {
        // Record completed paste for analytics
        analyticsTracker.recordPrefabPaste(event.getPrefabId());
    }
});
```

## Common Use Cases

- Preventing specific prefabs from being pasted in certain regions
- Logging prefab placement for debugging world generation
- Triggering custom logic when structures are generated
- Implementing prefab placement restrictions based on game rules
- Tracking structure generation for analytics or achievements
- Modifying world state before or after prefab placement
- Implementing protection zones where prefabs cannot be placed

## Related Events

- [PrefabPlaceEntityEvent](./prefab-place-entity-event) - Fired when an entity is placed as part of a prefab
- [PlaceBlockEvent](../block/place-block-event) - Fired when individual blocks are placed
- [BreakBlockEvent](../block/break-block-event) - Fired when blocks are broken

## Source Reference

`decompiled/com/hypixel/hytale/server/core/prefab/event/PrefabPasteEvent.java:5`
