---
id: effects-system
title: Sistema de Efectos de Entidad
sidebar_label: Efectos de Entidad
sidebar_position: 7
description: Documentación completa del sistema de efectos de entidad de Hytale para buffs, debuffs y efectos de estado
---

# Entity Effects System

The Entity Effects system in Hytale provides a comprehensive way to apply temporary or permanent status effects to entities. This system supports buffs, debuffs, visual effects, stat modifications, movement restrictions, and more.

## Overview

Entity effects are managed through the `EffectControllerComponent`, which is an ECS component attached to entities capable of receiving effects. Each effect has properties like duration, overlap behavior, visual effects, and stat modifiers.

## Core Classes

| Class                       | Package                                                         | Description                                     |
| --------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `EffectControllerComponent` | `com.hypixel.hytale.server.core.entity.effect`                  | Main component for managing effects on entities |
| `ActiveEntityEffect`        | `com.hypixel.hytale.server.core.entity.effect`                  | Represents an active effect instance            |
| `EntityEffect`              | `com.hypixel.hytale.server.core.asset.type.entityeffect.config` | Effect definition/configuration                 |
| `LivingEntityEffectSystem`  | `com.hypixel.hytale.server.core.modules.entity.livingentity`    | System that processes effect ticks              |

## EntityEffect Properties

Each entity effect is defined with the following properties:

```java
public class EntityEffect {
    String id;                        // Unique identifier
    String name;                      // Display name
    float duration;                   // Effect duration in seconds
    boolean infinite;                 // Whether effect lasts forever
    boolean debuff;                   // True if negative effect
    String statusEffectIcon;          // Icon for UI display
    OverlapBehavior overlapBehavior;  // How to handle re-application
    RemovalBehavior removalBehavior;  // How effect is removed
    double damageCalculatorCooldown;  // Cooldown for damage-over-time
    Map<Integer, Float> statModifiers;  // Stat modifications
    ValueType valueType;              // How stat modifiers are applied
    ApplicationEffects applicationEffects;  // Visual/audio effects
    boolean invulnerable;             // Grants invulnerability
    String modelChange;               // Model override during effect
}
```

**Source:** `com.hypixel.hytale.server.core.asset.type.entityeffect.config.EntityEffect`

## EffectControllerComponent

The `EffectControllerComponent` manages all active effects on an entity:

```java
// Get the component type
ComponentType<EntityStore, EffectControllerComponent> componentType =
    EffectControllerComponent.getComponentType();

// Get an entity's effect controller
EffectControllerComponent effectController =
    store.getComponent(entityRef, componentType);
```

### Key Methods

```java
public class EffectControllerComponent {
    // Add effect with default settings
    boolean addEffect(Ref<EntityStore> ownerRef, EntityEffect entityEffect,
                      ComponentAccessor<EntityStore> componentAccessor);

    // Add effect with custom duration and overlap behavior
    boolean addEffect(Ref<EntityStore> ownerRef, EntityEffect entityEffect,
                      float duration, OverlapBehavior overlapBehavior,
                      ComponentAccessor<EntityStore> componentAccessor);

    // Add infinite (permanent) effect
    boolean addInfiniteEffect(Ref<EntityStore> ownerRef, int entityEffectIndex,
                              EntityEffect entityEffect,
                              ComponentAccessor<EntityStore> componentAccessor);

    // Remove a specific effect
    void removeEffect(Ref<EntityStore> ownerRef, int entityEffectIndex,
                      ComponentAccessor<EntityStore> componentAccessor);

    // Remove effect with specific removal behavior
    void removeEffect(Ref<EntityStore> ownerRef, int entityEffectIndex,
                      RemovalBehavior removalBehavior,
                      ComponentAccessor<EntityStore> componentAccessor);

    // Clear all effects
    void clearEffects(Ref<EntityStore> ownerRef,
                      ComponentAccessor<EntityStore> componentAccessor);

    // Get all active effects
    Int2ObjectMap<ActiveEntityEffect> getActiveEffects();

    // Get active effect indexes
    int[] getActiveEffectIndexes();

    // Check if entity is invulnerable due to effects
    boolean isInvulnerable();
}
```

**Source:** `com.hypixel.hytale.server.core.entity.effect.EffectControllerComponent`

## ActiveEntityEffect

Represents an instance of an effect currently applied to an entity:

```java
public class ActiveEntityEffect {
    String entityEffectId;       // Effect identifier
    int entityEffectIndex;       // Effect index in asset map
    float initialDuration;       // Original duration
    float remainingDuration;     // Time left
    boolean infinite;            // Is permanent
    boolean debuff;              // Is negative effect
    String statusEffectIcon;     // UI icon
    boolean invulnerable;        // Grants invulnerability
}
```

### Key Methods

```java
// Get remaining duration
float getRemainingDuration();

// Check if effect is infinite
boolean isInfinite();

// Check if effect is a debuff
boolean isDebuff();

// Check if effect grants invulnerability
boolean isInvulnerable();

// Get the effect index
int getEntityEffectIndex();
```

**Source:** `com.hypixel.hytale.server.core.entity.effect.ActiveEntityEffect`

## Overlap Behaviors

When an effect is applied to an entity that already has that effect, the `OverlapBehavior` determines what happens:

| Comportamiento | Descripción                                              |
| -------------- | -------------------------------------------------------- |
| `EXTEND`       | Añade la nueva duración a la duración restante           |
| `OVERWRITE`    | Reemplaza el efecto actual con el nuevo                  |
| `IGNORE`       | Mantiene el efecto existente, ignora la nueva aplicación |

```java
public enum OverlapBehavior {
    EXTEND,
    OVERWRITE,
    IGNORE
}
```

**Source:** `com.hypixel.hytale.server.core.asset.type.entityeffect.config.OverlapBehavior`

## Removal Behaviors

When removing an effect, `RemovalBehavior` determines how it's handled:

| Behavior   | Description                                        |
| ---------- | -------------------------------------------------- |
| `COMPLETE` | Fully removes the effect immediately               |
| `INFINITE` | Only removes the infinite flag, duration continues |
| `DURATION` | Sets remaining duration to zero                    |

```java
public enum RemovalBehavior {
    COMPLETE,
    INFINITE,
    DURATION
}
```

**Source:** `com.hypixel.hytale.server.core.asset.type.entityeffect.config.RemovalBehavior`

## ApplicationEffects

Visual and audio effects applied when an effect is active:

```java
public class ApplicationEffects {
    Color entityBottomTint;              // Bottom color tint
    Color entityTopTint;                 // Top color tint
    String entityAnimationId;            // Animation to play
    ModelParticle[] particles;           // Particle effects
    ModelParticle[] firstPersonParticles; // First-person particles
    String screenEffect;                 // Screen overlay effect
    float horizontalSpeedMultiplier;     // Movement speed modifier
    float knockbackMultiplier;           // Knockback modifier
    String soundEventIdLocal;            // Sound for affected entity
    String soundEventIdWorld;            // Sound for other players
    String modelVFXId;                   // Model VFX to apply
    MovementEffects movementEffects;     // Movement restrictions
    AbilityEffects abilityEffects;       // Ability restrictions
}
```

**Source:** `com.hypixel.hytale.server.core.asset.type.entityeffect.config.ApplicationEffects`

## MovementEffects

Controls movement restrictions during an effect:

```java
public class MovementEffects {
    boolean disableAll;       // Disable all movement
    boolean disableForward;   // Disable forward movement
    boolean disableBackward;  // Disable backward movement
    boolean disableLeft;      // Disable left strafe
    boolean disableRight;     // Disable right strafe
    boolean disableSprint;    // Disable sprinting
    boolean disableJump;      // Disable jumping
    boolean disableCrouch;    // Disable crouching
}
```

**Source:** `com.hypixel.hytale.server.core.asset.modifiers.MovementEffects`

## AbilityEffects

Controls ability restrictions during an effect:

```java
public class AbilityEffects {
    Set<InteractionType> disabled;  // Interaction types to disable
}
```

**Source:** `com.hypixel.hytale.server.core.asset.type.entityeffect.config.AbilityEffects`

## Console Commands

Hytale provides console commands for managing entity effects:

### Player Effect Commands

| Command                                             | Description                           |
| --------------------------------------------------- | ------------------------------------- |
| `/player effect apply <effect> [duration]`          | Apply effect to yourself              |
| `/player effect apply <player> <effect> [duration]` | Apply effect to another player        |
| `/player effect clear`                              | Clear all effects from yourself       |
| `/player effect clear <player>`                     | Clear all effects from another player |

### Entity Effect Commands

| Command                                       | Description            |
| --------------------------------------------- | ---------------------- |
| `/entity effect <entity> <effect> [duration]` | Apply effect to entity |

**Default duration:** 100 seconds

## Plugin Example

Here's a complete example of managing entity effects in a plugin:

```java
package com.example.effectsplugin;

import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.server.core.asset.type.entityeffect.config.EntityEffect;
import com.hypixel.hytale.server.core.asset.type.entityeffect.config.OverlapBehavior;
import com.hypixel.hytale.server.core.entity.effect.ActiveEntityEffect;
import com.hypixel.hytale.server.core.entity.effect.EffectControllerComponent;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.World;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.plugin.java.JavaPlugin;
import com.hypixel.hytale.server.plugin.java.JavaPluginInit;
import it.unimi.dsi.fastutil.ints.Int2ObjectMap;
import javax.annotation.Nonnull;

public class EffectsPlugin extends JavaPlugin {

    public EffectsPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Register event listeners here
        getLogger().info("Effects plugin loaded!");
    }

    /**
     * Apply an effect to a player by effect ID
     */
    public boolean applyEffect(PlayerRef playerRef, String effectId, float duration) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return false;
        }

        Store<EntityStore> store = ref.getStore();

        // Get the effect from the asset map
        EntityEffect entityEffect = EntityEffect.getAssetMap().getAsset(effectId);
        if (entityEffect == null) {
            getLogger().warn("Effect not found: " + effectId);
            return false;
        }

        // Get the effect controller component
        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController == null) {
            getLogger().warn("Entity does not have EffectControllerComponent");
            return false;
        }

        // Apply the effect with custom duration
        boolean success = effectController.addEffect(
            ref,
            entityEffect,
            duration,
            OverlapBehavior.OVERWRITE,
            store
        );

        if (success) {
            getLogger().info("Applied effect " + effectId + " for " + duration + "s");
        }

        return success;
    }

    /**
     * Apply an infinite (permanent) effect
     */
    public boolean applyInfiniteEffect(PlayerRef playerRef, String effectId) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return false;
        }

        Store<EntityStore> store = ref.getStore();

        EntityEffect entityEffect = EntityEffect.getAssetMap().getAsset(effectId);
        if (entityEffect == null) {
            return false;
        }

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController == null) {
            return false;
        }

        int effectIndex = EntityEffect.getAssetMap().getIndex(effectId);
        return effectController.addInfiniteEffect(ref, effectIndex, entityEffect, store);
    }

    /**
     * Remove a specific effect from a player
     */
    public void removeEffect(PlayerRef playerRef, String effectId) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return;
        }

        Store<EntityStore> store = ref.getStore();

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController == null) {
            return;
        }

        int effectIndex = EntityEffect.getAssetMap().getIndex(effectId);
        if (effectIndex != Integer.MIN_VALUE) {
            effectController.removeEffect(ref, effectIndex, store);
            getLogger().info("Removed effect: " + effectId);
        }
    }

    /**
     * Clear all effects from a player
     */
    public void clearAllEffects(PlayerRef playerRef) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return;
        }

        Store<EntityStore> store = ref.getStore();

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController != null) {
            effectController.clearEffects(ref, store);
            getLogger().info("Cleared all effects");
        }
    }

    /**
     * Check if a player has a specific effect
     */
    public boolean hasEffect(PlayerRef playerRef, String effectId) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return false;
        }

        Store<EntityStore> store = ref.getStore();

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController == null) {
            return false;
        }

        int effectIndex = EntityEffect.getAssetMap().getIndex(effectId);
        return effectController.getActiveEffects().containsKey(effectIndex);
    }

    /**
     * Get remaining duration of an effect
     */
    public float getEffectRemainingDuration(PlayerRef playerRef, String effectId) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return 0f;
        }

        Store<EntityStore> store = ref.getStore();

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController == null) {
            return 0f;
        }

        int effectIndex = EntityEffect.getAssetMap().getIndex(effectId);
        ActiveEntityEffect activeEffect = effectController.getActiveEffects().get(effectIndex);

        if (activeEffect == null) {
            return 0f;
        }

        return activeEffect.isInfinite() ? Float.POSITIVE_INFINITY : activeEffect.getRemainingDuration();
    }

    /**
     * List all active effects on a player
     */
    public void listActiveEffects(PlayerRef playerRef) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return;
        }

        Store<EntityStore> store = ref.getStore();

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        if (effectController == null) {
            return;
        }

        Int2ObjectMap<ActiveEntityEffect> activeEffects = effectController.getActiveEffects();

        getLogger().info("Active effects (" + activeEffects.size() + "):");
        for (ActiveEntityEffect effect : activeEffects.values()) {
            String duration = effect.isInfinite() ? "infinite" :
                              String.format("%.1fs", effect.getRemainingDuration());
            String type = effect.isDebuff() ? "[Debuff]" : "[Buff]";
            getLogger().info("  - " + effect.getEntityEffectIndex() + " " + type + " Duration: " + duration);
        }
    }

    /**
     * Check if player is invulnerable due to effects
     */
    public boolean isInvulnerableFromEffects(PlayerRef playerRef) {
        Ref<EntityStore> ref = playerRef.getReference();
        if (ref == null || !ref.isValid()) {
            return false;
        }

        Store<EntityStore> store = ref.getStore();

        EffectControllerComponent effectController =
            store.getComponent(ref, EffectControllerComponent.getComponentType());

        return effectController != null && effectController.isInvulnerable();
    }
}
```

## Interaction-Based Effects

### ApplyEffectInteraction

Apply effects through the interaction system:

```java
public class ApplyEffectInteraction extends SimpleInstantInteraction {
    String effectId;                    // Effect to apply
    InteractionTarget entityTarget;     // Target (USER, TARGET, etc.)
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.none.simple.ApplyEffectInteraction`

### ClearEntityEffectInteraction

Remove effects through the interaction system:

```java
public class ClearEntityEffectInteraction extends SimpleInstantInteraction {
    String entityEffectId;              // Effect to remove
    InteractionTarget entityTarget;     // Target entity
}
```

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.ClearEntityEffectInteraction`

### EffectConditionInteraction

Check for effect presence in interaction chains:

```java
public class EffectConditionInteraction extends SimpleInstantInteraction {
    String[] entityEffectIds;           // Effects to check
    Match match;                        // ALL or NONE
    InteractionTarget entityTarget;     // Target to check
}
```

The interaction succeeds if:

- `Match.All`: Target has ALL specified effects
- `Match.None`: Target has NONE of the specified effects

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.none.EffectConditionInteraction`

## NPC Effect Actions

NPCs can apply effects using `ActionApplyEntityEffect`:

```java
public class ActionApplyEntityEffect extends ActionBase {
    int entityEffectId;    // Effect index to apply
    boolean useTarget;     // Apply to target vs self
}
```

**Source:** `com.hypixel.hytale.server.npc.corecomponents.combat.ActionApplyEntityEffect`

## Effect Processing System

The `LivingEntityEffectSystem` handles effect ticking each frame:

```java
public class LivingEntityEffectSystem extends EntityTickingSystem<EntityStore> {
    // Processes all entities with EffectControllerComponent
    // - Decrements duration for non-infinite effects
    // - Removes expired effects
    // - Applies damage-over-time effects
    // - Updates stat modifiers
    // - Handles special conditions (e.g., Burn effect removed by water)
}
```

### Special Effect Handling

Some effects have special behavior:

- **Burn**: Automatically removed when entity enters water

```java
// From LivingEntityEffectSystem.canApplyEffect()
if ("Burn".equals(entityEffect.getId())) {
    // Check if entity is touching water blocks
    return !touchingWater;
}
```

**Source:** `com.hypixel.hytale.server.core.modules.entity.livingentity.LivingEntityEffectSystem`

## Network Synchronization

Effects are synchronized to clients using `EntityEffectUpdate`:

```java
public class EntityEffectUpdate {
    EffectOp op;           // Add or Remove
    int effectIndex;       // Effect asset index
    float duration;        // Remaining duration
    boolean infinite;      // Is permanent
    boolean debuff;        // Is negative
    String statusIcon;     // UI icon path
}
```

Operations:

- `EffectOp.Add` - Effect added or updated
- `EffectOp.Remove` - Effect removed

**Source:** `com.hypixel.hytale.protocol.EntityEffectUpdate`

## Archivos Fuente

| Clase                          | Ruta                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `EffectControllerComponent`    | `com.hypixel.hytale.server.core.entity.effect.EffectControllerComponent`                                    |
| `ActiveEntityEffect`           | `com.hypixel.hytale.server.core.entity.effect.ActiveEntityEffect`                                           |
| `EntityEffect`                 | `com.hypixel.hytale.server.core.asset.type.entityeffect.config.EntityEffect`                                |
| `ApplicationEffects`           | `com.hypixel.hytale.server.core.asset.type.entityeffect.config.ApplicationEffects`                          |
| `MovementEffects`              | `com.hypixel.hytale.server.core.asset.modifiers.MovementEffects`                                            |
| `AbilityEffects`               | `com.hypixel.hytale.server.core.asset.type.entityeffect.config.AbilityEffects`                              |
| `OverlapBehavior`              | `com.hypixel.hytale.server.core.asset.type.entityeffect.config.OverlapBehavior`                             |
| `RemovalBehavior`              | `com.hypixel.hytale.server.core.asset.type.entityeffect.config.RemovalBehavior`                             |
| `LivingEntityEffectSystem`     | `com.hypixel.hytale.server.core.modules.entity.livingentity.LivingEntityEffectSystem`                       |
| `ApplyEffectInteraction`       | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.none.simple.ApplyEffectInteraction`  |
| `ClearEntityEffectInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.ClearEntityEffectInteraction` |
| `EffectConditionInteraction`   | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.none.EffectConditionInteraction`     |
| `ActionApplyEntityEffect`      | `com.hypixel.hytale.server.npc.corecomponents.combat.ActionApplyEntityEffect`                               |
