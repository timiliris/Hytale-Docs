---
id: start-world-event
title: StartWorldEvent
sidebar_label: StartWorldEvent
description: Evenement déclenché lorsqu'un monde a ete initialise et demarre
---

# StartWorldEvent

L'événement `StartWorldEvent` est déclenché lorsqu'un monde a ete initialise et est en cours de demarrage. Cet événement signale que le monde est pret a etre utilise et permet aux plugins d'effectuer des taches d'initialisation spécifiques au monde.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.universe.world.events.StartWorldEvent` |
| **Classe parente** | `WorldEvent` |
| **Annulable** | Non |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/StartWorldEvent.java:6` |

## Declaration

```java
public class StartWorldEvent extends WorldEvent {
   public StartWorldEvent(@Nonnull World world) {
      super(world);
   }

   @Nonnull
   @Override
   public String toString() {
      return "StartWorldEvent{} " + super.toString();
   }
}
```

## Champs

Cet événement ne definit aucun champ supplementaire au-dela de ceux hérités de `WorldEvent`.

## Champs hérités

De `WorldEvent` :

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `world` | `World` | `getWorld()` | Le monde qui a demarre |

## Méthodes

### getWorld()

```java
public World getWorld()
```

Hérité de `WorldEvent`. Retourne le monde qui a demarre.

**Retourne :** `World` - L'instance du monde qui a termine son processus de demarrage

## Exemple d'utilisation

> **Testé** - Ce code a été vérifié avec un plugin fonctionnel.

Puisque `StartWorldEvent` étend `WorldEvent` qui a un type de clé non-Void, vous devez utiliser `registerGlobal()` pour capturer tous les événements de monde indépendamment de leur clé.

```java
import com.hypixel.hytale.server.core.universe.world.events.StartWorldEvent;
import com.hypixel.hytale.event.EventRegistry;

// Enregistrer un listener global pour effectuer des actions lorsque les mondes démarrent
eventBus.registerGlobal(StartWorldEvent.class, event -> {
    World world = event.getWorld();
    String worldName = world != null ? world.getName() : "Unknown";

    // Journaliser le démarrage du monde
    logger.info("Monde démarré: " + worldName);

    // Exemple: Initialiser les fonctionnalités spécifiques au monde
    if ("spawn".equals(worldName)) {
        setupSpawnWorld(world);
    } else if (worldName.startsWith("dungeon_")) {
        setupDungeonWorld(world);
    }
});
```

**Important :** Utiliser `register()` au lieu de `registerGlobal()` ne fonctionnera pas pour cet événement car il a un type de clé non-Void.

## Quand cet événement se déclenché

L'événement `StartWorldEvent` est dispatche lorsque :

1. Un monde a ete ajoute avec succès a l'univers et demarre maintenant
2. Le processus d'initialisation du monde est termine
3. Le monde est pret a accepter des joueurs et a traiter la logique de jeu
4. Apres que `AddWorldEvent` a ete traite et non annule

L'événement se déclenché **apres** que le monde a ete complètement initialise, ce qui signifie :
- Les chunks du monde peuvent etre charges
- Les entites peuvent etre generees
- Les joueurs peuvent etre teleportes vers le monde
- Les systemes spécifiques au monde sont operationnels

## Cycle de vie de l'événement

Les événements typiques du cycle de vie d'un monde suivent cet ordre :

1. `AddWorldEvent` - Le monde est en cours d'ajout (annulable)
2. `StartWorldEvent` - Le monde a demarre (non annulable)
3. (Le monde est actif et operationnel)
4. `RemoveWorldEvent` - Le monde est en cours de suppression (annulable)

## Événements associes

- [AddWorldEvent](./add-world-event.md) - Déclenché avant que le monde soit ajoute (annulable)
- [RemoveWorldEvent](./remove-world-event.md) - Déclenché lorsqu'un monde est en cours de suppression
- [AllWorldsLoadedEvent](./all-worlds-loaded-event.md) - Déclenché lorsque tous les mondes configures ont ete charges

## Cas d'utilisation courants

### Initialisation spécifique au monde

```java
eventBus.register(StartWorldEvent.class, event -> {
    World world = event.getWorld();

    // Initialiser les bordures de monde personnalisees
    setWorldBorder(world, 10000);

    // Definir les regles de jeu spécifiques au monde
    applyWorldRules(world);

    // Enregistrer les handlers d'événements spécifiques au monde
    registerWorldHandlers(world);
});
```

### Journalisation et surveillance

```java
eventBus.register(EventPriority.FIRST, StartWorldEvent.class, event -> {
    World world = event.getWorld();

    // Suivre les metriques de demarrage du monde
    long startTime = System.currentTimeMillis();
    metrics.recordWorldStart(world.getName(), startTime);

    // Journaliser pour la surveillance
    logger.info("Le monde '{}' a demarre a {}", world.getName(), startTime);
});
```

### Gestion dynamique des mondes

```java
eventBus.register(StartWorldEvent.class, event -> {
    World world = event.getWorld();

    // Si c'est un monde temporaire/d'instance, planifier le nettoyage
    if (world.getName().startsWith("instance_")) {
        scheduleWorldCleanup(world, 30, TimeUnit.MINUTES);
    }
});
```

## Référence source

- **Definition de l'événement :** `decompiled/com/hypixel/hytale/server/core/universe/world/events/StartWorldEvent.java`
- **Classe parente :** `decompiled/com/hypixel/hytale/server/core/universe/world/events/WorldEvent.java`
