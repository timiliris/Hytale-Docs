---
id: worldgen
title: "Systeme de generation du monde"
sidebar_label: Generation du monde
sidebar_position: 11
description: Documentation complete de l'architecture de generation du monde du serveur Hytale - Systeme de biomes, fonctions de densite, props, position providers, systeme de frameworks et pipeline de chargement des assets.
---

# Systeme de generation du monde

:::info Source
Cette documentation couvre l'architecture de generation du monde du serveur Hytale, incluant le nouveau systeme `builtin.hytalegenerator` et l'ancienne infrastructure `server.worldgen`. Basee sur les sources decompilees du JAR serveur Hytale.
:::

## Vue d'ensemble de l'architecture

Le systeme de generation du monde de Hytale est divise en deux couches principales :

| Couche | Package | Objectif |
|---|---|---|
| **Nouveau generateur** | `com.hypixel.hytale.builtin.hytalegenerator` | Worldgen composable pilotee par assets avec fonctions de densite, props, biomes et frameworks |
| **Ancienne infrastructure** | `com.hypixel.hytale.server.worldgen` | Ancien systeme base sur zones/climat avec donnees de biomes par conteneurs et loaders JSON |

Le nouveau systeme (`hytalegenerator`) utilise un **pipeline entierement base sur les assets** ou toute la configuration worldgen est deserialisee depuis JSON via les classes `BuilderCodec` / `AssetBuilderCodec`, puis assemblee en objets runtime via des methodes `build()` explicites. L'ancien systeme utilisait des loaders JSON cables manuellement avec une hierarchie de conteneurs rigide.

**Flux du point d'entree :**

```
HytaleWorldGenProvider.getGenerator()
  -> WorldGenConfig(path, name, version)
  -> ChunkGeneratorJsonLoader.load()
  -> AssetManager charge BiomeAsset, WorldStructureAsset, DensityAsset, etc.
  -> BasicWorldStructureAsset.build() -> WorldStructure
  -> BiomeAsset.build() -> SimpleBiome
```

Source : `server/worldgen/HytaleWorldGenProvider.java`

```java
// HytaleWorldGenProvider.java, lignes 57-83
public IWorldGen getGenerator() throws WorldGenLoadException {
    Path worldGenPath;
    if (this.path != null) {
        worldGenPath = Path.of(this.path);
        if (!PathUtil.isInTrustedRoot(worldGenPath)) {
            throw new WorldGenLoadException(
                "World gen path must be within a trusted directory: " + this.path);
        }
    } else {
        worldGenPath = Universe.getWorldGenPath();
    }

    if (!"Default".equals(this.name)
            || !Files.exists(worldGenPath.resolve("World.json"))) {
        Path resolved = PathUtil.resolvePathWithinDir(worldGenPath, this.name);
        if (resolved == null) {
            throw new WorldGenLoadException("Invalid world gen name: " + this.name);
        }
        worldGenPath = resolved;
    }

    try {
        WorldGenConfig config = new WorldGenConfig(worldGenPath, this.name, this.version);
        return new ChunkGeneratorJsonLoader(
            new SeedString<>("ChunkGenerator",
                new SeedStringResource(PrefabStoreRoot.DEFAULT, config)),
            config
        ).load();
    } catch (Error var3) {
        throw new WorldGenLoadException("Failed to load world gen!", var3);
    }
}
```

---

## Systeme de biomes

Le nouveau systeme de biomes remplace l'ancienne classe abstraite monolithique `Biome` par une **hierarchie d'interfaces composables**. Un biome est maintenant defini en combinant quatre interfaces source independantes.

### L'interface Biome

**Fichier :** `builtin/hytalegenerator/biome/Biome.java`

```java
package com.hypixel.hytale.builtin.hytalegenerator.biome;

import com.hypixel.hytale.builtin.hytalegenerator.density.Density;
import javax.annotation.Nonnull;

public interface Biome extends MaterialSource, PropsSource, EnvironmentSource, TintSource {
    String getBiomeName();

    @Nonnull
    Density getTerrainDensity();
}
```

L'interface `Biome` compose quatre interfaces source :

| Interface | Methode | Retour | Objectif |
|---|---|---|---|
| `MaterialSource` | `getMaterialProvider()` | `MaterialProvider<Material>` | Determine les materiaux de blocs a chaque position |
| `PropsSource` | `getPropFields()` / `getAllPropDistributions()` | `List<PropField>` / `List<Assignments>` | Definit les regles de placement de props |
| `EnvironmentSource` | `getEnvironmentProvider()` | `EnvironmentProvider` | Controle les effets environnementaux (eclairage, brouillard, etc.) |
| `TintSource` | `getTintProvider()` | `TintProvider` | Controle la teinte des blocs/vegetation |

### Interfaces source

Chaque interface source est minimale et mono-objectif :

```java
public interface MaterialSource {
    MaterialProvider<Material> getMaterialProvider();
}

public interface PropsSource {
    List<PropField> getPropFields();
    List<Assignments> getAllPropDistributions();
}

public interface EnvironmentSource {
    EnvironmentProvider getEnvironmentProvider();
}

public interface TintSource {
    TintProvider getTintProvider();
}
```

### SimpleBiome -- L'implementation par defaut

**Fichier :** `builtin/hytalegenerator/biome/SimpleBiome.java`

`SimpleBiome` est l'implementation concrete de `Biome` utilisee pour tous les biomes standard. Elle contient des references directes a tous les providers et supporte l'ajout dynamique d'instances `PropField`.

```java
public class SimpleBiome implements Biome {
    @Nonnull private final Density terrainDensity;
    @Nonnull private final MaterialProvider<Material> materialProvider;
    @Nonnull private final List<PropField> propFields;
    @Nonnull private final EnvironmentProvider environmentProvider;
    @Nonnull private final TintProvider tintProvider;
    @Nonnull private final String biomeName;

    public SimpleBiome(
        @Nonnull String biomeName,
        @Nonnull Density terrainDensity,
        @Nonnull MaterialProvider<Material> materialProvider,
        @Nonnull EnvironmentProvider environmentProvider,
        @Nonnull TintProvider tintProvider
    ) {
        this.terrainDensity = terrainDensity;
        this.materialProvider = materialProvider;
        this.biomeName = biomeName;
        this.propFields = new ArrayList<>();
        this.environmentProvider = environmentProvider;
        this.tintProvider = tintProvider;
    }

    public void addPropFieldTo(@Nonnull PropField propField) {
        this.propFields.add(propField);
    }

    @Nonnull
    @Override
    public List<Assignments> getAllPropDistributions() {
        ArrayList<Assignments> list = new ArrayList<>();
        for (PropField f : this.propFields) {
            list.add(f.getPropDistribution());
        }
        return list;
    }
}
```

### BiomeAsset -- Comment les biomes sont construits depuis JSON

**Fichier :** `builtin/hytalegenerator/assets/biomes/BiomeAsset.java`

La classe `BiomeAsset` definit le schema JSON et le processus de construction des biomes. Champs JSON principaux :

| Cle JSON | Type d'asset | Defaut | Requis |
|---|---|---|---|
| `"Name"` | `String` | `"DefaultName"` | Oui |
| `"Terrain"` | `TerrainAsset` | `DensityTerrainAsset` | Oui |
| `"MaterialProvider"` | `MaterialProviderAsset` | `ConstantMaterialProviderAsset` | Oui |
| `"Props"` | `PropRuntimeAsset[]` | `[]` | Oui |
| `"EnvironmentProvider"` | `EnvironmentProviderAsset` | `ConstantEnvironmentProviderAsset` | Oui |
| `"TintProvider"` | `TintProviderAsset` | `ConstantTintProviderAsset` | Oui |
| `"FloatingFunctionNodes"` | `DensityAsset[]` | `[]` | Oui |

```java
// BiomeAsset.java - methode build
public Biome build(
    @Nonnull MaterialCache materialCache,
    @Nonnull SeedBox parentSeed,
    @Nonnull ReferenceBundle referenceBundle,
    @Nonnull WorkerIndexer.Id workerId
) {
    MaterialProvider<Material> materialProvider = this.materialProviderAsset
        .build(new MaterialProviderAsset.Argument(
            parentSeed, materialCache, referenceBundle, workerId));

    Density density = this.terrainAsset
        .buildDensity(parentSeed, referenceBundle, workerId);

    EnvironmentProvider provider = EnvironmentProvider.noEnvironmentProvider();
    if (this.environmentProviderAsset != null) {
        provider = this.environmentProviderAsset.build(
            new EnvironmentProviderAsset.Argument(
                parentSeed, materialCache, referenceBundle, workerId));
    }

    TintProvider tints = TintProvider.noTintProvider();
    if (this.tintProviderAsset != null) {
        tints = this.tintProviderAsset.build(
            new TintProviderAsset.Argument(
                parentSeed, materialCache, referenceBundle, workerId));
    }

    SimpleBiome biome = new SimpleBiome(
        this.biomeName, density, materialProvider, provider, tints);

    for (PropRuntimeAsset fieldAsset : this.propRuntimeAssets) {
        if (!fieldAsset.isSkip()) {
            PositionProvider positionProvider = fieldAsset
                .buildPositionProvider(parentSeed, referenceBundle, workerId);
            Assignments distribution = fieldAsset
                .buildPropDistribution(parentSeed, materialCache,
                    fieldAsset.getRuntime(), referenceBundle, workerId);
            PropField field = new PropField(
                fieldAsset.getRuntime(), distribution, positionProvider);
            biome.addPropFieldTo(field);
        }
    }
    return biome;
}
```

### PropField -- Connecter positions et props

**Fichier :** `builtin/hytalegenerator/PropField.java`

Un `PropField` relie un `PositionProvider` (ou placer les props), un objet `Assignments` (quoi placer), et un entier de phase runtime (quand le placer pendant la generation).

```java
public class PropField {
    @Nonnull private final Assignments assignments;
    @Nonnull private final PositionProvider positionProvider;
    private final int runtime;

    public PropField(int runtime,
                     @Nonnull Assignments assignments,
                     @Nonnull PositionProvider positionProvider) {
        this.runtime = runtime;
        this.assignments = assignments;
        this.positionProvider = positionProvider;
    }
}
```

---

## Systeme Registry

**Fichier :** `builtin/hytalegenerator/Registry.java`

La classe `Registry<T>` fournit un **mapping bidirectionnel generique** entre objets et IDs entiers auto-incrementes. Elle est utilisee dans tout le generateur pour assigner des IDs numeriques stables aux biomes et autres objets enregistres.

```java
public class Registry<T> {
    private Map<T, Integer> objectToId = new HashMap<>();
    private Map<Integer, T> idToObject = new HashMap<>();

    public int getIdOrRegister(T object) {
        Integer id = this.objectToId.get(object);
        if (id != null) {
            return id;
        } else {
            id = this.objectToId.size();
            this.idToObject.put(id, object);
            this.objectToId.put(object, id);
            return id;
        }
    }

    public T getObject(int id) {
        return this.idToObject.get(id);
    }

    public int size() {
        return this.objectToId.size();
    }

    @Nonnull
    public List<T> getAllValues() {
        return new ArrayList<>(this.idToObject.values());
    }

    public void forEach(@Nonnull BiConsumer<Integer, T> consumer) {
        this.idToObject.forEach(consumer::accept);
    }
}
```

**Points de design cles :**

- **IDs auto-incrementes** : L'ID est derive de la taille courante de la map (`objectToId.size()`), donnant a chaque objet un entier sequentiel commencant a 0.
- **Enregistrement idempotent** : Appeler `getIdOrRegister()` sur un objet deja enregistre retourne l'ID existant sans creer de doublon.
- **Lookup bidirectionnel** : `objectToId` pour O(1) objet-vers-ID, `idToObject` pour O(1) ID-vers-objet.
- **Generique** : Utilise comme `Registry<Biome>` dans `WorldStructure`, mais applicable a tout type.

---

## WorldStructure

**Fichier :** `builtin/hytalegenerator/worldstructure/WorldStructure.java`

La classe `WorldStructure` est le resultat de haut niveau de la construction d'une definition de monde. Elle relie la carte des biomes, le registre des biomes, les parametres de transition et les positions de spawn.

```java
public class WorldStructure {
    @Nonnull private final BiCarta<Integer> biomeMap;
    @Nonnull private final Registry<Biome> biomeRegistry;
    private final int biomeTransitionDistance;
    private final int maxBiomeEdgeDistance;
    @Nonnull private final PositionProvider spawnPositions;
}
```

### BiCarta -- Fonction de mapping 2D abstraite

`BiCarta<R>` est une fonction abstraite qui mappe des coordonnees entieres 2D (x, z) vers une valeur de type `R`. C'est le fondement du systeme de distribution des biomes.

```java
public abstract class BiCarta<R> {
    public abstract R apply(int x, int z, @Nonnull WorkerIndexer.Id id);
    public abstract List<R> allPossibleValues();
}
```

### SimpleNoiseCarta -- Mapping de biomes par bruit

L'implementation concrete utilisee pour la distribution des biomes. Elle evalue une fonction `Density` en (x, z) et utilise un `DoubleRangeMap` pour mapper la valeur de bruit resultante vers un ID de biome.

```java
public class SimpleNoiseCarta<T> extends BiCarta<T> {
    @Nonnull private final Density density;
    @Nonnull private final DoubleRangeMap<T> rangeMap;
    private final T defaultValue;

    @Override
    public T apply(int x, int z, @Nonnull WorkerIndexer.Id id) {
        Density.Context context = new Density.Context();
        context.position = new Vector3d((double)x, 0.0, (double)z);
        double noiseValue = this.density.process(context);
        T value = this.rangeMap.get(noiseValue);
        return value == null ? this.defaultValue : value;
    }
}
```

### Transitions de biomes

Le champ `biomeTransitionDistance` controle la largeur de la zone de melange entre biomes adjacents. Il est borne a un minimum de 1 :

```java
int transitionDistance = Math.max(1, this.biomeTransitionDistance);
```

Le `maxBiomeEdgeDistance` controle la distance maximale depuis le bord d'un biome qui est tracee. Le `biomeTransitionDistance` par defaut est 32 et `maxBiomeEdgeDistance` est 0.

### BasicWorldStructureAsset -- Schema JSON

| Cle JSON | Type | Requis | Defaut | Validation |
|---|---|---|---|---|
| `"Biomes"` | `BiomeRangeAsset[]` | Oui | `[]` | -- |
| `"Density"` | `DensityAsset` | Oui | `ConstantDensityAsset` | -- |
| `"DefaultBiome"` | `String` (ref BiomeAsset) | Oui | `""` | Doit exister dans le store BiomeAsset |
| `"DefaultTransitionDistance"` | `int` | Oui | `32` | `> 0` |
| `"MaxBiomeEdgeDistance"` | `int` | Oui | `0` | `>= 0` |
| `"Framework"` | `FrameworkAsset[]` | Non | `[]` | -- |
| `"SpawnPositions"` | `PositionProviderAsset` | Non | `ListPositionProviderAsset` | -- |

---

## Position Providers

Les position providers definissent **ou** les choses se passent dans le monde -- points de spawn, emplacements de props, et plus encore.

### Catalogue complet des types

| Type | Classe | Objectif |
|---|---|---|
| Anchor | `AnchorPositionProviderAsset` | Positions relatives a un point d'ancrage |
| BaseHeight | `BaseHeightPositionProviderAsset` | Positions a la hauteur de base du terrain |
| Bound | `BoundPositionProviderAsset` | Contraint les positions dans des limites 3D |
| Cached | `CachedPositionProviderAsset` | Cache les positions pour reutilisation |
| FieldFunction | `FieldFunctionPositionProviderAsset` | Positions depuis une fonction de champ |
| FieldFunctionOccurrence | `FieldFunctionOccurrencePositionProviderAsset` | Positions conditionnelles de champ |
| Framework | `FrameworkPositionProviderAsset` | Reference nommee vers des entrees framework |
| Imported | `ImportedPositionProviderAsset` | Importe depuis un autre asset |
| List | `ListPositionProviderAsset` | Liste fixe de positions |
| Mesh2D | `Mesh2DPositionProviderAsset` | Positions basees sur un maillage 2D |
| Mesh3D | `Mesh3DPositionProviderAsset` | Positions basees sur un maillage 3D |
| Offset | `OffsetPositionProviderAsset` | Applique un decalage aux positions enfant |
| SimpleHorizontal | `SimpleHorizontalPositionProviderAsset` | Positions filtrees par range Y |
| Union | `UnionPositionProviderAsset` | Combine plusieurs providers |

---

## Systeme de props

Les props sont des objets places au-dessus du terrain genere -- arbres, rochers, fleurs, structures. Le systeme utilise une hierarchie composable basee sur la classe abstraite `Prop`.

### Placement en deux phases

Les props utilisent un pattern **scan-puis-place**. `scan()` examine le terrain a une position et retourne un `ScanResult` indiquant si le placement est valide. `place()` ecrit ensuite le prop dans l'espace voxel en utilisant ce resultat de scan.

### Catalogue complet des types de props

| Type | Classe | Objectif |
|---|---|---|
| Box | `BoxProp` | Place des blocs en forme de boite |
| Cluster | `ClusterProp` | Groupe plusieurs placements ensemble |
| Column | `ColumnProp` | Placement de colonne verticale |
| Density | `DensityProp` | Placement pilote par densite |
| Offset | `OffsetProp` | Decale la position du prop enfant |
| PondFiller | `PondFillerProp` | Remplit les etangs |
| Prefab | `PrefabProp` | Colle une structure prefabriquee |
| Queue | `QueueProp` | Execution sequentielle de props |
| Union | `UnionProp` | Combine plusieurs props |
| Weighted | `WeightedProp` | Selection aleatoire ponderee |
| No-op | `Prop.noProp()` | Ne fait rien (objet null) |

### Pattern de composabilite

```
WeightedProp
  +-- OffsetProp
  |     +-- PrefabProp("oak_tree")
  +-- OffsetProp
  |     +-- PrefabProp("birch_tree")
  +-- ClusterProp
        +-- BoxProp("bush")
```

---

## Systeme de densite

Le systeme de densite est l'epine dorsale mathematique de la generation de terrain. Un `Density` est une fonction abstraite qui traite un contexte 3D et retourne une valeur `double`. Ceux-ci sont composes en graphes de densite complexes.

### Catalogue des noeuds de densite (70+)

| Categorie | Noeuds |
|---|---|
| **Constantes** | `ConstantDensity`, `AmplitudeConstant`, `OffsetConstant` |
| **Bruit** | `SimplexNoise2d`, `SimplexNoise3D`, `CellNoise2D`, `CellNoise3D`, `GradientWarp`, `FastGradientWarp` |
| **Math** | `Abs`, `Ceiling`, `Floor`, `Pow`, `Sqrt`, `Clamp`, `SmoothClamp`, `Normalizer` |
| **Combinateurs** | `Sum`, `Multiplier`, `Min`, `Max`, `SmoothMin`, `SmoothMax`, `Mix`, `MultiMix` |
| **Transformations** | `Scale`, `Offset`, `Amplitude`, `Rotator`, `Inverter`, `VectorWarp` |
| **Formes** | `Cube`, `Cuboid`, `Cylinder`, `Ellipsoid`, `Plane`, `Shell` |
| **Echantillonnage** | `YSampled`, `Cache`, `Cache2d (Deprecated)`, `Exported`, `Imported` |
| **Selection** | `Selector`, `Switch`, `SwitchState`, `Slider` |
| **Terrain** | `Terrain`, `BaseHeight`, `DistanceToBiomeEdge`, `CellWallDistance` |
| **Positions** | Divers noeuds dans `density/positions/` |
| **Axes** | `XValue`, `YValue`, `ZValue`, `XOverride`, `YOverride`, `ZOverride`, `Axis` |
| **Pipeline** | `Pipeline`, `Gradient`, `Anchor`, `Angle`, `Distance` |

### YSampledDensity -- Interpolation verticale

Optimisation critique de performance. Au lieu d'evaluer une fonction de densite couteuse a chaque coordonnee Y, `YSampledDensity` echantillonne a intervalles discrets le long de l'axe Y et **interpole lineairement** entre les echantillons.

- `SampleDistance` par defaut de 4.0 signifie seulement 1 evaluation de densite pour 4 niveaux Y, donnant un **speedup ~4x** pour les colonnes verticales.

---

## Systeme Framework

Le systeme de framework fournit un mecanisme pour definir des **assets reutilisables nommes** qui peuvent etre references par nom a travers plusieurs biomes et structures de monde.

### PositionsFrameworkAsset

Definit des position providers nommes qui peuvent etre references par `FrameworkPositionProviderAsset`.

```json
{
  "Type": "Positions",
  "Entries": [
    {
      "Name": "TreePositions",
      "Positions": { "Type": "Mesh2D", "..." : "..." }
    }
  ]
}
```

### DecimalConstantsFrameworkAsset

Definit des constantes `double` nommees referencables par les noeuds de densite et autres assets.

```json
{
  "Type": "DecimalConstants",
  "Entries": [
    { "Name": "SeaLevel", "Value": 64.0 },
    { "Name": "MountainHeight", "Value": 200.0 }
  ]
}
```

### Flux d'utilisation

```
WorldStructure JSON
  -> Framework[] array
     -> PositionsFrameworkAsset.build() -> ReferenceBundle["Positions"]
     -> DecimalConstantsFrameworkAsset.build() -> ReferenceBundle["DecimalConstants"]
  -> Biome[] array
     -> Les position providers de chaque biome peuvent utiliser FrameworkPositionProviderAsset("TreePositions")
     -> Resolu depuis ReferenceBundle au moment du build
```

---

## Chargement des assets

### WorldGenConfig

```java
public record WorldGenConfig(
    @Nonnull Path path,
    @Nonnull String name,
    @Nonnull Semver version
) {}
```

| Champ | Type | Objectif |
|---|---|---|
| `path` | `Path` | Chemin du repertoire de donnees worldgen |
| `name` | `String` | Nom du generateur (defaut : `"Default"`) |
| `version` | `Semver` | Version semantique pour le chargement d'assets versionnes |

### AssetFileSystem

Caracteristiques cles :
- **Cache de ressources** : `load()` cache les ressources chargees par chemin
- **Normalisation de chemin** : Gestion cross-platform coherente
- **Ordre des packs** : Les packs non-versionnes ont priorite sur les packs versionnes ; le pack de base est toujours en dernier

---

## Ancien vs nouveau systeme

| Aspect | Ancien systeme | Nouveau systeme |
|---|---|---|
| Definition de biome | Classe abstraite 13 params | Composition de 4 interfaces |
| Sous-types de biome | `TileBiome`, `CustomBiome` | `SimpleBiome` unique |
| Distribution de biomes | `BiomePatternGenerator` (Voronoi + map ponderee) | `SimpleNoiseCarta` (densite + range map) |
| Couches de blocs | `LayerContainer` (couches statiques/dynamiques) | `MaterialProvider<Material>` |
| Couverture de surface | `CoverContainer` | Systeme `Prop` |
| Placement de props | `PrefabContainer` | `PropField` + `PositionProvider` + `Prop` |
| Chargement JSON | Classes `*JsonLoader` cablees | `BuilderCodec` / `AssetBuilderCodec` |
| Registre de biomes | Implicite (int id dans constructeur) | `Registry<Biome>` explicite |
| Config reutilisable | Aucune | Systeme `FrameworkAsset` (`Positions`, `DecimalConstants`) |
| Gestion des assets | Loaders disperses | `AssetManager` + `AssetStore` centralises |
| Structure du monde | Pipeline Zone/Climat | `WorldStructure` avec `BiCarta` + `Registry` |

---

## Annexe : Chemins des fichiers cles

| Composant | Chemin |
|---|---|
| Interface Biome | `builtin/hytalegenerator/biome/Biome.java` |
| SimpleBiome | `builtin/hytalegenerator/biome/SimpleBiome.java` |
| BiomeAsset | `builtin/hytalegenerator/assets/biomes/BiomeAsset.java` |
| Registry | `builtin/hytalegenerator/Registry.java` |
| WorldStructure | `builtin/hytalegenerator/worldstructure/WorldStructure.java` |
| PositionProvider | `builtin/hytalegenerator/positionproviders/PositionProvider.java` |
| Prop | `builtin/hytalegenerator/props/Prop.java` |
| Density | `builtin/hytalegenerator/density/Density.java` |
| AssetManager | `builtin/hytalegenerator/assets/AssetManager.java` |

Tous les chemins sont relatifs a `com/hypixel/hytale/`.

*Documentation generee par analyse automatisee des sources decompilees.*
