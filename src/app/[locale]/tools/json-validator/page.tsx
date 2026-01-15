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

// Schema definitions - permissive mode for block/item/npc since official format varies
// Only manifest has strict requirements as it's for plugins
const schemas: Record<SchemaType, { required: string[]; knownFields: string[]; types: Record<string, string>; strict: boolean }> = {
  block: {
    required: [], // No required fields - official Hytale blocks vary in structure
    knownFields: ["id", "displayName", "name", "properties", "texture", "model", "drops", "sounds", "behaviors", "hardness", "resistance", "material", "translucent", "collidable", "replaceable", "flammable"],
    types: {},
    strict: false, // Allow any fields
  },
  item: {
    required: [], // No required fields - official Hytale items vary in structure
    knownFields: ["id", "displayName", "name", "type", "stackSize", "texture", "model", "durability", "damage", "enchantable", "maxStackSize", "rarity", "category"],
    types: {},
    strict: false, // Allow any fields
  },
  npc: {
    required: [], // No required fields - official Hytale NPCs vary in structure
    knownFields: ["id", "displayName", "name", "health", "model", "behaviors", "loot", "spawning", "attributes", "sounds", "maxHealth", "speed", "damage"],
    types: {},
    strict: false, // Allow any fields
  },
  manifest: {
    required: ["id", "name", "version", "main", "api_version"],
    knownFields: ["id", "name", "version", "main", "api_version", "description", "authors", "dependencies", "load_order", "permissions"],
    types: {
      id: "string",
      name: "string",
      version: "string",
      main: "string",
      api_version: "string",
      description: "string",
      authors: "array",
      dependencies: "object",
      load_order: "string",
      permissions: "object",
    },
    strict: true, // Plugin manifests have strict requirements
  },
};

const schemaDescriptions: Record<SchemaType, string> = {
  block: "Block definition JSON for custom blocks",
  item: "Item definition JSON for custom items",
  npc: "NPC/creature definition JSON",
  manifest: "Plugin manifest.json file",
};

const exampleJson: Record<SchemaType, string> = {
  block: `{
  "id": "mymod:ruby_block",
  "displayName": "Ruby Block",
  "properties": {
    "hardness": 3.0,
    "resistance": 5.0,
    "material": "stone"
  },
  "texture": "textures/blocks/ruby_block.png"
}`,
  item: `{
  "id": "mymod:magic_sword",
  "displayName": "Magic Sword",
  "type": "weapon",
  "stackSize": 1,
  "durability": 500,
  "damage": 8,
  "texture": "textures/items/magic_sword.png"
}`,
  npc: `{
  "id": "mymod:custom_creature",
  "displayName": "Custom Creature",
  "health": 20,
  "model": "models/custom_creature.blockymodel",
  "behaviors": [
    { "type": "wander" },
    { "type": "flee", "target": "player" }
  ],
  "attributes": {
    "speed": 1.0,
    "attack_damage": 3.0
  }
}`,
  manifest: `{
  "id": "my-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "A description of what this plugin does",
  "authors": ["YourName"],
  "main": "com.example.myplugin.MyPlugin",
  "api_version": "1.0",
  "dependencies": {
    "required": [],
    "optional": []
  },
  "load_order": "POSTWORLD"
}`,
};

function validateJson(json: string, schemaType: SchemaType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const info: string[] = [];

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

  // Check required fields (only for strict schemas like manifest)
  for (const field of schema.required) {
    if (!(field in parsed)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Check field types (only for strict schemas)
  if (schema.strict) {
    for (const [field, value] of Object.entries(parsed)) {
      const expectedType = schema.types[field];
      if (expectedType) {
        const actualType = Array.isArray(value) ? "array" : typeof value;
        const allowedTypes = expectedType.split("|");
        if (!allowedTypes.includes(actualType)) {
          errors.push(`Field "${field}" should be ${expectedType}, got ${actualType}`);
        }
      }
    }
  }

  // For non-strict schemas (block/item/npc), just provide helpful info
  if (!schema.strict) {
    const fieldCount = Object.keys(parsed).length;
    info.push(`Found ${fieldCount} field(s) in your JSON`);

    // Check for common fields
    if (parsed.id || parsed.name) {
      info.push(`Identifier: ${parsed.id || parsed.name}`);
    }
  }

  // Manifest-specific validations
  if (schemaType === "manifest") {
    // Version format
    const version = parsed.version as string;
    if (version && typeof version === "string") {
      if (!/^\d+\.\d+\.\d+/.test(version)) {
        warnings.push(`Version "${version}" should follow semantic versioning (e.g., 1.0.0)`);
      }
    }

    // Main class format
    const main = parsed.main as string;
    if (main && typeof main === "string") {
      if (!main.includes(".")) {
        errors.push(`Main class "${main}" should be a fully qualified class name (e.g., com.example.MyPlugin)`);
      }
    }

    // Load order validation
    const loadOrder = parsed.load_order as string;
    if (loadOrder && !["STARTUP", "POSTWORLD"].includes(loadOrder)) {
      errors.push(`load_order must be "STARTUP" or "POSTWORLD", got "${loadOrder}"`);
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
