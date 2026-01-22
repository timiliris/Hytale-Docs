---
id: intellij-plugin
title: IntelliJ IDEA Plugin
sidebar_label: IntelliJ Plugin
sidebar_position: 1
description: Complete guide to the Hytale IntelliJ IDEA plugin - the ultimate toolkit for Hytale plugin development
---

# Hytale IntelliJ IDEA Plugin

The **HytaleDocs Dev Tools** plugin is the ultimate toolkit for Hytale server plugin development. Create, build, deploy, and debug your plugins without ever leaving IntelliJ IDEA.

## Why Use This Plugin?

- **Save Time**: Project wizard creates complete plugin projects in seconds
- **Prevent Errors**: Live templates and code completion ensure correct API usage
- **Best Practices Built-in**: Generated code follows Hytale's recommended patterns
- **Streamlined Workflow**: Build, deploy, and run with a single click
- **Integrated Documentation**: Access API docs directly in your IDE

:::tip Get the Plugin
Install from the [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/hytale-docs-dev-tools) or search "Hytale" in your IDE's plugin settings.
:::

---

## Installation

### From JetBrains Marketplace

1. Visit the [HytaleDocs Dev Tools](https://plugins.jetbrains.com/plugin/hytale-docs-dev-tools) page
2. Click **Install to IDE**
3. Restart IntelliJ IDEA

### From Inside the IDE

1. Open **Settings** (Ctrl+Alt+S on Windows/Linux, Cmd+, on macOS)
2. Navigate to **Plugins** > **Marketplace**
3. Search for **"Hytale"**
4. Click **Install** on "HytaleDocs Dev Tools"
5. Restart IntelliJ IDEA

### Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| IntelliJ IDEA | 2025.3+ |
| Java | 25+ (plugin can install this for you) |

---

## Project Creation Wizard

Create a complete Hytale plugin project with proper structure, build configuration, and boilerplate code in just a few clicks.

### Accessing the Wizard

1. Go to **File** > **New** > **Project**
2. Select **Hytale Mod** from the project types
3. Follow the three-step wizard

### Step 1: Template Selection

Choose your starting point:

| Template | Description | Best For |
|----------|-------------|----------|
| **Empty Mod** | Minimal boilerplate with just the main class | Experienced developers who want full control |
| **Full Template** | Complete starter with commands, events, and UI examples | Beginners and rapid prototyping |

:::info Recommendation
Choose **Full Template** if you're new to Hytale plugin development. It includes working examples you can learn from and modify.
:::

### Step 2: Mod Configuration

Configure your plugin's identity and build settings:

| Field | Description | Example |
|-------|-------------|---------|
| **Mod Name** | Display name of your plugin | `MyHytaleMod` |
| **Package** | Java package name (auto-generated from mod name) | `com.example.myhytalemod` |
| **Language** | Programming language | Java or Kotlin |
| **Build System** | Build tool | Gradle or Maven |
| **Version** | Semantic version | `1.0.0` |
| **Command** | In-game command prefix (auto-abbreviated) | `mhm` |

**Smart Auto-Generation Features:**

- **Package Name**: Automatically derived from mod name (e.g., "My Cool Mod" becomes `com.example.mycoolmod`)
- **Command Abbreviation**: Multi-word names get abbreviated (e.g., "My Hytale Mod" becomes `mhm`)
- **Mod ID**: Generated from mod name in lowercase with hyphens

### Step 3: Author and Description

Add metadata and configure server file detection:

| Field | Description |
|-------|-------------|
| **Author** | Your name (defaults to system user) |
| **Description** | Brief description of your plugin |
| **Copy server files** | Auto-copies server files if Hytale is detected |

The wizard automatically detects your Hytale installation and can copy the server JAR and assets to your project.

---

## Live Templates

Live templates are code snippets that expand when you type a prefix and press **Tab**. They significantly speed up development and ensure consistent code patterns.

### Available Templates

| Prefix | Name | Description |
|--------|------|-------------|
| `hyplugin` | Main Plugin Class | Complete plugin class with logger and lifecycle methods |
| `hyevent` | Event Listener | Register an event listener with the event bus |
| `hycmd` | Command Collection | Command handler class extending AbstractCommandCollection |
| `hyecs` | ECS Event System | Entity Component System event handler |
| `hylistener` | Quick Listener | Compact lambda event listener |
| `hymsg` | Send Message | Send a message to a player |
| `hylogger` | Logger Declaration | Declare a HytaleLogger for the current class |
| `hypermission` | Permission Check | Permission check with denial message |
| `hyquery` | ECS Query | Create an ECS query for entity filtering |
| `hysubcmd` | Sub-command | Add a sub-command to a command collection |

### Template Examples

#### hyplugin - Main Plugin Class

Type `hyplugin` and press Tab to generate:

```java
public class MyPlugin extends JavaPlugin {
    private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        LOGGER.info("Setting up...");
        // Register commands and events here
    }

    @Override protected void start() { LOGGER.info("Started!"); }
    @Override protected void shutdown() { LOGGER.info("Stopped!"); }
}
```

#### hyevent - Event Listener Registration

Type `hyevent` and press Tab:

```java
eventBus.register(PlayerConnectEvent.class, event -> {
    // Handle event
});
```

#### hycmd - Command Collection

Type `hycmd` and press Tab:

```java
public class MyCommand extends AbstractCommandCollection {
    public MyCommand() {
        super("mycommand", "Command description");
    }
}
```

#### hyecs - ECS Event System

Type `hyecs` and press Tab:

```java
public class MySystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {
    @Override
    public void handle(int index, ArchetypeChunk<EntityStore> chunk,
                       Store<EntityStore> store, CommandBuffer<EntityStore> buffer,
                       BreakBlockEvent event) {
        // Handle event
    }

    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

#### hylogger - Logger Declaration

Type `hylogger` and press Tab:

```java
private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();
```

#### hypermission - Permission Check

Type `hypermission` and press Tab:

```java
if (!context.hasPermission("myplugin.command")) {
    context.sendMessage(Message.raw("You do not have permission to use this command."));
    return;
}
// Continue if permission granted
```

#### hyquery - ECS Query

Type `hyquery` and press Tab:

```java
Query<EntityStore> query = Archetype.create(EntityStore.class)
    .with(PositionComponent.class, HealthComponent.class)
    .build();
```

#### hysubcmd - Sub-command

Type `hysubcmd` and press Tab:

```java
addSubCommand("subcommand", "Sub-command description", (context, args) -> {
    // Handle sub-command
});
```

---

## Code Completion and IntelliSense

The plugin provides intelligent code completion specifically for the Hytale API.

### Features

- **Event Class Completion**: When typing inside generics like `register(`, get suggestions for all available event classes (`PlayerConnectEvent`, `PlayerChatEvent`, `BreakBlockEvent`, etc.)
- **Event Method Completion**: After selecting an event, get completions for event-specific methods
- **Plugin Lifecycle Methods**: Suggestions for `setup()`, `start()`, and `shutdown()` overrides
- **Context-Aware**: Completions only appear when working with Hytale API code

### How It Works

The completion system is context-aware and activates only when you're working with Hytale code:

```java
// Type eventBus.register( and see event class suggestions
eventBus.register(Player|  // Shows: PlayerConnectEvent, PlayerChatEvent, etc.

// Event methods are suggested based on the event type
event.get|  // Shows: getPlayerRef(), getMessage(), etc.
```

---

## Run Configuration and Debugging

The plugin provides a custom run configuration that handles the entire build-deploy-run pipeline.

### Creating a Run Configuration

1. Go to **Run** > **Edit Configurations**
2. Click **+** and select **Hytale Server**
3. Configure the settings (or use auto-detect)
4. Click **OK**

:::tip Auto-Setup
When you open a Hytale plugin project, the plugin automatically creates a run configuration for you.
:::

### Configuration Options

#### Build Settings

| Option | Description | Default |
|--------|-------------|---------|
| **Build before run** | Run Gradle/Maven before starting | Enabled |
| **Build task** | Gradle task to execute | `shadowJar` |

#### Plugin Deployment

| Option | Description | Default |
|--------|-------------|---------|
| **Deploy plugin** | Copy JAR to server's mods folder | Enabled |
| **Plugin JAR** | Path to built JAR | Auto-detected |
| **Plugin name** | Plugin ID for reload commands | Auto-detected |
| **Hot reload** | Reload plugin without restart | Enabled |

:::info Auto-Detect
Click **Auto-detect** to automatically find plugin info from:
- `.hytale/project.json`
- `src/main/resources/manifest.json`
- `build.gradle` / `build.gradle.kts`
:::

#### Server Settings

| Option | Description | Default |
|--------|-------------|---------|
| **Server directory** | Path to HytaleServer.jar | `server/` |
| **Java executable** | Path to Java 25+ | Auto-detected |
| **Port** | UDP port for Hytale | `5520` |

#### Memory Settings

| Option | Description | Default |
|--------|-------------|---------|
| **Minimum memory** | JVM -Xms | `2G` |
| **Maximum memory** | JVM -Xmx | `8G` |

#### Server Options

| Option | Description | Default |
|--------|-------------|---------|
| **Auth mode** | `authenticated` or `offline` | `authenticated` |
| **Allow operator** | Enable /op commands | Enabled |
| **Accept early plugins** | Load early-stage plugins | Enabled |

#### Advanced Options

| Option | Description | Example |
|--------|-------------|---------|
| **JVM arguments** | Additional JVM flags | `-XX:+UseZGC` |
| **Server arguments** | Arguments for HytaleServer.jar | Custom flags |

### Debug Mode

To debug your plugin:

1. Click the **Debug** button (bug icon) instead of Run
2. The plugin automatically:
   - Finds an available debug port (5005-5015)
   - Starts the server with debug flags
   - Attaches the debugger
3. Set breakpoints in your code and they will be hit when executed

### Hot Reload

When hot reload is enabled and the server is already running:

1. Make changes to your code
2. Press **Shift+F10** (or click Run)
3. The plugin:
   - Builds your plugin
   - Unloads the old version from the server
   - Deploys the new JAR
   - Loads the new version

No server restart required for most changes.

---

## HytaleDocs Tool Window

The plugin adds a **HytaleDocs** tool window to the right sidebar with six tabs for managing your development workflow.

### Server Tab

Monitor and control your server:

- **Environment Status**: Java 25 and server files status with install buttons
- **Server Status**: Running/Stopped indicator with auth mode
- **Server Controls**: Start, Stop, Refresh, Settings buttons
- **Live Statistics**: Uptime, players online, authentication status
- **Quick Settings**: Auth mode toggle, memory display, port info

### Console Tab

Full-featured server console:

- **Colored Log Output**: INFO (green), WARN (yellow), ERROR (red)
- **Command Input**: Send server commands directly
- **Toolbar**: Clear console, Copy all output
- **Auto-scroll**: Follows new log entries

### Assets Tab

Browse and preview game assets:

- **Asset Explorer**: Tree view of server assets
- **Preview Panel**: View images, JSON, and audio files
- **Sync Status**: Track asset synchronization

### Docs Tab

Integrated API documentation:

- **Search**: Find classes, methods, and events
- **Offline Access**: Documentation works without internet
- **Quick Navigation**: Click to jump to relevant docs

### AI Tab

AI-assisted development:

- **MCP Integration**: Connect to Claude for code assistance
- **Quick Prompts**: Common development queries
- **Context-Aware**: AI understands your Hytale project

### Infos Tab

Quick reference and links:

- **Documentation Links**: HytaleDocs, API Reference, Plugin Guide
- **Live Templates**: Quick reference for all template prefixes
- **Server Commands**: Common server commands
- **Contributors**: Project contributors and links

---

## .ui File Support

The plugin provides full language support for Hytale's `.ui` definition files.

### Features

| Feature | Description |
|---------|-------------|
| **Syntax Highlighting** | Components, properties, and values are color-coded |
| **Code Completion** | Suggestions for UI elements and properties |
| **Color Preview** | Gutter icons show color values inline |
| **Color Picker** | Click color icons to change colors visually |
| **Brace Matching** | Automatic matching of `{` and `}` |
| **Code Folding** | Collapse Group blocks for better overview |
| **Commenting** | Toggle comments with Ctrl+/ |

### Example .ui File

```
// Hytale UI Definition
Group #MyUIRoot {
  Anchor: (Width: 400, Height: 300);
  Background: #1a1a2e(0.95);
  LayoutMode: Top;
  Padding: (Full: 16);

  Label #Title {
    Text: "My UI";
    Anchor: (Height: 32);
    Style: (
      FontSize: 18,
      TextColor: #ffffff,
      RenderBold: true,
      HorizontalAlignment: Center
    );
  }
}
```

---

## File Templates

Create new Hytale files quickly with built-in templates.

### Accessing File Templates

1. Right-click a package or directory
2. Select **New** > **Hytale**
3. Choose a template

### Available Templates

| Template | Description |
|----------|-------------|
| **Hytale Plugin** | Main plugin class with lifecycle methods |
| **Hytale Listener** | Event listener class with registration method |
| **Hytale Command** | Command collection with help sub-command |
| **Hytale ECS System** | Entity event system for ECS architecture |
| **Hytale UI File** | UI definition file with basic structure |

### Template Examples

#### Hytale Plugin

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import com.hypixel.hytale.logger.HytaleLogger;

public class MyPlugin extends JavaPlugin {
    private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();
    private static MyPlugin instance;

    public MyPlugin(JavaPluginInit init) {
        super(init);
        instance = this;
    }

    @Override
    protected void setup() {
        LOGGER.info("Setting up...");
        // Register commands and listeners here
    }

    @Override
    protected void start() {
        LOGGER.info("Started!");
    }

    @Override
    protected void shutdown() {
        LOGGER.info("Shutting down...");
        instance = null;
    }
}
```

#### Hytale Listener

```java
package com.example.myplugin;

import com.hypixel.hytale.event.EventRegistry;
import com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent;
import com.hypixel.hytale.logger.HytaleLogger;

public class MyListener {
    private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();

    public static void register(EventRegistry eventRegistry) {
        eventRegistry.register(PlayerConnectEvent.class, event -> {
            String playerName = event.getPlayerRef().getUsername();
            LOGGER.info("Player connected: " + playerName);
        });
    }
}
```

#### Hytale Command

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractCommandCollection;
import com.hypixel.hytale.server.core.Message;

public class MyCommand extends AbstractCommandCollection {
    public MyCommand() {
        super("mycommand", "My command description");
        this.addSubCommand(new HelpSubCommand());
    }

    private static class HelpSubCommand extends CommandBase {
        public HelpSubCommand() {
            super("help", "Show available commands");
        }

        @Override
        protected void executeSync(CommandContext context) {
            context.sendMessage(Message.raw("=== MyCommand Help ==="));
            context.sendMessage(Message.raw("/mycommand help - Show this message"));
        }
    }
}
```

---

## Quick Start Tutorial

Follow these steps to create your first Hytale plugin with the IntelliJ plugin:

### 1. Install the Plugin

1. Open IntelliJ IDEA
2. Go to **Settings** > **Plugins** > **Marketplace**
3. Search "Hytale" and install "HytaleDocs Dev Tools"
4. Restart the IDE

### 2. Create a New Project

1. Go to **File** > **New** > **Project**
2. Select **Hytale Mod**
3. Choose **Full Template** (recommended for beginners)
4. Enter your mod name: `MyFirstPlugin`
5. Keep the auto-generated values or customize them
6. Click **Create**

### 3. Explore the Generated Code

The wizard creates:

```
MyFirstPlugin/
├── src/main/java/com/example/myfirstplugin/
│   ├── MyFirstPlugin.java      # Main plugin class
│   ├── listeners/
│   │   └── PlayerListener.java  # Example event listener
│   └── commands/
│       └── MainCommand.java     # Example command
├── src/main/resources/
│   └── manifest.json            # Plugin manifest
├── build.gradle                 # Build configuration
└── server/                      # Server files (if detected)
```

### 4. Write Your First Event Listener

1. Open any Java file in your plugin
2. Type `hyevent` and press Tab
3. Change `PlayerConnectEvent` to your desired event
4. Add your logic:

```java
eventBus.register(PlayerConnectEvent.class, event -> {
    String name = event.getPlayerRef().getUsername();
    getLogger().info("Welcome, " + name + "!");
});
```

### 5. Configure and Run the Server

1. Go to **Tools** > **Hytale Server** > **Setup Server** (first time only)
2. Wait for Java 25 and server files to download
3. Press **Shift+F10** or click the Run button
4. Watch the Console tab in the HytaleDocs tool window

### 6. Test In-Game

1. Launch Hytale and connect to `localhost:5520`
2. Your plugin is now running
3. Try the commands you created

### 7. Use Hot Reload

1. Make a change to your plugin code
2. Press **Shift+F10** again
3. The plugin is rebuilt and reloaded automatically
4. Test your changes without restarting the server

---

## Tips and Best Practices

### Development Workflow

1. **Use Live Templates**: Type `hy` and see all available templates. They ensure consistent, correct code.

2. **Enable Hot Reload**: Keep it enabled during development. You can iterate much faster without server restarts.

3. **Keep the Tool Window Open**: The Console tab gives you real-time feedback. The Docs tab is always just a click away.

4. **Use Debug Mode**: For complex issues, use debug mode to set breakpoints and inspect variables.

### Code Quality

1. **Use the Logger**: Always use `HytaleLogger` instead of `System.out.println()`:
   ```java
   private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();
   LOGGER.info("Player joined: %s", playerName);
   ```

2. **Register in setup()**: All registrations (events, commands, assets) should happen in `setup()`, not `start()`.

3. **Clean Up in shutdown()**: Cancel tasks and close resources in `shutdown()` to support hot reload.

### Performance

1. **Use ECS for Heavy Operations**: For operations that run frequently (every tick, every entity), use ECS systems instead of event listeners.

2. **Batch Operations**: When modifying multiple blocks or entities, batch your changes using `CommandBuffer`.

### Debugging

1. **Check the Console**: Most issues are logged. Look for ERROR and WARN messages.

2. **Use Breakpoints**: Set breakpoints in event handlers to see exactly what data you're working with.

3. **Check manifest.json**: Many loading issues come from incorrect manifest configuration.

---

## Resources

- [HytaleDocs Website](https://hytale-docs.com)
- [API Reference](https://hytale-docs.com/api)
- [Plugin Guide](https://hytale-docs.com/modding/plugins/project-setup)
- [Discord Community](https://discord.gg/yAjaFBH4Y8)
- [GitHub Repository](https://github.com/HytaleDocs/hytale-intellij-plugin)

---

## Troubleshooting

### Plugin Not Loading

1. Check that `manifest.json` exists in `src/main/resources/`
2. Verify the `Main` class path matches your actual class
3. Look for errors in the console output

### Java Not Found

1. Go to **Tools** > **Hytale Server** > **Setup Server**
2. Click **Install Java 25**
3. The plugin downloads and configures Java automatically

### Server Won't Start

1. Check if port 5520 is already in use
2. Verify server files exist in the configured directory
3. Try **Tools** > **Hytale Server** > **Download Server JAR**

### Hot Reload Not Working

1. Ensure mod name has no spaces (e.g., `MyPlugin` not `My Plugin`)
2. Check that the plugin ID matches in the run configuration
3. Verify the server is actually running before reloading

### Build Fails

1. Check that Java 25+ is selected as the project SDK
2. Run `gradle build` from terminal to see detailed errors
3. Ensure all dependencies are properly declared
