---
id: boot-event
title: BootEvent
sidebar_label: BootEvent
---

# BootEvent

The `BootEvent` is fired when the Hytale server begins its boot sequence. This event provides plugins with an opportunity to perform initialization tasks that need to occur as early as possible in the server lifecycle.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.BootEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/BootEvent.java:6` |

## Declaration

```java
public class BootEvent implements IEvent<Void> {
    public BootEvent() {
    }

    @Nonnull
    @Override
    public String toString() {
        return "BootEvent{}";
    }
}
```

## Fields

This event has no fields. It serves as a signal that the server boot process has begun.

## Methods

This event inherits standard methods from `IEvent<Void>` but does not define any additional methods.

## Usage Example

```java
import com.hypixel.hytale.server.core.event.events.BootEvent;
import com.hypixel.hytale.event.EventBus;

public class MyPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Register for the boot event
        eventBus.register(BootEvent.class, this::onServerBoot);
    }

    private void onServerBoot(BootEvent event) {
        // Perform early initialization
        getLogger().info("Server is booting up!");

        // Initialize configuration
        loadConfiguration();

        // Set up any required resources
        initializeResources();
    }

    private void loadConfiguration() {
        // Load plugin configuration files
    }

    private void initializeResources() {
        // Set up databases, caches, etc.
    }
}
```

## When This Event Fires

The `BootEvent` fires at the very beginning of the server startup process. This occurs:

1. After the server application has started
2. After initial class loading and dependency injection
3. Before worlds are loaded
4. Before plugins receive their setup events
5. Before any players can connect

This makes it ideal for:
- Early resource initialization
- Configuration loading
- Database connection establishment
- Setting up logging frameworks
- Registering for other events

## Related Events

| Event | Description |
|-------|-------------|
| [ShutdownEvent](./shutdown-event) | Fired when the server begins shutting down |
| [PluginSetupEvent](./plugin-setup-event) | Fired when an individual plugin is being set up |
| [AllWorldsLoadedEvent](/docs/en/modding/plugins/events/world/all-worlds-loaded-event) | Fired after all worlds have finished loading |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.event.events`
- **Hierarchy**: `BootEvent` -> `IEvent<Void>` -> `IBaseEvent<Void>`
- **Event System**: Standard synchronous event dispatched via `EventBus`
