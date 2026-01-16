---
id: events
title: Systeme d'evenements
sidebar_label: Evenements
sidebar_position: 4
---

# Systeme d'evenements

Le systeme d'evenements de Hytale permet aux plugins de reagir aux evenements du jeu tels que les connexions des joueurs, les interactions avec les blocs, les changements de monde, et bien plus encore. Ce guide couvre les interfaces principales, l'enregistrement des evenements, les priorites et le catalogue complet des evenements disponibles.

## Interfaces principales

Le systeme d'evenements de Hytale est construit sur une hierarchie d'interfaces dans le package `com.hypixel.hytale.event`.

### IBaseEvent

L'interface racine pour tous les evenements. Elle utilise un parametre generique `KeyType` qui permet aux evenements d'etre associes a une cle pour une distribution selective.

```java
public interface IBaseEvent<KeyType> {
}
```

### IEvent

Interface pour les evenements **synchrones**. Ceux-ci sont distribues et traites immediatement sur le thread appelant.

```java
public interface IEvent<KeyType> extends IBaseEvent<KeyType> {
}
```

### IAsyncEvent

Interface pour les evenements **asynchrones**. Ceux-ci retournent un `CompletableFuture` et peuvent etre traites sur plusieurs threads.

```java
public interface IAsyncEvent<KeyType> extends IBaseEvent<KeyType> {
}
```

### ICancellable

Les evenements qui implementent `ICancellable` peuvent etre annules par les gestionnaires d'evenements, empechant l'action par defaut de se produire.

```java
public interface ICancellable {
   boolean isCancelled();
   void setCancelled(boolean cancelled);
}
```

### IProcessedEvent

Les evenements implementant cette interface recoivent un callback apres que chaque gestionnaire les a traites, utile pour le suivi ou le debogage.

```java
public interface IProcessedEvent {
   void processEvent(@Nonnull String handlerName);
}
```

## Priorites des evenements

Les gestionnaires d'evenements sont executes dans l'ordre de priorite. Hytale utilise des valeurs entieres courtes pour un controle precis, avec cinq constantes predefinies dans l'enum `EventPriority` :

| Priorite | Valeur | Description |
|----------|--------|-------------|
| `FIRST` | -21844 | Priorite la plus haute, s'execute en premier |
| `EARLY` | -10922 | Priorite haute |
| `NORMAL` | 0 | Priorite par defaut |
| `LATE` | 10922 | Priorite basse |
| `LAST` | 21844 | Priorite la plus basse, s'execute en dernier |

Les gestionnaires avec des valeurs numeriques plus basses s'executent avant ceux avec des valeurs plus elevees. Utilisez `FIRST` lorsque vous devez inspecter ou modifier les evenements avant les autres plugins, et `LAST` lorsque vous avez besoin du dernier mot (par exemple, pour la journalisation ou le nettoyage).

## Enregistrement des gestionnaires d'evenements

Les evenements sont enregistres via l'`EventBus` en utilisant la methode `register()` avec un callback `Consumer`. L'enregistrement retourne un objet `EventRegistration` qui peut etre utilise pour se desenregistrer ulterieurement.

### Enregistrement de base

Enregistrer un evenement avec la priorite par defaut (NORMAL) :

```java
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventRegistration;
import com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent;

public class MyPlugin extends PluginBase {
    private EventRegistration<Void, PlayerConnectEvent> connectRegistration;

    @Override
    public void onEnable() {
        EventBus eventBus = getServer().getEventBus();

        connectRegistration = eventBus.register(
            PlayerConnectEvent.class,
            this::onPlayerConnect
        );
    }

    private void onPlayerConnect(PlayerConnectEvent event) {
        getLogger().info("Player connecting: " + event.getPlayerRef());
    }

    @Override
    public void onDisable() {
        if (connectRegistration != null) {
            connectRegistration.unregister();
        }
    }
}
```

### Enregistrement avec priorite

Specifiez une `EventPriority` pour controler l'ordre d'execution :

```java
import com.hypixel.hytale.event.EventPriority;

eventBus.register(
    EventPriority.FIRST,
    PlayerConnectEvent.class,
    event -> {
        // Ce gestionnaire s'execute avant les autres plugins
        getLogger().info("First to see connection!");
    }
);
```

Vous pouvez egalement utiliser des valeurs short brutes pour des priorites personnalisees :

```java
eventBus.register(
    (short) -5000,  // Entre EARLY et NORMAL
    PlayerConnectEvent.class,
    this::onPlayerConnect
);
```

### Enregistrement global

Utilisez `registerGlobal()` pour recevoir tous les evenements d'un type independamment de leur cle :

```java
eventBus.registerGlobal(
    PlayerEvent.class,
    event -> {
        // Recoit toutes les instances de sous-classes de PlayerEvent
        getLogger().info("Player event: " + event.getClass().getSimpleName());
    }
);
```

### Enregistrement des evenements non geres

Utilisez `registerUnhandled()` pour recevoir les evenements qui n'ont pas eu d'autres gestionnaires correspondants :

```java
eventBus.registerUnhandled(
    PlayerConnectEvent.class,
    event -> {
        // Appele uniquement si aucun autre gestionnaire n'a traite cet evenement
        getLogger().warn("Unhandled player connect!");
    }
);
```

### Enregistrement des evenements asynchrones

Pour les types `IAsyncEvent`, utilisez `registerAsync()` qui fonctionne avec `CompletableFuture` :

```java
import com.hypixel.hytale.server.core.event.events.player.PlayerChatEvent;

eventBus.registerAsync(
    PlayerChatEvent.class,
    event -> {
        // Traiter le chat de maniere asynchrone
        return CompletableFuture.runAsync(() -> {
            // Effectuer des operations asynchrones comme des requetes en base de donnees
        });
    }
);
```

## Annulation des evenements

Les evenements qui implementent `ICancellable` peuvent etre annules pour empecher leur comportement par defaut :

```java
import com.hypixel.hytale.server.core.event.events.player.PlayerChatEvent;

eventBus.register(
    EventPriority.FIRST,
    PlayerChatEvent.class,
    event -> {
        String content = event.getContent();
        if (containsBadWords(content)) {
            event.setCancelled(true);
            // Le message ne sera pas envoye
        }
    }
);
```

Verifier si un evenement a ete annule par un gestionnaire precedent :

```java
eventBus.register(
    EventPriority.LAST,
    PlayerChatEvent.class,
    event -> {
        if (!event.isCancelled()) {
            // Journaliser tous les messages de chat non annules
            logMessage(event.getSender(), event.getContent());
        }
    }
);
```

## Distribution des evenements

Les evenements sont distribues via l'`EventBus` en utilisant les methodes `dispatch()` ou `dispatchFor()` :

```java
// Distribuer sans cle
eventBus.dispatch(MyCustomEvent.class);

// Distribuer pour une cle specifique
eventBus.dispatchFor(MyCustomEvent.class, "some-key").dispatch(eventInstance);

// Distribuer un evenement asynchrone (retourne un CompletableFuture)
CompletableFuture<MyAsyncEvent> future = eventBus.dispatchAsync(MyAsyncEvent.class);
```

---

## Evenements de joueur

Evenements lies aux connexions, interactions et actions des joueurs.

### PlayerConnectEvent

Declenche lorsqu'un joueur se connecte au serveur. Permet de definir le monde initial.

**Package :** `com.hypixel.hytale.server.core.event.events.player`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getHolder()` | `Holder<EntityStore>` | Obtenir le conteneur d'entite |
| `getPlayerRef()` | `PlayerRef` | Obtenir la reference du joueur |
| `getWorld()` | `World` | Obtenir le monde cible (peut etre null) |
| `setWorld(World)` | `void` | Definir le monde dans lequel faire apparaitre le joueur |

```java
eventBus.register(PlayerConnectEvent.class, event -> {
    World lobby = getServer().getWorld("lobby");
    event.setWorld(lobby);
});
```

### PlayerDisconnectEvent

Declenche lorsqu'un joueur se deconnecte du serveur.

**Package :** `com.hypixel.hytale.server.core.event.events.player`
**Etend :** `PlayerRefEvent<Void>`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayerRef()` | `PlayerRef` | Obtenir la reference du joueur |
| `getDisconnectReason()` | `PacketHandler.DisconnectReason` | Obtenir la raison de la deconnexion |

### PlayerSetupConnectEvent

Declenche pendant la phase de configuration de la connexion, avant la creation de l'entite joueur. Peut etre annule pour rejeter la connexion.

**Package :** `com.hypixel.hytale.server.core.event.events.player`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPacketHandler()` | `PacketHandler` | Obtenir le gestionnaire de paquets |
| `getUsername()` | `String` | Obtenir le nom d'utilisateur du joueur qui se connecte |
| `getUuid()` | `UUID` | Obtenir l'UUID du joueur |
| `getAuth()` | `PlayerAuthentication` | Obtenir les informations d'authentification |
| `getReferralData()` | `byte[]` | Obtenir les donnees de renvoi si transfere depuis un autre serveur |
| `getReferralSource()` | `HostAddress` | Obtenir le serveur source s'il s'agit d'un renvoi |
| `isReferralConnection()` | `boolean` | Verifier s'il s'agit d'un transfert de serveur |
| `referToServer(String, int)` | `void` | Rediriger le joueur vers un autre serveur |
| `referToServer(String, int, byte[])` | `void` | Rediriger avec des donnees personnalisees |
| `setReason(String)` | `void` | Definir la raison de deconnexion en cas d'annulation |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler la connexion |

```java
eventBus.register(PlayerSetupConnectEvent.class, event -> {
    if (isServerFull()) {
        event.setReason("Server is full! Try again later.");
        event.setCancelled(true);
    }
});
```

### PlayerSetupDisconnectEvent

Declenche lorsqu'un joueur se deconnecte pendant la phase de configuration (avant d'avoir completement rejoint).

**Package :** `com.hypixel.hytale.server.core.event.events.player`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getUsername()` | `String` | Obtenir le nom d'utilisateur du joueur |
| `getUuid()` | `UUID` | Obtenir l'UUID du joueur |
| `getAuth()` | `PlayerAuthentication` | Obtenir les informations d'authentification |
| `getDisconnectReason()` | `PacketHandler.DisconnectReason` | Obtenir la raison de la deconnexion |

### PlayerChatEvent

Declenche lorsqu'un joueur envoie un message de chat. Il s'agit d'un **evenement asynchrone** qui implemente `ICancellable`.

**Package :** `com.hypixel.hytale.server.core.event.events.player`
**Implemente :** `IAsyncEvent<String>`, `ICancellable`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getSender()` | `PlayerRef` | Obtenir l'expediteur du message |
| `setSender(PlayerRef)` | `void` | Changer l'expediteur |
| `getTargets()` | `List<PlayerRef>` | Obtenir les destinataires du message |
| `setTargets(List<PlayerRef>)` | `void` | Definir les destinataires du message |
| `getContent()` | `String` | Obtenir le contenu du message |
| `setContent(String)` | `void` | Modifier le message |
| `getFormatter()` | `PlayerChatEvent.Formatter` | Obtenir le formateur de message |
| `setFormatter(PlayerChatEvent.Formatter)` | `void` | Definir un formateur personnalise |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le message |

```java
eventBus.register(PlayerChatEvent.class, event -> {
    // Modifier le format du chat
    event.setContent("[Modified] " + event.getContent());

    // Ou filtrer les destinataires
    List<PlayerRef> filtered = event.getTargets().stream()
        .filter(this::canReceiveMessage)
        .toList();
    event.setTargets(filtered);
});
```

### PlayerMouseButtonEvent

Declenche lorsqu'un joueur clique sur un bouton de la souris dans le monde du jeu.

**Package :** `com.hypixel.hytale.server.core.event.events.player`
**Etend :** `PlayerEvent<Void>`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayer()` | `Player` | Obtenir le joueur |
| `getPlayerRefComponent()` | `PlayerRef` | Obtenir la reference du joueur |
| `getClientUseTime()` | `long` | Obtenir le temps d'utilisation cote client |
| `getItemInHand()` | `Item` | Obtenir l'objet tenu en main |
| `getTargetBlock()` | `Vector3i` | Obtenir la position du bloc cible |
| `getTargetEntity()` | `Entity` | Obtenir l'entite ciblee (le cas echeant) |
| `getScreenPoint()` | `Vector2f` | Obtenir les coordonnees a l'ecran |
| `getMouseButton()` | `MouseButtonEvent` | Obtenir les informations du bouton de souris |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le clic |

### PlayerMouseMotionEvent

Declenche lorsqu'un joueur deplace la souris.

**Package :** `com.hypixel.hytale.server.core.event.events.player`
**Etend :** `PlayerEvent<Void>`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayer()` | `Player` | Obtenir le joueur |
| `getClientUseTime()` | `long` | Obtenir le temps d'utilisation cote client |
| `getItemInHand()` | `Item` | Obtenir l'objet tenu en main |
| `getTargetBlock()` | `Vector3i` | Obtenir le bloc cible |
| `getTargetEntity()` | `Entity` | Obtenir l'entite ciblee |
| `getScreenPoint()` | `Vector2f` | Obtenir les coordonnees a l'ecran |
| `getMouseMotion()` | `MouseMotionEvent` | Obtenir les informations de mouvement |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le mouvement |

### PlayerReadyEvent

Declenche lorsqu'un joueur est completement pret apres avoir rejoint un monde.

**Package :** `com.hypixel.hytale.server.core.event.events.player`
**Etend :** `PlayerEvent<String>`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayer()` | `Player` | Obtenir le joueur |
| `getReadyId()` | `int` | Obtenir l'identifiant de disponibilite |

### AddPlayerToWorldEvent

Declenche lorsqu'un joueur est en train d'etre ajoute a un monde.

**Package :** `com.hypixel.hytale.server.core.event.events.player`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getHolder()` | `Holder<EntityStore>` | Obtenir le conteneur d'entite |
| `getWorld()` | `World` | Obtenir le monde cible |
| `shouldBroadcastJoinMessage()` | `boolean` | Verifier si le message de connexion sera diffuse |
| `setBroadcastJoinMessage(boolean)` | `void` | Activer/desactiver le message de connexion |

```java
// AddPlayerToWorldEvent requires registerGlobal (not register)
eventBus.registerGlobal(AddPlayerToWorldEvent.class, event -> {
    // Desactiver le message de connexion par defaut pour les connexions silencieuses
    if (isSilentJoin(event.getHolder())) {
        event.setBroadcastJoinMessage(false);
    }
});
```

### DrainPlayerFromWorldEvent

Declenche lorsqu'un joueur est en train d'etre retire d'un monde (par exemple, changement de monde).

**Package :** `com.hypixel.hytale.server.core.event.events.player`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getHolder()` | `Holder<EntityStore>` | Obtenir le conteneur d'entite |
| `getWorld()` | `World` | Obtenir le monde actuel |
| `getTransform()` | `Transform` | Obtenir la transformation du joueur |
| `setWorld(World)` | `void` | Definir le monde de destination |
| `setTransform(Transform)` | `void` | Definir la transformation de destination |

---

## Evenements de bloc (ECS)

Les evenements lies aux blocs utilisent la hierarchie d'evenements du systeme de composants d'entites (ECS).

### BreakBlockEvent

Declenche lorsqu'un bloc est sur le point d'etre casse.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getItemInHand()` | `ItemStack` | Obtenir l'outil utilise |
| `getTargetBlock()` | `Vector3i` | Obtenir la position du bloc |
| `setTargetBlock(Vector3i)` | `void` | Changer la position cible |
| `getBlockType()` | `BlockType` | Obtenir le type de bloc |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler la destruction |

```java
// Proteger la zone de spawn
eventBus.register(BreakBlockEvent.class, event -> {
    if (isInSpawnArea(event.getTargetBlock())) {
        event.setCancelled(true);
    }
});
```

### PlaceBlockEvent

Declenche lorsqu'un bloc est sur le point d'etre place.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getItemInHand()` | `ItemStack` | Obtenir l'objet bloc |
| `getTargetBlock()` | `Vector3i` | Obtenir la position de placement |
| `setTargetBlock(Vector3i)` | `void` | Changer la position de placement |
| `getRotation()` | `RotationTuple` | Obtenir la rotation du bloc |
| `setRotation(RotationTuple)` | `void` | Definir la rotation du bloc |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le placement |

### DamageBlockEvent

Declenche lorsqu'un bloc subit des degats (pendant le minage).

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getItemInHand()` | `ItemStack` | Obtenir l'outil utilise |
| `getTargetBlock()` | `Vector3i` | Obtenir la position du bloc |
| `setTargetBlock(Vector3i)` | `void` | Changer la position cible |
| `getBlockType()` | `BlockType` | Obtenir le type de bloc |
| `getCurrentDamage()` | `float` | Obtenir les degats accumules |
| `getDamage()` | `float` | Obtenir les degats appliques |
| `setDamage(float)` | `void` | Modifier le montant des degats |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler les degats |

### UseBlockEvent

Classe de base abstraite pour les evenements d'utilisation de bloc. Possede des classes internes `Pre` et `Post`.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `EcsEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getInteractionType()` | `InteractionType` | Obtenir le type d'interaction |
| `getContext()` | `InteractionContext` | Obtenir le contexte d'interaction |
| `getTargetBlock()` | `Vector3i` | Obtenir la position du bloc |
| `getBlockType()` | `BlockType` | Obtenir le type de bloc |

**UseBlockEvent.Pre** - Annulable, declenche avant l'utilisation du bloc
**UseBlockEvent.Post** - Non annulable, declenche apres l'utilisation du bloc

---

## Evenements d'entite

Evenements lies aux entites dans le monde du jeu.

### EntityRemoveEvent

Declenche lorsqu'une entite est retiree du monde.

**Package :** `com.hypixel.hytale.server.core.event.events.entity`
**Etend :** `EntityEvent<Entity, String>`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getEntity()` | `Entity` | Obtenir l'entite retiree |

### LivingEntityInventoryChangeEvent

Declenche lorsque l'inventaire d'une entite vivante change.

**Package :** `com.hypixel.hytale.server.core.event.events.entity`
**Etend :** `EntityEvent<LivingEntity, String>`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getEntity()` | `LivingEntity` | Obtenir l'entite |
| `getItemContainer()` | `ItemContainer` | Obtenir le conteneur affecte |
| `getTransaction()` | `Transaction` | Obtenir la transaction d'inventaire |

---

## Evenements d'objet (ECS)

Evenements lies a la gestion des objets.

### DropItemEvent

Declenche lorsqu'un objet est lache.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

La classe interne `DropItemEvent.Drop` contient :

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getItemStack()` | `ItemStack` | Obtenir l'objet lache |
| `getThrowSpeed()` | `float` | Obtenir la velocite de lancer |

La classe interne `DropItemEvent.PlayerRequest` contient :

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getInventorySectionId()` | `int` | Obtenir la section d'inventaire |
| `getSlotId()` | `short` | Obtenir l'emplacement d'inventaire |

### InteractivelyPickupItemEvent

Declenche lorsqu'un joueur ramasse un objet de maniere interactive.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getItemStack()` | `ItemStack` | Obtenir l'objet ramasse |
| `setItemStack(ItemStack)` | `void` | Modifier l'objet |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le ramassage |

### SwitchActiveSlotEvent

Declenche lorsqu'un joueur change son emplacement actif de la barre de raccourcis.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPreviousSlot()` | `int` | Obtenir l'emplacement precedent |
| `getInventorySectionId()` | `int` | Obtenir la section d'inventaire |
| `getNewSlot()` | `byte` | Obtenir le nouvel emplacement |
| `setNewSlot(byte)` | `void` | Changer l'emplacement cible |
| `isServerRequest()` | `boolean` | Verifier si initie par le serveur |
| `isClientRequest()` | `boolean` | Verifier si initie par le client |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le changement |

---

## Evenements de fabrication

### CraftRecipeEvent

Classe de base abstraite pour les evenements de fabrication. Possede des classes internes `Pre` et `Post`.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getCraftedRecipe()` | `CraftingRecipe` | Obtenir la recette |
| `getQuantity()` | `int` | Obtenir la quantite fabriquee |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler la fabrication |

---

## Evenements de monde

Evenements lies a la gestion des mondes.

### AddWorldEvent

Declenche lorsqu'un monde est en train d'etre ajoute au serveur.

**Package :** `com.hypixel.hytale.server.core.universe.world.events`
**Etend :** `WorldEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getWorld()` | `World` | Obtenir le monde |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler l'ajout du monde |

### RemoveWorldEvent

Declenche lorsqu'un monde est en train d'etre supprime.

**Package :** `com.hypixel.hytale.server.core.universe.world.events`
**Etend :** `WorldEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getWorld()` | `World` | Obtenir le monde |
| `getRemovalReason()` | `RemovalReason` | Obtenir la raison de la suppression |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler la suppression |

**Enum RemovalReason :** `GENERAL`, `EXCEPTIONAL`

### StartWorldEvent

Declenche lorsqu'un monde commence a s'executer.

**Package :** `com.hypixel.hytale.server.core.universe.world.events`
**Etend :** `WorldEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getWorld()` | `World` | Obtenir le monde demarre |

### AllWorldsLoadedEvent

Declenche lorsque tous les mondes ont fini de se charger.

**Package :** `com.hypixel.hytale.server.core.universe.world.events`

Cet evenement n'a pas de methodes supplementaires - utilisez-le comme signal que le chargement des mondes est termine.

---

## Evenements de chunk

Evenements lies au chargement et a la gestion des chunks.

### ChunkPreLoadProcessEvent

Declenche avant qu'un chunk soit traite apres le chargement.

**Package :** `com.hypixel.hytale.server.core.universe.world.events`
**Etend :** `ChunkEvent`
**Implemente :** `IProcessedEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getChunk()` | `WorldChunk` | Obtenir le chunk |
| `isNewlyGenerated()` | `boolean` | Verifier s'il est nouvellement genere |
| `didLog()` | `boolean` | Verifier si journalise |
| `getHolder()` | `Holder<ChunkStore>` | Obtenir le conteneur de chunk |

### ChunkSaveEvent

Declenche lorsqu'un chunk est en train d'etre sauvegarde.

**Package :** `com.hypixel.hytale.server.core.universe.world.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getChunk()` | `WorldChunk` | Obtenir le chunk |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler la sauvegarde |

### ChunkUnloadEvent

Declenche lorsqu'un chunk est en train d'etre decharge.

**Package :** `com.hypixel.hytale.server.core.universe.world.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getChunk()` | `WorldChunk` | Obtenir le chunk |
| `willResetKeepAlive()` | `boolean` | Verifier si le keep-alive est reinitialise |
| `setResetKeepAlive(boolean)` | `void` | Definir la reinitialisation du keep-alive |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le dechargement |

---

## Evenements du cycle de vie du serveur

### BootEvent

Declenche lorsque le serveur demarre.

**Package :** `com.hypixel.hytale.server.core.event.events`

```java
eventBus.register(BootEvent.class, event -> {
    getLogger().info("Server is booting!");
});
```

### ShutdownEvent

Declenche lorsque le serveur s'arrete. Inclut des constantes de priorite pour un arret ordonne.

**Package :** `com.hypixel.hytale.server.core.event.events`

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `DISCONNECT_PLAYERS` | -48 | Priorite pour deconnecter les joueurs |
| `UNBIND_LISTENERS` | -40 | Priorite pour detacher les ecouteurs |
| `SHUTDOWN_WORLDS` | -32 | Priorite pour arreter les mondes |

```java
eventBus.register(
    ShutdownEvent.DISCONNECT_PLAYERS,  // Utiliser comme priorite
    ShutdownEvent.class,
    event -> {
        // Nettoyer avant la deconnexion des joueurs
        saveAllData();
    }
);
```

---

## Evenements de permission

Evenements lies au systeme de permissions.

### PlayerPermissionChangeEvent

Classe de base abstraite pour les changements de permissions des joueurs.

**Package :** `com.hypixel.hytale.server.core.event.events.permissions`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayerUuid()` | `UUID` | Obtenir l'UUID du joueur |

**Classes internes :**
- `PlayerPermissionChangeEvent.GroupAdded` - Joueur ajoute a un groupe
- `PlayerPermissionChangeEvent.GroupRemoved` - Joueur retire d'un groupe
- `PlayerPermissionChangeEvent.PermissionsAdded` - Permissions accordees
- `PlayerPermissionChangeEvent.PermissionsRemoved` - Permissions revoquees

### GroupPermissionChangeEvent

Classe de base abstraite pour les changements de permissions de groupe.

**Package :** `com.hypixel.hytale.server.core.event.events.permissions`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getGroupName()` | `String` | Obtenir le nom du groupe |

**Classes internes :**
- `GroupPermissionChangeEvent.Added` - Permissions ajoutees au groupe
- `GroupPermissionChangeEvent.Removed` - Permissions retirees du groupe

### PlayerGroupEvent

Declenche lorsqu'un joueur est ajoute ou retire d'un groupe de permissions.

**Package :** `com.hypixel.hytale.server.core.event.events.permissions`
**Etend :** `PlayerPermissionChangeEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlayerUuid()` | `UUID` | Obtenir l'UUID du joueur |
| `getGroupName()` | `String` | Obtenir le nom du groupe |

**Classes internes :** `PlayerGroupEvent.Added`, `PlayerGroupEvent.Removed`

---

## Evenements de plugin

### PluginSetupEvent

Declenche lorsqu'un plugin est en cours de configuration.

**Package :** `com.hypixel.hytale.server.core.plugin.event`
**Etend :** `PluginEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPlugin()` | `PluginBase` | Obtenir le plugin |

---

## Evenements de gameplay (ECS)

### ChangeGameModeEvent

Declenche lorsque le mode de jeu d'un joueur est en train de changer.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getGameMode()` | `GameMode` | Obtenir le nouveau mode de jeu |
| `setGameMode(GameMode)` | `void` | Changer le mode de jeu |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le changement |

### DiscoverZoneEvent

Declenche lorsqu'un joueur decouvre une zone sur la carte du monde.

**Package :** `com.hypixel.hytale.server.core.event.events.ecs`
**Etend :** `EcsEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getDiscoveryInfo()` | `WorldMapTracker.ZoneDiscoveryInfo` | Obtenir les details de la decouverte |

**Classe interne :** `DiscoverZoneEvent.Display` (Annulable) - Controle l'affichage de l'interface de decouverte

### MoonPhaseChangeEvent

Declenche lorsque la phase de la lune change.

**Package :** `com.hypixel.hytale.server.core.universe.world.events.ecs`
**Etend :** `EcsEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getNewMoonPhase()` | `int` | Obtenir la nouvelle phase de la lune |

---

## Evenements de prefab

### PrefabPasteEvent

Declenche lorsqu'un prefab est en train d'etre colle dans le monde.

**Package :** `com.hypixel.hytale.server.core.prefab.event`
**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPrefabId()` | `int` | Obtenir l'ID du prefab |
| `isPasteStart()` | `boolean` | Verifier si c'est le debut du collage |
| `isCancelled()` | `boolean` | Verifier si annule |
| `setCancelled(boolean)` | `void` | Annuler le collage |

### PrefabPlaceEntityEvent

Declenche lorsqu'une entite d'un prefab est en train d'etre placee.

**Package :** `com.hypixel.hytale.server.core.prefab.event`
**Etend :** `EcsEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getPrefabId()` | `int` | Obtenir l'ID du prefab |
| `getHolder()` | `Holder<EntityStore>` | Obtenir le conteneur d'entite |

---

## Evenements de localisation

### MessagesUpdated

Declenche lorsque les messages de localisation sont mis a jour.

**Package :** `com.hypixel.hytale.server.core.modules.i18n.event`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getChangedMessages()` | `Map<String, Map<String, String>>` | Obtenir les traductions modifiees |
| `getRemovedMessages()` | `Map<String, Map<String, String>>` | Obtenir les traductions supprimees |

### GenerateDefaultLanguageEvent

Declenche lors de la generation des fichiers de langue par defaut.

**Package :** `com.hypixel.hytale.server.core.modules.i18n.event`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `putTranslationFile(String, TranslationMap)` | `void` | Ajouter un fichier de traduction |

---

## Evenements du fil d'eliminations

Classe conteneur pour les evenements lies au fil d'eliminations.

**Package :** `com.hypixel.hytale.server.core.modules.entity.damage.event`

### KillFeedEvent.DecedentMessage

Declenche pour le message de mort affiche au joueur tue.

**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

### KillFeedEvent.KillerMessage

Declenche pour le message d'elimination affiche au tueur.

**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

### KillFeedEvent.Display

Declenche lorsque l'affichage du fil d'eliminations est montre.

**Etend :** `CancellableEcsEvent`
**Annulable :** Oui

---

## Evenements d'aventure

### TreasureChestOpeningEvent

Declenche lorsqu'un joueur ouvre un objectif de coffre au tresor.

**Package :** `com.hypixel.hytale.builtin.adventure.objectives.events`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getObjectiveUUID()` | `UUID` | Obtenir l'UUID de l'objectif |
| `getChestUUID()` | `UUID` | Obtenir l'UUID du coffre |
| `getPlayerRef()` | `Ref<EntityStore>` | Obtenir la reference du joueur |
| `getStore()` | `Store<EntityStore>` | Obtenir le store d'entite |

### DiscoverInstanceEvent

Declenche lorsqu'un joueur decouvre un donjon instancie.

**Package :** `com.hypixel.hytale.builtin.instances.event`
**Etend :** `EcsEvent`

| Methode | Type de retour | Description |
|---------|----------------|-------------|
| `getInstanceWorldUuid()` | `UUID` | Obtenir l'UUID du monde de l'instance |
| `getDiscoveryConfig()` | `InstanceDiscoveryConfig` | Obtenir la configuration de decouverte |

**Classe interne :** `DiscoverInstanceEvent.Display` (Annulable) - Controle l'interface de decouverte

---

## Systeme d'evenements ECS

En plus de la hierarchie principale `IEvent`, Hytale possede un systeme d'evenements separe du systeme de composants d'entites (ECS) pour les evenements au niveau des composants.

### EcsEvent

Classe de base pour les evenements ECS.

**Package :** `com.hypixel.hytale.component.system`

```java
public abstract class EcsEvent {
}
```

### CancellableEcsEvent

Classe de base pour les evenements ECS annulables.

**Package :** `com.hypixel.hytale.component.system`
**Etend :** `EcsEvent`
**Implemente :** `ICancellableEcsEvent`

```java
public abstract class CancellableEcsEvent extends EcsEvent implements ICancellableEcsEvent {
   private boolean cancelled = false;

   public boolean isCancelled() { ... }
   public void setCancelled(boolean cancelled) { ... }
}
```

La plupart des evenements de bloc, d'objet et de gameplay etendent `CancellableEcsEvent` plutot que d'implementer `IEvent` directement.

---

## Resume de la hierarchie des evenements

```
IBaseEvent<KeyType>
├── IEvent<KeyType> (synchrone)
│   ├── PlayerEvent<KeyType>
│   │   ├── PlayerMouseButtonEvent
│   │   ├── PlayerMouseMotionEvent
│   │   ├── PlayerReadyEvent
│   │   └── PlayerInteractEvent (obsolete)
│   ├── PlayerRefEvent<KeyType>
│   │   └── PlayerDisconnectEvent
│   ├── PlayerConnectEvent
│   ├── PlayerSetupConnectEvent
│   ├── PlayerSetupDisconnectEvent
│   ├── AddPlayerToWorldEvent
│   ├── DrainPlayerFromWorldEvent
│   ├── EntityEvent<EntityType, KeyType>
│   │   ├── EntityRemoveEvent
│   │   └── LivingEntityInventoryChangeEvent
│   ├── WorldEvent
│   │   ├── AddWorldEvent
│   │   ├── RemoveWorldEvent
│   │   └── StartWorldEvent
│   ├── ChunkEvent
│   │   └── ChunkPreLoadProcessEvent
│   ├── BootEvent
│   ├── ShutdownEvent
│   ├── AllWorldsLoadedEvent
│   ├── PlayerPermissionChangeEvent
│   ├── GroupPermissionChangeEvent
│   ├── PluginEvent
│   │   └── PluginSetupEvent
│   ├── MessagesUpdated
│   ├── GenerateDefaultLanguageEvent
│   └── TreasureChestOpeningEvent
│
└── IAsyncEvent<KeyType> (asynchrone)
    └── PlayerChatEvent

EcsEvent (hierarchie separee)
├── CancellableEcsEvent
│   ├── BreakBlockEvent
│   ├── PlaceBlockEvent
│   ├── DamageBlockEvent
│   ├── DropItemEvent
│   ├── CraftRecipeEvent
│   ├── ChangeGameModeEvent
│   ├── SwitchActiveSlotEvent
│   ├── InteractivelyPickupItemEvent
│   ├── ChunkSaveEvent
│   ├── ChunkUnloadEvent
│   ├── PrefabPasteEvent
│   └── KillFeedEvent.*
├── UseBlockEvent
├── DiscoverZoneEvent
├── MoonPhaseChangeEvent
├── PrefabPlaceEntityEvent
└── DiscoverInstanceEvent
```

---

## Bonnes pratiques

1. **Toujours desenregistrer les evenements** lorsque votre plugin est desactive pour eviter les fuites de memoire et les erreurs.

2. **Utilisez des priorites appropriees** - `FIRST` pour l'inspection/modification, `LAST` pour la journalisation/nettoyage.

3. **Verifiez l'etat d'annulation** avant d'effectuer des actions dans les gestionnaires de priorite `LATE` ou `LAST`.

4. **Gerez correctement les evenements asynchrones** - Ne bloquez pas sur `CompletableFuture` dans des contextes synchrones.

5. **Soyez attentif aux performances** - Les gestionnaires d'evenements s'executent sur le thread principal (sauf les evenements asynchrones), gardez-les donc rapides.

```java
// Bon : Verification rapide et retour anticipe
eventBus.register(BreakBlockEvent.class, event -> {
    if (!isProtectedArea(event.getTargetBlock())) {
        return;  // Chemin rapide pour les zones non protegees
    }
    event.setCancelled(true);
});

// Mauvais : Operation lente dans chaque evenement
eventBus.register(BreakBlockEvent.class, event -> {
    database.logBlockBreak(event);  // Lent ! Utilisez plutot async
});
```
