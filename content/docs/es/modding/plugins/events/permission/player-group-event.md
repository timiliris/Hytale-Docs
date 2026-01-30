---
id: player-group-event
title: PlayerGroupEvent
sidebar_label: PlayerGroupEvent
---

# PlayerGroupEvent

The `PlayerGroupEvent` is fired when a player's membership in a permission group changes. It extends `PlayerPermissionChangeEvent` and provides two inner classes for tracking when players are added to or removed from groups.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.permissions.PlayerGroupEvent` |
| **Parent Class** | `PlayerPermissionChangeEvent` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/permissions/PlayerGroupEvent.java:6` |

## Declaration

```java
public class PlayerGroupEvent extends PlayerPermissionChangeEvent {
    @Nonnull
    private final String groupName;

    public PlayerGroupEvent(@Nonnull UUID playerUuid, @Nonnull String groupName) {
        super(playerUuid);
        this.groupName = groupName;
    }

    @Nonnull
    public String getGroupName() {
        return this.groupName;
    }
}
```

## Fields

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `playerUuid` | `UUID` | The unique identifier of the player (inherited) | `getPlayerUuid()` |
| `groupName` | `String` | The name of the permission group | `getGroupName()` |

## Methods

### Inherited from PlayerPermissionChangeEvent

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getPlayerUuid()` | `UUID` | Returns the UUID of the affected player |

### Event-Specific Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getGroupName()` | `String` | Returns the name of the group the player was added to or removed from |

## Inner Classes

The `PlayerGroupEvent` contains two inner classes representing specific membership changes:

### Added

Fired when a player is added to a permission group.

```java
public static class Added extends PlayerGroupEvent {
    public Added(@Nonnull UUID playerUuid, @Nonnull String groupName) {
        super(playerUuid, groupName);
    }
}
```

This class inherits all fields and methods from `PlayerGroupEvent` without adding any new members.

### Removed

Fired when a player is removed from a permission group.

```java
public static class Removed extends PlayerGroupEvent {
    public Removed(@Nonnull UUID playerUuid, @Nonnull String groupName) {
        super(playerUuid, groupName);
    }
}
```

This class inherits all fields and methods from `PlayerGroupEvent` without adding any new members.

## Inner Class Summary

| Inner Class | Description | Additional Fields |
|-------------|-------------|-------------------|
| `Added` | Player was added to a permission group | None (inherits from `PlayerGroupEvent`) |
| `Removed` | Player was removed from a permission group | None (inherits from `PlayerGroupEvent`) |

## Usage Example

> **Tested** - This code has been verified with a working plugin.

Since `PlayerGroupEvent` extends `PlayerPermissionChangeEvent` which implements `IEvent<Void>`, you can use the standard `register()` method.

### Basic Group Membership Tracking

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerGroupEvent;
import com.hypixel.hytale.event.EventRegistry;
import java.util.UUID;

public class GroupMembershipPlugin extends JavaPlugin {

    @Override
    protected void setup() {
        EventRegistry eventBus = getEventRegistry();

        // Listen for players joining groups
        eventBus.register(PlayerGroupEvent.Added.class, event -> {
            UUID playerId = event.getPlayerUuid();
            String groupName = event.getGroupName();

            logger.info("Player " + playerId + " joined group '" + groupName + "'");
        });

        // Listen for players leaving groups
        eventBus.register(PlayerGroupEvent.Removed.class, event -> {
            UUID playerId = event.getPlayerUuid();
            String groupName = event.getGroupName();

            logger.info("Player " + playerId + " left group '" + groupName + "'");
        });
    }
}
```

### Group Membership Cache

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerGroupEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class GroupCachePlugin extends PluginBase {

    // Map of player UUID to their groups
    private final ConcurrentHashMap<UUID, Set<String>> playerGroups = new ConcurrentHashMap<>();

    // Map of group name to member UUIDs
    private final ConcurrentHashMap<String, Set<UUID>> groupMembers = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            PlayerGroupEvent.Added.class,
            this::onPlayerAddedToGroup
        );
        eventBus.register(
            PlayerGroupEvent.Removed.class,
            this::onPlayerRemovedFromGroup
        );
    }

    private void onPlayerAddedToGroup(PlayerGroupEvent.Added event) {
        UUID playerId = event.getPlayerUuid();
        String groupName = event.getGroupName();

        // Update player -> groups mapping
        playerGroups.computeIfAbsent(playerId, k -> ConcurrentHashMap.newKeySet())
                   .add(groupName);

        // Update group -> players mapping
        groupMembers.computeIfAbsent(groupName, k -> ConcurrentHashMap.newKeySet())
                   .add(playerId);

        getLogger().info("Cache updated: " + playerId + " added to " + groupName);
    }

    private void onPlayerRemovedFromGroup(PlayerGroupEvent.Removed event) {
        UUID playerId = event.getPlayerUuid();
        String groupName = event.getGroupName();

        // Update player -> groups mapping
        Set<String> groups = playerGroups.get(playerId);
        if (groups != null) {
            groups.remove(groupName);
        }

        // Update group -> players mapping
        Set<UUID> members = groupMembers.get(groupName);
        if (members != null) {
            members.remove(playerId);
        }

        getLogger().info("Cache updated: " + playerId + " removed from " + groupName);
    }

    public Set<String> getPlayerGroups(UUID playerId) {
        Set<String> groups = playerGroups.get(playerId);
        return groups != null ? new HashSet<>(groups) : Collections.emptySet();
    }

    public Set<UUID> getGroupMembers(String groupName) {
        Set<UUID> members = groupMembers.get(groupName);
        return members != null ? new HashSet<>(members) : Collections.emptySet();
    }

    public boolean isPlayerInGroup(UUID playerId, String groupName) {
        Set<String> groups = playerGroups.get(playerId);
        return groups != null && groups.contains(groupName);
    }
}
```

### Welcome Message for New Group Members

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerGroupEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.Map;
import java.util.UUID;

public class GroupWelcomePlugin extends PluginBase {

    // Custom welcome messages per group
    private static final Map<String, String> WELCOME_MESSAGES = Map.of(
        "admin", "Welcome to the Admin team! You now have full server access.",
        "moderator", "Welcome to the Moderation team! Help keep our community safe.",
        "vip", "Thank you for supporting us! Enjoy your VIP benefits.",
        "builder", "Welcome to the Build team! Create amazing structures."
    );

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            PlayerGroupEvent.Added.class,
            this::sendWelcomeMessage
        );
    }

    private void sendWelcomeMessage(PlayerGroupEvent.Added event) {
        UUID playerId = event.getPlayerUuid();
        String groupName = event.getGroupName();

        String message = WELCOME_MESSAGES.get(groupName.toLowerCase());
        if (message != null) {
            sendMessageToPlayer(playerId, message);
            getLogger().info("Sent welcome message to " + playerId + " for group " + groupName);
        }
    }

    private void sendMessageToPlayer(UUID playerId, String message) {
        // Implementation depends on messaging API
        // player.sendMessage(message);
    }
}
```

### Group Change Audit System

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerGroupEvent;
import com.hypixel.hytale.event.EventBus;
import java.time.Instant;
import java.util.*;

public class GroupAuditPlugin extends PluginBase {

    private final List<GroupMembershipChange> auditLog =
        Collections.synchronizedList(new ArrayList<>());

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            PlayerGroupEvent.Added.class,
            e -> logChange(e.getPlayerUuid(), e.getGroupName(), ChangeType.ADDED)
        );
        eventBus.register(
            PlayerGroupEvent.Removed.class,
            e -> logChange(e.getPlayerUuid(), e.getGroupName(), ChangeType.REMOVED)
        );
    }

    private void logChange(UUID playerId, String groupName, ChangeType type) {
        GroupMembershipChange change = new GroupMembershipChange(
            Instant.now(),
            playerId,
            groupName,
            type
        );
        auditLog.add(change);
        getLogger().info("[AUDIT] " + change);
    }

    public List<GroupMembershipChange> getAuditLog() {
        return new ArrayList<>(auditLog);
    }

    public List<GroupMembershipChange> getPlayerHistory(UUID playerId) {
        return auditLog.stream()
            .filter(c -> c.playerId().equals(playerId))
            .toList();
    }

    public List<GroupMembershipChange> getGroupHistory(String groupName) {
        return auditLog.stream()
            .filter(c -> c.groupName().equals(groupName))
            .toList();
    }

    public enum ChangeType {
        ADDED, REMOVED
    }

    public record GroupMembershipChange(
        Instant timestamp,
        UUID playerId,
        String groupName,
        ChangeType type
    ) {
        @Override
        public String toString() {
            return String.format(
                "[%s] Player %s %s group '%s'",
                timestamp,
                playerId,
                type == ChangeType.ADDED ? "joined" : "left",
                groupName
            );
        }
    }
}
```

### Role-Based Feature Unlock

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerGroupEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.*;

public class FeatureUnlockPlugin extends PluginBase {

    // Features unlocked by each group
    private static final Map<String, Set<String>> GROUP_FEATURES = Map.of(
        "vip", Set.of("colored_chat", "nickname", "extra_homes"),
        "premium", Set.of("fly", "unlimited_teleports", "custom_items"),
        "admin", Set.of("god_mode", "world_edit", "console_access")
    );

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            PlayerGroupEvent.Added.class,
            this::unlockFeatures
        );
        eventBus.register(
            PlayerGroupEvent.Removed.class,
            this::lockFeatures
        );
    }

    private void unlockFeatures(PlayerGroupEvent.Added event) {
        UUID playerId = event.getPlayerUuid();
        String groupName = event.getGroupName();

        Set<String> features = GROUP_FEATURES.get(groupName.toLowerCase());
        if (features != null && !features.isEmpty()) {
            for (String feature : features) {
                enableFeature(playerId, feature);
            }
            getLogger().info(String.format(
                "Unlocked %d features for player %s (group: %s)",
                features.size(), playerId, groupName
            ));
        }
    }

    private void lockFeatures(PlayerGroupEvent.Removed event) {
        UUID playerId = event.getPlayerUuid();
        String groupName = event.getGroupName();

        Set<String> features = GROUP_FEATURES.get(groupName.toLowerCase());
        if (features != null && !features.isEmpty()) {
            for (String feature : features) {
                // Only disable if player doesn't have feature from another group
                if (!hasFeatureFromOtherGroup(playerId, feature, groupName)) {
                    disableFeature(playerId, feature);
                }
            }
            getLogger().info(String.format(
                "Locked features for player %s (removed from group: %s)",
                playerId, groupName
            ));
        }
    }

    private void enableFeature(UUID playerId, String feature) {
        // Implementation: enable the feature for the player
    }

    private void disableFeature(UUID playerId, String feature) {
        // Implementation: disable the feature for the player
    }

    private boolean hasFeatureFromOtherGroup(UUID playerId, String feature, String excludeGroup) {
        // Check if player has this feature from any other group
        // Implementation depends on permission system
        return false;
    }
}
```

## When This Event Fires

### Added Event
- When a player is assigned to a permission group via commands
- When a player is programmatically added to a group
- When a player purchases or earns group membership
- When group membership is restored on login

### Removed Event
- When a player is removed from a permission group via commands
- When a player is programmatically removed from a group
- When group membership expires (timed ranks)
- When a player is demoted

## Relationship to PlayerPermissionChangeEvent

The `PlayerGroupEvent` is a more specific version of `PlayerPermissionChangeEvent.GroupAdded` and `PlayerPermissionChangeEvent.GroupRemoved`. The main differences are:

| Aspect | PlayerGroupEvent | PlayerPermissionChangeEvent.GroupAdded/GroupRemoved |
|--------|------------------|-----------------------------------------------------|
| Parent Class | `PlayerPermissionChangeEvent` | `PlayerPermissionChangeEvent` |
| Inner Classes | `Added`, `Removed` | N/A (they are the inner classes) |
| Use Case | Track group membership | Track group membership |

Both can be used to track group membership changes. Choose based on your registration pattern and consistency needs.

## Event Hierarchy

```
IEvent<Void>
  └── PlayerPermissionChangeEvent (abstract)
        └── PlayerGroupEvent
              ├── Added
              └── Removed
```

## Related Events

| Event | Description |
|-------|-------------|
| [PlayerPermissionChangeEvent](./player-permission-change-event) | Parent class for all player permission changes |
| [GroupPermissionChangeEvent](./group-permission-change-event) | Fired when a group's permissions are modified |
| [PlayerConnectEvent](/docs/en/modding/plugins/events/player/player-connect-event) | Useful for initializing player permissions on connect |
| [PlayerDisconnectEvent](/docs/en/modding/plugins/events/player/player-disconnect-event) | Useful for cleanup when players leave |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events.permissions`
- **Hierarchy**: `PlayerGroupEvent` -> `PlayerPermissionChangeEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Inner Classes**: `Added`, `Removed`
- **Event System**: Standard synchronous event dispatched via `EventBus`
