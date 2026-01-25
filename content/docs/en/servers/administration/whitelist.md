---
id: whitelist
title: Whitelist
sidebar_label: Whitelist
sidebar_position: 3
description: Control who can join your Hytale server with whitelist management
---

# Whitelist

Control who can join your server using the whitelist system.

## Overview

The whitelist restricts server access to approved players only. When enabled, only players listed in `whitelist.json` can connect.

:::info Operators Always Allowed
Operators can always join the server, even when the whitelist is active.
:::

## Enable Whitelist

Use the whitelist command in the server console:

```
/whitelist on
```

To disable:

```
/whitelist off
```

## Commands

| Command | Description |
|---------|-------------|
| `/whitelist on` | Enable whitelist |
| `/whitelist off` | Disable whitelist |
| `/whitelist add <player>` | Add player by username |
| `/whitelist add <uuid>` | Add player by UUID |
| `/whitelist remove <player>` | Remove player by username |
| `/whitelist remove <uuid>` | Remove player by UUID |
| `/whitelist list` | Show all whitelisted players |
| `/whitelist reload` | Reload whitelist from file |

## whitelist.json Format

The whitelist is stored in `whitelist.json` at the server root:

```json
{
  "enabled": true,
  "players": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "PlayerOne"
    },
    {
      "uuid": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "PlayerTwo"
    }
  ]
}
```

:::warning Manual Editing
If you edit `whitelist.json` manually, **stop the server first**. Changes made while the server is running may be overwritten. After editing, restart the server or use `/whitelist reload`.
:::

## Best Practices

- **Private Servers**: Enable whitelist for invite-only communities
- **Testing**: Use whitelist during development to limit access
- **Events**: Temporarily whitelist event participants

## Adding Players Before They Join

Players must have joined your server at least once to be added by username. To whitelist players who haven't joined yet, use their UUID directly:

```
/whitelist add 550e8400-e29b-41d4-a716-446655440000
```

## Removing Access

When a player is removed from the whitelist, they can no longer connect but are not kicked if currently online. To remove and kick:

```
/whitelist remove PlayerName
/kick PlayerName
```
