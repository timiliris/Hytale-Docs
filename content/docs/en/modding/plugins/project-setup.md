---
id: project-setup
title: Plugin Project Setup
sidebar_label: Project Setup
sidebar_position: 2
description: Complete guide to setting up a Hytale Java plugin project with Gradle
---

# Plugin Project Setup

Learn how to create a properly structured Hytale plugin project using Gradle and Java 25.

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
:::

## Quick Start

### Using IntelliJ IDEA

1. **File → New → Project**
2. Select **Gradle** with **Java**
3. Set **JDK** to 21
4. Name your project (e.g., `my-hytale-plugin`)
5. Click **Create**

### Using Command Line

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

Before you can compile your plugin, you need to add the Hytale server JAR to your project:

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
        languageVersion = JavaLanguageVersion.of(21)
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
        languageVersion.set(JavaLanguageVersion.of(21))
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

The `manifest.json` file identifies your plugin to the server:

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

Create your entry point class:

```java
package com.example.myplugin;

import com.hytale.api.plugin.Plugin;
import com.hytale.api.plugin.PluginInfo;
import com.hytale.api.event.EventManager;
import com.hytale.api.command.CommandManager;
import com.example.myplugin.commands.MyCommand;
import com.example.myplugin.listeners.PlayerListener;

@PluginInfo(
    id = "my-plugin",
    name = "My Awesome Plugin",
    version = "1.0.0"
)
public class MyPlugin extends Plugin {

    private static MyPlugin instance;
    private ConfigManager configManager;

    @Override
    public void onLoad() {
        // Called when plugin JAR is loaded
        instance = this;
        getLogger().info("MyPlugin is loading...");
    }

    @Override
    public void onEnable() {
        // Called when plugin is enabled
        getLogger().info("MyPlugin is enabling...");

        // Load configuration
        saveDefaultConfig();
        configManager = new ConfigManager(this);

        // Register event listeners
        EventManager events = getServer().getEventManager();
        events.registerListener(new PlayerListener(this));

        // Register commands
        CommandManager commands = getServer().getCommandManager();
        commands.registerCommand(new MyCommand(this));

        getLogger().info("MyPlugin has been enabled!");
    }

    @Override
    public void onDisable() {
        // Called when plugin is disabled
        getLogger().info("MyPlugin is disabling...");

        // Cleanup resources
        configManager.save();

        getLogger().info("MyPlugin has been disabled!");
    }

    public static MyPlugin getInstance() {
        return instance;
    }

    public ConfigManager getConfigManager() {
        return configManager;
    }
}
```

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

1. Open **Gradle** tool window (View → Tool Windows → Gradle)
2. Navigate to **Tasks → build**
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

### Hot Reloading (Development)

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

1. Start server with debug flags:
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 -jar hytale-server.jar
```

2. In IntelliJ: **Run → Attach to Process** or create a **Remote JVM Debug** configuration

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
