extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	gava_script_instance.start('jstest/main.js')
	pass # Replace with function body.


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(delta: float) -> void:
	pass
