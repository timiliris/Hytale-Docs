---
id: drop-item-event
title: DropItemEvent
sidebar_label: DropItemEvent
sidebar_position: 1
---

# DropItemEvent

Déclenché lorsqu'une entite lache un objet dans le monde. Cet événement prend en charge a la fois les lachages programmatiques (par exemple, les objets ejectes d'un conteneur) et les demandes de lachage initiees par le joueur depuis son inventaire.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent` |
| **Classe parente** | `CancellableEcsEvent` |
| **Annulable** | Oui |
| **Evenement ECS** | Oui |
| **Fichier source** | `com/hypixel/hytale/server/core/event/events/ecs/DropItemEvent.java:7` |

## Declaration

```java
public class DropItemEvent extends CancellableEcsEvent {
    // Contient les classes internes Drop et PlayerRequest
}
```

## Méthodes heritees

De `CancellableEcsEvent` :

| Méthode | Type de retour | Description |
|---------|----------------|-------------|
| `isCancelled()` | `boolean` | Retourne si l'événement a ete annule |
| `setCancelled(boolean)` | `void` | Definit l'etat d'annulation de l'événement |

## Classes internes

### DropItemEvent.Drop

Represente le lachage d'objet reel avec la pile d'objets et la velocite de lancer. Cette classe interne est utilisee lorsqu'un objet est physiquement lache dans le monde.

**Source :** Ligne 11

| Champ | Type | Accesseur | Mutateur | Description |
|-------|------|-----------|----------|-------------|
| `itemStack` | `ItemStack` | `getItemStack()` | `setItemStack(ItemStack)` | La pile d'objets lachee |
| `throwSpeed` | `float` | `getThrowSpeed()` | `setThrowSpeed(float)` | La velocite a laquelle l'objet est lance |

```java
public static final class Drop extends DropItemEvent {
    @Nonnull
    private ItemStack itemStack;
    private float throwSpeed;

    public Drop(@Nonnull ItemStack itemStack, float throwSpeed) {
        this.itemStack = itemStack;
        this.throwSpeed = throwSpeed;
    }

    @Nonnull
    public ItemStack getItemStack() {
        return this.itemStack;
    }

    public void setItemStack(@Nonnull ItemStack itemStack) {
        this.itemStack = itemStack;
    }

    public float getThrowSpeed() {
        return this.throwSpeed;
    }

    public void setThrowSpeed(float throwSpeed) {
        this.throwSpeed = throwSpeed;
    }
}
```

### DropItemEvent.PlayerRequest

Represente la demande d'un joueur de lacher un objet depuis un emplacement d'inventaire specifique. Cette classe interne suit la section d'inventaire et l'emplacement depuis lesquels le joueur lache l'objet.

**Source :** Ligne 39

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `inventorySectionId` | `int` | `getInventorySectionId()` | L'ID de la section d'inventaire (par exemple, barre d'action, inventaire principal) |
| `slotId` | `short` | `getSlotId()` | L'index de l'emplacement specifique dans la section d'inventaire |

```java
public static final class PlayerRequest extends DropItemEvent {
    private final int inventorySectionId;
    private final short slotId;

    public PlayerRequest(int inventorySectionId, short slotId) {
        this.inventorySectionId = inventorySectionId;
        this.slotId = slotId;
    }

    public int getInventorySectionId() {
        return this.inventorySectionId;
    }

    public short getSlotId() {
        return this.slotId;
    }
}
```

## Exemple d'utilisation

```java
import com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent;
import com.hypixel.hytale.event.EventPriority;

public class ItemDropListener extends PluginBase {

    @Override
    public void onEnable() {
        // S'enregistrer pour gerer les événements de lachage d'objets
        getServer().getEventBus().register(
            EventPriority.NORMAL,
            DropItemEvent.class,
            this::onItemDrop
        );
    }

    private void onItemDrop(DropItemEvent event) {
        // Verifier si c'est un lachage initie par le joueur
        // Le contexte de l'événement determine si les donnees Drop ou PlayerRequest sont disponibles

        if (event.isCancelled()) {
            return;
        }

        // Exemple: Empecher de lacher des objets dans certaines zones
        // (Vous devriez obtenir la position de l'entite depuis le contexte ECS)

        // Annuler le lachage si necessaire
        // event.setCancelled(true);
    }
}
```

### Gestion de la classe interne Drop

```java
// Lors du travail avec la classe interne Drop
DropItemEvent.Drop dropInfo = new DropItemEvent.Drop(itemStack, 0.5f);

// Acceder aux proprietes du lachage
ItemStack dropped = dropInfo.getItemStack();
float velocity = dropInfo.getThrowSpeed();

getLogger().info("Lachage de " + dropped.getAmount() + " objets avec une velocite de " + velocity);
```

### Gestion de la classe interne PlayerRequest

```java
// Lors du travail avec la classe interne PlayerRequest
DropItemEvent.PlayerRequest request = new DropItemEvent.PlayerRequest(0, (short) 5);

// Acceder aux proprietes de la demande
int section = request.getInventorySectionId();
short slot = request.getSlotId();

getLogger().info("Le joueur lache depuis la section " + section + ", emplacement " + slot);
```

## Quand cet événement se déclenché

Le `DropItemEvent` se déclenché dans les scenarios suivants :

1. **Demande de lachage par le joueur** : Lorsqu'un joueur appuie sur la touche de lachage (généralement Q) pour lacher un objet de son inventaire
2. **Debordement d'inventaire** : Lorsque les objets ne peuvent pas tenir dans un inventaire et sont ejectes dans le monde
3. **Destruction de conteneur** : Lorsqu'un bloc conteneur est casse et que son contenu est lache
4. **Mort d'entite** : Lorsqu'une entite meurt et lache le contenu de son inventaire
5. **Lachages programmatiques** : Lorsque la logique du jeu ou des scripts initient un lachage d'objet

## Comportement d'annulation

Lorsque cet événement est annule :

- L'objet ne sera **pas** lache dans le monde
- Pour les lachages inities par le joueur, l'objet reste dans l'inventaire du joueur
- Pour les lachages programmatiques, le code appelant doit gerer l'annulation de maniere appropriee
- Aucune entite d'objet ne sera generee dans le monde

```java
// Exemple: Empecher de lacher des objets rares
getServer().getEventBus().register(
    EventPriority.FIRST,
    DropItemEvent.class,
    event -> {
        // Acceder aux informations de lachage via le contexte ECS
        // Si l'objet est un objet rare/precieux, empecher le lachage

        // event.setCancelled(true);
        // Optionnellement notifier le joueur
    }
);
```

## Événements lies

- **[InteractivelyPickupItemEvent](./interactively-pickup-item-event.md)** - Déclenché lorsqu'un joueur ramasse un objet du monde
- **[SwitchActiveSlotEvent](./switch-active-slot-event.md)** - Déclenché lors du changement de l'emplacement actif de la barre d'action
- **[CraftRecipeEvent](./craft-recipe-event.md)** - Déclenché lors de la fabrication d'objets
- **LivingEntityInventoryChangeEvent** - Déclenché lors de tout changement d'inventaire

## Référence source

- **Classe** : `com.hypixel.hytale.server.core.event.events.ecs.DropItemEvent`
- **Source** : `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DropItemEvent.java`
- **Ligne** : 7
- **Parent** : `CancellableEcsEvent` (`com.hypixel.hytale.component.system.CancellableEcsEvent`)
