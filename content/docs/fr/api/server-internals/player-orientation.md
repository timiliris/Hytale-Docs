# Orientation et Rotation du Joueur

Ce guide explique comment récupérer l'orientation d'un joueur à partir de sa référence d'entité et la convertir en degrés ou en directions cardinales.

## Récupérer la Rotation depuis EntityRef

La rotation de la tête du joueur est stockée dans le composant `HeadRotation`. Les valeurs de rotation sont stockées en **radians**.

```java
// Obtenir le composant HeadRotation depuis la référence d'entité
HeadRotation headRotation = store.getComponent(ref, HeadRotation.getComponentType());

// Obtenir le vecteur de rotation (valeurs en RADIANS)
Vector3f rotation = headRotation.getRotation();

float pitch = rotation.getPitch();  // Rotation verticale (haut/bas)
float yaw = rotation.getYaw();      // Rotation horizontale (N/S/E/O)
float roll = rotation.getRoll();    // Rotation de roulis (inclinaison)
```

## Conversion en Degrés

Puisque les valeurs de rotation sont stockées en radians, utilisez `Math.toDegrees()` pour convertir :

```java
// Convertir les radians en degrés
double yawDegrees = Math.toDegrees(yaw);
double pitchDegrees = Math.toDegrees(pitch);

// Normaliser le yaw dans la plage 0-360
double normalizedYaw = (yawDegrees % 360 + 360) % 360;
```

### Plages de Rotation

| Axe | Plage (Radians) | Plage (Degrés) | Description |
|-----|-----------------|----------------|-------------|
| Yaw | 0 à 2π | 0° à 360° | Rotation horizontale complète |
| Pitch | -π/2 à π/2 | -90° à 90° | Regarder vers le bas à vers le haut |
| Roll | -π à π | -180° à 180° | Inclinaison latérale |

## Obtenir la Direction Cardinale (N/S/E/O)

### Méthode 1 : Utiliser getAxisDirection()

Le composant `HeadRotation` fournit une méthode qui retourne le vecteur de direction arrondi :

```java
// Retourne un Vector3i avec des valeurs de -1, 0 ou 1 par axe
Vector3i axisDirection = headRotation.getAxisDirection();

// Pour l'horizontal uniquement (ignore la rotation verticale)
Vector3i horizontalDir = headRotation.getHorizontalAxisDirection();
```

### Méthode 2 : Calcul Manuel depuis le Yaw

```java
public static String getCardinalDirection(float yawRadians) {
    double yawDegrees = Math.toDegrees(yawRadians);
    yawDegrees = (yawDegrees % 360 + 360) % 360; // Normaliser à 0-360

    if (yawDegrees >= 315 || yawDegrees < 45) {
        return "NORD";
    } else if (yawDegrees >= 45 && yawDegrees < 135) {
        return "OUEST";
    } else if (yawDegrees >= 135 && yawDegrees < 225) {
        return "SUD";
    } else {
        return "EST";
    }
}
```

### Méthode 3 : Huit Directions (avec intercardinaux)

```java
public static String getDirection8(float yawRadians) {
    double yawDegrees = Math.toDegrees(yawRadians);
    yawDegrees = (yawDegrees % 360 + 360) % 360;

    if (yawDegrees >= 337.5 || yawDegrees < 22.5) return "N";
    if (yawDegrees >= 22.5 && yawDegrees < 67.5) return "NO";
    if (yawDegrees >= 67.5 && yawDegrees < 112.5) return "O";
    if (yawDegrees >= 112.5 && yawDegrees < 157.5) return "SO";
    if (yawDegrees >= 157.5 && yawDegrees < 202.5) return "S";
    if (yawDegrees >= 202.5 && yawDegrees < 247.5) return "SE";
    if (yawDegrees >= 247.5 && yawDegrees < 292.5) return "E";
    return "NE";
}
```

## Système de Coordonnées

Hytale utilise le système de coordonnées suivant pour les directions :

| Direction | Axe | Valeur du Vecteur |
|-----------|-----|-------------------|
| NORD | Z- | (0, 0, -1) |
| SUD | Z+ | (0, 0, 1) |
| EST | X+ | (1, 0, 0) |
| OUEST | X- | (-1, 0, 0) |
| HAUT | Y+ | (0, 1, 0) |
| BAS | Y- | (0, -1, 0) |

## Obtenir un Vecteur de Direction Précis

Pour obtenir la direction exacte vers laquelle le joueur regarde sous forme de vecteur normalisé :

```java
// Obtenir le vecteur de direction normalisé
Vector3d lookDirection = headRotation.getDirection();

// La formule utilisée en interne :
// x = cos(pitch) * (-sin(yaw))
// y = sin(pitch)
// z = cos(pitch) * (-cos(yaw))
```

## Exemple Complet

```java
public void afficherOrientationJoueur(Store<EntityStore> store, Ref<EntityStore> playerRef) {
    // Obtenir les composants
    HeadRotation headRotation = store.getComponent(playerRef, HeadRotation.getComponentType());
    TransformComponent transform = store.getComponent(playerRef, TransformComponent.getComponentType());

    // Obtenir les valeurs de rotation
    Vector3f rotation = headRotation.getRotation();
    float yaw = rotation.getYaw();
    float pitch = rotation.getPitch();

    // Convertir en degrés
    double yawDegrees = Math.toDegrees(yaw);
    double pitchDegrees = Math.toDegrees(pitch);

    // Normaliser le yaw à 0-360
    yawDegrees = (yawDegrees % 360 + 360) % 360;

    // Obtenir la direction cardinale
    Vector3i cardinalDir = headRotation.getAxisDirection();
    String cardinal = getCardinalDirection(yaw);

    // Obtenir la direction précise du regard
    Vector3d lookDir = headRotation.getDirection();

    // Afficher les résultats
    System.out.println("Yaw: " + yawDegrees + "°");
    System.out.println("Pitch: " + pitchDegrees + "°");
    System.out.println("Cardinal: " + cardinal);
    System.out.println("Regarde vers: " + lookDir);
}
```

## Composants Associés

| Composant | Description |
|-----------|-------------|
| `HeadRotation` | Direction de la tête/du regard de l'entité |
| `TransformComponent` | Position et rotation du corps |
| `Transform` | Classe de données combinant position + rotation |
| `Direction` | Classe de protocole pour la sérialisation réseau (yaw, pitch, roll) |

## Énumérations de Direction

Hytale fournit plusieurs énumérations de direction pour différents cas d'utilisation :

### OrthogonalDirection (6 directions)
```java
public enum OrthogonalDirection {
    N, S, E, W, U, D  // Nord, Sud, Est, Ouest, Haut (Up), Bas (Down)
}
```

### MovementDirection (Relatif au joueur)
```java
public enum MovementDirection {
    None,           // Aucun
    Forward,        // Avant
    Back,           // Arrière
    Left,           // Gauche
    Right,          // Droite
    ForwardLeft,    // Avant-Gauche
    ForwardRight,   // Avant-Droite
    BackLeft,       // Arrière-Gauche
    BackRight       // Arrière-Droite
}
```

### PrefabRotation (incréments de 90°)
```java
public enum PrefabRotation {
    ROTATION_0,    // 0°
    ROTATION_90,   // 90°
    ROTATION_180,  // 180°
    ROTATION_270   // 270°
}
```

## Voir Aussi

- [Système de Composants d'Entité](./ecs.md)
- [Composant Transform](./ecs.md#transform)
- [Composant HeadRotation](./ecs.md#headrotation)
