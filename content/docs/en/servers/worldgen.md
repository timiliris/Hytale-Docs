---
id: worldgen
title: "World Generation System"
sidebar_label: World Generation
sidebar_position: 11
description: Comprehensive documentation of the Hytale server world generation architecture - Biome system, density functions, props, position providers, framework system, and asset loading pipeline.
---

# World Generation System

:::info Source
This documentation covers the Hytale server world generation architecture, including the new `builtin.hytalegenerator` system and the legacy `server.worldgen` infrastructure. Based on decompiled source from the Hytale server JAR.
:::

## Architecture Overview

The Hytale world generation system is divided into two major layers:

| Layer | Package | Purpose |
|---|---|---|
| **New Generator** | `com.hypixel.hytale.builtin.hytalegenerator` | Asset-driven, composable worldgen with density functions, props, biomes, and frameworks |
| **Legacy Infrastructure** | `com.hypixel.hytale.server.worldgen` | Older zone/climate-based system with container-driven biome data and JSON loaders |

The new system (`hytalegenerator`) uses a fully **asset-based pipeline** where all worldgen configuration is deserialized from JSON via `BuilderCodec` / `AssetBuilderCodec` classes, then assembled into runtime objects via explicit `build()` methods. The old system used hand-wired JSON loaders with a rigid container hierarchy.

**Entry point flow:**

```
HytaleWorldGenProvider.getGenerator()
  -> WorldGenConfig(path, name, version)
  -> ChunkGeneratorJsonLoader.load()
  -> AssetManager loads BiomeAsset, WorldStructureAsset, DensityAsset, etc.
  -> BasicWorldStructureAsset.build() -> WorldStructure
  -> BiomeAsset.build() -> SimpleBiome
```

Source: `server/worldgen/HytaleWorldGenProvider.java`

```java
// HytaleWorldGenProvider.java, lines 57-83
public IWorldGen getGenerator() throws WorldGenLoadException {
    Path worldGenPath;
    if (this.path != null) {
        worldGenPath = Path.of(this.path);
        if (!PathUtil.isInTrustedRoot(worldGenPath)) {
            throw new WorldGenLoadException(
                "World gen path must be within a trusted directory: " + this.path);
        }
    } else {
        worldGenPath = Universe.getWorldGenPath();
    }

    if (!"Default".equals(this.name)
            || !Files.exists(worldGenPath.resolve("World.json"))) {
        Path resolved = PathUtil.resolvePathWithinDir(worldGenPath, this.name);
        if (resolved == null) {
            throw new WorldGenLoadException("Invalid world gen name: " + this.name);
        }
        worldGenPath = resolved;
    }

    try {
        WorldGenConfig config = new WorldGenConfig(worldGenPath, this.name, this.version);
        return new ChunkGeneratorJsonLoader(
            new SeedString<>("ChunkGenerator",
                new SeedStringResource(PrefabStoreRoot.DEFAULT, config)),
            config
        ).load();
    } catch (Error var3) {
        throw new WorldGenLoadException("Failed to load world gen!", var3);
    }
}
```

---

## Biome System

The new biome system replaces the old monolithic `Biome` abstract class with a **composable interface hierarchy**. A biome is now defined by combining four independent source interfaces.

### The Biome Interface

**File:** `builtin/hytalegenerator/biome/Biome.java`

```java
package com.hypixel.hytale.builtin.hytalegenerator.biome;

import com.hypixel.hytale.builtin.hytalegenerator.density.Density;
import javax.annotation.Nonnull;

public interface Biome extends MaterialSource, PropsSource, EnvironmentSource, TintSource {
    String getBiomeName();

    @Nonnull
    Density getTerrainDensity();
}
```

The `Biome` interface composes four source interfaces:

| Interface | Method | Returns | Purpose |
|---|---|---|---|
| `MaterialSource` | `getMaterialProvider()` | `MaterialProvider<Material>` | Determines block materials at each position |
| `PropsSource` | `getPropFields()` / `getAllPropDistributions()` | `List<PropField>` / `List<Assignments>` | Defines prop placement rules |
| `EnvironmentSource` | `getEnvironmentProvider()` | `EnvironmentProvider` | Controls environmental effects (lighting, fog, etc.) |
| `TintSource` | `getTintProvider()` | `TintProvider` | Controls color tinting of blocks/vegetation |

### Source Interfaces

Each source interface is minimal and single-purpose:

```java
public interface MaterialSource {
    MaterialProvider<Material> getMaterialProvider();
}

public interface PropsSource {
    List<PropField> getPropFields();
    List<Assignments> getAllPropDistributions();
}

public interface EnvironmentSource {
    EnvironmentProvider getEnvironmentProvider();
}

public interface TintSource {
    TintProvider getTintProvider();
}
```

### SimpleBiome -- The Default Implementation

**File:** `builtin/hytalegenerator/biome/SimpleBiome.java`

`SimpleBiome` is the concrete implementation of `Biome` used for all standard biomes. It holds direct references to all providers and supports dynamic addition of `PropField` instances.

```java
public class SimpleBiome implements Biome {
    @Nonnull private final Density terrainDensity;
    @Nonnull private final MaterialProvider<Material> materialProvider;
    @Nonnull private final List<PropField> propFields;
    @Nonnull private final EnvironmentProvider environmentProvider;
    @Nonnull private final TintProvider tintProvider;
    @Nonnull private final String biomeName;

    public SimpleBiome(
        @Nonnull String biomeName,
        @Nonnull Density terrainDensity,
        @Nonnull MaterialProvider<Material> materialProvider,
        @Nonnull EnvironmentProvider environmentProvider,
        @Nonnull TintProvider tintProvider
    ) {
        this.terrainDensity = terrainDensity;
        this.materialProvider = materialProvider;
        this.biomeName = biomeName;
        this.propFields = new ArrayList<>();
        this.environmentProvider = environmentProvider;
        this.tintProvider = tintProvider;
    }

    public void addPropFieldTo(@Nonnull PropField propField) {
        this.propFields.add(propField);
    }

    @Nonnull
    @Override
    public List<Assignments> getAllPropDistributions() {
        ArrayList<Assignments> list = new ArrayList<>();
        for (PropField f : this.propFields) {
            list.add(f.getPropDistribution());
        }
        return list;
    }
    // ... getters omitted for brevity
}
```

### BiomeAsset -- How Biomes Are Built from JSON

**File:** `builtin/hytalegenerator/assets/biomes/BiomeAsset.java`

The `BiomeAsset` class defines the JSON schema and build process for biomes. Key JSON fields:

| JSON Key | Asset Type | Default | Required |
|---|---|---|---|
| `"Name"` | `String` | `"DefaultName"` | Yes |
| `"Terrain"` | `TerrainAsset` | `DensityTerrainAsset` | Yes |
| `"MaterialProvider"` | `MaterialProviderAsset` | `ConstantMaterialProviderAsset` | Yes |
| `"Props"` | `PropRuntimeAsset[]` | `[]` | Yes |
| `"EnvironmentProvider"` | `EnvironmentProviderAsset` | `ConstantEnvironmentProviderAsset` | Yes |
| `"TintProvider"` | `TintProviderAsset` | `ConstantTintProviderAsset` | Yes |
| `"FloatingFunctionNodes"` | `DensityAsset[]` | `[]` | Yes |

```java
// BiomeAsset.java - build method
public Biome build(
    @Nonnull MaterialCache materialCache,
    @Nonnull SeedBox parentSeed,
    @Nonnull ReferenceBundle referenceBundle,
    @Nonnull WorkerIndexer.Id workerId
) {
    MaterialProvider<Material> materialProvider = this.materialProviderAsset
        .build(new MaterialProviderAsset.Argument(
            parentSeed, materialCache, referenceBundle, workerId));

    Density density = this.terrainAsset
        .buildDensity(parentSeed, referenceBundle, workerId);

    EnvironmentProvider provider = EnvironmentProvider.noEnvironmentProvider();
    if (this.environmentProviderAsset != null) {
        provider = this.environmentProviderAsset.build(
            new EnvironmentProviderAsset.Argument(
                parentSeed, materialCache, referenceBundle, workerId));
    }

    TintProvider tints = TintProvider.noTintProvider();
    if (this.tintProviderAsset != null) {
        tints = this.tintProviderAsset.build(
            new TintProviderAsset.Argument(
                parentSeed, materialCache, referenceBundle, workerId));
    }

    SimpleBiome biome = new SimpleBiome(
        this.biomeName, density, materialProvider, provider, tints);

    for (PropRuntimeAsset fieldAsset : this.propRuntimeAssets) {
        if (!fieldAsset.isSkip()) {
            PositionProvider positionProvider = fieldAsset
                .buildPositionProvider(parentSeed, referenceBundle, workerId);
            Assignments distribution = fieldAsset
                .buildPropDistribution(parentSeed, materialCache,
                    fieldAsset.getRuntime(), referenceBundle, workerId);
            PropField field = new PropField(
                fieldAsset.getRuntime(), distribution, positionProvider);
            biome.addPropFieldTo(field);
        }
    }
    return biome;
}
```

### PropField -- Connecting Positions to Props

**File:** `builtin/hytalegenerator/PropField.java`

A `PropField` ties together a `PositionProvider` (where to place props), an `Assignments` object (what to place), and a runtime phase integer (when to place it during generation).

```java
public class PropField {
    @Nonnull private final Assignments assignments;
    @Nonnull private final PositionProvider positionProvider;
    private final int runtime;

    public PropField(int runtime,
                     @Nonnull Assignments assignments,
                     @Nonnull PositionProvider positionProvider) {
        this.runtime = runtime;
        this.assignments = assignments;
        this.positionProvider = positionProvider;
    }

    @Nonnull
    public PositionProvider getPositionProvider() {
        return this.positionProvider;
    }

    @Nonnull
    public Assignments getPropDistribution() {
        return this.assignments;
    }

    public int getRuntime() {
        return this.runtime;
    }
}
```

---

## Registry System

**File:** `builtin/hytalegenerator/Registry.java`

The `Registry<T>` class provides a generic **bidirectional mapping** between objects and auto-incremented integer IDs. It is used throughout the generator to assign stable numeric IDs to biomes and other registered objects.

```java
public class Registry<T> {
    private Map<T, Integer> objectToId = new HashMap<>();
    private Map<Integer, T> idToObject = new HashMap<>();

    public int getIdOrRegister(T object) {
        Integer id = this.objectToId.get(object);
        if (id != null) {
            return id;
        } else {
            id = this.objectToId.size();
            this.idToObject.put(id, object);
            this.objectToId.put(object, id);
            return id;
        }
    }

    public T getObject(int id) {
        return this.idToObject.get(id);
    }

    public int size() {
        return this.objectToId.size();
    }

    @Nonnull
    public List<T> getAllValues() {
        return new ArrayList<>(this.idToObject.values());
    }

    public void forEach(@Nonnull BiConsumer<Integer, T> consumer) {
        this.idToObject.forEach(consumer::accept);
    }
}
```

**Key design points:**

- **Auto-incrementing IDs**: The ID is derived from the current map size (`objectToId.size()`), giving each object a sequential integer starting from 0.
- **Idempotent registration**: Calling `getIdOrRegister()` on an already-registered object returns the existing ID without creating a duplicate.
- **Bidirectional lookup**: `objectToId` for O(1) object-to-ID, `idToObject` for O(1) ID-to-object.
- **Generic**: Used as `Registry<Biome>` in `WorldStructure`, but applicable to any type.

**Usage in WorldStructure build** (from `BasicWorldStructureAsset.build()`):

```java
Registry<Biome> biomeRegistry = new Registry<>();
int defaultBiomeId = biomeRegistry.getIdOrRegister(defaultBiome);
SimpleNoiseCarta<Integer> carta = new SimpleNoiseCarta<>(density, defaultBiomeId);
// For each biomeRange:
carta.put(range, biomeRegistry.getIdOrRegister(biome));
```

---

## WorldStructure

**File:** `builtin/hytalegenerator/worldstructure/WorldStructure.java`

The `WorldStructure` class is the top-level result of building a world definition. It ties together the biome map, biome registry, transition parameters, and spawn positions.

```java
public class WorldStructure {
    @Nonnull private final BiCarta<Integer> biomeMap;
    @Nonnull private final Registry<Biome> biomeRegistry;
    private final int biomeTransitionDistance;
    private final int maxBiomeEdgeDistance;
    @Nonnull private final PositionProvider spawnPositions;

    public WorldStructure(
        @Nonnull BiCarta<Integer> biomeMap,
        @Nonnull Registry<Biome> biomeRegistry,
        int biomeTransitionDistance,
        int maxBiomeEdgeDistance,
        @Nonnull PositionProvider spawnPositions
    ) {
        this.biomeMap = biomeMap;
        this.biomeRegistry = biomeRegistry;
        this.biomeTransitionDistance = biomeTransitionDistance;
        this.maxBiomeEdgeDistance = maxBiomeEdgeDistance;
        this.spawnPositions = spawnPositions;
    }

    @Nonnull public BiCarta<Integer> getBiomeMap() { return this.biomeMap; }
    @Nonnull public Registry<Biome> getBiomeRegistry() { return this.biomeRegistry; }
    public int getBiomeTransitionDistance() { return this.biomeTransitionDistance; }
    public int getMaxBiomeEdgeDistance() { return this.maxBiomeEdgeDistance; }
    @Nonnull public PositionProvider getSpawnPositions() { return this.spawnPositions; }
}
```

### BiCarta -- Abstract 2D Mapping Function

**File:** `builtin/hytalegenerator/framework/interfaces/functions/BiCarta.java`

`BiCarta<R>` is an abstract function that maps 2D integer coordinates (x, z) to a value of type `R`. It is the foundation of the biome distribution system.

```java
public abstract class BiCarta<R> {
    public abstract R apply(int x, int z, @Nonnull WorkerIndexer.Id id);
    public abstract List<R> allPossibleValues();
}
```

### SimpleNoiseCarta -- Noise-Based Biome Mapping

**File:** `builtin/hytalegenerator/cartas/SimpleNoiseCarta.java`

The concrete implementation used for biome distribution. It evaluates a `Density` function at (x, z) and uses a `DoubleRangeMap` to map the resulting noise value to a biome ID.

```java
public class SimpleNoiseCarta<T> extends BiCarta<T> {
    @Nonnull private final Density density;
    @Nonnull private final DoubleRangeMap<T> rangeMap;
    private final T defaultValue;

    public SimpleNoiseCarta(@Nonnull Density density, T defaultValue) {
        this.density = density;
        this.defaultValue = defaultValue;
        this.rangeMap = new DoubleRangeMap<>();
    }

    @Nonnull
    public SimpleNoiseCarta<T> put(@Nonnull DoubleRange range, T value) {
        this.rangeMap.put(range, value);
        return this;
    }

    @Override
    public T apply(int x, int z, @Nonnull WorkerIndexer.Id id) {
        Density.Context context = new Density.Context();
        context.position = new Vector3d((double)x, 0.0, (double)z);
        double noiseValue = this.density.process(context);
        T value = this.rangeMap.get(noiseValue);
        return value == null ? this.defaultValue : value;
    }

    @Nonnull
    @Override
    public List<T> allPossibleValues() {
        List<T> list = this.rangeMap.values();
        list.add(this.defaultValue);
        return list;
    }
}
```

### Biome Transitions

The `biomeTransitionDistance` field controls how wide the blending zone is between adjacent biomes. It is clamped to a minimum of 1:

```java
int transitionDistance = Math.max(1, this.biomeTransitionDistance);
```

The `maxBiomeEdgeDistance` controls the maximum distance from a biome edge that is tracked, which is validated to be `>= 0`. The default `biomeTransitionDistance` is 32 and `maxBiomeEdgeDistance` defaults to 0.

### BasicWorldStructureAsset -- JSON Schema

| JSON Key | Type | Required | Default | Validation |
|---|---|---|---|---|
| `"Biomes"` | `BiomeRangeAsset[]` | Yes | `[]` | -- |
| `"Density"` | `DensityAsset` | Yes | `ConstantDensityAsset` | -- |
| `"DefaultBiome"` | `String` (BiomeAsset ref) | Yes | `""` | Must exist in BiomeAsset store |
| `"DefaultTransitionDistance"` | `int` | Yes | `32` | `> 0` |
| `"MaxBiomeEdgeDistance"` | `int` | Yes | `0` | `>= 0` |
| `"Framework"` | `FrameworkAsset[]` | No | `[]` | -- |
| `"SpawnPositions"` | `PositionProviderAsset` | No | `ListPositionProviderAsset` | -- |

Each `BiomeRangeAsset` defines:

| JSON Key | Type | Default |
|---|---|---|
| `"Biome"` | `String` (BiomeAsset ref) | `""` |
| `"Min"` | `double` | `-1.0` |
| `"Max"` | `double` | `1.0` |

---

## Position Providers

Position providers define **where** things happen in the world -- spawn points, prop placement locations, and more. The system is based on an abstract `PositionProvider` with a visitor-pattern `Context`.

### PositionProvider Base

**File:** `builtin/hytalegenerator/positionproviders/PositionProvider.java`

```java
public abstract class PositionProvider {
    public abstract void positionsIn(@Nonnull PositionProvider.Context context);

    @Nonnull
    public static PositionProvider noPositionProvider() {
        return new PositionProvider() {
            @Override
            public void positionsIn(@Nonnull PositionProvider.Context context) {
                // Intentionally empty -- produces no positions
            }
        };
    }

    public static class Context {
        @Nonnull
        public static final Consumer<Vector3d> EMPTY_CONSUMER = p -> {};
        public Vector3d minInclusive;
        public Vector3d maxExclusive;
        public Consumer<Vector3d> consumer;
        @Nullable
        public Vector3d anchor;

        public Context() {
            this.minInclusive = Vector3d.ZERO;
            this.maxExclusive = Vector3d.ZERO;
            this.consumer = EMPTY_CONSUMER;
            this.anchor = null;
        }
    }
}
```

**Key design:** The `Context` carries a bounding box (`minInclusive` / `maxExclusive`), a `Consumer<Vector3d>` callback that receives each generated position, and an optional `anchor` position. Position providers call `context.consumer.accept(pos)` for each position they generate.

### BoundPositionProvider

**File:** `builtin/hytalegenerator/positionproviders/BoundPositionProvider.java`

Wraps another `PositionProvider` and overrides the context bounds. This is a **decorator** that constrains positions to a specific 3D region.

```java
public class BoundPositionProvider extends PositionProvider {
    @Nonnull private final PositionProvider positionProvider;
    private final Bounds3d bounds;

    @Override
    public void positionsIn(@Nonnull PositionProvider.Context context) {
        PositionProvider.Context childContext = new PositionProvider.Context(context);
        childContext.minInclusive = this.bounds.min;
        childContext.maxExclusive = this.bounds.max;
        this.positionProvider.positionsIn(childContext);
    }
}
```

**JSON Asset** (`BoundPositionProviderAsset`):

| JSON Key | Type | Required |
|---|---|---|
| `"Bounds"` | `DecimalBounds3dAsset` | Yes |
| `"Positions"` | `PositionProviderAsset` | Yes |

### SimpleHorizontalPositionProvider

**File:** `builtin/hytalegenerator/positionproviders/SimpleHorizontalPositionProvider.java`

Filters positions from a child provider to only include those within a Y-range. This is a **filtering decorator**.

```java
public class SimpleHorizontalPositionProvider extends PositionProvider {
    @Nonnull private final RangeDouble rangeY;
    @Nonnull private final PositionProvider positionProvider;

    @Override
    public void positionsIn(@Nonnull PositionProvider.Context context) {
        PositionProvider.Context childContext = new PositionProvider.Context(context);
        childContext.consumer = positions -> {
            if (this.rangeY.contains(positions.y)) {
                context.consumer.accept(positions);
            }
        };
        this.positionProvider.positionsIn(childContext);
    }
}
```

### FrameworkPositionProviderAsset

**File:** `builtin/hytalegenerator/assets/positionproviders/FrameworkPositionProviderAsset.java`

Resolves a position provider by **name** from the `PositionsFrameworkAsset` registry. This enables reuse of position definitions across multiple biomes.

```java
@Override
public PositionProvider build(@Nonnull PositionProviderAsset.Argument argument) {
    if (super.skip()) {
        return PositionProvider.noPositionProvider();
    } else {
        PositionProviderAsset baseAsset =
            PositionsFrameworkAsset.Entries.get(this.name, argument.referenceBundle);
        if (baseAsset == null) {
            LoggerUtil.getLogger().log(Level.WARNING,
                "Couldn't find WorldFramework Positions with name " + this.name);
            return PositionProvider.noPositionProvider();
        } else {
            return baseAsset.build(argument);
        }
    }
}
```

**JSON:**

```json
{
  "Type": "Framework",
  "Name": "MySharedPositions"
}
```

### Full Position Provider Type Catalog

| Type | Class | Purpose |
|---|---|---|
| Anchor | `AnchorPositionProviderAsset` | Positions relative to an anchor point |
| BaseHeight | `BaseHeightPositionProviderAsset` | Positions at terrain base height |
| Bound | `BoundPositionProviderAsset` | Constrains positions to a 3D bounds |
| Cached | `CachedPositionProviderAsset` | Caches positions for reuse |
| FieldFunction | `FieldFunctionPositionProviderAsset` | Positions from a field function |
| FieldFunctionOccurrence | `FieldFunctionOccurrencePositionProviderAsset` | Conditional field positions |
| Framework | `FrameworkPositionProviderAsset` | Named reference to framework entries |
| Imported | `ImportedPositionProviderAsset` | Imported from another asset |
| List | `ListPositionProviderAsset` | Fixed list of positions |
| Mesh2D | `Mesh2DPositionProviderAsset` | 2D mesh-based positions |
| Mesh3D | `Mesh3DPositionProviderAsset` | 3D mesh-based positions |
| Offset | `OffsetPositionProviderAsset` | Applies an offset to child positions |
| SimpleHorizontal | `SimpleHorizontalPositionProviderAsset` | Y-range filtered positions |
| Union | `UnionPositionProviderAsset` | Combines multiple providers |

---

## Props System

Props are objects placed on top of the generated terrain -- trees, rocks, flowers, structures. The system uses a composable hierarchy based on the abstract `Prop` class.

### Prop Base Class

**File:** `builtin/hytalegenerator/props/Prop.java`

```java
public abstract class Prop {
    public abstract ScanResult scan(@Nonnull Vector3i position,
                                     @Nonnull VoxelSpace<Material> materialSpace,
                                     @Nonnull WorkerIndexer.Id id);

    public abstract void place(@Nonnull Prop.Context context);

    public abstract ContextDependency getContextDependency();

    @Nonnull
    public abstract Bounds3i getReadBounds_voxelGrid();

    @Nonnull
    public abstract Bounds3i getWriteBounds_voxelGrid();

    public static class Context {
        public ScanResult scanResult;
        public VoxelSpace<Material> materialSpace;
        public EntityContainer entityBuffer;
        public WorkerIndexer.Id workerId;
        public double distanceFromBiomeEdge;
    }
}
```

**Two-phase placement:** Props use a **scan-then-place** pattern. `scan()` examines the terrain at a position and returns a `ScanResult` indicating whether placement is valid. `place()` then writes the prop into the voxel space using that scan result. This decoupling allows batch validation before committing any writes.

### OffsetProp

**File:** `builtin/hytalegenerator/props/OffsetProp.java`

A **decorator** that offsets a child prop's position by a fixed `Vector3i`.

```java
public class OffsetProp extends Prop {
    @Nonnull private final Vector3i offset_voxelGrid;
    @Nonnull private final Prop childProp;

    public OffsetProp(@Nonnull Vector3i offset_voxelGrid, @Nonnull Prop childProp) {
        this.offset_voxelGrid = offset_voxelGrid.clone();
        this.childProp = childProp;
        this.readBounds_voxelGrid =
            childProp.getReadBounds_voxelGrid().clone().offset(offset_voxelGrid);
        this.writeBounds_voxelGrid =
            childProp.getWriteBounds_voxelGrid().clone().offset(offset_voxelGrid);
    }

    @Override
    public ScanResult scan(@Nonnull Vector3i position_voxelGrid,
                            @Nonnull VoxelSpace<Material> materialSpace,
                            @Nonnull WorkerIndexer.Id id) {
        Vector3i childPosition = position_voxelGrid.clone().add(this.offset_voxelGrid);
        return this.childProp.scan(childPosition, materialSpace, id);
    }

    @Override
    public void place(@Nonnull Prop.Context context) {
        this.childProp.place(context);
    }
}
```

**JSON** (`OffsetPropAsset`):

| JSON Key | Type | Required |
|---|---|---|
| `"Offset"` | `Vector3i` (x, y, z) | Yes |
| `"Prop"` | `PropAsset` | Yes |

### WeightedProp

**File:** `builtin/hytalegenerator/props/WeightedProp.java`

Selects from multiple child props using weighted random selection. The seed is derived from the position, ensuring deterministic results.

```java
public class WeightedProp extends Prop {
    @Nonnull private final WeightedMap<Prop> props;
    @Nonnull private final SeedGenerator seedGenerator;

    @Override
    public ScanResult scan(@Nonnull Vector3i position,
                            @Nonnull VoxelSpace<Material> materialSpace,
                            @Nonnull WorkerIndexer.Id id) {
        if (this.props.size() == 0) {
            return new PickedScanResult();
        }
        Random rand = new Random(
            this.seedGenerator.seedAt(position.x, position.y, position.z));
        Prop pickedProp = this.props.pick(rand);
        ScanResult scanResult = pickedProp.scan(position, materialSpace, id);

        PickedScanResult result = new PickedScanResult();
        result.prop = pickedProp;
        result.scanResult = scanResult;
        return result;
    }

    @Override
    public void place(@Nonnull Prop.Context context) {
        if (!context.scanResult.isNegative()) {
            PickedScanResult picked = PickedScanResult.cast(context.scanResult);
            Prop.Context childContext = new Prop.Context(context);
            childContext.scanResult = picked.scanResult;
            picked.prop.place(childContext);
        }
    }
}
```

**JSON** (`WeightedPropAsset`):

```json
{
  "Type": "Weighted",
  "Seed": "TreeVariants",
  "Entries": [
    { "Weight": 3.0, "Prop": { "Type": "Prefab", "..." : "..." } },
    { "Weight": 1.0, "Prop": { "Type": "Prefab", "..." : "..." } }
  ]
}
```

### Composability Pattern

The prop system follows the **decorator/composite pattern**. Any `PropAsset` can wrap or compose other `PropAsset` instances:

```
WeightedProp
  +-- OffsetProp
  |     +-- PrefabProp("oak_tree")
  +-- OffsetProp
  |     +-- PrefabProp("birch_tree")
  +-- ClusterProp
        +-- BoxProp("bush")
```

Full prop type catalog:

| Type | Class | Purpose |
|---|---|---|
| Box | `BoxProp` | Places blocks in a box shape |
| Cluster | `ClusterProp` | Groups multiple placements together |
| Column | `ColumnProp` | Vertical column placement |
| Density | `DensityProp` | Density-driven placement |
| Offset | `OffsetProp` | Offsets child prop position |
| PondFiller | `PondFillerProp` (via `PondFillerPropAsset`) | Fills ponds |
| Prefab | `PrefabProp` (in `props/prefab/`) | Pastes a prefab structure |
| Queue | `QueueProp` | Sequential prop execution |
| Union | `UnionProp` | Combines multiple props |
| Weighted | `WeightedProp` | Weighted random selection |
| No-op | `Prop.noProp()` | Does nothing (null object) |

---

## Density System

The density system is the mathematical backbone of terrain generation. A `Density` is an abstract function that processes a 3D context and returns a `double` value. These are composed into complex density graphs.

### Density Base Class

**File:** `builtin/hytalegenerator/density/Density.java`

```java
public abstract class Density {
    public static final double DEFAULT_VALUE = 1.7976931348623157E308;  // Double.MAX_VALUE
    public static final double DEFAULT_DENSITY = 0.0;

    public abstract double process(@Nonnull Density.Context context);

    public void setInputs(Density[] inputs) { }

    public static class Context {
        @Nonnull public Vector3d position;
        @Nullable public Vector3d densityAnchor;
        @Nullable public Vector3d positionsAnchor;
        public int switchState;
        public double distanceFromCellWall;
        @Nullable public TerrainDensityProvider terrainDensityProvider;
        public double distanceToBiomeEdge;
    }
}
```

The `Density.Context` carries rich spatial information:
- **position** -- the 3D world coordinate being evaluated
- **densityAnchor** / **positionsAnchor** -- reference points for relative calculations
- **switchState** -- allows branching in `SwitchStateDensityAsset`
- **distanceFromCellWall** -- for Voronoi/cell-based operations
- **terrainDensityProvider** -- backreference to terrain density for self-referencing nodes
- **distanceToBiomeEdge** -- for biome-edge-aware blending

### YSampledDensity -- Vertical Interpolation

**File:** `builtin/hytalegenerator/density/nodes/YSampledDensity.java`

This is a critical performance optimization. Instead of evaluating a potentially expensive density function at every Y coordinate, `YSampledDensity` samples at discrete intervals along the Y axis and **linearly interpolates** between samples.

```java
public class YSampledDensity extends Density {
    @Nonnull private Density input;
    private final double sampleDistance;
    private final double sampleDistanceInverse;
    private final double sampleOffset;

    public YSampledDensity(@Nonnull Density input,
                            double sampleDistance,
                            double sampleOffset) {
        assert sampleDistance > 0.0;
        this.input = input;
        this.sampleDistance = sampleDistance;
        this.sampleDistanceInverse = 1.0 / sampleDistance;
        this.sampleOffset = sampleOffset;
    }

    @Override
    public double process(@Nonnull Density.Context context) {
        // Case 1: New X/Z column or first call -- sample both endpoints
        // Case 2: Y moved outside current interval -- resample
        // Optimization: if stepping by exactly one interval, reuse the previous endpoint

        // Linear interpolation between the two samples
        double ratio = (context.position.y - this.y0) * this.sampleDistanceInverse;
        return Interpolation.linear(this.value0, this.value1, ratio);
    }
}
```

The interpolation helper:

```java
public static double linear(double value0, double value1, double weight) {
    if (weight <= 0.0) {
        return value0;
    } else {
        return weight >= 1.0 ? value1 : value0 * (1.0 - weight) + value1 * weight;
    }
}
```

**JSON** (`YSampledDensityAsset`):

| JSON Key | Type | Default | Validation |
|---|---|---|---|
| `"SampleDistance"` | `double` | `4.0` | `> 0.0` |
| `"SampleOffset"` | `double` | `0.0` | -- |

**Performance characteristics:**
- Default `SampleDistance` of 4.0 means only 1 density evaluation per 4 Y-levels instead of every Y-level, giving a **~4x speedup** for vertical columns.
- The caching of the last X/Z and sample interval means that when iterating Y in order within a column, samples are maximally reused.

### Full Density Node Catalog

There are 70+ density node types available:

| Category | Nodes |
|---|---|
| **Constants** | `ConstantDensity`, `AmplitudeConstant`, `OffsetConstant` |
| **Noise** | `SimplexNoise2d`, `SimplexNoise3D`, `CellNoise2D`, `CellNoise3D`, `GradientWarp`, `FastGradientWarp` |
| **Math** | `Abs`, `Ceiling`, `Floor`, `Pow`, `Sqrt`, `Clamp`, `SmoothClamp`, `Normalizer` |
| **Combinators** | `Sum`, `Multiplier`, `Min`, `Max`, `SmoothMin`, `SmoothMax`, `Mix`, `MultiMix` |
| **Transforms** | `Scale`, `Offset`, `Amplitude`, `Rotator`, `Inverter`, `VectorWarp` |
| **Shapes** | `Cube`, `Cuboid`, `Cylinder`, `Ellipsoid`, `Plane`, `Shell` |
| **Sampling** | `YSampled`, `Cache`, `Cache2d (Deprecated)`, `Exported`, `Imported` |
| **Selection** | `Selector`, `Switch`, `SwitchState`, `Slider` |
| **Terrain** | `Terrain`, `BaseHeight`, `DistanceToBiomeEdge`, `CellWallDistance` |
| **Positions** | Various position-based density nodes in `density/positions/` |
| **Axis** | `XValue`, `YValue`, `ZValue`, `XOverride`, `YOverride`, `ZOverride`, `Axis` |
| **Pipeline** | `Pipeline`, `Gradient`, `Anchor`, `Angle`, `Distance` |

---

## Framework System

The framework system provides a mechanism for defining **reusable, named assets** that can be referenced by name across multiple biomes and world structures. Each framework asset type stores its entries in a `ReferenceBundle`.

### PositionsFrameworkAsset

**File:** `builtin/hytalegenerator/assets/framework/PositionsFrameworkAsset.java`

Defines named position providers that can be referenced by `FrameworkPositionProviderAsset`.

```java
public class PositionsFrameworkAsset extends FrameworkAsset {
    @Nonnull public static final String NAME = "Positions";

    private PositionsFrameworkAsset.EntryAsset[] entryAssets = new EntryAsset[0];

    @Override
    public void build(@Nonnull WorldStructureAsset.Argument argument,
                       @Nonnull ReferenceBundle referenceBundle) {
        Entries entries = new Entries();
        for (EntryAsset entryAsset : this.entryAssets) {
            entries.put(entryAsset.name, entryAsset.positionProviderAsset);
        }
        referenceBundle.put("Positions", entries, CLASS);
    }

    public static class Entries extends HashMap<String, PositionProviderAsset> {
        @Nullable
        public static PositionProviderAsset get(
                @Nonnull String name,
                @Nonnull ReferenceBundle referenceBundle) {
            Entries entries = get(referenceBundle);
            return entries == null ? null : entries.get(name);
        }
    }
}
```

**JSON example:**

```json
{
  "Type": "Positions",
  "Entries": [
    {
      "Name": "TreePositions",
      "Positions": {
        "Type": "Mesh2D",
        "..."  : "..."
      }
    },
    {
      "Name": "BoulderPositions",
      "Positions": {
        "Type": "Bound",
        "Bounds": { "PointA": [0, 50, 0], "PointB": [16, 200, 16] },
        "Positions": { "Type": "Mesh3D", "..." : "..." }
      }
    }
  ]
}
```

### DecimalConstantsFrameworkAsset

**File:** `builtin/hytalegenerator/assets/framework/DecimalConstantsFrameworkAsset.java`

Defines named `double` constants that can be referenced by density nodes and other assets.

```java
public class DecimalConstantsFrameworkAsset extends FrameworkAsset {
    @Nonnull public static final String NAME = "DecimalConstants";

    @Override
    public void build(@Nonnull WorldStructureAsset.Argument argument,
                       @Nonnull ReferenceBundle referenceBundle) {
        Entries entries = new Entries();
        for (EntryAsset entryAsset : this.entryAssets) {
            entries.put(entryAsset.name, Double.valueOf(entryAsset.value));
        }
        referenceBundle.put("DecimalConstants", entries, CLASS);
    }

    public static class Entries extends HashMap<String, Double> {
        @Nullable
        public static Double get(@Nonnull String name,
                                  @Nonnull ReferenceBundle referenceBundle) {
            Entries entries = get(referenceBundle);
            return entries == null ? null : entries.get(name);
        }
    }
}
```

**JSON example:**

```json
{
  "Type": "DecimalConstants",
  "Entries": [
    { "Name": "SeaLevel", "Value": 64.0 },
    { "Name": "MountainHeight", "Value": 200.0 }
  ]
}
```

### Framework Usage Flow

1. `BasicWorldStructureAsset.build()` iterates over its `frameworkAssets[]` array
2. Each `FrameworkAsset.build(argument, referenceBundle)` populates the shared `ReferenceBundle`
3. The `ReferenceBundle` is then passed down to all `BiomeAsset.build()` calls
4. Individual assets (e.g., `FrameworkPositionProviderAsset`) look up entries by name

```
WorldStructure JSON
  -> Framework[] array
     -> PositionsFrameworkAsset.build() -> ReferenceBundle["Positions"]
     -> DecimalConstantsFrameworkAsset.build() -> ReferenceBundle["DecimalConstants"]
  -> Biome[] array
     -> Each biome's position providers can use FrameworkPositionProviderAsset("TreePositions")
     -> Resolved from ReferenceBundle at build time
```

---

## Bounds System

Bounds define axis-aligned bounding boxes in 3D space. There are two variants: floating-point and integer.

### DecimalBounds3dAsset

```java
public class DecimalBounds3dAsset {
    private Vector3d pointA = new Vector3d();
    private Vector3d pointB = new Vector3d();

    @Nonnull
    public Bounds3d build() {
        Bounds3d bounds = new Bounds3d(this.pointA, this.pointB);
        bounds.correct();  // Ensures min <= max on all axes
        return bounds;
    }
}
```

**JSON:**

```json
{
  "PointA": { "X": -100.0, "Y": 0.0, "Z": -100.0 },
  "PointB": { "X": 100.0, "Y": 256.0, "Z": 100.0 }
}
```

### Bounds3d Runtime Class

**File:** `builtin/hytalegenerator/bounds/Bounds3d.java`

A rich AABB implementation with extensive spatial operations.

| Method | Description |
|---|---|
| `contains(Vector3d)` | Tests if position is inside bounds (half-open: `[min, max)`) |
| `intersects(Bounds3d)` | Tests if two bounds overlap |
| `encompass(Bounds3d)` | Grows this bounds to include another |
| `intersect(Bounds3d)` | Shrinks this bounds to the overlapping region |
| `stack(Bounds3d)` | Combines bounds as if one is stacked on the other |
| `offset(Vector3d)` | Translates the bounds |
| `flipOnOriginPoint()` | Mirrors around the origin point |
| `flipOnOriginVoxel()` | Mirrors around (1,1,1) for voxel-centric reflection |
| `correct()` | Ensures `min <= max` on all axes (swaps if needed) |

---

## Asset Loading

### WorldGenConfig

**File:** `server/worldgen/WorldGenConfig.java`

```java
public record WorldGenConfig(
    @Nonnull Path path,
    @Nonnull String name,
    @Nonnull Semver version
) {
    public WorldGenConfig withOverride(@Nonnull Path path) {
        return FileIO.equals(this.path, path)
            ? this
            : new WorldGenConfig(path, this.name, this.version);
    }
}
```

| Field | Type | Purpose |
|---|---|---|
| `path` | `Path` | Filesystem path to the worldgen data directory |
| `name` | `String` | Generator name (default: `"Default"`) |
| `version` | `Semver` | Semantic version for versioned asset loading |

### AssetFileSystem

**File:** `server/worldgen/loader/AssetFileSystem.java`

The `AssetFileSystem` implements `FileIOSystem` and provides **versioned, multi-pack asset resolution**. It is constructed from a `WorldGenConfig` and resolves assets across multiple asset packs with version filtering.

**Key features:**
- **Resource caching**: `load()` caches loaded resources by path, with type-safety enforcement
- **Path normalization**: Custom `Hash.Strategy<Path>` uses `FileIO.hashCode`/`equals` for consistent cross-platform path handling
- **Pack ordering**: Non-versioned packs take priority over versioned packs; the base pack is always last

**Versioned pack loading:**

```java
public static List<AssetPack> getAssetPacks(
        @Nonnull WorldGenConfig config,
        @Nonnull Predicate<Path> filter) {
    // First pass: non-versioned packs
    for (int i = allPacks.size() - 1; i >= 1; i--) {
        AssetPack pack = allPacks.get(i);
        if (!FileIO.startsWith(pack.getRoot(), versionsDir)
                && filter.test(pack.getRoot())) {
            packs.add(pack);
        }
    }

    // Second pass: versioned packs (only if version <= config version)
    for (int i = allPacks.size() - 1; i >= 1; i--) {
        AssetPack pack = allPacks.get(i);
        if (FileIO.startsWith(pack.getRoot(), versionsDir)
                && pack.getManifest().getVersion()
                    .compareTo(config.version()) <= 0
                && filter.test(pack.getRoot())) {
            packs.add(pack);
        }
    }

    // Base pack always included last (lowest priority)
    packs.add(allPacks.getFirst());
    return List.copyOf(packs);
}
```

### AssetManager

**File:** `builtin/hytalegenerator/assets/AssetManager.java`

The `AssetManager` is the central hub for all worldgen assets. It registers event listeners for each asset type and maintains maps of loaded assets.

**Managed asset types:**

| Asset | Purpose |
|---|---|
| `DensityAsset` | Density function definitions |
| `AssignmentsAsset` | Prop assignment/distribution rules |
| `BiomeAsset` | Full biome definitions |
| `WorldStructureAsset` | World structure definitions |
| `BlockMaskAsset` | Block placement mask rules |
| `SettingsAsset` | Generator settings |

---

## ReusableList

**File:** `builtin/hytalegenerator/ReusableList.java`

A memory optimization utility that avoids allocations during worldgen. Instead of creating new lists for every operation, `ReusableList<T>` maintains a backing `ArrayList` and uses a **soft size** counter. Calling `clear()` does not deallocate -- it merely resets the soft size to 0, allowing the same backing array to be refilled.

```java
public class ReusableList<T> {
    @Nonnull
    private final List<T> data = new ArrayList<>(0);
    private int softSize = 0;

    public void expandAndSet(T element) {
        if (this.isAtHardCapacity()) {
            this.data.add(element);      // Backing list grows
        } else {
            this.data.set(this.softSize, element);  // Reuse existing slot
        }
        this.softSize++;
    }

    @Nullable
    public T expandAndGet() {
        if (this.isAtHardCapacity()) {
            this.data.add(null);
            return null;
        } else {
            T result = this.data.get(this.softSize);
            this.softSize++;
            return result;
        }
    }

    public void clear() {
        this.softSize = 0;
    }
}
```

**Why this matters for modders:** During chunk generation, the server processes thousands of positions per chunk. `ReusableList` allows the same list to be reused across iterations without triggering garbage collection.

**Memory behavior:**

| Operation | Backing list | Soft size |
|---|---|---|
| `expandAndSet("A")` | `["A"]` | 1 |
| `expandAndSet("B")` | `["A", "B"]` | 2 |
| `clear()` | `["A", "B"]` (unchanged) | 0 |
| `expandAndSet("C")` | `["C", "B"]` (slot 0 overwritten) | 1 |
| `expandAndGet()` | `["C", "B"]` | 2 (returns `"B"`) |

---

## What Was Removed

The codebase shows evidence of a significant architectural transition. The **legacy system** (`server.worldgen`) and the **new system** (`builtin.hytalegenerator`) coexist, but key parts of the old system have been superseded or deprecated.

### Old vs New Architecture

| Aspect | Old System | New System |
|---|---|---|
| Biome definition | 13-param abstract class | 4-interface composition |
| Biome subtypes | `TileBiome`, `CustomBiome` | Single `SimpleBiome` |
| Biome distribution | `BiomePatternGenerator` (Voronoi + weighted map) | `SimpleNoiseCarta` (density + range map) |
| Block layers | `LayerContainer` (static/dynamic layers) | `MaterialProvider<Material>` |
| Surface cover | `CoverContainer` | `Prop` system |
| Prop placement | `PrefabContainer` | `PropField` + `PositionProvider` + `Prop` |
| JSON loading | Hand-wired `*JsonLoader` classes | `BuilderCodec` / `AssetBuilderCodec` |
| Biome registry | Implicit (int id in constructor) | Explicit `Registry<Biome>` |
| Reusable config | None | `FrameworkAsset` system (`Positions`, `DecimalConstants`) |
| Asset management | Scattered loaders | Centralized `AssetManager` + `AssetStore` |
| World structure | Zone/Climate pipeline | `WorldStructure` with `BiCarta` + `Registry` |

---

## Appendix: Key File Paths

| Component | File Path |
|---|---|
| New Biome interface | `builtin/hytalegenerator/biome/Biome.java` |
| SimpleBiome | `builtin/hytalegenerator/biome/SimpleBiome.java` |
| BiomeAsset | `builtin/hytalegenerator/assets/biomes/BiomeAsset.java` |
| Registry | `builtin/hytalegenerator/Registry.java` |
| WorldStructure | `builtin/hytalegenerator/worldstructure/WorldStructure.java` |
| BiCarta | `builtin/hytalegenerator/framework/interfaces/functions/BiCarta.java` |
| SimpleNoiseCarta | `builtin/hytalegenerator/cartas/SimpleNoiseCarta.java` |
| PositionProvider | `builtin/hytalegenerator/positionproviders/PositionProvider.java` |
| Prop | `builtin/hytalegenerator/props/Prop.java` |
| Density | `builtin/hytalegenerator/density/Density.java` |
| YSampledDensity | `builtin/hytalegenerator/density/nodes/YSampledDensity.java` |
| PositionsFrameworkAsset | `builtin/hytalegenerator/assets/framework/PositionsFrameworkAsset.java` |
| Bounds3d | `builtin/hytalegenerator/bounds/Bounds3d.java` |
| AssetFileSystem | `server/worldgen/loader/AssetFileSystem.java` |
| WorldGenConfig | `server/worldgen/WorldGenConfig.java` |
| AssetManager | `builtin/hytalegenerator/assets/AssetManager.java` |
| ReusableList | `builtin/hytalegenerator/ReusableList.java` |
| PropField | `builtin/hytalegenerator/PropField.java` |

All paths are relative to `com/hypixel/hytale/`.

*Documentation generated by automated analysis of decompiled sources.*
