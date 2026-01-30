---
id: access-control
title: Sistema de Control de Acceso
sidebar_label: Control de Acceso
sidebar_position: 7
description: Documentación completa del sistema de control de acceso de Hytale para baneos, listas blancas y proveedores de acceso personalizados
---

# Sistema de Control de Acceso

El sistema de Control de Acceso en Hytale proporciona una forma integral de gestionar el acceso al servidor a través de baneos, listas blancas y proveedores de acceso personalizados. Este módulo es esencial para que los administradores de servidores controlen quién puede unirse a sus servidores.

## Descripción General

El `AccessControlModule` es un plugin principal que gestiona el acceso de jugadores al servidor. Proporciona:

- **Sistema de Baneo** - Baneos temporales y permanentes de jugadores
- **Sistema de Lista Blanca** - Restringir el acceso al servidor solo a jugadores aprobados
- **Proveedores Personalizados** - Interfaz extensible para lógica de control de acceso personalizada

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.AccessControlModule`

## Arquitectura del Módulo

```java
public class AccessControlModule extends JavaPlugin {
    public static final PluginManifest MANIFEST = PluginManifest.corePlugin(AccessControlModule.class).build();

    private final HytaleWhitelistProvider whitelistProvider = new HytaleWhitelistProvider();
    private final HytaleBanProvider banProvider = new HytaleBanProvider();
    private final List<AccessProvider> providerRegistry = new CopyOnWriteArrayList<>();
    private final Map<String, BanParser> parsers = new ConcurrentHashMap<>();

    public static AccessControlModule get() {
        return instance;
    }
}
```

## Interfaz AccessProvider

Todos los proveedores de control de acceso implementan la interfaz `AccessProvider`:

```java
public interface AccessProvider {
    @Nonnull
    CompletableFuture<Optional<String>> getDisconnectReason(UUID uuid);
}
```

El método devuelve:

- `Optional.empty()` - El jugador puede conectarse
- `Optional.of(message)` - El jugador es rechazado con el mensaje dado

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.provider.AccessProvider`

## Sistema de Baneo

### Interfaz Ban

La interfaz `Ban` define la estructura para todos los tipos de baneo:

```java
public interface Ban extends AccessProvider {
    UUID getTarget();           // UUID del jugador baneado
    UUID getBy();               // UUID del administrador que baneó
    Instant getTimestamp();     // Cuándo se emitió el baneo
    boolean isInEffect();       // Si el baneo está actualmente activo
    Optional<String> getReason(); // Razón del baneo (opcional)
    String getType();           // Identificador del tipo de baneo
    JsonObject toJsonObject();  // Serializar a JSON
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.ban.Ban`

### Tipos de Baneo

#### Baneo Infinito (Permanente)

Los baneos permanentes nunca expiran:

```java
public class InfiniteBan extends AbstractBan {
    public InfiniteBan(UUID target, UUID by, Instant timestamp, String reason) {
        super(target, by, timestamp, reason);
    }

    @Override
    public boolean isInEffect() {
        return true;  // Siempre activo
    }

    @Override
    public String getType() {
        return "infinite";
    }

    @Override
    public CompletableFuture<Optional<String>> getDisconnectReason(UUID uuid) {
        StringBuilder message = new StringBuilder("¡Estás baneado permanentemente!");
        this.reason.ifPresent(s -> message.append(" Razón: ").append(s));
        return CompletableFuture.completedFuture(Optional.of(message.toString()));
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.ban.InfiniteBan`

#### Baneo Temporal (Temporal)

Los baneos temporales expiran después de una duración establecida:

```java
public class TimedBan extends AbstractBan {
    private final Instant expiresOn;

    public TimedBan(UUID target, UUID by, Instant timestamp, Instant expiresOn, String reason) {
        super(target, by, timestamp, reason);
        this.expiresOn = expiresOn;
    }

    @Override
    public boolean isInEffect() {
        return this.expiresOn.isAfter(Instant.now());
    }

    @Override
    public String getType() {
        return "timed";
    }

    public Instant getExpiresOn() {
        return this.expiresOn;
    }

    @Override
    public CompletableFuture<Optional<String>> getDisconnectReason(UUID uuid) {
        Duration timeRemaining = Duration.between(Instant.now(), this.expiresOn);
        StringBuilder message = new StringBuilder("¡Estás baneado temporalmente por ")
            .append(StringUtil.humanizeTime(timeRemaining))
            .append('!');
        this.reason.ifPresent(s -> message.append(" Razón: ").append(s));
        return CompletableFuture.completedFuture(Optional.of(message.toString()));
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.ban.TimedBan`

### HytaleBanProvider

El proveedor de baneos predeterminado gestiona los baneos almacenados en `bans.json`:

```java
public class HytaleBanProvider extends BlockingDiskFile implements AccessProvider {
    private final Map<UUID, Ban> bans = new Object2ObjectOpenHashMap<>();

    public HytaleBanProvider() {
        super(Paths.get("bans.json"));
    }

    public boolean hasBan(UUID uuid) {
        this.fileLock.readLock().lock();
        try {
            return this.bans.containsKey(uuid);
        } finally {
            this.fileLock.readLock().unlock();
        }
    }

    public boolean modify(@Nonnull Function<Map<UUID, Ban>, Boolean> function) {
        this.fileLock.writeLock().lock();
        boolean modified;
        try {
            modified = function.apply(this.bans);
        } finally {
            this.fileLock.writeLock().unlock();
        }
        if (modified) {
            this.syncSave();
        }
        return modified;
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.provider.HytaleBanProvider`

### Analizador de Baneo Personalizado

Puedes registrar tipos de baneo personalizados usando la interfaz `BanParser`:

```java
@FunctionalInterface
public interface BanParser {
    Ban parse(JsonObject object) throws JsonParseException;
}
```

Registrar un analizador de baneo personalizado:

```java
AccessControlModule.get().registerBanParser("myCustomBan", MyCustomBan::fromJsonObject);
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.ban.BanParser`

## Sistema de Lista Blanca

### HytaleWhitelistProvider

El proveedor de lista blanca gestiona los jugadores permitidos en `whitelist.json`:

```java
public class HytaleWhitelistProvider extends BlockingDiskFile implements AccessProvider {
    private final Set<UUID> whitelist = new HashSet<>();
    private boolean isEnabled;

    public HytaleWhitelistProvider() {
        super(Paths.get("whitelist.json"));
    }

    @Override
    public CompletableFuture<Optional<String>> getDisconnectReason(UUID uuid) {
        this.lock.readLock().lock();
        try {
            if (!this.isEnabled || this.whitelist.contains(uuid)) {
                return CompletableFuture.completedFuture(Optional.empty());
            }
            return CompletableFuture.completedFuture(Optional.of("You are not whitelisted!"));
        } finally {
            this.lock.readLock().unlock();
        }
    }

    public void setEnabled(boolean isEnabled) {
        this.lock.writeLock().lock();
        try {
            this.isEnabled = isEnabled;
        } finally {
            this.lock.writeLock().unlock();
        }
    }

    public boolean isEnabled() { ... }

    public Set<UUID> getList() {
        this.lock.readLock().lock();
        try {
            return Collections.unmodifiableSet(this.whitelist);
        } finally {
            this.lock.readLock().unlock();
        }
    }

    public boolean modify(@Nonnull Function<Set<UUID>, Boolean> consumer) {
        this.lock.writeLock().lock();
        boolean result;
        try {
            result = consumer.apply(this.whitelist);
        } finally {
            this.lock.writeLock().unlock();
        }
        if (result) {
            this.syncSave();
        }
        return result;
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.provider.HytaleWhitelistProvider`

### Formato del Archivo de Lista Blanca

La estructura del archivo `whitelist.json`:

```json
{
  "enabled": false,
  "list": [
    "550e8400-e29b-41d4-a716-446655440000",
    "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
  ]
}
```

## Registrar Proveedores de Acceso Personalizados

Puedes añadir proveedores de acceso personalizados para extender el sistema:

```java
public class MyCustomProvider implements AccessProvider {
    @Override
    public CompletableFuture<Optional<String>> getDisconnectReason(UUID uuid) {
        // Lógica de acceso personalizada aquí
        if (isPlayerBanned(uuid)) {
            return CompletableFuture.completedFuture(
                Optional.of("¡Has sido baneado por el proveedor personalizado!")
            );
        }
        return CompletableFuture.completedFuture(Optional.empty());
    }
}

// Registrar el proveedor
AccessControlModule.get().registerAccessProvider(new MyCustomProvider());
```

## Comandos de Consola

### Comandos de Baneo

| Comando                        | Descripción                         |
| ------------------------------ | ----------------------------------- |
| `/ban <nombreusuario> [razón]` | Banear permanentemente a un jugador |
| `/unban <nombreusuario>`       | Eliminar el baneo de un jugador     |

**Detalles del Comando Ban:**

```java
public class BanCommand extends AbstractAsyncCommand {
    private final RequiredArg<String> usernameArg =
        this.withRequiredArg("username", "server.commands.ban.username.desc", ArgTypes.STRING);
    private final OptionalArg<String> reasonArg =
        this.withOptionalArg("reason", "server.commands.ban.reason.desc", ArgTypes.STRING);

    public BanCommand(@Nonnull HytaleBanProvider banProvider) {
        super("ban", "server.commands.ban.desc");
        this.setUnavailableInSingleplayer(true);
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.commands.BanCommand`

### Comandos de Lista Blanca

| Comando                             | Descripción                                                | Alias |
| ----------------------------------- | ---------------------------------------------------------- | ----- |
| `/whitelist add <nombreusuario>`    | Añadir un jugador a la lista blanca                        | -     |
| `/whitelist remove <nombreusuario>` | Eliminar un jugador de la lista blanca                     | -     |
| `/whitelist enable`                 | Habilitar la lista blanca                                  | `on`  |
| `/whitelist disable`                | Deshabilitar la lista blanca                               | `off` |
| `/whitelist status`                 | Mostrar estado habilitado/deshabilitado de la lista blanca | -     |
| `/whitelist list`                   | Listar jugadores en lista blanca (hasta 10)                | -     |
| `/whitelist clear`                  | Eliminar todos los jugadores de la lista blanca            | -     |

**Estructura del Comando Whitelist:**

```java
public class WhitelistCommand extends AbstractCommandCollection {
    public WhitelistCommand(@Nonnull HytaleWhitelistProvider whitelistProvider) {
        super("whitelist", "server.commands.whitelist.desc");
        this.addSubCommand(new WhitelistAddCommand(whitelistProvider));
        this.addSubCommand(new WhitelistRemoveCommand(whitelistProvider));
        this.addSubCommand(new WhitelistEnableCommand(whitelistProvider));
        this.addSubCommand(new WhitelistDisableCommand(whitelistProvider));
        this.addSubCommand(new WhitelistClearCommand(whitelistProvider));
        this.addSubCommand(new WhitelistStatusCommand(whitelistProvider));
        this.addSubCommand(new WhitelistListCommand(whitelistProvider));
    }
}
```

**Fuente:** `com.hypixel.hytale.server.core.modules.accesscontrol.commands.WhitelistCommand`

## Ejemplo de Plugin

Aquí hay un ejemplo completo de un plugin que implementa control de acceso personalizado:

```java
public class CustomAccessControlPlugin extends JavaPlugin {

    private final Set<UUID> vipPlayers = ConcurrentHashMap.newKeySet();

    public CustomAccessControlPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        // Registrar un proveedor de acceso personalizado para modo solo VIP
        AccessControlModule.get().registerAccessProvider(new VipOnlyProvider());

        // Registrar un tipo de baneo personalizado
        AccessControlModule.get().registerBanParser("warning", WarningBan::fromJsonObject);
    }

    // Proveedor de acceso personalizado para modo solo VIP
    private class VipOnlyProvider implements AccessProvider {
        private boolean vipOnlyMode = false;

        @Override
        public CompletableFuture<Optional<String>> getDisconnectReason(UUID uuid) {
            if (vipOnlyMode && !vipPlayers.contains(uuid)) {
                return CompletableFuture.completedFuture(
                    Optional.of("¡El servidor está actualmente en modo solo VIP!")
                );
            }
            return CompletableFuture.completedFuture(Optional.empty());
        }

        public void setVipOnlyMode(boolean enabled) {
            this.vipOnlyMode = enabled;
        }
    }

    // Banear un jugador programáticamente
    public void banPlayer(UUID target, UUID bannedBy, String reason) {
        AccessControlModule module = AccessControlModule.get();
        InfiniteBan ban = new InfiniteBan(target, bannedBy, Instant.now(), reason);

        // Obtener el proveedor de baneos y añadir el baneo
        // Nota: Necesitarías acceder al proveedor mediante reflexión
        // o usar el comando de baneo
    }

    // Comprobar si un jugador está baneado
    public boolean isPlayerBanned(UUID uuid) {
        // La implementación comprobaría el proveedor de baneos
        return false;
    }
}
```

## Almacenamiento de Datos

### Formato de bans.json

Los baneos se almacenan como un array JSON:

```json
[
  {
    "type": "infinite",
    "target": "550e8400-e29b-41d4-a716-446655440000",
    "by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "timestamp": 1704067200000,
    "reason": "Cheating"
  },
  {
    "type": "timed",
    "target": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "by": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "timestamp": 1704067200000,
    "expiresOn": 1704153600000,
    "reason": "Spamming"
  }
]
```

### Serialización JSON de AbstractBan

```java
public JsonObject toJsonObject() {
    JsonObject object = new JsonObject();
    object.addProperty("type", this.getType());
    object.addProperty("target", this.target.toString());
    object.addProperty("by", this.by.toString());
    object.addProperty("timestamp", this.timestamp.toEpochMilli());
    this.reason.ifPresent(s -> object.addProperty("reason", s));
    return object;
}
```

## Flujo de Conexión

Cuando un jugador intenta conectarse, el `AccessControlModule` procesa la conexión:

```java
this.getEventRegistry().register(PlayerSetupConnectEvent.class, event -> {
    CompletableFuture<Optional<String>> completableFuture =
        this.getDisconnectReason(event.getUuid());
    Optional<String> disconnectReason = completableFuture.join();
    if (disconnectReason.isPresent()) {
        event.setReason(disconnectReason.get());
        event.setCancelled(true);
    }
});
```

El sistema comprueba todos los proveedores registrados en orden. Si algún proveedor devuelve una razón de desconexión, la conexión es rechazada.

## Seguridad de Hilos

Ambos proveedores usan `ReadWriteLock` para acceso seguro entre hilos:

- **Operaciones de lectura** - Múltiples hilos pueden leer simultáneamente
- **Operaciones de escritura** - Acceso exclusivo para modificaciones
- **Auto-guardado** - Los cambios se persisten automáticamente después de las modificaciones

## Archivos Fuente

| Clase                     | Ruta                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `AccessControlModule`     | `com.hypixel.hytale.server.core.modules.accesscontrol.AccessControlModule`              |
| `AccessProvider`          | `com.hypixel.hytale.server.core.modules.accesscontrol.provider.AccessProvider`          |
| `HytaleBanProvider`       | `com.hypixel.hytale.server.core.modules.accesscontrol.provider.HytaleBanProvider`       |
| `HytaleWhitelistProvider` | `com.hypixel.hytale.server.core.modules.accesscontrol.provider.HytaleWhitelistProvider` |
| `Ban`                     | `com.hypixel.hytale.server.core.modules.accesscontrol.ban.Ban`                          |
| `AbstractBan`             | `com.hypixel.hytale.server.core.modules.accesscontrol.ban.AbstractBan`                  |
| `InfiniteBan`             | `com.hypixel.hytale.server.core.modules.accesscontrol.ban.InfiniteBan`                  |
| `TimedBan`                | `com.hypixel.hytale.server.core.modules.accesscontrol.ban.TimedBan`                     |
| `BanParser`               | `com.hypixel.hytale.server.core.modules.accesscontrol.ban.BanParser`                    |
| `BanCommand`              | `com.hypixel.hytale.server.core.modules.accesscontrol.commands.BanCommand`              |
| `UnbanCommand`            | `com.hypixel.hytale.server.core.modules.accesscontrol.commands.UnbanCommand`            |
| `WhitelistCommand`        | `com.hypixel.hytale.server.core.modules.accesscontrol.commands.WhitelistCommand`        |
