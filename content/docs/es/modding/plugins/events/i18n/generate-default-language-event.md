---
id: generate-default-language-event
title: GenerateDefaultLanguageEvent
sidebar_label: GenerateDefaultLanguageEvent
---

# GenerateDefaultLanguageEvent

Fired when the server generates default language/translation files. This event allows plugins to contribute their own translation entries to the game's internationalization system.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.modules.i18n.event.GenerateDefaultLanguageEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/modules/i18n/event/GenerateDefaultLanguageEvent.java` |

## Declaration

```java
public class GenerateDefaultLanguageEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `translationFiles` | `ConcurrentHashMap<String, TranslationMap>` | N/A (internal) | Thread-safe map of translation file names to their translations |

## Constructor

| Signature | Description |
|-----------|-------------|
| `public GenerateDefaultLanguageEvent(ConcurrentHashMap<String, TranslationMap> translationFiles)` | Creates a new event with the given translation files map |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `putTranslationFile` | `public void putTranslationFile(@Nonnull String filename, @Nonnull TranslationMap translations)` | Adds a translation file with the given name and translations |

## Usage Example

```java
import com.hypixel.hytale.server.core.modules.i18n.event.GenerateDefaultLanguageEvent;
import com.hypixel.hytale.server.core.modules.i18n.generator.TranslationMap;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;

public class LocalizationPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(GenerateDefaultLanguageEvent.class, this::onGenerateLanguage, EventPriority.NORMAL);
    }

    private void onGenerateLanguage(GenerateDefaultLanguageEvent event) {
        // Create translation map for plugin strings
        TranslationMap pluginTranslations = new TranslationMap();

        // Add plugin-specific translations
        pluginTranslations.put("myplugin.welcome", "Welcome to the server!");
        pluginTranslations.put("myplugin.goodbye", "Thanks for playing!");
        pluginTranslations.put("myplugin.error.permission", "You don't have permission to do that.");
        pluginTranslations.put("myplugin.items.magic_sword", "Enchanted Blade");
        pluginTranslations.put("myplugin.items.magic_sword.desc", "A blade imbued with ancient magic.");

        // Register the translations
        event.putTranslationFile("myplugin_strings", pluginTranslations);

        getLogger().info("Registered plugin translations");
    }
}
```

## When This Event Fires

The `GenerateDefaultLanguageEvent` is fired when:

1. **Server startup** - During the internationalization initialization phase
2. **Language generation** - When default translation files are being created
3. **Development mode** - When regenerating language files for asset export

The event allows handlers to:
- Add custom translation strings
- Contribute plugin localization data
- Register item/block names for the default language
- Provide UI text for custom features

## Understanding Translation Files

The translation system uses a file-based structure:
- Each file contains related translations (e.g., items, UI, messages)
- Keys use dot notation for organization (e.g., `myplugin.items.sword`)
- Values are the default language strings (typically English)

## Thread Safety

The internal `ConcurrentHashMap` ensures that multiple plugins can safely add translations simultaneously from different event handlers.

## Best Practices

```java
// Use consistent naming conventions
TranslationMap translations = new TranslationMap();

// Prefix all keys with your plugin name
translations.put("myplugin.category.key", "Translation text");

// Group related translations
translations.put("myplugin.ui.button.start", "Start Game");
translations.put("myplugin.ui.button.stop", "Stop Game");
translations.put("myplugin.ui.title.main", "Main Menu");

// Provide context in key names
translations.put("myplugin.error.item_not_found", "Item could not be found");
translations.put("myplugin.success.item_created", "Item created successfully");
```

## Use Cases

- **Plugin Localization**: Add translatable strings for plugin features
- **Custom Items**: Register display names for custom items/blocks
- **UI Text**: Provide text for custom user interfaces
- **Messages**: Add translatable server messages
- **Documentation**: Include in-game help text

## Related Events

- [BootEvent](../server/boot-event) - Fired during server startup
- [LoadAssetEvent](../asset/load-asset-event) - Fired during asset loading

## Source Reference

`decompiled/com/hypixel/hytale/server/core/modules/i18n/event/GenerateDefaultLanguageEvent.java`
