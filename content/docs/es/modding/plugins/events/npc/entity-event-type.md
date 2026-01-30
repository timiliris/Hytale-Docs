---
id: entity-event-type
title: EntityEventType
sidebar_label: EntityEventType
---

# EntityEventType

An enumeration that defines the types of entity-related events that NPCs can listen and respond to. These event types are used by the NPC blackboard system to trigger AI behaviors when specific entity interactions occur.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.blackboard.view.event.entity.EntityEventType` |
| **Type** | `enum` |
| **Implements** | `Supplier<String>` |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/entity/EntityEventType.java:5` |

## Declaration

```java
public enum EntityEventType implements Supplier<String> {
   DAMAGE("On taking damage"),
   DEATH("On dying"),
   INTERACTION("On use interaction");

   public static final EntityEventType[] VALUES = values();
   private final String description;
```

## Enum Values

| Value | Description | Trigger Condition |
|-------|-------------|-------------------|
| `DAMAGE` | "On taking damage" | Fired when an entity receives damage from any source |
| `DEATH` | "On dying" | Fired when an entity dies |
| `INTERACTION` | "On use interaction" | Fired when a player uses the interact action on an entity |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `VALUES` | `EntityEventType[]` | (static) | Cached array of all enum values for iteration |
| `description` | `String` | `get()` | Human-readable description of the event type |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `public String get()` | Returns the human-readable description of this event type |
| `values` | `public static EntityEventType[] values()` | Returns all enum values (standard Java enum method) |
| `valueOf` | `public static EntityEventType valueOf(String name)` | Returns the enum constant with the specified name |

## Usage Example

```java
// Iterate through all entity event types
for (EntityEventType type : EntityEventType.VALUES) {
    logger.info("Event type: " + type.name() + " - " + type.get());
}

// Check specific event type
public void handleEntityEvent(EntityEventType eventType, Entity entity) {
    switch (eventType) {
        case DAMAGE:
            // Handle damage event - NPC was attacked
            onNpcDamaged(entity);
            break;
        case DEATH:
            // Handle death event - NPC died
            onNpcDeath(entity);
            break;
        case INTERACTION:
            // Handle interaction - player interacted with NPC
            onNpcInteraction(entity);
            break;
    }
}

// Register NPC for specific event types
public void setupNpcEventListeners(NPCEntity npc) {
    // Make NPC react to damage
    npc.registerForEvent(EntityEventType.DAMAGE, this::onDamageReceived);

    // Make NPC react to nearby deaths
    npc.registerForEvent(EntityEventType.DEATH, this::onNearbyDeath);
}

// Get description for UI display
public String getEventTypeLabel(EntityEventType type) {
    return type.get(); // Returns "On taking damage", "On dying", etc.
}
```

## Common Use Cases

- Configuring NPC AI responses to combat events
- Setting up alert systems when NPCs take damage
- Triggering death animations or loot drops
- Implementing dialog or quest interactions
- Creating guard NPCs that respond to attacks
- Building companion AI that reacts to player interactions
- Implementing mob pack behaviors (group aggro on damage)

## Integration with EntityEventView

EntityEventType is used by `EntityEventView` to register and dispatch entity events to listening NPCs:

```java
// EntityEventView processes these events
public class EntityEventView extends EventView<...> {
    public EntityEventView(@Nonnull World world) {
        // Register handlers for each event type
        for (EntityEventType eventType : EntityEventType.VALUES) {
            this.entityMapsByEventType.put(eventType, new EventTypeRegistration<>(...));
        }
    }

    // Process attack events (DAMAGE, DEATH)
    public void processAttackedEvent(
        Ref<EntityStore> victim,
        Ref<EntityStore> attacker,
        ComponentAccessor<EntityStore> componentAccessor,
        EntityEventType eventType
    ) {
        // Dispatch to listening NPCs
    }
}
```

## Related Types

- [BlockEventType](./block-event-type) - Similar enum for block-related events
- [EntityEventView](./entity-event-view) - View that processes entity events
- [EventNotification](./event-notification) - Data class for event notifications

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/entity/EntityEventType.java:5`
