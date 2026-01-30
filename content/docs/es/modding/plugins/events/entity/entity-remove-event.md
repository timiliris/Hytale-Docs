---
id: entity-remove-event
title: EntityRemoveEvent
sidebar_label: EntityRemoveEvent
---

# EntityRemoveEvent

The `EntityRemoveEvent` is fired when an entity is being removed from the world. This event provides plugins with an opportunity to perform cleanup operations or track entity removal.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.entity.EntityRemoveEvent` |
| **Parent Class** | `EntityEvent<Entity, String>` |
| **Cancellable** | No |
| **Async** | No |
| **Key Type** | `String` |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/entity/EntityRemoveEvent.java:6` |

## Declaration

```java
public class EntityRemoveEvent extends EntityEvent<Entity, String> {
    public EntityRemoveEvent(Entity entity) {
        super(entity);
    }

    @Nonnull
    @Override
    public String toString() {
        return "EntityRemoveEvent{} " + super.toString();
    }
}
```

## Parent Class: EntityEvent

The `EntityRemoveEvent` extends `EntityEvent`, which provides access to the entity being affected:

```java
public abstract class EntityEvent<EntityType extends Entity, KeyType> implements IEvent<KeyType> {
    private final EntityType entity;

    public EntityEvent(EntityType entity) {
        this.entity = entity;
    }

    public EntityType getEntity() {
        return this.entity;
    }

    @Nonnull
    @Override
    public String toString() {
        return "EntityEvent{entity=" + this.entity + "}";
    }
}
```

## Fields

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `entity` | `Entity` | The entity being removed from the world | `getEntity()` |

## Methods

### Inherited from EntityEvent

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getEntity()` | `Entity` | Returns the entity being removed |
| `toString()` | `@Nonnull String` | Returns a string representation of the event |

## Usage Example

### Basic Entity Removal Tracking

```java
import com.hypixel.hytale.server.core.event.events.entity.EntityRemoveEvent;
import com.hypixel.hytale.event.EventBus;

public class EntityTrackerPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Listen for all entity removal events
        eventBus.registerGlobal(EntityRemoveEvent.class, this::onEntityRemove);
    }

    private void onEntityRemove(EntityRemoveEvent event) {
        Entity entity = event.getEntity();
        getLogger().info("Entity removed: " + entity.getClass().getSimpleName());
    }
}
```

### Entity Statistics Tracking

```java
import com.hypixel.hytale.server.core.event.events.entity.EntityRemoveEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class EntityStatsPlugin extends PluginBase {

    private final ConcurrentHashMap<String, AtomicInteger> removalStats = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(EntityRemoveEvent.class, this::trackRemoval);
    }

    private void trackRemoval(EntityRemoveEvent event) {
        Entity entity = event.getEntity();
        String entityType = entity.getClass().getSimpleName();

        removalStats.computeIfAbsent(entityType, k -> new AtomicInteger(0))
                   .incrementAndGet();
    }

    public int getRemovalCount(String entityType) {
        AtomicInteger count = removalStats.get(entityType);
        return count != null ? count.get() : 0;
    }

    public ConcurrentHashMap<String, AtomicInteger> getAllStats() {
        return new ConcurrentHashMap<>(removalStats);
    }
}
```

### Cleanup Associated Data

```java
import com.hypixel.hytale.server.core.event.events.entity.EntityRemoveEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class EntityDataPlugin extends PluginBase {

    private final ConcurrentHashMap<UUID, CustomEntityData> entityData = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(EntityRemoveEvent.class, this::cleanupEntityData);
    }

    private void cleanupEntityData(EntityRemoveEvent event) {
        Entity entity = event.getEntity();

        // Get entity UUID if available
        UUID entityId = getEntityUUID(entity);
        if (entityId != null) {
            // Remove associated custom data
            CustomEntityData data = entityData.remove(entityId);
            if (data != null) {
                getLogger().info("Cleaned up data for entity: " + entityId);
                data.dispose();
            }
        }
    }

    public void setEntityData(UUID entityId, CustomEntityData data) {
        entityData.put(entityId, data);
    }

    public CustomEntityData getEntityData(UUID entityId) {
        return entityData.get(entityId);
    }

    private UUID getEntityUUID(Entity entity) {
        // Implementation depends on entity type
        return null; // Placeholder
    }

    private static class CustomEntityData {
        void dispose() {
            // Cleanup resources
        }
    }
}
```

### Specific Entity Type Handling

```java
import com.hypixel.hytale.server.core.event.events.entity.EntityRemoveEvent;
import com.hypixel.hytale.event.EventBus;

public class MonsterTrackerPlugin extends PluginBase {

    private int monstersKilled = 0;

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(EntityRemoveEvent.class, this::onEntityRemove);
    }

    private void onEntityRemove(EntityRemoveEvent event) {
        Entity entity = event.getEntity();

        // Check if the entity is a monster type
        if (isMonster(entity)) {
            monstersKilled++;
            getLogger().info("Monster removed! Total: " + monstersKilled);
        }
    }

    private boolean isMonster(Entity entity) {
        // Check entity type - implementation depends on entity hierarchy
        String typeName = entity.getClass().getSimpleName().toLowerCase();
        return typeName.contains("zombie") ||
               typeName.contains("skeleton") ||
               typeName.contains("trork");
    }

    public int getMonstersKilled() {
        return monstersKilled;
    }
}
```

### Entity Removal Logging

```java
import com.hypixel.hytale.server.core.event.events.entity.EntityRemoveEvent;
import com.hypixel.hytale.event.EventBus;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class EntityLoggerPlugin extends PluginBase {

    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(EntityRemoveEvent.class, this::logEntityRemoval);
    }

    private void logEntityRemoval(EntityRemoveEvent event) {
        Entity entity = event.getEntity();
        String timestamp = LocalDateTime.now().format(FORMATTER);
        String entityType = entity.getClass().getSimpleName();

        // Get position if available
        String position = getEntityPosition(entity);

        getLogger().info(String.format("[%s] Entity removed: %s at %s",
            timestamp, entityType, position));
    }

    private String getEntityPosition(Entity entity) {
        // Get position from entity - implementation depends on Entity API
        return "unknown";
    }
}
```

## When This Event Fires

The `EntityRemoveEvent` fires when an entity is being removed from the world. This can occur due to:

1. Entity death or destruction
2. Despawning due to distance from players
3. Administrative removal
4. World unloading
5. Chunk unloading
6. Entity transformation into another entity type
7. Game mechanics that remove entities

The event fires:
- After the decision to remove has been made
- Before the entity is fully removed from the world
- While entity data is still accessible

## Important Notes

1. **Non-cancellable**: This event cannot be cancelled. The entity will be removed regardless.

2. **Access while valid**: The entity reference is still valid during the event, allowing you to access its properties.

3. **Cleanup timing**: Use this event for cleanup operations that need to happen when entities are removed.

4. **Key-based filtering**: The event uses `String` as its key type, which may be used for entity type filtering.

## Related Events

| Event | Description |
|-------|-------------|
| [LivingEntityInventoryChangeEvent](./living-entity-inventory-change-event) | Fired when a living entity's inventory changes |
| [AddPlayerToWorldEvent](/docs/en/modding/plugins/events/player/add-player-to-world-event) | Fired when a player is added to a world |
| [DrainPlayerFromWorldEvent](/docs/en/modding/plugins/events/player/drain-player-from-world-event) | Fired when a player is removed from a world |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events.entity`
- **Hierarchy**: `EntityRemoveEvent` -> `EntityEvent<Entity, String>` -> `IEvent<String>` -> `IBaseEvent<String>`
- **Event System**: Standard synchronous event dispatched via `EventBus`
