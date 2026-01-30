---
id: items-database
title: Items & Blocks Database
sidebar_label: Items Database
sidebar_position: 5
description: Documented items and blocks from Hytale Early Access decompiled server code
---

# Items & Blocks Database

This database documents items and blocks confirmed from analyzing the decompiled Hytale server code. Items in Hytale are defined through JSON asset files loaded at runtime, making this list representative of the block types and item structures found in the codebase rather than a complete inventory list.

:::warning Verified Data Only
This page only contains information verified from decompiled server code. Speculative or unconfirmed content has been removed. The actual game contains many more items defined in external asset files.
:::

## Item System Overview

Items in Hytale use a component-based system with the following properties:

| Property | Description |
|----------|-------------|
| `id` | Unique identifier string |
| `icon` | UI icon reference |
| `maxStack` | Maximum stack size (default varies) |
| `qualityId` | Item quality tier reference |
| `categories` | Array of category assignments |
| `tool` | Tool configuration (if applicable) |
| `weapon` | Weapon configuration (if applicable) |
| `armor` | Armor configuration (if applicable) |
| `glider` | Glider configuration (if applicable) |
| `utility` | Utility item configuration |
| `consumable` | Whether the item is consumed on use |
| `maxDurability` | Maximum durability value |

## Armor System

Hytale uses a **5-slot armor system** crafted at the Armorer's Workbench:

| Slot | Description |
|------|-------------|
| **Helm** | Head protection |
| **Cuirass** | Chest/body armor |
| **Gauntlets** | Hand protection |
| **Greaves** | Leg armor |
| **Shield** | Off-hand defensive item (separate recipes) |

### Armor Material Tiers

| Tier | Material | Workbench Tier | Zone | Special Properties |
|------|----------|----------------|------|-------------------|
| 1 | **Copper** | Tier 1 | Zone 1 | Basic protection |
| 2 | **Iron** | Tier 1 | Zone 1-2 | Standard protection |
| 3 | **Thorium** | Tier 2 | Zone 2 | Strong poison resistance |
| 4 | **Cobalt** | Tier 2 | Zone 3 | Damage-focused stats |
| 5 | **Adamantite** | Tier 3 | Zone 4 | Light attack damage boost |
| 6 | **Mithril** | Tier 3 | Zone 4 | Highest tier (may require boss drops) |

:::note Armor Set Bonuses
Different armor sets provide unique bonuses. Cobalt and Adamantite favor damage output, while Thorium offers strong defensive properties against poison.
:::

### Armor Properties

Armor items can have the following configurations:

- **ArmorSlot**: Which slot the armor occupies
- **BaseDamageResistance**: Flat damage reduction value
- **DamageResistance**: Map of damage types to resistance modifiers
- **DamageEnhancement**: Map of damage types to enhancement modifiers
- **KnockbackResistances**: Resistance to knockback by damage type
- **StatModifiers**: Entity stat modifications when worn
- **CosmeticsToHide**: Which cosmetic elements to hide when equipped

## Tool System

Tools use a specification-based system with "GatherType" determining what blocks they can interact with:

| Property | Description |
|----------|-------------|
| GatherType | Type of gathering this tool spec applies to |
| Power | Mining/gathering power value |
| Quality | Quality tier of the tool spec |
| Speed | Speed modifier for the tool |
| DurabilityLossBlockTypes | Durability loss rates per block type |

## Weapon System

Weapons are crafted at the **Blacksmith's Anvil** and can modify entity stats when equipped.

### Weapon Types

| Weapon | Description | Special |
|--------|-------------|---------|
| **Swords** | Versatile one-handed weapons | Allows off-hand item |
| **Daggers** | Fast dual-wielded weapons | High mobility, strong charged attack |
| **Bows** | Ranged weapons | Plentiful ammunition |
| **Hammers/Maces** | Heavy weapons | High base damage |
| **Staves** | Magic weapons | Uses mana system |

### Weapon Material Tiers

Weapons follow the same material progression as armor:
- Copper > Iron > Thorium > Cobalt > Adamantite > Mithril

:::tip Best Weapons
Mithril Daggers are currently considered the strongest crafted melee weapons. Daggers benefit from Adamantite armor's light attack damage boost.
:::

### Weapon Properties

| Property | Description |
|----------|-------------|
| StatModifiers | Map of stat types to modifiers |
| EntityStatsToClear | Stats to clear when weapon is unequipped |
| RenderDualWielded | Whether to render as dual-wielded |

## Ore Types

Hytale features **seven confirmed ore types** found across different zones:

| Ore | Zone | Location | Pickaxe Required | Notes |
|-----|------|----------|------------------|-------|
| **Copper** | Zone 1 | Cave walls, shallow depths | Crude Pickaxe | Starting ore, green-brown appearance |
| **Iron** | Zone 1-2 | ~50 blocks deep, abundant in Badlands | Crude Pickaxe | More common in desert caves |
| **Gold** | Zone 2 | Various depths | Iron Pickaxe | Used for Alchemist's Workbench |
| **Thorium** | Zone 2 | Caves, cliffsides in Howling Sands | Iron Pickaxe | Shiny green appearance |
| **Cobalt** | Zone 3 | Whisperfrost Frontiers, shale columns | Iron Pickaxe | Dark blue color, aboveground veins |
| **Adamantite** | Zone 4 | Cinder Islands, near lava | Iron Pickaxe | Fire resistance recommended |
| **Mithril** | Zone 4 | Tundra/Volcano biomes, boss drops | Iron Pickaxe | Rarest ore, may require boss kills |

:::tip Mining Tips
- All ores can be mined with an Iron Pickaxe (even Adamantite)
- Copper and Iron can be mined with the starting Crude Pickaxe
- Desert/Badlands caves have the most Iron
- Aboveground shale columns in Zone 3 contain large Cobalt veins
:::

## Confirmed Block Types

### Rock & Stone Blocks

From migration files and code references:

| Block ID | Category | Notes |
|----------|----------|-------|
| `Rock_Stone` | Terrain | Standard stone |
| `Rock_Marble` | Terrain | Marble variant |
| `Rock_Quartzite` | Terrain | Quartzite variant |
| `Rock_Shale` | Terrain | Shale/dark stone |
| `Rock_Volcanic` | Terrain | Volcanic rock |
| `Rock_Basalt_Brick_Half` | Building | Half slab basalt brick |
| `Rock_Sandstone_Brick_Red` | Building | Red sandstone brick |
| `Rock_Stone_Cobble` | Terrain | Cobblestone |
| `Rock_Stone_Cobble_Mossy_Half` | Building | Mossy cobblestone half |
| `Rock_Shale_Brick` | Building | Dark stone brick |

### Crystal Blocks

| Block ID | Variants | Notes |
|----------|----------|-------|
| `Rock_Crystal_Blue_Big` | Big, Medium, Small | Blue crystal formations |
| `Rock_Crystal_Green_Big` | Big, Medium, Small | Green crystal formations |
| `Rock_Crystal_Pink_Big` | Big, Medium, Small | Pink crystal formations |
| `Rock_Crystal_Purple_Big` | Big, Medium, Small | Purple crystal formations |
| `Rock_Crystal_Red_Big` | Big, Medium, Small | Red crystal formations |
| `Rock_Crystal_Yellow_Big` | Big, Medium, Small | Yellow crystal formations |

### Soil Types

| Block ID | Description |
|----------|-------------|
| `Soil_Grass` | Grass-covered soil |
| `Soil_Dirt` | Basic dirt |
| `Soil_Clay` | Clay soil |
| `Soil_Gravel` | Gravel terrain |
| `Soil_Mud` | Mud terrain |
| `Soil_Needles` | Pine needle covered soil |

### Wood Types

The game features various wood types with branches, trunks, and planks:

| Wood Type | Branch Variants | Plank Color |
|-----------|-----------------|-------------|
| Ash | Corner, Long, Short | - |
| Aspen | Corner, Long, Short | - |
| Azure | Corner, Long, Short | - |
| Beech | Corner, Long, Short | - |
| Birch | Corner, Long, Short | Light |
| Burnt | Corner, Long, Short | Black |
| Cedar | Corner, Long, Short | Red |
| CrimsonMaple | Corner, Long, Short | - |
| Crystal | Corner, Long, Short | - |
| Dry | Corner, Long, Short | Beige |
| Gumboab | Corner, Long, Short | - |
| Oak | Corner, Long, Short | Soft |
| Palm | Corner, Long, Short | Golden |
| Redwood | Corner, Long, Short | - |
| Sand | Corner, Long, Short | - |
| Spruce | Corner, Long, Short | Dark |

### Plants & Vegetation

| Block ID | Description |
|----------|-------------|
| `Plant_Boomshroom_Large` | Large explosive mushroom |
| `Plant_Boomshroom_Small` | Small explosive mushroom |
| `Plant_Mushroom_Red` | Red toadstool mushroom |

### Bones & Fossils

| Block ID | Description |
|----------|-------------|
| `Bone_Spine` | Spine bone block |
| `Bone_Stalagtite_Big` | Large bone stalactite |
| `Bone_Stalagtite_Small` | Small bone stalactite |
| `Bone_Ribs_Long` | Long rib bones |

### Decorative Blocks

| Block ID | Description |
|----------|-------------|
| `Deco_Iron_Bars` | Iron bar decoration |
| `Deco_Iron_Brazier` | Iron brazier |
| `Deco_Bronze_Brazier` | Bronze brazier |
| `Deco_Stone_Brazier` | Stone brazier |
| `Deco_Cauldron` | Cauldron block |
| `Deco_Iron_Stack` | Stacked iron decoration |
| `Deco_EggSacks_Medium` | Egg sack decoration |
| `Container_Coffin` | Coffin container |

### Ice Formations

| Block ID | Description |
|----------|-------------|
| `Rock_Ice_Stalagtite_Small` | Small ice stalactite |

### Structures

| Block ID | Description |
|----------|-------------|
| `WindMill_Wing` | Windmill wing block |
| `Wood_Platform_Kweebec` | Kweebec wooden platform |

## Fluids

Hytale has a fluid system with 6 confirmed fluid types:

| Fluid ID | Source Block | Flow Block | Properties |
|----------|--------------|------------|------------|
| `Fluid_Water` | `Water_Source` | `Water` | Standard water |
| `Fluid_Water_Test` | `Water_Finite` | - | Test/finite water |
| `Fluid_Lava` | `Lava_Source` | `Lava` | Damaging lava |
| `Fluid_Tar` | `Tar_Source` | `Tar` | Sticky tar |
| `Fluid_Slime` | `Slime_Source` | `Slime` | Bouncy slime |
| `Fluid_Poison` | `Poison_Source` | `Poison` | Damaging poison |

## Item Durability & Repair

Items with durability will degrade with use and can be repaired.

### Repair System

1. Craft a **Repair Kit** at a workbench
2. Equip the Repair Kit in your hotbar
3. Press **Right Mouse Button** to open the repair window
4. Select items to repair

:::warning Durability Loss
Using a Repair Kit **reduces maximum durability by 10%**. Repeatedly repairing the same item will eventually cause it to permanently break. Consider crafting new equipment instead of over-repairing.
:::

### Salvaging

The **Salvager's Workbench** allows you to break down unwanted gear into raw materials, which can then be used to craft new equipment.

## Item Quality System

Items have quality tiers that affect their appearance and potentially their stats. The system includes:

- Quality ID reference
- Quality value (numeric tier)
- Visual indicators (background textures in `UI/ItemQualities/`)

## Item Categories

Items are organized into categories for inventory display:

- Categories have hierarchical structure (parent/children)
- Each category has an ID, name, icon, and display order
- Icons are stored in `Icons/ItemCategories/`

## Editor & Debug Items

The game includes special items for world editing:

| Item ID | Purpose |
|---------|---------|
| `Editor_Block` | Block editing tool |
| `Editor_Empty` | Empty editor placeholder |
| `Editor_Anchor` | Anchor point tool |
| `EditorTool_Paste` | Paste tool |
| `EditorTool_PrefabEditing_SelectPrefab` | Prefab selection |
| `Debug_Cube` | Debug cube |
| `Debug_Model` | Debug model |

## Sound System

Items reference sound events for interactions:

| Sound Event | Description |
|-------------|-------------|
| `SFX_Player_Craft_Item_Inventory` | Crafting completion |
| `SFX_Player_Drop_Item` | Dropping item |
| `SFX_Player_Pickup_Item` | Picking up item |
| `SFX_Item_Break` | Item breaking |
| `SFX_Item_Repair` | Item repair |

---

## See Also

- [Item Types](/docs/modding/data-assets/items/item-types) - Item configuration schema
- [Block Types](/docs/api/server-internals/modules/blocks) - Block system documentation
- [Crafting Guide](/docs/gameplay/crafting-guide) - How to craft items

---

*This database is generated from decompiled Hytale server code analysis. For the complete item list, refer to the game's asset files.*
