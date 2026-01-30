---
title: Events Reference
description: Complete reference for all 69 Hytale server events with filters and search
---

# Events Reference

The Hytale server uses a sophisticated event system that allows plugins to listen for and respond to various game actions. This reference provides a complete, searchable list of all available events.

<EventsReference />

## Quick Start

Get started with events in seconds:

```java
// Listen to player connections (IEvent)
getEventRegistry().register(PlayerConnectEvent.class, event -> {
    getLogger().info("Welcome " + event.getPlayer().getName() + "!");
});

// Listen to block breaks (ECS Event)
getEntityStoreRegistry().registerSystem(new BlockBreakSystem());
```

:::tip IntelliJ Integration
Use the `hyevent` live template to quickly scaffold event listeners. Just type `hyevent` and press Tab to expand into a complete event registration block.
:::

## Understanding the Two Event Systems

Hytale uses two distinct event systems:

### IEvent System (EventBus)

Use for **server lifecycle and player state events**:
- Player connection/disconnection
- Server boot/shutdown
- World creation/removal
- Permission changes
- Chat messages

**Registration:** `getEventRegistry().register(...)`

### ECS Event System (EntityEventSystem)

Use for **gameplay and entity-related events**:
- Block breaking/placing
- Item dropping/pickup
- Inventory changes
- Damage events

**Registration:** `getEntityStoreRegistry().registerSystem(new YourSystem())`

:::info ECS Events Require a System Class
ECS events cannot use simple lambda registration. You must create a class extending `EntityEventSystem`.
:::

## Event Priorities

Events are dispatched to handlers in priority order:

| Priority | Value | Use Cases |
|----------|-------|-----------|
| `FIRST` | -21844 | Security checks, logging |
| `EARLY` | -10922 | Validation, permissions |
| `NORMAL` | 0 | Standard handling |
| `LATE` | 10922 | React to modifications |
| `LAST` | 21844 | Final logging, cleanup |

## See Also

- [Plugin Development Guide](/docs/modding/plugins/overview)
- [ECS System Overview](/docs/api/server-internals/ecs)
- [IntelliJ Plugin](/docs/modding/plugins/intellij-plugin)
