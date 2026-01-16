---
id: events
title: Systeme d'Evenements
sidebar_label: Evenements
sidebar_position: 3
description: Documentation complete du systeme d'evenements EventBus pour le serveur Hytale
---

# Systeme d'Evenements

:::info Documentation v2 - Vérifiée
Cette documentation a été vérifiée par rapport au code source décompilé du serveur en utilisant une analyse multi-agent. Toutes les informations incluent des références aux fichiers sources.
:::

## Qu'est-ce qu'un systeme d'evenements ?

Un **systeme d'evenements** permet a differentes parties du code de communiquer sans se connaitre directement. Au lieu d'appeler des methodes sur d'autres objets, le code "publie" des evenements et d'autres parties "s'abonnent" pour les recevoir.

### Le probleme sans evenements

Imaginez que vous voulez que plusieurs choses se produisent quand un joueur rejoint le serveur :
- Envoyer un message de bienvenue
- Charger son inventaire depuis la base de donnees
- Notifier ses amis qu'il est en ligne
- Demarrer son timer de quete quotidienne

Sans evenements, le code de connexion devrait connaitre et appeler tous ces systemes :

```java
// Sans evenements - fortement couple, difficile a maintenir
void onPlayerConnect(Player player) {
    messageSystem.sendWelcome(player);      // Connexion connait messagerie
    database.loadInventory(player);          // Connexion connait base de donnees
    friendSystem.notifyOnline(player);       // Connexion connait systeme d'amis
    questSystem.startDailyTimer(player);     // Connexion connait systeme de quetes
}
```

Ajouter une nouvelle fonctionnalite signifie modifier le code de connexion a chaque fois.

### La solution evenementielle

Avec les evenements, le code de connexion annonce simplement "un joueur s'est connecte" et quiconque interesse peut reagir :

```java
// Avec evenements - faiblement couple, facile a etendre
void onPlayerConnect(Player player) {
    eventBus.dispatch(new PlayerConnectEvent(player));
    // C'est tout ! Les autres systemes ecoutent cet evenement
}

// Ailleurs, completement independant :
eventBus.register(PlayerConnectEvent.class, event -> sendWelcome(event.getPlayer()));
eventBus.register(PlayerConnectEvent.class, event -> loadInventory(event.getPlayer()));
// Ajoutez de nouveaux listeners sans toucher au code de connexion !
```

### Analogie du monde reel

Pensez aux evenements comme un **abonnement a un journal** :

| Concept | Systeme d'evenements | Journal |
|---------|---------------------|---------|
| **Editeur** | Code qui declenche les evenements | Entreprise de presse |
| **Evenement** | Ce qui s'est passe | Le journal du jour |
| **Abonne** | Code qui ecoute les evenements | Personnes abonnees |
| **EventBus** | Le mecanisme de livraison | Service postal |

- Le journal ne sait pas qui sont ses lecteurs
- Les lecteurs n'ont pas besoin de visiter l'imprimerie
- De nouveaux lecteurs peuvent s'abonner a tout moment
- Les lecteurs peuvent se desabonner quand ils demenagent

### Evenements Sync vs Async

Hytale supporte deux types d'evenements :

| Type | Quand l'utiliser | Analogie |
|------|------------------|----------|
| **Synchrone** | Quand vous avez besoin d'une reponse immediate ou voulez annuler une action | Appel telephonique - vous attendez une reponse |
| **Asynchrone** | Quand l'action peut se faire en arriere-plan | Email - vous n'attendez pas de reponse |

**Exemple** : Un filtre de chat devrait etre **synchrone** (vous devez bloquer le message avant qu'il soit envoye), mais enregistrer dans une base de donnees peut etre **asynchrone** (le joueur n'a pas besoin d'attendre).

### Priorites des evenements

Plusieurs abonnes peuvent ecouter le meme evenement. Les priorites controlent qui reagit en premier :

```
FIRST (plus haute) → Verifications de securite, validation
EARLY              → Transformation de donnees, preprocessing
NORMAL             → Logique metier principale
LATE               → Logging, analytics
LAST (plus basse)  → Nettoyage, comportement par defaut
```

**Exemple** : Un message de chat passe par :
1. **FIRST** : Filtre anti-spam (peut annuler si spam)
2. **EARLY** : Filtre de censure (modifie les gros mots)
3. **NORMAL** : Plugin de chat ajoute prefixe [VIP]
4. **LATE** : Analytics enregistre le message
5. **LAST** : Systeme de backup sauvegarde l'historique du chat

---

## Implementation d'Hytale

Le systeme d'evenements d'Hytale est base sur un pattern publish-subscribe (publication-abonnement) qui permet aux modules et plugins de reagir aux actions du jeu sans couplage fort avec le code central du serveur.

## Architecture

### Hierarchie des Classes

```
IBaseEvent<KeyType>
├── IEvent<KeyType>          (evenements synchrones)
└── IAsyncEvent<KeyType>     (evenements asynchrones)
```

Le systeme utilise un type generique `KeyType` qui permet de filtrer les evenements par cle. Par exemple, les evenements de joueur peuvent utiliser l'UUID du joueur comme cle.

### EventBus

L'`EventBus` est le composant central qui gere l'enregistrement et la distribution des evenements.

```java
public class EventBus implements IEventBus {
    private final Map<Class<? extends IBaseEvent<?>>, EventBusRegistry<?, ?, ?>> registryMap;
    private final boolean timeEvents;

    public EventBus(boolean timeEvents) {
        this.timeEvents = timeEvents;
    }
}
```

Le parametre `timeEvents` active le suivi des performances pour chaque handler d'evenement.

### Registries Sync vs Async

Le systeme distingue deux types de registries :

#### SyncEventBusRegistry

Pour les evenements synchrones (`IEvent`), l'execution est bloquante et sequentielle :

```java
// Dispatch synchrone - retourne l'evenement apres traitement
EventType result = eventBus.dispatchFor(MyEvent.class, key).dispatch(event);
```

#### AsyncEventBusRegistry

Pour les evenements asynchrones (`IAsyncEvent`), l'execution utilise `CompletableFuture` :

```java
// Dispatch asynchrone - retourne un Future
CompletableFuture<EventType> future = eventBus.dispatchForAsync(MyAsyncEvent.class, key).dispatch(event);
```

## S'abonner aux Evenements

### Enregistrement Simple

```java
// Evenement sans cle (KeyType = Void)
eventBus.register(BootEvent.class, event -> {
    System.out.println("Le serveur demarre !");
});

// Evenement avec cle
eventBus.register(PlayerChatEvent.class, "chatChannel", event -> {
    System.out.println(event.getSender().getUsername() + ": " + event.getContent());
});
```

### Enregistrement avec Priorite

```java
// Utilisation de l'enum EventPriority
eventBus.register(EventPriority.EARLY, PlayerConnectEvent.class, event -> {
    // Execute avant les handlers NORMAL
});

// Utilisation d'une valeur short personnalisee
eventBus.register((short) -100, PlayerConnectEvent.class, event -> {
    // Valeurs negatives = plus haute priorite
});
```

### Enregistrement Global

Les handlers globaux sont appeles pour TOUS les evenements d'un type, quelle que soit la cle :

```java
// Intercepte tous les PlayerChatEvent, peu importe le channel
eventBus.registerGlobal(PlayerChatEvent.class, event -> {
    logChat(event);
});
```

### Enregistrement Unhandled

Les handlers "unhandled" ne sont appeles QUE si aucun autre handler n'a traite l'evenement :

```java
eventBus.registerUnhandled(PlayerInteractEvent.class, event -> {
    // Comportement par defaut si aucun handler specifique
    event.getPlayer().sendMessage("Action non supportee");
});
```

### Enregistrement Asynchrone

Pour les evenements async, les handlers utilisent des `Function` sur `CompletableFuture` :

```java
eventBus.registerAsync(PlayerChatEvent.class, future -> {
    return future.thenApply(event -> {
        // Traitement asynchrone
        filterBadWords(event);
        return event;
    });
});

// Avec priorite
eventBus.registerAsync(EventPriority.FIRST, PlayerChatEvent.class, future -> {
    return future.thenCompose(event -> {
        return checkPermissionsAsync(event.getSender())
            .thenApply(allowed -> {
                if (!allowed) event.setCancelled(true);
                return event;
            });
    });
});
```

### Desinscription

L'enregistrement retourne un `EventRegistration` permettant de se desinscrire :

```java
EventRegistration<Void, BootEvent> registration = eventBus.register(BootEvent.class, event -> {
    // Handler
});

// Plus tard, pour se desinscrire
registration.unregister();

// Verifier si toujours actif
if (registration.isEnabled()) {
    // Le handler est encore actif
}
```

### Combiner des Registrations

```java
EventRegistration<?, ?> combined = EventRegistration.combine(
    registration1,
    registration2,
    registration3
);

// Desinscrit tous les handlers en une fois
combined.unregister();
```

## Priorites d'Evenements

### Enum EventPriority

```java
public enum EventPriority {
    FIRST((short) -21844),   // Plus haute priorite
    EARLY((short) -10922),
    NORMAL((short) 0),       // Priorite par defaut
    LATE((short) 10922),
    LAST((short) 21844);     // Plus basse priorite
}
```

### Ordre d'Execution

1. Les handlers sont tries par priorite (valeur short croissante)
2. Au sein d'une meme priorite, l'ordre d'enregistrement est preserve
3. Les handlers globaux sont executes apres les handlers specifiques
4. Les handlers unhandled ne sont appeles que si aucun autre n'a traite l'evenement

### Priorites Speciales pour Shutdown

`ShutdownEvent` definit des constantes de priorite specifiques :

```java
public class ShutdownEvent implements IEvent<Void> {
    public static final short DISCONNECT_PLAYERS = -48;
    public static final short UNBIND_LISTENERS = -40;
    public static final short SHUTDOWN_WORLDS = -32;
}
```

Utilisation :

```java
eventBus.register(ShutdownEvent.DISCONNECT_PLAYERS, ShutdownEvent.class, event -> {
    // Deconnecter les joueurs en premier
});

eventBus.register(ShutdownEvent.SHUTDOWN_WORLDS, ShutdownEvent.class, event -> {
    // Sauvegarder les mondes ensuite
});
```

## Annulation d'Evenements (ICancellable)

### Interface ICancellable

```java
public interface ICancellable {
    boolean isCancelled();
    void setCancelled(boolean cancelled);
}
```

### Utilisation

```java
eventBus.register(EventPriority.FIRST, PlayerChatEvent.class, event -> {
    if (containsBadWords(event.getContent())) {
        event.setCancelled(true);  // Annule l'envoi du message
        event.getSender().sendMessage("Message bloque !");
    }
});

// Les handlers suivants peuvent verifier l'annulation
eventBus.register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    if (event.isCancelled()) {
        return; // Ignorer si deja annule
    }
    // Traitement normal
});
```

### Evenements Annulables Disponibles

| Evenement | Description |
|-----------|-------------|
| `PlayerChatEvent` | Message de chat |
| `PlayerInteractEvent` | Interaction joueur |
| `PlayerSetupConnectEvent` | Connexion joueur (pre-spawn) |
| `PlayerMouseButtonEvent` | Clic souris |
| `PlayerMouseMotionEvent` | Mouvement souris |
| `BreakBlockEvent` | Destruction de bloc |
| `PlaceBlockEvent` | Placement de bloc |
| `DamageBlockEvent` | Degats sur bloc |
| `UseBlockEvent.Pre` | Utilisation de bloc (pre) |
| `DropItemEvent` | Lacher d'item |
| `CraftRecipeEvent` | Craft de recette |
| `SwitchActiveSlotEvent` | Changement de slot actif |
| `ChangeGameModeEvent` | Changement de mode de jeu |
| `InteractivelyPickupItemEvent` | Ramassage d'item |
| `DiscoverZoneEvent.Display` | Affichage decouverte de zone |

## Liste des Evenements

### Evenements Serveur

| Evenement | Type | Annulable | Description |
|-----------|------|-----------|-------------|
| `BootEvent` | Sync | Non | Le serveur demarre |
| `ShutdownEvent` | Sync | Non | Le serveur s'arrete |
| `PrepareUniverseEvent` | Sync | Non | Preparation de l'univers (deprecie) |

### Evenements Joueur

| Evenement | Type | Annulable | Description |
|-----------|------|-----------|-------------|
| `PlayerSetupConnectEvent` | Sync | Oui | Pre-connexion (authentification) |
| `PlayerConnectEvent` | Sync | Non | Connexion etablie |
| `PlayerSetupDisconnectEvent` | Sync | Non | Pre-deconnexion |
| `PlayerDisconnectEvent` | Sync | Non | Deconnexion |
| `AddPlayerToWorldEvent` | Sync | Non | Joueur ajoute au monde |
| `DrainPlayerFromWorldEvent` | Sync | Non | Joueur retire du monde |
| `PlayerReadyEvent` | Sync | Non | Joueur pret |
| `PlayerChatEvent` | Async | Oui | Message de chat |
| `PlayerInteractEvent` | Sync | Oui | Interaction (deprecie) |
| `PlayerCraftEvent` | Sync | Non | Craft (deprecie) |
| `PlayerMouseButtonEvent` | Sync | Oui | Clic souris |
| `PlayerMouseMotionEvent` | Sync | Oui | Mouvement souris |

### Evenements Entite

| Evenement | Type | Annulable | Description |
|-----------|------|-----------|-------------|
| `EntityRemoveEvent` | Sync | Non | Entite supprimee |
| `LivingEntityInventoryChangeEvent` | Sync | Non | Changement inventaire |
| `LivingEntityUseBlockEvent` | Sync | Non | Utilisation bloc (deprecie) |

### Evenements ECS (Entity Component System)

| Evenement | Type | Annulable | Description |
|-----------|------|-----------|-------------|
| `BreakBlockEvent` | ECS | Oui | Destruction de bloc |
| `PlaceBlockEvent` | ECS | Oui | Placement de bloc |
| `DamageBlockEvent` | ECS | Oui | Degats sur bloc |
| `UseBlockEvent.Pre` | ECS | Oui | Pre-utilisation bloc |
| `UseBlockEvent.Post` | ECS | Non | Post-utilisation bloc |
| `DropItemEvent.PlayerRequest` | ECS | Oui | Demande de drop |
| `DropItemEvent.Drop` | ECS | Oui | Drop effectif |
| `CraftRecipeEvent.Pre` | ECS | Oui | Pre-craft |
| `CraftRecipeEvent.Post` | ECS | Non | Post-craft |
| `SwitchActiveSlotEvent` | ECS | Oui | Changement slot |
| `ChangeGameModeEvent` | ECS | Oui | Changement mode jeu |
| `InteractivelyPickupItemEvent` | ECS | Oui | Ramassage item |
| `DiscoverZoneEvent.Display` | ECS | Oui | Affichage zone |

### Evenements Permissions

| Evenement | Type | Annulable | Description |
|-----------|------|-----------|-------------|
| `PlayerPermissionChangeEvent.PermissionsAdded` | Sync | Non | Permissions ajoutees |
| `PlayerPermissionChangeEvent.PermissionsRemoved` | Sync | Non | Permissions retirees |
| `PlayerPermissionChangeEvent.GroupAdded` | Sync | Non | Groupe ajoute |
| `PlayerPermissionChangeEvent.GroupRemoved` | Sync | Non | Groupe retire |
| `GroupPermissionChangeEvent.Added` | Sync | Non | Permissions groupe ajoutees |
| `GroupPermissionChangeEvent.Removed` | Sync | Non | Permissions groupe retirees |
| `PlayerGroupEvent.Added` | Sync | Non | Joueur ajoute au groupe |
| `PlayerGroupEvent.Removed` | Sync | Non | Joueur retire du groupe |

## Creer ses Propres Evenements

### Evenement Synchrone Simple

```java
public class MyCustomEvent implements IEvent<Void> {
    private final String message;

    public MyCustomEvent(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    @Override
    public String toString() {
        return "MyCustomEvent{message='" + message + "'}";
    }
}
```

### Evenement avec Cle

```java
public class PlayerScoreEvent implements IEvent<UUID> {
    private final UUID playerId;
    private final int score;

    public PlayerScoreEvent(UUID playerId, int score) {
        this.playerId = playerId;
        this.score = score;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public int getScore() {
        return score;
    }
}

// Enregistrement avec cle UUID
eventBus.register(PlayerScoreEvent.class, player.getUuid(), event -> {
    // Seulement appele pour ce joueur specifique
});
```

### Evenement Annulable

```java
public class PlayerTeleportEvent implements IEvent<Void>, ICancellable {
    private final Player player;
    private Vector3d destination;
    private boolean cancelled = false;

    public PlayerTeleportEvent(Player player, Vector3d destination) {
        this.player = player;
        this.destination = destination;
    }

    public Player getPlayer() {
        return player;
    }

    public Vector3d getDestination() {
        return destination;
    }

    public void setDestination(Vector3d destination) {
        this.destination = destination;
    }

    @Override
    public boolean isCancelled() {
        return cancelled;
    }

    @Override
    public void setCancelled(boolean cancelled) {
        this.cancelled = cancelled;
    }
}
```

### Evenement Asynchrone

```java
public class AsyncDatabaseEvent implements IAsyncEvent<Void> {
    private final String query;
    private Object result;

    public AsyncDatabaseEvent(String query) {
        this.query = query;
    }

    public String getQuery() {
        return query;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }
}

// Dispatch asynchrone
CompletableFuture<AsyncDatabaseEvent> future = eventBus
    .dispatchForAsync(AsyncDatabaseEvent.class)
    .dispatch(new AsyncDatabaseEvent("SELECT * FROM players"));

future.thenAccept(event -> {
    System.out.println("Resultat de la requete : " + event.getResult());
});
```

### Evenement ECS

Pour les evenements dans le systeme Entity Component System :

```java
// Evenement ECS simple
public class MyEntityEvent extends EcsEvent {
    private final String data;

    public MyEntityEvent(String data) {
        this.data = data;
    }

    public String getData() {
        return data;
    }
}

// Evenement ECS annulable
public class MyEntityCancellableEvent extends CancellableEcsEvent {
    private final int value;

    public MyEntityCancellableEvent(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
```

## Dispatch d'Evenements

### Dispatch Simple

```java
// Creer et dispatcher un evenement
MyCustomEvent event = new MyCustomEvent("Hello World");
MyCustomEvent result = eventBus.dispatchFor(MyCustomEvent.class).dispatch(event);

// Verifier si annule (si applicable)
if (result instanceof ICancellable && ((ICancellable) result).isCancelled()) {
    // L'evenement a ete annule
}
```

### Dispatch avec Cle

```java
UUID playerId = player.getUuid();
PlayerScoreEvent event = new PlayerScoreEvent(playerId, 100);

// Dispatch vers les handlers enregistres pour cette cle
eventBus.dispatchFor(PlayerScoreEvent.class, playerId).dispatch(event);
```

### Dispatch Asynchrone

```java
PlayerChatEvent chatEvent = new PlayerChatEvent(sender, targets, message);

CompletableFuture<PlayerChatEvent> future = eventBus
    .dispatchForAsync(PlayerChatEvent.class)
    .dispatch(chatEvent);

future.whenComplete((event, error) -> {
    if (error != null) {
        logger.error("Echec de l'evenement chat", error);
        return;
    }

    if (!event.isCancelled()) {
        broadcastMessage(event);
    }
});
```

### Verifier les Listeners

```java
IEventDispatcher<MyEvent, MyEvent> dispatcher = eventBus.dispatchFor(MyEvent.class);

if (dispatcher.hasListener()) {
    // Au moins un handler est enregistre
    dispatcher.dispatch(new MyEvent());
} else {
    // Aucun handler, on peut optimiser
}
```

## Exemples Complets

### Plugin de Moderation du Chat

```java
public class ChatModerationPlugin {
    private final EventBus eventBus;
    private final Set<String> bannedWords;
    private EventRegistration<?, ?> registration;

    public ChatModerationPlugin(EventBus eventBus) {
        this.eventBus = eventBus;
        this.bannedWords = loadBannedWords();
    }

    public void enable() {
        registration = eventBus.registerAsync(
            EventPriority.FIRST,
            PlayerChatEvent.class,
            this::handleChat
        );
    }

    public void disable() {
        if (registration != null) {
            registration.unregister();
        }
    }

    private CompletableFuture<PlayerChatEvent> handleChat(
            CompletableFuture<PlayerChatEvent> future) {
        return future.thenApply(event -> {
            String content = event.getContent().toLowerCase();

            for (String word : bannedWords) {
                if (content.contains(word)) {
                    event.setCancelled(true);
                    // Notifier le joueur en async
                    CompletableFuture.runAsync(() -> {
                        warnPlayer(event.getSender(), word);
                    });
                    break;
                }
            }

            return event;
        });
    }
}
```

### Protection de Zone

```java
public class ZoneProtectionPlugin {
    private final EventBus eventBus;
    private final List<EventRegistration<?, ?>> registrations = new ArrayList<>();

    public void enable() {
        // Bloquer la destruction de blocs
        registrations.add(eventBus.register(
            EventPriority.FIRST,
            BreakBlockEvent.class,
            this::onBlockBreak
        ));

        // Bloquer le placement de blocs
        registrations.add(eventBus.register(
            EventPriority.FIRST,
            PlaceBlockEvent.class,
            this::onBlockPlace
        ));
    }

    public void disable() {
        registrations.forEach(EventRegistration::unregister);
        registrations.clear();
    }

    private void onBlockBreak(BreakBlockEvent event) {
        Vector3i pos = event.getTargetBlock();
        if (isProtectedZone(pos)) {
            event.setCancelled(true);
        }
    }

    private void onBlockPlace(PlaceBlockEvent event) {
        Vector3i pos = event.getTargetBlock();
        if (isProtectedZone(pos)) {
            event.setCancelled(true);
        }
    }
}
```

### Gestion des Connexions

```java
public class ConnectionManager {
    private final EventBus eventBus;

    public void enable() {
        // Pre-connexion : verification whitelist
        eventBus.register(EventPriority.FIRST, PlayerSetupConnectEvent.class, event -> {
            if (!isWhitelisted(event.getUuid())) {
                event.setCancelled(true);
                event.setReason("Vous n'etes pas sur la whitelist !");
            }
        });

        // Connexion etablie : message de bienvenue
        eventBus.register(PlayerConnectEvent.class, event -> {
            World spawnWorld = getSpawnWorld();
            event.setWorld(spawnWorld);
        });

        // Joueur dans le monde : broadcast (evenement global)
        eventBus.registerGlobal(AddPlayerToWorldEvent.class, event -> {
            String username = event.getHolder()
                .getComponent(Player.getComponentType())
                .getUsername();
            broadcastJoin(username);
        });

        // Deconnexion
        eventBus.register(PlayerDisconnectEvent.class, event -> {
            String username = event.getPlayerRef().getUsername();
            PacketHandler.DisconnectReason reason = event.getDisconnectReason();
            logDisconnection(username, reason);
        });
    }
}
```

### Redirection de Serveur

```java
eventBus.register(PlayerSetupConnectEvent.class, event -> {
    // Rediriger vers un autre serveur
    if (isServerFull()) {
        byte[] referralData = createReferralData(event.getUuid());
        event.referToServer("backup.server.com", 25565, referralData);
    }

    // Verifier si c'est une connexion par referral
    if (event.isReferralConnection()) {
        byte[] data = event.getReferralData();
        HostAddress source = event.getReferralSource();
        handleReferral(event, data, source);
    }
});
```

## Bonnes Pratiques

### 1. Utiliser les Priorites Correctement

```java
// FIRST : Securite, validation
eventBus.register(EventPriority.FIRST, PlayerChatEvent.class, this::validateChat);

// EARLY : Transformation des donnees
eventBus.register(EventPriority.EARLY, PlayerChatEvent.class, this::formatChat);

// NORMAL : Logique metier principale
eventBus.register(PlayerChatEvent.class, this::processChat);

// LATE : Logging, analytics
eventBus.register(EventPriority.LATE, PlayerChatEvent.class, this::logChat);

// LAST : Cleanup, fallback
eventBus.register(EventPriority.LAST, PlayerChatEvent.class, this::cleanupChat);
```

### 2. Toujours se Desinscrire

```java
public class MyPlugin implements AutoCloseable {
    private final List<EventRegistration<?, ?>> registrations = new ArrayList<>();

    public void enable() {
        registrations.add(eventBus.register(...));
        registrations.add(eventBus.register(...));
    }

    @Override
    public void close() {
        registrations.forEach(EventRegistration::unregister);
        registrations.clear();
    }
}
```

### 3. Verifier l'Annulation

```java
eventBus.register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    // Toujours verifier si un handler precedent a annule
    if (event.isCancelled()) {
        return;
    }

    // Traitement...
});
```

### 4. Utiliser Async pour les Operations Longues

```java
// Mauvais : bloque le thread principal
eventBus.register(PlayerConnectEvent.class, event -> {
    loadPlayerDataFromDatabase(event.getPlayerRef()); // BLOQUANT !
});

// Bon : utiliser un evenement async ou CompletableFuture
eventBus.registerAsync(PlayerChatEvent.class, future -> {
    return future.thenCompose(event -> {
        return loadPlayerDataAsync(event.getSender())
            .thenApply(data -> event);
    });
});
```

### 5. Gerer les Exceptions

```java
eventBus.register(PlayerChatEvent.class, event -> {
    try {
        processChat(event);
    } catch (Exception e) {
        logger.error("Erreur lors du traitement du chat", e);
        // Ne pas relancer - laisser les autres handlers s'executer
    }
});
```
