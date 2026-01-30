---
id: kill-feed-event
title: KillFeedEvent
sidebar_label: KillFeedEvent
---

# KillFeedEvent

A container class for kill feed related events. This class contains three nested event types that handle different aspects of the kill feed system: displaying death messages to the deceased, displaying kill messages to the killer, and broadcasting the kill feed display to players.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.entity.damage.event.KillFeedEvent` |
| **Parent Class** | `Object` |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/modules/entity/damage/event/KillFeedEvent.java:13` |

## Nested Event Classes

### KillFeedEvent.DecedentMessage

Fired when generating the death message for the entity that died. This event allows customization of the message shown to the deceased player.

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.entity.damage.event.KillFeedEvent.DecedentMessage` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |

#### Declaration

```java
public static final class DecedentMessage extends CancellableEcsEvent {
   @Nonnull
   private final Damage damage;
   @Nullable
   private Message message = null;
```

#### Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `damage` | `Damage` | `getDamage()` | The damage instance that caused the death |
| `message` | `Message` | `getMessage()` / `setMessage()` | The customizable death message (nullable) |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getDamage` | `public Damage getDamage()` | Returns the damage that caused the death |
| `getMessage` | `@Nullable public Message getMessage()` | Returns the current death message |
| `setMessage` | `public void setMessage(@Nullable Message message)` | Sets a custom death message |

---

### KillFeedEvent.KillerMessage

Fired when generating the kill message for the entity that performed the kill. This event allows customization of the message shown to the killer.

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.entity.damage.event.KillFeedEvent.KillerMessage` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |

#### Declaration

```java
public static final class KillerMessage extends CancellableEcsEvent {
   @Nonnull
   private final Damage damage;
   @Nonnull
   private final Ref<EntityStore> targetRef;
   @Nullable
   private Message message = null;
```

#### Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `damage` | `Damage` | `getDamage()` | The damage instance that caused the death |
| `targetRef` | `Ref<EntityStore>` | `getTargetRef()` | Reference to the entity that was killed |
| `message` | `Message` | `getMessage()` / `setMessage()` | The customizable kill message (nullable) |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getDamage` | `@Nonnull public Damage getDamage()` | Returns the damage that caused the death |
| `getTargetRef` | `@Nonnull public Ref<EntityStore> getTargetRef()` | Returns the reference to the killed entity |
| `getMessage` | `@Nullable public Message getMessage()` | Returns the current kill message |
| `setMessage` | `public void setMessage(@Nullable Message message)` | Sets a custom kill message |

---

### KillFeedEvent.Display

Fired when the kill feed is about to be displayed to players. This event allows customization of the kill feed icon and control over which players receive the broadcast.

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.entity.damage.event.KillFeedEvent.Display` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |

#### Declaration

```java
public static final class Display extends CancellableEcsEvent {
   @Nonnull
   private final Damage damage;
   @Nullable
   private String icon;
   @Nonnull
   private final List<PlayerRef> broadcastTargets;
```

#### Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `damage` | `Damage` | `getDamage()` | The damage instance that caused the death |
| `icon` | `String` | `getIcon()` / `setIcon()` | The icon to display in the kill feed (nullable) |
| `broadcastTargets` | `List<PlayerRef>` | `getBroadcastTargets()` | List of players who will see the kill feed |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getDamage` | `@Nonnull public Damage getDamage()` | Returns the damage that caused the death |
| `getIcon` | `@Nullable public String getIcon()` | Returns the kill feed icon |
| `setIcon` | `public void setIcon(@Nullable String icon)` | Sets a custom icon for the kill feed |
| `getBroadcastTargets` | `@Nonnull public List<PlayerRef> getBroadcastTargets()` | Returns the list of players to broadcast to |

## Usage Example

```java
// Customize death messages for the deceased player
eventBus.register(KillFeedEvent.DecedentMessage.class, event -> {
    Damage damage = event.getDamage();

    // Set a custom death message
    if (damage.getType().equals("fire")) {
        event.setMessage(Message.of("You were burned to a crisp!"));
    }
});

// Customize kill messages for the killer
eventBus.register(KillFeedEvent.KillerMessage.class, event -> {
    Damage damage = event.getDamage();
    Ref<EntityStore> targetRef = event.getTargetRef();

    // Set a custom kill message
    event.setMessage(Message.of("You eliminated your target!"));
});

// Control kill feed display and customize icons
eventBus.register(KillFeedEvent.Display.class, event -> {
    Damage damage = event.getDamage();

    // Set a custom icon based on damage type
    if (damage.getType().equals("headshot")) {
        event.setIcon("icons/headshot");
    }

    // Modify broadcast targets
    List<PlayerRef> targets = event.getBroadcastTargets();
    // Remove spectators from kill feed
    targets.removeIf(player -> player.isSpectator());

    // Or cancel the entire kill feed display
    if (shouldHideKillFeed()) {
        event.setCancelled(true);
    }
});

// Track kills for statistics
eventBus.register(KillFeedEvent.Display.class, event -> {
    Damage damage = event.getDamage();
    // Record kill statistics
    statsTracker.recordKill(damage.getAttacker(), damage.getVictim());
});
```

## Common Use Cases

- Customizing death and kill messages based on damage type
- Adding special icons for specific kill types (headshots, combos, etc.)
- Filtering kill feed visibility to specific players
- Implementing team-based kill feed (only show kills to teammates)
- Tracking kill statistics and leaderboards
- Creating custom kill streaks and announcements
- Hiding kill feed in certain game modes
- Adding localized or themed death messages

## Related Events

- [EntityRemoveEvent](../entity/entity-remove-event) - Fired when an entity is removed from the world
- [PlayerDisconnectEvent](../player/player-disconnect-event) - Fired when a player disconnects

## Source Reference

`decompiled/com/hypixel/hytale/server/core/modules/entity/damage/event/KillFeedEvent.java:13`
