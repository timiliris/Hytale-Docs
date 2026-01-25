---
id: overview
title: Server Administration Overview
sidebar_label: Overview
sidebar_position: 1
description: Guide to setting up and managing Hytale servers
---

# Server Administration Overview

This section covers everything you need to know about hosting and managing Hytale servers. Running your own servers is supported from Early Access day one ([Source](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)).

:::info Official Documentation
This guide is based on the [official Hytale Server Manual](https://support.hytale.com/hc/en-us/articles/45326769420827-Hytale-Server-Manual).
:::

## Architecture

Hytale uses a **server-first architecture** where all game content lives on the server:

- Even single-player runs through a local server
- Clients connect without installing mods
- Server streams all content automatically
- **All mods execute server-side** - no client-side mod installation needed
- **Native routing between servers** - no need for BungeeCord or similar proxies

> "Hypixel Studios chose Java for Hytale servers because their backend team is very comfortable writing high-performance Java, which has let them heavily optimize server code."
> — [Server Technology Overview](https://hytale.com/news/2019/1/an-overview-of-hytales-server-technology)

### Technical Details

| Specification | Value |
|--------------|-------|
| Server Language | Java |
| Client Language | C# |
| Protocol | **QUIC** (UDP-based) |
| Default Port | **UDP 5520** |
| Tick Rate | 30 TPS (default) |
| Java Version | **Java 25** required (Adoptium recommended) |
| Architectures | **x64 and arm64** supported |
| Gradle | 9.2.0 (for plugin development) |

:::info Network Protocol
Hytale uses the QUIC protocol over UDP port 5520. No TCP port forwarding is required.
:::

### Source Code Availability

The server is **not obfuscated**, allowing you to decompile it to understand internal systems. Hypixel Studios plans to release the full server source code **1-2 months after launch** ([Source](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)).

## System Requirements

### Performance Considerations

**View distance** is the biggest factor in both client and server performance. Doubling view distance (e.g., 192 to 384 blocks) quadruples the amount of data the server must handle.

- **Maximum recommended view distance**: 12 chunks (384 blocks)
- This is equivalent to 24 chunks in Minecraft

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| CPU | High single-thread performance (4.0GHz+) |
| RAM | **4 GB minimum** |
| Storage | 50 GB NVMe SSD |
| Java | **Java 25** (Adoptium recommended) |
| Network | UDP port 5520 open |

### Recommended by Player Count

| Players | RAM | CPU | Notes |
|---------|-----|-----|-------|
| 1-10 | 4 GB | 4.0GHz+ single-thread | Minimum specs sufficient |
| 25-50 | 8-12 GB | High single-thread frequency | Prioritize clock speed over cores |
| 50+ | 16 GB+ | High-performance | Adjust based on monitoring |

:::tip CPU Performance
Hytale servers benefit more from **high single-thread CPU performance** than from many cores. Prioritize clock speed over core count when selecting hardware.
:::

:::tip Storage Performance
World loading and generation depend heavily on disk speed. NVMe SSDs provide the best results and help prevent stutters when players explore new areas. Avoid traditional hard drives.
:::

## Quick Start

1. **Download** the server files using the [Hytale Downloader CLI](https://downloader.hytale.com/hytale-downloader.zip) or copy from your launcher installation
2. **Authenticate** your server with `/auth login device`
3. **Configure** your `config.json` file
4. **Open port** UDP 5520 (QUIC protocol)
5. **Start** the server

```bash
java -Xms4G -Xmx8G -XX:AOTCache=HytaleServer.aot -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520
```

[Detailed Installation Guide →](/docs/servers/setup/installation)

## Server Configuration

### Core Settings

Configuration is stored in `config.json` at the server root:

```json
{
  "Version": 1,
  "ServerName": "My Hytale Server",
  "MOTD": "",
  "Password": "",
  "MaxPlayers": 100,
  "MaxViewRadius": 12,
  "Defaults": {
    "World": "Orbis",
    "GameMode": "Adventure"
  }
}
```

[Full Configuration Reference →](/docs/servers/setup/configuration)

## Administration

### Key Tasks

- [**Commands**](/docs/servers/administration/commands) - Console and in-game commands
- [**Permissions**](/docs/servers/administration/permissions) - Player permission system
- [**Whitelist**](/docs/servers/administration/whitelist) - Access control

### Security Considerations

- Configure firewall rules (UDP 5520)
- Use whitelist for private servers
- Regular backups
- DDoS protection for public servers

## Modding & Plugins

Servers can run:

- **Java Plugins** (`.jar` files in `/plugins/`)
- **Data Packs** (JSON content in `/mods/`)
- **Art Assets** (models, textures, sounds)

```
/hytale-server/
├── HytaleServer.jar      # Main executable
├── HytaleServer.aot      # AOT cache (faster startup)
├── Assets.zip            # Game assets (required)
├── config.json           # Server configuration
├── permissions.json      # Permission configuration
├── whitelist.json        # Whitelisted players
├── bans.json             # Banned players
├── mods/                 # Mods (.zip or .jar)
├── logs/                 # Server logs
└── universe/             # World and player data
    └── worlds/
        └── Orbis/        # Default world
```

[Plugin Development Guide →](/docs/modding/plugins/overview)

## Hosting Options

| Option | Pros | Cons |
|--------|------|------|
| **Self-Hosted** | Full control, cost-effective | Requires technical knowledge |
| **VPS** | Good balance of control/ease | Monthly cost |
| **Game Hosting** | Easy setup, managed | Less control, higher cost |

[Hosting Guide →](/docs/servers/hosting/self-hosting)

## Deployment with Docker

```yaml
version: '3.8'
services:
  hytale:
    image: hytale-server:latest
    ports:
      - "5520:5520/udp"
    volumes:
      - ./data:/server
    environment:
      - JAVA_OPTS=-Xms4G -Xmx8G
```

[Docker Deployment Guide →](/docs/servers/hosting/docker)

## Multiserver Architecture

Hytale supports native mechanisms for routing players between servers. **No reverse proxy like BungeeCord is required.**

### Player Referral

Transfers a connected player to another server. The server sends a referral packet containing the target host, port, and an optional 4KB payload.

```java
PlayerRef.referToServer(@Nonnull final String host, final int port, @Nullable byte[] data)
```

:::warning Security
The payload is transmitted through the client and can be tampered with. **Sign payloads cryptographically** (e.g., HMAC with a shared secret) so the receiving server can verify authenticity.
:::

**Use cases:** Transferring players between game servers, passing session context, gating access behind matchmaking.

### Connection Redirect

During connection handshake, a server can reject the player and redirect them to a different server. The client automatically connects to the redirected address.

```java
PlayerSetupConnectEvent.referToServer(@Nonnull final String host, final int port, @Nullable byte[] data)
```

**Use cases:** Load balancing, regional server routing, enforcing lobby-first connections.

### Disconnect Fallback

When a player is unexpectedly disconnected (server crash, network interruption), the client automatically reconnects to a pre-configured fallback server instead of returning to the main menu.

**Use cases:** Returning players to a lobby after game server crash, maintaining engagement during restarts.

### Building a Proxy

Build custom proxy servers using Netty QUIC. Hytale uses QUIC exclusively for client-server communication. Packet definitions and protocol structure are available in `HytaleServer.jar`:

```
com.hypixel.hytale.protocol.packets
```

## Future Additions

Hypixel Studios has announced several upcoming features:

| Feature | Description |
|---------|-------------|
| **Server Discovery** | Browse and find servers from the main menu. Requires adherence to operator guidelines and self-rating. |
| **Parties** | Group up with friends and stay together across server transfers |
| **Integrated Payments** | Built-in payment gateway for accepting payments securely |
| **First-Party API** | UUID lookup, player profiles, server telemetry, and more |
| **SRV Records** | Connect using domain names without specifying ports (under evaluation) |

## EULA & Monetization

### Allowed

- Cosmetic purchases
- Donations
- Rank perks (non-gameplay)

### Prohibited

- Pay-to-win mechanics
- Selling gameplay advantages
- Distributing the client

:::warning
Violating the EULA may result in server blacklisting. Always review official guidelines.
:::

## Getting Started

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'Requirements',
    href: '/docs/servers/setup/requirements',
    description: 'Hardware and software requirements'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Installation',
    href: '/docs/servers/setup/installation',
    description: 'Step-by-step setup guide'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Configuration',
    href: '/docs/servers/setup/configuration',
    description: 'Configure your server'
  }} />
</div>
