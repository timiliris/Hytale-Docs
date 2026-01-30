---
id: environment-setup
title: Environment Setup
sidebar_label: Environment Setup
sidebar_position: 3
description: Configure your development environment for Hytale
---

# Environment Setup

This guide walks you through setting up your development environment.

## Quick Setup

### 1. Install Blockbench

```bash
# Download from blockbench.net or use package manager
winget install JannisX11.Blockbench
```

### 2. Install Hytale Plugin

1. Open Blockbench
2. Go to **File > Plugins**
3. Search for "Hytale"
4. Click **Install**

### 3. Set Up a Local Server (Optional)

For testing, run a local Hytale server:

```bash
# Create server directory
mkdir hytale-dev-server
cd hytale-dev-server

# Download and start server
java -Xms2G -Xmx4G -jar hytale-server.jar
```

## IDE Setup for Plugin Development

### IntelliJ IDEA

1. Download [IntelliJ IDEA](https://www.jetbrains.com/idea/)
2. Install Java 25+ SDK
3. Create a new Gradle project
4. Add Hytale API dependency (coming soon)

### VS Code

For JSON editing and general development:

```bash
# Install recommended extensions
code --install-extension redhat.java
code --install-extension vscjava.vscode-java-pack
```

## Project Structure

Recommended folder structure for mods:

```
my-hytale-mod/
├── src/
│   └── main/
│       ├── java/           # Plugin code
│       └── resources/      # Assets
├── packs/
│   ├── blocks/            # Block definitions
│   ├── items/             # Item definitions
│   └── npcs/              # NPC definitions
├── models/                # Blockbench models
└── textures/              # PNG textures
```

## Next Steps

Your environment is ready! Continue to:

- [Your First Mod](/docs/getting-started/first-mod)
