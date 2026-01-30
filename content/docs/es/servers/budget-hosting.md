---
id: budget-hosting
title: Budget Server Hosting Guide
sidebar_label: Budget Hosting
sidebar_position: 5
description: How to host a Hytale server on a budget - free and low-cost options compared
---

# Budget Server Hosting Guide

Hosting a Hytale server does not have to be expensive. Whether you want to play with friends or run a small community server, there are many free and low-cost options available. This guide compares all your options and helps you choose the best solution for your budget.

## Hosting Options Comparison

| Option | Monthly Cost | Max Players | Difficulty | Control |
|--------|--------------|-------------|------------|---------|
| Personal PC | Free | 5-10 | Easy | Full |
| Budget VPS | $5-15 | 10-30 | Medium | Full |
| Budget Game Host | $3-10 | 10-20 | Easy | Limited |
| Oracle Cloud Free | Free | 10-15 | Hard | Full |
| Raspberry Pi 5 | ~$100 (one-time) | 5-8 | Medium | Full |

## Option 1: Host on Your PC

The simplest and most cost-effective solution for playing with friends.

### Advantages

- **Free** - No monthly costs
- **Full control** - Complete access to all settings
- **Easy setup** - No Linux knowledge required
- **Low latency** - For local players

### Disadvantages

- PC must stay on while the server runs
- Uses your home internet bandwidth
- IP address may change (dynamic IP)
- Security risks if not properly configured

### Setup Steps

1. **Download** the Hytale server from [hytale.com](https://hytale.com)
2. **Install Java 25** (Adoptium recommended)
3. **Configure port forwarding** on your router:
   - Protocol: **UDP**
   - Port: **5520**
   - Forward to your PC's local IP

```bash
# Start the server
java -Xms4G -Xmx4G -jar hytale-server.jar
```

### When to Choose This Option

- Playing with close friends
- Testing mods and configurations
- Temporary or occasional use
- Learning server administration

:::tip Dynamic DNS
If your IP address changes frequently, use a free Dynamic DNS service like No-IP or DuckDNS to get a consistent hostname.
:::

## Option 2: Budget VPS Providers

Virtual Private Servers offer the best balance of cost, performance, and control.

### Recommended Budget VPS Providers

| Provider | Price | RAM | CPU | Region |
|----------|-------|-----|-----|--------|
| Contabo | $5/mo | 4GB | 4 vCPU | EU, US |
| Hetzner | $4/mo | 4GB | 2 vCPU | EU |
| Vultr | $6/mo | 4GB | 2 vCPU | Global |
| DigitalOcean | $6/mo | 4GB | 2 vCPU | Global |
| OVH VPS | $4/mo | 4GB | 2 vCPU | EU, NA |
| Linode | $6/mo | 4GB | 2 vCPU | Global |

### Quick Installation Script

After setting up your VPS with Ubuntu 24.04, run this script:

```bash
#!/bin/bash
# Hytale Server Quick Install Script for Ubuntu 24.04

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 25 (Adoptium)
sudo apt install -y wget apt-transport-https
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/adoptium.gpg
echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-25-jdk

# Create server directory
mkdir -p ~/hytale-server
cd ~/hytale-server

# Download server (replace with actual download URL)
echo "Download hytale-server.jar from hytale.com and place it in ~/hytale-server/"

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
java -Xms4G -Xmx4G \
  -XX:+UseG1GC \
  -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=200 \
  -jar hytale-server.jar
EOF
chmod +x start.sh

# Configure firewall
sudo ufw allow 5520/udp
sudo ufw enable

echo "Setup complete! Place hytale-server.jar in ~/hytale-server/ and run ./start.sh"
```

### Running as a Service

Create a systemd service for automatic startup:

```bash
sudo nano /etc/systemd/system/hytale.service
```

```ini
[Unit]
Description=Hytale Server
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/hytale-server
ExecStart=/usr/bin/java -Xms4G -Xmx4G -XX:+UseG1GC -jar hytale-server.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable hytale
sudo systemctl start hytale
```

## Option 3: Budget Game Server Hosting

Game server hosts provide easy-to-use panels and support, ideal for beginners.

### Recommended Budget Game Hosts

| Host | Price | RAM | Features |
|------|-------|-----|----------|
| PebbleHost | $3/mo | 2GB | Budget option, basic panel |
| BisectHosting | $5/mo | 4GB | Good value, 24/7 support |
| Shockbyte | $3/mo | 2GB | Budget option, instant setup |
| Apex Hosting | $5/mo | 4GB | Reliable, good support |
| MCProHosting | $4/mo | 3GB | Easy panel, quick setup |

### Advantages

- **Easy setup** - Web-based control panel
- **24/7 support** - Help when you need it
- **Automatic backups** - Data protection included
- **No Linux knowledge** required

### Disadvantages

- **Less control** - Limited access to system settings
- **Shared resources** - Performance may vary
- **Higher cost per resource** compared to VPS
- **Vendor lock-in** - Harder to migrate

### When to Choose Game Hosting

- Beginners with no Linux experience
- Want quick setup without technical hassle
- Need reliable support
- Small community servers (under 20 players)

## Option 4: Oracle Cloud Free Tier (FREE)

Oracle Cloud offers a generous free tier that can run a Hytale server indefinitely.

### Free Tier Specifications

| Resource | Amount |
|----------|--------|
| ARM CPUs | 4 cores |
| RAM | 24 GB |
| Storage | 200 GB |
| Bandwidth | 10 TB/month |
| Duration | **Forever free** |

:::warning Account Verification
Oracle requires a credit card for verification but will not charge you for free tier resources. Some users report difficulty getting approved.
:::

### Setup Guide

#### Step 1: Create Oracle Cloud Account

1. Go to [cloud.oracle.com](https://cloud.oracle.com)
2. Sign up for a free account
3. Complete identity verification
4. Wait for account approval (can take 24-48 hours)

#### Step 2: Create VM Instance

1. Navigate to **Compute > Instances**
2. Click **Create Instance**
3. Configure:
   - **Shape**: VM.Standard.A1.Flex (ARM)
   - **OCPUs**: 4
   - **RAM**: 24 GB
   - **Image**: Ubuntu 24.04
   - **Storage**: 100 GB (free tier)

4. Download SSH keys
5. Launch instance

#### Step 3: Configure Networking

1. Go to **Networking > Virtual Cloud Networks**
2. Select your VCN > Security Lists
3. Add Ingress Rule:
   - **Source**: 0.0.0.0/0
   - **Protocol**: UDP
   - **Port**: 5520

#### Step 4: Install Server

```bash
# Connect via SSH
ssh -i your-key.pem ubuntu@your-instance-ip

# Run installation script (same as VPS section)
# Then install using ARM-compatible Java
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-25-jdk

# Continue with server setup...
```

### Tips for Oracle Cloud

- **Instance availability** - Free ARM instances are limited; try different regions if unavailable
- **Always Free** - Ensure you select "Always Free" eligible resources
- **Backup your data** - Oracle may terminate inactive accounts

## Option 5: Raspberry Pi 5

A one-time purchase that provides free hosting forever with minimal electricity costs.

### Hardware Requirements

| Component | Recommendation | Estimated Cost |
|-----------|---------------|----------------|
| Raspberry Pi 5 (8GB) | Required | $80 |
| Power Supply | Official 27W | $12 |
| MicroSD Card (64GB+) | High endurance | $15 |
| Case with Cooling | Active cooling recommended | $10 |
| **Total** | | **~$117** |

### Performance Expectations

- **Maximum players**: 5-8
- **View distance**: 6-8 chunks recommended
- **Power consumption**: ~5-10W (very low)
- **Monthly electricity cost**: ~$1-2

### Installation Guide

```bash
# Install Raspberry Pi OS (64-bit)
# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 25
sudo apt install -y openjdk-25-jdk

# Create server directory
mkdir ~/hytale-server
cd ~/hytale-server

# Create optimized start script for Pi
cat > start.sh << 'EOF'
#!/bin/bash
java -Xms2G -Xmx3G \
  -XX:+UseG1GC \
  -XX:+ParallelRefProcEnabled \
  -XX:MaxGCPauseMillis=200 \
  -XX:+UnlockExperimentalVMOptions \
  -XX:+DisableExplicitGC \
  -jar hytale-server.jar
EOF
chmod +x start.sh
```

### Optimizations for Raspberry Pi

```properties
# server.properties - Optimized for Raspberry Pi
view-distance=6
max-players=8
simulation-distance=4
```

### Advantages

- One-time cost, no monthly fees
- Very low power consumption
- Silent operation
- Good learning experience

### Disadvantages

- Limited to small groups (5-8 players)
- Lower performance than VPS
- Initial setup complexity
- May need cooling in warm environments

## Optimizing Costs

### Choose the Right Amount of RAM

| Players | Minimum RAM | Recommended RAM |
|---------|-------------|-----------------|
| 1-5 | 2 GB | 4 GB |
| 5-10 | 4 GB | 6 GB |
| 10-20 | 6 GB | 8 GB |
| 20-30 | 8 GB | 12 GB |

### Reduce Server View Distance

Lowering view distance significantly reduces RAM and CPU usage:

```properties
# server.properties
view-distance=8  # Default is often 10-12
simulation-distance=6
```

### Turn Off When Not Used

For VPS hosting, consider:

- **Scheduled shutdowns** - Shut down during off-hours
- **Snapshot and destroy** - Save money when not playing for extended periods

### Hosting Provider Promo Codes

Many providers offer discounts:

- **New customer discounts** - Often 20-50% off first month
- **Annual billing** - Save 10-20% vs monthly
- **Seasonal sales** - Black Friday, holidays
- **Referral programs** - Get credits for referring friends

## Minimum Server Requirements

### Hardware Minimums

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4 GB | 6-8 GB |
| CPU | 2 vCPU | 4 vCPU |
| Storage | SSD required | NVMe preferred |
| Network | 100 Mbps | 1 Gbps |

### Network Requirements

| Requirement | Value |
|-------------|-------|
| Protocol | **UDP** |
| Port | **5520** |
| Latency | < 100ms for good experience |
| Bandwidth | ~100 KB/s per player |

:::warning SSD Required
Hytale servers require SSD storage. Traditional hard drives (HDD) will cause severe lag and chunk loading issues. NVMe SSDs provide the best performance.
:::

## Final Recommendations

### Best Option by Budget

| Monthly Budget | Best Option | Expected Players |
|----------------|-------------|------------------|
| $0 | Personal PC or Oracle Cloud | 5-15 |
| $5/month | VPS (Contabo/Hetzner) | 20-30 |
| $10/month | VPS or Game Host | 30-50 |
| One-time $100 | Raspberry Pi 5 | 5-8 |

### Decision Flowchart

1. **Playing with 2-5 close friends?** -> Host on your PC
2. **Want free hosting forever?** -> Try Oracle Cloud Free Tier
3. **No Linux experience?** -> Use a Game Server Host
4. **Want best value for money?** -> Get a Budget VPS
5. **Want a fun project?** -> Build a Raspberry Pi server

## Next Steps

- [Server Installation Guide](/docs/servers/setup/installation)
- [Server Configuration](/docs/servers/setup/configuration)
- [Plugin Development](/docs/modding/plugins/overview)
- [Server Administration](/docs/servers/administration/commands)
