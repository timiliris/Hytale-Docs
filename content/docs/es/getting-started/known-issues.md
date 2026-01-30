---
id: known-issues
title: Known Issues & Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 7
description: Common Hytale issues and how to fix them - launcher problems, performance, crashes, multiplayer, and server hosting solutions
---

# Known Issues & Troubleshooting

Having trouble with Hytale? This guide covers the most common issues and their solutions. Since Hytale is in Early Access, some bugs are expected - this page will be updated regularly.

## Launch Issues

### Launcher Won't Start

**Symptoms:** The Hytale launcher doesn't open, crashes immediately, or shows no window.

**Solutions:**

1. **Check your antivirus** - Add Hytale to your antivirus exceptions list
2. **Run as Administrator** - Right-click the launcher and select "Run as administrator"
3. **Reinstall Visual C++ Redistributables** - Download from [Microsoft](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
4. **Check Windows Defender** - Go to Windows Security > Virus & threat protection > Manage settings > Add exclusion

```
Default Hytale installation path:
C:\Program Files\Hytale\
```

### Connection Error

**Symptoms:** "Unable to connect to Hytale services" or "Authentication failed"

**Solutions:**

1. **Check your internet connection** - Try opening [hytale.com](https://hytale.com) in your browser
2. **Check Hytale server status** - Visit [status.hytale.com](https://status.hytale.com) or the official Discord
3. **Disable VPN** - Some VPNs can interfere with authentication
4. **Flush DNS cache:**
   ```bash
   # Windows (Run as Administrator)
   ipconfig /flushdns
   ```

### "Java Not Found" Error

**Symptoms:** Error message indicating Java is missing or incorrect version.

**Solutions:**

1. **Install Java 25** - Download from [Adoptium](https://adoptium.net) (recommended distribution)
2. **Set JAVA_HOME environment variable:**
   ```
   JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-25
   ```
3. **Verify installation:**
   ```bash
   java -version
   # Should show: openjdk version "25"
   ```

:::warning Java Version Requirement
Hytale requires **Java 25** specifically. Other versions (8, 11, 17, 21) will NOT work.
:::

## Performance Issues

### Low FPS

**Symptoms:** Game runs slowly, choppy gameplay, FPS below 30.

**Solutions:**

1. **Lower graphics settings:**
   - Reduce render distance (try 8-12 chunks)
   - Disable shadows or set to Low
   - Turn off ambient occlusion
   - Reduce particle effects

2. **Update GPU drivers:**
   - [NVIDIA Drivers](https://www.nvidia.com/drivers)
   - [AMD Drivers](https://www.amd.com/en/support)
   - [Intel Drivers](https://www.intel.com/content/www/us/en/download-center/home.html)

3. **Close background applications** - Especially browsers with many tabs, Discord, streaming software

4. **Disable V-Sync** if your monitor refresh rate is low

### Stuttering / Lag Spikes

**Symptoms:** Game freezes briefly every few seconds, inconsistent frame times.

**Solutions:**

1. **Allocate more RAM to Hytale:**
   - Open Launcher > Settings > Java Arguments
   - Set `-Xmx` to half your total RAM (e.g., `-Xmx8G` for 16GB system)

2. **Close background applications** - Check Task Manager for high CPU/RAM usage

3. **Disable hardware acceleration in Discord** - Settings > Advanced > Hardware Acceleration (OFF)

4. **Move Hytale to an SSD** - HDDs can cause significant stuttering during world loading

### Crash on Loading

**Symptoms:** Game crashes during startup, world loading, or when joining servers.

**Solutions:**

1. **Verify minimum requirements:**
   | Component | Minimum |
   |-----------|---------|
   | RAM | 8 GB |
   | GPU | NVIDIA GTX 900 series / AMD equivalent |
   | Storage | 10 GB free space |
   | OS | Windows 10 64-bit |

2. **Verify game files** - Launcher > Settings > Verify Game Files

3. **Check crash logs:**
   ```
   %APPDATA%\Hytale\logs\latest.log
   ```

4. **Update Windows** - Ensure you have the latest Windows updates

## Graphics Issues

### Black Screen

**Symptoms:** Game launches but shows only a black screen, no menu visible.

**Solutions:**

1. **Update GPU drivers** (see links above)
2. **Try windowed mode** - Edit config file:
   ```
   %APPDATA%\Hytale\config\settings.json
   ```
   Set `"fullscreen": false`
3. **Disable GPU overclock** if using MSI Afterburner or similar
4. **Try integrated graphics** (for laptops with dual GPUs)

### Missing Textures

**Symptoms:** Purple/black checkerboard textures, invisible blocks or items.

**Solutions:**

1. **Verify game files** - Launcher > Settings > Verify Game Files
2. **Clear shader cache:**
   ```
   Delete: %APPDATA%\Hytale\cache\shaders\
   ```
3. **Reinstall the game** if verification doesn't help

### Visual Artifacts / Glitches

**Symptoms:** Strange colors, flickering, screen tearing, corruption.

**Solutions:**

1. **Disable overlay applications:**
   - Discord Overlay: User Settings > Game Overlay (OFF)
   - GeForce Experience: Settings > In-Game Overlay (OFF)
   - Xbox Game Bar: Windows Settings > Gaming > Xbox Game Bar (OFF)

2. **Disable anti-aliasing** in Hytale graphics settings

3. **Check GPU temperature** - Overheating can cause artifacts (use HWiNFO or GPU-Z)

## Multiplayer Issues

### Cannot Join Server

**Symptoms:** "Connection timed out", "Unable to connect", server not responding.

**Solutions:**

1. **Check firewall settings:**
   - Allow Hytale through Windows Firewall
   - Open UDP port **5520** (default Hytale port)

2. **Verify server address** - Ensure IP and port are correct

3. **Try direct IP connection** instead of hostname

4. **Check if server is online** - Contact server administrator

```
Windows Firewall command (Run as Administrator):
netsh advfirewall firewall add rule name="Hytale" dir=in action=allow protocol=UDP localport=5520
```

### Frequent Disconnections

**Symptoms:** Randomly kicked from servers, "Connection lost" messages.

**Solutions:**

1. **Check your internet stability** - Run a ping test:
   ```bash
   ping -t google.com
   ```
   Look for packet loss or high latency spikes

2. **Use wired connection** instead of WiFi if possible

3. **Server may be overloaded** - Try again later or contact admin

4. **Disable bandwidth-heavy applications** - Streaming, downloads, etc.

### High Latency in Multiplayer

**Symptoms:** Delayed actions, rubber-banding, other players teleporting.

**Solutions:**

1. **Choose a geographically closer server** - Lower ping = better experience

2. **Check server's player count** - Overloaded servers have higher latency

3. **Close bandwidth-consuming applications**

4. **Contact your ISP** if latency is consistently high to all servers

## Server Hosting Issues

### Server Won't Start

**Symptoms:** Server executable crashes, shows errors, or closes immediately.

**Solutions:**

1. **Verify Java 25 installation:**
   ```bash
   java -version
   ```

2. **Check port availability:**
   ```bash
   # Windows
   netstat -an | findstr 5520
   ```

3. **Allocate sufficient RAM:**
   ```bash
   java -Xmx4G -Xms4G -jar hytale-server.jar
   ```

4. **Check server logs:**
   ```
   /server/logs/latest.log
   ```

### Players Cannot Connect

**Symptoms:** Server runs but players get connection errors.

**Solutions:**

1. **Configure port forwarding** on your router:
   - Protocol: UDP
   - Port: 5520 (or your custom port)
   - Forward to: Your server's local IP

2. **Check firewall:**
   ```bash
   # Windows (Run as Administrator)
   netsh advfirewall firewall add rule name="Hytale Server" dir=in action=allow protocol=UDP localport=5520
   ```

3. **Share correct external IP** - Find at [whatismyip.com](https://whatismyip.com)

4. **For cloud hosting** - Configure security group/firewall rules

### Server Crashes

**Symptoms:** Server stops unexpectedly, out of memory errors.

**Solutions:**

1. **Increase allocated RAM:**
   ```bash
   java -Xmx8G -Xms4G -jar hytale-server.jar
   ```
   Minimum recommended: 4GB for small servers

2. **Check for problematic plugins** - Remove recently added plugins

3. **Monitor resource usage** - Use Task Manager or htop

4. **Review crash logs** for specific error messages

## Mod / Plugin Issues

### Mod Not Working

**Symptoms:** Custom content doesn't appear, mod features unavailable.

**Solutions:**

1. **Check version compatibility** - Mod must match server version
2. **Verify mod placement:**
   ```
   /server/mods/your-mod.jar
   /server/packs/your-pack/
   ```
3. **Check server console** for error messages
4. **Review mod documentation** for specific requirements

### Crash With Mods Installed

**Symptoms:** Server or game crashes when mods are loaded.

**Solutions:**

1. **Identify problematic mod:**
   - Remove all mods
   - Add them back one by one
   - Test after each addition

2. **Check for mod conflicts** - Some mods are incompatible

3. **Update mods** to latest versions

4. **Report to mod author** with crash log

## Early Access Limitations

:::info Expected in Early Access
The following limitations are known and expected during Early Access:
:::

| Limitation | Status |
|------------|--------|
| **Adventure Mode** | Not available at launch |
| **Mac / Linux Support** | Coming later |
| **Complete Modding Documentation** | In progress |
| **Some Visual Bugs** | Expected and being fixed |
| **Server Stability** | Improvements ongoing |
| **Content Gaps** | More content coming in updates |

## How to Report a Bug

If you encounter an issue not listed here:

### Official Support Channels

1. **Official Support Portal:** [support.hytale.com](https://support.hytale.com)
2. **Official Hytale Discord:** [discord.gg/hytale](https://discord.gg/hytale) - #bug-reports channel
3. **Community Forums:** Check if issue is already reported

### What to Include in Bug Reports

- Hytale version number
- Operating system and version
- GPU model and driver version
- Steps to reproduce the issue
- Crash logs (if applicable)
- Screenshots or video

```
Crash log location:
%APPDATA%\Hytale\logs\latest.log
```

## Useful Resources

### Official Links

- [Hytale Official Website](https://hytale.com)
- [Hytale Support](https://support.hytale.com)
- [Hytale Status Page](https://status.hytale.com)
- [Official Discord](https://discord.gg/hytale)

### System Requirements Reference

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Windows 10 64-bit | Windows 11 |
| **CPU** | Intel i5-4460 / AMD FX-6300 | Intel i7-8700 / AMD Ryzen 5 3600 |
| **RAM** | 8 GB | 16 GB |
| **GPU** | NVIDIA GTX 960 / AMD R9 280 | NVIDIA RTX 2060 / AMD RX 5700 |
| **Storage** | 10 GB HDD | 50 GB SSD |
| **Network** | Broadband connection | Low-latency connection |

### Quick Checklist

Before contacting support, verify:

- [ ] Java 25 installed (for servers/plugins)
- [ ] GPU drivers updated
- [ ] Game files verified
- [ ] Firewall configured (port UDP 5520)
- [ ] Sufficient RAM allocated
- [ ] No conflicting overlay software
- [ ] Antivirus exceptions added
