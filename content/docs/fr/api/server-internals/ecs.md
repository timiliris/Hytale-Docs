---
id: ecs
title: Systeme ECS (Entity Component System)
sidebar_label: ECS
sidebar_position: 6
description: Documentation complete du systeme ECS du serveur Hytale
---

# Entity Component System (ECS)

:::info Documentation v2 - Vérifiée
Cette documentation a été vérifiée par rapport au code source décompilé du serveur en utilisant une analyse multi-agent. Toutes les informations incluent des références aux fichiers sources.
:::

## Qu'est-ce qu'un ECS ?

Un **Entity Component System** est un pattern d'architecture logicielle couramment utilise dans le developpement de jeux. Il est fondamentalement different de la programmation orientee objet traditionnelle et offre des avantages significatifs en termes de performance et de flexibilite.

### Le probleme avec la POO traditionnelle

En programmation orientee objet traditionnelle, vous pourriez creer une hierarchie de classes comme ceci :

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

Cela semble logique, mais des problemes apparaissent rapidement :
- Que faire si un Player peut devenir un Vehicle (comme une monture) ?
- Que faire si un Item a besoin de points de vie et peut etre attaque ?
- Ajouter de nouveaux comportements necessite de modifier la hierarchie de classes

### La solution ECS

L'ECS decompose tout en trois concepts simples :

| Concept | Ce que c'est | Exemple |
|---------|--------------|---------|
| **Entity** | Juste un numero d'ID | Entite #42 |
| **Component** | Donnees pures attachees aux entites | `Position(x: 10, y: 5, z: 20)`, `Health(current: 80, max: 100)` |
| **System** | Logique qui traite les entites avec des composants specifiques | "A chaque tick, reduire la faim des entites avec le composant Hunger" |

**Pensez-y comme un tableur :**

| ID Entite | Position | Vie | Inventaire | IA | Joueur |
|-----------|----------|-----|------------|----|----|
| 1 | (10, 5, 20) | 100/100 | 64 items | - | Oui |
| 2 | (50, 10, 30) | 50/80 | - | Hostile | - |
| 3 | (0, 0, 0) | - | 10 items | - | - |

- Entite 1 est un Joueur avec position, vie et inventaire
- Entite 2 est un Ennemi avec position, vie et IA
- Entite 3 est un Coffre avec juste position et inventaire

### Pourquoi Hytale utilise l'ECS

1. **Performance** : Les entites avec les memes composants sont stockees ensemble en memoire (favorable au cache)
2. **Flexibilite** : Ajouter/supprimer des comportements a l'execution en ajoutant/supprimant des composants
3. **Parallelisation** : Les systemes peuvent s'executer sur differents coeurs CPU simultanement
4. **Modularite** : Les systemes sont independants et peuvent etre ajoutes/supprimes facilement

### Analogie du monde reel

Imaginez que vous organisez une fete et que vous suivez les invites :

- **Approche POO** : Creer differentes classes pour "Invite VIP", "Invite Regulier", "Staff", etc. Que faire pour un VIP qui est aussi Staff ?
- **Approche ECS** : Chaque personne (entite) a des tags/composants : "ABadgeVIP", "EstStaff", "BesoinParking", etc. Vous pouvez melanger librement.

---

## Implementation ECS d'Hytale

Cette documentation decrit le systeme ECS (Entity Component System) utilise par le serveur Hytale. Ce systeme est responsable de la gestion des entites, de leurs composants et des systemes qui les traitent.

## Architecture Generale

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
|  | ArchetypeChunk  |  | ArchetypeChunk  |  | ArchetypeChunk  |  (groupes entites)  |
|  | [Entity,Entity] |  | [Entity,Entity] |  | [Entity,Entity] |                     |
|  +-----------------+  +-----------------+  +-----------------+                     |
|                                                                                    |
|  +-----------------+  +-----------------+  +-----------------+                     |
|  |    Resource     |  |    Resource     |  |    Resource     |  (donnees globales) |
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

## Concepts Fondamentaux

### 1. Component

Un `Component` est une unite de donnees attachee a une entite. Il ne contient pas de logique, seulement des donnees.

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

**Exemple de composant simple:**

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

Le `ComponentType` est un identifiant unique pour un type de composant dans le registre.

```java
public class ComponentType<ECS_TYPE, T extends Component<ECS_TYPE>>
    implements Comparable<ComponentType<ECS_TYPE, ?>>, Query<ECS_TYPE> {

    private ComponentRegistry<ECS_TYPE> registry;
    private Class<? super T> tClass;
    private int index;  // Index unique dans le registre

    public int getIndex() { return this.index; }
    public Class<? super T> getTypeClass() { return this.tClass; }
}
```

### 3. Archetype

Un `Archetype` represente un ensemble unique de types de composants. Toutes les entites partageant le meme archetype sont stockees ensemble pour optimiser les performances.

```java
public class Archetype<ECS_TYPE> implements Query<ECS_TYPE> {
    private final int minIndex;
    private final int count;
    private final ComponentType<ECS_TYPE, ?>[] componentTypes;

    // Creer un archetype
    public static <ECS_TYPE> Archetype<ECS_TYPE> of(ComponentType<ECS_TYPE, ?>... componentTypes);

    // Ajouter un composant a l'archetype
    public static <ECS_TYPE, T extends Component<ECS_TYPE>> Archetype<ECS_TYPE> add(
        Archetype<ECS_TYPE> archetype, ComponentType<ECS_TYPE, T> componentType);

    // Supprimer un composant de l'archetype
    public static <ECS_TYPE, T extends Component<ECS_TYPE>> Archetype<ECS_TYPE> remove(
        Archetype<ECS_TYPE> archetype, ComponentType<ECS_TYPE, T> componentType);

    // Verifier si l'archetype contient un type de composant
    public boolean contains(ComponentType<ECS_TYPE, ?> componentType);
}
```

### 4. ArchetypeChunk

Un `ArchetypeChunk` stocke toutes les entites qui partagent le meme archetype. C'est une structure de donnees optimisee pour l'acces cache.

```java
public class ArchetypeChunk<ECS_TYPE> {
    protected final Store<ECS_TYPE> store;
    protected final Archetype<ECS_TYPE> archetype;
    protected int entitiesSize;
    protected Ref<ECS_TYPE>[] refs;           // References aux entites
    protected Component<ECS_TYPE>[][] components;  // Donnees des composants

    // Obtenir un composant pour une entite a un index donne
    public <T extends Component<ECS_TYPE>> T getComponent(
        int index, ComponentType<ECS_TYPE, T> componentType);

    // Definir un composant
    public <T extends Component<ECS_TYPE>> void setComponent(
        int index, ComponentType<ECS_TYPE, T> componentType, T component);

    // Ajouter une entite
    public int addEntity(Ref<ECS_TYPE> ref, Holder<ECS_TYPE> holder);

    // Supprimer une entite
    public Holder<ECS_TYPE> removeEntity(int entityIndex, Holder<ECS_TYPE> target);
}
```

### 5. Holder (EntityHolder)

Le `Holder` est un conteneur temporaire pour les composants d'une entite avant qu'elle ne soit ajoutee au Store.

```java
public class Holder<ECS_TYPE> {
    private Archetype<ECS_TYPE> archetype;
    private Component<ECS_TYPE>[] components;

    // Ajouter un composant
    public <T extends Component<ECS_TYPE>> void addComponent(
        ComponentType<ECS_TYPE, T> componentType, T component);

    // Obtenir un composant
    public <T extends Component<ECS_TYPE>> T getComponent(
        ComponentType<ECS_TYPE, T> componentType);

    // Supprimer un composant
    public <T extends Component<ECS_TYPE>> void removeComponent(
        ComponentType<ECS_TYPE, T> componentType);

    // S'assurer qu'un composant existe (le creer si absent)
    public <T extends Component<ECS_TYPE>> void ensureComponent(
        ComponentType<ECS_TYPE, T> componentType);
}
```

### 6. Ref (Entity Reference)

`Ref` est une reference a une entite dans le Store. Elle contient l'index de l'entite et peut etre invalidee.

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

Le `Store` est le conteneur principal qui gere toutes les entites et leurs composants.

```java
public class Store<ECS_TYPE> implements ComponentAccessor<ECS_TYPE> {
    private final ComponentRegistry<ECS_TYPE> registry;
    private final ECS_TYPE externalData;
    private Ref<ECS_TYPE>[] refs;
    private ArchetypeChunk<ECS_TYPE>[] archetypeChunks;
    private Resource<ECS_TYPE>[] resources;

    // Ajouter une entite
    public Ref<ECS_TYPE> addEntity(Holder<ECS_TYPE> holder, AddReason reason);

    // Supprimer une entite (retourne les composants de l'entite dans le holder)
    public Holder<ECS_TYPE> removeEntity(Ref<ECS_TYPE> ref, RemoveReason reason);

    // Supprimer une entite avec holder cible
    public Holder<ECS_TYPE> removeEntity(Ref<ECS_TYPE> ref, Holder<ECS_TYPE> holder, RemoveReason reason);

    // Obtenir un composant
    public <T extends Component<ECS_TYPE>> T getComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Obtenir l'archetype d'une entite
    public Archetype<ECS_TYPE> getArchetype(Ref<ECS_TYPE> ref);

    // Obtenir une ressource globale
    public <T extends Resource<ECS_TYPE>> T getResource(ResourceType<ECS_TYPE, T> resourceType);
}
```

### 8. Resource

Une `Resource` est une donnee globale partagee par tout le Store (contrairement aux Components qui sont par entite).

```java
public interface Resource<ECS_TYPE> extends Cloneable {
    Resource<ECS_TYPE> clone();
}
```

---

## ComponentRegistry

Le `ComponentRegistry` est le registre central qui gere tous les types de composants, systemes et ressources.

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
|  Systems (tries par dependance):                                  |
|  +------------------+  +------------------+  +------------------+ |
|  | System[0]        |  | System[1]        |  | System[2]        | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
```

### Enregistrement des Composants

```java
// Composant sans serialisation
ComponentType<EntityStore, MyComponent> MY_COMPONENT =
    registry.registerComponent(MyComponent.class, MyComponent::new);

// Composant avec serialisation (Codec)
ComponentType<EntityStore, TransformComponent> TRANSFORM =
    registry.registerComponent(TransformComponent.class, "Transform", TransformComponent.CODEC);
```

### Enregistrement des Resources

```java
// Resource sans serialisation
ResourceType<EntityStore, MyResource> MY_RESOURCE =
    registry.registerResource(MyResource.class, MyResource::new);

// Resource avec serialisation
ResourceType<EntityStore, MyResource> MY_RESOURCE =
    registry.registerResource(MyResource.class, "MyResource", MyResource.CODEC);
```

### Composants Built-in Speciaux

```java
// Marque une entite comme ne devant pas etre tickee
ComponentType<ECS_TYPE, NonTicking<ECS_TYPE>> nonTickingComponentType;

// Marque une entite comme ne devant pas etre serialisee
ComponentType<ECS_TYPE, NonSerialized<ECS_TYPE>> nonSerializedComponentType;

// Stocke les composants inconnus lors de la deserialisation
ComponentType<ECS_TYPE, UnknownComponents<ECS_TYPE>> unknownComponentType;
```

---

## Creer un Composant Personnalise

### Etape 1: Definir la classe du composant

```java
public class HealthComponent implements Component<EntityStore> {

    // Codec pour la serialisation
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

    // Getters et setters
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

    // OBLIGATOIRE: Implementation de clone()
    @Override
    public Component<EntityStore> clone() {
        return new HealthComponent(this.maxHealth, this.currentHealth);
    }
}
```

### Etape 2: Enregistrer le composant

```java
// Dans votre module ou systeme d'initialisation
public class MyModule {
    private static ComponentType<EntityStore, HealthComponent> HEALTH_COMPONENT_TYPE;

    public static void init(ComponentRegistry<EntityStore> registry) {
        // Enregistrement avec serialisation
        HEALTH_COMPONENT_TYPE = registry.registerComponent(
            HealthComponent.class,
            "Health",           // ID unique pour la serialisation
            HealthComponent.CODEC
        );
    }

    public static ComponentType<EntityStore, HealthComponent> getHealthComponentType() {
        return HEALTH_COMPONENT_TYPE;
    }
}
```

### Etape 3: Utiliser le composant

```java
// Creer une entite avec le composant
Holder<EntityStore> holder = registry.newHolder();
holder.addComponent(MyModule.getHealthComponentType(), new HealthComponent(100, 100));
Ref<EntityStore> entityRef = store.addEntity(holder, AddReason.SPAWN);

// Acceder au composant
HealthComponent health = store.getComponent(entityRef, MyModule.getHealthComponentType());
health.damage(25);

// Verifier si l'entite a le composant
Archetype<EntityStore> archetype = store.getArchetype(entityRef);
if (archetype.contains(MyModule.getHealthComponentType())) {
    // L'entite a un composant Health
}
```

---

## Systeme de Queries

Les Queries permettent de filtrer les entites en fonction de leurs composants.

### Interface Query

```java
public interface Query<ECS_TYPE> {
    // Teste si un archetype correspond a la query
    boolean test(Archetype<ECS_TYPE> archetype);

    // Verifie si la query depend d'un type de composant specifique
    boolean requiresComponentType(ComponentType<ECS_TYPE, ?> componentType);

    // Methodes de creation (factory methods)
    static <ECS_TYPE> AnyQuery<ECS_TYPE> any();           // Correspond a tout
    static <ECS_TYPE> NotQuery<ECS_TYPE> not(Query<ECS_TYPE> query);  // Negation
    static <ECS_TYPE> AndQuery<ECS_TYPE> and(Query<ECS_TYPE>... queries);  // ET logique
    static <ECS_TYPE> OrQuery<ECS_TYPE> or(Query<ECS_TYPE>... queries);   // OU logique
}
```

### Types de Queries

```
Query (interface)
  |
  +-- Archetype (un archetype est aussi une query)
  |
  +-- ComponentType (un ComponentType est aussi une query)
  |
  +-- AnyQuery (correspond a tout)
  |
  +-- NotQuery (negation)
  |
  +-- AndQuery (ET logique)
  |
  +-- OrQuery (OU logique)
  |
  +-- ExactArchetypeQuery (archetype exact)
  |
  +-- ReadWriteArchetypeQuery (interface)
       |
       +-- ReadWriteQuery (implementation)
```

### ReadWriteQuery

La `ReadWriteQuery` distingue les composants en lecture seule des composants modifies.

```java
public class ReadWriteQuery<ECS_TYPE> implements ReadWriteArchetypeQuery<ECS_TYPE> {
    private final Archetype<ECS_TYPE> read;   // Composants lus
    private final Archetype<ECS_TYPE> write;  // Composants modifies

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

### Exemples d'utilisation

```java
// Query simple: toutes les entites avec TransformComponent
Query<EntityStore> hasTransform = TransformComponent.getComponentType();

// Query combinee: entites avec Transform ET Health
Query<EntityStore> query = Query.and(
    TransformComponent.getComponentType(),
    MyModule.getHealthComponentType()
);

// Query avec negation: entites avec Transform mais SANS Health
Query<EntityStore> query = Query.and(
    TransformComponent.getComponentType(),
    Query.not(MyModule.getHealthComponentType())
);

// Archetype comme query
Archetype<EntityStore> archetype = Archetype.of(
    TransformComponent.getComponentType(),
    BoundingBox.getComponentType()
);
// Teste si une entite a AU MOINS ces composants

// ReadWriteQuery pour un systeme qui lit Transform et modifie Health
ReadWriteQuery<EntityStore> query = new ReadWriteQuery<>(
    Archetype.of(TransformComponent.getComponentType()),  // Lecture
    Archetype.of(MyModule.getHealthComponentType())       // Ecriture
);
```

---

## Systems et SystemGroups

### Hierarchie des Systems

```
ISystem (interface)
  |
  +-- System (classe de base abstraite)
       |
       +-- QuerySystem (interface) - systemes qui filtrent par archetype
       |    |
       |    +-- RefSystem - callback sur ajout/suppression d'entites
       |    |
       |    +-- HolderSystem - callback sur holder avant ajout
       |    |
       |    +-- TickingSystem
       |         |
       |         +-- ArchetypeTickingSystem
       |              |
       |              +-- EntityTickingSystem
       |
       +-- EventSystem
            |
            +-- EntityEventSystem - evenements sur entites
            |
            +-- WorldEventSystem - evenements globaux
```

### ISystem

Interface de base pour tous les systemes.

```java
public interface ISystem<ECS_TYPE> {
    // Callbacks de cycle de vie
    default void onSystemRegistered() {}
    default void onSystemUnregistered() {}

    // Groupe auquel appartient ce systeme
    default SystemGroup<ECS_TYPE> getGroup() { return null; }

    // Dependances pour l'ordre d'execution
    default Set<Dependency<ECS_TYPE>> getDependencies() {
        return Collections.emptySet();
    }
}
```

### System (classe de base)

```java
public abstract class System<ECS_TYPE> implements ISystem<ECS_TYPE> {

    // Enregistrer un composant lie a ce systeme
    protected <T extends Component<ECS_TYPE>> ComponentType<ECS_TYPE, T> registerComponent(
        Class<? super T> tClass, Supplier<T> supplier);

    protected <T extends Component<ECS_TYPE>> ComponentType<ECS_TYPE, T> registerComponent(
        Class<? super T> tClass, String id, BuilderCodec<T> codec);

    // Enregistrer une resource liee a ce systeme
    public <T extends Resource<ECS_TYPE>> ResourceType<ECS_TYPE, T> registerResource(
        Class<? super T> tClass, Supplier<T> supplier);
}
```

### TickingSystem

Systeme execute a chaque tick.

```java
public abstract class TickingSystem<ECS_TYPE> extends System<ECS_TYPE>
    implements TickableSystem<ECS_TYPE> {

    // dt = delta time (temps ecoule), systemIndex = index du systeme
    public abstract void tick(float dt, int systemIndex, Store<ECS_TYPE> store);
}
```

### ArchetypeTickingSystem

Systeme tick qui filtre par archetype.

```java
public abstract class ArchetypeTickingSystem<ECS_TYPE> extends TickingSystem<ECS_TYPE>
    implements QuerySystem<ECS_TYPE> {

    // Query pour filtrer les entites
    public abstract Query<ECS_TYPE> getQuery();

    // Tick sur chaque ArchetypeChunk correspondant
    public abstract void tick(
        float dt,
        ArchetypeChunk<ECS_TYPE> archetypeChunk,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );
}
```

### EntityTickingSystem

Systeme tick qui itere sur chaque entite.

```java
public abstract class EntityTickingSystem<ECS_TYPE> extends ArchetypeTickingSystem<ECS_TYPE> {

    // Tick sur une entite specifique
    public abstract void tick(
        float dt,
        int index,                         // Index dans l'ArchetypeChunk
        ArchetypeChunk<ECS_TYPE> archetypeChunk,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );

    // Support du parallelisme
    public boolean isParallel(int archetypeChunkSize, int taskCount) {
        return false;
    }
}
```

### RefSystem

Systeme qui reagit a l'ajout/suppression d'entites.

```java
public abstract class RefSystem<ECS_TYPE> extends System<ECS_TYPE>
    implements QuerySystem<ECS_TYPE> {

    // Query pour filtrer les entites concernees
    public abstract Query<ECS_TYPE> getQuery();

    // Appele quand une entite correspondant a la query est ajoutee
    public abstract void onEntityAdded(
        Ref<ECS_TYPE> ref,
        AddReason reason,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );

    // Appele quand une entite correspondant a la query est supprimee
    public abstract void onEntityRemove(
        Ref<ECS_TYPE> ref,
        RemoveReason reason,
        Store<ECS_TYPE> store,
        CommandBuffer<ECS_TYPE> commandBuffer
    );
}
```

### SystemGroup

Groupe de systemes pour organiser l'ordre d'execution.

```java
public class SystemGroup<ECS_TYPE> {
    private final ComponentRegistry<ECS_TYPE> registry;
    private final int index;
    private final Set<Dependency<ECS_TYPE>> dependencies;
}
```

### Dependencies (Ordre d'execution)

```java
public enum Order {
    BEFORE,  // Execute avant la dependance
    AFTER    // Execute apres la dependance
}

public abstract class Dependency<ECS_TYPE> {
    protected final Order order;
    protected final int priority;

    public Dependency(Order order, int priority);
    public Dependency(Order order, OrderPriority priority);
}

// Types de dependances
// - SystemDependency: dependance sur un systeme specifique
// - SystemTypeDependency: dependance sur un type de systeme
// - SystemGroupDependency: dependance sur un groupe de systemes
// - RootDependency: dependance racine
```

---

## Exemple Complet: Creer un System

```java
public class HealthRegenSystem extends EntityTickingSystem<EntityStore> {

    private static ComponentType<EntityStore, HealthComponent> HEALTH;

    // Query: entites avec Health
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
        // Executer apres le systeme de dommages
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
        // Obtenir le composant Health pour cette entite
        HealthComponent health = chunk.getComponent(index, HEALTH);

        // Regenerer 1 HP par seconde
        if (!health.isDead()) {
            health.heal(dt * 1.0f);
        }
    }
}
```

---

## Entites: Entity, LivingEntity, Player

### Hierarchie des Entites

```
Component<EntityStore> (interface)
  |
  +-- Entity (abstraite)
       |
       +-- LivingEntity (abstraite)
       |    |
       |    +-- Player
       |    |
       |    +-- (autres entites vivantes)
       |
       +-- BlockEntity
       |
       +-- (autres types d'entites)
```

### Entity

Classe de base pour toutes les entites du jeu.

```java
public abstract class Entity implements Component<EntityStore> {
    protected int networkId = -1;
    protected World world;
    protected Ref<EntityStore> reference;
    protected final AtomicBoolean wasRemoved = new AtomicBoolean();

    // Codec pour la serialisation
    public static final BuilderCodec<Entity> CODEC =
        BuilderCodec.abstractBuilder(Entity.class)
            .legacyVersioned()
            .codecVersion(5)
            .append(DISPLAY_NAME, ...)
            .append(UUID, ...)
            .build();

    // Supprimer l'entite du monde
    public boolean remove();

    // Charger l'entite dans un monde
    public void loadIntoWorld(World world);

    // Reference a l'entite dans l'ECS
    public Ref<EntityStore> getReference();

    // Convertir en Holder pour serialisation/copie
    public Holder<EntityStore> toHolder();
}
```

### LivingEntity

Entite avec un inventaire et des statistiques.

```java
public abstract class LivingEntity extends Entity {
    private final StatModifiersManager statModifiersManager = new StatModifiersManager();
    private Inventory inventory;
    protected double currentFallDistance;

    public static final BuilderCodec<LivingEntity> CODEC =
        BuilderCodec.abstractBuilder(LivingEntity.class, Entity.CODEC)
            .append(new KeyedCodec<>("Inventory", Inventory.CODEC), ...)
            .build();

    // Creer l'inventaire par defaut
    protected abstract Inventory createDefaultInventory();

    // Gestion de l'inventaire
    public Inventory getInventory();
    public Inventory setInventory(Inventory inventory);

    // Gestion des degats de chute
    public double getCurrentFallDistance();

    // Modificateurs de statistiques
    public StatModifiersManager getStatModifiersManager();
}
```

### Player

Le joueur connecte.

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

    // ComponentType pour identifier les joueurs
    public static ComponentType<EntityStore, Player> getComponentType() {
        return EntityModule.get().getPlayerComponentType();
    }

    // Initialisation du joueur
    public void init(UUID uuid, PlayerRef playerRef);

    // Gestion du GameMode
    public GameMode getGameMode();
    public static void setGameMode(@Nonnull Ref<EntityStore> playerRef, @Nonnull GameMode gameMode, @Nonnull ComponentAccessor<EntityStore> componentAccessor);

    // Gestionnaires d'interface utilisateur
    public WindowManager getWindowManager();
    public PageManager getPageManager();
    public HudManager getHudManager();
}
```

---

## Composants Built-in Importants

### TransformComponent

Position et rotation de l'entite.

```java
public class TransformComponent implements Component<EntityStore> {
    private final Vector3d position = new Vector3d();
    private final Vector3f rotation = new Vector3f();

    public static ComponentType<EntityStore, TransformComponent> getComponentType();

    public Vector3d getPosition();
    public Vector3f getRotation();
    public Transform getTransform();

    // Methodes de modification
    public void setPosition(@Nonnull Vector3d position);
    public void setRotation(@Nonnull Vector3f rotation);

    // Methodes de teleportation - gere les valeurs NaN
    public void teleportPosition(@Nonnull Vector3d position);
    public void teleportRotation(@Nonnull Vector3f rotation);
}
```

### BoundingBox

Boite de collision de l'entite.

```java
public class BoundingBox implements Component<EntityStore> {
    private final Box boundingBox = new Box();

    public static ComponentType<EntityStore, BoundingBox> getComponentType();

    public Box getBoundingBox();
    public void setBoundingBox(Box boundingBox);
}
```

### UUIDComponent

Identifiant unique persistant de l'entite.

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

Marque une entite pour qu'elle ne soit pas traitee par les TickingSystems.

```java
public class NonTicking<ECS_TYPE> implements Component<ECS_TYPE> {
    private static final NonTicking<?> INSTANCE = new NonTicking();

    public static <ECS_TYPE> NonTicking<ECS_TYPE> get();
}

// Utilisation: ajouter ce composant pour desactiver le tick
holder.addComponent(registry.getNonTickingComponentType(), NonTicking.get());
```

### NonSerialized

Marque une entite pour qu'elle ne soit pas sauvegardee.

```java
public class NonSerialized<ECS_TYPE> implements Component<ECS_TYPE> {
    private static final NonSerialized<?> INSTANCE = new NonSerialized();

    public static <ECS_TYPE> NonSerialized<ECS_TYPE> get();
}

// Utilisation: ajouter ce composant pour empecher la sauvegarde
holder.addComponent(registry.getNonSerializedComponentType(), NonSerialized.get());
```

### Autres Composants Importants

| Composant | Description |
|-----------|-------------|
| `Velocity` | Vitesse de l'entite |
| `CollisionResultComponent` | Resultat des collisions |
| `ModelComponent` | Modele 3D de l'entite |
| `DisplayNameComponent` | Nom affiche |
| `MovementStatesComponent` | Etats de mouvement (au sol, en vol, etc.) |
| `KnockbackComponent` | Recul apres un coup |
| `DamageDataComponent` | Donnees de dommages recus |
| `ProjectileComponent` | Composant pour les projectiles |
| `EffectControllerComponent` | Effets actifs sur l'entite |

---

## CommandBuffer

Le `CommandBuffer` permet de modifier le Store de maniere differee (thread-safe).

### Comment Obtenir un CommandBuffer

**Important:** Il n'existe pas de methode `store.getCommandBuffer()`. Le CommandBuffer s'obtient via:

1. **Dans les Systemes ECS** - passe en parametre aux methodes tick:
```java
public void tick(Ref<EntityStore> ref, float dt, CommandBuffer<EntityStore> buffer) {
    // buffer est fourni par le systeme
}
```

2. **Dans InteractionContext** - lors du traitement des interactions:
```java
public void execute(InteractionContext context) {
    CommandBuffer<EntityStore> buffer = context.getCommandBuffer();
}
```

3. **Via Store.forEachChunk** - lors de l'iteration des archetype chunks:
```java
store.forEachChunk(query, (archetypeChunk, buffer) -> {
    // buffer est fourni par chunk
    for (int i = 0; i < archetypeChunk.size(); i++) {
        Ref<EntityStore> ref = archetypeChunk.getReferenceTo(i);
        // traiter l'entite
    }
});
```

### Definition de la Classe

```java
public class CommandBuffer<ECS_TYPE> implements ComponentAccessor<ECS_TYPE> {
    private final Store<ECS_TYPE> store;
    private final Deque<Consumer<Store<ECS_TYPE>>> queue;

    // Ajouter une action a executer plus tard
    public void run(Consumer<Store<ECS_TYPE>> consumer);

    // Ajouter une entite
    public Ref<ECS_TYPE> addEntity(Holder<ECS_TYPE> holder, AddReason reason);

    // Supprimer une entite
    public void removeEntity(Ref<ECS_TYPE> ref, RemoveReason reason);

    // Lire un composant (acces immediat)
    public <T extends Component<ECS_TYPE>> T getComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Ajouter un composant a une entite
    public <T extends Component<ECS_TYPE>> void addComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType, T component);

    // Supprimer un composant d'une entite
    public <T extends Component<ECS_TYPE>> void removeComponent(
        Ref<ECS_TYPE> ref, ComponentType<ECS_TYPE, T> componentType);

    // Invoquer un evenement sur une entite (utilise le type d'evenement de l'annotation)
    public <Event extends EcsEvent> void invoke(Ref<ECS_TYPE> ref, Event event);

    // Invoquer un evenement sur une entite avec type explicite
    public <Event extends EcsEvent> void invoke(
        EntityEventType<ECS_TYPE, Event> eventType, Ref<ECS_TYPE> ref, Event event);

    // Invoquer un evenement monde (utilise le type d'evenement de l'annotation)
    public <Event extends EcsEvent> void invoke(Event event);

    // Invoquer un evenement monde avec type explicite
    public <Event extends EcsEvent> void invoke(
        WorldEventType<ECS_TYPE, Event> eventType, Event event);
}
```

---

## AddReason et RemoveReason

Enumerations indiquant pourquoi une entite est ajoutee ou supprimee.

```java
public enum AddReason {
    SPAWN,  // Nouvelle entite creee
    LOAD    // Entite chargee depuis la sauvegarde
}

public enum RemoveReason {
    REMOVE,  // Entite supprimee definitivement
    UNLOAD   // Entite dechargee (sauvegardee)
}
```

---

## Flux de Donnees

```
1. CREATION D'ENTITE
   +---------------+     +---------+     +--------+     +--------------+
   | Creer Holder  | --> | Ajouter | --> | Store  | --> | RefSystems   |
   | avec Components|     | au Store|     | assigne|     | onEntityAdded|
   +---------------+     +---------+     | Ref    |     +--------------+
                                          +--------+

2. TICK
   +--------+     +-----------------+     +------------------+
   | Store  | --> | Pour chaque     | --> | Pour chaque      |
   | .tick()|     | System (trie)   |     | ArchetypeChunk   |
   +--------+     +-----------------+     | correspondant    |
                                          +------------------+
                                                   |
                                                   v
                                          +------------------+
                                          | System.tick()    |
                                          | (avec buffer)    |
                                          +------------------+

3. MODIFICATION D'ARCHETYPE (ajout/suppression de composant)
   +-------------+     +------------------+     +------------------+
   | CommandBuffer| --> | Retirer de       | --> | Ajouter au nouvel|
   | .addComponent|     | l'ancien Chunk   |     | ArchetypeChunk   |
   +-------------+     +------------------+     +------------------+

4. SUPPRESSION D'ENTITE
   +-------------+     +--------------+     +------------------+
   | CommandBuffer| --> | RefSystems   | --> | Retirer de       |
   | .removeEntity|     | onEntityRemove|     | l'ArchetypeChunk |
   +-------------+     +--------------+     +------------------+
```

---

## Bonnes Pratiques

1. **Composants simples**: Gardez les composants comme de simples conteneurs de donnees sans logique complexe.

2. **Un System par responsabilite**: Chaque System devrait avoir une seule responsabilite claire.

3. **Utilisez le CommandBuffer**: Ne modifiez jamais directement le Store pendant un tick. Utilisez toujours le CommandBuffer.

4. **Queries efficaces**: Utilisez des Archetypes plutot que des queries complexes quand c'est possible.

5. **NonTicking pour les entites statiques**: Ajoutez `NonTicking` aux entites qui n'ont pas besoin d'etre mises a jour.

6. **NonSerialized pour les entites temporaires**: Ajoutez `NonSerialized` aux entites qui ne doivent pas etre sauvegardees.

7. **Dependances explicites**: Declarez toujours les dependances entre systemes pour garantir l'ordre d'execution correct.

8. **Clone() obligatoire**: Implementez toujours correctement `clone()` pour les composants qui doivent etre copies.

---

## Reference des Composants Built-in Additionnels

Les sections suivantes documentent des composants ECS additionnels trouves dans le code source decompile du serveur. Ces composants fournissent des fonctionnalites essentielles pour le comportement des entites, le reseau et le rendu.

### Invulnerable

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `Invulnerable` est un composant marqueur (tag) qui rend une entite immune aux degats. Il utilise le pattern singleton - il n'y a qu'une seule instance partagee par toutes les entites invulnerables.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Invulnerable.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Rendre une entite invulnerable
commandBuffer.addComponent(ref, Invulnerable.getComponentType(), Invulnerable.INSTANCE);

// Supprimer l'invulnerabilite
commandBuffer.removeComponent(ref, Invulnerable.getComponentType());

// Verifier si l'entite est invulnerable
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isInvulnerable = archetype.contains(Invulnerable.getComponentType());
```

**Notes d'utilisation:**
- Le composant est automatiquement synchronise aux clients via `InvulnerableSystems.EntityTrackerUpdate`
- Lors de l'ajout, il met en file d'attente un `ComponentUpdate` de type `ComponentUpdateType.Invulnerable` pour tous les observateurs
- Lors de la suppression, il envoie une notification de suppression a tous les clients observant

---

### Intangible

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `Intangible` est un composant marqueur qui rend une entite non-collisionnable. Les autres entites et projectiles passeront a travers les entites intangibles. Comme `Invulnerable`, il utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Intangible.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Rendre une entite intangible (non-collisionnable)
holder.ensureComponent(Intangible.getComponentType());
// ou
commandBuffer.addComponent(ref, Intangible.getComponentType(), Intangible.INSTANCE);

// Supprimer l'intangibilite
commandBuffer.removeComponent(ref, Intangible.getComponentType());
```

**Notes d'utilisation:**
- Couramment utilise pour les entites d'objets tombes pour eviter les collisions avec d'autres objets
- Synchronise aux clients via `IntangibleSystems.EntityTrackerUpdate`
- Utilise dans `ItemComponent.generateItemDrop()` pour rendre les objets tombes intangibles

---

### Interactable

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `Interactable` marque une entite comme interactible par les joueurs. Cela permet aux evenements d'interaction (comme les actions de clic droit) d'etre traites pour l'entite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/Interactable.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Rendre une entite interactible
holder.addComponent(Interactable.getComponentType(), Interactable.INSTANCE);

// Supprimer l'interactivite
commandBuffer.removeComponent(ref, Interactable.getComponentType());
```

**Notes d'utilisation:**
- Utilise pour les PNJ, conteneurs et autres entites avec lesquelles les joueurs peuvent interagir
- La logique d'interaction est geree par des systemes separes qui interrogent ce composant

---

### ItemComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

Le composant `ItemComponent` represente un objet tombe dans le monde. Il contient les donnees de la pile d'objets, les delais de ramassage, les delais de fusion et fournit des utilitaires pour creer des objets tombes et gerer le ramassage.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/ItemComponent.java`

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

   // ... methodes
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `itemStack` | `ItemStack` | null | La pile d'objets que cette entite represente |
| `mergeDelay` | float | 1.5 | Delai avant que les objets puissent fusionner (secondes) |
| `pickupDelay` | float | 0.5 | Delai avant que l'objet puisse etre ramasse (secondes) |
| `pickupThrottle` | float | 0.25 | Temps de recharge entre les tentatives de ramassage |
| `removedByPlayerPickup` | boolean | false | Si l'objet a ete supprime par ramassage joueur |
| `pickupRange` | float | -1.0 | Portee de ramassage (-1 = utiliser la valeur par defaut) |

**Comment creer des objets tombes:**

```java
// Creer un seul objet tombe
Holder<EntityStore> itemHolder = ItemComponent.generateItemDrop(
    accessor,           // ComponentAccessor
    itemStack,          // ItemStack a faire tomber
    position,           // Position Vector3d
    rotation,           // Rotation Vector3f
    velocityX,          // Velocite horizontale float
    velocityY,          // Velocite verticale float (3.25F par defaut)
    velocityZ           // Velocite horizontale float
);
store.addEntity(itemHolder, AddReason.SPAWN);

// Creer plusieurs objets tombes depuis une liste
Holder<EntityStore>[] items = ItemComponent.generateItemDrops(
    accessor, itemStacks, position, rotation
);

// Ajouter un objet a un conteneur (gere le ramassage partiel)
ItemStack pickedUp = ItemComponent.addToItemContainer(store, itemRef, itemContainer);
```

**Notes d'utilisation:**
- Assigne automatiquement `Intangible`, `Velocity`, `PhysicsValues`, `UUIDComponent` et `DespawnComponent`
- La duree de vie de l'objet est de 120 secondes par defaut (configurable via `ItemEntityConfig`)
- Peut emettre de la lumiere dynamique si l'objet/bloc a une propriete de lumiere

---

### PlayerInput

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

Le composant `PlayerInput` gere les mises a jour d'entree du joueur incluant le mouvement, la rotation et le controle de monture. Il met en file d'attente les mises a jour d'entree qui sont traitees par les systemes joueur.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerInput.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `inputUpdateQueue` | `List<InputUpdate>` | File d'attente des mises a jour d'entree en attente |
| `mountId` | int | ID reseau de l'entite monture (0 = non monte) |

**Types de mise a jour d'entree:**

| Type | Description |
|------|-------------|
| `AbsoluteMovement` | Teleporter a une position absolue (x, y, z) |
| `RelativeMovement` | Se deplacer relativement a la position actuelle |
| `WishMovement` | Direction de deplacement souhaitee |
| `SetBody` | Definir la rotation du corps (pitch, yaw, roll) |
| `SetHead` | Definir la rotation de la tete (pitch, yaw, roll) |
| `SetMovementStates` | Definir les drapeaux d'etat de mouvement |
| `SetClientVelocity` | Definir la velocite depuis le client |
| `SetRiderMovementStates` | Definir les etats de mouvement en montant |

**Comment utiliser:**

```java
// Mettre en file d'attente un mouvement absolu
PlayerInput input = store.getComponent(playerRef, PlayerInput.getComponentType());
input.queue(new PlayerInput.AbsoluteMovement(x, y, z));

// Mettre en file d'attente un changement de rotation de tete
input.queue(new PlayerInput.SetHead(new Direction(pitch, yaw, roll)));
```

---

### NetworkId

**Package:** `com.hypixel.hytale.server.core.modules.entity.tracker`

Le composant `NetworkId` assigne un identifiant reseau unique a une entite pour la synchronisation client-serveur. Cet ID est utilise dans les paquets reseau pour referencer les entites.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/tracker/NetworkId.java`

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
      return this;  // Immuable - retourne la meme instance
   }
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `id` | int | Identifiant reseau unique pour l'entite |

**Comment ajouter:**

```java
// Obtenir le prochain ID reseau du monde et l'assigner a l'entite
int networkId = world.getExternalData().takeNextNetworkId();
holder.addComponent(NetworkId.getComponentType(), new NetworkId(networkId));

// Ou pendant la generation d'entite
holder.addComponent(NetworkId.getComponentType(),
    new NetworkId(ref.getStore().getExternalData().takeNextNetworkId()));
```

**Notes d'utilisation:**
- Les ID reseau sont assignes automatiquement par le systeme de suivi d'entites pour les entites suivies
- Le composant est immuable - `clone()` retourne la meme instance
- Utilise extensivement dans la serialisation de paquets pour les references d'entites

---

### Frozen

**Package:** `com.hypixel.hytale.server.core.entity`

Le composant `Frozen` est un composant marqueur qui empeche une entite de se deplacer ou d'etre affectee par la physique. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/Frozen.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Geler une entite
commandBuffer.addComponent(ref, Frozen.getComponentType(), Frozen.get());

// Degeler une entite
commandBuffer.removeComponent(ref, Frozen.getComponentType());
```

**Notes d'utilisation:**
- Utile pour les cinematiques, dialogues ou pour mettre des entites en pause
- Ne rend pas l'entite invulnerable - combiner avec `Invulnerable` si necessaire

---

### Teleport

**Package:** `com.hypixel.hytale.server.core.modules.entity.teleport`

Le composant `Teleport` est utilise pour teleporter une entite vers une nouvelle position, rotation et optionnellement un monde different. C'est un composant transitoire qui est automatiquement supprime apres le traitement de la teleportation.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/teleport/Teleport.java`

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

   // Constructeurs
   public Teleport(@Nullable World world, @Nonnull Vector3d position, @Nonnull Vector3f rotation);
   public Teleport(@Nonnull Vector3d position, @Nonnull Vector3f rotation);
   public Teleport(@Nullable World world, @Nonnull Transform transform);
   public Teleport(@Nonnull Transform transform);

   // Modificateurs fluents
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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `world` | `World` | null | Monde cible (null = meme monde) |
| `position` | `Vector3d` | - | Position cible |
| `rotation` | `Vector3f` | - | Rotation du corps cible |
| `headRotation` | `Vector3f` | null | Rotation de la tete cible (optionnel) |
| `resetVelocity` | boolean | true | Si la velocite doit etre reinitialise apres la teleportation |

**Comment teleporter une entite:**

```java
// Teleporter a une position dans le meme monde
commandBuffer.addComponent(ref, Teleport.getComponentType(),
    new Teleport(new Vector3d(100, 64, 200), new Vector3f(0, 90, 0)));

// Teleporter vers un monde different
commandBuffer.addComponent(ref, Teleport.getComponentType(),
    new Teleport(targetWorld, position, rotation));

// Teleporter avec rotation de tete et sans reinitialiser la velocite
Teleport teleport = new Teleport(position, rotation)
    .withHeadRotation(headRotation)
    .withoutVelocityReset();
commandBuffer.addComponent(ref, Teleport.getComponentType(), teleport);
```

**Notes d'utilisation:**
- Le composant `Teleport` est traite par `TeleportSystems.MoveSystem` (pour les entites) ou `TeleportSystems.PlayerMoveSystem` (pour les joueurs)
- Pour les joueurs, la teleportation envoie un paquet `ClientTeleport` et attend un accusé de reception
- Le composant est automatiquement supprime apres le traitement
- La teleportation inter-monde deplace l'entite entre les stores

---

### EntityScaleComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `EntityScaleComponent` controle l'echelle visuelle d'une entite. Cela affecte la taille rendue du modele de l'entite sur les clients.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/EntityScaleComponent.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `scale` | float | 1.0 | Multiplicateur d'echelle (1.0 = taille normale) |
| `isNetworkOutdated` | boolean | true | Drapeau interne pour la synchronisation reseau |

**Comment utiliser:**

```java
// Creer une entite avec une echelle personnalisee
holder.addComponent(EntityScaleComponent.getComponentType(),
    new EntityScaleComponent(2.0f));  // Double taille

// Modifier l'echelle a l'execution
EntityScaleComponent scaleComponent = store.getComponent(ref,
    EntityScaleComponent.getComponentType());
scaleComponent.setScale(0.5f);  // Demi taille
```

**Notes d'utilisation:**
- Les changements d'echelle sont automatiquement synchronises aux clients
- N'affecte que le rendu visuel, pas la collision/hitbox
- Une echelle de 0 ou negative peut causer un comportement indefini

---

### HitboxCollision

**Package:** `com.hypixel.hytale.server.core.modules.entity.hitboxcollision`

Le composant `HitboxCollision` definit comment la hitbox d'une entite interagit avec d'autres entites. Il reference un asset `HitboxCollisionConfig` qui definit le comportement de collision.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/hitboxcollision/HitboxCollision.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `hitboxCollisionConfigIndex` | int | - | Index dans la map d'assets `HitboxCollisionConfig` |
| `isNetworkOutdated` | boolean | true | Drapeau interne pour la synchronisation reseau |

**Proprietes de HitboxCollisionConfig:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `CollisionType` | `CollisionType` | `Hard` (bloque le mouvement) ou `Soft` (ralentit) |
| `SoftCollisionOffsetRatio` | float | Ratio de mouvement lors du passage a travers une collision douce |

**Comment utiliser:**

```java
// Obtenir une config de collision hitbox depuis les assets
HitboxCollisionConfig config = HitboxCollisionConfig.getAssetMap().getAsset("mymod:soft_hitbox");

// Ajouter une collision hitbox a une entite
holder.addComponent(HitboxCollision.getComponentType(), new HitboxCollision(config));

// Modifier la collision hitbox a l'execution
HitboxCollision hitbox = store.getComponent(ref, HitboxCollision.getComponentType());
hitbox.setHitboxCollisionConfigIndex(newConfigIndex);
```

**Notes d'utilisation:**
- Utilise pour la collision entite-a-entite (pas la collision avec les blocs)
- Le type de collision `Hard` bloque completement le mouvement
- Le type de collision `Soft` permet de passer a travers avec une vitesse reduite

---

### Nameplate

**Package:** `com.hypixel.hytale.server.core.entity.nameplate`

Le composant `Nameplate` affiche une etiquette de texte flottante au-dessus d'une entite. Ceci est couramment utilise pour les noms de joueurs, les noms de PNJ ou les etiquettes personnalisees.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/nameplate/Nameplate.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `text` | String | "" | Le texte a afficher au-dessus de l'entite |
| `isNetworkOutdated` | boolean | true | Drapeau interne pour la synchronisation reseau |

**Comment utiliser:**

```java
// Creer une entite avec un nameplate
holder.addComponent(Nameplate.getComponentType(), new Nameplate("Marchand"));

// Modifier le texte du nameplate a l'execution
Nameplate nameplate = store.getComponent(ref, Nameplate.getComponentType());
nameplate.setText("Nouveau Nom");  // Ne met a jour que si le texte a change

// Supprimer le nameplate
commandBuffer.removeComponent(ref, Nameplate.getComponentType());
```

**Notes d'utilisation:**
- Les changements de texte sont automatiquement synchronises aux clients lorsqu'ils sont modifies
- La methode `setText` ne marque le composant comme obsolete que si le texte change reellement
- Une chaine vide n'affiche pas de nameplate mais conserve le composant

---

### DynamicLight

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `DynamicLight` fait qu'une entite emet de la lumiere. Cela cree une source de lumiere mobile qui illumine la zone environnante.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/DynamicLight.java`

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

**Proprietes de ColorLight:**

| Propriete | Type | Plage | Description |
|-----------|------|-------|-------------|
| `radius` | byte | 0-255 | Rayon de lumiere en blocs |
| `red` | byte | 0-255 | Composante de couleur rouge |
| `green` | byte | 0-255 | Composante de couleur verte |
| `blue` | byte | 0-255 | Composante de couleur bleue |

**Comment utiliser:**

```java
// Creer une lumiere dynamique rouge
ColorLight redLight = new ColorLight((byte)15, (byte)255, (byte)0, (byte)0);
holder.addComponent(DynamicLight.getComponentType(), new DynamicLight(redLight));

// Creer une lumiere type torche blanche
ColorLight torchLight = new ColorLight((byte)12, (byte)255, (byte)200, (byte)100);
holder.addComponent(DynamicLight.getComponentType(), new DynamicLight(torchLight));

// Modifier la lumiere a l'execution
DynamicLight light = store.getComponent(ref, DynamicLight.getComponentType());
light.setColorLight(new ColorLight((byte)10, (byte)0, (byte)255, (byte)0));  // Lumiere verte

// Supprimer la lumiere dynamique
commandBuffer.removeComponent(ref, DynamicLight.getComponentType());
```

**Notes d'utilisation:**
- Les changements de lumiere sont automatiquement synchronises aux clients
- Pour les lumieres persistantes (sauvegardees avec l'entite), utilisez `PersistentDynamicLight` a la place
- `DynamicLightSystems.Setup` cree automatiquement `DynamicLight` depuis `PersistentDynamicLight` au chargement
- Les objets tombes emettent automatiquement de la lumiere si l'objet/bloc a une propriete de lumiere (voir `ItemComponent.computeDynamicLight()`)

---

### ItemPhysicsComponent (Deprecie)

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

Le composant `ItemPhysicsComponent` est un composant deprecie qui etait utilise pour stocker les calculs de physique des objets tombes. Il contient la velocite mise a l'echelle et les resultats de collision. Ce composant a ete remplace par des systemes de physique plus recents.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/ItemPhysicsComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `scaledVelocity` | `Vector3d` | Le vecteur de velocite mis a l'echelle pour l'objet |
| `collisionResult` | `CollisionResult` | Le resultat des calculs de collision |

**Notes d'utilisation:**
- Ce composant est deprecie et ne devrait pas etre utilise dans le nouveau code
- Utilisez les composants `Velocity` et `PhysicsValues` a la place pour la physique des objets

---

### PickupItemComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

Le composant `PickupItemComponent` gere l'animation et l'etat lorsqu'un objet est ramasse par une entite. Il gere l'animation de deplacement de la position de l'objet vers l'entite cible sur une duree configurable.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/PickupItemComponent.java`

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

   // Constructeurs
   public PickupItemComponent() {}
   public PickupItemComponent(@Nonnull Ref<EntityStore> targetRef, @Nonnull Vector3d startPosition);
   public PickupItemComponent(@Nonnull Ref<EntityStore> targetRef, @Nonnull Vector3d startPosition, float lifeTime);

   // Methodes
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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `targetRef` | `Ref<EntityStore>` | null | Reference a l'entite qui ramasse l'objet |
| `startPosition` | `Vector3d` | null | Position de depart pour l'animation de ramassage |
| `originalLifeTime` | float | - | Duree originale de l'animation de ramassage |
| `lifeTime` | float | 0.15 | Temps restant pour l'animation de ramassage (secondes) |
| `finished` | boolean | false | Si l'animation de ramassage est terminee |

**Comment utiliser:**

```java
// Initier l'animation de ramassage d'objet
PickupItemComponent pickup = new PickupItemComponent(
    playerRef,                          // Entite ramassant l'objet
    itemPosition,                       // Position de depart
    0.15f                               // Duree de l'animation en secondes
);
commandBuffer.addComponent(itemRef, PickupItemComponent.getComponentType(), pickup);

// Verifier si le ramassage est termine
PickupItemComponent pickup = store.getComponent(itemRef, PickupItemComponent.getComponentType());
if (pickup.hasFinished()) {
    // Supprimer l'objet et l'ajouter a l'inventaire
}
```

**Notes d'utilisation:**
- Le composant est traite par `PickupItemSystem` qui interpole la position de l'objet
- Le temps de deplacement par defaut est de 0.15 secondes (150ms)
- Une fois termine, le systeme gere le transfert de l'objet vers l'inventaire de la cible

---

### PreventItemMerging

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

Le composant `PreventItemMerging` est un composant marqueur (tag) qui empeche un objet tombe d'etre fusionne avec d'autres objets identiques a proximite. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/PreventItemMerging.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Empecher un objet de fusionner avec d'autres
holder.addComponent(PreventItemMerging.getComponentType(), PreventItemMerging.INSTANCE);
// ou
commandBuffer.addComponent(itemRef, PreventItemMerging.getComponentType(), PreventItemMerging.INSTANCE);

// Permettre a nouveau la fusion
commandBuffer.removeComponent(itemRef, PreventItemMerging.getComponentType());
```

**Notes d'utilisation:**
- Utile pour les objets de quete, les drops uniques, ou les objets qui doivent rester separes
- Le `ItemMergeSystem` verifie ce composant avant de tenter de fusionner des objets

---

### PreventPickup

**Package:** `com.hypixel.hytale.server.core.modules.entity.item`

Le composant `PreventPickup` est un composant marqueur (tag) qui empeche un objet tombe d'etre ramasse par n'importe quelle entite. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/item/PreventPickup.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Empecher un objet d'etre ramasse
holder.addComponent(PreventPickup.getComponentType(), PreventPickup.INSTANCE);
// ou
commandBuffer.addComponent(itemRef, PreventPickup.getComponentType(), PreventPickup.INSTANCE);

// Permettre a nouveau le ramassage
commandBuffer.removeComponent(itemRef, PreventPickup.getComponentType());
```

**Notes d'utilisation:**
- Utile pour les objets decoratifs, les objets pendant les cinematiques, ou les objets restreints au proprietaire
- Different de `ItemComponent.pickupDelay` qui est temporaire - celui-ci est permanent jusqu'a suppression

---

### PhysicsValues

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

Le composant `PhysicsValues` stocke les proprietes physiques d'une entite qui affectent sa reponse a la simulation physique. Cela inclut la masse, le coefficient de trainee et la direction de la gravite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/physics/component/PhysicsValues.java`

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

   // Constructeurs
   public PhysicsValues();  // Utilise les valeurs par defaut
   public PhysicsValues(@Nonnull PhysicsValues other);  // Constructeur de copie
   public PhysicsValues(double mass, double dragCoefficient, boolean invertedGravity);

   // Methodes
   public void replaceValues(@Nonnull PhysicsValues other);
   public void resetToDefault();
   public void scale(float scale);
   public double getMass();
   public double getDragCoefficient();
   public boolean isInvertedGravity();
   @Nonnull public static PhysicsValues getDefault();
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `mass` | double | 1.0 | Masse de l'entite (doit etre > 0) |
| `dragCoefficient` | double | 0.5 | Coefficient de resistance de l'air (doit etre >= 0) |
| `invertedGravity` | boolean | false | Si la gravite est inversee pour cette entite |

**Comment utiliser:**

```java
// Creer une entite avec une physique personnalisee
PhysicsValues physics = new PhysicsValues(2.0, 0.3, false);  // Lourd, faible trainee
holder.addComponent(PhysicsValues.getComponentType(), physics);

// Creer une entite flottante (gravite inversee)
PhysicsValues floatingPhysics = new PhysicsValues(0.5, 0.8, true);
holder.addComponent(PhysicsValues.getComponentType(), floatingPhysics);

// Modifier la physique a l'execution
PhysicsValues physics = store.getComponent(ref, PhysicsValues.getComponentType());
physics.scale(2.0f);  // Double la masse et la trainee

// Reinitialiser aux valeurs par defaut
physics.resetToDefault();
```

**Notes d'utilisation:**
- La masse affecte comment les forces (y compris la gravite) accelerent l'entite
- Un coefficient de trainee plus eleve signifie que l'entite ralentit plus vite dans l'air
- La gravite inversee fait tomber l'entite vers le haut - utile pour les effets speciaux
- Utilise automatiquement pour les objets tombes via `ItemComponent.generateItemDrop()`

---

### PlayerSettings

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

Le composant `PlayerSettings` stocke les preferences et parametres du joueur, y compris les emplacements de ramassage d'objets et les parametres du mode creatif. Il est implemente comme un record Java pour l'immutabilite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerSettings.java`

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
      return INSTANCE;  // Retourne l'instance par defaut
   }
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `showEntityMarkers` | boolean | false | Afficher les marqueurs d'entites de debug |
| `armorItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Ou vont les armures ramassees |
| `weaponAndToolItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Ou vont les armes/outils ramasses |
| `usableItemsItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Ou vont les consommables ramasses |
| `solidBlockItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Ou vont les blocs ramasses |
| `miscItemsPreferredPickupLocation` | `PickupLocation` | Hotbar | Ou vont les objets divers ramasses |
| `creativeSettings` | `PlayerCreativeSettings` | - | Parametres specifiques au mode creatif |

**PlayerCreativeSettings:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `allowNPCDetection` | boolean | false | Si les PNJ peuvent detecter/cibler le joueur |
| `respondToHit` | boolean | false | Si le joueur reagit aux coups recus |

**Comment utiliser:**

```java
// Obtenir les parametres par defaut
PlayerSettings settings = PlayerSettings.defaults();

// Creer des parametres personnalises
PlayerSettings customSettings = new PlayerSettings(
    true,                       // showEntityMarkers
    PickupLocation.Inventory,   // armure -> inventaire
    PickupLocation.Hotbar,      // armes -> hotbar
    PickupLocation.Inventory,   // consommables -> inventaire
    PickupLocation.Inventory,   // blocs -> inventaire
    PickupLocation.Inventory,   // divers -> inventaire
    new PlayerCreativeSettings(true, false)  // parametres creatif
);
commandBuffer.addComponent(playerRef, PlayerSettings.getComponentType(), customSettings);
```

**Notes d'utilisation:**
- Les parametres sont generalement envoyes depuis le client et appliques a l'entite joueur
- PickupLocation determine ou les objets sont places dans l'inventaire du joueur
- Les parametres creatif controlent le comportement de jeu en mode creatif

---

### ChunkTracker

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

Le composant `ChunkTracker` gere quels chunks sont charges et visibles pour un joueur. Il gere le chargement/dechargement des chunks, le rayon de vue et la limitation du debit de streaming des chunks.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/ChunkTracker.java`

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

   // Methodes principales
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

   // Statistiques
   public int getLoadedChunksCount();
   public int getLoadingChunksCount();

   public enum ChunkVisibility { NONE, HOT, COLD }
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `chunkViewRadius` | int | - | Distance de vue du joueur en chunks |
| `maxChunksPerSecond` | int | 36 (distant) | Maximum de chunks a charger par seconde |
| `maxChunksPerTick` | int | 4 | Maximum de chunks a charger par tick |
| `minLoadedChunksRadius` | int | 2 | Rayon minimum de chunks charges |
| `maxHotLoadedChunksRadius` | int | 8 | Rayon maximum pour les chunks "hot" (actifs) |
| `sentViewRadius` | int | 0 | Rayon actuel des chunks envoyes |
| `hotRadius` | int | 0 | Rayon actuel des chunks hot |
| `readyForChunks` | boolean | false | Si le joueur est pret a recevoir des chunks |

**Enum ChunkVisibility:**

| Valeur | Description |
|--------|-------------|
| `NONE` | Le chunk n'est pas visible pour le joueur |
| `HOT` | Le chunk est visible et activement en tick |
| `COLD` | Le chunk est visible mais pas en tick |

**Comment utiliser:**

```java
// Obtenir le chunk tracker d'un joueur
ChunkTracker tracker = store.getComponent(playerRef, ChunkTracker.getComponentType());

// Verifier si un chunk est charge pour ce joueur
long chunkIndex = ChunkUtil.indexChunk(chunkX, chunkZ);
if (tracker.isLoaded(chunkIndex)) {
    // Le chunk est visible pour le joueur
}

// Configurer le debit de chargement des chunks
tracker.setMaxChunksPerSecond(64);
tracker.setMaxChunksPerTick(8);

// Obtenir la visibilite d'un chunk
ChunkTracker.ChunkVisibility visibility = tracker.getChunkVisibility(chunkIndex);
if (visibility == ChunkTracker.ChunkVisibility.HOT) {
    // Le chunk est activement en tick
}

// Effacer tous les chunks charges (pour teleportation/changement de monde)
tracker.clear();
```

**Notes d'utilisation:**
- Le chargement des chunks est limite en debit pour eviter la congestion reseau
- Les connexions locales obtiennent 256 chunks/seconde, LAN obtient 128, distant obtient 36
- Les chunks "Hot" sont activement en tick ; les chunks "cold" sont visibles mais statiques
- L'iterateur en spirale assure que les chunks les plus proches du joueur se chargent en premier

---

### ActiveAnimationComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `ActiveAnimationComponent` suit quelles animations sont actuellement en cours sur une entite a travers differents slots d'animation. Il permet la synchronisation reseau des etats d'animation.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/ActiveAnimationComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `activeAnimations` | `String[]` | Tableau de noms d'animations indexe par AnimationSlot |
| `isNetworkOutdated` | boolean | Drapeau pour la synchronisation reseau |

**Comment utiliser:**

```java
// Creer une entite avec un composant d'animation
holder.addComponent(ActiveAnimationComponent.getComponentType(), new ActiveAnimationComponent());

// Definir une animation sur un slot specifique
ActiveAnimationComponent anim = store.getComponent(ref, ActiveAnimationComponent.getComponentType());
anim.setPlayingAnimation(AnimationSlot.PRIMARY, "walk");
anim.setPlayingAnimation(AnimationSlot.SECONDARY, "wave");

// Effacer une animation
anim.setPlayingAnimation(AnimationSlot.PRIMARY, null);

// Obtenir toutes les animations actives
String[] animations = anim.getActiveAnimations();
```

**Notes d'utilisation:**
- Les slots d'animation permettent a plusieurs animations de jouer simultanement (ex: marcher + saluer)
- Les changements d'animation sont automatiquement synchronises aux clients lorsque marques comme obsoletes
- Les valeurs d'animation null indiquent qu'aucune animation ne joue sur ce slot

---

### MovementAudioComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `MovementAudioComponent` gere le retour audio pour le mouvement des entites, y compris les sons de pas et les sons de mouvement dans les blocs (comme marcher dans l'eau ou l'herbe).

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/MovementAudioComponent.java`

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
      // Filtre le proprietaire pour qu'il n'entende pas ses propres sons
   }
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `lastInsideBlockTypeId` | int | 0 | ID du type de bloc dans lequel l'entite se trouve |
| `nextMoveInRepeat` | float | -1.0 | Timer pour les sons de mouvement repetitifs |

**Comment utiliser:**

```java
// Ajouter l'audio de mouvement a une entite
holder.addComponent(MovementAudioComponent.getComponentType(), new MovementAudioComponent());

// Mettre a jour le bloc dans lequel l'entite se trouve
MovementAudioComponent audio = store.getComponent(ref, MovementAudioComponent.getComponentType());
audio.setLastInsideBlockTypeId(waterBlockTypeId);

// Configurer un son repetitif (ex: eclaboussures dans l'eau)
audio.setNextMoveInRepeat(0.5f);  // Repeter toutes les 0.5 secondes

// Verifier s'il est temps de jouer le son a nouveau
if (audio.canMoveInRepeat() && audio.tickMoveInRepeat(deltaTime)) {
    // Jouer le son de mouvement
    audio.setNextMoveInRepeat(0.5f);  // Reinitialiser le timer
}
```

**Notes d'utilisation:**
- Le `ShouldHearPredicate` empeche les entites d'entendre leurs propres sons de mouvement
- Utilise pour les sons ambiants comme marcher dans l'eau, les hautes herbes, etc.
- Definir `nextMoveInRepeat` a `NO_REPEAT` (-1.0) pour desactiver les sons repetitifs

---

### RespondToHit

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `RespondToHit` est un composant marqueur (tag) qui indique qu'une entite devrait reagir aux coups avec un retour visuel/audio. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/RespondToHit.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Faire reagir l'entite aux coups (montrer le retour de degats)
holder.addComponent(RespondToHit.getComponentType(), RespondToHit.INSTANCE);
// ou
commandBuffer.addComponent(ref, RespondToHit.getComponentType(), RespondToHit.INSTANCE);

// Desactiver la reponse aux coups
commandBuffer.removeComponent(ref, RespondToHit.getComponentType());

// Verifier si l'entite reagit aux coups
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean respondsToHit = archetype.contains(RespondToHit.getComponentType());
```

**Notes d'utilisation:**
- Utilise pour activer les animations, sons et effets de retour de coup
- Lie a `PlayerCreativeSettings.respondToHit` pour les parametres specifiques au joueur
- Les entites sans ce composant peuvent quand meme subir des degats mais ne montreront pas de retour

---

### RotateObjectComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `RotateObjectComponent` fait qu'une entite tourne continuellement autour de son axe Y. Utile pour les objets d'affichage, les objets decoratifs ou les collectibles.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/RotateObjectComponent.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `rotationSpeed` | float | 0.0 | Vitesse de rotation en degres par seconde |

**Comment utiliser:**

```java
// Creer un objet d'affichage tournant lentement
RotateObjectComponent rotate = new RotateObjectComponent(45.0f);  // 45 deg/sec
holder.addComponent(RotateObjectComponent.getComponentType(), rotate);

// Creer un collectible tournant rapidement
holder.addComponent(RotateObjectComponent.getComponentType(),
    new RotateObjectComponent(180.0f));  // Demi-rotation par seconde

// Modifier la vitesse de rotation a l'execution
RotateObjectComponent rotate = store.getComponent(ref, RotateObjectComponent.getComponentType());
rotate.setRotationSpeed(90.0f);

// Arreter la rotation
rotate.setRotationSpeed(0.0f);
// ou supprimer le composant
commandBuffer.removeComponent(ref, RotateObjectComponent.getComponentType());
```

**Notes d'utilisation:**
- Les valeurs positives tournent dans le sens anti-horaire (vu du dessus)
- Les valeurs negatives tournent dans le sens horaire
- Couramment utilise pour les objets tombes pour les rendre plus visibles
- La rotation reelle est appliquee par un systeme qui met a jour `TransformComponent`

---

### FromPrefab

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `FromPrefab` est un composant marqueur (tag) qui indique qu'une entite a ete generee a partir d'une definition de prefab. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/FromPrefab.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Marquer l'entite comme generee depuis un prefab
holder.addComponent(FromPrefab.getComponentType(), FromPrefab.INSTANCE);

// Verifier si l'entite vient d'un prefab
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isFromPrefab = archetype.contains(FromPrefab.getComponentType());
```

**Notes d'utilisation:**
- Utilise pour distinguer les entites generees depuis des prefabs vs. creees dynamiquement
- Aide a la gestion et au nettoyage des entites
- Les entites prefab peuvent avoir une serialisation ou un comportement de reapparition special

---

### FromWorldGen

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `FromWorldGen` marque une entite comme etant generee par le systeme de generation du monde. Il stocke l'ID de generation du monde pour suivre quel systeme de world gen l'a cree.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/FromWorldGen.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `worldGenId` | int | ID du systeme de generation du monde qui a cree cette entite |

**Comment utiliser:**

```java
// Marquer l'entite comme generee par world gen
FromWorldGen worldGen = new FromWorldGen(generatorId);
holder.addComponent(FromWorldGen.getComponentType(), worldGen);

// Verifier si l'entite a ete generee
FromWorldGen worldGen = store.getComponent(ref, FromWorldGen.getComponentType());
if (worldGen != null) {
    int generatorId = worldGen.getWorldGenId();
    // Gerer l'entite generee par le monde
}
```

**Notes d'utilisation:**
- Utilise pour les entites comme les creatures apparaissant naturellement, les structures ou les decorations
- Le `worldGenId` peut etre utilise pour identifier quel generateur a cree l'entite
- Aide a eviter de re-generer des entites qui ont deja ete apparues
- Lie au composant `WorldGenId` qui suit l'etat de generation au niveau du chunk

---

### MovementStatesComponent

**Package:** `com.hypixel.hytale.server.core.entity.movement`

Le `MovementStatesComponent` suit l'etat de mouvement actuel d'une entite. Il stocke des indicateurs booleens pour divers etats de mouvement comme sauter, voler, nager, s'accroupir, et plus encore. Ce composant suit egalement ce qui a ete envoye aux clients pour la compression delta.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/movement/MovementStatesComponent.java`

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

**Proprietes de MovementStates:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `idle` | boolean | L'entite ne bouge pas |
| `horizontalIdle` | boolean | L'entite ne bouge pas horizontalement |
| `jumping` | boolean | L'entite saute actuellement |
| `flying` | boolean | L'entite est en mode vol |
| `walking` | boolean | L'entite marche |
| `running` | boolean | L'entite court |
| `sprinting` | boolean | L'entite sprinte |
| `crouching` | boolean | L'entite s'accroupit |
| `forcedCrouching` | boolean | L'entite est forcee de s'accroupir (plafond bas) |
| `falling` | boolean | L'entite tombe |
| `climbing` | boolean | L'entite grimpe (echelle/liane) |
| `inFluid` | boolean | L'entite est dans un fluide (eau/lave) |
| `swimming` | boolean | L'entite nage |
| `swimJumping` | boolean | L'entite saute en nageant |
| `onGround` | boolean | L'entite est au sol |
| `mantling` | boolean | L'entite escalade un rebord |
| `sliding` | boolean | L'entite glisse |
| `mounting` | boolean | L'entite monte/descend |
| `rolling` | boolean | L'entite effectue une roulade |
| `sitting` | boolean | L'entite est assise |
| `gliding` | boolean | L'entite plane |
| `sleeping` | boolean | L'entite dort |

**Comment utiliser:**

```java
// Obtenir les etats de mouvement d'une entite
MovementStatesComponent component = store.getComponent(ref, MovementStatesComponent.getComponentType());
MovementStates states = component.getMovementStates();

// Verifier si l'entite est au sol
if (states.onGround) {
    // L'entite est au sol
}

// Verifier si l'entite est dans un etat pertinent au combat
if (states.jumping || states.falling) {
    // Appliquer les modificateurs de combat aerien
}

// Modifier l'etat de mouvement
states.crouching = true;

// Verifier plusieurs etats
boolean canSprint = states.onGround && !states.crouching && !states.inFluid;
```

**Notes d'utilisation:**
- Les etats de mouvement sont synchronises aux clients pour l'animation et la prediction
- Le champ `sentMovementStates` suit ce qui a ete envoye pour eviter les mises a jour reseau redondantes
- Les etats sont mis a jour par divers systemes de mouvement bases sur la physique et l'input du joueur
- Utilise par les systemes d'animation pour determiner quelles animations jouer

---

### MovementConfig (Asset)

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.movement`

Le `MovementConfig` est un asset de donnees (pas un composant) qui definit les parametres de mouvement pour les entites. Il controle les vitesses, forces de saut, controle aerien, escalade, glissade, roulade, et plus encore. Ceci est charge depuis des fichiers d'assets JSON.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/movement/MovementConfig.java`

**Proprietes cles:**

| Categorie | Propriete | Type | Defaut | Description |
|-----------|-----------|------|--------|-------------|
| **Base** | `baseSpeed` | float | 5.5 | Vitesse de mouvement de base |
| **Base** | `acceleration` | float | 0.1 | Acceleration du mouvement |
| **Base** | `velocityResistance` | float | 0.242 | Friction/resistance au sol |
| **Saut** | `jumpForce` | float | 11.8 | Force du saut |
| **Saut** | `swimJumpForce` | float | 10.0 | Force du saut en nageant |
| **Saut** | `jumpBufferDuration` | float | 0.3 | Fenetre de temps pour bufferiser l'input de saut |
| **Saut** | `variableJumpFallForce` | float | 35.0 | Force appliquee en relachant le saut tot |
| **Air** | `airSpeedMultiplier` | float | 1.0 | Multiplicateur de vitesse en l'air |
| **Air** | `airDragMin` / `airDragMax` | float | 0.96 / 0.995 | Plage de resistance de l'air |
| **Air** | `airFrictionMin` / `airFrictionMax` | float | 0.02 / 0.045 | Plage de friction de l'air |
| **Vol** | `horizontalFlySpeed` | float | 10.32 | Vitesse de vol horizontale |
| **Vol** | `verticalFlySpeed` | float | 10.32 | Vitesse de vol verticale |
| **Escalade** | `climbSpeed` | float | 0.035 | Vitesse d'escalade verticale |
| **Escalade** | `climbSpeedLateral` | float | 0.035 | Vitesse d'escalade horizontale |
| **Marche** | `forwardWalkSpeedMultiplier` | float | 0.3 | Multiplicateur de vitesse de marche avant |
| **Course** | `forwardRunSpeedMultiplier` | float | 1.0 | Multiplicateur de vitesse de course avant |
| **Sprint** | `forwardSprintSpeedMultiplier` | float | 1.65 | Multiplicateur de vitesse de sprint |
| **Accroupi** | `forwardCrouchSpeedMultiplier` | float | 0.55 | Multiplicateur de vitesse accroupi avant |
| **Glissade** | `minSlideEntrySpeed` | float | 8.5 | Vitesse minimale pour commencer a glisser |
| **Roulade** | `minFallSpeedToEngageRoll` | float | 21.0 | Vitesse de chute minimale pour declencher la roulade |
| **Roulade** | `rollTimeToComplete` | float | 0.9 | Temps pour completer l'animation de roulade |
| **AutoSaut** | `autoJumpObstacleSpeedLoss` | float | 0.95 | Perte de vitesse sur auto-saut |
| **AutoSaut** | `autoJumpDisableJumping` | boolean | true | Desactiver le saut manuel pendant l'auto-saut |

**Comment utiliser:**

```java
// Obtenir la configuration de mouvement par defaut
MovementConfig config = MovementConfig.DEFAULT_MOVEMENT;

// Obtenir une configuration personnalisee depuis les assets
MovementConfig customConfig = MovementConfig.getAssetMap().getAsset("mymod:fast_runner");

// Acceder aux valeurs de mouvement
float jumpForce = config.getJumpForce();
float baseSpeed = config.getBaseSpeed();
float sprintMultiplier = config.getForwardSprintSpeedMultiplier();

// Calculer la vitesse de sprint effective
float sprintSpeed = baseSpeed * sprintMultiplier;
```

**Notes d'utilisation:**
- Les assets MovementConfig peuvent heriter de configurations parentes via le systeme d'assets
- La configuration est envoyee aux clients via le paquet `MovementSettings` pour la prediction cote client
- Differents types d'entites peuvent avoir differentes configurations de mouvement
- Utilise par les systemes de physique de mouvement pour calculer le mouvement des entites

---

### Velocity

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

Le composant `Velocity` stocke le vecteur de velocite actuel d'une entite et les instructions de velocite en attente. Il supporte plusieurs types de modification de velocite (ajouter, definir, remplacer) et est utilise par les systemes de physique pour deplacer les entites.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/physics/component/Velocity.java`

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

   // Manipulation de velocite
   public void setZero();
   public void addForce(@Nonnull Vector3d force);
   public void addForce(double x, double y, double z);
   public void set(@Nonnull Vector3d newVelocity);
   public void set(double x, double y, double z);

   // Acces aux composants
   public double getX();
   public double getY();
   public double getZ();
   public double getSpeed();

   // File d'instructions
   public void addInstruction(@Nonnull Vector3d velocity, @Nullable VelocityConfig config, @Nonnull ChangeVelocityType type);
   @Nonnull public List<Velocity.Instruction> getInstructions();
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `velocity` | `Vector3d` | Velocite actuelle (blocs par seconde) |
| `clientVelocity` | `Vector3d` | Velocite predite par le client |
| `instructions` | `List<Instruction>` | Modifications de velocite en attente |

**Enum ChangeVelocityType:**

| Valeur | Description |
|--------|-------------|
| `Add` | Ajouter a la velocite actuelle |
| `Set` | Remplacer la velocite actuelle |
| `Replace` | Remplacer uniquement les composants specifies |

**Comment utiliser:**

```java
// Obtenir le composant de velocite
Velocity velocity = store.getComponent(ref, Velocity.getComponentType());

// Appliquer une force (additive)
velocity.addForce(0, 10, 0);  // Force vers le haut

// Definir la velocite directement
velocity.set(5, 0, 3);  // Se deplacer vers le nord-est

// Obtenir la vitesse actuelle
double speed = velocity.getSpeed();

// Reinitialiser la velocite
velocity.setZero();

// Ajouter une instruction de velocite (traitee par le systeme de physique)
velocity.addInstruction(
    new Vector3d(0, 15, 0),    // Velocite de saut
    null,                        // Pas de config speciale
    ChangeVelocityType.Add       // Ajouter a l'actuelle
);
```

**Notes d'utilisation:**
- La velocite est en blocs par seconde
- Les instructions sont traitees par les systemes de velocite puis effacees
- La velocite client est utilisee pour la synchronisation de prediction cote client
- Fonctionne avec le composant `PhysicsValues` pour les calculs de masse et resistance

---

### KnockbackComponent

**Package:** `com.hypixel.hytale.server.core.entity.knockback`

Le `KnockbackComponent` stocke les donnees de recul en attente a appliquer a une entite. Il inclut la velocite a appliquer, le type de changement de velocite, les modificateurs, et le suivi de duree pour les effets de chancellement.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/knockback/KnockbackComponent.java`

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

   // Velocite
   public Vector3d getVelocity();
   public void setVelocity(@Nonnull Vector3d velocity);
   public ChangeVelocityType getVelocityType();
   public void setVelocityType(ChangeVelocityType velocityType);

   // Modificateurs
   public void addModifier(double modifier);
   public void applyModifiers();

   // Duree/Timer
   public float getDuration();
   public void setDuration(float duration);
   public float getTimer();
   public void incrementTimer(float time);
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `velocity` | `Vector3d` | - | Velocite de recul a appliquer |
| `velocityType` | `ChangeVelocityType` | Add | Comment appliquer la velocite |
| `modifiers` | `DoubleList` | vide | Multiplicateurs a appliquer a la velocite |
| `duration` | float | 0 | Duree totale du recul |
| `timer` | float | 0 | Temps ecoule actuel |

**Comment utiliser:**

```java
// Appliquer un recul a une entite
KnockbackComponent knockback = new KnockbackComponent();
knockback.setVelocity(new Vector3d(5, 8, 0));  // Horizontal + vertical
knockback.setVelocityType(ChangeVelocityType.Set);
knockback.setDuration(0.3f);  // 300ms de chancellement
commandBuffer.addComponent(ref, KnockbackComponent.getComponentType(), knockback);

// Appliquer un recul avec modificateurs (ex: reduction d'armure)
knockback.addModifier(0.75);  // Reduction de 25%
knockback.addModifier(1.2);   // Augmentation de 20% (depuis un debuff)
knockback.applyModifiers();   // Appliquer tous les modificateurs a la velocite
```

**Notes d'utilisation:**
- Le recul est traite par des systemes de recul dedies
- La duree/timer peut etre utilisee pour les effets de chancellement
- Les modificateurs sont multiplicatifs et appliques via `applyModifiers()`
- Le composant est typiquement retire apres traitement

---

### DamageDataComponent

**Package:** `com.hypixel.hytale.server.core.entity.damage`

Le `DamageDataComponent` suit les donnees de timing de combat pour une entite, incluant quand elle a recu des degats pour la derniere fois, quand elle a effectue une action de combat pour la derniere fois, et l'etat d'interaction de maniement actuel.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/damage/DamageDataComponent.java`

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
   public WieldingInteraction getCurrentWielding();
   public void setCurrentWielding(@Nullable WieldingInteraction currentWielding);
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `lastCombatAction` | `Instant` | MIN | Horodatage de la derniere action de combat |
| `lastDamageTime` | `Instant` | MIN | Horodatage des derniers degats recus |
| `currentWielding` | `WieldingInteraction` | null | Etat actuel de maniement d'arme/outil |
| `lastChargeTime` | `Instant` | null | Horodatage du debut de l'attaque chargee |

**Comment utiliser:**

```java
// Obtenir les donnees de degats pour une entite
DamageDataComponent damageData = store.getComponent(ref, DamageDataComponent.getComponentType());

// Verifier si l'entite etait recemment en combat
Instant now = timeResource.getNow();
Duration timeSinceCombat = Duration.between(damageData.getLastCombatAction(), now);
boolean recentlyInCombat = timeSinceCombat.getSeconds() < 5;

// Mettre a jour le timing de combat lors d'une attaque
damageData.setLastCombatAction(now);

// Verifier le cooldown de degats
Duration timeSinceDamage = Duration.between(damageData.getLastDamageTime(), now);
boolean canTakeDamage = timeSinceDamage.toMillis() > invulnerabilityFrames;
```

**Notes d'utilisation:**
- Utilise pour les cooldowns de combat et les frames d'invulnerabilite
- `currentWielding` suit l'etat d'interaction de l'arme active
- Le temps d'action de combat inclut les actions d'attaque et de defense
- Essentiel pour les systemes de combo et le timing d'attaque

---

### DeathComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.damage`

Le `DeathComponent` est ajoute a une entite quand elle meurt. Il contient des informations de mort incluant la cause, le message, la configuration de perte d'objets, et les parametres de reapparition.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/damage/DeathComponent.java`

```java
public class DeathComponent implements Component<EntityStore> {
   private String deathCause;
   private Message deathMessage;
   private boolean showDeathMenu = true;
   private ItemStack[] itemsLostOnDeath;
   private double itemsAmountLossPercentage;
   private double itemsDurabilityLossPercentage;
   private boolean displayDataOnDeathScreen;
   private Damage deathInfo;
   private DeathConfig.ItemsLossMode itemsLossMode = DeathConfig.ItemsLossMode.ALL;

   public static ComponentType<EntityStore, DeathComponent> getComponentType() {
      return DamageModule.get().getDeathComponentType();
   }

   // Aide statique pour ajouter le composant de mort en securite
   public static void tryAddComponent(@Nonnull CommandBuffer<EntityStore> commandBuffer,
                                      @Nonnull Ref<EntityStore> ref,
                                      @Nonnull Damage damage);
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `deathCause` | String | - | ID de l'asset de cause de degats |
| `deathMessage` | `Message` | null | Message de mort personnalise a afficher |
| `showDeathMenu` | boolean | true | Afficher ou non le menu de mort/reapparition |
| `itemsLostOnDeath` | `ItemStack[]` | null | Objets perdus quand l'entite est morte |
| `itemsAmountLossPercentage` | double | 0 | Pourcentage des quantites de pile perdues |
| `itemsDurabilityLossPercentage` | double | 0 | Pourcentage de durabilite perdue |
| `itemsLossMode` | `ItemsLossMode` | ALL | Comment les objets sont perdus (ALL, RANDOM, NONE) |

**Enum ItemsLossMode:**

| Valeur | Description |
|--------|-------------|
| `ALL` | Tous les objets sont perdus a la mort |
| `RANDOM` | Selection aleatoire d'objets perdus |
| `NONE` | Aucun objet perdu a la mort |

**Comment utiliser:**

```java
// La mort est appliquee via tryAddComponent (le constructeur a un acces protege)
DeathComponent.tryAddComponent(commandBuffer, entityRef, damage);

// Acceder aux informations de mort apres l'ajout du composant
DeathComponent death = store.getComponent(ref, DeathComponent.getComponentType());
DamageCause cause = death.getDeathCause();
Damage damageInfo = death.getDeathInfo();
boolean showMenu = death.isShowDeathMenu();
```

**Notes d'utilisation:**
- La methode `tryAddComponent` empeche d'ajouter plusieurs composants de mort
- Les systemes de gestion de mort traitent ce composant pour la logique de reapparition
- Utilise par l'UI de l'ecran de mort pour afficher des informations aux joueurs

---

### DespawnComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity`

Le `DespawnComponent` marque une entite pour suppression automatique a un moment specifie. Il fournit des methodes factory pour creer des timers de disparition bases sur des secondes ou millisecondes.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/DespawnComponent.java`

```java
public class DespawnComponent implements Component<EntityStore> {
   private Instant timeToDespawnAt;

   public static ComponentType<EntityStore, DespawnComponent> getComponentType() {
      return EntityModule.get().getDespawnComponentType();
   }

   // Methodes factory
   @Nonnull public static DespawnComponent despawnInSeconds(@Nonnull TimeResource time, int seconds);
   @Nonnull public static DespawnComponent despawnInSeconds(@Nonnull TimeResource time, float seconds);
   @Nonnull public static DespawnComponent despawnInMilliseconds(@Nonnull TimeResource time, long milliseconds);

   // Methodes d'instance
   public void setDespawn(Instant timeToDespawnAt);
   public void setDespawnTo(@Nonnull Instant from, float additionalSeconds);
   @Nullable public Instant getDespawn();
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `timeToDespawnAt` | `Instant` | Le moment exact ou l'entite doit etre supprimee |

**Comment utiliser:**

```java
// Creer une entite avec une duree de vie de 60 secondes
TimeResource time = store.getResource(TimeResource.TYPE);
holder.addComponent(DespawnComponent.getComponentType(),
    DespawnComponent.despawnInSeconds(time, 60));

// Creer une entite avec une duree de vie de 2.5 secondes
holder.addComponent(DespawnComponent.getComponentType(),
    DespawnComponent.despawnInSeconds(time, 2.5f));

// Etendre un timer de disparition existant
DespawnComponent despawn = store.getComponent(ref, DespawnComponent.getComponentType());
despawn.setDespawnTo(time.getNow(), 30.0f);  // 30 secondes de plus a partir de maintenant

// Supprimer la disparition (rendre permanent)
commandBuffer.removeComponent(ref, DespawnComponent.getComponentType());
```

**Notes d'utilisation:**
- Couramment utilise pour les objets au sol (defaut 120 secondes), projectiles et effets
- Le systeme de disparition verifie les entites a chaque tick et supprime celles expirees
- Passer un lifetime `null` a `trySetDespawn` supprime le composant de disparition
- Serialise avec l'entite pour la persistance entre les sauvegardes

---

### EffectControllerComponent

**Package:** `com.hypixel.hytale.server.core.entity.effect`

Le `EffectControllerComponent` gere les effets de statut actifs sur une entite. Il gere l'ajout, la suppression, l'extension des effets, le suivi des durees, et la synchronisation des etats d'effets aux clients.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/effect/EffectControllerComponent.java`

```java
public class EffectControllerComponent implements Component<EntityStore> {
   protected final Int2ObjectMap<ActiveEntityEffect> activeEffects = new Int2ObjectOpenHashMap<>();
   protected boolean isNetworkOutdated;
   protected boolean isInvulnerable;

   public static ComponentType<EntityStore, EffectControllerComponent> getComponentType() {
      return EntityModule.get().getEffectControllerComponentType();
   }

   // Ajouter des effets
   public boolean addEffect(@Nonnull Ref<EntityStore> ownerRef, @Nonnull EntityEffect entityEffect,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public boolean addEffect(@Nonnull Ref<EntityStore> ownerRef, @Nonnull EntityEffect entityEffect,
                           float duration, @Nonnull OverlapBehavior overlapBehavior,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public boolean addInfiniteEffect(@Nonnull Ref<EntityStore> ownerRef, int entityEffectIndex,
                                   @Nonnull EntityEffect entityEffect,
                                   @Nonnull ComponentAccessor<EntityStore> componentAccessor);

   // Supprimer des effets
   public void removeEffect(@Nonnull Ref<EntityStore> ownerRef, int entityEffectIndex,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);
   public void clearEffects(@Nonnull Ref<EntityStore> ownerRef,
                           @Nonnull ComponentAccessor<EntityStore> componentAccessor);

   // Requeter les effets
   @Nonnull public Int2ObjectMap<ActiveEntityEffect> getActiveEffects();
   public int[] getActiveEffectIndexes();
   public boolean isInvulnerable();
}
```

**Enum OverlapBehavior:**

| Valeur | Description |
|--------|-------------|
| `EXTEND` | Ajouter la duree a l'effet existant |
| `OVERWRITE` | Remplacer l'effet existant |
| `IGNORE` | Garder l'effet existant inchange |

**Comment utiliser:**

```java
// Obtenir le controleur d'effets
EffectControllerComponent effects = store.getComponent(ref, EffectControllerComponent.getComponentType());

// Ajouter un effet chronometre
EntityEffect poison = EntityEffect.getAssetMap().getAsset("hytale:poison");
effects.addEffect(ref, poison, 10.0f, OverlapBehavior.EXTEND, componentAccessor);

// Ajouter un effet infini
EntityEffect fly = EntityEffect.getAssetMap().getAsset("hytale:flight");
effects.addInfiniteEffect(ref, flyIndex, fly, componentAccessor);

// Verifier les effets actifs
int[] activeEffectIndexes = effects.getActiveEffectIndexes();
for (int effectIndex : activeEffectIndexes) {
    ActiveEntityEffect active = effects.getActiveEffects().get(effectIndex);
    float remaining = active.getRemainingDuration();
}

// Supprimer un effet specifique
effects.removeEffect(ref, poisonIndex, componentAccessor);

// Effacer tous les effets
effects.clearEffects(ref, componentAccessor);
```

**Notes d'utilisation:**
- Les effets peuvent modifier les stats de l'entite via `StatModifiersManager`
- Certains effets peuvent changer temporairement le modele de l'entite
- Les changements d'effets sont regroupes et envoyes aux clients via `EntityEffectUpdate`
- Utilise pour les buffs, debuffs, afflictions de statut et capacites speciales

---

### ProjectileComponent

**Package:** `com.hypixel.hytale.server.core.entity.entities`

Le `ProjectileComponent` represente une entite projectile comme une fleche, un sort ou un objet lance. Il gere la physique des projectiles, la detection de collision, les degats a l'impact, et les effets visuels/audio.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/ProjectileComponent.java`

```java
public class ProjectileComponent implements Component<EntityStore> {
   private static final double DEFAULT_DESPAWN_SECONDS = 60.0;
   private transient SimplePhysicsProvider simplePhysicsProvider;
   private transient String appearance = "Boy";
   private transient Projectile projectile;
   private String projectileAssetName;
   private float brokenDamageModifier = 1.0F;
   private double deadTimer = -1.0;
   private UUID creatorUuid;
   private boolean haveHit;

   public static ComponentType<EntityStore, ProjectileComponent> getComponentType() {
      return EntityModule.get().getProjectileComponentType();
   }

   // Methode factory pour creer des projectiles
   @Nonnull public static Holder<EntityStore> assembleDefaultProjectile(
      @Nonnull TimeResource time, @Nonnull String projectileAssetName,
      @Nonnull Vector3d position, @Nonnull Vector3f rotation
   );

   // Tir
   public void shoot(@Nonnull Holder<EntityStore> holder, @Nonnull UUID creatorUuid,
                    double x, double y, double z, float yaw, float pitch);
}
```

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `projectileAssetName` | String | - | ID d'asset pour la configuration du projectile |
| `brokenDamageModifier` | float | 1.0 | Multiplicateur de degats (reduit pour munition cassee) |
| `deadTimer` | double | -1.0 | Temps jusqu'a la suppression du projectile apres impact |
| `creatorUuid` | UUID | - | UUID de l'entite qui a tire ce projectile |
| `haveHit` | boolean | false | Si le projectile a touche quelque chose |

**Comment utiliser:**

```java
// Creer un projectile
TimeResource time = store.getResource(TimeResource.TYPE);
Holder<EntityStore> projectileHolder = ProjectileComponent.assembleDefaultProjectile(
    time,
    "hytale:arrow",
    position,
    rotation
);

// Tirer le projectile
ProjectileComponent projectile = projectileHolder.getComponent(ProjectileComponent.getComponentType());
projectile.shoot(projectileHolder, shooterUuid, x, y, z, yaw, pitch);

// Ajouter au monde
Ref<EntityStore> projectileRef = store.addEntity(projectileHolder, AddReason.SPAWN);

// Appliquer une penalite de degats pour arme cassee
projectile.applyBrokenPenalty(0.25f);  // Reduction de degats de 25%
```

**Notes d'utilisation:**
- Les projectiles incluent automatiquement `TransformComponent`, `Velocity`, `UUIDComponent` et `DespawnComponent`
- Utilise `SimplePhysicsProvider` pour la trajectoire et la collision
- Genere des particules et joue des sons au rebond, impact, rate et mort
- Peut declencher des explosions a la mort via `ExplosionConfig`

---

### CollisionResultComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le `CollisionResultComponent` stocke les resultats de la detection de collision pour une entite. Il suit la position de depart de collision, le decalage, et si une verification de collision est en attente.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/CollisionResultComponent.java`

```java
public class CollisionResultComponent implements Component<EntityStore> {
   private final CollisionResult collisionResult;
   private final Vector3d collisionStartPosition;
   private final Vector3d collisionPositionOffset;
   private boolean pendingCollisionCheck;

   public static ComponentType<EntityStore, CollisionResultComponent> getComponentType() {
      return EntityModule.get().getCollisionResultComponentType();
   }

   public CollisionResult getCollisionResult();
   public Vector3d getCollisionStartPosition();
   public Vector3d getCollisionPositionOffset();
   public boolean isPendingCollisionCheck();
   public void markPendingCollisionCheck();
   public void consumePendingCollisionCheck();
   public void resetLocationChange();
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `collisionResult` | `CollisionResult` | Informations de collision detaillees |
| `collisionStartPosition` | `Vector3d` | Position ou la verification de collision a commence |
| `collisionPositionOffset` | `Vector3d` | Decalage de mouvement apres resolution de collision |
| `pendingCollisionCheck` | boolean | Si une nouvelle verification de collision est necessaire |

**Comment utiliser:**

```java
// Obtenir le resultat de collision pour une entite
CollisionResultComponent collision = store.getComponent(ref, CollisionResultComponent.getComponentType());

// Verifier si une collision s'est produite
CollisionResult result = collision.getCollisionResult();
if (result.hasCollided()) {
    // Gerer la collision
    Vector3d resolvedOffset = collision.getCollisionPositionOffset();
}

// Marquer pour re-verification apres mouvement
collision.markPendingCollisionCheck();

// Apres traitement de la collision
collision.consumePendingCollisionCheck();
collision.resetLocationChange();
```

**Notes d'utilisation:**
- Utilise par les systemes de physique et de mouvement pour la resolution de collision
- Les vecteurs "copy" sont utilises pour les operations thread-safe
- Les verifications de collision sont regroupees et traitees par les systemes de collision
- Fonctionne avec le composant `BoundingBox` pour les limites de l'entite

---

### PositionDataComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le `PositionDataComponent` suit les types de blocs dans lesquels une entite se trouve actuellement et sur lesquels elle se tient. Ceci est utilise pour l'audio de mouvement, les effets de statut et la logique de gameplay.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PositionDataComponent.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `insideBlockTypeId` | int | 0 | ID du type de bloc dans lequel l'entite est (eau, lave, etc.) |
| `standingOnBlockTypeId` | int | 0 | ID du type de bloc sur lequel l'entite se tient |

**Comment utiliser:**

```java
// Obtenir les donnees de position
PositionDataComponent posData = store.getComponent(ref, PositionDataComponent.getComponentType());

// Verifier sur quel bloc l'entite se tient
int standingBlockId = posData.getStandingOnBlockTypeId();
BlockType blockType = BlockType.getAssetMap().getAsset(standingBlockId);
if (blockType != null && blockType.getId().equals("hytale:ice")) {
    // Appliquer la physique de glissement sur glace
}

// Verifier si l'entite est dans l'eau
int insideBlockId = posData.getInsideBlockTypeId();
BlockType insideBlock = BlockType.getAssetMap().getAsset(insideBlockId);
if (insideBlock != null && insideBlock.isFluid()) {
    // Appliquer la physique de nage
}
```

**Notes d'utilisation:**
- Mis a jour par les systemes de mouvement/position a chaque tick
- Un ID de bloc de 0 signifie typiquement l'air (pas de bloc)
- Utilise pour les sons de pas, les modificateurs de vitesse de mouvement et les effets de statut
- Fonctionne avec `MovementAudioComponent` pour les sons de mouvement

---

### NewSpawnComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le `NewSpawnComponent` fournit une periode de grace apres l'apparition de l'entite. Pendant cette fenetre, certains systemes peuvent traiter l'entite differemment (ex: sauter le traitement initial).

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/NewSpawnComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `newSpawnWindow` | float | Temps restant dans la periode de grace d'apparition (secondes) |

**Comment utiliser:**

```java
// Creer une entite avec protection d'apparition
holder.addComponent(NewSpawnComponent.getComponentType(), new NewSpawnComponent(1.0f));  // 1 seconde

// Verifier si la fenetre d'apparition est passee (dans un systeme)
NewSpawnComponent spawn = chunk.getComponent(index, NewSpawnComponent.getComponentType());
if (spawn != null && spawn.newSpawnWindowPassed(dt)) {
    // Fenetre d'apparition expiree, supprimer le composant
    commandBuffer.removeComponent(ref, NewSpawnComponent.getComponentType());
}
```

**Notes d'utilisation:**
- Retourne true et decremente le timer quand appele avec le delta time
- Typiquement retire par un systeme une fois la fenetre expiree
- Utilise pour empecher l'aggro immediate des NPC ou autres interactions non desirees
- Composant de courte duree qui existe uniquement pendant la periode de grace d'apparition

---

### PropComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le `PropComponent` est un composant marqueur (tag) qui identifie une entite comme un accessoire. Les accessoires sont typiquement des objets decoratifs statiques ou du mobilier. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PropComponent.java`

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
}
```

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Marquer une entite comme accessoire
holder.addComponent(PropComponent.getComponentType(), PropComponent.get());

// Verifier si une entite est un accessoire
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isProp = archetype.contains(PropComponent.getComponentType());
```

**Notes d'utilisation:**
- Utilise pour le mobilier, les decorations et les objets statiques
- Les accessoires peuvent avoir une serialisation ou une gestion d'interaction speciale
- Different des entites vivantes - les accessoires ne bougent typiquement pas et n'ont pas d'IA

---

### AudioComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le `AudioComponent` stocke les evenements sonores en attente a jouer a la position d'une entite. Les sons sont mis en file d'attente puis joues par le systeme audio.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/AudioComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `soundEventIds` | `IntList` | Liste des IDs d'evenements sonores a jouer |
| `isNetworkOutdated` | boolean | Indicateur pour la synchronisation reseau |

**Comment utiliser:**

```java
// Obtenir le composant audio
AudioComponent audio = store.getComponent(ref, AudioComponent.getComponentType());

// Mettre un son en file d'attente
int soundIndex = SoundEvent.getAssetMap().getIndex("hytale:entity.hurt");
audio.addSound(soundIndex);

// Obtenir tous les sons en attente
int[] sounds = audio.getSoundEventIds();

// Verifier et consommer le flag reseau
if (audio.consumeNetworkOutdated()) {
    // Envoyer les sons aux clients
}
```

**Notes d'utilisation:**
- Les sons sont mis en file d'attente et joues a la position de l'entite
- La synchronisation reseau assure que les clients entendent les sons d'entite
- Utilise pour les sons specifiques aux entites (blesse, mort, attaque, etc.)
- Fonctionne avec les systemes audio pour l'audio positionne en 3D

---

### PlayerSkinComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

Le `PlayerSkinComponent` stocke les donnees d'apparence/skin du joueur. Cela inclut la texture du skin, la personnalisation du modele et d'autres proprietes visuelles.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/PlayerSkinComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `playerSkin` | `PlayerSkin` | Donnees d'apparence/skin du joueur |
| `isNetworkOutdated` | boolean | Indicateur pour la synchronisation reseau |

**Comment utiliser:**

```java
// Obtenir le skin du joueur
PlayerSkinComponent skinComp = store.getComponent(playerRef, PlayerSkinComponent.getComponentType());
PlayerSkin skin = skinComp.getPlayerSkin();

// Forcer la mise a jour du skin vers les clients
skinComp.setNetworkOutdated();

// Verifier si le skin a besoin d'etre synchronise
if (skinComp.consumeNetworkOutdated()) {
    // Envoyer les donnees du skin aux clients
}
```

**Notes d'utilisation:**
- Les donnees du skin sont typiquement recues du client a la connexion
- Les changements de skin declenchent une synchronisation reseau vers les autres joueurs
- Utilise par les systemes de modele/effet lors de l'application de changements visuels
- Peut etre temporairement remplace par des effets (ex: deguisement)

---

## Systemes d'Inventaire et d'Items

Les systemes d'inventaire et d'items gerent les inventaires des joueurs, les conteneurs d'items, les piles d'items, les fenetres et les emplacements d'armure. Ce sont des systemes de gameplay essentiels qui gerent les items dans tout le jeu.

### Inventory

**Package:** `com.hypixel.hytale.server.core.inventory`

La classe `Inventory` gere l'inventaire complet d'une entite vivante, incluant le stockage, l'armure, la barre rapide, les emplacements utilitaires, les outils et le sac a dos. Elle fournit des methodes pour deplacer des items entre les sections, le placement intelligent d'items et la serialisation.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/Inventory.java`

```java
public class Inventory implements NetworkSerializable<UpdatePlayerInventory> {
   public static final short DEFAULT_HOTBAR_CAPACITY = 9;
   public static final short DEFAULT_UTILITY_CAPACITY = 4;
   public static final short DEFAULT_TOOLS_CAPACITY = 23;
   public static final short DEFAULT_ARMOR_CAPACITY = (short)ItemArmorSlot.VALUES.length;  // 4
   public static final short DEFAULT_STORAGE_ROWS = 4;
   public static final short DEFAULT_STORAGE_COLUMNS = 9;
   public static final short DEFAULT_STORAGE_CAPACITY = 36;

   // IDs de section (valeurs negatives pour les sections internes)
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

   // Conteneurs combines pour rechercher/deplacer des items
   private CombinedItemContainer combinedHotbarFirst;
   private CombinedItemContainer combinedStorageFirst;
   private CombinedItemContainer combinedBackpackStorageHotbar;
   private CombinedItemContainer combinedEverything;
}
```

**Sections de l'Inventaire:**

| Section | ID | Capacite par defaut | Description |
|---------|----|--------------------|-------------|
| Hotbar | -1 | 9 | Emplacements d'acces rapide |
| Storage | -2 | 36 | Stockage principal (grille 4x9) |
| Armor | -3 | 4 | Emplacements d'equipement (Tete, Torse, Mains, Jambes) |
| Utility | -5 | 4 | Emplacements pour consommables |
| Tools | -8 | 23 | Stockage d'outils (obsolete) |
| Backpack | -9 | 0 | Stockage extensible du sac a dos |

**Methodes Principales:**

```java
// Deplacer un item entre sections
void moveItem(int fromSectionId, int fromSlotId, int quantity, int toSectionId, int toSlotId);

// Deplacement intelligent avec auto-equipement et fusion de piles
void smartMoveItem(int fromSectionId, int fromSlotId, int quantity, SmartMoveType moveType);

// Obtenir les items des emplacements actifs
ItemStack getItemInHand();           // Item de la barre rapide ou outil actif
ItemStack getActiveHotbarItem();     // Item de l'emplacement actif de la barre rapide
ItemStack getUtilityItem();          // Item de l'emplacement utilitaire actif
ItemStack getToolsItem();            // Item de l'emplacement d'outil actif

// Gestion des emplacements
void setActiveHotbarSlot(byte slot);
void setActiveUtilitySlot(byte slot);
void setActiveToolsSlot(byte slot);

// Acces aux conteneurs
ItemContainer getContainerForItemPickup(Item item, PlayerSettings settings);
ItemContainer getSectionById(int id);

// Operations en masse
List<ItemStack> dropAllItemStacks();
void clear();
```

**Enum SmartMoveType:**

| Valeur | Description |
|--------|-------------|
| `EquipOrMergeStack` | Auto-equiper l'armure ou fusionner avec les piles existantes |
| `PutInHotbarOrWindow` | Deplacer vers la barre rapide ou ouvrir la fenetre de conteneur |
| `PutInHotbarOrBackpack` | Deplacer vers la barre rapide, le stockage ou le sac a dos |

**Exemples d'Utilisation:**

```java
// Obtenir l'inventaire du joueur
Player player = store.getComponent(playerRef, Player.getComponentType());
Inventory inventory = player.getInventory();

// Deplacer un item du stockage vers la barre rapide
inventory.moveItem(
    Inventory.STORAGE_SECTION_ID, 5,   // Depuis l'emplacement 5 du stockage
    64,                                 // Deplacer 64 items
    Inventory.HOTBAR_SECTION_ID, 0     // Vers l'emplacement 0 de la barre rapide
);

// Equipement intelligent d'armure
inventory.smartMoveItem(
    Inventory.STORAGE_SECTION_ID, 10,
    1,
    SmartMoveType.EquipOrMergeStack
);

// Obtenir l'item en main
ItemStack heldItem = inventory.getItemInHand();
if (heldItem != null && heldItem.getItem().getWeapon() != null) {
    // Le joueur tient une arme
}

// Ajouter des items a l'inventaire du joueur (respecte les preferences de ramassage)
PlayerSettings settings = store.getComponent(playerRef, PlayerSettings.getComponentType());
ItemContainer targetContainer = inventory.getContainerForItemPickup(item, settings);
targetContainer.addItemStack(itemStack);
```

---

### ItemStack

**Package:** `com.hypixel.hytale.server.core.inventory`

La classe `ItemStack` represente une pile d'items avec quantite, durabilite et metadonnees optionnelles. Les ItemStacks sont immutables par conception - les methodes de modification retournent de nouvelles instances.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/ItemStack.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `itemId` | String | ID de l'asset de l'item (ex: "hytale:diamond_sword") |
| `quantity` | int | Nombre d'items dans la pile (>0) |
| `durability` | double | Durabilite actuelle (0 = casse) |
| `maxDurability` | double | Durabilite maximale (0 = incassable) |
| `metadata` | BsonDocument | Donnees personnalisees attachees a l'item |
| `overrideDroppedItemAnimation` | boolean | Remplacer l'animation de lacher par defaut |

**Methodes de Modification Immutables:**

```java
// Toutes les methodes retournent de nouvelles instances ItemStack
ItemStack withQuantity(int quantity);           // Retourne null si quantity == 0
ItemStack withDurability(double durability);
ItemStack withMaxDurability(double maxDurability);
ItemStack withIncreasedDurability(double inc);
ItemStack withRestoredDurability(double maxDurability);
ItemStack withState(String state);
ItemStack withMetadata(BsonDocument metadata);
ItemStack withMetadata(String key, Codec<T> codec, T data);
```

**Operations de Pile:**

```java
// Verifier si les items peuvent etre empiles
boolean isStackableWith(ItemStack other);   // Meme id, durabilite, metadonnees
boolean isEquivalentType(ItemStack other);  // Meme id et metadonnees (ignore durabilite)

// Methodes utilitaires statiques
static boolean isEmpty(ItemStack itemStack);           // null ou id "Empty"
static boolean isStackableWith(ItemStack a, ItemStack b);
static boolean isSameItemType(ItemStack a, ItemStack b);  // Meme item id uniquement
```

**Durabilite:**

```java
boolean isUnbreakable();  // maxDurability <= 0
boolean isBroken();       // durability == 0 (et cassable)
```

**Exemples d'Utilisation:**

```java
// Creer une nouvelle pile d'items
ItemStack sword = new ItemStack("hytale:iron_sword", 1);
ItemStack blocks = new ItemStack("hytale:stone", 64);

// Modifier la pile d'items (retourne une nouvelle instance)
ItemStack damagedSword = sword.withDurability(sword.getDurability() - 10);
ItemStack halfStack = blocks.withQuantity(32);

// Ajouter des metadonnees personnalisees
ItemStack enchantedSword = sword.withMetadata("Enchantments", enchantCodec, enchantData);

// Verifier si empilable
if (stackA.isStackableWith(stackB)) {
    // Peut fusionner ces piles
    int newQuantity = stackA.getQuantity() + stackB.getQuantity();
    int maxStack = stackA.getItem().getMaxStack();
    // ...
}

// Verifier la durabilite
if (sword.isBroken()) {
    // L'outil est casse, ne peut pas etre utilise
}
```

---

### ItemContainer

**Package:** `com.hypixel.hytale.server.core.inventory.container`

`ItemContainer` est la classe de base abstraite pour tous les conteneurs de stockage d'items. Elle fournit des methodes completes pour ajouter, retirer, deplacer et interroger les piles d'items avec support des filtres.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/ItemContainer.java`

```java
public abstract class ItemContainer {
   // Methodes abstraites principales
   public abstract short getCapacity();
   public abstract void setGlobalFilter(FilterType globalFilter);
   public abstract void setSlotFilter(FilterActionType actionType, short slot, SlotFilter filter);
   public abstract ItemContainer clone();

   // Operations internes (protegees)
   protected abstract ItemStack internal_getSlot(short slot);
   protected abstract ItemStack internal_setSlot(short slot, ItemStack itemStack);
   protected abstract ItemStack internal_removeSlot(short slot);
   protected abstract boolean cantAddToSlot(short slot, ItemStack itemStack, ItemStack slotItemStack);
   protected abstract boolean cantRemoveFromSlot(short slot);
   protected abstract boolean cantDropFromSlot(short slot);
}
```

**Types de Conteneurs Principaux:**

| Type | Description |
|------|-------------|
| `SimpleItemContainer` | Conteneur basique de taille fixe |
| `EmptyItemContainer` | Espace reserve de capacite zero (singleton) |
| `CombinedItemContainer` | Combine virtuellement plusieurs conteneurs |

**Methodes Principales:**

```java
// Operations sur un seul emplacement
ItemStack getItemStack(short slot);
ItemStackSlotTransaction addItemStackToSlot(short slot, ItemStack itemStack);
ItemStackSlotTransaction setItemStackForSlot(short slot, ItemStack itemStack);
SlotTransaction removeItemStackFromSlot(short slot);
ItemStackSlotTransaction removeItemStackFromSlot(short slot, int quantity);

// Operations en masse
ItemStackTransaction addItemStack(ItemStack itemStack);
ListTransaction<ItemStackTransaction> addItemStacks(List<ItemStack> itemStacks);
ItemStackTransaction removeItemStack(ItemStack itemStack);
ListTransaction<ItemStackTransaction> removeItemStacks(List<ItemStack> itemStacks);

// Operations de deplacement
MoveTransaction<ItemStackTransaction> moveItemStackFromSlot(short slot, ItemContainer containerTo);
MoveTransaction<SlotTransaction> moveItemStackFromSlotToSlot(short slot, int quantity,
    ItemContainer containerTo, short slotTo);
ListTransaction<MoveTransaction<ItemStackTransaction>> moveAllItemStacksTo(ItemContainer... containerTo);

// Operations de requete
boolean canAddItemStack(ItemStack itemStack);
boolean canRemoveItemStack(ItemStack itemStack);
boolean containsItemStacksStackableWith(ItemStack itemStack);
int countItemStacks(Predicate<ItemStack> itemPredicate);
boolean isEmpty();

// Operations Ressource/Materiau
ResourceTransaction removeResource(ResourceQuantity resource);
MaterialTransaction removeMaterial(MaterialQuantity material);
TagTransaction removeTag(int tagIndex, int quantity);

// Utilitaires
List<ItemStack> dropAllItemStacks();
ClearTransaction clear();
ListTransaction<SlotTransaction> sortItems(SortType sort);
void forEach(ShortObjectConsumer<ItemStack> action);

// Evenements
EventRegistration registerChangeEvent(Consumer<ItemContainerChangeEvent> consumer);
```

**Transactions:**

Toutes les operations de conteneur retournent des objets transaction qui indiquent le succes/echec et fournissent l'etat avant/apres:

```java
// Verifier si l'operation a reussi
ItemStackTransaction transaction = container.addItemStack(itemStack);
if (transaction.succeeded()) {
    ItemStack remainder = transaction.getRemainder();
    if (remainder != null) {
        // Ajout partiel - certains items n'ont pas pu entrer
    }
}
```

**Exemples d'Utilisation:**

```java
// Creer un conteneur
SimpleItemContainer chest = new SimpleItemContainer((short)27);  // 27 emplacements

// Ajouter des items
ItemStackTransaction result = chest.addItemStack(new ItemStack("hytale:gold_ingot", 10));
if (!result.succeeded()) {
    // Le conteneur est plein
}

// Deplacer des items entre conteneurs
MoveTransaction<ItemStackTransaction> moveResult = sourceContainer.moveItemStackFromSlot(
    (short)5,           // Depuis l'emplacement 5
    destContainer       // Vers ce conteneur
);

// Verifier le contenu du conteneur
int goldCount = chest.countItemStacks(item ->
    item.getItemId().equals("hytale:gold_ingot"));

// S'enregistrer pour les changements
chest.registerChangeEvent(event -> {
    Transaction transaction = event.transaction();
    // Gerer le changement de conteneur
});
```

---

### CombinedItemContainer

**Package:** `com.hypixel.hytale.server.core.inventory.container`

Le `CombinedItemContainer` combine virtuellement plusieurs instances `ItemContainer` en un seul conteneur recherchable. Les operations parcourent les conteneurs enfants dans l'ordre, permettant un placement d'items base sur la priorite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/CombinedItemContainer.java`

```java
public class CombinedItemContainer extends ItemContainer {
   protected final ItemContainer[] containers;

   public CombinedItemContainer(ItemContainer... containers);

   public ItemContainer getContainer(int index);
   public int getContainersSize();
   public ItemContainer getContainerForSlot(short slot);

   @Override
   public short getCapacity();  // Somme de toutes les capacites des enfants
}
```

**Mappage des Emplacements:**

Les emplacements sont mappes sequentiellement entre les conteneurs enfants:
- Conteneur 0: emplacements 0 a (capacite0 - 1)
- Conteneur 1: emplacements capacite0 a (capacite0 + capacite1 - 1)
- Et ainsi de suite...

**Exemples d'Utilisation:**

```java
// Creer un conteneur combine (barre rapide en premier pour le placement)
CombinedItemContainer hotbarFirst = new CombinedItemContainer(hotbar, storage);

// Les items ajoutes essaieront d'abord la barre rapide, puis le stockage
hotbarFirst.addItemStack(new ItemStack("hytale:apple", 5));

// Creer stockage-en-premier pour un comportement different
CombinedItemContainer storageFirst = new CombinedItemContainer(storage, hotbar);

// Obtenir le conteneur sous-jacent pour un emplacement
ItemContainer container = hotbarFirst.getContainerForSlot((short)15);
// Si la barre rapide a 9 emplacements, l'emplacement 15 serait dans le stockage

// L'inventaire utilise ces conteneurs pour les preferences de ramassage
Inventory inventory = player.getInventory();
CombinedItemContainer pickupContainer = inventory.getCombinedHotbarFirst();
pickupContainer.addItemStack(pickedUpItem);
```

---

### SlotFilter et ArmorSlotAddFilter

**Package:** `com.hypixel.hytale.server.core.inventory.container.filter`

Les filtres d'emplacement controlent quels items peuvent etre ajoutes ou retires d'emplacements specifiques du conteneur. Ils sont utilises pour les restrictions d'armure, les exigences des emplacements utilitaires et les regles personnalisees de conteneur.

**Fichiers source:**
- `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/filter/SlotFilter.java`
- `server-analyzer/decompiled/com/hypixel/hytale/server/core/inventory/container/filter/ArmorSlotAddFilter.java`

```java
public interface SlotFilter {
   SlotFilter ALLOW = (actionType, container, slot, itemStack) -> true;
   SlotFilter DENY = (actionType, container, slot, itemStack) -> false;

   boolean test(FilterActionType actionType, ItemContainer container, short slot, ItemStack itemStack);
}

// Filtre pour les emplacements d'armure - restreint par type d'armure
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

| Valeur | Description |
|--------|-------------|
| `ADD` | Ajout d'items a l'emplacement |
| `REMOVE` | Retrait d'items de l'emplacement |
| `DROP` | Lacher d'items depuis l'emplacement |

**Exemples d'Utilisation:**

```java
// Appliquer un filtre d'armure a un conteneur
container.setSlotFilter(FilterActionType.ADD, (short)0, new ArmorSlotAddFilter(ItemArmorSlot.Head));
container.setSlotFilter(FilterActionType.ADD, (short)1, new ArmorSlotAddFilter(ItemArmorSlot.Chest));
container.setSlotFilter(FilterActionType.ADD, (short)2, new ArmorSlotAddFilter(ItemArmorSlot.Hands));
container.setSlotFilter(FilterActionType.ADD, (short)3, new ArmorSlotAddFilter(ItemArmorSlot.Legs));

// Rendre un emplacement en lecture seule
container.setSlotFilter(FilterActionType.REMOVE, (short)5, SlotFilter.DENY);

// Filtre personnalise pour les items utilisables uniquement
container.setSlotFilter(FilterActionType.ADD, (short)0,
    (type, cont, slot, item) -> item == null || item.getItem().getUtility().isUsable());
```

---

### ItemArmorSlot

**Package:** `com.hypixel.hytale.protocol`

L'enum `ItemArmorSlot` definit les quatre types d'emplacements d'armure disponibles pour l'equipement du joueur.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/protocol/ItemArmorSlot.java`

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

**Exemples d'Utilisation:**

```java
// Obtenir l'emplacement d'armure depuis un item
Item item = itemStack.getItem();
ItemArmor armor = item.getArmor();
if (armor != null) {
    ItemArmorSlot slot = armor.getArmorSlot();
    // Placer dans l'emplacement d'inventaire approprie
    inventory.getArmor().setItemStackForSlot((short)slot.getValue(), itemStack);
}

// Verifier si l'item est un casque
if (armor.getArmorSlot() == ItemArmorSlot.Head) {
    // Appliquer la logique specifique au casque
}
```

---

### UniqueItemUsagesComponent

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.data`

Le `UniqueItemUsagesComponent` suit quels items uniques/a usage unique un joueur a deja utilises. Cela empeche les joueurs d'utiliser le meme item unique plusieurs fois.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/data/UniqueItemUsagesComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `usedUniqueItems` | `Set<String>` | Ensemble des IDs d'items qui ont ete utilises |

**Exemples d'Utilisation:**

```java
// Verifier si le joueur a utilise un item unique
UniqueItemUsagesComponent usages = store.getComponent(playerRef,
    UniqueItemUsagesComponent.getComponentType());

String itemId = "hytale:special_scroll";
if (usages.hasUsedUniqueItem(itemId)) {
    // Deja utilise, ne peut pas reutiliser
    return;
}

// Utiliser l'item et l'enregistrer
performUniqueItemEffect(player, itemId);
usages.recordUniqueItemUsage(itemId);
```

---

## Systeme de Fenetres

Le systeme de fenetres gere les fenetres UI que les joueurs peuvent ouvrir, comme les conteneurs, les tables de craft, les boutiques et autres interfaces interactives.

### Window

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

La classe `Window` est la base abstraite pour toutes les fenetres UI. Elle gere le cycle de vie des fenetres (ouverture/fermeture), la serialisation des donnees et l'interaction avec le joueur.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/Window.java`

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

   // Cycle de vie
   public void init(PlayerRef playerRef, WindowManager manager);
   protected abstract boolean onOpen0();
   protected abstract void onClose0();
   public void close();

   // Donnees
   public abstract JsonObject getData();
   public void handleAction(Ref<EntityStore> ref, Store<EntityStore> store, WindowAction action);

   // Etat
   protected void invalidate();
   protected void setNeedRebuild();
   protected boolean consumeIsDirty();

   // Evenements
   public EventRegistration registerCloseEvent(Consumer<WindowCloseEvent> consumer);

   // Accesseurs
   public WindowType getType();
   public int getId();
   public PlayerRef getPlayerRef();
}
```

**Types de Fenetres:**

Les sous-classes de `Window` incluent:
- `ItemContainerWindow` - Fenetres avec conteneurs d'items
- `ContainerWindow` - Base pour les fenetres de conteneur
- `BlockWindow` - Fenetres attachees aux blocs
- `ContainerBlockWindow` - Fenetres de conteneur basees sur les blocs
- `ItemStackContainerWindow` - Fenetres pour les conteneurs de piles d'items
- `MaterialContainerWindow` - Fenetres avec ressources materielles
- `ValidatedWindow` - Fenetres avec logique de validation

**Cycle de Vie de la Fenetre:**

1. La fenetre est creee avec `WindowType`
2. `init()` est appele avec la reference du joueur
3. `onOpen0()` est appele - retourner false pour annuler l'ouverture
4. La fenetre est active et gere les appels `handleAction()`
5. `onClose0()` est appele a la fermeture
6. L'evenement de fermeture est dispatche

**Exemples d'Utilisation:**

```java
// Creer une fenetre personnalisee
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
        // Initialiser la fenetre, retourner true pour ouvrir
        return true;
    }

    @Override
    protected void onClose0() {
        // Nettoyage a la fermeture de la fenetre
    }

    @Override
    public JsonObject getData() {
        JsonObject data = new JsonObject();
        data.addProperty("rows", 3);
        return data;
    }
}

// Enregistrer un gestionnaire de fermeture
window.registerCloseEvent(event -> {
    // La fenetre a ete fermee
    saveContainerContents();
});
```

---

### WindowManager

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

Le `WindowManager` gere toutes les fenetres ouvertes pour un joueur. Il gere les IDs de fenetre, l'ouverture/fermeture, la mise a jour et la validation.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/WindowManager.java`

```java
public class WindowManager {
   private final AtomicInteger windowId = new AtomicInteger(1);
   private final Int2ObjectConcurrentHashMap<Window> windows = new Int2ObjectConcurrentHashMap<>();
   private final Int2ObjectConcurrentHashMap<EventRegistration> windowChangeEvents;
   private PlayerRef playerRef;

   public void init(PlayerRef playerRef);

   // Ouverture de fenetres
   public UpdateWindow clientOpenWindow(Window window);   // Pour les fenetres demandees par le client (id=0)
   public OpenWindow openWindow(Window window);           // Fenetres ouvertes par le serveur
   public List<OpenWindow> openWindows(Window... windows);

   // Acces aux fenetres
   public Window getWindow(int id);
   public List<Window> getWindows();

   // Fermeture
   public Window closeWindow(int id);
   public void closeAllWindows();

   // Mises a jour
   public void updateWindow(Window window);
   public void updateWindows();          // Met a jour toutes les fenetres modifiees
   public void validateWindows();        // Valide les ValidatedWindows
   public void markWindowChanged(int id);
}
```

**IDs de Fenetre:**
- L'ID `0` est reserve aux fenetres demandees par le client
- L'ID `-1` est invalide
- Les fenetres ouvertes par le serveur obtiennent des IDs incrementaux a partir de 1

**Exemples d'Utilisation:**

```java
// Obtenir le gestionnaire de fenetres du joueur
Player player = store.getComponent(playerRef, Player.getComponentType());
WindowManager windowManager = player.getWindowManager();

// Ouvrir une fenetre de conteneur
ChestWindow chestWindow = new ChestWindow(chestContainer);
OpenWindow packet = windowManager.openWindow(chestWindow);
if (packet != null) {
    playerRef.getPacketHandler().write(packet);
}

// Fermer une fenetre specifique
windowManager.closeWindow(windowId);

// Obtenir toutes les fenetres ouvertes
for (Window window : windowManager.getWindows()) {
    if (window instanceof ItemContainerWindow icw) {
        ItemContainer container = icw.getItemContainer();
        // Traiter le conteneur
    }
}

// Fermer toutes les fenetres (ex: a la deconnexion)
windowManager.closeAllWindows();
```

---

### Interface ItemContainerWindow

**Package:** `com.hypixel.hytale.server.core.entity.entities.player.windows`

L'interface `ItemContainerWindow` est implementee par les fenetres qui contiennent des conteneurs d'items. Cela permet au gestionnaire de fenetres de synchroniser automatiquement les changements de conteneur.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/entity/entities/player/windows/ItemContainerWindow.java`

```java
public interface ItemContainerWindow {
   @Nonnull
   ItemContainer getItemContainer();
}
```

**Exemples d'Utilisation:**

```java
// Verifier si la fenetre contient des items
Window window = windowManager.getWindow(windowId);
if (window instanceof ItemContainerWindow icw) {
    ItemContainer container = icw.getItemContainer();

    // Deplacer des items de l'inventaire du joueur vers le conteneur
    player.getInventory().getStorage().moveItemStackFromSlot(
        (short)0, container
    );
}
```

---

## Composants HUD

Le systeme HUD (Heads-Up Display) gere les elements UI a l'ecran qui affichent le statut du joueur, l'inventaire et les informations de jeu.

### HudComponent

**Package:** `com.hypixel.hytale.protocol.packets.interface_`

L'enum `HudComponent` definit tous les elements HUD disponibles qui peuvent etre affiches ou masques sur le client.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/protocol/packets/interface_/HudComponent.java`

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

**Description des Composants HUD:**

| Composant | Description |
|-----------|-------------|
| `Hotbar` | Emplacements d'acces rapide en bas de l'ecran |
| `StatusIcons` | Icones de buff/debuff |
| `Reticle` | Reticule/curseur de visee |
| `Chat` | Fenetre de chat |
| `Requests` | Demandes d'ami/groupe |
| `Notifications` | Notifications systeme |
| `KillFeed` | Affichage des kills/morts recents |
| `InputBindings` | Indications de controles |
| `PlayerList` | Liste des joueurs (Tab) |
| `EventTitle` | Grand texte de titre d'evenement |
| `Compass` | Boussole directionnelle |
| `ObjectivePanel` | Affichage des quetes/objectifs |
| `PortalPanel` | Information de portail |
| `BuilderToolsLegend` | Legende des outils du mode creatif |
| `Speedometer` | Affichage de vitesse de vehicule |
| `UtilitySlotSelector` | Selecteur d'items utilitaires |
| `BlockVariantSelector` | Selecteur de variante de bloc |
| `BuilderToolsMaterialSlotSelector` | Selecteur de materiaux creatifs |
| `Stamina` | Barre d'endurance |
| `AmmoIndicator` | Compteur de munitions |
| `Health` | Barre de vie |
| `Mana` | Barre de mana |
| `Oxygen` | Barre d'oxygene sous l'eau |
| `Sleep` | Indicateur de progression du sommeil |

**Exemples d'Utilisation:**

```java
// Masquer des composants HUD (ex: pendant une cinematique)
Set<HudComponent> hiddenComponents = EnumSet.of(
    HudComponent.Hotbar,
    HudComponent.Health,
    HudComponent.Stamina,
    HudComponent.Chat
);

UpdateVisibleHudComponents packet = new UpdateVisibleHudComponents();
packet.hiddenComponents = hiddenComponents;
playerRef.getPacketHandler().write(packet);

// Reafficher tous les composants
packet.hiddenComponents = EnumSet.noneOf(HudComponent.class);
playerRef.getPacketHandler().write(packet);
```

---

### EntityUIComponent

**Package:** `com.hypixel.hytale.server.core.modules.entityui.asset`

`EntityUIComponent` est une classe d'asset abstraite pour les elements UI affiches au-dessus des entites (comme les plaques de nom, les barres de vie ou les indicateurs personnalises).

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entityui/asset/EntityUIComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `id` | String | Identifiant de l'asset |
| `hitboxOffset` | Vector2f | Decalage depuis le centre de la hitbox de l'entite |
| `data` | AssetExtraInfo.Data | Metadonnees additionnelles de l'asset |

**Exemples d'Utilisation:**

```java
// Obtenir le composant UI d'entite depuis les assets
EntityUIComponent healthBar = EntityUIComponent.getAssetMap()
    .getAsset("hytale:health_bar");

// Creer un paquet pour l'UI d'entite
com.hypixel.hytale.protocol.EntityUIComponent packet = healthBar.toPacket();
```

---

## Composants Physiques

Ces composants gerent la simulation physique incluant la gravite, la masse, la trainee et les calculs de velocite.

### PhysicsValues

**Package:** `com.hypixel.hytale.server.core.modules.physics.component`

Le composant `PhysicsValues` stocke les proprietes physiques d'une entite incluant la masse, le coefficient de trainee et la direction de la gravite. Ces valeurs sont utilisees par les systemes physiques pour calculer le mouvement de l'entite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/physics/component/PhysicsValues.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `mass` | double | 1.0 | Masse de l'entite (doit etre > 0), affecte l'elan et le recul |
| `dragCoefficient` | double | 0.5 | Coefficient de resistance de l'air (>= 0), ralentit le mouvement |
| `invertedGravity` | boolean | false | Si la gravite est inversee (l'entite tombe vers le haut) |

**Comment utiliser:**

```java
// Creer des valeurs physiques pour une entite lourde
PhysicsValues physics = new PhysicsValues(5.0, 0.3, false);
holder.addComponent(PhysicsValues.getComponentType(), physics);

// Creer une entite flottante (gravite inversee)
PhysicsValues floatingPhysics = new PhysicsValues(1.0, 0.5, true);
holder.addComponent(PhysicsValues.getComponentType(), floatingPhysics);

// Modifier la physique a l'execution
PhysicsValues physics = store.getComponent(ref, PhysicsValues.getComponentType());
physics.scale(2.0f);  // Doubler masse et trainee

// Reinitialiser aux valeurs par defaut
physics.resetToDefault();
```

**Notes d'utilisation:**
- La masse affecte la resistance au recul - les entites plus lourdes sont moins poussees
- Le coefficient de trainee affecte la vitesse de ralentissement dans l'air
- La gravite inversee peut etre utilisee pour des effets speciaux ou des mecaniques de jeu
- Fonctionne avec le composant `Velocity` pour les calculs de mouvement

---

### Projectile (Composant Marqueur)

**Package:** `com.hypixel.hytale.server.core.modules.projectile.component`

Le composant marqueur `Projectile` identifie une entite comme un projectile. Utilise le pattern singleton pour l'efficacite memoire.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/projectile/component/Projectile.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Marquer l'entite comme projectile
holder.addComponent(Projectile.getComponentType(), Projectile.INSTANCE);

// Verifier si l'entite est un projectile
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isProjectile = archetype.contains(Projectile.getComponentType());

// Supprimer le marqueur de projectile
commandBuffer.removeComponent(ref, Projectile.getComponentType());
```

**Notes d'utilisation:**
- Utilise par les systemes de projectiles pour identifier les entites suivant une physique balistique
- Different de `ProjectileComponent` qui stocke les donnees d'etat du projectile
- Les projectiles ont typiquement aussi `Velocity`, `TransformComponent` et `DespawnComponent`

---

## Composants d'Animation et de Modele

Ces composants gerent la representation visuelle des entites incluant les modeles et les animations.

### ActiveAnimationComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `ActiveAnimationComponent` suit quelles animations sont actuellement jouees sur chaque slot d'animation d'une entite. Supporte plusieurs animations simultanees sur differents slots.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/ActiveAnimationComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `activeAnimations` | String[] | Tableau des IDs d'animation indexes par AnimationSlot |
| `isNetworkOutdated` | boolean | Flag pour la synchronisation reseau |

**Enum AnimationSlot (du protocole):**

| Slot | Description |
|------|-------------|
| `Body` | Animation principale du corps (marche, course, repos) |
| `Arms` | Animations des bras (attaque, parade, utilisation) |
| `Head` | Animations de la tete (regarder autour) |
| `Overlay` | Effets de superposition (flash de degats, lueur) |

**Comment utiliser:**

```java
// Obtenir le composant d'animation
ActiveAnimationComponent anim = store.getComponent(ref, ActiveAnimationComponent.getComponentType());

// Definir l'animation de marche sur le slot corps
anim.setPlayingAnimation(AnimationSlot.Body, "walk");

// Definir l'animation d'attaque sur le slot bras
anim.setPlayingAnimation(AnimationSlot.Arms, "sword_swing");

// Effacer un slot d'animation
anim.setPlayingAnimation(AnimationSlot.Overlay, null);

// Obtenir toutes les animations actives
String[] animations = anim.getActiveAnimations();
String bodyAnim = animations[AnimationSlot.Body.ordinal()];
```

**Notes d'utilisation:**
- Les animations sont referencees par des IDs de chaine definis dans les assets de modele
- Les slots multiples permettent de melanger les animations (ex: marcher en attaquant)
- La synchronisation reseau assure que les clients voient les memes animations
- Les transitions d'animation sont gerees par le systeme d'animation

---

### ModelComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `ModelComponent` stocke le modele actuel d'une entite. Cela determine l'apparence visuelle et les animations disponibles.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/ModelComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `model` | Model | L'asset de modele actuel de l'entite |
| `isNetworkOutdated` | boolean | Flag pour la synchronisation reseau |

**Comment utiliser:**

```java
// Obtenir le modele depuis les assets
Model zombieModel = Model.getAssetMap().getAsset("hytale:zombie");

// Creer une entite avec un modele
holder.addComponent(ModelComponent.getComponentType(), new ModelComponent(zombieModel));

// Acceder aux donnees du modele
ModelComponent modelComp = store.getComponent(ref, ModelComponent.getComponentType());
Model model = modelComp.getModel();

// Obtenir les proprietes du modele
String modelId = model.getId();
BoundingBox bounds = model.getBoundingBox();
```

**Notes d'utilisation:**
- Les modeles definissent l'apparence, la hitbox et le squelette d'animation de l'entite
- Changer de modele a l'execution declenche une synchronisation reseau vers les clients
- Fonctionne avec `ActiveAnimationComponent` pour la lecture des animations
- Les assets de modele sont charges depuis les fichiers de donnees du jeu

---

### PersistentModel

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `PersistentModel` stocke une reference de modele qui persiste avec la serialisation de l'entite. Contrairement a `ModelComponent`, celui-ci stocke uniquement une reference et est sauvegarde/charge avec l'entite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PersistentModel.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `modelReference` | Model.ModelReference | Reference vers l'asset de modele |

**Comment utiliser:**

```java
// Creer une reference de modele persistante
Model.ModelReference modelRef = new Model.ModelReference("hytale:custom_npc");
holder.addComponent(PersistentModel.getComponentType(), new PersistentModel(modelRef));

// Acceder au modele persistant
PersistentModel persistent = store.getComponent(ref, PersistentModel.getComponentType());
Model.ModelReference ref = persistent.getModelReference();

// Mettre a jour la reference de modele
persistent.setModelReference(new Model.ModelReference("hytale:different_model"));
```

**Notes d'utilisation:**
- Utilise pour les entites qui doivent se souvenir de leur modele entre les sauvegardes
- Model.ModelReference est une reference legere, pas les donnees completes du modele
- Le Model reel est resolu depuis la reference quand necessaire
- Couramment utilise pour les PNJ avec des apparences personnalisables

---

### PersistentDynamicLight

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `PersistentDynamicLight` ajoute une source de lumiere dynamique a une entite qui persiste avec la serialisation. La lumiere suit l'entite et illumine la zone environnante.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/PersistentDynamicLight.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `colorLight` | ColorLight | Parametres de couleur et d'intensite de la lumiere |

**Comment utiliser:**

```java
// Creer une lumiere orange type torche
ColorLight torchLight = new ColorLight(255, 200, 100, 15);  // RGB + rayon
holder.addComponent(PersistentDynamicLight.getComponentType(),
    new PersistentDynamicLight(torchLight));

// Creer une lueur bleue magique
ColorLight magicLight = new ColorLight(100, 150, 255, 10);
holder.addComponent(PersistentDynamicLight.getComponentType(),
    new PersistentDynamicLight(magicLight));

// Mettre a jour la lumiere a l'execution
PersistentDynamicLight light = store.getComponent(ref, PersistentDynamicLight.getComponentType());
light.setColorLight(new ColorLight(255, 0, 0, 20));  // Lumiere d'avertissement rouge
```

**Notes d'utilisation:**
- Le rayon de lumiere est en blocs
- Les valeurs de couleur sont RGB (0-255)
- La lumiere suit automatiquement la position de l'entite
- Utilise pour les entites lumineuses, torches tenues, effets magiques
- Persiste a travers les sauvegardes et chargements du monde

---

### HeadRotation

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `HeadRotation` suit la rotation independante de la tete d'une entite, separee de la rotation du corps. Cela permet aux entites de regarder des cibles tout en se deplacant dans une direction differente.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/HeadRotation.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `rotation` | Vector3f | Lacet, tangage et roulis de la tete |

**Comment utiliser:**

```java
// Creer une entite avec rotation de tete
holder.addComponent(HeadRotation.getComponentType(), new HeadRotation());

// Faire regarder une position a l'entite
HeadRotation head = store.getComponent(ref, HeadRotation.getComponentType());
Vector3d entityPos = transform.getPosition();
Vector3d targetPos = getTargetPosition();
Vector3d direction = targetPos.subtract(entityPos).normalize();
float yaw = (float) Math.atan2(-direction.getX(), -direction.getZ());
float pitch = (float) Math.asin(direction.getY());
head.setRotation(new Vector3f(pitch, yaw, 0));

// Obtenir la direction du regard comme vecteur unite
Vector3d lookDir = head.getDirection();

// Obtenir l'axe dominant (pour le placement de blocs, etc.)
Axis dominantAxis = head.getAxis();
```

**Notes d'utilisation:**
- Le lacet (yaw) est la rotation horizontale (regarder gauche/droite)
- Le tangage (pitch) est la rotation verticale (regarder haut/bas)
- Le roulis (roll) est la rotation d'inclinaison (rarement utilise pour les tetes)
- `getAxisDirection()` retourne la direction cardinale la plus proche
- Utilise par l'IA pour suivre les cibles de regard independamment du mouvement

---

## Composants de Tag et Marqueur

Ce sont des composants legers qui marquent les entites avec des flags ou categories specifiques.

### HiddenFromAdventurePlayers

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant marqueur `HiddenFromAdventurePlayers` cache une entite des joueurs en Mode Aventure. L'entite reste visible pour les joueurs en mode Creatif ou autres modes. Utilise le pattern singleton.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/HiddenFromAdventurePlayers.java`

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

**Proprietes:**
- Aucune (composant marqueur)

**Comment ajouter/supprimer:**

```java
// Cacher l'entite des joueurs aventure
holder.addComponent(HiddenFromAdventurePlayers.getComponentType(),
    HiddenFromAdventurePlayers.INSTANCE);

// Verifier si l'entite est cachee
Archetype<EntityStore> archetype = store.getArchetype(ref);
boolean isHidden = archetype.contains(HiddenFromAdventurePlayers.getComponentType());

// Rendre l'entite visible a nouveau
commandBuffer.removeComponent(ref, HiddenFromAdventurePlayers.getComponentType());
```

**Notes d'utilisation:**
- Utilise pour les entites de debug, objets editeur-seulement, ou outils admin
- L'entite existe toujours et se traite normalement, juste pas visible
- Utile pour le contenu specifique au mode de jeu
- Combiner avec d'autres systemes de visibilite pour un controle fin

---

### WorldGenId

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `WorldGenId` stocke l'ID de generation du monde pour les entites apparues par la generation du monde. Cela aide a suivre quelle passe de generation a cree l'entite et a prevenir les apparitions en double.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/WorldGenId.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `worldGenId` | int | 0 | ID de passe de generation du monde (0 = pas de world gen) |

**Comment utiliser:**

```java
// Marquer l'entite comme generee par la passe world gen 5
holder.addComponent(WorldGenId.getComponentType(), new WorldGenId(5));

// Verifier si l'entite vient de la generation du monde
WorldGenId worldGen = store.getComponent(ref, WorldGenId.getComponentType());
if (worldGen != null && worldGen.getWorldGenId() != WorldGenId.NON_WORLD_GEN_ID) {
    // L'entite a ete creee par la generation du monde
    int passId = worldGen.getWorldGenId();
}
```

**Notes d'utilisation:**
- `NON_WORLD_GEN_ID` (0) indique que l'entite n'a pas ete apparue par la generation du monde
- Differentes passes de generation ont des IDs uniques
- Utilise pour prevenir la re-generation d'entites dans les zones deja generees
- Lie au composant `FromWorldGen` qui stocke des infos supplementaires de world gen

---

## Composants d'IA et de Comportement

Ces composants supportent le systeme d'IA des PNJ incluant le pathfinding, les roles et les arbres de comportement.

### NPCEntity

**Package:** `com.hypixel.hytale.server.npc.entities`

Le composant `NPCEntity` est un composant complet qui gere le comportement des Personnages Non-Joueurs. Il etend `LivingEntity` et fournit l'IA, le pathfinding, les roles et la gestion d'etat.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/entities/NPCEntity.java`

```java
public class NPCEntity extends LivingEntity implements INonPlayerCharacter {
   public static final BuilderCodec<NPCEntity> CODEC = BuilderCodec.builder(...)
      .addField(new KeyedCodec<>("Env", Codec.STRING), ...)         // Environnement
      .addField(new KeyedCodec<>("HvrPhs", Codec.DOUBLE), ...)      // Phase de vol stationnaire
      .addField(new KeyedCodec<>("HvrHght", Codec.DOUBLE), ...)     // Hauteur de vol stationnaire
      .addField(new KeyedCodec<>("SpawnName", Codec.STRING), ...)   // Nom du role d'apparition
      .addField(new KeyedCodec<>("MdlScl", Codec.DOUBLE), ...)      // Echelle du modele
      .append(new KeyedCodec<>("PathManager", PathManager.CODEC), ...) // Pathfinding
      .addField(new KeyedCodec<>("LeashPos", Vector3d.CODEC), ...)  // Position de laisse
      .addField(new KeyedCodec<>("RoleName", Codec.STRING), ...)    // Role actuel
      .build();

   private Role role;
   private PathManager pathManager;
   private Vector3d leashPoint;
   private float hoverPhase;
   private double hoverHeight;
   private float initialModelScale;
   // ... et plus

   public static ComponentType<EntityStore, NPCEntity> getComponentType();
   public Role getRole();
   public PathManager getPathManager();
   public AlarmStore getAlarmStore();
   // ... et plus de methodes
}
```

**Proprietes Cles:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `role` | Role | Role IA actuel definissant le comportement |
| `pathManager` | PathManager | Gere le pathfinding et la navigation |
| `leashPoint` | Vector3d | Point d'attache pour les PNJ a portee limitee |
| `hoverHeight` | double | Decalage de hauteur pour les PNJ volants |
| `initialModelScale` | float | Facteur d'echelle du modele |
| `environmentIndex` | int | Reference vers l'asset d'environnement |

**Classes Liees:**

- **Role**: Definit le comportement du PNJ, le combat, les transitions d'etat et les instructions
- **PathManager**: Gere le pathfinding A* et la navigation
- **AlarmStore**: Gere les evenements temporises et les alarmes pour le PNJ

**Comment utiliser:**

```java
// Obtenir le composant PNJ
NPCEntity npc = store.getComponent(ref, NPCEntity.getComponentType());

// Acceder au role (definition du comportement)
Role role = npc.getRole();
if (role != null) {
    String roleName = role.getRoleName();
    boolean isHostile = !role.isFriendly(ref, componentAccessor);
}

// Acceder au pathfinding
PathManager pathManager = npc.getPathManager();
if (pathManager.hasPath()) {
    Vector3d nextWaypoint = pathManager.getNextWaypoint();
}

// Verifier l'etat du PNJ
if (npc.isDespawning()) {
    // Le PNJ est en cours de suppression
}

// Definir le point de laisse (limiter la portee de mouvement du PNJ)
npc.setLeashPoint(new Vector3d(100, 64, 200));
```

**Notes d'utilisation:**
- NPCEntity est un composant de haut niveau combinant de nombreuses fonctionnalites d'IA
- Les roles definissent le comportement a travers des arbres d'instructions et des machines d'etat
- PathManager utilise l'algorithme A* pour la navigation
- Supporte le regroupement, la separation et le comportement de groupe
- Inclut le support de combat, le suivi de cibles et la gestion des interactions
- L'environnement affecte le comportement du PNJ (jour/nuit, meteo, biome)

---

### PathManager

**Package:** `com.hypixel.hytale.server.npc.entities`

La classe `PathManager` gere le pathfinding pour les entites PNJ. Elle stocke le chemin actuel, gere les demandes de calcul de chemin et fournit des utilitaires de navigation.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/entities/PathManager.java`

```java
public class PathManager {
   public static final BuilderCodec<PathManager> CODEC = ...;

   private Path currentPath;
   private int currentWaypointIndex;
   private boolean isPathPending;
   // ... etat de pathfinding

   public boolean hasPath();
   public Path getCurrentPath();
   public Vector3d getNextWaypoint();
   public void setPath(Path path);
   public void clearPath();
   public boolean advanceWaypoint();
   public float getRemainingDistance();
}
```

**Methodes Cles:**

| Methode | Description |
|---------|-------------|
| `hasPath()` | Retourne true si le PNJ a un chemin actif |
| `getCurrentPath()` | Obtient le chemin de navigation actuel |
| `getNextWaypoint()` | Obtient la prochaine position vers laquelle se deplacer |
| `setPath(Path)` | Definit un nouveau chemin pour le PNJ |
| `clearPath()` | Efface le chemin actuel |
| `advanceWaypoint()` | Passe au prochain waypoint du chemin |
| `getRemainingDistance()` | Obtient la distance restante jusqu'a la destination |

**Notes d'utilisation:**
- Les chemins sont calcules en utilisant l'algorithme A* dans `AStarBase`
- Supporte la navigation au sol, en vol et en nage
- Les waypoints sont des positions monde entre lesquelles le PNJ se deplace
- Les demandes de chemin peuvent etre asynchrones pour eviter le blocage
- Fonctionne avec les controleurs de mouvement pour le deplacement reel

---

## Composants du Systeme de Montures

Les composants suivants font partie du systeme de montures d'Hytale, permettant aux entites de monter d'autres entites ou des blocs (comme des chaises et des wagonnets).

### MountedComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

Le `MountedComponent` est ajoute a une entite lorsqu'elle monte sur une autre entite ou un bloc. Il suit ce sur quoi l'entite est montee, le decalage d'attachement et le type de controleur.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/MountedComponent.java`

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

   // Constructeurs pour monture d'entite et de bloc
   public MountedComponent(Ref<EntityStore> mountedToEntity, Vector3f attachmentOffset, MountController controller);
   public MountedComponent(Ref<ChunkStore> mountedToBlock, Vector3f attachmentOffset, BlockMountType blockMountType);
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `mountedToEntity` | `Ref<EntityStore>` | Reference a l'entite montee (null si monture bloc) |
| `mountedToBlock` | `Ref<ChunkStore>` | Reference au bloc sur lequel on est assis (null si monture entite) |
| `controller` | `MountController` | Type de controle de monture (ex: `Rideable`, `BlockMount`) |
| `blockMountType` | `BlockMountType` | Type de monture bloc (ex: `Seat`, `Bed`) |
| `attachmentOffset` | `Vector3f` | Decalage depuis le point de montage |
| `mountStartMs` | long | Horodatage du debut de la monture |

**Comment utiliser:**

```java
// Monter une entite sur une autre entite
MountedComponent mounted = new MountedComponent(
    mountRef,                    // Entite a monter
    new Vector3f(0, 1.5f, 0),   // Decalage du siege
    MountController.Rideable
);
commandBuffer.addComponent(riderRef, MountedComponent.getComponentType(), mounted);

// Monter sur un bloc (chaise/lit)
MountedComponent blockMount = new MountedComponent(
    blockRef,                    // Reference du bloc
    seatOffset,                  // Decalage d'attachement
    BlockMountType.Seat
);

// Verifier la duree de montage
long durationMs = mounted.getMountedDurationMs();
```

**Notes d'utilisation:**
- Une entite ne peut avoir qu'un seul `MountedComponent` a la fois
- La synchronisation reseau est automatique lorsque le flag outdated est defini
- Utilise pour les entites montables (chevaux) et les montures de blocs (chaises, lits)

---

### MountedByComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

Le `MountedByComponent` est ajoute a une entite qui peut transporter des passagers. Il suit toutes les entites actuellement montees dessus.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/MountedByComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `passengers` | `List<Ref<EntityStore>>` | Liste des entites actuellement montees sur cette entite |

**Comment utiliser:**

```java
// Ajouter le composant pour rendre l'entite montable
holder.addComponent(MountedByComponent.getComponentType(), new MountedByComponent());

// Ajouter un passager
MountedByComponent mountedBy = store.getComponent(horseRef, MountedByComponent.getComponentType());
mountedBy.addPassenger(playerRef);

// Obtenir tous les passagers
List<Ref<EntityStore>> passengers = mountedBy.getPassengers();
for (Ref<EntityStore> passenger : passengers) {
    // Traiter chaque cavalier
}

// API fluide pour l'initialisation
MountedByComponent component = new MountedByComponent()
    .withPassenger(riderRef);
```

**Notes d'utilisation:**
- Supprime automatiquement les references de passagers invalides (supprimes)
- Plusieurs passagers supportes pour vehicules/bateaux
- Couple avec `MountedComponent` sur les entites montees

---

### NPCMountComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

Le `NPCMountComponent` marque un PNJ comme monture (creature montable). Il stocke l'index du role original pour que le PNJ puisse reprendre son comportement normal apres demontage.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/NPCMountComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `originalRoleIndex` | int | Index du role IA original du PNJ |
| `ownerPlayerRef` | `PlayerRef` | Le joueur qui possede/a apprivoise cette monture |
| `anchorX/Y/Z` | float | Point d'ancrage pour la monture |

**Comment utiliser:**

```java
// Convertir un PNJ en monture
NPCMountComponent mountComp = new NPCMountComponent();
mountComp.setOriginalRoleIndex(npc.getRole().getIndex());
mountComp.setOwnerPlayerRef(playerRef);
commandBuffer.addComponent(npcRef, NPCMountComponent.getComponentType(), mountComp);

// Restaurer le role original apres demontage
int originalRole = mountComp.getOriginalRoleIndex();
```

**Notes d'utilisation:**
- Serialise avec l'entite pour la persistance
- Le suivi du proprietaire permet les mecaniques de rappel/apprivoisement de monture
- Le point d'ancrage peut limiter la portee d'errance de la monture

---

### BlockMountComponent

**Package:** `com.hypixel.hytale.builtin.mounts`

Le `BlockMountComponent` est attache a un chunk pour suivre les places assises basees sur les blocs (chaises, bancs, lits). Il gere plusieurs positions de siege au sein d'un seul bloc.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/BlockMountComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `type` | `BlockMountType` | Type de monture bloc (Seat, Bed, etc.) |
| `blockPos` | `Vector3i` | Position monde du bloc |
| `expectedBlockType` | `BlockType` | Type de bloc attendu pour validation |
| `expectedRotation` | int | Rotation de bloc attendue |

**Comment utiliser:**

```java
// Creer une monture bloc pour une chaise
BlockMountComponent chair = new BlockMountComponent(
    BlockMountType.Seat,
    blockPosition,
    chairBlockType,
    blockRotation
);

// Trouver et asseoir l'entite au siege disponible le plus proche
BlockMountPoint seat = chair.findAvailableSeat(blockPos, seatChoices, clickPos);
if (seat != null) {
    chair.putSeatedEntity(seat, playerRef);
}

// Retirer l'entite du siege
chair.removeSeatedEntity(playerRef);

// Verifier si la monture bloc est vide
if (chair.isDead()) {
    // Retirer le composant - plus d'entites assises
}
```

**Notes d'utilisation:**
- Stocke dans `ChunkStore` (composants de bloc), pas `EntityStore`
- Supporte plusieurs positions de siege par bloc (bancs, canapes)
- `findAvailableSeat` retourne le siege inoccupe le plus proche de la position du clic
- Nettoie automatiquement les references d'entites invalides

---

### MinecartComponent

**Package:** `com.hypixel.hytale.builtin.mounts.minecart`

Le `MinecartComponent` identifie une entite comme un wagonnet. Il suit les degats de coup pour la destruction et l'item source pour les drops.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/mounts/minecart/MinecartComponent.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `numberOfHits` | int | 0 | Nombre de coups recus (pour destruction) |
| `lastHit` | `Instant` | null | Moment du dernier coup |
| `sourceItem` | String | "Rail_Kart" | ID de l'item laisse a la destruction |

**Comment utiliser:**

```java
// Creer une entite wagonnet
MinecartComponent minecart = new MinecartComponent("Custom_Minecart");
holder.addComponent(MinecartComponent.getComponentType(), minecart);

// Suivre les degats
minecart.setNumberOfHits(minecart.getNumberOfHits() + 1);
minecart.setLastHit(Instant.now());

// Verifier si doit casser
if (minecart.getNumberOfHits() >= BREAK_THRESHOLD) {
    // Lacher l'item source et supprimer l'entite
    String dropItem = minecart.getSourceItem();
}
```

**Notes d'utilisation:**
- Les wagonnets suivent automatiquement les blocs de rail
- Le systeme de coups multiples permet une destruction par coups
- L'item source determine ce qui est lache lorsque le wagonnet est detruit

---

## Composants du Systeme de Deployables

Les deployables sont des entites placees par les joueurs comme des tourelles, pieges et autres dispositifs automatises.

### DeployableComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

Le `DeployableComponent` marque une entite comme un dispositif deployable. Il suit le proprietaire, la configuration, le moment de spawn et des flags personnalises pour l'etat du deployable.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `config` | `DeployableConfig` | Asset de configuration definissant le comportement |
| `owner` | `Ref<EntityStore>` | Reference a l'entite qui a deploye |
| `ownerUUID` | `UUID` | UUID du proprietaire pour la persistance |
| `spawnInstant` | `Instant` | Moment ou le deployable a ete place |
| `timeSinceLastAttack` | float | Timer de cooldown pour les attaques |
| `spawnFace` | String | Sur quelle face le deployable a ete place |
| `flags` | `Map<DeployableFlag, Integer>` | Flags d'etat personnalises |

**Enum DeployableFlag:**

| Flag | Description |
|------|-------------|
| `STATE` | Etat actuel de la machine d'etat |
| `LIVE` | Si le deployable est actif |
| `BURST_SHOTS` | Tirs restants en rafale |
| `TRIGGERED` | Si la condition de declenchement a ete remplie |

**Comment utiliser:**

```java
// Creer un deployable
DeployableComponent deployable = new DeployableComponent();
deployable.init(playerRef, store, config, Instant.now(), "up");
holder.addComponent(DeployableComponent.getComponentType(), deployable);

// Suivre le cooldown d'attaque
deployable.incrementTimeSinceLastAttack(deltaTime);
if (deployable.getTimeSinceLastAttack() >= config.getAttackCooldown()) {
    // Peut attaquer
    deployable.setTimeSinceLastAttack(0);
}

// Utiliser les flags pour l'etat personnalise
deployable.setFlag(DeployableFlag.BURST_SHOTS, 3);
int remaining = deployable.getFlag(DeployableFlag.BURST_SHOTS);
```

**Notes d'utilisation:**
- Les deployables tickent via leur `DeployableConfig` qui definit le comportement
- Le premier tick execute la logique d'initialisation (ex: jouer l'animation de spawn)
- Le suivi du proprietaire permet l'attribution correcte des degats/kills

---

### DeployableOwnerComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

Le `DeployableOwnerComponent` est attache aux entites qui possedent des deployables. Il suit tous les deployables places par l'entite et applique les limites.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableOwnerComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `deployables` | `List<Pair<String, Ref<EntityStore>>>` | Tous les deployables possedes |
| `deployableCountPerId` | `Object2IntMap<String>` | Compte par type de deployable |

**Comment utiliser:**

```java
// Obtenir le composant proprietaire
DeployableOwnerComponent owner = store.getComponent(playerRef,
    DeployableOwnerComponent.getComponentType());

// Enregistrer un nouveau deployable
owner.registerDeployable(playerRef, deployableComp, "turret", turretRef, store);

// Desenregistrer a la destruction
owner.deRegisterDeployable("turret", turretRef);
```

**Notes d'utilisation:**
- Detruit automatiquement les deployables les plus anciens lorsque les limites sont depassees
- Limites par type et globales depuis `GameplayConfig`
- Gere le nettoyage a la suppression de l'entite

---

### DeployableProjectileComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

Le `DeployableProjectileComponent` marque un projectile comme tire par un deployable. Il suit la position precedente pour la detection de collision.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableProjectileComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `previousTickPosition` | `Vector3d` | Position au tick precedent |

**Notes d'utilisation:**
- Utilise pour la detection de collision balayee (ligne de la position precedente a actuelle)
- Essentiel pour les projectiles rapides qui pourraient traverser les cibles

---

### DeployableProjectileShooterComponent

**Package:** `com.hypixel.hytale.builtin.deployables.component`

Le `DeployableProjectileShooterComponent` est ajoute aux deployables qui peuvent tirer des projectiles. Il suit les projectiles actifs et la cible actuelle.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/deployables/component/DeployableProjectileShooterComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `projectiles` | `List<Ref<EntityStore>>` | Projectiles actuellement actifs |
| `activeTarget` | `Ref<EntityStore>` | Entite cible actuelle |

**Notes d'utilisation:**
- Gere la duree de vie des projectiles tires
- Suivi de cible pour les tourelles a visee automatique
- Nettoyage lorsque les projectiles touchent ou disparaissent

---

## Composants du Systeme d'Aventure

Ces composants font partie des fonctionnalites du mode aventure d'Hytale incluant les quetes, la reputation et l'agriculture.

### ObjectiveHistoryComponent

**Package:** `com.hypixel.hytale.builtin.adventure.objectives.components`

Le `ObjectiveHistoryComponent` suit la progression et l'historique de completion des quetes/objectifs d'un joueur.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/objectives/components/ObjectiveHistoryComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `objectiveHistoryMap` | `Map<String, ObjectiveHistoryData>` | Historique par ID d'objectif |
| `objectiveLineHistoryMap` | `Map<String, ObjectiveLineHistoryData>` | Historique par ligne d'objectif |

**Notes d'utilisation:**
- Persiste avec les donnees du joueur
- Suit le statut de completion, les horodatages et la progression
- Utilise pour l'interface des quetes et les verifications de progression

---

### ReputationGroupComponent

**Package:** `com.hypixel.hytale.builtin.adventure.reputation`

Le `ReputationGroupComponent` assigne une entite a un groupe de reputation, affectant la facon dont les factions la percoivent.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/reputation/ReputationGroupComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `reputationGroupId` | String | ID du groupe de reputation (faction) |

**Comment utiliser:**

```java
// Assigner l'entite a une faction
ReputationGroupComponent rep = new ReputationGroupComponent("hytale:village_faction");
holder.addComponent(ReputationGroupComponent.getComponentType(), rep);

// Verifier la faction pour les decisions d'IA
String faction = rep.getReputationGroupId();
boolean isFriendly = reputationSystem.areFactionsFriendly(playerFaction, faction);
```

**Notes d'utilisation:**
- Les PNJ utilisent ceci pour determiner les relations ami/ennemi
- Les actions du joueur affectent la reputation avec differents groupes
- Lie au systeme de reputation/faction

---

### CoopResidentComponent

**Package:** `com.hypixel.hytale.builtin.adventure.farming.component`

Le `CoopResidentComponent` marque une entite comme resident d'un poulailler ou structure agricole similaire.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/farming/component/CoopResidentComponent.java`

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

**Proprietes:**

| Propriete | Type | Defaut | Description |
|-----------|------|--------|-------------|
| `coopLocation` | `Vector3i` | (0,0,0) | Position du poulailler d'origine |
| `markedForDespawn` | boolean | false | Si l'entite doit disparaitre |

**Notes d'utilisation:**
- Utilise pour les poulets, animaux de ferme qui retournent aux structures
- Localisation du poulailler pour le pathfinding "maison"
- Marquage de despawn pour le nettoyage lorsque le poulailler est detruit

---

## Composants du Systeme de Spawn

Composants lies au spawn des PNJ et entites.

### SpawnSuppressionComponent

**Package:** `com.hypixel.hytale.server.spawning.suppression.component`

Le `SpawnSuppressionComponent` marque une entite comme supprimant les spawns dans une zone (comme les torches empechant le spawn de mobs).

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/spawning/suppression/component/SpawnSuppressionComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `spawnSuppression` | String | ID de l'asset de suppression de spawn |

**Comment utiliser:**

```java
// Ajouter la suppression de spawn a une entite source de lumiere
SpawnSuppressionComponent suppression = new SpawnSuppressionComponent("hytale:torch_suppression");
holder.addComponent(SpawnSuppressionComponent.getComponentType(), suppression);
```

**Notes d'utilisation:**
- Reference un asset `SpawnSuppression` definissant le rayon et les conditions
- Utilise par les torches, feux de camp et autres sources de lumiere
- Empeche le spawn de mobs hostiles dans la zone

---

## Composants du Systeme PNJ

### StepComponent

**Package:** `com.hypixel.hytale.server.npc.components`

Le `StepComponent` controle le taux de tick pour le traitement de l'IA des PNJ, permettant des mises a jour plus lentes pour les PNJ distants ou peu importants.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/StepComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `tickLength` | float | Temps entre les mises a jour de l'IA en secondes |

**Notes d'utilisation:**
- Tick length plus eleve = mises a jour moins frequentes = meilleures performances
- Les PNJ distants peuvent utiliser des tick lengths plus longs
- Immuable une fois cree

---

### FailedSpawnComponent

**Package:** `com.hypixel.hytale.server.npc.components`

Le `FailedSpawnComponent` est un composant marqueur ajoute lorsqu'un PNJ echoue a spawn correctement. Utilise pour le nettoyage et le debogage.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/FailedSpawnComponent.java`

```java
public class FailedSpawnComponent implements Component<EntityStore> {
   public static ComponentType<EntityStore, FailedSpawnComponent> getComponentType() {
      return NPCPlugin.get().getFailedSpawnComponentType();
   }
}
```

**Proprietes:**
- Aucune (composant marqueur)

**Notes d'utilisation:**
- Les systemes verifient ceci pour nettoyer les spawns echoues
- Utile pour deboguer les problemes de spawn

---

## Composants Utilitaires

### SnapshotBuffer

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le composant `SnapshotBuffer` stocke les donnees historiques de position/rotation d'une entite. Utilise pour la compensation de lag et le retour en arriere de l'etat de l'entite.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/SnapshotBuffer.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `snapshots` | `EntitySnapshot[]` | Buffer circulaire de snapshots historiques |
| `currentTickIndex` | int | Tick serveur actuel |
| `oldestTickIndex` | int | Tick du snapshot le plus ancien disponible |

**Comment utiliser:**

```java
// Initialiser le buffer pour 20 ticks d'historique
SnapshotBuffer buffer = new SnapshotBuffer();
buffer.resize(20);

// Stocker un snapshot a chaque tick
buffer.storeSnapshot(tickIndex, position, rotation);

// Recuperer la position historique pour la compensation de lag
EntitySnapshot historical = buffer.getSnapshotClamped(tickIndex - playerLatencyTicks);
Vector3d pastPosition = historical.getPosition();
```

**Notes d'utilisation:**
- Essentiel pour la detection de hit cote serveur avec compensation de lag
- Le buffer circulaire ecrase automatiquement les entrees les plus anciennes
- `getSnapshotClamped` retourne le plus ancien si le tick demande est trop vieux

---

### ApplyRandomSkinPersistedComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.player`

Le `ApplyRandomSkinPersistedComponent` est un composant marqueur indiquant qu'une entite devrait avoir un skin aleatoire applique au chargement.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/player/ApplyRandomSkinPersistedComponent.java`

```java
public class ApplyRandomSkinPersistedComponent implements Component<EntityStore> {
   public static final ApplyRandomSkinPersistedComponent INSTANCE = new ApplyRandomSkinPersistedComponent();
   public static final BuilderCodec<ApplyRandomSkinPersistedComponent> CODEC = ...;

   public static ComponentType<EntityStore, ApplyRandomSkinPersistedComponent> getComponentType() {
      return EntityModule.get().getApplyRandomSkinPersistedComponent();
   }
}
```

**Proprietes:**
- Aucune (composant marqueur, pattern singleton)

**Notes d'utilisation:**
- Ajoute aux PNJ qui devraient avoir des apparences variees
- Le skin est applique depuis un pool au chargement de l'entite
- Persiste pour que le skin reste coherent entre les sauvegardes

---

### PlacedByInteractionComponent

**Package:** `com.hypixel.hytale.server.core.modules.interaction.components`

Le `PlacedByInteractionComponent` est un composant de chunk qui suit qui a place un bloc. Utilise pour les permissions, la propriete et l'attribution.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/interaction/components/PlacedByInteractionComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `whoPlacedUuid` | UUID | UUID de l'entite qui a place le bloc |

**Comment utiliser:**

```java
// Quand le joueur place un bloc
PlacedByInteractionComponent placed = new PlacedByInteractionComponent(playerUuid);
chunkCommandBuffer.addComponent(blockRef, PlacedByInteractionComponent.getComponentType(), placed);

// Verifier qui a place un bloc
PlacedByInteractionComponent placed = chunkStore.getComponent(blockRef,
    PlacedByInteractionComponent.getComponentType());
if (placed != null) {
    UUID placer = placed.getWhoPlacedUuid();
}
```

**Notes d'utilisation:**
- Stocke dans `ChunkStore` (composants de bloc)
- Utilise pour les systemes de reclamation de terrain, protection contre le griefing
- Persiste avec les donnees de chunk

---

### AmbientEmitterComponent

**Package:** `com.hypixel.hytale.builtin.ambience.components`

Le `AmbientEmitterComponent` fait qu'une entite emet des sons ambiants. Utilise pour l'audio environnemental comme les cascades, le vent ou les machines.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/ambience/components/AmbientEmitterComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `soundEventId` | String | ID de l'evenement sonore a jouer |
| `spawnedEmitter` | `Ref<EntityStore>` | Reference a l'entite emetteur spawnee |

**Comment utiliser:**

```java
// Creer un emetteur de son ambiant
AmbientEmitterComponent ambient = new AmbientEmitterComponent();
ambient.setSoundEventId("hytale:waterfall_ambient");
holder.addComponent(AmbientEmitterComponent.getComponentType(), ambient);
```

**Notes d'utilisation:**
- Le son joue en boucle a la position de l'entite
- Utilise pour les sources audio environnementales statiques
- Peut etre attache aux entites de bloc ou aux marqueurs invisibles

---

### AmbienceTracker

**Package:** `com.hypixel.hytale.builtin.ambience.components`

Le composant `AmbienceTracker` suit la musique environnementale par joueur et synchronise avec le client. Gere les remplacements de musique forces et les changements de musique bases sur l'environnement.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/ambience/components/AmbienceTracker.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `forcedMusicIndex` | int | Index de remplacement de musique force (0 = pas de remplacement) |
| `musicPacket` | UpdateEnvironmentMusic | Paquet reutilisable pour la synchronisation reseau |

**Notes d'utilisation:**
- Attache aux joueurs pour suivre leur etat musical actuel
- L'index de musique force remplace la selection basee sur l'environnement
- La musique change en douceur selon l'environnement du joueur

---

### WeatherTracker

**Package:** `com.hypixel.hytale.builtin.weather.components`

Le composant `WeatherTracker` suit l'etat meteo par joueur et synchronise les transitions meteo avec le client selon l'environnement.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/weather/components/WeatherTracker.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `environmentId` | int | ID d'environnement actuel pour la recherche meteo |
| `previousBlockPosition` | Vector3i | Derniere position de bloc connue pour la detection de changement |
| `firstSendForWorld` | boolean | Indicateur pour la synchronisation meteo initiale du monde |

**Notes d'utilisation:**
- La meteo se met a jour quand le joueur se deplace vers un environnement different
- Transitions douces avec duree configurable
- Supporte le remplacement meteo force via WeatherResource

---

### TeleportHistory

**Package:** `com.hypixel.hytale.builtin.teleport.components`

Le composant `TeleportHistory` maintient un historique de navigation precedent/suivant comme un navigateur pour les teleportations de joueur. Supporte le nommage des points de repere et la teleportation entre mondes.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/teleport/components/TeleportHistory.java`

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
      private final String message;  // Nom optionnel du point de repere
   }
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `back` | `Deque<Waypoint>` | Pile des emplacements precedents |
| `forward` | `Deque<Waypoint>` | Pile des emplacements suivants (apres retour arriere) |

**Comment utiliser:**

```java
// Enregistrer la position actuelle avant la teleportation
TeleportHistory history = store.getComponent(playerRef, TeleportHistory.getComponentType());
history.append(world, currentPos, currentRotation, "Point de repere nomme");

// Revenir dans l'historique
history.back(playerRef, 1);  // Revenir de 1 etape

// Avancer dans l'historique
history.forward(playerRef, 1);  // Avancer de 1 etape
```

**Notes d'utilisation:**
- Maximum 100 entrees dans l'historique (les plus anciennes sont supprimees)
- L'historique suivant est efface lors de l'ajout de nouveaux points
- Supporte la navigation entre mondes
- Affiche des messages localises pour le retour de teleportation

---

### PortalDevice

**Package:** `com.hypixel.hytale.builtin.portals.components`

Le `PortalDevice` est un composant de chunk qui stocke la configuration de bloc de portail. Lie les portails aux mondes de destination et definit l'apparence du portail.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/portals/components/PortalDevice.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `config` | PortalDeviceConfig | Configuration du comportement du portail |
| `baseBlockTypeKey` | String | ID du type de bloc pour le cadre du portail |
| `destinationWorldUuid` | UUID | Monde cible pour la teleportation |

**Notes d'utilisation:**
- Stocke dans `ChunkStore` (composants de bloc)
- Persiste avec les donnees du monde
- Fonctionne avec PortalDeviceConfig pour la personnalisation du comportement

---

### Teleporter

**Package:** `com.hypixel.hytale.builtin.adventure.teleporter.component`

Le `Teleporter` est un composant de chunk pour les blocs teleporteurs. Supporte la destination via coordonnees, noms de warp ou transformations relatives.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/teleporter/component/Teleporter.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `worldUuid` | UUID | Monde cible (null = meme monde) |
| `transform` | Transform | Position/rotation cible |
| `relativeMask` | byte | Indicateurs binaires pour les modes de coordonnees relatives |
| `warp` | String | Point de warp nomme (alternative aux coordonnees) |
| `warpNameWordListKey` | String | Liste de mots pour les noms de warp aleatoires |

**Notes d'utilisation:**
- Supporte la teleportation absolue et relative
- Peut utiliser des warps nommes au lieu de coordonnees
- Le masque relatif permet de melanger les axes absolus et relatifs

---

### PlayerSomnolence

**Package:** `com.hypixel.hytale.builtin.beds.sleep.components`

Le composant `PlayerSomnolence` suit l'etat de sommeil d'un joueur. Utilise par le systeme de lit pour gerer la progression du sommeil.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/beds/sleep/components/PlayerSomnolence.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `state` | PlayerSleep | Etat de sommeil actuel (eveille, s'endormant, dormant, se reveillant) |

**Notes d'utilisation:**
- Machine a etats pour la progression du sommeil
- Instance AWAKE partagee pour l'etat par defaut
- Fonctionne avec SleepTracker pour la synchronisation reseau

---

### SleepTracker

**Package:** `com.hypixel.hytale.builtin.beds.sleep.components`

Le composant `SleepTracker` gere la synchronisation reseau de l'etat de sommeil. Empeche les envois de paquets en double.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/beds/sleep/components/SleepTracker.java`

```java
public class SleepTracker implements Component<EntityStore> {
   private UpdateSleepState lastSentPacket = new UpdateSleepState(false, false, null, null);

   public static ComponentType<EntityStore, SleepTracker> getComponentType() {
      return BedsPlugin.getInstance().getSleepTrackerComponentType();
   }

   public UpdateSleepState generatePacketToSend(UpdateSleepState state);
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `lastSentPacket` | UpdateSleepState | Cache du dernier etat envoye pour la detection delta |

**Notes d'utilisation:**
- Optimise le trafic reseau en envoyant uniquement les etats changes
- Fonctionne avec PlayerSomnolence pour la logique de sommeil
- Retourne null si l'etat n'a pas change

---

### VoidEvent

**Package:** `com.hypixel.hytale.builtin.portals.components.voidevent`

Le composant `VoidEvent` gere les evenements d'invasion de portail du vide. Suit les positions des spawners et l'etape d'invasion actuelle.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/portals/components/voidevent/VoidEvent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `voidSpawners` | SpatialHashGrid | Index spatial des positions des spawners |
| `activeStage` | VoidEventStage | Etape d'invasion actuelle (null = inactive) |

**Notes d'utilisation:**
- Minimum 62 blocs entre les spawners
- Les etapes definissent une difficulte d'invasion croissante
- Configuration chargee depuis la config de gameplay du monde

---

### VoidSpawner

**Package:** `com.hypixel.hytale.builtin.portals.components.voidevent`

Le composant `VoidSpawner` marque une entite comme spawner de portail du vide. Suit les UUID des balises de spawn associees.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/portals/components/voidevent/VoidSpawner.java`

```java
public class VoidSpawner implements Component<EntityStore> {
   private List<UUID> spawnBeaconUuids = new ObjectArrayList<>();

   public static ComponentType<EntityStore, VoidSpawner> getComponentType() {
      return PortalsPlugin.getInstance().getVoidPortalComponentType();
   }

   public List<UUID> getSpawnBeaconUuids();
}
```

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `spawnBeaconUuids` | `List<UUID>` | UUID des balises de spawn associees |

**Notes d'utilisation:**
- Fait partie du systeme d'invasion du vide
- Les balises de spawn determinent quels ennemis apparaissent
- Fonctionne avec VoidEvent pour la gestion des invasions

---

### PlayerMemories

**Package:** `com.hypixel.hytale.builtin.adventure.memories.component`

Le composant `PlayerMemories` stocke les souvenirs d'aventure collectes par les joueurs. Les souvenirs sont utilises pour la progression et le deblocage de contenu.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/adventure/memories/component/PlayerMemories.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `memories` | `Set<Memory>` | Souvenirs collectes |
| `memoriesCapacity` | int | Nombre maximum de souvenirs |

**Comment utiliser:**

```java
PlayerMemories memories = store.getComponent(playerRef, PlayerMemories.getComponentType());
if (memories.recordMemory(newMemory)) {
    // Souvenir enregistre avec succes
}

// Transferer les souvenirs vers un autre conteneur
Set<Memory> collected = new HashSet<>();
memories.takeMemories(collected);  // Supprime du composant
```

**Notes d'utilisation:**
- La capacite limite le nombre de souvenirs pouvant etre conserves
- L'enregistrement echoue si a capacite maximale
- `takeMemories` supprime les souvenirs tout en les retournant
- Persiste avec les donnees du joueur

---

### ParkourCheckpoint

**Package:** `com.hypixel.hytale.builtin.parkour`

Le composant `ParkourCheckpoint` suit la progression d'un joueur dans un parcours de parkour en stockant l'index du checkpoint actuel.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/parkour/ParkourCheckpoint.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `index` | int | Index du checkpoint actuel (base 0) |

**Notes d'utilisation:**
- Attache aux joueurs pendant les parcours de parkour
- L'index s'incremente quand les checkpoints sont atteints
- Utilise pour la determination du point de reapparition
- Persiste pour la reprise du parcours

---

### CraftingManager

**Package:** `com.hypixel.hytale.builtin.crafting.component`

Le composant `CraftingManager` gere les operations d'artisanat pour les joueurs. Gere les travaux d'artisanat en file d'attente, les ameliorations de niveau d'etabli et la consommation de materiaux.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/crafting/component/CraftingManager.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `queuedCraftingJobs` | `BlockingQueue<CraftingJob>` | File d'attente des artisanats en attente |
| `upgradingJob` | BenchUpgradingJob | Amelioration d'etabli actuelle (null si aucune) |
| `x, y, z` | int | Position du bloc d'etabli actuel |
| `blockType` | BlockType | Type de bloc d'etabli actuel |

**Comment utiliser:**

```java
CraftingManager crafting = store.getComponent(playerRef, CraftingManager.getComponentType());

// Definir l'etabli actif
crafting.setBench(x, y, z, benchBlockType);

// Mettre en file d'attente une recette d'artisanat
crafting.queueCraft(ref, store, window, transactionId, recipe, quantity, inputContainer, InputRemovalType.NORMAL);

// Tick pour traiter la file d'attente (appele a chaque frame)
crafting.tick(ref, store, deltaTime);

// Nettoyer lors de la fermeture de l'etabli
crafting.clearBench(ref, store);
```

**Notes d'utilisation:**
- Un seul etabli peut etre actif a la fois
- Supporte l'artisanat temporise avec suivi de progression
- Le niveau d'etabli affecte la vitesse d'artisanat
- Les materiaux sont preleves automatiquement des coffres a proximite
- L'annulation rembourse les materiaux en cours

---

### DisplayNameComponent

**Package:** `com.hypixel.hytale.server.core.modules.entity.component`

Le `DisplayNameComponent` stocke un nom d'affichage personnalise pour les entites. Utilise pour les plaques nominatives et l'affichage UI.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/component/DisplayNameComponent.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `displayName` | Message | Nom d'affichage localisable |

**Notes d'utilisation:**
- Supporte les messages localises avec traductions
- Separe du nom de type d'entite
- Utilise par le composant Nameplate pour le rendu
- Peut inclure du formatage et des parametres

---

### Repulsion

**Package:** `com.hypixel.hytale.server.core.modules.entity.repulsion`

Le composant `Repulsion` definit comment les entites se repoussent mutuellement. Utilise pour la physique de foule et l'evitement de collision.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/core/modules/entity/repulsion/Repulsion.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `repulsionConfigIndex` | int | Index dans l'asset RepulsionConfig |
| `isNetworkOutdated` | boolean | Indicateur de mise a jour pour la synchro reseau |

**Notes d'utilisation:**
- RepulsionConfig definit la force et le rayon
- Fonctionne avec le systeme de physique pour les collisions douces
- Empeche l'empilement/chevauchement d'entites
- L'indicateur reseau optimise la frequence de synchronisation

---

### Flock

**Package:** `com.hypixel.hytale.server.flock`

Le composant `Flock` represente un groupe de PNJ qui coordonnent leur comportement. Suit les donnees de degats de groupe et le leadership.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/flock/Flock.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `flockData` | PersistentFlockData | Configuration et etat persistants du groupe |
| `currentDamageData` | DamageData | Degats subis ce tick |
| `removedStatus` | FlockRemovedStatus | Etat de dissolution |
| `trace` | boolean | Indicateur de tracage de debogage |

**Notes d'utilisation:**
- Attache a une entite "leader" du groupe
- Les membres referencent le groupe via FlockMembership
- Donnees de degats a double tampon pour la securite des threads
- Supporte l'heritage de leadership quand le leader meurt

---

### FlockMembership

**Package:** `com.hypixel.hytale.server.flock`

Le composant `FlockMembership` lie une entite a son groupe. Suit le type d'adhesion (membre, leader, leader interimaire).

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/flock/FlockMembership.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `flockId` | UUID | Identifiant persistant du groupe |
| `membershipType` | Type | Role au sein du groupe |
| `flockRef` | `Ref<EntityStore>` | Reference d'execution a l'entite du groupe |

**Notes d'utilisation:**
- `flockRef` est uniquement pour l'execution, non persiste
- Plusieurs membres peuvent agir comme leader (interimaire)
- Etat JOINING pour les membres nouvellement ajoutes
- Persiste via flockId pour sauvegarde/chargement

---

### TargetMemory

**Package:** `com.hypixel.hytale.builtin.npccombatactionevaluator.memory`

Le composant `TargetMemory` suit la conscience des PNJ des entites amies et hostiles. Utilise par l'evaluation de combat de l'IA.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/npccombatactionevaluator/memory/TargetMemory.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `knownFriendlies` | Int2FloatOpenHashMap | Mapping ID d'entite vers temps de derniere vue |
| `knownHostiles` | Int2FloatOpenHashMap | Mapping ID d'entite vers temps de derniere vue |
| `closestHostile` | `Ref<EntityStore>` | Hostile le plus proche en cache |
| `rememberFor` | float | Duree de memoire en secondes |

**Notes d'utilisation:**
- Les hash maps stockent les ID d'entite avec des horodatages
- Les listes maintiennent des references ordonnees pour l'iteration
- La memoire se degrade selon la duree rememberFor
- L'hostile le plus proche est mis en cache pour des decisions IA rapides

---

### DamageMemory

**Package:** `com.hypixel.hytale.builtin.npccombatactionevaluator.memory`

Le composant `DamageMemory` suit les degats subis par un PNJ. Utilise pour la prise de decision de l'IA comme fuir ou devenir agressif.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/builtin/npccombatactionevaluator/memory/DamageMemory.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `recentDamage` | float | Degats recus recemment (reinitialise periodiquement) |
| `totalCombatDamage` | float | Degats totaux depuis le debut du combat |

**Notes d'utilisation:**
- Les degats recents utilises pour les reactions immediates
- Les degats totaux utilises pour les decisions strategiques (fuir si trop endommage)
- Methodes clear pour les transitions d'etat de combat
- Fonctionne avec les evaluateurs d'IA de combat

---

### Timers

**Package:** `com.hypixel.hytale.server.npc.components`

Le composant `Timers` contient un tableau de minuteurs tickables pour le comportement des PNJ. Utilise par les arbres de comportement pour les actions differees.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/npc/components/Timers.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `timers` | Tickable[] | Tableau d'objets minuteurs |

**Notes d'utilisation:**
- Tableau de taille fixe base sur la definition du PNJ
- Minuteurs tickes a chaque frame
- Utilise pour les cooldowns, delais, actions periodiques
- Fait partie du systeme d'arbre de comportement des PNJ

---

### ChunkSpawnData

**Package:** `com.hypixel.hytale.server.spawning.world.component`

Le `ChunkSpawnData` est un composant de chunk qui suit l'etat de spawn par chunk. Gere les cooldowns de spawn et les donnees de spawn specifiques a l'environnement.

**Fichier source:** `server-analyzer/decompiled/com/hypixel/hytale/server/spawning/world/component/ChunkSpawnData.java`

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

**Proprietes:**

| Propriete | Type | Description |
|-----------|------|-------------|
| `chunkEnvironmentSpawnDataMap` | Int2ObjectMap | ID d'environnement vers donnees de spawn |
| `started` | boolean | Si le spawning a ete initialise |
| `lastSpawn` | long | Horodatage du dernier spawn |

**Notes d'utilisation:**
- Stocke dans `ChunkStore` (donnees au niveau du chunk)
- Les differents environnements ont un suivi de spawn separe
- Le cooldown empeche le spam de spawn
- Initialise paresseusement quand le chunk s'active pour la premiere fois
