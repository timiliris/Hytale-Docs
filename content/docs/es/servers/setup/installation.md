---
id: installation
title: Server Installation
sidebar_label: Installation
sidebar_position: 2
---

# Server Installation

Complete guide to install your Hytale dedicated server.

## Download Server Files

The server requires two files to run:
- `HytaleServer.jar` - The main server executable
- `Assets.zip` - Game assets (textures, models, sounds)

### Option A: CDN Download (Recommended)

Download directly from the official CDN:

```bash
# Download server JAR
curl -L -o HytaleServer.jar https://cdn.hytale.com/HytaleServer.jar

# Download assets
curl -L -o Assets.zip https://cdn.hytale.com/Assets.zip
```

### Option B: From Launcher

Copy from your Hytale launcher installation:

| System | Path |
|--------|------|
| **Windows** | `%appdata%\Hytale\install\release\package\game\latest` |
| **Linux** | `$XDG_DATA_HOME/Hytale/install/release/package/game/latest` |
| **macOS** | `~/Application Support/Hytale/install/release/package/game/latest` |

## Install Java 25

Hytale requires **Java 25** (OpenJDK Temurin recommended).

### Ubuntu/Debian

```bash
# Add Adoptium repository
sudo apt update
sudo apt install wget apt-transport-https gpg
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg
echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list

# Install Java 25
sudo apt update
sudo apt install temurin-25-jdk

# Verify
java -version
# Should show: openjdk 25.0.x
```

### Windows

Download and install from [Adoptium](https://adoptium.net/temurin/releases/?version=25).

:::tip OpenJDK vs Oracle
We recommend **Eclipse Temurin** (OpenJDK) over Oracle JDK. It's free, performs identically, and includes all GC options (including Shenandoah which Oracle JDK lacks).
:::

## Quick Start

```bash
# Create directory
mkdir hytale-server
cd hytale-server

# Download server files
curl -L -o HytaleServer.jar https://cdn.hytale.com/HytaleServer.jar
curl -L -o Assets.zip https://cdn.hytale.com/Assets.zip

# Start server (minimal)
java -Xms4G -Xmx4G -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520
```

## Server Command Line Arguments

| Argument | Description | Example |
|----------|-------------|---------|
| `--assets <path>` | **Required.** Path to Assets.zip | `--assets Assets.zip` |
| `-b <address:port>` | Bind address and port | `-b 0.0.0.0:5520` |
| `--auth-mode <mode>` | Authentication mode | `--auth-mode authenticated` |
| `--backup` | Enable automatic backups | `--backup` |
| `--backup-dir <path>` | Backup directory | `--backup-dir backups` |
| `--backup-frequency <min>` | Backup interval in minutes | `--backup-frequency 30` |
| `--allow-op` | Enable operator commands | `--allow-op` |
| `--accept-early-plugins` | Allow experimental plugins | `--accept-early-plugins` |

### Authentication Modes

| Mode | Description |
|------|-------------|
| `authenticated` | Players must have a valid Hytale account (default) |
| `offline` | Allows players without Hytale accounts (LAN play, testing) |

## Server Directory Structure

After first run, your directory will look like:

```
hytale-server/
├── HytaleServer.jar      # Main executable
├── Assets.zip            # Game assets (required)
├── server.log            # Log file
├── config/
│   ├── server.properties # Main configuration
│   ├── networking.json   # Network settings (QUIC)
│   └── gameplay.json     # Gameplay settings
├── worlds/
│   └── Orbis/            # Default world
│       ├── region/       # Chunk data
│       ├── playerdata/   # Player data
│       └── level.dat     # World metadata
├── plugins/              # Server plugins
├── mods/                 # Server mods
├── logs/                 # Log files
└── backups/              # Automatic backups (if enabled)
```

## Recommended Start Scripts

### Linux (start.sh)

```bash
#!/bin/bash

# Memory configuration
MEMORY_MIN="8G"
MEMORY_MAX="8G"

# JVM arguments for Java 25 (G1GC optimized - recommended for 4-12GB)
java -Xms${MEMORY_MIN} -Xmx${MEMORY_MAX} \
    -XX:+UseG1GC \
    -XX:+ParallelRefProcEnabled \
    -XX:MaxGCPauseMillis=200 \
    -XX:+DisableExplicitGC \
    -XX:+AlwaysPreTouch \
    -XX:G1NewSizePercent=30 \
    -XX:G1MaxNewSizePercent=40 \
    -XX:G1HeapRegionSize=8M \
    -XX:G1ReservePercent=20 \
    -XX:InitiatingHeapOccupancyPercent=15 \
    -XX:SurvivorRatio=32 \
    -XX:+PerfDisableSharedMem \
    -XX:MaxTenuringThreshold=1 \
    -XX:+UseCompactObjectHeaders \
    -Djava.net.preferIPv4Stack=true \
    -Dfile.encoding=UTF-8 \
    -jar HytaleServer.jar \
    --assets Assets.zip \
    -b 0.0.0.0:5520 \
    --auth-mode authenticated \
    --allow-op
```

### Windows (start.bat)

```batch
@echo off
java -Xms8G -Xmx8G ^
    -XX:+UseG1GC ^
    -XX:+ParallelRefProcEnabled ^
    -XX:MaxGCPauseMillis=200 ^
    -XX:+DisableExplicitGC ^
    -XX:+AlwaysPreTouch ^
    -XX:+UseCompactObjectHeaders ^
    -Djava.net.preferIPv4Stack=true ^
    -jar HytaleServer.jar ^
    --assets Assets.zip ^
    -b 0.0.0.0:5520 ^
    --auth-mode authenticated ^
    --allow-op
pause
```

## Firewall Configuration

Hytale uses **UDP port 5520** (QUIC protocol). Make sure to open UDP, not TCP!

### Linux (ufw)

```bash
sudo ufw allow 5520/udp
sudo ufw reload
```

### Linux (iptables)

```bash
sudo iptables -A INPUT -p udp --dport 5520 -j ACCEPT
```

### Windows PowerShell

```powershell
New-NetFirewallRule -DisplayName "Hytale Server" -Direction Inbound -Protocol UDP -LocalPort 5520 -Action Allow
```

## First Run

On first start, the server will:

1. Validate Assets.zip
2. Generate configuration files in `config/`
3. Create the default world (Orbis)
4. Start listening on port 5520/UDP (QUIC)

:::tip Hot Reload
Hytale supports **hot-reloading** - when you edit scripts or config files, they reload automatically without restarting the server!
:::

## Troubleshooting

### "Assets.zip not found"
Make sure Assets.zip is in the same directory as HytaleServer.jar, or specify the path with `--assets /path/to/Assets.zip`.

### "Port already in use"
Another application is using port 5520. Either stop that application or use a different port with `-b 0.0.0.0:5521`.

### "Java version not supported"
Hytale requires Java 25. Check your version with `java -version` and install Temurin 25 if needed.

## Next Steps

- [Configure your server](/docs/en/servers/setup/configuration) - JVM presets and performance tuning
- [Set up Docker hosting](/docs/en/servers/hosting/docker)
- [Configure permissions](/docs/en/servers/administration/permissions)
