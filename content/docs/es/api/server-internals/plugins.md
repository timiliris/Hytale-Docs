---
id: plugins
title: Sistema de Plugins
sidebar_label: Plugins
sidebar_position: 2
description: Documentación completa del sistema de plugins de Java para el servidor Hytale
---

# Sistema de Plugins

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada con el código fuente descompilado del servidor utilizando análisis multiagente. Toda la información incluye referencias a los archivos fuente.
:::

## ¿Qué es un Plugin?

Un **plugin** es una pieza de código independiente que añade nuevas características al servidor Hytale noticias sin modificar su código fuente principal. Piensa en los plugins como aplicaciones en tu teléfono inteligente: extienden la funcionalidad mientras el sistema operativo permanece sin cambios.

### ¿Por Qué Usar Plugins?

| Enfoque                           | Pros                                          | Contras                                           |
| --------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| **Modificar código del servidor** | Control total                                 | Se rompe en actualizaciones, difícil de compartir |
| **Usar plugins**                  | Actualizaciones fáciles, compartible, aislado | Limitado a lo que las APIs exponen                |

Los plugins son la forma recomendada de añadir funcionalidad personalizada porque:

- Sobreviven a las actualizaciones del servidor
- Múltiples plugins pueden trabajar juntos
- Pueden ser habilitados/deshabilitados sin reiniciar
- La comunidad puede compartirlos y reutilizarlos

### Ciclo de Vida del Plugin: Nacimiento a Muerte

Cada plugin pasa por un ciclo de vida, como un organismo vivo:

```
NONE → SETUP → START → ENABLED → SHUTDOWN → DISABLED
  |       |       |        |          |          |
Nacer  Despertar Correr   Totalmente  Yendo a    Dormido
       arriba    sistemas activo      dormir
```

| Estado       | Qué sucede                                                           | Qué deberías hacer                                |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------------- |
| **SETUP**    | El plugin está despertando, las dependencias están listas            | Registrar comandos, eventos, inicializar recursos |
| **START**    | Todos los plugins están configurados                                 | Cargar configuraciones, conectar a bases de datos |
| **ENABLED**  | El plugin está totalmente en ejecución                               | Operación normal                                  |
| **SHUTDOWN** | El servidor se está deteniendo o el plugin está siendo deshabilitado | Guardar datos, cerrar conexiones, limpieza        |
| **DISABLED** | El plugin está dormido                                               | Nada - has terminado                              |

### Analogía del Mundo Real: Cocina de Restaurante

Piensa en el servidor Hytale como una cocina de restaurante:

- **Servidor** = La cocina con todo su equipo
- **Plugin** = Un chef especializado que contratas
- **Manifiesto** = El currículum del chef (nombre, habilidades, requisitos)
- **Ciclo de Vida** = Turno de trabajo del chef (llegar, preparar, cocinar, limpiar, irse)
- **Registros** = El tablero de menú donde los chefs publican sus platos

Al igual que un chef:

- Debe seguir las reglas de la cocina (usar los registros proporcionados)
- No puede modificar la estructura de la cocina (código del servidor)
- Debe limpiar al irse (cierre adecuado)
- Trabaja junto a otros chefs (otros plugins)

### El Manifiesto: La Tarjeta de Identificación de tu Plugin

Cada plugin necesita un archivo `manifest.json` que le dice al servidor:

```json
{
  "Group": "MyStudio", // Quién lo hizo (tu organización)
  "Name": "CoolFeature", // Cómo se llama
  "Version": "1.0.0", // Qué versión
  "Main": "com.mystudio.Cool", // Dónde encontrar la clase principal
  "Dependencies": {
    // Qué necesita para funcionar
    "Hytale:CorePlugin": ">=1.0.0"
  }
}
```

Esto es como una etiqueta de paquete: el servidor sabe qué hay dentro sin abrirlo.

### ¿Por Qué Usar Registros en Lugar de Acceso Directo?

Podrías preguntarte por qué los plugins usan `getCommandRegistry()` en lugar de acceder directamente a `CommandManager`. He aquí por qué:

```java
// MAL: Acceso directo
CommandManager.get().register(new MyCommand());
// Problema: Cuando tu plugin se deshabilita, ¡el comando permanece registrado!

// BIEN: Usando registro
getCommandRegistry().registerCommand(new MyCommand());
// Cuando tu plugin se deshabilita, todos tus comandos se desregistran automáticamente
```

Los registros rastrean todo lo que tu plugin crea y lo limpian automáticamente. Es como un checkout de hotel: no necesitas recordar cada toalla que usaste; el personal conoce tu habitación y limpia todo.

---

## Documentación Técnica

Esta documentación cubre el Sistema de Plugins del Servidor Hytale, que permite a los desarrolladores extender la funcionalidad del servidor a través de plugins Java.

## Tabla de Contenidos

1. [Visión General](#overview)
2. [Creando un Plugin](#creating-a-plugin)
3. [Manifiesto del Plugin](#plugin-manifest)
4. [Ciclo de Vida del Plugin](#plugin-lifecycle)
5. [PluginManager](#pluginmanager)
6. [Accediendo a Servicios del Servidor](#accessing-server-services)
7. [Plugins Tempranos y Transformadores de Clase](#early-plugins-and-class-transformers)
8. [Comandos de Plugin](#plugin-commands)

---

## Visión General

El sistema de plugins de Hytale está construido en Java y permite a los desarrolladores crear modificaciones del lado del servidor. Los plugins se cargan desde archivos JAR colocados en el directorio `mods/` o desde el classpath del servidor.

### Componentes Clave

| Componente          | Descripción                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `JavaPlugin`        | Clase base para todos los plugins Java                             |
| `PluginBase`        | Clase base abstracta que proporciona funcionalidad común de plugin |
| `PluginManager`     | Gestiona el ciclo de vida y la carga de plugins                    |
| `PluginManifest`    | Archivo de configuración JSON que describe el plugin               |
| `PluginClassLoader` | Cargador de clases personalizado para aislamiento de plugins       |

### Formato de Identificador del Plugin

Los plugins se identifican mediante una combinación de `Group` y `Name` (Grupo y Nombre):

```
Grupo:Nombre
```

Ejemplo: `MiEmpresa:MiPlugin`

---

## Creando un Plugin

### Estructura Básica del Plugin

Para crear un plugin, extiende la clase `JavaPlugin`:

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import javax.annotation.Nonnull;

public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Llamado durante la fase de configuración del plugin
        getLogger().info("¡MyPlugin se está configurando!");
    }

    @Override
    protected void start() {
        // Llamado cuando el plugin comienza
        getLogger().info("¡MyPlugin ha comenzado!");
    }

    @Override
    protected void shutdown() {
        // Llamado cuando el plugin está siendo deshabilitado
        getLogger().info("¡MyPlugin se está apagando!");
    }
}
```

### Estructura del Proyecto

```
my-plugin/
  src/
    main/
      java/
        com/example/myplugin/
          MyPlugin.java
      resources/
        manifest.json
  build.gradle
```

### Requisitos del Constructor

Tu clase de plugin **debe** tener un constructor que acepte un parámetro `JavaPluginInit`:

```java
public MyPlugin(@Nonnull JavaPluginInit init) {
    super(init);
}
```

El objeto `JavaPluginInit` proporciona acceso a lo siguiente:

- `getPluginManifest()` - Devuelve la configuración del manifiesto del plugin
- `getDataDirectory()` - Devuelve la ruta a la carpeta de datos del plugin
- `getFile()` - Devuelve la ruta al archivo JAR del plugin
- `getClassLoader()` - Devuelve el cargador de clases del plugin

---

## Manifiesto del Plugin

Cada plugin requiere un archivo `manifest.json` ubicado en la raíz del JAR.

### Ejemplo Completo de Manifiesto

```json
{
  "Group": "MyCompany",
  "Name": "MyPlugin",
  "Version": "1.0.0",
  "Description": "An example plugin for Hytale",
  "Authors": [
    {
      "Name": "Developer Name",
      "Email": "dev@example.com",
      "Url": "https://example.com"
    }
  ],
  "Website": "https://myplugin.example.com",
  "Main": "com.example.myplugin.MyPlugin",
  "ServerVersion": ">=0.1.0",
  "Dependencies": {
    "Hytale:CorePlugin": ">=1.0.0"
  },
  "OptionalDependencies": {
    "OtherCompany:OptionalPlugin": ">=2.0.0"
  },
  "LoadBefore": {
    "Hytale:SomePlugin": "*"
  },
  "DisabledByDefault": false,
  "IncludesAssetPack": true
}
```

### Campos del Manifiesto

| Campo                  | Tipo        | Requerido | Descripción                                                        |
| ---------------------- | ----------- | --------- | ------------------------------------------------------------------ |
| `Group`                | String      | Sí        | Identificador de organización o grupo                              |
| `Name`                 | String      | Sí        | Nombre único del plugin                                            |
| `Version`              | Semver      | Sí        | Versión del plugin usando versionado semántico                     |
| `Description`          | String      | No        | Breve descripción del plugin                                       |
| `Authors`              | Array       | No        | Lista de objetos de información del autor                          |
| `Website`              | String      | No        | URL del sitio web del plugin                                       |
| `Main`                 | String      | Sí        | Nombre de clase principal completamente calificado                 |
| `ServerVersion`        | SemverRange | No        | Rango de versión del servidor requerido                            |
| `Dependencies`         | Object      | No        | Dependencias de plugins requeridas                                 |
| `OptionalDependencies` | Object      | No        | Dependencias de plugins opcionales                                 |
| `LoadBefore`           | Object      | No        | Plugins que este plugin debería cargar antes                       |
| `DisabledByDefault`    | Boolean     | No        | Cuando es true, el plugin debe ser habilitado explícitamente       |
| `IncludesAssetPack`    | Boolean     | No        | Cuando es true, indica que el plugin contiene un paquete de assets |
| `SubPlugins`           | Array       | No        | Manifiestos de sub-plugins anidados                                |

### Estructura de Información del Autor

```json
{
  "Name": "Author Name",
  "Email": "author@example.com",
  "Url": "https://author-website.com"
}
```

### Rangos de Versiones

Las dependencias usan rangos de versionado semántico:

| Patrón           | Descripción                                 |
| ---------------- | ------------------------------------------- |
| `*`              | Cualquier versión                           |
| `1.0.0`          | Coincidencia exacta de versión              |
| `>=1.0.0`        | Versión 1.0.0 o superior                    |
| `>=1.0.0 <2.0.0` | Entre 1.0.0 (inclusive) y 2.0.0 (exclusivo) |

### Sub-Plugins

Un plugin puede definir sub-plugins anidados que heredan propiedades del padre:

```json
{
  "Group": "MyCompany",
  "Name": "MainPlugin",
  "Version": "1.0.0",
  "Main": "com.example.MainPlugin",
  "SubPlugins": [
    {
      "Name": "SubFeature",
      "Main": "com.example.SubFeaturePlugin"
    }
  ]
}
```

Los sub-plugins heredan automáticamente `Group`, `Version`, `Authors`, y otros campos del manifiesto padre.

---

## Ciclo de Vida del Plugin

Los plugins progresan a través de un ciclo de vida bien definido gestionado por el `PluginManager`.

### Estados del Plugin

```java
public enum PluginState {
    NONE,       // Estado inicial; aún no cargado
    SETUP,      // Fase de configuración en progreso
    START,      // Fase de inicio en progreso
    ENABLED,    // Plugin está totalmente habilitado y ejecutándose
    SHUTDOWN,   // Apagado en progreso
    DISABLED    // Plugin está deshabilitado
}
```

### Flujo del Ciclo de Vida

```
NONE -> SETUP -> START -> ENABLED -> SHUTDOWN -> DISABLED
```

### Métodos del Ciclo de Vida

Sobrescribe estos métodos para manejar eventos del ciclo de vida:

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    /**
     * Llamado durante la fase de configuración.
     * Usa este método para registrar comandos, eventos e inicializar recursos.
     * Se garantiza que las dependencias estén en el estado SETUP o posterior.
     */
    @Override
    protected void setup() {
        // Registrar comandos
        getCommandRegistry().registerCommand(new MyCommand());

        // Registrar manejadores de eventos
        getEventRegistry().register(PlayerJoinEvent.class, this::onPlayerJoin);

        // Registrar tareas
        getTaskRegistry().registerTask(myAsyncTask());
    }

    /**
     * Llamado durante la fase de inicio.
     * Se garantiza que las dependencias estén en el estado ENABLED.
     * Los paquetes de assets deberían registrarse aquí.
     */
    @Override
    protected void start() {
        getLogger().info("¡Plugin iniciado exitosamente!");
    }

    /**
     * Llamado cuando el plugin se está apagando.
     * Usa este método para limpiar recursos, guardar datos y realizar otras operaciones de cierre.
     */
    @Override
    protected void shutdown() {
        getLogger().info("Limpiando recursos...");
    }
}
```

### Carga de Configuración

Usa `withConfig()` para definir configuraciones de plugin que se cargan antes de que se llame a `setup()`:

```java
public class MyPlugin extends JavaPlugin {
    private final Config<MyConfig> config;

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
        // Esto debe ser llamado antes de setup
        this.config = withConfig(MyConfig.CODEC);
    }

    @Override
    protected void setup() {
        MyConfig cfg = config.get();
        getLogger().info("Configuración cargada: " + cfg.getSomeSetting());
    }
}
```

### Fase de Pre-Carga

El método `preLoad()` se llama antes de `setup()` para cargar configuraciones asíncronamente:

```java
@Nullable
public CompletableFuture<Void> preLoad() {
    // Maneja automáticamente la carga de configuración
    // Sobrescribe solo si necesitas comportamiento de pre-carga personalizado
}
```

---

## PluginManager

El `PluginManager` es el componente central responsable de gestionar los plugins.

### Obteniendo la Instancia

```java
PluginManager pluginManager = PluginManager.get();
```

### Métodos Clave

#### Listando Plugins

```java
// Recuperar todos los plugins cargados
List<PluginBase> plugins = pluginManager.getPlugins();

// Recuperar un plugin específico
PluginBase plugin = pluginManager.getPlugin(new PluginIdentifier("Group", "Name"));

// Comprobar si un plugin existe con una versión específica
boolean exists = pluginManager.hasPlugin(identifier, SemverRange.fromString(">=1.0.0"));
```

#### Cargando y Descargando

```java
// Cargar un plugin por identificador
boolean success = pluginManager.load(new PluginIdentifier("Group", "Name"));

// Descargar un plugin
boolean success = pluginManager.unload(identifier);

// Recargar un plugin (descargar seguido de cargar)
boolean success = pluginManager.reload(identifier);
```

#### Plugins Disponibles

```java
// Recuperar todos los plugins disponibles, incluyendo los deshabilitados
Map<PluginIdentifier, PluginManifest> available = pluginManager.getAvailablePlugins();
```

### Fuentes de Carga de Plugins

Los plugins se cargan desde múltiples fuentes en el siguiente orden:

1. **Plugins Principales (Core)** - Plugins integrados del servidor
2. **Directorio Builtin** - `<server>/builtin/*.jar`
3. **Classpath** - Plugins en el classpath del servidor
4. **Directorio Mods** - `mods/*.jar` (la ubicación predeterminada)
5. **Directorios Adicionales** - Especificados vía el argumento `--mods-directories`

### Orden de Carga de Plugins

El `PluginManager` calcula el orden de carga óptimo basado en los siguientes criterios:

1. **Dependencias** - Los plugins requeridos se cargan primero
2. **Dependencias Opcionales** - Consideradas al determinar el orden
3. **LoadBefore** - Pistas de ordenamiento explícitas
4. **Prioridad de Classpath** - Los plugins del classpath se cargan antes que los plugins externos

Las dependencias cíclicas se detectan y causarán que la carga falle.

---

## Accediendo a Servicios del Servidor

Los plugins tienen acceso a varios servicios del servidor a través de registros.

### Registros Disponibles

```java
public class MyPlugin extends JavaPlugin {

    @Override
    protected void setup() {
        // Registro de comandos
        CommandRegistry commands = getCommandRegistry();

        // Manejo de eventos
        EventRegistry events = getEventRegistry();

        // Tareas programadas
        TaskRegistry tasks = getTaskRegistry();

        // Registro de estados de bloque
        BlockStateRegistry blockStates = getBlockStateRegistry();

        // Registro de entidades
        EntityRegistry entities = getEntityRegistry();

        // Características del cliente
        ClientFeatureRegistry clientFeatures = getClientFeatureRegistry();

        // Registro de assets
        AssetRegistry assets = getAssetRegistry();

        // Componentes de almacenamiento de entidades
        ComponentRegistryProxy<EntityStore> entityStore = getEntityStoreRegistry();

        // Componentes de almacenamiento de chunks
        ComponentRegistryProxy<ChunkStore> chunkStore = getChunkStoreRegistry();

        // Registro de códecs
        CodecMapRegistry codecRegistry = getCodecRegistry(someCodecMap);
    }
}
```

### Registrando Comandos

```java
@Override
protected void setup() {
    getCommandRegistry().registerCommand(new MyCommand());
}

public class MyCommand extends CommandBase {
    public MyCommand() {
        super("mycommand", "description.key");
        addAliases("mc", "mycmd");
    }

    @Override
    protected void executeSync(@Nonnull CommandContext context) {
        context.sendMessage(Message.raw("Hello from MyPlugin!"));
    }
}
```

### Registrando Eventos

```java
@Override
protected void setup() {
    EventRegistry events = getEventRegistry();

    // Manejador de eventos simple
    events.register(PlayerJoinEvent.class, this::onPlayerJoin);

    // Manejador de eventos con prioridad
    events.register(EventPriority.HIGH, PlayerJoinEvent.class, this::onPlayerJoin);

    // Manejador global que recibe todas las claves
    events.registerGlobal(SomeKeyedEvent.class, this::onKeyedEvent);

    // Manejador de eventos asíncrono
    events.registerAsync(AsyncEvent.class, future ->
        future.thenApply(event -> {
            // Manejar asíncronamente
            return event;
        })
    );
}

private void onPlayerJoin(PlayerJoinEvent event) {
    getLogger().info("Player joined: " + event.getPlayer().getName());
}
```

### Registrando Tareas

```java
@Override
protected void setup() {
    TaskRegistry tasks = getTaskRegistry();

    // Registrar una tarea CompletableFuture
    CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
        // Realizar trabajo asíncrono
    });
    tasks.registerTask(future);

    // Registrar una tarea programada
    ScheduledFuture<Void> scheduled = scheduler.schedule(() -> {
        // Realizar trabajo programado
        return null;
    }, 5, TimeUnit.SECONDS);
    tasks.registerTask(scheduled);
}
```

### Accediendo al Servidor

```java
// Obtener la instancia del servidor
HytaleServer server = HytaleServer.get();

// Obtener el bus de eventos directamente
IEventBus eventBus = server.getEventBus();

// Obtener la configuración del servidor
HytaleServerConfig config = server.getConfig();
```

### Registro (Logging)

Cada plugin tiene su propio registrador (logger):

```java
HytaleLogger logger = getLogger();
logger.info("Information message");
logger.warning("Warning message");
logger.severe("Error message");
logger.at(Level.FINE).log("Debug message with %s", "formatting");
logger.at(Level.SEVERE).withCause(exception).log("Error occurred");
```

### Directorio de Datos del Plugin

```java
// Obtener el directorio de datos del plugin
Path dataDir = getDataDirectory();

// Típicamente ubicado en: mods/Group_Name/
```

### Permisos del Plugin

Los plugins tienen una cadena de permiso base:

```java
String basePermission = getBasePermission();
// Format: "group.name" (lowercase)
```

---

## Early Plugins and Class Transformers

Early plugins are a special type that load **before** the main server starts, enabling bytecode transformation.

### Warning

Early plugins are **unsupported** and may cause stability issues. They require explicit user confirmation before they can run.

## Plugins Tempranos y Transformadores de Clase

Los plugins tempranos son un tipo especial que cargan **antes** de que el servidor principal comience, habilitando la transformación de bytecode.

### Advertencia

Los plugins tempranos **no están soportados** y pueden causar problemas de estabilidad. Requieren confirmación explícita del usuario antes de que puedan ejecutarse.

### Ubicación de Plugins Tempranos

Coloca los archivos JAR de los plugins tempranos en el directorio `earlyplugins/` o especifica rutas usando argumentos de línea de comandos:

```bash
java -jar server.jar --early-plugins=/path/to/plugins
java -jar server.jar --accept-early-plugins  # Skip the confirmation prompt
```

### Creando un Transformador de Clase

Implementa la interfaz `ClassTransformer`:

```java
package com.example.earlyplugin;

import com.hypixel.hytale.plugin.early.ClassTransformer;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class MyTransformer implements ClassTransformer {

    /**
     * Los transformadores de mayor prioridad se ejecutan primero.
     */
    @Override
    public int priority() {
        return 100; // Por defecto es 0
    }

    /**
     * Transforma el bytecode de una clase.
     *
     * @param className    El nombre de clase completamente calificado (e.g., "com.example.MyClass")
     * @param internalName El nombre interno de clase (e.g., "com/example/MyClass")
     * @param classBytes   El bytecode original
     * @return El bytecode transformado, o null para conservar el original
     */
    @Nullable
    @Override
    public byte[] transform(@Nonnull String className,
                           @Nonnull String internalName,
                           @Nonnull byte[] classBytes) {
        if (!className.equals("com.hypixel.hytale.SomeClass")) {
            return null; // No transformar esta clase
        }

        // Usa ASM o una biblioteca similar para modificar el bytecode
        // Devuelve los bytes modificados
        return modifiedBytes;
    }
}
```

### Registro de Servicio

Registra tu transformador usando el mecanismo ServiceLoader de Java. Crea el siguiente archivo:

```
META-INF/services/com.hypixel.hytale.plugin.early.ClassTransformer
```

Con el siguiente contenido:

```
com.example.earlyplugin.MyTransformer
```

### Clases Protegidas

Los siguientes prefijos de paquete no pueden ser transformados:

- `java.`, `javax.`, `jdk.`, `sun.`, `com.sun.`
- `org.bouncycastle.`
- `server.io.netty.`
- `org.objectweb.asm.`
- `com.google.gson.`
- `org.slf4j.`, `org.apache.logging.`, `ch.qos.logback.`
- `com.google.flogger.`
- `server.io.sentry.`
- `com.hypixel.protoplus.`
- `com.hypixel.fastutil.`
- `com.hypixel.hytale.plugin.early.`

---

## Comandos de Plugin

El servidor proporciona comandos integrados para la gestión de plugins.

### `/plugin list` (o `/pl ls`)

Lista todos los plugins cargados.

### `/plugin load <Grupo:Nombre>` (o `/pl l`)

Carga un plugin. Opciones disponibles:

- `--boot` - Añade el plugin a la lista de arranque sin cargarlo inmediatamente

### `/plugin unload <Grupo:Nombre>` (o `/pl u`)

Descarga un plugin. Opciones disponibles:

- `--boot` - Elimina el plugin de la lista de arranque sin descargarlo

### `/plugin reload <Grupo:Nombre>` (o `/pl r`)

Recarga un plugin descargándolo y luego cargándolo de nuevo.

### `/plugin manage` (o `/pl m`)

Abre la interfaz de usuario de gestión de plugins (disponible solo para jugadores).

---

## Mejores Prácticas

### 1. Maneja el Ciclo de Vida Adecuadamente

```java
@Override
protected void setup() {
    // Inicializar recursos
    // Registrar comandos, eventos, etc.
}

@Override
protected void shutdown() {
    // Limpiar recursos
    // Guardar datos
    // Cancelar tareas
}
```

### 2. Usa Registros de Plugin

Siempre usa los registros proporcionados en lugar del registro global. Esto asegura una limpieza adecuada cuando el plugin se descarga.

```java
// Correct: uses the plugin registry
getCommandRegistry().registerCommand(new MyCommand());

// Incorrect: bypasses cleanup
CommandManager.get().register(new MyCommand());
```

### 3. Verificar Estado del Plugin

```java
if (isEnabled()) {
    // Seguro para realizar operaciones
}

if (isDisabled()) {
    // El plugin no está activo
}
```

### 4. Manejar Dependencias

```java
@Override
protected void setup() {
    PluginBase dependency = PluginManager.get()
        .getPlugin(new PluginIdentifier("Group", "RequiredPlugin"));

    if (dependency != null && dependency.isEnabled()) {
        // Usar características de la dependencia
    }
}
```

### 5. Sigue las Mejores Prácticas de Registro

```java
// Usa niveles de registro apropiados
getLogger().at(Level.FINE).log("Info de depuración");     // Depuración
getLogger().at(Level.INFO).log("Info normal");    // Operación normal
getLogger().at(Level.WARNING).log("Advertencia");     // Problemas recuperables
getLogger().at(Level.SEVERE).log("Error");        // Errores

// Incluye contexto en mensajes de registro
getLogger().at(Level.SEVERE)
    .withCause(exception)
    .log("Falló al cargar configuración para %s", getIdentifier());
```

---

## Ejemplo: Plugin Completo

```java
package com.example.greeting;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import com.hypixel.hytale.server.core.command.system.basecommands.CommandBase;
import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.Message;
import javax.annotation.Nonnull;

public class GreetingPlugin extends JavaPlugin {

    public GreetingPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getLogger().info("Configurando GreetingPlugin...");

        // Registra el comando
        getCommandRegistry().registerCommand(new GreetCommand());

        // Registra el manejador de eventos
        getEventRegistry().register(PlayerJoinEvent.class, event -> {
            event.getPlayer().sendMessage(
                Message.raw("¡Bienvenido al servidor!")
            );
        });
    }

    @Override
    protected void start() {
        getLogger().info("¡GreetingPlugin iniciado!");
    }

    @Override
    protected void shutdown() {
        getLogger().info("GreetingPlugin apagándose...");
    }

    private class GreetCommand extends CommandBase {
        public GreetCommand() {
            super("greet", "greeting.command.desc");
        }

        @Override
        protected void executeSync(@Nonnull CommandContext context) {
            context.sendMessage(Message.raw("¡Hola desde GreetingPlugin!"));
        }
    }
}
```

**manifest.json:**

```json
{
  "Group": "Example",
  "Name": "GreetingPlugin",
  "Version": "1.0.0",
  "Description": "Un plugin de saludo simple",
  "Main": "com.example.greeting.GreetingPlugin",
  "Authors": [
    {
      "Name": "Example Developer"
    }
  ]
}
```

---

## Documentación Relacionada

- [Sistema de Eventos](/docs/api/events) - Documentación detallada de manejo de eventos
- [Sistema de Comandos](/docs/api/commands) - Guía de creación de comandos
- [Paquetes de Assets](/docs/api/assets) - Incluyendo assets con plugins
- [Configuración](/docs/api/configuration) - Sistema de configuración de plugins
