---
id: living-entity-inventory-change-event
title: LivingEntityInventoryChangeEvent
sidebar_label: LivingEntityInventoryChangeEvent
---

# LivingEntityInventoryChangeEvent

L'événement `LivingEntityInventoryChangeEvent` est déclenché lorsque l'inventaire d'une entite vivante subit une modification. Cela inclut les joueurs, les PNJ et toute autre entite disposant d'un systeme d'inventaire. L'événement fournit un acces au conteneur d'objets affecte et aux details de la transaction.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent` |
| **Classe parente** | `EntityEvent<LivingEntity, String>` |
| **Annulable** | Non |
| **Asynchrone** | Non |
| **Type de cle** | `String` |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/entity/LivingEntityInventoryChangeEvent.java:8` |

## Declaration

```java
public class LivingEntityInventoryChangeEvent extends EntityEvent<LivingEntity, String> {
    private ItemContainer itemContainer;
    private Transaction transaction;

    public LivingEntityInventoryChangeEvent(
        LivingEntity entity,
        ItemContainer itemContainer,
        Transaction transaction
    ) {
        super(entity);
        this.itemContainer = itemContainer;
        this.transaction = transaction;
    }

    public ItemContainer getItemContainer() {
        return this.itemContainer;
    }

    public Transaction getTransaction() {
        return this.transaction;
    }
}
```

## Champs

| Champ | Type | Description | Accesseur |
|-------|------|-------------|-----------|
| `entity` | `LivingEntity` | L'entite vivante dont l'inventaire a change (hérité) | `getEntity()` |
| `itemContainer` | `ItemContainer` | Le conteneur ou le changement s'est produit | `getItemContainer()` |
| `transaction` | `Transaction` | Details sur la transaction d'inventaire | `getTransaction()` |

## Méthodes

### Héritées de EntityEvent

| Méthode | Type de retour | Description |
|---------|----------------|-------------|
| `getEntity()` | `LivingEntity` | Retourne l'entite vivante dont l'inventaire a change |

### Méthodes spécifiques a l'événement

| Méthode | Type de retour | Description |
|---------|----------------|-------------|
| `getItemContainer()` | `ItemContainer` | Retourne le conteneur d'objets qui a ete modifie |
| `getTransaction()` | `Transaction` | Retourne les details de la transaction pour ce changement |

## Exemple d'utilisation

### Suivi basique des changements d'inventaire

```java
import com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent;
import com.hypixel.hytale.event.EventBus;

public class InventoryTrackerPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(
            LivingEntityInventoryChangeEvent.class,
            this::onInventoryChange
        );
    }

    private void onInventoryChange(LivingEntityInventoryChangeEvent event) {
        LivingEntity entity = event.getEntity();
        ItemContainer container = event.getItemContainer();
        Transaction transaction = event.getTransaction();

        getLogger().info(String.format(
            "Inventory changed for %s in container %s",
            entity.getClass().getSimpleName(),
            container.getClass().getSimpleName()
        ));
    }
}
```

### Surveillance de l'inventaire des joueurs

```java
import com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent;
import com.hypixel.hytale.event.EventBus;

public class PlayerInventoryPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(
            LivingEntityInventoryChangeEvent.class,
            this::onInventoryChange
        );
    }

    private void onInventoryChange(LivingEntityInventoryChangeEvent event) {
        LivingEntity entity = event.getEntity();

        // Check if this is a player
        if (isPlayer(entity)) {
            handlePlayerInventoryChange(entity, event);
        }
    }

    private void handlePlayerInventoryChange(
        LivingEntity player,
        LivingEntityInventoryChangeEvent event
    ) {
        ItemContainer container = event.getItemContainer();
        Transaction transaction = event.getTransaction();

        getLogger().info(String.format(
            "Player %s inventory changed: %s",
            getPlayerName(player),
            describeTransaction(transaction)
        ));
    }

    private boolean isPlayer(LivingEntity entity) {
        // Check if entity is a player
        return entity.getClass().getSimpleName().contains("Player");
    }

    private String getPlayerName(LivingEntity player) {
        // Get player name - implementation depends on Player API
        return player.toString();
    }

    private String describeTransaction(Transaction transaction) {
        // Describe the transaction - implementation depends on Transaction API
        return transaction.toString();
    }
}
```

### Statistiques d'inventaire

```java
import com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class InventoryStatsPlugin extends PluginBase {

    private final ConcurrentHashMap<String, AtomicLong> changeStats = new ConcurrentHashMap<>();

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(
            LivingEntityInventoryChangeEvent.class,
            this::trackChange
        );
    }

    private void trackChange(LivingEntityInventoryChangeEvent event) {
        String entityType = event.getEntity().getClass().getSimpleName();
        String containerType = event.getItemContainer().getClass().getSimpleName();

        String key = entityType + ":" + containerType;
        changeStats.computeIfAbsent(key, k -> new AtomicLong(0))
                   .incrementAndGet();
    }

    public long getChangeCount(String entityType, String containerType) {
        String key = entityType + ":" + containerType;
        AtomicLong count = changeStats.get(key);
        return count != null ? count.get() : 0;
    }

    public ConcurrentHashMap<String, AtomicLong> getAllStats() {
        return new ConcurrentHashMap<>(changeStats);
    }
}
```

### Systeme de suivi des objets

```java
import com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.UUID;

public class ItemTrackingPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(
            LivingEntityInventoryChangeEvent.class,
            this::trackItemMovement
        );
    }

    private void trackItemMovement(LivingEntityInventoryChangeEvent event) {
        LivingEntity entity = event.getEntity();
        Transaction transaction = event.getTransaction();

        // Log item movements for auditing
        logItemTransaction(entity, transaction);
    }

    private void logItemTransaction(LivingEntity entity, Transaction transaction) {
        // Create audit log entry
        String entityId = getEntityIdentifier(entity);
        String timestamp = java.time.Instant.now().toString();

        getLogger().info(String.format(
            "[AUDIT] %s | Entity: %s | Transaction: %s",
            timestamp,
            entityId,
            transaction.toString()
        ));
    }

    private String getEntityIdentifier(LivingEntity entity) {
        // Get a unique identifier for the entity
        return entity.getClass().getSimpleName() + "@" + System.identityHashCode(entity);
    }
}
```

### Integration economique

```java
import com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent;
import com.hypixel.hytale.event.EventBus;

public class EconomyPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        eventBus.registerGlobal(
            LivingEntityInventoryChangeEvent.class,
            this::checkForCurrencyChange
        );
    }

    private void checkForCurrencyChange(LivingEntityInventoryChangeEvent event) {
        Transaction transaction = event.getTransaction();

        // Check if transaction involves currency items
        if (involvesCurrency(transaction)) {
            handleCurrencyTransaction(event.getEntity(), transaction);
        }
    }

    private boolean involvesCurrency(Transaction transaction) {
        // Check if items in transaction are currency
        // Implementation depends on your currency system
        return false;
    }

    private void handleCurrencyTransaction(
        LivingEntity entity,
        Transaction transaction
    ) {
        // Update economy tracking
        getLogger().info("Currency transaction detected for: " +
            entity.getClass().getSimpleName());
    }
}
```

## Quand cet événement est déclenché

Le `LivingEntityInventoryChangeEvent` est déclenché chaque fois que l'inventaire d'une entite vivante est modifie. Cela inclut :

1. **Ramassage d'objets** : Lorsqu'une entite ramasse des objets au sol
2. **Depot d'objets** : Lorsqu'une entite depose des objets de son inventaire
3. **Transferts d'inventaire** : Deplacement d'objets entre les emplacements
4. **Changements d'equipement** : Equipement ou retrait d'objets
5. **Resultats d'artisanat** : Lorsque des objets fabriques sont places dans l'inventaire
6. **Echanges** : Lorsque des objets sont echanges via des systemes de commerce
7. **Interactions avec les conteneurs** : Prendre ou placer dans des coffres, etc.
8. **Modifications administratives** : Lorsque l'inventaire est modifie via des commandes

L'événement est déclenché :
- Apres que le changement d'inventaire a ete valide
- Tant que l'entite et le conteneur sont encore valides
- Avec tous les details de la transaction disponibles

## Notes importantes

1. **Non annulable** : Cet événement ne peut pas etre annule. Le changement d'inventaire s'est deja produit.

2. **Details de la transaction** : L'objet `Transaction` contient les details de ce qui a change, y compris les etats avant/apres.

3. **Contexte du conteneur** : Le `ItemContainer` indique quelle partie de l'inventaire a ete affectee (par exemple, inventaire principal, emplacements d'equipement, etc.).

4. **Consideration de performance** : Cet événement est déclenché frequemment. Gardez les gestionnaires efficaces pour eviter les problemes de performance.

## Événements associes

| Evenement | Description |
|-----------|-------------|
| [EntityRemoveEvent](./entity-remove-event.md) | Déclenché lorsqu'une entite est supprimee du monde |
| [SwitchActiveSlotEvent](/docs/fr/modding/plugins/events/inventory/switch-active-slot-event) | Déclenché lorsque l'emplacement actif de la barre d'action change |
| [DropItemEvent](/docs/fr/modding/plugins/events/inventory/drop-item-event) | Déclenché lorsqu'un objet est depose |
| [InteractivelyPickupItemEvent](/docs/fr/modding/plugins/events/inventory/interactively-pickup-item-event) | Déclenché lorsqu'un objet est ramasse de maniere interactive |

## Référence source

- **Package** : `com.hypixel.hytale.server.core.event.events.entity`
- **Hierarchie** : `LivingEntityInventoryChangeEvent` -> `EntityEvent<LivingEntity, String>` -> `IEvent<String>` -> `IBaseEvent<String>`
- **Systeme d'événements** : Evenement synchrone standard distribue via `EventBus`
