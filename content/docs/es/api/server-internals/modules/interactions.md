---
id: interactions
title: Interaction System
sidebar_label: Interactions
sidebar_position: 7
description: Complete documentation of the Hytale interaction system for items, blocks, entities, and custom interactions
---

# Interaction System

The Interaction System in Hytale provides a powerful framework for defining how players interact with items, blocks, and entities. This system is built on a chain-based architecture where interactions can be sequenced, conditioned, and composed together.

## Overview

The interaction system is managed by the `InteractionModule`, a core plugin that handles:
- Mouse button events (left/right click)
- Block interactions (break, place, use)
- Entity interactions (use, damage)
- Item interactions (equip, consume, charge)
- Projectile launching
- Force application and movement

**Source:** `com.hypixel.hytale.server.core.modules.interaction.InteractionModule`

## Interaction Types

Hytale defines several interaction types that determine how and when interactions are triggered:

| Type | Description |
|------|-------------|
| `Primary` | Left mouse button action |
| `Secondary` | Right mouse button action |
| `Use` | Context-sensitive use action |
| `Scroll` | Mouse scroll wheel action |

## Core Interaction Classes

### Base Interaction Class

All interactions extend from the base `Interaction` class:

```java
public abstract class Interaction {
    String id;                    // Unique identifier
    float runTime;               // Duration of the interaction
    InteractionEffects effects;  // Visual/audio effects
    InteractionRules rules;      // Blocking/interruption rules

    // Core methods
    protected abstract void tick0(boolean firstRun, float time,
        InteractionType type, InteractionContext context,
        CooldownHandler cooldownHandler);

    public WaitForDataFrom getWaitForDataFrom();
    public void compile(OperationsBuilder builder);
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.Interaction`

### SimpleInteraction

A basic interaction that can chain to next/failed interactions:

```java
public class SimpleInteraction extends Interaction {
    String next;    // Interaction to run on success
    String failed;  // Interaction to run on failure
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.SimpleInteraction`

## Block Interactions

### BreakBlockInteraction

Attempts to break the target block:

```java
public class BreakBlockInteraction extends SimpleBlockInteraction {
    boolean harvest;      // Whether to harvest vs break
    String toolId;        // Tool type to break as
    boolean matchTool;    // Require matching tool
}
```

**Configuration Properties:**
- `Harvest` - Whether this triggers as a harvest gather vs a break gather
- `Tool` - Tool to break as
- `MatchTool` - Whether to require a match to `Tool` to work

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.BreakBlockInteraction`

### PlaceBlockInteraction

Places the current or given block:

```java
public class PlaceBlockInteraction extends SimpleInteraction {
    String blockTypeKey;           // Override block type to place
    boolean removeItemInHand;      // Remove item after placement (default: true)
    boolean allowDragPlacement;    // Allow drag placement (default: true)
}
```

**Configuration Properties:**
- `BlockTypeToPlace` - Overrides the placed block type of the held item
- `RemoveItemInHand` - Whether to remove the item from the entity's hand
- `AllowDragPlacement` - If drag placement should be used when click is held

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.PlaceBlockInteraction`

### UseBlockInteraction

Attempts to use the target block, executing interactions on it:

```java
public class UseBlockInteraction extends SimpleBlockInteraction {
    // Executes the block's registered interactions
}
```

This interaction looks up the block type's registered interactions and executes them, firing `UseBlockEvent.Pre` and `UseBlockEvent.Post` events.

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.UseBlockInteraction`

### DoorInteraction

Opens/closes door blocks with smart double-door support:

```java
public class DoorInteraction extends SimpleBlockInteraction {
    boolean horizontal;  // Horizontal (gates) vs vertical (regular doors)
}
```

**Door States:**
- `CLOSED` - Door is closed
- `OPENED_IN` - Door opened inward
- `OPENED_OUT` - Door opened outward

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.DoorInteraction`

## Entity Interactions

### UseEntityInteraction

Attempts to use the target entity:

```java
public class UseEntityInteraction extends SimpleInstantInteraction {
    // Looks up entity's Interactions component
    // Executes the matching interaction type
}
```

This interaction retrieves the `Interactions` component from the target entity and executes the appropriate interaction.

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.UseEntityInteraction`

## Combat Interactions

### ChargingInteraction

An interaction that charges while the key is held:

```java
public class ChargingInteraction extends Interaction {
    boolean allowIndefiniteHold;              // Allow holding indefinitely
    boolean displayProgress;                  // Show charge progress (default: true)
    boolean cancelOnOtherClick;              // Cancel on other input (default: true)
    boolean failOnDamage;                    // Cancel if damaged
    Float2ObjectMap<String> next;            // Charge-time to interaction map
    Map<InteractionType, String> forks;      // Fork interactions while charging
    ChargingDelay chargingDelay;             // Delay configuration on damage
    float mouseSensitivityAdjustmentTarget;  // Mouse sensitivity modifier
}
```

**ChargingDelay Configuration:**
```java
public class ChargingDelay {
    float minDelay;       // Smallest delay applied
    float maxDelay;       // Largest delay applied
    float maxTotalDelay;  // Max total delay before ignored
    float minHealth;      // Health threshold for delay
    float maxHealth;      // Health threshold for max delay
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.ChargingInteraction`

### ChainingInteraction

Runs different interactions based on chain count:

```java
public class ChainingInteraction extends Interaction {
    String chainId;              // Optional chain identifier
    float chainingAllowance;     // Time window for chain (seconds)
    String[] next;               // Chain sequence interactions
    Map<String, String> flags;   // Flag-based interactions
}
```

This enables combo systems where repeated actions within a time window progress through a sequence.

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.ChainingInteraction`

### LaunchProjectileInteraction

Launches a projectile:

```java
@Deprecated(forRemoval = true)
public class LaunchProjectileInteraction extends SimpleInstantInteraction
    implements BallisticDataProvider {
    String projectileId;  // ID of the projectile to launch
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.LaunchProjectileInteraction`

## Movement Interactions

### ApplyForceInteraction

Applies force to the user with condition checking:

```java
public class ApplyForceInteraction extends SimpleInteraction {
    ChangeVelocityType changeVelocityType;  // Set or Add velocity
    Force[] forces;                          // Forces to apply
    float duration;                          // Duration to apply force
    boolean waitForGround;                   // Wait for ground contact
    boolean waitForCollision;                // Wait for collision
    float groundCheckDelay;                  // Delay before ground check
    float collisionCheckDelay;               // Delay before collision check
    float raycastDistance;                   // Collision raycast distance
    RaycastMode raycastMode;                 // Raycast direction mode
    FloatRange verticalClamp;                // Vertical angle clamp
    String groundInteraction;                // Run on ground contact
    String collisionInteraction;             // Run on collision
}
```

**Force Configuration:**
```java
public class Force {
    Vector3d direction;      // Force direction (normalized)
    boolean adjustVertical;  // Adjust based on look angle
    double force;           // Force magnitude
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.ApplyForceInteraction`

## Item Interactions

### EquipItemInteraction

Equips the item being held:

```java
public class EquipItemInteraction extends SimpleInstantInteraction {
    // Moves item from hand to appropriate armor slot
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.EquipItemInteraction`

### ApplyEffectInteraction

Applies an entity effect:

```java
public class ApplyEffectInteraction extends SimpleInstantInteraction {
    String effectId;              // Effect to apply
    InteractionTarget entityTarget;  // Target (USER, OWNER, TARGET)
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.none.simple.ApplyEffectInteraction`

## Container Interactions

### OpenContainerInteraction

Opens a container block's inventory:

```java
public class OpenContainerInteraction extends SimpleBlockInteraction {
    // Opens container UI for ItemContainerState blocks
    // Handles window management and sound events
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.OpenContainerInteraction`

## Prefab Interactions

### SpawnPrefabInteraction

Spawns a prefab at a location:

```java
public class SpawnPrefabInteraction extends SimpleInstantInteraction {
    String prefabPath;       // Path to prefab file
    Vector3i offset;         // Position offset
    Rotation rotationYaw;    // Yaw rotation
    OriginSource originSource;  // ENTITY or BLOCK origin
    boolean force;           // Force placement
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.SpawnPrefabInteraction`

## Interaction Priority System

The priority system determines which interaction takes precedence when multiple items are equipped:

```java
public record InteractionPriority(Map<PrioritySlot, Integer> values) {
    public int getPriority(PrioritySlot slot) {
        // Returns priority for the slot, falling back to Default
    }
}
```

**InteractionConfiguration:**
```java
public class InteractionConfiguration {
    boolean displayOutlines;           // Show interaction outlines
    boolean debugOutlines;             // Show debug outlines
    Object2FloatMap<GameMode> useDistance;  // Use distance by game mode
    boolean allEntities;               // Target all entities
    Map<InteractionType, InteractionPriority> priorities;  // Priority config
}
```

Default use distances:
- `Adventure` mode: 5.0 blocks
- `Creative` mode: 6.0 blocks

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionConfiguration`

## Interaction Rules

Rules control how interactions block or interrupt each other:

```java
public class InteractionRules {
    Set<InteractionType> blockedBy;     // Types that block this
    Set<InteractionType> blocking;      // Types this blocks
    Set<InteractionType> interruptedBy; // Types that interrupt this
    Set<InteractionType> interrupting;  // Types this interrupts

    // Bypass tags for each rule
    String blockedByBypass;
    String blockingBypass;
    String interruptedByBypass;
    String interruptingBypass;
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionRules`

## Interaction Effects

Visual and audio effects for interactions:

```java
public class InteractionEffects {
    ModelParticle[] particles;              // Particles to spawn
    ModelParticle[] firstPersonParticles;   // First-person particles
    String worldSoundEventId;               // 3D world sound
    String localSoundEventId;               // Local player sound
    ModelTrail[] trails;                    // Weapon trails
    boolean waitForAnimationToFinish;       // Wait for animation
    String itemPlayerAnimationsId;          // Animation set ID
    String itemAnimationId;                 // Specific animation
    boolean clearAnimationOnFinish;         // Clear animation after
    boolean clearSoundEventOnFinish;        // Clear sound after
    String cameraEffectId;                  // Camera shake/effects
    MovementEffects movementEffects;        // Movement modifications
    float startDelay;                       // Effect start delay
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionEffects`

## Interaction Target

Specifies which entity an interaction targets:

```java
public enum InteractionTarget {
    USER,   // Entity that triggered the interaction
    OWNER,  // Entity that owns the interaction chain
    TARGET  // Target entity of the interaction
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.util.InteractionTarget`

## Interactions Component

Entities can have interactions defined via the `Interactions` component:

```java
public class Interactions implements Component<EntityStore> {
    Map<InteractionType, String> interactions;  // Type to interaction ID
    String interactionHint;                     // UI hint text

    public String getInteractionId(InteractionType type);
    public void setInteractionId(InteractionType type, String interactionId);
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.Interactions`

## Console Commands

Hytale provides console commands for managing interactions:

| Command | Description |
|---------|-------------|
| `/interaction run <interactionId>` | Run a specific interaction |
| `/interaction clear` | Clear current interactions |

**Source:** `com.hypixel.hytale.server.core.modules.interaction.commands.InteractionCommand`

## Plugin Example

Here is a complete example of creating a custom interaction handler in a plugin:

```java
public class InteractionPlugin extends JavaPlugin {

    public InteractionPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Register for use block events
        getEventRegistry().register(UseBlockEvent.Pre.class, this::onUseBlockPre);
        getEventRegistry().register(UseBlockEvent.Post.class, this::onUseBlockPost);
    }

    private void onUseBlockPre(UseBlockEvent.Pre event) {
        InteractionContext context = event.getContext();
        BlockType blockType = event.getBlockType();
        Vector3i position = event.getPosition();

        getLogger().info("Player attempting to use block: " + blockType.getId()
            + " at " + position);

        // Cancel the interaction if needed
        if (shouldCancel(blockType)) {
            event.setCancelled(true);
        }
    }

    private void onUseBlockPost(UseBlockEvent.Post event) {
        getLogger().info("Block use completed for: " + event.getBlockType().getId());
    }

    private boolean shouldCancel(BlockType blockType) {
        // Custom logic to determine if interaction should be cancelled
        return false;
    }
}
```

## Working with Entity Interactions

To set up interactions on an entity:

```java
public void setupEntityInteractions(Ref<EntityStore> entityRef,
    CommandBuffer<EntityStore> commandBuffer) {

    // Get or create Interactions component
    Interactions interactions = commandBuffer.getComponent(
        entityRef,
        Interactions.getComponentType()
    );

    if (interactions == null) {
        interactions = new Interactions();
        commandBuffer.putComponent(entityRef, Interactions.getComponentType(), interactions);
    }

    // Set interaction for "Use" type
    interactions.setInteractionId(InteractionType.Use, "my_custom_interaction");

    // Set interaction hint for UI
    interactions.setInteractionHint("Press E to interact");
}
```

## Source Files

| Class | Path |
|-------|------|
| `InteractionModule` | `com.hypixel.hytale.server.core.modules.interaction.InteractionModule` |
| `Interaction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.Interaction` |
| `SimpleInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.SimpleInteraction` |
| `BreakBlockInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.BreakBlockInteraction` |
| `PlaceBlockInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.PlaceBlockInteraction` |
| `UseBlockInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.UseBlockInteraction` |
| `UseEntityInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.UseEntityInteraction` |
| `ChargingInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.ChargingInteraction` |
| `ChainingInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.ChainingInteraction` |
| `ApplyForceInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.ApplyForceInteraction` |
| `ApplyEffectInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.none.simple.ApplyEffectInteraction` |
| `EquipItemInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.EquipItemInteraction` |
| `LaunchProjectileInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.LaunchProjectileInteraction` |
| `SpawnPrefabInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.SpawnPrefabInteraction` |
| `OpenContainerInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.OpenContainerInteraction` |
| `DoorInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.DoorInteraction` |
| `InteractionConfiguration` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionConfiguration` |
| `InteractionPriority` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionPriority` |
| `InteractionRules` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionRules` |
| `InteractionEffects` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.InteractionEffects` |
| `InteractionTarget` | `com.hypixel.hytale.server.core.modules.interaction.interaction.util.InteractionTarget` |
| `Interactions` | `com.hypixel.hytale.server.core.modules.interaction.Interactions` |
