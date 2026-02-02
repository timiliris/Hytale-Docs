---
id: audio-system
title: Systeme Audio
sidebar_label: Systeme Audio
sidebar_position: 20
description: Documentation complete du systeme audio de Hytale pour jouer des sons, gerer la musique et l'audio ambiant via des plugins
---

# Systeme Audio

Le systeme audio de Hytale fournit un cadre complet pour jouer des sons, gerer la musique, gerer l'audio ambiant et synchroniser l'audio sur le reseau. Le systeme prend en charge les sons 2D (UI/global), l'audio positionnel 3D et les sons attaches aux entites.

## Apercu

Le systeme audio se compose de plusieurs composants cles :

- **SoundEvent** - Definit un son jouable avec configuration de volume, de tonalite et de couches
- **SoundCategory** - Categorise les sons (Musique, Ambiant, SFX, UI)
- **AudioCategory** - Categories audio personnalisees avec volume configurable
- **SoundSet** - Groupes de sons lies pour les materiaux et interactions
- **AmbienceFX** - Paysages sonores ambiants lies aux environnements
- **SoundUtil** - Classe utilitaire pour jouer des sons depuis le code serveur

## Categories de Sons

L'enum `SoundCategory` definit les canaux audio principaux :

```java
package com.hypixel.hytale.protocol;

public enum SoundCategory {
    Music(0),    // Musique de fond
    Ambient(1),  // Sons environnementaux/ambiants
    SFX(2),      // Effets sonores (pas, combat, etc.)
    UI(3);       // Sons d'interface utilisateur
}
```

**Source :** `com.hypixel.hytale.protocol.SoundCategory`

## SoundEvent

`SoundEvent` est le type d'asset principal pour definir des sons jouables :

```java
package com.hypixel.hytale.server.core.asset.type.soundevent.config;

public class SoundEvent {
    public static final int EMPTY_ID = 0;
    public static final String EMPTY = "EMPTY";

    // Obtenir le magasin d'assets pour les evenements sonores
    public static IndexedLookupTableAssetMap<String, SoundEvent> getAssetMap();

    // Proprietes
    public String getId();
    public float getVolume();                    // Gain lineaire (1.0 = 0dB)
    public float getPitch();                     // Tonalite lineaire (1.0 = normal)
    public float getMusicDuckingVolume();        // Reduction du volume musical lors de la lecture
    public float getAmbientDuckingVolume();      // Reduction du volume ambiant lors de la lecture
    public float getStartAttenuationDistance();  // Distance ou l'attenuation commence (blocs)
    public float getMaxDistance();               // Distance audible maximale (blocs)
    public int getMaxInstance();                 // Instances simultanees maximales
    public boolean getPreventSoundInterruption(); // Empecher l'interruption par d'autres sons
    public SoundEventLayer[] getLayers();        // Couches de son
    public String getAudioCategoryId();          // Categorie audio personnalisee
    public int getAudioCategoryIndex();          // Index de categorie audio
}
```

### Configuration de SoundEvent

Les evenements sonores sont definis en JSON :

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
    "AudioCategory": "categorie_personnalisee",
    "Layers": [
        {
            "Volume": 0.0,
            "StartDelay": 0.0,
            "Looping": false,
            "Probability": 100,
            "Files": [
                "sounds/effet1.ogg",
                "sounds/effet2.ogg"
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

| Propriete | Type | Description |
|-----------|------|-------------|
| `Volume` | Float | Ajustement du volume en decibels (-100 a 10 dB) |
| `Pitch` | Float | Ajustement de la tonalite en demi-tons (-12 a 12) |
| `MusicDuckingVolume` | Float | Reduction du volume musical en dB (-100 a 0) |
| `AmbientDuckingVolume` | Float | Reduction du volume ambiant en dB (-100 a 0) |
| `StartAttenuationDistance` | Float | Distance ou l'attenuation du volume commence (blocs) |
| `MaxDistance` | Float | Distance audible maximale (blocs) |
| `MaxInstance` | Integer | Instances simultanees maximales (1-100) |
| `PreventSoundInterruption` | Boolean | Empecher les autres sons d'interrompre |
| `AudioCategory` | String | ID de categorie audio personnalisee |
| `Layers` | Array | Couches de son (voir ci-dessous) |

**Source :** `com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent`

## SoundEventLayer

Chaque evenement sonore peut avoir plusieurs couches pour un audio complexe :

```java
package com.hypixel.hytale.protocol;

public class SoundEventLayer {
    public float volume;                        // Volume de la couche
    public float startDelay;                    // Delai avant la lecture
    public boolean looping;                     // Boucler le son
    public int probability;                     // Probabilite de lecture (0-100)
    public float probabilityRerollDelay;        // Delai entre les verifications de probabilite
    public int roundRobinHistorySize;           // Historique de selection round-robin
    public SoundEventLayerRandomSettings randomSettings; // Randomisation
    public String[] files;                      // Chemins des fichiers audio
}
```

### SoundEventLayerRandomSettings

Parametres de randomisation pour une lecture variee :

```java
package com.hypixel.hytale.protocol;

public class SoundEventLayerRandomSettings {
    public float minVolume;       // Variation minimale du volume (dB)
    public float maxVolume;       // Variation maximale du volume (dB)
    public float minPitch;        // Variation minimale de tonalite (demi-tons)
    public float maxPitch;        // Variation maximale de tonalite (demi-tons)
    public float maxStartOffset;  // Decalage maximal de position de depart
}
```

**Source :** `com.hypixel.hytale.protocol.SoundEventLayer`

## AudioCategory

Categories audio personnalisees pour un controle de volume precis :

```java
package com.hypixel.hytale.protocol;

public class AudioCategory {
    public String id;      // Identifiant de categorie
    public float volume;   // Niveau de volume de base
}
```

**Source :** `com.hypixel.hytale.protocol.AudioCategory`

## Jouer des Sons depuis les Plugins

La classe `SoundUtil` fournit des methodes pour jouer des sons depuis le code serveur.

### Sons 2D (Non-Positionnels)

Les sons 2D jouent au meme volume quelle que soit la position du joueur :

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;
import com.hypixel.hytale.protocol.SoundCategory;
import com.hypixel.hytale.server.core.asset.type.soundevent.config.SoundEvent;

public class AudioPlugin extends JavaPlugin {

    // Jouer un son 2D a un joueur specifique
    public void playToPlayer(PlayerRef playerRef) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("ui_click");
        SoundUtil.playSoundEvent2dToPlayer(playerRef, soundIndex, SoundCategory.UI);
    }

    // Jouer un son 2D a un joueur specifique avec modificateurs
    public void playToPlayerWithModifiers(PlayerRef playerRef) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("ui_notification");
        float volumeModifier = 1.5f;  // 50% plus fort
        float pitchModifier = 1.2f;   // Tonalite legerement plus haute
        SoundUtil.playSoundEvent2dToPlayer(playerRef, soundIndex, SoundCategory.UI, volumeModifier, pitchModifier);
    }

    // Diffuser un son 2D a tous les joueurs dans un monde
    public void broadcastSound(ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("announcement");
        SoundUtil.playSoundEvent2d(soundIndex, SoundCategory.SFX, componentAccessor);
    }

    // Jouer un son 2D a une entite specifique (si c'est un joueur)
    public void playToEntity(Ref<EntityStore> ref, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("item_pickup");
        SoundUtil.playSoundEvent2d(ref, soundIndex, SoundCategory.SFX, componentAccessor);
    }
}
```

### Sons 3D Positionnels

Les sons 3D ont un audio positionnel avec attenuation de distance :

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;
import com.hypixel.hytale.protocol.SoundCategory;
import com.hypixel.hytale.math.vector.Vector3d;

public class PositionalAudioPlugin extends JavaPlugin {

    // Jouer un son 3D a une position specifique
    public void playSoundAtPosition(double x, double y, double z, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("explosion");
        SoundUtil.playSoundEvent3d(soundIndex, SoundCategory.SFX, x, y, z, componentAccessor);
    }

    // Jouer un son 3D a une position avec modificateurs
    public void playSoundWithModifiers(Vector3d position, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("thunder");
        float volumeModifier = 2.0f;  // Volume double
        float pitchModifier = 0.8f;   // Tonalite plus basse
        SoundUtil.playSoundEvent3d(
            soundIndex,
            SoundCategory.Ambient,
            position.getX(), position.getY(), position.getZ(),
            volumeModifier, pitchModifier,
            componentAccessor
        );
    }

    // Jouer un son 3D avec un filtre (ex: exclure certains joueurs)
    public void playSoundFiltered(
        double x, double y, double z,
        Ref<EntityStore> excludePlayer,
        ComponentAccessor<EntityStore> componentAccessor
    ) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("secret_sound");
        Predicate<Ref<EntityStore>> shouldHear = playerRef -> !playerRef.equals(excludePlayer);
        SoundUtil.playSoundEvent3d(soundIndex, SoundCategory.SFX, x, y, z, shouldHear, componentAccessor);
    }

    // Jouer un son 3D depuis une entite source (gere la visibilite)
    public void playSoundFromEntity(Ref<EntityStore> sourceRef, double x, double y, double z, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("footstep");
        // Le son ne sera pas entendu par les joueurs qui ne peuvent pas voir l'entite source
        SoundUtil.playSoundEvent3d(sourceRef, soundIndex, x, y, z, componentAccessor);
    }

    // Jouer un son 3D a un seul joueur specifique
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

### Sons Attaches aux Entites

:::warning API Non-Fonctionnelle
**`SoundUtil.playSoundEventEntity` n'est pas implementee** depuis la version `2026.01.28-87d03be09`. Le paquet est envoye au client mais rien ne se passe. Utilisez `SoundUtil.playSoundEvent3d` avec les coordonnees de l'entite comme solution de contournement.

Voir [GitHub Issue #35](https://github.com/timiliris/Hytale-Docs/issues/35) pour le suivi.
:::

Les sons peuvent etre attaches aux entites et suivre leur mouvement :

```java
import com.hypixel.hytale.server.core.universe.world.SoundUtil;

public class EntitySoundPlugin extends JavaPlugin {

    // Jouer un son attache a une entite
    public void playEntitySound(int networkId, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("creature_idle");
        SoundUtil.playSoundEventEntity(soundIndex, networkId, componentAccessor);
    }

    // Jouer un son d'entite avec modificateurs
    public void playEntitySoundWithModifiers(int networkId, ComponentAccessor<EntityStore> componentAccessor) {
        int soundIndex = SoundEvent.getAssetMap().getIndex("creature_hurt");
        float volumeModifier = 1.0f;
        float pitchModifier = 1.5f;  // Tonalite plus haute
        SoundUtil.playSoundEventEntity(soundIndex, networkId, volumeModifier, pitchModifier, componentAccessor);
    }
}
```

**Source :** `com.hypixel.hytale.server.core.universe.world.SoundUtil`

## Actions Sonores des NPC

Les NPC peuvent jouer des sons dans le cadre de leur comportement :

```java
package com.hypixel.hytale.server.npc.corecomponents.audiovisual;

public class ActionPlaySound extends ActionBase {
    protected final int soundEventIndex;

    // Joue un son a la position du NPC
    @Override
    public boolean execute(Ref<EntityStore> ref, Role role, InfoProvider sensorInfo, double dt, Store<EntityStore> store) {
        TransformComponent transform = store.getComponent(ref, TransformComponent.getComponentType());
        Vector3d position = transform.getPosition();
        SoundUtil.playSoundEvent3d(ref, soundEventIndex, position.getX(), position.getY(), position.getZ(), false, store);
        return true;
    }
}
```

**Source :** `com.hypixel.hytale.server.npc.corecomponents.audiovisual.ActionPlaySound`

## Ensembles de Sons

Les ensembles de sons regroupent des sons lies pour les materiaux et interactions.

### Ensembles de Sons de Blocs

`BlockSoundSet` definit les sons pour les interactions avec les blocs :

```java
package com.hypixel.hytale.protocol;

public class BlockSoundSet {
    public String id;                                    // Identifiant de l'ensemble
    public Map<BlockSoundEvent, Integer> soundEventIndices; // Sons par type d'evenement
    public FloatRange moveInRepeatRange;                 // Delai de repetition pour les sons de mouvement
}
```

### Evenements Sonores de Blocs

```java
package com.hypixel.hytale.protocol;

public enum BlockSoundEvent {
    Walk(0),     // Marcher sur le bloc
    Land(1),     // Atterrir sur le bloc
    MoveIn(2),   // Entrer dans le bloc (ex: hautes herbes)
    MoveOut(3),  // Sortir du bloc
    Hit(4),      // Frapper/endommager le bloc
    Break(5),    // Casser le bloc
    Build(6),    // Placer le bloc
    Clone(7),    // Cloner le bloc (outils de construction)
    Harvest(8);  // Recolter le bloc
}
```

### Ensembles de Sons d'Objets

`ItemSoundSet` definit les sons pour les interactions avec les objets :

```java
package com.hypixel.hytale.protocol;

public class ItemSoundSet {
    public String id;                                   // Identifiant de l'ensemble
    public Map<ItemSoundEvent, Integer> soundEventIndices; // Sons par type d'evenement
}
```

### Evenements Sonores d'Objets

```java
package com.hypixel.hytale.protocol;

public enum ItemSoundEvent {
    Drag(0),  // Glisser l'objet dans l'inventaire
    Drop(1);  // Deposer l'objet
}
```

**Source :** `com.hypixel.hytale.protocol.BlockSoundSet`, `com.hypixel.hytale.protocol.ItemSoundSet`

## Systeme Musical

### Musique d'Environnement

La musique est liee aux environnements et change selon la position du joueur :

```java
package com.hypixel.hytale.protocol.packets.world;

public class UpdateEnvironmentMusic implements Packet {
    public static final int PACKET_ID = 151;
    public int environmentIndex;  // Index de l'environnement a utiliser pour la musique
}
```

### Musique AmbienceFX

Configuration musicale dans les effets ambiants :

```java
package com.hypixel.hytale.protocol;

public class AmbienceFXMusic {
    public String[] tracks;  // Tableau des chemins de fichiers de pistes musicales
    public float volume;     // Volume musical
}
```

**Source :** `com.hypixel.hytale.protocol.AmbienceFXMusic`

## Systeme de Sons Ambiants

Le systeme AmbienceFX fournit des paysages sonores ambiants riches.

### AmbienceFX

```java
package com.hypixel.hytale.protocol;

public class AmbienceFX {
    public String id;                        // Identifiant de l'ambiance
    public AmbienceFXConditions conditions;  // Conditions d'activation
    public AmbienceFXSound[] sounds;         // Sons ambiants
    public AmbienceFXMusic music;            // Musique de fond
    public AmbienceFXAmbientBed ambientBed;  // Lit ambiant continu
    public AmbienceFXSoundEffect soundEffect; // Effets sonores
    public int priority;                     // Priorite sur les autres ambiances
    public int[] blockedAmbienceFxIndices;   // Autres ambiances a bloquer
    public int audioCategoryIndex;           // Categorie audio
}
```

### Sons AmbienceFX

Sons ambiants individuels avec positionnement 3D :

```java
package com.hypixel.hytale.protocol;

public class AmbienceFXSound {
    public int soundEventIndex;         // Evenement sonore a jouer
    public AmbienceFXSoundPlay3D play3D; // Mode de positionnement 3D
    public int blockSoundSetIndex;      // Ensemble de sons de bloc associe
    public AmbienceFXAltitude altitude; // Preference d'altitude
    public Rangef frequency;            // Plage de frequence de lecture
    public Range radius;                // Plage de rayon de lecture
}
```

### Modes de Positionnement 3D

```java
package com.hypixel.hytale.protocol;

public enum AmbienceFXSoundPlay3D {
    Random(0),       // Jouer a des positions aleatoires autour du joueur
    LocationName(1), // Jouer aux emplacements nommes
    No(2);           // Jouer comme son 2D
}
```

### Options d'Altitude

```java
package com.hypixel.hytale.protocol;

public enum AmbienceFXAltitude {
    Normal(0),   // Altitude normale
    Lowest(1),   // Jouer au point le plus bas
    Highest(2),  // Jouer au point le plus haut
    Random(3);   // Altitude aleatoire
}
```

### Lit Ambiant

Audio ambiant continu en boucle :

```java
package com.hypixel.hytale.protocol;

public class AmbienceFXAmbientBed {
    public String track;                           // Fichier de piste audio
    public float volume;                           // Niveau de volume
    public AmbienceTransitionSpeed transitionSpeed; // Vitesse de fondu enchaine
}
```

**Source :** `com.hypixel.hytale.protocol.AmbienceFX`

## Paquets Reseau

### Paquets de Lecture Audio

| Paquet | ID | Description |
|--------|-----|-------------|
| `PlaySoundEvent2D` | 154 | Jouer un son non-positionnel |
| `PlaySoundEvent3D` | 155 | Jouer un son 3D positionnel |
| `PlaySoundEventEntity` | 156 | Jouer un son attache a une entite |
| `UpdateEnvironmentMusic` | 151 | Changer l'environnement musical |

### PlaySoundEvent2D

```java
package com.hypixel.hytale.protocol.packets.world;

public class PlaySoundEvent2D implements Packet {
    public static final int PACKET_ID = 154;
    public int soundEventIndex;       // Index de l'evenement sonore
    public SoundCategory category;    // Categorie de son
    public float volumeModifier;      // Multiplicateur de volume
    public float pitchModifier;       // Multiplicateur de tonalite
}
```

### PlaySoundEvent3D

```java
package com.hypixel.hytale.protocol.packets.world;

public class PlaySoundEvent3D implements Packet {
    public static final int PACKET_ID = 155;
    public int soundEventIndex;       // Index de l'evenement sonore
    public SoundCategory category;    // Categorie de son
    public Position position;         // Position 3D (x, y, z)
    public float volumeModifier;      // Multiplicateur de volume
    public float pitchModifier;       // Multiplicateur de tonalite
}
```

### PlaySoundEventEntity

```java
package com.hypixel.hytale.protocol.packets.world;

public class PlaySoundEventEntity implements Packet {
    public static final int PACKET_ID = 156;
    public int soundEventIndex;  // Index de l'evenement sonore
    public int networkId;        // ID reseau de l'entite a attacher
    public float volumeModifier; // Multiplicateur de volume
    public float pitchModifier;  // Multiplicateur de tonalite
}
```

### Paquets de Mise a Jour d'Assets

| Paquet | ID | Description |
|--------|-----|-------------|
| `UpdateSoundEvents` | 65 | Synchroniser les definitions d'evenements sonores |
| `UpdateSoundSets` | 79 | Synchroniser les definitions d'ensembles de sons |
| `UpdateAudioCategories` | 80 | Synchroniser les definitions de categories audio |
| `UpdateBlockSoundSets` | 42 | Synchroniser les ensembles de sons de blocs |
| `UpdateItemSoundSets` | 43 | Synchroniser les ensembles de sons d'objets |

**Source :** `com.hypixel.hytale.protocol.packets.world`, `com.hypixel.hytale.protocol.packets.assets`

## Commandes Console

### Commande Sound

| Commande | Description |
|----------|-------------|
| `/sound` | Ouvre la page UI de test audio |
| `/sound play2d <soundEvent>` | Jouer un son 2D |
| `/sound play3d <soundEvent>` | Jouer un son 3D a la position actuelle |

**Source :** `com.hypixel.hytale.server.core.command.commands.utility.sound.SoundCommand`

## Exemples de Configuration

### Evenement Sonore Personnalise

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
                "sounds/custom/effet_01.ogg",
                "sounds/custom/effet_02.ogg",
                "sounds/custom/effet_03.ogg"
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

### Ensemble de Sons de Bloc Personnalise

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

## Fichiers Source

| Classe | Chemin |
|--------|--------|
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
