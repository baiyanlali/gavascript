extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	#gava_script_instance.start('javascript/main.js')
	var a: JSObject = gava_script_instance.run_script('const a = { "name": ()=> {return "kitty"}, "sea": 1}; a')
	print(a.name)
	print(a.name.call())
	print(a.sea)
	a.sea = func(): return 3
	print(a.sea)
	var c: Callable = a.sea
	print(c.call())
	print(a.sea.call())
	gava_script_instance.run_script('console.log(a.sea.call())')
	#print(a.sea.call.call())
	#print(a.sea.call.call())
	#print(a.sea.call(1))
	#print(func(): return 1)
	#pass
