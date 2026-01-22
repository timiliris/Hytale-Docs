export interface SidebarItem {
  titleKey: string;
  href?: string;
  items?: SidebarItem[];
  /** Mark as verified/tested with a real plugin */
  verified?: boolean;
  /** Mark as non-functional (event exists but never fires) */
  nonFunctional?: boolean;
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
      const isInEvents = inEventsSection || item.titleKey === "events";

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

export const sidebarConfig: SidebarItem[] = [
  { titleKey: "introduction", href: "/docs/intro" },
  {
    titleKey: "playerGuide",
    items: [
      { titleKey: "overview", href: "/docs/gameplay/overview", verified: true },
      { titleKey: "beginnersGuide", href: "/docs/guides/beginners-guide" },
      { titleKey: "faq", href: "/docs/getting-started/faq" },
      { titleKey: "systemRequirements", href: "/docs/getting-started/system-requirements" },
      { titleKey: "hytaleVsMinecraft", href: "/docs/getting-started/hytale-vs-minecraft" },
      { titleKey: "knownIssues", href: "/docs/getting-started/known-issues" },
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
  {
    titleKey: "devGettingStarted",
    items: [
      { titleKey: "introduction", href: "/docs/getting-started/introduction" },
      { titleKey: "prerequisites", href: "/docs/getting-started/prerequisites" },
      {
        titleKey: "environmentSetup",
        href: "/docs/getting-started/environment-setup",
      },
      { titleKey: "firstMod", href: "/docs/getting-started/first-mod" },
      { titleKey: "firstModQuick", href: "/docs/guides/first-mod-quick" },
    ],
  },
  {
    titleKey: "modding",
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
              { titleKey: "properties", href: "/docs/modding/data-assets/blocks/properties" },
              { titleKey: "behaviors", href: "/docs/modding/data-assets/blocks/behaviors" },
            ],
          },
          {
            titleKey: "items",
            items: [
              { titleKey: "overview", href: "/docs/modding/data-assets/items/overview" },
              { titleKey: "properties", href: "/docs/modding/data-assets/items/properties" },
              { titleKey: "behaviors", href: "/docs/modding/data-assets/items/behaviors" },
            ],
          },
          {
            titleKey: "npcs",
            items: [
              { titleKey: "overview", href: "/docs/modding/data-assets/npcs/overview" },
              { titleKey: "aiSystem", href: "/docs/modding/data-assets/npcs/ai-system" },
              { titleKey: "behaviors", href: "/docs/modding/data-assets/npcs/behaviors" },
            ],
          },
        ],
      },
      {
        titleKey: "plugins",
        items: [
          { titleKey: "overview", href: "/docs/modding/plugins/overview", verified: true },
          { titleKey: "intellijPlugin", href: "/docs/modding/plugins/intellij-plugin", verified: true },
          { titleKey: "projectSetup", href: "/docs/modding/plugins/project-setup", verified: true },
          { titleKey: "pluginLifecycle", href: "/docs/modding/plugins/plugin-lifecycle", verified: true },
          {
            titleKey: "events",
            items: [
              { titleKey: "eventsOverview", href: "/docs/modding/plugins/events/overview", verified: true },
              {
                titleKey: "playerEvents",
                items: [
                  { titleKey: "playerConnectEvent", href: "/docs/modding/plugins/events/player/player-connect-event", verified: true },
                  { titleKey: "playerDisconnectEvent", href: "/docs/modding/plugins/events/player/player-disconnect-event", verified: true },
                  { titleKey: "playerChatEvent", href: "/docs/modding/plugins/events/player/player-chat-event", verified: true },
                  { titleKey: "playerSetupConnectEvent", href: "/docs/modding/plugins/events/player/player-setup-connect-event", verified: true },
                  { titleKey: "playerSetupDisconnectEvent", href: "/docs/modding/plugins/events/player/player-setup-disconnect-event", verified: true },
                  { titleKey: "playerReadyEvent", href: "/docs/modding/plugins/events/player/player-ready-event", verified: true },
                  { titleKey: "playerMouseButtonEvent", href: "/docs/modding/plugins/events/player/player-mouse-button-event", nonFunctional: true },
                  { titleKey: "playerMouseMotionEvent", href: "/docs/modding/plugins/events/player/player-mouse-motion-event", nonFunctional: true },
                  { titleKey: "addPlayerToWorldEvent", href: "/docs/modding/plugins/events/player/add-player-to-world-event", verified: true },
                  { titleKey: "drainPlayerFromWorldEvent", href: "/docs/modding/plugins/events/player/drain-player-from-world-event", verified: true },
                  { titleKey: "playerInteractEvent", href: "/docs/modding/plugins/events/player/player-interact-event", nonFunctional: true },
                  { titleKey: "playerCraftEvent", href: "/docs/modding/plugins/events/player/player-craft-event", verified: true },
                  { titleKey: "changeGameModeEvent", href: "/docs/modding/plugins/events/player/change-game-mode-event", verified: true },
                ],
              },
              {
                titleKey: "blockEvents",
                items: [
                  { titleKey: "breakBlockEvent", href: "/docs/modding/plugins/events/block/break-block-event", verified: true },
                  { titleKey: "placeBlockEvent", href: "/docs/modding/plugins/events/block/place-block-event", verified: true },
                  { titleKey: "damageBlockEvent", href: "/docs/modding/plugins/events/block/damage-block-event", verified: true },
                  { titleKey: "useBlockEvent", href: "/docs/modding/plugins/events/block/use-block-event", verified: true },
                ],
              },
              {
                titleKey: "worldEvents",
                items: [
                  { titleKey: "addWorldEvent", href: "/docs/modding/plugins/events/world/add-world-event", verified: true },
                  { titleKey: "removeWorldEvent", href: "/docs/modding/plugins/events/world/remove-world-event", verified: true },
                  { titleKey: "startWorldEvent", href: "/docs/modding/plugins/events/world/start-world-event", verified: true },
                  { titleKey: "allWorldsLoadedEvent", href: "/docs/modding/plugins/events/world/all-worlds-loaded-event", verified: true },
                  { titleKey: "moonPhaseChangeEvent", href: "/docs/modding/plugins/events/world/moon-phase-change-event", verified: true },
                  { titleKey: "worldPathChangedEvent", href: "/docs/modding/plugins/events/world/world-path-changed-event", verified: true },
                ],
              },
              {
                titleKey: "chunkEvents",
                items: [
                  { titleKey: "chunkPreLoadProcessEvent", href: "/docs/modding/plugins/events/chunk/chunk-pre-load-process-event" },
                  { titleKey: "chunkSaveEvent", href: "/docs/modding/plugins/events/chunk/chunk-save-event" },
                  { titleKey: "chunkUnloadEvent", href: "/docs/modding/plugins/events/chunk/chunk-unload-event" },
                ],
              },
              {
                titleKey: "serverEvents",
                items: [
                  { titleKey: "bootEvent", href: "/docs/modding/plugins/events/server/boot-event" },
                  { titleKey: "shutdownEvent", href: "/docs/modding/plugins/events/server/shutdown-event" },
                  { titleKey: "pluginSetupEvent", href: "/docs/modding/plugins/events/server/plugin-setup-event" },
                ],
              },
              {
                titleKey: "entityEvents",
                items: [
                  { titleKey: "entityRemoveEvent", href: "/docs/modding/plugins/events/entity/entity-remove-event" },
                  { titleKey: "livingEntityInventoryChangeEvent", href: "/docs/modding/plugins/events/entity/living-entity-inventory-change-event" },
                ],
              },
              {
                titleKey: "permissionEvents",
                items: [
                  { titleKey: "playerPermissionChangeEvent", href: "/docs/modding/plugins/events/permission/player-permission-change-event" },
                  { titleKey: "groupPermissionChangeEvent", href: "/docs/modding/plugins/events/permission/group-permission-change-event" },
                  { titleKey: "playerGroupEvent", href: "/docs/modding/plugins/events/permission/player-group-event", verified: true },
                ],
              },
              {
                titleKey: "inventoryEvents",
                items: [
                  { titleKey: "dropItemEvent", href: "/docs/modding/plugins/events/inventory/drop-item-event", verified: true },
                  { titleKey: "switchActiveSlotEvent", href: "/docs/modding/plugins/events/inventory/switch-active-slot-event" },
                  { titleKey: "interactivelyPickupItemEvent", href: "/docs/modding/plugins/events/inventory/interactively-pickup-item-event", verified: true },
                  { titleKey: "craftRecipeEvent", href: "/docs/modding/plugins/events/inventory/craft-recipe-event", verified: true },
                ],
              },
              {
                titleKey: "prefabEvents",
                items: [
                  { titleKey: "prefabPlaceEntityEvent", href: "/docs/modding/plugins/events/prefab/prefab-place-entity-event" },
                  { titleKey: "prefabPasteEvent", href: "/docs/modding/plugins/events/prefab/prefab-paste-event" },
                ],
              },
              {
                titleKey: "damageEvents",
                items: [
                  { titleKey: "killFeedEvent", href: "/docs/modding/plugins/events/damage/kill-feed-event" },
                ],
              },
              {
                titleKey: "zoneEvents",
                items: [
                  { titleKey: "discoverInstanceEvent", href: "/docs/modding/plugins/events/instance/discover-instance-event" },
                  { titleKey: "discoverZoneEvent", href: "/docs/modding/plugins/events/zone/discover-zone-event" },
                ],
              },
              {
                titleKey: "assetEvents",
                items: [
                  { titleKey: "registerAssetStoreEvent", href: "/docs/modding/plugins/events/asset/register-asset-store-event" },
                  { titleKey: "removeAssetStoreEvent", href: "/docs/modding/plugins/events/asset/remove-asset-store-event" },
                  { titleKey: "loadedAssetsEvent", href: "/docs/modding/plugins/events/asset/loaded-assets-event" },
                  { titleKey: "removedAssetsEvent", href: "/docs/modding/plugins/events/asset/removed-assets-event" },
                  { titleKey: "generateAssetsEvent", href: "/docs/modding/plugins/events/asset/generate-assets-event" },
                  { titleKey: "assetStoreMonitorEvent", href: "/docs/modding/plugins/events/asset/asset-store-monitor-event" },
                  { titleKey: "assetPackRegisterEvent", href: "/docs/modding/plugins/events/asset/asset-pack-register-event" },
                  { titleKey: "assetPackUnregisterEvent", href: "/docs/modding/plugins/events/asset/asset-pack-unregister-event" },
                  { titleKey: "loadAssetEvent", href: "/docs/modding/plugins/events/asset/load-asset-event" },
                  { titleKey: "generateSchemaEvent", href: "/docs/modding/plugins/events/asset/generate-schema-event" },
                  { titleKey: "sendCommonAssetsEvent", href: "/docs/modding/plugins/events/asset/send-common-assets-event" },
                ],
              },
              {
                titleKey: "npcEvents",
                items: [
                  { titleKey: "entityEventType", href: "/docs/modding/plugins/events/npc/entity-event-type" },
                  { titleKey: "blockEventType", href: "/docs/modding/plugins/events/npc/block-event-type" },
                  { titleKey: "entityEventView", href: "/docs/modding/plugins/events/npc/entity-event-view" },
                  { titleKey: "blockEventView", href: "/docs/modding/plugins/events/npc/block-event-view" },
                  { titleKey: "eventNotification", href: "/docs/modding/plugins/events/npc/event-notification" },
                  { titleKey: "entityEventNotification", href: "/docs/modding/plugins/events/npc/entity-event-notification" },
                  { titleKey: "allNpcsLoadedEvent", href: "/docs/modding/plugins/events/npc/all-npcs-loaded-event" },
                  { titleKey: "loadedNpcEvent", href: "/docs/modding/plugins/events/npc/loaded-npc-event" },
                ],
              },
              {
                titleKey: "adventureEvents",
                items: [
                  { titleKey: "treasureChestOpeningEvent", href: "/docs/modding/plugins/events/adventure/treasure-chest-opening-event" },
                ],
              },
              {
                titleKey: "i18nEvents",
                items: [
                  { titleKey: "generateDefaultLanguageEvent", href: "/docs/modding/plugins/events/i18n/generate-default-language-event" },
                ],
              },
              {
                titleKey: "singleplayerEvents",
                items: [
                  { titleKey: "singleplayerRequestAccessEvent", href: "/docs/modding/plugins/events/singleplayer/singleplayer-request-access-event" },
                ],
              },
            ],
          },
          { titleKey: "commands", href: "/docs/modding/plugins/commands" },
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
        titleKey: "serverInternals",
        items: [
          { titleKey: "serverInternalsOverview", href: "/docs/api/server-internals" },
          { titleKey: "pluginSystem", href: "/docs/api/server-internals/plugins" },
          {
            titleKey: "modules",
            items: [
              { titleKey: "modulesOverview", href: "/docs/api/server-internals/modules" },
              { titleKey: "entityStats", href: "/docs/api/server-internals/modules/entity-stats" },
              { titleKey: "accessControl", href: "/docs/api/server-internals/modules/access-control" },
              { titleKey: "damageSystem", href: "/docs/api/server-internals/modules/damage-system" },
              { titleKey: "interactions", href: "/docs/api/server-internals/modules/interactions" },
              { titleKey: "timeSystem", href: "/docs/api/server-internals/modules/time-system" },
              { titleKey: "projectiles", href: "/docs/api/server-internals/modules/projectiles" },
              { titleKey: "blockHealth", href: "/docs/api/server-internals/modules/block-health" },
              { titleKey: "collisionSystem", href: "/docs/api/server-internals/modules/collision-system" },
              { titleKey: "staminaSystem", href: "/docs/api/server-internals/modules/stamina-system" },
              { titleKey: "prefabSystem", href: "/docs/api/server-internals/modules/prefab-system" },
              { titleKey: "entityUI", href: "/docs/api/server-internals/modules/entity-ui" },
              { titleKey: "effectsSystem", href: "/docs/api/server-internals/modules/effects-system" },
              { titleKey: "audioSystem", href: "/docs/api/server-internals/modules/audio-system" },
              { titleKey: "entitySpawning", href: "/docs/api/server-internals/modules/entity-spawning" },
              { titleKey: "craftingSystem", href: "/docs/api/server-internals/modules/crafting-system" },
              { titleKey: "npcSystem", href: "/docs/api/server-internals/modules/npc-system" },
              { titleKey: "spawnSystem", href: "/docs/api/server-internals/modules/spawn-system" },
            ],
          },
          { titleKey: "eventSystem", href: "/docs/api/server-internals/events" },
          { titleKey: "commandSystem", href: "/docs/api/server-internals/commands" },
          { titleKey: "ecsSystem", href: "/docs/api/server-internals/ecs" },
          { titleKey: "dataTypes", href: "/docs/api/server-internals/types" },
          { titleKey: "networkPackets", href: "/docs/api/server-internals/packets" },
          { titleKey: "customUI", href: "/docs/api/server-internals/custom-ui", verified: true },
          { titleKey: "uiReference", href: "/docs/api/server-internals/ui-reference", verified: true },
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
  {
    titleKey: "servers",
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
  {
    titleKey: "tools",
    items: [
      { titleKey: "overview", href: "/docs/tools/overview", verified: true },
      { titleKey: "intellijPlugin", href: "/docs/tools/intellij-plugin" },
      {
        titleKey: "blockbench",
        items: [
          { titleKey: "installation", href: "/docs/tools/blockbench/installation" },
          { titleKey: "pluginSetup", href: "/docs/tools/blockbench/plugin-setup" },
          { titleKey: "modeling", href: "/docs/tools/blockbench/modeling" },
          { titleKey: "animation", href: "/docs/tools/blockbench/animation" },
        ],
      },
      {
        titleKey: "assetEditor",
        items: [
          { titleKey: "overview", href: "/docs/tools/asset-editor/overview" },
          { titleKey: "editingData", href: "/docs/tools/asset-editor/editing-data" },
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
