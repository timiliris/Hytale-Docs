---
id: overview
title: Vue d'ensemble de l'administration des serveurs
sidebar_label: Vue d'ensemble
sidebar_position: 1
description: Guide pour configurer et gérer les serveurs Hytale
---

# Vue d'ensemble de l'administration des serveurs

Cette section couvre tout ce que vous devez savoir sur l'hébergement et la gestion des serveurs Hytale. L'exploitation de vos propres serveurs est possible dès le premier jour de l'accès anticipé ([Source](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)).

## Architecture

Hytale utilise une **architecture orientée serveur** où tout le contenu du jeu réside sur le serveur :

- Même le mode solo fonctionne via un serveur local
- Les clients se connectent sans installer de mods
- Le serveur diffuse tout le contenu automatiquement
- Toute la logique du jeu s'exécute côté serveur

> "Hypixel Studios a choisi Java pour les serveurs Hytale car leur équipe backend est très à l'aise pour écrire du Java haute performance, ce qui leur a permis d'optimiser considérablement le code serveur."
> — [Server Technology Overview](https://hytale.com/news/2019/1/an-overview-of-hytales-server-technology)

### Détails techniques

| Spécification | Valeur |
|--------------|-------|
| Langage serveur | Java |
| Langage client | C# |
| Protocole | QUIC |
| Tick Rate | 30 TPS (par défaut) |
| Version Java | **Java 25** requis |
| Gradle | 9.2.0 (pour le développement de plugins) |

### Disponibilité du code source

Le serveur n'est **pas obfusqué**, vous permettant de le décompiler pour comprendre les systèmes internes. Hypixel Studios prévoit de publier le code source complet du serveur **1-2 mois après le lancement** ([Source](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)).

## Configuration requise

### Considérations de performance

La **distance de vue** est le facteur le plus important pour les performances du client et du serveur. Doubler la distance de vue (par exemple, de 192 à 384 blocs) quadruple la quantité de données que le serveur doit gérer.

### Minimum (petit serveur, ~10-16 joueurs)

| Composant | Exigence |
|-----------|-------------|
| CPU | 4 cœurs, 2GHz+ (vitesse > nombre de cœurs) |
| RAM | 4-6 Go |
| Stockage | 50 Go SSD NVMe |
| Java | **Java 25** |
| Réseau | 100 Mbps en upload |

### Recommandé (serveur moyen, ~20-30 joueurs)

| Composant | Exigence |
|-----------|-------------|
| CPU | 6+ cœurs, haute fréquence |
| RAM | 8-12 Go |
| Stockage | 100 Go SSD NVMe |
| Réseau | 500 Mbps en upload |

### Grands serveurs (50+ joueurs)

| Composant | Exigence |
|-----------|-------------|
| CPU | 8+ cœurs, haute performance mono-thread |
| RAM | 16-32 Go |
| Stockage | 200 Go SSD NVMe |
| Réseau | 1 Gbps en upload |

:::tip Performance du stockage
Le chargement et la génération des mondes dépendent fortement de la vitesse du disque. Les SSD NVMe offrent les meilleurs résultats et aident à éviter les saccades lorsque les joueurs explorent de nouvelles zones. Évitez les disques durs traditionnels.
:::

## Démarrage rapide

1. **Téléchargez** les fichiers du serveur depuis [hytale.com](https://hytale.com)
2. **Configurez** votre fichier `server.properties`
3. **Ouvrez les ports** (par défaut : 5520 UDP)
4. **Démarrez** le serveur

```bash
java -Xms4G -Xmx8G -jar hytale-server.jar
```

[Guide d'installation détaillé →](/docs/servers/setup/installation)

## Configuration du serveur

### Paramètres principaux

```json
{
  "Version": 4,
  "ServerName": "Mon Serveur Hytale",
  "MOTD": "",
  "Password": "",
  "MaxPlayers": 100,
  "MaxViewRadius": 12,
  "AutoUpdate": {
    "Mode": "DISABLED",
    "ScheduledTime": "04:00"
  },
  "Backup": {
    "Enabled": false,
    "IntervalMinutes": 60,
    "MaxBackups": 5
  },
  "Defaults": {
    "World": "Orbis",
    "GameMode": "Adventure"
  }
}
```

#### Système de mise à jour automatique

Le serveur supporte trois modes de mise à jour automatique via `AutoUpdate.Mode` :

| Mode | Description |
|------|-------------|
| `DISABLED` | Pas de mise à jour automatique (par défaut) |
| `WHEN_EMPTY` | Met à jour quand aucun joueur n'est connecté |
| `SCHEDULED` | Met à jour à l'heure configurée dans `ScheduledTime` (format 24h) |

[Référence complète de configuration →](/docs/servers/setup/configuration)

## Administration

### Tâches principales

- [**Commandes**](/docs/servers/administration/commands) - Commandes console et en jeu
- [**Permissions**](/docs/servers/administration/permissions) - Système de permissions des joueurs
- [**Whitelist**](/docs/servers/administration/whitelist) - Contrôle d'accès

### Considérations de sécurité

- Configurez les règles du pare-feu (UDP 5520)
- Utilisez la whitelist pour les serveurs privés
- Sauvegardes régulières
- Protection DDoS pour les serveurs publics
- Définissez les tokens d'authentification via les variables d'environnement : `HYTALE_SERVER_SESSION_TOKEN` et `HYTALE_SERVER_IDENTITY_TOKEN`

:::info Documentation technique Update 3
Pour des détails approfondis sur les systèmes internes du serveur introduits et améliorés dans l'Update 3, voir la [documentation Update 3](/docs/servers/update-3) couvrant la génération du monde, le framework ECS, le réseau multi-canaux et plus encore.
:::

## Modding et plugins

Les serveurs peuvent exécuter :

- **Plugins Java** (fichiers `.jar` dans `/plugins/`)
- **Data Packs** (contenu JSON dans `/mods/`)
- **Ressources graphiques** (modèles, textures, sons)

```
/hytale-server/
├── plugins/        # Plugins Java
├── mods/           # Packs de contenu
├── config/         # Configuration
├── worlds/         # Données des mondes
└── logs/           # Logs du serveur
```

[Guide de développement de plugins →](/docs/modding/plugins/overview)

## Options d'hébergement

| Option | Avantages | Inconvénients |
|--------|------|------|
| **Auto-hébergé** | Contrôle total, économique | Nécessite des connaissances techniques |
| **VPS** | Bon équilibre contrôle/facilité | Coût mensuel |
| **Hébergeur de jeux** | Configuration facile, géré | Moins de contrôle, coût plus élevé |

[Guide d'hébergement →](/docs/servers/hosting/self-hosting)

## Déploiement avec Docker

```yaml
version: '3.8'
services:
  hytale:
    image: hytale-server:latest
    ports:
      - "5520:5520/udp"
    volumes:
      - ./data:/server
    environment:
      - JAVA_OPTS=-Xms4G -Xmx8G
```

[Guide de déploiement Docker →](/docs/servers/hosting/docker)

## EULA et monétisation

### Autorisé

- Achats cosmétiques
- Dons
- Avantages de rang (non liés au gameplay)

### Interdit

- Mécaniques pay-to-win
- Vente d'avantages de gameplay
- Distribution du client

:::warning
Violer l'EULA peut entraîner la mise en liste noire du serveur. Consultez toujours les directives officielles.
:::

## Pour commencer

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'Configuration requise',
    href: '/docs/servers/setup/requirements',
    description: 'Exigences matérielles et logicielles'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Installation',
    href: '/docs/servers/setup/installation',
    description: 'Guide d installation étape par étape'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Configuration',
    href: '/docs/servers/setup/configuration',
    description: 'Configurez votre serveur'
  }} />
</div>
