---
id: modules
title: Módulos del Servidor
sidebar_label: Módulos
sidebar_position: 2
description: Documentación del sistema de módulos internos del servidor de Hytale
---

# Módulos del Servidor

El servidor de Hytale está construido sobre una arquitectura modular. Cada módulo maneja un dominio específico de funcionalidad del juego y puede ser accedido a través de la API de plugins.

## Módulos Disponibles

| Módulo                                                                  | Descripción                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------ |
| [Entity Stats](/docs/api/server-internals/modules/entity-stats)         | Gestión de salud, maná y estadísticas personalizadas   |
| [Access Control](/docs/api/server-internals/modules/access-control)     | Permisos y restricciones de acceso                     |
| [Damage System](/docs/api/server-internals/modules/damage-system)       | Cálculo y procesamiento de daño de combate             |
| [Interactions](/docs/api/server-internals/modules/interactions)         | Manejo de interacciones con entidades y bloques        |
| [Time System](/docs/api/server-internals/modules/time-system)           | Ciclo día/noche y gestión del tiempo                   |
| [Projectiles](/docs/api/server-internals/modules/projectiles)           | Física y comportamiento de proyectiles                 |
| [Block Health](/docs/api/server-internals/modules/block-health)         | Daño y destrucción de bloques                          |
| [Collision System](/docs/api/server-internals/modules/collision-system) | Física y detección de colisiones                       |
| [Stamina System](/docs/api/server-internals/modules/stamina-system)     | Energía y agotamiento del jugador                      |
| [Prefab System](/docs/api/server-internals/modules/prefab-system)       | Generación y gestión de estructuras                    |
| [Entity UI](/docs/api/server-internals/modules/entity-ui)               | Elementos de UI en el mundo (barras de salud, nombres) |
| [Effects System](/docs/api/server-internals/modules/effects-system)     | Efectos de estado y buffs/debuffs                      |
| [Audio System](/docs/api/server-internals/modules/audio-system)         | Gestión de sonido y música                             |
| [Entity Spawning](/docs/api/server-internals/modules/entity-spawning)   | Reglas y sistemas de generación de mobs                |
| [Crafting System](/docs/api/server-internals/modules/crafting-system)   | Recetas de crafteo y mesas de trabajo                  |
| [NPC System](/docs/api/server-internals/modules/npc-system)             | Comportamiento e IA de NPCs                            |

## Arquitectura de Módulos

Cada módulo sigue un patrón consistente:

```java
public interface Module {
    // Obtener el tipo de componente del módulo para acceso ECS
    ComponentType<?> getComponentType();

    // Inicialización del módulo
    void onEnable();
    void onDisable();
}
```

## Acceder a Módulos

Los módulos se acceden a través de la instancia `Server`:

```java
@Override
public void onEnable(PluginContext context) {
    Server server = context.getServer();

    // Acceder al módulo de daño
    DamageModule damageModule = server.getModule(DamageModule.class);

    // Acceder al módulo de tiempo
    TimeModule timeModule = server.getModule(TimeModule.class);
}
```
