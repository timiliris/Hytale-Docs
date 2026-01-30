---
id: configuration
title: Server Configuration
sidebar_label: Configuration
sidebar_position: 3
description: Complete guide to configuring your Hytale server with Java 25 JVM presets
---

# Server Configuration

This guide covers all configuration options for your Hytale server, including optimized JVM presets for Java 25.

## server.properties

The main configuration file for your server.

```properties
# Server identity
server-name=My Hytale Server

# Network settings
port=5520

# Player settings
max-players=50

# World settings
view-distance=12
```

## Network Configuration

### Protocol Details

| Setting | Value |
|---------|-------|
| Protocol | **QUIC** |
| Port | **UDP 5520** |
| TCP Required | No |

:::info QUIC Protocol
Hytale uses the QUIC protocol which runs entirely over UDP. You only need to open UDP port 5520 - no TCP port forwarding is required.
:::

## Key Settings

| Setting | Description | Default | Notes |
|---------|-------------|---------|-------|
| `server-name` | Display name shown in server list | My Server | |
| `port` | Network port (UDP) | 5520 | QUIC protocol |
| `max-players` | Maximum concurrent players | 50 | Adjust based on hardware |
| `view-distance` | Render distance in chunks | 10 | Max recommended: 12 |

## View Distance

View distance significantly impacts server performance.

| View Distance | Blocks | Performance Impact |
|---------------|--------|-------------------|
| 6 chunks | 192 blocks | Low |
| 10 chunks | 320 blocks | Medium |
| **12 chunks** | **384 blocks** | **Recommended max** |

:::warning Performance Impact
Doubling view distance quadruples the data the server must handle. For servers with many players, keep view distance at 12 or below.
:::

## Java 25 JVM Configuration

Java 25 introduces significant performance improvements. Choose the preset that matches your server's RAM.

### JVM Presets Overview

| Preset | Recommended RAM | GC Pauses | Best For |
|--------|-----------------|-----------|----------|
| **ZGC High Performance** | 16GB+ | Sub-millisecond | Large servers, low latency critical |
| **Shenandoah Balanced** | 8-16GB | 1-10ms | Medium servers, good balance |
| **G1GC Optimized** | 4-12GB | 50-200ms | Most servers, Aikar-style flags |
| **G1GC Minimal** | 2-4GB | Variable | Small servers, testing |

### Preset 1: ZGC High Performance (16GB+ RAM)

Best for powerful servers where latency is critical. ZGC provides sub-millisecond GC pauses.

```bash
java -Xms16G -Xmx16G \
    -XX:+UseZGC \
    -XX:+AlwaysPreTouch \
    -XX:+DisableExplicitGC \
    -XX:+PerfDisableSharedMem \
    -XX:+UseDynamicNumberOfGCThreads \
    -XX:+UseCompactObjectHeaders \
    -XX:SoftMaxHeapSize=12G \
    -XX:ReservedCodeCacheSize=512m \
    -XX:+UseCodeCacheFlushing \
    -Djava.net.preferIPv4Stack=true \
    -Dfile.encoding=UTF-8 \
    -jar HytaleServer.jar \
    --assets Assets.zip \
    -b 0.0.0.0:5520
```

:::tip SoftMaxHeapSize
Set `SoftMaxHeapSize` to approximately **80% of your -Xmx** value. For 16GB max heap, use 12G. For 32GB, use 25G.
:::

### Preset 2: Shenandoah Balanced (8-16GB RAM)

Good balance between low latency and throughput. Requires OpenJDK/Temurin (not available in Oracle JDK).

```bash
java -Xms8G -Xmx8G \
    -XX:+UseShenandoahGC \
    -XX:ShenandoahGCMode=generational \
    -XX:+AlwaysPreTouch \
    -XX:+DisableExplicitGC \
    -XX:+PerfDisableSharedMem \
    -XX:+UseCompactObjectHeaders \
    -XX:ReservedCodeCacheSize=256m \
    -Djava.net.preferIPv4Stack=true \
    -Dfile.encoding=UTF-8 \
    -jar HytaleServer.jar \
    --assets Assets.zip \
    -b 0.0.0.0:5520
```

:::info Java 25 Feature
`ShenandoahGCMode=generational` is now production-ready in Java 25 (was experimental in earlier versions).
:::

### Preset 3: G1GC Optimized (4-12GB RAM)

Aikar-style flags optimized for game servers. Works with any JDK. Recommended for most servers.

```bash
java -Xms8G -Xmx8G \
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
    -b 0.0.0.0:5520
```

### Preset 4: G1GC Minimal (2-4GB RAM)

Lightweight configuration for smaller servers or testing environments.

```bash
java -Xms4G -Xmx4G \
    -XX:+UseG1GC \
    -XX:+DisableExplicitGC \
    -XX:MaxGCPauseMillis=200 \
    -Djava.net.preferIPv4Stack=true \
    -Dfile.encoding=UTF-8 \
    -jar HytaleServer.jar \
    --assets Assets.zip \
    -b 0.0.0.0:5520
```

## JVM Arguments Explained

### Garbage Collectors

| Argument | Description |
|----------|-------------|
| `-XX:+UseZGC` | ZGC - Ultra-low latency GC (sub-ms pauses) |
| `-XX:+UseShenandoahGC` | Shenandoah - Low-pause GC (1-10ms pauses) |
| `-XX:+UseG1GC` | G1GC - Balanced GC (default since Java 9) |

### Memory & Performance

| Argument | Description |
|----------|-------------|
| `-Xms` / `-Xmx` | Min/max heap size (set equal to avoid resizing) |
| `-XX:+AlwaysPreTouch` | Pre-allocate memory at startup (reduces runtime latency) |
| `-XX:+DisableExplicitGC` | Ignore `System.gc()` calls (prevents lag spikes) |
| `-XX:+PerfDisableSharedMem` | Disable perf counters shared memory |

### Java 25 Specific

| Argument | Description |
|----------|-------------|
| `-XX:+UseCompactObjectHeaders` | **New in Java 25.** Reduces object header size from 96-128 bits to 64 bits, saving ~4 bytes per object. |
| `-XX:ShenandoahGCMode=generational` | **Stable in Java 25.** Generational mode for Shenandoah (better throughput). |

### G1GC Tuning (Aikar-style)

| Argument | Description |
|----------|-------------|
| `-XX:G1NewSizePercent=30` | Minimum young generation size (30% of heap) |
| `-XX:G1MaxNewSizePercent=40` | Maximum young generation size (40% of heap) |
| `-XX:G1HeapRegionSize=8M` | G1 region size for large heaps |
| `-XX:G1ReservePercent=20` | Reserve 20% of heap for evacuation |
| `-XX:InitiatingHeapOccupancyPercent=15` | Start concurrent GC at 15% heap usage |
| `-XX:MaxGCPauseMillis=200` | Target max GC pause time |

## Memory Allocation Guide

| Players | Min RAM | Recommended | Preset |
|---------|---------|-------------|--------|
| 1-10 | 4GB | 4GB | G1GC Minimal |
| 10-25 | 6GB | 8GB | G1GC Optimized |
| 25-50 | 8GB | 12GB | Shenandoah Balanced |
| 50-100 | 12GB | 16GB | ZGC High Performance |
| 100+ | 16GB | 32GB+ | ZGC High Performance |

:::warning Memory Tips
- Always set `-Xms` equal to `-Xmx` to avoid heap resizing
- Leave 1-2GB for the OS (don't allocate all system RAM)
- More RAM isn't always better - tune view distance first
:::

## Deprecated/Removed JVM Flags

These flags should **NOT** be used with Java 25:

| Flag | Status | Notes |
|------|--------|-------|
| `-XX:+UseConcMarkSweepGC` | **Removed** | Use G1GC, ZGC, or Shenandoah |
| `-XX:+UnlockExperimentalVMOptions` | Not needed for Shenandoah | Was required before Java 25 |
| `-XX:+ZGenerational` | Not needed | Default in Java 23+ |
| `-Xverify:none` / `-noverify` | **Deprecated** | Don't use |
| `-XX:+UseCompressedClassPointers` | **Deprecated** | Will be removed in Java 27 |

## Firewall Configuration

### Linux (UFW)

```bash
sudo ufw allow 5520/udp
```

### Linux (iptables)

```bash
sudo iptables -A INPUT -p udp --dport 5520 -j ACCEPT
```

### Windows Firewall

```powershell
New-NetFirewallRule -DisplayName "Hytale Server" -Direction Inbound -Protocol UDP -LocalPort 5520 -Action Allow
```

## Example Configurations

### Small Private Server (1-10 players)

```properties
server-name=My Private Server
port=5520
max-players=10
view-distance=12
```

```bash
java -Xms4G -Xmx4G -XX:+UseG1GC -XX:+UseCompactObjectHeaders \
    -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520
```

### Medium Community Server (25-50 players)

```properties
server-name=Community Server
port=5520
max-players=50
view-distance=10
```

```bash
java -Xms8G -Xmx8G -XX:+UseShenandoahGC -XX:ShenandoahGCMode=generational \
    -XX:+AlwaysPreTouch -XX:+UseCompactObjectHeaders \
    -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520
```

### Large Public Server (50+ players)

```properties
server-name=Public Server
port=5520
max-players=100
view-distance=8
```

```bash
java -Xms16G -Xmx16G -XX:+UseZGC -XX:SoftMaxHeapSize=12G \
    -XX:+AlwaysPreTouch -XX:+UseCompactObjectHeaders \
    -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520
```
