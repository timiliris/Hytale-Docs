---
id: world
title: API de Mundo
sidebar_label: Mundo
sidebar_position: 6
description: Documentación completa de la clase World y APIs relacionadas
---

# API de Mundo

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada con el código fuente descompilado del servidor utilizando análisis multi-agente.
:::

## Visión General

La clase `World` representa un mundo de juego que contiene chunks, entidades y jugadores. Gestiona el ticking del mundo, la carga de chunks, la aparición de entidades y la gestión de jugadores.

**Source**: `com.hypixel.hytale.server.core.universe.world.World`

**Import**:

```java
import com.hypixel.hytale.server.core.universe.world.World;
```

## Obteniendo una Referencia de Mundo

### Desde Jugador

```java
Player player = context.senderAs(Player.class);
World world = player.getWorld();
```

### Desde Universo

```java
Universe universe = Universe.get();
World spawnWorld = universe.getSpawnWorld();
```

## Propiedades del Mundo

### Información Básica

| Método             | Tipo de Retorno | Descripción                                           |
| ------------------ | --------------- | ----------------------------------------------------- |
| `getName()`        | `String`        | Devuelve el nombre del mundo                          |
| `getWorldConfig()` | `WorldConfig`   | Devuelve la configuración del mundo                   |
| `getSavePath()`    | `Path`          | Devuelve la ruta del directorio de guardado del mundo |
| `isAlive()`        | `boolean`       | Devuelve true si el mundo está activo                 |

### Tiempo y Ticking

| Método                          | Tipo de Retorno | Descripción                                     |
| ------------------------------- | --------------- | ----------------------------------------------- |
| `getTick()`                     | `long`          | Devuelve el conteo de ticks actual              |
| `isTicking()`                   | `boolean`       | Devuelve true si el mundo está haciendo ticking |
| `setTicking(boolean)`           | `void`          | Activa/desactiva el ticking del mundo           |
| `isPaused()`                    | `boolean`       | Devuelve true si el mundo está pausado          |
| `setPaused(boolean)`            | `void`          | Pausa/reanuda el mundo                          |
| `setTps(int)`                   | `void`          | Establece ticks por segundo                     |
| `getDaytimeDurationSeconds()`   | `int`           | Obtiene la duración del día                     |
| `getNighttimeDurationSeconds()` | `int`           | Obtiene la duración de la noche                 |

### Configuración

| Método                 | Tipo de Retorno   | Descripción                                     |
| ---------------------- | ----------------- | ----------------------------------------------- |
| `getDeathConfig()`     | `DeathConfig`     | Devuelve la configuración de muerte/reaparición |
| `getGameplayConfig()`  | `GameplayConfig`  | Devuelve la configuración de juego              |
| `getWorldPathConfig()` | `WorldPathConfig` | Devuelve la configuración de rutas              |

## Jugadores

### Obteniendo Jugadores

```java
// Obtener todos los jugadores en el mundo (obsoleto)
@Deprecated
List<Player> players = world.getPlayers();

// Obtener conteo de jugadores (preferido)
int count = world.getPlayerCount();

// Obtener referencias de jugadores
Collection<PlayerRef> playerRefs = world.getPlayerRefs();
```

### Añadiendo/Eliminando Jugadores

```java
// Añadir un jugador al mundo
CompletableFuture<PlayerRef> future = world.addPlayer(playerRef);

// Añadir jugador en posición específica
Transform spawnPosition = new Transform(x, y, z, yaw, pitch, roll);
world.addPlayer(playerRef, spawnPosition);

// Drenar todos los jugadores a otro mundo
world.drainPlayersTo(fallbackWorld);
```

### Rastreado Jugadores

```java
// Rastrear una referencia de jugador
world.trackPlayerRef(playerRef);

// Dejar de rastrear una referencia de jugador
world.untrackPlayerRef(playerRef);
```

## Entidades

### Obteniendo Entidades

```java
// Obtener entidad por UUID
Entity entity = world.getEntity(uuid);

// Obtener referencia de entidad por UUID
Ref<EntityStore> entityRef = world.getEntityRef(uuid);
```

### Apareciendo (Spawning) Entidades

```java
// Aparecer una entidad en una posición
Vector3d position = new Vector3d(x, y, z);
Vector3f rotation = new Vector3f(yaw, pitch, roll);

MyEntity entity = new MyEntity();
world.spawnEntity(entity, position, rotation);

// Añadir entidad con razón específica
world.addEntity(entity, position, rotation, AddReason.SPAWN);
```

## Chunks

### Cargando Chunks

```java
// Obtener chunk si ya está en memoria
WorldChunk chunk = world.getChunkIfInMemory(chunkIndex);

// Obtener chunk si está cargado
WorldChunk chunk = world.getChunkIfLoaded(chunkIndex);

// Cargar chunk asíncronamente
CompletableFuture<WorldChunk> future = world.getChunkAsync(chunkIndex);
```

### Gestores de Chunks

```java
// Obtener almacén de chunks
ChunkStore chunkStore = world.getChunkStore();

// Obtener gestor de iluminación de chunks
ChunkLightingManager lighting = world.getChunkLighting();
```

## Mensajería

```java
// Transmitir un mensaje a todos los jugadores en el mundo
world.sendMessage(Message.raw("¡Anuncio del servidor!"));

// Transmitir mensaje traducido
world.sendMessage(Message.translation("server.announcement.key"));
```

## Eventos

```java
// Obtener el registro de eventos del mundo
EventRegistry eventRegistry = world.getEventRegistry();

// Registrar un oyente de eventos específico del mundo
eventRegistry.register(MyEvent.class, event -> {
    // Manejar evento en este mundo
});
```

## Almacenes (Stores)

```java
// Obtener almacén de entidades para acceso a componentes
EntityStore entityStore = world.getEntityStore();

// Obtener almacén de chunks
ChunkStore chunkStore = world.getChunkStore();
```

## Ejecución

La clase World extiende `AbstractExecutorService` y puede ejecutar tareas en el hilo del mundo:

```java
// Ejecutar una tarea en el hilo del mundo
world.execute(() -> {
    // Esto se ejecuta en el hilo de tick del mundo
    // Seguro modificar el estado del mundo aquí
});
```

## Características (Features)

```java
// Comprobar si una característica está habilitada
boolean enabled = world.isFeatureEnabled(ClientFeature.SOME_FEATURE);

// Registrar una característica
world.registerFeature(ClientFeature.SOME_FEATURE, true);

// Obtener todas las características
Map<ClientFeature, Boolean> features = world.getFeatures();

// Transmitir estado de características a clientes
world.broadcastFeatures();
```

## Ejemplo: Comando de Información del Mundo

```java
public class WorldInfoCommand extends CommandBase {
    public WorldInfoCommand() {
        super("worldinfo", "Muestra información del mundo");
    }

    @Override
    protected void executeSync(CommandContext context) {
        if (!context.isPlayer()) {
            context.sendMessage(Message.raw("Este comando requiere un jugador."));
            return;
        }

        Player player = context.senderAs(Player.class);
        World world = player.getWorld();

        StringBuilder info = new StringBuilder();
        info.append("=== Info del Mundo ===\n");
        info.append("Nombre: ").append(world.getName()).append("\n");
        info.append("Jugadores: ").append(world.getPlayerCount()).append("\n");
        info.append("Tick: ").append(world.getTick()).append("\n");
        info.append("Ticking: ").append(world.isTicking()).append("\n");
        info.append("Pausado: ").append(world.isPaused()).append("\n");
        info.append("Vivo: ").append(world.isAlive()).append("\n");

        context.sendMessage(Message.raw(info.toString()));
    }
}
```

## Clases Relacionadas

- [`WorldConfig`](/docs/es/api/server-internals/world#worldconfig) - Configuración del mundo
- [`WorldChunk`](/docs/es/api/server-internals/chunks) - Representación de chunk
- [`EntityStore`](/docs/es/api/server-internals/ecs) - Almacenamiento de componentes de entidad
- [`Universe`](/docs/es/api/server-internals/universe) - Contenedor/gestor de mundos
- [`Player`](/docs/es/api/server-internals/player) - Entidad de jugador

## WorldConfig

La clase `WorldConfig` contiene configuraciones del mundo.

### Propiedades Comunes

| Método               | Tipo de Retorno | Descripción                                      |
| -------------------- | --------------- | ------------------------------------------------ |
| `getUuid()`          | `UUID`          | Devuelve el identificador único del mundo        |
| `getDisplayName()`   | `String`        | Devuelve el nombre visible                       |
| `getSpawnPosition()` | `Vector3d`      | Devuelve la posición de aparición predeterminada |
