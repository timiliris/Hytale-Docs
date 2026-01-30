---
id: ui-troubleshooting
title: Solución de Problemas de IU
sidebar_label: Solución de Problemas
sidebar_position: 9
description: Guía de depuración para errores de IU personalizada de Hytale (X roja, bloqueos del analizador, etc.)
---

# Guía de Solución de Problemas de IU de Hytale

Esta guía cubre la depuración avanzada para el desarrollo de IU personalizada, enfocándose en peculiaridades específicas del motor y escenarios de bloqueo comunes.

## 1. El Bloqueo "Tipo de Nodo Desconocido"

**Registro de Error:**
`HytaleClient.Interface.UI.Markup.TextParser+TextParserException: Failed to parse file ... – Unknown node type: Image`

**Por qué sucede:**
El cliente de Hytale en ciertas versiones no soporta la etiqueta `<Image>` como un elemento independiente, o solo la soporta dentro de contenedores padres específicos.

**La Solución:**
Estandariza tu IU para usar **Grupos con Fondos** en lugar de nodos Image. Esto es funcionalmente idéntico pero seguro para el analizador.

- ❌ **Evitar:** `Image { TexturePath: "..."; }`
- ✅ **Usar:** `Group { Background: ( TexturePath: "..." ); }`

## 2. El Bucle de Bloqueo "Falló al Aplicar IU Personalizada"

**Síntomas:**

- El juego tartamudea cada X segundos.
- El cliente finalmente se desconecta con "Failed to load CustomUI documents".
- Spam de consola de errores de paquetes.

**Por qué sucede:**
Tu código Java está reenviando el archivo de IU completo (`builder.append(...)`) en cada tick de actualización (e.g., dentro de una tarea programada). Recargar el DOM repetidamente corrompe el estado de la IU del cliente.

**La Solución:**
Implementa el **Patrón Carga-Actualización**:

1.  **Inicializar:** Enviar la estructura una vez.
2.  **Actualizar:** Enviar solo cambios de variables usando `update(false, builder)`.

## 3. La "X Roja" (Fallo de Resolución de Assets)

**Síntomas:**

- La IU carga físicamente pero todas las texturas son reemplazadas por grandes cruces rojas.

**Por qué sucede:**
El cliente no puede encontrar el archivo en la ruta especificada. Esto es usualmente un problema de contexto de ruta.

**La Solución:**

1.  **Localidad:** Mueve los assets a una subcarpeta (e.g., `Assets/`) **directamente dentro** de la carpeta que contiene tu archivo `.ui`.
2.  **Rutas Relativas:** Referéncialos simplemente como `"Assets/MyTexture.png"`.
3.  **Manifiesto:** Asegúrate de que `manifest.json` tiene `"IncludesAssetPack": true`.

## 4. Texto No Actualizándose

**Síntomas:**

- Llamas a `builder.set("#ID.Text", "Nuevo Valor")` pero nada cambia en pantalla.

**Por qué sucede:**

- ID incorrecto en el archivo `.ui` (¡los IDs distinguen mayúsculas y minúsculas!).
- Estás re-adjuntando el archivo (lo que reinicia valores) en lugar de actualizarlo.

**La Solución:**

- Verifica la coincidencia exacta de ID (`#Nombre` vs `#nombre`).
- Asegúrate de que estás llamando a `this.update(false, builder)`.
