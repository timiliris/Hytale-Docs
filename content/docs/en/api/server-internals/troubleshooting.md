---
id: ui-troubleshooting
title: UI Troubleshooting
sidebar_label: Troubleshooting
sidebar_position: 9
description: Debugging guide for Hytale Custom UI errors (Red X, parser crashes, etc.)
---

# Hytale UI Troubleshooting Guide

This guide covers advanced debugging for Custom UI development, focusing on engine-specific quirks and common crash scenarios.

## 1. The "Unknown Node Type" Crash
**Error Log:**
`HytaleClient.Interface.UI.Markup.TextParser+TextParserException: Failed to parse file ... – Unknown node type: Image`

**Why it happens:**
The Hytale client parser in certain versions does not support the `<Image>` tag as a standalone element, or only supports it within specific parent containers.

**The Fix:**
Standardize your UI to use **Groups with Backgrounds** instead of Image nodes. This is functionally identical but parser-safe.

*   ❌ **Avoid:** `Image { TexturePath: "..."; }`
*   ✅ **Use:** `Group { Background: ( TexturePath: "..." ); }`

## 2. The "Failed to Apply CustomUI" Crash Loop
**Symptoms:**
*   Game stutters every X seconds.
*   Client eventually disconnects with "Failed to load CustomUI documents".
*   Console spam of packet errors.

**Why it happens:**
Your Java code is resending the entire UI file (`builder.append(...)`) on every update tick (e.g., inside a scheduled task). Relaoding the DOM repeatedly corrupts the client's UI state.

**The Fix:**
Implement the **Load-Update Separation Pattern**:
1.  **Initialize:** Send the structure once.
2.  **Update:** Send only variable changes using `update(false, builder)`.

## 3. The "Red X" (Asset Resolution Failure)
**Symptoms:**
*   UI loads physically but all textures are replaced by large red crosses.

**Why it happens:**
The client cannot find the file at the specified path. This is usually a pathing context issue.

**The Fix:**
1.  **Locality:** Move assets to a subfolder (e.g., `Assets/`) **directly inside** the folder containing your `.ui` file.
2.  **Relative Pathing:** Reference them simply as `"Assets/MyTexture.png"`.
3.  **Manifest:** Ensure `manifest.json` has `"IncludesAssetPack": true`.

## 4. Text Not Updating
**Symptoms:**
*   You call `builder.set("#ID.Text", "New Value")` but nothing changes on screen.

**Why it happens:**
*   Incorrect ID in the `.ui` file (IDs are case-sensitive!).
*   You are re-appending the file (which resets values) instead of updating it.

**The Fix:**
*   Verify exact ID match (`#Name` vs `#name`).
*   Ensure you are calling `this.update(false, builder)`.
