---
id: protocol
title: "Référence du protocole réseau"
sidebar_label: Référence protocole
sidebar_position: 15
description: Référence technique complète du protocole réseau du serveur Hytale - Architecture QUIC multi-canaux, typage directionnel des paquets, système de dispatch polymorphe ComponentUpdate, nouveaux paquets, modèles de sérialisation et PacketRegistry.
---

# Référence du protocole réseau Hytale

Ce document est une référence technique complète du protocole réseau du serveur Hytale, dérivée de l'analyse du code décompilé. Il couvre l'architecture QUIC multi-canaux, le typage directionnel des paquets, le système de dispatch polymorphe ComponentUpdate, les nouveaux paquets, les modèles de sérialisation et le PacketRegistry.

Tous les chemins sources sont relatifs à `decompiled/com/hypixel/hytale/protocol/`.

---

## 1. Architecture multi-canaux

Hytale utilise QUIC (et non TCP) comme couche de transport sur le port UDP 5520. Le protocole définit trois canaux logiques qui correspondent à des flux QUIC séparés. Chaque paquet déclare à quel canal il appartient, et l'encodeur/décodeur vérifient que les paquets sont uniquement envoyés sur leur flux désigné.

### Enum NetworkChannel

**Source :** `NetworkChannel.java`

```java
public enum NetworkChannel {
   Default(0),
   Chunks(1),
   WorldMap(2);

   public static final NetworkChannel[] VALUES = values();
   public static final int COUNT = VALUES.length;
   private final int value;
}
```

### Description des canaux

| Canal | Valeur | Usage | Plages d'ID de paquets |
|-------|--------|-------|----------------------|
| `Default` | 0 | Connexion, auth, setup, joueur, entités, UI, inventaire, outils de construction, éditeur d'assets, machinima, caméra, accès serveur | 0-119, 200-238, 240, 243-246, 250-262, 280-283, 300-360, 400-425 |
| `Chunks` | 1 | Données de chunks, heightmaps, tintmaps, fluides, mutations de blocs/fluides, sons, particules, météo, temps | 131-170 |
| `WorldMap` | 2 | Mises à jour des tuiles de la carte, effacement de la carte | 241-242 |

### Application du canal de flux

L'encodeur et le décodeur valident tous deux que le canal déclaré d'un paquet correspond au flux QUIC sur lequel il est envoyé/reçu. Si un paquet arrive sur le mauvais flux, la connexion est terminée avec une erreur QUIC `PROTOCOL_VIOLATION`.

### Codes d'erreur applicatifs QUIC

**Source :** `io/netty/ProtocolUtil.java`

```java
public static final int APPLICATION_NO_ERROR = 0;
public static final int APPLICATION_RATE_LIMITED = 1;
public static final int APPLICATION_AUTH_FAILED = 2;
public static final int APPLICATION_INVALID_VERSION = 3;
public static final int APPLICATION_TIMEOUT = 4;
public static final int APPLICATION_CLIENT_OUTDATED = 5;
public static final int APPLICATION_SERVER_OUTDATED = 6;
```

---

## 2. Typage directionnel des paquets

Chaque paquet implémente des interfaces marqueur spécifiques qui contraignent la direction dans laquelle il peut voyager.

### Hiérarchie des interfaces

```java
public interface Packet {
   int getId();
   NetworkChannel getChannel();
   void serialize(@Nonnull ByteBuf var1);
   int computeSize();
}

public interface ToClientPacket extends Packet { }
public interface ToServerPacket extends Packet { }
```

Les paquets implémentent une ou les deux interfaces :
- **Serveur vers client uniquement :** `implements Packet, ToClientPacket` (ex. : `Ping`, `SetClientId`, `EntityUpdates`)
- **Client vers serveur uniquement :** `implements Packet, ToServerPacket` (ex. : `Pong`, `ClientMovement`, `CreateUserMarker`)
- **Bidirectionnel :** `implements Packet, ToClientPacket, ToServerPacket` (ex. : `Disconnect`, `ViewRadius`, `UpdateMachinimaScene`)

### CachedPacket

`CachedPacket` encapsule un `ToClientPacket` pour l'optimisation de la diffusion. Il pré-sérialise le paquet une seule fois dans un `ByteBuf` Netty et rejoue les octets pour chaque destinataire, évitant la sérialisation redondante.

Propriétés clés :
- Seules les instances `ToClientPacket` peuvent être mises en cache (contrainte à la compilation via les génériques).
- Implémente `AutoCloseable` -- les appelants doivent libérer le buffer sous-jacent une fois la diffusion terminée.
- Le double-cache est empêché par un garde `instanceof CachedPacket`.

---

## 3. Système ComponentUpdate

Le système ComponentUpdate est le mécanisme central de réplication ECS (Entity Component System). Il utilise le dispatch polymorphe avec 26 types de composants distincts, chacun identifié par un préfixe d'ID de type VarInt.

### Classe de base

**Source :** `ComponentUpdate.java`

```java
public abstract class ComponentUpdate {
   public static final int MAX_SIZE = 1677721605;

   public static ComponentUpdate deserialize(@Nonnull ByteBuf buf, int offset) {
      int typeId = VarInt.peek(buf, offset);
      int typeIdLen = VarInt.length(buf, offset);
      return (ComponentUpdate)(switch (typeId) {
         case 0  -> NameplateUpdate.deserialize(buf, offset + typeIdLen);
         case 1  -> UIComponentsUpdate.deserialize(buf, offset + typeIdLen);
         // ... cases 2-25 ...
         default -> throw ProtocolException.unknownPolymorphicType(
                       "ComponentUpdate", typeId);
      });
   }
}
```

### Enum ComponentUpdateType

```java
public enum ComponentUpdateType {
   Nameplate(0),      UIComponents(1),    CombatText(2),
   Model(3),          PlayerSkin(4),      Item(5),
   Block(6),          Equipment(7),       EntityStats(8),
   Transform(9),      MovementStates(10), EntityEffects(11),
   Interactions(12),  DynamicLight(13),   Interactable(14),
   Intangible(15),    Invulnerable(16),   RespondToHit(17),
   HitboxCollision(18), Repulsion(19),    Prediction(20),
   Audio(21),         Mounted(22),        NewSpawn(23),
   ActiveAnimations(24), Prop(25);
}
```

### Conteneur EntityUpdate

Les ComponentUpdates sont livrés dans des objets `EntityUpdate`, eux-mêmes contenus dans des paquets `EntityUpdates`. Chaque `EntityUpdate` cible une entité spécifique par `networkId` et contient une liste optionnelle de composants supprimés et une liste optionnelle de composants mis à jour.

Format réseau :
```
[1 octet nullBits] [4 octets networkId LE]
[4 octets removedOffset LE] [4 octets updatesOffset LE]
--- bloc variable (commence à l'octet 13) ---
[VarInt removedCount] [removedCount x 1 octet de valeur enum]   (si bit 0 activé)
[VarInt updatesCount] [updatesCount x ComponentUpdate]           (si bit 1 activé)
```

### Tableau récapitulatif des 26 types ComponentUpdate

| ID | Type | Taille fixe | Champs variables | Bits nullable | Usage |
|----|------|------------|-----------------|---------------|-------|
| 0 | NameplateUpdate | 0 | 1 (String) | 0 | Nom affiché de l'entité |
| 1 | UIComponentsUpdate | 0 | 1 (tableau int) | 0 | Indices de composants UI |
| 2 | CombatTextUpdate | 4 | 1 (String) | 0 | Nombres de dégâts |
| 3 | ModelUpdate | 5 | 1 (Model?) | 1 | Modèle 3D + échelle |
| 4 | PlayerSkinUpdate | 1 | 1 (PlayerSkin?) | 1 | Skin du joueur |
| 5 | ItemUpdate | 4 | 1 (ItemWithAllMetadata) | 0 | Entité objet au sol |
| 6 | BlockUpdate | 8 | 0 | 0 | Entité bloc |
| 7 | EquipmentUpdate | 13 | 3 (tableau String, String?, String?) | 1 | Armure + objets tenus |
| 8 | EntityStatsUpdate | 0 | 1 (Map) | 0 | Changements de stats |
| 9 | TransformUpdate | 49 | 0 | 0 | Position/rotation/échelle |
| 10 | MovementStatesUpdate | 22 | 0 | 0 | Flags de mouvement |
| 11 | EntityEffectsUpdate | 0 | 1 (tableau) | 0 | Effets actifs |
| 12 | InteractionsUpdate | 9 | 2 (Map, String?) | 1 | Interactions disponibles |
| 13 | DynamicLightUpdate | 4 | 0 | 0 | Lumière ponctuelle |
| 14 | InteractableUpdate | 1 | 1 (String?) | 1 | Infobulle d'interaction |
| 15 | IntangibleUpdate | 0 | 0 | 0 | Marqueur : intangible |
| 16 | InvulnerableUpdate | 0 | 0 | 0 | Marqueur : invulnérable |
| 17 | RespondToHitUpdate | 0 | 0 | 0 | Marqueur : réponse au coup |
| 18 | HitboxCollisionUpdate | 4 | 0 | 0 | Réf config hitbox |
| 19 | RepulsionUpdate | 4 | 0 | 0 | Réf config répulsion |
| 20 | PredictionUpdate | 16 | 0 | 0 | ID de prédiction client |
| 21 | AudioUpdate | 0 | 1 (tableau int) | 0 | Déclencheurs de sons |
| 22 | MountedUpdate | 48 | 0 | 1 | Attachement de monture |
| 23 | NewSpawnUpdate | 0 | 0 | 0 | Marqueur : nouveau spawn |
| 24 | ActiveAnimationsUpdate | 0 | 1 (tableau String avec bitfield) | 0 | Animations en cours |
| 25 | PropUpdate | 0 | 0 | 0 | Marqueur : prop statique |

---

## 4. Nouveaux paquets

### CreateUserMarker (ID 246)

Direction : **ToServer** | Canal : **Default** | Compressé : Non

Permet à un joueur de placer un marqueur personnalisé sur la carte du monde.

```java
public class CreateUserMarker implements Packet, ToServerPacket {
   public static final int PACKET_ID = 246;
   public float x;
   public float z;
   @Nullable public String name;
   @Nullable public String markerImage;
   @Nullable public Color tintColor;
   public boolean shared;
}
```

### BuilderToolSetEntityCollision (ID 425)

Direction : **ToServer** | Canal : **Default** | Compressé : Non

Définit le type de collision d'une entité via les outils de construction (mode éditeur/créatif).

### UpdateAnchorUI (ID 235)

Direction : **ToClient** | Canal : **Default** | Compressé : **Oui**

Met à jour un point d'ancrage UI personnalisé sur le client. Supporte la construction dynamique d'UI via des tableaux de commandes et des liaisons d'événements.

### Système polymorphe MapMarkerComponent

Les marqueurs de carte utilisent leur propre système de dispatch polymorphe avec 4 sous-types, indépendant de la hiérarchie ComponentUpdate :

| Sous-type | ID | Champs | Usage |
|-----------|-----|--------|-------|
| PlayerMarkerComponent | 0 | `playerId` (UUID, 16 octets) | Associe un marqueur à un joueur |
| PlacedByMarkerComponent | 1 | `playerId` (UUID) + `name` (FormattedMessage) | Enregistre quel joueur a placé le marqueur |
| HeightDeltaIconComponent | 2 | `upDelta`, `downDelta` (int) + `upImage`, `downImage` (String?) | Flèches directionnelles d'altitude |
| TintComponent | 3 | `color` (Color, 3 octets RGB) | Teinte le marqueur avec une couleur personnalisée |

---

## 5. Modèles de sérialisation

### Encodage VarInt

Hytale utilise l'encodage VarInt standard à 7 bits (identique au format Protocol Buffers). Maximum 5 octets (encode jusqu'à 2^28 - 1). Les valeurs négatives ne peuvent pas être encodées.

### Adressage par offset

De nombreuses structures utilisent une disposition en deux parties :

1. **Bloc fixe** -- Contient le bitfield nullable, les champs de taille fixe et les slots d'offset 4 octets LE (un par champ variable).
2. **Bloc variable** -- Contient les données de taille variable (chaînes, tableaux, structures imbriquées).

Chaque slot d'offset stocke un offset relatif en octets depuis le début du bloc variable. Si le champ est null, l'offset est défini à `-1` (0xFFFFFFFF).

### Bitfield nullable

Le premier octet de nombreuses structures est un bitfield où chaque bit indique si un champ nullable est présent. Quand un champ fixe nullable est absent, ses octets réservés sont remplis de zéros pour maintenir l'alignement de la structure.

### Tableaux bitfield (tableaux de chaînes creux)

`ActiveAnimationsUpdate` démontre un encodage compact pour les tableaux creux :

```
[VarInt longueurTableau]
[ceil(longueurTableau / 8) octets bitfield de présence]
[pour chaque bit activé : VarString valeur]
```

### Encodage des chaînes

Les chaînes sont encodées comme des tableaux d'octets préfixés par VarInt. Le VarInt stocke la longueur en octets (pas le nombre de caractères). L'encodage est UTF-8. Longueur maximale : 4 096 000 octets.

### Floats demi-précision

Certains champs utilisent des floats 16 bits demi-précision (IEEE 754 binary16) pour économiser la bande passante.

### Compression

Les paquets marqués `compressed = true` utilisent la compression Zstd. Le niveau de compression peut être configuré via la propriété JVM `hytale.protocol.compressionLevel`.

### Validation

Chaque paquet implémente une méthode `validateStructure(ByteBuf, int)` qui effectue une validation non destructive avant la désérialisation.

---

## 6. PacketRegistry

### Architecture d'enregistrement

Le `PacketRegistry` est une classe singleton qui fait correspondre les ID de paquets à des métadonnées et des fonctions de désérialisation. Tous les enregistrements se font dans un bloc d'initialisation `static`.

### Format de trame

```
[4 octets longueur payload LE] [4 octets ID paquet LE] [octets de payload...]
```

Le décodeur lit les trames avec :
- `LENGTH_PREFIX_SIZE = 4` (longueur du payload, int32 little-endian)
- `PACKET_ID_SIZE = 4` (ID du paquet, int32 little-endian)
- `MIN_FRAME_SIZE = 8` (en-tête seul, pas de payload)

Payload maximum : `1 677 721 600` octets (~1,6 Go).

### Plages d'ID de paquets

| Plage | Catégorie | Direction | Nombre |
|-------|-----------|-----------|--------|
| 0-3 | Connexion (Connect, Disconnect, Ping, Pong) | Mixte | 4 |
| 11-18 | Authentification | Mixte | 8 |
| 20-34 | Configuration (WorldSettings, Assets, Features, Tags) | Principalement ToClient | ~15 |
| 40-85 | Définitions d'assets (types de blocs, items, effets, sons, etc.) | ToClient | ~46 |
| 100-119 | Joueur (SetClientId, Movement, Interaction, Debug) | Mixte | ~20 |
| 131-170 | Monde/Chunks (SetChunk, Blocks, Fluids, Particles, Weather, Time) | ToClient (canal Chunks) | ~40 |
| 200-238 | Interface (Chat, ServerInfo, Inventory, Windows, HUD, UI) | Mixte | ~39 |
| 240-246 | Carte du monde | Mixte | 7 |
| 250-252 | Accès serveur | Mixte | 3 |
| 260-262 | Machinima | Mixte | 3 |
| 280-283 | Caméra | Mixte | 4 |
| 300-360 | Éditeur d'assets | Mixte | ~60 |
| 400-425 | Outils de construction | Principalement ToServer | ~26 |

### Paquets bidirectionnels

Seuls quelques paquets sont enregistrés avec `PacketDirection.Both` :
- **ID 1** `Disconnect` -- Chaque côté peut initier la déconnexion
- **ID 32** `ViewRadius` -- Le client peut demander, le serveur peut définir
- **ID 262** `UpdateMachinimaScene` -- Édition de scène bidirectionnelle

### Paquets compressés

Les paquets avec `compressed = true` utilisent Zstd pour la compression du payload. Ce sont principalement des transferts de données volumineux : définitions d'assets (IDs 40-85), données de monde (IDs 131-133), paramètres de monde (ID 20), UpdateAnchorUI (ID 235), UpdateMachinimaScene (ID 262).

### Gestion du timeout

Le décodeur implémente une vérification de timeout heartbeat. Si aucun paquet n'est reçu dans la durée `PACKET_TIMEOUT` configurée, la connexion est fermée avec une `ReadTimeoutException`. La vérification s'exécute toutes les 1000ms.

---

## Annexe : Ordre des octets et endianness

Tous les entiers et floats multi-octets du protocole Hytale sont en **little-endian** (LE). La seule exception est l'encodage VarInt, qui est indépendant de l'ordre des octets par conception.
