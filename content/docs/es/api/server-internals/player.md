---
id: player
title: API de Jugador
sidebar_label: Jugador
sidebar_position: 5
description: Documentación completa de la clase Player y APIs relacionadas
---

# API de Jugador

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada con el código fuente descompilado del servidor utilizando análisis multi-agente.
:::

## Visión General

La clase `Player` representa una entidad de jugador conectado en el mundo del juego. Extiende `LivingEntity` e implementa las interfaces `CommandSender` y `PermissionHolder`.

**Source**: `com.hypixel.hytale.server.core.entity.entities.Player`

**Import**:

```java
import com.hypixel.hytale.server.core.entity.entities.Player;
```

## Obteniendo una Referencia de Jugador

### Desde CommandContext

```java
@Override
protected void executeSync(CommandContext context) {
    if (context.isPlayer()) {
        Player player = context.senderAs(Player.class);
        // Trabajar con el jugador
    }
}
```

### Desde Entity Store

```java
// Usando una Ref<EntityStore>
Player player = store.getComponent(ref, Player.getComponentType());
```

### Desde PlayerRef

```java
PlayerRef playerRef = store.getComponent(ref, PlayerRef.getComponentType());
String username = playerRef.getUsername();
UUID uuid = playerRef.getUuid();
```

## Propiedades del Jugador

### Información Básica

| Método             | Tipo de Retorno    | Descripción                                             |
| ------------------ | ------------------ | ------------------------------------------------------- |
| `getDisplayName()` | `String`           | Devuelve el nombre visible del jugador                  |
| `getUuid()`        | `UUID`             | Devuelve el UUID del jugador (obsoleto, usar PlayerRef) |
| `getReference()`   | `Ref<EntityStore>` | Devuelve la referencia de entidad del jugador           |
| `getWorld()`       | `World`            | Devuelve el mundo en el que está el jugador             |

### Estado del Juego

| Método                      | Tipo de Retorno | Descripción                                               |
| --------------------------- | --------------- | --------------------------------------------------------- |
| `getGameMode()`             | `GameMode`      | Devuelve el modo de juego actual del jugador              |
| `isFirstSpawn()`            | `boolean`       | Devuelve true si esta es la primera aparición del jugador |
| `hasSpawnProtection()`      | `boolean`       | Devuelve true si el jugador tiene protección de aparición |
| `isWaitingForClientReady()` | `boolean`       | Devuelve true si espera la señal de listo del cliente     |

### Permisos

| Método                                  | Tipo de Retorno | Descripción                                           |
| --------------------------------------- | --------------- | ----------------------------------------------------- |
| `hasPermission(String id)`              | `boolean`       | Comprueba si el jugador tiene el permiso especificado |
| `hasPermission(String id, boolean def)` | `boolean`       | Comprueba el permiso con valor predeterminado         |

## Gestores (Managers)

La clase Player proporciona acceso a varios objetos gestores:

```java
Player player = context.senderAs(Player.class);

// Gestor de páginas - para páginas de IU personalizadas
PageManager pageManager = player.getPageManager();

// Gestor de ventanas - para ventanas de inventario/contenedores
WindowManager windowManager = player.getWindowManager();

// Gestor de HUD - para elementos de visualización frontal
HudManager hudManager = player.getHudManager();

// Gestor de barra rápida - para gestión de ranuras de barra rápida
HotbarManager hotbarManager = player.getHotbarManager();

// Rastreador de mapa mundial
WorldMapTracker worldMapTracker = player.getWorldMapTracker();
```

## Enviando Mensajes

```java
import com.hypixel.hytale.server.core.Message;

// Send a raw text message
player.sendMessage(Message.raw("Hello, player!"));

// Send a translated message
player.sendMessage(Message.translation("server.welcome.message"));

// Send a message with formatting
player.sendMessage(Message.translation("server.greeting")
    .param("name", player.getDisplayName())
    .bold(true));
```

// Enviar un mensaje de texto puro
player.sendMessage(Message.raw("¡Hola, jugador!"));

// Enviar un mensaje traducido
player.sendMessage(Message.translation("server.welcome.message"));

// Enviar un mensaje con formato

```java
// Obtener el inventario del jugador
Inventory inventory = player.getInventory();

// Enviar actualización de inventario al cliente
player.sendInventory();
```

## Movimiento y Posición

```java
// Mover jugador a una posición
player.moveTo(ref, x, y, z, componentAccessor);

// Obtener radio de visión
int viewRadius = player.getViewRadius();
int clientViewRadius = player.getClientViewRadius();

// Establecer radio de visión
player.setClientViewRadius(viewRadius);
```

## Abriendo Páginas de IU

```java
import com.hypixel.hytale.server.core.entity.entities.player.pages.CustomUIPage;

// Obtener referencias
Ref<EntityStore> ref = player.getReference();
Store<EntityStore> store = ref.getStore();
PlayerRef playerRef = store.getComponent(ref, PlayerRef.getComponentType());

// Crear y abrir una página personalizada
MyCustomPage page = new MyCustomPage(playerRef);
player.getPageManager().openCustomPage(ref, store, page);

// Cerrar la página actual
player.getPageManager().setPage(ref, store, Page.None);
```

## Ejemplo: Comando de Jugador Completo

```java
public class PlayerInfoCommand extends CommandBase {
    public PlayerInfoCommand() {
        super("playerinfo", "Muestra información del jugador");
    }

    @Override
    protected void executeSync(CommandContext context) {
        if (!context.isPlayer()) {
            context.sendMessage(Message.raw("Este comando requiere un jugador."));
            return;
        }

        Player player = context.senderAs(Player.class);
        Ref<EntityStore> ref = player.getReference();
        Store<EntityStore> store = ref.getStore();
        PlayerRef playerRef = store.getComponent(ref, PlayerRef.getComponentType());

        StringBuilder info = new StringBuilder();
        info.append("=== Info del Jugador ===\n");
        info.append("Usuario: ").append(playerRef.getUsername()).append("\n");
        info.append("UUID: ").append(playerRef.getUuid()).append("\n");
        info.append("Mundo: ").append(player.getWorld().getName()).append("\n");
        info.append("Radio de Visión: ").append(player.getViewRadius()).append(" chunks\n");
        info.append("Primera Aparición: ").append(player.isFirstSpawn()).append("\n");

        context.sendMessage(Message.raw(info.toString()));
    }
}
```

## Clases Relacionadas

- [`PlayerRef`](/docs/es/api/server-internals/player#playerref) - Componente de referencia de jugador
- [`LivingEntity`](/docs/es/api/server-internals/entities) - Clase base para entidades vivientes
- [`CommandSender`](/docs/es/api/server-internals/commands#commandsender-interface) - Interfaz para emisores de comandos
- [`PageManager`](/docs/es/api/server-internals/ui) - Gestión de páginas de IU
- [`WindowManager`](/docs/es/api/server-internals/ui) - Gestión de ventanas/contenedores

## PlayerRef

La clase `PlayerRef` es un componente que proporciona identidad de jugador e información de red.

**Fuente**: `com.hypixel.hytale.server.core.universe.PlayerRef`

### Obteniendo PlayerRef

```java
PlayerRef playerRef = store.getComponent(ref, PlayerRef.getComponentType());
```

### Métodos de PlayerRef

| Método                 | Tipo de Retorno    | Descripción                                          |
| ---------------------- | ------------------ | ---------------------------------------------------- |
| `getUuid()`            | `UUID`             | Devuelve el UUID del jugador                         |
| `getUsername()`        | `String`           | Devuelve el nombre de usuario del jugador            |
| `getLanguage()`        | `String`           | Devuelve la configuración de idioma del jugador      |
| `getReference()`       | `Ref<EntityStore>` | Devuelve la referencia de entidad                    |
| `getPacketHandler()`   | `PacketHandler`    | Devuelve el manejador de paquetes de red             |
| `getChunkTracker()`    | `ChunkTracker`     | Devuelve el rastreador de chunks                     |
| `isValid()`            | `boolean`          | Devuelve true si la referencia del jugador es válida |
| `sendMessage(Message)` | `void`             | Envía un mensaje al jugador                          |

### Referencia de Servidor

```java
// Redirigir jugador a otro servidor
playerRef.referToServer("other.server.com", 5520);

// Con datos de referencia
byte[] data = createReferralData();
playerRef.referToServer("other.server.com", 5520, data);
```
