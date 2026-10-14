#include "raylib.h"
#include "raymath.h"

#include <algorithm>
#include <string>
#include <vector>

struct Enemy {
    Vector3 position;
    float health = 100.0f;
    bool alive = true;
};

int main() {
    const int screenWidth = 1280;
    const int screenHeight = 720;
    InitWindow(screenWidth, screenHeight, "Battle Royale C++ Prototype");
    SetTargetFPS(60);

    Vector3 player = {0.0f, 0.0f, 0.0f};
    float playerHealth = 100.0f;
    int ammo = 30;
    int reserveAmmo = 120;
    float shootCooldown = 0.0f;
    float damageCooldown = 0.0f;
    float zoneRadius = 28.0f;
    float zoneTimer = 0.0f;
    bool gameOver = false;
    bool won = false;

    std::vector<Enemy> enemies = {
        {{  8.0f, 0.0f,  -8.0f }},
        {{ -9.0f, 0.0f, -11.0f }},
        {{ 14.0f, 0.0f,   7.0f }},
        {{-15.0f, 0.0f,   5.0f }},
        {{  3.0f, 0.0f,  17.0f }},
        {{-20.0f, 0.0f, -14.0f }}
    };

    Camera3D camera = {};
    camera.position = {0.0f, 8.0f, 12.0f};
    camera.target = {0.0f, 1.0f, 0.0f};
    camera.up = {0.0f, 1.0f, 0.0f};
    camera.fovy = 60.0f;
    camera.projection = CAMERA_PERSPECTIVE;

    while (!WindowShouldClose()) {
        const float dt = GetFrameTime();

        if (!gameOver) {
            shootCooldown = std::max(0.0f, shootCooldown - dt);
            damageCooldown = std::max(0.0f, damageCooldown - dt);
            zoneTimer += dt;

            if (zoneTimer > 8.0f) {
                zoneTimer = 0.0f;
                zoneRadius = std::max(7.0f, zoneRadius - 2.0f);
            }

            Vector3 move = {0.0f, 0.0f, 0.0f};
            if (IsKeyDown(KEY_W) || IsKeyDown(KEY_UP))    move.z -= 1.0f;
            if (IsKeyDown(KEY_S) || IsKeyDown(KEY_DOWN))  move.z += 1.0f;
            if (IsKeyDown(KEY_A) || IsKeyDown(KEY_LEFT))  move.x -= 1.0f;
            if (IsKeyDown(KEY_D) || IsKeyDown(KEY_RIGHT)) move.x += 1.0f;

            if (Vector3Length(move) > 0.0f) {
                move = Vector3Normalize(move);
                player.x += move.x * 7.0f * dt;
                player.z += move.z * 7.0f * dt;
            }

            if (IsKeyPressed(KEY_R) && ammo < 30 && reserveAmmo > 0) {
                const int needed = 30 - ammo;
                const int loaded = std::min(needed, reserveAmmo);
                ammo += loaded;
                reserveAmmo -= loaded;
            }

            // Aim with the screen centre; click to fire a hitscan shot.
            if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT) &&
                shootCooldown <= 0.0f && ammo > 0) {
                Ray shotRay = GetScreenToWorldRay(
                    {(float)screenWidth / 2.0f, (float)screenHeight / 2.0f},
                    camera);
                ammo--;
                shootCooldown = 0.18f;

                for (Enemy& enemy : enemies) {
                    if (!enemy.alive) continue;
                    RayCollision hit = GetRayCollisionSphere(
                        shotRay, Vector3Add(enemy.position, Vector3{0.0f, 1.0f, 0.0f}), 0.85f);
                    if (hit.hit) {
                        enemy.health -= 50.0f;
                        if (enemy.health <= 0.0f) enemy.alive = false;
                        break;
                    }
                }
            }

            for (Enemy& enemy : enemies) {
                if (!enemy.alive) continue;
                Vector3 toPlayer = Vector3Subtract(player, enemy.position);
                const float distance = Vector3Length(toPlayer);
                if (distance > 1.8f) {
                    Vector3 direction = Vector3Normalize(toPlayer);
                    enemy.position = Vector3Add(
                        enemy.position, Vector3Scale(direction, 1.5f * dt));
                } else if (damageCooldown <= 0.0f) {
                    playerHealth -= 8.0f;
                    damageCooldown = 0.8f;
                }
            }

            if (Vector3Length({player.x, 0.0f, player.z}) > zoneRadius &&
                damageCooldown <= 0.0f) {
                playerHealth -= 5.0f;
                damageCooldown = 0.8f;
            }

            playerHealth = std::max(0.0f, playerHealth);
            const int aliveEnemies = (int)std::count_if(
                enemies.begin(), enemies.end(),
                [](const Enemy& enemy) { return enemy.alive; });

            if (playerHealth <= 0.0f) {
                gameOver = true;
                won = false;
            } else if (aliveEnemies == 0) {
                gameOver = true;
                won = true;
            }
        }

        // Follow the player from behind. This is a simple fixed third-person camera.
        camera.target = {player.x, player.y + 1.0f, player.z - 5.0f};
        camera.position = {player.x, player.y + 8.0f, player.z + 12.0f};

        BeginDrawing();
        ClearBackground(SKYBLUE);
        BeginMode3D(camera);

        DrawPlane({0.0f, -0.05f, 0.0f}, {100.0f, 100.0f}, Color{75, 130, 75, 255});
        DrawGrid(100, 1.0f);
        DrawCircle3D({0.0f, 0.02f, 0.0f}, zoneRadius,
                     {1.0f, 0.0f, 0.0f}, 90.0f, Fade(BLUE, 0.22f));
        DrawCircle3D({0.0f, 0.03f, 0.0f}, zoneRadius,
                     {1.0f, 0.0f, 0.0f}, 90.0f, BLUE);

        // Simple placeholder player model; replace with an animated 3D model later.
        DrawCapsule({player.x, 0.9f, player.z},
                    {player.x, 1.6f, player.z}, 0.42f, 8, 8, DARKBLUE);
        DrawSphere({player.x, 1.9f, player.z}, 0.28f, BEIGE);

        for (const Enemy& enemy : enemies) {
            if (!enemy.alive) continue;
            DrawCube({enemy.position.x, 1.0f, enemy.position.z}, 1.0f, 1.8f, 1.0f, RED);
            DrawCubeWires({enemy.position.x, 1.0f, enemy.position.z},
                          1.0f, 1.8f, 1.0f, MAROON);
        }

        EndMode3D();

        DrawRectangle(14, 14, 290, 100, Fade(BLACK, 0.58f));
        DrawText(TextFormat("HP: %i", (int)playerHealth), 28, 26, 22,
                 playerHealth > 30 ? GREEN : RED);
        DrawText(TextFormat("Ammo: %i / %i", ammo, reserveAmmo), 28, 55, 20, RAYWHITE);
        DrawText(TextFormat("Enemies left: %i",
            (int)std::count_if(enemies.begin(), enemies.end(),
                [](const Enemy& e) { return e.alive; })), 28, 82, 18, RAYWHITE);

        DrawText("WASD/Arrows: Move   Crosshair: Aim   Left click: Shoot   R: Reload",
                 18, screenHeight - 34, 18, RAYWHITE);
        DrawText(TextFormat("Safe zone radius: %i", (int)zoneRadius),
                 screenWidth - 250, 20, 18, DARKBLUE);

        // Centre-screen crosshair.
        DrawLine(screenWidth / 2 - 9, screenHeight / 2,
                 screenWidth / 2 + 9, screenHeight / 2, WHITE);
        DrawLine(screenWidth / 2, screenHeight / 2 - 9,
                 screenWidth / 2, screenHeight / 2 + 9, WHITE);

        if (gameOver) {
            DrawRectangle(0, 0, screenWidth, screenHeight, Fade(BLACK, 0.68f));
            const char* message = won ? "YOU WIN!" : "GAME OVER";
            DrawText(message, screenWidth / 2 - MeasureText(message, 54) / 2,
                     screenHeight / 2 - 45, 54, won ? LIME : RED);
            DrawText("Close the window and run again to restart.",
                     screenWidth / 2 - 190, screenHeight / 2 + 20, 20, RAYWHITE);
        }

        EndDrawing();
    }

    CloseWindow();
    return 0;
}
