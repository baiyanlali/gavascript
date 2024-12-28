extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	#gava_script_instance.start('javascript/main.js')
	var a = gava_script_instance.run_script("12")
	#print(a)
	pass # Replace with function body.
