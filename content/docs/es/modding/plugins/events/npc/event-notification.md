---
id: event-notification
title: EventNotification
sidebar_label: EventNotification
---

# EventNotification

A data class that carries information about NPC blackboard events. This class provides the context needed for NPCs to respond to events, including the position where the event occurred and the entity that initiated it.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.blackboard.view.event.EventNotification` |
| **Parent Class** | `Object` |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/EventNotification.java:7` |

## Declaration

```java
public class EventNotification {
   private final Vector3d position = new Vector3d();
   private Ref<EntityStore> initiator;
   private int set;

   public EventNotification() {
   }
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `position` | `Vector3d` | `getPosition()` | The 3D position where the event occurred |
| `initiator` | `Ref<EntityStore>` | `getInitiator()` / `setInitiator()` | Reference to the entity that caused the event |
| `set` | `int` | `getSet()` / `setSet()` | The event set identifier for filtering |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPosition` | `@Nonnull public Vector3d getPosition()` | Returns the position vector (mutable for reuse) |
| `setPosition` | `public void setPosition(double x, double y, double z)` | Sets the event position coordinates |
| `getInitiator` | `public Ref<EntityStore> getInitiator()` | Returns the entity that initiated the event |
| `setInitiator` | `public void setInitiator(Ref<EntityStore> initiator)` | Sets the initiating entity reference |
| `getSet` | `public int getSet()` | Returns the event set identifier |
| `setSet` | `public void setSet(int set)` | Sets the event set identifier |

## Design Pattern

EventNotification uses object pooling for performance. A single instance is reused across multiple events rather than creating new objects:

```java
// In EventView base class
protected final NotificationType reusableEventNotification;

// Reused during event processing
protected void onEvent(int senderTypeId, double x, double y, double z, ...) {
    this.reusableEventNotification.setPosition(x, y, z);
    this.reusableEventNotification.setInitiator(initiator);
    // Process event...
}
```

## Usage Example

```java
// Accessing event notification data in NPC callback
public void onEventReceived(NPCEntity npc, EntityEventType type, EventNotification notification) {
    // Get the position of the event
    Vector3d eventPos = notification.getPosition();

    // Get the entity that caused the event
    Ref<EntityStore> initiator = notification.getInitiator();

    // Calculate distance from NPC to event
    Vector3d npcPos = npc.getPosition();
    double distance = npcPos.distance(eventPos);

    // React based on distance
    if (distance < 10.0) {
        // Event is close - high alert
        npc.setAlertLevel(AlertLevel.HIGH);
        npc.lookAt(eventPos);
    } else if (distance < 30.0) {
        // Event is medium range - investigate
        npc.setAlertLevel(AlertLevel.MEDIUM);
        npc.moveTo(eventPos);
    }
}

// Using the initiator reference
public void processEvent(EventNotification notification, ComponentAccessor<EntityStore> accessor) {
    Ref<EntityStore> initiator = notification.getInitiator();

    if (initiator != null && initiator.isValid()) {
        // Get the initiating entity's components
        Player player = accessor.getComponent(initiator, Player.getComponentType());
        if (player != null) {
            // Event was caused by a player
            handlePlayerEvent(player, notification);
        }
    }
}

// Using event sets for filtering
public void checkEventSet(EventNotification notification, int myListeningSet) {
    if (notification.getSet() == myListeningSet) {
        // This event matches our listening set
        processMatchingEvent(notification);
    }
}
```

## Common Use Cases

- Determining event location for NPC navigation
- Identifying the source of threats for AI targeting
- Filtering events by set for specific NPC behaviors
- Calculating distances for range-based responses
- Implementing investigation behaviors
- Creating alert propagation systems

## Extended Class: EntityEventNotification

For entity events, `EntityEventNotification` extends this class with flock information:

```java
public class EntityEventNotification extends EventNotification {
   private Ref<EntityStore> flockReference;

   public Ref<EntityStore> getFlockReference();
   public void setFlockReference(Ref<EntityStore> flockReference);
}
```

This allows pack/flock behaviors where an entire group can respond to events affecting one member.

## Related Types

- [EntityEventNotification](./entity-event-notification) - Extended notification for entity events
- [EntityEventView](./entity-event-view) - View that processes entity events
- [BlockEventView](./block-event-view) - View that processes block events
- [EventView](./event-view) - Base class that manages notifications

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/EventNotification.java:7`
