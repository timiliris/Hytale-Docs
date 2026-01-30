---
id: audio-system
title: Sistema de Audio
sidebar_label: Sistema de Audio
sidebar_position: 20
description: Documentación completa del sistema de audio de Hytale para reproducir sonidos, gestionar música y audio ambiental mediante plugins
---

# Sistema de Audio

El Sistema de Audio en Hytale proporciona un marco integral para reproducir sonidos, gestionar música, manejar audio ambiental y sincronizar audio a través de la red. El sistema soporta sonidos 2D (UI/globales), audio posicional 3D y sonidos adjuntos a entidades.

## Descripción General

El sistema de audio consta de varios componentes clave:

- **SoundEvent** - Define un sonido reproducible con configuración de volumen, tono y capa
- **SoundCategory** - Categoriza sonidos (Música, Ambiental, SFX, UI)
- **AudioCategory** - Categorías de audio personalizadas con volumen configurable
- **SoundSet** - Grupos de sonidos relacionados para materiales e interacciones
- **AmbienceFX** - Paisajes sonoros ambientales vinculados a entornos
- **SoundUtil** - Clase de utilidad para reproducir sonidos desde código del servidor

## Categorías de Sonido

El enum `SoundCategory` define los canales de audio principales:

```java
package com.hypixel.hytale.protocol;

public enum SoundCategory {
    Music(0),    // Música de fondo
    Ambient(1),  // Sonidos ambientales/del entorno
    SFX(2),      // Efectos de sonido (pasos, combate, etc.)
    UI(3);       // Sonidos de interfaz de usuario
}
```

**Fuente:** `com.hypixel.hytale.protocol.SoundCategory`

## SoundEvent

`SoundEvent` es el tipo de activo principal para definir sonidos reproducibles:

```java
package com.hypixel.hytale.server.core.asset.type.soundevent.config;

public class SoundEvent {
    public static final int EMPTY_ID = 0;
    public static final String EMPTY = "EMPTY";

    // Obtener almacén de activos para eventos de sonido
    public static IndexedLookupTableAssetMap<String, SoundEvent> getAssetMap();

    // Propiedades
    public String getId();
    public float getVolume();                    // Ganancia lineal (1.0 = 0dB)
    public float getPitch();                     // Tono lineal (1.0 = normal)
    public float getMusicDuckingVolume();        // Reducción de volumen de música al reproducir
    public float getAmbientDuckingVolume();      // Reducción de volumen ambiental al reproducir
    public float getStartAttenuationDistance();  // Distancia donde comienza la atenuación (bloques)
    public float getMaxDistance();               // Distancia máxima audible (bloques)
    public int getMaxInstance();                 // Máx instancias concurrentes
    public boolean getPreventSoundInterruption(); // Prevenir interrupción por otros sonidos
    public SoundEventLayer[] getLayers();        // Capas de sonido
    public String getAudioCategoryId();          // Categoría de audio personalizada
    public int getAudioCategoryIndex();          // Índice de categoría de audio
}
```

### Configuración de SoundEvent

Los eventos de sonido se definen en JSON:

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
      "Files": ["sounds/effect1.ogg", "sounds/effect2.ogg"],
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

| Propiedad                  | Tipo    | Descripción                                                 |
| -------------------------- | ------- | ----------------------------------------------------------- |
| `Volume`                   | Float   | Ajuste de volumen en decibelios (-100 a 10 dB)              |
| `Pitch`                    | Float   | Ajuste de tono en semitonos (-12 a 12)                      |
| `MusicDuckingVolume`       | Float   | Reducción de volumen de música en dB (-100 a 0)             |
| `AmbientDuckingVolume`     | Float   | Reducción de volumen ambiental en dB (-100 a 0)             |
| `StartAttenuationDistance` | Float   | Distancia donde comienza la atenuación de volumen (bloques) |
| `MaxDistance`              | Float   | Distancia máxima audible (bloques)                          |
| `MaxInstance`              | Integer | Máximo de instancias concurrentes (1-100)                   |
| `PreventSoundInterruption` | Boolean | Prevenir que otros sonidos interrumpan                      |
| `AudioCategory`            | String  | ID de categoría de audio personalizada                      |
| `Layers`                   | Array   | Capas de sonido (ver abajo)                                 |

**Fuente:** `com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent`

## SoundEventLayer

Cada evento de sonido puede tener múltiples capas para audio complejo:

```java
package com.hypixel.hytale.protocol;

public class SoundEventLayer {
    public float volume;                        // Volumen de capa
    public float startDelay;                    // Retraso antes de reproducir
    public boolean looping;                     // Repetir el sonido
    public int probability;                     // Probabilidad de reproducción (0-100)
    public float probabilityRerollDelay;        // Retraso entre comprobaciones de probabilidad
    public int roundRobinHistorySize;           // Historial de selección round-robin
    public SoundEventLayerRandomSettings randomSettings; // Aleatorización
    public String[] files;                      // Rutas de archivos de sonido
}
```

### SoundEventLayerRandomSettings

Configuración de aleatorización para reproducción variada:

```java
package com.hypixel.hytale.protocol;

public class SoundEventLayerRandomSettings {
    public float minVolume;       // Variación mínima de volumen (dB)
    public float maxVolume;       // Variación máxima de volumen (dB)
    public float minPitch;        // Variación mínima de tono (semitonos)
    public float maxPitch;        // Variación máxima de tono (semitonos)
    public float maxStartOffset;  // Desplazamiento máximo de posición de inicio
}
```

**Fuente:** `com.hypixel.hytale.protocol.SoundEventLayer`

## AudioCategory

Categorías de audio personalizadas para control de volumen detallado:

```java
package com.hypixel.hytale.protocol;

public class AudioCategory {
    public String id;      // Identificador de categoría
    public float volume;   // Nivel de volumen base
}
```

**Fuente:** `com.hypixel.hytale.protocol.AudioCategory`

## Reproducir Sonidos desde Plugins

La clase `SoundUtil` proporciona métodos para reproducir sonidos desde código del lado del servidor.

### Sonidos 2D (No Posicionales)

Los sonidos 2D se reproducen al mismo volumen independientemente de la posición del jugador:

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;
import com.hypixel.hytale.protocol.SoundCategory;
import com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent;

public class AudioPlugin extends JavaPlugin {

    // Reproducir sonido 2D a un jugador específico
    public void playToPlayer(PlayerRef playerRef) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("ui_click");
        SoundUtil.playSoundEvent2dToPlayer(playerRef, soundIndex, SoundCategory.UI);
    }

    // Reproducir sonido 2D a un jugador específico con modificadores
    public void playToPlayerWithModifiers(PlayerRef playerRef) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("ui_notification");
        float volumeModifier = 1.5f;  // 50% más alto
        float pitchModifier = 1.2f;   // Tono ligeramente más alto
        SoundUtil.playSoundEvent2dToPlayer(playerRef, soundIndex, SoundCategory.UI, volumeModifier, pitchModifier);
    }

    // Transmitir sonido 2D a todos los jugadores en un mundo
    public void broadcastSound(ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("announcement");
        SoundUtil.playSoundEvent2d(soundIndex, SoundCategory.SFX, componentAccessor);
    }

    // Reproducir sonido 2D a una entidad específica (si es un jugador)
    public void playToEntity(Ref<EntityStore> ref, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("item_pickup");
        SoundUtil.playSoundEvent2d(ref, soundIndex, SoundCategory.SFX, componentAccessor);
    }
}
```

### Sonidos Posicionales 3D

Los sonidos 3D tienen audio posicional con atenuación por distancia:

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;
import com.hypixel.hytale.protocol.SoundCategory;
import com.hypixel.hytale.math.vector.Vector3d;

public class PositionalAudioPlugin extends JavaPlugin {

    // Reproducir sonido 3D en una posición específica
    public void playSoundAtPosition(double x, double y, double z, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("explosion");
        SoundUtil.playSoundEvent3d(soundIndex, SoundCategory.SFX, x, y, z, componentAccessor);
    }

    // Reproducir sonido 3D en posición con modificadores
    public void playSoundWithModifiers(Vector3d position, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("thunder");
        float volumeModifier = 2.0f;  // Doble volumen
        float pitchModifier = 0.8f;   // Tono más bajo
        SoundUtil.playSoundEvent3d(
            soundIndex,
            SoundCategory.Ambient,
            position.getX(), position.getY(), position.getZ(),
            volumeModifier, pitchModifier,
            componentAccessor
        );
    }

    // Reproducir sonido 3D con filtro (ej., excluir ciertos jugadores)
    public void playSoundFiltered(
        double x, double y, double z,
        Ref<EntityStore> excludePlayer,
        ComponentAccessor<EntityStore> componentAccessor
    ) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("secret_sound");
        Predicate<Ref<EntityStore>> shouldHear = playerRef -> !playerRef.equals(excludePlayer);
        SoundUtil.playSoundEvent3d(soundIndex, SoundCategory.SFX, x, y, z, shouldHear, componentAccessor);
    }

    // Reproducir sonido 3D desde una entidad fuente (maneja visibilidad)
    public void playSoundFromEntity(Ref<EntityStore> sourceRef, double x, double y, double z, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("footstep");
        // El sonido no será escuchado por jugadores que no puedan ver la entidad fuente
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

**Fuente:** `com.hypixel.hytale.server.core.universe.world.SoundUtil`

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

**Fuente:** `com.hypixel.hytale.protocol.BlockSoundSet`, `com.hypixel.hytale.protocol.ItemSoundSet`

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

**Fuente:** `com.hypixel.hytale.protocol.AmbienceFXMusic`

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

**Fuente:** `com.hypixel.hytale.protocol.AmbienceFX`

## Network Packets

### Sound Playback Packets

| Packet                   | ID  | Description                   |
| ------------------------ | --- | ----------------------------- |
| `PlaySoundEvent2D`       | 154 | Play non-positional sound     |
| `PlaySoundEvent3D`       | 155 | Play 3D positional sound      |
| `PlaySoundEventEntity`   | 156 | Play sound attached to entity |
| `UpdateEnvironmentMusic` | 151 | Change music environment      |

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

| Packet                  | ID  | Description                     |
| ----------------------- | --- | ------------------------------- |
| `UpdateSoundEvents`     | 65  | Sync sound event definitions    |
| `UpdateSoundSets`       | 79  | Sync sound set definitions      |
| `UpdateAudioCategories` | 80  | Sync audio category definitions |
| `UpdateBlockSoundSets`  | 42  | Sync block sound sets           |
| `UpdateItemSoundSets`   | 43  | Sync item sound sets            |

**Fuente:** `com.hypixel.hytale.protocol.packets.world`, `com.hypixel.hytale.protocol.packets.assets`

## Console Commands

### Sound Command

| Command                      | Description                         |
| ---------------------------- | ----------------------------------- |
| `/sound`                     | Opens the sound testing UI page     |
| `/sound play2d <soundEvent>` | Play a 2D sound                     |
| `/sound play3d <soundEvent>` | Play a 3D sound at current position |

**Fuente:** `com.hypixel.hytale.server.core.command.commands.utility.sound.SoundCommand`

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

| Clase                    | Ruta                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `SoundUtil`              | `com.hypixel.hytale.server.core.universe.world.SoundUtil`                    |
| `SoundEvent` (Config)    | `com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent`     |
| `SoundEvent` (Protocol)  | `com.hypixel.hytale.protocol.SoundEvent`                                     |
| `SoundEventLayer`        | `com.hypixel.hytale.protocol.SoundEventLayer`                                |
| `SoundCategory`          | `com.hypixel.hytale.protocol.SoundCategory`                                  |
| `AudioCategory`          | `com.hypixel.hytale.protocol.AudioCategory`                                  |
| `SoundSet`               | `com.hypixel.hytale.protocol.SoundSet`                                       |
| `BlockSoundSet`          | `com.hypixel.hytale.protocol.BlockSoundSet`                                  |
| `BlockSoundEvent`        | `com.hypixel.hytale.protocol.BlockSoundEvent`                                |
| `ItemSoundSet`           | `com.hypixel.hytale.protocol.ItemSoundSet`                                   |
| `ItemSoundEvent`         | `com.hypixel.hytale.protocol.ItemSoundEvent`                                 |
| `AmbienceFX`             | `com.hypixel.hytale.protocol.AmbienceFX`                                     |
| `AmbienceFXSound`        | `com.hypixel.hytale.protocol.AmbienceFXSound`                                |
| `AmbienceFXMusic`        | `com.hypixel.hytale.protocol.AmbienceFXMusic`                                |
| `AmbienceFXAmbientBed`   | `com.hypixel.hytale.protocol.AmbienceFXAmbientBed`                           |
| `PlaySoundEvent2D`       | `com.hypixel.hytale.protocol.packets.world.PlaySoundEvent2D`                 |
| `PlaySoundEvent3D`       | `com.hypixel.hytale.protocol.packets.world.PlaySoundEvent3D`                 |
| `PlaySoundEventEntity`   | `com.hypixel.hytale.protocol.packets.world.PlaySoundEventEntity`             |
| `UpdateEnvironmentMusic` | `com.hypixel.hytale.protocol.packets.world.UpdateEnvironmentMusic`           |
| `ActionPlaySound`        | `com.hypixel.hytale.server.npc.corecomponents.audiovisual.ActionPlaySound`   |
| `SoundCommand`           | `com.hypixel.hytale.server.core.command.commands.utility.sound.SoundCommand` |
