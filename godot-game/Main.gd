extends Node3D

const PLAYER_SCRIPT = preload("res://Player.gd")
const ENEMY_SCRIPT = preload("res://Enemy.gd")

var player: CharacterBody3D
var enemies_left := 5
var game_over := false
var hp_label: Label
var ammo_label: Label
var status_label: Label
var fire_button: Button
var move_buttons: Dictionary = {}

func _ready() -> void:
    _make_world()
    _spawn_player()
    _spawn_enemies()
    _make_hud()

func _make_world() -> void:
    var environment := WorldEnvironment.new()
    var env := Environment.new()
    env.background_mode = Environment.BG_SKY
    env.sky = Sky.new()
    env.sky.sky_material = ProceduralSkyMaterial.new()
    env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    env.ambient_light_color = Color(0.72, 0.78, 0.85)
    env.ambient_light_energy = 0.8
    environment.environment = env
    add_child(environment)

    var sun := DirectionalLight3D.new()
    sun.rotation_degrees = Vector3(-50, -25, 0)
    sun.light_energy = 1.2
    add_child(sun)

    var floor_body := StaticBody3D.new()
    floor_body.name = "Ground"
    var floor_shape := CollisionShape3D.new()
    var box_shape := BoxShape3D.new()
    box_shape.size = Vector3(80, 1, 80)
    floor_shape.shape = box_shape
    floor_shape.position.y = -0.5
    floor_body.add_child(floor_shape)

    var floor_mesh := MeshInstance3D.new()
    var plane := BoxMesh.new()
    plane.size = Vector3(80, 1, 80)
    floor_mesh.mesh = plane
    floor_mesh.position.y = -0.5
    var ground_mat := StandardMaterial3D.new()
    ground_mat.albedo_color = Color(0.25, 0.42, 0.22)
    floor_mesh.material_override = ground_mat
    floor_body.add_child(floor_mesh)
    add_child(floor_body)

    # Simple cover blocks make the test arena feel like a small battle map.
    for p in [Vector3(5, 0, -5), Vector3(-6, 0, -7), Vector3(8, 0, 6), Vector3(-9, 0, 4)]:
        var cover := StaticBody3D.new()
        var shape_node := CollisionShape3D.new()
        var shape := BoxShape3D.new()
        shape.size = Vector3(2.0, 1.8, 2.0)
        shape_node.shape = shape
        shape_node.position.y = 0.9
        cover.add_child(shape_node)
        var cover_mesh := MeshInstance3D.new()
        var cube := BoxMesh.new()
        cube.size = Vector3(2.0, 1.8, 2.0)
        cover_mesh.mesh = cube
        cover_mesh.position.y = 0.9
        var mat := StandardMaterial3D.new()
        mat.albedo_color = Color(0.38, 0.31, 0.22)
        cover_mesh.material_override = mat
        cover.add_child(cover_mesh)
        cover.position = p
        add_child(cover)

func _spawn_player() -> void:
    player = PLAYER_SCRIPT.new()
    player.name = "Player"
    player.position = Vector3(0, 0.1, 10)
    add_child(player)
    player.health_changed.connect(_on_health_changed)
    player.ammo_changed.connect(_on_ammo_changed)

func _spawn_enemies() -> void:
    var positions := [
        Vector3(7, 0.1, -8), Vector3(-8, 0.1, -10),
        Vector3(14, 0.1, 4), Vector3(-14, 0.1, 2),
        Vector3(2, 0.1, -17)
    ]
    for p in positions:
        var enemy = ENEMY_SCRIPT.new()
        enemy.position = p
        enemy.player = player
        enemy.defeated.connect(_on_enemy_defeated)
        add_child(enemy)

func _make_hud() -> void:
    var canvas := CanvasLayer.new()
    add_child(canvas)

    hp_label = _label(canvas, "HP: 100", Vector2(20, 16), Vector2(220, 42), 24)
    ammo_label = _label(canvas, "Ammo: 30 / 120", Vector2(20, 56), Vector2(260, 38), 20)
    status_label = _label(canvas, "Enemies left: 5", Vector2(20, 94), Vector2(300, 38), 20)

    # Touch movement pad (hold a direction to move).
    _add_touch_button(canvas, "▲", Vector2(92, -188), Vector2(164, -118), "forward")
    _add_touch_button(canvas, "▼", Vector2(92, -108), Vector2(164, -38), "back")
    _add_touch_button(canvas, "◀", Vector2(18, -108), Vector2(90, -38), "left")
    _add_touch_button(canvas, "▶", Vector2(166, -108), Vector2(238, -38), "right")

    fire_button = Button.new()
    fire_button.text = "FIRE"
    fire_button.position = Vector2(-160, -120)
    fire_button.size = Vector2(130, 90)
    fire_button.anchor_left = 1.0
    fire_button.anchor_right = 1.0
    fire_button.anchor_top = 1.0
    fire_button.anchor_bottom = 1.0
    fire_button.add_theme_font_size_override("font_size", 24)
    fire_button.modulate = Color(1.0, 0.75, 0.72, 0.95)
    canvas.add_child(fire_button)
    fire_button.button_down.connect(_on_fire_pressed)

    var reload_button := Button.new()
    reload_button.text = "RELOAD"
    reload_button.position = Vector2(-150, -220)
    reload_button.size = Vector2(120, 54)
    reload_button.anchor_left = 1.0
    reload_button.anchor_right = 1.0
    reload_button.anchor_top = 1.0
    reload_button.anchor_bottom = 1.0
    canvas.add_child(reload_button)
    reload_button.pressed.connect(_on_reload_pressed)

func _label(parent: Node, text_value: String, pos: Vector2, size_value: Vector2, font_size: int) -> Label:
    var label := Label.new()
    label.text = text_value
    label.position = pos
    label.size = size_value
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", Color.WHITE)
    label.add_theme_color_override("font_shadow_color", Color.BLACK)
    label.add_theme_constant_override("shadow_offset_x", 2)
    label.add_theme_constant_override("shadow_offset_y", 2)
    parent.add_child(label)
    return label

func _add_touch_button(parent: Node, caption: String, pos: Vector2, end_pos: Vector2, direction: String) -> void:
    var button := Button.new()
    button.text = caption
    button.position = pos
    button.size = end_pos - pos
    button.anchor_top = 1.0
    button.anchor_bottom = 1.0
    button.add_theme_font_size_override("font_size", 24)
    button.modulate = Color(0.82, 0.9, 1.0, 0.8)
    parent.add_child(button)
    button.button_down.connect(func(): _set_direction(direction, true))
    button.button_up.connect(func(): _set_direction(direction, false))
    move_buttons[direction] = button

func _set_direction(direction: String, pressed: bool) -> void:
    if is_instance_valid(player):
        player.set_touch_direction(direction, pressed)

func _on_fire_pressed() -> void:
    if is_instance_valid(player) and not game_over:
        player.fire()

func _on_reload_pressed() -> void:
    if is_instance_valid(player) and not game_over:
        player.start_reload()

func _on_health_changed(value: float) -> void:
    if is_instance_valid(hp_label):
        hp_label.text = "HP: %d" % int(value)
    if value <= 0.0:
        _finish_game(false)

func _on_ammo_changed(value: int, reserve: int) -> void:
    if is_instance_valid(ammo_label):
        ammo_label.text = "Ammo: %d / %d" % [value, reserve]

func _on_enemy_defeated(_enemy: Node3D) -> void:
    enemies_left -= 1
    if is_instance_valid(status_label):
        status_label.text = "Enemies left: %d" % enemies_left
    if enemies_left <= 0:
        _finish_game(true)

func _finish_game(won: bool) -> void:
    if game_over:
        return
    game_over = true
    if is_instance_valid(status_label):
        status_label.text = "YOU WIN!" if won else "GAME OVER"
