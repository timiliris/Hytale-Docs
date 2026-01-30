---
id: prefab-system
title: Prefab System
sidebar_label: Prefab System
sidebar_position: 15
description: Complete documentation of the Hytale prefab system for spawning structures, buildings, and complex block arrangements
---

# Prefab System

The Prefab System in Hytale provides a powerful way to create, store, and spawn pre-built structures in the world. Prefabs can contain blocks, entities, fluids, and nested child prefabs, making them ideal for everything from small decorations to complex buildings.

## System Overview

The prefab system consists of several key components:

| Component | Purpose |
|-----------|---------|
| `PrefabStore` | Central singleton for loading and saving prefabs |
| `PrefabBuffer` | In-memory representation of prefab data |
| `PrefabSpawnerModule` | Plugin module for prefab spawner blocks |
| `PrefabSpawnerState` | Block state for configuring prefab spawners |
| `PrefabUtil` | Utility class for pasting and removing prefabs |
| `PrefabWeights` | Weighted random selection for prefab variants |

**Source Package:** `com.hypixel.hytale.server.core.prefab`

## Prefab File Format

Prefabs are stored as `.prefab.json` files with an optional binary cache (`.lpf` format for faster loading).

```
prefabs/
├── buildings/
│   ├── house_small.prefab.json
│   ├── house_medium.prefab.json
│   └── house_large.prefab.json
└── decorations/
    ├── tree_oak.prefab.json
    └── rock_formation.prefab.json
```

**File Suffixes:**
- `.prefab.json` - Human-readable JSON format
- `.lpf` - Binary cached format (auto-generated)
- `.prefab.json.lpf` - Binary cache for immutable assets

**Source:** `com.hypixel.hytale.server.core.prefab.selection.buffer.PrefabBufferUtil`

## PrefabStore

The `PrefabStore` is a singleton that manages prefab loading and saving across different locations.

```java
// Get the singleton instance
PrefabStore prefabStore = PrefabStore.get();
```

### Prefab Paths

The system supports multiple prefab locations:

| Path Type | Method | Description |
|-----------|--------|-------------|
| Server Prefabs | `getServerPrefabsPath()` | `prefabs/` directory |
| Asset Prefabs | `getAssetPrefabsPath()` | `Assets/Server/Prefabs/` |
| WorldGen Prefabs | `getWorldGenPrefabsPath()` | `worldgen/Default/Prefabs/` |

### Loading Prefabs

```java
// Load a prefab by relative path
BlockSelection prefab = PrefabStore.get().getServerPrefab("buildings/house.prefab.json");

// Load from asset packs
BlockSelection assetPrefab = PrefabStore.get().getAssetPrefab("structures/tower.prefab.json");

// Load a directory of prefabs (for weighted selection)
Map<Path, BlockSelection> prefabs = PrefabStore.get().getServerPrefabDir("buildings/houses");

// Find prefab across all asset packs
BlockSelection foundPrefab = PrefabStore.get().getAssetPrefabFromAnyPack("decorations/tree.prefab.json");
```

### Saving Prefabs

```java
// Save a prefab (fails if exists)
PrefabStore.get().saveServerPrefab("my_prefab.prefab.json", blockSelection);

// Save with overwrite
PrefabStore.get().saveServerPrefab("my_prefab.prefab.json", blockSelection, true);

// Save to worldgen directory
PrefabStore.get().saveWorldGenPrefab("structures/dungeon.prefab.json", blockSelection, true);
```

**Source:** `com.hypixel.hytale.server.core.prefab.PrefabStore`

## PrefabBuffer

The `PrefabBuffer` is an efficient in-memory representation of prefab data, storing blocks in a column-based format.

### Buffer Properties

```java
public interface IPrefabBuffer {
    // Anchor point (placement origin)
    int getAnchorX();
    int getAnchorY();
    int getAnchorZ();

    // Bounding box
    int getMinX(PrefabRotation rotation);
    int getMinY();
    int getMinZ(PrefabRotation rotation);
    int getMaxX(PrefabRotation rotation);
    int getMaxY();
    int getMaxZ(PrefabRotation rotation);

    // Data access
    int getColumnCount();
    ChildPrefab[] getChildPrefabs();
    int getBlockId(int x, int y, int z);
    int getFiller(int x, int y, int z);
    int getRotationIndex(int x, int y, int z);
}
```

### Loading Buffers with Caching

```java
// Get a cached prefab buffer (recommended for performance)
IPrefabBuffer buffer = PrefabBufferUtil.getCached(prefabPath);

// Load without caching
PrefabBuffer buffer = PrefabBufferUtil.loadBuffer(prefabPath);

// Create an accessor for iteration
PrefabBuffer.PrefabBufferAccessor accessor = buffer.newAccess();

// Always release when done
accessor.release();
```

### Building Prefabs Programmatically

```java
// Create a new prefab builder
PrefabBuffer.Builder builder = PrefabBuffer.newBuilder();

// Set the anchor point
builder.setAnchor(new Vector3i(0, 0, 0));

// Add block entries
PrefabBufferBlockEntry[] entries = new PrefabBufferBlockEntry[3];
entries[0] = builder.newBlockEntry(0);
entries[0].blockId = BlockType.getAssetMap().getIndex("Stone");
entries[1] = builder.newBlockEntry(1);
entries[1].blockId = BlockType.getAssetMap().getIndex("Stone");
entries[2] = builder.newBlockEntry(2);
entries[2].blockId = BlockType.getAssetMap().getIndex("Stone");

// Add the column (x=0, z=0)
builder.addColumn(0, 0, entries, null);

// Add child prefab reference
builder.addChildPrefab(
    5, 0, 5,                    // Position offset
    "decorations/tree.prefab.json",  // Path
    false,                      // fitHeightmap
    true,                       // inheritSeed
    true,                       // inheritHeightCondition
    PrefabWeights.NONE,         // weights
    PrefabRotation.ROTATION_0   // rotation
);

// Build the final buffer
PrefabBuffer prefab = builder.build();
```

**Source:** `com.hypixel.hytale.server.core.prefab.selection.buffer.impl.PrefabBuffer`

## Prefab Rotation

Prefabs can be rotated in 90-degree increments around the Y-axis.

```java
public enum PrefabRotation {
    ROTATION_0,     // No rotation
    ROTATION_90,    // 90 degrees clockwise
    ROTATION_180,   // 180 degrees
    ROTATION_270    // 270 degrees (90 counter-clockwise)
}
```

### Using Rotations

```java
// Convert from Rotation enum
PrefabRotation rotation = PrefabRotation.fromRotation(Rotation.Ninety);

// Combine rotations
PrefabRotation combined = PrefabRotation.ROTATION_90.add(PrefabRotation.ROTATION_180);

// Rotate a vector
Vector3d position = new Vector3d(5, 0, 3);
rotation.rotate(position);

// Get rotated coordinates
int newX = rotation.getX(originalX, originalZ);
int newZ = rotation.getZ(originalX, originalZ);

// Get yaw angle in radians
float yaw = rotation.getYaw();
```

**Source:** `com.hypixel.hytale.server.core.prefab.PrefabRotation`

## Pasting Prefabs

The `PrefabUtil` class provides methods for pasting prefabs into the world.

### Basic Paste

```java
// Simple paste
PrefabUtil.paste(
    buffer,                      // IPrefabBuffer
    world,                       // World
    position,                    // Vector3i target position
    Rotation.None,               // Yaw rotation
    false,                       // Force (ignore placement rules)
    new Random(),                // Random for chance-based blocks
    componentAccessor            // ComponentAccessor for events
);
```

### Advanced Paste Options

```java
PrefabUtil.paste(
    buffer,                      // IPrefabBuffer
    world,                       // World
    position,                    // Vector3i target position
    Rotation.Ninety,             // Yaw rotation
    true,                        // Force placement
    random,                      // Random instance
    setBlockSettings,            // Block setting flags
    false,                       // technicalPaste (includes editor blocks)
    false,                       // pasteAnchorAsBlock
    true,                        // loadEntities
    componentAccessor            // ComponentAccessor
);
```

### Checking Placement Validity

```java
// Check if prefab can be placed
boolean canPlace = PrefabUtil.canPlacePrefab(
    buffer,
    world,
    position,
    Rotation.None,
    blockMask,                   // IntSet of allowed block IDs to replace
    random,
    false                        // ignoreOrigin
);

// Check if prefab matches existing blocks
boolean matches = PrefabUtil.prefabMatchesAtPosition(
    buffer,
    world,
    position,
    Rotation.None,
    random
);
```

### Removing Prefabs

```java
// Remove a prefab from the world
PrefabUtil.remove(
    buffer,
    world,
    position,
    Rotation.None,
    false,                       // Force
    random,
    setBlockSettings,
    1.0                          // brokenParticlesRate
);
```

**Source:** `com.hypixel.hytale.server.core.util.PrefabUtil`

## Prefab Spawner Module

The `PrefabSpawnerModule` registers special blocks that spawn prefabs during world generation.

```java
public class PrefabSpawnerModule extends JavaPlugin {
    @Nonnull
    public static final PluginManifest MANIFEST = PluginManifest.corePlugin(PrefabSpawnerModule.class)
        .depends(BlockStateModule.class)
        .build();

    @Override
    protected void setup() {
        this.getBlockStateRegistry().registerBlockState(
            PrefabSpawnerState.class,
            "prefabspawner",
            PrefabSpawnerState.CODEC
        );
        this.getCommandRegistry().registerCommand(new PrefabSpawnerCommand());
    }
}
```

**Source:** `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerModule`

## PrefabSpawnerState

The `PrefabSpawnerState` block state configures how a prefab spawner behaves.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `PrefabPath` | String | null | Dot-notation path to prefab (e.g., `buildings.houses.small_house`) |
| `FitHeightmap` | boolean | false | Adjust child prefab to terrain height |
| `InheritSeed` | boolean | true | Child prefabs inherit worldgen seed |
| `InheritHeightCondition` | boolean | true | Child prefabs inherit height restrictions |
| `PrefabWeights` | PrefabWeights | NONE | Weighted selection for folders with multiple prefabs |

### JSON Configuration

```json
{
    "PrefabPath": "buildings.houses",
    "FitHeightmap": true,
    "InheritSeed": true,
    "InheritHeightCondition": false,
    "PrefabWeights": {
        "Default": 1.0,
        "Weights": {
            "small_house.prefab.json": 3.0,
            "medium_house.prefab.json": 2.0,
            "large_house.prefab.json": 1.0
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerState`

## Prefab Weights

The `PrefabWeights` class enables weighted random selection from multiple prefabs.

```java
// Create weights
PrefabWeights weights = new PrefabWeights();
weights.setDefaultWeight(1.0);
weights.setWeight("rare_variant.prefab.json", 0.1);
weights.setWeight("common_variant.prefab.json", 5.0);

// Select from array using weights
Path[] prefabPaths = getPrefabPaths();
Path selected = weights.get(
    prefabPaths,
    path -> path.getFileName().toString(),
    random
);

// Parse from string format
PrefabWeights parsed = PrefabWeights.parse("small=3.0, medium=2.0, large=1.0");

// Get mapping string
String mapping = weights.getMappingString(); // "small=3.0, medium=2.0, large=1.0"
```

**Source:** `com.hypixel.hytale.server.core.prefab.PrefabWeights`

## Prefab Events

The prefab system fires events that plugins can listen to.

### PrefabPasteEvent

Fired at the start and end of a prefab paste operation.

```java
public class PrefabPasteEvent extends CancellableEcsEvent {
    public int getPrefabId();      // Unique paste operation ID
    public boolean isPasteStart(); // true = start, false = end
}
```

### PrefabPlaceEntityEvent

Fired when an entity from a prefab is being placed.

```java
public class PrefabPlaceEntityEvent extends EcsEvent {
    public int getPrefabId();                    // Paste operation ID
    @Nonnull
    public Holder<EntityStore> getHolder();      // Entity being placed
}
```

**Source:** `com.hypixel.hytale.server.core.prefab.event`

## SpawnPrefabInteraction

Spawn prefabs through the interaction system for items and abilities.

```java
public class SpawnPrefabInteraction extends SimpleInstantInteraction {
    String prefabPath;                    // Path to prefab
    Vector3i offset = Vector3i.ZERO;      // Position offset
    Rotation rotationYaw = Rotation.None; // Rotation
    OriginSource originSource = ENTITY;   // ENTITY or BLOCK
    boolean force;                        // Force placement
}
```

### JSON Configuration

```json
{
    "Type": "SpawnPrefab",
    "PrefabPath": "structures/tower.prefab.json",
    "Offset": { "x": 0, "y": 0, "z": 0 },
    "RotationYaw": "None",
    "OriginSource": "ENTITY",
    "Force": false
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.SpawnPrefabInteraction`

## Console Commands

### Prefab Spawner Commands

| Command | Description |
|---------|-------------|
| `/prefabspawner get` | Display prefab spawner settings at target position |
| `/prefabspawner set <prefab> [options]` | Configure prefab spawner |
| `/prefabspawner weight <prefab> <weight>` | Set weight for specific prefab |

**Aliases:** `/pspawner`

### Set Command Options

```
/prefabspawner set <prefabPath> [fitHeightmap] [inheritSeed] [inheritHeightCheck] [defaultWeight]
```

**Examples:**
```
/prefabspawner set buildings.houses.small_house
/prefabspawner set trees.oak fitHeightmap=true
/prefabspawner set dungeons.entrance defaultWeight=0.5
```

**Source:** `com.hypixel.hytale.server.core.modules.prefabspawner.commands`

## World Generation Integration

Prefabs integrate with the world generation system for caves and structures.

### Cave Prefab Placement

```java
public enum CavePrefabPlacement {
    CEILING,  // Place on cave ceiling
    FLOOR,    // Place on cave floor
    DEFAULT   // Place at cave center
}
```

### CavePrefab

```java
public class CavePrefab implements CaveElement {
    @Nonnull
    private final WorldGenPrefabSupplier prefabSupplier;
    @Nonnull
    private final PrefabRotation rotation;
    private final IIntCondition biomeMask;
    private final BlockMaskCondition blockMask;
    private final int x, y, z;
}
```

**Source:** `com.hypixel.hytale.server.worldgen.cave.element.CavePrefab`

## Plugin Example

Here's a complete example of spawning prefabs in a plugin:

```java
public class PrefabPlugin extends JavaPlugin {

    public PrefabPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Register prefab paste event listener
        getEventRegistry().register(PrefabPasteEvent.class, this::onPrefabPaste);
        getEventRegistry().register(PrefabPlaceEntityEvent.class, this::onPrefabPlaceEntity);
    }

    /**
     * Spawn a prefab at a player's location
     */
    public void spawnPrefabAtPlayer(PlayerRef playerRef, World world, String prefabPath) {
        Store<EntityStore> store = world.getEntityStore().getStore();
        TransformComponent transform = store.getComponent(
            playerRef.getReference(),
            TransformComponent.getComponentType()
        );

        if (transform != null) {
            Vector3i position = transform.getPosition().toVector3i();

            // Load the prefab
            Path fullPath = PrefabStore.get().getAssetPrefabsPath().resolve(prefabPath);
            IPrefabBuffer buffer = PrefabBufferUtil.getCached(fullPath);

            // Paste with random rotation
            PrefabRotation[] rotations = PrefabRotation.VALUES;
            Rotation rotation = rotations[new Random().nextInt(rotations.length)].getRotation();

            PrefabUtil.paste(
                buffer,
                world,
                position,
                rotation,
                false,
                new Random(),
                store
            );

            getLogger().info("Spawned prefab at " + position);
        }
    }

    /**
     * Spawn a random prefab from a weighted list
     */
    public void spawnWeightedPrefab(World world, Vector3i position, String prefabDir) {
        Map<Path, BlockSelection> prefabs = PrefabStore.get().getAssetPrefabDir(prefabDir);

        if (!prefabs.isEmpty()) {
            PrefabWeights weights = new PrefabWeights();
            weights.setDefaultWeight(1.0);

            Path[] paths = prefabs.keySet().toArray(new Path[0]);
            Path selected = weights.get(paths, p -> p.getFileName().toString(), new Random());

            if (selected != null) {
                IPrefabBuffer buffer = PrefabBufferUtil.getCached(selected);
                PrefabUtil.paste(buffer, world, position, Rotation.None, false, new Random(),
                    world.getEntityStore().getStore());
            }
        }
    }

    private void onPrefabPaste(PrefabPasteEvent event) {
        if (event.isPasteStart()) {
            getLogger().info("Prefab paste starting: " + event.getPrefabId());
        } else {
            getLogger().info("Prefab paste completed: " + event.getPrefabId());
        }
    }

    private void onPrefabPlaceEntity(PrefabPlaceEntityEvent event) {
        Holder<EntityStore> entity = event.getHolder();
        getLogger().info("Entity placed from prefab " + event.getPrefabId());

        // Modify entity before it's added to the world
        // entity.addComponent(...);
    }
}
```

## FromPrefab Component

Entities spawned from prefabs are marked with the `FromPrefab` component.

```java
public class FromPrefab implements Component<EntityStore> {
    public static final FromPrefab INSTANCE = new FromPrefab();

    public static ComponentType<EntityStore, FromPrefab> getComponentType() {
        return EntityModule.get().getFromPrefabComponentType();
    }
}
```

### Checking if Entity is from Prefab

```java
// Check if entity was spawned from a prefab
FromPrefab fromPrefab = store.getComponent(entityRef, FromPrefab.getComponentType());
boolean isFromPrefab = fromPrefab != null;
```

**Source:** `com.hypixel.hytale.server.core.modules.entity.component.FromPrefab`

## Source Files

| Class | Path |
|-------|------|
| `PrefabStore` | `com.hypixel.hytale.server.core.prefab.PrefabStore` |
| `PrefabBuffer` | `com.hypixel.hytale.server.core.prefab.selection.buffer.impl.PrefabBuffer` |
| `IPrefabBuffer` | `com.hypixel.hytale.server.core.prefab.selection.buffer.impl.IPrefabBuffer` |
| `PrefabBufferUtil` | `com.hypixel.hytale.server.core.prefab.selection.buffer.PrefabBufferUtil` |
| `PrefabRotation` | `com.hypixel.hytale.server.core.prefab.PrefabRotation` |
| `PrefabWeights` | `com.hypixel.hytale.server.core.prefab.PrefabWeights` |
| `PrefabUtil` | `com.hypixel.hytale.server.core.util.PrefabUtil` |
| `PrefabSpawnerModule` | `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerModule` |
| `PrefabSpawnerState` | `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerState` |
| `PrefabEntry` | `com.hypixel.hytale.server.core.prefab.PrefabEntry` |
| `PrefabPasteEvent` | `com.hypixel.hytale.server.core.prefab.event.PrefabPasteEvent` |
| `PrefabPlaceEntityEvent` | `com.hypixel.hytale.server.core.prefab.event.PrefabPlaceEntityEvent` |
| `FromPrefab` | `com.hypixel.hytale.server.core.modules.entity.component.FromPrefab` |
| `SpawnPrefabInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.SpawnPrefabInteraction` |
| `CavePrefab` | `com.hypixel.hytale.server.worldgen.cave.element.CavePrefab` |
| `CavePrefabPlacement` | `com.hypixel.hytale.server.worldgen.cave.CavePrefabPlacement` |
