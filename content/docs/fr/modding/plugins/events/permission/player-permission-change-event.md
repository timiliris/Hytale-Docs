---
id: player-permission-change-event
title: PlayerPermissionChangeEvent
sidebar_label: PlayerPermissionChangeEvent
---

# PlayerPermissionChangeEvent

Le `PlayerPermissionChangeEvent` est une classe de base abstraite pour les événements lies aux changements de permissions des joueurs. Elle fournit quatre classes internes representant differents types de changements de permissions : ajout/suppression de groupes et ajout/suppression de permissions individuelles.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent` |
| **Classe parente** | `IEvent<Void>` |
| **Annulable** | Non |
| **Asynchrone** | Non |
| **Abstraite** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/permissions/PlayerPermissionChangeEvent.java:9` |

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

## Champs

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `playerUuid` | `UUID` | L'identifiant unique du joueur dont les permissions ont change | `getPlayerUuid()` |

## Méthodes

| Méthode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayerUuid()` | `UUID` | Retourne l'UUID du joueur affecte |

## Classes internes

Le `PlayerPermissionChangeEvent` contient quatre classes internes representant des types specifiques de changements de permissions :

### GroupAdded

Déclenché lorsqu'un groupe de permissions est ajoute a un joueur.

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

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `groupName` | `String` | Le nom du groupe ajoute | `getGroupName()` |

### GroupRemoved

Déclenché lorsqu'un groupe de permissions est retire d'un joueur.

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

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `groupName` | `String` | Le nom du groupe retire | `getGroupName()` |

### PermissionsAdded

Déclenché lorsque des permissions individuelles sont ajoutees a un joueur.

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
        return this.addedPermissions;
    }
}
```

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `addedPermissions` | `Set<String>` | L'ensemble des noeuds de permissions ajoutes | `getAddedPermissions()` |

### PermissionsRemoved

Déclenché lorsque des permissions individuelles sont retirees d'un joueur.

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
        return this.removedPermissions;
    }
}
```

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `removedPermissions` | `Set<String>` | L'ensemble des noeuds de permissions retires | `getRemovedPermissions()` |

## Resume des classes internes

| Classe interne | Description | Champs supplementaires |
|----------------|-------------|------------------------|
| `GroupAdded` | Un groupe de permissions a ete ajoute au joueur | `groupName: String` |
| `GroupRemoved` | Un groupe de permissions a ete retire du joueur | `groupName: String` |
| `PermissionsAdded` | Des permissions individuelles ont ete ajoutees au joueur | `addedPermissions: Set<String>` |
| `PermissionsRemoved` | Des permissions individuelles ont ete retirees du joueur | `removedPermissions: Set<String>` |

## Exemple d'utilisation

### Ecouter tous les changements de permissions

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;

public class PermissionLoggerPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Ecouter tous les sous-types
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

### Systeme d'audit des permissions

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.time.Instant;
import java.util.*;

public class PermissionAuditPlugin extends PluginBase {

    private final List<AuditEntry> auditLog = Collections.synchronizedList(new ArrayList<>());

    @Override
    public void onEnable(EventBus eventBus) {
        // S'enregistrer pour tous les types de changements de permissions
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

### Systeme de notification des administrateurs

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;
import java.util.Set;

public class AdminNotifyPlugin extends PluginBase {

    private static final Set<String> SENSITIVE_GROUPS = Set.of("admin", "moderator", "operator");

    @Override
    public void onEnable(EventBus eventBus) {
        // Surveiller les changements de groupes sensibles
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
                "ALERTE: Le joueur %s a ete ajoute au groupe sensible '%s'",
                event.getPlayerUuid(),
                event.getGroupName()
            ));
        }
    }

    private void checkSensitiveGroupRemove(PlayerPermissionChangeEvent.GroupRemoved event) {
        if (SENSITIVE_GROUPS.contains(event.getGroupName().toLowerCase())) {
            notifyAdmins(String.format(
                "ALERTE: Le joueur %s a ete retire du groupe sensible '%s'",
                event.getPlayerUuid(),
                event.getGroupName()
            ));
        }
    }

    private void notifyAdmins(String message) {
        getLogger().warning(message);
        // Envoyer aux administrateurs en ligne
        // broadcastToAdmins(message);
    }
}
```

### Invalidation du cache des permissions

```java
import com.hypixel.hytale.server.core.event.events.permissions.PlayerPermissionChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class PermissionCachePlugin extends PluginBase {

    private final ConcurrentHashMap<UUID, CachedPermissions> cache = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        // Invalider le cache lors de tout changement de permissions
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
            getLogger().info("Cache des permissions invalide pour: " + playerId);
        }
    }

    public CachedPermissions getPermissions(UUID playerId) {
        return cache.computeIfAbsent(playerId, this::loadPermissions);
    }

    private CachedPermissions loadPermissions(UUID playerId) {
        // Charger depuis le systeme de permissions
        return new CachedPermissions();
    }

    private static class CachedPermissions {
        // Donnees de permissions en cache
    }
}
```

## Quand cet événement se déclenché

Les événements des classes internes se déclenchént a differents moments :

### GroupAdded
- Lorsqu'un joueur est assigne a un groupe de permissions via des commandes
- Lorsqu'un joueur est ajoute programmatiquement a un groupe
- Lorsque l'appartenance a un groupe est chargee/restauree

### GroupRemoved
- Lorsqu'un joueur est retire d'un groupe de permissions via des commandes
- Lorsqu'un joueur est retire programmatiquement d'un groupe
- Lorsque l'appartenance a un groupe expire ou est revoquee

### PermissionsAdded
- Lorsque des permissions individuelles sont accordees a un joueur
- Lorsque des permissions sont assignees via des commandes
- Lorsque des noeuds de permissions sont ajoutes programmatiquement

### PermissionsRemoved
- Lorsque des permissions individuelles sont revoquees d'un joueur
- Lorsque des permissions sont retirees via des commandes
- Lorsque des noeuds de permissions sont retires programmatiquement

## Hierarchie des événements

```
IEvent<Void>
  └── PlayerPermissionChangeEvent (abstract)
        ├── GroupAdded
        ├── GroupRemoved
        ├── PermissionsAdded
        └── PermissionsRemoved
```

## Événements lies

| Evenement | Description |
|-----------|-------------|
| [GroupPermissionChangeEvent](./group-permission-change-event.md) | Déclenché lorsque les permissions d'un groupe changent |
| [PlayerGroupEvent](./player-group-event.md) | Evenement alternatif pour les changements d'appartenance aux groupes |
| [PlayerConnectEvent](/docs/fr/modding/plugins/events/player/player-connect-event) | Utile pour charger les permissions du joueur a la connexion |

## Référence source

- **Package**: `com.hypixel.hytale.server.core.event.events.permissions`
- **Hierarchie**: `PlayerPermissionChangeEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Classes internes**: `GroupAdded`, `GroupRemoved`, `PermissionsAdded`, `PermissionsRemoved`
- **Systeme d'événements**: Evenement synchrone standard distribue via `EventBus`
