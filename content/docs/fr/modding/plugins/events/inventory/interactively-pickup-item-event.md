---
id: interactively-pickup-item-event
title: InteractivelyPickupItemEvent
sidebar_label: InteractivelyPickupItemEvent
sidebar_position: 3
---

# InteractivelyPickupItemEvent

Déclenché lorsqu'un joueur ramasse interactivement un objet du monde. Cet événement permet aux plugins de modifier, remplacer ou empêcher les ramassages d'objets qui se produisent par interaction directe du joueur (par opposition a la collecte automatique).

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.ecs.InteractivelyPickupItemEvent` |
| **Classe parente** | `CancellableEcsEvent` |
| **Annulable** | Oui |
| **Evenement ECS** | Oui |
| **Fichier source** | `com/hypixel/hytale/server/core/event/events/ecs/InteractivelyPickupItemEvent.java:7` |

## Declaration

```java
public class InteractivelyPickupItemEvent extends CancellableEcsEvent {
    @Nonnull
    private ItemStack itemStack;

    // Constructeur et methodes...
}
```

## Champs

| Champ | Type | Ligne | Description |
|-------|------|-------|-------------|
| `itemStack` | `ItemStack` | 9 | La pile d'objets ramassee (modifiable via le setter) |

## Méthodes

| Méthode | Type de retour | Ligne | Description |
|---------|----------------|-------|-------------|
| `getItemStack()` | `@Nonnull ItemStack` | 16 | Obtient la pile d'objets ramassee |
| `setItemStack(@Nonnull ItemStack)` | `void` | 20 | Remplace la pile d'objets (permet la modification) |
| `isCancelled()` | `boolean` | - | Retourne si l'événement a ete annule |
| `setCancelled(boolean)` | `void` | - | Definit l'etat d'annulation de l'événement |

## Exemple d'utilisation

> **Testé** - Ce code a été vérifié avec un plugin fonctionnel.

**Important :** Les événements ECS nécessitent une classe `EntityEventSystem` dédiée enregistrée via `getEntityStoreRegistry().registerSystem()`. Ils n'utilisent **pas** la méthode standard `EventBus.register()`.

### Étape 1 : Créer l'EntityEventSystem

```java
package com.example.myplugin.systems;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.InteractivelyPickupItemEvent;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class ItemPickupSystem extends EntityEventSystem<EntityStore, InteractivelyPickupItemEvent> {

    public ItemPickupSystem() {
        super(InteractivelyPickupItemEvent.class);
    }

    @Override
    public void handle(
            int index,
            @Nonnull ArchetypeChunk<EntityStore> archetypeChunk,
            @Nonnull Store<EntityStore> store,
            @Nonnull CommandBuffer<EntityStore> commandBuffer,
            @Nonnull InteractivelyPickupItemEvent event
    ) {
        String itemInfo = event.getItemStack() != null ? event.getItemStack().toString() : "Unknown";

        System.out.println("Objet ramassé: " + itemInfo);

        // Exemple: Empêcher de ramasser des objets restreints
        // if (isRestrictedItem(event.getItemStack())) {
        //     event.setCancelled(true);
        // }

        // Exemple: Modifier l'objet ramassé
        // event.setItemStack(modifiedItemStack);
    }

    @Nullable
    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

### Étape 2 : Enregistrer le système dans votre plugin

```java
public class MyPlugin extends JavaPlugin {

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getEntityStoreRegistry().registerSystem(new ItemPickupSystem());
    }
}
```

### Modifier les objets ramasses

```java
// Exemple: Doubler tous les objets ramasses (bonus de ramassage)
getServer().getEventBus().register(
    EventPriority.NORMAL,
    InteractivelyPickupItemEvent.class,
    event -> {
        ItemStack original = event.getItemStack();

        // Creer une nouvelle pile d'objets avec le double de la quantite
        // ItemStack doubled = original.copy();
        // doubled.setAmount(original.getAmount() * 2);
        // event.setItemStack(doubled);

        getLogger().info("Bonus de ramassage applique!");
    }
);
```

### Filtrer les ramassages

```java
// Exemple: Empecher de ramasser certains objets
getServer().getEventBus().register(
    EventPriority.FIRST,
    InteractivelyPickupItemEvent.class,
    event -> {
        ItemStack item = event.getItemStack();

        // Verifier si c'est un objet restreint
        // if (isRestrictedItem(item)) {
        //     event.setCancelled(true);
        //     // L'objet reste dans le monde
        // }
    }
);
```

### Journaliser les ramassages

```java
// Exemple: Journaliser tous les ramassages d'objets pour l'analytique
getServer().getEventBus().register(
    EventPriority.LAST,
    InteractivelyPickupItemEvent.class,
    event -> {
        if (!event.isCancelled()) {
            ItemStack item = event.getItemStack();
            // Journaliser le ramassage
            // analyticsLogger.logPickup(player, item);
        }
    }
);
```

## Quand cet événement se déclenché

Le `InteractivelyPickupItemEvent` se déclenché dans les scenarios suivants :

1. **Ramassage direct** : Lorsqu'un joueur marche sur une entite d'objet et la collecte
2. **Collecte manuelle** : Lorsqu'un joueur interagit explicitement pour ramasser un objet
3. **Effets d'aimant** : Lorsque les objets sont attires vers le joueur par des mecaniques de jeu
4. **Collecte de butin** : Lors du ramassage de drops d'entites vaincues
5. **Objets au sol** : Lors de la collecte d'objets qui ont ete laches dans le monde

**Note** : Cet événement couvre specifiquement les ramassages **interactifs**. Les insertions programmatiques dans l'inventaire peuvent utiliser differents chemins d'événements.

## Comportement d'annulation

Lorsque cet événement est annule :

- L'objet ne sera **pas** ajoute a l'inventaire du joueur
- L'entite de l'objet **reste dans le monde** a sa position actuelle
- Le joueur ne recoit aucune notification de l'echec du ramassage
- Les autres joueurs peuvent toujours tenter de ramasser l'objet

```java
// Exemple: Systeme de propriete d'objet - seul le proprietaire original peut ramasser
getServer().getEventBus().register(
    EventPriority.FIRST,
    InteractivelyPickupItemEvent.class,
    event -> {
        ItemStack item = event.getItemStack();

        // Verifier si l'objet a des metadonnees de proprietaire et si le joueur n'est pas le proprietaire
        // if (hasOwner(item) && !isOwner(player, item)) {
        //     event.setCancelled(true);
        //     // Optionnellement envoyer le message "Cet objet ne vous appartient pas"
        // }
    }
);
```

## Modification d'objet

La methode `setItemStack()` vous permet de modifier ce que le joueur recoit reellement :

```java
// Exemple: Objets bonus aleatoires
getServer().getEventBus().register(
    InteractivelyPickupItemEvent.class,
    event -> {
        ItemStack original = event.getItemStack();

        // 10% de chance de bonus
        if (Math.random() < 0.1) {
            // Modifier l'objet ou ajouter un bonus
            // ItemStack bonus = createBonusItem(original);
            // event.setItemStack(bonus);
        }
    }
);
```

**Important** : Lors de l'utilisation de `setItemStack()` :
- Le nouveau `ItemStack` ne doit pas etre null (marque `@Nonnull`)
- L'entite de l'objet original est consommee quel que soit ce que vous definissez
- Vous pouvez changer le type d'objet, la quantite, les metadonnees ou toute autre propriete

## Événements lies

- **[DropItemEvent](./drop-item-event.md)** - Déclenché lorsqu'un objet est lache (action opposee)
- **[SwitchActiveSlotEvent](./switch-active-slot-event.md)** - Déclenché lors du changement d'emplacement de la barre d'action
- **LivingEntityInventoryChangeEvent** - Déclenché lors de tout changement d'inventaire
- **[CraftRecipeEvent](./craft-recipe-event.md)** - Déclenché lorsque des objets sont crees via la fabrication

## Référence source

- **Classe** : `com.hypixel.hytale.server.core.event.events.ecs.InteractivelyPickupItemEvent`
- **Source** : `decompiled/com/hypixel/hytale/server/core/event/events/ecs/InteractivelyPickupItemEvent.java`
- **Ligne** : 7
- **Parent** : `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
