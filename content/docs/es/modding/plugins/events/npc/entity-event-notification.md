---
id: entity-event-notification
title: EntityEventNotification
sidebar_label: EntityEventNotification
---

# EntityEventNotification

An extended event notification class that adds flock/group reference information for entity events. This class enables pack behaviors where an entire group of NPCs can coordinate their response to events affecting group members.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.blackboard.view.event.EntityEventNotification` |
| **Parent Class** | `EventNotification` |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/EntityEventNotification.java:6` |

## Declaration

```java
public class EntityEventNotification extends EventNotification {
   private Ref<EntityStore> flockReference;

   public EntityEventNotification() {
   }
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `flockReference` | `Ref<EntityStore>` | `getFlockReference()` / `setFlockReference()` | Reference to the flock/group the affected entity belongs to |

## Inherited Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `position` | `Vector3d` | `getPosition()` | The 3D position where the event occurred |
| `initiator` | `Ref<EntityStore>` | `getInitiator()` | Reference to the entity that caused the event |
| `set` | `int` | `getSet()` | The event set identifier for filtering |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getFlockReference` | `public Ref<EntityStore> getFlockReference()` | Returns the flock reference of the affected entity |
| `setFlockReference` | `public void setFlockReference(Ref<EntityStore> flockReference)` | Sets the flock reference |

## Inherited Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPosition` | `@Nonnull public Vector3d getPosition()` | Returns the event position |
| `setPosition` | `public void setPosition(double x, double y, double z)` | Sets the event position |
| `getInitiator` | `public Ref<EntityStore> getInitiator()` | Returns the initiating entity |
| `setInitiator` | `public void setInitiator(Ref<EntityStore> initiator)` | Sets the initiating entity |
| `getSet` | `public int getSet()` | Returns the event set |
| `setSet` | `public void setSet(int set)` | Sets the event set |

## Flock Integration

The flock reference is set during event processing in `EntityEventView`:

```java
protected void onEvent(int senderTypeId, double x, double y, double z,
                       Ref<EntityStore> initiator, Ref<EntityStore> skip,
                       ComponentAccessor<EntityStore> componentAccessor, EntityEventType type) {
    // Get the flock membership of the affected entity
    FlockMembership membership = componentAccessor.getComponent(skip, FlockMembership.getComponentType());
    Ref<EntityStore> flockReference = membership != null ? membership.getFlockRef() : null;

    // Set the flock reference on the notification
    this.reusableEventNotification.setFlockReference(flockReference);

    // Process the event
    super.onEvent(senderTypeId, x, y, z, initiator, skip, componentAccessor, type);
}
```

## Usage Example

```java
// Handle entity events with flock awareness
public void onEntityEvent(NPCEntity npc, EntityEventType type, EntityEventNotification notification) {
    // Get basic event info
    Vector3d eventPos = notification.getPosition();
    Ref<EntityStore> initiator = notification.getInitiator();

    // Check if this affects a flock member
    Ref<EntityStore> flockRef = notification.getFlockReference();

    if (flockRef != null && flockRef.isValid()) {
        // Event affects a member of a flock
        if (type == EntityEventType.DAMAGE) {
            // Alert the entire flock about the threat
            alertFlock(flockRef, initiator, eventPos);
        } else if (type == EntityEventType.DEATH) {
            // Flock member died - update group behavior
            onFlockMemberDeath(flockRef, eventPos);
        }
    }
}

// Coordinate flock response to threats
public void alertFlock(Ref<EntityStore> flockRef, Ref<EntityStore> threat, Vector3d position) {
    FlockComponent flock = getFlockComponent(flockRef);

    for (Ref<EntityStore> member : flock.getMembers()) {
        NPCEntity memberNpc = getNpcEntity(member);
        if (memberNpc != null) {
            // All flock members become aware of the threat
            memberNpc.setThreat(threat);
            memberNpc.setAlertLevel(AlertLevel.HIGH);
        }
    }
}

// Check if NPC is in the same flock as the affected entity
public boolean isSameFlockEvent(NPCEntity npc, EntityEventNotification notification) {
    Ref<EntityStore> eventFlockRef = notification.getFlockReference();
    Ref<EntityStore> npcFlockRef = npc.getFlockReference();

    if (eventFlockRef == null || npcFlockRef == null) {
        return false;
    }

    return eventFlockRef.equals(npcFlockRef);
}

// Implement pack hunting response
public void onPackMemberAttack(NPCEntity npc, EntityEventNotification notification) {
    if (isSameFlockEvent(npc, notification)) {
        // Pack member attacked something - join the fight
        Ref<EntityStore> target = notification.getInitiator();
        npc.setTarget(target);
        npc.setState(NPCState.COMBAT);
    }
}
```

## Common Use Cases

- Implementing pack/herd behavior where groups respond together
- Creating wolf pack AI where attacking one alerts the pack
- Building tribal NPCs that defend group members
- Implementing coordinated group combat
- Creating flocking behaviors for birds or fish
- Building guard patrols that share threat information
- Implementing mourning or retreat behaviors on member death

## Pack Behavior Examples

### Alert on Damage
When a pack member takes damage, alert nearby pack members to the threat.

### Coordinated Attack
When one pack member engages in combat, nearby members join.

### Retreat on Death
When a pack member dies, surviving members may flee or become enraged.

### Group Investigation
When a pack member detects something, the group investigates together.

## Related Types

- [EventNotification](./event-notification) - Base notification class
- [EntityEventView](./entity-event-view) - View that creates these notifications
- [EntityEventType](./entity-event-type) - Types of entity events

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/EntityEventNotification.java:6`
