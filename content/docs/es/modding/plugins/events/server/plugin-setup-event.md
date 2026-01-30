---
id: plugin-setup-event
title: PluginSetupEvent
sidebar_label: PluginSetupEvent
---

# PluginSetupEvent

The `PluginSetupEvent` is fired when a plugin is being set up during the server initialization process. This event is dispatched for each plugin and provides access to the plugin instance being initialized.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.plugin.event.PluginSetupEvent` |
| **Parent Class** | `PluginEvent` |
| **Cancellable** | No |
| **Async** | No |
| **Key Type** | `Class<? extends PluginBase>` |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/plugin/event/PluginSetupEvent.java:6` |

## Declaration

```java
public class PluginSetupEvent extends PluginEvent {
    public PluginSetupEvent(PluginBase plugin) {
        super(plugin);
    }
}
```

## Parent Class: PluginEvent

The `PluginSetupEvent` extends `PluginEvent`, which provides access to the plugin being initialized:

```java
public abstract class PluginEvent implements IEvent<Class<? extends PluginBase>> {
    @Nonnull
    private final PluginBase plugin;

    public PluginEvent(@Nonnull PluginBase plugin) {
        this.plugin = plugin;
    }

    @Nonnull
    public PluginBase getPlugin() {
        return this.plugin;
    }

    @Nonnull
    @Override
    public String toString() {
        return "PluginEvent{}";
    }
}
```

## Fields

| Field | Type | Description | Accessor |
|-------|------|-------------|----------|
| `plugin` | `PluginBase` | The plugin instance being set up | `getPlugin()` |

## Methods

### Inherited from PluginEvent

| Method | Return Type | Description |
|--------|-------------|-------------|
| `getPlugin()` | `PluginBase` | Returns the plugin instance being set up |

## Usage Example

### Listening for Plugin Setup

```java
import com.hypixel.hytale.server.core.plugin.event.PluginSetupEvent;
import com.hypixel.hytale.event.EventBus;

public class PluginManagerPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Listen for all plugin setup events (global registration)
        eventBus.registerGlobal(PluginSetupEvent.class, this::onPluginSetup);
    }

    private void onPluginSetup(PluginSetupEvent event) {
        PluginBase plugin = event.getPlugin();
        getLogger().info("Plugin being set up: " + plugin.getClass().getName());
    }
}
```

### Listening for Specific Plugin Setup

```java
import com.hypixel.hytale.server.core.plugin.event.PluginSetupEvent;
import com.hypixel.hytale.event.EventBus;

public class MyDependentPlugin extends PluginBase {

    @Override
    public void onEnable(EventBus eventBus) {
        // Listen for a specific plugin's setup event using the key
        eventBus.register(
            PluginSetupEvent.class,
            MyDependencyPlugin.class,  // Key: the specific plugin class
            this::onDependencySetup
        );
    }

    private void onDependencySetup(PluginSetupEvent event) {
        // This only fires when MyDependencyPlugin is being set up
        MyDependencyPlugin dependency = (MyDependencyPlugin) event.getPlugin();
        getLogger().info("Dependency plugin is ready: " + dependency.getName());
    }
}
```

### Plugin Statistics Tracking

```java
import com.hypixel.hytale.server.core.plugin.event.PluginSetupEvent;
import com.hypixel.hytale.event.EventBus;
import java.util.ArrayList;
import java.util.List;

public class PluginStatsPlugin extends PluginBase {

    private final List<String> loadedPlugins = new ArrayList<>();

    @Override
    public void onEnable(EventBus eventBus) {
        // Track all plugin setups
        eventBus.registerGlobal(PluginSetupEvent.class, this::trackPluginSetup);
    }

    private void trackPluginSetup(PluginSetupEvent event) {
        PluginBase plugin = event.getPlugin();
        String pluginName = plugin.getClass().getSimpleName();

        loadedPlugins.add(pluginName);
        getLogger().info("Loaded plugin #" + loadedPlugins.size() + ": " + pluginName);
    }

    public List<String> getLoadedPlugins() {
        return new ArrayList<>(loadedPlugins);
    }
}
```

### Inter-Plugin Communication Setup

```java
import com.hypixel.hytale.server.core.plugin.event.PluginSetupEvent;
import com.hypixel.hytale.event.EventBus;

public class APIConsumerPlugin extends PluginBase {

    private APIProviderPlugin apiProvider;

    @Override
    public void onEnable(EventBus eventBus) {
        // Wait for the API provider plugin to be set up
        eventBus.register(
            PluginSetupEvent.class,
            APIProviderPlugin.class,
            this::onAPIProviderReady
        );
    }

    private void onAPIProviderReady(PluginSetupEvent event) {
        // Store reference to the API provider
        apiProvider = (APIProviderPlugin) event.getPlugin();

        // Register with the API
        apiProvider.registerConsumer(this);

        getLogger().info("Successfully connected to API provider plugin");
    }

    public APIProviderPlugin getAPIProvider() {
        return apiProvider;
    }
}
```

## When This Event Fires

The `PluginSetupEvent` fires during the server plugin initialization phase:

1. After the server boot process begins
2. After [BootEvent](./boot-event) has been dispatched
3. When each individual plugin is being initialized
4. Before plugins are fully enabled and operational
5. Before worlds are loaded

The event is keyed by the plugin's class type, allowing handlers to:
- Listen for all plugin setups using `registerGlobal()`
- Listen for specific plugin setups by providing the plugin class as the key

## Event Key System

This event uses `Class<? extends PluginBase>` as its key type, which enables targeted event handling:

```java
// Global: receive events for ALL plugins
eventBus.registerGlobal(PluginSetupEvent.class, handler);

// Specific: receive events only for MyPlugin
eventBus.register(PluginSetupEvent.class, MyPlugin.class, handler);

// Unhandled: receive events for plugins with no specific handlers
eventBus.registerUnhandled(PluginSetupEvent.class, fallbackHandler);
```

## Best Practices

1. **Use key-based registration**: When waiting for a specific plugin, use the plugin class as the key rather than checking in a global handler.

2. **Avoid blocking operations**: Plugin setup should be fast to ensure server startup isn't delayed.

3. **Handle missing dependencies gracefully**: If your plugin depends on another plugin, consider what happens if that plugin isn't installed.

4. **Don't modify other plugins**: Use this event for observation and initialization coordination, not to modify other plugins' behavior.

## Related Events

| Event | Description |
|-------|-------------|
| [BootEvent](./boot-event) | Fired when the server begins booting |
| [ShutdownEvent](./shutdown-event) | Fired when the server begins shutting down |
| [AllWorldsLoadedEvent](/docs/en/modding/plugins/events/world/all-worlds-loaded-event) | Fired after all worlds have been loaded |

## Source Reference

- **Package**: `com.hypixel.hytale.server.core.plugin.event`
- **Hierarchy**: `PluginSetupEvent` -> `PluginEvent` -> `IEvent<Class<? extends PluginBase>>` -> `IBaseEvent<Class<? extends PluginBase>>`
- **Event System**: Standard synchronous event dispatched via `EventBus` with plugin class as key
