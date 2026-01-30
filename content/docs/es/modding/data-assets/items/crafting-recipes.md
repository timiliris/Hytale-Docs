---
id: crafting-recipes
title: Crafting Recipes
sidebar_label: Crafting Recipes
sidebar_position: 3
---

# Crafting Recipes

Define how items are crafted.

## Recipe Structure

```json
{
  "type": "shaped",
  "pattern": [
    " R ",
    " R ",
    " S "
  ],
  "key": {
    "R": "my_mod:ruby",
    "S": "minecraft:stick"
  },
  "result": "my_mod:ruby_sword"
}
```
