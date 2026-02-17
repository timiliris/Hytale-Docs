---
id: gameplay-systems
title: "Systemes de gameplay"
sidebar_label: Systemes de gameplay
sidebar_position: 12
description: Reference technique des systemes de gameplay du serveur Hytale - Random tick, creative hub, teleporteurs, memoires, notifications de sommeil, systeme de feu, marqueurs de carte et objectifs.
---

# Systemes de gameplay

:::info Source
Cette documentation fournit une reference technique complete des systemes de gameplay principaux du serveur Hytale, derivee de l'analyse du code source decompile. Chaque section couvre l'architecture, les algorithmes et les options de configuration disponibles pour les mecaniques de gameplay cote serveur.
:::

## Systeme de Random Tick

**Package :** `com.hypixel.hytale.builtin.randomtick`

Le systeme de Random Tick pilote les changements passifs du monde tels que la propagation de l'herbe, la croissance des cultures et les transformations de blocs. Il opere par section de chunk et utilise un algorithme dual : ticks **stables** (deterministes) et ticks **instables** (aleatoires).

### Enregistrement RandomTickPlugin

`RandomTickPlugin` est le point d'entree. Il enregistre la ressource `RandomTick` sur le chunk store, le `RandomTickSystem` comme systeme de ticking, et deux procedures integrees sur le codec `RandomTickProcedure`.

```java
public class RandomTickPlugin extends JavaPlugin {
   @Override
   protected void setup() {
      this.randomTickResourceType = this.getChunkStoreRegistry()
          .registerResource(RandomTick.class, RandomTick::new);
      this.getChunkStoreRegistry().registerSystem(new RandomTickSystem());
      RandomTickProcedure.CODEC.register(
          "ChangeIntoBlock", ChangeIntoBlockProcedure.class, ChangeIntoBlockProcedure.CODEC);
      RandomTickProcedure.CODEC.register(
          "SpreadTo", SpreadToProcedure.class, SpreadToProcedure.CODEC);
   }
}
```

### Configuration des ressources RandomTick

| Parametre | Defaut | Description |
|-----------|--------|-------------|
| `blocksPerSectionPerTickStable` | `1` | Nombre de selections deterministes de blocs par section par tick |
| `blocksPerSectionPerTickUnstable` | `3` | Nombre de selections purement aleatoires de blocs par section par tick |

Chaque section de chunk contient 32x32x32 = **32 768** blocs.

### Algorithme RandomTickSystem

Le systeme traite chaque section de chunk chargee contenant des blocs non-air. Il execute deux passes par section.

#### Ticks stables (planification deterministe)

La passe stable garantit que chaque bloc d'une section est visite exactement une fois sur un cycle complet. La longueur du cycle est `32768 / blocksPerSectionPerTickStable` ticks.

Proprietes cles :
- **Couverture totale :** Sur `interval` ticks, chaque index dans `[0, 32767]` est visite exactement une fois.
- **Determinisme spatial :** La meme section de chunk au meme tick monde selectionne toujours les memes blocs.
- **Calcul economique :** Seules des operations de multiplication d'entiers et de masquage de bits sont necessaires.

#### Ticks instables (selection aleatoire)

La passe instable utilise un `java.util.Random` standard pour selectionner des blocs sans tenir compte des selections precedentes. Utile pour les processus qui ne doivent pas etre entierement previsibles (propagation du feu, declin).

### ChangeIntoBlockProcedure

La procedure la plus simple : remplace le bloc ticke par un type de bloc different.

| Champ | Type | Description |
|-------|------|-------------|
| `TargetBlock` | `String` | Cle asset du type de bloc cible de la transformation |

### SpreadToProcedure

La procedure la plus complexe. Gere la propagation de blocs avec des vecteurs directionnels configurables, des plages Y, des exigences de lumiere, un ciblage par tags et une reversion automatique.

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `SpreadDirections` | `Vector3i[]` | (requis) | Tableau d'offsets directionnels pour la propagation |
| `MinY` | `int` | `0` | Offset Y minimum relatif au bloc source |
| `MaxY` | `int` | `0` | Offset Y maximum relatif au bloc source |
| `AllowedTag` | `String` | (requis) | Tag asset que les blocs cibles doivent avoir |
| `RequireEmptyAboveTarget` | `boolean` | `true` | Le bloc cible doit avoir un espace vide au-dessus |
| `RequiredLightLevel` | `int` | `6` | Niveau de lumiere combine minimum (0-15) |
| `RevertBlock` | `String` | `null` | Type de bloc pour reversion si couvert |

**Algorithme de propagation :**

1. **Verification de reversion** -- Si `RevertBlock` est configure et que le bloc au-dessus est opaque (`Cube` ou `CubeWithModel`), le bloc source revient.
2. **Verification du niveau de lumiere** -- Skylight (modulee par le facteur solaire) et block light sont combinee. Le maximum doit atteindre `RequiredLightLevel`.
3. **Propagation directionnelle** -- Pour chaque offset Y et chaque direction, verification du tag, de l'espace vide et du cross-chunk.

---

## Creative Hub

**Package :** `com.hypixel.hytale.builtin.creativehub`

Le systeme Creative Hub gere un monde lobby base sur des instances que les joueurs rejoignent en se connectant a un monde configure pour le hub.

### Fonctionnalites

- Commande `/hub` (alias `cosmos` et `crossroads`, groupe de permission : `Creative`)
- Interaction `"HubPortal"` avec deux modes : `WorldGenType` OU `InstanceTemplate`
- **Pooling d'instances** : 1 hub par monde parent via `ConcurrentHashMap`
- **Teleportation safe** : Timeout de 1 minute, fallback en 4 couches (monde original -> hub parent -> monde par defaut -> deconnexion)
- **Persistance** : Restauration de la derniere position par joueur/monde
- **Bouton retour** : UI conditionnelle via `AnchorActionModule` (`"returnToHub"`)
- **Nettoyage** : Suppression automatique des instances lors du retrait de mondes

### Configuration

**CreativeHubWorldConfig** (par monde) :

| Champ | Type | Description |
|-------|------|-------------|
| `StartupInstance` | `String` | Nom de l'instance ou spawn les joueurs a la premiere connexion |

**CreativeHubEntityConfig** (par entite) :

| Champ | Type | Description |
|-------|------|-------------|
| `ParentHubWorldUuid` | `UUID` | UUID du monde parent proprietaire du hub |

---

## Systeme de teleporteurs

**Package :** `com.hypixel.hytale.builtin.adventure.teleporter`

Portails de warp bases sur des blocs pour teleporter les joueurs dans ou entre les mondes.

### Composant Teleporter

| Champ | Type | Description |
|-------|------|-------------|
| `World` | `UUID` | UUID du monde de destination |
| `Transform` | `Transform` | Position et rotation de destination |
| `Relative` | `byte` | Bitmask pour les transformations relatives |
| `Warp` | `String` | Destination warp nommee |
| `OwnedWarp` | `String` | Nom du warp possede par ce bloc |
| `IsCustomName` | `boolean` | Nom personnalise par l'utilisateur |
| `WarpNameWordList` | `String` | Liste de mots pour noms par defaut |

### Fonctionnement

- **Cooldown global** : 100ms entre teleportations
- **Zone de clear-out** : Rayons XZ et Y pour detecter la sortie de l'effet
- **Etat visuel** : `"Active"` quand destination valide, `"default"` sinon
- **Auto-creation de warp** : Nom genere automatiquement, offset 0.5/0.65 pour centrage, yaw +180 degres

---

## Systeme de memoires

**Package :** `com.hypixel.hytale.builtin.adventure.memories`

Mecanique de collection ou les joueurs decouvrent des PNJ et "capturent" leurs memoires.

### Architecture

- **Memory Providers** : Sources extensibles (ex: `NPCMemoryProvider`)
- **Store global** : Persiste dans `memories.json` avec `ReentrantReadWriteLock`
- **Composant par joueur** : `PlayerMemories` avec limite de capacite
- **Systeme de niveaux** : Seuils configurables via `MemoriesAmountPerLevel`

### Collecte de memoires PNJ

Le `GatherMemoriesSystem` s'execute pour les joueurs en mode Aventure. Il interroge les PNJ proches dans le rayon configure et enregistre les memoires non encore capturees.

### Configuration gameplay

| Champ | Type | Description |
|-------|------|-------------|
| `MemoriesAmountPerLevel` | `int[]` | Seuils de comptage pour chaque niveau |
| `MemoriesRecordParticles` | `String` | Effet de particules a l'enregistrement |
| `MemoriesCatchItemId` | `String` | Item a spawn comme pickup visuel |
| `MemoriesCatchEntityParticle` | `ModelParticle` | Particules sur le PNJ capture |
| `MemoriesCatchParticleViewDistance` | `int` (defaut `64`) | Distance de vue pour les particules |

---

## Notifications de sommeil

**Package :** `com.hypixel.hytale.builtin.beds.sleep.systems.player`

| Condition | Seuil | Type de notification |
|-----------|-------|---------------------|
| 4 joueurs ou moins, 1 dort | Tout dormeur | Nom du joueur |
| 4 joueurs ou moins, 2+ dorment | Tout dormeur | Nombre de dormeurs |
| Plus de 4 joueurs | 50%+ ratio | Nombre dormeurs / total |

- Couleur chat : Teal (#5AB5B5)
- Frequence : Toutes les 1.0 seconde
- Envoye uniquement aux joueurs **eveilles**
- Cooldown anti-spam via `WorldSomnolence`

---

## Systeme de feu (Fire Fluid)

**Package :** `com.hypixel.hytale.server.core.asset.type.fluid`

Le feu est implemente comme un type de fluide, lui permettant de se propager via le moteur de simulation de fluides.

### Algorithme de propagation

1. **Augmentation de niveau** : Le niveau du fluide feu augmente de 1 par tick
2. **Verification des voisins** : 6 directions cardinales
3. **Test de flammabilite** : Tag pattern matching
4. **Verification de combustion** : Si `fluidLevel` atteint `burnLevel` ET `random` passe `burnChance`
5. **Extinction** : Si le bloc n'a pas de config de flammabilite

### FlammabilityConfig

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `TagPattern` | `String` | (requis) | Pattern de tag pour matcher les blocs |
| `Priority` | `int` | `0` | Priorite de matching (plus haut = verifie en premier) |
| `BurnLevel` | `byte` | `1` | Niveau de fluide minimum pour declencher la combustion |
| `BurnChance` | `float` | `0.1` | Probabilite de combustion par tick (0.0 a 1.0) |
| `ResultingBlock` | `String` | `"Empty"` | Bloc place apres combustion |
| `SoundEvent` | `String` | `null` | Son joue a la combustion |

---

## Marqueurs de carte du monde

**Package :** `com.hypixel.hytale.server.core.universe.world.worldmap.markers`

### Providers integres

| Provider | Icone | Description |
|----------|-------|-------------|
| `DeathMarkerProvider` | `Death.png` | Positions de mort avec numero de jour |
| `OtherPlayersMarkerProvider` | `Player.png` | Autres joueurs avec UUID skin et delta d'altitude |
| `POIMarkerProvider` | (varies) | Points d'interet globaux |
| `PersonalMarkersProvider` | (varies) | Marqueurs par joueur |
| `SharedMarkersProvider` | (varies) | Marqueurs partages du monde |
| `RespawnMarkerProvider` | `Home.png` | Points de respawn (lits, etc.) |
| `SpawnMarkerProvider` | `Spawn.png` | Point de spawn du monde |

### Marqueurs utilisateur

| Champ | Type | Description |
|-------|------|-------------|
| `Id` | `String` | ID unique du marqueur |
| `X`, `Z` | `float` | Position dans le monde |
| `Name` | `String` | Nom donne par le joueur |
| `Icon` | `String` | Chemin de l'icone |
| `ColorTint` | `Color` | Teinte optionnelle |
| `CreatedByUuid` | `UUID` | UUID du createur |

**Validation :** Distance max = `viewRadius * 1.5 * 32` blocs, nom max = 24 caracteres, limites par joueur.

---

## Objectifs et quetes

**Package :** `com.hypixel.hytale.builtin.adventure.objectives`

### Types de taches

| Type | Description |
|------|-------------|
| `GatherObjectiveTask` | Collecter des items specifiques |
| `CraftObjectiveTask` | Crafter des items specifiques |
| `CountObjectiveTask` | Effectuer une action N fois |
| `ReachLocationTask` | Se rendre a un endroit specifique |
| `UseBlockObjectiveTask` | Interagir avec un bloc specifique |
| `UseEntityObjectiveTask` | Interagir avec une entite specifique |
| `TreasureMapObjectiveTask` | Suivre une carte au tresor |

Handlers de completion : `GiveItemsCompletion` et `ClearObjectiveItemsCompletion`. Le systeme suit l'historique via `ObjectiveHistoryComponent`.

---

## Resume de l'architecture

Tous ces systemes de gameplay suivent le pattern Entity Component System (ECS) de Hytale :

1. **Plugins** etendent `JavaPlugin` et enregistrent composants, systemes, interactions et event handlers dans `setup()`.
2. **Composants** sont des classes data-only implementant `Component` avec serialisation par codec.
3. **Systemes** implementent `EntityTickingSystem`, `RefSystem`, `RefChangeSystem` ou `DelayedSystem`.
4. **Interactions** implementent la hierarchie d'interfaces `Interaction`.
5. **Ressources** implementent `Resource` pour les donnees singleton attachees aux stores.
