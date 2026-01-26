export interface SidebarItem {
  titleKey: string;
  href?: string;
  items?: SidebarItem[];
  /** Mark as verified/tested with a real plugin */
  verified?: boolean;
  /** Mark as non-functional (event exists but never fires) */
  nonFunctional?: boolean;
  /** Audience badge for visual categorization */
  audience?: "player" | "creator" | "developer" | "admin";
}

export interface BreadcrumbPath {
  titleKey: string;
  href?: string;
}

export interface VerificationStatus {
  verified: boolean;
  nonFunctional: boolean;
  /** True if the item is in the events section (should show untested warning if not verified) */
  isEventPage: boolean;
  /** True if the item was found in the sidebar */
  found: boolean;
}

/**
 * Find the verification status for a given href in the sidebar structure
 */
export function getVerificationStatus(href: string): VerificationStatus {
  function search(items: SidebarItem[], inEventsSection: boolean): VerificationStatus | null {
    for (const item of items) {
      const isInEvents = inEventsSection || item.titleKey === "eventsReference";

      if (item.href === href) {
        return {
          verified: item.verified === true,
          nonFunctional: item.nonFunctional === true,
          isEventPage: isInEvents,
          found: true,
        };
      }

      if (item.items) {
        const result = search(item.items, isInEvents);
        if (result) return result;
      }
    }
    return null;
  }

  const result = search(sidebarConfig, false);
  return result || { verified: false, nonFunctional: false, isEventPage: false, found: false };
}

/**
 * Find the breadcrumb path for a given href in the sidebar structure
 */
export function findBreadcrumbPath(href: string): BreadcrumbPath[] {
  function search(items: SidebarItem[], path: BreadcrumbPath[]): BreadcrumbPath[] | null {
    for (const item of items) {
      const currentPath = [...path, { titleKey: item.titleKey, href: item.href }];

      if (item.href === href) {
        return currentPath;
      }

      if (item.items) {
        const result = search(item.items, currentPath);
        if (result) return result;
      }
    }
    return null;
  }

  return search(sidebarConfig, []) || [];
}

/**
 * Events metadata for the filterable events reference page
 * Includes all events with their category, status, and properties
 */
export interface EventMetadata {
  name: string;
  titleKey: string;
  href: string;
  category: "player" | "block" | "world" | "chunk" | "server" | "entity" | "permission" | "inventory" | "prefab" | "damage" | "zone" | "asset" | "npc" | "adventure" | "i18n" | "singleplayer";
  verified: boolean;
  nonFunctional: boolean;
  cancellable: boolean;
  async: boolean;
  ecsEvent: boolean;
}

export const eventsMetadata: EventMetadata[] = [
  // Player Events
  { name: "PlayerConnectEvent", titleKey: "playerConnectEvent", href: "/docs/modding/plugins/events/player/player-connect-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PlayerDisconnectEvent", titleKey: "playerDisconnectEvent", href: "/docs/modding/plugins/events/player/player-disconnect-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PlayerChatEvent", titleKey: "playerChatEvent", href: "/docs/modding/plugins/events/player/player-chat-event", category: "player", verified: true, nonFunctional: false, cancellable: true, async: true, ecsEvent: false },
  { name: "PlayerSetupConnectEvent", titleKey: "playerSetupConnectEvent", href: "/docs/modding/plugins/events/player/player-setup-connect-event", category: "player", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: false },
  { name: "PlayerSetupDisconnectEvent", titleKey: "playerSetupDisconnectEvent", href: "/docs/modding/plugins/events/player/player-setup-disconnect-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PlayerReadyEvent", titleKey: "playerReadyEvent", href: "/docs/modding/plugins/events/player/player-ready-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PlayerMouseButtonEvent", titleKey: "playerMouseButtonEvent", href: "/docs/modding/plugins/events/player/player-mouse-button-event", category: "player", verified: false, nonFunctional: true, cancellable: true, async: false, ecsEvent: false },
  { name: "PlayerMouseMotionEvent", titleKey: "playerMouseMotionEvent", href: "/docs/modding/plugins/events/player/player-mouse-motion-event", category: "player", verified: false, nonFunctional: true, cancellable: true, async: false, ecsEvent: false },
  { name: "AddPlayerToWorldEvent", titleKey: "addPlayerToWorldEvent", href: "/docs/modding/plugins/events/player/add-player-to-world-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "DrainPlayerFromWorldEvent", titleKey: "drainPlayerFromWorldEvent", href: "/docs/modding/plugins/events/player/drain-player-from-world-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PlayerInteractEvent", titleKey: "playerInteractEvent", href: "/docs/modding/plugins/events/player/player-interact-event", category: "player", verified: false, nonFunctional: true, cancellable: true, async: false, ecsEvent: false },
  { name: "PlayerCraftEvent", titleKey: "playerCraftEvent", href: "/docs/modding/plugins/events/player/player-craft-event", category: "player", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "ChangeGameModeEvent", titleKey: "changeGameModeEvent", href: "/docs/modding/plugins/events/player/change-game-mode-event", category: "player", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // Block Events
  { name: "BreakBlockEvent", titleKey: "breakBlockEvent", href: "/docs/modding/plugins/events/block/break-block-event", category: "block", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "PlaceBlockEvent", titleKey: "placeBlockEvent", href: "/docs/modding/plugins/events/block/place-block-event", category: "block", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "DamageBlockEvent", titleKey: "damageBlockEvent", href: "/docs/modding/plugins/events/block/damage-block-event", category: "block", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "UseBlockEvent", titleKey: "useBlockEvent", href: "/docs/modding/plugins/events/block/use-block-event", category: "block", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // World Events
  { name: "AddWorldEvent", titleKey: "addWorldEvent", href: "/docs/modding/plugins/events/world/add-world-event", category: "world", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: false },
  { name: "RemoveWorldEvent", titleKey: "removeWorldEvent", href: "/docs/modding/plugins/events/world/remove-world-event", category: "world", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: false },
  { name: "StartWorldEvent", titleKey: "startWorldEvent", href: "/docs/modding/plugins/events/world/start-world-event", category: "world", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "AllWorldsLoadedEvent", titleKey: "allWorldsLoadedEvent", href: "/docs/modding/plugins/events/world/all-worlds-loaded-event", category: "world", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "MoonPhaseChangeEvent", titleKey: "moonPhaseChangeEvent", href: "/docs/modding/plugins/events/world/moon-phase-change-event", category: "world", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: true },
  { name: "WorldPathChangedEvent", titleKey: "worldPathChangedEvent", href: "/docs/modding/plugins/events/world/world-path-changed-event", category: "world", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // Chunk Events
  { name: "ChunkPreLoadProcessEvent", titleKey: "chunkPreLoadProcessEvent", href: "/docs/modding/plugins/events/chunk/chunk-pre-load-process-event", category: "chunk", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "ChunkSaveEvent", titleKey: "chunkSaveEvent", href: "/docs/modding/plugins/events/chunk/chunk-save-event", category: "chunk", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "ChunkUnloadEvent", titleKey: "chunkUnloadEvent", href: "/docs/modding/plugins/events/chunk/chunk-unload-event", category: "chunk", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // Server Events
  { name: "BootEvent", titleKey: "bootEvent", href: "/docs/modding/plugins/events/server/boot-event", category: "server", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "ShutdownEvent", titleKey: "shutdownEvent", href: "/docs/modding/plugins/events/server/shutdown-event", category: "server", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PluginSetupEvent", titleKey: "pluginSetupEvent", href: "/docs/modding/plugins/events/server/plugin-setup-event", category: "server", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // Entity Events
  { name: "EntityRemoveEvent", titleKey: "entityRemoveEvent", href: "/docs/modding/plugins/events/entity/entity-remove-event", category: "entity", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "LivingEntityInventoryChangeEvent", titleKey: "livingEntityInventoryChangeEvent", href: "/docs/modding/plugins/events/entity/living-entity-inventory-change-event", category: "entity", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // Permission Events
  { name: "PlayerPermissionChangeEvent", titleKey: "playerPermissionChangeEvent", href: "/docs/modding/plugins/events/permission/player-permission-change-event", category: "permission", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "GroupPermissionChangeEvent", titleKey: "groupPermissionChangeEvent", href: "/docs/modding/plugins/events/permission/group-permission-change-event", category: "permission", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "PlayerGroupEvent", titleKey: "playerGroupEvent", href: "/docs/modding/plugins/events/permission/player-group-event", category: "permission", verified: true, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // Inventory Events
  { name: "DropItemEvent", titleKey: "dropItemEvent", href: "/docs/modding/plugins/events/inventory/drop-item-event", category: "inventory", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "SwitchActiveSlotEvent", titleKey: "switchActiveSlotEvent", href: "/docs/modding/plugins/events/inventory/switch-active-slot-event", category: "inventory", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "InteractivelyPickupItemEvent", titleKey: "interactivelyPickupItemEvent", href: "/docs/modding/plugins/events/inventory/interactively-pickup-item-event", category: "inventory", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "CraftRecipeEvent", titleKey: "craftRecipeEvent", href: "/docs/modding/plugins/events/inventory/craft-recipe-event", category: "inventory", verified: true, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // Prefab Events
  { name: "PrefabPlaceEntityEvent", titleKey: "prefabPlaceEntityEvent", href: "/docs/modding/plugins/events/prefab/prefab-place-entity-event", category: "prefab", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: true },
  { name: "PrefabPasteEvent", titleKey: "prefabPasteEvent", href: "/docs/modding/plugins/events/prefab/prefab-paste-event", category: "prefab", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // Damage Events
  { name: "KillFeedEvent", titleKey: "killFeedEvent", href: "/docs/modding/plugins/events/damage/kill-feed-event", category: "damage", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "DamageEvent", titleKey: "damageEvent", href: "/docs/modding/plugins/events/damage/damage-event", category: "damage", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // Zone Events
  { name: "DiscoverInstanceEvent", titleKey: "discoverInstanceEvent", href: "/docs/modding/plugins/events/instance/discover-instance-event", category: "zone", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },
  { name: "DiscoverZoneEvent", titleKey: "discoverZoneEvent", href: "/docs/modding/plugins/events/zone/discover-zone-event", category: "zone", verified: false, nonFunctional: false, cancellable: true, async: false, ecsEvent: true },

  // Asset Events
  { name: "RegisterAssetStoreEvent", titleKey: "registerAssetStoreEvent", href: "/docs/modding/plugins/events/asset/register-asset-store-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "RemoveAssetStoreEvent", titleKey: "removeAssetStoreEvent", href: "/docs/modding/plugins/events/asset/remove-asset-store-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "LoadedAssetsEvent", titleKey: "loadedAssetsEvent", href: "/docs/modding/plugins/events/asset/loaded-assets-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "RemovedAssetsEvent", titleKey: "removedAssetsEvent", href: "/docs/modding/plugins/events/asset/removed-assets-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "GenerateAssetsEvent", titleKey: "generateAssetsEvent", href: "/docs/modding/plugins/events/asset/generate-assets-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "AssetStoreMonitorEvent", titleKey: "assetStoreMonitorEvent", href: "/docs/modding/plugins/events/asset/asset-store-monitor-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "AssetPackRegisterEvent", titleKey: "assetPackRegisterEvent", href: "/docs/modding/plugins/events/asset/asset-pack-register-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "AssetPackUnregisterEvent", titleKey: "assetPackUnregisterEvent", href: "/docs/modding/plugins/events/asset/asset-pack-unregister-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "LoadAssetEvent", titleKey: "loadAssetEvent", href: "/docs/modding/plugins/events/asset/load-asset-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "GenerateSchemaEvent", titleKey: "generateSchemaEvent", href: "/docs/modding/plugins/events/asset/generate-schema-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "SendCommonAssetsEvent", titleKey: "sendCommonAssetsEvent", href: "/docs/modding/plugins/events/asset/send-common-assets-event", category: "asset", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // NPC Events
  { name: "EntityEventType", titleKey: "entityEventType", href: "/docs/modding/plugins/events/npc/entity-event-type", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "BlockEventType", titleKey: "blockEventType", href: "/docs/modding/plugins/events/npc/block-event-type", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "EntityEventView", titleKey: "entityEventView", href: "/docs/modding/plugins/events/npc/entity-event-view", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "BlockEventView", titleKey: "blockEventView", href: "/docs/modding/plugins/events/npc/block-event-view", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "EventNotification", titleKey: "eventNotification", href: "/docs/modding/plugins/events/npc/event-notification", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "EntityEventNotification", titleKey: "entityEventNotification", href: "/docs/modding/plugins/events/npc/entity-event-notification", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "AllNpcsLoadedEvent", titleKey: "allNpcsLoadedEvent", href: "/docs/modding/plugins/events/npc/all-npcs-loaded-event", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "LoadedNpcEvent", titleKey: "loadedNpcEvent", href: "/docs/modding/plugins/events/npc/loaded-npc-event", category: "npc", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // Adventure Events
  { name: "TreasureChestOpeningEvent", titleKey: "treasureChestOpeningEvent", href: "/docs/modding/plugins/events/adventure/treasure-chest-opening-event", category: "adventure", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // I18n Events
  { name: "GenerateDefaultLanguageEvent", titleKey: "generateDefaultLanguageEvent", href: "/docs/modding/plugins/events/i18n/generate-default-language-event", category: "i18n", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
  { name: "MessagesUpdatedEvent", titleKey: "messagesUpdatedEvent", href: "/docs/modding/plugins/events/i18n/messages-updated-event", category: "i18n", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },

  // Singleplayer Events
  { name: "SingleplayerRequestAccessEvent", titleKey: "singleplayerRequestAccessEvent", href: "/docs/modding/plugins/events/singleplayer/singleplayer-request-access-event", category: "singleplayer", verified: false, nonFunctional: false, cancellable: false, async: false, ecsEvent: false },
];

/**
 * Main sidebar configuration with new simplified 7-section structure
 * Max depth: 3 levels (Category > Subcategory > Item)
 */
export const sidebarConfig: SidebarItem[] = [
  // 1. Introduction
  { titleKey: "introduction", href: "/docs/intro" },

  // 2. Player Guide
  {
    titleKey: "playerGuide",
    audience: "player",
    items: [
      { titleKey: "overview", href: "/docs/gameplay/overview", verified: true },
      { titleKey: "beginnersGuide", href: "/docs/guides/beginners-guide" },
      { titleKey: "faq", href: "/docs/getting-started/faq" },
      { titleKey: "systemRequirements", href: "/docs/getting-started/system-requirements" },
      { titleKey: "hytaleVsMinecraft", href: "/docs/getting-started/hytale-vs-minecraft" },
      { titleKey: "troubleshooting", href: "/docs/getting-started/known-issues" },
      {
        titleKey: "gettingStarted",
        items: [
          { titleKey: "firstSteps", href: "/docs/gameplay/getting-started/first-steps" },
          { titleKey: "controls", href: "/docs/gameplay/getting-started/controls" },
          { titleKey: "interface", href: "/docs/gameplay/getting-started/interface" },
        ],
      },
      {
        titleKey: "theWorld",
        items: [
          { titleKey: "overview", href: "/docs/gameplay/world/overview" },
          { titleKey: "worldZones", href: "/docs/gameplay/world-zones" },
          { titleKey: "regions", href: "/docs/gameplay/world/regions" },
        ],
      },
      {
        titleKey: "combat",
        items: [
          { titleKey: "combatSystem", href: "/docs/gameplay/combat/overview" },
          { titleKey: "weapons", href: "/docs/gameplay/combat/weapons" },
          { titleKey: "magic", href: "/docs/gameplay/combat/magic" },
        ],
      },
      {
        titleKey: "creatures",
        items: [
          { titleKey: "overview", href: "/docs/gameplay/creatures/overview" },
          { titleKey: "hostileCreatures", href: "/docs/gameplay/creatures/hostile" },
        ],
      },
      {
        titleKey: "crafting",
        items: [
          { titleKey: "craftingGuide", href: "/docs/gameplay/crafting-guide" },
          { titleKey: "itemsDatabase", href: "/docs/gameplay/items-database" },
        ],
      },
      { titleKey: "performanceOptimization", href: "/docs/guides/performance-optimization" },
    ],
  },

  // 3. Content Creation
  {
    titleKey: "contentCreation",
    audience: "creator",
    items: [
      { titleKey: "overview", href: "/docs/modding/overview", verified: true },
      { titleKey: "architecture", href: "/docs/modding/architecture" },
      {
        titleKey: "dataAssets",
        items: [
          { titleKey: "overview", href: "/docs/modding/data-assets/overview", verified: true },
          {
            titleKey: "blocks",
            items: [
              { titleKey: "overview", href: "/docs/modding/data-assets/blocks/overview" },
              { titleKey: "creatingBlocks", href: "/docs/modding/data-assets/blocks/creating-blocks" },
              { titleKey: "blockProperties", href: "/docs/modding/data-assets/blocks/properties" },
              { titleKey: "blockBehaviors", href: "/docs/modding/data-assets/blocks/behaviors" },
            ],
          },
          {
            titleKey: "items",
            items: [
              { titleKey: "overview", href: "/docs/modding/data-assets/items/overview" },
              { titleKey: "creatingItems", href: "/docs/modding/data-assets/items/creating-items" },
              { titleKey: "itemTypes", href: "/docs/modding/data-assets/items/item-types" },
              { titleKey: "itemProperties", href: "/docs/modding/data-assets/items/properties" },
              { titleKey: "itemBehaviors", href: "/docs/modding/data-assets/items/behaviors" },
              { titleKey: "craftingRecipes", href: "/docs/modding/data-assets/items/crafting-recipes" },
            ],
          },
          {
            titleKey: "npcs",
            items: [
              { titleKey: "overview", href: "/docs/modding/data-assets/npcs/overview" },
              { titleKey: "creatingNpcs", href: "/docs/modding/data-assets/npcs/creating-npcs" },
              { titleKey: "npcBehaviors", href: "/docs/modding/data-assets/npcs/behaviors" },
              { titleKey: "aiSystem", href: "/docs/modding/data-assets/npcs/ai-system" },
              { titleKey: "sensorsActions", href: "/docs/modding/data-assets/npcs/sensors-actions" },
            ],
          },
        ],
      },
      {
        titleKey: "artAssets",
        items: [
          { titleKey: "overview", href: "/docs/modding/art-assets/overview" },
          { titleKey: "models", href: "/docs/modding/art-assets/models" },
          { titleKey: "textures", href: "/docs/modding/art-assets/textures" },
          { titleKey: "animations", href: "/docs/modding/art-assets/animations" },
        ],
      },
      {
        titleKey: "tools",
        items: [
          { titleKey: "overview", href: "/docs/tools/overview", verified: true },
          {
            titleKey: "assetEditor",
            items: [
              { titleKey: "overview", href: "/docs/tools/asset-editor/overview" },
              { titleKey: "editingData", href: "/docs/tools/asset-editor/editing-data" },
            ],
          },
          {
            titleKey: "blockbench",
            items: [
              { titleKey: "installation", href: "/docs/tools/blockbench/installation" },
              { titleKey: "modeling", href: "/docs/tools/blockbench/modeling" },
              { titleKey: "animation", href: "/docs/tools/blockbench/animation" },
              { titleKey: "pluginSetup", href: "/docs/tools/blockbench/plugin-setup" },
            ],
          },
          { titleKey: "creativeMode", href: "/docs/tools/creative-mode" },
          { titleKey: "machinima", href: "/docs/tools/machinima" },
        ],
      },
      {
        titleKey: "guides",
        items: [
          { titleKey: "firstBlock", href: "/docs/guides/first-block" },
          { titleKey: "firstItem", href: "/docs/guides/first-item" },
          { titleKey: "firstNpc", href: "/docs/guides/first-npc" },
          { titleKey: "customBiome", href: "/docs/guides/custom-biome" },
        ],
      },
    ],
  },

  // 4. Plugin Development
  {
    titleKey: "pluginDevelopment",
    audience: "developer",
    items: [
      { titleKey: "overview", href: "/docs/modding/plugins/overview", verified: true },
      { titleKey: "intellijPlugin", href: "/docs/modding/plugins/intellij-plugin", verified: true },
      { titleKey: "projectSetup", href: "/docs/modding/plugins/project-setup", verified: true },
      { titleKey: "pluginLifecycle", href: "/docs/modding/plugins/plugin-lifecycle", verified: true },
      { titleKey: "eventsReference", href: "/docs/plugins/events", verified: true },
      { titleKey: "commands", href: "/docs/modding/plugins/commands" },
      { titleKey: "ecsSystem", href: "/docs/api/server-internals/ecs" },
      {
        titleKey: "devGettingStarted",
        items: [
          { titleKey: "introduction", href: "/docs/getting-started/introduction" },
          { titleKey: "prerequisites", href: "/docs/getting-started/prerequisites" },
          { titleKey: "environmentSetup", href: "/docs/getting-started/environment-setup" },
          { titleKey: "firstMod", href: "/docs/getting-started/first-mod" },
          { titleKey: "firstModQuick", href: "/docs/guides/first-mod-quick" },
        ],
      },
    ],
  },

  // 5. Server Administration
  {
    titleKey: "serverAdministration",
    audience: "admin",
    items: [
      { titleKey: "overview", href: "/docs/servers/overview", verified: true },
      { titleKey: "networkProtocol", href: "/docs/servers/network-protocol" },
      {
        titleKey: "setup",
        items: [
          { titleKey: "requirements", href: "/docs/servers/setup/requirements" },
          { titleKey: "installation", href: "/docs/servers/setup/installation" },
          { titleKey: "configuration", href: "/docs/servers/setup/configuration" },
          { titleKey: "authentication", href: "/docs/servers/setup/authentication" },
        ],
      },
      {
        titleKey: "administration",
        items: [
          { titleKey: "commands", href: "/docs/servers/administration/commands" },
          { titleKey: "permissions", href: "/docs/servers/administration/permissions" },
          { titleKey: "whitelist", href: "/docs/servers/administration/whitelist" },
        ],
      },
      {
        titleKey: "hosting",
        items: [
          { titleKey: "selfHosting", href: "/docs/servers/hosting/self-hosting" },
          { titleKey: "budgetHosting", href: "/docs/servers/budget-hosting" },
          { titleKey: "docker", href: "/docs/servers/hosting/docker" },
          { titleKey: "cloudProviders", href: "/docs/servers/hosting/providers" },
        ],
      },
    ],
  },

  // 6. API Reference
  {
    titleKey: "apiReference",
    audience: "developer",
    items: [
      { titleKey: "overview", href: "/docs/api/server-internals" },
      { titleKey: "pluginSystem", href: "/docs/api/server-internals/plugins" },
      { titleKey: "playerApi", href: "/docs/api/server-internals/player" },
      { titleKey: "worldApi", href: "/docs/api/server-internals/world" },
      {
        titleKey: "modules",
        items: [
          { titleKey: "overview", href: "/docs/api/server-internals/modules" },
          { titleKey: "damageSystem", href: "/docs/api/server-internals/modules/damage-system" },
          { titleKey: "craftingSystem", href: "/docs/api/server-internals/modules/crafting-system" },
          { titleKey: "effectsSystem", href: "/docs/api/server-internals/modules/effects-system" },
          { titleKey: "entityStats", href: "/docs/api/server-internals/modules/entity-stats" },
          { titleKey: "accessControl", href: "/docs/api/server-internals/modules/access-control" },
          { titleKey: "interactions", href: "/docs/api/server-internals/modules/interactions" },
          { titleKey: "timeSystem", href: "/docs/api/server-internals/modules/time-system" },
          { titleKey: "projectiles", href: "/docs/api/server-internals/modules/projectiles" },
          { titleKey: "blockHealth", href: "/docs/api/server-internals/modules/block-health" },
          { titleKey: "collisionSystem", href: "/docs/api/server-internals/modules/collision-system" },
          { titleKey: "staminaSystem", href: "/docs/api/server-internals/modules/stamina-system" },
          { titleKey: "prefabSystem", href: "/docs/api/server-internals/modules/prefab-system" },
          { titleKey: "entityUI", href: "/docs/api/server-internals/modules/entity-ui" },
          { titleKey: "audioSystem", href: "/docs/api/server-internals/modules/audio-system" },
          { titleKey: "entitySpawning", href: "/docs/api/server-internals/modules/entity-spawning" },
          { titleKey: "npcSystem", href: "/docs/api/server-internals/modules/npc-system" },
          { titleKey: "spawnSystem", href: "/docs/api/server-internals/modules/spawn-system" },
        ],
      },
      { titleKey: "eventSystem", href: "/docs/api/server-internals/events" },
      { titleKey: "commandSystem", href: "/docs/api/server-internals/commands" },
      { titleKey: "dataTypes", href: "/docs/api/server-internals/types" },
      { titleKey: "networkPackets", href: "/docs/api/server-internals/packets" },
      {
        titleKey: "customUI",
        items: [
          { titleKey: "customUIOverview", href: "/docs/api/server-internals/custom-ui", verified: true },
          { titleKey: "uiReference", href: "/docs/api/server-internals/ui-reference", verified: true },
          { titleKey: "uiCompleteReference", href: "/docs/api/server-internals/ui-complete-reference" },
          { titleKey: "uiTroubleshooting", href: "/docs/api/server-internals/troubleshooting" },
        ],
      },
      {
        titleKey: "officialApi",
        items: [
          { titleKey: "endpoints", href: "/docs/api/official/endpoints" },
          { titleKey: "authentication", href: "/docs/api/official/authentication" },
        ],
      },
      {
        titleKey: "sdks",
        items: [
          { titleKey: "javascript", href: "/docs/api/sdks/javascript" },
          { titleKey: "php", href: "/docs/api/sdks/php" },
        ],
      },
    ],
  },

  // 7. Community
  {
    titleKey: "community",
    items: [
      { titleKey: "contributing", href: "/docs/community/contributing" },
      { titleKey: "codeOfConduct", href: "/docs/community/code-of-conduct" },
      { titleKey: "resources", href: "/docs/community/resources" },
      { titleKey: "mods", href: "/docs/community/mods" },
      { titleKey: "communityServers", href: "/docs/community/servers" },
      { titleKey: "contentCreators", href: "/docs/community/content-creators" },
      { titleKey: "buildsGallery", href: "/docs/community/builds-gallery" },
      { titleKey: "eventsCalendar", href: "/docs/community/events" },
    ],
  },
];

/**
 * Get audience badge color
 */
export function getAudienceBadgeColor(audience: SidebarItem["audience"]): string {
  switch (audience) {
    case "player":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "creator":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "developer":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "admin":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    default:
      return "";
  }
}

/**
 * URL redirects from old paths to new paths
 */
export const urlRedirects: Record<string, string> = {
  // Events redirects (old nested paths to new flat structure)
  "/docs/modding/plugins/events/overview": "/docs/plugins/events",
  "/docs/modding/plugins/events/player/player-connect-event": "/docs/modding/plugins/events/player-connect-event",
  "/docs/modding/plugins/events/player/player-disconnect-event": "/docs/modding/plugins/events/player-disconnect-event",
  "/docs/modding/plugins/events/player/player-chat-event": "/docs/modding/plugins/events/player-chat-event",
  "/docs/modding/plugins/events/player/player-setup-connect-event": "/docs/modding/plugins/events/player-setup-connect-event",
  "/docs/modding/plugins/events/player/player-setup-disconnect-event": "/docs/modding/plugins/events/player-setup-disconnect-event",
  "/docs/modding/plugins/events/player/player-ready-event": "/docs/modding/plugins/events/player-ready-event",
  "/docs/modding/plugins/events/player/player-mouse-button-event": "/docs/modding/plugins/events/player-mouse-button-event",
  "/docs/modding/plugins/events/player/player-mouse-motion-event": "/docs/modding/plugins/events/player-mouse-motion-event",
  "/docs/modding/plugins/events/player/add-player-to-world-event": "/docs/modding/plugins/events/add-player-to-world-event",
  "/docs/modding/plugins/events/player/drain-player-from-world-event": "/docs/modding/plugins/events/drain-player-from-world-event",
  "/docs/modding/plugins/events/player/player-interact-event": "/docs/modding/plugins/events/player-interact-event",
  "/docs/modding/plugins/events/player/player-craft-event": "/docs/modding/plugins/events/player-craft-event",
  "/docs/modding/plugins/events/player/change-game-mode-event": "/docs/modding/plugins/events/change-game-mode-event",
  "/docs/modding/plugins/events/block/break-block-event": "/docs/modding/plugins/events/break-block-event",
  "/docs/modding/plugins/events/block/place-block-event": "/docs/modding/plugins/events/place-block-event",
  "/docs/modding/plugins/events/block/damage-block-event": "/docs/modding/plugins/events/damage-block-event",
  "/docs/modding/plugins/events/block/use-block-event": "/docs/modding/plugins/events/use-block-event",
  "/docs/modding/plugins/events/world/add-world-event": "/docs/modding/plugins/events/add-world-event",
  "/docs/modding/plugins/events/world/remove-world-event": "/docs/modding/plugins/events/remove-world-event",
  "/docs/modding/plugins/events/world/start-world-event": "/docs/modding/plugins/events/start-world-event",
  "/docs/modding/plugins/events/world/all-worlds-loaded-event": "/docs/modding/plugins/events/all-worlds-loaded-event",
  "/docs/modding/plugins/events/world/moon-phase-change-event": "/docs/modding/plugins/events/moon-phase-change-event",
  "/docs/modding/plugins/events/world/world-path-changed-event": "/docs/modding/plugins/events/world-path-changed-event",
  "/docs/modding/plugins/events/chunk/chunk-pre-load-process-event": "/docs/modding/plugins/events/chunk-pre-load-process-event",
  "/docs/modding/plugins/events/chunk/chunk-save-event": "/docs/modding/plugins/events/chunk-save-event",
  "/docs/modding/plugins/events/chunk/chunk-unload-event": "/docs/modding/plugins/events/chunk-unload-event",
  "/docs/modding/plugins/events/server/boot-event": "/docs/modding/plugins/events/boot-event",
  "/docs/modding/plugins/events/server/shutdown-event": "/docs/modding/plugins/events/shutdown-event",
  "/docs/modding/plugins/events/server/plugin-setup-event": "/docs/modding/plugins/events/plugin-setup-event",
  "/docs/modding/plugins/events/entity/entity-remove-event": "/docs/modding/plugins/events/entity-remove-event",
  "/docs/modding/plugins/events/entity/living-entity-inventory-change-event": "/docs/modding/plugins/events/living-entity-inventory-change-event",
  "/docs/modding/plugins/events/permission/player-permission-change-event": "/docs/modding/plugins/events/player-permission-change-event",
  "/docs/modding/plugins/events/permission/group-permission-change-event": "/docs/modding/plugins/events/group-permission-change-event",
  "/docs/modding/plugins/events/permission/player-group-event": "/docs/modding/plugins/events/player-group-event",
  "/docs/modding/plugins/events/inventory/drop-item-event": "/docs/modding/plugins/events/drop-item-event",
  "/docs/modding/plugins/events/inventory/switch-active-slot-event": "/docs/modding/plugins/events/switch-active-slot-event",
  "/docs/modding/plugins/events/inventory/interactively-pickup-item-event": "/docs/modding/plugins/events/interactively-pickup-item-event",
  "/docs/modding/plugins/events/inventory/craft-recipe-event": "/docs/modding/plugins/events/craft-recipe-event",
  "/docs/modding/plugins/events/prefab/prefab-place-entity-event": "/docs/modding/plugins/events/prefab-place-entity-event",
  "/docs/modding/plugins/events/prefab/prefab-paste-event": "/docs/modding/plugins/events/prefab-paste-event",
  "/docs/modding/plugins/events/damage/kill-feed-event": "/docs/modding/plugins/events/kill-feed-event",
  "/docs/modding/plugins/events/damage/damage-event": "/docs/modding/plugins/events/damage-event",
  "/docs/modding/plugins/events/instance/discover-instance-event": "/docs/modding/plugins/events/discover-instance-event",
  "/docs/modding/plugins/events/zone/discover-zone-event": "/docs/modding/plugins/events/discover-zone-event",
  "/docs/modding/plugins/events/asset/register-asset-store-event": "/docs/modding/plugins/events/register-asset-store-event",
  "/docs/modding/plugins/events/asset/remove-asset-store-event": "/docs/modding/plugins/events/remove-asset-store-event",
  "/docs/modding/plugins/events/asset/loaded-assets-event": "/docs/modding/plugins/events/loaded-assets-event",
  "/docs/modding/plugins/events/asset/removed-assets-event": "/docs/modding/plugins/events/removed-assets-event",
  "/docs/modding/plugins/events/asset/generate-assets-event": "/docs/modding/plugins/events/generate-assets-event",
  "/docs/modding/plugins/events/asset/asset-store-monitor-event": "/docs/modding/plugins/events/asset-store-monitor-event",
  "/docs/modding/plugins/events/asset/asset-pack-register-event": "/docs/modding/plugins/events/asset-pack-register-event",
  "/docs/modding/plugins/events/asset/asset-pack-unregister-event": "/docs/modding/plugins/events/asset-pack-unregister-event",
  "/docs/modding/plugins/events/asset/load-asset-event": "/docs/modding/plugins/events/load-asset-event",
  "/docs/modding/plugins/events/asset/generate-schema-event": "/docs/modding/plugins/events/generate-schema-event",
  "/docs/modding/plugins/events/asset/send-common-assets-event": "/docs/modding/plugins/events/send-common-assets-event",
  "/docs/modding/plugins/events/npc/entity-event-type": "/docs/modding/plugins/events/entity-event-type",
  "/docs/modding/plugins/events/npc/block-event-type": "/docs/modding/plugins/events/block-event-type",
  "/docs/modding/plugins/events/npc/entity-event-view": "/docs/modding/plugins/events/entity-event-view",
  "/docs/modding/plugins/events/npc/block-event-view": "/docs/modding/plugins/events/block-event-view",
  "/docs/modding/plugins/events/npc/event-notification": "/docs/modding/plugins/events/event-notification",
  "/docs/modding/plugins/events/npc/entity-event-notification": "/docs/modding/plugins/events/entity-event-notification",
  "/docs/modding/plugins/events/npc/all-npcs-loaded-event": "/docs/modding/plugins/events/all-npcs-loaded-event",
  "/docs/modding/plugins/events/npc/loaded-npc-event": "/docs/modding/plugins/events/loaded-npc-event",
  "/docs/modding/plugins/events/adventure/treasure-chest-opening-event": "/docs/modding/plugins/events/treasure-chest-opening-event",
  "/docs/modding/plugins/events/i18n/generate-default-language-event": "/docs/modding/plugins/events/generate-default-language-event",
  "/docs/modding/plugins/events/singleplayer/singleplayer-request-access-event": "/docs/modding/plugins/events/singleplayer-request-access-event",
};
