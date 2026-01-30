---
id: damage-block-event
title: DamageBlockEvent
sidebar_label: DamageBlockEvent
---

# DamageBlockEvent

Fired when a block takes damage (during the mining/breaking process). This event allows plugins to intercept block damage, modify damage values, or cancel the damage entirely. Unlike `BreakBlockEvent`, this fires during the breaking process, not when the block is fully destroyed.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.DamageBlockEvent` |
| **Parent Class** | `CancellableEcsEvent` |
| **Cancellable** | Yes |
| **ECS Event** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DamageBlockEvent.java:10` |

## Declaration

```java
public class DamageBlockEvent extends CancellableEcsEvent {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | The item/tool being used to damage the block (null if no item in hand) |
| `targetBlock` | `@Nonnull Vector3i` | `getTargetBlock()` | The position of the block being damaged |
| `blockType` | `@Nonnull BlockType` | `getBlockType()` | The type of block being damaged |
| `currentDamage` | `float` | `getCurrentDamage()` | The accumulated damage on the block before this hit |
| `damage` | `float` | `getDamage()` | The amount of damage being applied in this event |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Returns the tool/item used to damage the block, or null if no item in hand |
| `getTargetBlock` | `@Nonnull public Vector3i getTargetBlock()` | Returns the world position of the target block |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Changes the target block position (line 38) |
| `getBlockType` | `@Nonnull public BlockType getBlockType()` | Returns the type of block being damaged |
| `getCurrentDamage` | `public float getCurrentDamage()` | Returns the damage already accumulated on the block |
| `getDamage` | `public float getDamage()` | Returns the damage amount being applied |
| `setDamage` | `public void setDamage(float damage)` | Modifies the damage amount to be applied (line 55) |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event has been cancelled (inherited) |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Sets the cancelled state of the event (inherited) |

## Understanding ECS Events

**Important:** ECS events (Entity Component System events) work differently from regular `IEvent` events. They are part of Hytale's component-based architecture and are typically dispatched and handled through the ECS framework rather than the standard `EventBus`.

Key differences:
- ECS events extend `EcsEvent` or `CancellableEcsEvent` instead of implementing `IEvent`
- They are associated with entity components and systems
- Registration and handling may use different mechanisms than the standard event bus

## Usage Example

> **Tested:** January 17, 2026 - Verified with doc-test plugin. All documented methods work correctly.

**Important:** ECS events require a dedicated `EntityEventSystem` class registered via `getEntityStoreRegistry().registerSystem()`. They do **not** use the standard `EventBus.register()` method.

### Step 1: Create the EntityEventSystem

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.DamageBlockEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class DamageBlockSystem extends EntityEventSystem<EntityStore, DamageBlockEvent> {

    public DamageBlockSystem() {
        super(DamageBlockEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull DamageBlockEvent event
    ) {
        int x = event.getTargetBlock().getX();
        int y = event.getTargetBlock().getY();
        int z = event.getTargetBlock().getZ();
        BlockType blockType = event.getBlockType();
        float currentDamage = event.getCurrentDamage();
        float incomingDamage = event.getDamage();

        // Example: Make bedrock indestructible
        if (isIndestructible(blockType)) {
            event.setCancelled(true);
            return;
        }

        // Example: Mining fatigue - slow down mining by 50%
        event.setDamage(incomingDamage * 0.5f);

        System.out.println("Block damaged at [" + x + "," + y + "," + z + "]");
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty(); // Catch events from all entities
    }

    private boolean isIndestructible(BlockType blockType) {
        return false; // Implement your logic
    }
}
```

### Step 2: Register the System in Your Plugin

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getEntityStoreRegistry().registerSystem(new DamageBlockSystem());
    }
}
```

## When This Event Fires

The `DamageBlockEvent` is fired when:

1. **Player mines a block** - Each tick/hit while a player is actively mining a block
2. **Entity damages a block** - When entities cause incremental damage to blocks
3. **Progressive block destruction** - Any system that applies gradual damage to blocks

The event fires **during** the mining process, potentially multiple times before the block breaks:
- First hit: `currentDamage = 0`, `damage = initial hit value`
- Subsequent hits: `currentDamage = accumulated`, `damage = new hit value`
- When `currentDamage + damage >= block hardness`, the block breaks

## Damage Flow

```
Mining Start
    |
    v
DamageBlockEvent (currentDamage: 0, damage: X)
    |
    v
[If not cancelled] -> Block accumulates damage
    |
    v
DamageBlockEvent (currentDamage: X, damage: Y)
    |
    v
[Repeat until total damage >= hardness]
    |
    v
BreakBlockEvent -> Block destroyed
```

## Cancellation Behavior

When the event is cancelled by calling `setCancelled(true)`:

- The damage is **not** applied to the block
- The block's accumulated damage remains unchanged
- Mining progress does not advance
- The player/entity still performs the mining animation (client-side)

This is useful for:
- Creating invulnerable blocks
- Implementing mining permissions
- Custom mining mechanics
- Temporary block protection

## Damage Modification

Using `setDamage(float)` allows you to:

- **Increase damage** - Speed up mining (values > original)
- **Decrease damage** - Slow down mining (values < original)
- **Set to zero** - Effectively prevent mining progress without cancelling
- **Implement tool bonuses** - Enhance certain tool/block combinations

### Example Damage Scenarios

```java
// Double mining speed
event.setDamage(event.getDamage() * 2.0f);

// Half mining speed (mining fatigue)
event.setDamage(event.getDamage() * 0.5f);

// Fixed damage regardless of tool
event.setDamage(1.0f);

// Progressive damage based on accumulated damage
float bonus = 1.0f + (event.getCurrentDamage() * 0.1f);
event.setDamage(event.getDamage() * bonus);
```

## Related Events

- [BreakBlockEvent](./break-block-event) - Fired when a block is fully broken
- [PlaceBlockEvent](./place-block-event) - Fired when a block is placed
- [UseBlockEvent](./use-block-event) - Fired when a block is interacted with

## Testing

To test this event with the doc-test plugin:

1. Run `/doctest test-damage-block-event`
2. Start mining any block (hold left click)
3. The event details will be displayed in chat

**Expected output:**
- `itemInHand`: The tool you're using (or null if bare hands)
- `targetBlock`: Position [x, y, z] of the block
- `blockType`: The type of block being mined
- `currentDamage`: Accumulated damage (0 on first hit)
- `damage`: Damage being applied this tick
- `isCancelled`: false (unless another plugin cancelled it)

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/DamageBlockEvent.java:10`
