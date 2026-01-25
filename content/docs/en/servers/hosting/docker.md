---
id: docker
title: Docker Deployment
sidebar_label: Docker
sidebar_position: 2
---

# Docker Deployment

Run your Hytale server in a Docker container for easy deployment and management.

## Quick Start

### Using Docker Compose

Create a `docker-compose.yml`:

```yaml
version: "3.9"

services:
  hytale-server:
    image: eclipse-temurin:25-jdk-alpine
    container_name: hytale-server
    restart: unless-stopped

    environment:
      - MEMORY_MIN=4G
      - MEMORY_MAX=8G
      - SERVER_PORT=5520
      - TZ=Europe/Paris

    # IMPORTANT: UDP only (QUIC protocol)
    ports:
      - "5520:5520/udp"

    volumes:
      - ./data/worlds:/server/worlds
      - ./data/config:/server/config
      - ./data/mods:/server/mods
      - ./data/plugins:/server/plugins
      - ./server-files/HytaleServer.jar:/server/HytaleServer.jar:ro
      - ./server-files/Assets.zip:/server/Assets.zip:ro

    working_dir: /server

    command: >
      java -Xms4G -Xmx8G
      -XX:+UseG1GC
      -XX:+ParallelRefProcEnabled
      -XX:MaxGCPauseMillis=200
      -XX:+UseCompactObjectHeaders
      -jar HytaleServer.jar
      --assets Assets.zip
      -b 0.0.0.0:5520

    deploy:
      resources:
        limits:
          memory: 10G
        reservations:
          memory: 6G
```

### Download and Run

```bash
# Create directories
mkdir -p data/{worlds,config,mods,plugins} server-files

# Download server files using Hytale Downloader CLI (recommended)
wget https://downloader.hytale.com/hytale-downloader.zip
unzip hytale-downloader.zip
./hytale-downloader-linux-amd64
# Extract the Server folder and Assets.zip to server-files/

# Or copy from your Hytale launcher installation:
# Windows: %appdata%\Hytale\install\release\package\game\latest
# Linux: $XDG_DATA_HOME/Hytale/install/release/package/game/latest
# macOS: ~/Application Support/Hytale/install/release/package/game/latest

# Start container
docker-compose up -d

# View logs
docker-compose logs -f
```

:::warning Assets Required
The server requires both `HytaleServer.jar` AND `Assets.zip` to run. Make sure to copy both files from the downloaded package or launcher installation.
:::

## Community Docker Projects

Several community Docker projects are available:

| Project | Description | Link |
|---------|-------------|------|
| **hytale-server-container** | 49.4MB Alpine/Liberica, Pterodactyl support | [GitHub](https://github.com/deinfreu/hytale-server-container) |
| **hytale-docker** | Docker config with Temurin | [GitHub](https://github.com/Under-scape/hytale-docker) |
| **hytale-server-docker** | Production-ready image | [GitHub](https://github.com/Hybrowse/hytale-server-docker) |

## Custom Dockerfile

```dockerfile
FROM eclipse-temurin:25-jdk-alpine

LABEL maintainer="Your Name"
LABEL description="Hytale Dedicated Server"

ENV MEMORY_MIN="4G"
ENV MEMORY_MAX="8G"
ENV SERVER_PORT="5520"

RUN apk add --no-cache bash curl

# Create non-root user
RUN addgroup -g 1000 hytale && \
    adduser -u 1000 -G hytale -h /server -D hytale

WORKDIR /server

RUN mkdir -p config worlds mods plugins logs && \
    chown -R hytale:hytale /server

# QUIC/UDP port
EXPOSE 5520/udp

VOLUME ["/server/worlds", "/server/config", "/server/mods", "/server/plugins"]

USER hytale

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD pgrep -f "HytaleServer.jar" > /dev/null || exit 1

COPY Assets.zip /server/Assets.zip

ENTRYPOINT ["java"]
CMD ["-Xms4G", "-Xmx8G", "-XX:+UseG1GC", "-XX:+UseCompactObjectHeaders", "-jar", "HytaleServer.jar", "--assets", "Assets.zip", "-b", "0.0.0.0:5520"]
```

Build and run:

```bash
docker build -t hytale-server .
docker run -d \
  --name hytale \
  -p 5520:5520/udp \
  -v $(pwd)/data:/server \
  hytale-server
```

## Important Notes

:::warning UDP Protocol
Hytale uses **QUIC over UDP**. Always expose port 5520 as UDP:
```yaml
ports:
  - "5520:5520/udp"  # Correct
  - "5520:5520"      # Wrong (defaults to TCP)
```
:::

## Useful Commands

```bash
# Start server
docker-compose up -d

# Stop server
docker-compose down

# View logs
docker-compose logs -f

# Access console
docker attach hytale-server
# Detach with Ctrl+P, Ctrl+Q

# Backup worlds
docker exec hytale-server tar -czf /tmp/backup.tar.gz /server/worlds
docker cp hytale-server:/tmp/backup.tar.gz ./backup.tar.gz

# Update server
docker-compose down
# Re-run hytale-downloader to get latest version
./hytale-downloader-linux-amd64
# Copy new HytaleServer.jar and Assets.zip to server-files/
docker-compose up -d
```

## Pterodactyl Egg

For Pterodactyl panel users, community eggs are available:
- [Pterodactyl Hytale Egg](https://github.com/topics/pterodactyl-egg)

## Next Steps

- [Configure server settings](/docs/en/servers/setup/configuration)
- [Set up permissions](/docs/en/servers/administration/permissions)
- [Install plugins](/docs/en/modding/plugins/overview)
