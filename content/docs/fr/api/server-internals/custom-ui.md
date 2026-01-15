---
id: custom-ui
title: Systeme UI Personnalise
sidebar_label: UI Personnalisee
sidebar_position: 7
description: Guide complet pour creer des interfaces joueur interactives dans les plugins Hytale
---

# Systeme UI Personnalise

:::info Teste et Verifie
Cette documentation a ete testee avec un plugin fonctionnel. Les exemples sont confirmes comme fonctionnels.
:::

## Imports Requis

```java
// === Core UI Page ===
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.Value;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;

// === Codec (pour event data) ===
import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;

// === Composants ECS ===
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;

// === Player & Commande ===
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.command.system.CommandContext;
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;
import com.hypixel.hytale.server.core.universe.world.World;
import com.hypixel.hytale.server.core.Message;

// === Dropdown (optionnel) ===
import com.hypixel.hytale.server.core.ui.DropdownEntryInfo;
import com.hypixel.hytale.server.core.ui.LocalizableString;

// === Notifications (optionnel) ===
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;

// === Gestion des Pages ===
import com.hypixel.hytale.protocol.packets.interface_.Page;
```

## Vue d'ensemble

Le systeme UI personnalise permet aux plugins de creer des interfaces joueur interactives. Le systeme utilise une **architecture client-serveur** :

- **Les fichiers de layout (`.ui`)** sont stockes sur le **client** - les plugins ne peuvent pas les creer
- **Le serveur envoie des commandes** pour manipuler les elements de ces layouts
- **Les evenements remontent** du client vers le serveur quand les joueurs interagissent

```
┌─────────────────────┐                    ┌─────────────────────┐
│   Plugin Serveur    │                    │       Client        │
│                     │                    │                     │
│  InteractiveCustom  │───── Commandes ───>│  Fichiers .ui       │
│    UIPage           │                    │  (Pages/*.ui)       │
│  UICommandBuilder   │<───── Evenements ──│                     │
│  UIEventBuilder     │                    │                     │
└─────────────────────┘                    └─────────────────────┘
```

:::danger Critique : Les fichiers de layout sont cote client
**Les fichiers de layout (`.ui`) sont des assets CLIENT.** Si vous referencez un layout qui n'existe pas sur le client, vous obtiendrez :
```
Could not find document Pages/MyPage.ui for Custom UI Append command
```
Le client sera deconnecte. **Utilisez uniquement des layouts garantis d'exister.**
:::

## Fichiers de Layout Disponibles

Tous les fichiers de layout ne sont pas disponibles sur chaque client. Utilisez ces layouts **garantis surs** :

### Layouts Core Serveur (Toujours Disponibles)

| Layout | Utilise Par | Selecteurs Cles |
|--------|-------------|-----------------|
| `Pages/PluginListPage.ui` | Commande `/plugins` | `#PluginList`, `#PluginName`, `#PluginDescription` |
| `Pages/PluginListButton.ui` | Elements de liste | `#Button`, `#CheckBox` |
| `Pages/CommandListPage.ui` | Commande `/commands` | `#CommandList`, `#SubcommandCards` |
| `Pages/BasicTextButton.ui` | Diverses pages | `LabelStyle`, `SelectedLabelStyle` |
| `Common/TextButton.ui` | Composant bouton | `LabelStyle`, `SelectedLabelStyle` |

### Layouts Adventure/Builtin (Peuvent Ne Pas Etre Disponibles)

Ces layouts peuvent ne fonctionner que lorsque des packs de contenu specifiques sont charges :

| Layout | Module | Selecteurs Cles |
|--------|--------|-----------------|
| `Pages/DialogPage.ui` | Adventure Objectives | `#EntityName`, `#Dialog`, `#CloseButton` |
| `Pages/ShopPage.ui` | Adventure Shop | `#ElementList` |
| `Pages/ShopElementButton.ui` | Elements boutique | `#Icon`, `#Name`, `#Description`, `#Cost` |
| `Pages/BarterPage.ui` | Adventure Barter | `#TradeGrid`, `#TradeButton` |
| `Pages/BarterTradeRow.ui` | Elements troc | `#OutputSlot`, `#InputSlot` |
| `Pages/Memories/*.ui` | Adventure Memories | `#IconList`, `#RecordButton` |

### Layouts Outils de Construction

| Layout | Utilise Par | Selecteurs Cles |
|--------|-------------|-----------------|
| `Pages/EntitySpawnPage.ui` | Spawn NPC | `#NPCList`, `#ModelList`, `#ScaleSlider` |
| `Pages/PrefabListPage.ui` | Navigateur prefab | `#FileList` |
| `Pages/ParticleSpawnPage.ui` | Test particules | `#ParticleSystemList` |
| `Pages/ImageImportPage.ui` | Import image | Elements navigateur |

### Layouts Portail/Teleporteur

| Layout | Utilise Par | Selecteurs Cles |
|--------|-------------|-----------------|
| `Pages/PortalDeviceSummon.ui` | Invocation portail | `#Artwork`, `#Pills`, `#SummonButton` |
| `Pages/Teleporter.ui` | Config teleporteur | `#WorldDropdown`, `#WarpDropdown` |
| `Pages/WarpListPage.ui` | Liste warps | `#WarpList` |

**Recommandation** : Utilisez `Pages/PluginListPage.ui` ou `Pages/EntitySpawnPage.ui` comme layout de base - ils sont garantis de fonctionner.

## Elements UI Testes

Ces elements ont ete **testes et verifies fonctionnels** dans des plugins :

### Elements EntitySpawnPage.ui

| Element | Selecteur | Type | Proprietes |
|---------|-----------|------|------------|
| **Champ Recherche** | `#SearchInput` | Champ de saisie | `.Value`, `.PlaceholderText` |
| **Slider Scale** | `#ScaleSlider` | Slider | `.Value` (float 0-1) |
| **Slider Rotation** | `#RotationOffset` | Slider | `.Value` (float) |
| **Champ Count** | `#Count` | Champ numerique | `.Value` |
| **Boutons Onglet** | `#TabNPC`, `#TabItems`, `#TabModel` | Boutons | `.Style` |
| **Bouton Spawn** | `#Spawn` | Bouton | Evenement Activating |
| **Bouton Clear** | `#ClearMaterial` | Bouton | Evenement Activating |
| **Slot Item** | `#ItemMaterialSlot` | Slot drag-drop | Evenement Dropped |

### Elements PluginListPage.ui

| Element | Selecteur | Type | Proprietes |
|---------|-----------|------|------------|
| **Nom Plugin** | `#PluginName` | Texte | `.Text` |
| **ID Plugin** | `#PluginIdentifier` | Texte | `.Text` |
| **Version Plugin** | `#PluginVersion` | Texte | `.Text`, `.Visible` |
| **Description** | `#PluginDescription` | Texte | `.Text` |
| **Checkbox Option** | `#DescriptiveOnlyOption` | Conteneur | `.Visible` |
| **Liste Plugins** | `#PluginList` | Conteneur Liste | `.clear()`, `.append()` |

### Elements PluginListButton.ui (pour les items de liste)

| Element | Selecteur | Type | Proprietes |
|---------|-----------|------|------------|
| **Bouton** | `#Button` | Bouton | `.Text`, `.Style`, evenement Activating |
| **Checkbox** | `#CheckBox` | Checkbox | `.Value` (boolean), `.Visible`, evenement ValueChanged |

### Elements TeleporterSettingsPage.ui (Dropdowns)

| Element | Selecteur | Type | Proprietes |
|---------|-----------|------|------------|
| **Dropdown Monde** | `#WorldDropdown` | Dropdown | `.Entries`, `.Value` |
| **Dropdown Warp** | `#WarpDropdown` | Dropdown | `.Entries`, `.Value` |

### Exemple de Test Fonctionnel

Ce code teste tous les types d'elements UI principaux avec `EntitySpawnPage.ui` :

```java
public class UIComponentTestPage extends InteractiveCustomUIPage<UIComponentTestPage.TestEventData> {

    public static final String LAYOUT = "Pages/EntitySpawnPage.ui";

    private static final Value<String> TAB_STYLE_ACTIVE = Value.ref("Common.ui", "DefaultTextButtonStyle");
    private static final Value<String> TAB_STYLE_INACTIVE = Value.ref("Common.ui", "SecondaryTextButtonStyle");

    public UIComponentTestPage(@Nonnull PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, TestEventData.CODEC);
    }

    @Override
    public void build(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull UICommandBuilder commandBuilder,
            @Nonnull UIEventBuilder eventBuilder,
            @Nonnull Store<EntityStore> store
    ) {
        commandBuilder.append(LAYOUT);

        // Placeholder du champ de saisie
        commandBuilder.set("#SearchInput.PlaceholderText", "Tapez ici pour tester");

        // Valeur initiale du slider
        commandBuilder.set("#ScaleSlider.Value", 0.5f);

        // Styles des boutons onglet
        commandBuilder.set("#TabNPC.Style", TAB_STYLE_ACTIVE);
        commandBuilder.set("#TabItems.Style", TAB_STYLE_INACTIVE);
        commandBuilder.set("#TabModel.Style", TAB_STYLE_INACTIVE);

        // Evenement changement champ de saisie (capture la valeur avec @)
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.ValueChanged,
            "#SearchInput",
            new EventData().append("Action", "InputChanged").append("@Value", "#SearchInput.Value"),
            false
        );

        // Evenement changement slider
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.ValueChanged,
            "#ScaleSlider",
            new EventData().append("Action", "SliderChanged").append("@Value", "#ScaleSlider.Value"),
            false
        );

        // Evenements boutons onglet
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#TabNPC",
            new EventData().append("Action", "TabClick").append("Tab", "NPC"),
            false
        );
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#TabItems",
            new EventData().append("Action", "TabClick").append("Tab", "Items"),
            false
        );
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#TabModel",
            new EventData().append("Action", "TabClick").append("Tab", "Model"),
            false
        );

        // Evenement bouton spawn
        eventBuilder.addEventBinding(
            CustomUIEventBindingType.Activating,
            "#Spawn",
            new EventData().append("Action", "SpawnClick"),
            false
        );
    }

    @Override
    public void handleDataEvent(
            @Nonnull Ref<EntityStore> ref,
            @Nonnull Store<EntityStore> store,
            @Nonnull TestEventData data
    ) {
        UICommandBuilder commandBuilder = new UICommandBuilder();

        if ("InputChanged".equals(data.action)) {
            commandBuilder.set("#SearchInput.PlaceholderText", "Vous avez tape: " + data.value);
        }
        else if ("SliderChanged".equals(data.action)) {
            commandBuilder.set("#SearchInput.PlaceholderText", "Slider: " + data.value);
        }
        else if ("TabClick".equals(data.action)) {
            // Mettre a jour les styles des onglets
            commandBuilder.set("#TabNPC.Style", "NPC".equals(data.tab) ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE);
            commandBuilder.set("#TabItems.Style", "Items".equals(data.tab) ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE);
            commandBuilder.set("#TabModel.Style", "Model".equals(data.tab) ? TAB_STYLE_ACTIVE : TAB_STYLE_INACTIVE);
        }
        else if ("SpawnClick".equals(data.action)) {
            commandBuilder.set("#SearchInput.PlaceholderText", "Bouton Spawn clique!");
        }

        this.sendUpdate(commandBuilder, false);
    }

    public static class TestEventData {
        public static final BuilderCodec<TestEventData> CODEC = BuilderCodec.builder(
                TestEventData.class, TestEventData::new
        )
        .append(new KeyedCodec<>("Action", Codec.STRING), (e, s) -> e.action = s, e -> e.action)
        .add()
        .append(new KeyedCodec<>("Tab", Codec.STRING), (e, s) -> e.tab = s, e -> e.tab)
        .add()
        .append(new KeyedCodec<>("Value", Codec.STRING), (e, s) -> e.value = s, e -> e.value)
        .add()
        .build();

        private String action;
        private String tab;
        private String value;

        public TestEventData() {}
    }
}
```

### Exemple Dropdown (TeleporterSettingsPage)

```java
import com.hypixel.hytale.server.core.ui.DropdownEntryInfo;
import com.hypixel.hytale.server.core.message.LocalizableString;
import it.unimi.dsi.fastutil.objects.ObjectArrayList;

// Dans votre methode build() :
commandBuilder.append("Pages/Teleporter.ui");

// Creer les entrees du dropdown
ObjectArrayList<DropdownEntryInfo> options = new ObjectArrayList<>();
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 1"), "opt1"));
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 2"), "opt2"));
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 3"), "opt3"));

// Definir les entrees et la valeur selectionnee
commandBuilder.set("#WorldDropdown.Entries", options);
commandBuilder.set("#WorldDropdown.Value", "opt1");

// Ecouter les changements de selection
eventBuilder.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#WorldDropdown",
    new EventData().append("Action", "DropdownChanged").append("@Value", "#WorldDropdown.Value"),
    false
);
```

## Reference des Proprietes UI

Voici toutes les proprietes qui peuvent etre definies sur les elements UI via `commandBuilder.set()` :

### Proprietes de Texte

| Propriete | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `.Text` | String/Message | Contenu textuel | `set("#Title.Text", "Bonjour")` |
| `.TextSpans` | Message | Texte riche avec formatage | `set("#Name.TextSpans", Message.raw("Gras"))` |
| `.PlaceholderText` | String/Message | Texte indicatif du champ | `set("#Input.PlaceholderText", "Entrez un nom...")` |

### Visibilite et Etat

| Propriete | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `.Visible` | boolean | Afficher/masquer element | `set("#Panel.Visible", false)` |
| `.Disabled` | boolean | Activer/desactiver interaction | `set("#Button.Disabled", true)` |

### Valeurs et Donnees

| Propriete | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `.Value` | String/float/int | Valeur input, position slider | `set("#Slider.Value", 0.5f)` |
| `.Entries` | DropdownEntryInfo[] | Options dropdown | `set("#Dropdown.Entries", options)` |
| `.Slots` | ItemGridSlot[] | Slots inventaire | `set("#Grid.Slots", slots)` |
| `.ItemId` | String | Item a afficher | `set("#Icon.ItemId", itemId)` |

### Style et Apparence

| Propriete | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `.Style` | Value<String> | Reference de style visuel | `set("#Tab.Style", TAB_ACTIVE_STYLE)` |
| `.Color` | String (hex) | Valeur couleur | `set("#Tint.Color", "#5B9E28")` |
| `.Background` | String (chemin asset) | Image de fond | `set("#Artwork.Background", "Pages/Portals/splash.png")` |
| `.AssetPath` | String (chemin asset) | Chemin asset/icone | `set("#Icon.AssetPath", iconPath)` |

### Objets Complexes (via setObject)

Ces proprietes necessitent `commandBuilder.setObject()` :

| Type | Description | Exemple |
|------|-------------|---------|
| `LocalizableString` | Texte traduisible | `setObject("#Name.Text", LocalizableString.fromMessageId("key"))` |
| `ItemStack` | Item avec quantite | `setObject("#Slot.Item", itemStack)` |
| `ItemGridSlot` | Slot inventaire | `setObject("#Grid.Slots", slots)` |
| `PatchStyle` | Style texture/patch | `setObject("#Panel.Style", patchStyle)` |
| `DropdownEntryInfo` | Option dropdown | Utilise dans arrays pour `.Entries` |

### Exemples Selecteur + Propriete

```java
// Propriete element basique
commandBuilder.set("#PluginName.Text", "Mon Plugin");

// Propriete element imbrique
commandBuilder.set("#MainPage #Title.Text", "Bienvenue");

// Propriete element tableau
commandBuilder.set("#PluginList[0] #Button.Text", "Premier Element");

// Input avec plusieurs proprietes
commandBuilder.set("#SearchInput.Value", "");
commandBuilder.set("#SearchInput.PlaceholderText", "Rechercher...");

// Configuration dropdown
List<DropdownEntryInfo> options = new ArrayList<>();
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 1"), "opt1"));
options.add(new DropdownEntryInfo(LocalizableString.fromString("Option 2"), "opt2"));
commandBuilder.set("#Dropdown.Entries", options);
commandBuilder.set("#Dropdown.Value", "opt1");
```

## Exigences de Threading

:::warning Critique : World Thread
Les operations UI **doivent s'executer sur le world thread**. Ne pas le faire cause :
```
Assert not in thread: Expected WorldThread but was ForkJoinPool.commonPool-worker-X
```
:::

### Solution 1 : Etendre AbstractPlayerCommand (Recommande)

La facon la plus simple d'assurer un threading correct est d'etendre `AbstractPlayerCommand` :

```java
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;

public class MyUICommand extends AbstractPlayerCommand {

    public MyUICommand() {
        super("myui", "Ouvre mon UI personnalisee");
    }

    @Override
    protected void execute(
        @Nonnull CommandContext context,
        @Nonnull Store<EntityStore> store,
        @Nonnull Ref<EntityStore> ref,
        @Nonnull PlayerRef playerRef,
        @Nonnull World world
    ) {
        // Deja sur le world thread - sur d'ouvrir l'UI
        Player player = store.getComponent(ref, Player.getComponentType());
        MyCustomPage page = new MyCustomPage(playerRef);
        player.getPageManager().openCustomPage(ref, store, page);
    }
}
```

### Solution 2 : Planifier sur le World Thread

Si vous n'utilisez pas `AbstractPlayerCommand`, planifiez l'execution sur le world thread :

```java
World world = store.getExternalData().getWorld();
world.execute(() -> {
    // Sur de faire des operations UI ici
    Player player = store.getComponent(ref, Player.getComponentType());
    player.getPageManager().openCustomPage(ref, store, page);
});
```

## Creer une Page UI Personnalisee

### Etape 1 : Etendre InteractiveCustomUIPage

```java
import com.hypixel.hytale.codec.Codec;
import com.hypixel.hytale.codec.KeyedCodec;
import com.hypixel.hytale.codec.builder.BuilderCodec;
import com.hypixel.hytale.component.Ref;
import com.hypixel.hytale.component.Store;
import com.hypixel.hytale.protocol.packets.interface_.CustomPageLifetime;
import com.hypixel.hytale.protocol.packets.interface_.CustomUIEventBindingType;
import com.hypixel.hytale.protocol.packets.interface_.Page;
import com.hypixel.hytale.server.core.Message;
import com.hypixel.hytale.server.core.entity.entities.Player;
import com.hypixel.hytale.server.core.entity.entities.player.pages.InteractiveCustomUIPage;
import com.hypixel.hytale.server.core.ui.Value;
import com.hypixel.hytale.server.core.ui.builder.EventData;
import com.hypixel.hytale.server.core.ui.builder.UICommandBuilder;
import com.hypixel.hytale.server.core.ui.builder.UIEventBuilder;
import com.hypixel.hytale.server.core.universe.PlayerRef;
import com.hypixel.hytale.server.core.universe.world.storage.EntityStore;

public class MyDashboardPage extends InteractiveCustomUIPage<MyDashboardPage.MyEventData> {

    // Utiliser un layout SUR qui existe sur tous les clients
    public static final String LAYOUT = "Pages/PluginListPage.ui";

    public MyDashboardPage(@Nonnull PlayerRef playerRef) {
        super(playerRef, CustomPageLifetime.CanDismiss, MyEventData.CODEC);
    }

    @Override
    public void build(
        @Nonnull Ref<EntityStore> ref,
        @Nonnull UICommandBuilder commandBuilder,
        @Nonnull UIEventBuilder eventBuilder,
        @Nonnull Store<EntityStore> store
    ) {
        // Charger le layout
        commandBuilder.append(LAYOUT);

        // Cacher les elements dont on n'a pas besoin
        commandBuilder.set("#DescriptiveOnlyOption.Visible", false);

        // Definir le contenu du panneau d'info
        commandBuilder.set("#PluginName.Text", "Mon Tableau de Bord");
        commandBuilder.set("#PluginIdentifier.Text", "Statut: En ligne");
        commandBuilder.set("#PluginVersion.Text", "v1.0.0");
        commandBuilder.set("#PluginDescription.Text", "Bienvenue sur mon tableau de bord!");

        // Vider et remplir la liste
        commandBuilder.clear("#PluginList");

        // Ajouter des elements a la liste
        String[] items = {"Option A", "Option B", "Option C"};
        for (int i = 0; i < items.length; i++) {
            String selector = "#PluginList[" + i + "]";

            // Ajouter un bouton depuis le template
            commandBuilder.append("#PluginList", "Pages/PluginListButton.ui");

            // Definir le texte du bouton
            commandBuilder.set(selector + " #Button.Text", items[i]);

            // Cacher la checkbox (on l'utilise juste pour l'affichage)
            commandBuilder.set(selector + " #CheckBox.Visible", false);

            // Enregistrer l'evenement de clic avec des donnees
            eventBuilder.addEventBinding(
                CustomUIEventBindingType.Activating,
                selector + " #Button",
                new EventData().append("Item", items[i]).append("Index", String.valueOf(i)),
                false
            );
        }
    }

    @Override
    public void handleDataEvent(
        @Nonnull Ref<EntityStore> ref,
        @Nonnull Store<EntityStore> store,
        @Nonnull MyEventData data
    ) {
        if (data.item != null) {
            // Gerer la selection d'element
            UICommandBuilder commandBuilder = new UICommandBuilder();
            commandBuilder.set("#PluginDescription.Text", "Vous avez selectionne: " + data.item);
            this.sendUpdate(commandBuilder, false);
        }
    }

    // Classe de donnees d'evenement - doit avoir un BuilderCodec
    public static class MyEventData {
        public static final BuilderCodec<MyEventData> CODEC = BuilderCodec.builder(
            MyEventData.class, MyEventData::new
        )
        .append(new KeyedCodec<>("Item", Codec.STRING), (e, v) -> e.item = v, e -> e.item)
        .add()
        .append(new KeyedCodec<>("Index", Codec.STRING), (e, v) -> e.index = v, e -> e.index)
        .add()
        .build();

        private String item;
        private String index;

        public MyEventData() {}
    }
}
```

### Etape 2 : Creer la Commande

```java
import com.hypixel.hytale.server.core.command.system.basecommands.AbstractPlayerCommand;

public class DashboardCommand extends AbstractPlayerCommand {

    public DashboardCommand() {
        super("dashboard", "Ouvre l'UI du tableau de bord");
    }

    @Override
    protected boolean canGeneratePermission() {
        return false; // Pas de permission requise
    }

    @Override
    protected void execute(
        @Nonnull CommandContext context,
        @Nonnull Store<EntityStore> store,
        @Nonnull Ref<EntityStore> ref,
        @Nonnull PlayerRef playerRef,
        @Nonnull World world
    ) {
        Player player = store.getComponent(ref, Player.getComponentType());
        if (player == null) {
            context.sendMessage(Message.raw("Erreur: Impossible d'obtenir le joueur"));
            return;
        }

        MyDashboardPage page = new MyDashboardPage(playerRef);
        player.getPageManager().openCustomPage(ref, store, page);
        context.sendMessage(Message.raw("Tableau de bord ouvert!"));
    }
}
```

### Etape 3 : Enregistrer dans le Plugin

```java
public class MyPlugin extends JavaPlugin {

    @Override
    public void onEnable() {
        CommandRegistry commandRegistry = getCommandRegistry();
        commandRegistry.register(new DashboardCommand());
    }
}
```

## Reference UICommandBuilder

Le `UICommandBuilder` envoie des commandes pour manipuler les elements UI.

### Charger des Layouts

```java
// Charger un fichier layout (DOIT exister sur le client)
commandBuilder.append("Pages/PluginListPage.ui");

// Ajouter un layout a un conteneur
commandBuilder.append("#ListContainer", "Pages/PluginListButton.ui");
```

### Definir des Valeurs

```java
// Definir le contenu textuel
commandBuilder.set("#Title.Text", "Bonjour le monde");
commandBuilder.set("#Title.Text", Message.raw("Bonjour le monde"));
commandBuilder.set("#Title.Text", Message.translation("ma.cle.traduction"));

// Definir des proprietes booleennes
commandBuilder.set("#Panel.Visible", true);
commandBuilder.set("#Button.Disabled", false);

// Definir des valeurs numeriques
commandBuilder.set("#HealthBar.Value", 0.75f);

// Definir des styles avec Value.ref
commandBuilder.set("#Button.Style", Value.ref("Pages/BasicTextButton.ui", "SelectedLabelStyle"));
```

### Gerer les Elements

```java
// Vider tous les enfants d'un conteneur
commandBuilder.clear("#PluginList");

// Supprimer un element specifique
commandBuilder.remove("#OldItem");

// Mettre une valeur a null
commandBuilder.setNull("#OptionalField");
```

### UI Inline (Necessite un Conteneur)

```java
// Ajouter du markup UI inline a un conteneur existant
commandBuilder.appendInline("#Container", "Label { Text: Pas d'elements; Style: (Alignment: Center); }");
```

:::warning Limitations de appendInline
`appendInline()` necessite un **selecteur vers un conteneur existant**. Vous ne pouvez pas creer une page complete avec uniquement du markup inline - vous devez d'abord charger un fichier layout.
:::

## Syntaxe des Selecteurs

Les elements sont cibles avec des selecteurs de style CSS :

| Syntaxe | Exemple | Description |
|---------|---------|-------------|
| `#ID` | `#Button` | Element par ID |
| `#ID[n]` | `#List[0]` | Element de tableau par index |
| `#ID.Property` | `#Button.Text` | Propriete d'element |
| `#Parent #Child` | `#Panel #Title` | Element imbrique |
| Combine | `#List[2] #Button.Text` | Propriete enfant d'un element de tableau |

## Reference UIEventBuilder

Enregistre des bindings d'evenements pour gerer les interactions joueur.

### Types d'Evenements

| Type | Declenchement |
|------|---------------|
| `Activating` | Element clique ou Enter presse |
| `RightClicking` | Bouton droit de souris clique |
| `DoubleClicking` | Double clic |
| `ValueChanged` | Valeur modifiee (inputs, sliders, checkboxes) |
| `MouseEntered` | Souris entree dans l'element |
| `MouseExited` | Souris sortie de l'element |
| `FocusGained` | Element a obtenu le focus |
| `FocusLost` | Element a perdu le focus |

### Enregistrer des Evenements

```java
// Evenement simple (declenche handleDataEvent avec donnees vides)
eventBuilder.addEventBinding(CustomUIEventBindingType.Activating, "#CloseButton");

// Evenement avec donnees personnalisees
eventBuilder.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SaveButton",
    new EventData().append("Action", "Save").append("Tab", "Settings")
);

// Evenement non-bloquant (l'UI reste reactive)
eventBuilder.addEventBinding(
    CustomUIEventBindingType.ValueChanged,
    "#Slider",
    new EventData().append("Type", "Volume"),
    false  // locksInterface = false
);

// Capturer la valeur d'un element UI (prefixer la cle avec @)
eventBuilder.addEventBinding(
    CustomUIEventBindingType.Activating,
    "#SearchButton",
    EventData.of("@Query", "#SearchInput.Value")
);
```

## Codec EventData

Pour recevoir les donnees d'evenement, creez une classe avec un `BuilderCodec` :

```java
public static class MyEventData {
    public static final BuilderCodec<MyEventData> CODEC = BuilderCodec.builder(
        MyEventData.class, MyEventData::new
    )
    // Champ String
    .append(new KeyedCodec<>("Action", Codec.STRING),
        (data, value) -> data.action = value,
        data -> data.action)
    .add()
    // Autre champ String
    .append(new KeyedCodec<>("ItemId", Codec.STRING),
        (data, value) -> data.itemId = value,
        data -> data.itemId)
    .add()
    .build();

    private String action;
    private String itemId;

    public MyEventData() {}

    // Getters si necessaires
    public String getAction() { return action; }
    public String getItemId() { return itemId; }
}
```

## Mettre a jour l'UI

Pour mettre a jour l'UI apres le build initial, utilisez `sendUpdate()` :

```java
@Override
public void handleDataEvent(Ref<EntityStore> ref, Store<EntityStore> store, MyEventData data) {
    // Creer un nouveau command builder pour la mise a jour
    UICommandBuilder commandBuilder = new UICommandBuilder();

    // Faire des changements
    commandBuilder.set("#StatusText.Text", "Mis a jour!");
    commandBuilder.set("#Counter.Text", String.valueOf(++counter));

    // Envoyer la mise a jour (false = ne pas reconstruire les evenements)
    this.sendUpdate(commandBuilder, false);
}
```

## Fermer la Page

```java
// Depuis handleDataEvent
Player player = store.getComponent(ref, Player.getComponentType());
player.getPageManager().setPage(ref, store, Page.None);

// Ou utiliser le helper close()
this.close();
```

## CustomPageLifetime

Controle comment la page peut etre fermee :

| Lifetime | Comportement |
|----------|--------------|
| `CantClose` | L'utilisateur ne peut pas fermer la page (doit etre fermee par le code) |
| `CanDismiss` | L'utilisateur peut appuyer sur ESC pour fermer |
| `CanDismissOrCloseThroughInteraction` | ESC ou interaction avec bouton de fermeture |

## Alternative : NotificationUtil

Pour des messages simples sans pages personnalisees, utilisez les notifications :

```java
import com.hypixel.hytale.server.core.util.NotificationUtil;
import com.hypixel.hytale.protocol.packets.interface_.NotificationStyle;

NotificationUtil.sendNotification(
    playerRef.getPacketHandler(),
    Message.raw("Titre"),
    Message.raw("Sous-titre"),
    NotificationStyle.Success
);
```

### Styles de Notification

| Style | Apparence |
|-------|-----------|
| `Default` | Notification standard |
| `Success` | Vert/positif |
| `Warning` | Jaune/attention |
| `Error` | Rouge/negatif |

## Erreurs Courantes

### 1. Utiliser des Fichiers Layout Inexistants

```java
// MAUVAIS - DialogPage.ui peut ne pas exister sur tous les clients
commandBuilder.append("Pages/DialogPage.ui");

// BON - PluginListPage.ui est toujours disponible
commandBuilder.append("Pages/PluginListPage.ui");
```

### 2. Ne Pas Executer sur le World Thread

```java
// MAUVAIS - Etendre CommandBase ne garantit pas le world thread
public class MyCommand extends CommandBase { ... }

// BON - AbstractPlayerCommand gere le threading
public class MyCommand extends AbstractPlayerCommand { ... }
```

### 3. Champs Codec Manquants

```java
// MAUVAIS - Champ "Action" envoye par l'UI mais pas dans le codec
eventBuilder.addEventBinding(..., new EventData().append("Action", "Save"));
// handleDataEvent recoit null pour les champs manquants

// BON - Tous les champs declares dans le codec
.append(new KeyedCodec<>("Action", Codec.STRING), ...)
```

### 4. Utiliser appendInline Sans Layout de Base

```java
// MAUVAIS - Pas de layout de base charge d'abord
commandBuilder.appendInline("", "<panel>...</panel>");

// BON - Charger le layout d'abord, puis ajouter inline au conteneur
commandBuilder.append("Pages/PluginListPage.ui");
commandBuilder.appendInline("#SomeContainer", "Label { Text: Extra; }");
```

## Classes Source

| Classe | Package |
|--------|---------|
| `CustomUIPage` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `BasicCustomUIPage` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `InteractiveCustomUIPage` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `UICommandBuilder` | `com.hypixel.hytale.server.core.ui.builder` |
| `UIEventBuilder` | `com.hypixel.hytale.server.core.ui.builder` |
| `EventData` | `com.hypixel.hytale.server.core.ui.builder` |
| `PageManager` | `com.hypixel.hytale.server.core.entity.entities.player.pages` |
| `AbstractPlayerCommand` | `com.hypixel.hytale.server.core.command.system.basecommands` |
| `NotificationUtil` | `com.hypixel.hytale.server.core.util` |

## Implementations de Pages Integrees

Voici toutes les implementations CustomUIPage dans Hytale - utiles comme reference :

### Pages Core Serveur

| Classe | Layout | Objectif |
|--------|--------|----------|
| `PluginListPage` | `Pages/PluginListPage.ui` | Gestion plugins (`/plugins`) |
| `CommandListPage` | `Pages/CommandListPage.ui` | Aide commandes (`/commands`) |
| `RespawnPage` | `Pages/RespawnPage.ui` | Ecran mort/respawn |
| `ItemRepairPage` | `Pages/ItemRepairPage.ui` | Interface reparation |

### Pages Outils de Construction

| Classe | Layout | Objectif |
|--------|--------|----------|
| `EntitySpawnPage` | `Pages/EntitySpawnPage.ui` | Spawn NPC/entites |
| `ChangeModelPage` | `Pages/ChangeModelPage.ui` | Selection modele |
| `ParticleSpawnPage` | `Pages/ParticleSpawnPage.ui` | Test particules |
| `PrefabPage` | `Pages/PrefabListPage.ui` | Navigateur prefab |
| `ImageImportPage` | `Pages/ImageImportPage.ui` | Import image |
| `ObjImportPage` | `Pages/ObjImportPage.ui` | Import modele 3D |

### Pages Adventure

| Classe | Layout | Objectif |
|--------|--------|----------|
| `DialogPage` | `Pages/DialogPage.ui` | Dialogue NPC |
| `ShopPage` | `Pages/ShopPage.ui` | Interface boutique |
| `BarterPage` | `Pages/BarterPage.ui` | Interface echange |
| `MemoriesPage` | `Pages/Memories/*.ui` | Suivi collectibles |

### Pages Portail/Teleporteur

| Classe | Layout | Objectif |
|--------|--------|----------|
| `PortalDeviceSummonPage` | `Pages/PortalDeviceSummon.ui` | Invocation portail |
| `PortalDeviceActivePage` | `Pages/PortalDeviceActive.ui` | Affichage portail actif |
| `TeleporterSettingsPage` | `Pages/Teleporter.ui` | Config teleporteur |
| `WarpListPage` | `Pages/WarpListPage.ui` | Selection warp |

## Reference Complete des Fichiers Layout

Les 57 fichiers `.ui` trouves dans le code serveur :

### Layouts Core
- `Common.ui` - Styles et constantes globaux
- `Common/TextButton.ui` - Composant bouton reutilisable

### Repertoire Pages (55 fichiers)
- `Pages/PluginListPage.ui`, `Pages/PluginListButton.ui`
- `Pages/CommandListPage.ui`, `Pages/SubcommandCard.ui`, `Pages/VariantCard.ui`
- `Pages/DialogPage.ui`, `Pages/ShopPage.ui`, `Pages/ShopElementButton.ui`
- `Pages/BarterPage.ui`, `Pages/BarterTradeRow.ui`, `Pages/BarterGridSpacer.ui`
- `Pages/EntitySpawnPage.ui`, `Pages/ChangeModelPage.ui`
- `Pages/PrefabListPage.ui`, `Pages/PrefabSavePage.ui`
- `Pages/PortalDeviceSummon.ui`, `Pages/PortalDeviceActive.ui`, `Pages/PortalDeviceError.ui`
- `Pages/Teleporter.ui`, `Pages/WarpListPage.ui`, `Pages/WarpEntryButton.ui`
- `Pages/RespawnPage.ui`, `Pages/DroppedItemSlot.ui`
- `Pages/ItemRepairPage.ui`, `Pages/ItemRepairElement.ui`
- Et 30+ autres fichiers pour les outils de construction, instances, etc.

### Sous-repertoires
- `Pages/Memories/` - 5 fichiers pour le systeme de souvenirs
- `Pages/Portals/` - 2 fichiers pour les elements de portail
