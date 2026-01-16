---
id: ecs
title: ECS (Entity Component System)
sidebar_label: ECS
sidebar_position: 6
description: Complete documentation of the Hytale server ECS system
---

# Entity Component System (ECS)

:::info v2 Documentation - Verified
This documentation has been verified against decompiled server source code using multi-agent analysis. All information includes source file references.
:::

## What is an ECS?

An **Entity Component System** is a software architecture pattern commonly used in game development. It's fundamentally different from traditional object-oriented programming and offers significant performance and flexibility benefits.

### The Problem with Traditional OOP

In traditional object-oriented programming, you might create a class hierarchy like this:

```
GameObject
├── Character
│   ├── Player
│   ├── NPC
│   └── Enemy
├── Item
│   ├── Weapon
│   └── Consumable
└── Vehicle
```

This seems logical, but problems arise quickly:
- What if a Player can become a Vehicle (like a mount)?
- What if an Item needs health and can be attacked?
- Adding new behaviors requires modifying the class hierarchy

### The ECS Solution

ECS breaks everything into three simple concepts:

| Concept | What it is | Example |
|---------|------------|---------|
| **Entity** | Just an ID number | Entity #42 |
| **Component** | Pure data attached to entities | `Position(x: 10, y: 5, z: 20)`, `Health(current: 80, max: 100)` |
| **System** | Logic that processes entities with specific components | "Every tick, reduce hunger for entities with Hunger component" |

**Think of it like a spreadsheet:**

| Entity ID | Position | Health | Inventory | AI | Player |
|-----------|----------|--------|-----------|----|----|
| 1 | (10, 5, 20) | 100/100 | 64 items | - | Yes |
| 2 | (50, 10, 30) | 50/80 | - | Hostile | - |
| 3 | (0, 0, 0) | - | 10 items | - | - |

- Entity 1 is a Player with position, health, and inventory
- Entity 2 is an Enemy with position, health, and AI
- Entity 3 is a Chest with just position and inventory

### Why Hytale Uses ECS

1. **Performance**: Entities with the same components are stored together in memory (cache-friendly)
2. **Flexibility**: Add/remove behaviors at runtime by adding/removing components
3. **Parallelization**: Systems can run on different CPU cores simultaneously
4. **Modularity**: Systems are independent and can be added/removed easily

### Real-World Analogy

Imagine you're organizing a party and tracking guests:

- **OOP approach**: Create different classes for "VIP Guest", "Regular Guest", "Staff", etc. What about a VIP who is also Staff?
- **ECS approach**: Each person (entity) has tags/components: "HasVIPBadge", "IsStaff", "NeedsParking", etc. You can mix and match freely.

---

## Hytale's ECS Implementation

This documentation describes the Entity Component System (ECS) used by the Hytale server. This system is responsible for managing entities, their components, and the systems that process them.

## General Architecture

```
+-----------------------------------------------------------------------------------+
|                              ComponentRegistry                                     |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  | ComponentType|  | SystemType  |  | SystemGroup |  | ResourceType|               |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
+-----------------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------------+
|                                  Store                                             |
|  +-----------------+  +-----------------+  +-----------------+                     |
|  | ArchetypeChunk  |  | ArchetypeChunk  |  | ArchetypeChunk  |  (entity groups)    |
|  | [Entity,Entity] |  | [Entity,Entity] |  | [Entity,Entity] |                     |
|  +-----------------+  +-----------------+  +-----------------+                     |
|                                                                                    |
|  +-----------------+  +-----------------+  +-----------------+                     |
|  |    Resource     |  |    Resource     |  |    Resource     |  (global data)      |
|  +-----------------+  +-----------------+  +-----------------+                     |
+-----------------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------------+
|                                 Systems                                            |
|  +-----------------+  +-----------------+  +-----------------+                     |
|  | TickingSystem   |  | RefSystem       |  | EventSystem     |                     |
|  +-----------------+  +-----------------+  +-----------------+                     |
+-----------------------------------------------------------------------------------+
```

## Core Concepts

### 1. Component

A `Component` is a unit of data attached to an entity. It contains no logic, only data.

```java
public interface Component<ECS_TYPE> extends Cloneable {
    @Nullable
    Component<ECS_TYPE> clone();

    @Nullable
    default Component<ECS_TYPE> cloneSerializable() {
        return this.clone();
    }
}
```

**Example of a simple component:**

```java
public class TransformComponent implements Component<EntityStore> {
    private final Vector3d position = new Vector3d();
    private final Vector3f rotation = new Vector3f();

    public static final BuilderCodec<TransformComponent> CODEC =
        BuilderCodec.builder(TransformComponent.class, TransformComponent::new)
            .append(new KeyedCodec<>("Position", Vector3d.CODEC),
                    (o, i) -> o.position.assign(i), o -> o.position)
            .add()
            .append(new KeyedCodec<>("Rotation", Vector3f.ROTATION),
                    (o, i) -> o.rotation.assign(i), o -> o.rotation)
            .add()
            .build();

    @Nonnull
    public Vector3d getPosition() {
        return this.position;
    }

    @Nonnull
    @Override
    public Component<EntityStore> clone() {
        return new TransformComponent(this.position, this.rotation);
    }
}
```

### 2. ComponentType

A `ComponentType` is a unique identifier for a component type within the registry.

```java
public class ComponentType<ECS_TYPE, T extends Component<ECS_TYPE>>
    implements Comparable<ComponentType<ECS_TYPE, ?>>, Query<ECS_TYPE> {

    private ComponentRegistry<ECS_TYPE> registry;
    private Class<? super T> tClass;
    private int index;  // Unique index in the registry

    public int getIndex() { return this.index; }
    public Class<? super T> getTypeClass() { return this.tClass; }
}
```

### 3. Archetype

An `Archetype` represents a unique set of component types. All entities sharing the same archetype are stored together to optimize performance.

```java
public class Archetype<ECS_TYPE> implements Query<ECS_TYPE> {
    private final int minIndex;
    private final int count;
    private final ComponentType<ECS_TYPE, ?>[] componentTypes;

    // Create an archetype
    public static <ECS_TYPE> Archetype<ECS_TYPE> of(ComponentType<ECS_TYPE, ?>... componentTypes);

    // Add a component to the archetype
    public static <ECS_TYPE, T extends Component<ECS_TYPE>> Archetype<ECS_TYPE> add(
        Archetype<ECS_TYPE> archetype, ComponentType<ECS_TYPE, T> componentType);

    // Remove a component from the archetype
    public static <ECS_TYPE, T extends Component<ECS_TYPE>> Archetype<ECS_TYPE> remove(
        Archetype<ECS_TYPE> archetype, ComponentType<ECS_TYPE, T> componentType);

    // Check if the archetype contains a component type
    public boolean contains(ComponentType<ECS_TYPE, ?> componentType);
}
```

### 4. ArchetypeChunk

An `ArchetypeChunk` stores all entities that share the same archetype. It is a data structure optimized for cache access.

```java
public class ArchetypeChunk<ECS_TYPE> {
    protected final Store<ECS_TYPE> store;
    protected final Archetype<ECS_TYPE> archetype;
    protected int entitiesSize;
    protected Ref<ECS_TYPE>[] refs;           // Entity references
    protected Component<ECS_TYPE>[][] components;  // Component data

    // Get a component for an entity at a given index
    public <T extends Component<ECS_TYPE>> T getComponent(
        int index, ComponentType<ECS_TYPE, T> componentType);

    // Set a component
    public <T extends Component<ECS_TYPE>> void setComponent(
        int index, ComponentType<ECS_TYPE, T> componentType, T component);

    // Add an entity
    public int addEntity(Ref<ECS_TYPE> ref, Holder<ECS_TYPE> holder);

    // Remove an entity
    public Holder<ECS_TYPE> removeEntity(int entityIndex, Holder<ECS_TYPE> target);
}
```

### 5. Holder (EntityHolder)

A `Holder` is a temporary container for an entity's components before it is added to the Store.

```java
public class Holder<ECS_TYPE> {
    private Archetype<ECS_TYPE> archetype;
    private Component<ECS_TYPE>[] components;

    // Add a component
    public <T extends Component<ECS_TYPE>> void addComponent(
        ComponentType<ECS_TYPE, T> componentType, T component);

    // Get a component
    public <T extends Component<ECS_TYPE>> T getComponent(
        ComponentType<ECS_TYPE, T> componentType);

    // Remove a component
    public <T extends Component<ECS_TYPE>> void removeComponent(
        ComponentType<ECS_TYPE, T> componentType);

    // Ensure a component exists (create it if absent)
    public <T extends Component<ECS_TYPE>> void ensureComponent(
        ComponentType<ECS_TYPE, T> componentType);
}
```

### 6. Ref (Entity Reference)

A `Ref` is a reference to an entity in the Store. It contains the entity's index and can be invalidated.

```java
public class Ref<ECS_TYPE> {
    private final Store<ECS_TYPE> store;
    private volatile int index;

    public Store<ECS_TYPE> getStore() { return this.store; }
    public int getIndex() { return this.index; }

    public boolean isValid() { return this.index != Integer.MIN_VALUE; }
    public void validate() {
        if (!isValid()) throw new IllegalStateException("Invalid entity reference!");
    }
}
```

### 7. Store

The `Store` is the main container that manages all entities and their components.

```java
public class Store<ECS_TYPE> implements ComponentAccessor<ECS_TYPE> {
    private final ComponentRegistry<ECS_TYPE> registry;
    private final ECS_TYPE externalData;
    private Ref<ECS_TYPE>[] refs;
    private ArchetypeChunk<ECS_TYPE>[] archetypeChunks;
    private Resource<ECS_TYPE>[] resources;

    // Add an entity
    public Ref<ECS_TYPE> addEntity(Holder<ECS_TYPE> holder, AddReason reason);

    // Remove an entity (returns the entity's components in the holder)
    public Holder<ECS_TYPE> removeEntity(Ref<ECS_TYPE> ref, RemoveReason reason);

    // Remove an entity with target holder
    public Holder<ECS_TYPE> removeEntity(Ref<ECS_TYPE> ref, Holder<ECS_TYPE> holder, RemoveReason reason);

    // Get a component
    public <T extends Component<ECS_TYPE>> T getComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Get an entity's archetype
    public Archetype<ECS_TYPE> getArchetype(Ref<ECS_TYPE> ref);

    // Get a global resource
    public <T extends Resource<ECS_TYPE>> T getResource(ResourceType<ECS_TYPE, T> resourceType);
}
```

### 8. Resource

A `Resource` is global data shared across the entire Store (unlike Components, which are per-entity).

```java
public interface Resource<ECS_TYPE> extends Cloneable {
    Resource<ECS_TYPE> clone();
}
```

---

## ComponentRegistry

The `ComponentRegistry` is the central registry that manages all component types, systems, and resources.

```
+------------------------------------------------------------------+
|                        ComponentRegistry                          |
|                                                                   |
|  Components:                                                      |
|  +------------------+  +------------------+  +------------------+ |
|  | ComponentType[0] |  | ComponentType[1] |  | ComponentType[2] | |
|  | TransformComp    |  | BoundingBox      |  | UUIDComponent    | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  Resources:                                                       |
|  +------------------+  +------------------+                       |
|  | ResourceType[0]  |  | ResourceType[1]  |                       |
|  | SpatialResource  |  | WorldResource    |                       |
|  +------------------+  +------------------+                       |
|                                                                   |
|  SystemTypes:                                                     |
|  +------------------+  +------------------+  +------------------+ |
|  | TickingSystem    |  | RefSystem        |  | QuerySystem      | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  Systems (sorted by dependency):                                  |
|  +------------------+  +------------------+  +------------------+ |
|  | System[0]        |  | System[1]        |  | System[2]        | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
```

### Registering Components

```java
// Component without serialization
ComponentType<EntityStore, MyComponent> MY_COMPONENT =
    registry.registerComponent(MyComponent.class, MyComponent::new);

// Component with serialization (Codec)
ComponentType<EntityStore, TransformComponent> TRANSFORM =
    registry.registerComponent(TransformComponent.class, "Transform", TransformComponent.CODEC);
```

### Registering Resources

```java
// Resource without serialization
ResourceType<EntityStore, MyResource> MY_RESOURCE =
    registry.registerResource(MyResource.class, MyResource::new);

// Resource with serialization
ResourceType<EntityStore, MyResource> MY_RESOURCE =
    registry.registerResource(MyResource.class, "MyResource", MyResource.CODEC);
```

### Special Built-in Components

```java
// Marks an entity as not being ticked
ComponentType<ECS_TYPE, NonTicking<ECS_TYPE>> nonTickingComponentType;

// Marks an entity as not being serialized
ComponentType<ECS_TYPE, NonSerialized<ECS_TYPE>> nonSerializedComponentType;

// Stores unknown components during deserialization
ComponentType<ECS_TYPE, UnknownComponents<ECS_TYPE>> unknownComponentType;
```

---

## Creating a Custom Component

### Step 1: Define the Component Class

```java
public class HealthComponent implements Component<EntityStore> {

    // Codec for serialization
    public static final BuilderCodec<HealthComponent> CODEC =
        BuilderCodec.builder(HealthComponent.class, HealthComponent::new)
            .append(new KeyedCodec<>("MaxHealth", Codec.FLOAT),
                    (c, v) -> c.maxHealth = v, c -> c.maxHealth)
            .add()
            .append(new KeyedCodec<>("CurrentHealth", Codec.FLOAT),
                    (c, v) -> c.currentHealth = v, c -> c.currentHealth)
            .add()
            .build();

    private float maxHealth = 100.0f;
    private float currentHealth = 100.0f;

    public HealthComponent() {}

    public HealthComponent(float maxHealth, float currentHealth) {
        this.maxHealth = maxHealth;
        this.currentHealth = currentHealth;
    }

    // Getters and setters
    public float getMaxHealth() { return maxHealth; }
    public void setMaxHealth(float maxHealth) { this.maxHealth = maxHealth; }
    public float getCurrentHealth() { return currentHealth; }
    public void setCurrentHealth(float currentHealth) { this.currentHealth = currentHealth; }

    public void damage(float amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
    }

    public void heal(float amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    public boolean isDead() {
        return this.currentHealth <= 0;
    }

    // REQUIRED: Implementation of clone()
    @Override
    public Component<EntityStore> clone() {
        return new HealthComponent(this.maxHealth, this.currentHealth);
    }
}
```

### Step 2: Register the Component

```java
// In your module or initialization system
public class MyModule {
    private static ComponentType<EntityStore, HealthComponent> HEALTH_COMPONENT_TYPE;

    public static void init(ComponentRegistry<EntityStore> registry) {
        // Registration with serialization
        HEALTH_COMPONENT_TYPE = registry.registerComponent(
            HealthComponent.class,
            "Health",           // Unique ID for serialization
            HealthComponent.CODEC
        );
    }

    public static ComponentType<EntityStore, HealthComponent> getHealthComponentType() {
        return HEALTH_COMPONENT_TYPE;
    }
}
```

### Step 3: Use the Component

```java
// Create an entity with the component
Holder<EntityStore> holder = registry.newHolder();
holder.addComponent(MyModule.getHealthComponentType(), new HealthComponent(100, 100));
Ref<EntityStore> entityRef = store.addEntity(holder, AddReason.SPAWN);

// Access the component
HealthComponent health = store.getComponent(entityRef, MyModule.getHealthComponentType());
health.damage(25);

// Check if the entity has the component
Archetype<EntityStore> archetype = store.getArchetype(entityRef);
if (archetype.contains(MyModule.getHealthComponentType())) {
    // The entity has a Health component
}
```

---

## Query System

Queries allow you to filter entities based on their components.

### Query Interface

```java
public interface Query<ECS_TYPE> {
    // Tests whether an archetype matches the query
    boolean test(Archetype<ECS_TYPE> archetype);

    // Checks if the query depends on a specific component type
    boolean requiresComponentType(ComponentType<ECS_TYPE, ?> componentType);

    // Factory methods
    static <ECS_TYPE> AnyQuery<ECS_TYPE> any();           // Matches everything
    static <ECS_TYPE> NotQuery<ECS_TYPE> not(Query<ECS_TYPE> query);  // Negation
    static <ECS_TYPE> AndQuery<ECS_TYPE> and(Query<ECS_TYPE>... queries);  // Logical AND
    static <ECS_TYPE> OrQuery<ECS_TYPE> or(Query<ECS_TYPE>... queries);   // Logical OR
}
```

### Query Types

```
Query (interface)
  |
  +-- Archetype (an archetype is also a query)
  |
  +-- ComponentType (a ComponentType is also a query)
  |
  +-- AnyQuery (matches everything)
  |
  +-- NotQuery (negation)
  |
  +-- AndQuery (logical AND)
  |
  +-- OrQuery (logical OR)
  |
  +-- ExactArchetypeQuery (exact archetype match)
  |
  +-- ReadWriteArchetypeQuery (interface)
       |
       +-- ReadWriteQuery (implementation)
```

### ReadWriteQuery

The `ReadWriteQuery` distinguishes between read-only components and modified components.

```java
public class ReadWriteQuery<ECS_TYPE> implements ReadWriteArchetypeQuery<ECS_TYPE> {
    private final Archetype<ECS_TYPE> read;   // Components being read
    private final Archetype<ECS_TYPE> write;  // Components being modified

    public ReadWriteQuery(Archetype<ECS_TYPE> read, Archetype<ECS_TYPE> write) {
        this.read = read;
        this.write = write;
    }

    @Override
    public boolean test(Archetype<ECS_TYPE> archetype) {
        return archetype.contains(this.read) && archetype.contains(this.write);
    }
}
```

### Usage Examples

```java
// Simple query: all entities with TransformComponent
Query<EntityStore> hasTransform = TransformComponent.getComponentType();

// Combined query: entities with Transform AND Health
Query<EntityStore> query = Query.and(
    TransformComponent.getComponentType(),
    MyModule.getHealthComponentType()
);

// Query with negation: entities with Transform but WITHOUT Health
Query<EntityStore> query = Query.and(
    TransformComponent.getComponentType(),
    Query.not(MyModule.getHealthComponentType())
);

// Archetype as query
Archetype<EntityStore> archetype = Archetype.of(
    TransformComponent.getComponentType(),
    BoundingBox.getComponentType()
);
// Tests if an entity has AT LEAST these components

// ReadWriteQuery for a system that reads Transform and modifies Health
ReadWriteQuery<EntityStore> query = new ReadWriteQuery<>(
    Archetype.of(TransformComponent.getComponentType()),  // Read
    Archetype.of(MyModule.getHealthComponentType())       // Write
);
```

---

## Systems and SystemGroups

### System Hierarchy

```
ISystem (interface)
  |
  +-- System (abstract base)
       |
       +-- QuerySystem (interface) - systems that filter by archetype
       |    |
       |    +-- RefSystem - callback on entity add/remove
       |    |
       |    +-- HolderSystem - callback on holder before add
       |    |
       |    +-- TickingSystem
       |         |
       |         +-- ArchetypeTickingSystem
       |              |
       |              +-- EntityTickingSystem
       |
       +-- EventSystem
            |
            +-- EntityEventSystem - events on entities
            |
            +-- WorldEventSystem - global events
```

### ISystem

Base interface for all systems.

```java
public interface ISystem<ECS_TYPE> {
    // Lifecycle callbacks
    default void onSystemRegistered() {}
    default void onSystemUnregistered() {}

    // Group this system belongs to
    default SystemGroup<ECS_TYPE> getGroup() { return null; }

    // Dependencies for execution order
    default Set<Dependency<ECS_TYPE>> getDependencies() {
        return Collections.emptySet();
    }
}
```

### System (Base Class)

```java
public abstract class System<ECS_TYPE> implements ISystem<ECS_TYPE> {

    // Register a component associated with this system
    protected <T extends Component<ECS_TYPE>> ComponentType<ECS_TYPE, T> registerComponent(
        Class<? super T> tClass, Supplier<T> supplier);

    protected <T extends Component<ECS_TYPE>> ComponentType<ECS_TYPE, T> registerComponent(
        Class<? super T> tClass, String id, BuilderCodec<T> codec);

    // Register a resource associated with this system
    public <T extends Resource<ECS_TYPE>> ResourceType<ECS_TYPE, T> registerResource(
        Class<? super T> tClass, Supplier<T> supplier);
}
```

### TickingSystem

A system that executes on every tick.

```java
public abstract class TickingSystem<ECS_TYPE> extends System<ECS_TYPE>
    implements TickableSystem<ECS_TYPE> {

    // dt = delta time, systemIndex = index of the system
    public abstract void tick(float dt, int systemIndex, Store<ECS_TYPE> store);
}
```

### ArchetypeTickingSystem

A ticking system that filters by archetype.

```java
public abstract class ArchetypeTickingSystem<ECS_TYPE> extends TickingSystem<ECS_TYPE>
    implements QuerySystem<ECS_TYPE> {

    // Query to filter entities
    public abstract Query<ECS_TYPE> getQuery();

    // Tick on each matching ArchetypeChunk
    public abstract void tick(
        float dt,
        ArchetypeChunk<ECS_TYPE> archetypeChunk,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );
}
```

### EntityTickingSystem

A ticking system that iterates over each entity.

```java
public abstract class EntityTickingSystem<ECS_TYPE> extends ArchetypeTickingSystem<ECS_TYPE> {

    // Tick on a specific entity
    public abstract void tick(
        float dt,
        int index,                         // Index in the ArchetypeChunk
        ArchetypeChunk<ECS_TYPE> archetypeChunk,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );

    // Parallelism support
    public boolean isParallel(int archetypeChunkSize, int taskCount) {
        return false;
    }
}
```

### RefSystem

A system that reacts to entity addition and removal.

```java
public abstract class RefSystem<ECS_TYPE> extends System<ECS_TYPE>
    implements QuerySystem<ECS_TYPE> {

    // Query to filter relevant entities
    public abstract Query<ECS_TYPE> getQuery();

    // Called when an entity matching the query is added
    public abstract void onEntityAdded(
        Ref<ECS_TYPE> ref,
        AddReason reason,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );

    // Called when an entity matching the query is removed
    public abstract void onEntityRemove(
        Ref<ECS_TYPE> ref,
        RemoveReason reason,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );
}
```

### SystemGroup

A group of systems for organizing execution order.

```java
public class SystemGroup<ECS_TYPE> {
    private final ComponentRegistry<ECS_TYPE> registry;
    private final int index;
    private final Set<Dependency<ECS_TYPE>> dependencies;
}
```

### Dependencies (Execution Order)

```java
public enum Order {
    BEFORE,  // Execute before the dependency
    AFTER    // Execute after the dependency
}

public abstract class Dependency<ECS_TYPE> {
    protected final Order order;
    protected final int priority;

    public Dependency(Order order, int priority);
    public Dependency(Order order, OrderPriority priority);
}

// Dependency types
// - SystemDependency: dependency on a specific system
// - SystemTypeDependency: dependency on a system type
// - SystemGroupDependency: dependency on a system group
// - RootDependency: root dependency
```

---

## Complete Example: Creating a System

```java
public class HealthRegenSystem extends EntityTickingSystem<EntityStore> {

    private static ComponentType<EntityStore, HealthComponent> HEALTH;

    // Query: entities with Health
    private final Query<EntityStore> query;

    public HealthRegenSystem() {
        HEALTH = this.registerComponent(
            HealthComponent.class,
            "Health",
            HealthComponent.CODEC
        );
        this.query = HEALTH;
    }

    @Override
    public Query<EntityStore> getQuery() {
        return this.query;
    }

    @Override
    public Set<Dependency<EntityStore>> getDependencies() {
        // Execute after the damage system
        return Set.of(
            new SystemTypeDependency<>(Order.AFTER, DamageSystem.class)
        );
    }

    @Override
    public void tick(
        float dt,
        int index,
        ArchetypeChunk<EntityStore> chunk,
        Store<EntityStore> store,
        CommandBuffer<EntityStore> buffer
    ) {
        // Get the Health component for this entity
        HealthComponent health = chunk.getComponent(index, HEALTH);

        // Regenerate 1 HP per second
        if (!health.isDead()) {
            health.heal(dt * 1.0f);
        }
    }
}
```

---

## Entities: Entity, LivingEntity, Player

### Entity Hierarchy

```
Component<EntityStore> (interface)
  |
  +-- Entity (abstract)
       |
       +-- LivingEntity (abstract)
       |    |
       |    +-- Player
       |    |
       |    +-- (other living entities)
       |
       +-- BlockEntity
       |
       +-- (other entity types)
```

### Entity

The base class for all game entities.

```java
public abstract class Entity implements Component<EntityStore> {
    protected int networkId = -1;
    protected World world;
    protected Ref<EntityStore> reference;
    protected final AtomicBoolean wasRemoved = new AtomicBoolean();

    // Codec for serialization
    public static final BuilderCodec<Entity> CODEC =
        BuilderCodec.abstractBuilder(Entity.class)
            .legacyVersioned()
            .codecVersion(5)
            .append(DISPLAY_NAME, ...)
            .append(UUID, ...)
            .build();

    // Remove the entity from the world
    public boolean remove();

    // Load the entity into a world
    public void loadIntoWorld(World world);

    // Reference to the entity in the ECS
    public Ref<EntityStore> getReference();

    // Convert to Holder for serialization/copying
    public Holder<EntityStore> toHolder();
}
```

### LivingEntity

An entity with an inventory and stats.

```java
public abstract class LivingEntity extends Entity {
    private final StatModifiersManager statModifiersManager = new StatModifiersManager();
    private Inventory inventory;
    protected double currentFallDistance;

    public static final BuilderCodec<LivingEntity> CODEC =
        BuilderCodec.abstractBuilder(LivingEntity.class, Entity.CODEC)
            .append(new KeyedCodec<>("Inventory", Inventory.CODEC), ...)
            .build();

    // Create the default inventory
    protected abstract Inventory createDefaultInventory();

    // Inventory management
    public Inventory getInventory();
    public Inventory setInventory(Inventory inventory);

    // Fall damage management
    public double getCurrentFallDistance();

    // Stat modifiers
    public StatModifiersManager getStatModifiersManager();
}
```

### Player

The connected player.

```java
public class Player extends LivingEntity implements CommandSender, PermissionHolder {
    private PlayerRef playerRef;
    private PlayerConfigData data;
    private final WorldMapTracker worldMapTracker;
    private final WindowManager windowManager;
    private final PageManager pageManager;
    private final HudManager hudManager;
    private HotbarManager hotbarManager;
    private GameMode gameMode;

    public static final BuilderCodec<Player> CODEC =
        BuilderCodec.builder(Player.class, Player::new, LivingEntity.CODEC)
            .append(PLAYER_CONFIG_DATA, ...)
            .append(GameMode, ...)
            .build();

    // ComponentType to identify players
    public static ComponentType<EntityStore, Player> getComponentType() {
        return EntityModule.get().getPlayerComponentType();
    }

    // Player initialization
    public void init(UUID uuid, PlayerRef playerRef);

    // GameMode management
    public GameMode getGameMode();
    public static void setGameMode(@Nonnull Ref<EntityStore> playerRef, @Nonnull GameMode gameMode, @Nonnull ComponentAccessor<EntityStore> componentAccessor);

    // UI managers
    public WindowManager getWindowManager();
    public PageManager getPageManager();
    public HudManager getHudManager();
}
```

---

## Important Built-in Components

### TransformComponent

The position and rotation of an entity.

```java
public class TransformComponent implements Component<EntityStore> {
    private final Vector3d position = new Vector3d();
    private final Vector3f rotation = new Vector3f();

    public static ComponentType<EntityStore, TransformComponent> getComponentType();

    public Vector3d getPosition();
    public Vector3f getRotation();
    public Transform getTransform();

    // Setter methods
    public void setPosition(@Nonnull Vector3d position);
    public void setRotation(@Nonnull Vector3f rotation);

    // Teleport methods - handles NaN values
    public void teleportPosition(@Nonnull Vector3d position);
    public void teleportRotation(@Nonnull Vector3f rotation);
}
```

### BoundingBox

The collision box of an entity.

```java
public class BoundingBox implements Component<EntityStore> {
    private final Box boundingBox = new Box();

    public static ComponentType<EntityStore, BoundingBox> getComponentType();

    public Box getBoundingBox();
    public void setBoundingBox(Box boundingBox);
}
```

### UUIDComponent

The persistent unique identifier of an entity.

```java
public final class UUIDComponent implements Component<EntityStore> {
    private UUID uuid;

    public static ComponentType<EntityStore, UUIDComponent> getComponentType();

    public UUID getUuid();

    public static UUIDComponent generateVersion3UUID();
    public static UUIDComponent randomUUID();
}
```

### NonTicking

Marks an entity so that it is not processed by TickingSystems.

```java
public class NonTicking<ECS_TYPE> implements Component<ECS_TYPE> {
    private static final NonTicking<?> INSTANCE = new NonTicking();

    public static <ECS_TYPE> NonTicking<ECS_TYPE> get();
}

// Usage: add this component to disable ticking
holder.addComponent(registry.getNonTickingComponentType(), NonTicking.get());
```

### NonSerialized

Marks an entity so that it is not saved.

```java
public class NonSerialized<ECS_TYPE> implements Component<ECS_TYPE> {
    private static final NonSerialized<?> INSTANCE = new NonSerialized();

    public static <ECS_TYPE> NonSerialized<ECS_TYPE> get();
}

// Usage: add this component to prevent saving
holder.addComponent(registry.getNonSerializedComponentType(), NonSerialized.get());
```

### Other Important Components

| Component | Description |
|-----------|-------------|
| `Velocity` | Entity velocity |
| `CollisionResultComponent` | Collision results |
| `ModelComponent` | Entity 3D model |
| `DisplayNameComponent` | Display name |
| `MovementStatesComponent` | Movement states (on ground, flying, etc.) |
| `KnockbackComponent` | Knockback after a hit |
| `DamageDataComponent` | Damage data received |
| `ProjectileComponent` | Component for projectiles |
| `EffectControllerComponent` | Active effects on the entity |

---

## CommandBuffer

The `CommandBuffer` allows deferred (thread-safe) modifications to the Store.

### How to Obtain a CommandBuffer

**Important:** There is no `store.getCommandBuffer()` method. CommandBuffer is obtained through:

1. **In ECS Systems** - passed as parameter to tick methods:
```java
public void tick(Ref<EntityStore> ref, float dt, CommandBuffer<EntityStore> buffer) {
    // buffer is provided by the system
}
```

2. **In InteractionContext** - when handling interactions:
```java
public void execute(InteractionContext context) {
    CommandBuffer<EntityStore> buffer = context.getCommandBuffer();
}
```

3. **Via Store.forEachChunk** - when iterating archetype chunks:
```java
store.forEachChunk(query, (archetypeChunk, buffer) -> {
    // buffer is provided per-chunk
    for (int i = 0; i < archetypeChunk.size(); i++) {
        Ref<EntityStore> ref = archetypeChunk.getReferenceTo(i);
        // process entity
    }
});
```

### Class Definition

```java
public class CommandBuffer<ECS_TYPE> implements ComponentAccessor<ECS_TYPE> {
    private final Store<ECS_TYPE> store;
    private final Deque<Consumer<Store<ECS_TYPE>>> queue;

    // Add an action to execute later
    public void run(Consumer<Store<ECS_TYPE>> consumer);

    // Add an entity
    public Ref<ECS_TYPE> addEntity(Holder<ECS_TYPE> holder, AddReason reason);

    // Remove an entity
    public void removeEntity(Ref<ECS_TYPE> ref, RemoveReason reason);

    // Read a component (immediate access)
    public <T extends Component<ECS_TYPE>> T getComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Add a component to an entity
    public <T extends Component<ECS_TYPE>> void addComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType, T component);

    // Remove a component from an entity
    public <T extends Component<ECS_TYPE>> void removeComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Invoke an event on an entity (uses event type from annotation)
    public <Event extends EcsEvent> void invoke(Ref<ECS_TYPE> ref, Event event);

    // Invoke an event on an entity with explicit event type
    public <Event extends EcsEvent> void invoke(
        EntityEventType<ECS_TYPE, Event> eventType, Ref<ECS_TYPE> ref, Event event);

    // Invoke a world event (uses event type from annotation)
    public <Event extends EcsEvent> void invoke(Event event);

    // Invoke a world event with explicit event type
    public <Event extends EcsEvent> void invoke(
        WorldEventType<ECS_TYPE, Event> eventType, Event event);
}
```

---

## AddReason and RemoveReason

Enumerations indicating why an entity is added or removed.

```java
public enum AddReason {
    SPAWN,  // New entity created
    LOAD    // Entity loaded from save
}

public enum RemoveReason {
    REMOVE,  // Entity permanently removed
    UNLOAD   // Entity unloaded (saved)
}
```

---

## Data Flow

```
1. ENTITY CREATION
   +---------------+     +---------+     +--------+     +--------------+
   | Create Holder | --> | Add to  | --> | Store  | --> | RefSystems   |
   | with Components|     | Store   |     | assigns|     | onEntityAdded|
   +---------------+     +---------+     | Ref    |     +--------------+
                                          +--------+

2. TICK
   +--------+     +-----------------+     +------------------+
   | Store  | --> | For each System | --> | For each matching|
   | .tick()|     | (sorted)        |     | ArchetypeChunk   |
   +--------+     +-----------------+     +------------------+
                                                   |
                                                   v
                                          +------------------+
                                          | System.tick()    |
                                          | (with buffer)    |
                                          +------------------+

3. ARCHETYPE MODIFICATION (component add/remove)
   +-------------+     +------------------+     +------------------+
   | CommandBuffer| --> | Remove from old  | --> | Add to new       |
   | .addComponent|     | ArchetypeChunk   |     | ArchetypeChunk   |
   +-------------+     +------------------+     +------------------+

4. ENTITY REMOVAL
   +-------------+     +--------------+     +------------------+
   | CommandBuffer| --> | RefSystems   | --> | Remove from      |
   | .removeEntity|     | onEntityRemove|     | ArchetypeChunk   |
   +-------------+     +--------------+     +------------------+
```

---

## Best Practices

1. **Keep components simple**: Components should be simple data containers without complex logic.

2. **One responsibility per system**: Each system should have a single, clear responsibility.

3. **Use the CommandBuffer**: Never modify the Store directly during a tick. Always use the CommandBuffer.

4. **Efficient queries**: Use Archetypes rather than complex queries when possible.

5. **NonTicking for static entities**: Add `NonTicking` to entities that do not need to be updated.

6. **NonSerialized for temporary entities**: Add `NonSerialized` to entities that should not be saved.

7. **Explicit dependencies**: Always declare dependencies between systems to ensure correct execution order.

8. **Mandatory clone()**: Always implement `clone()` correctly for components that need to be copied.

---

## Additional Built-in Components Reference

The following sections document additional ECS components found in the decompiled server source code. These components provide essential functionality for entity behavior, networking, and rendering.

### Invulnerable

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `Invulnerable` component is a marker component (tag) that makes an entity immune to damage. It uses the singleton pattern - there is only one instance shared by all invulnerable entities.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Invulnerable.java`

```java
public class Invulnerable implements Component<EntityStore> {
   public static final Invulnerable INSTANCE = new Invulnerable();
   public static final BuilderCodec<Invulnerable> CODEC =
       BuilderCodec.builder(Invulnerable.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, Invulnerable> getComponentType() {
      return EntityModule.get().getInvulnerableComponentType();
   }

   private Invulnerable() {}

   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Make an entity invulnerable
commandBuffer.addComponent(ref, Invulnerable.getComponentType(), Invulnerable.INSTANCE);

// Remove invulnerability
commandBuffer.removeComponent(ref, Invulnerable.getComponentType());

// Check if entity is invulnerable
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isInvulnerable = archetype.contains(Invulnerable.getComponentType());
```

**Usage notes:**
- The component is automatically synced to clients via `InvulnerableSystems.EntityTrackerUpdate`
- When added, it queues a `ComponentUpdate` with type `ComponentUpdateType.Invulnerable` to all viewers
- When removed, it sends a remove notification to all viewing clients

---

### Intangible

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `Intangible` component is a marker component that makes an entity non-collidable. Other entities and projectiles will pass through intangible entities. Like `Invulnerable`, it uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Intangible.java`

```java
public class Intangible implements Component<EntityStore> {
   public static final Intangible INSTANCE = new Intangible();
   public static final BuilderCodec<Intangible> CODEC =
       BuilderCodec.builder(Intangible.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, Intangible> getComponentType() {
      return EntityModule.get().getIntangibleComponentType();
   }

   private Intangible() {}

   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Make an entity intangible (non-collidable)
holder.ensureComponent(Intangible.getComponentType());
// or
commandBuffer.addComponent(ref, Intangible.getComponentType(), Intangible.INSTANCE);

// Remove intangibility
commandBuffer.removeComponent(ref, Intangible.getComponentType());
```

**Usage notes:**
- Commonly used for dropped item entities to prevent collision with other items
- Synced to clients via `IntangibleSystems.EntityTrackerUpdate`
- Used in `ItemComponent.generateItemDrop()` to make dropped items intangible

---

### Interactable

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `Interactable` component marks an entity as interactable by players. This enables interaction events (like right-click actions) to be processed for the entity.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Interactable.java`

```java
public class Interactable implements Component<EntityStore> {
   @Nonnull
   public static final Interactable INSTANCE = new Interactable();
   @Nonnull
   public static final BuilderCodec<Interactable> CODEC =
       BuilderCodec.builder(Interactable.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, Interactable> getComponentType() {
      return EntityModule.get().getInteractableComponentType();
   }

   private Interactable() {}

   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Make an entity interactable
holder.addComponent(Interactable.getComponentType(), Interactable.INSTANCE);

// Remove interactability
commandBuffer.removeComponent(ref, Interactable.getComponentType());
```

**Usage notes:**
- Used for NPCs, containers, and other entities that players can interact with
- The interaction logic is handled by separate systems that query for this component

---

### ItemComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

The `ItemComponent` represents a dropped item in the world. It contains the item stack data, pickup delays, merge delays, and provides utilities for creating item drops and handling pickups.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/ItemComponent.java`

```java
public class ItemComponent implements Component<EntityStore> {
   @Nonnull
   public static final BuilderCodec<ItemComponent> CODEC = BuilderCodec.builder(ItemComponent.class, ItemComponent::new)
      .append(new KeyedCodec<>("Item", ItemStack.CODEC), ...)
      .append(new KeyedCodec<>("StackDelay", Codec.FLOAT), ...)
      .append(new KeyedCodec<>("PickupDelay", Codec.FLOAT), ...)
      .append(new KeyedCodec<>("PickupThrottle", Codec.FLOAT), ...)
      .append(new KeyedCodec<>("RemovedByPlayerPickup", Codec.BOOLEAN), ...)
      .build();

   public static final float DEFAULT_PICKUP_DELAY = 0.5F;
   public static final float PICKUP_DELAY_DROPPED = 1.5F;
   public static final float PICKUP_THROTTLE = 0.25F;
   public static final float DEFAULT_MERGE_DELAY = 1.5F;

   @Nullable
   private ItemStack itemStack;
   private boolean isNetworkOutdated;
   private float mergeDelay = 1.5F;
   private float pickupDelay = 0.5F;
   private float pickupThrottle;
   private boolean removedByPlayerPickup;
   private float pickupRange = -1.0F;

   // ... methods
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `itemStack` | `ItemStack` | null | The item stack this entity represents |
| `mergeDelay` | float | 1.5 | Delay before items can merge (seconds) |
| `pickupDelay` | float | 0.5 | Delay before item can be picked up (seconds) |
| `pickupThrottle` | float | 0.25 | Cooldown between pickup attempts |
| `removedByPlayerPickup` | boolean | false | Whether item was removed by player pickup |
| `pickupRange` | float | -1.0 | Range for pickup (-1 = use config default) |

**How to create item drops:**

```java
// Create a single item drop
Holder<EntityStore> itemHolder = ItemComponent.generateItemDrop(
    accessor,           // ComponentAccessor
    itemStack,          // ItemStack to drop
    position,           // Vector3d position
    rotation,           // Vector3f rotation
    velocityX,          // float horizontal velocity
    velocityY,          // float vertical velocity (3.25F default)
    velocityZ           // float horizontal velocity
);
store.addEntity(itemHolder, AddReason.SPAWN);

// Create multiple item drops from a list
Holder<EntityStore>[] items = ItemComponent.generateItemDrops(
    accessor, itemStacks, position, rotation
);

// Add item to a container (handles partial pickup)
ItemStack pickedUp = ItemComponent.addToItemContainer(store, itemRef, itemContainer);
```

**Usage notes:**
- Automatically assigns `Intangible`, `Velocity`, `PhysicsValues`, `UUIDComponent`, and `DespawnComponent`
- Item lifetime defaults to 120 seconds (configurable via `ItemEntityConfig`)
- Can emit dynamic light if the item/block has a light property

---

### PlayerInput

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

The `PlayerInput` component handles player input updates including movement, rotation, and mount control. It queues input updates that are processed by player systems.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerInput.java`

```java
public class PlayerInput implements Component<EntityStore> {
   @Nonnull
   private final List<PlayerInput.InputUpdate> inputUpdateQueue = new ObjectArrayList<>();
   private int mountId;

   public static ComponentType<EntityStore, PlayerInput> getComponentType() {
      return EntityModule.get().getPlayerInputComponentType();
   }

   public void queue(PlayerInput.InputUpdate inputUpdate);
   @Nonnull
   public List<PlayerInput.InputUpdate> getMovementUpdateQueue();
   public int getMountId();
   public void setMountId(int mountId);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `inputUpdateQueue` | `List<InputUpdate>` | Queue of pending input updates |
| `mountId` | int | Network ID of the mount entity (0 = not mounted) |

**Input Update Types:**

| Type | Description |
|------|-------------|
| `AbsoluteMovement` | Teleport to absolute position (x, y, z) |
| `RelativeMovement` | Move relative to current position |
| `WishMovement` | Desired movement direction |
| `SetBody` | Set body rotation (pitch, yaw, roll) |
| `SetHead` | Set head rotation (pitch, yaw, roll) |
| `SetMovementStates` | Set movement state flags |
| `SetClientVelocity` | Set velocity from client |
| `SetRiderMovementStates` | Set movement states while riding |

**How to use:**

```java
// Queue an absolute movement
PlayerInput input = store.getComponent(playerRef, PlayerInput.getComponentType());
input.queue(new PlayerInput.AbsoluteMovement(x, y, z));

// Queue a head rotation change
input.queue(new PlayerInput.SetHead(new Direction(pitch, yaw, roll)));
```

---

### NetworkId

**Package:** `com.hypixel.hytale.server.core.modules.entity.tracker`

The `NetworkId` component assigns a unique network identifier to an entity for client-server synchronization. This ID is used in network packets to reference entities.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/tracker/NetworkId.java`

```java
public final class NetworkId implements Component<EntityStore> {
   private final int id;

   @Nonnull
   public static ComponentType<EntityStore, NetworkId> getComponentType() {
      return EntityModule.get().getNetworkIdComponentType();
   }

   public NetworkId(int id) {
      this.id = id;
   }

   public int getId() {
      return this.id;
   }

   @Nonnull
   @Override
   public Component<EntityStore> clone() {
      return this;  // Immutable - returns same instance
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | int | Unique network identifier for the entity |

**How to add:**

```java
// Get next network ID from world and assign to entity
int networkId = world.getExternalData().takeNextNetworkId();
holder.addComponent(NetworkId.getComponentType(), new NetworkId(networkId));

// Or during entity generation
holder.addComponent(NetworkId.getComponentType(),
    new NetworkId(ref.getStore().getExternalData().takeNextNetworkId()));
```

**Usage notes:**
- Network IDs are assigned automatically by the entity tracker system for tracked entities
- The component is immutable - `clone()` returns the same instance
- Used extensively in packet serialization for entity references

---

### Frozen

**Package:** `com.hypixel.hytale.server.core.entity`

The `Frozen` component is a marker component that stops an entity from moving or being affected by physics. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/Frozen.java`

```java
public class Frozen implements Component<EntityStore> {
   public static final BuilderCodec<Frozen> CODEC =
       BuilderCodec.builder(Frozen.class, Frozen::get).build();
   private static final Frozen INSTANCE = new Frozen();

   public static ComponentType<EntityStore, Frozen> getComponentType() {
      return EntityModule.get().getFrozenComponentType();
   }

   public static Frozen get() {
      return INSTANCE;
   }

   private Frozen() {}

   @Override
   public Component<EntityStore> clone() {
      return get();
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Freeze an entity
commandBuffer.addComponent(ref, Frozen.getComponentType(), Frozen.get());

// Unfreeze an entity
commandBuffer.removeComponent(ref, Frozen.getComponentType());
```

**Usage notes:**
- Useful for cutscenes, dialogue, or pausing entities
- Does not make the entity invulnerable - combine with `Invulnerable` if needed

---

### Teleport

**Package:** `com.hypixel.hytale.server.core.modules.entity.teleport`

The `Teleport` component is used to teleport an entity to a new position, rotation, and optionally a different world. It is a transient component that is automatically removed after the teleport is processed.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/teleport/Teleport.java`

```java
public class Teleport implements Component<EntityStore> {
   @Nullable
   private final World world;
   @Nonnull
   private final Vector3d position = new Vector3d();
   @Nonnull
   private final Vector3f rotation = new Vector3f();
   @Nullable
   private Vector3f headRotation;
   private boolean resetVelocity = true;

   @Nonnull
   public static ComponentType<EntityStore, Teleport> getComponentType() {
      return EntityModule.get().getTeleportComponentType();
   }

   // Constructors
   public Teleport(@Nullable World world, @Nonnull Vector3d position, @Nonnull Vector3f rotation);
   public Teleport(@Nonnull Vector3d position, @Nonnull Vector3f rotation);
   public Teleport(@Nullable World world, @Nonnull Transform transform);
   public Teleport(@Nonnull Transform transform);

   // Fluent modifiers
   @Nonnull
   public Teleport withHeadRotation(@Nonnull Vector3f headRotation);
   public Teleport withResetRoll();
   public Teleport withoutVelocityReset();

   // Getters
   @Nullable
   public World getWorld();
   @Nonnull
   public Vector3d getPosition();
   @Nonnull
   public Vector3f getRotation();
   @Nullable
   public Vector3f getHeadRotation();
   public boolean isResetVelocity();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `world` | `World` | null | Target world (null = same world) |
| `position` | `Vector3d` | - | Target position |
| `rotation` | `Vector3f` | - | Target body rotation |
| `headRotation` | `Vector3f` | null | Target head rotation (optional) |
| `resetVelocity` | boolean | true | Whether to reset velocity after teleport |

**How to teleport an entity:**

```java
// Teleport to position in same world
commandBuffer.addComponent(ref, Teleport.getComponentType(),
    new Teleport(new Vector3d(100, 64, 200), new Vector3f(0, 90, 0)));

// Teleport to a different world
commandBuffer.addComponent(ref, Teleport.getComponentType(),
    new Teleport(targetWorld, position, rotation));

// Teleport with head rotation and without resetting velocity
Teleport teleport = new Teleport(position, rotation)
    .withHeadRotation(headRotation)
    .withoutVelocityReset();
commandBuffer.addComponent(ref, Teleport.getComponentType(), teleport);
```

**Usage notes:**
- The `Teleport` component is processed by `TeleportSystems.MoveSystem` (for entities) or `TeleportSystems.PlayerMoveSystem` (for players)
- For players, teleportation sends a `ClientTeleport` packet and waits for acknowledgment
- The component is automatically removed after processing
- Cross-world teleportation moves the entity between stores

---

### EntityScaleComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `EntityScaleComponent` controls the visual scale of an entity. This affects the rendered size of the entity's model on clients.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/EntityScaleComponent.java`

```java
public class EntityScaleComponent implements Component<EntityStore> {
   public static final BuilderCodec<EntityScaleComponent> CODEC =
       BuilderCodec.builder(EntityScaleComponent.class, EntityScaleComponent::new)
          .addField(new KeyedCodec<>("Scale", Codec.FLOAT),
              (o, scale) -> o.scale = scale, o -> o.scale)
          .build();

   private float scale = 1.0F;
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, EntityScaleComponent> getComponentType() {
      return EntityModule.get().getEntityScaleComponentType();
   }

   private EntityScaleComponent() {}
   public EntityScaleComponent(float scale) {
      this.scale = scale;
   }

   public float getScale();
   public void setScale(float scale);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scale` | float | 1.0 | Scale multiplier (1.0 = normal size) |
| `isNetworkOutdated` | boolean | true | Internal flag for network sync |

**How to use:**

```java
// Create entity with custom scale
holder.addComponent(EntityScaleComponent.getComponentType(),
    new EntityScaleComponent(2.0f));  // Double size

// Modify scale at runtime
EntityScaleComponent scaleComponent = store.getComponent(ref,
    EntityScaleComponent.getComponentType());
scaleComponent.setScale(0.5f);  // Half size
```

**Usage notes:**
- Changes to scale are automatically synchronized to clients
- Only affects visual rendering, not collision/hitbox
- Scale of 0 or negative values may cause undefined behavior

---

### HitboxCollision

**Package:** `com.hypixel.hytale.server.core.modules.entity.hitboxcollision`

The `HitboxCollision` component defines how an entity's hitbox interacts with other entities. It references a `HitboxCollisionConfig` asset that defines collision behavior.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/hitboxcollision/HitboxCollision.java`

```java
public class HitboxCollision implements Component<EntityStore> {
   public static final BuilderCodec<HitboxCollision> CODEC =
       BuilderCodec.builder(HitboxCollision.class, HitboxCollision::new)
          .append(new KeyedCodec<>("HitboxCollisionConfigIndex", Codec.INTEGER), ...)
          .build();

   private int hitboxCollisionConfigIndex;
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, HitboxCollision> getComponentType() {
      return EntityModule.get().getHitboxCollisionComponentType();
   }

   public HitboxCollision(@Nonnull HitboxCollisionConfig hitboxCollisionConfig) {
      this.hitboxCollisionConfigIndex =
          HitboxCollisionConfig.getAssetMap().getIndexOrDefault(hitboxCollisionConfig.getId(), -1);
   }

   public int getHitboxCollisionConfigIndex();
   public void setHitboxCollisionConfigIndex(int hitboxCollisionConfigIndex);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `hitboxCollisionConfigIndex` | int | - | Index into `HitboxCollisionConfig` asset map |
| `isNetworkOutdated` | boolean | true | Internal flag for network sync |

**HitboxCollisionConfig properties:**

| Property | Type | Description |
|----------|------|-------------|
| `CollisionType` | `CollisionType` | `Hard` (block movement) or `Soft` (slow down) |
| `SoftCollisionOffsetRatio` | float | Movement ratio when passing through soft collision |

**How to use:**

```java
// Get a hitbox collision config from assets
HitboxCollisionConfig config = HitboxCollisionConfig.getAssetMap().getAsset("mymod:soft_hitbox");

// Add hitbox collision to an entity
holder.addComponent(HitboxCollision.getComponentType(), new HitboxCollision(config));

// Modify hitbox collision at runtime
HitboxCollision hitbox = store.getComponent(ref, HitboxCollision.getComponentType());
hitbox.setHitboxCollisionConfigIndex(newConfigIndex);
```

**Usage notes:**
- Used for entity-to-entity collision (not block collision)
- `Hard` collision type blocks movement completely
- `Soft` collision type allows passing through with reduced speed

---

### Nameplate

**Package:** `com.hypixel.hytale.server.core.entity.nameplate`

The `Nameplate` component displays a floating text label above an entity. This is commonly used for player names, NPC names, or custom labels.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/nameplate/Nameplate.java`

```java
public class Nameplate implements Component<EntityStore> {
   @Nonnull
   public static final BuilderCodec<Nameplate> CODEC =
       BuilderCodec.builder(Nameplate.class, Nameplate::new)
          .append(new KeyedCodec<>("Text", Codec.STRING),
              (nameplate, s) -> nameplate.text = s, nameplate -> nameplate.text)
          .documentation("The contents to display as the nameplate text.")
          .addValidator(Validators.nonNull())
          .build();

   @Nonnull
   private String text = "";
   private boolean isNetworkOutdated = true;

   @Nonnull
   public static ComponentType<EntityStore, Nameplate> getComponentType() {
      return EntityModule.get().getNameplateComponentType();
   }

   public Nameplate() {}
   public Nameplate(@Nonnull String text) {
      this.text = text;
   }

   @Nonnull
   public String getText();
   public void setText(@Nonnull String text);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | String | "" | The text to display above the entity |
| `isNetworkOutdated` | boolean | true | Internal flag for network sync |

**How to use:**

```java
// Create entity with a nameplate
holder.addComponent(Nameplate.getComponentType(), new Nameplate("Shop Keeper"));

// Modify nameplate text at runtime
Nameplate nameplate = store.getComponent(ref, Nameplate.getComponentType());
nameplate.setText("New Name");  // Only updates if text changed

// Remove nameplate
commandBuffer.removeComponent(ref, Nameplate.getComponentType());
```

**Usage notes:**
- Text changes are automatically synced to clients when modified
- The `setText` method only marks the component as outdated if the text actually changes
- Empty string displays no nameplate but keeps the component

---

### DynamicLight

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `DynamicLight` component makes an entity emit light. This creates a moving light source that illuminates the surrounding area.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/DynamicLight.java`

```java
public class DynamicLight implements Component<EntityStore> {
   private ColorLight colorLight = new ColorLight();
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, DynamicLight> getComponentType() {
      return EntityModule.get().getDynamicLightComponentType();
   }

   public DynamicLight() {}
   public DynamicLight(ColorLight colorLight) {
      this.colorLight = colorLight;
   }

   public ColorLight getColorLight();
   public void setColorLight(ColorLight colorLight);
   public boolean consumeNetworkOutdated();
}
```

**ColorLight properties:**

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `radius` | byte | 0-255 | Light radius in blocks |
| `red` | byte | 0-255 | Red color component |
| `green` | byte | 0-255 | Green color component |
| `blue` | byte | 0-255 | Blue color component |

**How to use:**

```java
// Create a red dynamic light
ColorLight redLight = new ColorLight((byte)15, (byte)255, (byte)0, (byte)0);
holder.addComponent(DynamicLight.getComponentType(), new DynamicLight(redLight));

// Create a white torch-like light
ColorLight torchLight = new ColorLight((byte)12, (byte)255, (byte)200, (byte)100);
holder.addComponent(DynamicLight.getComponentType(), new DynamicLight(torchLight));

// Modify light at runtime
DynamicLight light = store.getComponent(ref, DynamicLight.getComponentType());
light.setColorLight(new ColorLight((byte)10, (byte)0, (byte)255, (byte)0));  // Green light

// Remove dynamic light
commandBuffer.removeComponent(ref, DynamicLight.getComponentType());
```

**Usage notes:**
- Light changes are automatically synced to clients
- For persistent lights (saved with the entity), use `PersistentDynamicLight` instead
- `DynamicLightSystems.Setup` automatically creates `DynamicLight` from `PersistentDynamicLight` on load
- Dropped items automatically emit light if the item/block has a light property (see `ItemComponent.computeDynamicLight()`)

---

### ItemPhysicsComponent (Deprecated)

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

The `ItemPhysicsComponent` is a deprecated component that was used to store physics calculations for dropped items. It contains scaled velocity and collision results. This component has been superseded by newer physics systems.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/ItemPhysicsComponent.java`

```java
@Deprecated
public class ItemPhysicsComponent implements Component<EntityStore> {
   public Vector3d scaledVelocity = new Vector3d();
   public CollisionResult collisionResult = new CollisionResult();

   public static ComponentType<EntityStore, ItemPhysicsComponent> getComponentType() {
      return EntityModule.get().getItemPhysicsComponentType();
   }

   public ItemPhysicsComponent() {}

   public ItemPhysicsComponent(Vector3d scaledVelocity, CollisionResult collisionResult) {
      this.scaledVelocity = scaledVelocity;
      this.collisionResult = collisionResult;
   }

   @Nonnull
   @Override
   public Component<EntityStore> clone() {
      return new ItemPhysicsComponent(this.scaledVelocity, this.collisionResult);
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `scaledVelocity` | `Vector3d` | The scaled velocity vector for the item |
| `collisionResult` | `CollisionResult` | The result of collision calculations |

**Usage notes:**
- This component is deprecated and should not be used in new code
- Use `Velocity` and `PhysicsValues` components instead for item physics

---

### PickupItemComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

The `PickupItemComponent` handles the animation and state when an item is being picked up by an entity. It manages the travel animation from the item's position to the target entity over a configurable duration.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/PickupItemComponent.java`

```java
public class PickupItemComponent implements Component<EntityStore> {
   public static final float PICKUP_TRAVEL_TIME_DEFAULT = 0.15F;
   @Nonnull
   public static final BuilderCodec<PickupItemComponent> CODEC =
       BuilderCodec.builder(PickupItemComponent.class, PickupItemComponent::new).build();

   private Ref<EntityStore> targetRef;
   private Vector3d startPosition;
   private float originalLifeTime;
   private float lifeTime = 0.15F;
   private boolean finished = false;

   @Nonnull
   public static ComponentType<EntityStore, PickupItemComponent> getComponentType() {
      return EntityModule.get().getPickupItemComponentType();
   }

   // Constructors
   public PickupItemComponent() {}
   public PickupItemComponent(@Nonnull Ref<EntityStore> targetRef, @Nonnull Vector3d startPosition);
   public PickupItemComponent(@Nonnull Ref<EntityStore> targetRef, @Nonnull Vector3d startPosition, float lifeTime);

   // Methods
   public boolean hasFinished();
   public void setFinished(boolean finished);
   public void decreaseLifetime(float amount);
   public float getLifeTime();
   public float getOriginalLifeTime();
   public void setInitialLifeTime(float lifeTimeS);
   @Nonnull public Vector3d getStartPosition();
   @Nonnull public Ref<EntityStore> getTargetRef();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `targetRef` | `Ref<EntityStore>` | null | Reference to the entity picking up the item |
| `startPosition` | `Vector3d` | null | Starting position for the pickup animation |
| `originalLifeTime` | float | - | Original duration of the pickup animation |
| `lifeTime` | float | 0.15 | Remaining time for the pickup animation (seconds) |
| `finished` | boolean | false | Whether the pickup animation has completed |

**How to use:**

```java
// Initiate item pickup animation
PickupItemComponent pickup = new PickupItemComponent(
    playerRef,                          // Entity picking up the item
    itemPosition,                       // Starting position
    0.15f                               // Animation duration in seconds
);
commandBuffer.addComponent(itemRef, PickupItemComponent.getComponentType(), pickup);

// Check if pickup is complete
PickupItemComponent pickup = store.getComponent(itemRef, PickupItemComponent.getComponentType());
if (pickup.hasFinished()) {
    // Remove item and add to inventory
}
```

**Usage notes:**
- The component is processed by `PickupItemSystem` which interpolates the item position
- Default travel time is 0.15 seconds (150ms)
- Once finished, the system handles transferring the item to the target's inventory

---

### PreventItemMerging

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

The `PreventItemMerging` component is a marker component (tag) that prevents a dropped item from being merged with other nearby identical items. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/PreventItemMerging.java`

```java
public class PreventItemMerging implements Component<EntityStore> {
   @Nonnull
   public static final PreventItemMerging INSTANCE = new PreventItemMerging();
   @Nonnull
   public static final BuilderCodec<PreventItemMerging> CODEC =
       BuilderCodec.builder(PreventItemMerging.class, () -> INSTANCE).build();

   @Nonnull
   public static ComponentType<EntityStore, PreventItemMerging> getComponentType() {
      return EntityModule.get().getPreventItemMergingType();
   }

   private PreventItemMerging() {}

   @Nonnull
   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Prevent an item from merging with others
holder.addComponent(PreventItemMerging.getComponentType(), PreventItemMerging.INSTANCE);
// or
commandBuffer.addComponent(itemRef, PreventItemMerging.getComponentType(), PreventItemMerging.INSTANCE);

// Allow merging again
commandBuffer.removeComponent(itemRef, PreventItemMerging.getComponentType());
```

**Usage notes:**
- Useful for quest items, unique drops, or items that should remain separate
- The `ItemMergeSystem` checks for this component before attempting to merge items

---

### PreventPickup

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

The `PreventPickup` component is a marker component (tag) that prevents a dropped item from being picked up by any entity. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/PreventPickup.java`

```java
public class PreventPickup implements Component<EntityStore> {
   @Nonnull
   public static final PreventPickup INSTANCE = new PreventPickup();
   @Nonnull
   public static final BuilderCodec<PreventPickup> CODEC =
       BuilderCodec.builder(PreventPickup.class, () -> INSTANCE).build();

   @Nonnull
   public static ComponentType<EntityStore, PreventPickup> getComponentType() {
      return EntityModule.get().getPreventPickupComponentType();
   }

   private PreventPickup() {}

   @Nonnull
   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Prevent an item from being picked up
holder.addComponent(PreventPickup.getComponentType(), PreventPickup.INSTANCE);
// or
commandBuffer.addComponent(itemRef, PreventPickup.getComponentType(), PreventPickup.INSTANCE);

// Allow pickup again
commandBuffer.removeComponent(itemRef, PreventPickup.getComponentType());
```

**Usage notes:**
- Useful for decorative items, items during cutscenes, or owner-restricted items
- Different from `ItemComponent.pickupDelay` which is temporary - this is permanent until removed

---

### PhysicsValues

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

The `PhysicsValues` component stores the physical properties of an entity that affect how it responds to physics simulation. This includes mass, drag coefficient, and gravity direction.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/physics/component/PhysicsValues.java`

```java
public class PhysicsValues implements Component<EntityStore> {
   @Nonnull
   public static final BuilderCodec<PhysicsValues> CODEC = BuilderCodec.builder(PhysicsValues.class, PhysicsValues::new)
      .append(new KeyedCodec<>("Mass", Codec.DOUBLE), ...)
      .addValidator(Validators.greaterThan(ZERO))
      .append(new KeyedCodec<>("DragCoefficient", Codec.DOUBLE), ...)
      .addValidator(Validators.greaterThanOrEqual(ZERO))
      .append(new KeyedCodec<>("InvertedGravity", Codec.BOOLEAN), ...)
      .build();

   private static final double DEFAULT_MASS = 1.0;
   private static final double DEFAULT_DRAG_COEFFICIENT = 0.5;
   private static final boolean DEFAULT_INVERTED_GRAVITY = false;

   protected double mass;
   protected double dragCoefficient;
   protected boolean invertedGravity;

   @Nonnull
   public static ComponentType<EntityStore, PhysicsValues> getComponentType() {
      return EntityModule.get().getPhysicsValuesComponentType();
   }

   // Constructors
   public PhysicsValues();  // Uses defaults
   public PhysicsValues(@Nonnull PhysicsValues other);  // Copy constructor
   public PhysicsValues(double mass, double dragCoefficient, boolean invertedGravity);

   // Methods
   public void replaceValues(@Nonnull PhysicsValues other);
   public void resetToDefault();
   public void scale(float scale);
   public double getMass();
   public double getDragCoefficient();
   public boolean isInvertedGravity();
   @Nonnull public static PhysicsValues getDefault();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mass` | double | 1.0 | Mass of the entity (must be > 0) |
| `dragCoefficient` | double | 0.5 | Air resistance coefficient (must be >= 0) |
| `invertedGravity` | boolean | false | Whether gravity is inverted for this entity |

**How to use:**

```java
// Create entity with custom physics
PhysicsValues physics = new PhysicsValues(2.0, 0.3, false);  // Heavy, low drag
holder.addComponent(PhysicsValues.getComponentType(), physics);

// Create a floating entity (inverted gravity)
PhysicsValues floatingPhysics = new PhysicsValues(0.5, 0.8, true);
holder.addComponent(PhysicsValues.getComponentType(), floatingPhysics);

// Modify physics at runtime
PhysicsValues physics = store.getComponent(ref, PhysicsValues.getComponentType());
physics.scale(2.0f);  // Double mass and drag

// Reset to defaults
physics.resetToDefault();
```

**Usage notes:**
- Mass affects how forces (including gravity) accelerate the entity
- Higher drag coefficient means the entity slows down faster in air
- Inverted gravity makes the entity fall upward - useful for special effects
- Used automatically for dropped items via `ItemComponent.generateItemDrop()`

---

### PlayerSettings

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

The `PlayerSettings` component stores player preferences and settings, including item pickup locations and creative mode settings. It is implemented as a Java record for immutability.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerSettings.java`

```java
public record PlayerSettings(
   boolean showEntityMarkers,
   @Nonnull PickupLocation armorItemsPreferredPickupLocation,
   @Nonnull PickupLocation weaponAndToolItemsPreferredPickupLocation,
   @Nonnull PickupLocation usableItemsItemsPreferredPickupLocation,
   @Nonnull PickupLocation solidBlockItemsPreferredPickupLocation,
   @Nonnull PickupLocation miscItemsPreferredPickupLocation,
   PlayerCreativeSettings creativeSettings
) implements Component<EntityStore> {

   @Nonnull
   public static ComponentType<EntityStore, PlayerSettings> getComponentType() {
      return EntityModule.get().getPlayerSettingsComponentType();
   }

   @Nonnull
   public static PlayerSettings defaults() {
      return INSTANCE;  // Returns default instance
   }
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showEntityMarkers` | boolean | false | Whether to show debug entity markers |
| `armorItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Where armor items go when picked up |
| `weaponAndToolItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Where weapons/tools go when picked up |
| `usableItemsItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Where consumables go when picked up |
| `solidBlockItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Where blocks go when picked up |
| `miscItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Where misc items go when picked up |
| `creativeSettings` | `PlayerCreativeSettings` | - | Creative mode specific settings |

**PlayerCreativeSettings:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `allowNPCDetection` | boolean | false | Whether NPCs can detect/target the player |
| `respondToHit` | boolean | false | Whether the player responds to being hit |

**How to use:**

```java
// Get default settings
PlayerSettings settings = PlayerSettings.defaults();

// Create custom settings
PlayerSettings customSettings = new PlayerSettings(
    true,                       // showEntityMarkers
    PickupLocation.Inventory,   // armor -> inventory
    PickupLocation.Hotbar,      // weapons -> hotbar
    PickupLocation.Inventory,   // usables -> inventory
    PickupLocation.Inventory,   // blocks -> inventory
    PickupLocation.Inventory,   // misc -> inventory
    new PlayerCreativeSettings(true, false)  // creative settings
);
commandBuffer.addComponent(playerRef, PlayerSettings.getComponentType(), customSettings);
```

**Usage notes:**
- Settings are typically sent from the client and applied to the player entity
- PickupLocation determines where items are placed in the player's inventory
- Creative settings control gameplay behavior in creative mode

---

### ChunkTracker

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

The `ChunkTracker` component manages which chunks are loaded and visible to a player. It handles chunk loading/unloading, view radius, and chunk streaming rate limiting.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/ChunkTracker.java`

```java
public class ChunkTracker implements Component<EntityStore> {
   public static final int MAX_CHUNKS_PER_SECOND_LOCAL = 256;
   public static final int MAX_CHUNKS_PER_SECOND_LAN = 128;
   public static final int MAX_CHUNKS_PER_SECOND = 36;
   public static final int MAX_CHUNKS_PER_TICK = 4;
   public static final int MIN_LOADED_CHUNKS_RADIUS = 2;
   public static final int MAX_HOT_LOADED_CHUNKS_RADIUS = 8;

   private int chunkViewRadius;
   private int maxChunksPerSecond;
   private int maxChunksPerTick;
   private int minLoadedChunksRadius;
   private int maxHotLoadedChunksRadius;
   private int sentViewRadius;
   private int hotRadius;
   private int lastChunkX;
   private int lastChunkZ;
   private boolean readyForChunks;

   public static ComponentType<EntityStore, ChunkTracker> getComponentType() {
      return EntityModule.get().getChunkTrackerComponentType();
   }

   // Key methods
   public void tick(@Nonnull Ref<EntityStore> playerRef, float dt, @Nonnull CommandBuffer<EntityStore> commandBuffer);
   public void unloadAll(@Nonnull PlayerRef playerRefComponent);
   public void clear();
   public boolean isLoaded(long indexChunk);
   public boolean shouldBeVisible(long chunkCoordinates);
   public ChunkVisibility getChunkVisibility(long indexChunk);
   public void setReadyForChunks(boolean readyForChunks);
   public boolean isReadyForChunks();

   // Configuration
   public void setMaxChunksPerSecond(int maxChunksPerSecond);
   public void setDefaultMaxChunksPerSecond(@Nonnull PlayerRef playerRef);
   public void setMaxChunksPerTick(int maxChunksPerTick);
   public void setMinLoadedChunksRadius(int minLoadedChunksRadius);
   public void setMaxHotLoadedChunksRadius(int maxHotLoadedChunksRadius);

   // Stats
   public int getLoadedChunksCount();
   public int getLoadingChunksCount();

   public enum ChunkVisibility { NONE, HOT, COLD }
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `chunkViewRadius` | int | - | Player's view distance in chunks |
| `maxChunksPerSecond` | int | 36 (remote) | Maximum chunks to load per second |
| `maxChunksPerTick` | int | 4 | Maximum chunks to load per tick |
| `minLoadedChunksRadius` | int | 2 | Minimum radius of loaded chunks |
| `maxHotLoadedChunksRadius` | int | 8 | Maximum radius for "hot" (ticking) chunks |
| `sentViewRadius` | int | 0 | Current radius of sent chunks |
| `hotRadius` | int | 0 | Current radius of hot chunks |
| `readyForChunks` | boolean | false | Whether player is ready to receive chunks |

**ChunkVisibility enum:**

| Value | Description |
|-------|-------------|
| `NONE` | Chunk is not visible to the player |
| `HOT` | Chunk is visible and actively ticking |
| `COLD` | Chunk is visible but not ticking |

**How to use:**

```java
// Get chunk tracker for a player
ChunkTracker tracker = store.getComponent(playerRef, ChunkTracker.getComponentType());

// Check if a chunk is loaded for this player
long chunkIndex = ChunkUtil.indexChunk(chunkX, chunkZ);
if (tracker.isLoaded(chunkIndex)) {
    // Chunk is visible to player
}

// Configure chunk loading rate
tracker.setMaxChunksPerSecond(64);
tracker.setMaxChunksPerTick(8);

// Get chunk visibility
ChunkTracker.ChunkVisibility visibility = tracker.getChunkVisibility(chunkIndex);
if (visibility == ChunkTracker.ChunkVisibility.HOT) {
    // Chunk is actively ticking
}

// Clear all loaded chunks (for teleport/world change)
tracker.clear();
```

**Usage notes:**
- Chunk loading is rate-limited to prevent network congestion
- Local connections get 256 chunks/second, LAN gets 128, remote gets 36
- "Hot" chunks are actively ticking; "cold" chunks are visible but static
- The spiral iterator ensures chunks closest to the player load first

---

### ActiveAnimationComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `ActiveAnimationComponent` tracks which animations are currently playing on an entity across different animation slots. It enables network synchronization of animation states.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/ActiveAnimationComponent.java`

```java
public class ActiveAnimationComponent implements Component<EntityStore> {
   private final String[] activeAnimations = new String[AnimationSlot.VALUES.length];
   private boolean isNetworkOutdated = false;

   public static ComponentType<EntityStore, ActiveAnimationComponent> getComponentType() {
      return EntityModule.get().getActiveAnimationComponentType();
   }

   public ActiveAnimationComponent() {}
   public ActiveAnimationComponent(String[] activeAnimations);

   public String[] getActiveAnimations();
   public void setPlayingAnimation(AnimationSlot slot, @Nullable String animation);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `activeAnimations` | `String[]` | Array of animation names indexed by AnimationSlot |
| `isNetworkOutdated` | boolean | Flag for network synchronization |

**How to use:**

```java
// Create entity with animation component
holder.addComponent(ActiveAnimationComponent.getComponentType(), new ActiveAnimationComponent());

// Set an animation on a specific slot
ActiveAnimationComponent anim = store.getComponent(ref, ActiveAnimationComponent.getComponentType());
anim.setPlayingAnimation(AnimationSlot.PRIMARY, "walk");
anim.setPlayingAnimation(AnimationSlot.SECONDARY, "wave");

// Clear an animation
anim.setPlayingAnimation(AnimationSlot.PRIMARY, null);

// Get all active animations
String[] animations = anim.getActiveAnimations();
```

**Usage notes:**
- Animation slots allow multiple animations to play simultaneously (e.g., walking + waving)
- Animation changes are automatically synced to clients when marked as outdated
- Null animation values indicate no animation playing on that slot

---

### MovementAudioComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `MovementAudioComponent` manages audio feedback for entity movement, including footstep sounds and movement-in-block sounds (like walking through water or grass).

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/MovementAudioComponent.java`

```java
public class MovementAudioComponent implements Component<EntityStore> {
   public static float NO_REPEAT = -1.0F;

   private final ShouldHearPredicate shouldHearPredicate = new ShouldHearPredicate();
   private int lastInsideBlockTypeId = 0;
   private float nextMoveInRepeat = NO_REPEAT;

   public static ComponentType<EntityStore, MovementAudioComponent> getComponentType() {
      return EntityModule.get().getMovementAudioComponentType();
   }

   @Nonnull
   public ShouldHearPredicate getShouldHearPredicate(Ref<EntityStore> ref);
   public int getLastInsideBlockTypeId();
   public void setLastInsideBlockTypeId(int lastInsideBlockTypeId);
   public boolean canMoveInRepeat();
   public boolean tickMoveInRepeat(float dt);
   public void setNextMoveInRepeat(float nextMoveInRepeat);

   public static class ShouldHearPredicate implements Predicate<Ref<EntityStore>> {
      // Filters out the owner from hearing their own sounds
   }
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lastInsideBlockTypeId` | int | 0 | Block type ID the entity is currently inside |
| `nextMoveInRepeat` | float | -1.0 | Timer for repeating movement sounds |

**How to use:**

```java
// Add movement audio to an entity
holder.addComponent(MovementAudioComponent.getComponentType(), new MovementAudioComponent());

// Update the block the entity is inside
MovementAudioComponent audio = store.getComponent(ref, MovementAudioComponent.getComponentType());
audio.setLastInsideBlockTypeId(waterBlockTypeId);

// Set up repeating sound (e.g., splashing in water)
audio.setNextMoveInRepeat(0.5f);  // Repeat every 0.5 seconds

// Check if it's time to play the sound again
if (audio.canMoveInRepeat() && audio.tickMoveInRepeat(deltaTime)) {
    // Play the movement sound
    audio.setNextMoveInRepeat(0.5f);  // Reset timer
}
```

**Usage notes:**
- The `ShouldHearPredicate` prevents entities from hearing their own movement sounds
- Used for ambient sounds like walking through water, tall grass, etc.
- Set `nextMoveInRepeat` to `NO_REPEAT` (-1.0) to disable repeating sounds

---

### RespondToHit

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `RespondToHit` component is a marker component (tag) that indicates an entity should respond to being hit with visual/audio feedback. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/RespondToHit.java`

```java
public class RespondToHit implements Component<EntityStore> {
   public static final RespondToHit INSTANCE = new RespondToHit();
   public static final BuilderCodec<RespondToHit> CODEC =
       BuilderCodec.builder(RespondToHit.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, RespondToHit> getComponentType() {
      return EntityModule.get().getRespondToHitComponentType();
   }

   private RespondToHit() {}

   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Make entity respond to hits (show damage feedback)
holder.addComponent(RespondToHit.getComponentType(), RespondToHit.INSTANCE);
// or
commandBuffer.addComponent(ref, RespondToHit.getComponentType(), RespondToHit.INSTANCE);

// Disable hit response
commandBuffer.removeComponent(ref, RespondToHit.getComponentType());

// Check if entity responds to hits
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean respondsToHit = archetype.contains(RespondToHit.getComponentType());
```

**Usage notes:**
- Used to enable hit feedback animations, sounds, and effects
- Related to `PlayerCreativeSettings.respondToHit` for player-specific settings
- Entities without this component may still take damage but won't show feedback

---

### RotateObjectComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `RotateObjectComponent` makes an entity continuously rotate around its Y-axis. This is useful for display items, decorative objects, or collectibles.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/RotateObjectComponent.java`

```java
public class RotateObjectComponent implements Component<EntityStore> {
   @Nonnull
   public static final BuilderCodec<RotateObjectComponent> CODEC =
       BuilderCodec.builder(RotateObjectComponent.class, RotateObjectComponent::new)
          .append(new KeyedCodec<>("RotationSpeed", Codec.FLOAT), ...)
          .build();

   private float rotationSpeed;

   @Nonnull
   public static ComponentType<EntityStore, RotateObjectComponent> getComponentType() {
      return EntityModule.get().getRotateObjectComponentType();
   }

   public RotateObjectComponent() {}
   public RotateObjectComponent(float rotationSpeed);

   public void setRotationSpeed(float rotationSpeed);
   public float getRotationSpeed();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `rotationSpeed` | float | 0.0 | Rotation speed in degrees per second |

**How to use:**

```java
// Create a slowly rotating display item
RotateObjectComponent rotate = new RotateObjectComponent(45.0f);  // 45 deg/sec
holder.addComponent(RotateObjectComponent.getComponentType(), rotate);

// Create a fast spinning collectible
holder.addComponent(RotateObjectComponent.getComponentType(),
    new RotateObjectComponent(180.0f));  // Half rotation per second

// Modify rotation speed at runtime
RotateObjectComponent rotate = store.getComponent(ref, RotateObjectComponent.getComponentType());
rotate.setRotationSpeed(90.0f);

// Stop rotation
rotate.setRotationSpeed(0.0f);
// or remove the component
commandBuffer.removeComponent(ref, RotateObjectComponent.getComponentType());
```

**Usage notes:**
- Positive values rotate counter-clockwise (viewed from above)
- Negative values rotate clockwise
- Commonly used for dropped items to make them more visible
- The actual rotation is applied by a system that updates `TransformComponent`

---

### FromPrefab

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `FromPrefab` component is a marker component (tag) that indicates an entity was spawned from a prefab definition. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/FromPrefab.java`

```java
public class FromPrefab implements Component<EntityStore> {
   public static final FromPrefab INSTANCE = new FromPrefab();
   public static final BuilderCodec<FromPrefab> CODEC =
       BuilderCodec.builder(FromPrefab.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, FromPrefab> getComponentType() {
      return EntityModule.get().getFromPrefabComponentType();
   }

   private FromPrefab() {}

   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Mark entity as spawned from prefab
holder.addComponent(FromPrefab.getComponentType(), FromPrefab.INSTANCE);

// Check if entity is from a prefab
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isFromPrefab = archetype.contains(FromPrefab.getComponentType());
```

**Usage notes:**
- Used to distinguish between entities spawned from prefabs vs. dynamically created
- Helps with entity management and cleanup
- Prefab entities may have special serialization or respawn behavior

---

### FromWorldGen

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `FromWorldGen` component marks an entity as being generated by the world generation system. It stores the world generation ID to track which world gen system created it.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/FromWorldGen.java`

```java
public class FromWorldGen implements Component<EntityStore> {
   public static final BuilderCodec<FromWorldGen> CODEC =
       BuilderCodec.builder(FromWorldGen.class, FromWorldGen::new)
          .append(new KeyedCodec<>("WorldGenId", Codec.INTEGER), ...)
          .build();

   private int worldGenId;

   public static ComponentType<EntityStore, FromWorldGen> getComponentType() {
      return EntityModule.get().getFromWorldGenComponentType();
   }

   private FromWorldGen() {}
   public FromWorldGen(int worldGenId);

   public int getWorldGenId();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `worldGenId` | int | ID of the world generation system that created this entity |

**How to use:**

```java
// Mark entity as generated by world gen
FromWorldGen worldGen = new FromWorldGen(generatorId);
holder.addComponent(FromWorldGen.getComponentType(), worldGen);

// Check if entity was generated
FromWorldGen worldGen = store.getComponent(ref, FromWorldGen.getComponentType());
if (worldGen != null) {
    int generatorId = worldGen.getWorldGenId();
    // Handle world-generated entity
}
```

**Usage notes:**
- Used for entities like naturally spawning creatures, structures, or decorations
- The `worldGenId` can be used to identify which generator created the entity
- Helps prevent re-generating entities that have already been spawned
- Related to `WorldGenId` component which tracks chunk-level generation state

---

### MovementStatesComponent

**Package:** `com.hypixel.hytale.server.core.entity.movement`

The `MovementStatesComponent` tracks the current movement state of an entity. It stores boolean flags for various movement states like jumping, flying, swimming, crouching, and more. This component also tracks what was last sent to clients for delta compression.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/movement/MovementStatesComponent.java`

```java
public class MovementStatesComponent implements Component<EntityStore> {
   private MovementStates movementStates = new MovementStates();
   private MovementStates sentMovementStates = new MovementStates();

   public static ComponentType<EntityStore, MovementStatesComponent> getComponentType() {
      return EntityModule.get().getMovementStatesComponentType();
   }

   public MovementStates getMovementStates();
   public void setMovementStates(MovementStates movementStates);
   public MovementStates getSentMovementStates();
   public void setSentMovementStates(MovementStates sentMovementStates);
}
```

**MovementStates Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `idle` | boolean | Entity is not moving |
| `horizontalIdle` | boolean | Entity is not moving horizontally |
| `jumping` | boolean | Entity is currently jumping |
| `flying` | boolean | Entity is in flight mode |
| `walking` | boolean | Entity is walking |
| `running` | boolean | Entity is running |
| `sprinting` | boolean | Entity is sprinting |
| `crouching` | boolean | Entity is crouching/sneaking |
| `forcedCrouching` | boolean | Entity is forced to crouch (low ceiling) |
| `falling` | boolean | Entity is falling |
| `climbing` | boolean | Entity is climbing (ladder/vine) |
| `inFluid` | boolean | Entity is in a fluid (water/lava) |
| `swimming` | boolean | Entity is swimming |
| `swimJumping` | boolean | Entity is jumping while swimming |
| `onGround` | boolean | Entity is on the ground |
| `mantling` | boolean | Entity is mantling/climbing over ledge |
| `sliding` | boolean | Entity is sliding |
| `mounting` | boolean | Entity is mounting/dismounting |
| `rolling` | boolean | Entity is performing a roll |
| `sitting` | boolean | Entity is sitting |
| `gliding` | boolean | Entity is gliding |
| `sleeping` | boolean | Entity is sleeping |

**How to use:**

```java
// Get movement states for an entity
MovementStatesComponent component = store.getComponent(ref, MovementStatesComponent.getComponentType());
MovementStates states = component.getMovementStates();

// Check if entity is on the ground
if (states.onGround) {
    // Entity is grounded
}

// Check if entity is in combat-relevant state
if (states.jumping || states.falling) {
    // Apply aerial combat modifiers
}

// Modify movement state
states.crouching = true;

// Check multiple states
boolean canSprint = states.onGround && !states.crouching && !states.inFluid;
```

**Usage notes:**
- Movement states are synchronized to clients for animation and prediction
- The `sentMovementStates` field tracks what was last sent to avoid redundant network updates
- States are updated by various movement systems based on physics and player input
- Used by animation systems to determine which animations to play

---

### MovementConfig (Asset)

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.movement`

The `MovementConfig` is a data asset (not a component) that defines movement parameters for entities. It controls speeds, jump forces, air control, climbing, sliding, rolling, and more. This is loaded from JSON asset files.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/movement/MovementConfig.java`

**Key Properties:**

| Category | Property | Type | Default | Description |
|----------|----------|------|---------|-------------|
| **Basic** | `baseSpeed` | float | 5.5 | Base movement speed |
| **Basic** | `acceleration` | float | 0.1 | Movement acceleration |
| **Basic** | `velocityResistance` | float | 0.242 | Ground friction/resistance |
| **Jump** | `jumpForce` | float | 11.8 | Jump force strength |
| **Jump** | `swimJumpForce` | float | 10.0 | Jump force while swimming |
| **Jump** | `jumpBufferDuration` | float | 0.3 | Time window to buffer jump input |
| **Jump** | `variableJumpFallForce` | float | 35.0 | Force applied when releasing jump early |
| **Air** | `airSpeedMultiplier` | float | 1.0 | Speed multiplier while airborne |
| **Air** | `airDragMin` / `airDragMax` | float | 0.96 / 0.995 | Air drag range |
| **Air** | `airFrictionMin` / `airFrictionMax` | float | 0.02 / 0.045 | Air friction range |
| **Air** | `airControlMinMultiplier` / `airControlMaxMultiplier` | float | 0.0 / 3.13 | Air control multiplier range |
| **Fly** | `horizontalFlySpeed` | float | 10.32 | Horizontal flight speed |
| **Fly** | `verticalFlySpeed` | float | 10.32 | Vertical flight speed |
| **Climb** | `climbSpeed` | float | 0.035 | Vertical climb speed |
| **Climb** | `climbSpeedLateral` | float | 0.035 | Horizontal climb speed |
| **Climb** | `climbUpSprintSpeed` | float | 0.5 | Sprint climb up speed |
| **Climb** | `climbDownSprintSpeed` | float | 0.6 | Sprint climb down speed |
| **Walk** | `forwardWalkSpeedMultiplier` | float | 0.3 | Forward walk speed multiplier |
| **Walk** | `backwardWalkSpeedMultiplier` | float | 0.3 | Backward walk speed multiplier |
| **Walk** | `strafeWalkSpeedMultiplier` | float | 0.3 | Strafe walk speed multiplier |
| **Run** | `forwardRunSpeedMultiplier` | float | 1.0 | Forward run speed multiplier |
| **Run** | `backwardRunSpeedMultiplier` | float | 0.65 | Backward run speed multiplier |
| **Run** | `strafeRunSpeedMultiplier` | float | 0.8 | Strafe run speed multiplier |
| **Sprint** | `forwardSprintSpeedMultiplier` | float | 1.65 | Sprint speed multiplier |
| **Crouch** | `forwardCrouchSpeedMultiplier` | float | 0.55 | Forward crouch speed multiplier |
| **Crouch** | `backwardCrouchSpeedMultiplier` | float | 0.4 | Backward crouch speed multiplier |
| **Crouch** | `strafeCrouchSpeedMultiplier` | float | 0.45 | Strafe crouch speed multiplier |
| **Slide** | `minSlideEntrySpeed` | float | 8.5 | Minimum speed to start sliding |
| **Slide** | `slideExitSpeed` | float | 2.5 | Speed when exiting slide |
| **Roll** | `minFallSpeedToEngageRoll` | float | 21.0 | Minimum fall speed to trigger roll |
| **Roll** | `maxFallSpeedToEngageRoll` | float | 31.0 | Maximum fall speed for roll |
| **Roll** | `rollStartSpeedModifier` | float | 2.5 | Speed multiplier at roll start |
| **Roll** | `rollExitSpeedModifier` | float | 1.5 | Speed multiplier at roll exit |
| **Roll** | `rollTimeToComplete` | float | 0.9 | Time to complete roll animation |
| **Roll** | `fallDamagePartialMitigationPercent` | float | 33.0 | Fall damage reduction from roll |
| **AutoJump** | `autoJumpObstacleSpeedLoss` | float | 0.95 | Speed loss on auto-jump |
| **AutoJump** | `autoJumpObstacleMaxAngle` | float | 45.0 | Maximum angle for auto-jump |
| **AutoJump** | `autoJumpDisableJumping` | boolean | true | Disable manual jump during auto-jump |

**How to use:**

```java
// Get the default movement config
MovementConfig config = MovementConfig.DEFAULT_MOVEMENT;

// Get a custom movement config from assets
MovementConfig customConfig = MovementConfig.getAssetMap().getAsset("mymod:fast_runner");

// Access movement values
float jumpForce = config.getJumpForce();
float baseSpeed = config.getBaseSpeed();
float sprintMultiplier = config.getForwardSprintSpeedMultiplier();

// Calculate effective sprint speed
float sprintSpeed = baseSpeed * sprintMultiplier;
```

**Usage notes:**
- MovementConfig assets can inherit from parent configs using the asset system
- The config is sent to clients via `MovementSettings` packet for client-side prediction
- Different entity types can have different movement configs
- Used by the movement physics systems to calculate entity motion

---

### Velocity

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

The `Velocity` component stores an entity's current velocity vector and pending velocity instructions. It supports multiple velocity modification types (add, set, replace) and is used by physics systems to move entities.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/physics/component/Velocity.java`

```java
public class Velocity implements Component<EntityStore> {
   @Nonnull
   public static final BuilderCodec<Velocity> CODEC = BuilderCodec.builder(Velocity.class, Velocity::new)
      .append(new KeyedCodec<>("Velocity", Vector3d.CODEC), ...)
      .build();

   protected final List<Velocity.Instruction> instructions = new ObjectArrayList<>();
   protected final Vector3d velocity = new Vector3d();
   protected final Vector3d clientVelocity = new Vector3d();

   public static ComponentType<EntityStore, Velocity> getComponentType() {
      return EntityModule.get().getVelocityComponentType();
   }

   // Velocity manipulation
   public void setZero();
   public void addForce(@Nonnull Vector3d force);
   public void addForce(double x, double y, double z);
   public void set(@Nonnull Vector3d newVelocity);
   public void set(double x, double y, double z);
   public void setClient(@Nonnull Vector3d newVelocity);

   // Component access
   public void setX(double x);
   public void setY(double y);
   public void setZ(double z);
   public double getX();
   public double getY();
   public double getZ();
   public double getSpeed();

   // Instruction queue
   public void addInstruction(@Nonnull Vector3d velocity, @Nullable VelocityConfig config, @Nonnull ChangeVelocityType type);
   @Nonnull public List<Velocity.Instruction> getInstructions();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `velocity` | `Vector3d` | Current velocity (blocks per second) |
| `clientVelocity` | `Vector3d` | Client-predicted velocity |
| `instructions` | `List<Instruction>` | Pending velocity modifications |

**ChangeVelocityType enum:**

| Value | Description |
|-------|-------------|
| `Add` | Add to current velocity |
| `Set` | Replace current velocity |
| `Replace` | Replace only specified components |

**How to use:**

```java
// Get velocity component
Velocity velocity = store.getComponent(ref, Velocity.getComponentType());

// Apply a force (additive)
velocity.addForce(0, 10, 0);  // Upward force

// Set velocity directly
velocity.set(5, 0, 3);  // Move northeast

// Get current speed
double speed = velocity.getSpeed();

// Reset velocity
velocity.setZero();

// Add velocity instruction (processed by physics system)
velocity.addInstruction(
    new Vector3d(0, 15, 0),    // Jump velocity
    null,                        // No special config
    ChangeVelocityType.Add       // Add to current
);

// Create entity with initial velocity
Velocity vel = new Velocity(new Vector3d(10, 5, 0));
holder.addComponent(Velocity.getComponentType(), vel);
```

**Usage notes:**
- Velocity is in blocks per second
- Instructions are processed by the velocity systems and then cleared
- Client velocity is used for client-side prediction synchronization
- Works with `PhysicsValues` component for mass and drag calculations

---

### KnockbackComponent

**Package:** `com.hypixel.hytale.server.core.entity.knockback`

The `KnockbackComponent` stores pending knockback data to be applied to an entity. It includes the velocity to apply, the type of velocity change, modifiers, and duration tracking for stagger effects.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/knockback/KnockbackComponent.java`

```java
public class KnockbackComponent implements Component<EntityStore> {
   private Vector3d velocity;
   private ChangeVelocityType velocityType = ChangeVelocityType.Add;
   private VelocityConfig velocityConfig;
   private DoubleList modifiers = new DoubleArrayList();
   private float duration;
   private float timer;

   public static ComponentType<EntityStore, KnockbackComponent> getComponentType() {
      return EntityModule.get().getKnockbackComponentType();
   }

   // Velocity
   public Vector3d getVelocity();
   public void setVelocity(@Nonnull Vector3d velocity);
   public ChangeVelocityType getVelocityType();
   public void setVelocityType(ChangeVelocityType velocityType);
   public VelocityConfig getVelocityConfig();
   public void setVelocityConfig(@Nullable VelocityConfig velocityConfig);

   // Modifiers
   public void addModifier(double modifier);
   public void applyModifiers();

   // Duration/Timer
   public float getDuration();
   public void setDuration(float duration);
   public float getTimer();
   public void incrementTimer(float time);
   public void setTimer(float time);
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `velocity` | `Vector3d` | - | Knockback velocity to apply |
| `velocityType` | `ChangeVelocityType` | Add | How to apply the velocity |
| `velocityConfig` | `VelocityConfig` | null | Optional velocity configuration |
| `modifiers` | `DoubleList` | empty | Multipliers to apply to velocity |
| `duration` | float | 0 | Total knockback duration |
| `timer` | float | 0 | Current time elapsed |

**How to use:**

```java
// Apply knockback to an entity
KnockbackComponent knockback = new KnockbackComponent();
knockback.setVelocity(new Vector3d(5, 8, 0));  // Horizontal + vertical
knockback.setVelocityType(ChangeVelocityType.Set);
knockback.setDuration(0.3f);  // 300ms stagger
commandBuffer.addComponent(ref, KnockbackComponent.getComponentType(), knockback);

// Apply knockback with modifiers (e.g., armor reduction)
knockback.addModifier(0.75);  // 25% reduction
knockback.addModifier(1.2);   // 20% increase (from debuff)
knockback.applyModifiers();   // Apply all modifiers to velocity
```

**Usage notes:**
- Knockback is processed by dedicated knockback systems
- The duration/timer can be used for stagger effects
- Modifiers are multiplicative and applied via `applyModifiers()`
- The component is typically removed after processing

---

### DamageDataComponent

**Package:** `com.hypixel.hytale.server.core.entity.damage`

The `DamageDataComponent` tracks combat timing data for an entity, including when it last took damage, when it last performed a combat action, and the current wielding interaction state.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/damage/DamageDataComponent.java`

```java
public class DamageDataComponent implements Component<EntityStore> {
   private Instant lastCombatAction = Instant.MIN;
   private Instant lastDamageTime = Instant.MIN;
   private WieldingInteraction currentWielding;
   private Instant lastChargeTime;

   public static ComponentType<EntityStore, DamageDataComponent> getComponentType() {
      return EntityModule.get().getDamageDataComponentType();
   }

   public Instant getLastCombatAction();
   public void setLastCombatAction(@Nonnull Instant lastCombatAction);
   public Instant getLastDamageTime();
   public void setLastDamageTime(@Nonnull Instant lastDamageTime);
   public Instant getLastChargeTime();
   public void setLastChargeTime(@Nonnull Instant lastChargeTime);
   public WieldingInteraction getCurrentWielding();
   public void setCurrentWielding(@Nullable WieldingInteraction currentWielding);
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lastCombatAction` | `Instant` | MIN | Timestamp of last combat action (attack/block) |
| `lastDamageTime` | `Instant` | MIN | Timestamp of last damage received |
| `currentWielding` | `WieldingInteraction` | null | Current weapon/tool wielding state |
| `lastChargeTime` | `Instant` | null | Timestamp when charge attack started |

**How to use:**

```java
// Get damage data for an entity
DamageDataComponent damageData = store.getComponent(ref, DamageDataComponent.getComponentType());

// Check if entity was recently in combat
Instant now = timeResource.getNow();
Duration timeSinceCombat = Duration.between(damageData.getLastCombatAction(), now);
boolean recentlyInCombat = timeSinceCombat.getSeconds() < 5;

// Update combat timing when attacking
damageData.setLastCombatAction(now);

// Check damage cooldown
Duration timeSinceDamage = Duration.between(damageData.getLastDamageTime(), now);
boolean canTakeDamage = timeSinceDamage.toMillis() > invulnerabilityFrames;

// Track charge attack
damageData.setLastChargeTime(now);
// Later...
Duration chargeTime = Duration.between(damageData.getLastChargeTime(), now);
float chargePercent = (float) Math.min(chargeTime.toMillis() / maxChargeMs, 1.0);
```

**Usage notes:**
- Used for combat cooldowns and invulnerability frames
- `currentWielding` tracks the active weapon interaction state
- Combat action time includes both attacking and defending actions
- Essential for combo systems and attack timing

---

### DeathComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.damage`

The `DeathComponent` is added to an entity when it dies. It contains death information including the cause, message, item loss configuration, and respawn settings.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/damage/DeathComponent.java`

```java
public class DeathComponent implements Component<EntityStore> {
   public static final BuilderCodec<DeathComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("DeathCause", Codec.STRING), ...)
      .append(new KeyedCodec<>("DeathMessage", Message.CODEC), ...)
      .append(new KeyedCodec<>("ShowDeathMenu", BuilderCodec.BOOLEAN), ...)
      .append(new KeyedCodec<>("ItemsLostOnDeath", new ArrayCodec<>(ItemStack.CODEC, ...)), ...)
      .append(new KeyedCodec<>("ItemsAmountLossPercentage", Codec.DOUBLE), ...)
      .append(new KeyedCodec<>("ItemsDurabilityLossPercentage", Codec.DOUBLE), ...)
      .append(new KeyedCodec<>("DisplayDataOnDeathScreen", Codec.BOOLEAN), ...)
      .build();

   private String deathCause;
   private Message deathMessage;
   private boolean showDeathMenu = true;
   private ItemStack[] itemsLostOnDeath;
   private double itemsAmountLossPercentage;
   private double itemsDurabilityLossPercentage;
   private boolean displayDataOnDeathScreen;
   private Damage deathInfo;
   private DeathConfig.ItemsLossMode itemsLossMode = DeathConfig.ItemsLossMode.ALL;
   private InteractionChain interactionChain;

   public static ComponentType<EntityStore, DeathComponent> getComponentType() {
      return DamageModule.get().getDeathComponentType();
   }

   // Static helper to add death component safely
   public static void tryAddComponent(@Nonnull CommandBuffer<EntityStore> commandBuffer,
                                      @Nonnull Ref<EntityStore> ref,
                                      @Nonnull Damage damage);
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `deathCause` | String | - | ID of the damage cause asset |
| `deathMessage` | `Message` | null | Custom death message to display |
| `showDeathMenu` | boolean | true | Whether to show death/respawn menu |
| `itemsLostOnDeath` | `ItemStack[]` | null | Items lost when entity died |
| `itemsAmountLossPercentage` | double | 0 | Percentage of stack amounts lost |
| `itemsDurabilityLossPercentage` | double | 0 | Percentage of durability lost |
| `displayDataOnDeathScreen` | boolean | false | Show detailed death info on screen |
| `deathInfo` | `Damage` | - | Full damage information that caused death |
| `itemsLossMode` | `ItemsLossMode` | ALL | How items are lost (ALL, RANDOM, NONE) |

**ItemsLossMode enum:**

| Value | Description |
|-------|-------------|
| `ALL` | All items are lost on death |
| `RANDOM` | Random selection of items lost |
| `NONE` | No items lost on death |

**How to use:**

```java
// Death is applied via tryAddComponent (constructor has protected access)
DeathComponent.tryAddComponent(commandBuffer, entityRef, damage);

// Access death info after the component is added
DeathComponent death = store.getComponent(ref, DeathComponent.getComponentType());
DamageCause cause = death.getDeathCause();
Damage damageInfo = death.getDeathInfo();
boolean showMenu = death.isShowDeathMenu();
```

**Usage notes:**
- The `tryAddComponent` method prevents adding multiple death components
- Death handling systems process this component for respawn logic
- Used by the death screen UI to display information to players
- Item loss is calculated based on the configured mode and percentages

---

### DespawnComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity`

The `DespawnComponent` marks an entity for automatic removal at a specified time. It provides factory methods for creating despawn timers based on seconds or milliseconds.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/DespawnComponent.java`

```java
public class DespawnComponent implements Component<EntityStore> {
   public static final BuilderCodec<DespawnComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("Despawn", Codec.INSTANT), ...)
      .build();

   private Instant timeToDespawnAt;

   public static ComponentType<EntityStore, DespawnComponent> getComponentType() {
      return EntityModule.get().getDespawnComponentType();
   }

   // Factory methods
   @Nonnull public static DespawnComponent despawnInSeconds(@Nonnull TimeResource time, int seconds);
   @Nonnull public static DespawnComponent despawnInSeconds(@Nonnull TimeResource time, float seconds);
   @Nonnull public static DespawnComponent despawnInMilliseconds(@Nonnull TimeResource time, long milliseconds);

   // Instance methods
   public void setDespawn(Instant timeToDespawnAt);
   public void setDespawnTo(@Nonnull Instant from, float additionalSeconds);
   @Nullable public Instant getDespawn();

   // Helper for conditional despawn
   public static void trySetDespawn(
      @Nonnull CommandBuffer<EntityStore> commandBuffer,
      @Nonnull TimeResource timeResource,
      @Nonnull Ref<EntityStore> ref,
      @Nullable DespawnComponent despawnComponent,
      @Nullable Float newLifetime
   );
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `timeToDespawnAt` | `Instant` | The exact time when entity should be removed |

**How to use:**

```java
// Create entity with 60 second lifetime
TimeResource time = store.getResource(TimeResource.TYPE);
holder.addComponent(DespawnComponent.getComponentType(),
    DespawnComponent.despawnInSeconds(time, 60));

// Create entity with 2.5 second lifetime
holder.addComponent(DespawnComponent.getComponentType(),
    DespawnComponent.despawnInSeconds(time, 2.5f));

// Extend an existing despawn timer
DespawnComponent despawn = store.getComponent(ref, DespawnComponent.getComponentType());
despawn.setDespawnTo(time.getNow(), 30.0f);  // 30 more seconds from now

// Remove despawn (make permanent)
commandBuffer.removeComponent(ref, DespawnComponent.getComponentType());

// Conditionally set despawn
DespawnComponent.trySetDespawn(commandBuffer, timeResource, ref,
    existingDespawn, 120.0f);  // Set to 120 seconds if exists, create if not
```

**Usage notes:**
- Commonly used for dropped items (default 120 seconds), projectiles, and effects
- The despawn system checks entities each tick and removes expired ones
- Passing `null` lifetime to `trySetDespawn` removes the despawn component
- Serialized with the entity for persistence across saves

---

### EffectControllerComponent

**Package:** `com.hypixel.hytale.server.core.entity.effect`

The `EffectControllerComponent` manages active status effects on an entity. It handles adding, removing, extending effects, tracking durations, and synchronizing effect states to clients.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/effect/EffectControllerComponent.java`

```java
public class EffectControllerComponent implements Component<EntityStore> {
   public static final BuilderCodec<EffectControllerComponent> CODEC = ...;

   protected final Int2ObjectMap<ActiveEntityEffect> activeEffects = new Int2ObjectOpenHashMap<>();
   protected int[] cachedActiveEffectIndexes;
   protected ObjectList<EntityEffectUpdate> changes = new ObjectArrayList<>();
   protected boolean isNetworkOutdated;
   protected Model originalModel = null;
   protected int activeModelChangeEntityEffectIndex;
   protected boolean isInvulnerable;

   public static ComponentType<EntityStore, EffectControllerComponent> getComponentType() {
      return EntityModule.get().getEffectControllerComponentType();
   }

   // Add effects
   public boolean addEffect(@Nonnull Ref<EntityStore> ownerRef, @Nonnull EntityEffect entityEffect,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public boolean addEffect(@Nonnull Ref<EntityStore> ownerRef, @Nonnull EntityEffect entityEffect,
                           float duration, @Nonnull OverlapBehavior overlapBehavior,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public boolean addInfiniteEffect(@Nonnull Ref<EntityStore> ownerRef, int entityEffectIndex,
                                   @Nonnull EntityEffect entityEffect,
                                   @Nonnull ComponentAccessor<EntityStore> componentAccessor);

   // Remove effects
   public void removeEffect(@Nonnull Ref<EntityStore> ownerRef, int entityEffectIndex,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public void clearEffects(@Nonnull Ref<EntityStore> ownerRef,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);

   // Query effects
   @Nonnull public Int2ObjectMap<ActiveEntityEffect> getActiveEffects();
   public int[] getActiveEffectIndexes();
   public boolean isInvulnerable();
}
```

**OverlapBehavior enum:**

| Value | Description |
|-------|-------------|
| `EXTEND` | Add duration to existing effect |
| `OVERWRITE` | Replace existing effect |
| `IGNORE` | Keep existing effect unchanged |

**RemovalBehavior enum:**

| Value | Description |
|-------|-------------|
| `COMPLETE` | Remove effect entirely |
| `INFINITE` | Remove infinite flag only |
| `DURATION` | Set remaining duration to 0 |

**How to use:**

```java
// Get effect controller
EffectControllerComponent effects = store.getComponent(ref, EffectControllerComponent.getComponentType());

// Add a timed effect
EntityEffect poison = EntityEffect.getAssetMap().getAsset("hytale:poison");
effects.addEffect(ref, poison, 10.0f, OverlapBehavior.EXTEND, componentAccessor);

// Add an infinite effect
EntityEffect fly = EntityEffect.getAssetMap().getAsset("hytale:flight");
effects.addInfiniteEffect(ref, flyIndex, fly, componentAccessor);

// Check active effects
int[] activeEffectIndexes = effects.getActiveEffectIndexes();
for (int effectIndex : activeEffectIndexes) {
    ActiveEntityEffect active = effects.getActiveEffects().get(effectIndex);
    float remaining = active.getRemainingDuration();
}

// Remove a specific effect
effects.removeEffect(ref, poisonIndex, componentAccessor);

// Clear all effects
effects.clearEffects(ref, componentAccessor);

// Check if entity has effect-based invulnerability
if (effects.isInvulnerable()) {
    // Skip damage
}
```

**Usage notes:**
- Effects can modify entity stats via `StatModifiersManager`
- Some effects can change the entity's model temporarily
- Effect changes are batched and sent to clients via `EntityEffectUpdate`
- Used for buffs, debuffs, status ailments, and special abilities

---

### ProjectileComponent

**Package:** `com.hypixel.hytale.server.core.entity.entities`

The `ProjectileComponent` represents a projectile entity like an arrow, spell, or thrown item. It handles projectile physics, collision detection, damage on impact, and visual/audio effects.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/ProjectileComponent.java`

```java
public class ProjectileComponent implements Component<EntityStore> {
   public static final BuilderCodec<ProjectileComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("ProjectileType", Codec.STRING), ...)
      .append(new KeyedCodec<>("BrokenDamageModifier", Codec.FLOAT), ...)
      .append(new KeyedCodec<>("DeadTimer", Codec.DOUBLE), ...)
      .append(new KeyedCodec<>("CreatorUUID", Codec.UUID_STRING), ...)
      .append(new KeyedCodec<>("HaveHit", Codec.BOOLEAN), ...)
      .build();

   private static final double DEFAULT_DESPAWN_SECONDS = 60.0;
   private transient SimplePhysicsProvider simplePhysicsProvider;
   private transient String appearance = "Boy";
   private transient Projectile projectile;
   private String projectileAssetName;
   private float brokenDamageModifier = 1.0F;
   private double deadTimer = -1.0;
   private UUID creatorUuid;
   private boolean haveHit;
   private Vector3d lastBouncePosition;

   public static ComponentType<EntityStore, ProjectileComponent> getComponentType() {
      return EntityModule.get().getProjectileComponentType();
   }

   // Factory method for creating projectiles
   @Nonnull public static Holder<EntityStore> assembleDefaultProjectile(
      @Nonnull TimeResource time, @Nonnull String projectileAssetName,
      @Nonnull Vector3d position, @Nonnull Vector3f rotation
   );

   // Shooting
   public void shoot(@Nonnull Holder<EntityStore> holder, @Nonnull UUID creatorUuid,
                    double x, double y, double z, float yaw, float pitch);

   // State
   public boolean initialize();
   public void initializePhysics(@Nonnull BoundingBox boundingBox);
   public boolean consumeDeadTimer(float dt);
   public boolean isOnGround();
   public void applyBrokenPenalty(float penalty);
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `projectileAssetName` | String | - | Asset ID for the projectile configuration |
| `brokenDamageModifier` | float | 1.0 | Damage multiplier (reduced for broken ammo) |
| `deadTimer` | double | -1.0 | Time until projectile is removed after impact |
| `creatorUuid` | UUID | - | UUID of the entity that shot this projectile |
| `haveHit` | boolean | false | Whether projectile has hit something |
| `appearance` | String | "Boy" | Visual appearance/model ID |

**How to use:**

```java
// Create a projectile
TimeResource time = store.getResource(TimeResource.TYPE);
Holder<EntityStore> projectileHolder = ProjectileComponent.assembleDefaultProjectile(
    time,
    "hytale:arrow",
    position,
    rotation
);

// Shoot the projectile
ProjectileComponent projectile = projectileHolder.getComponent(ProjectileComponent.getComponentType());
projectile.shoot(projectileHolder, shooterUuid, x, y, z, yaw, pitch);

// Add to world
Ref<EntityStore> projectileRef = store.addEntity(projectileHolder, AddReason.SPAWN);

// Apply damage penalty for broken weapon
projectile.applyBrokenPenalty(0.25f);  // 25% damage reduction
```

**Usage notes:**
- Projectiles automatically include `TransformComponent`, `Velocity`, `UUIDComponent`, and `DespawnComponent`
- Uses `SimplePhysicsProvider` for trajectory and collision
- Spawns particles and plays sounds on bounce, hit, miss, and death
- Can trigger explosions on death via `ExplosionConfig`

---

### CollisionResultComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `CollisionResultComponent` stores the results of collision detection for an entity. It tracks collision start position, offset, and whether a collision check is pending.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/CollisionResultComponent.java`

```java
public class CollisionResultComponent implements Component<EntityStore> {
   private final CollisionResult collisionResult;
   private final Vector3d collisionStartPosition;
   private final Vector3d collisionPositionOffset;
   private final Vector3d collisionStartPositionCopy;
   private final Vector3d collisionPositionOffsetCopy;
   private boolean pendingCollisionCheck;

   public static ComponentType<EntityStore, CollisionResultComponent> getComponentType() {
      return EntityModule.get().getCollisionResultComponentType();
   }

   public CollisionResult getCollisionResult();
   public Vector3d getCollisionStartPosition();
   public Vector3d getCollisionPositionOffset();
   public Vector3d getCollisionStartPositionCopy();
   public Vector3d getCollisionPositionOffsetCopy();
   public boolean isPendingCollisionCheck();
   public void markPendingCollisionCheck();
   public void consumePendingCollisionCheck();
   public void resetLocationChange();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `collisionResult` | `CollisionResult` | Detailed collision information |
| `collisionStartPosition` | `Vector3d` | Position where collision check started |
| `collisionPositionOffset` | `Vector3d` | Movement offset after collision resolution |
| `pendingCollisionCheck` | boolean | Whether a new collision check is needed |

**How to use:**

```java
// Get collision result for an entity
CollisionResultComponent collision = store.getComponent(ref, CollisionResultComponent.getComponentType());

// Check if collision occurred
CollisionResult result = collision.getCollisionResult();
if (result.hasCollided()) {
    // Handle collision
    Vector3d resolvedOffset = collision.getCollisionPositionOffset();
}

// Mark for re-check after movement
collision.markPendingCollisionCheck();

// After processing collision
collision.consumePendingCollisionCheck();
collision.resetLocationChange();
```

**Usage notes:**
- Used by physics and movement systems for collision resolution
- The "copy" vectors are used for thread-safe operations
- Collision checks are batched and processed by collision systems
- Works with `BoundingBox` component for entity bounds

---

### PositionDataComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `PositionDataComponent` tracks what block types an entity is currently inside of and standing on. This is used for movement audio, status effects, and gameplay logic.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PositionDataComponent.java`

```java
public class PositionDataComponent implements Component<EntityStore> {
   private int insideBlockTypeId = 0;
   private int standingOnBlockTypeId = 0;

   public static ComponentType<EntityStore, PositionDataComponent> getComponentType() {
      return EntityModule.get().getPositionDataComponentType();
   }

   public int getInsideBlockTypeId();
   public void setInsideBlockTypeId(int insideBlockTypeId);
   public int getStandingOnBlockTypeId();
   public void setStandingOnBlockTypeId(int standingOnBlockTypeId);
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `insideBlockTypeId` | int | 0 | Block type ID the entity is inside (water, lava, etc.) |
| `standingOnBlockTypeId` | int | 0 | Block type ID the entity is standing on |

**How to use:**

```java
// Get position data
PositionDataComponent posData = store.getComponent(ref, PositionDataComponent.getComponentType());

// Check what block entity is standing on
int standingBlockId = posData.getStandingOnBlockTypeId();
BlockType blockType = BlockType.getAssetMap().getAsset(standingBlockId);
if (blockType != null && blockType.getId().equals("hytale:ice")) {
    // Apply ice sliding physics
}

// Check if entity is in water
int insideBlockId = posData.getInsideBlockTypeId();
BlockType insideBlock = BlockType.getAssetMap().getAsset(insideBlockId);
if (insideBlock != null && insideBlock.isFluid()) {
    // Apply swimming physics
}
```

**Usage notes:**
- Updated by movement/position systems each tick
- Block ID of 0 typically means air (no block)
- Used for footstep sounds, movement speed modifiers, and status effects
- Works with `MovementAudioComponent` for movement sounds

---

### NewSpawnComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `NewSpawnComponent` provides a grace period after entity spawn. During this window, certain systems may treat the entity differently (e.g., skip initial processing).

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/NewSpawnComponent.java`

```java
public class NewSpawnComponent implements Component<EntityStore> {
   private float newSpawnWindow;

   public static ComponentType<EntityStore, NewSpawnComponent> getComponentType() {
      return EntityModule.get().getNewSpawnComponentType();
   }

   public NewSpawnComponent(float newSpawnWindow);
   public boolean newSpawnWindowPassed(float dt);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `newSpawnWindow` | float | Remaining time in spawn grace period (seconds) |

**How to use:**

```java
// Create entity with spawn protection
holder.addComponent(NewSpawnComponent.getComponentType(), new NewSpawnComponent(1.0f));  // 1 second

// Check if spawn window has passed (in a system)
NewSpawnComponent spawn = chunk.getComponent(index, NewSpawnComponent.getComponentType());
if (spawn != null && spawn.newSpawnWindowPassed(dt)) {
    // Spawn window expired, remove component
    commandBuffer.removeComponent(ref, NewSpawnComponent.getComponentType());
}
```

**Usage notes:**
- Returns true and decrements timer when called with delta time
- Typically removed by a system once the window expires
- Used to prevent immediate NPC aggro or other unwanted interactions
- Short-lived component that exists only during spawn grace period

---

### PropComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `PropComponent` is a marker component (tag) that identifies an entity as a prop. Props are typically static decorative objects or furniture. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PropComponent.java`

```java
public class PropComponent implements Component<EntityStore> {
   public static final BuilderCodec<PropComponent> CODEC =
       BuilderCodec.builder(PropComponent.class, PropComponent::new).build();
   private static final PropComponent INSTANCE = new PropComponent();

   public static ComponentType<EntityStore, PropComponent> getComponentType() {
      return EntityModule.get().getPropComponentType();
   }

   public static PropComponent get() {
      return INSTANCE;
   }

   @Override
   public Component<EntityStore> clone() {
      return this;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Mark entity as a prop
holder.addComponent(PropComponent.getComponentType(), PropComponent.get());

// Check if entity is a prop
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isProp = archetype.contains(PropComponent.getComponentType());
```

**Usage notes:**
- Used for furniture, decorations, and static objects
- Props may have special serialization or interaction handling
- Different from living entities - props typically don't move or have AI

---

### AudioComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `AudioComponent` stores pending sound events to be played at an entity's position. Sounds are queued and then played by the audio system.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/AudioComponent.java`

```java
public class AudioComponent implements Component<EntityStore> {
   private IntList soundEventIds = new IntArrayList();
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, AudioComponent> getComponentType() {
      return EntityModule.get().getAudioComponentType();
   }

   public int[] getSoundEventIds();
   public void addSound(int soundIndex);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `soundEventIds` | `IntList` | List of sound event IDs to play |
| `isNetworkOutdated` | boolean | Flag for network synchronization |

**How to use:**

```java
// Get audio component
AudioComponent audio = store.getComponent(ref, AudioComponent.getComponentType());

// Queue a sound to play
int soundIndex = SoundEvent.getAssetMap().getIndex("hytale:entity.hurt");
audio.addSound(soundIndex);

// Get all pending sounds
int[] sounds = audio.getSoundEventIds();

// Check and consume network flag
if (audio.consumeNetworkOutdated()) {
    // Send sounds to clients
}
```

**Usage notes:**
- Sounds are queued and played at entity position
- Network sync ensures clients hear entity sounds
- Used for entity-specific sounds (hurt, death, attack, etc.)
- Works with the audio systems for 3D positioned audio

---

### PlayerSkinComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

The `PlayerSkinComponent` stores the player's skin/appearance data. This includes the skin texture, model customization, and other visual properties.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerSkinComponent.java`

```java
public class PlayerSkinComponent implements Component<EntityStore> {
   private final PlayerSkin playerSkin;
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, PlayerSkinComponent> getComponentType() {
      return EntityModule.get().getPlayerSkinComponentType();
   }

   public PlayerSkinComponent(@Nonnull PlayerSkin playerSkin);
   public boolean consumeNetworkOutdated();
   @Nonnull public PlayerSkin getPlayerSkin();
   public void setNetworkOutdated();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `playerSkin` | `PlayerSkin` | Player's skin/appearance data |
| `isNetworkOutdated` | boolean | Flag for network synchronization |

**How to use:**

```java
// Get player skin
PlayerSkinComponent skinComp = store.getComponent(playerRef, PlayerSkinComponent.getComponentType());
PlayerSkin skin = skinComp.getPlayerSkin();

// Force skin update to clients
skinComp.setNetworkOutdated();

// Check if skin needs sync
if (skinComp.consumeNetworkOutdated()) {
    // Send skin data to clients
}
```

**Usage notes:**
- Skin data is typically received from the client on login
- Changes to skin trigger network sync to other players
- Used by model/effect systems when applying visual changes
- Can be temporarily overridden by effects (e.g., disguise)

---

## Inventory and Item Systems

The inventory and item systems handle player inventories, item containers, item stacks, windows, and armor slots. These are core gameplay systems that manage items throughout the game.

### Inventory

**Package:** `com.hypixel.hytale.server.core.inventory`

The `Inventory` class manages a living entity's complete inventory, including storage, armor, hotbar, utility slots, tools, and backpack. It provides methods for moving items between sections, smart item placement, and serialization.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/Inventory.java`

```java
public class Inventory implements NetworkSerializable<UpdatePlayerInventory> {
   public static final short DEFAULT_HOTBAR_CAPACITY = 9;
   public static final short DEFAULT_UTILITY_CAPACITY = 4;
   public static final short DEFAULT_TOOLS_CAPACITY = 23;
   public static final short DEFAULT_ARMOR_CAPACITY = (short)ItemArmorSlot.VALUES.length;  // 4
   public static final short DEFAULT_STORAGE_ROWS = 4;
   public static final short DEFAULT_STORAGE_COLUMNS = 9;
   public static final short DEFAULT_STORAGE_CAPACITY = 36;

   // Section IDs (negative values for internal sections)
   public static final int HOTBAR_SECTION_ID = -1;
   public static final int STORAGE_SECTION_ID = -2;
   public static final int ARMOR_SECTION_ID = -3;
   public static final int UTILITY_SECTION_ID = -5;
   public static final int TOOLS_SECTION_ID = -8;
   public static final int BACKPACK_SECTION_ID = -9;

   private ItemContainer storage;
   private ItemContainer armor;
   private ItemContainer hotbar;
   private ItemContainer utility;
   private ItemContainer tools;
   private ItemContainer backpack;
   private byte activeHotbarSlot;
   private byte activeUtilitySlot = -1;
   private byte activeToolsSlot = -1;

   // Combined containers for searching/moving items
   private CombinedItemContainer combinedHotbarFirst;
   private CombinedItemContainer combinedStorageFirst;
   private CombinedItemContainer combinedBackpackStorageHotbar;
   private CombinedItemContainer combinedEverything;
}
```

**Inventory Sections:**

| Section | ID | Default Capacity | Description |
|---------|----|--------------------|-------------|
| Hotbar | -1 | 9 | Quick access item slots |
| Storage | -2 | 36 | Main inventory storage (4x9 grid) |
| Armor | -3 | 4 | Equipment slots (Head, Chest, Hands, Legs) |
| Utility | -5 | 4 | Consumable item slots |
| Tools | -8 | 23 | Tool storage (deprecated) |
| Backpack | -9 | 0 | Expandable backpack storage |

**Key Methods:**

```java
// Move item between sections
void moveItem(int fromSectionId, int fromSlotId, int quantity, int toSectionId, int toSlotId);

// Smart move with auto-equip and stack merging
void smartMoveItem(int fromSectionId, int fromSlotId, int quantity, SmartMoveType moveType);

// Get active slot items
ItemStack getItemInHand();           // Active hotbar or tool item
ItemStack getActiveHotbarItem();     // Active hotbar slot item
ItemStack getUtilityItem();          // Active utility slot item
ItemStack getToolsItem();            // Active tools slot item

// Slot management
void setActiveHotbarSlot(byte slot);
void setActiveUtilitySlot(byte slot);
void setActiveToolsSlot(byte slot);

// Container access
ItemContainer getContainerForItemPickup(Item item, PlayerSettings settings);
ItemContainer getSectionById(int id);

// Bulk operations
List<ItemStack> dropAllItemStacks();
void clear();
```

**SmartMoveType enum:**

| Value | Description |
|-------|-------------|
| `EquipOrMergeStack` | Auto-equip armor or merge with existing stacks |
| `PutInHotbarOrWindow` | Move to hotbar, or open container window |
| `PutInHotbarOrBackpack` | Move to hotbar, storage, or backpack |

**Usage Examples:**

```java
// Get player inventory
Player player = store.getComponent(playerRef, Player.getComponentType());
Inventory inventory = player.getInventory();

// Move item from storage to hotbar
inventory.moveItem(
    Inventory.STORAGE_SECTION_ID, 5,   // From storage slot 5
    64,                                 // Move 64 items
    Inventory.HOTBAR_SECTION_ID, 0     // To hotbar slot 0
);

// Smart equip armor
inventory.smartMoveItem(
    Inventory.STORAGE_SECTION_ID, 10,
    1,
    SmartMoveType.EquipOrMergeStack
);

// Get item in hand
ItemStack heldItem = inventory.getItemInHand();
if (heldItem != null && heldItem.getItem().getWeapon() != null) {
    // Player is holding a weapon
}

// Add items to player inventory (respects pickup location preferences)
PlayerSettings settings = store.getComponent(playerRef, PlayerSettings.getComponentType());
ItemContainer targetContainer = inventory.getContainerForItemPickup(item, settings);
targetContainer.addItemStack(itemStack);
```

---

### ItemStack

**Package:** `com.hypixel.hytale.server.core.inventory`

The `ItemStack` class represents a stack of items with quantity, durability, and optional metadata. ItemStacks are immutable by design - modification methods return new instances.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/ItemStack.java`

```java
public class ItemStack implements NetworkSerializable<ItemWithAllMetadata> {
   public static final ItemStack EMPTY = new ItemStack() { /* itemId = "Empty" */ };
   public static final ItemStack[] EMPTY_ARRAY = new ItemStack[0];

   protected String itemId;
   protected int quantity = 1;
   protected double durability;
   protected double maxDurability;
   protected boolean overrideDroppedItemAnimation;
   protected BsonDocument metadata;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `itemId` | String | Asset ID of the item (e.g., "hytale:diamond_sword") |
| `quantity` | int | Number of items in the stack (>0) |
| `durability` | double | Current durability (0 = broken) |
| `maxDurability` | double | Maximum durability (0 = unbreakable) |
| `metadata` | BsonDocument | Custom data attached to the item |
| `overrideDroppedItemAnimation` | boolean | Override default drop animation |

**Immutable Modifier Methods:**

```java
// All methods return new ItemStack instances
ItemStack withQuantity(int quantity);           // Returns null if quantity == 0
ItemStack withDurability(double durability);
ItemStack withMaxDurability(double maxDurability);
ItemStack withIncreasedDurability(double inc);
ItemStack withRestoredDurability(double maxDurability);
ItemStack withState(String state);
ItemStack withMetadata(BsonDocument metadata);
ItemStack withMetadata(String key, Codec<T> codec, T data);
```

**Stack Operations:**

```java
// Check if items can stack together
boolean isStackableWith(ItemStack other);   // Same id, durability, metadata
boolean isEquivalentType(ItemStack other);  // Same id and metadata (ignores durability)

// Static utility methods
static boolean isEmpty(ItemStack itemStack);           // null or "Empty" id
static boolean isStackableWith(ItemStack a, ItemStack b);
static boolean isSameItemType(ItemStack a, ItemStack b);  // Same item id only
```

**Durability:**

```java
boolean isUnbreakable();  // maxDurability <= 0
boolean isBroken();       // durability == 0 (and breakable)
```

**Usage Examples:**

```java
// Create a new item stack
ItemStack sword = new ItemStack("hytale:iron_sword", 1);
ItemStack blocks = new ItemStack("hytale:stone", 64);

// Modify item stack (returns new instance)
ItemStack damagedSword = sword.withDurability(sword.getDurability() - 10);
ItemStack halfStack = blocks.withQuantity(32);

// Add custom metadata
ItemStack enchantedSword = sword.withMetadata("Enchantments", enchantCodec, enchantData);

// Check if stackable
if (stackA.isStackableWith(stackB)) {
    // Can merge these stacks
    int newQuantity = stackA.getQuantity() + stackB.getQuantity();
    int maxStack = stackA.getItem().getMaxStack();
    // ...
}

// Check durability
if (sword.isBroken()) {
    // Tool is broken, cannot use
}
```

---

### ItemContainer

**Package:** `com.hypixel.hytale.server.core.inventory.container`

The `ItemContainer` is the abstract base class for all item storage containers. It provides comprehensive methods for adding, removing, moving, and querying item stacks with filter support.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/ItemContainer.java`

```java
public abstract class ItemContainer {
   // Core abstract methods
   public abstract short getCapacity();
   public abstract void setGlobalFilter(FilterType globalFilter);
   public abstract void setSlotFilter(FilterActionType actionType, short slot, SlotFilter filter);
   public abstract ItemContainer clone();

   // Internal operations (protected)
   protected abstract ItemStack internal_getSlot(short slot);
   protected abstract ItemStack internal_setSlot(short slot, ItemStack itemStack);
   protected abstract ItemStack internal_removeSlot(short slot);
   protected abstract boolean cantAddToSlot(short slot, ItemStack itemStack, ItemStack slotItemStack);
   protected abstract boolean cantRemoveFromSlot(short slot);
   protected abstract boolean cantDropFromSlot(short slot);
}
```

**Main Container Types:**

| Type | Description |
|------|-------------|
| `SimpleItemContainer` | Basic fixed-size container |
| `EmptyItemContainer` | Zero-capacity placeholder (singleton) |
| `CombinedItemContainer` | Combines multiple containers virtually |

**Key Methods:**

```java
// Single slot operations
ItemStack getItemStack(short slot);
ItemStackSlotTransaction addItemStackToSlot(short slot, ItemStack itemStack);
ItemStackSlotTransaction setItemStackForSlot(short slot, ItemStack itemStack);
SlotTransaction removeItemStackFromSlot(short slot);
ItemStackSlotTransaction removeItemStackFromSlot(short slot, int quantity);

// Bulk operations
ItemStackTransaction addItemStack(ItemStack itemStack);
ListTransaction<ItemStackTransaction> addItemStacks(List<ItemStack> itemStacks);
ItemStackTransaction removeItemStack(ItemStack itemStack);
ListTransaction<ItemStackTransaction> removeItemStacks(List<ItemStack> itemStacks);

// Move operations
MoveTransaction<ItemStackTransaction> moveItemStackFromSlot(short slot, ItemContainer containerTo);
MoveTransaction<SlotTransaction> moveItemStackFromSlotToSlot(short slot, int quantity,
    ItemContainer containerTo, short slotTo);
ListTransaction<MoveTransaction<ItemStackTransaction>> moveAllItemStacksTo(ItemContainer... containerTo);

// Query operations
boolean canAddItemStack(ItemStack itemStack);
boolean canRemoveItemStack(ItemStack itemStack);
boolean containsItemStacksStackableWith(ItemStack itemStack);
int countItemStacks(Predicate<ItemStack> itemPredicate);
boolean isEmpty();

// Resource/Material operations
ResourceTransaction removeResource(ResourceQuantity resource);
MaterialTransaction removeMaterial(MaterialQuantity material);
TagTransaction removeTag(int tagIndex, int quantity);

// Utility
List<ItemStack> dropAllItemStacks();
ClearTransaction clear();
ListTransaction<SlotTransaction> sortItems(SortType sort);
void forEach(ShortObjectConsumer<ItemStack> action);

// Events
EventRegistration registerChangeEvent(Consumer<ItemContainerChangeEvent> consumer);
```

**Transactions:**

All container operations return transaction objects that indicate success/failure and provide before/after state:

```java
// Check if operation succeeded
ItemStackTransaction transaction = container.addItemStack(itemStack);
if (transaction.succeeded()) {
    ItemStack remainder = transaction.getRemainder();
    if (remainder != null) {
        // Partial add - some items couldn't fit
    }
}
```

**Usage Examples:**

```java
// Create a container
SimpleItemContainer chest = new SimpleItemContainer((short)27);  // 27 slots

// Add items
ItemStackTransaction result = chest.addItemStack(new ItemStack("hytale:gold_ingot", 10));
if (!result.succeeded()) {
    // Container is full
}

// Move items between containers
MoveTransaction<ItemStackTransaction> moveResult = sourceContainer.moveItemStackFromSlot(
    (short)5,           // From slot 5
    destContainer       // To this container
);

// Check container contents
int goldCount = chest.countItemStacks(item ->
    item.getItemId().equals("hytale:gold_ingot"));

// Register for changes
chest.registerChangeEvent(event -> {
    Transaction transaction = event.transaction();
    // Handle container change
});
```

---

### CombinedItemContainer

**Package:** `com.hypixel.hytale.server.core.inventory.container`

The `CombinedItemContainer` virtually combines multiple `ItemContainer` instances into a single searchable container. Operations iterate through child containers in order, allowing priority-based item placement.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/CombinedItemContainer.java`

```java
public class CombinedItemContainer extends ItemContainer {
   protected final ItemContainer[] containers;

   public CombinedItemContainer(ItemContainer... containers);

   public ItemContainer getContainer(int index);
   public int getContainersSize();
   public ItemContainer getContainerForSlot(short slot);

   @Override
   public short getCapacity();  // Sum of all child capacities
}
```

**Slot Mapping:**

Slots are mapped sequentially across child containers:
- Container 0: slots 0 to (capacity0 - 1)
- Container 1: slots capacity0 to (capacity0 + capacity1 - 1)
- And so on...

**Usage Examples:**

```java
// Create combined container (hotbar first for item placement)
CombinedItemContainer hotbarFirst = new CombinedItemContainer(hotbar, storage);

// Items added will first try hotbar, then storage
hotbarFirst.addItemStack(new ItemStack("hytale:apple", 5));

// Create storage-first for different behavior
CombinedItemContainer storageFirst = new CombinedItemContainer(storage, hotbar);

// Get the underlying container for a slot
ItemContainer container = hotbarFirst.getContainerForSlot((short)15);
// If hotbar has 9 slots, slot 15 would be in storage (slot 6 within storage)

// Inventory uses these for item pickup preferences
Inventory inventory = player.getInventory();
CombinedItemContainer pickupContainer = inventory.getCombinedHotbarFirst();
pickupContainer.addItemStack(pickedUpItem);
```

---

### SlotFilter and ArmorSlotAddFilter

**Package:** `com.hypixel.hytale.server.core.inventory.container.filter`

Slot filters control which items can be added to or removed from specific container slots. They are used for armor restrictions, utility slot requirements, and custom container rules.

**Source files:**
- `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/filter/SlotFilter.java`
- `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/filter/ArmorSlotAddFilter.java`

```java
public interface SlotFilter {
   SlotFilter ALLOW = (actionType, container, slot, itemStack) -> true;
   SlotFilter DENY = (actionType, container, slot, itemStack) -> false;

   boolean test(FilterActionType actionType, ItemContainer container, short slot, ItemStack itemStack);
}

// Filter for armor slots - restricts by armor type
public class ArmorSlotAddFilter implements ItemSlotFilter {
   private final ItemArmorSlot itemArmorSlot;

   public ArmorSlotAddFilter(ItemArmorSlot itemArmorSlot);

   @Override
   public boolean test(Item item) {
      return item == null ||
             (item.getArmor() != null && item.getArmor().getArmorSlot() == this.itemArmorSlot);
   }
}
```

**FilterActionType enum:**

| Value | Description |
|-------|-------------|
| `ADD` | Adding items to the slot |
| `REMOVE` | Removing items from the slot |
| `DROP` | Dropping items from the slot |

**Usage Examples:**

```java
// Apply armor filter to a container
container.setSlotFilter(FilterActionType.ADD, (short)0, new ArmorSlotAddFilter(ItemArmorSlot.Head));
container.setSlotFilter(FilterActionType.ADD, (short)1, new ArmorSlotAddFilter(ItemArmorSlot.Chest));
container.setSlotFilter(FilterActionType.ADD, (short)2, new ArmorSlotAddFilter(ItemArmorSlot.Hands));
container.setSlotFilter(FilterActionType.ADD, (short)3, new ArmorSlotAddFilter(ItemArmorSlot.Legs));

// Make a slot read-only
container.setSlotFilter(FilterActionType.REMOVE, (short)5, SlotFilter.DENY);

// Custom filter for usable items only
container.setSlotFilter(FilterActionType.ADD, (short)0,
    (type, cont, slot, item) -> item == null || item.getItem().getUtility().isUsable());
```

---

### ItemArmorSlot

**Package:** `com.hypixel.hytale.protocol`

The `ItemArmorSlot` enum defines the four armor slot types available for player equipment.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/protocol/ItemArmorSlot.java`

```java
public enum ItemArmorSlot {
   Head(0),
   Chest(1),
   Hands(2),
   Legs(3);

   public static final ItemArmorSlot[] VALUES = values();
   private final int value;

   public int getValue();
   public static ItemArmorSlot fromValue(int value);
}
```

**Usage Examples:**

```java
// Get armor slot from item
Item item = itemStack.getItem();
ItemArmor armor = item.getArmor();
if (armor != null) {
    ItemArmorSlot slot = armor.getArmorSlot();
    // Place in appropriate inventory slot
    inventory.getArmor().setItemStackForSlot((short)slot.getValue(), itemStack);
}

// Check if item is helmet
if (armor.getArmorSlot() == ItemArmorSlot.Head) {
    // Apply helmet-specific logic
}
```

---

### UniqueItemUsagesComponent

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.data`

The `UniqueItemUsagesComponent` tracks which unique/one-time-use items a player has already used. This prevents players from using the same unique item multiple times.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/data/UniqueItemUsagesComponent.java`

```java
public class UniqueItemUsagesComponent implements Component<EntityStore> {
   public static final BuilderCodec<UniqueItemUsagesComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("UniqueItemUsed", new ArrayCodec<>(Codec.STRING, String[]::new)), ...)
      .build();

   private final Set<String> usedUniqueItems = new HashSet<>();

   public static ComponentType<EntityStore, UniqueItemUsagesComponent> getComponentType();

   public boolean hasUsedUniqueItem(String itemId);
   public void recordUniqueItemUsage(String itemId);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `usedUniqueItems` | `Set<String>` | Set of item IDs that have been used |

**Usage Examples:**

```java
// Check if player has used a unique item
UniqueItemUsagesComponent usages = store.getComponent(playerRef,
    UniqueItemUsagesComponent.getComponentType());

String itemId = "hytale:special_scroll";
if (usages.hasUsedUniqueItem(itemId)) {
    // Already used, cannot use again
    return;
}

// Use the item and record it
performUniqueItemEffect(player, itemId);
usages.recordUniqueItemUsage(itemId);
```

---

## Window System

The window system manages UI windows that players can open, such as containers, crafting tables, shops, and other interactive interfaces.

### Window

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

The `Window` class is the abstract base for all UI windows. It handles window lifecycle (open/close), data serialization, and player interaction.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/Window.java`

```java
public abstract class Window {
   public static final Map<WindowType, Supplier<? extends Window>> CLIENT_REQUESTABLE_WINDOW_TYPES;

   protected final WindowType windowType;
   protected final AtomicBoolean isDirty = new AtomicBoolean();
   protected final AtomicBoolean needRebuild = new AtomicBoolean();
   private int id;
   private WindowManager manager;
   private PlayerRef playerRef;

   public Window(WindowType windowType);

   // Lifecycle
   public void init(PlayerRef playerRef, WindowManager manager);
   protected abstract boolean onOpen0();
   protected abstract void onClose0();
   public void close();

   // Data
   public abstract JsonObject getData();
   public void handleAction(Ref<EntityStore> ref, Store<EntityStore> store, WindowAction action);

   // State
   protected void invalidate();
   protected void setNeedRebuild();
   protected boolean consumeIsDirty();

   // Events
   public EventRegistration registerCloseEvent(Consumer<WindowCloseEvent> consumer);

   // Getters
   public WindowType getType();
   public int getId();
   public PlayerRef getPlayerRef();
}
```

**Window Types:**

Subclasses of `Window` include:
- `ItemContainerWindow` - Windows with item containers
- `ContainerWindow` - Base for container windows
- `BlockWindow` - Windows attached to blocks
- `ContainerBlockWindow` - Block-based container windows
- `ItemStackContainerWindow` - Windows for item stack containers
- `MaterialContainerWindow` - Windows with material resources
- `ValidatedWindow` - Windows with validation logic

**Window Lifecycle:**

1. Window is created with `WindowType`
2. `init()` is called with player reference
3. `onOpen0()` is called - return false to cancel opening
4. Window is active and handles `handleAction()` calls
5. `onClose0()` is called on close
6. Close event is dispatched

**Usage Examples:**

```java
// Create a custom window
public class ChestWindow extends Window implements ItemContainerWindow {
    private final ItemContainer container;

    public ChestWindow(ItemContainer container) {
        super(WindowType.Chest);
        this.container = container;
    }

    @Override
    public ItemContainer getItemContainer() {
        return container;
    }

    @Override
    protected boolean onOpen0() {
        // Initialize window, return true to open
        return true;
    }

    @Override
    protected void onClose0() {
        // Cleanup when window closes
    }

    @Override
    public JsonObject getData() {
        JsonObject data = new JsonObject();
        data.addProperty("rows", 3);
        return data;
    }
}

// Register close handler
window.registerCloseEvent(event -> {
    // Window was closed
    saveContainerContents();
});
```

---

### WindowManager

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

The `WindowManager` manages all open windows for a player. It handles window IDs, opening/closing, updating, and validation.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/WindowManager.java`

```java
public class WindowManager {
   private final AtomicInteger windowId = new AtomicInteger(1);
   private final Int2ObjectConcurrentHashMap<Window> windows = new Int2ObjectConcurrentHashMap<>();
   private final Int2ObjectConcurrentHashMap<EventRegistration> windowChangeEvents;
   private PlayerRef playerRef;

   public void init(PlayerRef playerRef);

   // Opening windows
   public UpdateWindow clientOpenWindow(Window window);   // For client-requested windows (id=0)
   public OpenWindow openWindow(Window window);           // Server-opened windows
   public List<OpenWindow> openWindows(Window... windows);

   // Window access
   public Window getWindow(int id);
   public List<Window> getWindows();

   // Closing
   public Window closeWindow(int id);
   public void closeAllWindows();

   // Updates
   public void updateWindow(Window window);
   public void updateWindows();          // Updates all dirty windows
   public void validateWindows();        // Validates ValidatedWindows
   public void markWindowChanged(int id);
}
```

**Window IDs:**
- ID `0` is reserved for client-requested windows
- ID `-1` is invalid
- Server-opened windows get incrementing IDs starting from 1

**Usage Examples:**

```java
// Get player's window manager
Player player = store.getComponent(playerRef, Player.getComponentType());
WindowManager windowManager = player.getWindowManager();

// Open a container window
ChestWindow chestWindow = new ChestWindow(chestContainer);
OpenWindow packet = windowManager.openWindow(chestWindow);
if (packet != null) {
    playerRef.getPacketHandler().write(packet);
}

// Close a specific window
windowManager.closeWindow(windowId);

// Get all open windows
for (Window window : windowManager.getWindows()) {
    if (window instanceof ItemContainerWindow icw) {
        ItemContainer container = icw.getItemContainer();
        // Process container
    }
}

// Close all windows (e.g., on disconnect)
windowManager.closeAllWindows();
```

---

### ItemContainerWindow Interface

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

The `ItemContainerWindow` interface is implemented by windows that contain item containers. This enables the window manager to automatically sync container changes.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/ItemContainerWindow.java`

```java
public interface ItemContainerWindow {
   @Nonnull
   ItemContainer getItemContainer();
}
```

**Usage Examples:**

```java
// Check if window has items
Window window = windowManager.getWindow(windowId);
if (window instanceof ItemContainerWindow icw) {
    ItemContainer container = icw.getItemContainer();

    // Move items from player inventory to container
    player.getInventory().getStorage().moveItemStackFromSlot(
        (short)0, container
    );
}
```

---

## HUD Components

The HUD (Heads-Up Display) system manages on-screen UI elements that show player status, inventory, and game information.

### HudComponent

**Package:** `com.hypixel.hytale.protocol.packets.interface_`

The `HudComponent` enum defines all available HUD elements that can be shown or hidden on the client.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/protocol/packets/interface_/HudComponent.java`

```java
public enum HudComponent {
   Hotbar(0),
   StatusIcons(1),
   Reticle(2),
   Chat(3),
   Requests(4),
   Notifications(5),
   KillFeed(6),
   InputBindings(7),
   PlayerList(8),
   EventTitle(9),
   Compass(10),
   ObjectivePanel(11),
   PortalPanel(12),
   BuilderToolsLegend(13),
   Speedometer(14),
   UtilitySlotSelector(15),
   BlockVariantSelector(16),
   BuilderToolsMaterialSlotSelector(17),
   Stamina(18),
   AmmoIndicator(19),
   Health(20),
   Mana(21),
   Oxygen(22),
   Sleep(23);

   public static final HudComponent[] VALUES = values();

   public int getValue();
   public static HudComponent fromValue(int value);
}
```

**HUD Components Description:**

| Component | Description |
|-----------|-------------|
| `Hotbar` | Quick access item slots at bottom of screen |
| `StatusIcons` | Buff/debuff icons |
| `Reticle` | Crosshair/targeting reticle |
| `Chat` | Chat window |
| `Requests` | Friend/party requests |
| `Notifications` | System notifications |
| `KillFeed` | Recent kills/deaths display |
| `InputBindings` | Control hints |
| `PlayerList` | Tab player list |
| `EventTitle` | Large event title text |
| `Compass` | Directional compass |
| `ObjectivePanel` | Quest/objective display |
| `PortalPanel` | Portal information |
| `BuilderToolsLegend` | Creative mode tool legend |
| `Speedometer` | Vehicle speed display |
| `UtilitySlotSelector` | Utility item selector |
| `BlockVariantSelector` | Block variant picker |
| `BuilderToolsMaterialSlotSelector` | Creative material picker |
| `Stamina` | Stamina bar |
| `AmmoIndicator` | Ammunition counter |
| `Health` | Health bar |
| `Mana` | Mana bar |
| `Oxygen` | Underwater oxygen bar |
| `Sleep` | Sleep progress indicator |

**Usage Examples:**

```java
// Hide HUD components (e.g., during cutscene)
Set<HudComponent> hiddenComponents = EnumSet.of(
    HudComponent.Hotbar,
    HudComponent.Health,
    HudComponent.Stamina,
    HudComponent.Chat
);

UpdateVisibleHudComponents packet = new UpdateVisibleHudComponents();
packet.hiddenComponents = hiddenComponents;
playerRef.getPacketHandler().write(packet);

// Show all components again
packet.hiddenComponents = EnumSet.noneOf(HudComponent.class);
playerRef.getPacketHandler().write(packet);
```

---

### EntityUIComponent

**Package:** `com.hypixel.hytale.server.core.modules.entityui.asset`

The `EntityUIComponent` is an abstract asset class for UI elements displayed above entities (like nameplates, health bars, or custom indicators).

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entityui/asset/EntityUIComponent.java`

```java
public abstract class EntityUIComponent
    implements JsonAssetWithMap<String, IndexedLookupTableAssetMap<String, EntityUIComponent>>,
               NetworkSerializable<com.hypixel.hytale.protocol.EntityUIComponent> {

   protected String id;
   protected AssetExtraInfo.Data data;
   private Vector2f hitboxOffset = new Vector2f(0.0F, 0.0F);

   public static AssetStore<String, EntityUIComponent, ...> getAssetStore();
   public static IndexedLookupTableAssetMap<String, EntityUIComponent> getAssetMap();
   public static EntityUIComponent getUnknownFor(String id);

   public String getId();
   public EntityUIComponent toPacket();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | String | Asset identifier |
| `hitboxOffset` | Vector2f | Offset from entity hitbox center |
| `data` | AssetExtraInfo.Data | Additional asset metadata |

**Usage Examples:**

```java
// Get entity UI component from assets
EntityUIComponent healthBar = EntityUIComponent.getAssetMap()
    .getAsset("hytale:health_bar");

// Create packet for entity UI
com.hypixel.hytale.protocol.EntityUIComponent packet = healthBar.toPacket();
```

---

## Physics Components

These components handle physics simulation including gravity, mass, drag, and velocity calculations.

### PhysicsValues

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

The `PhysicsValues` component stores physics properties for an entity including mass, drag coefficient, and gravity direction. These values are used by physics systems to calculate entity motion.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/physics/component/PhysicsValues.java`

```java
public class PhysicsValues implements Component<EntityStore> {
   public static final BuilderCodec<PhysicsValues> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("Mass", Codec.DOUBLE), ...)
      .append(new KeyedCodec<>("DragCoefficient", Codec.DOUBLE), ...)
      .append(new KeyedCodec<>("InvertedGravity", Codec.BOOLEAN), ...)
      .build();

   private static final double DEFAULT_MASS = 1.0;
   private static final double DEFAULT_DRAG_COEFFICIENT = 0.5;
   private static final boolean DEFAULT_INVERTED_GRAVITY = false;

   protected double mass;
   protected double dragCoefficient;
   protected boolean invertedGravity;

   public static ComponentType<EntityStore, PhysicsValues> getComponentType() {
      return EntityModule.get().getPhysicsValuesComponentType();
   }

   public double getMass();
   public double getDragCoefficient();
   public boolean isInvertedGravity();
   public void replaceValues(PhysicsValues other);
   public void resetToDefault();
   public void scale(float scale);
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mass` | double | 1.0 | Entity mass (must be > 0), affects momentum and knockback |
| `dragCoefficient` | double | 0.5 | Air resistance coefficient (>= 0), slows entity motion |
| `invertedGravity` | boolean | false | Whether gravity is inverted (entity falls upward) |

**How to use:**

```java
// Create physics values for a heavy entity
PhysicsValues physics = new PhysicsValues(5.0, 0.3, false);
holder.addComponent(PhysicsValues.getComponentType(), physics);

// Create a floating entity (inverted gravity)
PhysicsValues floatingPhysics = new PhysicsValues(1.0, 0.5, true);
holder.addComponent(PhysicsValues.getComponentType(), floatingPhysics);

// Modify physics at runtime
PhysicsValues physics = store.getComponent(ref, PhysicsValues.getComponentType());
physics.scale(2.0f);  // Double mass and drag

// Reset to defaults
physics.resetToDefault();
```

**Usage notes:**
- Mass affects knockback resistance - heavier entities are pushed less
- Drag coefficient affects how quickly entities slow down in air
- Inverted gravity can be used for special effects or gameplay mechanics
- Works with `Velocity` component for motion calculations

---

### Projectile (Marker Component)

**Package:** `com.hypixel.hytale.server.core.modules.projectile.component`

The `Projectile` marker component identifies an entity as a projectile. Uses the singleton pattern for memory efficiency.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/projectile/component/Projectile.java`

```java
public class Projectile implements Component<EntityStore> {
   @Nonnull
   public static Projectile INSTANCE = new Projectile();
   @Nonnull
   public static final BuilderCodec<Projectile> CODEC =
       BuilderCodec.builder(Projectile.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, Projectile> getComponentType() {
      return ProjectileModule.get().getProjectileComponentType();
   }

   private Projectile() {}

   @Override
   public Component<EntityStore> clone() {
      return this;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Mark entity as a projectile
holder.addComponent(Projectile.getComponentType(), Projectile.INSTANCE);

// Check if entity is a projectile
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isProjectile = archetype.contains(Projectile.getComponentType());

// Remove projectile marker
commandBuffer.removeComponent(ref, Projectile.getComponentType());
```

**Usage notes:**
- Used by projectile systems to identify entities that should follow ballistic physics
- Different from `ProjectileComponent` which stores projectile state data
- Projectiles typically also have `Velocity`, `TransformComponent`, and `DespawnComponent`

---

## Animation and Model Components

These components handle entity visual representation including models and animations.

### ActiveAnimationComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `ActiveAnimationComponent` tracks which animations are currently playing on each animation slot of an entity. Supports multiple simultaneous animations on different slots.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/ActiveAnimationComponent.java`

```java
public class ActiveAnimationComponent implements Component<EntityStore> {
   private final String[] activeAnimations = new String[AnimationSlot.VALUES.length];
   private boolean isNetworkOutdated = false;

   public static ComponentType<EntityStore, ActiveAnimationComponent> getComponentType() {
      return EntityModule.get().getActiveAnimationComponentType();
   }

   public String[] getActiveAnimations();
   public void setPlayingAnimation(AnimationSlot slot, @Nullable String animation);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `activeAnimations` | String[] | Array of animation IDs indexed by AnimationSlot |
| `isNetworkOutdated` | boolean | Flag for network synchronization |

**AnimationSlot enum (from protocol):**

| Slot | Description |
|------|-------------|
| `Body` | Main body animation (walk, run, idle) |
| `Arms` | Arm animations (attack, block, use) |
| `Head` | Head animations (look around) |
| `Overlay` | Overlay effects (hit flash, glow) |

**How to use:**

```java
// Get animation component
ActiveAnimationComponent anim = store.getComponent(ref, ActiveAnimationComponent.getComponentType());

// Set walking animation on body slot
anim.setPlayingAnimation(AnimationSlot.Body, "walk");

// Set attack animation on arms slot
anim.setPlayingAnimation(AnimationSlot.Arms, "sword_swing");

// Clear an animation slot
anim.setPlayingAnimation(AnimationSlot.Overlay, null);

// Get all active animations
String[] animations = anim.getActiveAnimations();
String bodyAnim = animations[AnimationSlot.Body.ordinal()];
```

**Usage notes:**
- Animations are referenced by string IDs defined in model assets
- Multiple slots allow blending animations (e.g., walking while attacking)
- Network sync ensures clients see the same animations
- Animation transitions are handled by the animation system

---

### ModelComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `ModelComponent` stores the current model for an entity. This determines the visual appearance and available animations.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/ModelComponent.java`

```java
public class ModelComponent implements Component<EntityStore> {
   private final Model model;
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, ModelComponent> getComponentType() {
      return EntityModule.get().getModelComponentType();
   }

   public ModelComponent(Model model);
   public Model getModel();
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `model` | Model | The entity's current model asset |
| `isNetworkOutdated` | boolean | Flag for network synchronization |

**How to use:**

```java
// Get model from assets
Model zombieModel = Model.getAssetMap().getAsset("hytale:zombie");

// Create entity with model
holder.addComponent(ModelComponent.getComponentType(), new ModelComponent(zombieModel));

// Access model data
ModelComponent modelComp = store.getComponent(ref, ModelComponent.getComponentType());
Model model = modelComp.getModel();

// Get model properties
String modelId = model.getId();
BoundingBox bounds = model.getBoundingBox();
```

**Usage notes:**
- Models define entity appearance, hitbox, and animation skeleton
- Changing models at runtime triggers network sync to clients
- Works with `ActiveAnimationComponent` for animation playback
- Model assets are loaded from game data files

---

### PersistentModel

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `PersistentModel` component stores a model reference that persists with entity serialization. Unlike `ModelComponent`, this stores only a reference and is saved/loaded with the entity.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PersistentModel.java`

```java
public class PersistentModel implements Component<EntityStore> {
   public static final BuilderCodec<PersistentModel> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("Model", Model.ModelReference.CODEC), ...)
      .build();

   private Model.ModelReference modelReference;

   public static ComponentType<EntityStore, PersistentModel> getComponentType() {
      return EntityModule.get().getPersistentModelComponentType();
   }

   public PersistentModel(Model.ModelReference modelReference);
   public Model.ModelReference getModelReference();
   public void setModelReference(Model.ModelReference modelReference);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `modelReference` | Model.ModelReference | Reference to the model asset |

**How to use:**

```java
// Create persistent model reference
Model.ModelReference modelRef = new Model.ModelReference("hytale:custom_npc");
holder.addComponent(PersistentModel.getComponentType(), new PersistentModel(modelRef));

// Access persistent model
PersistentModel persistent = store.getComponent(ref, PersistentModel.getComponentType());
Model.ModelReference ref = persistent.getModelReference();

// Update model reference
persistent.setModelReference(new Model.ModelReference("hytale:different_model"));
```

**Usage notes:**
- Used for entities that need to remember their model across saves
- Model.ModelReference is a lightweight reference, not the full model data
- The actual Model is resolved from the reference when needed
- Commonly used for NPCs with customizable appearances

---

### PersistentDynamicLight

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `PersistentDynamicLight` component adds a dynamic light source to an entity that persists with serialization. The light follows the entity and illuminates the surrounding area.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PersistentDynamicLight.java`

```java
public class PersistentDynamicLight implements Component<EntityStore> {
   public static final BuilderCodec<PersistentDynamicLight> CODEC = BuilderCodec.builder(...)
      .addField(new KeyedCodec<>("Light", ProtocolCodecs.COLOR_LIGHT), ...)
      .build();

   private ColorLight colorLight;

   public static ComponentType<EntityStore, PersistentDynamicLight> getComponentType() {
      return EntityModule.get().getPersistentDynamicLightComponentType();
   }

   public PersistentDynamicLight(ColorLight colorLight);
   public ColorLight getColorLight();
   public void setColorLight(ColorLight colorLight);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `colorLight` | ColorLight | Light color and intensity settings |

**How to use:**

```java
// Create a torch-like orange light
ColorLight torchLight = new ColorLight(255, 200, 100, 15);  // RGB + radius
holder.addComponent(PersistentDynamicLight.getComponentType(),
    new PersistentDynamicLight(torchLight));

// Create a magical blue glow
ColorLight magicLight = new ColorLight(100, 150, 255, 10);
holder.addComponent(PersistentDynamicLight.getComponentType(),
    new PersistentDynamicLight(magicLight));

// Update light at runtime
PersistentDynamicLight light = store.getComponent(ref, PersistentDynamicLight.getComponentType());
light.setColorLight(new ColorLight(255, 0, 0, 20));  // Red warning light
```

**Usage notes:**
- Light radius is in blocks
- Color values are RGB (0-255)
- Light follows entity position automatically
- Used for glowing entities, held torches, magical effects
- Persists across world saves and loads

---

### HeadRotation

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `HeadRotation` component tracks the independent rotation of an entity's head, separate from body rotation. This allows entities to look at targets while moving in a different direction.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/HeadRotation.java`

```java
public class HeadRotation implements Component<EntityStore> {
   public static final BuilderCodec<HeadRotation> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("Rotation", Vector3f.ROTATION), ...)
      .build();

   private final Vector3f rotation = new Vector3f();

   public static ComponentType<EntityStore, HeadRotation> getComponentType() {
      return EntityModule.get().getHeadRotationComponentType();
   }

   public HeadRotation();
   public HeadRotation(Vector3f rotation);
   public Vector3f getRotation();
   public void setRotation(Vector3f rotation);
   public Vector3d getDirection();
   public Vector3i getAxisDirection();
   public Vector3i getHorizontalAxisDirection();
   public Axis getAxis();
   public void teleportRotation(Vector3f rotation);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `rotation` | Vector3f | Yaw, pitch, and roll of the head |

**How to use:**

```java
// Create entity with head rotation
holder.addComponent(HeadRotation.getComponentType(), new HeadRotation());

// Make entity look at a position
HeadRotation head = store.getComponent(ref, HeadRotation.getComponentType());
Vector3d entityPos = transform.getPosition();
Vector3d targetPos = getTargetPosition();
Vector3d direction = targetPos.subtract(entityPos).normalize();
float yaw = (float) Math.atan2(-direction.getX(), -direction.getZ());
float pitch = (float) Math.asin(direction.getY());
head.setRotation(new Vector3f(pitch, yaw, 0));

// Get look direction as unit vector
Vector3d lookDir = head.getDirection();

// Get dominant axis (for block placement, etc.)
Axis dominantAxis = head.getAxis();
```

**Usage notes:**
- Yaw is horizontal rotation (looking left/right)
- Pitch is vertical rotation (looking up/down)
- Roll is tilt rotation (rarely used for heads)
- `getAxisDirection()` returns the nearest cardinal direction
- Used by AI to track look-at targets independently of movement

---

## Tag and Marker Components

These are lightweight components that mark entities with specific flags or categories.

### HiddenFromAdventurePlayers

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `HiddenFromAdventurePlayers` marker component hides an entity from players in Adventure Mode. The entity is still visible to players in Creative or other modes. Uses the singleton pattern.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/HiddenFromAdventurePlayers.java`

```java
public class HiddenFromAdventurePlayers implements Component<EntityStore> {
   public static final HiddenFromAdventurePlayers INSTANCE = new HiddenFromAdventurePlayers();
   public static final BuilderCodec<HiddenFromAdventurePlayers> CODEC =
       BuilderCodec.builder(HiddenFromAdventurePlayers.class, () -> INSTANCE).build();

   public static ComponentType<EntityStore, HiddenFromAdventurePlayers> getComponentType() {
      return EntityModule.get().getHiddenFromAdventurePlayerComponentType();
   }

   private HiddenFromAdventurePlayers() {}

   @Override
   public Component<EntityStore> clone() {
      return INSTANCE;
   }
}
```

**Properties:**
- None (marker component)

**How to add/remove:**

```java
// Hide entity from adventure players
holder.addComponent(HiddenFromAdventurePlayers.getComponentType(),
    HiddenFromAdventurePlayers.INSTANCE);

// Check if entity is hidden
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isHidden = archetype.contains(HiddenFromAdventurePlayers.getComponentType());

// Make entity visible again
commandBuffer.removeComponent(ref, HiddenFromAdventurePlayers.getComponentType());
```

**Usage notes:**
- Used for debug entities, editor-only objects, or admin tools
- Entity still exists and processes normally, just not visible
- Useful for game mode-specific content
- Combine with other visibility systems for fine-grained control

---

### WorldGenId

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `WorldGenId` component stores the world generation ID for entities spawned by world generation. This helps track which generation pass created the entity and prevent duplicate spawning.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/WorldGenId.java`

```java
public class WorldGenId implements Component<EntityStore> {
   public static final int NON_WORLD_GEN_ID = 0;
   public static final BuilderCodec<WorldGenId> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("WorldGenId", Codec.INTEGER), ...)
      .build();

   private int worldGenId;

   public static ComponentType<EntityStore, WorldGenId> getComponentType() {
      return EntityModule.get().getWorldGenIdComponentType();
   }

   public WorldGenId(int worldGenId);
   public int getWorldGenId();
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `worldGenId` | int | 0 | World generation pass ID (0 = not from world gen) |

**How to use:**

```java
// Mark entity as generated by world gen pass 5
holder.addComponent(WorldGenId.getComponentType(), new WorldGenId(5));

// Check if entity is from world generation
WorldGenId worldGen = store.getComponent(ref, WorldGenId.getComponentType());
if (worldGen != null && worldGen.getWorldGenId() != WorldGenId.NON_WORLD_GEN_ID) {
    // Entity was created by world generation
    int passId = worldGen.getWorldGenId();
}
```

**Usage notes:**
- `NON_WORLD_GEN_ID` (0) indicates the entity was not spawned by world generation
- Different generation passes have unique IDs
- Used to prevent re-generating entities in already-generated areas
- Related to `FromWorldGen` component which stores additional world gen info

---

## AI and Behavior Components

These components support the NPC AI system including pathfinding, roles, and behavior trees.

### NPCEntity

**Package:** `com.hypixel.hytale.server.npc.entities`

The `NPCEntity` component is a comprehensive component that manages Non-Player Character behavior. It extends `LivingEntity` and provides AI, pathfinding, roles, and state management.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/entities/NPCEntity.java`

```java
public class NPCEntity extends LivingEntity implements INonPlayerCharacter {
   public static final BuilderCodec<NPCEntity> CODEC = BuilderCodec.builder(...)
      .addField(new KeyedCodec<>("Env", Codec.STRING), ...)         // Environment
      .addField(new KeyedCodec<>("HvrPhs", Codec.DOUBLE), ...)      // Hover phase
      .addField(new KeyedCodec<>("HvrHght", Codec.DOUBLE), ...)     // Hover height
      .addField(new KeyedCodec<>("SpawnName", Codec.STRING), ...)   // Spawn role name
      .addField(new KeyedCodec<>("MdlScl", Codec.DOUBLE), ...)      // Model scale
      .append(new KeyedCodec<>("PathManager", PathManager.CODEC), ...) // Pathfinding
      .addField(new KeyedCodec<>("LeashPos", Vector3d.CODEC), ...)  // Leash position
      .addField(new KeyedCodec<>("RoleName", Codec.STRING), ...)    // Current role
      .build();

   private Role role;
   private PathManager pathManager;
   private Vector3d leashPoint;
   private float hoverPhase;
   private double hoverHeight;
   private float initialModelScale;
   // ... and more

   public static ComponentType<EntityStore, NPCEntity> getComponentType();
   public Role getRole();
   public PathManager getPathManager();
   public AlarmStore getAlarmStore();
   // ... and more methods
}
```

**Key Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `role` | Role | Current AI role defining behavior |
| `pathManager` | PathManager | Manages pathfinding and navigation |
| `leashPoint` | Vector3d | Tether point for NPCs with limited range |
| `hoverHeight` | double | Height offset for flying NPCs |
| `initialModelScale` | float | Model scaling factor |
| `environmentIndex` | int | Reference to environment asset |

**Related Classes:**

- **Role**: Defines NPC behavior, combat, state transitions, and instructions
- **PathManager**: Handles A* pathfinding and navigation
- **AlarmStore**: Manages timed events and alarms for the NPC

**How to use:**

```java
// Get NPC component
NPCEntity npc = store.getComponent(ref, NPCEntity.getComponentType());

// Access the role (behavior definition)
Role role = npc.getRole();
if (role != null) {
    String roleName = role.getRoleName();
    boolean isHostile = !role.isFriendly(ref, componentAccessor);
}

// Access pathfinding
PathManager pathManager = npc.getPathManager();
if (pathManager.hasPath()) {
    Vector3d nextWaypoint = pathManager.getNextWaypoint();
}

// Check NPC state
if (npc.isDespawning()) {
    // NPC is being removed
}

// Set leash point (limit NPC movement range)
npc.setLeashPoint(new Vector3d(100, 64, 200));
```

**Usage notes:**
- NPCEntity is a high-level component combining many AI features
- Roles define behavior through instruction trees and state machines
- PathManager uses A* algorithm for navigation
- Supports flocking, separation, and group behavior
- Includes combat support, target tracking, and interaction handling
- Environment affects NPC behavior (day/night, weather, biome)

---

### PathManager

**Package:** `com.hypixel.hytale.server.npc.entities`

The `PathManager` class manages pathfinding for NPC entities. It stores the current path, handles path calculation requests, and provides navigation utilities.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/entities/PathManager.java`

```java
public class PathManager {
   public static final BuilderCodec<PathManager> CODEC = ...;

   private Path currentPath;
   private int currentWaypointIndex;
   private boolean isPathPending;
   // ... pathfinding state

   public boolean hasPath();
   public Path getCurrentPath();
   public Vector3d getNextWaypoint();
   public void setPath(Path path);
   public void clearPath();
   public boolean advanceWaypoint();
   public float getRemainingDistance();
}
```

**Key Methods:**

| Method | Description |
|--------|-------------|
| `hasPath()` | Returns true if NPC has an active path |
| `getCurrentPath()` | Gets the current navigation path |
| `getNextWaypoint()` | Gets the next position to move toward |
| `setPath(Path)` | Sets a new path for the NPC |
| `clearPath()` | Clears the current path |
| `advanceWaypoint()` | Moves to the next waypoint in the path |
| `getRemainingDistance()` | Gets distance remaining to destination |

**Usage notes:**
- Paths are calculated using A* algorithm in `AStarBase`
- Supports ground, flying, and swimming navigation
- Waypoints are world positions the NPC moves between
- Path requests can be async to avoid blocking
- Works with motion controllers for actual movement

---

## Mount System Components

The following components are part of Hytale's mounting system, allowing entities to ride other entities or blocks (like chairs and minecarts).

### MountedComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

The `MountedComponent` is added to an entity when it is mounted on another entity or a block. It tracks what the entity is mounted to, the attachment offset, and the controller type.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/MountedComponent.java`

```java
public class MountedComponent implements Component<EntityStore> {
   private Ref<EntityStore> mountedToEntity;
   private Ref<ChunkStore> mountedToBlock;
   private MountController controller;
   private BlockMountType blockMountType;
   private Vector3f attachmentOffset = new Vector3f(0.0F, 0.0F, 0.0F);
   private long mountStartMs;
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, MountedComponent> getComponentType() {
      return MountPlugin.getInstance().getMountedComponentType();
   }

   // Constructors for entity mount and block mount
   public MountedComponent(Ref<EntityStore> mountedToEntity, Vector3f attachmentOffset, MountController controller);
   public MountedComponent(Ref<ChunkStore> mountedToBlock, Vector3f attachmentOffset, BlockMountType blockMountType);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `mountedToEntity` | `Ref<EntityStore>` | Reference to the entity being ridden (null if block mount) |
| `mountedToBlock` | `Ref<ChunkStore>` | Reference to the block being sat on (null if entity mount) |
| `controller` | `MountController` | Type of mount control (e.g., `Rideable`, `BlockMount`) |
| `blockMountType` | `BlockMountType` | Type of block mount (e.g., `Seat`, `Bed`) |
| `attachmentOffset` | `Vector3f` | Offset from mount point |
| `mountStartMs` | long | Timestamp when mount started |

**How to use:**

```java
// Mount an entity on another entity
MountedComponent mounted = new MountedComponent(
    mountRef,                    // Entity to ride
    new Vector3f(0, 1.5f, 0),   // Seat offset
    MountController.Rideable
);
commandBuffer.addComponent(riderRef, MountedComponent.getComponentType(), mounted);

// Mount on a block (chair/bed)
MountedComponent blockMount = new MountedComponent(
    blockRef,                    // Block reference
    seatOffset,                  // Attachment offset
    BlockMountType.Seat
);

// Check how long mounted
long durationMs = mounted.getMountedDurationMs();
```

**Usage notes:**
- Entity can only have one `MountedComponent` at a time
- Network synchronization is automatic when outdated flag is set
- Used for both rideable entities (horses) and block mounts (chairs, beds)

---

### MountedByComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

The `MountedByComponent` is added to an entity that can carry passengers. It tracks all entities currently riding it.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/MountedByComponent.java`

```java
public class MountedByComponent implements Component<EntityStore> {
   @Nonnull
   private final List<Ref<EntityStore>> passengers = new ObjectArrayList<>();

   public static ComponentType<EntityStore, MountedByComponent> getComponentType() {
      return MountPlugin.getInstance().getMountedByComponentType();
   }

   @Nonnull
   public List<Ref<EntityStore>> getPassengers();
   public void addPassenger(Ref<EntityStore> passenger);
   public void removePassenger(Ref<EntityStore> ref);
   @Nonnull
   public MountedByComponent withPassenger(Ref<EntityStore> passenger);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `passengers` | `List<Ref<EntityStore>>` | List of entities currently riding this entity |

**How to use:**

```java
// Add component to make entity rideable
holder.addComponent(MountedByComponent.getComponentType(), new MountedByComponent());

// Add a passenger
MountedByComponent mountedBy = store.getComponent(horseRef, MountedByComponent.getComponentType());
mountedBy.addPassenger(playerRef);

// Get all passengers
List<Ref<EntityStore>> passengers = mountedBy.getPassengers();
for (Ref<EntityStore> passenger : passengers) {
    // Process each rider
}

// Fluent API for initialization
MountedByComponent component = new MountedByComponent()
    .withPassenger(riderRef);
```

**Usage notes:**
- Automatically removes invalid (removed) passenger references
- Multiple passengers supported for vehicles/boats
- Paired with `MountedComponent` on the riding entities

---

### NPCMountComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

The `NPCMountComponent` marks an NPC as a mount (rideable creature). It stores the original role index so the NPC can resume normal behavior when dismounted.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/NPCMountComponent.java`

```java
public class NPCMountComponent implements Component<EntityStore> {
   public static final BuilderCodec<NPCMountComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("OriginalRoleIndex", Codec.INTEGER), ...)
      .build();

   private int originalRoleIndex;
   private PlayerRef ownerPlayerRef;
   private float anchorX, anchorY, anchorZ;

   public static ComponentType<EntityStore, NPCMountComponent> getComponentType() {
      return MountPlugin.getInstance().getMountComponentType();
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `originalRoleIndex` | int | Index of the NPC's original AI role |
| `ownerPlayerRef` | `PlayerRef` | The player who owns/tamed this mount |
| `anchorX/Y/Z` | float | Anchor point for the mount |

**How to use:**

```java
// Convert NPC to mount
NPCMountComponent mountComp = new NPCMountComponent();
mountComp.setOriginalRoleIndex(npc.getRole().getIndex());
mountComp.setOwnerPlayerRef(playerRef);
commandBuffer.addComponent(npcRef, NPCMountComponent.getComponentType(), mountComp);

// Restore original role when dismounted
int originalRole = mountComp.getOriginalRoleIndex();
```

**Usage notes:**
- Serialized with entity for persistence
- Owner tracking allows mount recall/taming mechanics
- Anchor point can limit mount wandering range

---

### BlockMountComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

The `BlockMountComponent` is attached to a chunk to track block-based seating (chairs, benches, beds). It manages multiple seat positions within a single block.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/BlockMountComponent.java`

```java
public class BlockMountComponent implements Component<ChunkStore> {
   private BlockMountType type;
   private Vector3i blockPos;
   private BlockType expectedBlockType;
   private int expectedRotation;
   private Map<BlockMountPoint, Ref<EntityStore>> entitiesByMountPoint;
   private Map<Ref<EntityStore>, BlockMountPoint> mountPointByEntity;

   public static ComponentType<ChunkStore, BlockMountComponent> getComponentType() {
      return MountPlugin.getInstance().getBlockMountComponentType();
   }

   public void putSeatedEntity(@Nonnull BlockMountPoint mountPoint, @Nonnull Ref<EntityStore> seatedEntity);
   public void removeSeatedEntity(@Nonnull Ref<EntityStore> seatedEntity);
   @Nullable
   public BlockMountPoint findAvailableSeat(@Nonnull Vector3i targetBlock,
                                            @Nonnull BlockMountPoint[] choices,
                                            @Nonnull Vector3f whereWasClicked);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | `BlockMountType` | Type of block mount (Seat, Bed, etc.) |
| `blockPos` | `Vector3i` | World position of the block |
| `expectedBlockType` | `BlockType` | Expected block type for validation |
| `expectedRotation` | int | Expected block rotation |

**How to use:**

```java
// Create block mount for a chair
BlockMountComponent chair = new BlockMountComponent(
    BlockMountType.Seat,
    blockPosition,
    chairBlockType,
    blockRotation
);

// Find and seat entity at nearest available seat
BlockMountPoint seat = chair.findAvailableSeat(blockPos, seatChoices, clickPos);
if (seat != null) {
    chair.putSeatedEntity(seat, playerRef);
}

// Remove entity from seat
chair.removeSeatedEntity(playerRef);

// Check if block mount is empty
if (chair.isDead()) {
    // Remove component - no more seated entities
}
```

**Usage notes:**
- Stored in `ChunkStore` (block components), not `EntityStore`
- Supports multiple seat positions per block (benches, couches)
- `findAvailableSeat` returns the closest unoccupied seat to click position
- Automatically cleans up invalid entity references

---

### MinecartComponent

**Package:** `com.hypixel.hytale.builtin.mounts.minecart`

The `MinecartComponent` identifies an entity as a minecart. It tracks hit damage for destruction and the source item for drops.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/minecart/MinecartComponent.java`

```java
public class MinecartComponent implements Component<EntityStore> {
   public static final BuilderCodec<MinecartComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("SourceItem", Codec.STRING), ...)
      .build();

   private int numberOfHits = 0;
   private Instant lastHit;
   private String sourceItem = "Rail_Kart";

   public static ComponentType<EntityStore, MinecartComponent> getComponentType() {
      return MountPlugin.getInstance().getMinecartComponentType();
   }
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `numberOfHits` | int | 0 | Number of times hit (for destruction) |
| `lastHit` | `Instant` | null | Time of last hit |
| `sourceItem` | String | "Rail_Kart" | Item ID dropped when destroyed |

**How to use:**

```java
// Create minecart entity
MinecartComponent minecart = new MinecartComponent("Custom_Minecart");
holder.addComponent(MinecartComponent.getComponentType(), minecart);

// Track damage
minecart.setNumberOfHits(minecart.getNumberOfHits() + 1);
minecart.setLastHit(Instant.now());

// Check if should break
if (minecart.getNumberOfHits() >= BREAK_THRESHOLD) {
    // Drop source item and remove entity
    String dropItem = minecart.getSourceItem();
}
```

**Usage notes:**
- Minecarts follow rail blocks automatically
- Multiple hit system allows hit-to-break destruction
- Source item determines what drops when minecart is destroyed

---

## Deployable System Components

Deployables are player-placed entities like turrets, traps, and other automated devices.

### DeployableComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

The `DeployableComponent` marks an entity as a deployable device. It tracks the owner, configuration, spawn time, and custom flags for deployable state.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableComponent.java`

```java
public class DeployableComponent implements Component<EntityStore> {
   private final Map<DeployableFlag, Integer> flags = new EnumMap<>(DeployableFlag.class);
   private DeployableConfig config;
   private Ref<EntityStore> owner;
   private UUID ownerUUID;
   private Instant spawnInstant;
   private float timeSinceLastAttack;
   private String spawnFace;

   public static ComponentType<EntityStore, DeployableComponent> getComponentType() {
      return DeployablesPlugin.get().getDeployableComponentType();
   }

   public enum DeployableFlag {
      STATE, LIVE, BURST_SHOTS, TRIGGERED;
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `config` | `DeployableConfig` | Configuration asset defining behavior |
| `owner` | `Ref<EntityStore>` | Reference to the deploying entity |
| `ownerUUID` | `UUID` | UUID of the owner for persistence |
| `spawnInstant` | `Instant` | When the deployable was placed |
| `timeSinceLastAttack` | float | Cooldown timer for attacks |
| `spawnFace` | String | Which face the deployable was placed on |
| `flags` | `Map<DeployableFlag, Integer>` | Custom state flags |

**DeployableFlag enum:**

| Flag | Description |
|------|-------------|
| `STATE` | Current state machine state |
| `LIVE` | Whether deployable is active |
| `BURST_SHOTS` | Remaining shots in burst |
| `TRIGGERED` | Whether trigger condition was met |

**How to use:**

```java
// Create deployable
DeployableComponent deployable = new DeployableComponent();
deployable.init(playerRef, store, config, Instant.now(), "up");
holder.addComponent(DeployableComponent.getComponentType(), deployable);

// Track attack cooldown
deployable.incrementTimeSinceLastAttack(deltaTime);
if (deployable.getTimeSinceLastAttack() >= config.getAttackCooldown()) {
    // Can attack
    deployable.setTimeSinceLastAttack(0);
}

// Use flags for custom state
deployable.setFlag(DeployableFlag.BURST_SHOTS, 3);
int remaining = deployable.getFlag(DeployableFlag.BURST_SHOTS);
```

**Usage notes:**
- Deployables tick via their `DeployableConfig` which defines behavior
- First tick runs initialization logic (e.g., play spawn animation)
- Owner tracking allows proper attribution of damage/kills

---

### DeployableOwnerComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

The `DeployableOwnerComponent` is attached to entities that own deployables. It tracks all deployables placed by the entity and enforces limits.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableOwnerComponent.java`

```java
public class DeployableOwnerComponent implements Component<EntityStore> {
   private final List<Pair<String, Ref<EntityStore>>> deployables = new ObjectArrayList<>();
   private final Object2IntMap<String> deployableCountPerId = new Object2IntOpenHashMap<>();

   public static ComponentType<EntityStore, DeployableOwnerComponent> getComponentType() {
      return DeployablesPlugin.get().getDeployableOwnerComponentType();
   }

   public void registerDeployable(...);
   public void deRegisterDeployable(@Nonnull String id, @Nonnull Ref<EntityStore> deployable);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `deployables` | `List<Pair<String, Ref<EntityStore>>>` | All owned deployables |
| `deployableCountPerId` | `Object2IntMap<String>` | Count per deployable type |

**How to use:**

```java
// Get owner component
DeployableOwnerComponent owner = store.getComponent(playerRef,
    DeployableOwnerComponent.getComponentType());

// Register new deployable
owner.registerDeployable(playerRef, deployableComp, "turret", turretRef, store);

// Deregister when destroyed
owner.deRegisterDeployable("turret", turretRef);
```

**Usage notes:**
- Automatically destroys oldest deployables when limits exceeded
- Per-type and global limits from `GameplayConfig`
- Handles cleanup on entity removal

---

### DeployableProjectileComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

The `DeployableProjectileComponent` marks a projectile as fired by a deployable. It tracks the previous position for collision detection.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableProjectileComponent.java`

```java
public class DeployableProjectileComponent implements Component<EntityStore> {
   protected Vector3d previousTickPosition;

   public static ComponentType<EntityStore, DeployableProjectileComponent> getComponentType() {
      return DeployablesPlugin.get().getDeployableProjectileComponentType();
   }

   public Vector3d getPreviousTickPosition();
   public void setPreviousTickPosition(@Nonnull Vector3d pos);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `previousTickPosition` | `Vector3d` | Position at the previous tick |

**Usage notes:**
- Used for swept collision detection (line from previous to current position)
- Essential for fast-moving projectiles that might skip through targets

---

### DeployableProjectileShooterComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

The `DeployableProjectileShooterComponent` is added to deployables that can fire projectiles. It tracks active projectiles and the current target.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableProjectileShooterComponent.java`

```java
public class DeployableProjectileShooterComponent implements Component<EntityStore> {
   protected final List<Ref<EntityStore>> projectiles = new ObjectArrayList<>();
   protected Ref<EntityStore> activeTarget;

   public static ComponentType<EntityStore, DeployableProjectileShooterComponent> getComponentType() {
      return DeployablesPlugin.get().getDeployableProjectileShooterComponentType();
   }

   public void spawnProjectile(...);
   public List<Ref<EntityStore>> getProjectiles();
   public Ref<EntityStore> getActiveTarget();
   public void setActiveTarget(Ref<EntityStore> target);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `projectiles` | `List<Ref<EntityStore>>` | Currently active projectiles |
| `activeTarget` | `Ref<EntityStore>` | Current target entity |

**Usage notes:**
- Manages lifetime of fired projectiles
- Target tracking for auto-aim turrets
- Cleanup when projectiles hit or despawn

---

## Adventure System Components

These components are part of Hytale's adventure mode features including quests, reputation, and farming.

### ObjectiveHistoryComponent

**Package:** `com.hypixel.hytale.builtin.adventure.objectives.components`

The `ObjectiveHistoryComponent` tracks a player's quest/objective progress and completion history.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/objectives/components/ObjectiveHistoryComponent.java`

```java
public class ObjectiveHistoryComponent implements Component<EntityStore> {
   public static final BuilderCodec<ObjectiveHistoryComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("ObjectiveHistory", new MapCodec<>(...)), ...)
      .append(new KeyedCodec<>("ObjectiveLineHistory", new MapCodec<>(...)), ...)
      .build();

   private Map<String, ObjectiveHistoryData> objectiveHistoryMap = new Object2ObjectOpenHashMap<>();
   private Map<String, ObjectiveLineHistoryData> objectiveLineHistoryMap = new Object2ObjectOpenHashMap<>();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `objectiveHistoryMap` | `Map<String, ObjectiveHistoryData>` | History per objective ID |
| `objectiveLineHistoryMap` | `Map<String, ObjectiveLineHistoryData>` | History per objective line |

**Usage notes:**
- Persisted with player data
- Tracks completion status, timestamps, and progress
- Used for quest UI and progression checks

---

### ReputationGroupComponent

**Package:** `com.hypixel.hytale.builtin.adventure.reputation`

The `ReputationGroupComponent` assigns an entity to a reputation group, affecting how factions view it.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/reputation/ReputationGroupComponent.java`

```java
public class ReputationGroupComponent implements Component<EntityStore> {
   private final String reputationGroupId;

   public static ComponentType<EntityStore, ReputationGroupComponent> getComponentType() {
      return ReputationPlugin.get().getReputationGroupComponentType();
   }

   public ReputationGroupComponent(@Nonnull String reputationGroupId);
   public String getReputationGroupId();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `reputationGroupId` | String | ID of the reputation group (faction) |

**How to use:**

```java
// Assign entity to a faction
ReputationGroupComponent rep = new ReputationGroupComponent("hytale:village_faction");
holder.addComponent(ReputationGroupComponent.getComponentType(), rep);

// Check faction for AI decisions
String faction = rep.getReputationGroupId();
boolean isFriendly = reputationSystem.areFactionsFriendly(playerFaction, faction);
```

**Usage notes:**
- NPCs use this to determine friend/foe relationships
- Player actions affect reputation with different groups
- Tied to the reputation/faction system

---

### CoopResidentComponent

**Package:** `com.hypixel.hytale.builtin.adventure.farming.component`

The `CoopResidentComponent` marks an entity as a resident of a chicken coop or similar farming structure.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/farming/component/CoopResidentComponent.java`

```java
public class CoopResidentComponent implements Component<EntityStore> {
   public static final BuilderCodec<CoopResidentComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("CoopLocation", Vector3i.CODEC), ...)
      .append(new KeyedCodec<>("MarkedForDespawn", BuilderCodec.BOOLEAN), ...)
      .build();

   private Vector3i coopLocation = new Vector3i();
   private boolean markedForDespawn;

   public static ComponentType<EntityStore, CoopResidentComponent> getComponentType() {
      return FarmingPlugin.get().getCoopResidentComponentType();
   }
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `coopLocation` | `Vector3i` | (0,0,0) | Position of the home coop |
| `markedForDespawn` | boolean | false | Whether entity should despawn |

**Usage notes:**
- Used for chickens, farm animals that return to structures
- Coop location for pathfinding "home"
- Despawn marking for cleanup when coop destroyed

---

## Spawn System Components

Components related to NPC and entity spawning.

### SpawnSuppressionComponent

**Package:** `com.hypixel.hytale.server.spawning.suppression.component`

The `SpawnSuppressionComponent` marks an entity as suppressing spawns in an area (like torches preventing mob spawns).

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/spawning/suppression/component/SpawnSuppressionComponent.java`

```java
public class SpawnSuppressionComponent implements Component<EntityStore> {
   public static final BuilderCodec<SpawnSuppressionComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("SpawnSuppression", Codec.STRING), ...)
      .build();

   private String spawnSuppression;

   public static ComponentType<EntityStore, SpawnSuppressionComponent> getComponentType() {
      return SpawningPlugin.get().getSpawnSuppressorComponentType();
   }

   public String getSpawnSuppression();
   public void setSpawnSuppression(String spawnSuppression);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `spawnSuppression` | String | ID of the spawn suppression asset |

**How to use:**

```java
// Add spawn suppression to a light source entity
SpawnSuppressionComponent suppression = new SpawnSuppressionComponent("hytale:torch_suppression");
holder.addComponent(SpawnSuppressionComponent.getComponentType(), suppression);
```

**Usage notes:**
- References a `SpawnSuppression` asset defining radius and conditions
- Used by torches, campfires, and other light sources
- Prevents hostile mob spawning in the area

---

## NPC System Components

### StepComponent

**Package:** `com.hypixel.hytale.server.npc.components`

The `StepComponent` controls the tick rate for NPC AI processing, allowing slower updates for distant or unimportant NPCs.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/StepComponent.java`

```java
public class StepComponent implements Component<EntityStore> {
   private final float tickLength;

   public static ComponentType<EntityStore, StepComponent> getComponentType() {
      return NPCPlugin.get().getStepComponentType();
   }

   public StepComponent(float tickLength);
   public float getTickLength();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `tickLength` | float | Time between AI updates in seconds |

**Usage notes:**
- Higher tick length = less frequent updates = better performance
- Distant NPCs can use longer tick lengths
- Immutable once created

---

### FailedSpawnComponent

**Package:** `com.hypixel.hytale.server.npc.components`

The `FailedSpawnComponent` is a marker component added when an NPC fails to spawn properly. Used for cleanup and debugging.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/FailedSpawnComponent.java`

```java
public class FailedSpawnComponent implements Component<EntityStore> {
   public static ComponentType<EntityStore, FailedSpawnComponent> getComponentType() {
      return NPCPlugin.get().getFailedSpawnComponentType();
   }
}
```

**Properties:**
- None (marker component)

**Usage notes:**
- Systems check for this to clean up failed spawns
- Useful for debugging spawn issues

---

## Utility Components

### SnapshotBuffer

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `SnapshotBuffer` component stores historical position/rotation data for an entity. Used for lag compensation and rewinding entity state.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/SnapshotBuffer.java`

```java
public class SnapshotBuffer implements Component<EntityStore> {
   private EntitySnapshot[] snapshots;
   private int currentTickIndex;
   private int oldestTickIndex;
   private int currentIndex;

   public static ComponentType<EntityStore, SnapshotBuffer> getComponentType() {
      return EntityModule.get().getSnapshotBufferComponentType();
   }

   @Nonnull
   public EntitySnapshot getSnapshotClamped(int tickIndex);
   @Nullable
   public EntitySnapshot getSnapshot(int tickIndex);
   public void storeSnapshot(int tickIndex, @Nonnull Vector3d position, @Nonnull Vector3f bodyRotation);
   public void resize(int newLength);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `snapshots` | `EntitySnapshot[]` | Ring buffer of historical snapshots |
| `currentTickIndex` | int | Current server tick |
| `oldestTickIndex` | int | Oldest available snapshot tick |

**How to use:**

```java
// Initialize buffer for 20 ticks of history
SnapshotBuffer buffer = new SnapshotBuffer();
buffer.resize(20);

// Store snapshot each tick
buffer.storeSnapshot(tickIndex, position, rotation);

// Retrieve historical position for lag compensation
EntitySnapshot historical = buffer.getSnapshotClamped(tickIndex - playerLatencyTicks);
Vector3d pastPosition = historical.getPosition();
```

**Usage notes:**
- Essential for server-side hit detection with lag compensation
- Ring buffer automatically overwrites oldest entries
- `getSnapshotClamped` returns oldest if requested tick is too old

---

### ApplyRandomSkinPersistedComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

The `ApplyRandomSkinPersistedComponent` is a marker component indicating that an entity should have a random skin applied on load.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/ApplyRandomSkinPersistedComponent.java`

```java
public class ApplyRandomSkinPersistedComponent implements Component<EntityStore> {
   public static final ApplyRandomSkinPersistedComponent INSTANCE = new ApplyRandomSkinPersistedComponent();
   public static final BuilderCodec<ApplyRandomSkinPersistedComponent> CODEC = ...;

   public static ComponentType<EntityStore, ApplyRandomSkinPersistedComponent> getComponentType() {
      return EntityModule.get().getApplyRandomSkinPersistedComponent();
   }
}
```

**Properties:**
- None (marker component, singleton pattern)

**Usage notes:**
- Added to NPCs that should have varied appearances
- Skin applied from a pool on entity load
- Persisted so skin stays consistent across saves

---

### PlacedByInteractionComponent

**Package:** `com.hypixel.hytale.server.core.modules.interaction.components`

The `PlacedByInteractionComponent` is a chunk component that tracks who placed a block. Used for permissions, ownership, and attribution.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/interaction/components/PlacedByInteractionComponent.java`

```java
public class PlacedByInteractionComponent implements Component<ChunkStore> {
   public static final BuilderCodec<PlacedByInteractionComponent> CODEC = BuilderCodec.builder(...)
      .appendInherited(new KeyedCodec<>("WhoPlacedUuid", Codec.UUID_BINARY), ...)
      .build();

   private UUID whoPlacedUuid;

   public static ComponentType<ChunkStore, PlacedByInteractionComponent> getComponentType() {
      return InteractionModule.get().getPlacedByComponentType();
   }

   public UUID getWhoPlacedUuid();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `whoPlacedUuid` | UUID | UUID of the entity that placed the block |

**How to use:**

```java
// When player places block
PlacedByInteractionComponent placed = new PlacedByInteractionComponent(playerUuid);
chunkCommandBuffer.addComponent(blockRef, PlacedByInteractionComponent.getComponentType(), placed);

// Check who placed a block
PlacedByInteractionComponent placed = chunkStore.getComponent(blockRef,
    PlacedByInteractionComponent.getComponentType());
if (placed != null) {
    UUID placer = placed.getWhoPlacedUuid();
}
```

**Usage notes:**
- Stored in `ChunkStore` (block components)
- Used for land claim systems, griefing protection
- Persisted with chunk data

---

### AmbientEmitterComponent

**Package:** `com.hypixel.hytale.builtin.ambience.components`

The `AmbientEmitterComponent` makes an entity emit ambient sounds. Used for environmental audio like waterfalls, wind, or machinery.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/ambience/components/AmbientEmitterComponent.java`

```java
public class AmbientEmitterComponent implements Component<EntityStore> {
   public static final BuilderCodec<AmbientEmitterComponent> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("SoundEventId", Codec.STRING), ...)
      .build();

   private String soundEventId;
   private Ref<EntityStore> spawnedEmitter;

   public static ComponentType<EntityStore, AmbientEmitterComponent> getComponentType() {
      return AmbiencePlugin.get().getAmbientEmitterComponentType();
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `soundEventId` | String | ID of the sound event to play |
| `spawnedEmitter` | `Ref<EntityStore>` | Reference to spawned emitter entity |

**How to use:**

```java
// Create ambient sound emitter
AmbientEmitterComponent ambient = new AmbientEmitterComponent();
ambient.setSoundEventId("hytale:waterfall_ambient");
holder.addComponent(AmbientEmitterComponent.getComponentType(), ambient);
```

**Usage notes:**
- Sound plays in a loop at entity position
- Used for static environmental audio sources
- Can be attached to block entities or invisible markers

---

### AmbienceTracker

**Package:** `com.hypixel.hytale.builtin.ambience.components`

The `AmbienceTracker` component tracks environmental music per player and synchronizes with the client. Handles forced music overrides and environment-based music changes.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/ambience/components/AmbienceTracker.java`

```java
public class AmbienceTracker implements Component<EntityStore> {
   private final UpdateEnvironmentMusic musicPacket = new UpdateEnvironmentMusic(0);
   private int forcedMusicIndex;

   public static ComponentType<EntityStore, AmbienceTracker> getComponentType() {
      return AmbiencePlugin.get().getAmbienceTrackerComponentType();
   }

   public void setForcedMusicIndex(int forcedMusicIndex);
   public int getForcedMusicIndex();
   public UpdateEnvironmentMusic getMusicPacket();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `forcedMusicIndex` | int | Index of forced music override (0 = no override) |
| `musicPacket` | UpdateEnvironmentMusic | Reusable packet for network sync |

**Usage notes:**
- Attached to players to track their current music state
- Forced music index overrides environment-based selection
- Music changes smoothly based on player's environment

---

### WeatherTracker

**Package:** `com.hypixel.hytale.builtin.weather.components`

The `WeatherTracker` component tracks weather state per player and synchronizes weather transitions with the client based on environment.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/weather/components/WeatherTracker.java`

```java
public class WeatherTracker implements Component<EntityStore> {
   private final UpdateWeather updateWeather = new UpdateWeather(0, 10.0F);
   private final Vector3i previousBlockPosition = new Vector3i();
   private int environmentId;
   private boolean firstSendForWorld = true;

   public static ComponentType<EntityStore, WeatherTracker> getComponentType() {
      return WeatherPlugin.get().getWeatherTrackerComponentType();
   }

   public void updateWeather(PlayerRef playerRef, WeatherResource weatherComponent,
       TransformComponent transformComponent, float transitionSeconds, ...);
   public void sendWeatherIndex(PlayerRef playerRef, int weatherIndex, float transitionSeconds);
   public int getEnvironmentId();
   public int getWeatherIndex();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `environmentId` | int | Current environment ID for weather lookup |
| `previousBlockPosition` | Vector3i | Last known block position for change detection |
| `firstSendForWorld` | boolean | Flag for initial world weather sync |

**Usage notes:**
- Weather updates when player moves to different environment
- Smooth transitions with configurable duration
- Supports forced weather override via WeatherResource

---

### TeleportHistory

**Package:** `com.hypixel.hytale.builtin.teleport.components`

The `TeleportHistory` component maintains a browser-like back/forward navigation history for player teleports. Supports waypoint naming and cross-world teleportation.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/teleport/components/TeleportHistory.java`

```java
public class TeleportHistory implements Component<EntityStore> {
   private static final int MAX_TELEPORT_HISTORY = 100;
   private final Deque<Waypoint> back = new ArrayDeque<>();
   private final Deque<Waypoint> forward = new ArrayDeque<>();

   public static ComponentType<EntityStore, TeleportHistory> getComponentType() {
      return TeleportPlugin.get().getTeleportHistoryComponentType();
   }

   public void forward(Ref<EntityStore> ref, int count);
   public void back(Ref<EntityStore> ref, int count);
   public void append(World world, Vector3d pos, Vector3f rotation, String key);
   public int getForwardSize();
   public int getBackSize();

   public static class Waypoint {
      private final String world;
      private final Vector3d position;
      private final Vector3f rotation;
      private final String message;  // Optional waypoint name
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `back` | `Deque<Waypoint>` | Stack of previous locations |
| `forward` | `Deque<Waypoint>` | Stack of forward locations (after going back) |

**How to use:**

```java
// Record current position before teleport
TeleportHistory history = store.getComponent(playerRef, TeleportHistory.getComponentType());
history.append(world, currentPos, currentRotation, "Named Waypoint");

// Go back in history
history.back(playerRef, 1);  // Go back 1 step

// Go forward in history
history.forward(playerRef, 1);  // Go forward 1 step
```

**Usage notes:**
- Maximum 100 entries in history (oldest removed when exceeded)
- Forward history cleared when appending new waypoints
- Supports cross-world navigation
- Displays localized messages for teleport feedback

---

### PortalDevice

**Package:** `com.hypixel.hytale.builtin.portals.components`

The `PortalDevice` is a chunk component that stores portal block configuration. Links portals to destination worlds and defines portal appearance.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/portals/components/PortalDevice.java`

```java
public class PortalDevice implements Component<ChunkStore> {
   public static final BuilderCodec<PortalDevice> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("Config", PortalDeviceConfig.CODEC), ...)
      .append(new KeyedCodec<>("BaseBlockType", Codec.STRING), ...)
      .append(new KeyedCodec<>("DestinationWorld", Codec.UUID_BINARY), ...)
      .build();

   private PortalDeviceConfig config;
   private String baseBlockTypeKey;
   private UUID destinationWorldUuid;

   public static ComponentType<ChunkStore, PortalDevice> getComponentType() {
      return PortalsPlugin.getInstance().getPortalDeviceComponentType();
   }

   public PortalDeviceConfig getConfig();
   public BlockType getBaseBlockType();
   public World getDestinationWorld();
   public void setDestinationWorld(World world);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `config` | PortalDeviceConfig | Portal behavior configuration |
| `baseBlockTypeKey` | String | Block type ID for the portal frame |
| `destinationWorldUuid` | UUID | Target world for teleportation |

**Usage notes:**
- Stored in `ChunkStore` (block components)
- Persisted with world data
- Works with PortalDeviceConfig for behavior customization

---

### Teleporter

**Package:** `com.hypixel.hytale.builtin.adventure.teleporter.component`

The `Teleporter` is a chunk component for teleporter blocks. Supports destination via coordinates, warp names, or relative transforms.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/teleporter/component/Teleporter.java`

```java
public class Teleporter implements Component<ChunkStore> {
   public static final BuilderCodec<Teleporter> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("World", Codec.UUID_BINARY), ...)
      .append(new KeyedCodec<>("Transform", Transform.CODEC), ...)
      .append(new KeyedCodec<>("Relative", Codec.BYTE), ...)
      .append(new KeyedCodec<>("Warp", Codec.STRING), ...)
      .append(new KeyedCodec<>("WarpNameWordList", Codec.STRING), ...)
      .build();

   private UUID worldUuid;
   private Transform transform;
   private byte relativeMask;
   private String warp;

   public static ComponentType<ChunkStore, Teleporter> getComponentType() {
      return TeleporterPlugin.get().getTeleporterComponentType();
   }

   public Teleport toTeleport(Vector3d currentPosition, Vector3f currentRotation, Vector3i blockPosition);
   public boolean isValid();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `worldUuid` | UUID | Target world (null = same world) |
| `transform` | Transform | Target position/rotation |
| `relativeMask` | byte | Bit flags for relative coordinate modes |
| `warp` | String | Named warp point (alternative to coordinates) |
| `warpNameWordListKey` | String | Word list for random warp names |

**Usage notes:**
- Supports both absolute and relative teleportation
- Can use named warps instead of coordinates
- Relative mask allows mixing absolute and relative axes

---

### PlayerSomnolence

**Package:** `com.hypixel.hytale.builtin.beds.sleep.components`

The `PlayerSomnolence` component tracks a player's sleep state. Used by the bed system to manage sleep progression.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/beds/sleep/components/PlayerSomnolence.java`

```java
public class PlayerSomnolence implements Component<EntityStore> {
   public static PlayerSomnolence AWAKE = new PlayerSomnolence(PlayerSleep.FullyAwake.INSTANCE);
   private PlayerSleep state = PlayerSleep.FullyAwake.INSTANCE;

   public static ComponentType<EntityStore, PlayerSomnolence> getComponentType() {
      return BedsPlugin.getInstance().getPlayerSomnolenceComponentType();
   }

   public PlayerSleep getSleepState();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `state` | PlayerSleep | Current sleep state (awake, falling asleep, sleeping, waking) |

**Usage notes:**
- State machine for sleep progression
- Shared AWAKE instance for default state
- Works with SleepTracker for network synchronization

---

### SleepTracker

**Package:** `com.hypixel.hytale.builtin.beds.sleep.components`

The `SleepTracker` component handles sleep state network synchronization. Prevents duplicate packet sends.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/beds/sleep/components/SleepTracker.java`

```java
public class SleepTracker implements Component<EntityStore> {
   private UpdateSleepState lastSentPacket = new UpdateSleepState(false, false, null, null);

   public static ComponentType<EntityStore, SleepTracker> getComponentType() {
      return BedsPlugin.getInstance().getSleepTrackerComponentType();
   }

   public UpdateSleepState generatePacketToSend(UpdateSleepState state);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `lastSentPacket` | UpdateSleepState | Cache of last sent state for delta detection |

**Usage notes:**
- Optimizes network traffic by only sending changed states
- Works with PlayerSomnolence for sleep logic
- Returns null if state unchanged

---

### VoidEvent

**Package:** `com.hypixel.hytale.builtin.portals.components.voidevent`

The `VoidEvent` component manages void portal invasion events. Tracks spawner positions and current invasion stage.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/portals/components/voidevent/VoidEvent.java`

```java
public class VoidEvent implements Component<EntityStore> {
   public static final double MIN_BLOCKS_BETWEEN_SPAWNERS = 62.0;
   private SpatialHashGrid<Ref<EntityStore>> voidSpawners = new SpatialHashGrid<>(62.0);
   private VoidEventStage activeStage;

   public static ComponentType<EntityStore, VoidEvent> getComponentType() {
      return PortalsPlugin.getInstance().getVoidEventComponentType();
   }

   public VoidEventConfig getConfig(World world);
   public SpatialHashGrid<Ref<EntityStore>> getVoidSpawners();
   public VoidEventStage getActiveStage();
   public void setActiveStage(VoidEventStage activeStage);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `voidSpawners` | SpatialHashGrid | Spatial index of spawner positions |
| `activeStage` | VoidEventStage | Current invasion stage (null = inactive) |

**Usage notes:**
- Minimum 62 blocks between spawners
- Stages define escalating invasion difficulty
- Configuration loaded from world's gameplay config

---

### VoidSpawner

**Package:** `com.hypixel.hytale.builtin.portals.components.voidevent`

The `VoidSpawner` component marks an entity as a void portal spawner. Tracks associated spawn beacon UUIDs.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/portals/components/voidevent/VoidSpawner.java`

```java
public class VoidSpawner implements Component<EntityStore> {
   private List<UUID> spawnBeaconUuids = new ObjectArrayList<>();

   public static ComponentType<EntityStore, VoidSpawner> getComponentType() {
      return PortalsPlugin.getInstance().getVoidPortalComponentType();
   }

   public List<UUID> getSpawnBeaconUuids();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `spawnBeaconUuids` | `List<UUID>` | UUIDs of associated spawn beacons |

**Usage notes:**
- Part of the void invasion system
- Spawn beacons determine what enemies spawn
- Works with VoidEvent for invasion management

---

### PlayerMemories

**Package:** `com.hypixel.hytale.builtin.adventure.memories.component`

The `PlayerMemories` component stores adventure memories collected by players. Memories are used for progression and unlocking content.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/memories/component/PlayerMemories.java`

```java
public class PlayerMemories implements Component<EntityStore> {
   public static final BuilderCodec<PlayerMemories> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("Capacity", Codec.INTEGER), ...)
      .append(new KeyedCodec<>("Memories", new ArrayCodec<>(Memory.CODEC, Memory[]::new)), ...)
      .build();

   private final Set<Memory> memories = new LinkedHashSet<>();
   private int memoriesCapacity;

   public static ComponentType<EntityStore, PlayerMemories> getComponentType() {
      return MemoriesPlugin.get().getPlayerMemoriesComponentType();
   }

   public boolean recordMemory(Memory memory);
   public boolean hasMemories();
   public boolean takeMemories(Set<Memory> outMemories);
   public Set<Memory> getRecordedMemories();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `memories` | `Set<Memory>` | Collected memories |
| `memoriesCapacity` | int | Maximum number of memories |

**How to use:**

```java
PlayerMemories memories = store.getComponent(playerRef, PlayerMemories.getComponentType());
if (memories.recordMemory(newMemory)) {
    // Memory recorded successfully
}

// Transfer memories to another container
Set<Memory> collected = new HashSet<>();
memories.takeMemories(collected);  // Removes from component
```

**Usage notes:**
- Capacity limits how many memories can be held
- Recording fails if at capacity
- `takeMemories` removes memories while returning them
- Persisted with player data

---

### ParkourCheckpoint

**Package:** `com.hypixel.hytale.builtin.parkour`

The `ParkourCheckpoint` component tracks a player's progress through a parkour course by storing the current checkpoint index.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/parkour/ParkourCheckpoint.java`

```java
public class ParkourCheckpoint implements Component<EntityStore> {
   public static final BuilderCodec<ParkourCheckpoint> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("CheckpointIndex", Codec.INTEGER), ...)
      .build();

   protected int index;

   public static ComponentType<EntityStore, ParkourCheckpoint> getComponentType() {
      return ParkourPlugin.get().getParkourCheckpointComponentType();
   }

   public int getIndex();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `index` | int | Current checkpoint index (0-based) |

**Usage notes:**
- Attached to players during parkour courses
- Index increments as checkpoints are reached
- Used for respawn point determination
- Persisted for course resumption

---

### CraftingManager

**Package:** `com.hypixel.hytale.builtin.crafting.component`

The `CraftingManager` component manages crafting operations for players. Handles queued crafting jobs, bench tier upgrades, and material consumption.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/crafting/component/CraftingManager.java`

```java
public class CraftingManager implements Component<EntityStore> {
   private final BlockingQueue<CraftingJob> queuedCraftingJobs = new LinkedBlockingQueue<>();
   private BenchUpgradingJob upgradingJob;
   private int x, y, z;
   private BlockType blockType;

   public static ComponentType<EntityStore, CraftingManager> getComponentType() {
      return CraftingPlugin.get().getCraftingManagerComponentType();
   }

   public void setBench(int x, int y, int z, BlockType blockType);
   public boolean clearBench(Ref<EntityStore> ref, Store<EntityStore> store);
   public boolean craftItem(Ref<EntityStore> ref, ComponentAccessor<EntityStore> store,
       CraftingRecipe recipe, int quantity, ItemContainer itemContainer);
   public boolean queueCraft(...);
   public void tick(Ref<EntityStore> ref, ComponentAccessor<EntityStore> store, float dt);
   public boolean cancelAllCrafting(Ref<EntityStore> ref, ComponentAccessor<EntityStore> store);
   public boolean startTierUpgrade(Ref<EntityStore> ref, ComponentAccessor<EntityStore> store, BenchWindow window);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `queuedCraftingJobs` | `BlockingQueue<CraftingJob>` | Queue of pending crafts |
| `upgradingJob` | BenchUpgradingJob | Current bench upgrade (null if none) |
| `x, y, z` | int | Current bench block position |
| `blockType` | BlockType | Current bench block type |

**How to use:**

```java
CraftingManager crafting = store.getComponent(playerRef, CraftingManager.getComponentType());

// Set active bench
crafting.setBench(x, y, z, benchBlockType);

// Queue a crafting recipe
crafting.queueCraft(ref, store, window, transactionId, recipe, quantity, inputContainer, InputRemovalType.NORMAL);

// Tick to process queue (called each frame)
crafting.tick(ref, store, deltaTime);

// Clean up when closing bench
crafting.clearBench(ref, store);
```

**Usage notes:**
- Only one bench can be active at a time
- Supports timed crafting with progress tracking
- Bench tier affects crafting speed
- Materials pulled from nearby chests automatically
- Cancellation refunds materials in progress

---

### DisplayNameComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

The `DisplayNameComponent` stores a custom display name for entities. Used for nameplates and UI display.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/DisplayNameComponent.java`

```java
public class DisplayNameComponent implements Component<EntityStore> {
   public static final BuilderCodec<DisplayNameComponent> CODEC = BuilderCodec.builder(...)
      .appendInherited(new KeyedCodec<>("DisplayName", Message.CODEC), ...)
      .build();

   private Message displayName;

   public static ComponentType<EntityStore, DisplayNameComponent> getComponentType() {
      return EntityModule.get().getDisplayNameComponentType();
   }

   public Message getDisplayName();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `displayName` | Message | Localizable display name |

**Usage notes:**
- Supports localized messages with translations
- Separate from entity type name
- Used by Nameplate component for rendering
- Can include formatting and parameters

---

### Repulsion

**Package:** `com.hypixel.hytale.server.core.modules.entity.repulsion`

The `Repulsion` component defines how entities push each other apart. Used for crowd physics and collision avoidance.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/repulsion/Repulsion.java`

```java
public class Repulsion implements Component<EntityStore> {
   public static final BuilderCodec<Repulsion> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("RepulsionConfigIndex", Codec.INTEGER), ...)
      .build();

   private int repulsionConfigIndex;
   private boolean isNetworkOutdated = true;

   public static ComponentType<EntityStore, Repulsion> getComponentType() {
      return EntityModule.get().getRepulsionComponentType();
   }

   public int getRepulsionConfigIndex();
   public void setRepulsionConfigIndex(int repulsionConfigIndex);
   public boolean consumeNetworkOutdated();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `repulsionConfigIndex` | int | Index into RepulsionConfig asset |
| `isNetworkOutdated` | boolean | Dirty flag for network sync |

**Usage notes:**
- RepulsionConfig defines strength and radius
- Works with physics system for soft collisions
- Prevents entity stacking/overlapping
- Network flag optimizes sync frequency

---

### Flock

**Package:** `com.hypixel.hytale.server.flock`

The `Flock` component represents a group of NPCs that coordinate behavior. Tracks group damage data and leadership.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/flock/Flock.java`

```java
public class Flock implements Component<EntityStore> {
   private boolean trace;
   private PersistentFlockData flockData;
   private DamageData nextDamageData = new DamageData();
   private DamageData currentDamageData = new DamageData();
   private FlockRemovedStatus removedStatus = FlockRemovedStatus.NOT_REMOVED;

   public static ComponentType<EntityStore, Flock> getComponentType() {
      return FlockPlugin.get().getFlockComponentType();
   }

   public DamageData getDamageData();
   public DamageData getLeaderDamageData();
   public PersistentFlockData getFlockData();
   public FlockRemovedStatus getRemovedStatus();
   public void onTargetKilled(ComponentAccessor<EntityStore> accessor, Ref<EntityStore> targetRef);
   public void swapDamageDataBuffers();

   public enum FlockRemovedStatus { NOT_REMOVED, DISSOLVED, UNLOADED }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `flockData` | PersistentFlockData | Persistent flock configuration and state |
| `currentDamageData` | DamageData | Damage taken this tick |
| `removedStatus` | FlockRemovedStatus | Dissolution state |
| `trace` | boolean | Debug tracing flag |

**Usage notes:**
- Attached to a flock "leader" entity
- Members reference flock via FlockMembership
- Double-buffered damage data for thread safety
- Supports leader inheritance when leader dies

---

### FlockMembership

**Package:** `com.hypixel.hytale.server.flock`

The `FlockMembership` component links an entity to its flock. Tracks membership type (member, leader, interim leader).

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/flock/FlockMembership.java`

```java
public class FlockMembership implements Component<EntityStore> {
   public static final BuilderCodec<FlockMembership> CODEC = BuilderCodec.builder(...)
      .append(new KeyedCodec<>("FlockId", Codec.UUID_BINARY), ...)
      .append(new KeyedCodec<>("Type", new EnumCodec<>(Type.class, ...)), ...)
      .build();

   private UUID flockId;
   private Type membershipType;
   private Ref<EntityStore> flockRef;

   public static ComponentType<EntityStore, FlockMembership> getComponentType() {
      return FlockPlugin.get().getFlockMembershipComponentType();
   }

   public UUID getFlockId();
   public Type getMembershipType();
   public Ref<EntityStore> getFlockRef();

   public enum Type {
      JOINING(false), MEMBER(false), LEADER(true), INTERIM_LEADER(true);
      public boolean isActingAsLeader();
   }
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `flockId` | UUID | Persistent flock identifier |
| `membershipType` | Type | Role within the flock |
| `flockRef` | `Ref<EntityStore>` | Runtime reference to flock entity |

**Usage notes:**
- `flockRef` is runtime-only, not persisted
- Multiple members can act as leader (interim)
- JOINING state for newly added members
- Persisted via flockId for save/load

---

### TargetMemory

**Package:** `com.hypixel.hytale.builtin.npccombatactionevaluator.memory`

The `TargetMemory` component tracks NPCs' awareness of friendly and hostile entities. Used by AI combat evaluation.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/npccombatactionevaluator/memory/TargetMemory.java`

```java
public class TargetMemory implements Component<EntityStore> {
   private final Int2FloatOpenHashMap knownFriendlies = new Int2FloatOpenHashMap();
   private final List<Ref<EntityStore>> knownFriendliesList = new ObjectArrayList<>();
   private final Int2FloatOpenHashMap knownHostiles = new Int2FloatOpenHashMap();
   private final List<Ref<EntityStore>> knownHostilesList = new ObjectArrayList<>();
   private final float rememberFor;
   private Ref<EntityStore> closestHostile;

   public static ComponentType<EntityStore, TargetMemory> getComponentType() {
      return NPCCombatActionEvaluatorPlugin.get().getTargetMemoryComponentType();
   }

   public Int2FloatOpenHashMap getKnownFriendlies();
   public List<Ref<EntityStore>> getKnownHostilesList();
   public Ref<EntityStore> getClosestHostile();
   public float getRememberFor();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `knownFriendlies` | Int2FloatOpenHashMap | Entity ID to last-seen time mapping |
| `knownHostiles` | Int2FloatOpenHashMap | Entity ID to last-seen time mapping |
| `closestHostile` | `Ref<EntityStore>` | Cached nearest hostile |
| `rememberFor` | float | Memory duration in seconds |

**Usage notes:**
- Hash maps store entity IDs with timestamps
- Lists maintain ordered references for iteration
- Memory decays based on rememberFor duration
- Closest hostile cached for quick AI decisions

---

### DamageMemory

**Package:** `com.hypixel.hytale.builtin.npccombatactionevaluator.memory`

The `DamageMemory` component tracks damage taken by an NPC. Used for AI decision-making like fleeing or becoming aggressive.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/npccombatactionevaluator/memory/DamageMemory.java`

```java
public class DamageMemory implements Component<EntityStore> {
   private float recentDamage;
   private float totalCombatDamage;

   public static ComponentType<EntityStore, DamageMemory> getComponentType() {
      return NPCCombatActionEvaluatorPlugin.get().getDamageMemoryComponentType();
   }

   public float getRecentDamage();
   public float getTotalCombatDamage();
   public void addDamage(float damage);
   public void clearRecentDamage();
   public void clearTotalDamage();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `recentDamage` | float | Damage taken recently (resets periodically) |
| `totalCombatDamage` | float | Total damage since combat started |

**Usage notes:**
- Recent damage used for immediate reactions
- Total damage used for strategic decisions (flee if too damaged)
- Clear methods for combat state transitions
- Works with combat AI evaluators

---

### Timers

**Package:** `com.hypixel.hytale.server.npc.components`

The `Timers` component holds an array of tickable timers for NPC behavior. Used by behavior trees for delayed actions.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/Timers.java`

```java
public class Timers implements Component<EntityStore> {
   private final Tickable[] timers;

   public static ComponentType<EntityStore, Timers> getComponentType() {
      return NPCPlugin.get().getTimersComponentType();
   }

   public Timers(Tickable[] timers);
   public Tickable[] getTimers();
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `timers` | Tickable[] | Array of timer objects |

**Usage notes:**
- Fixed-size array based on NPC definition
- Timers ticked each frame
- Used for cooldowns, delays, periodic actions
- Part of NPC behavior tree system

---

### ChunkSpawnData

**Package:** `com.hypixel.hytale.server.spawning.world.component`

The `ChunkSpawnData` is a chunk component that tracks spawning state per chunk. Manages spawn cooldowns and environment-specific spawn data.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/spawning/world/component/ChunkSpawnData.java`

```java
public class ChunkSpawnData implements Component<ChunkStore> {
   private final Int2ObjectMap<ChunkEnvironmentSpawnData> chunkEnvironmentSpawnDataMap = new Int2ObjectOpenHashMap<>();
   private boolean started;
   private long lastSpawn;

   public static ComponentType<ChunkStore, ChunkSpawnData> getComponentType() {
      return SpawningPlugin.get().getChunkSpawnDataComponentType();
   }

   public Int2ObjectMap<ChunkEnvironmentSpawnData> getChunkEnvironmentSpawnDataMap();
   public boolean isStarted();
   public long getLastSpawn();
   public boolean isOnSpawnCooldown();
   public ChunkEnvironmentSpawnData getEnvironmentSpawnData(int environment);
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `chunkEnvironmentSpawnDataMap` | Int2ObjectMap | Environment ID to spawn data |
| `started` | boolean | Whether spawning has been initialized |
| `lastSpawn` | long | Timestamp of last spawn |

**Usage notes:**
- Stored in `ChunkStore` (chunk-level data)
- Different environments have separate spawn tracking
- Cooldown prevents spawn spam
- Initialized lazily when chunk first activates
