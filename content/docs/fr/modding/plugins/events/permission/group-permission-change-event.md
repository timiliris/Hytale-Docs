---
id: group-permission-change-event
title: GroupPermissionChangeEvent
sidebar_label: GroupPermissionChangeEvent
---

# GroupPermissionChangeEvent

Le `GroupPermissionChangeEvent` est une classe de base abstraite pour les événements lies aux changements dans les definitions des groupes de permissions. Il se déclenché lorsque des permissions sont ajoutees ou retirees d'un groupe de permissions (et non lorsque des joueurs sont ajoutes aux groupes). Cet événement inclut deux classes internes representant les types de changements spécifiques.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent` |
| **Classe parente** | `IEvent<Void>` |
| **Annulable** | Non |
| **Asynchrone** | Non |
| **Abstraite** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/permissions/GroupPermissionChangeEvent.java:8` |

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

## Champs

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `groupName` | `String` | Le nom du groupe de permissions modifie | `getGroupName()` |

## Méthodes

| Méthode | Type de retour | Description |
|---------|----------------|-------------|
| `getGroupName()` | `String` | Retourne le nom du groupe dont les permissions ont change |

## Classes internes

Le `GroupPermissionChangeEvent` contient deux classes internes representant des types spécifiques de changements de permissions :

### Added

Déclenché lorsque des permissions sont ajoutees a un groupe.

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

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `addedPermissions` | `Set<String>` | L'ensemble des noeuds de permissions ajoutes au groupe | `getAddedPermissions()` |

### Removed

Déclenché lorsque des permissions sont retirees d'un groupe.

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

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `removedPermissions` | `Set<String>` | L'ensemble des noeuds de permissions retires du groupe | `getRemovedPermissions()` |

## Résumé des classes internes

| Classe interne | Description | Champs supplémentaires |
|----------------|-------------|------------------------|
| `Added` | Des permissions ont été ajoutees au groupe | `addedPermissions: Set<String>` |
| `Removed` | Des permissions ont été retirees du groupe | `removedPermissions: Set<String>` |

## Exemple d'utilisation

### Surveillance des changements de permissions de groupe

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.Set;

public class GroupPermissionMonitorPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Ecouter les ajouts de permissions
        eventBus.register(
            GroupPermissionChangeEvent.Added.class,
            this::onPermissionsAdded
        );

        // Ecouter les suppressions de permissions
        eventBus.register(
            GroupPermissionChangeEvent.Removed.class,
            this::onPermissionsRemoved
        );
    }

    private void onPermissionsAdded(GroupPermissionChangeEvent.Added event) {
        String groupName = event.getGroupName();
        Set<String> permissions = event.getAddedPermissions();

        getLogger().info(String.format(
            "Le groupe '%s' a obtenu %d permission(s): %s",
            groupName,
            permissions.size(),
            String.join(", ", permissions)
        ));
    }

    private void onPermissionsRemoved(GroupPermissionChangeEvent.Removed event) {
        String groupName = event.getGroupName();
        Set<String> permissions = event.getRemovedPermissions();

        getLogger().info(String.format(
            "Le groupe '%s' a perdu %d permission(s): %s",
            groupName,
            permissions.size(),
            String.join(", ", permissions)
        ));
    }
}
```

### Piste d'audit des permissions de groupe

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
        getLogger().info("[AUDIT GROUPE] " + entry);
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
                "[%s] Groupe '%s': %s %s",
                timestamp, groupName, action, permissions
            );
        }
    }
}
```

### Propagation des permissions aux joueurs

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.*;

public class PermissionPropagationPlugin extends PluginBase {

    // Suivre quels joueurs sont dans quels groupes
    private final Map<String, Set<UUID>> groupMembers = new HashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        // Lorsque les permissions de groupe changent, notifier les joueurs affectes
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

        // Obtenir tous les joueurs dans ce groupe
        Set<UUID> members = groupMembers.getOrDefault(groupName, Collections.emptySet());

        for (UUID playerId : members) {
            notifyPlayerPermissionsGained(playerId, newPermissions);
        }

        getLogger().info(String.format(
            "Propagation de %d nouvelles permissions a %d joueurs dans le groupe '%s'",
            newPermissions.size(),
            members.size(),
            groupName
        ));
    }

    private void onGroupPermissionsRemoved(GroupPermissionChangeEvent.Removed event) {
        String groupName = event.getGroupName();
        Set<String> removedPermissions = event.getRemovedPermissions();

        // Obtenir tous les joueurs dans ce groupe
        Set<UUID> members = groupMembers.getOrDefault(groupName, Collections.emptySet());

        for (UUID playerId : members) {
            notifyPlayerPermissionsLost(playerId, removedPermissions);
        }

        getLogger().info(String.format(
            "Propagation de %d suppressions de permissions a %d joueurs dans le groupe '%s'",
            removedPermissions.size(),
            members.size(),
            groupName
        ));
    }

    private void notifyPlayerPermissionsGained(UUID playerId, Set<String> permissions) {
        // Implementation: notifier le joueur, rafraichir le cache des permissions, etc.
    }

    private void notifyPlayerPermissionsLost(UUID playerId, Set<String> permissions) {
        // Implementation: notifier le joueur, rafraichir le cache des permissions, etc.
    }

    // Appele lorsqu'un joueur rejoint un groupe
    public void addPlayerToGroup(UUID playerId, String groupName) {
        groupMembers.computeIfAbsent(groupName, k -> new HashSet<>()).add(playerId);
    }

    // Appele lorsqu'un joueur quitte un groupe
    public void removePlayerFromGroup(UUID playerId, String groupName) {
        Set<UUID> members = groupMembers.get(groupName);
        if (members != null) {
            members.remove(playerId);
        }
    }
}
```

### Systeme d'alerte pour les permissions dangereuses

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.Set;

public class DangerousPermissionAlertPlugin extends PluginBase {

    // Permissions qui devraient déclenchér des alertes lorsqu'elles sont ajoutees
    private static final Set<String> DANGEROUS_PERMISSIONS = Set.of(
        "server.admin",
        "server.stop",
        "server.reload",
        "player.ban",
        "player.kick",
        "world.delété",
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

        // Verifier les permissions dangereuses
        Set<String> dangerous = addedPermissions.stream()
            .filter(DANGEROUS_PERMISSIONS::contains)
            .collect(java.util.stream.Collectors.toSet());

        if (!dangerous.isEmpty()) {
            alertAdmins(String.format(
                "ALERTE SECURITE: Permissions dangereuses ajoutees au groupe '%s': %s",
                groupName,
                String.join(", ", dangerous)
            ));
        }
    }

    private void alertAdmins(String message) {
        getLogger().warning(message);
        // Envoyer également a la console et aux administrateurs en ligne
        // broadcastToAdmins(message);
    }
}
```

### Systeme de versionnage des permissions

```java
import com.hypixel.hytale.server.core.event.events.permissions.GroupPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class PermissionVersioningPlugin extends PluginBase {

    // Suivre la version de chaque groupe
    private final ConcurrentHashMap<String, AtomicLong> groupVersions = new ConcurrentHashMap<>();

    // Suivre les permissions actuelles de chaque groupe
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

        // Mettre a jour l'ensemble des permissions
        groupPermissions.computeIfAbsent(groupName, k -> ConcurrentHashMap.newKeySet())
            .addAll(event.getAddedPermissions());

        // Incrementer la version
        long newVersion = groupVersions
            .computeIfAbsent(groupName, k -> new AtomicLong(0))
            .incrementAndGet();

        getLogger().info(String.format(
            "Groupe '%s' mis a jour vers la version %d (%d permissions ajoutees)",
            groupName, newVersion, event.getAddedPermissions().size()
        ));
    }

    private void onPermissionsRemoved(GroupPermissionChangeEvent.Removed event) {
        String groupName = event.getGroupName();

        // Mettre a jour l'ensemble des permissions
        Set<String> perms = groupPermissions.get(groupName);
        if (perms != null) {
            perms.removeAll(event.getRemovedPermissions());
        }

        // Incrementer la version
        long newVersion = groupVersions
            .computeIfAbsent(groupName, k -> new AtomicLong(0))
            .incrementAndGet();

        getLogger().info(String.format(
            "Groupe '%s' mis a jour vers la version %d (%d permissions retirees)",
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

## Quand cet événement se déclenché

### Événement Added
- Lorsque des permissions sont accordees a un groupe de permissions via des commandes
- Lorsque des permissions sont ajoutees programmatiquement a un groupe
- Lorsque la configuration du groupe est modifiee pour inclure de nouvelles permissions

### Événement Removed
- Lorsque des permissions sont revoquees d'un groupe de permissions via des commandes
- Lorsque des permissions sont retirees programmatiquement d'un groupe
- Lorsque la configuration du groupe est modifiee pour exclure des permissions

## Notes importantes

1. **Changements de groupe, pas d'appartenance**: Cet événement se déclenché lorsque l'ensemble des permissions du groupe change, pas lorsque des joueurs rejoignent ou quittent le groupe.

2. **Operations en masse**: Le champ `permissions` est un `Set<String>`, permettant d'ajouter ou de retirer plusieurs permissions en une seule operation.

3. **Invalidation du cache**: Lors du traitement de ces événements, pensez a invalider les permissions en cache pour les joueurs du groupe affecte.

4. **Effets en cascade**: Les changements aux permissions de groupe affectent tous les joueurs de ce groupe, donc considérez les implications de performance de vos handlers.

## Hierarchie des événements

```
IEvent<Void>
  └── GroupPermissionChangeEvent (abstract)
        ├── Added
        └── Removed
```

## Événements lies

| Événement | Description |
|-----------|-------------|
| [PlayerPermissionChangeEvent](./player-permission-change-event.md) | Déclenché lorsque les permissions individuelles d'un joueur changent |
| [PlayerGroupEvent](./player-group-event.md) | Déclenché lorsque l'appartenance d'un joueur a un groupe change |

## Référence source

- **Package**: `com.hypixel.hytale.server.core.event.events.permissions`
- **Hierarchie**: `GroupPermissionChangeEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Classes internes**: `Added`, `Removed`
- **Systeme d'événements**: Événement synchrone standard distribue via `EventBus`
