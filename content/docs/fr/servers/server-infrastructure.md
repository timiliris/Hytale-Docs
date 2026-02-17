---
id: server-infrastructure
title: "Infrastructure Serveur"
sidebar_label: Infrastructure Serveur
sidebar_position: 13
description: Documentation technique de l'infrastructure du serveur Hytale - Systeme de mise a jour, configuration v4, anchor actions, authentification, stockage RocksDB, telemetrie Sentry, module console, outils de construction et nouvelles commandes.
---

# Infrastructure Serveur

Ce document fournit une reference technique complete des ajouts et modifications majeurs de l'infrastructure du serveur dans la derniere version du serveur Hytale. Il couvre le nouveau systeme de mise a jour, la configuration v4, les anchor actions, la refonte de l'authentification, le stockage RocksDB, la telemetrie Sentry, le module console, les ajouts aux outils de construction et les nouvelles commandes utilitaires.

Toutes les references de code proviennent du source decompile dans `decompiled/com/hypixel/hytale/`.

---

## Table des matieres

1. [Module de mise a jour](#1-module-de-mise-a-jour)
2. [Configuration v4](#2-configuration-v4)
3. [AnchorActionModule](#3-anchoractionmodule)
4. [Authentification](#4-authentification)
5. [Stockage RocksDB](#5-stockage-rocksdb)
6. [Telemetrie Sentry](#6-telemetrie-sentry)
7. [Module Console](#7-module-console)
8. [Ajouts aux outils de construction](#8-ajouts-aux-outils-de-construction)
9. [Autres nouvelles commandes](#9-autres-nouvelles-commandes)

---

## 1. Module de mise a jour

**Package :** `server.core.update`

Le module de mise a jour est un systeme complet de mise a jour OTA (Over-The-Air) qui permet au serveur Hytale de verifier, telecharger, preparer et appliquer automatiquement les mises a jour. Il est implemente en tant que plugin core.

### 1.1 Classe UpdateModule

**Fichier :** `server/core/update/UpdateModule.java`

Le `UpdateModule` etend `JavaPlugin` et sert d'orchestrateur principal pour toutes les fonctionnalites liees aux mises a jour. Il est enregistre en tant que plugin core avec un accesseur singleton.

#### Champs

```java
// server/core/update/UpdateModule.java, lignes 34-58
public static final PluginManifest MANIFEST = PluginManifest.corePlugin(UpdateModule.class).build();
private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();
public static final boolean KILL_SWITCH_ENABLED = SystemUtil.getEnvBoolean("HYTALE_DISABLE_UPDATES");
private static UpdateModule instance;

private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
   Thread t = new Thread(r, "UpdateChecker");
   t.setDaemon(true);
   return t;
});

private ScheduledFuture<?> updateCheckTask;
private ScheduledFuture<?> autoApplyTask;
private final AtomicReference<UpdateService.VersionManifest> latestKnownVersion = new AtomicReference<>();
private final AtomicReference<CompletableFuture<?>> activeDownload = new AtomicReference<>();
private final AtomicReference<Thread> activeDownloadThread = new AtomicReference<>();
private final AtomicBoolean downloadLock = new AtomicBoolean(false);
private final AtomicLong downloadStartTime = new AtomicLong(0L);
private final AtomicLong downloadedBytes = new AtomicLong(0L);
private final AtomicLong totalBytes = new AtomicLong(0L);
private final AtomicLong autoApplyScheduledTime = new AtomicLong(0L);
private final AtomicLong lastWarningTime = new AtomicLong(0L);
```

Decisions de conception cles :
- Tout l'etat mutable utilise des types `Atomic*` pour la securite des threads
- Le planificateur s'execute sur un seul thread daemon nomme `"UpdateChecker"`
- Le kill switch (`HYTALE_DISABLE_UPDATES`) est lu une seule fois au chargement de la classe depuis les variables d'environnement

#### Cycle de vie

**setup()** -- Enregistre l'arbre de commandes `/update`. Si le kill switch est active, enregistre un message et enregistre quand meme la commande (qui retournera un message "desactive").

**start()** -- Verifie s'il existe une mise a jour preparee precedemment (d'un telechargement anterieur non encore applique), et lance la verification periodique des mises a jour si les conditions sont remplies.

Le verificateur de mises a jour n'est active que lorsque **toutes** les conditions suivantes sont vraies :
1. Le serveur s'execute depuis un fichier JAR (pas depuis un IDE)
2. Le serveur n'est PAS en mode solo
3. La config `Update.Enabled` est `true`
4. Le patchline n'est pas `"dev"` (sauf si surcharge dans la config)
5. La structure des dossiers est valide (le repertoire parent contient `Assets.zip` et `start.sh`/`start.bat`)

**shutdown()** -- Annule les taches de verification et d'application automatique, puis arrete l'executeur.

**onServerReady()** -- Appele apres le demarrage complet du serveur. Affiche un rappel dans la console si une mise a jour preparee est en attente.

#### Suivi de la progression du telechargement

Le module suit la progression du telechargement a l'aide de compteurs atomiques. Le record `DownloadProgress` fournit le pourcentage, les octets telecharges/total et une estimation du temps restant en secondes.

#### Verrou de telechargement

Un seul telechargement peut etre actif a la fois, applique via `compareAndSet`.

#### Modes d'application automatique

Le systeme d'application automatique utilise trois modes definis dans `UpdateConfig.AutoApplyMode` :

| Mode | Comportement |
|------|-------------|
| `DISABLED` | Pas d'application automatique. L'operateur doit executer `/update apply --confirm`. |
| `WHEN_EMPTY` | Applique la mise a jour immediatement quand aucun joueur n'est en ligne. |
| `SCHEDULED` | Avertit les joueurs, attend `AutoApplyDelayMinutes` (defaut 30), puis arrete le serveur. |

Le mode **SCHEDULED** envoie des avertissements periodiques aux joueurs (toutes les 5 minutes, puis toutes les 30 secondes dans la derniere minute), et declenche un arret avec `ShutdownReason.UPDATE` a l'expiration du delai.

#### Notifications aux joueurs

Les joueurs ayant la permission `hytale.system.update.notify` recoivent des messages en jeu lorsqu'une mise a jour est disponible.

### 1.2 UpdateService

**Fichier :** `server/core/update/UpdateService.java`

Le `UpdateService` gere la communication HTTP avec le CDN account-data de Hytale pour verifier les nouvelles versions et telecharger les mises a jour.

#### Structure des repertoires

Les repertoires de staging et de sauvegarde sont toujours relatifs au parent du repertoire de travail du serveur (le dossier `Server/`) :

```
HytaleServerRoot/
  updater/
    staging/    <-- nouveaux fichiers de mise a jour extraits ici
    backup/     <-- fichiers actuels sauvegardes ici avant application
  Server/
    HytaleServer.jar
    config.json
  Assets.zip
  start.sh / start.bat
```

#### Flux de verification des mises a jour

1. Obtenir un token d'acces OAuth depuis `ServerAuthManager`
2. Demander une URL signee au service account-data (authentification bearer token)
3. Recuperer le manifeste de version JSON depuis l'URL signee
4. Decoder avec `VersionManifest.CODEC`
5. Comparer `manifest.version` avec `ManifestUtil.getImplementationVersion()`

#### Flux de telechargement

Le telechargement s'execute sur un thread daemon dedie nomme `"UpdateDownload"` :

1. Acquerir une URL signee pour `manifest.downloadUrl`
2. Telecharger en streaming vers un fichier temporaire avec verification de hash SHA-256
3. Verifier la somme de controle par rapport a `manifest.sha256`
4. Extraire le ZIP dans le repertoire de staging
5. Signaler la progression via `ProgressCallback`

Le telechargement est annulable : le thread verifie `Thread.currentThread().isInterrupted()` pendant la boucle de streaming.

#### Resolution du patchline

Priorite : Config `Patchline` puis patchline du manifeste JAR puis defaut `"release"`.

#### Mecanismes de securite

La methode `safeDeleteUpdaterDir` refuse de supprimer les repertoires qui ne sont pas dans le chemin attendu `updater/`.

### 1.3 Commandes de mise a jour

Le commande `/update` est une `AbstractCommandCollection` qui enregistre six sous-commandes :

| Sous-commande | Description |
|---------------|-------------|
| `/update check` | Verifie une nouvelle version sur le CDN du patchline |
| `/update download [--force]` | Telecharge et prepare une mise a jour. `--force` contourne la validation de la structure |
| `/update apply --confirm` | Sauvegarde les fichiers actuels et declenche l'arret pour mise a jour |
| `/update cancel` | Annule un telechargement actif et/ou supprime les fichiers prepares |
| `/update status` | Affiche la version actuelle, le patchline, la version preparee, la progression du telechargement |
| `/update patchline [value]` | Obtient ou definit le patchline de mise a jour |

**UpdateApplyCommand** est notable car il :
1. Sauvegarde `HytaleServer.jar`, `HytaleServer.aot`, `Licenses/` et `Assets.zip`
2. Execute optionnellement une sauvegarde complete du monde si `RunBackupBeforeUpdate` est active
3. Sauvegarde les fichiers de config (`config.json`, `permissions.json`, `bans.json`, `whitelist.json`)
4. Declenche `HytaleServer.get().shutdownServer(ShutdownReason.UPDATE)`

### 1.4 Variables d'environnement et Kill Switch

| Variable | Objectif |
|----------|----------|
| `HYTALE_DISABLE_UPDATES` | Booleen. Desactive completement toutes les commandes et verifications de mise a jour. |
| `HYTALE_SERVER_SESSION_TOKEN` | Utilise par le systeme d'authentification ; necessaire pour les verifications de mise a jour. |
| `HYTALE_SERVER_IDENTITY_TOKEN` | Utilise par le systeme d'authentification avec les tokens de session. |

---

## 2. Configuration v4

**Fichier :** `server/core/HytaleServerConfig.java`

### 2.1 Migration de version

La version de config a ete incrementee de 3 a 4. La logique de migration au moment du decodage gere la retrocompatibilite :
- Migration "Plugins" vers "Mods" (cle legacy v0-v2)
- Migration v3 vers v4 : `DefaultModsEnabled`
- Re-sauvegarde forcee si mise a niveau

### 2.2 Nouveaux champs en v4

#### DefaultModsEnabled

- Par defaut `true` lors de la mise a niveau depuis v3 (pour preserver le comportement existant)
- Par defaut `!SINGLEPLAYER` pour les configs fraiches
- Controle si les mods integres sont charges par defaut

#### SkipModValidationForVersion

Permet aux operateurs de passer la validation des mods pour une revision specifique du build serveur. Quand le serveur se met a jour vers une nouvelle revision, la validation est automatiquement reactivee.

### 2.3 UpdateConfig

**Fichier :** `server/core/config/UpdateConfig.java`

Tous les champs, leurs types, valeurs par defaut et documentation :

| Champ | Type | Defaut | Description |
|-------|------|--------|-------------|
| `Enabled` | `Boolean` | `true` | Active les verifications automatiques de mise a jour |
| `CheckIntervalSeconds` | `Integer` | `3600` (1 heure) | Intervalle entre les verifications automatiques |
| `NotifyPlayersOnAvailable` | `Boolean` | `true` | Notifier les joueurs en jeu quand une mise a jour est disponible |
| `Patchline` | `String` | `null` | Surcharger le patchline pour les verifications |
| `RunBackupBeforeUpdate` | `Boolean` | `true` | Executer une sauvegarde complete du monde avant d'appliquer une mise a jour |
| `BackupConfigBeforeUpdate` | `Boolean` | `true` | Sauvegarder les fichiers de config avant d'appliquer une mise a jour |
| `AutoApplyMode` | `AutoApplyMode` | `DISABLED` | Mode d'application automatique des mises a jour |
| `AutoApplyDelayMinutes` | `Integer` | `30` | Delai avant l'application automatique en mode SCHEDULED |

Exemple de section `config.json` :

```json
{
  "Update": {
    "Enabled": true,
    "CheckIntervalSeconds": 3600,
    "NotifyPlayersOnAvailable": true,
    "AutoApplyMode": "WHEN_EMPTY",
    "AutoApplyDelayMinutes": 30,
    "RunBackupBeforeUpdate": true,
    "BackupConfigBeforeUpdate": true
  }
}
```

### 2.4 BackupConfig

**Fichier :** `server/core/config/BackupConfig.java`

| Champ | Type | Defaut | Surcharge CLI |
|-------|------|--------|---------------|
| `Enabled` | `Boolean` | `false` | `--backup` (force true) |
| `FrequencyMinutes` | `Integer` | `30` | `--backup-frequency` |
| `Directory` | `String` | `null` | `--backup-directory` |
| `MaxCount` | `Integer` | `5` | `--backup-max-count` |
| `ArchiveMaxCount` | `Integer` | `5` | `--backup-archive-max-count` |

Les options CLI prennent toujours la priorite sur les valeurs du fichier de config.

---

## 3. AnchorActionModule

**Package :** `server.core.modules.anchoraction`

### 3.1 Classe du module

Le `AnchorActionModule` est un plugin core qui fournit un mecanisme RPC base sur JSON pour gerer les "anchor actions" -- des actions initiees par le client qui necessitent un traitement cote serveur. Ceci est utilise pour les elements d'interface interactifs comme les liens cliquables ou les boutons d'action.

Le registre de handlers est un `ConcurrentHashMap` indexe par nom d'action.

### 3.2 Interface Handler

```java
@FunctionalInterface
public interface AnchorActionHandler {
   void handle(@Nonnull PlayerRef var1, @Nonnull JsonObject var2);
}
```

### 3.3 API d'enregistrement

Deux surcharges de `register` sont fournies :

**Enregistrement basique** -- Le handler recoit la reference du joueur et le JSON brut.

**Enregistrement thread-safe pour le monde** -- Enveloppe le handler pour s'assurer qu'il s'execute sur le bon thread du monde.

### 3.4 Dispatch des actions

Format JSON attendu :

```json
{
  "action": "actionName",
  "param1": "value1",
  "param2": 42
}
```

### 3.5 Pattern d'utilisation (pour les developpeurs de plugins)

```java
// Exemple d'enregistrement dans la methode setup() d'un plugin
AnchorActionModule.get().register("mymod:openShop", (playerRef, data) -> {
    String shopId = data.get("shopId").getAsString();
    // Gerer l'ouverture de la boutique pour le joueur
});

// Variante thread-safe pour le monde
AnchorActionModule.get().register("mymod:placeBlock",
    (playerRef, ref, store, data) -> {
        // Ceci s'execute sur le thread du monde -- modification du monde securisee
        int x = data.get("x").getAsInt();
        int y = data.get("y").getAsInt();
        int z = data.get("z").getAsInt();
        // ...
    });

// Nettoyage
AnchorActionModule.get().unregister("mymod:openShop");
```

---

## 4. Authentification

**Package :** `server.core.auth`

### 4.1 ProfileServiceClient (Nouveau)

Un nouveau client HTTP pour rechercher des profils de jeu publics par UUID ou nom d'utilisateur, communiquant avec `https://account-data.hytale.com`.

Endpoints REST :
- `GET /profile/uuid/{uuid}` -- Retourne le profil par UUID
- `GET /profile/username/{username}` -- Retourne le profil par nom d'utilisateur (encode URL)

Toutes les requetes incluent :
- `Authorization: Bearer {token}`
- `User-Agent: HytaleServer/{version}`
- Timeout de 30 secondes

### 4.2 SessionServiceClient

Le client du service de session communique avec `https://sessions.hytale.com` et fournit :

| Methode | Endpoint | Objectif |
|---------|----------|----------|
| `requestAuthorizationGrantAsync` | `POST /server-join/auth-grant` | Echanger le token d'identite contre un grant d'autorisation |
| `exchangeAuthGrantForTokenAsync` | `POST /server-join/auth-token` | Echanger le grant + empreinte x509 contre un token d'acces |
| `getJwks` | `GET /.well-known/jwks.json` | Recuperer JWKS pour la validation des tokens |
| `getGameProfiles` | `GET .../my-account/get-profiles` | Recuperer les profils de jeu pour un compte |
| `createGameSession` | `POST /game-session/new` | Creer une nouvelle session de jeu |
| `refreshSessionAsync` | `POST /game-session/refresh` | Rafraichir une session existante |
| `terminateSession` | `DELETE /game-session` | Terminer une session (utilise a l'arret) |

Notable : L'executeur HTTP utilise des **threads virtuels** (`Executors.newVirtualThreadPerTaskExecutor()`).

### 4.3 Flux de validation des tokens (JWTValidator)

Le validateur JWT verifie les tokens en utilisant des signatures **EdDSA (Ed25519)**.

Etapes de validation pour les tokens d'acces :
1. **Validation de structure** -- Verifier 3 parties, signature non vide, longueur de signature 80-90 caracteres
2. **Verification de l'algorithme** -- Doit etre EdDSA
3. **Verification de signature** -- Contre JWKS avec retry automatique sur les cles fraiches
4. **Extraction des claims** -- issuer, audience, subject, username, IP, horodatages, empreinte de certificat
5. **Verification de l'issuer** -- Doit correspondre a l'issuer attendu (`https://sessions.hytale.com`)
6. **Verification de l'audience** -- Doit correspondre a l'audience du serveur
7. **Verification d'expiration** -- Avec tolerance de decalage d'horloge de 5 minutes
8. **Verification not-before** -- Avec tolerance de decalage d'horloge de 5 minutes
9. **Verification d'emission future** -- Rejeter les tokens emis dans le futur
10. **Liaison de certificat** -- Valider le claim `cnf.x5t#S256` contre le certificat client
11. **Validation UUID du subject** -- Doit etre un UUID valide

Cache JWKS :
- Les cles sont mises en cache de facon permanente apres la premiere recuperation
- Le rafraichissement force ne se produit que si la verification echoue ET que le dernier rafraichissement date de plus de 5 minutes

### 4.4 ServerAuthManager

Le `ServerAuthManager` est un singleton qui gere l'ensemble du cycle de vie de l'authentification du serveur.

**Modes d'authentification :** `NONE`, `SINGLEPLAYER`, `EXTERNAL_SESSION`, `OAUTH_BROWSER`, `OAUTH_DEVICE`, `OAUTH_STORE`

**Sources de tokens (par ordre de priorite) :**

1. Option CLI `--session-token` / `--identity-token`
2. Variables d'environnement `HYTALE_SERVER_SESSION_TOKEN` / `HYTALE_SERVER_IDENTITY_TOKEN`
3. Identifiants OAuth stockes (d'un precedent `/auth login`)

Le manager planifie le rafraichissement automatique des tokens 5 minutes avant l'expiration.

### 4.5 AuthConfig

URLs de services et constantes :

```java
public static final String OAUTH_AUTH_URL = "https://oauth.accounts.hytale.com/oauth2/auth";
public static final String OAUTH_TOKEN_URL = "https://oauth.accounts.hytale.com/oauth2/token";
public static final String DEVICE_AUTH_URL = "https://oauth.accounts.hytale.com/oauth2/device/auth";
public static final String SESSION_SERVICE_URL = "https://sessions.hytale.com";
public static final String ACCOUNT_DATA_URL = "https://account-data.hytale.com";
public static final String CLIENT_ID = "hytale-server";
public static final String[] SCOPES = new String[]{"openid", "offline", "auth:server"};
```

---

## 5. Stockage RocksDB

**Package :** `server.core.universe.world.storage.provider`

### 5.1 RocksDbChunkStorageProvider

Le fournisseur de stockage de chunks RocksDB est une alternative haute performance au stockage de chunks base sur des fichiers. Il stocke tous les chunks dans une base de donnees RocksDB dans le repertoire de sauvegarde du monde.

### 5.2 Strategie de compression

Le fournisseur utilise une approche de **compression en niveaux** :

| Couche | Compression | Objectif |
|--------|-------------|----------|
| Niveaux superieurs (donnees chaudes) | LZ4 | Lecture/ecriture rapide pour les chunks frequemment accedes |
| Niveau le plus bas (donnees froides) | ZSTD | Meilleur ratio de compression pour les chunks archives |
| Fichiers blob | ZSTD | Grandes valeurs stockees separement avec haute compression |

### 5.3 Filtre de Bloom

Un filtre de Bloom avec 9.9 bits par cle est configure pour eviter les lectures disque inutiles. L'index base sur le hash (`IndexType.kHashSearch`) combine avec un extracteur de prefixe de 8 octets permet des recherches efficaces de chunks par coordonnees.

### 5.4 Structure de la base de donnees

- **Chemin de la base :** `{world_save_path}/db`
- **Familles de colonnes :** `"default"` (metadonnees) et `"chunks"` (donnees des chunks)
- **Format de cle :** 8 octets -- `[x:4octets][z:4octets]` (entiers big-endian)

### 5.5 Chargeur et sauvegardeur

Le `Loader` lit les chunks de maniere asynchrone avec `CompletableFuture.supplyAsync`. La methode `flush()` assure que toutes les donnees sont persistees.

### 5.6 WorldRocksDbCommand

La commande `/world rocksdb compact` declenche un compactage manuel sur la famille de colonnes des chunks.

---

## 6. Telemetrie Sentry

**Fichier :** `server/core/HytaleServer.java`

Le suivi d'erreurs Sentry est integre comme systeme de telemetrie core. Il est desactive dans les cas suivants :
- Des plugins precoces avec des transformeurs sont charges
- Le serveur ne s'execute pas depuis un JAR (build de developpement)
- Aucune version n'est trouvee dans le manifeste du JAR
- L'option CLI `--disable-sentry` est utilisee

### Points cles

- **Suivi de session** : Les sessions sont demarrees au boot et terminees a l'arret
- **Contexte OS** : Nom et version du systeme d'exploitation
- **Contexte de build** : Version, revision-id, patchline, environnement
- **Contexte utilisateur** : UUID materiel, mode d'authentification, profil de jeu
- **Suivi des asset packs** : Chaque evenement Sentry inclut le contexte des packs charges
- **Tags de detection de plugins** : `has-plugins` et `has-packs` pour aider au triage
- **Filtrage des erreurs tierces** : Les erreurs provenant de plugins tiers sont filtrees
- Le handler Sentry utilise le SDK version `8.29.0`

---

## 7. Module Console

**Fichier :** `server/core/console/ConsoleModule.java`

### 7.1 Initialisation du terminal

Le terminal est initialise tot dans la sequence de demarrage, avant le constructeur `HytaleServer`. La methode `initializeTerminal()` cree un terminal JLine (mode dumb pour le solo, support des couleurs pour les serveurs dedies).

### 7.2 Sequence de demarrage

L'ordre complet de demarrage depuis `LateMain` :

1. `Options.parse(args)` -- Analyser les arguments CLI
2. `HytaleLogger.init()` -- Initialiser la journalisation
3. `ConsoleModule.initializeTerminal()` -- Creer le terminal JLine
4. `HytaleFileHandler.INSTANCE.enable()` -- Activer la journalisation fichier
5. `HytaleLogger.replaceStd()` -- Rediriger stdout/stderr
6. Configurer le chargeur de niveaux de log (niveaux CLI prioritaires sur niveaux config)
7. `new HytaleServer()` -- Creer et demarrer le serveur

### 7.3 Thread Console

Le `ConsoleModule.setup()` cree un `LineReader` et lance un thread daemon qui lit l'entree :

Comportements cles :
- Le prompt `> ` est affiche uniquement pour les terminaux non-dumb
- Les commandes prefixees par `/` ont le slash retire
- `UserInterruptException` (Ctrl+C) declenche `ShutdownReason.SIGINT`

---

## 8. Ajouts aux outils de construction

### 8.1 LayerCommand

**Fichier :** `builtin/buildertools/commands/LayerCommand.java`

Une nouvelle commande d'outils de construction qui remplit une selection avec des couches de differents types de blocs dans une direction specifiee.

**Utilisation :** `/layer <direction> <layer_definitions>`

- **Directions :** `up`, `down`, `north`, `south`, `east`, `west`, `camera`
- **Couches :** Liste de paires `(nombre, blockId)`, ex. `3 dirt 1 grass`
- **Permission :** `hytale.editor.selection.clipboard` (mode Creatif uniquement)

La direction `camera` utilise la rotation actuelle de la tete du joueur.

### 8.2 PasteToolUtil

**Fichier :** `builtin/buildertools/utils/PasteToolUtil.java`

Une classe utilitaire qui change automatiquement le slot actif de la barre d'action du joueur vers l'outil Coller (`EditorTool_Paste`).

La methode `switchToPasteTool` recherche l'outil coller dans cet ordre :

1. **Barre d'action** -- Si trouve, activer ce slot
2. **Inventaire de stockage** -- Si trouve et qu'il y a un slot vide dans la barre d'action, le deplacer
3. **Inventaire d'outils** -- Si trouve et qu'il y a un slot vide dans la barre d'action, creer une copie

Ceci est invoque automatiquement apres les operations de presse-papiers (copier, couper) pour s'assurer que l'outil coller est facilement disponible.

---

## 9. Autres nouvelles commandes

### 9.1 GitCommand

**Fichier :** `server/core/command/commands/utility/git/GitCommand.java`

La collection de commandes `/git` fournit des operations git dans le serveur pour les workflows de developpement.

#### /git assets

Sous-commandes :
- `/git assets status` -- Execute `git status` sur le repertoire des assets
- `/git assets reset` -- Execute `git reset --hard head` sur le repertoire des assets
- `/git assets pull` -- Execute `updateAssets.sh` si disponible, sinon `git pull`

#### /git prefabs

Sous-commandes :
- `/git prefabs status` -- Statut git (incluant les sous-modules)
- `/git prefabs commit` -- Ajouter tout et committer (repo principal et sous-modules)
- `/git prefabs pull` -- Pull (repo principal et sous-modules)
- `/git prefabs push` -- Push vers origin/master (repo principal et sous-modules)
- `/git prefabs all` -- Workflow complet : add, commit, pull, push (sous-modules d'abord, puis repo principal)

Le message de commit inclut le nom d'affichage de l'expediteur de la commande.

### 9.2 UIGalleryCommand

**Fichier :** `server/core/command/commands/utility/UIGalleryCommand.java`

Une commande de mode Creatif qui ouvre une page de galerie UI pour le joueur. C'est un outil pour developpeurs/createurs de contenu qui presente une galerie de tous les composants UI disponibles.

La commande :
- Necessite le mode de jeu Creatif
- Est reservee aux joueurs (pas d'execution console)
- S'execute sur le thread du monde pour la securite des threads
- Ouvre une `UIGalleryPage` via le gestionnaire de pages du joueur

---

## Resume des variables d'environnement

| Variable | Type | Objectif |
|----------|------|----------|
| `HYTALE_DISABLE_UPDATES` | Booleen | Kill switch pour desactiver tout le systeme de mise a jour |
| `HYTALE_SERVER_SESSION_TOKEN` | String | Token de session serveur pour l'authentification |
| `HYTALE_SERVER_IDENTITY_TOKEN` | String | Token d'identite serveur pour l'authentification |
| `HYTALE_SERVER_AUDIENCE` | String | Surcharger l'audience du serveur pour les grants d'authentification |

## Resume des permissions

| Permission | Utilisation |
|------------|-------------|
| `hytale.system.update.notify` | Recevoir les notifications de disponibilite de mise a jour en jeu |
| `hytale.editor.selection.clipboard` | Utiliser la commande `/layer` des outils de construction |

## Resume des nouveaux champs de config (v4)

| Chemin | Type | Defaut | Nouveau en v4 |
|--------|------|--------|---------------|
| `Update.Enabled` | boolean | `true` | Oui |
| `Update.CheckIntervalSeconds` | int | `3600` | Oui |
| `Update.NotifyPlayersOnAvailable` | boolean | `true` | Oui |
| `Update.Patchline` | string | `null` | Oui |
| `Update.RunBackupBeforeUpdate` | boolean | `true` | Oui |
| `Update.BackupConfigBeforeUpdate` | boolean | `true` | Oui |
| `Update.AutoApplyMode` | enum | `DISABLED` | Oui |
| `Update.AutoApplyDelayMinutes` | int | `30` | Oui |
| `Backup.Enabled` | boolean | `false` | Oui |
| `Backup.FrequencyMinutes` | int | `30` | Oui |
| `Backup.Directory` | string | `null` | Oui |
| `Backup.MaxCount` | int | `5` | Oui |
| `Backup.ArchiveMaxCount` | int | `5` | Oui |
| `DefaultModsEnabled` | boolean | `!SINGLEPLAYER` | Oui |
| `SkipModValidationForVersion` | string | `null` | Oui |
