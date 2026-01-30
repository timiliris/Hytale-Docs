---
id: damage-system
title: Sistema de Daño
sidebar_label: Sistema de Daño
sidebar_position: 7
description: Documentación completa del sistema de daño de Hytale para aplicar daño, retroceso y efectos de combate mediante plugins
---

# Sistema de Daño

El Sistema de Daño en Hytale proporciona un marco integral para infligir daño a entidades, aplicar efectos de retroceso y gestionar interacciones de combate. Este sistema está construido sobre la arquitectura ECS (Entity Component System) y se integra con el sistema de Estadísticas de Entidad.

## Descripción General

El sistema de daño consta de varios componentes clave:

- **Damage** - La clase de evento principal que representa el daño infligido
- **DamageCause** - Define el tipo/fuente de daño (ej. caída, ahogamiento, comando)
- **DamageCalculator** - Calcula cantidades de daño con modificadores
- **DamageClass** - Categoriza tipos de daño para modificadores de equipamiento
- **DamageEffects** - Efectos visuales y de audio activados por el daño
- **Knockback** - Fuerza aplicada a entidades cuando son dañadas

## DamageModule

El `DamageModule` es el plugin principal que gestiona el sistema de daño:

```java
package com.hypixel.hytale.server.core.modules.entity.damage;

public class DamageModule extends JavaPlugin {
    public static final PluginManifest MANIFEST = PluginManifest.corePlugin(DamageModule.class)
        .depends(EntityModule.class)
        .depends(EntityStatsModule.class)
        .depends(EntityUIModule.class)
        .build();

    // Obtener la instancia singleton
    public static DamageModule get();

    // Grupos de sistemas para el pipeline de procesamiento de daño
    public SystemGroup<EntityStore> getGatherDamageGroup();
    public SystemGroup<EntityStore> getFilterDamageGroup();
    public SystemGroup<EntityStore> getInspectDamageGroup();
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.entity.damage.DamageModule`

## Clase Damage

La clase `Damage` representa un evento de daño que puede aplicarse a entidades:

```java
package com.hypixel.hytale.server.core.modules.entity.damage;

public class Damage extends CancellableEcsEvent implements IMetaStore<Damage> {
    // Crear daño con una fuente, causa y cantidad
    public Damage(Damage.Source source, DamageCause damageCause, float amount);
    public Damage(Damage.Source source, int damageCauseIndex, float amount);

    // Obtener/establecer cantidad de daño
    public float getAmount();
    public void setAmount(float amount);
    public float getInitialAmount();

    // Obtener/establecer causa de daño
    public int getDamageCauseIndex();
    public void setDamageCauseIndex(int damageCauseIndex);
    public DamageCause getCause();

    // Obtener/establecer fuente de daño
    public Damage.Source getSource();
    public void setSource(Damage.Source source);

    // Obtener mensaje de muerte para este daño
    public Message getDeathMessage(Ref<EntityStore> targetRef, ComponentAccessor<EntityStore> componentAccessor);
}
```

### Claves Meta de Damage

La clase `Damage` proporciona varias claves de metadatos para información adicional:

| Clave Meta                   | Tipo                  | Descripción                                     |
| ---------------------------- | --------------------- | ----------------------------------------------- |
| `HIT_LOCATION`               | `Vector4d`            | La posición mundial donde ocurrió el golpe      |
| `HIT_ANGLE`                  | `Float`               | El ángulo del golpe en grados                   |
| `IMPACT_PARTICLES`           | `Damage.Particles`    | Partículas a generar en el impacto              |
| `IMPACT_SOUND_EFFECT`        | `Damage.SoundEffect`  | Sonido a reproducir en el impacto               |
| `PLAYER_IMPACT_SOUND_EFFECT` | `Damage.SoundEffect`  | Sonido a reproducir al jugador dañado           |
| `CAMERA_EFFECT`              | `Damage.CameraEffect` | Efecto de sacudida de cámara                    |
| `DEATH_ICON`                 | `String`              | Icono a mostrar en el registro de muertes       |
| `BLOCKED`                    | `Boolean`             | Si el daño fue bloqueado                        |
| `STAMINA_DRAIN_MULTIPLIER`   | `Float`               | Multiplicador de drenaje de energía al bloquear |
| `CAN_BE_PREDICTED`           | `Boolean`             | Si el daño puede ser predicho por el cliente    |
| `KNOCKBACK_COMPONENT`        | `KnockbackComponent`  | Retroceso a aplicar                             |

### Fuentes de Daño

Diferentes tipos de fuente indican cómo se originó el daño:

```java
// Fuente nula/desconocida
public static final Damage.Source NULL_SOURCE;

// Daño de una entidad (jugador, NPC, etc.)
public class EntitySource implements Damage.Source {
    public EntitySource(Ref<EntityStore> sourceRef);
    public Ref<EntityStore> getRef();
}

// Daño de un proyectil con un tirador
public class ProjectileSource extends EntitySource {
    public ProjectileSource(Ref<EntityStore> shooter, Ref<EntityStore> projectile);
    public Ref<EntityStore> getProjectile();
}

// Daño de un comando
public class CommandSource implements Damage.Source {
    public CommandSource(CommandSender commandSender, AbstractCommand cmd);
    public CommandSource(CommandSender commandSender, String commandName);
}

// Daño ambiental
public class EnvironmentSource implements Damage.Source {
    public EnvironmentSource(String type);
    public String getType();
}
```

## DamageCause

`DamageCause` define el tipo de daño que se está infligiendo. Hytale incluye varias causas de daño integradas:

| Causa         | Descripción                     | Constante                  |
| ------------- | ------------------------------- | -------------------------- |
| `Command`     | Daño de comandos                | `DamageCause.COMMAND`      |
| `Drowning`    | Asfixia bajo el agua            | `DamageCause.DROWNING`     |
| `Fall`        | Daño por caída                  | `DamageCause.FALL`         |
| `OutOfWorld`  | Debajo de los límites del mundo | `DamageCause.OUT_OF_WORLD` |
| `Suffocation` | Atrapado en bloques             | `DamageCause.SUFFOCATION`  |

```java
package com.hypixel.hytale.server.core.modules.entity.damage;

public class DamageCause {
    // Causas de daño integradas (inicializadas en tiempo de ejecución)
    public static DamageCause COMMAND;
    public static DamageCause DROWNING;
    public static DamageCause FALL;
    public static DamageCause OUT_OF_WORLD;
    public static DamageCause SUFFOCATION;

    // Obtener causa de daño por ID
    public static IndexedLookupTableAssetMap<String, DamageCause> getAssetMap();

    // Propiedades
    public String getId();
    public String getInherits();           // Causa de daño padre para herencia de resistencia
    public boolean doesBypassResistances(); // Si este daño ignora la armadura
    public boolean isDurabilityLoss();      // Si esto causa pérdida de durabilidad
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.entity.damage.DamageCause`

## DamageClass

`DamageClass` categoriza el daño para propósitos de modificadores de equipamiento:

```java
package com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat;

public enum DamageClass {
    UNKNOWN,    // Clase de daño predeterminada/desconocida
    LIGHT,      // Daño de ataque ligero
    CHARGED,    // Daño de ataque cargado/pesado
    SIGNATURE;  // Daño de habilidad firma
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageClass`

## DamageCalculator

El `DamageCalculator` calcula valores de daño con varios modificadores:

```java
package com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat;

public class DamageCalculator {
    // Calcular daño para una duración dada
    public Object2FloatMap<DamageCause> calculateDamage(double durationSeconds);

    // Propiedades
    public Type getType();                    // DPS o ABSOLUTE
    public DamageClass getDamageClass();      // Clasificación de daño
    public float getSequentialModifierStep(); // Reducción de daño por golpe secuencial
    public float getSequentialModifierMinimum(); // Multiplicador de daño mínimo

    public enum Type {
        DPS,      // Daño por segundo (escalado por duración)
        ABSOLUTE  // Cantidad de daño fija
    }
}
```

### Configuración de DamageCalculator

En configuración JSON, un DamageCalculator se ve así:

```json
{
  "Type": "ABSOLUTE",
  "Class": "LIGHT",
  "BaseDamage": {
    "Physical": 10.0,
    "Fire": 5.0
  },
  "SequentialModifierStep": 0.1,
  "SequentialModifierMinimum": 0.5,
  "RandomPercentageModifier": 0.1
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageCalculator`

## Sistema de Retroceso

El sistema de retroceso aplica fuerzas a las entidades cuando reciben daño.

### KnockbackComponent

```java
package com.hypixel.hytale.server.core.entity.knockback;

public class KnockbackComponent implements Component<EntityStore> {
    public static ComponentType<EntityStore, KnockbackComponent> getComponentType();

    // Velocidad a aplicar
    public Vector3d getVelocity();
    public void setVelocity(Vector3d velocity);

    // Cómo se aplica la velocidad (Add o Set)
    public ChangeVelocityType getVelocityType();
    public void setVelocityType(ChangeVelocityType velocityType);

    // Configuración de velocidad opcional
    public VelocityConfig getVelocityConfig();
    public void setVelocityConfig(VelocityConfig velocityConfig);

    // Modificadores (multiplicadores aplicados a la velocidad)
    public void addModifier(double modifier);
    public void applyModifiers();

    // Duración para retroceso continuo
    public float getDuration();
    public void setDuration(float duration);
    public float getTimer();
    public void incrementTimer(float time);
}
```

**Fuente:** `com.hypixel.hytale.server.core.entity.knockback.KnockbackComponent`

### Tipos de Retroceso

Hytale proporciona varios métodos de cálculo de retroceso:

#### Retroceso Base

```java
package com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat;

public abstract class Knockback {
    protected float force;                    // Magnitud de la fuerza de retroceso
    protected float duration;                 // Duración para retroceso continuo
    protected ChangeVelocityType velocityType; // Añadir o Establecer velocidad

    public abstract Vector3d calculateVector(Vector3d source, float yaw, Vector3d target);
}
```

#### DirectionalKnockback

Aplica retroceso alejándose del atacante con desplazamientos relativos opcionales:

```java
public class DirectionalKnockback extends Knockback {
    protected float relativeX;   // Desplazamiento X relativo a la dirección del atacante
    protected float velocityY;   // Velocidad vertical
    protected float relativeZ;   // Desplazamiento Z relativo a la dirección del atacante

    @Override
    public Vector3d calculateVector(Vector3d source, float yaw, Vector3d target) {
        // Calcula la dirección desde la fuente al objetivo, normalizada
        // Aplica desplazamientos relativos rotados por yaw
        // Devuelve (direction.x * force, velocityY, direction.z * force)
    }
}
```

#### ForceKnockback

Aplica retroceso en una dirección fija relativa al atacante:

```java
public class ForceKnockback extends Knockback {
    private Vector3d direction = Vector3d.UP;  // Dirección (normalizada)

    @Override
    public Vector3d calculateVector(Vector3d source, float yaw, Vector3d target) {
        // Devuelve la dirección rotada por yaw, escalada por fuerza
    }
}
```

#### PointKnockback

Aplica retroceso desde un punto específico con desplazamientos:

```java
public class PointKnockback extends Knockback {
    protected float velocityY;   // Velocidad vertical
    protected int rotateY;       // Desplazamiento de rotación Y
    protected int offsetX;       // Desplazamiento X desde la fuente
    protected int offsetZ;       // Desplazamiento Z desde la fuente

    @Override
    public Vector3d calculateVector(Vector3d source, float yaw, Vector3d target) {
        // Crea retroceso desde el punto desplazado hacia el objetivo
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.Knockback`

## DamageEffects

`DamageEffects` define la retroalimentación visual y de audio cuando ocurre daño:

```java
package com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat;

public class DamageEffects {
    protected ModelParticle[] modelParticles;      // Partículas adjuntas al modelo
    protected WorldParticle[] worldParticles;      // Partículas en espacio mundial
    protected String localSoundEventId;            // Sonido 2D para el atacante
    protected String worldSoundEventId;            // Sonido 3D mundial
    protected String playerSoundEventId;           // Sonido para el jugador dañado
    protected double viewDistance = 75.0;          // Rango de visibilidad del efecto
    protected Knockback knockback;                  // Configuración de retroceso
    protected String cameraEffectId;               // Efecto de sacudida de cámara
    protected float staminaDrainMultiplier = 1.0F; // Modificador de drenaje de energía

    // Aplicar efectos a un evento de daño
    public void addToDamage(Damage damageEvent);

    // Generar efectos en la ubicación de la entidad
    public void spawnAtEntity(CommandBuffer<EntityStore> commandBuffer, Ref<EntityStore> ref);
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageEffects`

## Aplicar Daño mediante Plugins

### Aplicación Básica de Daño

```java
import com.hypixel.hytale.server.core.modules.entity.damage.Damage;
import com.hypixel.hytale.server.core.modules.entity.damage.DamageCause;
import com.hypixel.hytale.server.core.modules.entity.damage.DamageSystems;

public class DamagePlugin extends JavaPlugin {

    public DamagePlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    // Aplicar daño a una entidad
    public void damageEntity(Ref<EntityStore> targetRef, Store<EntityStore> store, float amount) {
        // Crear daño con fuente de comando
        Damage damage = new Damage(Damage.NULL_SOURCE, DamageCause.COMMAND, amount);

        // Ejecutar el daño
        DamageSystems.executeDamage(targetRef, store, damage);
    }

    // Aplicar daño de una entidad a otra
    public void entityDamageEntity(
        Ref<EntityStore> attackerRef,
        Ref<EntityStore> targetRef,
        CommandBuffer<EntityStore> commandBuffer,
        float amount
    ) {
        // Crear fuente de entidad
        Damage.EntitySource source = new Damage.EntitySource(attackerRef);

        // Crear evento de daño
        Damage damage = new Damage(source, DamageCause.COMMAND, amount);

        // Ejecutar daño
        DamageSystems.executeDamage(targetRef, commandBuffer, damage);
    }
}
```

### Daño con Retroceso

```java
public void damageWithKnockback(
    Ref<EntityStore> attackerRef,
    Ref<EntityStore> targetRef,
    CommandBuffer<EntityStore> commandBuffer,
    float damageAmount,
    Vector3d knockbackVelocity
) {
    // Crear u obtener componente de retroceso
    KnockbackComponent knockback = commandBuffer.getComponent(targetRef, KnockbackComponent.getComponentType());
    if (knockback == null) {
        knockback = new KnockbackComponent();
        commandBuffer.putComponent(targetRef, KnockbackComponent.getComponentType(), knockback);
    }

    // Configurar retroceso
    knockback.setVelocity(knockbackVelocity);
    knockback.setVelocityType(ChangeVelocityType.Add);
    knockback.setDuration(0.0f);  // Retroceso instantáneo

    // Crear daño
    Damage.EntitySource source = new Damage.EntitySource(attackerRef);
    Damage damage = new Damage(source, DamageCause.COMMAND, damageAmount);

    // Adjuntar retroceso al daño
    damage.putMetaObject(Damage.KNOCKBACK_COMPONENT, knockback);

    // Ejecutar
    DamageSystems.executeDamage(targetRef, commandBuffer, damage);
}
```

### Daño con Efectos

```java
public void damageWithEffects(
    Ref<EntityStore> targetRef,
    CommandBuffer<EntityStore> commandBuffer,
    float amount,
    Vector4d hitLocation
) {
    Damage damage = new Damage(Damage.NULL_SOURCE, DamageCause.COMMAND, amount);

    // Añadir ubicación de golpe para efectos de partículas
    damage.putMetaObject(Damage.HIT_LOCATION, hitLocation);

    // Añadir efecto de sonido
    int soundIndex = SoundEvent.getAssetMap().getIndex("my_hit_sound");
    damage.putMetaObject(Damage.IMPACT_SOUND_EFFECT, new Damage.SoundEffect(soundIndex));

    // Ejecutar
    DamageSystems.executeDamage(targetRef, commandBuffer, damage);
}
```

### Crear Causas de Daño Personalizadas

Las causas de daño personalizadas se definen en archivos de activos JSON y se cargan en tiempo de ejecución:

```json
{
  "Id": "MyCustomDamage",
  "DamageTextColor": "#FF0000",
  "BypassResistances": false,
  "DurabilityLoss": true,
  "Inherits": "Physical"
}
```

Luego accédelo en el código:

```java
DamageCause customCause = DamageCause.getAssetMap().getAsset("MyCustomDamage");
int customCauseIndex = DamageCause.getAssetMap().getIndex("MyCustomDamage");

Damage damage = new Damage(Damage.NULL_SOURCE, customCause, 50.0f);
// o
Damage damage = new Damage(Damage.NULL_SOURCE, customCauseIndex, 50.0f);
```

## Pipeline de Procesamiento de Daño

El sistema de daño procesa el daño a través de tres grupos de sistemas:

1. **GatherDamageGroup** - Recopila y genera eventos de daño
   - Cálculo de daño por caída
   - Daño por ahogamiento/asfixia
   - Daño fuera del mundo

2. **FilterDamageGroup** - Filtra y modifica el daño
   - Reducción de daño por armadura
   - Reducción de daño por bloqueo (wielding)
   - Reducción de retroceso
   - Comprobaciones de invulnerabilidad
   - Filtros de PvP y configuración del mundo

3. **InspectDamageGroup** - Reacciona al daño finalizado
   - Aplicar daño a la salud
   - Reproducir partículas y sonidos
   - Aplicar retroceso
   - Registrar estadísticas de combate
   - Actualizaciones de UI

## Comandos de Consola

### Comando Damage

| Comando                                  | Descripción          |
| ---------------------------------------- | -------------------- |
| `/damage [cantidad] [-silent]`           | Dañarte a ti mismo   |
| `/damage <jugador> [cantidad] [-silent]` | Dañar a otro jugador |
| `/hurt`                                  | Alias para `/damage` |

Ejemplo:

```
/damage player123 50
/damage 25 -silent
```

## DamageSystems

La clase `DamageSystems` contiene todos los sistemas ECS relacionados con el daño:

| Sistema                      | Grupo   | Descripción                          |
| ---------------------------- | ------- | ------------------------------------ |
| `ApplyDamage`                | Inspect | Aplica daño a la salud de la entidad |
| `CanBreathe`                 | Gather  | Daño por ahogamiento/asfixia         |
| `OutOfWorldDamage`           | Gather  | Daño bajo el mundo                   |
| `FallDamagePlayers`          | Gather  | Daño por caída de jugadores          |
| `FallDamageNPCs`             | Gather  | Daño por caída de NPCs               |
| `FilterPlayerWorldConfig`    | Filter  | Configuración de PvP del mundo       |
| `FilterNPCWorldConfig`       | Filter  | Configuración de daño de NPC         |
| `FilterUnkillable`           | Filter  | Comprobación de invulnerabilidad     |
| `ArmorDamageReduction`       | Filter  | Resistencia de armadura              |
| `WieldingDamageReduction`    | Filter  | Reducción por bloqueo/escudo         |
| `ArmorKnockbackReduction`    | Filter  | Resistencia al retroceso             |
| `WieldingKnockbackReduction` | Filter  | Reducción de retroceso por bloqueo   |
| `ApplyParticles`             | Inspect | Generar partículas de golpe          |
| `ApplySoundEffects`          | Inspect | Reproducir sonidos de golpe          |
| `HitAnimation`               | Inspect | Reproducir animación de daño         |
| `PlayerHitIndicators`        | Inspect | Mostrar indicadores de daño          |
| `RecordLastCombat`           | Inspect | Rastrear marcas de tiempo de combate |
| `DamageArmor`                | Inspect | Reducir durabilidad de armadura      |
| `DamageStamina`              | Inspect | Drenar energía al bloquear           |
| `DamageAttackerTool`         | Inspect | Reducir durabilidad de arma          |

**Fuente:** `com.hypixel.hytale.server.core.modules.entity.damage.DamageSystems`

## Archivos Fuente

| Clase                     | Ruta                                                                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `DamageModule`            | `com.hypixel.hytale.server.core.modules.entity.damage.DamageModule`                                        |
| `Damage`                  | `com.hypixel.hytale.server.core.modules.entity.damage.Damage`                                              |
| `DamageCause`             | `com.hypixel.hytale.server.core.modules.entity.damage.DamageCause`                                         |
| `DamageSystems`           | `com.hypixel.hytale.server.core.modules.entity.damage.DamageSystems`                                       |
| `DamageCalculator`        | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageCalculator`     |
| `DamageClass`             | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageClass`          |
| `DamageEffects`           | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageEffects`        |
| `Knockback`               | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.Knockback`            |
| `DirectionalKnockback`    | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DirectionalKnockback` |
| `ForceKnockback`          | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.ForceKnockback`       |
| `PointKnockback`          | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.PointKnockback`       |
| `KnockbackComponent`      | `com.hypixel.hytale.server.core.entity.knockback.KnockbackComponent`                                       |
| `KnockbackSystems`        | `com.hypixel.hytale.server.core.entity.knockback.KnockbackSystems`                                         |
| `DamageEntityInteraction` | `com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.DamageEntityInteraction`     |
| `DamageCommand`           | `com.hypixel.hytale.server.core.command.commands.player.DamageCommand`                                     |
