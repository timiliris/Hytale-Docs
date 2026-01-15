"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileJson, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";

type SchemaType = "block" | "item" | "npc" | "manifest";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Schema definitions based on decompiled Hytale server code
// Block/Item use actual field names from BlockType.java and Item.java
const schemas: Record<SchemaType, { required: string[]; knownFields: string[]; types: Record<string, string>; strict: boolean }> = {
  block: {
    required: ["DrawType", "Material", "Opacity"], // Required by BlockType.java
    knownFields: [
      // Core fields
      "Group", "DrawType", "Material", "Opacity", "BlockListAssetId", "PrefabListAssetId",
      // Rendering
      "Textures", "TextureSideMask", "CubeShadingMode", "CustomModel", "CustomModelTexture",
      "CustomModelScale", "CustomModelAnimation", "BlockBreakingDecalId", "RequiresAlphaBlending",
      // Light & Effects
      "Light", "Effect", "Particles", "BlockParticleSetId", "ParticleColor",
      // Placement & Rotation
      "RandomRotation", "VariantRotation", "FlipType", "RotationYawPlacementOffset", "PlacementSettings",
      // Interactions
      "IsUsable", "IsStackable", "Interactions", "InteractionHint", "InteractionHitboxType",
      // Physics & Support
      "HitboxType", "SupportDropType", "MaxSupportDistance", "SupportsRequiredFor", "IgnoreSupportWhenPlaced",
      // Sounds
      "BlockSoundSetId", "AmbientSoundEventId", "InteractionSoundEventId", "Looping",
      // Special features
      "Bench", "Gathering", "Farming", "IsDoor", "AllowsMultipleUsers", "Seats", "Beds", "Rail",
      // Tinting
      "Tint", "TintUp", "TintDown", "TintNorth", "TintSouth", "TintWest", "TintEast",
      "BiomeTint", "BiomeTintUp", "BiomeTintDown", "BiomeTintNorth", "BiomeTintSouth", "BiomeTintWest", "BiomeTintEast",
      // Transitions
      "TransitionTexture", "TransitionToGroups", "TransitionToTag",
      // State & Entity
      "State", "BlockEntity", "Aliases", "MovementSettings", "DamageToEntities", "TickProcedure", "ConnectedBlockRuleSet"
    ],
    types: {
      DrawType: "string",
      Material: "string",
      Opacity: "string",
      Group: "string",
      CustomModelScale: "number",
      IsUsable: "boolean",
      IsStackable: "boolean",
      IsDoor: "boolean",
      Looping: "boolean",
      MaxSupportDistance: "number",
      DamageToEntities: "number",
    },
    strict: false, // Permissive - many optional fields
  },
  item: {
    required: [], // No strictly required fields in Item.java
    knownFields: [
      // Core
      "id", "icon", "iconProperties", "translationProperties", "itemLevel",
      // Stack & Quality
      "maxStack", "qualityId", "qualityIndex",
      // Block association
      "blockId", "hasBlockType",
      // Type flags
      "consumable", "variant",
      // Equipment types
      "tool", "weapon", "armor", "glider", "utility",
      "blockSelectorToolData", "builderToolData", "itemStackContainerConfig", "portalKey",
      // Visuals
      "model", "scale", "texture", "animation", "reticleId", "reticleIndex",
      "playerAnimationsId", "usePlayerAnimations",
      // Categories
      "categories", "set",
      // Sounds
      "soundEventId", "soundEventIndex", "itemSoundSetId", "itemSoundSetIndex",
      // Effects
      "particles", "firstPersonParticles", "trails", "light",
      // Crafting & Resources
      "recipeToGenerate", "resourceTypes", "fuelQuality",
      // Durability
      "maxDurability", "durabilityLossOnHit",
      // Interactions
      "interactions", "interactionVars", "interactionConfig",
      // Entity & Display
      "itemEntityConfig", "droppedItemAnimation", "displayEntityStatsHUD",
      // Other
      "stateToBlock", "blockToState", "pullbackConfig", "clipsGeometry",
      "renderDeployablePreview", "dropOnDeath", "itemAppearanceConditions"
    ],
    types: {
      maxStack: "number",
      itemLevel: "number",
      scale: "number",
      maxDurability: "number",
      fuelQuality: "number",
      consumable: "boolean",
      variant: "boolean",
      hasBlockType: "boolean",
      usePlayerAnimations: "boolean",
      clipsGeometry: "boolean",
      renderDeployablePreview: "boolean",
      dropOnDeath: "boolean",
    },
    strict: false, // Permissive
  },
  npc: {
    required: [], // NPCs use ECS components, no fixed schema
    knownFields: [
      // NPC Builder fields
      "id", "name", "type",
      // Components (ECS-based)
      "components", "attributes", "combat", "ai", "behaviors",
      // Spawning
      "spawning", "weights", "rotation",
      // Visuals
      "model", "animation", "particles", "scale",
      // Stats
      "health", "maxHealth", "speed", "damage",
      // Interactions
      "interactions", "loot", "drops"
    ],
    types: {
      health: "number",
      maxHealth: "number",
      speed: "number",
      damage: "number",
      scale: "number",
    },
    strict: false, // ECS-based, very flexible
  },
  manifest: {
    required: ["Group", "Name", "Version", "Main"],
    knownFields: ["Group", "Name", "Version", "Description", "Authors", "Main", "IncludesAssetPack", "Dependencies", "LoadOrder", "Permissions"],
    types: {
      Group: "string",
      Name: "string",
      Version: "string",
      Description: "string",
      Authors: "array",
      Main: "string",
      IncludesAssetPack: "boolean",
      Dependencies: "array",
      LoadOrder: "string",
      Permissions: "object",
    },
    strict: true,
  },
};

const schemaDescriptions: Record<SchemaType, string> = {
  block: "BlockType definition (from BlockType.java)",
  item: "Item definition (from Item.java)",
  npc: "Entity/NPC definition (ECS-based)",
  manifest: "Plugin manifest.json file",
};

const exampleJson: Record<SchemaType, string> = {
  block: `{
  "Group": "decorative",
  "DrawType": "Cube",
  "Material": "Stone",
  "Opacity": "Opaque",
  "Textures": [
    { "texture": "Blocks/MyBlock.png" }
  ],
  "BlockSoundSetId": "BSS_Stone",
  "IsUsable": false,
  "HitboxType": "Full"
}`,
  item: `{
  "id": "mymod:magic_sword",
  "icon": "Items/MagicSword.png",
  "texture": "Items/MagicSword.png",
  "maxStack": 1,
  "itemLevel": 5,
  "categories": ["weapon", "sword"],
  "weapon": {
    "damage": 8,
    "attackSpeed": 1.2
  },
  "maxDurability": 500,
  "itemSoundSetId": "ISS_Sword"
}`,
  npc: `{
  "id": "mymod:custom_creature",
  "name": "Custom Creature",
  "type": "hostile",
  "health": 20,
  "maxHealth": 20,
  "speed": 1.0,
  "model": "Models/CustomCreature.blockymodel",
  "components": {
    "ai": { "behaviors": ["wander", "chase"] },
    "combat": { "damage": 3 }
  }
}`,
  manifest: `{
  "Group": "com.example",
  "Name": "MyPlugin",
  "Version": "1.0.0",
  "Description": "A description of what this plugin does",
  "Authors": [{ "Name": "YourName" }],
  "Main": "com.example.myplugin.MyPlugin",
  "IncludesAssetPack": false
}`,
};

function validateJson(json: string, schemaType: SchemaType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Try to parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      valid: false,
      errors: ["Invalid JSON syntax. Please check for missing commas, brackets, or quotes."],
      warnings: [],
    };
  }

  // Check if it's an object
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      errors: ["JSON must be an object, not an array or primitive value."],
      warnings: [],
    };
  }

  const schema = schemas[schemaType];

  // Check required fields
  for (const field of schema.required) {
    if (!(field in parsed)) {
      if (schema.strict) {
        errors.push(`Missing required field: "${field}"`);
      } else {
        warnings.push(`Recommended field missing: "${field}"`);
      }
    }
  }

  // Check field types for known fields
  for (const [field, value] of Object.entries(parsed)) {
    const expectedType = schema.types[field];
    if (expectedType && value !== null && value !== undefined) {
      const actualType = Array.isArray(value) ? "array" : typeof value;
      const allowedTypes = expectedType.split("|");
      if (!allowedTypes.includes(actualType)) {
        if (schema.strict) {
          errors.push(`Field "${field}" should be ${expectedType}, got ${actualType}`);
        } else {
          warnings.push(`Field "${field}" is typically ${expectedType}, got ${actualType}`);
        }
      }
    }
  }

  // Block-specific validations
  if (schemaType === "block") {
    const drawType = parsed.DrawType as string;
    if (drawType) {
      const validDrawTypes = ["Cube", "Cross", "Custom", "Liquid", "None", "Torch"];
      if (!validDrawTypes.includes(drawType)) {
        warnings.push(`DrawType "${drawType}" is not a known type (Cube, Cross, Custom, Liquid, None, Torch)`);
      }
    }

    const opacity = parsed.Opacity as string;
    if (opacity) {
      const validOpacity = ["Opaque", "Transparent", "Translucent"];
      if (!validOpacity.includes(opacity)) {
        warnings.push(`Opacity "${opacity}" should be Opaque, Transparent, or Translucent`);
      }
    }
  }

  // Item-specific validations
  if (schemaType === "item") {
    const maxStack = parsed.maxStack as number;
    if (typeof maxStack === "number" && maxStack !== -1 && (maxStack < 1 || maxStack > 999)) {
      warnings.push(`maxStack ${maxStack} is unusual (typically 1-999, or -1 for default)`);
    }
  }

  // Manifest-specific validations
  if (schemaType === "manifest") {
    const version = parsed.Version as string;
    if (version && typeof version === "string") {
      if (!/^\d+\.\d+\.\d+/.test(version)) {
        warnings.push(`Version "${version}" should follow semantic versioning (e.g., 1.0.0)`);
      }
    }

    const main = parsed.Main as string;
    if (main && typeof main === "string") {
      if (!main.includes(".")) {
        errors.push(`Main class "${main}" should be a fully qualified class name (e.g., com.example.MyPlugin)`);
      }
    }

    const loadOrder = parsed.LoadOrder as string;
    if (loadOrder && !["STARTUP", "POSTWORLD"].includes(loadOrder)) {
      errors.push(`LoadOrder must be "STARTUP" or "POSTWORLD", got "${loadOrder}"`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export default function JsonValidatorPage() {
  const [schemaType, setSchemaType] = useState<SchemaType>("block");
  const [jsonInput, setJsonInput] = useState(exampleJson.block);
  const [hasValidated, setHasValidated] = useState(false);

  const validation = useMemo(() => {
    if (!hasValidated) return null;
    return validateJson(jsonInput, schemaType);
  }, [jsonInput, schemaType, hasValidated]);

  const handleSchemaChange = (type: SchemaType) => {
    setSchemaType(type);
    setJsonInput(exampleJson[type]);
    setHasValidated(false);
  };

  const handleValidate = () => {
    setHasValidated(true);
  };

  const handleLoadExample = () => {
    setJsonInput(exampleJson[schemaType]);
    setHasValidated(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gradient mb-4">
          JSON Validator
        </h1>
        <p className="text-lg text-muted-foreground">
          Validate your Hytale JSON files against expected schemas.
        </p>
      </div>

      {/* Schema Type Selection */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Select Schema Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(schemas) as SchemaType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleSchemaChange(type)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  schemaType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <div className="font-semibold capitalize">{type}</div>
                <div className={`text-xs mt-1 ${schemaType === type ? "opacity-70" : "opacity-60"}`}>
                  {schemaDescriptions[type]}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">JSON Input</CardTitle>
              <CardDescription className="text-muted-foreground">
                Paste your JSON here
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadExample}
              className="bg-muted border-border hover:bg-muted/80 text-muted-foreground"
            >
              Load Example
            </Button>
          </CardHeader>
          <CardContent>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setHasValidated(false);
              }}
              className="w-full h-80 px-4 py-3 bg-background border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:border-primary resize-none"
              placeholder="Paste your JSON here..."
              spellCheck={false}
            />
            <Button
              onClick={handleValidate}
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <FileJson className="h-4 w-4 mr-2" />
              Validate JSON
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Validation Results</CardTitle>
            <CardDescription className="text-muted-foreground">
              {hasValidated ? "Analysis complete" : "Click Validate to check your JSON"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasValidated ? (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileJson className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Enter JSON and click Validate</p>
                </div>
              </div>
            ) : validation ? (
              <div className="space-y-4">
                {/* Status */}
                <div
                  className={`p-4 rounded-lg flex items-center gap-3 ${
                    validation.valid
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  {validation.valid ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-400" />
                      <div>
                        <div className="font-semibold text-green-400">Valid JSON</div>
                        <div className="text-sm text-muted-foreground">
                          Your {schemaType} definition passes all checks
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-400" />
                      <div>
                        <div className="font-semibold text-red-400">Invalid JSON</div>
                        <div className="text-sm text-muted-foreground">
                          {validation.errors.length} error(s) found
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Errors */}
                {validation.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Errors ({validation.errors.length})
                    </h4>
                    <ul className="space-y-2">
                      {validation.errors.map((error, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground bg-red-500/10 px-3 py-2 rounded-lg"
                        >
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Warnings ({validation.warnings.length})
                    </h4>
                    <ul className="space-y-2">
                      {validation.warnings.map((warning, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground bg-yellow-500/10 px-3 py-2 rounded-lg"
                        >
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Schema Info */}
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Schema: {schemaType}
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {schemas[schemaType].strict ? (
                      <>
                        <p>
                          <span className="text-primary">Required:</span>{" "}
                          {schemas[schemaType].required.join(", ")}
                        </p>
                        <p>
                          <span className="text-secondary">Known fields:</span>{" "}
                          {schemas[schemaType].knownFields.filter(f => !schemas[schemaType].required.includes(f)).join(", ")}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground/70">
                        This validator only checks JSON syntax. Official Hytale {schemaType} files have varying structures.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">About This Validator</h3>
        <p className="text-sm text-muted-foreground mb-4">
          For <strong>blocks, items, and NPCs</strong>, this tool validates JSON syntax only. Official Hytale files have varying structures that change between versions.
          For <strong>plugin manifests</strong>, it validates against the known plugin schema.
          Always test your content in-game as Hytale is in Early Access.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://hytale.com/news/2025/11/hytale-modding-strategy-and-status"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:text-primary transition-colors"
          >
            Modding Documentation
          </a>
          <a
            href="/docs/modding/data-assets/overview"
            className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground hover:text-primary transition-colors"
          >
            Data Assets Guide
          </a>
        </div>
      </div>
    </div>
  );
}
