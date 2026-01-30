---
id: entity-event-view
title: EntityEventView
sidebar_label: EntityEventView
---

# EntityEventView

A blackboard view component that manages entity-related event notifications for NPCs. This class handles the registration, filtering, and dispatching of entity events (damage, death, interaction) to NPCs that are configured to listen for them.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.blackboard.view.event.entity.EntityEventView` |
| **Parent Class** | `EventView<EntityEventView, EntityEventType, EntityEventNotification>` |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/entity/EntityEventView.java:28` |

## Declaration

```java
public class EntityEventView extends EventView<EntityEventView, EntityEventType, EntityEventNotification> {
    public EntityEventView(@Nonnull World world) {
        super(EntityEventType.class, EntityEventType.VALUES, new EntityEventNotification(), world);
        this.eventRegistry.register(PlayerInteractEvent.class, world.getName(), this::onPlayerInteraction);

        for (EntityEventType eventType : EntityEventType.VALUES) {
            this.entityMapsByEventType.put(
                eventType,
                new EventTypeRegistration<>(
                    eventType,
                    (set, roleIndex) -> TagSetPlugin.get(NPCGroup.class).tagInSet(set, roleIndex),
                    NPCEntity::notifyEntityEvent
                )
            );
        }
    }
```

## Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `world` | `World` | The world this view is associated with |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getUpdatedView` | `public EntityEventView getUpdatedView(@Nonnull Ref<EntityStore> ref, @Nonnull ComponentAccessor<EntityStore> componentAccessor)` | Returns the view for the entity's current world |
| `initialiseEntity` | `public void initialiseEntity(@Nonnull Ref<EntityStore> ref, @Nonnull NPCEntity npcComponent)` | Registers an NPC's event listeners |
| `onEvent` | `protected void onEvent(int senderTypeId, double x, double y, double z, Ref<EntityStore> initiator, @Nonnull Ref<EntityStore> skip, @Nonnull ComponentAccessor<EntityStore> componentAccessor, EntityEventType type)` | Processes and dispatches an entity event (sets flock reference) |
| `processAttackedEvent` | `public void processAttackedEvent(@Nonnull Ref<EntityStore> victim, @Nonnull Ref<EntityStore> attacker, @Nonnull ComponentAccessor<EntityStore> componentAccessor, EntityEventType eventType)` | Handles damage and death events |

## Key Features

### Event Registration

The view automatically registers for `PlayerInteractEvent` to handle NPC interactions:

```java
this.eventRegistry.register(PlayerInteractEvent.class, world.getName(), this::onPlayerInteraction);
```

### NPC Group Filtering

Events are filtered based on NPC groups using the TagSetPlugin:

```java
(set, roleIndex) -> TagSetPlugin.get(NPCGroup.class).tagInSet(set, roleIndex)
```

### Flock Reference Tracking

When processing events, the view tracks flock membership for group AI behaviors:

```java
FlockMembership membership = componentAccessor.getComponent(skip, FlockMembership.getComponentType());
Ref<EntityStore> flockReference = membership != null ? membership.getFlockRef() : null;
this.reusableEventNotification.setFlockReference(flockReference);
```

## Usage Example

```java
// The EntityEventView is typically managed by the Blackboard system
// Access it through the blackboard resource
Blackboard blackboard = componentAccessor.getResource(Blackboard.getResourceType());
EntityEventView entityView = blackboard.getView(EntityEventView.class, ref, componentAccessor);

// Initialize an NPC's event listeners
public void setupNpcEvents(Ref<EntityStore> ref, NPCEntity npc, EntityEventView view) {
    view.initialiseEntity(ref, npc);
}

// Process an attack event (called by damage systems)
public void onEntityAttacked(Ref<EntityStore> victim, Ref<EntityStore> attacker,
                             ComponentAccessor<EntityStore> accessor) {
    EntityEventView view = getEntityEventView(accessor);

    // Notify NPCs of the damage event
    view.processAttackedEvent(victim, attacker, accessor, EntityEventType.DAMAGE);
}

// Process a death event
public void onEntityDeath(Ref<EntityStore> victim, Ref<EntityStore> killer,
                          ComponentAccessor<EntityStore> accessor) {
    EntityEventView view = getEntityEventView(accessor);

    // Notify NPCs of the death event
    view.processAttackedEvent(victim, killer, accessor, EntityEventType.DEATH);
}
```

## Event Flow

1. **Event Trigger**: An entity event occurs (damage, death, or interaction)
2. **View Lookup**: The appropriate `EntityEventView` is retrieved for the world
3. **Event Processing**: The view calls `onEvent` or `processAttackedEvent`
4. **NPC Filtering**: Events are filtered by NPC group/role
5. **Notification**: Matching NPCs receive the event via `NPCEntity::notifyEntityEvent`
6. **AI Response**: NPCs process the event through their behavior trees

## Player Interaction Handling

The view handles player interactions with NPCs through the private `onPlayerInteraction` method:

```java
private void onPlayerInteraction(PlayerInteractEvent event) {
    Player playerComponent = event.getPlayer();
    // ... game mode checks ...

    Entity entity = event.getTargetEntity();
    if (entity != null && event.getActionType() == InteractionType.Use && entity instanceof NPCEntity) {
        // Dispatch INTERACTION event to nearby listening NPCs
        this.onEvent(npc.getRoleIndex(), pos.x, pos.y, pos.z, playerRef, entityRef,
                     store, EntityEventType.INTERACTION);
    }
}
```

## Common Use Cases

- Managing NPC awareness of nearby combat
- Dispatching interaction events to quest NPCs
- Coordinating group AI responses to threats
- Implementing alert systems for guard NPCs
- Triggering faction-wide responses to attacks
- Managing NPC death notifications for pack behavior

## Related Types

- [EntityEventType](./entity-event-type) - Enum of entity event types
- [EntityEventNotification](./entity-event-notification) - Event notification data
- [BlockEventView](./block-event-view) - Similar view for block events
- [EventView](./event-view) - Base class for event views

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/entity/EntityEventView.java:28`
