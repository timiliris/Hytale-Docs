---
id: network-protocol
title: Network Protocol
sidebar_label: Network Protocol
sidebar_position: 5
description: Understanding the Hytale server network protocol
---

# Network Protocol

This document describes the Hytale network protocol used for communication between clients and servers. The information is derived from analysis of the decompiled server code.

## Protocol Overview

Hytale uses a modern, efficient network protocol built on top of QUIC (Quick UDP Internet Connections).

| Property | Value |
|----------|-------|
| Transport | QUIC over UDP |
| Default Port | 5520 |
| Application Protocol | `hytale/1` |

QUIC provides several advantages over traditional TCP:
- **Reduced latency**: Faster connection establishment with 0-RTT support
- **Multiplexed streams**: Multiple data streams without head-of-line blocking
- **Built-in encryption**: TLS 1.3 integrated into the protocol
- **Connection migration**: Handles network changes gracefully

## Protocol Constants

The protocol uses the following constants defined in `ProtocolSettings.java`:

| Constant | Value | Description |
|----------|-------|-------------|
| `PROTOCOL_HASH` | `6708f121966c1c443f4b0eb525b2f81d0a8dc61f5003a692a8fa157e5e02cea9` | SHA-256 hash for version validation |
| `PROTOCOL_VERSION` | 1 | Protocol version number |
| `PACKET_COUNT` | 268 | Total number of packet types |
| `STRUCT_COUNT` | 315 | Total number of data structures |
| `ENUM_COUNT` | 136 | Total number of enumerations |
| `MAX_PACKET_SIZE` | 1,677,721,600 | Maximum packet size in bytes (~1.6 GB) |
| `DEFAULT_PORT` | 5520 | Default server port |

The `PROTOCOL_HASH` is used during the handshake to ensure client and server are using compatible protocol versions.

## Packet Interface

All packets implement the `Packet` interface (`com.hypixel.hytale.protocol.Packet`):

```java
public interface Packet {
   int getId();
   void serialize(@Nonnull ByteBuf var1);
   int computeSize();
}
```

| Method | Description |
|--------|-------------|
| `getId()` | Returns the unique packet identifier |
| `serialize(ByteBuf)` | Writes the packet data to a byte buffer |
| `computeSize()` | Calculates the serialized size of the packet |

## Serialization

### Frame Structure

Packets are transmitted as length-prefixed binary frames:

```
+----------------+----------------+------------------+
| Length (4 bytes) | Packet ID (4 bytes) | Payload (variable) |
+----------------+----------------+------------------+
```

| Component | Size | Description |
|-----------|------|-------------|
| Length Prefix | 4 bytes | Total frame length |
| Packet ID | 4 bytes | Identifies the packet type |
| Payload | Variable | Packet-specific data |
| **Minimum Frame Size** | 8 bytes | Length + Packet ID |

### Compression

Large packets use **Zstd** (Zstandard) compression for efficient bandwidth usage. Zstd provides:
- Fast compression and decompression speeds
- High compression ratios
- Streaming support

Packets that use compression have an `IS_COMPRESSED = true` flag in their class definition.

### Variable-Length Integers (VarInt)

Hytale implements its own VarInt encoding for variable-length integers in `com.hypixel.hytale.protocol.io.VarInt`:

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

Key characteristics:
- Only encodes non-negative values
- Uses 7 bits per byte for data, 1 bit as continuation flag
- Smaller values use fewer bytes (efficient for common small numbers)

## Packet Directions

Packets flow in three directions:

| Direction | Description | Example |
|-----------|-------------|---------|
| **Client to Server** | Sent by clients, handled by server packet handlers | `ClientMovement`, `ChatMessage` |
| **Server to Client** | Sent by server, processed by client | `SetChunk`, `EntityUpdates` |
| **Bidirectional** | Can be sent by either party | `Disconnect`, `SetPaused` |

Client-to-server packets are registered in `GamePacketHandler.registerHandlers()`:

```java
this.registerHandler(108, p -> this.handle((ClientMovement)p));
this.registerHandler(211, p -> this.handle((ChatMessage)p));
```

Server-to-client packets are encoded via `PacketEncoder.encode()` and sent through the network channel.

## Connection Flow

### Handshake Process

1. **Client connects** via QUIC transport
2. **Client sends `Connect` packet** (ID 0) with:
   - Protocol hash for version validation
   - Client type (Game or Editor)
   - Language code
   - Identity token for authentication
   - Player UUID and username
3. **Server validates** the protocol hash against expected value
4. **Server validates** authentication credentials
5. **Server responds** with either:
   - `ConnectAccept` (ID 14) - Connection accepted, may include password challenge
   - `Disconnect` (ID 1) - Connection rejected with reason
6. **Authentication continues** via `AuthenticationPacketHandler`
7. **Setup phase** transitions to `SetupPacketHandler`
8. **Gameplay** transitions to `GamePacketHandler`

```
Client                                Server
   |                                    |
   |  -------- QUIC Connect ----------> |
   |                                    |
   |  -------- Connect (ID 0) --------> |
   |       protocolHash, clientType,    |
   |       language, identityToken,     |
   |       uuid, username               |
   |                                    |
   |  <----- ConnectAccept (ID 14) ---- |
   |       passwordChallenge (optional) |
   |                                    |
   |  -------- AuthToken (ID 12) -----> |
   |       accessToken,                 |
   |       serverAuthorizationGrant     |
   |                                    |
   |  <------ JoinWorld (ID 104) ------ |
   |                                    |
```

## Packet Categories

Packets are organized into functional categories:

### Connection Packets

Manage connection lifecycle.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `Connect` | 0 | Client -> Server | Initial connection request |
| `Disconnect` | 1 | Bidirectional | Connection termination |
| `Ping` | 2 | Server -> Client | Latency measurement request |
| `Pong` | 3 | Client -> Server | Latency measurement response |

### Authentication Packets

Handle authentication flow.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `Status` | 10 | Server -> Client | Server status information |
| `AuthToken` | 12 | Client -> Server | Authentication token submission |
| `ConnectAccept` | 14 | Server -> Client | Connection accepted response |

### Player Packets

Manage player state and actions.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `JoinWorld` | 104 | Server -> Client | Join a world |
| `ClientReady` | 105 | Client -> Server | Client ready state |
| `ClientMovement` | 108 | Client -> Server | Player movement update |
| `MouseInteraction` | 111 | Client -> Server | Mouse input events |
| `SyncPlayerPreferences` | 116 | Client -> Server | Sync player settings |
| `ClientPlaceBlock` | 117 | Client -> Server | Place block request |
| `RemoveMapMarker` | 119 | Client -> Server | Remove map marker |

### World Packets

Synchronize world data.

| Packet | ID | Direction | Compressed | Description |
|--------|-----|-----------|------------|-------------|
| `SetChunk` | 131 | Server -> Client | Yes | Chunk data transfer |
| `SetPaused` | 158 | Bidirectional | No | Pause game state |

### Entity Packets

Synchronize entity state.

| Packet | ID | Direction | Compressed | Description |
|--------|-----|-----------|------------|-------------|
| `EntityUpdates` | 161 | Server -> Client | Yes | Entity state updates |
| `MountMovement` | 166 | Client -> Server | No | Mounted entity movement |

### Inventory Packets

Manage player inventory.

| Packet | ID | Direction | Compressed | Description |
|--------|-----|-----------|------------|-------------|
| `UpdatePlayerInventory` | 170 | Server -> Client | Yes | Full inventory sync |
| `SetCreativeItem` | 171 | Client -> Server | No | Set item in creative inventory |
| `DropCreativeItem` | 172 | Client -> Server | No | Drop creative item into world |
| `SmartGiveCreativeItem` | 173 | Client -> Server | No | Smart give item in creative mode |
| `DropItemStack` | 174 | Client -> Server | No | Drop items from inventory |
| `MoveItemStack` | 175 | Client -> Server | No | Move items between slots |
| `SmartMoveItemStack` | 176 | Client -> Server | No | Smart item movement |
| `SetActiveSlot` | 177 | Client -> Server | No | Change active hotbar slot |
| `SwitchHotbarBlockSet` | 178 | Client -> Server | No | Switch hotbar block set |
| `InventoryAction` | 179 | Client -> Server | No | Generic inventory action |
| `LoadHotbar` | 106 | Client -> Server | No | Load hotbar configuration |
| `SaveHotbar` | 107 | Client -> Server | No | Save hotbar configuration |

### Window/UI Packets

Handle UI interactions.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `CloseWindow` | 202 | Client -> Server | Close UI window |
| `SendWindowAction` | 203 | Client -> Server | Window interaction |
| `ClientOpenWindow` | 204 | Client -> Server | Request to open window |

### Interface Packets

Chat and interface management.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `ChatMessage` | 211 | Client -> Server | Send chat message |
| `CustomPageEvent` | 219 | Client -> Server | Custom page interaction |
| `UpdateLanguage` | 232 | Client -> Server | Change language setting |

### World Map Packets

World map interactions.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `UpdateWorldMapVisible` | 243 | Client -> Server | Toggle world map visibility |
| `TeleportToWorldMapMarker` | 244 | Client -> Server | Teleport to marker |
| `TeleportToWorldMapPosition` | 245 | Client -> Server | Teleport to position |

### Setup Packets

Initial client setup.

| Packet | ID | Direction | Description |
|--------|-----|-----------|-------------|
| `RequestAssets` | 23 | Client -> Server | Request asset data |
| `ViewRadius` | 32 | Client -> Server | Set view distance |

### Specialized Packets

| Category | Packets | Description |
|----------|---------|-------------|
| Server Access | `UpdateServerAccess` (251), `SetServerAccess` (252) | Singleplayer access control |
| Machinima | `RequestMachinimaActorModel` (260), `UpdateMachinimaScene` (262) | Cinematic tools |
| Camera | `RequestFlyCameraMode` (282) | Camera control |
| Interaction | `SyncInteractionChains` (290) | Interaction chains |
| Objectives/Quests | `TrackOrUpdateObjective` (69), `UntrackObjective` (70), `UpdateObjectiveTask` (71) | Quest tracking and progress |
| NPC Debug | `BuilderToolSetNPCDebug` (423) | NPC behavior debugging |
| Assets | 40+ packets | Asset synchronization |

## Key Packet Details

### Connect (ID 0)

Initial connection packet sent by clients.

| Field | Type | Description |
|-------|------|-------------|
| `protocolHash` | String | 64-character ASCII protocol hash |
| `clientType` | ClientType | Game or Editor |
| `language` | String | Language code (e.g., "en-US") |
| `identityToken` | String | Authentication identity token |
| `uuid` | UUID | Player UUID |
| `username` | String | Player username (max 16 chars) |
| `referralData` | byte[] | Optional referral data (max 4096 bytes) |
| `referralSource` | HostAddress | Optional referral source |

**Max Size**: 38,161 bytes

### Disconnect (ID 1)

Connection termination packet.

| Field | Type | Description |
|-------|------|-------------|
| `reason` | String | Disconnect reason message |
| `type` | DisconnectType | Disconnect, Crash, etc. |

**Max Size**: 16,384,007 bytes

### Ping/Pong (ID 2/3)

Latency measurement packets.

**Ping** (Server -> Client):

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Ping identifier |
| `time` | InstantData | Timestamp data |
| `lastPingValueRaw` | int | Last raw ping |
| `lastPingValueDirect` | int | Last direct ping |
| `lastPingValueTick` | int | Last tick ping |

**Pong** (Client -> Server):

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Matching ping identifier |
| `time` | InstantData | Timestamp data |
| `type` | PongType | Raw, Direct, or Tick |
| `packetQueueSize` | short | Client queue size |

### ClientMovement (ID 108)

Player movement state packet.

| Field | Type | Description |
|-------|------|-------------|
| `movementStates` | MovementStates | Movement flags |
| `relativePosition` | HalfFloatPosition | Position delta |
| `absolutePosition` | Position | Absolute coordinates |
| `bodyOrientation` | Direction | Body rotation |
| `lookOrientation` | Direction | Head/look direction |
| `teleportAck` | TeleportAck | Teleport acknowledgment |
| `wishMovement` | Position | Desired movement |
| `velocity` | Vector3d | Current velocity |
| `mountedTo` | int | Mounted entity ID |
| `riderMovementStates` | MovementStates | Riding movement states |

**Max Size**: 153 bytes

### SetChunk (ID 131)

Chunk data packet (compressed).

| Field | Type | Description |
|-------|------|-------------|
| `x` | int | Chunk X coordinate |
| `y` | int | Chunk Y coordinate |
| `z` | int | Chunk Z coordinate |
| `localLight` | byte[] | Local lighting data |
| `globalLight` | byte[] | Global lighting data |
| `data` | byte[] | Block data |

**Max Size**: 12,288,040 bytes
**Compression**: Zstd

### EntityUpdates (ID 161)

Entity synchronization packet (compressed).

| Field | Type | Description |
|-------|------|-------------|
| `removed` | int[] | Removed entity IDs |
| `updates` | EntityUpdate[] | Entity state updates |

**Max Size**: 1,677,721,600 bytes
**Compression**: Zstd

### UpdatePlayerInventory (ID 170)

Full inventory synchronization packet (compressed).

| Field | Type | Description |
|-------|------|-------------|
| `storage` | InventorySection | Storage section |
| `armor` | InventorySection | Armor section |
| `hotbar` | InventorySection | Hotbar section |
| `utility` | InventorySection | Utility items |
| `builderMaterial` | InventorySection | Builder materials |
| `tools` | InventorySection | Tools section |
| `backpack` | InventorySection | Backpack section |
| `sortType` | SortType | Current sort type |

**Compression**: Zstd

### ChatMessage (ID 211)

Chat message packet.

| Field | Type | Description |
|-------|------|-------------|
| `message` | String | Message content (max 4,096,000 chars) |

**Max Size**: 16,384,006 bytes

## Disconnect Types

The `DisconnectType` enum defines various disconnect reasons:

| Type | Description |
|------|-------------|
| `Disconnect` | Normal disconnect |
| `Crash` | Client/server crash |

## Detailed Packet Structures

This section provides detailed binary structures for high-priority packet categories, derived from decompiled source code.

### Entity Packets

Entity packets handle the synchronization of entities between the server and clients, including spawning, updating, and removing entities.

#### EntityUpdates (ID 161)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Batch update packet that synchronizes multiple entity states. Sent every tick for entities within the player's view distance.

```
+------------------+------------------+--------------------+--------------------+
| Null Bits (1)    | removed Offset   | updates Offset     | Variable Data      |
| (byte)           | (int32 LE)       | (int32 LE)         | (variable)         |
+------------------+------------------+--------------------+--------------------+
```

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bitmask: bit 0 = removed present, bit 1 = updates present |
| 1 | removedOffset | int32 LE | 4 | Offset to removed array (-1 if null) |
| 5 | updatesOffset | int32 LE | 4 | Offset to updates array (-1 if null) |
| 9 | removed | VarInt + int32[] | Variable | Array of entity network IDs to remove |
| - | updates | VarInt + EntityUpdate[] | Variable | Array of entity updates |

**EntityUpdate Structure:**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| nullBits | byte | 1 | Presence flags for optional fields |
| networkId | int32 LE | 4 | Entity network identifier |
| removedOffset | int32 LE | 4 | Offset to removed components |
| updatesOffset | int32 LE | 4 | Offset to component updates |
| removed | ComponentUpdateType[] | Variable | Components removed from entity |
| updates | ComponentUpdate[] | Variable | Component state updates |

**Max Size:** 1,677,721,600 bytes

#### PlayAnimation (ID 162)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Triggers an animation on an entity. Used for combat animations, emotes, and other visual feedback.

```
+------------------+------------------+------------------+------------------+
| Null Bits (1)    | entityId (4)     | slot (1)         | Variable Data    |
+------------------+------------------+------------------+------------------+
```

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bitmask for nullable fields |
| 1 | entityId | int32 LE | 4 | Target entity network ID |
| 5 | slot | byte | 1 | AnimationSlot enum value (Movement, Action, etc.) |
| 6 | itemAnimationsIdOffset | int32 LE | 4 | Offset to item animations string |
| 10 | animationIdOffset | int32 LE | 4 | Offset to animation ID string |
| 14 | itemAnimationsId | VarString | Variable | Item animation set ID (optional) |
| - | animationId | VarString | Variable | Animation identifier (optional) |

**Fixed Size:** 14 bytes (minimum)
**Max Size:** 32,768,024 bytes

#### ChangeVelocity (ID 163)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Modifies an entity's velocity. Used for knockback, explosions, and physics effects.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flag for config |
| 1 | x | float LE | 4 | X velocity component |
| 5 | y | float LE | 4 | Y velocity component |
| 9 | z | float LE | 4 | Z velocity component |
| 13 | changeType | byte | 1 | ChangeVelocityType: 0=Add, 1=Set, 2=Multiply |
| 14 | config | VelocityConfig | 21 | Optional velocity configuration |

**Fixed Size:** 35 bytes

#### ApplyKnockback (ID 164)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Applies knockback force to the client's player entity, typically from combat or explosions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = hitPosition present |
| 1 | hitPosition | Position | 24 | Impact position (x, y, z as doubles) |
| 25 | x | float LE | 4 | Knockback force X |
| 29 | y | float LE | 4 | Knockback force Y |
| 33 | z | float LE | 4 | Knockback force Z |
| 37 | changeType | byte | 1 | ChangeVelocityType enum |

**Fixed Size:** 38 bytes

#### SpawnModelParticles (ID 165)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Spawns particle effects attached to an entity's model bones.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | entityId | int32 LE | 4 | Entity network ID |
| 5 | modelParticles | ModelParticle[] | Variable | Array of particle configurations |

**Max Size:** 1,677,721,600 bytes

#### MountMovement (ID 166)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Sends movement input for a mounted entity (vehicle, rideable creature).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | absolutePosition | Position | 24 | Mount's absolute world position |
| 25 | bodyOrientation | Direction | 12 | Mount's body rotation (yaw, pitch, roll as floats) |
| 37 | movementStates | MovementStates | 22 | Movement flags and states |

**Fixed Size:** 59 bytes

#### SetEntitySeed (ID 160)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sets the random seed for an entity, used for deterministic procedural effects.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | entitySeed | int32 LE | 4 | Random seed value |

**Fixed Size:** 4 bytes

---

### Player Packets

Player packets manage player state, movement, actions, and game mode.

#### JoinWorld (ID 104)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sent when a player joins or transitions to a world. Triggers world loading on the client.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | clearWorld | byte | 1 | Boolean: clear existing world data |
| 1 | fadeInOut | byte | 1 | Boolean: use fade transition |
| 2 | worldUuid | UUID | 16 | World unique identifier (two int64 LE) |

**Fixed Size:** 18 bytes

#### ClientReady (ID 105)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Signals client readiness state during world loading.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | readyForChunks | byte | 1 | Boolean: ready to receive chunk data |
| 1 | readyForGameplay | byte | 1 | Boolean: ready for gameplay packets |

**Fixed Size:** 2 bytes

#### ClientMovement (ID 108)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Primary movement packet sent every tick containing the player's position, orientation, and movement state.

```
+------------------+-------------------+-------------------+-------------------+
| Null Bits (2)    | movementStates    | relativePosition  | absolutePosition  |
+------------------+-------------------+-------------------+-------------------+
| bodyOrientation  | lookOrientation   | teleportAck       | wishMovement      |
+------------------+-------------------+-------------------+-------------------+
| velocity         | mountedTo         | riderMovementStates                    |
+------------------+-------------------+----------------------------------------+
```

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte[2] | 2 | Presence flags for 10 optional fields |
| 2 | movementStates | MovementStates | 22 | Movement flags (jumping, sprinting, sneaking, etc.) |
| 24 | relativePosition | HalfFloatPosition | 6 | Position delta (half-precision floats) |
| 30 | absolutePosition | Position | 24 | Absolute world coordinates (3x double) |
| 54 | bodyOrientation | Direction | 12 | Body rotation (3x float) |
| 66 | lookOrientation | Direction | 12 | Camera/head direction (3x float) |
| 78 | teleportAck | TeleportAck | 1 | Acknowledges server teleport |
| 79 | wishMovement | Position | 24 | Desired movement direction |
| 103 | velocity | Vector3d | 24 | Current velocity (3x double) |
| 127 | mountedTo | int32 LE | 4 | Entity ID if mounted (-1 if not) |
| 131 | riderMovementStates | MovementStates | 22 | Movement states when riding |

**Fixed Size:** 153 bytes

#### ClientTeleport (ID 109)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Teleports the player to a new position, used for respawning, portals, and commands.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flag for modelTransform |
| 1 | teleportId | byte | 1 | Teleport sequence ID for acknowledgment |
| 2 | modelTransform | ModelTransform | 49 | Position and rotation data |
| 51 | resetVelocity | byte | 1 | Boolean: reset player velocity |

**Fixed Size:** 52 bytes

#### MouseInteraction (ID 111)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Sends mouse input events including clicks and world interactions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | clientTimestamp | int64 LE | 8 | Client-side timestamp |
| 9 | activeSlot | int32 LE | 4 | Currently selected hotbar slot |
| 13 | screenPoint | Vector2f | 8 | Mouse screen coordinates (optional) |
| 21 | mouseButton | MouseButtonEvent | 3 | Button state (optional) |
| 24 | worldInteraction | WorldInteraction | 20 | Block/entity interaction data (optional) |
| 44 | itemInHandIdOffset | int32 LE | 4 | Offset to item ID string |
| 48 | mouseMotionOffset | int32 LE | 4 | Offset to mouse motion data |

**Fixed Size:** 52 bytes (minimum)
**Max Size:** 20,480,071 bytes

#### ClientPlaceBlock (ID 117)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Request to place a block at a specific position.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = position, bit 1 = rotation |
| 1 | position | BlockPosition | 12 | Block coordinates (3x int32) |
| 13 | rotation | BlockRotation | 3 | Block rotation state |
| 16 | placedBlockId | int32 LE | 4 | Block type identifier |

**Fixed Size:** 20 bytes

#### SetGameMode (ID 101)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Changes the player's game mode.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | gameMode | byte | 1 | GameMode enum: Adventure, Creative, Spectator |

**Fixed Size:** 1 byte

---

### World Packets

World packets handle chunk data, block updates, and world state synchronization.

#### SetChunk (ID 131)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends chunk data to the client including block data and lighting information.

```
+------------------+------------------+------------------+------------------+
| Null Bits (1)    | x (4)            | y (4)            | z (4)            |
+------------------+------------------+------------------+------------------+
| localLightOffset | globalLightOffset| dataOffset       | Variable Data    |
+------------------+------------------+------------------+------------------+
```

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for data arrays |
| 1 | x | int32 LE | 4 | Chunk X coordinate |
| 5 | y | int32 LE | 4 | Chunk Y coordinate |
| 9 | z | int32 LE | 4 | Chunk Z coordinate |
| 13 | localLightOffset | int32 LE | 4 | Offset to local lighting data |
| 17 | globalLightOffset | int32 LE | 4 | Offset to global lighting data |
| 21 | dataOffset | int32 LE | 4 | Offset to block data |
| 25 | localLight | VarInt + byte[] | Variable | Local light levels per block |
| - | globalLight | VarInt + byte[] | Variable | Global (sky) light levels |
| - | data | VarInt + byte[] | Variable | Compressed block data |

**Fixed Size:** 25 bytes (minimum)
**Max Size:** 12,288,040 bytes

#### UnloadChunk (ID 135)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Instructs the client to unload a chunk column from memory.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | chunkX | int32 LE | 4 | Chunk column X coordinate |
| 4 | chunkZ | int32 LE | 4 | Chunk column Z coordinate |

**Fixed Size:** 8 bytes

#### ServerSetBlock (ID 140)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates a single block in the world. Used for block breaking, placing, and state changes.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | x | int32 LE | 4 | Block X coordinate |
| 4 | y | int32 LE | 4 | Block Y coordinate |
| 8 | z | int32 LE | 4 | Block Z coordinate |
| 12 | blockId | int32 LE | 4 | New block type ID (0 = air) |
| 16 | filler | int16 LE | 2 | Reserved/padding data |
| 18 | rotation | byte | 1 | Block rotation state (0-23) |

**Fixed Size:** 19 bytes

#### ServerSetBlocks (ID 141)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Batch update for multiple blocks within a chunk, more efficient than multiple ServerSetBlock packets.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | x | int32 LE | 4 | Chunk X coordinate |
| 4 | y | int32 LE | 4 | Chunk Y coordinate |
| 8 | z | int32 LE | 4 | Chunk Z coordinate |
| 12 | cmds | SetBlockCmd[] | Variable | Array of block commands |

**SetBlockCmd Structure (9 bytes each):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| index | int16 LE | 2 | Block index within chunk (0-4095) |
| blockId | int32 LE | 4 | Block type ID |
| filler | int16 LE | 2 | Reserved data |
| rotation | byte | 1 | Block rotation (0-23) |

**Max Size:** 36,864,017 bytes

#### UpdateBlockDamage (ID 144)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the damage state of a block during breaking, used for break animation.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flag for position |
| 1 | blockPosition | BlockPosition | 12 | Target block coordinates |
| 13 | damage | float LE | 4 | Total accumulated damage (0.0-1.0) |
| 17 | delta | float LE | 4 | Damage change this tick |

**Fixed Size:** 21 bytes

#### SetPaused (ID 158)

**Direction:** Bidirectional
**Compressed:** No
**Description:** Pauses or unpauses the game (singleplayer only).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | paused | byte | 1 | Boolean: game paused state |

**Fixed Size:** 1 byte

---

### Inventory Packets

Inventory packets manage player inventory state, item movement, and container interactions.

#### UpdatePlayerInventory (ID 170)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Full inventory synchronization, sent on join and after significant inventory changes.

```
+------------------+------------------+------------------+------------------+
| Null Bits (1)    | sortType (1)     | Section Offsets  | Variable Data    |
|                  |                  | (7x int32)       |                  |
+------------------+------------------+------------------+------------------+
```

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for 7 inventory sections |
| 1 | sortType | byte | 1 | SortType enum: Name, Type, Quality |
| 2 | storageOffset | int32 LE | 4 | Offset to storage section |
| 6 | armorOffset | int32 LE | 4 | Offset to armor section |
| 10 | hotbarOffset | int32 LE | 4 | Offset to hotbar section |
| 14 | utilityOffset | int32 LE | 4 | Offset to utility section |
| 18 | builderMaterialOffset | int32 LE | 4 | Offset to builder materials |
| 22 | toolsOffset | int32 LE | 4 | Offset to tools section |
| 26 | backpackOffset | int32 LE | 4 | Offset to backpack section |
| 30+ | sections | InventorySection[] | Variable | Section data with item stacks |

**Fixed Size:** 30 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### DropItemStack (ID 174)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Request to drop items from inventory into the world.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | Source section ID |
| 4 | slotId | int32 LE | 4 | Source slot index |
| 8 | quantity | int32 LE | 4 | Number of items to drop |

**Fixed Size:** 12 bytes

#### MoveItemStack (ID 175)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Request to move items between inventory slots or sections.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | fromSectionId | int32 LE | 4 | Source section ID |
| 4 | fromSlotId | int32 LE | 4 | Source slot index |
| 8 | quantity | int32 LE | 4 | Number of items to move |
| 12 | toSectionId | int32 LE | 4 | Destination section ID |
| 16 | toSlotId | int32 LE | 4 | Destination slot index |

**Fixed Size:** 20 bytes

#### SetActiveSlot (ID 177)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Changes the player's active hotbar slot selection.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | Section ID (typically hotbar) |
| 4 | activeSlot | int32 LE | 4 | New active slot index |

**Fixed Size:** 8 bytes

#### InventoryAction (ID 179)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Generic inventory action request (take all, split stack, etc.).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | Target section ID |
| 4 | inventoryActionType | byte | 1 | InventoryActionType enum |
| 5 | actionData | byte | 1 | Action-specific parameter |

**InventoryActionType Values:**
- `0` - TakeAll: Pick up entire stack
- `1` - Split: Split stack in half
- `2` - TakeOne: Take single item

**Fixed Size:** 6 bytes

---

### Window/Container Packets

Window packets handle UI containers like chests, crafting tables, and shops.

#### OpenWindow (ID 200)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Opens a container UI window on the client.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | id | int32 LE | 4 | Unique window ID |
| 5 | windowType | byte | 1 | WindowType enum |
| 6 | windowDataOffset | int32 LE | 4 | Offset to window configuration |
| 10 | inventoryOffset | int32 LE | 4 | Offset to container inventory |
| 14 | extraResourcesOffset | int32 LE | 4 | Offset to extra data |

**WindowType Values:**
- `0` - Container: Generic chest/storage
- `1` - Crafting: Crafting table
- `2` - Furnace: Smelting interface
- `3` - Anvil: Repair/naming
- `4` - Enchanting: Enchantment table
- `5` - Trading: NPC shop

**Max Size:** 1,677,721,600 bytes

#### CloseWindow (ID 202)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Notifies the server that the player closed a window.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | id | int32 LE | 4 | Window ID to close |

**Fixed Size:** 4 bytes

#### SendWindowAction (ID 203)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Sends a window-specific action (craft item, sort, etc.).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | id | int32 LE | 4 | Window ID |
| 4 | action | WindowAction | Variable | Polymorphic action data |

**WindowAction Types:**
- CraftItemAction
- SelectSlotAction
- SortItemsAction
- TierUpgradeAction
- CraftRecipeAction
- ChangeBlockAction

**Max Size:** 32,768,027 bytes

---

## Data Types Reference

### Primitive Types

| Type | Size | Description |
|------|------|-------------|
| byte | 1 | Unsigned 8-bit integer |
| int16 LE | 2 | Little-endian signed 16-bit |
| int32 LE | 4 | Little-endian signed 32-bit |
| int64 LE | 8 | Little-endian signed 64-bit |
| float LE | 4 | Little-endian 32-bit IEEE 754 |
| double LE | 8 | Little-endian 64-bit IEEE 754 |
| VarInt | 1-5 | Variable-length unsigned integer |
| VarString | Variable | VarInt length + UTF-8 bytes |
| UUID | 16 | Two int64 LE values |

### Common Structures

**Position (24 bytes):**
```
+------------------+------------------+------------------+
| x (double LE)    | y (double LE)    | z (double LE)    |
+------------------+------------------+------------------+
```

**BlockPosition (12 bytes):**
```
+------------------+------------------+------------------+
| x (int32 LE)     | y (int32 LE)     | z (int32 LE)     |
+------------------+------------------+------------------+
```

**Direction (12 bytes):**
```
+------------------+------------------+------------------+
| yaw (float LE)   | pitch (float LE) | roll (float LE)  |
+------------------+------------------+------------------+
```

**HalfFloatPosition (6 bytes):**
```
+------------------+------------------+------------------+
| x (half float)   | y (half float)   | z (half float)   |
+------------------+------------------+------------------+
```

**Vector3d (24 bytes):**
```
+------------------+------------------+------------------+
| x (double LE)    | y (double LE)    | z (double LE)    |
+------------------+------------------+------------------+
```

**Vector2f (8 bytes):**
```
+------------------+------------------+
| x (float LE)     | y (float LE)     |
+------------------+------------------+
```

**Vector2i (8 bytes):**
```
+------------------+------------------+
| x (int32 LE)     | y (int32 LE)     |
+------------------+------------------+
```

### Movement and Input Structures

This section documents the data structures used for player movement, physics, and input handling.

#### MovementStates (22 bytes)

The `MovementStates` structure encodes the player's current movement state as a set of boolean flags. Each flag occupies 1 byte (non-zero = true).

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

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | idle | byte | 1 | Player is idle (not moving) |
| 1 | horizontalIdle | byte | 1 | No horizontal movement input |
| 2 | jumping | byte | 1 | Currently jumping |
| 3 | flying | byte | 1 | Flying mode active |
| 4 | walking | byte | 1 | Walking speed movement |
| 5 | running | byte | 1 | Running speed movement |
| 6 | sprinting | byte | 1 | Sprinting speed movement |
| 7 | crouching | byte | 1 | Crouching/sneaking |
| 8 | forcedCrouching | byte | 1 | Forced crouch (low ceiling) |
| 9 | falling | byte | 1 | Falling through air |
| 10 | climbing | byte | 1 | Climbing ladder/vines |
| 11 | inFluid | byte | 1 | Submerged in fluid |
| 12 | swimming | byte | 1 | Swimming in fluid |
| 13 | swimJumping | byte | 1 | Jumping while swimming |
| 14 | onGround | byte | 1 | Standing on solid ground |
| 15 | mantling | byte | 1 | Climbing over ledge |
| 16 | sliding | byte | 1 | Slide movement active |
| 17 | mounting | byte | 1 | Mounting/dismounting entity |
| 18 | rolling | byte | 1 | Combat roll active |
| 19 | sitting | byte | 1 | Sitting on seat/chair |
| 20 | gliding | byte | 1 | Gliding with wings/elytra |
| 21 | sleeping | byte | 1 | Sleeping in bed |

**Fixed Size:** 22 bytes
**Source:** `com/hypixel/hytale/protocol/MovementStates.java`

#### SavedMovementStates (1 byte)

A minimal subset of movement states that persists across sessions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | flying | byte | 1 | Flying mode state |

**Fixed Size:** 1 byte
**Source:** `com/hypixel/hytale/protocol/SavedMovementStates.java`

#### MovementSettings (251 bytes)

The `MovementSettings` structure contains all physics and movement parameters for a player entity. Sent via UpdateMovementSettings (ID 110) when movement properties change.

**Physics Parameters:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | mass | float LE | 4 | Entity mass for physics calculations |
| 4 | dragCoefficient | float LE | 4 | Air drag coefficient |
| 8 | invertedGravity | byte | 1 | Gravity direction inverted |
| 9 | velocityResistance | float LE | 4 | Velocity decay rate |
| 141 | canFly | byte | 1 | Flying ability enabled |
| 142 | collisionExpulsionForce | float LE | 4 | Force applied when colliding |

**Jump Parameters:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 13 | jumpForce | float LE | 4 | Base jump strength |
| 17 | swimJumpForce | float LE | 4 | Jump force while swimming |
| 21 | jumpBufferDuration | float LE | 4 | Jump input buffer time |
| 25 | jumpBufferMaxYVelocity | float LE | 4 | Max Y velocity for buffered jump |

**Ground Movement:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 29 | acceleration | float LE | 4 | Ground acceleration rate |
| 89 | baseSpeed | float LE | 4 | Base movement speed |
| 117 | maxSpeedMultiplier | float LE | 4 | Maximum speed cap multiplier |
| 121 | minSpeedMultiplier | float LE | 4 | Minimum speed floor multiplier |

**Directional Speed Multipliers:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 146 | forwardWalkSpeedMultiplier | float LE | 4 | Forward walk speed |
| 150 | backwardWalkSpeedMultiplier | float LE | 4 | Backward walk speed |
| 154 | strafeWalkSpeedMultiplier | float LE | 4 | Strafe walk speed |
| 158 | forwardRunSpeedMultiplier | float LE | 4 | Forward run speed |
| 162 | backwardRunSpeedMultiplier | float LE | 4 | Backward run speed |
| 166 | strafeRunSpeedMultiplier | float LE | 4 | Strafe run speed |
| 170 | forwardCrouchSpeedMultiplier | float LE | 4 | Forward crouch speed |
| 174 | backwardCrouchSpeedMultiplier | float LE | 4 | Backward crouch speed |
| 178 | strafeCrouchSpeedMultiplier | float LE | 4 | Strafe crouch speed |
| 182 | forwardSprintSpeedMultiplier | float LE | 4 | Forward sprint speed |

**Air Control:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 33 | airDragMin | float LE | 4 | Minimum air drag |
| 37 | airDragMax | float LE | 4 | Maximum air drag |
| 41 | airDragMinSpeed | float LE | 4 | Speed threshold for min drag |
| 45 | airDragMaxSpeed | float LE | 4 | Speed threshold for max drag |
| 49 | airFrictionMin | float LE | 4 | Minimum air friction |
| 53 | airFrictionMax | float LE | 4 | Maximum air friction |
| 57 | airFrictionMinSpeed | float LE | 4 | Speed threshold for min friction |
| 61 | airFrictionMaxSpeed | float LE | 4 | Speed threshold for max friction |
| 65 | airSpeedMultiplier | float LE | 4 | Air movement speed multiplier |
| 69 | airControlMinSpeed | float LE | 4 | Min speed for air control |
| 73 | airControlMaxSpeed | float LE | 4 | Max speed for air control |
| 77 | airControlMinMultiplier | float LE | 4 | Air control at min speed |
| 81 | airControlMaxMultiplier | float LE | 4 | Air control at max speed |
| 85 | comboAirSpeedMultiplier | float LE | 4 | Air speed during combat combo |

**Climbing:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 93 | climbSpeed | float LE | 4 | Vertical climb speed |
| 97 | climbSpeedLateral | float LE | 4 | Lateral movement while climbing |
| 101 | climbUpSprintSpeed | float LE | 4 | Sprint climb up speed |
| 105 | climbDownSprintSpeed | float LE | 4 | Sprint climb down speed |

**Flying:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 109 | horizontalFlySpeed | float LE | 4 | Horizontal flight speed |
| 113 | verticalFlySpeed | float LE | 4 | Vertical flight speed |

**Wish Direction (Input Processing):**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 125 | wishDirectionGravityX | float LE | 4 | Input gravity X component |
| 129 | wishDirectionGravityY | float LE | 4 | Input gravity Y component |
| 133 | wishDirectionWeightX | float LE | 4 | Input weight X component |
| 137 | wishDirectionWeightY | float LE | 4 | Input weight Y component |

**Fall Mechanics:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 186 | variableJumpFallForce | float LE | 4 | Variable height jump fall force |
| 190 | fallEffectDuration | float LE | 4 | Fall impact effect duration |
| 194 | fallJumpForce | float LE | 4 | Jump force after landing |
| 198 | fallMomentumLoss | float LE | 4 | Speed loss on landing |

**Auto-Jump:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 202 | autoJumpObstacleSpeedLoss | float LE | 4 | Speed loss on auto-jump |
| 206 | autoJumpObstacleSprintSpeedLoss | float LE | 4 | Sprint speed loss on auto-jump |
| 210 | autoJumpObstacleEffectDuration | float LE | 4 | Auto-jump effect duration |
| 214 | autoJumpObstacleSprintEffectDuration | float LE | 4 | Sprint auto-jump effect duration |
| 218 | autoJumpObstacleMaxAngle | float LE | 4 | Max slope angle for auto-jump |
| 222 | autoJumpDisableJumping | byte | 1 | Disable manual jump during auto-jump |

**Slide Mechanics:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 223 | minSlideEntrySpeed | float LE | 4 | Minimum speed to start slide |
| 227 | slideExitSpeed | float LE | 4 | Speed when exiting slide |

**Roll Mechanics:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 231 | minFallSpeedToEngageRoll | float LE | 4 | Min fall speed for roll |
| 235 | maxFallSpeedToEngageRoll | float LE | 4 | Max fall speed for roll |
| 239 | rollStartSpeedModifier | float LE | 4 | Speed modifier at roll start |
| 243 | rollExitSpeedModifier | float LE | 4 | Speed modifier at roll end |
| 247 | rollTimeToComplete | float LE | 4 | Roll animation duration |

**Fixed Size:** 251 bytes
**Source:** `com/hypixel/hytale/protocol/MovementSettings.java`

#### VelocityConfig (21 bytes)

Configuration for velocity resistance applied to knockback and physics forces.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | groundResistance | float LE | 4 | Velocity resistance on ground |
| 4 | groundResistanceMax | float LE | 4 | Maximum ground resistance |
| 8 | airResistance | float LE | 4 | Velocity resistance in air |
| 12 | airResistanceMax | float LE | 4 | Maximum air resistance |
| 16 | threshold | float LE | 4 | Velocity threshold |
| 20 | style | byte | 1 | VelocityThresholdStyle enum |

**VelocityThresholdStyle Values:**
- `0` - Linear: Linear interpolation
- `1` - Exponential: Exponential curve

**Fixed Size:** 21 bytes
**Source:** `com/hypixel/hytale/protocol/VelocityConfig.java`

### Input Event Structures

This section documents structures used for mouse and keyboard input handling.

#### MouseButtonEvent (3 bytes)

Represents a mouse button state change.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | mouseButtonType | byte | 1 | MouseButtonType enum |
| 1 | state | byte | 1 | MouseButtonState enum |
| 2 | clicks | byte | 1 | Click count (1 = single, 2 = double) |

**MouseButtonType Values:**
- `0` - Left: Left mouse button
- `1` - Middle: Middle mouse button (scroll wheel)
- `2` - Right: Right mouse button
- `3` - X1: Mouse button 4 (back)
- `4` - X2: Mouse button 5 (forward)

**MouseButtonState Values:**
- `0` - Pressed: Button pressed down
- `1` - Released: Button released

**Fixed Size:** 3 bytes
**Source:** `com/hypixel/hytale/protocol/MouseButtonEvent.java`

#### MouseMotionEvent (Variable)

Captures mouse motion with held button states.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | relativeMotion | Vector2i | 8 | Mouse delta (pixels, optional) |
| 9+ | mouseButtonType | VarInt + byte[] | Variable | Array of held button types |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 4,096,014 bytes
**Source:** `com/hypixel/hytale/protocol/MouseMotionEvent.java`

#### TeleportAck (1 byte)

Acknowledgment structure for server-initiated teleports.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | teleportId | byte | 1 | Teleport sequence ID to acknowledge |

**Fixed Size:** 1 byte
**Source:** `com/hypixel/hytale/protocol/TeleportAck.java`

---

## Source Files Reference

| Component | Source File |
|-----------|-------------|
| Transport | `com/hypixel/hytale/server/core/io/transport/QUICTransport.java` |
| Packet Base | `com/hypixel/hytale/protocol/Packet.java` |
| Protocol Constants | `com/hypixel/hytale/protocol/ProtocolSettings.java` |
| Packet IO | `com/hypixel/hytale/protocol/io/PacketIO.java` |
| VarInt | `com/hypixel/hytale/protocol/io/VarInt.java` |
| Packet Encoder | `com/hypixel/hytale/protocol/io/netty/PacketEncoder.java` |
| Initial Handler | `com/hypixel/hytale/server/core/io/handlers/InitialPacketHandler.java` |
| Game Handler | `com/hypixel/hytale/server/core/io/handlers/game/GamePacketHandler.java` |
| Entity Packets | `com/hypixel/hytale/protocol/packets/entities/*.java` |
| Player Packets | `com/hypixel/hytale/protocol/packets/player/*.java` |
| World Packets | `com/hypixel/hytale/protocol/packets/world/*.java` |
| Inventory Packets | `com/hypixel/hytale/protocol/packets/inventory/*.java` |
| Window Packets | `com/hypixel/hytale/protocol/packets/window/*.java` |
| Camera Packets | `com/hypixel/hytale/protocol/packets/camera/*.java` |
| Machinima Packets | `com/hypixel/hytale/protocol/packets/machinima/*.java` |
| Interface Packets | `com/hypixel/hytale/protocol/packets/interface_/*.java` |
| Interaction Packets | `com/hypixel/hytale/protocol/packets/interaction/*.java` |
| Objective Packets | `com/hypixel/hytale/protocol/packets/assets/TrackOrUpdateObjective.java`, `UntrackObjective.java`, `UpdateObjectiveTask.java` |
| Objective Structures | `com/hypixel/hytale/protocol/Objective.java`, `ObjectiveTask.java` |
| NPC Debug Packets | `com/hypixel/hytale/protocol/packets/buildertools/BuilderToolSetNPCDebug.java` |
| Movement Structures | `com/hypixel/hytale/protocol/MovementStates.java`, `MovementSettings.java` |
| Input Structures | `com/hypixel/hytale/protocol/MouseButtonEvent.java`, `MouseMotionEvent.java` |

---

## Additional Packet Structures

This section documents additional packet categories not covered in the main section above.

### Chat/Communication Packets

Chat packets handle text communication between players and the server.

#### ChatMessage (ID 211)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Sends a chat message from the client to the server. Used for player chat input.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = message present |
| 1 | message | VarString | Variable | Chat message content (max 4,096,000 chars) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

#### ServerMessage (ID 210)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sends a formatted message from the server to the client. Used for system messages and formatted chat.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = message present |
| 1 | type | byte | 1 | ChatType enum value |
| 2 | message | FormattedMessage | Variable | Formatted message content (optional) |

**ChatType Values:**
- `0` - Chat: Standard chat message

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### Notification (ID 212)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Displays a notification popup to the player. Supports primary/secondary messages, icons, and item displays.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | style | byte | 1 | NotificationStyle enum value |
| 2 | messageOffset | int32 LE | 4 | Offset to primary message |
| 6 | secondaryMessageOffset | int32 LE | 4 | Offset to secondary message |
| 10 | iconOffset | int32 LE | 4 | Offset to icon string |
| 14 | itemOffset | int32 LE | 4 | Offset to item data |
| 18+ | (Variable data) | Variable | Variable | Message, icon, and item data |

**NotificationStyle Values:**
- `0` - Default: Standard notification
- `1` - Danger: Red/alert style
- `2` - Warning: Yellow/caution style
- `3` - Success: Green/success style

**Fixed Size:** 18 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### KillFeedMessage (ID 213)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Displays a kill feed entry showing who killed whom, with an optional icon (weapon/cause).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | killerOffset | int32 LE | 4 | Offset to killer message |
| 5 | decedentOffset | int32 LE | 4 | Offset to decedent message |
| 9 | iconOffset | int32 LE | 4 | Offset to icon string |
| 13+ | (Variable data) | Variable | Variable | Killer, decedent, and icon data |

**Fixed Size:** 13 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### ShowEventTitle (ID 214)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Displays a title/subtitle overlay on the player's screen with configurable fade animations.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | fadeInDuration | float LE | 4 | Fade-in animation duration (seconds) |
| 5 | fadeOutDuration | float LE | 4 | Fade-out animation duration (seconds) |
| 9 | duration | float LE | 4 | Display duration (seconds) |
| 13 | isMajor | byte | 1 | Boolean: large title style |
| 14 | iconOffset | int32 LE | 4 | Offset to icon string |
| 18 | primaryTitleOffset | int32 LE | 4 | Offset to primary title |
| 22 | secondaryTitleOffset | int32 LE | 4 | Offset to secondary title |
| 26+ | (Variable data) | Variable | Variable | Title content |

**Fixed Size:** 26 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### HideEventTitle (ID 215)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Hides the currently displayed event title with a fade-out animation.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | fadeOutDuration | float LE | 4 | Fade-out duration in seconds |

**Fixed Size:** 4 bytes

---

### Sound Packets

Sound packets handle audio playback on the client.

#### PlaySoundEvent2D (ID 154)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Plays a non-positional (2D) sound, typically for UI sounds or music that should play at consistent volume.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | soundEventIndex | int32 LE | 4 | Sound event ID from asset registry |
| 4 | category | byte | 1 | SoundCategory enum value |
| 5 | volumeModifier | float LE | 4 | Volume multiplier (1.0 = normal) |
| 9 | pitchModifier | float LE | 4 | Pitch multiplier (1.0 = normal) |

**SoundCategory Values:**
- `0` - Music: Background music
- `1` - Ambient: Environmental sounds
- `2` - SFX: Sound effects
- `3` - UI: Interface sounds

**Fixed Size:** 13 bytes

#### PlaySoundEvent3D (ID 155)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Plays a positional (3D) sound at a specific world location with distance attenuation.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = position present |
| 1 | soundEventIndex | int32 LE | 4 | Sound event ID |
| 5 | category | byte | 1 | SoundCategory enum value |
| 6 | position | Position | 24 | World position (x, y, z as doubles) |
| 30 | volumeModifier | float LE | 4 | Volume multiplier |
| 34 | pitchModifier | float LE | 4 | Pitch multiplier |

**Fixed Size:** 38 bytes

#### PlaySoundEventEntity (ID 156)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Plays a sound attached to an entity, following the entity's position.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | soundEventIndex | int32 LE | 4 | Sound event ID |
| 4 | networkId | int32 LE | 4 | Entity network ID to attach sound to |
| 8 | volumeModifier | float LE | 4 | Volume multiplier |
| 12 | pitchModifier | float LE | 4 | Pitch multiplier |

**Fixed Size:** 16 bytes

---

### Weather/Environment Packets

Weather packets control environmental conditions and time of day.

#### UpdateWeather (ID 149)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Changes the current weather state with a transition animation.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | weatherIndex | int32 LE | 4 | Weather type ID from asset registry |
| 4 | transitionSeconds | float LE | 4 | Duration of weather transition |

**Fixed Size:** 8 bytes

#### UpdateEditorWeatherOverride (ID 150)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Forces a specific weather state in editor mode, bypassing normal weather transitions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | weatherIndex | int32 LE | 4 | Weather type ID to force |

**Fixed Size:** 4 bytes

#### UpdateEnvironmentMusic (ID 151)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Changes the ambient music based on environment/biome.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | environmentIndex | int32 LE | 4 | Environment ID for music selection |

**Fixed Size:** 4 bytes

#### UpdateTime (ID 146)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Synchronizes the game time between server and client.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = gameTime present |
| 1 | gameTime | InstantData | 12 | Current game time data |

**Fixed Size:** 13 bytes

---

### Camera Packets

Camera packets control the player's camera view and effects.

#### SetServerCamera (ID 280)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sets the client camera view mode and optional custom camera settings.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = cameraSettings present |
| 1 | clientCameraView | byte | 1 | ClientCameraView enum value |
| 2 | isLocked | byte | 1 | Boolean: prevent player camera control |
| 3 | cameraSettings | ServerCameraSettings | 154 | Custom camera configuration (optional) |

**ClientCameraView Values:**
- `0` - FirstPerson: First-person view
- `1` - ThirdPerson: Third-person view
- `2` - Custom: Server-controlled custom view

**Fixed Size:** 157 bytes

#### CameraShakeEffect (ID 281)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Applies a camera shake effect for impact feedback, explosions, etc.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | cameraShakeId | int32 LE | 4 | Camera shake preset ID |
| 4 | intensity | float LE | 4 | Shake intensity multiplier |
| 8 | mode | byte | 1 | AccumulationMode enum value |

**AccumulationMode Values:**
- `0` - Set: Replace current shake
- `1` - Sum: Add to current shake
- `2` - Average: Blend with current shake

**Fixed Size:** 9 bytes

#### RequestFlyCameraMode (ID 282)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests to enter or exit fly camera mode (spectator/cinematic camera).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | entering | byte | 1 | Boolean: entering (true) or exiting (false) fly mode |

**Fixed Size:** 1 byte

#### SetFlyCameraMode (ID 283)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server response enabling or disabling fly camera mode.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | entering | byte | 1 | Boolean: entering fly mode state |

**Fixed Size:** 1 byte

---

### Machinima Packets

Machinima packets support cinematic recording and playback features.

#### RequestMachinimaActorModel (ID 260)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests actor model data for a machinima scene.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | modelIdOffset | int32 LE | 4 | Offset to model ID string |
| 5 | sceneNameOffset | int32 LE | 4 | Offset to scene name string |
| 9 | actorNameOffset | int32 LE | 4 | Offset to actor name string |
| 13+ | (Variable data) | Variable | Variable | String data |

**Fixed Size:** 13 bytes (minimum)
**Max Size:** 49,152,028 bytes

#### SetMachinimaActorModel (ID 261)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server sends actor model data for machinima rendering.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | modelOffset | int32 LE | 4 | Offset to Model data |
| 5 | sceneNameOffset | int32 LE | 4 | Offset to scene name |
| 9 | actorNameOffset | int32 LE | 4 | Offset to actor name |
| 13+ | (Variable data) | Variable | Variable | Model and string data |

**Fixed Size:** 13 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### UpdateMachinimaScene (ID 262)

**Direction:** Bidirectional
**Compressed:** Yes (Zstd)
**Description:** Updates machinima scene state including playback control and scene data.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | frame | float LE | 4 | Current animation frame |
| 5 | updateType | byte | 1 | SceneUpdateType enum value |
| 6 | playerOffset | int32 LE | 4 | Offset to player name |
| 10 | sceneNameOffset | int32 LE | 4 | Offset to scene name |
| 14 | sceneOffset | int32 LE | 4 | Offset to scene data |
| 18+ | (Variable data) | Variable | Variable | Scene content |

**SceneUpdateType Values:**
- `0` - Update: General scene update
- `1` - Play: Start playback
- `2` - Stop: Stop playback
- `3` - Frame: Seek to specific frame
- `4` - Save: Save scene data

**Fixed Size:** 18 bytes (minimum)
**Max Size:** 36,864,033 bytes

---

### Effect/Particle Packets

Effect packets handle visual effects and post-processing.

#### SpawnParticleSystem (ID 152)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Spawns a particle system at a world position with optional color and scale.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | position | Position | 24 | World position (optional) |
| 25 | rotation | Direction | 12 | Rotation angles (optional) |
| 37 | scale | float LE | 4 | Scale multiplier |
| 41 | color | Color | 3 | RGB color tint (optional) |
| 44 | particleSystemId | VarString | Variable | Particle system ID string |

**Fixed Size:** 44 bytes (minimum)
**Max Size:** 16,384,049 bytes

#### SpawnBlockParticleSystem (ID 153)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Spawns block-based particle effects (breaking, walking, etc.).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = position present |
| 1 | blockId | int32 LE | 4 | Block type ID for texture |
| 5 | particleType | byte | 1 | BlockParticleEvent enum (Walk, Break, etc.) |
| 6 | position | Position | 24 | World position (optional) |

**Fixed Size:** 30 bytes

#### UpdatePostFxSettings (ID 361)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates post-processing visual effects settings.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | globalIntensity | float LE | 4 | Overall effect intensity |
| 4 | power | float LE | 4 | Effect power/strength |
| 8 | sunshaftScale | float LE | 4 | Sunshaft/godrays scale |
| 12 | sunIntensity | float LE | 4 | Sun brightness |
| 16 | sunshaftIntensity | float LE | 4 | Sunshaft effect intensity |

**Fixed Size:** 20 bytes

---

### Window Packets (Extended)

#### UpdateWindow (ID 201)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Updates an open window's contents without closing and reopening it.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | id | int32 LE | 4 | Window ID to update |
| 5 | windowDataOffset | int32 LE | 4 | Offset to JSON window data |
| 9 | inventoryOffset | int32 LE | 4 | Offset to inventory section |
| 13 | extraResourcesOffset | int32 LE | 4 | Offset to extra resources |
| 17+ | (Variable data) | Variable | Variable | Window content |

**Fixed Size:** 17 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### ClientOpenWindow (ID 204)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests to open a window of a specific type.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | type | byte | 1 | WindowType enum value |

**WindowType Values:**
- `0` - Container: Generic storage container
- `1` - PocketCrafting: Inventory crafting grid
- `2` - BasicCrafting: Basic crafting table
- `3` - DiagramCrafting: Recipe-based crafting
- `4` - StructuralCrafting: Building/structure crafting
- `5` - Processing: Furnace/processing UI
- `6` - Memories: Memory/journal interface

**Fixed Size:** 1 byte

---

### Crafting Packets

Crafting packets handle recipe management and crafting operations.

#### CraftItemAction (Window Action)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Request to craft an item using the current crafting interface. Sent as a WindowAction within SendWindowAction packet.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| craftCount | int32 LE | 4 | Number of items to craft |

**Fixed Size:** 4 bytes

#### CraftRecipeAction (Window Action)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Request to craft a specific recipe by ID. Used with recipe book functionality.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| recipeIdOffset | int32 LE | 4 | Offset to recipe ID string |
| craftCount | int32 LE | 4 | Number of times to craft |
| recipeId | VarString | Variable | Recipe identifier string |

**Fixed Size:** 8 bytes (minimum)
**Max Size:** 16,384,012 bytes

#### CancelCraftingAction (Window Action)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Cancels an in-progress crafting operation.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| (no fields) | - | 0 | Empty action |

**Fixed Size:** 0 bytes

#### UpdateRecipes (Asset Packet)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends the full recipe registry to the client during setup phase.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = recipes present |
| 1 | recipes | RecipeData[] | Variable | Array of recipe definitions |

**Max Size:** 1,677,721,600 bytes

#### UpdateKnownRecipes (ID 221)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the client's list of unlocked/known recipes.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = recipes present |
| 1 | recipes | String[] | Variable | Array of known recipe IDs |

**Max Size:** 1,677,721,600 bytes

---

### Mount/NPC Packets

Mount and NPC packets handle riding mechanics and NPC interactions.

#### MountNPC (ID 293)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Attaches the player to an NPC entity (rideable creature, vehicle). Sent when the player successfully mounts an entity.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | anchorX | float LE | 4 | Mount anchor X offset |
| 4 | anchorY | float LE | 4 | Mount anchor Y offset |
| 8 | anchorZ | float LE | 4 | Mount anchor Z offset |
| 12 | entityId | int32 LE | 4 | Entity network ID to mount |

**Fixed Size:** 16 bytes

#### DismountNPC (ID 294)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Detaches the player from the currently mounted entity. Sent when the player dismounts or is forced off a mount.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

#### SyncInteractionChains (ID 290)

**Direction:** Bidirectional
**Compressed:** No
**Description:** Synchronizes multiple interaction chain states. Used for combat actions, item usage, and multi-step interactions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | updates | VarInt + SyncInteractionChain[] | Variable | Array of interaction chain updates |

**SyncInteractionChain Structure:**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| nullBits | byte | 1 | Presence flags for optional fields |
| activeHotbarSlot | int32 LE | 4 | Active hotbar slot index |
| activeUtilitySlot | int32 LE | 4 | Active utility slot index |
| activeToolsSlot | int32 LE | 4 | Active tools slot index |
| initial | byte | 1 | Boolean: is initial chain |
| desync | byte | 1 | Boolean: chain desynchronized |
| overrideRootInteraction | int32 LE | 4 | Override interaction ID (-2147483648 if none) |
| interactionType | byte | 1 | InteractionType: Primary (0), Secondary (1) |
| equipSlot | int32 LE | 4 | Equipment slot involved |
| chainId | int32 LE | 4 | Chain identifier |
| state | byte | 1 | InteractionState: Finished, Running, etc. |
| operationBaseIndex | int32 LE | 4 | Base operation index |
| (variable fields) | ... | Variable | Item IDs, forked chain data, interaction data |

**Fixed Size:** 61 bytes (minimum per SyncInteractionChain)
**Max Size:** 1,677,721,600 bytes

#### CancelInteractionChain (ID 291)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Cancels an in-progress interaction chain. Sent when a player interrupts an action or releases an input.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = forkedId present |
| 1 | chainId | int32 LE | 4 | Interaction chain to cancel |
| 5 | forkedId | ForkedChainId | Variable | Optional forked chain identifier |

**Fixed Size:** 5 bytes (minimum)
**Max Size:** 1,038 bytes

#### PlayInteractionFor (ID 292)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Instructs the client to play an interaction animation for a specific entity. Used for combat feedback and visual effects.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | entityId | int32 LE | 4 | Target entity network ID |
| 5 | chainId | int32 LE | 4 | Interaction chain identifier |
| 9 | operationIndex | int32 LE | 4 | Operation index in chain |
| 13 | interactionId | int32 LE | 4 | Specific interaction ID |
| 17 | interactionType | byte | 1 | InteractionType enum |
| 18 | cancel | byte | 1 | Boolean: cancel the interaction |
| 19 | forkedIdOffset | int32 LE | 4 | Offset to forked chain ID |
| 23 | interactedItemIdOffset | int32 LE | 4 | Offset to item ID string |
| 27+ | (Variable data) | Variable | Variable | Forked ID and item ID data |

**Fixed Size:** 27 bytes (minimum)
**Max Size:** 16,385,065 bytes

---

### Objective/Quest Packets

Objective packets manage quest tracking, task progress, and objective UI updates. These packets enable the server to communicate quest states and progress to clients.

#### TrackOrUpdateObjective (ID 69)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Tracks a new objective or updates an existing one on the client's objective panel. Used when a player accepts a quest, receives objective updates, or needs to display quest progress.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = objective present |
| 1 | objective | Objective | Variable | Objective data (optional) |

**Objective Structure:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | objectiveUuid | UUID | 16 | Unique identifier for this objective |
| 17 | objectiveTitleKeyOffset | int32 LE | 4 | Offset to title localization key |
| 21 | objectiveDescriptionKeyOffset | int32 LE | 4 | Offset to description localization key |
| 25 | objectiveLineIdOffset | int32 LE | 4 | Offset to quest line identifier |
| 29 | tasksOffset | int32 LE | 4 | Offset to tasks array |
| 33+ | objectiveTitleKey | VarString | Variable | Localization key for objective title (optional) |
| - | objectiveDescriptionKey | VarString | Variable | Localization key for description (optional) |
| - | objectiveLineId | VarString | Variable | Quest line identifier (optional) |
| - | tasks | VarInt + ObjectiveTask[] | Variable | Array of objective tasks (optional) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 1,677,721,600 bytes

#### UntrackObjective (ID 70)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Removes an objective from the client's tracking. Used when a quest is completed, abandoned, or should no longer be displayed.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | objectiveUuid | UUID | 16 | UUID of the objective to untrack |

**Fixed Size:** 16 bytes

#### UpdateObjectiveTask (ID 71)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates a specific task within a tracked objective. Used for incremental progress updates without resending the entire objective.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = task present |
| 1 | objectiveUuid | UUID | 16 | UUID of the parent objective |
| 17 | taskIndex | int32 LE | 4 | Index of the task to update (0-based) |
| 21 | task | ObjectiveTask | Variable | Updated task data (optional) |

**ObjectiveTask Structure:**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = taskDescriptionKey present |
| 1 | currentCompletion | int32 LE | 4 | Current progress count |
| 5 | completionNeeded | int32 LE | 4 | Total count required for completion |
| 9 | taskDescriptionKey | VarString | Variable | Localization key for task description (optional) |

**Fixed Size:** 21 bytes (minimum)
**Max Size:** 16,384,035 bytes

---

### NPC Debug Packets

NPC debug packets provide development and debugging tools for NPC behavior and AI.

#### BuilderToolSetNPCDebug (ID 423)

**Direction:** Bidirectional
**Compressed:** No
**Description:** Enables or disables debug visualization for a specific NPC entity. When enabled, displays AI state, pathfinding, behavior trees, and other debug information.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | entityId | int32 LE | 4 | Target NPC entity network ID |
| 4 | enabled | byte | 1 | Boolean: debug visualization enabled |

**Fixed Size:** 5 bytes

---

### Server Access/Permission Packets

Server access packets control player permissions and server accessibility in singleplayer worlds.

#### UpdateServerAccess (ID 251)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Notifies the client of updated server access settings. Used when the host changes LAN/friend access.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | access | byte | 1 | Access enum value |

**Access Values:**
- `0` - Private: No external access
- `1` - LAN: Local network access only
- `2` - Friend: Friends can join
- `3` - Open: Anyone can join

**Fixed Size:** 1 byte

#### SetServerAccess (ID 252)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client request to change server access level (host only).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | access | byte | 1 | Desired Access enum value |

**Fixed Size:** 1 byte

---

### Asset Loading Packets

Asset packets handle the transfer and synchronization of game assets during connection setup.

#### AssetInitialize (ID 21)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Initiates asset transfer, providing metadata about the assets to be sent.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | totalParts | int32 LE | 4 | Total number of asset parts |
| 5 | totalSize | int64 LE | 8 | Total size of all assets in bytes |
| 13 | hashOffset | int32 LE | 4 | Offset to asset hash string |
| 17+ | hash | VarString | Variable | Asset bundle hash for caching |

**Fixed Size:** 17 bytes (minimum)
**Max Size:** 16,384,021 bytes

#### AssetPart (ID 22)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Transfers a chunk of asset data. Large assets are split into multiple parts.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = data present |
| 1 | partIndex | int32 LE | 4 | Index of this part (0-based) |
| 5 | data | byte[] | Variable | Asset data chunk |

**Max Size:** 1,677,721,600 bytes

#### AssetFinalize (ID 24)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Signals completion of asset transfer, allowing client to finalize loading.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

#### RequestAssets (ID 23)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests asset data from the server.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = hash present |
| 1 | hash | VarString | Variable | Client's cached asset hash (for delta updates) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

---

### World Settings Packets

World settings packets configure world parameters during the setup phase.

#### WorldSettings (ID 20)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends world configuration including height and required assets.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = requiredAssets present |
| 1 | worldHeight | int32 LE | 4 | Maximum world height in blocks |
| 5 | requiredAssets | Asset[] | Variable | Array of required asset definitions |

**Fixed Size:** 5 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

#### ServerTags (ID 34)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sends server-defined tags used for gameplay mechanics and filtering.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = tags present |
| 1 | tags | `Map<String, int32>` | Variable | Dictionary of tag names to IDs |

**Max Size:** 1,677,721,600 bytes

---

### Fluid/World Generation Packets

Fluid and world generation packets handle terrain features like water and lava.

#### SetFluids (ID 136)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sets fluid data for a chunk section.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = data present |
| 1 | x | int32 LE | 4 | Chunk X coordinate |
| 5 | y | int32 LE | 4 | Chunk Y coordinate |
| 9 | z | int32 LE | 4 | Chunk Z coordinate |
| 13 | data | byte[] | Variable | Compressed fluid level data (max 4,096,000 bytes) |

**Fixed Size:** 13 bytes (minimum)
**Max Size:** 4,096,018 bytes

---

### Sleep/Time Packets

Sleep packets handle multiplayer sleep mechanics for time progression.

#### UpdateSleepState (ID 157)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the client's sleep state UI and synchronizes sleep progression.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = clock present, bit 1 = multiplayer present |
| 1 | grayFade | byte | 1 | Boolean: enable gray screen fade |
| 2 | sleepUi | byte | 1 | Boolean: show sleep UI |
| 3 | clock | SleepClock | 33 | Sleep clock data (optional) |
| 36 | multiplayer | SleepMultiplayer | Variable | Multiplayer sleep info (optional) |

**SleepClock Structure (33 bytes):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| startGametime | InstantData | 12 | Game time when sleep started (optional) |
| targetGametime | InstantData | 12 | Target wake-up game time (optional) |
| progress | float LE | 4 | Sleep progress (0.0-1.0) |
| durationSeconds | float LE | 4 | Sleep duration in seconds |

**Fixed Size:** 36 bytes (minimum)
**Max Size:** 65,536,050 bytes

---

### Custom UI Packets

Custom UI packets allow servers to create dynamic interfaces.

#### CustomHud (ID 217)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Updates the custom HUD overlay with server-defined UI elements.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = commands present |
| 1 | clear | byte | 1 | Boolean: clear existing HUD elements |
| 2 | commands | CustomUICommand[] | Variable | Array of UI commands |

**Max Size:** 1,677,721,600 bytes

#### CustomPage (ID 218)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Opens or updates a custom UI page/screen.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1 | isInitial | byte | 1 | Boolean: initial page load |
| 2 | clear | byte | 1 | Boolean: clear existing content |
| 3 | lifetime | byte | 1 | CustomPageLifetime enum |
| 4 | keyOffset | int32 LE | 4 | Offset to page key string |
| 8 | commandsOffset | int32 LE | 4 | Offset to commands array |
| 12 | eventBindingsOffset | int32 LE | 4 | Offset to event bindings |
| 16+ | (Variable data) | Variable | Variable | Page content |

**CustomPageLifetime Values:**
- `0` - CantClose: Page cannot be closed by user
- `1` - CanClose: User can close the page
- `2` - AutoClose: Page closes automatically

**Fixed Size:** 16 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### Portal Packets

Portal packets handle dimension/world transitions.

#### UpdatePortal (ID 229)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates portal state and definition for dimension transitions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = state present, bit 1 = definition present |
| 1 | state | PortalState | 5 | Current portal state (optional) |
| 6 | definition | PortalDef | Variable | Portal definition data (optional) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 16,384,020 bytes

---

### Player List Packets

Player list packets manage the server's player list display.

#### UpdateServerPlayerList (ID 226)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the player list shown in the pause/tab menu.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = players present |
| 1 | players | ServerPlayerListUpdate[] | Variable | Array of player updates |

**ServerPlayerListUpdate Structure (32 bytes each):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| uuid | UUID | 16 | Player UUID |
| username | VarString | Variable | Player display name |
| action | byte | 1 | Add, Remove, or Update |

**Max Size:** 131,072,006 bytes

---

### Creative Mode Packets

Creative mode packets handle creative inventory operations.

#### SetCreativeItem (ID 171)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Sets an item in creative mode inventory, allowing spawning any item.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | inventorySectionId | int32 LE | 4 | Target inventory section |
| 4 | slotId | int32 LE | 4 | Target slot index |
| 8 | override | byte | 1 | Boolean: override existing item |
| 9 | item | ItemQuantity | Variable | Item data to set |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 16,384,019 bytes

#### SmartMoveItemStack (ID 176)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Smart item movement that automatically finds the best destination slot.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | fromSectionId | int32 LE | 4 | Source section ID |
| 4 | fromSlotId | int32 LE | 4 | Source slot index |
| 8 | quantity | int32 LE | 4 | Number of items to move |
| 12 | moveType | byte | 1 | SmartMoveType enum value |

**SmartMoveType Values:**
- `0` - EquipOrMergeStack: Equip item or merge with existing stack

**Fixed Size:** 13 bytes

#### DropCreativeItem (ID 172)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Drops an item from creative mode inventory into the world. Unlike DropItemStack which references an existing inventory slot, this packet allows dropping any item directly.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | item | ItemQuantity | Variable | Item data to drop into the world |

**Fixed Size:** Variable (depends on ItemQuantity)
**Max Size:** 16,384,010 bytes

#### SmartGiveCreativeItem (ID 173)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Smart item give in creative mode that automatically finds the best inventory slot for the item, either equipping it or merging with an existing stack.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | moveType | byte | 1 | SmartMoveType enum value |
| 1 | item | ItemQuantity | Variable | Item data to give |

**SmartMoveType Values:**
- `0` - EquipOrMergeStack: Equip item or merge with existing stack

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,011 bytes

#### SwitchHotbarBlockSet (ID 178)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Switches the current hotbar block set based on an item type. Used in creative mode to switch between different block palettes or categories for quick access.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = itemId present |
| 1 | itemId | VarString | Variable | Item type ID to switch to (optional, max 4,096,000 chars) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

---

### Combat Packets

Combat packets handle damage dealing, hit detection, knockback, projectiles, and death/respawn mechanics. These packets work together to provide responsive combat feedback.

#### DamageCause Structure

The `DamageCause` structure provides details about what caused damage to an entity.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = id present, bit 1 = damageTextColor present |
| 1 | idOffset | int32 LE | 4 | Offset to damage cause ID string |
| 5 | damageTextColorOffset | int32 LE | 4 | Offset to text color string |
| 9+ | id | VarString | Variable | Damage cause identifier (e.g., "fall", "fire", "attack") |
| - | damageTextColor | VarString | Variable | Hex color for damage text display |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 32,768,019 bytes

---

#### UpdateHitboxCollisionConfig (ID 74)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Synchronizes hitbox collision configuration data used for combat hit detection. Defines how entities collide and interact during combat.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = configs present |
| 1 | type | byte | 1 | UpdateType enum: Init, Update, or Delta |
| 2 | maxId | int32 LE | 4 | Maximum configuration ID |
| 6 | hitboxCollisionConfigs | `Map<int32, HitboxCollisionConfig>` | Variable | Configuration dictionary (optional) |

**HitboxCollisionConfig Structure (5 bytes):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| collisionType | byte | 1 | CollisionType enum value |
| softCollisionOffsetRatio | float LE | 4 | Soft collision offset multiplier |

**CollisionType Values:**
- `0` - Hard: Solid collision, prevents overlap
- `1` - Soft: Allows partial overlap with pushback
- `2` - None: No collision response

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 36,864,011 bytes

---

#### UpdateProjectileConfigs (ID 85)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Synchronizes projectile configuration data for ranged combat. Defines physics, visuals, and interaction behavior for arrows, thrown items, and magic projectiles.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = configs present, bit 1 = removedConfigs present |
| 1 | type | byte | 1 | UpdateType enum: Init, Update, or Delta |
| 2 | configsOffset | int32 LE | 4 | Offset to configs dictionary |
| 6 | removedConfigsOffset | int32 LE | 4 | Offset to removed configs array |
| 10+ | configs | `Map<String, ProjectileConfig>` | Variable | Projectile configurations (optional) |
| - | removedConfigs | String[] | Variable | IDs of removed configs (optional) |

**ProjectileConfig Structure (171+ bytes):**

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | physicsConfig | PhysicsConfig | 122 | Physics parameters (optional) |
| 123 | launchForce | double LE | 8 | Initial launch velocity multiplier |
| 131 | spawnOffset | Vector3f | 12 | Spawn position offset from entity (optional) |
| 143 | rotationOffset | Direction | 12 | Initial rotation offset (optional) |
| 155 | launchLocalSoundEventIndex | int32 LE | 4 | Sound event for launch |
| 159 | projectileSoundEventIndex | int32 LE | 4 | Sound event during flight |
| 163 | modelOffset | int32 LE | 4 | Offset to model data |
| 167 | interactionsOffset | int32 LE | 4 | Offset to interactions map |
| 171+ | model | Model | Variable | Visual model data (optional) |
| - | interactions | `Map<InteractionType, int32>` | Variable | Interaction handlers (optional) |

**InteractionType Values:**
- `0` - OnHitEntity: Triggered when hitting an entity
- `1` - OnHitBlock: Triggered when hitting a block
- `2` - OnExpire: Triggered when projectile lifetime ends

**Fixed Size:** 10 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### Hotbar Management Packets

Hotbar management packets handle saving and loading of hotbar configurations for quick access presets.

#### LoadHotbar (ID 106)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Requests to load a saved hotbar configuration from a specific inventory row. Used to quickly restore a previously saved hotbar setup.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | inventoryRow | byte | 1 | Inventory row index to load hotbar from |

**Fixed Size:** 1 byte

#### SaveHotbar (ID 107)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Saves the current hotbar configuration to a specific inventory row for later retrieval. Allows players to store multiple hotbar setups.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | inventoryRow | byte | 1 | Inventory row index to save hotbar to |

**Fixed Size:** 1 byte

---

### Effect/Status Packets

Effect packets manage entity status effects and buffs/debuffs.

#### UpdateEntityEffects (Asset Packet)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends the effect definition registry during setup.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = effects present |
| 1 | effects | EffectData[] | Variable | Array of effect definitions |

**Max Size:** 1,677,721,600 bytes

---

## Server Administration

This section documents server administration, player moderation, and permissions management. Unlike most gameplay features, Hytale's administration system is primarily **command-based** rather than packet-based. Administrative actions are executed through console commands or chat commands, which then use existing network packets for enforcement.

### Architecture Overview

```
+-------------------+     +-------------------+     +-------------------+
| Console/Chat      | --> | Command Handler   | --> | Network Packets   |
| Commands          |     | (Server-side)     |     | (Enforcement)     |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
   /kick player             KickCommand.java           Disconnect (ID 1)
   /ban player              BanCommand.java            Disconnect (ID 1)
   /op add player           OpAddCommand.java          (Permission change)
   /whitelist add           WhitelistAddCommand.java   (Access check)
```

### Console System

The server console provides direct administrative access without authentication. Console commands are processed by `ConsoleModule` (`com.hypixel.hytale.server.core.console.ConsoleModule`).

**Key Characteristics:**
- Console sender (`ConsoleSender`) has **all permissions** by default
- Uses JLine library for terminal handling
- Supports both dumb and color terminals
- Commands can be prefixed with `/` but it's optional

**Source:** `com/hypixel/hytale/server/core/console/ConsoleModule.java`

```java
// Console sender always returns true for permission checks
@Override
public boolean hasPermission(@Nonnull String id) {
    return true;
}
```

### Player Moderation Commands

#### Kick Command

**Command:** `/kick <player>`
**Permission:** `hytale.command.kick`
**Description:** Immediately disconnects a player from the server.

**Implementation:** Uses the `Disconnect` packet (ID 1) with reason "You were kicked."

| Field | Value |
|-------|-------|
| reason | "You were kicked." |
| type | DisconnectType.Disconnect (0) |

**Source:** `com/hypixel/hytale/server/core/command/commands/server/KickCommand.java`

#### Ban Command

**Command:** `/ban <username> [reason]`
**Permission:** `hytale.command.ban`
**Availability:** Multiplayer only (unavailable in singleplayer)
**Description:** Permanently bans a player from the server.

**Ban Types:**

| Type | Class | Description |
|------|-------|-------------|
| `infinite` | `InfiniteBan` | Permanent ban with no expiration |
| `timed` | `TimedBan` | Temporary ban with expiration timestamp |

**Ban Data Structure (JSON):**

```json
{
  "type": "infinite",
  "target": "player-uuid",
  "by": "admin-uuid",
  "timestamp": 1234567890000,
  "reason": "Violation of server rules"
}
```

**TimedBan Additional Field:**

```json
{
  "expiresOn": 1234567890000
}
```

**Disconnect Message Format:**
- Infinite: `"You are permanently banned! Reason: <reason>"`
- Timed: `"You are temporarily banned for <duration>! Reason: <reason>"`

**Source:** `com/hypixel/hytale/server/core/modules/accesscontrol/commands/BanCommand.java`

#### Unban Command

**Command:** `/unban <username>`
**Permission:** `hytale.command.unban`
**Availability:** Multiplayer only
**Description:** Removes a ban from a player.

**Source:** `com/hypixel/hytale/server/core/modules/accesscontrol/commands/UnbanCommand.java`

### Whitelist Commands

The whitelist system controls server access before authentication.

**Command:** `/whitelist <subcommand>`
**Permission:** `hytale.command.whitelist.*`

| Subcommand | Description |
|------------|-------------|
| `add <username>` | Add player to whitelist |
| `remove <username>` | Remove player from whitelist |
| `enable` | Enable whitelist enforcement |
| `disable` | Disable whitelist enforcement |
| `status` | Show whitelist status |
| `list` | List whitelisted players |
| `clear` | Remove all players from whitelist |

**Access Check Flow:**

```
Player Connect --> AccessControlModule --> WhitelistProvider --> Allow/Deny
                                      --> BanProvider --------> Allow/Deny
```

**Source:** `com/hypixel/hytale/server/core/modules/accesscontrol/AccessControlModule.java`

### Permissions System

Hytale implements a hierarchical permission system with support for wildcards and negation.

#### Permission Format

| Pattern | Description |
|---------|-------------|
| `hytale.command.kick` | Specific permission |
| `hytale.command.*` | Wildcard (all command permissions) |
| `*` | All permissions |
| `-hytale.command.ban` | Negated permission (explicitly denied) |
| `-*` | Deny all permissions |

#### Default Permission Nodes

| Permission | Description |
|------------|-------------|
| `hytale.command` | Base permission for all commands |
| `hytale.command.<name>` | Permission for specific command |
| `hytale.editor.asset` | Asset editor access |
| `hytale.editor.builderTools` | Builder tools access |
| `hytale.editor.brush.use` | Brush tool usage |
| `hytale.editor.brush.config` | Brush configuration |
| `hytale.editor.prefab.use` | Prefab placement |
| `hytale.editor.prefab.manage` | Prefab management |
| `hytale.editor.selection.use` | Selection tool usage |
| `hytale.editor.selection.clipboard` | Clipboard operations |
| `hytale.editor.selection.modify` | Selection modification |
| `hytale.editor.history` | Undo/redo history |
| `hytale.camera.flycam` | Fly camera mode |

**Source:** `com/hypixel/hytale/server/core/permissions/HytalePermissions.java`

#### Operator Commands

**Command:** `/op <subcommand>`
**Description:** Manages operator (admin) status for players.

| Subcommand | Permission | Description |
|------------|------------|-------------|
| `self` | (console only) | Grant OP to command sender |
| `add <player>` | `hytale.command.op.add` | Grant OP status to player |
| `remove <player>` | `hytale.command.op.remove` | Revoke OP status from player |

**OP Group:** Players granted OP status are added to the `"OP"` permission group.

**Source:** `com/hypixel/hytale/server/core/permissions/commands/op/OpCommand.java`

#### Permission Management Commands

**Command:** `/perm <subcommand>`
**Description:** Direct permission manipulation.

**User Subcommands:**

| Command | Description |
|---------|-------------|
| `/perm user list <uuid>` | List user's permissions |
| `/perm user add <uuid> <permissions...>` | Add permissions to user |
| `/perm user remove <uuid> <permissions...>` | Remove permissions from user |
| `/perm user group list <uuid>` | List user's groups |
| `/perm user group add <uuid> <group>` | Add user to group |
| `/perm user group remove <uuid> <group>` | Remove user from group |

**Group Subcommands:**

| Command | Description |
|---------|-------------|
| `/perm group list <group>` | List group's permissions |
| `/perm group add <group> <permissions...>` | Add permissions to group |
| `/perm group remove <group> <permissions...>` | Remove permissions from group |

**Source:** `com/hypixel/hytale/server/core/permissions/commands/PermCommand.java`

### Server Access Control (Singleplayer)

For singleplayer worlds opened to LAN or friends, access is controlled via the `ServerAccess` packets.

#### UpdateServerAccess (ID 251)

**Direction:** Server -> Client
**Description:** Notifies clients of server access level changes.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | access | byte | 1 | Access enum value |

**Access Values:**

| Value | Name | Description |
|-------|------|-------------|
| 0 | Private | No external access (singleplayer only) |
| 1 | LAN | Local network players can join |
| 2 | Friend | Friends can join via invite |
| 3 | Open | Anyone can join |

**Fixed Size:** 1 byte

#### SetServerAccess (ID 252)

**Direction:** Client -> Server
**Description:** Host requests to change server access level.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | access | byte | 1 | Desired Access enum value |

**Fixed Size:** 1 byte

### Broadcast Command

**Command:** `/say <message>` or `/broadcast <message>`
**Permission:** `hytale.command.say`
**Description:** Sends a message to all players on the server.

**Message Format:** Uses `ServerMessage` packet (ID 210) with cyan color styling.

**Source:** `com/hypixel/hytale/server/core/console/command/SayCommand.java`

### World Configuration Commands

**Command:** `/world config <subcommand>`
**Description:** Manages world-specific settings.

| Subcommand | Description |
|------------|-------------|
| `pausetime` | Toggle time progression |
| `seed` | Display world seed |
| `setpvp <enabled>` | Enable/disable PvP |
| `setspawn` | Set world spawn point |

**Source:** `com/hypixel/hytale/server/core/universe/world/commands/worldconfig/WorldConfigCommand.java`

### Access Control Module

The `AccessControlModule` manages both bans and whitelist through a provider system.

**Provider Registry:**
1. `HytaleWhitelistProvider` - Manages whitelist entries
2. `HytaleBanProvider` - Manages ban entries

**Connection Check Flow:**

```
PlayerSetupConnectEvent
    |
    v
AccessControlModule.getDisconnectReason(uuid)
    |
    +---> WhitelistProvider.getDisconnectReason(uuid)
    |         |
    |         +---> If whitelist enabled and player not whitelisted:
    |                   Return "You are not whitelisted!"
    |
    +---> BanProvider.getDisconnectReason(uuid)
              |
              +---> If player banned and ban in effect:
                        Return ban message
    |
    v
If any reason returned: Cancel connection, send Disconnect packet
```

**Source:** `com/hypixel/hytale/server/core/modules/accesscontrol/AccessControlModule.java`

### Related Network Packets

| Packet | ID | Usage in Administration |
|--------|-----|------------------------|
| Disconnect | 1 | Enforces kick/ban by terminating connection |
| ServerMessage | 210 | Broadcasts admin messages to players |
| UpdateServerAccess | 251 | Notifies access level changes |
| SetServerAccess | 252 | Requests access level changes |
| UpdateServerPlayerList | 226 | Updates player list after kick/ban |

### RCON (Remote Console)

As of the analyzed version, Hytale does not implement a traditional RCON protocol. Server administration is performed through:

1. **Local Console** - Direct terminal access to the server process
2. **In-game Commands** - Chat commands with appropriate permissions
3. **Plugin API** - Programmatic access for server plugins

**Note:** Future versions may implement RCON or similar remote administration protocols.

---

## Administration Source Files Reference

| Component | Source File |
|-----------|-------------|
| Console Module | `com/hypixel/hytale/server/core/console/ConsoleModule.java` |
| Console Sender | `com/hypixel/hytale/server/core/console/ConsoleSender.java` |
| Access Control | `com/hypixel/hytale/server/core/modules/accesscontrol/AccessControlModule.java` |
| Ban Provider | `com/hypixel/hytale/server/core/modules/accesscontrol/provider/HytaleBanProvider.java` |
| Whitelist Provider | `com/hypixel/hytale/server/core/modules/accesscontrol/provider/HytaleWhitelistProvider.java` |
| Ban Command | `com/hypixel/hytale/server/core/modules/accesscontrol/commands/BanCommand.java` |
| Unban Command | `com/hypixel/hytale/server/core/modules/accesscontrol/commands/UnbanCommand.java` |
| Kick Command | `com/hypixel/hytale/server/core/command/commands/server/KickCommand.java` |
| Whitelist Commands | `com/hypixel/hytale/server/core/modules/accesscontrol/commands/WhitelistCommand.java` |
| Permissions Module | `com/hypixel/hytale/server/core/permissions/PermissionsModule.java` |
| Permission Constants | `com/hypixel/hytale/server/core/permissions/HytalePermissions.java` |
| OP Commands | `com/hypixel/hytale/server/core/permissions/commands/op/OpCommand.java` |
| Permission Commands | `com/hypixel/hytale/server/core/permissions/commands/PermCommand.java` |
| Say Command | `com/hypixel/hytale/server/core/console/command/SayCommand.java` |
| World Config | `com/hypixel/hytale/server/core/universe/world/commands/worldconfig/WorldConfigCommand.java` |

---

## Additional World Packets

This section documents world-related packets for terrain, biomes, and environment management.

### SetChunkHeightmap (ID 132)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends heightmap data for a chunk column. Used for rendering optimization, occlusion culling, and shadow calculation.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = heightmap present |
| 1 | x | int32 LE | 4 | Chunk column X coordinate |
| 5 | z | int32 LE | 4 | Chunk column Z coordinate |
| 9 | heightmap | VarInt + byte[] | Variable | Heightmap data (max 4,096,000 bytes) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 4,096,014 bytes

---

### SetChunkTintmap (ID 133)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends tintmap data for biome-based color tinting of grass, leaves, and water within a chunk column.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = tintmap present |
| 1 | x | int32 LE | 4 | Chunk column X coordinate |
| 5 | z | int32 LE | 4 | Chunk column Z coordinate |
| 9 | tintmap | VarInt + byte[] | Variable | Tint color data (max 4,096,000 bytes) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 4,096,014 bytes

---

### SetChunkEnvironments (ID 134)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends environment zone data for a chunk column. Defines which environment (biome/zone) applies to each area, affecting ambient sounds, music, and weather transitions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = environments present |
| 1 | x | int32 LE | 4 | Chunk column X coordinate |
| 5 | z | int32 LE | 4 | Chunk column Z coordinate |
| 9 | environments | VarInt + byte[] | Variable | Environment zone indices (max 4,096,000 bytes) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 4,096,014 bytes

---

### ServerSetFluid (ID 142)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates a single fluid block at a specific position. Used for water/lava flow updates, bucket interactions, and fluid physics.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | x | int32 LE | 4 | Block X coordinate |
| 4 | y | int32 LE | 4 | Block Y coordinate |
| 8 | z | int32 LE | 4 | Block Z coordinate |
| 12 | fluidId | int32 LE | 4 | Fluid type ID (0 = none, 1 = water, 2 = lava, etc.) |
| 16 | fluidLevel | byte | 1 | Fluid level (0-15, 0 = empty, 15 = source) |

**Fixed Size:** 17 bytes

---

### ServerSetFluids (ID 143)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Batch update for multiple fluid blocks within a chunk. More efficient than multiple ServerSetFluid packets.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | x | int32 LE | 4 | Chunk X coordinate |
| 4 | y | int32 LE | 4 | Chunk Y coordinate |
| 8 | z | int32 LE | 4 | Chunk Z coordinate |
| 12 | cmds | VarInt + SetFluidCmd[] | Variable | Array of fluid update commands |

**SetFluidCmd Structure (7 bytes each):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| index | int16 LE | 2 | Block index within chunk (0-4095) |
| fluidId | int32 LE | 4 | Fluid type ID |
| fluidLevel | byte | 1 | Fluid level (0-15) |

**Fixed Size:** 12 bytes (minimum)
**Max Size:** 28,672,017 bytes

---

### UpdateTimeSettings (ID 145)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the world's time configuration including day/night cycle durations and moon phases.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | daytimeDurationSeconds | int32 LE | 4 | Length of daytime in seconds |
| 4 | nighttimeDurationSeconds | int32 LE | 4 | Length of nighttime in seconds |
| 8 | totalMoonPhases | byte | 1 | Number of moon phases in the cycle |
| 9 | timePaused | byte | 1 | Boolean: time progression paused |

**Fixed Size:** 10 bytes

---

### UpdateEditorTimeOverride (ID 147)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Forces a specific time in editor mode, bypassing normal time progression. Used for testing lighting and time-sensitive content.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = gameTime present |
| 1 | gameTime | InstantData | 12 | Target game time (optional) |
| 13 | paused | byte | 1 | Boolean: time progression paused |

**Fixed Size:** 14 bytes

---

### ClearEditorTimeOverride (ID 148)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Clears any editor time override, resuming normal time progression.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

---

### ServerSetPaused (ID 159)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Authoritative pause state from server. Unlike the bidirectional SetPaused (ID 158), this is a server-only notification of pause state changes.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | paused | byte | 1 | Boolean: game paused state |

**Fixed Size:** 1 byte

---

### UpdateSunSettings (ID 360)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates sun position and angle for custom lighting scenarios, cinematics, or zone-specific lighting.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | heightPercentage | float LE | 4 | Sun height (0.0 = horizon, 1.0 = zenith) |
| 4 | angleRadians | float LE | 4 | Sun rotation angle in radians |

**Fixed Size:** 8 bytes

---

## Additional Player Packets

This section documents player-related packets for stats, abilities, and state management.

### SetClientId (ID 100)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Assigns a unique client identifier to the player. Sent during connection setup.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | clientId | int32 LE | 4 | Unique client session identifier |

**Fixed Size:** 4 bytes

---

### SetMovementStates (ID 102)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sets the player's movement state flags, used for server-authoritative movement correction.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = movementStates present |
| 1 | movementStates | SavedMovementStates | 1 | Saved movement flags (optional) |

**Fixed Size:** 2 bytes

---

### SetBlockPlacementOverride (ID 103)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Enables or disables block placement override mode, allowing placement in normally restricted areas (editor/creative mode feature).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | enabled | byte | 1 | Boolean: override enabled |

**Fixed Size:** 1 byte

---

### UpdateMovementSettings (ID 110)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the player's movement parameters including speed, jump height, and physics settings.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = movementSettings present |
| 1 | movementSettings | MovementSettings | 251 | Full movement configuration (optional) |

**Fixed Size:** 252 bytes

---

### DamageInfo (ID 112)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Notifies the client of damage received, including source position and cause for directional indicators and death screens.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = position present, bit 1 = cause present |
| 1 | damageSourcePosition | Vector3d | 24 | World position of damage source (optional) |
| 25 | damageAmount | float LE | 4 | Amount of damage dealt |
| 29 | damageCause | DamageCause | Variable | Damage cause details (optional) |

**Fixed Size:** 29 bytes (minimum)
**Max Size:** 32,768,048 bytes

---

### ReticleEvent (ID 113)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Triggers a reticle/crosshair animation event such as hit confirmation or invalid action feedback.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | eventIndex | int32 LE | 4 | Reticle event ID from asset registry |

**Fixed Size:** 4 bytes

---

### DisplayDebug (ID 114)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Renders a debug visualization shape in the world. Used for development, debugging collision, and pathfinding.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags for optional fields |
| 1 | shape | byte | 1 | DebugShape enum: Sphere, Box, Line, etc. |
| 2 | color | Vector3f | 12 | RGB color (optional) |
| 14 | time | float LE | 4 | Display duration in seconds |
| 18 | fade | byte | 1 | Boolean: fade out animation |
| 19 | matrixOffset | int32 LE | 4 | Offset to transformation matrix |
| 23 | frustumProjectionOffset | int32 LE | 4 | Offset to frustum projection |
| 27+ | matrix | VarInt + float[] | Variable | 4x4 transformation matrix (optional) |
| - | frustumProjection | VarInt + float[] | Variable | Frustum projection matrix (optional) |

**Fixed Size:** 27 bytes (minimum)
**Max Size:** 32,768,037 bytes

---

### ClearDebugShapes (ID 115)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Clears all debug visualization shapes from the client.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

---

### UpdateMemoriesFeatureStatus (ID 118)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the unlock status of the memories/journal feature for the player.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | isFeatureUnlocked | byte | 1 | Boolean: memories feature unlocked |

**Fixed Size:** 1 byte

---

## Additional Setup Packets

This section documents packets used during the connection setup and initialization phase.

### WorldLoadProgress (ID 21)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Reports world loading progress to the client for display in the loading screen.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = status present |
| 1 | percentComplete | int32 LE | 4 | Overall loading progress (0-100) |
| 5 | percentCompleteSubitem | int32 LE | 4 | Current task progress (0-100) |
| 9 | status | VarString | Variable | Status message to display (optional) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 16,384,014 bytes

---

### WorldLoadFinished (ID 22)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Signals that world loading is complete and the client can dismiss the loading screen.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

---

### RemoveAssets (ID 27)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Instructs the client to remove specific assets from memory. Used for dynamic content management.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = asset array present |
| 1 | asset | VarInt + Asset[] | Variable | Array of assets to remove (optional) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 1,677,721,600 bytes

---

### RequestCommonAssetsRebuild (ID 28)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Requests the server to rebuild and resend common asset data. Used when client detects asset corruption or version mismatch.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

---

### SetUpdateRate (ID 29)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sets the client's expected update rate for entity and world synchronization.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | updatesPerSecond | int32 LE | 4 | Target updates per second (tick rate) |

**Fixed Size:** 4 bytes

---

### SetTimeDilation (ID 30)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sets the time dilation factor for slow-motion or fast-forward effects.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | timeDilation | float LE | 4 | Time scale multiplier (1.0 = normal, 0.5 = half speed, 2.0 = double speed) |

**Fixed Size:** 4 bytes

---

### UpdateFeatures (ID 31)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the enabled/disabled status of client-side gameplay features.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = features map present |
| 1 | features | VarInt + Map | Variable | Dictionary of feature flags (optional) |

**ClientFeature Values:**
- `0` - SplitVelocity: Split velocity mechanics
- `1` - Mantling: Ledge grab/mantle ability
- `2` - SprintForce: Sprint force mechanics
- `3` - CrouchSlide: Crouch sliding ability
- `4` - SafetyRoll: Fall damage roll
- `5` - DisplayHealthBars: Show entity health bars
- `6` - DisplayCombatText: Show damage numbers

**Fixed Size:** 1 byte (minimum)
**Max Size:** 8,192,006 bytes

---

### PlayerOptions (ID 33)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Sends player customization options including skin data to the server.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = skin present |
| 1 | skin | PlayerSkin | Variable | Player skin data (optional) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 327,680,184 bytes

---

## Additional UI/Interface Packets

This section documents additional UI and interface packets for HUD management, page navigation, player lists, and system notifications.

### SetPage (ID 216)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sets the active UI page/screen on the client. Used to open inventory, map, crafting interfaces, and other full-screen UI pages.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | page | byte | 1 | Page enum value |
| 1 | canCloseThroughInteraction | byte | 1 | Boolean: player can close via ESC or clicking away |

**Page Values:**
- `0` - None: Close any open page
- `1` - Bench: Workbench/crafting interface
- `2` - Inventory: Player inventory screen
- `3` - ToolsSettings: Tools configuration menu
- `4` - Map: World map view
- `5` - MachinimaEditor: Cinematic editor interface
- `6` - ContentCreation: Content creation tools
- `7` - Custom: Server-defined custom page

**Fixed Size:** 2 bytes

---

### ServerInfo (ID 223)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Sends server information to the client including server name, message of the day, and player capacity. Used for server browser and connection UI.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = serverName present, bit 1 = motd present |
| 1 | maxPlayers | int32 LE | 4 | Maximum player capacity |
| 5 | serverNameOffset | int32 LE | 4 | Offset to server name string |
| 9 | motdOffset | int32 LE | 4 | Offset to MOTD string |
| 13+ | serverName | VarString | Variable | Server display name (optional) |
| - | motd | VarString | Variable | Message of the day (optional) |

**Fixed Size:** 13 bytes (minimum)
**Max Size:** 32,768,023 bytes

---

### AddToServerPlayerList (ID 224)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Adds one or more players to the player list display. Used when players join the server or become visible.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = players array present |
| 1 | players | VarInt + ServerPlayerListPlayer[] | Variable | Array of player entries to add |

**ServerPlayerListPlayer Structure (37+ bytes):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| nullBits | byte | 1 | Bit 0 = username present, bit 1 = worldUuid present |
| uuid | UUID | 16 | Player's unique identifier |
| worldUuid | UUID | 16 | World the player is in (optional) |
| ping | int32 LE | 4 | Player's latency in milliseconds |
| username | VarString | Variable | Player's display name (optional) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 1,677,721,600 bytes

---

### RemoveFromServerPlayerList (ID 225)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Removes one or more players from the player list display. Used when players disconnect or become hidden.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = players array present |
| 1 | players | VarInt + UUID[] | Variable | Array of player UUIDs to remove |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 65,536,006 bytes

---

### UpdateServerPlayerListPing (ID 227)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the ping/latency values for players in the player list. Sent periodically to keep ping displays current.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = players map present |
| 1 | players | `VarInt + Map<UUID, int32>` | Variable | Dictionary of player UUID to ping value |

**Map Entry (20 bytes each):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| key | UUID | 16 | Player UUID |
| value | int32 LE | 4 | Ping in milliseconds |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 81,920,006 bytes

---

### UpdateVisibleHudComponents (ID 230)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Controls which HUD components are visible to the player. Used for custom game modes, cutscenes, and UI customization.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = visibleComponents present |
| 1 | visibleComponents | VarInt + HudComponent[] | Variable | Array of visible HUD components |

**HudComponent Values:**
- `0` - Hotbar: Item hotbar at bottom of screen
- `1` - StatusIcons: Status effect icons
- `2` - Reticle: Crosshair/aiming reticle
- `3` - Chat: Chat message display
- `4` - Requests: Pending request notifications
- `5` - Notifications: Popup notifications
- `6` - KillFeed: Combat kill feed
- `7` - InputBindings: Control hints
- `8` - PlayerList: Tab player list
- `9` - EventTitle: Event title overlay
- `10` - Compass: Navigation compass
- `11` - ObjectivePanel: Quest/objective tracker
- `12` - PortalPanel: Portal status display
- `13` - BuilderToolsLegend: Builder mode controls
- `14` - Speedometer: Speed indicator
- `15` - UtilitySlotSelector: Utility item selector
- `16` - BlockVariantSelector: Block variant picker
- `17` - BuilderToolsMaterialSlotSelector: Material slot selector
- `18` - Stamina: Stamina bar
- `19` - AmmoIndicator: Ammunition counter
- `20` - Health: Health bar
- `21` - Mana: Mana bar
- `22` - Oxygen: Oxygen/breath bar
- `23` - Sleep: Sleep progress indicator

**Fixed Size:** 1 byte (minimum)
**Max Size:** 4,096,006 bytes

---

### ResetUserInterfaceState (ID 231)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Resets the client's UI state to defaults. Used when joining a world, changing game modes, or recovering from UI errors.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| (no fields) | - | 0 | Empty packet |

**Fixed Size:** 0 bytes

---

### WorldSavingStatus (ID 233)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Notifies the client that the world is being saved. Used to display a saving indicator and potentially prevent disconnection during save operations.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | isWorldSaving | byte | 1 | Boolean: world save in progress |

**Fixed Size:** 1 byte

---

### OpenChatWithCommand (ID 234)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Opens the chat input with a pre-filled command. Used for command suggestions, NPC interactions that trigger commands, and quick-action buttons.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = command present |
| 1 | command | VarString | Variable | Pre-filled command text (optional) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

---

## Extended Window Action Types

This section documents additional window action types used with the SendWindowAction packet (ID 203).

### SelectSlotAction

**Description:** Selects a specific slot in a window interface. Used for crafting table slot selection, recipe selection, and UI navigation.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| slot | int32 LE | 4 | Index of the slot to select |

**Fixed Size:** 4 bytes

---

### SortItemsAction

**Description:** Sorts items in an inventory window by the specified criteria.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| sortType | byte | 1 | SortType enum value |

**SortType Values:**
- `0` - Name: Sort alphabetically by item name
- `1` - Type: Sort by item category/type
- `2` - Quality: Sort by item quality/rarity

**Fixed Size:** 1 byte

---

### SetActiveAction

**Description:** Sets the active/enabled state of a window element. Used for toggle switches and activation controls.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| state | byte | 1 | Boolean: element active state |

**Fixed Size:** 1 byte

---

### UpdateCategoryAction

**Description:** Updates the selected category in a categorized window like the creative inventory or recipe browser.

| Field | Type | Size | Description |
|-------|------|------|-------------|
| categoryOffset | int32 LE | 4 | Offset to category string |
| itemCategoryOffset | int32 LE | 4 | Offset to item category string |
| category | VarString | Variable | Main category identifier |
| itemCategory | VarString | Variable | Sub-category identifier |

**Fixed Size:** 8 bytes (minimum)
**Max Size:** 32,768,018 bytes

---

## CustomPageEvent Extended Documentation

The CustomPageEvent packet (ID 219) supports bidirectional communication for server-defined UI pages.

### CustomPageEventType Values

| Value | Name | Description |
|-------|------|-------------|
| `0` | Acknowledge | Confirms receipt of CustomPage packet |
| `1` | Data | Sends user input data back to server |
| `2` | Dismiss | User closed the custom page |

### Usage Flow

```
Server                                  Client
   |                                       |
   |  ------ CustomPage (ID 218) --------> |  Open custom UI page
   |                                       |
   |  <---- CustomPageEvent (Ack) -------- |  Page loaded confirmation
   |                                       |
   |           (User interacts)            |
   |                                       |
   |  <---- CustomPageEvent (Data) ------- |  Send form/button data
   |                                       |
   |  ------ CustomPage (update) --------> |  Update page content
   |                                       |
   |  <---- CustomPageEvent (Dismiss) ---- |  User closed page
   |                                       |
```

---

## Asset Synchronization Packets

Asset synchronization packets transfer game asset definitions from the server to the client during connection setup and runtime updates. These packets enable servers to customize game content dynamically, supporting modded servers and content packs.

### Common Structure

All asset update packets share a common pattern:

| Field | Type | Description |
|-------|------|-------------|
| `type` | UpdateType | Init (0), Update (1), or Delta (2) |
| `maxId` | int32 | Maximum ID in the registry (for indexed assets) |
| `[assets]` | Map/Array | Asset definitions (optional) |
| `[removedAssets]` | String[] | IDs of assets to remove (optional) |

**UpdateType Values:**
- `0` - Init: Full registry initialization during setup
- `1` - Update: Replace existing entries
- `2` - Delta: Incremental changes only

---

### UpdateBlockTypes (ID 40)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends block type definitions including visual properties, physics characteristics, and model references. Used during setup and when block definitions change.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = blockTypes present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum block type ID |
| 6 | updateBlockTextures | byte | 1 | Boolean: reload block textures |
| 7 | updateModelTextures | byte | 1 | Boolean: reload model textures |
| 8 | updateModels | byte | 1 | Boolean: reload 3D models |
| 9 | updateMapGeometry | byte | 1 | Boolean: rebuild map geometry |
| 10+ | blockTypes | `Map<int32, BlockType>` | Variable | Block type definitions (optional) |

**Fixed Size:** 10 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateBlockHitboxes (ID 41)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends block hitbox/collision shape definitions. Maps block type IDs to arrays of hitboxes that define the block's collision geometry. Used for player collision, raycasting, and entity physics.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = blockBaseHitboxes present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum block type ID in registry |
| 6+ | blockBaseHitboxes | `Map<int32, Hitbox[]>` | Variable | Dictionary of block ID to hitbox array (optional) |

**Hitbox Structure (24 bytes each):**

| Field | Type | Size | Description |
|-------|------|------|-------------|
| minX | float LE | 4 | Minimum X coordinate (0.0-1.0) |
| minY | float LE | 4 | Minimum Y coordinate (0.0-1.0) |
| minZ | float LE | 4 | Minimum Z coordinate (0.0-1.0) |
| maxX | float LE | 4 | Maximum X coordinate (0.0-1.0) |
| maxY | float LE | 4 | Maximum Y coordinate (0.0-1.0) |
| maxZ | float LE | 4 | Maximum Z coordinate (0.0-1.0) |

**Notes:**
- Hitbox coordinates are relative to the block position (0.0-1.0 range)
- A full block has a single hitbox: (0,0,0) to (1,1,1)
- Stairs, slabs, and custom shapes have multiple hitboxes
- Maximum 64 hitboxes per block type

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateBlockParticleSets (ID 44)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends block particle effect configurations. Defines the particles emitted when blocks are broken, walked on, or interacted with. Each block type can reference a particle set by name.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = blockParticleSets present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2+ | blockParticleSets | `Map<String, BlockParticleSet>` | Variable | Dictionary of particle set ID to configuration (optional) |

**BlockParticleSet Fields:**

| Field | Type | Description |
|-------|------|-------------|
| breakParticles | ParticleConfig | Particles emitted when block is destroyed |
| stepParticles | ParticleConfig | Particles emitted when entity walks on block |
| landParticles | ParticleConfig | Particles emitted when entity lands on block |
| slideParticles | ParticleConfig | Particles emitted when entity slides on block |

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateBlockBreakingDecals (ID 45)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends block breaking decal/crack texture configurations. Defines the visual progression of cracks that appear on blocks as they are being mined.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = blockBreakingDecals present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2+ | blockBreakingDecals | `Map<String, BlockBreakingDecal>` | Variable | Dictionary of decal set ID to configuration (optional) |

**BlockBreakingDecal Fields:**

| Field | Type | Description |
|-------|------|-------------|
| stages | TextureRef[] | Array of crack stage textures (typically 10 stages from 0-100%) |
| tintColor | Color | Color tint applied to crack texture |
| emissive | boolean | Whether cracks emit light (glow effect) |

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateBlockSets (ID 46)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends block set definitions. Block sets group related blocks together for creative mode categories, hotbar switching (SwitchHotbarBlockSet packet), and gameplay mechanics.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = blockSets present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2+ | blockSets | `Map<String, BlockSet>` | Variable | Dictionary of block set ID to definition (optional) |

**BlockSet Fields:**

| Field | Type | Description |
|-------|------|-------------|
| id | String | Block set identifier (e.g., "building_blocks", "natural") |
| displayName | String | Localized display name for UI |
| blocks | String[] | Array of block type IDs in this set |
| icon | ItemRef | Icon reference for UI display |

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateFluidFX (ID 63)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends fluid visual effects configurations. Defines how fluids like water and lava are rendered, including surface effects, underwater effects, and fog parameters.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = fluidFX present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum fluid type ID |
| 6+ | fluidFX | `Map<int32, FluidFX>` | Variable | Dictionary of fluid ID to FX configuration (optional) |

**FluidFX Fields:**

| Field | Type | Description |
|-------|------|-------------|
| surfaceColor | Color | Color of the fluid surface |
| underwaterColor | Color | Tint color when camera is submerged |
| fogDensity | float | Underwater fog density (higher = less visibility) |
| fogColor | Color | Underwater fog color |
| reflectivity | float | Surface reflection strength (0.0-1.0) |
| transparency | float | Fluid transparency (0.0 = opaque, 1.0 = invisible) |
| flowSpeed | float | Visual flow animation speed |
| particleEmitter | ParticleConfig | Surface particle effects (bubbles, steam, etc.) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateItems (ID 54)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends item definitions including properties, models, and icons. Supports both addition and removal of items.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = items present, bit 1 = removedItems present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | updateModels | byte | 1 | Boolean: reload item models |
| 3 | updateIcons | byte | 1 | Boolean: reload item icons |
| 4 | itemsOffset | int32 LE | 4 | Offset to items dictionary |
| 8 | removedItemsOffset | int32 LE | 4 | Offset to removed items array |
| 12+ | items | `Map<String, ItemBase>` | Variable | Item definitions keyed by ID (optional) |
| - | removedItems | String[] | Variable | Item IDs to remove (optional) |

**Fixed Size:** 12 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateRecipes (ID 60)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends crafting recipe definitions. Supports adding new recipes and removing existing ones.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = recipes present, bit 1 = removedRecipes present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | recipesOffset | int32 LE | 4 | Offset to recipes dictionary |
| 6 | removedRecipesOffset | int32 LE | 4 | Offset to removed recipes array |
| 10+ | recipes | `Map<String, CraftingRecipe>` | Variable | Recipe definitions (optional) |
| - | removedRecipes | String[] | Variable | Recipe IDs to remove (optional) |

**Fixed Size:** 10 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateEnvironments (ID 61)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends world environment (biome) definitions including ambient settings, weather configurations, and terrain parameters.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = environments present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum environment ID |
| 6 | rebuildMapGeometry | byte | 1 | Boolean: rebuild map geometry |
| 7+ | environments | `Map<int32, WorldEnvironment>` | Variable | Environment definitions (optional) |

**Fixed Size:** 7 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateTranslations (ID 64)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends localization strings for server-defined content. Enables servers to provide custom text for items, blocks, and UI elements.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = translations present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2+ | translations | `Map<String, String>` | Variable | Translation key-value pairs (optional) |

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateSoundEvents (ID 65)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends sound event definitions for audio playback triggers.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = soundEvents present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum sound event ID |
| 6+ | soundEvents | `Map<int32, SoundEvent>` | Variable | Sound event definitions (optional) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateInteractions (ID 66)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends interaction definitions for combat, item usage, and environmental interactions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = interactions present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum interaction ID |
| 6+ | interactions | `Map<int32, Interaction>` | Variable | Interaction definitions (optional) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateWeathers (ID 47)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends weather type definitions including visual effects, particle systems, and environmental impact.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = weathers present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum weather ID |
| 6+ | weathers | `Map<int32, Weather>` | Variable | Weather definitions (optional) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateParticleSystems (ID 49)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends particle system definitions for visual effects.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = particleSystems present, bit 1 = removedParticleSystems present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | particleSystemsOffset | int32 LE | 4 | Offset to particle systems dictionary |
| 6 | removedParticleSystemsOffset | int32 LE | 4 | Offset to removed array |
| 10+ | particleSystems | `Map<String, ParticleSystem>` | Variable | Particle system definitions (optional) |
| - | removedParticleSystems | String[] | Variable | IDs to remove (optional) |

**Fixed Size:** 10 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateBlockGroups (ID 78)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends block group definitions for categorizing blocks (e.g., "stone", "wood", "ore").

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = groups present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2+ | groups | `Map<String, BlockGroup>` | Variable | Block group definitions (optional) |

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateSoundSets (ID 79)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends sound set definitions that group related sound events for materials and actions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = soundSets present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum sound set ID |
| 6+ | soundSets | `Map<int32, SoundSet>` | Variable | Sound set definitions (optional) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateFluids (ID 83)

**Direction:** Server -> Client
**Compressed:** Yes (Zstd)
**Description:** Sends fluid type definitions including water, lava, and custom fluids.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = fluids present |
| 1 | type | byte | 1 | UpdateType enum value |
| 2 | maxId | int32 LE | 4 | Maximum fluid ID |
| 6+ | fluids | `Map<int32, Fluid>` | Variable | Fluid definitions (optional) |

**Fixed Size:** 6 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### Asset Packet Reference Table

The following table summarizes all asset synchronization packets:

| Packet | ID | Key Type | Value Type | Supports Removal |
|--------|-----|----------|------------|------------------|
| UpdateBlockTypes | 40 | int32 | BlockType | No |
| UpdateWeathers | 47 | int32 | Weather | No |
| UpdateParticleSystems | 49 | String | ParticleSystem | Yes |
| UpdateParticleSpawners | 50 | String | ParticleSpawner | Yes |
| UpdateItems | 54 | String | ItemBase | Yes |
| UpdateItemCategories | 55 | String | ItemCategory | Yes |
| UpdateItemQualities | 56 | String | ItemQuality | No |
| UpdateRecipes | 60 | String | CraftingRecipe | Yes |
| UpdateEnvironments | 61 | int32 | WorldEnvironment | No |
| UpdateTranslations | 64 | String | String | No |
| UpdateSoundEvents | 65 | int32 | SoundEvent | No |
| UpdateInteractions | 66 | int32 | Interaction | No |
| UpdateRootInteractions | 67 | int32 | RootInteraction | No |
| UpdateUnarmedInteractions | 68 | int32 | UnarmedInteraction | No |
| UpdateBlockGroups | 78 | String | BlockGroup | No |
| UpdateSoundSets | 79 | int32 | SoundSet | No |
| UpdateBlockSoundSets | 80 | int32 | BlockSoundSet | No |
| UpdateItemSoundSets | 81 | int32 | ItemSoundSet | No |
| UpdateBlockHitboxes | 41 | int32 | Hitbox[] | No |
| UpdateBlockParticleSets | 44 | String | BlockParticleSet | No |
| UpdateBlockBreakingDecals | 45 | String | BlockBreakingDecal | No |
| UpdateBlockSets | 46 | String | BlockSet | No |
| UpdateFluidFX | 63 | int32 | FluidFX | No |
| UpdateFluids | 83 | int32 | Fluid | No |
| UpdateProjectileConfigs | 85 | String | ProjectileConfig | Yes |
| UpdateEntityEffects | 90 | String | EntityEffect | Yes |
| UpdateEntityStatTypes | 91 | int32 | EntityStatType | No |
| UpdateItemPlayerAnimations | 92 | String | ItemPlayerAnimation | Yes |
| UpdateItemReticles | 93 | int32 | ItemReticle | No |
| UpdateModelvfxs | 94 | String | Modelvfx | Yes |
| UpdateCameraShake | 95 | int32 | CameraShake | No |
| UpdateViewBobbing | 96 | int32 | ViewBobbing | No |
| UpdateTrails | 97 | String | Trail | Yes |
| UpdateResourceTypes | 98 | int32 | ResourceType | No |
| UpdateAudioCategories | 99 | int32 | AudioCategory | No |
| UpdateReverbEffects | 350 | int32 | ReverbEffect | No |
| UpdateEqualizerEffects | 351 | int32 | EqualizerEffect | No |
| UpdateAmbienceFX | 352 | int32 | AmbienceFX | No |
| UpdateEntityUIComponents | 353 | String | EntityUIComponent | Yes |
| UpdateTagPatterns | 354 | int32 | TagPattern | No |
| UpdateFieldcraftCategories | 355 | String | FieldcraftCategory | Yes |
| UpdateHitboxCollisionConfig | 356 | - | HitboxCollisionConfig | No |
| UpdateRepulsionConfig | 357 | - | RepulsionConfig | No |

---

### Objective Tracking Packets

These packets manage quest/objective tracking state.

#### TrackOrUpdateObjective (ID 358)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Adds or updates an objective in the client's objective tracker.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1+ | objective | ObjectiveData | Variable | Objective definition |

**Max Size:** 1,677,721,600 bytes

---

#### UpdateObjectiveTask (ID 359)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates a specific task within a tracked objective.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Presence flags |
| 1+ | taskUpdate | ObjectiveTaskUpdate | Variable | Task update data |

**Max Size:** 1,677,721,600 bytes

---

#### UntrackObjective (ID 70)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Removes an objective from the client's objective tracker.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = objectiveId present |
| 1+ | objectiveId | VarString | Variable | Objective ID to remove |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

---

## Connection Packets (Additional)

### Ping (ID 2)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Ping packet sent by the server to measure latency. Contains timing information and previous ping values for diagnostic purposes.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = time present |
| 1 | id | int32 LE | 4 | Ping sequence identifier |
| 5 | time | InstantData | 12 | Timestamp (optional) |
| 17 | lastPingValueRaw | int32 LE | 4 | Previous raw ping in ms |
| 21 | lastPingValueDirect | int32 LE | 4 | Previous direct ping in ms |
| 25 | lastPingValueTick | int32 LE | 4 | Previous tick-based ping in ms |

**Fixed Size:** 29 bytes

---

### Pong (ID 3)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Response to a Ping packet. Contains the original timestamp and information about the pong type and client packet queue.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = time present |
| 1 | id | int32 LE | 4 | Matching ping sequence identifier |
| 5 | time | InstantData | 12 | Timestamp (optional) |
| 17 | type | byte | 1 | PongType enum value |
| 18 | packetQueueSize | int16 LE | 2 | Number of packets in client queue |

**PongType Values:**
- `0` - Raw: Direct response
- `1` - Direct: Measured without processing delay
- `2` - Tick: Measured on game tick

**Fixed Size:** 20 bytes

---

## Authentication Packets (Extended)

### Status (ID 10)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server status response containing basic server information. Sent in response to status queries before full connection.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = name, Bit 1 = motd |
| 1 | playerCount | int32 LE | 4 | Current player count |
| 5 | maxPlayers | int32 LE | 4 | Maximum player capacity |
| 9 | nameOffset | int32 LE | 4 | Offset to name string |
| 13 | motdOffset | int32 LE | 4 | Offset to MOTD string |
| 17+ | name | VarString | Variable | Server name (max 128 chars) |
| ... | motd | VarString | Variable | Message of the day (max 512 chars) |

**Fixed Size:** 17 bytes (minimum)
**Max Size:** 2,587 bytes

---

### AuthGrant (ID 11)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server grants authentication to the client after successful verification. Contains authorization grant and server identity token.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = grant, Bit 1 = token |
| 1 | authorizationGrantOffset | int32 LE | 4 | Offset to grant string |
| 5 | serverIdentityTokenOffset | int32 LE | 4 | Offset to token string |
| 9+ | authorizationGrant | VarString | Variable | OAuth grant (max 4096 chars) |
| ... | serverIdentityToken | VarString | Variable | Server ID token (max 8192 chars) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 49,171 bytes

---

### AuthToken (ID 12)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client sends authentication token to server for verification.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = accessToken, Bit 1 = grant |
| 1 | accessTokenOffset | int32 LE | 4 | Offset to access token |
| 5 | serverAuthorizationGrantOffset | int32 LE | 4 | Offset to authorization grant |
| 9+ | accessToken | VarString | Variable | User access token (max 8192 chars) |
| ... | serverAuthorizationGrant | VarString | Variable | Server auth grant (max 4096 chars) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 49,171 bytes

---

### ServerAuthToken (ID 13)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server sends its authentication token for mutual authentication. May include password challenge for protected servers.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = accessToken, Bit 1 = challenge |
| 1 | serverAccessTokenOffset | int32 LE | 4 | Offset to server token |
| 5 | passwordChallengeOffset | int32 LE | 4 | Offset to challenge bytes |
| 9+ | serverAccessToken | VarString | Variable | Server access token (max 8192 chars) |
| ... | passwordChallenge | byte[] | Variable | Challenge bytes (max 64 bytes) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 32,851 bytes

---

### ConnectAccept (ID 14)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server accepts the connection request. May include password challenge for protected servers.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = challenge present |
| 1+ | passwordChallenge | byte[] | Variable | Challenge bytes (max 64 bytes) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 70 bytes

---

### PasswordResponse (ID 15)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client sends hashed password response to server password challenge.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = hash present |
| 1+ | hash | byte[] | Variable | Password hash (max 64 bytes) |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 70 bytes

---

### PasswordAccepted (ID 16)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server confirms password was correct. Empty packet with no payload.

**Fixed Size:** 0 bytes

---

### PasswordRejected (ID 17)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server rejects password and sends a new challenge. Includes remaining attempts count.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = new challenge present |
| 1 | attemptsRemaining | int32 LE | 4 | Remaining password attempts |
| 5+ | newChallenge | byte[] | Variable | New challenge bytes (max 64 bytes) |

**Fixed Size:** 5 bytes (minimum)
**Max Size:** 74 bytes

---

### ClientReferral (ID 18)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Server redirects client to another server. Used for server transfers and load balancing.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = host, Bit 1 = data |
| 1 | hostToOffset | int32 LE | 4 | Offset to host address |
| 5 | dataOffset | int32 LE | 4 | Offset to transfer data |
| 9+ | hostTo | HostAddress | Variable | Target server address |
| ... | data | byte[] | Variable | Transfer data (max 4096 bytes) |

**Fixed Size:** 9 bytes (minimum)
**Max Size:** 5,141 bytes

---

## World Map Packets

These packets handle the in-game world map system for navigation and discovery.

### UpdateWorldMapSettings (ID 240)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Configures the world map settings including enabled state, biome data, and teleportation permissions.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = biomeDataMap present |
| 1 | enabled | byte | 1 | Boolean: map enabled |
| 2 | allowTeleportToCoordinates | byte | 1 | Boolean: coordinate teleport |
| 3 | allowTeleportToMarkers | byte | 1 | Boolean: marker teleport |
| 4 | defaultScale | float LE | 4 | Default zoom level (default: 32.0) |
| 8 | minScale | float LE | 4 | Minimum zoom (default: 2.0) |
| 12 | maxScale | float LE | 4 | Maximum zoom (default: 256.0) |
| 16+ | biomeDataMap | `Map<short, BiomeData>` | Variable | Biome visual data |

**Fixed Size:** 16 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateWorldMap (ID 241)

**Direction:** Server -> Client
**Compressed:** Yes
**Description:** Updates the world map with new chunks, markers, and removals.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = chunks, Bit 1 = added, Bit 2 = removed |
| 1 | chunksOffset | int32 LE | 4 | Offset to chunks array |
| 5 | addedMarkersOffset | int32 LE | 4 | Offset to added markers |
| 9 | removedMarkersOffset | int32 LE | 4 | Offset to removed marker IDs |
| 13+ | chunks | MapChunk[] | Variable | Map chunk data |
| ... | addedMarkers | MapMarker[] | Variable | New map markers |
| ... | removedMarkers | VarString[] | Variable | Marker IDs to remove |

**Fixed Size:** 13 bytes (minimum)
**Max Size:** 1,677,721,600 bytes

---

### ClearWorldMap (ID 242)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Clears all world map data. Used when changing worlds or resetting the map.

**Fixed Size:** 0 bytes

---

### UpdateWorldMapVisible (ID 243)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client notifies server when the map UI visibility changes.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | visible | byte | 1 | Boolean: map is visible |

**Fixed Size:** 1 byte

---

### TeleportToWorldMapMarker (ID 244)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests teleportation to a map marker location.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = id present |
| 1+ | id | VarString | Variable | Target marker ID |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

---

### TeleportToWorldMapPosition (ID 245)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests teleportation to specific map coordinates.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | x | int32 LE | 4 | Target X coordinate |
| 4 | y | int32 LE | 4 | Target Y coordinate |

**Fixed Size:** 8 bytes

---

## Player Packets (Additional)

### SyncPlayerPreferences (ID 116)

**Direction:** Bidirectional
**Compressed:** No
**Description:** Synchronizes player preference settings between client and server.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | showEntityMarkers | byte | 1 | Boolean: show entity markers |
| 1 | armorItemsPreferredPickupLocation | byte | 1 | PickupLocation enum |
| 2 | weaponAndToolItemsPreferredPickupLocation | byte | 1 | PickupLocation enum |
| 3 | usableItemsItemsPreferredPickupLocation | byte | 1 | PickupLocation enum |
| 4 | solidBlockItemsPreferredPickupLocation | byte | 1 | PickupLocation enum |
| 5 | miscItemsPreferredPickupLocation | byte | 1 | PickupLocation enum |
| 6 | allowNPCDetection | byte | 1 | Boolean: allow NPC detection |
| 7 | respondToHit | byte | 1 | Boolean: respond to being hit |

**PickupLocation Values:**
- `0` - Hotbar: Prefer hotbar slots
- `1` - Inventory: Prefer inventory slots
- `2` - Auto: Automatic placement

**Fixed Size:** 8 bytes

---

### RemoveMapMarker (ID 119)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests removal of a map marker.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = markerId present |
| 1+ | markerId | VarString | Variable | Marker ID to remove |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes

---

## Setup Packets (Additional)

### ViewRadius (ID 32)

**Direction:** Bidirectional
**Compressed:** No
**Description:** Sets the client view/render distance in chunks.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | value | int32 LE | 4 | View radius in chunks |

**Fixed Size:** 4 bytes

---

## Server Access Packets (Additional)

### RequestServerAccess (ID 250)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client requests to change server access level (for server owners/admins).

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | access | byte | 1 | Access enum value |
| 1 | externalPort | int16 LE | 2 | External port for public access |

**Access Values:**
- `0` - Private: Server not listed
- `1` - FriendsOnly: Visible to friends
- `2` - Public: Listed publicly

**Fixed Size:** 3 bytes

---

## Interface Packets (Additional)

### CustomPageEvent (ID 219)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client sends events from custom UI pages back to the server.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = data present |
| 1 | type | byte | 1 | CustomPageEventType enum |
| 2+ | data | VarString | Variable | Event data JSON |

**CustomPageEventType Values:**
- `0` - Acknowledge: Page loaded confirmation
- `1` - Data: User input data
- `2` - Dismiss: User closed the page

**Fixed Size:** 2 bytes (minimum)
**Max Size:** 16,384,007 bytes

---

### EditorBlocksChange (ID 222)

**Direction:** Bidirectional
**Compressed:** Yes
**Description:** Editor command for batch block/fluid changes. Used by builder tools for complex operations.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = selection, Bit 1 = blocks, Bit 2 = fluids |
| 1 | selection | EditorSelection | 24 | Selection bounds (optional) |
| 25 | blocksCount | int32 LE | 4 | Total blocks affected |
| 29 | advancedPreview | byte | 1 | Boolean: show preview |
| 30 | blocksChangeOffset | int32 LE | 4 | Offset to block changes |
| 34 | fluidsChangeOffset | int32 LE | 4 | Offset to fluid changes |
| 38+ | blocksChange | BlockChange[] | Variable | Block modifications |
| ... | fluidsChange | FluidChange[] | Variable | Fluid modifications |

**Fixed Size:** 38 bytes (minimum)
**Max Size:** 139,264,048 bytes

---

### UpdateKnownRecipes (ID 228)

**Direction:** Server -> Client
**Compressed:** No
**Description:** Updates the client's known crafting recipes. Used for recipe unlocking systems.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = known map present |
| 1+ | known | `Map<String, CraftingRecipe>` | Variable | Recipe ID to Recipe data |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 1,677,721,600 bytes

---

### UpdateLanguage (ID 232)

**Direction:** Client -> Server
**Compressed:** No
**Description:** Client notifies server of language preference change.

| Offset | Field | Type | Size | Description |
|--------|-------|------|------|-------------|
| 0 | nullBits | byte | 1 | Bit 0 = language present |
| 1+ | language | VarString | Variable | Language code (e.g., "en", "fr") |

**Fixed Size:** 1 byte (minimum)
**Max Size:** 16,384,006 bytes
