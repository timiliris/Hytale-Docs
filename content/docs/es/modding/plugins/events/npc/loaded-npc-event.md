---
id: loaded-npc-event
title: LoadedNPCEvent
sidebar_label: LoadedNPCEvent
---

# LoadedNPCEvent

Fired when an individual NPC definition is loaded from asset files. This event provides access to the NPC's builder information for each spawnable NPC type as it becomes available.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.spawning.LoadedNPCEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/spawning/LoadedNPCEvent.java` |

## Declaration

```java
public class LoadedNPCEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `builderInfo` | `BuilderInfo` | `getBuilderInfo()` | The builder information for the loaded NPC |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getBuilderInfo` | `public BuilderInfo getBuilderInfo()` | Returns the builder information containing NPC definition data |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of the event with the builder info |

## Validation

The event constructor validates that the `BuilderInfo`:
- Must not be null
- Must contain a builder that implements `ISpawnableWithModel`

If validation fails, an `IllegalArgumentException` is thrown.

## Usage Example

```java
import com.hypixel.hytale.server.spawning.LoadedNPCEvent;
import com.hypixel.hytale.server.npc.asset.builder.BuilderInfo;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class NPCLoadTrackerPlugin extends PluginBase {

    private final Set<String> trackedNPCs = new HashSet<>();

    @Override
    public void onEnable() {
        EventBus.register(LoadedNPCEvent.class, this::onNPCLoaded, EventPriority.NORMAL);
    }

    private void onNPCLoaded(LoadedNPCEvent event) {
        BuilderInfo builderInfo = event.getBuilderInfo();

        // Log each NPC as it loads
        getLogger().info("NPC loaded: " + builderInfo.toString());

        // Track specific NPC types
        String npcIdentifier = builderInfo.getIdentifier();
        trackedNPCs.add(npcIdentifier);

        // Perform per-NPC initialization
        initializeNPCExtensions(builderInfo);
    }

    private void initializeNPCExtensions(BuilderInfo builderInfo) {
        // Add custom behavior or data to the NPC definition
        // This runs before the NPC can be spawned in the world
    }

    public Set<String> getTrackedNPCs() {
        return Collections.unmodifiableSet(trackedNPCs);
    }
}
```

## When This Event Fires

The `LoadedNPCEvent` is fired when:

1. **Individual NPC asset loading** - When each NPC definition file is parsed and loaded
2. **During startup sequence** - Before `AllNPCsLoadedEvent` fires
3. **Asset hot-reload** - When individual NPC definitions are reloaded

The event fires **for each NPC type** as it is loaded, allowing handlers to:
- Process NPCs incrementally as they load
- Validate individual NPC definitions
- Extend NPC configurations with custom data
- Log loading progress

## Understanding BuilderInfo

The `BuilderInfo` object contains:
- **Builder**: The factory object for creating NPC instances (must implement `ISpawnableWithModel`)
- **Identifier**: The unique string identifier for this NPC type
- **Configuration**: All loaded configuration data from the NPC asset file

## Use Cases

- **Progressive Loading**: Handle NPCs as they load rather than waiting for all
- **Validation**: Check each NPC definition as it loads
- **Extension**: Attach custom plugin data to NPC types
- **Debugging**: Track individual NPC loading for troubleshooting
- **Dependency Check**: Verify specific NPCs load before others

## Related Events

- [AllNPCsLoadedEvent](./all-npcs-loaded-event) - Fired after all NPCs have been loaded
- [LoadAssetEvent](../asset/load-asset-event) - General asset loading event

## Source Reference

`decompiled/com/hypixel/hytale/server/spawning/LoadedNPCEvent.java`
