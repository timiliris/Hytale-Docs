---
id: place-block-event
title: PlaceBlockEvent
sidebar_label: PlaceBlockEvent
---

# PlaceBlockEvent

Déclenché lorsqu'un bloc est sur le point d'etre place dans le monde. Cet événement permet aux plugins d'intercepter et d'annuler le placement de blocs, de modifier la position cible ou la rotation, ou d'executer une logique personnalisee lorsque des blocs sont places.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.ecs.PlaceBlockEvent` |
| **Classe parente** | `CancellableEcsEvent` |
| **Annulable** | Oui |
| **Evenement ECS** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/PlaceBlockEvent.java:11` |

## Declaration

```java
public class PlaceBlockEvent extends CancellableEcsEvent {
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | L'objet (bloc) en cours de placement depuis la main de l'entite (null si aucun objet en main) |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | La position ou le bloc sera place |
| `rotation` | `RotationTuple` | `getRotation()` | La rotation/orientation du bloc place |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Retourne la pile d'objets utilisee pour placer le bloc, ou null si aucun objet en main |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Retourne la position dans le monde ou le bloc sera place |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Change la position de placement cible (ligne 35) |
| `getRotation` | `public RotationTuple getRotation()` | Retourne le tuple de rotation pour l'orientation du bloc |
| `setRotation` | `public void setRotation(@Nonnull RotationTuple rotation)` | Change la rotation/orientation du bloc (ligne 45) |
| `isCancelled` | `public boolean isCancelled()` | Retourne si l'événement a ete annule (hérité) |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Definit l'etat d'annulation de l'événement (hérité) |

## Comprendre les événements ECS

**Important :** Les événements ECS (Entity Component System) fonctionnent différemment des événements `IEvent` classiques. Ils font partie de l'architecture basee sur les composants de Hytale et sont généralement envoyes et traites via le framework ECS plutot que via l'`EventBus` standard.

Differences cles :
- Les événements ECS etendent `EcsEvent` ou `CancellableEcsEvent` au lieu d'implementer `IEvent`
- Ils sont associes aux composants et systemes d'entites
- L'enregistrement et le traitement peuvent utiliser des mecanismes differents de l'event bus standard

## Exemple d'utilisation

```java
// Note: L'enregistrement des événements ECS peut differer de l'enregistrement standard IEvent
// Le mecanisme exact d'enregistrement depend de la facon dont votre plugin s'integre au systeme ECS

public class BuildingPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // Les événements ECS sont généralement traites via les systemes de composants
        // Ceci est un exemple conceptuel - l'implementation reelle peut varier

        // Enregistrer pour traiter PlaceBlockEvent
        registerEcsEventHandler(PlaceBlockEvent.class, this::onBlockPlace);
    }

    private void onBlockPlace(PlaceBlockEvent event) {
        // Obtenir des informations sur le bloc en cours de placement
        Vector3i position = event.getTargetBlock();
        ItemStack blockItem = event.getItemInHand();
        RotationTuple rotation = event.getRotation();

        // Exemple: Empecher le placement de blocs dans les zones protegees
        if (isProtectedArea(position)) {
            event.setCancelled(true);
            return;
        }

        // Exemple: Appliquer les limites de hauteur de placement de blocs
        if (position.y > MAX_BUILD_HEIGHT) {
            event.setCancelled(true);
            return;
        }

        // Exemple: Modifier la position de placement (aligner sur une grille)
        Vector3i snappedPosition = snapToGrid(position);
        event.setTargetBlock(snappedPosition);

        // Exemple: Forcer une rotation spécifique pour certains blocs
        // event.setRotation(new RotationTuple(0, 0, 0));

        // Enregistrer le placement pour le suivi
        logBlockPlacement(position, blockItem);
    }

    private boolean isProtectedArea(Vector3i position) {
        // Verifier si la position est dans une region protegee
        return false;
    }

    private Vector3i snapToGrid(Vector3i position) {
        // Logique d'alignement sur la grille
        return position;
    }

    private void logBlockPlacement(Vector3i pos, ItemStack item) {
        // Implementation de la journalisation
    }

    private static final int MAX_BUILD_HEIGHT = 256;
}
```

## Quand cet événement se déclenché

Le `PlaceBlockEvent` est déclenché lorsque :

1. **Un joueur place un bloc** - Quand un joueur fait un clic droit pour placer un bloc depuis son inventaire
2. **Une entite place un bloc** - Quand une entite (comme un mob de type enderman) place un bloc
3. **Placement programmatique** - Quand les systemes de jeu placent des blocs via les mecaniques de placement normales

L'événement se déclenché **avant** que le bloc soit reellement ajoute au monde, permettant aux gestionnaires de :
- Annuler complètement le placement
- Modifier la position cible
- Changer la rotation/orientation du bloc
- Suivre les placements de blocs a des fins de journalisation ou de gameplay

## Comportement de l'annulation

Lorsque l'événement est annule en appelant `setCancelled(true)` :

- Le bloc ne sera **pas** place dans le monde
- L'objet reste dans la main du joueur/de l'entite (non consomme)
- Aucun changement d'etat de bloc ne se produit a la position cible
- Le joueur/l'entite recoit un retour indiquant que l'action a ete bloquee

Ceci est utile pour :
- Les systemes de permissions de construction (claims, protection de parcelles)
- L'application des limites de hauteur
- La restriction de types de blocs spécifiques dans certaines zones
- L'anti-grief et la protection du monde
- Les modes de jeu personnalises avec des restrictions de construction

## Rotation des blocs

Le `RotationTuple` controle comment le bloc est oriente lorsqu'il est place. Ceci est particulierement important pour :

- Les blocs directionnels (escaliers, buches, piliers)
- Les blocs avec des directions de face (fours, coffres)
- Les blocs decoratifs avec plusieurs orientations

Vous pouvez utiliser `setRotation()` pour :
- Forcer les blocs a faire face a une direction spécifique
- Implementer des fonctionnalites de rotation automatique
- Creer des outils d'assistance a la construction

## Événements lies

- [BreakBlockEvent](./break-block-event) - Déclenché lorsqu'un bloc est casse
- [DamageBlockEvent](./damage-block-event) - Déclenché lorsqu'un bloc subit des degats
- [UseBlockEvent](./use-block-event) - Déclenché lorsqu'un bloc fait l'objet d'une interaction

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/PlaceBlockEvent.java:11`
