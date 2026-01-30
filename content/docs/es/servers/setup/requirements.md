---
id: requirements
title: Server Requirements
sidebar_label: Requirements
sidebar_position: 1
---

# Server Requirements

Hardware and software requirements for running a Hytale dedicated server.

## Software Requirements

| Component | Requirement |
|-----------|-------------|
| **Java** | OpenJDK Temurin 25+ (25.0.1+8 LTS recommended) |
| **OS** | Ubuntu 24.04 LTS, Windows Server 2022, or macOS |
| **Architecture** | x64 or ARM64 supported |

## Network Requirements

| Component | Requirement |
|-----------|-------------|
| **Protocol** | QUIC over UDP (not TCP!) |
| **Default Port** | 5520/UDP |
| **Bandwidth** | 2 Mbit/s minimum for multiplayer |

:::warning Important
Hytale uses **QUIC over UDP**, not TCP. Ensure your firewall and DDoS protection support UDP/QUIC traffic.
:::

## Hardware (Minimum)

For small groups (1-10 players):

| Component | Specification |
|-----------|---------------|
| **CPU** | 4 cores, 4.0 GHz+ |
| **RAM** | 4-6 GB |
| **Storage** | 20 GB SSD |
| **Network** | 10 Mbit/s upload |

## Hardware (Recommended)

For communities (10-50 players):

| Component | Specification |
|-----------|---------------|
| **CPU** | 6+ cores, 4.0 GHz+ (high single-thread performance) |
| **RAM** | 8-12 GB |
| **Storage** | 50 GB NVMe SSD |
| **Network** | 100 Mbit/s upload |

## Hardware (Large Servers)

For 50+ players:

| Component | Specification |
|-----------|---------------|
| **CPU** | 8+ cores high frequency (AMD Ryzen 9, Intel i9) |
| **RAM** | 16-32 GB |
| **Storage** | 100+ GB NVMe SSD |
| **Network** | 1 Gbps symmetric |

## Important Notes

- **CPU**: Single-thread performance matters more than core count
- **Storage**: NVMe SSD is **mandatory** for voxel games (high IOPS required)
- **View Distance**: Start conservative (8-10) - biggest performance impact
- **Avoid**: Old low-end Xeons, HDD storage

## Server Limits

- **100 servers maximum** per Hytale license
- For more capacity: purchase additional licenses or apply for Server Provider account
