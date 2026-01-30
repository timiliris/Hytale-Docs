---
id: custom-ui
title: Sistema de IU Personalizada
sidebar_label: IU Personalizada
sidebar_position: 7
description: Guía paso a paso para crear páginas de IU personalizadas con el DSL de Hytale
---

# Sistema de IU Personalizada

Esta guía te enseña cómo crear páginas de IU personalizadas para los plugins de Hytale. Aprenderás la sintaxis de los archivos de IU, los componentes disponibles y cómo crear páginas interactivas.

## Cómo Funciona la IU Personalizada

Hytale utiliza una **arquitectura cliente-servidor** para la IU personalizada:

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTE                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  resources/Common/UI/Custom/TuPlugin/                      │   │
│  │  └── TuPagina.ui  (cargado cuando el jugador se conecta)     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ▲                    │
                              │ Comandos           │ Eventos
                              │ (establecer valores)     │ (clics de botón)
                              │                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVIDOR                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  InteractiveCustomUIPage                                      │   │
│  │  - build(): cargar diseño, establecer valores, vincular eventos │   │
│  │  - handleDataEvent(): responder a interacciones del usuario  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Puntos clave:**
- Los archivos `.ui` se **descargan al cliente** cuando el jugador se conecta.
- El servidor **no puede crear archivos de IU dinámicamente**; deben existir de antemano.
- Cualquier error de sintaxis en un archivo `.ui` **provocará la desconexión del jugador**.
- El servidor envía **comandos** para manipular los elementos de la IU.
- El cliente envía **eventos** de vuelta cuando el jugador interactúa.

---

## Tutorial: Creando Tu Primera IU Personalizada

### Paso 1: Estructura del Proyecto

Tu plugin necesita estos archivos:

```
tu-plugin/
├── build.gradle
├── src/main/
│   ├── java/com/tunombre/plugin/
│   │   ├── TuPlugin.java
│   │   ├── commands/
│   │   │   └── OpenUICommand.java
│   │   └── ui/
│   │       └── MiPagina.java
│   └── resources/
│       ├── manifest.json
│       └── Common/
│           └── UI/
│               └── Custom/
│                   └── TuPlugin/
│                       └── MiPagina.ui
```

### Paso 2: Configurar manifest.json

Tu manifiesto debe incluir `IncludesAssetPack: true`:

```json
{
  "Identifier": "tu-plugin",
  "Name": "Tu Plugin",
  "Version": "1.0.0",
  "EntryPoint": "com.tunombre.plugin.TuPlugin",
  "IncludesAssetPack": true
}
```

> **⚠️ Requisito Crítico:** La línea `"IncludesAssetPack": true` es obligatoria para que las texturas personalizadas funcionen. Sin ella, los clientes verán una "X Roja" por cada imagen personalizada que intentes cargar.


### Paso 3: Crear el Archivo de IU

Crea `src/main/resources/Common/UI/Custom/TuPlugin/MiPagina.ui`:

```
$C = "../Common.ui";

Group {
  Anchor: (Width: 400, Height: 300);
  Background: #141c26(0.95);
  LayoutMode: Top;
  Padding: (Full: 20);

  Label {
    Text: "¡Hola Mundo!";
    Anchor: (Height: 40);
    Style: (FontSize: 24, TextColor: #ffffff, HorizontalAlignment: Center, RenderBold: true);
  }

  Group { Anchor: (Height: 20); }

  $C.@TextButton #MyButton {
    @Text = "Haz Clic";
    Anchor: (Width: 150, Height: 44);
  }
}
```

### Paso 4: Crear el Manejador de Página en Java

Crea `src/main/java/com/tunombre/plugin/ui/MiPagina.java`:

```java
package com.tunombre.plugin.ui;

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

public class MiPagina extends InteractiveCustomUIPage<MiPagina.EventData> {

    // Ruta relativa a Common/UI/Custom/
    public static final String LAYOUT = "TuPlugin/MiPagina.ui";

    private final PlayerRef playerRef;

    public MiPagina(@Nonnull PlayerRef playerRef) {
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
        // Cargar el diseño
        cmd.append(LAYOUT);

        // Vincular el evento de clic del botón
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
                Message.raw("¡Botón Clicado!"),
                Message.raw("Has hecho clic en el botón."),
                NotificationStyle.Success
            );
        }
    }

    // Clase de datos de evento con códec
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

### Paso 5: Crear el Comando

Crea `src/main/java/com/tunombre/plugin/commands/OpenUICommand.java`:

```java
package com.tunombre.plugin.commands;

import com.tunombre.plugin.ui.MiPagina;

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
        super("miui", "Abre la IU personalizada");
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
            context.sendMessage(Message.raw("Error: No se pudo obtener el jugador"));
            return;
        }

        MiPagina page = new MiPagina(playerRef);
        player.getPageManager().openCustomPage(ref, store, page);
    }
}
```

### Paso 6: Registrar en el Plugin

```java
package com.tunombre.plugin;

import com.tunombre.plugin.commands.OpenUICommand;
import com.hytaledocs.server.plugin.JavaPlugin;

public class TuPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        getCommandRegistry().register(new OpenUICommand());
        getLogger().info("¡Plugin activado!");
    }
}
```

### Paso 7: Construir y Probar

```bash
./gradlew build
```

Copia el JAR a la carpeta `plugins/` de tu servidor, reinicia y ejecuta `/miui`.

---

## Referencia de Sintaxis de Archivos UI

Hytale utiliza un **DSL personalizado** (Lenguaje Específico de Dominio) para los archivos de IU. **NO** es XAML, XML ni ningún formato estándar.

### Estructura Básica

```
// Los comentarios comienzan con //

// Importar Common.ui para componentes reutilizables
$C = "../Common.ui";

// Definir estilos personalizados (opcional)
@MiEstilo = LabelStyle(FontSize: 16, TextColor: #ffffff);

// Elemento raíz
Group {
  // Propiedades
  Anchor: (Width: 400, Height: 300);
  Background: #1a1a2e;

  // Elementos hijos
  Label {
    Text: "Hola";
    Style: @MiEstilo;
  }
}
```

### Reglas de Sintaxis Críticas

| Regla | Correcto | Incorrecto |
|------|---------|-------|
| Los valores de texto deben estar entre comillas | `Text: "Hola";` | `Text: Hola;` |
| Las propiedades terminan con punto y coma | `Anchor: (Width: 100);` | `Anchor: (Width: 100)` |
| Los colores usan formato hexadecimal | `#ffffff` o `#fff` | `white` o `rgb(255,255,255)` |
| Alfa en los colores | `#141c26(0.95)` | `#141c26cc` |
| Los IDs de elemento comienzan con # | `Label #Titulo { }` | `Label Titulo { }` |

### Propiedades de Diseño

| Propiedad | Descripción | Ejemplo |
|----------|-------------|---------|
| `Anchor` | Tamaño y posición | `Anchor: (Width: 200, Height: 50);` |
| `Background` | Color de fondo | `Background: #1a1a2e;` |
| `LayoutMode` | Disposición de los hijos | `LayoutMode: Top;` o `Center;` o `Left;` |
| `Padding` | Espaciado interno | `Padding: (Full: 20);` o `(Left: 10, Right: 10);` |
| `FlexWeight` | Dimensionamiento flexible | `FlexWeight: 1;` |

### Valores de LayoutMode

| Modo | Descripción |
|------|-------------|
| `Top` | Apila los hijos verticalmente desde arriba |
| `Left` | Apila los hijos horizontalmente desde la izquierda |
| `Center` | Centra los hijos |

### Elementos Básicos

#### Label (Visualización de Texto)

```
Label {
  Text: "Mi Texto";
  Anchor: (Height: 30);
  Style: (FontSize: 16, TextColor: #ffffff, HorizontalAlignment: Center);
}
```

#### Label con ID

```
Label #Titulo {
  Text: "Título por Defecto";
  Anchor: (Height: 40);
  Style: (FontSize: 24, TextColor: #ffffff, RenderBold: true);
}
```

#### Group (Contenedor)

```
Group {
  Anchor: (Height: 100);
  LayoutMode: Left;
  Background: #2a2a3e;

  // Los hijos van aquí
}
```

#### Spacer (Espaciador)

```
// Espaciador vertical
Group { Anchor: (Height: 20); }

// Espaciador horizontal (en LayoutMode: Left)
Group { Anchor: (Width: 20); }

// Línea separadora
Group { Anchor: (Height: 1); Background: #333333; }
```

#### TextButton (Estilo Personalizado)

```
@MiEstiloBoton = TextButtonStyle(
  Default: (Background: #3a7bd5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Hovered: (Background: #4a8be5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Pressed: (Background: #2a6bc5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center))
);

TextButton #MiBoton {
  Text: "Haz Clic";
  Anchor: (Width: 120, Height: 44);
  Style: @MiEstiloBoton;
}
```

---

## Componentes de Common.ui

El juego proporciona componentes reutilizables en `Common.ui`. Impórtalos con:

```
$C = "../Common.ui";
```

Luego úsalos con la sintaxis `$C.@NombreComponente`.

### Componentes Disponibles

| Componente | Descripción | Parámetros |
|-----------|-------------|------------|
| `$C.@TextButton` | Botón primario (azul) | `@Text` |
| `$C.@SecondaryTextButton` | Botón secundario (gris) | `@Text` |
| `$C.@CancelTextButton` | Botón de cancelar/peligro (rojo) | `@Text` |
| `$C.@TextField` | Campo de entrada de texto | `PlaceholderText`, `FlexWeight` |
| `$C.@NumberField` | Campo de entrada numérico | `Value`, `Anchor` |
| `$C.@CheckBox` | Casilla de verificación sola | - |
| `$C.@CheckBoxWithLabel` | Casilla de verificación con texto | `@Text`, `@Checked` |
| `$C.@DropdownBox` | Selector desplegable | `Anchor` |
| `$C.@ContentSeparator` | Separador horizontal | `Anchor` |
| `$C.@Container` | Contenedor con estilo | `Anchor` |
| `$C.@DecoratedContainer` | Contenedor con borde | `Anchor` |
| `$C.@DefaultSpinner` | Spinner de carga | `Anchor` |

### Ejemplos de Componentes

#### Botones

```
$C = "../Common.ui";

Group {
  LayoutMode: Left;
  Anchor: (Height: 50);

  $C.@TextButton #BtnGuardar {
    @Text = "Guardar";
    Anchor: (Width: 100, Height: 40);
  }

  Group { Anchor: (Width: 10); }

  $C.@SecondaryTextButton #BtnCancelar {
    @Text = "Cancelar";
    Anchor: (Width: 100, Height: 40);
  }

  Group { Anchor: (Width: 10); }

  $C.@CancelTextButton #BtnEliminar {
    @Text = "Eliminar";
    Anchor: (Width: 100, Height: 40);
  }
}
```

#### Entrada de Texto

```
Group {
  LayoutMode: Left;
  Anchor: (Height: 44);

  Label {
    Text: "Usuario";
    Anchor: (Width: 100);
    Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
  }

  $C.@TextField #InputUsuario {
    FlexWeight: 1;
    PlaceholderText: "Introduce tu usuario...";
  }
}
```

#### Entrada Numérica

```
Group {
  LayoutMode: Left;
  Anchor: (Height: 44);

  Label {
    Text: "Cantidad";
    Anchor: (Width: 100);
    Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
  }

  $C.@NumberField #InputCantidad {
    Anchor: (Width: 80);
    Value: 100;
  }
}
```

#### Casillas de Verificación

```
$C.@CheckBoxWithLabel #OpcionActivar {
  @Text = "Activar esta función";
  @Checked = true;
  Anchor: (Height: 28);
}

Group { Anchor: (Height: 8); }

$C.@CheckBoxWithLabel #OpcionDesactivada {
  @Text = "Esto está desactivado por defecto";
  @Checked = false;
  Anchor: (Height: 28);
}
```

#### Desplegable

```
Group {
  LayoutMode: Left;
  Anchor: (Height: 44);

  Label {
    Text: "Selecciona:";
    Anchor: (Width: 80);
    Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
  }

  $C.@DropdownBox #MiDesplegable {
    Anchor: (Width: 200, Height: 36);
  }
}
```

---

## Ejemplo Completo: Página de Ajustes

Aquí tienes una página de ajustes completa usando múltiples componentes:

### SettingsPage.ui

```
$C = "../Common.ui";

@BotonPrimario = TextButtonStyle(
  Default: (Background: #3a7bd5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Hovered: (Background: #4a8be5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Pressed: (Background: #2a6bc5, LabelStyle: (FontSize: 14, TextColor: #ffffff, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center))
);

@BotonSecundario = TextButtonStyle(
  Default: (Background: #2b3542, LabelStyle: (FontSize: 14, TextColor: #96a9be, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Hovered: (Background: #3b4552, LabelStyle: (FontSize: 14, TextColor: #b6c9de, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center)),
  Pressed: (Background: #1b2532, LabelStyle: (FontSize: 14, TextColor: #96a9be, RenderBold: true, HorizontalAlignment: Center, VerticalAlignment: Center))
);

Group {
  Anchor: (Width: 450, Height: 400);
  Background: #141c26(0.98);
  LayoutMode: Top;
  Padding: (Full: 20);

  // Título
  Label {
    Text: "Ajustes";
    Anchor: (Height: 40);
    Style: (FontSize: 24, TextColor: #ffffff, HorizontalAlignment: Center, RenderBold: true);
  }

  // Separador
  Group { Anchor: (Height: 1); Background: #2b3542; }
  Group { Anchor: (Height: 16); }

  // Campo de usuario
  Group {
    LayoutMode: Left;
    Anchor: (Height: 44);

    Label {
      Text: "Usuario";
      Anchor: (Width: 120);
      Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
    }

    $C.@TextField #InputUsuario {
      FlexWeight: 1;
      PlaceholderText: "Introduce tu usuario...";
    }
  }

  Group { Anchor: (Height: 12); }

  // Campo numérico tipo slider de volumen
  Group {
    LayoutMode: Left;
    Anchor: (Height: 44);

    Label {
      Text: "Volumen";
      Anchor: (Width: 120);
      Style: (FontSize: 14, TextColor: #96a9be, VerticalAlignment: Center);
    }

    $C.@NumberField #InputVolumen {
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

  // Casillas de verificación
  $C.@CheckBoxWithLabel #OpcionNotificaciones {
    @Text = "Activar notificaciones";
    @Checked = true;
    Anchor: (Height: 28);
  }

  Group { Anchor: (Height: 8); }

  $C.@CheckBoxWithLabel #OpcionSonido {
    @Text = "Activar sonidos";
    @Checked = true;
    Anchor: (Height: 28);
  }

  Group { Anchor: (Height: 8); }

  $C.@CheckBoxWithLabel #OpcionAutoguardado {
    @Text = "Autoguardado";
    @Checked = false;
    Anchor: (Height: 28);
  }

  // Espaciador para empujar los botones hacia abajo
  Group { FlexWeight: 1; }

  // Botones
  Group {
    LayoutMode: Center;
    Anchor: (Height: 50);

    TextButton #BotonGuardar {
      Text: "Guardar";
      Anchor: (Width: 100, Height: 44);
      Style: @BotonPrimario;
    }

    Group { Anchor: (Width: 16); }

    TextButton #BotonCerrar {
      Text: "Cerrar";
      Anchor: (Width: 100, Height: 44);
      Style: @BotonSecundario;
    }
  }

  // Pie de página
  Group { Anchor: (Height: 8); }
  Label {
    Text: "Presiona ESC para cerrar";
    Anchor: (Height: 16);
    Style: (FontSize: 11, TextColor: #555555, HorizontalAlignment: Center);
  }
}
```

### SettingsPage.java

```java
package com.tuplugin.ui;

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

    public static final String LAYOUT = "TuPlugin/SettingsPage.ui";

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

        // Vincular botón Guardar
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#BotonGuardar",
            new EventData().append("Action", "save"),
            false
        );

        // Vincular botón Cerrar
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#BotonCerrar",
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
                Message.raw("Ajustes Guardados"),
                Message.raw("Tus ajustes han sido guardados."),
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

## Referencia de la API del Lado del Servidor

### InteractiveCustomUIPage

Clase base para páginas de IU interactivas.

```java
public class MiPagina extends InteractiveCustomUIPage<MiEventData> {

    public MiPagina(PlayerRef playerRef) {
        super(
            playerRef,                    // Referencia del jugador
            CustomPageLifetime.CanDismiss, // Cómo se puede cerrar la página
            MiEventData.CODEC              // Códec de datos de evento
        );
    }

    @Override
    public void build(
        Ref<EntityStore> ref,
        UICommandBuilder cmd,
        UIEventBuilder evt,
        Store<EntityStore> store
    ) {
        // Se llama cuando se abre la página
    }

    @Override
    public void handleDataEvent(
        Ref<EntityStore> ref,
        Store<EntityStore> store,
        MiEventData data
    ) {
        // Se llama cuando el jugador interactúa
    }
}
```

### CustomPageLifetime

| Valor | Descripción |
|-------|-------------|
| `CantClose` | No puede ser cerrada por el usuario |
| `CanDismiss` | Se puede presionar ESC para cerrar |
| `CanDismissOrCloseThroughInteraction` | ESC o clic de botón |

### UICommandBuilder

```java
// Cargar diseño
cmd.append("TuPlugin/MiPagina.ui");

// Establecer texto
cmd.set("#Titulo.Text", "Hola Mundo");

// Establecer visibilidad
cmd.set("#Panel.Visible", false);

// Establecer valor numérico
cmd.set("#Slider.Value", 0.5f);

// Limpiar contenedor
cmd.clear("#ListaItems");

// Añadir a contenedor
cmd.append("#ListaItems", "TuPlugin/ListItem.ui");
```

### UIEventBuilder

```java
// Evento de botón simple
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#MiBoton",
    new EventData().append("Action", "click"),
    false  // locksInterface
);

// Capturar valor de entrada
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#BotonEnviar",
    new EventData()
        .append("Action", "submit")
        .append("@Username", "#InputUsuario.Value"),  // el prefijo @ captura el valor
    false
);
```

### CustomUIEventBindingType

| Tipo | Cuándo se Dispara |
|------|----------------|
| `Activating` | Clic o Enter |
| `ValueChanged` | El valor de entrada/slider cambia |
| `RightClicking` | Clic derecho |
| `DoubleClicking` | Doble clic |
| `MouseEntered` | El ratón entra en el elemento |
| `MouseExited` | El ratón sale del elemento |
| `FocusGained` | El elemento gana el foco |
| `FocusLost` | El elemento pierde el foco |

### Actualizando la IU

```java
@Override
public void handleDataEvent(...) {
    UICommandBuilder cmd = new UICommandBuilder();
    cmd.set("#TextoEstado.Text", "¡Actualizado!");
    this.sendUpdate(cmd, false);
}
```

### Cerrando la Página

```java
this.close();
```

### NotificationUtil

Para mensajes simples sin una página completa:

```java
NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("Título"),
    Message.raw("Mensaje"),
    NotificationStyle.Success  // o Warning, Error, Default
);
```

---

## Códec de Datos de Evento

Para recibir datos de eventos de la IU, crea una clase con `BuilderCodec`:

```java
public static class MiEventData {
    public static final BuilderCodec<MiEventData> CODEC = BuilderCodec.builder(
            MiEventData.class, MiEventData::new
    )
    // Campo de tipo String
    .append(new KeyedCodec<>("Action", Codec.STRING),
        (e, v) -> e.action = v,
        e -> e.action)
    .add()
    // Otro campo
    .append(new KeyedCodec<>("ItemId", Codec.STRING),
        (e, v) -> e.itemId = v,
        e -> e.itemId)
    .add()
    .build();

    private String action;
    private String itemId;

    public MiEventData() {}  // Constructor sin argumentos requerido
}
```

Los nombres de los campos en el códec **deben coincidir** con las claves en `EventData.append()`.

---

## Solución de Problemas

### "Failed to load CustomUI documents"

**Causa**: Error de sintaxis en tu archivo `.ui`.

**Soluciones**:
1. Asegúrate de que todos los valores de texto estén entre comillas: `Text: "Hola";` y no `Text: Hola;`
2. Comprueba que todas las propiedades terminen con punto y coma.
3. Verifica el formato de color: `#ffffff` o `#fff`.
4. Asegúrate de que la importación de Common.ui sea correcta: `$C = "../Common.ui";`

### "Failed to apply CustomUI event bindings"

**Causa**: El ID del elemento en Java no coincide con el del archivo `.ui`.

**Soluciones**:
1. Verifica que el ID del elemento exista en tu archivo `.ui`.
2. Comprueba la ortografía: `#MiBoton` en Java debe coincidir con `#MiBoton` en `.ui`.
3. Para componentes de Common.ui, el ID va después del componente: `$C.@TextButton #MiBoton`

### "Selected element in CustomUI command was not found"

**Causa**: Patrón de selector incorrecto para plantillas añadidas dinámicamente.

**Explicación**: Cuando añades una plantilla a un contenedor, la propia plantilla **se convierte** en el elemento en ese índice. No navegas a un hijo dentro de ella.

**Incorrecto:**
```java
// Esto busca #Button DENTRO del elemento en el índice 0
cmd.set("#Container[0] #Button.Text", "Hola");  // ¡INCORRECTO!
```

**Correcto:**
```java
// El elemento en el índice 0 ES el botón
cmd.set("#Container[0].Text", "Hola");  // ¡CORRECTO!
```

**Patrón completo:**
```java
// Añadir plantilla
cmd.append("#WorldButtonsContainer", "TuPlugin/WorldButton.ui");

// La plantilla añadida ES #WorldButtonsContainer[0]
String selector = "#WorldButtonsContainer[0]";
cmd.set(selector + ".Text", "Nombre del Mundo");

// El enlace del evento apunta directamente al elemento
evt.addEventBinding(
    CustomUIEventBindingType.Activating,
    selector,  // NO selector + " #Button"
    new EventData().append("Action", "click"),
    false
);
```

### Parámetros de Plantilla vs Propiedades

**Parámetros de plantilla** (`@Text`) se establecen al instanciar un componente y definen valores iniciales.

**Propiedades** (`.Text`) son las propiedades reales en tiempo de ejecución que modificas desde Java.

| Contexto | Sintaxis | Ejemplo |
|---------|--------|---------|
| En archivo `.ui` | `@Parametro` | `@Text = "Por Defecto";` |
| En Java (establecer valor) | `.Propiedad` | `cmd.set("#Boton.Text", "Nuevo");` |

**Importante**: No puedes usar `@Text` en los selectores de Java. Usa siempre `.Text`:
```java
// INCORRECTO
cmd.set("#Boton.@Text", "Hola");

// CORRECTO
cmd.set("#Boton.Text", "Hola");
```

### El jugador se desconecta al abrir la página

**Causa**: El archivo `.ui` tiene un error de análisis o no existe.

**Soluciones**:
1. Comprueba que la ruta del archivo coincida: `"TuPlugin/MiPagina.ui"` corresponde a `Common/UI/Custom/TuPlugin/MiPagina.ui`.
2. Revisa cuidadosamente la sintaxis del archivo de IU.
3. Empieza con un ejemplo mínimo que funcione y añade complejidad gradualmente.

### La IU se abre pero los botones no funcionan

**Causa**: Los enlaces de eventos no están configurados correctamente.

**Soluciones**:
1. Asegúrate de que `evt.addEventBinding()` se llame en `build()`.
2. Verifica que el selector coincida con el ID del elemento: `"#MiBoton"`.
3. Comprueba que `handleDataEvent()` maneje el valor de la acción.

---

## Patrones de IU Dinámica

Esta sección cubre cómo crear listas dinámicas, actualizar la IU en tiempo de ejecución y trabajar con plantillas.

### Creando una Lista Dinámica

**Archivo de plantilla** (`TuPlugin/ListItem.ui`):
```
$C = "../Common.ui";

$C.@SecondaryTextButton {
  @Text = "Objeto";
  Anchor: (Height: 40);
}
```

**Archivo de diseño** (`TuPlugin/MiPagina.ui`):
```
$C = "../Common.ui";

Group {
  Anchor: (Width: 400, Height: 300);
  Background: #141c26(0.98);
  LayoutMode: Top;
  Padding: (Full: 20);

  Label {
    Text: "Selecciona un objeto:";
    Anchor: (Height: 30);
    Style: (FontSize: 16, TextColor: #ffffff);
  }

  Group #ListaItems {
    FlexWeight: 1;
    LayoutMode: Top;
    Background: #0d1218(0.5);
    Padding: (Full: 8);
  }
}
```

**Código Java**:
```java
@Override
public void build(...) {
    cmd.append(LAYOUT);

    String[] items = {"Manzana", "Plátano", "Cereza"};

    for (int i = 0; i < items.length; i++) {
        // Añadir plantilla - esto crea el elemento en el índice i
        cmd.append("#ListaItems", "TuPlugin/ListItem.ui");

        // La plantilla ES el elemento en el índice i
        String selector = "#ListaItems[" + i + "]";

        // Establecer texto directamente en el elemento
        cmd.set(selector + ".Text", items[i]);

        // Vincular evento directamente al elemento
        evt.addEventBinding(
            CustomUIEventBindingType.Activating,
            selector,
            new EventData().append("Action", "select").append("Index", String.valueOf(i)),
            false
        );
    }
}
```

### Reglas Clave para Plantillas Dinámicas

1. **Plantilla añadida = elemento en el índice**
   ```java
   cmd.append("#Container", "template.ui");
   // Crea #Container[0], luego #Container[1], etc.
   ```

2. **Accede a las propiedades directamente**
   ```java
   cmd.set("#Container[0].Text", "valor");    // CORRECTO
   cmd.set("#Container[0] #ID.Text", "valor"); // INCORRECTO (a menos que la plantilla tenga IDs anidados)
   ```

3. **Los enlaces de eventos apuntan al elemento**
   ```java
   evt.addEventBinding(..., "#Container[0]", ...);  // CORRECTO
   ```

4. **Limpia antes de reconstruir**
   ```java
   cmd.clear("#Container");  // Elimina todos los hijos
   // Luego vuelve a añadir
   ```

### Actualizando la IU sin Reconstruir

Puedes enviar actualizaciones incrementales:

```java
@Override
public void handleDataEvent(...) {
    UICommandBuilder cmd = new UICommandBuilder();

    // Actualizar elementos específicos
    cmd.set("#StatusLabel.Text", "¡Actualizado!");
    cmd.set("#Counter.Text", String.valueOf(counter++));


    // Enviar SOLO la actualización (parche incremental)
    this.update(false, cmd);
}
```

> **Consejo de Rendimiento:** Evita llamar a `builder.append()` repetidamente en bucles de actualización. Esto fuerza un análisis completo del documento y puede hacer que el cliente se desconecte con "Failed to load CustomUI documents". Usa siempre `this.update(false, cmd)` para valores dinámicos.


### Limpiando y Refrescando

```java
// Limpiar un contenedor
cmd.clear("#ListaItems");

// O reconstruir la página entera
this.rebuild();
```

---

## Referencia Completa de Common.ui

Esta sección documenta **todos** los componentes y estilos disponibles en el archivo `Common.ui` del juego.

### Constantes de Estilo

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

### Componentes de Botón

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@TextButton` | `@Text`, `@Anchor`, `@Sounds` | Botón primario (azul) con texto |
| `@SecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Botón secundario (gris) con texto |
| `@TertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Botón terciario con texto |
| `@CancelTextButton` | `@Text`, `@Anchor`, `@Sounds` | Botón destructivo/cancelar (rojo) |
| `@SmallSecondaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Botón secundario pequeño |
| `@SmallTertiaryTextButton` | `@Text`, `@Anchor`, `@Sounds` | Botón terciario pequeño |
| `@Button` | `@Anchor`, `@Sounds` | Botón cuadrado sin texto |
| `@SecondaryButton` | `@Anchor`, `@Sounds`, `@Width` | Botón secundario cuadrado |
| `@TertiaryButton` | `@Anchor`, `@Sounds`, `@Width` | Botón terciario cuadrado |
| `@CancelButton` | `@Anchor`, `@Sounds`, `@Width` | Botón de cancelar cuadrado |
| `@CloseButton` | - | Botón de cerrar pre-posicionado (32x32) |

**Uso:**
```
$C.@TextButton #MiBoton {
  @Text = "Haz Clic";
  Anchor: (Width: 150, Height: 44);
}

$C.@SecondaryTextButton #BtnCancelar {
  @Text = "Cancelar";
  Anchor: (Width: 100, Height: 44);
}
```

### Componentes de Entrada

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@TextField` | `@Anchor` | Campo de entrada de texto (altura: 38) |
| `@NumberField` | `@Anchor` | Campo de entrada solo numérico (altura: 38) |
| `@DropdownBox` | `@Anchor` | Selector desplegable (defecto 330x32) |
| `@CheckBox` | - | Solo casilla de verificación (22x22) |
| `@CheckBoxWithLabel` | `@Text`, `@Checked` | Casilla de verificación con texto de etiqueta |

**Propiedades de TextField:**
- `PlaceholderText` - Texto de marcador de posición
- `FlexWeight` - Ancho flexible
- `Value` - Valor de texto actual

**Propiedades de NumberField:**
- `Value` - Valor numérico
- `PlaceholderText` - Texto de marcador de posición

**Propiedades de CheckBoxWithLabel:**
- `@Text` - Texto de la etiqueta
- `@Checked` - Estado inicial (true/false)

**Uso:**
```
$C.@TextField #InputNombre {
  FlexWeight: 1;
  PlaceholderText: "Introduce un nombre...";
}

$C.@NumberField #InputCantidad {
  Anchor: (Width: 100);
  Value: 50;
}

$C.@CheckBoxWithLabel #OpcionActivar {
  @Text = "Activar función";
  @Checked = true;
  Anchor: (Height: 28);
}

$C.@DropdownBox #MiDesplegable {
  Anchor: (Width: 200, Height: 32);
}
```

### Componentes Contenedores

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@Container` | `@ContentPadding`, `@CloseButton` | Contenedor con estilo con área de título |
| `@DecoratedContainer` | `@ContentPadding`, `@CloseButton` | Contenedor con bordes decorativos |
| `@Panel` | - | Panel simple con borde |
| `@PageOverlay` | - | Superposición de fondo semitransparente |

**Estructura de Container:**
- `#Title` - Área de título (altura: 38)
- `#Content` - Área de contenido con padding
- `#CloseButton` - Botón de cerrar opcional

**Uso:**
```
$C.@Container {
  @CloseButton = true;
  Anchor: (Width: 400, Height: 300);

  // El título va en #Title
  // El contenido va en #Content
}
```

### Componentes de Diseño

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@ContentSeparator` | `@Anchor` | Línea separadora horizontal (altura: 1) |
| `@VerticalSeparator` | - | Separador vertical (ancho: 6) |
| `@HeaderSeparator` | - | Separador de sección de cabecera (5x34) |
| `@PanelSeparatorFancy` | `@Anchor` | Separador de panel decorativo |
| `@ActionButtonContainer` | - | Contenedor para botones de acción |
| `@ActionButtonSeparator` | - | Espacio entre botones de acción (ancho: 35) |

**Uso:**
```
$C.@ContentSeparator { Anchor: (Height: 1); }

Group { Anchor: (Height: 16); }  // Espaciador vertical

$C.@VerticalSeparator {}
```

### Componentes de Texto

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@Title` | `@Text`, `@Alignment` | Etiqueta de título con estilo |
| `@Subtitle` | `@Text` | Etiqueta de subtítulo con estilo |
| `@TitleLabel` | - | Título grande centrado (FontSize: 40) |
| `@PanelTitle` | `@Text`, `@Alignment` | Título de sección de panel |

**Uso:**
```
$C.@Title {
  @Text = "Mi Título";
  @Alignment = Center;
  Anchor: (Height: 38);
}

$C.@Subtitle {
  @Text = "Texto del subtítulo";
}
```

### Componentes de Utilidad

| Componente | Parámetros | Descripción |
|-----------|------------|-------------|
| `@DefaultSpinner` | `@Anchor` | Animación de spinner de carga (32x32) |
| `@HeaderSearch` | `@MarginRight` | Entrada de búsqueda con icono |
| `@BackButton` | - | Botón de retroceso pre-posicionado |

**Uso:**
```
$C.@DefaultSpinner {
  Anchor: (Width: 32, Height: 32);
}
```

### Estilos Disponibles

#### Estilos de Botón

| Estilo | Descripción |
|-------|-------------|
| `@DefaultTextButtonStyle` | Estilo de botón primario |
| `@SecondaryTextButtonStyle` | Estilo de botón secundario |
| `@TertiaryTextButtonStyle` | Estilo de botón terciario |
| `@CancelTextButtonStyle` | Estilo de botón destructivo/cancelar |
| `@SmallDefaultTextButtonStyle` | Estilo de botón primario pequeño |
| `@SmallSecondaryTextButtonStyle` | Estilo de botón secundario pequeño |
| `@DefaultButtonStyle` | Botón sin texto |
| `@SecondaryButtonStyle` | Botón secundario sin texto |
| `@TertiaryButtonStyle` | Botón terciario sin texto |
| `@CancelButtonStyle` | Botón de cancelar sin texto |

#### Estilos de Etiqueta

| Estilo | Propiedades |
|-------|------------|
| `@DefaultLabelStyle` | FontSize: 16, TextColor: #96a9be |
| `@DefaultButtonLabelStyle` | FontSize: 17, TextColor: #bfcdd5, Bold, Uppercase, Center |
| `@TitleStyle` | FontSize: 15, Bold, Uppercase, TextColor: #b4c8c9, Fuente secundaria |
| `@SubtitleStyle` | FontSize: 15, Uppercase, TextColor: #96a9be |
| `@PopupTitleStyle` | FontSize: 38, Bold, Uppercase, Center, LetterSpacing: 2 |

#### Estilos de Entrada

| Estilo | Descripción |
|-------|-------------|
| `@DefaultInputFieldStyle` | Estilo de entrada de texto por defecto |
| `@DefaultInputFieldPlaceholderStyle` | Estilo de texto de marcador de posición (TextColor: #6e7da1) |
| `@InputBoxBackground` | Fondo del campo de entrada |
| `@InputBoxHoveredBackground` | Estado de hover del campo de entrada |
| `@InputBoxSelectedBackground` | Estado seleccionado del campo de entrada |

#### Otros Estilos

| Estilo | Descripción |
|-------|-------------|
| `@DefaultScrollbarStyle` | Estilo de la barra de desplazamiento |
| `@DefaultCheckBoxStyle` | Estilo de la casilla de verificación |
| `@DefaultDropdownBoxStyle` | Estilo del desplegable |
| `@DefaultSliderStyle` | Estilo del slider |
| `@DefaultTextTooltipStyle` | Estilo del tooltip de texto |
| `@DefaultColorPickerStyle` | Estilo del selector de color |

### Constantes de Color

```
@DisabledColor = #797b7c;
```

### Propiedades de LabelStyle

Al crear un `LabelStyle` personalizado:

```
LabelStyle(
  FontSize: 16,
  TextColor: #ffffff,
  RenderBold: true,
  RenderUppercase: true,
  HorizontalAlignment: Center,  // Start, Center, End
  VerticalAlignment: Center,    // Top, Center, Bottom
  FontName: "Default",          // o "Secondary"
  LetterSpacing: 0,
  Wrap: true                    // Ajuste de texto
)
```

### Estructura de TextButtonStyle

```
@MiEstiloBoton = TextButtonStyle(
  Default: (
    Background: PatchStyle(TexturePath: "path.png", Border: 12),
    LabelStyle: @AlgunEstiloDeLabel
  ),
  Hovered: (
    Background: PatchStyle(TexturePath: "hovered.png", Border: 12),
    LabelStyle: @AlgunEstiloDeLabel
  ),
  Pressed: (
    Background: PatchStyle(TexturePath: "pressed.png", Border: 12),
    LabelStyle: @AlgunEstiloDeLabel
  ),
  Disabled: (
    Background: PatchStyle(TexturePath: "disabled.png", Border: 12),
    LabelStyle: @EstiloDeLabelDeshabilitado
  ),
  Sounds: @SonidosDeBoton
);
```

### PatchStyle (fondos 9-slice)

```
PatchStyle(
  TexturePath: "Common/MiTextura.png",
  Border: 12,                    // Todos los lados iguales
  // O
  HorizontalBorder: 80,          // Bordes izquierdo/derecho
  VerticalBorder: 12             // Bordes superior/inferior
)
```

### Propiedades de Anchor

```
Anchor: (
  Width: 100,
  Height: 50,
  Top: 10,
  Bottom: 10,
  Left: 10,
  Right: 10,
  Horizontal: 10,  // Izquierda + Derecha
  Vertical: 10     // Arriba + Abajo
);
```

### Propiedades de Padding

```
Padding: (
  Full: 20,           // Todos los lados
  Horizontal: 10,     // Izquierda + Derecha
  Vertical: 10,       // Arriba + Abajo
  Top: 10,
  Bottom: 10,
  Left: 10,
  Right: 10
);
```

---

## Importaciones Requeridas

```java
// IU Principal
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

// ⚠️ IMPORTANTE: Seguridad de Hilos (Thread-Safety)
// Métodos de IU como handleDataEvent a menudo se ejecutan en hilos de red.
// SIEMPRE accede a las estadísticas del jugador (Salud, Maná) usando:
// EntityStatMap stats = playerRef.getComponent(EntityStatMap.getComponentType());
// NO uses store.getComponent() directamente si no estás seguro de estar en el hilo del Tick del Mundo.

// Jugador y Comandos
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;
import com.hypixel.hytale.server.core.universe.world.World;
import com.hypixel.hytale.server.core.Message;

// Notificaciones
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;
```