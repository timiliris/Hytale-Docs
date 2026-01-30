---
id: messages-updated-event
title: MessagesUpdated
sidebar_label: MessagesUpdated
---

# MessagesUpdated

Fired when translation messages are updated at runtime. This event allows plugins to react to changes in the internationalization system, enabling dynamic localization updates without server restart.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.i18n.event.MessagesUpdated` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/modules/i18n/event/MessagesUpdated.java` |

## Declaration

```java
public class MessagesUpdated implements IEvent<Void> {
   private final Map<String, Map<String, String>> changedMessages;
   private final Map<String, Map<String, String>> removedMessages;

   public MessagesUpdated(
      Map<String, Map<String, String>> changedMessages,
      Map<String, Map<String, String>> removedMessages
   )
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `changedMessages` | `Map<String, Map<String, String>>` | `getChangedMessages()` | Map of language codes to their changed translation key-value pairs |
| `removedMessages` | `Map<String, Map<String, String>>` | `getRemovedMessages()` | Map of language codes to their removed translation key-value pairs |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getChangedMessages` | `public Map<String, Map<String, String>> getChangedMessages()` | Returns the map of all changed translations organized by language |
| `getRemovedMessages` | `public Map<String, Map<String, String>> getRemovedMessages()` | Returns the map of all removed translations organized by language |
| `toString` | `@Nonnull public String toString()` | Returns a string representation of the event including changed and removed messages |

## Usage Example

```java
import com.hypixel.hytale.server.core.modules.i18n.event.MessagesUpdated;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;
import java.util.Map;

public class LocalizationListenerPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(MessagesUpdated.class, this::onMessagesUpdated, EventPriority.NORMAL);
    }

    private void onMessagesUpdated(MessagesUpdated event) {
        // Get changed messages for each language
        Map<String, Map<String, String>> changed = event.getChangedMessages();

        for (Map.Entry<String, Map<String, String>> langEntry : changed.entrySet()) {
            String languageCode = langEntry.getKey();
            Map<String, String> translations = langEntry.getValue();

            getLogger().info("Language '" + languageCode + "' updated with "
                + translations.size() + " changed translations");

            // Process each changed translation
            for (Map.Entry<String, String> translation : translations.entrySet()) {
                String key = translation.getKey();
                String value = translation.getValue();
                getLogger().debug("  " + key + " = " + value);
            }
        }

        // Handle removed messages
        Map<String, Map<String, String>> removed = event.getRemovedMessages();

        for (Map.Entry<String, Map<String, String>> langEntry : removed.entrySet()) {
            String languageCode = langEntry.getKey();
            Map<String, String> removedTranslations = langEntry.getValue();

            getLogger().info("Language '" + languageCode + "' had "
                + removedTranslations.size() + " translations removed");
        }
    }
}
```

## When This Event Fires

The `MessagesUpdated` event is fired when:

1. **Hot-reload of language files** - When translation files are modified and reloaded at runtime
2. **Dynamic language updates** - When the localization system detects changes to message files
3. **Asset pack changes** - When an asset pack with language files is loaded or modified

The event allows handlers to:
- React to translation changes in real-time
- Update cached translations
- Refresh UI elements with new text
- Log localization changes for debugging
- Notify players of language updates

## Understanding the Message Structure

The message maps use a nested structure:
- **Outer map key**: Language code (e.g., "en_US", "fr_FR", "de_DE")
- **Inner map key**: Translation key (e.g., "item.sword.name")
- **Inner map value**: Translated text (e.g., "Iron Sword")

```java
// Example structure
// changedMessages = {
//   "en_US" -> {
//     "item.sword.name" -> "Iron Sword",
//     "item.sword.description" -> "A basic sword"
//   },
//   "fr_FR" -> {
//     "item.sword.name" -> "Epee de fer",
//     "item.sword.description" -> "Une epee basique"
//   }
// }
```

## Cache Invalidation Example

```java
import com.hypixel.hytale.server.core.modules.i18n.event.MessagesUpdated;
import java.util.concurrent.ConcurrentHashMap;

public class TranslationCachePlugin extends PluginBase {

    private final ConcurrentHashMap<String, String> translationCache = new ConcurrentHashMap<>();

    @Override
    public void onEnable() {
        EventBus.register(MessagesUpdated.class, this::invalidateCache, EventPriority.EARLY);
    }

    private void invalidateCache(MessagesUpdated event) {
        // Invalidate changed entries
        for (Map<String, String> translations : event.getChangedMessages().values()) {
            for (String key : translations.keySet()) {
                translationCache.remove(key);
            }
        }

        // Remove deleted entries
        for (Map<String, String> translations : event.getRemovedMessages().values()) {
            for (String key : translations.keySet()) {
                translationCache.remove(key);
            }
        }

        getLogger().info("Translation cache invalidated");
    }
}
```

## Use Cases

- **Hot-reload support**: Update translations without restarting the server
- **Cache management**: Invalidate cached translations when files change
- **Debugging**: Log translation changes during development
- **Multi-language support**: React to language pack installations
- **UI refresh**: Trigger UI updates when text changes
- **Validation**: Verify translation completeness after updates

## Related Events

- [GenerateDefaultLanguageEvent](./generate-default-language-event) - Fired when generating default language files
- [AssetStoreMonitorEvent](../asset/asset-store-monitor-event) - Fired when asset files change

## Source Reference

`decompiled/com/hypixel/hytale/server/core/modules/i18n/event/MessagesUpdated.java`
