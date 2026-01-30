---
id: commands
title: Commands
sidebar_label: Commands
sidebar_position: 5
---

# Commands

Create custom commands for your Hytale plugin using the command system. Commands in Hytale are class-based, extending from `AbstractCommand` rather than using annotations.

## Command Architecture

### Class Hierarchy

The command system is built around a hierarchy of base classes:

| Class | Description |
|-------|-------------|
| `AbstractCommand` | Base abstract class with all command logic |
| `AbstractAsyncCommand` | Base for async commands with error handling |
| `CommandBase` | Simple synchronous command execution |
| `AbstractPlayerCommand` | Commands that require the sender to be a player |
| `AbstractWorldCommand` | Commands that operate on a world context |
| `AbstractTargetPlayerCommand` | Commands that target another player |
| `AbstractTargetEntityCommand` | Commands that target an entity |
| `AbstractCommandCollection` | Container for related subcommands |

### Key Interfaces

**CommandSender** - Represents the entity executing a command:

```java
public interface CommandSender extends IMessageReceiver, PermissionHolder {
    String getDisplayName();
    UUID getUuid();
}
```

**CommandOwner** - Identifies who owns/registered a command (plugin or server):

```java
public interface CommandOwner {
    String getName();
}
```

## Creating a Basic Command

Extend `CommandBase` for simple synchronous commands:

```java
public class HelloCommand extends CommandBase {

    public HelloCommand() {
        super("hello", "server.commands.hello.desc");
    }

    @Override
    protected CompletableFuture<Void> execute(@Nonnull CommandContext context) {
        context.getSender().sendMessage("Hello, World!");
        return CompletableFuture.completedFuture(null);
    }
}
```

For player-only commands, extend `AbstractPlayerCommand`:

```java
public class HealCommand extends AbstractPlayerCommand {

    public HealCommand() {
        super("heal", "server.commands.heal.desc");
        this.requirePermission(HytalePermissions.fromCommand("heal.self"));
    }

    @Override
    protected CompletableFuture<Void> execute(@Nonnull CommandContext context) {
        // Player is guaranteed to exist when using AbstractPlayerCommand
        Player player = getPlayer(context);
        player.setHealth(player.getMaxHealth());
        return CompletableFuture.completedFuture(null);
    }
}
```

## Registering Commands

### System Commands

For server-owned commands, use `CommandManager.registerSystemCommand()`:

```java
CommandManager.get().registerSystemCommand(new HelloCommand());
```

### Plugin Commands

For plugin-owned commands, use `CommandRegistry.registerCommand()`:

```java
public class MyPlugin extends PluginBase {

    @Override
    public void onEnable() {
        getCommandRegistry().registerCommand(new HelloCommand());
    }
}
```

The `CommandRegistry` automatically sets the plugin as the command owner.

## Argument System

Hytale provides a flexible argument system with four argument types:

### RequiredArg

A positional argument that must be provided:

```java
public class GiveCommand extends AbstractPlayerCommand {
    private final RequiredArg<Item> itemArg = this.withRequiredArg(
        "item",
        "server.commands.give.item.desc",
        ArgTypes.ITEM_ASSET
    );

    @Override
    protected CompletableFuture<Void> execute(@Nonnull CommandContext context) {
        Item item = context.get(itemArg);
        // Use the item...
        return CompletableFuture.completedFuture(null);
    }
}
```

### OptionalArg

A named argument specified with `--name=value` syntax:

```java
private final OptionalArg<String> metadataArg = this.withOptionalArg(
    "metadata",
    "server.commands.give.metadata.desc",
    ArgTypes.STRING
);
```

Usage: `/give diamond --metadata=custom_data`

### DefaultArg

An optional argument with a default value if not provided:

```java
private final DefaultArg<Integer> quantityArg = this.withDefaultArg(
    "quantity",
    "server.commands.give.quantity.desc",
    ArgTypes.INTEGER,
    Integer.valueOf(1),  // Default value
    "1"                  // Default value description
);
```

Usage: `/give diamond` (uses default 1) or `/give diamond --quantity=64`

### FlagArg

A boolean flag (defaults to false, set to true when present):

```java
private final FlagArg crashFlag = this.withFlagArg(
    "crash",
    "server.commands.stop.crash.desc"
);
```

Usage: `/stop` or `/stop --crash`

### Argument Dependencies

Optional arguments can have dependencies on other arguments:

```java
// Required if another argument is present
optionalArg.requiredIf(otherArg);

// Required if another argument is absent
optionalArg.requiredIfAbsent(otherArg);

// Only available if all specified arguments are present
optionalArg.availableOnlyIfAll(arg1, arg2);

// Only available if all specified arguments are absent
optionalArg.availableOnlyIfAllAbsent(arg1, arg2);
```

## ArgumentType Classes

The `ArgumentType` abstract class defines how arguments are parsed and provides tab completion:

```java
public abstract class ArgumentType<DataType> implements SuggestionProvider {
    // Parse string input into the data type
    DataType parse(String[] input, ParseResult parseResult);

    // Provide tab completion suggestions
    void suggest(CommandSender sender, String textAlreadyEntered,
                 int numParametersTyped, SuggestionResult result);

    // Number of string parameters this type consumes
    int getNumberOfParameters();
}
```

### Built-in Argument Types

Common types are available through `ArgTypes`:

- `ArgTypes.STRING` - Plain string
- `ArgTypes.INTEGER` - Integer value
- `ArgTypes.FLOAT` - Float value
- `ArgTypes.DOUBLE` - Double value
- `ArgTypes.BOOLEAN` - Boolean value
- `ArgTypes.PLAYER_REF` - Player reference
- `ArgTypes.ITEM_ASSET` - Item asset reference
- `ArgTypes.GAME_MODE` - GameMode enum

### Specialized Argument Types

| Type | Description |
|------|-------------|
| `SingleArgumentType` | Base for types that consume a single parameter |
| `MultiArgumentType` | Base for types that consume multiple parameters |
| `ListArgumentType` | Wraps another type to accept lists via `[item1,item2,...]` syntax |
| `EnumArgumentType` | For Java enum values with auto-completion |
| `AssetArgumentType` | For Hytale asset references (items, entities, etc.) |
| `GameModeArgumentType` | For GameMode enum values |

### Relative Coordinate Types

Hytale supports Minecraft-style relative coordinates with the `~` prefix:

| Type | Description |
|------|-------------|
| `RelativeInteger` | Single integer with `~` support (e.g., `~10`) |
| `RelativeVector3i` | 3D integer vector with relative support (e.g., `~10 ~5 ~-3`) |
| `RelativeDoublePosition` | 3D double position with relative support |

Example: `/teleport ~10 ~ ~-5` moves 10 blocks on X, stays at current Y, moves -5 on Z.

### Creating Custom Argument Types

Extend `SingleArgumentType` for single-parameter types:

```java
public class PercentageArgumentType extends SingleArgumentType<Double> {

    public PercentageArgumentType() {
        super(
            Message.of("percentage"),
            "<0-100>",
            "50", "100", "0"  // Example values for help
        );
    }

    @Override
    public Double parse(String[] input, ParseResult parseResult) {
        try {
            double value = Double.parseDouble(input[0]);
            if (value < 0 || value > 100) {
                parseResult.setError("Percentage must be between 0 and 100");
                return null;
            }
            return value / 100.0;
        } catch (NumberFormatException e) {
            parseResult.setError("Invalid number format");
            return null;
        }
    }

    @Override
    public void suggest(CommandSender sender, String textAlreadyEntered,
                        int numParametersTyped, SuggestionResult result) {
        result.suggest("0").suggest("25").suggest("50").suggest("75").suggest("100");
    }
}
```

## Tab Completion

Tab completion is provided through the `SuggestionProvider` interface:

```java
@FunctionalInterface
public interface SuggestionProvider {
    void suggest(CommandSender sender, String textAlreadyEntered,
                 int numParametersTyped, SuggestionResult result);
}
```

### SuggestionResult

The `SuggestionResult` class collects suggestions:

```java
// Add a single suggestion
result.suggest("option1");

// Add multiple suggestions
result.suggest("option1").suggest("option2").suggest("option3");

// Fuzzy matching (returns up to 5 best matches)
result.fuzzySuggest(input, items, Item::getName);
```

### Custom Suggestion Provider

Attach a custom suggestion provider to an argument:

```java
private final RequiredArg<String> worldArg = this.withRequiredArg(
    "world",
    "server.commands.teleport.world.desc",
    ArgTypes.STRING
).suggest((sender, text, paramCount, result) -> {
    // Provide world names as suggestions
    for (World world : WorldManager.getWorlds()) {
        result.suggest(world.getName());
    }
});
```

## Command Features

### Aliases

Add alternative names for a command:

```java
public MyCommand() {
    super("mycommand", "description");
    this.addAliases(new String[]{"mc", "mycmd"});
}
```

### Subcommands

Use `AbstractCommandCollection` for commands with subcommands:

```java
public class EntityCommand extends AbstractCommandCollection {

    public EntityCommand() {
        super("entity", "server.commands.entity.desc");
        this.addAliases(new String[]{"entities"});

        this.addSubCommand(new EntityCloneCommand());
        this.addSubCommand(new EntityRemoveCommand());
        this.addSubCommand(new EntityDumpCommand());
        // ... more subcommands
    }
}
```

### Usage Variants

Add different argument configurations for the same command:

```java
public class KillCommand extends AbstractPlayerCommand {

    public KillCommand() {
        super("kill", "server.commands.kill.desc");
        this.requirePermission(HytalePermissions.fromCommand("kill.self"));

        // Add variant for killing other players
        this.addUsageVariant(new KillOtherCommand());
    }

    // Variant class for /kill <player>
    private static class KillOtherCommand extends AbstractTargetPlayerCommand {
        public KillOtherCommand() {
            super("kill", "server.commands.kill.other.desc");
            this.requirePermission(HytalePermissions.fromCommand("kill.other"));
        }
    }
}
```

### Confirmation

Require a `--confirm` flag for dangerous operations:

```java
public class DangerousCommand extends CommandBase {

    public DangerousCommand() {
        super("dangerous", "description", true);  // true = requires confirmation
    }
}
```

### Extra Arguments

Allow arbitrary additional arguments:

```java
public class SudoCommand extends CommandBase {
    private final RequiredArg<String> playerArg = this.withRequiredArg(
        "player",
        "server.commands.sudo.player.desc",
        ArgTypes.STRING
    );

    public SudoCommand() {
        super("sudo", "server.commands.sudo.desc");
        this.addAliases(new String[]{"su"});
        this.setAllowsExtraArguments(true);  // Allows /sudo player <any command>
    }
}
```

## Permission System

### Permission Format

Permissions follow the format `namespace.category.action`:

```java
// Using the HytalePermissions helper
this.requirePermission(HytalePermissions.fromCommand("give.self"));
// Results in: "hytale.command.give.self"
```

### Permission Groups

Assign commands to permission groups based on game mode:

```java
public class WhereAmICommand extends AbstractPlayerCommand {

    public WhereAmICommand() {
        super("whereami", "server.commands.whereami.desc");
        this.setPermissionGroup(GameMode.Creative);  // Only available in Creative mode
        this.requirePermission(HytalePermissions.fromCommand("whereami.self"));
    }
}
```

### Checking Permissions

The `CommandSender` interface extends `PermissionHolder`:

```java
public interface PermissionHolder {
    boolean hasPermission(String permission);
    boolean hasPermission(String permission, boolean defaultValue);
}
```

## Built-in Commands Reference

| Command | Usage | Description |
|---------|-------|-------------|
| `/give` | `/give <item> [quantity] [--metadata=?]` | Gives items to yourself (alias: `/give <player> <item> [quantity] [--metadata=?]` for others) |
| `/give armor` | `/give armor <search> [--player=?] [--set]` | Gives armor matching the search string (use `--set` to replace existing armor) |
| `/gamemode` | `/gamemode <mode> [player]` | Changes game mode (alias: `/gm`) |
| `/kill` | `/kill [player]` | Kills player(s) |
| `/kick` | `/kick <player>` | Kicks a player from the server |
| `/stop` | `/stop [--crash]` | Stops the server (alias: `/shutdown`) |
| `/help` | `/help [command]` | Shows command help (alias: `/?`) |
| `/sudo` | `/sudo <player> <command...>` | Execute as another player (alias: `/su`). Use `*` as player to target all players |
| `/whereami` | `/whereami [player]` | Shows player location info |
| `/entity` | `/entity <subcommand>` | Entity management (alias: `/entities`) |
| `/worldmap` | `/worldmap <subcommand>` | World map operations (alias: `/map`) |

## Input Tokenization

The command system supports:

- **Quoted strings**: Single (`'`) or double (`"`) quotes for arguments with spaces
- **List arguments**: `[item1,item2,item3]` syntax for list types
- **Escape sequences**: `\\`, `\'`, `\"`, `\[`, `\]`, `\,`

Example: `/say "Hello, World!"` or `/give [sword,shield,potion]`

## Complete Example

Here is a complete example command that demonstrates multiple features:

```java
public class TeleportCommand extends AbstractPlayerCommand {

    private final RequiredArg<RelativeVector3i> positionArg = this.withRequiredArg(
        "position",
        "server.commands.tp.position.desc",
        ArgTypes.RELATIVE_VECTOR3I
    );

    private final OptionalArg<String> worldArg = this.withOptionalArg(
        "world",
        "server.commands.tp.world.desc",
        ArgTypes.STRING
    ).suggest((sender, text, paramCount, result) -> {
        for (World world : WorldManager.getWorlds()) {
            result.suggest(world.getName());
        }
    });

    private final FlagArg safeFlag = this.withFlagArg(
        "safe",
        "server.commands.tp.safe.desc"
    );

    public TeleportCommand() {
        super("teleport", "server.commands.tp.desc");
        this.addAliases(new String[]{"tp"});
        this.requirePermission(HytalePermissions.fromCommand("teleport.self"));
        this.setPermissionGroup(GameMode.Creative);
    }

    @Override
    protected CompletableFuture<Void> execute(@Nonnull CommandContext context) {
        Player player = getPlayer(context);
        RelativeVector3i position = context.get(positionArg);
        String worldName = context.getOrDefault(worldArg, null);
        boolean safe = context.get(safeFlag);

        // Resolve relative coordinates based on player position
        Vector3i targetPos = position.resolve(player.getPosition());

        if (safe) {
            // Find safe landing spot
            targetPos = findSafePosition(targetPos);
        }

        if (worldName != null) {
            World world = WorldManager.getWorld(worldName);
            player.teleport(world, targetPos);
        } else {
            player.teleport(targetPos);
        }

        return CompletableFuture.completedFuture(null);
    }
}
```

Usage examples:
- `/teleport 100 64 200` - Teleport to absolute coordinates
- `/tp ~10 ~ ~-5` - Move 10 blocks X, stay at Y, move -5 blocks Z
- `/tp 0 100 0 --world=nether` - Teleport to coordinates in the nether
- `/tp ~0 ~50 ~0 --safe` - Move up 50 blocks with safe landing
