# C++ Battle Royale Prototype

This is a small **3D shooter prototype** made with C++ and [raylib 5.5](https://www.raylib.com/). It is separate from the HTML/CSS/JavaScript browser version in the repository: this C++ version is a desktop application and does not run directly on GitHub Pages or in a normal mobile browser.

## Prototype features

- Basic third-person camera and player movement
- Six simple enemy targets that move toward the player
- Click-to-shoot hitscan weapon, ammo and reload
- Player health and enemy damage
- A shrinking safe-zone circle
- Win/lose screen

The player and enemies are placeholder shapes, not finished character models. This is a learning prototype, not a complete online battle royale game.

## Requirements

- A desktop computer (Windows, macOS or Linux)
- A C++17 compiler
- CMake 3.16 or newer
- Internet access on the first configure/build so CMake can download raylib

## Build on Windows, macOS or Linux

From a terminal, enter this folder and run:

```sh
cmake -S . -B build
cmake --build build --config Release
```

Run the resulting executable:

- **Windows (Visual Studio generator):** `build/Release/BattleRoyale.exe` (or `build/BattleRoyale.exe`, depending on generator)
- **Linux:** `./build/BattleRoyale`
- **macOS:** `./build/BattleRoyale`

If CMake cannot find a C++ compiler, install a compiler first (for example Visual Studio with the Desktop development with C++ workload on Windows, or Xcode Command Line Tools on macOS).

## Controls

- **W/A/S/D** or arrow keys: move
- **Left mouse click:** shoot toward the screen-centre crosshair
- **R:** reload

## Files

- `main.cpp` — game code
- `CMakeLists.txt` — build configuration; downloads raylib 5.5 during CMake configuration

## Next steps

A fuller game would need proper character/weapon assets, animations, better aiming and camera controls, collision and loot systems, audio, menus, mobile controls, and (for online play) authoritative multiplayer networking and servers. Use your own or properly licensed assets.
