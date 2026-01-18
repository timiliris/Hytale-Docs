---
id: intellij-plugin
title: Plugin IntelliJ IDEA
sidebar_label: Plugin IntelliJ
sidebar_position: 2
description: Plugin officiel HytaleDocs pour IntelliJ IDEA - autocomplétion, templates et outils intégrés pour le développement de plugins Hytale
---

# Plugin IntelliJ IDEA pour Hytale

Le plugin officiel HytaleDocs pour IntelliJ IDEA fournit un environnement de développement complet pour créer des plugins serveur Hytale. Il inclut des templates de projet, des live templates, la validation du manifest, et la gestion intégrée du serveur.

<div className="flex gap-3 my-6">
  <a href="https://github.com/timiliris/hytaledDocs-intelliJ-plugin/releases/latest" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
    Télécharger la Dernière Version
  </a>
  <a href="https://github.com/timiliris/hytaledDocs-intelliJ-plugin" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors">
    Voir sur GitHub
  </a>
</div>

## Fonctionnalités

### Assistant de Projet

Créez de nouveaux projets de plugins Hytale avec un assistant guidé qui configure la structure automatiquement.

- **Structure de projet complète** - Configuration Gradle, dossiers sources, ressources
- **Génération du manifest.json** - Pré-configuré avec les détails de votre plugin
- **Template de classe principale** - Point d'entrée du plugin prêt à l'emploi
- **Configuration Java 25** - Paramètres JDK corrects dès le départ

### Live Templates

Accélérez votre développement avec des snippets de code pour les patterns Hytale courants :

| Raccourci | Description |
|-----------|-------------|
| `hyevent` | Créer une méthode listener d'événement |
| `hycmd` | Créer un handler de commande |
| `hyecs` | Créer un système ECS |
| `hycomponent` | Créer un composant ECS |
| `hyui` | Créer une page Custom UI |

**Exemple - Event Listener :**
```java
// Tapez "hyevent" + Tab
@Subscribe
public void onPlayerConnect(PlayerConnectEvent event) {
    Player player = event.player();
    // Votre code ici
}
```

### Validation du Manifest

Validation en temps réel et autocomplétion pour les fichiers `manifest.json` :

- **Validation de schéma** - Détectez les erreurs avant l'exécution
- **Autocomplétion** - Tous les champs avec descriptions
- **Corrections rapides** - Corrections automatiques pour les problèmes courants
- **Liens documentation** - Liens directs vers HytaleDocs

### Configurations d'Exécution

Lancez et déboguez les serveurs Hytale directement depuis IntelliJ :

- **Démarrage en un clic** - Pas de terminal nécessaire
- **Intégration console** - Logs serveur dans l'IDE
- **Authentification OAuth** - Flux navigateur automatique
- **Auto-persistence** - Identifiants sauvegardés de manière sécurisée

### Fenêtre d'Actions Rapides

Accédez aux actions courantes depuis une fenêtre dédiée :

- Ouvrir la documentation HytaleDocs
- Créer de nouveaux événements, commandes, systèmes
- Raccourcis de gestion serveur
- Liens rapides vers les ressources utiles

## Installation

### Méthode 1 : Depuis le ZIP (Recommandé)

1. Téléchargez la dernière version depuis [GitHub Releases](https://github.com/timiliris/hytaledDocs-intelliJ-plugin/releases/latest)
2. Ouvrez IntelliJ IDEA
3. Allez dans **Settings** → **Plugins** → **⚙️** → **Install Plugin from Disk...**
4. Sélectionnez le fichier `.zip` téléchargé
5. Redémarrez IntelliJ IDEA

### Méthode 2 : Compiler depuis les Sources

```bash
git clone https://github.com/timiliris/hytaledDocs-intelliJ-plugin.git
cd hytaledDocs-intelliJ-plugin
./gradlew buildPlugin
```

Le ZIP du plugin sera dans `build/distributions/`.

## Prérequis

- **IntelliJ IDEA** 2024.3 ou ultérieur (Community ou Ultimate)
- **Java 25** (Temurin recommandé)
- **Gradle 9.x** (inclus avec les projets)

## Utilisation

### Créer un Nouveau Projet Plugin

1. Allez dans **File** → **New** → **Project...**
2. Sélectionnez **Hytale Plugin** dans la liste des générateurs
3. Remplissez les détails de votre plugin :
   - Nom du plugin
   - Nom du package
   - Auteur
   - Description
4. Cliquez sur **Create**

L'assistant va générer :
```
my-plugin/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── src/
    └── main/
        ├── java/
        │   └── com/example/myplugin/
        │       └── MyPlugin.java
        └── resources/
            └── manifest.json
```

### Lancer le Serveur

1. Ouvrez le menu déroulant **Run Configurations**
2. Sélectionnez **Hytale Server**
3. Cliquez sur **Run** ou **Debug**

Le serveur démarrera avec votre plugin chargé. Au premier lancement, une fenêtre navigateur s'ouvrira pour l'authentification OAuth.

### Utiliser les Live Templates

1. Dans un fichier Java, tapez le raccourci du template (ex: `hyevent`)
2. Appuyez sur **Tab** pour étendre
3. Remplissez les variables du template
4. Appuyez sur **Tab** pour passer entre les champs

## Changelog

### v1.2.0 - Auto-Persistence Authentication
- **Auto-Persistence** : Après l'authentification OAuth, exécute automatiquement `/auth persistence Encrypted`
- **Détection Auth Améliorée** : Ne demande que lors de l'avertissement serveur spécifique
- **Corrigé** : Parsing du format de log pour la détection d'authentification

### v1.1.0 - Support IntelliJ 2025.3
- Ajout du support pour IntelliJ IDEA 2025.3
- Compatibilité améliorée avec les versions récentes de l'IDE

### v1.0.0 - Version Initiale
- Assistant de projet pour nouveaux plugins Hytale
- Live templates (hyevent, hycmd, hyecs, etc.)
- Validation et autocomplétion du manifest.json
- Configuration d'exécution pour serveurs Hytale
- Fenêtre d'actions rapides

## Dépannage

### Plugin non visible dans l'assistant New Project

Assurez-vous d'utiliser IntelliJ IDEA 2024.3 ou ultérieur. Le plugin utilise des APIs non disponibles dans les anciennes versions.

### L'authentification serveur échoue

1. Vérifiez que votre navigateur peut ouvrir l'URL OAuth
2. Assurez-vous qu'aucun pare-feu ne bloque le callback
3. Essayez d'exécuter `/auth persistence Encrypted` manuellement dans la console

### Les live templates ne fonctionnent pas

1. Allez dans **Settings** → **Editor** → **Live Templates**
2. Vérifiez que le groupe "Hytale" est activé
3. Vérifiez que les raccourcis ne sont pas en conflit avec d'autres plugins

## Contribuer

Les contributions sont les bienvenues ! Ouvrez des issues ou des pull requests sur le [dépôt GitHub](https://github.com/timiliris/hytaledDocs-intelliJ-plugin).

## Ressources Associées

- [Guide de Développement Plugin](/docs/modding/plugins/project-setup)
- [Vue d'ensemble des Événements](/docs/modding/plugins/events/overview)
- [Système de Commandes](/docs/api/server-internals/commands)
- [Système ECS](/docs/api/server-internals/ecs)
