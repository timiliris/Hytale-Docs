---
id: overview
title: Resumen de la Referencia de la API
sidebar_label: Resumen
sidebar_position: 1
description: Documentación de la API de Hytale para desarrolladores
---

# Resumen de la Referencia de la API

Esta sección documenta las APIs de Hytale disponibles para los desarrolladores.

## Documentación Interna del Servidor

:::tip Nuevo - Documentación v2
La versión 2 de la documentación interna del servidor ya está disponible, con documentación verificada por múltiples agentes para una mayor precisión y completitud.
:::

La documentación cubre los sistemas internos del servidor de Hytale:

| Sección | Descripción |
|---------|-------------|
| [**Sistema de Plugins**](/docs/api/server-internals/plugins) | Arquitectura, ciclo de vida, PluginManager |
| [**Sistema de Eventos**](/docs/api/server-internals/events) | EventBus, prioridades, eventos cancelables |
| [**Sistema de Comandos**](/docs/api/server-internals/commands) | CommandManager, creación de comandos |
| [**Sistema ECS**](/docs/api/server-internals/ecs) | Sistema Completo de Componentes de Entidad |
| [**Tipos de Datos**](/docs/api/server-internals/types) | BlockType, Items, EntityEffect |
| [**Paquetes de Red**](/docs/api/server-internals/packets) | Más de 200 paquetes documentados |

[Explora la documentación interna →](/docs/api/server-internals)

---

## API Oficial de Hytale

La API oficial de Hytale proporciona puntos finales para acceder a datos públicos del juego.

### URL Base

```
https://hytale.com/api
```

### Puntos Finales Disponibles

| Punto Final | Método | Descripción |
|----------|--------|-------------|
| `/blog/post/published` | GET | Listar publicaciones de blog publicadas |
| `/blog/post/slug/:slug` | GET | Obtener publicación por slug |
| `/jobs` | GET | Listar ofertas de trabajo |

[Referencia Completa de Puntos Finales →](/docs/api/official/endpoints)

## SDKs de la Comunidad

- [SDK de Node.js](/docs/api/sdks/javascript)
- [SDK de PHP](/docs/api/sdks/php)

## Primeros Pasos

Explora la documentación interna del servidor para comenzar a desarrollar plugins de Hytale.