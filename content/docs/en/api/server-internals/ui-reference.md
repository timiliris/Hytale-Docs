---
id: ui-reference
title: UI System Reference
sidebar_label: UI Reference
sidebar_position: 8
description: Complete reference for Hytale's UI system - DSL syntax, Common.ui components, Java API, and all properties
---

# UI System Reference

This is the complete technical reference for Hytale's UI system. For a tutorial-style guide, see [Custom UI System](./custom-ui.md).

---

## UI DSL Syntax

Hytale uses a custom Domain Specific Language (DSL) for `.ui` files. This is **NOT** XML, XAML, or JSON.

### File Structure

```
// Comments start with //

// Import external UI files
$C = "../Common.ui";
$Other = "path/to/Other.ui";

// Define custom styles/constants
@MyConstant = 100;
@MyStyle = LabelStyle(FontSize: 16, TextColor: #ffffff);

// Root element (only ONE root element per file)
Group {
  // Properties use colon and end with semicolon
  PropertyName: value;

  // Child elements
  ChildElement {
    // ...
  }
}
```

### Syntax Rules

| Rule | Correct | Incorrect |
|------|---------|-----------|
| String values must be quoted | `Text: "Hello";` | `Text: Hello;` |
| Properties end with semicolon | `Width: 100;` | `Width: 100` |
| Colors use hex format | `#ffffff`, `#fff` | `white`, `rgb()` |
| Alpha in colors | `#141c26(0.95)` | `#141c26cc` |
| Element IDs start with # | `Label #Title { }` | `Label Title { }` |
| One root element per file | Single `Group { }` | Multiple roots |
| Import syntax | `$C = "../Common.ui";` | `import Common.ui` |

### Import and Reference Syntax

```
// Import a UI file and assign to variable
$C = "../Common.ui";

// Use imported components with @
$C.@TextButton #MyButton {
  @Text = "Click";  // Template parameter
}

// Reference a style from imported file
Style: $C.@DefaultLabelStyle;

// Define local style
@LocalStyle = LabelStyle(FontSize: 20);
```

### Template Instantiation

```
// Basic template usage
$ImportVar.@TemplateName #ElementID {
  @Parameter = value;      // Template parameters use @
  RegularProperty: value;  // Regular properties use :
}

// Example with Common.ui button
$C.@SecondaryTextButton #SaveBtn {
  @Text = "Save";
  Anchor: (Width: 120, Height: 40);
}
```

---

## Element Types

### Group (Container)

The primary container element for layouts.

```
Group {
  Anchor: (Width: 400, Height: 300);
  Background: #141c26;
  LayoutMode: Top;
  Padding: (Full: 20);
  FlexWeight: 1;
  Visible: true;

  // Children go here
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `Anchor` | Anchor | Size and position constraints |
| `Background` | Color/PatchStyle | Background color or 9-slice image |
| `LayoutMode` | Enum | How children are arranged (e.g. `Top`, `Left`, `Overlay`) |
| `Padding` | Padding | Internal spacing (Note: Use padding on parent, NOT margin on children) |
| `FlexWeight` | Number | Flexible sizing weight |
| `Visible` | Boolean | Visibility |
| `Enabled` | Boolean | Interaction enabled |
| `Opacity` | Number (0-1) | Transparency |

### Label (Text Display)

```
Label {
  Text: "Hello World";
  Anchor: (Height: 30);
  Style: (FontSize: 16, TextColor: #ffffff);
}

// With ID for dynamic updates
Label #StatusText {
  Text: "Status: Ready";
  Anchor: (Height: 24);
  Style: @MyLabelStyle;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `Text` | String | Display text |
| `Style` | LabelStyle | Text styling |
| `Anchor` | Anchor | Size constraints |
| `Visible` | Boolean | Visibility |

### TextButton

```
TextButton #MyButton {
  Text: "Click Me";
  Anchor: (Width: 120, Height: 44);
  Style: @MyButtonStyle;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `Text` | String | Button label |
| `Style` | TextButtonStyle | Button styling |
| `Anchor` | Anchor | Size constraints |
| `Enabled` | Boolean | Can be clicked |
| `Visible` | Boolean | Visibility |

### Image (Deprecated Pattern)
> **⚠️ Warning:** The direct `<Image>` node is widely deprecated in current Hytale modding due to parser instability.

**Recommended Alternative:**
Use a `Group` with a `Background` property instead.

**Legacy Syntax (Avoid if crashing):**
```
Image {
  TexturePath: "Common/MyImage.png";
  Anchor: (Width: 64, Height: 64);
  Tint: #ffffff;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `TexturePath` | String | Path to texture |
| `Anchor` | Anchor | Size constraints |
| `Tint` | Color | Color tint overlay |
| `Opacity` | Number | Transparency |

### TextField (Text Input)

```
TextField #NameInput {
  PlaceholderText: "Enter name...";
  Anchor: (Height: 38);
  Style: @DefaultInputFieldStyle;
  FlexWeight: 1;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `Value` | String | Current text value |
| `PlaceholderText` | String | Placeholder when empty |
| `Style` | InputFieldStyle | Input styling |
| `Anchor` | Anchor | Size constraints |
| `FlexWeight` | Number | Flexible width |

### NumberField

```
NumberField #AmountInput {
  Value: 100;
  Anchor: (Width: 80, Height: 38);
}
```

### CheckBox

```
CheckBox #MyCheckbox {
  Value: true;
  Anchor: (Width: 22, Height: 22);
  Style: @DefaultCheckBoxStyle;
}
```

### Slider

```
Slider #VolumeSlider {
  Value: 0.75;
  MinValue: 0;
  MaxValue: 1;
  Anchor: (Height: 20);
  Style: @DefaultSliderStyle;
}
```

### DropdownBox

```
DropdownBox #MyDropdown {
  Anchor: (Width: 200, Height: 32);
  Style: @DefaultDropdownBoxStyle;
}
```

### ScrollView

```
ScrollView {
  Anchor: (Width: 300, Height: 200);
  Style: @DefaultScrollbarStyle;

  // Scrollable content
  Group {
    LayoutMode: Top;
    // Items...
  }
}
```

---

## Property Types

### Anchor

Controls size and position of elements.

```
Anchor: (
  Width: 200,        // Fixed width
  Height: 50,        // Fixed height
  Top: 10,           // Top margin
  Bottom: 10,        // Bottom margin
  Left: 10,          // Left margin
  Right: 10,         // Right margin
  Horizontal: 10,    // Left + Right
  Vertical: 10       // Top + Bottom
);

// Shorthand
Anchor: (Width: 200, Height: 50);
Anchor: (Height: 40);
```

### Padding

Internal spacing within containers.

```
Padding: (
  Full: 20,          // All sides
  Horizontal: 10,    // Left + Right
  Vertical: 10,      // Top + Bottom
  Top: 10,
  Bottom: 10,
  Left: 10,
  Right: 10
);

// Shorthand
Padding: (Full: 20);
Padding: (Horizontal: 10, Vertical: 5);
```

### LayoutMode

How children are arranged in a container.

| Value | Description |
|-------|-------------|
| `Top` | Stack vertically from top |
| `Bottom` | Stack vertically from bottom |
| `Left` | Stack horizontally from left |
| `Right` | Stack horizontally from right |
| `Center` | Center all children |
| `Overlay` | Stack on top of each other |

```
Group {
  LayoutMode: Top;
  // Children stack vertically
}
```

### Color

```
// Hex colors
Background: #ffffff;      // White
Background: #fff;         // Short form
Background: #141c26;      // Dark blue

// With alpha
Background: #141c26(0.95); // 95% opacity
Background: #000000(0.5);  // 50% black overlay
```

### LabelStyle

Text styling properties.

```
@MyLabelStyle = LabelStyle(
  FontSize: 16,
  TextColor: #ffffff,
  RenderBold: true,
  RenderItalic: false,
  RenderUppercase: false,
  HorizontalAlignment: Center,  // Start, Center, End
  VerticalAlignment: Center,    // Top, Center, Bottom
  FontName: "Default",          // or "Secondary"
  LetterSpacing: 0,
  LineSpacing: 1.0,
  Wrap: true,
  Overflow: Ellipsis            // or Clip, Visible
);

// Inline style
Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
```

### TextButtonStyle

Button state styling.

```
@MyButtonStyle = TextButtonStyle(
  Default: (
    Background: #3a7bd5,
    LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)
  ),
  Hovered: (
    Background: #4a8be5,
    LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)
  ),
  Pressed: (
    Background: #2a6bc5,
    LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)
  ),
  Disabled: (
    Background: #555555,
    LabelStyle: (FontSize: 14, TextColor: #888888, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)
  ),
  Sounds: @ButtonSounds
);
```

### PatchStyle (9-Slice)

For scalable backgrounds using 9-slice images.

```
PatchStyle(
  TexturePath: "Common/Button.png",
  Border: 12                    // All sides (Top, Bottom, Left, Right)
)

// Advanced Syntax (Different borders)
PatchStyle(
  TexturePath: "Common/Panel.png",
  HorizontalBorder: 80,         // Affects Left and Right only
  VerticalBorder: 12            // Affects Top and Bottom only
)
```

> **Best Practice:** Always use `PatchStyle` for UI backgrounds (buttons, panels) to prevent pixel stretching artifacts. A border of `10-12` is standard for Hytale's 32x textures.

---

## Common.ui Components

Import with: `$C = "../Common.ui";`

### Button Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@TextButton` | `@Text`, `@Anchor`, `@Sounds` | Primary button (blue) |
| `@SecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Secondary button (gray) |
| `@TertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Tertiary button |
| `@CancelTextButton` | `@Text`, `@Anchor`, `@Sounds` | Destructive button (red) |
| `@SmallSecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Small secondary |
| `@SmallTertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Small tertiary |
| `@Button` | `@Anchor`, `@Sounds` | Icon button (no text) |
| `@SecondaryButton` | `@Anchor`, `@Sounds`, `@Width` | Secondary icon button |
| `@TertiaryButton` | `@Anchor`, `@Sounds`, `@Width` | Tertiary icon button |
| `@CancelButton` | `@Anchor`, `@Sounds`, `@Width` | Cancel icon button |
| `@CloseButton` | - | Pre-styled close button (32x32) |
| `@BackButton` | - | Pre-styled back button |

**Usage:**
```
$C.@TextButton #SaveBtn {
  @Text = "Save";
  Anchor: (Width: 120, Height: 44);
}

$C.@SecondaryTextButton #CancelBtn {
  @Text = "Cancel";
  Anchor: (Width: 100, Height: 44);
}

$C.@CancelTextButton #DeleteBtn {
  @Text = "Delete";
  Anchor: (Width: 100, Height: 44);
}
```

### Input Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@TextField` | `@Anchor` | Text input (height: 38) |
| `@NumberField` | `@Anchor` | Numeric input (height: 38) |
| `@DropdownBox` | `@Anchor` | Dropdown selector |
| `@CheckBox` | - | Checkbox only (22x22) |
| `@CheckBoxWithLabel` | `@Text`, `@Checked` | Checkbox with label |

**Usage:**
```
$C.@TextField #NameInput {
  FlexWeight: 1;
  PlaceholderText: "Enter name...";
}

$C.@NumberField #AmountInput {
  Anchor: (Width: 80);
  Value: 100;
}

$C.@CheckBoxWithLabel #EnableOption {
  @Text = "Enable feature";
  @Checked = true;
  Anchor: (Height: 28);
}

$C.@DropdownBox #CategorySelect {
  Anchor: (Width: 200, Height: 32);
}
```

### Container Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@Container` | `@ContentPadding`, `@CloseButton` | Styled container with title |
| `@DecoratedContainer` | `@ContentPadding`, `@CloseButton` | Container with decorative border |
| `@Panel` | - | Simple panel with border |
| `@PageOverlay` | - | Semi-transparent background |

**Structure:**
```
$C.@Container {
  @CloseButton = true;
  Anchor: (Width: 400, Height: 300);

  // Has #Title and #Content areas
}
```

### Layout Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@ContentSeparator` | `@Anchor` | Horizontal line (height: 1) |
| `@VerticalSeparator` | - | Vertical line (width: 6) |
| `@HeaderSeparator` | - | Header section separator |
| `@PanelSeparatorFancy` | `@Anchor` | Decorative separator |
| `@ActionButtonContainer` | - | Container for action buttons |
| `@ActionButtonSeparator` | - | Space between action buttons |

### Text Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@Title` | `@Text`, `@Alignment` | Styled title label |
| `@Subtitle` | `@Text` | Styled subtitle |
| `@TitleLabel` | - | Large centered title (40px) |
| `@PanelTitle` | `@Text`, `@Alignment` | Panel section title |

### Utility Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@DefaultSpinner` | `@Anchor` | Loading spinner (32x32) |
| `@HeaderSearch` | `@MarginRight` | Search input with icon |

---

## Common.ui Style Constants

```
@PrimaryButtonHeight = 44;
@SmallButtonHeight = 32;
@BigButtonHeight = 48;
@ButtonPadding = 24;
@DefaultButtonMinWidth = 172;
@ButtonBorder = 12;
@DropdownBoxHeight = 32;
@TitleHeight = 38;
@InnerPaddingValue = 8;
@FullPaddingValue = 17;
@DisabledColor = #797b7c;
```

## Common.ui Styles

### Button Styles

| Style | Description |
|-------|-------------|
| `@DefaultTextButtonStyle` | Primary button |
| `@SecondaryTextButtonStyle` | Secondary button |
| `@TertiaryTextButtonStyle` | Tertiary button |
| `@CancelTextButtonStyle` | Destructive/cancel |
| `@SmallDefaultTextButtonStyle` | Small primary |
| `@SmallSecondaryTextButtonStyle` | Small secondary |
| `@DefaultButtonStyle` | Icon button |
| `@SecondaryButtonStyle` | Secondary icon |
| `@TertiaryButtonStyle` | Tertiary icon |
| `@CancelButtonStyle` | Cancel icon |

### Label Styles

| Style | Properties |
|-------|------------|
| `@DefaultLabelStyle` | FontSize: 16, TextColor: #96a9be |
| `@DefaultButtonLabelStyle` | FontSize: 17, Bold, Uppercase, Center |
| `@TitleStyle` | FontSize: 15, Bold, Uppercase, #b4c8c9 |
| `@SubtitleStyle` | FontSize: 15, Uppercase, #96a9be |
| `@PopupTitleStyle` | FontSize: 38, Bold, Uppercase, Center |

### Input Styles

| Style | Description |
|-------|-------------|
| `@DefaultInputFieldStyle` | Text input styling |
| `@DefaultInputFieldPlaceholderStyle` | Placeholder text (#6e7da1) |
| `@InputBoxBackground` | Input background |
| `@InputBoxHoveredBackground` | Hover state |
| `@InputBoxSelectedBackground` | Selected state |

### Other Styles

| Style | Description |
|-------|-------------|
| `@DefaultScrollbarStyle` | Scrollbar styling |
| `@DefaultCheckBoxStyle` | Checkbox styling |
| `@DefaultDropdownBoxStyle` | Dropdown styling |
| `@DefaultSliderStyle` | Slider styling |
| `@DefaultTextTooltipStyle` | Tooltip styling |
| `@DefaultColorPickerStyle` | Color picker styling |

---

## Java API Reference

### UICommandBuilder

Builds commands to manipulate UI elements.

```java
UICommandBuilder cmd = new UICommandBuilder();
```

**Methods:**

| Method | Description |
|--------|-------------|
| `append(String documentPath)` | Load a UI document |
| `append(String selector, String documentPath)` | Append template to container |
| `appendInline(String selector, String document)` | Append inline UI definition |
| `insertBefore(String selector, String documentPath)` | Insert before element |
| `insertBeforeInline(String selector, String document)` | Insert inline before |
| `set(String selector, String value)` | Set string property |
| `set(String selector, boolean value)` | Set boolean property |
| `set(String selector, int value)` | Set integer property |
| `set(String selector, float value)` | Set float property |
| `set(String selector, double value)` | Set double property |
| `set(String selector, Message message)` | Set localized message |
| `set(String selector, Value<T> ref)` | Set document reference |
| `setNull(String selector)` | Set to null |
| `setObject(String selector, Object data)` | Set encodable object |
| `set(String selector, T[] data)` | Set array |
| `set(String selector, List<T> data)` | Set list |
| `clear(String selector)` | Remove all children |
| `remove(String selector)` | Remove element |
| `getCommands()` | Get compiled commands |

**Examples:**
```java
// Load layout
cmd.append("YourPlugin/MyPage.ui");

// Set text
cmd.set("#Title.Text", "Hello World");

// Set visibility
cmd.set("#Panel.Visible", false);

// Set numeric value
cmd.set("#Slider.Value", 0.75f);

// Append template to container
cmd.append("#ItemList", "YourPlugin/ListItem.ui");

// Clear container
cmd.clear("#ItemList");

// Remove specific element
cmd.remove("#OldElement");
```

### UIEventBuilder

Builds event bindings for UI interactions.

```java
UIEventBuilder evt = new UIEventBuilder();
```

**Methods:**

| Method | Description |
|--------|-------------|
| `addEventBinding(type, selector)` | Basic event binding |
| `addEventBinding(type, selector, locksInterface)` | With interface lock |
| `addEventBinding(type, selector, data)` | With event data |
| `addEventBinding(type, selector, data, locksInterface)` | Full signature |
| `getEvents()` | Get compiled bindings |

**Examples:**
```java
// Simple button click
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#MyButton",
    new EventData().append("Action", "click"),
    false
);

// Capture input value
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SubmitBtn",
    new EventData()
        .append("Action", "submit")
        .append("@Username", "#UsernameInput.Value"),  // @ captures value
    false
);

// Value change event
evt.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#VolumeSlider",
    new EventData().append("Action", "volume_changed"),
    false
);
```

### CustomUIEventBindingType

All 24 event types:

| Type | ID | Description |
|------|-----|-------------|
| `Activating` | 0 | Click or Enter key |
| `RightClicking` | 1 | Right mouse click |
| `DoubleClicking` | 2 | Double click |
| `MouseEntered` | 3 | Mouse enters element |
| `MouseExited` | 4 | Mouse leaves element |
| `ValueChanged` | 5 | Input/slider value changed |
| `ElementReordered` | 6 | Element was reordered |
| `Validating` | 7 | Form validation |
| `Dismissing` | 8 | Page being dismissed |
| `FocusGained` | 9 | Element gained focus |
| `FocusLost` | 10 | Element lost focus |
| `KeyDown` | 11 | Key pressed |
| `MouseButtonReleased` | 12 | Mouse button released |
| `SlotClicking` | 13 | Inventory slot clicked |
| `SlotDoubleClicking` | 14 | Inventory slot double-clicked |
| `SlotMouseEntered` | 15 | Mouse entered slot |
| `SlotMouseExited` | 16 | Mouse exited slot |
| `DragCancelled` | 17 | Drag operation cancelled |
| `Dropped` | 18 | Item dropped |
| `SlotMouseDragCompleted` | 19 | Slot drag completed |
| `SlotMouseDragExited` | 20 | Slot drag exited |
| `SlotClickReleaseWhileDragging` | 21 | Click released while dragging |
| `SlotClickPressWhileDragging` | 22 | Click pressed while dragging |
| `SelectedTabChanged` | 23 | Tab selection changed |

### EventData

Container for event data key-value pairs.

```java
// Create with data
EventData data = new EventData()
    .append("Action", "click")
    .append("ItemId", "sword_01")
    .append("@Value", "#Input.Value");  // @ prefix captures UI value

// Factory method
EventData data = EventData.of("Action", "click");

// Access data
Map<String, String> events = data.events();
```

### Value\<T\>

Reference values from UI documents.

```java
// Create document reference
Value<String> styleRef = Value.ref("Pages/Styles.ui", "SelectedStyle");

// Create direct value
Value<String> directValue = Value.of("Hello");

// Use in command
cmd.set("#Element.Style", styleRef);
```

### InteractiveCustomUIPage\<T\>

Base class for interactive UI pages.

```java
public class MyPage extends InteractiveCustomUIPage<MyPage.MyEventData> {

    public MyPage(PlayerRef playerRef) {
        super(
            playerRef,
            CustomPageLifetime.CanDismiss,
            MyEventData.CODEC
        );
    }

    @Override
    public void build(
        Ref<EntityStore> ref,
        UICommandBuilder cmd,
        UIEventBuilder evt,
        Store<EntityStore> store
    ) {
        // Build UI
    }

    @Override
    public void handleDataEvent(
        Ref<EntityStore> ref,
        Store<EntityStore> store,
        MyEventData data
    ) {
        // Handle events
    }
}
```

**Methods:**

| Method | Description |
|--------|-------------|
| `build(ref, cmd, evt, store)` | Called when page opens |
| `handleDataEvent(ref, store, data)` | Called on user interaction |
| `sendUpdate(cmd, clear)` | Send UI update |
| `sendUpdate(cmd, evt, clear)` | Send update with new bindings |
| `rebuild()` | Completely rebuild the page |
| `close()` | Close the page |
| `onDismiss(ref, store)` | Called when page closes |
| `setLifetime(lifetime)` | Change page lifetime |
| `getLifetime()` | Get current lifetime |

### CustomPageLifetime

| Value | Description |
|-------|-------------|
| `CantClose` | Cannot be closed by user |
| `CanDismiss` | ESC key closes page |
| `CanDismissOrCloseThroughInteraction` | ESC or button click |

### BasicCustomUIPage

Simplified base class for non-interactive pages.

```java
public class StaticPage extends BasicCustomUIPage {

    @Override
    public void build(UICommandBuilder cmd) {
        cmd.append("YourPlugin/StaticPage.ui");
    }
}
```

### BuilderCodec

For serializing/deserializing event data.

```java
public static class MyEventData {
    public static final BuilderCodec<MyEventData> CODEC = BuilderCodec.builder(
            MyEventData.class, MyEventData::new
    )
    .append(new KeyedCodec<>("Action", Codec.STRING),
        (e, v) -> e.action = v,
        e -> e.action)
    .add()
    .append(new KeyedCodec<>("ItemId", Codec.STRING),
        (e, v) -> e.itemId = v,
        e -> e.itemId)
    .add()
    .build();

    private String action;
    private String itemId;

    public MyEventData() {}  // Required no-arg constructor
}
```

### Available Codecs

| Codec | Type |
|-------|------|
| `Codec.STRING` | String |
| `Codec.INT` | Integer |
| `Codec.LONG` | Long |
| `Codec.FLOAT` | Float |
| `Codec.DOUBLE` | Double |
| `Codec.BOOL` | Boolean |

---

## Selector Syntax

### Basic Selectors

```java
// By ID
"#ElementId"

// Property access
"#ElementId.PropertyName"

// Nested element
"#Parent #Child"

// Nested property
"#Parent #Child.PropertyName"
```

### Dynamic Selectors (Indexed)

When appending templates, they become indexed elements:

```java
// Append creates indexed elements
cmd.append("#Container", "template.ui");  // Creates #Container[0]
cmd.append("#Container", "template.ui");  // Creates #Container[1]

// Access by index
"#Container[0]"           // First element
"#Container[1]"           // Second element
"#Container[0].Text"      // Property of first element
```

**Important:** The appended template IS the element at that index. Do NOT try to navigate inside:

```java
// CORRECT - element at index IS the template
cmd.set("#Container[0].Text", "Hello");

// WRONG - looking for child inside (usually fails)
cmd.set("#Container[0] #Button.Text", "Hello");
```

### Property Names

| In .ui file | In Java selector |
|-------------|------------------|
| `@Text` (template param) | `.Text` (property) |
| `@Checked` (template param) | `.Value` (property) |
| `Visible:` | `.Visible` |
| `Text:` | `.Text` |
| `Value:` | `.Value` |

**Template parameters vs Properties:**
- `@Text` in .ui = initial value when template is instantiated
- `.Text` in Java = runtime property you can modify

---

## CustomUICommand Types

Internal command types (for reference):

| Type | ID | Description |
|------|-----|-------------|
| `Append` | 0 | Append from document |
| `AppendInline` | 1 | Append inline definition |
| `InsertBefore` | 2 | Insert before element |
| `InsertBeforeInline` | 3 | Insert inline before |
| `Remove` | 4 | Remove element |
| `Set` | 5 | Set property value |
| `Clear` | 6 | Clear all children |

---

## Supported Object Types

Objects that can be passed to `setObject()`:

| Type | Description |
|------|-------------|
| `Area` | Rectangle area |
| `ItemGridSlot` | Inventory slot data |
| `ItemStack` | Item with amount/quality |
| `LocalizableString` | Translated string |
| `PatchStyle` | 9-slice background |
| `DropdownEntryInfo` | Dropdown option |
| `Anchor` | Size/position constraints |

---

## Required Imports

```java
// Core UI
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.entity.entities.player.pages.BasicCustomUIPage;
import com.hypixel.hytale.server.core.entity.entities.player.pages.CustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.Value;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;

// Codec
import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;

// ECS
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;

// Player
import com.hypixel.hytale.server.core.entity.entities.Player;

// Notifications
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;
import com.hypixel.hytale.server.core.Message;
```

---

## Best Practices

### UI File Organization

```
resources/Common/UI/Custom/YourPlugin/
├── MainPage.ui          # Main layout
├── Components/
│   ├── ListItem.ui      # Reusable list item
│   └── Card.ui          # Reusable card
└── Styles/
    └── CustomStyles.ui  # Custom styles
```

### Performance

1. **Minimize updates** - Batch changes in single `sendUpdate()` call
2. **Use clear() wisely** - Only when rebuilding entire lists
3. **Avoid rebuild()** - Use targeted `set()` calls instead
4. **Index elements** - Pre-calculate selectors for dynamic lists

### Error Prevention

1. **Single root element** - Each .ui file must have exactly one root
2. **Quote all strings** - `Text: "Hello";` not `Text: Hello;`
3. **End with semicolon** - Every property needs `;`
4. **Match IDs exactly** - Case-sensitive matching
5. **Test incrementally** - Add complexity gradually
