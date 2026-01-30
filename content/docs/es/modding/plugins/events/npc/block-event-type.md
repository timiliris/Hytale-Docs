---
id: block-event-type
title: BlockEventType
sidebar_label: BlockEventType
---

# BlockEventType

An enumeration that defines the types of block-related events that NPCs can listen and respond to. These event types are used by the NPC blackboard system to trigger AI behaviors when specific block interactions occur in the world.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.blackboard.view.event.block.BlockEventType` |
| **Type** | `enum` |
| **Implements** | `Supplier<String>` |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/block/BlockEventType.java:5` |

## Declaration

```java
public enum BlockEventType implements Supplier<String> {
   DAMAGE("On block damage"),
   DESTRUCTION("On block destruction"),
   INTERACTION("On block use interaction");

   public static final BlockEventType[] VALUES = values();
   private final String description;
```

## Enum Values

| Value | Description | Trigger Condition |
|-------|-------------|-------------------|
| `DAMAGE` | "On block damage" | Fired when a block takes damage from mining or attacks |
| `DESTRUCTION` | "On block destruction" | Fired when a block is completely destroyed |
| `INTERACTION` | "On block use interaction" | Fired when a player uses the interact action on a block |

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `VALUES` | `BlockEventType[]` | (static) | Cached array of all enum values for iteration |
| `description` | `String` | `get()` | Human-readable description of the event type |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `public String get()` | Returns the human-readable description of this event type |
| `values` | `public static BlockEventType[] values()` | Returns all enum values (standard Java enum method) |
| `valueOf` | `public static BlockEventType valueOf(String name)` | Returns the enum constant with the specified name |

## Usage Example

```java
// Iterate through all block event types
for (BlockEventType type : BlockEventType.VALUES) {
    logger.info("Block event type: " + type.name() + " - " + type.get());
}

// Handle different block events in NPC AI
public void handleBlockEvent(BlockEventType eventType, Vector3i position) {
    switch (eventType) {
        case DAMAGE:
            // Block is being damaged - NPC might investigate
            investigateBlockDamage(position);
            break;
        case DESTRUCTION:
            // Block was destroyed - update pathfinding
            onBlockDestroyed(position);
            break;
        case INTERACTION:
            // Player interacted with a block - NPC might react
            onBlockInteraction(position);
            break;
    }
}

// Configure NPC to react to block events
public void setupBlockEventListeners(NPCEntity npc) {
    // Make guard NPC alert when certain blocks are damaged
    npc.registerForBlockEvent(BlockEventType.DAMAGE, "alarm_block", this::onAlarmDamaged);

    // Make NPC react when doors are used
    npc.registerForBlockEvent(BlockEventType.INTERACTION, "door", this::onDoorUsed);
}

// Get description for editor UI
public String getBlockEventLabel(BlockEventType type) {
    return type.get(); // Returns "On block damage", "On block destruction", etc.
}
```

## Common Use Cases

- Creating guard NPCs that respond to block destruction
- Implementing alarm systems triggered by block damage
- Making NPCs react to players using doors or switches
- Building AI that investigates environmental changes
- Creating NPCs that respond to construction/destruction
- Implementing territorial AI that defends structures
- Building trap or puzzle mechanics with NPC responses

## Integration with BlockEventView

BlockEventType is used by `BlockEventView` to register and dispatch block events to listening NPCs:

```java
// BlockEventView processes these events
public class BlockEventView extends EventView<...> {
    public BlockEventView(@Nonnull World world) {
        // Register event handlers for player interactions
        this.eventRegistry.register(PlayerInteractEvent.class, world.getName(), this::onPlayerInteraction);

        // Set up event type registrations
        for (BlockEventType eventType : BlockEventType.VALUES) {
            this.entityMapsByEventType.put(eventType, new EventTypeRegistration<>(...));
        }
    }

    // Handle block damage from DamageBlockEvent
    public void onEntityDamageBlock(Ref<EntityStore> ref, DamageBlockEvent event) {
        if (!event.isCancelled()) {
            this.processDamagedBlock(ref, event.getBlockType().getId(),
                event.getTargetBlock(), BlockEventType.DAMAGE);
        }
    }

    // Handle block breaking from BreakBlockEvent
    public void onEntityBreakBlock(Ref<EntityStore> ref, BreakBlockEvent event) {
        if (!event.isCancelled()) {
            this.processDamagedBlock(ref, event.getBlockType().getId(),
                event.getTargetBlock(), BlockEventType.DESTRUCTION);
        }
    }
}
```

## Related Types

- [EntityEventType](./entity-event-type) - Similar enum for entity-related events
- [BlockEventView](./block-event-view) - View that processes block events
- [EventNotification](./event-notification) - Data class for event notifications

## Related Block Events

- [BreakBlockEvent](../block/break-block-event) - Plugin event for block breaking
- [DamageBlockEvent](../block/damage-block-event) - Plugin event for block damage
- [UseBlockEvent](../block/use-block-event) - Plugin event for block interactions

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/blackboard/view/event/block/BlockEventType.java:5`
