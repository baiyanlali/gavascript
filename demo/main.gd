extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	#gava_script_instance.start('javascript/main.js')
	var a: JSFunction = gava_script_instance.run_script('const a = (c, d)=> {return c+d;}; a')
	print(a.call([1, 2]))
	print(a)
	pass # Replace with function body.
