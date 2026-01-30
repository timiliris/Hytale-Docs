---
id: types
title: Tipos de Datos
sidebar_label: Tipos
sidebar_position: 5
description: Documentación de los principales tipos de datos en el servidor Hytale (BlockType, Items, etc.)
---

# Tipos de Datos Hytale

:::info Documentación v2 - Verificada
Esta documentación ha sido verificada contra el código fuente del servidor descompilado utilizando análisis multi-agente. Toda la información incluye referencias a archivos fuente.
:::

## ¿Qué son los Tipos de Datos?

Los **tipos de datos** definen la estructura de cada objeto en el mundo de Hytale. Al igual que un plano define cómo se ve una casa, los tipos de datos definen cómo "se ve" un bloque, ítem o entidad para el servidor.

### ¿Por qué importa esto?

Cuando creas una espada personalizada en Hytale, no estás escribiendo código - estás rellenando una estructura de datos:

```json
{
  "id": "my_sword",
  "maxStack": 1,
  "durability": 250,
  "weapon": {
    "damage": 15,
    "attackSpeed": 1.2
  }
}
```

Entender los tipos de datos te ayuda a:

- Saber qué propiedades están disponibles
- Evitar configuraciones inválidas
- Entender cómo el juego interpreta tu contenido

### Los Tipos de Datos Principales

El mundo de Hytale está construido a partir de unos pocos tipos fundamentales:

| Tipo               | Qué representa           | Ejemplo                                |
| ------------------ | ------------------------ | -------------------------------------- |
| **BlockType**      | Un tipo de bloque        | Piedra, Hierba, Bloques personalizados |
| **ItemBase**       | Un tipo de ítem          | Espada, Poción, Comida                 |
| **EntityEffect**   | Un beneficio o perjuicio | Veneno, Aumento de velocidad           |
| **CraftingRecipe** | Cómo fabricar cosas      | Combinar madera → tablones             |
| **Weather**        | Condiciones climáticas   | Lluvia, Nieve, Despejado               |

### Cómo se Conectan los Tipos

Estos tipos no existen de forma aislada - se hacen referencia entre sí:

```
BlockType (Mena)
    └── drops → ItemBase (Diamante)
                    └── usedIn → CraftingRecipe (Espada de Diamante)
                                      └── output → ItemBase (Espada de Diamante)
                                                       └── applies → EntityEffect (Sangrado)
```

### Analogía del Mundo Real: Instrucciones LEGO

Piensa en los tipos de datos como folletos de instrucciones LEGO:

- **BlockType** = Instrucciones para un ladrillo específico
- **Campos** = Propiedades como color, tamaño, puntos de conexión
- **Enums** = Opciones predefinidas (Rojo, Azul, Verde)
- **Referencias** = "Usar pieza #4207" - enlaces a otras piezas

Al igual que los ladrillos LEGO se unen siguiendo reglas, los tipos de datos de Hytale se conectan siguiendo sus esquemas.

### Entendiendo las Tablas a Continuación

Cada tipo de dato está documentado con tablas que muestran:

| Columna         | Qué significa                                  |
| --------------- | ---------------------------------------------- |
| **Campo**       | El nombre de la propiedad                      |
| **Tipo**        | Qué clase de dato (cadena, número, enum, etc.) |
| **Descripción** | Qué hace esta propiedad                        |

**Tipos que verás:**

- `String` - Texto como "espada_diamante"
- `int` / `float` / `double` - Números (entero o decimal)
- `boolean` - Verdadero/falso
- `EnumName` - Uno de un conjunto predefinido de valores
- `Type[]` - Una lista de valores
- `Map<Key, Value>` - Un diccionario/tabla de búsqueda
- `Type?` - Opcional (puede ser nulo/faltante)

---

## Referencia de Tipos de Datos

Esta documentación describe los principales tipos de datos utilizados en el servidor Hytale, extraídos de código descompilado.

---

## Tabla de Contenidos

1. [BlockType - Tipos de Bloque](#blocktype---block-types)
2. [Sistema de Ítems](#item-system)
   - [ItemBase](#itembase)
   - [ItemWeapon](#itemweapon)
   - [ItemArmor](#itemarmor)
   - [ItemTool](#itemtool)
   - [ItemQuality](#itemquality)
3. [EntityEffect - Efectos de Entidad](#entityeffect---entity-effects)
4. [CraftingRecipe - Recetas](#craftingrecipe---recipes)
5. [Entorno](#environment)
   - [Weather (Clima)](#weather)
   - [WorldEnvironment (Entorno del Mundo)](#worldenvironment)
6. [Enumeraciones Clave](#key-enumerations)
7. [Tipos Auxiliares](#auxiliary-types)

---

## BlockType - Tipos de Bloque

El tipo `BlockType` define las propiedades de un bloque dentro del mundo de Hytale.

### Campos Principales

| Campo               | Tipo             | Descripción                                                                   |
| ------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `item`              | `String`         | ID del ítem asociado con el bloque                                            |
| `name`              | `String`         | Nombre del bloque                                                             |
| `unknown`           | `boolean`        | Indica si el bloque es desconocido o indefinido                               |
| `drawType`          | `DrawType`       | Modo de renderizado del bloque (Empty, GizmoCube, Cube, Model, CubeWithModel) |
| `material`          | `BlockMaterial`  | Tipo de material (Empty, Solid)                                               |
| `opacity`           | `Opacity`        | Nivel de opacidad (Solid, Semitransparent, Cutout, Transparent)               |
| `shaderEffect`      | `ShaderType[]`   | Efectos de shader aplicados                                                   |
| `hitbox`            | `int`            | Índice de hitbox de colisión                                                  |
| `interactionHitbox` | `int`            | Índice de hitbox de interacción                                               |
| `model`             | `String`         | Ruta al modelo 3D                                                             |
| `modelTexture`      | `ModelTexture[]` | Texturas del modelo                                                           |
| `modelScale`        | `float`          | Escala del modelo                                                             |
| `modelAnimation`    | `String`         | Animación del modelo                                                          |
| `looping`           | `boolean`        | Si la animación se repite en bucle                                            |

### Propiedades de Soporte

| Campo                      | Tipo                                             | Descripción                              |
| -------------------------- | ------------------------------------------------ | ---------------------------------------- |
| `maxSupportDistance`       | `int`                                            | Distancia máxima de soporte              |
| `blockSupportsRequiredFor` | `BlockSupportsRequiredForType`                   | Tipo de soporte requerido                |
| `support`                  | `Map<BlockNeighbor, RequiredBlockFaceSupport[]>` | Caras de soporte requeridas              |
| `supporting`               | `Map<BlockNeighbor, BlockFaceSupport[]>`         | Caras de soporte proporcionadas          |
| `ignoreSupportWhenPlaced`  | `boolean`                                        | Ignorar requisitos de soporte al colocar |

### Propiedades Visuales

| Campo                        | Tipo              | Descripción                           |
| ---------------------------- | ----------------- | ------------------------------------- |
| `requiresAlphaBlending`      | `boolean`         | Requiere mezcla alfa                  |
| `cubeTextures`               | `BlockTextures[]` | Texturas para modo cubo               |
| `cubeSideMaskTexture`        | `String`          | Textura de máscara lateral            |
| `cubeShadingMode`            | `ShadingMode`     | Modo de sombreado                     |
| `randomRotation`             | `RandomRotation`  | Rotación aleatoria                    |
| `variantRotation`            | `VariantRotation` | Rotación de variante                  |
| `rotationYawPlacementOffset` | `Rotation`        | Desplazamiento de rotación al colocar |
| `particleColor`              | `Color`           | Color de partículas                   |
| `light`                      | `ColorLight`      | Emisión de luz                        |
| `tint`                       | `Tint`            | Tinte del bloque                      |
| `biomeTint`                  | `Tint`            | Tinte dependiente del bioma           |

### Audio y Efectos

| Campo                    | Tipo              | Descripción                   |
| ------------------------ | ----------------- | ----------------------------- |
| `blockSoundSetIndex`     | `int`             | Índice de conjunto de sonidos |
| `ambientSoundEventIndex` | `int`             | Índice de sonido ambiental    |
| `particles`              | `ModelParticle[]` | Partículas emitidas           |
| `blockParticleSetId`     | `String`          | ID de conjunto de partículas  |
| `blockBreakingDecalId`   | `String`          | ID de calcomanía de rotura    |

### Interacciones y Estados

| Campo                   | Tipo                            | Descripción                                  |
| ----------------------- | ------------------------------- | -------------------------------------------- |
| `interactions`          | `Map<InteractionType, Integer>` | Interacciones disponibles                    |
| `states`                | `Map<String, Integer>`          | Estados posibles                             |
| `flags`                 | `BlockFlags`                    | Banderas del bloque                          |
| `interactionHint`       | `String`                        | Pista de interacción                         |
| `gathering`             | `BlockGathering`                | Configuración de recolección                 |
| `placementSettings`     | `BlockPlacementSettings`        | Configuración de colocación                  |
| `bench`                 | `Bench`                         | Configuración de mesa de trabajo (si aplica) |
| `rail`                  | `RailConfig`                    | Configuración de raíl (si aplica)            |
| `connectedBlockRuleSet` | `ConnectedBlockRuleSet`         | Reglas de conexión                           |
| `tagIndexes`            | `int[]`                         | Etiquetas asociadas                          |

---

## Sistema de Ítems

### ItemBase

Tipo base para todos los ítems en el juego.

#### Identidad y Apariencia

| Campo                 | Tipo                  | Descripción                  |
| --------------------- | --------------------- | ---------------------------- |
| `id`                  | `String`              | Identificador único del ítem |
| `model`               | `String`              | Ruta al modelo 3D            |
| `scale`               | `float`               | Escala del ítem              |
| `texture`             | `String`              | Textura primaria             |
| `animation`           | `String`              | Animación del ítem           |
| `playerAnimationsId`  | `String`              | ID de animación del jugador  |
| `usePlayerAnimations` | `boolean`             | Usar animaciones del jugador |
| `icon`                | `String`              | Icono de inventario          |
| `iconProperties`      | `AssetIconProperties` | Propiedades del icono        |

#### Propiedades Base

| Campo           | Tipo                 | Descripción              |
| --------------- | -------------------- | ------------------------ |
| `maxStack`      | `int`                | Tamaño máximo de pila    |
| `reticleIndex`  | `int`                | Índice de retícula       |
| `itemLevel`     | `int`                | Nivel del ítem           |
| `qualityIndex`  | `int`                | Índice de calidad        |
| `resourceTypes` | `ItemResourceType[]` | Tipos de recursos        |
| `consumable`    | `boolean`            | Si el ítem es consumible |
| `variant`       | `boolean`            | Si es una variante       |
| `blockId`       | `int`                | ID de bloque asociado    |
| `durability`    | `double`             | Durabilidad del ítem     |

#### Subtipos Especializados

| Campo               | Tipo                    | Descripción                        |
| ------------------- | ----------------------- | ---------------------------------- |
| `tool`              | `ItemTool`              | Configuración de herramienta       |
| `weapon`            | `ItemWeapon`            | Configuración de arma              |
| `armor`             | `ItemArmor`             | Configuración de armadura          |
| `gliderConfig`      | `ItemGlider`            | Configuración de planeador         |
| `utility`           | `ItemUtility`           | Configuración de utilidad          |
| `blockSelectorTool` | `BlockSelectorToolData` | Herramienta de selección de bloque |
| `builderToolData`   | `ItemBuilderToolData`   | Herramienta de constructor         |

#### Interacciones y Sonidos

| Campo               | Tipo                            | Descripción                   |
| ------------------- | ------------------------------- | ----------------------------- |
| `soundEventIndex`   | `int`                           | Índice de evento de sonido    |
| `itemSoundSetIndex` | `int`                           | Índice de conjunto de sonidos |
| `interactions`      | `Map<InteractionType, Integer>` | Interacciones disponibles     |
| `interactionVars`   | `Map<String, Integer>`          | Variables de interacción      |
| `interactionConfig` | `InteractionConfiguration`      | Configuración de interacción  |

#### Efectos Visuales

| Campo                  | Tipo               | Descripción                      |
| ---------------------- | ------------------ | -------------------------------- |
| `particles`            | `ModelParticle[]`  | Partículas en tercera persona    |
| `firstPersonParticles` | `ModelParticle[]`  | Partículas en primera persona    |
| `trails`               | `ModelTrail[]`     | Estelas visuales                 |
| `light`                | `ColorLight`       | Emisión de luz                   |
| `itemEntity`           | `ItemEntityConfig` | Configuración de entidad de ítem |
| `droppedItemAnimation` | `String`           | Animación al soltar              |

#### Categorización

| Campo        | Tipo       | Descripción         |
| ------------ | ---------- | ------------------- |
| `set`        | `String`   | Conjunto de ítem    |
| `categories` | `String[]` | Categorías          |
| `tagIndexes` | `int[]`    | Etiquetas asociadas |

---

### ItemWeapon

Configuración específica de arma.

| Campo                | Tipo                       | Descripción                       |
| -------------------- | -------------------------- | --------------------------------- |
| `entityStatsToClear` | `int[]`                    | Estadísticas de entidad a limpiar |
| `statModifiers`      | `Map<Integer, Modifier[]>` | Modificadores de estadísticas     |
| `renderDualWielded`  | `boolean`                  | Renderizar a dos manos            |

---

### ItemArmor

Configuración específica de armadura.

| Campo                    | Tipo                       | Descripción                            |
| ------------------------ | -------------------------- | -------------------------------------- |
| `armorSlot`              | `ItemArmorSlot`            | Ranura (Cabeza, Pecho, Manos, Piernas) |
| `cosmeticsToHide`        | `Cosmetic[]`               | Cosméticos a ocultar                   |
| `statModifiers`          | `Map<Integer, Modifier[]>` | Modificadores de estadísticas          |
| `baseDamageResistance`   | `double`                   | Resistencia base al daño               |
| `damageResistance`       | `Map<String, Modifier[]>`  | Resistencia por tipo de daño           |
| `damageEnhancement`      | `Map<String, Modifier[]>`  | Mejora de daño                         |
| `damageClassEnhancement` | `Map<String, Modifier[]>`  | Mejora por clase de daño               |

---

### ItemTool

Configuración específica de herramienta.

| Campo   | Tipo             | Descripción                     |
| ------- | ---------------- | ------------------------------- |
| `specs` | `ItemToolSpec[]` | Especificaciones de herramienta |
| `speed` | `float`          | Velocidad de uso                |

---

### ItemQuality

Define calidad y rareza del ítem.

| Campo                     | Tipo      | Descripción                       |
| ------------------------- | --------- | --------------------------------- |
| `id`                      | `String`  | Identificador de calidad          |
| `itemTooltipTexture`      | `String`  | Textura de tooltip                |
| `itemTooltipArrowTexture` | `String`  | Textura de flecha de tooltip      |
| `slotTexture`             | `String`  | Textura de ranura                 |
| `blockSlotTexture`        | `String`  | Textura de ranura de bloque       |
| `specialSlotTexture`      | `String`  | Textura de ranura especial        |
| `textColor`               | `Color`   | Color de texto                    |
| `localizationKey`         | `String`  | Clave de localización             |
| `visibleQualityLabel`     | `boolean` | Si mostrar la etiqueta de calidad |
| `renderSpecialSlot`       | `boolean` | Si renderizar la ranura especial  |
| `hideFromSearch`          | `boolean` | Si ocultar de la búsqueda         |

---

## EntityEffect - Efectos de Entidad

Representa un efecto que puede aplicarse a una entidad (beneficio o perjuicio).

### Propiedades Principales

| Campo                         | Tipo                 | Descripción                    |
| ----------------------------- | -------------------- | ------------------------------ |
| `id`                          | `String`             | Identificador único del efecto |
| `name`                        | `String`             | Nombre para mostrar            |
| `applicationEffects`          | `ApplicationEffects` | Efectos visuales y de audio    |
| `worldRemovalSoundEventIndex` | `int`                | Sonido de eliminación mundial  |
| `localRemovalSoundEventIndex` | `int`                | Sonido de eliminación local    |
| `modelOverride`               | `ModelOverride`      | Anulación de modelo            |

### Duración

| Campo                      | Tipo              | Descripción                       |
| -------------------------- | ----------------- | --------------------------------- |
| `duration`                 | `float`           | Duración en segundos              |
| `infinite`                 | `boolean`         | Si la duración es infinita        |
| `overlapBehavior`          | `OverlapBehavior` | Comportamiento al solapar efectos |
| `damageCalculatorCooldown` | `double`          | Enfriamiento de cálculo de daño   |

### Características

| Campo              | Tipo                  | Descripción                          |
| ------------------ | --------------------- | ------------------------------------ |
| `debuff`           | `boolean`             | Si es un perjuicio (efecto negativo) |
| `statusEffectIcon` | `String`              | Icono de estado                      |
| `statModifiers`    | `Map<Integer, Float>` | Modificadores de estadísticas        |
| `valueType`        | `ValueType`           | Tipo de valor (Porcentaje, Absoluto) |

---

## CraftingRecipe - Recetas

Define una receta de fabricación.

| Campo                   | Tipo                 | Descripción                  |
| ----------------------- | -------------------- | ---------------------------- |
| `id`                    | `String`             | Identificador de receta      |
| `inputs`                | `MaterialQuantity[]` | Ingredientes requeridos      |
| `outputs`               | `MaterialQuantity[]` | Salidas de la receta         |
| `primaryOutput`         | `MaterialQuantity`   | Salida primaria              |
| `benchRequirement`      | `BenchRequirement[]` | Mesas de trabajo requeridas  |
| `knowledgeRequired`     | `boolean`            | Si se requiere conocimiento  |
| `timeSeconds`           | `float`              | Tiempo de fabricación        |
| `requiredMemoriesLevel` | `int`                | Nivel de recuerdos requerido |

### MaterialQuantity

| Campo            | Tipo     | Descripción           |
| ---------------- | -------- | --------------------- |
| `itemId`         | `String` | ID del ítem           |
| `itemTag`        | `int`    | Etiqueta del ítem     |
| `resourceTypeId` | `String` | ID de tipo de recurso |
| `quantity`       | `int`    | Cantidad              |

### BenchRequirement

| Campo               | Tipo        | Descripción             |
| ------------------- | ----------- | ----------------------- |
| `type`              | `BenchType` | Tipo de mesa de trabajo |
| `id`                | `String`    | ID específico           |
| `categories`        | `String[]`  | Categorías aceptadas    |
| `requiredTierLevel` | `int`       | Nivel requerido         |

---

## Entorno

### Weather (Clima)

Define un tipo de clima.

#### Cielo e Iluminación

| Campo                       | Tipo                     | Descripción                                 |
| --------------------------- | ------------------------ | ------------------------------------------- |
| `id`                        | `String`                 | Identificador de clima                      |
| `tagIndexes`                | `int[]`                  | Etiquetas asociadas                         |
| `stars`                     | `String`                 | Configuración de estrellas                  |
| `moons`                     | `Map<Integer, String>`   | Configuración de lunas                      |
| `clouds`                    | `Cloud[]`                | Configuración de nubes                      |
| `sunlightDampingMultiplier` | `Map<Float, Float>`      | Multiplicador de amortiguación de luz solar |
| `sunlightColors`            | `Map<Float, Color>`      | Colores de luz solar                        |
| `skyTopColors`              | `Map<Float, ColorAlpha>` | Colores del cielo (superior)                |
| `skyBottomColors`           | `Map<Float, ColorAlpha>` | Colores del cielo (inferior)                |
| `skySunsetColors`           | `Map<Float, ColorAlpha>` | Colores de atardecer                        |

#### Sol y Luna

| Campo            | Tipo                     | Descripción               |
| ---------------- | ------------------------ | ------------------------- |
| `sunColors`      | `Map<Float, Color>`      | Colores del sol           |
| `sunScales`      | `Map<Float, Float>`      | Escala del sol            |
| `sunGlowColors`  | `Map<Float, ColorAlpha>` | Colores de brillo del sol |
| `moonColors`     | `Map<Float, ColorAlpha>` | Colores de luna           |
| `moonScales`     | `Map<Float, Float>`      | Escala de la luna         |
| `moonGlowColors` | `Map<Float, ColorAlpha>` | Colores de brillo de luna |

#### Niebla y Efectos

| Campo                | Tipo                     | Descripción                    |
| -------------------- | ------------------------ | ------------------------------ |
| `fogColors`          | `Map<Float, Color>`      | Colores de niebla              |
| `fogHeightFalloffs`  | `Map<Float, Float>`      | Atenuación de altura de niebla |
| `fogDensities`       | `Map<Float, Float>`      | Densidades de niebla           |
| `fog`                | `NearFar`                | Distancia de niebla            |
| `fogOptions`         | `FogOptions`             | Opciones de niebla             |
| `screenEffect`       | `String`                 | Efecto de pantalla             |
| `screenEffectColors` | `Map<Float, ColorAlpha>` | Colores de efecto de pantalla  |
| `colorFilters`       | `Map<Float, Color>`      | Filtros de color               |
| `waterTints`         | `Map<Float, Color>`      | Tintes de agua                 |
| `particle`           | `WeatherParticle`        | Partículas de clima            |

---

### WorldEnvironment (Entorno del Mundo)

Define el entorno de un mundo.

| Campo            | Tipo                          | Descripción              |
| ---------------- | ----------------------------- | ------------------------ |
| `id`             | `String`                      | Identificador de entorno |
| `waterTint`      | `Color`                       | Tinte de agua            |
| `fluidParticles` | `Map<Integer, FluidParticle>` | Partículas de fluido     |
| `tagIndexes`     | `int[]`                       | Etiquetas asociadas      |

---

## Enumeraciones Clave

### GameMode

Modos de juego disponibles.

```
Adventure (0)  - Modo aventura
Creative (1)   - Modo creativo
```

### ItemArmorSlot

Ranuras de armadura.

```
Head (0)   - Cabeza
Chest (1)  - Pecho
Hands (2)  - Manos
Legs (3)   - Piernas
```

### BlockMaterial

Tipos de material de bloque.

```
Empty (0)  - Vacío (aire)
Solid (1)  - Sólido
```

### DrawType

Modos de renderizado de bloque.

```
Empty (0)        - Sin renderizado
GizmoCube (1)    - Cubo gizmo (depuración)
Cube (2)         - Renderizado de cubo estándar
Model (3)        - Modelo 3D
CubeWithModel (4)- Cubo con modelo
```

### Opacity

Niveles de opacidad de bloque.

```
Solid (0)          - Totalmente opaco
Semitransparent (1)- Semitransparente
Cutout (2)         - Recorte (hojas, etc.)
Transparent (3)    - Totalmente transparente
```

### InteractionType

Tipos de interacción disponibles.

```
Primary (0)         - Acción primaria (clic izquierdo)
Secondary (1)       - Acción secundaria (clic derecho)
Ability1 (2)        - Habilidad 1
Ability2 (3)        - Habilidad 2
Ability3 (4)        - Habilidad 3
Use (5)             - Uso
Pick (6)            - Recoger (Pick)
Pickup (7)          - Recoger (Pickup)
CollisionEnter (8)  - Entrada de colisión
CollisionLeave (9)  - Salida de colisión
Collision (10)      - Colisión
EntityStatEffect (11) - Efecto de estadística de entidad
SwapTo (12)         - Cambiar a
SwapFrom (13)       - Cambiar desde
Death (14)          - Muerte
Wielding (15)       - Blandiendo
ProjectileSpawn (16)- Aparición de proyectil
ProjectileHit (17)  - Impacto de proyectil
ProjectileMiss (18) - Fallo de proyectil
ProjectileBounce (19) - Rebote de proyectil
Held (20)           - Sostenido en mano
HeldOffhand (21)    - Sostenido en mano secundaria
Equipped (22)       - Equipado
Dodge (23)          - Esquivar
GameModeSwap (24)   - Cambio de modo de juego
```

### BenchType

Tipos de mesa de trabajo.

```
Crafting (0)           - Mesa de trabajo de fabricación
Processing (1)         - Mesa de trabajo de procesamiento
DiagramCrafting (2)    - Mesa de trabajo de esquemas
StructuralCrafting (3) - Mesa de trabajo estructural
```

### BlockFace

Caras de bloque.

```
None (0)   - Ninguna
Up (1)     - Arriba
Down (2)   - Abajo
North (3)  - Norte
South (4)  - Sur
East (5)   - Este
West (6)   - Oeste
```

### OverlapBehavior

Comportamiento al solapar efectos.

```
Extend (0)    - Extender duración
Overwrite (1) - Sobrescribir
Ignore (2)    - Ignorar el nuevo efecto
```

### ValueType

Tipo de valor para modificadores.

```
Percent (0)  - Porcentaje
Absolute (1) - Valor absoluto
```

### CalculationType

Calculation type for modifiers.

```
Additive (0)       - Additive (+X)
Multiplicative (1) - Multiplicative (*X)
```

### ModifierTarget

Objetivo del modificador.

```
Min (0) - Valor mínimo
Max (1) - Valor máximo
```

### Cosmetic

Tipos de cosméticos (pueden ser ocultados por armadura).

```
Haircut (0)        - Corte de pelo
FacialHair (1)     - Vello facial
Undertop (2)       - Camiseta interior
Overtop (3)        - Camiseta exterior
Pants (4)          - Pantalones
Overpants (5)      - Cubrepantalones
Shoes (6)          - Zapatos
Gloves (7)         - Guantes
Cape (8)           - Capa
HeadAccessory (9)  - Accesorio de cabeza
FaceAccessory (10) - Accesorio de cara
EarAccessory (11)  - Accesorio de oreja
Ear (12)           - Oreja
```

---

## Tipos Auxiliares

### Modifier

Modificador de estadística.

| Campo             | Tipo              | Descripción        |
| ----------------- | ----------------- | ------------------ |
| `target`          | `ModifierTarget`  | Objetivo (Min/Max) |
| `calculationType` | `CalculationType` | Tipo de cálculo    |
| `amount`          | `float`           | Cantidad           |

### ApplicationEffects

Efectos visuales y de audio aplicados cuando se activa un efecto.

| Campo                                | Tipo              | Descripción                                  |
| ------------------------------------ | ----------------- | -------------------------------------------- |
| `entityBottomTint`                   | `Color`           | Tinte inferior de entidad                    |
| `entityTopTint`                      | `Color`           | Tinte superior de entidad                    |
| `entityAnimationId`                  | `String`          | Animación a reproducir                       |
| `particles`                          | `ModelParticle[]` | Partículas                                   |
| `firstPersonParticles`               | `ModelParticle[]` | Partículas en primera persona                |
| `screenEffect`                       | `String`          | Efecto de pantalla                           |
| `horizontalSpeedMultiplier`          | `float`           | Multiplicador de velocidad horizontal        |
| `soundEventIndexLocal`               | `int`             | Sonido local                                 |
| `soundEventIndexWorld`               | `int`             | Sonido mundial                               |
| `modelVFXId`                         | `String`          | ID de VFX                                    |
| `movementEffects`                    | `MovementEffects` | Efectos de movimiento                        |
| `mouseSensitivityAdjustmentTarget`   | `float`           | Objetivo de ajuste de sensibilidad del ratón |
| `mouseSensitivityAdjustmentDuration` | `float`           | Duración del ajuste                          |
| `abilityEffects`                     | `AbilityEffects`  | Efectos de habilidad                         |

### DamageCause

Causa de daño.

| Campo             | Tipo     | Descripción             |
| ----------------- | -------- | ----------------------- |
| `id`              | `String` | Identificador de causa  |
| `damageTextColor` | `String` | Color del texto de daño |

### Color / ColorAlpha

Estructura de color.

| Campo | Tipo   | Descripción                       |
| ----- | ------ | --------------------------------- |
| `r`   | `byte` | Componente rojo (0-255)           |
| `g`   | `byte` | Componente verde (0-255)          |
| `b`   | `byte` | Componente azul (0-255)           |
| `a`   | `byte` | Componente alfa (Solo ColorAlpha) |

---

## Registros y Gestión

### Registry

Sistema de registro genérico para el registro de tipos.

| Método        | Descripción                          |
| ------------- | ------------------------------------ |
| `register(T)` | Registra un nuevo elemento           |
| `isEnabled()` | Comprueba si el registro está activo |
| `enable()`    | Habilita el registro                 |
| `shutdown()`  | Deshabilita el registro              |

### BlockPhysics

Componente de física de bloques (soporte/decoración).

| Campo           | Tipo     | Descripción                                |
| --------------- | -------- | ------------------------------------------ |
| `supportData`   | `byte[]` | Datos de soporte (16384 bytes)             |
| `IS_DECO_VALUE` | `int`    | Valor que indica un bloque decorativo (15) |
| `NULL_SUPPORT`  | `int`    | Sin soporte (0)                            |

| Método                  | Descripción                          |
| ----------------------- | ------------------------------------ |
| `set(x, y, z, support)` | Establece el valor de soporte        |
| `get(x, y, z)`          | Obtiene el valor de soporte          |
| `isDeco(x, y, z)`       | Comprueba si es un bloque decorativo |
| `markDeco(...)`         | Marca como decorativo                |
| `clear(...)`            | Limpia los datos                     |

---

## Notas Técnicas

### Serialización

Todos los tipos utilizan un formato de serialización binaria personalizado basado en:

- **VarInt**: Enteros de longitud variable
- **Null bits**: Campos de bits que indican qué campos anulables están presentes
- **Fixed block**: Porción de tamaño fijo al principio
- **Variable block**: Porción de tamaño variable para campos dinámicos

### Paquete Fuente

```
com.hypixel.hytale.protocol - Protocolo/tipos de datos
com.hypixel.hytale.server.core.blocktype - Módulo tipo de bloque
com.hypixel.hytale.registry - Sistema de registro
```

---

## Tipos de Datos Extendidos

Esta sección proporciona tipos de datos adicionales descubiertos en el código del servidor descompilado, incluyendo enums, clases de configuración y estructuras de datos para jugabilidad, permisos, combate y gestión del mundo.

---

### Tipos de Movimiento y Animación

#### MovementType

`com.hypixel.hytale.protocol.MovementType`

Define el tipo de movimiento que una entidad está realizando actualmente. Utilizado por los sistemas de animación y física.

| Valor            | ID  | Descripción                         |
| ---------------- | --- | ----------------------------------- |
| `None`           | 0   | Sin movimiento                      |
| `Idle`           | 1   | Entidad estacionaria pero activa    |
| `Crouching`      | 2   | Entidad agachada/sigilosa           |
| `Walking`        | 3   | Caminando a velocidad normal        |
| `Running`        | 4   | Corriendo a velocidad aumentada     |
| `Sprinting`      | 5   | Esprintando a velocidad máxima      |
| `Climbing`       | 6   | Escalando una escalera o superficie |
| `Swimming`       | 7   | Nadando en agua                     |
| `Flying`         | 8   | Volando (modo creativo o planeador) |
| `Sliding`        | 9   | Deslizándose en una superficie      |
| `Rolling`        | 10  | Movimiento de esquiva rodando       |
| `Mounting`       | 11  | Montando a velocidad normal         |
| `SprintMounting` | 12  | Montando mientras esprinta          |

**Fuente:** `com/hypixel/hytale/protocol/MovementType.java`

**Ejemplo de Uso:**

```java
MovementType currentMovement = entity.getMovementType();
if (currentMovement == MovementType.Sprinting) {
    // Aplicar drenaje de energía
}
```

---

#### AnimationSlot

`com.hypixel.hytale.protocol.AnimationSlot`

Define las ranuras de capa de animación utilizadas por el sistema de animación de entidades. Múltiples animaciones pueden reproducirse simultáneamente en diferentes ranuras.

| Valor      | ID  | Descripción                                              |
| ---------- | --- | -------------------------------------------------------- |
| `Movement` | 0   | Animaciones de movimiento base (caminar, correr, reposo) |
| `Status`   | 1   | Animaciones de efectos de estado (aturdido, envenenado)  |
| `Action`   | 2   | Animaciones de acción (atacar, usar ítem)                |
| `Face`     | 3   | Expresiones faciales y movimientos de cabeza             |
| `Emote`    | 4   | Animaciones de gestos/emotes                             |

**Fuente:** `com/hypixel/hytale/protocol/AnimationSlot.java`

**Contexto de Uso:** El sistema de animación utiliza ranuras para mezclar múltiples animaciones. Por ejemplo, un personaje puede caminar (ranura de Movimiento) mientras muestra una expresión de envenenado (ranura de Estado) y saluda (ranura de Emote) simultáneamente.

---

### Tipos de Conexión

#### DisconnectType

`com.hypixel.hytale.protocol.packets.connection.DisconnectType`

Especifica la razón de una desconexión del cliente del servidor.

| Valor        | ID  | Descripción                                         |
| ------------ | --- | --------------------------------------------------- |
| `Disconnect` | 0   | Desconexión normal (jugador salió, expulsado, etc.) |
| `Crash`      | 1   | Desconexión debido a un bloqueo o error             |

**Fuente:** `com/hypixel/hytale/protocol/packets/connection/DisconnectType.java`

---

### Tipos Visuales y de Renderizado

#### ShadingMode

`com.hypixel.hytale.protocol.ShadingMode`

Define el modo de sombreado para el renderizado de bloques.

| Valor        | ID  | Descripción                         |
| ------------ | --- | ----------------------------------- |
| `Standard`   | 0   | Iluminación y sombras estándar      |
| `Flat`       | 1   | Sombreado plano sin gradientes      |
| `Fullbright` | 2   | Sin sombras, brillo total           |
| `Reflective` | 3   | Sombreado de superficie reflectante |

**Fuente:** `com/hypixel/hytale/protocol/ShadingMode.java`

---

### Sistema de Permisos

El sistema de permisos controla el acceso a comandos, características y funcionalidad del editor.

#### HytalePermissions

`com.hypixel.hytale.server.core.permissions.HytalePermissions`

Define las cadenas de permisos integradas utilizadas por el servidor Hytale.

| Permiso                             | Descripción                                        |
| ----------------------------------- | -------------------------------------------------- |
| `hytale.command`                    | Permiso base para comandos                         |
| `hytale.editor.asset`               | Acceso al editor de activos                        |
| `hytale.editor.packs.create`        | Crear paquetes de activos                          |
| `hytale.editor.packs.edit`          | Editar paquetes de activos                         |
| `hytale.editor.packs.delete`        | Eliminar paquetes de activos                       |
| `hytale.editor.builderTools`        | Acceso a herramientas de constructor               |
| `hytale.editor.brush.use`           | Usar pinceles                                      |
| `hytale.editor.brush.config`        | Configurar pinceles                                |
| `hytale.editor.prefab.use`          | Usar prefabs                                       |
| `hytale.editor.prefab.manage`       | Gestionar prefabs                                  |
| `hytale.editor.selection.use`       | Usar herramientas de selección                     |
| `hytale.editor.selection.clipboard` | Usar operaciones de portapapeles                   |
| `hytale.editor.selection.modify`    | Modificar selecciones                              |
| `hytale.editor.history`             | Acceder al historial de edición (deshacer/rehacer) |
| `hytale.camera.flycam`              | Usar modo de cámara de vuelo                       |

**Fuente:** `com/hypixel/hytale/server/core/permissions/HytalePermissions.java`

**Ejemplo de Uso:**

```java
// Comprobar si un jugador tiene permiso
if (player.hasPermission("hytale.editor.builderTools")) {
    // Habilitar herramientas de constructor
}

// Generar permiso de comando
String permission = HytalePermissions.fromCommand("teleport");
// Devuelve "hytale.command.teleport"
```

---

#### PermissionProvider

`com.hypixel.hytale.server.core.permissions.provider.PermissionProvider`

Interfaz para implementar sistemas de permisos personalizados.

| Método                                        | Descripción                              |
| --------------------------------------------- | ---------------------------------------- |
| `getName()`                                   | Devuelve el nombre del proveedor         |
| `addUserPermissions(UUID, Set<String>)`       | Añadir permisos a un usuario             |
| `removeUserPermissions(UUID, Set<String>)`    | Eliminar permisos de un usuario          |
| `getUserPermissions(UUID)`                    | Obtener todos los permisos de usuario    |
| `addGroupPermissions(String, Set<String>)`    | Añadir permisos a un grupo               |
| `removeGroupPermissions(String, Set<String>)` | Eliminar permisos de un grupo            |
| `getGroupPermissions(String)`                 | Obtener todos los permisos de grupo      |
| `addUserToGroup(UUID, String)`                | Añadir usuario a un grupo de permisos    |
| `removeUserFromGroup(UUID, String)`           | Eliminar usuario de un grupo             |
| `getGroupsForUser(UUID)`                      | Obtener todos los grupos para un usuario |

**Fuente:** `com/hypixel/hytale/server/core/permissions/provider/PermissionProvider.java`

---

#### PermissionHolder

`com.hypixel.hytale.server.core.permissions.PermissionHolder`

Interfaz para entidades que pueden mantener permisos.

| Método                           | Descripción                               |
| -------------------------------- | ----------------------------------------- |
| `hasPermission(String)`          | Comprueba si el poseedor tiene un permiso |
| `hasPermission(String, boolean)` | Comprueba permiso con valor por defecto   |

**Fuente:** `com/hypixel/hytale/server/core/permissions/PermissionHolder.java`

---

### Configuración del Mundo

#### WorldConfig (Tiempo de Ejecución)

`com.hypixel.hytale.server.core.universe.world.WorldConfig`

Configuración completa del mundo para gestión en tiempo de ejecución.

| Campo                   | Tipo                    | Predeterminado | Descripción                           |
| ----------------------- | ----------------------- | -------------- | ------------------------------------- |
| `UUID`                  | `UUID`                  | Aleatorio      | Identificador único del mundo         |
| `DisplayName`           | `String`                | -              | Nombre visible para el jugador        |
| `Seed`                  | `long`                  | Tiempo actual  | Semilla de generación del mundo       |
| `SpawnProvider`         | `ISpawnProvider`        | null           | Controla ubicación de aparición       |
| `WorldGen`              | `IWorldGenProvider`     | Predeterminado | Generador de mundo                    |
| `WorldMap`              | `IWorldMapProvider`     | Predeterminado | Proveedor de mapa del mundo           |
| `ChunkStorage`          | `IChunkStorageProvider` | Predeterminado | Sistema de almacenamiento de chunks   |
| `IsTicking`             | `boolean`               | true           | Habilitar ticking de chunks           |
| `IsBlockTicking`        | `boolean`               | true           | Habilitar ticking de bloques          |
| `IsPvpEnabled`          | `boolean`               | false          | Habilitar jugador vs jugador          |
| `IsFallDamageEnabled`   | `boolean`               | true           | Habilitar daño por caída              |
| `IsGameTimePaused`      | `boolean`               | false          | Pausar ciclo día/noche                |
| `GameTime`              | `Instant`               | 5:30 AM        | Hora actual del juego                 |
| `ForcedWeather`         | `String`                | null           | Forzar clima específico               |
| `GameMode`              | `GameMode`              | Pred. Servidor | Modo de juego predeterminado          |
| `IsSpawningNPC`         | `boolean`               | true           | Permitir aparición de NPC             |
| `IsSpawnMarkersEnabled` | `boolean`               | true           | Mostrar marcadores de aparición       |
| `IsAllNPCFrozen`        | `boolean`               | false          | Congelar todos los NPCs               |
| `GameplayConfig`        | `String`                | "Default"      | Referencia de config de jugabilidad   |
| `IsSavingPlayers`       | `boolean`               | true           | Guardar datos de jugadores            |
| `IsSavingChunks`        | `boolean`               | true           | Guardar datos de chunks               |
| `SaveNewChunks`         | `boolean`               | true           | Guardar chunks recién generados       |
| `IsUnloadingChunks`     | `boolean`               | true           | Permitir descarga de chunks           |
| `DeleteOnUniverseStart` | `boolean`               | false          | Eliminar mundo al inicio del servidor |
| `DeleteOnRemove`        | `boolean`               | false          | Eliminar archivos al eliminar         |

**Fuente:** `com/hypixel/hytale/server/core/universe/world/WorldConfig.java`

**JSON Example:**

```json
{
  "DisplayName": "Adventure World",
  "Seed": 12345,
  "IsPvpEnabled": true,
  "IsFallDamageEnabled": true,
  "GameMode": "Adventure",
  "DaytimeDurationSeconds": 1200,
  "NighttimeDurationSeconds": 600
}
```

---

#### WorldConfig (Activo de Jugabilidad)

`com.hypixel.hytale.server.core.asset.type.gameplay.WorldConfig`

Configuración del mundo como parte de activos de configuración de jugabilidad.

| Campo                          | Tipo          | Predeterminado | Descripción                                    |
| ------------------------------ | ------------- | -------------- | ---------------------------------------------- |
| `AllowBlockBreaking`           | `boolean`     | true           | Permitir a jugadores romper bloques            |
| `AllowBlockGathering`          | `boolean`     | true           | Permitir recolección de recursos               |
| `AllowBlockPlacement`          | `boolean`     | true           | Permitir colocación de bloques                 |
| `BlockPlacementFragilityTimer` | `float`       | 0              | Segundos que bloques son frágiles tras colocar |
| `DaytimeDurationSeconds`       | `int`         | 1728           | Segundos reales para el día (29 minutos)       |
| `NighttimeDurationSeconds`     | `int`         | 1728           | Segundos reales para la noche (29 minutos)     |
| `TotalMoonPhases`              | `int`         | 5              | Número de fases lunares                        |
| `Sleep`                        | `SleepConfig` | Predeterminado | Configuración de sueño                         |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/gameplay/WorldConfig.java`

**Nota:** El ciclo día/noche predeterminado es de 48 minutos reales (2880 segundos total), con periodos iguales de día y noche de 1728 segundos cada uno.

---

#### SleepConfig

`com.hypixel.hytale.server.core.asset.type.gameplay.SleepConfig`

Configuración para mecánicas de sueño en mundos.

| Campo                    | Tipo        | Predeterminado | Descripción                                  |
| ------------------------ | ----------- | -------------- | -------------------------------------------- |
| `WakeUpHour`             | `float`     | 5.5            | Hora en el juego cuando despiertan (5:30 AM) |
| `AllowedSleepHoursRange` | `double[2]` | null           | Rango de horas cuando se permite dormir      |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/gameplay/SleepConfig.java`

**JSON Example:**

```json
{
  "Sleep": {
    "WakeUpHour": 6.0,
    "AllowedSleepHoursRange": [20.0, 6.0]
  }
}
```

---

### Configuración de Combate

#### CombatConfig

`com.hypixel.hytale.server.core.asset.type.gameplay.CombatConfig`

Configuración para mecánicas de combate.

| Campo                         | Tipo       | Predeterminado   | Descripción                                  |
| ----------------------------- | ---------- | ---------------- | -------------------------------------------- |
| `OutOfCombatDelaySeconds`     | `Duration` | 5000ms           | Retardo antes de considerar fuera de combate |
| `StaminaBrokenEffectId`       | `String`   | "Stamina_Broken" | Efecto aplicado al agotar energía            |
| `DisplayHealthBars`           | `boolean`  | true             | Mostrar barras de salud sobre entidades      |
| `DisplayCombatText`           | `boolean`  | true             | Mostrar números de daño                      |
| `DisableNPCIncomingDamage`    | `boolean`  | false            | Hacer NPCs invulnerables                     |
| `DisablePlayerIncomingDamage` | `boolean`  | false            | Hacer jugadores invulnerables                |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/gameplay/CombatConfig.java`

**JSON Example:**

```json
{
  "Combat": {
    "OutOfCombatDelaySeconds": 8,
    "DisplayHealthBars": true,
    "DisplayCombatText": true,
    "DisablePlayerIncomingDamage": false
  }
}
```

---

### Configuración de Muerte y Reaparición

#### DeathConfig

`com.hypixel.hytale.server.core.asset.type.gameplay.DeathConfig`

Configuración para mecánicas de muerte y pérdida de ítems.

| Campo                           | Tipo                | Predeterminado   | Descripción                          |
| ------------------------------- | ------------------- | ---------------- | ------------------------------------ |
| `RespawnController`             | `RespawnController` | HomeOrSpawnPoint | Determina ubicación de reaparición   |
| `ItemsLossMode`                 | `ItemsLossMode`     | NONE             | Cómo se pierden ítems al morir       |
| `ItemsAmountLossPercentage`     | `double`            | 10.0             | Porcentaje de ítems perdidos (0-100) |
| `ItemsDurabilityLossPercentage` | `double`            | 10.0             | Durabilidad perdida al morir (0-100) |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/gameplay/DeathConfig.java`

---

#### ItemsLossMode

`com.hypixel.hytale.server.core.asset.type.gameplay.DeathConfig.ItemsLossMode`

Define cómo se pierden los ítems al morir.

| Valor        | Descripción                                                  |
| ------------ | ------------------------------------------------------------ |
| `NONE`       | No se pierden ítems                                          |
| `ALL`        | Se pierden todos los ítems                                   |
| `CONFIGURED` | Usa porcentaje configurado para ítems con `DropOnDeath=true` |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/gameplay/DeathConfig.java`

---

### Configuración de Jugabilidad

#### GameplayConfig

`com.hypixel.hytale.server.core.asset.type.gameplay.GameplayConfig`

Configuración maestra para mecánicas de juego, combinando múltiples sub-configuraciones.

| Campo                         | Tipo                   | Descripción                                    |
| ----------------------------- | ---------------------- | ---------------------------------------------- |
| `id`                          | `String`               | Identificador de configuración (ej. "Default") |
| `Gathering`                   | `GatheringConfig`      | Ajustes de recolección de recursos             |
| `World`                       | `WorldConfig`          | Ajustes de mecánicas del mundo                 |
| `WorldMap`                    | `WorldMapConfig`       | Ajustes del mapa del mundo                     |
| `Death`                       | `DeathConfig`          | Ajustes de muerte y reaparición                |
| `Respawn`                     | `RespawnConfig`        | Mecánicas de reaparición                       |
| `ShowItemPickupNotifications` | `boolean`              | Mostrar IU de recogida de ítems                |
| `ItemDurability`              | `ItemDurabilityConfig` | Ajustes de durabilidad                         |
| `ItemEntity`                  | `ItemEntityConfig`     | Ajustes de ítems soltados                      |
| `Combat`                      | `CombatConfig`         | Mecánicas de combate                           |
| `Player`                      | `PlayerConfig`         | Ajustes del jugador                            |
| `CameraEffects`               | `CameraEffectsConfig`  | Ajustes de efectos de cámara                   |
| `Crafting`                    | `CraftingConfig`       | Ajustes de fabricación (crafting)              |
| `Spawn`                       | `SpawnConfig`          | Ajustes de aparición                           |
| `MaxEnvironmentalNPCSpawns`   | `int`                  | Máx apariciones de NPC (-1 para infinito)      |
| `CreativePlaySoundSet`        | `String`               | Conjunto de sonidos para modo creativo         |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/gameplay/GameplayConfig.java`

**JSON Example:**

```json
{
  "Id": "Adventure",
  "World": {
    "AllowBlockBreaking": true,
    "DaytimeDurationSeconds": 1200
  },
  "Combat": {
    "DisplayHealthBars": true,
    "OutOfCombatDelaySeconds": 5
  },
  "Death": {
    "ItemsLossMode": "CONFIGURED",
    "ItemsAmountLossPercentage": 25.0
  },
  "MaxEnvironmentalNPCSpawns": 300
}
```

---

## Referencia de Paquetes Fuente

| Paquete                                               | Contenido                                 |
| ----------------------------------------------------- | ----------------------------------------- |
| `com.hypixel.hytale.protocol`                         | Enums de protocolo y tipos de datos       |
| `com.hypixel.hytale.protocol.packets.connection`      | Paquetes relacionados con la conexión     |
| `com.hypixel.hytale.protocol.packets.setup`           | Paquetes de configuración (WorldSettings) |
| `com.hypixel.hytale.server.core.permissions`          | Sistema de permisos                       |
| `com.hypixel.hytale.server.core.permissions.provider` | Proveedores de permisos                   |
| `com.hypixel.hytale.server.core.universe.world`       | Gestión del mundo                         |
| `com.hypixel.hytale.server.core.asset.type.gameplay`  | Activos de configuración de jugabilidad   |

---

---

## Enumeraciones Adicionales (Protocolo)

Esta sección documenta enumeraciones adicionales descubiertas en la capa de protocolo que son esenciales para modders y creadores de contenido.

### Sonido y Audio

#### SoundCategory

`com.hypixel.hytale.protocol.SoundCategory`

Categorías para reproducción de sonido y control de volumen.

| Valor     | ID  | Descripción                                 |
| --------- | --- | ------------------------------------------- |
| `Music`   | 0   | Música de fondo                             |
| `Ambient` | 1   | Sonidos ambientales del entorno             |
| `SFX`     | 2   | Efectos de sonido (acciones, combate, etc.) |
| `UI`      | 3   | Sonidos de interfaz de usuario              |

**Fuente:** `com/hypixel/hytale/protocol/SoundCategory.java`

---

#### BlockSoundEvent

`com.hypixel.hytale.protocol.BlockSoundEvent`

Eventos que desencadenan sonidos relacionados con bloques.

| Valor     | ID  | Descripción                                      |
| --------- | --- | ------------------------------------------------ |
| `Walk`    | 0   | Caminando sobre el bloque                        |
| `Land`    | 1   | Aterrizando sobre el bloque                      |
| `MoveIn`  | 2   | Moviéndose dentro del bloque                     |
| `MoveOut` | 3   | Moviéndose fuera del bloque                      |
| `Hit`     | 4   | Golpeando/dañando el bloque                      |
| `Break`   | 5   | Rompiendo el bloque                              |
| `Build`   | 6   | Colocando el bloque                              |
| `Clone`   | 7   | Clonando el bloque (herramientas de constructor) |
| `Harvest` | 8   | Cosechando del bloque                            |

**Fuente:** `com/hypixel/hytale/protocol/BlockSoundEvent.java`

---

#### ItemSoundEvent

`com.hypixel.hytale.protocol.ItemSoundEvent`

Eventos que desencadenan sonidos relacionados con ítems.

| Valor  | ID  | Descripción                    |
| ------ | --- | ------------------------------ |
| `Drag` | 0   | Arrastrando ítem en inventario |
| `Drop` | 1   | Soltando ítem                  |

**Fuente:** `com/hypixel/hytale/protocol/ItemSoundEvent.java`

---

### Partículas y Efectos Visuales

#### BlockParticleEvent

`com.hypixel.hytale.protocol.BlockParticleEvent`

Eventos que desencadenan efectos de partículas de bloques.

| Valor      | ID  | Descripción                                      |
| ---------- | --- | ------------------------------------------------ |
| `Walk`     | 0   | Partículas al caminar                            |
| `Run`      | 1   | Partículas al correr                             |
| `Sprint`   | 2   | Partículas al esprintar                          |
| `SoftLand` | 3   | Partículas de aterrizaje suave                   |
| `HardLand` | 4   | Partículas de aterrizaje fuerte (daño por caída) |
| `MoveOut`  | 5   | Partículas al salir                              |
| `Hit`      | 6   | Partículas al golpear                            |
| `Break`    | 7   | Partículas al romper bloque                      |
| `Build`    | 8   | Partículas al colocar bloque                     |
| `Physics`  | 9   | Partículas desencadenadas por física             |

**Fuente:** `com/hypixel/hytale/protocol/BlockParticleEvent.java`

---

#### EmitShape

`com.hypixel.hytale.protocol.EmitShape`

Formas para emisión de partículas.

| Valor    | ID  | Descripción      |
| -------- | --- | ---------------- |
| `Sphere` | 0   | Emisión esférica |
| `Cube`   | 1   | Emisión cúbica   |

**Fuente:** `com/hypixel/hytale/protocol/EmitShape.java`

---

#### FXRenderMode

`com.hypixel.hytale.protocol.FXRenderMode`

Modos de renderizado para efectos visuales.

| Valor         | ID  | Descripción          |
| ------------- | --- | -------------------- |
| `BlendLinear` | 0   | Mezcla lineal        |
| `BlendAdd`    | 1   | Mezcla aditiva       |
| `Erosion`     | 2   | Efecto de erosión    |
| `Distortion`  | 3   | Efecto de distorsión |

**Fuente:** `com/hypixel/hytale/protocol/FXRenderMode.java`

---

#### ShaderType

`com.hypixel.hytale.protocol.ShaderType`

Efectos de shader que pueden aplicarse a bloques.

| Valor          | ID  | Descripción                   |
| -------------- | --- | ----------------------------- |
| `None`         | 0   | Sin efecto de shader          |
| `Wind`         | 1   | Animación de viento           |
| `WindAttached` | 2   | Animación de viento (adjunto) |
| `WindRandom`   | 3   | Animación de viento aleatoria |
| `WindFractal`  | 4   | Animación de viento fractal   |
| `Ice`          | 5   | Shader de hielo               |
| `Water`        | 6   | Shader de agua                |
| `Lava`         | 7   | Shader de lava                |
| `Slime`        | 8   | Shader de limo (slime)        |
| `Ripple`       | 9   | Efecto de ondulación          |

**Fuente:** `com/hypixel/hytale/protocol/ShaderType.java`

---

### Cámara y Vista

#### CameraPerspectiveType

`com.hypixel.hytale.protocol.CameraPerspectiveType`

Modos de perspectiva de cámara.

| Valor   | ID  | Descripción              |
| ------- | --- | ------------------------ |
| `First` | 0   | Vista en primera persona |
| `Third` | 1   | Vista en tercera persona |

**Fuente:** `com/hypixel/hytale/protocol/CameraPerspectiveType.java`

---

#### CameraActionType

`com.hypixel.hytale.protocol.CameraActionType`

Tipos de acciones de cámara.

| Valor              | ID  | Descripción                       |
| ------------------ | --- | --------------------------------- |
| `ForcePerspective` | 0   | Forzar una perspectiva específica |
| `Orbit`            | 1   | Orbitar alrededor de un objetivo  |
| `Transition`       | 2   | Transición entre posiciones       |

**Fuente:** `com/hypixel/hytale/protocol/CameraActionType.java`

---

### Animación y Transiciones (Easing)

#### EasingType

`com.hypixel.hytale.protocol.EasingType`

Funciones de aceleración (easing) para animaciones y transiciones suaves. Esenciales para crear movimiento fluido en animaciones personalizadas.

| Valor          | ID  | Descripción                  |
| -------------- | --- | ---------------------------- |
| `Linear`       | 0   | Lineal (velocidad constante) |
| `QuadIn`       | 1   | Cuadrática (entrada)         |
| `QuadOut`      | 2   | Cuadrática (salida)          |
| `QuadInOut`    | 3   | Cuadrática (entrada/salida)  |
| `CubicIn`      | 4   | Cúbica (entrada)             |
| `CubicOut`     | 5   | Cúbica (salida)              |
| `CubicInOut`   | 6   | Cúbica (entrada/salida)      |
| `QuartIn`      | 7   | Cuártica (entrada)           |
| `QuartOut`     | 8   | Cuártica (salida)            |
| `QuartInOut`   | 9   | Cuártica (entrada/salida)    |
| `QuintIn`      | 10  | Quintica (entrada)           |
| `QuintOut`     | 11  | Quintica (salida)            |
| `QuintInOut`   | 12  | Quintica (entrada/salida)    |
| `SineIn`       | 13  | Sinusoidal (entrada)         |
| `SineOut`      | 14  | Sinusoidal (salida)          |
| `SineInOut`    | 15  | Sinusoidal (entrada/salida)  |
| `ExpoIn`       | 16  | Exponencial (entrada)        |
| `ExpoOut`      | 17  | Exponencial (salida)         |
| `ExpoInOut`    | 18  | Exponencial (entrada/salida) |
| `CircIn`       | 19  | Circular (entrada)           |
| `CircOut`      | 20  | Circular (salida)            |
| `CircInOut`    | 21  | Circular (entrada/salida)    |
| `ElasticIn`    | 22  | Elástica (entrada)           |
| `ElasticOut`   | 23  | Elástica (salida)            |
| `ElasticInOut` | 24  | Elástica (entrada/salida)    |
| `BackIn`       | 25  | Retroceso (entrada)          |
| `BackOut`      | 26  | Retroceso (salida)           |
| `BackInOut`    | 27  | Retroceso (entrada/salida)   |
| `BounceIn`     | 28  | Rebote (entrada)             |
| `BounceOut`    | 29  | Rebote (salida)              |
| `BounceInOut`  | 30  | Rebote (entrada/salida)      |

**Fuente:** `com/hypixel/hytale/protocol/EasingType.java`

---

### Entrada e Interacción

#### ClickType

`com.hypixel.hytale.protocol.ClickType`

Tipos de clic del ratón.

| Valor    | ID  | Descripción     |
| -------- | --- | --------------- |
| `None`   | 0   | Sin clic        |
| `Left`   | 1   | Botón izquierdo |
| `Right`  | 2   | Botón derecho   |
| `Middle` | 3   | Botón central   |

**Fuente:** `com/hypixel/hytale/protocol/ClickType.java`

---

#### InteractionState

`com.hypixel.hytale.protocol.InteractionState`

Estados de una interacción.

| Valor         | ID  | Descripción                         |
| ------------- | --- | ----------------------------------- |
| `Finished`    | 0   | Interacción completada exitosamente |
| `Skip`        | 1   | Interacción omitida                 |
| `ItemChanged` | 2   | Ítem cambiado durante interacción   |
| `Failed`      | 3   | Interacción fallida                 |
| `NotFinished` | 4   | Interacción aún en progreso         |

**Fuente:** `com/hypixel/hytale/protocol/InteractionState.java`

---

#### InteractionTarget

`com.hypixel.hytale.protocol.InteractionTarget`

Objetivo de una interacción.

| Valor    | ID  | Descripción                               |
| -------- | --- | ----------------------------------------- |
| `User`   | 0   | El usuario realizando la interacción      |
| `Owner`  | 1   | El propietario de la entidad interactuada |
| `Target` | 2   | El objetivo de la interacción             |

**Fuente:** `com/hypixel/hytale/protocol/InteractionTarget.java`

---

### Inventario

#### InventoryActionType

`com.hypixel.hytale.protocol.InventoryActionType`

Tipos de acciones de inventario.

| Valor        | ID  | Descripción                                |
| ------------ | --- | ------------------------------------------ |
| `TakeAll`    | 0   | Tomar todos los ítems                      |
| `PutAll`     | 1   | Poner todos los ítems                      |
| `QuickStack` | 2   | Apilamiento rápido a contenedores cercanos |
| `Sort`       | 3   | Ordenar inventario                         |

**Fuente:** `com/hypixel/hytale/protocol/InventoryActionType.java`

---

#### SortType

`com.hypixel.hytale.server.core.inventory.container.SortType`

Métodos de ordenación de inventario.

| Valor    | Descripción                                                            |
| -------- | ---------------------------------------------------------------------- |
| `NAME`   | Ordenar alfabéticamente por nombre                                     |
| `TYPE`   | Ordenar por tipo de ítem (Arma, Armadura, Herramienta, Ítem, Especial) |
| `RARITY` | Ordenar por rareza/calidad del ítem                                    |

**Fuente:** `com/hypixel/hytale/server/core/inventory/container/SortType.java`

---

### Configuración de Bloques

#### BlockNeighbor

`com.hypixel.hytale.protocol.BlockNeighbor`

Todas las posibles direcciones de vecinos de bloque (26 vecinos en total).

| Valor           | ID  | Descripción       |
| --------------- | --- | ----------------- |
| `Up`            | 0   | Arriba            |
| `Down`          | 1   | Abajo             |
| `North`         | 2   | Norte             |
| `East`          | 3   | Este              |
| `South`         | 4   | Sur               |
| `West`          | 5   | Oeste             |
| `UpNorth`       | 6   | Arriba y Norte    |
| `UpSouth`       | 7   | Arriba y Sur      |
| `UpEast`        | 8   | Arriba y Este     |
| `UpWest`        | 9   | Arriba y Oeste    |
| `DownNorth`     | 10  | Abajo y Norte     |
| `DownSouth`     | 11  | Abajo y Sur       |
| `DownEast`      | 12  | Abajo y Este      |
| `DownWest`      | 13  | Abajo y Oeste     |
| `NorthEast`     | 14  | Noreste           |
| `SouthEast`     | 15  | Sureste           |
| `SouthWest`     | 16  | Suroeste          |
| `NorthWest`     | 17  | Noroeste          |
| `UpNorthEast`   | 18  | Arriba y Noreste  |
| `UpSouthEast`   | 19  | Arriba y Sureste  |
| `UpSouthWest`   | 20  | Arriba y Suroeste |
| `UpNorthWest`   | 21  | Arriba y Noroeste |
| `DownNorthEast` | 22  | Abajo y Noreste   |
| `DownSouthEast` | 23  | Abajo y Sureste   |
| `DownSouthWest` | 24  | Abajo y Suroeste  |
| `DownNorthWest` | 25  | Abajo y Noroeste  |

**Fuente:** `com/hypixel/hytale/protocol/BlockNeighbor.java`

---

#### ConnectedBlockRuleSetType

`com.hypixel.hytale.protocol.ConnectedBlockRuleSetType`

Tipos de conjuntos de reglas de bloques conectados para autoconexión de bloques como escaleras.

| Valor   | ID  | Descripción                    |
| ------- | --- | ------------------------------ |
| `Stair` | 0   | Reglas de conexión de escalera |
| `Roof`  | 1   | Reglas de conexión de techo    |

**Fuente:** `com/hypixel/hytale/protocol/ConnectedBlockRuleSetType.java`

---

### UI e Interfaz

#### Page

`com.hypixel.hytale.protocol.packets.interface_.Page`

Tipos de página de IU.

| Valor             | ID  | Descripción                       |
| ----------------- | --- | --------------------------------- |
| `None`            | 0   | Sin página                        |
| `Bench`           | 1   | Página de mesa de trabajo         |
| `Inventory`       | 2   | Página de inventario              |
| `ToolsSettings`   | 3   | Página de ajustes de herramientas |
| `Map`             | 4   | Página de mapa del mundo          |
| `MachinimaEditor` | 5   | Página de editor de machinima     |
| `ContentCreation` | 6   | Página de creación de contenido   |
| `Custom`          | 7   | Página personalizada              |

**Fuente:** `com/hypixel/hytale/protocol/packets/interface_/Page.java`

---

#### HudComponent

`com.hypixel.hytale.protocol.packets.interface_.HudComponent`

Componentes del HUD (Heads-Up Display) que pueden mostrarse/ocultarse.

| Valor                              | ID  | Descripción                            |
| ---------------------------------- | --- | -------------------------------------- |
| `Hotbar`                           | 0   | Barra de acceso rápido                 |
| `StatusIcons`                      | 1   | Iconos de efectos de estado            |
| `Reticle`                          | 2   | Retícula/Punto de mira                 |
| `Chat`                             | 3   | Ventana de chat                        |
| `Requests`                         | 4   | Notificaciones de solicitud            |
| `Notifications`                    | 5   | Notificaciones generales               |
| `KillFeed`                         | 6   | Registro de muertes                    |
| `InputBindings`                    | 7   | Pistas de vinculación de entrada       |
| `PlayerList`                       | 8   | Lista de jugadores (Tab)               |
| `EventTitle`                       | 9   | Visualización de título de evento      |
| `Compass`                          | 10  | Brújula                                |
| `ObjectivePanel`                   | 11  | Panel de objetivos/misiones            |
| `PortalPanel`                      | 12  | Panel de portal                        |
| `BuilderToolsLegend`               | 13  | Leyenda de herramientas de constructor |
| `Speedometer`                      | 14  | Indicador de velocidad                 |
| `UtilitySlotSelector`              | 15  | Selector de ranura de utilidad         |
| `BlockVariantSelector`             | 16  | Selector de variante de bloque         |
| `BuilderToolsMaterialSlotSelector` | 17  | Selector de ranura de material         |
| `Stamina`                          | 18  | Barra de energía (stamina)             |
| `AmmoIndicator`                    | 19  | Indicador de munición                  |
| `Health`                           | 20  | Barra de salud                         |
| `Mana`                             | 21  | Barra de maná                          |
| `Oxygen`                           | 22  | Barra de oxígeno                       |
| `Sleep`                            | 23  | Indicador de sueño                     |

**Fuente:** `com/hypixel/hytale/protocol/packets/interface_/HudComponent.java`

---

#### WindowType

`com.hypixel.hytale.protocol.packets.window.WindowType`

Tipos de ventanas (contenedores/IU).

| Valor                | ID  | Descripción                   |
| -------------------- | --- | ----------------------------- |
| `Container`          | 0   | Contenedor genérico           |
| `PocketCrafting`     | 1   | Fabricación de bolsillo (2x2) |
| `BasicCrafting`      | 2   | Basic crafting bench          |
| `DiagramCrafting`    | 3   | Diagram crafting              |
| `StructuralCrafting` | 4   | Structural crafting           |
| `Processing`         | 5   | Processing (furnace, etc.)    |
| `Memories`           | 6   | Memories/knowledge system     |

**Source:** `com/hypixel/hytale/protocol/packets/window/WindowType.java`

---

### Herramientas de Constructor

#### BrushShape

`com.hypixel.hytale.protocol.packets.buildertools.BrushShape`

Formas de pincel disponibles para herramientas de construcción.

| Valor             | ID  | Descripción                 |
| ----------------- | --- | --------------------------- |
| `Cube`            | 0   | Forma de cubo               |
| `Sphere`          | 1   | Forma de esfera             |
| `Cylinder`        | 2   | Forma de cilindro           |
| `Cone`            | 3   | Forma de cono               |
| `InvertedCone`    | 4   | Forma de cono invertido     |
| `Pyramid`         | 5   | Forma de pirámide           |
| `InvertedPyramid` | 6   | Forma de pirámide invertida |
| `Dome`            | 7   | Cúpula (media esfera)       |
| `InvertedDome`    | 8   | Cúpula invertida            |
| `Diamond`         | 9   | Forma de diamante           |
| `Torus`           | 10  | Forma de toro (dona)        |

**Fuente:** `com/hypixel/hytale/protocol/packets/buildertools/BrushShape.java`

---

#### BrushOrigin

`com.hypixel.hytale.protocol.packets.buildertools.BrushOrigin`

Punto de origen para la colocación del pincel.

| Valor    | ID  | Descripción               |
| -------- | --- | ------------------------- |
| `Center` | 0   | Centro del pincel         |
| `Bottom` | 1   | Parte inferior del pincel |
| `Top`    | 2   | Parte superior del pincel |

**Fuente:** `com/hypixel/hytale/protocol/packets/buildertools/BrushOrigin.java`

---

#### Axis

`com.hypixel.hytale.protocol.packets.buildertools.Axis`

Ejes de coordenadas.

| Valor | ID  | Descripción          |
| ----- | --- | -------------------- |
| `X`   | 0   | Eje X (Este-Oeste)   |
| `Y`   | 1   | Eje Y (Arriba-Abajo) |
| `Z`   | 2   | Eje Z (Norte-Sur)    |

**Fuente:** `com/hypixel/hytale/protocol/packets/buildertools/Axis.java`

---

### Física y Fuerzas

#### ApplyForceState

`com.hypixel.hytale.protocol.ApplyForceState`

Estados para la aplicación de fuerza (retroceso, habilidades, etc.).

| Valor       | ID  | Descripción                   |
| ----------- | --- | ----------------------------- |
| `Waiting`   | 0   | Esperando para aplicar fuerza |
| `Ground`    | 1   | Activado al tocar el suelo    |
| `Collision` | 2   | Activado en colisión          |
| `Timer`     | 3   | Activado tras temporizador    |

**Fuente:** `com/hypixel/hytale/protocol/ApplyForceState.java`

---

#### CollisionType

`com.hypixel.hytale.protocol.CollisionType`

Tipos de detección de colisión.

| Valor  | ID  | Descripción                               |
| ------ | --- | ----------------------------------------- |
| `Hard` | 0   | Colisión dura (bloquea movimiento)        |
| `Soft` | 1   | Colisión suave (activa eventos solamente) |

**Fuente:** `com/hypixel/hytale/protocol/CollisionType.java`

---

#### RaycastMode

`com.hypixel.hytale.protocol.RaycastMode`

Modos para raycasting (proyectiles, línea de visión, etc.).

| Valor          | ID  | Descripción                               |
| -------------- | --- | ----------------------------------------- |
| `FollowMotion` | 0   | Raycast sigue la dirección del movimiento |
| `FollowLook`   | 1   | Raycast sigue la dirección de la mirada   |

**Fuente:** `com/hypixel/hytale/protocol/RaycastMode.java`

---

### Sistema de Entidades

#### EntityPart

`com.hypixel.hytale.protocol.EntityPart`

Partes de una entidad que pueden ser referenciadas.

| Valor           | ID  | Descripción               |
| --------------- | --- | ------------------------- |
| `Self`          | 0   | La entidad misma          |
| `Entity`        | 1   | Otra entidad              |
| `PrimaryItem`   | 2   | Ítem principal sostenido  |
| `SecondaryItem` | 3   | Ítem secundario sostenido |

**Fuente:** `com/hypixel/hytale/protocol/EntityPart.java`

---

#### EntityStatOp

`com.hypixel.hytale.protocol.EntityStatOp`

Operaciones en estadísticas de entidad.

| Valor            | ID  | Descripción                   |
| ---------------- | --- | ----------------------------- |
| `Init`           | 0   | Inicializar estadística       |
| `Remove`         | 1   | Eliminar estadística          |
| `PutModifier`    | 2   | Añadir un modificador         |
| `RemoveModifier` | 3   | Eliminar un modificador       |
| `Add`            | 4   | Añadir al valor               |
| `Set`            | 5   | Establecer valor directamente |
| `Minimize`       | 6   | Establecer al mínimo          |
| `Maximize`       | 7   | Establecer al máximo          |
| `Reset`          | 8   | Restablecer a predeterminado  |

**Fuente:** `com/hypixel/hytale/protocol/EntityStatOp.java`

---

#### AttachedToType

`com.hypixel.hytale.protocol.AttachedToType`

Tipos de adjunto para efectos/partículas.

| Valor         | ID  | Descripción              |
| ------------- | --- | ------------------------ |
| `LocalPlayer` | 0   | Adjunto al jugador local |
| `EntityId`    | 1   | Adjunto a entidad por ID |
| `None`        | 2   | No adjunto               |

**Fuente:** `com/hypixel/hytale/protocol/AttachedToType.java`

---

#### EntityMatcherType

`com.hypixel.hytale.protocol.EntityMatcherType`

Tipos de coincidencia de entidad para objetivos.

| Valor               | ID  | Descripción                        |
| ------------------- | --- | ---------------------------------- |
| `Server`            | 0   | Coincidencia del lado del servidor |
| `VulnerableMatcher` | 1   | Coincidir entidades vulnerables    |
| `Player`            | 2   | Coincidir solo jugadores           |

**Fuente:** `com/hypixel/hytale/protocol/EntityMatcherType.java`

---

#### Attitude

`com.hypixel.hytale.server.core.asset.type.attitude.Attitude`

Actitud/relación de NPC hacia objetivos.

| Valor      | Descripción                |
| ---------- | -------------------------- |
| `IGNORE`   | Ignora al objetivo         |
| `HOSTILE`  | Hostil hacia el objetivo   |
| `NEUTRAL`  | Neutral hacia el objetivo  |
| `FRIENDLY` | Amistoso hacia el objetivo |
| `REVERED`  | Venera al objetivo         |

**Fuente:** `com/hypixel/hytale/server/core/asset/type/attitude/Attitude.java`

---

### Cosméticos y Personaje

#### BodyType

`com.hypixel.hytale.server.core.cosmetics.BodyType`

Tipos de cuerpo de personaje.

| Valor       | Descripción              |
| ----------- | ------------------------ |
| `Masculine` | Tipo de cuerpo masculino |
| `Feminine`  | Tipo de cuerpo femenino  |

**Fuente:** `com/hypixel/hytale/server/core/cosmetics/BodyType.java`

---

#### CosmeticType

`com.hypixel.hytale.server.core.cosmetics.CosmeticType`

Tipos de personalizaciones cosméticas disponibles.

| Valor                  | Descripción                              |
| ---------------------- | ---------------------------------------- |
| `EMOTES`               | Emotes/gestos                            |
| `SKIN_TONES`           | Opciones de tono de piel                 |
| `EYE_COLORS`           | Opciones de color de ojos                |
| `GRADIENT_SETS`        | Conjuntos de degradado de color          |
| `BODY_CHARACTERISTICS` | Características del cuerpo               |
| `UNDERWEAR`            | Ropa interior                            |
| `EYEBROWS`             | Estilos de cejas                         |
| `EARS`                 | Estilos de orejas                        |
| `EYES`                 | Estilos de ojos                          |
| `FACE`                 | Estilos de cara                          |
| `MOUTHS`               | Estilos de boca                          |
| `FACIAL_HAIR`          | Estilos de vello facial                  |
| `PANTS`                | Pantalones                               |
| `OVERPANTS`            | Cubrepantalones                          |
| `UNDERTOPS`            | Camisetas interiores                     |
| `OVERTOPS`             | Camisetas exteriores                     |
| `HAIRCUTS`             | Estilos de corte de pelo                 |
| `SHOES`                | Zapatos                                  |
| `HEAD_ACCESSORY`       | Accesorios de cabeza                     |
| `FACE_ACCESSORY`       | Accesorios de cara                       |
| `EAR_ACCESSORY`        | Accesorios de oreja                      |
| `GLOVES`               | Guantes                                  |
| `CAPES`                | Capas                                    |
| `SKIN_FEATURES`        | Características de la piel (pecas, etc.) |

**Fuente:** `com/hypixel/hytale/server/core/cosmetics/CosmeticType.java`

---

#### PlayerSkinPartType

`com.hypixel.hytale.server.core.cosmetics.PlayerSkinPartType`

Tipos de partes de la piel del jugador.

| Valor           | Descripción            |
| --------------- | ---------------------- |
| `Eyes`          | Ojos                   |
| `Ears`          | Orejas                 |
| `Mouth`         | Boca                   |
| `Eyebrows`      | Cejas                  |
| `Haircut`       | Corte de pelo          |
| `FacialHair`    | Vello facial           |
| `Pants`         | Pantalones             |
| `Overpants`     | Cubrepantalones        |
| `Undertops`     | Camisetas interiores   |
| `Overtops`      | Camisetas exteriores   |
| `Shoes`         | Zapatos                |
| `HeadAccessory` | Accesorio de cabeza    |
| `FaceAccessory` | Accesorio de cara      |
| `EarAccessory`  | Accesorio de oreja     |
| `SkinFeature`   | Característica de piel |
| `Gloves`        | Guantes                |

**Fuente:** `com/hypixel/hytale/server/core/cosmetics/PlayerSkinPartType.java`

---

### Combate

#### DamageClass

`com.hypixel.hytale.server.core.modules.interaction.interaction.config.server.combat.DamageClass`

Clasificaciones de tipos de daño.

| Valor       | Descripción                      |
| ----------- | -------------------------------- |
| `UNKNOWN`   | Daño desconocido/sin clasificar  |
| `LIGHT`     | Daño de ataque ligero            |
| `CHARGED`   | Daño de ataque cargado           |
| `SIGNATURE` | Daño de habilidad especial/firma |

**Fuente:** `com/hypixel/hytale/server/core/modules/interaction/interaction/config/server/combat/DamageClass.java`

---

### Sistema de Plugins

#### PluginState

`com.hypixel.hytale.server.core.plugin.PluginState`

Estados del ciclo de vida del plugin.

| Valor      | Descripción               |
| ---------- | ------------------------- |
| `NONE`     | Estado inicial            |
| `SETUP`    | Configurando              |
| `START`    | Iniciando                 |
| `ENABLED`  | Ejecutándose y habilitado |
| `SHUTDOWN` | Apagándose                |
| `DISABLED` | Deshabilitado             |

**Fuente:** `com/hypixel/hytale/server/core/plugin/PluginState.java`

---

### Red

#### TransportType

`com.hypixel.hytale.server.core.io.transport.TransportType`

Protocolos de transporte de red.

| Valor  | Descripción                    |
| ------ | ------------------------------ |
| `TCP`  | Protocolo TCP                  |
| `QUIC` | Protocolo QUIC (basado en UDP) |

**Fuente:** `com/hypixel/hytale/server/core/io/transport/TransportType.java`

---

### Sistema de Prefabs

#### PrefabRotation

`com.hypixel.hytale.server.core.prefab.PrefabRotation`

Ángulos de rotación para colocación de prefabs.

| Valor          | Rotación   | Descripción                  |
| -------------- | ---------- | ---------------------------- |
| `ROTATION_0`   | 0 grados   | Sin rotación                 |
| `ROTATION_90`  | 90 grados  | Cuarto de vuelta horario     |
| `ROTATION_180` | 180 grados | Media vuelta                 |
| `ROTATION_270` | 270 grados | Cuarto de vuelta antihorario |

**Fuente:** `com/hypixel/hytale/server/core/prefab/PrefabRotation.java`

---

### Miscelánea

#### AccumulationMode

`com.hypixel.hytale.protocol.AccumulationMode`

Modos para acumular/combinar valores.

| Valor     | ID  | Descripción                   |
| --------- | --- | ----------------------------- |
| `Set`     | 0   | Reemplazar con nuevo valor    |
| `Sum`     | 1   | Añadir al valor existente     |
| `Average` | 2   | Promediar con valor existente |

**Fuente:** `com/hypixel/hytale/protocol/AccumulationMode.java`

---

#### Phobia

`com.hypixel.hytale.protocol.Phobia`

Filtros de fobia de accesibilidad.

| Valor           | ID  | Descripción                |
| --------------- | --- | -------------------------- |
| `None`          | 0   | Sin filtro de fobia        |
| `Arachnophobia` | 1   | Filtro de arañas/arácnidos |

**Fuente:** `com/hypixel/hytale/protocol/Phobia.java`

**Uso:** Este enum se utiliza para características de accesibilidad, permitiendo a los jugadores habilitar filtros que modifican o reemplazan contenido que podría desencadenar fobias.

---

#### AmbienceTransitionSpeed

`com.hypixel.hytale.protocol.AmbienceTransitionSpeed`

Velocidad de transición de sonido/visual ambiental.

| Valor     | ID  | Descripción                            |
| --------- | --- | -------------------------------------- |
| `Default` | 0   | Velocidad de transición predeterminada |
| `Fast`    | 1   | Transición rápida                      |
| `Instant` | 2   | Transición instantánea                 |

**Fuente:** `com/hypixel/hytale/protocol/AmbienceTransitionSpeed.java`

---

## Referencia de Paquetes Fuente Actualizada

| Paquete                                               | Contenido                                       |
| ----------------------------------------------------- | ----------------------------------------------- |
| `com.hypixel.hytale.protocol`                         | Enums de protocolo y tipos de datos             |
| `com.hypixel.hytale.protocol.packets.connection`      | Paquetes relacionados con la conexión           |
| `com.hypixel.hytale.protocol.packets.setup`           | Paquetes de configuración (WorldSettings)       |
| `com.hypixel.hytale.protocol.packets.interface_`      | Paquetes de UI/Interfaz y enums                 |
| `com.hypixel.hytale.protocol.packets.window`          | Paquetes de ventana/contenedor                  |
| `com.hypixel.hytale.protocol.packets.buildertools`    | Paquetes de herramientas de constructor y enums |
| `com.hypixel.hytale.server.core.permissions`          | Sistema de permisos                             |
| `com.hypixel.hytale.server.core.permissions.provider` | Proveedores de permisos                         |
| `com.hypixel.hytale.server.core.universe.world`       | Gestión del mundo                               |
| `com.hypixel.hytale.server.core.asset.type.gameplay`  | Activos de configuración de jugabilidad         |
| `com.hypixel.hytale.server.core.cosmetics`            | Sistema de cosméticos                           |
| `com.hypixel.hytale.server.core.inventory`            | Sistema de inventario                           |
| `com.hypixel.hytale.server.core.plugin`               | Sistema de plugins                              |
| `com.hypixel.hytale.server.core.prefab`               | Sistema de prefabs                              |
| `com.hypixel.hytale.server.core.io.transport`         | Transporte de red                               |

---

_Documentación generada desde código del servidor Hytale descompilado._
