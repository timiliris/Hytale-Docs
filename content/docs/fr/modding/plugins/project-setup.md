---
id: project-setup
title: Configuration du Projet de Plugin
sidebar_label: Configuration du Projet
sidebar_position: 2
description: Guide complet pour configurer un projet de plugin Java Hytale avec Gradle
---

# Configuration du Projet de Plugin

Apprenez a creer un projet de plugin Hytale correctement structure en utilisant Gradle et Java 25.

:::tip Recommande : Utilisez le Plugin IntelliJ
La facon la plus simple de configurer un projet de plugin Hytale est avec le [Plugin IntelliJ Hytale](/docs/modding/plugins/intellij-plugin). Il fournit :
- **Creation de projet en un clic** avec un assistant guide
- **Configuration automatique du serveur** incluant Java 25 et telechargement du JAR serveur
- **Templates en direct** pour les motifs de code courants (`hyplugin`, `hyevent`, `hycmd`, `hyecs`)
- **Build et execution integres** avec support du hot reload

[En savoir plus sur le Plugin IntelliJ](/docs/modding/plugins/intellij-plugin)
:::

## Prerequis

Avant de commencer, assurez-vous d'avoir :

- **Java Development Kit (JDK) 25** - [Telecharger depuis Adoptium](https://adoptium.net/) (requis pour un acces complet a l'API)
- **IDE** - IntelliJ IDEA (recommande) ou Eclipse
- **Gradle 9.2.0** - Generalement inclus avec l'IDE
- **Git** - Pour le controle de version (optionnel mais recommande)

> "Les developpeurs de plugins ont besoin de Java 25 et IntelliJ IDEA pour un acces complet a l'API."
> — [Hytale Modding Strategy](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

:::tip Recommandation IDE
IntelliJ IDEA Community Edition est gratuit et offre un excellent support Java/Gradle avec des fonctionnalites comme :

- Completion de code intelligente
- Integration Gradle integree
- Support du debogueur
- Outils de developpement de plugins

Installez le [Plugin IntelliJ Hytale](/docs/modding/plugins/intellij-plugin) pour debloquer des fonctionnalites specifiques a Hytale comme les assistants de projet et les templates en direct.
:::

## Demarrage Rapide

### Option 1 : Utiliser le Plugin IntelliJ Hytale (Recommande)

La facon la plus rapide de creer un nouveau projet de plugin :

1. **File -> New -> Project**
2. Selectionnez **Hytale Plugin** dans la liste des generateurs
3. Remplissez l'assistant :
   - Nom et ID du plugin
   - Nom du package (ex : `com.example.myplugin`)
   - Selectionnez un template (Basic, Events, Commands, ou Full)
4. Cliquez sur **Create**

Le plugin va automatiquement :
- Creer la structure du projet avec tous les fichiers necessaires
- Generer `build.gradle` configure pour Java 25
- Creer `manifest.json` avec les details de votre plugin
- Telecharger le JAR du serveur Hytale dans `libs/`
- Configurer une configuration d'execution pour les tests

### Option 2 : Configuration Manuelle avec IntelliJ IDEA

1. **File -> New -> Project**
2. Selectionnez **Gradle** avec **Java**
3. Definissez le **JDK** a 25
4. Nommez votre projet (ex : `my-hytale-plugin`)
5. Cliquez sur **Create**

### Option 3 : En Ligne de Commande

```bash
# Creer le repertoire du projet
mkdir my-hytale-plugin
cd my-hytale-plugin

# Initialiser le wrapper Gradle
gradle init --type java-library --dsl groovy

# Ou avec Kotlin DSL
gradle init --type java-library --dsl kotlin
```

## Structure du Projet

Un projet de plugin bien organise ressemble a ceci :

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

Avant de pouvoir compiler votre plugin, vous devez ajouter le JAR du serveur Hytale a votre projet.

### Avec le Plugin IntelliJ (Automatique)

Le Plugin IntelliJ Hytale gere cela automatiquement lorsque vous creez un nouveau projet. Vous pouvez aussi le telecharger a tout moment via **Tools -> Hytale -> Download Server JAR**.

### Configuration Manuelle

1. **Telechargez le JAR serveur** depuis [cdn.hytale.com/HytaleServer.jar](https://cdn.hytale.com/HytaleServer.jar)
2. **Creez un dossier `libs`** a la racine de votre projet
3. **Copiez `HytaleServer.jar`** dans le dossier `libs`

```bash
mkdir libs
curl -o libs/HytaleServer.jar https://cdn.hytale.com/HytaleServer.jar
```

Le JAR serveur est utilise comme dependance `compileOnly` - il fournit les classes API pour la compilation mais n'est pas inclus dans votre plugin (le serveur possede deja ces classes au runtime).

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
    // Telechargez HytaleServer.jar depuis https://cdn.hytale.com/HytaleServer.jar
    // Placez-le dans un dossier 'libs' a la racine du projet
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
        languageVersion = JavaLanguageVersion.of(25)
    }
}

tasks.named('test') {
    useJUnitPlatform()
}

// Shadow JAR pour regrouper les dependances
shadowJar {
    archiveClassifier.set('')

    // Relocaliser les dependances pour eviter les conflits
    relocate 'com.google.gson', 'com.example.myplugin.libs.gson'
}

// Le build produit le shadow JAR par defaut
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
        languageVersion.set(JavaLanguageVersion.of(25))
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
# Parametres du projet
org.gradle.jvmargs=-Xmx2G
org.gradle.parallel=true
org.gradle.caching=true

# Versions des dependances (optionnel, pour une gestion plus facile)
guavaVersion=32.1.3-jre
```

## Manifeste du Plugin

Le fichier `manifest.json` identifie votre plugin aupres du serveur.

:::tip Fonctionnalite du Plugin IntelliJ
Le Plugin IntelliJ Hytale fournit la **validation de manifest.json** et l'**autocompletion**. Il vous avertira des champs requis manquants et suggerera des valeurs valides.
:::

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
      "description": "Acces admin complet",
      "default": "op"
    },
    "myplugin.use": {
      "description": "Permission d'utilisation basique",
      "default": true
    }
  }
}
```

### Proprietes du Manifeste

| Propriete | Requis | Description |
|-----------|--------|-------------|
| `id` | Oui | Identifiant unique du plugin (minuscules, sans espaces) |
| `name` | Oui | Nom d'affichage du plugin |
| `version` | Oui | Version semantique (ex : "1.0.0") |
| `main` | Oui | Nom de classe principale entierement qualifie |
| `api_version` | Oui | Version minimale de l'API Hytale requise |
| `description` | Non | Breve description |
| `authors` | Non | Liste des noms d'auteurs |
| `dependencies` | Non | Dependances du plugin |
| `load_order` | Non | Quand charger (STARTUP, POSTWORLD) |
| `permissions` | Non | Noeuds de permission utilises par votre plugin |

## Classe Principale du Plugin

Creez votre classe point d'entree. Les plugins doivent etendre `JavaPlugin` et avoir un constructeur qui prend `JavaPluginInit`.

### Avec le Plugin IntelliJ

Tapez `hyplugin` et appuyez sur **Tab** pour etendre le template en direct, puis remplissez le nom de votre classe.

### Implementation Manuelle

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import com.example.myplugin.commands.MyCommand;
import com.example.myplugin.listeners.PlayerListener;

import javax.annotation.Nonnull;

public class MyPlugin extends JavaPlugin {

    private static MyPlugin instance;

    // Constructeur requis - doit prendre un parametre JavaPluginInit
    public MyPlugin(@Nonnull JavaPluginInit init) {
        super(init);
        instance = this;
    }

    @Override
    protected void setup() {
        // Appele pendant l'initialisation du plugin
        // Enregistrez les commandes, evenements, assets et composants ici
        getLogger().info("MyPlugin is setting up...");

        // Enregistrer les listeners d'evenements
        // Astuce : Utilisez le template 'hyevent' dans IntelliJ pour creer rapidement des gestionnaires d'evenements
        getEventRegistry().register(
            com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent.class,
            event -> {
                getLogger().info("Player connected: " + event.getPlayer().getName());
            }
        );

        // Enregistrer les commandes
        // Astuce : Utilisez le template 'hycmd' dans IntelliJ pour creer rapidement des commandes
        getCommandRegistry().registerCommand(new MyCommand(this));

        getLogger().info("MyPlugin setup complete!");
    }

    @Override
    protected void start() {
        // Appele apres que tous les plugins sont configures
        // Effectuez toute logique de demarrage qui depend d'autres plugins
        getLogger().info("MyPlugin has started!");
    }

    @Override
    protected void shutdown() {
        // Appele lors de l'arret du plugin
        // Effectuez le nettoyage avant que les registres soient nettoyes
        getLogger().info("MyPlugin is shutting down...");
    }

    public static MyPlugin getInstance() {
        return instance;
    }
}
```

### Templates en Direct Disponibles

Le Plugin IntelliJ Hytale fournit plusieurs templates en direct pour accelerer le developpement :

| Template | Description |
|----------|-------------|
| `hyplugin` | Generer une classe principale de plugin complete |
| `hyevent` | Creer un enregistrement de listener d'evenement |
| `hycmd` | Creer une classe de commande |
| `hyecs` | Creer une classe de systeme ECS |
| `hycomp` | Creer une classe de composant ECS |

## Compiler Votre Plugin

### Ligne de Commande

```bash
# Compiler le JAR du plugin
./gradlew build

# Nettoyer et recompiler
./gradlew clean build

# Executer les tests
./gradlew test

# Generer le shadow JAR avec les dependances
./gradlew shadowJar
```

### IntelliJ IDEA

1. Ouvrez la fenetre d'outil **Gradle** (View -> Tool Windows -> Gradle)
2. Naviguez vers **Tasks -> build**
3. Double-cliquez sur **build** ou **shadowJar**

### Emplacement de Sortie

Votre plugin compile sera a :

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

Redemarrez le serveur pour charger votre plugin.

## Workflow de Developpement

### Avec le Plugin IntelliJ (Recommande)

Le Plugin IntelliJ Hytale fournit un workflow de developpement integre avec hot reload :

1. **Lancez votre serveur** en utilisant la configuration d'execution pre-configuree (bouton play vert)
2. **Faites des modifications** au code de votre plugin
3. **Appuyez sur Ctrl+F9** (Build Project) pour reconstruire
4. Le plugin se deploie automatiquement dans le dossier plugins du serveur
5. **Utilisez `/reload`** dans la console du serveur pour recharger les plugins sans redemarrage

Vous pouvez aussi :
- Utiliser **Tools -> Hytale -> Build and Deploy** pour un deploiement en un clic
- Voir la sortie du build dans la fenetre d'outil Hytale
- Voir les logs du serveur en temps reel dans la console integree

### Workflow Manuel

Pour une iteration plus rapide pendant le developpement :

```bash
# Compiler et copier vers le serveur en une commande
./gradlew build && cp build/libs/*.jar ../hytale-server/plugins/
```

Ou creez une tache Gradle :

```groovy
task deploy(type: Copy, dependsOn: shadowJar) {
    from shadowJar.archiveFile
    into '../hytale-server/plugins'
}
```

Puis executez : `./gradlew deploy`

### Debogage

#### Avec le Plugin IntelliJ

1. Utilisez la configuration d'execution **Hytale Server (Debug)**
2. Placez des points d'arret dans votre code
3. Cliquez sur le bouton debug (icone de bug)
4. Le serveur demarre avec le debogage active et IntelliJ s'attache automatiquement

#### Debogage Manuel

1. Demarrez le serveur avec les flags de debug :
```bash
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005 -jar hytale-server.jar
```

2. Dans IntelliJ : **Run -> Attach to Process** ou creez une configuration **Remote JVM Debug**

### Logging

Utilisez le logger du plugin pour la sortie de debug :

```java
getLogger().info("Message d'information");
getLogger().warning("Message d'avertissement");
getLogger().severe("Message d'erreur");
getLogger().fine("Message de debug"); // Affiche uniquement avec le logging verbeux
```

## Bonnes Pratiques

### Organisation du Code

- **Une classe par fichier** - Gardez les classes focalisees
- **Regroupez par fonctionnalite** - Groupez les classes liees ensemble
- **Utilisez des interfaces** - Pour une meilleure testabilite
- **Injection de dependances** - Passez les dependances via les constructeurs

### Configuration

Fournissez toujours des valeurs par defaut et validez :

```java
public void loadConfig() {
    // Fournir des valeurs par defaut
    int maxPlayers = getConfig().getInt("max-players", 100);

    // Valider
    if (maxPlayers < 1 || maxPlayers > 1000) {
        getLogger().warning("max-players invalide, utilisation de la valeur par defaut");
        maxPlayers = 100;
    }
}
```

### Gestion des Erreurs

```java
try {
    operationRisquee();
} catch (Exception e) {
    getLogger().severe("L'operation a echoue : " + e.getMessage());
    e.printStackTrace();
    // Degradation gracieuse
}
```

## Prochaines Etapes

<div className="doc-card-grid">
  <DocCard item={{
    type: 'link',
    label: 'Plugin IntelliJ',
    href: '/docs/modding/plugins/intellij-plugin',
    description: 'Configurez le Plugin IntelliJ Hytale pour un developpement ameliore'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Cycle de Vie du Plugin',
    href: '/docs/modding/plugins/plugin-lifecycle',
    description: 'Comprendre le processus de chargement des plugins'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Systeme d\'Evenements',
    href: '/docs/modding/plugins/events',
    description: 'Apprenez a ecouter et gerer les evenements du jeu'
  }} />
  <DocCard item={{
    type: 'link',
    label: 'Commandes',
    href: '/docs/modding/plugins/commands',
    description: 'Creez des commandes personnalisees pour votre plugin'
  }} />
</div>
