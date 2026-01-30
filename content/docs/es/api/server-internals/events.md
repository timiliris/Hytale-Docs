---
id: events
title: Sistema de Eventos
sidebar_label: Eventos
sidebar_position: 3
description: Documentación completa del sistema EventBus para el servidor de Hytale
---

# Sistema de Eventos

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada con el código fuente descompilado del servidor utilizando análisis multiagente. Toda la información incluye referencias a los archivos fuente.
:::

## ¿Qué es un Sistema de Eventos?

Un **sistema de eventos** permite que diferentes partes del código se comuniquen sin conocerse directamente entre sí. En lugar de llamar métodos en otros objetos, el código "publica" eventos y otro código se "suscribe" para recibirlos.

### El Problema Sin Eventos

Imagina que quieres que sucedan múltiples cosas cuando un jugador se une al servidor:

- Enviar un mensaje de bienvenida
- Cargar su inventario desde la base de datos
- Notificar a sus amigos que están en línea
- Iniciar su temporizador de misión diaria

Sin eventos, el código de conexión necesitaría conocer y llamar a todos estos sistemas:

```java
// Sin eventos - fuertemente acoplado, difícil de mantener
void onPlayerConnect(Player player) {
    messageSystem.sendWelcome(player);      // Conexión conoce sobre mensajería
    database.loadInventory(player);          // Conexión conoce sobre base de datos
    friendSystem.notifyOnline(player);       // Conexión conoce sobre amigos
    questSystem.startDailyTimer(player);     // Conexión conoce sobre misiones
}
```

Añadir una nueva característica significa modificar el código de conexión cada vez.

### La Solución con Eventos

Con eventos, el código de conexión solo anuncia "un jugador se conectó" y cualquiera interesado puede reaccionar:

```java
// Con eventos - bajamente acoplado, fácil de extender
void onPlayerConnect(Player player) {
    eventBus.dispatch(new PlayerConnectEvent(player));
    // ¡Eso es todo! Otros sistemas escuchan este evento
}

// En otro lugar, completamente independiente:
eventBus.register(PlayerConnectEvent.class, event -> sendWelcome(event.getPlayer()));
eventBus.register(PlayerConnectEvent.class, event -> loadInventory(event.getPlayer()));
// ¡Añade nuevos oyentes sin tocar el código de conexión!
```

### Analogía del Mundo Real

Piensa en los eventos como una **suscripción a un periódico**:

| Concepto       | Sistema de Eventos         | Periódico                    |
| -------------- | -------------------------- | ---------------------------- |
| **Publicador** | Código que dispara eventos | Compañía de periódicos       |
| **Evento**     | La cosa que sucedió        | El periódico de hoy          |
| **Suscriptor** | Código que escucha eventos | Personas que se suscribieron |
| **EventBus**   | El mecanismo de entrega    | Servicio postal              |

- El periódico no sabe quiénes son sus lectores
- Los lectores no necesitan visitar la imprenta
- Nuevos lectores pueden suscribirse en cualquier momento
- Los lectores pueden darse de baja cuando se mudan

### Eventos Síncronos vs Asíncronos

Hytale soporta dos tipos de eventos:

| Tipo          | Cuándo Usarlo                                                          | Analogía del Mundo Real                       |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| **Síncrono**  | Cuando necesitas una respuesta inmediata o quieres cancelar una acción | Llamada telefónica - esperas una respuesta    |
| **Asíncrono** | Cuando la acción puede ocurrir en segundo plano                        | Correo electrónico - no esperas una respuesta |

**Ejemplo**: Un filtro de chat debería ser **síncrono** (necesitas bloquear el mensaje antes de que se envíe), pero registrar en una base de datos puede ser **asíncrono** (el jugador no necesita esperar por ello).

### Prioridades de Eventos

Múltiples suscriptores pueden escuchar el mismo evento. Las prioridades controlan quién reacciona primero:

```
FIRST (primero/más alto) → Comprobaciones de seguridad, validación
EARLY (temprano)         → Transformación de datos, preprocesamiento
NORMAL (normal)          → Lógica de negocio principal
LATE (tarde)             → Registro, análisis
LAST (último/más bajo)   → Limpieza, comportamiento de respaldo
```

**Ejemplo**: Un mensaje de chat pasa por:

1. **FIRST**: Comprobaciones de filtro de spam (puede cancelar si es spam)
2. **EARLY**: Filtro de censura (modifica malas palabras)
3. **NORMAL**: Plugin de chat añade prefijo [VIP]
4. **LATE**: Analytics registra el mensaje
5. **LAST**: Sistema de respaldo guarda el historial de chat

---

## Implementación de Eventos de Hytale

El sistema de eventos de Hytale está construido sobre el patrón de publicación-suscripción, permitiendo a módulos y plugins responder a acciones en el juego sin estar fuertemente acoplados al código núcleo del servidor.

## Arquitectura

### Jerarquía de Clases

```
IBaseEvent<KeyType>
├── IEvent<KeyType>          (eventos síncronos)
└── IAsyncEvent<KeyType>     (eventos asíncronos)
```

El sistema utiliza un `KeyType` genérico que permite filtrar eventos por clave. Por ejemplo, los eventos de jugador pueden usar el UUID del jugador como clave.

### EventBus

El `EventBus` es el componente central responsable de gestionar el registro y distribución de eventos.

```java
public class EventBus implements IEventBus {
    private final Map<Class<? extends IBaseEvent<?>>, EventBusRegistry<?, ?, ?>> registryMap;
    private final boolean timeEvents;

    public EventBus(boolean timeEvents) {
        this.timeEvents = timeEvents;
    }
}
```

El parámetro `timeEvents` habilita el seguimiento de rendimiento para cada manejador de eventos.

### Registros Síncronos vs Asíncronos

El sistema distingue entre dos tipos de registros:

#### SyncEventBusRegistry

Para eventos síncronos (`IEvent`), la ejecución es bloqueante y secuencial:

```java
// Despacho síncrono - devuelve el evento tras procesarlo
EventType result = eventBus.dispatchFor(MyEvent.class, key).dispatch(event);
```

#### AsyncEventBusRegistry

Para eventos asíncronos (`IAsyncEvent`), la ejecución usa `CompletableFuture`:

```java
// Despacho asíncrono - devuelve un Future
CompletableFuture<EventType> future = eventBus.dispatchForAsync(MyAsyncEvent.class, key).dispatch(event);
```

## Suscribiéndose a Eventos

### Registro Básico

```java
// Evento sin una clave (KeyType = Void)
eventBus.register(BootEvent.class, event -> {
    System.out.println("Server is booting!");
});

// Evento con una clave
eventBus.register(PlayerChatEvent.class, "chatChannel", event -> {
    System.out.println(event.getSender().getUsername() + ": " + event.getContent());
});
```

### Registro con Prioridad

```java
// Usando el enum EventPriority
eventBus.register(EventPriority.EARLY, PlayerConnectEvent.class, event -> {
    // Ejecutado antes de los manejadores NORMAL
});

// Usando un valor short personalizado
eventBus.register((short) -100, PlayerConnectEvent.class, event -> {
    // Valores negativos = mayor prioridad
});
```

### Registro Global

Los manejadores globales son invocados para TODOS los eventos de un tipo dado, independientemente de la clave:

```java
// Intercepta todos los PlayerChatEvents, independientemente del canal
eventBus.registerGlobal(PlayerChatEvent.class, event -> {
    logChat(event);
});
```

### Registro No Manejado

Los manejadores "No Manejados" (Unhandled) son invocados SOLO si ningún otro manejador ha procesado el evento:

```java
eventBus.registerUnhandled(PlayerInteractEvent.class, event -> {
    // Comportamiento por defecto si no existe un manejador específico
    event.getPlayer().sendMessage("Action not supported");
});
```

### Registro Asíncrono

Para eventos asíncronos, los manejadores usan `Function` sobre `CompletableFuture`:

```java
eventBus.registerAsync(PlayerChatEvent.class, future -> {
    return future.thenApply(event -> {
        // Asynchronous processing
        filterBadWords(event);
        return event;
    });
});

// With priority
eventBus.registerAsync(EventPriority.FIRST, PlayerChatEvent.class, future -> {
    return future.thenCompose(event -> {
        return checkPermissionsAsync(event.getSender())
            .thenApply(allowed -> {
                if (!allowed) event.setCancelled(true);
                return event;
            });
    });
});
```

### Desregistro

El registro devuelve un `EventRegistration` que te permite darte de baja:

```java
EventRegistration<Void, BootEvent> registration = eventBus.register(BootEvent.class, event -> {
    // Manejador
});

// Más tarde, para darte de baja
registration.unregister();

// Comprobar si sigue activo
if (registration.isEnabled()) {
    // El manejador sigue activo
}
```

### Combinando Registros

```java
EventRegistration<?, ?> combined = EventRegistration.combine(
    registration1,
    registration2,
    registration3
);

// Desregistra todos los manejadores a la vez
combined.unregister();
```

## Prioridades de Eventos

### Enum EventPriority

```java
public enum EventPriority {
    FIRST((short) -21844),   // Prioridad más alta
    EARLY((short) -10922),
    NORMAL((short) 0),       // Prioridad por defecto
    LATE((short) 10922),
    LAST((short) 21844);     // Prioridad más baja
}
```

### Orden de Ejecución

1. Los manejadores se ordenan por prioridad (valor short ascendente)
2. Dentro de la misma prioridad, se conserva el orden de registro
3. Los manejadores globales se ejecutan después de los manejadores específicos
4. Los manejadores no manejados solo se invocan si ningún otro manejador ha procesado el evento

### Prioridades Especiales para Apagado

`ShutdownEvent` define constantes de prioridad específicas:

```java
public class ShutdownEvent implements IEvent<Void> {
    public static final short DISCONNECT_PLAYERS = -48;
    public static final short UNBIND_LISTENERS = -40;
    public static final short SHUTDOWN_WORLDS = -32;
}
```

Uso:

```java
eventBus.register(ShutdownEvent.DISCONNECT_PLAYERS, ShutdownEvent.class, event -> {
    // Desconectar jugadores primero
});

eventBus.register(ShutdownEvent.SHUTDOWN_WORLDS, ShutdownEvent.class, event -> {
    // Guardar mundos después
});
```

## Cancelación de Eventos (ICancellable)

### Interfaz ICancellable

```java
public interface ICancellable {
    boolean isCancelled();
    void setCancelled(boolean cancelled);
}
```

### Uso

```java
eventBus.register(EventPriority.FIRST, PlayerChatEvent.class, event -> {
    if (containsBadWords(event.getContent())) {
        event.setCancelled(true);  // Cancela el mensaje
        event.getSender().sendMessage("Message blocked!");
    }
});

// Los manejadores subsiguientes pueden comprobar la cancelación
eventBus.register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    if (event.isCancelled()) {
        return; // Ignorar si ya está cancelado
    }
    // Procesamiento normal
});
```

### Eventos Cancelables Disponibles

| Evento                         | Descripción                             |
| ------------------------------ | --------------------------------------- |
| `PlayerChatEvent`              | Mensaje de chat                         |
| `PlayerInteractEvent`          | Interacción de jugador                  |
| `PlayerSetupConnectEvent`      | Conexión de jugador (pre-aparición)     |
| `PlayerMouseButtonEvent`       | Clic de ratón                           |
| `PlayerMouseMotionEvent`       | Movimiento de ratón                     |
| `BreakBlockEvent`              | Destrucción de bloque                   |
| `PlaceBlockEvent`              | Colocación de bloque                    |
| `DamageBlockEvent`             | Daño a bloque                           |
| `UseBlockEvent.Pre`            | Uso de bloque (pre)                     |
| `DropItemEvent`                | Soltar objeto                           |
| `CraftRecipeEvent`             | Creación de receta                      |
| `SwitchActiveSlotEvent`        | Cambio de ranura activa                 |
| `ChangeGameModeEvent`          | Cambio de modo de juego                 |
| `InteractivelyPickupItemEvent` | Recogida de objeto                      |
| `DiscoverZoneEvent.Display`    | Visualización de descubrimiento de zona |

## Referencia de Eventos

### Eventos del Servidor

| Evento                 | Tipo | Cancelable | Descripción                          |
| ---------------------- | ---- | ---------- | ------------------------------------ |
| `BootEvent`            | Sync | No         | Servidor iniciado                    |
| `ShutdownEvent`        | Sync | No         | Servidor apagándose                  |
| `PrepareUniverseEvent` | Sync | No         | Preparación del universo (deprecado) |

### Eventos de Jugador

| Evento                       | Tipo  | Cancelable | Descripción                  |
| ---------------------------- | ----- | ---------- | ---------------------------- |
| `PlayerSetupConnectEvent`    | Sync  | Sí         | Pre-conexión (autenticación) |
| `PlayerConnectEvent`         | Sync  | No         | Conexión establecida         |
| `PlayerSetupDisconnectEvent` | Sync  | No         | Pre-desconexión              |
| `PlayerDisconnectEvent`      | Sync  | No         | Desconexión                  |
| `AddPlayerToWorldEvent`      | Sync  | No         | Jugador añadido al mundo     |
| `DrainPlayerFromWorldEvent`  | Sync  | No         | Jugador eliminado del mundo  |
| `PlayerReadyEvent`           | Sync  | No         | Jugador listo                |
| `PlayerChatEvent`            | Async | Sí         | Mensaje de chat              |
| `PlayerInteractEvent`        | Sync  | Sí         | Interacción (deprecado)      |
| `PlayerCraftEvent`           | Sync  | No         | Creación (deprecado)         |
| `PlayerMouseButtonEvent`     | Sync  | Sí         | Clic de ratón                |
| `PlayerMouseMotionEvent`     | Sync  | Sí         | Movimiento de ratón          |

### Eventos de Entidad

| Evento                             | Tipo | Cancelable | Descripción               |
| ---------------------------------- | ---- | ---------- | ------------------------- |
| `EntityRemoveEvent`                | Sync | No         | Entidad eliminada         |
| `LivingEntityInventoryChangeEvent` | Sync | No         | Cambio de inventario      |
| `LivingEntityUseBlockEvent`        | Sync | No         | Uso de bloque (deprecado) |

### Eventos de ECS (Entity Component System)

| Evento                          | Tipo | Cancelable | Descripción                                     |
| ------------------------------- | ---- | ---------- | ----------------------------------------------- |
| `BreakBlockEvent`               | ECS  | Sí         | Destrucción de bloque                           |
| `PlaceBlockEvent`               | ECS  | Sí         | Colocación de bloque                            |
| `DamageBlockEvent`              | ECS  | Sí         | Daño a bloque                                   |
| `UseBlockEvent.Pre`             | ECS  | Sí         | Uso de bloque (pre)                             |
| `UseBlockEvent.Post`            | ECS  | No         | Uso de bloque (post)                            |
| `DropItemEvent.PlayerRequest`   | ECS  | Sí         | Solicitud de soltar                             |
| `DropItemEvent.Drop`            | ECS  | Sí         | Soltar real                                     |
| `CraftRecipeEvent.Pre`          | ECS  | Sí         | Pre-creación                                    |
| `CraftRecipeEvent.Post`         | ECS  | No         | Post-creación                                   |
| `SwitchActiveSlotEvent`         | ECS  | Sí         | Cambio de ranura                                |
| `ChangeGameModeEvent`           | ECS  | Sí         | Cambio de modo de juego                         |
| `InteractivelyPickupItemEvent`  | ECS  | Sí         | Recogida de objeto                              |
| `DiscoverZoneEvent.Display`     | ECS  | Sí         | Visualización de zona                           |
| `DiscoverInstanceEvent`         | ECS  | No         | Descubrimiento de instancia                     |
| `DiscoverInstanceEvent.Display` | ECS  | Sí         | Visualización UI de descubrimiento de instancia |
| `MoonPhaseChangeEvent`          | ECS  | No         | Fase lunar cambiada                             |
| `TreasureChestOpeningEvent`     | ECS  | No         | Cofre del tesoro abierto                        |

### Eventos Misceláneos

| Evento                           | Tipo | Cancelable | Descripción                           |
| -------------------------------- | ---- | ---------- | ------------------------------------- |
| `MessagesUpdated`                | Sync | No         | Mensajes i18n cargados/actualizados   |
| `GenerateDefaultLanguageEvent`   | Sync | No         | Generación de idioma por defecto      |
| `KillFeedEvent.DecedentMessage`  | Sync | No         | Mensaje de muerte para la víctima     |
| `KillFeedEvent.Display`          | Sync | No         | Visualización UI de feed de muertes   |
| `KillFeedEvent.KillerMessage`    | Sync | No         | Mensaje de muerte para el atacante    |
| `SingleplayerRequestAccessEvent` | Sync | No         | Solicitud de acceso a un solo jugador |
| `PrefabPasteEvent`               | Sync | Sí         | Prefabricado pegado en el mundo       |
| `PrefabPlaceEntityEvent`         | Sync | No         | Entidad colocada desde prefabricado   |

### Eventos de Permiso

| Evento                                           | Tipo | Cancelable | Descripción                  |
| ------------------------------------------------ | ---- | ---------- | ---------------------------- |
| `PlayerPermissionChangeEvent.PermissionsAdded`   | Sync | No         | Permisos añadidos            |
| `PlayerPermissionChangeEvent.PermissionsRemoved` | Sync | No         | Permisos eliminados          |
| `PlayerPermissionChangeEvent.GroupAdded`         | Sync | No         | Grupo añadido                |
| `PlayerPermissionChangeEvent.GroupRemoved`       | Sync | No         | Grupo eliminado              |
| `GroupPermissionChangeEvent.Added`               | Sync | No         | Permisos de grupo añadidos   |
| `GroupPermissionChangeEvent.Removed`             | Sync | No         | Permisos de grupo eliminados |
| `PlayerGroupEvent.Added`                         | Sync | No         | Jugador añadido al grupo     |
| `PlayerGroupEvent.Removed`                       | Sync | No         | Jugador eliminado del grupo  |

## Creando Eventos Personalizados

### Evento Síncrono Simple

```java
public class MyCustomEvent implements IEvent<Void> {
    private final String message;

    public MyCustomEvent(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    @Override
    public String toString() {
        return "MyCustomEvent{message='" + message + "'}";
    }
}
```

### Evento con Clave

```java
public class PlayerScoreEvent implements IEvent<UUID> {
    private final UUID playerId;
    private final int score;

    public PlayerScoreEvent(UUID playerId, int score) {
        this.playerId = playerId;
        this.score = score;
    }

    public UUID getPlayerId() {
        return playerId;
    }

    public int getScore() {
        return score;
    }
}

// Registro con clave UUID
eventBus.register(PlayerScoreEvent.class, player.getUuid(), event -> {
    // Solo llamado para este jugador específico
});
```

### Evento Cancelable

```java
public class PlayerTeleportEvent implements IEvent<Void>, ICancellable {
    private final Player player;
    private Vector3d destination;
    private boolean cancelled = false;

    public PlayerTeleportEvent(Player player, Vector3d destination) {
        this.player = player;
        this.destination = destination;
    }

    public Player getPlayer() {
        return player;
    }

    public Vector3d getDestination() {
        return destination;
    }

    public void setDestination(Vector3d destination) {
        this.destination = destination;
    }

    @Override
    public boolean isCancelled() {
        return cancelled;
    }

    @Override
    public void setCancelled(boolean cancelled) {
        this.cancelled = cancelled;
    }
}
```

### Evento Asíncrono

```java
public class AsyncDatabaseEvent implements IAsyncEvent<Void> {
    private final String query;
    private Object result;

    public AsyncDatabaseEvent(String query) {
        this.query = query;
    }

    public String getQuery() {
        return query;
    }

    public Object getResult() {
        return result;
    }

    public void setResult(Object result) {
        this.result = result;
    }
}

// Despacho asíncrono
CompletableFuture<AsyncDatabaseEvent> future = eventBus
    .dispatchForAsync(AsyncDatabaseEvent.class)
    .dispatch(new AsyncDatabaseEvent("SELECT * FROM players"));

future.thenAccept(event -> {
    System.out.println("Query result: " + event.getResult());
});
```

### Evento ECS

Para eventos dentro del Sistema de Componentes de Entidad (ECS):

```java
// Evento ECS simple
public class MyEntityEvent extends EcsEvent {
    private final String data;

    public MyEntityEvent(String data) {
        this.data = data;
    }

    public String getData() {
        return data;
    }
}

// Evento ECS cancelable
public class MyEntityCancellableEvent extends CancellableEcsEvent {
    private final int value;

    public MyEntityCancellableEvent(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }
}
```

## Despachando Eventos

### Despacho Simple

```java
// Crear y despachar un evento
MyCustomEvent event = new MyCustomEvent("Hello World");
MyCustomEvent result = eventBus.dispatchFor(MyCustomEvent.class).dispatch(event);

// Comprobar si fue cancelado (si aplica)
if (result instanceof ICancellable && ((ICancellable) result).isCancelled()) {
    // El evento fue cancelado
}
```

### Despacho con Clave

```java
UUID playerId = player.getUuid();
PlayerScoreEvent event = new PlayerScoreEvent(playerId, 100);

// Despachar a manejadores registrados para esta clave
eventBus.dispatchFor(PlayerScoreEvent.class, playerId).dispatch(event);
```

### Despacho Asíncrono

```java
PlayerChatEvent chatEvent = new PlayerChatEvent(sender, targets, message);

CompletableFuture<PlayerChatEvent> future = eventBus
    .dispatchForAsync(PlayerChatEvent.class)
    .dispatch(chatEvent);

future.whenComplete((event, error) -> {
    if (error != null) {
        logger.error("Chat event failed", error);
        return;
    }

    if (!event.isCancelled()) {
        broadcastMessage(event);
    }
});
```

### Comprobando Oyentes

```java
IEventDispatcher<MyEvent, MyEvent> dispatcher = eventBus.dispatchFor(MyEvent.class);

if (dispatcher.hasListener()) {
    // Al menos un manejador está registrado
    dispatcher.dispatch(new MyEvent());
} else {
    // Sin manejadores, optimización posible
}
```

## Ejemplos Completos

### Plugin de Moderación de Chat

```java
public class ChatModerationPlugin {
    private final EventBus eventBus;
    private final Set<String> bannedWords;
    private EventRegistration<?, ?> registration;

    public ChatModerationPlugin(EventBus eventBus) {
        this.eventBus = eventBus;
        this.bannedWords = loadBannedWords();
    }

    public void enable() {
        registration = eventBus.registerAsync(
            EventPriority.FIRST,
            PlayerChatEvent.class,
            this::handleChat
        );
    }

    public void disable() {
        if (registration != null) {
            registration.unregister();
        }
    }

    private CompletableFuture<PlayerChatEvent> handleChat(
            CompletableFuture<PlayerChatEvent> future) {
        return future.thenApply(event -> {
            String content = event.getContent().toLowerCase();

            for (String word : bannedWords) {
                if (content.contains(word)) {
                    event.setCancelled(true);
                    // Notificar al jugador asíncronamente
                    CompletableFuture.runAsync(() -> {
                        warnPlayer(event.getSender(), word);
                    });
                    break;
                }
            }

            return event;
        });
    }
}
```

### Protección de Zona

```java
public class ZoneProtectionPlugin {
    private final EventBus eventBus;
    private final List<EventRegistration<?, ?>> registrations = new ArrayList<>();

    public void enable() {
        // Bloquear destrucción de bloques
        registrations.add(eventBus.register(
            EventPriority.FIRST,
            BreakBlockEvent.class,
            this::onBlockBreak
        ));

        // Bloquear colocación de bloques
        registrations.add(eventBus.register(
            EventPriority.FIRST,
            PlaceBlockEvent.class,
            this::onBlockPlace
        ));
    }

    public void disable() {
        registrations.forEach(EventRegistration::unregister);
        registrations.clear();
    }

    private void onBlockBreak(BreakBlockEvent event) {
        Vector3i pos = event.getTargetBlock();
        if (isProtectedZone(pos)) {
            event.setCancelled(true);
        }
    }

    private void onBlockPlace(PlaceBlockEvent event) {
        Vector3i pos = event.getTargetBlock();
        if (isProtectedZone(pos)) {
            event.setCancelled(true);
        }
    }
}
```

### Gestión de Conexiones

```java
public class ConnectionManager {
    private final EventBus eventBus;

    public void enable() {
        // Pre-conexión: verificación de whitelist
        eventBus.register(EventPriority.FIRST, PlayerSetupConnectEvent.class, event -> {
            if (!isWhitelisted(event.getUuid())) {
                event.setCancelled(true);
                event.setReason("You are not on the whitelist!");
            }
        });

        // Conexión establecida: mensaje de bienvenida
        eventBus.register(PlayerConnectEvent.class, event -> {
            World spawnWorld = getSpawnWorld();
            event.setWorld(spawnWorld);
        });

        // Jugador en mundo: difusión (evento global)
        eventBus.registerGlobal(AddPlayerToWorldEvent.class, event -> {
            String username = event.getHolder()
                .getComponent(Player.getComponentType())
                .getUsername();
            broadcastJoin(username);
        });

        // Desconexión
        eventBus.register(PlayerDisconnectEvent.class, event -> {
            String username = event.getPlayerRef().getUsername();
            PacketHandler.DisconnectReason reason = event.getDisconnectReason();
            logDisconnection(username, reason);
        });
    }
}
```

### Redirección de Servidor

```java
eventBus.register(PlayerSetupConnectEvent.class, event -> {
    // Redirigir a otro servidor
    if (isServerFull()) {
        byte[] referralData = createReferralData(event.getUuid());
        event.referToServer("backup.server.com", 25565, referralData);
    }

    // Comprobar si es una conexión de referencia
    if (event.isReferralConnection()) {
        byte[] data = event.getReferralData();
        HostAddress source = event.getReferralSource();
        handleReferral(event, data, source);
    }
});
```

## Mejores Prácticas

### 1. Usa las Prioridades Correctamente

```java
// FIRST: Seguridad, validación
eventBus.register(EventPriority.FIRST, PlayerChatEvent.class, this::validateChat);

// EARLY: Transformación de datos
eventBus.register(EventPriority.EARLY, PlayerChatEvent.class, this::formatChat);

// NORMAL: Lógica de negocio principal
eventBus.register(PlayerChatEvent.class, this::processChat);

// LATE: Registro, análisis
eventBus.register(EventPriority.LATE, PlayerChatEvent.class, this::logChat);

// LAST: Limpieza, respaldo
eventBus.register(EventPriority.LAST, PlayerChatEvent.class, this::cleanupChat);
```

### 2. Siempre Desregistra

```java
public class MyPlugin implements AutoCloseable {
    private final List<EventRegistration<?, ?>> registrations = new ArrayList<>();

    public void enable() {
        registrations.add(eventBus.register(...));
        registrations.add(eventBus.register(...));
    }

    @Override
    public void close() {
        registrations.forEach(EventRegistration::unregister);
        registrations.clear();
    }
}
```

### 3. Comprueba la Cancelación

```java
eventBus.register(EventPriority.NORMAL, PlayerChatEvent.class, event -> {
    // Siempre comprueba si un manejador anterior canceló el evento
    if (event.isCancelled()) {
        return;
    }

    // Procesamiento...
});
```

### 4. Usa Async para Operaciones de Larga Duración

```java
// Mal: bloquea el hilo principal
eventBus.register(PlayerConnectEvent.class, event -> {
    loadPlayerDataFromDatabase(event.getPlayerRef()); // ¡BLOQUEANTE!
});

// Bien: usa un evento async o CompletableFuture
eventBus.registerAsync(PlayerChatEvent.class, future -> {
    return future.thenCompose(event -> {
        return loadPlayerDataAsync(event.getSender())
            .thenApply(data -> event);
    });
});
```

### 5. Maneja Excepciones

```java
eventBus.register(PlayerChatEvent.class, event -> {
    try {
        processChat(event);
    } catch (Exception e) {
        logger.error("Error processing chat", e);
        // No relanzar - permite que otros manejadores se ejecuten
    }
});
```
