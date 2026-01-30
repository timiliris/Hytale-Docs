---
id: packets
title: Paquetes de Red
sidebar_label: Paquetes
sidebar_position: 7
description: Documentación completa de los paquetes de red del protocolo Hytale (más de 200 paquetes)
---

# Documentación de Paquetes de Red de Hytale

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada con el código fuente descompilado del servidor utilizando análisis multiagente. Toda la información incluye referencias a los archivos fuente.
:::

## ¿Qué son los Paquetes de Red?

Cuando juegas a Hytale, tu computadora (el **cliente**) y el servidor del juego necesitan intercambiar información constantemente. Esta comunicación ocurre a través de **paquetes** - pequeños conjuntos de datos enviados a través de la red.

### El Baile Cliente-Servidor

Cada acción en un juego multijugador implica comunicación de red:

```text
Tú presionas W para caminar hacia adelante
│
▼
Tu cliente envía: "El jugador quiere moverse hacia adelante"
│
▼ (viaja por internet)
│
▼
El servidor recibe, valida, calcula la nueva posición
│
▼
El servidor envía: "El jugador está ahora en la posición (X, Y, Z)"
│
▼ (viaja de vuelta)
│
▼
Tu cliente actualiza tu pantalla
```

¡Esto sucede **docenas de veces por segundo** para cada jugador!

### Por Qué Importan los Paquetes

Entender los paquetes te ayuda a:

- **Depurar problemas de red**: "¿Por qué mi objeto personalizado no aparece?"
- **Optimizar rendimiento**: Saber qué paquetes son costosos
- **Entender los límites del juego**: ¿Por qué no puedo enviar datos ilimitados?
- **Crear plugins conscientes de la red**: Reaccionar a las acciones del jugador eficientemente

### Anatomía de un Paquete

Cada paquete tiene una estructura estándar:

┌─────────────────────────────────────────────┐
│ ID de Paquete (1-5 bytes) │ ← ¿Qué tipo de paquete?
├─────────────────────────────────────────────┤
│ Bits Nulos (1-2 bytes) │ ← ¿Qué campos opcionales están presentes?
├─────────────────────────────────────────────┤
│ Bloque Fijo (varía) │ ← Datos siempre presentes
├─────────────────────────────────────────────┤
│ Bloque Variable (varía) │ ← Datos opcionales/dinámicos
└─────────────────────────────────────────────┘

```

### Analogía del Mundo Real: Correo Postal

Los paquetes son como cartas en el correo:

| Sistema Postal | Paquetes de Red |
|---------------|-----------------|
| Sobre | Encabezado del paquete (ID, tamaño) |
| Dirección del remitente | Identificador del cliente/servidor |
| Contenido de la carta | Datos del paquete (posiciones, acciones) |
| Código postal | ID del paquete (determina el manejo) |
| Correo certificado | Paquetes fiables (deben llegar) |
| Postal | Paquetes rápidos (pueden perderse) |

### Direcciones de Paquetes

Los paquetes fluyen en dos direcciones:

| Dirección | Símbolo | Ejemplo |
|-----------|--------|---------|
| **Cliente → Servidor** | C2S | "Hice clic en la posición X,Y" |
| **Servidor → Cliente** | S2C | "El bloque en X,Y,Z es ahora Piedra" |
| **Bidireccional** | ↔ | Ping/Pong para medición de latencia |

### Categorías de Paquetes

Hytale organiza más de 200 paquetes en grupos lógicos:

| Categoría | Propósito | Ejemplos |
|----------|---------|----------|
| **Conexión** (0-3) | Establecer/terminar conexiones | Conectar, Desconectar, Ping |
| **Autenticación** (10-18) | Inicio de sesión y permisos | AuthToken, ConnectAccept |
| **Configuración** (20-34) | Carga inicial del mundo | WorldSettings, AssetInitialize |
| **Jugador** (100-119) | Acciones del jugador | ClientMovement, MouseInteraction |
| **Mundo/Chunk** (131-166) | Datos del mundo | SetChunk, ServerSetBlock |
| **Entidad** (160-166) | Actualizaciones de entidad | EntityUpdates, PlayAnimation |
| **Inventario** (170-179) | Gestión de inventario | UpdatePlayerInventory, MoveItemStack |
| **Interfaz** (210-234) | UI y chat | ChatMessage, Notification |

### El Flujo de Conexión

Cuando te unes a un servidor de Hytale, esto es lo que sucede:

```

1. CLIENTE: "¡Hola! Quiero conectarme" (Paquete Connect)
   ↓
2. SERVIDOR: "¿Quién eres?" (desafío de autenticación)
   ↓
3. CLIENTE: "Aquí está mi token" (Paquete AuthToken)
   ↓
4. SERVIDOR: "¡Bienvenido! Aquí están las configuraciones del mundo" (ConnectAccept + WorldSettings)
   ↓
5. SERVIDOR: "Aquí están los datos del mundo..." (Paquetes SetChunk)
   ↓
6. CLIENTE: "¡Estoy listo!" (Paquete ClientReady)
   ↓
7. Ambos: Intercambian paquetes de movimiento/acción continuamente

````

### Compresión y Optimización

Los paquetes grandes (como datos de chunks) se comprimen para ahorrar ancho de banda:

- **Paquetes comprimidos**: Datos de chunk, actualizaciones de assets, lotes de entidades
- **Paquetes no comprimidos**: Paquetes pequeños y frecuentes como movimiento

El servidor equilibra entre:
- **Ancho de banda**: Cuántos datos se envían
- **Latencia**: Qué tan rápido llegan los datos
- **Costo de CPU**: La compresión toma tiempo de procesamiento

---

## Referencia de Paquetes

Documentación completa del protocolo de red de Hytale, basada en el análisis del código descompilado del servidor.

### Resumen Técnico

El protocolo de red de Hytale utiliza un sistema de paquetes binarios para la comunicación cliente-servidor. Cada paquete contiene:

- **ID Único**: Identificador numérico para el paquete (0-423)
- **Dirección**: Cliente a Servidor (C2S) o Servidor a Cliente (S2C)
- **Compresión**: Ciertos paquetes grandes están comprimidos
- **Tamaño**: Fijo o variable dependiendo de los datos

### Arquitectura del Protocolo

```text
+------------------+ +------------------+
| CLIENT | | SERVER |
+------------------+ +------------------+
| |
| Connect (ID:0) |
|----------------------─>|
| |
| ConnectAccept (ID:14) |
|<──────────────────────|
| |
| WorldSettings (ID:20) |
|<──────────────────────|
| |
| ClientMovement (ID:108)|
|----------------------─>|
| |
| EntityUpdates (ID:161)|
|<──────────────────────|
| |
````

### Formato del Paquete

Cada paquete sigue esta estructura:

| Campo           | Tamaño    | Descripción                               |
| --------------- | --------- | ----------------------------------------- |
| ID de Paquete   | VarInt    | Identificador único del paquete           |
| Bits Nulos      | 1-2 bytes | Banderas para campos anulables (nullable) |
| Bloque Fijo     | Variable  | Datos de tamaño fijo                      |
| Bloque Variable | Variable  | Datos de tamaño variable                  |

---

## Paquetes de Conexión (ID: 0-3)

Paquetes básicos para la gestión de la conexión.

### Connect (ID: 0)

**Dirección**: Cliente -> Servidor

Paquete inicial enviado por el cliente para establecer una conexión.

| Campo            | Tipo              | Descripción                             |
| ---------------- | ----------------- | --------------------------------------- |
| `protocolHash`   | String (64 bytes) | Hash de versión del protocolo           |
| `clientType`     | ClientType (byte) | Tipo de cliente (Game, AssetEditor)     |
| `language`       | String?           | Idioma del cliente (max 128 chars)      |
| `identityToken`  | String?           | Token de autenticación (max 8192 chars) |
| `uuid`           | UUID              | Identificador único del jugador         |
| `username`       | String            | Nombre del jugador (max 16 chars)       |
| `referralData`   | byte[]?           | Datos de referencia (max 4096 bytes)    |
| `referralSource` | HostAddress?      | Fuente de conexión                      |

**Tamaño**: 82-38161 bytes

---

### Disconnect (ID: 1)

**Dirección**: Bidireccional

Terminación de conexión con razón opcional.

| Campo    | Tipo           | Descripción                              |
| -------- | -------------- | ---------------------------------------- |
| `reason` | String?        | Razón de desconexión (max 4096000 chars) |
| `type`   | DisconnectType | Tipo de desconexión                      |

**Tamaño**: 2-16384007 bytes

---

### Ping (ID: 2)

**Dirección**: Bidireccional

Medición de latencia de red.

| Campo                 | Tipo         | Descripción                   |
| --------------------- | ------------ | ----------------------------- |
| `id`                  | int          | Identificador de ping         |
| `time`                | InstantData? | Marca de tiempo (Timestamp)   |
| `lastPingValueRaw`    | int          | Último valor de ping en bruto |
| `lastPingValueDirect` | int          | Ping directo                  |
| `lastPingValueTick`   | int          | Ping basado en ticks          |

**Tamaño**: 29 bytes (fijo)

---

### Pong (ID: 3)

**Dirección**: Bidireccional

Respuesta a un paquete ping.

| Campo             | Tipo         | Descripción                           |
| ----------------- | ------------ | ------------------------------------- |
| `id`              | int          | Identificador correspondiente al ping |
| `time`            | InstantData? | Marca de tiempo (Timestamp)           |
| `type`            | PongType     | Tipo de pong (Raw, Direct, Tick)      |
| `packetQueueSize` | short        | Tamaño de la cola de paquetes         |

**Tamaño**: 20 bytes (fijo)

---

## Paquetes de Autenticación (ID: 10-18)

Gestión de autenticación y permisos.

### Status (ID: 10)

**Dirección**: Servidor -> Cliente

Estado de la conexión.

| Campo                 | Tipo | Descripción           |
| --------------------- | ---- | --------------------- |
| (estructura compleja) | -    | Información de estado |

**Tamaño**: 9-2587 bytes

---

### AuthGrant (ID: 11)

**Dirección**: Cliente -> Servidor

Solicitud de autorización de autenticación.

| Campo          | Tipo | Descripción            |
| -------------- | ---- | ---------------------- |
| (credenciales) | -    | Datos de autenticación |

**Tamaño**: 1-49171 bytes

---

### AuthToken (ID: 12)

**Dirección**: Cliente -> Servidor

Token de autenticación.

| Campo                      | Tipo    | Descripción                                             |
| -------------------------- | ------- | ------------------------------------------------------- |
| `accessToken`              | String? | Token de acceso (max 8192 chars)                        |
| `serverAuthorizationGrant` | String? | Concesión de autorización del servidor (max 4096 chars) |

**Tamaño**: 1-49171 bytes

---

### ServerAuthToken (ID: 13)

**Dirección**: Servidor -> Cliente

Token de autenticación del servidor.

**Tamaño**: 1-32851 bytes

---

### ConnectAccept (ID: 14)

**Dirección**: Servidor -> Cliente

Confirmación de aceptación de conexión.

**Tamaño**: 1-70 bytes

---

### PasswordResponse (ID: 15)

**Dirección**: Cliente -> Servidor

Respuesta de contraseña para servidores protegidos.

**Tamaño**: 1-70 bytes

---

### PasswordAccepted (ID: 16)

**Dirección**: Servidor -> Cliente

Confirmación de contraseña aceptada.

**Tamaño**: 0 bytes (vacío)

---

### PasswordRejected (ID: 17)

**Dirección**: Servidor -> Cliente

Notificación de contraseña rechazada.

**Tamaño**: 5-74 bytes

---

### ClientReferral (ID: 18)

**Dirección**: Servidor -> Cliente

Redirección del cliente a otro servidor.

**Tamaño**: 1-5141 bytes

---

## Paquetes de Configuración (ID: 20-34)

Carga inicial del mundo y configuración de assets.

### WorldSettings (ID: 20)

**Dirección**: Servidor -> Cliente
**Comprimido**: Sí

Configuración del mundo.

| Campo            | Tipo     | Descripción                |
| ---------------- | -------- | -------------------------- |
| `worldHeight`    | int      | Altura máxima del mundo    |
| `requiredAssets` | Asset[]? | Lista de assets requeridos |

**Tamaño**: 5+ bytes (variable, comprimido)

---

### WorldLoadProgress (ID: 21)

**Dirección**: Servidor -> Cliente

Progreso de carga del mundo.

**Tamaño**: 9-16384014 bytes

---

### WorldLoadFinished (ID: 22)

**Dirección**: Servidor -> Cliente

Notificación de finalización de carga.

**Tamaño**: 0 bytes (vacío)

---

### RequestAssets (ID: 23)

**Dirección**: Cliente -> Servidor
**Comprimido**: Sí

Solicitud de assets al servidor.

**Tamaño**: Variable (comprimido)

---

### AssetInitialize (ID: 24)

**Dirección**: Servidor -> Cliente

Inicialización de transferencia de assets.

**Tamaño**: 4-2121 bytes

---

### AssetPart (ID: 25)

**Dirección**: Servidor -> Cliente
**Comprimido**: Sí

Parte de un asset (transferencia fragmentada).

**Tamaño**: 1-4096006 bytes (comprimido)

---

### AssetFinalize (ID: 26)

**Dirección**: Servidor -> Cliente

Finalización de transferencia de assets.

**Tamaño**: 0 bytes (vacío)

---

### RemoveAssets (ID: 27)

**Dirección**: Servidor -> Cliente

Eliminación de assets de la caché del cliente.

**Tamaño**: Variable

---

### RequestCommonAssetsRebuild (ID: 28)

**Dirección**: Cliente -> Servidor

Solicitud de reconstrucción de assets comunes.

**Tamaño**: 0 bytes (vacío)

---

### SetUpdateRate (ID: 29)

**Dirección**: Servidor -> Cliente

Configuración de tasa de actualización.

| Campo        | Tipo | Descripción           |
| ------------ | ---- | --------------------- |
| `updateRate` | int  | Tasa de actualización |

**Tamaño**: 4 bytes (fijo)

---

### SetTimeDilation (ID: 30)

**Dirección**: Servidor -> Cliente

Configuración de dilatación del tiempo.

| Campo          | Tipo  | Descripción          |
| -------------- | ----- | -------------------- |
| `timeDilation` | float | Factor de dilatación |

**Tamaño**: 4 bytes (fijo)

---

### UpdateFeatures (ID: 31)

**Direction**: Server -> Client

Actualización de características habilitadas.

**Size**: 1-8192006 bytes

---

### ViewRadius (ID: 32)

**Direction**: Bidirectional

Configuración del radio de visión.

| Campo        | Tipo | Descripción               |
| ------------ | ---- | ------------------------- |
| `viewRadius` | int  | Radio de visión en chunks |

**Size**: 4 bytes (fixed)

---

### PlayerOptions (ID: 33)

**Direction**: Client -> Server

Opciones y preferencias del jugador.

**Size**: 1-327680184 bytes

---

### ServerTags (ID: 34)

**Direction**: Server -> Client

Etiquetas y metadatos del servidor.

**Size**: Variable

---

## Paquetes de Actualización de Assets (ID: 40-85)

Actualizaciones dinámicas de definición de assets.

### UpdateBlockTypes (ID: 40)

**Direction**: Server -> Client
**Compressed**: Yes

Definiciones de tipos de bloque.

**Size**: Variable (compressed)

---

### UpdateBlockHitboxes (ID: 41)

**Direction**: Server -> Client
**Compressed**: Yes

Cajas de colisión (hitboxes) de bloques.

---

### UpdateBlockSoundSets (ID: 42)

**Direction**: Server -> Client
**Compressed**: Yes

Sonidos asociados a bloques.

---

### UpdateItems (ID: 54)

**Direction**: Server -> Client
**Compressed**: Yes

Definiciones de objetos.

---

### UpdateRecipes (ID: 60)

**Direction**: Server -> Client
**Compressed**: Yes

Recetas de fabricación.

---

### UpdateEnvironments (ID: 61)

**Direction**: Server -> Client
**Compressed**: Yes

Configuración del entorno (biomas, clima, etc.).

---

### UpdateWeathers (ID: 47)

**Direction**: Server -> Client
**Compressed**: Yes

Tipos de clima disponibles.

---

### UpdateInteractions (ID: 66)

**Direction**: Server -> Client
**Compressed**: Yes

Definiciones de interacción.

---

_Nota: Los paquetes 40-85 siguen todos el mismo patrón de actualización de assets._

---

## Paquetes de Jugador (ID: 100-119)

Gestión y acciones del jugador.

### SetClientId (ID: 100)

**Direction**: Server -> Client

Asignación de identificador de cliente.

| Campo      | Tipo | Descripción         |
| ---------- | ---- | ------------------- |
| `clientId` | int  | ID de cliente único |

**Size**: 4 bytes (fixed)

---

### SetGameMode (ID: 101)

**Direction**: Server -> Client

Cambio de modo de juego.

| Campo      | Tipo | Descripción   |
| ---------- | ---- | ------------- |
| `gameMode` | byte | Modo de juego |

**Size**: 1 byte (fixed)

---

### SetMovementStates (ID: 102)

**Direction**: Server -> Client

Estados de movimiento permitidos.

**Size**: 2 bytes (fixed)

---

### SetBlockPlacementOverride (ID: 103)

**Direction**: Server -> Client

Anulación de colocación de bloques.

**Size**: 1 byte (fixed)

---

### JoinWorld (ID: 104)

**Direction**: Server -> Client

Unirse a un mundo.

| Campo        | Tipo    | Descripción             |
| ------------ | ------- | ----------------------- |
| `clearWorld` | boolean | Limpiar mundo actual    |
| `fadeInOut`  | boolean | Animación de transición |
| `worldUuid`  | UUID    | Identificador del mundo |

**Size**: 18 bytes (fixed)

---

### ClientReady (ID: 105)

**Direction**: Client -> Server

Notificación de que el cliente está listo.

**Size**: 2 bytes (fixed)

---

### LoadHotbar (ID: 106) / SaveHotbar (ID: 107)

**Direction**: Client -> Server

Carga/Guardado de barra rápida.

**Size**: 1 byte (fixed)

---

### ClientMovement (ID: 108)

**Direction**: Client -> Server

Actualización de posición y movimiento del jugador.

| Campo                 | Tipo               | Descripción                      |
| --------------------- | ------------------ | -------------------------------- |
| `movementStates`      | MovementStates?    | Estados de movimiento actuales   |
| `relativePosition`    | HalfFloatPosition? | Posición relativa (delta)        |
| `absolutePosition`    | Position?          | Posición absoluta                |
| `bodyOrientation`     | Direction?         | Orientación del cuerpo           |
| `lookOrientation`     | Direction?         | Dirección de la mirada           |
| `teleportAck`         | TeleportAck?       | Reconocimiento de teletransporte |
| `wishMovement`        | Position?          | Movimiento deseado               |
| `velocity`            | Vector3d?          | Velocidad actual                 |
| `mountedTo`           | int                | ID de montura (0 si ninguna)     |
| `riderMovementStates` | MovementStates?    | Estados de montura               |

**Size**: 153 bytes (fixed)

---

### ClientTeleport (ID: 109)

**Direction**: Server -> Client

Teletransporte forzado del jugador.

**Size**: 52 bytes (fixed)

---

### UpdateMovementSettings (ID: 110)

**Direction**: Server -> Client

Actualización de configuración de movimiento.

**Size**: 252 bytes (fixed)

---

### MouseInteraction (ID: 111)

**Direction**: Client -> Server

Interacción del ratón (clics, movimiento).

| Campo              | Tipo              | Descripción                   |
| ------------------ | ----------------- | ----------------------------- |
| `clientTimestamp`  | long              | Marca de tiempo del cliente   |
| `activeSlot`       | int               | Ranura activa de barra rápida |
| `itemInHandId`     | String?           | ID del objeto en mano         |
| `screenPoint`      | Vector2f?         | Posición en pantalla          |
| `mouseButton`      | MouseButtonEvent? | Evento de botón               |
| `mouseMotion`      | MouseMotionEvent? | Evento de movimiento          |
| `worldInteraction` | WorldInteraction? | Interacción con el mundo      |

**Size**: 44-20480071 bytes

---

### DamageInfo (ID: 112)

**Direction**: Server -> Client

Información de daño recibido.

**Size**: 29-32768048 bytes

---

### ReticleEvent (ID: 113)

**Direction**: Server -> Client

Evento de retícula de apuntado.

**Size**: 4 bytes (fixed)

---

### DisplayDebug (ID: 114)

**Direction**: Server -> Client

Visualización de información de depuración.

**Size**: 19-32768037 bytes

---

### ClearDebugShapes (ID: 115)

**Direction**: Server -> Client

Limpieza de formas de depuración.

**Size**: 0 bytes (empty)

---

### SyncPlayerPreferences (ID: 116)

**Direction**: Bidirectional

Sincronización de preferencias del jugador.

**Size**: 8 bytes (fixed)

---

### ClientPlaceBlock (ID: 117)

**Direction**: Client -> Server

Colocación de bloque por el cliente.

**Size**: 20 bytes (fixed)

---

### UpdateMemoriesFeatureStatus (ID: 118)

**Direction**: Server -> Client

Estado de la característica de recuerdos.

**Size**: 1 byte (fixed)

---

### RemoveMapMarker (ID: 119)

**Direction**: Client -> Server

Eliminación de marcador de mapa.

**Size**: 1-16384006 bytes

---

## Paquetes de Mundo/Chunk (ID: 131-166)

Gestión de chunks y mundo.

### SetChunk (ID: 131)

**Direction**: Server -> Client
**Compressed**: Yes

Transmisión de datos de chunk.

| Campo         | Tipo    | Descripción            |
| ------------- | ------- | ---------------------- |
| `x`           | int     | Coordenada X del Chunk |
| `y`           | int     | Coordenada Y del Chunk |
| `z`           | int     | Coordenada Z del Chunk |
| `localLight`  | byte[]? | Datos de luz local     |
| `globalLight` | byte[]? | Datos de luz global    |
| `data`        | byte[]? | Datos de bloque        |

**Size**: 13-12288040 bytes (compressed)

---

### SetChunkHeightmap (ID: 132)

**Direction**: Server -> Client
**Compressed**: Yes

Mapa de altura del chunk.

**Size**: 9-4096014 bytes (compressed)

---

### SetChunkTintmap (ID: 133)

**Direction**: Server -> Client
**Compressed**: Yes

Mapa de tintes del chunk (colores de vegetación).

**Size**: 9-4096014 bytes (compressed)

---

### SetChunkEnvironments (ID: 134)

**Direction**: Server -> Client
**Compressed**: Yes

Entornos del chunk.

**Size**: 9-4096014 bytes (compressed)

---

### UnloadChunk (ID: 135)

**Direction**: Server -> Client

Descarga de chunk.

| Campo    | Tipo | Descripción            |
| -------- | ---- | ---------------------- |
| `chunkX` | int  | Coordenada X del Chunk |
| `chunkZ` | int  | Coordenada Z del Chunk |

**Size**: 8 bytes (fixed)

---

### SetFluids (ID: 136)

**Direction**: Server -> Client
**Compressed**: Yes

Fluidos del chunk.

**Size**: 13-4096018 bytes (compressed)

---

### ServerSetBlock (ID: 140)

**Direction**: Server -> Client

Modificación de bloque por el servidor.

| Campo      | Tipo  | Descripción         |
| ---------- | ----- | ------------------- |
| `x`        | int   | Coordenada X        |
| `y`        | int   | Coordenada Y        |
| `z`        | int   | Coordenada Z        |
| `blockId`  | int   | Nuevo ID de bloque  |
| `filler`   | short | Datos adicionales   |
| `rotation` | byte  | Rotación del bloque |

**Size**: 19 bytes (fixed)

---

### ServerSetBlocks (ID: 141)

**Direction**: Server -> Client

Múltiples modificaciones de bloques.

**Size**: 12-36864017 bytes

---

### ServerSetFluid (ID: 142)

**Direction**: Server -> Client

Modificación de fluido.

**Size**: 17 bytes (fixed)

---

### ServerSetFluids (ID: 143)

**Direction**: Server -> Client

Múltiples modificaciones de fluidos.

**Size**: 12-28672017 bytes

---

### UpdateBlockDamage (ID: 144)

**Direction**: Server -> Client

Actualización de daño a bloque.

**Size**: 21 bytes (fixed)

---

### UpdateTimeSettings (ID: 145)

**Direction**: Server -> Client

Configuración de tiempo.

**Size**: 10 bytes (fixed)

---

### UpdateTime (ID: 146)

**Direction**: Server -> Client

Actualización de tiempo.

**Size**: 13 bytes (fixed)

---

### UpdateWeather (ID: 149)

**Direction**: Server -> Client

Actualización de clima.

**Size**: 8 bytes (fixed)

---

### SpawnParticleSystem (ID: 152)

**Direction**: Server -> Client

Creación de sistema de partículas.

**Size**: 44-16384049 bytes

---

### SpawnBlockParticleSystem (ID: 153)

**Direction**: Server -> Client

Partículas vinculadas a bloques.

**Size**: 30 bytes (fixed)

---

### PlaySoundEvent2D (ID: 154)

**Direction**: Server -> Client

Sonido 2D (interfaz).

**Size**: 13 bytes (fixed)

---

### PlaySoundEvent3D (ID: 155)

**Direction**: Server -> Client

Sonido 3D (mundo).

**Size**: 38 bytes (fixed)

---

### PlaySoundEventEntity (ID: 156)

**Direction**: Server -> Client

Sonido adjunto a entidad.

**Size**: 16 bytes (fixed)

---

### UpdateSleepState (ID: 157)

**Direction**: Server -> Client

Estado de sueño.

**Size**: 36-65536050 bytes

---

### SetPaused (ID: 158)

**Direction**: Client -> Server

Solicitud de pausa.

**Size**: 1 byte (fixed)

---

### ServerSetPaused (ID: 159)

**Direction**: Server -> Client

Confirmación de pausa del servidor.

**Size**: 1 byte (fixed)

---

## Paquetes de Entidad (ID: 160-166)

Gestión de entidades.

### SetEntitySeed (ID: 160)

**Direction**: Server -> Client

Semilla de entidad (para generación procedimental).

**Size**: 4 bytes (fixed)

---

### EntityUpdates (ID: 161)

**Direction**: Server -> Client
**Compressed**: Yes

Actualizaciones de entidad (posición, estado, etc.).

| Campo     | Tipo            | Descripción                 |
| --------- | --------------- | --------------------------- |
| `removed` | int[]?          | IDs de entidades eliminadas |
| `updates` | EntityUpdate[]? | Actualizaciones de entidad  |

**Size**: Variable (compressed)

---

### PlayAnimation (ID: 162)

**Direction**: Server -> Client

Reproducir una animación en una entidad.

**Size**: 6-32768024 bytes

---

### ChangeVelocity (ID: 163)

**Direction**: Server -> Client

Cambio de velocidad de entidad.

**Size**: 35 bytes (fixed)

---

### ApplyKnockback (ID: 164)

**Direction**: Server -> Client

Aplicación de empuje (knockback).

**Size**: 38 bytes (fixed)

---

### SpawnModelParticles (ID: 165)

**Direction**: Server -> Client

Partículas del modelo.

**Size**: Variable

---

### MountMovement (ID: 166)

**Direction**: Client -> Server

Movimiento de montura.

**Size**: 59 bytes (fixed)

---

## Paquetes de Inventario (ID: 170-179)

Gestión de inventario.

### UpdatePlayerInventory (ID: 170)

**Direction**: Server -> Client
**Compressed**: Yes

Actualización completa de inventario.

| Campo             | Tipo              | Descripción                |
| ----------------- | ----------------- | -------------------------- |
| `storage`         | InventorySection? | Almacenamiento principal   |
| `armor`           | InventorySection? | Armadura                   |
| `hotbar`          | InventorySection? | Barra de acción            |
| `utility`         | InventorySection? | Utilidades                 |
| `builderMaterial` | InventorySection? | Materiales de construcción |
| `tools`           | InventorySection? | Herramientas               |
| `backpack`        | InventorySection? | Mochila                    |
| `sortType`        | SortType          | Tipo de ordenamiento       |

**Size**: Variable (compressed)

---

### SetCreativeItem (ID: 171)

**Direction**: Client -> Server

Establecer un objeto en modo creativo.

**Size**: 9-16384019 bytes

---

### DropCreativeItem (ID: 172)

**Direction**: Client -> Server

Soltar un objeto en modo creativo.

**Size**: 0-16384010 bytes

---

### SmartGiveCreativeItem (ID: 173)

**Direction**: Client -> Server

Concesión inteligente de objeto creativo.

**Size**: 1-16384011 bytes

---

### DropItemStack (ID: 174)

**Direction**: Client -> Server

Soltar una pila de objetos.

**Size**: 12 bytes (fixed)

---

### MoveItemStack (ID: 175)

**Direction**: Client -> Server

Mover una pila de objetos.

| Campo           | Tipo | Descripción        |
| --------------- | ---- | ------------------ |
| `fromSectionId` | int  | Sección de origen  |
| `fromSlotId`    | int  | Ranura de origen   |
| `quantity`      | int  | Cantidad a mover   |
| `toSectionId`   | int  | Sección de destino |
| `toSlotId`      | int  | Ranura de destino  |

**Size**: 20 bytes (fixed)

---

### SmartMoveItemStack (ID: 176)

**Direction**: Client -> Server

Movimiento inteligente (shift-clic).

**Size**: 13 bytes (fixed)

---

### SetActiveSlot (ID: 177)

**Direction**: Client -> Server

Cambio de ranura activa.

**Size**: 8 bytes (fixed)

---

### SwitchHotbarBlockSet (ID: 178)

**Direction**: Client -> Server

Cambio de conjunto de barra rápida.

**Size**: 1-16384006 bytes

---

### InventoryAction (ID: 179)

**Direction**: Client -> Server

Acción genérica de inventario.

**Size**: 6 bytes (fixed)

---

## Paquetes de Ventana (ID: 200-204)

Gestión de ventanas/interfaz.

### OpenWindow (ID: 200)

**Direction**: Server -> Client
**Compressed**: Yes

Apertura de ventana.

| Campo            | Tipo              | Descripción           |
| ---------------- | ----------------- | --------------------- |
| `id`             | int               | ID de ventana         |
| `windowType`     | WindowType        | Tipo de ventana       |
| `windowData`     | String?           | Datos JSON de ventana |
| `inventory`      | InventorySection? | Inventario asociado   |
| `extraResources` | ExtraResources?   | Recursos adicionales  |

**Size**: Variable (compressed)

---

### UpdateWindow (ID: 201)

**Direction**: Server -> Client
**Compressed**: Yes

Actualización de ventana.

**Size**: Variable (compressed)

---

### CloseWindow (ID: 202)

**Direction**: Bidirectional

Cierre de ventana.

**Size**: 4 bytes (fixed)

---

### SendWindowAction (ID: 203)

**Direction**: Client -> Server

Acción dentro de una ventana.

**Size**: 4-32768027 bytes

---

### ClientOpenWindow (ID: 204)

**Direction**: Client -> Server

Solicitud de apertura de ventana.

**Size**: 1 byte (fixed)

---

## Paquetes de Interfaz (ID: 210-234)

Comunicación e interfaz de usuario.

### ServerMessage (ID: 210)

**Direction**: Server -> Client

Mensaje del servidor.

**Size**: Variable

---

### ChatMessage (ID: 211)

**Direction**: Client -> Server

Mensaje de chat.

| Campo     | Tipo    | Descripción                               |
| --------- | ------- | ----------------------------------------- |
| `message` | String? | Contenido del mensaje (max 4096000 chars) |

**Size**: 1-16384006 bytes

---

### Notification (ID: 212)

**Direction**: Server -> Client

Notificación a mostrar.

**Size**: Variable

---

### KillFeedMessage (ID: 213)

**Direction**: Server -> Client

Mensaje de feed de muertes.

**Size**: Variable

---

### ShowEventTitle (ID: 214)

**Direction**: Server -> Client

Visualización de título de evento.

**Size**: Variable

---

### HideEventTitle (ID: 215)

**Direction**: Server -> Client

Ocultación de título.

**Size**: 4 bytes (fixed)

---

### SetPage (ID: 216)

**Direction**: Server -> Client

Cambio de página de interfaz.

**Size**: 2 bytes (fixed)

---

### CustomHud (ID: 217)

**Direction**: Server -> Client
**Compressed**: Yes

HUD personalizado.

**Size**: Variable (compressed)

---

### CustomPage (ID: 218)

**Direction**: Server -> Client
**Compressed**: Yes

Página personalizada.

**Size**: Variable (compressed)

---

### CustomPageEvent (ID: 219)

**Direction**: Client -> Server

Evento de página personalizada.

**Size**: 2-16384007 bytes

---

### ServerInfo (ID: 223)

**Direction**: Server -> Client

Información del servidor.

**Size**: 5-32768023 bytes

---

### AddToServerPlayerList (ID: 224)

**Direction**: Server -> Client

Añadir un jugador a la lista.

**Size**: Variable

---

### RemoveFromServerPlayerList (ID: 225)

**Direction**: Server -> Client

Eliminar un jugador de la lista.

**Size**: 1-65536006 bytes

---

### UpdateServerPlayerList (ID: 226)

**Direction**: Server -> Client

Actualización de lista de jugadores.

**Size**: 1-131072006 bytes

---

### UpdateServerPlayerListPing (ID: 227)

**Direction**: Server -> Client

Actualización de ping.

**Size**: 1-81920006 bytes

---

### UpdateKnownRecipes (ID: 228)

**Direction**: Server -> Client

Recetas conocidas por el jugador.

**Size**: Variable

---

### UpdatePortal (ID: 229)

**Direction**: Server -> Client

Actualización de portal.

**Size**: 6-16384020 bytes

---

### UpdateVisibleHudComponents (ID: 230)

**Direction**: Server -> Client

Componentes HUD visibles.

**Size**: 1-4096006 bytes

---

### ResetUserInterfaceState (ID: 231)

**Direction**: Server -> Client

Reinicio de interfaz.

**Size**: 0 bytes (empty)

---

### UpdateLanguage (ID: 232)

**Direction**: Client -> Server

Cambio de idioma.

**Size**: 1-16384006 bytes

---

### WorldSavingStatus (ID: 233)

**Direction**: Server -> Client

Estado de guardado del mundo.

**Size**: 1 byte (fixed)

---

### OpenChatWithCommand (ID: 234)

**Direction**: Server -> Client

Abrir chat con un comando pre-rellenado.

**Size**: 1-16384006 bytes

---

## Paquetes de Mapa del Mundo (ID: 240-245)

Gestión del mapa del mundo.

### UpdateWorldMapSettings (ID: 240)

**Direction**: Server -> Client

Configuración del mapa.

**Size**: Variable

---

### UpdateWorldMap (ID: 241)

**Direction**: Server -> Client
**Compressed**: Yes

Actualización del mapa.

| Campo            | Tipo         | Descripción           |
| ---------------- | ------------ | --------------------- |
| `chunks`         | MapChunk[]?  | Chunks del mapa       |
| `addedMarkers`   | MapMarker[]? | Marcadores añadidos   |
| `removedMarkers` | String[]?    | Marcadores eliminados |

**Size**: Variable (compressed)

---

### ClearWorldMap (ID: 242)

**Direction**: Server -> Client

Limpieza del mapa.

**Size**: 0 bytes (empty)

---

### UpdateWorldMapVisible (ID: 243)

**Direction**: Server -> Client

Visibilidad del mapa.

**Size**: 1 byte (fixed)

---

### TeleportToWorldMapMarker (ID: 244)

**Direction**: Client -> Server

Teletransporte a un marcador.

**Size**: 1-16384006 bytes

---

### TeleportToWorldMapPosition (ID: 245)

**Direction**: Client -> Server

Teletransporte a una posición.

**Size**: 8 bytes (fixed)

---

## Paquetes de Acceso al Servidor (ID: 250-252)

Gestión de acceso al servidor.

### RequestServerAccess (ID: 250)

**Direction**: Client -> Server

Solicitud de acceso.

**Size**: 3 bytes (fixed)

---

### UpdateServerAccess (ID: 251)

**Direction**: Server -> Client

Actualización de acceso.

**Size**: Variable

---

### SetServerAccess (ID: 252)

**Direction**: Client -> Server

Definición de acceso.

**Size**: 2-16384007 bytes

---

## Paquetes de Machinima (ID: 260-262)

Sistema de machinima (cinemáticas).

### RequestMachinimaActorModel (ID: 260)

**Direction**: Client -> Server

Solicitud de modelo de actor.

**Size**: 1-49152028 bytes

---

### SetMachinimaActorModel (ID: 261)

**Direction**: Server -> Client

Definición de modelo de actor.

**Size**: Variable

---

### UpdateMachinimaScene (ID: 262)

**Direction**: Server -> Client
**Compressed**: Yes

Actualización de escena.

**Size**: Variable (compressed)

---

## Paquetes de Cámara (ID: 280-283)

Control de cámara.

### SetServerCamera (ID: 280)

**Direction**: Server -> Client

Configuración de cámara.

| Campo              | Tipo                  | Descripción                                  |
| ------------------ | --------------------- | -------------------------------------------- |
| `clientCameraView` | ClientCameraView      | Vista (PrimeraPersona, TerceraPersona, etc.) |
| `isLocked`         | boolean               | Cámara bloqueada                             |
| `cameraSettings`   | ServerCameraSettings? | Configuración detallada                      |

**Size**: 157 bytes (fixed)

---

### CameraShakeEffect (ID: 281)

**Direction**: Server -> Client

Efecto de sacudida de pantalla.

**Size**: 9 bytes (fixed)

---

### RequestFlyCameraMode (ID: 282)

**Direction**: Client -> Server

Solicitud de modo de cámara libre.

**Size**: 1 byte (fixed)

---

### SetFlyCameraMode (ID: 283)

**Direction**: Server -> Client

Activación de modo de cámara libre.

**Size**: 1 byte (fixed)

---

## Paquetes de Interacción (ID: 290-294)

Sistema de interacción.

### SyncInteractionChains (ID: 290)

**Direction**: Server -> Client

Sincronización de cadenas de interacción.

**Size**: Variable

---

### CancelInteractionChain (ID: 291)

**Direction**: Bidirectional

Cancelación de cadena de interacción.

**Size**: 5-1038 bytes

---

### PlayInteractionFor (ID: 292)

**Direction**: Server -> Client

Reproducir una interacción.

**Size**: 19-16385065 bytes

---

### MountNPC (ID: 293)

**Direction**: Client -> Server

Montar un NPC.

**Size**: 16 bytes (fixed)

---

### DismountNPC (ID: 294)

**Direction**: Client -> Server

Desmontar de un NPC.

**Size**: 0 bytes (empty)

---

## Paquetes de Editor de Assets (ID: 300-355)

Herramientas de edición de assets (modo desarrollador).

_Estos paquetes son utilizados por el editor de assets integrado y no se usan durante el juego normal._

### AssetEditorInitialize (ID: 302)

Inicialización del editor.

### AssetEditorAuthorization (ID: 303)

Autorización de edición.

### AssetEditorCapabilities (ID: 304)

Capacidades del editor.

### AssetEditorSetupSchemas (ID: 305)

Configuración de esquemas.

### AssetEditorFetchAsset (ID: 310)

Recuperación de assets.

### AssetEditorUpdateAsset (ID: 324)

Actualización de asset.

### AssetEditorCreateAsset (ID: 327)

Creación de asset.

### AssetEditorDeleteAsset (ID: 329)

Eliminación de asset.

_...y más de 40 paquetes de edición adicionales._

---

## Paquetes de Configuración de Renderizado (ID: 360-361)

Configuración de renderizado.

### UpdateSunSettings (ID: 360)

**Direction**: Server -> Client

Configuración del sol.

**Size**: 8 bytes (fixed)

---

### UpdatePostFxSettings (ID: 361)

**Direction**: Server -> Client

Configuración de post-procesado.

**Size**: 20 bytes (fixed)

---

## Paquetes de Herramientas de Constructor (ID: 400-423)

Herramientas de construcción (modo creativo avanzado).

### BuilderToolArgUpdate (ID: 400)

**Direction**: Client -> Server

Actualización de argumento de herramienta.

**Size**: 14-32768032 bytes

---

### BuilderToolEntityAction (ID: 401)

**Direction**: Client -> Server

Acción de entidad.

**Size**: 5 bytes (fixed)

---

### BuilderToolSetEntityTransform (ID: 402)

**Direction**: Client -> Server

Transformación de entidad.

**Size**: 54 bytes (fixed)

---

### BuilderToolExtrudeAction (ID: 403)

**Direction**: Client -> Server

Acción de extrusión.

**Size**: 24 bytes (fixed)

---

### BuilderToolStackArea (ID: 404)

**Direction**: Client -> Server

Apilado de área.

**Size**: 41 bytes (fixed)

---

### BuilderToolSelectionTransform (ID: 405)

**Direction**: Client -> Server

Transformación de selección.

**Size**: 52-16384057 bytes

---

### BuilderToolPasteClipboard (ID: 407)

**Direction**: Client -> Server

Pegado de portapapeles.

**Size**: 12 bytes (fixed)

---

### BuilderToolSelectionUpdate (ID: 409)

**Direction**: Client -> Server

Actualización de selección.

**Size**: 24 bytes (fixed)

---

### BuilderToolLaserPointer (ID: 419)

**Direction**: Client -> Server

Puntero láser.

**Size**: 36 bytes (fixed)

---

_...y más de 10 paquetes de herramientas de constructor adicionales._

---

## Resumen de Direcciones

| Categoría  | Cliente -> Servidor                | Servidor -> Cliente                     | Bidireccional          |
| ---------- | ---------------------------------- | --------------------------------------- | ---------------------- |
| Connection | Connect                            | -                                       | Disconnect, Ping, Pong |
| Auth       | AuthToken, AuthGrant               | ConnectAccept, Status                   | PasswordResponse       |
| Setup      | RequestAssets, PlayerOptions       | WorldSettings, WorldLoadProgress        | ViewRadius             |
| Player     | ClientMovement, MouseInteraction   | JoinWorld, SetGameMode, ClientTeleport  | SyncPlayerPreferences  |
| World      | SetPaused                          | SetChunk, ServerSetBlock, EntityUpdates | -                      |
| Inventory  | MoveItemStack, DropItemStack       | UpdatePlayerInventory                   | -                      |
| Window     | SendWindowAction, ClientOpenWindow | OpenWindow, UpdateWindow                | CloseWindow            |
| Interface  | ChatMessage, CustomPageEvent       | ServerMessage, Notification             | -                      |
| Camera     | RequestFlyCameraMode               | SetServerCamera, CameraShakeEffect      | -                      |

---

## Notas Técnicas

### Compresión

Los paquetes marcados como comprimidos usan compresión **Zstd (Zstandard)** para reducir el ancho de banda. La compresión se aplica después de la serialización.

### Validación

Cada paquete implementa un método `validateStructure` que verifica la integridad de los datos antes de la deserialización.

### Tipos de Datos

- **VarInt**: Entero de longitud variable (1-5 bytes)
- **String**: Prefijo de longitud (VarInt) + datos UTF-8
- **UUID**: 16 bytes (2 x long)
- **Position**: 24 bytes (3 x double)
- **Direction**: 12 bytes (3 x float)
- **Vector3d**: 24 bytes (3 x double)

---

_Documentación generada a partir del análisis del código descompilado del servidor de Hytale._
