---
id: permissions
title: Permissions
sidebar_label: Permissions
sidebar_position: 2
description: Manage player permissions and operator access on your Hytale server
---

# Permissions

Manage player permissions and operator access on your Hytale server.

## Overview

Hytale uses a permission system stored in `permissions.json`. Players can be granted specific permission nodes or given full operator access.

## Operator (OP) Status

Operators have full administrative access to the server, including all commands and permissions.

### Granting Operator Status

```
/op add <player>
/op add <uuid>
```

:::info First Login Required
Players must have joined your server at least once before they can be granted operator status.
:::

### Removing Operator Status

From console or as an admin:

```
/op remove <player>
/op remove <uuid>
```

### Self-OP

To grant yourself operator status (requires console access):

```
/op self
```

## Permission Nodes

Permission nodes control access to specific commands and features. Common permission patterns:

| Permission | Description |
|------------|-------------|
| `hytale.command.kick` | Use /kick command |
| `hytale.command.ban` | Use /ban command |
| `hytale.command.whitelist` | Manage whitelist |
| `hytale.command.gamemode` | Change game modes |
| `hytale.command.teleport` | Teleport players |
| `hytale.admin.*` | All admin permissions |
| `gamemode.self` | Change own game mode |
| `gamemode.other` | Change others' game mode |
| `kill.self` | Kill self |
| `kill.other` | Kill other players |

### Wildcard Permissions

Use `*` to grant all permissions in a category:

```
hytale.command.*     # All command permissions
hytale.admin.*       # All admin permissions
*                    # All permissions (use carefully!)
```

## permissions.json Format

Permissions are stored in `permissions.json` at the server root:

```json
{
  "operators": [
    {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "AdminPlayer",
      "level": 4
    }
  ],
  "groups": {
    "default": {
      "permissions": [
        "hytale.command.help",
        "hytale.command.list",
        "whoami"
      ]
    },
    "moderator": {
      "permissions": [
        "hytale.command.kick",
        "hytale.command.mute",
        "hytale.command.whitelist"
      ],
      "inherits": ["default"]
    },
    "admin": {
      "permissions": [
        "hytale.admin.*"
      ],
      "inherits": ["moderator"]
    }
  },
  "players": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "groups": ["admin"],
      "permissions": []
    }
  }
}
```

:::warning Manual Editing
Configuration files are read on server startup and written to when in-game actions occur. **Manual changes while the server is running are likely to be overwritten.** Always stop the server before editing.
:::

## Commands

| Command | Description |
|---------|-------------|
| `/op add <player>` | Grant operator status |
| `/op remove <player>` | Revoke operator status |
| `/op self` | Grant yourself operator status |
| `/op list` | List all operators |

## Permission Groups

Create permission groups to easily manage player roles:

1. **default** - Base permissions for all players
2. **moderator** - Moderation commands (kick, mute)
3. **admin** - Full administrative access

Groups can inherit from other groups using the `inherits` property.

## Best Practices

- **Principle of Least Privilege**: Only grant permissions players need
- **Use Groups**: Organize permissions into logical groups
- **Audit Regularly**: Review operator list periodically
- **Backup**: Keep backups of `permissions.json` before major changes

## Checking Permissions

To verify a player has specific permissions in a channel:

```
/permissions check <player> <permission>
```

## Plugin Permissions

Plugins can register their own permission nodes. Check plugin documentation for available permissions. Common patterns:

```
pluginname.command.commandname
pluginname.feature.featurename
pluginname.admin
```
