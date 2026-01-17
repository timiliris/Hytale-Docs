---
id: add-player-to-world-event
title: AddPlayerToWorldEvent
sidebar_label: AddPlayerToWorldEvent
---

# AddPlayerToWorldEvent

Déclenché lorsqu'un joueur est en cours d'ajout a un monde. Cet événement permet aux plugins de controler si un message de connexion doit etre diffuse et d'effectuer des operations de configuration quand un joueur entre dans un monde.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.player.AddPlayerToWorldEvent` |
| **Classe parente** | `IEvent<String>` |
| **Annulable** | Non |
| **Asynchrone** | Non |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/player/AddPlayerToWorldEvent.java:9` |

## Declaration

```java
public class AddPlayerToWorldEvent implements IEvent<String> {
   @Nonnull
   private final Holder<EntityStore> holder;
   @Nonnull
   private final World world;
   private boolean broadcastJoinMessage = true;
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `holder` | `Holder<EntityStore>` | `getHolder()` | Le conteneur d'entite contenant le magasin d'entite du joueur |
| `world` | `World` | `getWorld()` | Le monde auquel le joueur est ajoute |
| `broadcastJoinMessage` | `boolean` | `shouldBroadcastJoinMessage()` | Indique si un message de connexion doit etre diffuse aux autres joueurs |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getHolder` | `@Nonnull public Holder<EntityStore> getHolder()` | Retourne le conteneur d'entite du joueur |
| `getWorld` | `@Nonnull public World getWorld()` | Retourne le monde rejoint |
| `shouldBroadcastJoinMessage` | `public boolean shouldBroadcastJoinMessage()` | Retourne si un message de connexion sera diffuse |
| `setBroadcastJoinMessage` | `public void setBroadcastJoinMessage(boolean broadcastJoinMessage)` | Definit s'il faut diffuser un message de connexion |
| `toString` | `@Nonnull public String toString()` | Retourne une representation textuelle de cet evenement |

## Exemple d'utilisation

> **Testé** - Ce code a été vérifié avec un plugin fonctionnel.

Puisque `AddPlayerToWorldEvent` implémente `IEvent<String>` (type de clé non-Void), vous devez utiliser `registerGlobal()` pour capturer tous les événements, peu importe leur clé.

```java
// Enregistrer un handler global pour quand les joueurs sont ajoutes aux mondes
eventBus.registerGlobal(AddPlayerToWorldEvent.class, event -> {
    World world = event.getWorld();
    String worldName = world != null ? world.getName() : "Unknown";

    // Journaliser l'événement
    logger.info("Player being added to world: " + worldName);

    // Supprimer conditionnellement le message de connexion
    if ("minigame_lobby".equals(worldName)) {
        // Ne pas diffuser dans les lobbies de mini-jeux
        event.setBroadcastJoinMessage(false);
    }
});

// Connexions silencieuses pour le staff
eventBus.registerGlobal(EventPriority.EARLY, AddPlayerToWorldEvent.class, event -> {
    Holder<EntityStore> holder = event.getHolder();

    // Verifier si le joueur est staff avec mode invisible active
    if (isStaffWithVanish(holder)) {
        event.setBroadcastJoinMessage(false);
    }
});

// Suivre la population des mondes
eventBus.registerGlobal(AddPlayerToWorldEvent.class, event -> {
    World world = event.getWorld();

    // Mettre a jour les statistiques du monde
    incrementWorldPopulation(world);
});
```

**Important:** Utiliser `register()` au lieu de `registerGlobal()` ne fonctionnera pas pour cet événement car il a un type de clé `String`.

## Cas d'utilisation courants

- Personnalisation ou suppression des messages de connexion
- Configuration spécifique au monde pour les joueurs
- Suivi de la population des mondes
- Application de permissions ou effets spécifiques au monde
- Teleportation des joueurs aux points d'apparition
- Chargement des donnees de joueur spécifiques au monde
- Initialisation des elements UI spécifiques au monde

## Événements lies

- [PlayerConnectEvent](./player-connect-event.md) - Déclenché quand le joueur se connecte au serveur
- [DrainPlayerFromWorldEvent](./drain-player-from-world-event.md) - Déclenché quand le joueur est retire d'un monde
- [PlayerReadyEvent](./player-ready-event.md) - Déclenché quand le client du joueur est complètement pret
- [StartWorldEvent](../world/start-world-event.md) - Déclenché quand un monde demarre

## Ordre des événements

Quand un joueur rejoint le serveur et est place dans un monde :

1. **PlayerSetupConnectEvent** - Validation initiale
2. **PlayerConnectEvent** - Entite du joueur créée, monde peut etre defini
3. **AddPlayerToWorldEvent** - Joueur ajoute au monde
4. **PlayerReadyEvent** - Client complètement charge

Quand un joueur est transfere entre mondes :

1. **DrainPlayerFromWorldEvent** - Joueur retire de l'ancien monde
2. **AddPlayerToWorldEvent** - Joueur ajoute au nouveau monde

## Test

> **Testé :** 17 janvier 2026 - Vérifié avec le plugin doc-test

Pour tester cet événement :

1. Exécutez `/doctest test-add-player-to-world-event`
2. Déconnectez-vous et reconnectez-vous au serveur (ou transférez vers un autre monde)
3. L'événement devrait se déclencher et afficher les détails dans le chat/console

**Résultats du test :**
- `getHolder()` - Retourne correctement le conteneur d'entité
- `getWorld()` - Retourne correctement le monde cible
- `shouldBroadcastJoinMessage()` - Retourne le flag de diffusion (défaut: true)
- `setBroadcastJoinMessage()` - Modifie avec succès le flag de diffusion
- `toString()` - Retourne une représentation textuelle correcte

Toutes les méthodes documentées fonctionnent correctement.

## Notes

Cet événement ne peut pas etre annule, mais vous pouvez controler la diffusion du message de connexion via `setBroadcastJoinMessage()`. Pour empecher un joueur d'entrer complètement dans un monde, vous devriez gerer cela dans un événement anterieur comme `PlayerConnectEvent` lors de la definition du monde initial.

Le `holder` fournit l'acces au magasin d'entite du joueur, qui contient tous les composants et donnees associes a l'entite du joueur.

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/player/AddPlayerToWorldEvent.java:9`
