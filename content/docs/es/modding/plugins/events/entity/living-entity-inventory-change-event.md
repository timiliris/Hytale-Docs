---
id: living-entity-inventory-change-event
title: LivingEntityInventoryChangeEvent
sidebar_label: LivingEntityInventoryChangeEvent
---

# LivingEntityInventoryChangeEvent

The `LivingEntityInventoryChangeEvent` is fired when a living entity's inventory undergoes a change. This includes players, NPCs, and any other entities that have an inventory system. The event provides access to the affected item container and the transaction details.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.entity.LivingEntityInventoryChangeEvent` |
| **Parent Class** | `EntityEvent<LivingEntity, String>` |
| **Cancellable** | No |
| **Async** | No |
| **Key Type** | `String` |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/entity/LivingEntityInventoryChangeEvent.java:8` |

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

    @Nonnull
    @Override
    public String toString() {
        return "LivingEntityInventoryChangeEvent{itemContainer=" + this.itemContainer + ", transaction=" + this.transaction + "} " + super.toString();
    }
}
```

## Fields

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `entity` | `LivingEntity` | The living entity whose inventory changed (inherited) | `getEntity()` |
| `itemContainer` | `ItemContainer` | The container where the change occurred | `getItemContainer()` |
| `transaction` | `Transaction` | Details about the inventory transaction | `getTransaction()` |

## Methods

### Inherited from EntityEvent

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getEntity()` | `LivingEntity` | Returns the living entity whose inventory changed |

### Event-Specific Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getItemContainer()` | `ItemContainer` | Returns the item container that was modified |
| `getTransaction()` | `Transaction` | Returns the transaction details for this change |
| `toString()` | `@Nonnull String` | Returns a string representation of the event including container and transaction |

## Usage Example

### Basic Inventory Change Tracking

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

### Player Inventory Monitoring

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

### Inventory Statistics

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

### Item Tracking System

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

### Economy Integration

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

## When This Event Fires

The `LivingEntityInventoryChangeEvent` fires whenever a living entity's inventory is modified. This includes:

1. **Item pickup**: When an entity picks up items from the ground
2. **Item drop**: When an entity drops items from their inventory
3. **Inventory transfers**: Moving items between slots
4. **Equipment changes**: Equipping or unequipping items
5. **Crafting results**: When crafted items are placed in inventory
6. **Trading**: When items are exchanged through trade systems
7. **Container interactions**: Taking from or placing into chests, etc.
8. **Administrative changes**: When inventory is modified via commands

The event fires:
- After the inventory change has been committed
- While the entity and container are still valid
- With full transaction details available

## Important Notes

1. **Non-cancellable**: This event cannot be cancelled. The inventory change has already occurred.

2. **Transaction details**: The `Transaction` object contains specifics about what changed, including before/after states.

3. **Container context**: The `ItemContainer` indicates which part of the inventory was affected (e.g., main inventory, equipment slots, etc.).

4. **Performance consideration**: This event fires frequently. Keep handlers efficient to avoid performance issues.

## Related Events

| Event | Description |
|-------|-------------|
| [EntityRemoveEvent](./entity-remove-event) | Fired when an entity is removed from the world |
| [SwitchActiveSlotEvent](/docs/en/modding/plugins/events/inventory/switch-active-slot-event) | Fired when active hotbar slot changes |
| [DropItemEvent](/docs/en/modding/plugins/events/inventory/drop-item-event) | Fired when an item is dropped |
| [InteractivelyPickupItemEvent](/docs/en/modding/plugins/events/inventory/interactively-pickup-item-event) | Fired when an item is picked up interactively |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events.entity`
- **Hierarchy**: `LivingEntityInventoryChangeEvent` -> `EntityEvent<LivingEntity, String>` -> `IEvent<String>` -> `IBaseEvent<String>`
- **Event System**: Standard synchronous event dispatched via `EventBus`
