---
id: custom-ui
title: Custom UI System
sidebar_label: Custom UI
sidebar_position: 7
description: Step-by-step guide to creating custom UI pages with Hytale's DSL
---

# Custom UI System

This guide teaches you how to create custom UI pages for Hytale plugins. You'll learn the UI file syntax, available components, and how to make interactive pages.

## How Custom UI Works

Hytale uses a **client-server architecture** for custom UI:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  resources/Common/UI/Custom/YourPlugin/                      │   │
│  │  └── YourPage.ui  (loaded when player connects)              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ▲                    │
                              │ Commands           │ Events
                              │ (set values)       │ (button clicks)
                              │                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  InteractiveCustomUIPage                                      │   │
│  │  - build(): load layout, set values, bind events             │   │
│  │  - handleDataEvent(): respond to user interactions           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Key points:**
- `.ui` files are **downloaded to the client** when the player connects
- The server **cannot create UI files dynamically** - they must exist beforehand
- Any syntax error in a `.ui` file will **crash the player's connection**
- The server sends **commands** to manipulate UI elements
- The client sends **events** back when the player interacts

---

## Tutorial: Creating Your First Custom UI

### Step 1: Project Structure

Your plugin needs these files:

```
your-plugin/
├── build.gradle
├── src/main/
│   ├── java/com/yourname/plugin/
│   │   ├── YourPlugin.java
│   │   ├── commands/
│   │   │   └── OpenUICommand.java
│   │   └── ui/
│   │       └── MyPage.java
│   └── resources/
│       ├── manifest.json
│       └── Common/
│           └── UI/
│               └── Custom/
│                   └── YourPlugin/
│                       └── MyPage.ui
```

### Step 2: Configure manifest.json

Your manifest must include `IncludesAssetPack: true`:

```json
{
  "Identifier": "your-plugin",
  "Name": "Your Plugin",
  "Version": "1.0.0",
  "EntryPoint": "com.yourname.plugin.YourPlugin",
  "IncludesAssetPack": true
}
```

> **⚠️ Critical Requirement:** The `"IncludesAssetPack": true` line is mandatory for custom textures to work. Without it, clients will see a "Red X" for any custom image you try to load.


### Step 3: Create the UI File

Create `src/main/resources/Common/UI/Custom/YourPlugin/MyPage.ui`:

```
$C = "../Common.ui";

Group {
  Anchor: (Width: 400, Height: 300);
  Background: #141c26(0.95);
  LayoutMode: Top;
  Padding: (Full: 20);

  Label {
    Text: "Hello World!";
    Anchor: (Height: 40);
    Style: (FontSize: 24, TextColor: #ffffff, HorizontalAlignment: Center, RenderBold: true);
  }

  Group { Anchor: (Height: 20); }

  $C.@TextButton #MyButton {
    @Text = "Click Me";
    Anchor: (Width: 150, Height: 44);
  }
}
```

### Step 4: Create the Java Page Handler

Create `src/main/java/com/yourname/plugin/ui/MyPage.java`:

```java
package com.yourname.plugin.ui;

import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;
import com.hypixel.hytale.server.core.Message;

import javax.annotation.Nonnull;

public class MyPage extends InteractiveCustomUIPage<MyPage.EventData> {

    // Path relative to Common/UI/Custom/
    public static final String LAYOUT = "YourPlugin/MyPage.ui";

    private final PlayerRef playerRef;

    public MyPage(@Nonnull PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, EventData.CODEC);
        this.playerRef = playerRef;
    }

    @Override
    public void build(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull UICommandBuilder cmd,
            @Nonnull UIEventBuilder evt,
            @Nonnull Store<EntityStore> store
    ) {
        // Load the layout
        cmd.append(LAYOUT);

        // Bind button click event
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#MyButton",
            new EventData().append("Action", "click"),
            false
        );
    }

    @Override
    public void handleDataEvent(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull Store<EntityStore> store,
            @Nonnull EventData data
    ) {
        if ("click".equals(data.action)) {
            NotificationUtil.sendNotification(
                playerRef.getPacketHandler(),
                Message.raw("Button Clicked!"),
                Message.raw("You clicked the button."),
                NotificationStyle.Success
            );
        }
    }

    // Event data class with codec
    public static class EventData {
        public static final BuilderCodec<EventData> CODEC = BuilderCodec.builder(
                EventData.class, EventData::new
        )
        .append(new KeyedCodec<>("Action", Codec.STRING), (e, v) -> e.action = v, e -> e.action)
        .add()
        .build();

        private String action;

        public EventData() {}
    }
}
```

### Step 5: Create the Command

Create `src/main/java/com/yourname/plugin/commands/OpenUICommand.java`:

```java
package com.yourname.plugin.commands;

import com.yourname.plugin.ui.MyPage;

import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.server.core.Message;
import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.World;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;

import javax.annotation.Nonnull;

public class OpenUICommand extends AbstractPlayerCommand {

    public OpenUICommand() {
        super("myui", "Opens the custom UI");
    }

    @Override
    protected boolean canGeneratePermission() {
        return false;
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

        MyPage page = new MyPage(playerRef);
        player.getPageManager().openCustomPage(ref, store, page);
    }
}
```

### Step 6: Register in Plugin

```java
package com.yourname.plugin;

import com.yourname.plugin.commands.OpenUICommand;
import com.hytaledocs.server.plugin.JavaPlugin;

public class YourPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        getCommandRegistry().register(new OpenUICommand());
        getLogger().info("Plugin enabled!");
    }
}
```

### Step 7: Build and Test

```bash
./gradlew build
```

Copy the JAR to your server's `plugins/` folder, restart, and run `/myui`.

---

## UI File Syntax Reference

Hytale uses a **custom DSL** (Domain Specific Language) for UI files. This is **NOT** XAML, XML, or any standard format.

### Basic Structure

```
// Comments start with //

// Import Common.ui for reusable components
$C = "../Common.ui";

// Define custom styles (optional)
@MyStyle = LabelStyle(FontSize: 16, TextColor: #ffffff);

// Root element
Group {
  // Properties
  Anchor: (Width: 400, Height: 300);
  Background: #1a1a2e;

  // Child elements
  Label {
    Text: "Hello";
    Style: @MyStyle;
  }
}
```

### Critical Syntax Rules

| Rule | Correct | Wrong |
|------|---------|-------|
| Text values must be quoted | `Text: "Hello";` | `Text: Hello;` |
| Properties end with semicolon | `Anchor: (Width: 100);` | `Anchor: (Width: 100)` |
| Colors use hex format | `#ffffff` or `#fff` | `white` or `rgb(255,255,255)` |
| Alpha in colors | `#141c26(0.95)` | `#141c26cc` |
| Element IDs start with # | `Label #Title { }` | `Label Title { }` |

### Layout Properties

| Property | Description | Example |
|----------|-------------|---------|
| `Anchor` | Size and position | `Anchor: (Width: 200, Height: 50);` |
| `Background` | Background color | `Background: #1a1a2e;` |
| `LayoutMode` | Child arrangement | `LayoutMode: Top;` or `Center;` or `Left;` |
| `Padding` | Internal spacing | `Padding: (Full: 20);` or `(Left: 10, Right: 10);` |
| `FlexWeight` | Flexible sizing | `FlexWeight: 1;` |

### LayoutMode Values

| Mode | Description |
|------|-------------|
| `Top` | Stack children vertically from top |
| `Left` | Stack children horizontally from left |
| `Center` | Center children |

### Basic Elements

#### Label (Text Display)

```
Label {
  Text: "My Text";
  Anchor: (Height: 30);
  Style: (FontSize: 16, TextColor: #ffffff, HorizontalAlignment: Center);
}
```

#### Label with ID

```
Label #Title {
  Text: "Default Title";
  Anchor: (Height: 40);
  Style: (FontSize: 24, TextColor: #ffffff, RenderBold: true);
}
```

#### Group (Container)

```
Group {
  Anchor: (Height: 100);
  LayoutMode: Left;
  Background: #2a2a3e;

  // Children go here
}
```

#### Spacer

```
// Vertical spacer
Group { Anchor: (Height: 20); }

// Horizontal spacer (in LayoutMode: Left)
Group { Anchor: (Width: 20); }

// Separator line
Group { Anchor: (Height: 1); Background: #333333; }
```

#### TextButton (Custom Style)

```
@MyButtonStyle = TextButtonStyle(
  Default: (Background: #3a7bd5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Hovered: (Background: #4a8be5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Pressed: (Background: #2a6bc5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center))
);

TextButton #MyButton {
  Text: "Click Me";
  Anchor: (Width: 120, Height: 44);
  Style: @MyButtonStyle;
}
```

---

## Common.ui Components

The game provides reusable components in `Common.ui`. Import them with:

```
$C = "../Common.ui";
```

Then use them with the `$C.@ComponentName` syntax.

### Available Components

| Component | Description | Parameters |
|-----------|-------------|------------|
| `$C.@TextButton` | Primary button (blue) | `@Text` |
| `$C.@SecondaryTextButton` | Secondary button (gray) | `@Text` |
| `$C.@CancelTextButton` | Cancel/danger button (red) | `@Text` |
| `$C.@TextField` | Text input field | `PlaceholderText`, `FlexWeight` |
| `$C.@NumberField` | Numeric input field | `Value`, `Anchor` |
| `$C.@CheckBox` | Checkbox only | - |
| `$C.@CheckBoxWithLabel` | Checkbox with text | `@Text`, `@Checked` |
| `$C.@DropdownBox` | Dropdown selector | `Anchor` |
| `$C.@ContentSeparator` | Horizontal separator | `Anchor` |
| `$C.@Container` | Styled container | `Anchor` |
| `$C.@DecoratedContainer` | Container with border | `Anchor` |
| `$C.@DefaultSpinner` | Loading spinner | `Anchor` |

### Component Examples

#### Buttons

```
$C = "../Common.ui";

Group {
  LayoutMode: Left;
  Anchor: (Height: 50);

  $C.@TextButton #SaveBtn {
    @Text = "Save";
    Anchor: (Width: 100, Height: 40);
  }

  Group { Anchor: (Width: 10); }

  $C.@SecondaryTextButton #CancelBtn {
    @Text = "Cancel";
    Anchor: (Width: 100, Height: 40);
  }

  Group { Anchor: (Width: 10); }

  $C.@CancelTextButton #DeleteBtn {
    @Text = "Delete";
    Anchor: (Width: 100, Height: 40);
  }
}
```

#### Text Input

```
Group {
  LayoutMode: Left;
  Anchor: (Height: 44);

  Label {
    Text: "Username";
    Anchor: (Width: 100);
    Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
  }

  $C.@TextField #UsernameInput {
    FlexWeight: 1;
    PlaceholderText: "Enter username...";
  }
}
```

#### Number Input

```
Group {
  LayoutMode: Left;
  Anchor: (Height: 44);

  Label {
    Text: "Amount";
    Anchor: (Width: 100);
    Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
  }

  $C.@NumberField #AmountInput {
    Anchor: (Width: 80);
    Value: 100;
  }
}
```

#### Checkboxes

```
$C.@CheckBoxWithLabel #EnableOption {
  @Text = "Enable this feature";
  @Checked = true;
  Anchor: (Height: 28);
}

Group { Anchor: (Height: 8); }

$C.@CheckBoxWithLabel #DisabledOption {
  @Text = "This is disabled by default";
  @Checked = false;
  Anchor: (Height: 28);
}
```

#### Dropdown

```
Group {
  LayoutMode: Left;
  Anchor: (Height: 44);

  Label {
    Text: "Select:";
    Anchor: (Width: 80);
    Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
  }

  $C.@DropdownBox #MyDropdown {
    Anchor: (Width: 200, Height: 36);
  }
}
```

---

## Complete Example: Settings Page

Here's a complete settings page using multiple components:

### SettingsPage.ui

```
$C = "../Common.ui";

@PrimaryButton = TextButtonStyle(
  Default: (Background: #3a7bd5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Hovered: (Background: #4a8be5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Pressed: (Background: #2a6bc5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center))
);

@SecondaryButton = TextButtonStyle(
  Default: (Background: #2b3542, LabelStyle: (FontSize: 14, TextColor: #96a9be, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Hovered: (Background: #3b4552, LabelStyle: (FontSize: 14, TextColor: #b6c9de, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Pressed: (Background: #1b2532, LabelStyle: (FontSize: 14, TextColor: #96a9be, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center))
);

Group {
  Anchor: (Width: 450, Height: 400);
  Background: #141c26(0.98);
  LayoutMode: Top;
  Padding: (Full: 20);

  // Title
  Label {
    Text: "Settings";
    Anchor: (Height: 40);
    Style: (FontSize: 24, TextColor: #ffffff, HorizontalAlignment: Center, RenderBold: true);
  }

  // Separator
  Group { Anchor: (Height: 1); Background: #2b3542; }
  Group { Anchor: (Height: 16); }

  // Username field
  Group {
    LayoutMode: Left;
    Anchor: (Height: 44);

    Label {
      Text: "Username";
      Anchor: (Width: 120);
      Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
    }

    $C.@TextField #UsernameInput {
      FlexWeight: 1;
      PlaceholderText: "Enter username...";
    }
  }

  Group { Anchor: (Height: 12); }

  // Volume slider-like number field
  Group {
    LayoutMode: Left;
    Anchor: (Height: 44);

    Label {
      Text: "Volume";
      Anchor: (Width: 120);
      Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
    }

    $C.@NumberField #VolumeInput {
      Anchor: (Width: 80);
      Value: 75;
    }

    Label {
      Text: "%";
      Anchor: (Width: 30);
      Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
    }
  }

  Group { Anchor: (Height: 16); }

  // Checkboxes
  $C.@CheckBoxWithLabel #NotificationsOption {
    @Text = "Enable notifications";
    @Checked = true;
    Anchor: (Height: 28);
  }

  Group { Anchor: (Height: 8); }

  $C.@CheckBoxWithLabel #SoundOption {
    @Text = "Enable sounds";
    @Checked = true;
    Anchor: (Height: 28);
  }

  Group { Anchor: (Height: 8); }

  $C.@CheckBoxWithLabel #AutoSaveOption {
    @Text = "Auto-save";
    @Checked = false;
    Anchor: (Height: 28);
  }

  // Spacer to push buttons to bottom
  Group { FlexWeight: 1; }

  // Buttons
  Group {
    LayoutMode: Center;
    Anchor: (Height: 50);

    TextButton #SaveButton {
      Text: "Save";
      Anchor: (Width: 100, Height: 44);
      Style: @PrimaryButton;
    }

    Group { Anchor: (Width: 16); }

    TextButton #CloseButton {
      Text: "Close";
      Anchor: (Width: 100, Height: 44);
      Style: @SecondaryButton;
    }
  }

  // Footer
  Group { Anchor: (Height: 8); }
  Label {
    Text: "Press ESC to close";
    Anchor: (Height: 16);
    Style: (FontSize: 11, TextColor: #555555, HorizontalAlignment: Center);
  }
}
```

### SettingsPage.java

```java
package com.yourplugin.ui;

import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;
import com.hypixel.hytale.server.core.Message;

import javax.annotation.Nonnull;

public class SettingsPage extends InteractiveCustomUIPage<SettingsPage.SettingsEventData> {

    public static final String LAYOUT = "YourPlugin/SettingsPage.ui";

    private final PlayerRef playerRef;

    public SettingsPage(@Nonnull PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, SettingsEventData.CODEC);
        this.playerRef = playerRef;
    }

    @Override
    public void build(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull UICommandBuilder cmd,
            @Nonnull UIEventBuilder evt,
            @Nonnull Store<EntityStore> store
    ) {
        cmd.append(LAYOUT);

        // Bind Save button
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#SaveButton",
            new EventData().append("Action", "save"),
            false
        );

        // Bind Close button
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#CloseButton",
            new EventData().append("Action", "close"),
            false
        );
    }

    @Override
    public void handleDataEvent(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull Store<EntityStore> store,
            @Nonnull SettingsEventData data
    ) {
        if ("close".equals(data.action)) {
            this.close();
        } else if ("save".equals(data.action)) {
            NotificationUtil.sendNotification(
                playerRef.getPacketHandler(),
                Message.raw("Settings Saved"),
                Message.raw("Your settings have been saved."),
                NotificationStyle.Success
            );
        }
    }

    public static class SettingsEventData {
        public static final BuilderCodec<SettingsEventData> CODEC = BuilderCodec.builder(
                SettingsEventData.class, SettingsEventData::new
        )
        .append(new KeyedCodec<>("Action", Codec.STRING), (e, v) -> e.action = v, e -> e.action)
        .add()
        .build();

        private String action;

        public SettingsEventData() {}
    }
}
```

---

## Server-Side API Reference

### InteractiveCustomUIPage

Base class for interactive UI pages.

```java
public class MyPage extends InteractiveCustomUIPage<MyEventData> {

    public MyPage(PlayerRef playerRef) {
        super(
            playerRef,                    // Player reference
            CustomPageLifetime.CanDismiss, // How page can be closed
            MyEventData.CODEC              // Event data codec
        );
    }

    @Override
    public void build(
        Ref<EntityStore> ref,
        UICommandBuilder cmd,
        UIEventBuilder evt,
        Store<EntityStore> store
    ) {
        // Called when page opens
    }

    @Override
    public void handleDataEvent(
        Ref<EntityStore> ref,
        Store<EntityStore> store,
        MyEventData data
    ) {
        // Called when player interacts
    }
}
```

### CustomPageLifetime

| Value | Description |
|-------|-------------|
| `CantClose` | Cannot be closed by user |
| `CanDismiss` | Can press ESC to close |
| `CanDismissOrCloseThroughInteraction` | ESC or button click |

### UICommandBuilder

```java
// Load layout
cmd.append("YourPlugin/MyPage.ui");

// Set text
cmd.set("#Title.Text", "Hello World");

// Set visibility
cmd.set("#Panel.Visible", false);

// Set numeric value
cmd.set("#Slider.Value", 0.5f);

// Clear container
cmd.clear("#ItemList");

// Append to container
cmd.append("#ItemList", "YourPlugin/ListItem.ui");
```

### UIEventBuilder

```java
// Simple button event
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#MyButton",
    new EventData().append("Action", "click"),
    false  // locksInterface
);

// Capture input value
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SubmitButton",
    new EventData()
        .append("Action", "submit")
        .append("@Username", "#UsernameInput.Value"),  // @ prefix captures value
    false
);
```

### CustomUIEventBindingType

| Type | When Triggered |
|------|----------------|
| `Activating` | Click or Enter |
| `ValueChanged` | Input/slider value changes |
| `RightClicking` | Right click |
| `DoubleClicking` | Double click |
| `MouseEntered` | Mouse enters element |
| `MouseExited` | Mouse leaves element |
| `FocusGained` | Element gains focus |
| `FocusLost` | Element loses focus |

### Updating the UI

```java
@Override
public void handleDataEvent(...) {
    UICommandBuilder cmd = new UICommandBuilder();
    cmd.set("#StatusText.Text", "Updated!");
    this.sendUpdate(cmd, false);
}
```

### Closing the Page

```java
this.close();
```

### NotificationUtil

For simple messages without a full page:

```java
NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("Title"),
    Message.raw("Message"),
    NotificationStyle.Success  // or Warning, Error, Default
);
```

---

## Event Data Codec

To receive data from UI events, create a class with `BuilderCodec`:

```java
public static class MyEventData {
    public static final BuilderCodec<MyEventData> CODEC = BuilderCodec.builder(
            MyEventData.class, MyEventData::new
    )
    // String field
    .append(new KeyedCodec<>("Action", Codec.STRING),
        (e, v) -> e.action = v,
        e -> e.action)
    .add()
    // Another field
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

The field names in the codec **must match** the keys in `EventData.append()`.

---

## Troubleshooting

### "Failed to load CustomUI documents"

**Cause**: Syntax error in your `.ui` file.

**Solutions**:
1. Make sure all text values are quoted: `Text: "Hello";` not `Text: Hello;`
2. Check all properties end with semicolon
3. Verify color format: `#ffffff` or `#fff`
4. Ensure Common.ui import is correct: `$C = "../Common.ui";`

### "Failed to apply CustomUI event bindings"

**Cause**: Element ID in Java doesn't match the `.ui` file.

**Solutions**:
1. Verify the element ID exists in your `.ui` file
2. Check spelling: `#MyButton` in Java must match `#MyButton` in `.ui`
3. For Common.ui components, the ID goes after the component: `$C.@TextButton #MyButton`

### "Selected element in CustomUI command was not found"

**Cause**: Incorrect selector pattern for dynamically appended templates.

**Understanding**: When you append a template to a container, the template itself **becomes** the element at that index. You don't navigate to a child inside it.

**Wrong:**
```java
// This looks for #Button INSIDE the element at index 0
cmd.set("#Container[0] #Button.Text", "Hello");  // WRONG!
```

**Correct:**
```java
// The element at index 0 IS the button
cmd.set("#Container[0].Text", "Hello");  // CORRECT!
```

**Full pattern:**
```java
// Append template
cmd.append("#WorldButtonsContainer", "YourPlugin/WorldButton.ui");

// The appended template IS #WorldButtonsContainer[0]
String selector = "#WorldButtonsContainer[0]";
cmd.set(selector + ".Text", "World Name");

// Event binding targets the element directly
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    selector,  // NOT selector + " #Button"
    new EventData().append("Action", "click"),
    false
);
```

### Template parameters vs Properties

**Template parameters** (`@Text`) are set when instantiating a component and define initial values.

**Properties** (`.Text`) are the actual runtime properties you modify from Java.

| Context | Syntax | Example |
|---------|--------|---------|
| In `.ui` file | `@Parameter` | `@Text = "Default";` |
| In Java (set value) | `.Property` | `cmd.set("#Button.Text", "New");` |

**Important**: You cannot use `@Text` in Java selectors. Always use `.Text`:
```java
// WRONG
cmd.set("#Button.@Text", "Hello");

// CORRECT
cmd.set("#Button.Text", "Hello");
```

### Player disconnects when opening page

**Cause**: The `.ui` file has a parse error or doesn't exist.

**Solutions**:
1. Check the file path matches: `"YourPlugin/MyPage.ui"` corresponds to `Common/UI/Custom/YourPlugin/MyPage.ui`
2. Review UI file syntax carefully
3. Start with a minimal working example and add complexity gradually

### UI opens but buttons don't work

**Cause**: Event bindings not set up correctly.

**Solutions**:
1. Ensure `evt.addEventBinding()` is called in `build()`
2. Verify the selector matches the element ID: `"#MyButton"`
3. Check that `handleDataEvent()` handles the action value

---

## Dynamic UI Patterns

This section covers how to create dynamic lists, update UI at runtime, and work with templates.

### Creating a Dynamic List

**Template file** (`YourPlugin/ListItem.ui`):
```
$C = "../Common.ui";

$C.@SecondaryTextButton {
  @Text = "Item";
  Anchor: (Height: 40);
}
```

**Layout file** (`YourPlugin/MyPage.ui`):
```
$C = "../Common.ui";

Group {
  Anchor: (Width: 400, Height: 300);
  Background: #141c26(0.98);
  LayoutMode: Top;
  Padding: (Full: 20);

  Label {
    Text: "Select an item:";
    Anchor: (Height: 30);
    Style: (FontSize: 16, TextColor: #ffffff);
  }

  Group #ItemList {
    FlexWeight: 1;
    LayoutMode: Top;
    Background: #0d1218(0.5);
    Padding: (Full: 8);
  }
}
```

**Java code**:
```java
@Override
public void build(...) {
    cmd.append(LAYOUT);

    String[] items = {"Apple", "Banana", "Cherry"};

    for (int i = 0; i < items.length; i++) {
        // Append template - this creates element at index i
        cmd.append("#ItemList", "YourPlugin/ListItem.ui");

        // The template IS the element at index i
        String selector = "#ItemList[" + i + "]";

        // Set text directly on the element
        cmd.set(selector + ".Text", items[i]);

        // Bind event directly to the element
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            selector,
            new EventData().append("Action", "select").append("Index", String.valueOf(i)),
            false
        );
    }
}
```

### Key Rules for Dynamic Templates

1. **Appended template = element at index**
   ```java
   cmd.append("#Container", "template.ui");
   // Creates #Container[0], then #Container[1], etc.
   ```

2. **Access properties directly**
   ```java
   cmd.set("#Container[0].Text", "value");    // CORRECT
   cmd.set("#Container[0] #ID.Text", "value"); // WRONG (unless template has nested IDs)
   ```

3. **Event bindings target the element**
   ```java
   evt.addEventBinding(..., "#Container[0]", ...);  // CORRECT
   ```

4. **Clear before rebuilding**
   ```java
   cmd.clear("#Container");  // Remove all children
   // Then re-append
   ```

### Updating UI Without Rebuilding

You can send incremental updates:

```java
@Override
public void handleDataEvent(...) {
    UICommandBuilder cmd = new UICommandBuilder();

    // Update specific elements
    cmd.set("#StatusLabel.Text", "Updated!");
    cmd.set("#Counter.Text", String.valueOf(counter++));


    // Send update ONLY (incremental patch)
    this.update(false, cmd);
}
```

> **Performance Tip:** Avoid calling `builder.append()` repeatedly in update loops. This forces a full document parse and can cause the client to disconnect with "Failed to load CustomUI documents". Always use `this.update(false, cmd)` for dynamic values.


### Clearing and Refreshing

```java
// Clear a container
cmd.clear("#ItemList");

// Or rebuild the entire page
this.rebuild();
```

---

## Complete Common.ui Reference

This section documents **all** components and styles available in the game's `Common.ui` file.

### Style Constants

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
@FullPaddingValue = 17;  // @InnerPaddingValue + 9
```

### Button Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@TextButton` | `@Text`, `@Anchor`, `@Sounds` | Primary button (blue) with text |
| `@SecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Secondary button (gray) with text |
| `@TertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Tertiary button with text |
| `@CancelTextButton` | `@Text`, `@Anchor`, `@Sounds` | Destructive/cancel button (red) |
| `@SmallSecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Small secondary button |
| `@SmallTertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Small tertiary button |
| `@Button` | `@Anchor`, `@Sounds` | Square button without text |
| `@SecondaryButton` | `@Anchor`, `@Sounds`, `@Width` | Square secondary button |
| `@TertiaryButton` | `@Anchor`, `@Sounds`, `@Width` | Square tertiary button |
| `@CancelButton` | `@Anchor`, `@Sounds`, `@Width` | Square cancel button |
| `@CloseButton` | - | Pre-positioned close button (32x32) |

**Usage:**
```
$C.@TextButton #MyButton {
  @Text = "Click Me";
  Anchor: (Width: 150, Height: 44);
}

$C.@SecondaryTextButton #CancelBtn {
  @Text = "Cancel";
  Anchor: (Width: 100, Height: 44);
}
```

### Input Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@TextField` | `@Anchor` | Text input field (height: 38) |
| `@NumberField` | `@Anchor` | Numeric-only input field (height: 38) |
| `@DropdownBox` | `@Anchor` | Dropdown selector (default 330x32) |
| `@CheckBox` | - | Checkbox only (22x22) |
| `@CheckBoxWithLabel` | `@Text`, `@Checked` | Checkbox with label text |

**TextField Properties:**
- `PlaceholderText` - Placeholder text
- `FlexWeight` - Flexible width
- `Value` - Current text value

**NumberField Properties:**
- `Value` - Numeric value
- `PlaceholderText` - Placeholder text

**CheckBoxWithLabel Properties:**
- `@Text` - Label text
- `@Checked` - Initial state (true/false)

**Usage:**
```
$C.@TextField #NameInput {
  FlexWeight: 1;
  PlaceholderText: "Enter name...";
}

$C.@NumberField #AmountInput {
  Anchor: (Width: 100);
  Value: 50;
}

$C.@CheckBoxWithLabel #EnableOption {
  @Text = "Enable feature";
  @Checked = true;
  Anchor: (Height: 28);
}

$C.@DropdownBox #MyDropdown {
  Anchor: (Width: 200, Height: 32);
}
```

### Container Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@Container` | `@ContentPadding`, `@CloseButton` | Styled container with title area |
| `@DecoratedContainer` | `@ContentPadding`, `@CloseButton` | Container with decorative borders |
| `@Panel` | - | Simple panel with border |
| `@PageOverlay` | - | Semi-transparent background overlay |

**Container Structure:**
- `#Title` - Title area (height: 38)
- `#Content` - Content area with padding
- `#CloseButton` - Optional close button

**Usage:**
```
$C.@Container {
  @CloseButton = true;
  Anchor: (Width: 400, Height: 300);

  // Title goes in #Title
  // Content goes in #Content
}
```

### Layout Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@ContentSeparator` | `@Anchor` | Horizontal line separator (height: 1) |
| `@VerticalSeparator` | - | Vertical separator (width: 6) |
| `@HeaderSeparator` | - | Header section separator (5x34) |
| `@PanelSeparatorFancy` | `@Anchor` | Decorative panel separator |
| `@ActionButtonContainer` | - | Container for action buttons |
| `@ActionButtonSeparator` | - | Space between action buttons (width: 35) |

**Usage:**
```
$C.@ContentSeparator { Anchor: (Height: 1); }

Group { Anchor: (Height: 16); }  // Vertical spacer

$C.@VerticalSeparator {}
```

### Text Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@Title` | `@Text`, `@Alignment` | Styled title label |
| `@Subtitle` | `@Text` | Styled subtitle label |
| `@TitleLabel` | - | Large centered title (FontSize: 40) |
| `@PanelTitle` | `@Text`, `@Alignment` | Panel section title |

**Usage:**
```
$C.@Title {
  @Text = "My Title";
  @Alignment = Center;
  Anchor: (Height: 38);
}

$C.@Subtitle {
  @Text = "Subtitle text";
}
```

### Utility Components

| Component | Parameters | Description |
|-----------|------------|-------------|
| `@DefaultSpinner` | `@Anchor` | Loading spinner animation (32x32) |
| `@HeaderSearch` | `@MarginRight` | Search input with icon |
| `@BackButton` | - | Pre-positioned back button |

**Usage:**
```
$C.@DefaultSpinner {
  Anchor: (Width: 32, Height: 32);
}
```

### Available Styles

#### Button Styles

| Style | Description |
|-------|-------------|
| `@DefaultTextButtonStyle` | Primary button style |
| `@SecondaryTextButtonStyle` | Secondary button style |
| `@TertiaryTextButtonStyle` | Tertiary button style |
| `@CancelTextButtonStyle` | Destructive/cancel button style |
| `@SmallDefaultTextButtonStyle` | Small primary button style |
| `@SmallSecondaryTextButtonStyle` | Small secondary button style |
| `@DefaultButtonStyle` | Button without text |
| `@SecondaryButtonStyle` | Secondary button without text |
| `@TertiaryButtonStyle` | Tertiary button without text |
| `@CancelButtonStyle` | Cancel button without text |

#### Label Styles

| Style | Properties |
|-------|------------|
| `@DefaultLabelStyle` | FontSize: 16, TextColor: #96a9be |
| `@DefaultButtonLabelStyle` | FontSize: 17, TextColor: #bfcdd5, Bold, Uppercase, Center |
| `@TitleStyle` | FontSize: 15, Bold, Uppercase, TextColor: #b4c8c9, Secondary font |
| `@SubtitleStyle` | FontSize: 15, Uppercase, TextColor: #96a9be |
| `@PopupTitleStyle` | FontSize: 38, Bold, Uppercase, Center, LetterSpacing: 2 |

#### Input Styles

| Style | Description |
|-------|-------------|
| `@DefaultInputFieldStyle` | Default text input style |
| `@DefaultInputFieldPlaceholderStyle` | Placeholder text style (TextColor: #6e7da1) |
| `@InputBoxBackground` | Input field background |
| `@InputBoxHoveredBackground` | Input field hover state |
| `@InputBoxSelectedBackground` | Input field selected state |

#### Other Styles

| Style | Description |
|-------|-------------|
| `@DefaultScrollbarStyle` | Scrollbar styling |
| `@DefaultCheckBoxStyle` | Checkbox styling |
| `@DefaultDropdownBoxStyle` | Dropdown styling |
| `@DefaultSliderStyle` | Slider styling |
| `@DefaultTextTooltipStyle` | Tooltip styling |
| `@DefaultColorPickerStyle` | Color picker styling |

### Color Constants

```
@DisabledColor = #797b7c;
```

### LabelStyle Properties

When creating custom `LabelStyle`:

```
LabelStyle(
  FontSize: 16,
  TextColor: #ffffff,
  RenderBold: true,
  RenderUppercase: true,
  HorizontalAlignment: Center,  // Start, Center, End
  VerticalAlignment: Center,    // Top, Center, Bottom
  FontName: "Default",          // or "Secondary"
  LetterSpacing: 0,
  Wrap: true                    // Text wrapping
)
```

### TextButtonStyle Structure

```
@MyButtonStyle = TextButtonStyle(
  Default: (
    Background: PatchStyle(TexturePath: "path.png", Border: 12),
    LabelStyle: @SomeLabelStyle
  ),
  Hovered: (
    Background: PatchStyle(TexturePath: "hovered.png", Border: 12),
    LabelStyle: @SomeLabelStyle
  ),
  Pressed: (
    Background: PatchStyle(TexturePath: "pressed.png", Border: 12),
    LabelStyle: @SomeLabelStyle
  ),
  Disabled: (
    Background: PatchStyle(TexturePath: "disabled.png", Border: 12),
    LabelStyle: @DisabledLabelStyle
  ),
  Sounds: @ButtonSounds
);
```

### PatchStyle (9-slice backgrounds)

```
PatchStyle(
  TexturePath: "Common/MyTexture.png",
  Border: 12,                    // All sides equal
  // OR
  HorizontalBorder: 80,          // Left/right borders
  VerticalBorder: 12             // Top/bottom borders
)
```

### Anchor Properties

```
Anchor: (
  Width: 100,
  Height: 50,
  Top: 10,
  Bottom: 10,
  Left: 10,
  Right: 10,
  Horizontal: 10,  // Left + Right
  Vertical: 10     // Top + Bottom
);
```

### Padding Properties

```
Padding: (
  Full: 20,           // All sides
  Horizontal: 10,     // Left + Right
  Vertical: 10,       // Top + Bottom
  Top: 10,
  Bottom: 10,
  Left: 10,
  Right: 10
);
```

---

## Required Imports

```java
// Core UI
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.ui.builder.EventData;
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

// ⚠️ IMPORTANT: Thread-Safety
// UI methods like handleDataEvent often run on network threads.
// ALWAYS access player stats (Health, Mana) using:
// EntityStatMap stats = playerRef.getComponent(EntityStatMap.getComponentType());
// Do NOT use store.getComponent() directly if you are not sure you are on the World Tick thread.

// Player & Commands
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;
import com.hypixel.hytale.server.core.universe.world.World;
import com.hypixel.hytale.server.core.Message;

// Notifications
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;
```
