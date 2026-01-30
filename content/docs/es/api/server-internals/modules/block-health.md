---
id: block-health
title: Sistema de Salud de Bloques
sidebar_label: Salud de Bloques
sidebar_position: 7
description: Documentación completa del sistema de salud de bloques de Hytale para daño de bloques, regeneración, fragilidad y progresión de rotura
---

# Block Health System

The Block Health system in Hytale manages the damage state of blocks in the world. It tracks how much damage each block has taken, handles automatic regeneration over time, and manages the "fragile block" mechanic for recently placed blocks.

## System Overview

The Block Health system consists of four main classes:

| Clase               | Descripción                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `BlockHealthModule` | El módulo/plugin central que gestiona todo el sistema                       |
| `BlockHealth`       | Representa el estado de salud de un solo bloque                             |
| `BlockHealthChunk`  | Almacena datos de salud de bloque para todos los bloques dentro de un chunk |
| `FragileBlock`      | Rastrea bloques que están en un estado frágil temporal                      |

**Source:** `com.hypixel.hytale.server.core.modules.blockhealth`

## Block Health Properties

Each damaged block is tracked with a `BlockHealth` instance:

```java
public class BlockHealth implements Cloneable {
    public static final BlockHealth NO_DAMAGE_INSTANCE = new BlockHealth(1.0F, Instant.MIN);

    private float health;                    // Current health (0.0 to 1.0)
    private Instant lastDamageGameTime;      // When the block was last damaged

    public float getHealth();
    public void setHealth(float health);
    public Instant getLastDamageGameTime();
    public void setLastDamageGameTime(Instant lastDamageGameTime);
    public boolean isDestroyed();            // Returns true if health <= 0
    public boolean isFullHealth();           // Returns true if health >= 1.0
}
```

**Key Constants:**

- `NO_DAMAGE_INSTANCE` - An immutable instance representing a block at full health (1.0)

## Block Damage Stages

Block health is represented as a float value from 0.0 to 1.0:

| Health Range  | Description     | Visual State          |
| ------------- | --------------- | --------------------- |
| `1.0`         | Full health     | No damage cracks      |
| `0.75 - 0.99` | Light damage    | Minor cracks visible  |
| `0.50 - 0.74` | Moderate damage | Medium cracks visible |
| `0.25 - 0.49` | Heavy damage    | Major cracks visible  |
| `0.01 - 0.24` | Critical damage | Severe cracks visible |
| `<= 0.0`      | Destroyed       | Block breaks          |

The `isDestroyed()` method checks if health is at or below zero:

```java
public boolean isDestroyed() {
    return MathUtil.closeToZero(this.health) || this.health < 0.0F;
}
```

## BlockHealthChunk Component

The `BlockHealthChunk` is an ECS component attached to each chunk that stores health data for all damaged blocks:

```java
public class BlockHealthChunk implements Component<ChunkStore> {
    private final Map<Vector3i, BlockHealth> blockHealthMap;      // Damaged blocks
    private final Map<Vector3i, FragileBlock> blockFragilityMap;  // Fragile blocks
    private Instant lastRepairGameTime;                            // Last tick processed
}
```

### Key Methods

| Method                     | Signature                                                                                   | Description                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `damageBlock`              | `BlockHealth damageBlock(Instant currentUptime, World world, Vector3i block, float health)` | Apply damage to a block                                                               |
| `repairBlock`              | `BlockHealth repairBlock(World world, Vector3i block, float progress)`                      | Repair a block's health                                                               |
| `removeBlock`              | `void removeBlock(World world, Vector3i block)`                                             | Remove a block from the health tracking system                                        |
| `getBlockHealth`           | `float getBlockHealth(Vector3i block)`                                                      | Get the current health of a block (returns 1.0 if not damaged)                        |
| `makeBlockFragile`         | `void makeBlockFragile(Vector3i blockLocation, float fragileDuration)`                      | Mark a block as fragile for a duration                                                |
| `isBlockFragile`           | `boolean isBlockFragile(Vector3i block)`                                                    | Check if a block is currently fragile                                                 |
| `getBlockHealthMap`        | `@Nonnull Map<Vector3i, BlockHealth> getBlockHealthMap()`                                   | Get direct access to the internal map of damaged blocks                               |
| `getBlockFragilityMap`     | `@Nonnull Map<Vector3i, FragileBlock> getBlockFragilityMap()`                               | Get direct access to the internal map of fragile blocks                               |
| `createBlockDamagePackets` | `void createBlockDamagePackets(@Nonnull List<Packet> list)`                                 | Generate UpdateBlockDamage packets for all damaged blocks (used during chunk loading) |
| `clone`                    | `@Nonnull BlockHealthChunk clone()`                                                         | Create a deep copy of this component                                                  |

### Damaging Blocks

```java
@Nonnull
public BlockHealth damageBlock(Instant currentUptime, @Nonnull World world, @Nonnull Vector3i block, float health) {
    BlockHealth blockHealth = this.blockHealthMap.compute(block, (key, value) -> {
        if (value == null) {
            value = new BlockHealth();
        }
        value.setHealth(value.getHealth() - health);
        value.setLastDamageGameTime(currentUptime);
        return (BlockHealth)((double)value.getHealth() < 1.0 ? value : null);
    });

    if (blockHealth != null && !blockHealth.isDestroyed()) {
        Predicate<PlayerRef> filter = player -> true;
        world.getNotificationHandler().updateBlockDamage(
            block.getX(), block.getY(), block.getZ(),
            blockHealth.getHealth(), -health, filter
        );
    }
    return Objects.requireNonNullElse(blockHealth, BlockHealth.NO_DAMAGE_INSTANCE);
}
```

### Repairing Blocks

```java
@Nonnull
public BlockHealth repairBlock(@Nonnull World world, @Nonnull Vector3i block, float progress) {
    BlockHealth blockHealth = Objects.requireNonNullElse(
        this.blockHealthMap.computeIfPresent(block, (key, value) -> {
            value.setHealth(value.getHealth() + progress);
            return (BlockHealth)((double)value.getHealth() > 1.0 ? value : null);
        }),
        BlockHealth.NO_DAMAGE_INSTANCE
    );

    world.getNotificationHandler().updateBlockDamage(
        block.getX(), block.getY(), block.getZ(),
        blockHealth.getHealth(), progress
    );
    return blockHealth;
}
```

## Automatic Regeneration

The `BlockHealthModule` implements automatic health regeneration for damaged blocks:

```java
private static final long SECONDS_UNTIL_REGENERATION = 5L;  // 5 seconds after last damage
private static final float HEALING_PER_SECOND = 0.1F;       // 10% per second
```

**Regeneration Rules:**

1. A block must not have been damaged for 5 seconds before regeneration starts
2. Once regeneration starts, blocks heal at 10% health per second
3. When a block reaches full health (1.0), it is removed from the tracking map
4. Regeneration updates are sent to all players who have the chunk loaded

### Regeneration Logic

```java
// From BlockHealthSystem.tick()
Instant startRegenerating = blockHealth.getLastDamageGameTime().plusSeconds(5L);
if (!currentGameTime.isBefore(startRegenerating)) {
    float healthDelta = 0.1F * deltaSeconds;
    float health = blockHealth.getHealth() + healthDelta;

    if (health < 1.0F) {
        blockHealth.setHealth(health);
    } else {
        iterator.remove();  // Block fully healed
        health = BlockHealth.NO_DAMAGE_INSTANCE.getHealth();
        healthDelta = health - blockHealth.getHealth();
    }

    // Send update packet to players
    UpdateBlockDamage packet = new UpdateBlockDamage(
        new BlockPosition(position.getX(), position.getY(), position.getZ()),
        health, healthDelta
    );
    for (int i = 0; i < visibleTo.size(); i++) {
        visibleTo.get(i).getPacketHandler().writeNoCache(packet);
    }
}
```

## Fragile Blocks

When a player places a block, it enters a "fragile" state for a configurable duration. Fragile blocks can be broken instantly, regardless of their normal mining time.

### Configuration

The fragility timer is configured in `WorldConfig`:

```java
// From WorldConfig.java
protected float blockPlacementFragilityTimer;

public float getBlockPlacementFragilityTimer() {
    return this.blockPlacementFragilityTimer;
}
```

**JSON Configuration:**

```json
{
  "BlockPlacementFragilityTimer": 2.0
}
```

This sets the fragility duration in seconds after block placement.

### FragileBlock Class

```java
public class FragileBlock implements Cloneable {
    private float durationSeconds;

    public FragileBlock(float durationSeconds);
    public float getDurationSeconds();
    public void setDurationSeconds(float durationSeconds);
}
```

### Fragility Mechanics

1. **On Block Placement:** The `PlaceBlockEventSystem` marks the block as fragile
2. **Duration Countdown:** Each tick, the fragile duration is decremented
3. **Fragile Check:** During block damage, if the block is fragile OR destroyed, it breaks

```java
// From PlaceBlockEventSystem.handle()
WorldConfig worldGameplayConfig = world.getGameplayConfig().getWorldConfig();
float blockPlacementFragilityTimer = worldGameplayConfig.getBlockPlacementFragilityTimer();
blockHealthComponent.makeBlockFragile(blockLocation, blockPlacementFragilityTimer);
```

```java
// From BlockHarvestUtils.performBlockDamage()
if (blockHealthComponent.isBlockFragile(targetBlockPos) || blockDamage.isDestroyed()) {
    // Block breaks immediately
    performBlockBreak(...);
    brokeBlock = true;
}
```

## Network Protocol

Block damage updates are sent to clients via the `UpdateBlockDamage` packet:

```java
public class UpdateBlockDamage implements Packet {
    public static final int PACKET_ID = 144;

    public BlockPosition blockPosition;  // Position of the damaged block
    public float damage;                 // Current health value (0.0 to 1.0)
    public float delta;                  // Change in health this update
}
```

The `WorldNotificationHandler` dispatches these packets:

```java
public void updateBlockDamage(int x, int y, int z, float health, float healthDelta) {
    this.sendPacketIfChunkLoaded(this.getBlockDamagePacket(x, y, z, health, healthDelta), x, z);
}

public void updateBlockDamage(int x, int y, int z, float health, float healthDelta,
                               @Nullable Predicate<PlayerRef> filter) {
    this.sendPacketIfChunkLoaded(this.getBlockDamagePacket(x, y, z, health, healthDelta), x, z, filter);
}
```

## Related Events

The block health system interacts with these events:

| Event              | Description                                                |
| ------------------ | ---------------------------------------------------------- |
| `DamageBlockEvent` | Fired when a block takes damage (can modify/cancel damage) |
| `BreakBlockEvent`  | Fired when a block is fully destroyed                      |
| `PlaceBlockEvent`  | Fired when a block is placed (triggers fragility)          |

### DamageBlockEvent Integration

```java
// From BlockHarvestUtils.performBlockDamage()
float current = blockHealthComponent.getBlockHealth(originBlock);
DamageBlockEvent event = new DamageBlockEvent(itemStack, originBlock, targetBlockType, current, damage);

if (ref != null) {
    entityStore.invoke(ref, event);
} else {
    entityStore.invoke(event);
}

if (event.isCancelled()) {
    targetSection.invalidateBlock(targetBlockPos.x, targetBlockPos.y, targetBlockPos.z);
    return false;
}

damage = event.getDamage();  // Allow plugins to modify damage
```

## Plugin Example

Here's a complete example of interacting with the block health system:

```java
public class BlockHealthPlugin extends JavaPlugin {

    public BlockHealthPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Listen for block damage events
        getEventRegistry().register(DamageBlockEvent.class, this::onBlockDamage);
        getEventRegistry().register(PlaceBlockEvent.class, this::onBlockPlace);
    }

    private void onBlockDamage(DamageBlockEvent event) {
        Vector3i blockPos = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        float currentDamage = event.getCurrentDamage();
        float incomingDamage = event.getDamage();

        // Example: Make obsidian take half damage
        if (blockType.getId().equals("obsidian")) {
            event.setDamage(incomingDamage * 0.5f);
        }

        // Example: Prevent bedrock from being damaged
        if (blockType.getId().equals("bedrock")) {
            event.setCancelled(true);
        }

        // Log damage progress
        float remainingHealth = (1.0f - currentDamage) - event.getDamage();
        getLogger().info("Block at " + blockPos + " health: " + remainingHealth);
    }

    private void onBlockPlace(PlaceBlockEvent event) {
        Vector3i blockPos = event.getTargetBlock();
        getLogger().info("Block placed at " + blockPos + " - now fragile");
    }

    // Access block health data directly
    public float getBlockHealth(World world, Vector3i blockPos) {
        ChunkStore chunkStore = world.getChunkStore();
        long chunkIndex = ChunkUtil.indexChunkFromBlock(blockPos.x, blockPos.z);
        Ref<ChunkStore> chunkRef = chunkStore.getChunkReference(chunkIndex);

        if (chunkRef != null && chunkRef.isValid()) {
            ComponentType<ChunkStore, BlockHealthChunk> componentType =
                BlockHealthModule.get().getBlockHealthChunkComponentType();
            BlockHealthChunk blockHealthChunk =
                chunkStore.getStore().getComponent(chunkRef, componentType);

            if (blockHealthChunk != null) {
                return blockHealthChunk.getBlockHealth(blockPos);
            }
        }
        return 1.0f;  // Full health if not found
    }

    // Check if a block is fragile
    public boolean isBlockFragile(World world, Vector3i blockPos) {
        ChunkStore chunkStore = world.getChunkStore();
        long chunkIndex = ChunkUtil.indexChunkFromBlock(blockPos.x, blockPos.z);
        Ref<ChunkStore> chunkRef = chunkStore.getChunkReference(chunkIndex);

        if (chunkRef != null && chunkRef.isValid()) {
            ComponentType<ChunkStore, BlockHealthChunk> componentType =
                BlockHealthModule.get().getBlockHealthChunkComponentType();
            BlockHealthChunk blockHealthChunk =
                chunkStore.getStore().getComponent(chunkRef, componentType);

            if (blockHealthChunk != null) {
                return blockHealthChunk.isBlockFragile(blockPos);
            }
        }
        return false;
    }
}
```

## Module Architecture

The `BlockHealthModule` registers several internal systems:

```java
@Override
protected void setup() {
    ComponentRegistryProxy<ChunkStore> chunkStoreRegistry = this.getChunkStoreRegistry();

    // Register the BlockHealthChunk component type
    this.blockHealthChunkComponentType = chunkStoreRegistry.registerComponent(
        BlockHealthChunk.class, "BlockHealthChunk", BlockHealthChunk.CODEC
    );

    // Register event handler for block placement
    this.getEntityStoreRegistry().registerSystem(new PlaceBlockEventSystem());

    // Ensure every chunk has a BlockHealthChunk component
    chunkStoreRegistry.registerSystem(new EnsureBlockHealthSystem(this.blockHealthChunkComponentType));

    // Handle regeneration ticking
    chunkStoreRegistry.registerSystem(new BlockHealthSystem(this.blockHealthChunkComponentType));

    // Handle network packet generation for chunk loading
    chunkStoreRegistry.registerSystem(new BlockHealthPacketSystem(this.blockHealthChunkComponentType));
}
```

### System Dependencies

The module depends on:

- `LegacyModule` - Core legacy systems
- `TimeModule` - For game time tracking

```java
@Nonnull
public static final PluginManifest MANIFEST = PluginManifest.corePlugin(BlockHealthModule.class)
    .depends(LegacyModule.class)
    .depends(TimeModule.class)
    .build();
```

## Serialization

Block health data is persisted with chunks using a binary format:

```java
// Serialization version for compatibility
private static final byte SERIALIZATION_VERSION = 2;

public byte[] serialize() {
    ByteBuf buf = Unpooled.buffer();
    buf.writeByte(2);  // Version

    // Serialize health map
    buf.writeInt(this.blockHealthMap.size());
    for (Entry<Vector3i, BlockHealth> entry : this.blockHealthMap.entrySet()) {
        Vector3i vec = entry.getKey();
        buf.writeInt(vec.x);
        buf.writeInt(vec.y);
        buf.writeInt(vec.z);
        entry.getValue().serialize(buf);
    }

    // Serialize fragility map (version 2+)
    buf.writeInt(this.blockFragilityMap.size());
    for (Entry<Vector3i, FragileBlock> entry : this.blockFragilityMap.entrySet()) {
        Vector3i vec = entry.getKey();
        buf.writeInt(vec.x);
        buf.writeInt(vec.y);
        buf.writeInt(vec.z);
        entry.getValue().serialize(buf);
    }

    return ByteBufUtil.getBytesRelease(buf);
}
```

## Archivos Fuente

| Clase                      | Ruta                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| `BlockHealthModule`        | `com.hypixel.hytale.server.core.modules.blockhealth.BlockHealthModule`   |
| `BlockHealth`              | `com.hypixel.hytale.server.core.modules.blockhealth.BlockHealth`         |
| `BlockHealthChunk`         | `com.hypixel.hytale.server.core.modules.blockhealth.BlockHealthChunk`    |
| `FragileBlock`             | `com.hypixel.hytale.server.core.modules.blockhealth.FragileBlock`        |
| `UpdateBlockDamage`        | `com.hypixel.hytale.protocol.packets.world.UpdateBlockDamage`            |
| `WorldNotificationHandler` | `com.hypixel.hytale.server.core.universe.world.WorldNotificationHandler` |
| `BlockHarvestUtils`        | `com.hypixel.hytale.server.core.modules.interaction.BlockHarvestUtils`   |
| `DamageBlockEvent`         | `com.hypixel.hytale.server.core.event.events.ecs.DamageBlockEvent`       |
| `BreakBlockEvent`          | `com.hypixel.hytale.server.core.event.events.ecs.BreakBlockEvent`        |
| `PlaceBlockEvent`          | `com.hypixel.hytale.server.core.event.events.ecs.PlaceBlockEvent`        |
