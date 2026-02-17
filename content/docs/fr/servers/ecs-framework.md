---
id: ecs-framework
title: "ECS et Framework Core"
sidebar_label: ECS Framework
sidebar_position: 14
description: Documentation de l'architecture ECS et des composants internes du framework du serveur Hytale - Systeme de references d'entites, cycle de vie des registres, metadonnees de schema, nouveaux composants, bibliotheque procedurale, systeme d'evenements et ordre d'initialisation des modules.
---

# ECS et Reference du Framework Core

Cette page documente l'architecture Entity Component System (ECS) et les composants internes du framework du serveur dedie Hytale. Elle couvre le systeme de references de composants bas niveau, la gestion du cycle de vie des registres, le pipeline de metadonnees de schema, les nouveaux composants, les utilitaires de generation procedurale, le systeme d'evenements et l'ordre d'initialisation des modules.

Toutes les references de code pointent vers les sources decompilees sous `decompiled/com/hypixel/hytale/`.

---

## Table des matieres

1. [Ref -- Systeme de reference d'entites](#1-ref----systeme-de-reference-dentites)
2. [Cycle de vie des registres](#2-cycle-de-vie-des-registres)
3. [Systeme de metadonnees de schema](#3-systeme-de-metadonnees-de-schema)
4. [Systeme de config de schema](#4-systeme-de-config-de-schema)
5. [Nouveaux composants](#5-nouveaux-composants)
6. [Changements de la bibliotheque procedurale](#6-changements-de-la-bibliotheque-procedurale)
7. [Systeme d'evenements](#7-systeme-devenements)
8. [Ordre d'initialisation des modules core](#8-ordre-dinitialisation-des-modules-core)

---

## 1. Ref -- Systeme de reference d'entites

**Source :** `component/Ref.java`

La classe `Ref` est le handle fondamental par lequel le code du jeu accede aux entites dans l'ECS. Chaque entite dans un `Store` est referencee par index a travers un `Ref`. La classe est generique, parametree par le type ECS. Elle est concue pour un acces a haut debit dans les boucles de jeu serees.

### Decisions de conception cles

- **`volatile int index`** -- Le champ index est declare `volatile`, ce qui signifie que les lectures et ecritures sont visibles entre les threads sans synchronisation. Ceci est critique car l'ECS traite les entites sur plusieurs threads pendant les ticks de systemes paralleles.
- **`volatile Throwable invalidatedBy`** -- Stocke la trace de pile du point d'invalidation, fournissant des informations de diagnostic quand une reference perimee est utilisee.
- **Valeur sentinelle** -- `Integer.MIN_VALUE` (`-2147483648`) marque une reference non initialisee ou invalidee.

### Mecanisme d'invalidation

Quand une entite est detruite ou que sa reference devient perimee, le `Store` appelle `invalidate()` :

1. Reinitialise l'index a la valeur sentinelle.
2. Capture un `Throwable` au point d'invalidation. Cette trace de pile est ensuite attachee a l'`IllegalStateException` lancee si la reference est accedee.

### Validation

Deux surcharges de validation existent :

- **`validate(Store)`** -- La validation complete verifie que la reference appartient au bon store ET que l'index n'est pas la sentinelle.
- **`validate()`** -- La validation simplifiee verifie uniquement l'index. Utilisee dans les chemins critiques.

### L'interface Component

Les composants d'entite implementent l'interface `Component` :

```java
public interface Component<ECS_TYPE> extends Cloneable {
   @Nonnull
   Component[] EMPTY_ARRAY = new Component[0];

   @Nullable
   Component<ECS_TYPE> clone();

   @Nullable
   default Component<ECS_TYPE> cloneSerializable() {
      return this.clone();
   }
}
```

Tous les composants doivent etre clonables. La methode `cloneSerializable()` par defaut delegue a `clone()` mais peut etre surchargee pour les composants qui serialisent differemment de leur clonage en memoire.

---

## 2. Cycle de vie des registres

**Source :** `registry/Registry.java`

La classe abstraite `Registry` gere le cycle de vie des enregistrements (handlers d'evenements, systemes, etc.) au sein des modules. Elle fournit des semantiques d'activation/desactivation et une nouvelle methode de nettoyage en masse.

### Flux d'enregistrement

Lors de l'enregistrement :

1. Si le registre est desactive, l'enregistrement est immediatement annule et une exception est lancee.
2. Un wrapper `BooleanConsumer` est cree qui appelle `unregister()` sur l'enregistrement.
3. La fonction d'encapsulation decore l'enregistrement avec un fournisseur `isEnabled` et un callback de desenregistrement.

### Methode shutdownAndCleanup

```java
public void shutdownAndCleanup(boolean shutdown) {
   this.enabled = false;
   for (int i = this.registrations.size() - 1; i >= 0; i--) {
      this.registrations.get(i).accept(shutdown);
   }
   this.registrations.clear();
}
```

Cette methode effectue un demontage complet :

1. **Desactive** le registre (empechant les nouveaux enregistrements).
2. **Itere les enregistrements en ordre inverse** (LIFO -- dernier enregistre, premier nettoye), garantissant un bon ordre de dependances pendant le demontage.
3. **Vide** la liste des enregistrements.

Le parametre `boolean shutdown` permet aux enregistrements de distinguer entre un arret complet du serveur et une desactivation au niveau du module.

### Classe de base Registration

Un `Registration` n'est reellement actif que lorsque `registered` est `true` et que le fournisseur `isEnabled` retourne `true`. Cette double verification empeche les appels de desenregistrement perimes de s'executer apres l'arret d'un registre.

---

## 3. Systeme de metadonnees de schema

**Source :** `codec/schema/metadata/`

Le systeme de metadonnees de schema fournit des annotations qui modifient la sortie du schema JSON. Celles-ci sont utilisees pour piloter les outils d'editeur de contenu de Hytale et pour generer des schemas de configuration pilotes par les donnees pour les assets.

### L'interface Metadata

```java
public interface Metadata {
   void modify(Schema var1);
}
```

Toutes les implementations de metadonnees recoivent une instance `Schema` et la mutent. C'est un pattern de type visiteur.

### Types de metadonnees core

| Classe | Objectif |
|--------|----------|
| `HytaleType` | Definit l'identifiant de type Hytale sur un schema |
| `VirtualPath` | Assigne un chemin de systeme de fichiers virtuel |
| `AllowEmptyObject` | Controle si un `{}` vide est valide |
| `NoDefaultValue` | Supprime la valeur par defaut d'un schema |

### Types de metadonnees UI

Toutes les classes de metadonnees UI controlent comment l'editeur de contenu Hytale rend les formulaires pilotes par schema.

#### UIDisplayMode

| Mode | Comportement |
|------|-------------|
| `NORMAL` | Champ d'editeur pleine taille |
| `COMPACT` | Affichage inline reduit |
| `HIDDEN` | Le champ n'est pas affiche dans l'UI de l'editeur |

#### UIEditor -- Composants disponibles

| Composant | Objectif |
|-----------|----------|
| `Timeline` | Editeur de timeline a keyframes |
| `WeightedTimeline` | Timeline avec valeurs de poids |
| `Number` | Nombre avec pas, suffixe, decimales |
| `Text` | Texte sur une ligne avec set de donnees optionnel |
| `MultilineText` | Zone de texte multi-lignes |
| `Dropdown` | Menu deroulant alimente par un set de donnees |
| `Icon` | Selecteur d'image/icone avec dimensions configurables |
| `LocalizationKey` | Editeur de cle de localisation avec support de template |

#### UIEditorPreview

| Type de preview | Cas d'usage |
|----------------|-------------|
| `ITEM` | Rendu d'apercu d'icone d'objet |
| `MODEL` | Preview de modele 3D complet |
| `REVERB_EFFECT` | Visualisation de reverb audio |
| `EQUALIZER_EFFECT` | Visualisation d'egaliseur audio |

#### UIRebuildCaches

Specifie quels caches cote client doivent etre invalides quand une propriete change : `BLOCK_TEXTURES`, `MODELS`, `MODEL_TEXTURES`, `MAP_GEOMETRY`, `ITEM_ICONS`.

#### Autres metadonnees UI

| Classe | Objectif |
|--------|----------|
| `UIPropertyTitle` | Titre d'affichage personnalise pour une propriete |
| `UITypeIcon` | Identifiant d'icone pour un type dans l'editeur |
| `UIEditorSectionStart` | Commence un groupe de section nomme dans l'editeur |
| `UIDefaultCollapsedState` | Controle l'etat collapse initial des sections |
| `UIButton` | Definit des boutons cliquables dans l'editeur |
| `UICreateButtons` | Boutons de creation dans l'editeur |
| `UISidebarButtons` | Boutons de barre laterale dans l'editeur |

---

## 4. Systeme de config de schema

**Source :** `codec/schema/config/`

Le systeme de config de schema implemente une hierarchie de types semblable a JSON Schema pour definir et valider le format de configuration piloté par les donnees de Hytale. La classe de base `Schema` supporte les mots-cles JSON Schema (`anyOf`, `oneOf`, `allOf`, `$ref`, etc.) aux cotes d'extensions specifiques a Hytale.

### Hierarchie des types de schema

| Type | Classe | Specifiques |
|------|--------|-------------|
| `object` | `ObjectSchema` | `properties` (LinkedHashMap pour ordre), `additionalProperties` (booleen ou schema) |
| `array` | `ArraySchema` | `items` (schema unique ou tableau), `minItems`, `maxItems`, `uniqueItems` |
| `string` | `StringSchema` | `pattern`, `enum`, `const`, `hytaleCommonAsset`, `hytaleCosmeticAsset` |
| `number` | `NumberSchema` | `minimum`, `maximum` (peuvent etre valeurs ou schemas) |
| `integer` | `IntegerSchema` | Memes bornes que NumberSchema |
| `boolean` | `BooleanSchema` | `default` uniquement |
| `null` | `NullSchema` | Singleton, pas de champs supplementaires |

### SchemaContext

Le `SchemaContext` gere la deduplication des definitions pendant la generation de schema. Il cree des pointeurs `$ref` vers `common.json#/definitions/` ou `other.json#/definitions/`. La gestion des collisions de noms ajoute des suffixes `@N`.

---

## 5. Nouveaux composants

### 5.1 NPCMarkerComponent

Un composant marqueur qui identifie les entites comme NPCs. Marque `@Deprecated(forRemoval = true)`, indiquant qu'il est en cours de suppression au profit d'un mecanisme d'identification NPC different.

Caracteristiques cles :
- **Pattern singleton** -- `clone()` retourne `this` car le composant ne porte pas de donnees mutables.
- **Deprecation** -- Le flag `forRemoval = true` signale que ceci sera supprime dans une future version.

### 5.2 TeleportRecord

Suit le dernier evenement de teleportation pour une entite, stockant l'origine et la destination avec un horodatage en nanosecondes.

Le record `Entry` est un porteur de donnees compact et immuable :
- `origin` -- La `Location` d'ou l'entite s'est teleportee.
- `destination` -- La `Location` vers laquelle l'entite s'est teleportee.
- `timestampNanos` -- La valeur `System.nanoTime()` quand la teleportation s'est produite.

La methode `hasElapsedSinceLastTeleport()` permet des verifications de cooldown.

### 5.3 RunOnBlockTypesInteraction

Une interaction cote serveur qui recherche des blocs correspondant a des types `BlockSet` specifies dans un rayon et execute des interactions enfants sur chaque bloc trouve. Utilise **l'echantillonnage par reservoir** pour limiter le nombre maximum de blocs selectionnes.

| Champ | Type | Description |
|-------|------|-------------|
| `Range` | `int` | Rayon spherique de recherche (doit etre positif) |
| `BlockSets` | `String[]` | Tableau d'identifiants `BlockSet` a faire correspondre |
| `MaxCount` | `int` | Nombre maximum de blocs a selectionner (doit etre positif) |
| `Interactions` | `String` | Chaine d'interactions a executer sur chaque bloc trouve |

L'algorithme d'echantillonnage par reservoir (algorithme R de Vitter) selectionne uniformement jusqu'a `MaxCount` blocs parmi l'ensemble de tous les blocs correspondants sans connaitre le total a l'avance.

---

## 6. Changements de la bibliotheque procedurale

**Source :** `procedurallib/`

### 6.1 JsonResourceLoader

Un chargeur d'assets JSON type qui lit un `InputStream`, l'analyse avec GSON en mode lenient, valide le resultat et le mappe vers un `JsonElement` type.

La conception a trois parametres separe les preoccupations :
- `type` -- Le token `Class` attendu.
- `predicate` -- Valide l'element parse.
- `mapper` -- Convertit l'element vers le type cible.

### 6.2 Sous-systeme de fichiers I/O

Le package `file/` fournit une abstraction de systeme de fichiers virtuel pour le chargement d'assets.

#### AssetPath

Represente un asset resolu avec un chemin relatif et un chemin absolu du systeme de fichiers. Pre-calcule son code de hachage pour une utilisation efficace dans les collections basees sur le hash.

#### FileIOSystem

Un systeme de fichiers virtuel thread-local qui supporte plusieurs chemins racine pour le chargement overlay/mod :

La methode `resolve()` recherche dans les racines dans l'ordre, retournant le premier chemin qui existe sur le disque. Ceci permet le comportement d'overlay de mods : les racines des mods sont recherchees avant la racine du jeu de base.

Le `Provider` interne utilise `ThreadLocal` pour fournir des contextes de systeme de fichiers par thread.

---

## 7. Systeme d'evenements

**Source :** `event/EventRegistry.java`, `event/EventPriority.java`

### 7.1 EventPriority

```java
public enum EventPriority {
   FIRST((short)-21844),
   EARLY((short)-10922),
   NORMAL((short)0),
   LATE((short)10922),
   LAST((short)21844);
}
```

Les priorites sont encodees en valeurs `short` reparties sur la plage short signee. Ceci permet d'inserer des priorites numeriques personnalisees entre les priorites nommees.

### 7.2 Categories d'enregistrement

L'`EventRegistry` fournit six categories d'enregistrement d'evenements :

| Methode | Async | Portee |
|---------|-------|--------|
| `register` | Non | Specifique a la cle |
| `registerGlobal` | Non | Toutes les cles |
| `registerUnhandled` | Non | Evenements non geres uniquement |
| `registerAsync` | Oui | Specifique a la cle |
| `registerAsyncGlobal` | Oui | Toutes les cles |
| `registerAsyncUnhandled` | Oui | Evenements non geres uniquement |

Chaque methode suit le meme pattern :
1. Verifie la precondition du registre.
2. Delegue au `IEventRegistry` parent pour creer l'enregistrement.
3. Encapsule le resultat via la gestion du cycle de vie de `Registry.register()`.

---

## 8. Ordre d'initialisation des modules core

**Source :** `server/core/Constants.java`

Le tableau `CORE_PLUGINS` definit l'ordre exact d'initialisation de tous les modules serveur integres. L'ordre est important car les modules peuvent dependre de modules anterieurs entierement initialises.

### Groupes d'initialisation

**Tier 1 -- Infrastructure** (1-4) : Console, permissions, mises a jour, camera de debug. Pas de dependances de logique de jeu.

**Tier 2 -- Pipeline d'assets** (5-9) : Chargement d'assets, assets partages, cosmetiques, gestion serveur, localisation. Doit s'initialiser avant tout contenu de jeu.

**Tier 3 -- Systeme de blocs** (10-18) : Objets, types de blocs, comportements de blocs, etats de blocs, collision, ensembles de blocs, migration, sante des blocs. Ordonne pour que les types soient definis avant les comportements, et les comportements avant la sante.

**Tier 4 -- Systemes de monde** (19-22) : Spawn de prefabs, gestion du temps, anchor actions, interactions. Depend du systeme de blocs entierement initialise.

**Tier 5 -- Systemes d'entites** (23-28) : Le core ECS, statistiques, UI, degats, physique, endurance. L'`EntityModule` est le module central ici.

**Tier 6 -- Runtime** (29-35) : Outils de debug, projectiles, gestion des joueurs, controle d'acces, support solo, gestion d'univers, blocs connectes. Ces modules operent sur l'etat de jeu entierement initialise.

### Constantes additionnelles

```java
public static final boolean DEBUG = true;
public static final boolean SINGLEPLAYER = OPTION_SET.has(Options.SINGLEPLAYER);
public static final boolean ALLOWS_SELF_OP_COMMAND = OPTION_SET.has(Options.ALLOW_SELF_OP_COMMAND);
public static final boolean FRESH_UNIVERSE = checkFreshUniverse();
public static final boolean FORCE_NETWORK_FLUSH = OPTION_SET.valueOf(Options.FORCE_NETWORK_FLUSH);
public static final Path UNIVERSE_PATH = getUniversePath();
```

Le check `FRESH_UNIVERSE` determine s'il s'agit d'une premiere generation de monde en cherchant l'existence des repertoires `players/` et `worlds/` sous le chemin de l'univers.
