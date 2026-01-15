---
id: project-setup
title: Configuration du Projet de Plugin
sidebar_label: Configuration du Projet
sidebar_position: 2
description: Guide complet pour configurer un projet de plugin Java Hytale avec Gradle
---

# Configuration du Projet de Plugin

Apprenez à créer un projet de plugin Hytale correctement structuré en utilisant Gradle et Java 25.

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- **Java Development Kit (JDK) 25** - [Télécharger depuis Adoptium](https://adoptium.net/) (requis pour un accès complet à l'API)
- **IDE** - IntelliJ IDEA (recommandé) ou Eclipse
- **Gradle 9.2.0** - Généralement inclus avec l'IDE
- **Git** - Pour le contrôle de version (optionnel mais recommandé)

> "Les développeurs de plugins ont besoin de Java 25 et IntelliJ IDEA pour un accès complet à l'API."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

:::tip Recommandation IDE
IntelliJ IDEA Community Edition est gratuit et offre un excellent support Java/Gradle avec des fonctionnalités comme :

- Complétion de code intelligente
- Intégration Gradle intégrée
- Support du débogueur
- Outils de développement de plugins
:::

## Démarrage Rapide

### Avec IntelliJ IDEA

1. **File → New → Project**
2. Sélectionnez **Gradle** avec **Java**
3. Définissez le **JDK** à 21
4. Nommez votre projet (ex : `my-hytale-plugin`)
5. Cliquez sur **Create**

### En Ligne de Commande

```bash
# Créer le répertoire du projet
mkdir my-hytale-plugin
cd my-hytale-plugin

# Initialiser le wrapper Gradle
gradle init --type java-library --dsl groovy

# Ou avec Kotlin DSL
gradle init --type java-library --dsl kotlin
```

## Structure du Projet

Un projet de plugin bien organisé ressemble à ceci :

```filetree
my-hytale-plugin/
├── libs/
│   └── HytaleServer.jar      # JAR serveur pour la compilation
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── example/
│   │   │           └── myplugin/
│   │   │               ├── MyPlugin.java
│   │   │               ├── commands/
│   │   │               │   └── MyCommand.java
│   │   │               ├── listeners/
│   │   │               │   └── PlayerListener.java
│   │   │               └── util/
│   │   │                   └── ConfigManager.java
│   │   └── resources/
│   │       ├── manifest.json
│   │       └── config.yml
│   └── test/
│       └── java/
│           └── com/
│               └── example/
│                   └── myplugin/
│                       └── MyPluginTest.java
├── build.gradle
├── settings.gradle
├── gradle.properties
└── README.md
```

## Configuration du JAR Serveur

Avant de pouvoir compiler votre plugin, vous devez ajouter le JAR du serveur Hytale à votre projet :

1. **Téléchargez le JAR serveur** depuis [cdn.hytale.com/HytaleServer.jar](https://cdn.hytale.com/HytaleServer.jar)
2. **Créez un dossier `libs`** à la racine de votre projet
3. **Copiez `HytaleServer.jar`** dans le dossier `libs`

```bash
mkdir libs
curl -o libs/HytaleServer.jar https://cdn.hytale.com/HytaleServer.jar
```

Le JAR serveur est utilisé comme dépendance `compileOnly` - il fournit les classes API pour la compilation mais n'est pas inclus dans votre plugin (le serveur possède déjà ces classes au runtime).

Pour un exemple de projet complet, voir [Build-9/Hytale-Example-Project](https://github.com/Build-9/Hytale-Example-Project) sur GitHub.

## Configuration Gradle

### build.gradle (Groovy DSL)

```groovy
plugins {
    id 'java'
    id 'com.github.johnrengelman.shadow' version '8.1.1'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
}

dependencies {
    // JAR Serveur Hytale - ajoutez au classpath depuis votre installation locale
    // Téléchargez HytaleServer.jar depuis https://cdn.hytale.com/HytaleServer.jar
    // Placez-le dans un dossier 'libs' à la racine du projet
    compileOnly files('libs/HytaleServer.jar')

    // Optionnel : Utilitaires communs
    implementation 'com.google.guava:guava:32.1.3-jre'
    implementation 'com.google.code.gson:gson:2.10.1'

    // Tests
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

tasks.named('test') {
    useJUnitPlatform()
}

// Shadow JAR pour regrouper les dépendances
shadowJar {
    archiveClassifier.set('')

    // Relocaliser les dépendances pour éviter les conflits
    relocate 'com.google.gson', 'com.example.myplugin.libs.gson'
}

// Le build produit le shadow JAR par défaut
tasks.named('build') {
    dependsOn shadowJar
}

// Traitement des ressources - remplacer le placeholder de version
processResources {
    filesMatching('manifest.json') {
        expand(
            'version': project.version,
            'name': project.name
        )
    }
}
```

### build.gradle.kts (Kotlin DSL)

```kotlin
plugins {
    java
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

group = "com.example"
version = "1.0.0"

repositories {
    mavenCentral()
}

dependencies {
    // JAR Serveur Hytale - ajoutez au classpath depuis votre installation locale
    compileOnly(files("libs/HytaleServer.jar"))

    implementation("com.google.guava:guava:32.1.3-jre")
    implementation("com.google.code.gson:gson:2.10.1")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

tasks.test {
    useJUnitPlatform()
}

tasks.shadowJar {
    archiveClassifier.set("")

    relocate("com.google.gson", "com.example.myplugin.libs.gson")
}

tasks.build {
    dependsOn(tasks.shadowJar)
}

tasks.processResources {
    filesMatching("manifest.json") {
        expand(
            "version" to project.version,
            "name" to project.name
        )
    }
}
```

### settings.gradle

```groovy
rootProject.name = 'my-hytale-plugin'
```

### gradle.properties

```properties
# Paramètres du projet
org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true
org.gradle.caching=true

# Versions des dépendances (optionnel, pour une gestion plus facile)
guavaVersion=32.1.3-jre
```

## Manifeste du Plugin

Le fichier `manifest.json` identifie votre plugin auprès du serveur :

```json
{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "${version}",
  "description": "Une description de ce que fait ce plugin",
  "authors": ["VotreNom"],
  "main": "com.example.myplugin.MyPlugin",
  "api_version": "1.0",
  "dependencies": {
    "required": [],
    "optional": ["another-plugin"]
  },
  "load_order": "POSTWORLD",
  "permissions": {
    "myplugin.admin": {
      "description": "Accès admin complet",
      "default": "op"
    },
    "myplugin.use": {
      "description": "Permission d'utilisation basique",
      "default": true
    }
  }
}
```

### Propriétés du Manifeste

| Propriété | Requis | Description |
|-----------|--------|-------------|
| `id` | Oui | Identifiant unique du plugin (minuscules, sans espaces) |
| `name` | Oui | Nom d'affichage du plugin |
| `version` | Oui | Version sémantique (ex : "1.0.0") |
| `main` | Oui | Nom de classe principale entièrement qualifié |
| `api_version` | Oui | Version minimale de l'API Hytale requise |
| `description` | Non | Brève description |
| `authors` | Non | Liste des noms d'auteurs |
| `dependencies` | Non | Dépendances du plugin |
| `load_order` | Non | Quand charger (STARTUP, POSTWORLD) |
| `permissions` | Non | Nœuds de permission utilisés par votre plugin |

## Classe Principale du Plugin

Créez votre classe point d'entrée :

```java
package com.example.myplugin;

import com.hytale.api.plugin.Plugin;
import com.hytale.api.plugin.PluginInfo;
import com.hytale.api.event.EventManager;
import com.hytale.api.command.CommandManager;
import com.example.myplugin.commands.MyCommand;
import com.example.myplugin.listeners.PlayerListener;

@PluginInfo(
    id = "my-plugin",
    name = "My Awesome Plugin",
    version = "1.0.0"
)
public class MyPlugin extends Plugin {

    private static MyPlugin instance;
    private ConfigManager configManager;

    @Override
    public void onLoad() {
        // Appelé quand le JAR du plugin est chargé
        instance = this;
        getLogger().info("MyPlugin is loading...");
    }

    @Override
    public void onEnable() {
        // Appelé quand le plugin est activé
        getLogger().info("MyPlugin is enabling...");

        // Charger la configuration
        saveDefaultConfig();
        configManager = new ConfigManager(this);

        // Enregistrer les listeners d'événements
        EventManager events = getServer().getEventManager();
        events.registerListener(new PlayerListener(this));

        // Enregistrer les commandes
        CommandManager commands = getServer().getCommandManager();
        commands.registerCommand(new MyCommand(this));

        getLogger().info("MyPlugin has been enabled!");
    }

    @Override
    public void onDisable() {
        // Appelé quand le plugin est désactivé
        getLogger().info("MyPlugin is disabling...");

        // Nettoyer les ressources
        configManager.save();

        getLogger().info("MyPlugin has been disabled!");
    }

    public static MyPlugin getInstance() {
        return instance;
    }

    public ConfigManager getConfigManager() {
        return configManager;
    }
}
```

## Compiler Votre Plugin

### Ligne de Commande

```bash
# Compiler le JAR du plugin
./gradlew build

# Nettoyer et recompiler
./gradlew clean build

# Exécuter les tests
./gradlew test

# Générer le shadow JAR avec les dépendances
./gradlew shadowJar
```

### IntelliJ IDEA

1. Ouvrez la fenêtre d'outil **Gradle** (View → Tool Windows → Gradle)
2. Naviguez vers **Tasks → build**
3. Double-cliquez sur **build** ou **shadowJar**

### Emplacement de Sortie

Votre plugin compilé sera à :

```
build/libs/my-hytale-plugin-1.0.0.jar
```

## Installer Votre Plugin

Copiez le JAR vers votre serveur :

```filetree
hytale-server/
└── plugins/
    └── my-hytale-plugin-1.0.0.jar
```

Redémarrez le serveur pour charger votre plugin.

## Workflow de Développement

### Hot Reloading (Développement)

Pour une itération plus rapide pendant le développement :

```bash
# Compiler et copier vers le serveur en une commande
./gradlew build && cp build/libs/*.jar ../hytale-server/plugins/
```

Ou créez une tâche Gradle :

```groovy
task deploy(type: Copy, dependsOn: shadowJar) {
    from shadowJar.archiveFile
    into '../hytale-server/plugins'
}
```

Puis exécutez : `./gradlew deploy`

### Débogage

1. Démarrez le serveur avec les flags de debug :
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 -jar hytale-server.jar
```

2. Dans IntelliJ : **Run → Attach to Process** ou créez une configuration **Remote JVM Debug**

### Logging

Utilisez le logger du plugin pour la sortie de debug :

```java
getLogger().info("Message d'information");
getLogger().warning("Message d'avertissement");
getLogger().severe("Message d'erreur");
getLogger().fine("Message de debug"); // Affiché uniquement avec le logging verbeux
```

## Bonnes Pratiques

### Organisation du Code

- **Une classe par fichier** - Gardez les classes focalisées
- **Regroupez par fonctionnalité** - Groupez les classes liées ensemble
- **Utilisez des interfaces** - Pour une meilleure testabilité
- **Injection de dépendances** - Passez les dépendances via les constructeurs

### Configuration

Fournissez toujours des valeurs par défaut et validez :

```java
public void loadConfig() {
    // Fournir des valeurs par défaut
    int maxPlayers = getConfig().getInt("max-players", 100);

    // Valider
    if (maxPlayers < 1 || maxPlayers > 1000) {
        getLogger().warning("max-players invalide, utilisation de la valeur par défaut");
        maxPlayers = 100;
    }
}
```

### Gestion des Erreurs

```java
try {
    operationRisquee();
} catch (Exception e) {
    getLogger().severe("L'opération a échoué : " + e.getMessage());
    e.printStackTrace();
    // Dégradation gracieuse
}
```

## Prochaines Étapes

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'Cycle de Vie du Plugin',
    href: '/docs/modding/plugins/plugin-lifecycle',
    description: 'Comprendre le processus de chargement des plugins'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Système d\'Événements',
    href: '/docs/modding/plugins/events',
    description: 'Apprenez à écouter et gérer les événements du jeu'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Commandes',
    href: '/docs/modding/plugins/commands',
    description: 'Créez des commandes personnalisées pour votre plugin'
  }} />
</div>
