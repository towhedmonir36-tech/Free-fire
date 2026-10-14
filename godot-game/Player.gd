extends CharacterBody3D
class_name BattlePlayer

signal health_changed(value: float)
signal ammo_changed(value: int, reserve: int)

const SPEED := 7.0
const MAX_HEALTH := 100.0
const MAGAZINE_SIZE := 30
const DAMAGE := 34.0
const FIRE_INTERVAL := 0.22
const RELOAD_TIME := 1.1

var health := MAX_HEALTH
var ammo := MAGAZINE_SIZE
var reserve_ammo := 120
var fire_timer := 0.0
var reloading := false
var reload_timer := 0.0
var touch_dirs: Dictionary = {}
var touch_look := Vector2.ZERO

var camera: Camera3D
var gun_mesh: MeshInstance3D

func _ready() -> void:
    _make_player_visuals()
    health_changed.emit(health)
    ammo_changed.emit(ammo, reserve_ammo)

func _make_player_visuals() -> void:
    var collision := CollisionShape3D.new()
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.42
    capsule.height = 1.8
    collision.shape = capsule
    collision.position.y = 0.9
    add_child(collision)

    var body := MeshInstance3D.new()
    var body_mesh := CapsuleMesh.new()
    body_mesh.radius = 0.42
    body_mesh.height = 1.8
    body.mesh = body_mesh
    body.position.y = 0.9
    var body_mat := StandardMaterial3D.new()
    body_mat.albedo_color = Color(0.12, 0.28, 0.82)
    body.material_override = body_mat
    add_child(body)

    var spring := SpringArm3D.new()
    spring.name = "CameraArm"
    spring.spring_length = 6.5
    spring.position = Vector3(0, 2.8, 0)
    spring.rotation_degrees.x = -12.0
    add_child(spring)

    camera = Camera3D.new()
    camera.current = true
    camera.fov = 72.0
    spring.add_child(camera)

    var gun := MeshInstance3D.new()
    var gun_mesh_resource := BoxMesh.new()
    gun_mesh_resource.size = Vector3(0.18, 0.18, 0.85)
    gun.mesh = gun_mesh_resource
    gun.position = Vector3(0.48, 1.35, -0.5)
    var gun_mat := StandardMaterial3D.new()
    gun_mat.albedo_color = Color(0.12, 0.12, 0.14)
    gun.material_override = gun_mat
    add_child(gun)
    gun_mesh = gun

func set_touch_direction(direction: String, is_pressed: bool) -> void:
    touch_dirs[direction] = is_pressed

func move_input() -> Vector2:
    var v := Vector2.ZERO
    if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT) or touch_dirs.get("left", false):
        v.x -= 1.0
    if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT) or touch_dirs.get("right", false):
        v.x += 1.0
    if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP) or touch_dirs.get("forward", false):
        v.y += 1.0
    if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN) or touch_dirs.get("back", false):
        v.y -= 1.0
    return v.normalized()

func _physics_process(delta: float) -> void:
    fire_timer = maxf(0.0, fire_timer - delta)
    if reloading:
        reload_timer -= delta
        if reload_timer <= 0.0:
            var needed := MAGAZINE_SIZE - ammo
            var loaded: int = mini(needed, reserve_ammo)
            ammo += loaded
            reserve_ammo -= loaded
            reloading = false
            ammo_changed.emit(ammo, reserve_ammo)

    var input_vec := move_input()
    var forward := -global_transform.basis.z
    var right := global_transform.basis.x
    var direction := (right * input_vec.x + forward * input_vec.y)
    direction.y = 0.0
    direction = direction.normalized()

    velocity.x = direction.x * SPEED
    velocity.z = direction.z * SPEED
    if not is_on_floor():
        velocity.y -= 9.8 * delta
    else:
        velocity.y = -0.1
    move_and_slide()

    # Rotate toward movement direction for an easy mobile-friendly control scheme.
    if direction.length() > 0.1:
        var target_yaw := atan2(-direction.x, -direction.z)
        rotation.y = lerp_angle(rotation.y, target_yaw, minf(1.0, delta * 8.0))

    if Input.is_action_just_pressed("fire") or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
        fire()
    if Input.is_action_just_pressed("reload") or Input.is_key_pressed(KEY_R):
        start_reload()

func fire() -> void:
    if reloading or fire_timer > 0.0 or ammo <= 0:
        return
    fire_timer = FIRE_INTERVAL
    ammo -= 1
    ammo_changed.emit(ammo, reserve_ammo)
    var from := camera.global_position
    var to := from + (-camera.global_transform.basis.z * 100.0)
    var query := PhysicsRayQueryParameters3D.create(from, to)
    query.exclude = [get_rid()]
    var hit := get_world_3d().direct_space_state.intersect_ray(query)
    if not hit.is_empty():
        var target = hit.get("collider")
        if target and target.has_method("take_bullet_damage"):
            target.take_bullet_damage(DAMAGE)

func start_reload() -> void:
    if reloading or ammo >= MAGAZINE_SIZE or reserve_ammo <= 0:
        return
    reloading = true
    reload_timer = RELOAD_TIME

func take_enemy_damage(amount: float) -> void:
    health = maxf(0.0, health - amount)
    health_changed.emit(health)
