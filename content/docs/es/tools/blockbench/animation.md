---
id: animation
title: Animation Guide
sidebar_label: Animation
sidebar_position: 4
description: Create animations for Hytale models using Blockbench
---

# Animation Guide

Create animations for your Hytale models using Blockbench and export them as `.blockyanim` files.

## Getting Started

### Prerequisites

Before animating:
- Have a completed model with proper bone hierarchy
- Bones should have correct pivot points
- Follow Hytale's bone naming conventions

### Access Animation Mode

1. Open your model in Blockbench
2. Click the **Animate** tab at the top
3. The Timeline panel will appear at the bottom

## Creating Animations

### New Animation

1. In the Animation panel, click **Add Animation** (+)
2. Name your animation (e.g., `idle`, `walk`, `attack`)
3. Set animation properties:
   - **Loop Mode**: Once, Loop, or Hold
   - **Length**: Duration in seconds

### Setting Keyframes

Keyframes define bone positions at specific times:

1. Move the timeline scrubber to desired time
2. Select a bone in the Outliner
3. Transform the bone (rotate, move, scale)
4. A keyframe is automatically created

### Keyframe Types

| Type | Shortcut | Use |
|------|----------|-----|
| Rotation | R | Rotating bones |
| Position | G | Moving bones |
| Scale | S | Scaling bones |

## Animation Workflow

### Basic Workflow

1. **Plan** - Storyboard your animation
2. **Block out** - Set key poses at important frames
3. **Refine** - Add in-between keyframes
4. **Polish** - Adjust timing and curves
5. **Test** - Preview and iterate

### Creating a Walk Cycle

Example workflow for a walk animation:

1. Create new animation named `walk`
2. Set loop mode to **Loop**
3. Set length (e.g., 1 second)
4. Key frame 0: Contact pose (feet together)
5. Key frame 0.25s: Passing pose (one leg forward)
6. Key frame 0.5s: Contact pose (opposite)
7. Key frame 0.75s: Passing pose (other leg)
8. Ensure frame 1s matches frame 0 for seamless loop

## Graph Editor

Use the graph editor for smooth animations:

1. Select keyframes in the timeline
2. Open the Graph Editor panel
3. Adjust curves for easing:
   - **Linear** - Constant speed
   - **Smooth** - Ease in/out
   - **Bezier** - Custom curves

### Easing Tips

- Use ease-in for starting movements
- Use ease-out for stopping movements
- Combine for natural motion

## Animation Types

### Common Animations

| Animation | Description |
|-----------|-------------|
| `idle` | Standing still, breathing |
| `walk` | Normal movement |
| `run` | Fast movement |
| `attack` | Combat action |
| `hurt` | Taking damage |
| `death` | Dying animation |
| `jump` | Jumping motion |

### Looping vs One-Shot

- **Looping**: `idle`, `walk`, `run` - Continuous actions
- **One-shot**: `attack`, `death` - Single plays

## Exporting Animations

### Export as .blockyanim

1. Go to **File > Export > Hytale Animation**
2. Choose export location
3. Name your file
4. Click **Export**

### Export All Animations

To export multiple animations:
1. Each animation exports as separate `.blockyanim` file
2. Name animations consistently
3. Keep animations organized in folders

## Best Practices

1. **Start with idle** - It's the most-seen animation
2. **Keep movements smooth** - Avoid jerky transitions
3. **Test in-game frequently** - See how it actually looks
4. **Use reference** - Study real movement or other games
5. **12 principles** - Apply animation principles
6. **Consistent timing** - Match game's feel

## Common Issues

### Jerky Movement

- Add more keyframes between poses
- Use graph editor to smooth curves
- Check for conflicting keyframes

### Animation Doesn't Loop

- Ensure first and last frames match exactly
- Set loop mode to **Loop**
- Check that all bones return to start position

### Wrong Bone Moving

- Verify correct bone is selected
- Check bone hierarchy/parenting
- Ensure keyframes are on correct bone

### Pivot Point Issues

- Return to Edit mode
- Adjust pivot point position
- Re-test animation

## Tips for Quality

1. **Anticipation** - Small prep movement before action
2. **Follow-through** - Movement continues after action
3. **Squash and stretch** - Within Hytale's art style limits
4. **Secondary motion** - Hair, cloth, accessories
5. **Weight** - Heavy things move differently than light

## Next Steps

- [Asset Editor](/docs/tools/asset-editor/overview) - Configure animations in-game
- [Modeling Guide](/docs/tools/blockbench/modeling) - Create new models
