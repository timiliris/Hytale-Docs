---
id: editing-data
title: Editing Data Assets
sidebar_label: Editing Data
sidebar_position: 2
description: Guide to editing game data assets using the Asset Editor
---

# Editing Data Assets

Use the Asset Editor to modify game content without writing code. This guide covers editing different asset types.

## Hot Reloading

One of the Asset Editor's most powerful features is hot reloading:

- **Instant updates** - Changes apply immediately in-game
- **No restart required** - Keep playing while editing
- **Rapid iteration** - Test and tweak quickly
- **Real-time feedback** - See results instantly

## Supported Asset Types

### Blocks

Edit block properties:
- Visual appearance
- Physics properties
- Interaction behaviors
- Crafting relationships

### Items

Modify item attributes:
- Display properties
- Stack sizes
- Usage behaviors
- Tool characteristics

### NPCs (Basic)

Configure NPC properties:
- Model references
- Basic attributes
- Spawn settings

:::note Limited Support
Full NPC behavior editing is still in development. For complex behaviors, use the Node Editor.
:::

## Editing Workflow

### Step 1: Open the Asset Editor

1. Launch Hytale
2. Access the Asset Editor from the tools menu
3. The editor interface will open

### Step 2: Select Asset Type

Choose the type of asset to edit:
- Blocks
- Items
- NPCs
- Other available types

### Step 3: Find Your Asset

Browse or search for the asset:
- Use the asset browser
- Search by name or ID
- Filter by category

### Step 4: Edit Properties

Modify values in the properties panel:
- Numeric values via sliders or input
- Text via text fields
- Options via dropdowns
- References via asset pickers

### Step 5: Test Changes

With hot reloading:
1. Make your change
2. Switch to the game window
3. See the change applied immediately
4. Iterate as needed

## Common Editing Tasks

### Changing Block Properties

Example: Modify a block's hardness

1. Open Asset Editor
2. Navigate to Blocks
3. Select the block
4. Find the "hardness" property
5. Adjust the value
6. Test in-game

### Modifying Item Stats

Example: Change an item's damage

1. Open Asset Editor
2. Navigate to Items
3. Select the item
4. Find damage-related properties
5. Modify values
6. Test with hot reload

### Configuring NPCs

Example: Change NPC model

1. Open Asset Editor
2. Navigate to NPCs
3. Select the NPC
4. Find the model reference
5. Select a different model
6. View the change in-game

## Working with Packs

### Editing Pack Content

The Asset Editor works with Packs:
- Edit existing Pack assets
- Create new assets for your Pack
- Override base game content

### Pack Organization

Keep your Pack organized:
- Logical folder structure
- Consistent naming
- Clear asset categories

## Best Practices

1. **Make backups** - Before major edits, save copies
2. **Document changes** - Keep notes on what you modified
3. **Test incrementally** - Small changes, frequent testing
4. **Learn from defaults** - Study existing assets
5. **Validate often** - Check for errors before testing

## Troubleshooting

### Changes Not Appearing

If hot reload isn't working:
- Check that the asset is saved
- Verify you're editing the correct asset
- Ensure the Pack is loaded
- Try reloading the asset manually

### Validation Errors

If you see validation errors:
- Check required fields are filled
- Verify references point to valid assets
- Ensure values are within valid ranges

### Asset Not Found

If you can't find an asset:
- Check the correct category
- Use search functionality
- Verify the asset exists in your Pack

## Advanced Topics

### Referencing Models

When your asset needs a custom model:
1. Create the model in Blockbench
2. Export as `.blockymodel`
3. Place in your Pack's model folder
4. Reference in Asset Editor

### Using the Node Editor

For complex systems beyond the Asset Editor:
- World generation rules
- NPC behaviors
- Scripted brushes

The Node Editor provides visual graph-based editing for these advanced features.

## Related Documentation

- [Asset Editor Overview](/docs/tools/asset-editor/overview) - Editor introduction
- [Blockbench](/docs/tools/blockbench/installation) - Create models
- [Creative Mode](/docs/tools/creative-mode) - Test your content
