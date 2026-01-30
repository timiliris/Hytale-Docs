---
id: ui-reference
title: Referencia del Sistema de IU
sidebar_label: Referencia de IU
sidebar_position: 10
description: Referencia técnica para sintaxis de archivos .ui, elementos y sistemas de estilo - DSL syntax, Common.ui components, Java API, and all properties
---

# UI System Reference

This is the complete technical## Visión General
El sistema de IU de Hytale utiliza un lenguaje de marcado personalizado para definir interfaces. Similar a HTML/CSS pero optimizado para el motor del juego.

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

| Rule                          | Correct                | Incorrect          |
| ----------------------------- | ---------------------- | ------------------ |
| String values must be quoted  | `Text: "Hello";`       | `Text: Hello;`     |
| Properties end with semicolon | `Width: 100;`          | `Width: 100`       |
| Colors use hex format         | `#ffffff`, `#fff`      | `white`, `rgb()`   |
| Alpha in colors               | `#141c26(0.95)`        | `#141c26cc`        |
| Element IDs start with #      | `Label #Title { }`     | `Label Title { }`  |
| One root element per file     | Single `Group { }`     | Multiple roots     |
| Import syntax                 | `$C = "../Common.ui";` | `import Common.ui` |

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

## Tipos de Elementos

Estos son los tipos de nodos base disponibles en el sistema de IU.ary container element for layouts.

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

| Propiedad    | Tipo   | Descripción                                                    |
| ------------ | ------ | -------------------------------------------------------------- | -------- |
| `id`         | Cadena | Identificador único para scripting (e.g., `#myButton`)         |
| `class`      | Cadena | Clase de estilo para CSS (e.g., `.primary-btn`)                |
| `width`      | Valor  | Ancho del elemento (e.g., `100px`, `50%`)                      |
| `height`     | Valor  | Alto del elemento                                              |
| `padding`    | Box    | Relleno interno (e.g., `10 5 10 5`)                            |
| `margin`     | Box    | Margen externo                                                 |
| `visibility` | Enum   | `visible`, `hidden`, `collapsed`                               |
| `opacity`    | Float  | 0.0 a 1.0                                                      |
| `zIndex`     | Int    | Orden de apilamiento                                           |
| `layout`     | Enum   | `vertical`, `horizontal` (para Grupos)                         |
| `align`      | Enum   | Alineación en el contenedor padre (`center`, `top-left`, etc.) | Display) |

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

### Entradas

| Nombre de Plantilla | Propiedades Requeridas | Descripción                        |
| ------------------- | ---------------------- | ---------------------------------- | ----- |
| `InputField`        | `id`, `hint`           | Entrada de texto de una sola línea |
| `TextArea`          | `id`                   | Entrada de texto multilínea        | yling |
| `Anchor`            | Anchor                 | Size constraints                   |
| `Visible`           | Boolean                | Visibility                         |

### TextButton

```
TextButton #MyButton {
  Text: "Click Me";
  Anchor: (Width: 120, Height: 44);
  Style: @MyButtonStyle;
}
```

**Properties:**

| Property  | Type            | Description      |
| --------- | --------------- | ---------------- |
| `Text`    | String          | Button label     |
| `Style`   | TextButtonStyle | Button styling   |
| `Anchor`  | Anchor          | Size constraints |
| `Enabled` | Boolean         | Can be clicked   |
| `Visible` | Boolean         | Visibility       |

### Image (Deprecated Pattern)

> **⚠️ Warning:** The direct `<Image>` node is widely deprecated in current Hytale### Image (Imagen)
> Muestra una textura o sprite.

- **Equivalente HTML:** `<img>`
- **Nota:** En algunas versiones, es más seguro usar `Group` con propiedad `Background`. instead.

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

| Property      | Type   | Description        |
| ------------- | ------ | ------------------ |
| `TexturePath` | String | Path to texture    |
| `Anchor`      | Anchor | Size constraints   |
| `Tint`        | Color  | Color tint overlay |
| `Opacity`     | Number | Transparency       |

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

| Property          | Type            | Description            |
| ----------------- | --------------- | ---------------------- |
| `Value`           | String          | Current text value     |
| `PlaceholderText` | String          | Placeholder when empty |
| `Style`           | InputFieldStyle | Input styling          |
| `Anchor`          | Anchor          | Size constraints       |
| `FlexWeight`      | Number          | Flexible width         |

### TextInput (Entrada de Texto)

Un campo para entrada de texto del usuario.

- **Equivalente HTML:** `<input type="text">`
- **Uso:** Chat, búsqueda, campos de formulario.erText: "Enter name...";
  Anchor: (Height: 38);
  Style: @DefaultInputFieldStyle;
  FlexWeight: 1;
  }

```

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
Width: 200, // Fixed width
Height: 50, // Fixed height
Top: 10, // Top margin
Bottom: 10, // Bottom margin
Left: 10, // Left margin
Right: 10, // Right margin
Horizontal: 10, // Left + Right
Vertical: 10 // Top + Bottom
);

// Shorthand
Anchor: (Width: 200, Height: 50);
Anchor: (Height: 40);

```

### Padding

Internal spacing within containers.

```

Padding: (
Full: 20, // All sides
Horizontal: 10, // Left + Right
Vertical: 10, // Top + Bottom
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

How children are arranged in a### Contenedores
| Nombre de Plantilla | Descripción |
|---|---|
| `WindowContent` | Contenedor principal con fondo estándar |
| `Panel` | Contenedor secundario más oscuro |
| `ScrollPanel` | Contenedor con barra de desplazamiento |izontally from left |
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
Background: #ffffff; // White
Background: #fff; // Short form
Background: #141c26; // Dark blue

// With alpha
Background: #141c26(0.95); // 95% opacity
Background: #000000(0.5); // 50% black overlay

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
HorizontalAlignment: Center, // Start, Center, End
VerticalAlignment: Center, // Top, Center, Bottom
FontName: "Default", // or "Secondary"
LetterSpacing: 0,
LineSpacing: 1.0,
Wrap: true,
Overflow: Ellipsis // or Clip, Visible
);

// Inline style
Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);

```

### Sistema de Estilos
El sistema de estilos permite definir propiedades visuales reutilizables.

```

@MyLabelStyle = LabelStyle(
FontSize: 16,
TextColor: #ffffff,
RenderBold: true,
RenderItalic: false,
RenderUppercase: false,
HorizontalAlignment: Center, // Start, Center, End
VerticalAlignment: Center, // Top, Center, Bottom
FontName: "Default", // or "Secondary"
LetterSpacing: 0,
LineSpacing: 1.0,
Wrap: true,
Overflow: Ellipsis // or Clip, Visible
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
Border: 12 // All sides (Top, Bottom, Left, Right)
)

// Advanced Syntax (Different borders)
PatchStyle(
TexturePath: "Common/Panel.png",
HorizontalBorder: 80, // Affects Left and Right only
VerticalBorder: 12 // Affects Top and Bottom only
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

### Componentes de Entrada

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@TextField` | `@Anchor` | Entrada de texto (altura: 38) |
| `@NumberField` | `@Anchor` | Entrada numérica (altura: 38) |
| `@DropdownBox` | `@Anchor` | Selector desplegable |
| `@CheckBox` | - | Casilla de verificación solo (22x22) |
| `@CheckBoxWithLabel` | `@Text`, `@Checked` | Casilla de verificación con etiqueta |

**Uso:**
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

### Componentes de Contenedor

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@Container` | `@ContentPadding`, `@CloseButton` | Contenedor estilizado con título |
| `@DecoratedContainer` | `@ContentPadding`, `@CloseButton` | Contenedor con borde decorativo |
| `@Panel` | - | Panel simple con borde |
| `@PageOverlay` | - | Fondo semitransparente |

**Estructura:**
```

$C.@Container {
@CloseButton = true;
Anchor: (Width: 400, Height: 300);

// Has #Title and #Content areas
}

```

### Componentes de Diseño

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@ContentSeparator` | `@Anchor` | Línea horizontal (altura: 1) |
| `@VerticalSeparator` | - | Línea vertical (ancho: 6) |
| `@HeaderSeparator` | - | Separador de sección de encabezado |
| `@PanelSeparatorFancy` | `@Anchor` | Separador decorativo |
| `@ActionButtonContainer` | - | Contenedor para botones de acción |
| `@ActionButtonSeparator` | - | Espacio entre botones de acción |

### Componentes de Texto

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@Title` | `@Text`, `@Alignment` | Etiqueta de título estilizada |
| `@Subtitle` | `@Text` | Subtítulo estilizado |
| `@TitleLabel` | - | Título centrado grande (40px) |
| `@PanelTitle` | `@Text`, `@Alignment` | Título de sección de panel |

### Componentes de Utilidad

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@DefaultSpinner` | `@Anchor` | Spinner de carga (32x32) |
| `@HeaderSearch` | `@MarginRight` | Entrada de búsqueda con icono |

---

## Constantes de Estilo de Common.ui

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

````

## Common.ui Styles

### Botones
| Nombre de Plantilla | Propiedades Requeridas | Descripción |
|---|---|---|
| `Button` | `text`, `onPress` | Botón estándar del juego |
| `PrimaryButton` | `text`, `onPress` | Botón resaltado/principal |
| `CloseButton` | `onPress` | Botón 'X' para cerrar ventanas | Tertiary button |
| `@CancelTextButtonStyle` | Destructive/cancel |
| `@SmallDefaultTextButtonStyle` | Small primary |
| `@SmallSecondaryTextButtonStyle` | Small secondary |
| `@DefaultButtonStyle` | Icon button |
| `@SecondaryButtonStyle` | Secondary icon |
| `@TertiaryButtonStyle` | Tertiary icon |
| `@CancelButtonStyle` | Cancel icon |

### Estilos de Etiqueta (Label Styles)

| Estilo | Propiedades |
|-------|------------|
| `@DefaultLabelStyle` | FontSize: 16, TextColor: #96a9be |
| `@DefaultButtonLabelStyle` | FontSize: 17, Bold, Uppercase, Center |
| `@TitleStyle` | FontSize: 15, Bold, Uppercase, #b4c8c9 |
| `@SubtitleStyle` | FontSize: 15, Uppercase, #96a9be |
| `@PopupTitleStyle` | FontSize: 38, Bold, Uppercase, Center |

### Estilos de Entrada (Input Styles)

| Estilo | Descripción |
|-------|-------------|
| `@DefaultInputFieldStyle` | Estilo de entrada de texto |
| `@DefaultInputFieldPlaceholderStyle` | Texto de marcador de posición (#6e7da1) |
| `@InputBoxBackground` | Fondo de caja de entrada |
| `@InputBoxHoveredBackground` | Estado Hover |
| `@InputBoxSelectedBackground` | Estado seleccionado |

### Otros Estilos

| Estilo | Descripción |
|-------|-------------|
| `@DefaultScrollbarStyle` | Estilo de barra de desplazamiento |
| `@DefaultCheckBoxStyle` | Estilo de casilla de verificación |
| `@DefaultDropdownBoxStyle` | Estilo de desplegable |
| `@DefaultSliderStyle` | Estilo de control deslizante |
| `@DefaultTextTooltipStyle` | Estilo de información sobre herramientas |
| `@DefaultColorPickerStyle` | Estilo de selector de color |

---

## Referencia de API Java

### UICommandBuilder

Construye comandos para manipular elementos de IU.

```java
UICommandBuilder cmd = new UICommandBuilder();
````

**Métodos:**

| Método                                                 | Descripción                       |
| ------------------------------------------------------ | --------------------------------- |
| `append(String documentPath)`                          | Carga un documento de IU          |
| `append(String selector, String documentPath)`         | Añade plantilla al contenedor     |
| `appendInline(String selector, String document)`       | Añade definición de IU inline     |
| `insertBefore(String selector, String documentPath)`   | Inserta antes del elemento        |
| `insertBeforeInline(String selector, String document)` | Inserta inline antes              |
| `set(String selector, String value)`                   | Establece propiedad de cadena     |
| `set(String selector, boolean value)`                  | Establece propiedad booleana      |
| `set(String selector, int value)`                      | Establece propiedad entera        |
| `set(String selector, float value)`                    | Establece propiedad flotante      |
| `set(String selector, double value)`                   | Establece propiedad doble         |
| `set(String selector, Message message)`                | Establece mensaje localizado      |
| `set(String selector, Value<T> ref)`                   | Establece referencia de documento |
| `setNull(String selector)`                             | Establece a nulo                  |
| `setObject(String selector, Object data)`              | Establece objeto codificable      |
| `set(String selector, T[] data)`                       | Establece matriz                  |
| `set(String selector, List<T> data)`                   | Establece lista                   |
| `clear(String selector)`                               | Elimina todos los hijos           |
| `remove(String selector)`                              | Elimina elemento                  |
| `getCommands()`                                        | Obtiene comandos compilados       |

**Ejemplos:**

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

Construye enlaces de eventos para interacciones de IU.

```java
UIEventBuilder evt = new UIEventBuilder();
```

**Métodos:**

| Método                                                  | Descripción                |
| ------------------------------------------------------- | -------------------------- |
| `addEventBinding(type, selector)`                       | Enlace de evento básico    |
| `addEventBinding(type, selector, locksInterface)`       | Con bloqueo de interfaz    |
| `addEventBinding(type, selector, data)`                 | Con datos de evento        |
| `addEventBinding(type, selector, data, locksInterface)` | Firma completa             |
| `getEvents()`                                           | Obtiene enlaces compilados |

**Ejemplos:**

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

| Tipo                            | ID  | Descripción                      |
| ------------------------------- | --- | -------------------------------- |
| `Activating`                    | 0   | Clic o tecla Enter               |
| `RightClicking`                 | 1   | Clic derecho del ratón           |
| `DoubleClicking`                | 2   | Doble clic                       |
| `MouseEntered`                  | 3   | Ratón entra en elemento          |
| `MouseExited`                   | 4   | Ratón sale de elemento           |
| `ValueChanged`                  | 5   | Valor de entrada/slider cambiado |
| `ElementReordered`              | 6   | Elemento reordenado              |
| `Validating`                    | 7   | Validación de formulario         |
| `Dismissing`                    | 8   | Página siendo descartada         |
| `FocusGained`                   | 9   | Elemento ganó foco               |
| `FocusLost`                     | 10  | Elemento perdió foco             |
| `KeyDown`                       | 11  | Tecla presionada                 |
| `MouseButtonReleased`           | 12  | Botón del ratón soltado          |
| `SlotClicking`                  | 13  | Ranura de inventario clicada     |
| `SlotDoubleClicking`            | 14  | Ranura de inv. doble clicada     |
| `SlotMouseEntered`              | 15  | Ratón entró en ranura            |
| `SlotMouseExited`               | 16  | Ratón salió de ranura            |
| `DragCancelled`                 | 17  | Operación de arrastre cancelada  |
| `Dropped`                       | 18  | Ítem soltado                     |
| `SlotMouseDragCompleted`        | 19  | Arrastre de ranura completado    |
| `SlotMouseDragExited`           | 20  | Arrastre de ranura salió         |
| `SlotClickReleaseWhileDragging` | 21  | Clic soltado al arrastrar        |
| `SlotClickPressWhileDragging`   | 22  | Clic presionado al arrastrar     |
| `SelectedTabChanged`            | 23  | Selección de pestaña cambiada    |

### Estados

Los elementos soportan pseudo-estados para interacción:

- `:hover` - Ratón sobre el elemento
- `:active` - Elemento siendo presionado
- `:disabled` - Elemento deshabilitado
- `:focus` - Elemento tiene foco de tecladoered |
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

Contenedor para pares clave-valor de datos de eventos.

```java
// Crear con datos
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

Referencia valores desde documentos de IU.

```java
// Create document reference
Value<String> styleRef = Value.ref("Pages/Styles.ui", "SelectedStyle");

// Create direct value
Value<String> directValue = Value.of("Hello");

// Use in command
cmd.set("#Element.Style", styleRef);
```

### InteractiveCustomUIPage\<T\>

Clase base para páginas de IU interactivas.

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

**Métodos:**

| Método                              | Descripción                    |
| ----------------------------------- | ------------------------------ |
| `build(ref, cmd, evt, store)`       | Llamado cuando la página abre  |
| `handleDataEvent(ref, store, data)` | Llamado en interacción usuario |
| `sendUpdate(cmd, clear)`            | Envía actualización de IU      |
| `sendUpdate(cmd, evt, clear)`       | Envía actualiz. con enlaces    |
| `rebuild()`                         | Reconstruye la página complet. |
| `close()`                           | Cierra la página               |
| `onDismiss(ref, store)`             | Llamado cuando página cierra   |
| `setLifetime(lifetime)`             | Cambia vida de la página       |
| `getLifetime()`                     | Obtiene tiempo de vida actual  |

### Definición de Estilos

```css
/* Definición de estilo base */
.my-button {
  width: 200px;
  height: 40px;
  background: #333333;
  color: white;
}

/* Estado Hover */
.my-button:hover {
  background: #444444;
}

/* Estado Active */
.my-button:active {
  background: #222222;
  offset: 0 1; /* Desplazamiento hacia abajo 1px */
}
```

## Referencia de API Java (Gestión de IU)

Clases principales para interactuar con la IU desde el servidor.

### PageManager

Gestiona la apertura/cierre de páginas de pantalla completa.

| Método                                     | Descripción                                             |
| ------------------------------------------ | ------------------------------------------------------- |
| `openCustomPage(Ref, Store, CustomUIPage)` | Abre una nueva página                                   |
| `closeWithAnimation(Ref, Store)`           | Cierra la página actual con animación                   |
| `setPage(Ref, Store, Page)`                | Establece página directamente (o Page.None para cerrar) |
| `sendUpdate(cmd, evt, clear)`              | Send update with new bindings                           |
| `rebuild()`                                | Completely rebuild the page                             |
| `close()`                                  | Close the page                                          |
| `onDismiss(ref, store)`                    | Called when page closes                                 |
| `setLifetime(lifetime)`                    | Change page lifetime                                    |
| `getLifetime()`                            | Get current lifetime                                    |

### CustomPageLifetime

| Valor                                 | Descripción                      |
| ------------------------------------- | -------------------------------- |
| `CantClose`                           | No puede ser cerrada por usuario |
| `CanDismiss`                          | Tecla ESC cierra la página       |
| `CanDismissOrCloseThroughInteraction` | ESC o clic en botón              |

### BasicCustomUIPage

Clase base simplificada para páginas no interactivas.

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

### Button (Botón)

Un elemento interactivo en el que se puede hacer clic.

- **Equivalente HTML:** `<button>`
- **Uso:** Enviar formularios, activar acciones.
- **Eventos:** `onPress`, `onHover`, `onExit`.emId;

      public MyEventData() {}  // Required no-arg constructor

  }

````

### Códecs Disponibles

| Códec | Tipo |
|-------|------|
| `Codec.STRING` | Cadena |
| `Codec.INT` | Entero |
| `Codec.LONG` | Largo |
| `Codec.FLOAT` | Flotante |
| `Codec.DOUBLE` | Doble |
| `Codec.BOOL` | Booleano |

---

## Sintaxis de Selectores

### Selectores Básicos

```java
// By ID
"#ElementId"

// Property access
"#ElementId.PropertyName"

// Nested element
"#Parent #Child"

// Nested property
"#Parent #Child.PropertyName"
````

### Selectores Dinámicos (Indexados)

Cuando se añaden plantillas, se convierten en elementos indexados:

```java
// Append creates indexed elements
cmd.append("#Container", "template.ui");  // Creates #Container[0]
cmd.append("#Container", "template.ui");  // Creates #Container[1]

// Access by index
"#Container[0]"           // First element
"#Container[1]"           // Second element
"#Container[0].Text"      // Property of first element
```

**Importante:** La plantilla añadida ES el elemento en ese índice. NO intente navegar dentro:

```java
// CORRECT - element at index IS the template
cmd.set("#Container[0].Text", "Hello");

// WRONG - looking for child inside (usually fails)
cmd.set("#Container[0] #Button.Text", "Hello");
```

### Nombres de Propiedades

| En archivo .ui             | En selector Java |
| -------------------------- | ---------------- |
| `@Text` (parám. plantilla) | `.Text`          |
| `@Checked` (parám. plant.) | `.Value`         |
| `Visible:`                 | `.Visible`       |
| `Text:`                    | `.Text`          |
| `Value:`                   | `.Value`         |

**Parámetros de Plantilla vs Propiedades:**

- `@Text` en .ui = valor inicial cuando se instancia la plantilla
- `.Text` en Java = propiedad en tiempo de ejecución que puedes modificar

---

## Tipos de CustomUICommand

Tipos de comandos internos (para referencia):

| Tipo                 | ID  | Descripción                 |
| -------------------- | --- | --------------------------- |
| `Append`             | 0   | Añadir desde documento      |
| `AppendInline`       | 1   | Añadir definición inline    |
| `InsertBefore`       | 2   | Insertar antes del elemento |
| `InsertBeforeInline` | 3   | Insertar inline antes       |
| `Remove`             | 4   | Eliminar elemento           |
| `Set`                | 5   | Establecer valor propiedad  |
| `Clear`              | 6   | Limpiar todos los hijos     |

---

## Tipos de Objetos Soportados

Objetos que pueden pasarse a `setObject()`:

| Tipo                | Descripción                   |
| ------------------- | ----------------------------- |
| `Area`              | Área rectangular              |
| `ItemGridSlot`      | Datos de ranura de inventario |
| `ItemStack`         | Ítem con cantidad/calidad     |
| `LocalizableString` | Cadena traducida              |
| `PatchStyle`        | Fondo de 9 cortes (9-slice)   |
| `DropdownEntryInfo` | Opción de desplegable         |
| `Anchor`            | Restricciones tamaño/posición |

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

## Mejores Prácticas

### Organización de Archivos de IU

```
resources/Common/UI/Custom/YourPlugin/
├── MainPage.ui          # Diseño principal
├── Components/
│   ├── ListItem.ui      # Elemento de lista reutilizable
│   └── Card.ui          # Tarjeta reutilizable
└── Styles/
    └── CustomStyles.ui  # Estilos personalizados
```

### Rendimiento

1.  **Minimizar actualizaciones** - Agrupar cambios en una sola llamada `sendUpdate()`
2.  **Usar clear() sabiamente** - Solo cuando se reconstruyen listas completas
3.  **Evitar rebuild()** - Usar llamadas `set()` dirigidas en su lugar
4.  **Indexar elementos** - Pre-calcular selectores para listas dinámicas

### Prevención de Errores

1.  **Un solo elemento raíz** - Cada archivo .ui debe tener exactamente una raíz
2.  **Citar todas las cadenas** - `Text: "Hola";` no `Text: Hola;`
3.  **Terminar con punto y coma** - Cada propiedad necesita `;`
4.  **Coincidir IDs exactamente** - Coincidencia sensible a mayúsculas
5.  **Probar incrementalmente** - Añadir complejidad gradualmente
