---
id: gameplay-systems
title: "Gameplay Systems"
sidebar_label: Gameplay Systems
sidebar_position: 12
description: Technical reference for Hytale server gameplay systems - Random tick, creative hub, teleporters, memories, sleep notifications, fire fluid, world map markers, and objectives.
---

# Gameplay Systems

:::info Source
This documentation provides a comprehensive technical reference for the core gameplay systems in the Hytale server, derived from decompiled source code analysis. Each section covers the architecture, algorithms, and configuration options available for server-side gameplay mechanics.
:::

## Random Tick System

**Package:** `com.hypixel.hytale.builtin.randomtick`

The Random Tick System drives passive world changes such as grass spreading, crop growth, and block transformations. It operates per-chunk-section and uses a dual-mode algorithm: **stable** (deterministic) ticks and **unstable** (random) ticks.

### RandomTickPlugin Registration

`RandomTickPlugin` is the entry point. It registers the `RandomTick` resource on the chunk store, the `RandomTickSystem` as a ticking system, and two built-in procedures on the `RandomTickProcedure` codec.

```java
public class RandomTickPlugin extends JavaPlugin {
   private static RandomTickPlugin INSTANCE;
   private ResourceType<ChunkStore, RandomTick> randomTickResourceType;

   public RandomTickPlugin(@Nonnull JavaPluginInit init) {
      super(init);
      INSTANCE = this;
   }

   @Override
   protected void setup() {
      this.randomTickResourceType = this.getChunkStoreRegistry()
          .registerResource(RandomTick.class, RandomTick::new);
      this.getChunkStoreRegistry().registerSystem(new RandomTickSystem());
      RandomTickProcedure.CODEC.register(
          "ChangeIntoBlock", ChangeIntoBlockProcedure.class, ChangeIntoBlockProcedure.CODEC);
      RandomTickProcedure.CODEC.register(
          "SpreadTo", SpreadToProcedure.class, SpreadToProcedure.CODEC);
   }
}
```

The two registered procedure types (`"ChangeIntoBlock"` and `"SpreadTo"`) can be referenced by name in block type asset definitions. Any block type may specify a `RandomTickProcedure` in its config to participate in random ticking.

### RandomTickProcedure Interface

```java
public interface RandomTickProcedure {
   CodecMapCodec<RandomTickProcedure> CODEC = new CodecMapCodec<>("Type");

   void onRandomTick(
       Store<ChunkStore> store, CommandBuffer<ChunkStore> commandBuffer,
       BlockSection blockSection, int worldX, int worldY, int worldZ,
       int blockId, BlockType blockType
   );
}
```

This is the extension point for all random tick behaviors. Implementations receive full chunk-section access, world coordinates, and the block type that triggered the tick.

### RandomTick Resource Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `blocksPerSectionPerTickStable` | `1` | Number of deterministic block selections per section per tick |
| `blocksPerSectionPerTickUnstable` | `3` | Number of purely random block selections per section per tick |

Each chunk section contains 32x32x32 = **32,768** blocks.

### RandomTickSystem Algorithm

The system processes every loaded chunk section that contains non-air blocks. It runs two passes per section: a **stable** pass and an **unstable** pass.

#### Stable Ticks (Deterministic Scheduling)

The stable pass guarantees that every block in a section is visited exactly once over a full cycle. The cycle length is `32768 / blocksPerSectionPerTickStable` ticks.

```java
int interval = 32768 / config.getBlocksPerSectionPerTickStable();
long baseSeed = HashUtil.hash(
    world.getTick() / (long)interval,
    (long)chunkSection.getX(),
    (long)chunkSection.getY(),
    (long)chunkSection.getZ()
);
long randomSeed = (baseSeed << 1 | 1L) & 32767L;
long randomSeed2 = baseSeed >> 16 & 32767L;
long startIndex = world.getTick() % (long)interval
    * (long)config.getBlocksPerSectionPerTickStable();

for (int i = 0; i < config.getBlocksPerSectionPerTickStable(); i++) {
    int blockIndex = (int)(
        (startIndex + (long)i) * randomSeed + randomSeed2 & 32767L
    );
    // ... look up block and invoke procedure
}
```

The seed is derived from the world tick divided by the interval plus the chunk section coordinates. This produces a permutation of block indices using a linear congruential generator (LCG) with parameters masked to 15 bits (`& 32767L`). The key properties are:

- **Full coverage:** Over `interval` ticks, every index in `[0, 32767]` is visited exactly once.
- **Spatial determinism:** The same chunk section at the same world tick always selects the same blocks.
- **Cheap computation:** Only integer multiply and bitmask operations are needed per block.

#### Unstable Ticks (Random Selection)

The unstable pass uses a standard `java.util.Random` to select blocks without regard to prior selections:

```java
Random rng = config.getRandom();
for (int ix = 0; ix < config.getBlocksPerSectionPerTickUnstable(); ix++) {
    int blockIndex = rng.nextInt(32768);
    int localX = ChunkUtil.xFromIndex(blockIndex);
    int localY = ChunkUtil.yFromIndex(blockIndex);
    int localZ = ChunkUtil.zFromIndex(blockIndex);
    // ... look up block and invoke procedure
}
```

This path provides additional stochastic coverage, useful for processes that should not be entirely predictable (e.g., fire spread or decay).

### ChangeIntoBlockProcedure

The simplest procedure: replaces the ticked block with a different block type.

```java
public class ChangeIntoBlockProcedure implements RandomTickProcedure {
   private String targetBlock;

   @Override
   public void onRandomTick(Store<ChunkStore> store, CommandBuffer<ChunkStore> commandBuffer,
       BlockSection blockSection, int worldX, int worldY, int worldZ,
       int blockId, BlockType blockType) {
      int targetBlockId = BlockType.getAssetMap().getIndex(this.targetBlock);
      if (targetBlockId != Integer.MIN_VALUE) {
         blockSection.set(ChunkUtil.indexBlock(worldX, worldY, worldZ), targetBlockId, 0, 0);
      }
   }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `TargetBlock` | `String` | Asset key of the block type to transform into |

### SpreadToProcedure

The most complex procedure. Handles block spreading with configurable directional vectors, Y-offset ranges, light requirements, tag-based targeting, and automatic reversion.

**Configuration Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `SpreadDirections` | `Vector3i[]` | (required) | Array of directional offsets for spreading |
| `MinY` | `int` | `0` | Minimum Y offset relative to source block |
| `MaxY` | `int` | `0` | Maximum Y offset relative to source block |
| `AllowedTag` | `String` | (required) | Asset tag that target blocks must have |
| `RequireEmptyAboveTarget` | `boolean` | `true` | Whether target block must have empty space above |
| `RequiredLightLevel` | `int` | `6` | Minimum combined light level (0-15) |
| `RevertBlock` | `String` | `null` | Block type to revert to when covered |

#### Spread Algorithm

The procedure executes in this order:

**Step 1 -- Revert Check.** If `RevertBlock` is configured, the block above the source is inspected. If it has a `Cube` or `CubeWithModel` draw type (i.e., it is opaque), the source block reverts:

```java
if (this.revertBlock != null) {
    int blockAtAboveId = aboveSection.get(aboveIndex);
    BlockType blockAtAbove = BlockType.getAssetMap().getAsset(blockAtAboveId);
    if (blockAtAbove != null && (blockAtAbove.getDrawType() == DrawType.Cube
            || blockAtAbove.getDrawType() == DrawType.CubeWithModel)) {
        int revert = BlockType.getAssetMap().getIndex(this.revertBlock);
        if (revert != Integer.MIN_VALUE) {
            blockSection.set(worldX, worldY, worldZ, revert, 0, 0);
            return;
        }
    }
}
```

This is used for grass blocks that revert to dirt when covered.

**Step 2 -- Light Level Check.** The system reads skylight (scaled by the world's sunlight factor from the time-of-day system) and block light from the block above the source. The maximum of the two must meet or exceed `RequiredLightLevel`:

```java
double sunlightFactor = worldTimeResource.getSunlightFactor();
int skyLight = (int)((double)aboveSection.getLocalLight().getSkyLight(aboveIndex)
    * sunlightFactor);
int blockLevel = aboveSection.getLocalLight().getBlockLightIntensity(aboveIndex);
int lightLevel = Math.max(skyLight, blockLevel);
if (lightLevel >= this.requiredLightLevel) { /* proceed */ }
```

**Step 3 -- Directional Spread.** For each Y offset in `[MinY, MaxY]` and each direction in `SpreadDirections`, the system checks:

1. The target block ID is in the `AllowedTag` set.
2. If `RequireEmptyAboveTarget` is true, the block above the target has `BlockMaterial.Empty`.
3. Cross-chunk-section lookups are handled via `getChunkSectionReference()`.

If all conditions pass, the target block is replaced with the source block's ID.

---

## Creative Hub

**Package:** `com.hypixel.hytale.builtin.creativehub`

The Creative Hub system manages a central instance-based lobby world that players enter when connecting to a hub-configured world. It supports automatic instance creation, pooling via `ConcurrentHashMap`, world persistence, and UI-driven return navigation.

### CreativeHubPlugin Setup

```java
public class CreativeHubPlugin extends JavaPlugin {
   private final Map<UUID, World> activeHubInstances = new ConcurrentHashMap<>();

   @Override
   protected void setup() {
      this.getCommandRegistry().registerCommand(new HubCommand());
      this.getCodecRegistry(Interaction.CODEC).register(
          "HubPortal", HubPortalInteraction.class, HubPortalInteraction.CODEC);
      this.getCodecRegistry(WorldConfig.PLUGIN_CODEC).register(
          CreativeHubWorldConfig.class, "CreativeHub", CreativeHubWorldConfig.CODEC);
      this.getEntityStoreRegistry().registerSystem(new ReturnToHubButtonSystem());
      this.getEventRegistry().registerGlobal(PlayerConnectEvent.class,
          CreativeHubPlugin::onPlayerConnect);
      this.getEventRegistry().registerGlobal(RemoveWorldEvent.class,
          CreativeHubPlugin::onWorldRemove);
      ReturnToHubButtonUI.register();
   }
}
```

The plugin registers:
- A `/hub` command (with aliases `cosmos` and `crossroads`, permission group: `Creative`)
- A `"HubPortal"` interaction type
- A `"CreativeHub"` world config and entity config
- Global event handlers for player connect, world removal, and player-add-to-world
- The Return to Hub button UI and its anchor action

### Instance Management

Hub instances are keyed by the **parent world's UUID**. The `getOrSpawnHubInstance` method uses `ConcurrentHashMap.compute()` for thread-safe lazy creation:

```java
public World getOrSpawnHubInstance(World parentWorld,
    CreativeHubWorldConfig hubConfig, Transform returnPoint) {
   UUID parentUuid = parentWorld.getWorldConfig().getUuid();
   return this.activeHubInstances.compute(parentUuid, (uuid, existingInstance) -> {
      if (existingInstance != null && existingInstance.isAlive()) {
         return existingInstance;
      } else {
         return InstancesPlugin.get()
             .spawnInstance(hubConfig.getStartupInstance(), parentWorld, returnPoint)
             .join();
      }
   });
}
```

Cleanup occurs in two paths:
- **World removal:** When any world is removed, the plugin scans `activeHubInstances` and removes matching entries.
- **Manual clear:** `clearHubInstance(UUID)` removes a specific entry.

### HubPortalInteraction

The portal supports **two creation modes**:

| Field | Type | Description |
|-------|------|-------------|
| `WorldName` | `String` (required) | Name of the permanent world to teleport to |
| `WorldGenType` | `String` | World generator type (e.g., `"Flat"`, `"Hytale"`). Mutually exclusive with `InstanceTemplate`. |
| `InstanceTemplate` | `String` | Instance asset to use as a template. Mutually exclusive with `WorldGenType`. |

If the target world is already loaded, `teleportToLoadedWorld` performs a synchronous teleport. Otherwise, `teleportToLoadingWorld` removes the player from their current store, awaits world creation with a **1-minute timeout**, and then adds the player to the new world. On failure, the player falls back through these layers:
1. Return to original world
2. Return to parent hub instance
3. Return to default world
4. Disconnect with error message

### Config Components

**CreativeHubWorldConfig** (per-world):

| Field | Type | Description |
|-------|------|-------------|
| `StartupInstance` | `String` | Name of the instance to spawn players into when they first join this world |

**CreativeHubEntityConfig** (per-entity):

| Field | Type | Description |
|-------|------|-------------|
| `ParentHubWorldUuid` | `UUID` | UUID of the parent world that owns the hub |

---

## Teleporter System

**Package:** `com.hypixel.hytale.builtin.adventure.teleporter`

The Teleporter System provides block-based warp portals that can teleport players within or across worlds. It includes automatic warp creation when teleporter blocks are placed, cooldown-based re-entry prevention, and visual state management.

### Teleporter Component

The `Teleporter` component is attached to block entities (in the `ChunkStore`) and holds the destination configuration:

| Field | Type | Description |
|-------|------|-------------|
| `World` | `UUID` | Destination world UUID (cross-world teleport) |
| `Transform` | `Transform` | Destination position and rotation |
| `Relative` | `byte` | Bitmask for relative coordinate transforms |
| `Warp` | `String` | Named warp destination (alternative to direct coordinates) |
| `OwnedWarp` | `String` | Warp name owned by this teleporter block |
| `IsCustomName` | `boolean` | Whether the warp name was user-customized |
| `WarpNameWordList` | `String` | ID of the word list to select default warp names from |

The `toTeleport` method resolves the destination:

```java
public Teleport toTeleport(Vector3d currentPosition, Vector3f currentRotation,
    Vector3i blockPosition) {
   if (this.warp != null && !this.warp.isEmpty()) {
      Warp targetWarp = TeleportPlugin.get().getWarps().get(this.warp.toLowerCase());
      return targetWarp != null ? targetWarp.toTeleport() : null;
   } else if (this.transform != null) {
      if (this.worldUuid != null) {
         World world = Universe.get().getWorld(this.worldUuid);
         if (world != null) {
            if (this.relativeMask != 0) {
               Transform teleportTransform = this.transform.clone();
               Transform.applyMaskedRelativeTransform(
                   teleportTransform, this.relativeMask,
                   currentPosition, currentRotation, blockPosition);
               return Teleport.createForPlayer(world, teleportTransform);
            }
            return Teleport.createForPlayer(world, this.transform);
         }
      }
   }
   return null;
}
```

### UsedTeleporter Component

Applied to the player entity after using a teleporter:

| Field | Type | Description |
|-------|------|-------------|
| `destinationWorldUuid` | `UUID` | Target world |
| `destinationPosition` | `Vector3d` | Target position |
| `clearOutXZ` | `double` | XZ radius for re-entry detection |
| `clearOutY` | `double` | Y radius for re-entry detection |

### ClearUsedTeleporterSystem

Runs after `TeleportSystems.PlayerMoveSystem` and removes the `UsedTeleporter` component when the player has moved far enough from the destination. Enforces a **100ms global cooldown** between teleportations:

```java
public static final Duration TELEPORTER_GLOBAL_COOLDOWN = Duration.ofMillis(100L);
```

Clear conditions:
1. No `TransformComponent` -> clear immediately
2. Has `Teleport` or `PendingTeleport` component -> do not clear
3. Global cooldown not elapsed -> do not clear
4. Different world UUID -> clear immediately (cross-world)
5. XZ distance squared or Y delta exceeds threshold -> clear

### Visual State Management

Teleporter blocks display in `"Active"` state when they have a valid destination warp, or `"default"` (inactive) when their destination is unavailable.

When a player places a teleporter block, a warp name is auto-generated and the warp position is derived with a 0.5-block centering offset and 0.65 vertical offset. The yaw rotation is computed from the block's rotation plus 180 degrees, so players face away from the teleporter when they arrive.

---

## Memories System

**Package:** `com.hypixel.hytale.builtin.adventure.memories`

The Memories system is a collection mechanic where players discover NPCs in the world and "capture" memories. These memories are tracked per-player and globally, with a leveling system based on total discoveries.

### MemoriesPlugin Architecture

```java
public class MemoriesPlugin extends JavaPlugin {
   private final List<MemoryProvider<?>> providers = new ObjectArrayList<>();
   private final Map<String, Set<Memory>> allMemories = new Object2ObjectRBTreeMap<>();
   private MemoriesPlugin.RecordedMemories recordedMemories;
}
```

The plugin manages:
- **Memory Providers**: Extensible sources of memories (e.g., `NPCMemoryProvider`)
- **Global Memory Store**: Persisted to `memories.json` in the universe directory with `ReentrantReadWriteLock` for thread safety
- **Per-Player Components**: `PlayerMemories` component with capacity limits

### Memory and MemoryProvider

```java
public abstract class Memory {
   public abstract String getId();
   public abstract String getTitle();
   public abstract Message getTooltipText();
   public abstract String getIconPath();
   public abstract Message getUndiscoveredTooltipText();
}

public abstract class MemoryProvider<T extends Memory> {
   private final String id;
   private final double defaultRadius;

   public double getCollectionRadius() {
      return MemoriesPlugin.get().getConfig()
          .getCollectionRadius().getOrDefault(this.id, this.defaultRadius);
   }

   public abstract Map<String, Set<Memory>> getAllMemories();
}
```

The `MemoryProvider` has a configurable `CollectionRadius` per provider ID. The radius determines how close a player must be to an NPC to capture its memory.

### NPC Memory Gathering

The `GatherMemoriesSystem` is an `EntityTickingSystem` that runs for players with the `PlayerMemories` component in Adventure mode:

```java
@Override
public void tick(float dt, int index, ...) {
   Player playerComponent = archetypeChunk.getComponent(index, this.playerComponentType);
   if (playerComponent.getGameMode() == GameMode.Adventure) {
      Vector3d position = transformComponent.getPosition();
      npcSpatialResource.getSpatialStructure().collect(position, this.radius, results);
      for (Ref<EntityStore> npcRef : results) {
         NPCEntity npcComponent = commandBuffer.getComponent(npcRef, NPCEntity.getComponentType());
         if (npcComponent != null) {
            Role role = npcComponent.getRole();
            if (role != null && role.isMemory()) {
               if (!memoriesPlugin.hasRecordedMemory(temp)
                   && playerMemoriesComponent.recordMemory(temp)) {
                  NotificationUtil.sendNotification(playerRefComponent.getPacketHandler(),
                      Message.translation("server.memories.general.collected")
                          .param("memoryTitle", Message.translation(temp.getTitle())),
                      null, "NotificationIcons/MemoriesIcon.png");
               }
            }
         }
      }
   }
}
```

### PlayerMemories Component

```java
public class PlayerMemories implements Component<EntityStore> {
   private final Set<Memory> memories = new LinkedHashSet<>();
   private int memoriesCapacity;

   public boolean recordMemory(Memory memory) {
      return this.memories.size() >= this.memoriesCapacity
          ? false : this.memories.add(memory);
   }

   public boolean takeMemories(Set<Memory> outMemories) {
      boolean result = outMemories.addAll(this.memories);
      this.memories.clear();
      return result;
   }
}
```

The `memoriesCapacity` field limits how many memories a player can hold before they must be deposited. The `takeMemories` method transfers all held memories to the global store.

### Leveling System

The memories level is determined by comparing the total recorded memories count against configurable thresholds:

```java
public int getMemoriesLevel(GameplayConfig gameplayConfig) {
   MemoriesGameplayConfig config = MemoriesGameplayConfig.get(gameplayConfig);
   int memoriesLevel = 1;
   int recordedMemoriesCount = this.getRecordedMemories().size();
   int[] memoriesAmountPerLevel = config.getMemoriesAmountPerLevel();
   for (int i = memoriesAmountPerLevel.length - 1; i >= 0; i--) {
      if (recordedMemoriesCount >= memoriesAmountPerLevel[i]) {
         return i + 2;
      }
   }
   return memoriesLevel;
}
```

### MemoriesGameplayConfig

| Field | Type | Description |
|-------|------|-------------|
| `MemoriesAmountPerLevel` | `int[]` | Threshold counts for each memories level |
| `MemoriesRecordParticles` | `String` | Particle effect when recording memories |
| `MemoriesCatchItemId` | `String` | Item to spawn as visual pickup when catching a memory |
| `MemoriesCatchEntityParticle` | `ModelParticle` | Particle effect on the NPC when caught |
| `MemoriesCatchParticleViewDistance` | `int` (default `64`) | View distance for catch particles |

---

## Sleep Notifications

**Package:** `com.hypixel.hytale.builtin.beds.sleep.systems.player`

The sleep notification system alerts non-sleeping players when others in the same world are trying to sleep, with different behavior thresholds depending on server population.

### SleepNotificationSystem

```java
public class SleepNotificationSystem extends DelayedSystem<EntityStore> {
   public static final int SMALL_SERVER_PLAYER_COUNT = 4;
   public static final double BIG_SERVER_SLEEPERS_RATIO = 0.5;
   public static final String COLOR = "#5AB5B5";

   public SleepNotificationSystem() {
      super(1.0F);  // Runs every 1.0 second
   }
}
```

### Small vs. Large Server Behavior

The system uses a sealed interface pattern with three states:

```java
private sealed interface NotificationState
    permits NotReady, SmallServer, BigServer {
   int readyToSleep();
   int playerCount();
}
```

| Condition | Threshold | Notification Type |
|-----------|-----------|-------------------|
| 4 players or fewer, 1 sleeping | Any sleeper | Single player name notification |
| 4 players or fewer, 2+ sleeping | Any sleeper | Sleeper count notification |
| More than 4 players | 50%+ ratio | Sleeper count / total count notification |

### Notification Messages and Audio

Notifications are sent only to **non-sleeping** players. The system plays a 2D sound event and sends a colored chat message (#5AB5B5 teal). Different sound indices are used for auto-loop notifications vs. initial enter notifications. A cooldown managed by `WorldSomnolence.useSleepNotificationCooldown()` prevents notification spam.

---

## Fire Fluid System

**Package:** `com.hypixel.hytale.server.core.asset.type.fluid`

The Fire Fluid system implements fire as a fluid type rather than a block entity, enabling fire to spread through the fluid simulation engine with tag-based flammability configuration.

### FireFluidTicker

```java
public class FireFluidTicker extends FluidTicker {
   private static final Vector3i[] OFFSETS = new Vector3i[]{
      new Vector3i(0, -1, 0), new Vector3i(0, 1, 0),
      new Vector3i(0, 0, -1), new Vector3i(0, 0, 1),
      new Vector3i(-1, 0, 0), new Vector3i(1, 0, 0)
   };
   private String spreadFluid;
   private int spreadFluidId;
   private FlammabilityConfig[] rawFlammabilityConfigs;
}
```

Fire always reports `AliveStatus.ALIVE` (fire does not demote or decay on its own like water) and can occupy solid blocks.

### Spread Mechanics

The fire spread algorithm:

1. **Level increase:** Each tick, the fire's fluid level increases by 1 up to the fluid's `maxFluidLevel`.
2. **Neighbor check:** All 6 cardinal directions are examined.
3. **Flammability test:** If a neighbor has no fluid and its block type matches a `FlammabilityConfig` tag pattern, fire spreads to it.
4. **Burn check:** When the source block's fire level meets or exceeds the `burnLevel` and a random roll passes `burnChance`, the block burns.
5. **Extinguish:** If the current block has no flammability config, the fire is removed.

### FlammabilityConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `TagPattern` | `String` | (required) | TagPattern asset to match blocks |
| `Priority` | `int` | `0` | Matching priority (higher checked first) |
| `BurnLevel` | `byte` | `1` | Minimum fluid level to trigger burning |
| `BurnChance` | `float` | `0.1` | Per-tick burn probability (0.0 to 1.0) |
| `ResultingBlock` | `String` | `"Empty"` | Block placed after the original burns away |
| `SoundEvent` | `String` | `null` | Sound event to play on burn |

Flammability configs are sorted by priority in descending order. The first matching tag pattern wins. The burn operation preserves the original block's rotation and filler state when replacing it.

### FluidTicker Base Class

The base `FluidTicker` provides flow rate timing via a hash-based scheduler:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `FlowRate` | `float` | `0.5` | Tick frequency in seconds |
| `CanDemote` | `boolean` | `true` | Whether the fluid loses level over time |
| `SupportedBy` | `String` | `null` | Fluid type that sustains this fluid |

---

## World Map Markers

**Package:** `com.hypixel.hytale.server.core.universe.world.worldmap.markers`

The World Map Markers system provides a per-player marker tracking framework with multiple pluggable providers for different marker types.

### MapMarkerBuilder API

```java
public class MapMarkerBuilder {
   private final String id;
   private final String image;
   private final Transform transform;
   private Message name;
   private String customName;
   private List<ContextMenuItem> contextMenuItems;
   private List<MapMarkerComponent> mapMarkerComponents;

   public MapMarkerBuilder(String id, String image, Transform transform) { ... }
   public MapMarkerBuilder withName(Message name) { ... }
   public MapMarkerBuilder withCustomName(String customName) { ... }
   public MapMarkerBuilder withContextMenuItem(ContextMenuItem item) { ... }
   public MapMarkerBuilder withComponent(MapMarkerComponent component) { ... }
   public MapMarker build() { ... }
}
```

### MapMarkerTracker (Per-Player Tracking)

Each player has a `MapMarkerTracker` that maintains a `ConcurrentHashMap` of markers currently sent to the client. The tracker uses a **10-second small-movements timer** to batch low-frequency position updates.

The `doesMarkerNeedNetworkUpdate` method applies smart delta detection:
- Name/custom name changes always trigger updates
- Yaw changes > 0.05 radians trigger immediately; > 0.001 during small-movement windows
- Position changes with distance squared > 25.0 trigger immediately; > 0.01 during small-movement windows

### Built-in Marker Providers

| Provider | Icon | Description |
|----------|------|-------------|
| `DeathMarkerProvider` | `Death.png` | Shows death positions with day number |
| `OtherPlayersMarkerProvider` | `Player.png` | Shows other players with skin UUID and altitude delta |
| `POIMarkerProvider` | (varies) | Displays global points of interest |
| `PersonalMarkersProvider` | (varies) | Shows per-player markers from `PlayerWorldData` |
| `SharedMarkersProvider` | (varies) | Shows world-wide markers from `WorldMarkersResource` |
| `RespawnMarkerProvider` | `Home.png` | Shows respawn points (beds, etc.) |
| `SpawnMarkerProvider` | `Spawn.png` | Shows the world spawn point |

### User Map Markers

User-created markers are persisted objects with:

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `String` | Unique marker ID |
| `X`, `Z` | `float` | World position |
| `Name` | `String` | User-provided name |
| `Icon` | `String` | Icon asset path |
| `ColorTint` | `Color` | Optional color tint |
| `CreatedByUuid` | `UUID` | Creator's UUID |
| `CreatedByName` | `String` | Creator's display name |

### UserMarkerValidator

Validation checks:
- Player distance to marker position (`viewRadius * 1.5 * 32` blocks max)
- Marker name length limit: **24 characters**
- Per-player marker limits (separate for personal vs. shared markers)
- Ownership permission for deletion (owner or `allowDeleteOtherPlayersSharedMarkers` config)

---

## Objectives and Quests

**Package:** `com.hypixel.hytale.builtin.adventure.objectives`

The objectives system provides quest-like tasks with world map marker integration for guiding players.

### ObjectiveTaskMarker

```java
public class ObjectiveTaskMarker {
   private String id;
   private Transform transform;
   private String icon;
   private Message name;

   public MapMarker toProto() {
      return new MapMarker(this.id, this.name.getFormattedMessage(),
          null, this.icon, PositionUtil.toTransformPacket(this.transform), null, null);
   }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Id` | `String` | Unique marker ID |
| `Transform` | `Transform` | World position and orientation |
| `Icon` | `String` | Icon asset path for the map marker |
| `Name` | `Message` | Translatable display name |

### Objective Task Types

| Task Type | Description |
|-----------|-------------|
| `GatherObjectiveTask` | Collect specific items |
| `CraftObjectiveTask` | Craft specific items |
| `CountObjectiveTask` | Perform an action N times |
| `ReachLocationTask` | Travel to a specific location |
| `UseBlockObjectiveTask` | Interact with a specific block |
| `UseEntityObjectiveTask` | Interact with a specific entity |
| `TreasureMapObjectiveTask` | Follow a treasure map |

Completion handlers include `GiveItemsCompletion` and `ClearObjectiveItemsCompletion`. The system tracks objective history via `ObjectiveHistoryComponent` for replay and review purposes.

---

## Architecture Summary

All of these gameplay systems follow Hytale's Entity Component System (ECS) pattern:

1. **Plugins** extend `JavaPlugin` and register components, systems, interactions, and event handlers during `setup()`.
2. **Components** are data-only classes implementing `Component` with codec serialization.
3. **Systems** implement `EntityTickingSystem`, `RefSystem`, `RefChangeSystem`, or `DelayedSystem` to process entities matching specific component queries.
4. **Interactions** implement the `Interaction` interface hierarchy for player-triggered behaviors.
5. **Resources** implement `Resource` for singleton data attached to stores (e.g., `RandomTick`, `WorldSomnolence`).

This architecture enables high throughput through archetype-based iteration and clean separation of data from behavior.
