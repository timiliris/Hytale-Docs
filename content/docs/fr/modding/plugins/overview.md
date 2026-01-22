---
id: overview
title: Apercu des Plugins Java
sidebar_label: Apercu
sidebar_position: 1
description: Developpez des plugins Java pour les serveurs Hytale
---

# Apercu des Plugins Java

Les plugins Java offrent le moyen le plus puissant d'etendre les serveurs Hytale. Selon la [Strategie de Modding](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status) officielle, les plugins serveur sont "l'option de modding la plus puissante."

:::tip Recommande : Utilisez le Plugin IntelliJ
La facon la plus rapide de commencer a developper des plugins Hytale est avec notre **plugin IntelliJ IDEA**. Il fournit tout ce dont vous avez besoin pour creer, developper et tester des plugins efficacement.

**Avantages Cles :**
- **Configuration de projet en un clic** - Creez un projet de plugin entierement configure en quelques secondes
- **Live templates integres** - Tapez `hyevent`, `hycmd`, ou `hyecs` pour des snippets de code instantanes
- **Gestion de serveur integree** - Demarrez, arretez et surveillez les serveurs depuis votre IDE
- **Support du hot reload** - Voyez les changements sans redemarrer le serveur
- **Completion de code pour l'API Hytale** - IntelliSense complet pour toutes les classes Hytale
- **Validation du manifest.json** - Detectez les erreurs de configuration avant l'execution

[Commencer avec le Plugin IntelliJ](/docs/modding/plugins/intellij-plugin)
:::

## Qu'est-ce qu'un Plugin Hytale ?

Les plugins sont des fichiers Java `.jar` qui etendent les fonctionnalites du serveur. Ils peuvent :

- **Se connecter a l'API du serveur** - Acceder et modifier les systemes de jeu
- **Gerer les evenements** - Reagir aux actions des joueurs, aux changements du monde et aux evenements du jeu
- **Ajouter des commandes personnalisees** - Creer de nouvelles commandes pour les joueurs et les administrateurs
- **Enregistrer du contenu personnalise** - Ajouter des blocs, entites, objets et assets
- **Implementer des mecaniques de jeu** - Construire des mini-jeux, systemes RPG, plugins d'economie, et plus encore

> "Les plugins serveur sont bases sur Java (fichiers .jar). Si vous avez travaille avec des plugins Bukkit, Spigot ou Paper pour Minecraft, cette experience sera transferable."
> — [Strategie de Modding Hytale](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

## Pour Commencer

### Option 1 : Plugin IntelliJ (Recommande)

Le plugin IntelliJ IDEA est la facon la plus simple de creer des plugins Hytale :

1. Installez [IntelliJ IDEA](https://www.jetbrains.com/idea/download/) (Community ou Ultimate)
2. Installez le plugin Hytale depuis le JetBrains Marketplace
3. Utilisez **File > New > Project > Hytale Plugin** pour creer votre projet
4. Commencez a coder immediatement avec toutes les dependances configurees

[Guide Detaille de Configuration IntelliJ](/docs/modding/plugins/intellij-plugin)

### Option 2 : Configuration Manuelle

Si vous preferez une configuration manuelle ou utilisez un autre IDE :

1. Configurez un projet Gradle avec Java 25
2. Ajoutez le serveur Hytale comme dependance
3. Creez votre classe principale de plugin etendant `JavaPlugin`
4. Configurez votre `manifest.json`

[Guide de Configuration Manuelle du Projet](/docs/modding/plugins/project-setup)

## Prerequis

| Prerequis | Version | Notes |
|-----------|---------|-------|
| Java | **Java 25** | OpenJDK Temurin recommande |
| Gradle | **9.2.0** | Pour l'automatisation de build |
| IDE | IntelliJ IDEA | Fortement recommande pour le plugin Hytale |

## Demarrage Rapide : Votre Premier Plugin

Voici un plugin minimal fonctionnel pour commencer :

```java
package com.example.myplugin;

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;
import javax.annotation.Nonnull;

public class MonPremierPlugin extends JavaPlugin {

    public MonPremierPlugin(@Nonnull JavaPluginInit init) {
        super(init);
    }

    @Override
    protected void setup() {
        getLogger().info("Bonjour, Hytale !");

        // Enregistrer un ecouteur d'evenement simple
        getEventRegistry().register(PlayerJoinEvent.class, event -> {
            getLogger().info("Joueur connecte : " + event.getPlayer().getName());
        });
    }

    @Override
    protected void start() {
        getLogger().info("Le plugin fonctionne maintenant !");
    }

    @Override
    protected void shutdown() {
        getLogger().info("Arret du plugin...");
    }
}
```

Et le `manifest.json` requis :

```json
{
    "Group": "com.example",
    "Name": "MonPremierPlugin",
    "Version": "1.0.0",
    "Description": "Mon premier plugin Hytale",
    "Main": "com.example.myplugin.MonPremierPlugin"
}
```

:::info Vous utilisez le Plugin IntelliJ ?
Si vous utilisez le plugin IntelliJ, les deux fichiers sont generes automatiquement lorsque vous creez un nouveau projet. Remplissez simplement les details de votre plugin dans l'assistant !
:::

## Architecture des Plugins

### Classes Principales

Hytale utilise une hierarchie de classes a deux niveaux pour les plugins :

- **`PluginBase`** (`com.hypixel.hytale.server.core.plugin.PluginBase`) - La classe de base abstraite dont tous les plugins heritent. Implemente `CommandOwner` et fournit les fonctionnalites de base comme les registres et les methodes de cycle de vie.

- **`JavaPlugin`** (`com.hypixel.hytale.server.core.plugin.JavaPlugin`) - Etend `PluginBase` et est la classe que vous etendez lors de la creation d'un plugin. Elle ajoute la gestion des fichiers JAR et du class loader.

### Cycle de Vie du Plugin

Comprendre quand votre code s'execute est crucial :

| Etat | Description | Que faire |
|------|-------------|-----------|
| `SETUP` | Le plugin s'initialise | Enregistrer commandes, evenements, assets |
| `START` | Tous les plugins sont configures | Demarrer la logique de jeu, interagir avec d'autres plugins |
| `ENABLED` | Le plugin fonctionne | Operation normale |
| `SHUTDOWN` | Le serveur s'arrete | Nettoyer les ressources, sauvegarder les donnees |

```java
@Override
protected void setup() {
    // Appele en premier - enregistrez tout ici
    getCommandRegistry().registerCommand(new MaCommande());
    getEventRegistry().register(PlayerJoinEvent.class, this::onJoin);
}

@Override
protected void start() {
    // Appele apres que TOUS les plugins ont termine setup()
    // Sur d'interagir avec d'autres plugins ici
}

@Override
protected void shutdown() {
    // Appele quand le serveur s'arrete - nettoyez ici
    sauvegarderDonneesJoueurs();
}
```

## Concepts Cles

### Evenements

Reagissez aux choses qui se passent dans le jeu :

```java
// Ecouter les evenements des joueurs
getEventRegistry().register(PlayerJoinEvent.class, event -> {
    event.getPlayer().sendMessage("Bienvenue sur le serveur !");
});

// Ecouter avec priorite
getEventRegistry().register(EventPriority.EARLY, BlockBreakEvent.class, this::onBlockBreak);
```

[En savoir plus sur les Evenements](/docs/modding/plugins/events)

### Commandes

Ajoutez des commandes personnalisees pour les joueurs et la console :

```java
getCommandRegistry().registerCommand(new MaCommande());
```

[En savoir plus sur les Commandes](/docs/modding/plugins/commands)

### Systeme Entite-Composant (ECS)

Hytale utilise une architecture ECS pour les entites et les chunks :

```java
// Enregistrer un composant personnalise pour les entites
getEntityStoreRegistry().registerComponent(MonComposant.class, MonComposant.CODEC);

// Enregistrer un systeme qui traite les composants
EntityStore.REGISTRY.registerSystem(new MonSystemeDeTraitement());
```

[En savoir plus sur l'ECS](/docs/modding/plugins/ecs)

## Registres Disponibles

`PluginBase` fournit l'acces a plusieurs registres :

| Registre | Objectif | Methode d'Acces |
|----------|----------|-----------------|
| Registre de Commandes | Commandes joueur/console | `getCommandRegistry()` |
| Registre d'Evenements | Ecouteurs d'evenements | `getEventRegistry()` |
| Registre d'Assets | Textures, modeles, sons personnalises | `getAssetRegistry()` |
| Registre d'Etats de Blocs | Etats de blocs personnalises | `getBlockStateRegistry()` |
| Registre d'Entites | Types d'entites personnalises | `getEntityRegistry()` |
| Registre de Taches | Taches planifiees/differees | `getTaskRegistry()` |
| Registre de Chunk Store | Composants de chunks | `getChunkStoreRegistry()` |
| Registre d'Entity Store | Composants d'entites | `getEntityStoreRegistry()` |
| Registre de Client Features | Fonctionnalites cote client | `getClientFeatureRegistry()` |

## Le Fichier manifest.json

Chaque plugin necessite un fichier `manifest.json` a la racine de votre JAR :

### Champs Obligatoires

| Champ | Type | Description |
|-------|------|-------------|
| `Name` | String | Identifiant du nom du plugin (obligatoire) |

### Champs Optionnels Courants

| Champ | Type | Description |
|-------|------|-------------|
| `Group` | String | Groupe/namespace du plugin |
| `Version` | String | Version semantique (ex: "1.0.0") |
| `Description` | String | Description du plugin |
| `Main` | String | Nom complet de la classe principale |
| `Authors` | AuthorInfo[] | Tableau d'informations sur les auteurs |
| `Dependencies` | Map | Dependances de plugins requises |
| `ServerVersion` | String | Plage de versions serveur compatibles |

### Exemple Complet

```json
{
    "Group": "com.example",
    "Name": "MonPlugin",
    "Version": "1.0.0",
    "Description": "Un exemple de plugin Hytale",
    "Main": "com.example.myplugin.MonPlugin",
    "Authors": [
        {
            "Name": "Votre Nom",
            "Email": "vous@example.com",
            "Url": "https://example.com"
        }
    ],
    "ServerVersion": ">=1.0.0",
    "Dependencies": {
        "Hytale:SomeOtherPlugin": ">=2.0.0"
    }
}
```

## Installation des Plugins

1. Compilez votre JAR de plugin (avec Gradle : `./gradlew build`)
2. Placez le fichier `.jar` dans le repertoire `mods` de votre serveur
3. Demarrez ou redemarrez le serveur
4. Verifiez les logs du serveur pour confirmer que votre plugin s'est charge

:::tip Hot Reload avec IntelliJ
Le plugin IntelliJ supporte le hot reload - recompilez votre plugin et il sera automatiquement recharge sans redemarrer le serveur !
:::

## Prochaines Etapes

### Lectures Essentielles

1. [Configuration du Plugin IntelliJ](/docs/modding/plugins/intellij-plugin) - Preparez votre environnement de developpement
2. [Configuration du Projet](/docs/modding/plugins/project-setup) - Details de configuration manuelle
3. [Cycle de Vie du Plugin](/docs/modding/plugins/plugin-lifecycle) - Plongee approfondie dans les etats du cycle de vie

### Fonctionnalites de Base

4. [Evenements](/docs/modding/plugins/events) - Reagir aux evenements du jeu
5. [Commandes](/docs/modding/plugins/commands) - Creer des commandes personnalisees
6. [Systeme Entite-Composant](/docs/modding/plugins/ecs) - Travailler avec les entites et les chunks

### Sujets Avances

7. [Blocs Personnalises](/docs/modding/plugins/custom-blocks) - Ajouter de nouveaux types de blocs
8. [Entites Personnalisees](/docs/modding/plugins/custom-entities) - Creer de nouvelles entites
9. [Reseau](/docs/modding/plugins/networking) - Communication client-serveur

## Code Source du Serveur

L'equipe de developpement s'est engagee a publier le code source du serveur **1 a 2 mois apres le lancement**, permettant une comprehension plus approfondie de l'API et des contributions de la communaute.

> "Nous nous engageons a publier le code source du serveur des que nous y serons legalement autorises."
> — [Strategie de Modding Hytale](https://hytale.com/news/2025/11/hytale-modding-strategy-and-status)

### Avantages de l'Open Source

- Inspecter le fonctionnement interne des systemes
- Se debloquer en lisant l'implementation reelle
- Contribuer des ameliorations et corrections de bugs

:::info Decompilation Disponible Maintenant
Jusqu'a la publication du code source, le JAR du serveur n'est **pas obfusque** et peut etre facilement decompile. Cela vous permet d'explorer l'API en attendant que la documentation officielle rattrape son retard.
:::

## Alternative de Visual Scripting

Pour les non-programmeurs, Hytale developpe un systeme de **Visual Scripting** inspire des Blueprints d'Unreal Engine :

- Creez de la logique de jeu via une interface basee sur des noeuds
- Aucun codage requis
- Les programmeurs peuvent creer des noeuds personnalises en Java que les designers peuvent utiliser

[En savoir plus sur le Visual Scripting](/docs/modding/overview#4-visual-scripting-coming-soon)
