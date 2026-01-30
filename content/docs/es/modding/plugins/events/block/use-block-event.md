---
id: use-block-event
title: UseBlockEvent
sidebar_label: UseBlockEvent
---

# UseBlockEvent

> **Tested:** January 17, 2026 - Verified with doc-test plugin. All documented methods work correctly.

An abstract base event fired when a block is used/interacted with. This event has two inner classes: `UseBlockEvent.Pre` (cancellable, fires before the interaction) and `UseBlockEvent.Post` (non-cancellable, fires after the interaction). Use this event to handle block interactions like opening containers, activating mechanisms, or custom block behaviors.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.ecs.UseBlockEvent` |
| **Parent Class** | `EcsEvent` |
| **Cancellable** | No (base class), Yes (Pre inner class) |
| **ECS Event** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/UseBlockEvent.java:11` |

## Declaration

```java
public abstract class UseBlockEvent extends EcsEvent {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `interactionType` | `@Nonnull InteractionType` | `getInteractionType()` | The type of interaction being performed |
| `context` | `@Nonnull InteractionContext` | `getContext()` | Additional context about the interaction |
| `targetBlock` | `@Nonnull Vector3i` | `getTargetBlock()` | The position of the block being interacted with |
| `blockType` | `@Nonnull BlockType` | `getBlockType()` | The type of block being interacted with |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getInteractionType` | `@Nonnull public InteractionType getInteractionType()` | Returns the type of interaction (e.g., USE, ATTACK) |
| `getContext` | `@Nonnull public InteractionContext getContext()` | Returns the interaction context with additional details |
| `getTargetBlock` | `@Nonnull public Vector3i getTargetBlock()` | Returns the world position of the target block |
| `getBlockType` | `@Nonnull public BlockType getBlockType()` | Returns the type of block being used |

## Inner Classes

### UseBlockEvent.Pre

The `Pre` event fires **before** the block interaction is processed. This variant is **cancellable**.

| Property | Value |
|----------|-------|
| **Line Number** | 56 |
| **Cancellable** | Yes |
| **Implements** | `ICancellableEcsEvent` |

```java
public static final class Pre extends UseBlockEvent implements ICancellableEcsEvent {
    // Inherits all fields from UseBlockEvent
    // Adds cancellation capability

    public boolean isCancelled();
    public void setCancelled(boolean cancelled);
}
```

### UseBlockEvent.Post

The `Post` event fires **after** the block interaction has been processed. This variant is **not cancellable**.

| Property | Value |
|----------|-------|
| **Line Number** | 50 |
| **Cancellable** | No |

```java
public static final class Post extends UseBlockEvent {
    // Inherits all fields from UseBlockEvent
    // Fires after interaction completes
}
```

## Understanding ECS Events

**Important:** ECS events (Entity Component System events) work differently from regular `IEvent` events. They are part of Hytale's component-based architecture and are typically dispatched and handled through the ECS framework rather than the standard `EventBus`.

Key differences:
- ECS events extend `EcsEvent` or `CancellableEcsEvent` instead of implementing `IEvent`
- They are associated with entity components and systems
- Registration and handling may use different mechanisms than the standard event bus

## Usage Example

```java
// Note: ECS event registration may differ from standard IEvent registration
// The exact registration mechanism depends on how your plugin integrates with the ECS system

public class BlockInteractionPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // Register for Pre event to intercept/cancel interactions
        registerEcsEventHandler(UseBlockEvent.Pre.class, this::onBlockUsePre);

        // Register for Post event to react to completed interactions
        registerEcsEventHandler(UseBlockEvent.Post.class, this::onBlockUsePost);
    }

    private void onBlockUsePre(UseBlockEvent.Pre event) {
        // Get information about the interaction
        Vector3i position = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        InteractionType interactionType = event.getInteractionType();
        InteractionContext context = event.getContext();

        // Example: Prevent interaction with locked containers
        if (isLockedContainer(blockType, position)) {
            event.setCancelled(true);
            // Optionally send message to player
            return;
        }

        // Example: Restrict certain interactions based on permissions
        if (!hasInteractionPermission(context, blockType)) {
            event.setCancelled(true);
            return;
        }

        // Example: Log interaction attempts
        logInteractionAttempt(position, blockType, interactionType);
    }

    private void onBlockUsePost(UseBlockEvent.Post event) {
        // This fires after the interaction completed successfully
        Vector3i position = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        InteractionType interactionType = event.getInteractionType();

        // Example: Track container access
        if (isContainer(blockType)) {
            recordContainerAccess(position);
        }

        // Example: Trigger custom effects after using certain blocks
        if (isMagicalBlock(blockType)) {
            triggerMagicEffect(position);
        }

        // Example: Statistics tracking
        incrementBlockUseStatistic(blockType);
    }

    private boolean isLockedContainer(BlockType type, Vector3i position) {
        // Lock checking logic
        return false;
    }

    private boolean hasInteractionPermission(InteractionContext ctx, BlockType type) {
        // Permission checking logic
        return true;
    }

    private boolean isContainer(BlockType type) {
        // Check if block is a container (chest, barrel, etc.)
        return false;
    }

    private boolean isMagicalBlock(BlockType type) {
        // Check for magical block types
        return false;
    }

    private void logInteractionAttempt(Vector3i pos, BlockType type, InteractionType iType) {
        // Logging implementation
    }

    private void recordContainerAccess(Vector3i position) {
        // Container access tracking
    }

    private void triggerMagicEffect(Vector3i position) {
        // Custom effect implementation
    }

    private void incrementBlockUseStatistic(BlockType type) {
        // Statistics tracking
    }
}
```

## When This Event Fires

The `UseBlockEvent` fires when:

1. **Player right-clicks a block** - Standard block interaction
2. **Entity interacts with a block** - Mobs or other entities using blocks
3. **Programmatic interaction** - Code-triggered block usage

### Pre Event Timing

`UseBlockEvent.Pre` fires **before** any interaction logic runs:
- Before container GUIs open
- Before levers/buttons toggle
- Before doors open/close
- Before any block state changes

### Post Event Timing

`UseBlockEvent.Post` fires **after** the interaction completes:
- After container GUIs have been shown
- After mechanism states have changed
- After any block-related effects triggered

## Interaction Types

The `InteractionType` enum indicates what kind of interaction is occurring:

- **USE** - Standard right-click interaction
- **ATTACK** - Left-click/attack interaction
- Other types may be defined for specific interaction scenarios

## Interaction Context

The `InteractionContext` provides additional details about the interaction:

- Information about the interacting entity
- Hand/item being used
- Hit location on the block face
- Other contextual data

## Cancellation Behavior (Pre Event Only)

When `UseBlockEvent.Pre` is cancelled by calling `setCancelled(true)`:

- The block interaction does **not** occur
- Container GUIs do not open
- Block states do not change
- The `UseBlockEvent.Post` event does **not** fire
- The player/entity receives feedback that the action was blocked

This is useful for:
- Lock/protection systems for containers
- Permission-based interaction restrictions
- Custom interaction requirements
- Preventing specific block usage in certain contexts

## Event Flow

```
Entity attempts to use block
          |
          v
   UseBlockEvent.Pre
          |
    [Cancelled?]
     /        \
   Yes         No
    |           |
    v           v
 (stopped)  Interaction
             Executes
               |
               v
      UseBlockEvent.Post
               |
               v
          (complete)
```

## Related Events

- [BreakBlockEvent](./break-block-event) - Fired when a block is broken
- [PlaceBlockEvent](./place-block-event) - Fired when a block is placed
- [DamageBlockEvent](./damage-block-event) - Fired when a block takes damage

## Internal Details

### Where the Event is Fired

The `UseBlockEvent` is fired in `UseBlockInteraction.doInteraction()`:

**File:** `com/hypixel/hytale/server/core/modules/interaction/interaction/config/client/UseBlockInteraction.java`

```java
// Pre event (line 68-73)
UseBlockEvent.Pre event = new UseBlockEvent.Pre(type, context, targetBlock, blockType);
commandBuffer.invoke(ref, event);
if (event.isCancelled()) {
    context.getState().state = InteractionState.Failed;
    return;
}

// Post event (line 79-84)
UseBlockEvent.Post event = new UseBlockEvent.Post(type, context, targetBlock, blockType);
commandBuffer.invoke(ref, event);
```

### Cancellation Implementation

When `UseBlockEvent.Pre` is cancelled:
1. The interaction state is set to `InteractionState.Failed`
2. The method returns immediately
3. The block's `RootInteraction` is **never executed**
4. `UseBlockEvent.Post` is **never fired**

### Class Hierarchy

```
EcsEvent (abstract)
└── UseBlockEvent (abstract)
    ├── UseBlockEvent.Pre (final, implements ICancellableEcsEvent)
    └── UseBlockEvent.Post (final)
```

## Testing

To test this event with the doc-test plugin:

```
/doctest test-use-block-event
```

1. Run the command above
2. Find an interactable block (container, lever, door, etc.)
3. Right-click (use) the block
4. The event details should appear in chat, confirming both Pre and Post events fired

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/UseBlockEvent.java:11`

**Inner Classes:**
- `UseBlockEvent.Post` - Line 50
- `UseBlockEvent.Pre` - Line 56
