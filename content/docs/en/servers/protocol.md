---
id: protocol
title: "Network Protocol Reference"
sidebar_label: Protocol Reference
sidebar_position: 15
description: Comprehensive technical reference for the Hytale server network protocol - Multi-channel QUIC architecture, packet direction typing, ComponentUpdate polymorphic dispatch system, new packets, serialization patterns, and PacketRegistry.
---

# Hytale Network Protocol Reference

This document is a comprehensive technical reference for the Hytale server network protocol, derived from decompiled source analysis. It covers the multi-channel QUIC architecture, packet direction typing, the ComponentUpdate polymorphic dispatch system, new packets, serialization patterns, and the PacketRegistry.

All source paths are relative to `decompiled/com/hypixel/hytale/protocol/`.

---

## 1. Multi-Channel Architecture

Hytale uses QUIC (not TCP) as its transport layer on UDP port 5520. The protocol defines three logical network channels that map to separate QUIC streams. Each packet declares which channel it belongs to, and the encoder/decoder enforce that packets are only sent on their designated stream.

### NetworkChannel Enum

**Source:** `NetworkChannel.java`

```java
public enum NetworkChannel {
   Default(0),
   Chunks(1),
   WorldMap(2);

   public static final NetworkChannel[] VALUES = values();
   public static final int COUNT = VALUES.length;
   private final int value;

   public int getValue() {
      return this.value;
   }

   public static NetworkChannel fromValue(int value) {
      if (value >= 0 && value < VALUES.length) {
         return VALUES[value];
      } else {
         throw new IllegalArgumentException("Invalid network channel: " + value);
      }
   }
}
```

### Channel Descriptions

| Channel | Value | Purpose | Packet ID Ranges |
|---------|-------|---------|-----------------|
| `Default` | 0 | Connection, auth, setup, player, entities, UI, inventory, builder tools, asset editor, machinima, camera, server access | 0-119, 200-238, 240, 243-246, 250-262, 280-283, 300-360, 400-425 |
| `Chunks` | 1 | Chunk data, heightmaps, tintmaps, fluids, block/fluid mutations, sound events, particles, weather, time | 131-170 |
| `WorldMap` | 2 | World map tile updates, clearing the map | 241-242 |

### Stream Channel Enforcement

The encoder and decoder both validate that a packet's declared channel matches the QUIC stream it is being sent/received on. This is enforced via a Netty channel attribute.

**Source:** `io/netty/PacketEncoder.java` (line 27-29)

```java
NetworkChannel channelAttr = ctx.channel().attr(ProtocolUtil.STREAM_CHANNEL_KEY).get();
if (channelAttr != null && channelAttr != packet.getChannel()) {
   throw new IllegalArgumentException(
      "Packet channel " + packet.getChannel() +
      " does not match stream channel " + channelAttr
   );
}
```

**Source:** `io/netty/PacketDecoder.java` (line 95-98)

```java
NetworkChannel channelVal = ctx.channel().attr(ProtocolUtil.STREAM_CHANNEL_KEY).get();
if (channelVal != null && channelVal != packetInfo.channel()) {
   in.skipBytes(in.readableBytes());
   ProtocolUtil.closeConnection(ctx.channel());
}
```

If a packet arrives on the wrong stream, the connection is terminated with a QUIC `PROTOCOL_VIOLATION` error.

### QUIC Application Error Codes

**Source:** `io/netty/ProtocolUtil.java` (lines 19-25)

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

## 2. Packet Direction Typing

Every packet implements specific marker interfaces that constrain which direction it can travel.

### Interface Hierarchy

**Source:** `Packet.java`

```java
public interface Packet {
   int getId();
   NetworkChannel getChannel();
   void serialize(@Nonnull ByteBuf var1);
   int computeSize();
}
```

**Source:** `ToClientPacket.java`

```java
public interface ToClientPacket extends Packet {
}
```

**Source:** `ToServerPacket.java`

```java
public interface ToServerPacket extends Packet {
}
```

Packets implement one or both of these interfaces:
- **Server-to-client only:** `implements Packet, ToClientPacket` (e.g., `Ping`, `SetClientId`, `EntityUpdates`)
- **Client-to-server only:** `implements Packet, ToServerPacket` (e.g., `Pong`, `ClientMovement`, `CreateUserMarker`)
- **Bidirectional:** `implements Packet, ToClientPacket, ToServerPacket` (e.g., `Disconnect`, `ViewRadius`, `UpdateMachinimaScene`)

The PacketRegistry maintains separate lookup maps (`TO_SERVER_BY_ID` and `TO_CLIENT_BY_ID`) used by the decoder to validate packet direction. The `PacketDecoder` only looks up incoming packets in `TO_SERVER_BY_ID`, meaning clients can only send packets registered as `ToServer` or `Both`.

### CachedPacket

`CachedPacket` wraps a `ToClientPacket` for broadcast optimization. It pre-serializes the packet once into a Netty `ByteBuf` and replays the bytes for each recipient, avoiding redundant serialization.

**Source:** `CachedPacket.java`

```java
public final class CachedPacket<T extends ToClientPacket>
      implements ToClientPacket, AutoCloseable {

   private final Class<T> packetType;
   private final int packetId;
   private final NetworkChannel packetChannel;
   private final ByteBuf cachedBytes;

   public static <T extends ToClientPacket> CachedPacket<T> cache(@Nonnull T packet) {
      if (packet instanceof CachedPacket) {
         throw new IllegalArgumentException("Cannot cache a CachedPacket");
      }
      ByteBuf buf = Unpooled.buffer();
      packet.serialize(buf);
      return new CachedPacket<>(
         (Class<T>)packet.getClass(), packet.getId(),
         packet.getChannel(), buf
      );
   }

   @Override
   public void serialize(@Nonnull ByteBuf buf) {
      if (this.cachedBytes.refCnt() <= 0) {
         throw new IllegalStateException(
            "CachedPacket buffer was released before serialization completed"
         );
      }
      buf.writeBytes(this.cachedBytes,
         this.cachedBytes.readerIndex(), this.cachedBytes.readableBytes());
   }

   @Override
   public int computeSize() {
      return this.cachedBytes.readableBytes();
   }

   @Override
   public void close() {
      if (this.cachedBytes.refCnt() > 0) {
         this.cachedBytes.release();
      }
   }
}
```

Key properties:
- Only `ToClientPacket` instances can be cached (compile-time constraint via generics).
- The generic parameter preserves the original packet type for stats/logging via `getPacketType()`.
- Implements `AutoCloseable` -- callers must release the underlying buffer when done broadcasting.
- Double-caching is prevented by the `instanceof CachedPacket` guard.
- The channel attribute is cached alongside the bytes so the encoder can validate stream assignment.

---

## 3. ComponentUpdate System

The ComponentUpdate system is the core ECS (Entity Component System) replication mechanism. It uses polymorphic dispatch with 26 distinct component types, each identified by a VarInt type ID prefix.

### Base Class

**Source:** `ComponentUpdate.java`

```java
public abstract class ComponentUpdate {
   public static final int MAX_SIZE = 1677721605;

   @Nonnull
   public static ComponentUpdate deserialize(@Nonnull ByteBuf buf, int offset) {
      int typeId = VarInt.peek(buf, offset);
      int typeIdLen = VarInt.length(buf, offset);
      return (ComponentUpdate)(switch (typeId) {
         case 0  -> NameplateUpdate.deserialize(buf, offset + typeIdLen);
         case 1  -> UIComponentsUpdate.deserialize(buf, offset + typeIdLen);
         case 2  -> CombatTextUpdate.deserialize(buf, offset + typeIdLen);
         // ... cases 3-25 ...
         case 25 -> PropUpdate.deserialize(buf, offset + typeIdLen);
         default -> throw ProtocolException.unknownPolymorphicType(
                       "ComponentUpdate", typeId);
      });
   }

   public int serializeWithTypeId(@Nonnull ByteBuf buf) {
      int startPos = buf.writerIndex();
      VarInt.write(buf, this.getTypeId());
      this.serialize(buf);
      return buf.writerIndex() - startPos;
   }

   public abstract int serialize(@Nonnull ByteBuf var1);
   public abstract int computeSize();
}
```

### ComponentUpdateType Enum

**Source:** `ComponentUpdateType.java`

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

### EntityUpdate Container

ComponentUpdates are delivered inside `EntityUpdate` objects, which are themselves contained in `EntityUpdates` packets. Each `EntityUpdate` targets a specific entity by `networkId` and carries an optional list of removed components and an optional list of updated components.

**Source:** `EntityUpdate.java`

```java
public class EntityUpdate {
   public static final int NULLABLE_BIT_FIELD_SIZE = 1;
   public static final int FIXED_BLOCK_SIZE = 5;      // 1 nullBits + 4 networkId
   public static final int VARIABLE_FIELD_COUNT = 2;
   public static final int VARIABLE_BLOCK_START = 13;  // 1+4+4+4
   public static final int MAX_SIZE = 1677721600;

   public int networkId;
   @Nullable public ComponentUpdateType[] removed;
   @Nullable public ComponentUpdate[] updates;
}
```

Wire format:
```
[1 byte nullBits] [4 bytes networkId LE]
[4 bytes removedOffset LE] [4 bytes updatesOffset LE]
--- variable block (starts at byte 13) ---
[VarInt removedCount] [removedCount x 1-byte enum values]   (if bit 0 set)
[VarInt updatesCount] [updatesCount x ComponentUpdate]       (if bit 1 set)
```

### All 26 ComponentUpdate Types -- Detailed Reference

#### Type 0: NameplateUpdate

**Source:** `NameplateUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `text` | `String` | VarInt-length-prefixed UTF-8 |

Fixed size: 0 bytes. Variable: 1 field (the string). Used to set the display name above an entity.

```java
public class NameplateUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 0;
   @Nonnull public String text = "";
}
```

---

#### Type 1: UIComponentsUpdate

**Source:** `UIComponentsUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `components` | `int[]` | VarInt count + N x 4-byte int32 LE |

Fixed size: 0 bytes. Variable: 1 field. References entity UI component indices.

```java
public class UIComponentsUpdate extends ComponentUpdate {
   @Nonnull public int[] components = new int[0];
}
```

---

#### Type 2: CombatTextUpdate

**Source:** `CombatTextUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `hitAngleDeg` | `float` | 4-byte float LE |
| `text` | `String` | VarInt-length-prefixed UTF-8 |

Fixed size: 4 bytes. Variable: 1 field. Displays floating combat numbers at the given angle.

```java
public class CombatTextUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 4;
   public float hitAngleDeg;
   @Nonnull public String text = "";
}
```

---

#### Type 3: ModelUpdate

**Source:** `ModelUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `model` | `Model?` | Nullable (bit 0), variable-size `Model` struct |
| `entityScale` | `float` | 4-byte float LE |

Fixed size: 5 bytes (1 nullBits + 4 entityScale). Variable: 1 field. Sets or clears an entity's 3D model and scale.

```java
public class ModelUpdate extends ComponentUpdate {
   public static final int NULLABLE_BIT_FIELD_SIZE = 1;
   public static final int FIXED_BLOCK_SIZE = 5;
   @Nullable public Model model;
   public float entityScale;
}
```

---

#### Type 4: PlayerSkinUpdate

**Source:** `PlayerSkinUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `skin` | `PlayerSkin?` | Nullable (bit 0), variable-size `PlayerSkin` struct |

Fixed size: 1 byte (nullBits). Variable: 1 field. Updates a player entity's skin data.

```java
public class PlayerSkinUpdate extends ComponentUpdate {
   public static final int NULLABLE_BIT_FIELD_SIZE = 1;
   @Nullable public PlayerSkin skin;
}
```

---

#### Type 5: ItemUpdate

**Source:** `ItemUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `item` | `ItemWithAllMetadata` | Variable-size struct |
| `entityScale` | `float` | 4-byte float LE |

Fixed size: 4 bytes. Variable: 1 field. Represents an item-type entity (dropped item, etc.).

```java
public class ItemUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 4;
   @Nonnull public ItemWithAllMetadata item = new ItemWithAllMetadata();
   public float entityScale;
}
```

---

#### Type 6: BlockUpdate

**Source:** `BlockUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `blockId` | `int` | 4-byte int32 LE |
| `entityScale` | `float` | 4-byte float LE |

**Fixed size: 8 bytes. No variable fields.** This is one of the simplest updates -- purely fixed-size. Used for block-type entities (falling sand, etc.).

```java
public class BlockUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 8;
   public static final int MAX_SIZE = 8;
   public int blockId;
   public float entityScale;

   public static int computeBytesConsumed(@Nonnull ByteBuf buf, int offset) {
      return 8;
   }
}
```

---

#### Type 7: EquipmentUpdate

**Source:** `EquipmentUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `armorIds` | `String[]?` | Nullable (bit 0), offset-addressed, VarInt count + VarString array |
| `rightHandItemId` | `String?` | Nullable (bit 1), offset-addressed VarString |
| `leftHandItemId` | `String?` | Nullable (bit 2), offset-addressed VarString |

Fixed size: 13 bytes (1 nullBits + 3 x 4-byte offsets). Variable: 3 fields. Uses the full offset-addressing pattern (see Section 5).

```java
public class EquipmentUpdate extends ComponentUpdate {
   public static final int NULLABLE_BIT_FIELD_SIZE = 1;
   public static final int FIXED_BLOCK_SIZE = 1;
   public static final int VARIABLE_FIELD_COUNT = 3;
   public static final int VARIABLE_BLOCK_START = 13;
   @Nullable public String[] armorIds;
   @Nullable public String rightHandItemId;
   @Nullable public String leftHandItemId;
}
```

---

#### Type 8: EntityStatsUpdate

**Source:** `EntityStatsUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `entityStatUpdates` | Map of Integer to EntityStatUpdate arrays | VarInt count, then [4-byte key + VarInt arrLen + arrLen x EntityStatUpdate] repeated |

Fixed size: 0 bytes. Variable: 1 field. Dictionary keyed by stat type ID, values are arrays of stat change records. Max 64 entries per stat type.

```java
public class EntityStatsUpdate extends ComponentUpdate {
   @Nonnull public Map<Integer, EntityStatUpdate[]> entityStatUpdates = new HashMap<>();
}
```

---

#### Type 9: TransformUpdate

**Source:** `TransformUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `transform` | `ModelTransform` | 49-byte fixed struct (position, rotation, scale) |

**Fixed size: 49 bytes. No variable fields.** Contains the entity's full world-space transform.

```java
public class TransformUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 49;
   public static final int MAX_SIZE = 49;
   @Nonnull public ModelTransform transform = new ModelTransform();
}
```

---

#### Type 10: MovementStatesUpdate

**Source:** `MovementStatesUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `movementStates` | `MovementStates` | 22-byte fixed struct |

**Fixed size: 22 bytes. No variable fields.** Encodes the entity's movement state flags (grounded, swimming, sprinting, etc.).

```java
public class MovementStatesUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 22;
   public static final int MAX_SIZE = 22;
   @Nonnull public MovementStates movementStates = new MovementStates();
}
```

---

#### Type 11: EntityEffectsUpdate

**Source:** `EntityEffectsUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `entityEffectUpdates` | `EntityEffectUpdate[]` | VarInt count + N x EntityEffectUpdate structs |

Fixed size: 0 bytes. Variable: 1 field. Each element is min 12 bytes. Updates active visual/gameplay effects on an entity.

```java
public class EntityEffectsUpdate extends ComponentUpdate {
   @Nonnull public EntityEffectUpdate[] entityEffectUpdates = new EntityEffectUpdate[0];
}
```

---

#### Type 12: InteractionsUpdate

**Source:** `InteractionsUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `interactions` | Map of InteractionType to Integer | Offset-addressed, VarInt count + [1-byte key + 4-byte value] repeated |
| `interactionHint` | `String?` | Nullable (bit 0), offset-addressed VarString |

Fixed size: 9 bytes (1 nullBits + 2 x 4-byte offsets). Variable: 2 fields. Maps interaction types to interaction definition indices, with an optional UI hint string.

```java
public class InteractionsUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 1;
   public static final int VARIABLE_BLOCK_START = 9;
   @Nonnull public Map<InteractionType, Integer> interactions = new HashMap<>();
   @Nullable public String interactionHint;
}
```

---

#### Type 13: DynamicLightUpdate

**Source:** `DynamicLightUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `dynamicLight` | `ColorLight` | 4-byte fixed struct (RGB + intensity packed) |

**Fixed size: 4 bytes. No variable fields.** Attaches a dynamic point light to the entity.

```java
public class DynamicLightUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 4;
   public static final int MAX_SIZE = 4;
   @Nonnull public ColorLight dynamicLight = new ColorLight();
}
```

---

#### Type 14: InteractableUpdate

**Source:** `InteractableUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `interactionHint` | `String?` | Nullable (bit 0), VarString |

Fixed size: 1 byte (nullBits). Variable: 1 field. Marks an entity as interactable with an optional tooltip string.

```java
public class InteractableUpdate extends ComponentUpdate {
   public static final int NULLABLE_BIT_FIELD_SIZE = 1;
   @Nullable public String interactionHint;
}
```

---

#### Type 15: IntangibleUpdate

**Source:** `IntangibleUpdate.java`

**Fixed size: 0 bytes. No fields.** A marker component -- its mere presence on an entity signifies the entity is intangible (cannot be hit or interacted with).

```java
public class IntangibleUpdate extends ComponentUpdate {
   public static final int MAX_SIZE = 0;
   public static int computeBytesConsumed(@Nonnull ByteBuf buf, int offset) {
      return 0;
   }
}
```

---

#### Type 16: InvulnerableUpdate

**Source:** `InvulnerableUpdate.java`

**Fixed size: 0 bytes. No fields.** Marker component indicating the entity cannot take damage.

---

#### Type 17: RespondToHitUpdate

**Source:** `RespondToHitUpdate.java`

**Fixed size: 0 bytes. No fields.** Marker component indicating the entity should play hit-response animations.

---

#### Type 18: HitboxCollisionUpdate

**Source:** `HitboxCollisionUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `hitboxCollisionConfigIndex` | `int` | 4-byte int32 LE |

**Fixed size: 4 bytes. No variable fields.** References a hitbox collision configuration by index (defined by `UpdateHitboxCollisionConfig` asset packet).

```java
public class HitboxCollisionUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 4;
   public static final int MAX_SIZE = 4;
   public int hitboxCollisionConfigIndex;
}
```

---

#### Type 19: RepulsionUpdate

**Source:** `RepulsionUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `repulsionConfigIndex` | `int` | 4-byte int32 LE |

**Fixed size: 4 bytes. No variable fields.** References a repulsion (crowd avoidance) configuration by index.

```java
public class RepulsionUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 4;
   public static final int MAX_SIZE = 4;
   public int repulsionConfigIndex;
}
```

---

#### Type 20: PredictionUpdate

**Source:** `PredictionUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `predictionId` | `UUID` | 16 bytes (two int64 LE) |

**Fixed size: 16 bytes. No variable fields.** Associates the entity update with a client-side prediction, allowing the client to reconcile or discard predicted state.

```java
public class PredictionUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 16;
   public static final int MAX_SIZE = 16;
   @Nonnull public UUID predictionId = new UUID(0L, 0L);
}
```

---

#### Type 21: AudioUpdate

**Source:** `AudioUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `soundEventIds` | `int[]` | VarInt count + N x 4-byte int32 LE |

Fixed size: 0 bytes. Variable: 1 field. Triggers one or more sound events on the entity.

```java
public class AudioUpdate extends ComponentUpdate {
   @Nonnull public int[] soundEventIds = new int[0];
}
```

---

#### Type 22: MountedUpdate

**Source:** `MountedUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `mountedToEntity` | `int` | 4-byte int32 LE |
| `attachmentOffset` | `Vector3f?` | Nullable (bit 0), 12 bytes (3 x float LE), zero-padded if null |
| `controller` | `MountController` | 1-byte enum |
| `block` | `BlockMount?` | Nullable (bit 1), 30-byte struct, zero-padded if null |

**Fixed size: 48 bytes. No variable fields.** Even though it has nullable fields, they occupy reserved space in the fixed block (zero-padded when absent). This avoids variable-size overhead for a frequently-updated component.

```java
public class MountedUpdate extends ComponentUpdate {
   public static final int FIXED_BLOCK_SIZE = 48;
   public static final int MAX_SIZE = 48;
   public int mountedToEntity;
   @Nullable public Vector3f attachmentOffset;
   @Nonnull public MountController controller = MountController.Minecart;
   @Nullable public BlockMount block;
}
```

---

#### Type 23: NewSpawnUpdate

**Source:** `NewSpawnUpdate.java`

**Fixed size: 0 bytes. No fields.** Marker component indicating this entity was just spawned in the current tick. Clients can use this to suppress interpolation on first appearance.

---

#### Type 24: ActiveAnimationsUpdate

**Source:** `ActiveAnimationsUpdate.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `activeAnimations` | `String[]` | VarInt count + **bitfield** + conditionally-present VarStrings |

Fixed size: 0 bytes. Variable: 1 field. **This type uses a bitfield encoding** -- after the array count, a `ceil(count/8)` byte bitfield indicates which array slots have non-null values. Only present strings are serialized.

```java
// Serialization (line 92-108)
VarInt.write(buf, this.activeAnimations.length);
int bitfieldSize = (this.activeAnimations.length + 7) / 8;
byte[] bitfield = new byte[bitfieldSize];
for (int i = 0; i < this.activeAnimations.length; i++) {
   if (this.activeAnimations[i] != null) {
      bitfield[i / 8] = (byte)(bitfield[i / 8] | (byte)(1 << i % 8));
   }
}
buf.writeBytes(bitfield);
for (int i = 0; i < this.activeAnimations.length; i++) {
   if (this.activeAnimations[i] != null) {
      PacketIO.writeVarString(buf, this.activeAnimations[i], 4096000);
   }
}
```

Wire format:
```
[VarInt count]
[ceil(count/8) bytes bitfield]
[for each bit set: VarString animation name]
```

---

#### Type 25: PropUpdate

**Source:** `PropUpdate.java`

**Fixed size: 0 bytes. No fields.** Marker component indicating the entity is a static prop (decorative object placed in the world).

---

### ComponentUpdate Summary Table

| ID | Type | Fixed Size | Variable Fields | Nullable Bits | Purpose |
|----|------|-----------|-----------------|---------------|---------|
| 0 | NameplateUpdate | 0 | 1 (String) | 0 | Entity display name |
| 1 | UIComponentsUpdate | 0 | 1 (int array) | 0 | UI component indices |
| 2 | CombatTextUpdate | 4 | 1 (String) | 0 | Damage numbers |
| 3 | ModelUpdate | 5 | 1 (Model?) | 1 | 3D model + scale |
| 4 | PlayerSkinUpdate | 1 | 1 (PlayerSkin?) | 1 | Player skin |
| 5 | ItemUpdate | 4 | 1 (ItemWithAllMetadata) | 0 | Dropped item entity |
| 6 | BlockUpdate | 8 | 0 | 0 | Block entity |
| 7 | EquipmentUpdate | 13 | 3 (String array, String?, String?) | 1 | Armor + held items |
| 8 | EntityStatsUpdate | 0 | 1 (Map) | 0 | Stat changes |
| 9 | TransformUpdate | 49 | 0 | 0 | Position/rotation/scale |
| 10 | MovementStatesUpdate | 22 | 0 | 0 | Movement flags |
| 11 | EntityEffectsUpdate | 0 | 1 (array) | 0 | Active effects |
| 12 | InteractionsUpdate | 9 | 2 (Map, String?) | 1 | Available interactions |
| 13 | DynamicLightUpdate | 4 | 0 | 0 | Point light |
| 14 | InteractableUpdate | 1 | 1 (String?) | 1 | Interaction tooltip |
| 15 | IntangibleUpdate | 0 | 0 | 0 | Marker: intangible |
| 16 | InvulnerableUpdate | 0 | 0 | 0 | Marker: invulnerable |
| 17 | RespondToHitUpdate | 0 | 0 | 0 | Marker: hit response |
| 18 | HitboxCollisionUpdate | 4 | 0 | 0 | Hitbox config ref |
| 19 | RepulsionUpdate | 4 | 0 | 0 | Repulsion config ref |
| 20 | PredictionUpdate | 16 | 0 | 0 | Client prediction ID |
| 21 | AudioUpdate | 0 | 1 (int array) | 0 | Sound event triggers |
| 22 | MountedUpdate | 48 | 0 | 1 | Mount attachment |
| 23 | NewSpawnUpdate | 0 | 0 | 0 | Marker: new spawn |
| 24 | ActiveAnimationsUpdate | 0 | 1 (String array w/ bitfield) | 0 | Playing animations |
| 25 | PropUpdate | 0 | 0 | 0 | Marker: static prop |

---

## 4. New Packets

### CreateUserMarker (ID 246)

**Source:** `packets/worldmap/CreateUserMarker.java`

Direction: **ToServer** | Channel: **Default** | Compressed: No

Allows a player to place a custom marker on the world map.

```java
public class CreateUserMarker implements Packet, ToServerPacket {
   public static final int PACKET_ID = 246;
   public static final int FIXED_BLOCK_SIZE = 13;
   public static final int VARIABLE_BLOCK_START = 21;

   public float x;                    // 4 bytes float LE
   public float z;                    // 4 bytes float LE
   @Nullable public String name;      // Nullable (bit 1), offset-addressed VarString
   @Nullable public String markerImage; // Nullable (bit 2), offset-addressed VarString
   @Nullable public Color tintColor;  // Nullable (bit 0), 3-byte fixed struct
   public boolean shared;             // 1-byte boolean
}
```

Wire format:
```
[1 byte nullBits]
[4 bytes x float LE]
[4 bytes z float LE]
[3 bytes tintColor or zeros]    (present if bit 0)
[1 byte shared boolean]
[4 bytes nameOffset LE]         (relative to variable block start)
[4 bytes markerImageOffset LE]
--- variable block ---
[VarString name]                (present if bit 1)
[VarString markerImage]         (present if bit 2)
```

### BuilderToolSetEntityCollision (ID 425)

**Source:** `packets/buildertools/BuilderToolSetEntityCollision.java`

Direction: **ToServer** | Channel: **Default** | Compressed: No

Sets the collision type for an entity via the builder tools (editor/creative mode).

```java
public class BuilderToolSetEntityCollision implements Packet, ToServerPacket {
   public static final int PACKET_ID = 425;
   public static final int FIXED_BLOCK_SIZE = 5;

   public int entityId;               // 4 bytes int32 LE
   @Nullable public String collisionType; // Nullable (bit 0), inline VarString
}
```

### UpdateAnchorUI (ID 235)

**Source:** `packets/interface_/UpdateAnchorUI.java`

Direction: **ToClient** | Channel: **Default** | Compressed: **Yes**

Updates a custom UI anchor point on the client. Supports dynamic UI building via command arrays and event bindings.

```java
public class UpdateAnchorUI implements Packet, ToClientPacket {
   public static final int PACKET_ID = 235;
   public static final boolean IS_COMPRESSED = true;
   public static final int VARIABLE_BLOCK_START = 14;

   @Nullable public String anchorId;                    // Nullable (bit 0)
   public boolean clear;                                // 1-byte boolean
   @Nullable public CustomUICommand[] commands;          // Nullable (bit 1)
   @Nullable public CustomUIEventBinding[] eventBindings; // Nullable (bit 2)
}
```

### MapMarkerComponent Polymorphic System

**Source:** `packets/worldmap/MapMarkerComponent.java`

Map markers use their own polymorphic dispatch system with 4 subtypes, independent of the ComponentUpdate hierarchy. Each MapMarker can carry an array of `MapMarkerComponent` objects.

```java
public abstract class MapMarkerComponent {
   @Nonnull
   public static MapMarkerComponent deserialize(@Nonnull ByteBuf buf, int offset) {
      int typeId = VarInt.peek(buf, offset);
      int typeIdLen = VarInt.length(buf, offset);
      return (MapMarkerComponent)(switch (typeId) {
         case 0 -> PlayerMarkerComponent.deserialize(buf, offset + typeIdLen);
         case 1 -> PlacedByMarkerComponent.deserialize(buf, offset + typeIdLen);
         case 2 -> HeightDeltaIconComponent.deserialize(buf, offset + typeIdLen);
         case 3 -> TintComponent.deserialize(buf, offset + typeIdLen);
         default -> throw ProtocolException.unknownPolymorphicType(
                       "MapMarkerComponent", typeId);
      });
   }
}
```

#### Subtype 0: PlayerMarkerComponent

**Source:** `packets/worldmap/PlayerMarkerComponent.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `playerId` | `UUID` | 16 bytes |

Fixed 16 bytes. Associates a map marker with a specific player.

#### Subtype 1: PlacedByMarkerComponent

**Source:** `packets/worldmap/PlacedByMarkerComponent.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `playerId` | `UUID` | 16 bytes |
| `name` | `FormattedMessage` | Variable-size struct |

Fixed 16 bytes + variable. Records which player placed the marker along with their formatted display name.

#### Subtype 2: HeightDeltaIconComponent

**Source:** `packets/worldmap/HeightDeltaIconComponent.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `upDelta` | `int` | 4 bytes int32 LE |
| `downDelta` | `int` | 4 bytes int32 LE |
| `upImage` | `String?` | Nullable (bit 0), offset-addressed |
| `downImage` | `String?` | Nullable (bit 1), offset-addressed |

Fixed 17 bytes (1 nullBits + 8 data + 8 offsets). Shows directional arrows when the marker is above or below the player by more than the configured delta thresholds.

#### Subtype 3: TintComponent

**Source:** `packets/worldmap/TintComponent.java`

| Field | Type | Wire Format |
|-------|------|-------------|
| `color` | `Color` | 3 bytes (R, G, B) |

Fixed 3 bytes. Tints the map marker icon with a custom color.

### MapMarker Structure

**Source:** `packets/worldmap/MapMarker.java`

The full `MapMarker` structure aggregates all the above:

```java
public class MapMarker {
   public static final int FIXED_BLOCK_SIZE = 38;
   public static final int VARIABLE_BLOCK_START = 62;

   @Nonnull public String id = "";
   @Nullable public FormattedMessage name;           // bit 0
   @Nullable public String customName;               // bit 1
   @Nonnull public String markerImage = "";
   @Nonnull public Transform transform = new Transform(); // 37 bytes
   @Nullable public ContextMenuItem[] contextMenuItems; // bit 2
   @Nullable public MapMarkerComponent[] components;    // bit 3
}
```

---

## 5. Serialization Patterns

### VarInt Encoding

**Source:** `io/VarInt.java`

Hytale uses standard 7-bit VarInt encoding (identical to the Protocol Buffers format). Each byte uses 7 bits for data and 1 continuation bit. Maximum 5 bytes (encodes up to 2^28 - 1 due to the `shift` guard at 28). Negative values cannot be encoded.

```java
public static void write(@Nonnull ByteBuf buf, int value) {
   if (value < 0) {
      throw new IllegalArgumentException("VarInt cannot encode negative values: " + value);
   }
   while ((value & -128) != 0) {
      buf.writeByte(value & 127 | 128);
      value >>>= 7;
   }
   buf.writeByte(value);
}

public static int size(int value) {
   if ((value & -128) == 0)       return 1;  // 0-127
   if ((value & -16384) == 0)     return 2;  // 128-16383
   if ((value & -2097152) == 0)   return 3;  // 16384-2097151
   if ((value & -268435456) == 0) return 4;  // 2097152-268435455
   return 5;
}
```

### Offset Addressing

Many structs use a two-part layout to enable random access without parsing variable-length fields:

1. **Fixed block** -- Contains nullable bitfield, fixed-size fields, and 4-byte LE offset slots (one per variable field).
2. **Variable block** -- Contains variable-length data (strings, arrays, nested structs).

Each offset slot stores a relative byte offset from the start of the variable block to where that field's data begins. If the field is null, the offset is set to `-1` (0xFFFFFFFF).

Example from `EquipmentUpdate` serialization (line 154-206):

```java
// Write fixed header
buf.writeByte(nullBits);
int armorIdsOffsetSlot = buf.writerIndex();
buf.writeIntLE(0);      // placeholder for armorIds offset
int rightHandOffsetSlot = buf.writerIndex();
buf.writeIntLE(0);      // placeholder for rightHandItemId offset
int leftHandOffsetSlot = buf.writerIndex();
buf.writeIntLE(0);      // placeholder for leftHandItemId offset
int varBlockStart = buf.writerIndex();

// Write variable data and patch offsets
if (this.armorIds != null) {
   buf.setIntLE(armorIdsOffsetSlot, buf.writerIndex() - varBlockStart);
   // ... write array ...
} else {
   buf.setIntLE(armorIdsOffsetSlot, -1);
}
```

### Nullable Bitfield

The first byte of many structs is a bitfield where each bit indicates whether a nullable field is present:
- Bit 0 = first nullable field is present
- Bit 1 = second nullable field is present
- etc.

When a nullable fixed-size field is absent, its reserved bytes are zero-filled to maintain struct alignment (see `MountedUpdate` which zero-pads 12 bytes for a missing `Vector3f` and 30 bytes for a missing `BlockMount`).

### Bitfield Arrays (Sparse String Arrays)

`ActiveAnimationsUpdate` demonstrates a compact encoding for sparse arrays where many elements may be null:

```
[VarInt arrayLength]
[ceil(arrayLength / 8) bytes presence bitfield]
[for each set bit: VarString value]
```

This avoids paying the cost of encoding null markers for every element.

### String Encoding

Strings are encoded as VarInt-prefixed byte arrays. The VarInt stores the byte length (not character count). Charset is UTF-8 by default (`PacketIO.UTF8`). Maximum string length is enforced at 4,096,000 bytes.

### Half-Precision Floats

**Source:** `io/PacketIO.java` (line 24-31)

```java
public static float readHalfLE(@Nonnull ByteBuf buf, int index) {
   short bits = buf.getShortLE(index);
   return halfToFloat(bits);
}
```

Some fields use 16-bit half-precision floats (IEEE 754 binary16) to save bandwidth, read as little-endian shorts and converted.

### Compression

Packets flagged with `compressed = true` in the PacketRegistry use Zstd compression. The compression level defaults to `Zstd.defaultCompressionLevel()` but can be overridden via the JVM property `hytale.protocol.compressionLevel`.

**Source:** `io/PacketIO.java` (line 19)

```java
private static final int COMPRESSION_LEVEL =
   Integer.getInteger("hytale.protocol.compressionLevel", Zstd.defaultCompressionLevel());
```

### Validation

Every packet and struct implements a `validateStructure(ByteBuf, int)` method that performs non-destructive validation before deserialization:
- Checks minimum buffer size against `FIXED_BLOCK_SIZE`
- Validates offsets are non-negative and within bounds
- Validates array counts and string lengths against maximums
- Recursively validates nested structs
- Returns `ValidationResult.OK` or `ValidationResult.error(message)`

---

## 6. PacketRegistry

### Registration Architecture

**Source:** `PacketRegistry.java`

The `PacketRegistry` is a singleton class that maps packet IDs to metadata and deserialization functions. All registrations happen in a `static` initializer block.

```java
public final class PacketRegistry {
   private static final Map<Integer, PacketInfo> BY_ID = new HashMap<>();
   private static final Map<Integer, PacketInfo> TO_SERVER_BY_ID = new HashMap<>();
   private static final Map<Integer, PacketInfo> TO_CLIENT_BY_ID = new HashMap<>();
   private static final Map<Class<? extends Packet>, Integer> BY_TYPE = new HashMap<>();

   private static void register(
      PacketDirection direction,    // ToServer, ToClient, or Both
      NetworkChannel channel,       // Default, Chunks, or WorldMap
      int id,                       // Unique packet ID
      String name,                  // Human-readable name
      Class<? extends Packet> type, // Packet class
      int fixedBlockSize,           // Minimum guaranteed size
      int maxSize,                  // Maximum allowed payload size
      boolean compressed,           // Whether Zstd compression is used
      BiFunction<ByteBuf, Integer, ValidationResult> validate,
      BiFunction<ByteBuf, Integer, Packet> deserialize
   ) { ... }
}
```

### PacketInfo Record

```java
public static record PacketInfo(
   int id,
   @Nonnull String name,
   @Nonnull NetworkChannel channel,
   @Nonnull Class<? extends Packet> type,
   int fixedBlockSize,
   int maxSize,
   boolean compressed,
   @Nonnull BiFunction<ByteBuf, Integer, ValidationResult> validate,
   @Nonnull BiFunction<ByteBuf, Integer, Packet> deserialize
) { }
```

### Frame Format

**Source:** `io/netty/PacketDecoder.java` (lines 20-21, 84-86)

```
[4 bytes payload length LE] [4 bytes packet ID LE] [payload bytes...]
```

The decoder reads frames with:
- `LENGTH_PREFIX_SIZE = 4` (payload length, little-endian int32)
- `PACKET_ID_SIZE = 4` (packet ID, little-endian int32)
- `MIN_FRAME_SIZE = 8` (header only, no payload)

Maximum payload is `1,677,721,600` bytes (~1.6 GB), validated per-packet by `maxSize`.

### Packet ID Ranges

| Range | Category | Direction | Count |
|-------|----------|-----------|-------|
| 0-3 | Connection (Connect, Disconnect, Ping, Pong) | Mixed | 4 |
| 11-18 | Authentication (Auth, Password, Referral) | Mixed | 8 |
| 20-34 | Setup (WorldSettings, Assets, Features, Tags) | Mostly ToClient | ~15 |
| 40-85 | Asset Definitions (Block types, items, effects, sounds, etc.) | ToClient | ~46 |
| 100-119 | Player (SetClientId, Movement, Interaction, Debug) | Mixed | ~20 |
| 131-170 | World/Chunks (SetChunk, Blocks, Fluids, Particles, Weather, Time) | ToClient (Chunks channel) | ~40 |
| 200-238 | Interface (Chat, ServerInfo, Inventory, Windows, HUD, UI) | Mixed | ~39 |
| 240-246 | World Map (Settings, Map data, Markers) | Mixed (WorldMap channel for 241-242) | 7 |
| 250-252 | Server Access | Mixed | 3 |
| 260-262 | Machinima (Actor models, Scenes) | Mixed | 3 |
| 280-283 | Camera (ServerCamera, Shake, FlyCamera) | Mixed | 4 |
| 300-360 | Asset Editor (Full editing protocol) | Mixed | ~60 |
| 400-425 | Builder Tools (Selection, Transform, Entity manipulation) | Mostly ToServer | ~26 |

### Bidirectional Packets

Only a few packets are registered with `PacketDirection.Both`:
- **ID 1** `Disconnect` -- Either side can initiate disconnection
- **ID 32** `ViewRadius` -- Client can request, server can set
- **ID 262** `UpdateMachinimaScene` -- Bidirectional scene editing

### Compressed Packets

Packets with `compressed = true` use Zstd for payload compression. These are primarily large data transfers:
- **Asset definitions** (IDs 40-85) -- block types, items, effects, sounds
- **World data** (IDs 131-133) -- chunks, heightmaps, tintmaps
- **World settings** (ID 20)
- **UpdateAnchorUI** (ID 235)
- **UpdateMachinimaScene** (ID 262)
- **Request/Response assets** (IDs 23, 25)

### Timeout Handling

**Source:** `io/netty/PacketDecoder.java` (lines 50-78)

The decoder implements a heartbeat timeout check. If no packet is received within the configured `PACKET_TIMEOUT` duration (set via Netty channel attribute), the connection is closed with a `ReadTimeoutException`.

```java
private void checkTimeout(@Nonnull ChannelHandlerContext ctx) {
   Duration timeout = ctx.channel().attr(ProtocolUtil.PACKET_TIMEOUT_KEY).get();
   if (timeout != null) {
      long elapsedNanos = System.nanoTime() - this.lastPacketTimeNanos;
      if (elapsedNanos >= timeout.toNanos()) {
         this.cancelTimeoutCheck();
         ctx.fireExceptionCaught(ReadTimeoutException.INSTANCE);
         ctx.close();
      }
   }
}
```

The check runs every 1000ms (`CHECK_INTERVAL_MS`).

---

## Appendix: Byte Order and Endianness

All multi-byte integers and floats in the Hytale protocol are **little-endian** (LE). This is visible throughout the decompiled code:
- `buf.getIntLE()` / `buf.writeIntLE()`
- `buf.getFloatLE()` / `buf.writeFloatLE()`
- `buf.getShortLE()` / `buf.writeShortLE()`

The only exception is VarInt encoding, which is byte-order independent by design (MSB continuation bit per byte).
