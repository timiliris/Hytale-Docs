---
id: add-world-event
title: AddWorldEvent
sidebar_label: AddWorldEvent
description: Evenement déclenché lors de l'ajout d'un nouveau monde au serveur
---

# AddWorldEvent

L'événement `AddWorldEvent` est déclenché lorsqu'un nouveau monde est en cours d'ajout a l'univers du serveur. Cet événement permet aux plugins d'intercepter et potentiellement d'annuler l'ajout de mondes, offrant ainsi une logique personnalisee de gestion des mondes.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.universe.world.events.AddWorldEvent` |
| **Classe parente** | `WorldEvent` |
| **Implemente** | `ICancellable` |
| **Annulable** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/universe/world/events/AddWorldEvent.java:7` |

## Declaration

```java
public class AddWorldEvent extends WorldEvent implements ICancellable {
   private boolean cancelled = false;

   public AddWorldEvent(@Nonnull World world) {
      super(world);
   }

   @Nonnull
   @Override
   public String toString() {
      return "AddWorldEvent{cancelled=" + this.cancelled + "} " + super.toString();
   }

   @Override
   public boolean isCancelled() {
      return this.cancelled;
   }

   @Override
   public void setCancelled(boolean cancelled) {
      this.cancelled = cancelled;
   }
}
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `cancelled` | `boolean` | `isCancelled()` | Indique si l'événement a ete annule |

## Champs herites

De `WorldEvent` :

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `world` | `World` | `getWorld()` | Le monde en cours d'ajout au serveur |

## Méthodes

### isCancelled()

```java
public boolean isCancelled()
```

Retourne si l'événement a ete annule.

**Retourne :** `boolean` - `true` si l'ajout du monde a ete annule, `false` sinon

### setCancelled(boolean)

```java
public void setCancelled(boolean cancelled)
```

Definit si l'événement doit etre annule. Lorsqu'il est annule, le monde ne sera pas ajoute au serveur.

**Parametres :**
- `cancelled` - `true` pour annuler l'ajout du monde, `false` pour l'autoriser

### getWorld()

```java
public World getWorld()
```

Hérité de `WorldEvent`. Retourne le monde qui est en cours d'ajout.

**Retourne :** `World` - L'instance du monde en cours d'ajout au serveur

## Exemple d'utilisation

> **Testé** - Ce code a été vérifié avec un plugin fonctionnel.

Puisque `AddWorldEvent` étend `WorldEvent` qui a un type de clé non-Void, vous devez utiliser `registerGlobal()` pour capturer tous les événements de monde indépendamment de leur clé.

```java
import com.hypixel.hytale.server.core.universe.world.events.AddWorldEvent;
import com.hypixel.hytale.event.EventRegistry;

// Enregistrer un listener global pour contrôler les ajouts de mondes
eventBus.registerGlobal(AddWorldEvent.class, event -> {
    World world = event.getWorld();
    String worldName = world != null ? world.getName() : "Unknown";

    // Journaliser les ajouts de mondes
    logger.info("Monde en cours d'ajout: " + worldName);

    // Exemple: Empêcher l'ajout de mondes avec certains noms
    if (worldName.startsWith("restricted_")) {
        event.setCancelled(true);
        logger.info("Ajout bloqué du monde restreint: " + worldName);
    }
});
```

**Important :** Utiliser `register()` au lieu de `registerGlobal()` ne fonctionnera pas pour cet événement car il a un type de clé non-Void.

## Quand cet événement se déclenché

L'événement `AddWorldEvent` est dispatche lorsque :

1. Un nouveau monde est en cours d'enregistrement aupres du systeme d'univers du serveur
2. Pendant le demarrage du serveur lorsque les mondes configures sont charges
3. Lorsque des plugins creent et ajoutent programmatiquement de nouveaux mondes
4. Lorsque la generation dynamique de mondes cree une nouvelle instance de monde

L'événement se déclenché **avant** que le monde soit complètement ajoute a l'univers, permettant aux handlers d'annuler l'operation si necessaire.

## Comportement de l'annulation

Lorsque l'événement est annule :
- Le monde ne sera pas ajoute a la liste des mondes du serveur
- Le monde ne sera pas accessible aux joueurs ou aux autres systemes
- Les ressources associees peuvent etre nettoyees selon l'implementation

## Événements associes

- [RemoveWorldEvent](./remove-world-event.md) - Déclenché lorsqu'un monde est en cours de suppression
- [StartWorldEvent](./start-world-event.md) - Déclenché lorsqu'un monde demarre apres avoir ete ajoute
- [AllWorldsLoadedEvent](./all-worlds-loaded-event.md) - Déclenché lorsque tous les mondes configures ont ete charges

## Référence source

- **Definition de l'événement :** `decompiled/com/hypixel/hytale/server/core/universe/world/events/AddWorldEvent.java`
- **Classe parente :** `decompiled/com/hypixel/hytale/server/core/universe/world/events/WorldEvent.java`
- **Interface Cancellable :** `decompiled/com/hypixel/hytale/event/ICancellable.java`
