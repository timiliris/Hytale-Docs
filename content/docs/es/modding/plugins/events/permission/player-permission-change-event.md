---
id: player-permission-change-event
title: PlayerPermissionChangeEvent
sidebar_label: PlayerPermissionChangeEvent
---

# PlayerPermissionChangeEvent

The `PlayerPermissionChangeEvent` is an abstract base class for events related to changes in player permissions. It provides four inner classes representing different types of permission changes: adding/removing groups and adding/removing individual permissions.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Abstract** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/permissions/PlayerPermissionChangeEvent.java:9` |

## Declaration

```java
public abstract class PlayerPermissionChangeEvent implements IEvent<Void> {
    @Nonnull
    private final UUID playerUuid;

    protected PlayerPermissionChangeEvent(@Nonnull UUID playerUuid) {
        this.playerUuid = playerUuid;
    }

    @Nonnull
    public UUID getPlayerUuid() {
        return this.playerUuid;
    }
}
```

## Fields

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `playerUuid` | `UUID` | The unique identifier of the player whose permissions changed | `getPlayerUuid()` |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getPlayerUuid()` | `UUID` | Returns the UUID of the affected player |

## Inner Classes

The `PlayerPermissionChangeEvent` contains four inner classes representing specific permission change types:

### GroupAdded

Fired when a permission group is added to a player.

```java
public static class GroupAdded extends PlayerPermissionChangeEvent {
    @Nonnull
    private final String groupName;

    public GroupAdded(@Nonnull UUID playerUuid, @Nonnull String groupName) {
        super(playerUuid);
        this.groupName = groupName;
    }

    @Nonnull
    public String getGroupName() {
        return this.groupName;
    }
}
```

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `groupName` | `String` | The name of the group being added | `getGroupName()` |

### GroupRemoved

Fired when a permission group is removed from a player.

```java
public static class GroupRemoved extends PlayerPermissionChangeEvent {
    @Nonnull
    private final String groupName;

    public GroupRemoved(@Nonnull UUID playerUuid, @Nonnull String groupName) {
        super(playerUuid);
        this.groupName = groupName;
    }

    @Nonnull
    public String getGroupName() {
        return this.groupName;
    }
}
```

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `groupName` | `String` | The name of the group being removed | `getGroupName()` |

### PermissionsAdded

Fired when individual permissions are added to a player.

```java
public static class PermissionsAdded extends PlayerPermissionChangeEvent {
    @Nonnull
    private final Set<String> addedPermissions;

    public PermissionsAdded(@Nonnull UUID playerUuid, @Nonnull Set<String> addedPermissions) {
        super(playerUuid);
        this.addedPermissions = addedPermissions;
    }

    @Nonnull
    public Set<String> getAddedPermissions() {
        return Collections.unmodifiableSet(this.addedPermissions);
    }
}
```

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `addedPermissions` | `Set<String>` | The set of permission nodes being added | `getAddedPermissions()` |

### PermissionsRemoved

Fired when individual permissions are removed from a player.

```java
public static class PermissionsRemoved extends PlayerPermissionChangeEvent {
    @Nonnull
    private final Set<String> removedPermissions;

    public PermissionsRemoved(@Nonnull UUID playerUuid, @Nonnull Set<String> removedPermissions) {
        super(playerUuid);
        this.removedPermissions = removedPermissions;
    }

    @Nonnull
    public Set<String> getRemovedPermissions() {
        return Collections.unmodifiableSet(this.removedPermissions);
    }
}
```

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `removedPermissions` | `Set<String>` | The set of permission nodes being removed | `getRemovedPermissions()` |

## Inner Class Summary

| Inner Class | Description | Additional Fields |
|-------------|-------------|-------------------|
| `GroupAdded` | A permission group was added to the player | `groupName: String` |
| `GroupRemoved` | A permission group was removed from the player | `groupName: String` |
| `PermissionsAdded` | Individual permissions were added to the player | `addedPermissions: Set<String>` |
| `PermissionsRemoved` | Individual permissions were removed from the player | `removedPermissions: Set<String>` |

## Usage Example

### Listening to All Permission Changes

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;

public class PermissionLoggerPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Listen to all subtypes
        eventBus.register(
            PlayerPermissionChangeEvent.GroupAdded.class,
            this::onGroupAdded
        );
        eventBus.register(
            PlayerPermissionChangeEvent.GroupRemoved.class,
            this::onGroupRemoved
        );
        eventBus.register(
            PlayerPermissionChangeEvent.PermissionsAdded.class,
            this::onPermissionsAdded
        );
        eventBus.register(
            PlayerPermissionChangeEvent.PermissionsRemoved.class,
            this::onPermissionsRemoved
        );
    }

    private void onGroupAdded(PlayerPermissionChangeEvent.GroupAdded event) {
        UUID playerId = event.getPlayerUuid();
        String group = event.getGroupName();
        getLogger().info("Player " + playerId + " added to group: " + group);
    }

    private void onGroupRemoved(PlayerPermissionChangeEvent.GroupRemoved event) {
        UUID playerId = event.getPlayerUuid();
        String group = event.getGroupName();
        getLogger().info("Player " + playerId + " removed from group: " + group);
    }

    private void onPermissionsAdded(PlayerPermissionChangeEvent.PermissionsAdded event) {
        UUID playerId = event.getPlayerUuid();
        Set<String> perms = event.getAddedPermissions();
        getLogger().info("Player " + playerId + " gained permissions: " + perms);
    }

    private void onPermissionsRemoved(PlayerPermissionChangeEvent.PermissionsRemoved event) {
        UUID playerId = event.getPlayerUuid();
        Set<String> perms = event.getRemovedPermissions();
        getLogger().info("Player " + playerId + " lost permissions: " + perms);
    }
}
```

### Permission Audit System

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.time.Instant;
import java.util.*;

public class PermissionAuditPlugin extends PluginBase {

    private final List<AuditEntry> auditLog = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void onEnable(EventBus eventBus) {
        // Register for all permission change types
        eventBus.register(
            PlayerPermissionChangeEvent.GroupAdded.class,
            e -> audit(e.getPlayerUuid(), "GROUP_ADD", e.getGroupName())
        );
        eventBus.register(
            PlayerPermissionChangeEvent.GroupRemoved.class,
            e -> audit(e.getPlayerUuid(), "GROUP_REMOVE", e.getGroupName())
        );
        eventBus.register(
            PlayerPermissionChangeEvent.PermissionsAdded.class,
            e -> audit(e.getPlayerUuid(), "PERM_ADD", String.join(", ", e.getAddedPermissions()))
        );
        eventBus.register(
            PlayerPermissionChangeEvent.PermissionsRemoved.class,
            e -> audit(e.getPlayerUuid(), "PERM_REMOVE", String.join(", ", e.getRemovedPermissions()))
        );
    }

    private void audit(UUID playerId, String action, String details) {
        AuditEntry entry = new AuditEntry(
            Instant.now(),
            playerId,
            action,
            details
        );
        auditLog.add(entry);
        getLogger().info("[AUDIT] " + entry);
    }

    public List<AuditEntry> getAuditLog() {
        return new ArrayList<>(auditLog);
    }

    public record AuditEntry(Instant timestamp, UUID playerId, String action, String details) {
        @Override
        public String toString() {
            return String.format("[%s] %s: %s -> %s", timestamp, playerId, action, details);
        }
    }
}
```

### Admin Notification System

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;
import java.util.Set;

public class AdminNotifyPlugin extends PluginBase {

    private static final Set<String> SENSITIVE_GROUPS = Set.of("admin", "moderator", "operator");

    @Override
    public void onEnable(EventBus eventBus) {
        // Monitor sensitive group changes
        eventBus.register(
            PlayerPermissionChangeEvent.GroupAdded.class,
            this::checkSensitiveGroupAdd
        );
        eventBus.register(
            PlayerPermissionChangeEvent.GroupRemoved.class,
            this::checkSensitiveGroupRemove
        );
    }

    private void checkSensitiveGroupAdd(PlayerPermissionChangeEvent.GroupAdded event) {
        if (SENSITIVE_GROUPS.contains(event.getGroupName().toLowerCase())) {
            notifyAdmins(String.format(
                "ALERT: Player %s was added to sensitive group '%s'",
                event.getPlayerUuid(),
                event.getGroupName()
            ));
        }
    }

    private void checkSensitiveGroupRemove(PlayerPermissionChangeEvent.GroupRemoved event) {
        if (SENSITIVE_GROUPS.contains(event.getGroupName().toLowerCase())) {
            notifyAdmins(String.format(
                "ALERT: Player %s was removed from sensitive group '%s'",
                event.getPlayerUuid(),
                event.getGroupName()
            ));
        }
    }

    private void notifyAdmins(String message) {
        getLogger().warning(message);
        // Send to online admins
        // broadcastToAdmins(message);
    }
}
```

### Permission Cache Invalidation

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class PermissionCachePlugin extends PluginBase {

    private final ConcurrentHashMap<UUID, CachedPermissions> cache = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        // Invalidate cache on any permission change
        eventBus.register(
            PlayerPermissionChangeEvent.GroupAdded.class,
            e -> invalidateCache(e.getPlayerUuid())
        );
        eventBus.register(
            PlayerPermissionChangeEvent.GroupRemoved.class,
            e -> invalidateCache(e.getPlayerUuid())
        );
        eventBus.register(
            PlayerPermissionChangeEvent.PermissionsAdded.class,
            e -> invalidateCache(e.getPlayerUuid())
        );
        eventBus.register(
            PlayerPermissionChangeEvent.PermissionsRemoved.class,
            e -> invalidateCache(e.getPlayerUuid())
        );
    }

    private void invalidateCache(UUID playerId) {
        CachedPermissions removed = cache.remove(playerId);
        if (removed != null) {
            getLogger().info("Invalidated permission cache for: " + playerId);
        }
    }

    public CachedPermissions getPermissions(UUID playerId) {
        return cache.computeIfAbsent(playerId, this::loadPermissions);
    }

    private CachedPermissions loadPermissions(UUID playerId) {
        // Load from permission system
        return new CachedPermissions();
    }

    private static class CachedPermissions {
        // Cached permission data
    }
}
```

## When This Event Fires

The inner class events fire at different times:

### GroupAdded
- When a player is assigned to a permission group via commands
- When a player is programmatically added to a group
- When group membership is loaded/restored

### GroupRemoved
- When a player is removed from a permission group via commands
- When a player is programmatically removed from a group
- When group membership expires or is revoked

### PermissionsAdded
- When individual permissions are granted to a player
- When permissions are assigned via commands
- When permission nodes are programmatically added

### PermissionsRemoved
- When individual permissions are revoked from a player
- When permissions are removed via commands
- When permission nodes are programmatically removed

## Event Hierarchy

```
IEvent<Void>
  └── PlayerPermissionChangeEvent (abstract)
        ├── GroupAdded
        ├── GroupRemoved
        ├── PermissionsAdded
        └── PermissionsRemoved
```

## Related Events

| Event | Description |
|-------|-------------|
| [GroupPermissionChangeEvent](./group-permission-change-event) | Fired when a permission group's permissions change |
| [PlayerGroupEvent](./player-group-event) | Alternative event for player group membership changes |
| [PlayerConnectEvent](/docs/en/modding/plugins/events/player/player-connect-event) | Useful for loading player permissions on connect |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events.permissions`
- **Hierarchy**: `PlayerPermissionChangeEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Inner Classes**: `GroupAdded`, `GroupRemoved`, `PermissionsAdded`, `PermissionsRemoved`
- **Event System**: Standard synchronous event dispatched via `EventBus`
