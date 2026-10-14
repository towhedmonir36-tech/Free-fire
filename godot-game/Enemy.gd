extends CharacterBody3D
class_name BattleEnemy

signal defeated(enemy: Node3D)

var player: Node3D
var health := 100.0
var speed := 2.2
var attack_distance := 1.7
var attack_cooldown := 0.0
var dead := false

func _ready() -> void:
    var collision := CollisionShape3D.new()
    var capsule := CapsuleShape3D.new()
    capsule.radius = 0.42
    capsule.height = 1.8
    collision.shape = capsule
    collision.position.y = 0.9
    add_child(collision)

    var body := MeshInstance3D.new()
    var mesh := CapsuleMesh.new()
    mesh.radius = 0.42
    mesh.height = 1.8
    body.mesh = mesh
    body.position.y = 0.9
    var mat := StandardMaterial3D.new()
    mat.albedo_color = Color(0.8, 0.12, 0.1)
    body.material_override = mat
    add_child(body

    )

func _physics_process(delta: float) -> void:
    if dead or not is_instance_valid(player):
        return
    attack_cooldown = maxf(0.0, attack_cooldown - delta)
    var to_player := player.global_position - global_position
    to_player.y = 0.0
    var distance := to_player.length()

    if distance > attack_distance:
        var dir := to_player.normalized()
        velocity.x = dir.x * speed
        velocity.z = dir.z * speed
        if not is_on_floor():
            velocity.y -= 9.8 * delta
        else:
            velocity.y = -0.1
        move_and_slide()
        if dir.length() > 0.1:
            rotation.y = atan2(-dir.x, -dir.z)
    else:
        velocity.x = 0.0
        velocity.z = 0.0
        if attack_cooldown <= 0.0:
            attack_cooldown = 1.0
            if player.has_method("take_enemy_damage"):
                player.take_enemy_damage(8.0)

func take_bullet_damage(amount: float) -> void:
    if dead:
        return
    health -= amount
    if health <= 0.0:
        dead = true
        defeated.emit(self)
        queue_free()
