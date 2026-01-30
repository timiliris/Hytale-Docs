---
id: javascript
title: SDK de JavaScript
sidebar_label: JavaScript
sidebar_position: 1
---

# SDK de JavaScript

SDK para Node.js y navegadores.

## Instalación

```bash
npm install @hytale-api/sdk
```

## Uso

```javascript
import { HytaleAPI } from '@hytale-api/sdk';

const api = new HytaleAPI();
const posts = await api.blog.getPosts();
```

## GitHub

[mTxServ/hytale-api-sdk-js](https://github.com/mTxServ/hytale-api-sdk-js)