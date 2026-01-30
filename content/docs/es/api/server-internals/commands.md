---
id: commands
title: Sistema de Comandos
sidebar_label: Comandos
sidebar_position: 4
description: Documentación completa del sistema de comandos para el servidor de Hytale
---

# Sistema de Comandos

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada con el código fuente descompilado del servidor utilizando análisis multiagente. Toda la información incluye referencias a los archivos fuente.
:::

## ¿Qué es un Sistema de Comandos?

Un **sistema de comandos** es la interfaz basada en texto que permite a los jugadores y administradores interactuar con el servidor. Cuando escribes `/gamemode creative` en el chat, el sistema de comandos analiza tu entrada, valida los permisos y ejecuta la acción apropiada.

### Cómo Funcionan los Comandos

Piensa en los comandos como si ordenaras en un restaurante:

```
/give Steve diamond_sword --quantity=5 --enchanted
  │     │        │               │           │
  │     │        │               │           └── Bandera (opción sí/no)
  │     │        │               └── Argumento opcional
  │     │        └── Argumento requerido
  │     └── Objetivo (quién lo recibe)
  └── Nombre del comando
```

El sistema de comandos se encarga de:
1. **Análisis (Parsing)**: Dividir el texto en partes.
2. **Validación**: Comprobar si los argumentos son válidos.
3. **Permisos**: Verificar si el emisor tiene acceso.
4. **Ejecución**: Ejecutar la lógica real.

### Anatomía de un Comando

Todo comando tiene estas partes:

| Parte | Qué hace | Ejemplo |
|------|--------------|---------|
| **Nombre** | Cómo llamar al comando | `give`, `teleport`, `ban` |
| **Alias** | Nombres alternativos | `tp` para `teleport` |
| **Argumentos** | Datos que el comando necesita | Nombre del jugador, ID del objeto |
| **Permiso** | Quién puede usarlo | `hytale.command.give` |
| **Descripción** | Texto de ayuda | "Da objetos a los jugadores" |

### Comandos Síncronos vs Asíncronos

Los comandos pueden ejecutarse en dos modos:

| Tipo | Cuándo usarlo | Ejemplo |
|------|-------------|---------|
| **Síncrono** | Operaciones rápidas que necesitan resultados inmediatos | `/kill` - el jugador muere instantáneamente |
| **Asíncrono** | Operaciones lentas que no deberían congelar el servidor | `/backup` - guardar el mundo lleva tiempo |

**Regla general**: Si tu comando se comunica con una base de datos, una API web o procesa muchos datos, hazlo asíncrono.

### Explicación de los Argumentos de Comando

Los argumentos son los datos que tu comando necesita. Hytale proporciona un sistema con seguridad de tipos:

```java
// El comando: /heal <player> --amount=50 --fully
RequiredArg<PlayerRef> targetArg;   // Debe proporcionar un jugador
OptionalArg<Integer> amountArg;     // Puede especificar una cantidad
FlagArg fullyFlag;                  // Booleano: ¿está presente --fully?
```

| Tipo de Argumento | Sintaxis | Cuándo usarlo |
|---------------|--------|-------------|
| **Requerido** | `<name>` | Debe ser proporcionado |
| **Opcional** | `--name=value` | Puede ser omitido |
| **Por defecto** | `--name=value` | Tiene un valor de respaldo |
| **Bandera (Flag)** | `--name` | Interruptor sí/no |

### La Jerarquía de Permisos

Los permisos controlan quién puede ejecutar qué:

```
hytale
├── command
│   ├── give          # Permiso para /give
│   │   └── others    # /give a otros jugadores
│   ├── teleport
│   │   ├── self      # Teletransportarse a sí mismo
│   │   └── others    # Teletransportar a otros jugadores
│   └── ban
│       └── permanent # Baneos permanentes
```

Los jugadores pueden tener:
- Permisos específicos: `hytale.command.give`
- Permisos con comodín: `hytale.command.*`
- Grupos de permisos: `Admin` (que incluye muchos permisos)

### Analogía del Mundo Real: Asistente de Voz

Los comandos funcionan como hablar con un asistente de voz:

- **"Oye Siri, pon un temporizador de 5 minutos"**
  - Comando: `set timer`
  - Argumento: `5 minutos`

- **"/give Steve diamond 64"**
  - Comando: `give`
  - Argumentos: `Steve`, `diamond`, `64`

Ambos necesitan:
1. Entender lo que estás pidiendo (análisis)
2. Comprobar si tienes permiso (permisos)
3. Ejecutar la acción
4. Informar del resultado

---

## Resumen Técnico

El servidor de Hytale implementa un sistema de comandos completo ubicado en `com.hypixel.hytale.server.core.command`. Este sistema proporciona un marco flexible para crear, registrar y ejecutar comandos con soporte completo para permisos, argumentos, subcomandos y ejecución asíncrona.

---

## Arquitectura

### Componentes Centrales

| Clase | Descripción |
|-------|-------------|
| `CommandManager` | Singleton responsable de gestionar el registro y la ejecución de comandos |
| `AbstractCommand` | Clase base de la que heredan todos los comandos |
| `CommandSender` | Interfaz que representa a las entidades capaces de ejecutar comandos |
| `CommandContext` | Contexto de ejecución que contiene el emisor y los argumentos analizados |
| `CommandRegistry` | Registro para comandos definidos por plugins |
| `ParseResult` | Contenedor para resultados de análisis y mensajes de error |
| `Tokenizer` | Analizador que convierte la entrada del comando en tokens |

### Jerarquía de Clases

```
AbstractCommand
├── CommandBase                    # Comandos síncronos
├── AbstractAsyncCommand           # Comandos asíncronos
│   ├── AbstractPlayerCommand      # Comandos restringidos a jugadores
│   ├── AbstractWorldCommand       # Comandos que requieren contexto del mundo
│   ├── AbstractTargetPlayerCommand # Comandos que apuntan a jugadores específicos
│   ├── AbstractTargetEntityCommand # Comandos que apuntan a entidades específicas
│   ├── AbstractAsyncPlayerCommand  # Comandos de jugador asíncronos
│   └── AbstractAsyncWorldCommand   # Comandos de mundo asíncronos
└── AbstractCommandCollection      # Comandos que consisten solo en subcomandos
```

---

## CommandManager

El `CommandManager` sirve como el centro neurálgico para todas las operaciones de gestión de comandos:

```java
public class CommandManager implements CommandOwner {
    private final Map<String, AbstractCommand> commandRegistration;
    private final Map<String, String> aliases;

    // Acceso Singleton
    public static CommandManager get();

    // Registrar comandos del sistema
    public void registerSystemCommand(AbstractCommand command);

    // Registrar cualquier comando
    public CommandRegistration register(AbstractCommand command);

    // Ejecutar un comando
    public CompletableFuture<Void> handleCommand(CommandSender sender, String commandString);
    public CompletableFuture<Void> handleCommand(PlayerRef playerRef, String command);
}
```

### Flujo de Ejecución de Comandos

1. La cadena del comando es tokenizada por el `Tokenizer`.
2. Se extrae y resuelve el nombre del comando (incluida la resolución de alias).
3. Se crea un contexto de análisis.
4. Se invoca el método `acceptCall()` del comando.
5. Se procesan y validan los argumentos.
6. Se llama al método `execute()` con el `CommandContext`.

---

## Creación de Comandos Personalizados

### Comando Síncrono Básico

```java
public class MyCommand extends CommandBase {
    public MyCommand() {
        super("mycommand", "server.commands.mycommand.desc");
        addAliases("mc", "mycmd");
    }

    @Override
    protected void executeSync(CommandContext context) {
        context.sendMessage(Message.raw("¡Hola!"));
    }
}
```

### Comando Asíncrono

```java
public class MyAsyncCommand extends AbstractAsyncCommand {
    public MyAsyncCommand() {
        super("myasync", "server.commands.myasync.desc");
    }

    @Override
    protected CompletableFuture<Void> executeAsync(CommandContext context) {
        return CompletableFuture.runAsync(() -> {
            // Realizar trabajo asíncrono aquí
            context.sendMessage(Message.raw("¡Hecho!"));
        });
    }
}
```

### Comando Solo para Jugadores

```java
public class MyPlayerCommand extends AbstractPlayerCommand {
    public MyPlayerCommand() {
        super("myplayercmd", "server.commands.myplayercmd.desc");
    }

    @Override
    protected void execute(
        CommandContext context,
        Store<EntityStore> store,
        Ref<EntityStore> ref,
        PlayerRef playerRef,
        World world
    ) {
        // Acceso al almacén del jugador y al mundo disponible
        Player player = store.getComponent(ref, Player.getComponentType());
        context.sendMessage(Message.raw("Hola " + playerRef.getUsername()));
    }
}
```

### Comando de Mundo

```java
public class MyWorldCommand extends AbstractWorldCommand {
    public MyWorldCommand() {
        super("myworldcmd", "server.commands.myworldcmd.desc");
    }

    @Override
    protected void execute(CommandContext context, World world, Store<EntityStore> store) {
        // Acceso al contexto del mundo disponible
        context.sendMessage(Message.raw("Mundo: " + world.getName()));
    }
}
```

### Colección de Comandos (Solo Subcomandos)

```java
public class MyCommandCollection extends AbstractCommandCollection {
    public MyCommandCollection() {
        super("mycollection", "server.commands.mycollection.desc");
        addSubCommand(new SubCommand1());
        addSubCommand(new SubCommand2());
    }
}
```

---

## Sistema de Argumentos

### Tipos de Argumentos

| Tipo | Descripción | Sintaxis |
|------|-------------|--------|
| `RequiredArg<T>` | Debe ser proporcionado por el usuario | `<nombre:tipo>` |
| `OptionalArg<T>` | Puede ser omitido | `--nombre=valor` |
| `DefaultArg<T>` | Opcional con un valor por defecto | `--nombre=valor` (se muestra el valor por defecto) |
| `FlagArg` | Bandera booleana | `--nombre` |

### Registro de Argumentos

```java
public class MyCommandWithArgs extends CommandBase {
    // Argumento requerido
    private final RequiredArg<String> nameArg =
        withRequiredArg("name", "description.key", ArgTypes.STRING);

    // Argumento opcional
    private final OptionalArg<Integer> countArg =
        withOptionalArg("count", "description.key", ArgTypes.INTEGER);

    // Argumento por defecto
    private final DefaultArg<Double> radiusArg =
        withDefaultArg("radius", "description.key", ArgTypes.DOUBLE, 10.0, "10");

    // Argumento de bandera
    private final FlagArg verboseFlag =
        withFlagArg("verbose", "description.key");

    // Argumento de lista
    private final RequiredArg<List<String>> tagsArg =
        withListRequiredArg("tags", "description.key", ArgTypes.STRING);
}
```

### Uso de Argumentos en Métodos de Ejecución

```java
@Override
protected void executeSync(CommandContext context) {
    // Obtener argumento requerido
    String name = nameArg.get(context);

    // Comprobar si se proporcionó un argumento opcional
    if (countArg.provided(context)) {
        Integer count = countArg.get(context);
    }

    // Los argumentos por defecto devuelven su valor por defecto si no se proporcionan
    Double radius = radiusArg.get(context);

    // Las banderas devuelven un valor booleano
    Boolean verbose = verboseFlag.get(context);
}
```

### Tipos de Argumentos Comunes (ArgTypes)

| Tipo | Tipo de Java | Descripción |
|------|-----------|-------------|
| `STRING` | `String` | Valor de texto |
| `INTEGER` | `Integer` | Número entero |
| `DOUBLE` | `Double` | Número decimal |
| `BOOLEAN` | `Boolean` | true/false |
| `PLAYER_REF` | `PlayerRef` | Referencia a un jugador en línea |
| `WORLD` | `World` | Referencia a un mundo cargado |
| `ITEM_ASSET` | `Item` | Referencia a un recurso de objeto |
| `BLOCK_TYPE_KEY` | `String` | Identificador de tipo de bloque |
| `GAME_MODE` | `GameMode` | Enumeración de modo de juego |
| `RELATIVE_POSITION` | `RelativeDoublePosition` | Posición (admite ~ para coordenadas relativas) |
| `ROTATION` | `Vector3f` | Vector de rotación |
| `ENTITY_ID` | `EntityWrappedArg` | Referencia a una entidad |

### Validación de Argumentos

```java
private final OptionalArg<Double> radiusArg =
    withOptionalArg("radius", "desc", ArgTypes.DOUBLE)
        .addValidator(Validators.greaterThan(0.0));
```

### Dependencias de Argumentos

```java
// Requerido si se proporciona otro argumento
optionalArg.requiredIf(otherArg);

// Requerido si otro argumento está ausente
optionalArg.requiredIfAbsent(otherArg);

// Disponible solo si se proporciona otro argumento
optionalArg.availableOnlyIfAll(otherArg);

// Disponible solo si otro argumento está ausente
optionalArg.availableOnlyIfAllAbsent(otherArg);
```

---

## Sistema de Permisos

### Establecimiento de Permisos

```java
public class MyCommand extends CommandBase {
    public MyCommand() {
        super("mycommand", "description");

        // Permiso explícito
        requirePermission("hytale.custom.mycommand");

        // Alternativamente, usa el ayudante para el formato estándar
        requirePermission(HytalePermissions.fromCommand("mycommand"));
    }
}
```

### Generación de Permisos

Si no se establece explícitamente un permiso, los permisos se generan automáticamente:
- Comandos del sistema: `hytale.system.command.<name>`
- Comandos de plugin: `<plugin.basepermission>.command.<name>`
- Subcomandos: `<parent.permission>.<name>`

### Grupos de Permisos

```java
// Asignar a un grupo de permisos de modo de juego
setPermissionGroup(GameMode.Adventure);
setPermissionGroup(GameMode.Creative);

// Asignar a múltiples grupos
setPermissionGroups("Adventure", "Creative");
```

### Permisos a Nivel de Argumento

```java
private final OptionalArg<PlayerRef> playerArg =
    withOptionalArg("player", "desc", ArgTypes.PLAYER_REF)
        .setPermission("mycommand.target.other");
```

### Comprobación de Permisos

```java
// Durante la ejecución del comando
if (context.sender().hasPermission("some.permission")) {
    // Permiso concedido
}

// Método de utilidad (lanza NoPermissionException si se deniega el permiso)
CommandUtil.requirePermission(context.sender(), "some.permission");
```

---

## API de CommandContext

El objeto `CommandContext` proporciona acceso al contexto de ejecución del comando y a la información del emisor.

### Métodos Disponibles

| Método | Tipo de Retorno | Descripción |
|--------|-------------|-------------|
| `sender()` | `CommandSender` | Devuelve el emisor del comando |
| `isPlayer()` | `boolean` | Devuelve true si el emisor es un jugador |
| `senderAs(Class<T>)` | `T` | Convierte el emisor al tipo especificado |
| `senderAsPlayerRef()` | `Ref<EntityStore>` | Devuelve la referencia de entidad del jugador |
| `sendMessage(Message)` | `void` | Envía un mensaje al emisor |
| `getInputString()` | `String` | Devuelve la cadena de entrada del comando en bruto |
| `hasPermission(String)` | `boolean` | Comprueba si el emisor tiene un permiso |

### Obtención de la Entrada del Comando en Bruto

El método `getInputString()` devuelve la cadena de entrada completa y en bruto que el usuario escribió:

```java
@Override
protected void executeSync(CommandContext context) {
    // Obtener la entrada en bruto: "/mycommand arg1 arg2 arg3"
    String rawInput = context.getInputString();

    // Dividir en argumentos
    String[] args = rawInput.split("\\s+");
    // args[0] = "mycommand" (o "/mycommand")
    // args[1] = "arg1"
    // args[2] = "arg2"
    // ...
}
```

### Envío de Mensajes

```java
// Enviar un mensaje de texto sin formato
context.sendMessage(Message.raw("¡Hola, mundo!"));

// Enviar un mensaje traducido
context.sendMessage(Message.translation("server.commands.welcome"));

// Enviar un mensaje formateado con parámetros
context.sendMessage(Message.translation("server.commands.greeting")
    .param("name", playerName));
```

---

## Interfaz CommandSender

```java
public interface CommandSender extends IMessageReceiver, PermissionHolder {
    String getDisplayName();
    UUID getUuid();
}
```

### ConsoleSender vs PlayerSender

| Característica | ConsoleSender | Jugador (PlayerSender) |
|---------|---------------|----------------------|
| `getDisplayName()` | "Console" | Nombre de usuario del jugador |
| `getUuid()` | Nulo o UUID fijo | UUID del jugador |
| `hasPermission()` | Normalmente siempre devuelve true | Se comprueba con el sistema de permisos |
| `sendMessage()` | Registra en la consola | Envía al chat del jugador |
| Contexto del mundo | Ninguno | Mundo actual del jugador |

### Detección del Tipo de Emisor

```java
@Override
protected void executeSync(CommandContext context) {
    if (context.isPlayer()) {
        // El emisor es un jugador
        Player player = context.senderAs(Player.class);
        Ref<EntityStore> ref = context.senderAsPlayerRef();
    } else {
        // El emisor es la consola u otro tipo
        CommandSender sender = context.sender();
    }
}
```

---

## Subcomandos y Variantes

### Adición de Subcomandos

```java
public class ParentCommand extends AbstractCommandCollection {
    public ParentCommand() {
        super("parent", "description");
        addSubCommand(new ChildCommand1());
        addSubCommand(new ChildCommand2());
    }
}

// Uso: /parent child1 ...
// Uso: /parent child2 ...
```

### Variantes de Uso

Las variantes permiten diferentes patrones de argumentos para el mismo comando:

```java
public class GameModeCommand extends AbstractPlayerCommand {
    private final RequiredArg<GameMode> gameModeArg =
        withRequiredArg("gamemode", "desc", ArgTypes.GAME_MODE);

    public GameModeCommand() {
        super("gamemode", "description");
        addUsageVariant(new GameModeOtherCommand()); // Variante de dos argumentos
    }

    // Un argumento requerido: /gamemode <mode>
    @Override
    protected void execute(...) { }

    private static class GameModeOtherCommand extends CommandBase {
        private final RequiredArg<GameMode> gameModeArg = ...;
        private final RequiredArg<PlayerRef> playerArg = ...;

        // Dos argumentos requeridos: /gamemode <mode> <player>
        @Override
        protected void executeSync(...) { }
    }
}
```

---

## Sintaxis de Entrada de Comandos

### Sintaxis Básica

```
/command <required> [--optional=value] [--flag]
```

### Características del Tokenizer

| Sintaxis | Descripción |
|--------|-------------|
| `word` | Un solo token |
| `"quoted string"` | Cadena que contiene espacios |
| `'single quotes'` | Estilo de comillas alternativo |
| `[a,b,c]` | Argumento de lista |
| `\,` `\"` `\'` | Caracteres de escape |
| `--arg=value` | Argumento opcional |
| `--flag` | Bandera booleana |

### Argumentos Especiales

```
--help     # Mostrar ayuda del comando
--confirm  # Confirmar operaciones peligrosas
```

---

## Referencia de Comandos Incorporados

### Comandos del Servidor

| Comando | Descripción | Alias | Argumentos |
|---------|-------------|---------|-----------|
| `stop` | Apagar el servidor | `shutdown` | `--crash` (bandera) |
| `kick` | Expulsar a un jugador del servidor | - | `<player>` |
| `who` | Listar todos los jugadores en línea | - | - |
| `maxplayers` | Obtener o establecer el número máximo de jugadores | - | `--amount` |
| `auth` | Comandos de autenticación | - | Subcomandos |

#### Subcomandos de Auth
- `auth status` - Comprobar estado de autenticación
- `auth login` - Comandos de inicio de sesión
- `auth select` - Seleccionar una cuenta
- `auth logout` - Cerrar sesión
- `auth cancel` - Cancelar el proceso de inicio de sesión
- `auth persistence` - Ajustes de persistencia

---

### Comandos de Jugador

| Comando | Descripción | Alias | Argumentos |
|---------|-------------|---------|-----------|
| `gamemode` | Cambiar el modo de juego | `gm` | `<gamemode>` `[player]` |
| `kill` | Matar a un jugador | - | `[player]` |
| `damage` | Infligir daño a un jugador | - | `<amount>` `[player]` |
| `give` | Dar objetos a un jugador | - | `<item>` `--quantity` `--metadata` |
| `inventory` | Gestión de inventario | - | Subcomandos |
| `sudo` | Ejecutar un comando como otro jugador | `su` | `<player>` `<command...>` |
| `whereami` | Mostrar información de ubicación | - | `[player]` |
| `whoami` | Mostrar información del jugador | - | - |
| `hide` | Alternar visibilidad del jugador | - | - |
| `refer` | Comando de referencia | - | - |
| `player` | Gestión de jugadores | - | Subcomandos |

#### Subcomandos de Player
- `player reset` - Reiniciar un jugador
- `player stats` - Gestión de estadísticas (get/set/add/reset/dump/settomax)
- `player effect` - Gestión de efectos (apply/clear)
- `player respawn` - Reaparecer a un jugador
- `player camera` - Controles de cámara (reset/topdown/sidescroller/demo)
- `player viewradius` - Radio de visión (get/set)
- `player zone` - Información de zona

#### Subcomandos de Inventory
- `inventory clear` - Limpiar inventario
- `inventory see` - Ver inventario
- `inventory item` - Gestión de objetos
- `inventory backpack` - Gestión de mochila
- `give armor` - Dar un conjunto de armadura

#### Comando ItemState
- `itemstate` - Gestión de estado de objeto

---

### Comandos de Mundo

| Comando | Descripción | Alias | Argumentos |
|---------|-------------|---------|-----------|
| `spawnblock` | Generar una entidad de bloque | - | `<block>` `<position>` `--rotation` |
| `chunk` | Gestión de chunks | `chunks` | Subcomandos |
| `entity` | Gestión de entidades | `entities` | Subcomandos |
| `worldgen` | Generación de mundo | `wg` | Subcomandos |

#### Subcomandos de Chunk
| Subcomando | Descripción |
|------------|-------------|
| `chunk fixheightmap` | Arreglar mapa de alturas del chunk |
| `chunk forcetick` | Forzar un tick de chunk |
| `chunk info` | Mostrar información del chunk |
| `chunk lighting` | Gestión de iluminación |
| `chunk load` | Cargar un chunk |
| `chunk loaded` | Listar todos los chunks cargados |
| `chunk marksave` | Marcar un chunk para guardar |
| `chunk maxsendrate` | Establecer tasa máxima de envío |
| `chunk regenerate` | Regenerar un chunk |
| `chunk resend` | Reenviar un chunk a los clientes |
| `chunk tint` | Ajustes de tinte del chunk |
| `chunk tracker` | Información del seguidor de chunks |
| `chunk unload` | Descargar un chunk |

#### Subcomandos de Entity
| Subcomando | Descripción |
|------------|-------------|
| `entity clone` | Clonar una entidad |
| `entity remove` | Eliminar una entidad |
| `entity dump` | Volcar datos de la entidad |
| `entity clean` | Limpiar entidades |
| `entity lod` | Ajustes de nivel de detalle |
| `entity tracker` | Información del seguidor |
| `entity resend` | Reenviar una entidad |
| `entity nameplate` | Gestión de placas de nombre |
| `entity stats` | Estadísticas de la entidad (get/set/add/reset/dump/settomax) |
| `entity snapshot` | Gestión de instantáneas (length/history) |
| `entity effect` | Efectos de la entidad |
| `entity makeinteractable` | Hacer una entidad interactuable |
| `entity intangible` | Alternar intangibilidad |
| `entity invulnerable` | Alternar invulnerabilidad |
| `entity hidefromadventureplayers` | Ocultar de jugadores en modo aventura |
| `entity count` | Contar entidades |

#### Subcomandos de WorldGen
- `worldgen benchmark` - Ejecutar benchmark de generación
- `worldgen reload` - Recargar configuración de generación de mundo

---

### Comandos de Depuración

| Comando | Descripción | Alias | Argumentos |
|---------|-------------|---------|-----------|
| `ping` | Comprobar ping del jugador | - | `--player` `--detail` |
| `version` | Mostrar versión del servidor | - | - |
| `log` | Gestionar registros | - | `<logger>` `--level` `--save` `--reset` |
| `pidcheck` | Comprobar ID del proceso | - | - |
| `packetstats` | Mostrar estadísticas de paquetes | - | - |
| `hitdetection` | Depuración de detección de golpes | - | - |
| `assets` | Comandos de recursos | - | Subcomandos |
| `packs` | Gestión de paquetes | - | Subcomandos |
| `server` | Gestión del servidor | - | Subcomandos |
| `stresstest` | Pruebas de estrés | - | Subcomandos |
| `hitboxcollision` | Depuración de colisión de hitbox | - | Subcomandados |
| `repulsion` | Depuración de repulsión | - | Subcomandos |
| `debugplayerposition` | Depurar posición del jugador | - | - |
| `messagetranslationtest` | Probar traducciones de mensajes | - | - |
| `hudmanagertest` | Pruebas del gestor de HUD | - | - |
| `stopnetworkchunksending` | Detener envío de chunks por red | - | - |
| `showbuildertoolshud` | Mostrar HUD de herramientas de constructor | - | - |
| `particle` | Efectos de partículas | - | - |
| `tagpattern` | Depuración de patrón de etiquetas | - | - |

#### Subcomandos de Server
- `server stats` - Estadísticas del servidor (memoria/cpu/gc)
- `server gc` - Forzar recolección de basura
- `server dump` - Volcar estado del servidor

#### Subcomandos de StressTest
- `stresstest start` - Iniciar una prueba de estrés
- `stresstest stop` - Detener la prueba de estrés

#### Subcomandos de Ping
- `ping clear` / `ping reset` - Limpiar historial de ping
- `ping graph` - Mostrar gráfico de ping (`--width` `--height`)

---

### Comandos de Utilidad

| Comando | Descripción | Alias | Argumentos |
|---------|-------------|---------|-----------|
| `help` | Mostrar información de ayuda | `?` | `[command]` |
| `backup` | Crear una copia de seguridad | - | - |
| `notify` | Enviar una notificación | - | - |
| `eventtitle` | Mostrar título del evento | - | - |
| `stash` | Gestión de alijos | - | - |
| `convertprefabs` | Convertir prefabricados | - | - |
| `validatecpb` | Validar archivos CPB | - | - |
| `worldmap` | Comandos de mapa del mundo | - | Subcomandos |
| `sound` | Comandos de sonido | - | Subcomandos |
| `lighting` | Comandos de iluminación | - | Subcomandos |
| `sleep` | Comandos de sueño | - | Subcomandos |
| `network` | Comandos de red | - | - |
| `commands` | Listar todos los comandos | - | - |
| `update` | Comandos de actualización | - | Subcomandos |

#### Subcomandos de WorldMap
- `worldmap discover` - Descubrir un área
- `worldmap undiscover` - Eliminar descubrimiento de un área
- `worldmap clearmarkers` - Limpiar todos los marcadores
- `worldmap reload` - Recargar el mapa
- `worldmap viewradius` - Radio de visión (get/set/remove)

#### Subcomandos de Sound
- `sound play2d` - Reproducir un sonido 2D
- `sound play3d` - Reproducir un sonido 3D

#### Subcomandos de Lighting
- `lighting get` - Obtener información de iluminación
- `lighting send` - Enviar datos de iluminación
- `lighting sendtoggle` - Alternar envío de iluminación
- `lighting info` - Mostrar información de iluminación
- `lighting calculation` - Calcular iluminación
- `lighting invalidate` - Invalidar caché de iluminación

#### Subcomandos de Sleep
- `sleep offset` - Establecer desfase de sueño
- `sleep test` - Probar funcionalidad de sueño

#### Subcomandos de Update
- `update assets` - Actualizar recursos
- `update prefabs` - Actualizar prefabricados

---

## Manejo de Excepciones

### Excepciones de Comando

```java
public abstract class CommandException extends RuntimeException {
    public abstract void sendTranslatedMessage(CommandSender sender);
}

// Excepciones específicas
public class NoPermissionException extends CommandException
public class SenderTypeException extends CommandException
public class GeneralCommandException extends CommandException
```

### Lanzamiento de Excepciones

```java
// Comprobación de permiso que lanza una excepción si se deniega
CommandUtil.requirePermission(sender, "permission.node");

// Excepción personalizada
throw new GeneralCommandException(Message.translation("error.key"));
```

---

## Confirmación para Comandos Peligrosos

```java
public class DangerousCommand extends CommandBase {
    public DangerousCommand() {
        // El tercer parámetro habilita el requisito --confirm
        super("dangerous", "description", true);
    }
}

// Uso: /dangerous --confirm
```

---

## Registro de Comandos

### Comandos del Sistema

```java
// Durante la inicialización de CommandManager
CommandManager.get().registerSystemCommand(new MyCommand());
```

### Comandos de Plugin

```java
// Usando CommandRegistry dentro de un plugin
public class MyPlugin extends PluginBase {
    @Override
    protected void onEnable() {
        getCommandRegistry().registerCommand(new MyPluginCommand());
    }
}
```

---

## Mejores Prácticas

1. **Usa la clase base apropiada** - Elige `CommandBase` para operaciones síncronas, `AbstractAsyncCommand` para operaciones asíncronas, y `AbstractPlayerCommand` para comandos solo de jugador.

2. **Define permisos** - Siempre especifica permisos para tus comandos.

3. **Usa claves de traducción** - Usa `Message.translation()` para todas las cadenas de texto orientadas al usuario para soportar la localización.

4. **Valida los argumentos** - Añade validadores para rangos numéricos y otras restricciones.

5. **Maneja los errores con elegancia** - Usa `ParseResult.fail()` para errores orientados al usuario.

6. **Documenta con descripciones** - Proporciona claves de traducción para comandos y argumentos.

7. **Agrupa comandos relacionados** - Usa `AbstractCommandCollection` para organizar comandos relacionados.

8. **Considera el tipo de emisor** - Comprueba `context.isPlayer()` cuando el tipo de emisor sea importante para la lógica de tu comando.

---

## Archivos Fuente

Archivos fuente clave en `com.hypixel.hytale.server.core.command`:

```
system/
├── CommandManager.java
├── AbstractCommand.java
├── CommandContext.java
├── CommandSender.java
├── CommandRegistry.java
├── CommandRegistration.java
├── ParseResult.java
├── Tokenizer.java
├── CommandUtil.java
├── ParserContext.java
├── AbbreviationMap.java
├── MatchResult.java
├── arguments/
│   ├── system/
│   │   ├── Argument.java
│   │   ├── RequiredArg.java
│   │   ├── OptionalArg.java
│   │   ├── DefaultArg.java
│   │   ├── FlagArg.java
│   │   └── AbstractOptionalArg.java
│   └── types/
│       ├── ArgumentType.java
│       ├── SingleArgumentType.java
│       ├── ArgTypes.java
│       └── ...
├── basecommands/
│   ├── CommandBase.java
│   ├── AbstractAsyncCommand.java
│   ├── AbstractPlayerCommand.java
│   ├── AbstractWorldCommand.java
│   ├── AbstractTargetPlayerCommand.java
│   ├── AbstractTargetEntityCommand.java
│   └── AbstractCommandCollection.java
├── exceptions/
│   ├── CommandException.java
│   ├── NoPermissionException.java
│   ├── SenderTypeException.java
│   └── GeneralCommandException.java
└── suggestion/
    ├── SuggestionProvider.java
    └── SuggestionResult.java

commands/
├── server/
│   ├── KickCommand.java
│   ├── StopCommand.java
│   ├── WhoCommand.java
│   ├── MaxPlayersCommand.java
│   └── auth/
├── player/
│   ├── GameModeCommand.java
│   ├── KillCommand.java
│   ├── DamageCommand.java
│   ├── GiveCommand.java
│   ├── SudoCommand.java
│   ├── WhereAmICommand.java
│   ├── inventory/
│   ├── stats/
│   ├── effect/
│   ├── camera/
│   └── viewradius/
├── world/
│   ├── SpawnBlockCommand.java
│   ├── chunk/
│   ├── entity/
│   └── worldgen/
├── debug/
│   ├── PingCommand.java
│   ├── VersionCommand.java
│   ├── LogCommand.java
│   ├── server/
│   ├── stresstest/
│   ├── packs/
│   └── component/
└── utility/
    ├── HelpCommand.java
    ├── BackupCommand.java
    ├── sound/
    ├── lighting/
    ├── sleep/
    ├── worldmap/
    └── git/
```