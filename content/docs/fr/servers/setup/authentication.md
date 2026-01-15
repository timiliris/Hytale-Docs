---
id: authentication
title: Authentification Serveur
sidebar_label: Authentification
sidebar_position: 4
description: Guide pour authentifier votre serveur Hytale avec le reseau Hytale
---

# Authentification Serveur

Ce guide explique comment authentifier votre serveur Hytale avec le reseau Hytale, permettant aux joueurs avec des comptes Hytale de se connecter.

## Modes d'Authentification

Les serveurs Hytale supportent deux modes d'authentification :

| Mode | Description | Cas d'usage |
|------|-------------|-------------|
| `authenticated` | Le serveur verifie les joueurs via le reseau Hytale | Serveurs publics, production |
| `offline` | Aucune authentification requise | Jeu LAN, tests, developpement |

### Configurer le Mode

Definissez le mode d'authentification au demarrage du serveur :

```bash
# Mode authentifie (defaut, recommande pour serveurs publics)
java -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode authenticated

# Mode hors-ligne (pour tests/LAN)
java -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode offline
```

:::warning Mode Hors-ligne
En mode hors-ligne, n'importe qui peut se connecter avec n'importe quel pseudo. Utilisez ce mode uniquement pour des tests prives ou des parties LAN ou vous faites confiance a tous les joueurs.
:::

## Flux d'Authentification du Serveur

En mode `authenticated`, votre serveur doit s'authentifier avec le reseau Hytale avant que les joueurs puissent se connecter.

### Etape 1 : Demarrer le Serveur

Demarrez votre serveur en mode authentifie :

```bash
java -Xms8G -Xmx8G -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode authenticated
```

Au premier lancement, le serveur affichera :
```
No server tokens configured
Server session token not available
```

### Etape 2 : Initier l'Authentification par Appareil

Dans la console du serveur, executez :

```
/auth login device
```

Le serveur affichera un code et une URL de verification :

```
Enter code: ABCD1234
Visit: https://oauth.accounts.hytale.com/oauth2/device/verify
Or visit: https://oauth.accounts.hytale.com/oauth2/device/verify?user_code=ABCD1234
expires in 600 seconds
```

### Etape 3 : Autoriser sur le Site Hytale

1. Ouvrez l'URL de verification dans votre navigateur
2. Connectez-vous avec votre compte Hytale (doit etre le proprietaire du serveur)
3. Entrez le code affiche dans la console
4. Approuvez l'authentification du serveur

### Etape 4 : Activer la Persistance du Token

Une fois authentifie, activez la persistance pour que le token survive aux redemarrages :

```
/auth persistence Encrypted
```

Le serveur confirmera :
```
Authentication successful!
Server authenticated
Auth persistence enabled
```

:::tip Modes de Persistance
- `Encrypted` - Token stocke de maniere chiffree (recommande)
- `PlainText` - Token stocke en texte clair (non recommande)
- `None` - Token non persiste (doit se re-authentifier apres redemarrage)
:::

## Commandes d'Authentification

| Commande | Description |
|----------|-------------|
| `/auth login device` | Demarre le flux d'authentification par code |
| `/auth status` | Verifie le statut d'authentification actuel |
| `/auth persistence <mode>` | Configure la persistance (Encrypted/PlainText/None) |
| `/auth logout` | Revoque l'authentification du serveur |

## Authentification Docker

En Docker, le processus d'authentification est identique mais les commandes sont envoyees via Docker :

### Option 1 : Docker Attach

```bash
# S'attacher au conteneur (Ctrl+P, Ctrl+Q pour se detacher)
docker attach hytale-server

# Puis tapez la commande
/auth login device
```

### Option 2 : Docker Exec

```bash
# Envoyer la commande directement
docker exec -i hytale-server sh -c 'echo "/auth login device" > /proc/1/fd/0'
```

### Docker Compose avec Authentification

```yaml
version: '3.8'
services:
  hytale:
    image: eclipse-temurin:25-jdk-alpine
    container_name: hytale-server
    stdin_open: true   # Requis pour l'entree console
    tty: true          # Requis pour l'entree console
    ports:
      - "5520:5520/udp"
    volumes:
      - ./server:/server
      - ./auth:/server/auth  # Persister les tokens d'auth
    working_dir: /server
    command: >
      java -Xms8G -Xmx8G
      -XX:+UseG1GC
      -jar HytaleServer.jar
      --assets Assets.zip
      -b 0.0.0.0:5520
      --auth-mode authenticated
```

:::info Stockage des Tokens
Les tokens d'authentification sont stockes dans le repertoire du serveur (typiquement `config/` ou `auth/`). En Docker, montez ce repertoire comme volume pour persister les tokens entre les redemarrages du conteneur.
:::

## Authentification Java Direct

Pour les serveurs Java Direct (non-Docker), l'authentification est plus simple :

1. Demarrez le serveur normalement
2. Tapez les commandes directement dans la console
3. Les tokens sont stockes automatiquement dans le repertoire du serveur

### Service Systemd avec Authentification

Si vous executez en tant que service systemd, vous pouvez envoyer des commandes via la console :

```bash
# Creer un pipe nomme pour l'entree
mkfifo /tmp/hytale-console

# Fichier service utilisant le pipe
# /etc/systemd/system/hytale.service
[Unit]
Description=Hytale Server
After=network.target

[Service]
Type=simple
User=hytale
WorkingDirectory=/opt/hytale
ExecStart=/bin/bash -c 'tail -f /tmp/hytale-console | java -Xms8G -Xmx8G -jar HytaleServer.jar --assets Assets.zip -b 0.0.0.0:5520 --auth-mode authenticated'
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Envoyer des commandes :
```bash
echo "/auth login device" > /tmp/hytale-console
```

## Emplacements de Persistance des Tokens

| Configuration | Emplacement du Token |
|---------------|---------------------|
| Java Direct | `<chemin_serveur>/config/` ou `<chemin_serveur>/auth/` |
| Docker | Volume monte a `/server/config/` ou `/server/auth/` |
| Systemd | Meme que Java Direct, dans WorkingDirectory |

## Depannage

### "No server tokens configured"
Le serveur n'a pas encore ete authentifie. Executez `/auth login device` pour demarrer l'authentification.

### "Device code expired"
La fenetre de 600 secondes a expire. Executez `/auth login device` a nouveau pour obtenir un nouveau code.

### "Authentication failed"
- Assurez-vous que votre compte Hytale possede la licence serveur
- Verifiez votre connexion internet
- Verifiez que le service OAuth Hytale est disponible

### "Token invalid after restart"
La persistance n'etait pas activee. Apres l'authentification, executez :
```
/auth persistence Encrypted
```

### Docker : Impossible d'envoyer des commandes
Assurez-vous que votre conteneur a `stdin_open: true` et `tty: true` dans docker-compose.yml, ou utilisez les flags `-it` avec `docker run`.

## Bonnes Pratiques de Securite

1. **Utilisez la persistance chiffree** - Toujours utiliser le mode `Encrypted` pour le stockage des tokens
2. **Protegez les fichiers serveur** - Restreignez l'acces au repertoire du serveur contenant les tokens
3. **Utilisez le mode authentifie** - N'utilisez `offline` que pour les tests
4. **Volume auth separe** - En Docker, considerez un volume separe pour les tokens avec des permissions restreintes

## Re-authentification

Si vous devez vous re-authentifier (ex: token revoque, compte change) :

```bash
# Deconnecter la session actuelle
/auth logout

# Demarrer nouvelle authentification
/auth login device

# Reactiver la persistance
/auth persistence Encrypted
```
