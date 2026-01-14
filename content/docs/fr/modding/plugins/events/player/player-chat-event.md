---
id: player-chat-event
title: PlayerChatEvent
sidebar_label: PlayerChatEvent
---

# PlayerChatEvent

Déclenché lorsqu'un joueur envoie un message dans le chat. C'est un événement asynchrone et annulable qui permet aux plugins de modifier, filtrer ou bloquer les messages du chat avant qu'ils ne soient livres aux destinataires.

## Informations sur l'événement

| Propriété | Valeur |
|-----------|--------|
| **Nom complet de la classe** | `com.hypixel.hytale.server.core.event.events.player.PlayerChatEvent` |
| **Classe parente** | `IAsyncEvent<String>` |
| **Annulable** | Oui |
| **Asynchrone** | Oui |
| **Fichier source** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerChatEvent.java:10` |

## Declaration

```java
public class PlayerChatEvent implements IAsyncEvent<String>, ICancellable {
   @Nonnull
   public static final PlayerChatEvent.Formatter DEFAULT_FORMATTER = ...
```

## Champs

| Champ | Type | Accesseur | Description |
|-------|------|-----------|-------------|
| `sender` | `PlayerRef` | `getSender()` | Référence vers le joueur qui a envoye le message |
| `targets` | `List<PlayerRef>` | `getTargets()` | Liste des joueurs qui recevront le message |
| `content` | `String` | `getContent()` | Le contenu du message du chat |
| `formatter` | `PlayerChatEvent.Formatter` | `getFormatter()` | Le formateur utilise pour formater le message |
| `cancelled` | `boolean` | `isCancelled()` | Indique si l'événement de chat a ete annule |

## Méthodes

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `getSender` | `public PlayerRef getSender()` | Retourne le joueur qui a envoye le message |
| `setSender` | `public void setSender(@Nonnull PlayerRef sender)` | Change l'expediteur du message |
| `getTargets` | `public List<PlayerRef> getTargets()` | Retourne la liste des destinataires du message |
| `setTargets` | `public void setTargets(@Nonnull List<PlayerRef> targets)` | Definit la liste des destinataires du message |
| `getContent` | `public String getContent()` | Retourne le contenu du message du chat |
| `setContent` | `public void setContent(@Nonnull String content)` | Modifie le contenu du message du chat |
| `getFormatter` | `public PlayerChatEvent.Formatter getFormatter()` | Retourne le formateur de message |
| `setFormatter` | `public void setFormatter(@Nonnull PlayerChatEvent.Formatter formatter)` | Definit un formateur de message personnalise |
| `isCancelled` | `public boolean isCancelled()` | Retourne si l'événement est annule |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Annule ou reactive l'événement |

## Classes internes

| Classe | Type | Description |
|--------|------|-------------|
| `Formatter` | `interface` | Interface pour formater les messages du chat. La méthode `format(PlayerRef sender, String content)` retourne un objet `Message`. |

## Exemple d'utilisation

```java
// Enregistrer un handler asynchrone pour les événements de chat
eventBus.registerAsync(PlayerChatEvent.class, event -> {
    String message = event.getContent();
    PlayerRef sender = event.getSender();

    // Filtrer les grossieretes
    if (containsProfanity(message)) {
        event.setCancelled(true);
        sender.sendMessage("Your message contains inappropriate content.");
        return CompletableFuture.completedFuture(null);
    }

    // Modifier le format du message
    event.setContent(message.toUpperCase()); // Exemple: tout en majuscules

    return CompletableFuture.completedFuture(null);
});

// Exemple de formateur personnalise
eventBus.register(PlayerChatEvent.class, event -> {
    event.setFormatter((sender, content) -> {
        return Message.translation("chat.format")
            .param("sender", sender.getUsername())
            .param("message", content);
    });
});

// Limiter le chat a des joueurs specifiques (message prive)
eventBus.register(PlayerChatEvent.class, event -> {
    if (event.getContent().startsWith("/pm ")) {
        String[] parts = event.getContent().split(" ", 3);
        if (parts.length >= 3) {
            PlayerRef target = findPlayer(parts[1]);
            if (target != null) {
                event.setTargets(List.of(target, event.getSender()));
                event.setContent(parts[2]);
            }
        }
    }
});
```

## Cas d'utilisation courants

- Filtrage du chat et detection des grossieretes
- Formatage personnalise du chat (prefixes, couleurs, etc.)
- Systemes de messagerie privee
- Canaux ou salons de discussion
- Prevention du spam et limitation du debit
- Journalisation et moderation du chat
- Traduction ou localisation des messages

## Événements lies

- [PlayerConnectEvent](./player-connect-event.md) - Déclenché quand un joueur se connecte
- [PlayerDisconnectEvent](./player-disconnect-event.md) - Déclenché quand un joueur se deconnecte

## Notes

Cet événement est **asynchrone**, ce qui signifie que les handlers doivent retourner un `CompletableFuture`. Cela permet des operations non bloquantes comme des recherches en base de donnees ou des appels API externes pendant le traitement du chat.

Le champ statique `DEFAULT_FORMATTER` fournit le comportement de formatage par defaut si aucun formateur personnalise n'est défini.

## Référence source

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerChatEvent.java:10`
