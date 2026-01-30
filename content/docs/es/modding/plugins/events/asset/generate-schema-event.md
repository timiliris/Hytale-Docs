---
id: generate-schema-event
title: GenerateSchemaEvent
sidebar_label: GenerateSchemaEvent
---

# GenerateSchemaEvent

Fired when the server generates JSON schemas for asset validation. This event allows plugins to contribute custom schemas for their configuration files, enabling IDE autocompletion and validation support.

## Event Information

| Property | Value |
|----------|-------|
| **Full Class Name** | `com.hypixel.hytale.server.core.asset.GenerateSchemaEvent` |
| **Parent Class** | `IEvent<Void>` |
| **Cancellable** | No |
| **Async** | No |
| **Source File** | `decompiled/com/hypixel/hytale/server/core/asset/GenerateSchemaEvent.java` |

## Declaration

```java
public class GenerateSchemaEvent implements IEvent<Void> {
```

## Fields

| Field | Type | Accessor | Description |
|-------|------|----------|-------------|
| `schemas` | `Map<String, Schema>` | N/A (protected) | Map of schema file names to schema definitions |
| `context` | `SchemaContext` | `getContext()` | The schema generation context |
| `vsCodeConfig` | `BsonDocument` | `getVsCodeConfig()` | VSCode configuration document for schema associations |

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getContext` | `public SchemaContext getContext()` | Returns the schema generation context |
| `getVsCodeConfig` | `public BsonDocument getVsCodeConfig()` | Returns the VSCode configuration document |
| `addSchemaLink` | `public void addSchemaLink(String name, List<String> paths, String extension)` | Links a schema to file paths with optional extension mapping |
| `addSchema` | `public void addSchema(String fileName, Schema schema)` | Adds a new schema definition |

## Usage Example

```java
import com.hypixel.hytale.server.core.asset.GenerateSchemaEvent;
import com.hypixel.hytale.codec.schema.config.Schema;
import com.hypixel.hytale.event.EventBus;
import com.hypixel.hytale.event.EventPriority;
import java.util.Arrays;

public class CustomSchemaPlugin extends PluginBase {

    @Override
    public void onEnable() {
        EventBus.register(GenerateSchemaEvent.class, this::onGenerateSchema, EventPriority.NORMAL);
    }

    private void onGenerateSchema(GenerateSchemaEvent event) {
        // Create a custom schema for plugin configuration
        Schema pluginConfigSchema = createPluginConfigSchema(event.getContext());

        // Add the schema to the generation
        event.addSchema("my-plugin-config", pluginConfigSchema);

        // Link the schema to specific file paths
        event.addSchemaLink(
            "my-plugin-config",
            Arrays.asList(
                "Plugins/MyPlugin/*.json",
                "Plugins/MyPlugin/config.json"
            ),
            ".json"
        );

        getLogger().info("Registered custom plugin schema");
    }

    private Schema createPluginConfigSchema(SchemaContext context) {
        // Build schema definition for plugin config files
        // This enables IDE autocompletion and validation

        // Example schema structure (implementation depends on Schema API)
        return Schema.builder()
            .property("enabled", Schema.Type.BOOLEAN)
            .property("maxPlayers", Schema.Type.INTEGER)
            .property("settings", Schema.Type.OBJECT)
            .build();
    }
}
```

## When This Event Fires

The `GenerateSchemaEvent` is fired when:

1. **Schema generation** - When the server generates JSON schemas for IDE support
2. **Development mode** - Typically during development/editor mode operations
3. **Asset editor integration** - When preparing schemas for asset validation

The event allows handlers to:
- Add custom JSON schemas
- Link schemas to specific file patterns
- Configure VSCode file associations
- Enable validation for custom asset types

## Understanding Schema Links

The `addSchemaLink` method configures IDE integration:

```java
// Link schema to files matching the pattern
event.addSchemaLink(
    "my-schema",                              // Schema name
    Arrays.asList("MyPlugin/**/*.json"),      // File path patterns
    ".json"                                   // File extension
);
```

This generates VSCode configuration that:
- Associates matching files with the schema
- Maps non-JSON extensions to JSON mode if specified
- Enables autocompletion and validation in the IDE

## VSCode Configuration

The event builds a VSCode `settings.json` structure:

```json
{
    "json.schemas": [
        {
            "fileMatch": ["/Server/Plugins/MyPlugin/*.json"],
            "url": "./Schema/my-plugin-config.json"
        }
    ],
    "files.associations": {
        "*.myext": "json"
    }
}
```

## Use Cases

- **Plugin Configuration**: Define schemas for plugin config files
- **Custom Assets**: Validate custom asset file formats
- **IDE Support**: Enable autocompletion for modders using your plugin
- **Documentation**: Schemas serve as machine-readable documentation
- **Validation**: Catch configuration errors before runtime

## Related Events

- [LoadAssetEvent](./load-asset-event) - Fired during asset loading
- [GenerateAssetsEvent](./generate-assets-event) - Fired when assets are generated

## Source Reference

`decompiled/com/hypixel/hytale/server/core/asset/GenerateSchemaEvent.java`
