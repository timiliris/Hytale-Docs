---
id: intellij-plugin
title: Plugin IntelliJ Hytale
sidebar_label: Plugin IntelliJ
sidebar_position: 1
description: Guide complet du plugin IntelliJ pour le developpement de plugins Hytale
---

# Plugin IntelliJ Hytale

Le plugin **HytaleDocs Dev Tools** pour IntelliJ IDEA est une boite a outils complete pour le developpement de plugins serveur Hytale. Il automatise les taches repetitives, fournit des extraits de code preconfigures, et integre la documentation directement dans votre IDE.

## Pourquoi Utiliser ce Plugin ?

| Avantage | Description |
|----------|-------------|
| **Gain de temps** | Creez un projet complet en quelques clics avec l'assistant de creation |
| **Prevention des erreurs** | Auto-completion intelligente et validation du code Hytale |
| **Bonnes pratiques** | Templates et extraits de code suivant les conventions officielles |
| **Documentation integree** | Acces a la documentation hytale-docs.com sans quitter l'IDE |
| **Workflow optimise** | Build, deploy et debug en un clic |

> **Lien JetBrains Marketplace** : [Hytale Dev Tools](https://plugins.jetbrains.com/plugin/26469-hytale-docs-dev-tools)

---

## Installation

### Depuis JetBrains Marketplace (Recommande)

1. Ouvrez IntelliJ IDEA
2. Allez dans **Settings** (Ctrl+Alt+S) > **Plugins** > **Marketplace**
3. Recherchez "**Hytale Development Tools**" ou "**HytaleDocs**"
4. Cliquez sur **Install**
5. Redemarrez IntelliJ IDEA

### Depuis l'IDE

```
Settings → Plugins → Marketplace → Rechercher "Hytale" → Install → Restart IDE
```

### Depuis GitHub Releases

1. Telechargez le fichier `.zip` depuis [GitHub Releases](https://github.com/HytaleDocs/hytale-intellij-plugin/releases)
2. Dans IntelliJ : **Settings** > **Plugins** > icone engrenage > **Install plugin from disk...**
3. Selectionnez le fichier ZIP telecharge
4. Redemarrez IntelliJ IDEA

### Prerequis

| Prerequis | Version Minimale |
|-----------|------------------|
| **IntelliJ IDEA** | 2025.3+ |
| **Java** | 25 (OpenJDK Temurin recommande) |
| **Gradle** | 9.2.0+ (inclus automatiquement) |

---

## Assistant de Creation de Projet

L'assistant de creation de projet vous permet de creer un plugin Hytale complet en quelques etapes, avec toute la structure de projet, les fichiers de configuration et les exemples de code generes automatiquement.

### Acces a l'Assistant

**File** > **New** > **Project** > **Hytale Mod**

### Etape 1 : Selection du Template

Choisissez le point de depart pour votre mod :

| Template | Description | Contenu |
|----------|-------------|---------|
| **Empty Mod** | Depart minimaliste | Classe principale uniquement, structure de base |
| **Full Template** | Demarrage complet avec exemples | Commandes, ecouteurs d'evenements, interface UI personnalisee |

> **Recommandation** : Choisissez **Full Template** si vous debutez - il fournit des exemples pratiques que vous pouvez modifier.

### Etape 2 : Configuration du Mod

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Mod Name** | Nom d'affichage de votre mod | `MyCoolMod` |
| **Package** | Package Java (auto-genere) | `com.example.mycoolmod` |
| **Language** | Langage de programmation | Java ou Kotlin |
| **Build System** | Systeme de build | Gradle (recommande) ou Maven |
| **Version** | Version semantique | `1.0.0` |
| **Command** | Raccourci de commande in-game | `mcm` (pour `/mcm`) |

> **Note importante** : Les noms de mod sans espaces (ex: `MyCoolMod` au lieu de `My Cool Mod`) permettent le support du **rechargement a chaud** (hot reload).

### Etape 3 : Auteur et Description

| Champ | Description |
|-------|-------------|
| **Author** | Votre nom ou organisation |
| **Description** | Breve description du mod |

#### Detection Automatique du Serveur

L'assistant detecte automatiquement votre installation Hytale :

- **Detection reussie** : Affiche "Hytale detecte - Server + Assets"
- Option pour copier automatiquement les fichiers serveur dans le projet
- Emplacements verifies :
  - Windows : `%APPDATA%\Hytale\install\release\package\game\latest\`
  - macOS : `~/Library/Application Support/Hytale/...`
  - Linux : `~/.local/share/Hytale/...`

### Fonctionnalites d'Auto-Generation

L'assistant genere intelligemment :

- **Mod ID** : Derive automatiquement du nom (`MyCoolMod` -> `my-cool-mod`)
- **Package** : Genere depuis le nom (`com.example.mycoolmod`)
- **Command** : Abbreviation du nom (`MyCoolMod` -> `mcm` ou `My Cool Mod` -> `mcm`)
- **manifest.json** : Configure avec toutes les metadonnees
- **build.gradle/pom.xml** : Configure avec les dependances Hytale
- **Configurations d'execution** : Build, Deploy, Run Server

---

## Live Templates (Extraits de Code)

Les Live Templates permettent d'inserer rapidement des blocs de code Hytale en tapant un prefixe et en appuyant sur Tab.

### Table des Templates Disponibles

| Prefixe | Nom | Description | Contexte |
|---------|-----|-------------|----------|
| `hyplugin` | Plugin Main Class | Classe principale du plugin | Declaration Java |
| `hyevent` | Event Registration | Enregistrement d'ecouteur d'evenement | Code Java |
| `hycmd` | Command Collection | Collection de commandes | Declaration Java |
| `hyecs` | ECS Event System | Systeme d'evenement ECS | Declaration Java |
| `hylistener` | Quick Listener | Ecouteur d'evenement rapide avec lambda | Code Java |
| `hymsg` | Send Message | Envoyer un message au joueur | Code Java |
| `hylogger` | Logger Declaration | Declaration du logger HytaleLogger | Declaration Java |
| `hypermission` | Permission Check | Verification de permission avec message de refus | Code Java |
| `hyquery` | ECS Query | Requete ECS pour filtrer les entites | Code Java |
| `hysubcmd` | Sub-Command | Ajouter une sous-commande | Code Java |

### Exemples Detailles

#### `hyplugin` - Classe Principale du Plugin

Tapez `hyplugin` puis Tab dans une declaration de classe :

```java
public class MyPlugin extends JavaPlugin {
    private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();

    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        LOGGER.info("Setting up...");
        // Votre code ici
    }

    @Override protected void start() { LOGGER.info("Started!"); }
    @Override protected void shutdown() { LOGGER.info("Stopped!"); }
}
```

#### `hyevent` - Enregistrement d'Evenement

Tapez `hyevent` puis Tab dans du code Java :

```java
eventBus.register(PlayerConnectEvent.class, event -> {
    // Votre logique ici
});
```

Variables editables :
- **EVENT** : Type d'evenement (defaut: `PlayerConnectEvent`)

#### `hycmd` - Collection de Commandes

Tapez `hycmd` puis Tab dans une declaration :

```java
public class MyCommand extends AbstractCommandCollection {
    public MyCommand() {
        super("mycommand", "Command description");
    }
}
```

Variables editables :
- **NAME** : Nom de la classe (auto-detecte depuis le fichier)
- **CMD** : Nom de la commande
- **DESC** : Description de la commande

#### `hyecs` - Systeme ECS

Tapez `hyecs` puis Tab dans une declaration :

```java
public class MySystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {
    @Override
    public void handle(int index, ArchetypeChunk<EntityStore> chunk,
                       Store<EntityStore> store, CommandBuffer<EntityStore> buffer,
                       BreakBlockEvent event) {
        // Votre logique ici
    }

    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

#### `hylistener` - Ecouteur Rapide

```java
eventBus.register(PlayerConnectEvent.class, event -> { });
```

#### `hymsg` - Envoyer un Message

```java
context.sendMessage(Message.raw("Message"));
```

#### `hylogger` - Declaration du Logger

```java
private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();
```

#### `hypermission` - Verification de Permission

```java
if (!context.hasPermission("myplugin.command")) {
    context.sendMessage(Message.raw("You do not have permission to use this command."));
    return;
}
// Code autorise ici
```

#### `hyquery` - Requete ECS

```java
Query<EntityStore> query = Archetype.create(EntityStore.class)
    .with(PositionComponent.class, HealthComponent.class)
    .build();
```

#### `hysubcmd` - Sous-Commande

```java
addSubCommand("subcommand", "Sub-command description", (context, args) -> {
    // Votre logique ici
});
```

---

## Completion de Code et IntelliSense

Le plugin fournit une completion de code contextuelle specifique a l'API Hytale.

### Fonctionnalites de Completion

| Fonctionnalite | Description |
|----------------|-------------|
| **Classes d'evenements** | Completion des types d'evenements dans les generiques `EventRegistry.register()` |
| **Methodes d'evenements** | Suggestions des methodes disponibles sur les objets evenement |
| **Cycle de vie du plugin** | Suggestions pour `setup()`, `start()`, `shutdown()` |
| **Completion contextuelle** | Active uniquement dans le code Hytale (detecte automatiquement) |

### Exemple de Completion

Quand vous tapez :

```java
eventBus.register(Player|
```

Le plugin suggere automatiquement :
- `PlayerConnectEvent`
- `PlayerDisconnectEvent`
- `PlayerRespawnEvent`
- Et tous les autres evenements Player disponibles

---

## Configuration d'Execution et Debogage

Le plugin fournit des configurations d'execution dediees pour simplifier le workflow de developpement.

### Creation d'une Configuration d'Execution

Les configurations sont generees automatiquement lors de la creation du projet, mais vous pouvez aussi les creer manuellement :

1. **Run** > **Edit Configurations...**
2. Cliquez sur **+** > **Hytale Server**
3. Configurez les options

### Configurations Pre-Generees

| Configuration | Description | Action |
|---------------|-------------|--------|
| **Build** | Compile le plugin | `gradle build` |
| **Clean Build** | Nettoie et recompile | `gradle clean build` |
| **Build & Deploy** | Compile et deploie dans `server/mods/` | `gradle build deployToServer` |
| **ShadowJar** | Cree un JAR uber avec dependances | `gradle shadowJar` |
| **Run Server** | Lance le serveur Hytale | Java avec HytaleServer.jar |

### Pipeline de Developpement

Le workflow typique est :

```
Build → Deploy → Run Server
```

Avec le plugin, cela devient un simple clic sur **Run** ou **Debug**.

### Mode Debug avec Points d'Arret

1. Placez des points d'arret dans votre code (cliquez dans la marge gauche)
2. Cliquez sur **Debug** au lieu de **Run**
3. IntelliJ s'attache automatiquement au serveur
4. Utilisez les outils de debug habituels (Step Over, Step Into, Variables, etc.)

### Rechargement a Chaud (Hot Reload)

Sur Linux et macOS, le plugin supporte le rechargement a chaud :

1. Modifiez votre code
2. Cliquez sur **Build & Deploy**
3. Le serveur recharge automatiquement le plugin sans redemarrer

> **Prerequis** : Le nom du plugin ne doit pas contenir d'espaces pour que le hot reload fonctionne.

---

## Fenetre d'Outils HytaleDocs

La fenetre d'outils **HytaleDocs** est accessible dans la barre laterale droite de l'IDE. Elle fournit un acces rapide a toutes les fonctionnalites du plugin.

### Onglet Server

| Element | Description |
|---------|-------------|
| **Statut** | Affiche si le serveur est en cours d'execution |
| **Controles** | Boutons Start/Stop/Restart |
| **Statistiques** | Memoire utilisee, joueurs connectes, TPS |
| **Configuration** | Acces rapide aux parametres serveur |

### Onglet Console

| Fonctionnalite | Description |
|----------------|-------------|
| **Logs colores** | Affichage des logs serveur avec coloration syntaxique |
| **Filtrage** | Filtrez par niveau (INFO, WARN, ERROR) |
| **Entree de commande** | Executez des commandes serveur directement |
| **Recherche** | Recherchez dans les logs |

### Onglet Assets

| Fonctionnalite | Description |
|----------------|-------------|
| **Explorateur d'assets** | Naviguez dans les assets Hytale |
| **Previsualisation** | Visualisez images (PNG, JPG), audio (OGG), JSON |
| **Synchronisation** | Comparez les assets locaux avec le serveur |
| **Zoom** | Zoomez sur les images |

Types d'assets supportes :
- **Images** : PNG, JPG avec previsualisation et zoom
- **Audio** : OGG avec controles de lecture
- **JSON** : Affichage avec coloration syntaxique
- **Modeles** : Apercu des modeles 3D (bientot)

### Onglet Docs

| Fonctionnalite | Description |
|----------------|-------------|
| **Navigation** | Arborescence de la documentation |
| **Recherche** | Recherche dans toute la documentation |
| **Rendu** | Affichage du contenu Markdown |
| **Liens** | Navigation entre les pages |
| **Mode hors ligne** | Acces a la documentation sans internet |

La documentation est synchronisee avec [hytale-docs.com](https://hytale-docs.com).

### Onglet AI

| Fonctionnalite | Description |
|----------------|-------------|
| **Installation MCP** | Installez le serveur MCP pour Claude |
| **Configuration Claude Code** | Configurez l'integration avec Claude |
| **Statut** | Verifiez si MCP est installe et fonctionnel |

L'integration MCP permet a Claude d'acceder a toute la documentation Hytale lors de l'assistance au code.

#### Installation du Serveur MCP

1. Cliquez sur **Install MCP Server (npm)**
2. Attendez l'installation
3. Cliquez sur **Install for Claude Code**
4. Redemarrez Claude Code

### Onglet Infos

| Element | Description |
|---------|-------------|
| **Liens utiles** | Discord, Documentation, GitHub |
| **Reference des templates** | Liste des Live Templates disponibles |
| **Commandes** | Reference des commandes Hytale |
| **Version** | Version du plugin installe |

---

## Support des Fichiers .ui

Le plugin fournit un support complet pour les fichiers d'interface utilisateur Hytale (`.ui`).

### Fonctionnalites

| Fonctionnalite | Description |
|----------------|-------------|
| **Coloration syntaxique** | Mise en valeur des mots-cles, valeurs, commentaires |
| **Completion de code** | Suggestions pour les proprietes et composants |
| **Previsualisation des couleurs** | Icones de couleur dans la gouttiere pour les valeurs hex |
| **Selecteur de couleur** | Cliquez sur l'icone pour ouvrir le selecteur |
| **Correspondance des accolades** | Mise en evidence des accolades correspondantes |
| **Repliement de code** | Repliez les blocs Group, Label, etc. |
| **Commentaires** | Support des commentaires `//` |

### Exemple de Fichier .ui

```
// Mon interface personnalisee
$C = "../Common.ui";

@PrimaryButton = TextButtonStyle(
  Default: (Background: #3a7bd5, LabelStyle: (FontSize: 14, TextColor: #ffffff)),
  Hovered: (Background: #4a8be5, LabelStyle: (FontSize: 14, TextColor: #ffffff))
);

Group #MainPanel {
  Anchor: (Width: 400, Height: 300);
  Background: #1a1a2e(0.95);
  LayoutMode: Top;
  Padding: (Full: 16);

  Label #Title {
    Text: "Mon Interface";
    Anchor: (Height: 32);
    Style: (FontSize: 18, TextColor: #ffffff, RenderBold: true);
  }

  TextButton #MyButton {
    Text: "Cliquez ici";
    Anchor: (Width: 120, Height: 40);
    Style: @PrimaryButton;
  }
}
```

---

## Modeles de Fichiers

Creez rapidement de nouveaux fichiers Hytale avec des modeles preconfigures.

### Acces aux Modeles

**Clic droit** sur un dossier > **New** > **Hytale** > Choisir le modele

### Modeles Disponibles

| Modele | Description | Fichier genere |
|--------|-------------|----------------|
| **Hytale Mod** | Classe principale du plugin | `MyPlugin.java` |
| **Hytale Listener** | Ecouteur d'evenements | `MyListener.java` |
| **Hytale Command** | Collection de commandes | `MyCommand.java` |
| **Hytale ECS System** | Systeme ECS | `MySystem.java` |
| **Hytale UI File** | Fichier interface utilisateur | `MyUI.ui` |

### Exemple : Modele Hytale Listener

Quand vous creez un nouveau Listener, le fichier suivant est genere :

```java
package com.example.myplugin;

import com.hypixel.hytale.event.EventRegistry;
import com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent;
import com.hypixel.hytale.server.core.event.events.player.PlayerDisconnectEvent;
import com.hypixel.hytale.logger.HytaleLogger;

import java.util.logging.Level;

/**
 * MyListener - Event listener for player events.
 */
public class MyListener {

    private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();

    public static void register(EventRegistry eventRegistry) {
        eventRegistry.register(PlayerConnectEvent.class, event -> {
            String playerName = event.getPlayerRef().getUsername();
            LOGGER.at(Level.INFO).log("Player connected: %s", playerName);
        });

        eventRegistry.register(PlayerDisconnectEvent.class, event -> {
            String playerName = event.getPlayerRef().getUsername();
            LOGGER.at(Level.INFO).log("Player disconnected: %s", playerName);
        });
    }
}
```

### Exemple : Modele Hytale ECS System

```java
package com.example.myplugin;

import com.hypixel.hytale.component.Archetype;
import com.hypixel.hytale.component.ArchetypeChunk;
import com.hypixel.hytale.component.CommandBuffer;
import com.hypixel.hytale.component.query.Query;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.component.system.EntityEventSystem;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;
import com.hypixel.hytale.server.core.event.events.ecs.BreakBlockEvent;

public class MySystem extends EntityEventSystem<EntityStore, BreakBlockEvent> {

    public MySystem() {
        super(BreakBlockEvent.class);
    }

    @Override
    public void handle(
            int index,
            ArchetypeChunk<EntityStore> archetypeChunk,
            Store<EntityStore> store,
            CommandBuffer<EntityStore> commandBuffer,
            BreakBlockEvent event
    ) {
        // Gerer l'evenement ici
        int x = event.getTargetBlock().getX();
        int y = event.getTargetBlock().getY();
        int z = event.getTargetBlock().getZ();

        // Annuler si necessaire:
        // event.setCancelled(true);
    }

    @Override
    public Query<EntityStore> getQuery() {
        return Archetype.empty();
    }
}
```

---

## Tutoriel Demarrage Rapide

Suivez ce guide etape par etape pour creer votre premier plugin Hytale avec le plugin IntelliJ.

### Etape 1 : Installer le Plugin

1. Ouvrez IntelliJ IDEA 2025.3+
2. **Settings** > **Plugins** > **Marketplace**
3. Recherchez "Hytale Development Tools"
4. Cliquez sur **Install** puis redemarrez l'IDE

### Etape 2 : Creer un Nouveau Projet

1. **File** > **New** > **Project**
2. Selectionnez **Hytale Mod** dans la liste de gauche
3. Choisissez **Full Template** (recommande pour debuter)
4. Cliquez sur **Next**

### Etape 3 : Configurer le Projet

1. **Mod Name** : Entrez `MonPremierPlugin`
2. **Package** : Sera auto-genere en `com.example.monpremierplugin`
3. **Language** : Gardez Java
4. **Build System** : Gardez Gradle
5. **Command** : Sera auto-genere en `mpp`
6. Cliquez sur **Next**

### Etape 4 : Finaliser

1. **Author** : Entrez votre nom
2. **Description** : "Mon premier plugin Hytale"
3. Si Hytale est detecte, cochez "Copy server files automatically"
4. Cliquez sur **Create**

### Etape 5 : Explorer le Projet

Le projet genere contient :

```
MonPremierPlugin/
├── src/main/java/com/example/monpremierplugin/
│   ├── MonPremierPluginPlugin.java    # Classe principale
│   ├── commands/
│   │   ├── MonPremierPluginCommand.java
│   │   ├── HelpSubCommand.java
│   │   ├── InfoSubCommand.java
│   │   ├── ReloadSubCommand.java
│   │   └── UISubCommand.java
│   ├── listeners/
│   │   └── PlayerListener.java
│   └── ui/
│       └── MonPremierPluginDashboardUI.java
├── src/main/resources/
│   ├── manifest.json
│   └── Common/UI/Custom/monpremierplugin/
│       └── Dashboard.ui
├── build.gradle
├── settings.gradle
├── server/                            # Serveur Hytale local
└── libs/
    └── HytaleServer.jar               # API de compilation
```

### Etape 6 : Compiler et Tester

1. Ouvrez la fenetre **Run Configurations** (en haut a droite)
2. Selectionnez **Build & Deploy**
3. Cliquez sur **Run** (triangle vert)
4. Le plugin est compile et copie dans `server/mods/`

### Etape 7 : Lancer le Serveur

1. Selectionnez **Run Server** dans les configurations
2. Cliquez sur **Run**
3. Attendez que le serveur demarre
4. Connectez-vous au serveur et tapez `/mpp help`

### Etape 8 : Modifier et Iterer

1. Modifiez le code dans `PlayerListener.java`
2. Executez **Build & Deploy**
3. Sur Linux/macOS : le plugin se recharge automatiquement
4. Sur Windows : redemarrez le serveur

---

## Conseils et Bonnes Pratiques

### Organisation du Code

- **Un fichier par classe** : Gardez chaque commande, listener, systeme dans son propre fichier
- **Packages structures** : Utilisez des sous-packages (`commands/`, `listeners/`, `ui/`, `systems/`)
- **Nommage coherent** : Suffixez les classes par leur type (`PlayerListener`, `TeleportCommand`, `DamageSystem`)

### Performance

- **Evitez les boucles dans les listeners** : Les evenements peuvent etre appeles frequemment
- **Utilisez le cache** : Stockez les references au lieu de les rechercher a chaque appel
- **Preferez les systemes ECS** : Pour les operations sur de nombreuses entites

### Debug

- **Utilisez les logs** : `LOGGER.at(Level.INFO).log("Message: %s", variable);`
- **Points d'arret conditionnels** : Clic droit sur le point d'arret > **Condition**
- **Evaluez des expressions** : Pendant le debug, selectionnez du code et appuyez sur Alt+F8

### Raccourcis Utiles IntelliJ

| Raccourci | Action |
|-----------|--------|
| Ctrl+Shift+A | Recherche d'actions |
| Ctrl+N | Recherche de classes |
| Ctrl+Shift+N | Recherche de fichiers |
| Ctrl+B | Aller a la definition |
| Ctrl+Q | Documentation rapide |
| Alt+Enter | Actions contextuelles |
| Ctrl+Space | Completion de code |
| Ctrl+Shift+Space | Completion intelligente |

### Ressources Additionnelles

- [Documentation Hytale Docs](https://hytale-docs.com/docs/modding/plugins/overview)
- [Discord HytaleDocs](https://discord.gg/yAjaFBH4Y8)
- [GitHub du Plugin](https://github.com/HytaleDocs/hytale-intellij-plugin)
- [Guide des Evenements](/docs/modding/plugins/events)
- [Reference des Commandes](/docs/modding/plugins/commands)
