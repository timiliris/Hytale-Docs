---
id: player-disconnect-event
title: PlayerDisconnectEvent
sidebar_label: PlayerDisconnectEvent
---

# PlayerDisconnectEvent

Déclenché lorsqu'un joueur se deconnecte du serveur. Cet événement fournit des informations sur la raison de la deconnexion du joueur et permet aux plugins d'effectuer des operations de nettoyage.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.player.PlayerDisconnectEvent` |
| **Classe parente** | `PlayerRefEvent<Void>` |
| **Annulable** | Non |
| **Asynchrone** | Non |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerDisconnectEvent.java:7` |

## Declaration

```java
public class PlayerDisconnectEvent extends PlayerRefEvent<Void> {
   public PlayerDisconnectEvent(@Nonnull PlayerRef playerRef) {
      super(playerRef);
   }
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `playerRef` | `PlayerRef` | `getPlayerRef()` | Référence vers le joueur qui se deconnecte (hérité de PlayerRefEvent) |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getPlayerRef` | `@Nonnull public PlayerRef getPlayerRef()` | Retourne la reference du joueur qui se deconnecte (hérité) |
| `getDisconnectReason` | `@Nonnull public PacketHandler.DisconnectReason getDisconnectReason()` | Retourne la raison pour laquelle le joueur s'est deconnecte |
| `toString` | `@Nonnull public String toString()` | Retourne une representation textuelle de cet evenement |

## Exemple d'utilisation

```java
// Enregistrer un handler pour quand les joueurs se deconnectent
eventBus.register(PlayerDisconnectEvent.class, event -> {
    PlayerRef player = event.getPlayerRef();
    PacketHandler.DisconnectReason reason = event.getDisconnectReason();

    // Journaliser la deconnexion
    logger.info("Player " + player.getUsername() + " disconnected: " + reason);

    // Sauvegarder les donnees du joueur
    savePlayerData(player);

    // Notifier les autres joueurs
    broadcastMessage(player.getUsername() + " has left the server");
});

// Enregistrer avec une priorite tardive pour le nettoyage apres les autres handlers
eventBus.register(EventPriority.LATE, PlayerDisconnectEvent.class, event -> {
    // Effectuer le nettoyage final
    cleanupPlayerResources(event.getPlayerRef());
});
```

## Cas d'utilisation courants

- Sauvegarder les donnees du joueur avant qu'il ne se deconnecte complètement
- Diffuser des messages de depart aux autres joueurs
- Nettoyer les ressources et donnees specifiques au joueur
- Journaliser les événements de deconnexion pour les analyses
- Mettre a jour les systemes de presence ou de statut du joueur
- Retirer les joueurs des equipes, groupes ou autres formations

## Exemples pratiques

### Obtenir les détails de la raison de déconnexion

La méthode `getDisconnectReason()` retourne un objet `PacketHandler.DisconnectReason` qui contient soit une raison côté serveur, soit un type de déconnexion côté client :

```java
eventBus.register(PlayerDisconnectEvent.class, event -> {
    PlayerRef player = event.getPlayerRef();
    PacketHandler.DisconnectReason reason = event.getDisconnectReason();

    // Vérifier si c'était une déconnexion initiée par le serveur
    String serverReason = reason.getServerDisconnectReason();
    if (serverReason != null) {
        logger.info("Le serveur a expulsé " + player.getUsername() + ": " + serverReason);
        return;
    }

    // Vérifier si c'était une déconnexion initiée par le client
    DisconnectType clientType = reason.getClientDisconnectType();
    if (clientType != null) {
        switch (clientType) {
            case Disconnect -> logger.info(player.getUsername() + " s'est déconnecté normalement");
            case Crash -> logger.warn(player.getUsername() + " s'est déconnecté suite à un crash");
        }
    }
});
```

### Valeurs de l'enum DisconnectType

| Valeur | Description |
|--------|-------------|
| `Disconnect` | Déconnexion normale initiée par le client (le joueur a appuyé sur déconnecter) |
| `Crash` | Le client a crashé ou la connexion a été perdue de manière inattendue |

## Détails internes

### Où l'événement est déclenché

L'événement est déclenché dans la méthode `Universe.removePlayer()` :

```java
// Fichier: com/hypixel/hytale/server/core/universe/Universe.java:733
public void removePlayer(@Nonnull PlayerRef playerRef) {
    this.getLogger().at(Level.INFO).log("Removing player '" + playerRef.getUsername() + "'");

    IEventDispatcher<PlayerDisconnectEvent, PlayerDisconnectEvent> eventDispatcher =
        HytaleServer.get().getEventBus().dispatchFor(PlayerDisconnectEvent.class);

    if (eventDispatcher.hasListener()) {
        eventDispatcher.dispatch(new PlayerDisconnectEvent(playerRef));
    }

    // La suppression du joueur continue quoi qu'il arrive...
}
```

### Chaîne de traitement de l'événement

```
Le joueur clique sur Déconnecter / Connexion perdue
         ↓
Universe.removePlayer(playerRef) appelé
         ↓
PlayerDisconnectEvent dispatché (si des listeners existent)
         ↓
Les handlers d'événements s'exécutent (ne peuvent pas empêcher la suppression)
         ↓
L'entité du joueur est retirée du monde
         ↓
finalizePlayerRemoval() appelé
```

### Hiérarchie de classes

```
PlayerDisconnectEvent
  └── extends PlayerRefEvent<Void>
        └── implements IEvent<Void>
              └── extends IBaseEvent<Void>
```

## Test

> **Testé :** 17 janvier 2026 - Vérifié avec le plugin doc-test

Pour tester cet événement :
1. Exécutez `/doctest test-player-disconnect-event`
2. Déconnectez-vous du serveur (ESC -> Déconnecter)
3. Vérifiez la console du serveur pour les détails de l'événement

**Exemple de sortie de test :**
```
[SUCCESS] PlayerDisconnectEvent detected!

Event details:
  getPlayerRef():
    -> Username: Timiliris
    -> UUID: 8559eb7c-b33d-448c-ab06-e49e2fd75eb9
  getDisconnectReason():
    -> DisconnectReason{serverDisconnectReason='null', clientDisconnectType=Disconnect}
    -> Client Type: Disconnect
  toString():
    -> PlayerDisconnectEvent{playerRef=...} PlayerRefEvent{playerRef=...}

All documented methods work correctly!
```

> **Dernière mise à jour :** 17 janvier 2026 - Testé et vérifié. Ajout d'exemples pratiques et de détails internes.

## Événements lies

- [PlayerConnectEvent](./player-connect-event.md) - Déclenché quand un joueur se connecte
- [PlayerSetupDisconnectEvent](./player-setup-disconnect-event.md) - Déclenché pendant la phase de deconnexion anticipee
- [DrainPlayerFromWorldEvent](./drain-player-from-world-event.md) - Déclenché lors du retrait d'un joueur d'un monde

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerDisconnectEvent.java:7`
