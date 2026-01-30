---
id: group-permission-change-event
title: GroupPermissionChangeEvent
sidebar_label: GroupPermissionChangeEvent
---

# GroupPermissionChangeEvent

The `GroupPermissionChangeEvent` is an abstract base class for events related to changes in permission group definitions. It fires when permissions are added to or removed from a permission group (not when players are added to groups). This event includes two inner classes representing the specific change types.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Abstract** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/permissions/GroupPermissionChangeEvent.java:8` |

## Declaration

```java
public abstract class GroupPermissionChangeEvent implements IEvent<Void> {
    @Nonnull
    private final String groupName;

    protected GroupPermissionChangeEvent(@Nonnull String groupName) {
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
| `groupName` | `String` | The name of the permission group being modified | `getGroupName()` |

## Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getGroupName()` | `String` | Returns the name of the group whose permissions changed |

## Inner Classes

The `GroupPermissionChangeEvent` contains two inner classes representing specific permission change types:

### Added

Fired when permissions are added to a group.

```java
public static class Added extends GroupPermissionChangeEvent {
    @Nonnull
    private final Set<String> addedPermissions;

    public Added(@Nonnull String groupName, @Nonnull Set<String> addedPermissions) {
        super(groupName);
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
| `addedPermissions` | `Set<String>` | The set of permission nodes being added to the group | `getAddedPermissions()` |

### Removed

Fired when permissions are removed from a group.

```java
public static class Removed extends GroupPermissionChangeEvent {
    @Nonnull
    private final Set<String> removedPermissions;

    public Removed(@Nonnull String groupName, @Nonnull Set<String> removedPermissions) {
        super(groupName);
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
| `removedPermissions` | `Set<String>` | The set of permission nodes being removed from the group | `getRemovedPermissions()` |

## Inner Class Summary

| Inner Class | Description | Additional Fields |
|-------------|-------------|-------------------|
| `Added` | Permissions were added to the group | `addedPermissions: Set<String>` |
| `Removed` | Permissions were removed from the group | `removedPermissions: Set<String>` |

## Usage Example

### Monitoring Group Permission Changes

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.Set;

public class GroupPermissionMonitorPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Listen for permission additions
        eventBus.register(
            GroupPermissionChangeEvent.Added.class,
            this::onPermissionsAdded
        );

        // Listen for permission removals
        eventBus.register(
            GroupPermissionChangeEvent.Removed.class,
            this::onPermissionsRemoved
        );
    }

    private void onPermissionsAdded(GroupPermissionChangeEvent.Added event) {
        String groupName = event.getGroupName();
        Set<String> permissions = event.getAddedPermissions();

        getLogger().info(String.format(
            "Group '%s' gained %d permission(s): %s",
            groupName,
            permissions.size(),
            String.join(", ", permissions)
        ));
    }

    private void onPermissionsRemoved(GroupPermissionChangeEvent.Removed event) {
        String groupName = event.getGroupName();
        Set<String> permissions = event.getRemovedPermissions();

        getLogger().info(String.format(
            "Group '%s' lost %d permission(s): %s",
            groupName,
            permissions.size(),
            String.join(", ", permissions)
        ));
    }
}
```

### Group Permission Audit Trail

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.time.Instant;
import java.util.*;

public class GroupAuditPlugin extends PluginBase {

    private final List<GroupAuditEntry> auditLog = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            GroupPermissionChangeEvent.Added.class,
            e -> logChange(e.getGroupName(), "ADDED", e.getAddedPermissions())
        );
        eventBus.register(
            GroupPermissionChangeEvent.Removed.class,
            e -> logChange(e.getGroupName(), "REMOVED", e.getRemovedPermissions())
        );
    }

    private void logChange(String groupName, String action, Set<String> permissions) {
        GroupAuditEntry entry = new GroupAuditEntry(
            Instant.now(),
            groupName,
            action,
            new HashSet<>(permissions)
        );
        auditLog.add(entry);
        getLogger().info("[GROUP AUDIT] " + entry);
    }

    public List<GroupAuditEntry> getAuditLog() {
        return new ArrayList<>(auditLog);
    }

    public List<GroupAuditEntry> getAuditLogForGroup(String groupName) {
        return auditLog.stream()
            .filter(e -> e.groupName().equals(groupName))
            .toList();
    }

    public record GroupAuditEntry(
        Instant timestamp,
        String groupName,
        String action,
        Set<String> permissions
    ) {
        @Override
        public String toString() {
            return String.format(
                "[%s] Group '%s': %s %s",
                timestamp, groupName, action, permissions
            );
        }
    }
}
```

### Permission Propagation to Players

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.*;

public class PermissionPropagationPlugin extends PluginBase {

    // Track which players are in which groups
    private final Map<String, Set<UUID>> groupMembers = new HashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        // When group permissions change, notify affected players
        eventBus.register(
            GroupPermissionChangeEvent.Added.class,
            this::onGroupPermissionsAdded
        );
        eventBus.register(
            GroupPermissionChangeEvent.Removed.class,
            this::onGroupPermissionsRemoved
        );
    }

    private void onGroupPermissionsAdded(GroupPermissionChangeEvent.Added event) {
        String groupName = event.getGroupName();
        Set<String> newPermissions = event.getAddedPermissions();

        // Get all players in this group
        Set<UUID> members = groupMembers.getOrDefault(groupName, Collections.emptySet());

        for (UUID playerId : members) {
            notifyPlayerPermissionsGained(playerId, newPermissions);
        }

        getLogger().info(String.format(
            "Propagated %d new permissions to %d players in group '%s'",
            newPermissions.size(),
            members.size(),
            groupName
        ));
    }

    private void onGroupPermissionsRemoved(GroupPermissionChangeEvent.Removed event) {
        String groupName = event.getGroupName();
        Set<String> removedPermissions = event.getRemovedPermissions();

        // Get all players in this group
        Set<UUID> members = groupMembers.getOrDefault(groupName, Collections.emptySet());

        for (UUID playerId : members) {
            notifyPlayerPermissionsLost(playerId, removedPermissions);
        }

        getLogger().info(String.format(
            "Propagated %d permission removals to %d players in group '%s'",
            removedPermissions.size(),
            members.size(),
            groupName
        ));
    }

    private void notifyPlayerPermissionsGained(UUID playerId, Set<String> permissions) {
        // Implementation: notify player, refresh permission cache, etc.
    }

    private void notifyPlayerPermissionsLost(UUID playerId, Set<String> permissions) {
        // Implementation: notify player, refresh permission cache, etc.
    }

    // Called when player joins a group
    public void addPlayerToGroup(UUID playerId, String groupName) {
        groupMembers.computeIfAbsent(groupName, k -> new HashSet<>()).add(playerId);
    }

    // Called when player leaves a group
    public void removePlayerFromGroup(UUID playerId, String groupName) {
        Set<UUID> members = groupMembers.get(groupName);
        if (members != null) {
            members.remove(playerId);
        }
    }
}
```

### Dangerous Permission Alert System

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.Set;

public class DangerousPermissionAlertPlugin extends PluginBase {

    // Permissions that should trigger alerts when added
    private static final Set<String> DANGEROUS_PERMISSIONS = Set.of(
        "server.admin",
        "server.stop",
        "server.reload",
        "player.ban",
        "player.kick",
        "world.delete",
        "permissions.modify"
    );

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            GroupPermissionChangeEvent.Added.class,
            this::checkDangerousPermissions
        );
    }

    private void checkDangerousPermissions(GroupPermissionChangeEvent.Added event) {
        String groupName = event.getGroupName();
        Set<String> addedPermissions = event.getAddedPermissions();

        // Check for dangerous permissions
        Set<String> dangerous = addedPermissions.stream()
            .filter(DANGEROUS_PERMISSIONS::contains)
            .collect(java.util.stream.Collectors.toSet());

        if (!dangerous.isEmpty()) {
            alertAdmins(String.format(
                "SECURITY ALERT: Dangerous permissions added to group '%s': %s",
                groupName,
                String.join(", ", dangerous)
            ));
        }
    }

    private void alertAdmins(String message) {
        getLogger().warning(message);
        // Also send to console and online admins
        // broadcastToAdmins(message);
    }
}
```

### Permission Versioning System

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class PermissionVersioningPlugin extends PluginBase {

    // Track version for each group
    private final ConcurrentHashMap<String, AtomicLong> groupVersions = new ConcurrentHashMap<>();

    // Track current permissions for each group
    private final ConcurrentHashMap<String, Set<String>> groupPermissions = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.register(
            GroupPermissionChangeEvent.Added.class,
            this::onPermissionsAdded
        );
        eventBus.register(
            GroupPermissionChangeEvent.Removed.class,
            this::onPermissionsRemoved
        );
    }

    private void onPermissionsAdded(GroupPermissionChangeEvent.Added event) {
        String groupName = event.getGroupName();

        // Update permissions set
        groupPermissions.computeIfAbsent(groupName, k -> ConcurrentHashMap.newKeySet())
            .addAll(event.getAddedPermissions());

        // Increment version
        long newVersion = groupVersions
            .computeIfAbsent(groupName, k -> new AtomicLong(0))
            .incrementAndGet();

        getLogger().info(String.format(
            "Group '%s' updated to version %d (added %d permissions)",
            groupName, newVersion, event.getAddedPermissions().size()
        ));
    }

    private void onPermissionsRemoved(GroupPermissionChangeEvent.Removed event) {
        String groupName = event.getGroupName();

        // Update permissions set
        Set<String> perms = groupPermissions.get(groupName);
        if (perms != null) {
            perms.removeAll(event.getRemovedPermissions());
        }

        // Increment version
        long newVersion = groupVersions
            .computeIfAbsent(groupName, k -> new AtomicLong(0))
            .incrementAndGet();

        getLogger().info(String.format(
            "Group '%s' updated to version %d (removed %d permissions)",
            groupName, newVersion, event.getRemovedPermissions().size()
        ));
    }

    public long getGroupVersion(String groupName) {
        AtomicLong version = groupVersions.get(groupName);
        return version != null ? version.get() : 0;
    }

    public Set<String> getGroupPermissions(String groupName) {
        Set<String> perms = groupPermissions.get(groupName);
        return perms != null ? new HashSet<>(perms) : Collections.emptySet();
    }
}
```

## When This Event Fires

### Added Event
- When permissions are granted to a permission group via commands
- When permissions are programmatically added to a group
- When group configuration is modified to include new permissions

### Removed Event
- When permissions are revoked from a permission group via commands
- When permissions are programmatically removed from a group
- When group configuration is modified to exclude permissions

## Important Notes

1. **Group Changes, Not Membership**: This event fires when the group's permission set changes, not when players join or leave the group.

2. **Bulk Operations**: The `permissions` field is a `Set<String>`, allowing multiple permissions to be added or removed in a single operation.

3. **Cache Invalidation**: When handling these events, consider invalidating any cached permissions for players in the affected group.

4. **Cascading Effects**: Changes to group permissions affect all players in that group, so consider the performance implications of your handlers.

## Event Hierarchy

```
IEvent<Void>
  └── GroupPermissionChangeEvent (abstract)
        ├── Added
        └── Removed
```

## Related Events

| Event | Description |
|-------|-------------|
| [PlayerPermissionChangeEvent](./player-permission-change-event) | Fired when individual player permissions change |
| [PlayerGroupEvent](./player-group-event) | Fired when a player's group membership changes |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events.permissions`
- **Hierarchy**: `GroupPermissionChangeEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Inner Classes**: `Added`, `Removed`
- **Event System**: Standard synchronous event dispatched via `EventBus`
