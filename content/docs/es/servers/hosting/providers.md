---
id: providers
title: Hosting Providers
sidebar_label: Providers
sidebar_position: 3
description: Recommended hosting providers for Hytale servers
---

# Hosting Providers

Game hosting services that support Hytale servers.

## Hosting Types

| Type | Pros | Cons | Best For |
|------|------|------|----------|
| **Game Hosting** | Easy setup, managed, one-click install | Less control, may cost more | Beginners, small communities |
| **VPS** | Good balance, full OS access | Medium setup complexity | Intermediate users |
| **Dedicated** | Full control, best performance | Most complex, highest cost | Large servers, networks |

## Official Partners

These providers have **official Hytale plugins** for easy server management:

### Nitrado

- Official Hytale partner
- One-click server deployment
- Built-in mod support
- [nitrado.net](https://nitrado.net)

### Apex Hosting

- Official Hytale partner
- Easy control panel
- Automatic updates
- [apexminecrafthosting.com](https://apexminecrafthosting.com)

## Recommended Providers

These providers offer quality Hytale hosting:

| Provider | Type | Starting Price(per month) | Notes |
|----------|------|----------------|-------|
| **Nitrado** | Game Host | $12.99 | Official partner |
| **Apex Hosting** | Game Host | $14.99(first month is $11.24) | Official partner |
| **PebbleHost** | Game Host | $4.00 | Good value |
| **Game Host Bros** | Game Host | $7.99 | Community favorite |
| **WinterNode** | Game Host | $7.96 | Good performance |
| **BerryByte** | Game Host | $9.95(first month is $8.96) | Quality support |
| **Shockbyte** | Game Host | $12.50(first month is $10.62) | Easy setup |

## Choosing a Provider

### Key Considerations

1. **RAM Allocation**
   - 4 GB minimum for small servers (1-10 players)
   - 8-12 GB for medium servers (25-50 players)
   - 16 GB+ for large servers (50+ players)

2. **CPU Performance**
   - High single-thread performance is critical
   - Look for providers advertising high clock speeds

3. **Network**
   - UDP port 5520 must be available
   - Low latency to your target player base
   - DDoS protection for public servers

4. **Features**
   - Automatic backups
   - One-click mod installation
   - Easy file access (SFTP/FTP)
   - Responsive support

## VPS Providers

For more control, consider a VPS:

| Provider | Notes |
|----------|-------|
| **Hetzner** | Excellent value, EU/US datacenters |
| **OVH** | Good performance, global presence |
| **Vultr** | High-frequency CPU options |
| **DigitalOcean** | Easy to use, good documentation |
| **Linode** | Reliable, good support |

### VPS Requirements

| Players | RAM | CPU | Monthly Cost (approx) |
|---------|-----|-----|----------------------|
| 1-10 | 4 GB | 2 vCPU | $10-20 |
| 25-50 | 8-12 GB | 4 vCPU | $40-60 |
| 50+ | 16 GB+ | 8 vCPU | $80+ |

:::tip OS Choice
Choose **Ubuntu 24.04 LTS** or **Debian 12** for your VPS. Avoid Windows Server as it consumes 2GB+ RAM for the operating system alone.
:::

## Self-Hosting vs. Providers

| Factor | Self-Hosting | Game Host | VPS |
|--------|--------------|-----------|-----|
| **Setup Difficulty** | Medium-High | Easy | Medium |
| **Control** | Full | Limited | Full |
| **Cost** | Hardware + electricity | Monthly fee | Monthly fee |
| **Performance** | Depends on hardware | Standardized | Varies by plan |
| **Maintenance** | You handle it | Managed | You handle it |
| **Uptime** | Depends on setup | Usually guaranteed | Usually guaranteed |

[Self-Hosting Guide →](/docs/servers/hosting/self-hosting)
