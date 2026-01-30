---
title: "Referencia Completa de IU"
description: "La guía completa definitiva del sistema de IU de Hytale - sintaxis, componentes, propiedades, estilos, diseños y API Java"
---

# Sistema de IU de Hytale - Referencia Completa

Esta es la referencia completa definitiva para el sistema de IU personalizado de Hytale. Cubre todo, desde la sintaxis básica hasta patrones avanzados, extraídos del código del servidor descompilado y ejemplos del mundo real.

## Tabla de Contenidos

1. [Visión General de Sintaxis DSL](#1-dsl-syntax-overview)
2. [Importaciones y Variables](#2-imports-and-variables)
3. [Tipos de Componentes](#3-component-types)
4. [Referencia de Propiedades](#4-property-reference)
5. [Sistema de Anclaje (Posicionamiento)](#5-anchor-system-positioning)
6. [Modos de Diseño](#6-layout-modes)
7. [Sistema de Estilos](#7-style-system)
8. [Formatos de Color](#8-color-formats)
9. [Tipos de Valor](#9-value-types)
10. [Plantillas y Herencia](#10-templates-and-inheritance)
11. [Enlaces de Eventos](#11-event-bindings)
12. [API Java](#12-java-api)
13. [Librería Common.ui](#13-commonui-library)
14. [Ejemplos Completos](#14-complete-examples)

---

## 1. Visión General de Sintaxis DSL

Hytale utiliza un Lenguaje Específico de Dominio (DSL) personalizado para definiciones de IU - **no XML, JSON, o XAML**.

### Estructura Básica

```
// Imports
$C = "../Common.ui";

// Variables
@MyColor = #3a7bd5;

// Styles
@MyStyle = LabelStyle(FontSize: 14, TextColor: #ffffff);

// Components
Group #RootContainer {
  Anchor: (Width: 400, Height: 300);
  Background: #1a1a2e(0.95);

  Label #Title {
    Text: "Hello World";
  }
}
```

### Reglas de Sintaxis

| Elemento             | Prefijo          | Ejemplo                     |
| -------------------- | ---------------- | --------------------------- |
| Alias de importación | `$`              | `$C = "../Common.ui";`      |
| Variable/Estilo      | `@`              | `@MyColor = #ff0000;`       |
| ID de Elemento       | `#`              | `Label #Title { }`          |
| Color                | `#`              | `#3a7bd5` o `#3a7bd5(0.95)` |
| Ref. Plantilla       | `$Alias.@Nombre` | `$C.@TextButton`            |
| Referencia           | `@Nombre`        | `Style: @MyStyle;`          |
| Propagación          | `...`            | `...@BaseStyle`             |
| Localizado           | `%`              | `%server.customUI.key`      |

---

## 2. Importaciones y Variables

### Importaciones de Archivos

```
$C = "../Common.ui";
$Sounds = "Sounds.ui";
$Styles = "../styles/Theme.ui";
```

Acceder a contenido importado: `$C.@TextButton`, `$Sounds.@ButtonSounds`

### Definiciones de Variables

```
// Colors
@PrimaryColor = #3a7bd5;
@TextColor = #ffffff;
@DisabledColor = #6b7280(0.5);

// Numbers
@ButtonHeight = 44;
@DefaultPadding = 16;

// Booleans
@ShowHeader = true;

// Strings
@DefaultText = "Click here";

// Objects
@DefaultAnchor = (Width: 100, Height: 40);

// References to other variables
@SecondaryColor = @PrimaryColor;
```

---

## 3. Tipos de Componentes

### Componentes de Diseño y Contenedor

| Component         | Tipo                       | Descripción                                 | Uso Común                             |
| ----------------- | -------------------------- | ------------------------------------------- | ------------------------------------- |
| `Group`           | Contenedor genérico        | Diseño, agrupamiento, contenedores de fondo | `LayoutMode`, `Padding`, `Background` |
| `Container`       | Contenedor genérico        | Contenedor básico                           | `LayoutMode`, `Padding`               |
| `Panel`           | Variante de contenedor     | Paneles de fondo                            | `Background`, `BorderRadius`          |
| `Box`             | Caja flexible              | Contenedor con peso flexible                | `FlexWeight`                          |
| `HorizontalGroup` | Grupo de diseño horizontal | Organiza elementos horizontalmente          | `Gap`, `Alignment`                    |
| `VerticalGroup`   | Grupo de diseño vertical   | Organiza elementos verticalmente            | `Gap`, `Alignment`                    |
| `ScrollView`      | Contenedor desplazable     | Contenido con desplazamiento                | `ScrollbarStyle`                      |
| `ScrollPanel`     | Panel desplazable          | Panel con desplazamiento                    | `ScrollbarStyle`                      |
| `Grid`            | Diseño de cuadrícula       | Organiza elementos en una cuadrícula        | `Columns`, `Gap`                      |
| `Stack`           | Apilamiento Z-index        | Superpone elementos                         | -                                     |
| `Frame`           | Contenedor de marco        | Contenedor con fondo                        | `Background`                          |

### Componentes de Visualización de Texto

| Component  | Descripción                   | Propiedades Clave            |
| ---------- | ----------------------------- | ---------------------------- |
| `Label`    | Muestra texto                 | `Text`, `Style` (LabelStyle) |
| `Text`     | Elemento de texto             | `Text`, `Style`              |
| `RichText` | Texto con formato enriquecido | `Text`, `Wrap`               |

### Componentes de Entrada e Interactivos

| Component          | Tipo                                   | Descripción                   | Propiedades Clave                       |
| ------------------ | -------------------------------------- | ----------------------------- | --------------------------------------- |
| `TextField`        | Campo de entrada de texto de una línea | Entrada de texto simple       | `PlaceholderText`, `Value`, `Style`     |
| `TextInput`        | Elemento de entrada de texto           | Entrada de texto genérica     | `PlaceholderText`, `MaxLength`          |
| `TextArea`         | Entrada de texto multilínea            | Entrada de texto grande       | `PlaceholderText`, `Wrap`               |
| `NumberField`      | Entrada numérica                       | Entrada de números            | `Min`, `Max`, `Step`, `Value`, `Format` |
| `CompactTextField` | Entrada de texto expandible            | Campo de texto que se expande | `CollapsedWidth`, `ExpandedWidth`       |

### Componentes de Botón

| Component           | Descripción                          | Propiedades Clave                  |
| ------------------- | ------------------------------------ | ---------------------------------- |
| `Button`            | Botón básico                         | `Style` (ButtonStyle)              |
| `TextButton`        | Botón con texto                      | `Text`, `Style` (TextButtonStyle)  |
| `ImageButton`       | Botón con imagen                     | `Texture`, `Style`                 |
| `IconButton`        | Botón solo con icono                 | `Icon`, `Style`                    |
| `ToggleButton`      | Botón de alternancia                 | `Checked`, `Style`                 |
| `CheckBox`          | Casilla de verificación              | `Checked`, `Style` (CheckBoxStyle) |
| `CheckBoxWithLabel` | Casilla de verificación con etiqueta | `Text`, `Checked`                  |
| `RadioButton`       | Botón de radio                       | `Group`, `Checked`                 |
| `BackButton`        | Botón de navegación hacia atrás      | `Style`                            |

### Componentes de Selección

| Component         | Descripción                         | Propiedades Clave                     |
| ----------------- | ----------------------------------- | ------------------------------------- |
| `Dropdown`        | Menú desplegable                    | `Style` (DropdownStyle)               |
| `DropdownBox`     | Selección desplegable               | `Entries`, `Style` (DropdownBoxStyle) |
| `ComboBox`        | Desplegable editable                | `Style`                               |
| `Select`          | Desplegable de selección            | `Options`                             |
| `FileDropdownBox` | Desplegable de selección de archivo | `Filter`                              |

### Componentes Deslizantes

| Component     | Descripción                         | Propiedades Clave                      |
| ------------- | ----------------------------------- | -------------------------------------- |
| `Slider`      | Deslizador de valor                 | `Min`, `Max`, `Value`, `Step`, `Style` |
| `FloatSlider` | Deslizador de valor flotante        | `Min`, `Max`, `Value`, `Step`          |
| `Scrollbar`   | Elemento de barra de desplazamiento | `Style` (ScrollbarStyle)               |
| `ProgressBar` | Indicador de progreso               | `Value`, `Max`, `Style`                |

### Componentes de Imagen y Visuales

| Component   | Descripción                   | Propiedades Clave                         |
| ----------- | ----------------------------- | ----------------------------------------- |
| `Image`     | Muestra imagen (**obsoleto**) | Usar `Group` con `Background` en su lugar |
| `Icon`      | Muestra icono                 | `TexturePath`, `Tint`                     |
| `Sprite`    | Sprite animado                | `TexturePath`, `Frame`, `FramesPerSecond` |
| `NineSlice` | Imagen escalable de 9 parches | `TexturePath`, `Border`                   |

### Componentes Específicos del Juego

| Component       | Descripción                                 | Propiedades Clave               |
| --------------- | ------------------------------------------- | ------------------------------- |
| `ItemSlot`      | Ranura de inventario                        | `Background`, `Overlay`, `Icon` |
| `ItemGrid`      | Cuadrícula de ranuras de ítems              | `SlotsPerRow`, `Slots`          |
| `ItemIcon`      | Muestra icono de ítem                       | `Item`                          |
| `Inventory`     | Contenedor de inventario                    | `Slots`                         |
| `InventorySlot` | Ranura de inventario individual             | `Index`                         |
| `Hotbar`        | Contenedor de barra de acceso rápido        | `Slots`                         |
| `HotbarSlot`    | Ranura de barra de acceso rápido individual | `Index`                         |
| `Tooltip`       | Ventana emergente de información            | `Style` (TextTooltipStyle)      |
| `TooltipPanel`  | Panel de información                        | `Style`                         |

### Componentes de Utilidad

| Component     | Descripción        | Propiedades Clave                   |
| ------------- | ------------------ | ----------------------------------- |
| `Divider`     | Divisor horizontal | `Color`, `Thickness`                |
| `Separator`   | Separador visual   | `Orientation`                       |
| `Spacer`      | Espacio vacío      | `Width`, `Height`                   |
| `ColorPicker` | Selector de color  | `Value`, `Style` (ColorPickerStyle) |

---

## 4. Referencia de Propiedades

### Propiedades de Anclaje (Diseño)

| Propiedad    | Tipo   | Descripción                        | Ejemplo                            |
| ------------ | ------ | ---------------------------------- | ---------------------------------- |
| `Anchor`     | Objeto | Contenedor para posicionamiento    | `Anchor: (Width: 100, Height: 50)` |
| `Left`       | Número | Distancia desde el borde izquierdo | `Left: 10`                         |
| `Right`      | Número | Distancia desde el borde derecho   | `Right: 10`                        |
| `Top`        | Número | Distancia desde el borde superior  | `Top: 20`                          |
| `Bottom`     | Número | Distancia desde el borde inferior  | `Bottom: 20`                       |
| `Width`      | Número | Ancho explícito                    | `Width: 100`                       |
| `Height`     | Número | Alto explícito                     | `Height: 50`                       |
| `MinWidth`   | Número | Ancho mínimo                       | `MinWidth: 50`                     |
| `MaxWidth`   | Número | Ancho máximo                       | `MaxWidth: 500`                    |
| `MinHeight`  | Número | Alto mínimo                        | `MinHeight: 30`                    |
| `MaxHeight`  | Número | Alto máximo                        | `MaxHeight: 100`                   |
| `Horizontal` | Número | Estiramiento horizontal            | `Horizontal: 0`                    |
| `Vertical`   | Número | Estiramiento vertical              | `Vertical: 0`                      |
| `Full`       | Número | Rellenar padre                     | `Full: 0`                          |

### Propiedades de Diseño (Flex/Grid)

| Propiedad             | Tipo   | Opciones                                                                          | Descripción              |
| --------------------- | ------ | --------------------------------------------------------------------------------- | ------------------------ |
| `LayoutMode`          | Enum   | `Top`, `TopScrolling`, `Left`, `Right`, `Center`, `Bottom`, `Overlay`, `Absolute` | Disposición de los hijos |
| `HorizontalAlignment` | Enum   | `Left`, `Center`, `Right`, `Stretch`                                              | Alineación horizontal    |
| `VerticalAlignment`   | Enum   | `Top`, `Center`, `Bottom`, `Stretch`                                              | Alineación vertical      |
| `FlexWeight`          | Número | -                                                                                 | Peso de tamaño flexible  |
| `Gap`                 | Número | -                                                                                 | Espacio entre hijos      |
| `Spacing`             | Número | -                                                                                 | Espaciado de elementos   |

### Propiedades de Relleno

| Propiedad            | Tipo          | Descripción         |
| -------------------- | ------------- | ------------------- |
| `Padding`            | Objeto/Número | Espaciado interno   |
| `Padding.Full`       | Número        | Todos los lados     |
| `Padding.Horizontal` | Número        | Izquierda + Derecha |
| `Padding.Vertical`   | Número        | Arriba + Abajo      |
| `Padding.Top`        | Número        | Solo arriba         |
| `Padding.Bottom`     | Número        | Solo abajo          |
| `Padding.Left`       | Número        | Solo izquierda      |
| `Padding.Right`      | Número        | Solo derecha        |

### Propiedades Visuales

| Propiedad        | Tipo             | Descripción           | Ejemplo                                        |
| ---------------- | ---------------- | --------------------- | ---------------------------------------------- |
| `Background`     | Color/PatchStyle | Fondo                 | `#1a1a2e` o `(TexturePath: "...", Border: 16)` |
| `Foreground`     | Color            | Color de primer plano | `#ffffff`                                      |
| `Color`          | Color            | Color del elemento    | `#3a7bd5`                                      |
| `Opacity`        | Número           | Transparencia (0-1)   | `0.95`                                         |
| `Alpha`          | Número           | Valor alfa (0-1)      | `0.8`                                          |
| `Visible`        | Booleano         | Visibilidad           | `true`                                         |
| `Enabled`        | Booleano         | Estado habilitado     | `true`                                         |
| `BorderColor`    | Color            | Color del borde       | `#96a9be`                                      |
| `BorderWidth`    | Número           | Grosor del borde      | `2`                                            |
| `CornerRadius`   | Número           | Redondeo de esquinas  | `6`                                            |
| `HitTestVisible` | Booleano         | Clickeable            | `true`                                         |

### Propiedades de Texto

| Propiedad         | Tipo     | Descripción            | Ejemplo                    |
| ----------------- | -------- | ---------------------- | -------------------------- |
| `Text`            | String   | Contenido de texto     | `"Hello"`                  |
| `TextColor`       | Color    | Color del texto        | `#ffffff`                  |
| `FontSize`        | Número   | Tamaño de fuente (px)  | `14`                       |
| `FontName`        | String   | Nombre de la fuente    | `"Default"`, `"Secondary"` |
| `RenderBold`      | Booleano | Texto en negrita       | `true`                     |
| `RenderItalic`    | Booleano | Texto en cursiva       | `false`                    |
| `RenderUppercase` | Booleano | Mayúsculas             | `true`                     |
| `Wrap`            | Booleano | Ajuste de texto        | `true`                     |
| `LineHeight`      | Número   | Altura de línea        | `1.5`                      |
| `LetterSpacing`   | Número   | Espaciado entre letras | `0.5`                      |
| `OutlineColor`    | Color    | Contorno de texto      | `#000000(0.5)`             |

### Propiedades de Imagen

| Propiedad          | Tipo   | Descripción           | Ejemplo                                         |
| ------------------ | ------ | --------------------- | ----------------------------------------------- |
| `TexturePath`      | String | Ruta de la textura    | `"Common/Button.png"`                           |
| `Texture`          | String | Referencia de textura | `"@ButtonTexture"`                              |
| `Border`           | Número | Borde de 9 parches    | `16`                                            |
| `HorizontalBorder` | Número | Borde horizontal      | `80`                                            |
| `VerticalBorder`   | Número | Borde vertical        | `20`                                            |
| `Tint`             | Color  | Tinte de color        | `#ff0000`                                       |
| `Frame`            | Objeto | Cuadro de animación   | `(Width: 32, Height: 32, PerRow: 8, Count: 72)` |
| `FramesPerSecond`  | Número | FPS de animación      | `30`                                            |
| `Area`             | Objeto | Región de textura     | `(X: 0, Y: 0, Width: 100, Height: 100)`         |

### Propiedades de Entrada

| Propiedad          | Tipo          | Descripción                    | Ejemplo                 |
| ------------------ | ------------- | ------------------------------ | ----------------------- |
| `PlaceholderText`  | String        | Texto de marcador de posición  | `"Enter text..."`       |
| `PlaceholderStyle` | LabelStyle    | Estilo de marcador de posición | `@PlaceholderStyle`     |
| `Value`            | Número/String | Valor actual                   | `50`                    |
| `Min`              | Número        | Valor mínimo                   | `0`                     |
| `Max`              | Número        | Valor máximo                   | `100`                   |
| `Step`             | Número        | Paso de valor                  | `5`                     |
| `Format`           | Objeto        | Formato numérico               | `(MaxDecimalPlaces: 0)` |
| `MaxLength`        | Número        | Longitud máxima del texto      | `100`                   |

---

## 5. Sistema de Anclaje (Posicionamiento)

Hytale utiliza un **sistema de posicionamiento basado en bordes** similar al posicionamiento absoluto de CSS.

### Posicionamiento Básico

```
// Tamaño fijo en posición
Anchor: (Left: 10, Top: 20, Width: 100, Height: 50);

// Solo tamaño (diseño de flujo)
Anchor: (Width: 400, Height: 300);

// Posición desde los bordes
Anchor: (Left: 50, Top: 170);
```

### Modos de Estiramiento

```
// Ancho completo, alto fijo
Anchor: (Left: 0, Right: 0, Height: 50);

// Alto completo, ancho fijo
Anchor: (Top: 0, Bottom: 0, Width: 200);

// Rellenar todo el padre
Anchor: (Full: 0);

// Estiramiento horizontal
Anchor: (Horizontal: 0, Height: 50);

// Estiramiento vertical
Anchor: (Vertical: 0, Width: 100);
```

### Desplazamientos Negativos

```
// Posicionar fuera de los límites del padre
Anchor: (Width: 32, Height: 32, Top: -16, Right: -16);
```

### Restricciones de Tamaño

```
Anchor: (
  Width: 200,
  Height: 100,
  MinWidth: 100,
  MaxWidth: 400,
  MinHeight: 50,
  MaxHeight: 200
);
```

---

## 6. Modos de Diseño

| Modo           | Comportamiento                                      | Caso de Uso                              |
| -------------- | --------------------------------------------------- | ---------------------------------------- |
| `Top`          | Hijos apilados verticalmente desde arriba           | Listas verticales, formularios           |
| `TopScrolling` | Vertical con desplazamiento                         | Listas desplazables                      |
| `Bottom`       | Hijos apilados desde abajo                          | Contenido alineado en la parte inferior  |
| `Left`         | Hijos dispuestos horizontalmente desde la izquierda | Barras de herramientas, filas de botones |
| `Right`        | Hijos dispuestos desde la derecha                   | Diseños RTL                              |
| `Center`       | Hijos centrados horizontalmente                     | Botones centrados                        |
| `Overlay`      | Hijos superpuestos (apilamiento Z)                  | Ventanas emergentes, modales             |
| `Absolute`     | Los hijos usan posicionamiento de Anclaje           | Diseños de forma libre                   |

### Ejemplo

```
Group {
  LayoutMode: Top;
  Gap: 12;
  Padding: (Full: 16);

  Label { Text: "Item 1"; }
  Label { Text: "Item 2"; }
  Label { Text: "Item 3"; }
}
```

---

## 7. Sistema de Estilos

### Tipos de Estilo

| Tipo de Estilo        | Usado Por             | Estados                                             |
| --------------------- | --------------------- | --------------------------------------------------- |
| `LabelStyle`          | Label, Text           | Predeterminado, Deshabilitado                       |
| `TextButtonStyle`     | TextButton            | Predeterminado, Flotante, Presionado, Deshabilitado |
| `ButtonStyle`         | Button, ImageButton   | Predeterminado, Flotante, Presionado, Deshabilitado |
| `CheckBoxStyle`       | CheckBox              | Desmarcado, Marcado (con subestados)                |
| `DropdownBoxStyle`    | DropdownBox           | Múltiples subestilos                                |
| `SliderStyle`         | Slider                | Predeterminado, Flotante, Presionado                |
| `ScrollbarStyle`      | Scrollbar, ScrollView | Predeterminado, Flotante, Arrastrado                |
| `InputFieldStyle`     | TextField             | Predeterminado, Enfocado, Deshabilitado             |
| `PatchStyle`          | Fondos NineSlice      | -                                                   |
| `TextTooltipStyle`    | Tooltip               | Predeterminado                                      |
| `ColorPickerStyle`    | ColorPicker           | -                                                   |
| `PopupMenuLayerStyle` | Menús                 | Múltiples subestilos                                |
| `TabNavigationStyle`  | Pestañas              | Estados de pestaña, estados seleccionados           |

### LabelStyle

```
@MyLabelStyle = LabelStyle(
  FontSize: 14,
  FontName: "Default",
  TextColor: #ffffff,
  OutlineColor: #000000(0.3),
  HorizontalAlignment: Center,
  VerticalAlignment: Center,
  RenderBold: true,
  RenderUppercase: false,
  LetterSpacing: 0,
  Wrap: true
);
```

### TextButtonStyle

```
@MyButtonStyle = TextButtonStyle(
  Default: (
    Background: #3a7bd5,
    LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true)
  ),
  Hovered: (
    Background: #2563eb,
    LabelStyle: (TextColor: #ffffff)
  ),
  Pressed: (
    Background: #1e40af,
    LabelStyle: (TextColor: #e0e7ff)
  ),
  Disabled: (
    Background: #6b7280,
    LabelStyle: (TextColor: #9ca3af)
  ),
  Sounds: @ButtonSounds
);
```

### PatchStyle (9-Patch/NineSlice)

```
@MyBackground = PatchStyle(
  TexturePath: "Common/Panel.png",
  Border: 16
);

// Con diferentes bordes horizontales/verticales
@MyButton = PatchStyle(
  TexturePath: "Common/Button.png",
  HorizontalBorder: 80,
  VerticalBorder: 12,
  Color: #ffffff(0.95)
);

// Con región de textura
@MyPatch = PatchStyle(
  TexturePath: "Common/Atlas.png",
  Border: 8,
  Area: (X: 0, Y: 0, Width: 64, Height: 64)
);
```

### CheckBoxStyle

```
@MyCheckBoxStyle = CheckBoxStyle(
  Unchecked: (
    DefaultBackground: (Color: #2b3542),
    HoveredBackground: (Color: #3a4556),
    PressedBackground: (Color: #1e2633),
    DisabledBackground: (Color: #1a1a1a),
    ChangedSound: (SoundPath: "Sounds/Click.ogg", Volume: 6)
  ),
  Checked: (
    DefaultBackground: (TexturePath: "Common/CheckMark.png"),
    HoveredBackground: (TexturePath: "Common/CheckMarkHover.png"),
    PressedBackground: (TexturePath: "Common/CheckMarkPressed.png"),
    ChangedSound: (SoundPath: "Sounds/Click.ogg", Volume: 6)
  )
);
```

### ScrollbarStyle

```
@MyScrollbarStyle = ScrollbarStyle(
  Spacing: 6,
  Size: 6,
  OnlyVisibleWhenHovered: true,
  Background: (TexturePath: "Common/ScrollbarBg.png", Border: 3),
  Handle: (TexturePath: "Common/ScrollbarHandle.png", Border: 3),
  HoveredHandle: (TexturePath: "Common/ScrollbarHandleHover.png", Border: 3),
  DraggedHandle: (TexturePath: "Common/ScrollbarHandleDrag.png", Border: 3)
);
```

### Herencia de Estilos (Propagación)

```
// Estilo base
@BaseButtonStyle = TextButtonStyle(
  Default: (Background: #3a7bd5, LabelStyle: @DefaultLabel),
  Hovered: (Background: #2563eb),
  Pressed: (Background: #1e40af),
  Disabled: (Background: #6b7280)
);

// Estilo extendido con anulaciones
@SecondaryButtonStyle = TextButtonStyle(
  ...@BaseButtonStyle,
  Default: (
    ...@BaseButtonStyle.Default,
    Background: #e94560
  )
);
```

---

## 8. Formatos de Color

### Color Hexadecimal Básico

```
Background: #3a7bd5;
TextColor: #ffffff;
BorderColor: #000000;
```

### Hexadecimal con Alfa

```
Background: #1a1a2e(0.95);    // 95% de opacidad
TextColor: #ffffff(0.6);       // 60% de opacidad
Overlay: #000000(0.5);         // 50% de opacidad (negro semi-transparente)
OutlineColor: #000000(0.3);    // 30% de opacidad
```

### Valores Alfa

- `0.0` = Completamente transparente
- `0.5` = 50% de opacidad
- `1.0` = Completamente opaco (predeterminado)

---

## 9. Tipos de Valor

| Tipo        | Sintaxis                     | Ejemplo                       |
| ----------- | ---------------------------- | ----------------------------- |
| String      | `"texto"`                    | `Text: "Hola"`                |
| Número      | `123` o `3.14`               | `Width: 100`, `Opacity: 0.95` |
| Porcentaje  | `50%`                        | `Width: 50%`                  |
| Booleano    | `true`/`false`               | `Visible: true`               |
| Color       | `#RRGGBB` o `#RRGGBB(alpha)` | `#3a7bd5(0.95)`               |
| Enum        | `ValorEnum`                  | `LayoutMode: Top`             |
| Objeto      | `(clave: valor, ...)`        | `Anchor: (Width: 100)`        |
| Referencia  | `@Nombre`                    | `Style: @MyStyle`             |
| Plantilla   | `$Alias.@Nombre`             | `$C.@TextButton`              |
| Propagación | `...@Nombre`                 | `...@BaseStyle`               |
| Localizado  | `%clave.ruta`                | `%server.customUI.title`      |

---

## 10. Plantillas y Herencia

### Uso de Plantillas

```
// Importar archivo
$C = "../Common.ui";

// Usar plantilla con anulaciones de parámetros
$C.@TextButton #MyButton {
  @Text = "Haz Clic";           // Parámetro de plantilla
  Anchor: (Width: 120);         // Propiedad de componente
}

$C.@Container #MyContainer {
  @ContentPadding = (Full: 20);
  @CloseButton = true;

  Label { Text: "Contenido"; }
}
```

### Parámetro de Plantilla vs Propiedad

```
$C.@TextButton {
  @Text = "Etiqueta";         // @ = Parámetro de plantilla (definido en la plantilla)
  Anchor: (Width: 100);    // Sin @ = Propiedad de componente
}
```

### Operador de Propagación

```
// Fusionar y anular estilos
@ExtendedStyle = LabelStyle(
  ...@BaseStyle,          // Incluir todas las propiedades de BaseStyle
  FontSize: 18,           // Anular FontSize
  TextColor: #ff0000      // Anular TextColor
);

// Propagación anidada
Style: (
  ...@DefaultStyle,
  Sounds: (
    ...$Sounds.@ButtonSounds,
    ...@CustomSounds
  )
);
```

---

## 11. Enlaces de Eventos

### Tipos de Eventos

| Evento                   | Descripción                   | Caso de Uso                  |
| ------------------------ | ----------------------------- | ---------------------------- |
| `Activating`             | Componente activado (clic)    | Clics de botón               |
| `RightClicking`          | Clic derecho del ratón        | Menús contextuales           |
| `DoubleClicking`         | Doble clic                    | Acciones rápidas             |
| `MouseEntered`           | Inicio de paso del ratón      | Efectos de hover             |
| `MouseExited`            | Fin de paso del ratón         | Limpieza de hover            |
| `ValueChanged`           | Valor de entrada cambiado     | Entradas de formulario       |
| `ElementReordered`       | Elemento reordenado           | Listas de arrastrar y soltar |
| `Validating`             | Evento de validación          | Validación de formulario     |
| `Dismissing`             | Descarte de componente        | Cerrar diálogos              |
| `FocusGained`            | Entrada enfocada              | Estilo de enfoque            |
| `FocusLost`              | Entrada desenfocada           | Manejo de desenfoque         |
| `KeyDown`                | Tecla presionada              | Atajos de teclado            |
| `MouseButtonReleased`    | Botón del ratón soltado       | Fin de arrastre              |
| `SlotClicking`           | Clic en ranura de inventario  | Gestión de inventario        |
| `SlotDoubleClicking`     | Doble clic en ranura          | Transferencia rápida         |
| `SlotMouseEntered`       | Inicio de hover en ranura     | Información de ranura        |
| `SlotMouseExited`        | Fin de hover en ranura        | Ocultar información          |
| `DragCancelled`          | Arrastre cancelado            | Limpieza de arrastre         |
| `Dropped`                | Ítem soltado                  | Manejo de soltar             |
| `SlotMouseDragCompleted` | Arrastre de ranura completado | Transferencias de ranura     |
| `SelectedTabChanged`     | Pestaña cambiada              | Navegación por pestañas      |

### Enlace de Eventos en Java

```java
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#MyButton",
    new EventData().append("Action", "buttonClicked")
);

evt.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#MySlider",
    new EventData()
        .append("Action", "sliderChanged")
        .append("Value", "@Value")  // Capturar valor actual
);
```

---

## 12. API Java

### Clase Base del Controlador de Página

```java
public class MyPageController extends InteractiveCustomUIPage<MyPageController.UIEventData> {

    public static final String LAYOUT = "MyPage.ui";

    public MyPageController(PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, UIEventData.CODEC);
    }

    @Override
    public void build(
            Ref<EntityStore> ref,
            UICommandBuilder cmd,
            UIEventBuilder evt,
            Store<EntityStore> store
    ) {
        cmd.append(LAYOUT);
        // Configurar la IU
    }

    @Override
    public void handleDataEvent(
            Ref<EntityStore> ref,
            Store<EntityStore> store,
            UIEventData data
    ) {
        // Manejar eventos
    }

    public static class UIEventData {
        public static final BuilderCodec<UIEventData> CODEC = /* ... */;
        private String action;
    }
}
```

### Métodos de UICommandBuilder

| Método                         | Descripción                | Ejemplo                                                 |
| ------------------------------ | -------------------------- | ------------------------------------------------------- |
| `append(path)`                 | Cargar IU desde archivo    | `cmd.append("MyPage.ui")`                               |
| `append(selector, path)`       | Añadir a elemento          | `cmd.append("#List", "Item.ui")`                        |
| `appendInline(selector, doc)`  | Añadir IU en línea         | `cmd.appendInline("#List", "Label { Text: \"...\"; }")` |
| `insertBefore(selector, path)` | Insertar antes de elemento | `cmd.insertBefore("#Item2", "Item.ui")`                 |
| `remove(selector)`             | Eliminar elemento          | `cmd.remove("#OldItem")`                                |
| `clear(selector)`              | Limpiar hijos              | `cmd.clear("#List")`                                    |
| `set(selector, value)`         | Establecer propiedad       | `cmd.set("#Title.Text", "Hola")`                        |
| `setNull(selector)`            | Establecer nulo            | `cmd.setNull("#Value")`                                 |

### Métodos de UIEventBuilder

| Método                                                  | Descripción                     |
| ------------------------------------------------------- | ------------------------------- |
| `addEventBinding(type, selector)`                       | Enlazar evento a elemento       |
| `addEventBinding(type, selector, data)`                 | Enlazar con captura de datos    |
| `addEventBinding(type, selector, data, locksInterface)` | Enlazar con bloqueo de interfaz |

### Selectores

```java
// Elemento por ID
cmd.set("#Title.Text", "Hola");

// Elemento indexado
cmd.set("#List[0].Text", "Primero");
cmd.set("#List[1].Text", "Segundo");

// Propiedad anidada
cmd.set("#Button.Style.Background", "#ff0000");
```

### Tiempos de Vida de Página

| Tiempo de Vida      | Descripción                         |
| ------------------- | ----------------------------------- |
| `CantClose`         | No puede ser cerrado por el usuario |
| `CanDismiss`        | Puede ser descartado (Escape)       |
| `CanClose`          | Puede ser cerrado (botón cerrar)    |
| `CanCloseOrDismiss` | Cerrar o descartar                  |

---

## 13. Librería Common.ui

El archivo `Common.ui` proporciona plantillas y estilos preconstruidos.

### Plantillas de Botón

```
$C.@TextButton #MyButton {
  @Text = "Primary Button";
  Anchor: (Width: 140, Height: 44);
}

$C.@SecondaryTextButton #Secondary {
  @Text = "Secondary";
}

$C.@CancelTextButton #Cancel {
  @Text = "Cancel";
}

$C.@TertiaryTextButton #Tertiary {
  @Text = "Link Style";
}
```

### Plantillas de Entrada

```
$C.@TextField #NameInput {
  @PlaceholderText = "Enter name...";
  Anchor: (Width: 200, Height: 32);
}

$C.@NumberField #AgeInput {
  @Min = 0;
  @Max = 100;
  @Value = 18;
}

$C.@CheckBoxWithLabel #AgreeCheckbox {
  @Text = "I agree to terms";
  @Checked = false;
}

$C.@DropdownBox #CategorySelect {
  // Entries set via Java
}
```

### Plantillas de Contenedor

```
$C.@Container #Panel {
  @ContentPadding = (Full: 16);
  @CloseButton = true;

  // Content here
}

$C.@DecoratedContainer #FancyPanel {
  @Title = "Panel Title";
  // Content here
}
```

### Plantillas de Utilidad

```
// Separators
$C.@ContentSeparator {}
$C.@VerticalSeparator {}

// Spinner/Loading
$C.@DefaultSpinner {}

// Back button
$C.@BackButton #BackBtn {}
```

---

## 14. Ejemplos Completos

### Diálogo Simple

```
$C = "../Common.ui";

@TitleStyle = LabelStyle(
  FontSize: 20,
  TextColor: #ffffff,
  RenderBold: true,
  HorizontalAlignment: Center
);

Group #DialogRoot {
  Anchor: (Width: 400, Height: 250);
  Background: #1a1a2e(0.98);
  LayoutMode: Top;
  Padding: (Full: 20);

  // Title
  Label #Title {
    Text: "Confirm Action";
    Anchor: (Height: 32);
    Style: @TitleStyle;
  }

  // Spacer
  Group { Anchor: (Height: 16); }

  // Message
  Label #Message {
    Text: "Are you sure you want to continue?";
    Anchor: (Height: 60);
    Style: (FontSize: 14, TextColor: #c0c0c0, Wrap: true, HorizontalAlignment: Center);
  }

  // Flex spacer
  Group { FlexWeight: 1; }

  // Buttons
  Group #Buttons {
    LayoutMode: Center;
    Anchor: (Height: 50);
    Gap: 16;

    $C.@CancelTextButton #CancelBtn {
      @Text = "Cancel";
      Anchor: (Width: 100, Height: 44);
    }

    $C.@TextButton #ConfirmBtn {
      @Text = "Confirm";
      Anchor: (Width: 100, Height: 44);
    }
  }
}
```

### Formulario con Entradas

```
$C = "../Common.ui";

Group #FormRoot {
  Anchor: (Width: 500, Height: 400);
  Background: #141c26(0.98);
  LayoutMode: Top;
  Padding: (Full: 24);

  // Header
  Label {
    Text: "User Registration";
    Anchor: (Height: 36);
    Style: (FontSize: 22, TextColor: #ffffff, RenderBold: true);
  }

  Group { Anchor: (Height: 20); }

  // Form fields
  Group #FormFields {
    LayoutMode: Top;
    Gap: 16;

    // Username
    Group {
      LayoutMode: Top;
      Gap: 4;

      Label { Text: "Username"; Style: (FontSize: 12, TextColor: #96a9be); }
      $C.@TextField #UsernameInput {
        @PlaceholderText = "Enter username";
        Anchor: (Width: 100%, Height: 36);
      }
    }

    // Email
    Group {
      LayoutMode: Top;
      Gap: 4;

      Label { Text: "Email"; Style: (FontSize: 12, TextColor: #96a9be); }
      $C.@TextField #EmailInput {
        @PlaceholderText = "Enter email";
        Anchor: (Width: 100%, Height: 36);
      }
    }

    // Age
    Group {
      LayoutMode: Top;
      Gap: 4;

      Label { Text: "Age"; Style: (FontSize: 12, TextColor: #96a9be); }
      $C.@NumberField #AgeInput {
        @Min = 13;
        @Max = 120;
        @Value = 18;
        Anchor: (Width: 120, Height: 36);
      }
    }

    // Terms
    $C.@CheckBoxWithLabel #TermsCheckbox {
      @Text = "I agree to the Terms of Service";
      @Checked = false;
    }
  }

  // Spacer
  Group { FlexWeight: 1; }

  // Submit
  Group {
    LayoutMode: Center;
    Anchor: (Height: 50);

    $C.@TextButton #SubmitBtn {
      @Text = "Register";
      Anchor: (Width: 160, Height: 44);
    }
  }
}
```

### Lista Dinámica

```
// ListPage.ui
$C = "../Common.ui";

Group #ListRoot {
  Anchor: (Width: 600, Height: 500);
  Background: #1a1a2e(0.98);
  LayoutMode: Top;
  Padding: (Full: 20);

  // Header
  Group {
    LayoutMode: Left;
    Anchor: (Height: 44);

    Label {
      Text: "World Selection";
      Style: (FontSize: 18, TextColor: #ffffff, RenderBold: true);
    }

    Group { FlexWeight: 1; }

    $C.@TextButton #RefreshBtn {
      @Text = "Refresh";
      Anchor: (Width: 100, Height: 36);
    }
  }

  Group { Anchor: (Height: 16); }

  // Scrollable list
  ScrollView {
    Anchor: (Full: 0);
    ScrollbarStyle: @DefaultScrollbarStyle;

    Group #WorldList {
      LayoutMode: Top;
      Gap: 8;
      // Items added dynamically via Java
    }
  }
}

// ListItem.ui (Template)
$C = "../Common.ui";

Group {
  Anchor: (Width: 100%, Height: 60);
  Background: #2b3542;
  LayoutMode: Left;
  Padding: (Horizontal: 16, Vertical: 12);

  Label #ItemName {
    Text: "World Name";
    FlexWeight: 1;
    Style: (FontSize: 14, TextColor: #ffffff);
  }

  $C.@SecondaryTextButton #SelectBtn {
    @Text = "Select";
    Anchor: (Width: 80, Height: 36);
  }
}
```

### Controlador Java para Lista Dinámica

```java
public class WorldListController extends InteractiveCustomUIPage<WorldListController.EventData> {

    public static final String LAYOUT = "ListPage.ui";
    public static final String ITEM_TEMPLATE = "ListItem.ui";

    @Override
    public void build(Ref<EntityStore> ref, UICommandBuilder cmd, UIEventBuilder evt, Store<EntityStore> store) {
        cmd.append(LAYOUT);

        // Add event bindings
        evt.addEventBinding(CustomUIEventBindingType.Activating, "#RefreshBtn",
            new EventData().append("Action", "refresh"));

        // Load initial list
        loadWorldList(cmd, evt);
    }

    private void loadWorldList(UICommandBuilder cmd, UIEventBuilder evt) {
        List<WorldInfo> worlds = getWorlds();

        cmd.clear("#WorldList");

        for (int i = 0; i < worlds.size(); i++) {
            WorldInfo world = worlds.get(i);

            cmd.append("#WorldList", ITEM_TEMPLATE);
            cmd.set("#WorldList[" + i + "] #ItemName.Text", world.getName());

            evt.addEventBinding(CustomUIEventBindingType.Activating,
                "#WorldList[" + i + "] #SelectBtn",
                new EventData()
                    .append("Action", "select")
                    .append("WorldId", world.getId())
            );
        }
    }

    @Override
    public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store, EventData data) {
        switch (data.action) {
            case "refresh":
                UICommandBuilder cmd = new UICommandBuilder();
                UIEventBuilder evt = new UIEventBuilder();
                loadWorldList(cmd, evt);
                sendUpdate(cmd, evt);
                break;
            case "select":
                selectWorld(data.worldId);
                break;
        }
    }
}
```

---

## Tarjeta de Referencia Rápida

### Hoja de Trucos de Sintaxis DSL

```
// IMPORTACIONES
$Alias = "ruta/al/archivo.ui";

// VARIABLES
@Nombre = valor;

// ESTILOS
@NombreEstilo = TipoEstilo(propiedad: valor, ...);

// COMPONENTES
TipoComponente #IdElemento {
  Propiedad: valor;
  PropAnidada: (SubProp: valor);

  ComponenteHijo { ... }
}

// USO DE PLANTILLA
$Alias.@NombrePlantilla #Id {
  @ParamPlantilla = valor;
  PropComponente: valor;
}

// HERENCIA
@Extendido = TipoEstilo(
  ...@EstiloBase,
  anular: valor
);

// COLORES
#RRGGBB
#RRGGBB(alfa)

// LOCALIZACIÓN
%servidor.customUI.clave.ruta
```

### Patrones Comunes

```
// Full-width element
Anchor: (Left: 0, Right: 0, Height: 50);

// Centered fixed-size
Anchor: (Width: 400, Height: 300);

// Fill parent
Anchor: (Full: 0);

// Flex item
FlexWeight: 1;

// Vertical list with gap
LayoutMode: Top;
Gap: 12;

// Horizontal centered buttons
LayoutMode: Center;
Gap: 16;

// Semi-transparent background
Background: #1a1a2e(0.95);
```

---

_Esta documentación fue compilada a partir de código de servidor Hytale descompilado, el plugin HytaleDocs IntelliJ y ejemplos de la comunidad._
