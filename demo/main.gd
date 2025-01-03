extends Node2D

@onready var gava_script_instance: GavaScriptInstance = $GavaScriptInstance

class godot_object:
	var name = "hello"


# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	var gdobj = godot_object.new()
	print(gdobj.get("name"))
	var call = func(): return 1+1
	gava_script_instance.set_global("gdobj", call)
	gava_script_instance.run_script("console.log(Object.keys(globalThis))")
	var another_call: Callable = gava_script_instance.get_global("gdobj")
	print(another_call.call())
	
	#var get_obj = gava_script_instance.get_global("gdobj")
	#print(get_obj)
	#print(get_obj.name)
	#gava_script_instance.run_script("console.log(globalThis.gdobj.get('name'))")
	#var js_module: JSObject = gava_script_instance.start('jstest/main.js')
	#print(js_module)
	
	#var js_module: JSObject = gava_script_instance.run_script_in_module(
		#'globalThis.data = { "name": ()=> {return "kitty"}, "sea": "people moutain people sea"}'
	#)
	#var js_module: JSObject = gava_script_instance.run_script('const a = { "name": ()=> {return "kitty"}, "sea": 1}; a')
	#var js_whatever = gava_script_instance.get_global("game")
	#print(js_whatever)
	
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
