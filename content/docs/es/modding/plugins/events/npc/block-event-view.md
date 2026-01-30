---
id: block-event-view
title: BlockEventView
sidebar_label: BlockEventView
---

# BlockEventView

A blackboard view component that manages block-related event notifications for NPCs. This class handles the registration, filtering, and dispatching of block events (damage, destruction, interaction) to NPCs that are configured to listen for them.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.blackboard.view.event.block.BlockEventView` |
| **Parent Class** | `EventView<BlockEventView, BlockEventType, EventNotification>` |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/block/BlockEventView.java:26` |

## Declaration

```java
public class BlockEventView extends EventView<BlockEventView, BlockEventType, EventNotification> {
    public BlockEventView(@Nonnull World world) {
        super(BlockEventType.class, BlockEventType.VALUES, new EventNotification(), world);
        this.eventRegistry.register(PlayerInteractEvent.class, world.getName(), this::onPlayerInteraction);

        for (BlockEventType eventType : BlockEventType.VALUES) {
            this.entityMapsByEventType.put(
                eventType,
                new EventTypeRegistration<>(
                    eventType,
                    (set, blockId) -> BlockSetModule.getInstance().blockInSet(set, blockId),
                    NPCEntity::notifyBlockChange
                )
            );
        }
    }
```

## Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `world` | `World` | The world this view is associated with |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getUpdatedView` | `public BlockEventView getUpdatedView(@Nonnull Ref<EntityStore> ref, @Nonnull ComponentAccessor<EntityStore> componentAccessor)` | Returns the view for the entity's current world |
| `initialiseEntity` | `public void initialiseEntity(@Nonnull Ref<EntityStore> ref, @Nonnull NPCEntity npcComponent)` | Registers an NPC's block event listeners |
| `onEvent` | `protected void onEvent(int senderTypeId, double x, double y, double z, Ref<EntityStore> initiator, Ref<EntityStore> skip, @Nonnull ComponentAccessor<EntityStore> componentAccessor, BlockEventType type)` | Processes and dispatches a block event (adds 0.5 offset to center on block) |
| `onEntityDamageBlock` | `public void onEntityDamageBlock(@Nonnull Ref<EntityStore> ref, @Nonnull DamageBlockEvent event)` | Handles block damage events |
| `onEntityBreakBlock` | `public void onEntityBreakBlock(@Nonnull Ref<EntityStore> ref, @Nonnull BreakBlockEvent event)` | Handles block destruction events |

## Key Features

### Block Set Filtering

Events are filtered based on block sets using the BlockSetModule:

```java
(set, blockId) -> BlockSetModule.getInstance().blockInSet(set, blockId)
```

### Position Centering

Block events are centered on the block position by adding 0.5 to each coordinate:

```java
protected void onEvent(...) {
    super.onEvent(senderTypeId, x + 0.5, y + 0.5, z + 0.5, initiator, skip, componentAccessor, type);
}
```

### Game Mode Filtering

Creative mode players can optionally bypass NPC detection:

```java
if (playerComponent.getGameMode() == GameMode.Creative) {
    PlayerSettings playerSettingsComponent = store.getComponent(initiatorRef, PlayerSettings.getComponentType());
    if (playerSettingsComponent == null || !playerSettingsComponent.creativeSettings().allowNPCDetection()) {
        return; // Skip notification in creative mode
    }
}
```

## Usage Example

```java
// The BlockEventView is typically managed by the Blackboard system
Blackboard blackboard = componentAccessor.getResource(Blackboard.getResourceType());
BlockEventView blockView = blackboard.getView(BlockEventView.class, ref, componentAccessor);

// Initialize an NPC's block event listeners
public void setupNpcBlockEvents(Ref<EntityStore> ref, NPCEntity npc, BlockEventView view) {
    view.initialiseEntity(ref, npc);
}

// Hook into block damage events (called from game systems)
public void onBlockDamaged(Ref<EntityStore> playerRef, DamageBlockEvent event) {
    BlockEventView view = getBlockEventView(event.getWorld());
    view.onEntityDamageBlock(playerRef, event);
}

// Hook into block break events
public void onBlockBroken(Ref<EntityStore> playerRef, BreakBlockEvent event) {
    BlockEventView view = getBlockEventView(event.getWorld());
    view.onEntityBreakBlock(playerRef, event);
}
```

## Event Flow

1. **Event Trigger**: A block event occurs (damage, destruction, or interaction)
2. **Event Reception**: `onEntityDamageBlock`, `onEntityBreakBlock`, or `onPlayerInteraction` is called
3. **Cancellation Check**: Cancelled events are ignored
4. **Game Mode Check**: Creative mode may bypass NPC detection
5. **Block ID Lookup**: Block type ID is resolved from the block at the position
6. **Event Processing**: `onEvent` is called with centered coordinates
7. **NPC Filtering**: Events are filtered by block sets
8. **Notification**: Matching NPCs receive the event via `NPCEntity::notifyBlockChange`

## Block Event Handling

### DamageBlockEvent Processing

```java
public void onEntityDamageBlock(Ref<EntityStore> ref, DamageBlockEvent event) {
    if (!event.isCancelled()) {
        this.processDamagedBlock(ref, event.getBlockType().getId(),
            event.getTargetBlock(), BlockEventType.DAMAGE);
    }
}
```

### BreakBlockEvent Processing

```java
public void onEntityBreakBlock(Ref<EntityStore> ref, BreakBlockEvent event) {
    if (!event.isCancelled()) {
        this.processDamagedBlock(ref, event.getBlockType().getId(),
            event.getTargetBlock(), BlockEventType.DESTRUCTION);
    }
}
```

### Player Interaction Processing

```java
private void onPlayerInteraction(PlayerInteractEvent event) {
    // ... game mode checks ...
    Vector3i blockPosition = event.getTargetBlock();
    if (blockPosition != null && event.getActionType() == InteractionType.Use) {
        World world = store.getExternalData().getWorld();
        int blockId = world.getBlock(blockPosition.x, blockPosition.y, blockPosition.z);
        this.onEvent(blockId, targetBlock.x, targetBlock.y, targetBlock.z, ref, null,
                     store, BlockEventType.INTERACTION);
    }
}
```

## Common Use Cases

- Creating guard NPCs that respond to structure damage
- Implementing alarm blocks that alert nearby NPCs
- Making NPCs react to door/lever interactions
- Building AI that responds to environmental destruction
- Implementing territorial defense behaviors
- Creating puzzle mechanics with NPC responses

## Related Types

- [BlockEventType](./block-event-type) - Enum of block event types
- [EntityEventView](./entity-event-view) - Similar view for entity events
- [EventNotification](./event-notification) - Event notification data
- [EventView](./event-view) - Base class for event views

## Related Block Events

- [BreakBlockEvent](../block/break-block-event) - Plugin event for block breaking
- [DamageBlockEvent](../block/damage-block-event) - Plugin event for block damage
- [UseBlockEvent](../block/use-block-event) - Plugin event for block interactions

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/block/BlockEventView.java:26`
