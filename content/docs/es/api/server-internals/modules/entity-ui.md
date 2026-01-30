---
id: entity-ui
title: Entity UI System
sidebar_label: Entity UI
sidebar_position: 7
description: Complete documentation of the Hytale entity UI system for health bars, damage indicators, and combat text
---

# Entity UI System

The Entity UI system in Hytale provides visual feedback for entities through health bars, damage indicators, and combat text. This system is built on top of the ECS (Entity Component System) architecture and integrates with the Entity Stats module.

## System Overview

The EntityUIModule manages UI components that are rendered above entities in the game world. These components include:

- **Entity Stat UI** - Health bars and stat displays
- **Combat Text UI** - Floating damage numbers and text indicators

**Source:** `com.hypixel.hytale.server.core.modules.entityui.EntityUIModule`

```java
public class EntityUIModule extends JavaPlugin {
   public static final PluginManifest MANIFEST = PluginManifest.corePlugin(EntityUIModule.class)
       .depends(EntityStatsModule.class).build();

   private ComponentType<EntityStore, UIComponentList> uiComponentListType;

   public static EntityUIModule get() {
      return instance;
   }

   public ComponentType<EntityStore, UIComponentList> getUIComponentListType() {
      return this.uiComponentListType;
   }
}
```

## UI Component Types

Hytale defines two types of entity UI components:

| Type | Class | Description |
|------|-------|-------------|
| `EntityStat` | `EntityStatUIComponent` | Displays stat values (health bars, mana, etc.) |
| `CombatText` | `CombatTextUIComponent` | Floating combat text (damage numbers, status) |

## EntityUIComponent Base Class

All UI components extend the base `EntityUIComponent` class:

```java
public abstract class EntityUIComponent
   implements JsonAssetWithMap<String, IndexedLookupTableAssetMap<String, EntityUIComponent>>,
   NetworkSerializable<com.hypixel.hytale.protocol.EntityUIComponent> {

   protected String id;
   protected AssetExtraInfo.Data data;
   private Vector2f hitboxOffset = new Vector2f(0.0F, 0.0F);
}
```

### Base Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `String` | Unique identifier for the component |
| `HitboxOffset` | `Vector2f` | Offset from the centre of the entity's hitbox to display this component |

## EntityStatUIComponent

The `EntityStatUIComponent` displays entity stats visually, such as health bars:

```java
public class EntityStatUIComponent extends EntityUIComponent {
   public static final BuilderCodec<EntityStatUIComponent> CODEC = BuilderCodec.builder(
         EntityStatUIComponent.class, EntityStatUIComponent::new, EntityUIComponent.ABSTRACT_CODEC
      )
      .appendInherited(
         new KeyedCodec<>("EntityStat", Codec.STRING),
         (config, s) -> config.entityStat = s,
         config -> config.entityStat,
         (config, parent) -> config.entityStat = parent.entityStat
      )
      .addValidator(Validators.nonNull())
      .addValidator(Validators.nonEmptyString())
      .addValidator(EntityStatType.VALIDATOR_CACHE.getValidator())
      .documentation("The entity stat to represent.")
      .add()
      .afterDecode(config -> config.entityStatIndex = EntityStatType.getAssetMap().getIndex(config.entityStat))
      .build();

   protected String entityStat;
   protected int entityStatIndex;
}
```

### EntityStatUIComponent Properties

| Property | Type | Description |
|----------|------|-------------|
| `EntityStat` | `String` | The entity stat to represent (e.g., "Health", "Mana") |

### JSON Example

```json
{
  "Type": "EntityStat",
  "EntityStat": "Health",
  "HitboxOffset": { "x": 0.0, "y": 1.5 }
}
```

## CombatTextUIComponent

The `CombatTextUIComponent` displays floating combat text for damage numbers and status effects:

```java
public class CombatTextUIComponent extends EntityUIComponent {
   private static final float DEFAULT_FONT_SIZE = 68.0F;
   private static final Color DEFAULT_TEXT_COLOR = new Color((byte)-1, (byte)-1, (byte)-1);

   private RangeVector2f randomPositionOffsetRange;
   private float viewportMargin;
   private float duration;
   private float hitAngleModifierStrength = 1.0F;
   private float fontSize = 68.0F;
   private Color textColor = DEFAULT_TEXT_COLOR;
   private CombatTextUIComponentAnimationEvent[] animationEvents;
}
```

### CombatTextUIComponent Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `RandomPositionOffsetRange` | `RangeVector2f` | - | Maximum range for randomly offsetting text from starting position |
| `ViewportMargin` | `float` | - | Minimum distance (px) from viewport edges for text clamping (0-200) |
| `Duration` | `float` | - | Duration (seconds) for which text should be visible (0.1-10.0) |
| `HitAngleModifierStrength` | `float` | 1.0 | Strength of X axis position modifier based on melee attack angle (0-10) |
| `FontSize` | `float` | 68.0 | Font size for text instances |
| `TextColor` | `Color` | White | Text color (RGB) |
| `AnimationEvents` | `Array` | - | Animation events for scale, position, and opacity |

### JSON Example

```json
{
  "Type": "CombatText",
  "RandomPositionOffsetRange": { "min": { "x": -10, "y": -5 }, "max": { "x": 10, "y": 5 } },
  "ViewportMargin": 20.0,
  "Duration": 1.5,
  "HitAngleModifierStrength": 1.0,
  "FontSize": 72.0,
  "TextColor": { "r": 255, "g": 0, "b": 0 },
  "AnimationEvents": [
    {
      "Type": "Scale",
      "StartAt": 0.0,
      "EndAt": 0.2,
      "StartScale": 0.0,
      "EndScale": 1.0
    },
    {
      "Type": "Position",
      "StartAt": 0.0,
      "EndAt": 1.0,
      "PositionOffset": { "x": 0, "y": 50 }
    },
    {
      "Type": "Opacity",
      "StartAt": 0.7,
      "EndAt": 1.0,
      "StartOpacity": 1.0,
      "EndOpacity": 0.0
    }
  ]
}
```

## Animation Events

Combat text supports three types of animation events that control how text appears and moves:

### Scale Animation Event

Controls the scaling of combat text over time:

```java
public class CombatTextUIComponentScaleAnimationEvent extends CombatTextUIComponentAnimationEvent {
   private float startScale;
   private float endScale;
}
```

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `StartAt` | `float` | 0.0-1.0 | Percentage of duration when animation starts |
| `EndAt` | `float` | 0.0-1.0 | Percentage of duration when animation ends |
| `StartScale` | `float` | 0.0-1.0 | Scale before animation begins |
| `EndScale` | `float` | 0.0-1.0 | Scale at end of animation |

### Position Animation Event

Controls the movement of combat text:

```java
public class CombatTextUIComponentPositionAnimationEvent extends CombatTextUIComponentAnimationEvent {
   private Vector2f positionOffset;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `StartAt` | `float` | Percentage of duration when animation starts |
| `EndAt` | `float` | Percentage of duration when animation ends |
| `PositionOffset` | `Vector2f` | Offset from starting position to animate to |

### Opacity Animation Event

Controls the transparency of combat text:

```java
public class CombatTextUIComponentOpacityAnimationEvent extends CombatTextUIComponentAnimationEvent {
   private float startOpacity;
   private float endOpacity;
}
```

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `StartAt` | `float` | 0.0-1.0 | Percentage of duration when animation starts |
| `EndAt` | `float` | 0.0-1.0 | Percentage of duration when animation ends |
| `StartOpacity` | `float` | 0.0-1.0 | Opacity before animation begins |
| `EndOpacity` | `float` | 0.0-1.0 | Opacity at end of animation |

## UIComponentList

The `UIComponentList` is an ECS component that stores all UI components assigned to an entity:

```java
public class UIComponentList implements Component<EntityStore> {
   public static final BuilderCodec<UIComponentList> CODEC = BuilderCodec.builder(UIComponentList.class, UIComponentList::new)
      .append(new KeyedCodec<>("Components", Codec.STRING_ARRAY), (list, v) -> list.components = v, list -> list.components)
      .add()
      .afterDecode(list -> {
         list.componentIds = ArrayUtil.EMPTY_INT_ARRAY;
         list.update();
      })
      .build();

   protected String[] components;
   protected int[] componentIds;

   public static ComponentType<EntityStore, UIComponentList> getComponentType() {
      return EntityUIModule.get().getUIComponentListType();
   }

   public int[] getComponentIds() {
      return this.componentIds;
   }
}
```

### Getting an Entity's UI Components

```java
// Get the component type
ComponentType<EntityStore, UIComponentList> componentType = UIComponentList.getComponentType();

// Get an entity's UI component list
UIComponentList uiList = store.getComponent(entityRef, componentType);

// Get the component IDs
int[] componentIds = uiList.getComponentIds();
```

## UI Component Systems

The EntityUIModule registers three ECS systems for managing UI components:

### Setup System

Automatically adds `UIComponentList` to living entities when they are spawned:

```java
public static class Setup extends HolderSystem<EntityStore> {
   @Override
   public void onEntityAdd(@Nonnull Holder<EntityStore> holder, @Nonnull AddReason reason, @Nonnull Store<EntityStore> store) {
      UIComponentList components = holder.getComponent(this.uiComponentListComponentType);
      if (components == null) {
         components = holder.ensureAndGetComponent(this.uiComponentListComponentType);
         components.update();
      }
   }

   @Nonnull
   @Override
   public Query<EntityStore> getQuery() {
      return AllLegacyLivingEntityTypesQuery.INSTANCE;
   }
}
```

### Update System

Sends UI component updates to players when entities become visible:

```java
public static class Update extends EntityTickingSystem<EntityStore> {
   @Override
   public void tick(float dt, int index, @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
         @Nonnull Store<EntityStore> store, @Nonnull CommandBuffer<EntityStore> commandBuffer) {
      EntityTrackerSystems.Visible visible = archetypeChunk.getComponent(index, this.visibleComponentType);
      UIComponentList uiComponentList = archetypeChunk.getComponent(index, this.uiComponentListComponentType);
      if (!visible.newlyVisibleTo.isEmpty()) {
         queueUpdatesFor(archetypeChunk.getReferenceTo(index), uiComponentList, visible.newlyVisibleTo);
      }
   }

   private static void queueUpdatesFor(Ref<EntityStore> ref, @Nonnull UIComponentList uiComponentList,
         @Nonnull Map<Ref<EntityStore>, EntityTrackerSystems.EntityViewer> visibleTo) {
      ComponentUpdate update = new ComponentUpdate();
      update.type = ComponentUpdateType.UIComponents;
      update.entityUIComponents = uiComponentList.getComponentIds();

      for (EntityTrackerSystems.EntityViewer viewer : visibleTo.values()) {
         viewer.queueUpdate(ref, update);
      }
   }
}
```

### Remove System

Handles cleanup when UI components are removed from entities:

```java
public static class Remove extends RefChangeSystem<EntityStore, UIComponentList> {
   public void onComponentRemoved(@Nonnull Ref<EntityStore> ref, @Nonnull UIComponentList component,
         @Nonnull Store<EntityStore> store, @Nonnull CommandBuffer<EntityStore> commandBuffer) {
      for (EntityTrackerSystems.EntityViewer viewer : store.getComponent(ref, this.visibleComponentType).visibleTo.values()) {
         viewer.queueRemove(ref, ComponentUpdateType.UIComponents);
      }
   }
}
```

## Network Synchronization

UI components are synchronized to clients through packet generation:

```java
public class EntityUIComponentPacketGenerator extends AssetPacketGenerator<String, EntityUIComponent,
      IndexedLookupTableAssetMap<String, EntityUIComponent>> {

   @Nonnull
   public Packet generateInitPacket(@Nonnull IndexedLookupTableAssetMap<String, EntityUIComponent> assetMap,
         @Nonnull Map<String, EntityUIComponent> assets) {
      Int2ObjectMap<com.hypixel.hytale.protocol.EntityUIComponent> configs = new Int2ObjectOpenHashMap<>();

      for (Entry<String, EntityUIComponent> entry : assets.entrySet()) {
         configs.put(assetMap.getIndex(entry.getKey()), entry.getValue().toPacket());
      }

      return new UpdateEntityUIComponents(UpdateType.Init, assetMap.getNextIndex(), configs);
   }
}
```

### Update Types

| Type | Description |
|------|-------------|
| `Init` | Initial packet sent when client connects |
| `AddOrUpdate` | Updates existing or adds new components |
| `Remove` | Removes UI components |

## Plugin Example

Here's a complete example of working with entity UI components in a plugin:

```java
public class EntityUIPlugin extends JavaPlugin {

    public EntityUIPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Listen for when players are added to a world
        getEventRegistry().register(AddPlayerToWorldEvent.class, this::onPlayerAddedToWorld);
    }

    private void onPlayerAddedToWorld(AddPlayerToWorldEvent event) {
        World world = event.getWorld();
        Store<EntityStore> store = world.getEntityStore().getStore();
        Ref<EntityStore> entityRef = event.getHolder();

        // Get the entity's UI component list
        UIComponentList uiList = store.getComponent(entityRef, UIComponentList.getComponentType());

        if (uiList != null) {
            // Get current component IDs
            int[] componentIds = uiList.getComponentIds();

            getLogger().info("Player added to world with " + componentIds.length + " UI components");
        }
    }

    // Get UI component by ID
    public EntityUIComponent getUIComponent(String componentId) {
        IndexedLookupTableAssetMap<String, EntityUIComponent> assetMap = EntityUIComponent.getAssetMap();
        int index = assetMap.getIndex(componentId);
        return assetMap.get(index);
    }

    // Check if an entity has a specific UI component
    public boolean hasUIComponent(Store<EntityStore> store, Ref<EntityStore> entityRef, String componentId) {
        UIComponentList uiList = store.getComponent(entityRef, UIComponentList.getComponentType());
        if (uiList == null) {
            return false;
        }

        IndexedLookupTableAssetMap<String, EntityUIComponent> assetMap = EntityUIComponent.getAssetMap();
        int targetIndex = assetMap.getIndex(componentId);

        for (int id : uiList.getComponentIds()) {
            if (id == targetIndex) {
                return true;
            }
        }
        return false;
    }
}
```

## Asset Path

Entity UI component assets are loaded from:

```
Entity/UI/
```

## Source Files

| Class | Path |
|-------|------|
| `EntityUIModule` | `com.hypixel.hytale.server.core.modules.entityui.EntityUIModule` |
| `EntityUIComponent` | `com.hypixel.hytale.server.core.modules.entityui.asset.EntityUIComponent` |
| `EntityStatUIComponent` | `com.hypixel.hytale.server.core.modules.entityui.asset.EntityStatUIComponent` |
| `CombatTextUIComponent` | `com.hypixel.hytale.server.core.modules.entityui.asset.CombatTextUIComponent` |
| `UIComponentList` | `com.hypixel.hytale.server.core.modules.entityui.UIComponentList` |
| `UIComponentSystems` | `com.hypixel.hytale.server.core.modules.entityui.UIComponentSystems` |
| `CombatTextUIComponentAnimationEvent` | `com.hypixel.hytale.server.core.modules.entityui.asset.CombatTextUIComponentAnimationEvent` |
| `CombatTextUIComponentScaleAnimationEvent` | `com.hypixel.hytale.server.core.modules.entityui.asset.CombatTextUIComponentScaleAnimationEvent` |
| `CombatTextUIComponentPositionAnimationEvent` | `com.hypixel.hytale.server.core.modules.entityui.asset.CombatTextUIComponentPositionAnimationEvent` |
| `CombatTextUIComponentOpacityAnimationEvent` | `com.hypixel.hytale.server.core.modules.entityui.asset.CombatTextUIComponentOpacityAnimationEvent` |
| `EntityUIComponentPacketGenerator` | `com.hypixel.hytale.server.core.modules.entityui.asset.EntityUIComponentPacketGenerator` |
