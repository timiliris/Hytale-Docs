---
id: break-block-event
title: BreakBlockEvent
sidebar_label: BreakBlockEvent
---

# BreakBlockEvent

Déclenché lorsqu'un bloc est sur le point d'etre casse (detruit) dans le monde. Cet événement permet aux plugins d'intercepter et d'annuler la destruction de blocs, de modifier le bloc cible, ou d'executer une logique personnalisee lorsque des blocs sont detruits.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.ecs.BreakBlockEvent` |
| **Classe parente** | `CancellableEcsEvent` |
| **Annulable** | Oui |
| **Evenement ECS** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/BreakBlockEvent.java:10` |

## Declaration

```java
public class BreakBlockEvent extends CancellableEcsEvent {
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | L'objet que l'entite tient lorsqu'elle casse le bloc (null si aucun objet en main) |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | La position du bloc en cours de destruction |
| `blockType` | `BlockType` | `getBlockType()` | Le type de bloc en cours de destruction |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Retourne l'objet tenu par l'entite qui casse le bloc, ou null si aucun objet en main |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Retourne la position dans le monde du bloc cible |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Change la position du bloc cible (ligne 39) |
| `getBlockType` | `public BlockType getBlockType()` | Retourne le type de bloc en cours de destruction |
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

public class BlockProtectionPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // Les événements ECS sont généralement traites via les systemes de composants
        // Ceci est un exemple conceptuel - l'implementation reelle peut varier

        // Enregistrer pour traiter BreakBlockEvent
        registerEcsEventHandler(BreakBlockEvent.class, this::onBlockBreak);
    }

    private void onBlockBreak(BreakBlockEvent event) {
        // Obtenir des informations sur le bloc en cours de destruction
        Vector3i position = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        ItemStack toolUsed = event.getItemInHand();

        // Exemple: Empecher la destruction de blocs de type bedrock
        if (isProtectedBlock(blockType)) {
            event.setCancelled(true);
            return;
        }

        // Exemple: Enregistrer les destructions de blocs
        logBlockBreak(position, blockType, toolUsed);

        // Exemple: Modifier la cible (rediriger la destruction vers un bloc different)
        // event.setTargetBlock(new Vector3i(position.x, position.y + 1, position.z));
    }

    private boolean isProtectedBlock(BlockType blockType) {
        // Logique de protection personnalisee
        return false;
    }

    private void logBlockBreak(Vector3i pos, BlockType type, ItemStack tool) {
        // Implementation de la journalisation
    }
}
```

## Quand cet événement se déclenché

Le `BreakBlockEvent` est déclenché lorsque :

1. **Un joueur casse un bloc** - Quand un joueur reussit a miner/casser un bloc apres que le seuil de degats est atteint
2. **Une entite detruit un bloc** - Quand une entite (mob, projectile, etc.) provoque la destruction d'un bloc
3. **Suppression de bloc programmatique** - Quand les systemes de jeu suppriment des blocs via les mecaniques de destruction normales

L'événement se déclenché **avant** que le bloc soit reellement retire du monde, permettant aux gestionnaires de :
- Annuler complètement la destruction
- Modifier quel bloc est detruit
- Suivre la destruction des blocs a des fins de journalisation ou de gameplay

## Comportement de l'annulation

Lorsque l'événement est annule en appelant `setCancelled(true)` :

- Le bloc ne sera **pas** retire du monde
- Le bloc reste dans son etat actuel
- Tout drop d'objet qui aurait eu lieu est empêché
- La perte de durabilite de l'outil peut toujours se produire (selon l'implementation)
- Le joueur/l'entite recoit un retour indiquant que l'action a ete bloquee

Ceci est utile pour :
- Les systemes de protection de blocs (claims, protection du spawn)
- Les restrictions de construction basees sur les permissions
- Les modes de jeu personnalises ou certains blocs ne peuvent pas etre casses
- Les mesures anti-grief

## Événements lies

- [PlaceBlockEvent](./place-block-event) - Déclenché lorsqu'un bloc est place
- [DamageBlockEvent](./damage-block-event) - Déclenché lorsqu'un bloc subit des degats (avant la destruction)
- [UseBlockEvent](./use-block-event) - Déclenché lorsqu'un bloc fait l'objet d'une interaction

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/BreakBlockEvent.java:10`
