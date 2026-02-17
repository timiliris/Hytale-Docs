---
id: update-3
title: "Update 3 - 17 fevrier 2026"
sidebar_label: Update 3
sidebar_position: 10
description: Changelog complet de la mise a jour 3 du serveur Hytale, premiere mise a jour majeure depuis la release initiale (apres deux patchs mineurs) - Reseau multi-canal, mises a jour ECS, refonte de la generation du monde, nouveaux systemes de gameplay, et plus encore.
---

# Update 3 - 17 fevrier 2026

:::info Mise a jour serveur
Ce changelog documente tous les changements internes depuis la **release initiale (13 janvier 2026)** jusqu'au build du **17 fevrier 2026** (Update 3), identifies par decompilation et analyse comparative automatisees. Apres deux patchs mineurs, il s'agit de la premiere mise a jour majeure depuis le lancement de l'Early Access de Hytale.
:::

## Vue d'ensemble

| Metrique | Ancienne version | Nouvelle version | Delta |
|----------|-----------------|------------------|-------|
| Taille du JAR | 84 MB | 125 MB | +49% |
| Fichiers Java | 15 425 | 15 826 | +401 |
| Fichiers Hytale nouveaux | - | 98 | - |
| Fichiers Hytale supprimes | 34 | - | - |
| Fichiers Hytale modifies | - | 1 706 | - |
| Version config serveur | 3 | 4 | +1 |

### Nouvelles dependances

- **RocksDB** : Nouveau moteur de stockage de chunks (binaires natifs inclus pour Linux, macOS, Windows)
- **Sentry** : Integration telemetrie amelioree (sessions, contexte OS, asset packs)

---

## 1. Protocole reseau

### 1.1 Architecture multi-canal

Le protocole passe d'un canal unique a **3 canaux** de communication independants :

```java
public enum NetworkChannel {
    Default(0),    // Paquets de jeu standard
    Chunks(1),     // Streaming de chunks/monde
    WorldMap(2);   // Donnees de carte du monde
}
```

**Interface `Packet` modifiee** :
```java
// AVANT
public interface Packet {
    int getId();
    void serialize(ByteBuf buf);
    int computeSize();
}

// APRES
public interface Packet {
    int getId();
    NetworkChannel getChannel();  // NOUVEAU
    void serialize(ByteBuf buf);
    int computeSize();
}
```

### 1.2 Typage directionnel des paquets

Deux nouvelles interfaces marker pour distinguer la direction des paquets a la compilation :

```java
public interface ToClientPacket extends Packet {}  // Serveur -> Client
public interface ToServerPacket extends Packet {}  // Client -> Serveur
```

`CachedPacket` est maintenant restreint a `ToClientPacket` uniquement, empechant le cache de paquets serveur.

### 1.3 Systeme ComponentUpdate (26 types)

Nouvelle architecture **ECS polymorphique** pour les mises a jour d'entites. Au lieu d'envoyer l'etat complet, seuls les composants modifies sont transmis :

```java
public abstract class ComponentUpdate {
    public static ComponentUpdate deserialize(ByteBuf buf, int offset) {
        int typeId = VarInt.peek(buf, offset);
        return switch (typeId) {
            case 0  -> NameplateUpdate.deserialize(...);
            case 1  -> UIComponentsUpdate.deserialize(...);
            case 2  -> CombatTextUpdate.deserialize(...);
            // ... 23 autres types
            case 25 -> PropUpdate.deserialize(...);
            default -> throw ProtocolException.unknownPolymorphicType(...);
        };
    }
}
```

**Registre complet des ComponentUpdate :**

| ID | Classe | Taille | Description |
|----|--------|--------|-------------|
| 0 | `NameplateUpdate` | Variable | Texte du nameplate |
| 1 | `UIComponentsUpdate` | Variable | Elements UI de l'entite |
| 2 | `CombatTextUpdate` | Variable | Nombres de degats/soin |
| 3 | `ModelUpdate` | Variable | Modele 3D + echelle |
| 4 | `PlayerSkinUpdate` | Variable | Skin du joueur (nullable) |
| 5 | `ItemUpdate` | Variable | Item tenu + metadonnees |
| 6 | `BlockUpdate` | 8 octets | ID bloc + echelle |
| 7 | `EquipmentUpdate` | Variable | Armure + mains (bitfield nullable) |
| 8 | `EntityStatsUpdate` | Variable | Map stat ID -> valeurs |
| 9 | `TransformUpdate` | 49 octets | Position + rotation + echelle |
| 10 | `MovementStatesUpdate` | 22 octets | Etats de mouvement |
| 11 | `EntityEffectsUpdate` | Variable | Effets de statut |
| 12 | `InteractionsUpdate` | Variable | Interactions disponibles + hint |
| 13 | `DynamicLightUpdate` | 4 octets | Lumiere dynamique RGB |
| 14 | `InteractableUpdate` | Variable | Hint d'interaction (nullable) |
| 15 | `IntangibleUpdate` | 0 octets | Marqueur intangible |
| 16 | `InvulnerableUpdate` | 0 octets | Marqueur invulnerable |
| 17 | `RespondToHitUpdate` | 0 octets | Marqueur reaction au hit |
| 18 | `HitboxCollisionUpdate` | 4 octets | Index config collision |
| 19 | `RepulsionUpdate` | 4 octets | Index config repulsion |
| 20 | `PredictionUpdate` | 16 octets | UUID prediction client |
| 21 | `AudioUpdate` | Variable | IDs d'evenements sonores |
| 22 | `MountedUpdate` | Variable | Etat de monture |
| 23 | `NewSpawnUpdate` | 0 octets | Marqueur nouveau spawn |
| 24 | `ActiveAnimationsUpdate` | Variable | Animations en cours |
| 25 | `PropUpdate` | 0 octets | Marqueur prop |

### 1.4 Nouveaux paquets

| Paquet | Direction | ID | Description |
|--------|-----------|-----|-------------|
| `CreateUserMarker` | Client->Serveur | 246 | Placement de marqueur carte |
| `BuilderToolSetEntityCollision` | Client->Serveur | 425 | Modifier collision entite |
| `UpdateAnchorUI` | Serveur->Client | 235 | Mise a jour UI dynamique (compresse) |
| `MapMarkerComponent` (4 sous-types) | - | - | Composants polymorphiques de marqueur |

**Sous-types MapMarkerComponent :**
- Type 0 : `PlayerMarkerComponent` - Position joueur (UUID, 16 octets)
- Type 1 : `PlacedByMarkerComponent` - Marqueur place par joueur (UUID + nom formate)
- Type 2 : `HeightDeltaIconComponent` - Delta d'altitude avec icones (17+ octets)
- Type 3 : `TintComponent` - Teinte couleur RGB (3 octets)

### 1.5 Serialisation

Patterns de serialisation utilises dans les ComponentUpdate :

- **Bitfield nullable** : 1 octet pour tracker jusqu'a 8 champs optionnels
- **VarInt** : Entiers a longueur variable pour les tailles
- **Offset addressing** : Header fixe avec offsets vers les donnees variables
- **Validation** : `validateStructure()` sur chaque type pour prevenir les buffer overflow
- **Limite** : Arrays limites a 4 096 000 elements max

---

## 2. Generation du monde

### 2.1 Refonte du systeme de biomes

**Supprime :**
- `BiomeType.java`, `SimpleBiomeType.java` (systeme par types)
- `biomemap/` (repertoire entier)
- `Indexer.java` (indexation globale)
- `AllStoneMaterialProvider`, `GrassTopMaterialProvider` (materiaux specifiques)
- `CeilingPattern` (patterns de terrain)
- `SpherePositionProvider`, `VerticalEliminatorPositionProvider`
- `Reference.java`, `BaseHeightReference.java`

**Remplace par :**
```java
// Nouveau : Interface propre
public interface Biome extends MaterialSource, PropsSource,
                               EnvironmentSource, TintSource {
    // Sources composees via interfaces
}

// Implementation concrete
public class SimpleBiome implements Biome {
    // Densite terrain, materiaux, props, environnement, teinte
}
```

### 2.2 Systeme Registry generique

```java
public class Registry<T> {
    private Map<T, Integer> objectToId;
    private Map<Integer, T> idToObject;

    public int getIdOrRegister(T object);  // Auto-assign ID
    public T getObject(int id);
    public int size();
    public void forEach(BiConsumer<Integer, T> consumer);
}
```

Remplace l'ancien `Indexer` par un mapping bidirectionnel generique type-safe.

### 2.3 WorldStructure

Nouveau conteneur encapsulant la structure du monde :

```java
public class WorldStructure {
    BiCarta<Integer> biomeMap;          // Carte 2D des biomes
    Registry<Biome> biomeRegistry;      // Registre des biomes
    int biomeTransitionDistance;         // Zone de transition
    int maxBiomeEdgeDistance;            // Distance max bord
    PositionProvider spawnPositions;     // Points de spawn
}
```

### 2.4 Nouveaux Position Providers

| Classe | Description |
|--------|-------------|
| `BoundPositionProvider` | Contraint les positions dans des limites 3D |
| `SimpleHorizontalPositionProvider` | Filtre par range Y |
| `FrameworkPositionProviderAsset` | Reference des definitions reutilisables |

### 2.5 Nouveaux Props

| Classe | Description |
|--------|-------------|
| `OffsetProp` | Deplace un prop enfant par un vecteur 3D |
| `WeightedProp` | Selection aleatoire ponderee parmi plusieurs props |

### 2.6 Systeme Framework

Nouveau pattern pour des assets reutilisables entre biomes :

- `PositionsFrameworkAsset` : Positions nommees accessibles globalement
- `DecimalConstantsFrameworkAsset` : Constantes numeriques partagees

### 2.7 Densite par hauteur

```java
public class YSampledDensity {
    // Cache les valeurs de densite a 2 positions Y
    // Interpole lineairement entre les echantillons
    // Optimise les calculs de terrain en hauteur
}
```

### 2.8 Chargement d'assets versionne

```java
record WorldGenConfig(Path path, String name, Semver version);

public class AssetFileSystem {
    // Charge les assets worldgen depuis des packs versionnes
    // Respecte le versioning semantique
    // Cache les ressources par chemin
}
```

---

## 3. Nouveaux systemes de gameplay

### 3.1 Random Tick (nouveau module)

Systeme de ticks aleatoires pour l'evolution dynamique du monde :

**Configuration :**
- **Blocs stables** : 1 tick par section par tick serveur
- **Blocs instables** : 3 ticks aleatoires par section par tick serveur
- Randomisation deterministe basee sur `hash(tick/interval, x, y, z)`

**Procedures disponibles :**

**ChangeIntoBlockProcedure** : Transformation simple de bloc
- `TargetBlock` (String) : Bloc cible de la transformation
- Cas d'usage : Maturation de plantes, degradation, fonte de glace

**SpreadToProcedure** : Propagation de blocs avec conditions environnementales
- `SpreadDirections` (Vector3i[]) : Directions de propagation
- `MinY` / `MaxY` (int) : Range vertical
- `AllowedTag` (String) : Tag des blocs cibles
- `RequireEmptyAboveTarget` (boolean) : Air au-dessus requis (defaut : true)
- `RequiredLightLevel` (int) : Luminosite minimum (defaut : 6)
- `RevertBlock` (String) : Bloc de reversion si couvert

**Cas d'usage :** Herbe qui pousse (necessite lumiere, revient en terre dans le noir), mousse, vigne, feu.

### 3.2 Creative Hub (nouveau module)

Espaces creatifs isoles avec gestion d'instances :

- **Instance pooling** : 1 hub par monde parent, reutilise
- **Creation duale** : Templates pre-construits OU generation procedurale (Flat, Hytale, etc.)
- **Teleportation safe** : Gere les mondes en cours de chargement
- **Persistance** : Memorise la derniere position par joueur/monde
- **Bouton retour** : UI conditionnelle via `AnchorActionModule`
- **Nettoyage automatique** : Supprime les instances invalides

### 3.3 Systeme de teleporteurs

- **Suivi de destination** : UUID du monde + position precise
- **Zone de clear-out** : Rayons XZ et Y pour detecter la sortie de l'effet
- **Cooldown global** : 100ms entre utilisations
- **Sync visuelle** : Met a jour l'etat du bloc teleporteur (Actif/Defaut)
- **Multi-monde** : Teleportation cross-monde avec nettoyage

### 3.4 Systeme de memoires (Memories)

Mecanique de decouverte progressive :

- **Declenchement par bloc** : Chaque memoire liee a une position de bloc
- **UI de notification** : Page personnalisee a la decouverte
- **Bouton actionnable** : "Decouvrir les memoires" -> interface collection
- **Commande admin** : `MemoriesSetCountCommand` pour gerer le compteur

### 3.5 Notifications de sommeil

Comportement adaptatif selon la taille du serveur :

| Taille serveur | Requis | Affichage |
|----------------|--------|-----------|
| Petit (4 joueurs ou moins) | 1 joueur qui dort suffit | Nom du joueur qui dort |
| Grand (plus de 4 joueurs) | 50% des joueurs doivent dormir | Nombre de joueurs dormant |

- Cooldown de notification : 100ms+
- Son distinct pour boucle auto vs entree manuelle
- Couleur chat : Teal (#5AB5B5)

### 3.6 Systeme de feu (Fire Fluid)

Le feu se propage comme un fluide avec des regles de flammabilite :

- **Configuration par tags** : Patterns de blocks flammables
- **Priorite** : Configs multiples avec ordre de priorite
- **Probabilite** : Chance de bruler par tick
- **Substitution** : Bloc brule -> resultat configure (cendres, charbon, etc.)
- **Propagation cross-section** : Traverse les limites de chunks

### 3.7 Marqueurs de carte du monde (refonte)

**MapMarkerTracker** (par joueur) :
- Culling par distance de vue
- Delta updates (seuls les changements envoyes)
- Seuil de mouvement : >5.0 blocs (grand), >0.1 blocs (petit)
- Seuil de rotation : >0.05 radians
- Filtre optionnel par joueur

**MapMarkerBuilder** (API fluente) :
```java
new MapMarkerBuilder()
    .name(message)
    .icon("marker_quest")
    .position(transform)
    .contextMenuItems(items)
    .addComponent(new TintComponent(color))
    .build();
```

### 3.8 Objectifs et quetes

- **ObjectiveTaskMarker** : Marqueurs de tache sur la carte avec icone et nom localise
- **ReachLocationMarkerAsset** : Zones de detection basees sur un rayon (nouveau champ `radius`)
- **StartObjectiveInteraction** : Demarrer un objectif depuis un item

---

## 4. Builder Tools

### 4.1 LayerCommand (nouvelle commande)

Edition multi-couches directionnelle :

- 6 directions cardinales (up/down/north/south/east/west)
- Support camera-relative
- Donnees par paires : count + type de bloc
- Requiert permissions builder

### 4.2 PasteToolUtil (nouvel utilitaire)

Gestion intelligente de l'outil paste dans l'inventaire :

- Hierarchie de recherche : Hotbar -> Storage -> Tools
- Si trouve hors hotbar : deplace automatiquement
- Remplit les slots vides en priorite
- Sync du slot actif via paquet

### 4.3 BuilderToolSetEntityCollision (nouveau paquet)

Permet aux builders de modifier le type de collision d'une entite (solid, trigger, none).

---

## 5. Infrastructure serveur

### 5.1 Systeme de mise a jour automatique (nouveau)

**Package** : `com.hypixel.hytale.server.core.update`

**Modes d'application automatique :**

| Mode | Description |
|------|-------------|
| `DISABLED` | Jamais d'auto-application |
| `WHEN_EMPTY` | Applique quand aucun joueur connecte |
| `SCHEDULED` | Applique apres un delai configurable |

**Configuration** (nouvelle section dans config.json v4) :
```json
{
  "Update": {
    "Enabled": true,
    "CheckIntervalSeconds": 3600,
    "NotifyPlayersOnAvailable": true,
    "Patchline": null,
    "RunBackupBeforeUpdate": true,
    "BackupConfigBeforeUpdate": true,
    "AutoApplyMode": "DISABLED",
    "AutoApplyDelayMinutes": 30
  }
}
```

**Variable d'environnement** : `HYTALE_DISABLE_UPDATES` pour desactiver completement.

### 5.2 Systeme de backup (nouveau)

```json
{
  "Backup": {
    "Enabled": false,
    "FrequencyMinutes": 30,
    "Directory": "./backups",
    "MaxCount": 5,
    "ArchiveMaxCount": 5
  }
}
```

### 5.3 AnchorActionModule (nouveau)

Systeme d'actions interactives liees a des points d'ancrage UI :

```java
// Enregistrer un handler simple
AnchorActionModule.get().register("my_action", (playerRef, jsonData) -> {
    String value = jsonData.get("key").getAsString();
    // Traiter l'action
});

// Handler thread-safe monde
AnchorActionModule.get().register("block_action",
    (playerRef, entityRef, store, jsonData) -> {
    // Execute sur le thread du monde
});
```

### 5.4 Configuration serveur v4

**Nouveaux champs** :
- `Update` : Configuration des mises a jour automatiques
- `Backup` : Configuration des sauvegardes automatiques
- `DefaultModsEnabled` : Activation des mods par defaut (migre depuis v3)
- `SkipModValidationForVersion` : Ignorer la validation de mods

**Migration v3 -> v4** : Automatique, `DefaultModsEnabled` mis a `true` par defaut.

### 5.5 Authentification

- Nouveau `ProfileServiceClient` (remplace `AuthUtil`)
- Nouveau `SessionServiceClient` avec `GameProfile` (username + UUID)
- Tokens par variables d'environnement : `HYTALE_SERVER_SESSION_TOKEN`, `HYTALE_SERVER_IDENTITY_TOKEN`
- Validation des tokens au demarrage avec erreur fatale si invalides

### 5.6 Stockage RocksDB

Nouveau provider de stockage pour les chunks :

- Double colonne : Default + chunks specialises
- Compression duale : LZ4 (rapide) + ZSTD (profond)
- Bloom filtering pour lookups efficaces
- Compaction par niveaux avec priorite de ratio
- Blob files pour les grandes valeurs
- I/O parallele configurable
- Commande maintenance : `/world rocksdb compact`

### 5.7 Telemetrie Sentry amelioree

| Aspect | Avant | Apres |
|--------|-------|-------|
| Detection build dev | Manuelle | `ManifestUtil.isJar()` |
| Sessions | Non | `startSession()`/`endSession()` |
| Contexte utilisateur | Hardware UUID | User object avec auth |
| Contexte OS | Non | Nom + version |
| Plugins externes | Liste | Tag `has-plugins: bool` |
| Asset packs | Non | Liste avec versions + immutabilite |

### 5.8 Commande Git integree

`GitCommand` remplace `UpdateCommand` : commande git integree directement dans le serveur.

### 5.9 UIGalleryCommand

Nouvelle commande `/uigallery` avec page dediee pour previewer les composants UI.

---

## 6. Infrastructure et frameworks

### 6.1 Performance : Cache de hash pour Ref

```java
// AVANT : Calcul a chaque appel
public int hashCode() {
    return 31 * store.hashCode() + index;
}

// APRES : Hash cache, recalcule a l'invalidation
private transient volatile int hashCode;

public Ref(Store<T> store, int index) {
    this.hashCode = this.hashCode0();  // Cache immediat
}

public int hashCode() {
    return this.hashCode;  // O(1)
}
```

### 6.2 Registry : Methode de shutdown

```java
// NOUVEAU
public void shutdownAndCleanup(boolean shutdown) {
    this.enabled = false;
    for (int i = registrations.size() - 1; i >= 0; i--) {
        registrations.get(i).accept(shutdown);
    }
    registrations.clear();
}
```

### 6.3 Systeme de schemas (nouveau)

**Package** : `codec/schema/metadata/`

Annotations metadata pour la generation de documentation et l'integration avec l'editeur :

- `HytaleType`, `VirtualPath`, `AllowEmptyObject`, `NoDefaultValue`
- Sous-package UI : `UIButton`, `UIEditor`, `UIDisplayMode`, `UIPropertyTitle`, `UITypeIcon`, etc.
- Package config : `Schema`, `ObjectSchema`, `ArraySchema`, `StringSchema`, etc.

### 6.4 Ordre d'initialisation des modules

```
ConsoleModule          (0)  - Console
PermissionsModule      (1)  - Permissions
UpdateModule           (2)  - NOUVEAU : Mises a jour
FlyCameraModule        (3)  - Camera
AssetModule            (4)  - Assets
...
TimeModule            (19)  - Temps
AnchorActionModule    (20)  - NOUVEAU : Actions d'ancrage
InteractionModule     (21)  - Interactions
...
```

---

## 7. Fichiers supprimes

| Fichier | Raison |
|---------|--------|
| `biomemap/` (repertoire) | Remplace par `Registry` + `BiCarta` |
| `Indexer.java` | Remplace par `Registry` generique |
| `BiomeType.java`, `SimpleBiomeType.java` | Remplace par `Biome` interface |
| `SpherePositionProvider.java` | Remplace par nouveaux providers |
| `VerticalEliminatorPositionProvider.java` | Remplace par nouveaux providers |
| `AllStoneMaterialProvider.java` | Simplifie |
| `GrassTopMaterialProvider.java` | Simplifie |
| `CeilingPattern.java` | Remplace par density sampling |
| `Reference.java`, `BaseHeightReference.java` | Remplace par `ReferenceBundle` + Frameworks |
| `Equipment.java` | Refactore en `EquipmentUpdate` |
| `Nameplate.java` | Refactore en `NameplateUpdate` |
| `UpdateCommand.java` | Remplace par `GitCommand` |
| `AuthUtil.java` | Remplace par `ProfileServiceClient` |

---

## 8. Compatibilite

### Changements non-cassants

- Tous les IDs de paquets existants inchanges
- Migration automatique config v3 -> v4
- Tous les nouveaux modules optionnels (verification null)
- Kill switch pour les mises a jour automatiques
- Pas d'API deprecees

### Changements cassants (pour les developpeurs de plugins)

- Interface `Packet` : nouvelle methode `getChannel()` requise
- `CachedPacket` restreint a `ToClientPacket`
- `Ref.validate(Store)` supprime (utiliser `validate()` sans argument)

---

:::tip Pour les developpeurs de plugins
Si vous maintenez un plugin, l'action principale requise est d'implementer la nouvelle methode `getChannel()` sur vos implementations de `Packet` personnalisees. Retournez `NetworkChannel.Default` pour les paquets standard.
:::

*Documentation generee par analyse comparative automatisee des sources decompilees.*
*Date : 17 fevrier 2026*
