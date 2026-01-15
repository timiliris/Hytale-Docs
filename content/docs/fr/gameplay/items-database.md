---
id: base-donnees-items
title: Base de Donnees Items et Blocs
sidebar_label: Base de Donnees
sidebar_position: 5
description: Items et blocs documentes depuis le code decompile du serveur Hytale Early Access
---

# Base de Donnees Items et Blocs

Cette base de donnees documente les items et blocs confirmes par l'analyse du code decompile du serveur Hytale. Les items dans Hytale sont definis via des fichiers JSON charges au runtime, ce qui fait de cette liste une representation des types de blocs et structures d'items trouves dans le code plutot qu'un inventaire complet.

:::warning Donnees Verifiees Uniquement
Cette page contient uniquement des informations verifiees depuis le code serveur decompile. Le contenu speculatif ou non confirme a ete supprime. Le jeu actuel contient beaucoup plus d'items definis dans des fichiers d'assets externes.
:::

## Apercu du Systeme d'Items

Les items dans Hytale utilisent un systeme base sur les composants avec les proprietes suivantes :

| Propriete | Description |
|-----------|-------------|
| `id` | Identifiant unique |
| `icon` | Reference de l'icone UI |
| `maxStack` | Taille maximale de pile (variable par defaut) |
| `qualityId` | Reference du niveau de qualite |
| `categories` | Tableau d'assignations de categories |
| `tool` | Configuration d'outil (si applicable) |
| `weapon` | Configuration d'arme (si applicable) |
| `armor` | Configuration d'armure (si applicable) |
| `glider` | Configuration de planeur (si applicable) |
| `utility` | Configuration d'item utilitaire |
| `consumable` | Si l'item est consomme a l'utilisation |
| `maxDurability` | Valeur de durabilite maximale |

## Systeme d'Armure

Hytale utilise un **systeme d'armure a 5 emplacements** craftes a l'Etabli de l'Armurier :

| Emplacement | Description |
|-------------|-------------|
| **Casque** | Protection de la tete |
| **Cuirasse** | Armure de torse/corps |
| **Gantelets** | Protection des mains |
| **Jambieres** | Armure de jambes |
| **Bouclier** | Item defensif en main secondaire (recettes separees) |

### Niveaux de Materiaux d'Armure

| Niveau | Materiau | Niveau Etabli | Zone | Proprietes Speciales |
|--------|----------|---------------|------|----------------------|
| 1 | **Cuivre** | Niveau 1 | Zone 1 | Protection basique |
| 2 | **Fer** | Niveau 1 | Zone 1-2 | Protection standard |
| 3 | **Thorium** | Niveau 2 | Zone 2 | Forte resistance au poison |
| 4 | **Cobalt** | Niveau 2 | Zone 3 | Stats orientees degats |
| 5 | **Adamantite** | Niveau 3 | Zone 4 | Bonus de degats d'attaque legere |
| 6 | **Mithril** | Niveau 3 | Zone 4 | Plus haut niveau (peut necessiter des drops de boss) |

:::note Bonus de Set d'Armure
Differents sets d'armure fournissent des bonus uniques. Cobalt et Adamantite favorisent les degats, tandis que Thorium offre de fortes proprietes defensives contre le poison.
:::

### Proprietes d'Armure

Les items d'armure peuvent avoir les configurations suivantes :

- **ArmorSlot** : Quel emplacement l'armure occupe
- **BaseDamageResistance** : Valeur de reduction de degats fixe
- **DamageResistance** : Table des types de degats vers modificateurs de resistance
- **DamageEnhancement** : Table des types de degats vers modificateurs d'amelioration
- **KnockbackResistances** : Resistance au recul par type de degat
- **StatModifiers** : Modifications de stats d'entite quand equipee
- **CosmeticsToHide** : Elements cosmetiques a cacher quand equipee

## Systeme d'Outils

Les outils utilisent un systeme base sur les specifications avec "GatherType" determinant quels blocs ils peuvent interagir :

| Propriete | Description |
|-----------|-------------|
| GatherType | Type de collecte auquel cette spec s'applique |
| Power | Valeur de puissance de minage/collecte |
| Quality | Niveau de qualite de la spec d'outil |
| Speed | Modificateur de vitesse de l'outil |
| DurabilityLossBlockTypes | Taux de perte de durabilite par type de bloc |

## Systeme d'Armes

Les armes sont craftees a l'**Enclume du Forgeron** et peuvent modifier les stats d'entite quand equipees.

### Types d'Armes

| Arme | Description | Special |
|------|-------------|---------|
| **Epees** | Armes a une main versatiles | Permet un item en main secondaire |
| **Dagues** | Armes rapides en double maniement | Haute mobilite, forte attaque chargee |
| **Arcs** | Armes a distance | Munitions abondantes |
| **Marteaux/Masses** | Armes lourdes | Degats de base eleves |
| **Batons** | Armes magiques | Utilise le systeme de mana |

### Niveaux de Materiaux d'Armes

Les armes suivent la meme progression de materiaux que l'armure :
- Cuivre > Fer > Thorium > Cobalt > Adamantite > Mithril

:::tip Meilleures Armes
Les Dagues en Mithril sont actuellement considerees comme les armes de melee craftees les plus puissantes. Les dagues beneficient du bonus de degats d'attaque legere de l'armure en Adamantite.
:::

### Proprietes d'Armes

| Propriete | Description |
|-----------|-------------|
| StatModifiers | Table des types de stats vers modificateurs |
| EntityStatsToClear | Stats a effacer quand l'arme est desequipee |
| RenderDualWielded | Si rendu en double maniement |

## Types de Minerais

Hytale propose **sept types de minerais confirmes** trouves dans differentes zones :

| Minerai | Zone | Emplacement | Pioche Requise | Notes |
|---------|------|-------------|----------------|-------|
| **Cuivre** | Zone 1 | Parois de grottes, faibles profondeurs | Pioche Rudimentaire | Minerai de depart, apparence vert-brun |
| **Fer** | Zone 1-2 | ~50 blocs de profondeur, abondant dans les Badlands | Pioche Rudimentaire | Plus commun dans les grottes du desert |
| **Or** | Zone 2 | Diverses profondeurs | Pioche en Fer | Utilise pour l'Etabli de l'Alchimiste |
| **Thorium** | Zone 2 | Grottes, flancs de falaises dans les Howling Sands | Pioche en Fer | Apparence verte brillante |
| **Cobalt** | Zone 3 | Whisperfrost Frontiers, colonnes de schiste | Pioche en Fer | Couleur bleu fonce, veines en surface |
| **Adamantite** | Zone 4 | Cinder Islands, pres de la lave | Pioche en Fer | Resistance au feu recommandee |
| **Mithril** | Zone 4 | Biomes Toundra/Volcan, drops de boss | Pioche en Fer | Minerai le plus rare, peut necessiter des kills de boss |

:::tip Conseils de Minage
- Tous les minerais peuvent etre mines avec une Pioche en Fer (meme l'Adamantite)
- Le Cuivre et le Fer peuvent etre mines avec la Pioche Rudimentaire de depart
- Les grottes du Desert/Badlands ont le plus de Fer
- Les colonnes de schiste en surface en Zone 3 contiennent de grandes veines de Cobalt
:::

## Types de Blocs Confirmes

### Blocs de Roche et Pierre

Depuis les fichiers de migration et references de code :

| ID de Bloc | Categorie | Notes |
|------------|-----------|-------|
| `Rock_Stone` | Terrain | Pierre standard |
| `Rock_Marble` | Terrain | Variante marbre |
| `Rock_Quartzite` | Terrain | Variante quartzite |
| `Rock_Shale` | Terrain | Schiste/pierre sombre |
| `Rock_Volcanic` | Terrain | Roche volcanique |
| `Rock_Basalt_Brick_Half` | Construction | Demi-dalle brique basalte |
| `Rock_Sandstone_Brick_Red` | Construction | Brique gres rouge |
| `Rock_Stone_Cobble` | Terrain | Pierre taillee |
| `Rock_Stone_Cobble_Mossy_Half` | Construction | Demi pierre taillee moussue |
| `Rock_Shale_Brick` | Construction | Brique pierre sombre |

### Blocs de Cristal

| ID de Bloc | Variantes | Notes |
|------------|-----------|-------|
| `Rock_Crystal_Blue_Big` | Big, Medium, Small | Formations cristal bleu |
| `Rock_Crystal_Green_Big` | Big, Medium, Small | Formations cristal vert |
| `Rock_Crystal_Pink_Big` | Big, Medium, Small | Formations cristal rose |
| `Rock_Crystal_Purple_Big` | Big, Medium, Small | Formations cristal violet |
| `Rock_Crystal_Red_Big` | Big, Medium, Small | Formations cristal rouge |
| `Rock_Crystal_Yellow_Big` | Big, Medium, Small | Formations cristal jaune |

### Types de Sol

| ID de Bloc | Description |
|------------|-------------|
| `Soil_Grass` | Sol couvert d'herbe |
| `Soil_Dirt` | Terre basique |
| `Soil_Clay` | Sol argileux |
| `Soil_Gravel` | Terrain de gravier |
| `Soil_Mud` | Terrain de boue |
| `Soil_Needles` | Sol couvert d'aiguilles de pin |

### Types de Bois

Le jeu propose divers types de bois avec branches, troncs et planches :

| Type de Bois | Variantes de Branches | Couleur Planches |
|--------------|----------------------|------------------|
| Ash (Frene) | Corner, Long, Short | - |
| Aspen (Tremble) | Corner, Long, Short | - |
| Azure | Corner, Long, Short | - |
| Beech (Hetre) | Corner, Long, Short | - |
| Birch (Bouleau) | Corner, Long, Short | Light (Clair) |
| Burnt (Brule) | Corner, Long, Short | Black (Noir) |
| Cedar (Cedre) | Corner, Long, Short | Red (Rouge) |
| CrimsonMaple | Corner, Long, Short | - |
| Crystal | Corner, Long, Short | - |
| Dry (Sec) | Corner, Long, Short | Beige |
| Gumboab | Corner, Long, Short | - |
| Oak (Chene) | Corner, Long, Short | Soft (Doux) |
| Palm (Palmier) | Corner, Long, Short | Golden (Dore) |
| Redwood (Sequoia) | Corner, Long, Short | - |
| Sand (Sable) | Corner, Long, Short | - |
| Spruce (Epicea) | Corner, Long, Short | Dark (Sombre) |

### Plantes et Vegetation

| ID de Bloc | Description |
|------------|-------------|
| `Plant_Boomshroom_Large` | Grand champignon explosif |
| `Plant_Boomshroom_Small` | Petit champignon explosif |
| `Plant_Mushroom_Red` | Champignon rouge |

### Os et Fossiles

| ID de Bloc | Description |
|------------|-------------|
| `Bone_Spine` | Bloc d'epine dorsale |
| `Bone_Stalagtite_Big` | Grande stalactite osseuse |
| `Bone_Stalagtite_Small` | Petite stalactite osseuse |
| `Bone_Ribs_Long` | Longues cotes |

### Blocs Decoratifs

| ID de Bloc | Description |
|------------|-------------|
| `Deco_Iron_Bars` | Barres de fer decoratives |
| `Deco_Iron_Brazier` | Brasero en fer |
| `Deco_Bronze_Brazier` | Brasero en bronze |
| `Deco_Stone_Brazier` | Brasero en pierre |
| `Deco_Cauldron` | Bloc chaudron |
| `Deco_Iron_Stack` | Pile de fer decorative |
| `Deco_EggSacks_Medium` | Decoration sac d'oeufs |
| `Container_Coffin` | Conteneur cercueil |

### Formations de Glace

| ID de Bloc | Description |
|------------|-------------|
| `Rock_Ice_Stalagtite_Small` | Petite stalactite de glace |

### Structures

| ID de Bloc | Description |
|------------|-------------|
| `WindMill_Wing` | Aile de moulin a vent |
| `Wood_Platform_Kweebec` | Plateforme en bois Kweebec |

## Fluides

Hytale possede un systeme de fluides avec 6 types confirmes :

| ID Fluide | Bloc Source | Bloc Ecoulement | Proprietes |
|-----------|-------------|-----------------|------------|
| `Fluid_Water` | `Water_Source` | `Water` | Eau standard |
| `Fluid_Water_Test` | `Water_Finite` | - | Eau test/finie |
| `Fluid_Lava` | `Lava_Source` | `Lava` | Lave causant des degats |
| `Fluid_Tar` | `Tar_Source` | `Tar` | Goudron collant |
| `Fluid_Slime` | `Slime_Source` | `Slime` | Slime rebondissant |
| `Fluid_Poison` | `Poison_Source` | `Poison` | Poison causant des degats |

## Durabilite et Reparation des Items

Les items avec durabilite se degradent avec l'utilisation et peuvent etre repares.

### Systeme de Reparation

1. Craftez un **Kit de Reparation** a un etabli
2. Equipez le Kit de Reparation dans votre barre de raccourcis
3. Appuyez sur **Clic Droit** pour ouvrir la fenetre de reparation
4. Selectionnez les items a reparer

:::warning Perte de Durabilite
Utiliser un Kit de Reparation **reduit la durabilite maximale de 10%**. Reparer le meme item de facon repetee finira par le casser definitivement. Envisagez de crafter un nouvel equipement plutot que de trop reparer.
:::

### Recyclage

L'**Etabli du Recycleur** vous permet de decomposer l'equipement non desire en materiaux bruts, qui peuvent ensuite etre utilises pour crafter un nouvel equipement.

## Systeme de Qualite d'Item

Les items ont des niveaux de qualite qui affectent leur apparence et potentiellement leurs stats. Le systeme inclut :

- Reference ID de qualite
- Valeur de qualite (niveau numerique)
- Indicateurs visuels (textures d'arriere-plan dans `UI/ItemQualities/`)

## Categories d'Items

Les items sont organises en categories pour l'affichage d'inventaire :

- Les categories ont une structure hierarchique (parent/enfants)
- Chaque categorie a un ID, nom, icone et ordre d'affichage
- Les icones sont stockees dans `Icons/ItemCategories/`

## Items Editeur et Debug

Le jeu inclut des items speciaux pour l'edition de monde :

| ID Item | But |
|---------|-----|
| `Editor_Block` | Outil d'edition de bloc |
| `Editor_Empty` | Placeholder editeur vide |
| `Editor_Anchor` | Outil point d'ancrage |
| `EditorTool_Paste` | Outil de collage |
| `EditorTool_PrefabEditing_SelectPrefab` | Selection de prefab |
| `Debug_Cube` | Cube de debug |
| `Debug_Model` | Modele de debug |

## Systeme de Sons

Les items referencent des evenements sonores pour les interactions :

| Evenement Sonore | Description |
|------------------|-------------|
| `SFX_Player_Craft_Item_Inventory` | Completion de fabrication |
| `SFX_Player_Drop_Item` | Depot d'item |
| `SFX_Player_Pickup_Item` | Ramassage d'item |
| `SFX_Item_Break` | Casse d'item |
| `SFX_Item_Repair` | Reparation d'item |

---

## Voir Aussi

- [Types d'Items](/docs/modding/data-assets/items/item-types) - Schema de configuration d'items
- [Types de Blocs](/docs/api/server-internals/modules/blocks) - Documentation du systeme de blocs
- [Guide de Fabrication](/docs/gameplay/crafting-guide) - Comment fabriquer des items

---

*Cette base de donnees est generee depuis l'analyse du code serveur Hytale decompile. Pour la liste complete des items, referez-vous aux fichiers d'assets du jeu.*
