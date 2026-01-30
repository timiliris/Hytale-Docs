---
id: commands
title: Server Commands
sidebar_label: Commands
sidebar_position: 1
---

# Server Commands

Console and in-game commands for Hytale server administration.

---

## Player Commands

Commands for managing players, their game modes, stats, effects, and camera.

### gamemode

Changes the game mode of a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/gamemode <gamemode> [player]` |
| **Aliases** | `gm` |
| **Permission** | `gamemode.self`, `gamemode.other` |

**Parameters:**
- `gamemode` - The game mode to set (e.g., Creative, Adventure, Survival)
- `player` (optional) - Target player (requires `gamemode.other` permission)

**Examples:**
```
/gamemode creative
/gamemode adventure PlayerName
/gm survival
```

---

### kill

Instantly kills a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/kill [player]` |
| **Permission** | `kill.self`, `kill.other` |

**Parameters:**
- `player` (optional) - Target player (requires `kill.other` permission)

**Examples:**
```
/kill
/kill PlayerName
```

---

### damage

Deals damage to a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/damage [amount] [--silent] [player]` |
| **Aliases** | `hurt` |
| **Permission** | `damage.self`, `damage.other` |

**Parameters:**
- `amount` (optional) - Amount of damage to deal (default: 1.0)
- `--silent` (flag) - Suppress damage notification message
- `player` (optional) - Target player (requires `damage.other` permission)

**Examples:**
```
/damage
/damage 5.0
/damage 10 --silent PlayerName
/hurt 3.5
```

---

### hide

Hides a player from other players.

| Property | Value |
|----------|-------|
| **Syntax** | `/hide <player> [target]` |
| **Subcommands** | `show`, `all`, `showall` |

**Parameters:**
- `player` - The player to hide
- `target` (optional) - Hide from a specific player only (hides from all if not specified)

**Subcommands:**
- `/hide show <player> [target]` - Make a player visible again
- `/hide all` - Hide all players from each other
- `/hide showall` - Make all players visible to each other

**Examples:**
```
/hide PlayerName
/hide PlayerName TargetPlayer
/hide show PlayerName
/hide all
/hide showall
```

---

### whereami

Displays the current location and world information.

| Property | Value |
|----------|-------|
| **Syntax** | `/whereami [player]` |
| **Permission** | `whereami.self`, `whereami.other` |
| **Game Mode** | Creative |

**Parameters:**
- `player` (optional) - Target player (requires `whereami.other` permission)

**Information displayed:**
- World name
- Chunk coordinates (X, Y, Z)
- Position coordinates (X, Y, Z)
- Head rotation (yaw, pitch, roll)
- Direction and axis information
- Chunk saving status

**Examples:**
```
/whereami
/whereami PlayerName
```

---

### whoami

Displays player identity information.

| Property | Value |
|----------|-------|
| **Syntax** | `/whoami [player]` |
| **Aliases** | `uuid` |
| **Game Mode** | Adventure |

**Parameters:**
- `player` (optional) - Target player

**Information displayed:**
- Player UUID
- Username
- Language preference

**Examples:**
```
/whoami
/uuid
/whoami PlayerName
```

---

### player stats

Manage player statistics.

| Property | Value |
|----------|-------|
| **Syntax** | `/player stats <subcommand>` |
| **Aliases** | `stat` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `get` | `/player stats get <statName> [player]` | Get the value of a stat |
| `set` | `/player stats set <statName> <value> [player]` | Set a stat to a specific value |
| `add` | `/player stats add <statName> <value> [player]` | Add to a stat value |
| `reset` | `/player stats reset [player]` | Reset all stats |
| `settomax` | `/player stats settomax <statName> [player]` | Set a stat to its maximum value |
| `dump` | `/player stats dump [player]` | Display all stats |

**Examples:**
```
/player stats get health
/player stats set health 100
/player stats add stamina 50
/player stats settomax health
/player stats dump
```

---

### player effect

Apply or clear effects on players.

| Property | Value |
|----------|-------|
| **Syntax** | `/player effect <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `apply` | `/player effect apply <effect> [duration] [player]` | Apply an effect |
| `clear` | `/player effect clear [player]` | Clear all effects |

**Parameters:**
- `effect` - The effect asset ID to apply
- `duration` (optional) - Duration in ticks (default: 100)
- `player` (optional) - Target player

**Permissions:**
- `player.effect.apply.self`, `player.effect.apply.other`
- `player.effect.clear.self`, `player.effect.clear.other`

**Examples:**
```
/player effect apply speed_boost
/player effect apply regeneration 200
/player effect apply strength 150 PlayerName
/player effect clear
```

---

### player camera

Control player camera modes.

| Property | Value |
|----------|-------|
| **Syntax** | `/player camera <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `reset` | `/player camera reset [player]` | Reset camera to default |
| `topdown` | `/player camera topdown [player]` | Set top-down camera view |
| `sidescroller` | `/player camera sidescroller [player]` | Set side-scroller camera view |
| `demo` | `/player camera demo <activate\|deactivate>` | Demo camera mode |

**Examples:**
```
/player camera reset
/player camera topdown
/player camera sidescroller PlayerName
/player camera demo activate
```

---

## Entity Commands

Commands for managing entities in the world.

### entity clone

Clones an entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity clone [entity] [count]` |

**Parameters:**
- `entity` (optional) - Entity ID to clone (uses looked-at entity if not specified)
- `count` (optional) - Number of clones to create (default: 1)

**Examples:**
```
/entity clone
/entity clone 12345
/entity clone 12345 5
```

---

### entity remove

Removes an entity from the world.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity remove [entity] [--others]` |

**Parameters:**
- `entity` (optional) - Entity ID to remove (uses looked-at entity if not specified)
- `--others` (flag) - Remove all other non-player entities except the specified one

**Examples:**
```
/entity remove
/entity remove 12345
/entity remove 12345 --others
```

---

### entity dump

Dumps entity data to the server log.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity dump [entity]` |

**Parameters:**
- `entity` (optional) - Entity ID to dump (uses looked-at entity if not specified)

**Examples:**
```
/entity dump
/entity dump 12345
```

---

### entity clean

Removes all non-player entities from the current world.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity clean` |

**Warning:** This is a destructive command that removes all entities except players.

**Examples:**
```
/entity clean
```

---

### entity count

Displays the total entity count in the current world.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity count` |

**Examples:**
```
/entity count
```

---

### entity stats

Manage entity statistics.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity stats <subcommand>` |
| **Aliases** | `stat` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `get` | `/entity stats get <statName> [entity]` | Get the value of a stat |
| `set` | `/entity stats set <statName> <value> [entity]` | Set a stat value |
| `add` | `/entity stats add <statName> <value> [entity]` | Add to a stat value |
| `reset` | `/entity stats reset [entity]` | Reset all stats |
| `settomax` | `/entity stats settomax <statName> [entity]` | Set a stat to maximum |
| `dump` | `/entity stats dump [entity]` | Display all stats |

**Examples:**
```
/entity stats get health
/entity stats set health 50
/entity stats dump
```

---

### entity effect

Apply an effect to entities.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity effect <effect> [duration] [entity]` |

**Parameters:**
- `effect` - The effect asset ID to apply
- `duration` (optional) - Duration in ticks (default: 100)
- `entity` (optional) - Target entity

**Examples:**
```
/entity effect poison
/entity effect slow 200
```

---

### entity intangible

Makes an entity intangible (no collision).

| Property | Value |
|----------|-------|
| **Syntax** | `/entity intangible [--remove] [entity]` |

**Parameters:**
- `--remove` (flag) - Remove intangible status instead of adding it
- `entity` (optional) - Target entity

**Examples:**
```
/entity intangible
/entity intangible --remove
/entity intangible 12345
```

---

### entity invulnerable

Makes an entity invulnerable to damage.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity invulnerable [--remove] [entity]` |

**Parameters:**
- `--remove` (flag) - Remove invulnerable status instead of adding it
- `entity` (optional) - Target entity

**Examples:**
```
/entity invulnerable
/entity invulnerable --remove
/entity invulnerable 12345
```

---

## World Commands

Commands for managing chunks and world maps.

### chunk info

Displays detailed information about a chunk.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk info <x> <z>` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)

**Information displayed:**
- Initialization status
- Generation status
- Ticking status
- Saving status
- Section details

**Examples:**
```
/chunk info 0 0
/chunk info ~ ~
/chunk info ~5 ~-3
```

---

### chunk load

Loads a chunk into memory.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk load <x> <z> [--markdirty]` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)
- `--markdirty` (flag) - Mark the chunk as needing to be saved

**Examples:**
```
/chunk load 0 0
/chunk load ~ ~
/chunk load 10 10 --markdirty
```

---

### chunk unload

Unloads a chunk from memory.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk unload <x> <z>` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)

**Examples:**
```
/chunk unload 0 0
/chunk unload ~ ~
```

---

### chunk regenerate

Regenerates a chunk (WARNING: destructive).

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk regenerate <x> <z>` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)

**Warning:** This will regenerate the chunk, losing all player modifications.

**Examples:**
```
/chunk regenerate 0 0
/chunk regenerate ~ ~
```

---

### worldmap discover

Discovers zones on the world map for a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldmap discover [zone]` |
| **Aliases** | `disc` |

**Parameters:**
- `zone` (optional) - Zone name to discover, or "all" to discover all zones. If not specified, lists available zones.

**Examples:**
```
/worldmap discover
/worldmap discover all
/worldmap discover ForestZone
/map disc all
```

---

### worldmap undiscover

Removes discovered zones from the world map.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldmap undiscover [zone]` |

**Parameters:**
- `zone` (optional) - Zone name to undiscover, or "all" to undiscover all zones. If not specified, lists discovered zones.

**Examples:**
```
/worldmap undiscover
/worldmap undiscover all
/worldmap undiscover ForestZone
```

---

## Server Commands

Commands for server administration.

### stop

Stops the server gracefully.

| Property | Value |
|----------|-------|
| **Syntax** | `/stop [--crash]` |
| **Aliases** | `shutdown` |

**Parameters:**
- `--crash` (flag) - Simulate a crash shutdown instead of graceful shutdown

**Examples:**
```
/stop
/shutdown
/stop --crash
```

---

### kick

Kicks a player from the server.

| Property | Value |
|----------|-------|
| **Syntax** | `/kick <player>` |

**Parameters:**
- `player` - The player to kick

**Examples:**
```
/kick PlayerName
```

---

### who

Lists all online players by world.

| Property | Value |
|----------|-------|
| **Syntax** | `/who` |
| **Game Mode** | Adventure |

**Information displayed:**
- Players organized by world
- Display names (if set) and usernames

**Examples:**
```
/who
```

---

### maxplayers

Gets or sets the maximum player count.

| Property | Value |
|----------|-------|
| **Syntax** | `/maxplayers [amount]` |

**Parameters:**
- `amount` (optional) - New maximum player count. If not specified, displays current value.

**Examples:**
```
/maxplayers
/maxplayers 50
```

---

### auth

Authentication management commands.

| Property | Value |
|----------|-------|
| **Syntax** | `/auth <subcommand>` |

**Subcommands:**

| Subcommand | Description |
|------------|-------------|
| `status` | Check authentication status |
| `login` | Login to authentication service |
| `select` | Select authentication account |
| `logout` | Logout from authentication |
| `cancel` | Cancel pending authentication |
| `persistence` | Manage authentication persistence |

**Examples:**
```
/auth status
/auth login
/auth logout
```

---

## Utility Commands

General utility commands.

### help

Displays help information for commands.

| Property | Value |
|----------|-------|
| **Syntax** | `/help [command]` |
| **Aliases** | `?` |
| **Game Mode** | Adventure |

**Parameters:**
- `command` (optional) - Command name to get help for. Opens command list UI if not specified.

**Examples:**
```
/help
/?
/help gamemode
```

---

### backup

Creates a backup of the server data.

| Property | Value |
|----------|-------|
| **Syntax** | `/backup` |

**Requirements:**
- Server must be fully booted
- Backup directory must be configured in server options

**Examples:**
```
/backup
```

---

### notify

Sends a notification to all players.

| Property | Value |
|----------|-------|
| **Syntax** | `/notify [style] <message>` |

**Parameters:**
- `style` (optional) - Notification style (Default, Warning, Error, etc.)
- `message` - The message to send (supports formatted messages with `{...}`)

**Examples:**
```
/notify Hello everyone!
/notify Warning Server restart in 5 minutes
/notify {"text": "Formatted message", "color": "red"}
```

---

### sound 2d

Plays a 2D sound effect.

| Property | Value |
|----------|-------|
| **Syntax** | `/sound 2d <sound> [category] [--all] [player]` |
| **Aliases** | `play` |

**Parameters:**
- `sound` - Sound event asset ID
- `category` (optional) - Sound category (default: SFX)
- `--all` (flag) - Play to all players in the world
- `player` (optional) - Target player

**Examples:**
```
/sound 2d ui_click
/sound play notification SFX
/sound 2d alert --all
```

---

### sound 3d

Plays a 3D positional sound effect.

| Property | Value |
|----------|-------|
| **Syntax** | `/sound 3d <sound> [category] <x> <y> <z> [--all] [player]` |
| **Aliases** | `play3d` |

**Parameters:**
- `sound` - Sound event asset ID
- `category` (optional) - Sound category (default: SFX)
- `x y z` - Position coordinates (supports relative coordinates with ~)
- `--all` (flag) - Play to all players in the world
- `player` (optional) - Target player

**Examples:**
```
/sound 3d explosion SFX 100 64 200
/sound play3d ambient ~ ~ ~
/sound 3d alert SFX ~ ~10 ~ --all
```

---

## Debug Commands

Commands for debugging and monitoring.

### ping

Displays ping/latency information.

| Property | Value |
|----------|-------|
| **Syntax** | `/ping [--detail] [player]` |
| **Subcommands** | `clear`, `graph` |
| **Game Mode** | Adventure |

**Parameters:**
- `--detail` (flag) - Show detailed ping information
- `player` (optional) - Target player

**Subcommands:**
- `/ping clear [player]` - Clear ping history
- `/ping graph [width] [height] [player]` - Display ping graph

**Examples:**
```
/ping
/ping --detail
/ping PlayerName
/ping clear
/ping graph 80 15
```

---

### version

Displays server version information.

| Property | Value |
|----------|-------|
| **Syntax** | `/version` |

**Information displayed:**
- Server version
- Patchline
- Environment (if not release)

**Examples:**
```
/version
```

---

### log

Manages logger levels.

| Property | Value |
|----------|-------|
| **Syntax** | `/log <logger> [level] [--save] [--reset]` |

**Parameters:**
- `logger` - Logger name (or "global" for the global logger)
- `level` (optional) - Log level (OFF, SEVERE, WARNING, INFO, CONFIG, FINE, FINER, FINEST, ALL)
- `--save` (flag) - Save the log level to server config
- `--reset` (flag) - Reset the logger to default level

**Examples:**
```
/log global
/log global INFO
/log global FINE --save
/log network WARNING
/log network --reset
```

---

### server stats memory

Displays server memory statistics.

| Property | Value |
|----------|-------|
| **Syntax** | `/server stats memory` |
| **Aliases** | `mem` |

**Information displayed:**
- Total and free physical memory
- Total and free swap memory
- Heap memory usage (init, used, committed, max, free)
- Non-heap memory usage
- Objects pending finalization

**Examples:**
```
/server stats memory
/server stats mem
```

---

### server stats cpu

Displays server CPU statistics.

| Property | Value |
|----------|-------|
| **Syntax** | `/server stats cpu` |

**Information displayed:**
- System CPU load
- Process CPU load
- System load average
- Process uptime

**Examples:**
```
/server stats cpu
```

---

## Inventory Commands

Commands for managing player inventories, items, and equipment.

### give

Gives items to a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/give <item> [quantity] [metadata]` |
| **Permission** | `give.self`, `give.other` |

**Parameters:**
- `item` - The item asset ID to give
- `quantity` (optional) - Number of items to give (default: 1)
- `metadata` (optional) - JSON metadata string for the item

**Usage variants:**
- `/give <player> <item> [quantity] [metadata]` - Give items to another player (requires `give.other` permission)

**Examples:**
```
/give Sword_Iron
/give Sword_Iron 5
/give PlayerName Pickaxe_Diamond 1
/give Potion_Health 3 {"durability": 100}
```

---

### give armor

Gives a complete set of armor matching a search pattern.

| Property | Value |
|----------|-------|
| **Syntax** | `/give armor <search> [--set] [player]` |

**Parameters:**
- `search` - Search string to match armor types (e.g., "Iron", "Diamond")
- `--set` (flag) - Clear existing armor before adding new armor
- `player` (optional) - Target player (use "*" for all players)

**Examples:**
```
/give armor Iron
/give armor Diamond --set
/give armor Gold PlayerName
/give armor Iron *
```

---

### inventory

Parent command for inventory management subcommands.

| Property | Value |
|----------|-------|
| **Syntax** | `/inventory <subcommand>` |
| **Aliases** | `inv` |

**Subcommands:**
- `clear` - Clear inventory
- `see` - View another player's inventory
- `item` - Open item container
- `backpack` - Manage backpack size

---

### inventory clear

Clears the player's entire inventory.

| Property | Value |
|----------|-------|
| **Syntax** | `/inventory clear` |
| **Aliases** | `/inv clear` |
| **Game Mode** | Creative |

**Examples:**
```
/inventory clear
/inv clear
```

---

### inventory see

Opens and views another player's inventory.

| Property | Value |
|----------|-------|
| **Syntax** | `/inventory see <player>` |
| **Permission** | `invsee.modify` (for editing) |

**Parameters:**
- `player` - Target player whose inventory to view

**Notes:**
- Without `invsee.modify` permission, the inventory is read-only
- Opens the target player's inventory in a bench interface

**Examples:**
```
/inventory see PlayerName
/inv see PlayerName
```

---

### inventory item

Opens the container of the currently held item (e.g., backpack, pouch).

| Property | Value |
|----------|-------|
| **Syntax** | `/inventory item` |

**Requirements:**
- Must have an item in hand
- Item must have a container component

**Examples:**
```
/inventory item
/inv item
```

---

### inventory backpack

Gets or sets the backpack capacity.

| Property | Value |
|----------|-------|
| **Syntax** | `/inventory backpack [size]` |

**Parameters:**
- `size` (optional) - New backpack capacity. If not specified, displays current capacity.

**Notes:**
- Items that don't fit after resizing are dropped on the ground

**Examples:**
```
/inventory backpack
/inventory backpack 20
/inv backpack 30
```

---

### itemstate

Sets the state of the currently held item.

| Property | Value |
|----------|-------|
| **Syntax** | `/itemstate <state>` |
| **Game Mode** | Creative |

**Parameters:**
- `state` - The state string to apply to the item

**Requirements:**
- Must have an item in the active hotbar slot

**Examples:**
```
/itemstate charged
/itemstate broken
/itemstate enchanted
```

---

## Lighting Commands

Commands for managing world lighting calculations and data.

### lighting

Parent command for lighting subcommands.

| Property | Value |
|----------|-------|
| **Syntax** | `/lighting <subcommand>` |
| **Aliases** | `light` |

**Subcommands:**
- `get` - Get light values at a position
- `send` - Toggle lighting data sending
- `info` - Display lighting system information
- `calculation` - Set lighting calculation mode
- `invalidate` - Invalidate lighting data

---

### lighting get

Gets the light values at a specific position.

| Property | Value |
|----------|-------|
| **Syntax** | `/lighting get <x> <y> <z> [--hex]` |

**Parameters:**
- `x y z` - Block coordinates (supports relative coordinates with ~)
- `--hex` (flag) - Display light value in hexadecimal format

**Information displayed:**
- Red light value (0-15)
- Green light value (0-15)
- Blue light value (0-15)
- Sky light value (0-15)

**Examples:**
```
/lighting get 0 64 0
/lighting get ~ ~ ~
/lighting get ~ ~1 ~ --hex
/light get 100 50 200
```

---

### lighting send

Controls whether lighting data is sent to clients.

| Property | Value |
|----------|-------|
| **Syntax** | `/lighting send <local\|global> [enabled]` |

**Subcommands:**
- `local` - Toggle local lighting data sending
- `global` - Toggle global lighting data sending

**Parameters:**
- `enabled` (optional) - Boolean value. Toggles if not specified.

**Examples:**
```
/lighting send local
/lighting send local true
/lighting send global false
```

---

### lighting info

Displays information about the lighting system.

| Property | Value |
|----------|-------|
| **Syntax** | `/lighting info [--detail]` |

**Parameters:**
- `--detail` (flag) - Show detailed chunk lighting statistics

**Information displayed:**
- Lighting queue size
- Light calculation type
- (With --detail) Total chunk sections, sections with local/global light

**Examples:**
```
/lighting info
/lighting info --detail
```

---

### lighting calculation

Sets the lighting calculation mode.

| Property | Value |
|----------|-------|
| **Syntax** | `/lighting calculation <type> [--invalidate]` |

**Parameters:**
- `type` - Calculation type: `FLOOD` or `FULLBRIGHT`
- `--invalidate` (flag) - Invalidate all loaded chunks after changing

**Calculation types:**
- `FLOOD` - Standard flood-fill lighting calculation
- `FULLBRIGHT` - Full brightness (no shadows)

**Examples:**
```
/lighting calculation FLOOD
/lighting calculation FULLBRIGHT
/lighting calculation FLOOD --invalidate
```

---

### lighting invalidate

Invalidates lighting data, forcing recalculation.

| Property | Value |
|----------|-------|
| **Syntax** | `/lighting invalidate [--one]` |

**Parameters:**
- `--one` (flag) - Only invalidate the chunk section at the player's position

**Notes:**
- Without `--one`, invalidates all loaded chunks
- Requires player context when using `--one`

**Examples:**
```
/lighting invalidate
/lighting invalidate --one
```

---

## World Generation Commands

Commands for world generation management and benchmarking.

### worldgen

Parent command for world generation subcommands.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldgen <subcommand>` |
| **Aliases** | `wg` |

**Subcommands:**
- `reload` - Reload world generation settings
- `benchmark` - Benchmark world generation performance

---

### worldgen reload

Reloads the world generation configuration.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldgen reload [--clear]` |

**Parameters:**
- `--clear` (flag) - Delete all saved chunks and regenerate loaded chunks

**Warning:** Using `--clear` will delete all chunk data and regenerate the world.

**Examples:**
```
/worldgen reload
/wg reload
/worldgen reload --clear
```

---

### worldgen benchmark

Benchmarks world generation performance.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldgen benchmark <pos1> <pos2> [world] [seed]` |

**Parameters:**
- `pos1` - First corner coordinates (X, Z)
- `pos2` - Second corner coordinates (X, Z)
- `world` (optional) - Target world
- `seed` (optional) - Generation seed (uses world seed if not specified)

**Notes:**
- Generates chunks in the specified area for benchmarking
- Results are saved to the `quantification/` folder
- Only works with world generators that support benchmarking

**Examples:**
```
/worldgen benchmark 0,0 1000,1000
/wg benchmark -500,-500 500,500
/worldgen benchmark 0,0 2000,2000 MyWorld 12345
```

---

## Spawn Commands

Commands for spawning entities in the world.

### spawnblock

Spawns a block entity at a specified position.

| Property | Value |
|----------|-------|
| **Syntax** | `/spawnblock <block> <x> <y> <z> [rotation]` |

**Parameters:**
- `block` - Block type key to spawn
- `x y z` - Position coordinates (supports relative coordinates with ~)
- `rotation` (optional) - Rotation vector (yaw, pitch, roll)

**Examples:**
```
/spawnblock Chest ~ ~ ~
/spawnblock Torch 100 64 200
/spawnblock Lantern ~ ~2 ~ 0,45,0
```

---

## Additional Player Commands

Extended player management commands.

### player respawn

Forces a player to respawn.

| Property | Value |
|----------|-------|
| **Syntax** | `/player respawn [player]` |

**Parameters:**
- `player` (optional) - Target player (self if not specified)

**Notes:**
- Removes the death component, allowing the player to respawn

**Examples:**
```
/player respawn
/player respawn PlayerName
```

---

### player reset

Resets a player's data completely.

| Property | Value |
|----------|-------|
| **Syntax** | `/player reset [player]` |

**Parameters:**
- `player` (optional) - Target player (self if not specified)

**Warning:** This will reset all player data including inventory, stats, and progress.

**Examples:**
```
/player reset
/player reset PlayerName
```

---

### player zone

Displays the current zone and biome information.

| Property | Value |
|----------|-------|
| **Syntax** | `/player zone [player]` |

**Parameters:**
- `player` (optional) - Target player (self if not specified)

**Information displayed:**
- Current zone name
- Current biome name

**Examples:**
```
/player zone
/player zone PlayerName
```

---

### player viewradius

Manage player view radius settings.

| Property | Value |
|----------|-------|
| **Syntax** | `/player viewradius <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `get` | `/player viewradius get [player]` | Get current view radius |
| `set` | `/player viewradius set <radius> [--blocks] [--bypass] [player]` | Set view radius |

**Set parameters:**
- `radius` - View radius in chunks (or "default" for 32)
- `--blocks` (flag) - Interpret radius as blocks instead of chunks
- `--bypass` (flag) - Allow exceeding server maximum

**Examples:**
```
/player viewradius get
/player viewradius set 16
/player viewradius set 512 --blocks
/player viewradius set default
```

---

### sudo

Execute a command as another player.

| Property | Value |
|----------|-------|
| **Syntax** | `/sudo <player> <command>` |
| **Aliases** | `su` |

**Parameters:**
- `player` - Target player (or "*" for all players)
- `command` - Command to execute (with or without leading /)

**Examples:**
```
/sudo PlayerName gamemode creative
/sudo * notify Hello everyone!
/su PlayerName /whereami
```

---

### refer

Transfers a player to another server.

| Property | Value |
|----------|-------|
| **Syntax** | `/refer <host> <port> [player]` |
| **Aliases** | `transfer` |
| **Permission** | `refer.self`, `refer.other` |

**Parameters:**
- `host` - Target server hostname or IP
- `port` - Target server port (1-65535)
- `player` (optional) - Target player (self if not specified)

**Examples:**
```
/refer play.example.com 25565
/refer 192.168.1.100 25565 PlayerName
/transfer server.example.net 25566
```

---

### toggleBlockPlacementOverride

Toggles block placement restriction override.

| Property | Value |
|----------|-------|
| **Syntax** | `/toggleBlockPlacementOverride` |
| **Aliases** | `tbpo`, `togglePlacement` |

**Notes:**
- When enabled, allows placing blocks in restricted areas
- Useful for building in protected zones

**Examples:**
```
/toggleBlockPlacementOverride
/tbpo
/togglePlacement
```

---

## Additional Entity Commands

Extended entity management commands.

### entity nameplate

Set or remove entity nameplates.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity nameplate <text> [entity]` |

**Parameters:**
- `text` - The text to display on the nameplate
- `entity` (optional) - Entity ID (uses looked-at entity if not specified)

**Usage variants:**
- `/entity nameplate <text> [entity]` - Set nameplate text
- `/entity nameplate [entity]` - Remove nameplate

**Examples:**
```
/entity nameplate "Boss Monster"
/entity nameplate "Shop Keeper" 12345
/entity nameplate
```

---

### entity resend

Forces resending of all entity data to a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity resend <player>` |

**Parameters:**
- `player` - Target player to resend entities to

**Notes:**
- Despawns all entities for the player, causing them to be resent

**Examples:**
```
/entity resend PlayerName
```

---

### entity tracker

Displays entity tracker statistics for a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity tracker <player>` |

**Parameters:**
- `player` - Target player

**Information displayed:**
- Visible entity count
- LOD excluded count
- Hidden entity count
- Total tracked entities
- World total entity count
- View radius information

**Examples:**
```
/entity tracker PlayerName
```

---

### entity lod

Sets the entity Level of Detail (LOD) culling ratio.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity lod <ratio>` |

**Parameters:**
- `ratio` - LOD ratio value (e.g., 0.000035)

**Subcommands:**
- `/entity lod default` - Reset to default LOD ratio (0.000035)

**Examples:**
```
/entity lod 0.00005
/entity lod 0.00002
/entity lod default
```

---

### entity interactable

Makes an entity interactable or removes interactability.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity interactable [--disable] [entity]` |

**Parameters:**
- `--disable` (flag) - Remove interactability instead of adding it
- `entity` (optional) - Entity ID (uses looked-at entity if not specified)

**Examples:**
```
/entity interactable
/entity interactable --disable
/entity interactable 12345
```

---

### entity hidefromadventureplayers

Hides an entity from players in Adventure mode.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity hidefromadventureplayers [--remove] [entity]` |

**Parameters:**
- `--remove` (flag) - Remove hiding instead of adding it
- `entity` (optional) - Entity ID (uses looked-at entity if not specified)

**Examples:**
```
/entity hidefromadventureplayers
/entity hidefromadventureplayers --remove
/entity hidefromadventureplayers 12345
```

---

## Additional Chunk Commands

Extended chunk management commands.

### chunk fixheight

Fixes the heightmap for a chunk and recalculates lighting.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk fixheight <x> <z>` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)

**Notes:**
- Recalculates the chunk heightmap
- Invalidates and recalculates lighting
- Useful for fixing lighting glitches

**Examples:**
```
/chunk fixheight 0 0
/chunk fixheight ~ ~
```

---

### chunk forcetick

Forces all blocks in a chunk to tick.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk forcetick <x> <z>` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)

**Notes:**
- Sets all blocks in the chunk to ticking state
- Chunk must be loaded

**Examples:**
```
/chunk forcetick 0 0
/chunk forcetick ~ ~
```

---

### chunk loaded

Displays loaded chunk information for a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk loaded [player]` |

**Parameters:**
- `player` (optional) - Target player (self if not specified)

**Examples:**
```
/chunk loaded
/chunk loaded PlayerName
```

---

### chunk resend

Forces resending all chunks to a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk resend [--clearcache] [player]` |

**Parameters:**
- `--clearcache` (flag) - Also invalidate chunk section caches
- `player` (optional) - Target player (self if not specified)

**Examples:**
```
/chunk resend
/chunk resend --clearcache
/chunk resend PlayerName
```

---

### chunk tracker

Displays chunk tracker statistics for a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk tracker [player]` |

**Parameters:**
- `player` (optional) - Target player (self if not specified)

**Information displayed:**
- Max chunks per second/tick
- Min/max loaded chunk radius
- Loaded/loading player chunks
- World loaded chunks

**Examples:**
```
/chunk tracker
/chunk tracker PlayerName
```

---

### chunk maxsendrate

Gets or sets chunk sending rate limits.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk maxsendrate [--sec=<value>] [--tick=<value>] [player]` |

**Parameters:**
- `--sec` (optional) - Maximum chunks per second
- `--tick` (optional) - Maximum chunks per tick
- `player` (optional) - Target player (self if not specified)

**Examples:**
```
/chunk maxsendrate
/chunk maxsendrate --sec=50
/chunk maxsendrate --tick=5
/chunk maxsendrate --sec=100 --tick=10 PlayerName
```

---

### chunk marksave

Marks a chunk as needing to be saved.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk marksave <x> <z>` |

**Parameters:**
- `x z` - Chunk coordinates (supports relative coordinates with ~)

**Notes:**
- If chunk is not loaded, it will be loaded first

**Examples:**
```
/chunk marksave 0 0
/chunk marksave ~ ~
```

---

### chunk tint

Sets the tint color for a chunk.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk tint <color> [--blur] [--radius=<value>] [--sigma=<value>]` |

**Parameters:**
- `color` - Hex color value (e.g., #FF0000)
- `--blur` (flag) - Apply Gaussian blur to the tint
- `--radius` (optional) - Blur radius (default: 5)
- `--sigma` (optional) - Blur sigma value (default: 1.5)

**Usage variants:**
- `/chunk tint` - Opens the tint color picker UI

**Examples:**
```
/chunk tint #FF0000
/chunk tint #00FF00 --blur
/chunk tint #0000FF --blur --radius=10 --sigma=2.0
```

---

## Additional World Map Commands

Extended world map management commands.

### worldmap reload

Reloads the world map configuration.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldmap reload` |

**Examples:**
```
/worldmap reload
/map reload
```

---

### worldmap clearmarkers

Clears all world map markers for the player.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldmap clearmarkers` |

**Examples:**
```
/worldmap clearmarkers
/map clearmarkers
```

---

### worldmap viewradius

Manage world map view radius settings.

| Property | Value |
|----------|-------|
| **Syntax** | `/worldmap viewradius <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `get` | `/worldmap viewradius get [player]` | Get current view radius |
| `set` | `/worldmap viewradius set <radius> [--bypass] [player]` | Set view radius override |
| `remove` | `/worldmap viewradius remove [player]` | Remove view radius override |

**Set parameters:**
- `radius` - View radius value (max 512 without bypass)
- `--bypass` (flag) - Allow exceeding maximum limit

**Examples:**
```
/worldmap viewradius get
/worldmap viewradius set 256
/worldmap viewradius set 1024 --bypass
/worldmap viewradius remove
```

---

## NPC Commands

Commands for spawning and managing NPCs (Non-Player Characters) and AI entities.

### npc spawn

Spawns an NPC entity with a specified role.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc spawn <role> [count] [radius] [flags] [options...]` |

**Parameters:**
- `role` - The NPC role template to spawn
- `count` (optional) - Number of NPCs to spawn (default: 1)
- `radius` (optional) - Spawn radius around player (default: 8.0)
- `flags` (optional) - Comma-separated debug flags
- `speed` (optional) - Initial velocity speed
- `position` (optional) - Exact spawn position (x,y,z format)
- `posOffset` (optional) - Position offset (x,y,z format)
- `headRotation` (optional) - Head rotation (yaw,pitch,roll format)
- `bodyRotation` (optional) - Body rotation (yaw,pitch,roll format)
- `flock` (optional) - Flock size or flock asset name
- `scale` (optional) - Model scale factor

**Flags:**
- `--nonrandom` - Use deterministic positioning
- `--randomRotation` - Apply random rotation to spawned NPCs
- `--facingRotation` - Face the player
- `--test` - Test spawn location validity
- `--spawnOnGround` - Force ground-level spawning
- `--frozen` - Spawn NPC in frozen state
- `--randomModel` - Apply random skin/model
- `--bypassScaleLimits` - Allow exceeding scale limits

**Examples:**
```
/npc spawn Trork
/npc spawn Kweebec 5 10
/npc spawn Trork --frozen
/npc spawn Kweebec --position=100,64,200
/npc spawn Trork --scale=1.5 --bypassScaleLimits
```

---

### npc freeze

Freezes NPC entities, stopping their AI behavior.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc freeze [--all] [--toggle] [entity]` |

**Parameters:**
- `--all` (flag) - Freeze all NPCs and items in the world
- `--toggle` (flag) - Toggle freeze state instead of always freezing
- `entity` (optional) - Target entity ID (uses looked-at entity if not specified)

**Examples:**
```
/npc freeze
/npc freeze --all
/npc freeze --toggle
/npc freeze 12345
```

---

### npc thaw

Unfreezes NPC entities, resuming their AI behavior.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc thaw [--all] [entity]` |
| **Aliases** | `unfreeze` |

**Parameters:**
- `--all` (flag) - Unfreeze all NPCs in the world
- `entity` (optional) - Target entity ID (uses looked-at entity if not specified)

**Examples:**
```
/npc thaw
/npc thaw --all
/npc thaw 12345
```

---

### npc clean

Removes all NPC entities from the current world.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc clean` |

**Warning:** This is a destructive command that removes all NPCs.

**Examples:**
```
/npc clean
```

---

### npc dump

Dumps NPC role component hierarchy to the server log.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc dump [--json] [entity]` |

**Parameters:**
- `--json` (flag) - Output in JSON format
- `entity` (optional) - Target entity ID (uses looked-at entity if not specified)

**Examples:**
```
/npc dump
/npc dump --json
```

---

### npc give

Gives an item to an NPC entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc give <item> [entity]` |

**Parameters:**
- `item` - Item asset ID to give (sets as weapon or armor)
- `entity` (optional) - Target entity ID

**Subcommands:**
- `/npc give nothing [entity]` - Remove held item from NPC

**Examples:**
```
/npc give Sword_Iron
/npc give Armor_Trork_Chainmail
/npc give nothing
```

---

### npc role

Gets or sets the role of an NPC entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc role [role] [entity]` |

**Parameters:**
- `role` (optional) - New role to assign. If not specified, displays current role.
- `entity` (optional) - Target entity ID

**Examples:**
```
/npc role
/npc role Trork_Warrior
/npc role Kweebec 12345
```

---

### npc path

Sets a movement path for an NPC.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc path <instructions> [entity]` |

**Parameters:**
- `instructions` - Comma-separated rotation,distance pairs (e.g., "90,5,0,10" = turn 90deg walk 5, go straight 10)

**Subcommands:**
- `/npc path polygon <sides> [length] [entity]` - Create polygon path

**Examples:**
```
/npc path 90,5,0,10,-90,3
/npc path polygon 4
/npc path polygon 6 10
```

---

### npc attack

Sets or clears attack sequence overrides for an NPC.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc attack [attack...] [entity]` |

**Subcommands:**
- `/npc attack clear [entity]` - Clear attack overrides

**Parameters:**
- `attack` (optional) - List of interaction asset IDs for attack sequence

**Examples:**
```
/npc attack Slash_Light Slash_Heavy
/npc attack clear
```

---

### npc debug

Manages NPC debug visualization flags.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc debug <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `show` | `/npc debug show [entity]` | Show current debug flags |
| `set` | `/npc debug set <flags> [entity]` | Set debug flags |
| `toggle` | `/npc debug toggle <flags> [entity]` | Toggle debug flags |
| `defaults` | `/npc debug defaults [entity]` | Reset to default flags |
| `clear` | `/npc debug clear [entity]` | Clear all debug flags |
| `presets` | `/npc debug presets [preset]` | List presets or show preset info |

**Examples:**
```
/npc debug show
/npc debug set pathfinding,combat
/npc debug toggle sensors
/npc debug presets
/npc debug defaults
```

---

### npc step

Advances NPC simulation by one tick while frozen.

| Property | Value |
|----------|-------|
| **Syntax** | `/npc step [--all] [dt] [entity]` |

**Parameters:**
- `--all` (flag) - Step all NPCs
- `dt` (optional) - Delta time for step (default: 1/TPS)
- `entity` (optional) - Target entity ID

**Examples:**
```
/npc step
/npc step --all
/npc step 0.05
```

---

### npc blackboard

Manages NPC blackboard data (shared AI knowledge).

| Property | Value |
|----------|-------|
| **Syntax** | `/npc blackboard <subcommand>` |

**Subcommands:**
- `chunks` - List tracked chunks
- `chunk <x> <z>` - Show chunk data
- `drop` - Drop blackboard data
- `views` - List registered views
- `view <type>` - Show view data
- `blockevents` - Show block event subscriptions
- `entityevents` - Show entity event subscriptions
- `resourceviews` - List resource views
- `resourceview <type>` - Show resource view data
- `reserve <position>` - Reserve interaction at position
- `reservation <position>` - Check reservation status

**Examples:**
```
/npc blackboard chunks
/npc blackboard views
/npc blackboard blockevents
```

---

### npc flock

Manages NPC flock behavior (group movement).

| Property | Value |
|----------|-------|
| **Syntax** | `/npc flock <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `grab` | `/npc flock grab` | Add NPCs in view to your flock |
| `join` | `/npc flock join` | Join the flock of an NPC in view |
| `leave` | `/npc flock leave` | Remove NPCs in view from flocks |
| `playerleave` | `/npc flock playerleave` | Leave your current flock |

**Examples:**
```
/npc flock grab
/npc flock join
/npc flock leave
/npc flock playerleave
```

---

## Network Commands

Commands for network debugging and latency simulation.

### network latencysimulation

Simulates network latency for testing purposes.

| Property | Value |
|----------|-------|
| **Syntax** | `/network latencysimulation <subcommand>` |
| **Aliases** | `net`, `latsim` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `set` | `/network latencysimulation set <delay> [player]` | Set latency in milliseconds |
| `reset` | `/network latencysimulation reset [player]` | Clear simulated latency |

**Examples:**
```
/network latencysimulation set 100
/net latsim set 200 PlayerName
/network latencysimulation reset
```

---

### network serverknockback

Toggles server-side knockback prediction.

| Property | Value |
|----------|-------|
| **Syntax** | `/network serverknockback` |

**Examples:**
```
/network serverknockback
```

---

### network debugknockback

Toggles knockback position debugging.

| Property | Value |
|----------|-------|
| **Syntax** | `/network debugknockback` |

**Examples:**
```
/network debugknockback
```

---

## Prefab Commands

Commands for managing and converting prefab structures.

### convertprefabs

Converts and updates prefab files.

| Property | Value |
|----------|-------|
| **Syntax** | `/convertprefabs [--blocks] [--filler] [--relative] [--entities] [--destructive] [path] [store]` |

**Parameters:**
- `--blocks` (flag) - Reserialize block states
- `--filler` (flag) - Fix filler block data
- `--relative` (flag) - Convert to relative coordinates
- `--entities` (flag) - Reserialize entity data
- `--destructive` (flag) - Allow destructive modifications
- `path` (optional) - Specific path to convert
- `store` (optional) - Prefab store: "asset", "server", "worldgen", or "all" (default: "asset")

**Examples:**
```
/convertprefabs
/convertprefabs --blocks --entities
/convertprefabs --filler --destructive
/convertprefabs store=worldgen
```

---

## Asset Commands

Commands for managing and debugging game assets.

### assets

Parent command for asset management subcommands.

| Property | Value |
|----------|-------|
| **Syntax** | `/assets <subcommand>` |

**Subcommands:**
- `tags` - Asset tag management
- `duplicates` - Find duplicate assets
- `longest` - Find longest asset names per type

**Examples:**
```
/assets tags
/assets duplicates
/assets longest
```

---

## Server Debug Commands

Extended server debugging and monitoring commands.

### server gc

Forces a garbage collection cycle.

| Property | Value |
|----------|-------|
| **Syntax** | `/server gc` |

**Information displayed:**
- Memory freed (or increased) by GC

**Examples:**
```
/server gc
```

---

### server dump

Creates a server state dump for debugging.

| Property | Value |
|----------|-------|
| **Syntax** | `/server dump [--json]` |

**Parameters:**
- `--json` (flag) - Export as JSON format

**Examples:**
```
/server dump
/server dump --json
```

---

## Sleep Commands

Commands for testing and configuring server tick timing.

### sleep offset

Gets or sets the sleep timing offset.

| Property | Value |
|----------|-------|
| **Syntax** | `/sleep offset [offset] [--percent]` |

**Parameters:**
- `offset` (optional) - New offset value. If not specified, displays current value.
- `--percent` (flag) - Display/set as percentage

**Examples:**
```
/sleep offset
/sleep offset 1000
/sleep offset --percent
```

---

### sleep test

Benchmarks system sleep accuracy.

| Property | Value |
|----------|-------|
| **Syntax** | `/sleep test [sleep] [count]` |

**Parameters:**
- `sleep` (optional) - Sleep duration in milliseconds (default: 10)
- `count` (optional) - Number of iterations (default: 1000)

**Information displayed:**
- Delta time (min, max, average)
- Offset from expected (min, max, average)

**Examples:**
```
/sleep test
/sleep test 20 500
```

---

## Packet Statistics Commands

Commands for analyzing network packet data.

### packetstats

Displays detailed statistics for a specific packet type.

| Property | Value |
|----------|-------|
| **Syntax** | `/packetstats <packet> [player]` |

**Parameters:**
- `packet` - Packet type name to analyze
- `player` (optional) - Target player

**Information displayed:**
- Packet ID
- Sent statistics (count, size, compressed/uncompressed, avg, min, max)
- Received statistics
- Recent traffic data

**Examples:**
```
/packetstats ChunkData
/packetstats EntityPosition PlayerName
```

---

## Pack Commands

Commands for managing loaded asset packs.

### packs list

Lists all loaded asset packs.

| Property | Value |
|----------|-------|
| **Syntax** | `/packs list` |
| **Aliases** | `ls` |

**Information displayed:**
- Pack name
- Pack root directory

**Examples:**
```
/packs list
/packs ls
```

---

## Stress Test Commands

Commands for server performance stress testing.

### stresstest start

Starts a stress test by spawning bot clients.

| Property | Value |
|----------|-------|
| **Syntax** | `/stresstest start [options...]` |

**Parameters:**
- `name` (optional) - Test name for output files
- `initcount` (optional) - Initial bot count (default: 0)
- `interval` (optional) - Seconds between adding bots (default: 30)
- `dumptype` (optional) - When to dump metrics: NEW_BOT, INTERVAL, FINISH, NEVER
- `dumpinterval` (optional) - Seconds between dumps (default: 300)
- `threshold` (optional) - Tick time threshold in ms
- `percentile` (optional) - Percentile for threshold (default: 0.95)
- `viewradius` (optional) - Bot view radius (default: 192)
- `radius` (optional) - Bot movement radius (default: 384)
- `yheight` (optional) - Bot Y coordinate (default: 125)
- `flySpeed` (optional) - Bot movement speed (default: 8.0)
- `--shutdown` (flag) - Shutdown server when threshold exceeded

**Examples:**
```
/stresstest start
/stresstest start --initcount=10 --interval=60
/stresstest start --name=test1 --threshold=50
```

---

### stresstest stop

Stops the running stress test.

| Property | Value |
|----------|-------|
| **Syntax** | `/stresstest stop` |

**Examples:**
```
/stresstest stop
```

---

## Container Commands

Commands for managing block containers and inventories.

### stash

Gets or sets the droplist for a container block.

| Property | Value |
|----------|-------|
| **Syntax** | `/stash [set]` |

**Parameters:**
- `set` (optional) - Droplist name to assign to the targeted container

**Requirements:**
- Must be looking at a container block within 10 blocks

**Examples:**
```
/stash
/stash MyDroplist
```

---

## Event Commands

Commands for displaying event notifications.

### eventtitle

Displays an event title to all players.

| Property | Value |
|----------|-------|
| **Syntax** | `/eventtitle [--major] [--secondary=<text>] <title>` |

**Parameters:**
- `title` - Primary title text to display
- `--major` (flag) - Display as major (larger) event
- `--secondary` (optional) - Secondary subtitle text (default: "Event")

**Examples:**
```
/eventtitle Boss Defeated!
/eventtitle --major Victory!
/eventtitle --secondary="World Event" Dragon Awakens
```

---

## Additional Debug Commands

Advanced debugging and testing commands.

### debugplayerposition

Displays detailed position and rotation information for debugging.

| Property | Value |
|----------|-------|
| **Syntax** | `/debugplayerposition` |

**Information displayed:**
- Body position (X, Y, Z)
- Body rotation (Pitch, Yaw, Roll)
- Head rotation (Pitch, Yaw, Roll)
- Pending teleport status
- Visual debug sphere at player position

**Examples:**
```
/debugplayerposition
```

---

### hitdetection

Toggles visual debugging for hit detection.

| Property | Value |
|----------|-------|
| **Syntax** | `/hitdetection` |

**Notes:**
- Enables/disables visual debug display for select interactions
- Useful for debugging combat and interaction hit boxes

**Examples:**
```
/hitdetection
```

---

### hudtest

Tests showing and hiding HUD components.

| Property | Value |
|----------|-------|
| **Syntax** | `/hudtest [--reset] [player]` |

**Parameters:**
- `--reset` (flag) - Show the hotbar instead of hiding it
- `player` (optional) - Target player

**Notes:**
- Without `--reset`, hides the hotbar HUD component
- With `--reset`, shows the hotbar HUD component

**Examples:**
```
/hudtest
/hudtest --reset
/hudtest PlayerName
```

---

### messagetest

Tests sending messages with nested translated parameter messages.

| Property | Value |
|----------|-------|
| **Syntax** | `/messagetest` |
| **Aliases** | `msgtest` |

**Notes:**
- Developer command for testing message translation system
- Displays example nested translated message

**Examples:**
```
/messagetest
/msgtest
```

---

### builderToolsLegend

Shows or hides the builder tools HUD legend.

| Property | Value |
|----------|-------|
| **Syntax** | `/builderToolsLegend [--hide]` |
| **Game Mode** | Creative |

**Parameters:**
- `--hide` (flag) - Hide the builder tools legend instead of showing it

**Notes:**
- Always shows the material slot selector
- Shows/hides the builder tools legend panel

**Examples:**
```
/builderToolsLegend
/builderToolsLegend --hide
```

---

### networkChunkSending

Controls whether chunks are sent over the network to the player.

| Property | Value |
|----------|-------|
| **Syntax** | `/networkChunkSending <enabled>` |

**Parameters:**
- `enabled` - Boolean value (true/false) to enable or disable chunk sending

**Notes:**
- Useful for debugging network chunk transmission
- Disabling stops new chunks from being sent to the player

**Examples:**
```
/networkChunkSending true
/networkChunkSending false
```

---

### pidcheck

Checks if a process ID is currently running.

| Property | Value |
|----------|-------|
| **Syntax** | `/pidcheck [--singleplayer] [pid]` |

**Parameters:**
- `--singleplayer` (flag) - Check the client PID in singleplayer mode
- `pid` (optional) - Process ID to check

**Notes:**
- In singleplayer mode, checks if the client process is still running
- Useful for debugging process management and server lifecycle

**Examples:**
```
/pidcheck 12345
/pidcheck --singleplayer
```

---

### validatecpb

Validates and tests loading of prefab files.

| Property | Value |
|----------|-------|
| **Syntax** | `/validatecpb [path]` |

**Parameters:**
- `path` (optional) - Specific path to validate. If not provided, validates all asset packs.

**Notes:**
- Asynchronously loads and validates all `.prefab.json` files
- Reports errors for missing blocks or entity models
- Results are logged to the console

**Examples:**
```
/validatecpb
/validatecpb C:/path/to/assets
```

---

## Hitbox Collision Commands

Commands for managing hitbox collision components on entities.

### hitboxcollision

Parent command for hitbox collision management.

| Property | Value |
|----------|-------|
| **Syntax** | `/hitboxcollision <subcommand>` |

**Subcommands:**
- `add` - Add hitbox collision to an entity
- `remove` - Remove hitbox collision from an entity

---

### hitboxcollision add

Adds a hitbox collision component to an entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/hitboxcollision add <entity\|self> <hitboxCollisionConfig> [entity]` |

**Subcommands:**
- `entity` - Add hitbox collision to a specific entity
- `self` - Add hitbox collision to yourself or target player

**Parameters:**
- `hitboxCollisionConfig` - The hitbox collision configuration asset
- `entity` (optional) - Target entity ID

**Examples:**
```
/hitboxcollision add entity Player_Hitbox 12345
/hitboxcollision add self Player_Hitbox
```

---

### hitboxcollision remove

Removes the hitbox collision component from an entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/hitboxcollision remove <entity\|self> [entity]` |

**Subcommands:**
- `entity` - Remove hitbox collision from a specific entity
- `self` - Remove hitbox collision from yourself or target player

**Parameters:**
- `entity` (optional) - Target entity ID

**Examples:**
```
/hitboxcollision remove entity 12345
/hitboxcollision remove self
```

---

## Repulsion Commands

Commands for managing entity repulsion components (push-back effects).

### repulsion

Parent command for repulsion management.

| Property | Value |
|----------|-------|
| **Syntax** | `/repulsion <subcommand>` |

**Subcommands:**
- `add` - Add repulsion to an entity
- `remove` - Remove repulsion from an entity

---

### repulsion add

Adds a repulsion component to an entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/repulsion add <entity\|self> <repulsionConfig> [entity]` |

**Subcommands:**
- `entity` - Add repulsion to a specific entity
- `self` - Add repulsion to yourself or target player

**Parameters:**
- `repulsionConfig` - The repulsion configuration asset
- `entity` (optional) - Target entity ID

**Examples:**
```
/repulsion add entity Standard_Repulsion 12345
/repulsion add self Player_Repulsion
```

---

### repulsion remove

Removes the repulsion component from an entity.

| Property | Value |
|----------|-------|
| **Syntax** | `/repulsion remove <entity\|self> [entity]` |

**Subcommands:**
- `entity` - Remove repulsion from a specific entity
- `self` - Remove repulsion from yourself or target player

**Parameters:**
- `entity` (optional) - Target entity ID

**Examples:**
```
/repulsion remove entity 12345
/repulsion remove self
```

---

## Git Update Commands

Commands for managing assets and prefabs through Git operations.

### update

Parent command for Git update operations.

| Property | Value |
|----------|-------|
| **Syntax** | `/update <subcommand>` |

**Subcommands:**
- `assets` - Manage assets repository
- `prefabs` - Manage prefabs repository

---

### update assets

Git operations for the assets repository.

| Property | Value |
|----------|-------|
| **Syntax** | `/update assets <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `status` | `/update assets status` | Run git status on assets |
| `reset` | `/update assets reset` | Reset assets to HEAD (git reset --hard head) |
| `pull` | `/update assets pull` | Pull latest assets changes |

**Examples:**
```
/update assets status
/update assets pull
/update assets reset
```

---

### update prefabs

Git operations for the prefabs repository.

| Property | Value |
|----------|-------|
| **Syntax** | `/update prefabs <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `status` | `/update prefabs status` | Run git status on prefabs |
| `commit` | `/update prefabs commit` | Commit prefab changes |
| `pull` | `/update prefabs pull` | Pull latest prefab changes |
| `push` | `/update prefabs push` | Push prefab changes to remote |
| `all` | `/update prefabs all` | Commit, pull, and push all changes |

**Notes:**
- Commit messages automatically include the sender's display name
- Operations are performed on both main repo and submodules

**Examples:**
```
/update prefabs status
/update prefabs commit
/update prefabs pull
/update prefabs push
/update prefabs all
```

---

## Meta Commands

Commands for inspecting and dumping command system information.

### commands dump

Dumps all registered commands to a JSON file.

| Property | Value |
|----------|-------|
| **Syntax** | `/commands dump` |

**Notes:**
- Creates a JSON file at `dumps/commands.dump.json`
- Contains command names, class names, owners, and permissions
- Useful for debugging and documentation

**Examples:**
```
/commands dump
```

---

## Entity Snapshot Commands

Commands for managing entity snapshot history (used for lag compensation and replay).

### entity snapshot

Parent command for entity snapshot operations.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity snapshot <subcommand>` |
| **Aliases** | `snap` |

**Subcommands:**
- `length` - Set snapshot history length
- `history` - Visualize snapshot history

---

### entity snapshot length

Sets the length of entity snapshot history.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity snapshot length <length>` |

**Parameters:**
- `length` - History length in milliseconds

**Notes:**
- Controls how far back entity positions are tracked
- Used for server-side lag compensation

**Examples:**
```
/entity snapshot length 500
/entity snapshot length 1000
```

---

### entity snapshot history

Visualizes entity snapshot history with particle effects.

| Property | Value |
|----------|-------|
| **Syntax** | `/entity snapshot history` |

**Notes:**
- Spawns particle effects at historical entity positions
- Shows all tracked positions from oldest to current tick
- Useful for debugging entity position tracking

**Examples:**
```
/entity snapshot history
```

---

## Additional Chunk Commands

### chunk lighting

Dumps chunk lighting octree data to the server log.

| Property | Value |
|----------|-------|
| **Syntax** | `/chunk lighting <x> <y> <z>` |

**Parameters:**
- `x y z` - Block coordinates (supports relative coordinates with ~)

**Notes:**
- Outputs lighting octree structure to server log
- Chunk must be loaded
- Useful for debugging lighting issues

**Examples:**
```
/chunk lighting 0 64 0
/chunk lighting ~ ~ ~
```

---

## Additional Server Stats Commands

### server stats gc

Displays garbage collection statistics.

| Property | Value |
|----------|-------|
| **Syntax** | `/server stats gc` |

**Information displayed:**
- GC collector name
- Memory pool names
- Collection count
- Total collection time

**Examples:**
```
/server stats gc
```

---

## Teleportation Commands

Commands for teleporting players to different locations and worlds.

### tp

Teleports players to coordinates or other players.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp <x> <y> <z> [yaw] [pitch] [roll]` |
| **Aliases** | `teleport` |
| **Permission** | `teleport.*` |
| **Game Mode** | Creative |

**Usage variants:**
- `/tp <x> <y> <z>` - Teleport yourself to coordinates
- `/tp <player> <x> <y> <z>` - Teleport a player to coordinates
- `/tp <player>` - Teleport yourself to a player
- `/tp <player1> <player2>` - Teleport player1 to player2

**Parameters:**
- `x y z` - Target coordinates (supports relative coordinates with ~)
- `yaw` (optional) - Horizontal rotation angle
- `pitch` (optional) - Vertical rotation angle
- `roll` (optional) - Roll rotation angle

**Examples:**
```
/tp 100 64 200
/tp ~ ~10 ~
/tp PlayerName
/tp PlayerName 0 100 0
```

---

### tp all

Teleports all players in a world to specified coordinates.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp all <x> <y> <z> [yaw] [pitch] [roll] [world]` |
| **Permission** | `teleport.all` |

**Parameters:**
- `x y z` - Target coordinates (supports relative coordinates with ~)
- `yaw` (optional) - Horizontal rotation angle
- `pitch` (optional) - Vertical rotation angle
- `roll` (optional) - Roll rotation angle
- `world` (optional) - Target world (uses sender's world if not specified)

**Examples:**
```
/tp all 0 100 0
/tp all ~ ~ ~ 90 0 0
/tp all 100 64 200 0 0 0 MyWorld
```

---

### tp home

Teleports the player to their spawn point.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp home` |
| **Permission** | `teleport.home` |

**Examples:**
```
/tp home
```

---

### tp top

Teleports the player to the highest block at their current position.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp top` |
| **Permission** | `teleport.top` |

**Notes:**
- Useful for escaping underground areas
- Chunk must be loaded at the player's position

**Examples:**
```
/tp top
```

---

### tp back

Returns the player to their previous location.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp back [count]` |
| **Permission** | `teleport.back` |

**Parameters:**
- `count` (optional) - Number of positions to go back in history (default: 1)

**Examples:**
```
/tp back
/tp back 3
```

---

### tp forward

Advances the player forward in their teleport history.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp forward [count]` |
| **Permission** | `teleport.forward` |

**Parameters:**
- `count` (optional) - Number of positions to go forward in history (default: 1)

**Examples:**
```
/tp forward
/tp forward 2
```

---

### tp history

Displays the player's teleport history.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp history` |
| **Permission** | `teleport.history` |

**Examples:**
```
/tp history
```

---

### tp world

Teleports the player to another world's spawn point.

| Property | Value |
|----------|-------|
| **Syntax** | `/tp world <worldName>` |
| **Permission** | `teleport.world` |

**Parameters:**
- `worldName` - Name of the target world

**Examples:**
```
/tp world Nether
/tp world MyCustomWorld
```

---

## Warp Commands

Commands for managing and using warp points (saved locations).

### warp

Teleports to a saved warp location.

| Property | Value |
|----------|-------|
| **Syntax** | `/warp <name>` |

**Parameters:**
- `name` - Name of the warp point

**Subcommands:**
- `go` - Go to a warp point
- `set` - Create a new warp point
- `list` - List all warp points
- `remove` - Remove a warp point
- `reload` - Reload warp configuration

**Examples:**
```
/warp spawn
/warp town_center
```

---

### warp set

Creates a new warp point at the current location.

| Property | Value |
|----------|-------|
| **Syntax** | `/warp set <name>` |
| **Permission** | `warp.set` |

**Parameters:**
- `name` - Name for the new warp point

**Notes:**
- Reserved keywords (reload, remove, set, list, go) cannot be used as warp names

**Examples:**
```
/warp set spawn
/warp set arena
```

---

### warp list

Lists all available warp points.

| Property | Value |
|----------|-------|
| **Syntax** | `/warp list` |

**Examples:**
```
/warp list
```

---

### warp remove

Removes a warp point.

| Property | Value |
|----------|-------|
| **Syntax** | `/warp remove <name>` |
| **Permission** | `warp.remove` |

**Parameters:**
- `name` - Name of the warp point to remove

**Examples:**
```
/warp remove old_spawn
```

---

### warp reload

Reloads the warp configuration from disk.

| Property | Value |
|----------|-------|
| **Syntax** | `/warp reload` |

**Examples:**
```
/warp reload
```

---

## Time Commands

Commands for managing world time.

### time

Displays or sets the current world time.

| Property | Value |
|----------|-------|
| **Syntax** | `/time [hours]` |
| **Aliases** | `daytime` |
| **Game Mode** | Creative |

**Parameters:**
- `hours` (optional) - Time of day in hours (0-24). If not specified, displays current time.

**Subcommands:**
- `set` - Set time to specific value
- `Dawn` / `day` / `morning` - Set time to dawn
- `Midday` / `noon` - Set time to midday
- `Dusk` / `night` - Set time to dusk
- `Midnight` - Set time to midnight
- `pause` / `stop` - Pause time progression
- `dilation` - Set time dilation factor

**Examples:**
```
/time
/time 12
/time set 6
/time Dawn
/time Midnight
```

---

### time pause

Pauses or resumes time progression.

| Property | Value |
|----------|-------|
| **Syntax** | `/time pause` |
| **Aliases** | `stop` |

**Examples:**
```
/time pause
/time stop
```

---

### time dilation

Sets the time dilation factor (how fast time passes).

| Property | Value |
|----------|-------|
| **Syntax** | `/time dilation <factor>` |

**Parameters:**
- `factor` - Time dilation multiplier (0.01 to 4.0)

**Notes:**
- Values greater than 1.0 make time pass faster
- Values less than 1.0 make time pass slower

**Examples:**
```
/time dilation 2.0
/time dilation 0.5
```

---

## Weather Commands

Commands for managing world weather.

### weather

Parent command for weather management.

| Property | Value |
|----------|-------|
| **Syntax** | `/weather <subcommand>` |

**Subcommands:**
- `set` - Set the current weather
- `get` - Get the current weather
- `reset` - Reset weather to natural progression

---

### weather set

Sets the forced weather for the world.

| Property | Value |
|----------|-------|
| **Syntax** | `/weather set <weather>` |

**Parameters:**
- `weather` - Weather asset ID to set

**Examples:**
```
/weather set Clear
/weather set Rain
/weather set Storm
```

---

### weather get

Displays the current forced weather.

| Property | Value |
|----------|-------|
| **Syntax** | `/weather get` |

**Information displayed:**
- Current forced weather (or "not locked" if weather is natural)

**Examples:**
```
/weather get
```

---

### weather reset

Resets weather to natural progression.

| Property | Value |
|----------|-------|
| **Syntax** | `/weather reset` |

**Examples:**
```
/weather reset
```

---

## World Management Commands

Commands for managing worlds and world configuration.

### world

Parent command for world management.

| Property | Value |
|----------|-------|
| **Syntax** | `/world <subcommand>` |
| **Aliases** | `worlds` |

**Subcommands:**
- `list` - List all worlds
- `add` - Create a new world
- `remove` - Remove a world
- `load` - Load a world
- `save` - Save a world
- `setdefault` - Set the default world
- `pause` - Pause world simulation
- `config` - Configure world settings
- `settings` - View/edit world settings
- `perf` - Performance statistics
- `tps` - Set tick rate
- `prune` - Remove unused chunks

---

### world list

Lists all loaded worlds.

| Property | Value |
|----------|-------|
| **Syntax** | `/world list` |
| **Aliases** | `ls` |

**Examples:**
```
/world list
/world ls
```

---

### world save

Saves world data to disk.

| Property | Value |
|----------|-------|
| **Syntax** | `/world save [world] [--all]` |

**Parameters:**
- `world` (optional) - Specific world to save
- `--all` (flag) - Save all worlds

**Examples:**
```
/world save MyWorld
/world save --all
```

---

### world tps

Gets or sets the world tick rate.

| Property | Value |
|----------|-------|
| **Syntax** | `/world tps <rate>` |
| **Aliases** | `tickrate` |

**Parameters:**
- `rate` - Tick rate in ticks per second (1-2048)

**Subcommands:**
- `reset` - Reset tick rate to default

**Examples:**
```
/world tps 20
/world tps 60
/world tps reset
```

---

### world config setspawn

Sets the world spawn point.

| Property | Value |
|----------|-------|
| **Syntax** | `/world config setspawn [position] [rotation]` |

**Parameters:**
- `position` (optional) - Spawn coordinates (uses player position if not specified)
- `rotation` (optional) - Spawn rotation (uses player rotation if not specified)

**Subcommands:**
- `default` - Reset to default spawn provider

**Examples:**
```
/world config setspawn
/world config setspawn 0 100 0
/world config setspawn 0 100 0 0,0,0
```

---

### world config pvp

Enables or disables PvP in the world.

| Property | Value |
|----------|-------|
| **Syntax** | `/world config pvp <enabled>` |

**Parameters:**
- `enabled` - Boolean value (true/false)

**Examples:**
```
/world config pvp true
/world config pvp false
```

---

## Access Control Commands

Commands for managing player bans and whitelists.

### ban

Bans a player from the server.

| Property | Value |
|----------|-------|
| **Syntax** | `/ban <username> [reason]` |

**Parameters:**
- `username` - Username of the player to ban
- `reason` (optional) - Reason for the ban (default: "No reason.")

**Notes:**
- Not available in singleplayer mode
- If the player is online, they will be disconnected immediately

**Examples:**
```
/ban PlayerName
/ban PlayerName Griefing the spawn area
```

---

### unban

Removes a ban from a player.

| Property | Value |
|----------|-------|
| **Syntax** | `/unban <username>` |

**Parameters:**
- `username` - Username of the player to unban

**Notes:**
- Not available in singleplayer mode

**Examples:**
```
/unban PlayerName
```

---

### whitelist

Parent command for whitelist management.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist <subcommand>` |

**Subcommands:**
- `add` - Add a player to the whitelist
- `remove` - Remove a player from the whitelist
- `enable` - Enable the whitelist
- `disable` - Disable the whitelist
- `clear` - Clear the whitelist
- `status` - Check whitelist status
- `list` - List whitelisted players

---

### whitelist add

Adds a player to the whitelist.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist add <username>` |

**Parameters:**
- `username` - Username of the player to add

**Examples:**
```
/whitelist add PlayerName
```

---

### whitelist remove

Removes a player from the whitelist.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist remove <username>` |

**Parameters:**
- `username` - Username of the player to remove

**Examples:**
```
/whitelist remove PlayerName
```

---

### whitelist enable

Enables the whitelist.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist enable` |

**Examples:**
```
/whitelist enable
```

---

### whitelist disable

Disables the whitelist.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist disable` |

**Examples:**
```
/whitelist disable
```

---

### whitelist status

Displays the current whitelist status.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist status` |

**Examples:**
```
/whitelist status
```

---

### whitelist list

Lists all whitelisted players.

| Property | Value |
|----------|-------|
| **Syntax** | `/whitelist list` |

**Examples:**
```
/whitelist list
```

---

## Block Commands

Commands for manipulating blocks in the world.

### block

Parent command for block manipulation.

| Property | Value |
|----------|-------|
| **Syntax** | `/block <subcommand>` |
| **Aliases** | `blocks` |
| **Game Mode** | Creative |

**Subcommands:**
- `set` - Set a block at a position
- `get` - Get block information at a position
- `getstate` - Get block state at a position
- `setstate` - Set block state at a position
- `setticking` - Set block ticking state
- `row` - Place a row of blocks
- `bulk` - Bulk block operations
- `inspectphysics` - Inspect block physics
- `inspectfiller` - Inspect filler blocks
- `inspectrotation` - Inspect block rotation

---

### block set

Places a block at a position.

| Property | Value |
|----------|-------|
| **Syntax** | `/block set <block> <x> <y> <z>` |

**Parameters:**
- `block` - Block type to place
- `x y z` - Block coordinates (supports relative coordinates with ~)

**Examples:**
```
/block set Stone 100 64 200
/block set Glass ~ ~1 ~
```

---

### block get

Gets information about a block at a position.

| Property | Value |
|----------|-------|
| **Syntax** | `/block get <x> <y> <z>` |

**Parameters:**
- `x y z` - Block coordinates (supports relative coordinates with ~)

**Examples:**
```
/block get 100 64 200
/block get ~ ~-1 ~
```

---

## Particle Commands

Commands for spawning particle effects.

### particle spawn

Spawns a particle effect at the player's location.

| Property | Value |
|----------|-------|
| **Syntax** | `/particle spawn <particle> [player]` |

**Parameters:**
- `particle` - Particle system asset ID
- `player` (optional) - Target player

**Notes:**
- Without a particle argument, opens the particle spawn UI page

**Examples:**
```
/particle spawn Fire_Burst
/particle spawn Smoke_Puff PlayerName
```

---

## Plugin Commands

Commands for managing server plugins.

### plugin

Parent command for plugin management.

| Property | Value |
|----------|-------|
| **Syntax** | `/plugin <subcommand>` |
| **Aliases** | `plugins`, `pl` |

**Subcommands:**
- `list` - List all loaded plugins
- `load` - Load a plugin
- `unload` - Unload a plugin
- `reload` - Reload a plugin
- `manage` - Open plugin management UI

---

### plugin list

Lists all loaded plugins.

| Property | Value |
|----------|-------|
| **Syntax** | `/plugin list` |
| **Aliases** | `ls` |

**Examples:**
```
/plugin list
/plugin ls
```

---

### plugin load

Loads a plugin.

| Property | Value |
|----------|-------|
| **Syntax** | `/plugin load <pluginName> [--boot]` |
| **Aliases** | `l` |

**Parameters:**
- `pluginName` - Plugin identifier to load
- `--boot` (flag) - Only add to boot list without loading immediately

**Examples:**
```
/plugin load com.example.myplugin
/plugin load my-plugin --boot
```

---

### plugin unload

Unloads a plugin.

| Property | Value |
|----------|-------|
| **Syntax** | `/plugin unload <pluginName> [--boot]` |
| **Aliases** | `u` |

**Parameters:**
- `pluginName` - Plugin identifier to unload
- `--boot` (flag) - Only remove from boot list without unloading immediately

**Examples:**
```
/plugin unload com.example.myplugin
```

---

### plugin reload

Reloads a plugin.

| Property | Value |
|----------|-------|
| **Syntax** | `/plugin reload <pluginName>` |
| **Aliases** | `r` |

**Parameters:**
- `pluginName` - Plugin identifier to reload

**Examples:**
```
/plugin reload com.example.myplugin
```

---

## Communication Commands

Commands for server-wide communication.

### say

Broadcasts a message to all players.

| Property | Value |
|----------|-------|
| **Syntax** | `/say <message>` |
| **Aliases** | `broadcast` |

**Parameters:**
- `message` - Message to broadcast (supports formatted messages with `{...}`)

**Examples:**
```
/say Hello everyone!
/say Server restart in 5 minutes
/say {"text": "Formatted message", "color": "red"}
```

---

## Emote Commands

Commands for player emotes.

### emote

Plays an emote animation.

| Property | Value |
|----------|-------|
| **Syntax** | `/emote <emote>` |
| **Game Mode** | Adventure |

**Parameters:**
- `emote` - Emote ID to play

**Examples:**
```
/emote wave
/emote dance
```

---

## Debug Shape Commands

Commands for drawing debug shapes in the world.

### debug shape

Parent command for debug shape visualization.

| Property | Value |
|----------|-------|
| **Syntax** | `/debug shape <subcommand>` |

**Subcommands:**
- `sphere` - Draw a debug sphere
- `cube` - Draw a debug cube
- `cylinder` - Draw a debug cylinder
- `cone` - Draw a debug cone
- `arrow` - Draw a debug arrow
- `showforce` - Show force debug visualization
- `clear` - Clear all debug shapes

---

## Spawn Item Commands

Commands for spawning item entities in the world.

### spawnitem

Spawns item entities in the world.

| Property | Value |
|----------|-------|
| **Syntax** | `/spawnitem <item> [qty] [--n=<count>] [--x=<force>]` |
| **Permission** | `spawnitem` |

**Parameters:**
- `item` - Item asset ID to spawn
- `qty` (optional) - Quantity per item stack (default: 1)
- `--n` / `count` (optional) - Number of item entities to spawn
- `--x` / `force` (optional) - Throw force multiplier (default: 1.0)

**Examples:**
```
/spawnitem Sword_Iron
/spawnitem Apple 10
/spawnitem Gold_Ingot 5 --n=10
/spawnitem Arrow 64 --x=2.0
```

---

## Interaction Commands

Commands for managing player interactions.

### interaction

Parent command for interaction management.

| Property | Value |
|----------|-------|
| **Syntax** | `/interaction <subcommand>` |
| **Aliases** | `interact` |

**Subcommands:**
- `run` - Run an interaction
- `snapshotsource` - Set snapshot source for interactions
- `clear` - Clear current interaction

---

## Builder Tools Commands

Commands for creative building and world editing. These commands require Creative mode.

### pos1

Sets the first corner position for a selection region.

| Property | Value |
|----------|-------|
| **Syntax** | `/pos1 [x] [y] [z]` |
| **Permission** | `hytale.editor.selection.use` |
| **Game Mode** | Creative |

**Parameters:**
- `x y z` (optional) - Specific coordinates. If not provided, uses the player's current position.

**Examples:**
```
/pos1
/pos1 100 64 200
```

---

### pos2

Sets the second corner position for a selection region.

| Property | Value |
|----------|-------|
| **Syntax** | `/pos2 [x] [y] [z]` |
| **Permission** | `hytale.editor.selection.use` |
| **Game Mode** | Creative |

**Parameters:**
- `x y z` (optional) - Specific coordinates. If not provided, uses the player's current position.

**Examples:**
```
/pos2
/pos2 150 80 250
```

---

### copy

Copies the selected region to the clipboard.

| Property | Value |
|----------|-------|
| **Syntax** | `/copy [--noEntities] [--onlyEntities] [--empty] [--keepanchors]` |
| **Permission** | `hytale.editor.selection.clipboard` |
| **Game Mode** | Creative |

**Parameters:**
- `--noEntities` (flag) - Exclude entities from the copy
- `--onlyEntities` (flag) - Only copy entities, not blocks
- `--empty` (flag) - Copy empty/air blocks
- `--keepanchors` (flag) - Preserve anchor points

**Alternative Syntax:**
`/copy <xMin> <yMin> <zMin> <xMax> <yMax> <zMax> [flags]` - Copy a specific region by coordinates.

**Examples:**
```
/copy
/copy --noEntities
/copy --onlyEntities
/copy 0 0 0 50 50 50
```

---

### cut

Cuts the selected region to the clipboard (copy and delete).

| Property | Value |
|----------|-------|
| **Syntax** | `/cut [--noEntities] [--onlyEntities] [--empty] [--keepanchors]` |
| **Permission** | `hytale.editor.selection.clipboard` |
| **Game Mode** | Creative |

**Parameters:**
- `--noEntities` (flag) - Exclude entities from the cut
- `--onlyEntities` (flag) - Only cut entities, not blocks
- `--empty` (flag) - Include empty/air blocks
- `--keepanchors` (flag) - Preserve anchor points

**Examples:**
```
/cut
/cut --noEntities
/cut 0 0 0 50 50 50
```

---

### paste

Pastes the clipboard contents at the current location or specified coordinates.

| Property | Value |
|----------|-------|
| **Syntax** | `/paste [position]` |
| **Permission** | `hytale.editor.selection.clipboard` |
| **Game Mode** | Creative |

**Parameters:**
- `position` (optional) - Target position (supports relative coordinates with ~). If not provided, pastes at player position.

**Examples:**
```
/paste
/paste 100 64 200
/paste ~ ~10 ~
```

---

### set

Sets all blocks in the selection to a specific block pattern.

| Property | Value |
|----------|-------|
| **Syntax** | `/set <pattern>` |
| **Aliases** | `setBlocks` |
| **Permission** | `hytale.editor.selection.modify` |
| **Game Mode** | Creative |

**Parameters:**
- `pattern` - Block pattern to fill (e.g., block type or weighted pattern)

**Examples:**
```
/set Stone
/set Dirt
/set 50%Stone,50%Dirt
```

---

### fill

Fills the selection with a block pattern (similar to set).

| Property | Value |
|----------|-------|
| **Syntax** | `/fill <pattern>` |
| **Aliases** | `fillBlocks` |
| **Game Mode** | Creative |

**Parameters:**
- `pattern` - Block pattern to fill

**Examples:**
```
/fill Stone
/fill Water
```

---

### replace

Replaces blocks in the selection from one type to another.

| Property | Value |
|----------|-------|
| **Syntax** | `/replace [from] <to> [--substringSwap] [--regex]` |
| **Game Mode** | Creative |

**Parameters:**
- `from` (optional) - Source block type or pattern to replace. If omitted, replaces all non-air blocks.
- `to` - Destination block pattern
- `--substringSwap` (flag) - Replace blocks by substring matching in their IDs
- `--regex` (flag) - Use regex pattern matching for the `from` parameter

**Examples:**
```
/replace Stone
/replace Stone Dirt
/replace Grass Flower --substringSwap
/replace ".*_Wood" Oak_Planks --regex
```

---

### undo

Undoes the last builder tools operation.

| Property | Value |
|----------|-------|
| **Syntax** | `/undo [count]` |
| **Aliases** | `u` |
| **Permission** | `hytale.editor.history` |
| **Game Mode** | Creative |

**Parameters:**
- `count` (optional) - Number of operations to undo (default: 1)

**Examples:**
```
/undo
/undo 5
/u
```

---

### redo

Redoes a previously undone builder tools operation.

| Property | Value |
|----------|-------|
| **Syntax** | `/redo [count]` |
| **Aliases** | `r` |
| **Permission** | `hytale.editor.history` |
| **Game Mode** | Creative |

**Parameters:**
- `count` (optional) - Number of operations to redo (default: 1)

**Examples:**
```
/redo
/redo 3
/r
```

---

### rotate

Rotates the selection or clipboard around an axis.

| Property | Value |
|----------|-------|
| **Syntax** | `/rotate <angle> [axis]` or `/rotate <yaw> <pitch> <roll>` |
| **Game Mode** | Creative |

**Parameters:**
- `angle` - Rotation angle in degrees (must be multiple of 90 for simple rotation)
- `axis` (optional) - Rotation axis: X, Y, or Z (default: Y)
- `yaw pitch roll` - Arbitrary rotation angles for complex rotation

**Examples:**
```
/rotate 90
/rotate 180 Y
/rotate 90 X
/rotate 45 30 0
```

---

### flip

Flips the selection along an axis.

| Property | Value |
|----------|-------|
| **Syntax** | `/flip [direction]` |
| **Game Mode** | Creative |

**Parameters:**
- `direction` (optional) - Direction to flip (north, south, east, west, up, down). If not specified, uses the player's facing direction.

**Examples:**
```
/flip
/flip north
/flip up
```

---

### stack

Stacks/repeats the selection multiple times in a direction.

| Property | Value |
|----------|-------|
| **Syntax** | `/stack [count] [direction] [--empty] [--spacing=<n>]` |
| **Game Mode** | Creative |

**Parameters:**
- `count` (optional) - Number of times to stack (default: 1)
- `direction` (optional) - Stacking direction. If not specified, uses player's facing direction.
- `--empty` (flag) - Include empty/air blocks
- `--spacing` (optional) - Gap between stacked copies

**Examples:**
```
/stack
/stack 5
/stack 3 up
/stack 10 north --spacing=2
```

---

### move

Moves the selection contents in a direction.

| Property | Value |
|----------|-------|
| **Syntax** | `/move [distance] [direction] [--empty] [--entities]` |
| **Game Mode** | Creative |

**Parameters:**
- `distance` (optional) - Distance to move (default: 1)
- `direction` (optional) - Movement direction. If not specified, uses player's facing direction.
- `--empty` (flag) - Leave empty space behind
- `--entities` (flag) - Also move entities within the selection

**Examples:**
```
/move
/move 10
/move 5 up
/move 20 north --entities
```

---

### expand

Expands the selection in a direction.

| Property | Value |
|----------|-------|
| **Syntax** | `/expand [distance] [axis]` |
| **Game Mode** | Creative |

**Parameters:**
- `distance` (optional) - Distance to expand (default: 1)
- `axis` (optional) - Axis to expand along (X, Y, Z). If not specified, uses player's facing direction.

**Examples:**
```
/expand
/expand 10
/expand 5 Y
```

---

### hollow

Hollows out the selection, leaving only the outer shell.

| Property | Value |
|----------|-------|
| **Syntax** | `/hollow [blockType] [thickness] [--floor] [--roof] [--perimeter]` |
| **Game Mode** | Creative |

**Parameters:**
- `blockType` (optional) - Block to fill the hollow with (default: Air/Empty)
- `thickness` (optional) - Shell thickness (default: 1, max: 128)
- `--floor` / `--bottom` (flag) - Include floor in hollow
- `--roof` / `--ceiling` / `--top` (flag) - Include roof in hollow
- `--perimeter` / `--all` (flag) - Include both floor and roof

**Examples:**
```
/hollow
/hollow Air 2
/hollow Stone 1 --perimeter
```

---

### walls

Creates walls around the selection.

| Property | Value |
|----------|-------|
| **Syntax** | `/walls <pattern> [thickness] [--floor] [--roof] [--perimeter]` |
| **Aliases** | `wall`, `side`, `sides` |
| **Game Mode** | Creative |

**Parameters:**
- `pattern` - Block pattern for the walls
- `thickness` (optional) - Wall thickness (default: 1, max: 128)
- `--floor` / `--bottom` (flag) - Include floor
- `--roof` / `--ceiling` / `--top` (flag) - Include roof/ceiling
- `--perimeter` / `--all` (flag) - Include both floor and roof

**Examples:**
```
/walls Stone
/walls Brick 2
/walls Glass 1 --perimeter
```

---

### deselect

Clears the current selection.

| Property | Value |
|----------|-------|
| **Syntax** | `/deselect` |
| **Aliases** | `clearselection` |
| **Game Mode** | Creative |

**Examples:**
```
/deselect
/clearselection
```

---

## Adventure Commands

Commands for managing adventure game mechanics.

### objective

Manages objectives for adventure gameplay.

| Property | Value |
|----------|-------|
| **Syntax** | `/objective <subcommand>` |
| **Aliases** | `obj` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `start objective` | `/objective start objective <objectiveId>` | Start a specific objective |
| `start line` | `/objective start line <objectiveLineId>` | Start an objective line |
| `complete` | `/objective complete` | Complete the current objective |
| `panel` | `/objective panel` | Show the objective panel |
| `history` | `/objective history` | Show objective history |
| `locationmarker` | `/objective locationmarker` | Manage location markers |
| `reachlocationmarker` | `/objective reachlocationmarker` | Trigger location marker reach |

**Examples:**
```
/objective start objective Tutorial_Quest
/objective start line MainStory_Chapter1
/objective complete
/obj panel
```

---

### reputation

Manages player reputation with factions.

| Property | Value |
|----------|-------|
| **Syntax** | `/reputation <subcommand>` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `add` | `/reputation add <faction> <amount>` | Add reputation with a faction |
| `set` | `/reputation set <faction> <value>` | Set reputation to a specific value |
| `rank` | `/reputation rank <faction>` | Get current rank with a faction |
| `value` | `/reputation value <faction>` | Get current reputation value |

**Examples:**
```
/reputation add Kweebecs 100
/reputation set Trorks -50
/reputation rank Kweebecs
/reputation value Trorks
```

---

## Instance Commands

Commands for managing game instances.

### instance

Manages game instances for instanced content.

| Property | Value |
|----------|-------|
| **Syntax** | `/instance <subcommand>` |
| **Aliases** | `instances`, `inst` |

**Subcommands:**

| Subcommand | Syntax | Description |
|------------|--------|-------------|
| `spawn` | `/instance spawn <instanceId>` | Spawn into an instance |
| `exit` | `/instance exit` | Exit the current instance |
| `migrate` | `/instance migrate` | Migrate instance data |
| `edit new` | `/instance edit new <name>` | Create a new instance |
| `edit copy` | `/instance edit copy <source> <dest>` | Copy an instance |
| `edit load` | `/instance edit load <instanceId>` | Load an instance for editing |
| `edit list` | `/instance edit list` | List available instances |

**Examples:**
```
/instance spawn Dungeon_Forest
/instance exit
/inst edit list
/instance edit new MyDungeon
```

---

## Spawn Commands

Commands for teleporting to spawn points.

### spawn

Teleports a player to the world spawn point.

| Property | Value |
|----------|-------|
| **Syntax** | `/spawn [spawnIndex] [player]` |
| **Permission** | `spawn.self`, `spawn.other` |

**Parameters:**
- `spawnIndex` (optional) - Index of spawn point if multiple exist
- `player` (optional) - Target player (requires `spawn.other` permission)

**Subcommands:**
- `/spawn set` - Set a new spawn point
- `/spawn setdefault` - Set the default spawn point

**Examples:**
```
/spawn
/spawn 0
/spawn PlayerName
/spawn set
```
