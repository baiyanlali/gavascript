extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	#var js_module: JSObject = gava_script_instance.start('javascript/main.js')
	#print(js_module)
	
	#var js_module: JSObject = gava_script_instance.run_script_in_module(
		#'export default { "name": ()=> {return "kitty"}, "sea": "people moutain people sea"}'
	#)
	var js_module: JSObject = gava_script_instance.run_script('const a = { "name": ()=> {return "kitty"}, "sea": 1}; a')
	print(js_module)
	
	#print(gava_script_instance.get_global("game"))
	#var a: JSObject = gava_script_instance.run_script('const a = { "name": ()=> {return "kitty"}, "sea": 1};')
	#print(gava_script_instance.get_global("a").name)
	#print(a.name)
	#print(a.name.call())
	#print(a.sea)
	#a.sea = func(): return 3
	#print(a.sea)
	#var c: Callable = a.sea
	#print(c.call())
	#print(a.sea.call())
	#gava_script_instance.run_script('console.log(a.sea.call())')
	#print(a.sea.call.call())
	#print(a.sea.call.call())
	#print(a.sea.call(1))
	#print(func(): return 1)
	#pass
