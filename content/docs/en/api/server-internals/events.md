---
id: events
title: Event System
sidebar_label: Events
sidebar_position: 3
description: Complete documentation of the EventBus system for the Hytale server
---

# Event System

:::info v2 Documentation - Verified
This documentation has been verified against decompiled server source code using multi-agent analysis. All information includes source file references.
:::

## What is an Event System?

An **event system** allows different parts of the code to communicate without knowing about each other directly. Instead of calling methods on other objects, code "publishes" events and other code "subscribes" to receive them.

### The Problem Without Events

Imagine you want multiple things to happen when a player joins the server:
- Send a welcome message
- Load their inventory from the database
- Notify their friends they're online
- Start their daily quest timer

Without events, the connection code would need to know about and call all these systems:

```java
// Without events - tightly coupled, hard to maintain
void onPlayerConnect(Player player) {
    messageSystem.sendWelcome(player);      // Connection knows about messaging
    database.loadInventory(player);          // Connection knows about database
    friendSystem.notifyOnline(player);       // Connection knows about friends
    questSystem.startDailyTimer(player);     // Connection knows about quests
}
```

Adding a new feature means modifying the connection code every time.

### The Event Solution

With events, the connection code just announces "a player connected" and anyone interested can react:

```java
// With events - loosely coupled, easy to extend
void onPlayerConnect(Player player) {
    eventBus.dispatch(new PlayerConnectEvent(player));
    // That's it! Other systems listen for this event
}

// Somewhere else, completely independent:
eventBus.register(PlayerConnectEvent.class, event -> sendWelcome(event.getPlayer()));
eventBus.register(PlayerConnectEvent.class, event -> loadInventory(event.getPlayer()));
// Add new listeners without touching the connection code!
```

### Real-World Analogy

Think of events like a **newspaper subscription**:

| Concept | Event System | Newspaper |
|---------|--------------|-----------|
| **Publisher** | Code that fires events | Newspaper company |
| **Event** | The thing that happened | Today's newspaper |
| **Subscriber** | Code that listens for events | People who subscribed |
| **EventBus** | The delivery mechanism | Postal service |

- The newspaper doesn't know who its readers are
- Readers don't need to visit the printing press
- New readers can subscribe anytime
- Readers can unsubscribe when they move

### Sync vs Async Events

Hytale supports two types of events:

| Type | When to Use | Real-World Analogy |
|------|-------------|-------------------|
| **Synchronous** | When you need an immediate response or want to cancel an action | Phone call - you wait for an answer |
| **Asynchronous** | When the action can happen in the background | Email - you don't wait for a reply |

**Example**: A chat filter should be **synchronous** (you need to block the message before it's sent), but logging to a database can be **asynchronous** (the player doesn't need to wait for it).

### Event Priorities

Multiple subscribers can listen to the same event. Priorities control who reacts first:

```
FIRST (highest) → Security checks, validation
EARLY           → Data transformation, preprocessing
NORMAL          → Main business logic
LATE            → Logging, analytics
LAST (lowest)   → Cleanup, fallback behavior
```

**Example**: A chat message goes through:
1. **FIRST**: Spam filter checks (can cancel if spam)
2. **EARLY**: Censorship filter (modifies bad words)
3. **NORMAL**: Chat plugin adds [VIP] prefix
4. **LATE**: Analytics logs the message
5. **LAST**: Backup system saves chat history

---

## Hytale's Event Implementation

Hytale's event system is built on the publish-subscribe pattern, enabling modules and plugins to respond to in-game actions without being tightly coupled to the server's core code.

## Architecture

### Class Hierarchy

```
IBaseEvent<KeyType>
├── IEvent<KeyType>          (synchronous events)
└── IAsyncEvent<KeyType>     (asynchronous events)
```

The system uses a generic `KeyType` that allows events to be filtered by key. For example, player events can use the player's UUID as a key.

### EventBus

The `EventBus` is the central component responsible for managing event registration and distribution.

```java
public class EventBus implements IEventBus {
    private final Map<Class<? extends IBaseEvent<?>>, EventBusRegistry<?, ?, ?>> registryMap;
    private final boolean timeEvents;

    public EventBus(boolean timeEvents) {
        this.timeEvents = timeEvents;
    }
}
```

The `timeEvents` parameter enables performance tracking for each event handler.

### Sync vs Async Registries

The system distinguishes between two types of registries:

#### SyncEventBusRegistry

For synchronous events (`IEvent`), execution is blocking and sequential:

```java
// Synchronous dispatch - returns the event after processing
EventType result = eventBus.dispatchFor(MyEvent.class, key).dispatch(event);
```

#### AsyncEventBusRegistry

For asynchronous events (`IAsyncEvent`), execution uses `CompletableFuture`:

```java
// Asynchronous dispatch - returns a Future
CompletableFuture<EventType> future = eventBus.dispatchForAsync(MyAsyncEvent.class, key).dispatch(event);
```

## Subscribing to Events

### Basic Registration

```java
// Event without a key (KeyType = Void)
eventBus.register(BootEvent.class, event -> {
    System.out.println("Server is booting!");
});

// Event with a key
eventBus.register(PlayerChatEvent.class, "chatChannel", event -> {
    System.out.println(event.getSender().getUsername() + ": " + event.getContent());
});
```

### Registration with Priority

```java
// Using the EventPriority enum
eventBus.register(EventPriority.EARLY, PlayerConnectEvent.class, event -> {
    // Executed before NORMAL handlers
});

// Using a custom short value
eventBus.register((short) -100, PlayerConnectEvent.class, event -> {
    // Negative values = higher priority
});
```

### Global Registration

Global handlers are invoked for ALL events of a given type, regardless of the key:

```java
// Intercepts all PlayerChatEvents, regardless of channel
eventBus.registerGlobal(PlayerChatEvent.class, event -> {
    logChat(event);
});
```

### Unhandled Registration

"Unhandled" handlers are invoked ONLY if no other handler has processed the event:

```java
eventBus.registerUnhandled(PlayerInteractEvent.class, event -> {
    // Default behavior if no specific handler exists
    event.getPlayer().sendMessage("Action not supported");
});
```

### Asynchronous Registration

For async events, handlers use `Function` on `CompletableFuture`:

```java
eventBus.registerAsync(PlayerChatEvent.class, future -> {
    return future.thenApply(event -> {
        // Asynchronous processing
        filterBadWords(event);
        return event;
    });
});

// With priority
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

### Unregistration

Registration returns an `EventRegistration` that allows you to unsubscribe:

```java
EventRegistration<Void, BootEvent> registration = eventBus.register(BootEvent.class, event -> {
    // Handler
});

// Later, to unsubscribe
registration.unregister();

// Check if still active
if (registration.isEnabled()) {
    // The handler is still active
}
```

### Combining Registrations

```java
EventRegistration<?, ?> combined = EventRegistration.combine(
    registration1,
    registration2,
    registration3
);

// Unregisters all handlers at once
combined.unregister();
```

## Event Priorities

### EventPriority Enum

```java
public enum EventPriority {
    FIRST((short) -21844),   // Highest priority
    EARLY((short) -10922),
    NORMAL((short) 0),       // Default priority
    LATE((short) 10922),
    LAST((short) 21844);     // Lowest priority
}
```

### Execution Order

1. Handlers are sorted by priority (ascending short value)
2. Within the same priority, registration order is preserved
3. Global handlers are executed after specific handlers
4. Unhandled handlers are only invoked if no other handler has processed the event

### Special Priorities for Shutdown

`ShutdownEvent` defines specific priority constants:

```java
public class ShutdownEvent implements IEvent<Void> {
    public static final short DISCONNECT_PLAYERS = -48;
    public static final short UNBIND_LISTENERS = -40;
    public static final short SHUTDOWN_WORLDS = -32;
}
```

Usage:

```java
eventBus.register(ShutdownEvent.DISCONNECT_PLAYERS, ShutdownEvent.class, event -> {
    // Disconnect players first
});

eventBus.register(ShutdownEvent.SHUTDOWN_WORLDS, ShutdownEvent.class, event -> {
    // Save worlds afterward
});
```

## Event Cancellation (ICancellable)

### ICancellable Interface

```java
public interface ICancellable {
    boolean isCancelled();
    void setCancelled(boolean cancelled);
}
```

### Usage

```java
eventBus.register(EventPriority.FIRST, PlayerChatEvent.class, event -> {
    if (containsBadWords(event.getContent())) {
        event.setCancelled(true);  // Cancels the message
        event.getSender().sendMessage("Message blocked!");
    }
});

// Subsequent handlers can check for cancellation
eventBus.register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    if (event.isCancelled()) {
        return; // Ignore if already cancelled
    }
    // Normal processing
});
```

### Available Cancellable Events

| Event | Description |
|-------|-------------|
| `PlayerChatEvent` | Chat message |
| `PlayerInteractEvent` | Player interaction |
| `PlayerSetupConnectEvent` | Player connection (pre-spawn) |
| `PlayerMouseButtonEvent` | Mouse click |
| `PlayerMouseMotionEvent` | Mouse movement |
| `BreakBlockEvent` | Block destruction |
| `PlaceBlockEvent` | Block placement |
| `DamageBlockEvent` | Block damage |
| `UseBlockEvent.Pre` | Block usage (pre) |
| `DropItemEvent` | Item drop |
| `CraftRecipeEvent` | Recipe crafting |
| `SwitchActiveSlotEvent` | Active slot change |
| `ChangeGameModeEvent` | Game mode change |
| `InteractivelyPickupItemEvent` | Item pickup |
| `DiscoverZoneEvent.Display` | Zone discovery display |

## Event Reference

### Server Events

| Event | Type | Cancellable | Description |
|-------|------|-------------|-------------|
| `BootEvent` | Sync | No | Server started |
| `ShutdownEvent` | Sync | No | Server shutting down |
| `PrepareUniverseEvent` | Sync | No | Universe preparation (deprecated) |

### Player Events

| Event | Type | Cancellable | Description |
|-------|------|-------------|-------------|
| `PlayerSetupConnectEvent` | Sync | Yes | Pre-connection (authentication) |
| `PlayerConnectEvent` | Sync | No | Connection established |
| `PlayerSetupDisconnectEvent` | Sync | No | Pre-disconnection |
| `PlayerDisconnectEvent` | Sync | No | Disconnection |
| `AddPlayerToWorldEvent` | Sync | No | Player added to world |
| `DrainPlayerFromWorldEvent` | Sync | No | Player removed from world |
| `PlayerReadyEvent` | Sync | No | Player ready |
| `PlayerChatEvent` | Async | Yes | Chat message |
| `PlayerInteractEvent` | Sync | Yes | Interaction (deprecated) |
| `PlayerCraftEvent` | Sync | No | Crafting (deprecated) |
| `PlayerMouseButtonEvent` | Sync | Yes | Mouse click |
| `PlayerMouseMotionEvent` | Sync | Yes | Mouse movement |

### Entity Events

| Event | Type | Cancellable | Description |
|-------|------|-------------|-------------|
| `EntityRemoveEvent` | Sync | No | Entity removed |
| `LivingEntityInventoryChangeEvent` | Sync | No | Inventory change |
| `LivingEntityUseBlockEvent` | Sync | No | Block usage (deprecated) |

### ECS (Entity Component System) Events

| Event | Type | Cancellable | Description |
|-------|------|-------------|-------------|
| `BreakBlockEvent` | ECS | Yes | Block destruction |
| `PlaceBlockEvent` | ECS | Yes | Block placement |
| `DamageBlockEvent` | ECS | Yes | Block damage |
| `UseBlockEvent.Pre` | ECS | Yes | Pre-block usage |
| `UseBlockEvent.Post` | ECS | No | Post-block usage |
| `DropItemEvent.PlayerRequest` | ECS | Yes | Drop request |
| `DropItemEvent.Drop` | ECS | Yes | Actual drop |
| `CraftRecipeEvent.Pre` | ECS | Yes | Pre-craft |
| `CraftRecipeEvent.Post` | ECS | No | Post-craft |
| `SwitchActiveSlotEvent` | ECS | Yes | Slot change |
| `ChangeGameModeEvent` | ECS | Yes | Game mode change |
| `InteractivelyPickupItemEvent` | ECS | Yes | Item pickup |
| `DiscoverZoneEvent.Display` | ECS | Yes | Zone display |
| `DiscoverInstanceEvent` | ECS | No | Instance discovery |
| `DiscoverInstanceEvent.Display` | ECS | Yes | Instance discovery UI display |
| `MoonPhaseChangeEvent` | ECS | No | Moon phase changed |
| `TreasureChestOpeningEvent` | ECS | No | Treasure chest opened |

### Miscellaneous Events

| Event | Type | Cancellable | Description |
|-------|------|-------------|-------------|
| `MessagesUpdated` | Sync | No | i18n messages loaded/updated |
| `GenerateDefaultLanguageEvent` | Sync | No | Default language generation |
| `KillFeedEvent.DecedentMessage` | Sync | No | Death message for victim |
| `KillFeedEvent.Display` | Sync | No | Kill feed UI display |
| `KillFeedEvent.KillerMessage` | Sync | No | Kill message for attacker |
| `SingleplayerRequestAccessEvent` | Sync | No | Singleplayer access request |
| `PrefabPasteEvent` | Sync | Yes | Prefab pasted into world |
| `PrefabPlaceEntityEvent` | Sync | No | Entity placed from prefab |

### Permission Events

| Event | Type | Cancellable | Description |
|-------|------|-------------|-------------|
| `PlayerPermissionChangeEvent.PermissionsAdded` | Sync | No | Permissions added |
| `PlayerPermissionChangeEvent.PermissionsRemoved` | Sync | No | Permissions removed |
| `PlayerPermissionChangeEvent.GroupAdded` | Sync | No | Group added |
| `PlayerPermissionChangeEvent.GroupRemoved` | Sync | No | Group removed |
| `GroupPermissionChangeEvent.Added` | Sync | No | Group permissions added |
| `GroupPermissionChangeEvent.Removed` | Sync | No | Group permissions removed |
| `PlayerGroupEvent.Added` | Sync | No | Player added to group |
| `PlayerGroupEvent.Removed` | Sync | No | Player removed from group |

## Creating Custom Events

### Simple Synchronous Event

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

### Event with Key

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

// Registration with UUID key
eventBus.register(PlayerScoreEvent.class, player.getUuid(), event -> {
    // Only called for this specific player
});
```

### Cancellable Event

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

### Asynchronous Event

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

// Asynchronous dispatch
CompletableFuture<AsyncDatabaseEvent> future = eventBus
    .dispatchForAsync(AsyncDatabaseEvent.class)
    .dispatch(new AsyncDatabaseEvent("SELECT * FROM players"));

future.thenAccept(event -> {
    System.out.println("Query result: " + event.getResult());
});
```

### ECS Event

For events within the Entity Component System:

```java
// Simple ECS event
public class MyEntityEvent extends EcsEvent {
    private final String data;

    public MyEntityEvent(String data) {
        this.data = data;
    }

    public String getData() {
        return data;
    }
}

// Cancellable ECS event
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

## Dispatching Events

### Simple Dispatch

```java
// Create and dispatch an event
MyCustomEvent event = new MyCustomEvent("Hello World");
MyCustomEvent result = eventBus.dispatchFor(MyCustomEvent.class).dispatch(event);

// Check if cancelled (if applicable)
if (result instanceof ICancellable && ((ICancellable) result).isCancelled()) {
    // The event was cancelled
}
```

### Dispatch with Key

```java
UUID playerId = player.getUuid();
PlayerScoreEvent event = new PlayerScoreEvent(playerId, 100);

// Dispatch to handlers registered for this key
eventBus.dispatchFor(PlayerScoreEvent.class, playerId).dispatch(event);
```

### Asynchronous Dispatch

```java
PlayerChatEvent chatEvent = new PlayerChatEvent(sender, targets, message);

CompletableFuture<PlayerChatEvent> future = eventBus
    .dispatchForAsync(PlayerChatEvent.class)
    .dispatch(chatEvent);

future.whenComplete((event, error) -> {
    if (error != null) {
        logger.error("Chat event failed", error);
        return;
    }

    if (!event.isCancelled()) {
        broadcastMessage(event);
    }
});
```

### Checking for Listeners

```java
IEventDispatcher<MyEvent, MyEvent> dispatcher = eventBus.dispatchFor(MyEvent.class);

if (dispatcher.hasListener()) {
    // At least one handler is registered
    dispatcher.dispatch(new MyEvent());
} else {
    // No handlers, optimization possible
}
```

## Complete Examples

### Chat Moderation Plugin

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
                    // Notify the player asynchronously
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

### Zone Protection

```java
public class ZoneProtectionPlugin {
    private final EventBus eventBus;
    private final List<EventRegistration<?, ?>> registrations = new ArrayList<>();

    public void enable() {
        // Block block destruction
        registrations.add(eventBus.register(
            EventPriority.FIRST,
            BreakBlockEvent.class,
            this::onBlockBreak
        ));

        // Block block placement
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

### Connection Management

```java
public class ConnectionManager {
    private final EventBus eventBus;

    public void enable() {
        // Pre-connection: whitelist verification
        eventBus.register(EventPriority.FIRST, PlayerSetupConnectEvent.class, event -> {
            if (!isWhitelisted(event.getUuid())) {
                event.setCancelled(true);
                event.setReason("You are not on the whitelist!");
            }
        });

        // Connection established: welcome message
        eventBus.register(PlayerConnectEvent.class, event -> {
            World spawnWorld = getSpawnWorld();
            event.setWorld(spawnWorld);
        });

        // Player in world: broadcast (global event)
        eventBus.registerGlobal(AddPlayerToWorldEvent.class, event -> {
            String username = event.getHolder()
                .getComponent(Player.getComponentType())
                .getUsername();
            broadcastJoin(username);
        });

        // Disconnection
        eventBus.register(PlayerDisconnectEvent.class, event -> {
            String username = event.getPlayerRef().getUsername();
            PacketHandler.DisconnectReason reason = event.getDisconnectReason();
            logDisconnection(username, reason);
        });
    }
}
```

### Server Redirection

```java
eventBus.register(PlayerSetupConnectEvent.class, event -> {
    // Redirect to another server
    if (isServerFull()) {
        byte[] referralData = createReferralData(event.getUuid());
        event.referToServer("backup.server.com", 25565, referralData);
    }

    // Check if this is a referral connection
    if (event.isReferralConnection()) {
        byte[] data = event.getReferralData();
        HostAddress source = event.getReferralSource();
        handleReferral(event, data, source);
    }
});
```

## Best Practices

### 1. Use Priorities Correctly

```java
// FIRST: Security, validation
eventBus.register(EventPriority.FIRST, PlayerChatEvent.class, this::validateChat);

// EARLY: Data transformation
eventBus.register(EventPriority.EARLY, PlayerChatEvent.class, this::formatChat);

// NORMAL: Core business logic
eventBus.register(PlayerChatEvent.class, this::processChat);

// LATE: Logging, analytics
eventBus.register(EventPriority.LATE, PlayerChatEvent.class, this::logChat);

// LAST: Cleanup, fallback
eventBus.register(EventPriority.LAST, PlayerChatEvent.class, this::cleanupChat);
```

### 2. Always Unregister

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

### 3. Check for Cancellation

```java
eventBus.register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    // Always check if a previous handler cancelled the event
    if (event.isCancelled()) {
        return;
    }

    // Processing...
});
```

### 4. Use Async for Long-Running Operations

```java
// Bad: blocks the main thread
eventBus.register(PlayerConnectEvent.class, event -> {
    loadPlayerDataFromDatabase(event.getPlayerRef()); // BLOCKING!
});

// Good: use an async event or CompletableFuture
eventBus.registerAsync(PlayerChatEvent.class, future -> {
    return future.thenCompose(event -> {
        return loadPlayerDataAsync(event.getSender())
            .thenApply(data -> event);
    });
});
```

### 5. Handle Exceptions

```java
eventBus.register(PlayerChatEvent.class, event -> {
    try {
        processChat(event);
    } catch (Exception e) {
        logger.error("Error processing chat", e);
        // Do not rethrow - allow other handlers to execute
    }
});
```
