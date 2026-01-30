---
id: ecs
title: ECS (Entity Component System)
sidebar_label: ECS
sidebar_position: 6
description: Documentación completa del sistema ECS del servidor de Hytale
---

# Entity Component System (ECS)

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada contra el código fuente descompilado del servidor utilizando análisis multi-agente. Toda la información incluye referencias a archivos fuente.
:::

## ¿Qué es un ECS?

Un **Sistema de Componentes de Entidad** (ECS) es un patrón de arquitectura de software comúnmente utilizado en el desarrollo de videojuegos. Es fundamentalmente diferente de la programación orientada a objetos tradicional y ofrece beneficios significativos de rendimiento y flexibilidad.

### El Problema con la POO Tradicional

En la programación orientada a objetos (POO) tradicional, podrías crear una jerarquía de clases como esta:

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

Esto parece lógico, pero los problemas surgen rápidamente:

- ¿Qué pasa si un Jugador puede convertirse en un Vehículo (como una montura)?
- ¿Qué pasa si un Ítem necesita salud y puede ser atacado?
- Agregar nuevos comportamientos requiere modificar la jerarquía de clases

### La Solución ECS

ECS divide todo en tres conceptos simples:

| Concepto       | Qué es                                                   | Ejemplo                                                               |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| **Entidad**    | Solo un número de ID                                     | Entidad #42                                                           |
| **Componente** | Datos puros adjuntos a entidades                         | `Position(x: 10, y: 5, z: 20)`, `Health(current: 80, max: 100)`       |
| **Sistema**    | Lógica que procesa entidades con componentes específicos | "Cada tick, reduce el hambre para entidades con el componente Hunger" |

**Piénsalo como una hoja de cálculo:**

| Entity ID | Position     | Health  | Inventory | AI      | Player |
| --------- | ------------ | ------- | --------- | ------- | ------ |
| 1         | (10, 5, 20)  | 100/100 | 64 items  | -       | Yes    |
| 2         | (50, 10, 30) | 50/80   | -         | Hostile | -      |
| 3         | (0, 0, 0)    | -       | 10 items  | -       | -      |

- La Entidad 1 es un Jugador con posición, salud e inventario
- La Entidad 2 es un Enemigo con posición, salud e IA
- La Entidad 3 es un Cofre con solo posición e inventario

### Por Qué Hytale Usa ECS

1. **Rendimiento**: Las entidades con los mismos componentes se almacenan juntas en la memoria (amigable con la caché)
2. **Flexibilidad**: Agregar/quitar comportamientos en tiempo de ejecución agregando/quitando componentes
3. **Paralelización**: Los sistemas pueden ejecutarse en diferentes núcleos de CPU simultáneamente
4. **Modularidad**: Los sistemas son independientes y pueden agregarse/quitarse fácilmente

### Analogía del Mundo Real

Imagina que estás organizando una fiesta y rastreando a los invitados:

- **Enfoque POO**: Crear diferentes clases para "Invitado VIP", "Invitado Regular", "Personal", etc. ¿Qué pasa con un VIP que también es Personal?
- **Enfoque ECS**: Cada persona (entidad) tiene etiquetas/componentes: "TieneInsigniaVIP", "EsPersonal", "NecesitaEstacionamiento", etc. Puedes mezclarlos y combinarlos libremente.

---

## Implementación del ECS de Hytale

Esta documentación describe el Sistema de Componentes de Entidad (ECS) utilizado por el servidor de Hytale. Este sistema es responsable de gestionar entidades, sus componentes y los sistemas que los procesan.

## Arquitectura General

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

## Conceptos Principales

### 1. Componente

Un `Component` es una unidad de datos adjunta a una entidad. No contiene lógica, solo datos.

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

**Ejemplo de un componente simple:**

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

### 2. ComponentType (Tipo de Componente)

Un `ComponentType` es un identificador único para un tipo de componente dentro del registro.

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

### 3. Archetype (Arquetipo)

Un `Archetype` representa un conjunto único de tipos de componentes. Todas las entidades que comparten el mismo arquetipo se almacenan juntas para optimizar el rendimiento.

```java
public class Archetype<ECS_TYPE> implements Query<ECS_TYPE> {
    private final int minIndex;
    private final int count;
    private final ComponentType<ECS_TYPE, ?>[] componentTypes;

    // Crear un arquetipo
    public static <ECS_TYPE> Archetype<ECS_TYPE> of(ComponentType<ECS_TYPE, ?>... componentTypes);

    // Agregar un componente al arquetipo
    public static <ECS_TYPE, T extends Component<ECS_TYPE>> Archetype<ECS_TYPE> add(
        Archetype<ECS_TYPE> archetype, ComponentType<ECS_TYPE, T> componentType);

    // Eliminar un componente del arquetipo
    public static <ECS_TYPE, T extends Component<ECS_TYPE>> Archetype<ECS_TYPE> remove(
        Archetype<ECS_TYPE> archetype, ComponentType<ECS_TYPE, T> componentType);

    // Comprobar si el arquetipo contiene un tipo de componente
    public boolean contains(ComponentType<ECS_TYPE, ?> componentType);
}
```

### 4. ArchetypeChunk

Un `ArchetypeChunk` almacena todas las entidades que comparten el mismo arquetipo. Es una estructura de datos optimizada para el acceso a la caché.

```java
public class ArchetypeChunk<ECS_TYPE> {
    protected final Store<ECS_TYPE> store;
    protected final Archetype<ECS_TYPE> archetype;
    protected int entitiesSize;
    protected Ref<ECS_TYPE>[] refs;           // Entity references
    protected Component<ECS_TYPE>[][] components;  // Component data

    // Obtener un componente para una entidad en un índice dado
    public <T extends Component<ECS_TYPE>> T getComponent(
        int index, ComponentType<ECS_TYPE, T> componentType);

    // Establecer un componente
    public <T extends Component<ECS_TYPE>> void setComponent(
        int index, ComponentType<ECS_TYPE, T> componentType, T component);

    // Agregar una entidad
    public int addEntity(Ref<ECS_TYPE> ref, Holder<ECS_TYPE> holder);

    // Eliminar una entidad
    public Holder<ECS_TYPE> removeEntity(int entityIndex, Holder<ECS_TYPE> target);
}
```

### 5. Holder (Contenedor de Entidad)

Un `Holder` es un contenedor temporal para los componentes de una entidad antes de que se agregue al Almacén (Store).

```java
public class Holder<ECS_TYPE> {
    private Archetype<ECS_TYPE> archetype;
    private Component<ECS_TYPE>[] components;

    // Agregar un componente
    public <T extends Component<ECS_TYPE>> void addComponent(
        ComponentType<ECS_TYPE, T> componentType, T component);

    // Obtener un componente
    public <T extends Component<ECS_TYPE>> T getComponent(
        ComponentType<ECS_TYPE, T> componentType);

    // Eliminar un componente
    public <T extends Component<ECS_TYPE>> void removeComponent(
        ComponentType<ECS_TYPE, T> componentType);

    // Asegurar que existe un componente (crearlo si está ausente)
    public <T extends Component<ECS_TYPE>> void ensureComponent(
        ComponentType<ECS_TYPE, T> componentType);
}
```

### 6. Ref (Referencia de Entidad)

Una `Ref` es una referencia a una entidad en el Almacén. Contiene el índice de la entidad y puede ser invalidada.

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

### 7. Store (Almacén)

El `Store` es el contenedor principal que gestiona todas las entidades y sus componentes.

```java
public class Store<ECS_TYPE> implements ComponentAccessor<ECS_TYPE> {
    private final ComponentRegistry<ECS_TYPE> registry;
    private final ECS_TYPE externalData;
    private Ref<ECS_TYPE>[] refs;
    private ArchetypeChunk<ECS_TYPE>[] archetypeChunks;
    private Resource<ECS_TYPE>[] resources;

    // Agregar una entidad
    public Ref<ECS_TYPE> addEntity(Holder<ECS_TYPE> holder, AddReason reason);

    // Eliminar una entidad (devuelve los componentes de la entidad en el holder)
    public Holder<ECS_TYPE> removeEntity(Ref<ECS_TYPE> ref, RemoveReason reason);

    // Eliminar una entidad con un holder objetivo
    public Holder<ECS_TYPE> removeEntity(Ref<ECS_TYPE> ref, Holder<ECS_TYPE> holder, RemoveReason reason);

    // Obtener un componente
    public <T extends Component<ECS_TYPE>> T getComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Obtener el arquetipo de una entidad
    public Archetype<ECS_TYPE> getArchetype(Ref<ECS_TYPE> ref);

    // Obtener un recurso global
    public <T extends Resource<ECS_TYPE>> T getResource(ResourceType<ECS_TYPE, T> resourceType);
}
```

### 8. Resource (Recurso)

Un `Resource` son datos globales compartidos a través de todo el Almacén (a diferencia de los Componentes, que son por entidad).

```java
public interface Resource<ECS_TYPE> extends Cloneable {
    Resource<ECS_TYPE> clone();
}
```

---

## ComponentRegistry

El `ComponentRegistry` es el registro central que gestiona todos los tipos de componentes, sistemas y recursos.

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

### Registrando Componentes

```java
// Componente sin serialización
ComponentType<EntityStore, MyComponent> MY_COMPONENT =
    registry.registerComponent(MyComponent.class, MyComponent::new);

// Componente con serialización (Codec)
ComponentType<EntityStore, TransformComponent> TRANSFORM =
    registry.registerComponent(TransformComponent.class, "Transform", TransformComponent.CODEC);
```

### Registrando Recursos

```java
// Recurso sin serialización
ResourceType<EntityStore, MyResource> MY_RESOURCE =
    registry.registerResource(MyResource.class, MyResource::new);

// Recurso con serialización
ResourceType<EntityStore, MyResource> MY_RESOURCE =
    registry.registerResource(MyResource.class, "MyResource", MyResource.CODEC);
```

### Componentes Integrados Especiales

```java
// Marca una entidad para no ser actualizada (ticked)
ComponentType<ECS_TYPE, NonTicking<ECS_TYPE>> nonTickingComponentType;

// Marca una entidad para no ser serializada
ComponentType<ECS_TYPE, NonSerialized<ECS_TYPE>> nonSerializedComponentType;

// Almacena componentes desconocidos durante la deserialización
ComponentType<ECS_TYPE, UnknownComponents<ECS_TYPE>> unknownComponentType;
```

---

## Creando un Componente Personalizado

### Paso 1: Definir la Clase del Componente

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

    // REQUERIDO: Implementación de clone()
    @Override
    public Component<EntityStore> clone() {
        return new HealthComponent(this.maxHealth, this.currentHealth);
    }
}
```

### Paso 2: Registrar el Componente

```java
// En tu módulo o sistema de inicialización
public class MyModule {
    private static ComponentType<EntityStore, HealthComponent> HEALTH_COMPONENT_TYPE;

    public static void init(ComponentRegistry<EntityStore> registry) {
        // Registro con serialización
        HEALTH_COMPONENT_TYPE = registry.registerComponent(
            HealthComponent.class,
            "Health",           // ID Único para serialización
            HealthComponent.CODEC
        );
    }

    public static ComponentType<EntityStore, HealthComponent> getHealthComponentType() {
        return HEALTH_COMPONENT_TYPE;
    }
}
```

### Paso 3: Usar el Componente

```java
// Crear una entidad con el componente
Holder<EntityStore> holder = registry.newHolder();
holder.addComponent(MyModule.getHealthComponentType(), new HealthComponent(100, 100));
Ref<EntityStore> entityRef = store.addEntity(holder, AddReason.SPAWN);

// Acceder al componente
HealthComponent health = store.getComponent(entityRef, MyModule.getHealthComponentType());
health.damage(25);

// Comprobar si la entidad tiene el componente
Archetype<EntityStore> archetype = store.getArchetype(entityRef);
if (archetype.contains(MyModule.getHealthComponentType())) {
    // La entidad tiene un componente Health
}
```

---

## Sistema de Consultas (Query System)

Las consultas permiten filtrar entidades basándose en sus componentes.

### Interfaz de Consulta

```java
public interface Query<ECS_TYPE> {
    // Comprueba si un arquetipo coincide con la consulta
    boolean test(Archetype<ECS_TYPE> archetype);

    // Comprueba si la consulta depende de un tipo de componente específico
    boolean requiresComponentType(ComponentType<ECS_TYPE, ?> componentType);

    // Métodos de fábrica
    static <ECS_TYPE> AnyQuery<ECS_TYPE> any();           // Coincide con todo
    static <ECS_TYPE> NotQuery<ECS_TYPE> not(Query<ECS_TYPE> query);  // Negación
    static <ECS_TYPE> AndQuery<ECS_TYPE> and(Query<ECS_TYPE>... queries);  // AND Lógico
    static <ECS_TYPE> OrQuery<ECS_TYPE> or(Query<ECS_TYPE>... queries);   // OR Lógico
}
```

### Tipos de Consulta

```
Query (interfaz)
  |
  +-- Archetype (un arquetipo es también una consulta)
  |
  +-- ComponentType (un ComponentType es también una consulta)
  |
  +-- AnyQuery (coincide con todo)
  |
  +-- NotQuery (negación)
  |
  +-- AndQuery (AND lógico)
  |
  +-- OrQuery (OR lógico)
  |
  +-- ExactArchetypeQuery (coincidencia exacta de arquetipo)
  |
  +-- ReadWriteArchetypeQuery (interfaz)
       |
       +-- ReadWriteQuery (implementación)
```

### ReadWriteQuery

El `ReadWriteQuery` distingue entre componentes de solo lectura y componentes modificados.

```java
public class ReadWriteQuery<ECS_TYPE> implements ReadWriteArchetypeQuery<ECS_TYPE> {
    private final Archetype<ECS_TYPE> read;   // Componentes siendo leídos
    private final Archetype<ECS_TYPE> write;  // Componentes siendo modificados

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

### Ejemplos de Uso

```java
// Consulta simple: todas las entidades con TransformComponent
Query<EntityStore> hasTransform = TransformComponent.getComponentType();

// Consulta combinada: entidades con Transform Y Health
Query<EntityStore> query = Query.and(
    TransformComponent.getComponentType(),
    MyModule.getHealthComponentType()
);

// Consulta con negación: entidades con Transform pero SIN Health
Query<EntityStore> query = Query.and(
    TransformComponent.getComponentType(),
    Query.not(MyModule.getHealthComponentType())
);

// Arquetipo como consulta
Archetype<EntityStore> archetype = Archetype.of(
    TransformComponent.getComponentType(),
    BoundingBox.getComponentType()
);
// Comprueba si una entidad tiene AL MENOS estos componentes

// ReadWriteQuery para un sistema que lee Transform y modifica Health
ReadWriteQuery<EntityStore> query = new ReadWriteQuery<>(
    Archetype.of(TransformComponent.getComponentType()),  // Lectura
    Archetype.of(MyModule.getHealthComponentType())       // Escritura
);
```

---

## Sistemas y SystemGroups (Grupos de Sistemas)

### Jerarquía de Sistemas

```
ISystem (interfaz)
  |
  +-- System (base abstracta)
       |
       +-- QuerySystem (interfaz) - sistemas que filtran por arquetipo
       |    |
       |    +-- RefSystem - callback en añadir/eliminar entidad
       |    |
       |    +-- HolderSystem - callback en holder antes de agregar
       |    |
       +-- TickingSystem
       |         |
       |         +-- ArchetypeTickingSystem
       |              |
       |              +-- EntityTickingSystem
       |
       +-- EventSystem
            |
            +-- EntityEventSystem - eventos en entidades
            |
            +-- WorldEventSystem - eventos globales
```

### ISystem

Interfaz base para todos los sistemas.

```java
public interface ISystem<ECS_TYPE> {
    // Callbacks de ciclo de vida
    default void onSystemRegistered() {}
    default void onSystemUnregistered() {}

    // Grupo al que pertenece este sistema
    default SystemGroup<ECS_TYPE> getGroup() { return null; }

    // Dependencias para el orden de ejecución
    default Set<Dependency<ECS_TYPE>> getDependencies() {
        return Collections.emptySet();
    }
}
```

### System (Clase Base)

```java
public abstract class System<ECS_TYPE> implements ISystem<ECS_TYPE> {

    // Registrar un componente asociado a este sistema
    protected <T extends Component<ECS_TYPE>> ComponentType<ECS_TYPE, T> registerComponent(
        Class<? super T> tClass, Supplier<T> supplier);

    protected <T extends Component<ECS_TYPE>> ComponentType<ECS_TYPE, T> registerComponent(
        Class<? super T> tClass, String id, BuilderCodec<T> codec);

    // Registrar un recurso asociado a este sistema
    public <T extends Resource<ECS_TYPE>> ResourceType<ECS_TYPE, T> registerResource(
        Class<? super T> tClass, Supplier<T> supplier);
}
```

### TickingSystem

Un sistema que se ejecuta en cada tick.

```java
public abstract class TickingSystem<ECS_TYPE> extends System<ECS_TYPE>
    implements TickableSystem<ECS_TYPE> {

    // dt = delta time, systemIndex = índice del sistema
    public abstract void tick(float dt, int systemIndex, Store<ECS_TYPE> store);
}
```

### ArchetypeTickingSystem

Un sistema de actualización (ticking) que filtra por arquetipo.

```java
public abstract class ArchetypeTickingSystem<ECS_TYPE> extends TickingSystem<ECS_TYPE>
    implements QuerySystem<ECS_TYPE> {

    // Consulta para filtrar entidades
    public abstract Query<ECS_TYPE> getQuery();

    // Tick en cada ArchetypeChunk coincidente
    public abstract void tick(
        float dt,
        ArchetypeChunk<ECS_TYPE> archetypeChunk,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );
}
```

### EntityTickingSystem

Un sistema de actualización que itera sobre cada entidad.

```java
public abstract class EntityTickingSystem<ECS_TYPE> extends ArchetypeTickingSystem<ECS_TYPE> {

    // Tick en una entidad específica
    public abstract void tick(
        float dt,
        int index,                         // Índice en el ArchetypeChunk
        ArchetypeChunk<ECS_TYPE> archetypeChunk,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );

    // Soporte para paralelismo
    public boolean isParallel(int archetypeChunkSize, int taskCount) {
        return false;
    }
}
```

### RefSystem

Un sistema que reacciona a la adición y eliminación de entidades.

```java
public abstract class RefSystem<ECS_TYPE> extends System<ECS_TYPE>
    implements QuerySystem<ECS_TYPE> {

    // Consulta para filtrar entidades relevantes
    public abstract Query<ECS_TYPE> getQuery();

    // Llamado cuando se añade una entidad que coincide con la consulta
    public abstract void onEntityAdded(
        Ref<ECS_TYPE> ref,
        AddReason reason,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );

    // Llamado cuando se elimina una entidad que coincide con la consulta
    public abstract void onEntityRemove(
        Ref<ECS_TYPE> ref,
        RemoveReason reason,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );
}
```

### SystemGroup

Un grupo de sistemas para organizar el orden de ejecución.

```java
public class SystemGroup<ECS_TYPE> {
    private final ComponentRegistry<ECS_TYPE> registry;
    private final int index;
    private final Set<Dependency<ECS_TYPE>> dependencies;
}
```

### Dependencias (Orden de Ejecución)

```java
public enum Order {
    BEFORE,  // Ejecutar antes de la dependencia
    AFTER    // Ejecutar después de la dependencia
}

public abstract class Dependency<ECS_TYPE> {
    protected final Order order;
    protected final int priority;

    public Dependency(Order order, int priority);
    public Dependency(Order order, OrderPriority priority);
}

// Tipos de dependencia
// - SystemDependency: dependencia de un sistema específico
// - SystemTypeDependency: dependencia de un tipo de sistema
// - SystemGroupDependency: dependencia de un grupo de sistemas
// - RootDependency: dependencia raíz
```

---

## Ejemplo Completo: Creando un Sistema

```java
public class HealthRegenSystem extends EntityTickingSystem<EntityStore> {

    private static ComponentType<EntityStore, HealthComponent> HEALTH;

    // Consulta: entidades con Health
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

## Entidades: Entity, LivingEntity, Player

### Jerarquía de Entidades

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

La clase base para todas las entidades del juego.

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

    // Eliminar la entidad del mundo
    public boolean remove();

    // Cargar la entidad en un mundo
    public void loadIntoWorld(World world);

    // Referencia a la entidad en el ECS
    public Ref<EntityStore> getReference();

    // Convertir a Holder para serialización/copia
    public Holder<EntityStore> toHolder();
}
```

### LivingEntity

Una entidad con un inventario y estadísticas.

```java
public abstract class LivingEntity extends Entity {
    private final StatModifiersManager statModifiersManager = new StatModifiersManager();
    private Inventory inventory;
    protected double currentFallDistance;

    public static final BuilderCodec<LivingEntity> CODEC =
        BuilderCodec.abstractBuilder(LivingEntity.class, Entity.CODEC)
            .append(new KeyedCodec<>("Inventory", Inventory.CODEC), ...)
            .build();

    // Crear el inventario por defecto
    protected abstract Inventory createDefaultInventory();

    // Gestión de inventario
    public Inventory getInventory();
    public Inventory setInventory(Inventory inventory);

    // Gestión de daño por caída
    public double getCurrentFallDistance();

    // Modificadores de estadísticas
    public StatModifiersManager getStatModifiersManager();
}
```

### Player

El jugador conectado.

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

    // ComponentType para identificar jugadores
    public static ComponentType<EntityStore, Player> getComponentType() {
        return EntityModule.get().getPlayerComponentType();
    }

    // Inicialización del jugador
    public void init(UUID uuid, PlayerRef playerRef);

    // Gestión de Modo de Juego
    public GameMode getGameMode();
    public static void setGameMode(@Nonnull Ref<EntityStore> playerRef, @Nonnull GameMode gameMode, @Nonnull ComponentAccessor<EntityStore> componentAccessor);

    // Gestores de UI
    public WindowManager getWindowManager();
    public PageManager getPageManager();
    public HudManager getHudManager();
}
```

---

## Componentes Integrados Importantes

### TransformComponent

La posición y rotación de una entidad.

```java
public class TransformComponent implements Component<EntityStore> {
    private final Vector3d position = new Vector3d();
    private final Vector3f rotation = new Vector3f();

    public static ComponentType<EntityStore, TransformComponent> getComponentType();

    public Vector3d getPosition();
    public Vector3f getRotation();
    public Transform getTransform();

    // Métodos setter
    public void setPosition(@Nonnull Vector3d position);
    public void setRotation(@Nonnull Vector3f rotation);

    // Métodos de teletransporte - maneja valores NaN
    public void teleportPosition(@Nonnull Vector3d position);
    public void teleportRotation(@Nonnull Vector3f rotation);
}
```

### BoundingBox

La caja de colisión de una entidad.

```java
public class BoundingBox implements Component<EntityStore> {
    private final Box boundingBox = new Box();

    public static ComponentType<EntityStore, BoundingBox> getComponentType();

    public Box getBoundingBox();
    public void setBoundingBox(Box boundingBox);
}
```

### UUIDComponent

El identificador único persistente de una entidad.

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

Marca una entidad para que no sea procesada por TickingSystems.

```java
public class NonTicking<ECS_TYPE> implements Component<ECS_TYPE> {
    private static final NonTicking<?> INSTANCE = new NonTicking();

    public static <ECS_TYPE> NonTicking<ECS_TYPE> get();
}

// Uso: añade este componente para deshabilitar el ticking
holder.addComponent(registry.getNonTickingComponentType(), NonTicking.get());
```

### NonSerialized

Marca una entidad para que no sea guardada.

```java
public class NonSerialized<ECS_TYPE> implements Component<ECS_TYPE> {
    private static final NonSerialized<?> INSTANCE = new NonSerialized();

    public static <ECS_TYPE> NonSerialized<ECS_TYPE> get();
}

// Uso: añade este componente para prevenir el guardado
holder.addComponent(registry.getNonSerializedComponentType(), NonSerialized.get());
```

### Otros Componentes Importantes

| Componente                  | Descripción                                     |
| --------------------------- | ----------------------------------------------- |
| `Velocity`                  | Velocidad de la entidad                         |
| `CollisionResultComponent`  | Resultados de colisión                          |
| `ModelComponent`            | Modelo 3D de la entidad                         |
| `DisplayNameComponent`      | Nombre para mostrar                             |
| `MovementStatesComponent`   | Estados de movimiento (en suelo, volando, etc.) |
| `KnockbackComponent`        | Empuje después de un golpe                      |
| `DamageDataComponent`       | Datos de daño recibido                          |
| `ProjectileComponent`       | Componente para proyectiles                     |
| `EffectControllerComponent` | Efectos activos en la entidad                   |

---

## CommandBuffer

El `CommandBuffer` permite modificaciones diferidas (seguras para hilos) al Almacén (Store).

### Cómo Obtener un CommandBuffer

**Importante:** No existe un método `store.getCommandBuffer()`. El CommandBuffer se obtiene a través de:

1. **En Sistemas ECS** - pasado como parámetro a los métodos tick:

```java
public void tick(Ref<EntityStore> ref, float dt, CommandBuffer<EntityStore> buffer) {
    // buffer es proporcionado por el sistema
}
```

2. **En InteractionContext** - al manejar interacciones:

```java
public void execute(InteractionContext context) {
    CommandBuffer<EntityStore> buffer = context.getCommandBuffer();
}
```

3. **Vía Store.forEachChunk** - al iterar chunks de arquetipo:

```java
store.forEachChunk(query, (archetypeChunk, buffer) -> {
    // buffer es proporcionado por chunk
    for (int i = 0; i < archetypeChunk.size(); i++) {
        Ref<EntityStore> ref = archetypeChunk.getReferenceTo(i);
        // procesar entidad
    }
});
```

### Class Definition

```java
public class CommandBuffer<ECS_TYPE> implements ComponentAccessor<ECS_TYPE> {
    private final Store<ECS_TYPE> store;
    private final Deque<Consumer<Store<ECS_TYPE>>> queue;

    // Añadir una acción para ejecutar después
    public void run(Consumer<Store<ECS_TYPE>> consumer);

    // Añadir una entidad
    public Ref<ECS_TYPE> addEntity(Holder<ECS_TYPE> holder, AddReason reason);

    // Eliminar una entidad
    public void removeEntity(Ref<ECS_TYPE> ref, RemoveReason reason);

    // Leer un componente (acceso inmediato)
    public <T extends Component<ECS_TYPE>> T getComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Añadir un componente a una entidad
    public <T extends Component<ECS_TYPE>> void addComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType, T component);

    // Eliminar un componente de una entidad
    public <T extends Component<ECS_TYPE>> void removeComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Invocar un evento en una entidad (usa el tipo de evento de la anotación)
    public <Event extends EcsEvent> void invoke(Ref<ECS_TYPE> ref, Event event);

    // Invocar un evento en una entidad con tipo de evento explícito
    public <Event extends EcsEvent> void invoke(
        EntityEventType<ECS_TYPE, Event> eventType, Ref<ECS_TYPE> ref, Event event);

    // Invocar un evento global (usa el tipo de evento de la anotación)
    public <Event extends EcsEvent> void invoke(Event event);

    // Invocar un evento global con tipo de evento explícito
    public <Event extends EcsEvent> void invoke(
        WorldEventType<ECS_TYPE, Event> eventType, Event event);
}
```

---

## AddReason y RemoveReason

Enumeraciones que indican por qué una entidad es añadida o eliminada.

```java
public enum AddReason {
    SPAWN,  // Nueva entidad creada
    LOAD    // Entidad cargada desde guardado
}

public enum RemoveReason {
    REMOVE,  // Entidad eliminada permanentemente
    UNLOAD   // Entidad descargada (guardada)
}
```

---

## Flujo de Datos

```
1. CREACIÓN DE ENTIDAD
   +---------------+     +---------+     +--------+     +--------------+
   | Crear Holder  | --> | Añadir a| --> | Store  | --> | RefSystems   |
   | con Components|     | Store   |     | asigna |     | onEntityAdded|
   +---------------+     +---------+     | Ref    |     +--------------+
                                          +--------+

2. TICK
   +--------+     +-----------------+     +------------------+
   | Store  | --> | Por cada Sistema| --> | Por cada Archetype|
   | .tick()|     | (ordenado)      |     | Chunk coincid..  |
   +--------+     +-----------------+     +------------------+
                                                   |
                                                   v
                                          +------------------+
                                          | System.tick()    |
                                          | (con buffer)     |
                                          +------------------+

3. MODIFICACIÓN DE ARQUETIPO (añadir/eliminar componente)
   +-------------+     +------------------+     +------------------+
   | CommandBuffer| --> | Eliminar de viejo| --> | Añadir a nuevo   |
   | .addComponent|     | ArchetypeChunk   |     | ArchetypeChunk   |
   +-------------+     +------------------+     +------------------+

4. ELIMINACIÓN DE ENTIDAD
   +-------------+     +--------------+     +------------------+
   | CommandBuffer| --> | RefSystems   | --> | Eliminar de      |
   | .removeEntity|     | onEntityRemove|     | ArchetypeChunk   |
   +-------------+     +--------------+     +------------------+
```

---

## Mejores Prácticas

1. **Mantén componentes simples**: Los componentes deben ser contenedores de datos simples sin lógica compleja.

2. **Una responsabilidad por sistema**: Cada sistema debe tener una única responsabilidad clara.

3. **Usa el CommandBuffer**: Nunca modifiques el Store directamente durante un tick. Siempre usa el CommandBuffer.

4. **Consultas eficientes**: Usa Arquetipos en lugar de consultas complejas cuando sea posible.

5. **NonTicking para entidades estáticas**: Añade `NonTicking` a entidades que no necesiten ser actualizadas.

6. **NonSerialized para entidades temporales**: Añade `NonSerialized` a entidades que no deban ser guardadas.

7. **Dependencias explícitas**: Siempre declara dependencias entre sistemas para asegurar el orden correcto de ejecución.

8. **clone() obligatorio**: Siempre implementa `clone()` correctamente para componentes que necesiten ser copiados.

---

## Referencia Adicional de Componentes Integrados

Las siguientes secciones documentan componentes ECS adicionales encontrados en el código fuente descompilado del servidor. Estos componentes proporcionan funcionalidad esencial para el comportamiento de entidades, redes y renderizado.

### Invulnerable

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `Invulnerable` es un componente marcador (etiqueta) que hace que una entidad sea inmune al daño. Usa el patrón singleton: solo hay una instancia compartida por todas las entidades invulnerables.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Invulnerable.java`

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

// Hacer una entidad invulnerable
commandBuffer.addComponent(ref, Invulnerable.getComponentType(), Invulnerable.INSTANCE);

// Eliminar invulnerabilidad
commandBuffer.removeComponent(ref, Invulnerable.getComponentType());

// Comprobar si la entidad es invulnerable

---

### Intangible

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `Intangible` es un componente marcador que hace que una entidad no sea colisionable. Otras entidades y proyectiles atravesarán entidades intangibles. Como `Invulnerable`, usa el patrón singleton.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Intangible.java`

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Make an entity intangible (non-collidable)
holder.ensureComponent(Intangible.getComponentType());
// or
commandBuffer.addComponent(ref, Intangible.getComponentType(), Intangible.INSTANCE);

// Remove intangibility
commandBuffer.removeComponent(ref, Intangible.getComponentType());
```

// Hacer una entidad intangible (no colisionable)
holder.ensureComponent(Intangible.getComponentType());
// o
commandBuffer.addComponent(ref, Intangible.getComponentType(), Intangible.INSTANCE);

// Eliminar intangibilidad

---

### Interactable

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `Interactable` marca una entidad como interactuable por jugadores. Esto permite que se procesen eventos de interacción (como acciones de clic derecho) para la entidad.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Interactable.java`

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Make an entity interactable
holder.addComponent(Interactable.getComponentType(), Interactable.INSTANCE);

// Remove interactability
commandBuffer.removeComponent(ref, Interactable.getComponentType());
```

// Hacer una entidad interactuable
holder.addComponent(Interactable.getComponentType(), Interactable.INSTANCE);

// Eliminar interactuabilidad

---

### ItemComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

El `ItemComponent` representa un ítem soltado en el mundo. Contiene los datos del stack de ítems, retrasos de recogida, retrasos de fusión, y proporciona utilidades para crear drops de ítems y manejar recogidas.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/ItemComponent.java`

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

**Propiedades:**

| Propiedad               | Tipo        | Defecto | Descripción                                                 |
| ----------------------- | ----------- | ------- | ----------------------------------------------------------- |
| `itemStack`             | `ItemStack` | null    | El stack de ítems que esta entidad representa               |
| `mergeDelay`            | float       | 1.5     | Retraso antes de que los ítems puedan fusionarse (segundos) |
| `pickupDelay`           | float       | 0.5     | Retraso antes de que el ítem pueda ser recogido (segundos)  |
| `pickupThrottle`        | float       | 0.25    | Enfriamiento entre intentos de recogida                     |
| `removedByPlayerPickup` | boolean     | false   | Si el ítem fue eliminado por recogida de jugador            |
| `pickupRange`           | float       | -1.0    | Rango para recogida (-1 = usar defecto de config)           |

**Cómo crear drops de ítems:**

```java
// Crear un drop de ítem único
Holder<EntityStore> itemHolder = ItemComponent.generateItemDrop(
    accessor,           // ComponentAccessor
    itemStack,          // ItemStack a soltar
    position,           // Vector3d posición
    rotation,           // Vector3f rotación
    velocityX,          // float velocidad horizontal
    velocityY,          // float velocidad vertical (3.25F defecto)
    velocityZ           // float velocidad horizontal
);
store.addEntity(itemHolder, AddReason.SPAWN);

// Crear múltiples drops de ítems desde una lista
Holder<EntityStore>[] items = ItemComponent.generateItemDrops(
    accessor, itemStacks, position, rotation
);

// Añadir ítem a un contenedor (maneja recogida parcial)
ItemStack pickedUp = ItemComponent.addToItemContainer(store, itemRef, itemContainer);
```

**Notas de uso:**

- Asigna automáticamente `Intangible`, `Velocity`, `PhysicsValues`, `UUIDComponent`, y `DespawnComponent`
- La vida del ítem por defecto es 120 segundos (configurable vía `ItemEntityConfig`)
- Puede emitir luz dinámica si el ítem/bloque tiene una propiedad de luz

---

### PlayerInput

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

El componente `PlayerInput` maneja actualizaciones de entrada del jugador incluyendo movimiento, rotación y control de montura. Pone en cola actualizaciones de entrada que son procesadas por sistemas de jugador.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerInput.java`

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

**Propiedades:**

| Propiedad          | Tipo                | Descripción                                      |
| ------------------ | ------------------- | ------------------------------------------------ |
| `inputUpdateQueue` | `List<InputUpdate>` | Cola de actualizaciones de entrada pendientes    |
| `mountId`          | int                 | ID de red de la entidad montura (0 = no montado) |

**Tipos de Actualización de Entrada:**

| Tipo                     | Descripción                                      |
| ------------------------ | ------------------------------------------------ |
| `AbsoluteMovement`       | Teletransporte a posición absoluta (x, y, z)     |
| `RelativeMovement`       | Movimiento relativo a la posición actual         |
| `WishMovement`           | Dirección de movimiento deseada                  |
| `SetBody`                | Establecer rotación de cuerpo (pitch, yaw, roll) |
| `SetHead`                | Establecer rotación de cabeza (pitch, yaw, roll) |
| `SetMovementStates`      | Establecer banderas de estado de movimiento      |
| `SetClientVelocity`      | Establecer velocidad desde el cliente            |
| `SetRiderMovementStates` | Establecer estados de movimiento al montar       |

**Cómo usar:**

```java
// Poner en cola un movimiento absoluto
PlayerInput input = store.getComponent(playerRef, PlayerInput.getComponentType());
input.queue(new PlayerInput.AbsoluteMovement(x, y, z));

// Poner en cola un cambio de rotación de cabeza
input.queue(new PlayerInput.SetHead(new Direction(pitch, yaw, roll)));
```

---

### NetworkId

**Package:** `com.hypixel.hytale.server.core.modules.entity.tracker`

El componente `NetworkId` asigna un identificador de red único a una entidad para la sincronización cliente-servidor. Este ID se usa en paquetes de red para referenciar entidades.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/tracker/NetworkId.java`

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

**Propiedades:**

| Propiedad | Tipo | Descripción                                |
| --------- | ---- | ------------------------------------------ |
| `id`      | int  | Identificador de red único para la entidad |

**Cómo añadir:**

```java
// Obtener siguiente ID de red del mundo y asignar a entidad
int networkId = world.getExternalData().takeNextNetworkId();
holder.addComponent(NetworkId.getComponentType(), new NetworkId(networkId));

// O durante la generación de la entidad
holder.addComponent(NetworkId.getComponentType(),
    new NetworkId(ref.getStore().getExternalData().takeNextNetworkId()));
```

**Notas de uso:**

- Los IDs de red son asignados automáticamente por el sistema de rastreo de entidades para entidades rastreadas
- El componente es inmutable - `clone()` devuelve la misma instancia
- Usado extensivamente en serialización de paquetes para referencias de entidad

---

### Frozen

**Package:** `com.hypixel.hytale.server.core.entity`

El componente `Frozen` es un componente marcador que detiene a una entidad de moverse o ser afectada por físicas. Usa el patrón singleton.

**Archivo fuente:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/Frozen.java`

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Congelar una entidad
commandBuffer.addComponent(ref, Frozen.getComponentType(), Frozen.get());

// Descongelar una entidad
commandBuffer.removeComponent(ref, Frozen.getComponentType());
```

**Notas de uso:**

- Útil para cinemáticas, diálogos o pausar entidades
- No hace a la entidad invulnerable - combina con `Invulnerable` si es necesario

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

    // Modificadores fluidos
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

**Propiedades:**

| Propiedad       | Tipo       | Defecto | Descripción                                   |
| --------------- | ---------- | ------- | --------------------------------------------- |
| `world`         | `World`    | null    | Mundo objetivo (null = mismo mundo)           |
| `position`      | `Vector3d` | -       | Posición objetivo                             |
| `rotation`      | `Vector3f` | -       | Rotación de cuerpo objetivo                   |
| `headRotation`  | `Vector3f` | null    | Rotación de cabeza objetivo (opcional)        |
| `resetVelocity` | boolean    | true    | Si reiniciar la velocidad tras teletransporte |

**Cómo teletransportar una entidad:**

```java
// Teletransportar a posición en el mismo mundo
commandBuffer.addComponent(ref, Teleport.getComponentType(),
    new Teleport(new Vector3d(100, 64, 200), new Vector3f(0, 90, 0)));

// Teletransportar a un mundo diferente
commandBuffer.addComponent(ref, Teleport.getComponentType(),
    new Teleport(targetWorld, position, rotation));

// Teletransportar con rotación de cabeza y sin reiniciar velocidad
Teleport teleport = new Teleport(position, rotation)
    .withHeadRotation(headRotation)
    .withoutVelocityReset();
commandBuffer.addComponent(ref, Teleport.getComponentType(), teleport);
```

**Notas de uso:**

- El componente `Teleport` es procesado por `TeleportSystems.MoveSystem` (para entidades) o `TeleportSystems.PlayerMoveSystem` (para jugadores)
- Para jugadores, el teletransporte envía un paquete `ClientTeleport` y espera reconocimiento
- El componente es eliminado automáticamente después del procesamiento
- El teletransporte entre mundos mueve la entidad entre Almacenes (Stores)

---

### EntityScaleComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `EntityScaleComponent` controla la escala visual de una entidad. Esto afecta el tamaño renderizado del modelo de la entidad en los clientes.

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

**Propiedades:**

| Propiedad           | Tipo    | Defecto | Descripción                                   |
| ------------------- | ------- | ------- | --------------------------------------------- |
| `scale`             | float   | 1.0     | Multiplicador de escala (1.0 = tamaño normal) |
| `isNetworkOutdated` | boolean | true    | Bandera interna para sincronización de red    |

**Cómo usar:**

```java
// Crear entidad con escala personalizada
holder.addComponent(EntityScaleComponent.getComponentType(),
    new EntityScaleComponent(2.0f));  // Doble tamaño

// Modificar escala en tiempo de ejecución
EntityScaleComponent scaleComponent = store.getComponent(ref,
    EntityScaleComponent.getComponentType());
scaleComponent.setScale(0.5f);  // Mitad de tamaño
```

**Notas de uso:**

- Los cambios en la escala se sincronizan automáticamente con los clientes
- Solo afecta el renderizado visual, no a la colisión/hitbox
- Una escala de 0 o valores negativos pueden causar comportamiento indefinido

---

### HitboxCollision

**Package:** `com.hypixel.hytale.server.core.modules.entity.hitboxcollision`

El componente `HitboxCollision` define cómo la hitbox de una entidad interactúa con otras entidades. Referencia un asset `HitboxCollisionConfig` que define el comportamiento de colisión.

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

**Propiedades:**

| Propiedad                    | Tipo    | Defecto | Descripción                                         |
| ---------------------------- | ------- | ------- | --------------------------------------------------- |
| `hitboxCollisionConfigIndex` | int     | -       | Índice en el mapa de assets `HitboxCollisionConfig` |
| `isNetworkOutdated`          | boolean | true    | Bandera interna para sincronización de red          |

**Propiedades de HitboxCollisionConfig:**

| Propiedad                  | Tipo            | Descripción                                             |
| -------------------------- | --------------- | ------------------------------------------------------- |
| `CollisionType`            | `CollisionType` | `Hard` (bloquea movimiento) o `Soft` (ralentiza)        |
| `SoftCollisionOffsetRatio` | float           | Ratio de movimiento al pasar a través de colisión suave |

**Cómo usar:**

```java
// Obtener una config de colisión de hitbox de assets
HitboxCollisionConfig config = HitboxCollisionConfig.getAssetMap().getAsset("mymod:soft_hitbox");

// Añadir colisión de hitbox a una entidad
holder.addComponent(HitboxCollision.getComponentType(), new HitboxCollision(config));

// Modificar colisión de hitbox en tiempo de ejecución
HitboxCollision hitbox = store.getComponent(ref, HitboxCollision.getComponentType());
hitbox.setHitboxCollisionConfigIndex(newConfigIndex);
```

**Notas de uso:**

- Usado para colisión entidad-entidad (no colisión con bloques)
- El tipo de colisión `Hard` bloquea el movimiento completamente
- El tipo de colisión `Soft` permite atravesar con velocidad reducida

---

### Nameplate

**Package:** `com.hypixel.hytale.server.core.entity.nameplate`

El componente `Nameplate` muestra una etiqueta de texto flotante sobre una entidad. Esto se usa comúnmente para nombres de jugadores, nombres de NPCs o etiquetas personalizadas.

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

**Propiedades:**

| Propiedad           | Tipo    | Defecto | Descripción                                |
| ------------------- | ------- | ------- | ------------------------------------------ |
| `text`              | String  | ""      | El texto a mostrar sobre la entidad        |
| `isNetworkOutdated` | boolean | true    | Bandera interna para sincronización de red |

**Cómo usar:**

```java
// Crear entidad con un nameplate
holder.addComponent(Nameplate.getComponentType(), new Nameplate("Shop Keeper"));

// Modificar texto de nameplate en tiempo de ejecución
Nameplate nameplate = store.getComponent(ref, Nameplate.getComponentType());
nameplate.setText("New Name");  // Solo actualiza si el texto cambió

// Eliminar nameplate
commandBuffer.removeComponent(ref, Nameplate.getComponentType());
```

**Notas de uso:**

- Los cambios de texto se sincronizan automáticamente con los clientes cuando se modifican
- El método `setText` solo marca el componente como desactualizado si el texto realmente cambia
- Una cadena vacía no muestra nameplate pero mantiene el componente

---

### DynamicLight

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `DynamicLight` hace que una entidad emita luz. Esto crea una fuente de luz móvil que ilumina el área circundante.

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

**Propiedades de ColorLight:**

| Propiead | Tipo | Rango | Descripción               |
| -------- | ---- | ----- | ------------------------- |
| `radius` | byte | 0-255 | Radio de luz en bloques   |
| `red`    | byte | 0-255 | Componente de color rojo  |
| `green`  | byte | 0-255 | Componente de color verde |
| `blue`   | byte | 0-255 | Componente de color azul  |

**Cómo usar:**

```java
// Crear una luz dinámica roja
ColorLight redLight = new ColorLight((byte)15, (byte)255, (byte)0, (byte)0);
holder.addComponent(DynamicLight.getComponentType(), new DynamicLight(redLight));

// Crear una luz blanca tipo antorcha
ColorLight torchLight = new ColorLight((byte)12, (byte)255, (byte)200, (byte)100);
holder.addComponent(DynamicLight.getComponentType(), new DynamicLight(torchLight));

// Modificar luz en tiempo de ejecución
DynamicLight light = store.getComponent(ref, DynamicLight.getComponentType());
light.setColorLight(new ColorLight((byte)10, (byte)0, (byte)255, (byte)0));  // Luz verde

// Eliminar luz dinámica
commandBuffer.removeComponent(ref, DynamicLight.getComponentType());
```

**Notas de uso:**

- Los cambios de luz se sincronizan automáticamente con los clientes
- Para luces persistentes (guardadas con la entidad), usa `PersistentDynamicLight`
- `DynamicLightSystems.Setup` crea automáticamente `DynamicLight` desde `PersistentDynamicLight` al cargar
- Los ítems soltados emiten luz automáticamente si el ítem/bloque tiene una propiedad de luz (ver `ItemComponent.computeDynamicLight()`)

---

### ItemPhysicsComponent (Obsoleto)

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

El `ItemPhysicsComponent` es un componente obsoleto que se usaba para almacenar cálculos de física para ítems soltados. Contiene velocidad escalada y resultados de colisión. Este componente ha sido reemplazado por sistemas de física más nuevos.

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

**Propiedades:**

| Propiedad         | Tipo              | Descripción                                  |
| ----------------- | ----------------- | -------------------------------------------- |
| `scaledVelocity`  | `Vector3d`        | El vector de velocidad escalada para el ítem |
| `collisionResult` | `CollisionResult` | El resultado de los cálculos de colisión     |

**Notas de uso:**

- Este componente está obsoleto y no debe usarse en código nuevo
- Usa componentes `Velocity` y `PhysicsValues` en su lugar para físicas de ítems

---

### PickupItemComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

El `PickupItemComponent` maneja la animación y el estado cuando un ítem está siendo recogido por una entidad. Gestiona la animación de viaje desde la posición del ítem hasta la entidad objetivo durante una duración configurable.

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

**Propiedades:**

| Propiedad          | Tipo               | Defecto | Descripción                                              |
| ------------------ | ------------------ | ------- | -------------------------------------------------------- |
| `targetRef`        | `Ref<EntityStore>` | null    | Referencia a la entidad recogiendo el ítem               |
| `startPosition`    | `Vector3d`         | null    | Posición inicial para la animación de recogida           |
| `originalLifeTime` | float              | -       | Duración original de la animación de recogida            |
| `lifeTime`         | float              | 0.15    | Tiempo restante para la animación de recogida (segundos) |
| `finished`         | boolean            | false   | Si la animación de recogida ha completado                |

**Cómo usar:**

```java
// Iniciar animación de recogida de ítem
PickupItemComponent pickup = new PickupItemComponent(
    playerRef,                          // Entidad recogiendo el ítem
    itemPosition,                       // Posición inicial
    0.15f                               // Duración de animación en segundos
);
commandBuffer.addComponent(itemRef, PickupItemComponent.getComponentType(), pickup);

// Comprobar si la recogida está completa
PickupItemComponent pickup = store.getComponent(itemRef, PickupItemComponent.getComponentType());
if (pickup.hasFinished()) {
    // Eliminar ítem y añadir al inventario
}
```

**Notas de uso:**

- El componente es procesado por `PickupItemSystem` que interpola la posición del ítem
- El tiempo de viaje por defecto es 0.15 segundos (150ms)
- Una vez finalizado, el sistema maneja la transferencia del ítem al inventario del objetivo

---

### PreventItemMerging

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

El componente `PreventItemMerging` es un componente marcador (etiqueta) que previene que un ítem soltado se fusione con otros ítems idénticos cercanos. Usa el patrón singleton.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Prevenir que un ítem se fusione con otros
holder.addComponent(PreventItemMerging.getComponentType(), PreventItemMerging.INSTANCE);
// o
commandBuffer.addComponent(itemRef, PreventItemMerging.getComponentType(), PreventItemMerging.INSTANCE);

// Permitir fusión de nuevo
commandBuffer.removeComponent(itemRef, PreventItemMerging.getComponentType());
```

**Notas de uso:**

- Útil para ítems de misión, drops únicos, o ítems que deben permanecer separados
- El `ItemMergeSystem` comprueba este componente antes de intentar fusionar ítems

---

### PreventPickup

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

El componente `PreventPickup` es un componente marcador (etiqueta) que previene que un ítem soltado sea recogido por cualquier entidad. Usa el patrón singleton.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Prevenir que un ítem sea recogido
holder.addComponent(PreventPickup.getComponentType(), PreventPickup.INSTANCE);
// o
commandBuffer.addComponent(itemRef, PreventPickup.getComponentType(), PreventPickup.INSTANCE);

// Permitir recogida de nuevo
commandBuffer.removeComponent(itemRef, PreventPickup.getComponentType());
```

**Notas de uso:**

- Útil para ítems decorativos, ítems durante cinemáticas, o ítems restringidos al propietario
- Diferente de `ItemComponent.pickupDelay` que es temporal - esto es permanente hasta que se elimina

---

### PhysicsValues

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

El componente `PhysicsValues` almacena las propiedades físicas de una entidad que afectan cómo responde a la simulación de física. Esto incluye masa, coeficiente de arrastre, y dirección de gravedad.

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

**Propiedades:**

| Propiedad         | Tipo    | Defecto | Descripción                                        |
| ----------------- | ------- | ------- | -------------------------------------------------- |
| `mass`            | double  | 1.0     | Masa de la entidad (debe ser > 0)                  |
| `dragCoefficient` | double  | 0.5     | Coeficiente de resistencia al aire (debe ser >= 0) |
| `invertedGravity` | boolean | false   | Si la gravedad está invertida para esta entidad    |

**Cómo usar:**

```java
// Crear entidad con físicas personalizadas
PhysicsValues physics = new PhysicsValues(2.0, 0.3, false);  // Pesado, bajo arrastre
holder.addComponent(PhysicsValues.getComponentType(), physics);

// Crear una entidad flotante (gravedad invertida)
PhysicsValues floatingPhysics = new PhysicsValues(0.5, 0.8, true);
holder.addComponent(PhysicsValues.getComponentType(), floatingPhysics);

// Modificar físicas en tiempo de ejecución
PhysicsValues physics = store.getComponent(ref, PhysicsValues.getComponentType());
physics.scale(2.0f);  // Doblar masa y arrastre

// Reiniciar a valores por defecto
physics.resetToDefault();
```

**Notas de uso:**

- La masa afecta cómo las fuerzas (incluyendo la gravedad) aceleran la entidad
- Un coeficiente de arrastre más alto significa que la entidad se ralentiza más rápido en el aire
- La gravedad invertida hace que la entidad caiga hacia arriba - útil para efectos especiales
- Usado automáticamente para ítems soltados vía `ItemComponent.generateItemDrop()`

---

### PlayerSettings

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

El componente `PlayerSettings` almacena las preferencias y configuraciones del jugador, incluyendo ubicaciones de recogida de ítems y configuraciones de modo creativo. Está implementado como un registro Java (record) para inmutabilidad.

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

**Propiedades:**

| Propiedad                                   | Tipo                     | Defecto | Descripción                                    |
| ------------------------------------------- | ------------------------ | ------- | ---------------------------------------------- |
| `showEntityMarkers`                         | boolean                  | false   | Si mostrar marcadores de entidad de depuración |
| `armorItemsPreferredPickupLocation`         | `PickupLocation`         | Hotbar  | Dónde van la armadura al recogerse             |
| `weaponAndToolItemsPreferredPickupLocation` | `PickupLocation`         | Hotbar  | Dónde van armas/herramientas al recogerse      |
| `usableItemsItemsPreferredPickupLocation`   | `PickupLocation`         | Hotbar  | Dónde van consumibles al recogerse             |
| `solidBlockItemsPreferredPickupLocation`    | `PickupLocation`         | Hotbar  | Dónde van bloques al recogerse                 |
| `miscItemsPreferredPickupLocation`          | `PickupLocation`         | Hotbar  | Dónde van ítems misceláneos al recogerse       |
| `creativeSettings`                          | `PlayerCreativeSettings` | -       | Configuraciones específicas de modo creativo   |

**PlayerCreativeSettings:**

| Propiedad           | Tipo    | Defecto | Descripción                                    |
| ------------------- | ------- | ------- | ---------------------------------------------- |
| `allowNPCDetection` | boolean | false   | Si los NPCs pueden detectar/apuntar al jugador |
| `respondToHit`      | boolean | false   | Si el jugador responde al ser golpeado         |

**Cómo usar:**

```java
// Obtener configuraciones por defecto
PlayerSettings settings = PlayerSettings.defaults();

// Crear configuraciones personalizadas
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

**Notas de uso:**

- Las configuraciones se envían típicamente desde el cliente y se aplican a la entidad jugador
- PickupLocation determina dónde se colocan los ítems en el inventario del jugador
- Las configuraciones creativas controlan el comportamiento del juego en modo creativo

---

### ChunkTracker

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

El componente `ChunkTracker` gestiona qué chunks están cargados y visibles para un jugador. Maneja la carga/descarga de chunks, radio de visión, y limitación de tasa de transmisión de chunks.

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

   // Métodos clave
   public void tick(@Nonnull Ref<EntityStore> playerRef, float dt, @Nonnull CommandBuffer<EntityStore> commandBuffer);
   public void unloadAll(@Nonnull PlayerRef playerRefComponent);
   public void clear();
   public boolean isLoaded(long indexChunk);
   public boolean shouldBeVisible(long chunkCoordinates);
   public ChunkVisibility getChunkVisibility(long indexChunk);
   public void setReadyForChunks(boolean readyForChunks);
   public boolean isReadyForChunks();

   // Configuración
   public void setMaxChunksPerSecond(int maxChunksPerSecond);
   public void setDefaultMaxChunksPerSecond(@Nonnull PlayerRef playerRef);
   public void setMaxChunksPerTick(int maxChunksPerTick);
   public void setMinLoadedChunksRadius(int minLoadedChunksRadius);
   public void setMaxHotLoadedChunksRadius(int maxHotLoadedChunksRadius);

   // Estadísticas
   public int getLoadedChunksCount();
   public int getLoadingChunksCount();

   public enum ChunkVisibility { NONE, HOT, COLD }
}
```

**Propiedades:**

| Propiedad                  | Tipo    | Defecto     | Descripción                                    |
| -------------------------- | ------- | ----------- | ---------------------------------------------- |
| `chunkViewRadius`          | int     | -           | Distancia de visión del jugador en chunks      |
| `maxChunksPerSecond`       | int     | 36 (remoto) | Máximo de chunks a cargar por segundo          |
| `maxChunksPerTick`         | int     | 4           | Máximo de chunks a cargar por tick             |
| `minLoadedChunksRadius`    | int     | 2           | Radio mínimo de chunks cargados                |
| `maxHotLoadedChunksRadius` | int     | 8           | Radio máximo para chunks "calientes" (ticking) |
| `sentViewRadius`           | int     | 0           | Radio actual de chunks enviados                |
| `hotRadius`                | int     | 0           | Radio actual de chunks calientes               |
| `readyForChunks`           | boolean | false       | Si el jugador está listo para recibir chunks   |

**Enum ChunkVisibility:**

| Valor  | Descripción                                          |
| ------ | ---------------------------------------------------- |
| `NONE` | El chunk no es visible para el jugador               |
| `HOT`  | El chunk es visible y está activamente en tick (hot) |
| `COLD` | El chunk es visible pero no está en tick (cold)      |

**Cómo usar:**

```java
// Obtener chunk tracker para un jugador
ChunkTracker tracker = store.getComponent(playerRef, ChunkTracker.getComponentType());

// Comprobar si un chunk está cargado para este jugador
long chunkIndex = ChunkUtil.indexChunk(chunkX, chunkZ);
if (tracker.isLoaded(chunkIndex)) {
    // El chunk es visible para el jugador
}

// Configurar tasa de carga de chunks
tracker.setMaxChunksPerSecond(64);
tracker.setMaxChunksPerTick(8);

// Obtener visibilidad de chunk
ChunkTracker.ChunkVisibility visibility = tracker.getChunkVisibility(chunkIndex);
if (visibility == ChunkTracker.ChunkVisibility.HOT) {
    // El chunk está activamente en tick
}

// Limpiar todos los chunks cargados (para teletransporte/cambio de mundo)
tracker.clear();
```

**Notas de uso:**

- La carga de chunks está limitada por tasa para prevenir congestión de red
- Las conexiones locales obtienen 256 chunks/segundo, LAN obtiene 128, remotas obtienen 36
- Los chunks "Hot" están activamente en tick; los chunks "cold" son visibles pero estáticos
- El iterador en espiral asegura que los chunks más cercanos al jugador carguen primero

---

### ActiveAnimationComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `ActiveAnimationComponent` rastrea qué animaciones se están reproduciendo actualmente en una entidad a través de diferentes ranuras de animación. Permite la sincronización de red de estados de animación.

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

**Propiedades:**

| Propiedad           | Tipo       | Descripción                                               |
| ------------------- | ---------- | --------------------------------------------------------- |
| `activeAnimations`  | `String[]` | Array de nombres de animación indexados por AnimationSlot |
| `isNetworkOutdated` | boolean    | Bandera para sincronización de red                        |

**Cómo usar:**

```java
// Crear entidad con componente de animación
holder.addComponent(ActiveAnimationComponent.getComponentType(), new ActiveAnimationComponent());

// Establecer una animación en una ranura específica
ActiveAnimationComponent anim = store.getComponent(ref, ActiveAnimationComponent.getComponentType());
anim.setPlayingAnimation(AnimationSlot.PRIMARY, "walk");
anim.setPlayingAnimation(AnimationSlot.SECONDARY, "wave");

// Limpiar una animación
anim.setPlayingAnimation(AnimationSlot.PRIMARY, null);

// Obtener todas las animaciones activas
String[] animations = anim.getActiveAnimations();
```

**Notas de uso:**

- Las ranuras de animación permiten reproducir múltiples animaciones simultáneamente (ej., caminar + saludar)
- Los cambios de animación se sincronizan automáticamente con los clientes cuando se marcan como desactualizados
- Los valores de animación nulos indican que no hay animación reproduciéndose en esa ranura

---

### MovementAudioComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `MovementAudioComponent` gestiona la retroalimentación de audio para el movimiento de la entidad, incluyendo sonidos de pasos y sonidos de movimiento dentro de bloques (como caminar a través de agua o hierba).

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
      // Filtra al propietario de escuchar sus propios sonidos
   }
}
```

**Propiedades:**

| Propiedad               | Tipo  | Defecto | Descripción                                                |
| ----------------------- | ----- | ------- | ---------------------------------------------------------- |
| `lastInsideBlockTypeId` | int   | 0       | ID de tipo de bloque en el que está la entidad actualmente |
| `nextMoveInRepeat`      | float | -1.0    | Temporizador para repetir sonidos de movimiento            |

**Cómo usar:**

```java
// Añadir audio de movimiento a una entidad
holder.addComponent(MovementAudioComponent.getComponentType(), new MovementAudioComponent());

// Actualizar el bloque en el que está la entidad
MovementAudioComponent audio = store.getComponent(ref, MovementAudioComponent.getComponentType());
audio.setLastInsideBlockTypeId(waterBlockTypeId);

// Configurar sonido repetitivo (ej., salpicando en agua)
audio.setNextMoveInRepeat(0.5f);  // Repetir cada 0.5 segundos

// Comprobar si es hora de reproducir el sonido de nuevo
if (audio.canMoveInRepeat() && audio.tickMoveInRepeat(deltaTime)) {
    // Reproducir el sonido de movimiento
    audio.setNextMoveInRepeat(0.5f);  // Reiniciar temporizador
}
```

**Notas de uso:**

- El `ShouldHearPredicate` previene que las entidades escuchen sus propios sonidos de movimiento
- Usado para sonidos ambientales como caminar a través de agua, hierba alta, etc.
- Establecer `nextMoveInRepeat` a `NO_REPEAT` (-1.0) para deshabilitar sonidos repetitivos

---

### RespondToHit

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `RespondToHit` es un componente marcador (etiqueta) que indica que una entidad debe responder al ser golpeada con retroalimentación visual/auditiva. Usa el patrón singleton.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Hacer que la entidad responda a golpes (mostrar feedback de daño)
holder.addComponent(RespondToHit.getComponentType(), RespondToHit.INSTANCE);
// o
commandBuffer.addComponent(ref, RespondToHit.getComponentType(), RespondToHit.INSTANCE);

// Deshabilitar respuesta a golpes
commandBuffer.removeComponent(ref, RespondToHit.getComponentType());

// Comprobar si la entidad responde a golpes
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean respondsToHit = archetype.contains(RespondToHit.getComponentType());
```

**Notas de uso:**

- Usado para habilitar animaciones de retroalimentación de golpes, sonidos y efectos
- Relacionado con `PlayerCreativeSettings.respondToHit` para configuraciones específicas de jugador
- Las entidades sin este componente aún pueden recibir daño pero no mostrarán retroalimentación

---

### RotateObjectComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `RotateObjectComponent` hace que una entidad rote continuamente alrededor de su eje Y. Esto es útil para ítems de exhibición, objetos decorativos o coleccionables.

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

**Propiedades:**

| Propiedad       | Tipo  | Defecto | Descripción                                 |
| --------------- | ----- | ------- | ------------------------------------------- |
| `rotationSpeed` | float | 0.0     | Velocidad de rotación en grados por segundo |

**Cómo usar:**

```java
// Crear un ítem de exhibición rotando lentamente
RotateObjectComponent rotate = new RotateObjectComponent(45.0f);  // 45 grados/seg
holder.addComponent(RotateObjectComponent.getComponentType(), rotate);

// Crear un coleccionable girando rápido
holder.addComponent(RotateObjectComponent.getComponentType(),
    new RotateObjectComponent(180.0f));  // Media rotación por segundo

// Modificar velocidad de rotación en tiempo de ejecución
RotateObjectComponent rotate = store.getComponent(ref, RotateObjectComponent.getComponentType());
rotate.setRotationSpeed(90.0f);

// Detener rotación
rotate.setRotationSpeed(0.0f);
// o eliminar el componente
commandBuffer.removeComponent(ref, RotateObjectComponent.getComponentType());
```

**Notas de uso:**

- Valores positivos rotan en sentido antihorario (visto desde arriba)
- Valores negativos rotan en sentido horario
- Comúnmente usado para ítems soltados para hacerlos más visibles
- La rotación real es aplicada por un sistema que actualiza `TransformComponent`

---

### FromPrefab

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `FromPrefab` es un componente marcador (etiqueta) que indica que una entidad fue generada desde una definición de prefab. Usa el patrón singleton.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Marcar entidad como generada desde prefab
holder.addComponent(FromPrefab.getComponentType(), FromPrefab.INSTANCE);

// Comprobar si la entidad es de un prefab
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isFromPrefab = archetype.contains(FromPrefab.getComponentType());
```

**Notas de uso:**

- Usado para distinguir entre entidades generadas de prefabs vs. creadas dinámicamente
- Ayuda con la gestión y limpieza de entidades
- Las entidades de prefab pueden tener serialización especial o comportamiento de reaparición

---

### FromWorldGen

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `FromWorldGen` marca una entidad como generada por el sistema de generación de mundo. Almacena el ID de generación de mundo para rastrear qué sistema de gen la creó.

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

**Propiedades:**

| Propiedad    | Tipo | Descripción                                                 |
| ------------ | ---- | ----------------------------------------------------------- |
| `worldGenId` | int  | ID del sistema de generación de mundo que creó esta entidad |

**Cómo usar:**

```java
// Marcar entidad como generada por world gen
FromWorldGen worldGen = new FromWorldGen(generatorId);
holder.addComponent(FromWorldGen.getComponentType(), worldGen);

// Comprobar si la entidad fue generada
FromWorldGen worldGen = store.getComponent(ref, FromWorldGen.getComponentType());
if (worldGen != null) {
    int generatorId = worldGen.getWorldGenId();
    // Manejar entidad generada por el mundo
}
```

**Notas de uso:**

- Usado para entidades como criaturas que aparecen naturalmente, estructuras o decoraciones
- El `worldGenId` se puede usar para identificar qué generador creó la entidad
- Ayuda a prevenir la regeneración de entidades que ya han aparecido
- Relacionado con el componente `WorldGenId` que rastrea el estado de generación a nivel de chunk

---

### MovementStatesComponent

**Package:** `com.hypixel.hytale.server.core.entity.movement`

El `MovementStatesComponent` rastrea el estado de movimiento actual de una entidad. Almacena banderas booleanas para varios estados de movimiento como saltar, volar, nadar, agacharse y más. Este componente también rastrea lo que se envió por última vez a los clientes para la compresión delta.

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

**Propiedades de MovementStates:**

| Propiedad         | Tipo    | Descripción                                  |
| ----------------- | ------- | -------------------------------------------- |
| `idle`            | boolean | Entidad no se está moviendo                  |
| `horizontalIdle`  | boolean | Entidad no se está moviendo horizontalmente  |
| `jumping`         | boolean | Entidad está saltando actualmente            |
| `flying`          | boolean | Entidad está en modo vuelo                   |
| `walking`         | boolean | Entidad está caminando                       |
| `running`         | boolean | Entidad está corriendo                       |
| `sprinting`       | boolean | Entidad está esprintando                     |
| `crouching`       | boolean | Entidad está agachada/sigilo                 |
| `forcedCrouching` | boolean | Entidad forzada a agacharse (techo bajo)     |
| `falling`         | boolean | Entidad está cayendo                         |
| `climbing`        | boolean | Entidad está escalando (escalera/enredadera) |
| `inFluid`         | boolean | Entidad está en fluido (agua/lava)           |
| `swimming`        | boolean | Entidad está nadando                         |
| `swimJumping`     | boolean | Entidad está saltando mientras nada          |
| `onGround`        | boolean | Entidad está en el suelo                     |
| `mantling`        | boolean | Entidad está trepando sobre un borde         |
| `sliding`         | boolean | Entidad se está deslizando                   |
| `mounting`        | boolean | Entidad está montando/desmontando            |
| `rolling`         | boolean | Entidad está realizando un rodamiento        |
| `sitting`         | boolean | Entidad está sentada                         |
| `gliding`         | boolean | Entidad está planeando                       |
| `sleeping`        | boolean | Entidad está durmiendo                       |

**Cómo usar:**

```java
// Obtener estados de movimiento para una entidad
MovementStatesComponent component = store.getComponent(ref, MovementStatesComponent.getComponentType());
MovementStates states = component.getMovementStates();

// Comprobar si la entidad está en el suelo
if (states.onGround) {
    // Entidad está en el suelo
}

// Comprobar si la entidad está en estado relevante para combate
if (states.jumping || states.falling) {
    // Aplicar modificadores de combate aéreo
}

// Modificar estado de movimiento
states.crouching = true;

// Comprobar múltiples estados
boolean canSprint = states.onGround && !states.crouching && !states.inFluid;
```

**Notas de uso:**

- Los estados de movimiento se sincronizan con los clientes para animación y predicción
- El campo `sentMovementStates` rastrea lo que se envió por última vez para evitar actualizaciones de red redundantes
- Los estados son actualizados por varios sistemas de movimiento basados en física y entrada del jugador
- Usado por sistemas de animación para determinar qué animaciones reproducir

---

### MovementConfig (Asset)

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.movement`

El `MovementConfig` es un asset de datos (not un componente) que define parámetros de movimiento para entidades. Controla velocidades, fuerzas de salto, control aéreo, escalada, deslizamiento, rodamiento y más. Esto se carga desde archivos de asset JSON.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/movement/MovementConfig.java`

**Propiedades Clave:**

| Categoría    | Propiedad                                             | Tipo    | Defecto      | Descripción                                 |
| ------------ | ----------------------------------------------------- | ------- | ------------ | ------------------------------------------- |
| **Basic**    | `baseSpeed`                                           | float   | 5.5          | Velocidad de movimiento base                |
| **Basic**    | `acceleration`                                        | float   | 0.1          | Aceleración de movimiento                   |
| **Basic**    | `velocityResistance`                                  | float   | 0.242        | Fricción/resistencia del suelo              |
| **Jump**     | `jumpForce`                                           | float   | 11.8         | Fuerza de salto                             |
| **Jump**     | `swimJumpForce`                                       | float   | 10.0         | Fuerza de salto al nadar                    |
| **Jump**     | `jumpBufferDuration`                                  | float   | 0.3          | Ventana de tiempo para buffer de salto      |
| **Jump**     | `variableJumpFallForce`                               | float   | 35.0         | Fuerza aplicada al soltar salto pronto      |
| **Air**      | `airSpeedMultiplier`                                  | float   | 1.0          | Multiplicador de velocidad en aire          |
| **Air**      | `airDragMin` / `airDragMax`                           | float   | 0.96 / 0.995 | Rango de arrastre en aire                   |
| **Air**      | `airFrictionMin` / `airFrictionMax`                   | float   | 0.02 / 0.045 | Rango de fricción en aire                   |
| **Air**      | `airControlMinMultiplier` / `airControlMaxMultiplier` | float   | 0.0 / 3.13   | Rango multiplicador control aéreo           |
| **Fly**      | `horizontalFlySpeed`                                  | float   | 10.32        | Velocidad de vuelo horizontal               |
| **Fly**      | `verticalFlySpeed`                                    | float   | 10.32        | Velocidad de vuelo vertical                 |
| **Climb**    | `climbSpeed`                                          | float   | 0.035        | Velocidad de escalada vertical              |
| **Climb**    | `climbSpeedLateral`                                   | float   | 0.035        | Velocidad de escalada horizontal            |
| **Climb**    | `climbUpSprintSpeed`                                  | float   | 0.5          | Velocidad escalada arriba esprintando       |
| **Climb**    | `climbDownSprintSpeed`                                | float   | 0.6          | Velocidad escalada abajo esprintando        |
| **Walk**     | `forwardWalkSpeedMultiplier`                          | float   | 0.3          | Multiplicador velocidad caminar adelante    |
| **Walk**     | `backwardWalkSpeedMultiplier`                         | float   | 0.3          | Multiplicador velocidad caminar atrás       |
| **Walk**     | `strafeWalkSpeedMultiplier`                           | float   | 0.3          | Multiplicador velocidad caminar lado        |
| **Run**      | `forwardRunSpeedMultiplier`                           | float   | 1.0          | Multiplicador velocidad correr adelante     |
| **Run**      | `backwardRunSpeedMultiplier`                          | float   | 0.65         | Multiplicador velocidad correr atrás        |
| **Run**      | `strafeRunSpeedMultiplier`                            | float   | 0.8          | Multiplicador velocidad correr lado         |
| **Sprint**   | `forwardSprintSpeedMultiplier`                        | float   | 1.65         | Multiplicador velocidad esprintar           |
| **Crouch**   | `forwardCrouchSpeedMultiplier`                        | float   | 0.55         | Multiplicador velocidad agachado adelante   |
| **Crouch**   | `backwardCrouchSpeedMultiplier`                       | float   | 0.4          | Multiplicador velocidad agachado atrás      |
| **Crouch**   | `strafeCrouchSpeedMultiplier`                         | float   | 0.45         | Multiplicador velocidad agachado lado       |
| **Slide**    | `minSlideEntrySpeed`                                  | float   | 8.5          | Velocidad mínima para iniciar deslizamiento |
| **Slide**    | `slideExitSpeed`                                      | float   | 2.5          | Velocidad al salir de deslizamiento         |
| **Roll**     | `minFallSpeedToEngageRoll`                            | float   | 21.0         | Velocidad caída mínima para rodar           |
| **Roll**     | `maxFallSpeedToEngageRoll`                            | float   | 31.0         | Velocidad caída máxima para rodar           |
| **Roll**     | `rollStartSpeedModifier`                              | float   | 2.5          | Multiplicador velocidad inicio rodar        |
| **Roll**     | `rollExitSpeedModifier`                               | float   | 1.5          | Multiplicador velocidad fin rodar           |
| **Roll**     | `rollTimeToComplete`                                  | float   | 0.9          | Tiempo para completar animación rodar       |
| **Roll**     | `fallDamagePartialMitigationPercent`                  | float   | 33.0         | Reducción daño caída por rodar              |
| **AutoJump** | `autoJumpObstacleSpeedLoss`                           | float   | 0.95         | Pérdida velocidad en auto-salto             |
| **AutoJump** | `autoJumpObstacleMaxAngle`                            | float   | 45.0         | Ángulo máximo para auto-salto               |
| **AutoJump** | `autoJumpDisableJumping`                              | boolean | true         | Deshabilitar salto manual en auto-salto     |

**Cómo usar:**

```java
// Obtener la config de movimiento por defecto
MovementConfig config = MovementConfig.DEFAULT_MOVEMENT;

// Obtener una config de movimiento personalizada de assets
MovementConfig customConfig = MovementConfig.getAssetMap().getAsset("mymod:fast_runner");

// Acceder a valores de movimiento
float jumpForce = config.getJumpForce();
float baseSpeed = config.getBaseSpeed();
float sprintMultiplier = config.getForwardSprintSpeedMultiplier();

// Calcular velocidad efectiva de esprint
float sprintSpeed = baseSpeed * sprintMultiplier;
```

**Notas de uso:**

- Los assets `MovementConfig` pueden heredar de configs padres usando el sistema de assets
- La config se envía a los clientes vía paquete `MovementSettings` para predicción del lado del cliente
- Diferentes tipos de entidades pueden tener diferentes configs de movimiento
- Usado por los sistemas de física de movimiento para calcular el movimiento de la entidad

---

### Velocity

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

El componente `Velocity` almacena el vector de velocidad actual de una entidad e instrucciones de velocidad pendientes. Soporta múltiples tipos de modificación de velocidad (añadir, establecer, reemplazar) y es usado por los sistemas de física para mover entidades.

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

   // Manipulación de velocidad
   public void setZero();
   public void addForce(@Nonnull Vector3d force);
   public void addForce(double x, double y, double z);
   public void set(@Nonnull Vector3d newVelocity);
   public void set(double x, double y, double z);
   public void setClient(@Nonnull Vector3d newVelocity);

   // Acceso a componentes
   public void setX(double x);
   public void setY(double y);
   public void setZ(double z);
   public double getX();
   public double getY();
   public double getZ();
   public double getSpeed();

   // Cola de instrucciones
   public void addInstruction(@Nonnull Vector3d velocity, @Nullable VelocityConfig config, @Nonnull ChangeVelocityType type);
   @Nonnull public List<Velocity.Instruction> getInstructions();
}
```

**Propiedades:**

| Propiedad        | Tipo                | Descripción                            |
| ---------------- | ------------------- | -------------------------------------- |
| `velocity`       | `Vector3d`          | Velocidad actual (bloques por segundo) |
| `clientVelocity` | `Vector3d`          | Velocidad predicha por el cliente      |
| `instructions`   | `List<Instruction>` | Modificaciones de velocidad pendientes |

**Enum ChangeVelocityType:**

| Valor     | Descripción                               |
| --------- | ----------------------------------------- |
| `Add`     | Añadir a la velocidad actual              |
| `Set`     | Reemplazar la velocidad actual            |
| `Replace` | Reemplazar solo componentes especificados |

**Cómo usar:**

```java
// Obtener componente de velocidad
Velocity velocity = store.getComponent(ref, Velocity.getComponentType());

// Aplicar fuerza (aditivo)
velocity.addForce(0, 10, 0);  // Fuerza hacia arriba

// Establecer velocidad directamente
velocity.set(5, 0, 3);  // Mover noreste

// Obtener velocidad actual
double speed = velocity.getSpeed();

// Reiniciar velocidad
velocity.setZero();

// Añadir instrucción de velocidad (procesada por sistema de física)
velocity.addInstruction(
    new Vector3d(0, 15, 0),    // Velocidad de salto
    null,                        // Sin config especial
    ChangeVelocityType.Add       // Añadir a actual
);

// Crear entidad con velocidad inicial
Velocity vel = new Velocity(new Vector3d(10, 5, 0));
holder.addComponent(Velocity.getComponentType(), vel);
```

**Notas de uso:**

- La velocidad es en bloques por segundo
- Las instrucciones son procesadas por los sistemas de velocidad y luego limpiadas
- La velocidad del cliente se usa para sincronización de predicción del lado del cliente
- Funciona con el componente `PhysicsValues` para cálculos de masa y arrastre

---

### KnockbackComponent

**Package:** `com.hypixel.hytale.server.core.entity.knockback`

El `KnockbackComponent` almacena datos de empuje pendientes para aplicar a una entidad. Incluye la velocidad a aplicar, el tipo de cambio de velocidad, modificadores, y rastreo de duración para efectos de tambaleo.

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

**Propiedades:**

| Propiedad        | Tipo                 | Defecto | Descripción                              |
| ---------------- | -------------------- | ------- | ---------------------------------------- |
| `velocity`       | `Vector3d`           | -       | Velocidad de empuje a aplicar            |
| `velocityType`   | `ChangeVelocityType` | Add     | Cómo aplicar la velocidad                |
| `velocityConfig` | `VelocityConfig`     | null    | Configuración de velocidad opcional      |
| `modifiers`      | `DoubleList`         | empty   | Multiplicadores a aplicar a la velocidad |
| `duration`       | float                | 0       | Duración total del empuje                |
| `timer`          | float                | 0       | Tiempo actual transcurrido               |

**Cómo usar:**

```java
// Aplicar empuje a una entidad
KnockbackComponent knockback = new KnockbackComponent();
knockback.setVelocity(new Vector3d(5, 8, 0));  // Horizontal + vertical
knockback.setVelocityType(ChangeVelocityType.Set);
knockback.setDuration(0.3f);  // 300ms tambaleo
commandBuffer.addComponent(ref, KnockbackComponent.getComponentType(), knockback);

// Aplicar empuje con modificadores (ej., reducción por armadura)
knockback.addModifier(0.75);  // 25% reducción
knockback.addModifier(1.2);   // 20% aumento (por debuff)
knockback.applyModifiers();   // Aplicar todos los modificadores a la velocidad
```

**Notas de uso:**

- El empuje es procesado por sistemas de empuje dedicados
- La duración/temporizador pueden ser usados para efectos de tambaleo
- Los modificadores son multiplicativos y se aplican vía `applyModifiers()`
- El componente es típicamente eliminado después del procesamiento

---

### DamageDataComponent

**Package:** `com.hypixel.hytale.server.core.entity.damage`

El `DamageDataComponent` rastrea datos de temporización de combate para una entidad, incluyendo cuándo recibió daño por última vez, cuándo realizó una acción de combate por última vez, y el estado actual de interacción de empuñadura.

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

**Propiedades:**

| Propiedad          | Tipo                  | Defecto | Descripción                                                  |
| ------------------ | --------------------- | ------- | ------------------------------------------------------------ |
| `lastCombatAction` | `Instant`             | MIN     | Marca de tiempo de última acción de combate (ataque/bloqueo) |
| `lastDamageTime`   | `Instant`             | MIN     | Marca de tiempo del último daño recibido                     |
| `currentWielding`  | `WieldingInteraction` | null    | Estado actual de empuñadura de arma/herramienta              |
| `lastChargeTime`   | `Instant`             | null    | Marca de tiempo cuando comenzó el ataque cargado             |

**Cómo usar:**

```java
// Obtener datos de daño para una entidad
DamageDataComponent damageData = store.getComponent(ref, DamageDataComponent.getComponentType());

// Comprobar si la entidad estuvo recientemente en combate
Instant now = timeResource.getNow();
Duration timeSinceCombat = Duration.between(damageData.getLastCombatAction(), now);
boolean recentlyInCombat = timeSinceCombat.getSeconds() < 5;

// Actualizar tiempo de combate al atacar
damageData.setLastCombatAction(now);

// Comprobar enfriamiento de daño
Duration timeSinceDamage = Duration.between(damageData.getLastDamageTime(), now);
boolean canTakeDamage = timeSinceDamage.toMillis() > invulnerabilityFrames;

// Rastrear ataque cargado
damageData.setLastChargeTime(now);
// Más tarde...
Duration chargeTime = Duration.between(damageData.getLastChargeTime(), now);
float chargePercent = (float) Math.min(chargeTime.toMillis() / maxChargeMs, 1.0);
```

**Notas de uso:**

- Usado para enfriamientos de combate y cuadros de invulnerabilidad
- `currentWielding` rastrea el estado de interacción activa del arma
- El tiempo de acción de combate incluye tanto acciones de ataque como de defensa
- Esencial para sistemas de combo y temporización de ataques

---

### DeathComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.damage`

El `DeathComponent` se añade a una entidad cuando muere. Contiene información de la muerte incluyendo la causa, mensaje, configuración de pérdida de ítems, y ajustes de reaparición.

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

   // Ayudante estático para añadir componente de muerte de forma segura
   public static void tryAddComponent(@Nonnull CommandBuffer<EntityStore> commandBuffer,
                                      @Nonnull Ref<EntityStore> ref,
                                      @Nonnull Damage damage);
}
```

**Propiedades:**

| Propiedad                       | Tipo            | Defecto | Descripción                                       |
| ------------------------------- | --------------- | ------- | ------------------------------------------------- |
| `deathCause`                    | String          | -       | ID del asset de causa de daño                     |
| `deathMessage`                  | `Message`       | null    | Mensaje de muerte personalizado a mostrar         |
| `showDeathMenu`                 | boolean         | true    | Si mostrar menú de muerte/reaparición             |
| `itemsLostOnDeath`              | `ItemStack[]`   | null    | Ítems perdidos cuando la entidad murió            |
| `itemsAmountLossPercentage`     | double          | 0       | Porcentaje de cantidad de stacks perdidos         |
| `itemsDurabilityLossPercentage` | double          | 0       | Porcentaje de durabilidad perdida                 |
| `displayDataOnDeathScreen`      | boolean         | false   | Mostrar info detallada de muerte en pantalla      |
| `deathInfo`                     | `Damage`        | -       | Información completa del daño que causó la muerte |
| `itemsLossMode`                 | `ItemsLossMode` | ALL     | Cómo se pierden los ítems (ALL, RANDOM, NONE)     |

**Enum ItemsLossMode:**

| Valor    | Descripción                           |
| -------- | ------------------------------------- |
| `ALL`    | Todos los ítems se pierden al morir   |
| `RANDOM` | Selección aleatoria de ítems perdidos |
| `NONE`   | Ningún ítem perdido al morir          |

**Cómo usar:**

```java
// La muerte se aplica vía tryAddComponent (el constructor tiene acceso protegido)
DeathComponent.tryAddComponent(commandBuffer, entityRef, damage);

// Acceder a info de muerte después de que el componente es añadido
DeathComponent death = store.getComponent(ref, DeathComponent.getComponentType());
DamageCause cause = death.getDeathCause();
Damage damageInfo = death.getDeathInfo();
boolean showMenu = death.isShowDeathMenu();
```

**Notas de uso:**

- El método `tryAddComponent` previene añadir múltiples componentes de muerte
- Los sistemas de manejo de muerte procesan este componente para lógica de reaparición
- Usado por la UI de pantalla de muerte para mostrar información a los jugadores
- La pérdida de ítems se calcula basada en el modo configurado y porcentajes

---

### DespawnComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity`

El `DespawnComponent` marca una entidad para eliminación automática en un tiempo especificado. Proporciona métodos de fábrica para crear temporizadores de desaparición basados en segundos o milisegundos.

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

   // Métodos de fábrica
   @Nonnull public static DespawnComponent despawnInSeconds(@Nonnull TimeResource time, int seconds);
   @Nonnull public static DespawnComponent despawnInSeconds(@Nonnull TimeResource time, float seconds);
   @Nonnull public static DespawnComponent despawnInMilliseconds(@Nonnull TimeResource time, long milliseconds);

   // Métodos de instancia
   public void setDespawn(Instant timeToDespawnAt);
   public void setDespawnTo(@Nonnull Instant from, float additionalSeconds);
   @Nullable public Instant getDespawn();

   // Ayudante para despawn condicional
   public static void trySetDespawn(
      @Nonnull CommandBuffer<EntityStore> commandBuffer,
      @Nonnull TimeResource timeResource,
      @Nonnull Ref<EntityStore> ref,
      @Nullable DespawnComponent despawnComponent,
      @Nullable Float newLifetime
   );
}
```

**Propiedades:**

| Propiedad         | Tipo      | Descripción                                           |
| ----------------- | --------- | ----------------------------------------------------- |
| `timeToDespawnAt` | `Instant` | El tiempo exacto cuando la entidad debe ser eliminada |

**Cómo usar:**

```java
// Crear entidad con vida de 60 segundos
TimeResource time = store.getResource(TimeResource.TYPE);
holder.addComponent(DespawnComponent.getComponentType(),
    DespawnComponent.despawnInSeconds(time, 60));

// Crear entidad con vida de 2.5 segundos
holder.addComponent(DespawnComponent.getComponentType(),
    DespawnComponent.despawnInSeconds(time, 2.5f));

// Extender un temporizador de despawn existente
DespawnComponent despawn = store.getComponent(ref, DespawnComponent.getComponentType());
despawn.setDespawnTo(time.getNow(), 30.0f);  // 30 segundos más desde ahora

// Eliminar despawn (hacer permanente)
commandBuffer.removeComponent(ref, DespawnComponent.getComponentType());

// Establecer despawn condicionalmente
DespawnComponent.trySetDespawn(commandBuffer, timeResource, ref,
    existingDespawn, 120.0f);  // Poner a 120 segundos si existe, crear si no
```

**Notas de uso:**

- Comúnmente usado para ítems soltados (defecto 120 segundos), proyectiles y efectos
- El sistema de despawn comprueba entidades cada tick y elimina las expiradas
- Pasar vida `null` a `trySetDespawn` elimina el componente de despawn
- Serializado con la entidad para persistencia entre guardados

---

### EffectControllerComponent

**Package:** `com.hypixel.hytale.server.core.entity.effect`

El `EffectControllerComponent` gestiona efectos de estado activos en una entidad. Maneja añadir, eliminar, extender efectos, rastrear duraciones, y sincronizar estados de efectos a los clientes.

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

   // Añadir efectos
   public boolean addEffect(@Nonnull Ref<EntityStore> ownerRef, @Nonnull EntityEffect entityEffect,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public boolean addEffect(@Nonnull Ref<EntityStore> ownerRef, @Nonnull EntityEffect entityEffect,
                           float duration, @Nonnull OverlapBehavior overlapBehavior,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public boolean addInfiniteEffect(@Nonnull Ref<EntityStore> ownerRef, int entityEffectIndex,
                                   @Nonnull EntityEffect entityEffect,
                                   @Nonnull ComponentAccessor<EntityStore> componentAccessor);

   // Eliminar efectos
   public void removeEffect(@Nonnull Ref<EntityStore> ownerRef, int entityEffectIndex,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public void clearEffects(@Nonnull Ref<EntityStore> ownerRef,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);

   // Consultar efectos
   @Nonnull public Int2ObjectMap<ActiveEntityEffect> getActiveEffects();
   public int[] getActiveEffectIndexes();
   public boolean isInvulnerable();
}
```

**Enum OverlapBehavior:**

| Valor       | Descripción                           |
| ----------- | ------------------------------------- |
| `EXTEND`    | Sumar duración a efecto existente     |
| `OVERWRITE` | Reemplazar efecto existente           |
| `IGNORE`    | Mantener efecto existente sin cambios |

**Enum RemovalBehavior:**

| Valor      | Descripción                       |
| ---------- | --------------------------------- |
| `COMPLETE` | Eliminar efecto completamente     |
| `INFINITE` | Eliminar bandera de infinito solo |
| `DURATION` | Establecer duración restante a 0  |

**Cómo usar:**

```java
// Obtener controlador de efectos
EffectControllerComponent effects = store.getComponent(ref, EffectControllerComponent.getComponentType());

// Añadir un efecto con tiempo
EntityEffect poison = EntityEffect.getAssetMap().getAsset("hytale:poison");
effects.addEffect(ref, poison, 10.0f, OverlapBehavior.EXTEND, componentAccessor);

// Añadir un efecto infinito
EntityEffect fly = EntityEffect.getAssetMap().getAsset("hytale:flight");
effects.addInfiniteEffect(ref, flyIndex, fly, componentAccessor);

// Comprobar efectos activos
int[] activeEffectIndexes = effects.getActiveEffectIndexes();
for (int effectIndex : activeEffectIndexes) {
    ActiveEntityEffect active = effects.getActiveEffects().get(effectIndex);
    float remaining = active.getRemainingDuration();
}

// Eliminar un efecto específico
effects.removeEffect(ref, poisonIndex, componentAccessor);

// Limpiar todos los efectos
effects.clearEffects(ref, componentAccessor);

// Comprobar si la entidad tiene invulnerabilidad basada en efecto
if (effects.isInvulnerable()) {
    // Saltar daño
}
```

**Notas de uso:**

- Los efectos pueden modificar estadísticas de la entidad vía `StatModifiersManager`
- Algunos efectos pueden cambiar el modelo de la entidad temporalmente
- Los cambios de efectos son agrupados y enviados a clientes vía `EntityEffectUpdate`
- Usado para buffs, debuffs, dolencias de estado, y habilidades especiales

---

### ProjectileComponent

**Package:** `com.hypixel.hytale.server.core.entity.entities`

El `ProjectileComponent` representa una entidad proyectil como una flecha, hechizo o ítem arrojado. Maneja física de proyectiles, detección de colisión, daño al impacto y efectos visuales/auditivos.

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

   // Método de fábrica para crear proyectiles
   @Nonnull public static Holder<EntityStore> assembleDefaultProjectile(
      @Nonnull TimeResource time, @Nonnull String projectileAssetName,
      @Nonnull Vector3d position, @Nonnull Vector3f rotation
   );

   // Disparo
   public void shoot(@Nonnull Holder<EntityStore> holder, @Nonnull UUID creatorUuid,
                     double x, double y, double z, float yaw, float pitch);

   // Estado
   public boolean initialize();
   public void initializePhysics(@Nonnull BoundingBox boundingBox);
   public boolean consumeDeadTimer(float dt);
   public boolean isOnGround();
   public void applyBrokenPenalty(float penalty);
}
```

**Propiedades:**

| Propiedad              | Tipo    | Defecto | Descripción                                             |
| ---------------------- | ------- | ------- | ------------------------------------------------------- |
| `projectileAssetName`  | String  | -       | ID de asset para la configuración del proyectil         |
| `brokenDamageModifier` | float   | 1.0     | Multiplicador de daño (reducido para munición rota)     |
| `deadTimer`            | double  | -1.0    | Tiempo hasta que el proyectil es eliminado tras impacto |
| `creatorUuid`          | UUID    | -       | UUID de la entidad que disparó este proyectil           |
| `haveHit`              | boolean | false   | Si el proyectil ha golpeado algo                        |
| `appearance`           | String  | "Boy"   | Apariencia visual/ID de modelo                          |

**Cómo usar:**

```java
// Crear un proyectil
TimeResource time = store.getResource(TimeResource.TYPE);
Holder<EntityStore> projectileHolder = ProjectileComponent.assembleDefaultProjectile(
    time,
    "hytale:arrow",
    position,
    rotation
);

// Disparar el proyectil
ProjectileComponent projectile = projectileHolder.getComponent(ProjectileComponent.getComponentType());
projectile.shoot(projectileHolder, shooterUuid, x, y, z, yaw, pitch);

// Añadir al mundo
Ref<EntityStore> projectileRef = store.addEntity(projectileHolder, AddReason.SPAWN);

// Aplicar penalización de daño para arma rota
projectile.applyBrokenPenalty(0.25f);  // 25% reducción de daño
```

**Notas de uso:**

- Los proyectiles incluyen automáticamente `TransformComponent`, `Velocity`, `UUIDComponent`, y `DespawnComponent`
- Usa `SimplePhysicsProvider` para trayectoria y colisión
- Genera partículas y reproduce sonidos en rebote, impacto, fallo y muerte
- Puede activar explosiones al morir vía `ExplosionConfig`

---

### CollisionResultComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `CollisionResultComponent` almacena los resultados de la detección de colisiones para una entidad. Rastrea la posición de inicio de colisión, desplazamiento, y si una comprobación de colisión está pendiente.

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

**Propiedades:**

| Propiedad                 | Tipo              | Descripción                                              |
| ------------------------- | ----------------- | -------------------------------------------------------- |
| `collisionResult`         | `CollisionResult` | Información detallada de colisión                        |
| `collisionStartPosition`  | `Vector3d`        | Posición donde comenzó comprobación de colisión          |
| `collisionPositionOffset` | `Vector3d`        | Desplazamiento de movimiento tras resolución de colisión |
| `pendingCollisionCheck`   | boolean           | Si se necesita una nueva comprobación de colisión        |

**Cómo usar:**

```java
// Obtener resultado de colisión para una entidad
CollisionResultComponent collision = store.getComponent(ref, CollisionResultComponent.getComponentType());

// Comprobar si ocurrió colisión
CollisionResult result = collision.getCollisionResult();
if (result.hasCollided()) {
    // Manejar colisión
    Vector3d resolvedOffset = collision.getCollisionPositionOffset();
}

// Marcar para re-comprobar después de movimiento
collision.markPendingCollisionCheck();

// Después de procesar colisión
collision.consumePendingCollisionCheck();
collision.resetLocationChange();
```

**Notas de uso:**

- Usado por sistemas de física y movimiento para resolución de colisiones
- Los vectores "copy" se usan para operaciones seguras entre hilos
- Las comprobaciones de colisión son agrupadas y procesadas por sistemas de colisión
- Funciona con el componente `BoundingBox` para límites de la entidad

---

### PositionDataComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `PositionDataComponent` rastrea qué tipos de bloque la entidad está actualmente dentro y sobre cuáles está parada. Esto se usa para audio de movimiento, efectos de estado y lógica de juego.

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

**Propiedades:**

| Propiedad               | Tipo | Defecto | Descripción                                                 |
| ----------------------- | ---- | ------- | ----------------------------------------------------------- |
| `insideBlockTypeId`     | int  | 0       | ID tipo bloque en el que está la entidad (agua, lava, etc.) |
| `standingOnBlockTypeId` | int  | 0       | ID tipo bloque sobre el que está parada la entidad          |

**Cómo usar:**

```java
// Obtener datos de posición
PositionDataComponent posData = store.getComponent(ref, PositionDataComponent.getComponentType());

// Comprobar sobre qué bloque está parada la entidad
int standingBlockId = posData.getStandingOnBlockTypeId();
BlockType blockType = BlockType.getAssetMap().getAsset(standingBlockId);
if (blockType != null && blockType.getId().equals("hytale:ice")) {
    // Aplicar física de deslizamiento en hielo
}

// Comprobar si la entidad está en agua
int insideBlockId = posData.getInsideBlockTypeId();
BlockType insideBlock = BlockType.getAssetMap().getAsset(insideBlockId);
if (insideBlock != null && insideBlock.isFluid()) {
    // Aplicar física de natación
}
```

**Notas de uso:**

- Actualizado por sistemas de movimiento/posición cada tick
- ID de bloque 0 típicamente significa aire (sin bloque)
- Usado para sonidos de pasos, modificadores de velocidad de movimiento y efectos de estado
- Funciona con `MovementAudioComponent` para sonidos de movimiento

---

### NewSpawnComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `NewSpawnComponent` proporciona un periodo de gracia después de que la entidad aparece. Durante esta ventana, ciertos sistemas pueden tratar a la entidad de manera diferente (ej., saltar procesamiento inicial).

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

**Propiedades:**

| Propiedad        | Tipo  | Descripción                                                  |
| ---------------- | ----- | ------------------------------------------------------------ |
| `newSpawnWindow` | float | Tiempo restante en periodo de gracia de aparición (segundos) |

**Cómo usar:**

```java
// Crear entidad con protección de aparición
holder.addComponent(NewSpawnComponent.getComponentType(), new NewSpawnComponent(1.0f));  // 1 segundo

// Comprobar si la ventana de aparición ha pasado (en un sistema)
NewSpawnComponent spawn = chunk.getComponent(index, NewSpawnComponent.getComponentType());
if (spawn != null && spawn.newSpawnWindowPassed(dt)) {
    // Ventana de aparición expirada, eliminar componente
    commandBuffer.removeComponent(ref, NewSpawnComponent.getComponentType());
}
```

**Notas de uso:**

- Devuelve true y decrementa el temporizador cuando se llama con delta time
- Típicamente eliminado por un sistema una vez que la ventana expira
- Usado para prevenir aggro inmediato de NPCs u otras interacciones no deseadas
- Componente de vida corta que existe solo durante el periodo de gracia de aparición

---

### PropComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `PropComponent` es un componente marcador (etiqueta) que identifica una entidad como un prop. Los props son típicamente objetos decorativos estáticos o muebles. Usa el patrón singleton.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Marcar entidad como un prop
holder.addComponent(PropComponent.getComponentType(), PropComponent.get());

// Comprobar si la entidad es un prop
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isProp = archetype.contains(PropComponent.getComponentType());
```

**Notas de uso:**

- Usado para muebles, decoraciones y objetos estáticos
- Los props pueden tener serialización especial o manejo de interacción
- Diferente de entidades vivas - los props típicamente no se mueven ni tienen IA

---

### AudioComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `AudioComponent` almacena eventos de sonido pendientes para ser reproducidos en la posición de una entidad. Los sonidos se ponen en cola y luego son reproducidos por el sistema de audio.

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

**Propiedades:**

| Propiedad           | Tipo      | Descripción                                    |
| ------------------- | --------- | ---------------------------------------------- |
| `soundEventIds`     | `IntList` | Lista de IDs de eventos de sonido a reproducir |
| `isNetworkOutdated` | boolean   | Bandera para sincronización de red             |

**Cómo usar:**

```java
// Obtener componente de audio
AudioComponent audio = store.getComponent(ref, AudioComponent.getComponentType());

// Encolar un sonido para reproducir
int soundIndex = SoundEvent.getAssetMap().getIndex("hytale:entity.hurt");
audio.addSound(soundIndex);

// Obtener todos los sonidos pendientes
int[] sounds = audio.getSoundEventIds();

// Comprobar y consumir bandera de red
if (audio.consumeNetworkOutdated()) {
    // Enviar sonidos a clientes
}
```

**Notas de uso:**

- Los sonidos se encolan y reproducen en la posición de la entidad
- La sincronización de red asegura que los clientes escuchen los sonidos de la entidad
- Usado para sonidos específicos de la entidad (herido, muerte, ataque, etc.)
- Funciona con los sistemas de audio para audio posicionado en 3D

---

### PlayerSkinComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

El `PlayerSkinComponent` almacena los datos de skin/apariencia del jugador. Esto incluye la textura de la skin, personalización del modelo y otras propiedades visuales.

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

**Propiedades:**

| Propiedad           | Tipo         | Descripción                          |
| ------------------- | ------------ | ------------------------------------ |
| `playerSkin`        | `PlayerSkin` | Datos de skin/apariencia del jugador |
| `isNetworkOutdated` | boolean      | Bandera para sincronización de red   |

**Cómo usar:**

```java
// Obtener skin del jugador
PlayerSkinComponent skinComp = store.getComponent(playerRef, PlayerSkinComponent.getComponentType());
PlayerSkin skin = skinComp.getPlayerSkin();

// Forzar actualización de skin a clientes
skinComp.setNetworkOutdated();

// Comprobar si la skin necesita sincronización
if (skinComp.consumeNetworkOutdated()) {
    // Enviar datos de skin a clientes
}
```

**Notas de uso:**

- Los datos de skin se reciben típicamente del cliente al iniciar sesión
- Los cambios en la skin activan sincronización de red a otros jugadores
- Usado por sistemas de modelo/efectos al aplicar cambios visuales
- Puede ser anulado temporalmente por efectos (ej., disfraz)

---

## Sistemas de Inventario e Ítems

Los sistemas de inventario e ítems gestionan inventarios de jugadores, contenedores de ítems, stacks de ítems, ventanas y ranuras de armadura. Estos son sistemas centrales de juego que gestionan ítems a lo largo del juego.

### Inventory

**Package:** `com.hypixel.hytale.server.core.inventory`

La clase `Inventory` gestiona el inventario completo de una entidad viva, incluyendo almacenamiento, armadura, hotbar, ranuras de utilidad, herramientas y mochila. Proporciona métodos para mover ítems entre secciones, colocación inteligente de ítems y serialización.

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

   // IDs de sección (valores negativos para secciones internas)
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

   // Contenedores combinados para buscar/mover ítems
   private CombinedItemContainer combinedHotbarFirst;
   private CombinedItemContainer combinedStorageFirst;
   private CombinedItemContainer combinedBackpackStorageHotbar;
   private CombinedItemContainer combinedEverything;
}
```

**Secciones de Inventario:**

| Sección  | ID  | Capacidad por Defecto | Descripción                                             |
| -------- | --- | --------------------- | ------------------------------------------------------- |
| Hotbar   | -1  | 9                     | Ranuras de ítems de acceso rápido                       |
| Storage  | -2  | 36                    | Almacenamiento principal (rejilla 4x9)                  |
| Armor    | -3  | 4                     | Ranuras de equipamiento (Cabeza, Pecho, Manos, Piernas) |
| Utility  | -5  | 4                     | Ranuras de ítems consumibles                            |
| Tools    | -8  | 23                    | Almacenamiento de herramientas (obsoleto)               |
| Backpack | -9  | 0                     | Almacenamiento de mochila expandible                    |

**Métodos Clave:**

```java
// Mover ítem entre secciones
void moveItem(int fromSectionId, int fromSlotId, int quantity, int toSectionId, int toSlotId);

// Movimiento inteligente con auto-equipado y fusión de stacks
void smartMoveItem(int fromSectionId, int fromSlotId, int quantity, SmartMoveType moveType);

// Obtener ítems de ranura activa
ItemStack getItemInHand();           // Ítem activo de hotbar o herramienta
ItemStack getActiveHotbarItem();     // Ítem de ranura activa de hotbar
ItemStack getUtilityItem();          // Ítem de ranura activa de utilidad
ItemStack getToolsItem();            // Ítem de ranura activa de herramientas

// Gestión de ranuras
void setActiveHotbarSlot(byte slot);
void setActiveUtilitySlot(byte slot);
void setActiveToolsSlot(byte slot);

// Acceso a contenedor
ItemContainer getContainerForItemPickup(Item item, PlayerSettings settings);
ItemContainer getSectionById(int id);

// Operaciones en masa
List<ItemStack> dropAllItemStacks();
void clear();
```

**Enum SmartMoveType:**

| Valor                   | Descripción                                            |
| ----------------------- | ------------------------------------------------------ |
| `EquipOrMergeStack`     | Auto-equipar armadura o fusionar con stacks existentes |
| `PutInHotbarOrWindow`   | Mover a hotbar, o abrir ventana de contenedor          |
| `PutInHotbarOrBackpack` | Mover a hotbar, almacenamiento, o mochila              |

**Ejemplos de Uso:**

```java
// Obtener inventario del jugador
Player player = store.getComponent(playerRef, Player.getComponentType());
Inventory inventory = player.getInventory();

// Mover ítem de almacenamiento a hotbar
inventory.moveItem(
    Inventory.STORAGE_SECTION_ID, 5,   // De ranura de almacenamiento 5
    64,                                 // Mover 64 ítems
    Inventory.HOTBAR_SECTION_ID, 0     // A ranura de hotbar 0
);

// Equipado inteligente de armadura
inventory.smartMoveItem(
    Inventory.STORAGE_SECTION_ID, 10,
    1,
    SmartMoveType.EquipOrMergeStack
);

// Obtener ítem en mano
ItemStack heldItem = inventory.getItemInHand();
if (heldItem != null && heldItem.getItem().getWeapon() != null) {
    // El jugador está sosteniendo un arma
}

// Añadir ítems al inventario del jugador (respeta preferencias de recogida)
PlayerSettings settings = store.getComponent(playerRef, PlayerSettings.getComponentType());
ItemContainer targetContainer = inventory.getContainerForItemPickup(item, settings);
targetContainer.addItemStack(itemStack);
```

---

### ItemStack

**Package:** `com.hypixel.hytale.server.core.inventory`

La clase `ItemStack` representa una pila de ítems con cantidad, durabilidad y metadatos opcionales. Los ItemStacks son inmutables por diseño - los métodos de modificación devuelven nuevas instancias.

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

**Propiedades:**

| Propiedad                      | Tipo         | Descripción                                        |
| ------------------------------ | ------------ | -------------------------------------------------- |
| `itemId`                       | String       | ID de asset del ítem (ej., "hytale:diamond_sword") |
| `quantity`                     | int          | Número de ítems en el stack (>0)                   |
| `durability`                   | double       | Durabilidad actual (0 = roto)                      |
| `maxDurability`                | double       | Durabilidad máxima (0 = irrompible)                |
| `metadata`                     | BsonDocument | Datos personalizados adjuntos al ítem              |
| `overrideDroppedItemAnimation` | boolean      | Anular animación de caída por defecto              |

**Métodos Modificadores Inmutables:**

```java
// Todos los métodos devuelven nuevas instancias de ItemStack
ItemStack withQuantity(int quantity);           // Returns null if quantity == 0
ItemStack withDurability(double durability);
ItemStack withMaxDurability(double maxDurability);
ItemStack withIncreasedDurability(double inc);
ItemStack withRestoredDurability(double maxDurability);
ItemStack withState(String state);
ItemStack withMetadata(BsonDocument metadata);
ItemStack withMetadata(String key, Codec<T> codec, T data);
```

**Operaciones de Stack:**

```java
// Comprobar si los ítems se pueden apilar juntos
boolean isStackableWith(ItemStack other);   // Mismo id, durabilidad, metadatos
boolean isEquivalentType(ItemStack other);  // Mismo id y metadatos (ignora durabilidad)

// Métodos de utilidad estáticos
static boolean isEmpty(ItemStack itemStack);           // null o id "Empty"
static boolean isStackableWith(ItemStack a, ItemStack b);
static boolean isSameItemType(ItemStack a, ItemStack b);  // Solo mismo id de ítem
```

**Durabilidad:**

```java
boolean isUnbreakable();  // maxDurability <= 0
boolean isBroken();       // durability == 0 (y rompible)
```

**Ejemplos de Uso:**

```java
// Crear un nuevo stack de ítems
ItemStack sword = new ItemStack("hytale:iron_sword", 1);
ItemStack blocks = new ItemStack("hytale:stone", 64);

// Modificar stack de ítems (devuelve nueva instancia)
ItemStack damagedSword = sword.withDurability(sword.getDurability() - 10);
ItemStack halfStack = blocks.withQuantity(32);

// Añadir metadatos personalizados
ItemStack enchantedSword = sword.withMetadata("Enchantments", enchantCodec, enchantData);

// Comprobar si es apilable
if (stackA.isStackableWith(stackB)) {
    // Puede fusionar estos stacks
    int newQuantity = stackA.getQuantity() + stackB.getQuantity();
    int maxStack = stackA.getItem().getMaxStack();
    // ...
}

// Comprobar durabilidad
if (sword.isBroken()) {
    // Herramienta rota, no se puede usar
}
```

---

### ItemContainer

**Package:** `com.hypixel.hytale.server.core.inventory.container`

El `ItemContainer` es la clase base abstracta para todos los contenedores de almacenamiento de ítems. Proporciona métodos completos para añadir, eliminar, mover y consultar stacks de ítems con soporte de filtros.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/ItemContainer.java`

```java
public abstract class ItemContainer {
   // Métodos abstractos principales
   public abstract short getCapacity();
   public abstract void setGlobalFilter(FilterType globalFilter);
   public abstract void setSlotFilter(FilterActionType actionType, short slot, SlotFilter filter);
   public abstract ItemContainer clone();

   // Operaciones internas (protegidas)
   protected abstract ItemStack internal_getSlot(short slot);
   protected abstract ItemStack internal_setSlot(short slot, ItemStack itemStack);
   protected abstract ItemStack internal_removeSlot(short slot);
   protected abstract boolean cantAddToSlot(short slot, ItemStack itemStack, ItemStack slotItemStack);
   protected abstract boolean cantRemoveFromSlot(short slot);
   protected abstract boolean cantDropFromSlot(short slot);
}
```

**Tipos Principales de Contenedores:**

| Tipo                    | Descripción                                        |
| ----------------------- | -------------------------------------------------- |
| `SimpleItemContainer`   | Contenedor básico de tamaño fijo                   |
| `EmptyItemContainer`    | Marcador de posición de capacidad cero (singleton) |
| `CombinedItemContainer` | Combina múltiples contenedores virtualmente        |

**Métodos Clave:**

```java
// Operaciones de una sola ranura
ItemStack getItemStack(short slot);
ItemStackSlotTransaction addItemStackToSlot(short slot, ItemStack itemStack);
ItemStackSlotTransaction setItemStackForSlot(short slot, ItemStack itemStack);
SlotTransaction removeItemStackFromSlot(short slot);
ItemStackSlotTransaction removeItemStackFromSlot(short slot, int quantity);

// Operaciones en masa
ItemStackTransaction addItemStack(ItemStack itemStack);
ListTransaction<ItemStackTransaction> addItemStacks(List<ItemStack> itemStacks);
ItemStackTransaction removeItemStack(ItemStack itemStack);
ListTransaction<ItemStackTransaction> removeItemStacks(List<ItemStack> itemStacks);

// Operaciones de movimiento
MoveTransaction<ItemStackTransaction> moveItemStackFromSlot(short slot, ItemContainer containerTo);
MoveTransaction<SlotTransaction> moveItemStackFromSlotToSlot(short slot, int quantity,
    ItemContainer containerTo, short slotTo);
ListTransaction<MoveTransaction<ItemStackTransaction>> moveAllItemStacksTo(ItemContainer... containerTo);

// Operaciones de consulta
boolean canAddItemStack(ItemStack itemStack);
boolean canRemoveItemStack(ItemStack itemStack);
boolean containsItemStacksStackableWith(ItemStack itemStack);
int countItemStacks(Predicate<ItemStack> itemPredicate);
boolean isEmpty();

// Operaciones de Recurso/Material
ResourceTransaction removeResource(ResourceQuantity resource);
MaterialTransaction removeMaterial(MaterialQuantity material);
TagTransaction removeTag(int tagIndex, int quantity);

// Utilidad
List<ItemStack> dropAllItemStacks();
ClearTransaction clear();
ListTransaction<SlotTransaction> sortItems(SortType sort);
void forEach(ShortObjectConsumer<ItemStack> action);

// Eventos
EventRegistration registerChangeEvent(Consumer<ItemContainerChangeEvent> consumer);
```

**Transacciones:**

Todas las operaciones de contenedor devuelven objetos de transacción que indican éxito/fracaso y proporcionan el estado antes/después:

```java
// Comprobar si la operación tuvo éxito
ItemStackTransaction transaction = container.addItemStack(itemStack);
if (transaction.succeeded()) {
    ItemStack remainder = transaction.getRemainder();
    if (remainder != null) {
        // Añadido parcial - algunos ítems no cabían
    }
}
```

**Ejemplos de Uso:**

```java
// Crear un contenedor
SimpleItemContainer chest = new SimpleItemContainer((short)27);  // 27 ranuras

// Añadir ítems
ItemStackTransaction result = chest.addItemStack(new ItemStack("hytale:gold_ingot", 10));
if (!result.succeeded()) {
    // El contenedor está lleno
}

// Mover ítems entre contenedores
MoveTransaction<ItemStackTransaction> moveResult = sourceContainer.moveItemStackFromSlot(
    (short)5,           // De ranura 5
    destContainer       // A este contenedor
);

// Comprobar contenido del contenedor
int goldCount = chest.countItemStacks(item ->
    item.getItemId().equals("hytale:gold_ingot"));

// Registrar cambios
chest.registerChangeEvent(event -> {
    Transaction transaction = event.transaction();
    // Manejar cambio de contenedor
});
```

---

### CombinedItemContainer

**Package:** `com.hypixel.hytale.server.core.inventory.container`

El `CombinedItemContainer` combina virtualmente múltiples instancias de `ItemContainer` en un solo contenedor buscable. Las operaciones iteran a través de contenedores hijos en orden, permitiendo colocación de ítems basada en prioridad.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/CombinedItemContainer.java`

```java
public class CombinedItemContainer extends ItemContainer {
   protected final ItemContainer[] containers;

   public CombinedItemContainer(ItemContainer... containers);

   public ItemContainer getContainer(int index);
   public int getContainersSize();
   public ItemContainer getContainerForSlot(short slot);

   @Override
   public short getCapacity();  // Suma de todas las capacidades hijas
}
```

**Mapeo de Ranuras:**

Las ranuras se mapean secuencialmente a través de contenedores hijos:

- Contenedor 0: ranuras 0 a (capacidad0 - 1)
- Contenedor 1: ranuras capacidad0 a (capacidad0 + capacidad1 - 1)
- Y así sucesivamente...

**Ejemplos de Uso:**

```java
// Crear contenedor combinado (hotbar primero para colocación de ítems)
CombinedItemContainer hotbarFirst = new CombinedItemContainer(hotbar, storage);

// Ítems añadidos probarán primero hotbar, luego almacenamiento
hotbarFirst.addItemStack(new ItemStack("hytale:apple", 5));

// Crear almacenamiento-primero para comportamiento diferente
CombinedItemContainer storageFirst = new CombinedItemContainer(storage, hotbar);

// Obtener el contenedor subyacente para una ranura
ItemContainer container = hotbarFirst.getContainerForSlot((short)15);
// Si hotbar tiene 9 ranuras, la ranura 15 estaría en almacenamiento (ranura 6 dentro de almacenamiento)

// El inventario usa estos para preferencias de recogida de ítems
Inventory inventory = player.getInventory();
CombinedItemContainer pickupContainer = inventory.getCombinedHotbarFirst();
pickupContainer.addItemStack(pickedUpItem);
```

---

### SlotFilter and ArmorSlotAddFilter

**Package:** `com.hypixel.hytale.server.core.inventory.container.filter`

Los filtros de ranura controlan qué ítems pueden ser añadidos o eliminados de ranuras de contenedor específicas. Se usan para restricciones de armadura, requisitos de ranura de utilidad, y reglas de contenedor personalizadas.

**Source files:**

- `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/filter/SlotFilter.java`
- `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/filter/ArmorSlotAddFilter.java`

```java
public interface SlotFilter {
   SlotFilter ALLOW = (actionType, container, slot, itemStack) -> true;
   SlotFilter DENY = (actionType, container, slot, itemStack) -> false;

   boolean test(FilterActionType actionType, ItemContainer container, short slot, ItemStack itemStack);
}

// Filtro para ranuras de armadura - restringe por tipo de armadura
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

**Enum FilterActionType:**

| Valor    | Descripción                 |
| -------- | --------------------------- |
| `ADD`    | Añadir ítems a la ranura    |
| `REMOVE` | Eliminar ítems de la ranura |
| `DROP`   | Soltar ítems de la ranura   |

**Ejemplos de Uso:**

```java
// Aplicar filtro de armadura a un contenedor
container.setSlotFilter(FilterActionType.ADD, (short)0, new ArmorSlotAddFilter(ItemArmorSlot.Head));
container.setSlotFilter(FilterActionType.ADD, (short)1, new ArmorSlotAddFilter(ItemArmorSlot.Chest));
container.setSlotFilter(FilterActionType.ADD, (short)2, new ArmorSlotAddFilter(ItemArmorSlot.Hands));
container.setSlotFilter(FilterActionType.ADD, (short)3, new ArmorSlotAddFilter(ItemArmorSlot.Legs));

// Hacer una ranura de solo lectura
container.setSlotFilter(FilterActionType.REMOVE, (short)5, SlotFilter.DENY);

// Filtro personalizado para ítems usables solamente
container.setSlotFilter(FilterActionType.ADD, (short)0,
    (type, cont, slot, item) -> item == null || item.getItem().getUtility().isUsable());
```

---

### ItemArmorSlot

**Package:** `com.hypixel.hytale.protocol`

El enum `ItemArmorSlot` define los cuatro tipos de ranura de armadura disponibles para el equipamiento del jugador.

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

**Ejemplos de Uso:**

```java
// Obtener ranura de armadura del ítem
Item item = itemStack.getItem();
ItemArmor armor = item.getArmor();
if (armor != null) {
    ItemArmorSlot slot = armor.getArmorSlot();
    // Colocar en la ranura de inventario apropiada
    inventory.getArmor().setItemStackForSlot((short)slot.getValue(), itemStack);
}

// Comprobar si el ítem es un casco
if (armor.getArmorSlot() == ItemArmorSlot.Head) {
    // Aplicar lógica específica de casco
}
```

---

### UniqueItemUsagesComponent

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.data`

El `UniqueItemUsagesComponent` rastrea qué ítems únicos/de un solo uso ha usado ya un jugador. Esto evita que los jugadores usen el mismo ítem único múltiples veces.

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

**Propiedades:**

| Propiedad         | Tipo          | Descripción                     |
| ----------------- | ------------- | ------------------------------- |
| `usedUniqueItems` | `Set<String>` | Conjunto de IDs de ítems usados |

**Ejemplos de Uso:**

```java
// Comprobar si el jugador ha usado un ítem único
UniqueItemUsagesComponent usages = store.getComponent(playerRef,
    UniqueItemUsagesComponent.getComponentType());

String itemId = "hytale:special_scroll";
if (usages.hasUsedUniqueItem(itemId)) {
    // Ya usado, no se puede usar de nuevo
    return;
}

// Usar el ítem y registrarlo
performUniqueItemEffect(player, itemId);
usages.recordUniqueItemUsage(itemId);
```

---

## Sistema de Ventanas

El sistema de ventanas gestiona ventanas UI que los jugadores pueden abrir, como contenedores, mesas de crafteo, tiendas y otras interfaces interactivas.

### Window

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

La clase `Window` es la base abstracta para todas las ventanas UI. Maneja el ciclo de vida de la ventana (abrir/cerrar), serialización de datos e interacción del jugador.

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

   // Ciclo de vida
   public void init(PlayerRef playerRef, WindowManager manager);
   protected abstract boolean onOpen0();
   protected abstract void onClose0();
   public void close();

   // Datos
   public abstract JsonObject getData();
   public void handleAction(Ref<EntityStore> ref, Store<EntityStore> store, WindowAction action);

   // Estado
   protected void invalidate();
   protected void setNeedRebuild();
   protected boolean consumeIsDirty();

   // Eventos
   public EventRegistration registerCloseEvent(Consumer<WindowCloseEvent> consumer);

   // Getters
   public WindowType getType();
   public int getId();
   public PlayerRef getPlayerRef();
}
```

**Tipos de Ventana:**

Subclases de `Window` incluyen:

- `ItemContainerWindow` - Ventanas con contenedores de ítems
- `ContainerWindow` - Base para ventanas de contenedor
- `BlockWindow` - Ventanas adjuntas a bloques
- `ContainerBlockWindow` - Ventanas de contenedor basadas en bloques
- `ItemStackContainerWindow` - Ventanas para contenedores de stacks de ítems
- `MaterialContainerWindow` - Ventanas con recursos materiales
- `ValidatedWindow` - Ventanas con lógica de validación

**Ciclo de Vida de Ventana:**

1. Ventana es creada con `WindowType`
2. `init()` es llamado con referencia de jugador
3. `onOpen0()` es llamado - devolver false para cancelar apertura
4. Ventana está activa y maneja llamadas `handleAction()`
5. `onClose0()` es llamado al cerrar
6. Evento de cierre es despachado

**Ejemplos de Uso:**

```java
// Crear una ventana personalizada
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
        // Inicializar ventana, devolver true para abrir
        return true;
    }

    @Override
    protected void onClose0() {
        // Limpieza cuando la ventana cierra
    }

    @Override
    public JsonObject getData() {
        JsonObject data = new JsonObject();
        data.addProperty("rows", 3);
        return data;
    }
}

// Registrar manejador de cierre
window.registerCloseEvent(event -> {
    // Ventana fue cerrada
    saveContainerContents();
});
```

---

### WindowManager

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

El `WindowManager` gestiona todas las ventanas abiertas para un jugador. Maneja IDs de ventana, apertura/cierre, actualización y validación.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/WindowManager.java`

```java
public class WindowManager {
   private final AtomicInteger windowId = new AtomicInteger(1);
   private final Int2ObjectConcurrentHashMap<Window> windows = new Int2ObjectConcurrentHashMap<>();
   private final Int2ObjectConcurrentHashMap<EventRegistration> windowChangeEvents;
   private PlayerRef playerRef;

   public void init(PlayerRef playerRef);

   // Abrir ventanas
   public UpdateWindow clientOpenWindow(Window window);   // Para ventanas solicitadas por cliente (id=0)
   public OpenWindow openWindow(Window window);           // Server-opened windows
   public List<OpenWindow> openWindows(Window... windows);

   public OpenWindow openWindow(Window window);           // Ventanas abiertas por servidor
   public List<OpenWindow> openWindows(Window... windows);

   // Acceso a ventana
   public Window getWindow(int id);
   public List<Window> getWindows();

   // Cerrar
   public Window closeWindow(int id);
   public void closeAllWindows();

   // Actualizaciones
   public void updateWindow(Window window);
   public void updateWindows();          // Actualiza todas las ventanas sucias
   public void validateWindows();        // Valida ValidatedWindows
   public void markWindowChanged(int id);
}
```

**IDs de Ventana:**

- ID `0` está reservado para ventanas solicitadas por el cliente
- ID `-1` es inválido
- Ventanas abiertas por servidor obtienen IDs incrementales empezando desde 1

**Ejemplos de Uso:**

```java
// Obtener gestor de ventanas del jugador
Player player = store.getComponent(playerRef, Player.getComponentType());
WindowManager windowManager = player.getWindowManager();

// Abrir una ventana de contenedor
ChestWindow chestWindow = new ChestWindow(chestContainer);
OpenWindow packet = windowManager.openWindow(chestWindow);
if (packet != null) {
    playerRef.getPacketHandler().write(packet);
}

// Cerrar una ventana específica
windowManager.closeWindow(windowId);

// Obtener todas las ventanas abiertas
for (Window window : windowManager.getWindows()) {
    if (window instanceof ItemContainerWindow icw) {
        ItemContainer container = icw.getItemContainer();
        // Procesar contenedor
    }
}

// Cerrar todas las ventanas (ej., en desconexión)
windowManager.closeAllWindows();
```

---

### ItemContainerWindow Interface

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

La interfaz `ItemContainerWindow` es implementada por ventanas que contienen contenedores de ítems. Esto permite al gestor de ventanas sincronizar automáticamente cambios en el contenedor.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/ItemContainerWindow.java`

```java
public interface ItemContainerWindow {
   @Nonnull
   ItemContainer getItemContainer();
}
```

**Ejemplos de Uso:**

```java
// Comprobar si ventana tiene ítems
Window window = windowManager.getWindow(windowId);
if (window instanceof ItemContainerWindow icw) {
    ItemContainer container = icw.getItemContainer();

    // Mover ítems de inventario del jugador a contenedor
    player.getInventory().getStorage().moveItemStackFromSlot(
        (short)0, container
    );
}
```

---

## Componentes HUD

El sistema HUD (Heads-Up Display) gestiona elementos UI en pantalla que muestran estado del jugador, inventario, e información del juego.

### HudComponent

**Package:** `com.hypixel.hytale.protocol.packets.interface_`

El enum `HudComponent` define todos los elementos HUD disponibles que pueden ser mostrados u ocultos en el cliente.

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

**Descripción de Componentes HUD:**

| Componente                         | Descripción                                |
| ---------------------------------- | ------------------------------------------ |
| `Hotbar`                           | Ranuras de acceso rápido en parte inferior |
| `StatusIcons`                      | Iconos de Buff/debuff                      |
| `Reticle`                          | Mira/retícula de apuntado                  |
| `Chat`                             | Ventana de chat                            |
| `Requests`                         | Solicitudes de amigo/grupo                 |
| `Notifications`                    | Notificaciones del sistema                 |
| `KillFeed`                         | Pantalla de muertes recientes              |
| `InputBindings`                    | Pistas de control                          |
| `PlayerList`                       | Lista de jugadores (Tab)                   |
| `EventTitle`                       | Texto de título de evento grande           |
| `Compass`                          | Brújula direccional                        |
| `ObjectivePanel`                   | Pantalla de misión/objetivo                |
| `PortalPanel`                      | Información de portal                      |
| `BuilderToolsLegend`               | Leyenda de herramientas modo creativo      |
| `Speedometer`                      | Pantalla de velocidad de vehículo          |
| `UtilitySlotSelector`              | Selector de ítem de utilidad               |
| `BlockVariantSelector`             | Selector de variante de bloque             |
| `BuilderToolsMaterialSlotSelector` | Selector de material creativo              |
| `Stamina`                          | Barra de estamina                          |
| `AmmoIndicator`                    | Contador de munición                       |
| `Health`                           | Barra de salud                             |
| `Mana`                             | Barra de maná                              |
| `Oxygen`                           | Barra de oxígeno bajo agua                 |
| `Sleep`                            | Indicador de progreso de sueño             |

**Ejemplos de Uso:**

```java
// Ocultar componentes HUD (ej., durante escena)
Set<HudComponent> hiddenComponents = EnumSet.of(
    HudComponent.Hotbar,
    HudComponent.Health,
    HudComponent.Stamina,
    HudComponent.Chat
);

UpdateVisibleHudComponents packet = new UpdateVisibleHudComponents();
packet.hiddenComponents = hiddenComponents;
playerRef.getPacketHandler().write(packet);

// Mostrar todos los componentes de nuevo
packet.hiddenComponents = EnumSet.noneOf(HudComponent.class);
playerRef.getPacketHandler().write(packet);
```

---

### EntityUIComponent

**Package:** `com.hypixel.hytale.server.core.modules.entityui.asset`

El `EntityUIComponent` es una clase de asset abstracta para elementos UI mostrados sobre entidades (como placas de nombre, barras de salud, o indicadores personalizados).

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

**Propiedades:**

| Propiedad      | Tipo                | Descripción                                      |
| -------------- | ------------------- | ------------------------------------------------ |
| `id`           | String              | Identificador de asset                           |
| `hitboxOffset` | Vector2f            | Desplazamiento desde centro de hitbox de entidad |
| `data`         | AssetExtraInfo.Data | Metadatos de asset adicionales                   |

**Ejemplos de Uso:**

```java
// Obtener componente UI de entidad de assets
EntityUIComponent healthBar = EntityUIComponent.getAssetMap()
    .getAsset("hytale:health_bar");

// Crear paquete para UI de entidad
com.hypixel.hytale.protocol.EntityUIComponent packet = healthBar.toPacket();
```

---

## Componentes de Física

Estos componentes manejan simulación de física incluyendo gravedad, masa, arrastre, y cálculos de velocidad.

### PhysicsValues

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

El componente `PhysicsValues` almacena propiedades de física para una entidad incluyendo masa, coeficiente de arrastre, y dirección de gravedad. Estos valores son usados por sistemas de física para calcular el movimiento de la entidad.

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

**Propiedades:**

| Propiedad         | Tipo    | Defecto | Descripción                                                |
| ----------------- | ------- | ------- | ---------------------------------------------------------- |
| `mass`            | double  | 1.0     | Masa de entidad (debe ser > 0), afecta momento y retroceso |
| `dragCoefficient` | double  | 0.5     | Coeficiente resistencia aire (>= 0), ralentiza movimiento  |
| `invertedGravity` | boolean | false   | Si la gravedad está invertida (entidad cae hacia arriba)   |

**Cómo usar:**

```java
// Crear valores de física para una entidad pesada
PhysicsValues physics = new PhysicsValues(5.0, 0.3, false);
holder.addComponent(PhysicsValues.getComponentType(), physics);

// Crear una entidad flotante (gravedad invertida)
PhysicsValues floatingPhysics = new PhysicsValues(1.0, 0.5, true);
holder.addComponent(PhysicsValues.getComponentType(), floatingPhysics);

// Modificar física en tiempo de ejecución
PhysicsValues physics = store.getComponent(ref, PhysicsValues.getComponentType());
physics.scale(2.0f);  // Doblar masa y arrastre

// Restablecer a valores por defecto
physics.resetToDefault();
```

**Notas de uso:**

- La masa afecta la resistencia al retroceso - entidades más pesadas son empujadas menos
- El coeficiente de arrastre afecta qué tan rápido las entidades deceleran en el aire
- La gravedad invertida puede ser usada para efectos especiales o mecánicas de juego
- Funciona con componente `Velocity` para cálculos de movimiento

---

### Projectile (Marker Component)

**Package:** `com.hypixel.hytale.server.core.modules.projectile.component`

El componente marcador `Projectile` identifica una entidad como un proyectil. Usa el patrón singleton para eficiencia de memoria.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Marcar entidad como un proyectil
holder.addComponent(Projectile.getComponentType(), Projectile.INSTANCE);

// Comprobar si entidad es un proyectil
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isProjectile = archetype.contains(Projectile.getComponentType());

// Eliminar marcador de proyectil
commandBuffer.removeComponent(ref, Projectile.getComponentType());
```

**Notas de uso:**

- Usado por sistemas de proyectiles para identificar entidades que deben seguir física balística
- Diferente de `ProjectileComponent` que almacena datos de estado de proyectil
- Los proyectiles típicamente también tienen `Velocity`, `TransformComponent`, y `DespawnComponent`

---

## Componentes de Animación y Modelo

Estos componentes manejan representación visual de entidad incluyendo modelos y animaciones.

### ActiveAnimationComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `ActiveAnimationComponent` rastrea qué animaciones se están reproduciendo actualmente en cada ranura de animación de una entidad. Soporta múltiples animaciones simultáneas en diferentes ranuras.

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

**Propiedades:**

| Propiedad           | Tipo     | Descripción                                           |
| ------------------- | -------- | ----------------------------------------------------- |
| `activeAnimations`  | String[] | Array de IDs de animación indexados por AnimationSlot |
| `isNetworkOutdated` | boolean  | Bandera para sincronización de red                    |

**Enum AnimationSlot (del protocolo):**

| Ranura    | Descripción                                             |
| --------- | ------------------------------------------------------- |
| `Body`    | Animación principal de cuerpo (caminar, correr, reposo) |
| `Arms`    | Animaciones de brazos (atacar, bloquear, usar)          |
| `Head`    | Animaciones de cabeza (mirar alrededor)                 |
| `Overlay` | Efectos superpuestos (flash de golpe, brillo)           |

**Cómo usar:**

```java
// Obtener componente de animación
ActiveAnimationComponent anim = store.getComponent(ref, ActiveAnimationComponent.getComponentType());

// Establecer animación de caminar en ranura de cuerpo
anim.setPlayingAnimation(AnimationSlot.Body, "walk");

// Establecer animación de ataque en ranura de brazos
anim.setPlayingAnimation(AnimationSlot.Arms, "sword_swing");

// Limpiar una ranura de animación
anim.setPlayingAnimation(AnimationSlot.Overlay, null);

// Obtener todas las animaciones activas
String[] animations = anim.getActiveAnimations();
String bodyAnim = animations[AnimationSlot.Body.ordinal()];
```

**Notas de uso:**

- Las animaciones son referenciadas por IDs de string definidos en assets de modelo
- Múltiples ranuras permiten mezclar animaciones (ej., caminar mientras se ataca)
- La sincronización de red asegura que los clientes vean las mismas animaciones
- Las transiciones de animación son manejadas por el sistema de animación

---

### ModelComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `ModelComponent` almacena el modelo actual para una entidad. Esto determina la apariencia visual y animaciones disponibles.

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

**Propiedades:**

| Propiedad           | Tipo    | Descripción                             |
| ------------------- | ------- | --------------------------------------- |
| `model`             | Model   | El asset de modelo actual de la entidad |
| `isNetworkOutdated` | boolean | Bandera para sincronización de red      |

**Cómo usar:**

```java
// Obtener modelo de assets
Model zombieModel = Model.getAssetMap().getAsset("hytale:zombie");

// Crear entidad con modelo
holder.addComponent(ModelComponent.getComponentType(), new ModelComponent(zombieModel));

// Acceder a datos de modelo
ModelComponent modelComp = store.getComponent(ref, ModelComponent.getComponentType());
Model model = modelComp.getModel();

// Obtener propiedades de modelo
String modelId = model.getId();
BoundingBox bounds = model.getBoundingBox();
```

**Notas de uso:**

- Los modelos definen apariencia de entidad, hitbox, y esqueleto de animación
- Cambiar modelos en tiempo de ejecución activa sincronización de red a clientes
- Funciona con `ActiveAnimationComponent` para reproducción de animación
- Los assets de modelo son cargados de archivos de datos de juego

---

### PersistentModel

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `PersistentModel` almacena una referencia de modelo que persiste con la serialización de la entidad. A diferencia de `ModelComponent`, esto almacena solo una referencia y es guardado/cargado con la entidad.

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

**Propiedades:**

| Propiedad        | Tipo                 | Descripción                      |
| ---------------- | -------------------- | -------------------------------- |
| `modelReference` | Model.ModelReference | Referencia al recurso del modelo |

**Cómo usar:**

```java
// Crear referencia de modelo persistente
Model.ModelReference modelRef = new Model.ModelReference("hytale:custom_npc");
holder.addComponent(PersistentModel.getComponentType(), new PersistentModel(modelRef));

// Acceder a modelo persistente
PersistentModel persistent = store.getComponent(ref, PersistentModel.getComponentType());
Model.ModelReference ref = persistent.getModelReference();

// Actualizar referencia de modelo
persistent.setModelReference(new Model.ModelReference("hytale:different_model"));
```

**Notas de uso:**

- Usado para entidades que necesitan recordar su modelo entre guardados
- Model.ModelReference es una referencia ligera, no son los datos completos del modelo
- El modelo real es resuelto desde la referencia cuando se necesita
- Comúnmente usado para NPCs con apariencias personalizables

---

### PersistentDynamicLight

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `PersistentDynamicLight` añade una fuente de luz dinámica a una entidad que persiste con la serialización. La luz sigue a la entidad e ilumina el área circundante.

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

**Propiedades:**

| Propiedad    | Tipo       | Descripción                                |
| ------------ | ---------- | ------------------------------------------ |
| `colorLight` | ColorLight | Configuración de color e intensidad de luz |

**Cómo usar:**

```java
// Crear una luz naranja tipo antorcha
ColorLight torchLight = new ColorLight(255, 200, 100, 15);  // RGB + radio
holder.addComponent(PersistentDynamicLight.getComponentType(),
    new PersistentDynamicLight(torchLight));

// Crear un brillo mágico azul
ColorLight magicLight = new ColorLight(100, 150, 255, 10);
holder.addComponent(PersistentDynamicLight.getComponentType(),
    new PersistentDynamicLight(magicLight));

// Actualizar luz en tiempo de ejecución
PersistentDynamicLight light = store.getComponent(ref, PersistentDynamicLight.getComponentType());
light.setColorLight(new ColorLight(255, 0, 0, 20));  // Luz de advertencia roja
```

**Notas de uso:**

- El radio de luz es en bloques
- Los valores de color son RGB (0-255)
- La luz sigue la posición de la entidad automáticamente
- Usado para entidades brillantes, antorchas sostenidas, efectos mágicos
- Persiste a través de guardados y cargas de mundo

---

### HeadRotation

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `HeadRotation` rastrea la rotación independiente de la cabeza de una entidad, separada de la rotación del cuerpo. Esto permite a las entidades mirar a objetivos mientras se mueven en una dirección diferente.

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

**Propiedades:**

| Propiedad  | Tipo     | Descripción                     |
| ---------- | -------- | ------------------------------- |
| `rotation` | Vector3f | Yaw, pitch, y roll de la cabeza |

**Cómo usar:**

```java
// Crear entidad con rotación de cabeza
holder.addComponent(HeadRotation.getComponentType(), new HeadRotation());

// Hacer que la entidad mire a una posición
HeadRotation head = store.getComponent(ref, HeadRotation.getComponentType());
Vector3d entityPos = transform.getPosition();
Vector3d targetPos = getTargetPosition();
Vector3d direction = targetPos.subtract(entityPos).normalize();
float yaw = (float) Math.atan2(-direction.getX(), -direction.getZ());
float pitch = (float) Math.asin(direction.getY());
head.setRotation(new Vector3f(pitch, yaw, 0));

// Obtener dirección de mirada como vector unitario
Vector3d lookDir = head.getDirection();

// Obtener eje dominante (para posicionamiento de bloques, etc.)
Axis dominantAxis = head.getAxis();
```

**Notas de uso:**

- Yaw es rotación horizontal (mirar izquierda/derecha)
- Pitch es rotación vertical (mirar arriba/abajo)
- Roll es rotación de inclinación (raramente usado para cabezas)
- `getAxisDirection()` devuelve la dirección cardinal más cercana
- Usado por IA para rastrear objetivos de mirada independientemente del movimiento

---

## Componentes de Etiqueta y Marcador

Estos son componentes ligeros que marcan entidades con banderas o categorías específicas.

### HiddenFromAdventurePlayers

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente marcador `HiddenFromAdventurePlayers` oculta una entidad de los jugadores en Modo Aventura. La entidad sigue siendo visible para jugadores en Creativo u otros modos. Usa el patrón singleton.

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

**Propiedades:**

- Ninguna (componente marcador)

**Cómo añadir/eliminar:**

```java
// Ocultar entidad de jugadores de aventura
holder.addComponent(HiddenFromAdventurePlayers.getComponentType(),
    HiddenFromAdventurePlayers.INSTANCE);

// Comprobar si entidad está oculta
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isHidden = archetype.contains(HiddenFromAdventurePlayers.getComponentType());

// Hacer entidad visible de nuevo
commandBuffer.removeComponent(ref, HiddenFromAdventurePlayers.getComponentType());
```

**Notas de uso:**

- Usado para entidades de debug, objetos solo de editor, o herramientas de admin
- La entidad aún existe y procesa normalmente, solo no es visible
- Útil para contenido específico de modo de juego
- Combinar con otros sistemas de visibilidad para control de grano fino

---

### WorldGenId

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `WorldGenId` almacena el ID de generación de mundo para entidades generadas por la generación de mundo. Esto ayuda a rastrear qué paso de generación creó la entidad y prevenir generación duplicada.

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

**Propiedades:**

| Propiedad    | Tipo | Defecto | Descripción                                       |
| ------------ | ---- | ------- | ------------------------------------------------- |
| `worldGenId` | int  | 0       | ID de paso de generación (0 = no de gen de mundo) |

**Cómo usar:**

```java
// Marcar entidad como generada por paso de gen 5
holder.addComponent(WorldGenId.getComponentType(), new WorldGenId(5));

// Comprobar si entidad es de generación de mundo
WorldGenId worldGen = store.getComponent(ref, WorldGenId.getComponentType());
if (worldGen != null && worldGen.getWorldGenId() != WorldGenId.NON_WORLD_GEN_ID) {
    // Entidad fue creada por generación de mundo
    int passId = worldGen.getWorldGenId();
}
```

**Notas de uso:**

- `NON_WORLD_GEN_ID` (0) indica que la entidad no fue generada por generación de mundo
- Diferentes pasos de generación tienen IDs únicos
- Usado para prevenir re-generar entidades en áreas ya generadas
- Relacionado con componente `FromWorldGen` que almacena info adicional de gen de mundo

---

## Componentes de IA y Comportamiento

Estos componentes soportan el sistema de IA de NPC incluyendo búsqueda de caminos, roles, y árboles de comportamiento.

### NPCEntity

**Package:** `com.hypixel.hytale.server.npc.entities`

El componente `NPCEntity` es un componente integral que gestiona el comportamiento de Personajes No Jugadores. Extiende `LivingEntity` y proporciona IA, búsqueda de caminos, roles, y gestión de estado.

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
   // ... y más métodos
}
```

**Propiedades Clave:**

| Propiedad           | Tipo        | Descripción                                   |
| ------------------- | ----------- | --------------------------------------------- |
| `role`              | Role        | Rol IA actual definiendo comportamiento       |
| `pathManager`       | PathManager | Gestiona búsqueda de caminos y navegación     |
| `leashPoint`        | Vector3d    | Punto de anclaje para NPCs con rango limitado |
| `hoverHeight`       | double      | Desplazamiento de altura para NPCs voladores  |
| `initialModelScale` | float       | Factor de escala de modelo                    |
| `environmentIndex`  | int         | Referencia a asset de entorno                 |

**Clases Relacionadas:**

- **Role**: Define comportamiento de NPC, combate, transiciones de estado, e instrucciones
- **PathManager**: Maneja búsqueda de caminos A\* y navegación
- **AlarmStore**: Gestiona eventos temporizados y alarmas para el NPC

**Cómo usar:**

```java
// Obtener componente NPC
NPCEntity npc = store.getComponent(ref, NPCEntity.getComponentType());

// Acceder al rol (definición de comportamiento)
Role role = npc.getRole();
if (role != null) {
    String roleName = role.getRoleName();
    boolean isHostile = !role.isFriendly(ref, componentAccessor);
}

// Acceder a búsqueda de caminos
PathManager pathManager = npc.getPathManager();
if (pathManager.hasPath()) {
    Vector3d nextWaypoint = pathManager.getNextWaypoint();
}

// Comprobar estado de NPC
if (npc.isDespawning()) {
    // NPC está siendo eliminado
}

// Establecer punto de anclaje (limitar rango de movimiento NPC)
npc.setLeashPoint(new Vector3d(100, 64, 200));
```

**Notas de uso:**

- NPCEntity es un componente de alto nivel combinando muchas características de IA
- Los roles definen comportamiento a través de árboles de instrucciones y máquinas de estados
- PathManager usa algoritmo A\* para navegación
- Soporta comportamiento de manada, separación, y grupo
- Incluye soporte de combate, rastreo de objetivos, y manejo de interacción
- El entorno afecta el comportamiento de NPC (día/noche, clima, bioma)

---

### PathManager

**Package:** `com.hypixel.hytale.server.npc.entities`

La clase `PathManager` gestiona la búsqueda de caminos para entidades NPC. Almacena el camino actual, maneja solicitudes de cálculo de camino, y proporciona utilidades de navegación.

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

**Métodos Clave:**

| Método                   | Descripción                                       |
| ------------------------ | ------------------------------------------------- |
| `hasPath()`              | Devuelve true si NPC tiene camino activo          |
| `getCurrentPath()`       | Obtiene el camino de navegación actual            |
| `getNextWaypoint()`      | Obtiene la siguiente posición hacia donde moverse |
| `setPath(Path)`          | Establece un nuevo camino para el NPC             |
| `clearPath()`            | Limpia el camino actual                           |
| `advanceWaypoint()`      | Se mueve al siguiente punto de ruta en el camino  |
| `getRemainingDistance()` | Obtiene distancia restante al destino             |

**Notas de uso:**

- Los caminos son calculados usando algoritmo A\* en `AStarBase`
- Soporta navegación en tierra, vuelo, y nado
- Los waypoints son posiciones del mundo entre las que se mueve el NPC
- Las solicitudes de camino pueden ser asíncronas para evitar bloqueos
- Funciona con controladores de movimiento para movimiento real

---

## Componentes del Sistema de Montura

Los siguientes componentes son parte del sistema de montura de Hytale, permitiendo a entidades montar otras entidades o bloques (como sillas y vagonetas).

### MountedComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

El `MountedComponent` se añade a una entidad cuando está montada en otra entidad o bloque. Rastrea en qué está montada la entidad, el desplazamiento de adjunto, y el tipo de controlador.

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

**Propiedades:**

| Propiedad          | Tipo               | Descripción                                                   |
| ------------------ | ------------------ | ------------------------------------------------------------- |
| `mountedToEntity`  | `Ref<EntityStore>` | Referencia a la entidad siendo montada (null si es en bloque) |
| `mountedToBlock`   | `Ref<ChunkStore>`  | Referencia al bloque siendo montado (null si es en entidad)   |
| `controller`       | `MountController`  | Tipo de control de montura (ej., `Rideable`, `BlockMount`)    |
| `blockMountType`   | `BlockMountType`   | Tipo de montura de bloque (ej., `Seat`, `Bed`)                |
| `attachmentOffset` | `Vector3f`         | Desplazamiento desde punto de montura                         |
| `mountStartMs`     | long               | Timestamp de cuando empezó la montura                         |

**Cómo usar:**

```java
// Montar una entidad en otra entidad
MountedComponent mounted = new MountedComponent(
    mountRef,                    // Entidad a montar
    new Vector3f(0, 1.5f, 0),   // Desplazamiento de asiento
    MountController.Rideable
);
commandBuffer.addComponent(riderRef, MountedComponent.getComponentType(), mounted);

// Montar en un bloque (silla/cama)
MountedComponent blockMount = new MountedComponent(
    blockRef,                    // Referencia de bloque
    seatOffset,                  // Desplazamiento de adjunto
    BlockMountType.Seat
);

// Comprobar cuánto tiempo montado
long durationMs = mounted.getMountedDurationMs();
```

**Notas de uso:**

- La entidad solo puede tener un `MountedComponent` a la vez
- La sincronización de red es automática cuando se establece la bandera outdated
- Usado tanto para entidades montables (caballos) como monturas de bloque (sillas, camas)

---

### MountedByComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

El `MountedByComponent` se añade a una entidad que puede llevar pasajeros. Rastrea todas las entidades montándola actualmente.

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

**Propiedades:**

| Propiedad    | Tipo                     | Descripción                                          |
| ------------ | ------------------------ | ---------------------------------------------------- |
| `passengers` | `List<Ref<EntityStore>>` | Lista de entidades montando actualmente esta entidad |

**Cómo usar:**

```java
// Añadir componente para hacer entidad montable
holder.addComponent(MountedByComponent.getComponentType(), new MountedByComponent());

// Añadir un pasajero
MountedByComponent mountedBy = store.getComponent(horseRef, MountedByComponent.getComponentType());
mountedBy.addPassenger(playerRef);

// Obtener todos los pasajeros
List<Ref<EntityStore>> passengers = mountedBy.getPassengers();
for (Ref<EntityStore> passenger : passengers) {
    // Procesar cada jinete
}

// API fluida para inicialización
MountedByComponent component = new MountedByComponent()
    .withPassenger(riderRef);
```

**Notas de uso:**

- Elimina automáticamente referencias de pasajeros inválidas (eliminadas)
- Múltiples pasajeros soportados para vehículos/botes
- Emparejado con `MountedComponent` en las entidades jinetes

---

### NPCMountComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

El `NPCMountComponent` marca un NPC como una montura (criatura montable). Almacena el índice de rol original para que el NPC pueda reanudar comportamiento normal cuando se desmonte.

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

**Propiedades:**

| Propiedad           | Tipo        | Descripción                            |
| ------------------- | ----------- | -------------------------------------- |
| `originalRoleIndex` | int         | Índice del rol IA original del NPC     |
| `ownerPlayerRef`    | `PlayerRef` | El jugador que posee/domó esta montura |
| `anchorX/Y/Z`       | float       | Punto de anclaje para la montura       |

**Cómo usar:**

```java
// Convertir NPC a montura
NPCMountComponent mountComp = new NPCMountComponent();
mountComp.setOriginalRoleIndex(npc.getRole().getIndex());
mountComp.setOwnerPlayerRef(playerRef);
commandBuffer.addComponent(npcRef, NPCMountComponent.getComponentType(), mountComp);

// Restaurar rol original cuando se desmonta
int originalRole = mountComp.getOriginalRoleIndex();
```

**Notas de uso:**

- Serializado con entidad para persistencia
- Rastreo de dueño permite mecánicas de llamada/doma
- Punto de anclaje puede limitar rango de vagabundeo de la montura

---

### BlockMountComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

El `BlockMountComponent` se adjunta a un chunk para rastrear asientos basados en bloques (sillas, bancos, camas). Gestiona múltiples posiciones de asiento dentro de un solo bloque.

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

**Propiedades:**

| Propiedad           | Tipo             | Descripción                                   |
| ------------------- | ---------------- | --------------------------------------------- |
| `type`              | `BlockMountType` | Tipo de montura de bloque (Silla, Cama, etc.) |
| `blockPos`          | `Vector3i`       | Posición mundial del bloque                   |
| `expectedBlockType` | `BlockType`      | Tipo de bloque esperado para validación       |
| `expectedRotation`  | int              | Rotación de bloque esperada                   |

**Cómo usar:**

```java
// Crear montura de bloque para una silla
BlockMountComponent chair = new BlockMountComponent(
    BlockMountType.Seat,
    blockPosition,
    chairBlockType,
    blockRotation
);

// Encontrar y sentar entidad en el asiento disponible más cercano
BlockMountPoint seat = chair.findAvailableSeat(blockPos, seatChoices, clickPos);
if (seat != null) {
    chair.putSeatedEntity(seat, playerRef);
}

// Eliminar entidad del asiento
chair.removeSeatedEntity(playerRef);

// Comprobar si montura de bloque está vacía
if (chair.isDead()) {
    // Eliminar componente - no más entidades sentadas
}
```

**Notas de uso:**

- Almacenado en `ChunkStore` (componentes de bloque), no `EntityStore`
- Soporta múltiples posiciones de asiento por bloque (bancos, sofás)
- `findAvailableSeat` devuelve el asiento desocupado más cercano a la posición de click
- Limpia automáticamente referencias de entidad inválidas

---

### MinecartComponent

**Package:** `com.hypixel.hytale.builtin.mounts.minecart`

El `MinecartComponent` identifica una entidad como vagoneta. Rastrea daño por golpes para destrucción y el ítem fuente para drops.

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

**Propiedades:**

| Propiedad      | Tipo      | Defecto     | Descripción                                 |
| -------------- | --------- | ----------- | ------------------------------------------- |
| `numberOfHits` | int       | 0           | Número de veces golpeado (para destrucción) |
| `lastHit`      | `Instant` | null        | Tiempo del último golpe                     |
| `sourceItem`   | String    | "Rail_Kart" | ID de ítem soltado cuando se destruye       |

**Cómo usar:**

```java
// Crear entidad vagoneta
MinecartComponent minecart = new MinecartComponent("Custom_Minecart");
holder.addComponent(MinecartComponent.getComponentType(), minecart);

// Rastrea daño
minecart.setNumberOfHits(minecart.getNumberOfHits() + 1);
minecart.setLastHit(Instant.now());

// Comprobar si debe romperse
if (minecart.getNumberOfHits() >= BREAK_THRESHOLD) {
    // Soltar ítem fuente y eliminar entidad
    String dropItem = minecart.getSourceItem();
}
```

**Notas de uso:**

- Las vagonetas siguen bloques de riel automáticamente
- Sistema de múltiples golpes permite destrucción golpe-para-romper
- Item fuente determina qué cae cuando la vagoneta es destruida

---

## Componentes del Sistema Desplegable

Los desplegables son entidades colocadas por jugadores como torretas, trampas, y otros dispositivos automatizados.

### DeployableComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

El `DeployableComponent` marca una entidad como dispositivo desplegable. Rastrea al dueño, configuración, tiempo de aparición, y banderas personalizadas para estado desplegable.

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

**Propiedades:**

| Propiedad             | Tipo                           | Descripción                                      |
| --------------------- | ------------------------------ | ------------------------------------------------ |
| `config`              | `DeployableConfig`             | Asset de configuración definiendo comportamiento |
| `owner`               | `Ref<EntityStore>`             | Referencia a entidad que despliega               |
| `ownerUUID`           | `UUID`                         | UUID del dueño para persistencia                 |
| `spawnInstant`        | `Instant`                      | Cuando el desplegable fue colocado               |
| `timeSinceLastAttack` | float                          | Temporizador de enfriamiento para ataques        |
| `spawnFace`           | String                         | En qué cara fue colocado el desplegable          |
| `flags`               | `Map<DeployableFlag, Integer>` | Banderas de estado personalizadas                |

**Enum DeployableFlag:**

| Bandera       | Descripción                             |
| ------------- | --------------------------------------- |
| `STATE`       | Estado actual de máquina de estados     |
| `LIVE`        | Si el desplegable está activo           |
| `BURST_SHOTS` | Disparos restantes en ráfaga            |
| `TRIGGERED`   | Si la condición de disparo fue cumplida |

**Cómo usar:**

```java
// Crear desplegable
DeployableComponent deployable = new DeployableComponent();
deployable.init(playerRef, store, config, Instant.now(), "up");
holder.addComponent(DeployableComponent.getComponentType(), deployable);

// Rastrear enfriamiento de ataque
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

- Los desplegables hacen tick a través de su `DeployableConfig` que define el comportamiento
- El primer tick ejecuta lógica de inicialización (ej., reproducir animación de aparición)
- El rastreo de dueño permite atribución apropiada de daño/muertes

---

### DeployableOwnerComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

El componente `DeployableOwnerComponent` se adjunta a entidades que poseen desplegables. Rastrea todos los desplegables colocados por la entidad y hace cumplir límites.

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

**Propiedades:**

| Propiedad              | Tipo                                   | Descripción                     |
| ---------------------- | -------------------------------------- | ------------------------------- |
| `deployables`          | `List<Pair<String, Ref<EntityStore>>>` | Todos los desplegables poseídos |
| `deployableCountPerId` | `Object2IntMap<String>`                | Conteo por tipo de desplegable  |

**Cómo usar:**

```java
// Obtener componente de dueño
DeployableOwnerComponent owner = store.getComponent(playerRef,
    DeployableOwnerComponent.getComponentType());

// Registrar nuevo desplegable
owner.registerDeployable(playerRef, deployableComp, "turret", turretRef, store);

// Desregistrar cuando se destruye
owner.deRegisterDeployable("turret", turretRef);
```

**Notas de uso:**

- Destruye automáticamente los desplegables más viejos cuando se exceden los límites
- Límites por tipo y globales desde `GameplayConfig`
- Maneja limpieza al eliminar la entidad

---

### DeployableProjectileComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

El `DeployableProjectileComponent` marca un proyectil como disparado por un desplegable. Rastrea la posición previa para detección de colisiones.

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

**Propiedades:**

| Propiedad              | Tipo       | Descripción                  |
| ---------------------- | ---------- | ---------------------------- |
| `previousTickPosition` | `Vector3d` | Posición en el tick anterior |

**Notas de uso:**

- Usado para detección de colisión de barrido (línea desde posición previa a actual)
- Esencial para proyectiles de movimiento rápido que podrían saltarse objetivos

---

### DeployableProjectileShooterComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

El `DeployableProjectileShooterComponent` se añade a desplegables que pueden disparar proyectiles. Rastrea proyectiles activos y el objetivo actual.

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

**Propiedades:**

| Propiedad      | Tipo                     | Descripción                     |
| -------------- | ------------------------ | ------------------------------- |
| `projectiles`  | `List<Ref<EntityStore>>` | Proyectiles activos actualmente |
| `activeTarget` | `Ref<EntityStore>`       | Entidad objetivo actual         |

**Notas de uso:**

- Gestiona el tiempo de vida de los proyectiles disparados
- Rastreo de objetivos para torretas de auto-apuntado
- Limpieza cuando los proyectiles golpean o desaparecen

---

## Componentes del Sistema de Aventura

Estos componentes son parte de las características del modo aventura de Hytale incluyendo misiones, reputación, y agricultura.

### ObjectiveHistoryComponent

**Package:** `com.hypixel.hytale.builtin.adventure.objectives.components`

El `ObjectiveHistoryComponent` rastrea el progreso de misión/objetivo e historial de completado de un jugador.

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

**Propiedades:**

| Propiedad                 | Tipo                                    | Descripción                     |
| ------------------------- | --------------------------------------- | ------------------------------- |
| `objectiveHistoryMap`     | `Map<String, ObjectiveHistoryData>`     | Historial por ID de objetivo    |
| `objectiveLineHistoryMap` | `Map<String, ObjectiveLineHistoryData>` | Historial por línea de objetivo |

**Notas de uso:**

- Persistido con datos del jugador
- Rastrea estado de completado, marcas de tiempo, y progreso
- Usado para UI de misiones y comprobaciones de progresión

---

### ReputationGroupComponent

**Package:** `com.hypixel.hytale.builtin.adventure.reputation`

El `ReputationGroupComponent` asigna una entidad a un grupo de reputación, afectando cómo las facciones la ven.

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

**Propiedades:**

| Propiedad           | Tipo   | Descripción                          |
| ------------------- | ------ | ------------------------------------ |
| `reputationGroupId` | String | ID del grupo de reputación (facción) |

**Cómo usar:**

```java
// Asignar entidad a una facción
ReputationGroupComponent rep = new ReputationGroupComponent("hytale:village_faction");
holder.addComponent(ReputationGroupComponent.getComponentType(), rep);

// Comprobar facción para decisiones de IA
String faction = rep.getReputationGroupId();
boolean isFriendly = reputationSystem.areFactionsFriendly(playerFaction, faction);
```

**Notas de uso:**

- Los NPCs usan esto para determinar relaciones amigo/enemigo
- Las acciones del jugador afectan la reputación con diferentes grupos
- Atado al sistema de reputación/facciones

---

### CoopResidentComponent

**Package:** `com.hypixel.hytale.builtin.adventure.farming.component`

El `CoopResidentComponent` marca una entidad como residente de un gallinero o estructura de agricultura similar.

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

**Propiedades:**

| Propiedad          | Tipo       | Defecto | Descripción                       |
| ------------------ | ---------- | ------- | --------------------------------- |
| `coopLocation`     | `Vector3i` | (0,0,0) | Posición del gallinero hogar      |
| `markedForDespawn` | boolean    | false   | Si la entidad debería desaparecer |

**Notas de uso:**

- Usado para pollos, animales de granja que regresan a estructuras
- Ubicación del gallinero para "casa" de búsqueda de caminos
- Marca de desaparición para limpieza cuando el gallinero es destruido

---

## Componentes del Sistema de Aparición

Componentes relacionados con la aparición de NPCs y entidades.

### SpawnSuppressionComponent

**Package:** `com.hypixel.hytale.server.spawning.suppression.component`

El `SpawnSuppressionComponent` marca una entidad como supresora de apariciones en un área (como antorchas previniendo aparición de mobs).

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

**Propiedades:**

| Propiedad          | Tipo   | Descripción                            |
| ------------------ | ------ | -------------------------------------- |
| `spawnSuppression` | String | ID del asset de supresión de aparición |

**Cómo usar:**

```java
// Añadir supresión de aparición a una entidad fuente de luz
SpawnSuppressionComponent suppression = new SpawnSuppressionComponent("hytale:torch_suppression");
holder.addComponent(SpawnSuppressionComponent.getComponentType(), suppression);
```

**Notas de uso:**

- Referencia un asset `SpawnSuppression` definiendo radio y condiciones
- Usado por antorchas, fogatas, y otras fuentes de luz
- Previene aparición de mobs hostiles en el área

---

## Componentes del Sistema NPC

### StepComponent

**Package:** `com.hypixel.hytale.server.npc.components`

El `StepComponent` controla la tasa de ticks para el procesamiento de IA de NPC, permitiendo actualizaciones más lentas para NPCs distantes o no importantes.

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

**Propiedades:**

| Propiedad    | Tipo  | Descripción                                    |
| ------------ | ----- | ---------------------------------------------- |
| `tickLength` | float | Tiempo entre actualizaciones de IA en segundos |

**Notas de uso:**

- Mayor longitud de tick = actualizaciones menos frecuentes = mejor rendimiento
- Los NPCs distantes pueden usar longitudes de tick más largas
- Inmutable una vez creado

---

### FailedSpawnComponent

**Package:** `com.hypixel.hytale.server.npc.components`

El `FailedSpawnComponent` es un componente marcador añadido cuando un NPC falla al aparecer correctamente. Usado para limpieza y depuración.

**Source file:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/FailedSpawnComponent.java`

```java
public class FailedSpawnComponent implements Component<EntityStore> {
   public static ComponentType<EntityStore, FailedSpawnComponent> getComponentType() {
      return NPCPlugin.get().getFailedSpawnComponentType();
   }
}
```

**Propiedades:**

- Ninguna (componente marcador)

**Notas de uso:**

- Los sistemas comprueban esto para limpiar apariciones fallidas
- Útil para depurar problemas de aparición

---

## Componentes de Utilidad

### SnapshotBuffer

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El componente `SnapshotBuffer` almacena datos históricos de posición/rotación para una entidad. Usado para compensación de lag y rebobinar estado de entidad.

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

**Propiedades:**

| Propiedad          | Tipo               | Descripción                                |
| ------------------ | ------------------ | ------------------------------------------ |
| `snapshots`        | `EntitySnapshot[]` | Buffer circular de instantáneas históricas |
| `currentTickIndex` | int                | Tick actual del servidor                   |
| `oldestTickIndex`  | int                | Tick de instantánea más antigua disponible |

**Cómo usar:**

```java
// Inicializar buffer para 20 ticks de historia
SnapshotBuffer buffer = new SnapshotBuffer();
buffer.resize(20);

// Almacenar instantánea cada tick
buffer.storeSnapshot(tickIndex, position, rotation);

// Recuperar posición histórica para compensación de lag
EntitySnapshot historical = buffer.getSnapshotClamped(tickIndex - playerLatencyTicks);
Vector3d pastPosition = historical.getPosition();
```

**Notas de uso:**

- Esencial para detección de golpes del lado del servidor con compensación de lag
- El buffer circular sobrescribe automáticamente las entradas más antiguas
- `getSnapshotClamped` devuelve la más antigua si el tick solicitado es demasiado viejo

---

### ApplyRandomSkinPersistedComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

El `ApplyRandomSkinPersistedComponent` es un componente marcador indicando que una entidad debería tener una skin aleatoria aplicada al cargar.

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

**Propiedades:**

- Ninguna (componente marcador, patrón singleton)

**Notas de uso:**

- Añadido a NPCs que deberían tener apariencias variadas
- Skin aplicada de un pool al cargar entidad
- Persistida para que la skin se mantenga consistente entre guardados

---

### PlacedByInteractionComponent

**Package:** `com.hypixel.hytale.server.core.modules.interaction.components`

El `PlacedByInteractionComponent` es un componente de chunk que rastrea quién colocó un bloque. Usado para permisos, propiedad y atribución.

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

**Propiedades:**

| Propiedad       | Tipo | Descripción                             |
| --------------- | ---- | --------------------------------------- |
| `whoPlacedUuid` | UUID | UUID de la entidad que colocó el bloque |

**Cómo usar:**

```java
// Cuando el jugador coloca bloque
PlacedByInteractionComponent placed = new PlacedByInteractionComponent(playerUuid);
chunkCommandBuffer.addComponent(blockRef, PlacedByInteractionComponent.getComponentType(), placed);

// Comprobar quién colocó un bloque
PlacedByInteractionComponent placed = chunkStore.getComponent(blockRef,
    PlacedByInteractionComponent.getComponentType());
if (placed != null) {
    UUID placer = placed.getWhoPlacedUuid();
}
```

**Notas de uso:**

- Almacenado en `ChunkStore` (componentes de bloque)
- Usado para sistemas de reclamo de tierras, protección contra griefing
- Persistido con datos de chunk

---

### AmbientEmitterComponent

**Package:** `com.hypixel.hytale.builtin.ambience.components`

El `AmbientEmitterComponent` hace que una entidad emita sonidos ambientales. Usado para audio ambiental como cascadas, viento o maquinaria.

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

**Propiedades:**

| Propiedad        | Tipo               | Descripción                           |
| ---------------- | ------------------ | ------------------------------------- |
| `soundEventId`   | String             | ID del evento de sonido a reproducir  |
| `spawnedEmitter` | `Ref<EntityStore>` | Referencia a entidad emisora generada |

**Cómo usar:**

```java
// Crear emisor de sonido ambiental
AmbientEmitterComponent ambient = new AmbientEmitterComponent();
ambient.setSoundEventId("hytale:waterfall_ambient");
holder.addComponent(AmbientEmitterComponent.getComponentType(), ambient);
```

**Notas de uso:**

- El sonido se reproduce en bucle en la posición de la entidad
- Usado para fuentes de audio ambiental estáticas
- Puede ser adjuntado a entidades de bloque o marcadores invisibles

---

### AmbienceTracker

**Package:** `com.hypixel.hytale.builtin.ambience.components`

El componente `AmbienceTracker` rastrea música ambiental por jugador y sincroniza con el cliente. Maneja anulaciones de música forzadas y cambios de música basados en entorno.

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

**Propiedades:**

| Propiedad          | Tipo                   | Descripción                                               |
| ------------------ | ---------------------- | --------------------------------------------------------- |
| `forcedMusicIndex` | int                    | Índice de anulación de música forzada (0 = sin anulación) |
| `musicPacket`      | UpdateEnvironmentMusic | Paquete reutilizable para sincronización de red           |

**Notas de uso:**

- Adjuntado a jugadores para rastrear su estado actual de música
- Índice de música forzada anula selección basada en entorno
- La música cambia suavemente basada en el entorno del jugador

---

### WeatherTracker

**Package:** `com.hypixel.hytale.builtin.weather.components`

El componente `WeatherTracker` rastrea el estado del clima por jugador y sincroniza transiciones de clima con el cliente basado en el entorno.

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

**Propiedades:**

| Propiedad               | Tipo     | Descripción                                                 |
| ----------------------- | -------- | ----------------------------------------------------------- |
| `environmentId`         | int      | ID de entorno actual para búsqueda de clima                 |
| `previousBlockPosition` | Vector3i | Última posición de bloque conocida para detección de cambio |
| `firstSendForWorld`     | boolean  | Bandera para sincronización de clima inicial del mundo      |

**Notas de uso:**

- El clima se actualiza cuando el jugador se mueve a un entorno diferente
- Transiciones suaves con duración configurable
- Soporta anulación forzada de clima vía WeatherResource

---

### TeleportHistory

**Package:** `com.hypixel.hytale.builtin.teleport.components`

El componente `TeleportHistory` mantiene un historial de navegación atrás/adelante tipo navegador para teletransportes de jugador. Soporta nombrado de waypoints y teletransportación entre mundos.

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

**Propiedades:**

| Propiedad | Tipo              | Descripción                                        |
| --------- | ----------------- | -------------------------------------------------- |
| `back`    | `Deque<Waypoint>` | Pila de ubicaciones anteriores                     |
| `forward` | `Deque<Waypoint>` | Pila de ubicaciones adelante (después de ir atrás) |

**Cómo usar:**

```java
// Grabar posición actual antes de teleport
TeleportHistory history = store.getComponent(playerRef, TeleportHistory.getComponentType());
history.append(world, currentPos, currentRotation, "Waypoint Nombrado");

// Ir atrás en historial
history.back(playerRef, 1);  // Ir atrás 1 paso

// Ir adelante en historial
history.forward(playerRef, 1);  // Ir adelante 1 paso
```

**Notas de uso:**

- Máximo 100 entradas en historial (la más antigua eliminada cuando se excede)
- Historial adelante limpiado cuando se añaden nuevos waypoints
- Soporta navegación entre mundos
- Muestra mensajes localizados para retroalimentación de teletransporte

---

### PortalDevice

**Package:** `com.hypixel.hytale.builtin.portals.components`

El `PortalDevice` es un componente de chunk que almacena configuración de bloque de portal. Enlaza portales a mundos de destino y define apariencia de portal.

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

**Propiedades:**

| Propiedad              | Tipo               | Descripción                                   |
| ---------------------- | ------------------ | --------------------------------------------- |
| `config`               | PortalDeviceConfig | Configuración de comportamiento de portal     |
| `baseBlockTypeKey`     | String             | ID de tipo de bloque para el marco del portal |
| `destinationWorldUuid` | UUID               | Mundo objetivo para teletransportación        |

**Notas de uso:**

- Almacenado en `ChunkStore` (componentes de bloque)
- Persistido con datos de mundo
- Funciona con PortalDeviceConfig para personalización de comportamiento

---

### Teleporter

**Package:** `com.hypixel.hytale.builtin.adventure.teleporter.component`

El `Teleporter` es un componente de chunk para bloques teletransportadores. Soporta destino vía coordenadas, nombres de warp, o transformaciones relativas.

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

| Propiedad             | Tipo      | Descripción                                         |
| --------------------- | --------- | --------------------------------------------------- |
| `worldUuid`           | UUID      | Mundo objetivo (null = mismo mundo)                 |
| `transform`           | Transform | Posición/rotación objetivo                          |
| `relativeMask`        | byte      | Banderas de bit para modos de coordenadas relativas |
| `warp`                | String    | Punto warp nombrado (alternativa a coordenadas)     |
| `warpNameWordListKey` | String    | Lista de palabras para nombres de warp aleatorios   |

**Notas de uso:**

- Soporta teletransportación tanto absoluta como relativa
- Puede usar warps nombrados en lugar de coordenadas
- Máscara relativa permite mezclar ejes absolutos y relativos

---

### PlayerSomnolence

**Package:** `com.hypixel.hytale.builtin.beds.sleep.components`

El componente `PlayerSomnolence` rastrea el estado de sueño de un jugador. Usado por el sistema de camas para gestionar la progresión del sueño.

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

**Propiedades:**

| Propiedad | Tipo        | Descripción                                                             |
| --------- | ----------- | ----------------------------------------------------------------------- |
| `state`   | PlayerSleep | Estado de sueño actual (despierto, durmiéndose, durmiendo, despertando) |

**Notas de uso:**

- Máquina de estados para progresión de sueño
- Instancia AWAKE compartida para estado por defecto
- Funciona con SleepTracker para sincronización de red

---

### SleepTracker

**Package:** `com.hypixel.hytale.builtin.beds.sleep.components`

El componente `SleepTracker` maneja la sincronización de red del estado de sueño. Previene envíos de paquetes duplicados.

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

**Propiedades:**

| Propiedad        | Tipo             | Descripción                                            |
| ---------------- | ---------------- | ------------------------------------------------------ |
| `lastSentPacket` | UpdateSleepState | Caché de último estado enviado para detección de delta |

**Notas de uso:**

- Optimiza tráfico de red enviando solo estados cambiados
- Funciona con PlayerSomnolence para lógica de sueño
- Devuelve null si el estado no ha cambiado

---

### VoidEvent

**Package:** `com.hypixel.hytale.builtin.portals.components.voidevent`

El componente `VoidEvent` gestiona eventos de invasión de portal de vacío. Rastrea posiciones de generadores y etapa actual de invasión.

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

**Propiedades:**

| Propiedad      | Tipo            | Descripción                                  |
| -------------- | --------------- | -------------------------------------------- |
| `voidSpawners` | SpatialHashGrid | Índice espacial de posiciones de generadores |
| `activeStage`  | VoidEventStage  | Etapa de invasión actual (null = inactiva)   |

**Notas de uso:**

- Mínimo 62 bloques entre generadores
- Las etapas definen dificultad de invasión creciente
- Configuración cargada desde config de jugabilidad del mundo

---

### VoidSpawner

**Package:** `com.hypixel.hytale.builtin.portals.components.voidevent`

El componente `VoidSpawner` marca una entidad como generador de portal de vacío. Rastrea UUIDs de balizas de aparición asociadas.

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

**Propiedades:**

| Propiedad          | Tipo         | Descripción                             |
| ------------------ | ------------ | --------------------------------------- |
| `spawnBeaconUuids` | `List<UUID>` | UUIDs de balizas de aparición asociadas |

**Notas de uso:**

- Parte del sistema de invasión de vacío
- Balizas de aparición determinan qué enemigos aparecen
- Funciona con VoidEvent para gestión de invasión

---

### PlayerMemories

**Package:** `com.hypixel.hytale.builtin.adventure.memories.component`

El componente `PlayerMemories` almacena recuerdos de aventura recolectados por jugadores. Los recuerdos se usan para progresión y desbloquear contenido.

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

**Propiedades:**

| Propiedad          | Tipo          | Descripción                |
| ------------------ | ------------- | -------------------------- |
| `memories`         | `Set<Memory>` | Recuerdos recolectados     |
| `memoriesCapacity` | int           | Número máximo de recuerdos |

**Cómo usar:**

```java
PlayerMemories memories = store.getComponent(playerRef, PlayerMemories.getComponentType());
if (memories.recordMemory(newMemory)) {
    // Memory recorded successfully
}

// Transferir recuerdos a otro contenedor
Set<Memory> collected = new HashSet<>();
memories.takeMemories(collected);  // Elimina del componente
```

**Notas de uso:**

- La capacidad limita cuántos recuerdos pueden ser mantenidos
- Grabar falla si está en capacidad máxima
- `takeMemories` elimina recuerdos mientras los devuelve
- Persistido con datos del jugador

---

### ParkourCheckpoint

**Package:** `com.hypixel.hytale.builtin.parkour`

El componente `ParkourCheckpoint` rastrea el progreso de un jugador a través de un curso de parkour almacenando el índice de checkpoint actual.

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

**Propiedades:**

| Propiedad | Tipo | Descripción                          |
| --------- | ---- | ------------------------------------ |
| `index`   | int  | Índice de checkpoint actual (base-0) |

**Notas de uso:**

- Adjuntado a jugadores durante cursos de parkour
- El índice incrementa conforme se alcanzan checkpoints
- Usado para determinación de punto de reaparición
- Persistido para reanudación de curso

---

### CraftingManager

**Package:** `com.hypixel.hytale.builtin.crafting.component`

El componente `CraftingManager` gestiona operaciones de creación para jugadores. Maneja trabajos de creación en cola, mejoras de nivel de mesa, y consumo de materiales.

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

**Propiedades:**

| Propiedad            | Tipo                         | Descripción                             |
| -------------------- | ---------------------------- | --------------------------------------- |
| `queuedCraftingJobs` | `BlockingQueue<CraftingJob>` | Cola de creaciones pendientes           |
| `upgradingJob`       | BenchUpgradingJob            | Mejora de mesa actual (null si ninguna) |
| `x, y, z`            | int                          | Posición de bloque de mesa actual       |
| `blockType`          | BlockType                    | Tipo de bloque de mesa actual           |

**Cómo usar:**

```java
CraftingManager crafting = store.getComponent(playerRef, CraftingManager.getComponentType());

// Establecer mesa activa
crafting.setBench(x, y, z, benchBlockType);

// Encolar receta de creación
crafting.queueCraft(ref, store, window, transactionId, recipe, quantity, inputContainer, InputRemovalType.NORMAL);

// Tick para procesar cola (llamado cada frame)
crafting.tick(ref, store, deltaTime);

// Limpiar al cerrar mesa
crafting.clearBench(ref, store);
```

**Notas de uso:**

- Solo una mesa puede estar activa a la vez
- Soporta creación con tiempo con rastreo de progreso
- El nivel de la mesa afecta la velocidad de creación
- Materiales tomados de cofres cercanos automáticamente
- Cancelación devuelve materiales en progreso

---

### DisplayNameComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

El `DisplayNameComponent` almacena un nombre de visualización personalizado para entidades. Usado para placas de nombre y visualización UI.

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

**Propiedades:**

| Propiedad     | Tipo    | Descripción                         |
| ------------- | ------- | ----------------------------------- |
| `displayName` | Message | Nombre de visualización localizable |

**Notas de uso:**

- Soporta mensajes localizados con traducciones
- Separado del nombre de tipo de entidad
- Usado por componente Nameplate para renderizado
- Puede incluir formato y parámetros

---

### Repulsion

**Package:** `com.hypixel.hytale.server.core.modules.entity.repulsion`

El componente `Repulsion` define cómo las entidades se empujan entre sí. Usado para física de multitudes y evasión de colisiones.

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

**Propiedades:**

| Propiedad              | Tipo    | Descripción                      |
| ---------------------- | ------- | -------------------------------- |
| `repulsionConfigIndex` | int     | Índice en asset RepulsionConfig  |
| `isNetworkOutdated`    | boolean | Bandera sucia para sincro de red |

**Notas de uso:**

- RepulsionConfig define fuerza y radio
- Funciona con sistema de física para colisiones suaves
- Previene apilamiento/superposición de entidades
- Bandera de red optimiza frecuencia de sincronización

---

### Flock

**Package:** `com.hypixel.hytale.server.flock`

El componente `Flock` representa un grupo de NPCs que coordinan comportamiento. Rastrea datos de daño de grupo y liderazgo.

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

**Propiedades:**

| Propiedad           | Tipo                | Descripción                                  |
| ------------------- | ------------------- | -------------------------------------------- |
| `flockData`         | PersistentFlockData | Configuración de manada persistente y estado |
| `currentDamageData` | DamageData          | Daño recibido este tick                      |
| `removedStatus`     | FlockRemovedStatus  | Estado de disolución                         |
| `trace`             | boolean             | Bandera de rastreo de depuración             |

**Notas de uso:**

- Adjuntado a una entidad "líder" de manada
- Los miembros referencian la manada vía FlockMembership
- Datos de daño con doble buffer para seguridad de hilos
- Soporta herencia de líder cuando el líder muere

---

### FlockMembership

**Package:** `com.hypixel.hytale.server.flock`

El componente `FlockMembership` vincula una entidad a su manada. Rastrea tipo de membresía (miembro, líder, líder interino).

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

**Propiedades:**

| Propiedad        | Tipo               | Descripción                              |
| ---------------- | ------------------ | ---------------------------------------- |
| `flockId`        | UUID               | Identificador de manada persistente      |
| `membershipType` | Type               | Rol dentro de la manada                  |
| `flockRef`       | `Ref<EntityStore>` | Referencia de ejecución a entidad manada |

**Notas de uso:**

- `flockRef` es solo de ejecución, no persistido
- Múltiples miembros pueden actuar como líder (interino)
- Estado JOINING para miembros recién añadidos
- Persistido vía flockId para guardar/cargar

---

### TargetMemory

**Package:** `com.hypixel.hytale.builtin.npccombatactionevaluator.memory`

El componente `TargetMemory` rastrea la conciencia de los NPCs de entidades amistosas y hostiles. Usado por evaluación de combate de IA.

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

**Propiedades:**

| Propiedad         | Tipo                 | Descripción                                    |
| ----------------- | -------------------- | ---------------------------------------------- |
| `knownFriendlies` | Int2FloatOpenHashMap | Mapeo ID entidad a tiempo visto por última vez |
| `knownHostiles`   | Int2FloatOpenHashMap | Mapeo ID entidad a tiempo visto por última vez |
| `closestHostile`  | `Ref<EntityStore>`   | Hostil más cercano en caché                    |
| `rememberFor`     | float                | Duración de memoria en segundos                |

**Notas de uso:**

- Mapas hash almacenan IDs de entidad con marcas de tiempo
- Listas mantienen referencias ordenadas para iteración
- Memoria decae basada en duración rememberFor
- Hostil más cercano en caché para decisiones rápidas de IA

---

### DamageMemory

**Package:** `com.hypixel.hytale.builtin.npccombatactionevaluator.memory`

El componente `DamageMemory` rastrea daño recibido por un NPC. Usado para toma de decisiones de IA como huir o volverse agresivo.

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

**Propiedades:**

| Propiedad           | Tipo  | Descripción                                              |
| ------------------- | ----- | -------------------------------------------------------- |
| `recentDamage`      | float | Daño recibido recientemente (se reinicia periódicamente) |
| `totalCombatDamage` | float | Daño total desde inicio de combate                       |

**Notas de uso:**

- Daño reciente usado para reacciones inmediatas
- Daño total usado para decisiones estratégicas (huir si muy dañado)
- Métodos de limpieza para transiciones de estado de combate
- Funciona con evaluadores de IA de combate

---

### Timers

**Package:** `com.hypixel.hytale.server.npc.components`

El componente `Timers` mantiene un array de temporizadores tickeables para comportamiento de NPC. Usado por árboles de comportamiento para acciones retardadas.

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

**Propiedades:**

| Propiedad | Tipo       | Descripción            |
| --------- | ---------- | ---------------------- |
| `timers`  | Tickable[] | Array de objetos timer |

**Notas de uso:**

- Tamãno de array fijo basado en definición de NPC
- Timers tickeados cada frame
- Usado para enfriamientos, retrasos, acciones periódicas
- Parte del sistema de árbol de comportamiento de NPC

---

### ChunkSpawnData

**Package:** `com.hypixel.hytale.server.spawning.world.component`

El `ChunkSpawnData` es un componente de chunk que rastrea estado de aparición por chunk. Gestiona enfriamientos de aparición y datos de aparición específicos por entorno.

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

**Propiedades:**

| Propiedad                      | Tipo          | Descripción                          |
| ------------------------------ | ------------- | ------------------------------------ |
| `chunkEnvironmentSpawnDataMap` | Int2ObjectMap | ID de entorno a datos de aparición   |
| `started`                      | boolean       | Si la aparición ha sido inicializada |
| `lastSpawn`                    | long          | Marca de tiempo de última aparición  |

**Notas de uso:**

- Almacenado en `ChunkStore` (datos a nivel de chunk)
- Diferentes entornos tienen rastreo de aparición separado
- Cooldown prevents spawn spam
- Initialized lazily when chunk first activates
