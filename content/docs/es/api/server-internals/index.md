---
id: server-internals
title: Documentación Interna del Servidor Hytale
sidebar_label: Internos del Servidor
sidebar_position: 10
description: Documentación técnica v2 del servidor Hytale - Arquitectura, API, Paquetes y Sistemas Internos
---

# Documentación Interna del Servidor Hytale

<div className="version-badge">
  <span className="badge badge--warning">Versión 2.0 - Documentación Experimental</span>
</div>

:::warning Aviso de Precisión de la Documentación
Esta documentación se basa en **código fuente descompilado** y puede contener errores o inexactitudes. Si bien verificamos con el código real, alguna información puede estar incompleta, desactualizada o interpretada incorrectamente. **Siempre prueba tus implementaciones** y no confíes únicamente en esta documentación. ¿Encontraste un error? [Repórtalo en GitHub](https://github.com/timiliris/Hytale-Docs/issues) para ayudar a mejorar la calidad.
:::

:::info Documentación v2 - Verificada por Multi-Agente

Esta documentación fue generada utilizando un sistema de análisis multi-agente que:

- Extrae datos directamente del código fuente descompilado del servidor
- Verifica todos los hallazgos con referencias a archivos fuente y números de línea
- Incluye fragmentos de código reales de la base de código real
- Utiliza medidas anti-alucinación para evitar la confusión de patrones Minecraft/Bukkit

:::

## ¿Qué es esta documentación?

Esta documentación revela cómo funciona el servidor Hytale **bajo el capó**. Mientras que las herramientas oficiales de modding de Hytale proporcionan una interfaz amigable para crear contenido, entender los sistemas internos del servidor te da el poder para crear modificaciones más sofisticadas y eficientes.

## Qué hay de nuevo en la v2

- **Sistema de Eventos Exacto**: Más de 50 eventos documentados con interfaces reales (IEvent, IAsyncEvent, ICancellable)
- **Sistema de Comandos Completo**: Jerarquía AbstractCommand, tipos de argumentos, métodos de registro
- **Protocolo de Red**: Protocolo QUIC/UDP, 268 paquetes, documentación del flujo de conexión
- **API de Plugins**: Métodos de ciclo de vida precisos (preLoad, setup, start, shutdown), registros
- **Referencias de Fuente**: Cada clase y método incluye rutas de archivos fuente y números de línea
- **Ejemplos de Código**: Código real de BlockTickPlugin, BlockSpawnerPlugin y otros plugins integrados

### ¿Para quién es esto?

- **Desarrolladores de plugins** que quieren extender Hytale más allá de lo posible con herramientas visuales
- **Creadores de mods** que necesitan control detallado sobre las mecánicas del juego
- **Entusiastas técnicos** curiosos sobre cómo está arquitectado un servidor de juego moderno
- **Creadores de contenido** que quieren entender el "por qué" detrás de los comportamientos del juego

### ¿Por qué aprender los internos del servidor?

Piensa en el servidor Hytale como el motor de un coche. Puedes conducir un coche sin saber cómo funciona el motor, pero un mecánico que entiende el motor puede:

- Diagnosticar problemas más rápido
- Optimizar el rendimiento
- Añadir modificaciones personalizadas
- Empujar los límites de lo posible

De manera similar, entender los internos del servidor te permite:

- **Depurar problemas** rastreando exactamente qué sucede cuando un jugador coloca un bloque o recibe daño
- **Optimizar el rendimiento** sabiendo qué sistemas son costosos y cómo minimizar su impacto
- **Crear jugabilidad única** enganchando sistemas que no están expuestos a través de APIs normales
- **Evitar errores comunes** entendiendo por qué ciertos patrones funcionan y otros no

## Sobre esta Documentación

Esta sección documenta los **mecanismos internos** del servidor Hytale, destinada a desarrolladores de plugins avanzados que quieren entender el funcionamiento interno del servidor.

### Fuentes

- Código fuente descompilado del servidor Hytale (Versión de Acceso Anticipado)
- Análisis automatizado con verificación manual
- Paquete principal: `com.hypixel.hytale`

---

## Arquitectura del Servidor

El servidor Hytale está construido sobre una arquitectura modular basada en:

| Componente                                  | Descripción                                         |
| ------------------------------------------- | --------------------------------------------------- |
| **ECS (Sistema de Componentes de Entidad)** | Sistema de gestión de entidades de alto rendimiento |
| **EventBus**                                | Bus de eventos síncrono y asíncrono                 |
| **PluginManager**                           | Gestor de plugins con ciclo de vida completo        |
| **Protocolo QUIC**                          | Comunicación de red vía Netty + QUIC (puerto 5520)  |

---

## Secciones de la Documentación

### Sistema de Plugins

Todo lo que necesitas para crear plugins Java para Hytale.

| Guía                                  | Descripción                                |
| ------------------------------------- | ------------------------------------------ |
| [**Sistema de Plugins**](./plugins)   | Arquitectura, ciclo de vida, PluginManager |
| [**Sistema de Eventos**](./events)    | EventBus, prioridades, eventos cancelables |
| [**Sistema de Comandos**](./commands) | CommandManager, creando comandos           |

### Arquitectura Interna

Entendimiento profundo de los sistemas internos del servidor.

| Guía                             | Descripción                                               |
| -------------------------------- | --------------------------------------------------------- |
| [**Sistema ECS**](./ecs)         | Sistema de Componentes de Entidad, Componentes, Consultas |
| [**Tipos de Datos**](./types)    | Tipo de Bloque, Objetos, Efectos de Entidad, enums        |
| [**Paquetes de Red**](./packets) | Protocolo, más de 200 paquetes documentados               |

---

## Estadísticas de la Documentación

| Métrica                  | Valor |
| ------------------------ | ----- |
| Archivos Java analizados | 5,218 |
| Paquetes documentados    | 200+  |
| Comandos documentados    | 50+   |
| Eventos documentados     | 30+   |
| Componentes ECS          | 20+   |

---

## Información Técnica

### Puerto Predeterminado

```
5520 (UDP - QUIC)
```

### Paquete Principal

```
com.hypixel.hytale
```

### Clase Principal

```java
com.hypixel.hytale.server.core.HytaleServer
```

---

## Empezando

<div className="doc-card-grid">
  <div className="doc-card">
    <h3>Crea un Plugin</h3>
    <p>Aprende cómo crear tu primer plugin Java para Hytale.</p>
    <a href="./plugins">Ver documentación →</a>
  </div>
  <div className="doc-card">
    <h3>Escucha Eventos</h3>
    <p>Reacciona a acciones del jugador y servidor.</p>
    <a href="./events">Ver documentación →</a>
  </div>
  <div className="doc-card">
    <h3>Crea Comandos</h3>
    <p>Añade comandos personalizados a tu servidor.</p>
    <a href="./commands">Ver documentación →</a>
  </div>
  <div className="doc-card">
    <h3>Entiende ECS</h3>
    <p>Domina el sistema de componentes para entidades.</p>
    <a href="./ecs">Ver documentación →</a>
  </div>
</div>

---

## Contribuyendo

Esta documentación es de código abierto. Si encuentras errores o quieres mejorar el contenido:

- Abre un issue en GitHub
- Envía un pull request
- Únete al Discord de la comunidad

---

:::info Verificación de Código
Esta documentación ha sido verificada con el código fuente descompilado. Consulta el [informe de verificación](/docs/api/server-internals/verification) para más detalles.
:::
