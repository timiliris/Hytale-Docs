---
id: damage-block-event
title: DamageBlockEvent
sidebar_label: DamageBlockEvent
---

# DamageBlockEvent

Déclenché lorsqu'un bloc subit des degats (pendant le processus de minage/destruction). Cet événement permet aux plugins d'intercepter les degats aux blocs, de modifier les valeurs de degats, ou d'annuler complètement les degats. Contrairement a `BreakBlockEvent`, celui-ci se déclenché pendant le processus de destruction, pas lorsque le bloc est complètement detruit.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.ecs.DamageBlockEvent` |
| **Classe parente** | `CancellableEcsEvent` |
| **Annulable** | Oui |
| **Evenement ECS** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/ecs/DamageBlockEvent.java:10` |

## Declaration

```java
public class DamageBlockEvent extends CancellableEcsEvent {
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `itemInHand` | `@Nullable ItemStack` | `getItemInHand()` | L'objet/outil utilise pour endommager le bloc (null si aucun objet en main) |
| `targetBlock` | `Vector3i` | `getTargetBlock()` | La position du bloc endommage |
| `blockType` | `BlockType` | `getBlockType()` | Le type de bloc endommage |
| `currentDamage` | `float` | `getCurrentDamage()` | Les degats accumules sur le bloc avant ce coup |
| `damage` | `float` | `getDamage()` | La quantite de degats appliquee dans cet événement |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getItemInHand` | `@Nullable public ItemStack getItemInHand()` | Retourne l'outil/objet utilise pour endommager le bloc, ou null si aucun objet en main |
| `getTargetBlock` | `public Vector3i getTargetBlock()` | Retourne la position dans le monde du bloc cible |
| `setTargetBlock` | `public void setTargetBlock(@Nonnull Vector3i targetBlock)` | Change la position du bloc cible (ligne 38) |
| `getBlockType` | `public BlockType getBlockType()` | Retourne le type de bloc endommage |
| `getCurrentDamage` | `public float getCurrentDamage()` | Retourne les degats deja accumules sur le bloc |
| `getDamage` | `public float getDamage()` | Retourne la quantite de degats appliquee |
| `setDamage` | `public void setDamage(float damage)` | Modifie la quantite de degats a appliquer (ligne 55) |
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

public class MiningPlugin extends PluginBase {

    @Override
    public void onEnable() {
        // Les événements ECS sont généralement traites via les systemes de composants
        // Ceci est un exemple conceptuel - l'implementation reelle peut varier

        // Enregistrer pour traiter DamageBlockEvent
        registerEcsEventHandler(DamageBlockEvent.class, this::onBlockDamage);
    }

    private void onBlockDamage(DamageBlockEvent event) {
        // Obtenir des informations sur les degats au bloc
        Vector3i position = event.getTargetBlock();
        BlockType blockType = event.getBlockType();
        ItemStack tool = event.getItemInHand();
        float currentDamage = event.getCurrentDamage();
        float incomingDamage = event.getDamage();

        // Exemple: Rendre certains blocs indestructibles
        if (isIndestructible(blockType)) {
            event.setCancelled(true);
            return;
        }

        // Exemple: Modifier les degats en fonction de l'efficacite de l'outil
        float modifiedDamage = calculateToolEffectiveness(tool, blockType, incomingDamage);
        event.setDamage(modifiedDamage);

        // Exemple: Implementer la fatigue de minage dans certaines zones
        if (isSlowMiningZone(position)) {
            event.setDamage(incomingDamage * 0.5f); // Minage 50% plus lent
        }

        // Exemple: Degats bonus pour des outils spécifiques sur des blocs spécifiques
        if (isOptimalTool(tool, blockType)) {
            event.setDamage(incomingDamage * 2.0f); // Vitesse double
        }

        // Exemple: Suivre la progression du minage
        float totalDamage = currentDamage + event.getDamage();
        logMiningProgress(position, blockType, totalDamage);
    }

    private boolean isIndestructible(BlockType blockType) {
        // Verifier si le bloc doit etre indestructible
        return false;
    }

    private float calculateToolEffectiveness(ItemStack tool, BlockType block, float baseDamage) {
        // Calcul de l'efficacite de l'outil
        return baseDamage;
    }

    private boolean isSlowMiningZone(Vector3i position) {
        // Verifier les zones de fatigue de minage
        return false;
    }

    private boolean isOptimalTool(ItemStack tool, BlockType block) {
        // Verifier si l'outil est optimal pour le type de bloc
        return false;
    }

    private void logMiningProgress(Vector3i pos, BlockType type, float damage) {
        // Implementation du suivi de progression
    }
}
```

## Quand cet événement se déclenché

Le `DamageBlockEvent` est déclenché lorsque :

1. **Un joueur mine un bloc** - Chaque tick/coup pendant qu'un joueur mine activement un bloc
2. **Une entite endommage un bloc** - Quand des entites causent des degats incrementaux aux blocs
3. **Destruction progressive de bloc** - Tout systeme qui applique des degats graduels aux blocs

L'événement se déclenché **pendant** le processus de minage, potentiellement plusieurs fois avant que le bloc ne se casse :
- Premier coup : `currentDamage = 0`, `damage = valeur du coup initial`
- Coups suivants : `currentDamage = accumule`, `damage = nouvelle valeur de coup`
- Quand `currentDamage + damage >= durete du bloc`, le bloc se casse

## Flux des degats

```
Debut du minage
    |
    v
DamageBlockEvent (currentDamage: 0, damage: X)
    |
    v
[Si non annule] -> Le bloc accumule les degats
    |
    v
DamageBlockEvent (currentDamage: X, damage: Y)
    |
    v
[Repeter jusqu'a ce que degats totaux >= durete]
    |
    v
BreakBlockEvent -> Bloc detruit
```

## Comportement de l'annulation

Lorsque l'événement est annule en appelant `setCancelled(true)` :

- Les degats ne sont **pas** appliques au bloc
- Les degats accumules du bloc restent inchanges
- La progression du minage n'avance pas
- Le joueur/l'entite execute toujours l'animation de minage (cote client)

Ceci est utile pour :
- Creer des blocs invulnerables
- Implementer des permissions de minage
- Des mecaniques de minage personnalisees
- La protection temporaire de blocs

## Modification des degats

L'utilisation de `setDamage(float)` vous permet de :

- **Augmenter les degats** - Accelerer le minage (valeurs > original)
- **Diminuer les degats** - Ralentir le minage (valeurs < original)
- **Mettre a zero** - Empecher effectivement la progression du minage sans annuler
- **Implementer des bonus d'outils** - Ameliorer certaines combinaisons outil/bloc

### Exemples de scenarios de degats

```java
// Vitesse de minage double
event.setDamage(event.getDamage() * 2.0f);

// Vitesse de minage reduite de moitie (fatigue de minage)
event.setDamage(event.getDamage() * 0.5f);

// Degats fixes independamment de l'outil
event.setDamage(1.0f);

// Degats progressifs bases sur les degats accumules
float bonus = 1.0f + (event.getCurrentDamage() * 0.1f);
event.setDamage(event.getDamage() * bonus);
```

## Événements lies

- [BreakBlockEvent](./break-block-event) - Déclenché lorsqu'un bloc est complètement casse
- [PlaceBlockEvent](./place-block-event) - Déclenché lorsqu'un bloc est place
- [UseBlockEvent](./use-block-event) - Déclenché lorsqu'un bloc fait l'objet d'une interaction

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/ecs/DamageBlockEvent.java:10`
