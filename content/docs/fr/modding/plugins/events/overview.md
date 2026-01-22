---
id: overview
title: Référence des événements
sidebar_label: Vue d'ensemble
sidebar_position: 0
description: Référence complète pour tous les événements du serveur Hytale
---

# Référence des événements

Le serveur Hytale utilise un système d'événements sophistiqué qui permet aux plugins d'écouter et de répondre à diverses actions du jeu. Cette référence fournit une documentation complète pour tous les événements disponibles, leurs interfaces et comment les utiliser efficacement.

## Démarrage rapide

Commencez à utiliser les événements en quelques secondes :

```java
// Écouter les connexions des joueurs
getEventRegistry().register(PlayerConnectEvent.class, event -> {
    getLogger().info("Bienvenue " + event.getPlayer().getName() + " !");
});

// Écouter les messages de chat (événement asynchrone)
getEventRegistry().register(PlayerChatEvent.class, event -> {
    getLogger().info(event.getPlayer().getName() + " : " + event.getMessage());
});
```

:::tip Intégration IntelliJ
Utilisez le live template `hyevent` pour créer rapidement des écouteurs d'événements. Tapez simplement `hyevent` et appuyez sur Tab pour développer un bloc d'enregistrement d'événement complet.
:::

## Architecture du système d'événements

Le système d'événements de Hytale repose sur deux hiérarchies parallèles :

1. **Hiérarchie IEvent** - Dispatch d'événements traditionnel pour les événements généraux du serveur (connexions des joueurs, changements de monde, permissions)
2. **Hiérarchie EcsEvent** - Événements du système Entity Component System pour les mécaniques de gameplay (interactions avec les blocs, changements d'inventaire, combat)

Les deux systèmes prennent en charge les priorités d'événements, l'annulation (le cas échéant) et des modèles d'enregistrement flexibles.

## Comprendre les deux systèmes d'événements

Hytale utilise deux systèmes d'événements distincts, et il est important de comprendre quand utiliser chacun :

### Système IEvent (EventBus)

Utilisez l'EventBus pour les **événements de cycle de vie du serveur et d'état des joueurs** :

- Connexion/déconnexion des joueurs
- Démarrage/arrêt du serveur
- Création/suppression de monde
- Changements de permissions
- Messages de chat

**Méthode d'enregistrement :** `getEventRegistry().register(...)`

```java
@Override
protected void setup() {
    // Enregistrer avec priorité
    getEventRegistry().register(
        EventPriority.EARLY,
        PlayerChatEvent.class,
        this::handleChat
    );
}

private void handleChat(PlayerChatEvent event) {
    // Filtrer les gros mots
    if (event.getMessage().toLowerCase().contains("grosmot")) {
        event.setCancelled(true);
        event.getPlayer().sendMessage("Merci de garder le chat approprié !");
    }
}
```

### Système EcsEvent (EntityEventSystem)

Utilisez EntityEventSystem pour les **événements de gameplay et liés aux entités** :

- Cassage/placement de blocs
- Lâcher/ramassage d'objets
- Changements d'inventaire
- Événements de dégâts
- Craft

**Méthode d'enregistrement :** `getEntityStoreRegistry().registerSystem(...)`

```java
public class BlockProtectionSystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {

    public BlockProtectionSystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(int index, @Nonnull ArchetypeChunk<EntityStore> chunk,
                      @Nonnull Store<EntityStore> store,
                      @Nonnull CommandBuffer<EntityStore> buffer,
                      @Nonnull BreakBlockEvent event) {
        // Protéger la zone de spawn (dans un rayon de 100 blocs de l'origine)
        BlockPos pos = event.getTargetBlock();
        if (Math.abs(pos.getX()) < 100 && Math.abs(pos.getZ()) < 100) {
            event.setCancelled(true);
        }
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty(); // Correspondre à toutes les entités
    }
}
```

:::info Les événements ECS nécessitent une classe System
Les événements ECS ne peuvent pas utiliser un simple enregistrement par lambda. Vous devez créer une classe étendant `EntityEventSystem` et l'enregistrer via `getEntityStoreRegistry().registerSystem(new VotreSystem())`.
:::

:::tip Intégration IntelliJ
Utilisez le live template `hyecs` pour créer rapidement des classes EntityEventSystem. Tapez `hyecs`, appuyez sur Tab, et remplissez le type d'événement.
:::

## Live Templates IntelliJ

Le [Plugin IntelliJ Hytale](https://plugins.jetbrains.com/plugin/hytale) fournit des live templates pour un développement rapide :

| Template | Description | Développé en |
|----------|-------------|--------------|
| `hyevent` | Écouteur d'événement | Bloc `getEventRegistry().register(...)` complet |
| `hyecs` | Système d'événement ECS | Classe `EntityEventSystem` complète avec méthode handle |
| `hycmd` | Gestionnaire de commande | Enregistrement de commande avec exécuteur |
| `hylog` | Instruction de log | `getLogger().info(...)` |

**Exemple : expansion de `hyevent`**

Tapez `hyevent` puis Tab :
```java
getEventRegistry().register(EventPriority.NORMAL, $EVENT_CLASS$.class, event -> {
    $END$
});
```

**Exemple : expansion de `hyecs`**

Tapez `hyecs` puis Tab :
```java
public class $NAME$System extends EntityEventSystem<EntityStore, $EVENT$> {
    public $NAME$System() {
        super($EVENT$.class);
    }

    @Override
    public void handle(int index, @Nonnull ArchetypeChunk<EntityStore> chunk,
                      @Nonnull Store<EntityStore> store,
                      @Nonnull CommandBuffer<EntityStore> buffer,
                      @Nonnull $EVENT$ event) {
        $END$
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

## Interfaces principales

### IBaseEvent

L'interface racine pour tous les événements dans le système d'événements de Hytale. Le paramètre générique `KeyType` permet aux événements d'être indexés pour un dispatch sélectif.

```java
public interface IBaseEvent<KeyType> {
}
```

### IEvent

Interface pour les événements synchrones qui s'exécutent immédiatement sur le thread principal.

```java
public interface IEvent<KeyType> extends IBaseEvent<KeyType> {
}
```

### IAsyncEvent

Interface pour les événements asynchrones qui retournent un `CompletableFuture` et peuvent s'exécuter en dehors du thread principal.

```java
public interface IAsyncEvent<KeyType> extends IBaseEvent<KeyType> {
}
```

### ICancellable

Interface pour les événements qui peuvent être annulés pour empêcher leur comportement par défaut.

```java
public interface ICancellable {
   boolean isCancelled();
   void setCancelled(boolean cancelled);
}
```

### IProcessedEvent

Interface pour les événements qui suivent le post-traitement par les handlers.

```java
public interface IProcessedEvent {
   void processEvent(@Nonnull String handlerName);
}
```

### EcsEvent

Classe de base pour les événements du système Entity Component System, séparée de la hiérarchie `IEvent`.

```java
public abstract class EcsEvent {
   public EcsEvent() {
   }
}
```

### CancellableEcsEvent

Classe de base pour les événements ECS qui prennent en charge l'annulation.

```java
public abstract class CancellableEcsEvent extends EcsEvent implements ICancellableEcsEvent {
   private boolean cancelled = false;

   public boolean isCancelled() { ... }
   public void setCancelled(boolean cancelled) { ... }
}
```

## Priorités des événements

Les événements sont dispatchés aux handlers dans l'ordre de priorité. Les valeurs plus basses s'exécutent en premier.

| Priorité | Valeur | Description | Cas d'utilisation |
|----------|--------|-------------|-------------------|
| `FIRST` | -21844 | Priorité la plus haute, s'exécute en premier | Vérifications de sécurité, anti-triche, journalisation des entrées |
| `EARLY` | -10922 | Priorité haute | Validation, vérifications de permissions, modifications précoces |
| `NORMAL` | 0 | Priorité par défaut | Traitement standard des événements, logique de jeu |
| `LATE` | 10922 | Priorité basse | Réagir aux modifications des autres handlers |
| `LAST` | 21844 | Priorité la plus basse, s'exécute en dernier | Journalisation finale, nettoyage, analytiques |

### Bonnes pratiques de priorité

```java
// FIRST : Sécurité et journalisation
getEventRegistry().register(EventPriority.FIRST, PlayerChatEvent.class, event -> {
    auditLog.record(event.getPlayer(), event.getMessage());
});

// EARLY : Validation et filtrage
getEventRegistry().register(EventPriority.EARLY, PlayerChatEvent.class, event -> {
    if (containsProfanity(event.getMessage())) {
        event.setCancelled(true);
    }
});

// NORMAL : Traitement standard
getEventRegistry().register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    broadcastToDiscord(event.getPlayer(), event.getMessage());
});

// LATE : Réagir à l'état final
getEventRegistry().register(EventPriority.LATE, PlayerChatEvent.class, event -> {
    if (!event.isCancelled()) {
        incrementMessageCount(event.getPlayer());
    }
});
```

### Constantes d'événement d'arrêt

Le `ShutdownEvent` définit également des constantes de priorité spéciales pour l'ordre d'arrêt :

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `DISCONNECT_PLAYERS` | -48 | Priorité pour déconnecter les joueurs pendant l'arrêt |
| `UNBIND_LISTENERS` | -40 | Priorité pour délier les listeners pendant l'arrêt |
| `SHUTDOWN_WORLDS` | -32 | Priorité pour arrêter les mondes pendant l'arrêt |

## Méthodes d'enregistrement

Les événements sont enregistrés via les méthodes `EventBus.register()`. L'enregistrement retourne un objet `EventRegistration` qui peut être utilisé pour se désinscrire ultérieurement.

### Enregistrement basique

```java
// Enregistrer avec la priorité par défaut (NORMAL)
EventRegistration registration = eventBus.register(
    PlayerConnectEvent.class,
    event -> {
        Player player = event.getPlayer();
        // Gérer la connexion
    }
);
```

### Enregistrement avec priorité

```java
// Utilisation de l'enum EventPriority
eventBus.register(
    EventPriority.EARLY,
    PlayerChatEvent.class,
    event -> {
        // Gérer le chat tôt dans la chaîne
    }
);

// Utilisation d'une valeur short brute pour une priorité personnalisée
eventBus.register(
    (short) -5000,
    PlayerChatEvent.class,
    event -> {
        // Priorité personnalisée entre EARLY et NORMAL
    }
);
```

### Enregistrement spécifique à une clé

```java
// Enregistrer pour les événements avec une clé spécifique
eventBus.register(
    PlayerReadyEvent.class,
    "my-ready-key",
    event -> {
        // Gère uniquement PlayerReadyEvent avec cette clé spécifique
    }
);
```

### Enregistrement global

```java
// Recevoir TOUS les événements d'un type, quelle que soit la clé
eventBus.registerGlobal(
    EventPriority.NORMAL,
    PlayerEvent.class,
    event -> {
        // Gère toutes les instances de PlayerEvent
    }
);
```

### Enregistrement non géré

```java
// Recevoir les événements qui n'ont pas eu d'autres handlers
eventBus.registerUnhandled(
    PlayerConnectEvent.class,
    event -> {
        // Handler de secours quand aucun autre ne correspond
    }
);
```

### Enregistrement asynchrone

```java
// Enregistrer un handler asynchrone retournant CompletableFuture
eventBus.registerAsync(
    PlayerChatEvent.class,
    event -> CompletableFuture.supplyAsync(() -> {
        // Traitement asynchrone
        return event;
    })
);
```

### Désinscription

```java
// Stocker l'enregistrement
EventRegistration registration = eventBus.register(...);

// Plus tard, se désinscrire
registration.unregister();
```

## Enregistrement des événements ECS

**Important :** Les événements ECS (étendant `EcsEvent` ou `CancellableEcsEvent`) n'utilisent **pas** l'EventBus. Ils nécessitent une classe `EntityEventSystem` dédiée enregistrée via `getEntityStoreRegistry().registerSystem()`.

### Création d'un système d'événement ECS

Pour écouter les événements ECS comme `BreakBlockEvent`, `PlaceBlockEvent` ou les événements d'inventaire, créez une classe étendant `EntityEventSystem` :

```java
package com.example.monplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.BreakBlockEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class BlockBreakSystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {

    public BlockBreakSystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull BreakBlockEvent event
    ) {
        // Gérer l'événement ici
        int x = event.getTargetBlock().getX();
        int y = event.getTargetBlock().getY();
        int z = event.getTargetBlock().getZ();

        // Annuler si nécessaire
        // event.setCancelled(true);
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty(); // Attraper toutes les entités
    }
}
```

### Enregistrement du système

Dans la méthode `setup()` de votre plugin, enregistrez le système :

```java
@Override
protected void setup() {
    // Enregistrer les systèmes d'événements ECS
    getEntityStoreRegistry().registerSystem(new BlockBreakSystem());
    getEntityStoreRegistry().registerSystem(new BlockPlaceSystem());
    // ... autres systèmes ECS
}
```

### Liste des événements ECS

Les événements suivants nécessitent l'enregistrement via `EntityEventSystem` (PAS l'EventBus) :

| Événement | Description |
|-----------|-------------|
| `BreakBlockEvent` | Cassage de bloc |
| `PlaceBlockEvent` | Placement de bloc |
| `DamageBlockEvent` | Dégâts aux blocs |
| `UseBlockEvent.Pre/Post` | Interaction avec les blocs |
| `DropItemEvent` | Lâcher d'objet |
| `SwitchActiveSlotEvent` | Changement d'emplacement de la barre d'action |
| `InteractivelyPickupItemEvent` | Ramassage d'objet |
| `CraftRecipeEvent` | Craft de recette |
| `ChangeGameModeEvent` | Changement de mode de jeu |
| `ChunkSaveEvent` | Sauvegarde de chunk |
| `ChunkUnloadEvent` | Déchargement de chunk |
| `MoonPhaseChangeEvent` | Changement de phase lunaire |
| `PrefabPasteEvent` | Collage de prefab |
| `KillFeedEvent.*` | Messages de kill feed |
| `DiscoverZoneEvent` | Découverte de zone |
| `DiscoverInstanceEvent` | Découverte d'instance |

## Événements asynchrones

Certains événements s'exécutent de manière asynchrone pour éviter de bloquer le thread principal du serveur.

### PlayerChatEvent (Async)

`PlayerChatEvent` est le principal événement asynchrone. Il s'exécute en dehors du thread principal, vous devez donc faire attention à la sécurité des threads.

```java
getEventRegistry().registerAsync(PlayerChatEvent.class, event -> {
    return CompletableFuture.supplyAsync(() -> {
        // Sûr : Opérations en lecture seule
        String message = event.getMessage();
        Player player = event.getPlayer();

        // Sûr : Appels API thread-safe
        boolean hasProfanity = externalApi.checkProfanity(message).join();

        if (hasProfanity) {
            event.setCancelled(true);
        }

        return event;
    });
});
```

:::warning Sécurité des threads
Lors de la gestion d'événements asynchrones :
- Ne modifiez PAS directement l'état du monde (utilisez des tâches planifiées)
- N'itérez PAS sur les collections de joueurs sans synchronisation
- Utilisez des structures de données thread-safe (ConcurrentHashMap, etc.)
- Utilisez CompletableFuture pour chaîner les opérations asynchrones
:::

### Exécuter du code sur le thread principal

Si vous devez modifier l'état du jeu depuis un handler asynchrone :

```java
getEventRegistry().registerAsync(PlayerChatEvent.class, event -> {
    return CompletableFuture.supplyAsync(() -> {
        // Traitement asynchrone
        boolean shouldReward = checkExternalCondition(event.getMessage());

        if (shouldReward) {
            // Planifier sur le thread principal
            getServer().getScheduler().runTask(() -> {
                event.getPlayer().getInventory().addItem(rewardItem);
            });
        }

        return event;
    });
});
```

## Bonnes pratiques d'annulation

### Quand annuler

```java
// Bien : Annuler à la priorité EARLY pour éviter un traitement inutile
getEventRegistry().register(EventPriority.EARLY, PlayerChatEvent.class, event -> {
    if (isMuted(event.getPlayer())) {
        event.setCancelled(true);
        event.getPlayer().sendMessage("Vous êtes muté !");
        return; // Sortir tôt
    }
});
```

### Respecter l'annulation

```java
// Bien : Vérifier l'annulation avant le traitement
getEventRegistry().register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    // Ignorer si un autre plugin a annulé ceci
    if (event.isCancelled()) {
        return;
    }

    // Traiter l'événement
    broadcastMessage(event.getMessage());
});
```

### Réactiver des événements annulés

```java
// Cas rare : Annuler l'annulation d'un autre plugin (à utiliser avec parcimonie !)
getEventRegistry().register(EventPriority.LATE, PlayerChatEvent.class, event -> {
    // Permettre aux admins de contourner les filtres de chat
    if (event.isCancelled() && event.getPlayer().hasPermission("chat.bypass")) {
        event.setCancelled(false);
        getLogger().info("L'admin " + event.getPlayer().getName() + " a contourné le filtre de chat");
    }
});
```

:::warning Réactivation
Évitez d'appeler `setCancelled(false)` sauf si vous avez une fonctionnalité de remplacement spécifique. Réactiver des événements peut casser les mesures de sécurité d'autres plugins.
:::

## Patterns courants

### Message de bienvenue à la connexion

```java
@Override
protected void setup() {
    getEventRegistry().register(PlayerConnectEvent.class, event -> {
        Player player = event.getPlayer();

        // Accueillir le joueur
        player.sendMessage("Bienvenue sur le serveur, " + player.getName() + " !");

        // Diffuser aux autres
        getServer().broadcastMessage(player.getName() + " a rejoint la partie !");
    });
}
```

### Filtrage du chat

```java
@Override
protected void setup() {
    getEventRegistry().register(EventPriority.EARLY, PlayerChatEvent.class, event -> {
        String message = event.getMessage().toLowerCase();

        for (String badWord : bannedWords) {
            if (message.contains(badWord)) {
                event.setCancelled(true);
                event.getPlayer().sendMessage("Merci de garder le chat approprié !");
                return;
            }
        }
    });
}
```

### Système de protection de blocs

```java
public class SpawnProtectionSystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {
    private static final int SPAWN_RADIUS = 50;

    public SpawnProtectionSystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(int index, @Nonnull ArchetypeChunk<EntityStore> chunk,
                      @Nonnull Store<EntityStore> store,
                      @Nonnull CommandBuffer<EntityStore> buffer,
                      @Nonnull BreakBlockEvent event) {
        BlockPos pos = event.getTargetBlock();

        // Vérifier si dans le rayon de protection du spawn
        if (isInSpawnArea(pos)) {
            // Permettre aux ops de casser des blocs
            // Note : Vous devriez obtenir le joueur depuis le contexte de l'événement
            event.setCancelled(true);
        }
    }

    private boolean isInSpawnArea(BlockPos pos) {
        return Math.abs(pos.getX()) < SPAWN_RADIUS
            && Math.abs(pos.getZ()) < SPAWN_RADIUS;
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Restrictions basées sur les permissions

```java
@Override
protected void setup() {
    // Restreindre les changements de monde aux joueurs avec permission
    getEventRegistry().register(EventPriority.FIRST, AddWorldEvent.class, event -> {
        // Autoriser uniquement la création de monde via l'API plugin, pas les commandes joueur
        // Des vérifications de permissions supplémentaires iraient ici
    });
}
```

## Catégories d'événements

### Événements joueur (14 événements)

Événements liés aux actions et au cycle de vie des joueurs.

| Événement | Description |
|-----------|-------------|
| [PlayerEvent](./player-events#playerevent) | Classe de base abstraite pour les événements liés aux joueurs |
| [PlayerRefEvent](./player-events#playerefevent) | Classe de base abstraite utilisant PlayerRef |
| [PlayerConnectEvent](./player-events#playerconnectevent) | Déclenché quand un joueur se connecte au serveur |
| [PlayerDisconnectEvent](./player-events#playerdisconnectevent) | Déclenché quand un joueur se déconnecte |
| [PlayerChatEvent](./player-events#playerchatevent) | Déclenché quand un joueur envoie un message de chat (asynchrone, annulable) |
| [PlayerInteractEvent](./player-events#playerinteractevent) | Déclenché lors des interactions du joueur (déprécié, annulable) |
| [PlayerMouseButtonEvent](./player-events#playermousebuttonevent) | Déclenché lors des actions de bouton de souris (annulable) |
| [PlayerMouseMotionEvent](./player-events#playermousemotionevent) | Déclenché lors des mouvements de souris (annulable) |
| [PlayerSetupConnectEvent](./player-events#playersetupconnectevent) | Déclenché pendant la configuration de connexion (annulable) |
| [PlayerSetupDisconnectEvent](./player-events#playersetupdisconnectevent) | Déclenché pendant la configuration de déconnexion |
| [PlayerReadyEvent](./player-events#playerreadyevent) | Déclenché quand un joueur est prêt |
| [PlayerCraftEvent](./player-events#playercraftevent) | Déclenché lors du craft (déprécié) |
| [AddPlayerToWorldEvent](./player-events#addplayertoworldevent) | Déclenché lors de l'ajout d'un joueur à un monde |
| [DrainPlayerFromWorldEvent](./player-events#drainplayerfromworldevent) | Déclenché lors du retrait d'un joueur d'un monde |

[Voir tous les événements joueur](./player-events)

### Événements bloc (5 événements)

Événements liés aux interactions avec les blocs.

| Événement | Description |
|-----------|-------------|
| [BreakBlockEvent](./block-events#breakblockevent) | Déclenché quand un bloc est cassé (annulable) |
| [PlaceBlockEvent](./block-events#placeblockevent) | Déclenché quand un bloc est placé (annulable) |
| [DamageBlockEvent](./block-events#damageblockevent) | Déclenché quand un bloc subit des dégâts (annulable) |
| [UseBlockEvent](./block-events#useblockevent) | Base abstraite pour les événements d'utilisation de bloc |
| [UseBlockEvent.Pre](./block-events#useblockevenpre) | Déclenché avant l'utilisation du bloc (annulable) |

[Voir tous les événements bloc](./block-events)

### Événements entité (3 événements)

Événements liés aux entités.

| Événement | Description |
|-----------|-------------|
| [EntityEvent](./entity-events#entityevent) | Classe de base abstraite pour les événements d'entité |
| [EntityRemoveEvent](./entity-events#entityremoveevent) | Déclenché quand une entité est supprimée |
| [LivingEntityInventoryChangeEvent](./entity-events#livingentityinventorychangeevent) | Déclenché lors des changements d'inventaire |

[Voir tous les événements entité](./entity-events)

### Événements monde (4 événements)

Événements liés à la gestion des mondes.

| Événement | Description |
|-----------|-------------|
| [WorldEvent](./world-events#worldevent) | Classe de base abstraite pour les événements de monde |
| [AddWorldEvent](./world-events#addworldevent) | Déclenché quand un monde est ajouté (annulable) |
| [RemoveWorldEvent](./world-events#removeworldevent) | Déclenché quand un monde est supprimé (annulable) |
| [StartWorldEvent](./world-events#startworldevent) | Déclenché quand un monde démarre |

[Voir tous les événements monde](./world-events)

### Événements chunk (4 événements)

Événements liés au chargement et à la gestion des chunks.

| Événement | Description |
|-----------|-------------|
| [ChunkEvent](./chunk-events#chunkevent) | Classe de base abstraite pour les événements de chunk |
| [ChunkPreLoadProcessEvent](./chunk-events#chunkpreloadprocessevent) | Déclenché avant le traitement de chargement du chunk |
| [ChunkSaveEvent](./chunk-events#chunksaveevent) | Déclenché quand un chunk est sauvegardé (annulable) |
| [ChunkUnloadEvent](./chunk-events#chunkunloadevent) | Déclenché quand un chunk est déchargé (annulable) |

[Voir tous les événements chunk](./chunk-events)

### Événements serveur (3 événements)

Événements liés au cycle de vie du serveur.

| Événement | Description |
|-----------|-------------|
| [BootEvent](./server-events#bootevent) | Déclenché quand le serveur démarre |
| [ShutdownEvent](./server-events#shutdownevent) | Déclenché quand le serveur s'arrête |
| [PrepareUniverseEvent](./server-events#prepareuniverseevent) | Déclenché pendant la préparation de l'univers (déprécié) |

[Voir tous les événements serveur](./server-events)

### Événements permission (4 événements)

Événements liés aux changements de permissions.

| Événement | Description |
|-----------|-------------|
| [PlayerPermissionChangeEvent](./permission-events#playerpermissionchangeevent) | Base abstraite pour les changements de permissions de joueur |
| [GroupPermissionChangeEvent](./permission-events#grouppermissionchangeevent) | Base abstraite pour les changements de permissions de groupe |
| [PlayerGroupEvent](./permission-events#playergroupevent) | Déclenché lors des changements de groupe de joueur |
| [PluginEvent](./permission-events#pluginevent) | Base abstraite pour les événements de plugin |

[Voir tous les événements permission](./permission-events)

### Événements inventaire (4 événements)

Événements liés aux interactions avec l'inventaire.

| Événement | Description |
|-----------|-------------|
| [DropItemEvent](./inventory-events#dropitemevent) | Déclenché quand un objet est lâché (annulable) |
| [SwitchActiveSlotEvent](./inventory-events#switchactiveslotevent) | Déclenché lors du changement d'emplacement de la barre d'action (annulable) |
| [InteractivelyPickupItemEvent](./inventory-events#interactivelypickupitemevent) | Déclenché lors de la récupération d'un objet (annulable) |
| [CraftRecipeEvent](./inventory-events#craftrecipeevent) | Déclenché lors du craft d'une recette (annulable) |

[Voir tous les événements inventaire](./inventory-events)

## Hiérarchie des événements

```
IBaseEvent<KeyType>
├── IEvent<KeyType>
│   ├── PlayerEvent<KeyType>
│   │   ├── PlayerInteractEvent (annulable, @Deprecated)
│   │   ├── PlayerMouseButtonEvent (annulable)
│   │   ├── PlayerMouseMotionEvent (annulable)
│   │   ├── PlayerReadyEvent
│   │   └── PlayerCraftEvent (@Deprecated)
│   ├── PlayerRefEvent<KeyType>
│   │   └── PlayerDisconnectEvent
│   ├── PlayerConnectEvent
│   ├── PlayerSetupConnectEvent (annulable)
│   ├── PlayerSetupDisconnectEvent
│   ├── AddPlayerToWorldEvent
│   ├── DrainPlayerFromWorldEvent
│   ├── EntityEvent<EntityType, KeyType>
│   │   ├── EntityRemoveEvent
│   │   └── LivingEntityInventoryChangeEvent
│   ├── WorldEvent
│   │   ├── AddWorldEvent (annulable)
│   │   ├── RemoveWorldEvent (annulable)
│   │   └── StartWorldEvent
│   ├── ChunkEvent
│   │   └── ChunkPreLoadProcessEvent (IProcessedEvent)
│   ├── BootEvent
│   ├── ShutdownEvent
│   ├── PrepareUniverseEvent (@Deprecated)
│   ├── AllWorldsLoadedEvent
│   ├── PlayerPermissionChangeEvent
│   │   ├── PlayerGroupEvent
│   │   │   ├── PlayerGroupEvent.Added
│   │   │   └── PlayerGroupEvent.Removed
│   │   ├── PlayerPermissionChangeEvent.GroupAdded
│   │   ├── PlayerPermissionChangeEvent.GroupRemoved
│   │   ├── PlayerPermissionChangeEvent.PermissionsAdded
│   │   └── PlayerPermissionChangeEvent.PermissionsRemoved
│   ├── GroupPermissionChangeEvent
│   │   ├── GroupPermissionChangeEvent.Added
│   │   └── GroupPermissionChangeEvent.Removed
│   ├── PluginEvent
│   │   └── PluginSetupEvent
│   ├── MessagesUpdated
│   ├── GenerateDefaultLanguageEvent
│   ├── TreasureChestOpeningEvent
│   └── LivingEntityUseBlockEvent (@Deprecated)
│
└── IAsyncEvent<KeyType>
    └── PlayerChatEvent (annulable)

EcsEvent
├── CancellableEcsEvent (ICancellableEcsEvent)
│   ├── BreakBlockEvent
│   ├── PlaceBlockEvent
│   ├── DamageBlockEvent
│   ├── DropItemEvent
│   ├── CraftRecipeEvent
│   │   ├── CraftRecipeEvent.Pre
│   │   └── CraftRecipeEvent.Post
│   ├── ChangeGameModeEvent
│   ├── SwitchActiveSlotEvent
│   ├── InteractivelyPickupItemEvent
│   ├── ChunkSaveEvent
│   ├── ChunkUnloadEvent
│   ├── PrefabPasteEvent
│   └── KillFeedEvent.*
│       ├── KillFeedEvent.DecedentMessage
│       ├── KillFeedEvent.Display
│       └── KillFeedEvent.KillerMessage
├── UseBlockEvent
│   ├── UseBlockEvent.Pre (ICancellableEcsEvent)
│   └── UseBlockEvent.Post
├── DiscoverZoneEvent
│   └── DiscoverZoneEvent.Display (ICancellableEcsEvent)
├── MoonPhaseChangeEvent
├── PrefabPlaceEntityEvent
└── DiscoverInstanceEvent
    └── DiscoverInstanceEvent.Display (ICancellableEcsEvent)
```

## Tableau de référence rapide

### Tous les événements

| Nom de l'événement | Classe parente | Annulable | Async | Package |
|--------------------|----------------|:---------:|:-----:|---------|
| **Événements joueur** |||||
| PlayerEvent | IEvent | Non | Non | player |
| PlayerRefEvent | IEvent | Non | Non | player |
| PlayerConnectEvent | IEvent | Non | Non | player |
| PlayerDisconnectEvent | PlayerRefEvent | Non | Non | player |
| PlayerChatEvent | IAsyncEvent | Oui | Oui | player |
| PlayerInteractEvent | PlayerEvent | Oui | Non | player |
| PlayerMouseButtonEvent | PlayerEvent | Oui | Non | player |
| PlayerMouseMotionEvent | PlayerEvent | Oui | Non | player |
| PlayerSetupConnectEvent | IEvent | Oui | Non | player |
| PlayerSetupDisconnectEvent | IEvent | Non | Non | player |
| PlayerReadyEvent | PlayerEvent | Non | Non | player |
| PlayerCraftEvent | PlayerEvent | Non | Non | player |
| AddPlayerToWorldEvent | IEvent | Non | Non | player |
| DrainPlayerFromWorldEvent | IEvent | Non | Non | player |
| **Événements entité** |||||
| EntityEvent | IEvent | Non | Non | entity |
| EntityRemoveEvent | EntityEvent | Non | Non | entity |
| LivingEntityInventoryChangeEvent | EntityEvent | Non | Non | entity |
| LivingEntityUseBlockEvent | IEvent | Non | Non | entity |
| **Événements bloc (ECS)** |||||
| BreakBlockEvent | CancellableEcsEvent | Oui | Non | ecs |
| PlaceBlockEvent | CancellableEcsEvent | Oui | Non | ecs |
| DamageBlockEvent | CancellableEcsEvent | Oui | Non | ecs |
| UseBlockEvent | EcsEvent | Non | Non | ecs |
| UseBlockEvent.Pre | UseBlockEvent | Oui | Non | ecs |
| UseBlockEvent.Post | UseBlockEvent | Non | Non | ecs |
| **Événements monde** |||||
| WorldEvent | IEvent | Non | Non | world.events |
| AddWorldEvent | WorldEvent | Oui | Non | world.events |
| RemoveWorldEvent | WorldEvent | Oui | Non | world.events |
| StartWorldEvent | WorldEvent | Non | Non | world.events |
| AllWorldsLoadedEvent | IEvent | Non | Non | world.events |
| **Événements chunk** |||||
| ChunkEvent | IEvent | Non | Non | world.events |
| ChunkPreLoadProcessEvent | ChunkEvent | Non | Non | world.events |
| ChunkSaveEvent | CancellableEcsEvent | Oui | Non | world.events.ecs |
| ChunkUnloadEvent | CancellableEcsEvent | Oui | Non | world.events.ecs |
| MoonPhaseChangeEvent | EcsEvent | Non | Non | world.events.ecs |
| **Événements serveur** |||||
| BootEvent | IEvent | Non | Non | events |
| ShutdownEvent | IEvent | Non | Non | events |
| PrepareUniverseEvent | IEvent | Non | Non | events |
| **Événements permission** |||||
| PlayerPermissionChangeEvent | IEvent | Non | Non | permissions |
| GroupPermissionChangeEvent | IEvent | Non | Non | permissions |
| PlayerGroupEvent | PlayerPermissionChangeEvent | Non | Non | permissions |
| **Événements inventaire (ECS)** |||||
| DropItemEvent | CancellableEcsEvent | Oui | Non | ecs |
| SwitchActiveSlotEvent | CancellableEcsEvent | Oui | Non | ecs |
| InteractivelyPickupItemEvent | CancellableEcsEvent | Oui | Non | ecs |
| CraftRecipeEvent | CancellableEcsEvent | Oui | Non | ecs |
| ChangeGameModeEvent | CancellableEcsEvent | Oui | Non | ecs |
| **Événements plugin** |||||
| PluginEvent | IEvent | Non | Non | plugin.event |
| PluginSetupEvent | PluginEvent | Non | Non | plugin.event |
| **Événements divers** |||||
| DiscoverZoneEvent | EcsEvent | Non | Non | ecs |
| DiscoverZoneEvent.Display | DiscoverZoneEvent | Oui | Non | ecs |
| KillFeedEvent.DecedentMessage | CancellableEcsEvent | Oui | Non | damage.event |
| KillFeedEvent.Display | CancellableEcsEvent | Oui | Non | damage.event |
| KillFeedEvent.KillerMessage | CancellableEcsEvent | Oui | Non | damage.event |
| MessagesUpdated | IEvent | Non | Non | i18n.event |
| GenerateDefaultLanguageEvent | IEvent | Non | Non | i18n.event |
| PrefabPasteEvent | CancellableEcsEvent | Oui | Non | prefab.event |
| PrefabPlaceEntityEvent | EcsEvent | Non | Non | prefab.event |
| TreasureChestOpeningEvent | IEvent | Non | Non | objectives.events |
| DiscoverInstanceEvent | EcsEvent | Non | Non | instances.event |
| DiscoverInstanceEvent.Display | DiscoverInstanceEvent | Oui | Non | instances.event |

## Bonnes pratiques

### Directives pour les handlers d'événements

1. **Gardez les handlers rapides** - Les handlers d'événements bloquent le thread principal (sauf les événements asynchrones). Déléguez le travail lourd à des tâches asynchrones.

2. **Vérifiez l'annulation** - Vérifiez toujours `isCancelled()` au début de votre handler si d'autres plugins pourraient annuler l'événement.

3. **Utilisez les priorités appropriées** - Utilisez `FIRST` pour la validation, `NORMAL` pour le traitement standard, `LAST` pour la journalisation.

4. **Désinscrivez-vous quand c'est terminé** - Conservez votre `EventRegistration` et appelez `unregister()` quand votre plugin se désactive.

5. **Gérez les exceptions** - Enveloppez le code du handler dans un try-catch pour éviter que les plantages ne cassent les autres handlers.

### Directives d'annulation

1. **Annulez tôt** - Annulez les événements à la priorité `FIRST` ou `EARLY` pour éviter un traitement inutile.

2. **Respectez l'annulation** - Vérifiez `isCancelled()` et retournez tôt sauf si vous avez une raison spécifique de continuer.

3. **Documentez l'annulation** - Si votre plugin annule des événements, documentez pourquoi pour les administrateurs de serveur.

4. **Ne réactivez pas sans raison** - Évitez d'appeler `setCancelled(false)` sauf si vous implémentez une fonctionnalité de remplacement.

## Voir aussi

- [Guide de développement de plugins](../getting-started)
- [Référence API EventBus](../api/eventbus)
- [Vue d'ensemble du système ECS](../../ecs/overview)
