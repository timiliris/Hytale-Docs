---
id: server-infrastructure
title: "Server Infrastructure"
sidebar_label: Server Infrastructure
sidebar_position: 13
description: Comprehensive documentation of the Hytale server infrastructure - Update system, configuration v4, anchor actions, authentication, RocksDB storage, Sentry telemetry, console module, builder tools, and new commands.
---

# Server Infrastructure

This document provides a comprehensive technical reference for the major server infrastructure additions and changes in the latest Hytale server version. It covers the new update system, configuration v4, anchor actions, authentication overhaul, RocksDB storage, Sentry telemetry, console module, builder tools additions, and new utility commands.

All code references are from the decompiled source at `decompiled/com/hypixel/hytale/`.

---

## Table of Contents

1. [Update Module](#1-update-module)
2. [Configuration v4](#2-configuration-v4)
3. [AnchorActionModule](#3-anchoractionmodule)
4. [Authentication](#4-authentication)
5. [RocksDB Storage](#5-rocksdb-storage)
6. [Sentry Telemetry](#6-sentry-telemetry)
7. [Console Module](#7-console-module)
8. [Builder Tools Additions](#8-builder-tools-additions)
9. [Other New Commands](#9-other-new-commands)

---

## 1. Update Module

**Package:** `server.core.update`

The Update Module is a full-featured over-the-air (OTA) update system that enables the Hytale server to check for, download, stage, and apply updates automatically. It is implemented as a core plugin.

### 1.1 UpdateModule Class

**File:** `server/core/update/UpdateModule.java`

The `UpdateModule` extends `JavaPlugin` and serves as the main orchestrator for all update-related functionality. It is registered as a core plugin with a singleton accessor.

#### Fields

```java
// server/core/update/UpdateModule.java, lines 34-58
public static final PluginManifest MANIFEST = PluginManifest.corePlugin(UpdateModule.class).build();
private static final HytaleLogger LOGGER = HytaleLogger.forEnclosingClass();
public static final boolean KILL_SWITCH_ENABLED = SystemUtil.getEnvBoolean("HYTALE_DISABLE_UPDATES");
private static UpdateModule instance;

private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
   Thread t = new Thread(r, "UpdateChecker");
   t.setDaemon(true);
   return t;
});

private ScheduledFuture<?> updateCheckTask;
private ScheduledFuture<?> autoApplyTask;
private final AtomicReference<UpdateService.VersionManifest> latestKnownVersion = new AtomicReference<>();
private final AtomicReference<CompletableFuture<?>> activeDownload = new AtomicReference<>();
private final AtomicReference<Thread> activeDownloadThread = new AtomicReference<>();
private final AtomicBoolean downloadLock = new AtomicBoolean(false);
private final AtomicLong downloadStartTime = new AtomicLong(0L);
private final AtomicLong downloadedBytes = new AtomicLong(0L);
private final AtomicLong totalBytes = new AtomicLong(0L);
private final AtomicLong autoApplyScheduledTime = new AtomicLong(0L);
private final AtomicLong lastWarningTime = new AtomicLong(0L);
```

Key design decisions:
- All mutable state uses `Atomic*` types for thread safety
- The scheduler runs on a single daemon thread named `"UpdateChecker"`
- The kill switch (`HYTALE_DISABLE_UPDATES`) is read once at class load from environment variables

#### Lifecycle

**setup()** -- Registers the `/update` command tree. If the kill switch is enabled, logs a message and still registers the command (which will return a "disabled" message).

```java
// server/core/update/UpdateModule.java, lines 71-77
@Override
protected void setup() {
   if (KILL_SWITCH_ENABLED) {
      LOGGER.at(Level.INFO).log("Update commands disabled via HYTALE_DISABLE_UPDATES environment variable");
   }
   this.getCommandRegistry().registerCommand(new UpdateCommand());
}
```

**start()** -- Checks for a previously staged update (from a prior download that was not yet applied), and begins the periodic update check if conditions are met.

```java
// server/core/update/UpdateModule.java, lines 80-95
@Override
protected void start() {
   if (!KILL_SWITCH_ENABLED) {
      String stagedVersion = UpdateService.getStagedVersion();
      if (stagedVersion != null) {
         this.logStagedUpdateWarning(stagedVersion, true);
         this.startAutoApplyTaskIfNeeded();
      }
      if (this.shouldEnableUpdateChecker()) {
         UpdateConfig config = HytaleServer.get().getConfig().getUpdateConfig();
         int intervalSeconds = config.getCheckIntervalSeconds();
         LOGGER.at(Level.INFO).log("Update checker enabled (interval: %ds)", intervalSeconds);
         this.updateCheckTask = this.scheduler.scheduleAtFixedRate(
            this::performUpdateCheck, 60L, (long)intervalSeconds, TimeUnit.SECONDS
         );
      }
   }
}
```

The update checker is only enabled when **all** of the following are true:
1. The server is running from a JAR file (not from an IDE)
2. The server is NOT in singleplayer mode
3. The `Update.Enabled` config is `true`
4. The patchline is not `"dev"` (unless overridden in config)
5. The folder layout is valid (parent directory contains `Assets.zip` and `start.sh`/`start.bat`)

**shutdown()** -- Cancels both the check task and auto-apply task, then shuts down the executor.

```java
// server/core/update/UpdateModule.java, lines 108-119
@Override
protected void shutdown() {
   if (this.updateCheckTask != null) {
      this.updateCheckTask.cancel(false);
   }
   if (this.autoApplyTask != null) {
      this.autoApplyTask.cancel(false);
   }
   this.scheduler.shutdown();
}
```

**onServerReady()** -- Called after the server has fully booted. Displays a reminder to the console if a staged update is pending.

#### Download Progress Tracking

The module tracks download progress using atomic counters:

```java
// server/core/update/UpdateModule.java, lines 161-193
public void updateDownloadProgress(long downloaded, long total) {
   if (this.downloadStartTime.get() == 0L) {
      this.downloadStartTime.set(System.currentTimeMillis());
   }
   this.downloadedBytes.set(downloaded);
   this.totalBytes.set(total);
}

public UpdateModule.DownloadProgress getDownloadProgress() {
   if (!this.downloadLock.get()) return null;
   long start = this.downloadStartTime.get();
   long downloaded = this.downloadedBytes.get();
   long total = this.totalBytes.get();
   if (start != 0L && total > 0L) {
      int percent = (int)(downloaded * 100L / total);
      long elapsed = System.currentTimeMillis() - start;
      long etaSeconds = -1L;
      if (elapsed > 0L && downloaded > 0L) {
         double bytesPerMs = (double)downloaded / (double)elapsed;
         long remaining = total - downloaded;
         etaSeconds = (long)((double)remaining / bytesPerMs / 1000.0);
      }
      return new DownloadProgress(percent, downloaded, total, etaSeconds);
   }
   return new DownloadProgress(0, 0L, total, -1L);
}

public static record DownloadProgress(int percent, long downloadedBytes, long totalBytes, long etaSeconds) {}
```

The `DownloadProgress` record provides percentage, downloaded/total bytes, and an ETA in seconds.

#### Download Lock

Only one download can be active at a time, enforced via `compareAndSet`:

```java
// server/core/update/UpdateModule.java, lines 143-159
public boolean tryAcquireDownloadLock() {
   return this.downloadLock.compareAndSet(false, true);
}

public void releaseDownloadLock() {
   this.activeDownload.set(null);
   this.activeDownloadThread.set(null);
   this.downloadLock.set(false);
   this.downloadStartTime.set(0L);
   this.downloadedBytes.set(0L);
   this.totalBytes.set(0L);
}
```

#### Auto-Apply Modes

The auto-apply system uses three modes defined in `UpdateConfig.AutoApplyMode`:

| Mode | Behavior |
|------|----------|
| `DISABLED` | No automatic application. The operator must run `/update apply --confirm`. |
| `WHEN_EMPTY` | Applies the update immediately when no players are online. |
| `SCHEDULED` | Warns players, waits `AutoApplyDelayMinutes` (default 30), then shuts down. |

**WHEN_EMPTY logic:**

```java
// server/core/update/UpdateModule.java, lines 343-392
private void checkAutoApply(String stagedVersion) {
   UpdateConfig config = HytaleServer.get().getConfig().getUpdateConfig();
   UpdateConfig.AutoApplyMode mode = config.getAutoApplyMode();
   // ...
   int playerCount = universe.getPlayers().size();
   if (playerCount == 0) {
      LOGGER.at(Level.INFO).log("No players online - auto-applying update %s", stagedVersion);
      this.triggerAutoApply();
   } else if (mode != UpdateConfig.AutoApplyMode.WHEN_EMPTY) {
      // SCHEDULED mode logic: set timer, warn players, apply after delay
   }
}
```

**SCHEDULED mode** sends periodic warnings to players (every 5 minutes, then every 30 seconds in the last minute), and triggers a shutdown with `ShutdownReason.UPDATE` when the timer expires.

#### Player Notifications

Players with the `hytale.system.update.notify` permission receive in-game messages when an update is available:

```java
// server/core/update/UpdateModule.java, lines 408-420
private void notifyPlayers(String version) {
   Universe universe = Universe.get();
   if (universe != null) {
      Message message = Message.translation("server.update.notify_players").param("version", version);
      PermissionsModule permissionsModule = PermissionsModule.get();
      for (PlayerRef player : universe.getPlayers()) {
         if (permissionsModule.hasPermission(player.getUuid(), "hytale.system.update.notify")) {
            player.sendMessage(message);
         }
      }
   }
}
```

### 1.2 UpdateService

**File:** `server/core/update/UpdateService.java`

The `UpdateService` handles HTTP communication with the Hytale account-data CDN to check for new versions and download updates.

#### Constants

```java
// server/core/update/UpdateService.java, lines 42-47
private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30L);
private static final Duration DOWNLOAD_TIMEOUT = Duration.ofMinutes(30L);
private static final Path STAGING_DIR = Path.of("..").resolve("updater").resolve("staging");
private static final Path BACKUP_DIR = Path.of("..").resolve("updater").resolve("backup");
private final String accountDataUrl = "https://account-data.hytale.com";
```

The staging and backup directories are always relative to the parent of the server working directory (the `Server/` folder), forming the layout:

```
HytaleServerRoot/
  updater/
    staging/    <-- new update files extracted here
    backup/     <-- current files backed up here before apply
  Server/
    HytaleServer.jar
    config.json
  Assets.zip
  start.sh / start.bat
```

#### VersionManifest

The version manifest is a JSON document fetched from the CDN containing:

```java
// server/core/update/UpdateService.java, lines 371-388
public static class VersionManifest {
   public String version;
   public String downloadUrl;
   public String sha256;
   // CODEC omitted for brevity
}
```

The manifest URL follows the pattern: `https://account-data.hytale.com/game-assets/version/{patchline}.json`

#### Update Check Flow

1. Obtain OAuth access token from `ServerAuthManager`
2. Request a signed URL from the account-data service (bearer token auth)
3. Fetch the version manifest JSON from the signed URL
4. Decode with `VersionManifest.CODEC`
5. Compare `manifest.version` against `ManifestUtil.getImplementationVersion()`

```java
// server/core/update/UpdateService.java, lines 54-106
public CompletableFuture<VersionManifest> checkForUpdate(String patchline) {
   return CompletableFuture.supplyAsync(() -> {
      ServerAuthManager authManager = ServerAuthManager.getInstance();
      String accessToken = authManager.getOAuthAccessToken();
      if (accessToken == null) { /* not authenticated */ return null; }

      String manifestPath = String.format("version/%s.json", patchline);
      String signedUrl = this.getSignedUrl(accessToken, manifestPath);
      // ... HTTP GET, JSON decode ...
      return manifest;
   });
}
```

#### Download Flow

The download runs on a dedicated daemon thread named `"UpdateDownload"`:

1. Acquire a signed URL for `manifest.downloadUrl`
2. Stream-download to a temp file with SHA-256 hash verification
3. Verify checksum against `manifest.sha256`
4. Extract ZIP to the staging directory
5. Report progress via `ProgressCallback`

```java
// server/core/update/UpdateService.java, lines 108-129
public DownloadTask downloadUpdate(VersionManifest manifest, Path stagingDir, ProgressCallback progressCallback) {
   CompletableFuture<Boolean> future = new CompletableFuture<>();
   Thread thread = new Thread(() -> {
      try {
         boolean result = this.performDownload(manifest, stagingDir, progressCallback);
         future.complete(result);
      } catch (CancellationException e) {
         future.completeExceptionally(e);
      } catch (InterruptedException e) {
         Thread.currentThread().interrupt();
         future.completeExceptionally(new CancellationException("Update download interrupted"));
      } catch (Exception e) {
         future.complete(false);
      }
   }, "UpdateDownload");
   thread.setDaemon(true);
   thread.start();
   return new DownloadTask(future, thread);
}
```

The download is cancellable: the thread checks `Thread.currentThread().isInterrupted()` during the streaming loop.

#### Patchline Resolution

```java
// server/core/update/UpdateService.java, lines 240-249
public static String getEffectivePatchline() {
   UpdateConfig config = HytaleServer.get().getConfig().getUpdateConfig();
   String patchline = config.getPatchline();
   if (patchline != null && !patchline.isEmpty()) {
      return patchline;
   }
   patchline = ManifestUtil.getPatchline();
   return patchline != null ? patchline : "release";
}
```

Priority: Config `Patchline` then JAR manifest patchline then `"release"` default.

#### Staged Version Detection

```java
// server/core/update/UpdateService.java, lines 267-269
public static String getStagedVersion() {
   Path stagedJar = STAGING_DIR.resolve("Server").resolve("HytaleServer.jar");
   return !Files.exists(stagedJar) ? null : readVersionFromJar(stagedJar);
}
```

Reads `Implementation-Version` from the staged JAR's `MANIFEST.MF`, but only if `Implementation-Vendor-Id` equals `"com.hypixel.hytale"`.

#### Safety Mechanisms

The `safeDeleteUpdaterDir` method refuses to delete directories that are not within the expected `updater/` path:

```java
// server/core/update/UpdateService.java, lines 296-318
private static boolean safeDeleteUpdaterDir(Path dir, String expectedName) {
   Path absolute = dir.toAbsolutePath().normalize();
   Path parent = absolute.getParent();
   if (parent == null || !parent.getFileName().toString().equals("updater")) {
      LOGGER.at(Level.SEVERE).log("Refusing to delete %s - not within updater/ directory", absolute);
      return false;
   }
   if (!absolute.getFileName().toString().equals(expectedName)) {
      LOGGER.at(Level.SEVERE).log("Refusing to delete %s - unexpected directory name", absolute);
      return false;
   }
   FileUtil.deleteDirectory(dir);
   return true;
}
```

### 1.3 Update Commands

**File:** `server/core/update/command/UpdateCommand.java`

The `/update` command is an `AbstractCommandCollection` that registers six subcommands:

```java
// server/core/update/command/UpdateCommand.java, lines 13-24
public class UpdateCommand extends AbstractCommandCollection {
   public UpdateCommand() {
      super("update", "server.commands.update.desc");
      this.addSubCommand(new UpdateCheckCommand());
      this.addSubCommand(new UpdateDownloadCommand());
      this.addSubCommand(new UpdateApplyCommand());
      this.addSubCommand(new UpdateCancelCommand());
      this.addSubCommand(new UpdateStatusCommand());
      this.addSubCommand(new UpdatePatchlineCommand());
   }
}
```

If the kill switch is active, the entire command collection returns a "disabled" message.

| Subcommand | Description |
|------------|-------------|
| `/update check` | Checks for a new version against the patchline CDN |
| `/update download [--force]` | Downloads and stages an update. `--force` bypasses layout validation |
| `/update apply --confirm` | Backs up current files and triggers shutdown for update |
| `/update cancel` | Cancels an active download and/or deletes staged files |
| `/update status` | Shows current version, patchline, staged version, download progress |
| `/update patchline [value]` | Gets or sets the update patchline |

**UpdateApplyCommand** (lines 22-127) is notable because it:
1. Backs up `HytaleServer.jar`, `HytaleServer.aot`, `Licenses/`, and `Assets.zip`
2. Optionally runs a full world backup if `RunBackupBeforeUpdate` is enabled
3. Backs up config files (`config.json`, `permissions.json`, `bans.json`, `whitelist.json`)
4. Triggers `HytaleServer.get().shutdownServer(ShutdownReason.UPDATE)`

```java
// server/core/update/command/UpdateApplyCommand.java, lines 31, 80-110
private static final String[] CONFIG_FILES = new String[]{
   "config.json", "permissions.json", "bans.json", "whitelist.json"
};

private void backupCurrentFiles() throws IOException {
   Path backupDir = UpdateService.getBackupDir();
   Path backupServerDir = backupDir.resolve("Server");
   // ... backup JAR, AOT, Licenses, Assets.zip ...
}
```

### 1.4 Environment Variables and Kill Switch

| Variable | Purpose |
|----------|---------|
| `HYTALE_DISABLE_UPDATES` | Boolean. Completely disables all update commands and checks. |
| `HYTALE_SERVER_SESSION_TOKEN` | Used by the auth system; required for update checks to authenticate against the CDN. |
| `HYTALE_SERVER_IDENTITY_TOKEN` | Used by the auth system alongside session tokens. |

---

## 2. Configuration v4

**File:** `server/core/HytaleServerConfig.java`

### 2.1 Version Migration

The config version has been bumped from 3 to 4:

```java
// server/core/HytaleServerConfig.java, lines 43, 48-50
public static final int VERSION = 4;

public static final BuilderCodec<HytaleServerConfig> CODEC = BuilderCodec.builder(...)
   .versioned()
   .codecVersion(4)
   // ...
```

The migration logic at decode time handles backward compatibility:

```java
// server/core/HytaleServerConfig.java, lines 113-136
.afterDecode((config, extraInfo) -> {
   // ... wire up parent references ...

   // Migrate "Plugins" -> "Mods" (v0-v2 legacy key)
   if (config.legacyPluginConfig != null && !config.legacyPluginConfig.isEmpty()) {
      for (Entry<PluginIdentifier, ModConfig> entry : config.legacyPluginConfig.entrySet()) {
         config.modConfig.putIfAbsent(entry.getKey(), entry.getValue());
      }
      config.legacyPluginConfig = null;
      config.markChanged();
   }

   // v3->v4: DefaultModsEnabled migration
   if (config.defaultModsEnabled == null && extraInfo.getVersion() < 4) {
      config.defaultModsEnabled = true;
   }

   // Force re-save if upgrading
   if (extraInfo.getVersion() != 4) {
      config.markChanged();
   }
})
```

### 2.2 New Fields in v4

#### DefaultModsEnabled

```java
// server/core/HytaleServerConfig.java, lines 94-96
.<Boolean>append(new KeyedCodec<>("DefaultModsEnabled", Codec.BOOLEAN),
   (o, v) -> o.defaultModsEnabled = v, o -> o.defaultModsEnabled)
.setVersionRange(4, 2147483647)  // Only serialized for v4+
.add()
```

```java
// server/core/HytaleServerConfig.java, lines 304-306
public boolean getDefaultModsEnabled() {
   return this.defaultModsEnabled != null ? this.defaultModsEnabled : !Constants.SINGLEPLAYER;
}
```

- Defaults to `true` when upgrading from v3 (to preserve existing behavior)
- Defaults to `!SINGLEPLAYER` for fresh configs
- Controls whether built-in mods are loaded by default

#### SkipModValidationForVersion

```java
// server/core/HytaleServerConfig.java, lines 109
.append(new KeyedCodec<>("SkipModValidationForVersion", Codec.STRING),
   (o, v) -> o.skipModValidationForVersion = v, o -> o.skipModValidationForVersion)
```

```java
// server/core/HytaleServerConfig.java, lines 359-361
public boolean shouldSkipModValidation() {
   return this.skipModValidationForVersion != null
      && this.skipModValidationForVersion.equals(ManifestUtil.getImplementationRevisionId());
}
```

This allows operators to skip mod validation for a specific server build revision. When the server updates to a new revision, validation is automatically re-enabled.

### 2.3 UpdateConfig

**File:** `server/core/config/UpdateConfig.java`

All fields, their types, defaults, and documentation:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `Enabled` | `Boolean` | `true` | Enables automatic update checks |
| `CheckIntervalSeconds` | `Integer` | `3600` (1 hour) | Interval between automatic update checks |
| `NotifyPlayersOnAvailable` | `Boolean` | `true` | Notify permissioned players in-game when an update is available |
| `Patchline` | `String` | `null` | Override patchline for update checks |
| `RunBackupBeforeUpdate` | `Boolean` | `true` | Run a full world backup before applying an update |
| `BackupConfigBeforeUpdate` | `Boolean` | `true` | Back up config files before applying an update |
| `AutoApplyMode` | `AutoApplyMode` | `DISABLED` | Automatic update application mode |
| `AutoApplyDelayMinutes` | `Integer` | `30` | Delay before auto-applying when using SCHEDULED mode |

```java
// server/core/config/UpdateConfig.java, lines 12-13, 154-158
public static final int DEFAULT_CHECK_INTERVAL_SECONDS = 3600;

public static enum AutoApplyMode {
   DISABLED,
   WHEN_EMPTY,
   SCHEDULED;
}
```

Example `config.json` section:

```json
{
  "Update": {
    "Enabled": true,
    "CheckIntervalSeconds": 3600,
    "NotifyPlayersOnAvailable": true,
    "AutoApplyMode": "WHEN_EMPTY",
    "AutoApplyDelayMinutes": 30,
    "RunBackupBeforeUpdate": true,
    "BackupConfigBeforeUpdate": true
  }
}
```

### 2.4 BackupConfig

**File:** `server/core/config/BackupConfig.java`

| Field | Type | Default | CLI Override |
|-------|------|---------|-------------|
| `Enabled` | `Boolean` | `false` | `--backup` (forces true) |
| `FrequencyMinutes` | `Integer` | `30` | `--backup-frequency` |
| `Directory` | `String` | `null` | `--backup-directory` |
| `MaxCount` | `Integer` | `5` | `--backup-max-count` |
| `ArchiveMaxCount` | `Integer` | `5` | `--backup-archive-max-count` |

```java
// server/core/config/BackupConfig.java, lines 15-17
public static final int DEFAULT_FREQUENCY_MINUTES = 30;
public static final int DEFAULT_MAX_COUNT = 5;
public static final int DEFAULT_ARCHIVE_MAX_COUNT = 5;
```

CLI options always take precedence over config file values:

```java
// server/core/config/BackupConfig.java, lines 84-91
public int getFrequencyMinutes() {
   OptionSet optionSet = Options.getOptionSet();
   if (optionSet.has(Options.BACKUP_FREQUENCY_MINUTES)) {
      return Math.max(optionSet.valueOf(Options.BACKUP_FREQUENCY_MINUTES), 1);
   }
   return this.frequencyMinutes != null ? Math.max(this.frequencyMinutes, 1) : 30;
}
```

The `isConfigured()` helper returns `true` only when both enabled and a directory is set:

```java
// server/core/config/BackupConfig.java, lines 169-171
public boolean isConfigured() {
   return this.isEnabled() && this.getDirectory() != null;
}
```

---

## 3. AnchorActionModule

**Package:** `server.core.modules.anchoraction`

### 3.1 Module Class

**File:** `server/core/modules/anchoraction/AnchorActionModule.java`

The `AnchorActionModule` is a core plugin that provides a JSON-based RPC mechanism for handling "anchor actions" -- client-initiated actions that require server-side processing. This is used for interactive UI elements such as clickable links or action buttons.

```java
// server/core/modules/anchoraction/AnchorActionModule.java, lines 18-22
public class AnchorActionModule extends JavaPlugin {
   public static final PluginManifest MANIFEST = PluginManifest.corePlugin(AnchorActionModule.class).build();
   private static AnchorActionModule instance;
   private final Map<String, AnchorActionHandler> handlers = new ConcurrentHashMap<>();
```

The handler registry is a `ConcurrentHashMap` keyed by action name.

### 3.2 Handler Interface

**File:** `server/core/modules/anchoraction/AnchorActionHandler.java`

```java
// server/core/modules/anchoraction/AnchorActionHandler.java, lines 7-10
@FunctionalInterface
public interface AnchorActionHandler {
   void handle(@Nonnull PlayerRef var1, @Nonnull JsonObject var2);
}
```

### 3.3 Registration API

Two `register` overloads are provided:

**Basic registration** -- The handler receives the player reference and the raw JSON:

```java
// server/core/modules/anchoraction/AnchorActionModule.java, lines 33-35
public void register(@Nonnull String action, @Nonnull AnchorActionHandler handler) {
   this.handlers.put(action, handler);
}
```

**World-thread-safe registration** -- Wraps the handler to ensure it executes on the correct world thread:

```java
// server/core/modules/anchoraction/AnchorActionModule.java, lines 37-50
public void register(@Nonnull String action, @Nonnull WorldThreadAnchorActionHandler handler) {
   this.register(action, (playerRef, data) -> {
      Ref<EntityStore> ref = playerRef.getReference();
      if (ref != null) {
         Store<EntityStore> store = ref.getStore();
         World world = store.getExternalData().getWorld();
         world.execute(() -> {
            if (ref.isValid()) {
               handler.handle(playerRef, ref, store, data);
            }
         });
      }
   });
}
```

The `WorldThreadAnchorActionHandler` interface:

```java
// server/core/modules/anchoraction/AnchorActionModule.java, lines 79-82
@FunctionalInterface
public interface WorldThreadAnchorActionHandler {
   void handle(@Nonnull PlayerRef, @Nonnull Ref<EntityStore>, @Nonnull Store<EntityStore>, @Nonnull JsonObject);
}
```

### 3.4 Action Dispatch

```java
// server/core/modules/anchoraction/AnchorActionModule.java, lines 56-77
public boolean tryHandle(@Nonnull PlayerRef playerRef, @Nonnull String rawData) {
   String action = null;
   try {
      JsonObject data = JsonParser.parseString(rawData).getAsJsonObject();
      if (!data.has("action")) return false;
      action = data.get("action").getAsString();
      AnchorActionHandler handler = this.handlers.get(action);
      if (handler == null) return false;
      handler.handle(playerRef, data);
      return true;
   } catch (Exception e) {
      LOGGER.atWarning().withCause(e).log("Failed to handle anchor action '%s' for player %s", action, playerRef.getUuid());
      return false;
   }
}
```

Expected JSON format:

```json
{
  "action": "actionName",
  "param1": "value1",
  "param2": 42
}
```

### 3.5 Usage Pattern (for plugin developers)

```java
// Example registration in a plugin's setup() method
AnchorActionModule.get().register("mymod:openShop", (playerRef, data) -> {
    String shopId = data.get("shopId").getAsString();
    // Handle opening shop for player
});

// World-thread-safe variant
AnchorActionModule.get().register("mymod:placeBlock",
    (playerRef, ref, store, data) -> {
        // This runs on the world thread -- safe to modify world state
        int x = data.get("x").getAsInt();
        int y = data.get("y").getAsInt();
        int z = data.get("z").getAsInt();
        // ...
    });

// Cleanup
AnchorActionModule.get().unregister("mymod:openShop");
```

---

## 4. Authentication

**Package:** `server.core.auth`

### 4.1 ProfileServiceClient (New)

**File:** `server/core/auth/ProfileServiceClient.java`

A new HTTP client for looking up public game profiles by UUID or username, communicating with `https://account-data.hytale.com`.

```java
// server/core/auth/ProfileServiceClient.java, lines 24-37
public class ProfileServiceClient {
   private final HttpClient httpClient;
   private final String profileServiceUrl;

   public ProfileServiceClient(@Nonnull String profileServiceUrl) {
      // ... validates URL, creates HttpClient ...
   }
}
```

**API methods:**

```java
// server/core/auth/ProfileServiceClient.java, lines 40-81
// Synchronous lookup by UUID
public PublicGameProfile getProfileByUuid(@Nonnull UUID uuid, @Nonnull String bearerToken);

// Async wrapper
public CompletableFuture<PublicGameProfile> getProfileByUuidAsync(@Nonnull UUID uuid, @Nonnull String bearerToken);

// Synchronous lookup by username
public PublicGameProfile getProfileByUsername(@Nonnull String username, @Nonnull String bearerToken);

// Async wrapper
public CompletableFuture<PublicGameProfile> getProfileByUsernameAsync(@Nonnull String username, @Nonnull String bearerToken);
```

The `PublicGameProfile` response contains:

```java
// server/core/auth/ProfileServiceClient.java, lines 132-158
public static class PublicGameProfile {
   private UUID uuid;
   private String username;
   // ... CODEC, getters ...
}
```

REST endpoints:
- `GET /profile/uuid/{uuid}` -- Returns profile by UUID
- `GET /profile/username/{username}` -- Returns profile by username (URL-encoded)

All requests include:
- `Authorization: Bearer {token}`
- `User-Agent: HytaleServer/{version}`
- 30-second timeout

### 4.2 SessionServiceClient

**File:** `server/core/auth/SessionServiceClient.java`

The session service client communicates with `https://sessions.hytale.com` and provides:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `requestAuthorizationGrantAsync` | `POST /server-join/auth-grant` | Exchange identity token for auth grant |
| `exchangeAuthGrantForTokenAsync` | `POST /server-join/auth-token` | Exchange auth grant + x509 fingerprint for access token |
| `getJwks` | `GET /.well-known/jwks.json` | Fetch JWKS for token validation |
| `getGameProfiles` | `GET https://account-data.hytale.com/my-account/get-profiles` | Fetch game profiles for an account |
| `createGameSession` | `POST /game-session/new` | Create a new game session |
| `refreshSessionAsync` | `POST /game-session/refresh` | Refresh an existing session |
| `terminateSession` | `DELETE /game-session` | Terminate a session (used on shutdown) |

Notable: The HTTP executor uses **virtual threads** (`Executors.newVirtualThreadPerTaskExecutor()`).

```java
// server/core/auth/SessionServiceClient.java, line 29
private static final ExecutorService HTTP_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();
```

### 4.3 Token Validation Flow (JWTValidator)

**File:** `server/core/auth/JWTValidator.java`

The JWT validator verifies tokens using **EdDSA (Ed25519)** signatures:

```java
// server/core/auth/JWTValidator.java, lines 28-29
private static final JWSAlgorithm SUPPORTED_ALGORITHM = JWSAlgorithm.EdDSA;
private static final int MIN_SIGNATURE_LENGTH = 80;
private static final int MAX_SIGNATURE_LENGTH = 90;
```

Validation steps for access tokens:
1. **Structure validation** -- Verify 3 parts, non-empty signature, signature length 80-90 chars
2. **Algorithm check** -- Must be EdDSA
3. **Signature verification** -- Against JWKS with automatic retry on fresh keys
4. **Claims extraction** -- issuer, audience, subject, username, IP, timestamps, certificate fingerprint
5. **Issuer check** -- Must match expected issuer (`https://sessions.hytale.com`)
6. **Audience check** -- Must match server audience
7. **Expiration check** -- With 5-minute clock skew tolerance
8. **Not-before check** -- With 5-minute clock skew tolerance
9. **Future issuance check** -- Reject tokens issued in the future
10. **Certificate binding** -- Validate `cnf.x5t#S256` claim against client cert
11. **Subject UUID validation** -- Must be a valid UUID

JWKS caching:
- Keys are cached permanently after first fetch
- Force refresh only occurs if verification fails AND the last refresh was more than 5 minutes ago

```java
// server/core/auth/JWTValidator.java, line 31
private static final Duration JWKS_REFRESH_MIN_INTERVAL = Duration.ofMinutes(5L);
```

### 4.4 ServerAuthManager

**File:** `server/core/auth/ServerAuthManager.java`

The `ServerAuthManager` is a singleton that manages the entire server authentication lifecycle.

**Auth Modes:**

```java
// server/core/auth/ServerAuthManager.java, lines 843-851
public static enum AuthMode {
   NONE,
   SINGLEPLAYER,
   EXTERNAL_SESSION,
   OAUTH_BROWSER,
   OAUTH_DEVICE,
   OAUTH_STORE;
}
```

**Token sources (in priority order):**

1. CLI option `--session-token` / `--identity-token`
2. Environment variables `HYTALE_SERVER_SESSION_TOKEN` / `HYTALE_SERVER_IDENTITY_TOKEN`
3. Stored OAuth credentials (from previous `/auth login`)

```java
// server/core/auth/ServerAuthManager.java, lines 100-124
boolean hasCliTokens = false;
String sessionTokenValue = null;
if (optionSet.has(Options.SESSION_TOKEN)) {
   sessionTokenValue = optionSet.valueOf(Options.SESSION_TOKEN);
} else {
   String envToken = System.getenv("HYTALE_SERVER_SESSION_TOKEN");
   if (envToken != null && !envToken.isEmpty()) {
      sessionTokenValue = envToken;
   }
}
// ... same pattern for identity token ...
```

**Session refresh:**

The manager schedules automatic token refresh 5 minutes before expiry:

```java
// server/core/auth/ServerAuthManager.java, lines 757-768
private void setExpiryAndScheduleRefresh(@Nonnull Instant expiry) {
   this.tokenExpiry = expiry;
   if (this.refreshTask != null) {
      this.refreshTask.cancel(false);
   }
   long secondsUntilExpiry = expiry.getEpochSecond() - Instant.now().getEpochSecond();
   if (secondsUntilExpiry > 300L) {
      long refreshDelay = Math.max(secondsUntilExpiry - 300L, 60L);
      this.refreshTask = this.refreshScheduler.schedule(this::doRefresh, refreshDelay, TimeUnit.SECONDS);
   }
}
```

### 4.5 AuthConfig

**File:** `server/core/auth/AuthConfig.java`

Service URLs and constants:

```java
// server/core/auth/AuthConfig.java, lines 8-22
public static final String USER_AGENT = "HytaleServer/" + ManifestUtil.getImplementationVersion();
public static final String OAUTH_AUTH_URL = "https://oauth.accounts.hytale.com/oauth2/auth";
public static final String OAUTH_TOKEN_URL = "https://oauth.accounts.hytale.com/oauth2/token";
public static final String DEVICE_AUTH_URL = "https://oauth.accounts.hytale.com/oauth2/device/auth";
public static final String CONSENT_REDIRECT_URL = "https://accounts.hytale.com/consent/client";
public static final String SESSION_SERVICE_URL = "https://sessions.hytale.com";
public static final String ACCOUNT_DATA_URL = "https://account-data.hytale.com";
public static final String CLIENT_ID = "hytale-server";
public static final String[] SCOPES = new String[]{"openid", "offline", "auth:server"};
public static final Duration HTTP_TIMEOUT = Duration.ofSeconds(30L);
```

### 4.6 GameProfile

Defined as an inner class on `SessionServiceClient`:

```java
// server/core/auth/SessionServiceClient.java, lines 366-380
public static class GameProfile {
   public UUID uuid;
   public String username;
   // CODEC maps "uuid" (as UUID_STRING) and "username"
}
```

The `PublicGameProfile` in `ProfileServiceClient` has the same fields but is used for public lookups of other players, whereas `GameProfile` represents the server owner's profile.

---

## 5. RocksDB Storage

**Package:** `server.core.universe.world.storage.provider`

### 5.1 RocksDbChunkStorageProvider

**File:** `server/core/universe/world/storage/provider/RocksDbChunkStorageProvider.java`

The RocksDB chunk storage provider is a high-performance alternative to the default file-based chunk storage. It stores all chunks in a RocksDB database within the world save directory.

```java
// RocksDbChunkStorageProvider.java, lines 39-44
public class RocksDbChunkStorageProvider implements IChunkStorageProvider<RocksDbResource> {
   public static final String ID = "RocksDb";
   public static final BuilderCodec<RocksDbChunkStorageProvider> CODEC = BuilderCodec.builder(
      RocksDbChunkStorageProvider.class, RocksDbChunkStorageProvider::new
   ).build();
}
```

### 5.2 Compression Strategy

The provider uses a **tiered compression** approach:

```java
// RocksDbChunkStorageProvider.java, lines 58-71
ColumnFamilyOptions chunkColumnOptions = new ColumnFamilyOptions()
   .setCompressionType(CompressionType.LZ4_COMPRESSION)            // Fast for hot data
   .setBottommostCompressionType(CompressionType.ZSTD_COMPRESSION) // Better ratio for cold data
   .setTableFormatConfig(
      new BlockBasedTableConfig()
         .setIndexType(IndexType.kHashSearch)
         .setFilterPolicy(bloomFilter)
         .setOptimizeFiltersForMemory(true)
   )
   .setCompactionStyle(CompactionStyle.LEVEL)
   .optimizeLevelStyleCompaction(134217728L)     // 128MB target
   .setLevelCompactionDynamicLevelBytes(true)
   .setCompactionPriority(CompactionPriority.MinOverlappingRatio)
   .useFixedLengthPrefixExtractor(8)             // 8-byte prefix (chunk X,Z coords)
   .setEnableBlobFiles(true)
   .setEnableBlobGarbageCollection(true)
   .setBlobCompressionType(CompressionType.ZSTD_COMPRESSION);
```

| Layer | Compression | Purpose |
|-------|-------------|---------|
| Upper levels (hot data) | LZ4 | Fast read/write for frequently accessed chunks |
| Bottommost level (cold data) | ZSTD | Better compression ratio for archived chunks |
| Blob files | ZSTD | Large values stored separately with high compression |

### 5.3 Bloom Filtering

A Bloom filter with 9.9 bits per key is configured to avoid unnecessary disk reads:

```java
// RocksDbChunkStorageProvider.java, line 57
BloomFilter bloomFilter = new BloomFilter(9.9);
```

The hash-based index (`IndexType.kHashSearch`) combined with an 8-byte prefix extractor enables efficient chunk lookups by coordinate.

### 5.4 Database Layout

- **Database path:** `{world_save_path}/db`
- **Column families:** `"default"` (metadata) and `"chunks"` (chunk data)
- **Key format:** 8 bytes -- `[x:4bytes][z:4bytes]` (big-endian integers)

```java
// RocksDbChunkStorageProvider.java, lines 114-124
private static byte[] toKey(int x, int z) {
   return new byte[]{
      (byte)(x >>> 24), (byte)(x >>> 16), (byte)(x >>> 8), (byte)x,
      (byte)(z >>> 24), (byte)(z >>> 16), (byte)(z >>> 8), (byte)z
   };
}
```

### 5.5 Loader and Saver

The `Loader` reads chunks asynchronously using `CompletableFuture.supplyAsync`:

```java
// RocksDbChunkStorageProvider.java, lines 135-140
@Override
public CompletableFuture<ByteBuffer> loadBuffer(int x, int z) {
   return CompletableFuture.supplyAsync(SneakyThrow.sneakySupplier(() -> {
      byte[] key = RocksDbChunkStorageProvider.toKey(x, z);
      byte[] data = this.db.db.get(this.db.chunkColumn, key);
      return data == null ? null : ByteBuffer.wrap(data);
   }));
}
```

The `getIndexes()` method iterates all keys in the chunks column family using a `RocksIterator`:

```java
// RocksDbChunkStorageProvider.java, lines 144-158
public LongSet getIndexes() throws IOException {
   LongOpenHashSet set = new LongOpenHashSet();
   try (RocksIterator iter = this.db.db.newIterator(this.db.chunkColumn)) {
      iter.seekToFirst();
      while (iter.isValid()) {
         byte[] key = iter.key();
         set.add(ChunkUtil.indexChunk(keyToX(key), keyToZ(key)));
         iter.next();
      }
   }
   return set;
}
```

The `flush()` method ensures all data is persisted:

```java
// RocksDbChunkStorageProvider.java, lines 256-264
public void flush() throws IOException {
   try (FlushOptions opts = new FlushOptions().setWaitForFlush(true)) {
      this.db.db.flush(opts);
   } catch (RocksDBException e) {
      throw SneakyThrow.sneakyThrow(e);
   }
}
```

### 5.6 WorldRocksDbCommand

**File:** `server/core/universe/world/commands/world/WorldRocksDbCommand.java`

The `/world rocksdb compact` command triggers manual compaction on the chunks column family:

```java
// WorldRocksDbCommand.java, lines 13-44
public class WorldRocksDbCommand extends AbstractCommandCollection {
   public WorldRocksDbCommand() {
      super("rocksdb", "server.commands.world.rocksdb");
      this.addSubCommand(new CompactCommand());
   }

   public static class CompactCommand extends AbstractAsyncWorldCommand {
      protected CompletableFuture<Void> executeAsync(CommandContext context, World world) {
         if (world.getChunkStore().getStorageData() instanceof RocksDbResource rocksDbResource) {
            context.sendMessage(Message.translation("server.commands.world.rocksdb.compact.start"));
            return CompletableFuture.runAsync(() -> {
               rocksDbResource.db.compactRange(rocksDbResource.chunkColumn);
               context.sendMessage(Message.translation("server.commands.world.rocksdb.compact.end"));
            });
         } else {
            context.sendMessage(Message.translation("server.commands.world.rocksdb.compact.wrong"));
            return CompletableFuture.completedFuture(null);
         }
      }
   }
}
```

---

## 6. Sentry Telemetry

**File:** `server/core/HytaleServer.java` (lines 119-257)

Sentry error tracking is integrated as a core telemetry system. It is disabled in the following cases:
- Early plugins with transformers are loaded
- The server is not running from a JAR (development build)
- No version is found in the JAR manifest
- The `--disable-sentry` CLI option is used

### 6.1 Initialization

```java
// server/core/HytaleServer.java, lines 124-257
SentryOptions options = new SentryOptions();
options.setDsn("https://6043a13c7b5c45b5c834b6d896fb378e@sentry.hytale.com/4");
options.setRelease(ManifestUtil.getImplementationVersion());
options.setDist(ManifestUtil.getImplementationRevisionId());
options.setEnvironment("release");
options.setTag("patchline", ManifestUtil.getPatchline());
options.setServerName(NetworkUtil.getHostName());
UUID distinctId = HardwareUtil.getUUID();
if (distinctId != null) {
   options.setDistinctId(distinctId.toString());
}
```

### 6.2 Session Tracking

Sessions are started on boot and ended on shutdown:

```java
// HytaleServer.java, line 225
Sentry.startSession();

// HytaleServer.java, line 474
Sentry.endSession();
```

### 6.3 OS Context

```java
// HytaleServer.java, lines 233-236
OperatingSystem os = new OperatingSystem();
os.setName(System.getProperty("os.name"));
os.setVersion(System.getProperty("os.version"));
scope.getContexts().setOperatingSystem(os);
```

### 6.4 Build Context

```java
// HytaleServer.java, lines 237-249
scope.setContexts("build", Map.of(
   "version", String.valueOf(ManifestUtil.getImplementationVersion()),
   "revision-id", String.valueOf(ManifestUtil.getImplementationRevisionId()),
   "patchline", String.valueOf(ManifestUtil.getPatchline()),
   "environment", "release"
));
```

### 6.5 User Context with Auth

The Sentry `User` is populated with authentication information on every event:

```java
// HytaleServer.java, lines 203-220
User user = new User();
HashMap<String, Object> unknown = new HashMap<>();
user.setUnknown(unknown);
UUID hardwareUUID = HardwareUtil.getUUID();
if (hardwareUUID != null) {
   unknown.put("hardware-uuid", hardwareUUID.toString());
}
ServerAuthManager authManager = ServerAuthManager.getInstance();
unknown.put("auth-mode", authManager.getAuthMode().toString());
SessionServiceClient.GameProfile profile = authManager.getSelectedProfile();
if (profile != null) {
   user.setUsername(profile.username);
   user.setId(profile.uuid.toString());
}
user.setIpAddress("{{auto}}");
event.setUser(user);
```

### 6.6 Asset Pack Tracking

Each Sentry event includes context about loaded asset packs and whether any user packs are present:

```java
// HytaleServer.java, lines 179-199
AssetModule assetModule = AssetModule.get();
boolean hasUserPacks = false;
if (assetModule != null) {
   HashMap<String, Object> packsContext = new HashMap<>();
   for (AssetPack pack : assetModule.getAssetPacks()) {
      HashMap<String, Object> packInfo = new HashMap<>();
      // ... version, immutable flag ...
      packsContext.put(pack.getName(), packInfo);
      if (!pack.isImmutable()) {
         hasUserPacks = true;
      }
   }
   contexts.put("packs", packsContext);
}
```

### 6.7 Plugin Detection Tags

Two boolean tags are set per event to help the Hytale team triage:

```java
// HytaleServer.java, lines 201-202
event.setTag("has-plugins", String.valueOf(hasExternalPlugins));
event.setTag("has-packs", String.valueOf(hasUserPacks));
```

`hasExternalPlugins` is `true` if any `JavaPlugin` has a classloader that is NOT on the server classpath (i.e., it was loaded from a JAR in the mods directory).

### 6.8 Development Build Detection

Errors originating from third-party plugins are filtered out:

```java
// HytaleServer.java, lines 137-141
options.setBeforeSend((event, hint) -> {
   Throwable throwable = event.getThrowable();
   if (PluginClassLoader.isFromThirdPartyPlugin(throwable)) {
      return null;  // drop event
   }
   // ...
});
```

Development builds are detected by checking:

```java
// HytaleServer.java, lines 121-122
if (!ManifestUtil.isJar() || ManifestUtil.getVersion() == null) {
   LOGGER.at(Level.INFO).log("Sentry disabled: development build (no version)");
}
```

### 6.9 HytaleSentryHandler

**File:** `logger/sentry/HytaleSentryHandler.java`

The Sentry handler is a `java.util.logging.Handler` that bridges JUL log records to Sentry:

```java
// logger/sentry/HytaleSentryHandler.java, lines 36-40
private Level minimumBreadcrumbLevel = Level.INFO;
private Level minimumEventLevel = Level.SEVERE;
private Level minimumLevel = Level.INFO;
```

- `INFO`+ log records are sent as **breadcrumbs** (context for later errors)
- `SEVERE`+ log records are sent as **events** (actual error reports)
- All `INFO`+ records are also sent as **Sentry logs** (via `Sentry.logger().log(...)`)

The handler uses Sentry SDK version `8.29.0`:

```java
// logger/sentry/HytaleSentryHandler.java, line 299
SentryIntegrationPackageStorage.getInstance().addPackage("maven:io.sentry:sentry-jul", "8.29.0");
```

---

## 7. Console Module

**File:** `server/core/console/ConsoleModule.java`

### 7.1 Terminal Initialization

The terminal is initialized early in the boot sequence, before the `HytaleServer` constructor:

```java
// LateMain.java, lines 19-50
public static void lateMain(String[] args) {
   if (!Options.parse(args)) {
      HytaleLogger.init();
      ConsoleModule.initializeTerminal();  // <-- Early terminal init
      HytaleFileHandler.INSTANCE.enable();
      HytaleLogger.replaceStd();
      // ...
      new HytaleServer();
   }
}
```

The `initializeTerminal()` method creates a JLine terminal:

```java
// server/core/console/ConsoleModule.java, lines 39-53
public static void initializeTerminal() {
   try {
      TerminalBuilder builder = TerminalBuilder.builder();
      if (Constants.SINGLEPLAYER) {
         builder.dumb(true);       // No interactive features for singleplayer
      } else {
         builder.color(true);      // Color support for dedicated servers
      }
      terminal = builder.build();
      HytaleConsole.INSTANCE.setTerminal(terminal.getType());
   } catch (IOException e) {
      LOGGER.at(Level.SEVERE).withCause(e).log("Failed to start console reader");
   }
}
```

### 7.2 Startup Sequence

The full boot order from `LateMain`:

1. `Options.parse(args)` -- Parse CLI arguments
2. `HytaleLogger.init()` -- Initialize logging
3. `ConsoleModule.initializeTerminal()` -- Create JLine terminal (singleplayer gets dumb mode)
4. `HytaleFileHandler.INSTANCE.enable()` -- Enable file logging
5. `HytaleLogger.replaceStd()` -- Redirect stdout/stderr
6. Configure log level loader (CLI levels take precedence over config levels)
7. `new HytaleServer()` -- Create and boot the server

### 7.3 Console Thread

The `ConsoleModule.setup()` creates a `LineReader` and starts a daemon thread that reads input:

```java
// server/core/console/ConsoleModule.java, lines 81-118
private static class ConsoleRunnable implements Runnable {
   private final Thread consoleThread;

   public ConsoleRunnable(LineReader lineReader, ConsoleSender consoleSender) {
      this.consoleThread = new Thread(this, "ConsoleThread");
      this.consoleThread.setDaemon(true);
      this.consoleThread.start();
   }

   @Override
   public void run() {
      String terminalType = this.lineReader.getTerminal().getType();
      boolean isDumb = "dumb".equals(terminalType) || "dumb-color".equals(terminalType);

      while (!this.consoleThread.isInterrupted()) {
         String command = this.lineReader.readLine(isDumb ? null : "> ");
         if (command == null) break;
         command = command.trim();
         if (!command.isEmpty() && command.charAt(0) == '/') {
            command = command.substring(1);
         }
         CommandManager.get().handleCommand(this.consoleSender, command);
      }
   }
}
```

Key behaviors:
- The `> ` prompt is shown only for non-dumb terminals
- Commands prefixed with `/` have the slash stripped
- `UserInterruptException` (Ctrl+C) triggers `ShutdownReason.SIGINT`

---

## 8. Builder Tools Additions

### 8.1 LayerCommand

**File:** `builtin/buildertools/commands/LayerCommand.java`

A new builder tools command that fills a selection with layers of different block types in a specified direction.

```java
// builtin/buildertools/commands/LayerCommand.java, lines 24-37
public class LayerCommand extends AbstractPlayerCommand {
   private static Map<String, Vector3i> directions = Map.of(
      "up", Vector3i.UP, "down", Vector3i.DOWN,
      "north", Vector3i.NORTH, "south", Vector3i.SOUTH,
      "east", Vector3i.EAST, "west", Vector3i.WEST
   );

   private final RequiredArg<String> layerDirectionArg = this.withRequiredArg(
      "direction", "server.commands.layer.direction.desc", ArgTypes.STRING);

   private final RequiredArg<List<Pair<Integer, String>>> layersArg = this.withListRequiredArg(
      "layers", "server.commands.layer.layers.desc", ArgTypes.LAYER_ENTRY_TYPE);

   public LayerCommand() {
      super("layer", "server.commands.layer.desc");
      this.setPermissionGroup(GameMode.Creative);
      this.requirePermission("hytale.editor.selection.clipboard");
   }
}
```

**Usage:** `/layer <direction> <layer_definitions>`

- **Directions:** `up`, `down`, `north`, `south`, `east`, `west`, `camera`
- **Layers:** List of `(count, blockId)` pairs, e.g., `3 dirt 1 grass`
- **Permission:** `hytale.editor.selection.clipboard` (Creative mode only)

The `camera` direction uses the player's current head rotation:

```java
// builtin/buildertools/commands/LayerCommand.java, lines 56-66
if (direction.equalsIgnoreCase("camera")) {
   layerDirection = headRotationComponent.getAxisDirection();
} else {
   layerDirection = directions.get(direction);
}
s.layer(layers, layerDirection, componentAccessor);
```

### 8.2 PasteToolUtil

**File:** `builtin/buildertools/utils/PasteToolUtil.java`

A utility class that automatically switches a player's active hotbar slot to the Paste tool (`EditorTool_Paste`).

```java
// builtin/buildertools/utils/PasteToolUtil.java, lines 11-13
public final class PasteToolUtil {
   private static final String PASTE_TOOL_ID = "EditorTool_Paste";
}
```

The `switchToPasteTool` method searches for the paste tool in this order:

1. **Hotbar** -- If found, activate that slot
2. **Storage inventory** -- If found and there is an empty hotbar slot, move it there
3. **Tools inventory** -- If found and there is an empty hotbar slot, create a copy there

```java
// builtin/buildertools/utils/PasteToolUtil.java, lines 17-70
public static void switchToPasteTool(@Nonnull Player player, @Nonnull PlayerRef playerRef) {
   Inventory inventory = player.getInventory();
   ItemContainer hotbar = inventory.getHotbar();
   // Search hotbar first...
   for (short slot = 0; slot < hotbarSize; slot++) {
      ItemStack itemStack = hotbar.getItemStack(slot);
      if (itemStack != null && !itemStack.isEmpty() && "EditorTool_Paste".equals(itemStack.getItemId())) {
         inventory.setActiveHotbarSlot((byte)slot);
         playerRef.getPacketHandler().writeNoCache(new SetActiveSlot(-1, (byte)slot));
         return;
      }
   }
   // Then storage, then tools...
}
```

This is invoked automatically after clipboard operations (copy, cut) to ensure the paste tool is readily available.

---

## 9. Other New Commands

### 9.1 GitCommand

**File:** `server/core/command/commands/utility/git/GitCommand.java`

The `/git` command collection provides in-server git operations for development workflows:

```java
// GitCommand.java, lines 5-11
public class GitCommand extends AbstractCommandCollection {
   public GitCommand() {
      super("git", "server.commands.git.desc");
      this.addSubCommand(new UpdateAssetsCommand());
      this.addSubCommand(new UpdatePrefabsCommand());
   }
}
```

#### /git assets

**File:** `server/core/command/commands/utility/git/UpdateAssetsCommand.java`

Sub-commands:
- `/git assets status` -- Runs `git status` on the assets directory
- `/git assets reset` -- Runs `git reset --hard head` on the assets directory
- `/git assets pull` -- Runs `updateAssets.sh` if available, otherwise `git pull`

The command auto-detects the git repository by checking for `.git` in the assets directory or its parent:

```java
// UpdateAssetsCommand.java, lines 38-47
Path assetPath = AssetUtil.getHytaleAssetsPath();
Path gitPath = null;
if (Files.exists(assetPath.resolve(".git"))) {
   gitPath = assetPath;
} else {
   Path parent = PathUtil.getParent(assetPath.toAbsolutePath());
   if (Files.exists(parent.resolve(".git"))) {
      gitPath = parent;
   }
}
```

#### /git prefabs

**File:** `server/core/command/commands/utility/git/UpdatePrefabsCommand.java`

Sub-commands:
- `/git prefabs status` -- Git status (including submodules)
- `/git prefabs commit` -- Add all and commit (both main repo and submodules)
- `/git prefabs pull` -- Pull (both main repo and submodules)
- `/git prefabs push` -- Push to origin/master (both main repo and submodules)
- `/git prefabs all` -- Full workflow: add, commit, pull, push (submodules first, then main repo)

The commit message includes the command sender's display name:

```java
// UpdatePrefabsCommand.java, lines 93
String senderDisplayName = context.sender().getDisplayName().replaceAll("[^a-zA-Z0-9 ._-]", "");
```

### 9.2 UIGalleryCommand

**File:** `server/core/command/commands/utility/UIGalleryCommand.java`

A Creative-mode command that opens a UI gallery page for the player:

```java
// UIGalleryCommand.java, lines 17-49
public class UIGalleryCommand extends AbstractAsyncCommand {
   public UIGalleryCommand() {
      super("ui-gallery", "server.commands.uigallery.desc");
      this.setPermissionGroup(GameMode.Creative);
   }

   protected CompletableFuture<Void> executeAsync(CommandContext context) {
      // ... resolve player entity ...
      return CompletableFuture.runAsync(() -> {
         playerComponent.getPageManager().openCustomPage(
            playerRef, store, new UIGalleryPage(playerRefComponent)
         );
      }, world);  // executes on the world thread
   }
}
```

This is a developer/content-creator tool that presents a gallery of all available UI components. The command:
- Requires Creative game mode
- Is player-only (no console execution)
- Runs on the world thread for thread safety
- Opens a `UIGalleryPage` via the player's page manager

---

## Summary of Environment Variables

| Variable | Type | Purpose |
|----------|------|---------|
| `HYTALE_DISABLE_UPDATES` | Boolean | Kill switch to disable the entire update system |
| `HYTALE_SERVER_SESSION_TOKEN` | String | Server session token for authentication |
| `HYTALE_SERVER_IDENTITY_TOKEN` | String | Server identity token for authentication |
| `HYTALE_SERVER_AUDIENCE` | String | Override the server audience for auth grants |

## Summary of Permissions

| Permission | Usage |
|------------|-------|
| `hytale.system.update.notify` | Receive in-game update availability notifications |
| `hytale.editor.selection.clipboard` | Use the `/layer` builder tools command |

## Summary of New Config Fields (v4)

| Path | Type | Default | New in v4 |
|------|------|---------|-----------|
| `Update.Enabled` | boolean | `true` | Yes |
| `Update.CheckIntervalSeconds` | int | `3600` | Yes |
| `Update.NotifyPlayersOnAvailable` | boolean | `true` | Yes |
| `Update.Patchline` | string | `null` | Yes |
| `Update.RunBackupBeforeUpdate` | boolean | `true` | Yes |
| `Update.BackupConfigBeforeUpdate` | boolean | `true` | Yes |
| `Update.AutoApplyMode` | enum | `DISABLED` | Yes |
| `Update.AutoApplyDelayMinutes` | int | `30` | Yes |
| `Backup.Enabled` | boolean | `false` | Yes |
| `Backup.FrequencyMinutes` | int | `30` | Yes |
| `Backup.Directory` | string | `null` | Yes |
| `Backup.MaxCount` | int | `5` | Yes |
| `Backup.ArchiveMaxCount` | int | `5` | Yes |
| `DefaultModsEnabled` | boolean | `!SINGLEPLAYER` | Yes |
| `SkipModValidationForVersion` | string | `null` | Yes |
