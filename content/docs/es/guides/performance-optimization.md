---
id: performance-optimization
title: "Performance Optimization Guide"
sidebar_label: Optimization
sidebar_position: 5
description: How to improve FPS and performance in Hytale
---

# Performance Optimization Guide

Welcome to the complete guide for optimizing Hytale performance. Whether you're experiencing low FPS, stuttering, or just want to maximize your gaming experience, this guide covers everything you need to know.

## Introduction

### Understanding Hytale's Performance Profile

Hytale is a **voxel-based game**, which means its performance characteristics differ from traditional games:

- **CPU is more important than GPU** - Voxel processing, world generation, and entity management are CPU-intensive tasks
- **RAM usage scales with view distance** - More visible chunks = more memory required
- **SSD significantly impacts loading times** - Fast storage reduces chunk loading stutters

:::info Key Insight
Many performance issues in voxel games aren't GPU-related. If you have low FPS, focus on CPU, RAM, and storage optimizations first!
:::

This guide will help you achieve the best possible performance regardless of your hardware configuration.

---

## Graphics Settings Overview

### Settings Impact Chart

Understanding which settings affect performance most helps you make informed decisions:

| Setting | FPS Impact | Recommendation (Low-End) | Recommendation (High-End) |
|---------|------------|--------------------------|---------------------------|
| **View Distance** | VERY HIGH | 6-8 chunks | 12+ chunks |
| **Shadow Quality** | HIGH | Off / Low | Medium / High |
| **Render Scale** | HIGH | 75-100% | 100-150% |
| **Ambient Occlusion** | MEDIUM | Off | On |
| **Anti-Aliasing** | MEDIUM | Off / FXAA | TAA |
| **Particle Effects** | MEDIUM | Reduced | Full |
| **Texture Quality** | LOW | High (minimal impact) | High |
| **Anisotropic Filtering** | LOW | 4x | 16x |
| **V-Sync** | VARIABLE | Off (use frame limiter) | On / Off |

---

## View Distance - The Most Important Setting

View distance is the **single most impactful setting** for both performance and RAM usage.

### View Distance Performance Table

| Distance | Blocks Visible | RAM Usage | Expected FPS Impact |
|----------|---------------|-----------|---------------------|
| 4 chunks | 128 blocks | ~2 GB | Very High FPS |
| 6 chunks | 192 blocks | ~3 GB | High FPS |
| 8 chunks | 256 blocks | ~4 GB | Good FPS |
| 10 chunks | 320 blocks | ~5 GB | Moderate FPS |
| 12 chunks | 384 blocks | ~6 GB | Lower FPS |
| 16 chunks | 512 blocks | ~8 GB+ | Demanding |

### How to Choose Your View Distance

1. **Check your available RAM** - Leave at least 4GB for Windows and other applications
2. **Start low, increase gradually** - Begin at 8 chunks, increase until you notice performance drops
3. **Consider your gameplay style**:
   - Exploring: Higher distance helps navigation
   - Building: Lower distance acceptable, better FPS for complex builds
   - Combat: Medium distance, stable FPS is priority

:::warning Memory Warning
Setting view distance too high can cause out-of-memory crashes, especially with mods installed. Monitor your RAM usage!
:::

---

## RAM Allocation

Proper RAM allocation is crucial for Hytale performance.

### Recommended RAM Allocation

| Setup | Minimum | Recommended | Maximum |
|-------|---------|-------------|---------|
| Vanilla Hytale | 4 GB | 6 GB | 8 GB |
| Light Mods | 6 GB | 8 GB | 10 GB |
| Heavy Mods / Servers | 8 GB | 12 GB | 16 GB |

### How to Allocate More RAM

Through the Hytale Launcher:
1. Open the **Hytale Launcher**
2. Go to **Settings** > **Game Settings**
3. Find **Memory Allocation** or **RAM**
4. Adjust the slider to your desired amount
5. Click **Apply** and restart the game

### JVM Arguments for Advanced Users

If you have access to JVM arguments, these optimized settings can improve performance:

```
-Xms4G -Xmx8G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1
```

**Explanation of key arguments:**
- `-Xms4G` - Minimum RAM allocation (4GB)
- `-Xmx8G` - Maximum RAM allocation (8GB)
- `-XX:+UseG1GC` - Uses the G1 garbage collector (optimized for games)

:::tip Adjust to Your System
Change `-Xms` and `-Xmx` values based on your available RAM. Never allocate more than 75% of your total system RAM.
:::

---

## Windows Optimizations

### Enable Game Mode

Windows Game Mode prioritizes gaming performance:

1. Press **Win + I** to open Settings
2. Go to **Gaming** > **Game Mode**
3. Toggle **Game Mode** to **On**

### Disable Overlays

Overlays consume resources and can cause stuttering:

#### Discord Overlay
1. Open Discord Settings
2. Go to **Game Activity** (or App Settings > Activity Settings)
3. Disable **Enable in-game overlay**

#### NVIDIA GeForce Experience Overlay
1. Open GeForce Experience
2. Click the gear icon (Settings)
3. Disable **In-Game Overlay**

#### Xbox Game Bar
1. Press **Win + I** > **Gaming** > **Xbox Game Bar**
2. Toggle to **Off**

#### Steam Overlay
1. Open Steam > Settings > In-Game
2. Uncheck **Enable the Steam Overlay while in-game**

### Close Background Applications

Applications running in the background consume CPU, RAM, and can cause stuttering:

**Common culprits:**
- Web browsers (especially Chrome with multiple tabs)
- Antivirus real-time scanning
- Cloud sync applications (OneDrive, Dropbox, Google Drive)
- RGB lighting software
- System monitoring tools

:::tip Quick Check
Open **Task Manager** (Ctrl + Shift + Esc) and sort by CPU or Memory usage to identify resource-hungry applications.
:::

### Update GPU Drivers

Outdated drivers can cause performance issues and crashes:

**NVIDIA:**
1. Open GeForce Experience
2. Go to **Drivers** tab
3. Click **Check for Updates**
4. Download and install the latest Game Ready Driver

**AMD:**
1. Open AMD Radeon Software
2. Click on **System** tab
3. Check for driver updates
4. Install the latest recommended driver

**Intel:**
1. Download Intel Driver & Support Assistant
2. Run the scan
3. Update graphics drivers

---

## Hardware Optimizations

### Storage: SSD vs HDD

| Storage Type | Chunk Loading | World Save | Mod Loading | Recommendation |
|--------------|--------------|------------|-------------|----------------|
| HDD | Slow, stutters | Slow | Very slow | Avoid if possible |
| SATA SSD | Good | Good | Good | Recommended minimum |
| NVMe SSD | Excellent | Excellent | Excellent | Ideal choice |

**Impact of SSD:**
- Faster world loading and chunk generation
- Reduced stuttering when exploring new areas
- Quicker mod loading times
- Faster game startup

:::info Highly Recommended
If you're still using an HDD, upgrading to an SSD is the single best hardware upgrade for Hytale performance.
:::

### RAM Configuration

**Dual-Channel RAM** provides significantly better performance than single-channel:

- Use **two identical RAM sticks** instead of one
- Install them in the correct slots (usually slots 2 and 4)
- Check your motherboard manual for dual-channel configuration

**Verify Dual-Channel:**
1. Open **Task Manager** > **Performance** > **Memory**
2. Look for "Slots used: 2 of 4" or similar
3. Or use CPU-Z and check the Memory tab for "Dual" channel

### Temperature Monitoring

High temperatures cause **thermal throttling**, which significantly reduces performance:

**Recommended Maximum Temperatures:**
| Component | Safe | Warning | Danger |
|-----------|------|---------|--------|
| CPU | < 75C | 75-85C | > 85C |
| GPU | < 80C | 80-90C | > 90C |

**How to Monitor:**
- Use **MSI Afterburner** for GPU
- Use **HWiNFO** or **Core Temp** for CPU
- Check temperatures while gaming

**If temperatures are too high:**
1. Clean dust from fans and heatsinks
2. Improve case airflow
3. Replace thermal paste (advanced)
4. Consider better cooling solutions

---

## Performance Presets by Configuration

### Budget PC (GTX 1050 / RX 560 / 8GB RAM)

**Target:** 60 FPS at 1080p

| Setting | Value |
|---------|-------|
| View Distance | 6 chunks |
| Shadow Quality | Off |
| Ambient Occlusion | Off |
| Anti-Aliasing | Off |
| Particle Effects | Reduced |
| Render Scale | 100% |
| Texture Quality | Medium |

**Additional Tips:**
- Allocate 4GB RAM to Hytale
- Close all background applications
- Consider 720p if still struggling

### Mid-Range PC (RTX 3060 / RX 6600 / 16GB RAM)

**Target:** 60+ FPS at 1080p High Settings

| Setting | Value |
|---------|-------|
| View Distance | 10 chunks |
| Shadow Quality | Medium |
| Ambient Occlusion | On |
| Anti-Aliasing | FXAA |
| Particle Effects | Full |
| Render Scale | 100% |
| Texture Quality | High |

**Additional Tips:**
- Allocate 8GB RAM to Hytale
- Enable Game Mode
- Keep overlays disabled for best stability

### High-End PC (RTX 4070+ / RX 7800 XT+ / 32GB RAM)

**Target:** 60+ FPS at 1440p Ultra Settings

| Setting | Value |
|---------|-------|
| View Distance | 16 chunks |
| Shadow Quality | High |
| Ambient Occlusion | On |
| Anti-Aliasing | TAA |
| Particle Effects | Full |
| Render Scale | 100-150% |
| Texture Quality | High |

**Additional Tips:**
- Allocate 12-16GB RAM to Hytale
- Enable all visual effects
- Consider 4K with adjusted view distance

---

## Streaming and Recording Optimization

### Recommended OBS Settings

If you stream or record Hytale gameplay, use these optimized settings:

#### For NVIDIA GPUs (NVENC)

| Setting | Value |
|---------|-------|
| Encoder | NVIDIA NVENC H.264 |
| Rate Control | CBR |
| Bitrate | 6000-8000 Kbps (streaming) / 20000+ Kbps (recording) |
| Preset | Quality |
| Profile | High |

#### For AMD GPUs (AMF)

| Setting | Value |
|---------|-------|
| Encoder | AMD HW H.264 (AVC) |
| Rate Control | CBR |
| Bitrate | 6000-8000 Kbps (streaming) / 20000+ Kbps (recording) |
| Preset | Quality |

#### For CPU (x264)

| Setting | Value |
|---------|-------|
| Encoder | x264 |
| Rate Control | CBR |
| Bitrate | 6000 Kbps |
| Preset | veryfast (streaming) / medium (recording) |

### GPU vs CPU Encoding

| Encoder | Pros | Cons | Best For |
|---------|------|------|----------|
| GPU (NVENC/AMF) | Minimal performance impact, consistent quality | Slightly larger files | Streaming, most users |
| CPU (x264) | Best quality at lower bitrates | High CPU usage, impacts game performance | High-end CPUs, offline recording |

:::tip Streaming Recommendation
Use **GPU encoding** (NVENC or AMF) for Hytale. Since Hytale is CPU-intensive, using CPU encoding will significantly impact your FPS.
:::

### In-Game Settings While Streaming

When streaming, slightly reduce these settings:
- **View Distance**: Reduce by 2-4 chunks
- **Shadow Quality**: Drop one level
- **Particle Effects**: Set to Reduced

---

## Common Problems and Solutions

### Problem: Stuttering / Micro-Freezes

**Possible Causes and Solutions:**

1. **Web Browser Running**
   - Close Chrome/Firefox/Edge
   - Browsers can use 2-4GB RAM easily

2. **Insufficient RAM Allocation**
   - Increase RAM allocated to Hytale
   - Close background applications

3. **Garbage Collection Pauses**
   - Use optimized JVM arguments
   - Don't over-allocate RAM (causes longer GC pauses)

4. **HDD Storage**
   - Move Hytale to an SSD
   - Critical for chunk loading

### Problem: FPS Drops When Exploring

**Solutions:**
1. **Reduce View Distance** - The most effective solution
2. **Enable chunk pre-loading** if available
3. **Check SSD space** - Low storage can cause issues
4. **Lower shadow quality** - Shadows recalculate in new areas

### Problem: Low FPS in Complex Builds

**Solutions:**
1. **Reduce particle effects**
2. **Lower ambient occlusion**
3. **Decrease view distance temporarily**
4. **Check for entity limits** - Too many items/entities cause lag

### Problem: Lag in Multiplayer (Not FPS)

:::warning This is Usually Not FPS-Related
If your FPS counter shows good numbers but the game feels laggy, the issue is likely **network-related**, not performance.
:::

**Network Solutions:**
1. Use a **wired connection** instead of WiFi
2. Check your **ping** to the server
3. Choose servers **closer to your location**
4. Close bandwidth-heavy applications (streaming, downloads)

---

## Benchmarking Your Performance

### How to Check Your FPS

1. **In-Game FPS Counter**
   - Check Settings > Display for built-in FPS counter
   - Usually toggled with F3 or similar debug key

2. **Steam Overlay FPS**
   - Steam > Settings > In-Game
   - Enable FPS counter
   - Choose corner position

3. **MSI Afterburner**
   - Download and install MSI Afterburner
   - Enable OSD (On-Screen Display)
   - Shows FPS, GPU/CPU usage, temperatures

### What to Look For

| Metric | Good | Acceptable | Problem |
|--------|------|------------|---------|
| Average FPS | 60+ | 45-60 | < 45 |
| 1% Low FPS | 40+ | 30-40 | < 30 |
| Frame Time | < 16ms | 16-22ms | > 22ms |
| CPU Usage | < 80% | 80-95% | 100% |
| GPU Usage | 90-100% | 70-90% | < 70% |

**Understanding the Results:**
- **High CPU, Low GPU**: CPU bottleneck - reduce view distance, entities
- **Low CPU, High GPU**: Normal behavior, GPU is limiting factor
- **Low CPU, Low GPU**: Possible driver issue or V-Sync limiting
- **1% Low much lower than average**: Stuttering issue, check for background tasks

### Testing Methodology

For accurate benchmarks:

1. **Same location** - Test in a consistent spot
2. **Same conditions** - Time of day, weather, entities nearby
3. **Multiple runs** - Average 3-5 tests for accuracy
4. **Fresh restart** - Restart the game before testing
5. **Note your settings** - Document what you changed

---

## Quick Reference

### Performance Priority Checklist

1. [ ] Set appropriate view distance for your RAM
2. [ ] Allocate correct amount of RAM
3. [ ] Install game on SSD
4. [ ] Update GPU drivers
5. [ ] Disable unnecessary overlays
6. [ ] Close background applications
7. [ ] Enable Windows Game Mode
8. [ ] Monitor temperatures

### FPS Boost Quick Fixes

If you need immediate FPS improvement:

1. **View Distance**: 6 chunks (biggest impact)
2. **Shadows**: Off
3. **Anti-Aliasing**: Off
4. **Close Chrome** and other browsers
5. **Restart the game** (clears memory)

---

## See Also

- [Beginner's Guide](/docs/guides/beginners-guide)
- [Controls](/docs/gameplay/getting-started/controls)
- [System Requirements](/docs/gameplay/getting-started/interface)

---

*Optimized settings mean more time enjoying Hytale and less time troubleshooting. Happy gaming!*
