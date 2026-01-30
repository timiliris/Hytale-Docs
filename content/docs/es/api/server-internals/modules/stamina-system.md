---
id: stamina-system
title: Sistema de Resistencia
sidebar_label: Sistema de Resistencia
sidebar_position: 7
description: Documentación completa del sistema de resistencia de Hytale para gestionar el consumo, regeneración e integración con combate de la resistencia de jugadores y entidades
---

# Sistema de Resistencia

El Sistema de Resistencia en Hytale gestiona el consumo y regeneración de resistencia para entidades. La resistencia se usa para varias acciones incluyendo correr, interacciones de combate y bloqueo. El sistema se integra con el sistema de Estadísticas de Entidad y proporciona mecánicas de juego configurables.

## Overview

The `StaminaModule` is a core plugin that depends on `EntityModule` and `EntityStatsModule`. It provides:

- Stamina consumption during sprinting
- Stamina regeneration delays after sprinting
- Stamina cost calculations for combat blocking
- Integration with the "Stamina Broken" effect system
- HUD display of stamina status

**Source:** `com.hypixel.hytale.server.core.modules.entity.stamina.StaminaModule`

```java
public class StaminaModule extends JavaPlugin {
   public static final PluginManifest MANIFEST = PluginManifest.corePlugin(StaminaModule.class)
      .depends(EntityModule.class)
      .depends(EntityStatsModule.class)
      .build();
   private static StaminaModule instance;
   private ResourceType<EntityStore, SprintStaminaRegenDelay> sprintRegenDelayResourceType;

   @Override
   protected void setup() {
      this.sprintRegenDelayResourceType = this.getEntityStoreRegistry()
         .registerResource(SprintStaminaRegenDelay.class, SprintStaminaRegenDelay::new);
      this.getEntityStoreRegistry()
         .registerSystem(new StaminaSystems.SprintStaminaEffectSystem());
      this.getCodecRegistry(GameplayConfig.PLUGIN_CODEC)
         .register(StaminaGameplayConfig.class, "Stamina", StaminaGameplayConfig.CODEC);
      this.getEventRegistry()
         .register(LoadedAssetsEvent.class, GameplayConfig.class, StaminaModule::onGameplayConfigsLoaded);
   }
}
```

## Accessing Stamina Stats

Stamina is one of the default entity stat types. You can access it through the `DefaultEntityStatTypes` class:

```java
// Get the stamina stat index
int staminaIndex = DefaultEntityStatTypes.getStamina();

// Get an entity's stat map
EntityStatMap statMap = store.getComponent(entityRef, EntityStatMap.getComponentType());

// Get the stamina value
EntityStatValue staminaValue = statMap.get(staminaIndex);

// Get current stamina
float currentStamina = staminaValue.get();

// Get stamina as percentage (0.0 to 1.0)
float staminaPercent = staminaValue.asPercentage();

// Get min/max bounds
float minStamina = staminaValue.getMin();
float maxStamina = staminaValue.getMax();
```

**Source:** `com.hypixel.hytale.server.core.modules.entitystats.asset.DefaultEntityStatTypes`

```java
public abstract class DefaultEntityStatTypes {
   private static int HEALTH;
   private static int OXYGEN;
   private static int STAMINA;
   private static int MANA;
   private static int SIGNATURE_ENERGY;
   private static int AMMO;

   public static int getStamina() {
      return STAMINA;
   }

   public static void update() {
      IndexedLookupTableAssetMap<String, EntityStatType> assetMap = EntityStatType.getAssetMap();
      STAMINA = assetMap.getIndex("Stamina");
      // ... other stats
   }
}
```

## Stamina Consumption

### Sprinting

The stamina system tracks when players stop sprinting and applies a regeneration delay. This prevents stamina from immediately regenerating after intense sprinting.

**Source:** `com.hypixel.hytale.server.core.modules.entity.stamina.StaminaSystems`

```java
public static class SprintStaminaEffectSystem extends EntityTickingSystem<EntityStore> {
   private final Query<EntityStore> query = Query.and(
      playerComponentType,
      entityStatMapComponentType,
      movementStatesComponentType
   );

   @Override
   public void tick(
      float dt,
      int index,
      @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
      @Nonnull Store<EntityStore> store,
      @Nonnull CommandBuffer<EntityStore> commandBuffer
   ) {
      MovementStatesComponent movementStates = archetypeChunk.getComponent(
         index, movementStatesComponentType
      );

      // Detect transition from sprinting to not sprinting
      if (!movementStates.getMovementStates().sprinting &&
          movementStates.getSentMovementStates().sprinting) {
         SprintStaminaRegenDelay regenDelay = store.getResource(sprintRegenDelayResourceType);
         EntityStatMap statMap = archetypeChunk.getComponent(index, entityStatMapComponentType);
         EntityStatValue statValue = statMap.get(regenDelay.getIndex());

         if (statValue != null && statValue.get() <= regenDelay.getValue()) {
            return;
         }

         // Apply the regeneration delay
         statMap.setStatValue(regenDelay.getIndex(), regenDelay.getValue());
      }
   }
}
```

### Combat Blocking

When blocking damage, stamina is consumed based on the incoming damage amount. The `StaminaCost` configuration determines how stamina consumption is calculated.

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.WieldingInteraction`

```java
public static class StaminaCost {
   public static final BuilderCodec<StaminaCost> CODEC = BuilderCodec.builder(
         StaminaCost.class, StaminaCost::new
      )
      .append(
         new KeyedCodec<>("CostType", new EnumCodec<>(CostType.class)),
         (staminaCost, costType) -> staminaCost.costType = costType,
         staminaCost -> staminaCost.costType
      )
      .append(
         new KeyedCodec<>("Value", Codec.FLOAT),
         (staminaCost, aFloat) -> staminaCost.value = aFloat,
         staminaCost -> staminaCost.value
      )
      .build();

   private CostType costType = CostType.MAX_HEALTH_PERCENTAGE;
   private float value = 0.04F;

   public float computeStaminaAmountToConsume(float damageRaw, @Nonnull EntityStatMap entityStatMap) {
      return switch (this.costType) {
         case MAX_HEALTH_PERCENTAGE ->
            damageRaw / (this.value * entityStatMap.get(DefaultEntityStatTypes.getHealth()).getMax());
         case DAMAGE ->
            damageRaw / this.value;
      };
   }

   static enum CostType {
      MAX_HEALTH_PERCENTAGE,
      DAMAGE;
   }
}
```

### Stamina Cost Types

| Tipo de Costo           | Descripción                                                         | Valor Predeterminado |
| ----------------------- | ------------------------------------------------------------------- | -------------------- |
| `MAX_HEALTH_PERCENTAGE` | Define cuántos % de salud máxima equivalen a 1 punto de resistencia | 0.04 (4%)            |
| `DAMAGE`                | Define cuánto daño equivale a 1 punto de resistencia                | N/A                  |

### Damage Stamina System

When blocking damage, the `DamageStamina` system handles stamina consumption:

**Source:** `com.hypixel.hytale.server.core.modules.entity.damage.DamageSystems`

```java
public static class DamageStamina extends DamageEventSystem
   implements EntityStatsSystems.StatModifyingSystem {

   @Nonnull
   private static final Query<EntityStore> QUERY = Query.and(
      DamageDataComponent.getComponentType(),
      EntityStatMap.getComponentType()
   );

   public void handleInternal(
      int index,
      @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
      @Nonnull Store<EntityStore> store,
      @Nonnull CommandBuffer<EntityStore> commandBuffer,
      @Nonnull Damage damage
   ) {
      EntityStatMap entityStatMapComponent = archetypeChunk.getComponent(
         index, EntityStatMap.getComponentType()
      );
      DamageDataComponent damageDataComponent = archetypeChunk.getComponent(
         index, DamageDataComponent.getComponentType()
      );

      if (damageDataComponent.getCurrentWielding() != null) {
         WieldingInteraction.StaminaCost staminaCost =
            damageDataComponent.getCurrentWielding().getStaminaCost();

         if (staminaCost != null) {
            Boolean isBlocked = damage.getMetaStore().getIfPresentMetaObject(Damage.BLOCKED);

            if (isBlocked != null && isBlocked) {
               float staminaToConsume = staminaCost.computeStaminaAmountToConsume(
                  damage.getInitialAmount(), entityStatMapComponent
               );

               // Apply stamina drain multiplier if present
               Float multiplier = damage.getIfPresentMetaObject(Damage.STAMINA_DRAIN_MULTIPLIER);
               if (multiplier != null) {
                  staminaToConsume *= multiplier;
               }

               entityStatMapComponent.subtractStatValue(
                  DefaultEntityStatTypes.getStamina(), staminaToConsume
               );
            }
         }
      }
   }
}
```

## Stamina Regeneration

### Regeneration Delay Configuration

The stamina regeneration delay after sprinting is configured through `StaminaGameplayConfig`:

**Source:** `com.hypixel.hytale.server.core.modules.entity.stamina.StaminaGameplayConfig`

```java
public class StaminaGameplayConfig {
   public static final String ID = "Stamina";
   public static final BuilderCodec<StaminaGameplayConfig> CODEC = BuilderCodec.builder(
         StaminaGameplayConfig.class, StaminaGameplayConfig::new
      )
      .appendInherited(
         new KeyedCodec<>("SprintRegenDelay", SprintRegenDelayConfig.CODEC),
         (config, s) -> config.sprintRegenDelay = s,
         config -> config.sprintRegenDelay,
         (config, parent) -> config.sprintRegenDelay = parent.sprintRegenDelay
      )
      .addValidator(Validators.nonNull())
      .documentation("The stamina regeneration delay applied after sprinting")
      .add()
      .build();

   protected SprintRegenDelayConfig sprintRegenDelay;

   @Nonnull
   public SprintRegenDelayConfig getSprintRegenDelay() {
      return this.sprintRegenDelay;
   }
}
```

### Sprint Regeneration Delay Config

```java
public static class SprintRegenDelayConfig {
   public static final BuilderCodec<SprintRegenDelayConfig> CODEC = BuilderCodec.builder(
         SprintRegenDelayConfig.class, SprintRegenDelayConfig::new
      )
      .appendInherited(
         new KeyedCodec<>("EntityStatId", Codec.STRING),
         (config, s) -> config.statId = s,
         config -> config.statId,
         (config, parent) -> config.statId = parent.statId
      )
      .addValidator(Validators.nonNull())
      .addValidator(EntityStatType.VALIDATOR_CACHE.getValidator())
      .documentation("The ID of the stamina regen delay EntityStat")
      .add()
      .appendInherited(
         new KeyedCodec<>("Value", Codec.FLOAT),
         (config, s) -> config.statValue = s,
         config -> config.statValue,
         (config, parent) -> config.statValue = parent.statValue
      )
      .addValidator(Validators.max(0.0F))
      .documentation("The amount of stamina regen delay to apply")
      .add()
      .afterDecode(config ->
         config.statIndex = EntityStatType.getAssetMap().getIndex(config.statId)
      )
      .build();

   protected String statId;
   protected int statIndex;
   protected float statValue;

   public int getIndex() {
      return this.statIndex;
   }

   public float getValue() {
      return this.statValue;
   }
}
```

### Sprint Stamina Regen Delay Resource

The system uses a resource to track and validate regeneration delays:

**Source:** `com.hypixel.hytale.server.core.modules.entity.stamina.SprintStaminaRegenDelay`

```java
public class SprintStaminaRegenDelay implements Resource<EntityStore> {
   private static final AtomicInteger ASSET_VALIDATION_STATE = new AtomicInteger(0);
   protected int statIndex = 0;
   protected float statValue;
   protected int validationState = ASSET_VALIDATION_STATE.get() - 1;

   public static ResourceType<EntityStore, SprintStaminaRegenDelay> getResourceType() {
      return StaminaModule.get().getSprintRegenDelayResourceType();
   }

   public int getIndex() {
      return this.statIndex;
   }

   public float getValue() {
      return this.statValue;
   }

   public boolean validate() {
      return this.validationState == ASSET_VALIDATION_STATE.get();
   }

   public boolean hasDelay() {
      return this.statIndex != 0 && this.statValue < 0.0F;
   }

   public void update(int statIndex, float statValue) {
      this.statIndex = statIndex;
      this.statValue = statValue;
      this.validationState = ASSET_VALIDATION_STATE.get();
   }

   public static void invalidateResources() {
      ASSET_VALIDATION_STATE.incrementAndGet();
   }
}
```

## Stamina Broken Effect

When stamina is depleted due to damage while blocking, a "Stamina Broken" effect can be applied. This is configured in the `CombatConfig`:

**Source:** `com.hypixel.hytale.server.core.asset.type.gameplay.CombatConfig`

```java
public class CombatConfig {
   @Nonnull
   public static final BuilderCodec<CombatConfig> CODEC = BuilderCodec.builder(
         CombatConfig.class, CombatConfig::new
      )
      .appendInherited(
         new KeyedCodec<>("StaminaBrokenEffectId", Codec.STRING),
         (config, s) -> config.staminaBrokenEffectId = s,
         config -> config.staminaBrokenEffectId,
         (config, parent) -> config.staminaBrokenEffectId = parent.staminaBrokenEffectId
      )
      .documentation("The id of the EntityEffect to apply upon stamina being depleted due to damage.")
      .addValidator(Validators.nonNull())
      .addValidator(EntityEffect.VALIDATOR_CACHE.getValidator())
      .add()
      // ... other fields
      .build();

   protected String staminaBrokenEffectId = "Stamina_Broken";
   private int staminaBrokenEffectIndex;

   public int getStaminaBrokenEffectIndex() {
      return this.staminaBrokenEffectIndex;
   }
}
```

## Movement States

Stamina consumption is tied to various movement states. The `MovementStates` class tracks:

**Source:** `com.hypixel.hytale.protocol.MovementStates`

| Estado      | Descripción                                             |
| ----------- | ------------------------------------------------------- |
| `sprinting` | El jugador está corriendo (alto consumo de resistencia) |
| `running`   | El jugador está corriendo                               |
| `walking`   | El jugador está caminando                               |
| `jumping`   | El jugador está saltando                                |
| `rolling`   | El jugador está rodando (puede mitigar daño por caída)  |
| `swimming`  | El jugador está nadando                                 |
| `climbing`  | El jugador está escalando                               |
| `gliding`   | El jugador está planeando                               |
| `crouching` | El jugador está agachado                                |
| `sliding`   | El jugador está deslizándose                            |
| `mantling`  | El jugador está trepando sobre obstáculos               |

## HUD Integration

Stamina has a dedicated HUD component for displaying stamina status:

**Source:** `com.hypixel.hytale.protocol.packets.interface_.HudComponent`

```java
public enum HudComponent {
   // ... other components
   Stamina(18),
   // ...
}
```

## Stamina Drain Multiplier

Damage effects can modify stamina drain through a multiplier:

**Source:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageEffects`

```java
public class DamageEffects implements NetworkSerializable<com.hypixel.hytale.protocol.DamageEffects> {
   protected float staminaDrainMultiplier = 1.0F;

   public void addToDamage(@Nonnull Damage damageEvent) {
      // ... other effects

      if (this.staminaDrainMultiplier != 1.0F) {
         damageEvent.putMetaObject(Damage.STAMINA_DRAIN_MULTIPLIER, Float.valueOf(this.staminaDrainMultiplier));
      }
   }
}
```

## Plugin Example

Here is a complete example of a plugin that manages stamina:

```java
public class StaminaPlugin extends JavaPlugin {

    public StaminaPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Listen for player sprint events
        getEventRegistry().register(PlayerMoveEvent.class, this::onPlayerMove);
    }

    private void onPlayerMove(PlayerMoveEvent event) {
        PlayerRef playerRef = event.getPlayerRef();
        World world = event.getWorld();
        Store<EntityStore> store = world.getEntityStore();

        // Get the player's stat map
        EntityStatMap statMap = store.getComponent(
            playerRef.getReference(),
            EntityStatMap.getComponentType()
        );

        if (statMap != null) {
            // Get stamina stat index
            int staminaIndex = DefaultEntityStatTypes.getStamina();

            // Get current stamina value
            EntityStatValue stamina = statMap.get(staminaIndex);
            if (stamina != null) {
                float currentStamina = stamina.get();
                float staminaPercent = stamina.asPercentage();

                getLogger().info("Player stamina: " + currentStamina +
                    " (" + (staminaPercent * 100) + "%)");

                // Check if stamina is low
                if (staminaPercent < 0.2f) {
                    getLogger().warn("Player stamina is low!");
                }
            }
        }
    }

    // Drain stamina from a player
    public void drainStamina(PlayerRef playerRef, Store<EntityStore> store, float amount) {
        EntityStatMap statMap = store.getComponent(
            playerRef.getReference(),
            EntityStatMap.getComponentType()
        );

        if (statMap != null) {
            int staminaIndex = DefaultEntityStatTypes.getStamina();
            statMap.subtractStatValue(staminaIndex, amount);
        }
    }

    // Restore stamina to a player
    public void restoreStamina(PlayerRef playerRef, Store<EntityStore> store, float amount) {
        EntityStatMap statMap = store.getComponent(
            playerRef.getReference(),
            EntityStatMap.getComponentType()
        );

        if (statMap != null) {
            int staminaIndex = DefaultEntityStatTypes.getStamina();
            statMap.addStatValue(staminaIndex, amount);
        }
    }

    // Set stamina to maximum
    public void maxStamina(PlayerRef playerRef, Store<EntityStore> store) {
        EntityStatMap statMap = store.getComponent(
            playerRef.getReference(),
            EntityStatMap.getComponentType()
        );

        if (statMap != null) {
            int staminaIndex = DefaultEntityStatTypes.getStamina();
            statMap.maximizeStatValue(staminaIndex);
        }
    }

    // Add stamina modifier
    public void addStaminaModifier(PlayerRef playerRef, Store<EntityStore> store,
                                   String key, float amount) {
        EntityStatMap statMap = store.getComponent(
            playerRef.getReference(),
            EntityStatMap.getComponentType()
        );

        if (statMap != null) {
            int staminaIndex = DefaultEntityStatTypes.getStamina();
            StaticModifier modifier = new StaticModifier(
                Modifier.ModifierTarget.MAX,
                StaticModifier.CalculationType.MULTIPLICATIVE,
                amount
            );
            statMap.putModifier(staminaIndex, key, modifier);
        }
    }
}
```

## Console Commands

Use the standard player/entity stat commands to manage stamina:

| Comando                                          | Descripción                                  |
| ------------------------------------------------ | -------------------------------------------- |
| `/player stats get <jugador> Stamina`            | Obtener la resistencia actual de un jugador  |
| `/player stats set <jugador> Stamina <valor>`    | Establecer la resistencia de un jugador      |
| `/player stats add <jugador> Stamina <cantidad>` | Añadir a la resistencia de un jugador        |
| `/player stats sub <jugador> Stamina <cantidad>` | Restar de la resistencia de un jugador       |
| `/player stats settomax <jugador> Stamina`       | Establecer resistencia del jugador al máximo |
| `/player stats reset <jugador> Stamina`          | Restablecer resistencia del jugador          |

## Archivos Fuente

| Clase                             | Ruta                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `StaminaModule`                   | `com.hypixel.hytale.server.core.modules.entity.stamina.StaminaModule`                               |
| `StaminaSystems`                  | `com.hypixel.hytale.server.core.modules.entity.stamina.StaminaSystems`                              |
| `StaminaGameplayConfig`           | `com.hypixel.hytale.server.core.modules.entity.stamina.StaminaGameplayConfig`                       |
| `SprintStaminaRegenDelay`         | `com.hypixel.hytale.server.core.modules.entity.stamina.SprintStaminaRegenDelay`                     |
| `DefaultEntityStatTypes`          | `com.hypixel.hytale.server.core.modules.entitystats.asset.DefaultEntityStatTypes`                   |
| `DamageSystems.DamageStamina`     | `com.hypixel.hytale.server.core.modules.entity.damage.DamageSystems`                                |
| `WieldingInteraction.StaminaCost` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.client.WieldingInteraction`  |
| `CombatConfig`                    | `com.hypixel.hytale.server.core.asset.type.gameplay.CombatConfig`                                   |
| `DamageEffects`                   | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageEffects` |
| `MovementStates`                  | `com.hypixel.hytale.protocol.MovementStates`                                                        |
| `MovementStatesComponent`         | `com.hypixel.hytale.server.core.entity.movement.MovementStatesComponent`                            |

## See Also

- [Entity Stats System](/modding/plugins/entity-stats) - Base stat system documentation
- [Damage System](/modding/plugins/damage-system) - How damage affects stamina
- [Interactions](/modding/plugins/interactions) - Wielding and blocking interactions
