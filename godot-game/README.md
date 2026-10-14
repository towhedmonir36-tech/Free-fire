# Offline Battle Mobile — Godot prototype

This is a small, offline 3D shooting-game prototype intended as a starting point for Android development. It uses Godot 4.x and GDScript, which is much more practical to edit on an Android phone than a full Unreal Engine C++ project.

## Included
- 3D third-person player with a follow camera
- Touch movement buttons
- Fire and reload buttons
- Five basic enemy bots that chase and damage the player
- Health, ammo and win/lose status
- Simple arena with cover blocks

This is a prototype using simple shapes, not a complete Free Fire clone. It has not been compiled or tested on a physical Android device yet.

## Open on Android
1. Install the official Godot Android Editor from https://godotengine.org/download/android/.
2. Download this repository or copy the entire `godot-game` folder onto your phone.
3. In Godot Android Editor, import/open the folder containing `project.godot`.
4. Open the project and press Run.

If the editor reports a script or rendering error, use the exact error message to troubleshoot. Godot editor features and Android export options can vary by version and device.

## Desktop build
You can also open this folder in Godot 4.x on a computer. For an installable Android APK, configure Android export templates and the Android SDK/JDK in Godot's export settings.

## Controls
- On-screen arrow buttons: move
- FIRE: shoot toward the camera crosshair
- RELOAD: refill magazine
- Keyboard/mouse input is available in the player script for testing

## Technical note
This project uses Godot's built-in 3D physics and ray casting. The player/enemy art is placeholder geometry. Future work: proper aiming/rotation controls, sound, weapon pickups, zone shrink, animation, better enemy pathfinding, and optimization.
