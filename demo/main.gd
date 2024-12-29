extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	#gava_script_instance.start('javascript/main.js')
	var a: JSObject = gava_script_instance.run_script('const a = { "name": ()=> {return "kitty"}, "sea": 1}; a')
	print(a.name)
	print(a.name.call())
	print(a.sea)
	a.sea = 5
	print(a.sea)
