# Player Orientation & Rotation

This guide explains how to retrieve a player's orientation from their entity reference and convert it to degrees or cardinal directions.

## Getting Rotation from EntityRef

The player's head rotation is stored in the `HeadRotation` component. Rotation values are stored in **radians**.

```java
// Get the HeadRotation component from the entity reference
HeadRotation headRotation = store.getComponent(ref, HeadRotation.getComponentType());

// Get the rotation vector (values in RADIANS)
Vector3f rotation = headRotation.getRotation();

float pitch = rotation.getPitch();  // Vertical rotation (up/down)
float yaw = rotation.getYaw();      // Horizontal rotation (N/S/E/W)
float roll = rotation.getRoll();    // Roll rotation (tilt)
```

## Converting to Degrees

Since rotation values are stored in radians, use `Math.toDegrees()` to convert:

```java
// Convert radians to degrees
double yawDegrees = Math.toDegrees(yaw);
double pitchDegrees = Math.toDegrees(pitch);

// Normalize yaw to 0-360 range
double normalizedYaw = (yawDegrees % 360 + 360) % 360;
```

### Rotation Ranges

| Axis | Range (Radians) | Range (Degrees) | Description |
|------|-----------------|-----------------|-------------|
| Yaw | 0 to 2π | 0° to 360° | Full horizontal rotation |
| Pitch | -π/2 to π/2 | -90° to 90° | Looking down to up |
| Roll | -π to π | -180° to 180° | Sideways tilt |

## Getting Cardinal Direction (N/S/E/W)

### Method 1: Using getAxisDirection()

The `HeadRotation` component provides a method that returns the rounded direction vector:

```java
// Returns a Vector3i with values of -1, 0, or 1 per axis
Vector3i axisDirection = headRotation.getAxisDirection();

// For horizontal only (ignores vertical rotation)
Vector3i horizontalDir = headRotation.getHorizontalAxisDirection();
```

### Method 2: Manual Calculation from Yaw

```java
public static String getCardinalDirection(float yawRadians) {
    double yawDegrees = Math.toDegrees(yawRadians);
    yawDegrees = (yawDegrees % 360 + 360) % 360; // Normalize to 0-360

    if (yawDegrees >= 315 || yawDegrees < 45) {
        return "NORTH";
    } else if (yawDegrees >= 45 && yawDegrees < 135) {
        return "WEST";
    } else if (yawDegrees >= 135 && yawDegrees < 225) {
        return "SOUTH";
    } else {
        return "EAST";
    }
}
```

### Method 3: Eight-Direction (with intercardinals)

```java
public static String getDirection8(float yawRadians) {
    double yawDegrees = Math.toDegrees(yawRadians);
    yawDegrees = (yawDegrees % 360 + 360) % 360;

    if (yawDegrees >= 337.5 || yawDegrees < 22.5) return "N";
    if (yawDegrees >= 22.5 && yawDegrees < 67.5) return "NW";
    if (yawDegrees >= 67.5 && yawDegrees < 112.5) return "W";
    if (yawDegrees >= 112.5 && yawDegrees < 157.5) return "SW";
    if (yawDegrees >= 157.5 && yawDegrees < 202.5) return "S";
    if (yawDegrees >= 202.5 && yawDegrees < 247.5) return "SE";
    if (yawDegrees >= 247.5 && yawDegrees < 292.5) return "E";
    return "NE";
}
```

## Coordinate System

Hytale uses the following coordinate system for directions:

| Direction | Axis | Vector Value |
|-----------|------|--------------|
| NORTH | Z- | (0, 0, -1) |
| SOUTH | Z+ | (0, 0, 1) |
| EAST | X+ | (1, 0, 0) |
| WEST | X- | (-1, 0, 0) |
| UP | Y+ | (0, 1, 0) |
| DOWN | Y- | (0, -1, 0) |

## Getting a Precise Direction Vector

To get the exact direction the player is looking as a normalized vector:

```java
// Get normalized direction vector
Vector3d lookDirection = headRotation.getDirection();

// The formula used internally:
// x = cos(pitch) * (-sin(yaw))
// y = sin(pitch)
// z = cos(pitch) * (-cos(yaw))
```

## Complete Example

```java
public void displayPlayerOrientation(Store<EntityStore> store, Ref<EntityStore> playerRef) {
    // Get components
    HeadRotation headRotation = store.getComponent(playerRef, HeadRotation.getComponentType());
    TransformComponent transform = store.getComponent(playerRef, TransformComponent.getComponentType());

    // Get rotation values
    Vector3f rotation = headRotation.getRotation();
    float yaw = rotation.getYaw();
    float pitch = rotation.getPitch();

    // Convert to degrees
    double yawDegrees = Math.toDegrees(yaw);
    double pitchDegrees = Math.toDegrees(pitch);

    // Normalize yaw to 0-360
    yawDegrees = (yawDegrees % 360 + 360) % 360;

    // Get cardinal direction
    Vector3i cardinalDir = headRotation.getAxisDirection();
    String cardinal = getCardinalDirection(yaw);

    // Get precise look direction
    Vector3d lookDir = headRotation.getDirection();

    // Display results
    System.out.println("Yaw: " + yawDegrees + "°");
    System.out.println("Pitch: " + pitchDegrees + "°");
    System.out.println("Cardinal: " + cardinal);
    System.out.println("Looking at: " + lookDir);
}
```

## Related Components

| Component | Description |
|-----------|-------------|
| `HeadRotation` | Head/look direction of the entity |
| `TransformComponent` | Body position and rotation |
| `Transform` | Combined position + rotation data class |
| `Direction` | Protocol class for network serialization (yaw, pitch, roll) |

## Direction Enums

Hytale provides several direction enums for different use cases:

### OrthogonalDirection (6 directions)
```java
public enum OrthogonalDirection {
    N, S, E, W, U, D
}
```

### MovementDirection (Relative to player)
```java
public enum MovementDirection {
    None, Forward, Back, Left, Right,
    ForwardLeft, ForwardRight, BackLeft, BackRight
}
```

### PrefabRotation (90° increments)
```java
public enum PrefabRotation {
    ROTATION_0,    // 0°
    ROTATION_90,   // 90°
    ROTATION_180,  // 180°
    ROTATION_270   // 270°
}
```

## See Also

- [Entity Component System](./ecs.md)
- [Transform Component](./ecs.md#transform)
- [HeadRotation Component](./ecs.md#headrotation)
