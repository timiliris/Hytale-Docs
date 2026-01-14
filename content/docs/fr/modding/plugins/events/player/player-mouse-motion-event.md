---
id: player-mouse-motion-event
title: PlayerMouseMotionEvent
sidebar_label: PlayerMouseMotionEvent
---

# PlayerMouseMotionEvent

Déclenché lorsqu'un joueur deplace sa souris. C'est un événement annulable qui fournit des informations sur le mouvement de la souris, incluant la position actuelle a l'ecran et les blocs ou entites sous le curseur.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.player.PlayerMouseMotionEvent` |
| **Classe parente** | `PlayerEvent<Void>` |
| **Annulable** | Oui |
| **Asynchrone** | Non |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerMouseMotionEvent.java:14` |

## Declaration

```java
public class PlayerMouseMotionEvent extends PlayerEvent<Void> implements ICancellable {
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `player` | `Player` | `getPlayer()` | L'objet joueur (hérité de PlayerEvent) |
| `clientUseTime` | `long` | `getClientUseTime()` | Horodatage cote client de l'événement de mouvement |
| `itemInHand` | `Item` | `getItemInHand()` | L'objet que le joueur tient en main |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | La position du bloc sous le curseur (si applicable) |
| `targetEntity` | `Entity` | `getTargetEntity()` | L'entite sous le curseur (si applicable) |
| `screenPoint` | `Vector2f` | `getScreenPoint()` | Les coordonnees a l'ecran de la souris |
| `mouseMotion` | `MouseMotionEvent` | `getMouseMotion()` | Les details de l'événement de mouvement de la souris |
| `cancelled` | `boolean` | `isCancelled()` | Indique si l'événement a ete annule |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getPlayer` | `public Player getPlayer()` | Retourne l'objet joueur (hérité) |
| `getClientUseTime` | `public long getClientUseTime()` | Retourne l'horodatage client |
| `getItemInHand` | `public Item getItemInHand()` | Retourne l'objet tenu en main |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Retourne la position du bloc sous le curseur |
| `getTargetEntity` | `public Entity getTargetEntity()` | Retourne l'entite sous le curseur |
| `getScreenPoint` | `public Vector2f getScreenPoint()` | Retourne les coordonnees a l'ecran |
| `getMouseMotion` | `public MouseMotionEvent getMouseMotion()` | Retourne l'événement de mouvement de la souris |
| `isCancelled` | `public boolean isCancelled()` | Retourne si l'événement est annule |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Annule ou reactive l'événement |

## Exemple d'utilisation

```java
// Enregistrer un handler pour les événements de mouvement de souris
eventBus.register(PlayerMouseMotionEvent.class, event -> {
    Player player = event.getPlayer();
    Vector2f screenPos = event.getScreenPoint();

    // Suivre la position de la souris pour l'UI
    updatePlayerCursorPosition(player, screenPos);

    // Mettre en surbrillance le bloc sous le curseur
    Vector3i targetBlock = event.getTargetBlock();
    if (targetBlock != null) {
        highlightBlock(player, targetBlock);
    }

    // Afficher une infobulle d'entite au survol
    Entity targetEntity = event.getTargetEntity();
    if (targetEntity != null) {
        showEntityTooltip(player, targetEntity);
    }
});

// Implementer des effets de survol
eventBus.register(PlayerMouseMotionEvent.class, event -> {
    Entity hoveredEntity = event.getTargetEntity();
    Player player = event.getPlayer();

    // Effacer l'etat de survol precedent
    clearHoverState(player);

    if (hoveredEntity != null) {
        // Appliquer un effet de contour au survol
        applyHoverOutline(player, hoveredEntity);

        // Afficher une invite d'interaction
        if (hoveredEntity instanceof NPC) {
            showInteractionPrompt(player, "Press E to talk");
        }
    }
});

// Systeme d'apercu de selection de bloc
eventBus.register(PlayerMouseMotionEvent.class, event -> {
    Item item = event.getItemInHand();
    Vector3i targetBlock = event.getTargetBlock();

    if (item != null && item.getType().equals("custom:building_tool") && targetBlock != null) {
        // Afficher l'apercu de placement
        showPlacementPreview(event.getPlayer(), targetBlock, item);
    }
});
```

## Cas d'utilisation courants

- Mise en surbrillance et apercu de selection de blocs
- Effets de survol et infobulles d'entites
- Systemes de curseur personnalises
- Systemes d'assistance a la visee ou de ciblage
- Apercus d'outils de construction
- Gestion de l'etat de survol de l'UI
- Detection du regard pour les tutoriels ou quetes

## Événements lies

- [PlayerMouseButtonEvent](./player-mouse-button-event.md) - Pour les événements de clic de souris
- [PlayerInteractEvent](./player-interact-event.md) - Evenement d'interaction obsolete

## Notes

L'objet `MouseMotionEvent` contient des informations détaillées sur le mouvement de la souris incluant :
- Le deplacement delta depuis le dernier événement
- La position actuelle
- La velocite du mouvement

Soyez attentif aux performances lors de la gestion de cet événement, car il peut se déclencher tres frequemment pendant le jeu normal. Considerez :
- Limiter les mises a jour pour reduire la charge de traitement
- Utiliser des structures de donnees efficaces pour le suivi de l'etat de survol
- Eviter les calculs lourds dans le handler d'événement

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerMouseMotionEvent.java:14`
