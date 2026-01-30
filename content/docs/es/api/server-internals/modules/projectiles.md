---
id: projectiles
title: Projectile System
sidebar_label: Projectiles
sidebar_position: 7
description: Complete documentation of the Hytale projectile system for creating arrows, thrown objects, and custom projectiles
---

# Projectile System

The Projectile System in Hytale provides a comprehensive framework for creating and managing projectiles such as arrows, thrown weapons, spells, and other flying objects. The system is built on the ECS (Entity Component System) architecture and supports client-side prediction for responsive gameplay.

## Architecture Overview

The projectile system consists of several key components:

| Component | Description |
|-----------|-------------|
| `ProjectileModule` | Core module that manages projectile spawning and systems |
| `Projectile` | Marker component identifying an entity as a projectile |
| `PredictedProjectile` | Component for client-side prediction support |
| `ProjectileConfig` | Configuration asset defining projectile properties |
| `StandardPhysicsProvider` | Physics simulation component for projectiles |
| `StandardPhysicsConfig` | Physics configuration (gravity, bounce, drag, etc.) |

**Source:** `com.hypixel.hytale.server.core.modules.projectile.ProjectileModule`

## Module Registration

The ProjectileModule depends on both CollisionModule and EntityModule:

```java
@Nonnull
public static final PluginManifest MANIFEST = PluginManifest.corePlugin(ProjectileModule.class)
   .description(
      "This module implements the new projectile system. Disabling this module will prevent anything using the new projectile system from functioning."
   )
   .depends(CollisionModule.class)
   .depends(EntityModule.class)
   .build();
```

## Projectile Component

The `Projectile` component is a simple marker component that identifies an entity as a projectile:

```java
public class Projectile implements Component<EntityStore> {
   @Nonnull
   public static Projectile INSTANCE = new Projectile();

   public static ComponentType<EntityStore, Projectile> getComponentType() {
      return ProjectileModule.get().getProjectileComponentType();
   }
}
```

**Source:** `com.hypixel.hytale.server.core.modules.projectile.component.Projectile`

## PredictedProjectile Component

The `PredictedProjectile` component enables client-side prediction by associating a UUID with the projectile:

```java
public class PredictedProjectile implements Component<EntityStore> {
   @Nonnull
   private final UUID uuid;

   public PredictedProjectile(@Nonnull UUID uuid) {
      this.uuid = uuid;
   }

   @Nonnull
   public UUID getUuid() {
      return this.uuid;
   }
}
```

**Source:** `com.hypixel.hytale.server.core.modules.projectile.component.PredictedProjectile`

## ProjectileConfig

The `ProjectileConfig` class defines all configurable properties for a projectile type:

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `Physics` | `PhysicsConfig` | `StandardPhysicsConfig.DEFAULT` | Physics simulation settings |
| `Model` | `String` | - | Model asset ID for visual representation |
| `LaunchForce` | `double` | `1.0` | Initial velocity multiplier |
| `SpawnOffset` | `Vector3f` | `(0, 0, 0)` | Position offset from spawn point |
| `SpawnRotationOffset` | `Direction` | `(0, 0, 0)` | Rotation offset (pitch, yaw, roll) |
| `Interactions` | `Map<InteractionType, String>` | Empty | Interaction handlers by type |
| `LaunchLocalSoundEventId` | `String` | - | Sound played to the thrower |
| `LaunchWorldSoundEventId` | `String` | - | Sound played to nearby players |
| `ProjectileSoundEventId` | `String` | - | Looping sound attached to projectile |

### Ballistic Data Interface

ProjectileConfig implements the `BallisticData` interface for trajectory calculations:

```java
public interface BallisticData {
   double getMuzzleVelocity();
   double getGravity();
   double getVerticalCenterShot();
   double getDepthShot();
   boolean isPitchAdjustShot();
}
```

**Source:** `com.hypixel.hytale.server.core.modules.projectile.config.ProjectileConfig`

## Physics Configuration

### StandardPhysicsConfig Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `Density` | `double` | `700.0` | Projectile density for buoyancy |
| `Gravity` | `double` | `0.0` | Gravity acceleration |
| `Bounciness` | `double` | `0.0` | Bounce coefficient (0.0 - 1.0) |
| `BounceLimit` | `double` | `0.4` | Minimum velocity to bounce |
| `BounceCount` | `int` | `-1` | Max bounces (-1 = unlimited) |
| `SticksVertically` | `boolean` | `false` | Stick to surfaces on impact |
| `ComputeYaw` | `boolean` | `true` | Auto-compute yaw from velocity |
| `ComputePitch` | `boolean` | `true` | Auto-compute pitch from velocity |
| `RotationMode` | `RotationMode` | `VelocityDamped` | How rotation follows velocity |
| `MoveOutOfSolidSpeed` | `double` | `0.0` | Speed to escape solid blocks |
| `TerminalVelocityAir` | `double` | `1.0` | Max velocity in air |
| `DensityAir` | `double` | `1.2` | Air density for drag |
| `TerminalVelocityWater` | `double` | `1.0` | Max velocity in water |
| `DensityWater` | `double` | `998.0` | Water density for drag |
| `HitWaterImpulseLoss` | `double` | `0.2` | Velocity loss on water entry |
| `RotationForce` | `double` | `3.0` | Rotation damping force |
| `SpeedRotationFactor` | `float` | `2.0` | Velocity-rotation coupling |
| `SwimmingDampingFactor` | `double` | `1.0` | Damping when submerged |
| `AllowRolling` | `boolean` | `false` | Enable rolling on surfaces |
| `RollingFrictionFactor` | `double` | `0.99` | Rolling friction coefficient |
| `RollingSpeed` | `float` | `0.1` | Rolling rotation speed |

### Rotation Modes

```java
public enum RotationMode {
   None,           // No automatic rotation
   Velocity,       // Instant rotation to match velocity
   VelocityDamped, // Smoothed rotation following velocity
   VelocityRoll    // Rolling rotation based on velocity
}
```

**Source:** `com.hypixel.hytale.server.core.modules.projectile.config.StandardPhysicsConfig`

## Spawning Projectiles

### Using ProjectileModule

The `ProjectileModule` provides methods to spawn projectiles:

```java
// Without client prediction
@Nonnull
public Ref<EntityStore> spawnProjectile(
   Ref<EntityStore> creatorRef,
   @Nonnull CommandBuffer<EntityStore> commandBuffer,
   @Nonnull ProjectileConfig config,
   @Nonnull Vector3d position,
   @Nonnull Vector3d direction
)

// With client prediction
@Nonnull
public Ref<EntityStore> spawnProjectile(
   @Nullable UUID predictionId,
   Ref<EntityStore> creatorRef,
   @Nonnull CommandBuffer<EntityStore> commandBuffer,
   @Nonnull ProjectileConfig config,
   @Nonnull Vector3d position,
   @Nonnull Vector3d direction
)
```

### Spawn Process

When a projectile is spawned, the system:

1. Creates a new entity holder
2. Calculates rotation from direction vector
3. Applies spawn offset and rotation offset
4. Adds required components:
   - `TransformComponent` - Position and rotation
   - `HeadRotation` - Head orientation
   - `Interactions` - Interaction handlers
   - `ModelComponent` / `PersistentModel` - Visual model
   - `BoundingBox` - Collision bounds
   - `NetworkId` - Network synchronization
   - `Projectile` - Marker component
   - `Velocity` - Movement velocity
   - `DespawnComponent` - Auto-despawn after 300 seconds
5. Configures physics via `PhysicsConfig.apply()`
6. Plays launch sounds
7. Triggers `ProjectileSpawn` interaction

**Source:** `com.hypixel.hytale.server.core.modules.projectile.ProjectileModule.spawnProjectile()`

## Physics System

### StandardPhysicsProvider

The `StandardPhysicsProvider` handles all physics simulation:

```java
public class StandardPhysicsProvider implements IBlockCollisionConsumer, Component<EntityStore> {
   // Physics state
   protected final Vector3d velocity;
   protected final Vector3d position;
   protected final Vector3d movement;

   // Collision handling
   protected final BlockCollisionProvider blockCollisionProvider;
   protected final EntityRefCollisionProvider entityCollisionProvider;

   // State tracking
   protected boolean bounced;
   protected int bounces = 0;
   protected boolean onGround;
   protected boolean inFluid;

   // Callbacks
   protected BounceConsumer bounceConsumer;
   protected ImpactConsumer impactConsumer;
}
```

### Physics States

```java
public enum STATE {
   ACTIVE,   // Actively simulating physics
   RESTING,  // At rest on a surface
   INACTIVE  // Physics disabled (after impact)
}
```

**Source:** `com.hypixel.hytale.server.core.modules.projectile.config.StandardPhysicsProvider`

### StandardPhysicsTickSystem

The physics tick system runs every frame to update projectiles:

```java
public class StandardPhysicsTickSystem extends EntityTickingSystem<EntityStore> {
   @Nonnull
   private final Query<EntityStore> query = Query.and(
      StandardPhysicsProvider.getComponentType(),
      TransformComponent.getComponentType(),
      HeadRotation.getComponentType(),
      Velocity.getComponentType(),
      BoundingBox.getComponentType()
   );
}
```

The tick process:

1. Gets time dilation modifier
2. Updates velocity from forces
3. Calculates movement vector
4. Checks entity collisions
5. Checks block collisions
6. Handles fluid interactions
7. Processes bounces or impacts
8. Updates rotation based on velocity
9. Finalizes position and velocity

**Source:** `com.hypixel.hytale.server.core.modules.projectile.system.StandardPhysicsTickSystem`

## Hit Detection and Damage

### Impact Consumer

The `ImpactConsumer` interface handles projectile impacts:

```java
@FunctionalInterface
public interface ImpactConsumer {
   void onImpact(
      @Nonnull Ref<EntityStore> projectileRef,
      @Nonnull Vector3d position,
      @Nullable Ref<EntityStore> targetRef,
      @Nullable String collisionDetailName,
      @Nonnull CommandBuffer<EntityStore> commandBuffer
   );
}
```

### Bounce Consumer

The `BounceConsumer` interface handles projectile bounces:

```java
@FunctionalInterface
public interface BounceConsumer {
   void onBounce(
      @Nonnull Ref<EntityStore> projectileRef,
      @Nonnull Vector3d position,
      @Nonnull CommandBuffer<EntityStore> commandBuffer
   );
}
```

### Interaction Types

Projectiles trigger different interaction types:

| Interaction Type | Trigger Condition |
|------------------|-------------------|
| `ProjectileSpawn` | When projectile is spawned |
| `ProjectileHit` | When projectile hits an entity |
| `ProjectileMiss` | When projectile hits terrain/stops |
| `ProjectileBounce` | When projectile bounces |

**Source:** `com.hypixel.hytale.server.core.modules.projectile.config.ImpactConsumer`, `BounceConsumer`

## Client-Side Prediction

### PredictedProjectileSystems

The prediction system synchronizes client-predicted projectiles:

```java
public class PredictedProjectileSystems {
   public static class EntityTrackerUpdate extends EntityTickingSystem<EntityStore> {
      @Nonnull
      private final Query<EntityStore> query = Query.and(
         EntityTrackerSystems.Visible.getComponentType(),
         PredictedProjectile.getComponentType()
      );

      @Override
      public void tick(...) {
         // Queue prediction updates for newly visible entities
         if (!visibleComponent.newlyVisibleTo.isEmpty()) {
            queueUpdatesFor(ref, predictedProjectile, visibleComponent.newlyVisibleTo);
         }
      }
   }
}
```

The system sends `ComponentUpdate` with `ComponentUpdateType.Prediction` to sync client predictions.

**Source:** `com.hypixel.hytale.server.core.modules.projectile.system.PredictedProjectileSystems`

## ProjectileInteraction

The `ProjectileInteraction` creates projectiles from the interaction system:

```java
public class ProjectileInteraction extends SimpleInstantInteraction implements BallisticDataProvider {
   protected String config;  // ProjectileConfig asset ID

   @Override
   protected void firstRun(InteractionType type, InteractionContext context, CooldownHandler cooldownHandler) {
      ProjectileConfig config = this.getConfig();
      if (config != null) {
         // Get position and direction from client state or server
         Vector3d position;
         Vector3d direction;
         UUID generatedUUID;

         if (hasClientState) {
            position = PositionUtil.toVector3d(clientState.attackerPos);
            direction = new Vector3d(lookVec.getYaw(), lookVec.getPitch());
            generatedUUID = clientState.generatedUUID;
         } else {
            Transform lookVec = TargetUtil.getLook(ref, commandBuffer);
            position = lookVec.getPosition();
            direction = lookVec.getDirection();
            generatedUUID = null;
         }

         ProjectileModule.get().spawnProjectile(generatedUUID, ref, commandBuffer, config, position, direction);
      }
   }
}
```

**Source:** `com.hypixel.hytale.server.core.modules.projectile.interaction.ProjectileInteraction`

## Legacy Projectile System

:::warning Deprecated
The legacy projectile system using `ProjectileComponent` is deprecated. Use the new `ProjectileModule` system instead.
:::

The legacy `ProjectileComponent` provides additional features like damage and particles:

```java
@Deprecated
public class ProjectileComponent implements Component<EntityStore> {
   // Properties
   private String projectileAssetName;
   private float brokenDamageModifier = 1.0F;
   private double deadTimer = -1.0;
   private UUID creatorUuid;
   private boolean haveHit;

   // Physics
   private SimplePhysicsProvider simplePhysicsProvider;
}
```

**Source:** `com.hypixel.hytale.server.core.entity.entities.ProjectileComponent`

## Plugin Example

Here's a complete example of spawning a projectile from a plugin:

```java
public class ProjectilePlugin extends JavaPlugin {

   public ProjectilePlugin(@Nonnull JavaPluginInit init) {
      super(init);
   }

   @Override
   protected void setup() {
      getEventRegistry().register(PlayerInteractEvent.class, this::onPlayerInteract);
   }

   private void onPlayerInteract(PlayerInteractEvent event) {
      PlayerRef playerRef = event.getPlayerRef();
      World world = event.getWorld();
      Store<EntityStore> store = world.getEntityStore().getStore();

      // Get player look direction
      TransformComponent transform = store.getComponent(
         playerRef.getReference(),
         TransformComponent.getComponentType()
      );

      if (transform != null) {
         Vector3d position = transform.getPosition().clone();
         position.y += 1.6; // Eye height offset

         Vector3f rotation = transform.getRotation();
         Vector3d direction = new Vector3d();
         PhysicsMath.vectorFromAngles(rotation.getYaw(), rotation.getPitch(), direction);

         // Get projectile config from asset store
         ProjectileConfig config = ProjectileConfig.getAssetMap().getAsset("my_projectile");

         if (config != null) {
            // Spawn the projectile using Store.forEach which provides CommandBuffer
            store.forEach(PlayerSystem.getSystemType(), (ref, buffer) -> {
               if (ref.equals(playerRef.getReference())) {
                  Ref<EntityStore> projectileRef = ProjectileModule.get().spawnProjectile(
                     ref,
                     buffer,
                     config,
                     position,
                     direction
                  );
                  getLogger().info("Spawned projectile: " + projectileRef);
               }
            });
         }
      }
   }

   // Custom projectile with modified physics
   public void spawnCustomProjectile(
      Ref<EntityStore> creatorRef,
      CommandBuffer<EntityStore> commandBuffer,
      Vector3d position,
      Vector3d direction
   ) {
      ProjectileConfig baseConfig = ProjectileConfig.getAssetMap().getAsset("arrow");

      if (baseConfig != null) {
         // Spawn with increased launch force
         Vector3d boostedDirection = direction.clone().scale(2.0);

         ProjectileModule.get().spawnProjectile(
            creatorRef,
            commandBuffer,
            baseConfig,
            position,
            boostedDirection
         );
      }
   }
}
```

## JSON Configuration Example

Example projectile configuration in JSON:

```json
{
   "Id": "my_custom_arrow",
   "Physics": {
      "Type": "Standard",
      "Gravity": 9.8,
      "Density": 700.0,
      "Bounciness": 0.3,
      "BounceCount": 2,
      "BounceLimit": 0.4,
      "SticksVertically": true,
      "ComputeYaw": true,
      "ComputePitch": true,
      "RotationMode": "VelocityDamped",
      "TerminalVelocityAir": 50.0,
      "TerminalVelocityWater": 10.0
   },
   "Model": "models/projectiles/arrow",
   "LaunchForce": 25.0,
   "SpawnOffset": { "x": 0.0, "y": 0.5, "z": 1.0 },
   "SpawnRotationOffset": { "pitch": 0.0, "yaw": 0.0, "roll": 0.0 },
   "Interactions": {
      "ProjectileHit": "interactions/arrow_hit",
      "ProjectileMiss": "interactions/arrow_miss",
      "ProjectileBounce": "interactions/arrow_bounce"
   },
   "LaunchLocalSoundEventId": "sounds/bow_release",
   "LaunchWorldSoundEventId": "sounds/arrow_whoosh",
   "ProjectileSoundEventId": "sounds/arrow_flight_loop"
}
```

## Network Protocol

Projectile configurations are serialized for network transmission:

```java
public class ProjectileConfig {
   public PhysicsConfig physicsConfig;
   public Model model;
   public double launchForce;
   public Vector3f spawnOffset;
   public Direction rotationOffset;
   public Map<InteractionType, Integer> interactions;
   public int launchLocalSoundEventIndex;
   public int projectileSoundEventIndex;
}
```

**Source:** `com.hypixel.hytale.protocol.ProjectileConfig`

## Source Files

| Class | Path |
|-------|------|
| `ProjectileModule` | `com.hypixel.hytale.server.core.modules.projectile.ProjectileModule` |
| `Projectile` | `com.hypixel.hytale.server.core.modules.projectile.component.Projectile` |
| `PredictedProjectile` | `com.hypixel.hytale.server.core.modules.projectile.component.PredictedProjectile` |
| `ProjectileConfig` | `com.hypixel.hytale.server.core.modules.projectile.config.ProjectileConfig` |
| `PhysicsConfig` | `com.hypixel.hytale.server.core.modules.projectile.config.PhysicsConfig` |
| `StandardPhysicsConfig` | `com.hypixel.hytale.server.core.modules.projectile.config.StandardPhysicsConfig` |
| `StandardPhysicsProvider` | `com.hypixel.hytale.server.core.modules.projectile.config.StandardPhysicsProvider` |
| `StandardPhysicsTickSystem` | `com.hypixel.hytale.server.core.modules.projectile.system.StandardPhysicsTickSystem` |
| `PredictedProjectileSystems` | `com.hypixel.hytale.server.core.modules.projectile.system.PredictedProjectileSystems` |
| `ProjectileInteraction` | `com.hypixel.hytale.server.core.modules.projectile.interaction.ProjectileInteraction` |
| `ImpactConsumer` | `com.hypixel.hytale.server.core.modules.projectile.config.ImpactConsumer` |
| `BounceConsumer` | `com.hypixel.hytale.server.core.modules.projectile.config.BounceConsumer` |
| `BallisticData` | `com.hypixel.hytale.server.core.modules.projectile.config.BallisticData` |
