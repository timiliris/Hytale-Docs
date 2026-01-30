---
id: collision-system
title: Sistema de Colisiones
sidebar_label: Sistema de Colisiones
sidebar_position: 7
description: Documentación completa del sistema de detección de colisiones de Hytale para bloques, entidades, raycasting e integración de física
---

# Collision System

The Collision System in Hytale provides comprehensive collision detection and response capabilities for entities, blocks, and raycasting. This system is fundamental to character movement, projectile detection, physics interactions, and trigger zones.

## Overview

The CollisionModule is a core plugin that manages all collision-related functionality in Hytale. It supports:

- **Block Collision** - Detecting collisions with world geometry
- **Entity Collision** - Detecting collisions between entities
- **Raycasting** - Testing ray intersections with AABBs
- **Trigger Zones** - Detecting when entities enter/exit block regions
- **Material-based Filtering** - Filtering collisions by material type

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionModule`

## Collision Material Types

Hytale uses a bitmask system for collision material filtering:

| Material             | Valor | Descripción                       |
| -------------------- | ----- | --------------------------------- |
| `MATERIAL_EMPTY`     | 1     | Bloques vacíos/aire               |
| `MATERIAL_FLUID`     | 2     | Bloques de fluido (agua, lava)    |
| `MATERIAL_SOLID`     | 4     | Bloques sólidos                   |
| `MATERIAL_SUBMERGED` | 8     | Sumergido en fluido               |
| `MATERIAL_DAMAGE`    | 16    | Bloques que causan daño           |
| `MATERIAL_SET_ANY`   | 15    | Todos los materiales excepto daño |
| `MATERIAL_SET_NONE`  | 0     | Sin materiales                    |

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionMaterial`

```java
public class CollisionMaterial {
    public static final int MATERIAL_EMPTY = 1;
    public static final int MATERIAL_FLUID = 2;
    public static final int MATERIAL_SOLID = 4;
    public static final int MATERIAL_SUBMERGED = 8;
    public static final int MATERIAL_SET_ANY = 15;
    public static final int MATERIAL_DAMAGE = 16;
    public static final int MATERIAL_SET_NONE = 0;
}
```

## Collision Types

Hytale supports two collision response types:

| Type   | Value | Description                 |
| ------ | ----- | --------------------------- |
| `Hard` | 0     | Standard blocking collision |
| `Soft` | 1     | Allows partial penetration  |

**Source:** `com.hypixel.hytale.protocol.CollisionType`

```java
public enum CollisionType {
    Hard(0),
    Soft(1);
}
```

## CollisionResult

The `CollisionResult` class stores collision detection results and manages collision state:

```java
// Create a collision result for standard use
CollisionResult result = new CollisionResult();

// Create with specific options
CollisionResult result = new CollisionResult(
    true,   // enableSlides - allow sliding on ground
    false   // enableCharacters - check entity collisions
);
```

### Collision Result Methods

| Method                         | Description                       |
| ------------------------------ | --------------------------------- |
| `getBlockCollisionCount()`     | Get number of block collisions    |
| `getBlockCollision(int i)`     | Get specific block collision data |
| `getFirstBlockCollision()`     | Get nearest block collision       |
| `getCharacterCollisionCount()` | Get number of entity collisions   |
| `getFirstCharacterCollision()` | Get nearest entity collision      |
| `getTriggerBlocks()`           | Get blocks that triggered events  |

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionResult`

### Configuring Collision Behavior

```java
// Set default player collision settings
result.setDefaultPlayerSettings();

// Configure material-based collision
result.setCollisionByMaterial(CollisionMaterial.MATERIAL_SOLID);

// Configure walkable materials (for sliding on ground)
result.setWalkableByMaterial(CollisionMaterial.MATERIAL_SET_ANY);

// Enable/disable collision checks
result.enableSlides();       // Allow ground sliding
result.disableSlides();
result.enableTriggerBlocks(); // Check trigger zones
result.disableTriggerBlocks();
result.enableDamageBlocks();  // Check damage blocks
result.disableDamageBlocks();
```

## Finding Collisions

### Block Collisions

The main entry point for finding collisions with blocks:

```java
public static boolean findCollisions(
    @Nonnull Box collider,           // The collision box
    @Nonnull Vector3d pos,           // Starting position
    @Nonnull Vector3d v,             // Movement vector
    @Nonnull CollisionResult result, // Output results
    @Nonnull ComponentAccessor<EntityStore> componentAccessor
)
```

The system automatically chooses between iterative (long distance) and short distance algorithms based on movement magnitude:

```java
// Short distance threshold
public static boolean isBelowMovementThreshold(@Nonnull Vector3d v) {
    return v.squaredLength() < 1.0000000000000002E-10;
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionModule`

### Character/Entity Collisions

```java
public static void findCharacterCollisions(
    @Nonnull Vector3d pos,
    @Nonnull Vector3d v,
    @Nonnull CollisionResult result,
    @Nonnull ComponentAccessor<EntityStore> componentAccessor
)
```

### Position Validation

Validate if a position is valid (not overlapping with geometry):

```java
// Validation return codes
public static final int VALIDATE_INVALID = -1;   // Position overlaps geometry
public static final int VALIDATE_OK = 0;         // Position is valid
public static final int VALIDATE_ON_GROUND = 1;  // Position is on ground
public static final int VALIDATE_TOUCH_CEIL = 2; // Position touches ceiling

// Validate a position
int result = collisionModule.validatePosition(world, collider, pos, collisionResult);
```

## CollisionConfig

The `CollisionConfig` class manages collision state and provides block-level collision checking:

```java
public class CollisionConfig {
    // Block information
    public int blockId;
    public BlockType blockType;
    public BlockMaterial blockMaterial;
    public int rotation;
    public int blockX, blockY, blockZ;

    // Fluid information
    public Fluid fluid;
    public int fluidId;
    public byte fluidLevel;

    // Collision state
    public boolean blockCanCollide;
    public boolean blockCanTrigger;
}
```

### Setting Collision Behavior

```java
// Set default behavior (solid blocks only)
collisionConfig.setDefaultCollisionBehaviour();

// Set collision material mask
collisionConfig.setCollisionByMaterial(CollisionMaterial.MATERIAL_SOLID);

// Enable damage block collisions
collisionConfig.setCollideWithDamageBlocks(true);

// Custom collision predicate
collisionConfig.canCollide = config -> {
    return (config.blockMaterialMask & CollisionMaterial.MATERIAL_SOLID) != 0;
};
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionConfig`

## CollisionMath - Raycasting API

The `CollisionMath` class provides mathematical utilities for collision detection:

### Intersection Codes

```java
public class CollisionMath {
    public static final int DISJOINT = 0;     // No intersection
    public static final int TOUCH_X = 1;      // Touching on X axis
    public static final int TOUCH_Y = 2;      // Touching on Y axis
    public static final int TOUCH_Z = 4;      // Touching on Z axis
    public static final int TOUCH_ANY = 7;    // Touching on any axis
    public static final int OVERLAP_X = 8;    // Overlapping on X axis
    public static final int OVERLAP_Y = 16;   // Overlapping on Y axis
    public static final int OVERLAP_Z = 32;   // Overlapping on Z axis
    public static final int OVERLAP_ALL = 56; // Fully overlapping
}
```

### Ray-AABB Intersection

```java
// Test if a ray intersects an AABB
public static boolean intersectRayAABB(
    @Nonnull Vector3d pos,   // Ray origin
    @Nonnull Vector3d ray,   // Ray direction
    double x, double y, double z, // Box position
    @Nonnull Box box,        // Box dimensions
    @Nonnull Vector2d minMax // Output: min/max intersection distances
)

// Test if a vector (limited length ray) intersects an AABB
public static boolean intersectVectorAABB(
    @Nonnull Vector3d pos,
    @Nonnull Vector3d vec,
    double x, double y, double z,
    @Nonnull Box box,
    @Nonnull Vector2d minMax
)
```

### Swept AABB Collision

Test collision between a moving AABB and a static AABB:

```java
public static boolean intersectSweptAABBs(
    @Nonnull Vector3d posP,  // Moving box position
    @Nonnull Vector3d vP,    // Movement vector
    @Nonnull Box p,          // Moving box
    @Nonnull Vector3d posQ,  // Static box position
    @Nonnull Box q,          // Static box
    @Nonnull Vector2d minMax,// Output: min/max intersection times
    @Nonnull Box temp        // Temporary box for calculation
)
```

### Helper Methods

```java
// Check intersection state
boolean noCollision = CollisionMath.isDisjoint(code);
boolean fullOverlap = CollisionMath.isOverlapping(code);
boolean touching = CollisionMath.isTouching(code);
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionMath`

## Collision Data Classes

### BlockCollisionData

Contains information about a collision with a block:

```java
public class BlockCollisionData extends BoxCollisionData {
    public int x, y, z;              // Block position
    public int blockId;              // Block ID
    public int rotation;             // Block rotation
    public BlockType blockType;      // Block type asset
    public BlockMaterial blockMaterial;
    public int detailBoxIndex;       // Sub-hitbox index
    public boolean willDamage;       // Block deals damage
    public int fluidId;              // Fluid ID if present
    public Fluid fluid;              // Fluid asset
    public boolean touching;         // Just touching
    public boolean overlapping;      // Fully overlapping
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.BlockCollisionData`

### CharacterCollisionData

Contains information about a collision with an entity:

```java
public class CharacterCollisionData extends BasicCollisionData {
    public Ref<EntityStore> entityReference;  // Entity reference
    public boolean isPlayer;                   // Is a player entity

    public void assign(
        @Nonnull Vector3d collisionPoint,
        double collisionVectorScale,
        Ref<EntityStore> entityReference,
        boolean isPlayer
    );
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.CharacterCollisionData`

### BoxCollisionData

Base class for collision data with spatial information:

```java
public class BoxCollisionData extends BasicCollisionData {
    public double collisionEnd;               // End of collision range
    public final Vector3d collisionNormal;    // Surface normal at collision

    public void setEnd(double collisionEnd, @Nonnull Vector3d collisionNormal);
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.BoxCollisionData`

## Entity Collision Provider

The `EntityCollisionProvider` handles entity-to-entity collision detection:

```java
public class EntityCollisionProvider {
    // Find nearest entity collision
    public double computeNearest(
        @Nonnull Box entityBoundingBox,
        @Nonnull Vector3d pos,
        @Nonnull Vector3d dir,
        @Nullable Ref<EntityStore> ignoreSelf,
        @Nullable Ref<EntityStore> ignore,
        @Nonnull ComponentAccessor<EntityStore> componentAccessor
    );

    // Get collision results
    public int getCount();
    public EntityContactData getContact(int index);
}
```

### Default Entity Filter

The default filter excludes projectiles and dead entities:

```java
public static boolean defaultEntityFilter(
    @Nonnull Ref<EntityStore> ref,
    @Nonnull ComponentAccessor<EntityStore> componentAccessor
) {
    Archetype<EntityStore> archetype = componentAccessor.getArchetype(ref);
    boolean isProjectile = archetype.contains(Projectile.getComponentType())
        || archetype.contains(ProjectileComponent.getComponentType());
    if (isProjectile) return false;

    boolean isDead = archetype.contains(DeathComponent.getComponentType());
    return !isDead && ref.isValid();
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.EntityCollisionProvider`

## Block Collision Provider

The `BlockCollisionProvider` handles world geometry collision detection:

```java
public class BlockCollisionProvider implements BoxBlockIterator.BoxIterationConsumer {
    // Cast a collision ray through the world
    public void cast(
        @Nonnull World world,
        @Nonnull Box collider,
        @Nonnull Vector3d pos,
        @Nonnull Vector3d v,
        @Nonnull IBlockCollisionConsumer collisionConsumer,
        @Nonnull IBlockTracker activeTriggers,
        double collisionStop
    );

    // Set which materials to collide with
    public void setRequestedCollisionMaterials(int requestedCollisionMaterials);

    // Enable overlap reporting
    public void setReportOverlaps(boolean reportOverlaps);
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.BlockCollisionProvider`

## Collision Consumer Interface

Implement `IBlockCollisionConsumer` to receive collision callbacks:

```java
public interface IBlockCollisionConsumer {
    // Called when a collision is detected
    Result onCollision(int x, int y, int z, Vector3d motion,
        BlockContactData contactData, BlockData blockData, Box hitbox);

    // Called to probe damage collision
    Result probeCollisionDamage(int x, int y, int z, Vector3d motion,
        BlockContactData contactData, BlockData blockData);

    // Called when damage collision confirmed
    void onCollisionDamage(int x, int y, int z, Vector3d motion,
        BlockContactData contactData, BlockData blockData);

    // Called after each iteration slice
    Result onCollisionSliceFinished();

    // Called when collision detection complete
    void onCollisionFinished();

    public enum Result {
        CONTINUE,   // Continue checking
        STOP,       // Stop after current slice
        STOP_NOW    // Stop immediately
    }
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.IBlockCollisionConsumer`

## HitboxCollision Component

Entities can have configurable hitbox collision behavior:

```java
public class HitboxCollision implements Component<EntityStore> {
    public int getHitboxCollisionConfigIndex();
    public void setHitboxCollisionConfigIndex(int hitboxCollisionConfigIndex);
}
```

### HitboxCollisionConfig

```java
public class HitboxCollisionConfig {
    protected String id;
    protected CollisionType collisionType;  // Hard or Soft
    protected float softOffsetRatio = 1.0F; // Soft collision penetration ratio
}
```

**Source:** `com.hypixel.hytale.server.core.modules.entity.hitboxcollision.HitboxCollisionConfig`

## Configuration

The CollisionModule can be configured via `CollisionModuleConfig`:

```java
public class CollisionModuleConfig {
    // Movement threshold for short-distance optimization
    public static final double MOVEMENT_THRESHOLD = 1.0E-5;
    public static final double MOVEMENT_THRESHOLD_SQUARED = 1.0000000000000002E-10;
    public static final double EXTENT = 1.0E-5;

    // Configuration options
    private double extentMax = 0.0;            // Maximum block extent
    private boolean dumpInvalidBlocks = false; // Debug: log invalid positions
    private Double minimumThickness = null;    // Minimum hitbox thickness
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionModuleConfig`

## Collision Filter

Custom collision filtering with the `CollisionFilter` interface:

```java
@FunctionalInterface
public interface CollisionFilter<D, T> {
    boolean test(T context, int collisionCode, D evaluator, CollisionConfig config);
}
```

**Source:** `com.hypixel.hytale.server.core.modules.collision.CollisionFilter`

## Plugin Example

Here's a complete example of using the collision system in a plugin:

```java
public class CollisionPlugin extends JavaPlugin {

    public CollisionPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Register for entity movement events
        getEventRegistry().register(EntityMoveEvent.class, this::onEntityMove);
    }

    private void onEntityMove(EntityMoveEvent event) {
        World world = event.getWorld();
        Entity entity = event.getEntity();
        Vector3d position = entity.getPosition();
        Vector3d movement = event.getMovement();
        Box boundingBox = entity.getBoundingBox();

        // Create collision result
        CollisionResult result = new CollisionResult(true, false);
        result.setCollisionByMaterial(CollisionMaterial.MATERIAL_SOLID);

        // Find collisions
        boolean farDistance = CollisionModule.findCollisions(
            boundingBox,
            position,
            movement,
            result,
            world.getEntityStore().getComponentAccessor()
        );

        // Process block collisions
        int collisionCount = result.getBlockCollisionCount();
        for (int i = 0; i < collisionCount; i++) {
            BlockCollisionData collision = result.getBlockCollision(i);

            getLogger().info("Collision at: " + collision.x + ", "
                + collision.y + ", " + collision.z);
            getLogger().info("Block type: " + collision.blockType.getId());
            getLogger().info("Collision point: " + collision.collisionPoint);
            getLogger().info("Collision normal: " + collision.collisionNormal);

            // Check if on ground
            if (collision.collisionNormal.y > 0.5) {
                getLogger().info("Entity is on ground");
            }
        }
    }

    // Custom raycast example
    public BlockCollisionData raycast(World world, Vector3d origin, Vector3d direction,
            double maxDistance) {
        Box pointBox = new Box(0, 0, 0, 0.01, 0.01, 0.01);
        Vector3d ray = direction.copy().normalize().scale(maxDistance);

        CollisionResult result = new CollisionResult(false, false);
        result.setCollisionByMaterial(CollisionMaterial.MATERIAL_SOLID);

        CollisionModule.findBlockCollisionsIterative(
            world, pointBox, origin, ray, true, result
        );

        return result.getFirstBlockCollision();
    }

    // Check if position is valid (not inside blocks)
    public boolean isPositionValid(World world, Box collider, Vector3d position) {
        CollisionResult result = new CollisionResult();
        int validation = CollisionModule.get().validatePosition(
            world, collider, position, result
        );

        return validation != CollisionModule.VALIDATE_INVALID;
    }

    // Check ground state
    public boolean isOnGround(World world, Box collider, Vector3d position) {
        CollisionResult result = new CollisionResult();
        int validation = CollisionModule.get().validatePosition(
            world, collider, position, result
        );

        return (validation & CollisionModule.VALIDATE_ON_GROUND) != 0;
    }
}
```

## Trigger Block Processing

The collision system supports trigger zones that fire interactions:

```java
// Process trigger blocks in collision result
int damage = result.defaultTriggerBlocksProcessing(
    interactionManager,
    entity,
    entityRef,
    true,  // executeTriggers
    componentAccessor
);

// Trigger interaction types
InteractionType.CollisionEnter  // Entity enters trigger zone
InteractionType.Collision       // Entity is inside trigger zone
InteractionType.CollisionLeave  // Entity leaves trigger zone
```

## Archivos Fuente

| Clase                            | Ruta                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `CollisionModule`                | `com.hypixel.hytale.server.core.modules.collision.CollisionModule`                    |
| `CollisionConfig`                | `com.hypixel.hytale.server.core.modules.collision.CollisionConfig`                    |
| `CollisionResult`                | `com.hypixel.hytale.server.core.modules.collision.CollisionResult`                    |
| `CollisionMath`                  | `com.hypixel.hytale.server.core.modules.collision.CollisionMath`                      |
| `CollisionMaterial`              | `com.hypixel.hytale.server.core.modules.collision.CollisionMaterial`                  |
| `CollisionFilter`                | `com.hypixel.hytale.server.core.modules.collision.CollisionFilter`                    |
| `BlockCollisionData`             | `com.hypixel.hytale.server.core.modules.collision.BlockCollisionData`                 |
| `CharacterCollisionData`         | `com.hypixel.hytale.server.core.modules.collision.CharacterCollisionData`             |
| `BlockCollisionProvider`         | `com.hypixel.hytale.server.core.modules.collision.BlockCollisionProvider`             |
| `EntityCollisionProvider`        | `com.hypixel.hytale.server.core.modules.collision.EntityCollisionProvider`            |
| `MovingBoxBoxCollisionEvaluator` | `com.hypixel.hytale.server.core.modules.collision.MovingBoxBoxCollisionEvaluator`     |
| `HitboxCollision`                | `com.hypixel.hytale.server.core.modules.entity.hitboxcollision.HitboxCollision`       |
| `HitboxCollisionConfig`          | `com.hypixel.hytale.server.core.modules.entity.hitboxcollision.HitboxCollisionConfig` |
| `CollisionType`                  | `com.hypixel.hytale.protocol.CollisionType`                                           |
