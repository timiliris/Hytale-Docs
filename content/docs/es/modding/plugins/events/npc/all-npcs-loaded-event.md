---
id: all-npcs-loaded-event
title: AllNPCsLoadedEvent
sidebar_label: AllNPCsLoadedEvent
---

# AllNPCsLoadedEvent

Fired when all NPC definitions have been loaded from asset files. This event provides access to the complete map of NPC builder information, allowing plugins to modify, extend, or react to the loaded NPC data.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.npc.AllNPCsLoadedEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/npc/AllNPCsLoadedEvent.java` |

## Declaration

```java
public class AllNPCsLoadedEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `allNPCs` | `Int2ObjectMap<BuilderInfo>` | `getAllNPCs()` | Unmodifiable map of all registered NPC definitions by their integer ID |
| `loadedNPCs` | `Int2ObjectMap<BuilderInfo>` | `getLoadedNPCs()` | Unmodifiable map of NPCs that were loaded in this loading cycle |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAllNPCs` | `@Nonnull public Int2ObjectMap<BuilderInfo> getAllNPCs()` | Returns an unmodifiable map containing all registered NPC builder information |
| `getLoadedNPCs` | `@Nonnull public Int2ObjectMap<BuilderInfo> getLoadedNPCs()` | Returns an unmodifiable map of NPCs loaded in this specific loading operation |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of the event with both NPC maps |

## Usage Example

```java
import com.hypixel.hytale.server.npc.AllNPCsLoadedEvent;
import com.hypixel.hytale.server.npc.asset.builder.BuilderInfo;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;
import it.unimi.dsi.fastutil.ints.Int2ObjectMap;

public class NPCRegistryPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(AllNPCsLoadedEvent.class, this::onAllNPCsLoaded, EventPriority.NORMAL);
    }

    private void onAllNPCsLoaded(AllNPCsLoadedEvent event) {
        Int2ObjectMap<BuilderInfo> allNPCs = event.getAllNPCs();
        Int2ObjectMap<BuilderInfo> loadedNPCs = event.getLoadedNPCs();

        getLogger().info("Total NPCs registered: " + allNPCs.size());
        getLogger().info("NPCs loaded this cycle: " + loadedNPCs.size());

        // Iterate through all loaded NPCs
        for (Int2ObjectMap.Entry<BuilderInfo> entry : allNPCs.int2ObjectEntrySet()) {
            int npcId = entry.getIntKey();
            BuilderInfo builderInfo = entry.getValue();

            // Process each NPC definition
            processNPCDefinition(npcId, builderInfo);
        }

        // Validate custom NPC requirements
        validateCustomNPCs(allNPCs);
    }

    private void processNPCDefinition(int npcId, BuilderInfo builderInfo) {
        // Custom NPC processing logic
        getLogger().debug("Processing NPC ID: " + npcId);
    }

    private void validateCustomNPCs(Int2ObjectMap<BuilderInfo> allNPCs) {
        // Verify all required NPCs are present
        // Useful for game modes that require specific NPCs
    }
}
```

## When This Event Fires

The `AllNPCsLoadedEvent` is fired when:

1. **Server startup** - After all NPC asset files have been parsed and loaded
2. **Asset reload** - When NPC definitions are reloaded (such as during hot-reload in development)

The event fires **after** all NPC definitions are available, allowing handlers to:
- Access the complete NPC registry
- Validate required NPCs exist
- Cache NPC information for quick lookup
- Log statistics about loaded NPCs

## Understanding BuilderInfo

The `BuilderInfo` class contains the configuration data for an NPC type, including:
- Builder pattern information for constructing NPC instances
- Model and animation references
- Behavior tree definitions
- Component configurations

## Use Cases

- **NPC Validation**: Ensure all required NPCs for a game mode are loaded
- **Custom Spawning**: Build spawn tables based on loaded NPC types
- **Statistics**: Track and log NPC registry information
- **Integration**: Connect external systems that need NPC data
- **Debugging**: Verify NPC definitions during development

## Related Events

- [LoadedNPCEvent](./loaded-npc-event) - Fired for each individual NPC when it is loaded
- [AllWorldsLoadedEvent](../world/all-worlds-loaded-event) - Fired when all worlds have been loaded

## Source Reference

`decompiled/com/hypixel/hytale/server/npc/AllNPCsLoadedEvent.java`
