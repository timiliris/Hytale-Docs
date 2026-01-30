---
id: authentication
title: Server Authentication
sidebar_label: Authentication
sidebar_position: 4
description: Guide to authenticating your Hytale server with the Hytale network
---

# Server Authentication

This guide explains how to authenticate your Hytale server with the Hytale network, enabling players with Hytale accounts to connect.

## Authentication Modes

Hytale servers support two authentication modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `authenticated` | Server verifies players via Hytale network | Public servers, production |
| `offline` | No authentication required | LAN play, testing, development |

### Setting the Mode

Set the authentication mode when starting the server:

```bash
# Authenticated mode (default, recommended for public servers)
java -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode authenticated

# Offline mode (for testing/LAN)
java -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode offline
```

:::warning Offline Mode
In offline mode, anyone can connect with any username. Only use this for private testing or LAN parties where you trust all players.
:::

## Server Authentication Flow

When running in `authenticated` mode, your server needs to authenticate with the Hytale network before players can connect.

### Step 1: Start the Server

Start your server in authenticated mode:

```bash
java -Xms8G -Xmx8G -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode authenticated
```

On first launch, the server will display:
```
No server tokens configured
Server session token not available
```

### Step 2: Initiate Device Authentication

In the server console, run:

```
/auth login device
```

The server will display a device code and verification URL:

```
Enter code: ABCD1234
Visit: https://oauth.accounts.hytale.com/oauth2/device/verify
Or visit: https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=ABCD1234
expires in 600 seconds
```

### Step 3: Authorize on Hytale Website

1. Open the verification URL in your browser
2. Log in with your Hytale account (must be the server owner)
3. Enter the device code displayed in the console
4. Approve the server authentication

### Step 4: Enable Token Persistence

Once authenticated, enable persistence so the token survives server restarts:

```
/auth persistence Encrypted
```

The server will confirm:
```
Authentication successful!
Server authenticated
Auth persistence enabled
```

:::tip Persistence Modes
- `Encrypted` - Token stored encrypted (recommended)
- `PlainText` - Token stored in plain text (not recommended)
- `None` - Token not persisted (must re-authenticate after restart)
:::

## Authentication Commands

| Command | Description |
|---------|-------------|
| `/auth login device` | Start device code authentication flow |
| `/auth status` | Check current authentication status |
| `/auth persistence <mode>` | Set token persistence (Encrypted/PlainText/None) |
| `/auth logout` | Revoke server authentication |

## Docker Authentication

When running in Docker, the authentication process is the same but commands are sent via Docker:

### Option 1: Docker Attach

```bash
# Attach to container (Ctrl+P, Ctrl+Q to detach)
docker attach hytale-server

# Then type the command
/auth login device
```

### Option 2: Docker Exec

```bash
# Send command directly
docker exec -i hytale-server sh -c 'echo "/auth login device" > /proc/1/fd/0'
```

### Docker Compose with Authentication

```yaml
version: '3.8'
services:
  hytale:
    image: eclipse-temurin:25-jdk-alpine
    container_name: hytale-server
    stdin_open: true   # Required for console input
    tty: true          # Required for console input
    ports:
      - "5520:5520/udp"
    volumes:
      - ./server:/server
      - ./auth:/server/auth  # Persist auth tokens
    working_dir: /server
    command: >
      java -Xms8G -Xmx8G
      -XX:+UseG1GC
      -jar HytaleServer.jar
      --assets Assets.zip
      -b 0.0.0.0:5520
      --auth-mode authenticated
```

:::info Token Storage
Auth tokens are stored in the server directory (typically `config/` or `auth/`). When using Docker, mount this directory as a volume to persist tokens between container restarts.
:::

## Java Direct Authentication

For Java Direct (non-Docker) servers, authentication is simpler:

1. Start the server normally
2. Type commands directly in the console
3. Tokens are stored in the server directory automatically

### Systemd Service with Authentication

If running as a systemd service, you can send commands via the console:

```bash
# Create a named pipe for input
mkfifo /tmp/hytale-console

# Service file using the pipe
# /etc/systemd/system/hytale.service
[Unit]
Description=Hytale Server
After=network.target

[Service]
Type=simple
User=hytale
WorkingDirectory=/opt/hytale
ExecStart=/bin/bash -c 'tail -f /tmp/hytale-console | java -Xms8G -Xmx8G -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode authenticated'
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Send commands:
```bash
echo "/auth login device" > /tmp/hytale-console
```

## Token Persistence Locations

| Setup | Token Location |
|-------|----------------|
| Java Direct | `<server_path>/config/` or `<server_path>/auth/` |
| Docker | Volume mounted at `/server/config/` or `/server/auth/` |
| Systemd | Same as Java Direct, in WorkingDirectory |

## Troubleshooting

### "No server tokens configured"
The server hasn't been authenticated yet. Run `/auth login device` to start authentication.

### "Device code expired"
The 600-second window expired. Run `/auth login device` again to get a new code.

### "Authentication failed"
- Ensure your Hytale account owns the server license
- Check your internet connection
- Verify the Hytale OAuth service is available

### "Token invalid after restart"
Persistence wasn't enabled. After authenticating, run:
```
/auth persistence Encrypted
```

### Docker: Can't send commands
Ensure your container has `stdin_open: true` and `tty: true` in docker-compose.yml, or use `-it` flags with `docker run`.

## Security Best Practices

1. **Use Encrypted persistence** - Always use `Encrypted` mode for token storage
2. **Protect server files** - Restrict access to the server directory containing auth tokens
3. **Use authenticated mode** - Only use `offline` for testing
4. **Separate auth volume** - In Docker, consider a separate volume for auth tokens with restricted permissions

## Re-authentication

If you need to re-authenticate (e.g., token revoked, account changed):

```bash
# Logout current session
/auth logout

# Start new authentication
/auth login device

# Enable persistence again
/auth persistence Encrypted
```
