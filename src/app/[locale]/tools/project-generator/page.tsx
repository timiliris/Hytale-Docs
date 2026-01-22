"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check } from "lucide-react";

type ProjectType = "plugin" | "mod" | "full";

interface ProjectConfig {
  type: ProjectType;
  name: string;
  packageName: string;
  author: string;
  description: string;
  version: string;
}

function generatePluginStructure(config: ProjectConfig): string {
  const { name, packageName, author, description, version } = config;
  const packagePath = packageName.replace(/\./g, "/");

  return `${name}/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── ${packagePath}/
│   │   │       ├── ${toPascalCase(name)}.java
│   │   │       ├── commands/
│   │   │       │   └── ExampleCommand.java
│   │   │       ├── listeners/
│   │   │       │   └── PlayerListener.java
│   │   │       └── util/
│   │   │           └── ConfigManager.java
│   │   └── resources/
│   │       ├── manifest.json
│   │       └── config.yml
│   └── test/
│       └── java/
│           └── ${packagePath}/
│               └── ${toPascalCase(name)}Test.java
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── README.md`;
}

function generateModStructure(config: ProjectConfig): string {
  const { name } = config;

  return `${name}/
├── packs/
│   ├── blocks/
│   │   └── example_block.json
│   ├── items/
│   │   └── example_item.json
│   └── npcs/
│       └── example_npc.json
├── models/
│   └── example_model.blockymodel
├── textures/
│   ├── blocks/
│   │   └── example_block.png
│   ├── items/
│   │   └── example_item.png
│   └── entities/
│       └── example_npc.png
├── animations/
│   └── example_animation.blockyanim
├── sounds/
│   └── example_sound.ogg
├── pack.json
└── README.md`;
}

function generateFullStructure(config: ProjectConfig): string {
  const { name, packageName } = config;
  const packagePath = packageName.replace(/\./g, "/");

  return `${name}/
├── plugin/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── ${packagePath}/
│   │       │       └── ${toPascalCase(name)}Plugin.java
│   │       └── resources/
│   │           └── manifest.json
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── content/
│   ├── packs/
│   │   ├── blocks/
│   │   ├── items/
│   │   └── npcs/
│   ├── models/
│   ├── textures/
│   └── animations/
├── gradle.properties
└── README.md`;
}

function generateBuildGradle(config: ProjectConfig): string {
  const { packageName, version } = config;

  return `plugins {
    java
    id("com.github.johnrengelman.shadow") version "8.1.1"
}

group = "${packageName}"
version = "${version}"

repositories {
    mavenCentral()
}

dependencies {
    // Hytale Server JAR - download from https://cdn.hytale.com/HytaleServer.jar
    // Place it in a 'libs' folder in your project root
    compileOnly(files("libs/HytaleServer.jar"))

    implementation("com.google.guava:guava:32.1.3-jre")
    implementation("com.google.code.gson:gson:2.10.1")

    testImplementation("org.junit.jupiter:junit-jupiter:5.10.1")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(25))
    }
}

tasks.test {
    useJUnitPlatform()
}

tasks.shadowJar {
    archiveClassifier.set("")
    relocate("com.google.gson", "${packageName}.libs.gson")
}

tasks.build {
    dependsOn(tasks.shadowJar)
}

tasks.processResources {
    filesMatching("manifest.json") {
        expand(
            "version" to project.version,
            "name" to project.name
        )
    }
}`;
}

function generateManifest(config: ProjectConfig): string {
  const { name, packageName, author, description, version } = config;

  return `{
  "id": "${toKebabCase(name)}",
  "name": "${name}",
  "version": "${version}",
  "description": "${description}",
  "authors": ["${author}"],
  "main": "${packageName}.${toPascalCase(name)}",
  "api_version": "1.0",
  "dependencies": {
    "required": [],
    "optional": []
  },
  "load_order": "POSTWORLD",
  "permissions": {
    "${toKebabCase(name)}.admin": {
      "description": "Full admin access",
      "default": "op"
    },
    "${toKebabCase(name)}.use": {
      "description": "Basic usage permission",
      "default": true
    }
  }
}`;
}

function generateMainClass(config: ProjectConfig): string {
  const { name, packageName } = config;
  const className = toPascalCase(name);

  return `package ${packageName};

import com.hypixel.hytale.server.core.plugin.JavaPlugin;
import com.hypixel.hytale.server.core.plugin.JavaPluginInit;

import javax.annotation.Nonnull;

public class ${className} extends JavaPlugin {

    private static ${className} instance;

    // Required constructor - must take JavaPluginInit parameter
    public ${className}(@Nonnull JavaPluginInit init) {
        super(init);
        instance = this;
    }

    @Override
    protected void setup() {
        // Called during plugin initialization
        // Register commands, events, assets, and components here
        getLogger().info("${name} is setting up...");

        // Register event listeners
        // getEventRegistry().register(
        //     com.hypixel.hytale.server.core.event.events.player.PlayerConnectEvent.class,
        //     event -> {
        //         getLogger().info("Player connected: " + event.getPlayer().getName());
        //     }
        // );

        // Register commands
        // getCommandRegistry().registerCommand(new YourCommand(this));

        getLogger().info("${name} setup complete!");
    }

    @Override
    protected void start() {
        // Called after all plugins are set up
        getLogger().info("${name} has started!");
    }

    @Override
    protected void shutdown() {
        // Called when plugin is shutting down
        getLogger().info("${name} is shutting down...");
    }

    public static ${className} getInstance() {
        return instance;
    }
}`;
}

function generatePackJson(config: ProjectConfig): string {
  const { name, author, description, version } = config;

  return `{
  "id": "${toKebabCase(name)}",
  "name": "${name}",
  "version": "${version}",
  "description": "${description}",
  "authors": ["${author}"],
  "dependencies": []
}`;
}

function generateExampleBlock(): string {
  return `{
  "id": "mymod:example_block",
  "displayName": "Example Block",
  "properties": {
    "hardness": 2.0,
    "resistance": 3.0,
    "material": "stone"
  },
  "texture": "textures/blocks/example_block.png"
}`;
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="bg-muted border-border hover:bg-muted/80 text-muted-foreground"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}

export default function ProjectGeneratorPage() {
  const [config, setConfig] = useState<ProjectConfig>({
    type: "plugin",
    name: "MyHytalePlugin",
    packageName: "com.example.myplugin",
    author: "YourName",
    description: "A Hytale plugin",
    version: "1.0.0",
  });

  const updateConfig = (key: keyof ProjectConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const getStructure = () => {
    switch (config.type) {
      case "plugin":
        return generatePluginStructure(config);
      case "mod":
        return generateModStructure(config);
      case "full":
        return generateFullStructure(config);
    }
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
          Project Generator
        </h1>
        <p className="text-lg text-muted-foreground">
          Generate a project structure for your Hytale plugin or mod with all the necessary files.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Configuration */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Configuration</CardTitle>
            <CardDescription className="text-muted-foreground">
              Configure your project settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Type */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Project Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["plugin", "mod", "full"] as ProjectType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => updateConfig("type", type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      config.type === type
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {type === "full" ? "Plugin + Mod" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Project Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => updateConfig("name", e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Package Name (for plugins) */}
            {(config.type === "plugin" || config.type === "full") && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Package Name
                </label>
                <input
                  type="text"
                  value={config.packageName}
                  onChange={(e) => updateConfig("packageName", e.target.value)}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                  placeholder="com.example.myplugin"
                />
              </div>
            )}

            {/* Author */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Author
              </label>
              <input
                type="text"
                value={config.author}
                onChange={(e) => updateConfig("author", e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description
              </label>
              <input
                type="text"
                value={config.description}
                onChange={(e) => updateConfig("description", e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            {/* Version */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Version
              </label>
              <input
                type="text"
                value={config.version}
                onChange={(e) => updateConfig("version", e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Structure Preview */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Project Structure</CardTitle>
              <CardDescription className="text-muted-foreground">
                Folder layout for your project
              </CardDescription>
            </div>
            <CopyButton text={getStructure()} label="Copy" />
          </CardHeader>
          <CardContent>
            <pre className="text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto">
              <code>{getStructure()}</code>
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Generated Files */}
      <div className="mt-8 space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Generated Files</h2>

        {(config.type === "plugin" || config.type === "full") && (
          <>
            {/* build.gradle.kts */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-lg">build.gradle.kts</CardTitle>
                <CopyButton text={generateBuildGradle(config)} label="Copy" />
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto max-h-64">
                  <code>{generateBuildGradle(config)}</code>
                </pre>
              </CardContent>
            </Card>

            {/* manifest.json */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-lg">manifest.json</CardTitle>
                <CopyButton text={generateManifest(config)} label="Copy" />
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto max-h-64">
                  <code>{generateManifest(config)}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Main Class */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-lg">{toPascalCase(config.name)}.java</CardTitle>
                <CopyButton text={generateMainClass(config)} label="Copy" />
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto max-h-64">
                  <code>{generateMainClass(config)}</code>
                </pre>
              </CardContent>
            </Card>
          </>
        )}

        {(config.type === "mod" || config.type === "full") && (
          <>
            {/* pack.json */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-lg">pack.json</CardTitle>
                <CopyButton text={generatePackJson(config)} label="Copy" />
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto">
                  <code>{generatePackJson(config)}</code>
                </pre>
              </CardContent>
            </Card>

            {/* Example Block */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-foreground text-lg">example_block.json</CardTitle>
                <CopyButton text={generateExampleBlock()} label="Copy" />
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground bg-background p-4 rounded-lg overflow-x-auto">
                  <code>{generateExampleBlock()}</code>
                </pre>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tech Stack Info */}
      <div className="mt-8 p-6 rounded-xl bg-muted/50 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3">Technology Stack</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Java</span>
            <p className="text-primary font-semibold">25</p>
          </div>
          <div>
            <span className="text-muted-foreground">Gradle</span>
            <p className="text-primary font-semibold">9.2.0</p>
          </div>
          <div>
            <span className="text-muted-foreground">Shadow Plugin</span>
            <p className="text-primary font-semibold">8.1.1</p>
          </div>
          <div>
            <span className="text-muted-foreground">Hytale API</span>
            <p className="text-primary font-semibold">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
