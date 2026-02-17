---
id: ecs-framework
title: "ECS and Core Framework Reference"
sidebar_label: ECS Framework
sidebar_position: 14
description: Documentation of the Hytale server ECS architecture and core framework internals - Entity reference system, registry lifecycle, schema metadata, new components, procedural library, event system, and module initialization order.
---

# ECS and Core Framework Reference

This page documents the Entity Component System (ECS) architecture and core framework internals of the Hytale dedicated server. It covers the low-level component reference system, registry lifecycle management, the schema metadata pipeline, new components, procedural generation utilities, the event system, and the module initialization order.

All code references point to decompiled sources under `decompiled/com/hypixel/hytale/`.

---

## Table of Contents

1. [Ref -- Entity Reference System](#1-ref----entity-reference-system)
2. [Registry Lifecycle](#2-registry-lifecycle)
3. [Schema Metadata System](#3-schema-metadata-system)
4. [Schema Config System](#4-schema-config-system)
5. [New Components](#5-new-components)
6. [Procedural Library Changes](#6-procedural-library-changes)
7. [Event System](#7-event-system)
8. [Core Module Initialization Order](#8-core-module-initialization-order)

---

## 1. Ref -- Entity Reference System

**Source:** `component/Ref.java`

The `Ref` class is the fundamental handle through which game code accesses entities in the ECS. Every entity in a `Store` is referenced by index through a `Ref`. The class is generic, parameterized by the ECS type. It is designed for high-throughput access in tight game loops.

### 1.1 Class Structure

```java
// component/Ref.java, lines 6-68
public class Ref<ECS_TYPE> {
   public static final Ref<?>[] EMPTY_ARRAY = new Ref[0];
   @Nonnull
   private final Store<ECS_TYPE> store;
   private volatile int index;
   private volatile Throwable invalidatedBy;
   // ...
}
```

Key design decisions:

- **`volatile int index`** -- The index field is declared `volatile`, meaning reads and writes are visible across threads without synchronization. This is critical because the ECS processes entities across multiple threads during parallel system ticks.
- **`volatile Throwable invalidatedBy`** -- Stores the stack trace from the point of invalidation, providing diagnostic information when a stale reference is used.
- **`EMPTY_ARRAY`** -- A pre-allocated empty array constant avoids repeated allocation of zero-length `Ref` arrays.

### 1.2 Construction and Sentinel Value

```java
// component/Ref.java, lines 13-20
public Ref(@Nonnull Store<ECS_TYPE> store) {
   this(store, -2147483648);  // Integer.MIN_VALUE as sentinel
}

public Ref(@Nonnull Store<ECS_TYPE> store, int index) {
   this.store = store;
   this.index = index;
}
```

The sentinel value `Integer.MIN_VALUE` (`-2147483648`) marks an uninitialized or invalidated reference. Constructing a `Ref` with only a `Store` creates it in the invalid state by default, requiring explicit assignment before use.

### 1.3 Invalidation Mechanism

```java
// component/Ref.java, lines 35-43
void invalidate() {
   this.index = -2147483648;
   this.invalidatedBy = new Throwable();
}

void invalidate(@Nullable Throwable invalidatedBy) {
   this.index = -2147483648;
   this.invalidatedBy = invalidatedBy != null ? invalidatedBy : new Throwable();
}
```

When an entity is destroyed or its reference becomes stale, the `Store` calls `invalidate()`. The method:

1. Resets the index to the sentinel value.
2. Captures a `Throwable` at the point of invalidation. This stack trace is later attached to the `IllegalStateException` thrown if the reference is accessed, making debugging significantly easier.

The overloaded variant accepts an external `Throwable` (e.g., the cause of entity removal), falling back to creating a new one if `null` is passed.

### 1.4 Validation

```java
// component/Ref.java, lines 45-57
public void validate(@Nonnull Store<ECS_TYPE> store) {
   if (this.store != store) {
      throw new IllegalStateException("Incorrect store for entity reference");
   } else if (this.index == -2147483648) {
      throw new IllegalStateException("Invalid entity reference!", this.invalidatedBy);
   }
}

public void validate() {
   if (this.index == -2147483648) {
      throw new IllegalStateException("Invalid entity reference!", this.invalidatedBy);
   }
}
```

Two validation overloads exist:

- **`validate(Store)`** -- The full validation checks both that the reference belongs to the correct store (identity comparison with `!=`) AND that the index is not the sentinel. Use this when you receive a `Ref` from external code and need to verify store ownership.
- **`validate()`** -- The simplified validation skips the store check and only verifies the index. This is used in hot paths within systems that already know which store they operate on.

Both methods chain the original invalidation `Throwable` as the cause of the thrown exception, enabling a developer to trace exactly when and where the reference was invalidated.

### 1.5 Validity Check

```java
// component/Ref.java, lines 59-61
public boolean isValid() {
   return this.index != -2147483648;
}
```

A non-throwing check for use in conditional logic. Common pattern:

```java
if (entityRef.isValid()) {
    TransformComponent transform = commandBuffer.getComponent(entityRef, TransformComponent.getComponentType());
    // use transform...
}
```

### 1.6 The Component Interface

Entity components implement the `Component` interface:

```java
// component/Component.java, lines 6-17
public interface Component<ECS_TYPE> extends Cloneable {
   @Nonnull
   Component[] EMPTY_ARRAY = new Component[0];

   @Nullable
   Component<ECS_TYPE> clone();

   @Nullable
   default Component<ECS_TYPE> cloneSerializable() {
      return this.clone();
   }
}
```

All components must be cloneable. The `cloneSerializable()` default delegates to `clone()` but can be overridden for components that serialize differently than they clone in-memory.

---

## 2. Registry Lifecycle

**Source:** `registry/Registry.java`

The `Registry` abstract class manages the lifecycle of registrations (event handlers, systems, etc.) within modules. It provides enable/disable semantics and a new bulk cleanup method.

### 2.1 Core Structure

```java
// registry/Registry.java, lines 10-33
public abstract class Registry<T extends Registration> {
   @Nonnull
   private final BooleanSupplier precondition;
   @Nullable
   private final String preconditionMessage;
   private final Registry.RegistrationWrapFunction<T> wrappingFunction;
   @Nonnull
   private final List<BooleanConsumer> registrations;
   @Nonnull
   private final List<BooleanConsumer> unmodifiableRegistrations;
   private boolean enabled = true;

   protected Registry(
      @Nonnull List<BooleanConsumer> registrations,
      @Nonnull BooleanSupplier precondition,
      @Nullable String preconditionMessage,
      @Nonnull Registry.RegistrationWrapFunction<T> wrappingFunction
   ) { /* ... */ }
}
```

Notable annotations:

- **`@Nullable String preconditionMessage`** -- The precondition message parameter is explicitly marked `@Nullable`, indicating this is optional diagnostic text shown when a registration is attempted while the precondition fails.
- The wrapping function `RegistrationWrapFunction` is a functional interface that allows each `Registration` to be decorated with lifecycle hooks.

### 2.2 Registration Flow

```java
// registry/Registry.java, lines 63-75
public T register(@Nonnull T registration) {
   if (!this.enabled) {
      registration.unregister();
      throw new IllegalStateException("Registry is not enabled!");
   } else {
      BooleanConsumer reg = v -> registration.unregister();
      this.registrations.add(reg);
      return this.wrappingFunction.wrap(registration, () -> this.enabled || registration.isRegistered(), () -> {
         this.registrations.remove(reg);
         registration.unregister();
      });
   }
}
```

When registering:

1. If the registry is disabled, the registration is immediately unregistered and an exception is thrown.
2. A `BooleanConsumer` wrapper is created that calls `unregister()` on the registration.
3. The wrapping function decorates the registration with an `isEnabled` supplier (which returns `true` if the registry is still enabled OR the registration itself is still active) and an unregister callback.

### 2.3 The shutdownAndCleanup Method

```java
// registry/Registry.java, lines 53-61
public void shutdownAndCleanup(boolean shutdown) {
   this.enabled = false;

   for (int i = this.registrations.size() - 1; i >= 0; i--) {
      this.registrations.get(i).accept(shutdown);
   }

   this.registrations.clear();
}
```

This method performs a complete teardown:

1. **Disables** the registry (preventing new registrations).
2. **Iterates registrations in reverse order** (LIFO -- last registered, first cleaned up), passing the `shutdown` boolean to each. This ensures proper dependency ordering during teardown.
3. **Clears** the registration list, releasing all references.

The `boolean shutdown` parameter is forwarded to each `BooleanConsumer`, allowing registrations to distinguish between a full server shutdown and a module-level disable.

Compare this with the simple `shutdown()` which only sets the flag:

```java
// registry/Registry.java, lines 49-51
public void shutdown() {
   this.enabled = false;
}
```

### 2.4 Registration Base Class

```java
// registry/Registration.java, lines 6-35
public class Registration {
   @Nonnull
   protected final BooleanSupplier isEnabled;
   @Nonnull
   protected final Runnable unregister;
   private boolean registered = true;

   public void unregister() {
      if (this.registered && this.isEnabled.getAsBoolean()) {
         this.unregister.run();
      }
      this.registered = false;
   }

   public boolean isRegistered() {
      return this.registered && this.isEnabled.getAsBoolean();
   }
}
```

A `Registration` is only truly active when both `registered` is `true` and the `isEnabled` supplier (provided by the wrapping function) returns `true`. This double-check prevents stale unregister calls from executing after a registry has been shut down.

---

## 3. Schema Metadata System

**Source:** `codec/schema/metadata/`

The schema metadata system provides annotations that modify JSON schema output. These are used to drive Hytale's content editor tools and to generate data-driven configuration schemas for assets. Every metadata class implements the `Metadata` interface.

### 3.1 The Metadata Interface

```java
// codec/schema/metadata/Metadata.java, lines 5-7
public interface Metadata {
   void modify(Schema var1);
}
```

All metadata implementations receive a `Schema` instance and mutate it. This is a visitor-like pattern: metadata objects are applied to schemas during schema generation to inject tool-specific annotations.

### 3.2 Core Metadata Types

#### HytaleType

Sets the Hytale-specific type identifier on a schema:

```java
// codec/schema/metadata/HytaleType.java, lines 6-17
public class HytaleType implements Metadata {
   private final String type;

   public HytaleType(String type) {
      this.type = type;
   }

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setType(this.type);
   }
}
```

This maps to the `hytale.type` field in the serialized JSON schema, identifying which Hytale asset type a schema represents.

#### VirtualPath

Assigns a virtual filesystem path to a schema, used for asset resolution:

```java
// codec/schema/metadata/VirtualPath.java, lines 6-17
public class VirtualPath implements Metadata {
   private final String path;

   public VirtualPath(String path) {
      this.path = path;
   }

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setVirtualPath(this.path);
   }
}
```

#### AllowEmptyObject

Controls whether an empty `{}` is valid for object schemas:

```java
// codec/schema/metadata/AllowEmptyObject.java, lines 6-18
public class AllowEmptyObject implements Metadata {
   public static final AllowEmptyObject INSTANCE = new AllowEmptyObject(true);
   private final boolean allowEmptyObject;

   public AllowEmptyObject(boolean allowEmptyObject) {
      this.allowEmptyObject = allowEmptyObject;
   }

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setAllowEmptyObject(this.allowEmptyObject);
   }
}
```

The singleton `INSTANCE` is pre-configured with `true`. This is used for optional configuration objects where an empty object is a valid "use all defaults" pattern.

#### NoDefaultValue

Removes the default value from a schema. Uses the singleton pattern and dispatches based on schema type:

```java
// codec/schema/metadata/NoDefaultValue.java, lines 9-27
public class NoDefaultValue implements Metadata {
   public static final NoDefaultValue INSTANCE = new NoDefaultValue();

   private NoDefaultValue() {}

   @Override
   public void modify(Schema schema) {
      if (schema instanceof StringSchema) {
         ((StringSchema)schema).setDefault(null);
      } else if (schema instanceof IntegerSchema) {
         ((IntegerSchema)schema).setDefault(null);
      } else if (schema instanceof NumberSchema) {
         ((NumberSchema)schema).setDefault(null);
      } else if (schema instanceof BooleanSchema) {
         ((BooleanSchema)schema).setDefault(null);
      }
   }
}
```

This is applied to fields where leaving the default unset is semantically meaningful (e.g., a field that must be explicitly provided by content creators).

### 3.3 UI Metadata Types

All UI metadata classes live in `codec/schema/metadata/ui/` and control how the Hytale content editor renders schema-driven forms.

#### UIDisplayMode

Controls the visual density of a field in the editor:

```java
// codec/schema/metadata/ui/UIDisplayMode.java, lines 7-30
public class UIDisplayMode implements Metadata {
   public static final UIDisplayMode NORMAL = new UIDisplayMode(DisplayMode.NORMAL);
   public static final UIDisplayMode COMPACT = new UIDisplayMode(DisplayMode.COMPACT);
   public static final UIDisplayMode HIDDEN = new UIDisplayMode(DisplayMode.HIDDEN);

   private final DisplayMode mode;

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setUiDisplayMode(this.mode);
   }

   public static enum DisplayMode {
      NORMAL,
      COMPACT,
      HIDDEN;
   }
}
```

Three modes are available:

| Mode | Behavior |
|------|----------|
| `NORMAL` | Full-size editor field |
| `COMPACT` | Reduced-size inline display |
| `HIDDEN` | Field is not shown in the editor UI |

#### UIEditor

Defines which editor component to render. Supports multiple specialized editor types:

```java
// codec/schema/metadata/ui/UIEditor.java, lines 11-35 (init method)
public class UIEditor implements Metadata {
   public static void init() {
      CODEC.register("Timeline", Timeline.class, Timeline.CODEC);
      CODEC.register("WeightedTimeline", WeightedTimeline.class, WeightedTimeline.CODEC);
      CODEC.register("Number", FormattedNumber.class, FormattedNumber.CODEC);
      CODEC.register("Text", TextField.class, TextField.CODEC);
      CODEC.register("MultilineText", MultilineTextField.class, MultilineTextField.CODEC);
      CODEC.register("Dropdown", Dropdown.class, Dropdown.CODEC);
      CODEC.register("Icon", Icon.class, Icon.CODEC);
      CODEC.register("LocalizationKey", LocalizationKeyField.class, LocalizationKeyField.CODEC);
   }
}
```

Available editor components:

| Component | Purpose |
|-----------|---------|
| `Timeline` | Keyframe-based timeline editor |
| `WeightedTimeline` | Timeline with weight values |
| `Number` | Number with step, suffix, decimal places |
| `Text` | Single-line text with optional data set |
| `MultilineText` | Multi-line text area |
| `Dropdown` | Dropdown populated from a data set |
| `Icon` | Image/icon picker with configurable dimensions |
| `LocalizationKey` | Localization key editor with template support |

The `FormattedNumber` component is notable for its fluent API:

```java
// codec/schema/metadata/ui/UIEditor.java, lines 54-90
public static class FormattedNumber implements EditorComponent {
   private Double step;
   private String suffix;
   private Integer maxDecimalPlaces;

   @Nonnull
   public FormattedNumber setStep(Double step) {
      this.step = step;
      return this;
   }

   @Nonnull
   public FormattedNumber setSuffix(String suffix) {
      this.suffix = suffix;
      return this;
   }

   @Nonnull
   public FormattedNumber setMaxDecimalPlaces(Integer maxDecimalPlaces) {
      this.maxDecimalPlaces = maxDecimalPlaces;
      return this;
   }
}
```

#### UIEditorFeatures

Enables specialized editor features, currently targeting weather configuration:

```java
// codec/schema/metadata/ui/UIEditorFeatures.java, lines 7-26
public class UIEditorFeatures implements Metadata {
   private final EditorFeature[] features;

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setUiEditorFeatures(this.features);
   }

   public static enum EditorFeature {
      WEATHER_DAYTIME_BAR,
      WEATHER_PREVIEW_LOCAL;
   }
}
```

#### UIEditorPreview

Defines the 3D preview renderer for an asset in the editor:

```java
// codec/schema/metadata/ui/UIEditorPreview.java, lines 7-28
public class UIEditorPreview implements Metadata {
   private final PreviewType previewType;

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setUiEditorPreview(this.previewType);
   }

   public static enum PreviewType {
      ITEM,
      MODEL,
      REVERB_EFFECT,
      EQUALIZER_EFFECT;
   }
}
```

| Preview Type | Use Case |
|-------------|----------|
| `ITEM` | Renders an item icon preview |
| `MODEL` | Full 3D model preview |
| `REVERB_EFFECT` | Audio reverb visualization |
| `EQUALIZER_EFFECT` | Audio equalizer visualization |

#### UIRebuildCaches

Specifies which client-side caches must be invalidated when a property changes:

```java
// codec/schema/metadata/ui/UIRebuildCaches.java, lines 7-36
public class UIRebuildCaches implements Metadata {
   private final ClientCache[] caches;
   private final boolean appliesToChildProperties;

   public UIRebuildCaches(ClientCache... caches) {
      this(true, caches);
   }

   public UIRebuildCaches(boolean appliesToChildProperties, ClientCache... caches) {
      this.caches = caches;
      this.appliesToChildProperties = appliesToChildProperties;
   }

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setUiRebuildCaches(this.caches);
      schema.getHytale().setUiRebuildCachesForChildProperties(this.appliesToChildProperties);
   }

   public static enum ClientCache {
      BLOCK_TEXTURES,
      MODELS,
      MODEL_TEXTURES,
      MAP_GEOMETRY,
      ITEM_ICONS;
   }
}
```

The `appliesToChildProperties` flag (defaults to `true`) determines whether nested properties also trigger the same cache invalidation.

#### UIButton

Used by both `UICreateButtons` and `UISidebarButtons` to define clickable buttons in the editor:

```java
// codec/schema/metadata/ui/UIButton.java, lines 7-24
public class UIButton {
   public static final BuilderCodec<UIButton> CODEC = BuilderCodec.builder(UIButton.class, UIButton::new)
      .append(new KeyedCodec<>("textId", Codec.STRING, false, true), (o, i) -> o.textId = i, o -> o.textId)
      .add()
      .append(new KeyedCodec<>("buttonId", Codec.STRING, false, true), (o, i) -> o.buttonId = i, o -> o.buttonId)
      .add()
      .build();
   private String buttonId;
   private String textId;

   public UIButton(String textId, String buttonId) {
      this.textId = textId;
      this.buttonId = buttonId;
   }
}
```

#### Other UI Metadata

| Class | Purpose | Schema Field |
|-------|---------|-------------|
| `UIPropertyTitle` | Custom display title for a property | `hytale.uiPropertyTitle` |
| `UITypeIcon` | Icon identifier for a type in the editor | `hytale.uiTypeIcon` |
| `UIEditorSectionStart` | Begins a named section group in the editor | `hytale.uiSectionStart` |
| `UIDefaultCollapsedState` | Controls initial collapsed state of sections | `hytale.uiCollapsedByDefault` |

```java
// codec/schema/metadata/ui/UIDefaultCollapsedState.java, lines 7-19
public class UIDefaultCollapsedState implements Metadata {
   public static final UIDefaultCollapsedState UNCOLLAPSED = new UIDefaultCollapsedState(false);
   private final boolean collapsedByDefault;

   @Override
   public void modify(@Nonnull Schema schema) {
      schema.getHytale().setUiCollapsedByDefault(this.collapsedByDefault);
   }
}
```

---

## 4. Schema Config System

**Source:** `codec/schema/config/`

The schema config system implements a JSON Schema-like type hierarchy for defining and validating Hytale's data-driven configuration format. The base `Schema` class supports JSON Schema keywords (`anyOf`, `oneOf`, `allOf`, `$ref`, etc.) alongside Hytale-specific extensions.

### 4.1 Schema Base Class

```java
// codec/schema/config/Schema.java, lines 31-32
public class Schema {
   public static final ObjectCodecMapCodec<String, Schema> CODEC = new ObjectCodecMapCodec<>("type", new StringOrBlank(), true, false);
   public static final ArrayCodec<Schema> ARRAY_CODEC = new ArrayCodec<>(CODEC, Schema[]::new);
```

The `CODEC` is a polymorphic codec that dispatches on the `type` field. The `ARRAY_CODEC` handles arrays of schema objects.

#### Schema Registration (Type Dispatch)

```java
// codec/schema/config/Schema.java, lines 464-474
public static void init() {
   CODEC.register(Priority.DEFAULT, "", Schema.class, BASE_CODEC);
   CODEC.register("null", NullSchema.class, NullSchema.CODEC);
   CODEC.register("string", StringSchema.class, StringSchema.CODEC);
   CODEC.register("number", NumberSchema.class, NumberSchema.CODEC);
   CODEC.register("integer", IntegerSchema.class, IntegerSchema.CODEC);
   CODEC.register("array", ArraySchema.class, ArraySchema.CODEC);
   CODEC.register("boolean", BooleanSchema.class, BooleanSchema.CODEC);
   CODEC.register("object", ObjectSchema.class, ObjectSchema.CODEC);
   UIEditor.init();
}
```

#### HytaleMetadata Inner Class

The `Schema.HytaleMetadata` inner class carries all Hytale-specific schema extensions:

```java
// codec/schema/config/Schema.java, lines 520-576 (CODEC definition)
public static class HytaleMetadata {
   private String type;
   private String path;
   private String virtualPath;
   private String extension;
   private String idProvider;
   private String[] internalKeys;
   private Boolean inheritsProperty;
   private Boolean mergesProperties;
   private UIEditorFeatures.EditorFeature[] uiEditorFeatures;
   private UIEditorPreview.PreviewType uiEditorPreview;
   private String uiTypeIcon;
   private Boolean uiEditorIgnore;
   private Boolean allowEmptyObject;
   private UIDisplayMode.DisplayMode uiDisplayMode;
   private UIEditor.EditorComponent uiEditorComponent;
   private String uiPropertyTitle;
   private String uiSectionStart;
   private UIRebuildCaches.ClientCache[] uiRebuildCaches;
   private Boolean uiRebuildCachesForChildProperties;
   private UIButton[] uiSidebarButtons;
   private Boolean uiCollapsedByDefault;
   private UIButton[] uiCreateButtons;
}
```

This is serialized under the `"hytale"` key in the JSON schema output and aggregates all the UI and asset metadata described in Section 3.

### 4.2 Schema Type Hierarchy

All schema types extend `Schema` and add type-specific fields:

#### ObjectSchema

```java
// codec/schema/config/ObjectSchema.java, lines 11-18
public class ObjectSchema extends Schema {
   public static final BuilderCodec<ObjectSchema> CODEC = BuilderCodec.builder(
         ObjectSchema.class, ObjectSchema::new, Schema.BASE_CODEC)
      .addField(new KeyedCodec<>("properties", new MapCodec<>(Schema.CODEC, LinkedHashMap::new), false, true), ...)
      .addField(new KeyedCodec<>("additionalProperties", new BooleanOrSchema(), false, true), ...)
      .addField(new KeyedCodec<>("propertyNames", StringSchema.CODEC, false, true), ...)
      .build();
   private Map<String, Schema> properties;
   @Nullable
   private Object additionalProperties;
   private StringSchema propertyNames;
   private Schema unevaluatedProperties;
}
```

`ObjectSchema` uses `LinkedHashMap` for `properties` to preserve insertion order (important for UI rendering). The `additionalProperties` field is polymorphic -- it can be either a `Boolean` (to allow/disallow extra properties) or a `Schema` (to validate extra properties against).

#### ArraySchema

```java
// codec/schema/config/ArraySchema.java, lines 13-19
public class ArraySchema extends Schema {
   public static final BuilderCodec<ArraySchema> CODEC = BuilderCodec.builder(
         ArraySchema.class, ArraySchema::new, Schema.BASE_CODEC)
      .addField(new KeyedCodec<>("items", new ItemOrItems(), false, true), ...)
      .addField(new KeyedCodec<>("minItems", Codec.INTEGER, false, true), ...)
      .addField(new KeyedCodec<>("maxItems", Codec.INTEGER, false, true), ...)
      .addField(new KeyedCodec<>("uniqueItems", Codec.BOOLEAN, false, true), ...)
      .build();
}
```

The `items` field uses the inner `ItemOrItems` codec that accepts either a single `Schema` or an array of schemas (tuple validation), matching JSON Schema semantics.

#### StringSchema

```java
// codec/schema/config/StringSchema.java, lines 11-21
public class StringSchema extends Schema {
   // Fields: pattern, enum_, const_, default_, minLength, maxLength, hytaleCommonAsset, hytaleCosmeticAsset
}
```

Hytale-specific extensions:
- **`hytaleCommonAsset`** -- A `CommonAsset` object specifying required file roots, extensions, and whether the asset is UI-related.
- **`hytaleCosmeticAsset`** -- A string identifier for cosmetic asset validation.

The `CommonAsset` inner class:

```java
// codec/schema/config/StringSchema.java, lines 168-198
public static class CommonAsset {
   private String[] requiredRoots;
   private String requiredExtension;
   private boolean isUIAsset;

   public CommonAsset(String requiredExtension, boolean isUIAsset, String... requiredRoots) {
      this.requiredRoots = requiredRoots;
      this.requiredExtension = requiredExtension;
      this.isUIAsset = isUIAsset;
   }
}
```

#### NumberSchema and IntegerSchema

Both support `minimum`, `exclusiveMinimum`, `maximum`, `exclusiveMaximum`, `enum`, `const`, and `default`. Their boundary values (`minimum`, etc.) are polymorphic -- they can be either numeric literals or `Schema` references (for dynamic data-driven bounds):

```java
// codec/schema/config/NumberSchema.java, lines 14-26
public class NumberSchema extends Schema {
   // minimum, exclusiveMinimum, maximum, exclusiveMaximum are type Object
   // Can be set as double OR as Schema
   public void setMinimum(double minimum) { this.minimum = minimum; }
   public void setMinimum(Schema minimum) { this.minimum = minimum; }
}
```

#### BooleanSchema and NullSchema

Minimal schemas:

```java
// codec/schema/config/BooleanSchema.java -- adds only default_
// codec/schema/config/NullSchema.java -- no additional fields, singleton INSTANCE
public class NullSchema extends Schema {
   public static final NullSchema INSTANCE = new NullSchema();
}
```

### 4.3 SchemaContext and SchemaConvertable

The `SchemaContext` manages definition deduplication during schema generation:

```java
// codec/schema/SchemaContext.java, lines 15-26
public class SchemaContext {
   @Nonnull
   private final Map<String, Schema> definitions = new Object2ObjectLinkedOpenHashMap<>();
   @Nonnull
   private final Map<String, Schema> otherDefinitions = new Object2ObjectLinkedOpenHashMap<>();
   @Nonnull
   private final Map<Object, String> nameMap = new Object2ObjectOpenHashMap<>();
   @Nonnull
   private final Object2IntMap<String> nameCollisionCount = new Object2IntOpenHashMap<>();
   @Nonnull
   private final Map<SchemaConvertable<?>, String> fileReferences = new Object2ObjectOpenHashMap<>();
}
```

When resolving a definition reference, the context checks for file-level references first, then creates `$ref` pointers to either `common.json#/definitions/` or `other.json#/definitions/`.

Name collision handling appends `@N` suffixes:

```java
// codec/schema/SchemaContext.java, lines 97-104
private String resolveName(@Nonnull NamedSchema namedSchema) {
   return this.nameMap.computeIfAbsent(namedSchema, key -> {
      String n = ((NamedSchema)key).getSchemaName();
      int count = this.nameCollisionCount.getInt(n);
      this.nameCollisionCount.put(n, count + 1);
      return count > 0 ? n + "@" + count : n;
   });
}
```

Any codec can participate in schema generation by implementing `SchemaConvertable`:

```java
// codec/schema/SchemaConvertable.java, lines 7-15
public interface SchemaConvertable<T> {
   @Nonnull
   Schema toSchema(@Nonnull SchemaContext var1);

   @Nonnull
   default Schema toSchema(@Nonnull SchemaContext context, @Nullable T def) {
      return this.toSchema(context);
   }
}
```

---

## 5. New Components

### 5.1 NPCMarkerComponent

**Source:** `server/core/modules/entity/component/NPCMarkerComponent.java`

A marker component that tags entities as NPCs. Marked `@Deprecated(forRemoval = true)`, indicating it is being phased out in favor of a different NPC identification mechanism.

```java
// server/core/modules/entity/component/NPCMarkerComponent.java, lines 9-31
@Deprecated(forRemoval = true)
public class NPCMarkerComponent implements Component<EntityStore> {
   private static final NPCMarkerComponent INSTANCE = new NPCMarkerComponent();

   public static ComponentType<EntityStore, NPCMarkerComponent> getComponentType() {
      return EntityModule.get().getNPCMarkerComponentType();
   }

   public static NPCMarkerComponent get() {
      return INSTANCE;
   }

   @Nonnull
   @Override
   public Component<EntityStore> clone() {
      return this;  // Marker component -- singleton, no mutable state
   }
}
```

Key characteristics:
- **Singleton pattern** -- `clone()` returns `this` because the component carries no mutable data.
- **Static accessor** -- `getComponentType()` retrieves the `ComponentType` from the `EntityModule` singleton.
- **Deprecation** -- The `forRemoval = true` flag signals this will be removed in a future version. Plugin developers should watch for its replacement.

### 5.2 TeleportRecord

**Source:** `server/core/modules/entity/teleport/TeleportRecord.java`

Tracks the most recent teleportation event for an entity, storing both origin and destination with nanosecond-precision timing.

```java
// server/core/modules/entity/teleport/TeleportRecord.java, lines 12-54
public class TeleportRecord implements Component<EntityStore> {
   private TeleportRecord.Entry lastTeleport;

   public static ComponentType<EntityStore, TeleportRecord> getComponentType() {
      return EntityModule.get().getTeleportRecordComponentType();
   }

   @Nullable
   public TeleportRecord.Entry getLastTeleport() {
      return this.lastTeleport;
   }

   public void setLastTeleport(TeleportRecord.Entry lastTeleport) {
      this.lastTeleport = lastTeleport;
   }

   public boolean hasElapsedSinceLastTeleport(Duration duration) {
      return this.hasElapsedSinceLastTeleport(System.nanoTime(), duration);
   }

   public boolean hasElapsedSinceLastTeleport(long nowNanos, Duration duration) {
      if (this.lastTeleport == null) {
         return true;
      } else {
         long elapsedNanos = nowNanos - this.lastTeleport.timestampNanos();
         return elapsedNanos >= duration.toNanos();
      }
   }

   @Override
   public Component<EntityStore> clone() {
      TeleportRecord clone = new TeleportRecord();
      clone.lastTeleport = this.lastTeleport;
      return clone;
   }

   public static record Entry(Location origin, Location destination, long timestampNanos) {}
}
```

The `Entry` record is a compact, immutable data carrier:
- `origin` -- The `Location` the entity teleported from.
- `destination` -- The `Location` the entity teleported to.
- `timestampNanos` -- The `System.nanoTime()` value when the teleport occurred.

The `hasElapsedSinceLastTeleport()` method enables cooldown checks: "Has enough time passed since the last teleport?" If no teleport has ever been recorded (`lastTeleport == null`), it returns `true`.

### 5.3 RunOnBlockTypesInteraction

**Source:** `server/core/modules/interaction/interaction/config/server/RunOnBlockTypesInteraction.java`

A server-side interaction that searches for blocks matching specified `BlockSet` types within a radius and runs child interactions on each found block. Uses **reservoir sampling** to cap the maximum number of selected blocks.

Configuration fields:

| Field | Type | Description |
|-------|------|-------------|
| `Range` | `int` | Spherical radius to search (must be positive) |
| `BlockSets` | `String[]` | Array of `BlockSet` identifiers to match |
| `MaxCount` | `int` | Maximum number of blocks to select (must be positive) |
| `Interactions` | `String` | Interaction chain to run on each found block |

#### Reservoir Sampling Algorithm

The `BlockSearchConsumer` inner class implements reservoir sampling (Vitter's Algorithm R) to uniformly select up to `MaxCount` blocks from the set of all matching blocks without knowing the total count in advance:

```java
// RunOnBlockTypesInteraction.java, lines 347-369
@Override
public void accept(int blockIndex) {
   // ... convert blockIndex to world coordinates ...
   if (dx * dx + dy * dy + dz * dz <= this.radiusSquared) {
      if (this.picked.size() < this.maxCount) {
         this.picked.add(new Vector3i(worldX, worldY, worldZ));
      } else {
         int j = ThreadLocalRandom.current().nextInt(this.seen + 1);
         if (j < this.maxCount) {
            this.picked.set(j, new Vector3i(worldX, worldY, worldZ));
         }
      }
      this.seen++;
   }
}
```

The search iterates over world chunks in 32-block increments, checking `BlockSection` objects for matching block IDs before drilling into individual blocks. This coarse-to-fine approach minimizes unnecessary block-level iteration.

---

## 6. Procedural Library Changes

**Source:** `procedurallib/`

The procedural generation library (`procedurallib`) provides noise functions, coordinate randomizers, and file I/O utilities. Notable changes include the `JsonResourceLoader` and the new `file/` subdirectory for asset resolution.

### 6.1 JsonResourceLoader

**Source:** `procedurallib/json/JsonResourceLoader.java`

A typed JSON asset loader that reads an `InputStream`, parses it with GSON in lenient mode, validates the result, and maps it to a typed `JsonElement`:

```java
// procedurallib/json/JsonResourceLoader.java, lines 17-52
public class JsonResourceLoader<T extends JsonElement> implements AssetLoader<T> {
   private final Class<T> type;
   private final Predicate<JsonElement> predicate;
   private final Function<JsonElement, T> mapper;

   public JsonResourceLoader(@Nonnull Class<T> type, @Nonnull Predicate<JsonElement> predicate,
                              @Nonnull Function<JsonElement, T> mapper) {
      this.type = type;
      this.predicate = predicate;
      this.mapper = mapper;
   }

   @Nonnull
   public T load(@Nonnull InputStream in) throws IOException {
      try (JsonReader reader = new JsonReader(new BufferedReader(new InputStreamReader(in)))) {
         reader.setStrictness(Strictness.LENIENT);
         JsonElement el = JsonParser.parseReader(reader);
         if (el == JsonNull.INSTANCE) {
            throw new IOException("Invalid JSON element: null");
         }
         if (!this.predicate.test(el)) {
            throw new IOException("Invalid JSON element type. Expected: " + this.type.getSimpleName());
         }
         return this.mapper.apply(el);
      }
   }
}
```

The three-parameter design separates concerns:
- `type` -- The expected `Class` token (e.g., `JsonObject.class`).
- `predicate` -- Validates the parsed element (e.g., `JsonElement::isJsonObject`).
- `mapper` -- Converts the element to the target type (e.g., `JsonElement::getAsJsonObject`).

### 6.2 File I/O Subsystem

**Source:** `procedurallib/file/`

The `file/` package provides a virtual filesystem abstraction for asset loading.

#### AssetLoader Interface

```java
// procedurallib/file/AssetLoader.java, lines 7-12
public interface AssetLoader<T> {
   Class<T> type();
   @Nonnull
   T load(@Nonnull InputStream var1) throws IOException;
}
```

#### AssetPath

Represents a resolved asset with both a relative path and an absolute filesystem path. Pre-computes its hash code for efficient use in hash-based collections:

```java
// procedurallib/file/AssetPath.java, lines 7-28
public final class AssetPath {
   private final Path path;       // relative path
   private final Path filepath;   // absolute filesystem path
   private final transient int hash;

   private AssetPath(@Nonnull Path path, @Nonnull Path filepath) {
      this.path = path;
      this.filepath = filepath;
      this.hash = FileIO.hashCode(path);  // cached hash from relative path
   }
}
```

The hash is computed once at construction using `FileIO.hashCode()`, which iterates over path segments:

```java
// procedurallib/file/FileIO.java, lines 139-151
static int hashCode(@Nullable Path path) {
   if (path == null) {
      return 0;
   } else {
      int hashcode = 1;
      for (int i = 0; i < path.getNameCount(); i++) {
         hashcode = hashcode * 31 + path.getName(i).toString().hashCode();
      }
      return hashcode;
   }
}
```

#### FileIOSystem

A thread-local virtual filesystem that supports multiple root paths for overlay/mod loading:

```java
// procedurallib/file/FileIOSystem.java, lines 11-65
public interface FileIOSystem extends AutoCloseable {
   @Nonnull
   Path baseRoot();

   @Nonnull
   PathArray roots();

   @Nonnull
   default AssetPath resolve(@Nonnull Path path) {
      Path relPath = FileIO.relativize(path, this.baseRoot());
      for (Path root : this.roots().paths) {
         AssetPath assetPath = AssetPath.fromRelative(root, relPath);
         if (FileIO.exists(assetPath)) {
            return assetPath;
         }
      }
      return AssetPath.fromRelative(this.baseRoot(), relPath);
   }
}
```

The `resolve()` method searches through roots in order, returning the first path that exists on disk. This enables mod overlay behavior: mod roots are searched before the base game root.

The `Provider` inner class uses `ThreadLocal` to provide per-thread filesystem contexts:

```java
// procedurallib/file/FileIOSystem.java, lines 66-87
public static final class Provider {
   private static final DefaultIOFileSystem DEFAULT = new DefaultIOFileSystem();
   private static final ThreadLocal<FileIOSystem> HOLDER = ThreadLocal.withInitial(() -> DEFAULT);

   static FileIOSystem get() { return HOLDER.get(); }
   static void set(@Nonnull FileIOSystem fs) { HOLDER.set(fs); }
   static void unset() { HOLDER.set(DEFAULT); }
   static void setRoot(@Nonnull Path path) { DEFAULT.setBase(path); }
}
```

---

## 7. Event System

**Source:** `event/EventRegistry.java`, `event/EventPriority.java`

### 7.1 EventPriority

```java
// event/EventPriority.java, lines 3-19
public enum EventPriority {
   FIRST((short)-21844),
   EARLY((short)-10922),
   NORMAL((short)0),
   LATE((short)10922),
   LAST((short)21844);

   private final short value;
}
```

Priorities are encoded as `short` values spread across the signed short range. This allows custom numeric priorities to be inserted between named ones using the `short priority` overloads.

### 7.2 EventRegistry

The `EventRegistry` extends `Registry` and delegates to a parent `IEventRegistry`:

```java
// event/EventRegistry.java, lines 13-22
public class EventRegistry extends Registry<EventRegistration<?, ?>> implements IEventRegistry {
   @Nonnull
   private final IEventRegistry parent;

   public EventRegistry(
      @Nonnull List<BooleanConsumer> registrations,
      @Nonnull BooleanSupplier precondition,
      @Nullable String preconditionMessage,
      @Nonnull IEventRegistry parent
   ) {
      super(registrations, precondition, preconditionMessage, EventRegistration::new);
      this.parent = parent;
   }
}
```

### 7.3 Registration Categories

The `EventRegistry` provides six categories of event registration, each available in three priority variants (named `EventPriority`, raw `short`, or default):

| Method | Key Type | Async | Scope |
|--------|----------|-------|-------|
| `register` | `Void` or typed | No | Key-specific |
| `registerGlobal` | Any (ignored) | No | All keys |
| `registerUnhandled` | Any (ignored) | No | Unhandled events only |
| `registerAsync` | `Void` or typed | Yes | Key-specific |
| `registerAsyncGlobal` | Any (ignored) | Yes | All keys |
| `registerAsyncUnhandled` | Any (ignored) | Yes | Unhandled events only |

Every method follows the same pattern:

1. Checks the registry precondition (throws `IllegalStateException` if violated).
2. Delegates to the parent `IEventRegistry` to create the actual registration.
3. Wraps the result through the `Registry.register()` lifecycle management.

Async variants use `Function` with `CompletableFuture` to chain asynchronous transformations.

---

## 8. Core Module Initialization Order

**Source:** `server/core/Constants.java`

The `CORE_PLUGINS` array defines the exact initialization order of all built-in server modules. The order matters because modules may depend on earlier modules being fully initialized.

```java
// server/core/Constants.java, lines 53-89
@Nonnull
public static final PluginManifest[] CORE_PLUGINS = new PluginManifest[]{
   ConsoleModule.MANIFEST,           // 1.  Console I/O
   PermissionsModule.MANIFEST,       // 2.  Permission system
   UpdateModule.MANIFEST,            // 3.  Server update checks
   FlyCameraModule.MANIFEST,         // 4.  Fly camera (debug/editor)
   AssetModule.MANIFEST,             // 5.  Core asset loading
   CommonAssetModule.MANIFEST,       // 6.  Common/shared assets
   CosmeticsModule.MANIFEST,         // 7.  Cosmetic items
   ServerManager.MANIFEST,           // 8.  Server I/O management
   I18nModule.MANIFEST,              // 9.  Internationalization
   ItemModule.MANIFEST,              // 10. Item system
   BlockTypeModule.MANIFEST,         // 11. Block type definitions
   LegacyModule.MANIFEST,            // 12. Legacy compatibility
   BlockModule.MANIFEST,             // 13. Block behavior
   BlockStateModule.MANIFEST,        // 14. Block state management
   CollisionModule.MANIFEST,         // 15. Collision detection
   BlockSetModule.MANIFEST,          // 16. Block set grouping
   MigrationModule.MANIFEST,         // 17. Data migration
   BlockHealthModule.MANIFEST,       // 18. Block health/durability
   PrefabSpawnerModule.MANIFEST,     // 19. Prefab spawning
   TimeModule.MANIFEST,              // 20. Time/tick management
   AnchorActionModule.MANIFEST,      // 21. Anchor actions
   InteractionModule.MANIFEST,       // 22. Interaction system
   EntityModule.MANIFEST,            // 23. Entity ECS core
   EntityStatsModule.MANIFEST,       // 24. Entity statistics
   EntityUIModule.MANIFEST,          // 25. Entity UI overlays
   DamageModule.MANIFEST,            // 26. Damage calculation
   SplitVelocity.MANIFEST,           // 27. Split velocity physics
   StaminaModule.MANIFEST,           // 28. Stamina system
   DebugPlugin.MANIFEST,             // 29. Debug tools
   ProjectileModule.MANIFEST,        // 30. Projectile physics
   ServerPlayerListModule.MANIFEST,  // 31. Player list management
   AccessControlModule.MANIFEST,     // 32. Access control
   SingleplayerModule.MANIFEST,      // 33. Singleplayer support
   Universe.MANIFEST,                // 34. Universe/world management
   ConnectedBlocksModule.MANIFEST    // 35. Connected block systems
};
```

### Initialization Groups

The modules can be conceptually grouped by dependency tier:

**Tier 1 -- Infrastructure** (1-4): Console, permissions, updates, debug camera. No game-logic dependencies.

**Tier 2 -- Asset Pipeline** (5-9): Asset loading, shared assets, cosmetics, server management, localization. Must initialize before any game content.

**Tier 3 -- Block System** (10-18): Items, block types, block behaviors, block states, collision, block sets, migration, block health. Ordered so that types are defined before behaviors, and behaviors before health.

**Tier 4 -- World Systems** (19-22): Prefab spawning, time management, anchor actions, interactions. Depends on the block system being fully initialized.

**Tier 5 -- Entity Systems** (23-28): The ECS core, statistics, UI, damage, physics, stamina. The `EntityModule` is the central module here, with subsequent modules adding systems to its stores.

**Tier 6 -- Runtime** (29-35): Debug tools, projectiles, player management, access control, singleplayer support, universe management, connected blocks. These modules operate on the fully initialized game state.

### Additional Constants

```java
// server/core/Constants.java, lines 46-51
public static final boolean DEBUG = true;
public static final boolean SINGLEPLAYER = OPTION_SET.has(Options.SINGLEPLAYER);
public static final boolean ALLOWS_SELF_OP_COMMAND = OPTION_SET.has(Options.ALLOW_SELF_OP_COMMAND);
public static final boolean FRESH_UNIVERSE = checkFreshUniverse();
public static final boolean FORCE_NETWORK_FLUSH = OPTION_SET.valueOf(Options.FORCE_NETWORK_FLUSH);
public static final Path UNIVERSE_PATH = getUniversePath();
```

The `FRESH_UNIVERSE` check determines if this is a first-time world generation by looking for the existence of the `players/` and `worlds/` directories under the universe path.
