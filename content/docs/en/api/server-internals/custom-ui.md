---
id: custom-ui
title: Custom UI System
sidebar_label: Custom UI
sidebar_position: 7
description: Complete guide to creating interactive player interfaces in Hytale plugins
---

# Custom UI System

:::info Tested & Verified
This documentation has been tested with a working plugin. Examples are confirmed to work.
:::

## Required Imports

```java
// === Core UI Page ===
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.Value;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;

// === Codec (for event data) ===
import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;

// === ECS Components ===
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;

// === Player & Command ===
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;
import com.hypixel.hytale.server.core.universe.world.World;
import com.hypixel.hytale.server.core.Message;

// === Dropdown (optional) ===
import com.hypixel.hytale.server.core.ui.DropdownEntryInfo;
import com.hypixel.hytale.server.core.ui.LocalizableString;

// === Notifications (optional) ===
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;

// === Page Management ===
import com.hypixel.hytale.protocol.packets.interface_.Page;
```

## Overview

The Custom UI system allows plugins to create interactive player interfaces. The system uses a **client-server architecture**:

- **Layout files (`.ui`)** are stored on the **client** - plugins cannot create them
- **Server sends commands** to manipulate elements in those layouts
- **Events flow back** from client to server when players interact

```
┌─────────────────────┐                    ┌─────────────────────┐
│    Server Plugin    │                    │       Client        │
│                     │                    │                     │
│  InteractiveCustom  │───── Commands ────>│  .ui Layout Files   │
│    UIPage           │                    │  (Pages/*.ui)       │
│  UICommandBuilder   │<───── Events ──────│                     │
│  UIEventBuilder     │                    │                     │
└─────────────────────┘                    └─────────────────────┘
```

:::danger Critical: Layout Files are Client-Side
**Layout files (`.ui`) are CLIENT assets.** If you reference a layout that doesn't exist on the client, you'll get:
```
Could not find document Pages/MyPage.ui for Custom UI Append command
```
The client will disconnect. **Only use layouts that are guaranteed to exist.**
:::

## Available Layout Files

Not all layout files are available on every client. Use these **guaranteed safe** layouts:

### Core Server Layouts (Always Available)

| Layout | Used By | Key Selectors |
|--------|---------|---------------|
| `Pages/PluginListPage.ui` | `/plugins` command | `#PluginList`, `#PluginName`, `#PluginDescription` |
| `Pages/PluginListButton.ui` | Plugin list items | `#Button`, `#CheckBox` |
| `Pages/CommandListPage.ui` | `/commands` command | `#CommandList`, `#SubcommandCards` |
| `Pages/BasicTextButton.ui` | Various pages | `LabelStyle`, `SelectedLabelStyle` |
| `Common/TextButton.ui` | Button component | `LabelStyle`, `SelectedLabelStyle` |

### Adventure/Builtin Layouts (May Not Be Available)

These layouts may only work when specific content packs are loaded:

| Layout | Module | Key Selectors |
|--------|--------|---------------|
| `Pages/DialogPage.ui` | Adventure Objectives | `#EntityName`, `#Dialog`, `#CloseButton` |
| `Pages/ShopPage.ui` | Adventure Shop | `#ElementList` |
| `Pages/ShopElementButton.ui` | Shop items | `#Icon`, `#Name`, `#Description`, `#Cost` |
| `Pages/BarterPage.ui` | Adventure Barter | `#TradeGrid`, `#TradeButton` |
| `Pages/BarterTradeRow.ui` | Barter items | `#OutputSlot`, `#InputSlot` |
| `Pages/Memories/*.ui` | Adventure Memories | `#IconList`, `#RecordButton` |

### Builder Tools Layouts

| Layout | Used By | Key Selectors |
|--------|---------|---------------|
| `Pages/EntitySpawnPage.ui` | NPC spawning | `#NPCList`, `#ModelList`, `#ScaleSlider` |
| `Pages/PrefabListPage.ui` | Prefab browser | `#FileList` |
| `Pages/ParticleSpawnPage.ui` | Particle testing | `#ParticleSystemList` |
| `Pages/ImageImportPage.ui` | Image import | File browser elements |

### Portal/Teleporter Layouts

| Layout | Used By | Key Selectors |
|--------|---------|---------------|
| `Pages/PortalDeviceSummon.ui` | Portal summon | `#Artwork`, `#Pills`, `#SummonButton` |
| `Pages/Teleporter.ui` | Teleporter config | `#WorldDropdown`, `#WarpDropdown` |
| `Pages/WarpListPage.ui` | Warp list | `#WarpList` |

**Recommendation**: Use `Pages/PluginListPage.ui` or `Pages/EntitySpawnPage.ui` as your base layout - they're guaranteed to work.

## Tested UI Elements

These elements have been **tested and verified to work** in plugins:

### EntitySpawnPage.ui Elements

| Element | Selector | Type | Properties |
|---------|----------|------|------------|
| **Search Input** | `#SearchInput` | Input Field | `.Value`, `.PlaceholderText` |
| **Scale Slider** | `#ScaleSlider` | Slider | `.Value` (float 0-1) |
| **Rotation Slider** | `#RotationOffset` | Slider | `.Value` (float) |
| **Count Input** | `#Count` | Numeric Input | `.Value` |
| **Tab Buttons** | `#TabNPC`, `#TabItems`, `#TabModel` | Buttons | `.Style` |
| **Spawn Button** | `#Spawn` | Button | Activating event |
| **Clear Button** | `#ClearMaterial` | Button | Activating event |
| **Item Slot** | `#ItemMaterialSlot` | Drag-drop slot | Dropped event |

### PluginListPage.ui Elements

| Element | Selector | Type | Properties |
|---------|----------|------|------------|
| **Plugin Name** | `#PluginName` | Text | `.Text` |
| **Plugin ID** | `#PluginIdentifier` | Text | `.Text` |
| **Plugin Version** | `#PluginVersion` | Text | `.Text`, `.Visible` |
| **Description** | `#PluginDescription` | Text | `.Text` |
| **Option Checkbox** | `#DescriptiveOnlyOption` | Container | `.Visible` |
| **Plugin List** | `#PluginList` | List Container | `.clear()`, `.append()` |

### PluginListButton.ui Elements (for list items)

| Element | Selector | Type | Properties |
|---------|----------|------|------------|
| **Button** | `#Button` | Button | `.Text`, `.Style`, Activating event |
| **Checkbox** | `#CheckBox` | Checkbox | `.Value` (boolean), `.Visible`, ValueChanged event |

### TeleporterSettingsPage.ui Elements (Dropdowns)

| Element | Selector | Type | Properties |
|---------|----------|------|------------|
| **World Dropdown** | `#WorldDropdown` | Dropdown | `.Entries`, `.Value` |
| **Warp Dropdown** | `#WarpDropdown` | Dropdown | `.Entries`, `.Value` |

### Working Test Example

This code tests all main UI element types using `EntitySpawnPage.ui`:

```java
public class UIComponentTestPage extends InteractiveCustomUIPage<UIComponentTestPage.TestEventData> {

    public static final String LAYOUT = "Pages/EntitySpawnPage.ui";

    private static final Value<String> TAB_STYLE_ACTIVE = Value.ref("Common.ui", "DefaultTextButtonStyle");
    private static final Value<String> TAB_STYLE_INACTIVE = Value.ref("Common.ui", "SecondaryTextButtonStyle");

    public UIComponentTestPage(@Nonnull PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, TestEventData.CODEC);
    }

    @Override
    public void build(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull UICommandBuilder commandBuilder,
            @Nonnull UIEventBuilder eventBuilder,
            @Nonnull Store<EntityStore> store
    ) {
        commandBuilder.append(LAYOUT);

        // Input field placeholder
        commandBuilder.set("#SearchInput.PlaceholderText", "Type here to test input");

        // Slider initial value
        commandBuilder.set("#ScaleSlider.Value", 0.5f);

        // Tab button styles
        commandBuilder.set("#TabNPC.Style", TAB_STYLE_ACTIVE);
        commandBuilder.set("#TabItems.Style", TAB_STYLE_INACTIVE);
        commandBuilder.set("#TabModel.Style", TAB_STYLE_INACTIVE);

        // Input field change event (captures value with @)
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.ValueChanged,
            "#SearchInput",
            new EventData().append("Action", "InputChanged").append("@Value", "#SearchInput.Value"),
            false
        );

        // Slider change event
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.ValueChanged,
            "#ScaleSlider",
            new EventData().append("Action", "SliderChanged").append("@Value", "#ScaleSlider.Value"),
            false
        );

        // Tab button events
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#TabNPC",
            new EventData().append("Action", "TabClick").append("Tab", "NPC"),
            false
        );
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#TabItems",
            new EventData().append("Action", "TabClick").append("Tab", "Items"),
            false
        );
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#TabModel",
            new EventData().append("Action", "TabClick").append("Tab", "Model"),
            false
        );

        // Spawn button event
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#Spawn",
            new EventData().append("Action", "SpawnClick"),
            false
        );
    }

    @Override
    public void handleDataEvent(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull Store<EntityStore> store,
            @Nonnull TestEventData data
    ) {
        UICommandBuilder commandBuilder = new UICommandBuilder();

        if ("InputChanged".equals(data.action)) {
            commandBuilder.set("#SearchInput.PlaceholderText", "You typed: " + data.value);
        }
        else if ("SliderChanged".equals(data.action)) {
            commandBuilder.set("#SearchInput.PlaceholderText", "Slider: " + data.value);
        }
        else if ("TabClick".equals(data.action)) {
            // Update tab styles to show which is active
            commandBuilder.set("#TabNPC.Style", "NPC".equals(data.tab) ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE);
            commandBuilder.set("#TabItems.Style", "Items".equals(data.tab) ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE);
            commandBuilder.set("#TabModel.Style", "Model".equals(data.tab) ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE);
        }
        else if ("SpawnClick".equals(data.action)) {
            commandBuilder.set("#SearchInput.PlaceholderText", "Spawn button clicked!");
        }

        this.sendUpdate(commandBuilder, false);
    }

    public static class TestEventData {
        public static final BuilderCodec<TestEventData> CODEC = BuilderCodec.builder(
                TestEventData.class, TestEventData::new
        )
        .append(new KeyedCodec<>("Action", Codec.STRING), (e, s) -> e.action = s, e -> e.action)
        .add()
        .append(new KeyedCodec<>("Tab", Codec.STRING), (e, s) -> e.tab = s, e -> e.tab)
        .add()
        .append(new KeyedCodec<>("Value", Codec.STRING), (e, s) -> e.value = s, e -> e.value)
        .add()
        .build();

        private String action;
        private String tab;
        private String value;

        public TestEventData() {}
    }
}
```

### Dropdown Example (TeleporterSettingsPage)

```java
import com.hypixel.hytale.server.core.ui.DropdownEntryInfo;
import com.hypixel.hytale.server.core.message.LocalizableString;
import it.unimi.dsi.fastutil.objects.ObjectArrayList;

// In your build() method:
commandBuilder.append("Pages/Teleporter.ui");

// Create dropdown entries
ObjectArrayList<DropdownEntryInfo> options = new ObjectArrayList<>();
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 1"), "opt1"));
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 2"), "opt2"));
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 3"), "opt3"));

// Set dropdown entries and selected value
commandBuilder.set("#WorldDropdown.Entries", options);
commandBuilder.set("#WorldDropdown.Value", "opt1");

// Listen for selection changes
eventBuilder.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#WorldDropdown",
    new EventData().append("Action", "DropdownChanged").append("@Value", "#WorldDropdown.Value"),
    false
);
```

## UI Element Properties Reference

These are all the properties that can be set on UI elements via `commandBuilder.set()`:

### Text Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `.Text` | String/Message | Text content | `set("#Title.Text", "Hello")` |
| `.TextSpans` | Message | Rich text with formatting | `set("#Name.TextSpans", Message.raw("Bold"))` |
| `.PlaceholderText` | String/Message | Input placeholder hint | `set("#Input.PlaceholderText", "Enter name...")` |

### Visibility & State

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `.Visible` | boolean | Show/hide element | `set("#Panel.Visible", false)` |
| `.Disabled` | boolean | Enable/disable interaction | `set("#Button.Disabled", true)` |

### Values & Data

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `.Value` | String/float/int | Input value, slider position | `set("#Slider.Value", 0.5f)` |
| `.Entries` | DropdownEntryInfo[] | Dropdown options | `set("#Dropdown.Entries", options)` |
| `.Slots` | ItemGridSlot[] | Inventory slots | `set("#Grid.Slots", slots)` |
| `.ItemId` | String | Item to display | `set("#Icon.ItemId", itemId)` |

### Styling & Appearance

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `.Style` | Value<String> | Visual style reference | `set("#Tab.Style", TAB_ACTIVE_STYLE)` |
| `.Color` | String (hex) | Color value | `set("#Tint.Color", "#5B9E28")` |
| `.Background` | String (asset path) | Background image | `set("#Artwork.Background", "Pages/Portals/splash.png")` |
| `.AssetPath` | String (asset path) | Asset/icon path | `set("#Icon.AssetPath", iconPath)` |

### Complex Objects (via setObject)

These require `commandBuilder.setObject()`:

| Type | Description | Example |
|------|-------------|---------|
| `LocalizableString` | Translatable text | `setObject("#Name.Text", LocalizableString.fromMessageId("key"))` |
| `ItemStack` | Item with quantity | `setObject("#Slot.Item", itemStack)` |
| `ItemGridSlot` | Inventory slot | `setObject("#Grid.Slots", slots)` |
| `PatchStyle` | Texture/patch styling | `setObject("#Panel.Style", patchStyle)` |
| `DropdownEntryInfo` | Dropdown option | Used in arrays for `.Entries` |

### Selector + Property Examples

```java
// Basic element property
commandBuilder.set("#PluginName.Text", "My Plugin");

// Nested element property
commandBuilder.set("#MainPage #Title.Text", "Welcome");

// Array element property
commandBuilder.set("#PluginList[0] #Button.Text", "First Item");

// Input with multiple properties
commandBuilder.set("#SearchInput.Value", "");
commandBuilder.set("#SearchInput.PlaceholderText", "Search...");

// Dropdown setup
List<DropdownEntryInfo> options = new ArrayList<>();
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 1"), "opt1"));
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 2"), "opt2"));
commandBuilder.set("#Dropdown.Entries", options);
commandBuilder.set("#Dropdown.Value", "opt1");
```

## Threading Requirements

:::warning Critical: World Thread
UI operations **must run on the world thread**. Failure to do so causes:
```
Assert not in thread: Expected WorldThread but was ForkJoinPool.commonPool-worker-X
```
:::

### Solution 1: Extend AbstractPlayerCommand (Recommended)

The easiest way to ensure proper threading is to extend `AbstractPlayerCommand`:

```java
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;

public class MyUICommand extends AbstractPlayerCommand {

    public MyUICommand() {
        super("myui", "Opens my custom UI");
    }

    @Override
    protected void execute(
        @Nonnull CommandContext context,
        @Nonnull Store<EntityStore> store,
        @Nonnull Ref<EntityStore> ref,
        @Nonnull PlayerRef playerRef,
        @Nonnull World world
    ) {
        // Already on world thread - safe to open UI
        Player player = store.getComponent(ref, Player.getComponentType());
        MyCustomPage page = new MyCustomPage(playerRef);
        player.getPageManager().openCustomPage(ref, store, page);
    }
}
```

### Solution 2: Schedule on World Thread

If not using `AbstractPlayerCommand`, schedule execution on the world thread:

```java
World world = store.getExternalData().getWorld();
world.execute(() -> {
    // Safe to perform UI operations here
    Player player = store.getComponent(ref, Player.getComponentType());
    player.getPageManager().openCustomPage(ref, store, page);
});
```

## Creating a Custom UI Page

### Step 1: Extend InteractiveCustomUIPage

```java
import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;
import com.hypixel.hytale.protocol.packets.interface_.Page;
import com.hypixel.hytale.server.core.Message;
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.Value;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;

public class MyDashboardPage extends InteractiveCustomUIPage<MyDashboardPage.MyEventData> {

    // Use a SAFE layout that exists on all clients
    public static final String LAYOUT = "Pages/PluginListPage.ui";

    public MyDashboardPage(@Nonnull PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, MyEventData.CODEC);
    }

    @Override
    public void build(
        @Nonnull Ref<EntityStore> ref,
        @Nonnull UICommandBuilder commandBuilder,
        @Nonnull UIEventBuilder eventBuilder,
        @Nonnull Store<EntityStore> store
    ) {
        // Load the layout
        commandBuilder.append(LAYOUT);

        // Hide elements we don't need
        commandBuilder.set("#DescriptiveOnlyOption.Visible", false);

        // Set info panel content
        commandBuilder.set("#PluginName.Text", "My Dashboard");
        commandBuilder.set("#PluginIdentifier.Text", "Status: Online");
        commandBuilder.set("#PluginVersion.Text", "v1.0.0");
        commandBuilder.set("#PluginDescription.Text", "Welcome to my custom dashboard!");

        // Clear and populate the list
        commandBuilder.clear("#PluginList");

        // Add list items
        String[] items = {"Option A", "Option B", "Option C"};
        for (int i = 0; i < items.length; i++) {
            String selector = "#PluginList[" + i + "]";

            // Append a button from the button template
            commandBuilder.append("#PluginList", "Pages/PluginListButton.ui");

            // Set the button text
            commandBuilder.set(selector + " #Button.Text", items[i]);

            // Disable the checkbox (we're using this for display only)
            commandBuilder.set(selector + " #CheckBox.Visible", false);

            // Register click event with data
            eventBuilder.addEventBinding(
                CustomUIEventBindingType.Activating,
                selector + " #Button",
                new EventData().append("Item", items[i]).append("Index", String.valueOf(i)),
                false
            );
        }
    }

    @Override
    public void handleDataEvent(
        @Nonnull Ref<EntityStore> ref,
        @Nonnull Store<EntityStore> store,
        @Nonnull MyEventData data
    ) {
        if (data.item != null) {
            // Handle item selection
            UICommandBuilder commandBuilder = new UICommandBuilder();
            commandBuilder.set("#PluginDescription.Text", "You selected: " + data.item);
            this.sendUpdate(commandBuilder, false);
        }
    }

    // Event data class - must have a BuilderCodec
    public static class MyEventData {
        public static final BuilderCodec<MyEventData> CODEC = BuilderCodec.builder(
            MyEventData.class, MyEventData::new
        )
        .append(new KeyedCodec<>("Item", Codec.STRING), (e, v) -> e.item = v, e -> e.item)
        .add()
        .append(new KeyedCodec<>("Index", Codec.STRING), (e, v) -> e.index = v, e -> e.index)
        .add()
        .build();

        private String item;
        private String index;

        public MyEventData() {}
    }
}
```

### Step 2: Create the Command

```java
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;

public class DashboardCommand extends AbstractPlayerCommand {

    public DashboardCommand() {
        super("dashboard", "Opens the dashboard UI");
    }

    @Override
    protected boolean canGeneratePermission() {
        return false; // No permission required
    }

    @Override
    protected void execute(
        @Nonnull CommandContext context,
        @Nonnull Store<EntityStore> store,
        @Nonnull Ref<EntityStore> ref,
        @Nonnull PlayerRef playerRef,
        @Nonnull World world
    ) {
        Player player = store.getComponent(ref, Player.getComponentType());
        if (player == null) {
            context.sendMessage(Message.raw("Error: Could not get player"));
            return;
        }

        MyDashboardPage page = new MyDashboardPage(playerRef);
        player.getPageManager().openCustomPage(ref, store, page);
        context.sendMessage(Message.raw("Dashboard opened!"));
    }
}
```

### Step 3: Register in Plugin

```java
public class MyPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        CommandRegistry commandRegistry = getCommandRegistry();
        commandRegistry.register(new DashboardCommand());
    }
}
```

## UICommandBuilder Reference

The `UICommandBuilder` sends commands to manipulate UI elements. All methods return `UICommandBuilder` for chaining.

### All Methods

| Method | Description |
|--------|-------------|
| `append(String documentPath)` | Load a layout file as the page |
| `append(String selector, String documentPath)` | Append layout to a container |
| `appendInline(String selector, String document)` | Append inline UI markup |
| `insertBefore(String selector, String documentPath)` | Insert layout before element |
| `insertBeforeInline(String selector, String document)` | Insert inline markup before element |
| `clear(String selector)` | Remove all children from container |
| `remove(String selector)` | Remove element from DOM |
| `set(String selector, T value)` | Set property value (many overloads) |
| `setObject(String selector, Object data)` | Set complex object via codec |
| `setNull(String selector)` | Set property to null |
| `getCommands()` | Get array of commands to send |

### Loading Layouts

```java
// Load a layout file as the page (MUST exist on client)
commandBuilder.append("Pages/PluginListPage.ui");

// Append a layout to a container (adds children to list)
commandBuilder.append("#PluginList", "Pages/PluginListButton.ui");

// Insert before an existing element
commandBuilder.insertBefore("#FirstItem", "Pages/PluginListButton.ui");
```

### Setting Values (Type Overloads)

```java
// String
commandBuilder.set("#Title.Text", "Hello World");

// Message (with translation support)
commandBuilder.set("#Title.Text", Message.raw("Hello World"));
commandBuilder.set("#Title.Text", Message.translation("my.translation.key"));

// boolean
commandBuilder.set("#Panel.Visible", true);
commandBuilder.set("#Button.Disabled", false);

// Numeric (int, float, double)
commandBuilder.set("#Counter.Text", 42);
commandBuilder.set("#Slider.Value", 0.75f);
commandBuilder.set("#Position.Value", 123.456);

// Value reference (for styles)
commandBuilder.set("#Button.Style", Value.ref("Pages/BasicTextButton.ui", "SelectedLabelStyle"));

// Arrays and Lists
commandBuilder.set("#Dropdown.Entries", dropdownOptions);  // DropdownEntryInfo[]
commandBuilder.set("#Grid.Slots", itemSlots);              // ItemGridSlot[]

// Complex objects (via setObject)
commandBuilder.setObject("#Name.Text", LocalizableString.fromMessageId("item.name.key"));
commandBuilder.setObject("#Icon.Item", itemStack);
```

### Managing Elements

```java
// Clear all children from a container
commandBuilder.clear("#PluginList");

// Remove a specific element
commandBuilder.remove("#OldItem");

// Set value to null
commandBuilder.setNull("#OptionalField");
```

### Inline UI (Advanced)

```java
// Append inline UI markup to an existing container
commandBuilder.appendInline("#Container", "Label { Text: No items; Style: (Alignment: Center); }");
```

:::warning appendInline Limitations
`appendInline()` requires a **selector to an existing container**. You cannot create a full page with inline markup alone - you must first load a layout file. **This method can cause disconnections if the markup is invalid.**
:::

## Selector Syntax

Elements are targeted using CSS-like selectors:

| Syntax | Example | Description |
|--------|---------|-------------|
| `#ID` | `#Button` | Element by ID |
| `#ID[n]` | `#List[0]` | Array element by index |
| `#ID.Property` | `#Button.Text` | Element property |
| `#Parent #Child` | `#Panel #Title` | Nested element |
| Combined | `#List[2] #Button.Text` | Array item's child property |

## UIEventBuilder Reference

Register event bindings to handle player interactions.

### All Methods

| Method | Description |
|--------|-------------|
| `addEventBinding(type, selector)` | Simple binding, locks interface |
| `addEventBinding(type, selector, locksInterface)` | Control interface locking |
| `addEventBinding(type, selector, data)` | With custom data, locks interface |
| `addEventBinding(type, selector, data, locksInterface)` | Full control |
| `getEvents()` | Get array of event bindings |

### Event Types (CustomUIEventBindingType)

| Type | Triggered When |
|------|---------------|
| `Activating` | Element clicked or Enter pressed |
| `RightClicking` | Right mouse button clicked |
| `DoubleClicking` | Double click |
| `ValueChanged` | Value changed (inputs, sliders, checkboxes) |
| `MouseEntered` | Mouse entered element |
| `MouseExited` | Mouse left element |
| `FocusGained` | Element gained focus |
| `FocusLost` | Element lost focus |
| `Dropped` | Drag and drop completed |

### Registering Events

```java
// Simple event (triggers handleDataEvent with empty data)
eventBuilder.addEventBinding(CustomUIEventBindingType.Activating, "#CloseButton");

// Event with custom data
eventBuilder.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SaveButton",
    new EventData().append("Action", "Save").append("Tab", "Settings")
);

// Non-locking event (UI stays responsive during event handling)
eventBuilder.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#Slider",
    new EventData().append("Type", "Volume"),
    false  // locksInterface = false
);

// Capture UI element value (prefix key with @)
eventBuilder.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SearchButton",
    new EventData()
        .append("Action", "Search")
        .append("@Query", "#SearchInput.Value")  // Captures input value
);

// Complex form with multiple captured values
eventBuilder.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SaveButton",
    new EventData()
        .append("@X", "#X #Input.Value")
        .append("@Y", "#Y #Input.Value")
        .append("@Z", "#Z #Input.Value")
        .append("@BlockRelative", "#BlockRelative #CheckBox.Value")
);
```

### Interface Locking

When `locksInterface = true` (default):
- UI becomes unresponsive until event is processed
- Prevents double-clicks and race conditions
- Use for actions that modify state

When `locksInterface = false`:
- UI stays responsive
- Good for real-time updates (sliders, hover effects)
- Use for `ValueChanged` and `MouseEntered/Exited` events

## EventData Codec

To receive event data, create a class with a `BuilderCodec`:

```java
public static class MyEventData {
    public static final BuilderCodec<MyEventData> CODEC = BuilderCodec.builder(
        MyEventData.class, MyEventData::new
    )
    // String field
    .append(new KeyedCodec<>("Action", Codec.STRING),
        (data, value) -> data.action = value,
        data -> data.action)
    .add()
    // Another string field
    .append(new KeyedCodec<>("ItemId", Codec.STRING),
        (data, value) -> data.itemId = value,
        data -> data.itemId)
    .add()
    .build();

    private String action;
    private String itemId;

    public MyEventData() {}

    // Getters if needed
    public String getAction() { return action; }
    public String getItemId() { return itemId; }
}
```

## Updating the UI

To update the UI after initial build, use `sendUpdate()`:

```java
@Override
public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store, MyEventData data) {
    // Create a new command builder for the update
    UICommandBuilder commandBuilder = new UICommandBuilder();

    // Make changes
    commandBuilder.set("#StatusText.Text", "Updated!");
    commandBuilder.set("#Counter.Text", String.valueOf(++counter));

    // Send the update (false = don't rebuild events)
    this.sendUpdate(commandBuilder, false);
}
```

## Closing the Page

```java
// From handleDataEvent
Player player = store.getComponent(ref, Player.getComponentType());
player.getPageManager().setPage(ref, store, Page.None);

// Or use the close() helper
this.close();
```

## CustomPageLifetime

Controls how the page can be closed:

| Lifetime | Behavior |
|----------|----------|
| `CantClose` | User cannot close the page (must be closed programmatically) |
| `CanDismiss` | User can press ESC to dismiss |
| `CanDismissOrCloseThroughInteraction` | ESC or close button interaction |

## Alternative: NotificationUtil

For simple messages without custom pages, use notifications:

```java
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;

NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("Title"),
    Message.raw("Subtitle"),
    NotificationStyle.Success
);
```

### Notification Styles

| Style | Appearance |
|-------|------------|
| `Default` | Standard notification |
| `Success` | Green/positive |
| `Warning` | Yellow/caution |
| `Error` | Red/negative |

## Common Mistakes

### 1. Using Non-Existent Layout Files

```java
// BAD - DialogPage.ui may not exist on all clients
commandBuilder.append("Pages/DialogPage.ui");

// GOOD - PluginListPage.ui is always available
commandBuilder.append("Pages/PluginListPage.ui");
```

### 2. Not Running on World Thread

```java
// BAD - Extending CommandBase doesn't guarantee world thread
public class MyCommand extends CommandBase { ... }

// GOOD - AbstractPlayerCommand handles threading
public class MyCommand extends AbstractPlayerCommand { ... }
```

### 3. Missing Codec Fields

```java
// BAD - Field "Action" sent by UI but not in codec
eventBuilder.addEventBinding(..., new EventData().append("Action", "Save"));
// handleDataEvent receives null for missing fields

// GOOD - All fields declared in codec
.append(new KeyedCodec<>("Action", Codec.STRING), ...)
```

### 4. Using appendInline Without Base Layout

```java
// BAD - No base layout loaded first
commandBuilder.appendInline("", "<panel>...</panel>");

// GOOD - Load layout first, then append inline to container
commandBuilder.append("Pages/PluginListPage.ui");
commandBuilder.appendInline("#SomeContainer", "Label { Text: Extra; }");
```

## Source Classes

| Class | Package |
|-------|---------|
| `CustomUIPage` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `BasicCustomUIPage` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `InteractiveCustomUIPage` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `UICommandBuilder` | `com.hypixel.hytale.server.core.ui.builder` |
| `UIEventBuilder` | `com.hypixel.hytale.server.core.ui.builder` |
| `EventData` | `com.hypixel.hytale.server.core.ui.builder` |
| `PageManager` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `AbstractPlayerCommand` | `com.hypixel.hytale.server.core.command.system.basecommands` |
| `NotificationUtil` | `com.hypixel.hytale.server.core.util` |

## Built-in Page Implementations

These are all the CustomUIPage implementations in Hytale - useful as reference:

### Server Core Pages

| Class | Layout | Purpose |
|-------|--------|---------|
| `PluginListPage` | `Pages/PluginListPage.ui` | Plugin management (`/plugins`) |
| `CommandListPage` | `Pages/CommandListPage.ui` | Command help (`/commands`) |
| `RespawnPage` | `Pages/RespawnPage.ui` | Death/respawn screen |
| `ItemRepairPage` | `Pages/ItemRepairPage.ui` | Item repair interface |

### Builder Tools Pages

| Class | Layout | Purpose |
|-------|--------|---------|
| `EntitySpawnPage` | `Pages/EntitySpawnPage.ui` | NPC/entity spawning |
| `ChangeModelPage` | `Pages/ChangeModelPage.ui` | Model selection |
| `ParticleSpawnPage` | `Pages/ParticleSpawnPage.ui` | Particle testing |
| `PrefabPage` | `Pages/PrefabListPage.ui` | Prefab browser |
| `ImageImportPage` | `Pages/ImageImportPage.ui` | Image import |
| `ObjImportPage` | `Pages/ObjImportPage.ui` | 3D model import |

### Adventure Pages

| Class | Layout | Purpose |
|-------|--------|---------|
| `DialogPage` | `Pages/DialogPage.ui` | NPC dialog |
| `ShopPage` | `Pages/ShopPage.ui` | Shop interface |
| `BarterPage` | `Pages/BarterPage.ui` | Trading interface |
| `MemoriesPage` | `Pages/Memories/*.ui` | Collectibles tracking |

### Portal/Teleporter Pages

| Class | Layout | Purpose |
|-------|--------|---------|
| `PortalDeviceSummonPage` | `Pages/PortalDeviceSummon.ui` | Portal summoning |
| `PortalDeviceActivePage` | `Pages/PortalDeviceActive.ui` | Active portal display |
| `TeleporterSettingsPage` | `Pages/Teleporter.ui` | Teleporter config |
| `WarpListPage` | `Pages/WarpListPage.ui` | Warp selection |

### Instance Management Pages

| Class | Layout | Purpose |
|-------|--------|---------|
| `InstanceListPage` | `Pages/InstanceListPage.ui` | Instance browser |
| `ConfigureInstanceBlockPage` | `Pages/ConfigureInstanceBlockPage.ui` | Instance config |

## Complete Layout File Reference

All 57 `.ui` layout files found in the server code:

### Core Layouts
- `Common.ui` - Global styles and constants
- `Common/TextButton.ui` - Reusable button component

### Pages Directory (55 files)
- `Pages/ArgumentTypeItem.ui`
- `Pages/BarterGridSpacer.ui`
- `Pages/BarterPage.ui`
- `Pages/BarterTradeRow.ui`
- `Pages/BasicTextButton.ui`
- `Pages/ChangeModelPage.ui`
- `Pages/CommandListPage.ui`
- `Pages/ConfigureInstanceBlockPage.ui`
- `Pages/DialogPage.ui`
- `Pages/DroppedItemSlot.ui`
- `Pages/EntitySpawnPage.ui`
- `Pages/ImageImportPage.ui`
- `Pages/InstanceListPage.ui`
- `Pages/ItemRepairElement.ui`
- `Pages/ItemRepairPage.ui`
- `Pages/LaunchPadSettingsPage.ui`
- `Pages/NameRespawnPointPage.ui`
- `Pages/ObjectiveAdminPanelDataSlot.ui`
- `Pages/ObjectiveAdminPanelPage.ui`
- `Pages/ObjImportPage.ui`
- `Pages/OverrideNearbyRespawnPointPage.ui`
- `Pages/OverrideRespawnPointButton.ui`
- `Pages/ParameterItem.ui`
- `Pages/ParticleSpawnPage.ui`
- `Pages/PlaySoundPage.ui`
- `Pages/PluginListButton.ui`
- `Pages/PluginListPage.ui`
- `Pages/PortalDeviceActive.ui`
- `Pages/PortalDeviceError.ui`
- `Pages/PortalDeviceSummon.ui`
- `Pages/PrefabEditorExitConfirm.ui`
- `Pages/PrefabEditorSaveSettings.ui`
- `Pages/PrefabEditorSettings.ui`
- `Pages/PrefabListPage.ui`
- `Pages/PrefabSavePage.ui`
- `Pages/PrefabSpawnerSettingsPage.ui`
- `Pages/PrefabTeleportPage.ui`
- `Pages/RespawnPage.ui`
- `Pages/ScriptedBrushListPage.ui`
- `Pages/SelectOverrideRespawnPointPage.ui`
- `Pages/ShopElementButton.ui`
- `Pages/ShopPage.ui`
- `Pages/SubcommandCard.ui`
- `Pages/Teleporter.ui`
- `Pages/TintChunkPage.ui`
- `Pages/VariantCard.ui`
- `Pages/WarpEntryButton.ui`
- `Pages/WarpListPage.ui`

### Subdirectories
- `Pages/Memories/ChestMarker.ui`
- `Pages/Memories/Memory.ui`
- `Pages/Memories/MemoriesCategory.ui`
- `Pages/Memories/MemoriesCategoryPanel.ui`
- `Pages/Memories/MemoriesPanel.ui`
- `Pages/Portals/BulletPoint.ui`
- `Pages/Portals/Pill.ui`
