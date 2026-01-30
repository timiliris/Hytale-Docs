---
id: npc-system
title: NPC and AI System
sidebar_label: NPC and AI System
sidebar_position: 16
description: Complete documentation of the Hytale NPC system including AI behaviors, pathfinding, actions, sensors, and state machines
---

# NPC and AI System

The NPC (Non-Player Character) and AI System in Hytale provides a comprehensive behavior-driven framework for creating intelligent entities. This system uses a hierarchical state machine architecture combined with sensors, actions, and motions to control NPC behavior.

## Overview

The NPC system consists of several key components:

- **NPCPlugin** - The core plugin managing all NPC functionality
- **Role** - Defines NPC behavior, states, and capabilities
- **NPCEntity** - The entity component that links an entity to its role
- **Sensors** - Detect conditions and provide information
- **Actions** - Execute behaviors and state changes
- **Motions** - Control body and head movement
- **State Machine** - Manages NPC state transitions
- **Pathfinding** - A* based navigation system

## NPCPlugin

The `NPCPlugin` is the core plugin that manages the NPC system:

```java
package com.hypixel.hytale.server.npc;

public class NPCPlugin extends JavaPlugin {
    // Get the singleton instance
    public static NPCPlugin get();

    // Get NPC role index by name
    public int getIndex(String roleName);

    // Get NPC role by index
    public Role getRole(int roleIndex);

    // Spawn an NPC entity
    @Nullable
    public Pair<Ref<EntityStore>, NPCEntity> spawnEntity(
        Store<EntityStore> store,
        int roleIndex,
        Vector3d position,
        Vector3f rotation,
        Model spawnModel,
        TriConsumer<NPCEntity, Ref<EntityStore>, Store<EntityStore>> postSpawn
    );

    // Get builder factory for registering custom components
    public BuilderFactory getBuilderFactory();
}
```

**Source:** `com.hypixel.hytale.server.npc.NPCPlugin`

## NPCEntity Component

The `NPCEntity` component links an entity to its behavior role:

```java
package com.hypixel.hytale.server.npc.entities;

public class NPCEntity implements Component<EntityStore>, INonPlayerCharacter {
    // Get component type
    public static ComponentType<EntityStore, NPCEntity> getComponentType();

    // Get the current role
    public Role getRole();
    public String getRoleName();

    // Get spawn information
    public Instant getSpawnInstant();
    public void setSpawnInstant(Instant instant);

    // State management
    public void setState(Ref<EntityStore> ref, String state, String subState, Store<EntityStore> store);
    public void onFlockSetState(Ref<EntityStore> ref, String state, String subState, Store<EntityStore> store);

    // Lifecycle
    public void onSpawned(Ref<EntityStore> ref, Store<EntityStore> store);
    public void onRemove(Ref<EntityStore> ref, Store<EntityStore> store);

    // Update tick
    public void tick(Ref<EntityStore> ref, double dt, Store<EntityStore> store);
}
```

**Source:** `com.hypixel.hytale.server.npc.entities.NPCEntity`

## Role System

A **Role** defines an NPC's complete behavior profile including states, sensors, actions, and motions.

### Role Class

```java
package com.hypixel.hytale.server.npc.role;

public class Role {
    // Get role name
    public String getName();

    // Get state support for state machine operations
    public StateSupport getStateSupport();

    // Get world support for environmental queries
    public WorldSupport getWorldSupport();

    // Get navigation support for pathfinding
    public NavigationSupport getNavigationSupport();

    // Get motion controller
    public MotionController getMotionController();

    // Get entity slots (target tracking)
    public EntitySlots getEntitySlots();

    // Get timers for scheduled actions
    public Timers getTimers();

    // Get blackboard for data sharing
    public Blackboard getBlackboard();
}
```

### Role JSON Configuration

Roles are defined in JSON files at `NPC/Roles/`:

```json
{
    "Id": "Example_NPC",
    "Model": "npc/example_npc",
    "NPCGroups": ["Friendly", "Villager"],
    "StartState": "Idle",
    "StartSubState": "Default",
    "EntitySlots": {
        "Target": {
            "UpdateRate": 0.5,
            "Range": 20.0,
            "MaxCount": 1
        }
    },
    "MotionControllers": {
        "Walk": {
            "MaxSpeed": 4.0,
            "Acceleration": 20.0,
            "TurnSpeed": 180.0
        }
    },
    "States": {
        "Idle": {
            "SubStates": {
                "Default": {
                    "Instructions": [
                        {
                            "Sensors": ["SensorPlayerNearby"],
                            "Actions": ["ActionGreet"],
                            "BodyMotion": "BodyMotionIdle"
                        }
                    ]
                }
            }
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.role.Role`

## State Machine

The state machine is central to NPC behavior, managing states and sub-states.

### StateSupport Class

```java
package com.hypixel.hytale.server.npc.role.support;

public class StateSupport {
    public static final int NO_STATE = Integer.MIN_VALUE;

    // Check current state
    public boolean inState(int state);
    public boolean inSubState(int subState);
    public boolean inState(int state, int subState);
    public boolean inState(String state, String subState);

    // Get state information
    public String getStateName();
    public int getStateIndex();
    public int getSubStateIndex();

    // Set state
    public void setState(int state, int subState, boolean clearOnce, boolean skipTransition);
    public void setState(Ref<EntityStore> ref, String state, String subState, ComponentAccessor<EntityStore> accessor);
    public void setSubState(String subState);

    // Component-local state machines
    public boolean isComponentInState(int componentIndex, int targetState);
    public void setComponentState(int componentIndex, int targetState);

    // Busy states (prevents interactions)
    public boolean isInBusyState();

    // State transitions
    public StateTransitionController getStateTransitionController();
    public boolean runTransitionActions(Ref<EntityStore> ref, Role role, double dt, Store<EntityStore> store);
}
```

### State Configuration

States are defined within roles:

```json
{
    "States": {
        "Idle": {
            "BusySubStates": ["Interacting"],
            "SubStates": {
                "Default": {
                    "Instructions": []
                },
                "Interacting": {
                    "Instructions": []
                }
            }
        },
        "Chase": {
            "SubStates": {
                "Default": {
                    "Instructions": []
                }
            }
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.role.support.StateSupport`

## Instructions

Instructions define the behavior logic within states. Each instruction combines sensors, actions, and motions.

### Instruction Class

```java
package com.hypixel.hytale.server.npc.instructions;

public class Instruction {
    // Get sensor that triggers this instruction
    public Sensor getSensor();

    // Get actions to execute
    public ActionList getActions();

    // Get body motion
    public BodyMotion getBodyMotion();

    // Get head motion
    public HeadMotion getHeadMotion();

    // Execute this instruction
    public boolean evaluate(Ref<EntityStore> ref, Role role, double dt, Store<EntityStore> store);
}
```

### Instruction JSON Configuration

```json
{
    "Instructions": [
        {
            "Sensors": {
                "Type": "And",
                "Sensors": [
                    {"Type": "Player", "Range": 10.0, "Slot": "Target"},
                    {"Type": "Timer", "Name": "GreetCooldown", "Condition": "Finished"}
                ]
            },
            "Actions": [
                {"Type": "State", "State": "Greeting", "SubState": "Default"},
                {"Type": "TimerStart", "Name": "GreetCooldown", "Duration": 30.0}
            ],
            "BodyMotion": {"Type": "Nothing"},
            "HeadMotion": {"Type": "Watch", "Slot": "Target"}
        }
    ]
}
```

**Source:** `com.hypixel.hytale.server.npc.instructions.Instruction`

## Sensors

Sensors detect conditions and trigger instructions. They can also provide information to actions and motions.

### Sensor Interface

```java
package com.hypixel.hytale.server.npc.instructions;

public interface Sensor {
    // Check if sensor condition is met
    boolean matches(Ref<EntityStore> ref, Role role, double dt, Store<EntityStore> store);

    // Get information from this sensor
    InfoProvider getSensorInfo();

    // Register with role support systems
    void registerWithSupport(Role role);
}
```

### Core Sensor Types

| Sensor Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Entity` | Detects entities in range | `Range`, `Slot`, `Attitudes`, `NPCGroups` |
| `Player` | Detects players specifically | `Range`, `Slot`, `Attitudes` |
| `Target` | Checks if target slot is occupied | `Slot`, `Condition` |
| `State` | Checks current state | `State`, `SubState` |
| `Timer` | Checks timer status | `Name`, `Condition` |
| `Alarm` | Checks alarm status | `Name` |
| `Flag` | Checks flag value | `Name`, `Value` |
| `Nav` | Checks navigation status | `Condition` (AtDestination, HasPath, etc.) |
| `OnGround` | Checks if on ground | - |
| `InAir` | Checks if in air | - |
| `InWater` | Checks if in water | `MinDepth` |
| `Light` | Checks light level | `Type`, `Min`, `Max` |
| `Time` | Checks world time | `DayTimeRange`, `MoonPhaseRange` |
| `Block` | Detects blocks in range | `Range`, `BlockSet`, `Direction` |
| `Damage` | Detects damage received | `DamageSlot` |
| `HasInteracted` | Checks player interaction | - |
| `CanInteract` | Checks interaction possibility | `ViewCone`, `Attitudes` |
| `Age` | Checks NPC age | `MinAge`, `MaxAge` |
| `Kill` | Detects entity kills | `Slot` |

### Composite Sensors

| Sensor Type | Description |
|-------------|-------------|
| `And` | All child sensors must match |
| `Or` | Any child sensor must match |
| `Not` | Inverts child sensor result |
| `Any` | Matches any target that passes filter |
| `Many` | Matches multiple targets |
| `Switch` | Evaluates sensors in order, uses first match |
| `Random` | Random chance to match |

### Entity Sensor Configuration

```json
{
    "Type": "Entity",
    "Range": 15.0,
    "Slot": "Target",
    "GetPlayers": true,
    "GetNPCs": true,
    "ExcludeOwnType": false,
    "Attitudes": ["Hostile"],
    "Filter": {
        "Type": "And",
        "Filters": [
            {"Type": "LineOfSight"},
            {"Type": "ViewSector", "Angle": 120}
        ]
    },
    "Prioritiser": {
        "Type": "Attitude",
        "Priority": ["Hostile", "Neutral"]
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.instructions.Sensor`

## Actions

Actions execute behaviors and modify NPC state.

### Action Interface

```java
package com.hypixel.hytale.server.npc.instructions;

public interface Action {
    // Execute this action
    boolean execute(Ref<EntityStore> ref, Role role, InfoProvider sensorInfo, double dt, Store<EntityStore> store);

    // Called when action activates
    default void activate(Ref<EntityStore> ref, Role role, ComponentAccessor<EntityStore> accessor) {}

    // Called when action deactivates
    default void deactivate(Ref<EntityStore> ref, Role role, ComponentAccessor<EntityStore> accessor) {}
}
```

### Core Action Types

#### State Machine Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `State` | Change to a state | `State`, `SubState`, `ClearOnce` |
| `ParentState` | Return to parent state | - |
| `ToggleStateEvaluator` | Enable/disable state evaluator | `Enable` |

#### Timer Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `TimerStart` | Start a timer | `Name`, `Duration`, `DurationRange` |
| `TimerStop` | Stop a timer | `Name` |
| `TimerPause` | Pause a timer | `Name` |
| `TimerContinue` | Resume a timer | `Name` |
| `TimerRestart` | Restart a timer | `Name` |
| `TimerModify` | Modify timer duration | `Name`, `Amount` |
| `SetAlarm` | Set game time alarm | `Name`, `GameTime`, `RealTime` |

#### Entity Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `SetMarkedTarget` | Mark a target | `Slot`, `SourceSlot` |
| `ReleaseTarget` | Clear target slot | `Slot` |
| `Notify` | Send notification to entities | `Slot`, `Notification`, `Range` |
| `Beacon` | Activate/deactivate beacon | `BeaconName`, `Active` |
| `SetStat` | Modify entity stat | `Stat`, `Value`, `Operation` |
| `OverrideAttitude` | Override attitude toward entity | `Slot`, `Attitude`, `Duration` |
| `IgnoreForAvoidance` | Ignore entity for avoidance | `Slot`, `Duration` |

#### Lifecycle Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Spawn` | Spawn another NPC | `Role`, `Position`, `Rotation` |
| `Despawn` | Despawn this NPC | - |
| `DelayDespawn` | Schedule despawn | `Delay` |
| `Die` | Trigger death | `DamageCause` |
| `Remove` | Remove entity immediately | - |
| `Role` | Change role | `NewRole` |

#### Movement Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Crouch` | Toggle crouch | `Crouch` |
| `RecomputePath` | Force path recalculation | - |
| `OverrideAltitude` | Override flight altitude | `Altitude`, `Duration` |

#### World Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `PlaceBlock` | Place a block | `Block`, `Position` |
| `SetBlockToPlace` | Set block for placement | `Block` |
| `SetLeashPosition` | Set leash anchor | `Position`, `Radius` |
| `StorePosition` | Store position for later | `Name`, `Position` |
| `MakePath` | Create path definition | `PathName`, `Waypoints` |
| `ResetPath` | Clear current path | - |
| `TriggerSpawners` | Trigger nearby spawners | `Range` |

#### Interaction Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `SetInteractable` | Set interaction state | `Interactable`, `Hint`, `ShowPrompt` |
| `LockOnInteractionTarget` | Lock onto interacting player | - |

#### Item Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Inventory` | Modify inventory | `Operation`, `Item`, `Slot` |
| `DropItem` | Drop item | `Item`, `Slot`, `Velocity` |
| `PickUpItem` | Pick up item | `Slot` |

#### Combat Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Attack` | Perform attack | `Slot`, `DamageCalculator`, `Knockback` |
| `ApplyEntityEffect` | Apply effect to entity | `Slot`, `Effect`, `Duration` |

#### Audio/Visual Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `PlayAnimation` | Play animation | `Animation`, `BlendTime` |
| `PlaySound` | Play sound effect | `Sound`, `Volume`, `Pitch` |
| `SpawnParticles` | Spawn particles | `Particle`, `Count`, `Position` |
| `DisplayName` | Set display name | `Name`, `Visible` |
| `Appearance` | Change appearance | `Model`, `Skin` |
| `ModelAttachment` | Attach model | `Attachment`, `Bone` |

#### Utility Actions

| Action Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Nothing` | Do nothing | - |
| `Timeout` | Wait for duration | `Duration`, `DurationRange` |
| `Sequence` | Execute actions in sequence | `Actions` |
| `Random` | Execute random action | `Actions`, `Weights` |
| `SetFlag` | Set flag value | `Name`, `Value` |
| `ResetInstructions` | Reset instruction state | - |
| `Log` | Log debug message | `Message`, `Level` |

### Action List Configuration

```json
{
    "Actions": [
        {"Type": "State", "State": "Combat", "SubState": "Engaging"},
        {"Type": "TimerStart", "Name": "CombatTimer", "Duration": 60.0},
        {"Type": "PlaySound", "Sound": "npc/battle_cry"}
    ]
}
```

**Source:** `com.hypixel.hytale.server.npc.instructions.Action`

## Motions

Motions control NPC movement, divided into body motions (locomotion) and head motions (look direction).

### Motion Interface

```java
package com.hypixel.hytale.server.npc.instructions;

public interface Motion {
    // Compute steering for this motion
    boolean computeSteering(
        Ref<EntityStore> ref,
        Role role,
        InfoProvider provider,
        double dt,
        Steering steering,
        ComponentAccessor<EntityStore> accessor
    );

    // Called before steering computation
    default void preComputeSteering(Ref<EntityStore> ref, Role role, InfoProvider provider, Store<EntityStore> store) {}

    // Lifecycle
    default void activate(Ref<EntityStore> ref, Role role, ComponentAccessor<EntityStore> accessor) {}
    default void deactivate(Ref<EntityStore> ref, Role role, ComponentAccessor<EntityStore> accessor) {}
}
```

### Body Motion Types

| Motion Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Nothing` | No movement | - |
| `Find` | Navigate to target | `Slot`, `StopDistance`, `Speed` |
| `FindWithTarget` | Navigate while tracking target | `Slot`, `TargetSlot` |
| `Wander` | Random wandering | `Radius`, `Speed`, `Interval` |
| `WanderInCircle` | Circular wandering | `Radius`, `Center` |
| `WanderInRect` | Rectangular wandering | `Width`, `Height`, `Center` |
| `MoveAway` | Move away from target | `Slot`, `Distance`, `Speed` |
| `MaintainDistance` | Keep distance from target | `Slot`, `MinDistance`, `MaxDistance` |
| `Leave` | Leave current area | `Direction`, `Distance` |
| `Teleport` | Teleport to position | `Position`, `Rotation` |
| `TakeOff` | Start flying | `Altitude` |
| `Land` | Land from flight | - |
| `Path` | Follow path definition | `PathName`, `Loop` |
| `MatchLook` | Match target's look direction | `Slot` |
| `Timer` | Wait with optional movement | `Duration`, `Motion` |
| `Sequence` | Execute motions in sequence | `Motions` |
| `AimCharge` | Aim and charge attack | `Slot`, `ChargeTime` |

### Head Motion Types

| Motion Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Nothing` | No head movement | - |
| `Watch` | Watch a target | `Slot`, `Speed` |
| `Observe` | Look around environment | `Speed`, `Interval` |
| `Aim` | Aim at target | `Slot`, `LeadTarget` |
| `Timer` | Timed head motion | `Duration`, `Motion` |
| `Sequence` | Sequence of head motions | `Motions` |

### Motion Configuration

```json
{
    "BodyMotion": {
        "Type": "Find",
        "Slot": "Target",
        "StopDistance": 2.0,
        "Speed": 1.0,
        "PathSmoothing": 3
    },
    "HeadMotion": {
        "Type": "Watch",
        "Slot": "Target",
        "Speed": 180.0
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.instructions.Motion`

## Pathfinding System

The NPC system uses A* pathfinding for navigation.

### NavigationSupport

```java
package com.hypixel.hytale.server.npc.role.support;

public class NavigationSupport {
    // Pathfinding state
    public NavState getNavState();
    public boolean hasPath();
    public boolean isAtDestination();
    public boolean isMoving();
    public boolean isObstructed();

    // Path management
    public void setPath(IWaypoint firstWaypoint, Vector3d startPosition);
    public void clearPath();
    public void setForceRecomputePath(boolean force);

    // Path follower
    public PathFollower getPathFollower();

    // Destination
    public Vector3d getDestination();
    public double getDistanceToDestination();
}
```

### PathFollower Class

```java
package com.hypixel.hytale.server.npc.navigation;

public class PathFollower {
    // Current waypoint
    public IWaypoint getCurrentWaypoint();
    public Vector3d getCurrentWaypointPosition();
    public IWaypoint getNextWaypoint();

    // Path management
    public void setPath(IWaypoint firstWaypoint, Vector3d startPosition);
    public void clearPath();
    public boolean pathInFinalStage();

    // Path execution
    public void executePath(Vector3d currentPosition, MotionController controller, Steering steering);
    public boolean updateCurrentTarget(Vector3d entityPosition, MotionController controller);

    // Path smoothing
    public void setPathSmoothing(int smoothing);
    public void smoothPath(Ref<EntityStore> ref, Vector3d position, MotionController controller,
                          ProbeMoveData probeData, ComponentAccessor<EntityStore> accessor);

    // Configuration
    public void setRelativeSpeed(double speed);
    public void setWaypointRadius(double radius);
    public void setBlendHeading(double blend);
}
```

### NavState Enum

```java
package com.hypixel.hytale.server.npc.movement;

public enum NavState {
    IDLE,           // Not navigating
    MOVING,         // Moving along path
    AT_DESTINATION, // Reached destination
    OBSTRUCTED,     // Path blocked
    NO_PATH         // No valid path found
}
```

### A* Pathfinding Configuration

The pathfinding system can be configured per motion controller:

```json
{
    "MotionControllers": {
        "Walk": {
            "MaxSpeed": 5.0,
            "PathSmoothing": 4,
            "MaxClimbAngle": 45.0,
            "MaxSinkAngle": 60.0,
            "WaypointRadius": 0.5
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.navigation.PathFollower`

## Motion Controllers

Motion controllers handle the physics of NPC movement.

### MotionController Interface

```java
package com.hypixel.hytale.server.npc.movement.controllers;

public interface MotionController {
    // Type identification
    String getType();

    // Lifecycle
    void spawned();
    void activate();
    void deactivate();

    // Movement
    double steer(Ref<EntityStore> ref, Role role, Steering input, Steering output, double dt, ComponentAccessor<EntityStore> accessor);
    double probeMove(Ref<EntityStore> ref, Vector3d start, Vector3d end, ProbeMoveData data, ComponentAccessor<EntityStore> accessor);

    // State queries
    boolean canAct(Ref<EntityStore> ref, ComponentAccessor<EntityStore> accessor);
    boolean isInProgress();
    boolean isObstructed();
    boolean inAir();
    boolean inWater();
    boolean onGround();

    // Speed and movement
    double getMaximumSpeed();
    double getCurrentSpeed();
    double getCurrentTurnRadius();

    // Configuration
    float getMaxClimbAngle();
    float getMaxSinkAngle();
    double getGravity();
}
```

### Motion Controller Types

| Controller Type | Description | Key Parameters |
|-----------------|-------------|----------------|
| `Walk` | Ground-based movement | `MaxSpeed`, `Acceleration`, `TurnSpeed`, `JumpHeight` |
| `Fly` | Aerial movement | `MaxSpeed`, `Acceleration`, `AltitudeRange` |
| `Dive` | Underwater movement | `MaxSpeed`, `Acceleration`, `DiveSpeed` |

### Motion Controller Configuration

```json
{
    "MotionControllers": {
        "Walk": {
            "Type": "Walk",
            "MaxSpeed": 5.0,
            "Acceleration": 25.0,
            "Deceleration": 30.0,
            "TurnSpeed": 360.0,
            "JumpHeight": 1.2,
            "StepHeight": 0.6,
            "Gravity": 32.0,
            "MaxClimbAngle": 50.0,
            "MaxSinkAngle": 70.0
        },
        "Fly": {
            "Type": "Fly",
            "MaxSpeed": 8.0,
            "Acceleration": 15.0,
            "MinAltitude": 3.0,
            "MaxAltitude": 20.0,
            "DesiredAltitude": 8.0
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.movement.controllers.MotionController`

## Entity Slots

Entity slots track targets and other entities of interest.

### EntitySlots Class

```java
package com.hypixel.hytale.server.npc.role.support;

public class EntitySlots {
    // Get entity in slot
    public Ref<EntityStore> getEntity(String slotName);
    public Ref<EntityStore> getEntity(int slotIndex);

    // Set entity in slot
    public void setEntity(String slotName, Ref<EntityStore> entity);
    public void setEntity(int slotIndex, Ref<EntityStore> entity);

    // Clear slot
    public void clearSlot(String slotName);
    public void clearSlot(int slotIndex);

    // Check slot
    public boolean hasEntity(String slotName);
    public boolean hasEntity(int slotIndex);
}
```

### Entity Slot Configuration

```json
{
    "EntitySlots": {
        "Target": {
            "UpdateRate": 0.5,
            "Range": 20.0,
            "MaxCount": 1,
            "KeepDuration": 5.0
        },
        "Allies": {
            "UpdateRate": 1.0,
            "Range": 30.0,
            "MaxCount": 5,
            "Attitudes": ["Friendly"]
        },
        "DamageSource": {
            "UpdateRate": 0.0,
            "MaxCount": 1
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.role.support.EntitySlots`

## Entity Filters

Entity filters narrow down detected entities based on criteria.

### Filter Types

| Filter Type | Description | Key Parameters |
|-------------|-------------|----------------|
| `Attitude` | Filter by attitude | `Attitudes` |
| `NPCGroup` | Filter by NPC group | `Groups`, `Exclude` |
| `LineOfSight` | Require line of sight | `MaxDistance` |
| `ViewSector` | Within view angle | `Angle`, `Direction` |
| `HeightDifference` | Filter by height | `MinDiff`, `MaxDiff` |
| `Altitude` | Filter by altitude | `MinAltitude`, `MaxAltitude` |
| `Stat` | Filter by stat value | `Stat`, `Min`, `Max` |
| `MovementState` | Filter by movement | `State` |
| `Combat` | Filter by combat state | `InCombat` |
| `Inventory` | Filter by inventory | `HasItem`, `Item` |
| `ItemInHand` | Filter by held item | `Item`, `ItemTag` |
| `StandingOnBlock` | Filter by block | `Block`, `BlockSet` |
| `InsideBlock` | Filter if inside block | `Block`, `BlockSet` |
| `SpotsMe` | Filter if entity spots NPC | - |
| `And` | All filters must pass | `Filters` |
| `Or` | Any filter must pass | `Filters` |
| `Not` | Invert filter result | `Filter` |

### Filter Configuration

```json
{
    "Filter": {
        "Type": "And",
        "Filters": [
            {"Type": "LineOfSight"},
            {"Type": "Attitude", "Attitudes": ["Hostile", "Neutral"]},
            {"Type": "Not", "Filter": {"Type": "MovementState", "State": "CROUCHING"}}
        ]
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.corecomponents.IEntityFilter`

## Interaction System

The NPC system supports player interactions through the interaction system.

### Interaction Sensors

```json
{
    "Instructions": [
        {
            "Sensors": {
                "Type": "And",
                "Sensors": [
                    {"Type": "CanInteract", "ViewCone": 90, "Attitudes": ["Friendly"]},
                    {"Type": "HasInteracted"}
                ]
            },
            "Actions": [
                {"Type": "State", "State": "Talking"},
                {"Type": "LockOnInteractionTarget"}
            ]
        }
    ]
}
```

### Making NPCs Interactable

```json
{
    "States": {
        "Idle": {
            "SubStates": {
                "Default": {
                    "Instructions": [
                        {
                            "Sensors": {"Type": "Player", "Range": 5.0, "Slot": "InteractionTarget"},
                            "Actions": [
                                {"Type": "SetInteractable", "Interactable": true, "Hint": "Talk", "ShowPrompt": true}
                            ],
                            "HeadMotion": {"Type": "Watch", "Slot": "InteractionTarget"}
                        }
                    ]
                }
            }
        }
    }
}
```

**Source:** `com.hypixel.hytale.server.npc.corecomponents.interaction`

## Timers and Alarms

NPCs can use timers for delayed actions and alarms for scheduled events.

### Timer Configuration

```json
{
    "Timers": {
        "AttackCooldown": {"Duration": 2.0},
        "WanderInterval": {"DurationRange": [5.0, 15.0]},
        "DespawnTimer": {"Duration": 300.0}
    }
}
```

### Timer Actions

```json
{
    "Actions": [
        {"Type": "TimerStart", "Name": "AttackCooldown", "Duration": 2.0},
        {"Type": "TimerStart", "Name": "RandomTimer", "DurationRange": [1.0, 5.0]}
    ]
}
```

### Alarm Configuration (Game Time)

```json
{
    "Actions": [
        {"Type": "SetAlarm", "Name": "DawnAlarm", "GameTime": "PT6H"},
        {"Type": "SetAlarm", "Name": "NightAlarm", "GameTime": "PT20H"}
    ]
}
```

**Source:** `com.hypixel.hytale.server.npc.components.Timers`

## Spawning NPCs Programmatically

### Basic Spawning

```java
import com.hypixel.hytale.server.npc.NPCPlugin;
import com.hypixel.hytale.server.npc.entities.NPCEntity;
import it.unimi.dsi.fastutil.Pair;

public class NPCSpawnExample {

    public Pair<Ref<EntityStore>, NPCEntity> spawnNPC(
        Store<EntityStore> store,
        String roleName,
        Vector3d position,
        Vector3f rotation
    ) {
        NPCPlugin npcPlugin = NPCPlugin.get();
        int roleIndex = npcPlugin.getIndex(roleName);

        return npcPlugin.spawnEntity(
            store,
            roleIndex,
            position,
            rotation,
            null,  // Use default model
            null   // No post-spawn callback
        );
    }
}
```

### Spawning with Configuration

```java
public Pair<Ref<EntityStore>, NPCEntity> spawnConfiguredNPC(
    Store<EntityStore> store,
    String roleName,
    Vector3d position,
    Vector3f rotation,
    String initialState
) {
    NPCPlugin npcPlugin = NPCPlugin.get();
    int roleIndex = npcPlugin.getIndex(roleName);

    return npcPlugin.spawnEntity(
        store,
        roleIndex,
        position,
        rotation,
        null,
        (npc, ref, componentStore) -> {
            // Set initial state after spawn
            npc.getRole().getStateSupport().setState(
                ref, initialState, null, componentStore
            );

            // Set a timer
            npc.getRole().getTimers().startTimer("SpawnProtection", 5.0);
        }
    );
}
```

### Controlling NPC State

```java
public void setNPCState(
    Ref<EntityStore> npcRef,
    Store<EntityStore> store,
    String state,
    String subState
) {
    NPCEntity npcComponent = store.getComponent(npcRef, NPCEntity.getComponentType());
    if (npcComponent != null) {
        npcComponent.setState(npcRef, state, subState, store);
    }
}
```

## Console Commands

### NPC Commands

| Command | Description |
|---------|-------------|
| `/npc list` | List all loaded NPC roles |
| `/npc spawn <role>` | Spawn an NPC |
| `/npc info` | Show NPC information |
| `/npc state <state>` | Force NPC state change |
| `/npc kill` | Kill targeted NPC |
| `/npc remove` | Remove targeted NPC |
| `/npc debug` | Toggle NPC debug mode |

## Complete Role Example

Here is a complete example of an NPC role configuration:

```json
{
    "Id": "Village_Guard",
    "Model": "npc/village_guard",
    "NPCGroups": ["Friendly", "Humanoid", "Guard"],
    "StartState": "Patrol",
    "StartSubState": "Default",

    "EntitySlots": {
        "Target": {
            "UpdateRate": 0.25,
            "Range": 25.0,
            "MaxCount": 1
        },
        "Allies": {
            "UpdateRate": 1.0,
            "Range": 40.0,
            "MaxCount": 5
        }
    },

    "Timers": {
        "AttackCooldown": {"Duration": 1.5},
        "PatrolInterval": {"DurationRange": [10.0, 30.0]},
        "AlertCooldown": {"Duration": 60.0}
    },

    "MotionControllers": {
        "Walk": {
            "Type": "Walk",
            "MaxSpeed": 5.0,
            "Acceleration": 25.0,
            "TurnSpeed": 270.0,
            "JumpHeight": 1.2
        }
    },

    "States": {
        "Patrol": {
            "SubStates": {
                "Default": {
                    "Instructions": [
                        {
                            "Sensors": {
                                "Type": "Entity",
                                "Range": 20.0,
                                "Slot": "Target",
                                "Attitudes": ["Hostile"],
                                "Filter": {"Type": "LineOfSight"}
                            },
                            "Actions": [
                                {"Type": "State", "State": "Combat"},
                                {"Type": "Notify", "Range": 30.0, "Notification": "EnemySpotted"}
                            ]
                        },
                        {
                            "Sensors": {"Type": "Timer", "Name": "PatrolInterval", "Condition": "Finished"},
                            "Actions": [
                                {"Type": "TimerStart", "Name": "PatrolInterval"}
                            ],
                            "BodyMotion": {"Type": "Wander", "Radius": 15.0, "Speed": 0.5}
                        },
                        {
                            "Sensors": {"Type": "Always"},
                            "BodyMotion": {"Type": "Nothing"},
                            "HeadMotion": {"Type": "Observe", "Speed": 45.0}
                        }
                    ]
                }
            }
        },
        "Combat": {
            "BusySubStates": ["Attacking"],
            "SubStates": {
                "Default": {
                    "Instructions": [
                        {
                            "Sensors": {
                                "Type": "Not",
                                "Sensor": {"Type": "Target", "Slot": "Target", "Condition": "HasTarget"}
                            },
                            "Actions": [
                                {"Type": "State", "State": "Patrol"},
                                {"Type": "TimerStart", "Name": "AlertCooldown"}
                            ]
                        },
                        {
                            "Sensors": {
                                "Type": "And",
                                "Sensors": [
                                    {"Type": "Nav", "Condition": "AtDestination"},
                                    {"Type": "Timer", "Name": "AttackCooldown", "Condition": "Finished"}
                                ]
                            },
                            "Actions": [
                                {"Type": "State", "SubState": "Attacking"},
                                {"Type": "Attack", "Slot": "Target"},
                                {"Type": "TimerStart", "Name": "AttackCooldown"}
                            ]
                        },
                        {
                            "Sensors": {"Type": "Always"},
                            "BodyMotion": {"Type": "Find", "Slot": "Target", "StopDistance": 2.0, "Speed": 1.0},
                            "HeadMotion": {"Type": "Watch", "Slot": "Target"}
                        }
                    ]
                },
                "Attacking": {
                    "Instructions": [
                        {
                            "Sensors": {"Type": "Animation", "Condition": "Finished"},
                            "Actions": [{"Type": "State", "SubState": "Default"}]
                        }
                    ]
                }
            }
        }
    }
}
```

## Source Files

| Class | Path |
|-------|------|
| `NPCPlugin` | `com.hypixel.hytale.server.npc.NPCPlugin` |
| `NPCEntity` | `com.hypixel.hytale.server.npc.entities.NPCEntity` |
| `Role` | `com.hypixel.hytale.server.npc.role.Role` |
| `StateSupport` | `com.hypixel.hytale.server.npc.role.support.StateSupport` |
| `Instruction` | `com.hypixel.hytale.server.npc.instructions.Instruction` |
| `Sensor` | `com.hypixel.hytale.server.npc.instructions.Sensor` |
| `Action` | `com.hypixel.hytale.server.npc.instructions.Action` |
| `Motion` | `com.hypixel.hytale.server.npc.instructions.Motion` |
| `BodyMotion` | `com.hypixel.hytale.server.npc.instructions.BodyMotion` |
| `HeadMotion` | `com.hypixel.hytale.server.npc.instructions.HeadMotion` |
| `PathFollower` | `com.hypixel.hytale.server.npc.navigation.PathFollower` |
| `MotionController` | `com.hypixel.hytale.server.npc.movement.controllers.MotionController` |
| `MotionControllerWalk` | `com.hypixel.hytale.server.npc.movement.controllers.MotionControllerWalk` |
| `MotionControllerFly` | `com.hypixel.hytale.server.npc.movement.controllers.MotionControllerFly` |
| `MotionControllerDive` | `com.hypixel.hytale.server.npc.movement.controllers.MotionControllerDive` |
| `BuilderRole` | `com.hypixel.hytale.server.npc.role.builders.BuilderRole` |
| `ActionState` | `com.hypixel.hytale.server.npc.corecomponents.statemachine.ActionState` |
| `SensorEntity` | `com.hypixel.hytale.server.npc.corecomponents.entity.SensorEntity` |
| `SensorCanInteract` | `com.hypixel.hytale.server.npc.corecomponents.interaction.SensorCanInteract` |
