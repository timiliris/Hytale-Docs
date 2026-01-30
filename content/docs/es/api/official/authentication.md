---
id: authentication
title: Autenticación de la API
sidebar_label: Autenticación
sidebar_position: 2
---

# Autenticación de la API

Hytale utiliza **OAuth 2.0** para la autenticación del servidor, siguiendo las especificaciones RFC 6749 y RFC 8628.

## Puntos Finales Públicos

Estos puntos finales no requieren autenticación:

- `/blog/post/published` - Listar publicaciones de blog publicadas
- `/blog/post/slug/{slug}` - Obtener una publicación específica
- `/blog/post/archive/{year}/{month}/` - Publicaciones archivadas
- `/job/listing` - Listados de ofertas de trabajo

## Autenticación del Servidor (OAuth 2.0)

Los operadores de servidores usan OAuth 2.0 para obtener tokens que autorizan a los servidores a crear sesiones de juego.

### Especificaciones de los Tokens

| Tipo de Token | TTL | Refresco |
|------------|-----|---------|
| **Sesión de Juego** | 1 hora | Mediante token de refresco |
| **Token de Refresco** | 30 días | Mediante `/oauth2/token` |

Los tokens se refrescan automáticamente **5 minutos antes de expirar** en el modo `EXTERNAL_SESSION`.

### Métodos de Autenticación

#### Método 1: Autorización de Dispositivo (Acceso por Consola)

Para servidores con acceso a la consola:

```bash
# En la consola del servidor
/auth login device
```

El usuario visita `https://accounts.hytale.com/device` e introduce el código mostrado.

#### Método 2: Sin Interfaz/Automatizado

Para configuraciones automatizadas sin consola:

```http
POST https://oauth.accounts.hytale.com/oauth2/device/auth
Content-Type: application/x-www-form-urlencoded

client_id=tu_client_id
scope=server
```

### Refresco de Token

```http
POST https://oauth.accounts.hytale.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
refresh_token=tu_token_de_refresco
```

## Límites del Servidor

| Límite | Valor |
|-------|-------|
| **Servidores por licencia** | 100 |
| **Para más capacidad** | Compra licencias adicionales o solicita una cuenta de Proveedor de Servidores |

## Autenticación de Terceros

### HyAuth

[HyAuth](https://www.hyauth.com/) es un servicio de autenticación independiente para Hytale:

- Tiempo de respuesta de la API < 100ms
- Sin almacenamiento de datos (eliminación inmediata)
- Ámbitos de permiso flexibles

**Datos Disponibles (por ámbito):**
- Nombres de usuario
- Correo electrónico
- Ediciones del juego
- UUIDs de perfil

**Flujo Básico:**

```http
POST https://hyauth.com/api/auth/create
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "scopes": ["username", "uuid"],
  "redirect_url": "https://tu-servidor.com/callback"
}
```

:::warning
HyAuth NO está afiliado con Hypixel Studios o Hytale.
:::

## Documentación Oficial

- [Guía de Autenticación para Proveedores de Servidores](https://support.hytale.com/hc/en-us/articles/45328341414043-Server-Provider-Authentication-Guide)
- [Manual del Servidor de Hytale](https://support.hytale.com/hc/en-us/articles/45326769420827-Hytale-Server-Manual)