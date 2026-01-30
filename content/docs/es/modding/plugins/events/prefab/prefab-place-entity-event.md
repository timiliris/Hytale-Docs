---
id: prefab-place-entity-event
title: PrefabPlaceEntityEvent
sidebar_label: PrefabPlaceEntityEvent
---

# PrefabPlaceEntityEvent

Fired when an entity is being placed as part of a prefab structure. This event allows plugins to intercept and modify entities that are spawned when a prefab is instantiated in the world.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.prefab.event.PrefabPlaceEntityEvent` |
| **Parent Class** | `EcsEvent` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/prefab/event/PrefabPlaceEntityEvent.java:8` |

## Declaration

```java
public class PrefabPlaceEntityEvent extends EcsEvent {
   private final int prefabId;
   @Nonnull
   private final Holder<EntityStore> holder;
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `prefabId` | `int` | `getPrefabId()` | The unique identifier of the prefab being placed |
| `holder` | `Holder<EntityStore>` | `getHolder()` | The entity holder containing the entity store for the spawned entity |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPrefabId` | `public int getPrefabId()` | Returns the unique identifier of the prefab that triggered this entity placement |
| `getHolder` | `@Nonnull public Holder<EntityStore> getHolder()` | Returns the entity holder for the entity being placed |

## Usage Example

```java
// Register a handler for when entities are placed via prefabs
eventBus.register(PrefabPlaceEntityEvent.class, event -> {
    int prefabId = event.getPrefabId();
    Holder<EntityStore> holder = event.getHolder();

    // Log prefab entity placement
    logger.info("Entity placed from prefab ID: " + prefabId);

    // Access the entity store to modify entity properties
    EntityStore entityStore = holder.get();
    if (entityStore != null) {
        // Customize the spawned entity
        // For example, set custom attributes or tags
    }
});

// Register with specific priority
eventBus.register(EventPriority.NORMAL, PrefabPlaceEntityEvent.class, event -> {
    // Track entities spawned from specific prefabs
    if (event.getPrefabId() == DUNGEON_MONSTER_PREFAB_ID) {
        // Apply dungeon-specific modifications
        Holder<EntityStore> holder = event.getHolder();
        // Enhance entity for dungeon difficulty
    }
});
```

## Common Use Cases

- Modifying entities spawned from prefabs before they are fully initialized
- Tracking which entities come from specific prefab structures
- Applying custom attributes or components to prefab-spawned entities
- Logging prefab entity spawning for debugging or analytics
- Implementing custom spawning logic for dungeon or structure entities
- Adding tags or metadata to entities based on their source prefab

## Related Events

- [PrefabPasteEvent](./prefab-paste-event) - Fired when a prefab structure is being pasted into the world
- [EntityRemoveEvent](../entity/entity-remove-event) - Fired when an entity is removed from the world

## Source Reference

`decompiled/com/hypixel/hytale/server/core/prefab/event/PrefabPlaceEntityEvent.java:8`
