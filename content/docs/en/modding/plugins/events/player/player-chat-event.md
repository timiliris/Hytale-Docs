---
id: player-chat-event
title: PlayerChatEvent
sidebar_label: PlayerChatEvent
---

# PlayerChatEvent

Fired when a player sends a chat message. This is an asynchronous, cancellable event that allows plugins to modify, filter, or block chat messages before they are delivered to recipients.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.event.events.player.PlayerChatEvent` |
| **Parent Class** | `IAsyncEvent<String>` |
| **Cancellable** | Yes |
| **Async** | Yes |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerChatEvent.java:10` |

## Declaration

```java
public class PlayerChatEvent implements IAsyncEvent<String>, ICancellable {
   @Nonnull
   public static final PlayerChatEvent.Formatter DEFAULT_FORMATTER = ...
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `sender` | `PlayerRef` | `getSender()` | Reference to the player who sent the message |
| `targets` | `List<PlayerRef>` | `getTargets()` | List of players who will receive the message |
| `content` | `String` | `getContent()` | The chat message content |
| `formatter` | `PlayerChatEvent.Formatter` | `getFormatter()` | The formatter used to format the message |
| `cancelled` | `boolean` | `isCancelled()` | Whether the chat event has been cancelled |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getSender` | `public PlayerRef getSender()` | Returns the player who sent the message |
| `setSender` | `public void setSender(@Nonnull PlayerRef sender)` | Changes the sender of the message |
| `getTargets` | `public List<PlayerRef> getTargets()` | Returns the list of message recipients |
| `setTargets` | `public void setTargets(@Nonnull List<PlayerRef> targets)` | Sets the list of message recipients |
| `getContent` | `public String getContent()` | Returns the chat message content |
| `setContent` | `public void setContent(@Nonnull String content)` | Modifies the chat message content |
| `getFormatter` | `public PlayerChatEvent.Formatter getFormatter()` | Returns the message formatter |
| `setFormatter` | `public void setFormatter(@Nonnull PlayerChatEvent.Formatter formatter)` | Sets a custom message formatter |
| `isCancelled` | `public boolean isCancelled()` | Returns whether the event is cancelled |
| `setCancelled` | `public void setCancelled(boolean cancelled)` | Cancels or uncancels the event |

## Inner Classes

| Class | Type | Description |
|-------|------|-------------|
| `Formatter` | `interface` | Interface for formatting chat messages. The `format(PlayerRef sender, String content)` method returns a `Message` object. |

## Usage Example

```java
// Register an async handler for chat events
eventBus.registerAsync(PlayerChatEvent.class, event -> {
    String message = event.getContent();
    PlayerRef sender = event.getSender();

    // Filter profanity
    if (containsProfanity(message)) {
        event.setCancelled(true);
        sender.sendMessage("Your message contains inappropriate content.");
        return CompletableFuture.completedFuture(null);
    }

    // Modify the message format
    event.setContent(message.toUpperCase()); // Example: make all caps

    return CompletableFuture.completedFuture(null);
});

// Custom formatter example
eventBus.register(PlayerChatEvent.class, event -> {
    event.setFormatter((sender, content) -> {
        return Message.translation("chat.format")
            .param("sender", sender.getUsername())
            .param("message", content);
    });
});

// Limit chat to specific players (private message)
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

## Common Use Cases

- Chat filtering and profanity detection
- Custom chat formatting (prefixes, colors, etc.)
- Private messaging systems
- Chat channels or rooms
- Spam prevention and rate limiting
- Chat logging and moderation
- Translation or localization of messages

## Related Events

- [PlayerConnectEvent](./player-connect-event.md) - Fired when a player connects
- [PlayerDisconnectEvent](./player-disconnect-event.md) - Fired when a player disconnects

## Notes

This event is **asynchronous**, which means handlers should return a `CompletableFuture`. This allows for non-blocking operations like database lookups or external API calls during chat processing.

The `DEFAULT_FORMATTER` static field provides the default formatting behavior if no custom formatter is set.

## Source Reference

`decompiled/com/hypixel/hytale/server/core/event/events/player/PlayerChatEvent.java:10`
