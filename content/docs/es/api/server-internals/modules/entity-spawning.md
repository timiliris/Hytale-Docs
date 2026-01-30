---
id: entity-spawning
title: Sistema de Aparición de Entidades
sidebar_label: Aparición de Entidades
sidebar_position: 15
description: Documentación completa del sistema de aparición de entidades de Hytale para aparición natural de mobs, marcadores de aparición, balizas de aparición y generadores de bloques
---

# Entity Spawning System

The Entity Spawning System in Hytale provides a comprehensive framework for spawning NPCs and entities in the world. This system supports multiple spawning mechanisms including natural world spawning, spawn markers, spawn beacons, block spawners, and prefab spawners.

## Overview

The spawning system consists of several key components:

- **SpawningPlugin** - The core plugin managing all spawning functionality
- **WorldSpawnManager** - Manages natural world NPC spawning per environment
- **BeaconSpawnManager** - Manages player-proximity spawn beacons
- **SpawnMarker** - Fixed-location NPC spawners with respawn timers
- **BlockSpawner** - Block-based spawners that replace themselves with other blocks
- **PrefabSpawner** - Spawns prefab structures during world generation
- **SpawnSuppression** - Prevents spawning in designated areas

## SpawningPlugin

The `SpawningPlugin` is the core plugin that manages the entire spawning system:

```java
package com.hypixel.hytale.server.spawning;

public class SpawningPlugin extends JavaPlugin {
    // Get the singleton instance
    public static SpawningPlugin get();

    // Get spawn managers
    public WorldSpawnManager getWorldSpawnManager();
    public BeaconSpawnManager getBeaconSpawnManager();

    // Get environment spawn parameters
    public EnvironmentSpawnParameters getWorldEnvironmentSpawnParameters(int environmentIndex);

    // Get the default spawn marker model
    public Model getSpawnMarkerModel();
}
```

**Source:** `com.hypixel.hytale.server.spawning.SpawningPlugin`

## Natural World Spawning

### WorldNPCSpawn

World NPC spawns define which NPCs can naturally spawn in specific environments:

```java
package com.hypixel.hytale.server.spawning.assets.spawns.config;

public class WorldNPCSpawn extends NPCSpawn {
    // Get the asset map for world spawn configurations
    public static IndexedLookupTableAssetMap<String, WorldNPCSpawn> getAssetMap();

    // Properties
    public String getId();
    public String[] getEnvironments();           // Environments where spawning occurs
    public IntSet getEnvironmentIds();           // Environment indices
    public RoleSpawnParameters[] getNPCs();      // NPCs that can spawn
    public double[] getDayTimeRange();           // Time range (0-24 hours)
    public int[] getMoonPhaseRange();            // Moon phase range (0-4)
    public double[] getMoonPhaseWeightModifiers(); // Weight modifiers per moon phase
    public Map<LightType, double[]> getLightRange(LightType type); // Light conditions
    public DespawnParameters getDespawnParameters(); // Despawn conditions
}
```

### WorldNPCSpawn Configuration

World spawns are defined in JSON files at `NPC/Spawn/World/`:

```json
{
  "Id": "Zone1_Forest_Spawns",
  "Environments": ["Forest", "DenseForest"],
  "DayTimeRange": [0, 24],
  "MoonPhaseRange": [0, 4],
  "MoonPhaseWeightModifiers": [1.0, 1.0, 1.0, 1.5, 2.0],
  "LightRanges": {
    "Light": [0, 100],
    "SkyLight": [50, 100]
  },
  "ScaleDayTimeRange": true,
  "NPCs": [
    {
      "Id": "Kweebec",
      "Weight": 10.0,
      "SpawnBlockSet": "GrassBlocks",
      "Flock": "Kweebec_Small_Flock"
    },
    {
      "Id": "Trork_Scout",
      "Weight": 5.0,
      "SpawnBlockSet": "SolidBlocks"
    }
  ],
  "Despawn": {
    "DayTimeRange": [6, 18],
    "MoonPhaseRange": [0, 4]
  }
}
```

### RoleSpawnParameters

Each NPC in a spawn configuration has its own parameters:

```java
package com.hypixel.hytale.server.spawning.assets.spawns.config;

public class RoleSpawnParameters implements IWeightedElement {
    public String getId();              // NPC Role ID
    public double getWeight();          // Relative spawn weight
    public String getSpawnBlockSet();   // Valid blocks to spawn on
    public int getSpawnBlockSetIndex(); // Block set index
    public int getSpawnFluidTagIndex(); // Valid fluids to spawn on
    public String getFlockDefinitionId(); // Flock definition for group spawns
    public FlockAsset getFlockDefinition();
}
```

### Light Types

The spawning system supports multiple light conditions:

| Tipo de Luz  | Descripción                                   |
| ------------ | --------------------------------------------- |
| `Light`      | Nivel de luz combinado total (0-100)          |
| `SkyLight`   | Luz basada en profundidad subterránea (0-100) |
| `Sunlight`   | Luz basada en hora del día (0-100)            |
| `RedLight`   | Nivel de luz roja (0-100)                     |
| `GreenLight` | Nivel de luz verde (0-100)                    |
| `BlueLight`  | Nivel de luz azul (0-100)                     |

**Source:** `com.hypixel.hytale.server.spawning.assets.spawns.config.WorldNPCSpawn`

## Spawn Beacons

Spawn beacons spawn NPCs around players in specific environments with configurable parameters.

### BeaconNPCSpawn

```java
package com.hypixel.hytale.server.spawning.assets.spawns.config;

public class BeaconNPCSpawn extends NPCSpawn {
    // Get the asset map
    public static IndexedLookupTableAssetMap<String, BeaconNPCSpawn> getAssetMap();

    // Spawn distances
    public double getTargetDistanceFromPlayer(); // Ideal spawn distance
    public double getMinDistanceFromPlayer();    // Minimum spawn distance
    public double getBeaconRadius();             // Beacon influence radius
    public double getSpawnRadius();              // Physical spawn area

    // Spawn limits
    public int getMaxSpawnedNpcs();              // Max concurrent NPCs
    public int[] getConcurrentSpawnsRange();     // NPCs per spawn wave

    // Spawn timing
    public Duration[] getSpawnAfterGameTimeRange(); // Game time cooldown
    public Duration[] getSpawnAfterRealTimeRange(); // Real time cooldown
    public double[] getInitialSpawnDelay();      // Initial delay before first spawn

    // Despawn settings
    public double getNpcIdleDespawnTimeSeconds(); // Idle NPC despawn time
    public Duration getBeaconVacantDespawnTime(); // Beacon despawn when no players

    // NPC configuration
    public String getNpcSpawnState();            // Force NPC into this state
    public String getNpcSpawnSubState();         // Force NPC substate
    public String getTargetSlot();               // Target slot for player

    // Suppression
    public String getSpawnSuppression();         // Attached suppression
    public boolean isOverrideSpawnSuppressors(); // Ignore suppressions

    // Scaling curves
    public ScaledXYResponseCurve getMaxSpawnsScalingCurve();      // Scale max NPCs with player count
    public ScaledXYResponseCurve getConcurrentSpawnsScalingCurve(); // Scale spawn rate with players
}
```

### BeaconNPCSpawn Configuration

Beacon spawns are defined in JSON files at `NPC/Spawn/Beacons/`:

```json
{
  "Id": "Forest_Hostile_Beacon",
  "Environments": ["Forest", "DenseForest"],
  "Model": "Spawn_Beacon_Hostile",
  "DayTimeRange": [20, 6],
  "TargetDistanceFromPlayer": 15.0,
  "MinDistanceFromPlayer": 8.0,
  "YRange": [-5, 10],
  "MaxSpawnedNPCs": 5,
  "ConcurrentSpawnsRange": [1, 3],
  "SpawnAfterGameTimeRange": ["PT2M", "PT5M"],
  "InitialSpawnDelayRange": [5.0, 15.0],
  "NPCIdleDespawnTime": 30.0,
  "BeaconVacantDespawnGameTime": "PT10M",
  "BeaconRadius": 25.0,
  "SpawnRadius": 20.0,
  "NPCSpawnState": "Chase",
  "TargetSlot": "LockedTarget",
  "SpawnSuppression": "Hostile_Suppression",
  "NPCs": [
    {
      "Id": "Trork_Scout",
      "Weight": 5.0,
      "Flock": "Trork_Patrol"
    },
    {
      "Id": "Skeleton_Archer",
      "Weight": 3.0
    }
  ]
}
```

### SpawnBeacon Entity

The `SpawnBeacon` entity manages individual beacon instances:

```java
package com.hypixel.hytale.server.spawning.beacons;

public class SpawnBeacon extends Entity {
    // Get component type
    public static ComponentType<EntityStore, SpawnBeacon> getComponentType();

    // Get/set spawn configuration
    public BeaconSpawnWrapper getSpawnWrapper();
    public void setSpawnWrapper(BeaconSpawnWrapper spawnWrapper);
    public String getSpawnConfigId();

    // Trigger spawning manually
    public boolean manualTrigger(
        Ref<EntityStore> ref,
        FloodFillPositionSelector positionSelector,
        Ref<EntityStore> targetRef,
        Store<EntityStore> store
    );

    // Visibility (only visible in Creative mode)
    public boolean isHiddenFromLivingEntity(...);

    // Not collidable
    public boolean isCollidable(); // Returns false
}
```

**Source:** `com.hypixel.hytale.server.spawning.beacons.SpawnBeacon`

## Spawn Markers

Spawn markers are fixed-location spawners that spawn NPCs with respawn timers.

### SpawnMarker Configuration

```java
package com.hypixel.hytale.server.spawning.assets.spawnmarker.config;

public class SpawnMarker {
    // Get asset map
    public static DefaultAssetMap<String, SpawnMarker> getAssetMap();

    // Properties
    public String getId();
    public String getModel();                     // Visual representation
    public IWeightedMap<SpawnConfiguration> getWeightedConfigurations(); // NPCs to spawn
    public double getExclusionRadius();           // No spawn if player in range
    public double getMaxDropHeightSquared();      // Max ground offset
    public boolean isRealtimeRespawn();           // Use real time vs game time
    public boolean isManualTrigger();             // Requires manual trigger
    public double getDeactivationDistance();      // Distance to store NPCs
    public double getDeactivationTime();          // Delay before deactivation
}
```

### SpawnMarker.SpawnConfiguration

Each spawn marker can spawn different NPCs with weights:

```java
public static class SpawnConfiguration implements IWeightedElement {
    public String getNpc();                    // NPC role name
    public double getWeight();                 // Spawn weight
    public double getRealtimeRespawnTime();    // Seconds until respawn
    public Duration getSpawnAfterGameTime();   // Game time until respawn
    public String getFlockDefinitionId();      // Optional flock
    public FlockAsset getFlockDefinition();
}
```

### SpawnMarker JSON Configuration

Spawn markers are defined in JSON files at `NPC/Spawn/Markers/`:

```json
{
  "Id": "Village_Guard_Marker",
  "Model": "NPC_Spawn_Marker",
  "ExclusionRadius": 10.0,
  "MaxDropHeight": 3.0,
  "RealtimeRespawn": false,
  "ManualTrigger": false,
  "DeactivationDistance": 50.0,
  "DeactivationTime": 10.0,
  "NPCs": [
    {
      "Name": "Village_Guard",
      "Weight": 1.0,
      "SpawnAfterGameTime": "P1D"
    },
    {
      "Name": null,
      "Weight": 0.2,
      "SpawnAfterGameTime": "PT1H"
    }
  ]
}
```

### SpawnMarkerEntity Component

The `SpawnMarkerEntity` component manages spawn marker state:

```java
package com.hypixel.hytale.server.spawning.spawnmarkers;

public class SpawnMarkerEntity implements Component<EntityStore> {
    // Get component type
    public static ComponentType<EntityStore, SpawnMarkerEntity> getComponentType();

    // Configuration
    public SpawnMarker getCachedMarker();
    public void setSpawnMarker(SpawnMarker marker);
    public String getSpawnMarkerId();

    // Spawn state
    public int getSpawnCount();
    public void setSpawnCount(int count);
    public int decrementAndGetSpawnCount();

    // Respawn timing
    public void setRespawnCounter(double seconds);
    public boolean tickRespawnTimer(float dt);
    public void setSpawnAfter(Instant instant);
    public Instant getSpawnAfter();
    public void setGameTimeRespawn(Duration duration);
    public Duration pollGameTimeRespawn();

    // Suppression
    public Set<UUID> getSuppressedBy();
    public void suppress(UUID suppressor);
    public void releaseSuppression(UUID suppressor);
    public void clearAllSuppressions();

    // Manual trigger
    public boolean isManualTrigger();
    public boolean trigger(Ref<EntityStore> markerRef, Store<EntityStore> store);

    // Internal spawning
    public boolean spawnNPC(Ref<EntityStore> ref, SpawnMarker marker, Store<EntityStore> store);
}
```

**Source:** `com.hypixel.hytale.server.spawning.spawnmarkers.SpawnMarkerEntity`

## Spawn Suppression

Spawn suppressions prevent NPC spawning in designated areas.

### SpawnSuppression Configuration

```java
package com.hypixel.hytale.server.spawning.assets.spawnsuppression;

public class SpawnSuppression {
    // Get asset map
    public static IndexedAssetMap<String, SpawnSuppression> getAssetMap();

    // Properties
    public String getId();
    public double getRadius();              // Suppression radius
    public int[] getSuppressedGroupIds();   // NPC groups to suppress
    public boolean isSuppressSpawnMarkers(); // Also suppress spawn markers
}
```

### SpawnSuppression JSON Configuration

Suppressions are defined in JSON files at `NPC/Spawn/Suppression/`:

```json
{
  "Id": "Village_Safe_Zone",
  "SuppressionRadius": 50.0,
  "SuppressedGroups": ["Hostile", "Undead"],
  "SuppressSpawnMarkers": true
}
```

**Source:** `com.hypixel.hytale.server.spawning.assets.spawnsuppression.SpawnSuppression`

## Block Spawners

Block spawners are special blocks that replace themselves with other blocks during world loading.

### BlockSpawner Component

```java
package com.hypixel.hytale.builtin.blockspawner.state;

public class BlockSpawner implements Component<ChunkStore> {
    // Get component type
    public static ComponentType<ChunkStore, BlockSpawner> getComponentType();

    // Properties
    public String getBlockSpawnerId();
    public void setBlockSpawnerId(String id);
}
```

### BlockSpawnerTable Configuration

Block spawner tables define weighted block selections:

```json
{
  "Id": "Ore_Spawner",
  "Entries": [
    {
      "Block": "Stone",
      "Weight": 70.0,
      "Rotation": "NONE"
    },
    {
      "Block": "Iron_Ore",
      "Weight": 20.0,
      "Rotation": "RANDOM"
    },
    {
      "Block": "Gold_Ore",
      "Weight": 8.0,
      "Rotation": "RANDOM"
    },
    {
      "Block": "Diamond_Ore",
      "Weight": 2.0,
      "Rotation": "RANDOM"
    }
  ]
}
```

### BlockSpawnerEntry Rotation Modes

| Mode      | Description                            |
| --------- | -------------------------------------- |
| `NONE`    | No rotation applied                    |
| `RANDOM`  | Random rotation based on position hash |
| `INHERIT` | Inherit rotation from spawner block    |

**Source:** `com.hypixel.hytale.builtin.blockspawner.BlockSpawnerPlugin`

## Prefab Spawners

Prefab spawners place prefab structures during world generation.

### PrefabSpawnerState

```java
package com.hypixel.hytale.server.core.modules.prefabspawner;

public class PrefabSpawnerState extends BlockState {
    public static final String PREFAB_SPAWNER_TYPE = "prefabspawner";

    // Properties
    public String getPrefabPath();           // Prefab path (dot notation)
    public void setPrefabPath(String path);

    public boolean isFitHeightmap();         // Follow terrain heightmap
    public void setFitHeightmap(boolean fit);

    public boolean isInheritSeed();          // Inherit worldgen ID
    public void setInheritSeed(boolean inherit);

    public boolean isInheritHeightCondition(); // Inherit height checks
    public void setInheritHeightCondition(boolean inherit);

    public PrefabWeights getPrefabWeights(); // Weighted prefab selection
    public void setPrefabWeights(PrefabWeights weights);
}
```

**Source:** `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerState`

## Spawning Context

The `SpawningContext` manages spawn position validation:

```java
package com.hypixel.hytale.server.spawning;

public class SpawningContext {
    // Position data
    public int xBlock, yBlock, zBlock;
    public double xSpawn, ySpawn, zSpawn;
    public double yaw, pitch, roll;

    // Ground information
    public int groundLevel;
    public BlockType groundBlockType;
    public int groundFluidId;
    public Fluid groundFluid;

    // Water level
    public int waterLevel;
    public int airHeight;

    // Set spawnable NPC
    public boolean setSpawnable(ISpawnableWithModel spawnable);
    public boolean setSpawnable(ISpawnableWithModel spawnable, boolean maxScale);

    // Set spawn location
    public boolean set(World world, double x, double y, double z);
    public void setChunk(WorldChunk chunk, int environmentIndex);
    public boolean setColumn(int x, int z, int yHint, int[] yRange);

    // Spawn validation
    public SpawnTestResult canSpawn();
    public SpawnTestResult canSpawn(boolean testBlocks, boolean testEntities);

    // Position helpers
    public boolean isOnSolidGround();
    public boolean isInWater(float minDepth);
    public boolean isInAir(double height);
    public boolean canBreathe(boolean breathesInAir, boolean breathesInWater);
    public boolean validatePosition(int invalidMaterials);

    // Get results
    public Vector3d newPosition();
    public Vector3f newRotation();
    public Model getModel();
}
```

### SpawnTestResult

```java
package com.hypixel.hytale.server.spawning;

public enum SpawnTestResult {
    TEST_OK,              // Spawn is valid
    FAIL_NO_POSITION,     // No valid position found
    FAIL_INVALID_POSITION, // Position blocked
    FAIL_INTERSECT_ENTITY, // Would overlap entity
    FAIL_NO_MOTION_CONTROLLERS, // NPC can't move here
    FAIL_NOT_SPAWNABLE,   // NPC not spawnable
    FAIL_NOT_BREATHABLE   // NPC can't breathe here
}
```

### SpawnRejection

```java
package com.hypixel.hytale.server.spawning;

public enum SpawnRejection {
    OUTSIDE_LIGHT_RANGE,  // Light level invalid
    INVALID_SPAWN_BLOCK,  // Wrong block type
    INVALID_POSITION,     // Position blocked
    NO_POSITION,          // No position found
    NOT_BREATHABLE,       // Can't breathe
    OTHER                 // Other reason
}
```

**Source:** `com.hypixel.hytale.server.spawning.SpawningContext`

## Spawning Entities Programmatically

### Using NPCPlugin

```java
import com.hypixel.hytale.server.npc.NPCPlugin;
import com.hypixel.hytale.server.npc.entities.NPCEntity;
import it.unimi.dsi.fastutil.Pair;

public class SpawnExample {

    public Pair<Ref<EntityStore>, NPCEntity> spawnNPC(
        Store<EntityStore> store,
        String roleName,
        Vector3d position,
        Vector3f rotation
    ) {
        NPCPlugin npcPlugin = NPCPlugin.get();
        int roleIndex = npcPlugin.getIndex(roleName);

        return npcPlugin.spawnEntity(
            store,
            roleIndex,
            position,
            rotation,
            null,  // Use default model
            null   // No post-spawn callback
        );
    }

    public Pair<Ref<EntityStore>, NPCEntity> spawnNPCWithCallback(
        Store<EntityStore> store,
        String roleName,
        Vector3d position,
        Vector3f rotation
    ) {
        NPCPlugin npcPlugin = NPCPlugin.get();
        int roleIndex = npcPlugin.getIndex(roleName);

        return npcPlugin.spawnEntity(
            store,
            roleIndex,
            position,
            rotation,
            null,
            (npc, ref, componentStore) -> {
                // Post-spawn configuration
                npc.getRole().getStateSupport().setState(ref, "Idle", null, componentStore);
            }
        );
    }
}
```

### Using SpawningContext for Validation

```java
import com.hypixel.hytale.server.spawning.SpawningContext;
import com.hypixel.hytale.server.spawning.SpawnTestResult;

public class ValidatedSpawn {

    public boolean trySpawnAt(
        World world,
        ISpawnableWithModel spawnable,
        double x, double y, double z
    ) {
        SpawningContext context = new SpawningContext();

        // Set the spawnable (loads model and bounds)
        if (!context.setSpawnable(spawnable)) {
            return false;
        }

        // Set the position and validate
        if (!context.set(world, x, y, z)) {
            return false;
        }

        // Check if spawn is valid
        SpawnTestResult result = context.canSpawn();
        if (result != SpawnTestResult.TEST_OK) {
            context.releaseFull();
            return false;
        }

        // Get validated position
        Vector3d spawnPos = context.newPosition();
        Vector3f spawnRot = context.newRotation();

        context.releaseFull();
        return true;
    }
}
```

### Spawning with Flocks

```java
import com.hypixel.hytale.server.flock.FlockPlugin;
import com.hypixel.hytale.server.flock.config.FlockAsset;

public class FlockSpawnExample {

    public void spawnFlock(
        Store<EntityStore> store,
        String roleName,
        String flockId,
        Vector3d position,
        Vector3f rotation
    ) {
        NPCPlugin npcPlugin = NPCPlugin.get();
        int roleIndex = npcPlugin.getIndex(roleName);

        // Spawn the leader
        Pair<Ref<EntityStore>, NPCEntity> leaderPair = npcPlugin.spawnEntity(
            store, roleIndex, position, rotation, null, null
        );

        // Get flock definition
        FlockAsset flockAsset = FlockAsset.getAssetMap().getAsset(flockId);

        // Spawn flock members around leader
        FlockPlugin.trySpawnFlock(
            leaderPair.first(),
            leaderPair.second(),
            store,
            roleIndex,
            position,
            rotation,
            flockAsset,
            null  // Post-spawn callback
        );
    }
}
```

## Console Commands

### Spawn Commands

| Command              | Description               |
| -------------------- | ------------------------- |
| `/spawn beacons`     | List active spawn beacons |
| `/spawn markers`     | List active spawn markers |
| `/spawn populate`    | Force spawn population    |
| `/spawn stats`       | Show spawning statistics  |
| `/spawn suppression` | List active suppressions  |

### Block Spawner Commands

| Command                  | Description                   |
| ------------------------ | ----------------------------- |
| `/blockspawner get`      | Get block spawner at position |
| `/blockspawner set <id>` | Set block spawner ID          |

### Prefab Spawner Commands

| Command                                   | Description                 |
| ----------------------------------------- | --------------------------- |
| `/prefabspawner get`                      | Get prefab spawner settings |
| `/prefabspawner set <path>`               | Set prefab path             |
| `/prefabspawner weight <prefab> <weight>` | Set prefab weight           |

## NPCSpawn Base Properties

All spawn configurations (WorldNPCSpawn, BeaconNPCSpawn) share these base properties:

```java
package com.hypixel.hytale.server.spawning.assets.spawns.config;

public abstract class NPCSpawn {
    // Default ranges
    public static final double[] DEFAULT_DAY_TIME_RANGE = {0.0, Double.MAX_VALUE};
    public static final int[] DEFAULT_MOON_PHASE_RANGE = {0, Integer.MAX_VALUE};
    public static final double[] FULL_LIGHT_RANGE = {0.0, 100.0};

    // Common properties
    public abstract String getId();
    public RoleSpawnParameters[] getNPCs();
    public DespawnParameters getDespawnParameters();
    public String[] getEnvironments();
    public IntSet getEnvironmentIds();
    public double[] getDayTimeRange();
    public int[] getMoonPhaseRange();
    public double[] getLightRange(LightType lightType);
    public boolean isScaleDayTimeRange();
}
```

### DespawnParameters

```java
public static class DespawnParameters {
    public double[] getDayTimeRange();  // Time range for despawning
    public int[] getMoonPhaseRange();   // Moon phase range for despawning
}
```

## Source Files

| Class                 | Path                                                                          |
| --------------------- | ----------------------------------------------------------------------------- |
| `SpawningPlugin`      | `com.hypixel.hytale.server.spawning.SpawningPlugin`                           |
| `SpawningContext`     | `com.hypixel.hytale.server.spawning.SpawningContext`                          |
| `SpawnTestResult`     | `com.hypixel.hytale.server.spawning.SpawnTestResult`                          |
| `SpawnRejection`      | `com.hypixel.hytale.server.spawning.SpawnRejection`                           |
| `ISpawnable`          | `com.hypixel.hytale.server.spawning.ISpawnable`                               |
| `NPCSpawn`            | `com.hypixel.hytale.server.spawning.assets.spawns.config.NPCSpawn`            |
| `WorldNPCSpawn`       | `com.hypixel.hytale.server.spawning.assets.spawns.config.WorldNPCSpawn`       |
| `BeaconNPCSpawn`      | `com.hypixel.hytale.server.spawning.assets.spawns.config.BeaconNPCSpawn`      |
| `RoleSpawnParameters` | `com.hypixel.hytale.server.spawning.assets.spawns.config.RoleSpawnParameters` |
| `SpawnMarker`         | `com.hypixel.hytale.server.spawning.assets.spawnmarker.config.SpawnMarker`    |
| `SpawnMarkerEntity`   | `com.hypixel.hytale.server.spawning.spawnmarkers.SpawnMarkerEntity`           |
| `SpawnBeacon`         | `com.hypixel.hytale.server.spawning.beacons.SpawnBeacon`                      |
| `SpawnSuppression`    | `com.hypixel.hytale.server.spawning.assets.spawnsuppression.SpawnSuppression` |
| `WorldSpawnManager`   | `com.hypixel.hytale.server.spawning.world.manager.WorldSpawnManager`          |
| `BeaconSpawnManager`  | `com.hypixel.hytale.server.spawning.managers.BeaconSpawnManager`              |
| `SpawnManager`        | `com.hypixel.hytale.server.spawning.managers.SpawnManager`                    |
| `BlockSpawnerPlugin`  | `com.hypixel.hytale.builtin.blockspawner.BlockSpawnerPlugin`                  |
| `BlockSpawner`        | `com.hypixel.hytale.builtin.blockspawner.state.BlockSpawner`                  |
| `PrefabSpawnerModule` | `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerModule`    |
| `PrefabSpawnerState`  | `com.hypixel.hytale.server.core.modules.prefabspawner.PrefabSpawnerState`     |
