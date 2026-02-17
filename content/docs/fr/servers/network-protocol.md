---
id: network-protocol
title: Protocole Réseau
sidebar_label: Protocole Réseau
sidebar_position: 5
description: Comprendre le protocole réseau du serveur Hytale
---

# Protocole Réseau

Ce document décrit le protocole réseau Hytale utilisé pour la communication entre les clients et les serveurs. Les informations sont dérivées de l'analyse du code serveur décompilé.

## Aperçu du Protocole

Hytale utilise un protocole réseau moderne et efficace construit sur QUIC (Quick UDP Internet Connections).

| Propriété | Valeur |
|-----------|--------|
| Transport | QUIC sur UDP |
| Port par défaut | 5520 |
| Protocole applicatif | `hytale/1` |

:::tip Update 3 - Architecture Multi-Canaux
L'Update 3 a introduit une architecture réseau multi-canaux avec l'enum `NetworkChannel` définissant trois canaux : **Default**, **Chunks** et **WorldMap**. Chaque paquet est désormais routé vers un flux QUIC spécifique en fonction de son canal, éliminant le blocage en tête de ligne entre les paquets de gameplay et les transferts de données lourds. Voir la [Référence Protocole](/docs/servers/protocol) pour tous les détails.
:::

QUIC offre plusieurs avantages par rapport au TCP traditionnel :
- **Latence réduite** : Établissement de connexion plus rapide avec prise en charge du 0-RTT
- **Flux multiplexés** : Plusieurs flux de données sans blocage en tête de ligne
- **Chiffrement intégré** : TLS 1.3 intégré au protocole
- **Migration de connexion** : Gère les changements de réseau de manière élégante

## Constantes du Protocole

Le protocole utilise les constantes suivantes définies dans `ProtocolSettings.java` :

| Constante | Valeur | Description |
|-----------|--------|-------------|
| `PROTOCOL_HASH` | `6708f121966c1c443f4b0eb525b2f81d0a8dc61f5003a692a8fa157e5e02cea9` | Hachage SHA-256 pour la validation de version |
| `PROTOCOL_VERSION` | 1 | Numéro de version du protocole |
| `PACKET_COUNT` | 268 | Nombre total de types de paquets (augmenté dans l'Update 3 avec de nouveaux paquets de gameplay et de carte du monde) |
| `STRUCT_COUNT` | 315 | Nombre total de structures de données |
| `ENUM_COUNT` | 136 | Nombre total d'énumérations |
| `MAX_PACKET_SIZE` | 1 677 721 600 | Taille maximale d'un paquet en octets (~1,6 Go) |
| `DEFAULT_PORT` | 5520 | Port serveur par défaut |

Le `PROTOCOL_HASH` est utilisé lors de la poignée de main pour s'assurer que le client et le serveur utilisent des versions de protocole compatibles.

## Interface Packet

Tous les paquets implémentent l'interface `Packet` (`com.hypixel.hytale.protocol.Packet`) :

```java
public interface Packet {
   int getId();
   void serialize(@Nonnull ByteBuf var1);
   int computeSize();
   NetworkChannel getChannel();
}
```

| Méthode | Description |
|---------|-------------|
| `getId()` | Retourne l'identifiant unique du paquet |
| `serialize(ByteBuf)` | Écrit les données du paquet dans un tampon d'octets |
| `computeSize()` | Calcule la taille sérialisée du paquet |
| `getChannel()` | Retourne le `NetworkChannel` par lequel ce paquet est routé (Default, Chunks ou WorldMap) |

## Sérialisation

### Structure des Trames

Les paquets sont transmis sous forme de trames binaires préfixées par leur longueur :

```
+--------------------+------------------------+-------------------------+
| Longueur (4 octets) | ID du paquet (4 octets) | Charge utile (variable) |
+--------------------+------------------------+-------------------------+
```

| Composant | Taille | Description |
|-----------|--------|-------------|
| Préfixe de longueur | 4 octets | Longueur totale de la trame |
| ID du paquet | 4 octets | Identifie le type de paquet |
| Charge utile | Variable | Données spécifiques au paquet |
| **Taille minimale de trame** | 8 octets | Longueur + ID du paquet |

### Compression

Les paquets volumineux utilisent la compression **Zstd** (Zstandard) pour une utilisation efficace de la bande passante. Zstd offre :
- Des vitesses de compression et de décompression rapides
- Des taux de compression élevés
- Une prise en charge du streaming

Les paquets utilisant la compression ont un indicateur `IS_COMPRESSED = true` dans leur définition de classe.

### Entiers à Longueur Variable (VarInt)

Hytale implémente son propre encodage VarInt pour les entiers à longueur variable dans `com.hypixel.hytale.protocol.io.VarInt` :

```java
public static void write(@Nonnull ByteBuf buf, int value) {
   if (value < 0) {
      throw new IllegalArgumentException("VarInt cannot encode negative values: " + value);
   } else {
      while ((value & -128) != 0) {
         buf.writeByte(value & 127 | 128);
         value >>>= 7;
      }
      buf.writeByte(value);
   }
}
```

Caractéristiques principales :
- N'encode que les valeurs non négatives
- Utilise 7 bits par octet pour les données, 1 bit comme indicateur de continuation
- Les valeurs plus petites utilisent moins d'octets (efficace pour les petits nombres courants)

## Directions des Paquets

Les paquets circulent dans trois directions :

| Direction | Description | Exemple |
|-----------|-------------|---------|
| **Client vers Serveur** | Envoyés par les clients, traités par les gestionnaires de paquets du serveur | `ClientMovement`, `ChatMessage` |
| **Serveur vers Client** | Envoyés par le serveur, traités par le client | `SetChunk`, `EntityUpdates` |
| **Bidirectionnel** | Peuvent être envoyés par l'une ou l'autre partie | `Disconnect`, `SetPaused` |

La direction des paquets est également formalisée au moment de la compilation via les interfaces marqueurs `ToClientPacket` et `ToServerPacket`. Les paquets implémentent l'une ou les deux interfaces pour appliquer des vérifications de direction type-safe.

Les paquets client vers serveur sont enregistrés dans `GamePacketHandler.registerHandlers()` :

```java
this.registerHandler(108, p -> this.handle((ClientMovement)p));
this.registerHandler(211, p -> this.handle((ChatMessage)p));
```

Les paquets serveur vers client sont encodés via `PacketEncoder.encode()` et envoyés à travers le canal réseau.

## Flux de Connexion

### Processus de Poignée de Main

1. **Le client se connecte** via le transport QUIC
2. **Le client envoie un paquet `Connect`** (ID 0) avec :
   - Le hachage du protocole pour la validation de version
   - Le type de client (Game ou Editor)
   - Le code de langue
   - Le jeton d'identité pour l'authentification
   - L'UUID et le nom d'utilisateur du joueur
3. **Le serveur valide** le hachage du protocole par rapport à la valeur attendue
4. **Le serveur valide** les identifiants d'authentification
5. **Le serveur répond** avec soit :
   - `ConnectAccept` (ID 14) - Connexion acceptée, peut inclure un défi de mot de passe
   - `Disconnect` (ID 1) - Connexion refusée avec raison
6. **L'authentification continue** via `AuthenticationPacketHandler`
7. **La phase de configuration** passe à `SetupPacketHandler`
8. **Le jeu** passe à `GamePacketHandler`

```
Client                                Serveur
   |                                    |
   |  -------- Connexion QUIC --------> |
   |                                    |
   |  -------- Connect (ID 0) --------> |
   |       protocolHash, clientType,    |
   |       language, identityToken,     |
   |       uuid, username               |
   |                                    |
   |  <----- ConnectAccept (ID 14) ---- |
   |       passwordChallenge (optionnel)|
   |                                    |
   |  -------- AuthToken (ID 12) -----> |
   |       accessToken,                 |
   |       serverAuthorizationGrant     |
   |                                    |
   |  <------ JoinWorld (ID 104) ------ |
   |                                    |
```

## Catégories de Paquets

Les paquets sont organisés en catégories fonctionnelles :

### Paquets de Connexion

Gèrent le cycle de vie de la connexion.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `Connect` | 0 | Client -> Serveur | Requête de connexion initiale |
| `Disconnect` | 1 | Bidirectionnel | Terminaison de connexion |
| `Ping` | 2 | Serveur -> Client | Requête de mesure de latence |
| `Pong` | 3 | Client -> Serveur | Réponse de mesure de latence |

### Paquets d'Authentification

Gèrent le flux d'authentification.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `Status` | 10 | Serveur -> Client | Informations sur le statut du serveur |
| `AuthToken` | 12 | Client -> Serveur | Soumission du jeton d'authentification |
| `ConnectAccept` | 14 | Serveur -> Client | Réponse de connexion acceptée |

### Paquets Joueur

Gèrent l'état et les actions du joueur.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `JoinWorld` | 104 | Serveur -> Client | Rejoindre un monde |
| `ClientReady` | 105 | Client -> Serveur | État prêt du client |
| `ClientMovement` | 108 | Client -> Serveur | Mise à jour du mouvement du joueur |
| `MouseInteraction` | 111 | Client -> Serveur | Événements d'entrée souris |
| `SyncPlayerPreferences` | 116 | Client -> Serveur | Synchroniser les paramètres du joueur |
| `ClientPlaceBlock` | 117 | Client -> Serveur | Requête de placement de bloc |
| `RemoveMapMarker` | 119 | Client -> Serveur | Supprimer un marqueur de carte |

### Paquets de Monde

Synchronisent les données du monde.

| Paquet | ID | Direction | Compressé | Description |
|--------|-----|-----------|-----------|-------------|
| `SetChunk` | 131 | Serveur -> Client | Oui | Transfert de données de chunk |
| `SetPaused` | 158 | Bidirectionnel | Non | Mettre en pause l'état du jeu |

### Paquets d'Entité

Synchronisent l'état des entités.

| Paquet | ID | Direction | Compressé | Description |
|--------|-----|-----------|-----------|-------------|
| `EntityUpdates` | 161 | Serveur -> Client | Oui | Mises à jour de l'état des entités |
| `MountMovement` | 166 | Client -> Serveur | Non | Mouvement d'entité montée |

### Paquets d'Inventaire

Gèrent l'inventaire du joueur.

| Paquet | ID | Direction | Compressé | Description |
|--------|-----|-----------|-----------|-------------|
| `UpdatePlayerInventory` | 170 | Serveur -> Client | Oui | Synchronisation complète de l'inventaire |
| `SetCreativeItem` | 171 | Client -> Serveur | Non | Définir un objet en inventaire créatif |
| `DropCreativeItem` | 172 | Client -> Serveur | Non | Lâcher un objet créatif dans le monde |
| `SmartGiveCreativeItem` | 173 | Client -> Serveur | Non | Don intelligent d'objet en mode créatif |
| `DropItemStack` | 174 | Client -> Serveur | Non | Lâcher des objets de l'inventaire |
| `MoveItemStack` | 175 | Client -> Serveur | Non | Déplacer des objets entre emplacements |
| `SmartMoveItemStack` | 176 | Client -> Serveur | Non | Déplacement intelligent d'objets |
| `SetActiveSlot` | 177 | Client -> Serveur | Non | Changer l'emplacement actif de la barre d'accès rapide |
| `SwitchHotbarBlockSet` | 178 | Client -> Serveur | Non | Changer le jeu de blocs de la barre d'accès rapide |
| `InventoryAction` | 179 | Client -> Serveur | Non | Action d'inventaire générique |
| `LoadHotbar` | 106 | Client -> Serveur | Non | Charger la configuration de barre d'accès rapide |
| `SaveHotbar` | 107 | Client -> Serveur | Non | Sauvegarder la configuration de barre d'accès rapide |

### Paquets de Fenêtre/Interface

Gèrent les interactions d'interface utilisateur.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `CloseWindow` | 202 | Client -> Serveur | Fermer une fenêtre d'interface |
| `SendWindowAction` | 203 | Client -> Serveur | Interaction avec une fenêtre |
| `ClientOpenWindow` | 204 | Client -> Serveur | Requête d'ouverture de fenêtre |

### Paquets d'Interface

Gestion du chat et de l'interface.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `ChatMessage` | 211 | Client -> Serveur | Envoyer un message de chat |
| `CustomPageEvent` | 219 | Client -> Serveur | Interaction avec une page personnalisée |
| `UpdateLanguage` | 232 | Client -> Serveur | Changer le paramètre de langue |

### Paquets de Carte du Monde

Interactions avec la carte du monde.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `UpdateWorldMapVisible` | 243 | Client -> Serveur | Basculer la visibilité de la carte |
| `TeleportToWorldMapMarker` | 244 | Client -> Serveur | Se téléporter à un marqueur |
| `TeleportToWorldMapPosition` | 245 | Client -> Serveur | Se téléporter à une position |

### Paquets de Configuration

Configuration initiale du client.

| Paquet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `RequestAssets` | 23 | Client -> Serveur | Demander les données d'assets |
| `ViewRadius` | 32 | Client -> Serveur | Définir la distance de vue |

### Paquets Spécialisés

| Catégorie | Paquets | Description |
|-----------|---------|-------------|
| Accès Serveur | `UpdateServerAccess` (251), `SetServerAccess` (252) | Contrôle d'accès en solo |
| Machinima | `RequestMachinimaActorModel` (260), `UpdateMachinimaScene` (262) | Outils cinématiques |
| Caméra | `RequestFlyCameraMode` (282) | Contrôle de la caméra |
| Interaction | `SyncInteractionChains` (290) | Chaînes d'interaction |
| Objectifs/Quêtes | `TrackOrUpdateObjective` (69), `UntrackObjective` (70), `UpdateObjectiveTask` (71) | Suivi des quêtes et progression |
| Débogage PNJ | `BuilderToolSetNPCDebug` (423) | Débogage du comportement PNJ |
| Assets | 40+ paquets | Synchronisation des assets |

## Détails des Paquets Clés

### Connect (ID 0)

Paquet de connexion initial envoyé par les clients.

| Champ | Type | Description |
|-------|------|-------------|
| `protocolHash` | String | Hachage du protocole ASCII de 64 caractères |
| `clientType` | ClientType | Game ou Editor |
| `language` | String | Code de langue (ex: "en-US") |
| `identityToken` | String | Jeton d'identité d'authentification |
| `uuid` | UUID | UUID du joueur |
| `username` | String | Nom d'utilisateur du joueur (max 16 caractères) |
| `referralData` | byte[] | Données de référence optionnelles (max 4096 octets) |
| `referralSource` | HostAddress | Source de référence optionnelle |

**Taille maximale** : 38 161 octets

### Disconnect (ID 1)

Paquet de terminaison de connexion.

| Champ | Type | Description |
|-------|------|-------------|
| `reason` | String | Message de raison de déconnexion |
| `type` | DisconnectType | Disconnect, Crash, etc. |

**Taille maximale** : 16 384 007 octets

### Ping/Pong (ID 2/3)

Paquets de mesure de latence.

**Ping** (Serveur -> Client) :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | int | Identifiant du ping |
| `time` | InstantData | Données d'horodatage |
| `lastPingValueRaw` | int | Dernier ping brut |
| `lastPingValueDirect` | int | Dernier ping direct |
| `lastPingValueTick` | int | Dernier ping tick |

**Pong** (Client -> Serveur) :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | int | Identifiant de ping correspondant |
| `time` | InstantData | Données d'horodatage |
| `type` | PongType | Raw, Direct, ou Tick |
| `packetQueueSize` | short | Taille de la file d'attente du client |

### ClientMovement (ID 108)

Paquet d'état de mouvement du joueur.

| Champ | Type | Description |
|-------|------|-------------|
| `movementStates` | MovementStates | Indicateurs de mouvement |
| `relativePosition` | HalfFloatPosition | Delta de position |
| `absolutePosition` | Position | Coordonnées absolues |
| `bodyOrientation` | Direction | Rotation du corps |
| `lookOrientation` | Direction | Direction du regard/tête |
| `teleportAck` | TeleportAck | Accusé de réception de téléportation |
| `wishMovement` | Position | Mouvement souhaité |
| `velocity` | Vector3d | Vélocité actuelle |
| `mountedTo` | int | ID de l'entité montée |
| `riderMovementStates` | MovementStates | États de mouvement du cavalier |

**Taille maximale** : 153 octets

### SetChunk (ID 131)

Paquet de données de chunk (compressé).

| Champ | Type | Description |
|-------|------|-------------|
| `x` | int | Coordonnée X du chunk |
| `y` | int | Coordonnée Y du chunk |
| `z` | int | Coordonnée Z du chunk |
| `localLight` | byte[] | Données d'éclairage local |
| `globalLight` | byte[] | Données d'éclairage global |
| `data` | byte[] | Données de blocs |

**Taille maximale** : 12 288 040 octets
**Compression** : Zstd

### EntityUpdates (ID 161)

Paquet de synchronisation des entités (compressé).

| Champ | Type | Description |
|-------|------|-------------|
| `removed` | int[] | IDs des entités supprimées |
| `updates` | EntityUpdate[] | Mises à jour de l'état des entités |

**Taille maximale** : 1 677 721 600 octets
**Compression** : Zstd

### UpdatePlayerInventory (ID 170)

Paquet de synchronisation complète de l'inventaire (compressé).

| Champ | Type | Description |
|-------|------|-------------|
| `storage` | InventorySection | Section de stockage |
| `armor` | InventorySection | Section d'armure |
| `hotbar` | InventorySection | Section de barre d'accès rapide |
| `utility` | InventorySection | Objets utilitaires |
| `builderMaterial` | InventorySection | Matériaux de construction |
| `tools` | InventorySection | Section d'outils |
| `backpack` | InventorySection | Section de sac à dos |
| `sortType` | SortType | Type de tri actuel |

**Compression** : Zstd

### ChatMessage (ID 211)

Paquet de message de chat.

| Champ | Type | Description |
|-------|------|-------------|
| `message` | String | Contenu du message (max 4 096 000 caractères) |

**Taille maximale** : 16 384 006 octets

## Types de Déconnexion

L'énumération `DisconnectType` définit diverses raisons de déconnexion :

| Type | Description |
|------|-------------|
| `Disconnect` | Déconnexion normale |
| `Crash` | Plantage client/serveur |

## Structures Detaillees des Paquets

Cette section fournit les structures binaires detaillees pour les categories de paquets prioritaires, derivees du code source decompile.

### Paquets d'Entite

Les paquets d'entite gerent la synchronisation des entites entre le serveur et les clients, y compris la creation, la mise a jour et la suppression des entites.

#### EntityUpdates (ID 161)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Paquet de mise a jour groupee qui synchronise plusieurs etats d'entites. Envoye a chaque tick pour les entites dans la distance de vue du joueur.

```
+------------------+------------------+--------------------+--------------------+
| Bits Null (1)    | removed Offset   | updates Offset     | Donnees Variables  |
| (octet)          | (int32 LE)       | (int32 LE)         | (variable)         |
+------------------+------------------+--------------------+--------------------+
```

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Masque : bit 0 = removed present, bit 1 = updates present |
| 1 | removedOffset | int32 LE | 4 | Offset vers le tableau removed (-1 si null) |
| 5 | updatesOffset | int32 LE | 4 | Offset vers le tableau updates (-1 si null) |
| 9 | removed | VarInt + int32[] | Variable | Tableau des IDs reseau des entites a supprimer |
| - | updates | VarInt + EntityUpdate[] | Variable | Tableau des mises a jour d'entites |

**Structure EntityUpdate :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| networkId | int32 LE | 4 | Identifiant reseau de l'entite |
| removedOffset | int32 LE | 4 | Offset vers les composants supprimes |
| updatesOffset | int32 LE | 4 | Offset vers les mises a jour de composants |
| removed | ComponentUpdateType[] | Variable | Composants supprimes de l'entite |
| updates | ComponentUpdate[] | Variable | Mises a jour de l'etat des composants |

**Taille maximale :** 1 677 721 600 octets

#### PlayAnimation (ID 162)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Declenche une animation sur une entite. Utilise pour les animations de combat, les emotes et autres retours visuels.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Masque pour les champs nullables |
| 1 | entityId | int32 LE | 4 | ID reseau de l'entite cible |
| 5 | slot | octet | 1 | Valeur enum AnimationSlot (Movement, Action, etc.) |
| 6 | itemAnimationsIdOffset | int32 LE | 4 | Offset vers la chaine d'animations d'objet |
| 10 | animationIdOffset | int32 LE | 4 | Offset vers la chaine d'ID d'animation |
| 14 | itemAnimationsId | VarString | Variable | ID du set d'animations d'objet (optionnel) |
| - | animationId | VarString | Variable | Identifiant de l'animation (optionnel) |

**Taille fixe :** 14 octets (minimum)
**Taille maximale :** 32 768 024 octets

#### ChangeVelocity (ID 163)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Modifie la velocite d'une entite. Utilise pour le recul, les explosions et les effets physiques.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateur de presence pour config |
| 1 | x | float LE | 4 | Composante X de la velocite |
| 5 | y | float LE | 4 | Composante Y de la velocite |
| 9 | z | float LE | 4 | Composante Z de la velocite |
| 13 | changeType | octet | 1 | ChangeVelocityType : 0=Add, 1=Set, 2=Multiply |
| 14 | config | VelocityConfig | 21 | Configuration de velocite optionnelle |

**Taille fixe :** 35 octets

#### ApplyKnockback (ID 164)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Applique une force de recul a l'entite joueur du client, typiquement depuis le combat ou les explosions.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = hitPosition present |
| 1 | hitPosition | Position | 24 | Position d'impact (x, y, z en doubles) |
| 25 | x | float LE | 4 | Force de recul X |
| 29 | y | float LE | 4 | Force de recul Y |
| 33 | z | float LE | 4 | Force de recul Z |
| 37 | changeType | octet | 1 | Enum ChangeVelocityType |

**Taille fixe :** 38 octets

#### SpawnModelParticles (ID 165)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Fait apparaitre des effets de particules attaches aux os du modele d'une entite.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | entityId | int32 LE | 4 | ID reseau de l'entite |
| 5 | modelParticles | ModelParticle[] | Variable | Tableau de configurations de particules |

**Taille maximale :** 1 677 721 600 octets

#### MountMovement (ID 166)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Envoie les entrees de mouvement pour une entite montee (vehicule, creature chevauchable).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | absolutePosition | Position | 24 | Position absolue de la monture dans le monde |
| 25 | bodyOrientation | Direction | 12 | Rotation du corps de la monture (yaw, pitch, roll en floats) |
| 37 | movementStates | MovementStates | 22 | Indicateurs et etats de mouvement |

**Taille fixe :** 59 octets

#### SetEntitySeed (ID 160)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Definit la graine aleatoire pour une entite, utilisee pour les effets proceduraux deterministes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | entitySeed | int32 LE | 4 | Valeur de la graine aleatoire |

**Taille fixe :** 4 octets

---

### Paquets Joueur

Les paquets joueur gerent l'etat du joueur, le mouvement, les actions et le mode de jeu.

#### JoinWorld (ID 104)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Envoye lorsqu'un joueur rejoint ou transite vers un monde. Declenche le chargement du monde sur le client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | clearWorld | octet | 1 | Booleen : effacer les donnees du monde existant |
| 1 | fadeInOut | octet | 1 | Booleen : utiliser une transition en fondu |
| 2 | worldUuid | UUID | 16 | Identifiant unique du monde (deux int64 LE) |

**Taille fixe :** 18 octets

#### ClientReady (ID 105)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Signale l'etat de preparation du client pendant le chargement du monde.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | readyForChunks | octet | 1 | Booleen : pret a recevoir les donnees de chunk |
| 1 | readyForGameplay | octet | 1 | Booleen : pret pour les paquets de gameplay |

**Taille fixe :** 2 octets

#### ClientMovement (ID 108)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Paquet de mouvement principal envoye a chaque tick contenant la position, l'orientation et l'etat de mouvement du joueur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet[2] | 2 | Indicateurs de presence pour 10 champs optionnels |
| 2 | movementStates | MovementStates | 22 | Indicateurs de mouvement (saut, sprint, accroupi, etc.) |
| 24 | relativePosition | HalfFloatPosition | 6 | Delta de position (floats demi-precision) |
| 30 | absolutePosition | Position | 24 | Coordonnees absolues du monde (3x double) |
| 54 | bodyOrientation | Direction | 12 | Rotation du corps (3x float) |
| 66 | lookOrientation | Direction | 12 | Direction de la camera/tete (3x float) |
| 78 | teleportAck | TeleportAck | 1 | Accuse de reception de teleportation serveur |
| 79 | wishMovement | Position | 24 | Direction de mouvement souhaitee |
| 103 | velocity | Vector3d | 24 | Velocite actuelle (3x double) |
| 127 | mountedTo | int32 LE | 4 | ID de l'entite si monte (-1 sinon) |
| 131 | riderMovementStates | MovementStates | 22 | Etats de mouvement en tant que cavalier |

**Taille fixe :** 153 octets

#### ClientTeleport (ID 109)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Teleporte le joueur a une nouvelle position, utilise pour la reapparition, les portails et les commandes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateur de presence pour modelTransform |
| 1 | teleportId | octet | 1 | ID de sequence de teleportation pour l'accuse de reception |
| 2 | modelTransform | ModelTransform | 49 | Donnees de position et rotation |
| 51 | resetVelocity | octet | 1 | Booleen : reinitialiser la velocite du joueur |

**Taille fixe :** 52 octets

#### MouseInteraction (ID 111)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Envoie les evenements d'entree souris incluant les clics et les interactions avec le monde.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | clientTimestamp | int64 LE | 8 | Horodatage cote client |
| 9 | activeSlot | int32 LE | 4 | Emplacement de la barre d'acces rapide selectionne |
| 13 | screenPoint | Vector2f | 8 | Coordonnees ecran de la souris (optionnel) |
| 21 | mouseButton | MouseButtonEvent | 3 | Etat du bouton (optionnel) |
| 24 | worldInteraction | WorldInteraction | 20 | Donnees d'interaction bloc/entite (optionnel) |
| 44 | itemInHandIdOffset | int32 LE | 4 | Offset vers la chaine d'ID d'objet |
| 48 | mouseMotionOffset | int32 LE | 4 | Offset vers les donnees de mouvement souris |

**Taille fixe :** 52 octets (minimum)
**Taille maximale :** 20 480 071 octets

#### ClientPlaceBlock (ID 117)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Requete pour placer un bloc a une position specifique.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = position, bit 1 = rotation |
| 1 | position | BlockPosition | 12 | Coordonnees du bloc (3x int32) |
| 13 | rotation | BlockRotation | 3 | Etat de rotation du bloc |
| 16 | placedBlockId | int32 LE | 4 | Identifiant du type de bloc |

**Taille fixe :** 20 octets

#### SetGameMode (ID 101)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Change le mode de jeu du joueur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | gameMode | octet | 1 | Enum GameMode : Adventure, Creative, Spectator |

**Taille fixe :** 1 octet

---

### Paquets de Monde

Les paquets de monde gerent les donnees de chunks, les mises a jour de blocs et la synchronisation de l'etat du monde.

#### SetChunk (ID 131)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les donnees de chunk au client incluant les donnees de blocs et les informations d'eclairage.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les tableaux de donnees |
| 1 | x | int32 LE | 4 | Coordonnee X du chunk |
| 5 | y | int32 LE | 4 | Coordonnee Y du chunk |
| 9 | z | int32 LE | 4 | Coordonnee Z du chunk |
| 13 | localLightOffset | int32 LE | 4 | Offset vers les donnees d'eclairage local |
| 17 | globalLightOffset | int32 LE | 4 | Offset vers les donnees d'eclairage global |
| 21 | dataOffset | int32 LE | 4 | Offset vers les donnees de blocs |
| 25 | localLight | VarInt + octet[] | Variable | Niveaux de lumiere locale par bloc |
| - | globalLight | VarInt + octet[] | Variable | Niveaux de lumiere globale (ciel) |
| - | data | VarInt + octet[] | Variable | Donnees de blocs compressees |

**Taille fixe :** 25 octets (minimum)
**Taille maximale :** 12 288 040 octets

#### UnloadChunk (ID 135)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Indique au client de decharger une colonne de chunk de la memoire.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | chunkX | int32 LE | 4 | Coordonnee X de la colonne de chunk |
| 4 | chunkZ | int32 LE | 4 | Coordonnee Z de la colonne de chunk |

**Taille fixe :** 8 octets

#### ServerSetBlock (ID 140)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour un seul bloc dans le monde. Utilise pour la casse, le placement et les changements d'etat des blocs.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | x | int32 LE | 4 | Coordonnee X du bloc |
| 4 | y | int32 LE | 4 | Coordonnee Y du bloc |
| 8 | z | int32 LE | 4 | Coordonnee Z du bloc |
| 12 | blockId | int32 LE | 4 | Nouvel ID de type de bloc (0 = air) |
| 16 | filler | int16 LE | 2 | Donnees reservees/remplissage |
| 18 | rotation | octet | 1 | Etat de rotation du bloc (0-23) |

**Taille fixe :** 19 octets

#### ServerSetBlocks (ID 141)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Mise a jour groupee pour plusieurs blocs dans un chunk, plus efficace que plusieurs paquets ServerSetBlock.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | x | int32 LE | 4 | Coordonnee X du chunk |
| 4 | y | int32 LE | 4 | Coordonnee Y du chunk |
| 8 | z | int32 LE | 4 | Coordonnee Z du chunk |
| 12 | cmds | SetBlockCmd[] | Variable | Tableau de commandes de blocs |

**Structure SetBlockCmd (9 octets chacune) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| index | int16 LE | 2 | Index du bloc dans le chunk (0-4095) |
| blockId | int32 LE | 4 | ID du type de bloc |
| filler | int16 LE | 2 | Donnees reservees |
| rotation | octet | 1 | Rotation du bloc (0-23) |

**Taille maximale :** 36 864 017 octets

#### UpdateBlockDamage (ID 144)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour l'etat d'endommagement d'un bloc pendant la casse, utilise pour l'animation de casse.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateur de presence pour position |
| 1 | blockPosition | BlockPosition | 12 | Coordonnees du bloc cible |
| 13 | damage | float LE | 4 | Dommages totaux accumules (0.0-1.0) |
| 17 | delta | float LE | 4 | Changement de dommages ce tick |

**Taille fixe :** 21 octets

#### SetPaused (ID 158)

**Direction :** Bidirectionnel
**Compresse :** Non
**Description :** Met en pause ou reprend le jeu (solo uniquement).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | paused | octet | 1 | Booleen : etat de pause du jeu |

**Taille fixe :** 1 octet

---

### Paquets d'Inventaire

Les paquets d'inventaire gerent l'etat de l'inventaire du joueur, le deplacement d'objets et les interactions avec les conteneurs.

#### UpdatePlayerInventory (ID 170)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Synchronisation complete de l'inventaire, envoye a la connexion et apres des changements d'inventaire significatifs.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour 7 sections d'inventaire |
| 1 | sortType | octet | 1 | Enum SortType : Name, Type, Quality |
| 2 | storageOffset | int32 LE | 4 | Offset vers la section stockage |
| 6 | armorOffset | int32 LE | 4 | Offset vers la section armure |
| 10 | hotbarOffset | int32 LE | 4 | Offset vers la section barre d'acces rapide |
| 14 | utilityOffset | int32 LE | 4 | Offset vers la section utilitaires |
| 18 | builderMaterialOffset | int32 LE | 4 | Offset vers les materiaux de construction |
| 22 | toolsOffset | int32 LE | 4 | Offset vers la section outils |
| 26 | backpackOffset | int32 LE | 4 | Offset vers la section sac a dos |
| 30+ | sections | InventorySection[] | Variable | Donnees de section avec piles d'objets |

**Taille fixe :** 30 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### DropItemStack (ID 174)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Requete pour jeter des objets de l'inventaire dans le monde.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | ID de la section source |
| 4 | slotId | int32 LE | 4 | Index de l'emplacement source |
| 8 | quantity | int32 LE | 4 | Nombre d'objets a jeter |

**Taille fixe :** 12 octets

#### MoveItemStack (ID 175)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Requete pour deplacer des objets entre les emplacements ou sections d'inventaire.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | fromSectionId | int32 LE | 4 | ID de la section source |
| 4 | fromSlotId | int32 LE | 4 | Index de l'emplacement source |
| 8 | quantity | int32 LE | 4 | Nombre d'objets a deplacer |
| 12 | toSectionId | int32 LE | 4 | ID de la section destination |
| 16 | toSlotId | int32 LE | 4 | Index de l'emplacement destination |

**Taille fixe :** 20 octets

#### SetActiveSlot (ID 177)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Change la selection de l'emplacement actif de la barre d'acces rapide du joueur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | ID de la section (generalement barre d'acces rapide) |
| 4 | activeSlot | int32 LE | 4 | Nouvel index de l'emplacement actif |

**Taille fixe :** 8 octets

#### InventoryAction (ID 179)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Requete d'action d'inventaire generique (tout prendre, diviser pile, etc.).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | ID de la section cible |
| 4 | inventoryActionType | octet | 1 | Enum InventoryActionType |
| 5 | actionData | octet | 1 | Parametre specifique a l'action |

**Valeurs InventoryActionType :**
- `0` - TakeAll : Prendre la pile entiere
- `1` - Split : Diviser la pile en deux
- `2` - TakeOne : Prendre un seul objet

**Taille fixe :** 6 octets

---

### Paquets de Fenetre/Conteneur

Les paquets de fenetre gerent les conteneurs d'interface comme les coffres, les tables de craft et les boutiques.

#### OpenWindow (ID 200)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Ouvre une fenetre d'interface de conteneur sur le client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | id | int32 LE | 4 | ID unique de la fenetre |
| 5 | windowType | octet | 1 | Enum WindowType |
| 6 | windowDataOffset | int32 LE | 4 | Offset vers la configuration de fenetre |
| 10 | inventoryOffset | int32 LE | 4 | Offset vers l'inventaire du conteneur |
| 14 | extraResourcesOffset | int32 LE | 4 | Offset vers les donnees supplementaires |

**Valeurs WindowType :**
- `0` - Container : Coffre/stockage generique
- `1` - Crafting : Table de craft
- `2` - Furnace : Interface de fusion
- `3` - Anvil : Reparation/nommage
- `4` - Enchanting : Table d'enchantement
- `5` - Trading : Boutique PNJ

**Taille maximale :** 1 677 721 600 octets

#### CloseWindow (ID 202)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Notifie le serveur que le joueur a ferme une fenetre.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | id | int32 LE | 4 | ID de la fenetre a fermer |

**Taille fixe :** 4 octets

#### SendWindowAction (ID 203)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Envoie une action specifique a la fenetre (crafter objet, trier, etc.).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | id | int32 LE | 4 | ID de la fenetre |
| 4 | action | WindowAction | Variable | Donnees d'action polymorphes |

**Types WindowAction :**
- CraftItemAction
- SelectSlotAction
- SortItemsAction
- TierUpgradeAction
- CraftRecipeAction
- ChangeBlockAction

**Taille maximale :** 32 768 027 octets

---

## Reference des Types de Donnees

### Types Primitifs

| Type | Taille | Description |
|------|--------|-------------|
| octet | 1 | Entier non signe 8 bits |
| int16 LE | 2 | Entier signe 16 bits little-endian |
| int32 LE | 4 | Entier signe 32 bits little-endian |
| int64 LE | 8 | Entier signe 64 bits little-endian |
| float LE | 4 | IEEE 754 32 bits little-endian |
| double LE | 8 | IEEE 754 64 bits little-endian |
| VarInt | 1-5 | Entier non signe a longueur variable |
| VarString | Variable | Longueur VarInt + octets UTF-8 |
| UUID | 16 | Deux valeurs int64 LE |

### Structures Communes

**Position (24 octets) :**
```
+------------------+------------------+------------------+
| x (double LE)    | y (double LE)    | z (double LE)    |
+------------------+------------------+------------------+
```

**BlockPosition (12 octets) :**
```
+------------------+------------------+------------------+
| x (int32 LE)     | y (int32 LE)     | z (int32 LE)     |
+------------------+------------------+------------------+
```

**Direction (12 octets) :**
```
+------------------+------------------+------------------+
| yaw (float LE)   | pitch (float LE) | roll (float LE)  |
+------------------+------------------+------------------+
```

**HalfFloatPosition (6 octets) :**
```
+------------------+------------------+------------------+
| x (half float)   | y (half float)   | z (half float)   |
+------------------+------------------+------------------+
```

**Vector3d (24 octets) :**
```
+------------------+------------------+------------------+
| x (double LE)    | y (double LE)    | z (double LE)    |
+------------------+------------------+------------------+
```

**Vector2f (8 octets) :**
```
+------------------+------------------+
| x (float LE)     | y (float LE)     |
+------------------+------------------+
```

**Vector2i (8 octets) :**
```
+------------------+------------------+
| x (int32 LE)     | y (int32 LE)     |
+------------------+------------------+
```

### Structures de Deplacement et d'Entree

Cette section documente les structures de donnees utilisees pour le deplacement du joueur, la physique et la gestion des entrees.

#### MovementStates (22 octets)

La structure `MovementStates` encode l'etat de deplacement actuel du joueur sous forme d'indicateurs booleens. Chaque indicateur occupe 1 octet (non-zero = vrai).

```
+----------+----------------+----------+----------+----------+----------+
| idle (1) | horizontalIdle | jumping  | flying   | walking  | running  |
+----------+----------------+----------+----------+----------+----------+
| sprinting| crouching      | forcedCr | falling  | climbing | inFluid  |
+----------+----------------+----------+----------+----------+----------+
| swimming | swimJumping    | onGround | mantling | sliding  | mounting |
+----------+----------------+----------+----------+----------+----------+
| rolling  | sitting        | gliding  | sleeping |          |          |
+----------+----------------+----------+----------+----------+----------+
```

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | idle | octet | 1 | Joueur immobile (pas de mouvement) |
| 1 | horizontalIdle | octet | 1 | Aucune entree de mouvement horizontal |
| 2 | jumping | octet | 1 | En train de sauter |
| 3 | flying | octet | 1 | Mode vol actif |
| 4 | walking | octet | 1 | Mouvement a vitesse de marche |
| 5 | running | octet | 1 | Mouvement a vitesse de course |
| 6 | sprinting | octet | 1 | Mouvement a vitesse de sprint |
| 7 | crouching | octet | 1 | Accroupi/furtif |
| 8 | forcedCrouching | octet | 1 | Accroupissement force (plafond bas) |
| 9 | falling | octet | 1 | En chute dans l'air |
| 10 | climbing | octet | 1 | En train de grimper (echelle/lianes) |
| 11 | inFluid | octet | 1 | Submerge dans un fluide |
| 12 | swimming | octet | 1 | En train de nager |
| 13 | swimJumping | octet | 1 | Saut en nageant |
| 14 | onGround | octet | 1 | Debout sur un sol solide |
| 15 | mantling | octet | 1 | En train d'escalader un rebord |
| 16 | sliding | octet | 1 | Glissade active |
| 17 | mounting | octet | 1 | Montee/descente d'une entite |
| 18 | rolling | octet | 1 | Roulade de combat active |
| 19 | sitting | octet | 1 | Assis sur un siege/chaise |
| 20 | gliding | octet | 1 | Vol plane avec ailes/elytra |
| 21 | sleeping | octet | 1 | Endormi dans un lit |

**Taille fixe :** 22 octets
**Source :** `com/hypixel/hytale/protocol/MovementStates.java`

#### SavedMovementStates (1 octet)

Un sous-ensemble minimal des etats de mouvement qui persiste entre les sessions.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | flying | octet | 1 | Etat du mode vol |

**Taille fixe :** 1 octet
**Source :** `com/hypixel/hytale/protocol/SavedMovementStates.java`

#### MovementSettings (251 octets)

La structure `MovementSettings` contient tous les parametres de physique et de mouvement pour une entite joueur. Envoyee via UpdateMovementSettings (ID 110) lorsque les proprietes de mouvement changent.

**Parametres Physiques :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | mass | float LE | 4 | Masse de l'entite pour les calculs physiques |
| 4 | dragCoefficient | float LE | 4 | Coefficient de trainee aerodynamique |
| 8 | invertedGravity | octet | 1 | Direction de gravite inversee |
| 9 | velocityResistance | float LE | 4 | Taux de decroissance de la velocite |
| 141 | canFly | octet | 1 | Capacite de vol activee |
| 142 | collisionExpulsionForce | float LE | 4 | Force appliquee lors d'une collision |

**Parametres de Saut :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 13 | jumpForce | float LE | 4 | Force de saut de base |
| 17 | swimJumpForce | float LE | 4 | Force de saut en nageant |
| 21 | jumpBufferDuration | float LE | 4 | Duree du tampon d'entree de saut |
| 25 | jumpBufferMaxYVelocity | float LE | 4 | Velocite Y max pour saut tamponne |

**Deplacement au Sol :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 29 | acceleration | float LE | 4 | Taux d'acceleration au sol |
| 89 | baseSpeed | float LE | 4 | Vitesse de deplacement de base |
| 117 | maxSpeedMultiplier | float LE | 4 | Multiplicateur de vitesse maximale |
| 121 | minSpeedMultiplier | float LE | 4 | Multiplicateur de vitesse minimale |

**Multiplicateurs de Vitesse Directionnels :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 146 | forwardWalkSpeedMultiplier | float LE | 4 | Vitesse de marche avant |
| 150 | backwardWalkSpeedMultiplier | float LE | 4 | Vitesse de marche arriere |
| 154 | strafeWalkSpeedMultiplier | float LE | 4 | Vitesse de marche laterale |
| 158 | forwardRunSpeedMultiplier | float LE | 4 | Vitesse de course avant |
| 162 | backwardRunSpeedMultiplier | float LE | 4 | Vitesse de course arriere |
| 166 | strafeRunSpeedMultiplier | float LE | 4 | Vitesse de course laterale |
| 170 | forwardCrouchSpeedMultiplier | float LE | 4 | Vitesse accroupi avant |
| 174 | backwardCrouchSpeedMultiplier | float LE | 4 | Vitesse accroupi arriere |
| 178 | strafeCrouchSpeedMultiplier | float LE | 4 | Vitesse accroupi laterale |
| 182 | forwardSprintSpeedMultiplier | float LE | 4 | Vitesse de sprint avant |

**Controle Aerien :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 33 | airDragMin | float LE | 4 | Trainee aerienne minimale |
| 37 | airDragMax | float LE | 4 | Trainee aerienne maximale |
| 41 | airDragMinSpeed | float LE | 4 | Seuil de vitesse pour trainee min |
| 45 | airDragMaxSpeed | float LE | 4 | Seuil de vitesse pour trainee max |
| 49 | airFrictionMin | float LE | 4 | Friction aerienne minimale |
| 53 | airFrictionMax | float LE | 4 | Friction aerienne maximale |
| 57 | airFrictionMinSpeed | float LE | 4 | Seuil de vitesse pour friction min |
| 61 | airFrictionMaxSpeed | float LE | 4 | Seuil de vitesse pour friction max |
| 65 | airSpeedMultiplier | float LE | 4 | Multiplicateur de vitesse aerienne |
| 69 | airControlMinSpeed | float LE | 4 | Vitesse min pour controle aerien |
| 73 | airControlMaxSpeed | float LE | 4 | Vitesse max pour controle aerien |
| 77 | airControlMinMultiplier | float LE | 4 | Controle aerien a vitesse min |
| 81 | airControlMaxMultiplier | float LE | 4 | Controle aerien a vitesse max |
| 85 | comboAirSpeedMultiplier | float LE | 4 | Vitesse aerienne pendant combo |

**Escalade :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 93 | climbSpeed | float LE | 4 | Vitesse d'escalade verticale |
| 97 | climbSpeedLateral | float LE | 4 | Mouvement lateral en escalade |
| 101 | climbUpSprintSpeed | float LE | 4 | Vitesse sprint montee |
| 105 | climbDownSprintSpeed | float LE | 4 | Vitesse sprint descente |

**Vol :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 109 | horizontalFlySpeed | float LE | 4 | Vitesse de vol horizontale |
| 113 | verticalFlySpeed | float LE | 4 | Vitesse de vol verticale |

**Direction Souhaitee (Traitement d'Entree) :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 125 | wishDirectionGravityX | float LE | 4 | Composante X de gravite d'entree |
| 129 | wishDirectionGravityY | float LE | 4 | Composante Y de gravite d'entree |
| 133 | wishDirectionWeightX | float LE | 4 | Composante X de poids d'entree |
| 137 | wishDirectionWeightY | float LE | 4 | Composante Y de poids d'entree |

**Mecaniques de Chute :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 186 | variableJumpFallForce | float LE | 4 | Force de chute saut variable |
| 190 | fallEffectDuration | float LE | 4 | Duree de l'effet d'impact |
| 194 | fallJumpForce | float LE | 4 | Force de saut apres atterrissage |
| 198 | fallMomentumLoss | float LE | 4 | Perte de vitesse a l'atterrissage |

**Saut Automatique :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 202 | autoJumpObstacleSpeedLoss | float LE | 4 | Perte de vitesse au saut auto |
| 206 | autoJumpObstacleSprintSpeedLoss | float LE | 4 | Perte vitesse sprint au saut auto |
| 210 | autoJumpObstacleEffectDuration | float LE | 4 | Duree effet saut auto |
| 214 | autoJumpObstacleSprintEffectDuration | float LE | 4 | Duree effet sprint saut auto |
| 218 | autoJumpObstacleMaxAngle | float LE | 4 | Angle max de pente pour saut auto |
| 222 | autoJumpDisableJumping | octet | 1 | Desactiver saut manuel pendant saut auto |

**Mecaniques de Glissade :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 223 | minSlideEntrySpeed | float LE | 4 | Vitesse minimale pour glissade |
| 227 | slideExitSpeed | float LE | 4 | Vitesse en sortie de glissade |

**Mecaniques de Roulade :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 231 | minFallSpeedToEngageRoll | float LE | 4 | Vitesse min de chute pour roulade |
| 235 | maxFallSpeedToEngageRoll | float LE | 4 | Vitesse max de chute pour roulade |
| 239 | rollStartSpeedModifier | float LE | 4 | Modificateur vitesse debut roulade |
| 243 | rollExitSpeedModifier | float LE | 4 | Modificateur vitesse fin roulade |
| 247 | rollTimeToComplete | float LE | 4 | Duree animation roulade |

**Taille fixe :** 251 octets
**Source :** `com/hypixel/hytale/protocol/MovementSettings.java`

#### VelocityConfig (21 octets)

Configuration de la resistance a la velocite appliquee aux reculs et forces physiques.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | groundResistance | float LE | 4 | Resistance a la velocite au sol |
| 4 | groundResistanceMax | float LE | 4 | Resistance maximale au sol |
| 8 | airResistance | float LE | 4 | Resistance a la velocite en l'air |
| 12 | airResistanceMax | float LE | 4 | Resistance maximale en l'air |
| 16 | threshold | float LE | 4 | Seuil de velocite |
| 20 | style | octet | 1 | Enum VelocityThresholdStyle |

**Valeurs VelocityThresholdStyle :**
- `0` - Linear : Interpolation lineaire
- `1` - Exponential : Courbe exponentielle

**Taille fixe :** 21 octets
**Source :** `com/hypixel/hytale/protocol/VelocityConfig.java`

### Structures d'Evenements d'Entree

Cette section documente les structures utilisees pour la gestion des entrees souris et clavier.

#### MouseButtonEvent (3 octets)

Represente un changement d'etat d'un bouton de souris.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | mouseButtonType | octet | 1 | Enum MouseButtonType |
| 1 | state | octet | 1 | Enum MouseButtonState |
| 2 | clicks | octet | 1 | Nombre de clics (1 = simple, 2 = double) |

**Valeurs MouseButtonType :**
- `0` - Left : Bouton gauche de la souris
- `1` - Middle : Bouton du milieu (molette)
- `2` - Right : Bouton droit de la souris
- `3` - X1 : Bouton souris 4 (retour)
- `4` - X2 : Bouton souris 5 (avant)

**Valeurs MouseButtonState :**
- `0` - Pressed : Bouton enfonce
- `1` - Released : Bouton relache

**Taille fixe :** 3 octets
**Source :** `com/hypixel/hytale/protocol/MouseButtonEvent.java`

#### MouseMotionEvent (Variable)

Capture le mouvement de la souris avec les etats des boutons enfonces.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | relativeMotion | Vector2i | 8 | Delta souris (pixels, optionnel) |
| 9+ | mouseButtonType | VarInt + byte[] | Variable | Tableau des types de boutons enfonces |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 4 096 014 octets
**Source :** `com/hypixel/hytale/protocol/MouseMotionEvent.java`

#### TeleportAck (1 octet)

Structure d'acquittement pour les teleportations initiees par le serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | teleportId | octet | 1 | ID de sequence de teleportation a acquitter |

**Taille fixe :** 1 octet
**Source :** `com/hypixel/hytale/protocol/TeleportAck.java`

---

## Reference des Fichiers Sources

| Composant | Fichier Source |
|-----------|----------------|
| Transport | `com/hypixel/hytale/server/core/io/transport/QUICTransport.java` |
| Base des Paquets | `com/hypixel/hytale/protocol/Packet.java` |
| Constantes du Protocole | `com/hypixel/hytale/protocol/ProtocolSettings.java` |
| IO des Paquets | `com/hypixel/hytale/protocol/io/PacketIO.java` |
| VarInt | `com/hypixel/hytale/protocol/io/VarInt.java` |
| Encodeur de Paquets | `com/hypixel/hytale/protocol/io/netty/PacketEncoder.java` |
| Gestionnaire Initial | `com/hypixel/hytale/server/core/io/handlers/InitialPacketHandler.java` |
| Gestionnaire de Jeu | `com/hypixel/hytale/server/core/io/handlers/game/GamePacketHandler.java` |
| Paquets d'Entite | `com/hypixel/hytale/protocol/packets/entities/*.java` |
| Paquets Joueur | `com/hypixel/hytale/protocol/packets/player/*.java` |
| Paquets de Monde | `com/hypixel/hytale/protocol/packets/world/*.java` |
| Paquets d'Inventaire | `com/hypixel/hytale/protocol/packets/inventory/*.java` |
| Paquets de Fenetre | `com/hypixel/hytale/protocol/packets/window/*.java` |
| Paquets Camera | `com/hypixel/hytale/protocol/packets/camera/*.java` |
| Paquets Machinima | `com/hypixel/hytale/protocol/packets/machinima/*.java` |
| Paquets Interface | `com/hypixel/hytale/protocol/packets/interface_/*.java` |
| Paquets d'Interaction | `com/hypixel/hytale/protocol/packets/interaction/*.java` |
| Paquets d'Objectif | `com/hypixel/hytale/protocol/packets/assets/TrackOrUpdateObjective.java`, `UntrackObjective.java`, `UpdateObjectiveTask.java` |
| Structures d'Objectif | `com/hypixel/hytale/protocol/Objective.java`, `ObjectiveTask.java` |
| Paquets de Debogage PNJ | `com/hypixel/hytale/protocol/packets/buildertools/BuilderToolSetNPCDebug.java` |
| Structures de Mouvement | `com/hypixel/hytale/protocol/MovementStates.java`, `MovementSettings.java` |
| Structures d'Entree | `com/hypixel/hytale/protocol/MouseButtonEvent.java`, `MouseMotionEvent.java` |

---

## Structures de Paquets Supplementaires

Cette section documente les categories de paquets supplementaires non couvertes dans la section principale ci-dessus.

### Paquets de Chat/Communication

Les paquets de chat gerent la communication textuelle entre les joueurs et le serveur.

#### ChatMessage (ID 211)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Envoie un message de chat du client au serveur. Utilise pour les entrees de chat des joueurs.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = message present |
| 1 | message | VarString | Variable | Contenu du message de chat (max 4 096 000 caracteres) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

#### ServerMessage (ID 210)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Envoie un message formate du serveur au client. Utilise pour les messages systeme et le chat formate.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = message present |
| 1 | type | octet | 1 | Valeur enum ChatType |
| 2 | message | FormattedMessage | Variable | Contenu du message formate (optionnel) |

**Valeurs ChatType :**
- `0` - Chat : Message de chat standard

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### Notification (ID 212)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Affiche une notification popup au joueur. Prend en charge les messages primaires/secondaires, les icones et l'affichage d'objets.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | style | octet | 1 | Valeur enum NotificationStyle |
| 2 | messageOffset | int32 LE | 4 | Offset vers le message principal |
| 6 | secondaryMessageOffset | int32 LE | 4 | Offset vers le message secondaire |
| 10 | iconOffset | int32 LE | 4 | Offset vers la chaine d'icone |
| 14 | itemOffset | int32 LE | 4 | Offset vers les donnees de l'objet |
| 18+ | (Donnees variables) | Variable | Variable | Message, icone et donnees d'objet |

**Valeurs NotificationStyle :**
- `0` - Default : Notification standard
- `1` - Danger : Style rouge/alerte
- `2` - Warning : Style jaune/attention
- `3` - Success : Style vert/succes

**Taille fixe :** 18 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### KillFeedMessage (ID 213)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Affiche une entree dans le fil des eliminations montrant qui a tue qui, avec une icone optionnelle (arme/cause).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | killerOffset | int32 LE | 4 | Offset vers le message du tueur |
| 5 | decedentOffset | int32 LE | 4 | Offset vers le message du decede |
| 9 | iconOffset | int32 LE | 4 | Offset vers la chaine d'icone |
| 13+ | (Donnees variables) | Variable | Variable | Donnees du tueur, du decede et de l'icone |

**Taille fixe :** 13 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### ShowEventTitle (ID 214)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Affiche un titre/sous-titre en superposition sur l'ecran du joueur avec des animations de fondu configurables.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | fadeInDuration | float LE | 4 | Duree de l'animation d'apparition (secondes) |
| 5 | fadeOutDuration | float LE | 4 | Duree de l'animation de disparition (secondes) |
| 9 | duration | float LE | 4 | Duree d'affichage (secondes) |
| 13 | isMajor | octet | 1 | Booleen : style de titre large |
| 14 | iconOffset | int32 LE | 4 | Offset vers la chaine d'icone |
| 18 | primaryTitleOffset | int32 LE | 4 | Offset vers le titre principal |
| 22 | secondaryTitleOffset | int32 LE | 4 | Offset vers le titre secondaire |
| 26+ | (Donnees variables) | Variable | Variable | Contenu du titre |

**Taille fixe :** 26 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### HideEventTitle (ID 215)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Masque le titre d'evenement actuellement affiche avec une animation de fondu.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | fadeOutDuration | float LE | 4 | Duree de disparition en secondes |

**Taille fixe :** 4 octets

---

### Paquets Audio

Les paquets audio gerent la lecture audio sur le client.

#### PlaySoundEvent2D (ID 154)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Joue un son non positionnel (2D), typiquement pour les sons d'interface ou la musique qui doit etre jouee a un volume constant.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | soundEventIndex | int32 LE | 4 | ID de l'evenement sonore du registre d'assets |
| 4 | category | octet | 1 | Valeur enum SoundCategory |
| 5 | volumeModifier | float LE | 4 | Multiplicateur de volume (1.0 = normal) |
| 9 | pitchModifier | float LE | 4 | Multiplicateur de hauteur (1.0 = normal) |

**Valeurs SoundCategory :**
- `0` - Music : Musique de fond
- `1` - Ambient : Sons environnementaux
- `2` - SFX : Effets sonores
- `3` - UI : Sons d'interface

**Taille fixe :** 13 octets

#### PlaySoundEvent3D (ID 155)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Joue un son positionnel (3D) a un emplacement specifique du monde avec attenuation selon la distance.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = position presente |
| 1 | soundEventIndex | int32 LE | 4 | ID de l'evenement sonore |
| 5 | category | octet | 1 | Valeur enum SoundCategory |
| 6 | position | Position | 24 | Position dans le monde (x, y, z en doubles) |
| 30 | volumeModifier | float LE | 4 | Multiplicateur de volume |
| 34 | pitchModifier | float LE | 4 | Multiplicateur de hauteur |

**Taille fixe :** 38 octets

#### PlaySoundEventEntity (ID 156)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Joue un son attache a une entite, suivant la position de l'entite.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | soundEventIndex | int32 LE | 4 | ID de l'evenement sonore |
| 4 | networkId | int32 LE | 4 | ID reseau de l'entite pour attacher le son |
| 8 | volumeModifier | float LE | 4 | Multiplicateur de volume |
| 12 | pitchModifier | float LE | 4 | Multiplicateur de hauteur |

**Taille fixe :** 16 octets

---

### Paquets Meteo/Environnement

Les paquets meteo controlent les conditions environnementales et l'heure du jour.

#### UpdateWeather (ID 149)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Change l'etat meteo actuel avec une animation de transition.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | weatherIndex | int32 LE | 4 | ID du type de meteo du registre d'assets |
| 4 | transitionSeconds | float LE | 4 | Duree de la transition meteo |

**Taille fixe :** 8 octets

#### UpdateEditorWeatherOverride (ID 150)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Force un etat meteo specifique en mode editeur, contournant les transitions meteo normales.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | weatherIndex | int32 LE | 4 | ID du type de meteo a forcer |

**Taille fixe :** 4 octets

#### UpdateEnvironmentMusic (ID 151)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Change la musique ambiante en fonction de l'environnement/biome.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | environmentIndex | int32 LE | 4 | ID d'environnement pour la selection musicale |

**Taille fixe :** 4 octets

#### UpdateTime (ID 146)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Synchronise l'heure du jeu entre le serveur et le client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = gameTime present |
| 1 | gameTime | InstantData | 12 | Donnees de l'heure actuelle du jeu |

**Taille fixe :** 13 octets

---

### Paquets Camera

Les paquets camera controlent la vue de la camera du joueur et les effets.

#### SetServerCamera (ID 280)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Definit le mode de vue de la camera du client et les parametres optionnels de camera personnalisee.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = cameraSettings present |
| 1 | clientCameraView | octet | 1 | Valeur enum ClientCameraView |
| 2 | isLocked | octet | 1 | Booleen : empecher le controle de la camera par le joueur |
| 3 | cameraSettings | ServerCameraSettings | 154 | Configuration de camera personnalisee (optionnel) |

**Valeurs ClientCameraView :**
- `0` - FirstPerson : Vue a la premiere personne
- `1` - ThirdPerson : Vue a la troisieme personne
- `2` - Custom : Vue personnalisee controlee par le serveur

**Taille fixe :** 157 octets

#### CameraShakeEffect (ID 281)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Applique un effet de tremblement de camera pour le retour d'impact, les explosions, etc.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | cameraShakeId | int32 LE | 4 | ID du preset de tremblement de camera |
| 4 | intensity | float LE | 4 | Multiplicateur d'intensite du tremblement |
| 8 | mode | octet | 1 | Valeur enum AccumulationMode |

**Valeurs AccumulationMode :**
- `0` - Set : Remplacer le tremblement actuel
- `1` - Sum : Ajouter au tremblement actuel
- `2` - Average : Melanger avec le tremblement actuel

**Taille fixe :** 9 octets

#### RequestFlyCameraMode (ID 282)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande a entrer ou sortir du mode camera libre (camera spectateur/cinematique).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | entering | octet | 1 | Booleen : entrer (true) ou sortir (false) du mode libre |

**Taille fixe :** 1 octet

#### SetFlyCameraMode (ID 283)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Reponse du serveur activant ou desactivant le mode camera libre.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | entering | octet | 1 | Booleen : etat d'entree en mode libre |

**Taille fixe :** 1 octet

---

### Paquets Machinima

Les paquets machinima prennent en charge les fonctionnalites d'enregistrement et de lecture cinematique.

#### RequestMachinimaActorModel (ID 260)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande les donnees du modele d'acteur pour une scene machinima.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | modelIdOffset | int32 LE | 4 | Offset vers la chaine d'ID du modele |
| 5 | sceneNameOffset | int32 LE | 4 | Offset vers la chaine du nom de scene |
| 9 | actorNameOffset | int32 LE | 4 | Offset vers la chaine du nom d'acteur |
| 13+ | (Donnees variables) | Variable | Variable | Donnees de chaines |

**Taille fixe :** 13 octets (minimum)
**Taille maximale :** 49 152 028 octets

#### SetMachinimaActorModel (ID 261)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur envoie les donnees du modele d'acteur pour le rendu machinima.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | modelOffset | int32 LE | 4 | Offset vers les donnees du modele |
| 5 | sceneNameOffset | int32 LE | 4 | Offset vers le nom de scene |
| 9 | actorNameOffset | int32 LE | 4 | Offset vers le nom d'acteur |
| 13+ | (Donnees variables) | Variable | Variable | Donnees du modele et des chaines |

**Taille fixe :** 13 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### UpdateMachinimaScene (ID 262)

**Direction :** Bidirectionnel
**Compresse :** Oui (Zstd)
**Description :** Met a jour l'etat de la scene machinima incluant le controle de lecture et les donnees de scene.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | frame | float LE | 4 | Image d'animation actuelle |
| 5 | updateType | octet | 1 | Valeur enum SceneUpdateType |
| 6 | playerOffset | int32 LE | 4 | Offset vers le nom du joueur |
| 10 | sceneNameOffset | int32 LE | 4 | Offset vers le nom de scene |
| 14 | sceneOffset | int32 LE | 4 | Offset vers les donnees de scene |
| 18+ | (Donnees variables) | Variable | Variable | Contenu de la scene |

**Valeurs SceneUpdateType :**
- `0` - Update : Mise a jour generale de la scene
- `1` - Play : Demarrer la lecture
- `2` - Stop : Arreter la lecture
- `3` - Frame : Aller a une image specifique
- `4` - Save : Sauvegarder les donnees de la scene

**Taille fixe :** 18 octets (minimum)
**Taille maximale :** 36 864 033 octets

---

### Paquets Effets/Particules

Les paquets d'effets gerent les effets visuels et le post-traitement.

#### SpawnParticleSystem (ID 152)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Fait apparaitre un systeme de particules a une position du monde avec couleur et echelle optionnelles.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | position | Position | 24 | Position dans le monde (optionnel) |
| 25 | rotation | Direction | 12 | Angles de rotation (optionnel) |
| 37 | scale | float LE | 4 | Multiplicateur d'echelle |
| 41 | color | Color | 3 | Teinte de couleur RGB (optionnel) |
| 44 | particleSystemId | VarString | Variable | Chaine d'ID du systeme de particules |

**Taille fixe :** 44 octets (minimum)
**Taille maximale :** 16 384 049 octets

#### SpawnBlockParticleSystem (ID 153)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Fait apparaitre des effets de particules bases sur les blocs (casse, marche, etc.).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = position presente |
| 1 | blockId | int32 LE | 4 | ID du type de bloc pour la texture |
| 5 | particleType | octet | 1 | Enum BlockParticleEvent (Walk, Break, etc.) |
| 6 | position | Position | 24 | Position dans le monde (optionnel) |

**Taille fixe :** 30 octets

#### UpdatePostFxSettings (ID 361)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour les parametres des effets visuels de post-traitement.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | globalIntensity | float LE | 4 | Intensite globale de l'effet |
| 4 | power | float LE | 4 | Puissance/force de l'effet |
| 8 | sunshaftScale | float LE | 4 | Echelle des rayons de soleil |
| 12 | sunIntensity | float LE | 4 | Luminosite du soleil |
| 16 | sunshaftIntensity | float LE | 4 | Intensite de l'effet des rayons de soleil |

**Taille fixe :** 20 octets

---

### Paquets de Fenetre (Etendus)

#### UpdateWindow (ID 201)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Met a jour le contenu d'une fenetre ouverte sans la fermer et la rouvrir.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | id | int32 LE | 4 | ID de la fenetre a mettre a jour |
| 5 | windowDataOffset | int32 LE | 4 | Offset vers les donnees JSON de la fenetre |
| 9 | inventoryOffset | int32 LE | 4 | Offset vers la section d'inventaire |
| 13 | extraResourcesOffset | int32 LE | 4 | Offset vers les ressources supplementaires |
| 17+ | (Donnees variables) | Variable | Variable | Contenu de la fenetre |

**Taille fixe :** 17 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### ClientOpenWindow (ID 204)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande a ouvrir une fenetre d'un type specifique.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | type | octet | 1 | Valeur enum WindowType |

**Valeurs WindowType :**
- `0` - Container : Conteneur de stockage generique
- `1` - PocketCrafting : Grille de craft d'inventaire
- `2` - BasicCrafting : Table de craft basique
- `3` - DiagramCrafting : Craft base sur les recettes
- `4` - StructuralCrafting : Craft de construction/structure
- `5` - Processing : Interface de fourneau/traitement
- `6` - Memories : Interface de memoire/journal

**Taille fixe :** 1 octet

---

### Paquets de Craft

Les paquets de craft gerent la gestion des recettes et les operations de fabrication.

#### CraftItemAction (Action de Fenetre)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Demande de fabrication d'un objet en utilisant l'interface de craft actuelle. Envoye comme WindowAction dans le paquet SendWindowAction.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| craftCount | int32 LE | 4 | Nombre d'objets a fabriquer |

**Taille fixe :** 4 octets

#### CraftRecipeAction (Action de Fenetre)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Demande de fabrication d'une recette specifique par ID. Utilise avec la fonctionnalite du livre de recettes.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| recipeIdOffset | int32 LE | 4 | Offset vers la chaine d'ID de recette |
| craftCount | int32 LE | 4 | Nombre de fois a fabriquer |
| recipeId | VarString | Variable | Chaine d'identifiant de recette |

**Taille fixe :** 8 octets (minimum)
**Taille maximale :** 16 384 012 octets

#### CancelCraftingAction (Action de Fenetre)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Annule une operation de craft en cours.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Action vide |

**Taille fixe :** 0 octets

#### UpdateRecipes (Paquet d'Assets)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie le registre complet des recettes au client pendant la phase de configuration.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = recettes presentes |
| 1 | recipes | RecipeData[] | Variable | Tableau de definitions de recettes |

**Taille maximale :** 1 677 721 600 octets

#### UpdateKnownRecipes (ID 221)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour la liste des recettes debloquees/connues du client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = recettes presentes |
| 1 | recipes | String[] | Variable | Tableau d'IDs de recettes connues |

**Taille maximale :** 1 677 721 600 octets

---

### Paquets de Monture/PNJ

Les paquets de monture et PNJ gerent les mecaniques de chevauchement et les interactions avec les PNJ.

#### MountNPC (ID 293)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Attache le joueur a une entite PNJ (creature chevauchable, vehicule). Envoye lorsque le joueur monte avec succes une entite.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | anchorX | float LE | 4 | Offset X du point d'ancrage de la monture |
| 4 | anchorY | float LE | 4 | Offset Y du point d'ancrage de la monture |
| 8 | anchorZ | float LE | 4 | Offset Z du point d'ancrage de la monture |
| 12 | entityId | int32 LE | 4 | ID reseau de l'entite a monter |

**Taille fixe :** 16 octets

#### DismountNPC (ID 294)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Detache le joueur de l'entite actuellement montee. Envoye lorsque le joueur descend ou est force de descendre.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Paquet vide |

**Taille fixe :** 0 octets

#### SyncInteractionChains (ID 290)

**Direction :** Bidirectionnel
**Compresse :** Non
**Description :** Synchronise plusieurs etats de chaines d'interaction. Utilise pour les actions de combat, l'utilisation d'objets et les interactions en plusieurs etapes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | updates | VarInt + SyncInteractionChain[] | Variable | Tableau de mises a jour de chaines d'interaction |

**Structure SyncInteractionChain :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| activeHotbarSlot | int32 LE | 4 | Index de l'emplacement de barre d'acces rapide actif |
| activeUtilitySlot | int32 LE | 4 | Index de l'emplacement utilitaire actif |
| activeToolsSlot | int32 LE | 4 | Index de l'emplacement d'outils actif |
| initial | octet | 1 | Booleen : est une chaine initiale |
| desync | octet | 1 | Booleen : chaine desynchronisee |
| overrideRootInteraction | int32 LE | 4 | ID d'interaction de remplacement (-2147483648 si aucun) |
| interactionType | octet | 1 | InteractionType : Primary (0), Secondary (1) |
| equipSlot | int32 LE | 4 | Emplacement d'equipement implique |
| chainId | int32 LE | 4 | Identifiant de la chaine |
| state | octet | 1 | InteractionState : Finished, Running, etc. |
| operationBaseIndex | int32 LE | 4 | Index de base de l'operation |
| (champs variables) | ... | Variable | IDs d'objets, donnees de chaine derivee, donnees d'interaction |

**Taille fixe :** 61 octets (minimum par SyncInteractionChain)
**Taille maximale :** 1 677 721 600 octets

#### CancelInteractionChain (ID 291)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Annule une chaine d'interaction en cours. Envoye lorsqu'un joueur interrompt une action ou relache une entree.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = forkedId present |
| 1 | chainId | int32 LE | 4 | Chaine d'interaction a annuler |
| 5 | forkedId | ForkedChainId | Variable | Identifiant de chaine derivee optionnel |

**Taille fixe :** 5 octets (minimum)
**Taille maximale :** 1 038 octets

#### PlayInteractionFor (ID 292)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Indique au client de jouer une animation d'interaction pour une entite specifique. Utilise pour le retour de combat et les effets visuels.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | entityId | int32 LE | 4 | ID reseau de l'entite cible |
| 5 | chainId | int32 LE | 4 | Identifiant de la chaine d'interaction |
| 9 | operationIndex | int32 LE | 4 | Index de l'operation dans la chaine |
| 13 | interactionId | int32 LE | 4 | ID d'interaction specifique |
| 17 | interactionType | octet | 1 | Enum InteractionType |
| 18 | cancel | octet | 1 | Booleen : annuler l'interaction |
| 19 | forkedIdOffset | int32 LE | 4 | Offset vers l'ID de chaine derivee |
| 23 | interactedItemIdOffset | int32 LE | 4 | Offset vers la chaine d'ID d'objet |
| 27+ | (Donnees variables) | Variable | Variable | Donnees d'ID derive et d'ID d'objet |

**Taille fixe :** 27 octets (minimum)
**Taille maximale :** 16 385 065 octets

---

### Paquets d'Objectif/Quete

Les paquets d'objectif gerent le suivi des quetes, la progression des taches et les mises a jour de l'interface d'objectifs. Ces paquets permettent au serveur de communiquer les etats des quetes et leur progression aux clients.

#### TrackOrUpdateObjective (ID 69)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Suit un nouvel objectif ou met a jour un objectif existant sur le panneau d'objectifs du client. Utilise quand un joueur accepte une quete, recoit des mises a jour d'objectif, ou doit afficher la progression d'une quete.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = objectif present |
| 1 | objective | Objective | Variable | Donnees de l'objectif (optionnel) |

**Structure Objective :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | objectiveUuid | UUID | 16 | Identifiant unique pour cet objectif |
| 17 | objectiveTitleKeyOffset | int32 LE | 4 | Offset vers la cle de localisation du titre |
| 21 | objectiveDescriptionKeyOffset | int32 LE | 4 | Offset vers la cle de localisation de la description |
| 25 | objectiveLineIdOffset | int32 LE | 4 | Offset vers l'identifiant de la ligne de quete |
| 29 | tasksOffset | int32 LE | 4 | Offset vers le tableau de taches |
| 33+ | objectiveTitleKey | VarString | Variable | Cle de localisation pour le titre de l'objectif (optionnel) |
| - | objectiveDescriptionKey | VarString | Variable | Cle de localisation pour la description (optionnel) |
| - | objectiveLineId | VarString | Variable | Identifiant de la ligne de quete (optionnel) |
| - | tasks | VarInt + ObjectiveTask[] | Variable | Tableau des taches de l'objectif (optionnel) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 1 677 721 600 octets

#### UntrackObjective (ID 70)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Supprime un objectif du suivi du client. Utilise quand une quete est completee, abandonnee, ou ne doit plus etre affichee.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | objectiveUuid | UUID | 16 | UUID de l'objectif a ne plus suivre |

**Taille fixe :** 16 octets

#### UpdateObjectiveTask (ID 71)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour une tache specifique dans un objectif suivi. Utilise pour les mises a jour de progression incrementales sans renvoyer l'objectif entier.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = tache presente |
| 1 | objectiveUuid | UUID | 16 | UUID de l'objectif parent |
| 17 | taskIndex | int32 LE | 4 | Index de la tache a mettre a jour (base 0) |
| 21 | task | ObjectiveTask | Variable | Donnees de la tache mise a jour (optionnel) |

**Structure ObjectiveTask :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = taskDescriptionKey present |
| 1 | currentCompletion | int32 LE | 4 | Compte de progression actuel |
| 5 | completionNeeded | int32 LE | 4 | Compte total requis pour la completion |
| 9 | taskDescriptionKey | VarString | Variable | Cle de localisation pour la description de la tache (optionnel) |

**Taille fixe :** 21 octets (minimum)
**Taille maximale :** 16 384 035 octets

---

### Paquets de Debogage PNJ

Les paquets de debogage PNJ fournissent des outils de developpement et de debogage pour le comportement et l'IA des PNJ.

#### BuilderToolSetNPCDebug (ID 423)

**Direction :** Bidirectionnel
**Compresse :** Non
**Description :** Active ou desactive la visualisation de debogage pour une entite PNJ specifique. Quand active, affiche l'etat de l'IA, la recherche de chemin, les arbres de comportement et autres informations de debogage.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | entityId | int32 LE | 4 | ID reseau de l'entite PNJ cible |
| 4 | enabled | octet | 1 | Booleen : visualisation de debogage activee |

**Taille fixe :** 5 octets

---

### Paquets d'Acces Serveur/Permissions

Les paquets d'acces serveur controlent les permissions des joueurs et l'accessibilite du serveur dans les mondes solo.

#### UpdateServerAccess (ID 251)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Notifie le client des parametres d'acces serveur mis a jour. Utilise quand l'hote change l'acces LAN/amis.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | access | octet | 1 | Valeur enum Access |

**Valeurs Access :**
- `0` - Private : Pas d'acces externe
- `1` - LAN : Acces reseau local uniquement
- `2` - Friend : Les amis peuvent rejoindre
- `3` - Open : N'importe qui peut rejoindre

**Taille fixe :** 1 octet

#### SetServerAccess (ID 252)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Demande du client pour changer le niveau d'acces du serveur (hote uniquement).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | access | octet | 1 | Valeur enum Access desiree |

**Taille fixe :** 1 octet

---

### Paquets de Chargement d'Assets

Les paquets d'assets gerent le transfert et la synchronisation des assets de jeu pendant la configuration de connexion.

#### AssetInitialize (ID 21)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Initie le transfert d'assets, fournissant des metadonnees sur les assets a envoyer.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | totalParts | int32 LE | 4 | Nombre total de parties d'assets |
| 5 | totalSize | int64 LE | 8 | Taille totale de tous les assets en octets |
| 13 | hashOffset | int32 LE | 4 | Offset vers la chaine de hachage d'asset |
| 17+ | hash | VarString | Variable | Hachage du bundle d'assets pour mise en cache |

**Taille fixe :** 17 octets (minimum)
**Taille maximale :** 16 384 021 octets

#### AssetPart (ID 22)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Transfere un morceau de donnees d'asset. Les gros assets sont divises en plusieurs parties.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = donnees presentes |
| 1 | partIndex | int32 LE | 4 | Index de cette partie (base 0) |
| 5 | data | byte[] | Variable | Morceau de donnees d'asset |

**Taille maximale :** 1 677 721 600 octets

#### AssetFinalize (ID 24)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Signale la fin du transfert d'assets, permettant au client de finaliser le chargement.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Paquet vide |

**Taille fixe :** 0 octets

#### RequestAssets (ID 23)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande les donnees d'assets au serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = hachage present |
| 1 | hash | VarString | Variable | Hachage d'asset en cache du client (pour mises a jour delta) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

---

### Paquets de Configuration du Monde

Les paquets de configuration du monde configurent les parametres du monde pendant la phase de configuration.

#### WorldSettings (ID 20)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie la configuration du monde incluant la hauteur et les assets requis.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = requiredAssets present |
| 1 | worldHeight | int32 LE | 4 | Hauteur maximale du monde en blocs |
| 5 | requiredAssets | Asset[] | Variable | Tableau de definitions d'assets requis |

**Taille fixe :** 5 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

#### ServerTags (ID 34)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Envoie les tags definis par le serveur utilises pour les mecaniques de jeu et le filtrage.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = tags presents |
| 1 | tags | `Map<String, int32>` | Variable | Dictionnaire de noms de tags vers IDs |

**Taille maximale :** 1 677 721 600 octets

---

### Paquets de Fluides/Generation du Monde

Les paquets de fluides et generation du monde gerent les caracteristiques du terrain comme l'eau et la lave.

#### SetFluids (ID 136)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Definit les donnees de fluides pour une section de chunk.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = donnees presentes |
| 1 | x | int32 LE | 4 | Coordonnee X du chunk |
| 5 | y | int32 LE | 4 | Coordonnee Y du chunk |
| 9 | z | int32 LE | 4 | Coordonnee Z du chunk |
| 13 | data | byte[] | Variable | Donnees de niveau de fluide compressees (max 4 096 000 octets) |

**Taille fixe :** 13 octets (minimum)
**Taille maximale :** 4 096 018 octets

---

### Paquets de Sommeil/Temps

Les paquets de sommeil gerent les mecaniques de sommeil multijoueur pour la progression du temps.

#### UpdateSleepState (ID 157)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour l'interface de sommeil du client et synchronise la progression du sommeil.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = horloge presente, bit 1 = multijoueur present |
| 1 | grayFade | octet | 1 | Booleen : activer le fondu gris de l'ecran |
| 2 | sleepUi | octet | 1 | Booleen : afficher l'interface de sommeil |
| 3 | clock | SleepClock | 33 | Donnees de l'horloge de sommeil (optionnel) |
| 36 | multiplayer | SleepMultiplayer | Variable | Info sommeil multijoueur (optionnel) |

**Structure SleepClock (33 octets) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| startGametime | InstantData | 12 | Heure de jeu au debut du sommeil (optionnel) |
| targetGametime | InstantData | 12 | Heure de reveil cible (optionnel) |
| progress | float LE | 4 | Progression du sommeil (0.0-1.0) |
| durationSeconds | float LE | 4 | Duree du sommeil en secondes |

**Taille fixe :** 36 octets (minimum)
**Taille maximale :** 65 536 050 octets

---

### Paquets d'Interface Personnalisee

Les paquets d'interface personnalisee permettent aux serveurs de creer des interfaces dynamiques.

#### CustomHud (ID 217)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Met a jour la superposition HUD personnalisee avec des elements d'interface definis par le serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = commandes presentes |
| 1 | clear | octet | 1 | Booleen : effacer les elements HUD existants |
| 2 | commands | CustomUICommand[] | Variable | Tableau de commandes d'interface |

**Taille maximale :** 1 677 721 600 octets

#### CustomPage (ID 218)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Ouvre ou met a jour une page/ecran d'interface personnalisee.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1 | isInitial | octet | 1 | Booleen : chargement initial de la page |
| 2 | clear | octet | 1 | Booleen : effacer le contenu existant |
| 3 | lifetime | octet | 1 | Enum CustomPageLifetime |
| 4 | keyOffset | int32 LE | 4 | Offset vers la chaine de cle de page |
| 8 | commandsOffset | int32 LE | 4 | Offset vers le tableau de commandes |
| 12 | eventBindingsOffset | int32 LE | 4 | Offset vers les liaisons d'evenements |
| 16+ | (Donnees variables) | Variable | Variable | Contenu de la page |

**Valeurs CustomPageLifetime :**
- `0` - CantClose : La page ne peut pas etre fermee par l'utilisateur
- `1` - CanClose : L'utilisateur peut fermer la page
- `2` - AutoClose : La page se ferme automatiquement

**Taille fixe :** 16 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### Paquets de Portail

Les paquets de portail gerent les transitions de dimension/monde.

#### UpdatePortal (ID 229)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour l'etat et la definition du portail pour les transitions de dimension.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = etat present, bit 1 = definition presente |
| 1 | state | PortalState | 5 | Etat actuel du portail (optionnel) |
| 6 | definition | PortalDef | Variable | Donnees de definition du portail (optionnel) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 16 384 020 octets

---

### Paquets de Liste de Joueurs

Les paquets de liste de joueurs gerent l'affichage de la liste des joueurs du serveur.

#### UpdateServerPlayerList (ID 226)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour la liste des joueurs affichee dans le menu pause/tab.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = joueurs presents |
| 1 | players | ServerPlayerListUpdate[] | Variable | Tableau de mises a jour de joueurs |

**Structure ServerPlayerListUpdate (32 octets chacune) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| uuid | UUID | 16 | UUID du joueur |
| username | VarString | Variable | Nom d'affichage du joueur |
| action | octet | 1 | Ajouter, Supprimer ou Mettre a jour |

**Taille maximale :** 131 072 006 octets

---

### Paquets du Mode Creatif

Les paquets du mode creatif gerent les operations d'inventaire en mode creatif.

#### SetCreativeItem (ID 171)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Definit un objet dans l'inventaire du mode creatif, permettant de faire apparaitre n'importe quel objet.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | Section d'inventaire cible |
| 4 | slotId | int32 LE | 4 | Index de l'emplacement cible |
| 8 | override | octet | 1 | Booleen : remplacer l'objet existant |
| 9 | item | ItemQuantity | Variable | Donnees de l'objet a definir |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 16 384 019 octets

#### SmartMoveItemStack (ID 176)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Deplacement intelligent d'objet qui trouve automatiquement le meilleur emplacement de destination.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | fromSectionId | int32 LE | 4 | ID de la section source |
| 4 | fromSlotId | int32 LE | 4 | Index de l'emplacement source |
| 8 | quantity | int32 LE | 4 | Nombre d'objets a deplacer |
| 12 | moveType | octet | 1 | Valeur enum SmartMoveType |

**Valeurs SmartMoveType :**
- `0` - EquipOrMergeStack : Equiper l'objet ou fusionner avec une pile existante

**Taille fixe :** 13 octets

#### DropCreativeItem (ID 172)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Lache un objet de l'inventaire du mode creatif dans le monde. Contrairement a DropItemStack qui reference un emplacement d'inventaire existant, ce paquet permet de lacher n'importe quel objet directement.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | item | ItemQuantity | Variable | Donnees de l'objet a lacher dans le monde |

**Taille fixe :** Variable (depend de ItemQuantity)
**Taille maximale :** 16 384 010 octets

#### SmartGiveCreativeItem (ID 173)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Don intelligent d'objet en mode creatif qui trouve automatiquement le meilleur emplacement d'inventaire pour l'objet, soit en l'equipant, soit en le fusionnant avec une pile existante.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | moveType | octet | 1 | Valeur enum SmartMoveType |
| 1 | item | ItemQuantity | Variable | Donnees de l'objet a donner |

**Valeurs SmartMoveType :**
- `0` - EquipOrMergeStack : Equiper l'objet ou fusionner avec une pile existante

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 011 octets

#### SwitchHotbarBlockSet (ID 178)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Change le jeu de blocs de la barre d'acces rapide en fonction d'un type d'objet. Utilise en mode creatif pour basculer entre differentes palettes ou categories de blocs pour un acces rapide.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = itemId present |
| 1 | itemId | VarString | Variable | ID du type d'objet vers lequel basculer (optionnel, max 4 096 000 caracteres) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

---

### Paquets de Combat

Les paquets de combat gerent l'application des degats, la detection des coups, le recul, les projectiles et les mecaniques de mort/reapparition. Ces paquets fonctionnent ensemble pour fournir un retour de combat reactif.

#### Structure DamageCause

La structure `DamageCause` fournit des details sur ce qui a cause des degats a une entite.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = id present, bit 1 = damageTextColor present |
| 1 | idOffset | int32 LE | 4 | Offset vers la chaine d'ID de cause de degats |
| 5 | damageTextColorOffset | int32 LE | 4 | Offset vers la chaine de couleur de texte |
| 9+ | id | VarString | Variable | Identifiant de la cause de degats (ex: "fall", "fire", "attack") |
| - | damageTextColor | VarString | Variable | Couleur hexadecimale pour l'affichage du texte de degats |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 32 768 019 octets

---

#### UpdateHitboxCollisionConfig (ID 74)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Synchronise les donnees de configuration de collision des hitbox utilisees pour la detection des coups en combat. Definit comment les entites entrent en collision et interagissent pendant le combat.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = configs present |
| 1 | type | octet | 1 | Enum UpdateType : Init, Update ou Delta |
| 2 | maxId | int32 LE | 4 | ID de configuration maximum |
| 6 | hitboxCollisionConfigs | `Map<int32, HitboxCollisionConfig>` | Variable | Dictionnaire de configuration (optionnel) |

**Structure HitboxCollisionConfig (5 octets) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| collisionType | octet | 1 | Valeur enum CollisionType |
| softCollisionOffsetRatio | float LE | 4 | Multiplicateur d'offset de collision douce |

**Valeurs CollisionType :**
- `0` - Hard : Collision solide, empeche le chevauchement
- `1` - Soft : Permet un chevauchement partiel avec repousse
- `2` - None : Aucune reponse de collision

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 36 864 011 octets

---

#### UpdateProjectileConfigs (ID 85)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Synchronise les donnees de configuration des projectiles pour le combat a distance. Definit la physique, les visuels et le comportement d'interaction pour les fleches, les objets lances et les projectiles magiques.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = configs present, bit 1 = removedConfigs present |
| 1 | type | octet | 1 | Enum UpdateType : Init, Update ou Delta |
| 2 | configsOffset | int32 LE | 4 | Offset vers le dictionnaire de configs |
| 6 | removedConfigsOffset | int32 LE | 4 | Offset vers le tableau de configs supprimees |
| 10+ | configs | `Map<String, ProjectileConfig>` | Variable | Configurations de projectiles (optionnel) |
| - | removedConfigs | String[] | Variable | IDs des configs supprimees (optionnel) |

**Structure ProjectileConfig (171+ octets) :**

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | physicsConfig | PhysicsConfig | 122 | Parametres de physique (optionnel) |
| 123 | launchForce | double LE | 8 | Multiplicateur de velocite de lancement initiale |
| 131 | spawnOffset | Vector3f | 12 | Offset de position d'apparition depuis l'entite (optionnel) |
| 143 | rotationOffset | Direction | 12 | Offset de rotation initiale (optionnel) |
| 155 | launchLocalSoundEventIndex | int32 LE | 4 | Evenement sonore de lancement |
| 159 | projectileSoundEventIndex | int32 LE | 4 | Evenement sonore pendant le vol |
| 163 | modelOffset | int32 LE | 4 | Offset vers les donnees du modele |
| 167 | interactionsOffset | int32 LE | 4 | Offset vers la carte des interactions |
| 171+ | model | Model | Variable | Donnees du modele visuel (optionnel) |
| - | interactions | `Map<InteractionType, int32>` | Variable | Gestionnaires d'interaction (optionnel) |

**Valeurs InteractionType :**
- `0` - OnHitEntity : Declenche lors de l'impact sur une entite
- `1` - OnHitBlock : Declenche lors de l'impact sur un bloc
- `2` - OnExpire : Declenche quand la duree de vie du projectile expire

**Taille fixe :** 10 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### Paquets de Gestion de la Barre d'Acces Rapide

Les paquets de gestion de la barre d'acces rapide gerent la sauvegarde et le chargement des configurations de barre d'acces rapide pour des preselections d'acces rapide.

#### LoadHotbar (ID 106)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Demande de charger une configuration de barre d'acces rapide sauvegardee depuis une rangee d'inventaire specifique. Utilise pour restaurer rapidement une configuration de barre d'acces rapide precedemment sauvegardee.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | inventoryRow | octet | 1 | Index de la rangee d'inventaire depuis laquelle charger la barre d'acces rapide |

**Taille fixe :** 1 octet

#### SaveHotbar (ID 107)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Sauvegarde la configuration actuelle de la barre d'acces rapide dans une rangee d'inventaire specifique pour une recuperation ulterieure. Permet aux joueurs de stocker plusieurs configurations de barre d'acces rapide.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | inventoryRow | octet | 1 | Index de la rangee d'inventaire vers laquelle sauvegarder la barre d'acces rapide |

**Taille fixe :** 1 octet

---

### Paquets d'Effets/Statuts

Les paquets d'effets gerent les effets de statut d'entite et les buffs/debuffs.

#### UpdateEntityEffects (Paquet d'Assets)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie le registre de definitions d'effets pendant la configuration.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = effets presents |
| 1 | effects | EffectData[] | Variable | Tableau de definitions d'effets |

**Taille maximale :** 1 677 721 600 octets

---

## Administration du Serveur

Cette section documente l'administration du serveur, la moderation des joueurs et la gestion des permissions. Contrairement a la plupart des fonctionnalites de jeu, le systeme d'administration de Hytale est principalement **base sur les commandes** plutot que sur les paquets. Les actions administratives sont executees via des commandes console ou chat, qui utilisent ensuite les paquets reseau existants pour l'application.

### Apercu de l'Architecture

```
+-------------------+     +-------------------+     +-------------------+
| Commandes         | --> | Gestionnaire de   | --> | Paquets Reseau    |
| Console/Chat      |     | Commandes         |     | (Application)     |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
   /kick joueur             KickCommand.java           Disconnect (ID 1)
   /ban joueur              BanCommand.java            Disconnect (ID 1)
   /op add joueur           OpAddCommand.java          (Changement perm.)
   /whitelist add           WhitelistAddCommand.java   (Verification acces)
```

### Systeme de Console

La console serveur fournit un acces administratif direct sans authentification. Les commandes console sont traitees par `ConsoleModule` (`com.hypixel.hytale.server.core.console.ConsoleModule`).

**Caracteristiques Principales :**
- L'expediteur console (`ConsoleSender`) a **toutes les permissions** par defaut
- Utilise la bibliotheque JLine pour la gestion du terminal
- Supporte les terminaux simples et couleur
- Les commandes peuvent etre prefixees par `/` mais c'est optionnel

**Source :** `com/hypixel/hytale/server/core/console/ConsoleModule.java`

```java
// L'expediteur console retourne toujours true pour les verifications de permission
@Override
public boolean hasPermission(@Nonnull String id) {
    return true;
}
```

### Commandes de Moderation des Joueurs

#### Commande Kick

**Commande :** `/kick <joueur>`
**Permission :** `hytale.command.kick`
**Description :** Deconnecte immediatement un joueur du serveur.

**Implementation :** Utilise le paquet `Disconnect` (ID 1) avec la raison "You were kicked."

| Champ | Valeur |
|-------|--------|
| reason | "You were kicked." |
| type | DisconnectType.Disconnect (0) |

**Source :** `com/hypixel/hytale/server/core/command/commands/server/KickCommand.java`

#### Commande Ban

**Commande :** `/ban <nom_utilisateur> [raison]`
**Permission :** `hytale.command.ban`
**Disponibilite :** Multijoueur uniquement (indisponible en solo)
**Description :** Bannit definitivement un joueur du serveur.

**Types de Bannissement :**

| Type | Classe | Description |
|------|--------|-------------|
| `infinite` | `InfiniteBan` | Bannissement permanent sans expiration |
| `timed` | `TimedBan` | Bannissement temporaire avec horodatage d'expiration |

**Structure de Donnees de Bannissement (JSON) :**

```json
{
  "type": "infinite",
  "target": "uuid-joueur",
  "by": "uuid-admin",
  "timestamp": 1234567890000,
  "reason": "Violation des regles du serveur"
}
```

**Champ Supplementaire TimedBan :**

```json
{
  "expiresOn": 1234567890000
}
```

**Format du Message de Deconnexion :**
- Infini : `"You are permanently banned! Reason: <raison>"`
- Temporaire : `"You are temporarily banned for <duree>! Reason: <raison>"`

**Source :** `com/hypixel/hytale/server/core/modules/accesscontrol/commands/BanCommand.java`

#### Commande Unban

**Commande :** `/unban <nom_utilisateur>`
**Permission :** `hytale.command.unban`
**Disponibilite :** Multijoueur uniquement
**Description :** Supprime un bannissement d'un joueur.

**Source :** `com/hypixel/hytale/server/core/modules/accesscontrol/commands/UnbanCommand.java`

### Commandes Whitelist

Le systeme de liste blanche controle l'acces au serveur avant l'authentification.

**Commande :** `/whitelist <sous-commande>`
**Permission :** `hytale.command.whitelist.*`

| Sous-commande | Description |
|---------------|-------------|
| `add <nom_utilisateur>` | Ajouter un joueur a la liste blanche |
| `remove <nom_utilisateur>` | Retirer un joueur de la liste blanche |
| `enable` | Activer l'application de la liste blanche |
| `disable` | Desactiver l'application de la liste blanche |
| `status` | Afficher le statut de la liste blanche |
| `list` | Lister les joueurs en liste blanche |
| `clear` | Retirer tous les joueurs de la liste blanche |

**Flux de Verification d'Acces :**

```
Connexion Joueur --> AccessControlModule --> WhitelistProvider --> Autoriser/Refuser
                                         --> BanProvider --------> Autoriser/Refuser
```

**Source :** `com/hypixel/hytale/server/core/modules/accesscontrol/AccessControlModule.java`

### Systeme de Permissions

Hytale implemente un systeme de permissions hierarchique avec support des jokers et de la negation.

#### Format des Permissions

| Motif | Description |
|-------|-------------|
| `hytale.command.kick` | Permission specifique |
| `hytale.command.*` | Joker (toutes les permissions de commande) |
| `*` | Toutes les permissions |
| `-hytale.command.ban` | Permission niee (explicitement refusee) |
| `-*` | Refuser toutes les permissions |

#### Noeuds de Permission par Defaut

| Permission | Description |
|------------|-------------|
| `hytale.command` | Permission de base pour toutes les commandes |
| `hytale.command.<nom>` | Permission pour une commande specifique |
| `hytale.editor.asset` | Acces a l'editeur d'assets |
| `hytale.editor.builderTools` | Acces aux outils de construction |
| `hytale.editor.brush.use` | Utilisation de l'outil pinceau |
| `hytale.editor.brush.config` | Configuration du pinceau |
| `hytale.editor.prefab.use` | Placement de prefabs |
| `hytale.editor.prefab.manage` | Gestion des prefabs |
| `hytale.editor.selection.use` | Utilisation de l'outil de selection |
| `hytale.editor.selection.clipboard` | Operations de presse-papiers |
| `hytale.editor.selection.modify` | Modification de selection |
| `hytale.editor.history` | Historique annuler/refaire |
| `hytale.camera.flycam` | Mode camera libre |

**Source :** `com/hypixel/hytale/server/core/permissions/HytalePermissions.java`

#### Commandes Operateur

**Commande :** `/op <sous-commande>`
**Description :** Gere le statut operateur (admin) des joueurs.

| Sous-commande | Permission | Description |
|---------------|------------|-------------|
| `self` | (console uniquement) | Accorder OP a l'expediteur de commande |
| `add <joueur>` | `hytale.command.op.add` | Accorder le statut OP a un joueur |
| `remove <joueur>` | `hytale.command.op.remove` | Revoquer le statut OP d'un joueur |

**Groupe OP :** Les joueurs auxquels le statut OP est accorde sont ajoutes au groupe de permission `"OP"`.

**Source :** `com/hypixel/hytale/server/core/permissions/commands/op/OpCommand.java`

#### Commandes de Gestion des Permissions

**Commande :** `/perm <sous-commande>`
**Description :** Manipulation directe des permissions.

**Sous-commandes Utilisateur :**

| Commande | Description |
|----------|-------------|
| `/perm user list <uuid>` | Lister les permissions de l'utilisateur |
| `/perm user add <uuid> <permissions...>` | Ajouter des permissions a l'utilisateur |
| `/perm user remove <uuid> <permissions...>` | Retirer des permissions de l'utilisateur |
| `/perm user group list <uuid>` | Lister les groupes de l'utilisateur |
| `/perm user group add <uuid> <groupe>` | Ajouter l'utilisateur a un groupe |
| `/perm user group remove <uuid> <groupe>` | Retirer l'utilisateur d'un groupe |

**Sous-commandes Groupe :**

| Commande | Description |
|----------|-------------|
| `/perm group list <groupe>` | Lister les permissions du groupe |
| `/perm group add <groupe> <permissions...>` | Ajouter des permissions au groupe |
| `/perm group remove <groupe> <permissions...>` | Retirer des permissions du groupe |

**Source :** `com/hypixel/hytale/server/core/permissions/commands/PermCommand.java`

### Controle d'Acces Serveur (Solo)

Pour les mondes solo ouverts en LAN ou aux amis, l'acces est controle via les paquets `ServerAccess`.

#### UpdateServerAccess (ID 251)

**Direction :** Serveur -> Client
**Description :** Notifie les clients des changements de niveau d'acces au serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | access | octet | 1 | Valeur enum Access |

**Valeurs Access :**

| Valeur | Nom | Description |
|--------|-----|-------------|
| 0 | Private | Pas d'acces externe (solo uniquement) |
| 1 | LAN | Les joueurs du reseau local peuvent rejoindre |
| 2 | Friend | Les amis peuvent rejoindre via invitation |
| 3 | Open | N'importe qui peut rejoindre |

**Taille fixe :** 1 octet

#### SetServerAccess (ID 252)

**Direction :** Client -> Serveur
**Description :** L'hote demande a changer le niveau d'acces du serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | access | octet | 1 | Valeur enum Access desiree |

**Taille fixe :** 1 octet

### Commande de Diffusion

**Commande :** `/say <message>` ou `/broadcast <message>`
**Permission :** `hytale.command.say`
**Description :** Envoie un message a tous les joueurs du serveur.

**Format du Message :** Utilise le paquet `ServerMessage` (ID 210) avec un style de couleur cyan.

**Source :** `com/hypixel/hytale/server/core/console/command/SayCommand.java`

### Commandes de Configuration du Monde

**Commande :** `/world config <sous-commande>`
**Description :** Gere les parametres specifiques au monde.

| Sous-commande | Description |
|---------------|-------------|
| `pausetime` | Basculer la progression du temps |
| `seed` | Afficher la graine du monde |
| `setpvp <active>` | Activer/desactiver le PvP |
| `setspawn` | Definir le point d'apparition du monde |

**Source :** `com/hypixel/hytale/server/core/universe/world/commands/worldconfig/WorldConfigCommand.java`

### Module de Controle d'Acces

Le `AccessControlModule` gere a la fois les bannissements et la liste blanche via un systeme de fournisseurs.

**Registre des Fournisseurs :**
1. `HytaleWhitelistProvider` - Gere les entrees de liste blanche
2. `HytaleBanProvider` - Gere les entrees de bannissement

**Flux de Verification de Connexion :**

```
PlayerSetupConnectEvent
    |
    v
AccessControlModule.getDisconnectReason(uuid)
    |
    +---> WhitelistProvider.getDisconnectReason(uuid)
    |         |
    |         +---> Si liste blanche activee et joueur non en liste :
    |                   Retourner "You are not whitelisted!"
    |
    +---> BanProvider.getDisconnectReason(uuid)
              |
              +---> Si joueur banni et bannissement en vigueur :
                        Retourner message de bannissement
    |
    v
Si raison retournee : Annuler connexion, envoyer paquet Disconnect
```

**Source :** `com/hypixel/hytale/server/core/modules/accesscontrol/AccessControlModule.java`

### Paquets Reseau Associes

| Paquet | ID | Utilisation en Administration |
|--------|-----|-------------------------------|
| Disconnect | 1 | Applique kick/ban en terminant la connexion |
| ServerMessage | 210 | Diffuse les messages admin aux joueurs |
| UpdateServerAccess | 251 | Notifie les changements de niveau d'acces |
| SetServerAccess | 252 | Demande les changements de niveau d'acces |
| UpdateServerPlayerList | 226 | Met a jour la liste des joueurs apres kick/ban |

### RCON (Console Distante)

Dans la version analysee, Hytale n'implemente pas de protocole RCON traditionnel. L'administration du serveur s'effectue via :

1. **Console Locale** - Acces terminal direct au processus serveur
2. **Commandes en Jeu** - Commandes chat avec les permissions appropriees
3. **API Plugin** - Acces programmatique pour les plugins serveur

**Note :** Les versions futures pourraient implementer RCON ou des protocoles d'administration distante similaires.

---

## Reference des Fichiers Sources d'Administration

| Composant | Fichier Source |
|-----------|----------------|
| Module Console | `com/hypixel/hytale/server/core/console/ConsoleModule.java` |
| Expediteur Console | `com/hypixel/hytale/server/core/console/ConsoleSender.java` |
| Controle d'Acces | `com/hypixel/hytale/server/core/modules/accesscontrol/AccessControlModule.java` |
| Fournisseur de Bannissement | `com/hypixel/hytale/server/core/modules/accesscontrol/provider/HytaleBanProvider.java` |
| Fournisseur de Liste Blanche | `com/hypixel/hytale/server/core/modules/accesscontrol/provider/HytaleWhitelistProvider.java` |
| Commande Ban | `com/hypixel/hytale/server/core/modules/accesscontrol/commands/BanCommand.java` |
| Commande Unban | `com/hypixel/hytale/server/core/modules/accesscontrol/commands/UnbanCommand.java` |
| Commande Kick | `com/hypixel/hytale/server/core/command/commands/server/KickCommand.java` |
| Commandes Whitelist | `com/hypixel/hytale/server/core/modules/accesscontrol/commands/WhitelistCommand.java` |
| Module Permissions | `com/hypixel/hytale/server/core/permissions/PermissionsModule.java` |
| Constantes Permission | `com/hypixel/hytale/server/core/permissions/HytalePermissions.java` |
| Commandes OP | `com/hypixel/hytale/server/core/permissions/commands/op/OpCommand.java` |
| Commandes Permission | `com/hypixel/hytale/server/core/permissions/commands/PermCommand.java` |
| Commande Say | `com/hypixel/hytale/server/core/console/command/SayCommand.java` |
| Config Monde | `com/hypixel/hytale/server/core/universe/world/commands/worldconfig/WorldConfigCommand.java` |

---

## Paquets de Monde Supplementaires

Cette section documente les paquets lies au monde pour la gestion du terrain, des biomes et de l'environnement.

### SetChunkHeightmap (ID 132)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les donnees de heightmap pour une colonne de chunk. Utilise pour l'optimisation du rendu, le culling d'occlusion et le calcul des ombres.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = heightmap present |
| 1 | x | int32 LE | 4 | Coordonnee X de la colonne de chunk |
| 5 | z | int32 LE | 4 | Coordonnee Z de la colonne de chunk |
| 9 | heightmap | VarInt + byte[] | Variable | Donnees de heightmap (max 4 096 000 octets) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 4 096 014 octets

---

### SetChunkTintmap (ID 133)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les donnees de tintmap pour la teinte des couleurs basee sur le biome de l'herbe, des feuilles et de l'eau dans une colonne de chunk.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = tintmap present |
| 1 | x | int32 LE | 4 | Coordonnee X de la colonne de chunk |
| 5 | z | int32 LE | 4 | Coordonnee Z de la colonne de chunk |
| 9 | tintmap | VarInt + byte[] | Variable | Donnees de couleur de teinte (max 4 096 000 octets) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 4 096 014 octets

---

### SetChunkEnvironments (ID 134)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les donnees de zone d'environnement pour une colonne de chunk. Definit quel environnement (biome/zone) s'applique a chaque zone, affectant les sons ambiants, la musique et les transitions meteorologiques.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = environments present |
| 1 | x | int32 LE | 4 | Coordonnee X de la colonne de chunk |
| 5 | z | int32 LE | 4 | Coordonnee Z de la colonne de chunk |
| 9 | environments | VarInt + byte[] | Variable | Indices de zone d'environnement (max 4 096 000 octets) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 4 096 014 octets

---

### ServerSetFluid (ID 142)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour un seul bloc de fluide a une position specifique. Utilise pour les mises a jour d'ecoulement d'eau/lave, les interactions de seau et la physique des fluides.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | x | int32 LE | 4 | Coordonnee X du bloc |
| 4 | y | int32 LE | 4 | Coordonnee Y du bloc |
| 8 | z | int32 LE | 4 | Coordonnee Z du bloc |
| 12 | fluidId | int32 LE | 4 | ID du type de fluide (0 = aucun, 1 = eau, 2 = lave, etc.) |
| 16 | fluidLevel | octet | 1 | Niveau de fluide (0-15, 0 = vide, 15 = source) |

**Taille fixe :** 17 octets

---

### ServerSetFluids (ID 143)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Mise a jour groupee pour plusieurs blocs de fluide dans un chunk. Plus efficace que plusieurs paquets ServerSetFluid.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | x | int32 LE | 4 | Coordonnee X du chunk |
| 4 | y | int32 LE | 4 | Coordonnee Y du chunk |
| 8 | z | int32 LE | 4 | Coordonnee Z du chunk |
| 12 | cmds | VarInt + SetFluidCmd[] | Variable | Tableau de commandes de mise a jour de fluide |

**Structure SetFluidCmd (7 octets chacune) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| index | int16 LE | 2 | Index du bloc dans le chunk (0-4095) |
| fluidId | int32 LE | 4 | ID du type de fluide |
| fluidLevel | octet | 1 | Niveau de fluide (0-15) |

**Taille fixe :** 12 octets (minimum)
**Taille maximale :** 28 672 017 octets

---

### UpdateTimeSettings (ID 145)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour la configuration temporelle du monde, y compris les durees du cycle jour/nuit et les phases lunaires.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | daytimeDurationSeconds | int32 LE | 4 | Duree du jour en secondes |
| 4 | nighttimeDurationSeconds | int32 LE | 4 | Duree de la nuit en secondes |
| 8 | totalMoonPhases | octet | 1 | Nombre de phases lunaires dans le cycle |
| 9 | timePaused | octet | 1 | Booleen : progression du temps en pause |

**Taille fixe :** 10 octets

---

### UpdateEditorTimeOverride (ID 147)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Force un temps specifique en mode editeur, contournant la progression normale du temps. Utilise pour tester l'eclairage et le contenu sensible au temps.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = gameTime present |
| 1 | gameTime | InstantData | 12 | Temps de jeu cible (optionnel) |
| 13 | paused | octet | 1 | Booleen : progression du temps en pause |

**Taille fixe :** 14 octets

---

### ClearEditorTimeOverride (ID 148)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Efface tout override de temps de l'editeur, reprenant la progression normale du temps.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Paquet vide |

**Taille fixe :** 0 octet

---

### ServerSetPaused (ID 159)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Etat de pause autoritaire du serveur. Contrairement au SetPaused bidirectionnel (ID 158), ceci est une notification serveur uniquement des changements d'etat de pause.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | paused | octet | 1 | Booleen : etat du jeu en pause |

**Taille fixe :** 1 octet

---

### UpdateSunSettings (ID 360)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour la position et l'angle du soleil pour des scenarios d'eclairage personnalises, cinematiques ou eclairage specifique a une zone.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | heightPercentage | float LE | 4 | Hauteur du soleil (0.0 = horizon, 1.0 = zenith) |
| 4 | angleRadians | float LE | 4 | Angle de rotation du soleil en radians |

**Taille fixe :** 8 octets

---

## Paquets Joueur Supplementaires

Cette section documente les paquets lies au joueur pour les statistiques, capacites et gestion d'etat.

### SetClientId (ID 100)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Attribue un identifiant client unique au joueur. Envoye pendant la configuration de connexion.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | clientId | int32 LE | 4 | Identifiant unique de session client |

**Taille fixe :** 4 octets

---

### SetMovementStates (ID 102)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Definit les indicateurs d'etat de mouvement du joueur, utilise pour la correction de mouvement autoritaire du serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = movementStates present |
| 1 | movementStates | SavedMovementStates | 1 | Indicateurs de mouvement sauvegardes (optionnel) |

**Taille fixe :** 2 octets

---

### SetBlockPlacementOverride (ID 103)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Active ou desactive le mode de surcharge de placement de bloc, permettant le placement dans des zones normalement restreintes (fonctionnalite mode editeur/creatif).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | enabled | octet | 1 | Booleen : surcharge activee |

**Taille fixe :** 1 octet

---

### UpdateMovementSettings (ID 110)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour les parametres de mouvement du joueur, y compris la vitesse, la hauteur de saut et les parametres physiques.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = movementSettings present |
| 1 | movementSettings | MovementSettings | 251 | Configuration complete du mouvement (optionnel) |

**Taille fixe :** 252 octets

---

### DamageInfo (ID 112)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Notifie le client des degats recus, y compris la position source et la cause pour les indicateurs directionnels et ecrans de mort.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = position presente, bit 1 = cause presente |
| 1 | damageSourcePosition | Vector3d | 24 | Position mondiale de la source de degats (optionnel) |
| 25 | damageAmount | float LE | 4 | Quantite de degats infliges |
| 29 | damageCause | DamageCause | Variable | Details de la cause des degats (optionnel) |

**Taille fixe :** 29 octets (minimum)
**Taille maximale :** 32 768 048 octets

---

### ReticleEvent (ID 113)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Declenche un evenement d'animation de reticule/viseur comme la confirmation de coup ou le retour d'action invalide.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | eventIndex | int32 LE | 4 | ID d'evenement de reticule du registre d'assets |

**Taille fixe :** 4 octets

---

### DisplayDebug (ID 114)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Affiche une forme de visualisation de debogage dans le monde. Utilise pour le developpement, le debogage de collision et le pathfinding.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence pour les champs optionnels |
| 1 | shape | octet | 1 | Enum DebugShape : Sphere, Box, Line, etc. |
| 2 | color | Vector3f | 12 | Couleur RVB (optionnel) |
| 14 | time | float LE | 4 | Duree d'affichage en secondes |
| 18 | fade | octet | 1 | Booleen : animation de fondu |
| 19 | matrixOffset | int32 LE | 4 | Offset vers la matrice de transformation |
| 23 | frustumProjectionOffset | int32 LE | 4 | Offset vers la projection frustum |
| 27+ | matrix | VarInt + float[] | Variable | Matrice de transformation 4x4 (optionnel) |
| - | frustumProjection | VarInt + float[] | Variable | Matrice de projection frustum (optionnel) |

**Taille fixe :** 27 octets (minimum)
**Taille maximale :** 32 768 037 octets

---

### ClearDebugShapes (ID 115)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Efface toutes les formes de visualisation de debogage du client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Paquet vide |

**Taille fixe :** 0 octet

---

### UpdateMemoriesFeatureStatus (ID 118)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour le statut de deblocage de la fonctionnalite memoires/journal pour le joueur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | isFeatureUnlocked | octet | 1 | Booleen : fonctionnalite memoires debloquee |

**Taille fixe :** 1 octet

---

## Paquets de Configuration Supplementaires

Cette section documente les paquets utilises pendant la phase de configuration et d'initialisation de la connexion.

### WorldLoadProgress (ID 21)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Rapporte la progression du chargement du monde au client pour l'affichage sur l'ecran de chargement.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = status present |
| 1 | percentComplete | int32 LE | 4 | Progression globale du chargement (0-100) |
| 5 | percentCompleteSubitem | int32 LE | 4 | Progression de la tache actuelle (0-100) |
| 9 | status | VarString | Variable | Message de statut a afficher (optionnel) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 16 384 014 octets

---

### WorldLoadFinished (ID 22)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Signale que le chargement du monde est termine et que le client peut fermer l'ecran de chargement.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Paquet vide |

**Taille fixe :** 0 octet

---

### RemoveAssets (ID 27)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Ordonne au client de supprimer des assets specifiques de la memoire. Utilise pour la gestion de contenu dynamique.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = tableau asset present |
| 1 | asset | VarInt + Asset[] | Variable | Tableau d'assets a supprimer (optionnel) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### RequestCommonAssetsRebuild (ID 28)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Demande au serveur de reconstruire et renvoyer les donnees d'assets communs. Utilise quand le client detecte une corruption d'asset ou une incompatibilite de version.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (aucun champ) | - | 0 | Paquet vide |

**Taille fixe :** 0 octet

---

### SetUpdateRate (ID 29)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Definit le taux de mise a jour attendu du client pour la synchronisation des entites et du monde.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | updatesPerSecond | int32 LE | 4 | Mises a jour cibles par seconde (tick rate) |

**Taille fixe :** 4 octets

---

### SetTimeDilation (ID 30)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Definit le facteur de dilatation temporelle pour les effets de ralenti ou d'acceleration.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | timeDilation | float LE | 4 | Multiplicateur d'echelle de temps (1.0 = normal, 0.5 = moitie de vitesse, 2.0 = double vitesse) |

**Taille fixe :** 4 octets

---

### UpdateFeatures (ID 31)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour le statut active/desactive des fonctionnalites de gameplay cote client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = carte features presente |
| 1 | features | VarInt + Map | Variable | Dictionnaire d'indicateurs de fonctionnalite (optionnel) |

**Valeurs ClientFeature :**
- `0` - SplitVelocity : Mecaniques de velocite divisee
- `1` - Mantling : Capacite d'agripper les rebords
- `2` - SprintForce : Mecaniques de force de sprint
- `3` - CrouchSlide : Capacite de glissade accroupie
- `4` - SafetyRoll : Roulade de degats de chute
- `5` - DisplayHealthBars : Afficher les barres de vie des entites
- `6` - DisplayCombatText : Afficher les nombres de degats

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 8 192 006 octets

---

### PlayerOptions (ID 33)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Envoie les options de personnalisation du joueur, y compris les donnees de skin, au serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = skin present |
| 1 | skin | PlayerSkin | Variable | Donnees de skin du joueur (optionnel) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 327 680 184 octets

---

## Paquets UI/Interface Supplementaires

Cette section documente les paquets UI et interface supplementaires pour la gestion du HUD, la navigation des pages, les listes de joueurs et les notifications systeme.

### SetPage (ID 216)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Definit la page/ecran UI actif sur le client. Utilise pour ouvrir l'inventaire, la carte, les interfaces de craft et autres pages UI plein ecran.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | page | octet | 1 | Valeur enum Page |
| 1 | canCloseThroughInteraction | octet | 1 | Booleen : le joueur peut fermer via ESC ou en cliquant ailleurs |

**Valeurs Page :**
- `0` - None : Fermer toute page ouverte
- `1` - Bench : Interface etabli/craft
- `2` - Inventory : Ecran d'inventaire du joueur
- `3` - ToolsSettings : Menu de configuration des outils
- `4` - Map : Vue de la carte du monde
- `5` - MachinimaEditor : Interface d'editeur cinematique
- `6` - ContentCreation : Outils de creation de contenu
- `7` - Custom : Page personnalisee definie par le serveur

**Taille fixe :** 2 octets

---

### ServerInfo (ID 223)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Envoie les informations du serveur au client, incluant le nom du serveur, le message du jour et la capacite de joueurs. Utilise pour le navigateur de serveurs et l'interface de connexion.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = serverName present, bit 1 = motd present |
| 1 | maxPlayers | int32 LE | 4 | Capacite maximale de joueurs |
| 5 | serverNameOffset | int32 LE | 4 | Offset vers la chaine nom du serveur |
| 9 | motdOffset | int32 LE | 4 | Offset vers la chaine MOTD |
| 13+ | serverName | VarString | Variable | Nom d'affichage du serveur (optionnel) |
| - | motd | VarString | Variable | Message du jour (optionnel) |

**Taille fixe :** 13 octets (minimum)
**Taille maximale :** 32 768 023 octets

---

### AddToServerPlayerList (ID 224)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Ajoute un ou plusieurs joueurs a la liste de joueurs affichee. Utilise quand des joueurs rejoignent le serveur ou deviennent visibles.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = tableau players present |
| 1 | players | VarInt + ServerPlayerListPlayer[] | Variable | Tableau des entrees de joueurs a ajouter |

**Structure ServerPlayerListPlayer (37+ octets) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| nullBits | octet | 1 | Bit 0 = username present, bit 1 = worldUuid present |
| uuid | UUID | 16 | Identifiant unique du joueur |
| worldUuid | UUID | 16 | Monde dans lequel se trouve le joueur (optionnel) |
| ping | int32 LE | 4 | Latence du joueur en millisecondes |
| username | VarString | Variable | Nom d'affichage du joueur (optionnel) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### RemoveFromServerPlayerList (ID 225)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Supprime un ou plusieurs joueurs de la liste de joueurs affichee. Utilise quand des joueurs se deconnectent ou deviennent caches.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = tableau players present |
| 1 | players | VarInt + UUID[] | Variable | Tableau des UUID de joueurs a supprimer |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 65 536 006 octets

---

### UpdateServerPlayerListPing (ID 227)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour les valeurs de ping/latence des joueurs dans la liste. Envoye periodiquement pour maintenir les affichages de ping a jour.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = carte players presente |
| 1 | players | `VarInt + Map<UUID, int32>` | Variable | Dictionnaire UUID joueur vers valeur ping |

**Entree Map (20 octets chacune) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| cle | UUID | 16 | UUID du joueur |
| valeur | int32 LE | 4 | Ping en millisecondes |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 81 920 006 octets

---

### UpdateVisibleHudComponents (ID 230)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Controle quels composants HUD sont visibles pour le joueur. Utilise pour les modes de jeu personnalises, les cinematiques et la personnalisation de l'interface.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = visibleComponents present |
| 1 | visibleComponents | VarInt + HudComponent[] | Variable | Tableau des composants HUD visibles |

**Valeurs HudComponent :**
- `0` - Hotbar : Barre d'objets en bas de l'ecran
- `1` - StatusIcons : Icones d'effets de statut
- `2` - Reticle : Reticule/viseur
- `3` - Chat : Affichage des messages de chat
- `4` - Requests : Notifications de requetes en attente
- `5` - Notifications : Notifications popup
- `6` - KillFeed : Fil des eliminations en combat
- `7` - InputBindings : Indications de controles
- `8` - PlayerList : Liste des joueurs (Tab)
- `9` - EventTitle : Titre d'evenement superpose
- `10` - Compass : Boussole de navigation
- `11` - ObjectivePanel : Suivi de quetes/objectifs
- `12` - PortalPanel : Affichage du statut des portails
- `13` - BuilderToolsLegend : Controles du mode constructeur
- `14` - Speedometer : Indicateur de vitesse
- `15` - UtilitySlotSelector : Selecteur d'objets utilitaires
- `16` - BlockVariantSelector : Selecteur de variantes de blocs
- `17` - BuilderToolsMaterialSlotSelector : Selecteur d'emplacements de materiaux
- `18` - Stamina : Barre d'endurance
- `19` - AmmoIndicator : Compteur de munitions
- `20` - Health : Barre de sante
- `21` - Mana : Barre de mana
- `22` - Oxygen : Barre d'oxygene/respiration
- `23` - Sleep : Indicateur de progression du sommeil

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 4 096 006 octets

---

### ResetUserInterfaceState (ID 231)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Reinitialise l'etat de l'interface utilisateur du client aux valeurs par defaut. Utilise lors de la connexion a un monde, du changement de mode de jeu ou de la recuperation d'erreurs d'interface.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| (pas de champs) | - | 0 | Paquet vide |

**Taille fixe :** 0 octets

---

### WorldSavingStatus (ID 233)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Notifie le client que le monde est en cours de sauvegarde. Utilise pour afficher un indicateur de sauvegarde et potentiellement empecher la deconnexion pendant les operations de sauvegarde.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | isWorldSaving | octet | 1 | Booleen : sauvegarde du monde en cours |

**Taille fixe :** 1 octet

---

### OpenChatWithCommand (ID 234)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Ouvre l'entree de chat avec une commande pre-remplie. Utilise pour les suggestions de commandes, les interactions PNJ qui declenchent des commandes et les boutons d'action rapide.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = command present |
| 1 | command | VarString | Variable | Texte de commande pre-rempli (optionnel) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

---

## Types d'Actions de Fenetre Etendus

Cette section documente les types d'actions de fenetre supplementaires utilises avec le paquet SendWindowAction (ID 203).

### SelectSlotAction

**Description :** Selectionne un emplacement specifique dans une interface de fenetre. Utilise pour la selection d'emplacements de table de craft, la selection de recettes et la navigation d'interface.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| slot | int32 LE | 4 | Index de l'emplacement a selectionner |

**Taille fixe :** 4 octets

---

### SortItemsAction

**Description :** Trie les objets dans une fenetre d'inventaire selon les criteres specifies.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| sortType | octet | 1 | Valeur enum SortType |

**Valeurs SortType :**
- `0` - Name : Trier alphabetiquement par nom d'objet
- `1` - Type : Trier par categorie/type d'objet
- `2` - Quality : Trier par qualite/rarete d'objet

**Taille fixe :** 1 octet

---

### SetActiveAction

**Description :** Definit l'etat actif/active d'un element de fenetre. Utilise pour les interrupteurs a bascule et les controles d'activation.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| state | octet | 1 | Booleen : etat actif de l'element |

**Taille fixe :** 1 octet

---

### UpdateCategoryAction

**Description :** Met a jour la categorie selectionnee dans une fenetre categorisee comme l'inventaire creatif ou le navigateur de recettes.

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| categoryOffset | int32 LE | 4 | Offset vers la chaine categorie |
| itemCategoryOffset | int32 LE | 4 | Offset vers la chaine categorie d'objet |
| category | VarString | Variable | Identifiant de categorie principale |
| itemCategory | VarString | Variable | Identifiant de sous-categorie |

**Taille fixe :** 8 octets (minimum)
**Taille maximale :** 32 768 018 octets

---

## Documentation Etendue CustomPageEvent

Le paquet CustomPageEvent (ID 219) supporte la communication bidirectionnelle pour les pages UI definies par le serveur.

### Valeurs CustomPageEventType

| Valeur | Nom | Description |
|--------|-----|-------------|
| `0` | Acknowledge | Confirme la reception du paquet CustomPage |
| `1` | Data | Envoie les donnees d'entree utilisateur au serveur |
| `2` | Dismiss | L'utilisateur a ferme la page personnalisee |

### Flux d'Utilisation

```
Serveur                                 Client
   |                                       |
   |  ------ CustomPage (ID 218) --------> |  Ouvrir page UI personnalisee
   |                                       |
   |  <---- CustomPageEvent (Ack) -------- |  Confirmation chargement page
   |                                       |
   |        (L'utilisateur interagit)      |
   |                                       |
   |  <---- CustomPageEvent (Data) ------- |  Envoyer donnees formulaire/bouton
   |                                       |
   |  ------ CustomPage (update) --------> |  Mettre a jour le contenu de la page
   |                                       |
   |  <---- CustomPageEvent (Dismiss) ---- |  L'utilisateur a ferme la page
   |                                       |
```

---

## Paquets de Synchronisation d'Assets

Les paquets de synchronisation d'assets transferent les definitions d'assets du jeu du serveur vers le client lors de la configuration de connexion et des mises a jour en temps reel. Ces paquets permettent aux serveurs de personnaliser le contenu du jeu dynamiquement, prenant en charge les serveurs moddes et les packs de contenu.

### Structure Commune

Tous les paquets de mise a jour d'assets partagent un modele commun :

| Champ | Type | Description |
|-------|------|-------------|
| `type` | UpdateType | Init (0), Update (1), ou Delta (2) |
| `maxId` | int32 | ID maximum dans le registre (pour les assets indexes) |
| `[assets]` | Map/Array | Definitions d'assets (optionnel) |
| `[removedAssets]` | String[] | IDs des assets a supprimer (optionnel) |

**Valeurs UpdateType :**
- `0` - Init : Initialisation complete du registre lors de la configuration
- `1` - Update : Remplacer les entrees existantes
- `2` - Delta : Modifications incrementales uniquement

---

### UpdateBlockTypes (ID 40)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de types de blocs incluant les proprietes visuelles, les caracteristiques physiques et les references de modeles. Utilise lors de la configuration et lorsque les definitions de blocs changent.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = blockTypes present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum de type de bloc |
| 6 | updateBlockTextures | octet | 1 | Booleen : recharger les textures de blocs |
| 7 | updateModelTextures | octet | 1 | Booleen : recharger les textures de modeles |
| 8 | updateModels | octet | 1 | Booleen : recharger les modeles 3D |
| 9 | updateMapGeometry | octet | 1 | Booleen : reconstruire la geometrie de la carte |
| 10+ | blockTypes | `Map<int32, BlockType>` | Variable | Definitions de types de blocs (optionnel) |

**Taille fixe :** 10 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateBlockHitboxes (ID 41)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de hitbox/collision des blocs. Mappe les IDs de types de blocs vers des tableaux de hitboxes qui definissent la geometrie de collision du bloc. Utilise pour la collision des joueurs, le raycasting et la physique des entites.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = blockBaseHitboxes present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum de type de bloc dans le registre |
| 6+ | blockBaseHitboxes | `Map<int32, Hitbox[]>` | Variable | Dictionnaire d'ID de bloc vers tableau de hitboxes (optionnel) |

**Structure Hitbox (24 octets chacune) :**

| Champ | Type | Taille | Description |
|-------|------|--------|-------------|
| minX | float LE | 4 | Coordonnee X minimum (0.0-1.0) |
| minY | float LE | 4 | Coordonnee Y minimum (0.0-1.0) |
| minZ | float LE | 4 | Coordonnee Z minimum (0.0-1.0) |
| maxX | float LE | 4 | Coordonnee X maximum (0.0-1.0) |
| maxY | float LE | 4 | Coordonnee Y maximum (0.0-1.0) |
| maxZ | float LE | 4 | Coordonnee Z maximum (0.0-1.0) |

**Notes :**
- Les coordonnees de hitbox sont relatives a la position du bloc (plage 0.0-1.0)
- Un bloc complet a une seule hitbox : (0,0,0) a (1,1,1)
- Les escaliers, dalles et formes personnalisees ont plusieurs hitboxes
- Maximum 64 hitboxes par type de bloc

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateBlockParticleSets (ID 44)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les configurations d'effets de particules de blocs. Definit les particules emises lorsque les blocs sont casses, foules ou interagis. Chaque type de bloc peut referencer un ensemble de particules par nom.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = blockParticleSets present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2+ | blockParticleSets | `Map<String, BlockParticleSet>` | Variable | Dictionnaire d'ID d'ensemble de particules vers configuration (optionnel) |

**Champs BlockParticleSet :**

| Champ | Type | Description |
|-------|------|-------------|
| breakParticles | ParticleConfig | Particules emises lors de la destruction du bloc |
| stepParticles | ParticleConfig | Particules emises lorsqu'une entite marche sur le bloc |
| landParticles | ParticleConfig | Particules emises lorsqu'une entite atterrit sur le bloc |
| slideParticles | ParticleConfig | Particules emises lorsqu'une entite glisse sur le bloc |

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateBlockBreakingDecals (ID 45)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les configurations de textures de fissures de blocs. Definit la progression visuelle des fissures qui apparaissent sur les blocs pendant le minage.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = blockBreakingDecals present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2+ | blockBreakingDecals | `Map<String, BlockBreakingDecal>` | Variable | Dictionnaire d'ID d'ensemble de decals vers configuration (optionnel) |

**Champs BlockBreakingDecal :**

| Champ | Type | Description |
|-------|------|-------------|
| stages | TextureRef[] | Tableau de textures d'etapes de fissure (typiquement 10 etapes de 0-100%) |
| tintColor | Color | Teinte de couleur appliquee a la texture de fissure |
| emissive | boolean | Si les fissures emettent de la lumiere (effet de lueur) |

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateBlockSets (ID 46)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions d'ensembles de blocs. Les ensembles de blocs regroupent des blocs apparentes pour les categories du mode creatif, le changement de barre d'acces rapide (paquet SwitchHotbarBlockSet) et les mecaniques de jeu.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = blockSets present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2+ | blockSets | `Map<String, BlockSet>` | Variable | Dictionnaire d'ID d'ensemble de blocs vers definition (optionnel) |

**Champs BlockSet :**

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant de l'ensemble de blocs (ex: "building_blocks", "natural") |
| displayName | String | Nom d'affichage localise pour l'interface |
| blocks | String[] | Tableau d'IDs de types de blocs dans cet ensemble |
| icon | ItemRef | Reference d'icone pour l'affichage dans l'interface |

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateFluidFX (ID 63)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les configurations d'effets visuels de fluides. Definit comment les fluides comme l'eau et la lave sont rendus, incluant les effets de surface, les effets sous-marins et les parametres de brouillard.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = fluidFX present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum de type de fluide |
| 6+ | fluidFX | `Map<int32, FluidFX>` | Variable | Dictionnaire d'ID de fluide vers configuration FX (optionnel) |

**Champs FluidFX :**

| Champ | Type | Description |
|-------|------|-------------|
| surfaceColor | Color | Couleur de la surface du fluide |
| underwaterColor | Color | Teinte de couleur lorsque la camera est submergee |
| fogDensity | float | Densite du brouillard sous-marin (plus eleve = moins de visibilite) |
| fogColor | Color | Couleur du brouillard sous-marin |
| reflectivity | float | Force de reflexion de la surface (0.0-1.0) |
| transparency | float | Transparence du fluide (0.0 = opaque, 1.0 = invisible) |
| flowSpeed | float | Vitesse d'animation du flux visuel |
| particleEmitter | ParticleConfig | Effets de particules de surface (bulles, vapeur, etc.) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateItems (ID 54)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions d'objets incluant les proprietes, modeles et icones. Supporte l'ajout et la suppression d'objets.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = items present, bit 1 = removedItems present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | updateModels | octet | 1 | Booleen : recharger les modeles d'objets |
| 3 | updateIcons | octet | 1 | Booleen : recharger les icones d'objets |
| 4 | itemsOffset | int32 LE | 4 | Offset vers le dictionnaire d'objets |
| 8 | removedItemsOffset | int32 LE | 4 | Offset vers le tableau d'objets supprimes |
| 12+ | items | `Map<String, ItemBase>` | Variable | Definitions d'objets par ID (optionnel) |
| - | removedItems | String[] | Variable | IDs d'objets a supprimer (optionnel) |

**Taille fixe :** 12 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateRecipes (ID 60)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de recettes de craft. Supporte l'ajout de nouvelles recettes et la suppression des existantes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = recipes present, bit 1 = removedRecipes present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | recipesOffset | int32 LE | 4 | Offset vers le dictionnaire de recettes |
| 6 | removedRecipesOffset | int32 LE | 4 | Offset vers le tableau de recettes supprimees |
| 10+ | recipes | `Map<String, CraftingRecipe>` | Variable | Definitions de recettes (optionnel) |
| - | removedRecipes | String[] | Variable | IDs de recettes a supprimer (optionnel) |

**Taille fixe :** 10 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateEnvironments (ID 61)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions d'environnements de monde (biomes) incluant les parametres ambiants, configurations meteorologiques et parametres de terrain.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = environments present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum d'environnement |
| 6 | rebuildMapGeometry | octet | 1 | Booleen : reconstruire la geometrie de la carte |
| 7+ | environments | `Map<int32, WorldEnvironment>` | Variable | Definitions d'environnements (optionnel) |

**Taille fixe :** 7 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateTranslations (ID 64)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les chaines de localisation pour le contenu defini par le serveur. Permet aux serveurs de fournir du texte personnalise pour les objets, blocs et elements d'interface.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = translations present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2+ | translations | `Map<String, String>` | Variable | Paires cle-valeur de traduction (optionnel) |

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateSoundEvents (ID 65)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions d'evenements sonores pour les declencheurs de lecture audio.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = soundEvents present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum d'evenement sonore |
| 6+ | soundEvents | `Map<int32, SoundEvent>` | Variable | Definitions d'evenements sonores (optionnel) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateInteractions (ID 66)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions d'interactions pour le combat, l'utilisation d'objets et les interactions environnementales.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = interactions present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum d'interaction |
| 6+ | interactions | `Map<int32, Interaction>` | Variable | Definitions d'interactions (optionnel) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateWeathers (ID 47)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de types meteorologiques incluant les effets visuels, systemes de particules et impact environnemental.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = weathers present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum de meteo |
| 6+ | weathers | `Map<int32, Weather>` | Variable | Definitions de meteo (optionnel) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateParticleSystems (ID 49)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de systemes de particules pour les effets visuels.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = particleSystems present, bit 1 = removedParticleSystems present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | particleSystemsOffset | int32 LE | 4 | Offset vers le dictionnaire de systemes de particules |
| 6 | removedParticleSystemsOffset | int32 LE | 4 | Offset vers le tableau supprime |
| 10+ | particleSystems | `Map<String, ParticleSystem>` | Variable | Definitions de systemes de particules (optionnel) |
| - | removedParticleSystems | String[] | Variable | IDs a supprimer (optionnel) |

**Taille fixe :** 10 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateBlockGroups (ID 78)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de groupes de blocs pour categoriser les blocs (ex: "pierre", "bois", "minerai").

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = groups present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2+ | groups | `Map<String, BlockGroup>` | Variable | Definitions de groupes de blocs (optionnel) |

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateSoundSets (ID 79)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions d'ensembles de sons qui regroupent les evenements sonores lies pour les materiaux et actions.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = soundSets present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum d'ensemble de sons |
| 6+ | soundSets | `Map<int32, SoundSet>` | Variable | Definitions d'ensembles de sons (optionnel) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateFluids (ID 83)

**Direction :** Serveur -> Client
**Compresse :** Oui (Zstd)
**Description :** Envoie les definitions de types de fluides incluant l'eau, la lave et les fluides personnalises.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = fluids present |
| 1 | type | octet | 1 | Valeur enum UpdateType |
| 2 | maxId | int32 LE | 4 | ID maximum de fluide |
| 6+ | fluids | `Map<int32, Fluid>` | Variable | Definitions de fluides (optionnel) |

**Taille fixe :** 6 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### Tableau de Reference des Paquets d'Assets

Le tableau suivant resume tous les paquets de synchronisation d'assets :

| Paquet | ID | Type de Cle | Type de Valeur | Supporte Suppression |
|--------|-----|-------------|----------------|---------------------|
| UpdateBlockTypes | 40 | int32 | BlockType | Non |
| UpdateWeathers | 47 | int32 | Weather | Non |
| UpdateParticleSystems | 49 | String | ParticleSystem | Oui |
| UpdateParticleSpawners | 50 | String | ParticleSpawner | Oui |
| UpdateItems | 54 | String | ItemBase | Oui |
| UpdateItemCategories | 55 | String | ItemCategory | Oui |
| UpdateItemQualities | 56 | String | ItemQuality | Non |
| UpdateRecipes | 60 | String | CraftingRecipe | Oui |
| UpdateEnvironments | 61 | int32 | WorldEnvironment | Non |
| UpdateTranslations | 64 | String | String | Non |
| UpdateSoundEvents | 65 | int32 | SoundEvent | Non |
| UpdateInteractions | 66 | int32 | Interaction | Non |
| UpdateRootInteractions | 67 | int32 | RootInteraction | Non |
| UpdateUnarmedInteractions | 68 | int32 | UnarmedInteraction | Non |
| UpdateBlockGroups | 78 | String | BlockGroup | Non |
| UpdateSoundSets | 79 | int32 | SoundSet | Non |
| UpdateBlockSoundSets | 80 | int32 | BlockSoundSet | Non |
| UpdateItemSoundSets | 81 | int32 | ItemSoundSet | Non |
| UpdateBlockHitboxes | 41 | int32 | Hitbox[] | Non |
| UpdateBlockParticleSets | 44 | String | BlockParticleSet | Non |
| UpdateBlockBreakingDecals | 45 | String | BlockBreakingDecal | Non |
| UpdateBlockSets | 46 | String | BlockSet | Non |
| UpdateFluidFX | 63 | int32 | FluidFX | Non |
| UpdateFluids | 83 | int32 | Fluid | Non |
| UpdateProjectileConfigs | 85 | String | ProjectileConfig | Oui |
| UpdateEntityEffects | 90 | String | EntityEffect | Oui |
| UpdateEntityStatTypes | 91 | int32 | EntityStatType | Non |
| UpdateItemPlayerAnimations | 92 | String | ItemPlayerAnimation | Oui |
| UpdateItemReticles | 93 | int32 | ItemReticle | Non |
| UpdateModelvfxs | 94 | String | Modelvfx | Oui |
| UpdateCameraShake | 95 | int32 | CameraShake | Non |
| UpdateViewBobbing | 96 | int32 | ViewBobbing | Non |
| UpdateTrails | 97 | String | Trail | Oui |
| UpdateResourceTypes | 98 | int32 | ResourceType | Non |
| UpdateAudioCategories | 99 | int32 | AudioCategory | Non |
| UpdateReverbEffects | 350 | int32 | ReverbEffect | Non |
| UpdateEqualizerEffects | 351 | int32 | EqualizerEffect | Non |
| UpdateAmbienceFX | 352 | int32 | AmbienceFX | Non |
| UpdateEntityUIComponents | 353 | String | EntityUIComponent | Oui |
| UpdateTagPatterns | 354 | int32 | TagPattern | Non |
| UpdateFieldcraftCategories | 355 | String | FieldcraftCategory | Oui |
| UpdateHitboxCollisionConfig | 356 | - | HitboxCollisionConfig | Non |
| UpdateRepulsionConfig | 357 | - | RepulsionConfig | Non |

---

### Paquets de Suivi d'Objectifs

Ces paquets gerent l'etat de suivi des quetes/objectifs.

#### TrackOrUpdateObjective (ID 358)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Ajoute ou met a jour un objectif dans le tracker d'objectifs du client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1+ | objective | ObjectiveData | Variable | Definition d'objectif |

**Taille maximale :** 1 677 721 600 octets

---

#### UpdateObjectiveTask (ID 359)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour une tache specifique au sein d'un objectif suivi.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Indicateurs de presence |
| 1+ | taskUpdate | ObjectiveTaskUpdate | Variable | Donnees de mise a jour de tache |

**Taille maximale :** 1 677 721 600 octets

---

#### UntrackObjective (ID 70)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Supprime un objectif du tracker d'objectifs du client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = objectiveId present |
| 1+ | objectiveId | VarString | Variable | ID d'objectif a supprimer |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

---

## Paquets de Connexion (Supplementaires)

### Ping (ID 2)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Paquet de ping envoye par le serveur pour mesurer la latence. Contient des informations de synchronisation et les valeurs de ping precedentes a des fins de diagnostic.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = temps present |
| 1 | id | int32 LE | 4 | Identifiant de sequence ping |
| 5 | time | InstantData | 12 | Horodatage (optionnel) |
| 17 | lastPingValueRaw | int32 LE | 4 | Ping brut precedent en ms |
| 21 | lastPingValueDirect | int32 LE | 4 | Ping direct precedent en ms |
| 25 | lastPingValueTick | int32 LE | 4 | Ping base sur tick precedent en ms |

**Taille fixe :** 29 octets

---

### Pong (ID 3)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Reponse a un paquet Ping. Contient l'horodatage original et des informations sur le type de pong et la file d'attente de paquets du client.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = temps present |
| 1 | id | int32 LE | 4 | Identifiant de sequence ping correspondant |
| 5 | time | InstantData | 12 | Horodatage (optionnel) |
| 17 | type | octet | 1 | Valeur enum PongType |
| 18 | packetQueueSize | int16 LE | 2 | Nombre de paquets dans la file client |

**Valeurs PongType :**
- `0` - Raw : Reponse directe
- `1` - Direct : Mesure sans delai de traitement
- `2` - Tick : Mesure sur le tick de jeu

**Taille fixe :** 20 octets

---

## Paquets d'Authentification (Etendus)

### Status (ID 10)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Reponse d'etat du serveur contenant les informations de base. Envoye en reponse aux requetes d'etat avant la connexion complete.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = nom, Bit 1 = motd |
| 1 | playerCount | int32 LE | 4 | Nombre de joueurs actuels |
| 5 | maxPlayers | int32 LE | 4 | Capacite maximale de joueurs |
| 9 | nameOffset | int32 LE | 4 | Offset vers la chaine nom |
| 13 | motdOffset | int32 LE | 4 | Offset vers la chaine MOTD |
| 17+ | name | VarString | Variable | Nom du serveur (max 128 chars) |
| ... | motd | VarString | Variable | Message du jour (max 512 chars) |

**Taille fixe :** 17 octets (minimum)
**Taille maximale :** 2 587 octets

---

### AuthGrant (ID 11)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur accorde l'authentification au client apres verification reussie. Contient la subvention d'autorisation et le jeton d'identite du serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = grant, Bit 1 = token |
| 1 | authorizationGrantOffset | int32 LE | 4 | Offset vers la chaine grant |
| 5 | serverIdentityTokenOffset | int32 LE | 4 | Offset vers la chaine token |
| 9+ | authorizationGrant | VarString | Variable | Subvention OAuth (max 4096 chars) |
| ... | serverIdentityToken | VarString | Variable | Jeton ID serveur (max 8192 chars) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 49 171 octets

---

### AuthToken (ID 12)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client envoie le jeton d'authentification au serveur pour verification.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = accessToken, Bit 1 = grant |
| 1 | accessTokenOffset | int32 LE | 4 | Offset vers le jeton d'acces |
| 5 | serverAuthorizationGrantOffset | int32 LE | 4 | Offset vers la subvention d'autorisation |
| 9+ | accessToken | VarString | Variable | Jeton d'acces utilisateur (max 8192 chars) |
| ... | serverAuthorizationGrant | VarString | Variable | Subvention auth serveur (max 4096 chars) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 49 171 octets

---

### ServerAuthToken (ID 13)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur envoie son jeton d'authentification pour l'authentification mutuelle. Peut inclure un defi de mot de passe pour les serveurs proteges.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = accessToken, Bit 1 = challenge |
| 1 | serverAccessTokenOffset | int32 LE | 4 | Offset vers le jeton serveur |
| 5 | passwordChallengeOffset | int32 LE | 4 | Offset vers les octets de defi |
| 9+ | serverAccessToken | VarString | Variable | Jeton d'acces serveur (max 8192 chars) |
| ... | passwordChallenge | byte[] | Variable | Octets de defi (max 64 octets) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 32 851 octets

---

### ConnectAccept (ID 14)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur accepte la demande de connexion. Peut inclure un defi de mot de passe pour les serveurs proteges.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = challenge present |
| 1+ | passwordChallenge | byte[] | Variable | Octets de defi (max 64 octets) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 70 octets

---

### PasswordResponse (ID 15)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client envoie la reponse de mot de passe hachee au defi du serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = hash present |
| 1+ | hash | byte[] | Variable | Hash du mot de passe (max 64 octets) |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 70 octets

---

### PasswordAccepted (ID 16)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur confirme que le mot de passe etait correct. Paquet vide sans charge utile.

**Taille fixe :** 0 octets

---

### PasswordRejected (ID 17)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur rejette le mot de passe et envoie un nouveau defi. Inclut le nombre de tentatives restantes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = nouveau defi present |
| 1 | attemptsRemaining | int32 LE | 4 | Tentatives de mot de passe restantes |
| 5+ | newChallenge | byte[] | Variable | Nouveaux octets de defi (max 64 octets) |

**Taille fixe :** 5 octets (minimum)
**Taille maximale :** 74 octets

---

### ClientReferral (ID 18)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Le serveur redirige le client vers un autre serveur. Utilise pour les transferts de serveur et l'equilibrage de charge.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = host, Bit 1 = data |
| 1 | hostToOffset | int32 LE | 4 | Offset vers l'adresse hote |
| 5 | dataOffset | int32 LE | 4 | Offset vers les donnees de transfert |
| 9+ | hostTo | HostAddress | Variable | Adresse du serveur cible |
| ... | data | byte[] | Variable | Donnees de transfert (max 4096 octets) |

**Taille fixe :** 9 octets (minimum)
**Taille maximale :** 5 141 octets

---

## Paquets de Carte du Monde

Ces paquets gerent le systeme de carte du monde en jeu pour la navigation et la decouverte.

### UpdateWorldMapSettings (ID 240)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Configure les parametres de la carte du monde incluant l'etat d'activation, les donnees de biome et les permissions de teleportation.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = biomeDataMap present |
| 1 | enabled | octet | 1 | Booleen : carte activee |
| 2 | allowTeleportToCoordinates | octet | 1 | Booleen : teleportation coordonnees |
| 3 | allowTeleportToMarkers | octet | 1 | Booleen : teleportation marqueurs |
| 4 | defaultScale | float LE | 4 | Niveau de zoom par defaut (defaut: 32.0) |
| 8 | minScale | float LE | 4 | Zoom minimum (defaut: 2.0) |
| 12 | maxScale | float LE | 4 | Zoom maximum (defaut: 256.0) |
| 16+ | biomeDataMap | `Map<short, BiomeData>` | Variable | Donnees visuelles de biome |

**Taille fixe :** 16 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateWorldMap (ID 241)

**Direction :** Serveur -> Client
**Compresse :** Oui
**Description :** Met a jour la carte du monde avec de nouveaux chunks, marqueurs et suppressions.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = chunks, Bit 1 = ajoutes, Bit 2 = supprimes |
| 1 | chunksOffset | int32 LE | 4 | Offset vers le tableau de chunks |
| 5 | addedMarkersOffset | int32 LE | 4 | Offset vers les marqueurs ajoutes |
| 9 | removedMarkersOffset | int32 LE | 4 | Offset vers les IDs de marqueurs supprimes |
| 13+ | chunks | MapChunk[] | Variable | Donnees de chunk de carte |
| ... | addedMarkers | MapMarker[] | Variable | Nouveaux marqueurs de carte |
| ... | removedMarkers | VarString[] | Variable | IDs de marqueurs a supprimer |

**Taille fixe :** 13 octets (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### ClearWorldMap (ID 242)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Efface toutes les donnees de la carte du monde. Utilise lors du changement de monde ou de la reinitialisation de la carte.

**Taille fixe :** 0 octets

---

### UpdateWorldMapVisible (ID 243)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client notifie le serveur quand la visibilite de l'UI de carte change.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | visible | octet | 1 | Booleen : carte visible |

**Taille fixe :** 1 octet

---

### TeleportToWorldMapMarker (ID 244)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande la teleportation vers un emplacement de marqueur de carte.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = id present |
| 1+ | id | VarString | Variable | ID du marqueur cible |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

---

### TeleportToWorldMapPosition (ID 245)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande la teleportation vers des coordonnees specifiques de la carte.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | x | int32 LE | 4 | Coordonnee X cible |
| 4 | y | int32 LE | 4 | Coordonnee Y cible |

**Taille fixe :** 8 octets

---

## Paquets Joueur (Supplementaires)

### SyncPlayerPreferences (ID 116)

**Direction :** Bidirectionnel
**Compresse :** Non
**Description :** Synchronise les parametres de preferences du joueur entre le client et le serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | showEntityMarkers | octet | 1 | Booleen : afficher les marqueurs d'entite |
| 1 | armorItemsPreferredPickupLocation | octet | 1 | Enum PickupLocation |
| 2 | weaponAndToolItemsPreferredPickupLocation | octet | 1 | Enum PickupLocation |
| 3 | usableItemsItemsPreferredPickupLocation | octet | 1 | Enum PickupLocation |
| 4 | solidBlockItemsPreferredPickupLocation | octet | 1 | Enum PickupLocation |
| 5 | miscItemsPreferredPickupLocation | octet | 1 | Enum PickupLocation |
| 6 | allowNPCDetection | octet | 1 | Booleen : autoriser detection PNJ |
| 7 | respondToHit | octet | 1 | Booleen : reagir aux coups |

**Valeurs PickupLocation :**
- `0` - Hotbar : Preferer les emplacements de barre rapide
- `1` - Inventory : Preferer les emplacements d'inventaire
- `2` - Auto : Placement automatique

**Taille fixe :** 8 octets

---

### RemoveMapMarker (ID 119)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande la suppression d'un marqueur de carte.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = markerId present |
| 1+ | markerId | VarString | Variable | ID du marqueur a supprimer |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets

---

## Paquets de Configuration (Supplementaires)

### ViewRadius (ID 32)

**Direction :** Bidirectionnel
**Compresse :** Non
**Description :** Definit la distance de vue/rendu du client en chunks.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | value | int32 LE | 4 | Rayon de vue en chunks |

**Taille fixe :** 4 octets

---

## Paquets d'Acces Serveur (Supplementaires)

### RequestServerAccess (ID 250)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client demande a changer le niveau d'acces du serveur (pour les proprietaires/admins du serveur).

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | access | octet | 1 | Valeur enum Access |
| 1 | externalPort | int16 LE | 2 | Port externe pour l'acces public |

**Valeurs Access :**
- `0` - Private : Serveur non liste
- `1` - FriendsOnly : Visible par les amis
- `2` - Public : Liste publiquement

**Taille fixe :** 3 octets

---

## Paquets Interface (Supplementaires)

### CustomPageEvent (ID 219)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client envoie des evenements des pages UI personnalisees au serveur.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = donnees presentes |
| 1 | type | octet | 1 | Enum CustomPageEventType |
| 2+ | data | VarString | Variable | Donnees d'evenement JSON |

**Valeurs CustomPageEventType :**
- `0` - Acknowledge : Confirmation de chargement de page
- `1` - Data : Donnees d'entree utilisateur
- `2` - Dismiss : L'utilisateur a ferme la page

**Taille fixe :** 2 octets (minimum)
**Taille maximale :** 16 384 007 octets

---

### EditorBlocksChange (ID 222)

**Direction :** Bidirectionnel
**Compresse :** Oui
**Description :** Commande d'editeur pour les changements de blocs/fluides en lot. Utilise par les outils de construction pour les operations complexes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = selection, Bit 1 = blocs, Bit 2 = fluides |
| 1 | selection | EditorSelection | 24 | Limites de selection (optionnel) |
| 25 | blocksCount | int32 LE | 4 | Total de blocs affectes |
| 29 | advancedPreview | octet | 1 | Booleen : afficher apercu |
| 30 | blocksChangeOffset | int32 LE | 4 | Offset vers les changements de blocs |
| 34 | fluidsChangeOffset | int32 LE | 4 | Offset vers les changements de fluides |
| 38+ | blocksChange | BlockChange[] | Variable | Modifications de blocs |
| ... | fluidsChange | FluidChange[] | Variable | Modifications de fluides |

**Taille fixe :** 38 octets (minimum)
**Taille maximale :** 139 264 048 octets

---

### UpdateKnownRecipes (ID 228)

**Direction :** Serveur -> Client
**Compresse :** Non
**Description :** Met a jour les recettes d'artisanat connues du client. Utilise pour les systemes de deblocage de recettes.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = carte connue presente |
| 1+ | known | `Map<String, CraftingRecipe>` | Variable | ID de recette vers donnees de recette |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 1 677 721 600 octets

---

### UpdateLanguage (ID 232)

**Direction :** Client -> Serveur
**Compresse :** Non
**Description :** Le client notifie le serveur du changement de preference de langue.

| Offset | Champ | Type | Taille | Description |
|--------|-------|------|--------|-------------|
| 0 | nullBits | octet | 1 | Bit 0 = langue presente |
| 1+ | language | VarString | Variable | Code de langue (ex. "en", "fr") |

**Taille fixe :** 1 octet (minimum)
**Taille maximale :** 16 384 006 octets