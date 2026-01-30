---
id: self-hosting
title: Self-Hosting Guide
sidebar_label: Self-Hosting
sidebar_position: 1
description: Complete guide to hosting a Hytale server on your own hardware
---

# Self-Hosting Guide

Host a Hytale server on your own hardware or VPS.

## Requirements

### Network Requirements

- Static IP address or dynamic DNS service
- Port forwarding capability (UDP 5520)
- Stable internet connection (100+ Mbps upload recommended)

### Hardware Requirements

| Players | RAM | CPU | Storage |
|---------|-----|-----|---------|
| 1-10 | 4 GB | 4.0GHz+ single-thread | 50 GB NVMe SSD |
| 25-50 | 8-12 GB | High single-thread frequency | 100 GB NVMe SSD |
| 50+ | 16 GB+ | Adjust based on monitoring | 200 GB NVMe SSD |

:::tip CPU Performance
Hytale servers benefit more from **high single-thread CPU performance** than from many cores. Prioritize clock speed over core count.
:::

### Software Requirements

| Software | Requirement |
|----------|-------------|
| Java | **Java 25** ([Adoptium](https://adoptium.net/) recommended) |
| Architecture | x64 or arm64 |

## Recommended Operating Systems

### 1. Ubuntu 24.04 LTS (First Choice)

Best balance of performance, stability, and community support.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 25 (Adoptium)
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install temurin-25-jdk -y

# Verify installation
java -version
```

### 2. Debian 12 (Lightweight Alternative)

Lower resource usage, ideal for VPS with limited RAM.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 25 (Adoptium)
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo apt-key add -
echo "deb https://packages.adoptium.net/artifactory/deb bookworm main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install temurin-25-jdk -y
```

### 3. Windows Server (Not Recommended)

:::warning Avoid Windows Server
Windows Server consumes **2GB+ RAM** just for the operating system. This significantly reduces available memory for your Hytale server. Use Linux for better resource efficiency.
:::

If you must use Windows:

```powershell
# Download and install Java 25 from Adoptium
# https://adoptium.net/

# Verify installation
java -version
```

## Installation Steps

### 1. Create Server Directory

```bash
mkdir -p ~/hytale-server
cd ~/hytale-server
```

### 2. Download Server Files

Download the server files from [hytale.com](https://hytale.com).

```bash
# Example (URL will vary)
wget https://hytale.com/download/server/hytale-server.jar
```

### 3. Configure Firewall

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 5520/udp
sudo ufw enable
```

### 4. Port Forward (Home Networks)

Forward **UDP port 5520** from your router to your server's local IP address.

:::info QUIC Protocol
Hytale uses the QUIC protocol over UDP. You only need to forward UDP port 5520 - no TCP forwarding required.
:::

### 5. Configure Server

Create or edit `server.properties`:

```properties
server-name=My Hytale Server
port=5520
max-players=50
view-distance=12
```

### 6. Start Server

```bash
java -Xms4G -Xmx8G -jar hytale-server.jar
```

## Running as a Service (Linux)

### Systemd Service

Create `/etc/systemd/system/hytale.service`:

```ini
[Unit]
Description=Hytale Server
After=network.target

[Service]
User=hytale
WorkingDirectory=/home/hytale/hytale-server
ExecStart=/usr/bin/java -Xms4G -Xmx8G -jar hytale-server.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable hytale
sudo systemctl start hytale
```

## Performance Monitoring

Monitor your server to optimize settings:

```bash
# Check memory usage
free -h

# Check CPU usage
top -p $(pgrep -f hytale-server)

# Check network connections
ss -u -a | grep 5520
```

Adjust RAM allocation and view distance based on monitoring results.

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups/hytale"
SERVER_DIR="/home/hytale/hytale-server"
DATE=$(date +%Y-%m-%d_%H-%M)

mkdir -p $BACKUP_DIR
tar -czf "$BACKUP_DIR/hytale-backup-$DATE.tar.gz" -C $SERVER_DIR worlds config

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Add to crontab for daily backups:

```bash
0 4 * * * /home/hytale/backup.sh
```
