---
id: audio-system
title: Audio System
sidebar_label: Audio System
sidebar_position: 20
description: Complete documentation of the Hytale audio system for playing sounds, managing music, and ambient audio via plugins
---

# Audio System

The Audio System in Hytale provides a comprehensive framework for playing sounds, managing music, handling ambient audio, and synchronizing audio across the network. The system supports 2D (UI/global) sounds, 3D positional audio, and entity-attached sounds.

## Overview

The audio system consists of several key components:

- **SoundEvent** - Defines a playable sound with volume, pitch, and layer configuration
- **SoundCategory** - Categorizes sounds (Music, Ambient, SFX, UI)
- **AudioCategory** - Custom audio categories with configurable volume
- **SoundSet** - Groups of related sounds for materials and interactions
- **AmbienceFX** - Ambient soundscapes tied to environments
- **SoundUtil** - Utility class for playing sounds from server code

## Sound Categories

The `SoundCategory` enum defines the primary audio channels:

```java
package com.hypixel.hytale.protocol;

public enum SoundCategory {
    Music(0),    // Background music
    Ambient(1),  // Environmental/ambient sounds
    SFX(2),      // Sound effects (footsteps, combat, etc.)
    UI(3);       // User interface sounds
}
```

**Source:** `com.hypixel.hytale.protocol.SoundCategory`

## SoundEvent

`SoundEvent` is the core asset type for defining playable sounds:

```java
package com.hypixel.hytale.server.core.asset.type.soundevent.config;

public class SoundEvent {
    public static final int EMPTY_ID = 0;
    public static final String EMPTY = "EMPTY";

    // Get asset store for sound events
    public static IndexedLookupTableAssetMap<String, SoundEvent> getAssetMap();

    // Properties
    public String getId();
    public float getVolume();                    // Linear gain (1.0 = 0dB)
    public float getPitch();                     // Linear pitch (1.0 = normal)
    public float getMusicDuckingVolume();        // Music volume reduction when playing
    public float getAmbientDuckingVolume();      // Ambient volume reduction when playing
    public float getStartAttenuationDistance();  // Distance where falloff begins (blocks)
    public float getMaxDistance();               // Maximum audible distance (blocks)
    public int getMaxInstance();                 // Max concurrent instances
    public boolean getPreventSoundInterruption(); // Prevent interruption by other sounds
    public SoundEventLayer[] getLayers();        // Sound layers
    public String getAudioCategoryId();          // Custom audio category
    public int getAudioCategoryIndex();          // Audio category index
}
```

### SoundEvent Configuration

Sound events are defined in JSON:

```json
{
    "Volume": 0.0,
    "Pitch": 0.0,
    "MusicDuckingVolume": 0.0,
    "AmbientDuckingVolume": 0.0,
    "StartAttenuationDistance": 2.0,
    "MaxDistance": 16.0,
    "MaxInstance": 50,
    "PreventSoundInterruption": false,
    "AudioCategory": "custom_category",
    "Layers": [
        {
            "Volume": 0.0,
            "StartDelay": 0.0,
            "Looping": false,
            "Probability": 100,
            "Files": [
                "sounds/effect1.ogg",
                "sounds/effect2.ogg"
            ],
            "RandomSettings": {
                "MinVolume": -3.0,
                "MaxVolume": 3.0,
                "MinPitch": -2.0,
                "MaxPitch": 2.0,
                "MaxStartOffset": 0.0
            }
        }
    ]
}
```

| Property | Type | Description |
|----------|------|-------------|
| `Volume` | Float | Volume adjustment in decibels (-100 to 10 dB) |
| `Pitch` | Float | Pitch adjustment in semitones (-12 to 12) |
| `MusicDuckingVolume` | Float | Music volume reduction in dB (-100 to 0) |
| `AmbientDuckingVolume` | Float | Ambient volume reduction in dB (-100 to 0) |
| `StartAttenuationDistance` | Float | Distance where volume falloff begins (blocks) |
| `MaxDistance` | Float | Maximum audible distance (blocks) |
| `MaxInstance` | Integer | Maximum concurrent instances (1-100) |
| `PreventSoundInterruption` | Boolean | Prevent other sounds from interrupting |
| `AudioCategory` | String | Custom audio category ID |
| `Layers` | Array | Sound layers (see below) |

**Source:** `com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent`

## SoundEventLayer

Each sound event can have multiple layers for complex audio:

```java
package com.hypixel.hytale.protocol;

public class SoundEventLayer {
    public float volume;                        // Layer volume
    public float startDelay;                    // Delay before playing
    public boolean looping;                     // Loop the sound
    public int probability;                     // Play probability (0-100)
    public float probabilityRerollDelay;        // Delay between probability checks
    public int roundRobinHistorySize;           // Round-robin selection history
    public SoundEventLayerRandomSettings randomSettings; // Randomization
    public String[] files;                      // Sound file paths
}
```

### SoundEventLayerRandomSettings

Randomization settings for varied playback:

```java
package com.hypixel.hytale.protocol;

public class SoundEventLayerRandomSettings {
    public float minVolume;       // Minimum volume variation (dB)
    public float maxVolume;       // Maximum volume variation (dB)
    public float minPitch;        // Minimum pitch variation (semitones)
    public float maxPitch;        // Maximum pitch variation (semitones)
    public float maxStartOffset;  // Maximum start position offset
}
```

**Source:** `com.hypixel.hytale.protocol.SoundEventLayer`

## AudioCategory

Custom audio categories for fine-grained volume control:

```java
package com.hypixel.hytale.protocol;

public class AudioCategory {
    public String id;      // Category identifier
    public float volume;   // Base volume level
}
```

**Source:** `com.hypixel.hytale.protocol.AudioCategory`

## Playing Sounds from Plugins

The `SoundUtil` class provides methods for playing sounds from server-side code.

### 2D Sounds (Non-Positional)

2D sounds play at the same volume regardless of player position:

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;
import com.hypixel.hytale.protocol.SoundCategory;
import com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent;

public class AudioPlugin extends JavaPlugin {

    // Play 2D sound to a specific player
    public void playToPlayer(PlayerRef playerRef) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("ui_click");
        SoundUtil.playSoundEvent2dToPlayer(playerRef, soundIndex, SoundCategory.UI);
    }

    // Play 2D sound to a specific player with modifiers
    public void playToPlayerWithModifiers(PlayerRef playerRef) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("ui_notification");
        float volumeModifier = 1.5f;  // 50% louder
        float pitchModifier = 1.2f;   // Slightly higher pitch
        SoundUtil.playSoundEvent2dToPlayer(playerRef, soundIndex, SoundCategory.UI, volumeModifier, pitchModifier);
    }

    // Broadcast 2D sound to all players in a world
    public void broadcastSound(ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("announcement");
        SoundUtil.playSoundEvent2d(soundIndex, SoundCategory.SFX, componentAccessor);
    }

    // Play 2D sound to a specific entity (if it's a player)
    public void playToEntity(Ref<EntityStore> ref, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("item_pickup");
        SoundUtil.playSoundEvent2d(ref, soundIndex, SoundCategory.SFX, componentAccessor);
    }
}
```

### 3D Positional Sounds

3D sounds have positional audio with distance attenuation:

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;
import com.hypixel.hytale.protocol.SoundCategory;
import com.hypixel.hytale.math.vector.Vector3d;

public class PositionalAudioPlugin extends JavaPlugin {

    // Play 3D sound at a specific position
    public void playSoundAtPosition(double x, double y, double z, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("explosion");
        SoundUtil.playSoundEvent3d(soundIndex, SoundCategory.SFX, x, y, z, componentAccessor);
    }

    // Play 3D sound at position with modifiers
    public void playSoundWithModifiers(Vector3d position, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("thunder");
        float volumeModifier = 2.0f;  // Double volume
        float pitchModifier = 0.8f;   // Lower pitch
        SoundUtil.playSoundEvent3d(
            soundIndex,
            SoundCategory.Ambient,
            position.getX(), position.getY(), position.getZ(),
            volumeModifier, pitchModifier,
            componentAccessor
        );
    }

    // Play 3D sound with a filter (e.g., exclude certain players)
    public void playSoundFiltered(
        double x, double y, double z,
        Ref<EntityStore> excludePlayer,
        ComponentAccessor<EntityStore> componentAccessor
    ) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("secret_sound");
        Predicate<Ref<EntityStore>> shouldHear = playerRef -> !playerRef.equals(excludePlayer);
        SoundUtil.playSoundEvent3d(soundIndex, SoundCategory.SFX, x, y, z, shouldHear, componentAccessor);
    }

    // Play 3D sound from a source entity (handles visibility)
    public void playSoundFromEntity(Ref<EntityStore> sourceRef, double x, double y, double z, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("footstep");
        // Sound won't be heard by players who can't see the source entity
        SoundUtil.playSoundEvent3d(sourceRef, soundIndex, x, y, z, componentAccessor);
    }

    // Play 3D sound to a specific player only
    public void playSoundToSinglePlayer(
        Ref<EntityStore> playerRef,
        double x, double y, double z,
        ComponentAccessor<EntityStore> componentAccessor
    ) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("whisper");
        SoundUtil.playSoundEvent3dToPlayer(playerRef, soundIndex, SoundCategory.SFX, x, y, z, componentAccessor);
    }
}
```

### Entity-Attached Sounds

:::warning Non-Functional API
**`SoundUtil.playSoundEventEntity` is not implemented** as of version `2026.01.28-87d03be09`. The packet is sent to the client but nothing happens. Use `SoundUtil.playSoundEvent3d` with entity coordinates as a workaround.

See [GitHub Issue #35](https://github.com/timiliris/Hytale-Docs/issues/35) for tracking.
:::

Sounds can be attached to entities and follow their movement:

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;

public class EntitySoundPlugin extends JavaPlugin {

    // Play sound attached to an entity
    public void playEntitySound(int networkId, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("creature_idle");
        SoundUtil.playSoundEventEntity(soundIndex, networkId, componentAccessor);
    }

    // Play entity sound with modifiers
    public void playEntitySoundWithModifiers(int networkId, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("creature_hurt");
        float volumeModifier = 1.0f;
        float pitchModifier = 1.5f;  // Higher pitch
        SoundUtil.playSoundEventEntity(soundIndex, networkId, volumeModifier, pitchModifier, componentAccessor);
    }
}
```

**Source:** `com.hypixel.hytale.server.core.universe.world.SoundUtil`

## NPC Sound Actions

NPCs can play sounds as part of their behavior:

```java
package com.hypixel.hytale.server.npc.corecomponents.audiovisual;

public class ActionPlaySound extends ActionBase {
    protected final int soundEventIndex;

    // Plays sound at NPC's position
    @Override
    public boolean execute(Ref<EntityStore> ref, Role role, InfoProvider sensorInfo, double dt, Store<EntityStore> store) {
        TransformComponent transform = store.getComponent(ref, TransformComponent.getComponentType());
        Vector3d position = transform.getPosition();
        SoundUtil.playSoundEvent3d(ref, soundEventIndex, position.getX(), position.getY(), position.getZ(), false, store);
        return true;
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.corecomponents.audiovisual.ActionPlaySound`

## Sound Sets

Sound sets group related sounds for materials and interactions.

### Block Sound Sets

`BlockSoundSet` defines sounds for block interactions:

```java
package com.hypixel.hytale.protocol;

public class BlockSoundSet {
    public String id;                                    // Set identifier
    public Map<BlockSoundEvent, Integer> soundEventIndices; // Sounds by event type
    public FloatRange moveInRepeatRange;                 // Repeat delay for move sounds
}
```

### Block Sound Events

```java
package com.hypixel.hytale.protocol;

public enum BlockSoundEvent {
    Walk(0),     // Walking on the block
    Land(1),     // Landing on the block
    MoveIn(2),   // Moving into the block (e.g., tall grass)
    MoveOut(3),  // Moving out of the block
    Hit(4),      // Hitting/damaging the block
    Break(5),    // Breaking the block
    Build(6),    // Placing the block
    Clone(7),    // Cloning the block (builder tools)
    Harvest(8);  // Harvesting the block
}
```

### Item Sound Sets

`ItemSoundSet` defines sounds for item interactions:

```java
package com.hypixel.hytale.protocol;

public class ItemSoundSet {
    public String id;                                   // Set identifier
    public Map<ItemSoundEvent, Integer> soundEventIndices; // Sounds by event type
}
```

### Item Sound Events

```java
package com.hypixel.hytale.protocol;

public enum ItemSoundEvent {
    Drag(0),  // Dragging the item in inventory
    Drop(1);  // Dropping the item
}
```

**Source:** `com.hypixel.hytale.protocol.BlockSoundSet`, `com.hypixel.hytale.protocol.ItemSoundSet`

## Music System

### Environment Music

Music is tied to environments and changes based on player location:

```java
package com.hypixel.hytale.protocol.packets.world;

public class UpdateEnvironmentMusic implements Packet {
    public static final int PACKET_ID = 151;
    public int environmentIndex;  // Index of the environment to use for music
}
```

### AmbienceFX Music

Music configuration within ambient effects:

```java
package com.hypixel.hytale.protocol;

public class AmbienceFXMusic {
    public String[] tracks;  // Array of music track file paths
    public float volume;     // Music volume
}
```

**Source:** `com.hypixel.hytale.protocol.AmbienceFXMusic`

## Ambient Sound System

The AmbienceFX system provides rich ambient soundscapes.

### AmbienceFX

```java
package com.hypixel.hytale.protocol;

public class AmbienceFX {
    public String id;                        // Ambience identifier
    public AmbienceFXConditions conditions;  // Activation conditions
    public AmbienceFXSound[] sounds;         // Ambient sounds
    public AmbienceFXMusic music;            // Background music
    public AmbienceFXAmbientBed ambientBed;  // Continuous ambient bed
    public AmbienceFXSoundEffect soundEffect; // Sound effects
    public int priority;                     // Priority over other ambience
    public int[] blockedAmbienceFxIndices;   // Other ambiences to block
    public int audioCategoryIndex;           // Audio category
}
```

### AmbienceFX Sounds

Individual ambient sounds with 3D positioning:

```java
package com.hypixel.hytale.protocol;

public class AmbienceFXSound {
    public int soundEventIndex;         // Sound event to play
    public AmbienceFXSoundPlay3D play3D; // 3D positioning mode
    public int blockSoundSetIndex;      // Associated block sound set
    public AmbienceFXAltitude altitude; // Altitude preference
    public Rangef frequency;            // Play frequency range
    public Range radius;                // Play radius range
}
```

### 3D Positioning Modes

```java
package com.hypixel.hytale.protocol;

public enum AmbienceFXSoundPlay3D {
    Random(0),       // Play at random positions around player
    LocationName(1), // Play at named locations
    No(2);           // Play as 2D sound
}
```

### Altitude Options

```java
package com.hypixel.hytale.protocol;

public enum AmbienceFXAltitude {
    Normal(0),   // Normal altitude
    Lowest(1),   // Play at lowest point
    Highest(2),  // Play at highest point
    Random(3);   // Random altitude
}
```

### Ambient Bed

Continuous looping ambient audio:

```java
package com.hypixel.hytale.protocol;

public class AmbienceFXAmbientBed {
    public String track;                           // Audio track file
    public float volume;                           // Volume level
    public AmbienceTransitionSpeed transitionSpeed; // Crossfade speed
}
```

**Source:** `com.hypixel.hytale.protocol.AmbienceFX`

## Network Packets

### Sound Playback Packets

| Packet | ID | Description |
|--------|-----|-------------|
| `PlaySoundEvent2D` | 154 | Play non-positional sound |
| `PlaySoundEvent3D` | 155 | Play 3D positional sound |
| `PlaySoundEventEntity` | 156 | Play sound attached to entity |
| `UpdateEnvironmentMusic` | 151 | Change music environment |

### PlaySoundEvent2D

```java
package com.hypixel.hytale.protocol.packets.world;

public class PlaySoundEvent2D implements Packet {
    public static final int PACKET_ID = 154;
    public int soundEventIndex;       // Index of the sound event
    public SoundCategory category;    // Sound category
    public float volumeModifier;      // Volume multiplier
    public float pitchModifier;       // Pitch multiplier
}
```

### PlaySoundEvent3D

```java
package com.hypixel.hytale.protocol.packets.world;

public class PlaySoundEvent3D implements Packet {
    public static final int PACKET_ID = 155;
    public int soundEventIndex;       // Index of the sound event
    public SoundCategory category;    // Sound category
    public Position position;         // 3D position (x, y, z)
    public float volumeModifier;      // Volume multiplier
    public float pitchModifier;       // Pitch multiplier
}
```

### PlaySoundEventEntity

```java
package com.hypixel.hytale.protocol.packets.world;

public class PlaySoundEventEntity implements Packet {
    public static final int PACKET_ID = 156;
    public int soundEventIndex;  // Index of the sound event
    public int networkId;        // Entity network ID to attach to
    public float volumeModifier; // Volume multiplier
    public float pitchModifier;  // Pitch multiplier
}
```

### Asset Update Packets

| Packet | ID | Description |
|--------|-----|-------------|
| `UpdateSoundEvents` | 65 | Sync sound event definitions |
| `UpdateSoundSets` | 79 | Sync sound set definitions |
| `UpdateAudioCategories` | 80 | Sync audio category definitions |
| `UpdateBlockSoundSets` | 42 | Sync block sound sets |
| `UpdateItemSoundSets` | 43 | Sync item sound sets |

**Source:** `com.hypixel.hytale.protocol.packets.world`, `com.hypixel.hytale.protocol.packets.assets`

## Console Commands

### Sound Command

| Command | Description |
|---------|-------------|
| `/sound` | Opens the sound testing UI page |
| `/sound play2d <soundEvent>` | Play a 2D sound |
| `/sound play3d <soundEvent>` | Play a 3D sound at current position |

**Source:** `com.hypixel.hytale.server.core.command.commands.utility.sound.SoundCommand`

## Configuration Examples

### Custom Sound Event

```json
{
    "Volume": -6.0,
    "Pitch": 0.0,
    "MaxDistance": 32.0,
    "StartAttenuationDistance": 4.0,
    "MaxInstance": 10,
    "MusicDuckingVolume": -12.0,
    "Layers": [
        {
            "Volume": 0.0,
            "Looping": false,
            "Probability": 100,
            "RoundRobinHistorySize": 3,
            "Files": [
                "sounds/custom/effect_01.ogg",
                "sounds/custom/effect_02.ogg",
                "sounds/custom/effect_03.ogg"
            ],
            "RandomSettings": {
                "MinVolume": -2.0,
                "MaxVolume": 2.0,
                "MinPitch": -1.0,
                "MaxPitch": 1.0
            }
        }
    ]
}
```

### Custom Block Sound Set

```json
{
    "SoundEvents": {
        "Walk": "block_wood_walk",
        "Land": "block_wood_land",
        "Hit": "block_wood_hit",
        "Break": "block_wood_break",
        "Build": "block_wood_place"
    },
    "MoveInRepeatRange": {
        "Min": 0.2,
        "Max": 0.4
    }
}
```

## Source Files

| Class | Path |
|-------|------|
| `SoundUtil` | `com.hypixel.hytale.server.core.universe.world.SoundUtil` |
| `SoundEvent` (Config) | `com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent` |
| `SoundEvent` (Protocol) | `com.hypixel.hytale.protocol.SoundEvent` |
| `SoundEventLayer` | `com.hypixel.hytale.protocol.SoundEventLayer` |
| `SoundCategory` | `com.hypixel.hytale.protocol.SoundCategory` |
| `AudioCategory` | `com.hypixel.hytale.protocol.AudioCategory` |
| `SoundSet` | `com.hypixel.hytale.protocol.SoundSet` |
| `BlockSoundSet` | `com.hypixel.hytale.protocol.BlockSoundSet` |
| `BlockSoundEvent` | `com.hypixel.hytale.protocol.BlockSoundEvent` |
| `ItemSoundSet` | `com.hypixel.hytale.protocol.ItemSoundSet` |
| `ItemSoundEvent` | `com.hypixel.hytale.protocol.ItemSoundEvent` |
| `AmbienceFX` | `com.hypixel.hytale.protocol.AmbienceFX` |
| `AmbienceFXSound` | `com.hypixel.hytale.protocol.AmbienceFXSound` |
| `AmbienceFXMusic` | `com.hypixel.hytale.protocol.AmbienceFXMusic` |
| `AmbienceFXAmbientBed` | `com.hypixel.hytale.protocol.AmbienceFXAmbientBed` |
| `PlaySoundEvent2D` | `com.hypixel.hytale.protocol.packets.world.PlaySoundEvent2D` |
| `PlaySoundEvent3D` | `com.hypixel.hytale.protocol.packets.world.PlaySoundEvent3D` |
| `PlaySoundEventEntity` | `com.hypixel.hytale.protocol.packets.world.PlaySoundEventEntity` |
| `UpdateEnvironmentMusic` | `com.hypixel.hytale.protocol.packets.world.UpdateEnvironmentMusic` |
| `ActionPlaySound` | `com.hypixel.hytale.server.npc.corecomponents.audiovisual.ActionPlaySound` |
| `SoundCommand` | `com.hypixel.hytale.server.core.command.commands.utility.sound.SoundCommand` |
