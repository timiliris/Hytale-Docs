---
id: overview
title: Java Plugins Overview
sidebar_label: Overview
sidebar_position: 1
description: Develop Java plugins for Hytale servers
---

# Java Plugins Overview

Java plugins provide the most powerful way to extend Hytale servers. According to the official [Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status), server plugins are "the most powerful modding option."

:::tip Recommended: Use the IntelliJ Plugin
The fastest way to start developing Hytale plugins is with our **IntelliJ IDEA plugin**. It provides everything you need to create, develop, and test plugins efficiently.

**Key Benefits:**
- **One-click project setup** - Create a fully configured plugin project in seconds
- **Built-in live templates** - Type `hyevent`, `hycmd`, or `hyecs` for instant code snippets
- **Integrated server management** - Start, stop, and monitor servers from your IDE
- **Hot reload support** - See changes without restarting the server
- **Code completion for Hytale API** - Full IntelliSense for all Hytale classes
- **manifest.json validation** - Catch configuration errors before runtime

[Get Started with IntelliJ Plugin](/docs/modding/plugins/intellij-plugin)
:::

## What is a Hytale Plugin?

Plugins are Java `.jar` files that extend server functionality. They can:

- **Hook into the server API** - Access and modify game systems
- **Handle events** - React to player actions, world changes, and game events
- **Add custom commands** - Create new commands for players and administrators
- **Register custom content** - Add blocks, entities, items, and assets
- **Implement game mechanics** - Build minigames, RPG systems, economy plugins, and more

> "Server plugins are Java-based (.jar files). If you've worked with Bukkit, Spigot, or Paper plugins for Minecraft, that experience will transfer."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

## Getting Started

### Option 1: IntelliJ Plugin (Recommended)

The IntelliJ IDEA plugin is the easiest way to create Hytale plugins:

1. Install [IntelliJ IDEA](https://www.jetbrains.com/idea/download/) (Community or Ultimate)
2. Install the Hytale plugin from the JetBrains Marketplace
3. Use **File > New > Project > Hytale Plugin** to create your project
4. Start coding immediately with all dependencies configured

[Detailed IntelliJ Setup Guide](/docs/modding/plugins/intellij-plugin)

### Option 2: Manual Setup

If you prefer manual configuration or use a different IDE:

1. Set up a Gradle project with Java 25
2. Add the Hytale server as a dependency
3. Create your main plugin class extending `JavaPlugin`
4. Configure your `manifest.json`

[Manual Project Setup Guide](/docs/modding/plugins/project-setup)

## Requirements

| Requirement | Version | Notes |
|-------------|---------|-------|
| Java | **Java 25** | OpenJDK Temurin recommended |
| Gradle | **9.2.0** | For build automation |
| IDE | IntelliJ IDEA | Strongly recommended for Hytale plugin |

## Quick Start: Your First Plugin

Here's a minimal working plugin to get you started:

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import javax.annotation.Nonnull;

public class MyFirstPlugin extends JavaPlugin {

    public MyFirstPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getLogger().info("Hello, Hytale!");

        // Register a simple event listener
        getEventRegistry().register(PlayerJoinEvent.class, event -> {
            getLogger().info("Player joined: " + event.getPlayer().getName());
        });
    }

    @Override
    protected void start() {
        getLogger().info("Plugin is now running!");
    }

    @Override
    protected void shutdown() {
        getLogger().info("Plugin shutting down...");
    }
}
```

And the required `manifest.json`:

```json
{
    "Group": "com.example",
    "Name": "MyFirstPlugin",
    "Version": "1.0.0",
    "Description": "My first Hytale plugin",
    "Main": "com.example.myplugin.MyFirstPlugin"
}
```

:::info Using IntelliJ Plugin?
If you use the IntelliJ plugin, both files are generated automatically when you create a new project. Just fill in your plugin details in the wizard!
:::

## Plugin Architecture

### Core Classes

Hytale uses a two-level class hierarchy for plugins:

- **`PluginBase`** (`com.hypixel.hytale.server.core.plugin.PluginBase`) - The abstract base class that all plugins inherit from. Implements `CommandOwner` and provides core functionality like registries and lifecycle methods.

- **`JavaPlugin`** (`com.hypixel.hytale.server.core.plugin.JavaPlugin`) - Extends `PluginBase` and is the class you extend when creating a plugin. It adds JAR file handling and class loader management.

### Plugin Lifecycle

Understanding when your code runs is crucial:

| State | Description | What to do |
|-------|-------------|------------|
| `SETUP` | Plugin is initializing | Register commands, events, assets |
| `START` | All plugins are set up | Start game logic, interact with other plugins |
| `ENABLED` | Plugin is running | Normal operation |
| `SHUTDOWN` | Server is stopping | Clean up resources, save data |

```java
@Override
protected void setup() {
    // Called first - register everything here
    getCommandRegistry().registerCommand(new MyCommand());
    getEventRegistry().register(PlayerJoinEvent.class, this::onJoin);
}

@Override
protected void start() {
    // Called after ALL plugins have completed setup()
    // Safe to interact with other plugins here
}

@Override
protected void shutdown() {
    // Called when server stops - clean up here
    savePlayerData();
}
```

## Key Concepts

### Events

React to things happening in the game:

```java
// Listen to player events
getEventRegistry().register(PlayerJoinEvent.class, event -> {
    event.getPlayer().sendMessage("Welcome to the server!");
});

// Listen with priority
getEventRegistry().register(EventPriority.EARLY, BlockBreakEvent.class, this::onBlockBreak);
```

[Learn more about Events](/docs/modding/plugins/events)

### Commands

Add custom commands for players and console:

```java
getCommandRegistry().registerCommand(new MyCommand());
```

[Learn more about Commands](/docs/modding/plugins/commands)

### Entity Component System (ECS)

Hytale uses an ECS architecture for entities and chunks:

```java
// Register a custom component for entities
getEntityStoreRegistry().registerComponent(MyComponent.class, MyComponent.CODEC);

// Register a system that processes components
EntityStore.REGISTRY.registerSystem(new MyProcessingSystem());
```

[Learn more about ECS](/docs/modding/plugins/ecs)

## Available Registries

`PluginBase` provides access to multiple registries:

| Registry | Purpose | Access Method |
|----------|---------|---------------|
| Command Registry | Player/console commands | `getCommandRegistry()` |
| Event Registry | Game event listeners | `getEventRegistry()` |
| Asset Registry | Custom textures, models, sounds | `getAssetRegistry()` |
| Block State Registry | Custom block states | `getBlockStateRegistry()` |
| Entity Registry | Custom entity types | `getEntityRegistry()` |
| Task Registry | Scheduled/delayed tasks | `getTaskRegistry()` |
| Chunk Store Registry | Chunk components | `getChunkStoreRegistry()` |
| Entity Store Registry | Entity components | `getEntityStoreRegistry()` |
| Client Feature Registry | Client-side features | `getClientFeatureRegistry()` |

## The manifest.json File

Every plugin requires a `manifest.json` file at the root of your JAR:

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `Name` | String | Plugin name identifier (required) |

### Common Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `Group` | String | Plugin group/namespace |
| `Version` | String | Semantic version (e.g., "1.0.0") |
| `Description` | String | Plugin description |
| `Main` | String | Fully qualified main class name |
| `Authors` | AuthorInfo[] | Array of author information |
| `Dependencies` | Map | Required plugin dependencies |
| `ServerVersion` | String | Compatible server version range |

### Full Example

```json
{
    "Group": "com.example",
    "Name": "MyPlugin",
    "Version": "1.0.0",
    "Description": "An example Hytale plugin",
    "Main": "com.example.myplugin.MyPlugin",
    "Authors": [
        {
            "Name": "Your Name",
            "Email": "you@example.com",
            "Url": "https://example.com"
        }
    ],
    "ServerVersion": ">=1.0.0",
    "Dependencies": {
        "Hytale:SomeOtherPlugin": ">=2.0.0"
    }
}
```

## Plugin Installation

1. Build your plugin JAR (using Gradle: `./gradlew build`)
2. Place the `.jar` file in the `mods` directory of your server
3. Start or restart the server
4. Check server logs to confirm your plugin loaded

:::tip Hot Reload with IntelliJ
The IntelliJ plugin supports hot reload - rebuild your plugin and it will be automatically reloaded without restarting the server!
:::

## Next Steps

### Essential Reading

1. [IntelliJ Plugin Setup](/docs/modding/plugins/intellij-plugin) - Get your development environment ready
2. [Project Setup](/docs/modding/plugins/project-setup) - Manual configuration details
3. [Plugin Lifecycle](/docs/modding/plugins/plugin-lifecycle) - Deep dive into lifecycle states

### Core Features

4. [Events](/docs/modding/plugins/events) - React to game events
5. [Commands](/docs/modding/plugins/commands) - Create custom commands
6. [Entity Component System](/docs/modding/plugins/ecs) - Work with entities and chunks

### Advanced Topics

7. [Custom Blocks](/docs/modding/plugins/custom-blocks) - Add new block types
8. [Custom Entities](/docs/modding/plugins/custom-entities) - Create new entities
9. [Networking](/docs/modding/plugins/networking) - Client-server communication

## Server Source Code

The development team is committed to releasing the server source code **1-2 months after launch**, enabling deeper understanding of the API and community contributions.

> "We are committed to releasing the server's source code as soon as we are legally authorized to do so."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

### Benefits of Open Source

- Inspect how systems work under the hood
- Unblock yourself by reading the actual implementation
- Contribute improvements and bug fixes back

:::info Decompilation Available Now
Until the source code is released, the server JAR is **not obfuscated** and can be easily decompiled. This allows you to explore the API while official documentation catches up.
:::

## Visual Scripting Alternative

For non-programmers, Hytale is developing a **Visual Scripting system** inspired by Unreal Engine Blueprints:

- Create game logic through a node-based interface
- No coding required
- Programmers can create custom nodes in Java that designers can use

[Learn more about Visual Scripting](/docs/modding/overview#4-visual-scripting-coming-soon)
