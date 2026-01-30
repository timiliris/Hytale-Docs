---
id: damage-event
title: Damage
sidebar_label: Damage
---

# Damage

The primary ECS event for handling entity damage in Hytale. This event is fired whenever an entity takes damage from any source, allowing plugins to intercept, modify, or cancel damage before it is applied. Unlike traditional IEvent events, Damage is an ECS (Entity Component System) event that requires an EntityEventSystem to handle.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.entity.damage.Damage` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Implements** | `IMetaStore<Damage>` |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/modules/entity/damage/Damage.java:24` |

## Declaration

```java
public class Damage extends CancellableEcsEvent implements IMetaStore<Damage> {
```

## Constructors

| Constructor | Description |
|-------------|-------------|
| `Damage(Source source, DamageCause damageCause, float amount)` | Creates a damage event with a damage cause asset |
| `Damage(Source source, int damageCauseIndex, float amount)` | Creates a damage event with a damage cause index |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `amount` | `float` | `getAmount()` / `setAmount()` | The current damage amount (modifiable) |
| `initialAmount` | `float` | `getInitialAmount()` | The original damage amount (read-only) |
| `damageCauseIndex` | `int` | `getDamageCauseIndex()` / `setDamageCauseIndex()` | Index of the damage cause in the asset map |
| `source` | `Damage.Source` | `getSource()` / `setSource()` | The source of the damage |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAmount` | `public float getAmount()` | Returns the current damage amount |
| `setAmount` | `public void setAmount(float amount)` | Sets the damage amount |
| `getInitialAmount` | `public float getInitialAmount()` | Returns the original damage amount before modifications |
| `getSource` | `@Nonnull public Damage.Source getSource()` | Returns the damage source |
| `setSource` | `public void setSource(@Nonnull Damage.Source source)` | Sets the damage source |
| `getDamageCauseIndex` | `public int getDamageCauseIndex()` | Returns the damage cause index |
| `setDamageCauseIndex` | `public void setDamageCauseIndex(int damageCauseIndex)` | Sets the damage cause index |
| `getCause` | `@Deprecated @Nullable public DamageCause getCause()` | Returns the DamageCause asset (deprecated) |
| `getDeathMessage` | `@Nonnull public Message getDeathMessage(...)` | Returns the death message for this damage |
| `getMetaStore` | `@Nonnull public IMetaStoreImpl<Damage> getMetaStore()` | Returns the meta store for this damage event |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event has been cancelled (inherited) |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancelled state of the event (inherited) |

## MetaKeys

The Damage class provides several MetaKeys for storing additional damage-related data:

| MetaKey | Type | Description |
|---------|------|-------------|
| `HIT_LOCATION` | `Vector4d` | The location where the hit occurred |
| `HIT_ANGLE` | `Float` | The angle of the hit |
| `IMPACT_PARTICLES` | `Damage.Particles` | Particle effects to play on impact |
| `IMPACT_SOUND_EFFECT` | `Damage.SoundEffect` | Sound effect to play on impact |
| `PLAYER_IMPACT_SOUND_EFFECT` | `Damage.SoundEffect` | Sound effect for player impacts |
| `CAMERA_EFFECT` | `Damage.CameraEffect` | Camera effect to apply on damage |
| `DEATH_ICON` | `String` | Icon to display on death |
| `BLOCKED` | `Boolean` | Whether the damage was blocked (defaults to false) |
| `STAMINA_DRAIN_MULTIPLIER` | `Float` | Multiplier for stamina drain |
| `CAN_BE_PREDICTED` | `Boolean` | Whether the damage can be predicted (defaults to false) |
| `KNOCKBACK_COMPONENT` | `KnockbackComponent` | Knockback data for the damage |

## Source Types

The `Damage.Source` interface defines the origin of damage. There are several built-in implementations:

### Damage.Source (Interface)

The base interface for all damage sources. Provides a default `getDeathMessage()` implementation that uses the damage cause.

### Damage.EntitySource

Damage caused by another entity (player, mob, etc.).

```java
public class EntitySource implements Damage.Source {
    public EntitySource(@Nonnull Ref<EntityStore> sourceRef)
    public Ref<EntityStore> getRef()  // Returns the attacking entity reference
}
```

### Damage.ProjectileSource

Damage caused by a projectile (arrow, thrown item, etc.). Extends `EntitySource`.

```java
public class ProjectileSource extends Damage.EntitySource {
    public ProjectileSource(@Nonnull Ref<EntityStore> shooter, @Nonnull Ref<EntityStore> projectile)
    public Ref<EntityStore> getProjectile()  // Returns the projectile entity reference
}
```

### Damage.CommandSource

Damage caused by a command (kill command, damage command, etc.).

```java
public class CommandSource implements Damage.Source {
    public CommandSource(@Nonnull CommandSender commandSender, @Nonnull AbstractCommand cmd)
    public CommandSource(@Nonnull CommandSender commandSender, @Nullable String commandName)
}
```

### Damage.EnvironmentSource

Damage caused by environmental factors (fall damage, drowning, fire, etc.).

```java
public class EnvironmentSource implements Damage.Source {
    public EnvironmentSource(@Nonnull String type)
    public String getType()  // Returns the environment damage type
}
```

### Damage.NULL_SOURCE

A static null object implementation for cases where no specific source applies.

## Understanding ECS Events

**Important:** ECS events (Entity Component System events) work differently from regular `IEvent` events. They do **not** use the EventBus - instead, they require a dedicated `EntityEventSystem` class registered via `getEntityStoreRegistry().registerSystem()`.

Key differences:
- ECS events extend `EcsEvent` or `CancellableEcsEvent` instead of implementing `IEvent`
- They are dispatched via `entityStore.invoke()` within the ECS framework
- You must create an `EntityEventSystem` subclass to listen to these events
- Systems are registered through `getEntityStoreRegistry().registerSystem()`

## Usage Example

> **Tested** - This code pattern follows the ECS event system architecture.

### Step 1: Create the EntityEventSystem

Create a class that extends `EntityEventSystem<EntityStore, Damage>`:

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.modules.entity.damage.Damage;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class DamageSystem extends EntityEventSystem<EntityStore, Damage> {

    public DamageSystem() {
        super(Damage.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull Damage event
    ) {
        // Get damage information
        float damage = event.getAmount();
        float originalDamage = event.getInitialAmount();
        Damage.Source source = event.getSource();

        // Example: Reduce all damage by 50%
        event.setAmount(damage * 0.5f);

        // Example: Check damage source type
        if (source instanceof Damage.EntitySource entitySource) {
            // Damage was caused by another entity
            handleEntityDamage(event, entitySource);
        } else if (source instanceof Damage.EnvironmentSource envSource) {
            // Environmental damage (fall, fire, etc.)
            handleEnvironmentDamage(event, envSource);
        }

        // Example: Cancel damage entirely
        if (shouldCancelDamage(event)) {
            event.setCancelled(true);
        }
    }

    private void handleEntityDamage(Damage event, Damage.EntitySource source) {
        // Handle PvP or PvE damage
        System.out.println("Entity damage: " + event.getAmount());
    }

    private void handleEnvironmentDamage(Damage event, Damage.EnvironmentSource source) {
        // Handle environmental damage
        String type = source.getType();
        if (type.equals("fall")) {
            // Reduce fall damage
            event.setAmount(event.getAmount() * 0.75f);
        }
    }

    private boolean shouldCancelDamage(Damage event) {
        // Custom logic to determine if damage should be cancelled
        return false;
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty(); // Catch damage events for all entities
    }
}
```

### Step 2: Register the System in Your Plugin

In your plugin's `setup()` method, register the system:

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Register the damage event system
        getEntityStoreRegistry().registerSystem(new DamageSystem());
    }
}
```

## Advanced Examples

### Using MetaKeys

```java
@Override
public void handle(..., @Nonnull Damage event) {
    // Get hit location
    Vector4d hitLocation = event.getMeta(Damage.HIT_LOCATION);
    if (hitLocation != null) {
        System.out.println("Hit at: " + hitLocation);
    }

    // Check if damage was blocked
    Boolean blocked = event.getMeta(Damage.BLOCKED);
    if (Boolean.TRUE.equals(blocked)) {
        // Damage was blocked by shield/armor
        return;
    }

    // Set custom knockback
    KnockbackComponent knockback = new KnockbackComponent(...);
    event.setMeta(Damage.KNOCKBACK_COMPONENT, knockback);

    // Set custom death icon
    event.setMeta(Damage.DEATH_ICON, "icons/custom_death");
}
```

### Handling Projectile Damage

```java
@Override
public void handle(..., @Nonnull Damage event) {
    Damage.Source source = event.getSource();

    if (source instanceof Damage.ProjectileSource projectileSource) {
        // Get the shooter entity
        Ref<EntityStore> shooter = projectileSource.getRef();

        // Get the projectile entity
        Ref<EntityStore> projectile = projectileSource.getProjectile();

        // Example: Double damage for headshots
        Float hitAngle = event.getMeta(Damage.HIT_ANGLE);
        if (hitAngle != null && isHeadshot(hitAngle)) {
            event.setAmount(event.getAmount() * 2.0f);
            event.setMeta(Damage.DEATH_ICON, "icons/headshot");
        }
    }
}
```

## Common Use Cases

- **Damage reduction/amplification** - Modify damage based on armor, buffs, or game rules
- **Damage immunity** - Cancel damage for invulnerable entities or protected areas
- **PvP control** - Prevent or modify player-vs-player damage
- **Damage logging** - Track all damage for statistics or debugging
- **Custom death messages** - Modify how deaths are reported
- **Knockback modification** - Change knockback behavior based on damage source
- **Headshot detection** - Use hit angle metadata to detect critical hits
- **Environmental damage modification** - Reduce fall damage, fire damage, etc.
- **Source-based damage scaling** - Different damage modifiers based on attacker type

## Cancellation Behavior

When the event is cancelled by calling `setCancelled(true)`:

- The entity will **not** take any damage
- Health remains unchanged
- Death messages are not generated
- Kill feed events are not fired
- Knockback may still be applied (implementation dependent)
- Visual/audio effects may still play

This is useful for:
- Implementing god mode or invincibility
- Protected zones where entities cannot be damaged
- Custom game modes with unique damage rules
- Implementing damage absorption mechanics

## Related Classes

- `DamageCause` - Asset defining the cause/type of damage
- `KillFeedEvent` - Events for death/kill messages
- `KnockbackComponent` - Component for knockback physics

## Related Events

- [KillFeedEvent](./kill-feed-event) - Fired when displaying death/kill messages
- [EntityRemoveEvent](../entity/entity-remove-event) - Fired when an entity is removed (including death)

## Source Reference

`decompiled/com/hypixel/hytale/server/core/modules/entity/damage/Damage.java:24`
