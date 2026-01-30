---
id: project-setup
title: Plugin Project Setup
sidebar_label: Project Setup
sidebar_position: 2
description: Complete guide to setting up a Hytale Java plugin project with Gradle
---

# Plugin Project Setup

Learn how to create a properly structured Hytale plugin project using Gradle and Java 25.

:::tip Recommended: Use the IntelliJ Plugin
The easiest way to set up a Hytale plugin project is with the [Hytale IntelliJ Plugin](/docs/modding/plugins/intellij-plugin). It provides:
- **One-click project creation** with a guided wizard
- **Automatic server setup** including Java 25 and server JAR download
- **Live templates** for common code patterns (`hyplugin`, `hyevent`, `hycmd`, `hyecs`)
- **Integrated build and run** with hot reload support

[Learn more about the IntelliJ Plugin](/docs/modding/plugins/intellij-plugin)
:::

## Prerequisites

Before starting, ensure you have:

- **Java Development Kit (JDK) 25** - [Download from Adoptium](https://adoptium.net/) (required for full API access)
- **IDE** - IntelliJ IDEA (recommended) or Eclipse
- **Gradle 9.2.0** - Usually bundled with IDE
- **Git** - For version control (optional but recommended)

> "Plugin Developers need Java 25 and IntelliJ IDEA for full API access."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

:::tip IDE Recommendation
IntelliJ IDEA Community Edition is free and provides excellent Java/Gradle support with features like:

- Smart code completion
- Built-in Gradle integration
- Debugger support
- Plugin development tools

Install the [Hytale IntelliJ Plugin](/docs/modding/plugins/intellij-plugin) to unlock Hytale-specific features like project wizards and live templates.
:::

## Quick Start

### Option 1: Using the Hytale IntelliJ Plugin (Recommended)

The fastest way to create a new plugin project:

1. **File -> New -> Project**
2. Select **Hytale Plugin** from the generators list
3. Fill in the wizard:
   - Plugin name and ID
   - Package name (e.g., `com.example.myplugin`)
   - Select a template (Basic, Events, Commands, or Full)
4. Click **Create**

The plugin will automatically:
- Create the project structure with all necessary files
- Generate `build.gradle` configured for Java 25
- Create `manifest.json` with your plugin details
- Download the Hytale server JAR to `libs/`
- Set up a run configuration for testing

### Option 2: Manual Setup with IntelliJ IDEA

1. **File -> New -> Project**
2. Select **Gradle** with **Java**
3. Set **JDK** to 25
4. Name your project (e.g., `my-hytale-plugin`)
5. Click **Create**

### Option 3: Using Command Line

```bash
# Create project directory
mkdir my-hytale-plugin
cd my-hytale-plugin

# Initialize Gradle wrapper
gradle init --type java-library --dsl groovy

# Or with Kotlin DSL
gradle init --type java-library --dsl kotlin
```

## Project Structure

A well-organized plugin project looks like this:

```filetree
my-hytale-plugin/
├── libs/
│   └── HytaleServer.jar      # Server JAR for compilation
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── myplugin/
│   │   │               ├── MyPlugin.java
│   │   │               ├── commands/
│   │   │               │   └── MyCommand.java
│   │   │               ├── listeners/
│   │   │               │   └── PlayerListener.java
│   │   │               └── util/
│   │   │                   └── ConfigManager.java
│   │   └── resources/
│   │       ├── manifest.json
│   │       └── config.yml
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── myplugin/
│                       └── MyPluginTest.java
├── build.gradle
├── settings.gradle
├── gradle.properties
└── README.md
```

## Setting Up the Server JAR

Before you can compile your plugin, you need to add the Hytale server JAR to your project.

### With IntelliJ Plugin (Automatic)

The Hytale IntelliJ Plugin handles this automatically when you create a new project. You can also download it anytime via **Tools -> Hytale -> Download Server JAR**.

### Manual Setup

1. **Download the server JAR** from [cdn.hytale.com/HytaleServer.jar](https://cdn.hytale.com/HytaleServer.jar)
2. **Create a `libs` folder** in your project root
3. **Copy `HytaleServer.jar`** into the `libs` folder

```bash
mkdir libs
curl -o libs/HytaleServer.jar https://cdn.hytale.com/HytaleServer.jar
```

The server JAR is used as a `compileOnly` dependency - it provides the API classes for compilation but is not bundled into your plugin (the server already has these classes at runtime).

For a complete example project, see [Build-9/Hytale-Example-Project](https://github.com/Build-9/Hytale-Example-Project) on GitHub.

## Gradle Configuration

### build.gradle (Groovy DSL)

```groovy
plugins {
    id 'java'
    id 'com.github.johnrengelman.shadow' version '8.1.1'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    // Hytale Server JAR - add to classpath from your local installation
    // Download HytaleServer.jar from https://cdn.hytale.com/HytaleServer.jar
    // Place it in a 'libs' folder in your project root
    compileOnly files('libs/HytaleServer.jar')

    // Optional: Common utilities
    implementation 'com.google.guava:guava:32.1.3-jre'
    implementation 'com.google.code.gson:gson:2.10.1'

    // Testing
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

tasks.named('test') {
    useJUnitPlatform()
}

// Shadow JAR for bundling dependencies
shadowJar {
    archiveClassifier.set('')

    // Relocate dependencies to avoid conflicts
    relocate 'com.google.gson', 'com.example.myplugin.libs.gson'
}

// Build produces shadow JAR by default
tasks.named('build') {
    dependsOn shadowJar
}

// Process resources - replace version placeholder
processResources {
    filesMatching('manifest.json') {
        expand(
            'version': project.version,
            'name': project.name
        )
    }
}
```

### build.gradle.kts (Kotlin DSL)

```kotlin
plugins {
    java
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // Hytale Server JAR - add to classpath from your local installation
    compileOnly(files("libs/HytaleServer.jar"))

    implementation("com.google.guava:guava:32.1.3-jre")
    implementation("com.google.code.gson:gson:2.10.1")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

tasks.test {
    useJUnitPlatform()
}

tasks.shadowJar {
    archiveClassifier.set("")

    relocate("com.google.gson", "com.example.myplugin.libs.gson")
}

tasks.build {
    dependsOn(tasks.shadowJar)
}

tasks.processResources {
    filesMatching("manifest.json") {
        expand(
            "version" to project.version,
            "name" to project.name
        )
    }
}
```

### settings.gradle

```groovy
rootProject.name = 'my-hytale-plugin'
```

### gradle.properties

```properties
# Project settings
org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true
org.gradle.caching=true

# Dependency versions (optional, for easier management)
guavaVersion=32.1.3-jre
```

## Plugin Manifest

The `manifest.json` file identifies your plugin to the server.

:::tip IntelliJ Plugin Feature
The Hytale IntelliJ Plugin provides **manifest.json validation** and **autocompletion**. It will warn you about missing required fields and suggest valid values.
:::

```json
{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "${version}",
  "description": "A description of what this plugin does",
  "authors": ["YourName"],
  "main": "com.example.myplugin.MyPlugin",
  "api_version": "1.0",
  "dependencies": {
    "required": [],
    "optional": ["another-plugin"]
  },
  "load_order": "POSTWORLD",
  "permissions": {
    "myplugin.admin": {
      "description": "Full admin access",
      "default": "op"
    },
    "myplugin.use": {
      "description": "Basic usage permission",
      "default": true
    }
  }
}
```

### Manifest Properties

| Property | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Unique plugin identifier (lowercase, no spaces) |
| `name` | Yes | Display name for the plugin |
| `version` | Yes | Semantic version (e.g., "1.0.0") |
| `main` | Yes | Fully qualified main class name |
| `api_version` | Yes | Minimum Hytale API version required |
| `description` | No | Brief description |
| `authors` | No | List of author names |
| `dependencies` | No | Plugin dependencies |
| `load_order` | No | When to load (STARTUP, POSTWORLD) |
| `permissions` | No | Permission nodes your plugin uses |

## Main Plugin Class

Create your entry point class. Plugins must extend `JavaPlugin` and have a constructor that takes `JavaPluginInit`.

### With IntelliJ Plugin

Type `hyplugin` and press **Tab** to expand the live template, then fill in your class name.

### Manual Implementation

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import com.example.myplugin.commands.MyCommand;
import com.example.myplugin.listeners.PlayerListener;

import javax.annotation.Nonnull;

public class MyPlugin extends JavaPlugin {

    private static MyPlugin instance;

    // Required constructor - must take JavaPluginInit parameter
    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
        instance = this;
    }

    @Override
    protected void setup() {
        // Called during plugin initialization
        // Register commands, events, assets, and components here
        getLogger().info("MyPlugin is setting up...");

        // Register event listeners
        // Tip: Use 'hyevent' template in IntelliJ to create event handlers quickly
        getEventRegistry().register(
            com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent.class,
            event -> {
                getLogger().info("Player connected: " + event.getPlayer().getName());
            }
        );

        // Register commands
        // Tip: Use 'hycmd' template in IntelliJ to create commands quickly
        getCommandRegistry().registerCommand(new MyCommand(this));

        getLogger().info("MyPlugin setup complete!");
    }

    @Override
    protected void start() {
        // Called after all plugins are set up
        // Perform any start-up logic that depends on other plugins
        getLogger().info("MyPlugin has started!");
    }

    @Override
    protected void shutdown() {
        // Called when plugin is shutting down
        // Perform cleanup before registries are cleaned up
        getLogger().info("MyPlugin is shutting down...");
    }

    public static MyPlugin getInstance() {
        return instance;
    }
}
```

### Available Live Templates

The Hytale IntelliJ Plugin provides several live templates to speed up development:

| Template | Description |
|----------|-------------|
| `hyplugin` | Generate a complete plugin main class |
| `hyevent` | Create an event listener registration |
| `hycmd` | Create a command class |
| `hyecs` | Create an ECS system class |
| `hycomp` | Create an ECS component class |

## Building Your Plugin

### Command Line

```bash
# Build the plugin JAR
./gradlew build

# Clean and rebuild
./gradlew clean build

# Run tests
./gradlew test

# Generate shadow JAR with dependencies
./gradlew shadowJar
```

### IntelliJ IDEA

1. Open **Gradle** tool window (View -> Tool Windows -> Gradle)
2. Navigate to **Tasks -> build**
3. Double-click **build** or **shadowJar**

### Output Location

Your built plugin will be at:

```
build/libs/my-hytale-plugin-1.0.0.jar
```

## Installing Your Plugin

Copy the JAR to your server:

```filetree
hytale-server/
└── plugins/
    └── my-hytale-plugin-1.0.0.jar
```

Restart the server to load your plugin.

## Development Workflow

### With IntelliJ Plugin (Recommended)

The Hytale IntelliJ Plugin provides an integrated development workflow with hot reload:

1. **Run your server** using the pre-configured run configuration (green play button)
2. **Make changes** to your plugin code
3. **Press Ctrl+F9** (Build Project) to rebuild
4. The plugin automatically deploys to the server's plugins folder
5. **Use `/reload`** in the server console to reload plugins without restart

You can also:
- Use **Tools -> Hytale -> Build and Deploy** for one-click deployment
- View build output in the Hytale tool window
- See real-time server logs in the integrated console

### Manual Workflow

For faster iteration during development:

```bash
# Build and copy to server in one command
./gradlew build && cp build/libs/*.jar ../hytale-server/plugins/
```

Or create a Gradle task:

```groovy
task deploy(type: Copy, dependsOn: shadowJar) {
    from shadowJar.archiveFile
    into '../hytale-server/plugins'
}
```

Then run: `./gradlew deploy`

### Debugging

#### With IntelliJ Plugin

1. Use the **Hytale Server (Debug)** run configuration
2. Set breakpoints in your code
3. Click the debug button (bug icon)
4. The server starts with debugging enabled and IntelliJ attaches automatically

#### Manual Debugging

1. Start server with debug flags:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 -jar hytale-server.jar
```

2. In IntelliJ: **Run -> Attach to Process** or create a **Remote JVM Debug** configuration

### Logging

Use the plugin logger for debug output:

```java
getLogger().info("Information message");
getLogger().warning("Warning message");
getLogger().severe("Error message");
getLogger().fine("Debug message"); // Only shown with verbose logging
```

## Best Practices

### Code Organization

- **One class per file** - Keep classes focused
- **Package by feature** - Group related classes together
- **Use interfaces** - For better testability
- **Dependency injection** - Pass dependencies through constructors

### Configuration

Always provide defaults and validate:

```java
public void loadConfig() {
    // Provide defaults
    int maxPlayers = getConfig().getInt("max-players", 100);

    // Validate
    if (maxPlayers < 1 || maxPlayers > 1000) {
        getLogger().warning("Invalid max-players, using default");
        maxPlayers = 100;
    }
}
```

### Error Handling

```java
try {
    riskyOperation();
} catch (Exception e) {
    getLogger().severe("Operation failed: " + e.getMessage());
    e.printStackTrace();
    // Graceful degradation
}
```

## Next Steps

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'IntelliJ Plugin',
    href: '/docs/modding/plugins/intellij-plugin',
    description: 'Set up the Hytale IntelliJ Plugin for enhanced development'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Plugin Lifecycle',
    href: '/docs/modding/plugins/plugin-lifecycle',
    description: 'Understand the plugin loading process'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Events System',
    href: '/docs/modding/plugins/events',
    description: 'Learn to listen and handle game events'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Commands',
    href: '/docs/modding/plugins/commands',
    description: 'Create custom commands for your plugin'
  }} />
</div>
