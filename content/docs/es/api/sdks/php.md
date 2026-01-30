---
id: php
title: SDK de PHP
sidebar_label: PHP
sidebar_position: 2
---

# SDK de PHP

SDK de PHP para la API de Hytale.

## Instalación

```bash
composer require hytale-api/sdk-php
```

## Uso

```php
use HytaleAPI\Client;

$client = new Client();
$posts = $client->blog()->getPosts();
```

## GitHub

[mTxServ/hytale-api-sdk-php](https://github.com/mTxServ/hytale-api-sdk-php)