---
id: update-3
title: "Update 3 - February 17, 2026"
sidebar_label: Update 3
sidebar_position: 10
description: Complete changelog for Hytale Server Update 3, the first major update since initial release (after two minor patches) - Multi-channel networking, ECS component updates, world generation overhaul, new gameplay systems, and more.
---

# Update 3 - February 17, 2026

:::info Server Update
This changelog documents all internal changes since the **initial release (January 13, 2026)** up to the **February 17, 2026** build (Update 3), identified through automated decompilation and comparative analysis. After two minor patches, this is the first major update since Hytale's Early Access launch.
:::

## Overview

| Metric | Previous Version | New Version | Delta |
|--------|-----------------|-------------|-------|
| JAR Size | 84 MB | 125 MB | +49% |
| Java Files | 15,425 | 15,826 | +401 |
| New Hytale Files | - | 98 | - |
| Removed Hytale Files | 34 | - | - |
| Modified Hytale Files | - | 1,706 | - |
| Server Config Version | 3 | 4 | +1 |

### New Dependencies

- **RocksDB**: New chunk storage engine (native binaries included for Linux, macOS, Windows)
- **Sentry**: Improved telemetry integration (sessions, OS context, asset packs)

---

## 1. Network Protocol

### 1.1 Multi-Channel Architecture

The protocol moves from a single channel to **3 independent communication channels**:

```java
public enum NetworkChannel {
    Default(0),    // Standard game packets
    Chunks(1),     // Chunk/world streaming
    WorldMap(2);   // World map data
}
```

**Modified `Packet` interface**:
```java
// BEFORE
public interface Packet {
    int getId();
    void serialize(ByteBuf buf);
    int computeSize();
}

// AFTER
public interface Packet {
    int getId();
    NetworkChannel getChannel();  // NEW
    void serialize(ByteBuf buf);
    int computeSize();
}
```

### 1.2 Directional Packet Typing

Two new marker interfaces distinguish packet direction at compile time:

```java
public interface ToClientPacket extends Packet {}  // Server -> Client
public interface ToServerPacket extends Packet {}  // Client -> Server
```

`CachedPacket` is now restricted to `ToClientPacket` only, preventing server packet caching.

### 1.3 ComponentUpdate System (26 Types)

New **polymorphic ECS** architecture for entity updates. Instead of sending the full state, only modified components are transmitted:

```java
public abstract class ComponentUpdate {
    public static ComponentUpdate deserialize(ByteBuf buf, int offset) {
        int typeId = VarInt.peek(buf, offset);
        return switch (typeId) {
            case 0  -> NameplateUpdate.deserialize(...);
            case 1  -> UIComponentsUpdate.deserialize(...);
            case 2  -> CombatTextUpdate.deserialize(...);
            // ... 23 more types
            case 25 -> PropUpdate.deserialize(...);
            default -> throw ProtocolException.unknownPolymorphicType(...);
        };
    }
}
```

**Complete ComponentUpdate registry:**

| ID | Class | Size | Description |
|----|-------|------|-------------|
| 0 | `NameplateUpdate` | Variable | Nameplate text |
| 1 | `UIComponentsUpdate` | Variable | Entity UI elements |
| 2 | `CombatTextUpdate` | Variable | Damage/healing numbers |
| 3 | `ModelUpdate` | Variable | 3D model + scale |
| 4 | `PlayerSkinUpdate` | Variable | Player skin (nullable) |
| 5 | `ItemUpdate` | Variable | Held item + metadata |
| 6 | `BlockUpdate` | 8 bytes | Block ID + scale |
| 7 | `EquipmentUpdate` | Variable | Armor + hands (nullable bitfield) |
| 8 | `EntityStatsUpdate` | Variable | Map stat ID -> values |
| 9 | `TransformUpdate` | 49 bytes | Position + rotation + scale |
| 10 | `MovementStatesUpdate` | 22 bytes | Movement states |
| 11 | `EntityEffectsUpdate` | Variable | Status effects |
| 12 | `InteractionsUpdate` | Variable | Available interactions + hint |
| 13 | `DynamicLightUpdate` | 4 bytes | Dynamic RGB light |
| 14 | `InteractableUpdate` | Variable | Interaction hint (nullable) |
| 15 | `IntangibleUpdate` | 0 bytes | Intangible marker |
| 16 | `InvulnerableUpdate` | 0 bytes | Invulnerable marker |
| 17 | `RespondToHitUpdate` | 0 bytes | Hit response marker |
| 18 | `HitboxCollisionUpdate` | 4 bytes | Collision config index |
| 19 | `RepulsionUpdate` | 4 bytes | Repulsion config index |
| 20 | `PredictionUpdate` | 16 bytes | Client prediction UUID |
| 21 | `AudioUpdate` | Variable | Sound event IDs |
| 22 | `MountedUpdate` | Variable | Mount state |
| 23 | `NewSpawnUpdate` | 0 bytes | New spawn marker |
| 24 | `ActiveAnimationsUpdate` | Variable | Active animations |
| 25 | `PropUpdate` | 0 bytes | Prop marker |

### 1.4 New Packets

| Packet | Direction | ID | Description |
|--------|-----------|-----|-------------|
| `CreateUserMarker` | Client->Server | 246 | Place map marker |
| `BuilderToolSetEntityCollision` | Client->Server | 425 | Modify entity collision |
| `UpdateAnchorUI` | Server->Client | 235 | Dynamic UI update (compressed) |
| `MapMarkerComponent` (4 sub-types) | - | - | Polymorphic marker components |

**MapMarkerComponent sub-types:**
- Type 0: `PlayerMarkerComponent` - Player position (UUID, 16 bytes)
- Type 1: `PlacedByMarkerComponent` - Marker placed by player (UUID + formatted name)
- Type 2: `HeightDeltaIconComponent` - Altitude delta with icons (17+ bytes)
- Type 3: `TintComponent` - RGB color tint (3 bytes)

### 1.5 Serialization

Serialization patterns used in ComponentUpdates:

- **Nullable bitfield**: 1 byte to track up to 8 optional fields
- **VarInt**: Variable-length integers for sizes
- **Offset addressing**: Fixed header with offsets to variable data
- **Validation**: `validateStructure()` on each type to prevent buffer overflow
- **Limit**: Arrays limited to 4,096,000 elements max

---

## 2. World Generation

### 2.1 Biome System Overhaul

**Removed:**
- `BiomeType.java`, `SimpleBiomeType.java` (type-based system)
- `biomemap/` (entire directory)
- `Indexer.java` (global indexing)
- `AllStoneMaterialProvider`, `GrassTopMaterialProvider` (specific materials)
- `CeilingPattern` (terrain patterns)
- `SpherePositionProvider`, `VerticalEliminatorPositionProvider`
- `Reference.java`, `BaseHeightReference.java`

**Replaced by:**
```java
// New: Clean interface
public interface Biome extends MaterialSource, PropsSource,
                               EnvironmentSource, TintSource {
    // Composed sources via interfaces
}

// Concrete implementation
public class SimpleBiome implements Biome {
    // Terrain density, materials, props, environment, tint
}
```

### 2.2 Generic Registry System

```java
public class Registry<T> {
    private Map<T, Integer> objectToId;
    private Map<Integer, T> idToObject;

    public int getIdOrRegister(T object);  // Auto-assign ID
    public T getObject(int id);
    public int size();
    public void forEach(BiConsumer<Integer, T> consumer);
}
```

Replaces the old `Indexer` with a generic type-safe bidirectional mapping.

### 2.3 WorldStructure

New container encapsulating the world structure:

```java
public class WorldStructure {
    BiCarta<Integer> biomeMap;          // 2D biome map
    Registry<Biome> biomeRegistry;      // Biome registry
    int biomeTransitionDistance;         // Transition zone
    int maxBiomeEdgeDistance;            // Max edge distance
    PositionProvider spawnPositions;     // Spawn points
}
```

### 2.4 New Position Providers

| Class | Description |
|-------|-------------|
| `BoundPositionProvider` | Constrains positions within 3D bounds |
| `SimpleHorizontalPositionProvider` | Filters by Y range |
| `FrameworkPositionProviderAsset` | References reusable definitions |

### 2.5 New Props

| Class | Description |
|-------|-------------|
| `OffsetProp` | Displaces a child prop by a 3D vector |
| `WeightedProp` | Weighted random selection among multiple props |

### 2.6 Framework System

New pattern for reusable assets between biomes:

- `PositionsFrameworkAsset`: Globally accessible named positions
- `DecimalConstantsFrameworkAsset`: Shared numeric constants

### 2.7 Height-Based Density

```java
public class YSampledDensity {
    // Caches density values at 2 Y positions
    // Linearly interpolates between samples
    // Optimizes height-based terrain calculations
}
```

### 2.8 Versioned Asset Loading

```java
record WorldGenConfig(Path path, String name, Semver version);

public class AssetFileSystem {
    // Loads worldgen assets from versioned packs
    // Respects semantic versioning
    // Caches resources by path
}
```

---

## 3. New Gameplay Systems

### 3.1 Random Tick (New Module)

Random tick system for dynamic world evolution:

**Configuration:**
- **Stable blocks**: 1 tick per section per server tick
- **Unstable blocks**: 3 random ticks per section per server tick
- Deterministic randomization based on `hash(tick/interval, x, y, z)`

**Available Procedures:**

**ChangeIntoBlockProcedure**: Simple block transformation
- `TargetBlock` (String): Target block for transformation
- Use cases: Plant maturation, degradation, ice melting

**SpreadToProcedure**: Block spreading with environmental conditions
- `SpreadDirections` (Vector3i[]): Spread directions
- `MinY` / `MaxY` (int): Vertical range
- `AllowedTag` (String): Target block tag
- `RequireEmptyAboveTarget` (boolean): Air above required (default: true)
- `RequiredLightLevel` (int): Minimum light level (default: 6)
- `RevertBlock` (String): Revert block if covered

**Use cases:** Grass growth (requires light, reverts to dirt in dark), moss, vines, fire.

### 3.2 Creative Hub (New Module)

Isolated creative spaces with instance management:

- **Instance pooling**: 1 hub per parent world, reused
- **Dual creation**: Pre-built templates OR procedural generation (Flat, Hytale, etc.)
- **Safe teleportation**: Handles worlds still loading
- **Persistence**: Remembers last position per player/world
- **Back button**: Conditional UI via `AnchorActionModule`
- **Auto-cleanup**: Removes invalid instances

### 3.3 Teleporter System

- **Destination tracking**: World UUID + precise position
- **Clear-out zone**: XZ and Y radii to detect exit from effect
- **Global cooldown**: 100ms between uses
- **Visual sync**: Updates teleporter block state (Active/Default)
- **Multi-world**: Cross-world teleportation with cleanup

### 3.4 Memories System

Progressive discovery mechanic:

- **Block-triggered**: Each memory linked to a block position
- **Notification UI**: Custom page on discovery
- **Actionable button**: "Discover memories" -> collection interface
- **Admin command**: `MemoriesSetCountCommand` to manage counter

### 3.5 Sleep Notifications

Adaptive behavior based on server size:

| Server Size | Requirement | Display |
|-------------|-------------|---------|
| Small (4 players or fewer) | 1 player sleeping is enough | Shows sleeping player's name |
| Large (more than 4 players) | 50% of players must sleep | Shows number of sleeping players |

- Notification cooldown: 100ms+
- Distinct sound for auto-loop vs manual entry
- Chat color: Teal (#5AB5B5)

### 3.6 Fire System (Fire Fluid)

Fire spreads like a fluid with flammability rules:

- **Tag-based configuration**: Flammable block patterns
- **Priority**: Multiple configs with priority ordering
- **Probability**: Chance to burn per tick
- **Substitution**: Burned block -> configured result (ash, coal, etc.)
- **Cross-section propagation**: Traverses chunk boundaries

### 3.7 World Map Markers (Overhaul)

**MapMarkerTracker** (per player):
- Distance-based culling
- Delta updates (only changes sent)
- Movement threshold: >5.0 blocks (large), >0.1 blocks (small)
- Rotation threshold: >0.05 radians
- Optional player filter

**MapMarkerBuilder** (fluent API):
```java
new MapMarkerBuilder()
    .name(message)
    .icon("marker_quest")
    .position(transform)
    .contextMenuItems(items)
    .addComponent(new TintComponent(color))
    .build();
```

### 3.8 Objectives and Quests

- **ObjectiveTaskMarker**: Task markers on the map with icon and localized name
- **ReachLocationMarkerAsset**: Radius-based detection zones (new `radius` field)
- **StartObjectiveInteraction**: Start an objective from an item

---

## 4. Builder Tools

### 4.1 LayerCommand (New Command)

Directional multi-layer editing:

- 6 cardinal directions (up/down/north/south/east/west)
- Camera-relative support
- Data by pairs: count + block type
- Requires builder permissions

### 4.2 PasteToolUtil (New Utility)

Smart paste tool management in inventory:

- Search hierarchy: Hotbar -> Storage -> Tools
- If found outside hotbar: auto-moves
- Fills empty slots first
- Active slot sync via packet

### 4.3 BuilderToolSetEntityCollision (New Packet)

Allows builders to modify an entity's collision type (solid, trigger, none).

---

## 5. Server Infrastructure

### 5.1 Auto-Update System (New)

**Package**: `com.hypixel.hytale.server.core.update`

**Auto-apply modes:**

| Mode | Description |
|------|-------------|
| `DISABLED` | Never auto-apply |
| `WHEN_EMPTY` | Apply when no players connected |
| `SCHEDULED` | Apply after configurable delay |

**Configuration** (new section in config.json v4):
```json
{
  "Update": {
    "Enabled": true,
    "CheckIntervalSeconds": 3600,
    "NotifyPlayersOnAvailable": true,
    "Patchline": null,
    "RunBackupBeforeUpdate": true,
    "BackupConfigBeforeUpdate": true,
    "AutoApplyMode": "DISABLED",
    "AutoApplyDelayMinutes": 30
  }
}
```

**Environment variable**: `HYTALE_DISABLE_UPDATES` to completely disable.

### 5.2 Backup System (New)

```json
{
  "Backup": {
    "Enabled": false,
    "FrequencyMinutes": 30,
    "Directory": "./backups",
    "MaxCount": 5,
    "ArchiveMaxCount": 5
  }
}
```

### 5.3 AnchorActionModule (New)

Interactive action system tied to UI anchor points:

```java
// Register a simple handler
AnchorActionModule.get().register("my_action", (playerRef, jsonData) -> {
    String value = jsonData.get("key").getAsString();
    // Handle action
});

// Thread-safe world handler
AnchorActionModule.get().register("block_action",
    (playerRef, entityRef, store, jsonData) -> {
    // Executed on the world thread
});
```

### 5.4 Server Configuration v4

**New fields**:
- `Update`: Auto-update configuration
- `Backup`: Auto-backup configuration
- `DefaultModsEnabled`: Default mods activation (migrated from v3)
- `SkipModValidationForVersion`: Skip mod validation

**Migration v3 -> v4**: Automatic, `DefaultModsEnabled` set to `true` by default.

### 5.5 Authentication

- New `ProfileServiceClient` (replaces `AuthUtil`)
- New `SessionServiceClient` with `GameProfile` (username + UUID)
- Tokens via environment variables: `HYTALE_SERVER_SESSION_TOKEN`, `HYTALE_SERVER_IDENTITY_TOKEN`
- Token validation at startup with fatal error if invalid

### 5.6 RocksDB Storage

New chunk storage provider:

- Dual column: Default + specialized chunks
- Dual compression: LZ4 (fast) + ZSTD (deep)
- Bloom filtering for efficient lookups
- Level-based compaction with ratio priority
- Blob files for large values
- Configurable parallel I/O
- Maintenance command: `/world rocksdb compact`

### 5.7 Improved Sentry Telemetry

| Aspect | Before | After |
|--------|--------|-------|
| Dev build detection | Manual | `ManifestUtil.isJar()` |
| Sessions | No | `startSession()`/`endSession()` |
| User context | Hardware UUID | User object with auth |
| OS context | No | Name + version |
| External plugins | List | Tag `has-plugins: bool` |
| Asset packs | No | List with versions + immutability |

### 5.8 Integrated Git Command

`GitCommand` replaces `UpdateCommand`: git command integrated directly into the server.

### 5.9 UIGalleryCommand

New `/uigallery` command with dedicated page to preview UI components.

---

## 6. Infrastructure and Frameworks

### 6.1 Performance: Hash Caching for Ref

```java
// BEFORE: Computed every call
public int hashCode() {
    return 31 * store.hashCode() + index;
}

// AFTER: Cached hash, recalculated on invalidation
private transient volatile int hashCode;

public Ref(Store<T> store, int index) {
    this.hashCode = this.hashCode0();  // Immediate cache
}

public int hashCode() {
    return this.hashCode;  // O(1)
}
```

### 6.2 Registry: Shutdown Method

```java
// NEW
public void shutdownAndCleanup(boolean shutdown) {
    this.enabled = false;
    for (int i = registrations.size() - 1; i >= 0; i--) {
        registrations.get(i).accept(shutdown);
    }
    registrations.clear();
}
```

### 6.3 Schema System (New)

**Package**: `codec/schema/metadata/`

Metadata annotations for documentation generation and editor integration:

- `HytaleType`, `VirtualPath`, `AllowEmptyObject`, `NoDefaultValue`
- UI sub-package: `UIButton`, `UIEditor`, `UIDisplayMode`, `UIPropertyTitle`, `UITypeIcon`, etc.
- Config package: `Schema`, `ObjectSchema`, `ArraySchema`, `StringSchema`, etc.

### 6.4 Module Initialization Order

```
ConsoleModule          (0)  - Console
PermissionsModule      (1)  - Permissions
UpdateModule           (2)  - NEW: Updates
FlyCameraModule        (3)  - Camera
AssetModule            (4)  - Assets
...
TimeModule            (19)  - Time
AnchorActionModule    (20)  - NEW: Anchor actions
InteractionModule     (21)  - Interactions
...
```

---

## 7. Removed Files

| File | Reason |
|------|--------|
| `biomemap/` (directory) | Replaced by `Registry` + `BiCarta` |
| `Indexer.java` | Replaced by generic `Registry` |
| `BiomeType.java`, `SimpleBiomeType.java` | Replaced by `Biome` interface |
| `SpherePositionProvider.java` | Replaced by new providers |
| `VerticalEliminatorPositionProvider.java` | Replaced by new providers |
| `AllStoneMaterialProvider.java` | Simplified |
| `GrassTopMaterialProvider.java` | Simplified |
| `CeilingPattern.java` | Replaced by density sampling |
| `Reference.java`, `BaseHeightReference.java` | Replaced by `ReferenceBundle` + Frameworks |
| `Equipment.java` | Refactored into `EquipmentUpdate` |
| `Nameplate.java` | Refactored into `NameplateUpdate` |
| `UpdateCommand.java` | Replaced by `GitCommand` |
| `AuthUtil.java` | Replaced by `ProfileServiceClient` |

---

## 8. Compatibility

### Non-Breaking Changes

- All existing packet IDs unchanged
- Automatic config migration v3 -> v4
- All new modules optional (null checks)
- Kill switch for auto-updates
- No deprecated APIs

### Breaking Changes (for plugin developers)

- `Packet` interface: new `getChannel()` method required
- `CachedPacket` restricted to `ToClientPacket`
- `Ref.validate(Store)` removed (use `validate()` without argument)

---

:::tip For Plugin Developers
If you maintain a plugin, the main action required is implementing the new `getChannel()` method on any custom `Packet` implementations. Return `NetworkChannel.Default` for standard packets.
:::

*Documentation generated by automated comparative analysis of decompiled sources.*
*Date: February 17, 2026*
