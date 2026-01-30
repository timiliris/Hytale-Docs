---
id: intellij-plugin
title: IntelliJ IDEA Plugin
sidebar_label: IntelliJ Plugin
sidebar_position: 2
description: Official HytaleDocs plugin for IntelliJ IDEA - autocomplete, templates and integrated tools for Hytale plugin development
---

# IntelliJ IDEA Plugin for Hytale

The official HytaleDocs plugin for IntelliJ IDEA provides a complete development environment for creating Hytale server plugins. It includes project templates, live templates, manifest validation, and integrated server management.

<div className="flex gap-3 my-6">
  <a href="https://github.com/timiliris/hytaledDocs-intelliJ-plugin/releases/latest" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
    Download Latest Release
  </a>
  <a href="https://github.com/timiliris/hytaledDocs-intelliJ-plugin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors">
    View on GitHub
  </a>
</div>

## Features

### Project Wizard

Create new Hytale plugin projects with a guided wizard that sets up the correct structure automatically.

- **Complete project structure** - Gradle configuration, source folders, resources
- **manifest.json generation** - Pre-configured with your plugin details
- **Main class template** - Ready-to-use plugin entry point
- **Java 25 configuration** - Correct JDK settings out of the box

### Live Templates

Speed up your development with code snippets for common Hytale patterns:

| Shortcut | Description |
|----------|-------------|
| `hyevent` | Create an event listener method |
| `hycmd` | Create a command handler |
| `hyecs` | Create an ECS system |
| `hycomponent` | Create an ECS component |
| `hyui` | Create a Custom UI page |

**Example - Event Listener:**
```java
// Type "hyevent" + Tab
@Subscribe
public void onPlayerConnect(PlayerConnectEvent event) {
    Player player = event.player();
    // Your code here
}
```

### Manifest Validation

Real-time validation and autocompletion for `manifest.json` files:

- **Schema validation** - Catch errors before running
- **Autocompletion** - All fields with descriptions
- **Quick fixes** - Automatic corrections for common issues
- **Documentation links** - Direct links to HytaleDocs

### Run Configurations

Launch and debug Hytale servers directly from IntelliJ:

- **One-click server start** - No terminal needed
- **Console integration** - Server logs in IDE
- **OAuth authentication** - Automatic browser flow
- **Auto-persistence** - Credentials saved securely

### Quick Actions Tool Window

Access common actions from a dedicated tool window:

- Open HytaleDocs documentation
- Create new events, commands, systems
- Server management shortcuts
- Quick links to useful resources

## Installation

### Method 1: From ZIP (Recommended)

1. Download the latest release from [GitHub Releases](https://github.com/timiliris/hytaledDocs-intelliJ-plugin/releases/latest)
2. Open IntelliJ IDEA
3. Go to **Settings** → **Plugins** → **⚙️** → **Install Plugin from Disk...**
4. Select the downloaded `.zip` file
5. Restart IntelliJ IDEA

### Method 2: Build from Source

```bash
git clone https://github.com/timiliris/hytaledDocs-intelliJ-plugin.git
cd hytaledDocs-intelliJ-plugin
./gradlew buildPlugin
```

The plugin ZIP will be in `build/distributions/`.

## Requirements

- **IntelliJ IDEA** 2024.3 or later (Community or Ultimate)
- **Java 25** (Temurin recommended)
- **Gradle 9.x** (bundled with projects)

## Usage

### Creating a New Plugin Project

1. Go to **File** → **New** → **Project...**
2. Select **Hytale Plugin** from the generators list
3. Fill in your plugin details:
   - Plugin name
   - Package name
   - Author
   - Description
4. Click **Create**

The wizard will generate:
```
my-plugin/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── src/
    └── main/
        ├── java/
        │   └── com/example/myplugin/
        │       └── MyPlugin.java
        └── resources/
            └── manifest.json
```

### Running the Server

1. Open the **Run Configurations** dropdown
2. Select **Hytale Server**
3. Click **Run** or **Debug**

The server will start with your plugin loaded. On first run, a browser window will open for OAuth authentication.

### Using Live Templates

1. In a Java file, type the template shortcut (e.g., `hyevent`)
2. Press **Tab** to expand
3. Fill in the template variables
4. Press **Tab** to move between fields

## Changelog

### v1.2.0 - Auto-Persistence Authentication
- **Auto-Persistence**: After OAuth authentication, automatically runs `/auth persistence Encrypted`
- **Smarter Auth Detection**: Only prompts when seeing the specific server warning
- **Fixed**: Log format parsing for authentication detection

### v1.1.0 - IntelliJ 2025.3 Support
- Added support for IntelliJ IDEA 2025.3
- Improved compatibility with newer IDE versions

### v1.0.0 - Initial Release
- Project wizard for new Hytale plugins
- Live templates (hyevent, hycmd, hyecs, etc.)
- manifest.json validation and autocompletion
- Run configuration for Hytale servers
- Quick actions tool window

## Troubleshooting

### Plugin not visible in New Project wizard

Make sure you're using IntelliJ IDEA 2024.3 or later. The plugin uses APIs not available in older versions.

### Server authentication fails

1. Check that your browser can open the OAuth URL
2. Ensure no firewall is blocking the callback
3. Try running `/auth persistence Encrypted` manually in the console

### Live templates not working

1. Go to **Settings** → **Editor** → **Live Templates**
2. Check that the "Hytale" group is enabled
3. Verify the template shortcuts aren't conflicting with other plugins

## Contributing

Contributions are welcome! Please open issues or pull requests on the [GitHub repository](https://github.com/timiliris/hytaledDocs-intelliJ-plugin).

## Related Resources

- [Plugin Development Guide](/docs/modding/plugins/project-setup)
- [Events Overview](/docs/modding/plugins/events/overview)
- [Command System](/docs/api/server-internals/commands)
- [ECS System](/docs/api/server-internals/ecs)
